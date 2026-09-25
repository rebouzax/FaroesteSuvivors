// Time is measured in seconds of active play. Each encounter has a unique profile.
export const STAGE_ORDER = Object.freeze(["desert", "mine", "town", "canyon", "cemetery"]);
export const HERO_REWARDS = Object.freeze({rosa:"desert",ada:"desert",elias:"mine",ruth:"mine",silas:"town",teo:"town"});
export const CAMPAIGN = Object.freeze({
  desert: {
    missions: [
      {at:45,kind:"bat",target:10,duration:120},
      {at:250,kind:"crate",target:2,duration:150},
      {at:500,kind:"skeleton",target:7,duration:150},
    ],
    bosses: [
      {at:180,id:"giantBat",type:"boss",hp:3000,damage:21,armor:3,speed:1.55,xp:380,weakness:"requiem",counter:"joao",pattern:"pulse",flame:7},
      {at:360,id:"fireChupacabra",type:"boss",hp:5000,damage:27,armor:6,speed:1.65,xp:480,weakness:"molotov",counter:"labuta",pattern:"fireMark",flame:8},
      {at:660,id:"shadowMarshal",type:"marshal",hp:6800,damage:34,armor:11,speed:2.35,xp:650,weakness:"ghostShot",counter:"indigo",pattern:"volley",flame:9},
    ],
  },
  mine: {
    missions: [
      {at:80,kind:"dog",target:8,duration:145},
      {at:325,kind:"crate",target:2,duration:155},
      {at:550,kind:"miner",target:8,duration:165},
    ],
    bosses: [
      {at:300,id:"shovelMiner",type:"boss",hp:3500,damage:29,armor:10,speed:1.55,xp:450,weakness:"lantern",counter:"ada",pattern:"lunge",flame:9},
      {at:480,id:"giantMoth",type:"boss",hp:5000,damage:33,armor:6,speed:1.85,xp:560,weakness:"silverRain",counter:"maria",pattern:"dash",flame:10},
      {at:720,id:"minerGeneral",type:"marshal",hp:7300,damage:38,armor:16,speed:2.1,xp:730,weakness:"molotov",counter:"rosa",pattern:"summonMiner",flame:11},
    ],
  },
  town: {
    missions: [
      {at:75,kind:"dog",target:9,duration:150},
      {at:350,kind:"bat",target:20,duration:145},
      {at:560,kind:"skeleton",target:10,duration:155},
      {at:760,kind:"crate",target:2,duration:110},
    ],
    bosses: [
      {at:300,id:"boneHound",type:"boss",hp:6000,damage:35,armor:12,speed:1.65,xp:570,weakness:"boneStorm",counter:"ada",pattern:"lunge",flame:10},
      {at:490,id:"boneSinger",type:"boss",hp:8000,damage:41,armor:9,speed:1.85,xp:710,weakness:"requiem",counter:"joao",pattern:"summonSkeleton",flame:11},
      {at:720,id:"zombieDeputy",type:"marshal",hp:10000,damage:45,armor:18,speed:2.15,xp:850,weakness:"silverRain",counter:"rosa",pattern:"shotgun",flame:12},
    ],
  },
  canyon: {
    missions: [
      {at:60,kind:"vulture",target:8,duration:140},
      {at:260,kind:"dog",target:11,duration:165},
      {at:500,kind:"wraith",target:9,duration:170},
      {at:735,kind:"crate",target:2,duration:135},
    ],
    bosses: [
      {at:240,id:"ashSerpent",type:"boss",hp:6600,damage:38,armor:14,speed:1.9,xp:650,weakness:"inferno",counter:"ada",pattern:"fireMark",flame:11},
      {at:480,id:"stormVulture",type:"boss",hp:9000,damage:42,armor:12,speed:2.35,xp:800,weakness:"silverRain",counter:"teo",pattern:"dash",flame:12},
      {at:720,id:"railRevenant",type:"marshal",hp:12500,damage:50,armor:21,speed:2.35,xp:950,weakness:"ghostShot",counter:"elias",pattern:"volley",flame:13},
    ],
  },
  cemetery: {
    missions: [
      {at:50,kind:"crow",target:9,duration:160},
      {at:230,kind:"skeleton",target:11,duration:165},
      {at:420,kind:"wraith",target:11,duration:165},
      {at:600,kind:"crate",target:2,duration:155},
      {at:770,kind:"miner",target:6,duration:110},
    ],
    bosses: [
      {at:240,id:"cryptMother",type:"boss",hp:8400,damage:44,armor:17,speed:1.9,xp:730,weakness:"molotov",counter:"ruth",pattern:"summonMiner",flame:12},
      {at:500,id:"deadPreacher",type:"boss",hp:11500,damage:52,armor:20,speed:2.05,xp:910,weakness:"requiem",counter:"joao",pattern:"summonSkeleton",flame:13},
      {at:720,id:"lastConductor",type:"marshal",hp:15000,damage:60,armor:24,speed:2.45,xp:1200,weakness:"silverStorm",counter:"teo",pattern:"shotgun",flame:14},
    ],
  },
});
export const BOSS_IDS = Object.values(CAMPAIGN).flatMap((stage) => stage.bosses.map((boss) => boss.id));
export const ENEMY_IDS = Object.freeze(["bat","dog","vulture","skeleton","miner","wraith","crow"]);
export const previousStage = (id) => STAGE_ORDER[STAGE_ORDER.indexOf(id)-1];
export const stageUnlocked = (profile,id) => id === "desert" || Boolean(profile.storyClears?.[previousStage(id)]);
export const heroUnlocked = (profile,id) => !HERO_REWARDS[id] || Boolean(profile.storyClears?.[HERO_REWARDS[id]]);
