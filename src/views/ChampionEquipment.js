import * as THREE from 'three';
export function equipChampion(asset,id){
  const hand=asset.scene.getObjectByName('ArmR')||asset.scene;
  const steel=new THREE.MeshStandardMaterial({color:0xc0c6c9,metalness:.8,roughness:.3}),wood=new THREE.MeshStandardMaterial({color:0x654332,roughness:.8});
  const weapon=new THREE.Group();weapon.name='PrimaryWeapon';weapon.position.set(asset.scene.userData.tPose?.34:0,asset.scene.userData.tPose?0:-.38,.08);hand.add(weapon);
  const part=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;weapon.add(m);return m;};
  if(id==='clanker'){
    part(new THREE.CylinderGeometry(.13,.16,.45,12),steel,0,0,.17).rotation.x=Math.PI/2;
    for(let i=0;i<3;i++)part(new THREE.ConeGeometry(.04,.25,6),wood,(i-1)*.08,0,.47).rotation.x=Math.PI/2;
  }else if(id==='viking'){
    part(new THREE.CylinderGeometry(.027,.035,.62,8),wood,0,0,.24).rotation.x=Math.PI/2;
    part(new THREE.CylinderGeometry(.17,.17,.055,8,1,false,0,Math.PI),steel,.04,0,.52).rotation.x=Math.PI/2;
  }else{
    part(new THREE.CylinderGeometry(.027,.035,.18,8),wood,0,0,0).rotation.x=Math.PI/2;
    part(new THREE.BoxGeometry(.2,.035,.035),steel,0,0,.1);
    const blade=part(new THREE.CylinderGeometry(.006,.055,id==='pirate'?.7:.6,4),steel,0,0,.42);blade.rotation.x=Math.PI/2;
    if(id==='pirate')part(new THREE.TorusGeometry(.09,.018,6,10,Math.PI),steel,.07,0,0).rotation.x=Math.PI/2;
  }
  return asset;
}
