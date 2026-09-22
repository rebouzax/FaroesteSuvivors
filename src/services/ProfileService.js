export class ProfileService {
  constructor() {
    this.data = { coins: 0, sound: true, wind: true };
    this.available = true;
    try {
      const saved = JSON.parse(
        localStorage.getItem("faroeste:profile:v2") || "null",
      );
      if (saved) {
        if (Number.isSafeInteger(saved.coins) && saved.coins >= 0)
          this.data.coins = saved.coins;
        for (const key of ["wind", "sound"])
          if (typeof saved[key] === "boolean") this.data[key] = saved[key];
      } else {
        const old = JSON.parse(
          localStorage.getItem("faroeste-survivors:menu:v1") || "null",
        );
        if (typeof old?.wind === "boolean") this.data.wind = old.wind;
      }
    } catch {
      this.available = false;
    }
  }
  save() {
    try {
      localStorage.setItem("faroeste:profile:v2", JSON.stringify(this.data));
      this.available = true;
    } catch {
      this.available = false;
    }
  }
  credit(coins) {
    this.data.coins += coins;
    this.save();
  }
}
