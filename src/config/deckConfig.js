import { FRONTIER_CARDS } from "./frontierExpansion.js";
import { requirementMet } from "./campaignConfig.js";

export const FUSIONS = Object.freeze({
  ...Object.fromEntries(Object.entries(FRONTIER_CARDS).filter(([,s])=>s.ingredients).map(([id,{ingredients,after}])=>[id,{ingredients,after}])),
  bulwark: { ingredients: ["heart", "ironWill"], after: null, mission: "desert:2" },
  inferno: { ingredients: ["molotov", "lantern"], after: "mine" },
  silverStorm: { ingredients: ["pistol", "silverRain"], after: "town" },
  windwardOath: { ingredients: ["saltedRounds", "dustWaltz"], after: "glassMarsh" },
  saloonTempest: { ingredients: ["pistol", "ironRosary"], after: "midnightSaloon" },
  marshfire: { ingredients: ["molotov", "dustWaltz"], after: "glassMarsh" },
  railbreaker: { ingredients: ["ghostShot", "ironRosary"], after: "forsakenRail" },
  crowstorm: { ingredients: ["horseshoe", "requiem"], after: "crowFortress" },
});
export const BENTO_CARDS = Object.freeze({
  ...Object.fromEntries(Object.entries(FRONTIER_CARDS).filter(([,s])=>s.price).map(([id,{after,price}])=>[id,{after,price}])),
  ironCharm: {after:"desert",price:130},
  deadeye: {after:"mine",price:210},
  bloodOath: {after:"town",price:300},
  bentoHourglass: {after:"bellTown",price:360},
  bentoLuckyStar: {after:"glassMarsh",price:420},
  bentoSaddle: {after:"midnightSaloon",price:480},
  bentoMercyCoin: {after:"forsakenRail",price:540},
  bentoGhostLead: {after:"crowFortress",price:600},
});
export const STARTER_CARDS = Object.freeze(["pistol", "molotov", "heart", "horseshoe", "doubleShot"]);
export const STARTER_DECK = Object.freeze([...STARTER_CARDS]);
export const fusionUnlocked = (profile, id) => Boolean(FUSIONS[id]) &&
  (profile.forgedCards?.includes(id) || (id === "bulwark" && profile.legacyProgression) || requirementMet(profile, FUSIONS[id]));
export const DECK_MIN = 3;
export const DECK_MAX = 8;
