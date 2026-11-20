const STORAGE_KEY = "sinal-de-cinza.save.v1";
const SETTINGS_KEY = "sinal-de-cinza.settings.v1";
const ITEM_IDS = new Set(["service-key", "fuse", "archive-key", "generator-key", "battery-cell", "med-kit"]);

function validPlayer(player) {
  return player && Number.isFinite(player.x) && Number.isFinite(player.y)
    && Number.isFinite(player.health) && player.health >= 0 && player.health <= 3
    && Number.isFinite(player.battery) && player.battery >= 0 && player.battery <= 100;
}

function cleanSettings(input = {}) {
  const clamp = (value, fallback) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
  return { master: clamp(input.master, 0.8), ambience: clamp(input.ambience, 0.35), effects: clamp(input.effects, 0.7), reducedMotion: Boolean(input.reducedMotion) };
}

export class Save {
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ok: true, data: null };
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !validPlayer(parsed.player) || !Array.isArray(parsed.inventory)) {
        return { ok: false, data: null, error: "O arquivo de salvamento está inválido. Um novo início está disponível." };
      }
      const data = {
        version: 1,
        player: {
          x: parsed.player.x, y: parsed.player.y, health: parsed.player.health,
          battery: parsed.player.battery, flashlightOn: Boolean(parsed.player.flashlightOn),
          facing: parsed.player.facing && Number.isFinite(parsed.player.facing.x) && Number.isFinite(parsed.player.facing.y)
            ? { x: parsed.player.facing.x, y: parsed.player.facing.y } : { x: 1, y: 0 }
        },
        inventory: parsed.inventory.filter((id) => ITEM_IDS.has(id)),
        map: parsed.map && typeof parsed.map === "object" ? parsed.map : {},
        flags: parsed.flags && typeof parsed.flags === "object" ? parsed.flags : {},
        checkpoint: validPlayer(parsed.checkpoint) ? parsed.checkpoint : null,
        events: Array.isArray(parsed.events) ? parsed.events.filter((id) => typeof id === "string" && id.length < 40).slice(0, 50) : [],
        enemy: parsed.enemy && Number.isFinite(parsed.enemy.x) && Number.isFinite(parsed.enemy.y)
          ? { x: parsed.enemy.x, y: parsed.enemy.y, state: String(parsed.enemy.state || "patrol"), target: parsed.enemy.target && Number.isFinite(parsed.enemy.target.x) && Number.isFinite(parsed.enemy.target.y) ? { x: parsed.enemy.target.x, y: parsed.enemy.target.y } : null }
          : null
      };
      return { ok: true, data };
    } catch (error) {
      return { ok: false, data: null, error: `Não foi possível ler o salvamento (${error.name}).` };
    }
  }

  static save(snapshot) {
    try {
      const data = { version: 1, savedAt: new Date().toISOString(), ...snapshot };
      if (!validPlayer(data.player)) return { ok: false, error: "Posição ou estado do jogador inválido." };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: `O navegador não conseguiu salvar (${error.name}).` };
    }
  }

  static loadSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return { ok: true, settings: cleanSettings(parsed) };
    } catch (error) {
      return { ok: false, settings: cleanSettings(), error: `Configurações reiniciadas (${error.name}).` };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(cleanSettings(settings)));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: `Não foi possível guardar as configurações (${error.name}).` };
    }
  }

  static exists() {
    try { return localStorage.getItem(STORAGE_KEY) !== null; }
    catch { return false; }
  }

  static clear() {
    try { localStorage.removeItem(STORAGE_KEY); return { ok: true }; }
    catch (error) { return { ok: false, error: error.message }; }
  }
}
