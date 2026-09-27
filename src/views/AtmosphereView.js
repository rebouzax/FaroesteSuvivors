import * as THREE from "three";
import { MAPS } from "../config/mapConfig.js";

// Stage-wide motes add depth without adding a texture download or a draw call
// per particle. The light sprite is generated once in memory.
export class AtmosphereView {
  constructor(scene, mapId, quality, coarsePointer) {
    this.ghostTown=mapId==='town';
    this.count = quality === "high" ? (coarsePointer ? 112 : 224) : this.ghostTown?72:0;
    if (!this.count) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const context = canvas.getContext("2d");
    const glow = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.2, "rgba(255,255,255,.82)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 32, 32);
    this.texture = new THREE.CanvasTexture(canvas);
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.seeds = Array.from({ length: this.count }, (_, i) => ({
      x: Math.sin(i * 91.71) * 23,
      z: Math.cos(i * 53.17) * 22,
      y: 0.18 + (i % 17) * 0.22,
      phase: i * 2.39996,
      speed: 0.25 + (i % 9) * 0.035,
    }));
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    const color = new THREE.Color(MAPS[mapId].warm);
    this.points = new THREE.Points(
      this.geometry,
      new THREE.PointsMaterial({
        color,
        map: this.texture,
        size: this.ghostTown?1.5:0.38,
        transparent: true,
        opacity: this.ghostTown?.17:0.52,
        blending: this.ghostTown?THREE.NormalBlending:THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  update(run, time) {
    if (!this.count) return;
    const points = this.geometry.attributes.position;
    for (let i = 0; i < this.count; i++) {
      const seed = this.seeds[i];
      points.setXYZ(
        i,
        run.player.x + (this.ghostTown?((seed.x+time*(2+seed.speed)+10000)%48)-24:seed.x+Math.sin(time*seed.speed+seed.phase)*.65),
        this.ghostTown?.15+seed.y*.25:seed.y+Math.sin(time*1.7+seed.phase)*.24,
        run.player.z + seed.z + Math.cos(time * seed.speed + seed.phase) * (this.ghostTown?1.3:.65),
      );
    }
    points.needsUpdate = true;
  }
}
