import { describe, expect, it } from "vitest";
import { ProfileService } from "../services/ProfileService.js";
import { RunModel } from "../models/RunModel.js";
import { MissionSystem } from "../systems/MissionSystem.js";
import { RunSystem } from "../systems/RunSystem.js";
import { CHARACTERS } from "./characterConfig.js";
import { CAMPAIGN, ENEMY_IDS, HERO_REWARDS, MISSION_HERO_REWARDS, MISSION_IDS, GAMEPLAY_CARD_UNLOCKS, MISSION_CARD_REWARDS, heroUnlocked, stageUnlocked, unlockedGameplayCards } from "./campaignConfig.js";
import { ABILITY_IDS } from "./abilityConfig.js";
import { STARTER_CARDS, STARTER_DECK, FUSIONS, BENTO_CARDS, fusionUnlocked } from "./deckConfig.js";
import { PERMANENT_UPGRADES, upgradeUnlocked } from "./shopConfig.js";
import { meshFor } from "../views/EnemyAssetView.js";
import { SPECIAL_HEROES,MERCHANT_HEROES } from './specialHeroes.js';
import { SUPPLIED_ASSETS } from './suppliedAssets.js';
import { SPECIAL_ART } from './creatureArt.js';
import { GameApplication } from "../app/GameApplication.js";
import { preparationMarkup } from "../views/PreparationView.js";
import { permanentProducts } from "../views/ShopView.js";

function storage(saved) {
  let value = saved ? JSON.stringify(saved) : null;
  return { getItem: () => value, setItem: (_, next) => { value = next; } };
}
const fresh = () => new ProfileService(storage());
function run(phase = "defeat", mapId = "desert") {
  const result = new RunModel(() => .5, 0, {}, { characterId: "joao", mapId, mode: "story" });
  result.phase = phase;
  result.time = phase === "victory" ? 900 : 90;
  return result;
}

describe("progressão de novos jogadores", () => {
  it("começa somente com João, deserto e quatro cartas, sem compras bloqueadas", () => {
    const p = fresh();
    expect(Object.keys(CHARACTERS).filter(id => heroUnlocked(p.data,id))).toEqual(["joao"]);
    expect(Object.keys(CAMPAIGN).filter(id => stageUnlocked(p.data,id))).toEqual(["desert"]);
    expect(p.data.deck).toEqual(STARTER_DECK);
    expect(STARTER_CARDS).toHaveLength(5);
    expect(unlockedGameplayCards(p.data)).toEqual([]);
    expect(p.toggleDeck("pistol")).toBe(false);
    p.data.coins = 10000;
    expect(p.buyUpgrade("primary")).toBe(false);
    expect(p.buyUpgrade("health")).toBe(true);
    expect(p.buyBentoCard("ironCharm")).toBe(false);
    expect(fusionUnlocked(p.data,"bulwark")).toBe(false);
    expect(heroUnlocked(p.data,"futureHero")).toBe(false);
  });

  it("não registra abandono e conta morte/vitória apenas uma vez", () => {
    const p = fresh();
    const abandoned = run("playing");
    abandoned.completedMissionIds.add("desert:1");
    p.recordRun(abandoned);
    expect(p.data.completedRuns).toBe(0);
    expect(p.data.missionClears).toEqual([]);
    const dead = run();
    p.recordRun(dead);
    p.recordRun(dead);
    expect(p.data.completedRuns).toBe(1);
    expect(p.arsenalJustUnlocked).toBe(true);
    expect(p.toggleDeck("pistol")).toBe(true);
    p.recordRun(run("victory"));
    expect(p.data.completedRuns).toBe(2);
    expect(p.data.storyClears).toEqual({});
  });

  it("registra a missão real, libera recompensa após morrer e persiste no save", () => {
    const store = storage();
    const p = new ProfileService(store);
    const r = run("playing");
    r.time = 45;
    new MissionSystem().update(r, Array(10).fill("bat"));
    expect([...r.completedMissionIds]).toEqual(["desert:1"]);
    expect(r.phase).toBe("mission-reward");
    expect(heroUnlocked(p.data,"maria")).toBe(false);
    r.phase = "defeat";
    p.recordRun(r);
    const restored = new ProfileService(store);
    expect(heroUnlocked(restored.data,"maria")).toBe(true);
    expect(heroUnlocked(restored.data,"labuta")).toBe(false);
    expect(unlockedGameplayCards(restored.data)).toContain("ghostShot");
    expect(upgradeUnlocked(restored.data,"primary")).toBe(true);
    expect(stageUnlocked(restored.data,"mine")).toBe(false);
    expect(restored.toggleDeck("ghostShot")).toBe(true);
    expect(restored.toggleDeck("longshot")).toBe(false);
  });

  it("separa sobrevivência de conclusão e só abre a fase com todos os objetivos", () => {
    const p = fresh();
    const r = run("playing");
    r.time = 899.99;
    r.bossEncounter.active = true;
    new RunSystem().update(r,.02,{x:0,z:0});
    expect(r.time).toBe(899.99);
    expect(r.visualTime).toBeGreaterThan(0);
    expect(r.phase).toBe("playing");
    r.bossEncounter.active = false;
    new RunSystem().update(r,.02,{x:0,z:0});
    expect(r.phase).toBe("victory");
    p.recordRun(r);
    expect(stageUnlocked(p.data,"mine")).toBe(false);
    const clear = run("victory");
    clear.missionsCompleted = CAMPAIGN.desert.missions.length;
    clear.bossEncounter.nextBoss = CAMPAIGN.desert.bosses.length;
    p.recordRun(clear);
    expect(stageUnlocked(p.data,"mine")).toBe(true);
    expect(heroUnlocked(p.data,"rosa")).toBe(true);
    expect(heroUnlocked(p.data,"indigo")).toBe(true);
    p.data.coins=1000;
    expect(p.buyBentoCard("ironCharm")).toBe(true);
  });

  it("não concede progresso de missão no modo livre nem aceita ids inválidos", () => {
    const p=fresh(), r=run();
    r.mode="free";
    r.completedMissionIds.add("desert:1");
    p.recordRun(r);
    expect(p.data.missionClears).toEqual([]);
    const invalid=run();
    invalid.completedMissionIds=new Set(["fake:1","mine:1","desert:99"]);
    p.recordRun(invalid);
    expect(p.data.missionClears).toEqual([]);
  });

  it("preserva deck, campeões e mercador de saves antigos com progresso", () => {
    const store=storage({completedRuns:2,coins:400,deck:["lantern","ironWill","lastStand"],storyClears:{mine:true},forgedCards:["bulwark"]});
    const p=new ProfileService(store);
    expect(p.data.legacyProgression).toBe(true);
    expect(p.data.deck).toEqual(["lantern","ironWill","lastStand"]);
    expect(heroUnlocked(p.data,"maria")).toBe(true);
    expect(upgradeUnlocked(p.data,"fortune")).toBe(true);
    expect(p.data.coins).toBe(400);
    p.save();
    expect(new ProfileService(store).data).toEqual(p.data);
    expect(new ProfileService(storage({completedRuns:1})).data.legacyProgression).toBe(true);
    expect(new ProfileService(storage({sound:false,completedRuns:0,deck:["pistol","molotov","heart"]})).data.legacyProgression).toBe(false);
  });

  it("cobre todo conteúdo com regra explícita e todas as recompensas são alcançáveis", () => {
    expect(new Set([...STARTER_CARDS,...Object.keys(GAMEPLAY_CARD_UNLOCKS),...Object.keys(MISSION_CARD_REWARDS),...Object.keys(FUSIONS),...Object.keys(BENTO_CARDS)])).toEqual(new Set(ABILITY_IDS));
    expect(new Set(["joao",...Object.keys(HERO_REWARDS),...Object.keys(MISSION_HERO_REWARDS),...Object.keys(SPECIAL_HEROES)])).toEqual(new Set(Object.keys(CHARACTERS)));
    const p=fresh();
    p.data.missionClears=[...MISSION_IDS];
    p.data.storyClears=Object.fromEntries(Object.keys(CAMPAIGN).map(id=>[id,true]));
    p.data.ownedHeroes=Object.keys(MERCHANT_HEROES);p.data.discoveries.bosses=['clanker'];
    expect(Object.keys(CHARACTERS).every(id=>heroUnlocked(p.data,id))).toBe(true);
    expect(Object.keys(PERMANENT_UPGRADES).every(id=>upgradeUnlocked(p.data,id))).toBe(true);
    expect(Object.keys(FUSIONS).every(id=>fusionUnlocked(p.data,id))).toBe(true);
  });

  it("resolve modelos de todos os inimigos e chefes, incluindo espectros", () => {
    const models=["bat","dog","vulture","skeleton","miner","boss","marshal","spider","snake","scorpion","rat","ghost","skull",...Object.keys(SUPPLIED_ASSETS).map(id=>'supplied:'+id),...Object.values(SPECIAL_ART).map(id=>'special:'+id)];
    for(const id of ENEMY_IDS) expect(models).toContain(meshFor(id));
    for(const stage of Object.values(CAMPAIGN)) for(const boss of stage.bosses) expect(models).toContain(meshFor(boss.type,boss.id));
    expect(meshFor("marshal","damaMalvina")).toBe("supplied:dama-malvina");
    expect(meshFor("barBanshee")).toBe("supplied:ghost-2");
    expect(meshFor("boss","ashSerpent")).toBe("supplied:cobra");
    expect(meshFor("boss","ashSerpent")).not.toBe(meshFor("boss","fireChupacabra"));
  });

  it("volta da partida para o mapa, exibindo o aviso do Arsenal liberado", () => {
    const profile=fresh();
    profile.data.language="pt";
    const app=Object.create(GameApplication.prototype);
    app.profile=profile;
    app.vm={model:run()};
    app.endRun=()=>{ profile.recordRun(app.vm.model); app.vm=null; };
    app.show=name=>{app.current=name;};
    app.action("select");
    expect(app.current).toBe("map-select");
    const markup=preparationMarkup(profile,"map");
    expect(markup).toContain('data-action="arsenal" >');
    expect(markup).toContain("Arsenal liberado!");
  });

  it("explica bloqueios por missão no menu e no mercador", () => {
    const p=fresh();
    p.data.language="pt";
    expect(preparationMarkup(p,"character","maria")).toContain("Conclua a missão 1 de Deserto dos Condenados");
    expect(preparationMarkup(p,"map")).toContain('data-action="arsenal" disabled');
    expect(permanentProducts(p)).toContain("Conclua a missão 2 de Deserto dos Condenados");
  });
});
