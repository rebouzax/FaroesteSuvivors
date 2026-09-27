import {it,expect} from 'vitest';
import * as THREE from 'three';
import {softenEnemyClip,animateEnemyThrow,resetEnemyThrow} from './EnemyMotion.js';
it('reduces motion without modifying shared source clips or reference pose',()=>{
 const end=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),1.2);
 const clip=new THREE.AnimationClip('Walk',1,[new THREE.QuaternionKeyframeTrack('ArmL.quaternion',[0,1],[0,0,0,1,...end.toArray()])]);
 const softened=softenEnemyClip(clip,.5),result=new THREE.Quaternion().fromArray(softened.tracks[0].values,4);
 expect(new THREE.Quaternion().angleTo(result)).toBeCloseTo(.6);expect(clip.tracks[0].values[4]).toBeCloseTo(end.x);
});
it('winds up the axe arm, hides the released weapon, and restores the base pose',()=>{
 const view=new THREE.Group(),model=new THREE.Group(),arm=new THREE.Bone(),weapon=new THREE.Group();arm.name='ArmL';weapon.name='Weapon_Axe';arm.add(weapon);model.add(arm);view.add(model);view.userData.axeThrower=true;
 animateEnemyThrow(view,{aimTimer:.1,aimDuration:.5});expect(arm.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(.5);
 resetEnemyThrow(view);expect(arm.quaternion.angleTo(new THREE.Quaternion())).toBeCloseTo(0);
 animateEnemyThrow(view,{aimTimer:0,throwRelease:.3});expect(weapon.visible).toBe(false);
 resetEnemyThrow(view);animateEnemyThrow(view,{aimTimer:0,throwRelease:0});expect(weapon.visible).toBe(true);
});
