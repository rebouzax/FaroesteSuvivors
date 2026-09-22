import { CONFIG } from "../config/gameConfig.js";
import { EnemySystem } from "./EnemySystem.js";
import { CombatSystem } from "./CombatSystem.js";
const clamp = (value) =>
  Math.max(-CONFIG.mapHalf + 1, Math.min(CONFIG.mapHalf - 1, value));
export class RunSystem {
  constructor() {
    this.enemies = new EnemySystem();
    this.combat = new CombatSystem();
  }
  update(run, dt, input) {
    run.events.length = 0;
    if (run.phase === "intro") {
      run.introTime = Math.min(CONFIG.intro, run.introTime + dt);
      run.player.z = 8 * (1 - Math.min(1, run.introTime / 5.6));
      run.player.moving = run.introTime < 5.6;
      if (run.player.moving) run.player.walkTime += dt;
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
    this.move(run, dt, input);
    this.enemies.update(run, dt);
    this.combat.update(run, dt);
    run.enemies = run.enemies.filter((enemy) => {
      if (enemy.hp > 0) return true;
      run.kills++;
      this.drop(run, enemy.x, enemy.z, "xp", enemy.xp);
      if (enemy.type === "dog")
        this.drop(run, enemy.x + 0.3, enemy.z, "coin", 2);
      else if (run.kills % 5 === 0)
        this.drop(run, enemy.x + 0.3, enemy.z, "coin", 1);
      return false;
    });
    for (const enemy of run.enemies) {
      if (
        Math.hypot(enemy.x - p.x, enemy.z - p.z) <
          (enemy.type === "dog" ? 1 : 0.85) &&
        p.invulnerable <= 0
      ) {
        p.hp = Math.max(0, p.hp - enemy.damage);
        p.invulnerable = 0.9;
        run.events.push("hurt");
        if (p.hp === 0) {
          run.phase = "defeat";
          return;
        }
      }
    }
    this.collect(run, dt);
  }
  move(run, dt, input) {
    const p = run.player,
      oldX = p.x,
      oldZ = p.z,
      length = Math.hypot(input.x, input.z);
    if (length > 0.12) {
      p.dx = input.x / length;
      p.dz = input.z / length;
    }
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
    p.moving = Math.hypot(p.x - oldX, p.z - oldZ) > 0.001;
    if (p.moving) p.walkTime += dt;
  }
  drop(run, x, z, type, value) {
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
