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
    this.muted = false;
    this.droneGain = null; this.droneFilter = null; this.humGain = null;
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
    this.droneGain = droneGain; this.droneFilter = filter;

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
    this.humGain = humGain;

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

  /** Sobe a tensão do ambiente (0..1): graves mais altos e zumbido mais forte perto do perigo. */
  setTension(level) {
    if (!this.context || !this.droneGain) return;
    const now = this.context.currentTime; const v = Math.max(0, Math.min(1, level));
    this.droneGain.gain.setTargetAtTime(0.18 + 0.22 * v, now, 0.5);
    this.droneFilter.frequency.setTargetAtTime(190 + 260 * v, now, 0.5);
    this.humGain.gain.setTargetAtTime(0.035 + 0.06 * v, now, 0.5);
  }

  /** Sons feitos de ruído filtrado (passos, sussurros, rangidos). */
  #playNoise(kind, options = {}) {
    const ctx = this.context; const now = ctx.currentTime;
    const cfg = {
      step: { from: 320, to: 180, q: 1.2, dur: 0.09, gain: 0.16, type: "bandpass" },
      knock: { from: 160, to: 90, q: 3, dur: 0.12, gain: 0.5, type: "lowpass" },
      whisper: { from: 2400, to: 900, q: 5, dur: 1.5, gain: 0.07, type: "bandpass", attack: 0.5 },
      creak: { from: 380, to: 760, q: 12, dur: 0.9, gain: 0.08, type: "bandpass", attack: 0.25 }
    }[kind];
    const length = Math.max(1, Math.floor(ctx.sampleRate * (cfg.dur + 0.1)));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(); source.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = cfg.type; filter.Q.value = cfg.q;
    filter.frequency.setValueAtTime(cfg.from, now);
    filter.frequency.exponentialRampToValueAtTime(cfg.to, now + cfg.dur);
    const gain = ctx.createGain(); const peak = cfg.gain * Math.max(0.05, Math.min(1.5, options.volume ?? 1));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + (cfg.attack ?? 0.01));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);
    source.connect(filter).connect(gain);
    let output = gain; let panner = null;
    if (Number.isFinite(options.pan) && ctx.createStereoPanner) { panner = ctx.createStereoPanner(); panner.pan.value = Math.max(-1, Math.min(1, options.pan)); gain.connect(panner); output = panner; }
    output.connect(this.effects);
    source.start(now); source.stop(now + cfg.dur + 0.05);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); panner?.disconnect(); };
  }

  async play(kind, options = {}) {
    if (!this.context || this.context.state !== "running") await this.resume();
    if (!this.context || this.context.state !== "running") return;
    if (["step", "knock", "whisper", "creak"].includes(kind)) return this.#playNoise(kind, options);
    const ctx = this.context;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const config = {
      step: [90, 52, "triangle", 0.045], door: [128, 66, "triangle", 0.12],
      pickup: [520, 300, "sine", 0.12], interact: [330, 270, "sine", 0.07],
      attack: [73, 34, "sawtooth", 0.24], radio: [250, 870, "sine", 0.42],
      click: [470, 390, "sine", 0.055], power: [74, 128, "sawtooth", 0.45],
      error: [180, 110, "square", 0.12], warning: [105, 72, "triangle", 0.36],
      enemyStep: [64, 38, "triangle", 0.1], heart: [58, 34, "sine", 0.16]
    }[kind] || [300, 200, "sine", 0.08];
    osc.type = config[2];
    osc.frequency.setValueAtTime(config[0], now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, config[1]), now + config[3]);
    gain.gain.setValueAtTime(0.0001, now);
    const peak = (kind === "attack" ? 0.34 : 0.13) * Math.max(0.05, Math.min(1.5, options.volume ?? 1));
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config[3] + 0.04);
    let output = gain; let panner = null;
    if (Number.isFinite(options.pan) && ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, options.pan));
      gain.connect(panner); output = panner;
    }
    osc.connect(gain); output.connect(this.effects);
    osc.start(now);
    osc.stop(now + config[3] + 0.05);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); panner?.disconnect(); };
  }

  setVolumes(settings) {
    this.settings = { ...this.settings, ...settings };
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.settings.master, now, 0.03);
    this.ambience.gain.setTargetAtTime(this.settings.ambience, now, 0.03);
    this.effects.gain.setTargetAtTime(this.settings.effects, now, 0.03);
  }

  toggleMaster() {
    this.muted = !this.muted; // mantém o volume escolhido pelo jogador
    this.setVolumes({});
    return !this.muted;
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
