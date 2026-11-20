import test from "node:test";
import assert from "node:assert/strict";
import { visibilityPolygon } from "../js/systems/Lighting.js";

test("polígono de iluminação corta o raio no obstáculo e mantém o espaço lateral visível", () => {
  const polygon = visibilityPolygon(
    { x: 0, y: 0 },
    [{ x: 10, y: -5, w: 2, h: 10 }],
    20
  );

  const east = polygon.find((point) => Math.abs(point.y) < 1e-9 && point.x > 0);
  assert.ok(east);
  assert.ok(Math.abs(east.x - 10) < 1e-6, `raio leste deveria parar em x=10, recebeu ${east.x}`);

  const north = polygon.reduce((closest, point) => point.y > 0 && Math.abs(point.x) < Math.abs(closest.x) ? point : closest, { x: Infinity, y: 0 });
  assert.ok(Number.isFinite(north.x));
  assert.ok(Math.abs(north.y - 20) < 1e-6, `raio ao norte deveria alcançar o raio completo, recebeu ${north.y}`);
});
