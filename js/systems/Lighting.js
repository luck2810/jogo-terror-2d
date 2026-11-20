const WIDTH = 960;
const HEIGHT = 540;
const TAU = Math.PI * 2;

function distanceToRect(point, rect) {
  const x = Math.max(rect.x, Math.min(point.x, rect.x + rect.w));
  const y = Math.max(rect.y, Math.min(point.y, rect.y + rect.h));
  return Math.hypot(point.x - x, point.y - y);
}

function rayRectDistance(origin, dx, dy, rect, limit) {
  let near = 0;
  let far = limit;
  for (const [position, direction, min, max] of [[origin.x, dx, rect.x, rect.x + rect.w], [origin.y, dy, rect.y, rect.y + rect.h]]) {
    if (Math.abs(direction) < 1e-8) {
      if (position < min || position > max) return limit;
      continue;
    }
    const a = (min - position) / direction;
    const b = (max - position) / direction;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (far < near) return limit;
  }
  return Math.max(0, Math.min(limit, near));
}

export function visibilityPolygon(origin, solids, radius) {
  const rects = solids
    .filter((rect) => distanceToRect(origin, rect) <= radius + 2)
    .filter((rect) => !(origin.x >= rect.x && origin.x <= rect.x + rect.w && origin.y >= rect.y && origin.y <= rect.y + rect.h));
  const angles = Array.from({ length: 144 }, (_, index) => (index / 144) * TAU);
  for (const rect of rects) {
    for (const corner of [
      { x: rect.x, y: rect.y }, { x: rect.x + rect.w, y: rect.y },
      { x: rect.x, y: rect.y + rect.h }, { x: rect.x + rect.w, y: rect.y + rect.h }
    ]) {
      if (Math.hypot(corner.x - origin.x, corner.y - origin.y) > radius + 2) continue;
      const angle = Math.atan2(corner.y - origin.y, corner.x - origin.x);
      angles.push((angle - 0.002 + TAU) % TAU, angle, (angle + 0.002) % TAU);
    }
  }
  angles.sort((a, b) => a - b);
  return angles.map((angle) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let reach = radius;
    for (const rect of rects) reach = Math.min(reach, rayRectDistance(origin, dx, dy, rect, reach));
    return { x: origin.x + dx * reach, y: origin.y + dy * reach };
  });
}

export class Lighting {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.ctx = this.canvas.getContext("2d");
    this.reduced = false;
  }

  draw(ctx, player, camera, time, worldSolids = []) {
    const mask = this.ctx;
    const origin = { x: WIDTH / 2, y: HEIGHT / 2 };
    const worldToView = (rect) => ({
      x: rect.x - camera.x + origin.x,
      y: rect.y - camera.y + origin.y,
      w: rect.w,
      h: rect.h
    });
    const nearbySolids = worldSolids.map(worldToView);
    const visible = visibilityPolygon(origin, nearbySolids, 328);

    mask.clearRect(0, 0, WIDTH, HEIGHT);
    mask.fillStyle = "rgba(3,7,9,0.84)";
    mask.fillRect(0, 0, WIDTH, HEIGHT);
    mask.globalCompositeOperation = "destination-out";
    mask.save();
    mask.beginPath();
    visible.forEach((point, index) => index === 0 ? mask.moveTo(point.x, point.y) : mask.lineTo(point.x, point.y));
    mask.closePath();
    mask.clip();

    const breath = this.reduced ? 0 : Math.sin(time * 1.35) * 2;
    // Bateria fraca: a lanterna falha em lampejos (desligado com "reduzir efeitos").
    const lowBattery = player.flashlightOn && player.battery < 20 && !this.reduced;
    const flicker = lowBattery && Math.sin(time * 41) + Math.sin(time * 23.7) > 1.25 ? 0.72 : 1;
    const haloRadius = (player.flashlightOn ? 144 * flicker : 64) + breath;
    const halo = mask.createRadialGradient(origin.x, origin.y, 7, origin.x, origin.y, haloRadius);
    halo.addColorStop(0, "rgba(0,0,0,0.96)");
    halo.addColorStop(.58, "rgba(0,0,0,0.55)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    mask.fillStyle = halo;
    mask.fillRect(origin.x - haloRadius, origin.y - haloRadius, haloRadius * 2, haloRadius * 2);

    if (player.flashlightOn) {
      const angle = Math.atan2(player.facing.y, player.facing.x);
      const reach = 318 * flicker;
      const spread = .42;
      mask.save();
      mask.translate(origin.x, origin.y);
      mask.rotate(angle);
      mask.beginPath();
      mask.moveTo(0, 0);
      mask.arc(0, 0, reach, -spread, spread);
      mask.closePath();
      mask.clip();
      const beam = mask.createRadialGradient(0, 0, 16, 0, 0, reach);
      beam.addColorStop(0, "rgba(0,0,0,.96)");
      beam.addColorStop(.62, "rgba(0,0,0,.84)");
      beam.addColorStop(.94, "rgba(0,0,0,.32)");
      beam.addColorStop(1, "rgba(0,0,0,0)");
      mask.fillStyle = beam;
      mask.fillRect(0, -reach, reach, reach * 2);
      mask.restore();
    }
    mask.restore();
    mask.globalCompositeOperation = "source-over";
    ctx.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);

    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 170, WIDTH / 2, HEIGHT / 2, 575);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(.7, "rgba(0,0,0,.08)");
    vignette.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}
