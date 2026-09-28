import { FRONTIER_CARDS, FRONTIER_ENEMIES, frontierCardStats } from "./frontierExpansion.js";
export const ABILITY_IDS = [...Object.keys(FRONTIER_CARDS), "pistol", "molotov", "heart", "horseshoe", "ghostShot", "requiem", "silverRain", "lantern", "soulHarvest", "boneStorm", "ironWill", "lastStand", "bulwark", "inferno", "silverStorm", "ironCharm", "deadeye", "bloodOath", "saltedRounds", "dustWaltz", "ironRosary", "blueTonic", "longshot", "bentoHourglass", "bentoLuckyStar", "bentoSaddle", "bentoMercyCoin", "bentoGhostLead", "windwardOath", "saloonTempest", "marshfire", "railbreaker", "crowstorm"];
export const abilityMaxLevel = id => id === 'doubleShot' ? 6 : 4;
ABILITY_IDS.push('doubleShot');
export const ABILITIES = {
  doubleShot: {name:'Disparo Duplicado',icon:'⇶',suit:'FERRO',color:'steel'},
  ...FRONTIER_CARDS,
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
  bulwark: { name: "Bastião de Ferro", icon: "⬟", suit: "DEFESA", color: "heart" },
  inferno: { name: "Fogo Profano", icon: "♨", suit: "FOGO", color: "fire" },
  silverStorm: { name: "Tempestade de Prata", icon: "✺", suit: "PRATA", color: "steel" },
  ironCharm: { name: "Amuleto do Bento", icon: "⬟", suit: "DEFESA", color: "heart" },
  deadeye: { name: "Olho de Chumbo", icon: "✦", suit: "FERRO", color: "steel" },
  bloodOath: { name: "Pacto da Fronteira", icon: "♥", suit: "VIDA", color: "heart" },
  saltedRounds: { name: "Cartuchos Salmourados", icon: "✦", suit: "FERRO", color: "steel" },
  dustWaltz: { name: "Valsa da Poeira", icon: "◌", suit: "VENTO", color: "fire" },
  ironRosary: { name: "Rosário de Ferro", icon: "⬟", suit: "DEFESA", color: "heart" },
  blueTonic: { name: "Tônico Azul", icon: "♥", suit: "VIDA", color: "heart" },
  longshot: { name: "Mira do Horizonte", icon: "➶", suit: "FERRO", color: "steel" },
  bentoHourglass: { name: "Ampulheta de Bento", icon: "⌛", suit: "MERCADOR", color: "steel" },
  bentoLuckyStar: { name: "Estrela da Sorte", icon: "✣", suit: "MERCADOR", color: "heart" },
  bentoSaddle: { name: "Sela do Relâmpago", icon: "➤", suit: "MERCADOR", color: "fire" },
  bentoMercyCoin: { name: "Moeda da Misericórdia", icon: "☥", suit: "MERCADOR", color: "heart" },
  bentoGhostLead: { name: "Chumbo Fantasma", icon: "✧", suit: "MERCADOR", color: "steel" },
  windwardOath: { name: "Juramento do Vendaval", icon: "◌", suit: "VENTO", color: "fire" },
  saloonTempest: { name: "Tempestade do Saloon", icon: "✺", suit: "FOGO", color: "steel" },
  marshfire: { name: "Fogo do Pântano", icon: "♨", suit: "MALDIÇÃO", color: "fire" },
  railbreaker: { name: "Quebra-Trilhos", icon: "➤", suit: "FERRO", color: "steel" },
  crowstorm: { name: "Nuvem de Corvos", icon: "✷", suit: "SOMBRA", color: "heart" },
};
export function abilityStats(id, level) {
  if(id==='doubleShot')return {count:Math.min(6,Math.max(0,level))};
  if (FRONTIER_CARDS[id]) return frontierCardStats(id, level);
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
  if (id === "soulHarvest") return { heal: Math.min(4,2 + extra) };
  if (id === "boneStorm") return { damage: 12 + 4*extra, count: Math.min(14,6+extra*2), cooldown: Math.max(2,5-extra*0.2) };
  if (id === "ironWill") return { armor: 3*level };
  if (id === "lastStand") return { attack: 0.2*level };
  if (id === "bulwark") return { armor: 2 * level, health: 10 * level };
  if (id === "inferno") return { damage: 4 * level, radius: 0.35 * level };
  if (id === "silverStorm") return { damage: 4 * level, count: 2 + level * 2 };
  if (id === "ironCharm") return { armor: 2 * level };
  if (id === "deadeye") return { damage: 4 * level };
  if (id === "bloodOath") return { health: 12 * level, heal: level };
  if (id === "saltedRounds") return { damage: 3 * level };
  if (id === "dustWaltz") return { speed: 0.06 * level };
  if (id === "ironRosary") return { armor: 2 * level };
  if (id === "blueTonic") return { health: 18 * level, heal: 12 * level };
  if (id === "longshot") return { range: 2 * level };
  if (id === "bentoHourglass") return { haste: 0.04 * level };
  if (id === "bentoLuckyStar") return { fortune: 0.1 * level };
  if (id === "bentoSaddle") return { speed: 0.05 * level };
  if (id === "bentoMercyCoin") return { heal: 3 * level };
  if (id === "bentoGhostLead") return { damage: 2 * level };
  if (id === "windwardOath") return { speed: 0.08 * level, armor: level };
  if (id === "saloonTempest") return { damage: 5 * level };
  if (id === "marshfire") return { damage: 3 * level, heal: level };
  if (id === "railbreaker") return { damage: 4 * level, range: 2 * level };
  if (id === "crowstorm") return { crit: 0.05 * level, speed: 0.04 * level };
  return { health: 20 };
}
export function cardDescription(id, nextLevel, attackRate = 1) {
  const stats = abilityStats(id, nextLevel);
  if(id==='doubleShot')return `+${stats.count} projéteis da arma principal por ataque, lançados em sequência (máximo +6). Não afeta golpes corpo a corpo.`;
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
  if (id === "bulwark") return `+2 de armadura e +10 de vida máxima por nível.`;
  if (id === "inferno") return `Fogo e lampião causam +${stats.damage} de dano/s; a área cresce.`;
  if (id === "silverStorm") return `+${stats.count} balas e +${stats.damage} de dano na chuva de prata.`;
  if (id === "ironCharm") return `+2 de armadura por nível; o amuleto rebate parte dos ataques.`;
  if (id === "deadeye") return `+4 de dano da arma principal por nível.`;
  if (id === "bloodOath") return `+12 de vida máxima e recuperação lenta por nível.`;
  return "+20 de vida máxima e recupera 20 de vida nesta partida.";
}
export const shopHealthPrice = (rank) => Math.ceil(25 * 1.55 ** rank);
import { EARLY_ENEMIES } from "./earlyEnemies.js";
export function enemyStats(type, minute) {
  const frontier = {
    ...FRONTIER_ENEMIES, ...EARLY_ENEMIES,
    bellRinger:{hp:86,damage:26,armor:6,speed:1.8,xp:38}, dustCoyote:{hp:58,damage:27,armor:3,speed:4.3,xp:34},
    lanternThief:{hp:77,damage:31,armor:5,speed:2.8,xp:40}, windmillWraith:{hp:105,damage:35,armor:9,speed:2.4,xp:48},
    mireLeech:{hp:116,damage:38,armor:8,speed:2.2,xp:52}, reedStalker:{hp:92,damage:41,armor:7,speed:3.1,xp:50},
    drownedProspector:{hp:142,damage:45,armor:13,speed:1.7,xp:58}, swampCrow:{hp:75,damage:35,armor:5,speed:4.4,xp:43},
    cardsharpGhoul:{hp:155,damage:48,armor:11,speed:2.8,xp:64}, barBanshee:{hp:130,damage:53,armor:9,speed:3.4,xp:65},
    whiskeyImp:{hp:118,damage:51,armor:7,speed:4.2,xp:61}, pianoCrawler:{hp:205,damage:58,armor:17,speed:1.45,xp:76},
    railWitch:{hp:220,damage:62,armor:17,speed:2.75,xp:82}, coalMimic:{hp:265,damage:65,armor:21,speed:1.7,xp:87},
    ironLocust:{hp:136,damage:59,armor:12,speed:4.5,xp:73}, graveRider:{hp:302,damage:71,armor:24,speed:3.2,xp:94},
    boneCactus:{hp:325,damage:77,armor:28,speed:1.3,xp:102}, sundownBandit:{hp:215,damage:72,armor:16,speed:3.4,xp:89},
    cinderHawk:{hp:166,damage:79,armor:13,speed:4.8,xp:96}, rattlesnake:{hp:184,damage:83,armor:15,speed:4.6,xp:104},
  };
  if(frontier[type]) {
    const base=frontier[type];
    return {hp:Math.round(base.hp*(1+minute*0.18)),damage:Math.round(base.damage*(1+minute*0.12)),armor:base.armor+Math.floor(minute/2),speed:base.speed+Math.min(1.3,minute*0.1),xp:base.xp};
  }
  const base =
    type === "dog"
      ? { hp: 35, damage: 14, armor: 2, speed: 3.5, xp: 20 }
      : type === "skeleton"
        ? { hp: 22, damage: 8, armor: 1, speed: 1.7, xp: 15 }
      : type === "wraith"
        ? { hp: 54, damage: 17, armor: 5, speed: 2.75, xp: 30 }
      : type === "crow"
        ? { hp: 27, damage: 12, armor: 2, speed: 3.7, xp: 16 }
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
