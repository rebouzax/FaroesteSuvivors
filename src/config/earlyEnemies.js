// Stage-exclusive creatures: anatomy and tactics are explicit, not aliases for dogs.
const rows = [
  ["mineSpider","Aranha das Galerias","mine","spider","orbit",30,12,3,3.1],
  ["mineSkull","Caveira de Carvão","mine","skull","ranged",26,13,1,2.2],
  ["blindCrawler","Rato Cego","mine","rat","charge",24,12,0,3.6],
  ["townZombie","Zumbi do Saloon","town","zombie","chase",58,18,3,2.3],
  ["townGhoul","Ghoul Foragido","town","ghoul","charge",43,20,2,3.5],
  ["headlessOutlaw","Pistoleiro sem Cabeça","town","headless","ranged",48,17,4,2.1],
  ["canyonViper","Víbora do Cânion","canyon","snake","charge",52,22,3,3.7],
  ["redScorpion","Escorpião Rubro","canyon","scorpion","orbit",64,23,7,2.8],
  ["ridgeWolf","Lobo das Escarpas","canyon","wolf","charge",60,24,4,3.9],
  ["graveSkeleton","Ossada do Cemitério","cemetery","skeleton","ranged",74,25,6,2],
  ["cryptSpider","Aranha da Cripta","cemetery","spider","orbit",68,27,5,3.4],
  ["deathWisp","Alma Enlutada","cemetery","ghost","ranged",58,26,2,2.8],
  ["graveZombie","Coveiro Reanimado","cemetery","zombie","chase",94,29,8,1.8],
];
export const EARLY_ENEMIES = Object.fromEntries(rows.map(([id,name,stage,anatomy,behavior,hp,damage,armor,speed],i)=>[id,{
  name,stage,anatomy,behavior,hp,damage,armor,speed,xp:18+i*2,
  weakness:behavior==="ranged"?"molotov":behavior==="charge"?"horseshoe":"lantern",
}]));
export const EARLY_GROUPS = {
  desert:["bat","dog","skeleton","vulture"],
  mine:["miner","mineSpider","mineSkull","blindCrawler"],
  town:["wraith","townZombie","townGhoul","headlessOutlaw"],
  canyon:["crow","canyonViper","redScorpion","ridgeWolf"],
  cemetery:["graveSkeleton","cryptSpider","deathWisp","graveZombie"],
};
