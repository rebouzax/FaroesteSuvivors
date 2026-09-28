import { describe,it,expect } from 'vitest';
import { RunModel } from '../models/RunModel.js';
import { CombatSystem } from './CombatSystem.js';
import { trackTargets,intercept } from './ChampionAim.js';
import { CHARACTERS } from '../config/characterConfig.js';

const setup=id=>{
  const run=new RunModel(()=>.5,0,{}, {characterId:id});
  run.player.x=0;run.player.z=0;run.cooldown=0;
  run.enemies=[{id:1,x:9,z:0,hp:1000,armor:0}];
  return run;
};
describe('mira e projéteis principais',()=>{
  it('recalcula o lançamento após campeão e alvo se moverem durante a preparação',()=>{
    const run=setup('dynamite'),combat=new CombatSystem();
    combat.rangedPrimary(run,.08);
    run.player.z=2;run.enemies[0].z=5;
    combat.rangedPrimary(run,.08);
    const shot=run.primaryShots[0];
    expect(shot.x+shot.vx*shot.flight).toBeCloseTo(9);
    expect(shot.z+shot.vz*shot.flight).toBeCloseTo(5);
    combat.primaryProjectiles(run,shot.flight);
    expect(run.enemies[0].hp).toBeLessThan(1000);
  });
  it('antecipa o inimigo lançado pela dinamite',()=>{
    const id='dynamite';
    const run=setup(id),combat=new CombatSystem();
    trackTargets(run,.1);run.enemies[0].z+=.3;trackTargets(run,.1);
    combat.rangedPrimary(run,.2);
    const shot=run.primaryShots[0];
    run.enemies[0].z+=3*shot.flight;
    combat.primaryProjectiles(run,shot.flight);
    expect(run.pulses[0].z).toBeCloseTo(run.enemies[0].z);
    expect(run.enemies[0].hp).toBeLessThan(1000);
  });
  it('ignora teleporte como velocidade de alvo',()=>{
    const run=setup('maria');trackTargets(run,.016);run.enemies[0].x+=50;trackTargets(run,.016);
    expect(run.enemies[0].aimVelocity).toEqual({x:0,z:0});
    expect(intercept(run.player,run.enemies[0],25).x).toBe(59);
  });
  it.each(Object.keys(CHARACTERS).filter(id=>id!=='joao'&&CHARACTERS[id].primary!=='sword'))('solta seis cópias sucessivas para %s',id=>{
    const combat=new CombatSystem(),base=setup(id),upgraded=setup(id);
    upgraded.abilities.doubleShot=6;
    combat.rangedPrimary(base,.2);combat.rangedPrimary(upgraded,.2);
    expect(upgraded.primaryShots.length).toBe(base.primaryShots.length);
    expect(upgraded.pendingPrimaryShots).toHaveLength(6);
    combat.releasePrimaryShots(upgraded,.1);
    expect(upgraded.primaryShots.length).toBe(base.primaryShots.length);
    combat.releasePrimaryShots(upgraded,.02);
    expect(upgraded.primaryShots.length).toBe(base.primaryShots.length+1);
    for(let i=0;i<5;i++)combat.releasePrimaryShots(upgraded,.11);
    expect(upgraded.primaryShots.length).toBe(base.primaryShots.length+6);
    expect(upgraded.pendingPrimaryShots).toHaveLength(0);
    expect(new Set(upgraded.primaryShots.map(s=>s.hit)).size).toBe(upgraded.primaryShots.length);
  });
  it('faz o Clanker lançar do braço à frente do corpo',()=>{
    const run=setup('clanker'),combat=new CombatSystem();
    combat.rangedPrimary(run,.2);
    const shot=run.primaryShots[0];
    expect(shot.x).toBeGreaterThan(.3);
    expect(Math.abs(shot.z)).toBeGreaterThan(.2);
  });
  it('permite seis níveis e bloqueia uma sétima escolha e compra',()=>{
    const run=setup('maria');
    for(let level=1;level<=6;level++){
      run.phase='upgrade';run.pendingChoices=1;run.cardOffers=['doubleShot'];
      expect(run.chooseAbility('doubleShot')).toBe(true);
      expect(run.abilities.doubleShot).toBe(level);
    }
    run.phase='upgrade';run.pendingChoices=1;run.cardOffers=['doubleShot'];
    expect(run.chooseAbility('doubleShot')).toBe(false);
    run.dealCards();expect(run.cardOffers).not.toContain('doubleShot');
    run.phase='merchant';run.coins=100000;expect(run.buyRunUpgrade('doubleShot')).toBe(false);
  });
});
