import test from "node:test";
import assert from "node:assert/strict";
import { hasLineOfSight, moveWithCollisions, rectanglesOverlap } from "../js/world/Collision.js";

test("AABB reconhece sobreposição e separação", () => {
  assert.equal(rectanglesOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 10, h: 10 }), true);
  assert.equal(rectanglesOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
});

test("movimento bloqueia eixo em parede e preserva deslizamento", () => {
  const body = { x: 0, y: 0, radius: 5 };
  const wall = { x: 10, y: -20, w: 10, h: 40 };
  const moved = moveWithCollisions(body, 12, 9, () => [wall]);
  assert.equal(moved.movedX, false);
  assert.equal(body.x, 5);
  assert.equal(moved.movedY, true);
  assert.equal(body.y, 9);
});

test("linha de visão é bloqueada por parede e livre por vão", () => {
  const wall = { x: 45, y: -8, w: 10, h: 16 };
  assert.equal(hasLineOfSight({ x: 0, y: 0 }, { x: 100, y: 0 }, [wall]), false);
  assert.equal(hasLineOfSight({ x: 0, y: 0 }, { x: 100, y: 0 }, []), true);
});
