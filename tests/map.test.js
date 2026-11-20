import test from "node:test";
import assert from "node:assert/strict";
import { GameMap } from "../js/world/Map.js";
import { Inventory } from "../js/systems/Inventory.js";

const flags = { generatorPowered: false };

test("mapa contém salas conectadas e portas trancadas inicialmente", () => {
  const map = new GameMap();
  assert.equal(map.rooms.length, 9);
  assert.equal(map.getDoor("ward-door").locked, true);
  assert.equal(map.getDoor("front-hall").open, true);
  assert.equal(map.roomPath("lobby", "hall", flags).length, 1);
  assert.equal(map.roomPath("lobby", "infirmary", flags), null);
});

test("chave abre e alterna a porta efetiva do mapa", () => {
  const map = new GameMap();
  const inventory = new Inventory(["service-key"]);
  const target = map.getInteractables({ flags }).find((item) => item.id === "ward-door");
  assert.equal(map.interactDoor(target, inventory, flags).ok, true);
  assert.equal(map.getDoor("ward-door").locked, false);
  assert.equal(map.getDoor("ward-door").open, true);
  assert.equal(map.roomPath("hall", "infirmary", flags).length, 1);
});

test("sala opcional fica escondida até a parede ser examinada", () => {
  const map = new GameMap();
  assert.equal(map.getDoor("pantry-door").visible, false);
  assert.equal(map.revealPantry(), true);
  assert.equal(map.getDoor("pantry-door").visible, true);
  assert.equal(map.getDoor("pantry-door").open, false);
});
