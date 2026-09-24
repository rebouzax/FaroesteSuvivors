export const CONFIG = Object.freeze({
  duration: 900,
  intro: 6,
  mapHalf: 120,
  playerSpeed: 5,
  playerHp: 100,
  batHp: 10,
  batDamage: 10,
  whipDamage: 10,
  whipRange: 5,
  whipCooldown: 1.05,
  whipDuration: 0.38,
  xpPerBullet: 10,
  magnetRadius: 3.5,
  maxBats: 160,
  maxLoot: 1024,
});
// XP required within each level, not total lifetime XP: 100, 300, 600, 1000...
export const levelCost = (level) => (100 * level * (level + 1)) / 2;
