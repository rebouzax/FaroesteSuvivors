import * as THREE from "three";
import { CONFIG } from "../config/gameConfig.js";
import { createBat, disposeObject } from "./CharacterFactory.js";
import { createCowboyRig, animateCowboy } from "./CowboyRig.js";
import { createChupacabra } from "./ChupacabraFactory.js";
import { AbilityEffectsView } from "./AbilityEffectsView.js";
import { createVulture } from "./VultureFactory.js";
import { MapMerchantView } from "./MapMerchantView.js";

export class GameView {
  constructor(host, run) {
    this.host = host;
    this.run = run;
    this.batViews = new Map();
    this.batPool = [];
    this.dummy = new THREE.Object3D();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setClearColor(0xeac48e);
    host.prepend(this.renderer.domElement);
    this.renderer.domElement.className = "game-canvas";
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xeac48e, 45, 95);
    this.camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 200);
    this.scene.add(new THREE.HemisphereLight(0xffeac3, 0xa77746, 2.4));
    const sun = new THREE.DirectionalLight(0xffd59b, 3);
    sun.position.set(-15, 30, 10);
    this.scene.add(sun);
    this.buildWorld();
    this.player = createCowboyRig();
    this.scene.add(this.player);
    this.batTemplate = createBat();
    this.dogTemplate = createChupacabra();
    this.dogPool = [];
    this.vulturePool = [];
    this.vultureTemplate = createVulture();
    this.mapMerchant = new MapMerchantView(this.scene);
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
    for (const mesh of [this.bullets, this.tips, this.coins]) {
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
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0xe0ae69, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    const ripplePositions = [];
    for (let i = 0; i < 900; i++) {
      const x = Math.sin(i * 12.73) * 117;
      const z = Math.cos(i * 8.31) * 117;
      const length = 0.5 + (i % 5) * 0.3;
      ripplePositions.push(x, 0.025, z, x + length, 0.025, z + 0.07);
    }
    const ripples = new THREE.BufferGeometry();
    ripples.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(ripplePositions, 3),
    );
    this.scene.add(
      new THREE.LineSegments(
        ripples,
        new THREE.LineBasicMaterial({
          color: 0xffe5a9,
          transparent: true,
          opacity: 0.28,
        }),
      ),
    );
    // Low dune relief sits below the movement plane so navigation remains flat.
    const duneMaterial = new THREE.MeshStandardMaterial({
      color: 0xeaba77,
      flatShading: true,
      roughness: 1,
    });
    for (let i = 0; i < 35; i++) {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 5),
        duneMaterial,
      );
      dune.scale.set(10 + (i % 5) * 3, 0.6, 6 + (i % 4) * 3);
      dune.position.set(Math.sin(i * 42) * 108, -0.5, Math.cos(i * 17) * 108);
      this.scene.add(dune);
    }
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0xb87b50,
        flatShading: true,
        roughness: 1,
      }),
      cactusMaterial = new THREE.MeshStandardMaterial({
        color: 0x79834a,
        flatShading: true,
        roughness: 1,
      });
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0),
      stemGeometry = new THREE.CylinderGeometry(0.24, 0.29, 2.4, 7);
    for (const prop of this.run.props) {
      const group = new THREE.Group();
      group.position.set(prop.x, 0, prop.z);
      group.scale.setScalar(prop.size);
      if (prop.type === "rock") {
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = 0.65;
        rock.scale.set(1, 1.3, 0.85);
        rock.rotation.y = prop.x;
        group.add(rock);
      } else {
        const stem = new THREE.Mesh(stemGeometry, cactusMaterial);
        stem.position.y = 1.2;
        group.add(stem);
        for (const sign of [-1, 1]) {
          const branch = new THREE.Mesh(stemGeometry, cactusMaterial);
          branch.scale.set(0.65, 0.32, 0.65);
          branch.rotation.z = (sign * Math.PI) / 2;
          branch.position.set(sign * 0.38, 1.1 + sign * 0.18, 0);
          group.add(branch);
          const tip = new THREE.Mesh(stemGeometry, cactusMaterial);
          tip.scale.set(0.65, 0.3, 0.65);
          tip.position.set(sign * 0.72, 1.4 + sign * 0.18, 0);
          group.add(tip);
        }
      }
      this.scene.add(group);
    }
    const wallGeometry = new THREE.BoxGeometry(8, 8, 8);
    for (let i = -120; i <= 120; i += 8)
      for (const side of [-1, 1]) {
        for (const [x, z] of [
          [i, side * 124],
          [side * 124, i],
        ]) {
          const wall = new THREE.Mesh(wallGeometry, rockMaterial);
          wall.position.set(x, 2 + Math.sin(i) * 0.5, z);
          wall.scale.y = 1 + Math.abs(Math.sin(i)) * 0.6;
          this.scene.add(wall);
        }
      }
    // A few broken fence fragments establish places to explore without blocking paths.
    const wood = new THREE.MeshStandardMaterial({
      color: 0x886243,
      roughness: 1,
    });
    for (const [x, z] of [
      [15, -6],
      [-20, 18],
      [38, 24],
      [-45, -34],
    ]) {
      for (let i = 0; i < 4; i++) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 1.2, 0.18),
          wood,
        );
        post.position.set(x + i * 1.5, 0.6, z);
        this.scene.add(post);
        if (i < 3) {
          const rail = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.12, 0.12),
            wood,
          );
          rail.position.set(x + i * 1.5 + 0.75, 0.8, z);
          rail.rotation.z = 0.05;
          this.scene.add(rail);
        }
      }
    }
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
    animateCowboy(this.player, run, delta);
    this.player.visible =
      p.invulnerable <= 0 || Math.floor(p.invulnerable * 15) % 2 === 0;
    this.playerRing.position.set(p.x, 0.08, p.z);
    this.shadow.position.set(p.x, 0.06, p.z);
    this.camera.position.set(p.x, 24, p.z + 20);
    this.camera.lookAt(p.x, 0, p.z);
    const live = new Set(run.enemies.map((bat) => bat.id));
    for (const [id, view] of this.batViews)
      if (!live.has(id)) {
        view.visible = false;
        (view.userData.species === "vulture"
          ? this.vulturePool
          : view.userData.species === "dog"
            ? this.dogPool
            : this.batPool
        ).push(view);
        this.batViews.delete(id);
      }
    for (const bat of run.enemies) {
      let view = this.batViews.get(bat.id);
      if (!view) {
        view =
          bat.type === "vulture"
            ? this.vulturePool.pop() || this.vultureTemplate.clone(true)
            : bat.type === "dog"
              ? this.dogPool.pop() || this.dogTemplate.clone(true)
              : this.batPool.pop() || this.batTemplate.clone(true);
        view.userData.species = bat.type;
        this.scene.add(view);
        this.batViews.set(bat.id, view);
      }
      view.visible = true;
      view.scale.setScalar(bat.hitFlash > 0 ? 1.12 : 1);
      view.position.set(
        bat.x,
        bat.type === "dog"
          ? Math.abs(Math.sin(time * 13 + bat.id)) * 0.06
          : 1.1 + Math.sin(time * 8 + bat.id) * 0.15,
        bat.z,
      );
      if (bat.type === "vulture") {
        view.rotation.y = Math.atan2(bat.vx, bat.vz);
        for (const side of [-1, 1])
          view.getObjectByName(`vulture-wing-${side}`).rotation.z =
            side * Math.sin(time * 9 + bat.id) * 0.35;
      } else if (bat.type === "dog") {
        view.rotation.y = Math.atan2(p.x - bat.x, p.z - bat.z);
        for (let i = 0; i < 4; i++)
          view.getObjectByName(`dog-leg-${i}`).rotation.x =
            Math.sin(time * 13 + i * 2) * 0.55;
      } else
        for (const child of view.children)
          if (child.isGroup)
            child.rotation.y = Math.sin(time * 18 + bat.id) * 0.8;
    }
    this.drawWhip(run);
    this.drawLoot(run, time);
    this.effects.render(run);
    this.mapMerchant.render(run);
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
  drawWhip(run) {
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
  drawLoot(run, time) {
    let bullets = 0,
      coins = 0;
    for (const item of run.loot) {
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
      this.bullets.setMatrixAt(bullets, this.dummy.matrix);
      this.dummy.position.x -= Math.sin(Math.PI / 5) * 0.25;
      this.dummy.position.y += Math.cos(Math.PI / 5) * 0.25;
      this.dummy.updateMatrix();
      this.tips.setMatrixAt(bullets++, this.dummy.matrix);
    }
    this.bullets.count = bullets;
    this.tips.count = bullets;
    this.coins.count = coins;
    for (const mesh of [this.bullets, this.tips, this.coins])
      mesh.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.controller.abort();
    disposeObject(this.scene);
    disposeObject(this.batTemplate);
    disposeObject(this.dogTemplate);
    disposeObject(this.vultureTemplate);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
