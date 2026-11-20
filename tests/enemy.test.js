import test from "node:test";
import assert from "node:assert/strict";
import { Enemy } from "../js/entities/Enemy.js";
import { GameMap } from "../js/world/Map.js";

const flags = { generatorPowered: false };

test("inimigo investiga ruído visível no mesmo cômodo", () => {
  const map = new GameMap();
  const enemy = new Enemy(map);
  const point = { x: enemy.x + 50, y: enemy.y };
  assert.equal(enemy.hear(point, 100, map), true);
  assert.equal(enemy.state, "investigate");
});

test("inimigo não recebe detecção por som através de porta fechada", () => {
  const map = new GameMap();
  const enemy = new Enemy(map);
  const archive = map.roomCenter("archive");
  assert.equal(enemy.hear(archive, 600, map), false);
  assert.equal(enemy.state, "patrol");
});

test("rota da IA não atravessa porta fechada mesmo se destrancada", () => {
  const map = new GameMap();
  const door = map.getDoor("ward-door");
  door.locked = false;
  assert.equal(map.roomPath("hall", "infirmary", flags), null);
  door.open = true;
  assert.equal(map.roomPath("hall", "infirmary", flags).length, 1);
});
