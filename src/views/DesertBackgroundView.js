// Procedural 2D menu backdrop. No textures, image downloads or Three.js dependency.
// Scene coordinates are normalized to 1600 × 1000; rendering scales to the viewport.
export class DesertBackgroundView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.staticLayer = document.createElement("canvas");
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.wind = true;
    this.time = 0;
    this.frame = 0;
    this.last = null;
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    window.addEventListener("resize", () => this.resize(), options);
    document.addEventListener("visibilitychange", () => this.sync(), options);
    this.motion.addEventListener("change", () => this.sync(), options);
    this.resize();
    this.sync();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.width = innerWidth;
    this.height = innerHeight;
    for (const canvas of [this.canvas, this.staticLayer]) {
      canvas.width = Math.round(this.width * dpr);
      canvas.height = Math.round(this.height * dpr);
    }
    const ctx = this.staticLayer.getContext("2d");
    ctx.setTransform(
      this.staticLayer.width / 1600,
      0,
      0,
      this.staticLayer.height / 1000,
      0,
      0,
    );
    this.paintLandscape(ctx);
    this.draw();
  }

  polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }

  mesa(ctx, x, y, width, height, color) {
    const points = [
      [0, 1],
      [0.09, 0.7],
      [0.19, 0.67],
      [0.25, 0.19],
      [0.33, 0.02],
      [0.48, 0],
      [0.58, 0.13],
      [0.64, 0.4],
      [0.88, 0.5],
      [1, 1],
    ];
    this.polygon(
      ctx,
      points.map(([px, py]) => [x + px * width, y + py * height]),
      color,
    );
    this.polygon(
      ctx,
      [
        [x + 0.48 * width, y],
        [x + 0.58 * width, y + 0.13 * height],
        [x + 0.64 * width, y + 0.4 * height],
        [x + 0.88 * width, y + 0.5 * height],
        [x + width, y + height],
        [x + 0.5 * width, y + height],
        [x + 0.56 * width, y + 0.5 * height],
      ],
      "#713f3228",
    );
    for (let i = 0; i < 4; i++) {
      this.polygon(
        ctx,
        [
          [x + (0.28 + i * 0.02) * width, y + (0.24 + i * 0.16) * height],
          [x + 0.51 * width, y + (0.2 + i * 0.16) * height],
          [x + 0.49 * width, y + (0.24 + i * 0.16) * height],
          [x + 0.27 * width, y + (0.28 + i * 0.16) * height],
        ],
        "#ffd29420",
      );
    }
  }

  dune(ctx, y, color, phase) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(400, y - 90 * phase, 1000, y + 100 * phase, 1600, y - 30);
    ctx.lineTo(1600, 1000);
    ctx.lineTo(0, 1000);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  cactus(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -130);
    ctx.moveTo(0, -54);
    ctx.quadraticCurveTo(-35, -50, -35, -80);
    ctx.lineTo(-35, -105);
    ctx.moveTo(0, -80);
    ctx.quadraticCurveTo(30, -77, 30, -105);
    ctx.lineTo(30, -125);
    ctx.stroke();
    ctx.strokeStyle = "#edcb8425";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-3, -8);
    ctx.lineTo(-3, -125);
    ctx.stroke();
    ctx.restore();
  }

  paintLandscape(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 1000);
    sky.addColorStop(0, "#c98a5e");
    sky.addColorStop(0.42, "#ffe8ad");
    sky.addColorStop(1, "#da9955");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1600, 1000);
    const glow = ctx.createRadialGradient(1030, 285, 20, 1030, 285, 340);
    glow.addColorStop(0, "#fff8cc");
    glow.addColorStop(0.4, "#fff0bd80");
    glow.addColorStop(1, "#ffdd9700");
    ctx.fillStyle = glow;
    ctx.fillRect(500, 0, 1100, 650);
    ctx.fillStyle = "#fff2bb";
    ctx.beginPath();
    ctx.arc(1030, 285, 104, 0, Math.PI * 2);
    ctx.fill();
    this.dune(ctx, 435, "#ddba80", 1);
    this.mesa(ctx, -130, 330, 570, 240, "#d7ab77");
    this.mesa(ctx, 1180, 360, 500, 230, "#d2a272");
    this.dune(ctx, 545, "#d9ac72", -1);
    this.mesa(ctx, 590, 455, 340, 215, "#c89463");
    this.mesa(ctx, 880, 480, 220, 200, "#c08b5d");
    this.mesa(ctx, 1190, 365, 410, 385, "#ad704b");
    this.mesa(ctx, 1430, 285, 370, 490, "#a56646");
    this.dune(ctx, 700, "#e3b277", 1);
    this.dune(ctx, 758, "#d79c61", -1);
    this.dune(ctx, 790, "#efbe7c", 1);
    this.cactus(ctx, 1080, 760, 0.46, "#8e8754");
    this.cactus(ctx, 870, 815, 0.36, "#96905b");
    this.cactus(ctx, 1440, 850, 1.48, "#666644");
    this.dune(ctx, 897, "#e5ab68", -0.8);
    this.dune(ctx, 948, "#dc9c5d", 1);
    this.cactus(ctx, 1310, 950, 0.9, "#75764b");
    this.cactus(ctx, 1270, 960, 0.57, "#818454");
    this.cactus(ctx, 1350, 963, 0.68, "#6f754a");
    // Foreground dry grasses, deterministic so resize doesn't randomize the scene.
    ctx.strokeStyle = "#94643e80";
    ctx.lineWidth = 2;
    for (let i = 0; i < 38; i++) {
      const x = 1230 + (i % 7) * 14,
        spread = Math.sin(i * 8.2) * 72;
      ctx.beginPath();
      ctx.moveTo(x, 985);
      ctx.quadraticCurveTo(
        x + spread * 0.5,
        954,
        x + spread,
        930 - Math.sin(i) * 25,
      );
      ctx.stroke();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.staticLayer, 0, 0);
    if (!this.wind || this.motion.matches) return;
    ctx.setTransform(
      this.canvas.width / 1600,
      0,
      0,
      this.canvas.height / 1000,
      0,
      0,
    );
    // Wind ribbons and small grains drift at different speeds to suggest depth.
    for (let i = 0; i < 34; i++) {
      const x = ((i * 173.7 + this.time * (35 + (i % 5) * 13)) % 1950) - 180;
      const y = 610 + ((i * 61) % 370) + Math.sin(this.time * 0.6 + i) * 8;
      ctx.strokeStyle = `rgba(255,233,185,${0.06 + (i % 4) * 0.025})`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 40, y - 8, x + 100, y + 5, x + 180, y - 4);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffecc37a";
    for (let i = 0; i < 100; i++) {
      const x = ((i * 137.31 + this.time * (42 + (i % 7) * 12)) % 1650) - 25;
      const y = 530 + ((i * 53.4) % 470) + Math.sin(this.time + i) * 3;
      ctx.fillRect(x, y, 1 + (i % 3), 1);
    }
  }

  tick = (now) => {
    if (this.last !== null)
      this.time += Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  sync() {
    cancelAnimationFrame(this.frame);
    this.last = null;
    this.draw();
    if (this.wind && !this.motion.matches && !document.hidden)
      this.frame = requestAnimationFrame(this.tick);
  }
  setWind(enabled) {
    if (this.wind !== enabled) {
      this.wind = enabled;
      this.sync();
    }
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.controller.abort();
  }
}
