import * as THREE from "three";
import { ABILITIES, abilityStats } from "../config/abilityConfig.js";
import { FRONTIER_CARDS } from "../config/frontierExpansion.js";
export class AbilityEffectsView {
  constructor(scene, quality = "normal") {
    this.highQuality = quality === "high";
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
      new THREE.SphereGeometry(0.1, this.highQuality ? 12 : 5, this.highQuality ? 8 : 4),
      new THREE.MeshBasicMaterial({ color: 0xfff4c3 }),
      128,
    );
    this.bottles = instances(
      new THREE.CylinderGeometry(0.1, 0.13, 0.4, this.highQuality ? 12 : 7),
      new THREE.MeshStandardMaterial({ color: 0x527349, roughness: 0.4 }),
      8,
    );
    this.necks = instances(
      new THREE.CylinderGeometry(0.045, 0.045, 0.2, this.highQuality ? 10 : 6),
      new THREE.MeshStandardMaterial({ color: 0x779152 }),
      8,
    );
    this.fireGround = instances(
      new THREE.CircleGeometry(1, this.highQuality ? 72 : 40),
      new THREE.MeshBasicMaterial({
        color: 0xde5317,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
      8,
    );
    this.flames = instances(
      new THREE.ConeGeometry(0.25, 1, this.highQuality ? 10 : 5, this.highQuality ? 2 : 1),
      new THREE.MeshBasicMaterial({
        color: 0xff9c2b,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      this.highQuality ? 320 : 256,
    );
    this.cores = instances(
      new THREE.ConeGeometry(0.12, 0.6, this.highQuality ? 9 : 5, this.highQuality ? 2 : 1),
      new THREE.MeshBasicMaterial({
        color: 0xffe999,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      this.highQuality ? 320 : 256,
    );
    this.impacts = instances(
      new THREE.SphereGeometry(0.15, this.highQuality ? 12 : 6, this.highQuality ? 8 : 4),
      new THREE.MeshBasicMaterial({ color: 0xffe9ae }),
      64,
    );
    this.horseshoes = instances(
      new THREE.TorusGeometry(0.31, 0.065, this.highQuality ? 9 : 5, this.highQuality ? 28 : 9, Math.PI * 1.6),
      new THREE.MeshStandardMaterial({color:0xc3a56a,metalness:0.68,roughness:0.42,emissive:0x31200c}),
      6,
    );
    this.ghosts = instances(
      new THREE.ConeGeometry(0.23, 0.8, this.highQuality ? 10 : 6, this.highQuality ? 2 : 1),
      new THREE.MeshBasicMaterial({color:0xa9f1e2,transparent:true,opacity:0.84,depthWrite:false}),
      48,
    );
    this.silver = instances(
      new THREE.SphereGeometry(0.12,this.highQuality?10:6,this.highQuality?7:4),
      new THREE.MeshBasicMaterial({color:0xf2e7cc}),
      80,
    );
    this.enemyBullets = instances(
      new THREE.SphereGeometry(0.17,this.highQuality?10:6,this.highQuality?7:4),
      new THREE.MeshBasicMaterial({color:0xb85331}),
      40,
    );
    this.lanternAura = new THREE.Mesh(
      new THREE.RingGeometry(0.91,1,this.highQuality?112:56),
      new THREE.MeshBasicMaterial({color:0x8de0ae,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false}),
    );
    this.lanternAura.rotation.x=-Math.PI/2;
    this.group.add(this.lanternAura);
    this.pulseRings = instances(
      new THREE.RingGeometry(0.86, 1, this.highQuality ? 96 : 48),
      new THREE.MeshBasicMaterial({color:0xd9eed6,transparent:true,opacity:0.62,side:THREE.DoubleSide,depthWrite:false}),
      8,
    );
    if (this.highQuality) {
      this.passiveSigilIds=Object.keys(FRONTIER_CARDS).filter(id=>FRONTIER_CARDS[id].stats);
      this.movingShots=[];
      this.trailAxis=new THREE.Vector3(0,1,0);
      this.trailHeading=new THREE.Vector3();
      this.trailColor=new THREE.Color();
      this.silverColor=new THREE.Color();
      this.fireRings = instances(
        new THREE.RingGeometry(0.92, 1, 96),
        new THREE.MeshBasicMaterial({ color: 0xffb35e, transparent: true, opacity: 0.76, side: THREE.DoubleSide, depthWrite: false }),
        8,
      );
      this.embers = instances(
        new THREE.ConeGeometry(0.065, 0.23, 7),
        new THREE.MeshBasicMaterial({ color: 0xffcf78, transparent: true, opacity: 0.88, depthWrite: false }),
        192,
      );
      this.sparkles = instances(
        new THREE.SphereGeometry(0.055, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xfff0bb, transparent: true, opacity: 0.9, depthWrite: false }),
        256,
      );
      this.trails = instances(
        new THREE.CapsuleGeometry(0.035, 0.42, 3, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.48, depthWrite: false }),
        320,
      );
      this.pulseCores = instances(
        new THREE.RingGeometry(0.9, 1, 96),
        new THREE.MeshBasicMaterial({ color: 0xfff1bf, transparent: true, opacity: 0.76, side: THREE.DoubleSide, depthWrite: false }),
        8,
      );
      this.cardSigils=instances(
        new THREE.DodecahedronGeometry(.12,1),
        new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x252525,metalness:.58,roughness:.32}),
        Math.max(1,this.passiveSigilIds.length),
      );
      this.sigilColor=new THREE.Color();
    }
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
    let flames = 0, embers=0;
    const firePatches = run.fires.slice(0,run.bossHazards.length?7:8);
    if(run.bossHazards.length)firePatches.push({...run.bossHazards[0],age:0});
    firePatches.forEach((fire, i) => {
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
      if(this.highQuality){
        const flicker=.9+Math.sin((run.visualTime??run.time)*5+i*1.7)*.1;
        this.put(this.fireRings,i,fire.x,.095,fire.z,fire.radius*flicker,fire.radius*flicker,1,-Math.PI/2,run.time*.14);
      }
      const fade = Math.min(1, (fire.duration - fire.age) * 3);
      const flameCount=this.highQuality?40:28;
      for (let j = 0; j < flameCount; j++) {
        const angle = j * 2.39996,
          radius = Math.sqrt((j + 0.5) / flameCount) * fire.radius,
          height = (0.55 + Math.sin((run.visualTime??run.time) * 13 + j) * 0.25) * fade;
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
          Math.sin((run.visualTime??run.time) * 8 + j) * 0.15,
        );
        this.put(this.cores, flames++, x, height * 0.2 + 0.1, z, 1, height, 1);
        if(this.highQuality&&j%2===0){
          const emberIndex=embers++;
          const emberAngle=angle+(run.visualTime??run.time)*(j%4===0?1.3:-1.05);
          const lift=.38+(((run.visualTime??run.time)*1.7+j*.19)%1)*1.65;
          this.put(this.embers,emberIndex,x+Math.cos(emberAngle)*(.15+radius*.22),lift,z+Math.sin(emberAngle)*(.15+radius*.22),.8,fade*(.7+((j%5)*.1)),.8,Math.sin((run.visualTime??run.time)*4+j)*.2,emberAngle);
        }
      }
    });
    this.fireGround.count = firePatches.length;
    this.flames.count = this.cores.count = flames;
    if(this.highQuality){
      this.fireRings.count=firePatches.length;
      this.embers.count=Math.min(192,embers);
    }
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
    if(this.highQuality){
      let sparkCount=0;
      run.impacts.slice(0,64).forEach((impact,i)=>{
        if(impact.age>.3)return;
        const life=Math.max(.04,1-impact.age/0.3);
        for(let j=0;j<4;j++){
        const angle=j*Math.PI/2+i*.77+(run.visualTime??run.time)*1.8;
          const radius=.18+impact.age*2.5;
          this.put(this.sparkles,sparkCount++,impact.x+Math.cos(angle)*radius,.26+life*.25,impact.z+Math.sin(angle)*radius,life,life,life);
        }
      });
      this.sparkles.count=sparkCount;
      const movingShots=this.movingShots;
      movingShots.length=0;
      for(const shots of [run.projectiles,run.ghostShots,run.silverShots,run.primaryShots])
        for(const shot of shots){if(movingShots.length>=320)break;movingShots.push(shot);}
      movingShots.forEach((shot,i)=>{
        this.trailHeading.set(shot.vx||0,0,shot.vz||0);
        if(this.trailHeading.lengthSq()<1e-6){this.put(this.trails,i,shot.x,.92,shot.z,0,0,0);return;}
        this.trailHeading.normalize();
        this.dummy.quaternion.setFromUnitVectors(this.trailAxis,this.trailHeading);
        this.dummy.position.set(shot.x-this.trailHeading.x*.32,.94,shot.z-this.trailHeading.z*.32);
        this.dummy.scale.set(1,1,1);
        this.dummy.updateMatrix();
        this.trails.setMatrixAt(i,this.dummy.matrix);
        const color=shot.source==="boneStorm"?0xbde2da:shot.kind==="boomerang"?0xf7bf63:shot.kind==="ghostShot"||shot.hit?0xa7d8ee:0xffedb6;
        this.trails.setColorAt(i,this.trailColor.setHex(color));
      });
      this.trails.count=movingShots.length;
      if(this.trails.instanceColor)this.trails.instanceColor.needsUpdate=true;
    }
    const rank = run.abilities.horseshoe;
    if (rank) {
      const {count,radius} = abilityStats("horseshoe",rank);
      for(let i=0;i<count;i++) {
        const angle = run.time*2.7 + i*Math.PI*2/count;
        this.put(this.horseshoes,i,run.player.x+Math.cos(angle)*radius,0.5,run.player.z+Math.sin(angle)*radius,1,1,1,-Math.PI/2,0,angle);
      }
      this.horseshoes.count=count;
    } else this.horseshoes.count=0;
    if(this.highQuality){
      let sigilIndex=0;
      for(const id of this.passiveSigilIds){
        const level=run.abilities[id];
        if(!level)continue;
        const angle=(run.visualTime??run.time)*.62+sigilIndex*2.39996;
        const radius=1.02+Math.floor(sigilIndex/6)*.13;
        this.dummy.position.set(run.player.x+Math.cos(angle)*radius,1.32+Math.sin((run.visualTime??run.time)*2.1+sigilIndex)*.13,run.player.z+Math.sin(angle)*radius);
        this.dummy.rotation.set((run.visualTime??run.time)*.7+sigilIndex,angle,(run.visualTime??run.time)*.4);
        this.dummy.scale.setScalar(.72+Math.min(4,level)*.055);
        this.dummy.updateMatrix();
        this.cardSigils.setMatrixAt(sigilIndex,this.dummy.matrix);
        const tint=ABILITIES[id]?.color==="fire"?0xffa566:ABILITIES[id]?.color==="heart"?0xf58e9d:0x9bd5ec;
        this.cardSigils.setColorAt(sigilIndex,this.sigilColor.setHex(tint));
        sigilIndex++;
      }
      this.cardSigils.count=sigilIndex;
    }
    run.ghostShots.slice(0,48).forEach((shot,i) =>
      this.put(this.ghosts,i,shot.x,1,shot.z,1,1,1,Math.PI/2,0,Math.atan2(shot.vz,shot.vx)));
    this.ghosts.count=Math.min(48,run.ghostShots.length);
    run.silverShots.slice(0,80).forEach((shot,i)=>{
      this.put(this.silver,i,shot.x,0.9,shot.z);
      if(this.highQuality)this.silver.setColorAt(i,this.silverColor.setHex(shot.source==="boneStorm"?0xc7e9d9:0xf2e7cc));
    });
    this.silver.count=Math.min(80,run.silverShots.length);
    run.enemyShots.slice(0,40).forEach((shot,i)=>this.put(this.enemyBullets,i,shot.x,0.85,shot.z));
    this.enemyBullets.count=Math.min(40,run.enemyShots.length);
    this.lanternAura.visible=Boolean(run.abilities.lantern || run.abilities.inferno);
    if (run.abilities.lantern || run.abilities.inferno) {
      const radius=abilityStats("lantern",Math.max(1,run.abilities.lantern)).radius;
      this.lanternAura.position.set(run.player.x,0.1,run.player.z);
      this.lanternAura.scale.set(radius,radius,1);
      this.lanternAura.material.opacity=0.24+Math.sin((run.visualTime??run.time)*5)*0.07;
    }
    run.pulses.slice(0,8).forEach((pulse,i)=> {
      const size=pulse.radius*Math.max(0.03,pulse.age/0.55);
      this.put(this.pulseRings,i,pulse.x,0.1,pulse.z,size,size,1,-Math.PI/2);
      if(this.highQuality)this.put(this.pulseCores,i,pulse.x,.11,pulse.z,size*.83,size*.83,1,-Math.PI/2);
    });
    this.pulseRings.count=Math.min(8,run.pulses.length);
    if(this.highQuality)this.pulseCores.count=Math.min(8,run.pulses.length);
    for (const mesh of this.group.children)
      if (mesh.isInstancedMesh) {
        mesh.instanceMatrix.needsUpdate = true;
        if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      }
  }
}
