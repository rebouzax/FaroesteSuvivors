import { STAGE_WEATHER } from '../config/stageWeather.js';
export class WeatherSystem {
  update(run,dt) {
    const weather=run.weather;
    weather.strikes??=[];
    const allowed=STAGE_WEATHER[run.mapId]||[];
    if(!allowed.length){weather.kind=null;weather.remaining=0;weather.strikes=[];run.tornadoes=[];if(['rain','sand','tornado','wind'].includes(weather.alert))weather.alertUntil=0;return;}
    if(run.bossEncounter.active)return;
    if(run.time>=weather.nextAt){
      weather.nextAt=run.time+95+run.random()*85;
      weather.kind=allowed[Math.min(allowed.length-1,Math.floor(run.random()*allowed.length))];
      weather.remaining=24+run.random()*12;weather.strikeTimer=1;
      const angle=run.random()*Math.PI*2;
      weather.windX=Math.cos(angle)*1.1;
      weather.windZ=Math.sin(angle)*1.1;
      weather.windEnds=run.time+weather.remaining;
      weather.alert=weather.kind;
      weather.alertUntil=run.time+4;
      if(weather.kind==='tornado')for(let i=0;i<3;i++){
        const a=angle+i*2.3;
        run.tornadoes.push({x:Math.max(-114,Math.min(114,run.player.x+Math.cos(a)*17)),z:Math.max(-114,Math.min(114,run.player.z+Math.sin(a)*17)),vx:Math.cos(angle+0.7+i)*2.2,vz:Math.sin(angle+0.7+i)*2.2,age:0,life:21});
      }
    }
    weather.remaining=Math.max(0,(weather.remaining||0)-dt);
    if(weather.remaining>0&&weather.kind==='rain'){
      weather.strikeTimer-=dt;
      if(weather.strikeTimer<=0){
        weather.strikeTimer=1.6+run.random()*1.7;
        const target=run.random()<.35?run.player:run.enemies[Math.floor(run.random()*run.enemies.length)]||run.player;
        weather.strikes.push({x:target.x+(run.random()-.5)*5,z:target.z+(run.random()-.5)*5,age:0,radius:2.2,hit:false});
      }
    }
    for(const s of weather.strikes){
      s.age+=dt;
      if(s.age>=1.2&&!s.hit){
        s.hit=true;run.events.push('glass');
        this.hurtPlayer(run,s,25,s.radius);
        for(const e of run.enemies)if(e.hp>0&&Math.hypot(e.x-s.x,e.z-s.z)<s.radius){e.hp-=120;e.hitFlash=.2;}
      }
    }
    weather.strikes=weather.strikes.filter(s=>s.age<1.65);
    for(const tornado of run.tornadoes){
      tornado.age+=dt;
      tornado.x+=tornado.vx*dt;
      tornado.z+=tornado.vz*dt;
      tornado.damageTimer=(tornado.damageTimer||0)-dt;
      if(tornado.damageTimer<=0){tornado.damageTimer=.6;for(const e of run.enemies)if(e.hp>0&&Math.hypot(e.x-tornado.x,e.z-tornado.z)<2){e.hp-=24;e.hitFlash=.12;}}
      const player=run.player;
      if(Math.hypot(player.x-tornado.x,player.z-tornado.z)<2 && player.invulnerable<=0){
        player.hp=Math.max(0,player.hp-8*20/(20+run.playerArmor));
        player.invulnerable=0.9;
        run.events.push("hurt");
        if(player.hp===0)run.phase="defeat";
      }
    }
    run.tornadoes=run.tornadoes.filter(t=>t.age<t.life);
  }
  hurtPlayer(run,point,damage,radius){
    const p=run.player;
    if(p.invulnerable<=0&&Math.hypot(p.x-point.x,p.z-point.z)<radius){p.hp=Math.max(0,p.hp-damage*20/(20+run.playerArmor));p.invulnerable=.9;run.events.push('hurt');if(p.hp===0)run.phase='defeat';}
  }
}
