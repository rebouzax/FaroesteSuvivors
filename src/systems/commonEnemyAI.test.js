import { expect, it } from "vitest";
import { RunModel } from "../models/RunModel.js";
import { EnemySystem } from "./EnemySystem.js";

const setup = () => {
  const run=new RunModel(()=>.5);
  run.phase="playing";
  run.time=10;
  run.spawnTimer=100;
  run.player.x=0;run.player.z=8;
  return run;
};

it("atiradores mostram a mira antes de disparar e travam uma direção esquivável",()=>{
  const run=setup(),system=new EnemySystem();
  run.enemies.push({id:1,type:"skeleton",hp:100,maxHp:100,damage:20,armor:0,speed:1,x:8,z:8,shotTimer:0,hitFlash:0});
  system.update(run,.1);
  expect(run.enemies[0].aimTimer).toBeGreaterThan(0);
  expect(run.enemyShots).toHaveLength(0);
  const lockedX=run.enemies[0].aimX;
  run.player.x=2;
  system.update(run,.6);
  expect(run.enemies[0].aimTimer).toBe(0);
  expect(run.enemies[0].aimX).toBe(lockedX);
  expect(run.enemyShots).toHaveLength(1);
  expect(run.enemyShots[0].kind).toBe('axe');
  expect(run.enemies[0].throwRelease).toBeGreaterThan(0);
});

it("inimigos de carga dão aviso antes de avançar",()=>{
  const run=setup(),system=new EnemySystem();
  run.enemies.push({id:2,type:"saltScorpion",hp:100,maxHp:100,damage:20,armor:0,speed:3.2,x:8,z:8,chargeTimer:0,hitFlash:0});
  system.update(run,.1);
  expect(run.enemies[0].charge.warning).toBeGreaterThan(0);
  const x=run.enemies[0].x;
  system.update(run,.1);
  expect(run.enemies[0].x).toBe(x);
  system.update(run,.7);
  expect(run.enemies[0].x).toBeLessThan(x);
});
