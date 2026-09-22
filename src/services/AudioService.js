const FILES = {
  menu: new URL("../assets/audio/menu-western.wav", import.meta.url),
  game: new URL("../assets/audio/desert-western.wav", import.meta.url),
  whip: new URL("../assets/audio/whip.wav", import.meta.url),
  shot: new URL("../assets/audio/shot.wav", import.meta.url),
  glass: new URL("../assets/audio/glass.wav", import.meta.url),
  fire: new URL("../assets/audio/fire.wav", import.meta.url),
  level: new URL("../assets/audio/level.wav", import.meta.url),
  purchase: new URL("../assets/audio/purchase.wav", import.meta.url),
  hurt: new URL("../assets/audio/hurt.wav", import.meta.url),
};
export class AudioService {
  constructor() {
    this.enabled = true;
    this.musicEnabled = true;
    this.ctx = null;
    this.buffers = {};
    this.track = "menu";
    this.musicSource = null;
    this.fireSource = null;
    this.active = new Set();
    this.paused = false;
    this.disposed = false;
  }
  async unlock() {
    if (this.disposed) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.effectsGain = this.ctx.createGain();
        this.effectsGain.gain.value = 0.65;
        this.effectsGain.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.42;
        this.musicGain.connect(this.ctx.destination);
        this.loading = Promise.allSettled(
          Object.entries(FILES).map(async ([key, url]) => {
            const response = await fetch(url);
            if (!response.ok) throw Error(`Audio ${key}: ${response.status}`);
            this.buffers[key] = await this.ctx.decodeAudioData(
              await response.arrayBuffer(),
            );
          }),
        );
      }
      await this.ctx.resume();
      await this.loading;
      if (!this.disposed) this.syncMusic();
    } catch (error) {
      console.warn("Áudio indisponível nesta sessão.", error);
    }
  }
  source(key, bus, loop = false) {
    if (!this.ctx || !this.buffers[key] || this.ctx.state !== "running")
      return null;
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[key];
    source.loop = loop;
    source.connect(bus);
    source.start();
    return source;
  }
  play(type) {
    if (
      type === "fire" ||
      !this.enabled ||
      this.paused ||
      this.active.size >= 16
    )
      return;
    const source = this.source(type, this.effectsGain);
    if (!source) return;
    this.active.add(source);
    source.onended = () => {
      this.active.delete(source);
      source.disconnect();
    };
  }
  setMusic(track) {
    this.track = track;
    this.syncMusic();
  }
  syncMusic() {
    const desired = this.musicEnabled ? this.track : null;
    if (this.musicSource && this.playingTrack !== desired) {
      this.musicSource.stop();
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    if (desired && !this.musicSource) {
      this.musicSource = this.source(desired, this.musicGain, true);
      if (this.musicSource) this.playingTrack = desired;
    }
  }
  setFire(active) {
    if (active && this.enabled && !this.paused && !this.fireSource)
      this.fireSource = this.source("fire", this.effectsGain, true);
    if ((!active || !this.enabled || this.paused) && this.fireSource) {
      this.fireSource.stop();
      this.fireSource.disconnect();
      this.fireSource = null;
    }
  }
  setPaused(paused) {
    this.paused = paused;
    if (this.ctx) {
      this.effectsGain.gain.setTargetAtTime(
        this.enabled && !paused ? 0.65 : 0,
        this.ctx.currentTime,
        0.05,
      );
      this.musicGain.gain.setTargetAtTime(
        paused ? 0.12 : 0.42,
        this.ctx.currentTime,
        0.15,
      );
    }
    if (paused) this.setFire(false);
  }
  setPreferences(sound, music) {
    this.enabled = sound;
    this.musicEnabled = music;
    this.setPaused(this.paused);
    if (!sound) this.setFire(false);
    this.syncMusic();
  }
  stopEffects() {
    for (const source of this.active) {
      source.stop();
      source.disconnect();
    }
    this.active.clear();
    this.setFire(false);
  }
  suspend() {
    this.ctx?.suspend().catch(() => {});
  }
  dispose() {
    this.disposed = true;
    this.stopEffects();
    this.musicSource?.stop();
    this.ctx?.close().catch(() => {});
  }
}
