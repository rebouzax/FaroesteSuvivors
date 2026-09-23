import * as THREE from "three";
import { CONFIG } from "../config/gameConfig.js";
import { disposeObject } from "./CharacterFactory.js";
import { createCowboyRig, animateCowboy, disposeCowboyRig } from "./CowboyRig.js";
import { AbilityEffectsView } from "./AbilityEffectsView.js";
import { EnemyAssetView } from "./EnemyAssetView.js";
import { MapMerchantView } from "./MapMerchantView.js";
import { buildDesertWorld } from "./DesertWorldView.js";

export class GameView {
  constructor(host, run) {
    this.host = host;
    this.run = run;
    this.enemyViews = new Map();
    this.enemyPools = new Map();
    this.enemyAssets = new EnemyAssetView();
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
    this.scene.fog = new THREE.Fog(0xeac48e, 55, 115);
    this.camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 200);
    this.scene.add(new THREE.HemisphereLight(0xffeac3, 0xa77746, 2.4));
    const sun = new THREE.DirectionalLight(0xffd59b, 3);
    sun.position.set(-15, 30, 10);
    this.scene.add(sun);
    this.buildWorld();
    this.player = createCowboyRig();
    this.scene.add(this.player);
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
    this.arenaRing = new THREE.Mesh(
      new THREE.RingGeometry(0.955,1,96),
      new THREE.MeshBasicMaterial({color:0xff6728,transparent:true,opacity:0.88,depthWrite:false}),
    );
    this.arenaRing.rotation.x=-Math.PI/2;
    this.arenaRing.visible=false;
    this.scene.add(this.arenaRing);
    this.arenaFlames=new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.34,1.7,5),
      new THREE.MeshBasicMaterial({color:0xffa536,transparent:true,opacity:0.88,depthWrite:false}),
      64,
    );
    this.arenaFlames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.arenaFlames.frustumCulled=false;
    this.arenaFlames.count=0;
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
    buildDesertWorld(this.scene, this.run.props);
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
    const live = new Set(run.enemies.map(enemy => enemy.id));
    for (const [id, view] of this.enemyViews)
      if (!live.has(id)) {
        view.visible = false;
        const pool=this.enemyPools.get(view.userData.species)||[];
        pool.push(view);
        this.enemyPools.set(view.userData.species,pool);
        this.enemyViews.delete(id);
      }
    for (const enemy of run.enemies) {
      let view = this.enemyViews.get(enemy.id);
      if (!view) {
        const pool=this.enemyPools.get(enemy.type)||[];
        view=pool.pop() || this.enemyAssets.create(enemy.type);
        view.userData.seed=enemy.id;
        view.userData.species=enemy.type;
        this.scene.add(view);
        this.enemyViews.set(enemy.id,view);
      }
      view.visible = true;
      view.scale.setScalar(enemy.hitFlash>0 ? 1.12 : 1);
      const airborne=enemy.type === "bat" || enemy.type === "vulture";
      view.position.set(enemy.x, airborne ? 1.1+Math.sin(time*7+enemy.id)*0.13 : enemy.type==="dog" ? Math.abs(Math.sin(time*12+enemy.id))*0.055 : 0, enemy.z);
      view.rotation.y=enemy.type==="vulture" ? Math.atan2(enemy.vx,enemy.vz) : Math.atan2(p.x-enemy.x,p.z-enemy.z);
      if (enemy.attackFlash > 0.45 && !view.userData.attacking && view.userData.attackAction) {
        view.userData.attackAction.stop();
        view.userData.attackAction.reset().play();
        view.userData.attacking=true;
      } else if (enemy.attackFlash <= 0.45) view.userData.attacking=false;
      if (Math.hypot(enemy.x-p.x,enemy.z-p.z)<44) view.userData.mixer?.update(delta);
    }
    this.drawBossArena(run,time);
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
  drawBossArena(run,time){
    const arena=run.bossEncounter;
    this.arenaRing.visible=arena.active;
    this.arenaFlames.count=arena.active?64:0;
    if (!arena.active) return;
    this.arenaRing.position.set(arena.x,0.18,arena.z);
    this.arenaRing.scale.set(arena.radius,arena.radius,1);
    for(let i=0;i<64;i++){
      const angle=i*Math.PI*2/64;
      const h=0.7+Math.abs(Math.sin(time*8+i*1.7))*0.8;
      this.dummy.position.set(arena.x+Math.cos(angle)*arena.radius,h*0.5,arena.z+Math.sin(angle)*arena.radius);
      this.dummy.rotation.set(0,0,Math.sin(time*5+i)*0.12);
      this.dummy.scale.set(1,h,1);
      this.dummy.updateMatrix();
      this.arenaFlames.setMatrixAt(i,this.dummy.matrix);
    }
    this.arenaFlames.instanceMatrix.needsUpdate=true;
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
    disposeCowboyRig(this.player);
    disposeObject(this.scene);
    for (const view of this.enemyViews.values()) view.userData.disposed=true;
    for (const pool of this.enemyPools.values()) for (const view of pool) view.userData.disposed=true;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
