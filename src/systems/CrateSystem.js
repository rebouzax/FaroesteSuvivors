import { CONFIG } from "../config/gameConfig.js";
export class CrateSystem {
  update(run, dt) {
    run.crateSpawnTimer-=dt;
    if(run.crateSpawnTimer>0)return;
    run.crates=run.crates.filter(crate=>Math.hypot(crate.x-run.player.x,crate.z-run.player.z)<58);
    if(run.crates.length>=35){run.crateSpawnTimer=8;return;}
    run.crateSpawnTimer=run.crates.length<14?1.4:8;
    const angle=run.random()*Math.PI*2, distance=15+run.random()*26;
    const x=Math.max(-CONFIG.mapHalf+4,Math.min(CONFIG.mapHalf-4,run.player.x+Math.cos(angle)*distance));
    const z=Math.max(-CONFIG.mapHalf+4,Math.min(CONFIG.mapHalf-4,run.player.z+Math.sin(angle)*distance));
    if(Math.hypot(x-run.player.x,z-run.player.z)<10 || run.props.some(prop=>Math.hypot(prop.x-x,prop.z-z)<prop.radius+1.3))return;
    run.crates.push({id:++run.nextId,x,z,hp:18,hitFlash:0});
  }
  hit(run,x,z,radius,damage) {
    for(const crate of run.crates){
      if(crate.hp<=0||Math.hypot(crate.x-x,crate.z-z)>radius+0.8)continue;
      crate.hp-=damage;
      crate.hitFlash=0.16;
    }
  }
  collectBroken(run,drop) {
    run.crates=run.crates.filter(crate=>{
      crate.hitFlash=Math.max(0,crate.hitFlash-1/60);
      if(crate.hp>0)return true;
      run.cratesBroken++;
      if(run.random()<run.crateBandageChance) drop(crate.x,crate.z,"bandage",25);
      else drop(crate.x,crate.z,"coin",4+Math.floor(run.random()*7));
      run.events.push("glass");
      return false;
    });
  }
}
