// Deterministic CPU microbenchmark. This does not measure GPU time or game FPS.
import { performance } from "node:perf_hooks";
import { CombatSystem } from "../systems/CombatSystem.js";
const combat = new CombatSystem();
for (const enemyCount of [110, 160]) {
  let seed=713;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const enemies=Array.from({length:enemyCount},(_,id)=>({id,type:id%23===0?"marshal":"skeleton",x:random()*40-20,z:random()*40-20,hp:1e9,armor:3}));
  const shots=Array.from({length:64},()=>({x:random()*30-15,z:random()*30-15,vx:random()*40-20,vz:random()*40-20,age:0,damage:20,pierce:3,kind:"ada"}));
  const run={enemies,primaryShots:[],impacts:[]};
  const samples=[];
  let impacts=0;
  for(let batch=0;batch<8;batch++) {
    let elapsed=0;
    for(let frame=0;frame<400;frame++) {
      run.primaryShots=shots.map(shot=>({...shot,hit:new Set()}));
      run.impacts.length=0;
      const start=performance.now();
      combat.primaryProjectiles(run,1/60);
      elapsed+=performance.now()-start;
      impacts+=run.impacts.length;
    }
    if(batch>0)samples.push(elapsed/400);
  }
  samples.sort((a,b)=>a-b);
  console.log(JSON.stringify({enemyCount,shots:64,medianMs:samples[3],minMs:samples[0],impacts,damage:enemies.reduce((sum,e)=>sum+(1e9-e.hp),0)}));
}
