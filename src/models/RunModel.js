import { CONFIG, levelCost } from "../config/gameConfig.js";
import { ABILITY_IDS } from "../config/abilityConfig.js";
import { createWorld } from "./WorldModel.js";
import { temporaryPrice } from "../config/shopConfig.js";
import { CHARACTERS } from "../config/characterConfig.js";
import { MAPS } from "../config/mapConfig.js";
export class RunModel {
  constructor(random = Math.random, permanentHealth = 0, bonuses = {}, options = {}) {
    this.random = random;
    this.characterId = CHARACTERS[options.characterId] ? options.characterId : "joao";
    this.mapId = MAPS[options.mapId] ? options.mapId : "desert";
    this.hero = CHARACTERS[this.characterId];
    this.attackRate = 1 + (bonuses.attackRank || 0) * 0.08;
    this.moveSpeed =
      this.hero.speed * (1 + (bonuses.movementRank || 0) * 0.05);
    this.primaryDamage = this.hero.damage + (bonuses.primaryRank || 0) * 2;
    this.playerArmor = (bonuses.armorRank || 0) * 2;
    this.magnetRadius = CONFIG.magnetRadius + (bonuses.magnetRank || 0) * 0.7;
    this.crateBandageChance=Math.min(0.75,0.38+(bonuses.crateLuckRank||0)*0.04);
    this.xpMultiplier=1+(bonuses.xpRank||0)*0.05;
    this.whipRank = 0;
    this.shopPurchases = Object.fromEntries(["whip", "haste", "spur", ...ABILITY_IDS].map(id => [id, 0]));
    this.merchant = null;
    this.merchantWindow = -1;
    this.vultureTimer = 0;
    this.enemyVoiceTimers = { dog: 0 };
    this.phase = "intro";
    this.introTime = 0;
    this.time = 0;
    const maxHp = this.hero.hp + permanentHealth;
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
    this.props = createWorld(this.mapId);
    this.crates = [];
    this.crateSpawnTimer = 0;
    this.cratesBroken = 0;
    this.tornadoes = [];
    this.weather = {nextAt: 150, windEnds: 0, windX: 0, windZ: 0, alert: "", alertUntil: 0};
    this.mission = null;
    this.missionIndex = 0;
    this.missionOffers = [];
    this.events = [];
    this.kills = 0;
    this.coins = 0;
    this.nextId = 0;
    this.spawnTimer = 0;
    this.dogTimer = 0;
    this.skeletonTimer = 0;
    this.minerTimer = 0;
    this.bossEncounter = { active: false, completed: false, nextBoss: 0, radius: 12, age: 0, x: 0, z: 0, type: null };
    this.enemyShots = [];
    this.difficulty = 0;
    this.attack = null;
    this.cooldown = 0.3;
    this.levelFlash = 0;
    this.abilities = Object.fromEntries(ABILITY_IDS.map(id => [id, 0]));
    this.pendingChoices = 0;
    this.cardOffers = [];
    this.lastCard = null;
    this.chain = 0;
    this.empowered = { id: null, remaining: 0, multiplier: 1 };
    this.pistolTimer = 0;
    this.molotovTimer = 0;
    this.ghostTimer = 0;
    this.requiemTimer = 0;
    this.silverTimer = 0;
    this.boneTimer = 0;
    this.lanternTimer = 1;
    this.silverShots = [];
    this.ghostShots = [];
    this.pulses = [];
    this.projectiles = [];
    this.primaryShots = [];
    this.primaryFlash = 0;
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
    if (this.pendingChoices && this.phase === "playing") {
      this.phase = "upgrade";
      this.dealCards();
    }
  }
  dealCards() {
    const deck = [...ABILITY_IDS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(this.random() * (i + 1)));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.cardOffers = deck.slice(0, 3);
  }
  chooseAbility(id) {
    if (
      this.phase !== "upgrade" ||
      !this.pendingChoices ||
      !this.cardOffers.includes(id)
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
    if(id==="ironWill")this.playerArmor+=3;
    if (!this.pendingChoices) { this.phase = "playing"; this.cardOffers = []; }
    else this.dealCards();
    return true;
  }
  chooseMissionReward(reward) {
    if(this.phase!=="mission-reward" || !this.mission?.success) return false;
    if(reward==="coins")this.coins+=25;
    else if(reward==="health"){
      this.player.maxHp+=20;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+40);
    }else if(reward==="card"){
      const owned=ABILITY_IDS.filter(id=>this.abilities[id]>0);
      this.missionOffers=(owned.length?owned:ABILITY_IDS).slice(0,3);
      this.phase="mission-card";
      return true;
    }else return false;
    this.mission=null;
    this.phase="playing";
    return true;
  }
  chooseMissionCard(id) {
    if(this.phase!=="mission-card"||!this.missionOffers.includes(id))return false;
    this.abilities[id]++;
    if(id==="ironWill")this.playerArmor+=3;
    if(id==="heart"){
      this.player.maxHp+=20;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+20);
    }
    this.mission=null;
    this.missionOffers=[];
    this.phase="playing";
    return true;
  }
  get requiredXp() {
    return levelCost(this.player.level);
  }
  get merchantCards() {
    return ["whip", "haste", "spur", ...ABILITY_IDS.filter((id) => this.abilities[id] > 0)];
  }
  buyRunUpgrade(id) {
    if (this.phase !== "merchant" || !this.merchantCards.includes(id))
      return false;
    const price = temporaryPrice(this.shopPurchases[id]);
    if (!Number.isSafeInteger(price) || this.coins < price) return false;
    this.coins -= price;
    this.shopPurchases[id]++;
    if (id === "whip") this.whipRank++;
    else if (id === "haste") this.attackRate += 0.06;
    else if (id === "spur") this.moveSpeed += this.hero.speed * 0.05;
    else {
      this.abilities[id]++;
      if(id==="ironWill")this.playerArmor+=3;
      if (id === "heart") {
        this.player.maxHp += 20;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
      }
    }
    return true;
  }
  leaveMerchant() {
    if (this.phase !== "merchant") return;
    this.phase = "playing";
    this.merchant.reentryLocked = true;
    this.player.invulnerable = Math.max(this.player.invulnerable, 1.5);
  }
}
