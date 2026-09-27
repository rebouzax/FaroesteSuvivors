import { describe, expect, it } from "vitest";
import { RunModel } from "../models/RunModel.js";
import { BossSystem } from "./BossSystem.js";

const encounter = () => {
  const run = new RunModel(() => .5);
  run.time = 180;
  const system = new BossSystem();
  system.start(run);
  return { run, system, boss: run.enemies[0] };
};

describe("fases dos chefes", () => {
  it("alterna padrões no fim da luta e mantém tempo para reagir", () => {
    const { run, system, boss } = encounter();
    boss.hp = boss.maxHp * .3;
    run.player.moving = true;
    run.player.dx = 1;
    run.player.dz = 0;
    system.updateArena(run, .01);
    expect(boss.phase).toBe(3);
    boss.attackTimer = 0;
    system.updateArena(run, .01);
    expect(run.bossTelegraph.pattern).toBe("pulse");
    expect(run.bossTelegraph.delay).toBeGreaterThanOrEqual(1);
    expect(run.bossTelegraph.x).toBeGreaterThan(run.player.x);
    run.bossTelegraph = null;
    boss.attackTimer = 0;
    system.updateArena(run, .01);
    expect(run.bossTelegraph.pattern).toBe("dash");
    expect(run.bossTelegraph.delay).toBeGreaterThanOrEqual(1);
  });

  it("registra impacto de investida mesmo quando cruza o jogador em um frame", () => {
    const { run, system, boss } = encounter();
    run.bossEncounter.x = 0;
    run.bossEncounter.z = 0;
    run.player.x = 1;
    run.player.z = 0;
    boss.x = 0;
    boss.z = 0;
    boss.dash = { vx: 20, vz: 0, left: .5 };
    const health = run.player.hp;
    system.updateArena(run, .1);
    expect(run.player.hp).toBeLessThan(health);
    expect(run.player.invulnerable).toBe(.9);
  });
});
