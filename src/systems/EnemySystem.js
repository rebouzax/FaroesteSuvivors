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
    const minute = Math.floor(run.time / 60);
    if (minute !== run.difficulty) {
      run.difficulty = minute;
      for (const enemy of run.enemies) {
        const stats = enemyStats(enemy.type, minute),
          fraction = enemy.hp / enemy.maxHp;
        Object.assign(enemy, stats, {
          hp: stats.hp * fraction,
          maxHp: stats.hp,
        });
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
    for (const enemy of run.enemies) {
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
        enemy.x += (dx / distance) * enemy.speed * dt;
        enemy.z += (dz / distance) * enemy.speed * dt;
      }
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    }
  }
}
