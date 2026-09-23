import { CONFIG } from "../config/gameConfig.js";

export class BossSystem {
  start(run) {
    const arena = run.bossEncounter;
    if (arena.active || arena.completed) return;
    Object.assign(arena, { active: true, age: 0, radius: 12, x: run.player.x, z: run.player.z });
    // Inimigos comuns abandonam a arena sem gerar recompensas.
    run.enemies.length = 0;
    run.enemyShots.length = 0;
    run.enemies.push({
      id: ++run.nextId, type: "boss", hp: 300, maxHp: 300,
      damage: 20, armor: 0, speed: 2.15, xp: 200,
      x: Math.max(-CONFIG.mapHalf + 2, Math.min(CONFIG.mapHalf - 2, arena.x + 6)),
      z: arena.z, hitFlash: 0,
    });
    run.events.push("boss-enter");
  }
  updateArena(run, dt) {
    const arena = run.bossEncounter;
    if (!arena.active) return;
    arena.age += dt;
    arena.radius = Math.max(6, 12 - arena.age * 0.06);
    const player = run.player;
    const dx = player.x - arena.x, dz = player.z - arena.z;
    const distance = Math.hypot(dx, dz);
    if (distance > arena.radius - 0.4 && distance > 0) {
      player.hp = Math.max(0, player.hp - 8 * dt);
      // A borda de fogo impede fuga, sem mover o centro da arena.
      const factor = (arena.radius - 0.65) / distance;
      player.x = arena.x + dx * factor;
      player.z = arena.z + dz * factor;
      if (player.hp <= 0) run.phase = "defeat";
    }
  }
  defeated(run) {
    run.bossEncounter.active = false;
    run.bossEncounter.completed = true;
    run.events.push("boss-down");
    run.spawnTimer = 0; // ondas retornam na atualização seguinte
  }
}
