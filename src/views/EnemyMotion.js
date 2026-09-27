import * as THREE from 'three';
// Reduce excursions around each clip's reference pose, preserving timing and rig.
export function softenEnemyClip(clip,amount=.55){
 const copy=clip.clone(),reference=new THREE.Quaternion(),pose=new THREE.Quaternion();
 for(const track of copy.tracks){
  if(track.ValueTypeName==='quaternion'){
   reference.fromArray(track.values,0);
   for(let i=0;i<track.values.length;i+=4){pose.fromArray(track.values,i);pose.slerp(reference,1-amount).toArray(track.values,i);}
  }else if(track.ValueTypeName==='vector'&&track.name.endsWith('.position')){
   const base=Array.from(track.values.slice(0,3));
   for(let i=3;i<track.values.length;i++)track.values[i]=base[i%3]+(track.values[i]-base[i%3])*amount;
  }
 }
 return copy;
}
const axis=new THREE.Vector3(1,0,0),delta=new THREE.Quaternion();
export function resetEnemyThrow(view){
 const state=view.userData.throwMotion;if(!state)return;
 for(const [bone,q] of state.saved)bone.quaternion.copy(q);
 state.saved.length=0;
}
export function animateEnemyThrow(view,enemy){
 if(!view.userData.axeThrower||!view.children.length)return;
 let state=view.userData.throwMotion;
 if(!state){const model=view.children[0];state={arm:model.getObjectByName('UpperArm.L')||model.getObjectByName('ArmL'),forearm:model.getObjectByName('LowerArm.L'),weapon:model.getObjectByName('Weapon_Axe'),saved:[]};view.userData.throwMotion=state;}
 const windup=enemy.aimTimer>0?1-enemy.aimTimer/(enemy.aimDuration||.55):0;
 const release=Math.min(1,(enemy.throwRelease||0)/.3);
 const blend=windup*windup*(3-2*windup);
 const angle=enemy.aimTimer>0?-blend*.95:release>0?-.95*release:0;
 for(const [bone,weight] of [[state.arm,1],[state.forearm,.4]])if(bone&&angle){state.saved.push([bone,bone.quaternion.clone()]);bone.quaternion.multiply(delta.setFromAxisAngle(axis,angle*weight));}
 if(state.weapon)state.weapon.visible=release<.65;
}
