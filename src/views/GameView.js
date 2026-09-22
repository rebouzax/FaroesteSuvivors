import * as THREE from "three";
import { CONFIG } from "../config/gameConfig.js";
import { createCowboy, createBat, disposeObject } from "./CharacterFactory.js";

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
    this.player = createCowboy();
    this.scene.add(this.player);
    this.batTemplate = createBat();
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
    this.player.position.set(p.x, Math.abs(Math.sin(time * 10)) * 0.04, p.z);
    this.player.rotation.y = Math.atan2(p.dx, p.dz);
    const walking =
      run.phase === "playing" || (run.phase === "intro" && run.introTime < 5.6);
    this.player.userData.legs.forEach(
      (leg, i) =>
        (leg.rotation.x = walking
          ? Math.sin(time * 10 + i * Math.PI) * 0.55
          : 0),
    );
    this.player.userData.arm.rotation.x = run.attack
      ? -Math.sin((run.attack.age / CONFIG.whipDuration) * Math.PI) * 1.5
      : 0;
    this.player.visible =
      p.invulnerable <= 0 || Math.floor(p.invulnerable * 15) % 2 === 0;
    this.playerRing.position.set(p.x, 0.08, p.z);
    this.shadow.position.set(p.x, 0.06, p.z);
    this.camera.position.set(p.x, 24, p.z + 20);
    this.camera.lookAt(p.x, 0, p.z);
    const live = new Set(run.bats.map((bat) => bat.id));
    for (const [id, view] of this.batViews)
      if (!live.has(id)) {
        view.visible = false;
        this.batPool.push(view);
        this.batViews.delete(id);
      }
    for (const bat of run.bats) {
      let view = this.batViews.get(bat.id);
      if (!view) {
        view = this.batPool.pop() || this.batTemplate.clone(true);
        this.scene.add(view);
        this.batViews.set(bat.id, view);
      }
      view.visible = true;
      view.position.set(bat.x, 1.1 + Math.sin(time * 8 + bat.id) * 0.15, bat.z);
      // Root children 1 and 4 are the wing pivots; clone userData is not relied upon.
      for (const child of view.children)
        if (child.isGroup)
          child.rotation.y = Math.sin(time * 18 + bat.id) * 0.8;
    }
    this.drawWhip(run);
    this.drawLoot(run, time);
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
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
