import * as THREE from "three";
import { CONFIG } from "../config/gameConfig.js";
import { disposeObject } from "./CharacterFactory.js";
import {
  createCowboyRig,
  animateCowboy,
  disposeCowboyRig,
} from "./CowboyRig.js";
import { AbilityEffectsView } from "./AbilityEffectsView.js";
import { EnemyAssetView } from "./EnemyAssetView.js";
import { MapMerchantView } from "./MapMerchantView.js";
import { buildDesertWorld } from "./DesertWorldView.js";
import { buildOtherWorld } from "./OtherWorldView.js";
import { WorldEventsView } from "./WorldEventsView.js";
import { MAPS } from "../config/mapConfig.js";

export class GameView {
  constructor(host, run) {
    this.host = host;
    this.run = run;
    this.enemyViews = new Map();
    this.enemyPools = new Map();
    this.enemyAssets = new EnemyAssetView();
    this.dummy = new THREE.Object3D();
    this.coarsePointer = matchMedia("(pointer: coarse)").matches;
    this.maxPixelRatio = Math.min(
      devicePixelRatio || 1,
      this.coarsePointer ? 1.1 : innerWidth < 960 ? 1.25 : 1.45,
    );
    this.pixelRatio = this.maxPixelRatio;
    this.sampleFrames = 0;
    this.sampleDuration = 0;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.coarsePointer,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    const palette = MAPS[run.mapId];
    this.renderer.setClearColor(palette.sky);
    host.prepend(this.renderer.domElement);
    this.renderer.domElement.className = "game-canvas";
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(
      palette.fog,
      run.mapId === "mine" ? 35 : 55,
      run.mapId === "mine" ? 92 : 115,
    );
    this.camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 200);
    this.scene.add(
      new THREE.HemisphereLight(
        palette.ambient,
        0x635347,
        run.mapId === "mine" ? 1.65 : 2.4,
      ),
    );
    const sun = new THREE.DirectionalLight(
      palette.warm,
      run.mapId === "mine" ? 1.5 : 3,
    );
    sun.position.set(-15, 30, 10);
    this.scene.add(sun);
    this.buildWorld();
    this.player = createCowboyRig(run.characterId);
    this.scene.add(this.player);
    this.mapMerchant = new MapMerchantView(this.scene);
    this.worldEvents = new WorldEventsView(this.scene);
    const warnings = new THREE.BufferGeometry();
    warnings.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(24 * 2 * 3), 3),
    );
    this.chargeWarnings = new THREE.LineSegments(
      warnings,
      new THREE.LineBasicMaterial({
        color: 0xd13722,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.chargeWarnings.frustumCulled = false;
    this.scene.add(this.chargeWarnings);
    this.effects = new AbilityEffectsView(this.scene);
    this.arenaRing = new THREE.Mesh(
      new THREE.RingGeometry(0.955, 1, 96),
      new THREE.MeshBasicMaterial({
        color: 0xff6728,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      }),
    );
    this.arenaRing.rotation.x = -Math.PI / 2;
    this.arenaRing.visible = false;
    this.scene.add(this.arenaRing);
    this.arenaFlames = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.34, 1.7, 5),
      new THREE.MeshBasicMaterial({
        color: 0xffa536,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      }),
      64,
    );
    this.arenaFlames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.arenaFlames.frustumCulled = false;
    this.arenaFlames.count = 0;
    this.scene.add(this.arenaFlames);
    this.renderTime = 0;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.7, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffe7a0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.playerRing = ring;
    this.scene.add(ring);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 24),
      new THREE.MeshBasicMaterial({
        color: 0x684828,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    const whipGeometry = new THREE.BufferGeometry();
    whipGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(33 * 3), 3),
    );
    this.whip = new THREE.Line(
      whipGeometry,
      new THREE.LineBasicMaterial({ color: 0x462b1d }),
    );
    this.whip.frustumCulled = false;
    this.scene.add(this.whip);
    this.trail = new THREE.Mesh(
      new THREE.RingGeometry(
        0.6,
        CONFIG.whipRange,
        32,
        1,
        -Math.PI * 0.52,
        Math.PI * 1.04,
      ),
      new THREE.MeshBasicMaterial({
        color: 0xfff1b5,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.trail.rotation.x = -Math.PI / 2;
    this.scene.add(this.trail);
    this.bullets = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.095, 0.095, 0.36, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffd440,
        emissive: 0x73521a,
        roughness: 0.65,
      }),
      CONFIG.maxLoot + 1,
    );
    this.tips = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.098, 0.15, 6),
      new THREE.MeshStandardMaterial({ color: 0x919398, roughness: 0.5 }),
      CONFIG.maxLoot + 1,
    );
    this.coins = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0xffbd38, emissive: 0x52310a }),
      CONFIG.maxLoot + 1,
    );
    this.bandages = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.54, 0.16, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffefcf, roughness: 1 }),
      CONFIG.maxLoot + 1,
    );
    this.bandageMarkA = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.31, 0.03, 0.075),
      new THREE.MeshBasicMaterial({ color: 0xb74f43 }),
      CONFIG.maxLoot + 1,
    );
    this.bandageMarkB = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.075, 0.03, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xb74f43 }),
      CONFIG.maxLoot + 1,
    );
    this.primaryShotsMesh = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.13, 0.8, 5),
      new THREE.MeshBasicMaterial({
        color: run.characterId === "indigo" ? 0xdfd4b0 : 0xffe27d,
      }),
      64,
    );
    for (const mesh of [
      this.bullets,
      this.tips,
      this.coins,
      this.bandages,
      this.bandageMarkA,
      this.bandageMarkB,
      this.primaryShotsMesh,
    ]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.scene.add(mesh);
    }
    this.controller = new AbortController();
    window.addEventListener("resize", () => this.resize(), {
      signal: this.controller.signal,
    });
    this.resize();
  }
  buildWorld() {
    if (this.run.mapId === "desert")
      buildDesertWorld(this.scene, this.run.props);
    else buildOtherWorld(this.scene, this.run.props, this.run.mapId);
  }
  resize() {
    const width = this.host.clientWidth || innerWidth,
      height = this.host.clientHeight || innerHeight;
    this.renderer.setSize(width, height);
    const aspect = width / height;
    // Cap the visible world radius so enemies always spawn beyond the camera.
    const halfHeight = Math.min(14, 23 / aspect);
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }
  render(run) {
    const p = run.player,
      time = run.time + run.introTime;
    const delta = Math.max(0, Math.min(0.1, time - this.renderTime));
    this.renderTime = time;
    if (this.coarsePointer && run.phase === "playing" && delta > 0) {
      this.sampleFrames++;
      this.sampleDuration += delta;
      if (this.sampleFrames >= 150) {
        const average = this.sampleDuration / this.sampleFrames;
        const next =
          average > 0.026
            ? Math.max(0.78, this.pixelRatio - 0.15)
            : average < 0.018
              ? Math.min(this.maxPixelRatio, this.pixelRatio + 0.1)
              : this.pixelRatio;
        if (Math.abs(next - this.pixelRatio) > 0.02) {
          this.pixelRatio = next;
          this.renderer.setPixelRatio(next);
          this.resize();
        }
        this.sampleFrames = 0;
        this.sampleDuration = 0;
      }
    }
    animateCowboy(this.player, run, delta);
    this.player.visible =
      p.invulnerable <= 0 || Math.floor(p.invulnerable * 15) % 2 === 0;
    this.playerRing.position.set(p.x, 0.08, p.z);
    this.shadow.position.set(p.x, 0.06, p.z);
    this.camera.position.set(p.x, 24, p.z + 20);
    this.camera.lookAt(p.x, 0, p.z);
    const live = new Set(run.enemies.map((enemy) => enemy.id));
    for (const [id, view] of this.enemyViews)
      if (!live.has(id)) {
        view.visible = false;
        const pool = this.enemyPools.get(view.userData.species) || [];
        pool.push(view);
        this.enemyPools.set(view.userData.species, pool);
        this.enemyViews.delete(id);
      }
    for (const enemy of run.enemies) {
      let view = this.enemyViews.get(enemy.id);
      if (!view) {
        const pool = this.enemyPools.get(enemy.type) || [];
        view = pool.pop() || this.enemyAssets.create(enemy.type);
        view.userData.seed = enemy.id;
        view.userData.species = enemy.type;
        this.scene.add(view);
        this.enemyViews.set(enemy.id, view);
      }
      view.visible = true;
      view.scale.setScalar(enemy.hitFlash > 0 ? 1.12 : 1);
      const airborne = enemy.type === "bat" || enemy.type === "vulture";
      view.position.set(
        enemy.x,
        airborne
          ? 1.1 + Math.sin(time * 7 + enemy.id) * 0.13
          : enemy.type === "dog"
            ? Math.abs(Math.sin(time * 12 + enemy.id)) * 0.055
            : 0,
        enemy.z,
      );
      view.rotation.y =
        enemy.type === "vulture"
          ? Math.atan2(enemy.vx, enemy.vz)
          : Math.atan2(p.x - enemy.x, p.z - enemy.z);
      if (
        enemy.attackFlash > 0.45 &&
        !view.userData.attacking &&
        view.userData.attackAction
      ) {
        view.userData.attackAction.stop();
        view.userData.attackAction.reset().play();
        view.userData.attacking = true;
      } else if (enemy.attackFlash <= 0.45) view.userData.attacking = false;
      if (Math.hypot(enemy.x - p.x, enemy.z - p.z) < 44)
        view.userData.mixer?.update(delta);
    }
    this.drawBossArena(run, time);
    this.drawWhip(run);
    this.drawPrimary(run);
    this.drawLoot(run, time);
    this.worldEvents.render(run);
    this.effects.render(run);
    this.mapMerchant.render(run, delta);
    let warningCount = 0;
    const positions = this.chargeWarnings.geometry.attributes.position;
    for (const enemy of run.enemies) {
      if (enemy.type !== "vulture" || enemy.warning <= 0 || warningCount >= 24)
        continue;
      positions.setXYZ(warningCount * 2, enemy.x, 0.09, enemy.z);
      positions.setXYZ(
        warningCount * 2 + 1,
        enemy.x + enemy.vx * 5.2,
        0.09,
        enemy.z + enemy.vz * 5.2,
      );
      warningCount++;
    }
    positions.needsUpdate = true;
    this.chargeWarnings.geometry.setDrawRange(0, warningCount * 2);
    this.renderer.render(this.scene, this.camera);
  }
  merchantIndicator(run) {
    if (!run.merchant) return null;
    const width = this.host.clientWidth || innerWidth,
      height = this.host.clientHeight || innerHeight;
    const projected = new THREE.Vector3(
      run.merchant.x,
      2.8,
      run.merchant.z,
    ).project(this.camera);
    const targetX = ((projected.x + 1) * width) / 2,
      targetY = ((1 - projected.y) * height) / 2;
    const minX = 39,
      maxX = width - 39,
      minY = Math.min(145, height * 0.24),
      maxY = height - 80;
    const x = Math.min(maxX, Math.max(minX, targetX)),
      y = Math.min(maxY, Math.max(minY, targetY));
    return {
      x,
      y,
      bearing: (Math.atan2(targetX - x, -(targetY - y)) * 180) / Math.PI,
      onScreen:
        targetX >= minX &&
        targetX <= maxX &&
        targetY >= minY &&
        targetY <= maxY,
    };
  }
  drawBossArena(run, time) {
    const arena = run.bossEncounter;
    this.arenaRing.visible = arena.active;
    this.arenaFlames.count = arena.active ? 64 : 0;
    if (!arena.active) return;
    this.arenaRing.position.set(arena.x, 0.18, arena.z);
    this.arenaRing.scale.set(arena.radius, arena.radius, 1);
    for (let i = 0; i < 64; i++) {
      const angle = (i * Math.PI * 2) / 64;
      const h = 0.7 + Math.abs(Math.sin(time * 8 + i * 1.7)) * 0.8;
      this.dummy.position.set(
        arena.x + Math.cos(angle) * arena.radius,
        h * 0.5,
        arena.z + Math.sin(angle) * arena.radius,
      );
      this.dummy.rotation.set(0, 0, Math.sin(time * 5 + i) * 0.12);
      this.dummy.scale.set(1, h, 1);
      this.dummy.updateMatrix();
      this.arenaFlames.setMatrixAt(i, this.dummy.matrix);
    }
    this.arenaFlames.instanceMatrix.needsUpdate = true;
  }
  drawWhip(run) {
    if (run.characterId !== "joao") {
      this.whip.visible = false;
      this.trail.visible = false;
      return;
    }
    const attack = run.attack;
    this.whip.visible = Boolean(attack);
    this.trail.visible = Boolean(attack);
    if (!attack) return;
    const progress = attack.age / CONFIG.whipDuration,
      angle = attack.angle + (progress - 0.5) * Math.PI;
    const positions = this.whip.geometry.attributes.position,
      p = run.player;
    for (let i = 0; i <= 32; i++) {
      const t = i / 32,
        reach =
          CONFIG.whipRange *
          t *
          Math.sin(Math.PI * Math.min(0.98, progress * 0.8 + 0.15));
      const bend = Math.sin(t * Math.PI * 2 - progress * 9) * (1 - t) * 0.4;
      positions.setXYZ(
        i,
        p.x + Math.cos(angle) * reach - Math.sin(angle) * bend,
        1.05 + Math.sin(t * Math.PI) * 0.4,
        p.z + Math.sin(angle) * reach + Math.cos(angle) * bend,
      );
    }
    positions.needsUpdate = true;
    this.trail.position.set(p.x, 0.13, p.z);
    this.trail.rotation.z = -attack.angle;
    this.trail.material.opacity = Math.sin(progress * Math.PI) * 0.15;
  }
  drawPrimary(run) {
    let count = 0;
    for (const shot of run.primaryShots) {
      if (count >= 64) break;
      this.dummy.position.set(shot.x, 0.96, shot.z);
      this.dummy.rotation.set(Math.PI / 2, 0, Math.atan2(shot.vz, shot.vx));
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      this.primaryShotsMesh.setMatrixAt(count++, this.dummy.matrix);
    }
    this.primaryShotsMesh.count = count;
    this.primaryShotsMesh.instanceMatrix.needsUpdate = true;
  }
  drawLoot(run, time) {
    let bullets = 0,
      coins = 0,
      bandages = 0;
    for (const item of run.loot) {
      if (
        Math.abs(item.x - run.player.x) > 40 ||
        Math.abs(item.z - run.player.z) > 36
      )
        continue;
      this.dummy.position.set(
        item.x,
        0.34 + Math.sin(time * 3 + item.id) * 0.07,
        item.z,
      );
      this.dummy.rotation.set(0, 0, Math.PI / 5);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      if (item.type === "coin") {
        this.coins.setMatrixAt(coins++, this.dummy.matrix);
        continue;
      }
      if (item.type === "bandage") {
        this.dummy.rotation.set(0, item.id * 0.31, 0);
        this.dummy.updateMatrix();
        this.bandages.setMatrixAt(bandages, this.dummy.matrix);
        this.dummy.position.y += 0.095;
        this.dummy.updateMatrix();
        this.bandageMarkA.setMatrixAt(bandages, this.dummy.matrix);
        this.bandageMarkB.setMatrixAt(bandages++, this.dummy.matrix);
        continue;
      }
      this.bullets.setMatrixAt(bullets, this.dummy.matrix);
      this.dummy.position.x -= Math.sin(Math.PI / 5) * 0.25;
      this.dummy.position.y += Math.cos(Math.PI / 5) * 0.25;
      this.dummy.updateMatrix();
      this.tips.setMatrixAt(bullets++, this.dummy.matrix);
    }
    this.bullets.count = bullets;
    this.tips.count = bullets;
    this.coins.count = coins;
    this.bandages.count = bandages;
    this.bandageMarkA.count = this.bandageMarkB.count = bandages;
    for (const mesh of [
      this.bullets,
      this.tips,
      this.coins,
      this.bandages,
      this.bandageMarkA,
      this.bandageMarkB,
    ])
      mesh.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.controller.abort();
    disposeCowboyRig(this.player);
    this.mapMerchant.dispose();
    disposeObject(this.scene);
    for (const view of this.enemyViews.values()) view.userData.disposed = true;
    for (const pool of this.enemyPools.values())
      for (const view of pool) view.userData.disposed = true;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
