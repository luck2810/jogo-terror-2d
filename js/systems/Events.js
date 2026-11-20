/**
 * Diretor de eventos de terror: sustos ambientais e momentos roteirizados.
 * Não ataca o jogador; serve para tensão, pistas e atmosfera.
 * Eventos "uma vez" são lembrados (e salvos) pelo id.
 */
export class EventDirector {
  constructor(seen = []) {
    this.seen = new Set(seen);
    this.clock = 0;
    this.queue = [];
    this.ambientTimer = 40;
    this.blackout = 0;
    this.lastRoom = null;
  }

  once(id) {
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    return true;
  }

  later(delay, action) { this.queue.push({ at: this.clock + delay, action }); }

  update(game, dt) {
    this.clock += dt;
    this.blackout = Math.max(0, this.blackout - dt);
    for (const job of this.queue.filter((item) => item.at <= this.clock)) job.action();
    this.queue = this.queue.filter((item) => item.at > this.clock);

    const room = game.map.getRoomAt(game.player)?.id ?? null;
    if (room && room !== this.lastRoom) { this.lastRoom = room; this.onEnter(game, room); }

    if (game.enemy.state === "chase") return; // nunca empilha sustos durante a perseguição
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) { this.ambient(game); this.ambientTimer = 35 + Math.random() * 50; }
  }

  onEnter(game, room) {
    const side = () => (Math.random() < 0.5 ? -0.8 : 0.8);
    if (room === "hall" && this.once("knocks")) {
      const pan = side();
      [1.2, 1.9, 2.6].forEach((delay) => this.later(delay, () => game.audio.play("knock", { pan, volume: 1.1 })));
      this.later(3.1, () => game.toast("Três batidas, vindas de dentro da parede.", "warning"));
    } else if (room === "generator" && this.once("generator-whisper")) {
      this.later(1.5, () => { game.audio.play("whisper", { pan: side() }); this.flicker(0.7); });
    } else if (room === "kitchen" && this.once("kitchen-creak")) {
      this.later(1.0, () => game.audio.play("creak", { pan: side(), volume: 0.9 }));
    } else if (room === "radio" && this.once("radio-static")) {
      this.later(0.8, () => { game.audio.play("radio"); game.toast("O transmissor sussurra estática por baixo do chão.", "warning"); });
    } else if (room === "dorm" && this.once("dorm-quiet")) {
      this.later(0.6, () => game.toast("Aqui dentro, o ar está parado. A porta fechada ainda é a sua melhor defesa."));
    }
  }

  ambient(game) {
    const roll = Math.random();
    const pan = Math.random() < 0.5 ? -0.9 : 0.9;
    if (roll < 0.35) game.audio.play("door", { pan, volume: 0.55 });         // porta batendo ao longe
    else if (roll < 0.6) game.audio.play("creak", { pan, volume: 0.7 });
    else if (roll < 0.8) game.audio.play("whisper", { pan, volume: 0.6 });
    else this.flicker(0.55);                                                  // a luz falha por um instante
  }

  /** Falha rápida de luz (ignorada com "reduzir efeitos visuais"). */
  flicker(seconds) { this.blackout = Math.max(this.blackout, seconds); }
}
