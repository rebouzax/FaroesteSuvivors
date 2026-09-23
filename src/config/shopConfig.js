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
    description: "+2 de dano base à arma principal por compra. João: chicote.",
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
};
export const permanentPrice = (id, rank) =>
  Math.ceil((PERMANENT_UPGRADES[id]?.base ?? Infinity) * 1.55 ** rank);
export const temporaryPrice = (purchases) => Math.ceil(8 * 1.6 ** purchases);
export const MERCHANT_WINDOWS = [
  [100, 180],
  [420, 600],
];
