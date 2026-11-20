export function seededNoise(x, y, seed = 1) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Direção dominante do olhar: "down" | "up" | "side" (+ espelhamento). */
function facingOf(facing) {
  if (Math.abs(facing.x) > Math.abs(facing.y)) return { dir: "side", flip: facing.x < 0 };
  return { dir: facing.y < 0 ? "up" : "down", flip: false };
}

export function drawPlayer(ctx, player, time) {
  const { dir, flip } = facingOf(player.facing);
  const moving = Boolean(player.moving);
  const swing = moving ? Math.sin(player.walkTime * 13) : 0;
  const bob = moving ? Math.abs(Math.sin(player.walkTime * 13)) * -1.5 : Math.sin(time * 1.8) * 0.4;
  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));
  if (flip) ctx.scale(-1, 1);
  if (player.invulnerableFor > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.5;
  px(-10, 8, 21, 5, "rgba(0,0,0,.42)");                              // sombra
  const by = Math.round(bob);
  const COAT = "#1f3a40", COAT_D = "#16282d", SKIN = "#c9a77d", HAIR = "#2a2220", SCARF = "#b0603f", BOOT = "#15191b";
  const lamp = player.flashlightOn ? "#f2dc9a" : "#7d745a";
  if (dir === "side") {
    px(-4 - Math.round(swing * 2), 7, 5, 6, BOOT); px(0 + Math.round(swing * 2), 7, 5, 6, BOOT);   // pernas
    px(-5, -6 + by, 10, 14, COAT); px(-5, 4 + by, 10, 3, COAT_D);                                  // casaco
    px(-6, -5 + by, 3, 9, "#3a2f27");                                                              // mochila
    px(-4, -6 + by, 10, 3, SCARF);
    px(-4, -15 + by, 9, 10, SKIN); px(-5, -16 + by, 10, 5, HAIR); px(-5, -12 + by, 3, 6, HAIR);
    px(2, -11 + by, 2, 2, "#1a1512");                                                              // olho
    px(1 + Math.round(swing * 2), -3 + by, 4, 8, COAT_D);                                          // braço
    px(4 + Math.round(swing * 2), 1 + by, 5, 3, lamp);                                             // lanterna
  } else if (dir === "up") {
    px(-6 - Math.round(swing * 1), 7, 5, 6 + Math.max(0, Math.round(swing * 2)), BOOT); px(1, 7, 5, 6 + Math.max(0, Math.round(-swing * 2)), BOOT);
    px(-7, -6 + by, 14, 14, COAT); px(-5, -4 + by, 10, 10, "#3a2f27");                              // mochila nas costas
    px(-7, -6 + by, 14, 3, SCARF);
    px(-5, -15 + by, 10, 10, HAIR);
    px(-9, -4 + by + Math.round(swing * 1), 3, 9, COAT_D); px(6, -4 + by - Math.round(swing * 1), 3, 9, COAT_D);
  } else {
    px(-6, 7, 5, 6 + Math.max(0, Math.round(swing * 2)), BOOT); px(1, 7, 5, 6 + Math.max(0, Math.round(-swing * 2)), BOOT);
    px(-7, -6 + by, 14, 14, COAT); px(-1, -6 + by, 2, 14, COAT_D);
    px(-7, -6 + by, 14, 3, SCARF);
    px(-5, -15 + by, 10, 10, SKIN); px(-5, -16 + by, 10, 4, HAIR); px(-5, -13 + by, 2, 3, HAIR); px(3, -13 + by, 2, 3, HAIR);
    px(-3, -10 + by, 2, 2, "#1a1512"); px(1, -10 + by, 2, 2, "#1a1512");
    px(-9, -4 + by - Math.round(swing * 1), 3, 9, COAT_D); px(6, -4 + by + Math.round(swing * 1), 3, 9, COAT_D);
    px(6, 3 + by, 3, 4, lamp);                                                                       // lanterna na mão
  }
  ctx.restore();
}

export function drawEnemy(ctx, enemy, time) {
  const chasing = enemy.state === "chase";
  const t = enemy.animation ?? time;
  const sway = Math.sin(t * (chasing ? 11 : 4.6));
  const lean = chasing ? 3 : 0;
  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  if ((enemy.facingX ?? 1) < 0) ctx.scale(-1, 1);
  px(-14, 9, 28, 7, "rgba(0,0,0,.6)");
  // rastro de sombra atrás
  ctx.globalAlpha = 0.18; px(-13 - lean, -10, 18, 24, "#0a0e10"); ctx.globalAlpha = 1;
  // pernas finas e longas
  px(-6, 6, 4, 10 + Math.max(0, Math.round(sway * 2)), "#0d1113"); px(2, 6, 4, 10 + Math.max(0, Math.round(-sway * 2)), "#0d1113");
  // torso alongado, curvo
  px(-8 + lean, -13 + Math.round(sway * 0.6), 16, 21, chasing ? "#151415" : "#101619");
  px(-6 + lean, -15 + Math.round(sway * 0.6), 12, 4, "#0b0f11");
  // braços longos balançando até o joelho
  px(-12 + lean, -8, 4, 18 + Math.round(sway * 2), "#1a1d20"); px(8 + lean, -8, 4, 18 + Math.round(-sway * 2), "#1a1d20");
  px(-13 + lean, 10 + Math.round(sway * 2), 6, 3, "#2a2c2d"); px(7 + lean, 10 + Math.round(-sway * 2), 6, 3, "#2a2c2d");   // garras
  // cabeça alongada com máscara pálida
  px(-5 + lean, -26 + Math.round(sway * 0.6), 10, 12, "#14181a");
  px(-4 + lean, -22 + Math.round(sway * 0.6), 8, 7, "#9a9788");
  // olhos: cinza quando calmo, ferrugem quando persegue
  const eye = chasing ? "#e0734f" : "#6f7468";
  px(-3 + lean, -20 + Math.round(sway * 0.6), 2, 3, eye); px(1 + lean, -20 + Math.round(sway * 0.6), 2, 3, eye);
  if (chasing) { ctx.globalAlpha = 0.25; px(-5 + lean, -21 + Math.round(sway * 0.6), 10, 5, "#e0734f"); ctx.globalAlpha = 1; }
  // interferência (glitch) ocasional
  if (Math.floor(time * 9) % 7 === 0) { ctx.globalAlpha = 0.28; px(-12, -6, 24, 3, "#7fb7b3"); ctx.globalAlpha = 1; }
  ctx.restore();
}

/** Ícones dos objetos coletáveis (pixel art; cada item é reconhecível pela silhueta). */
export function drawItemIcon(ctx, item, time) {
  const pulse = 0.5 + Math.sin(time * 2 + item.x) * 0.15;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = `rgba(214,170,104,${pulse * 0.22})`; ctx.fillRect(-11, -11, 22, 22);
  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const id = item.id;
  if (id.endsWith("-key")) {
    const metal = id === "service-key" ? "#c29961" : id === "archive-key" ? "#a5b3a6" : "#c98a5f";
    px(-7, -5, 6, 6, metal); px(-6, -4, 4, 4, "#1c1f1d"); px(-2, -3, 10, 2, metal); px(4, -1, 2, 4, metal); px(7, -1, 2, 3, metal);
    px(-7, 2, 6, 3, "#e3d3a3");                                       // etiqueta
  } else if (id === "fuse") {
    px(-7, -3, 14, 6, "#cfc5a8"); px(-7, -3, 3, 6, "#8a7a5a"); px(4, -3, 3, 6, "#8a7a5a"); px(-2, -1, 4, 2, "#5a5546");
  } else if (id === "battery-cell") {
    px(-4, -6, 8, 12, "#6f8f72"); px(-2, -9, 4, 3, "#c9c4a8"); px(-4, -1, 8, 2, "#2c3a2f"); px(-1, -4, 2, 3, "#e3d3a3");
  } else if (id === "med-kit") {
    px(-8, -5, 16, 11, "#d8d2c0"); px(-8, -5, 16, 2, "#9a968a"); px(-1, -3, 2, 8, "#b5523c"); px(-4, 0, 8, 2, "#b5523c");
  } else {
    px(-5, -6, 10, 12, "#8f8b7b");
  }
  ctx.restore();
}

export function drawDocumentIcon(ctx, doc, read) {
  ctx.save(); ctx.translate(doc.x, doc.y);
  ctx.fillStyle = read ? "#8f8b7b" : "#d2c8aa"; ctx.fillRect(-5, -6, 10, 12);
  ctx.fillStyle = "rgba(48,48,41,.7)";
  for (let i = 0; i < 3; i += 1) ctx.fillRect(-3, -4 + i * 3, 6, 1);
  if (!read) { ctx.fillStyle = "#c06a46"; ctx.fillRect(2, -6, 3, 3); }   // marca de "não lido"
  ctx.restore();
}

/** Parede com topo iluminado, sombra na base e juntas de tijolo. */
export function drawWall(ctx, wall) {
  const horizontal = wall.w >= wall.h;
  ctx.fillStyle = "#222826"; ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.fillStyle = "rgba(0,0,0,.2)";
  if (horizontal) for (let x = wall.x + 14; x < wall.x + wall.w; x += 28) ctx.fillRect(x, wall.y + 3, 1, wall.h - 6);
  else for (let y = wall.y + 10; y < wall.y + wall.h; y += 20) ctx.fillRect(wall.x + 3, y, wall.w - 6, 1);
  ctx.fillStyle = "rgba(173,160,128,.15)";
  if (horizontal) ctx.fillRect(wall.x, wall.y, wall.w, 3); else ctx.fillRect(wall.x, wall.y, 3, wall.h);
  ctx.fillStyle = "rgba(0,0,0,.38)";
  if (horizontal) ctx.fillRect(wall.x, wall.y + wall.h - 4, wall.w, 4); else ctx.fillRect(wall.x + wall.w - 4, wall.y, 4, wall.h);
  for (let i = 0; i < 5; i += 1) {
    const n = seededNoise(wall.x * 0.03 + i, wall.y * 0.03, 9);
    if (n > 0.55) { ctx.fillStyle = "rgba(190,185,163,.08)"; ctx.fillRect(wall.x + n * (wall.w - 6), wall.y + (n * 97 % 1) * (wall.h - 3), 4, 2); }
  }
}

/** Decoração de piso (sem colisão): tapetes, manchas, papéis, rachaduras. */
export function drawRoomDecor(ctx, room) {
  const { x, y, w, h } = room.rect;
  ctx.save();
  const rect = (rx, ry, rw, rh, fill) => { ctx.fillStyle = fill; ctx.fillRect(x + rx, y + ry, rw, rh); };
  if (room.type === "lobby") {
    rect(78, 232, 270, 76, "#3a2a27"); rect(84, 238, 258, 64, "#4a3430");
    for (let i = 0; i < 8; i += 1) rect(96 + i * 30, 244, 14, 52, i % 2 ? "#3f2d29" : "#523a34");
  } else if (room.type === "hall") {
    rect(24, 156, 432, 40, "#2c2828"); rect(28, 160, 424, 32, "#38302f"); rect(28, 174, 424, 2, "rgba(0,0,0,.25)");
  } else if (room.type === "infirmary") {
    for (let i = 0; i < 12; i += 1) for (let j = 0; j < 8; j += 1) if ((i + j) % 2) rect(30 + i * 36, 30 + j * 36, 36, 36, "rgba(200,205,190,.05)");
    rect(280, 214, 36, 22, "rgba(110,34,28,.35)"); rect(292, 236, 18, 10, "rgba(110,34,28,.3)");
  } else if (room.type === "archive") {
    for (let i = 0; i < 10; i += 1) { const n = seededNoise(i, 4, 21); rect(160 + n * 160, 110 + ((n * 53) % 1) * 160, 12, 9, "rgba(206,196,165,.5)"); }
  } else if (room.type === "kitchen") {
    rect(90, 230, 70, 34, "rgba(70,92,100,.28)"); rect(100, 222, 44, 12, "rgba(70,92,100,.2)");
  } else if (room.type === "generator") {
    rect(205, 160, 60, 40, "rgba(8,10,10,.55)"); ctx.strokeStyle = "#1a1f1e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 198, y + 190); ctx.bezierCurveTo(x + 260, y + 220, x + 300, y + 190, x + 345, y + 240); ctx.stroke();
  } else if (room.type === "radio") {
    ctx.strokeStyle = "#191e1e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 220, y + 134); ctx.bezierCurveTo(x + 220, y + 190, x + 150, y + 200, x + 90, y + 260); ctx.stroke();
  } else if (room.type === "pantry") {
    for (let i = 0; i < 18; i += 1) rect(40 + i * 20 + (i % 3) * 3, 270 - (i % 5) * 4, 6, 2, "rgba(220,218,200,.28)");
  } else if (room.type === "dorm") {
    rect(120, 150, 240, 80, "#2d3532"); rect(124, 154, 232, 72, "#36403c");
    for (let i = 0; i < 4; i += 1) rect(228 + i * 4, 120 + i * 2, 2, 22, "rgba(0,0,0,.3)");   // arranhões no chão
  }
  ctx.strokeStyle = "rgba(0,0,0,.32)"; ctx.lineWidth = 1;
  for (let c = 0; c < 4; c += 1) {
    let cx = x + 40 + seededNoise(c, room.col + 3, 41) * (w - 80); let cy = y + 40 + seededNoise(c + 9, room.row + 5, 43) * (h - 80);
    ctx.beginPath(); ctx.moveTo(cx, cy);
    for (let k = 0; k < 4; k += 1) { cx += (seededNoise(c, k, 51) - 0.5) * 26; cy += 6 + seededNoise(k, c, 53) * 12; ctx.lineTo(cx, cy); }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRoomFurniture(ctx, room) {
  const { x, y } = room.rect;
  ctx.save();
  ctx.lineWidth = 1;
  const rect = (rx, ry, w, h, fill, stroke = "#343a36") => {
    ctx.fillStyle = fill;
    ctx.fillRect(rx, ry, w, h);
    ctx.strokeStyle = stroke;
    ctx.strokeRect(rx + .5, ry + .5, w - 1, h - 1);
  };
  if (room.type === "lobby") {
    rect(x + 65, y + 80, 105, 38, "#303532");
    rect(x + 73, y + 89, 28, 20, "#56605a", "#66716a");
    rect(x + 230, y + 178, 92, 46, "#282e2b");
    rect(x + 241, y + 187, 70, 26, "#444841");
    ctx.fillStyle = "#a07b56"; ctx.fillRect(x + 275, y + 192, 13, 9);
    ctx.fillStyle = "#2b2925"; ctx.fillRect(x + 373, y + 63, 51, 75);
    ctx.fillStyle = "#7e725d"; ctx.fillRect(x + 378, y + 67, 41, 3);
  } else if (room.type === "infirmary") {
    rect(x + 205, y + 93, 152, 62, "#36403d");
    rect(x + 211, y + 99, 140, 22, "#727369", "#77796c");
    ctx.fillStyle = "#cec4ad"; ctx.fillRect(x + 216, y + 103, 33, 15);
    rect(x + 72, y + 191, 70, 44, "#353b37");
    ctx.fillStyle = "#a49c88"; ctx.fillRect(x + 83, y + 201, 47, 4);
  } else if (room.type === "archive") {
    for (const sx of [x + 64, x + 354]) {
      rect(sx, y + 62, 56, 175, "#282e2b");
      for (let i = 0; i < 5; i += 1) {
        ctx.fillStyle = i % 2 ? "#766348" : "#555d56";
        ctx.fillRect(sx + 7, y + 72 + i * 31, 41, 21);
        ctx.fillStyle = "#232c2c"; ctx.fillRect(sx + 7, y + 92 + i * 31, 41, 2);
      }
    }
    rect(x + 186, y + 201, 118, 42, "#3d3d35");
    ctx.fillStyle = "#91876f"; ctx.fillRect(x + 203, y + 207, 44, 17);
  } else if (room.type === "kitchen") {
    rect(x + 247, y + 182, 124, 74, "#383a34");
    ctx.fillStyle = "#55564a"; ctx.fillRect(x + 254, y + 190, 110, 12);
    rect(x + 73, y + 67, 112, 37, "#3d403a");
    for (let i = 0; i < 4; i += 1) { ctx.fillStyle = "#171e1e"; ctx.fillRect(x + 85 + i * 23, y + 77, 12, 12); }
  } else if (room.type === "generator") {
    rect(x + 102, y + 73, 96, 149, "#343a36");
    rect(x + 112, y + 83, 76, 44, "#1d292a", "#6b6653");
    ctx.fillStyle = "#b26647"; ctx.fillRect(x + 168, y + 91, 11, 11);
    ctx.strokeStyle = "#766e57"; ctx.beginPath(); ctx.moveTo(x + 118, y + 154); ctx.lineTo(x + 177, y + 154); ctx.lineTo(x + 169, y + 207); ctx.stroke();
    rect(x + 310, y + 90, 63, 42, "#242c2a");
  } else if (room.type === "radio") {
    rect(x + 157, y + 80, 164, 52, "#343833");
    rect(x + 172, y + 89, 52, 29, "#151b1b", "#877c63");
    ctx.fillStyle = "#b56b4c"; ctx.fillRect(x + 183, y + 98, 21, 3);
    rect(x + 263, y + 91, 43, 24, "#242c29", "#696653");
    ctx.strokeStyle = "#827b63"; ctx.beginPath(); ctx.moveTo(x + 286, y + 91); ctx.lineTo(x + 312, y + 58); ctx.stroke();
    ctx.fillStyle = "#777c70"; ctx.fillRect(x + 70, y + 217, 84, 5);
  } else if (room.type === "hall") {
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i % 2 ? "#242b2b" : "#313633";
      ctx.fillRect(x + 57 + i * 95, y + 71, 27, 44);
      ctx.strokeStyle = "#50524a"; ctx.strokeRect(x + 60 + i * 95, y + 74, 21, 38);
    }
    rect(x + 292, y + 220, 62, 27, "#3a3b34");
  } else if (room.type === "dorm") {
    for (const by of [66, 210]) {
      rect(x + 60, y + by, 110, 56, "#3a3f3c");
      rect(x + 66, y + by + 6, 98, 44, "#8e8a78", "#a39e8b");
      rect(x + 70, y + by + 10, 24, 16, "#cfc8b3", "#e0dac6");
      rect(x + 104, y + by + 6, 60, 44, "#44504c", "#5a6863");
    }
    rect(x + 330, y + 60, 80, 60, "#2f2a24", "#4a4034");
    ctx.fillStyle = "#4a4034"; ctx.fillRect(x + 369, y + 62, 2, 56);
    ctx.fillStyle = "#a08a5e"; ctx.fillRect(x + 364, y + 90, 3, 5); ctx.fillRect(x + 373, y + 90, 3, 5);
    ctx.fillStyle = "#b0603f"; ctx.fillRect(x + 182, y + 86, 6, 16);   // lamparina da cama de plantão
  } else if (room.type === "pantry") {
    rect(x + 187, y + 83, 108, 142, "#343a34");
    for (let i = 0; i < 4; i += 1) { ctx.fillStyle = "#727061"; ctx.fillRect(x + 198, y + 93 + i * 32, 84, 18); }
  }
  ctx.restore();
}
