export const SPECIAL_HEROES={
  clanker:{name:'Clanker',primary:'scrap',hp:145,damage:17,cooldown:1.4,range:18,speed:4.4,armor:6,pellets:4,pierce:2,icon:'⚙'},
  viking:{name:'Viking Errante',primary:'axe',hp:125,damage:30,cooldown:1.45,range:17,speed:4.8,armor:3,pierce:3,icon:'⚒'},
  centurion:{name:'Centurião de Ferro',primary:'sword',hp:115,damage:33,cooldown:1.1,range:3.2,speed:4.6,armor:10,icon:'⚔'},
  pirate:{name:'Capitão Pavio',primary:'sword',hp:100,damage:26,cooldown:.85,range:3,speed:5.35,armor:2,startingCard:'pirateBomb',icon:'☠'},
};
export const HERO_MODELS={clanker:'clanker',viking:'viking-1',centurion:'centuriao-romano',pirate:'pirata'};
export const MERCHANT_HEROES={viking:{price:850,after:'mine'},centurion:{price:1250,after:'canyon'}};
export const SPECIAL_HERO_UNLOCKS={clanker:{boss:'clanker'},pirate:{missions:['town:4','glassMarsh:4']}};
export const specialHeroUnlocked=(profile,id)=>Boolean(
  MERCHANT_HEROES[id]&&profile.ownedHeroes?.includes(id)||
  SPECIAL_HERO_UNLOCKS[id]?.boss&&profile.discoveries?.bosses?.includes(SPECIAL_HERO_UNLOCKS[id].boss)||
  SPECIAL_HERO_UNLOCKS[id]?.missions?.every(mission=>profile.missionClears?.includes(mission))
);
