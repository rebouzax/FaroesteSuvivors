import { CONFIG } from "../config/gameConfig.js";

export class BossSystem {
  constructor() {
    this.bosses = [
      {at:360,type:"boss",hp:300,damage:20,speed:2.15,xp:200},
      {at:660,type:"marshal",hp:520,damage:26,speed:2.7,xp:320},
    ];
  }
  start(run) {
    const arena = run.bossEncounter;
    const spec=this.bosses[arena.nextBoss];
    if (arena.active || !spec || run.time<spec.at) return;
    Object.assign(arena, { active: true, age: 0, radius: 12, x: run.player.x, z: run.player.z });
    arena.type=spec.type;
    run.merchant=null;
    // Inimigos comuns abandonam a arena sem gerar recompensas.
    run.enemies.length = 0;
    run.enemyShots.length = 0;
    run.tornadoes.length = 0;
    run.weather.alertUntil=0;
    run.enemies.push({
      id: ++run.nextId, type: spec.type, hp: spec.hp, maxHp: spec.hp,
      damage: spec.damage, armor: 0, speed: spec.speed, xp: spec.xp,
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
    run.bossEncounter.nextBoss++;
    run.bossEncounter.completed = run.bossEncounter.nextBoss>=this.bosses.length;
    run.bossEncounter.type=null;
    run.events.push("boss-down");
    run.spawnTimer = 0; // ondas retornam na atualização seguinte
  }
}
