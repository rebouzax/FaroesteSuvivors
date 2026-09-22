export class AudioService {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  unlock() {
    try {
      this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      this.ctx.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  play(type) {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    const ctx = this.ctx,
      t = ctx.currentTime,
      gain = ctx.createGain();
    gain.connect(ctx.destination);
    if (type === "whip") {
      const duration = 0.16,
        buffer = ctx.createBuffer(
          1,
          Math.ceil(ctx.sampleRate * duration),
          ctx.sampleRate,
        ),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp((-i / data.length) * 7);
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter();
      source.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 1100;
      source.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      source.start(t);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } else {
      const oscillator = ctx.createOscillator();
      oscillator.type = type === "hurt" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(type === "hurt" ? 130 : 520, t);
      oscillator.frequency.exponentialRampToValueAtTime(
        type === "hurt" ? 55 : 1040,
        t + 0.2,
      );
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      oscillator.connect(gain);
      oscillator.start(t);
      oscillator.stop(t + 0.26);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }
  dispose() {
    this.ctx?.close().catch(() => {});
  }
}
