import { shopHealthPrice } from "../config/abilityConfig.js";
import { PERMANENT_UPGRADES, permanentPrice } from "../config/shopConfig.js";
const KEY = "faroeste:profile:v2";
export class ProfileService {
  constructor(storage) {
    this.data = {
      coins: 0,
      sound: true,
      music: true,
      wind: true,
      healthRank: 0,
      attackRank: 0,
      movementRank: 0,
      primaryRank: 0,
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
        ])
          if (Number.isSafeInteger(saved[key]) && saved[key] >= 0)
            this.data[key] = saved[key];
        for (const key of ["wind", "sound", "music"])
          if (typeof saved[key] === "boolean") this.data[key] = saved[key];
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
    if (!upgrade) return false;
    if (!Number.isSafeInteger(price) || this.data.coins < price) return false;
    this.data.coins -= price;
    this.data[upgrade.field]++;
    this.save();
    return true;
  }
}
