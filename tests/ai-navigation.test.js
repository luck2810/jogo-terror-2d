import test from "node:test";
import assert from "node:assert/strict";
import { Enemy } from "../js/entities/Enemy.js";
import { Player } from "../js/entities/Player.js";
import { GameMap } from "../js/world/Map.js";

function simulate({ map, playerAt, enemyAt, seconds }) {
  const game = { map, flags: { generatorPowered: true }, audio: { play() {} }, toast() {}, elapsedTime: 0 };
  game.player = new Player(playerAt);
  const enemy = new Enemy(map);
  if (enemyAt) { enemy.x = enemyAt.x; enemy.y = enemyAt.y; }
  game.enemy = enemy;
  const rooms = new Set(); const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) {
    game.elapsedTime = t;
    game.player.invulnerableFor = Math.max(0, game.player.invulnerableFor - dt);
    enemy.update(dt, game);
    const room = map.getRoomAt(enemy); if (room) rooms.add(room.id);
  }
  return { enemy, rooms, game };
}
const openAll = () => { const map = new GameMap(); for (const d of map.doors) { d.open = true; d.locked = false; } return map; };

test("regressão: inimigo atravessa a porta e patrulha saguão e corredor", () => {
  const map = openAll();
  const { rooms } = simulate({ map, playerAt: map.roomCenter("kitchen"), seconds: 120 });
  assert.ok(rooms.has("hall") && rooms.has("lobby"), `salas visitadas: ${[...rooms]}`);
});

test("regressão: inimigo contorna estante do arquivo até chegar ao corredor", () => {
  const map = openAll();
  const { rooms } = simulate({ map, playerAt: map.roomCenter("kitchen"), enemyAt: map.roomCenter("archive"), seconds: 60 });
  assert.ok(rooms.has("hall"), `salas visitadas: ${[...rooms]}`);
});

test("regressão: porta fechada não congela o inimigo (ele ronda a sala em que está)", () => {
  const map = openAll(); map.getDoor("front-hall").open = false;
  const { enemy } = simulate({ map, playerAt: map.roomCenter("lobby"), seconds: 90 });
  assert.equal(map.getRoomAt(enemy)?.id, "hall");
  const a = { x: enemy.x, y: enemy.y };
  const again = simulate({ map, playerAt: map.roomCenter("lobby"), enemyAt: a, seconds: 30 });
  assert.ok(Math.hypot(again.enemy.x - a.x, again.enemy.y - a.y) > 5 || again.enemy.state === "patrol");
});

test("inimigo persegue pela porta aberta e alcança o jogador", () => {
  const map = openAll(); const lobby = map.roomCenter("lobby");
  const { game } = simulate({ map, playerAt: { x: lobby.x + 150, y: lobby.y }, enemyAt: { x: map.roomCenter("hall").x - 100, y: map.roomCenter("hall").y }, seconds: 40 });
  assert.ok(game.player.health < 3);
});

test("som atravessa porta aberta, mas não porta fechada", () => {
  const map = new GameMap();
  const enemy = new Enemy(map);
  const lobby = { x: map.roomCenter("lobby").x + 200, y: map.roomCenter("lobby").y };
  enemy.x = map.roomCenter("hall").x - 150; enemy.y = map.roomCenter("hall").y;
  assert.equal(enemy.hear(lobby, 900, map), true);        // porta do saguão começa aberta
  const closed = new GameMap(); closed.getDoor("front-hall").open = false;
  const enemy2 = new Enemy(closed); enemy2.x = enemy.x; enemy2.y = enemy.y;
  assert.equal(enemy2.hear(lobby, 900, closed), false);
});

test("itens não podem ser pegos através da parede", () => {
  const map = new GameMap();
  const archive = map.getRoom("archive").rect;
  const key = map.items.find((i) => i.id === "generator-key");
  const fromHall = { x: archive.x - 40, y: key.y };       // do outro lado da parede, no corredor
  const found = map.findNearestInteractable(fromHall, { flags: {} }, 500);
  assert.notEqual(found?.id, "generator-key");
});
