// Run: node src/tools/generateV07Heroes.mjs
// Builds seven lightweight GLB characters with embedded animation clips.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((bytes) => { this.result = bytes; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((bytes) => { this.result = "data:"+blob.type+";base64,"+Buffer.from(bytes).toString("base64"); this.onloadend?.(); }); }
};

const designs = {
  labuta: { coat:0x49534a, shirt:0xb3a78a, pants:0x555449, skin:0xab7452, hat:0x3f4436, accent:0xb6a36e, body:[.33,.43,.49,.42,.38], shoulders:.47, height:1.82, cadence:1.12, weapon:"shotgun" },
  rosa: { coat:0x673d49, shirt:0xd6b89a, pants:0x3b4c50, skin:0xbb8160, hat:0x4b3d3b, accent:0xd3a76c, body:[.23,.22,.25,.28,.21], shoulders:.34, height:1.76, cadence:.68, weapon:"dual" },
  elias: { coat:0x4c564f, shirt:0xc2a98a, pants:0x343c45, skin:0x94674e, hat:0x685d48, accent:0xdfbc70, body:[.31,.3,.32,.38,.27], shoulders:.43, height:1.88, cadence:1.02, weapon:"rifle" },
  silas: { coat:0x433e4b, shirt:0x83827d, pants:0x34303a, skin:0xb6866e, hat:0x25232e, accent:0xa69779, body:[.25,.24,.27,.29,.24], shoulders:.35, height:1.84, cadence:.75, weapon:"knives" },
  ada: { coat:0x343f50, shirt:0xe0c497, pants:0x494a50, skin:0x724b36, hat:0x3e3740, accent:0xc5ae81, body:[.23,.25,.29,.26,.22], shoulders:.35, height:1.73, cadence:.84, weapon:"crossbow" },
  ruth: { coat:0x875043, shirt:0xd4a779, pants:0x4e524b, skin:0xba7b5a, hat:0x57443c, accent:0xe6b264, body:[.31,.33,.37,.34,.27], shoulders:.43, height:1.8, cadence:.93, weapon:"sawedoff" },
  teo: { coat:0x5b684d, shirt:0xd9c6aa, pants:0x555046, skin:0x9c684e, hat:0x463c30, accent:0xd4a869, body:[.25,.28,.3,.29,.22], shoulders:.37, height:1.86, cadence:.72, weapon:"repeater" },
};
const material = (color, metalness=0) => new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.48:.91,flatShading:true});
function makeHero(id, spec) {
  const root = new THREE.Group(); root.name=id;
  const cloth=material(spec.coat),shirt=material(spec.shirt),trousers=material(spec.pants),
    skin=material(spec.skin),hat=material(spec.hat),trim=material(spec.accent,.25),
    hair=material(["rosa","ada"].includes(id)?0x251d23:id==="silas"?0x161820:0x272224),
    boot=material(0x282324),metal=material(0x7b8388,.78),shadow=material(0x322d28);
  const group=(parent,name,x=0,y=0,z=0)=>{const node=new THREE.Group();node.name=name;node.position.set(x,y,z);parent.add(node);return node;};
  const mesh=(parent,geo,mat,x=0,y=0,z=0)=>{const obj=new THREE.Mesh(geo,mat);obj.position.set(x,y,z);parent.add(obj);return obj;};
  const orb=(parent,rad,scale,mat,x=0,y=0,z=0)=>{const o=mesh(parent,new THREE.SphereGeometry(rad,12,8),mat,x,y,z);o.scale.set(...scale);return o;};
  const cyl=(parent,top,bottom,height,mat,x=0,y=0,z=0,sides=12)=>mesh(parent,new THREE.CylinderGeometry(top,bottom,height,sides),mat,x,y,z);
  const torso=(parent,radii,mat,yBase=0)=> {
    const pts=[];for(let i=0;i<radii.length;i++)pts.push(new THREE.Vector2(radii[i],yBase+i*.17));
    const body=mesh(parent,new THREE.LatheGeometry(pts,14),mat);
    body.scale.z=.76;
    return body;
  };
  const hips=group(root,"Hips",0,1.02,0);
  const chest=group(hips,"Chest",0,.03,0);
  torso(chest,spec.body,cloth,.02);
  orb(chest,.23,[.88,.8,.55],shirt,0,.58,.18);
  // Seam, vest and collar break up the silhouette with thin fitted surfaces.
  for(const sign of [-1,1]){
    const lapel=mesh(chest,new THREE.ConeGeometry(.115,.53,5),trim,sign*.19,.43,.235);
    lapel.rotation.z=sign*.21;
    orb(chest,.08,[.86,.55,.7],cloth,sign*spec.shoulders,.59,.03);
    const tail=mesh(hips,new THREE.ConeGeometry(id==="labuta"?.38:.26,.8,9,1,true,0,Math.PI),cloth,sign*.19,-.2,-.1);
    tail.rotation.z=sign*.12;
  }
  if(id==="labuta"){
    const belly=orb(chest,.4,[1.13,.85,.74],cloth,0,.19,.14);
    orb(belly,.14,[.55,.5,.2],trim,0,.15,.95);
    for(const sign of [-1,1]){
      const epaulette=orb(chest,.15,[1.3,.35,1.0],trim,sign*.42,.56,.01);
      epaulette.rotation.z=sign*.11;
    }
    for(let n=0;n<4;n++)cyl(chest,.018,.018,.085,trim,-.1+n*.067,.48,.235,6);
  }
  if(id==="rosa"||id==="ada"){
    // A short open poncho, long hair and twin holsters distinguish her profile.
    const cape=torso(chest,[.26,.35,.39,.26],trim,.33); cape.scale.z=.96;
    cape.material=material(0x9a6357);cape.position.y=-.05;
    for(const sign of [-1,1])cyl(hips,.092,.063,.26,shadow,sign*.29,-.1,.24,9);
  }
  if(id==="elias"){
    for(let i=0;i<3;i++)cyl(chest,.016,.016,.27,trim,-.18+i*.17,.3,.25,6).rotation.z=.12;
    const strap=cyl(chest,.024,.024,.93,shadow,-.15,.35,.17,8);strap.rotation.z=-.46;
    cyl(hips,.12,.12,.38,hat,.4,-.08,-.19,10);
  }
  if(id==="silas"){
    const cape=mesh(chest,new THREE.ConeGeometry(.56,1.12,12,1,true,0,Math.PI*1.35),cloth,.09,.25,-.18);
    cape.rotation.z=.12;
    cyl(chest,.3,.28,.11,hat,0,.53,0,12);
  }
  cyl(hips,id==="labuta"?.42:.3,id==="labuta"?.42:.3,.13,shadow,0,-.05,0);
  const buckle=mesh(hips,new THREE.TorusGeometry(.075,.017,6,10),trim,0,-.04,.27);
  buckle.scale.y=.74;
  for(const sign of [-1,1]){
    const leg=group(hips,sign<0?"LegL":"LegR",sign*(id==="labuta"?.22:.18),-.08,0);
    cyl(leg,.14,.115,.49,trousers,0,-.24,0);
    const knee=group(leg,sign<0?"KneeL":"KneeR",0,-.48,0);
    cyl(knee,.12,.095,.44,trousers,0,-.22,0);
    cyl(knee,.12,.13,.27,boot,0,-.57,.01);
    orb(knee,.15,[.82,.44,1.5],boot,0,-.7,.12);
  }
  const neck=cyl(chest,.12,.135,.22,skin,0,.76,.012);
  const head=group(chest,"Head",0,.92,.02);
  orb(head,.22,[id==="labuta"?1.13:.92,1.14,.84],skin,0,.025,0);
  orb(head,.1,[.62,.73,.73],skin,0,-.05,.2);
  orb(head,.2,[1,.42,.85],hair,0,.24,-.03);
  for(const sign of [-1,1]){
    orb(head,.05,[.6,1,.47],skin,sign*.215,-.02,0);
    orb(head,.023,[1,.7,.54],shadow,sign*.085,.035,.185);
    orb(head,.065,[1,.18,.21],hair,sign*.085,.09,.175);
  }
  if(id==="labuta"){
    for(const sign of [-1,1])orb(head,.12,[.78,.2,.3],hair,sign*.07,-.14,.198).rotation.z=sign*.17;
  } else if(id==="rosa"){
    for(const sign of [-1,1])cyl(head,.065,.037,.44,hair,sign*.19,-.15,-.07,9).rotation.z=sign*.09;
    const braid=group(head,"BraidR",-.2,-.21,-.11);
    for(let n=0;n<4;n++)orb(braid,.07,[.75,.86,.79],hair,0,-n*.12,0);
  } else if(id==="elias"){
    orb(head,.13,[1,.22,.45],hair,0,-.145,.17);
  } else {
    orb(head,.12,[1.2,.26,.44],shadow,0,-.16,.16);
    for(const sign of [-1,1])orb(head,.15,[.52,.11,.5],hair,sign*.07,-.105,.205);
  }
  const brimRadius=id==="elias"?.29:id==="labuta"?.31:.48;
  cyl(head,brimRadius,brimRadius,.038,hat,0,.26,0,16).scale.z=id==="labuta"?.8:.83;
  cyl(head,id==="elias"?.24:.21,.24,id==="silas"?.38:.27,hat,0,.4,0,12);
  cyl(head,.23,.23,.045,trim,0,.32,0,12);
  if(id==="elias"){orb(head,.085,[1,1,.3],trim,0,.37,.23);orb(head,.062,[1,1,.25],material(0xffeabc),0,.37,.27);}
  if(id==="silas"){const feather=orb(head,.16,[.18,1,.13],trim,.2,.62,0);feather.rotation.z=-.3;}
  // Smooth, tapered sleeves and hands. Animation only rotates these parents.
  for(const sign of [-1,1]){
    const arm=group(chest,sign<0?"ArmL":"ArmR",sign*spec.shoulders,.58,0);
    cyl(arm,.135,.105,.43,cloth,sign*.055,-.21,0,11).rotation.z=sign*.16;
    const elbow=group(arm,sign<0?"ElbowL":"ElbowR",sign*.1,-.39,0);
    cyl(elbow,.1,.074,.35,cloth,0,-.15,0,10);
    orb(elbow,.094,[.85,1.18,.84],skin,0,-.35,.01);
    if(sign===1){
      const grip=group(elbow,id==="rosa"?"RevolverR":"Revolver",0,-.39,.11);
      if(["shotgun","rifle","crossbow","sawedoff","repeater"].includes(spec.weapon)){
        cyl(grip,.07,.085,1.05,metal,0,.02,.47,10).rotation.x=Math.PI/2;
        cyl(grip,.055,.075,.46,shadow,0,-.07,.11,9).rotation.x=Math.PI/2;
        if(["shotgun","sawedoff","crossbow"].includes(spec.weapon))cyl(grip,.057,.06,spec.weapon==="crossbow"?.45:1.05,metal,.115,.02,.47,9).rotation.x=Math.PI/2;
      } else if(spec.weapon==="knives"){
        const blade=mesh(grip,new THREE.ConeGeometry(.09,.52,5),metal,0,-.02,.29);
        blade.rotation.x=Math.PI/2;
      } else {
        cyl(grip,.07,.075,.43,metal,0,-.035,.18,9).rotation.x=Math.PI/2;
        cyl(grip,.105,.105,.15,shadow,0,-.03,.07,9).rotation.x=Math.PI/2;
      }
    }
    if((id==="rosa"||id==="ruth")&&sign<0){
      const pistol=group(elbow,"LeftRevolver",0,-.39,.11);
      cyl(pistol,.07,.075,.38,metal,0,-.03,.2,9).rotation.x=Math.PI/2;
    }
  }
  const qtrack=(part,times,angles,axis="x")=>new THREE.QuaternionKeyframeTrack(part+".quaternion",times,angles.flatMap(angle=>{
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(axis==="x"?angle:0,axis==="y"?angle:0,axis==="z"?angle:0));
    return [q.x,q.y,q.z,q.w];
  }));
  const clip=(name,duration,defs)=>new THREE.AnimationClip(name,duration,defs.map(([part,times,angles,axis])=>qtrack(part,times,angles,axis)));
  const idle=clip("Idle",2,[["Chest",[0,1,2],[0,.024,0]],["Head",[0,1,2],[-.03,.03,-.03]],["ArmR",[0,1,2],[0,-.035,0]]]);
  const t=[0,spec.cadence*.25,spec.cadence*.5,spec.cadence*.75,spec.cadence];
  const stride=id==="labuta"?.38:id==="rosa"?.57:.49;
  const walk=clip("Walk",spec.cadence,[
    ["LegL",t,[stride,0,-stride,0,stride]],["LegR",t,[-stride,0,stride,0,-stride]],
    ["KneeL",t,[0,.3,0,.02,0]],["KneeR",t,[0,.02,0,.3,0]],
    ["ArmL",t,[-.2,0,.2,0,-.2]],["ArmR",t,[.2,0,-.2,0,.2]],
    ["Chest",t,[.07,0,-.07,0,.07],"y"],
  ]);
  const primary=clip("Primary",id==="labuta"?.58:.44,[
    ["ArmR",[0,.12,.22,.36,id==="labuta"?.58:.44],[0,-.8,-1.3,-.9,0]],
    ["ElbowR",[0,.12,.22,.36,id==="labuta"?.58:.44],[0,-.18,-.32,-.12,0]],
    ["ArmL",[0,.12,.22,.36,id==="labuta"?.58:.44],[0,-.22,-.42,-.2,0]],
    ["Chest",[0,.12,.22,.36,id==="labuta"?.58:.44],[0,-.1,-.24,.04,0],"y"],
  ]);
  const shot=clip("Shot",.28,[["ArmL",[0,.1,.19,.28],[0,-1.1,-1.24,0]],["Chest",[0,.1,.19,.28],[0,-.06,-.15,0]]]);
  const thrown=clip("Throw",.61,[["ArmL",[0,.18,.37,.61],[0,.7,-1.5,0]]]);
  const hurt=clip("Hurt",.5,[["Chest",[0,.13,.36,.5],[0,.18,-.04,0]],["Head",[0,.13,.5],[0,-.13,0]]]);
  return {root,animations:[idle,walk,primary,shot,thrown,hurt]};
}
const exporter=new GLTFExporter();
for(const [id,spec] of Object.entries(designs)){
  const {root,animations}=makeHero(id,spec);
  const glb=await exporter.parseAsync(root,{binary:true,animations,onlyVisible:false,trs:true});
  await writeFile(new URL("../assets/models/"+id+".glb",import.meta.url),Buffer.from(glb));
  console.log(id+": "+Math.round(glb.byteLength/1024)+" KiB, "+animations.length+" animations");
}
