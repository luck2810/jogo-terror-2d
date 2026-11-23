import test from "node:test";
import assert from "node:assert/strict";
import { Player } from "../js/entities/Player.js";

test("bateria da lanterna permanece infinita durante uso prolongado", () => {
  const player = new Player({ battery: 0, flashlightOn: true });
  assert.equal(player.battery, 100);
  assert.equal(player.flashlightOn, true);

  player.update(3600, { moving: false }, {});

  assert.equal(player.battery, 100);
  assert.equal(player.flashlightOn, true);
});

test("lanterna pode ser ligada mesmo quando save antigo registrou bateria zerada", () => {
  const player = new Player({ battery: 0, flashlightOn: false });
  assert.equal(player.toggleFlashlight(), true);
  assert.equal(player.battery, 100);
  assert.equal(player.flashlightOn, true);
});
