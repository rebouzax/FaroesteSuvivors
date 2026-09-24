import { CONFIG } from "../config/gameConfig.js";

const MAX_CRATES = 2;
const COLLECT_DISTANCE = 1.15;
const clamp = (value) => Math.max(-CONFIG.mapHalf + 3, Math.min(CONFIG.mapHalf - 3, value));

export class CrateSystem {
  update(run, dt, drop) {
    // O contato coleta a caixa; ataques não interagem com ela.
    run.crates = run.crates.filter((crate) =>
      Math.hypot(crate.x - run.player.x, crate.z - run.player.z) < 68,
    );
    run.crates = run.crates.filter((crate) => {
      if (Math.hypot(crate.x - run.player.x, crate.z - run.player.z) > COLLECT_DISTANCE) return true;
      run.cratesBroken++;
      if (run.random() < run.crateBandageChance) drop(crate.x, crate.z, "bandage", 25);
      else drop(crate.x, crate.z, "coin", 4 + Math.floor(run.random() * 7));
      run.events.push("glass");
      run.crateSpawnTimer = Math.min(run.crateSpawnTimer, 3);
      return false;
    });

    run.crateSpawnTimer -= dt;
    if (run.crateSpawnTimer > 0 || run.crates.length >= MAX_CRATES) return;
    run.crateSpawnTimer = 6;
    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = run.random() * Math.PI * 2;
      const distance = 31 + run.random() * 11;
      const x = clamp(run.player.x + Math.cos(angle) * distance);
      const z = clamp(run.player.z + Math.sin(angle) * distance);
      if (Math.hypot(x - run.player.x, z - run.player.z) < 28) continue;
      if (run.crates.some((crate) => Math.hypot(crate.x - x, crate.z - z) < 12)) continue;
      if (run.props.some((prop) => Math.hypot(prop.x - x, prop.z - z) < prop.radius + 1.3)) continue;
      run.crates.push({ id: ++run.nextId, x, z });
      run.crateSpawnTimer = run.crates.length < MAX_CRATES ? 2 : 6;
      break;
    }
  }
}
