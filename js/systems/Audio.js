export class AudioEngine {
  constructor(settings = {}) {
    this.settings = { master: 0.8, ambience: 0.35, effects: 0.7, ...settings };
    this.context = null;
    this.master = null;
    this.ambience = null;
    this.effects = null;
    this.started = false;
    this.nodes = [];
    this.musicTimer = null;
    this.musicStep = 0;
  }

  async resume() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.context) {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.ambience = this.context.createGain();
      this.effects = this.context.createGain();
      this.ambience.connect(this.master);
      this.effects.connect(this.master);
      this.master.connect(this.context.destination);
      this.setVolumes(this.settings);
    }
    try {
      await this.context.resume();
      return true;
    } catch {
      return false;
    }
  }

  async startAmbience() {
    if (!(await this.resume()) || this.started) return;
    this.started = true;
    const ctx = this.context;
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    drone.type = "triangle";
    drone.frequency.value = 42;
    filter.type = "lowpass";
    filter.frequency.value = 190;
    droneGain.gain.value = 0.18;
    drone.connect(filter).connect(droneGain).connect(this.ambience);
    drone.start();
    this.nodes.push(drone);

    const bufferLength = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let carry = 0;
    for (let i = 0; i < bufferLength; i += 1) {
      carry = (carry + (Math.random() * 2 - 1) * 0.028) * 0.985;
      data[i] = carry;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 285;
    windFilter.Q.value = 0.65;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.17;
    noise.connect(windFilter).connect(windGain).connect(this.ambience);
    noise.start();
    this.nodes.push(noise);

    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = "sine";
    hum.frequency.value = 58.3;
    humGain.gain.value = 0.035;
    hum.connect(humGain).connect(this.ambience);
    hum.start();
    this.nodes.push(hum);

    this.#playAmbientNote();
    this.musicTimer = window.setInterval(() => this.#playAmbientNote(), 5600);
  }

  #playAmbientNote() {
    if (!this.context || this.context.state !== "running" || !this.ambience) return;
    const tones = [110, 146.83, 130.81, 164.81, 123.47];
    const ctx = this.context;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    overtone.type = "triangle";
    osc.frequency.value = tones[this.musicStep % tones.length];
    overtone.frequency.value = tones[this.musicStep % tones.length] * 1.502;
    this.musicStep += 1;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 1.2);
    gain.gain.setTargetAtTime(0.0001, now + 2.5, 0.7);
    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(this.ambience);
    osc.start(now);
    overtone.start(now);
    osc.stop(now + 4.8);
    overtone.stop(now + 4.8);
    osc.onended = () => { osc.disconnect(); overtone.disconnect(); gain.disconnect(); };
  }

  async play(kind) {
    if (!this.context || this.context.state !== "running") await this.resume();
    if (!this.context || this.context.state !== "running") return;
    const ctx = this.context;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const config = {
      step: [90, 52, "triangle", 0.045], door: [128, 66, "triangle", 0.12],
      pickup: [520, 300, "sine", 0.12], interact: [330, 270, "sine", 0.07],
      attack: [73, 34, "sawtooth", 0.24], radio: [250, 870, "sine", 0.42],
      click: [470, 390, "sine", 0.055], power: [74, 128, "sawtooth", 0.45],
      error: [180, 110, "square", 0.12], warning: [105, 72, "triangle", 0.36]
    }[kind] || [300, 200, "sine", 0.08];
    osc.type = config[2];
    osc.frequency.setValueAtTime(config[0], now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, config[1]), now + config[3]);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "attack" ? 0.34 : 0.13, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config[3] + 0.04);
    osc.connect(gain).connect(this.effects);
    osc.start(now);
    osc.stop(now + config[3] + 0.05);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  setVolumes(settings) {
    this.settings = { ...this.settings, ...settings };
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.master, now, 0.03);
    this.ambience.gain.setTargetAtTime(this.settings.ambience, now, 0.03);
    this.effects.gain.setTargetAtTime(this.settings.effects, now, 0.03);
  }

  toggleMaster() {
    const next = this.settings.master > 0 ? 0 : 0.8;
    this.setVolumes({ master: next });
    return next > 0;
  }

  close() {
    window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    for (const node of this.nodes) { try { node.stop(); } catch {} }
    this.nodes = [];
    this.context?.close().catch(() => {});
    this.context = null;
    this.started = false;
  }
}
