import {it,expect} from 'vitest';
import {heroUnlocked,CAMPAIGN} from './campaignConfig.js';
import {CHARACTERS} from './characterConfig.js';
import {HERO_MODELS,MERCHANT_HEROES} from './specialHeroes.js';
import {HERO_PORTRAITS} from './portraitConfig.js';
import {SUPPLIED_ASSETS} from './suppliedAssets.js';
import {CREATURE_ART} from './creatureArt.js';
import {sceneryFor} from './sceneryPlan.js';
import {permanentShopMarkup} from '../views/ShopView.js';
import {ProfileService} from '../services/ProfileService.js';
import {RunModel} from '../models/RunModel.js';
import {CombatSystem} from '../systems/CombatSystem.js';

const storage=()=>{let data;return {getItem:()=>data||null,setItem:(key,value)=>{data=value;}};};

it('mantém 22 campeões originais e Clanker, sem os três descartados no menu ou mercador',()=>{
  expect(Object.keys(CHARACTERS)).toHaveLength(23);
  expect(Object.keys(HERO_PORTRAITS)).toHaveLength(23);
  expect(HERO_MODELS).toEqual({clanker:'clanker'});
  expect(Object.keys(MERCHANT_HEROES)).toHaveLength(0);
  const profile=new ProfileService(storage());
  for(const id of ['viking','centurion','pirate']){
    expect(CHARACTERS[id]).toBeUndefined();
    expect(HERO_PORTRAITS[id]).toBeUndefined();
    expect(profile.buyHero(id)).toBe(false);
    expect(new RunModel(()=>.5,0,{}, {characterId:id}).characterId).toBe('joao');
  }
  const shop=permanentShopMarkup(profile,'menu');
  expect(shop).not.toContain('shop-filter:heroes');
  expect(shop).not.toContain('buy-hero:');
});

it('libera Clanker só após missão final, chefe e vitória da Ferrovia na campanha',()=>{
  const disk=storage(),profile=new ProfileService(disk);
  profile.data.discoveries.encounteredBosses=['clanker'];
  expect(heroUnlocked(profile.data,'clanker')).toBe(false);
  profile.data.discoveries.bosses=['clanker'];
  expect(heroUnlocked(profile.data,'clanker')).toBe(false);
  profile.data.missionClears=['forsakenRail:4'];
  expect(heroUnlocked(profile.data,'clanker')).toBe(false);
  profile.data.storyClears.forsakenRail=true;
  expect(heroUnlocked(profile.data,'clanker')).toBe(true);
  delete profile.data.storyClears.forsakenRail;
  profile.data.missionClears=[];profile.data.discoveries.bosses=[];
  const run=new RunModel(()=>.5,0,{}, {mapId:'forsakenRail',mode:'story'});
  run.time=900;run.phase='victory';run.missionsCompleted=CAMPAIGN.forsakenRail.missions.length;
  run.bossEncounter.nextBoss=CAMPAIGN.forsakenRail.bosses.length;
  run.completedMissionIds=new Set(CAMPAIGN.forsakenRail.missions.map((_,i)=>`forsakenRail:${i+1}`));
  run.defeatedBosses.add('clanker');profile.recordRun(run);
  expect(heroUnlocked(profile.data,'clanker')).toBe(true);
  expect(heroUnlocked(new ProfileService(disk).data,'clanker')).toBe(true);
});

it('reembolsa uma vez as compras antigas dos campeões retirados',()=>{
  const disk=storage();
  disk.setItem('faroeste:profile:v2',JSON.stringify({coins:100,ownedHeroes:['viking','centurion','viking']}));
  const profile=new ProfileService(disk);
  expect(profile.data.coins).toBe(2200);
  expect(profile.data.ownedHeroes).toEqual([]);
  profile.save();
  expect(new ProfileService(disk).data.coins).toBe(2200);
});

it('mantém Clanker como chefe e campeão com quatro projéteis',()=>{
  expect(CAMPAIGN.forsakenRail.bosses.map(b=>b.id)).toContain('clanker');
  const run=new RunModel(()=>.5,0,{}, {characterId:'clanker'}),combat=new CombatSystem();
  run.cooldown=0;combat.rangedPrimary(run,.2);
  expect(run.primaryShots).toHaveLength(4);
  expect(run.primaryShots.every(shot=>shot.kind==='clanker')).toBe(true);
});

it('mantém somente os modelos admitidos utilizados nas fases',()=>{
  const used=new Set([...Object.values(CREATURE_ART),...Object.values(HERO_MODELS),...Object.keys(CAMPAIGN).flatMap(stage=>sceneryFor(stage).map(p=>p.assetId))]);
  expect(Object.keys(SUPPLIED_ASSETS)).toHaveLength(97);
  expect([...used].filter(id=>!SUPPLIED_ASSETS[id])).toEqual([]);
  for(const stage of Object.keys(CAMPAIGN)){
    const run=new RunModel(()=>.5,0,{}, {mapId:stage});
    for(const prop of run.props.filter(p=>p.assetId))expect(Math.hypot(prop.x-run.player.x,prop.z-run.player.z)).toBeGreaterThan(prop.radius+1);
  }
});
