import * as THREE from 'three';

// Equipment changes silhouettes, not merely textures. Recipes are deterministic
// per bestiary entry and are attached to each independent cloned actor.
export function equipCreature(model,id,boss=false){
  const group=new THREE.Group();group.name='BestiaryEquipment';model.add(group);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),h=size.y;
  const steel=new THREE.MeshStandardMaterial({color:0x777b82,metalness:.6,roughness:.42}),bone=new THREE.MeshStandardMaterial({color:0xcbbd9e,roughness:.8}),wood=new THREE.MeshStandardMaterial({color:0x674334,roughness:.85}),glow=new THREE.MeshStandardMaterial({color:0xffb771,emissive:0xb53b13,emissiveIntensity:.8});
  const part=(geo,mat,x,y,z)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);return mesh;};
  const hash=[...id].reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0)|0,0)>>>0;
  const scale=Math.max(.65,Math.min(1.2,h));group.scale.setScalar(scale);
  const top=h/scale;
  if(/scorpion|spider|widow|viper|serpent|snake|leech|crawler|rat/i.test(id)&&!['pianoCrawler'].includes(id)){
    const count=3+hash%5;
    for(let i=0;i<count;i++){const spike=part(new THREE.ConeGeometry(.025+hash%3*.008,.15+(boss?.15:0),7),/salt|crystal|glass/i.test(id)?glow:bone,0,top*.85,-.5+i*.14);spike.rotation.x=-.25;}
    return;
  }
  if(/wolf|hound|coyote|jackal|lynx|rider/i.test(id)){
    if(/rider/i.test(id)){
      part(new THREE.SphereGeometry(.15,10,8),bone,0,top+.25,-.15);part(new THREE.CylinderGeometry(.06,.12,.3,8),steel,0,top,-.15);
      const lance=part(new THREE.CylinderGeometry(.02,.02,1.1,6),wood,.3,top+.25,0);lance.rotation.z=-.35;
    }else for(const side of [-1,1]){
      const horn=part(new THREE.ConeGeometry(.06,.22+hash%4*.07,8),bone,side*.2,top,.36);horn.rotation.z=side*.3;
      part(new THREE.SphereGeometry(.16,8,6),/slag|rift/i.test(id)?steel:wood,side*.18,top*.6,0).scale.set(1,.7,2);
    }
    return;
  }
  if(/bat|crow|hawk|vulture|moth|owl|seraph/i.test(id)){
    for(const side of [-1,1])for(let i=0;i<2+hash%4;i++){
      const feather=part(new THREE.ConeGeometry(.05,.3,7),/cinder|storm/i.test(id)?glow:bone,side*(.3+i*.12),top*.65,-.12-i*.07);feather.rotation.z=side*1.1;
    }
    return;
  }
  if(/bell|keeper|foreman|colossus|guard|clanker/i.test(id)){
    for(const side of [-1,1])part(new THREE.SphereGeometry(.23,10,8),steel,side*.32,top*.75,0).scale.set(1,.65,1);
    if(/bell/i.test(id))part(new THREE.ConeGeometry(.18,.25,12,1,true),glow,.4,top*.45,.15).rotation.z=Math.PI;
  }
  if(/gunner|gun|outlaw|marshal|deputy|bandit|welder|conductor|thief/i.test(id)){
    part(new THREE.CylinderGeometry(.3,.3,.035,14),wood,0,top+.025,0);part(new THREE.CylinderGeometry(.17,.2,.2,12),wood,0,top+.13,0);
    const gun=part(new THREE.CylinderGeometry(.045,.045,.6,8),steel,.35,top*.55,.25);gun.rotation.x=Math.PI/2;
  }else if(/wraith|bride|witch|malvina|queen|abbot|preacher|eclipse|monk|acolyte/i.test(id)){
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(new THREE.ConeGeometry(.045,.2,7),boss?glow:bone,Math.cos(a)*.2,top+.08,Math.sin(a)*.2);}
    const staff=part(new THREE.CylinderGeometry(.025,.035,top*.9,8),wood,.43,top*.5,0);part(new THREE.TorusGeometry(.12,.025,6,12),glow,staff.position.x,top,0);
  }else{
    // Stage-specific burden/backpack, bottles, ribs or crystal growths.
    const count=2+hash%4;
    for(let i=0;i<count;i++){
      const item=part(new THREE.CapsuleGeometry(.055,.2+hash%3*.06,3,7),/furnace|chain|iron|rivet/i.test(id)?steel:bone,(i-(count-1)/2)*.12,top*.65,-.25);item.rotation.z=(i-(count-1)/2)*.18;
    }
  }
}
