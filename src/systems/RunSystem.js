import { CONFIG } from "../config/gameConfig.js";
const clamp = (n) =>
  Math.max(-CONFIG.mapHalf + 1, Math.min(CONFIG.mapHalf - 1, n));

export class RunSystem {
  update(run, dt, input) {
    run.events.length = 0;
    if (run.phase === "intro") {
      run.introTime = Math.min(CONFIG.intro, run.introTime + dt);
      run.player.z = 8 * (1 - Math.min(1, run.introTime / 5.6));
      if (run.introTime >= CONFIG.intro) run.phase = "playing";
      return;
    }
    if (run.phase !== "playing") return;
    run.time = Math.min(CONFIG.duration, run.time + dt);
    if (run.time >= CONFIG.duration) {
      run.phase = "victory";
      return;
    }
    const p = run.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    run.levelFlash = Math.max(0, run.levelFlash - dt);
    if (Math.hypot(input.x, input.z) > 0.12) {
      const length = Math.hypot(input.x, input.z);
      p.dx = input.x / length;
      p.dz = input.z / length;
    }
    // Auto-walk continues in the last direction; input changes that direction.
    p.x = clamp(p.x + p.dx * CONFIG.playerSpeed * dt);
    p.z = clamp(p.z + p.dz * CONFIG.playerSpeed * dt);
    for (const prop of run.props) {
      const dx = p.x - prop.x,
        dz = p.z - prop.z,
        distance = Math.hypot(dx, dz),
        radius = prop.radius + 0.4;
      if (distance < radius) {
        p.x = clamp(prop.x + (distance ? dx / distance : 1) * radius);
        p.z = clamp(prop.z + (distance ? dz / distance : 0) * radius);
      }
    }
    run.spawnTimer -= dt;
    if (run.spawnTimer <= 0) {
      run.spawnTimer = Math.max(0.22, 1.5 - run.time / 650);
      for (
        let i = 0;
        i < 1 + Math.floor(run.time / 180) && run.bats.length < CONFIG.maxBats;
        i++
      )
        this.spawn(run);
    }
    for (const bat of run.bats) {
      let dx = p.x - bat.x,
        dz = p.z - bat.z,
        distance = Math.hypot(dx, dz);
      if (distance > 55) {
        this.positionBat(run, bat);
        dx = p.x - bat.x;
        dz = p.z - bat.z;
        distance = Math.hypot(dx, dz);
      }
      const speed = 2.5 + Math.min(1.8, run.time / 500);
      if (distance > 0.05) {
        bat.x += (dx / distance) * speed * dt;
        bat.z += (dz / distance) * speed * dt;
      }
    }
    this.attack(run, dt);
    for (const bat of run.bats) {
      if (Math.hypot(bat.x - p.x, bat.z - p.z) < 0.85 && p.invulnerable <= 0) {
        p.hp = Math.max(0, p.hp - CONFIG.batDamage);
        p.invulnerable = 0.9;
        run.events.push("hurt");
        if (p.hp === 0) {
          run.phase = "defeat";
          break;
        }
      }
    }
    this.collect(run, dt);
  }
  positionBat(run, bat) {
    const angle = run.random() * Math.PI * 2;
    bat.x = clamp(run.player.x + Math.cos(angle) * 33);
    bat.z = clamp(run.player.z + Math.sin(angle) * 33);
    // Near map borders, reflect the spawn toward the map interior.
    if (Math.hypot(bat.x - run.player.x, bat.z - run.player.z) < 24) {
      bat.x = clamp(run.player.x - Math.cos(angle) * 33);
      bat.z = clamp(run.player.z - Math.sin(angle) * 33);
    }
  }
  spawn(run) {
    const bat = { id: ++run.nextId, hp: CONFIG.batHp, x: 0, z: 0 };
    this.positionBat(run, bat);
    run.bats.push(bat);
  }
  attack(run, dt) {
    run.cooldown -= dt;
    if (!run.attack && run.cooldown <= 0) {
      const p = run.player;
      let target = null,
        nearest = CONFIG.whipRange + 2;
      for (const bat of run.bats) {
        const distance = Math.hypot(bat.x - p.x, bat.z - p.z);
        if (distance < nearest) {
          target = bat;
          nearest = distance;
        }
      }
      run.attack = {
        age: 0,
        angle: target
          ? Math.atan2(target.z - p.z, target.x - p.x)
          : Math.atan2(p.dz, p.dx),
        hit: false,
      };
      run.cooldown = CONFIG.whipCooldown;
    }
    const attack = run.attack;
    if (!attack) return;
    attack.age += dt;
    if (!attack.hit && attack.age >= 0.18) {
      attack.hit = true;
      run.events.push("whip");
      const p = run.player;
      for (const bat of run.bats) {
        const dx = bat.x - p.x,
          dz = bat.z - p.z,
          distance = Math.hypot(dx, dz);
        if (
          distance <= CONFIG.whipRange &&
          (dx * Math.cos(attack.angle) + dz * Math.sin(attack.angle)) /
            Math.max(0.001, distance) >
            -0.1
        )
          bat.hp -= CONFIG.whipDamage;
      }
      run.bats = run.bats.filter((bat) => {
        if (bat.hp > 0) return true;
        run.kills++;
        this.drop(run, bat.x, bat.z, "xp", CONFIG.xpPerBullet);
        if (run.kills % 5 === 0) this.drop(run, bat.x + 0.3, bat.z, "coin", 1);
        return false;
      });
    }
    if (attack.age >= CONFIG.whipDuration) run.attack = null;
  }
  drop(run, x, z, type, value) {
    // At capacity consolidate value, never silently discard earned XP/currency.
    if (run.loot.length >= CONFIG.maxLoot) {
      const existing = run.loot.find((item) => item.type === type);
      if (existing) {
        existing.value += value;
        return;
      }
    }
    run.loot.push({ id: ++run.nextId, x, z, type, value, attracted: false });
  }
  collect(run, dt) {
    const p = run.player;
    run.loot = run.loot.filter((item) => {
      const dx = p.x - item.x,
        dz = p.z - item.z,
        distance = Math.hypot(dx, dz);
      if (distance < CONFIG.magnetRadius) item.attracted = true;
      if (distance < 0.6 || (item.attracted && distance < 15 * dt)) {
        if (item.type === "xp") run.addXp(item.value);
        else run.coins += item.value;
        return false;
      }
      if (item.attracted) {
        item.x += (dx / distance) * 15 * dt;
        item.z += (dz / distance) * 15 * dt;
      }
      return true;
    });
  }
}
