import { CONFIG } from "../config/gameConfig.js";
import { pushOut } from './SceneryCollision.js';
import { FRONTIER_ENEMIES } from "../config/frontierExpansion.js";
import { enemyStats } from "../config/abilityConfig.js";
import { ENEMY_STAGE_GROUPS } from "../config/campaignConfig.js";
import { EARLY_ENEMIES } from "../config/earlyEnemies.js";
const clamp = (value) =>
  Math.max(-CONFIG.mapHalf + 1, Math.min(CONFIG.mapHalf - 1, value));
const RANGED_ENEMIES = new Set(["bellRinger","lanternThief","windmillWraith","drownedProspector","barBanshee","railWitch","graveRider","sundownBandit",...Object.keys(FRONTIER_ENEMIES).filter(id=>FRONTIER_ENEMIES[id].behavior==="ranged")]);
const CELL = 2.5;
const cellKey = (x,z) => `${Math.floor(x/CELL)},${Math.floor(z/CELL)}`;
const tacticFor = type => EARLY_ENEMIES[type]?.behavior || (RANGED_ENEMIES.has(type)||type==="skeleton" ? "ranged" : FRONTIER_ENEMIES[type]?.behavior||"chase");
export class EnemySystem {
  constructor(){this.propGrids=new WeakMap();}
  nearbyProps(run,x,z){
    if(this.propGrids.get(run)?.props!==run.props){
      const cells=new Map();
      for(const prop of run.props||[]){
        const extent=(prop.radius||0)+1.5;
        for(let cx=Math.floor((prop.x-extent)/CELL);cx<=Math.floor((prop.x+extent)/CELL);cx++)
          for(let cz=Math.floor((prop.z-extent)/CELL);cz<=Math.floor((prop.z+extent)/CELL);cz++){
            const key=`${cx},${cz}`;
            if(!cells.has(key))cells.set(key,[]);
            cells.get(key).push(prop);
          }
      }
      this.propGrids.set(run,{cells,props:run.props});
    }
    return this.propGrids.get(run).cells.get(cellKey(x,z))||[];
  }
  keepOutOfProps(run,enemy){
    let blocked=false;
    for(let pass=0;pass<3;pass++)for(const prop of this.nearbyProps(run,enemy.x,enemy.z))blocked=pushOut(enemy,prop,enemy.treasure?.85:enemy.bossId?1:.4)||blocked;
    return blocked;
  }
  spawnForStage(run) {
    const roster = ENEMY_STAGE_GROUPS[run.mapId];
    if (!roster?.length) throw new Error("Fase sem bestiário: " + run.mapId);
    // Vultures use the separate fly-by spawner, which supplies velocity and warning.
    const walkers = roster.filter(id => id !== "vulture");
    return this.spawn(run, walkers[Math.floor(run.random() * walkers.length)]);
  }
  spawn(run, type = "bat") {
    if (run.enemies.length >= (run.maxEnemies || CONFIG.maxBats)) return;
    const stats = enemyStats(type, Math.floor(run.time / 60));
    const enemy = {
      id: ++run.nextId,
      type,
      ...stats,
      maxHp: stats.hp,
      x: 0,
      z: 0,
      hitFlash: 0,
    };
    this.position(run, enemy);
    run.enemies.push(enemy);
  }
  position(run, enemy) {
    const angle = run.random() * Math.PI * 2;
    enemy.x = clamp(run.player.x + Math.cos(angle) * 33);
    enemy.z = clamp(run.player.z + Math.sin(angle) * 33);
    if (Math.hypot(enemy.x - run.player.x, enemy.z - run.player.z) < 24) {
      enemy.x = clamp(run.player.x - Math.cos(angle) * 33);
      enemy.z = clamp(run.player.z - Math.sin(angle) * 33);
    }
  }
  update(run, dt) {
    if (run.bossEncounter.active) {
      const boss = run.enemies.find(e => e.type === "boss" || e.type === "marshal");
      if (boss?.hp > 0) {
        const dx = run.player.x - boss.x, dz = run.player.z - boss.z;
        const distance = Math.hypot(dx,dz);
        if (distance > .01 && !boss.dash && !run.bossTelegraph) {
          const ranged=["volley","shotgun","crossfire","ringGap","tornadoes"].includes(boss.pattern);
          const preferred=ranged?5.5:2.3;
          const approach=distance>preferred+1?1:distance<preferred-1&&ranged?-.55:0;
          const orbit=distance<10?(boss.id%2?1:-1)*(.32+(boss.phase||1)*.12):0;
          const pace=boss.speed*(1+((boss.phase||1)-1)*.1);
          boss.x=clamp(boss.x+(dx/distance*approach-dz/distance*orbit)*pace*dt);
          boss.z=clamp(boss.z+(dz/distance*approach+dx/distance*orbit)*pace*dt);
        }
        boss.hitFlash = Math.max(0,boss.hitFlash-dt);
        this.keepOutOfProps(run,boss);
        boss.attackFlash = Math.max(0,(boss.attackFlash||0)-dt);
        boss.releaseFlash = Math.max(0,(boss.releaseFlash||0)-dt);
        boss.swingTimer = (boss.swingTimer??1.2)-dt;
        if (distance < 3 && boss.swingTimer <= 0) {
          boss.attackFlash = 0.58;
          boss.swingTimer = 2;
        }
      }
      for(const minion of run.enemies){
        if(!minion.summoned||minion.hp<=0)continue;
        const dx=run.player.x-minion.x,dz=run.player.z-minion.z,d=Math.hypot(dx,dz);
        if(d>.1){minion.x+=dx/d*minion.speed*dt;minion.z+=dz/d*minion.speed*dt;}
        this.keepOutOfProps(run,minion);
        minion.hitFlash=Math.max(0,minion.hitFlash-dt);
      }
      this.updateShots(run,dt);
      return;
    }
    const minute = Math.floor(run.time / 60);
    if (minute !== run.difficulty) {
      run.difficulty = minute;
      for (const enemy of run.enemies) {
        if(enemy.treasure)continue;
        if (enemy.type === "vulture" || enemy.type === "boss" || enemy.type === "marshal") continue;
        const stats = enemyStats(enemy.type, minute),
          fraction = enemy.hp / enemy.maxHp;
        Object.assign(enemy, stats, {
          hp: stats.hp * fraction,
          maxHp: stats.hp,
        });
      }
    }
    if (run.mapId === "desert" && run.time >= 120) {
      run.vultureTimer -= dt;
      if (run.vultureTimer <= 0) {
        run.vultureTimer = Math.max(12, 22 - minute);
        this.spawnVultures(run);
      }
    }
    run.spawnTimer -= dt;
    if (run.spawnTimer <= 0) {
      run.spawnTimer = Math.max(0.3, 1.5 - run.time / 700);
      for (let i = 0; i < 1 + Math.floor(run.time / 180); i++) this.spawnForStage(run);
    }
    if (ENEMY_STAGE_GROUPS[run.mapId]?.includes("dog") && run.time >= 60) {
      run.dogTimer -= dt;
      if (run.dogTimer <= 0) {
        run.dogTimer = Math.max(2, 7 - (run.time - 60) / 140);
        if (run.enemies.length >= (run.maxEnemies || CONFIG.maxBats)) {
          const index = run.enemies.findIndex(
            (e) =>
              e.type === "bat" &&
              Math.hypot(e.x - run.player.x, e.z - run.player.z) > 24,
          );
          if (index >= 0) run.enemies.splice(index, 1);
        }
        for (let i = 0; i < 1 + Math.floor((run.time - 60) / 240); i++)
          this.spawn(run, "dog");
      }
    }
    if (ENEMY_STAGE_GROUPS[run.mapId]?.includes("skeleton") && run.time >= 180) {
      run.skeletonTimer -= dt;
      if (run.skeletonTimer <= 0) {
        run.skeletonTimer = Math.max(3.5, 11 - minute * 0.55);
        this.spawn(run, "skeleton");
      }
    }
    if (ENEMY_STAGE_GROUPS[run.mapId]?.includes("miner") && run.time >= 270) {
      run.minerTimer -= dt;
      if (run.minerTimer <= 0) {
        run.minerTimer = Math.max(5, 15 - minute * 0.5);
        this.spawn(run, "miner");
      }
    }
    if(ENEMY_STAGE_GROUPS[run.mapId]){
      run.specialSpawnTimer-=dt;
      if(run.specialSpawnTimer<=0){run.specialSpawnTimer=Math.max(2.4,7.5-minute*.22);
        this.spawnForStage(run);}
    }
    // Local separation avoids a quadratic all-enemies scan and keeps packs
    // from collapsing into one silhouette at high wave counts.
    const grid=new Map();
    for(const enemy of run.enemies){
      if(enemy.hp<=0||enemy.type==="vulture")continue;
      const key=cellKey(enemy.x,enemy.z);
      if(!grid.has(key))grid.set(key,[]);
      grid.get(key).push(enemy);
    }
    for (const enemy of run.enemies) {
      if(enemy.treasure)continue;
      if (enemy.type === "vulture") {
        enemy.age += dt;
        enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
        if (enemy.warning > 0) {
          enemy.warning = Math.max(0, enemy.warning - dt);
          continue;
        }
        enemy.x += enemy.vx * dt;
        enemy.z += enemy.vz * dt;
        this.keepOutOfProps(run,enemy);
        continue;
      }
      let dx = run.player.x - enemy.x,
        dz = run.player.z - enemy.z,
        distance = Math.hypot(dx, dz);
      if (distance > 55) {
        this.position(run, enemy);
        dx = run.player.x - enemy.x;
        dz = run.player.z - enemy.z;
        distance = Math.hypot(dx, dz);
      }
      const role=tacticFor(enemy.type);
      if(role==="charge"||role==="orbit"){
        enemy.chargeTimer=(enemy.chargeTimer??(1.5+enemy.id%3))-dt;
        if(enemy.chargeTimer<=0&&!enemy.charge&&distance<13&&distance>2){
          const lead=run.player.moving?Math.min(1.2,run.moveSpeed*.24):0;
          const tx=run.player.x+run.player.dx*lead,tz=run.player.z+run.player.dz*lead;
          const angle=Math.atan2(tz-enemy.z,tx-enemy.x),speed=role==="charge"?8:6.7;
          enemy.charge={vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,
            left:role==="charge" ? .7 : .48,warning:role==="charge" ? .7 : .5};
          enemy.chargeTimer=role==="charge"?4.6:5.1;
          enemy.attackFlash=.65;
        }
        if(enemy.charge){
          const c=enemy.charge;
          const warningBefore=c.warning;
          c.warning=Math.max(0,c.warning-dt);
          const travelDt=Math.max(0,dt-warningBefore);
          if(c.warning<=0){
            enemy.x=clamp(enemy.x+c.vx*travelDt);enemy.z=clamp(enemy.z+c.vz*travelDt);
            c.left-=travelDt;
            if(this.keepOutOfProps(run,enemy)||c.left<=0)enemy.charge=null;
          }
          enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);
          enemy.attackFlash=Math.max(0,(enemy.attackFlash||0)-dt);
          continue;
        }
      }
      if (distance > 0.05) {
        const approach=role==="ranged"?(distance<7?-1:distance<11?0:1):role==="orbit"&&distance<4 ? .4 : 1;
        const orbit=distance<12?(enemy.id%2?1:-1)*(role==="orbit"?1.1:role==="ranged" ? .52 : .22):0;
        let steerX=dx/distance*approach-dz/distance*orbit;
        let steerZ=dz/distance*approach+dx/distance*orbit;
        const cx=Math.floor(enemy.x/CELL),cz=Math.floor(enemy.z/CELL);
        for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){
          for(const other of grid.get(`${cx+ox},${cz+oz}`)||[]){
            if(other===enemy)continue;
            const awayX=enemy.x-other.x,awayZ=enemy.z-other.z,square=awayX*awayX+awayZ*awayZ;
            if(square<=.0001){steerX+=enemy.id>other.id ? .55 : -.55;continue;}
            if(square<2.25){steerX+=awayX/square*.36;steerZ+=awayZ/square*.36;}
          }
        }
        for(const prop of this.nearbyProps(run,enemy.x,enemy.z)){
          if(prop.halfX!=null){const probe={x:enemy.x,z:enemy.z};if(pushOut(probe,prop,1.1)){steerX+=(probe.x-enemy.x)*2;steerZ+=(probe.z-enemy.z)*2;}continue;}
          const awayX=enemy.x-prop.x,awayZ=enemy.z-prop.z;
          const space=Math.hypot(awayX,awayZ),boundary=(prop.radius||0)+.7;
          if(space<boundary+1){
            const factor=(boundary+1-space)/Math.max(.1,space);
            steerX+=awayX*factor*1.25;
            steerZ+=awayZ*factor*1.25;
          }
        }
        const magnitude=Math.hypot(steerX,steerZ);
        if(magnitude>.01){
          const scale=enemy.speed/Math.max(1,magnitude);
          enemy.x=clamp(enemy.x+steerX*scale*dt);
          enemy.z=clamp(enemy.z+steerZ*scale*dt);
          this.keepOutOfProps(run,enemy);
        }
      }
      if(role==="ranged"&&enemy.hp>0){
        const range=enemy.type==="skeleton"?17:19;
        if(enemy.aimTimer>0){
          enemy.aimTimer=Math.max(0,enemy.aimTimer-dt);
          if(enemy.aimTimer===0&&distance<range+3){
            const ax=enemy.aimX-enemy.x,az=enemy.aimZ-enemy.z,aimLength=Math.hypot(ax,az);
            if(run.enemyShots.length<40&&aimLength>.01){
              const speed=enemy.type==="skeleton"?8:9;
              run.enemyShots.push({x:enemy.x,z:enemy.z,vx:ax/aimLength*speed,vz:az/aimLength*speed,age:0,damage:enemy.type==="skeleton"?enemy.damage:Math.ceil(enemy.damage*.55)});
            }
            enemy.attackFlash=.58;
          }
        }else if(distance<range){
          enemy.shotTimer=(enemy.shotTimer??(enemy.type==="skeleton"?1.3:1.8))-dt;
          if(enemy.shotTimer<=0){
            const lead=run.player.moving?Math.min(1.1,run.moveSpeed*.19):0;
            enemy.aimX=run.player.x+run.player.dx*lead;
            enemy.aimZ=run.player.z+run.player.dz*lead;
            enemy.aimTimer=.42+(enemy.id%3)*.06;
            enemy.shotTimer=enemy.type==="skeleton"?2.7:3.2;
            enemy.attackFlash=.58;
          }
        }
      }
      enemy.attackFlash = Math.max(0,(enemy.attackFlash||0)-dt);
      if (enemy.type === "miner" && distance < 2.2) {
        enemy.lurchTimer = (enemy.lurchTimer??0)-dt;
        if (enemy.lurchTimer <= 0) {
          enemy.attackFlash=0.58;
          enemy.lurchTimer=2.3;
        }
      }
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    }
    // A charge never follows or teleports back to João. It leaves the arena.
    run.enemies = run.enemies.filter(
      (enemy) => enemy.type !== "vulture" || enemy.hp <= 0 || enemy.age < 10,
    );
    for (const type of ["dog"]) {
      run.enemyVoiceTimers[type] -= dt;
      if (
        run.enemyVoiceTimers[type] <= 0 &&
        run.enemies.some(
          (e) =>
            e.type === type &&
            Math.hypot(e.x - run.player.x, e.z - run.player.z) < 18,
        )
      ) {
        run.events.push(type);
        run.enemyVoiceTimers[type] = 7 + run.random() * 4;
      }
    }
    this.updateShots(run,dt);
  }
  updateShots(run,dt){
    run.enemyShots = run.enemyShots.filter(shot => {
      shot.x += shot.vx * dt;
      shot.z += shot.vz * dt;
      shot.age += dt;
      const player = run.player;
      if (Math.hypot(shot.x-player.x,shot.z-player.z) < 0.63) {
        if (player.invulnerable <= 0) {
          player.hp = Math.max(0, player.hp - shot.damage * 20 / (20 + run.playerArmor));
          player.invulnerable = 0.9;
          run.events.push("hurt");
          if (player.hp <= 0) run.phase = "defeat";
        }
        return false;
      }
      return shot.age < 4;
    });
  }
  spawnVultures(run) {
    if (run.enemies.filter((e) => e.type === "vulture").length > 18) return;
    const angle = run.random() * Math.PI * 2;
    const dx = Math.cos(angle),
      dz = Math.sin(angle);
    // Snapshot at spawn: six parallel lanes, never a homing attack.
    const targetX = run.player.x,
      targetZ = run.player.z;
    for (let i = 0; i < 6; i++) {
      const offset = (i - 2.5) * 1.4;
      run.enemies.push({
        id: ++run.nextId,
        type: "vulture",
        hp: 6,
        maxHp: 6,
        damage: 2,
        armor: 0,
        speed: 10,
        xp: 10,
        x: targetX - dx * 26 - dz * offset,
        z: targetZ - dz * 26 + dx * offset,
        vx: dx * 10,
        vz: dz * 10,
        targetX,
        targetZ,
        hitFlash: 0,
        warning: 1.5,
        age: 0,
      });
    }
    run.events.push("vulture");
  }
}
