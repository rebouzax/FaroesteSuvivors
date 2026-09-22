export const ABILITY_IDS = ["pistol", "molotov", "heart"];
export const ABILITIES = {
  pistol: {
    name: "Pistola do Sertão",
    icon: "✦",
    suit: "FERRO",
    color: "steel",
  },
  molotov: { name: "Coquetel Molotov", icon: "♨", suit: "FOGO", color: "fire" },
  heart: {
    name: "Coração de Vaqueiro",
    icon: "♥",
    suit: "VIDA",
    color: "heart",
  },
};
export function abilityStats(id, level) {
  const extra = Math.max(0, level - 1);
  if (id === "pistol")
    return {
      damage: 15 + 5 * extra,
      cooldown: Math.max(0.65, 1.7 - 0.08 * extra),
      range: 18,
    };
  if (id === "molotov")
    return {
      damage: 10 + 3 * extra,
      cooldown: Math.max(3, 5 - 0.15 * extra),
      duration: Math.min(6, 4 + 0.25 * extra),
      radius: Math.min(4, 2.8 + 0.15 * extra),
      range: 12,
    };
  return { health: 20 };
}
export function cardDescription(id, nextLevel) {
  const stats = abilityStats(id, nextLevel);
  if (id === "pistol")
    return `${stats.damage} de dano · um tiro a cada ${stats.cooldown.toFixed(2)} s.`;
  if (id === "molotov")
    return `${stats.damage} de dano/s · fogo por ${stats.duration.toFixed(2)} s · arremesso a cada ${stats.cooldown.toFixed(2)} s.`;
  return "+20 de vida máxima e recupera 20 de vida nesta partida.";
}
export const shopHealthPrice = (rank) => Math.ceil(25 * 1.55 ** rank);
export function enemyStats(type, minute) {
  const base =
    type === "dog"
      ? { hp: 35, damage: 14, armor: 2, speed: 3.5, xp: 20 }
      : { hp: 10, damage: 10, armor: 0, speed: 2.5, xp: 10 };
  return {
    hp: Math.round(base.hp * (1 + minute * 0.18)),
    damage: Math.round(base.damage * (1 + minute * 0.12)),
    armor: base.armor + Math.floor(minute / 2),
    speed: base.speed + Math.min(1.3, minute * 0.1),
    xp: base.xp,
  };
}
