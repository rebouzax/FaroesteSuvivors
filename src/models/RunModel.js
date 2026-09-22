import { CONFIG, levelCost } from "../config/gameConfig.js";
import { createWorld } from "./WorldModel.js";
export class RunModel {
  constructor(random = Math.random) {
    this.random = random;
    this.phase = "intro";
    this.introTime = 0;
    this.time = 0;
    this.player = {
      x: 0,
      z: 8,
      dx: 0,
      dz: -1,
      hp: CONFIG.playerHp,
      invulnerable: 0,
      level: 1,
      xp: 0,
    };
    this.bats = [];
    this.loot = [];
    this.props = createWorld();
    this.events = [];
    this.kills = 0;
    this.coins = 0;
    this.nextId = 0;
    this.spawnTimer = 0;
    this.attack = null;
    this.cooldown = 0.3;
    this.levelFlash = 0;
  }
  addXp(amount) {
    this.player.xp += amount;
    while (this.player.xp >= levelCost(this.player.level)) {
      this.player.xp -= levelCost(this.player.level);
      this.player.level++;
      this.levelFlash = 2;
      this.events.push("level");
    }
  }
  get requiredXp() {
    return levelCost(this.player.level);
  }
}
