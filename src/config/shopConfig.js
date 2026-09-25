export const PERMANENT_UPGRADES = {
  health: {
    name: "Coração de Vaqueiro",
    icon: "♥",
    field: "healthRank",
    base: 25,
    description: "+20 de vida inicial por compra.",
  },
  attack: {
    name: "Mãos Ligeiras",
    icon: "⚡",
    field: "attackRank",
    base: 35,
    description: "+8% de velocidade de ataque por compra (todas as armas).",
  },
  movement: {
    name: "Passo do Sertão",
    icon: "➤",
    field: "movementRank",
    base: 30,
    description: "+5% de velocidade de movimento por compra.",
  },
  primary: {
    name: "Couro e Aço",
    icon: "~",
    field: "primaryRank",
    base: 40,
    description: "+2 de dano base à arma principal do campeão por compra.",
  },
  armor: {
    name: "Couro Reforçado",
    icon: "⬟",
    field: "armorRank",
    base: 45,
    description: "+2 de armadura inicial por compra. Reduz dano sofrido.",
  },
  magnet: {
    name: "Ímã do Garimpo",
    icon: "◉",
    field: "magnetRank",
    base: 38,
    description: "+0,7 unidade ao raio de atração de XP e moedas por compra.",
  },
  fortune: {
    name: "Sorte de Garimpeiro", icon: "✣", field: "crateLuckRank", base: 55,
    description: "+4 pontos percentuais na chance de bandagem das caixas por compra.",
  },
  learning: {
    name: "Lenda Aprendiz", icon: "★", field: "xpRank", base: 50,
    description: "+5% de experiência coletada por compra.",
  },
  sharpshooter: { name:"Mira de Bento",icon:"✦",field:"critRank",base:95,after:"mine",description:"+2,5% de chance crítica por compra." },
  bounty: { name:"Bolsa do Caçador",icon:"◈",field:"bountyRank",base:110,after:"town",description:"+8% de moedas coletadas por compra." },
};
export const permanentPrice = (id, rank) =>
  rank>=8?Infinity:Math.ceil((PERMANENT_UPGRADES[id]?.base ?? Infinity) * 1.65 ** rank);
export const temporaryPrice = (purchases) => Math.ceil(8 * 1.6 ** purchases);
export const MERCHANT_WINDOWS = [
  [100, 180],
  [420, 600],
];
