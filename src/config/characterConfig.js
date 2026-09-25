export const CHARACTERS = Object.freeze({
  joao: { name: "João Vaqueiro", primary: "whip", hp: 100, damage: 10, cooldown: 1.05, range: 5, speed: 5, armor: 1, magnet: 0.4, icon: "~" },
  maria: { name: "Maria Bonita", primary: "revolver", hp: 90, damage: 14, cooldown: 1.25, range: 19, speed: 5.25, crit: 0.12, icon: "✦" },
  indigo: { name: "Indigo", primary: "bow", hp: 105, damage: 17, cooldown: 1.55, range: 20, speed: 5.3, xp: 0.12, icon: "➶" },
  labuta: { name: "Labuta", primary: "shotgun", hp: 120, damage: 15, cooldown: 1.9, range: 13, speed: 4.2, armor: 3, pellets: 3, icon: "✹" },
  rosa: { name: "Rosa Trilhos", primary: "dual", hp: 85, damage: 11, cooldown: 1.42, range: 18, speed: 5.85, crit: 0.08, icon: "✦" },
  elias: { name: "Elias Ferro", primary: "rifle", hp: 110, damage: 21, cooldown: 2.05, range: 23, speed: 4.55, armor: 2, magnet: 0.6, icon: "➤" },
  silas: { name: "Silas Corvo", primary: "knives", hp: 80, damage: 9, cooldown: 0.78, range: 15, speed: 5.75, xp: 0.08, crit: 0.18, icon: "✧" },
  ada: { name: "Ada Morrow", primary: "crossbow", hp: 98, damage: 24, cooldown: 1.7, range: 21, speed: 4.8, armor: 2, xp: 0.08, icon: "➶" },
  ruth: { name: "Ruth Faísca", primary: "sawedoff", hp: 112, damage: 18, cooldown: 1.85, range: 12, speed: 4.75, armor: 2, pellets: 2, icon: "✹" },
  teo: { name: "Teo Carril", primary: "repeater", hp: 84, damage: 13, cooldown: 0.85, range: 21, speed: 5.5, crit: 0.14, magnet: 0.5, icon: "➤" },
});
export const CHARACTER_IDS = Object.keys(CHARACTERS);
