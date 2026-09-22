import { RunModel } from "../models/RunModel.js";
import { RunSystem } from "../systems/RunSystem.js";

export class GameViewModel {
  constructor(profile, audio) {
    this.model = new RunModel(Math.random, profile.data.healthRank * 20);
    this.system = new RunSystem();
    this.profile = profile;
    this.audio = audio;
    this.paused = false;
    this.credited = 0;
  }
  update(dt, input) {
    if (this.paused) return;
    this.system.update(this.model, dt, input);
    for (const event of this.model.events) this.audio.play(event);
    this.audio.setFire(
      this.model.phase === "playing" && this.model.fires.length > 0,
    );
    if (this.model.coins > this.credited) {
      this.profile.credit(this.model.coins - this.credited);
      this.credited = this.model.coins;
    }
  }
  togglePause() {
    if (["intro", "playing", "upgrade"].includes(this.model.phase))
      this.paused = !this.paused;
  }
}
