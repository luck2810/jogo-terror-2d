import { distance } from "./Collision.js";

export const ROOM_W = 480;
export const ROOM_H = 352;
const ORIGIN_X = 600;
const ORIGIN_Y = 560;
const WALL = 22;
const OPENING = 76;

const ROOM_DATA = [
  { id: "lobby", name: "Saguão", col: 0, row: 0, type: "lobby" },
  { id: "hall", name: "Corredor leste", col: 1, row: 0, type: "hall" },
  { id: "infirmary", name: "Enfermaria", col: 1, row: -1, type: "infirmary" },
  { id: "archive", name: "Arquivo", col: 2, row: 0, type: "archive" },
  { id: "kitchen", name: "Cozinha", col: 2, row: 1, type: "kitchen" },
  { id: "generator", name: "Casa de força", col: 3, row: 1, type: "generator" },
  { id: "radio", name: "Sala do rádio", col: 3, row: 0, type: "radio" },
  { id: "pantry", name: "Despensa lacrada", col: 0, row: -1, type: "pantry", optional: true }
];

function roomRect(room) {
  return { x: ORIGIN_X + room.col * ROOM_W, y: ORIGIN_Y + room.row * ROOM_H, w: ROOM_W, h: ROOM_H };
}

function doorDefinition(id, a, b, options = {}) {
  const ra = a.rect;
  const rb = b.rect;
  const horizontalConnection = a.row === b.row;
  if (horizontalConnection) {
    const boundaryX = a.col < b.col ? ra.x + ra.w : rb.x + rb.w;
    const centerY = ra.y + ROOM_H / 2;
    return { id, a: a.id, b: b.id, axis: "vertical", x: boundaryX, y: centerY,
      rect: { x: boundaryX - WALL / 2, y: centerY - OPENING / 2, w: WALL, h: OPENING },
      open: Boolean(options.open), locked: Boolean(options.locked), keyId: options.keyId || null,
      requiresPower: Boolean(options.requiresPower), hidden: Boolean(options.hidden), visible: !options.hidden };
  }
  const boundaryY = a.row < b.row ? ra.y + ra.h : rb.y + rb.h;
  const centerX = ra.x + ROOM_W / 2;
  return { id, a: a.id, b: b.id, axis: "horizontal", x: centerX, y: boundaryY,
    rect: { x: centerX - OPENING / 2, y: boundaryY - WALL / 2, w: OPENING, h: WALL },
    open: Boolean(options.open), locked: Boolean(options.locked), keyId: options.keyId || null,
    requiresPower: Boolean(options.requiresPower), hidden: Boolean(options.hidden), visible: !options.hidden };
}

export class GameMap {
  constructor(saved = null) {
    this.rooms = ROOM_DATA.map((room) => ({ ...room, rect: roomRect(room) }));
    const byId = new Map(this.rooms.map((room) => [room.id, room]));
    this.doors = [
      doorDefinition("front-hall", byId.get("lobby"), byId.get("hall"), { open: true }),
      doorDefinition("ward-door", byId.get("hall"), byId.get("infirmary"), { locked: true, keyId: "service-key" }),
      doorDefinition("archive-door", byId.get("hall"), byId.get("archive"), { locked: true, keyId: "archive-key" }),
      doorDefinition("kitchen-door", byId.get("archive"), byId.get("kitchen"), { open: true }),
      doorDefinition("generator-door", byId.get("kitchen"), byId.get("generator"), { locked: true, keyId: "generator-key" }),
      doorDefinition("radio-door", byId.get("generator"), byId.get("radio"), { requiresPower: true }),
      doorDefinition("pantry-door", byId.get("lobby"), byId.get("pantry"), { hidden: true })
    ];
    this.items = [
      { id: "service-key", roomId: "lobby", x: byId.get("lobby").rect.x + 146, y: byId.get("lobby").rect.y + 248, name: "Chave de serviço", detail: "Uma chave de latão, marcada com as iniciais C.S." },
      { id: "fuse", roomId: "infirmary", x: byId.get("infirmary").rect.x + 338, y: byId.get("infirmary").rect.y + 230, name: "Fusível cerâmico", detail: "Ainda parece inteiro. O gerador pode aceitar." },
      { id: "archive-key", roomId: "infirmary", x: byId.get("infirmary").rect.x + 132, y: byId.get("infirmary").rect.y + 263, name: "Chave do arquivo", detail: "Etiqueta apagada: ARQUIVO." },
      { id: "generator-key", roomId: "archive", x: byId.get("archive").rect.x + 370, y: byId.get("archive").rect.y + 256, name: "Chave da casa de força", detail: "A tinta da etiqueta ainda diz: MÁQUINAS." },
      { id: "battery-cell", roomId: "kitchen", x: byId.get("kitchen").rect.x + 158, y: byId.get("kitchen").rect.y + 256, name: "Pilha de lanterna", detail: "Uma carga descartável. Recupera parte da bateria." },
      { id: "med-kit", roomId: "pantry", x: byId.get("pantry").rect.x + 326, y: byId.get("pantry").rect.y + 242, name: "Estojo de primeiros socorros", detail: "Velho, mas limpo. Recupera um ponto de vida." }
    ];
    this.documents = [
      { id: "note-infirmary", roomId: "infirmary", x: byId.get("infirmary").rect.x + 224, y: byId.get("infirmary").rect.y + 154, name: "Ficha de plantão", text: "CASA SALINA — PLANTÃO NOTURNO\n\nA chave do arquivo foi deixada na bandeja inferior. O gerador não deve ser ligado antes de conferir os cabos.\n\nSe ouvir três batidas no corredor, não responda." },
      { id: "note-frequency", roomId: "archive", x: byId.get("archive").rect.x + 216, y: byId.get("archive").rect.y + 145, name: "Caderno de manutenção", text: "RÁDIO DE EMERGÊNCIA\n\nO transmissor deriva para 87,6 MHz quando o motor está estável.\n\nA equipe dizia que o ruído parecia uma voz. Era só interferência. Era só interferência." },
      { id: "note-kitchen", roomId: "kitchen", x: byId.get("kitchen").rect.x + 327, y: byId.get("kitchen").rect.y + 142, name: "Bilhete preso ao quadro", text: "Quando a luz apagar, fique perto das paredes. A coisa não atravessa portas fechadas.\n\nA despensa abre pelo lado do saguão. Procure a marca de sal onde a parede está lisa demais." },
      { id: "note-last", roomId: "radio", x: byId.get("radio").rect.x + 164, y: byId.get("radio").rect.y + 244, name: "Última transmissão", text: "Se alguém receber isto: a maré cobre a estrada depois das quatro. A saída de serviço fica junto ao transmissor.\n\nNão desliguem a luz. Se a luz falhar, sigam a linha do rádio." }
    ];
    this.props = [
      { id: "generator-panel", kind: "panel", roomId: "generator", x: byId.get("generator").rect.x + 239, y: byId.get("generator").rect.y + 174, name: "Painel do gerador" },
      { id: "radio-receiver", kind: "receiver", roomId: "radio", x: byId.get("radio").rect.x + 267, y: byId.get("radio").rect.y + 154, name: "Transmissor de emergência" },
      { id: "exit", kind: "exit", roomId: "radio", x: byId.get("radio").rect.x + ROOM_W - 54, y: byId.get("radio").rect.y + 184, name: "Porta de serviço" },
      { id: "secret-wall", kind: "secret", roomId: "lobby", x: byId.get("lobby").rect.x + ROOM_W / 2, y: byId.get("lobby").rect.y + 28, name: "Parede coberta de sal" }
    ];
    this.obstacles = [
      { x: byId.get("lobby").rect.x + 230, y: byId.get("lobby").rect.y + 178, w: 92, h: 46 },
      { x: byId.get("infirmary").rect.x + 205, y: byId.get("infirmary").rect.y + 93, w: 152, h: 62 },
      { x: byId.get("infirmary").rect.x + 72, y: byId.get("infirmary").rect.y + 191, w: 70, h: 44 },
      { x: byId.get("archive").rect.x + 64, y: byId.get("archive").rect.y + 62, w: 56, h: 175 },
      { x: byId.get("archive").rect.x + 354, y: byId.get("archive").rect.y + 62, w: 56, h: 175 },
      { x: byId.get("kitchen").rect.x + 247, y: byId.get("kitchen").rect.y + 182, w: 124, h: 74 },
      { x: byId.get("generator").rect.x + 102, y: byId.get("generator").rect.y + 73, w: 96, h: 149 },
      { x: byId.get("radio").rect.x + 157, y: byId.get("radio").rect.y + 80, w: 164, h: 52 },
      { x: byId.get("hall").rect.x + 292, y: byId.get("hall").rect.y + 220, w: 62, h: 27 },
      { x: byId.get("pantry").rect.x + 187, y: byId.get("pantry").rect.y + 83, w: 108, h: 142 }
    ];
    this.collected = new Set();
    this.readDocuments = new Set();
    if (saved) this.restore(saved);
  }

  getRoom(roomId) { return this.rooms.find((room) => room.id === roomId) || null; }

  getRoomAt(point) {
    return this.rooms.find((room) => point.x > room.rect.x + 13 && point.x < room.rect.x + room.rect.w - 13 && point.y > room.rect.y + 13 && point.y < room.rect.y + room.rect.h - 13) || null;
  }

  getRoomName(point) { return this.getRoomAt(point)?.name || "Corredor"; }

  roomCenter(roomId) {
    const room = this.getRoom(roomId);
    return room ? { x: room.rect.x + room.rect.w / 2, y: room.rect.y + room.rect.h / 2 } : { x: 0, y: 0 };
  }

  #edgeDoor(room, side) {
    return this.doors.find((door) => {
      if (!door.visible || (door.a !== room.id && door.b !== room.id)) return false;
      const other = this.getRoom(door.a === room.id ? door.b : door.a);
      if (!other) return false;
      if (side === "left") return other.col < room.col;
      if (side === "right") return other.col > room.col;
      if (side === "top") return other.row < room.row;
      return other.row > room.row;
    }) || null;
  }

  #wallWithGap(room, side, door) {
    const r = room.rect;
    if (side === "left" || side === "right") {
      const x = side === "left" ? r.x - WALL / 2 : r.x + r.w - WALL / 2;
      if (!door) return [{ x, y: r.y, w: WALL, h: r.h }];
      const top = door.y - OPENING / 2;
      const bottom = door.y + OPENING / 2;
      return [
        { x, y: r.y, w: WALL, h: Math.max(0, top - r.y) },
        { x, y: bottom, w: WALL, h: Math.max(0, r.y + r.h - bottom) }
      ].filter((wall) => wall.h > 0);
    }
    const y = side === "top" ? r.y - WALL / 2 : r.y + r.h - WALL / 2;
    if (!door) return [{ x: r.x, y, w: r.w, h: WALL }];
    const left = door.x - OPENING / 2;
    const right = door.x + OPENING / 2;
    return [
      { x: r.x, y, w: Math.max(0, left - r.x), h: WALL },
      { x: right, y, w: Math.max(0, r.x + r.w - right), h: WALL }
    ].filter((wall) => wall.w > 0);
  }

  getSolidRects() {
    const solids = [];
    for (const room of this.rooms) {
      for (const side of ["left", "right", "top", "bottom"]) {
        solids.push(...this.#wallWithGap(room, side, this.#edgeDoor(room, side)));
      }
    }
    solids.push(...this.obstacles);
    for (const door of this.doors) {
      if (door.visible && !door.open) solids.push(door.rect);
    }
    return solids;
  }

  getInteractables(game) {
    const result = [];
    for (const item of this.items) if (!this.collected.has(item.id)) result.push({ ...item, kind: "item" });
    for (const document of this.documents) result.push({ ...document, kind: "document", alreadyRead: this.readDocuments.has(document.id) });
    for (const door of this.doors) if (door.visible) result.push({ ...door, doorRef: door, kind: "door", name: this.doorLabel(door) });
    for (const prop of this.props) {
      if (prop.kind === "secret" && this.doors.find((door) => door.id === "pantry-door")?.visible) continue;
      if (prop.kind === "receiver" && !game.flags.generatorPowered) continue;
      if (prop.kind === "exit" && !game.flags.frequencySolved) continue;
      result.push(prop);
    }
    return result;
  }

  doorLabel(door) {
    const names = { "front-hall": "Porta do corredor", "ward-door": "Porta da enfermaria", "archive-door": "Porta do arquivo", "kitchen-door": "Porta da cozinha", "generator-door": "Porta da casa de força", "radio-door": "Porta da sala do rádio", "pantry-door": "Porta da despensa" };
    return names[door.id] || "Porta";
  }

  findNearestInteractable(point, game, maxDistance = 55) {
    let best = null;
    for (const target of this.getInteractables(game)) {
      const d = distance(point, target);
      if (d <= maxDistance && (!best || d < best.distance)) best = { ...target, distance: d };
    }
    return best;
  }

  getDoor(id) { return this.doors.find((door) => door.id === id) || null; }

  interactDoor(door, inventory, flags) {
    door = door?.doorRef || door;
    if (!door) return { ok: false, message: "A porta não responde." };
    if (door.requiresPower && !flags.generatorPowered) return { ok: false, message: "Sem energia, o trinco elétrico não cede." };
    if (door.locked) {
      if (!door.keyId || !inventory.has(door.keyId)) return { ok: false, message: "Está trancada. Falta a chave certa." };
      door.locked = false;
    }
    door.open = !door.open;
    return { ok: true, message: door.open ? "A porta se abre." : "A porta se fecha." };
  }

  revealPantry() {
    const door = this.getDoor("pantry-door");
    if (!door || door.visible) return false;
    door.visible = true;
    door.hidden = false;
    door.locked = false;
    return true;
  }

  roomPath(fromId, toId, flags) {
    if (!fromId || !toId) return null;
    if (fromId === toId) return [];
    const queue = [fromId];
    const previous = new Map([[fromId, null]]);
    const viaDoor = new Map();
    while (queue.length) {
      const current = queue.shift();
      for (const door of this.doors) {
        if (!door.visible || !door.open || door.locked || (door.requiresPower && !flags.generatorPowered)) continue;
        const next = door.a === current ? door.b : door.b === current ? door.a : null;
        if (!next || previous.has(next)) continue;
        previous.set(next, current);
        viaDoor.set(next, door);
        if (next === toId) {
          const route = [];
          let node = toId;
          while (node !== fromId) { route.unshift({ roomId: node, door: viaDoor.get(node) }); node = previous.get(node); }
          return route;
        }
        queue.push(next);
      }
    }
    return null;
  }

  serialize() {
    return {
      collected: [...this.collected], readDocuments: [...this.readDocuments],
      doors: this.doors.map(({ id, open, locked, visible }) => ({ id, open, locked, visible }))
    };
  }

  restore(saved) {
    if (Array.isArray(saved.collected)) this.collected = new Set(saved.collected.filter((id) => this.items.some((item) => item.id === id)));
    if (Array.isArray(saved.readDocuments)) this.readDocuments = new Set(saved.readDocuments.filter((id) => this.documents.some((doc) => doc.id === id)));
    if (Array.isArray(saved.doors)) {
      for (const state of saved.doors) {
        const door = this.getDoor(state.id);
        if (!door) continue;
        if (typeof state.open === "boolean") door.open = state.open;
        if (typeof state.locked === "boolean") door.locked = state.locked;
        if (typeof state.visible === "boolean") { door.visible = state.visible; door.hidden = !state.visible; }
      }
    }
  }
}
