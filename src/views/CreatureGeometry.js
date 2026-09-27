import * as THREE from "three";

// Art generated locally: anatomy remains recognizable even before external models
// are admitted. Templates share geometry; each instance has independent joints.
export const CREATURE_SHAPES = ["spider","snake","scorpion","rat","ghost","skull"];
export function createCreatureAsset(shape) {
  const scene=new THREE.Group(), frame=new THREE.Group();frame.name="Frame";scene.add(frame);
  const skin=new THREE.MeshStandardMaterial({color:shape==="snake"?0xa86836:shape==="scorpion"?0x863c2e:shape==="spider"?0x57415e:0xaaa99c,roughness:.8});
  const bone=new THREE.MeshStandardMaterial({color:0xe0d6b2,roughness:.7});
  const dark=new THREE.MeshStandardMaterial({color:0x211e29,roughness:.85});
  const glow=new THREE.MeshStandardMaterial({color:0xffb85f,emissive:0xd54a16,emissiveIntensity:.8});
  const tracks=[];
  const part=(parent,name,geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;
  };
  const oval=(parent,name,mat,x,y,z,sx,sy,sz)=>part(parent,name,new THREE.SphereGeometry(1,12,8),mat,x,y,z,sx,sy,sz);
  const hinge=(parent,name,x,y,z)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;};
  const sway=(name,axis,amount,phase=1)=>tracks.push(new THREE.NumberKeyframeTrack(`${name}.rotation[${axis}]`,[0,.25,.5,.75,1],[0,amount*phase,0,-amount*phase,0]));
  const limb=(parent,name,x,y,z,sign,length,angle)=>{
    const joint=hinge(parent,name,x,y,z);joint.rotation.y=angle;
    const segment=part(joint,`${name}Upper`,new THREE.CapsuleGeometry(.035,length*.6,3,6),skin,sign*length*.3,-.03,0);
    segment.rotation.z=sign*1.2;
    const lower=part(joint,`${name}Lower`,new THREE.CapsuleGeometry(.022,length*.6,3,6),skin,sign*length*.65,-.22,0);lower.rotation.z=-sign*.7;
    sway(name,"z",.2,sign);return joint;
  };
  if(shape==="snake"){
    let parent=frame;
    for(let i=0;i<13;i++){
      const joint=hinge(parent,`Spine${i}`,0,i===0?.2:0,i===0?-.85:.14);
      oval(joint,`Scale${i}`,skin,0,0,0,.06+i*.009,.07+i*.006,.12);
      sway(joint.name,"y",.16,Math.sin(i*.65));parent=joint;
    }
    const head=oval(parent,"Head",skin,0,.055,.13,.19,.12,.24);
    for(const sign of [-1,1]){oval(head,`Eye${sign}`,glow,sign*.72,.5,.42,.15,.15,.15);}
    part(parent,"ForkedTongue",new THREE.CylinderGeometry(.013,.009,.22,5),glow,0,.06,.4).rotation.x=Math.PI/2;
  }else if(shape==="spider"||shape==="scorpion"){
    oval(frame,"Abdomen",skin,0,.43,-.25,.35,.25,.42);
    oval(frame,"Head",skin,0,.38,.25,.25,.19,.29);
    const count=shape==="spider"?4:3;
    for(let i=0;i<count;i++)for(const sign of [-1,1])limb(frame,`Leg${i}${sign}`,sign*.18,.4,-.3+i*.19,sign,.72,(i-(count-1)/2)*.38*sign);
    for(const sign of [-1,1]){
      oval(frame,`Eye${sign}`,glow,sign*.1,.46,.49,.04,.04,.04);
      if(shape==="scorpion"){
        const claw=hinge(frame,`Claw${sign}`,sign*.33,.34,.48);
        oval(claw,`Pincer${sign}`,skin,0,0,.17,.13,.08,.25);sway(claw.name,"y",.24,sign);
        part(claw,`Tip${sign}`,new THREE.ConeGeometry(.09,.25,8),bone,sign*.05,0,.4).rotation.x=Math.PI/2;
      }
    }
    if(shape==="scorpion"){
      const tail=hinge(frame,"Tail",0,.5,-.55);sway("Tail","x",.13);
      for(let i=0;i<7;i++)oval(tail,`TailRing${i}`,skin,0,i*.1,-Math.sin(i*.35)*.3,.085-i*.005,.08,.085);
      part(tail,"Stinger",new THREE.ConeGeometry(.07,.24,8),bone,0,.6,-.06).rotation.x=1.7;
    }
  }else if(shape==="rat"){
    oval(frame,"Body",skin,0,.25,0,.24,.23,.42);
    const head=oval(frame,"Head",skin,0,.31,.4,.2,.17,.25);
    for(const sign of [-1,1]){
      oval(head,`Ear${sign}`,skin,sign*.8,.8,-.3,.35,.55,.15);
      oval(head,`Eye${sign}`,glow,sign*.6,.22,.65,.1,.1,.1);
      for(let i=0;i<2;i++)limb(frame,`Leg${i}${sign}`,sign*.18,.2,-.22+i*.4,sign,.2,0);
    }
    const tail=hinge(frame,"Tail",0,.15,-.4);part(tail,"TailTip",new THREE.ConeGeometry(.045,.7,8),skin,0,0,-.3).rotation.x=-Math.PI/2;sway("Tail","y",.25);
  }else if(shape==="skull"){
    oval(frame,"Head",bone,0,.55,0,.33,.38,.28);
    for(const sign of [-1,1]){oval(frame,`Socket${sign}`,dark,sign*.13,.61,.23,.1,.12,.06);oval(frame,`Eye${sign}`,glow,sign*.13,.61,.28,.035,.035,.025);}
    for(let i=0;i<6;i++)part(frame,`Tooth${i}`,new THREE.BoxGeometry(.055,.12,.1),bone,(i-2.5)*.06,.28,.2);
    sway("Frame","y",.2);
  }else{
    const cloth=new THREE.MeshStandardMaterial({color:0xb9d4d9,transparent:true,opacity:.78,roughness:.6,side:THREE.DoubleSide});
    part(frame,"Shroud",new THREE.CylinderGeometry(.2,.45,1.1,16,4,true),cloth,0,.6,0);
    oval(frame,"Head",cloth,0,1.18,0,.25,.3,.24);
    for(const sign of [-1,1]){oval(frame,`Eye${sign}`,dark,sign*.085,1.2,.23,.045,.075,.025);const arm=hinge(frame,sign<0?"ArmL":"ArmR",sign*.2,.9,0);oval(arm,`Sleeve${sign}`,cloth,sign*.22,-.08,0,.28,.11,.14);sway(arm.name,"z",.25,sign);}
    sway("Frame","y",.14);
  }
  tracks.push(new THREE.NumberKeyframeTrack("Frame.position[y]",[0,.5,1],[0,shape==="ghost"||shape==="skull"?.1:.025,0]));
  return {scene,animations:[new THREE.AnimationClip("Walk",1,tracks)]};
}
