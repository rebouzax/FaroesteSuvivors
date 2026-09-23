import { CONFIG } from "../config/gameConfig.js";
import { enemyStats } from "../config/abilityConfig.js";
const clamp = (value) =>
  Math.max(-CONFIG.mapHalf + 1, Math.min(CONFIG.mapHalf - 1, value));
export class EnemySystem {
  spawn(run, type = "bat") {
    if (run.enemies.length >= CONFIG.maxBats) return;
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
      const boss = run.enemies.find(e => e.type === "boss");
      if (boss?.hp > 0) {
        const dx = run.player.x - boss.x, dz = run.player.z - boss.z;
        const distance = Math.hypot(dx,dz);
        if (distance > 1.1) {
          boss.x += dx / distance * boss.speed * dt;
          boss.z += dz / distance * boss.speed * dt;
        }
        boss.hitFlash = Math.max(0,boss.hitFlash-dt);
        boss.attackFlash = Math.max(0,(boss.attackFlash||0)-dt);
        boss.swingTimer = (boss.swingTimer??1.2)-dt;
        if (distance < 3 && boss.swingTimer <= 0) {
          boss.attackFlash = 0.58;
          boss.swingTimer = 2;
        }
      }
      return;
    }
    const minute = Math.floor(run.time / 60);
    if (minute !== run.difficulty) {
      run.difficulty = minute;
      for (const enemy of run.enemies) {
        if (enemy.type === "vulture" || enemy.type === "boss") continue;
        const stats = enemyStats(enemy.type, minute),
          fraction = enemy.hp / enemy.maxHp;
        Object.assign(enemy, stats, {
          hp: stats.hp * fraction,
          maxHp: stats.hp,
        });
      }
    }
    if (run.time >= 120) {
      run.vultureTimer -= dt;
      if (run.vultureTimer <= 0) {
        run.vultureTimer = Math.max(12, 22 - minute);
        this.spawnVultures(run);
      }
    }
    run.spawnTimer -= dt;
    if (run.spawnTimer <= 0) {
      run.spawnTimer = Math.max(0.3, 1.5 - run.time / 700);
      for (let i = 0; i < 1 + Math.floor(run.time / 180); i++) this.spawn(run);
    }
    if (run.time >= 60) {
      run.dogTimer -= dt;
      if (run.dogTimer <= 0) {
        run.dogTimer = Math.max(2, 7 - (run.time - 60) / 140);
        if (run.enemies.length >= CONFIG.maxBats) {
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
    if (run.time >= 180) {
      run.skeletonTimer -= dt;
      if (run.skeletonTimer <= 0) {
        run.skeletonTimer = Math.max(3.5, 11 - minute * 0.55);
        this.spawn(run, "skeleton");
      }
    }
    if (run.time >= 270) {
      run.minerTimer -= dt;
      if (run.minerTimer <= 0) {
        run.minerTimer = Math.max(5, 15 - minute * 0.5);
        this.spawn(run, "miner");
      }
    }
    for (const enemy of run.enemies) {
      if (enemy.type === "vulture") {
        enemy.age += dt;
        enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
        if (enemy.warning > 0) {
          enemy.warning = Math.max(0, enemy.warning - dt);
          continue;
        }
        enemy.x += enemy.vx * dt;
        enemy.z += enemy.vz * dt;
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
      if (distance > 0.05) {
        if (enemy.type !== "skeleton" || distance > 8) {
          const sway = enemy.type === "miner" ? Math.sin(run.time * 3 + enemy.id) * 0.4 : 0;
          enemy.x += ((dx / distance) * enemy.speed - (dz / distance) * sway) * dt;
          enemy.z += ((dz / distance) * enemy.speed + (dx / distance) * sway) * dt;
        }
      }
      if (enemy.type === "skeleton" && distance < 17 && enemy.hp > 0) {
        enemy.shotTimer = (enemy.shotTimer ?? 1.3) - dt;
        if (enemy.shotTimer <= 0) {
          enemy.shotTimer = 2.7;
          if (run.enemyShots.length < 40 && distance > 0.01)
            run.enemyShots.push({x:enemy.x,z:enemy.z,vx:dx/distance*8,vz:dz/distance*8,age:0,damage:enemy.damage});
          enemy.attackFlash = 0.58;
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
