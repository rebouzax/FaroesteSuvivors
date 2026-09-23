import { CONFIG } from "../config/gameConfig.js";
import { abilityStats } from "../config/abilityConfig.js";
export class CombatSystem {
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
    this.whip(run, dt);
    this.pistol(run, dt);
    this.molotov(run, dt);
    run.impacts = run.impacts.filter((impact) => (impact.age += dt) < 0.3);
  }
  whip(run, dt) {
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
        CONFIG.whipCooldown / run.attackRate,
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
          run.pistolTimer = Math.max(0.15, stats.cooldown / run.attackRate);
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
            (enemy.type === "dog" ? 0.65 : 0.5) &&
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
}
