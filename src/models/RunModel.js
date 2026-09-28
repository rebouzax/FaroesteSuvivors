import { CONFIG, levelCost } from "../config/gameConfig.js";
import { FRONTIER_CARDS } from "../config/frontierExpansion.js";
import { ABILITY_IDS, abilityMaxLevel } from "../config/abilityConfig.js";
import { createWorld } from "./WorldModel.js";
import { temporaryPrice } from "../config/shopConfig.js";
import { CHARACTERS } from "../config/characterConfig.js";
import { MAPS } from "../config/mapConfig.js";
import { CAMPAIGN } from "../config/campaignConfig.js";
import { DECK_MIN, STARTER_DECK } from "../config/deckConfig.js";
export class RunModel {
  constructor(random = Math.random, permanentHealth = 0, bonuses = {}, options = {}) {
    this.random = random;
    this.characterId = CHARACTERS[options.characterId] ? options.characterId : "joao";
    this.mapId = MAPS[options.mapId] ? options.mapId : "desert";
    this.mode = options.mode === "story" ? "story" : "free";
    this.deck = [...new Set((options.deck || STARTER_DECK).filter((id) => ABILITY_IDS.includes(id)))];
    if (this.deck.length < DECK_MIN) this.deck = [...STARTER_DECK];
    this.missionsCompleted = 0;
    this.completedMissionIds = new Set();
    this.defeatedTypes = new Set();
    this.defeatedBosses = new Set();
    this.encounteredBosses = new Set();
    this.hero = CHARACTERS[this.characterId];
    this.attackRate = 1 + (bonuses.attackRank || 0) * 0.08 + (this.hero.attackBonus || 0);
    this.moveSpeed =
      this.hero.speed * (1 + (bonuses.movementRank || 0) * 0.05);
    this.primaryDamage = this.hero.damage + (bonuses.primaryRank || 0) * 2;
    this.primaryRange = this.hero.range;
    this.playerArmor = (bonuses.armorRank || 0) * 2 + (this.hero.armor || 0);
    this.critBonus = Math.min(.2,(bonuses.critRank||0)*.025);
    this.coinMultiplier = 1 + (bonuses.bountyRank||0)*.08;
    this.magnetRadius = CONFIG.magnetRadius + (bonuses.magnetRank || 0) * 0.7 + (this.hero.magnet || 0);
    this.crateBandageChance=Math.min(0.75,0.38+(bonuses.crateLuckRank||0)*0.04);
    this.xpMultiplier=1+(bonuses.xpRank||0)*0.05 + (this.hero.xp || 0);
    this.whipRank = 0;
    this.shopPurchases = Object.fromEntries(["whip", "haste", "spur", ...ABILITY_IDS].map(id => [id, 0]));
    this.merchant = null;
    this.merchantWindow = -1;
    this.vultureTimer = 0;
    this.enemyVoiceTimers = { dog: 0 };
    this.phase = "intro";
    this.introTime = 0;
    this.time = 0;
    this.visualTime = 0;
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
    this.specialSpawnTimer = 0;
    this.bossEncounter = { active: false, completed: false, nextBoss: 0, radius: 12, age: 0, x: 0, z: 0, type: null };
    this.enemyShots = [];
    this.bossTelegraph = null;
    this.bossHazards = [];
    this.difficulty = 0;
    this.attack = null;
    this.cooldown = 0.3;
    this.boomerangTimer = 0;
    this.levelFlash = 0;
    this.abilities = Object.fromEntries(ABILITY_IDS.map(id => [id, 0]));
    if(this.hero.startingCard)this.abilities[this.hero.startingCard]=1;
    this.pirateBombTimer=1;
    this.pendingChoices = 0;
    this.cardOffers = [];
    this.lastCard = null;
    this.chain = 0;
    this.empowered = { id: null, remaining: 0, multiplier: 1 };
    this.pistolTimer = 0;
    this.molotovTimer = 0;
    this.regenTimer = 0;
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
    this.pendingPrimaryShots = [];
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
      if(this.deck.some(id=>this.abilities[id]<abilityMaxLevel(id)))this.pendingChoices++;
      else this.coins+=12;
      this.levelFlash = 2;
      this.events.push("level");
    }
    if (this.pendingChoices && this.phase === "playing") {
      this.phase = "upgrade";
      this.dealCards();
    }
  }
  dealCards() {
    const deck = this.deck.filter(id=>this.abilities[id]<abilityMaxLevel(id));
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
      !this.cardOffers.includes(id) || this.abilities[id]>=abilityMaxLevel(id)
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
    if (id === "bulwark") {
      this.playerArmor += 2;
      this.player.maxHp += 10;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
    }
    this.applyCardEffects(id);
    if (!this.pendingChoices || !this.deck.some(card=>this.abilities[card]<abilityMaxLevel(card))) {
      this.coins+=this.pendingChoices*12;
      this.pendingChoices=0;
      this.phase = "playing"; this.cardOffers = [];
    }else this.dealCards();
    return true;
  }
  chooseMissionReward(reward) {
    if(this.phase!=="mission-reward" || !this.mission?.success) return false;
    if(reward==="coins")this.coins+=25;
    else if(reward==="health"){
      this.player.maxHp+=20;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+40);
    }else if(reward==="card"){
      const available=this.deck.filter(id=>this.abilities[id]<abilityMaxLevel(id));
      if(!available.length){this.coins+=25;this.mission=null;this.phase="playing";return true;}
      const owned=available.filter(id=>this.abilities[id]>0);
      this.missionOffers=(owned.length?owned:available).slice(0,3);
      this.phase="mission-card";
      return true;
    }else return false;
    this.mission=null;
    this.phase="playing";
    return true;
  }
  chooseMissionCard(id) {
    if(this.phase!=="mission-card"||!this.missionOffers.includes(id)||this.abilities[id]>=abilityMaxLevel(id))return false;
    this.abilities[id]++;
    if(id==="ironWill")this.playerArmor+=3;
    if(id==="heart"){
      this.player.maxHp+=20;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+20);
    }
    if (id === "bulwark") {
      this.playerArmor += 2;
      this.player.maxHp += 10;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
    }
    this.applyCardEffects(id);
    this.mission=null;
    this.missionOffers=[];
    this.phase="playing";
    return true;
  }
  get requiredXp() {
    return levelCost(this.player.level);
  }
  get merchantCards() {
    return ["whip", "haste", "spur", ...ABILITY_IDS.filter((id) => this.abilities[id] > 0 && this.abilities[id]<abilityMaxLevel(id))];
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
      if (id === "bulwark") {
        this.playerArmor += 2;
        this.player.maxHp += 10;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
      }
      if (id === "heart") {
        this.player.maxHp += 20;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
      }
      this.applyCardEffects(id);
    }
    return true;
  }
  leaveMerchant() {
    if (this.phase !== "merchant") return;
    this.phase = "playing";
    this.merchant.reentryLocked = true;
    this.player.invulnerable = Math.max(this.player.invulnerable, 1.5);
  }
  campaignComplete() {
    return this.missionsCompleted >= CAMPAIGN[this.mapId].missions.length &&
      this.bossEncounter.nextBoss >= CAMPAIGN[this.mapId].bosses.length;
  }
  applyCardEffects(id){
    const stats=FRONTIER_CARDS[id]?.stats;
    if(stats){
      this.primaryDamage+=stats.damage||0;this.primaryRange+=stats.range||0;
      this.playerArmor+=stats.armor||0;this.attackRate+=stats.haste||0;
      this.moveSpeed+=this.hero.speed*(stats.speed||0);this.magnetRadius+=stats.magnet||0;
      this.coinMultiplier+=stats.fortune||0;this.xpMultiplier+=stats.fortune||0;
      this.critBonus=Math.min(.7,this.critBonus+(stats.crit||0));
      this.regenPower=(this.regenPower||0)+(stats.regen||0);
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+(stats.heal||0));
      this.player.maxHp+=stats.health||0;this.player.hp=Math.min(this.player.maxHp,this.player.hp+(stats.health||0));
    }
    const damage={saltedRounds:3,saloonTempest:5,bentoGhostLead:2,railbreaker:4,marshfire:3};
    const range={longshot:2,railbreaker:2};
    const speed={dustWaltz:.06,bentoSaddle:.05,windwardOath:.08,crowstorm:.04};
    const armor={ironRosary:2,windwardOath:1};
    if(damage[id])this.primaryDamage+=damage[id];
    if(range[id])this.primaryRange+=range[id];
    if(speed[id])this.moveSpeed+=this.hero.speed*speed[id];
    if(armor[id])this.playerArmor+=armor[id];
    if(id==="blueTonic"){
      this.player.maxHp+=18;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+12);
    }
    if(id==="bentoHourglass")this.attackRate+=.04;
    if(id==="bentoLuckyStar"){this.coinMultiplier+=.1;this.xpMultiplier+=.1;}
    if(id==="bentoMercyCoin")this.player.hp=Math.min(this.player.maxHp,this.player.hp+3);
    if(id==="crowstorm")this.critBonus=Math.min(.5,this.critBonus+.05);
    if(id==="ironCharm")this.playerArmor+=2;
    if(id==="deadeye")this.primaryDamage+=4;
    if(id==="bloodOath"){
      this.player.maxHp+=12;
      this.player.hp=Math.min(this.player.maxHp,this.player.hp+12);
    }
  }
}
