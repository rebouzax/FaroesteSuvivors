import { CONFIG } from "../config/gameConfig.js";
import { CAMPAIGN } from "../config/campaignConfig.js";

const clamp = n => Math.max(-CONFIG.mapHalf+2,Math.min(CONFIG.mapHalf-2,n));
export class BossSystem {
  start(run) {
    const arena=run.bossEncounter, spec=CAMPAIGN[run.mapId].bosses[arena.nextBoss];
    if(arena.active||!spec||run.time<spec.at)return;
    Object.assign(arena,{active:true,age:0,radius:15,flameDamage:spec.flame,x:run.player.x,z:run.player.z,bossId:spec.id,type:spec.type});
    run.merchant=null;
    run.enemies.length=0;
    run.enemyShots.length=0;
    run.bossHazards.length=0;
    run.bossTelegraph=null;
    run.tornadoes.length=0;
    run.weather.alertUntil=0;
    run.enemies.push({id:++run.nextId,type:spec.type,hp:spec.hp,maxHp:spec.hp,damage:spec.damage,armor:spec.armor,speed:spec.speed,xp:spec.xp,bossId:spec.id,weakness:spec.weakness,counter:spec.counter,pattern:spec.pattern,attackTimer:3.2,hitFlash:0,x:clamp(arena.x+7),z:arena.z});
    run.encounteredBosses.add(spec.id);
    run.events.push("boss-enter");
  }
  updateArena(run,dt) {
    const arena=run.bossEncounter;
    if(!arena.active)return;
    arena.age+=dt;
    arena.radius=Math.max(8,15-arena.age*.025);
    const player=run.player,dx=player.x-arena.x,dz=player.z-arena.z,distance=Math.hypot(dx,dz);
    if(distance>arena.radius-.4 && distance>0){
      player.hp=Math.max(0,player.hp-arena.flameDamage*dt);
      const factor=(arena.radius-.65)/distance;
      player.x=arena.x+dx*factor;player.z=arena.z+dz*factor;
      if(player.hp<=0)run.phase="defeat";
    }
    const boss=run.enemies.find(e=>e.bossId&&e.hp>0);
    if(!boss)return;
    boss.attackTimer-=dt;
    if(boss.dash){
      boss.x=clamp(boss.x+boss.dash.vx*dt);
      boss.z=clamp(boss.z+boss.dash.vz*dt);
      boss.dash.left-=dt;
      if(boss.dash.left<=0)boss.dash=null;
    }
    run.bossHazards=run.bossHazards.filter(h=>{
      h.duration-=dt;
      if(Math.hypot(player.x-h.x,player.z-h.z)<h.radius)
        player.hp=Math.max(0,player.hp-h.damage*dt);
      return h.duration>0;
    });
    if(player.hp<=0){run.phase="defeat";return;}
    if(run.bossTelegraph){
      const tell=run.bossTelegraph;
      tell.delay-=dt;
      if(tell.delay<=0){this.resolve(run,boss,tell);run.bossTelegraph=null;}
    }else if(boss.attackTimer<=0){
      const tx=player.x,tz=player.z,angle=Math.atan2(tz-boss.z,tx-boss.x);
      run.bossTelegraph={x:tx,z:tz,fromX:boss.x,fromZ:boss.z,angle,pattern:boss.pattern,delay:boss.pattern.startsWith("summon")?.65:1.1,radius:boss.pattern==="fireMark"?2.7:1.9};
      boss.attackFlash=.58;
      boss.attackTimer=boss.pattern.startsWith("summon")?7:boss.pattern==="fireMark"?5:4;
    }
  }
  resolve(run,boss,tell){
    const pattern=tell.pattern;
    if(pattern.startsWith("summon")){
      const species=pattern==="summonMiner"?"miner":"skeleton";
      const existing=run.enemies.filter(e=>e.summoned).length;
      for(let i=0;i<Math.min(3,12-existing);i++){
        const a=i*2*Math.PI/3+run.random();
        run.enemies.push({id:++run.nextId,type:species,summoned:true,hp:species==="miner"?100:150,maxHp:species==="miner"?100:150,damage:Math.ceil(boss.damage*.27),armor:3,speed:3.6,xp:18,x:clamp(boss.x+Math.cos(a)*2),z:clamp(boss.z+Math.sin(a)*2),hitFlash:0});
      }
      return;
    }
    if(pattern==="fireMark"){
      run.bossHazards.push({x:tell.x,z:tell.z,radius:2.7,duration:4,damage:Math.ceil(boss.damage*.45)});
      run.events.push("fire");
      return;
    }
    if(pattern==="dash"||pattern==="lunge"){
      const speed=pattern==="dash"?19:12;
      boss.dash={vx:Math.cos(tell.angle)*speed,vz:Math.sin(tell.angle)*speed,left:pattern==="dash"?.55:.7};
      boss.attackFlash=.58;
      return;
    }
    const count=pattern==="pulse"?8:3;
    for(let i=0;i<count;i++){
      const angle=pattern==="pulse"?i*Math.PI*2/count:tell.angle+(i-1)*(pattern==="shotgun"?.2:.34);
      if(run.enemyShots.length<40)run.enemyShots.push({x:boss.x,z:boss.z,vx:Math.cos(angle)*(pattern==="shotgun"?14:9),vz:Math.sin(angle)*(pattern==="shotgun"?14:9),age:0,damage:Math.ceil(boss.damage*(pattern==="shotgun"?.6:.45))});
    }
    run.events.push("shot");
  }
  defeated(run){
    const arena=run.bossEncounter;
    arena.active=false;arena.nextBoss++;
    arena.completed=arena.nextBoss>=CAMPAIGN[run.mapId].bosses.length;
    arena.type=null;
    run.bossTelegraph=null;run.bossHazards.length=0;
    run.enemyShots.length=0;
    run.clearSummons=true;
    run.events.push("boss-down");run.spawnTimer=0;
  }
}
