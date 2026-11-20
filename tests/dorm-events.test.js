import test from "node:test";
import assert from "node:assert/strict";
import { GameMap } from "../js/world/Map.js";
import { EventDirector } from "../js/systems/Events.js";
import { Enemy } from "../js/entities/Enemy.js";
import { Player } from "../js/entities/Player.js";
import { rectanglesOverlap } from "../js/world/Collision.js";

test("dormitório conecta ao corredor e começa fechado (refúgio)", () => {
  const map = new GameMap();
  const door = map.getDoor("dorm-door");
  assert.equal(door.open, false);
  assert.equal(map.roomPath("hall", "dorm", { generatorPowered: false }), null);
  door.open = true;
  assert.equal(map.roomPath("hall", "dorm", { generatorPowered: false }).length, 1);
});

test("nada do dormitório nasce dentro de móvel ou parede", () => {
  const map = new GameMap();
  const solids = map.getSolidRects();
  for (const t of [...map.items, ...map.documents, ...map.props].filter((o) => o.roomId === "dorm")) {
    const box = { x: t.x - 6, y: t.y - 6, w: 12, h: 12 };
    assert.equal(solids.some((s) => rectanglesOverlap(box, s)), false, t.id);
  }
});

test("paredes não têm retângulos duplicados", () => {
  const walls = new GameMap().getWallRects();
  const keys = walls.map((w) => `${w.x},${w.y},${w.w},${w.h}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("revelar a despensa recalcula as paredes (abre o vão)", () => {
  const map = new GameMap();
  const before = map.getWallRects().length;
  map.revealPantry();
  assert.notEqual(map.getWallRects().length, before);
});

function fakeGame() {
  const map = new GameMap();
  const played = [];
  return { map, played, player: new Player(map.roomCenter("hall")), enemy: new Enemy(map), toasts: [],
    audio: { play: (k) => played.push(k) }, toast(m) { this.toasts.push(m); } };
}

test("batidas no corredor acontecem uma única vez", () => {
  const game = fakeGame(); const events = new EventDirector();
  for (let t = 0; t < 6; t += 0.05) events.update(game, 0.05);
  assert.equal(game.played.filter((k) => k === "knock").length, 3);
  events.lastRoom = null;
  for (let t = 0; t < 6; t += 0.05) events.update(game, 0.05);
  assert.equal(game.played.filter((k) => k === "knock").length, 3);
});

test("eventos já vistos podem ser restaurados do save", () => {
  const game = fakeGame(); const events = new EventDirector(["knocks"]);
  for (let t = 0; t < 6; t += 0.05) events.update(game, 0.05);
  assert.equal(game.played.includes("knock"), false);
});

test("sem sustos ambientais durante a perseguição", () => {
  const game = fakeGame(); const events = new EventDirector(["knocks"]);
  game.enemy.state = "chase"; events.ambientTimer = 0.01;
  for (let t = 0; t < 3; t += 0.05) events.update(game, 0.05);
  assert.deepEqual(game.played, []);
});
