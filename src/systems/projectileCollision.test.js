import { expect, it } from "vitest";
import { CombatSystem } from "./CombatSystem.js";

const enemy=(id,x,z,type="skeleton")=>({id,x,z,type,hp:100,armor:0});
function shoot(enemies, shot={}) {
  const run={enemies,primaryShots:[{x:0,z:0,vx:600,vz:0,age:0,damage:20,pierce:5,kind:"ada",hit:new Set(),...shot}],impacts:[]};
  new CombatSystem().primaryProjectiles(run,1/60);
  return run;
}
it("preserves swept collisions, boss radius, piercing and misses",()=>{
  const run=shoot([enemy(1,3,.59),enemy(2,4,.61),enemy(3,8,1.34,"marshal"),enemy(4,8,1.36,"boss"),enemy(5,80,0)]);
  expect(run.enemies.map(e=>e.hp)).toEqual([80,100,80,100,100]);
  expect(run.primaryShots[0].pierce).toBe(3);
  expect(run.impacts).toHaveLength(2);
});
it("preserves backwards shots, stationary shots and the single-hit rule",()=>{
  const backwards=shoot([enemy(1,-8,0),enemy(2,-3,0)],{vx:-600,pierce:1});
  expect(backwards.enemies.map(e=>e.hp)).toEqual([80,100]);
  expect(backwards.primaryShots).toHaveLength(0);
  const stationary=shoot([enemy(1,.5,0),enemy(2,-.5,0)],{vx:0,hit:new Set([1])});
  expect(stationary.enemies.map(e=>e.hp)).toEqual([100,80]);
});
