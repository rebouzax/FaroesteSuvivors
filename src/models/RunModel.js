import { CONFIG, levelCost } from "../config/gameConfig.js";
import { ABILITY_IDS } from "../config/abilityConfig.js";
import { createWorld } from "./WorldModel.js";
export class RunModel {
  constructor(random = Math.random, permanentHealth = 0) {
    this.random = random;
    this.phase = "intro";
    this.introTime = 0;
    this.time = 0;
    const maxHp = CONFIG.playerHp + permanentHealth;
    this.player = {
      x: 0,
      z: 8,
      dx: 0,
      dz: -1,
      hp: maxHp,
      maxHp,
      invulnerable: 0,
      level: 1,
      xp: 0,
      moving: false,
      walkTime: 0,
    };
    this.enemies = [];
    this.loot = [];
    this.props = createWorld();
    this.events = [];
    this.kills = 0;
    this.coins = 0;
    this.nextId = 0;
    this.spawnTimer = 0;
    this.dogTimer = 0;
    this.difficulty = 0;
    this.attack = null;
    this.cooldown = 0.3;
    this.levelFlash = 0;
    this.abilities = { pistol: 0, molotov: 0, heart: 0 };
    this.pendingChoices = 0;
    this.lastCard = null;
    this.chain = 0;
    this.empowered = { id: null, remaining: 0, multiplier: 1 };
    this.pistolTimer = 0;
    this.molotovTimer = 0;
    this.projectiles = [];
    this.bottles = [];
    this.fires = [];
    this.impacts = [];
    this.shotFlash = 0;
    this.throwFlash = 0;
    this.shotAngle = 0;
  }
  addXp(amount) {
    this.player.xp += amount;
    while (this.player.xp >= levelCost(this.player.level)) {
      this.player.xp -= levelCost(this.player.level);
      this.player.level++;
      this.pendingChoices++;
      this.levelFlash = 2;
      this.events.push("level");
    }
    if (this.pendingChoices && this.phase === "playing") this.phase = "upgrade";
  }
  chooseAbility(id) {
    if (
      this.phase !== "upgrade" ||
      !this.pendingChoices ||
      !ABILITY_IDS.includes(id)
    )
      return false;
    this.chain =
      this.lastCard && this.lastCard !== id ? Math.min(3, this.chain + 1) : 1;
    this.lastCard = id;
    this.abilities[id]++;
    this.pendingChoices--;
    this.empowered = {
      id,
      remaining: this.chain > 1 ? 20 : 0,
      multiplier: 1 + 0.2 * (this.chain - 1),
    };
    if (id === "heart") {
      this.player.maxHp += 20;
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + 20 + 10 * (this.chain - 1),
      );
    }
    if (!this.pendingChoices) this.phase = "playing";
    return true;
  }
  get requiredXp() {
    return levelCost(this.player.level);
  }
}
