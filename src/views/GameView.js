import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CONFIG } from "../config/gameConfig.js";
import { disposeObject } from "./CharacterFactory.js";
import {
  createCowboyRig,
  animateCowboy,
  disposeCowboyRig,
} from "./CowboyRig.js";
import { AbilityEffectsView } from "./AbilityEffectsView.js";
import { EnemyAssetView, enemyAppearance } from "./EnemyAssetView.js";
import { resetBossHigh, animateBossHigh } from "./HighQualityBossAnimation.js";
import { resetEnemyHigh, animateEnemyHigh } from "./HighQualityEnemyAnimation.js";
import {resetEnemyThrow,animateEnemyThrow} from './EnemyMotion.js';
import { MapMerchantView } from "./MapMerchantView.js";
import { buildDesertWorld } from "./DesertWorldView.js";
import { buildOtherWorld } from "./OtherWorldView.js";
import { SuppliedSceneryView } from './SuppliedSceneryView.js';
import { WorldEventsView } from "./WorldEventsView.js";
import { MAPS } from "../config/mapConfig.js";
import { FRONTIER_ENEMIES,FRONTIER_BOSSES } from "../config/frontierExpansion.js";
import { AtmosphereView } from "./AtmosphereView.js";

export class GameView {
  constructor(host, run, options = {}) {
    this.host = host;
    this.run = run;
    this.quality = options.quality === "high" ? "high" : "normal";
    this.highQuality = this.quality === "high";
    this.enemyViews = new Map();
    this.liveEnemyIds = new Set();
    this.enemyPools = new Map();
    this.enemyAssets = new EnemyAssetView();
    this.dummy = new THREE.Object3D();
    this.coarsePointer = matchMedia("(pointer: coarse)").matches;
    this.maxPixelRatio = this.highQuality
      ? Math.min(devicePixelRatio || 1, this.coarsePointer ? 1.3 : 1.85)
      : Math.min(
          devicePixelRatio || 1,
          this.coarsePointer ? 1 : innerWidth < 960 ? 1.15 : 1.3,
        );
    this.pixelRatio = this.maxPixelRatio;
    run.maxEnemies = this.coarsePointer ? 110 : CONFIG.maxBats;
    this.sampleFrames = 0;
    this.sampleDuration = 0;
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.highQuality || !this.coarsePointer,
      powerPreference: "high-performance",
    });
    this.desertEffects = run.mapId === "desert";
    const shadowsEnabled = this.highQuality || (this.desertEffects && !this.coarsePointer);
    this.renderer.shadowMap.enabled = shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = (run.mapId === "desert" ? 0.84 : 1) * (this.highQuality ? 1.06 : 1);
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
        run.mapId === "desert" ? 0x525368 : 0x635347,
        run.mapId === "mine" ? 1.65 : run.mapId === "desert" ? 1.25 : 2.4,
      ),
    );
    const sun = new THREE.DirectionalLight(
      palette.warm,
      run.mapId === "mine" ? 1.5 : run.mapId === "town" ? .85 : run.mapId === "desert" ? 1.35 : 3,
    );
    sun.position.set(-15, 30, 10);
    this.scene.add(sun);
    if (this.desertEffects || this.highQuality) {
      // A compact shadow frustum follows the player instead of wasting
      // resolution on the full 240-metre desert. Touch devices keep decals.
      if (shadowsEnabled) {
        sun.castShadow = true;
        const shadowResolution = this.highQuality ? (this.coarsePointer ? 512 : 1536) : 1024;
        sun.shadow.mapSize.set(shadowResolution, shadowResolution);
        sun.shadow.camera.left = sun.shadow.camera.bottom = -12;
        sun.shadow.camera.right = sun.shadow.camera.top = 12;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 62;
        sun.shadow.normalBias = 0.025;
        this.sun = sun;
        this.scene.add(sun.target);
      }
      const rim = new THREE.DirectionalLight(0x829dc9, 0.55);
      rim.position.set(12, 8, -12);
      this.scene.add(rim);
    }
    this.buildWorld();
    this.player = createCowboyRig(run.characterId);
    this.scene.add(this.player);
    if (this.sun) this.player.userData.ready?.then(() => {
      if (this.player.userData.disposed) return;
      // Only the large silhouette pieces enter the shadow pass.
      const silhouette = new Set(["CoatBody", "DusterFront", "Lapel", "Face", "Jaw", "HatBrim", "HatCrown", "CurvedHatEdge", "Sleeve", "Forearm", "Boot", "TrouserLeg", "LowerLeg"]);
      this.player.traverse((part) => { if (part.isMesh && silhouette.has(part.name)) part.castShadow = true; });
    });
    if (this.desertEffects) {
      const count = this.highQuality ? (this.coarsePointer ? 96 : 176) : this.coarsePointer ? 48 : 104;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      this.desertDust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: this.highQuality ? palette.warm : 0xe2c598, size: this.highQuality ? .14 : .11, transparent: true, opacity: 0.46, depthWrite: false, sizeAttenuation: true }));
      this.desertDust.frustumCulled = false;
      this.scene.add(this.desertDust);
    }
    // Bloom is restrained to bright highlights and disabled after sustained
    // slow frames. Mobile uses the lighter direct WebGL path.
    if ((this.desertEffects || this.highQuality) && !this.coarsePointer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        this.highQuality ? 0.34 : 0.24,
        this.highQuality ? 0.32 : 0.25,
        0.97,
      ));
      this.composer.addPass(new OutputPass());
      this.bloomEnabled = true;
    }
    this.mapMerchant = new MapMerchantView(this.scene);
    this.atmosphere = new AtmosphereView(this.scene, run.mapId, this.quality, this.coarsePointer);
    this.worldEvents = new WorldEventsView(this.scene, this.quality);
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
    this.effects = new AbilityEffectsView(this.scene, this.quality);
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
    this.shadow.visible = !this.highQuality;
    this.scene.add(this.shadow);
    if(this.highQuality)this.buildContactShadows();
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
      new THREE.CylinderGeometry(0.16, 0.16, 0.48, 7),
      new THREE.MeshStandardMaterial({
        color: 0xffed49,
        emissive: 0xb4740a,
        emissiveIntensity: 0.8,
        roughness: 0.65,
      }),
      CONFIG.maxLoot + 1,
    );
    this.tips = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.16, 0.22, 7),
      new THREE.MeshStandardMaterial({ color: 0x888d91, roughness: 0.5 }),
      CONFIG.maxLoot + 1,
    );
    this.bulletGlows = new THREE.InstancedMesh(
      new THREE.RingGeometry(0.26, 0.4, 10),
      new THREE.MeshBasicMaterial({ color: 0x347c80, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
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
    this.projectileAxis = new THREE.Vector3(0, 1, 0);
    this.projectileHeading = new THREE.Vector3();
    const arrow = ["bow","crossbow"].includes(run.hero.primary);
    const dynamite = run.hero.primary === "dynamite";
    const boomerang = run.hero.primary === "boomerang";
    const knives = run.hero.primary === "knives";
    const axe=run.hero.primary==='axe',scrap=run.hero.primary==='scrap';
    const fireball=run.hero.primary==='fireball';
    const pellets = ["shotgun","sawedoff"].includes(run.hero.primary);
    this.primaryBody = new THREE.InstancedMesh(
      axe?new THREE.CylinderGeometry(.028,.035,.65,8):scrap?new THREE.TetrahedronGeometry(.18):boomerang ? new THREE.TorusGeometry(.23,.055,5,9,Math.PI*1.55) : dynamite ? new THREE.BoxGeometry(.17,.42,.18) : arrow ? new THREE.CylinderGeometry(0.035, 0.035, 1.05, 6) : knives ? new THREE.CylinderGeometry(0.05,0.075,0.6,6) : pellets ? new THREE.SphereGeometry(0.13,8,6) : new THREE.CylinderGeometry(0.09, 0.09, 0.36, 8),
      new THREE.MeshStandardMaterial({color: boomerang ? 0xb37a32 : dynamite ? 0x8f2923 : arrow ? 0x805034 : knives ? 0x8d969a : 0xe6ad49, metalness: arrow ? 0 : 0.55, roughness: 0.36}), 64,
    );
    this.primaryTip = new THREE.InstancedMesh(
      axe?new THREE.CylinderGeometry(.19,.19,.05,10,1,false,0,Math.PI).rotateZ(Math.PI/2):scrap?new THREE.OctahedronGeometry(.07):dynamite ? new THREE.ConeGeometry(.09,.2,5) : arrow || knives ? new THREE.ConeGeometry(knives ? 0.16 : 0.115, knives ? 0.34 : 0.23, 5) : new THREE.SphereGeometry(pellets ? 0.065 : 0.1, 8, 5),
      new THREE.MeshStandardMaterial({color: dynamite ? 0xffaa39 : arrow || knives ? 0xc4d1ce : 0xffe6a2, metalness: dynamite ? 0 : 0.7, roughness: 0.24, emissive: dynamite ? 0xd74711 : arrow || knives ? 0x163331 : 0x754614}), 64,
    );
    if(fireball){
      this.primaryBody.geometry.dispose();this.primaryBody.material.dispose();
      this.primaryTip.geometry.dispose();this.primaryTip.material.dispose();
      this.primaryBody.geometry=new THREE.IcosahedronGeometry(.18,2);
      this.primaryBody.material=new THREE.MeshBasicMaterial({color:0xffb52c});
      this.primaryTip.geometry=new THREE.IcosahedronGeometry(.25,2);
      this.primaryTip.material=new THREE.MeshBasicMaterial({color:0xff5515,transparent:true,opacity:.38,depthWrite:false,blending:THREE.AdditiveBlending});
    }
    this.primaryFletch = arrow ? new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.16, 0.27, 4),
      new THREE.MeshStandardMaterial({color: 0x58a8a4, side: THREE.DoubleSide, flatShading: true}), 64,
    ) : null;
    this.bombBody=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.12,.27,3,8),new THREE.MeshStandardMaterial({color:0x922923,roughness:.65}),64);
    this.bombTip=new THREE.InstancedMesh(new THREE.ConeGeometry(.055,.17,6),new THREE.MeshBasicMaterial({color:0xffc250}),64);
    for (const mesh of [
      this.bullets,
      this.bulletGlows,
      this.tips,
      this.coins,
      this.bandages,
      this.bandageMarkA,
      this.bandageMarkB,
      this.primaryBody,
      this.primaryTip,
      this.bombBody,this.bombTip,
      ...(this.primaryFletch ? [this.primaryFletch] : []),
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
    // Rebuilding graphics settings must not duplicate procedural collision bodies.
    if(this.run.mapId!=='desert')this.run.props=this.run.props.filter(p=>p.type!=='visual-collider');
    const props=this.run.props.filter(p=>!p.assetId);
    if (this.run.mapId === "desert")
      buildDesertWorld(this.scene, props, this.highQuality || !this.coarsePointer, this.highQuality);
    else buildOtherWorld(this.scene, props, this.run.mapId, this.quality, this.run.props);
    this.suppliedScenery=new SuppliedSceneryView(this.scene,this.run.mapId,this.highQuality);
  }
  resize() {
    const width = this.host.clientWidth || innerWidth,
      height = this.host.clientHeight || innerHeight;
    this.renderer.setSize(width, height);
    this.composer?.setSize(width, height);
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
      time = (run.visualTime ?? run.time) + run.introTime;
    const delta = Math.max(0, Math.min(0.1, time - this.renderTime));
    this.renderTime = time;
    if (run.phase === "playing" && delta > 0) {
      this.sampleFrames++;
      this.sampleDuration += delta;
      if (this.sampleFrames >= 36) {
        const average = this.sampleDuration / this.sampleFrames;
        const next =
          average > 0.036
            ? Math.max(0.68, this.pixelRatio - 0.14)
            : average < 0.020
              ? Math.min(this.maxPixelRatio, this.pixelRatio + 0.06)
              : this.pixelRatio;
        if (Math.abs(next - this.pixelRatio) > 0.02) {
          this.pixelRatio = next;
          this.renderer.setPixelRatio(next);
          this.composer?.setPixelRatio(next);
          this.resize();
        }
        if (this.bloomEnabled && average > 0.036 && this.pixelRatio <= 0.82)
          this.bloomEnabled = false;
        this.sampleFrames = 0;
        this.sampleDuration = 0;
      }
    }
    animateCowboy(this.player, run, delta, this.highQuality);
    this.atmosphere.update(run, time);
    this.player.visible =
      p.invulnerable <= 0 || Math.floor(p.invulnerable * 15) % 2 === 0;
    this.playerRing.position.set(p.x, 0.08, p.z);
    this.shadow.position.set(p.x, 0.06, p.z);
    this.camera.position.set(p.x, 24, p.z + 20);
    this.camera.lookAt(p.x, 0, p.z);
    if (this.sun) {
      this.sun.position.set(p.x - 15, 30, p.z + 10);
      this.sun.target.position.set(p.x, 0, p.z);
    }
    if (this.desertDust) {
      const points = this.desertDust.geometry.attributes.position;
      for (let i = 0; i < points.count; i++) {
        points.setXYZ(i, p.x + Math.sin(i * 19.71 + time * 0.18) * 14,
          0.25 + ((i * 0.618 + time * 0.09) % 1) * 1.35,
          p.z + Math.cos(i * 27.13 + time * 0.11) * 12);
      }
      points.needsUpdate = true;
    }
    const live = this.liveEnemyIds;
    live.clear();
    for (const enemy of run.enemies) live.add(enemy.id);
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
        const species=enemyAppearance(enemy.type,enemy.bossId);
        const pool = this.enemyPools.get(species) || [];
        view = pool.pop() || this.enemyAssets.create(enemy.type,enemy.bossId);
        view.userData.seed = enemy.id;
        view.userData.species = species;
        view.userData.attacking=false;
        if(view.userData.highEnemyAnimation){
          view.userData.highEnemyAnimation.lastX=null;
          view.userData.highEnemyAnimation.lastZ=null;
          view.userData.highEnemyAnimation.move=0;
        }
        this.scene.add(view);
        this.enemyViews.set(enemy.id, view);
      }
      view.visible = true;
      if ((enemy.bossId || !["bat","dog","vulture","skeleton","miner"].includes(enemy.type)) && (view.userData.bossId !== (enemy.bossId||enemy.type) ||
          (view.children.length > 0 && !view.userData.tinted))) {
        const bossTints=[0xc5d5df,0xef9666,0xc1c0ef,0xaac286,0xe8b092];
        const shade = { ...Object.fromEntries(Object.entries(FRONTIER_ENEMIES).map(([id,e])=>[id,e.color])),...Object.fromEntries(Object.keys(FRONTIER_BOSSES).map((id,i)=>[id,bossTints[i%bossTints.length]])),giantBat:0xaa8ec9,fireChupacabra:0xff7240,shadowMarshal:0x9fa2d4,shovelMiner:0x9a806a,giantMoth:0x9bbba6,minerGeneral:0xb1a1cb,boneHound:0xb4b5a4,boneSinger:0xa8b8d4,zombieDeputy:0xb6a07b,ashSerpent:0xcf6c55,stormVulture:0x9ea5cf,railRevenant:0xc7a482,cryptMother:0xbba3b4,deadPreacher:0xd0bca1,lastConductor:0xa7c3d6,wraith:0x9ccdd7,crow:0xbbabc5,
          bellTowerKeeper:0xe2c675,windmillWidow:0xa99bbf,mudKing:0x537868,drownedBride:0x9bb7af,bottleBaron:0xc38a58,damaMalvina:0x9a6bc3,ironLocomotive:0xa57a4d,railWitchQueen:0x9b669d,boneCactusMatriarch:0xc58e67,crowKing:0x6f74aa,
          bellRinger:0xc7b473,dustCoyote:0xc58c67,lanternThief:0xa79366,windmillWraith:0xa998bb,mireLeech:0x638f72,reedStalker:0x6c9d87,drownedProspector:0x797f70,swampCrow:0x667d83,
          cardsharpGhoul:0x887195,barBanshee:0xb794aa,whiskeyImp:0x9b633f,pianoCrawler:0x51465a,railWitch:0x87669b,coalMimic:0x61564f,ironLocust:0x9b8d45,graveRider:0x776754,
          boneCactus:0xa58b69,sundownBandit:0xb26c4f,cinderHawk:0xb66a51,rattlesnake:0x997a48 }[enemy.bossId||enemy.type];
        if (shade && !view.userData.imported) view.traverse((part) => {
          if (!part.isMesh || !part.material?.color) return;
          part.userData.baseColor ??= part.material.color.clone();
          part.material.color.copy(part.userData.baseColor).multiply(new THREE.Color(shade));
        });
        view.userData.bossId = enemy.bossId||enemy.type;
        view.userData.tinted = view.children.length > 0;
      }
      view.scale.setScalar((enemy.treasure?1.8:enemy.bossId?enemy.bossId==="giantBat"||enemy.bossId==="giantMoth"?2.8:1.9:1)*(enemy.hitFlash > 0 ? 1.035 : 1));
      const airborne = view.userData.airborne || ["bat","vulture","crow","swampCrow","cinderHawk","ironLocust"].includes(enemy.type) || ["giantBat","giantMoth","stormVulture","windmillWidow","crowKing"].includes(enemy.bossId);
      view.position.set(
        enemy.x,
        airborne
          ? 1.1 + Math.sin(time * 7 + enemy.id) * 0.13
          : enemy.type === "dog"
            ? Math.abs(Math.sin(time * 12 + enemy.id)) * 0.055
            : 0,
        enemy.z,
      );
      view.rotation.y = enemy.treasure ? (enemy.facing||0) : enemy.type === "vulture"
        ? Math.atan2(enemy.vx, enemy.vz)
        : this.highQuality&&enemy.charge&&enemy.charge.warning<=0
          ? Math.atan2(enemy.charge.vx,enemy.charge.vz)
          : Math.atan2(p.x - enemy.x,p.z - enemy.z);
      if (
        (this.highQuality&&enemy.bossId?enemy.releaseFlash>0.25:enemy.attackFlash>0.45) &&
        !view.userData.attacking &&
        view.userData.attackAction
      ) {
        view.userData.attackAction.stop();
        view.userData.attackAction.reset().play();
        view.userData.attacking = true;
      } else if ((this.highQuality&&enemy.bossId?enemy.releaseFlash<=0.25:enemy.attackFlash<=0.45)) view.userData.attacking = false;
      if(this.highQuality&&enemy.bossId)resetBossHigh(view);
      resetEnemyThrow(view);
      if(view.userData.healthBar){
        const {bar,fill}=view.userData.healthBar,ratio=Math.max(0,Math.min(1,enemy.hp/enemy.maxHp));
        bar.quaternion.copy(view.quaternion).invert().multiply(this.camera.quaternion);
        fill.scale.x=ratio;fill.position.x=-(1-ratio)*.81;
      }
      if(this.highQuality&&!enemy.bossId)resetEnemyHigh(view);
      const nearPlayer=Math.hypot(enemy.x-p.x,enemy.z-p.z)<(this.coarsePointer?27:34);
      if (nearPlayer)
        view.userData.mixer?.update(delta);
      if(this.highQuality&&enemy.bossId)
        animateBossHigh(view,enemy,run.bossTelegraph,time,delta);
      else if(this.highQuality&&nearPlayer)
        animateEnemyHigh(view,enemy,time,delta);
      if(nearPlayer)animateEnemyThrow(view,enemy);
    }
    if(this.contactShadows){
      let index=0;
      for(const enemy of run.enemies){
        this.dummy.position.set(enemy.x,.042+index*.00001,enemy.z);
        this.dummy.rotation.set(-Math.PI/2,0,enemy.id*.13);
        const radius=enemy.bossId?1.75:enemy.type==="dog"?.48:.66;
        this.dummy.scale.set(radius*1.35,radius,1);
        this.dummy.updateMatrix();
        this.contactShadows.setMatrixAt(index++,this.dummy.matrix);
      }
      this.dummy.position.set(p.x,.041,p.z);
      this.dummy.rotation.set(-Math.PI/2,0,0);
      this.dummy.scale.set(.96,.72,1);
      this.dummy.updateMatrix();
      this.contactShadows.setMatrixAt(index++,this.dummy.matrix);
      this.contactShadows.count=index;
      this.contactShadows.instanceMatrix.needsUpdate=true;
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
    const warnings={vulture:0,charge:0,aim:0};
    for (const enemy of run.enemies) {
      if(warningCount>=24)break;
      const kind=enemy.type==="vulture"&&enemy.warning>0?"vulture"
        :enemy.charge?.warning>0?"charge":enemy.aimTimer>0?"aim":null;
      if(!kind||warnings[kind]>=8||Math.hypot(enemy.x-p.x,enemy.z-p.z)>25)continue;
      warnings[kind]++;
      positions.setXYZ(warningCount*2,enemy.x,.09,enemy.z);
      const endX=kind==="vulture"?enemy.x+enemy.vx*5.2
        :kind==="charge"?enemy.x+enemy.charge.vx*enemy.charge.left:enemy.aimX;
      const endZ=kind==="vulture"?enemy.z+enemy.vz*5.2
        :kind==="charge"?enemy.z+enemy.charge.vz*enemy.charge.left:enemy.aimZ;
      positions.setXYZ(warningCount*2+1,endX,.09,endZ);
      warningCount++;
    }
    const warning=run.bossTelegraph;
    if(warning){
      if(["dash","lunge","shotgun","volley","crossfire"].includes(warning.pattern)){
        const length=["dash","lunge"].includes(warning.pattern)
          ? (warning.pattern==="dash" ? 10.45 : 8.4)
          : Math.max(8,Math.hypot(warning.x-warning.fromX,warning.z-warning.fromZ));
        const spread=warning.pattern==="crossfire" ? .55
          : warning.pattern==="shotgun" ? .2
          : warning.pattern==="volley" ? .34 : 0;
        for(const offset of spread?[-spread,0,spread]:[0]){
          if(warningCount>=24)break;
          const angle=warning.angle+offset;
          positions.setXYZ(warningCount*2,warning.fromX,0.12,warning.fromZ);
          positions.setXYZ(warningCount*2+1,warning.fromX+Math.cos(angle)*length,0.12,warning.fromZ+Math.sin(angle)*length);
          warningCount++;
        }
      }else{
        for(let i=0;i<9&&warningCount<24;i++){
          const a=i*Math.PI*2/9,b=(i+1)*Math.PI*2/9;
          const centerX=["ringGap","pulse","summonMiner","summonSkeleton"].includes(warning.pattern)?warning.fromX:warning.x;
          const centerZ=["ringGap","pulse","summonMiner","summonSkeleton"].includes(warning.pattern)?warning.fromZ:warning.z;
          positions.setXYZ(warningCount*2,centerX+Math.cos(a)*warning.radius,.13,centerZ+Math.sin(a)*warning.radius);
          positions.setXYZ(warningCount*2+1,centerX+Math.cos(b)*warning.radius,.13,centerZ+Math.sin(b)*warning.radius);
          warningCount++;
        }
      }
    }
    for(const hazard of run.bossHazards){
      for(let i=0;i<8&&warningCount<24;i++){
        const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
        positions.setXYZ(warningCount*2,hazard.x+Math.cos(a)*hazard.radius,.13,hazard.z+Math.sin(a)*hazard.radius);
        positions.setXYZ(warningCount*2+1,hazard.x+Math.cos(b)*hazard.radius,.13,hazard.z+Math.sin(b)*hazard.radius);
        warningCount++;
      }
    }
    positions.needsUpdate = true;
    this.chargeWarnings.geometry.setDrawRange(0, warningCount * 2);
    if (this.bloomEnabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
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
  buildContactShadows(){
    const canvas=document.createElement("canvas");
    canvas.width=canvas.height=64;
    const context=canvas.getContext("2d");
    const gradient=context.createRadialGradient(32,32,2,32,32,31);
    gradient.addColorStop(0,"rgba(16,19,29,.52)");
    gradient.addColorStop(.48,"rgba(22,25,36,.32)");
    gradient.addColorStop(1,"rgba(22,25,36,0)");
    context.fillStyle=gradient;
    context.fillRect(0,0,64,64);
    const texture=new THREE.CanvasTexture(canvas);
    this.contactShadows=new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1,1),
      new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.82,depthWrite:false,side:THREE.DoubleSide}),
      Math.max(128,this.run.maxEnemies+1),
    );
    this.contactShadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.contactShadows.frustumCulled=false;
    this.contactShadows.count=0;
    this.scene.add(this.contactShadows);
  }
  drawWhip(run) {
    if(run.hero.primary==='sword'){
      this.whip.visible=false;this.trail.visible=Boolean(run.attack);
      if(run.attack){this.trail.position.set(run.player.x,.5,run.player.z);this.trail.rotation.z=-run.attack.angle;this.trail.scale.setScalar(run.primaryRange/CONFIG.whipRange);this.trail.material.opacity=Math.sin(Math.min(1,run.attack.age/.4)*Math.PI)*.45;}
      return;
    }
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
    let count = 0,bombs=0;
    const arrow = Boolean(this.primaryFletch);
    for (const shot of run.primaryShots) {
      if (count >= 64) break;
      const bomb=shot.kind==='dynamite',index=bomb?bombs:count;
      this.projectileHeading.set(shot.vx, 0, shot.vz).normalize();
      this.dummy.quaternion.setFromUnitVectors(this.projectileAxis, this.projectileHeading);
      if(shot.kind==="boomerang")this.dummy.rotateOnWorldAxis(this.projectileAxis,(shot.age+(shot.returnAge||0))*13*(shot.returnLeg?-1:1));
      if(shot.kind==='clanker')this.dummy.rotateOnWorldAxis(this.projectileAxis,shot.age*15);
      const flightProgress=shot.kind==="dynamite"?Math.min(1,shot.age/shot.flight):0;
      const flightHeight=shot.kind==="dynamite"?Math.sin(flightProgress*Math.PI)*1.15:0;
      this.dummy.position.set(shot.x, (shot.kind==='clanker'?1.02:0.96)+flightHeight, shot.z);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      (bomb?this.bombBody:this.primaryBody).setMatrixAt(index, this.dummy.matrix);
      this.dummy.position.addScaledVector(this.projectileHeading, shot.kind==='clanker'?-.12:["dynamite","boomerang"].includes(shot.kind)?.13:arrow ? 0.59 : shot.kind === "silas" ? 0.44 : 0.22);
      this.dummy.updateMatrix();
      (bomb?this.bombTip:this.primaryTip).setMatrixAt(index, this.dummy.matrix);
      if (arrow&&!bomb) {
        this.dummy.position.addScaledVector(this.projectileHeading, -1.04);
        this.dummy.updateMatrix();
        this.primaryFletch.setMatrixAt(count, this.dummy.matrix);
      }
      if(bomb)bombs++;else count++;
    }
    for(const mesh of [this.bombBody,this.bombTip]){mesh.count=bombs;mesh.instanceMatrix.needsUpdate=true;}
    for (const mesh of [this.primaryBody, this.primaryTip, this.primaryFletch]) {
      if (!mesh) continue;
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
    }
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
        0.46 + Math.sin(time * 3 + item.id) * 0.08,
        item.z,
      );
      this.dummy.rotation.set(0, 0, Math.PI / 5);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      if (item.type === "coin" || item.type === 'treasureCoin') {
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
      this.dummy.position.x -= Math.sin(Math.PI / 5) * 0.34;
      this.dummy.position.y += Math.cos(Math.PI / 5) * 0.34;
      this.dummy.updateMatrix();
      this.tips.setMatrixAt(bullets, this.dummy.matrix);
      this.dummy.position.set(item.x, 0.09, item.z);
      this.dummy.rotation.set(-Math.PI / 2, 0, 0);
      this.dummy.scale.setScalar(1 + 0.12 * Math.sin(time * 5 + item.id));
      this.dummy.updateMatrix();
      this.bulletGlows.setMatrixAt(bullets++, this.dummy.matrix);
    }
    this.bullets.count = bullets;
    this.tips.count = bullets;
    this.bulletGlows.count = bullets;
    this.coins.count = coins;
    this.bandages.count = bandages;
    this.bandageMarkA.count = this.bandageMarkB.count = bandages;
    for (const mesh of [
      this.bullets,
      this.bulletGlows,
      this.tips,
      this.coins,
      this.bandages,
      this.bandageMarkA,
      this.bandageMarkB,
    ])
      mesh.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.suppliedScenery?.dispose();
    this.controller.abort();
    disposeCowboyRig(this.player);
    this.mapMerchant.dispose();
    disposeObject(this.scene);
    for (const view of this.enemyViews.values()) view.userData.disposed = true;
    for (const pool of this.enemyPools.values())
      for (const view of pool) view.userData.disposed = true;
    this.composer?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
