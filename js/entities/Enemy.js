import { distance, hasLineOfSight, moveWithCollisions } from "../world/Collision.js";

const STATE = Object.freeze({ PATROL: "patrol", INVESTIGATE: "investigate", CHASE: "chase", SEARCH: "search", RETURN: "return" });

export class Enemy {
  constructor(map, saved = null) {
    const start = map.roomCenter("hall");
    this.x = saved && Number.isFinite(saved.x) ? saved.x : start.x + 42;
    this.y = saved && Number.isFinite(saved.y) ? saved.y : start.y + 18;
    this.radius = 11;
    this.state = Object.values(STATE).includes(saved?.state) ? saved.state : STATE.PATROL;
    this.target = saved?.target && Number.isFinite(saved.target.x) ? { ...saved.target } : null;
    this.lastSeen = null;
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.patrolIndex = 0;
    this.animation = 0;
    this.speed = 69;
    this.awareness = 0;
    this.facingX = 1;
    this.lastRoomId = map.nearestRoom(this)?.id ?? "hall";
    this.stuckTime = 0;
    this.detour = null;
    this.patrol = [map.roomCenter("hall"), { ...map.roomCenter("hall"), x: map.roomCenter("hall").x - 105 }, { x: map.roomCenter("lobby").x - 100, y: map.roomCenter("lobby").y - 40 }, { ...map.roomCenter("hall"), x: map.roomCenter("hall").x + 105 }];
  }

  hear(point, radius, map = null) {
    if (this.state === STATE.CHASE || distance(this, point) > radius) return false;
    if (map) {
      // O som atravessa portas abertas, mas não paredes nem portas fechadas.
      const from = map.nearestRoom(this); const to = map.nearestRoom(point);
      if (from && to && from.id !== to.id && !map.roomPath(from.id, to.id, { generatorPowered: true })) return false;
      if (from && to && from.id === to.id && !hasLineOfSight(this, point, map.getSolidRects())) return false;
    }
    this.target = { ...point };
    this.state = STATE.INVESTIGATE;
    this.stateTimer = 4.6;
    return true;
  }

  update(dt, game) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.animation += dt;
    const player = game.player;
    const playerDistance = distance(this, player);
    const detectionRange = player.flashlightOn ? 300 : 185;
    const visible = playerDistance < detectionRange && hasLineOfSight(this, player, game.map.getSolidRects());

    const awarenessRate = playerDistance < 70 ? 6 : player.flashlightOn ? 2.4 : 1.5;
    this.awareness = visible ? Math.min(1, this.awareness + dt * awarenessRate) : Math.max(0, this.awareness - dt * 0.6);
    if (visible && this.state !== STATE.CHASE && this.awareness < 1) {
      this.target = { x: player.x, y: player.y };   // percebe algo: vira-se para o ponto
      if (this.state === STATE.PATROL || this.state === STATE.RETURN) { this.state = STATE.INVESTIGATE; this.stateTimer = 3; }
    }
    if (visible && this.awareness >= 1) {
      if (this.state !== STATE.CHASE) {
        game.audio?.play("warning");
        game.toast("Passos rápidos atravessam o corredor.", "warning");
      }
      this.state = STATE.CHASE;
      this.lastSeen = { x: player.x, y: player.y };
      this.target = this.lastSeen;
      this.stateTimer = 2.4;
    } else if (this.state === STATE.CHASE) {
      this.awareness = 0.6;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = STATE.SEARCH;
        this.target = this.lastSeen ? { ...this.lastSeen } : { x: this.x, y: this.y };
        this.stateTimer = 3.8;
      }
    }

    if (this.state === STATE.CHASE && playerDistance < 24 && this.attackCooldown <= 0) {
      if (player.takeDamage(1)) {
        game.audio?.play("attack");
        game.toast("Algo alcançou você.", "warning");
        this.attackCooldown = 1.6;
      }
    }

    if (this.state === STATE.PATROL) this.#patrolStep(dt, game);
    else if (this.state === STATE.INVESTIGATE) {
      this.stateTimer -= dt;
      if (this.target && this.#navigate(this.target, dt, game, 76)) { this.state = STATE.SEARCH; this.stateTimer = 2.4; }
      else if (this.stateTimer <= 0) this.state = STATE.RETURN;
    } else if (this.state === STATE.CHASE) {
      if (this.target) this.#navigate(this.target, dt, game, 98);
    } else if (this.state === STATE.SEARCH) {
      this.stateTimer -= dt;
      if (this.target && this.#navigate(this.target, dt, game, 61)) {
        const angle = (Math.floor(this.stateTimer * 3) % 4) * (Math.PI / 2);
        this.target = { x: (this.lastSeen?.x || this.x) + Math.cos(angle) * 43, y: (this.lastSeen?.y || this.y) + Math.sin(angle) * 43 };
      }
      if (this.stateTimer <= 0) this.state = STATE.RETURN;
    } else if (this.state === STATE.RETURN) {
      const patrolTarget = this.#reachablePatrolPoint(game);
      if (this.#navigate(patrolTarget, dt, game, 63)) this.state = STATE.PATROL;
    }
  }

  /** Primeiro ponto de patrulha alcançável (portas fechadas não congelam mais o inimigo). */
  #reachablePatrolPoint(game) {
    for (let i = 0; i < this.patrol.length; i += 1) {
      const index = (this.patrolIndex + i) % this.patrol.length;
      if (this.#canReach(this.patrol[index], game)) { this.patrolIndex = index; return this.patrol[index]; }
    }
    return game.map.roomCenter(this.lastRoomId); // preso numa sala: ronda pelo centro dela
  }

  #canReach(target, game) {
    const from = game.map.nearestRoom(this); const to = game.map.nearestRoom(target);
    return !from || !to || from.id === to.id || Boolean(game.map.roomPath(from.id, to.id, game.flags));
  }

  #patrolStep(dt, game) {
    const target = this.#reachablePatrolPoint(game);
    if (this.#navigate(target, dt, game, 58)) this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
  }

  /**
   * Caminha até o alvo. Entre salas, atravessa cada porta em dois tempos:
   * alinha-se num ponto antes da porta e depois segue para um ponto além dela.
   */
  #navigate(target, dt, game, speed) {
    const map = game.map;
    const inside = map.getRoomAt(this);
    if (inside) this.lastRoomId = inside.id;
    const myRoom = map.getRoom(this.lastRoomId);
    const targetRoom = map.nearestRoom(target);
    let waypoint = target;
    if (myRoom && targetRoom && myRoom.id !== targetRoom.id) {
      const route = map.roomPath(myRoom.id, targetRoom.id, game.flags);
      if (!route || !route.length) return false;
      waypoint = this.#doorWaypoint(route[0].door, map.getRoom(route[0].roomId));
    }
    const arrived = this.#stepTowards(waypoint, dt, game, speed);
    return distance(this, target) < 22 || (arrived && waypoint === target);
  }

  #doorWaypoint(door, nextRoom) {
    const vertical = door.axis === "vertical";
    const nextCenter = { x: nextRoom.rect.x + nextRoom.rect.w / 2, y: nextRoom.rect.y + nextRoom.rect.h / 2 };
    const dir = vertical ? Math.sign(nextCenter.x - door.x) : Math.sign(nextCenter.y - door.y);
    const along = vertical ? (this.x - door.x) * dir : (this.y - door.y) * dir;
    const lateral = Math.abs(vertical ? this.y - door.y : this.x - door.x);
    const point = (offset) => vertical ? { x: door.x + dir * offset, y: door.y } : { x: door.x, y: door.y + dir * offset };
    if (along < -8 && lateral > 10) return point(-36); // alinhar antes da porta
    return point(40);                                    // atravessar para a outra sala
  }

  #stepTowards(waypoint, dt, game, speed) {
    let goal = waypoint;
    if (this.detour && (game.elapsedTime ?? 0) > this.detour.until) this.detour = null;
    if (this.detour) goal = this.detour.points[0];
    const dx = goal.x - this.x; const dy = goal.y - this.y;
    const length = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.5) this.facingX = Math.sign(dx);
    if (length < 4) {
      if (this.detour && goal !== waypoint) { this.detour.points.shift(); if (!this.detour.points.length) this.detour = null; return false; }
      return true;
    }
    const step = Math.min(length, speed * dt);
    const before = { x: this.x, y: this.y };
    moveWithCollisions(this, (dx / length) * step, (dy / length) * step, () => game.map.getSolidRects());
    const moved = Math.hypot(this.x - before.x, this.y - before.y);
    this.stuckTime = moved < step * 0.3 ? this.stuckTime + dt : 0;
    if (this.stuckTime > 0.25 && !this.detour) {
      this.detour = this.#detourAround(waypoint, game);
      this.stuckTime = 0;
    }
    return goal === waypoint && length - step < 4;
  }

  /** Escolhe a quina do obstáculo que bloqueia o caminho, a que dá o menor desvio até o alvo. */
  #detourAround(goal, game) {
    const solids = game.map.getSolidRects();
    const dx = goal.x - this.x; const dy = goal.y - this.y; const len = Math.hypot(dx, dy) || 1;
    const probe = { x: this.x + (dx / len) * (this.radius + 4), y: this.y + (dy / len) * (this.radius + 4) };
    const blocker = solids.find((r) => probe.x > r.x - this.radius && probe.x < r.x + r.w + this.radius && probe.y > r.y - this.radius && probe.y < r.y + r.h + this.radius);
    const now = game.elapsedTime ?? 0;
    if (!blocker) return { points: [{ x: this.x - dy / len * 60, y: this.y + dx / len * 60 }], until: now + 0.8 };
    const pad = this.radius + 10; let best = null;
    for (const sx of [0, 1]) for (const sy of [0, 1]) {
      const point = { x: blocker.x + sx * blocker.w + (sx ? pad : -pad), y: blocker.y + sy * blocker.h + (sy ? pad : -pad) };
      const cost = distance(this, point) + distance(point, goal);
      if (!best || cost < best.cost) best = { point, cost };
    }
    // 1ª perna: desliza ao longo da face que bloqueia; 2ª: contorna a quina.
    const horizontalMove = Math.abs(dx) > Math.abs(dy);
    const slide = horizontalMove ? { x: this.x, y: best.point.y } : { x: best.point.x, y: this.y };
    return { points: [slide, best.point], until: now + 4 };
  }

  serialize() { return { x: this.x, y: this.y, state: this.state, target: this.target ? { ...this.target } : null }; }
  get stateLabel() { return ({ patrol: "patrulha", investigate: "investigação", chase: "perseguição", search: "busca", return: "retorno" })[this.state] || "patrulha"; }
}
