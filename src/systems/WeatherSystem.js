import { CONFIG } from "../config/gameConfig.js";
export class WeatherSystem {
  update(run,dt) {
    const weather=run.weather;
    if(run.time>=weather.nextAt){
      weather.nextAt+=145;
      const angle=run.random()*Math.PI*2;
      weather.windX=Math.cos(angle)*1.1;
      weather.windZ=Math.sin(angle)*1.1;
      weather.windEnds=run.time+21;
      weather.alert="wind";
      weather.alertUntil=run.time+4;
      for(let i=0;i<3;i++){
        const a=angle+i*2.3;
        run.tornadoes.push({x:Math.max(-114,Math.min(114,run.player.x+Math.cos(a)*17)),z:Math.max(-114,Math.min(114,run.player.z+Math.sin(a)*17)),vx:Math.cos(angle+0.7+i)*2.2,vz:Math.sin(angle+0.7+i)*2.2,age:0,life:21});
      }
    }
    if(run.time<weather.windEnds && !run.bossEncounter.active){
      run.player.x=Math.max(-CONFIG.mapHalf+1,Math.min(CONFIG.mapHalf-1,run.player.x+weather.windX*dt));
      run.player.z=Math.max(-CONFIG.mapHalf+1,Math.min(CONFIG.mapHalf-1,run.player.z+weather.windZ*dt));
    }
    for(const tornado of run.tornadoes){
      tornado.age+=dt;
      tornado.x+=tornado.vx*dt;
      tornado.z+=tornado.vz*dt;
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
}
