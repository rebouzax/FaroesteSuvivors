import { CONFIG } from "../config/gameConfig.js";
import { abilityStats } from "../config/abilityConfig.js";
export class CombatSystem {
  rate(run){return run.attackRate*(run.abilities.lastStand&&run.player.hp/run.player.maxHp<0.35?1+run.abilities.lastStand*0.2:1);}
  damage(enemy, amount) {
    enemy.hp -= (amount * 20) / (20 + enemy.armor);
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
    run.empowered.remaining = Math.max(0, run.empowered.remaining - dt);
    run.shotFlash = Math.max(0, run.shotFlash - dt);
    run.throwFlash = Math.max(0, run.throwFlash - dt);
    run.primaryFlash=Math.max(0,run.primaryFlash-dt);
    this.whip(run, dt);
    this.primaryProjectiles(run,dt);
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
          this.damage(enemy, run.primaryDamage + run.whipRank * 3);
      }
    }
    if (attack.age >= CONFIG.whipDuration) run.attack = null;
  }
  rangedPrimary(run,dt){
    run.cooldown-=dt;
    const hero=run.hero;
    if(!run.attack&&run.cooldown<=0){
      const target=this.closest(run,hero.range);
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
      const count=run.characterId==="maria"&&run.abilities.boneStorm>2?2:1;
      for(let i=0;i<count;i++){
        const angle=attack.angle+(i-(count-1)/2)*0.11;
        const speed=run.characterId==="maria"?25:17;
        run.primaryShots.push({x:p.x,z:p.z,vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,age:0,
          damage:run.primaryDamage+run.whipRank*3,pierce:run.characterId==="indigo"?2:1,hit:new Set(),kind:run.characterId});
      }
      run.primaryFlash=0.2;
      run.events.push(run.characterId==="maria"?"shot":"arrow");
    }
    if(attack.age>=0.4)run.attack=null;
  }
  primaryProjectiles(run,dt){
    run.primaryShots=run.primaryShots.filter(shot=>{
      const x=shot.x,z=shot.z;
      shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;shot.age+=dt;
      const sx=shot.x-x,sz=shot.z-z;
      let hit=false;
      for(const enemy of run.enemies){
        if(enemy.hp<=0||shot.hit.has(enemy.id))continue;
        const t=Math.max(0,Math.min(1,((enemy.x-x)*sx+(enemy.z-z)*sz)/(sx*sx+sz*sz||1)));
        if(Math.hypot(enemy.x-x-t*sx,enemy.z-z-t*sz)<(["boss","marshal"].includes(enemy.type)?1.35:0.6)){
          this.damage(enemy,shot.damage);
          shot.hit.add(enemy.id);
          run.impacts.push({x:enemy.x,z:enemy.z,age:0});
          hit=true;
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
        this.damage(target, bullet.damage);
        run.impacts.push({ x: target.x, z: target.z, age: 0 });
        return false;
      }
      return bullet.age < 1.2;
    });
  }
  molotov(run, dt) {
    if (run.abilities.molotov) {
      run.molotovTimer -= dt;
      if (run.molotovTimer <= 0) {
        const stats = abilityStats("molotov", run.abilities.molotov),
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
            damage: stats.damage * this.multiplier(run, "molotov"),
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
            this.damage(enemy, fire.damage);
        fire.nextTick++;
      }
      if (fire.age >= fire.duration - 1e-8) {
        const fraction = fire.duration - Math.floor(fire.duration);
        if (fraction > 1e-8)
          for (const enemy of run.enemies) {
            if (Math.hypot(enemy.x - fire.x, enemy.z - fire.z) <= fire.radius)
              this.damage(enemy, fire.damage * fraction);
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
          this.damage(enemy, stats.damage * this.multiplier(run, "horseshoe"));
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
          this.damage(enemy, shot.damage);
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
          this.damage(enemy, stats.damage * this.multiplier(run, "requiem"));
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
    if (run.abilities.silverRain) {
      run.silverTimer -= dt;
      if (run.silverTimer <= 0) {
        const stats = abilityStats("silverRain", run.abilities.silverRain);
        for (let i = 0; i < stats.count; i++) {
          const angle = i * Math.PI * 2 / stats.count;
          run.silverShots.push({
            x: run.player.x, z: run.player.z,
            vx: Math.cos(angle) * 12, vz: Math.sin(angle) * 12,
            damage: stats.damage * this.multiplier(run, "silverRain"), age: 0,
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
          this.damage(enemy,shot.damage);
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
        damage:stats.damage*this.multiplier(run,"boneStorm"),age:0});
    }
    if(run.silverShots.length>80)run.silverShots.splice(0,run.silverShots.length-80);
    run.boneTimer=stats.cooldown/this.rate(run);
  }
  lantern(run, dt) {
    if (!run.abilities.lantern) return;
    run.lanternTimer -= dt;
    if (run.lanternTimer > 0) return;
    const stats=abilityStats("lantern",run.abilities.lantern);
    for (const enemy of run.enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x-run.player.x,enemy.z-run.player.z)<=stats.radius)
        this.damage(enemy,stats.damage*this.multiplier(run,"lantern"));
    }
    run.lanternTimer += 1;
    if (run.lanternTimer < 0) run.lanternTimer=1;
  }
}
