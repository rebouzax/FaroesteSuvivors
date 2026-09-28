export const SPECIAL_HEROES={
  clanker:{name:'Clanker',primary:'fireball',hp:145,damage:17,cooldown:1.4,range:18,speed:4.4,armor:6,pellets:4,pierce:2,icon:'⚙'},
};
export const HERO_MODELS={clanker:'clanker'};
export const MERCHANT_HEROES={};
export const SPECIAL_HERO_UNLOCKS={clanker:{stage:'forsakenRail',mission:'forsakenRail:4',boss:'clanker'}};
export const specialHeroUnlocked=(profile,id)=>{
  const rule=SPECIAL_HERO_UNLOCKS[id];
  return Boolean(rule&&profile.storyClears?.[rule.stage]&&
    profile.missionClears?.includes(rule.mission)&&
    profile.discoveries?.bosses?.includes(rule.boss));
};
