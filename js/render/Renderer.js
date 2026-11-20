import { drawDocumentIcon, drawEnemy, drawItemIcon, drawPlayer, drawRoomDecor, drawRoomFurniture, drawWall, seededNoise } from "./Art.js";
import { Lighting } from "../systems/Lighting.js";
import { ROOM_H, ROOM_W } from "../world/Map.js";

const VIEW_W = 960;
const VIEW_H = 540;
const TILE = 32;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.lighting = new Lighting();
    this.dpr = 1;
    this.reducedMotion = false;
    this.floor = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    this.canvas.width = Math.round(VIEW_W * this.dpr);
    this.canvas.height = Math.round(VIEW_H * this.dpr);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  #cacheKey(map) { return map.doors.filter((door) => door.visible).length; }

  /** O cenário estático (piso, decoração, paredes e móveis) é desenhado uma única vez e reaproveitado a cada quadro. */
  #buildFloorCache(map) {
    const pad = 40;
    const minX = Math.min(...map.rooms.map((r) => r.rect.x)) - pad;
    const minY = Math.min(...map.rooms.map((r) => r.rect.y)) - pad;
    const maxX = Math.max(...map.rooms.map((r) => r.rect.x + r.rect.w)) + pad;
    const maxY = Math.max(...map.rooms.map((r) => r.rect.y + r.rect.h)) + pad;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(maxX - minX); canvas.height = Math.ceil(maxY - minY);
    const floorCtx = canvas.getContext("2d");
    floorCtx.translate(-minX, -minY);
    for (const room of map.rooms) { this.#drawRoom(floorCtx, room, 0); drawRoomDecor(floorCtx, room); }
    for (const wall of map.getWallRects()) drawWall(floorCtx, wall);
    for (const obstacle of map.obstacles) { floorCtx.fillStyle = "#282e2b"; floorCtx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h); }
    for (const room of map.rooms) drawRoomFurniture(floorCtx, room);
    this.floor = { canvas, x: minX, y: minY, key: this.#cacheKey(map) };
  }

  render(game, now) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#070d0e";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const camera = { x: game.player.x, y: game.player.y };
    ctx.save();
    ctx.translate(VIEW_W / 2 - camera.x, VIEW_H / 2 - camera.y);
    if (!this.floor || this.floor.key !== this.#cacheKey(game.map)) this.#buildFloorCache(game.map);
    ctx.drawImage(this.floor.canvas, this.floor.x, this.floor.y);
    for (const door of game.map.doors) if (door.visible) this.#drawDoor(ctx, door, now);
    this.#drawTargets(ctx, game, now);
    drawEnemy(ctx, game.enemy, now);
    drawPlayer(ctx, game.player, now);
    this.#drawExitGlow(ctx, game);
    ctx.restore();
    if (!this.reducedMotion) this.#drawDust(ctx, camera, now);
    this.lighting.reduced = this.reducedMotion;
    this.lighting.draw(ctx, game.player, camera, now, game.map.getSolidRects());
    this.#drawBlackout(ctx, game);
    if (!this.reducedMotion) this.#drawStaticNoise(ctx, now);
  }

  #drawRoom(ctx, room, time) {
    const r = room.rect;
    const palettes = {
      lobby: ["#252c2a", "#29302d"], hall: ["#202728", "#252b2a"],
      infirmary: ["#2b3230", "#2e3430"], archive: ["#292e2b", "#2c312d"],
      kitchen: ["#2a302c", "#30332c"], generator: ["#222a28", "#282e2b"],
      radio: ["#222c2d", "#283031"], pantry: ["#242d2a", "#2a302a"], dorm: ["#2a2b2c", "#2e302f"]
    };
    ctx.fillStyle = palettes[room.type]?.[0] || "#252c2a";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    for (let ty = 0; ty < ROOM_H / TILE; ty += 1) {
      for (let tx = 0; tx < ROOM_W / TILE; tx += 1) {
        const noise = seededNoise(tx + room.col * 19, ty + room.row * 23, room.col + 7);
        const color = noise > .93 ? "rgba(151,137,106,.09)" : noise < .06 ? "rgba(0,0,0,.13)" : ((tx + ty) % 2 ? palettes[room.type]?.[1] : null);
        if (color) { ctx.fillStyle = color; ctx.fillRect(r.x + tx * TILE + 1, r.y + ty * TILE + 1, TILE - 2, TILE - 2); }
        if (noise > .976) {
          ctx.fillStyle = "rgba(164,151,117,.15)";
          ctx.fillRect(r.x + tx * TILE + 6, r.y + ty * TILE + 4, 9, 2);
        }
      }
    }
    ctx.fillStyle = "rgba(0,0,0,.14)";
    ctx.fillRect(r.x + 18, r.y + 18, r.w - 36, 1);
    ctx.fillRect(r.x + 18, r.y + r.h - 19, r.w - 36, 1);
    this.#drawSaltStains(ctx, r, room);
    ctx.fillStyle = "rgba(4,8,9,.23)";
    ctx.fillRect(r.x + 14, r.y + 14, r.w - 28, 8);
  }

  #drawSaltStains(ctx, r, room) {
    for (let i = 0; i < 8; i += 1) {
      const sx = r.x + 42 + seededNoise(i, room.col + 7, 11) * (r.w - 84);
      const sy = r.y + 42 + seededNoise(i + 8, room.row + 3, 13) * (r.h - 84);
      ctx.fillStyle = "rgba(190,185,163,.035)";
      ctx.fillRect(sx, sy, 6 + i % 6, 3 + i % 4);
      ctx.fillRect(sx + 2, sy + 3, 3, 5);
    }
  }

  #drawDoor(ctx, door, time) {
    const r = door.rect;
    if (door.open) {
      ctx.fillStyle = "rgba(0,0,0,.52)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = "#574e3e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (door.axis === "vertical") {
        ctx.moveTo(door.x, door.y - r.h / 2); ctx.lineTo(door.x + (door.a < door.b ? 39 : -39), door.y - r.h / 2 + 5);
      } else {
        ctx.moveTo(door.x - r.w / 2, door.y); ctx.lineTo(door.x - r.w / 2 + 5, door.y + 37);
      }
      ctx.stroke();
      return;
    }
    ctx.fillStyle = door.locked ? "#3b332c" : "#4a4034";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "rgba(190,177,146,.14)";
    for (let stripe = 5; stripe < (door.axis === "vertical" ? r.h : r.w); stripe += 12) {
      if (door.axis === "vertical") ctx.fillRect(r.x + 3, r.y + stripe, r.w - 6, 2);
      else ctx.fillRect(r.x + stripe, r.y + 3, 2, r.h - 6);
    }
    const pulse = door.locked ? 0.45 + Math.sin(time * 2.3) * .15 : .25;
    ctx.fillStyle = door.locked ? `rgba(182,83,58,${pulse})` : "#b7a37a";
    ctx.fillRect(door.x - 2, door.y - 2, 4, 4);
  }

  #drawTargets(ctx, game, time) {
    for (const item of game.map.items) {
      if (game.map.collected.has(item.id)) continue;
      drawItemIcon(ctx, item, time);
    }
    for (const doc of game.map.documents) drawDocumentIcon(ctx, doc, game.map.readDocuments.has(doc.id));
    for (const prop of game.map.props) {
      if (prop.kind === "secret" && game.map.getDoor("pantry-door")?.visible) continue;
      if (prop.kind === "receiver" && !game.flags.generatorPowered) continue;
      if (prop.kind === "exit" && !game.flags.frequencySolved) continue;
      const pulse = .45 + Math.sin(time * 3) * .16;
      ctx.fillStyle = prop.kind === "secret" ? "rgba(166,170,151,.22)" : `rgba(192,106,70,${pulse})`;
      ctx.fillRect(prop.x - 8, prop.y - 8, 16, 16);
      ctx.fillStyle = prop.kind === "secret" ? "#858777" : "#c06a46";
      ctx.fillRect(prop.x - 3, prop.y - 5, 6, 10);
      if (prop.kind === "exit" && game.flags.frequencySolved) {
        ctx.fillStyle = "rgba(201,158,94,.23)";
        ctx.fillRect(prop.x - 17, prop.y - 23, 34, 46);
      }
    }
  }

  /** Falha de luz de evento: lampejos escuros curtos (desligada em "reduzir efeitos"). */
  #drawBlackout(ctx, game) {
    const left = game.events?.blackout ?? 0;
    if (left <= 0 || this.reducedMotion) return;
    ctx.save();
    ctx.globalAlpha = Math.floor(left * 14) % 2 ? 0.92 : 0.45;
    ctx.fillStyle = "#020405";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }

  #drawExitGlow(ctx, game) {
    if (!game.flags.frequencySolved) return;
    const exit = game.map.props.find((prop) => prop.id === "exit");
    if (!exit) return;
    const g = ctx.createRadialGradient(exit.x, exit.y, 3, exit.x, exit.y, 82);
    g.addColorStop(0, "rgba(219,166,101,.19)");
    g.addColorStop(1, "rgba(219,166,101,0)");
    ctx.fillStyle = g;
    ctx.fillRect(exit.x - 82, exit.y - 82, 164, 164);
  }

  #drawDust(ctx, camera, time) {
    ctx.save();
    for (let i = 0; i < 26; i += 1) {
      const drift = time * (5 + i % 4);
      const x = (seededNoise(i + Math.floor(camera.x / 90), i * 2, 31) * VIEW_W + Math.sin(drift + i) * 12 + VIEW_W) % VIEW_W;
      const y = (seededNoise(i + 83, Math.floor(camera.y / 100) + i, 33) * VIEW_H + Math.cos(drift * .7 + i) * 9 + VIEW_H) % VIEW_H;
      ctx.globalAlpha = .12 + seededNoise(i, Math.floor(time * 3), 12) * .25;
      ctx.fillStyle = "#d0c8ad";
      ctx.fillRect(Math.round(x), Math.round(y), i % 5 === 0 ? 2 : 1, 1);
    }
    ctx.restore();
  }

  #drawStaticNoise(ctx, time) {
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "#d8d1bb";
    for (let i = 0; i < 26; i += 1) {
      const x = seededNoise(i, Math.floor(time * 15), 3) * VIEW_W;
      const y = seededNoise(i + 45, Math.floor(time * 18), 5) * VIEW_H;
      ctx.fillRect(x, y, 2 + (i % 4), 1);
    }
    ctx.restore();
  }
}
