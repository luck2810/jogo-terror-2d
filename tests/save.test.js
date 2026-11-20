import test from "node:test";
import assert from "node:assert/strict";
import { Save } from "../js/systems/Save.js";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};

const snapshot = {
  player: { x: 10, y: 15, health: 2, battery: 72, flashlightOn: false, facing: { x: 1, y: 0 } },
  inventory: ["service-key", "unknown-item"], map: { collected: ["service-key"] },
  flags: { generatorPowered: false }, checkpoint: { x: 10, y: 15, health: 2, battery: 72 }
};

test("save/load guarda progresso e filtra itens desconhecidos", () => {
  assert.equal(Save.save(snapshot).ok, true);
  const loaded = Save.load();
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.data.inventory, ["service-key"]);
  assert.equal(loaded.data.player.x, 10);
});

test("save rejeita estado estruturalmente inválido e trata JSON malformado", () => {
  assert.equal(Save.save({ ...snapshot, player: { x: NaN } }).ok, false);
  storage.set("sinal-de-cinza.save.v1", "{broken");
  assert.equal(Save.load().ok, false);
});

test("configurações são limitadas a 0..1 e persistem", () => {
  assert.equal(Save.saveSettings({ master: 3, ambience: -1, effects: .5 }).ok, true);
  const settings = Save.loadSettings().settings;
  assert.equal(settings.master, 1);
  assert.equal(settings.ambience, 0);
  assert.equal(settings.effects, .5);
});
