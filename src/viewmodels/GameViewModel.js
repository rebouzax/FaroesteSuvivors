import { RunModel } from "../models/RunModel.js";
import { RunSystem } from "../systems/RunSystem.js";

export class GameViewModel {
  constructor(profile, audio, options = {}) {
    this.model = new RunModel(
      Math.random,
      profile.data.healthRank * 20,
      profile.data,
      options,
    );
    this.system = new RunSystem();
    this.profile = profile;
    this.audio = audio;
    this.paused = false;
    this.settled = false;
  }
  update(dt, input) {
    if (this.paused) return;
    this.system.update(this.model, dt, input);
    for (const event of this.model.events) this.audio.play(event);
    this.audio.setFire(
      this.model.phase === "playing" && this.model.fires.length > 0,
    );
    if (["victory", "defeat"].includes(this.model.phase)) this.settle();
  }
  settle() {
    if (this.settled) return;
    this.settled = true;
    this.profile.credit(this.model.coins);
  }
  togglePause() {
    if (["intro", "playing", "upgrade"].includes(this.model.phase))
      this.paused = !this.paused;
  }
}
