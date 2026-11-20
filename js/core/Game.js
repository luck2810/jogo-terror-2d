import { Enemy } from "../entities/Enemy.js";
import { Player } from "../entities/Player.js";
import { EventDirector } from "../systems/Events.js";
import { Interaction } from "../systems/Interaction.js";
import { Inventory } from "../systems/Inventory.js";
import { AudioEngine } from "../systems/Audio.js";
import { Save } from "../systems/Save.js";
import { GameMap } from "../world/Map.js";
import { Input } from "./Input.js";
import { Renderer } from "../render/Renderer.js";
import { Interface } from "../ui/Interface.js";

const NEW_FLAGS = () => ({ fuseInstalled: false, generatorPowered: false, frequencySolved: false, checkpointActivated: false });

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.input.bind();
    this.ui = new Interface();
    this.settings = Save.loadSettings().settings;
    this.audio = new AudioEngine(this.settings);
    this.map = new GameMap();
    this.player = new Player({ x: this.map.roomCenter("lobby").x - 86, y: this.map.roomCenter("lobby").y + 52 });
    this.enemy = new Enemy(this.map);
    this.enemyPrev = null;
    this.inventory = new Inventory();
    this.interaction = new Interaction();
    this.events = new EventDirector();
    this.flags = NEW_FLAGS();
    this.checkpoint = this.player.serialize();
    this.state = "title";
    this.objective = "Encontre a chave de serviço no saguão.";
    this.elapsed = 0;
    this.stepTimer = 0;
    this.saveTimer = 0;
    this.noiseEvents = [];
    this.wasPlayingBeforeBlur = false;
    this.lowBatteryWarned = false;
    this.enemyStepTimer = 0;
    this.heartTimer = 0;
    this.enemyPrev = null;
    document.body.classList.toggle("reduced-motion", Boolean(this.settings.reducedMotion));
    this.ui.connect(this);
    this.ui.showTitle(Save.exists());
    this.#bindGlobalControls();
    this.lastFrame = 0;
    this.raf = requestAnimationFrame((time) => this.#frame(time));
  }

  #bindGlobalControls() {
    document.getElementById("sound-toggle").addEventListener("click", () => this.toggleSound());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") {
        this.autosave();
        this.wasPlayingBeforeBlur = true;
        this.pause();
      } else if (!document.hidden && this.wasPlayingBeforeBlur && this.state === "paused") {
        this.wasPlayingBeforeBlur = false;
        this.ui.toast("O jogo está pausado. Toque em retomar para continuar.");
      }
    });
  }

  #frame(timestamp) {
    const dt = this.lastFrame ? Math.min(0.05, Math.max(0, (timestamp - this.lastFrame) / 1000)) : 0;
    this.lastFrame = timestamp;
    this.elapsed += dt; this.elapsedTime = this.elapsed;
    if (this.state === "playing" && !document.hidden) this.update(dt);
    else this.#handleIdleInput();
    this.renderer.reducedMotion = Boolean(this.settings.reducedMotion);
    this.renderer.render(this, this.elapsed);
    this.raf = requestAnimationFrame((time) => this.#frame(time));
  }

  /** Fora da partida: ESC fecha diálogo/retoma a pausa e comandos acumulados são descartados. */
  #handleIdleInput() {
    if (this.input.consume("pause")) {
      if (this.ui.modalOpen) this.ui.closeModal();
      else if (this.state === "paused") this.resume();
    }
    this.input.pressed.clear();
  }

  update(dt) {
    if (this.input.consume("pause")) {
      if (this.ui.modalOpen) this.ui.closeModal();
      else this.pause();
      return;
    }
    if (this.input.consume("inventory")) { this.openInventory(); return; }
    if (this.ui.modalOpen) {
      if (this.input.consume("interact")) this.ui.closeModal();
      return;
    }
    if (this.input.consume("flashlight")) {
      const on = this.player.toggleFlashlight();
      this.audio.play(on ? "click" : "error");
      if (!on) this.toast("A bateria da lanterna acabou.", "warning");
    }
    const movement = this.input.movement();
    const flashlightWasOn = this.player.flashlightOn;
    this.player.update(dt, movement, this.map);
    if (flashlightWasOn && !this.player.flashlightOn) { this.audio.play("error"); this.toast("A lanterna apagou: sem bateria.", "warning"); }
    if (this.player.battery < 20 && this.player.flashlightOn && !this.lowBatteryWarned) { this.lowBatteryWarned = true; this.toast("A luz da lanterna está falhando.", "warning"); }
    if (this.player.battery >= 25) this.lowBatteryWarned = false;
    if (movement.moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.audio.play("step");
        this.emitNoise(this.player, 150);
        this.stepTimer = 0.54;
      }
    }
    const target = this.interaction.update(this);
    if (this.input.consume("interact")) this.interaction.activate(this);
    this.enemy.update(dt, this);
    this.#updateEnemyAudio(dt);
    this.events.update(this, dt);
    this.noiseEvents = this.noiseEvents.filter((event) => this.elapsed - event.time < 1.5);
    if (this.player.health <= 0) { this.defeat(); return; }
    this.saveTimer += dt;
    if (this.saveTimer >= 8) { this.autosave(); this.saveTimer = 0; }
    this.ui.updateHUD(this.player, this.objective, this.map.getRoomName(this.player), target);
  }

  /** Passos posicionais (estéreo + volume por distância), batimento e tensão ambiente. */
  #updateEnemyAudio(dt) {
    const enemy = this.enemy; const player = this.player;
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    const moved = this.enemyPrev ? Math.hypot(enemy.x - this.enemyPrev.x, enemy.y - this.enemyPrev.y) : 0;
    this.enemyPrev = { x: enemy.x, y: enemy.y };
    const chasing = enemy.state === "chase";
    this.enemyStepTimer -= dt;
    if (moved > 0.05 && dist < 340 && this.enemyStepTimer <= 0) {
      this.audio.play("enemyStep", { volume: 1.2 * (1 - dist / 340), pan: (enemy.x - player.x) / 260 });
      this.enemyStepTimer = chasing ? 0.34 : 0.72;
    }
    this.heartTimer -= dt;
    if (chasing && this.heartTimer <= 0) { this.audio.play("heart"); this.heartTimer = 0.62; }
    this.audio.setTension(chasing ? 1 : Math.max(enemy.awareness, Math.max(0, 1 - dist / 420) * 0.5));
  }

  startNew() {
    Save.clear();
    this.map = new GameMap();
    this.inventory = new Inventory();
    this.flags = NEW_FLAGS();
    this.events = new EventDirector();
    this.player = new Player({ x: this.map.roomCenter("lobby").x - 86, y: this.map.roomCenter("lobby").y + 52 });
    this.enemy = new Enemy(this.map);
    this.enemyPrev = null;
    this.checkpoint = this.player.serialize();
    this.objective = "Encontre a chave de serviço no saguão.";
    this.elapsed = 0;
    this.stepTimer = 0;
    this.state = "playing";
    this.input.reset();
    this.audio.startAmbience();
    this.ui.layer.innerHTML = "";
    this.ui.closeModal();
    this.ui.hud.classList.remove("is-hidden");
    this.ui.setTouchActive(true);
    this.ui.toast("A Casa Salina está sem energia. Procure no balcão.");
    this.canvas.focus({ preventScroll: true });
    this.autosave();
  }

  continueGame() {
    const result = Save.load();
    if (!result.data) {
      this.ui.showTitle(false, result.error || "Não há salvamento válido. Inicie uma nova partida.");
      return;
    }
    const saved = result.data;
    this.map = new GameMap(saved.map);
    this.inventory = new Inventory(saved.inventory);
    this.flags = { ...NEW_FLAGS(), ...Object.fromEntries(Object.entries(saved.flags).filter(([key, value]) => ["fuseInstalled", "generatorPowered", "frequencySolved", "checkpointActivated"].includes(key) && typeof value === "boolean")) };
    this.events = new EventDirector(saved.events || []);
    this.checkpoint = saved.checkpoint || { ...saved.player };
    this.player = new Player(saved.player);
    const defeatedSave = this.player.health <= 0;
    if (defeatedSave) this.player = new Player({ ...this.checkpoint, health: Math.max(1, this.checkpoint.health || 1), flashlightOn: false });
    this.enemy = new Enemy(this.map, defeatedSave ? null : saved.enemy);
    this.enemyPrev = null;
    this.updateObjective();
    this.state = "playing";
    this.input.reset();
    this.audio.startAmbience();
    this.ui.layer.innerHTML = "";
    this.ui.hud.classList.remove("is-hidden");
    this.ui.setTouchActive(true);
    this.canvas.focus({ preventScroll: true });
    if (defeatedSave) this.ui.toast("Você voltou ao último ponto seguro.");
    if (!result.ok) this.ui.toast(result.error, "warning");
  }

  pause() {
    if (this.state !== "playing") return;
    this.autosave();
    this.state = "paused";
    this.input.reset();
    this.ui.showPause();
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.input.reset();
    this.ui.layer.innerHTML = "";
    this.ui.hud.classList.remove("is-hidden");
    this.ui.setTouchActive(true);
    this.canvas.focus({ preventScroll: true });
  }

  returnToTitle() {
    if (this.state === "playing" || this.state === "paused") this.autosave();
    this.state = "title";
    this.input.reset();
    this.ui.showTitle(Save.exists());
  }

  openInventory() {
    const docs = this.map.documents.filter((doc) => this.map.readDocuments.has(doc.id));
    this.ui.showInventory(this.inventory.list(), docs);
  }

  useItem(id) {
    if (!this.inventory.has(id)) return;
    if (id === "battery-cell") {
      if (this.player.battery >= 99) { this.toast("A bateria já está quase cheia."); return; }
      this.inventory.remove(id);
      this.player.rechargeBattery(45);
      this.audio.play("pickup");
      this.toast("A pilha recarrega a lanterna.");
    } else if (id === "med-kit") {
      if (this.player.health >= this.player.maxHealth) { this.toast("Você não precisa de curativo agora."); return; }
      this.inventory.remove(id);
      this.player.heal(1);
      this.audio.play("interact");
      this.toast("Você recupera um ponto de vida.");
    } else return;
    this.autosave();
  }

  updateSettings(changes, persist = false) {
    this.settings = { ...this.settings, ...changes };
    document.body.classList.toggle("reduced-motion", Boolean(this.settings.reducedMotion));
    this.audio.setVolumes(this.settings);
    if (persist) this.persistSettings();
  }

  persistSettings() {
    const result = Save.saveSettings(this.settings);
    if (!result.ok) this.toast(result.error, "warning");
  }

  async toggleSound() {
    await this.audio.resume();
    const enabled = this.audio.toggleMaster();
    this.ui.setAudioState(enabled);
    if (enabled) this.audio.startAmbience();
  }

  emitNoise(point, radius) {
    this.noiseEvents.push({ x: point.x, y: point.y, radius, time: this.elapsed });
    this.enemy?.hear(point, radius, this.map);
  }

  toast(message, kind) { this.ui.toast(message, kind); }

  updateObjective() {
    if (!this.inventory.has("service-key")) this.objective = "Procure uma chave no balcão do saguão.";
    else if (!this.inventory.has("fuse") && !this.flags.fuseInstalled) this.objective = "Abra a enfermaria e encontre um fusível.";
    else if (!this.inventory.has("archive-key") && !this.inventory.has("generator-key") && !this.flags.generatorPowered) this.objective = "Leia a ficha; depois procure a chave das máquinas no arquivo.";
    else if (!this.inventory.has("generator-key") && !this.flags.generatorPowered) this.objective = "Procure no arquivo a chave da casa de força.";
    else if (!this.flags.fuseInstalled) this.objective = "Instale o fusível no painel da casa de força.";
    else if (!this.flags.generatorPowered) this.objective = "Puxe a alavanca para religar o gerador.";
    else if (!this.flags.frequencySolved) this.objective = "Leia a anotação e ajuste o rádio para 87,6 MHz.";
    else this.objective = "Atravesse a porta de serviço e saia do sanatório.";
  }

  solveRadio(answer) {
    const normalized = String(answer).trim().replace(",", ".");
    if (!this.map.readDocuments.has("note-frequency")) {
      this.audio.play("error");
      this.toast("A frequência está escrita no caderno de manutenção.", "warning");
      return false;
    }
    if (Math.abs(Number(normalized) - 87.6) > 0.03) {
      this.audio.play("error");
      this.emitNoise(this.player, 75);
      this.toast("Só estática. Confira a anotação e tente outra vez.", "warning");
      return false;
    }
    this.flags.frequencySolved = true;
    this.audio.play("radio");
    this.emitNoise(this.player, 320);
    this.updateObjective();
    this.toast("O transmissor encontra a frequência. Uma luz acende junto à saída.");
    this.autosave();
    return true;
  }

  setCheckpoint(player, place = "casa de força") {
    this.checkpoint = player.serialize();
    this.checkpoint.health = Math.max(1, this.checkpoint.health);
    this.flags.checkpointActivated = true;
    this.toast(`Ponto seguro registrado: ${place}.`);
    this.autosave();
  }

  defeat() {
    if (this.state !== "playing") return;
    this.state = "dead";
    this.autosave();
    this.input.reset();
    this.ui.showDeath(() => this.respawnCheckpoint());
  }

  respawnCheckpoint() {
    this.player = new Player({ ...this.checkpoint, health: Math.max(1, this.checkpoint.health || 1), flashlightOn: false });
    this.enemy = new Enemy(this.map);
    const farthest = this.enemy.patrol.reduce((best, point) => (Math.hypot(point.x - this.player.x, point.y - this.player.y) > Math.hypot(best.x - this.player.x, best.y - this.player.y) ? point : best));
    this.enemy.x = farthest.x; this.enemy.y = farthest.y;   // renasce longe de você
    this.enemyPrev = null;
    this.state = "playing";
    this.ui.layer.innerHTML = "";
    this.ui.hud.classList.remove("is-hidden");
    this.ui.setTouchActive(true);
    this.input.reset();
    this.toast("Você voltou ao último ponto seguro.");
    this.updateObjective();
    this.autosave();
  }

  win() {
    if (!this.flags.frequencySolved) return;
    this.state = "won";
    this.audio.play("radio");
    Save.clear();
    this.ui.showVictory();
  }

  snapshot() {
    return {
      player: this.player.serialize(), inventory: this.inventory.serialize(), map: this.map.serialize(),
      flags: { ...this.flags }, checkpoint: this.checkpoint, enemy: this.enemy.serialize(), events: [...this.events.seen]
    };
  }

  autosave() {
    if (!this.player || !this.map || !this.inventory) return;
    const result = Save.save(this.snapshot());
    if (!result.ok) this.toast(result.error, "warning");
  }
}
