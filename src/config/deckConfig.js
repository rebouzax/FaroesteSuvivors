import { ABILITY_IDS } from "./abilityConfig.js";

export const FUSIONS = Object.freeze({
  bulwark: { ingredients: ["heart", "ironWill"], after: null },
  inferno: { ingredients: ["molotov", "lantern"], after: "mine" },
  silverStorm: { ingredients: ["pistol", "silverRain"], after: "town" },
});
export const BENTO_CARDS = Object.freeze({
  ironCharm: {after:"desert",price:130},
  deadeye: {after:"mine",price:210},
  bloodOath: {after:"town",price:300},
});
export const STARTER_CARDS = ABILITY_IDS.filter((id) => !FUSIONS[id] && !BENTO_CARDS[id]);
export const STARTER_DECK = STARTER_CARDS.slice(0, 8);
export const DECK_MIN = 3;
export const DECK_MAX = 8;
