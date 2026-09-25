import { shopHealthPrice } from "../config/abilityConfig.js";
import { PERMANENT_UPGRADES, permanentPrice } from "../config/shopConfig.js";
import { ABILITY_IDS } from "../config/abilityConfig.js";
import { FUSIONS, BENTO_CARDS, STARTER_CARDS, STARTER_DECK, DECK_MIN, DECK_MAX } from "../config/deckConfig.js";
import { CAMPAIGN, BOSS_IDS, ENEMY_IDS } from "../config/campaignConfig.js";
const KEY = "faroeste:profile:v2";
export class ProfileService {
  constructor(storage) {
    this.data = {
      coins: 0,
      sound: true,
      music: true,
      wind: true,
      language: "en",
      healthRank: 0,
      attackRank: 0,
      movementRank: 0,
      primaryRank: 0,
      armorRank: 0,
      magnetRank: 0,
      crateLuckRank: 0,
      xpRank: 0,
      critRank: 0,
      bountyRank: 0,
      completedRuns: 0,
      storyClears: {},
      discoveries: { enemies: [], bosses: [], encounteredBosses: [] },
      forgedCards: [],
      bentoCards: [],
      deck: [...STARTER_DECK],
    };
    this.available = true;
    try {
      this.storage = storage ?? globalThis.localStorage;
      const saved = JSON.parse(this.storage?.getItem(KEY) || "null");
      if (saved) {
        for (const key of [
          "coins",
          "healthRank",
          "attackRank",
          "movementRank",
          "primaryRank",
          "armorRank",
          "magnetRank",
          "crateLuckRank",
          "xpRank",
          "critRank",
          "bountyRank",
        ])
          if (Number.isSafeInteger(saved[key]) && saved[key] >= 0)
            this.data[key] = saved[key];
        for (const key of ["wind", "sound", "music"])
          if (typeof saved[key] === "boolean") this.data[key] = saved[key];
        if (["en","es","pt"].includes(saved.language))this.data.language=saved.language;
        if (Number.isSafeInteger(saved.completedRuns) && saved.completedRuns >= 0)
          this.data.completedRuns = saved.completedRuns;
        for (const id of Object.keys(CAMPAIGN))
          if (saved.storyClears?.[id] === true) this.data.storyClears[id] = true;
        for (const [group, ids] of [["enemies", ENEMY_IDS], ["bosses", BOSS_IDS]])
          if (Array.isArray(saved.discoveries?.[group]))
            this.data.discoveries[group] = [...new Set(saved.discoveries[group].filter((id) => ids.includes(id)))];
        if (Array.isArray(saved.discoveries?.encounteredBosses))
          this.data.discoveries.encounteredBosses = [...new Set(saved.discoveries.encounteredBosses.filter(id=>BOSS_IDS.includes(id)))];
        if (Array.isArray(saved.forgedCards))
          this.data.forgedCards = [...new Set(saved.forgedCards.filter((id) => id in FUSIONS))];
        if (Array.isArray(saved.bentoCards))
          this.data.bentoCards=[...new Set(saved.bentoCards.filter(id=>id in BENTO_CARDS))];
        if (Array.isArray(saved.deck)) {
          const owned = new Set([...STARTER_CARDS, ...this.data.forgedCards,...this.data.bentoCards]);
          const deck = [...new Set(saved.deck.filter((id) => ABILITY_IDS.includes(id) && owned.has(id)))];
          if (deck.length >= DECK_MIN && deck.length <= DECK_MAX) this.data.deck = deck;
        }
      } else {
        const old = JSON.parse(
          this.storage?.getItem("faroeste-survivors:menu:v1") || "null",
        );
        if (typeof old?.wind === "boolean") this.data.wind = old.wind;
      }
    } catch {
      this.available = false;
    }
  }
  save() {
    try {
      if (!this.storage) throw new Error("Storage unavailable");
      this.storage.setItem(KEY, JSON.stringify(this.data));
      this.available = true;
    } catch {
      this.available = false;
    }
  }
  credit(coins) {
    this.data.coins = Math.min(
      Number.MAX_SAFE_INTEGER,
      this.data.coins + coins,
    );
    this.save();
  }
  recordRun(run) {
    if (run.time <= 0) return;
    this.data.completedRuns++;
    for (const [group, found] of [["enemies", run.defeatedTypes], ["bosses", run.defeatedBosses]])
      this.data.discoveries[group] = [...new Set([...this.data.discoveries[group], ...found])]
        .filter((id) => (group === "enemies" ? ENEMY_IDS : BOSS_IDS).includes(id));
    this.data.discoveries.encounteredBosses=[...new Set([...this.data.discoveries.encounteredBosses,...run.encounteredBosses])].filter(id=>BOSS_IDS.includes(id));
    if (run.mode === "story" && run.phase === "victory" && run.campaignComplete())
      this.data.storyClears[run.mapId] = true;
    this.save();
  }
  toggleDeck(id) {
    if (this.data.completedRuns < 1 || !ABILITY_IDS.includes(id) ||
        !(STARTER_CARDS.includes(id) || this.data.forgedCards.includes(id) || this.data.bentoCards.includes(id))) return false;
    const deck = this.data.deck;
    if (deck.includes(id)) {
      if (deck.length <= DECK_MIN) return false;
      deck.splice(deck.indexOf(id), 1);
    } else {
      if (deck.length >= DECK_MAX) return false;
      deck.push(id);
    }
    this.save();
    return true;
  }
  forgeCard(id) {
    const recipe = FUSIONS[id];
    if (!recipe || this.data.completedRuns < 1 || this.data.forgedCards.includes(id) ||
        (recipe.after && !this.data.storyClears[recipe.after]) ||
        !recipe.ingredients.every((ingredient) => this.data.deck.includes(ingredient))) return false;
    this.data.forgedCards.push(id);
    this.data.deck = this.data.deck.filter((card) => !recipe.ingredients.includes(card));
    this.data.deck.push(id);
    for (const card of STARTER_CARDS)
      if (this.data.deck.length < DECK_MIN && !this.data.deck.includes(card)) this.data.deck.push(card);
    this.save();
    return true;
  }
  get healthPrice() {
    return shopHealthPrice(this.data.healthRank);
  }
  get startingHealth() {
    return 100 + 20 * this.data.healthRank;
  }
  buyHealth() {
    return this.buyUpgrade("health");
  }
  price(id) {
    const upgrade = PERMANENT_UPGRADES[id];
    return upgrade ? permanentPrice(id, this.data[upgrade.field]) : Infinity;
  }
  buyUpgrade(id) {
    const upgrade = PERMANENT_UPGRADES[id];
    const price = this.price(id);
    if (!upgrade || (upgrade.after && !this.data.storyClears[upgrade.after])) return false;
    if (!Number.isSafeInteger(price) || this.data.coins < price) return false;
    this.data.coins -= price;
    this.data[upgrade.field]++;
    this.save();
    return true;
  }
  buyBentoCard(id){
    const item=BENTO_CARDS[id];
    if(!item || !this.data.storyClears[item.after] || this.data.bentoCards.includes(id) || this.data.coins<item.price)return false;
    this.data.coins-=item.price;
    this.data.bentoCards.push(id);
    this.save();return true;
  }
}
