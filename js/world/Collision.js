export function rectanglesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function moveWithCollisions(body, dx, dy, getSolids) {
  let movedX = false;
  let movedY = false;
  if (dx) {
    body.x += dx;
    const rect = { x: body.x - body.radius, y: body.y - body.radius, w: body.radius * 2, h: body.radius * 2 };
    const hit = getSolids().find((solid) => rectanglesOverlap(rect, solid));
    if (hit) body.x = dx > 0 ? hit.x - body.radius : hit.x + hit.w + body.radius;
    else movedX = true;
  }
  if (dy) {
    body.y += dy;
    const rect = { x: body.x - body.radius, y: body.y - body.radius, w: body.radius * 2, h: body.radius * 2 };
    const hit = getSolids().find((solid) => rectanglesOverlap(rect, solid));
    if (hit) body.y = dy > 0 ? hit.y - body.radius : hit.y + hit.h + body.radius;
    else movedY = true;
  }
  return { movedX, movedY };
}

export function hasLineOfSight(from, to, solidRects, step = 8) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const samples = Math.max(1, Math.ceil(length / step));
  for (let i = 1; i < samples; i += 1) {
    const point = { x: from.x + (dx * i) / samples, y: from.y + (dy * i) / samples };
    if (solidRects.some((rect) => pointInRect(point, rect))) return false;
  }
  return true;
}

export function circleRectOverlap(circle, rect) {
  const px = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const py = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  return Math.hypot(circle.x - px, circle.y - py) < circle.radius;
}
