import {TREASURE_CREATURES} from '../config/treasureCreatures.js';
import {pushOut} from './SceneryCollision.js';
const clamp=n=>Math.max(-112,Math.min(112,n));
export class TreasureSystem{
 update(run,dt){
  run.treasureBursts??=[];
  for(const b of run.treasureBursts)b.age+=dt;
  run.treasureBursts=run.treasureBursts.filter(b=>b.age<1.4);
  // Two independently randomized windows guarantee two opportunities in a full run.
  run.treasureSchedule??=[20+run.random()*340,430+run.random()*370];
  run.treasureSpawned??=0;
  if(!run.bossEncounter.active&&run.treasureSpawned<2&&run.time>=run.treasureSchedule[run.treasureSpawned]){
   const spec=TREASURE_CREATURES[run.mapId],a=run.random()*Math.PI*2;
   const e={id:++run.nextId,type:'treasure:'+run.mapId,treasure:true,name:spec.name,hp:600,maxHp:600,armor:0,damage:0,xp:30,speed:4.3,x:clamp(run.player.x+Math.cos(a)*16),z:clamp(run.player.z+Math.sin(a)*16),hitFlash:0,life:100,reward:600+Math.floor(run.random()*601)};
   for(let pass=0;pass<3;pass++)for(const p of run.props)pushOut(e,p,.85);
   run.enemies.push(e);run.treasureSpawned++;
   run.weather.alert='treasure';run.weather.alertUntil=run.time+6;
  }
  for(const e of run.enemies){
   if(!e.treasure||e.hp<=0)continue;
   if(run.bossEncounter.active)continue;
   e.life-=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);
   const dx=e.x-run.player.x,dz=e.z-run.player.z,d=Math.hypot(dx,dz)||1;
   let vx=dx/d,vz=dz/d;
   for(const prop of run.props){
    if(Math.hypot(e.x-prop.x,e.z-prop.z)>(prop.radius||0)+2)continue;
    const probe={x:e.x+vx*.5,z:e.z+vz*.5};
    if(pushOut(probe,prop,1.3)){
     const nx=probe.x-e.x-vx*.5,nz=probe.z-e.z-vz*.5,side=e.id%2?1:-1;
     vx+=nx*2-nz*side;vz+=nz*2+nx*side;
    }
   }
   const magnitude=Math.hypot(vx,vz)||1;vx/=magnitude;vz/=magnitude;
   // Curve along the arena boundary instead of running out of bounds.
   if(Math.abs(e.x)>105)vx=-Math.sign(e.x)*.7;
   if(Math.abs(e.z)>105)vz=-Math.sign(e.z)*.7;
   const oldX=e.x,oldZ=e.z;
   const steps=Math.max(1,Math.ceil(e.speed*dt/.25));
   for(let i=0;i<steps;i++){
    e.x=clamp(e.x+vx*e.speed*dt/steps);e.z=clamp(e.z+vz*e.speed*dt/steps);
    for(let pass=0;pass<2;pass++)for(const p of run.props)pushOut(e,p,.85);
   }
   e.facing=Math.atan2(e.x-oldX,e.z-oldZ);
  }
  run.enemies=run.enemies.filter(e=>!e.treasure||e.hp<=0||e.life>0);
 }
 defeated(run,e,drop){
  const pieces=24,base=Math.floor(e.reward/pieces),rest=e.reward%pieces;
  for(let i=0;i<pieces;i++){
   const a=i*Math.PI*2/pieces,p={x:e.x+Math.cos(a)*(1+i%3*.4),z:e.z+Math.sin(a)*(1+i%3*.4)};
   for(const prop of run.props)pushOut(p,prop,.1);
   drop(p.x,p.z,'treasureCoin',base+(i<rest?1:0));
  }
  run.treasureBursts.push({x:e.x,z:e.z,age:0});run.events.push('glass');
 }
}
