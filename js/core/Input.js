// Teclas físicas (event.code) funcionam em qualquer layout; event.key fica como reserva.
const CODE_MAP = new Map([
  ["KeyW", "up"], ["ArrowUp", "up"], ["KeyS", "down"], ["ArrowDown", "down"],
  ["KeyA", "left"], ["ArrowLeft", "left"], ["KeyD", "right"], ["ArrowRight", "right"],
  ["KeyE", "interact"], ["KeyF", "flashlight"], ["KeyI", "inventory"], ["Escape", "pause"]
]);
const KEY_MAP = new Map([
  ["w", "up"], ["arrowup", "up"], ["s", "down"], ["arrowdown", "down"],
  ["a", "left"], ["arrowleft", "left"], ["d", "right"], ["arrowright", "right"],
  ["e", "interact"], ["f", "flashlight"], ["i", "inventory"], ["escape", "pause"]
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.touch = { x: 0, y: 0 };
    this.activePointer = null;
    this.knob = null;
    this.stick = null;
    this.bound = false;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    const commandFor = (event) => CODE_MAP.get(event.code) ?? KEY_MAP.get(String(event.key).toLowerCase());
    const typingInField = (event) => /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "");
    window.addEventListener("keydown", (event) => {
      const command = commandFor(event);
      if (!command) return;
      if (typingInField(event) && command !== "pause") return; // não rouba teclas de campos de texto
      if (["up", "down", "left", "right", "interact", "flashlight", "inventory", "pause"].includes(command)) event.preventDefault();
      if (!this.held.has(command)) this.pressed.add(command);
      this.held.add(command);
    });
    window.addEventListener("keyup", (event) => {
      const command = commandFor(event);
      if (command) this.held.delete(command);
    });
    window.addEventListener("blur", () => this.reset());
    this.#bindJoystick();
    this.#bindTouchButton("touch-interact", "interact");
    this.#bindTouchButton("touch-flashlight", "flashlight");
    this.#bindTouchButton("touch-inventory", "inventory");
  }

  #bindJoystick() {
    this.stick = document.getElementById("touch-stick");
    this.knob = document.getElementById("stick-knob");
    if (!this.stick || !this.knob) return;
    const update = (event) => {
      const rect = this.stick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const limit = rect.width * 0.34;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const length = Math.hypot(dx, dy) || 1;
      const scale = Math.min(1, limit / length);
      this.touch.x = (dx * scale) / limit;
      this.touch.y = (dy * scale) / limit;
      this.knob.style.left = `calc(50% + ${dx * scale}px)`;
      this.knob.style.top = `calc(50% + ${dy * scale}px)`;
    };
    this.stick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.activePointer = event.pointerId;
      this.stick.setPointerCapture(event.pointerId);
      update(event);
    });
    this.stick.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.activePointer) update(event);
    });
    const release = (event) => {
      if (event.pointerId !== this.activePointer) return;
      this.activePointer = null;
      this.touch = { x: 0, y: 0 };
      this.knob.style.left = "50%";
      this.knob.style.top = "50%";
    };
    this.stick.addEventListener("pointerup", release);
    this.stick.addEventListener("pointercancel", release);
  }

  #bindTouchButton(id, command) {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.pressed.add(command);
    });
  }

  movement() {
    let x = (this.held.has("right") ? 1 : 0) - (this.held.has("left") ? 1 : 0) + this.touch.x;
    let y = (this.held.has("down") ? 1 : 0) - (this.held.has("up") ? 1 : 0) + this.touch.y;
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    return { x, y, moving: magnitude > 0.08 };
  }

  consume(command) {
    const value = this.pressed.has(command);
    this.pressed.delete(command);
    return value;
  }

  reset() {
    this.held.clear();
    this.pressed.clear();
    this.touch = { x: 0, y: 0 };
    this.activePointer = null;
    if (this.knob) { this.knob.style.left = "50%"; this.knob.style.top = "50%"; }
  }
}
