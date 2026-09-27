import * as THREE from 'three';
// Bespoke silhouettes for bestiary species without a corresponding supplied GLB.
export function createSpecialCreature(shape){
  const scene=new THREE.Group(),frame=new THREE.Group();frame.name='Frame';scene.add(frame);
  const green=new THREE.MeshStandardMaterial({color:0x617c4b,roughness:.85}),wood=new THREE.MeshStandardMaterial({color:0x654635,roughness:.9}),metal=new THREE.MeshStandardMaterial({color:0x645c5e,metalness:.65,roughness:.4}),bone=new THREE.MeshStandardMaterial({color:0xd9c8a0,roughness:.65}),red=new THREE.MeshStandardMaterial({color:0x9b424f,roughness:.75});
  const tracks=[];
  function mesh(g,m,x,y,z,sx=1,sy=1,sz=1){const p=new THREE.Mesh(g,m);p.position.set(x,y,z);p.scale.set(sx,sy,sz);p.castShadow=true;frame.add(p);return p;}
  const orb=(m,x,y,z,sx,sy,sz)=>mesh(new THREE.SphereGeometry(1,12,8),m,x,y,z,sx,sy,sz);
  const box=(m,x,y,z,sx,sy,sz)=>mesh(new THREE.BoxGeometry(sx,sy,sz),m,x,y,z);
  const spike=(m,x,y,z,r,h)=>mesh(new THREE.ConeGeometry(r,h,8),m,x,y,z);
  function animate(p,axis,amount){p.name='Joint'+tracks.length;tracks.push(new THREE.NumberKeyframeTrack(`${p.name}.rotation[${axis}]`,[0,.25,.5,.75,1],[0,amount,0,-amount,0]));}
  if(['cactus','flower','tree'].includes(shape)){
    const stem=mesh(new THREE.CylinderGeometry(.13,.25,1.1,12),shape==='tree'?wood:green,0,.6,0);animate(stem,'z',.035);
    if(shape==='cactus')for(const side of [-1,1]){orb(green,side*.34,.65,0,.28,.12,.13);orb(green,side*.53,.94,0,.13,.36,.13);for(let i=0;i<7;i++)spike(bone,side*.53,1.3-i*.09,.13,.025,.11).rotation.x=Math.PI/2;}
    if(shape==='flower'){orb(red,0,1.2,0,.26,.18,.26);for(let i=0;i<8;i++){const a=i*Math.PI/4;const petal=orb(red,Math.cos(a)*.35,1.15,Math.sin(a)*.35,.3,.09,.17);petal.rotation.y=-a;animate(petal,'x',.12);}for(let i=0;i<6;i++)spike(bone,Math.cos(i)*.16,1.37,Math.sin(i)*.16,.04,.15);}
    if(shape==='tree'){for(const side of [-1,1]){const arm=mesh(new THREE.CylinderGeometry(.07,.14,.8,9),wood,side*.4,.9,0);arm.rotation.z=side*.8;for(let i=0;i<3;i++)spike(wood,side*(.55+i*.13),1.15+i*.11,0,.06,.4);}}
  }else if(['train','piano','mimic'].includes(shape)){
    box(shape==='train'?metal:wood,0,.55,0,1.2,.7,1.05);
    if(shape==='train'){mesh(new THREE.CylinderGeometry(.29,.29,1.3,12),metal,0,.8,.35).rotation.x=Math.PI/2;mesh(new THREE.CylinderGeometry(.11,.15,.5,10),metal,0,1.18,.65);box(metal,0,1.15,-.4,1,.12,.65);for(const side of [-1,1])for(let i=0;i<3;i++){const wheel=mesh(new THREE.CylinderGeometry(.2,.2,.12,12),metal,side*.62,.25,-.4+i*.4);wheel.rotation.z=Math.PI/2;}}
    else if(shape==='piano'){box(wood,0,1,-.35,1.3,.8,.3);for(let i=0;i<12;i++)box(i%3?bone:metal,(i-5.5)*.095,.8,.57,.085,.08,i%3?.32:.2);}
    else{box(metal,0,.94,0,1.25,.13,1.1);for(let i=0;i<8;i++)spike(bone,(i-3.5)*.14,.65,.56,.055,.24).rotation.z=Math.PI;}
    if(shape!=='train')for(const side of [-1,1])for(const z of [-.35,.35]){const leg=mesh(new THREE.CapsuleGeometry(.06,.38,3,6),wood,side*.52,.2,z);animate(leg,'x',side*.35);}
  }else if(['boar','bull','stag'].includes(shape)){
    orb(wood,0,.65,0,.37,.36,.65);orb(wood,0,.85,.65,.26,.28,.32);
    for(const side of [-1,1])for(const z of [-.4,.4]){const leg=mesh(new THREE.CapsuleGeometry(.085,.4,3,8),wood,side*.25,.3,z);animate(leg,'x',side*.32);}
    for(const side of [-1,1]){spike(bone,side*.23,shape==='boar'?.65:1.19,.78,.07,shape==='stag'?.8:.4).rotation.z=side*-.4;if(shape==='stag')for(let i=0;i<3;i++)spike(bone,side*(.28+i*.05),1.28+i*.16,.78,.03,.26).rotation.z=side*-.9;}
  }else if(shape==='leech'){
    for(let i=0;i<12;i++){const segment=orb(green,Math.sin(i*.5)*.1,.18,-.7+i*.13,.17,.17,.12);animate(segment,'y',.2);}
    mesh(new THREE.TorusGeometry(.14,.035,6,12),red,0,.22,.86);
  }else{
    orb(shape==='owl'?wood:metal,0,.65,0,.2,.35,.3);
    for(const side of [-1,1]){
      const wing=new THREE.Group();wing.name=side<0?'WingL':'WingR';wing.position.set(side*.14,.7,0);frame.add(wing);
      const material=shape==='moth'?red:shape==='seraph'?bone:shape==='owl'?wood:green;
      const feathers=shape==='insect'?2:5;
      for(let i=0;i<feathers;i++){const feather=new THREE.Mesh(new THREE.SphereGeometry(1,10,6),material);feather.position.set(side*(.18+i*.11),0,-i*.09);feather.scale.set(.35,.035,shape==='moth'?.3:.13);wing.add(feather);}
      tracks.push(new THREE.NumberKeyframeTrack(`${wing.name}.rotation[z]`,[0,.25,.5,.75,1],[0,side*.7,0,-side*.7,0]));
      orb(bone,side*.1,.9,.25,.07,.08,.05);
    }
    if(shape==='seraph')mesh(new THREE.TorusGeometry(.29,.035,6,20),bone,0,1.25,0).rotation.x=Math.PI/2;
    if(shape==='insect')for(const side of [-1,1])for(let i=0;i<3;i++){const leg=mesh(new THREE.CylinderGeometry(.018,.025,.4,6),metal,side*.2,.35,-.15+i*.15);leg.rotation.z=side*.8;}
  }
  tracks.push(new THREE.NumberKeyframeTrack('Frame.position[y]',[0,.5,1],[0,.035,0]));
  return {scene,animations:[new THREE.AnimationClip('Walk',1,tracks)]};
}
