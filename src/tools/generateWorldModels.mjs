// Gera os modelos e clips GLB sem Blender: node src/tools/generateWorldModels.mjs
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";
import { createBat } from "../views/CharacterFactory.js";
import { createChupacabra } from "../views/ChupacabraFactory.js";
import { createVulture } from "../views/VultureFactory.js";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result=result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result="data:"+blob.type+";base64,"+Buffer.from(result).toString("base64"); this.onloadend?.(); }); }
};
const mat=(color,emissive=0)=>new THREE.MeshStandardMaterial({color,emissive,roughness:0.9,flatShading:true});
const bone=mat(0xdec79e), coal=mat(0x29272b), leather=mat(0x70513c), metal=mat(0x848d90), 
  amber=mat(0xe7933a,0x9b4a10), ghost=mat(0x515965,0x1b272d), red=mat(0xa65c42,0x561b0c);
const part=(parent,geo,material,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
const group=(parent,name,x=0,y=0,z=0)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;};
const box=(parent,w,h,d,material,x=0,y=0,z=0)=>part(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
const cyl=(parent,top,bottom,height,material,x=0,y=0,z=0)=>part(parent,new THREE.CylinderGeometry(top,bottom,height,8),material,x,y,z);
const sphere=(parent,rx,ry,rz,material,x=0,y=0,z=0)=>{const m=part(parent,new THREE.SphereGeometry(1,9,6),material,x,y,z);m.scale.set(rx,ry,rz);return m;};
function track(node,axis,times,angles){
  const values=[];
  for(const angle of angles){
    const e=new THREE.Euler(axis==="x"?angle:0,axis==="y"?angle:0,axis==="z"?angle:0);
    const q=new THREE.Quaternion().setFromEuler(e);
    values.push(q.x,q.y,q.z,q.w);
  }
  return new THREE.QuaternionKeyframeTrack(node+".quaternion",times,values);
}
const clip=(name,duration,tracks)=>new THREE.AnimationClip(name,duration,tracks);
const time=[0,0.18,0.36,0.54,0.72];

function bat() {
  const root=createBat();root.name="Bat";
  root.children.filter(child=>child.isGroup).forEach((wing,i)=>{wing.name=i?"WingR":"WingL";});
  sphere(root,0.09,0.06,0.04,red,0,0.0,0.2);
  return {root,clips:[clip("Fly",0.72,[
    track("WingL","y",time,[0,0.82,0,-0.64,0]),
    track("WingR","y",time,[0,-0.82,0,0.64,0]),
  ])]};
}
function dog(){
  const root=createChupacabra();root.name="Chupacabra";
  for(const sign of [-1,1]){
    sphere(root,0.08,0.05,0.045,red,sign*0.16,0.86,0.99);
    const ridge=cyl(root,0.07,0.09,0.3,bone,sign*0.18,1.1,-0.37);
    ridge.rotation.z=sign*0.32;
  }
  return {root,clips:[clip("Run",0.55,[0,1,2,3].map(i=>
    track("dog-leg-"+i,"x",[0,0.14,0.27,0.41,0.55],[0,i%2?0.55:-0.55,0,i%2?-0.55:0.55,0]))) ]};
}
function vulture(){
  const root=createVulture();root.name="Vulture";
  for(const sign of [-1,1]){
    sphere(root,0.04,0.05,0.03,amber,sign*0.12,0.23,0.69);
    for(let i=0;i<3;i++){
      const talon=cyl(root,0.025,0.025,0.22,bone,sign*0.16,-0.32,0.2+i*0.06);
      talon.rotation.x=-0.22;
    }
  }
  return {root,clips:[clip("Fly",0.72,[
    track("vulture-wing--1","z",time,[0,0.5,0,-0.45,0]),
    track("vulture-wing-1","z",time,[0,-0.5,0,0.45,0]),
  ])]};
}

function revenant(kind){
  const root=new THREE.Group();
  root.name=kind==="marshal"?"Xerife das Sombras":kind==="boss"?"Coveiro Maldito":kind==="miner"?"Espectro Mineiro":"Esqueleto Pistoleiro";
  const isMarshal=kind==="marshal",isBoss=kind==="boss"||isMarshal,isMiner=kind==="miner";
  const coat=isMarshal?ghost:isBoss?coal:isMiner?ghost:leather;
  const frame=group(root,"Frame");
  const body=cyl(frame,isBoss?0.46:0.3,isBoss?0.39:0.26,isBoss?1.1:0.78,coat,0,isBoss?1.65:1.27,0);
  body.scale.z=0.72;
  const drape=cyl(frame,isBoss?0.34:0.25,isBoss?0.56:0.40,isBoss?0.85:0.48,coat,0,isBoss?0.79:0.78,-0.07);
  drape.scale.z=0.68;
  sphere(frame,0.16,0.24,0.14,bone,0,isBoss?2.32:1.83,0);
  const head=group(frame,"Head",0,isBoss?2.42:1.92,0.02);
  sphere(head,isBoss?0.31:0.23,isBoss?0.33:0.26,isBoss?0.27:0.22,isMiner?ghost:bone,0,0,0);
  for(const s of [-1,1]){
    sphere(head,0.047,0.058,0.03,isMiner?amber:red,s*0.10,0.03,isBoss?0.262:0.211);
  }
  const hat=cyl(head,isBoss?0.53:0.40,isBoss?0.53:0.40,0.06,coat,0,0.30,0);
  hat.scale.z=0.8;
  cyl(head,isBoss?0.28:0.22,isBoss?0.34:0.27,isBoss?0.36:0.25,coat,0,0.48,0);
  if(isMiner){
    const lamp=cyl(head,0.14,0.14,0.06,metal,0,0.43,0.25);lamp.rotation.x=Math.PI/2;
    sphere(head,0.08,0.08,0.04,amber,0,0.43,0.31);
  }
  const tracks=[];
  for(const s of [-1,1]){
    const side=s<0?"L":"R";
    const leg=group(frame,"Leg"+side,s*(isBoss?0.24:0.18),isBoss?1.16:0.96,0);
    cyl(leg,isBoss?0.16:0.12,0.095,isBoss?0.83:0.70,isMiner?ghost:coat,0,-(isBoss?0.37:0.30),0);
    sphere(leg,0.15,0.08,0.23,coal,0,isBoss?-0.80:-0.67,0.08);
    const arm=group(frame,"Arm"+side,s*(isBoss?0.46:0.35),isBoss?2.0:1.51,0);
    cyl(arm,isBoss?0.16:0.13,0.08,isBoss?0.84:0.61,coat,0,isBoss?-0.40:-0.3,0);
    sphere(arm,0.095,0.12,0.08,bone,0,isBoss?-0.83:-0.62,0);
    tracks.push(track("Leg"+side,"x",[0,0.3,0.6],s<0?[0.35,-0.35,0.35]:[-0.35,0.35,-0.35]));
    tracks.push(track("Arm"+side,"x",[0,0.3,0.6],s<0?[-0.22,0.22,-0.22]:[0.22,-0.22,0.22]));
    if(s>0){
      if(isBoss){
        const spade=cyl(arm,0.042,0.042,1.04,metal,0,-1.1,0.1);spade.rotation.x=-0.25;
        box(arm,0.48,0.23,0.18,metal,0,-1.55,0.16);
      }else if(isMiner){
        const pick=cyl(arm,0.04,0.04,0.69,metal,0,-0.85,0.1);pick.rotation.x=-0.2;
        box(arm,0.49,0.09,0.1,metal,0,-1.15,0.25);
      }else{
        const gun=group(arm,"Gun",0,-0.69,0.1);
        box(gun,0.11,0.13,0.39,metal,0,0,0.19);
        box(gun,0.09,0.18,0.1,leather,0,-0.1,0);
      }
    }
  }
  if(isBoss) root.scale.setScalar(1.33);
  if(isMarshal){
    const badge=sphere(frame,0.13,0.13,0.024,amber,0,1.85,0.34);
    badge.rotation.z=Math.PI/4;
    for(const side of [-1,1]){
      const holster=box(frame,0.2,0.39,0.14,leather,side*0.39,0.93,0.06);
      holster.rotation.z=side*0.13;
    }
    cyl(head,0.26,0.27,0.07,red,0,0.38,0);
  }
  const walk=clip("Walk",0.6,tracks);
  const attack=clip(isBoss?"Attack":isMiner?"Lurch":"Shoot",0.58,[
    track("ArmR","x",[0,0.18,0.36,0.58],[0,-0.8,-1.6,0]),
    track("Head","x",[0,0.3,0.58],[0,0.12,0]),
  ]);
  return {root,clips:[walk,attack]};
}

function merchant(){
  const root=new THREE.Group();root.name="BentoMercador";
  const dark=mat(0x333843), hide=mat(0x655642), copper=mat(0xaa834b);
  const lowSphere=(parent,rx,ry,rz,material,x,y,z,segments=6)=>{
    const mesh=part(parent,new THREE.SphereGeometry(1,segments,4),material,x,y,z);
    mesh.scale.set(rx,ry,rz);return mesh;
  };
  const body=group(root,"Body");
  cyl(body,0.44,0.63,1.65,dark,0,1.13,0);
  for(let i=0;i<3;i++)box(body,0.8,0.035,0.055,copper,0,0.7+i*0.38,0.48);
  for(const side of [-1,1])box(body,0.22,0.31,0.17,hide,side*0.31,1.05,0.48);
  part(body,new THREE.CircleGeometry(0.09,6),copper,0,1.92,0.485);
  const pack=box(body,0.96,1.07,0.58,hide,0,1.40,-0.46);
  pack.rotation.z=0.05;
  for(const side of [-1,1]){
    box(body,0.12,1.44,0.13,copper,side*0.35,1.45,-0.17).rotation.z=side*0.09;
    box(body,0.24,0.33,0.16,hide,side*0.41,1.02,0.37);
    cyl(body,0.12,0.15,0.9,dark,side*0.24,0.40,0);
    lowSphere(body,0.18,0.09,0.29,coal,side*0.25,0.10,0.16);
  }
  const head=group(body,"Head",0,2.27,0);
  lowSphere(head,0.36,0.37,0.34,dark,0,0,0,7);
  lowSphere(head,0.265,0.24,0.06,coal,0,-0.03,0.31);
  box(head,0.51,0.18,0.16,hide,0,-0.22,0.35);
  for(const side of [-1,1]){
    part(head,new THREE.OctahedronGeometry(0.038,0),amber,side*0.11,0.035,0.367);
    const arm=group(body,side<0?"ArmL":"ArmR",side*0.43,1.88,0);
    cyl(arm,0.14,0.11,0.75,dark,side*0.055,-0.31,0).rotation.z=side*0.15;
    const elbow=group(arm,side<0?"ElbowL":"ElbowR",side*0.08,-0.59,0);
    cyl(elbow,0.11,0.075,0.61,dark,-side*0.31,0.035,0.24).rotation.z=-side*1.05;
    lowSphere(elbow,0.11,0.11,0.09,bone,-side*0.62,0.13,0.45);
  }
  const idle=clip("Idle",2,[track("Body","x",[0,1,2],[0,0.025,0]),track("Head","y",[0,1,2],[-0.05,0.07,-0.05])]);
  const thanks=clip("Thanks",0.9,[track("Body","x",[0,0.4,0.9],[0,0.22,0]),track("ArmR","x",[0,0.4,0.9],[0,-0.9,0]),track("Head","x",[0,0.4,0.9],[0,-0.24,0])]);
  return {root,clips:[idle,thanks]};
}
// Urubus decorativos de menu com 160 triângulos cada.
function menuBird(){
  const root=new THREE.Group();root.name="MenuVulture";
  const wing=mat(0x292621),beak=mat(0xbb8950),eye=mat(0xff9c4a,0x5a220c);
  const body=part(root,new THREE.SphereGeometry(1,7,5),wing,0,0.17,0);
  body.scale.set(0.32,0.42,0.44);
  const head=part(root,new THREE.SphereGeometry(1,5,4),wing,0,0.63,0.25);
  head.scale.set(0.22,0.23,0.21);
  const bill=part(root,new THREE.ConeGeometry(0.12,0.27,10),beak,0,0.54,0.53);
  bill.rotation.x=Math.PI/2;
  for(const sign of [-1,1]){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([
      sign*0.18,0.38,0.02, sign*0.52,0.25,-0.18,sign*0.65,0.06,-0.13,
      sign*0.18,0.38,0.02, sign*0.65,0.06,-0.13,sign*0.37,-0.12,0.10,
      sign*0.18,0.38,0.02,sign*0.37,-0.12,0.10,sign*0.21,0.06,0.30,
    ],3));
    geometry.computeVertexNormals();
    part(root,geometry,new THREE.MeshStandardMaterial({color:0x3d3129,side:THREE.DoubleSide,flatShading:true}));
    const foot=part(root,new THREE.CylinderGeometry(0.024,0.035,0.22,4),beak,sign*0.17,-0.28,0.02);
    foot.rotation.z=sign*0.14;
    part(root,new THREE.OctahedronGeometry(0.027,0),eye,sign*0.13,0.68,0.42);
  }
  return root;
}

function menu(){
  const root=group(new THREE.Group(),"DesertMenu");
  const sand=mat(0xe0ad73),dune=mat(0xcc905e),rust=mat(0x9b6147),cliff=mat(0xbc7952),
    wood=mat(0x6b4c35),cactus=mat(0x67764c);
  const skyGeo=new THREE.PlaneGeometry(70,40,1,14);
  const colors=[],p=skyGeo.attributes.position;
  const sunTop=new THREE.Color(0xba7358),sunLow=new THREE.Color(0xffe7b2);
  for(let i=0;i<p.count;i++){
    const c=sunLow.clone().lerp(sunTop,(p.getY(i)+20)/40);
    colors.push(c.r,c.g,c.b);
  }
  skyGeo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  part(root,skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}),0,5,-25);
  part(root,new THREE.SphereGeometry(2.25,24,14),new THREE.MeshBasicMaterial({color:0xffebb2}),9,6.5,-18);
  box(root,70,1.1,60,sand,0,-1.55,0);
  for(let i=0;i<17;i++){
    const x=Math.sin(i*23.15)*27,z=-15+(i%9)*3.8;
    sphere(root,3+(i%4)*1.1,0.30,2.2+(i%3),i%2?dune:sand,x,-1.05,z).rotation.y=i*0.41;
  }
  for(const [x,z,w,h] of [[-25,-13,7,7],[-12,-17,5,5],[12,-14,5,7],[25,-11,6,8],[3,-16,3,3]]){
    cyl(root,w*0.5,w*0.63,h,cliff,x,h/2-1.6,z).rotation.y=x*0.1;
    cyl(root,w*0.51,w*0.51,0.26,rust,x,h-1.7,z);
  }
  for(let i=0;i<20;i++){
    const x=Math.sin(i*17.2)*27,z=-2+(i%7)*3.4;
    const h=1+(i%4)*0.36;
    cyl(root,0.10,0.12,h,cactus,x,h/2-0.99,z);
    if(i%3===0){
      const b=cyl(root,0.067,0.067,0.48,cactus,x+0.26,h*0.50-0.99,z);
      b.rotation.z=Math.PI/2;
      cyl(root,0.067,0.07,0.43,cactus,x+0.49,h*0.64-0.99,z);
    }
  }
  // Objetos de primeiro plano em posição reservada à direita do menu.
  for(const x of [8.9,14.4])cyl(root,0.13,0.15,2.8,wood,x,0.25,6.7);
  for(const y of [0.0,0.75])box(root,6.5,0.16,0.14,wood,11.7,y,6.7);
  const first=group(root,"BirdFence",11.0,1.8,6.5);
  first.scale.setScalar(1.85);
  first.add(menuBird());
  const skull=group(root,"Skull",5.4,-0.47,9.0);
  skull.scale.setScalar(1.35);
  sphere(skull,0.78,0.45,0.61,bone);
  for(const sign of [-1,1]){
    const horn=cyl(skull,0.02,0.18,1,bone,sign*0.67,0.34,-0.08);
    horn.rotation.z=-sign*0.66;
    sphere(skull,0.18,0.14,0.04,coal,sign*0.29,0.04,0.55);
  }
  sphere(skull,0.16,0.14,0.04,coal,0,-0.23,0.57);
  const second=group(root,"BirdSkull",5.55,0.41,9.0);
  second.scale.setScalar(1.5);
  second.add(menuBird());
  const weed=group(root,"WindWeed",-3,-0.97,7.0);
  for(let i=0;i<9;i++){
    const stalk=cyl(weed,0.02,0.02,0.5,wood,Math.cos(i*2.4)*0.18,0.2,Math.sin(i*2.4)*0.16);
    stalk.rotation.z=(i-4)*0.11;
  }
  return {root,clips:[clip("Wind",2.6,[
    track("BirdFence","x",[0,1.3,2.6],[0,0.045,0]),
    track("BirdSkull","x",[0,0.6,1.3,2,2.6],[0,0.16,0.03,0.20,0]),
    track("WindWeed","y",[0,1.3,2.6],[0,1.5,3.14]),
  ])]};
}

const exporter=new GLTFExporter();
const models={bat:bat(),dog:dog(),vulture:vulture(),skeleton:revenant("skeleton"),
  miner:revenant("miner"),boss:revenant("boss"),marshal:revenant("marshal"),merchant:merchant(),menu:menu()};
const menuTriangles=(()=>{let count=0;menuBird().traverse(obj=>{if(obj.isMesh)count+=obj.geometry.index?obj.geometry.index.count/3:obj.geometry.attributes.position.count/3;});return count;})();
console.log("menu vulture:",menuTriangles,"triangles each");
for(const [name,{root,clips}] of Object.entries(models)){
  const bytes=await exporter.parseAsync(root,{binary:true,animations:clips,trs:true});
  const path=new URL("../assets/models/"+name+".glb",import.meta.url);
  await writeFile(path,Buffer.from(bytes));
  let triangles=0;
  root.traverse(obj=>{if(obj.isMesh)triangles+=obj.geometry.index?obj.geometry.index.count/3:obj.geometry.attributes.position.count/3;});
  console.log(name+": "+Math.round(bytes.byteLength/1024)+" KiB, "+Math.round(triangles)+" triangles, "+clips.map(c=>c.name).join(", "));
}
