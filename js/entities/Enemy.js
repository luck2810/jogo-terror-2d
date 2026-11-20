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
    this.patrol = [map.roomCenter("hall"), { ...map.roomCenter("hall"), x: map.roomCenter("hall").x - 105 }, map.roomCenter("lobby"), { ...map.roomCenter("hall"), x: map.roomCenter("hall").x + 105 }];
  }

  hear(point, radius, map = null) {
    if (this.state === STATE.CHASE || distance(this, point) > radius) return false;
    if (map && !hasLineOfSight(this, point, map.getSolidRects())) return false;
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

    if (visible) {
      if (this.state !== STATE.CHASE) {
        game.audio?.play("warning");
        game.toast("Passos rápidos atravessam o corredor.", "warning");
      }
      this.state = STATE.CHASE;
      this.lastSeen = { x: player.x, y: player.y };
      this.target = this.lastSeen;
      this.stateTimer = 2.4;
    } else if (this.state === STATE.CHASE) {
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
      if (this.target) this.#navigate(this.target, dt, game, 86);
    } else if (this.state === STATE.SEARCH) {
      this.stateTimer -= dt;
      if (this.target && this.#navigate(this.target, dt, game, 61)) {
        const angle = (Math.floor(this.stateTimer * 3) % 4) * (Math.PI / 2);
        this.target = { x: (this.lastSeen?.x || this.x) + Math.cos(angle) * 43, y: (this.lastSeen?.y || this.y) + Math.sin(angle) * 43 };
      }
      if (this.stateTimer <= 0) this.state = STATE.RETURN;
    } else if (this.state === STATE.RETURN) {
      const patrolTarget = this.patrol[this.patrolIndex % this.patrol.length];
      if (this.#navigate(patrolTarget, dt, game, 63)) this.state = STATE.PATROL;
    }
  }

  #patrolStep(dt, game) {
    const target = this.patrol[this.patrolIndex % this.patrol.length];
    if (this.#navigate(target, dt, game, 58)) this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
  }

  #navigate(target, dt, game, speed) {
    const myRoom = game.map.getRoomAt(this);
    const targetRoom = game.map.getRoomAt(target);
    let waypoint = target;
    if (myRoom && targetRoom && myRoom.id !== targetRoom.id) {
      const route = game.map.roomPath(myRoom.id, targetRoom.id, game.flags);
      if (!route || !route.length) return false;
      waypoint = route[0].door;
    }
    const dx = waypoint.x - this.x;
    const dy = waypoint.y - this.y;
    const length = Math.hypot(dx, dy);
    if (length < 16) return distance(this, target) < 26;
    const step = Math.min(length, speed * dt);
    moveWithCollisions(this, (dx / length) * step, (dy / length) * step, () => game.map.getSolidRects());
    return distance(this, target) < 22;
  }

  serialize() { return { x: this.x, y: this.y, state: this.state, target: this.target ? { ...this.target } : null }; }
  get stateLabel() { return ({ patrol: "patrulha", investigate: "investigação", chase: "perseguição", search: "busca", return: "retorno" })[this.state] || "patrulha"; }
}
