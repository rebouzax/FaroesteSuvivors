import { FRONTIER_STAGES, FRONTIER_HERO_REWARDS, FRONTIER_CAMPAIGN, FRONTIER_ENEMIES, FRONTIER_GROUPS, FRONTIER_CARDS } from "./frontierExpansion.js";
import { EARLY_ENEMIES, EARLY_GROUPS } from "./earlyEnemies.js";
import { specialHeroUnlocked } from './specialHeroes.js';
// Time is measured in seconds of active play. Campaign difficulty rises by stage.
export const STAGE_ORDER = Object.freeze([
  "desert", "mine", "town", "canyon", "cemetery",
  "bellTown", "glassMarsh", "midnightSaloon", "forsakenRail", "crowFortress",
  ...Object.keys(FRONTIER_STAGES),
]);
export const HERO_REWARDS = Object.freeze({
  rosa:"desert", ada:"desert", elias:"mine", ruth:"mine", silas:"town", teo:"town",
  valeria:"bellTown", tomas:"glassMarsh", luzia:"midnightSaloon", benicio:"forsakenRail", ines:"crowFortress", ...FRONTIER_HERO_REWARDS,
  dynamite:"mine",
});
export const CAMPAIGN = Object.freeze({
  ...FRONTIER_CAMPAIGN,
  desert: {
    missions: [{at:45,kind:"bat",target:10,duration:120},{at:250,kind:"crate",target:2,duration:150},{at:500,kind:"skeleton",target:7,duration:150}],
    bosses: [
      {at:180,id:"giantBat",type:"boss",hp:3000,damage:21,armor:3,speed:1.55,xp:380,weakness:"requiem",counter:"joao",pattern:"pulse",flame:7},
      {at:360,id:"fireChupacabra",type:"boss",hp:5000,damage:27,armor:6,speed:1.65,xp:480,weakness:"molotov",counter:"labuta",pattern:"fireMark",flame:8},
      {at:660,id:"shadowMarshal",type:"marshal",hp:6800,damage:34,armor:11,speed:2.35,xp:650,weakness:"ghostShot",counter:"indigo",pattern:"volley",flame:9},
    ],
  },
  mine: {
    missions: [{at:80,kind:"mineSpider",target:8,duration:145},{at:325,kind:"crate",target:2,duration:155},{at:550,kind:"miner",target:8,duration:165}],
    bosses: [
      {at:300,id:"shovelMiner",type:"boss",hp:3500,damage:29,armor:10,speed:1.55,xp:450,weakness:"lantern",counter:"ada",pattern:"lunge",flame:9},
      {at:480,id:"giantMoth",type:"boss",hp:5000,damage:33,armor:6,speed:1.85,xp:560,weakness:"silverRain",counter:"maria",pattern:"dash",flame:10},
      {at:720,id:"minerGeneral",type:"marshal",hp:7300,damage:38,armor:16,speed:2.1,xp:730,weakness:"molotov",counter:"rosa",pattern:"summonMiner",flame:11},
    ],
  },
  town: {
    missions: [{at:75,kind:"townGhoul",target:9,duration:150},{at:350,kind:"townZombie",target:20,duration:145},{at:560,kind:"headlessOutlaw",target:10,duration:155},{at:760,kind:"crate",target:2,duration:110}],
    bosses: [
      {at:300,id:"boneHound",type:"boss",hp:6000,damage:35,armor:12,speed:1.65,xp:570,weakness:"boneStorm",counter:"ada",pattern:"lunge",flame:10},
      {at:490,id:"boneSinger",type:"boss",hp:8000,damage:41,armor:9,speed:1.85,xp:710,weakness:"requiem",counter:"joao",pattern:"summonSkeleton",flame:11},
      {at:720,id:"zombieDeputy",type:"marshal",hp:10000,damage:45,armor:18,speed:2.15,xp:850,weakness:"silverRain",counter:"rosa",pattern:"shotgun",flame:12},
    ],
  },
  canyon: {
    missions: [{at:60,kind:"crow",target:8,duration:140},{at:260,kind:"ridgeWolf",target:11,duration:165},{at:500,kind:"canyonViper",target:9,duration:170},{at:735,kind:"crate",target:2,duration:135}],
    bosses: [
      {at:240,id:"ashSerpent",type:"boss",hp:6600,damage:38,armor:14,speed:1.9,xp:650,weakness:"inferno",counter:"ada",pattern:"fireMark",flame:11},
      {at:480,id:"stormVulture",type:"boss",hp:9000,damage:42,armor:12,speed:2.35,xp:800,weakness:"silverRain",counter:"teo",pattern:"dash",flame:12},
      {at:720,id:"railRevenant",type:"marshal",hp:12500,damage:50,armor:21,speed:2.35,xp:950,weakness:"ghostShot",counter:"elias",pattern:"volley",flame:13},
    ],
  },
  cemetery: {
    missions: [{at:50,kind:"cryptSpider",target:9,duration:160},{at:230,kind:"graveSkeleton",target:11,duration:165},{at:420,kind:"deathWisp",target:11,duration:165},{at:600,kind:"crate",target:2,duration:155},{at:770,kind:"graveZombie",target:6,duration:110}],
    bosses: [
      {at:240,id:"cryptMother",type:"boss",hp:8400,damage:44,armor:17,speed:1.9,xp:730,weakness:"molotov",counter:"ruth",pattern:"summonMiner",flame:12},
      {at:500,id:"deadPreacher",type:"boss",hp:11500,damage:52,armor:20,speed:2.05,xp:910,weakness:"requiem",counter:"joao",pattern:"summonSkeleton",flame:13},
      {at:720,id:"lastConductor",type:"marshal",hp:15000,damage:60,armor:24,speed:2.45,xp:1200,weakness:"silverStorm",counter:"teo",pattern:"shotgun",flame:14},
    ],
  },
  bellTown: {
    missions: [{at:70,kind:"bellRinger",target:10,duration:145},{at:280,kind:"dustCoyote",target:12,duration:150},{at:520,kind:"lanternThief",target:9,duration:165},{at:700,kind:"crate",target:3,duration:145}],
    bosses: [
      {at:330,id:"bellTowerKeeper",type:"boss",hp:14500,damage:58,armor:23,speed:1.8,xp:1150,weakness:"silverRain",counter:"valeria",pattern:"pulse",flame:15},
      {at:720,id:"windmillWidow",type:"marshal",hp:20500,damage:67,armor:28,speed:2.35,xp:1550,weakness:"ghostShot",counter:"teo",pattern:"dash",flame:17},
    ],
  },
  glassMarsh: {
    missions: [{at:65,kind:"mireLeech",target:11,duration:145},{at:275,kind:"reedStalker",target:12,duration:155},{at:510,kind:"drownedProspector",target:10,duration:165},{at:715,kind:"swampCrow",target:12,duration:140}],
    bosses: [
      {at:330,id:"mudKing",type:"boss",hp:23500,damage:72,armor:29,speed:1.8,xp:1650,weakness:"lantern",counter:"luzia",pattern:"fireMark",flame:18},
      {at:720,id:"drownedBride",type:"marshal",hp:28500,damage:81,armor:32,speed:2.4,xp:1950,weakness:"requiem",counter:"ines",pattern:"volley",flame:19},
    ],
  },
  midnightSaloon: {
    missions: [{at:60,kind:"cardsharpGhoul",target:12,duration:145},{at:260,kind:"whiskeyImp",target:14,duration:150},{at:480,kind:"barBanshee",target:11,duration:165},{at:700,kind:"pianoCrawler",target:10,duration:155}],
    bosses: [
      {at:320,id:"bottleBaron",type:"boss",hp:32000,damage:88,armor:35,speed:1.9,xp:2250,weakness:"silverRain",counter:"maria",pattern:"shotgun",flame:21},
      {at:720,id:"damaMalvina",type:"marshal",hp:42500,damage:102,armor:39,speed:2.3,xp:3000,weakness:"inferno",counter:"luzia",pattern:"tornadoes",flame:23},
    ],
  },
  forsakenRail: {
    missions: [{at:55,kind:"railWitch",target:12,duration:145},{at:270,kind:"coalMimic",target:13,duration:150},{at:495,kind:"ironLocust",target:15,duration:160},{at:720,kind:"graveRider",target:12,duration:155}],
    bosses: [
      {at:330,id:"ironLocomotive",type:"boss",hp:46500,damage:110,armor:42,speed:2.0,xp:3250,weakness:"boneStorm",counter:"benicio",pattern:"lunge",flame:25},
      {at:530,id:"clanker",type:"boss",hp:49000,damage:105,armor:45,speed:1.7,xp:3500,weakness:"silverRain",counter:"ada",pattern:"crossfire",flame:25},
      {at:720,id:"railWitchQueen",type:"marshal",hp:56000,damage:121,armor:46,speed:2.55,xp:3900,weakness:"silverStorm",counter:"valeria",pattern:"summonSkeleton",flame:26},
    ],
  },
  crowFortress: {
    missions: [{at:55,kind:"boneCactus",target:13,duration:145},{at:260,kind:"sundownBandit",target:14,duration:150},{at:485,kind:"cinderHawk",target:13,duration:160},{at:700,kind:"rattlesnake",target:16,duration:150}],
    bosses: [
      {at:330,id:"boneCactusMatriarch",type:"boss",hp:61500,damage:128,armor:49,speed:2.05,xp:4400,weakness:"molotov",counter:"tomas",pattern:"fireMark",flame:28},
      {at:720,id:"crowKing",type:"marshal",hp:76000,damage:142,armor:53,speed:2.65,xp:5200,weakness:"ghostShot",counter:"ines",pattern:"tornadoes",flame:30},
    ],
  },
});
export const BOSS_IDS = Object.values(CAMPAIGN).flatMap((stage) => stage.bosses.map((boss) => boss.id));
export const ENEMY_IDS = Object.freeze([
  "bat","dog","vulture","skeleton","miner","wraith","crow",
  "bellRinger","dustCoyote","lanternThief","windmillWraith",
  "mireLeech","reedStalker","drownedProspector","swampCrow",
  "cardsharpGhoul","barBanshee","whiskeyImp","pianoCrawler",
  "railWitch","coalMimic","ironLocust","graveRider",
  "boneCactus","sundownBandit","cinderHawk","rattlesnake",
  ...Object.keys(FRONTIER_ENEMIES), ...Object.keys(EARLY_ENEMIES),
]);
export const ENEMY_STAGE_GROUPS = Object.freeze({
  ...FRONTIER_GROUPS, ...EARLY_GROUPS,
  bellTown:["bellRinger","dustCoyote","lanternThief","windmillWraith"],
  glassMarsh:["mireLeech","reedStalker","drownedProspector","swampCrow"],
  midnightSaloon:["cardsharpGhoul","barBanshee","whiskeyImp","pianoCrawler"],
  forsakenRail:["railWitch","coalMimic","ironLocust","graveRider"],
  crowFortress:["boneCactus","sundownBandit","cinderHawk","rattlesnake"],
});
export const GAMEPLAY_CARD_UNLOCKS = Object.freeze({
  ...Object.fromEntries(Object.entries(FRONTIER_CARDS).filter(([,s])=>s.after&&!s.price&&!s.ingredients).map(([id,s])=>[id,s.after])),
  requiem:"desert",
  saltedRounds:"bellTown", dustWaltz:"glassMarsh", ironRosary:"midnightSaloon",
  blueTonic:"forsakenRail", longshot:"crowFortress",
});
export const ENEMY_WEAKNESSES = Object.freeze({
  ...Object.fromEntries(Object.entries(EARLY_ENEMIES).map(([id,s])=>[id,s.weakness])),
  ...Object.fromEntries(Object.entries(FRONTIER_ENEMIES).map(([id,s])=>[id,s.weakness])),
  bat:"silverRain",dog:"horseshoe",vulture:"ghostShot",skeleton:"molotov",miner:"requiem",wraith:"lantern",crow:"silverRain",
  bellRinger:"ghostShot",dustCoyote:"horseshoe",lanternThief:"silverRain",windmillWraith:"lantern",
  mireLeech:"inferno",reedStalker:"molotov",drownedProspector:"requiem",swampCrow:"silverRain",
  cardsharpGhoul:"ghostShot",barBanshee:"lantern",whiskeyImp:"silverRain",pianoCrawler:"molotov",
  railWitch:"ghostShot",coalMimic:"requiem",ironLocust:"silverRain",graveRider:"horseshoe",
  boneCactus:"inferno",sundownBandit:"ghostShot",cinderHawk:"silverRain",rattlesnake:"requiem",
});
export const previousStage = (id) => STAGE_ORDER[STAGE_ORDER.indexOf(id)-1];
export const stageUnlocked = (profile,id) => id === "desert" || Boolean(profile.storyClears?.[previousStage(id)]);
export const MISSION_HERO_REWARDS = Object.freeze({ maria:"desert:1", labuta:"desert:2", indigo:"desert:3" });
export const MISSION_CARD_REWARDS = Object.freeze({
  pirateBomb:'glassMarsh:4',
  returningBlade:"saltFlats:1",
  ghostShot:"desert:1", ironWill:"desert:2", lantern:"desert:3",
  silverRain:"mine:1", soulHarvest:"mine:2", boneStorm:"town:1", lastStand:"town:2",
});
export const LEGACY_CARDS = Object.freeze(["pistol","molotov","heart","horseshoe","ghostShot","requiem","silverRain","lantern","soulHarvest","boneStorm","ironWill","lastStand"]);
export const missionId = (stage, index) => `${stage}:${index + 1}`;
export const MISSION_IDS = Object.freeze(Object.entries(CAMPAIGN).flatMap(([stage, spec]) => spec.missions.map((_, index) => missionId(stage, index))));
export const missionUnlocked = (profile, id) => MISSION_IDS.includes(id) &&
  (profile.missionClears?.includes(id) || Boolean(profile.storyClears?.[id.split(":")[0]]));
export const requirementMet = (profile, rule) => Boolean(rule) &&
  (!rule.after || Boolean(profile.storyClears?.[rule.after])) &&
  (!rule.mission || missionUnlocked(profile, rule.mission));
export const heroUnlocked = (profile,id) => id === "joao" ||
  specialHeroUnlocked(profile,id) ||
  Boolean(profile.legacyProgression && ["maria","indigo","labuta"].includes(id)) ||
  Boolean(MISSION_HERO_REWARDS[id] && missionUnlocked(profile, MISSION_HERO_REWARDS[id])) ||
  Boolean(HERO_REWARDS[id] && profile.storyClears?.[HERO_REWARDS[id]]);
export const unlockedGameplayCards = (profile) => Object.entries(GAMEPLAY_CARD_UNLOCKS)
  .filter(([,stage]) => profile.storyClears?.[stage]).map(([id])=>id)
  .concat(Object.entries(MISSION_CARD_REWARDS).filter(([,mission]) => missionUnlocked(profile, mission)).map(([id]) => id))
  .concat(profile.legacyProgression ? LEGACY_CARDS : []);
