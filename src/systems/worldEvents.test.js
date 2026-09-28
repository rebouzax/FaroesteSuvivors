import {describe,it,expect} from 'vitest';
import {RunModel} from '../models/RunModel.js';
import {RunSystem} from './RunSystem.js';
import {WeatherSystem} from './WeatherSystem.js';
import {TreasureSystem} from './TreasureSystem.js';
import {EnemySystem} from './EnemySystem.js';
import {nearbyProps,pushOut} from './SceneryCollision.js';
import {TREASURE_CREATURES} from '../config/treasureCreatures.js';
import {sceneryFor} from '../config/sceneryPlan.js';
const runFor=()=>{const r=new RunModel(()=>.5);r.phase='playing';return r;};
describe('world events and solid scenery',()=>{
 it('checks nearby obstacles without losing rotated walls or reusing an old map grid',()=>{
  const r=runFor(),near={x:0,z:0,halfX:.1,halfZ:10,rotation:Math.PI/2},far=Array.from({length:200},(_,i)=>({x:30+i,z:30,radius:.5}));
  r.props=[near,...far];
  expect(nearbyProps(r,0,0)).toContain(near);
  expect(nearbyProps(r,0,0)).not.toContain(far[0]);
  r.props=[{x:0,z:0,radius:1}];
  expect(nearbyProps(r,0,0)).toEqual(r.props);
 });
 it('blocks crossing a thin fence, even with a long player movement step',()=>{
  const r=runFor();r.props=[{x:0,z:0,halfX:.1,halfZ:10,radius:10}];r.player.x=-2;r.player.z=0;
  new RunSystem().move(r,1,{x:1,z:0});expect(r.player.x).toBeLessThanOrEqual(-.499);
 });
 it('resolves a rotated wall without blocking its whole bounding circle',()=>{
  const wall={x:0,z:0,halfX:.1,halfZ:10,rotation:Math.PI/2,radius:10};
  const free={x:0,z:3};expect(pushOut(free,wall)).toBe(false);
  const inside={x:2,z:0};expect(pushOut(inside,wall)).toBe(true);expect(Math.abs(inside.z)).toBeCloseTo(.5);
 });
 it('keeps an enemy out of solid props',()=>{
  const r=runFor();r.props=[{x:0,z:0,halfX:2,halfZ:1,radius:3}];const e={id:1,x:0,z:0};
  new EnemySystem().keepOutOfProps(r,e);expect(Math.abs(e.z)).toBeGreaterThanOrEqual(1.39);
 });
 it('adds supplied decoration and distinct treasure models to all fifteen stages',()=>{
  expect(Object.keys(TREASURE_CREATURES)).toHaveLength(15);expect(new Set(Object.values(TREASURE_CREATURES).map(v=>v.model)).size).toBe(15);
  for(const map of Object.keys(TREASURE_CREATURES))expect(sceneryFor(map).length).toBeGreaterThan(20);
 });
 it('spawns exactly two treasure creatures, retaining 600 HP across difficulty changes',()=>{
  const r=runFor(),sys=new TreasureSystem();r.props=[];
  r.time=400;sys.update(r,.1);expect(r.enemies.filter(e=>e.treasure)).toHaveLength(1);
  new EnemySystem().update(r,.01);expect(r.enemies.find(e=>e.treasure).maxHp).toBe(600);
  r.time=850;sys.update(r,.1);sys.update(r,.1);expect(r.treasureSpawned).toBe(2);
  expect(r.enemies.filter(e=>e.treasure)).toHaveLength(2);
 });
 it('flees and drops the exact reward, capped at 1200 even with coin bonuses',()=>{
  const r=runFor(),sys=new TreasureSystem(),game=new RunSystem();r.props=[];r.time=400;sys.update(r,.1);
  const e=r.enemies[0],before=Math.hypot(e.x-r.player.x,e.z-r.player.z);sys.update(r,.2);
  expect(Math.hypot(e.x-r.player.x,e.z-r.player.z)).toBeGreaterThan(before);
  e.reward=1200;sys.defeated(r,e,(...args)=>game.drop(r,...args));expect(r.loot.reduce((s,c)=>s+c.value,0)).toBe(1200);
  r.coinMultiplier=3;for(const coin of r.loot){coin.x=r.player.x;coin.z=r.player.z;}game.collect(r,.1);expect(r.coins).toBe(1200);
 });
 it('telegraphs lightning then damages both sides exactly once',()=>{
  const r=runFor(),sys=new WeatherSystem();r.weather.nextAt=999;
  r.weather.strikes=[{x:r.player.x,z:r.player.z,age:0,radius:2.2,hit:false}];
  const e={hp:600,x:r.player.x,z:r.player.z};r.enemies=[e];const hp=r.player.hp;
  sys.update(r,1);expect(e.hp).toBe(600);expect(r.player.hp).toBe(hp);
  sys.update(r,.21);expect(e.hp).toBe(480);expect(r.player.hp).toBeLessThan(hp);
  sys.update(r,.1);expect(e.hp).toBe(480);
 });
 it('pauses weather and treasure lifetimes during boss fights',()=>{
  const r=runFor(),sys=new TreasureSystem();r.time=400;sys.update(r,.1);const life=r.enemies[0].life;
  r.bossEncounter.active=true;r.weather.remaining=20;sys.update(r,5);new WeatherSystem().update(r,5);
  expect(r.enemies[0].life).toBe(life);expect(r.weather.remaining).toBe(20);
 });
});
