import {it,expect} from 'vitest';
import {STAGE_ORDER} from './campaignConfig.js';
import {sceneryFor,sceneryColliders} from './sceneryPlan.js';
import {STAGE_TERRAIN} from './stageLayout.js';
import {STAGE_WEATHER} from './stageWeather.js';
import {WeatherSystem} from '../systems/WeatherSystem.js';
import {RunModel} from '../models/RunModel.js';
it('keeps terrain and composite dioramas out of solid scenery',()=>{
 for(const stage of STAGE_ORDER){
  for(const p of sceneryFor(stage))expect(['canyon-scene-1','model-western','cemetery-1',...Object.values(STAGE_TERRAIN)]).not.toContain(p.assetId);
  for(const p of sceneryColliders(stage))expect(Math.hypot(p.x,p.z-8)-p.radius).toBeGreaterThan(.4);
 }
 expect(STAGE_TERRAIN).toEqual({});
});
it('mine scenery is geological and indoor weather never spawns',()=>{
 expect(sceneryFor('mine').every(p=>/rock|scree/.test(p.assetId))).toBe(true);
 for(const mapId of ['mine','midnightSaloon','crowFortress','emberFoundry','moonMonastery']){
  expect(STAGE_WEATHER[mapId]).toEqual([]);
  const r=new RunModel(()=>.5,0,{}, {mapId});r.time=600;
  r.weather.kind='rain';r.weather.strikes=[{}];r.tornadoes=[{}];new WeatherSystem().update(r,1);
  expect(r.weather.remaining).toBe(0);expect(r.weather.strikes).toEqual([]);expect(r.tornadoes).toEqual([]);
 }
});
