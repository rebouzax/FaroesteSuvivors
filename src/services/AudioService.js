import {t} from "./I18n.js";
const FILES = {
  dog: new URL("../assets/audio/chupacabra.wav", import.meta.url),
  vulture: new URL("../assets/audio/vulture.wav", import.meta.url),
  whip: new URL("../assets/audio/whip.wav", import.meta.url),
  shot: new URL("../assets/audio/shot.wav", import.meta.url),
  arrow: new URL("../assets/audio/arrow.wav", import.meta.url),
  glass: new URL("../assets/audio/glass.wav", import.meta.url),
  fire: new URL("../assets/audio/fire.wav", import.meta.url),
  level: new URL("../assets/audio/level.wav", import.meta.url),
  purchase: new URL("../assets/audio/purchase.wav", import.meta.url),
  hurt: new URL("../assets/audio/hurt.wav", import.meta.url),
};
const MUSIC = {
  menu: new URL("../assets/audio/the-unmarked-cabin.mp3", import.meta.url),
  desert: new URL("../assets/audio/seven-black-graves.mp3", import.meta.url),
  mine: new URL("../assets/audio/under-the-silver-vein.mp3", import.meta.url),
  town: new URL("../assets/audio/the-devil-at-noon.mp3", import.meta.url),
  canyon: new URL("../assets/audio/seven-black-graves.mp3", import.meta.url),
  cemetery: new URL("../assets/audio/seven-black-graves.mp3", import.meta.url),
};
export const GAME_MUSIC_LOOPS = Object.freeze({ desert: {start:5,end:169}, mine: {start:4,end:176}, town: {start:0,end:176}, canyon:{start:5,end:169}, cemetery:{start:5,end:169} });
export class AudioService {
  constructor() {
    this.enabled = true;
    this.musicEnabled = true;
    this.ctx = null;
    this.buffers = {};
    this.track = "menu";
    this.musicSource = null;
    this.musicTracks = new Map();
    this.musicUnlocked = false;
    this.fireSource = null;
    this.active = new Set();
    this.paused = false;
    this.disposed = false;
    this.loading = null;
    this.failures = new Map();
    this.fireActive = false;
  }
  async unlock({ retry = false } = {}) {
    if (this.disposed) return false;
    try {
      if (!this.ctx) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) throw new Error("Este navegador não oferece Web Audio.");
        this.ctx = new Context();
        this.effectsGain = this.ctx.createGain();
        this.effectsGain.gain.value = 0.65;
        this.effectsGain.connect(this.ctx.destination);
        this.uiGain = this.ctx.createGain();
        this.uiGain.gain.value = 0.65;
        this.uiGain.connect(this.ctx.destination);
        this.setPaused(this.paused);
        this.ctx.onstatechange = () => {
          if (!this.disposed && this.ctx.state === "running") {
            this.syncMusic();
            this.setFire(this.fireActive);
          }
        };
      }
      // Must be invoked inside the user gesture, before fetching/awaiting files.
      const resumed =
        this.ctx.state === "running" ? Promise.resolve() : this.ctx.resume();
      // Streaming music starts during the interaction; long MP3s are not decoded
      // into large in-memory AudioBuffers on phones.
      this.musicUnlocked = true;
      this.syncMusic();
      if (!this.loading && (!this.loadAttempted || retry)) {
        this.loadAttempted = true;
        this.loading = this.loadFiles().finally(() => {
          this.loading = null;
        });
      }
      await resumed;
      await this.loading;
      if (this.disposed) return false;
      this.syncMusic();
      this.setFire(this.fireActive);
      return this.ctx.state === "running";
    } catch (error) {
      console.warn("Áudio indisponível nesta sessão.", error);
      return false;
    }
  }
  async loadFiles() {
    await Promise.all(
      Object.entries(FILES).map(async ([key, url]) => {
        if (this.buffers[key]) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const buffer = await this.ctx.decodeAudioData(
            await response.arrayBuffer(),
          );
          if (this.disposed) return;
          this.buffers[key] = buffer;
          this.failures.delete(key);
          // Start available tracks without waiting for unrelated files.
          this.syncMusic();
          this.setFire(this.fireActive);
        } catch (error) {
          this.failures.set(key, error.message);
          console.warn(`Falha ao carregar áudio ${key}: ${url}`, error);
        } finally {
          clearTimeout(timeout);
        }
      }),
    );
  }
  async test(lang='en') {
    const running = await this.unlock({ retry: true });
    if (!running) return t(lang,'audioBlocked');
    if (!this.enabled) return t(lang,'audioDisabled');
    if (!this.buffers.shot)
      return t(lang,'audioUnavailable');
    this.play("shot");
    return this.failures.size
      ? t(lang,'audioPartial',{count:this.failures.size})
      : t(lang,'audioSuccess');
  }
  source(key, bus, loop = false) {
    if (
      this.disposed ||
      !this.ctx ||
      !this.buffers[key] ||
      this.ctx.state !== "running"
    )
      return null;
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[key];
    source.loop = loop;
    source.connect(bus);
    source.start();
    return source;
  }
  play(type, { ui = false } = {}) {
    if (
      type === "fire" ||
      !this.enabled ||
      (this.paused && !ui) ||
      this.active.size >= 16
    )
      return;
    const source = this.source(type, ui ? this.uiGain : this.effectsGain);
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
      this.musicSource.pause();
      this.musicSource.currentTime = 0;
      this.musicSource = null;
      this.playingTrack = null;
    }
    if (!desired || !this.musicUnlocked || this.disposed) return;
    if (!this.musicSource && MUSIC[desired]) {
      if (!this.musicTracks.has(desired)) {
        const audio = new Audio(MUSIC[desired].href);
        audio.loop = !GAME_MUSIC_LOOPS[desired];
        audio.preload = "metadata";
        if (GAME_MUSIC_LOOPS[desired]) {
          audio.addEventListener("timeupdate", () => this.updateMusicLoop());
          audio.addEventListener("ended", () => {
            if (this.musicSource !== audio || this.disposed) return;
            audio.currentTime = GAME_MUSIC_LOOPS[desired].start;
            audio.play().catch(() => {});
          });
        }
        this.musicTracks.set(desired, audio);
      }
      this.musicSource = this.musicTracks.get(desired);
      this.playingTrack = desired;
    }
    if (!this.musicSource) return;
    this.musicSource.volume = this.paused ? 0.12 : 0.42;
    if (this.musicSource.paused)
      this.musicSource.play().catch((error) => {
        if (!this.disposed) console.warn("Música aguarda interação do usuário.", error);
      });
  }
  updateMusicLoop() {
    const loop = GAME_MUSIC_LOOPS[this.playingTrack];
    if (!loop || !this.musicSource) return;
    const audio = this.musicSource;
    if (audio.currentTime >= loop.end) {
      audio.currentTime = loop.start + (audio.currentTime - loop.end) % (loop.end - loop.start);
    }
  }
  setFire(active) {
    this.fireActive = active;
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
    }
    if (this.musicSource) this.musicSource.volume = paused ? 0.12 : 0.42;
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
  resume() {
    // Do not create a context before the first interaction.
    if (this.ctx && !this.disposed) return this.unlock();
  }
  dispose() {
    this.disposed = true;
    this.stopEffects();
    for (const audio of this.musicTracks.values()) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (this.ctx) this.ctx.onstatechange = null;
    this.ctx?.close().catch(() => {});
  }
}
