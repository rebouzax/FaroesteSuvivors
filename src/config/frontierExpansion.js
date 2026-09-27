// Original frontier content. Small procedural assets share geometry, never progression.
export const FRONTIER_HEROES = {
  jacinto:{name:"Jacinto Escama",primary:"boomerang",hp:106,damage:26,cooldown:1.65,range:13,speed:5.6,armor:2,pierce:99,icon:"⌁"},
  aurora:{name:"Aurora Salina",primary:"crossbow",hp:96,damage:29,cooldown:1.5,range:23,speed:5.25,pierce:3,icon:"➶"},
  gaspar:{name:"Gaspar Caldeira",primary:"shotgun",hp:140,damage:19,cooldown:1.85,range:14,speed:4.4,armor:4,pellets:4,icon:"✹"},
  celeste:{name:"Celeste do Eclipse",primary:"lantern",hp:112,damage:23,cooldown:1.05,range:20,speed:5.35,xp:.15,icon:"♨"},
  severino:{name:"Severino Ferrão",primary:"knives",hp:92,damage:17,cooldown:.75,range:18,speed:5.9,crit:.2,pellets:2,icon:"✧"},
  amara:{name:"Amara Alvorada",primary:"repeater",hp:118,damage:26,cooldown:.9,range:24,speed:5.2,armor:2,pierce:2,icon:"➤"},
};

// stage, name, environment, palette, description
export const FRONTIER_STAGES = {
  saltFlats:{name:"Salinas do Esquecimento",ground:0xa5a4ab,sky:0x263a55,fog:0x637887,warm:0xf0d7ab,ambient:0xb9d7dd,description:"Cristais de sal, miragens e ossadas sob uma lua fria."},
  emberFoundry:{name:"Fundição das Almas",ground:0x514443,sky:0x361f29,fog:0x553735,warm:0xff9954,ambient:0xc69483,description:"Fornos acesos e autômatos guardam o ferro dos mortos."},
  moonMonastery:{name:"Mosteiro do Eclipse",ground:0x676879,sky:0x242439,fog:0x41425b,warm:0xabbff5,ambient:0xa4a5cf,description:"Arcos lunares e sinos mudos cercam um observatório profano."},
  thornGarden:{name:"Jardim dos Espinhos",ground:0x596254,sky:0x293c39,fog:0x3f5850,warm:0xd5c287,ambient:0xadc7a4,description:"Raízes gigantes e flores carnívoras tomaram a antiga fazenda."},
  lastDawn:{name:"Portal da Última Aurora",ground:0x686075,sky:0x392940,fog:0x634657,warm:0xffc594,ambient:0xceabc7,description:"Cinco obeliscos sustentam a passagem que alimenta a maldição."},
};

// Each roster includes distinct movement roles. One source drives stats, art and bestiary.
const rosters = {
  saltFlats:[
    ["saltScorpion","Escorpião de Sal","dog","charge"], ["mirageGunner","Atirador de Miragem","marshal","ranged"],
    ["glassMoth","Mariposa de Cristal","bat","orbit"], ["brineMiner","Garimpeiro da Salmoura","miner","chase"],
    ["saltWidow","Viúva Salina","skeleton","ranged"], ["bleachedJackal","Chacal Desbotado","dog","charge"],
    ["crystalWisp","Fagulha de Cristal","vulture","orbit"],
  ],
  emberFoundry:[
    ["slagHound","Cão de Escória","dog","charge"], ["furnaceKeeper","Vigia da Fornalha","miner","ranged"],
    ["rivetImp","Diabrete de Rebites","skeleton","orbit"], ["copperHornet","Vespa de Cobre","bat","charge"],
    ["chainWorker","Operário Acorrentado","miner","chase"], ["ashWelder","Soldador de Cinzas","marshal","ranged"],
    ["bellowsBat","Morcego de Fole","vulture","orbit"],
  ],
  moonMonastery:[
    ["moonAcolyte","Acólito Lunar","skeleton","ranged"], ["eclipseOwl","Coruja do Eclipse","vulture","orbit"],
    ["waxPenitent","Penitente de Cera","miner","chase"], ["scriptureWraith","Espectro das Escrituras","marshal","ranged"],
    ["silverLynx","Lince de Prata","dog","charge"], ["candleMoth","Mariposa das Velas","bat","orbit"],
    ["astralMonk","Monge Astral","skeleton","charge"],
  ],
  thornGarden:[
    ["thornBoar","Javali de Espinhos","dog","charge"], ["rootSentinel","Sentinela de Raízes","miner","chase"],
    ["venomBloom","Flor Peçonhenta","skeleton","ranged"], ["brambleCrow","Corvo das Sarças","vulture","orbit"],
    ["orchardReaper","Ceifador do Pomar","marshal","ranged"], ["sapCrawler","Rastejante de Seiva","dog","orbit"],
  ],
  lastDawn:[
    ["dawnExile","Exilado da Aurora","marshal","ranged"], ["riftHound","Cão da Fenda","dog","charge"],
    ["voidVulture","Abutre do Vazio","vulture","orbit"], ["obeliskGuard","Guarda do Obelisco","miner","chase"],
    ["sunlessGunslinger","Pistoleiro sem Sol","skeleton","ranged"], ["cinderSeraph","Serafim de Brasas","bat","charge"],
  ],
};
export const FRONTIER_GROUPS = Object.fromEntries(Object.entries(rosters).map(([stage,rows])=>[stage,rows.map(row=>row[0])]));
export const FRONTIER_ENEMIES = Object.fromEntries(Object.entries(rosters).flatMap(([stage,rows],tier)=>rows.map(([id,name,shape,behavior],index)=>[id,{
  name,stage,shape,behavior,color:[0xb8cbd0,0xd08a5c,0xaba2d8,0x91b376,0xd6a2bd][tier],
  weakness:["ghostShot","requiem","silverRain","molotov"][index%4],
  hp:210+tier*24+(behavior==="chase"?110:index*8),damage:55+tier*5+index,armor:12+tier*2,
  speed:behavior==="charge"?3.2:behavior==="orbit"?3.5:behavior==="ranged"?2.3:1.7,xp:85+tier*10+index*2,
}])));

const bossRows = [
  ["saltFlats","saltColossus","Colosso de Sal","miner","ringGap","requiem","jacinto"],
  ["saltFlats","mirageQueen","Rainha das Miragens","marshal","crossfire","ghostShot","ines"],
  ["emberFoundry","furnaceBull","Touro da Fornalha","dog","lunge","molotov","aurora"],
  ["emberFoundry","chainForeman","Mestre das Correntes","miner","ringGap","silverRain","benicio"],
  ["moonMonastery","eclipseAbbot","Abade do Eclipse","skeleton","crossfire","lantern","gaspar"],
  ["moonMonastery","moonDevourer","Devorador da Lua","vulture","tornadoes","boneStorm","luzia"],
  ["thornGarden","briarMatriarch","Matriarca das Sarças","miner","fireMark","molotov","celeste"],
  ["thornGarden","venomStag","Cervo Peçonhento","dog","dash","ghostShot","severino"],
  ["lastDawn","hollowSeraph","Serafim Oco","vulture","ringGap","silverRain","amara"],
  ["lastDawn","lastEclipse","O Último Eclipse","marshal","crossfire","requiem","jacinto"],
];
export const FRONTIER_BOSSES = Object.fromEntries(bossRows.map(([stage,id,name,shape,pattern,weakness,counter],i)=>[id,{
  stage,name,shape,pattern,weakness,counter,at:i%2?690:310,type:i%2?"marshal":"boss",
  // A bounded health plateau instead of exponentially extending v0.8's curve.
  hp:18000+Math.floor(i/2)*1800+(i%2)*6000,damage:62+Math.floor(i/2)*6,armor:18+Math.floor(i/2)*2,
  speed:1.65+(i%2)*.35,xp:2400+i*170,flame:15+Math.floor(i/2),id,
}]));
export const FRONTIER_CAMPAIGN = Object.fromEntries(Object.entries(FRONTIER_GROUPS).map(([stage,ids])=>[stage,{
  missions:[{at:55,kind:ids[0],target:7,duration:170},{at:245,kind:ids[1],target:7,duration:175},{at:465,kind:ids[2],target:8,duration:180},{at:665,kind:"crate",target:2,duration:180}],
  bosses:Object.values(FRONTIER_BOSSES).filter(b=>b.stage===stage),
}]));
export const FRONTIER_HERO_REWARDS = {jacinto:"crowFortress",aurora:"saltFlats",gaspar:"emberFoundry",celeste:"moonMonastery",severino:"thornGarden",amara:"lastDawn"};

// Stats are per rank. Apply increments once on acquisition, regardless of source.
export const FRONTIER_CARDS = {
  saltWard:{name:"Pele de Sal",suit:"DEFESA",color:"heart",icon:"⬟",stats:{armor:2,health:8},after:"saltFlats",description:"+{armor} de armadura e +{health} de vida máxima."},
  emberHeart:{name:"Coração da Fornalha",suit:"FOGO",color:"fire",icon:"♨",stats:{damage:5,health:6},after:"emberFoundry",description:"+{damage} de dano principal e +{health} de vida máxima."},
  moonLens:{name:"Lente Lunar",suit:"PRATA",color:"steel",icon:"✧",stats:{range:2,crit:.04},after:"moonMonastery",description:"+{range} m de alcance e +{critPercent}% de crítico."},
  thornMail:{name:"Cota de Espinhos",suit:"DEFESA",color:"heart",icon:"✷",stats:{armor:3,damage:2},after:"thornGarden",description:"+{armor} de armadura e +{damage} de dano principal."},
  dawnSeal:{name:"Selo da Aurora",suit:"ALMA",color:"fire",icon:"✺",stats:{haste:.05,damage:4},after:"lastDawn",description:"+{haste}% de velocidade de ataque e +{damage} de dano principal."},
  returningBlade:{name:"Lâmina Retornante",suit:"FERRO",color:"steel",icon:"⌁",active:true,mission:"saltFlats:1",description:"Bumerangue: {damage} de dano por passagem, a cada {cooldown} s. Atravessa alvos na ida e na volta."},
  bentoSaltCompass:{name:"Bússola de Sal",suit:"MERCADOR",color:"steel",icon:"✣",stats:{magnet:.7,range:1},after:"saltFlats",price:650,description:"+{magnet} m de coleta e +{range} m de alcance."},
  bentoFurnaceBadge:{name:"Insígnia da Fornalha",suit:"MERCADOR",color:"fire",icon:"⬟",stats:{armor:2,haste:.04},after:"emberFoundry",price:700,description:"+{armor} de armadura e +{haste}% de velocidade de ataque."},
  bentoMoonDial:{name:"Relógio Lunar",suit:"MERCADOR",color:"steel",icon:"⌛",stats:{haste:.06,range:1},after:"moonMonastery",price:750,description:"+{haste}% de velocidade de ataque e +{range} m de alcance."},
  bentoRootFlask:{name:"Cantil de Seiva",suit:"MERCADOR",color:"heart",icon:"♥",stats:{health:14,regen:1},after:"thornGarden",price:800,description:"+{health} de vida máxima e +{regen} de regeneração por ciclo."},
  bentoDawnCoin:{name:"Moeda do Amanhecer",suit:"MERCADOR",color:"fire",icon:"✣",stats:{fortune:.08,damage:4},after:"lastDawn",price:850,description:"+{fortune}% de ouro e experiência e +{damage} de dano principal."},
  saltBastion:{name:"Bastião de Cristal",suit:"DEFESA",color:"heart",icon:"⬟",stats:{armor:4,health:12},after:"saltFlats",ingredients:["saltWard","ironWill"],description:"+{armor} de armadura e +{health} de vida máxima."},
  furnaceOath:{name:"Juramento da Fornalha",suit:"FOGO",color:"fire",icon:"♨",stats:{damage:7,haste:.03},after:"emberFoundry",ingredients:["emberHeart","saltedRounds"],description:"+{damage} de dano principal e +{haste}% de velocidade de ataque."},
  lunarReturn:{name:"Retorno Lunar",suit:"PRATA",color:"steel",icon:"⌁",active:true,after:"moonMonastery",ingredients:["returningBlade","moonLens"],description:"Bumerangue lunar: {damage} de dano por passagem, a cada {cooldown} s; atravessa todos os alvos."},
  livingBriar:{name:"Sarça Viva",suit:"VIDA",color:"heart",icon:"♥",stats:{armor:2,regen:2},after:"thornGarden",ingredients:["thornMail","blueTonic"],description:"+{armor} de armadura e +{regen} de regeneração por ciclo."},
  dawnTempest:{name:"Tempestade da Aurora",suit:"ALMA",color:"fire",icon:"✺",stats:{damage:6,crit:.06,speed:.04},after:"lastDawn",ingredients:["dawnSeal","requiem"],description:"+{damage} de dano principal, +{critPercent}% de crítico e +{speed}% de movimento."},
};

// Grow the release catalog from reusable, balanced stat families instead of
// placeholder cards. Every generated card has a stage gate, localized title,
// icon glyph, gameplay stats, and a real fusion recipe where applicable.
const cardStages=["desert","mine","town","canyon","cemetery","bellTown","glassMarsh","midnightSaloon","forsakenRail","crowFortress","saltFlats","emberFoundry","moonMonastery","thornGarden","lastDawn"];
const statFamilies=[
  {damage:2.4,range:.7},{health:9,armor:.45},{haste:.026,crit:.012},
  {speed:.035,magnet:.35},{regen:.7,health:6},{fortune:.045,magnet:.2},
  {damage:1.4,armor:.6},{range:1.1,crit:.018},{haste:.018,regen:.45},
  {speed:.025,fortune:.025},
];
const statSteps={damage:.1,health:.5,armor:.05,range:.1,haste:.001,crit:.001,speed:.001,magnet:.05,fortune:.001,regen:.05,heal:.5};
const cardWords={
  pt:{prefixes:["Selo","Cartucho","Amuleto","Relíquia","Voto","Totem","Marca","Runa","Medalhão","Lâmina","Sigilo","Tônico","Broche","Talismã","Emblema","Fetiche","Encanto","Rosário","Cantil","Fivela","Pena","Olho","Coração","Brasa","Espora","Estrela","Lacre","Cálice","Placa","Compasso"],suffixes:["da Lua","de Prata","do Trovão","das Cinzas","da Fronteira","de Sal","do Corvo","do Deserto","da Fornalha","do Eclipse","das Sarças","da Aurora","do Pântano","da Ferrovia","da Meia-Noite","do Coiote","do Abismo","do Vendaval","dos Ossos","da Miragem","do Xerife","do Vaqueiro","do Garimpo","do Carrasco","do Relâmpago","da Névoa","do Peregrino","da Vigília","da Salvação","do Crepúsculo"]},
  en:{prefixes:["Seal","Round","Charm","Relic","Oath","Totem","Mark","Rune","Medallion","Blade","Sigil","Tonic","Brooch","Talisman","Emblem","Fetish","Hex","Rosary","Canteen","Buckle","Feather","Eye","Heart","Ember","Spur","Star","Locket","Chalice","Plate","Compass"],suffixes:["of the Moon","of Silver","of Thunder","of Ash","of the Frontier","of Salt","of the Crow","of the Desert","of the Furnace","of Eclipse","of Briars","of Dawn","of the Marsh","of the Railway","of Midnight","of the Coyote","of the Abyss","of the Gale","of Bones","of the Mirage","of the Sheriff","of the Cowboy","of the Prospector","of the Hangman","of Lightning","of Mist","of the Pilgrim","of Vigil","of Mercy","of Dusk"]},
  es:{prefixes:["Sello","Cartucho","Amuleto","Reliquia","Voto","Tótem","Marca","Runa","Medallón","Hoja","Sigilo","Tónico","Broche","Talismán","Emblema","Fetiche","Hechizo","Rosario","Cantimplora","Hebilla","Pluma","Ojo","Corazón","Ascua","Espuela","Estrella","Relicario","Cáliz","Placa","Brújula"],suffixes:["de la Luna","de Plata","del Trueno","de Ceniza","de la Frontera","de Sal","del Cuervo","del Desierto","del Horno","del Eclipse","de Zarzas","del Alba","del Pantano","del Ferrocarril","de Medianoche","del Coyote","del Abismo","del Vendaval","de Huesos","del Espejismo","del Alguacil","del Vaquero","del Minero","del Verdugo","del Relámpago","de la Niebla","del Peregrino","de la Vigilia","de la Piedad","del Ocaso"]},
};
const statLabels={
  pt:{damage:"dano principal",health:"vida máxima",armor:"armadura",range:"alcance (m)",haste:"velocidade de ataque (%)",critPercent:"acerto crítico (%)",speed:"movimento (%)",magnet:"atração de itens (m)",fortune:"ouro e XP (%)",regen:"regeneração",heal:"cura imediata"},
  en:{damage:"weapon damage",health:"maximum health",armor:"armor",range:"weapon range (m)",haste:"attack speed (%)",critPercent:"critical chance (%)",speed:"movement (%)",magnet:"pickup radius (m)",fortune:"gold and XP (%)",regen:"regeneration",heal:"instant healing"},
  es:{damage:"daño del arma",health:"vida máxima",armor:"armadura",range:"alcance del arma (m)",haste:"velocidad de ataque (%)",critPercent:"probabilidad crítica (%)",speed:"movimiento (%)",magnet:"radio de objetos (m)",fortune:"oro y XP (%)",regen:"regeneración",heal:"curación inmediata"},
};
const cardGlyphs=["✦","⬟","♨","✧","✷","✺","⌁","♥","➶","◎","☥","✣"];
function roundStat(value,key){const step=statSteps[key]||.01;return Number((Math.round(value/step)*step).toFixed(3));}
function cardStats(index,scale=1){
  const primary=statFamilies[index%statFamilies.length],secondary=statFamilies[(index*7+3)%statFamilies.length];
  const strength=scale*(.82+(index%6)*.075),stats={};
  for(const [family,weight] of [[primary,1],[secondary,.42]])for(const [key,value] of Object.entries(family))
    stats[key]=roundStat((stats[key]||0)+value*strength*weight,key);
  return stats;
}
function localizedName(index){
  return Object.fromEntries(Object.entries(cardWords).map(([language,words])=>[
    language,`${words.prefixes[index%30]} ${words.suffixes[Math.floor(index/30)%30]}`,
  ]));
}
function localizedDescription(stats){
  return Object.fromEntries(Object.entries(statLabels).map(([language,labels])=>[
    language,Object.keys(stats).map(key=>`+{${key==="crit"?"critPercent":key}} ${labels[key==="crit"?"critPercent":key]}`).join(" · "),
  ]));
}
function createCatalogCard(id,index,{price,after,ingredients,merchant=false,stats}={}){
  const names=localizedName(index),descriptions=localizedDescription(stats);
  const card={name:names.pt,names,description:descriptions.pt,descriptions,stats,after,
    suit:merchant?"MERCADOR":index%3===0?"FERRO":index%3===1?"VIDA":"PRATA",
    color:["steel","fire","heart"][index%3],icon:cardGlyphs[index%cardGlyphs.length],generated:true};
  if(price)card.price=price;
  if(ingredients)card.ingredients=ingredients;
  if(merchant)card.shopDescriptions=Object.fromEntries(["pt","en","es"].map(language=>[
    language,`${language==="pt"?"Carta permanente do mercador":language==="es"?"Carta permanente del mercader":"Permanent merchant card"}: ${descriptions[language]}.`,
  ]));
  return [id,card];
}
const campaignCardCount=127,merchantCardCount=87,standardFusionCount=487,merchantFusionCount=150;
const generatedCampaign=Array.from({length:campaignCardCount},(_,i)=>{
  const id=`frontierSigil${String(i+1).padStart(3,"0")}`;
  const after=cardStages[(i*5+Math.floor(i/10))%cardStages.length];
  return createCatalogCard(id,i,{after,stats:cardStats(i)});
});
const generatedMerchant=Array.from({length:merchantCardCount},(_,i)=>{
  const index=campaignCardCount+i,id=`bentoArchive${String(i+1).padStart(3,"0")}`;
  const after=cardStages[(i*7+Math.floor(i/8))%cardStages.length];
  return createCatalogCard(id,index,{after,price:390+(i%15)*35+Math.floor(i/15)*20,merchant:true,stats:cardStats(index,.88)});
});
Object.assign(FRONTIER_CARDS,Object.fromEntries([...generatedCampaign,...generatedMerchant]));
function laterStage(a,b){return cardStages[Math.max(cardStages.indexOf(a||"desert"),cardStages.indexOf(b||"desert"))];}
function combinedStats(a,b){
  const result={};
  for(const key of new Set([...Object.keys(a),...Object.keys(b)]))result[key]=roundStat(((a[key]||0)+(b[key]||0))*.55,key);
  return result;
}
const standardIngredients=Object.entries(FRONTIER_CARDS).filter(([,card])=>card.stats&&!card.price&&!card.ingredients);
const rankedPairs=(cards)=>{
  const pairs=[];
  for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
    const value=Math.sin((i+1)*12.9898+(j+1)*78.233)*43758.5453;
    pairs.push({i,j,rank:value-Math.floor(value)});
  }
  return pairs.sort((a,b)=>a.rank-b.rank);
};
const standardPairs=rankedPairs(standardIngredients);
let standardFusionIndex=0;
for(const {i,j} of standardPairs.slice(0,standardFusionCount)){
  const [leftId,left]=standardIngredients[i],[rightId,right]=standardIngredients[j],index=campaignCardCount+merchantCardCount+standardFusionIndex;
  const id=`frontierFusion${String(standardFusionIndex+1).padStart(3,"0")}`;
  const entry=createCatalogCard(id,index,{after:laterStage(left.after,right.after),ingredients:[leftId,rightId],stats:combinedStats(left.stats,right.stats)});
  FRONTIER_CARDS[entry[0]]=entry[1];
  standardFusionIndex++;
}
const legacyMerchantStats={
  ironCharm:{armor:2,after:"desert"},deadeye:{damage:4,after:"mine"},bloodOath:{health:12,regen:1,after:"town"},
  bentoHourglass:{haste:.04,after:"bellTown"},bentoLuckyStar:{fortune:.1,after:"glassMarsh"},
  bentoSaddle:{speed:.05,after:"midnightSaloon"},bentoMercyCoin:{heal:3,after:"forsakenRail"},
  bentoGhostLead:{damage:2,after:"crowFortress"},
};
const merchantIngredients=[
  ...Object.entries(FRONTIER_CARDS).filter(([,card])=>card.price&&card.stats),
  ...Object.entries(legacyMerchantStats).map(([id,{after,...stats}])=>[id,{after,stats}]),
];
const merchantPairs=rankedPairs(merchantIngredients);
let merchantFusionIndex=0;
for(const {i,j} of merchantPairs.slice(0,merchantFusionCount)){
  const [leftId,left]=merchantIngredients[i],[rightId,right]=merchantIngredients[j],index=campaignCardCount+merchantCardCount+standardFusionCount+merchantFusionIndex;
  const id=`bentoFusion${String(merchantFusionIndex+1).padStart(3,"0")}`;
  const entry=createCatalogCard(id,index,{after:laterStage(left.after,right.after),ingredients:[leftId,rightId],merchant:true,stats:combinedStats(left.stats,right.stats)});
  FRONTIER_CARDS[entry[0]]=entry[1];
  merchantFusionIndex++;
}
if(standardFusionIndex!==standardFusionCount||merchantFusionIndex!==merchantFusionCount)
  throw new Error("Could not produce the configured unique card-fusion catalog.");
FRONTIER_CARDS.pirateBomb={name:'Bomba de Dinamite',names:{pt:'Bomba de Dinamite',en:'Dynamite Bomb',es:'Bomba de Dinamita'},suit:'FOGO',color:'fire',icon:'✹',active:true,mission:'glassMarsh:4',description:'Arremessa uma bomba: {damage} de dano em área, a cada {cooldown} s.',descriptions:{en:'Throws a bomb for {damage} area damage every {cooldown} s.',es:'Lanza una bomba: {damage} de daño en área cada {cooldown} s.'}};
export const frontierCardStats = (id,level) => id==='pirateBomb'?{damage:30+10*(level-1),cooldown:Math.max(2,5-.35*level),range:14}:FRONTIER_CARDS[id]?.active
  ? {damage:(id==="lunarReturn"?32:20)+8*(level-1),cooldown:Math.max(1.6,3.6-level*.25),range:id==="lunarReturn"?17:13}
  : Object.fromEntries(Object.entries(FRONTIER_CARDS[id]?.stats||{}).map(([key,value])=>[key,value*level]));
