import {it,expect} from 'vitest';
import { heroUnlocked,CAMPAIGN } from './campaignConfig.js';
import { MERCHANT_HEROES } from './specialHeroes.js';
import { ProfileService } from '../services/ProfileService.js';
import { RunModel } from '../models/RunModel.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SUPPLIED_ASSETS } from './suppliedAssets.js';
import { CREATURE_ART } from './creatureArt.js';
import { HERO_MODELS } from './specialHeroes.js';
import { sceneryFor } from './sceneryPlan.js';
const storage=()=>{let data;return {getItem:()=>data||null,setItem:(key,value)=>{data=value;}};};
it('preserva compras únicas e não libera os campeões especiais para perfil novo',()=>{
 const disk=storage(),profile=new ProfileService(disk);profile.data.coins=5000;
 for(const id of ['viking','centurion','pirate','clanker'])expect(heroUnlocked(profile.data,id)).toBe(false);
 expect(profile.buyHero('viking')).toBe(false);profile.data.storyClears.mine=true;
 expect(profile.buyHero('viking')).toBe(true);expect(profile.data.coins).toBe(5000-MERCHANT_HEROES.viking.price);
 expect(profile.buyHero('viking')).toBe(false);expect(heroUnlocked(new ProfileService(disk).data,'viking')).toBe(true);
});
it('exige vitória real contra Clanker e as duas missões do contrato pirata',()=>{
 const profile=new ProfileService(storage());profile.data.discoveries.encounteredBosses=['clanker'];
 expect(heroUnlocked(profile.data,'clanker')).toBe(false);
 const run=new RunModel();run.time=550;run.phase='defeat';run.defeatedBosses.add('clanker');profile.recordRun(run);
 expect(heroUnlocked(profile.data,'clanker')).toBe(true);
 profile.data.missionClears=['town:4'];expect(heroUnlocked(profile.data,'pirate')).toBe(false);
 profile.data.missionClears.push('glassMarsh:4');expect(heroUnlocked(profile.data,'pirate')).toBe(true);
 expect(CAMPAIGN.forsakenRail.bosses.map(b=>b.id)).toContain('clanker');
});
it('centurião tem 10 de armadura e a espada atinge apenas o arco próximo',()=>{
 const run=new RunModel(()=>.5,0,{}, {characterId:'centurion'});expect(run.playerArmor).toBe(10);
 run.player.x=0;run.player.z=0;run.cooldown=0;
 run.enemies=[{id:1,x:2,z:0,hp:100,armor:0},{id:2,x:-2,z:0,hp:100,armor:0},{id:3,x:8,z:0,hp:100,armor:0}];
 new CombatSystem().rangedPrimary(run,.2);
 expect(run.enemies[0].hp).toBeLessThan(100);expect(run.enemies[1].hp).toBe(100);expect(run.enemies[2].hp).toBe(100);expect(run.primaryShots).toHaveLength(0);
});
it('pirata começa com bomba funcional e viking/Clanker usam seus projéteis',()=>{
 const combat=new CombatSystem(),run=new RunModel(()=>.5,0,{}, {characterId:'pirate'});
 expect(run.abilities.pirateBomb).toBe(1);run.enemies=[{id:1,x:3,z:8,hp:100,armor:0}];run.pirateBombTimer=0;
 combat.pirateBomb(run,.1);expect(run.primaryShots[0].kind).toBe('dynamite');combat.primaryProjectiles(run,1);expect(run.enemies[0].hp).toBeLessThan(100);
 for(const [id,count] of [['viking',1],['clanker',4]]){const r=new RunModel(()=>.5,0,{}, {characterId:id});r.cooldown=0;combat.rangedPrimary(r,.2);expect(r.primaryShots).toHaveLength(count);expect(r.primaryShots.every(s=>s.kind===id)).toBe(true);}
});
it('integra todos os 100 arquivos e mantém a área inicial livre de novos obstáculos',()=>{
 const used=new Set([...Object.values(CREATURE_ART),...Object.values(HERO_MODELS),...Object.keys(CAMPAIGN).flatMap(stage=>sceneryFor(stage).map(p=>p.assetId))]);
 expect(Object.keys(SUPPLIED_ASSETS)).toHaveLength(100);expect([...Object.keys(SUPPLIED_ASSETS)].filter(id=>!used.has(id))).toEqual([]);
 for(const stage of Object.keys(CAMPAIGN)){const run=new RunModel(()=>.5,0,{}, {mapId:stage});for(const prop of run.props.filter(p=>p.assetId))expect(Math.hypot(prop.x-run.player.x,prop.z-run.player.z)).toBeGreaterThan(prop.radius+1);}
});
