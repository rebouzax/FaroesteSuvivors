import * as THREE from "three";
import { abilityStats } from "../config/abilityConfig.js";
export class AbilityEffectsView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.dummy = new THREE.Object3D();
    const instances = (geometry, material, count) => {
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.group.add(mesh);
      return mesh;
    };
    this.shots = instances(
      new THREE.SphereGeometry(0.1, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xfff4c3 }),
      128,
    );
    this.bottles = instances(
      new THREE.CylinderGeometry(0.1, 0.13, 0.4, 7),
      new THREE.MeshStandardMaterial({ color: 0x527349, roughness: 0.4 }),
      8,
    );
    this.necks = instances(
      new THREE.CylinderGeometry(0.045, 0.045, 0.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x779152 }),
      8,
    );
    this.fireGround = instances(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({
        color: 0xde5317,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
      8,
    );
    this.flames = instances(
      new THREE.ConeGeometry(0.25, 1, 5),
      new THREE.MeshBasicMaterial({
        color: 0xff9c2b,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      256,
    );
    this.cores = instances(
      new THREE.ConeGeometry(0.12, 0.6, 5),
      new THREE.MeshBasicMaterial({
        color: 0xffe999,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      256,
    );
    this.impacts = instances(
      new THREE.SphereGeometry(0.15, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffe9ae }),
      64,
    );
    this.horseshoes = instances(
      new THREE.TorusGeometry(0.31, 0.065, 5, 9, Math.PI * 1.6),
      new THREE.MeshStandardMaterial({color:0xc3a56a,metalness:0.68,roughness:0.42,emissive:0x31200c}),
      6,
    );
    this.ghosts = instances(
      new THREE.ConeGeometry(0.23, 0.8, 6),
      new THREE.MeshBasicMaterial({color:0xa9f1e2,transparent:true,opacity:0.84,depthWrite:false}),
      48,
    );
    this.silver = instances(
      new THREE.SphereGeometry(0.12,6,4),
      new THREE.MeshBasicMaterial({color:0xf2e7cc}),
      80,
    );
    this.enemyBullets = instances(
      new THREE.SphereGeometry(0.17,6,4),
      new THREE.MeshBasicMaterial({color:0xb85331}),
      40,
    );
    this.lanternAura = new THREE.Mesh(
      new THREE.RingGeometry(0.91,1,56),
      new THREE.MeshBasicMaterial({color:0x8de0ae,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false}),
    );
    this.lanternAura.rotation.x=-Math.PI/2;
    this.group.add(this.lanternAura);
    this.pulseRings = instances(
      new THREE.RingGeometry(0.86, 1, 48),
      new THREE.MeshBasicMaterial({color:0xd9eed6,transparent:true,opacity:0.62,side:THREE.DoubleSide,depthWrite:false}),
      8,
    );
  }
  put(mesh, index, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    this.dummy.position.set(x, y, z);
    this.dummy.scale.set(sx, sy, sz);
    this.dummy.rotation.set(rx, ry, rz);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);
  }
  render(run) {
    run.projectiles
      .slice(0, 128)
      .forEach((p, i) =>
        this.put(
          this.shots,
          i,
          p.x,
          1,
          p.z,
          1,
          1,
          3,
          0,
          Math.atan2(p.vx, p.vz),
        ),
      );
    this.shots.count = Math.min(128, run.projectiles.length);
    run.bottles.slice(0, 8).forEach((b, i) => {
      const t = Math.min(1, b.age / 0.65),
        x = b.fromX + (b.x - b.fromX) * t,
        z = b.fromZ + (b.z - b.fromZ) * t,
        y = 1 - t + Math.sin(t * Math.PI) * 3;
      this.put(this.bottles, i, x, y, z, 1, 1, 1, 0, 0, t * 8);
      this.put(
        this.necks,
        i,
        x - Math.sin(t * 8) * 0.28,
        y + Math.cos(t * 8) * 0.28,
        z,
        1,
        1,
        1,
        0,
        0,
        t * 8,
      );
    });
    this.bottles.count = this.necks.count = Math.min(8, run.bottles.length);
    let flames = 0;
    run.fires.slice(0, 8).forEach((fire, i) => {
      this.put(
        this.fireGround,
        i,
        fire.x,
        0.09,
        fire.z,
        fire.radius,
        fire.radius,
        1,
        -Math.PI / 2,
      );
      const fade = Math.min(1, (fire.duration - fire.age) * 3);
      for (let j = 0; j < 28; j++) {
        const angle = j * 2.39996,
          radius = Math.sqrt((j + 0.5) / 28) * fire.radius,
          height = (0.55 + Math.sin(run.time * 13 + j) * 0.25) * fade;
        const x = fire.x + Math.cos(angle) * radius,
          z = fire.z + Math.sin(angle) * radius;
        this.put(
          this.flames,
          flames,
          x,
          height * 0.5 + 0.12,
          z,
          1,
          height,
          1,
          Math.sin(run.time * 8 + j) * 0.15,
        );
        this.put(this.cores, flames++, x, height * 0.2 + 0.1, z, 1, height, 1);
      }
    });
    this.fireGround.count = Math.min(8, run.fires.length);
    this.flames.count = this.cores.count = flames;
    run.impacts
      .slice(0, 64)
      .forEach((impact, i) =>
        this.put(
          this.impacts,
          i,
          impact.x,
          1,
          impact.z,
          2 - impact.age * 5,
          2 - impact.age * 5,
          2 - impact.age * 5,
        ),
      );
    this.impacts.count = Math.min(64, run.impacts.length);
    const rank = run.abilities.horseshoe;
    if (rank) {
      const {count,radius} = abilityStats("horseshoe",rank);
      for(let i=0;i<count;i++) {
        const angle = run.time*2.7 + i*Math.PI*2/count;
        this.put(this.horseshoes,i,run.player.x+Math.cos(angle)*radius,0.5,run.player.z+Math.sin(angle)*radius,1,1,1,-Math.PI/2,0,angle);
      }
      this.horseshoes.count=count;
    } else this.horseshoes.count=0;
    run.ghostShots.slice(0,48).forEach((shot,i) =>
      this.put(this.ghosts,i,shot.x,1,shot.z,1,1,1,Math.PI/2,0,Math.atan2(shot.vz,shot.vx)));
    this.ghosts.count=Math.min(48,run.ghostShots.length);
    run.silverShots.slice(0,80).forEach((shot,i)=>this.put(this.silver,i,shot.x,0.9,shot.z));
    this.silver.count=Math.min(80,run.silverShots.length);
    run.enemyShots.slice(0,40).forEach((shot,i)=>this.put(this.enemyBullets,i,shot.x,0.85,shot.z));
    this.enemyBullets.count=Math.min(40,run.enemyShots.length);
    this.lanternAura.visible=Boolean(run.abilities.lantern);
    if (run.abilities.lantern) {
      const radius=abilityStats("lantern",run.abilities.lantern).radius;
      this.lanternAura.position.set(run.player.x,0.1,run.player.z);
      this.lanternAura.scale.set(radius,radius,1);
      this.lanternAura.material.opacity=0.24+Math.sin(run.time*5)*0.07;
    }
    run.pulses.slice(0,8).forEach((pulse,i)=> {
      const size=pulse.radius*Math.max(0.03,pulse.age/0.55);
      this.put(this.pulseRings,i,pulse.x,0.1,pulse.z,size,size,1,-Math.PI/2);
    });
    this.pulseRings.count=Math.min(8,run.pulses.length);
    for (const mesh of this.group.children)
      if (mesh.isInstancedMesh) mesh.instanceMatrix.needsUpdate = true;
  }
}
