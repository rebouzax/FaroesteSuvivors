// Execute com `node src/tools/generateJoaoModel.mjs` na raiz do projeto.
// Produz um GLB independente com rig e clips. Não roda no navegador.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";

// GLTFExporter utiliza FileReader para montar os bytes finais mesmo sem texturas.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buffer => { this.result=buffer; this.onloadend?.(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buffer => { this.result=`data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`; this.onloadend?.(); });
  }
};

const model=new THREE.Group();
model.name="JoaoVaqueiro";
const mat=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:metalness?0.48:0.94,metalness,flatShading:true});
const leather=mat(0x66432e),coatEdge=mat(0x3e3028),lapel=mat(0x926b48),shirt=mat(0xe7dbbf),
  jeans=mat(0x424f58),jeansLight=mat(0x677078),skin=mat(0xbd8765),shadeSkin=mat(0x9b6045),
  hair=mat(0x282524),boots=mat(0x3b2e28),belt=mat(0x352c25),brass=mat(0xc6a66d,0.65),
  steel=mat(0x808b91,0.72),bone=mat(0xf0d7ad),eye=mat(0x292524),cord=mat(0x7c5439);
const group=(parent,name,x=0,y=0,z=0)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;};
const mesh=(parent,geo,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;};
const box=(parent,w,h,d,material,x=0,y=0,z=0)=>mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
const cyl=(parent,rt,rb,h,material,x,y,z,sides=10)=>mesh(parent,new THREE.CylinderGeometry(rt,rb,h,sides),material,x,y,z);
const ellipsoid=(parent,rx,ry,rz,material,x,y,z)=>{const m=mesh(parent,new THREE.SphereGeometry(1,12,9),material,x,y,z);m.scale.set(rx,ry,rz);return m;};
const poly=(parent,coords,depth,material,z)=>{
  const shape=new THREE.Shape();
  coords.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:0.012,bevelSize:0.012,bevelSegments:1,steps:1,curveSegments:1});
  return mesh(parent,geo,material,0,0,z);
};

// Silhueta: casaco duster aberto na frente, cintura marcada e camisa aparente.
const hips=group(model,"Hips",0,0.96,0);
const chest=group(hips,"Chest",0,0.10,0);
const body=cyl(chest,0.28,0.245,0.68,shirt,0,0.34,0,12); body.scale.z=0.82;
ellipsoid(chest,0.32,0.14,0.22,leather,0,0.59,-0.055);
for(const sign of [-1,1]){
  poly(chest,[[sign*0.13,0.69],[sign*0.37,0.55],[sign*0.33,0.08],[sign*0.21,-0.15],[sign*0.13,0.07]],0.085,leather,0.18);
  poly(chest,[[sign*0.13,0.69],[sign*0.29,0.56],[sign*0.16,0.39],[sign*0.095,0.52]],0.045,lapel,0.285);
  box(chest,0.14,0.025,0.022,coatEdge,sign*0.275,0.28,0.277);
  cyl(chest,0.019,0.019,0.017,brass,sign*0.28,0.18,0.29,6).rotation.x=Math.PI/2;
  // Caudas longas de couro, com bainha irregular que oscila junto à cintura.
  const tail=group(hips,sign===1?"CoatTailR":"CoatTailL",sign*0.18,0.11,-0.13);
  poly(tail,[[sign*0.01,0.05],[sign*0.21,-0.02],[sign*0.29,-0.60],[sign*0.24,-0.79],[sign*0.05,-0.71]],0.12,leather,-0.07);
  poly(tail,[[sign*0.05,-0.65],[sign*0.23,-0.72],[sign*0.23,-0.77],[sign*0.08,-0.73]],0.02,coatEdge,0.06);
}
const back=poly(chest,[[-0.32,0.59],[0.32,0.59],[0.34,0.03],[0.28,-0.10],[-0.28,-0.10],[-0.34,0.03]],0.07,leather,-0.24);
back.material.side=THREE.DoubleSide;
box(hips,0.64,0.125,0.42,belt,0,0.01,0);
box(hips,0.14,0.105,0.02,brass,0,0.01,0.22);
box(hips,0.076,0.063,0.032,belt,0,0.01,0.238);
for(let i=0;i<9;i++){
  const x=-0.30+i*0.073;
  const cartridge=cyl(hips,0.021,0.021,0.105,brass,x,0.01,0.221,6);
  cartridge.rotation.z=0.02;
}
const holster=poly(hips,[[-0.43,0.035],[-0.25,-0.03],[-0.30,-0.34],[-0.38,-0.41]],0.1,boots,0.10);
holster.rotation.z=-0.12;
for(let i=0;i<3;i++){
  const coil=mesh(hips,new THREE.TorusGeometry(0.18+i*0.012,0.016,5,22),cord,0.39,-0.17,0.09);
  coil.rotation.y=0.2;coil.position.x+=i*0.012;
}

const head=group(chest,"Head",0,0.84,0.015);
const skull=ellipsoid(head,0.225,0.275,0.19,skin,0,0.005,0.01);
// Mandíbula quadrada, bochechas e nariz; cabelo curto e rosto sem barba.
const jaw=cyl(head,0.19,0.155,0.16,skin,0,-0.14,0.035,8);jaw.scale.z=0.85;
ellipsoid(head,0.066,0.079,0.081,skin,0,-0.045,0.188);
for(const sign of [-1,1]){
  ellipsoid(head,0.042,0.073,0.025,shadeSkin,sign*0.226,-0.025,0);
  ellipsoid(head,0.055,0.021,0.012,eye,sign*0.081,0.027,0.185);
  box(head,0.095,0.027,0.022,hair,sign*0.081,0.095,0.182).rotation.z=sign*0.1;
}
box(head,0.095,0.014,0.015,shadeSkin,0,-0.166,0.177);
ellipsoid(head,0.21,0.10,0.18,hair,0,0.212,0);
// Aba com laterais dobradas e copa poligonal; fita, fivela e barbicacho.
const brimGeo=new THREE.BufferGeometry();
const brimPts=[],brimIdx=[],N=24;
for(let i=0;i<N;i++){
  const a=i*2*Math.PI/N;
  brimPts.push(Math.cos(a)*0.29,0.259,Math.sin(a)*0.235);
  brimPts.push(Math.cos(a)*0.57,0.254+0.11*Math.pow(Math.abs(Math.cos(a)),4),Math.sin(a)*0.44);
  const j=(i+1)%N;
  brimIdx.push(i*2,j*2,i*2+1,i*2+1,j*2,j*2+1);
}
brimGeo.setAttribute("position",new THREE.Float32BufferAttribute(brimPts,3));brimGeo.setIndex(brimIdx);brimGeo.computeVertexNormals();
const brim=mesh(head,brimGeo,leather);brim.material.side=THREE.DoubleSide;
cyl(head,0.24,0.34,0.34,leather,0,0.42,0,11);
cyl(head,0.337,0.342,0.055,coatEdge,0,0.291,0,11);
box(head,0.074,0.049,0.018,brass,0,0.305,0.34);
for(let i=0;i<5;i++) box(head,0.015,0.017,0.017,lapel,0,0.33+i*0.046,0.249-i*0.015);
// Cordão pendurado na lateral do chapéu.
const strap=cyl(head,0.013,0.011,0.36,cord,-0.51,0.02,0.035,6);strap.rotation.z=0.05;

for(const sign of [-1,1]){
  const side=sign===-1?"L":"R";
  const leg=group(model,`Leg${side}`,sign*0.175,0.94,0);
  cyl(leg,0.15,0.115,0.46,jeans,0,-0.22,0,9).scale.z=1.05;
  ellipsoid(leg,0.14,0.105,0.15,jeans,0,-0.42,0);
  const knee=group(leg,`Knee${side}`,0,-0.44,0);
  cyl(knee,0.123,0.09,0.38,jeans,0,-0.18,0.006,9);
  const cuff=cyl(knee,0.105,0.105,0.055,jeansLight,0,-0.36,0.008,9);
  const boot=group(knee,`Boot${side}`,0,-0.32,0);
  cyl(boot,0.108,0.135,0.22,boots,0,-0.06,0,9);
  ellipsoid(boot,0.14,0.085,0.205,boots,0,-0.16,0.092);
  box(boot,0.25,0.047,0.29,coatEdge,0,-0.227,0.07);

  const shoulder=group(chest,`Arm${side}`,sign*0.36,0.57,0);
  const upper=cyl(shoulder,0.13,0.102,0.38,leather,sign*0.045,-0.19,0,10);
  upper.rotation.z=sign*0.12;
  ellipsoid(shoulder,0.15,0.11,0.15,leather,0,-0.025,0);
  const elbow=group(shoulder,`Elbow${side}`,sign*0.07,-0.37,0);
  cyl(elbow,0.105,0.081,0.35,leather,0,-0.16,0,9);
  cyl(elbow,0.10,0.085,0.04,coatEdge,0,-0.33,0,9);
  const hand=group(elbow,`Hand${side}`,0,-0.36,0.015);
  ellipsoid(hand,0.087,0.117,0.077,skin,0,-0.076,0);
  ellipsoid(hand,0.034,0.066,0.035,skin,-sign*0.077,-0.102,0.04).rotation.z=sign*0.4;
  if(sign===-1){
    // Revólver na mão esquerda em repouso; durante o disparo o braço mira.
    const gun=group(hand,"Revolver",0,-0.14,0.052);
    gun.rotation.x=Math.PI/2;
    const handle=box(gun,0.1,0.18,0.085,boots,0,-0.07,0);handle.rotation.x=-0.18;
    const cylinder=cyl(gun,0.086,0.086,0.13,steel,0,0.01,0.077,8);cylinder.rotation.x=Math.PI/2;
    box(gun,0.11,0.10,0.28,steel,0,0.038,0.17);
    const barrel=cyl(gun,0.049,0.05,0.43,steel,0,0.036,0.43,8);barrel.rotation.x=Math.PI/2;
    box(gun,0.03,0.045,0.035,steel,0,0.13,0.35);
  }else{
    cyl(hand,0.032,0.036,0.32,cord,0,-0.195,0.045,7).rotation.x=0.1;
  }
}

// Biblioteca de clipes exportada no próprio GLB; os nomes são consumidos pelo runtime.
const tracks=(items)=>items.map(([name,times,values])=>{
  const quaternions=[];
  for(const angle of values){
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(angle,0,0));
    quaternions.push(q.x,q.y,q.z,q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`,times,quaternions);
});
const animation=(name,duration,items)=>new THREE.AnimationClip(name,duration,tracks(items));
const idle=animation("Idle",2,[
  ["Chest",[0,0.5,1,1.5,2],[0,0.02,0,-0.015,0]],
  ["Head",[0,1,2],[0,0.025,0]],
  ["ArmR",[0,1,2],[0,-0.028,0]],
]);
const walk=animation("Walk",0.8,[
  ["LegL",[0,0.2,0.4,0.6,0.8],[0.52,0,-0.52,0,0.52]],
  ["LegR",[0,0.2,0.4,0.6,0.8],[-0.52,0,0.52,0,-0.52]],
  ["KneeL",[0,0.2,0.4,0.6,0.8],[0,0.48,0,0.08,0]],
  ["KneeR",[0,0.2,0.4,0.6,0.8],[0,0.08,0,0.48,0]],
  ["ArmL",[0,0.2,0.4,0.6,0.8],[-0.34,0,0.34,0,-0.34]],
  ["ArmR",[0,0.2,0.4,0.6,0.8],[0.34,0,-0.34,0,0.34]],
  ["Chest",[0,0.2,0.4,0.6,0.8],[0.03,0,-0.03,0,0.03]],
  ["CoatTailL",[0,0.2,0.4,0.6,0.8],[-0.08,0.04,-0.08,0.04,-0.08]],
  ["CoatTailR",[0,0.2,0.4,0.6,0.8],[0.04,-0.08,0.04,-0.08,0.04]],
]);
const whip=animation("Whip",0.38,[
  ["ArmR",[0,0.07,0.16,0.24,0.38],[0,-1,-2.15,-1.1,0]],
  ["ElbowR",[0,0.07,0.16,0.24,0.38],[0,-0.42,-0.18,0.28,0]],
  ["Chest",[0,0.07,0.16,0.24,0.38],[0,0.05,-0.22,0.13,0]],
]);
const shot=animation("Shot",0.27,[
  ["ArmL",[0,0.06,0.16,0.27],[0,-1.38,-1.53,0]],
  ["ElbowL",[0,0.06,0.16,0.27],[0,-0.12,-0.22,0]],
  ["Chest",[0,0.06,0.16,0.27],[0,-0.06,-0.12,0]],
]);
const thrown=animation("Throw",0.65,[
  ["ArmL",[0,0.2,0.42,0.65],[0,0.75,-1.7,0]],
  ["ElbowL",[0,0.2,0.42,0.65],[0,-0.65,0.16,0]],
]);
const hurt=animation("Hurt",0.5,[
  ["Chest",[0,0.12,0.35,0.5],[0,0.22,-0.06,0]],
  ["Head",[0,0.12,0.5],[0,-0.13,0]],
]);
const exporter=new GLTFExporter();
const result=await exporter.parseAsync(model,{binary:true,animations:[idle,walk,whip,shot,thrown,hurt],onlyVisible:false,trs:true});
const output=new URL("../assets/models/joao-vaqueiro.glb",import.meta.url);
await writeFile(output,Buffer.from(result));
console.log(`Modelo salvo: ${output.pathname} (${(result.byteLength/1024).toFixed(0)} KiB, 6 animações).`);
