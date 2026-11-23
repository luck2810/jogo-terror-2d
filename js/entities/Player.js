import { moveWithCollisions } from "../world/Collision.js";

export class Player {
  constructor(state = {}) {
    this.x = Number.isFinite(state.x) ? state.x : 210;
    this.y = Number.isFinite(state.y) ? state.y : 190;
    this.radius = 10;
    this.speed = 112;
    this.maxHealth = 3;
    this.health = Number.isFinite(state.health) ? Math.max(0, Math.min(3, state.health)) : 3;
    this.battery = 100;
    this.flashlightOn = Boolean(state.flashlightOn);
    this.facing = state.facing && Number.isFinite(state.facing.x) ? { ...state.facing } : { x: 1, y: 0 };
    this.walkTime = 0;
    this.invulnerableFor = 0;
    this.moving = false;
  }

  update(dt, movement, map) {
    this.invulnerableFor = Math.max(0, this.invulnerableFor - dt);
    this.moving = Boolean(movement.moving);
    if (movement.moving) {
      this.facing = { x: movement.x, y: movement.y };
      const delta = movement.x * this.speed * dt;
      const deltaY = movement.y * this.speed * dt;
      moveWithCollisions(this, delta, deltaY, () => map.getSolidRects());
      this.walkTime += dt;
    }
  }

  toggleFlashlight() {
    if (this.flashlightOn) { this.flashlightOn = false; return true; }
    this.flashlightOn = true;
    return true;
  }

  takeDamage(amount = 1) {
    if (this.invulnerableFor > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableFor = 1.15;
    return true;
  }

  heal(amount = 1) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  rechargeBattery(amount) {
    this.battery = Math.min(100, this.battery + amount);
  }

  serialize() {
    return {
      x: this.x, y: this.y, health: this.health, battery: this.battery,
      flashlightOn: this.flashlightOn, facing: { ...this.facing }
    };
  }
}
