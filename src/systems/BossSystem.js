import { CONFIG } from "../config/gameConfig.js";
import { CAMPAIGN, ENEMY_STAGE_GROUPS } from "../config/campaignConfig.js";

const clamp = n => Math.max(-CONFIG.mapHalf+2,Math.min(CONFIG.mapHalf-2,n));
const ALTERNATE = {
  pulse:"dash", fireMark:"crossfire", volley:"fireMark", lunge:"pulse",
  dash:"crossfire", summonMiner:"lunge", summonSkeleton:"volley",
  shotgun:"dash", tornadoes:"ringGap", ringGap:"volley", crossfire:"dash",
};
const warningTime = pattern => pattern.startsWith("summon") ? 1.05 : pattern==="tornadoes" ? 1.55 : pattern==="dash"||pattern==="lunge" ? 1.05 : 1.15;
export class BossSystem {
  start(run) {
    const arena=run.bossEncounter, spec=CAMPAIGN[run.mapId].bosses[arena.nextBoss];
    if(arena.active||!spec||run.time<spec.at)return;
    Object.assign(arena,{active:true,age:0,radius:15,flameDamage:spec.flame,x:run.player.x,z:run.player.z,bossId:spec.id,type:spec.type});
    run.merchant=null;
    run.enemies=run.enemies.filter(e=>e.treasure);
    run.enemyShots.length=0;
    run.bossHazards.length=0;
    run.bossTelegraph=null;
    run.tornadoes.length=0;
    run.weather.alertUntil=0;
    run.enemies.push({id:++run.nextId,type:spec.type,hp:spec.hp,maxHp:spec.hp,damage:spec.damage,armor:spec.armor,speed:spec.speed,xp:spec.xp,bossId:spec.id,weakness:spec.weakness,counter:spec.counter,pattern:spec.pattern,attackTimer:3.2,attackCount:0,phase:1,hitFlash:0,x:clamp(arena.x+7),z:arena.z});
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
    const phase = boss.hp <= boss.maxHp * .34 ? 3 : boss.hp <= boss.maxHp * .7 ? 2 : 1;
    if(phase>boss.phase){
      boss.phase=phase;
      boss.attackTimer=Math.min(boss.attackTimer,1.25);
      boss.phaseFlash=.8;
      run.events.push("boss-enrage");
    }
    boss.phaseFlash=Math.max(0,(boss.phaseFlash||0)-dt);
    boss.attackTimer-=dt;
    if(boss.dash){
      const oldX=boss.x,oldZ=boss.z;
      boss.x=clamp(boss.x+boss.dash.vx*dt);
      boss.z=clamp(boss.z+boss.dash.vz*dt);
      const vx=boss.x-oldX,vz=boss.z-oldZ,travel=Math.max(.001,vx*vx+vz*vz);
      const portion=Math.max(0,Math.min(1,((player.x-oldX)*vx+(player.z-oldZ)*vz)/travel));
      if(player.invulnerable<=0&&Math.hypot(player.x-oldX-vx*portion,player.z-oldZ-vz*portion)<1.15){
        player.hp=Math.max(0,player.hp-boss.damage*20/(20+run.playerArmor));
        player.invulnerable=.9;
        run.events.push("hurt");
      }
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
      if(tell.delay<=0){boss.releaseFlash=.42;this.resolve(run,boss,tell);run.bossTelegraph=null;}
    }else if(boss.attackTimer<=0){
      const count=boss.attackCount||0;
      boss.attackCount=count+1;
      const useAlternate=phase>1 && (phase===3 ? count%2===1 : count%3===2);
      const pattern=useAlternate ? ALTERNATE[boss.pattern]||"pulse" : boss.pattern;
      const lead=player.moving?Math.min(1.25,.55+phase*.15):0;
      const tx=clamp(player.x+player.dx*lead),tz=clamp(player.z+player.dz*lead);
      const angle=Math.atan2(tz-boss.z,tx-boss.x);
      const delay=warningTime(pattern);
      run.bossTelegraph={x:tx,z:tz,fromX:boss.x,fromZ:boss.z,angle,pattern,delay,totalDelay:delay,phase,radius:pattern==="fireMark"?2.7:pattern==="tornadoes"?4.1:pattern==="ringGap"?5:pattern==="crossfire"?2.8:1.9};
      boss.attackFlash=.58;
      boss.attackTimer=(pattern.startsWith("summon")?6.4:pattern==="fireMark"?4.6:3.9)-(phase-1)*.48;
    }
  }
  resolve(run,boss,tell){
    const pattern=tell.pattern;
    if(pattern==="ringGap"){
      const count=tell.phase===3?16:12,gap=tell.angle;
      for(let i=0;i<count;i++){
        const angle=i*Math.PI*2/count;
        if(Math.abs(Math.atan2(Math.sin(angle-gap),Math.cos(angle-gap)))<.43)continue;
        if(run.enemyShots.length<40)run.enemyShots.push({x:boss.x,z:boss.z,vx:Math.cos(angle)*(8.5+(tell.phase||1)),vz:Math.sin(angle)*(8.5+(tell.phase||1)),age:0,damage:Math.ceil(boss.damage*.48)});
      }
      run.events.push("shot");return;
    }
    if(pattern==="crossfire"){
      for(const offset of (tell.phase===3?[-.84,-.56,-.22,.22,.56,.84]:[-.68,-.22,.22,.68])){
        const angle=tell.angle+offset;
        if(run.enemyShots.length<40)run.enemyShots.push({x:boss.x,z:boss.z,vx:Math.cos(angle)*(10+(tell.phase||1)*.5),vz:Math.sin(angle)*(10+(tell.phase||1)*.5),age:0,damage:Math.ceil(boss.damage*.55)});
      }
      run.events.push("shot");return;
    }
    if(pattern==="tornadoes"){
      const perpendicular=tell.angle+Math.PI/2;
      for(let i=-1;i<=1;i++){
        const angle=tell.angle+(i*.42);
        run.tornadoes.push({
          x:clamp(tell.x+Math.cos(perpendicular)*i*1.5),
          z:clamp(tell.z+Math.sin(perpendicular)*i*1.5),
          vx:Math.cos(angle)*3.1,vz:Math.sin(angle)*3.1,age:0,life:8,
        });
      }
      return;
    }
    if(pattern.startsWith("summon")){
      const roster=ENEMY_STAGE_GROUPS[run.mapId].filter(id=>id!=="vulture");
      const species=roster[Math.floor(run.random()*roster.length)];
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
