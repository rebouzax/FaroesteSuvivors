import { describe, expect, it } from 'vitest';
import { BOSS_IDS, ENEMY_IDS } from '../config/campaignConfig.js';
import { bestiaryMarkup, creatureDetailMarkup } from './ProgressionView.js';

const profile={data:{language:'pt',discoveries:{enemies:[],bosses:[],encounteredBosses:[]}}};

describe('bestiary portraits',()=>{
  it('provides a bundled image for every creature card and detail',()=>{
    const ids=[...ENEMY_IDS,...BOSS_IDS];
    const list=bestiaryMarkup(profile);
    expect((list.match(/<img src="/g)||[])).toHaveLength(ids.length);
    expect(list).not.toContain('<img src=""');
    for(const id of ids)expect(creatureDetailMarkup(profile,id)).not.toContain('<img src=""');
  });
});
