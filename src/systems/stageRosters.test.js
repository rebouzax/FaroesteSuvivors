import { describe,it,expect } from "vitest";
import { CAMPAIGN, ENEMY_IDS, ENEMY_STAGE_GROUPS, STAGE_ORDER } from "../config/campaignConfig.js";
import { RunModel } from "../models/RunModel.js";
import { EnemySystem } from "./EnemySystem.js";
import { BossSystem } from "./BossSystem.js";
import { MissionSystem } from "./MissionSystem.js";

describe("bestiários exclusivos por fase",()=>{
  it("cobre as 15 fases, sem IDs compartilhados, e mantém missões alcançáveis",()=>{
    const all=STAGE_ORDER.flatMap(stage=>ENEMY_STAGE_GROUPS[stage]);
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all)).toEqual(new Set(ENEMY_IDS));
    for(const stage of STAGE_ORDER){
      expect(ENEMY_STAGE_GROUPS[stage].length).toBeGreaterThanOrEqual(4);
      for(const mission of CAMPAIGN[stage].missions)
        if(mission.kind!=="crate")expect(ENEMY_STAGE_GROUPS[stage]).toContain(mission.kind);
    }
  });
  it.each(STAGE_ORDER)("%s: ondas e reforços não escapam do bestiário",stage=>{
    let seed=123;
    const random=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
    const run=new RunModel(random,0,{}, {mapId:stage});
    const system=new EnemySystem(),seen=new Set();
    run.props=[];
    for(let time=0;time<=900;time+=15){
      run.time=time;run.enemies=[];run.spawnTimer=0;run.specialSpawnTimer=0;
      system.update(run,1);
      for(const enemy of run.enemies){
        expect(ENEMY_STAGE_GROUPS[stage]).toContain(enemy.type);
        expect(Number.isFinite(enemy.x)&&Number.isFinite(enemy.z)).toBe(true);
        seen.add(enemy.type);
      }
    }
    expect(seen).toEqual(new Set(ENEMY_STAGE_GROUPS[stage]));
    const bossSystem=new BossSystem();
    run.enemies=[];
    bossSystem.resolve(run,{x:0,z:0,damage:40},{pattern:"summonSkeleton"});
    for(const minion of run.enemies)expect(ENEMY_STAGE_GROUPS[stage]).toContain(minion.type);
  });
  it("não estende prazo de missão quando o relógio já está pausado no chefe",()=>{
    const run=new RunModel();run.phase="playing";run.bossEncounter.active=true;
    run.mission={expiresAt:220};
    new MissionSystem().update(run,[],30);
    expect(run.mission.expiresAt).toBe(220);
  });
});
