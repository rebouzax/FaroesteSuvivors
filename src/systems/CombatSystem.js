import { CONFIG } from "../config/gameConfig.js";
import { intercept, trackTargets } from './ChampionAim.js';
import { abilityStats } from "../config/abilityConfig.js";
export class CombatSystem {
  rate(run){return run.attackRate*(run.abilities.lastStand&&run.player.hp/run.player.maxHp<0.35?1+run.abilities.lastStand*0.2:1);}
  damage(enemy, amount, source = "") {
    const advantage = (enemy.weakness === source ? 1.8 : 1) * (enemy.counter === source ? 1.5 : 1);
    enemy.hp -= (amount * advantage * 20) / (20 + enemy.armor);
    enemy.hitFlash = 0.12;
  }
  closest(run, range) {
    let target = null;
    for (const enemy of run.enemies) {
      const distance = Math.hypot(
        enemy.x - run.player.x,
        enemy.z - run.player.z,
      );
      if (enemy.hp > 0 && distance < range) {
        target = enemy;
        range = distance;
      }
    }
    return target;
  }
  multiplier(run, id) {
    return run.empowered.id === id && run.empowered.remaining > 0
      ? run.empowered.multiplier
      : 1;
  }
  update(run, dt) {
    trackTargets(run,dt);
    run.empowered.remaining = Math.max(0, run.empowered.remaining - dt);
    run.shotFlash = Math.max(0, run.shotFlash - dt);
    run.throwFlash = Math.max(0, run.throwFlash - dt);
    run.primaryFlash=Math.max(0,run.primaryFlash-dt);
    this.whip(run, dt);
    this.primaryProjectiles(run,dt);
    this.releasePrimaryShots(run,dt);
    this.returningCards(run,dt);
    this.pirateBomb(run,dt);
    this.pistol(run, dt);
    this.molotov(run, dt);
    this.horseshoes(run, dt);
    this.ghostShot(run, dt);
    this.requiem(run, dt);
    this.silverRain(run, dt);
    this.boneStorm(run,dt);
    this.lantern(run, dt);
    run.impacts = run.impacts.filter((impact) => (impact.age += dt) < 0.3);
  }
  returningCards(run,dt){
    const id=run.abilities.lunarReturn?"lunarReturn":run.abilities.returningBlade?"returningBlade":null;
    if(!id||run.hero.primary==="boomerang")return;
    run.boomerangTimer-=dt;
    if(run.boomerangTimer>0)return;
    const rank=run.abilities[id],stats=abilityStats(id,rank),target=this.closest(run,stats.range);
    if(!target){run.boomerangTimer=.35;return;}
    const p=run.player,angle=Math.atan2(target.z-p.z,target.x-p.x),distance=Math.min(stats.range,Math.hypot(target.x-p.x,target.z-p.z)),flight=Math.max(.38,distance/16);
    run.primaryShots.push({x:p.x,z:p.z,startX:p.x,startZ:p.z,vx:Math.cos(angle)*distance/flight,vz:Math.sin(angle)*distance/flight,age:0,flight,returnAge:0,returnLeg:false,damage:stats.damage,pierce:99,hit:new Set(),kind:"boomerang"});
    run.boomerangTimer=Math.max(.8,stats.cooldown/this.rate(run));run.primaryFlash=.2;run.throwFlash=.65;run.events.push("throw");
  }
  pirateBomb(run,dt){
    if(!run.abilities.pirateBomb)return;
    run.pirateBombTimer-=dt;if(run.pirateBombTimer>0)return;
    const stats=abilityStats('pirateBomb',run.abilities.pirateBomb),target=this.closest(run,stats.range);
    if(!target){run.pirateBombTimer=.25;return;}
    const aim=intercept(run.player,target,15,.3),dx=aim.x-run.player.x,dz=aim.z-run.player.z,flight=aim.flight;
    const first=run.primaryShots.length;
    run.primaryShots.push({x:run.player.x,z:run.player.z,vx:dx/flight,vz:dz/flight,age:0,flight,damage:stats.damage*this.multiplier(run,'pirateBomb'),pierce:1,hit:new Set(),kind:'dynamite'});
    this.extraPrimaryShots(run,first);
    run.pirateBombTimer=stats.cooldown/this.rate(run);run.throwFlash=.65;run.events.push('throw');
  }
  whip(run, dt) {
    if(run.characterId!=="joao"){
      this.rangedPrimary(run,dt);
      return;
    }
    run.cooldown -= dt;
    if (!run.attack && run.cooldown <= 0) {
      const target = this.closest(run, CONFIG.whipRange + 2),
        p = run.player;
      run.attack = {
        age: 0,
        angle: target
          ? Math.atan2(target.z - p.z, target.x - p.x)
          : Math.atan2(p.dz, p.dx),
        hit: false,
      };
      run.cooldown = Math.max(
        CONFIG.whipDuration + 0.02,
        CONFIG.whipCooldown / this.rate(run),
      );
    }
    const attack = run.attack;
    if (!attack) return;
    attack.age += dt;
    if (!attack.hit && attack.age >= 0.18) {
      attack.hit = true;
      run.events.push("whip");
      const p = run.player;
      const target=this.closest(run,CONFIG.whipRange+2);
      if(target)attack.angle=Math.atan2(target.z-p.z,target.x-p.x);
      for (const enemy of run.enemies) {
        const dx = enemy.x - p.x,
          dz = enemy.z - p.z,
          distance = Math.hypot(dx, dz);
        if (
          distance <= CONFIG.whipRange &&
          (dx * Math.cos(attack.angle) + dz * Math.sin(attack.angle)) /
            Math.max(0.001, distance) >
            -0.1
        )
          this.damage(enemy, run.primaryDamage + run.whipRank * 3, run.characterId);
      }
    }
    if (attack.age >= CONFIG.whipDuration) run.attack = null;
  }
  rangedPrimary(run,dt){
    run.cooldown-=dt;
    const hero=run.hero;
    if(!run.attack&&run.cooldown<=0){
      const target=this.closest(run,run.primaryRange);
      const p=run.player;
      run.attack={age:0,angle:target?Math.atan2(target.z-p.z,target.x-p.x):Math.atan2(p.dz,p.dx),hit:false};
      run.cooldown=Math.max(0.32,hero.cooldown/this.rate(run));
    }
    const attack=run.attack;
    if(!attack)return;
    attack.age+=dt;
    if(!attack.hit&&attack.age>=0.16){
      attack.hit=true;
      const p=run.player;
      const target=this.closest(run,run.primaryRange);
      const speed=["maria","rosa","teo"].includes(run.characterId)?25:["labuta","ruth"].includes(run.characterId)?21:run.characterId==="silas"?18:17;
      const aim=target?(hero.primary==='sword'?target:intercept(p,target,hero.primary==='dynamite'?15:hero.primary==='boomerang'?16:speed,hero.primary==='dynamite'?.28:0)):null;
      if(aim)attack.angle=Math.atan2(aim.z-p.z,aim.x-p.x);
      const first=run.primaryShots.length;
      const count=hero.pellets || (run.characterId === "rosa" || run.characterId === "silas" ? 2 : run.characterId==="maria"&&run.abilities.boneStorm>2?2:1);
      if(hero.primary==='sword'){
        for(const enemy of run.enemies){
          const dx=enemy.x-p.x,dz=enemy.z-p.z,distance=Math.hypot(dx,dz);
          if(enemy.hp>0&&distance<=run.primaryRange&&(dx*Math.cos(attack.angle)+dz*Math.sin(attack.angle))/Math.max(.001,distance)>.15){
            this.damage(enemy,run.primaryDamage+run.whipRank*3,run.characterId);run.impacts.push({x:enemy.x,z:enemy.z,age:0});
          }
        }
        run.primaryFlash=.25;run.events.push('whip');return;
      }
      if(hero.primary==="boomerang"){
        const distance=aim?Math.hypot(aim.x-p.x,aim.z-p.z):Math.min(11,run.primaryRange*.75),flight=Math.max(.38,distance/16);
        run.primaryShots.push({x:p.x,z:p.z,startX:p.x,startZ:p.z,vx:Math.cos(attack.angle)*distance/flight,vz:Math.sin(attack.angle)*distance/flight,age:0,flight,returnAge:0,returnLeg:false,damage:run.primaryDamage*1.15,pierce:99,hit:new Set(),kind:"boomerang"});
        this.extraPrimaryShots(run,first);
        run.primaryFlash=.22;run.throwFlash=.65;run.events.push("throw");
        if(run.primaryShots.length>64)run.primaryShots.shift();
        return;
      }
      if(hero.primary==="dynamite"){
        const flight=aim?.flight??Math.max(.28,Math.min(10,run.primaryRange*.65)/15);
        const dx=aim?aim.x-p.x:Math.cos(attack.angle)*15*flight,dz=aim?aim.z-p.z:Math.sin(attack.angle)*15*flight;
        run.primaryShots.push({x:p.x,z:p.z,
          vx:dx/flight,vz:dz/flight,age:0,flight,
          damage:run.primaryDamage*1.35,pierce:1,hit:new Set(),kind:"dynamite"});
        this.extraPrimaryShots(run,first);
        run.primaryFlash=.2;run.throwFlash=.65;run.events.push("throw");
        if(run.primaryShots.length>64)run.primaryShots.shift();
        return;
      }
      for(let i=0;i<count;i++){
        const angle=attack.angle+(i-(count-1)/2)*(["labuta","ruth"].includes(run.characterId)?0.28:run.characterId==="silas"?0.25:0.11);
        const speed=["maria","rosa","teo"].includes(run.characterId)?25:["labuta","ruth"].includes(run.characterId)?21:run.characterId==="silas"?18:17;
        // The robot's emitter is on its raised right forearm, ahead of the
        // torso. Keep its collision path and rendered fireball aligned.
        const forward=run.characterId==='clanker'?.36:0,side=run.characterId==='clanker'?.3:0;
        const x=p.x+Math.cos(angle)*forward+Math.sin(angle)*side;
        const z=p.z+Math.sin(angle)*forward-Math.cos(angle)*side;
        run.primaryShots.push({x,z,vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,age:0,
          damage:(run.primaryDamage+run.whipRank*3)*(run.random()<(hero.crit||0)+run.critBonus?1.7:1),
          pierce:hero.pierce||(["indigo","ada"].includes(run.characterId)?2:run.characterId==="elias"?3:run.characterId==="rosa"?2:1),
          hit:new Set(),kind:run.characterId});
      }
      this.extraPrimaryShots(run,first);
      run.primaryFlash=0.2;
      run.events.push(["indigo","ada","silas"].includes(run.characterId)?"arrow":"shot");
    }
    if(attack.age>=0.4)run.attack=null;
  }
  extraPrimaryShots(run,first){
    const extra=Math.min(6,Math.max(0,run.abilities.doubleShot||0));
    const originals=run.primaryShots.slice(first);
    if(!originals.length)return;
    for(let i=0;i<extra;i++){
      const source={...originals[i%originals.length]};
      // A duplicate follows the previous projectile rather than making an
      // instantaneous fan. Its direction is captured when the attack aims.
      run.pendingPrimaryShots.push({source,delay:(i+1)*.11});
    }
  }
  releasePrimaryShots(run,dt){
    if(!run.pendingPrimaryShots?.length)return;
    const remaining=[];
    for(const pending of run.pendingPrimaryShots){
      pending.delay-=dt;
      if(pending.delay>0){remaining.push(pending);continue;}
      const source=pending.source,length=Math.hypot(source.vx,source.vz)||1;
      const dx=source.vx/length,dz=source.vz/length;
      const offsetX=source.kind==='clanker'?dx*.36+dz*.3:0;
      const offsetZ=source.kind==='clanker'?dz*.36-dx*.3:0;
      const x=run.player.x+offsetX,z=run.player.z+offsetZ;
      run.primaryShots.push({...source,x,z,startX:x,startZ:z,age:0,returnAge:0,returnLeg:false,prevX:undefined,prevZ:undefined,hit:new Set()});
      run.primaryFlash=Math.max(run.primaryFlash,.18);
    }
    run.pendingPrimaryShots=remaining;
    if(run.primaryShots.length>64)run.primaryShots.splice(0,run.primaryShots.length-64);
  }
  primaryProjectiles(run,dt){
    run.primaryShots=run.primaryShots.filter(shot=>{
      if(shot.kind==="boomerang"){
        if(!shot.returnLeg){
          const step=Math.min(dt,Math.max(0,shot.flight-shot.age));
          shot.x+=shot.vx*step;shot.z+=shot.vz*step;shot.age+=step;
          if(shot.age+1e-5>=shot.flight){shot.returnLeg=true;shot.returnAge=0;shot.hit.clear();}
        }else{
          const dx=run.player.x-shot.x,dz=run.player.z-shot.z,d=Math.hypot(dx,dz);
          if(d<.72)return false;
          const step=Math.min(dt,d/20);shot.vx=dx/Math.max(.001,d)*20;shot.vz=dz/Math.max(.001,d)*20;
          shot.x+=shot.vx*step;shot.z+=shot.vz*step;shot.returnAge+=step;
        }
        const x=shot.prevX??shot.startX,z=shot.prevZ??shot.startZ,sx=shot.x-x,sz=shot.z-z;
        const minX=Math.min(x,shot.x)-1.35,maxX=Math.max(x,shot.x)+1.35,minZ=Math.min(z,shot.z)-1.35,maxZ=Math.max(z,shot.z)+1.35;
        const length=sx*sx+sz*sz||1;
        for(const enemy of run.enemies){
          if(enemy.x<minX||enemy.x>maxX||enemy.z<minZ||enemy.z>maxZ||enemy.hp<=0||shot.hit.has(enemy.id))continue;
          const t=Math.max(0,Math.min(1,((enemy.x-x)*sx+(enemy.z-z)*sz)/length));
          if(Math.hypot(enemy.x-x-t*sx,enemy.z-z-t*sz)<(["boss","marshal"].includes(enemy.type)?1.35:.6)){
            this.damage(enemy,shot.damage,"boomerang");shot.hit.add(enemy.id);run.impacts.push({x:enemy.x,z:enemy.z,age:0});
          }
        }
        shot.prevX=shot.x;shot.prevZ=shot.z;
        return shot.returnAge<2.5;
      }
      if(shot.kind==="dynamite"){
        const step=Math.min(dt,Math.max(0,shot.flight-shot.age));
        shot.x+=shot.vx*step;shot.z+=shot.vz*step;shot.age+=step;
        if(shot.age+1e-5<shot.flight)return true;
        const radius=3.1;
        run.pulses.push({x:shot.x,z:shot.z,radius,age:0});
        if(run.pulses.length>8)run.pulses.shift();
        for(const enemy of run.enemies){
          const distance=Math.hypot(enemy.x-shot.x,enemy.z-shot.z);
          if(enemy.hp>0&&distance<=radius)this.damage(enemy,shot.damage*(distance<radius*.45?1:.68),"dynamite");
        }
        run.impacts.push({x:shot.x,z:shot.z,age:0});
        return false;
      }
      const x=shot.x,z=shot.z;
      shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;shot.age+=dt;
      const sx=shot.x-x,sz=shot.z-z;
      // Reject distant enemies before the swept-segment calculation. Use the
      // largest hit radius so bosses and fast shots retain the same collisions.
      const minX=Math.min(x,shot.x)-1.35,maxX=Math.max(x,shot.x)+1.35;
      const minZ=Math.min(z,shot.z)-1.35,maxZ=Math.max(z,shot.z)+1.35;
      const segmentLengthSquared=sx*sx+sz*sz||1;
      for(const enemy of run.enemies){
        if(enemy.x<minX||enemy.x>maxX||enemy.z<minZ||enemy.z>maxZ)continue;
        if(enemy.hp<=0||shot.hit.has(enemy.id))continue;
        const t=Math.max(0,Math.min(1,((enemy.x-x)*sx+(enemy.z-z)*sz)/segmentLengthSquared));
        if(Math.hypot(enemy.x-x-t*sx,enemy.z-z-t*sz)<(["boss","marshal"].includes(enemy.type)?1.35:0.6)){
          this.damage(enemy,shot.damage,shot.kind);
          shot.hit.add(enemy.id);
          run.impacts.push({x:enemy.x,z:enemy.z,age:0});
          if(--shot.pierce<=0)break;
        }
      }
      return shot.age<1.15&&shot.pierce>0;
    });
    if(run.primaryShots.length>64)run.primaryShots.splice(0,run.primaryShots.length-64);
  }
  pistol(run, dt) {
    if (run.abilities.pistol) {
      run.pistolTimer -= dt;
      if (run.pistolTimer <= 0) {
        const stats = abilityStats("pistol", run.abilities.pistol),
          target = this.closest(run, stats.range);
        {
          const p = run.player,
            angle = target
              ? Math.atan2(target.z - p.z, target.x - p.x)
              : Math.atan2(p.dz, p.dx);
          run.projectiles.push({
            id: ++run.nextId,
            x: p.x,
            z: p.z,
            vx: Math.cos(angle) * 26,
            vz: Math.sin(angle) * 26,
            age: 0,
            damage: stats.damage * this.multiplier(run, "pistol"),
          });
          run.pistolTimer = Math.max(0.15, stats.cooldown / this.rate(run));
          run.shotFlash = 0.2;
          run.shotAngle = angle;
          run.events.push("shot");
        }
      }
    }
    run.projectiles = run.projectiles.filter((bullet) => {
      const oldX = bullet.x,
        oldZ = bullet.z;
      bullet.x += bullet.vx * dt;
      bullet.z += bullet.vz * dt;
      bullet.age += dt;
      let target = null,
        nearest = Infinity;
      const sx = bullet.x - oldX,
        sz = bullet.z - oldZ;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0) continue;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((enemy.x - oldX) * sx + (enemy.z - oldZ) * sz) /
              (sx * sx + sz * sz || 1),
          ),
        );
        if (
          Math.hypot(enemy.x - oldX - t * sx, enemy.z - oldZ - t * sz) <
            (["boss","marshal"].includes(enemy.type) ? 1.35 : enemy.type === "dog" ? 0.65 : 0.5) &&
          t < nearest
        ) {
          nearest = t;
          target = enemy;
        }
      }
      if (target) {
        this.damage(target, bullet.damage, "pistol");
        run.impacts.push({ x: target.x, z: target.z, age: 0 });
        return false;
      }
      return bullet.age < 1.2;
    });
  }
  molotov(run, dt) {
    if (run.abilities.molotov || run.abilities.inferno) {
      run.molotovTimer -= dt;
      if (run.molotovTimer <= 0) {
        const stats = abilityStats("molotov", Math.max(1, run.abilities.molotov)),
          target = this.closest(run, stats.range);
        if (target) {
          run.bottles.push({
            id: ++run.nextId,
            fromX: run.player.x,
            fromZ: run.player.z,
            x: target.x,
            z: target.z,
            age: 0,
            ...stats,
            radius: stats.radius + (run.abilities.inferno ? abilityStats("inferno", run.abilities.inferno).radius : 0),
            damage: (stats.damage + (run.abilities.inferno ? abilityStats("inferno", run.abilities.inferno).damage : 0)) * this.multiplier(run, "molotov"),
          });
          run.molotovTimer = Math.max(0.7, stats.cooldown / run.attackRate);
          run.throwFlash = 0.65;
        }
      }
    }
    run.fires = run.fires.filter((fire) => {
      fire.age += dt;
      while (fire.nextTick <= Math.min(fire.age, fire.duration) + 1e-8) {
        for (const enemy of run.enemies)
          if (Math.hypot(enemy.x - fire.x, enemy.z - fire.z) <= fire.radius)
            this.damage(enemy, fire.damage, run.abilities.inferno?"inferno":"molotov");
        fire.nextTick++;
      }
      if (fire.age >= fire.duration - 1e-8) {
        const fraction = fire.duration - Math.floor(fire.duration);
        if (fraction > 1e-8)
          for (const enemy of run.enemies) {
            if (Math.hypot(enemy.x - fire.x, enemy.z - fire.z) <= fire.radius)
              this.damage(enemy, fire.damage * fraction, run.abilities.inferno?"inferno":"molotov");
          }
        return false;
      }
      return true;
    });
    run.bottles = run.bottles.filter((bottle) => {
      bottle.age += dt;
      if (bottle.age < 0.65) return true;
      run.fires.push({
        id: bottle.id,
        x: bottle.x,
        z: bottle.z,
        age: 0,
        nextTick: 1,
        radius: bottle.radius,
        duration: bottle.duration,
        damage: bottle.damage,
      });
      run.events.push("glass", "fire");
      return false;
    });
  }
  horseshoes(run, dt) {
    const rank = run.abilities.horseshoe;
    if (!rank) return;
    const stats = abilityStats("horseshoe", rank);
    for (const enemy of run.enemies) {
      if (enemy.hp <= 0 || Math.hypot(enemy.x - run.player.x, enemy.z - run.player.z) > stats.radius + 0.8) continue;
      for (let i = 0; i < stats.count; i++) {
        const angle = run.time * 2.7 + (i * Math.PI * 2) / stats.count;
        const x = run.player.x + Math.cos(angle) * stats.radius;
        const z = run.player.z + Math.sin(angle) * stats.radius;
        if (Math.hypot(enemy.x - x, enemy.z - z) < 0.7 && run.time >= (enemy.orbitHitAt || 0)) {
          this.damage(enemy, stats.damage * this.multiplier(run, "horseshoe"), "horseshoe");
          enemy.orbitHitAt = run.time + 0.45;
          run.impacts.push({ x: enemy.x, z: enemy.z, age: 0 });
          break;
        }
      }
    }
  }
  ghostShot(run, dt) {
    const rank = run.abilities.ghostShot;
    if (rank) {
      run.ghostTimer -= dt;
      if (run.ghostTimer <= 0) {
        const stats = abilityStats("ghostShot", rank);
        const p = run.player, target = this.closest(run, stats.range);
        const angle = target ? Math.atan2(target.z - p.z, target.x - p.x) : Math.atan2(p.dz, p.dx);
        run.ghostShots.push({ x: p.x, z: p.z, vx: Math.cos(angle) * 15, vz: Math.sin(angle) * 15, age: 0, damage: stats.damage * this.multiplier(run, "ghostShot"), pierce: stats.pierce, hit: new Set() });
        run.ghostTimer = stats.cooldown / run.attackRate;
        if (run.ghostShots.length > 48) run.ghostShots.shift();
      }
    }
    run.ghostShots = run.ghostShots.filter(shot => {
      const oldX = shot.x, oldZ = shot.z;
      shot.x += shot.vx * dt;
      shot.z += shot.vz * dt;
      shot.age += dt;
      const sx = shot.x - oldX, sz = shot.z - oldZ;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0 || shot.hit.has(enemy.id)) continue;
        const t = Math.max(0, Math.min(1, ((enemy.x - oldX) * sx + (enemy.z - oldZ) * sz) / (sx * sx + sz * sz || 1)));
        if (Math.hypot(enemy.x - oldX - t * sx, enemy.z - oldZ - t * sz) < (["boss","marshal"].includes(enemy.type) ? 1.35 : enemy.type === "dog" ? 0.7 : 0.5)) {
          this.damage(enemy, shot.damage, "ghostShot");
          shot.hit.add(enemy.id);
          shot.pierce--;
          run.impacts.push({ x: enemy.x, z: enemy.z, age: 0 });
          if (!shot.pierce) break;
        }
      }
      return shot.age < 1.3 && shot.pierce > 0;
    });
  }
  requiem(run, dt) {
    if (run.abilities.requiem) {
      run.requiemTimer -= dt;
      if (run.requiemTimer <= 0) {
        const stats = abilityStats("requiem", run.abilities.requiem);
        const p = run.player;
        run.pulses.push({ x: p.x, z: p.z, radius: stats.radius, age: 0 });
        if (run.pulses.length > 8) run.pulses.shift();
        for (const enemy of run.enemies) {
          const dx = enemy.x - p.x, dz = enemy.z - p.z, distance = Math.hypot(dx, dz);
          if (enemy.hp <= 0 || distance > stats.radius) continue;
          this.damage(enemy, stats.damage * this.multiplier(run, "requiem"), "requiem");
          if (distance > 0.01) {
            enemy.x = Math.max(-119, Math.min(119, enemy.x + dx / distance * stats.push));
            enemy.z = Math.max(-119, Math.min(119, enemy.z + dz / distance * stats.push));
          }
        }
        run.requiemTimer = stats.cooldown / run.attackRate;
      }
    }
    run.pulses = run.pulses.filter(pulse => (pulse.age += dt) < 0.55);
  }
  silverRain(run, dt) {
    if (run.abilities.silverRain || run.abilities.silverStorm) {
      run.silverTimer -= dt;
      if (run.silverTimer <= 0) {
        const stats = abilityStats("silverRain", Math.max(1, run.abilities.silverRain));
        const storm = run.abilities.silverStorm ? abilityStats("silverStorm", run.abilities.silverStorm) : {count:0,damage:0};
        const count = Math.min(18, stats.count + storm.count);
        for (let i = 0; i < count; i++) {
          const angle = i * Math.PI * 2 / count;
          run.silverShots.push({
            x: run.player.x, z: run.player.z,
            vx: Math.cos(angle) * 12, vz: Math.sin(angle) * 12,
            damage: (stats.damage + storm.damage) * this.multiplier(run, "silverRain"), age: 0, source:run.abilities.silverStorm?"silverStorm":"silverRain",
          });
        }
        run.silverTimer = stats.cooldown / run.attackRate;
        if (run.silverShots.length > 80) run.silverShots.splice(0,run.silverShots.length-80);
      }
    }
    run.silverShots = run.silverShots.filter(shot => {
      const oldX=shot.x, oldZ=shot.z;
      shot.x+=shot.vx*dt; shot.z+=shot.vz*dt; shot.age+=dt;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0) continue;
        const sx=shot.x-oldX, sz=shot.z-oldZ;
        const t=Math.max(0,Math.min(1,((enemy.x-oldX)*sx+(enemy.z-oldZ)*sz)/(sx*sx+sz*sz||1)));
        if (Math.hypot(enemy.x-oldX-t*sx,enemy.z-oldZ-t*sz)<(["boss","marshal"].includes(enemy.type)?1.35:0.52)) {
          this.damage(enemy,shot.damage, shot.source||"silverRain");
          run.impacts.push({x:enemy.x,z:enemy.z,age:0});
          return false;
        }
      }
      return shot.age<1.25;
    });
  }
  boneStorm(run,dt){
    const rank=run.abilities.boneStorm;
    if(!rank)return;
    run.boneTimer-=dt;
    if(run.boneTimer>0)return;
    const stats=abilityStats("boneStorm",rank),p=run.player;
    for(let i=0;i<stats.count;i++){
      const a=i*Math.PI*2/stats.count+run.time*0.3;
      run.silverShots.push({x:p.x,z:p.z,vx:Math.cos(a)*15,vz:Math.sin(a)*15,
        damage:stats.damage*this.multiplier(run,"boneStorm"),age:0,source:"boneStorm"});
    }
    if(run.silverShots.length>80)run.silverShots.splice(0,run.silverShots.length-80);
    run.boneTimer=stats.cooldown/this.rate(run);
  }
  lantern(run, dt) {
    if (!run.abilities.lantern && !run.abilities.inferno) return;
    run.lanternTimer -= dt;
    if (run.lanternTimer > 0) return;
    const stats=abilityStats("lantern",Math.max(1,run.abilities.lantern));
    for (const enemy of run.enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x-run.player.x,enemy.z-run.player.z)<=stats.radius)
        this.damage(enemy,(stats.damage + (run.abilities.inferno ? abilityStats("inferno",run.abilities.inferno).damage : 0))*this.multiplier(run,"lantern"),run.abilities.inferno?"inferno":"lantern");
    }
    run.lanternTimer += 1;
    if (run.lanternTimer < 0) run.lanternTimer=1;
  }
}
