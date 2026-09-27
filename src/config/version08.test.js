import { describe, expect, it } from "vitest";
import { CHARACTERS } from "./characterConfig.js";
import {
  BOSS_IDS,
  CAMPAIGN,
  ENEMY_IDS,
  GAMEPLAY_CARD_UNLOCKS,
  HERO_REWARDS,
  STAGE_ORDER,
  heroUnlocked,
  stageUnlocked,
  unlockedGameplayCards,
} from "./campaignConfig.js";
import { FUSIONS } from "./deckConfig.js";
import { enemyStats } from "./abilityConfig.js";
import { RunModel } from "../models/RunModel.js";
import { RunSystem } from "../systems/RunSystem.js";
import { BossSystem } from "../systems/BossSystem.js";
import { CombatSystem } from "../systems/CombatSystem.js";

describe("campanha e meta de conteúdo 1.0", () => {
  it("mantém os marcos de conteúdo e cinco fases novas", () => {
    expect(STAGE_ORDER).toHaveLength(15);
    expect(STAGE_ORDER.slice(5,10)).toEqual([
      "bellTown",
      "glassMarsh",
      "midnightSaloon",
      "forsakenRail",
      "crowFortress",
    ]);
    expect(STAGE_ORDER.slice(10)).toEqual(["saltFlats","emberFoundry","moonMonastery","thornGarden","lastDawn"]);
    expect(Object.keys(CHARACTERS)).toHaveLength(26);
    expect(ENEMY_IDS).toHaveLength(73);
    expect(BOSS_IDS).toHaveLength(36);
    for (const id of STAGE_ORDER.slice(5)) expect(CAMPAIGN[id].bosses).toHaveLength(id==='forsakenRail'?3:2);
  });

  it("libera fases, campeões e cartas somente após o clear da fase correta", () => {
    const profile = { storyClears: {} };
    expect(stageUnlocked(profile, "bellTown")).toBe(false);
    expect(heroUnlocked(profile, "valeria")).toBe(false);
    expect(heroUnlocked(profile, "dynamite")).toBe(false);
    profile.storyClears.town = true;
    expect(stageUnlocked(profile, "bellTown")).toBe(false);
    profile.storyClears.bellTown = true;
    expect(stageUnlocked(profile, "glassMarsh")).toBe(true);
    expect(heroUnlocked(profile, "valeria")).toBe(true);
    profile.storyClears.mine=true;
    expect(heroUnlocked(profile, "dynamite")).toBe(true);
    expect(unlockedGameplayCards(profile)).toEqual(expect.arrayContaining(["saltedRounds","silverRain","soulHarvest","boneStorm","lastStand"]));
    expect(unlockedGameplayCards(profile)).not.toContain("longshot");
  });

  it("define a Dama Malvina como chefe final do saloon, com tornados", () => {
    const saloon = CAMPAIGN.midnightSaloon;
    const malvina = saloon.bosses.at(-1);
    expect(malvina.id).toBe("damaMalvina");
    expect(malvina.pattern).toBe("tornadoes");
    expect(malvina.weakness).toBe("inferno");
    expect(malvina.counter).toBe("luzia");
  });

  it("dá atributos positivos e crescimento aos novos inimigos", () => {
    for (const id of ENEMY_IDS.slice(7)) {
      const early = enemyStats(id, 0);
      const late = enemyStats(id, 12);
      expect(early.hp).toBeGreaterThan(0);
      expect(early.damage).toBeGreaterThan(0);
      expect(early.armor).toBeGreaterThanOrEqual(0);
      expect(late.hp).toBeGreaterThan(early.hp);
      expect(late.damage).toBeGreaterThan(early.damage);
    }
  });

  it("faz o personagem parar quando as teclas são soltas", () => {
    const run = new RunModel(() => 0.5, 0, {}, { characterId: "valeria", mapId: "midnightSaloon" });
    const system = new RunSystem();
    run.player.x = 4;
    run.player.z = 3;
    run.player.dx = 1;
    run.player.dz = 0;
    system.move(run, 1, { x: 0, z: 0 });
    expect(run.player.x).toBe(4);
    expect(run.player.z).toBe(3);
    expect(run.player.moving).toBe(false);
    expect(run.player.dx).toBe(1);
  });

  it("dá ao Neco Pavio um ataque principal de dinamite com dano em área", () => {
    const run=new RunModel(()=>.5,0,{}, {characterId:"dynamite",mapId:"desert"});
    const combat=new CombatSystem();
    const enemy={id:1,x:4,z:0,hp:1000,armor:0,weakness:"",counter:""};
    run.enemies=[enemy];run.cooldown=0;
    combat.rangedPrimary(run,.2);
    expect(run.primaryShots[0].kind).toBe("dynamite");
    combat.primaryProjectiles(run,.75);
    expect(enemy.hp).toBeLessThan(1000);
    expect(run.pulses.length).toBe(1);
  });

  it("lança os tornados na coordenada registrada pelo aviso", () => {
    const run = { tornadoes: [] };
    const system = new BossSystem();
    system.resolve(run, { damage: 102 }, { pattern: "tornadoes", x: 8, z: -5, angle: 0 });
    expect(run.tornadoes).toHaveLength(3);
    expect(run.tornadoes[0].x).toBeCloseTo(8);
    expect(run.tornadoes[0].z).toBeCloseTo(-6.5);
    expect(run.tornadoes.every((tornado) => tornado.life === 8)).toBe(true);
  });

  it("mantém as receitas novas presas ao avanço da campanha", () => {
    expect(FUSIONS.saloonTempest.after).toBe("midnightSaloon");
    expect(FUSIONS.railbreaker.after).toBe("forsakenRail");
    expect(GAMEPLAY_CARD_UNLOCKS.longshot).toBe("crowFortress");
    expect(HERO_REWARDS.ines).toBe("crowFortress");
    expect(HERO_REWARDS.dynamite).toBe("mine");
    expect(CHARACTERS.dynamite.primary).toBe("dynamite");
  });
});
