export function seededNoise(x, y, seed = 1) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

export function drawPlayer(ctx, player, time) {
  const step = Math.sin(player.walkTime * 13) * 2;
  ctx.save();
  ctx.translate(Math.round(player.x), Math.round(player.y));
  if (player.invulnerableFor > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.52;
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.fillRect(-10, 7, 21, 5);
  ctx.fillStyle = "#172528";
  ctx.fillRect(-7, -7, 14, 19);
  ctx.fillStyle = "#a99572";
  ctx.fillRect(-5, -13 + Math.round(step * 0.3), 10, 9);
  ctx.fillStyle = "#222527";
  ctx.fillRect(-5, -14 + Math.round(step * 0.3), 10, 4);
  ctx.fillStyle = "#d8bc91";
  ctx.fillRect(player.facing.x < -0.2 ? -5 : 2, -9, 2, 2);
  ctx.fillStyle = "#31363a";
  ctx.fillRect(-6, 10, 5, 5 + Math.max(0, Math.round(step)));
  ctx.fillRect(1, 10, 5, 5 + Math.max(0, Math.round(-step)));
  ctx.fillStyle = "#b6845a";
  ctx.fillRect(6, -3, 3, 8);
  ctx.restore();
}

export function drawEnemy(ctx, enemy, time) {
  const sway = Math.sin(time * 5.1) * 1.4;
  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  ctx.fillStyle = "rgba(0,0,0,.56)";
  ctx.fillRect(-13, 8, 26, 7);
  ctx.fillStyle = enemy.state === "chase" ? "#181718" : "#111719";
  ctx.fillRect(-9, -12 + Math.round(sway), 18, 26);
  ctx.fillRect(-7, -19 + Math.round(sway), 14, 8);
  ctx.fillStyle = enemy.state === "chase" ? "#bf664c" : "#929080";
  ctx.fillRect(-4, -16 + Math.round(sway), 2, 2);
  ctx.fillRect(3, -16 + Math.round(sway), 2, 2);
  ctx.fillStyle = "#232427";
  ctx.fillRect(-13, -5, 4, 13);
  ctx.fillRect(9, -6, 4, 14);
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
  } else if (room.type === "pantry") {
    rect(x + 187, y + 83, 108, 142, "#343a34");
    for (let i = 0; i < 4; i += 1) { ctx.fillStyle = "#727061"; ctx.fillRect(x + 198, y + 93 + i * 32, 84, 18); }
  }
  ctx.restore();
}
