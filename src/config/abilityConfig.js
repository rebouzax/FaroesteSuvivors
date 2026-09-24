export const ABILITY_IDS = ["pistol", "molotov", "heart", "horseshoe", "ghostShot", "requiem", "silverRain", "lantern", "soulHarvest", "boneStorm", "ironWill", "lastStand"];
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
  horseshoe: { name: "Ferraduras Malditas", icon: "♧", suit: "SOMBRA", color: "steel" },
  ghostShot: { name: "Bala Fantasma", icon: "✧", suit: "ALMA", color: "steel" },
  requiem: { name: "Réquiem da Poeira", icon: "◎", suit: "VENTO", color: "fire" },
  silverRain: { name: "Chuva de Prata", icon: "✺", suit: "PRATA", color: "steel" },
  lantern: { name: "Lampião Maldito", icon: "♨", suit: "MALDIÇÃO", color: "fire" },
  soulHarvest: { name: "Colheita de Almas", icon: "☥", suit: "ALMA", color: "heart" },
  boneStorm: { name: "Estilhaços de Ossos", icon: "✷", suit: "OSSO", color: "steel" },
  ironWill: { name: "Vontade de Ferro", icon: "⬟", suit: "DEFESA", color: "heart" },
  lastStand: { name: "Último Disparo", icon: "♠", suit: "CORAGEM", color: "fire" },
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
  if (id === "horseshoe") return { damage: 8 + extra * 3, count: Math.min(6, 2 + Math.floor(extra / 2)), radius: 2.5 + Math.min(1.2, extra * 0.2) };
  if (id === "ghostShot") return { damage: 18 + extra * 5, cooldown: Math.max(1.2, 3.5 - extra * 0.2), pierce: Math.min(6, 2 + extra), range: 17 };
  if (id === "requiem") return { damage: 12 + extra * 4, cooldown: Math.max(2.5, 6 - extra * 0.3), radius: Math.min(7, 4.3 + extra * 0.35), push: 1.8 };
  if (id === "silverRain") return { damage: 9 + extra * 3, count: Math.min(14, 6 + extra * 2), cooldown: Math.max(2.2, 4 - extra * 0.18) };
  if (id === "lantern") return { damage: 4 + extra * 2, radius: Math.min(6, 3.2 + extra * 0.3) };
  if (id === "soulHarvest") return { heal: 2 + extra };
  if (id === "boneStorm") return { damage: 12 + 4*extra, count: Math.min(14,6+extra*2), cooldown: Math.max(2,5-extra*0.2) };
  if (id === "ironWill") return { armor: 3*level };
  if (id === "lastStand") return { attack: 0.2*level };
  return { health: 20 };
}
export function cardDescription(id, nextLevel, attackRate = 1) {
  const stats = abilityStats(id, nextLevel);
  if (id === "pistol")
    return `${stats.damage} de dano · um tiro a cada ${Math.max(0.15, stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "molotov")
    return `${stats.damage} de dano/s · fogo por ${stats.duration.toFixed(2)} s · arremesso a cada ${Math.max(0.7, stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "horseshoe") return `${stats.count} ferraduras giram ao redor de João · ${stats.damage} de dano por contato.`;
  if (id === "ghostShot") return `${stats.damage} de dano · atravessa ${stats.pierce} inimigos · a cada ${(stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "requiem") return `Onda de poeira de ${stats.radius.toFixed(1)} m · ${stats.damage} de dano e empurra inimigos · a cada ${(stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "silverRain") return `${stats.count} balas em círculo · ${stats.damage} de dano por projétil · a cada ${(stats.cooldown / attackRate).toFixed(2)} s.`;
  if (id === "lantern") return `A luz profana queima inimigos próximos: ${stats.damage} de dano/s até ${stats.radius.toFixed(1)} m.`;
  if (id === "soulHarvest") return `Recupera ${stats.heal} de vida ao abater um inimigo (até a vida máxima).`;
  if (id === "boneStorm") return `${stats.count} estilhaços em círculo · ${stats.damage} de dano · a cada ${(stats.cooldown/attackRate).toFixed(2)} s.`;
  if (id === "ironWill") return `+3 de armadura permanente nesta partida · total da carta: ${stats.armor}.`;
  if (id === "lastStand") return `Abaixo de 35% de vida: +${Math.round(stats.attack*100)}% de velocidade de ataque.`;
  return "+20 de vida máxima e recupera 20 de vida nesta partida.";
}
export const shopHealthPrice = (rank) => Math.ceil(25 * 1.55 ** rank);
export function enemyStats(type, minute) {
  const base =
    type === "dog"
      ? { hp: 35, damage: 14, armor: 2, speed: 3.5, xp: 20 }
      : type === "skeleton"
        ? { hp: 22, damage: 8, armor: 1, speed: 1.7, xp: 15 }
      : type === "miner"
        ? { hp: 42, damage: 12, armor: 1, speed: 2.9, xp: 25 }
      : { hp: 10, damage: 10, armor: 0, speed: 2.5, xp: 10 };
  return {
    hp: Math.round(base.hp * (1 + minute * 0.18)),
    damage: Math.round(base.damage * (1 + minute * 0.12)),
    armor: base.armor + Math.floor(minute / 2),
    speed: base.speed + Math.min(1.3, minute * 0.1),
    xp: base.xp,
  };
}
