const MISSIONS=[
  {at:45,kind:"bat",target:7,duration:65},
  {at:240,kind:"crate",target:2,duration:130},
  {at:495,kind:"skeleton",target:6,duration:105},
];
export class MissionSystem {
  update(run, killed = []) {
    if(run.phase!=="playing")return;
    if(!run.mission && run.missionIndex<MISSIONS.length && run.time>=MISSIONS[run.missionIndex].at){
      const spec=MISSIONS[run.missionIndex++];
      run.mission={...spec,progress:0,expiresAt:run.time+spec.duration,success:false,lastCrates:run.cratesBroken};
      run.events.push("level");
    }
    const mission=run.mission;
    if(!mission)return;
    if(mission.kind==="crate"){
      mission.progress+=run.cratesBroken-mission.lastCrates;
      mission.lastCrates=run.cratesBroken;
    }else mission.progress+=killed.filter(type=>type===mission.kind).length;
    if(mission.progress>=mission.target){
      mission.progress=mission.target;
      mission.success=true;
      run.phase="mission-reward";
      run.events.push("level");
    }else if(run.time>=mission.expiresAt){
      run.mission=null;
      run.weather.alert="mission-failed";
      run.weather.alertUntil=run.time+4;
    }
  }
}
