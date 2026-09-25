import { CAMPAIGN } from "../config/campaignConfig.js";

export class MissionSystem {
  update(run, killed = [], dt = 1/60) {
    if (run.phase !== "playing") return;
    // Keep objective timers fair while normal waves are paused for a boss.
    if (run.bossEncounter.active) {
      if (run.mission) run.mission.expiresAt += dt;
      return;
    }
    const missions = CAMPAIGN[run.mapId].missions;
    if (!run.mission && run.missionIndex < missions.length && run.time >= missions[run.missionIndex].at) {
      const spec = missions[run.missionIndex++];
      run.mission = { ...spec, progress: 0, expiresAt: run.time + spec.duration, success: false, lastCrates: run.cratesBroken };
      run.events.push("level");
    }
    const mission = run.mission;
    if (!mission) return;
    if (mission.kind === "crate") {
      mission.progress += run.cratesBroken - mission.lastCrates;
      mission.lastCrates = run.cratesBroken;
    } else mission.progress += killed.filter((type) => type === mission.kind).length;
    if (mission.progress >= mission.target) {
      mission.progress = mission.target;
      mission.success = true;
      run.missionsCompleted++;
      run.phase = "mission-reward";
      run.events.push("level");
    } else if (run.time >= mission.expiresAt) {
      run.mission = null;
      run.weather.alert = "mission-failed";
      run.weather.alertUntil = run.time + 4;
    }
  }
}
