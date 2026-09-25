import * as THREE from "three";
import { MAPS } from "../config/mapConfig.js";

// A cena permanece plana para manter a colisão 2.5D; postes, galerias e fachadas
// são batched por material/forma, evitando centenas de draw calls.
export function buildOtherWorld(scene, props, mapId) {
  const config = MAPS[mapId];
  const ground = new THREE.PlaneGeometry(240, 240, 60, 60);
  const colors=[], positions=ground.attributes.position;
  const base=new THREE.Color(config.ground);
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i), z=positions.getY(i);
    const stripe=(Math.sin(x*0.49+Math.cos(z*0.13))*0.12+Math.sin(z*0.68)*0.07);
    const c=base.clone().multiplyScalar(1+stripe);
    colors.push(c.r,c.g,c.b);
  }
  ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  ground.rotateX(-Math.PI/2);
  scene.add(new THREE.Mesh(ground,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
  const dummy=new THREE.Object3D(), groups=new Map(), glows=[];
  function collect(key, geometry, material, x,y,z,sx,sy,sz,rotation=0) {
    if(!groups.has(key))groups.set(key,{geometry,material,transforms:[]});
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,rotation,0);dummy.updateMatrix();
    groups.get(key).transforms.push(dummy.matrix.clone());
  }
  const box=new THREE.BoxGeometry(1,1,1),rock=new THREE.DodecahedronGeometry(1,0);
  const rust=new THREE.MeshStandardMaterial({color:mapId==='cemetery'?0x262b31:0x4b3933,roughness:1,flatShading:true});
  const wood=new THREE.MeshStandardMaterial({color:mapId==='cemetery'?0x4c534e:mapId==='mine'?0x493b38:0x784b3e,roughness:1,flatShading:true});
  const wall=new THREE.MeshStandardMaterial({color:mapId==='cemetery'?0x879086:mapId==='canyon'?0xcc8060:mapId==='mine'?0x77625a:0xae8064,roughness:1,flatShading:true});
  const lamp=new THREE.MeshBasicMaterial({color:mapId==='cemetery'?0x9bd7ed:0xffd887});
  for(const prop of props) if(prop.type==='rock')
    collect('rock',rock,rust,prop.x,prop.size*0.55,prop.z,prop.size,prop.size*0.75,prop.size,prop.x);
  if(mapId==='mine') {
    // Túneis de madeira, trilhos, vagões e lampiões aparecem em toda a mina.
    for(let i=-10;i<=10;i++) {
      const z=i*11;
      for(const side of [-1,1]) {
        collect('post',box,wood,side*11,2.3,z,0.42,4.6,0.42);
        collect('light',box,lamp,side*11,4.7,z,0.47,0.27,0.47);
        if(i%3===0)collect('ore',rock,wall,side*28,0.85,z+3,2.1,1.2,1.7);
      }
      // Os travessões ficam nas laterais para deixar o campo de combate visível.
      for(const side of [-1,1]) collect('beam',box,wood,side*9,4.5,z,4.1,0.34,0.42);
      if(i%2===0){
        collect('cart',box,rust,sideFor(i)*6,0.95,z+3,2.1,1.1,1.5);
        collect('ore',rock,wall,sideFor(i)*6,1.9,z+3,1.1,0.63,0.9);
      }
    }
    for(const side of [-1,1]) collect('rail',box,wood,side*2.35,0.03,0,0.11,0.06,240);
    for(let i=-20;i<=20;i++)collect('tie',box,wood,0,0.045,i*6,5,0.08,0.24);
    for(let i=-10;i<=10;i++)for(const side of [-1,1]){
      collect('lampPost',box,wood,side*5.8,1.6,i*11,0.19,3.2,0.19);
      collect('light',box,lamp,side*5.8,3.25,i*11,0.36,0.36,0.36);
      glows.push([side*5.8,i*11,3.8]);
    }
  }else if(mapId==='canyon'){
    for(let i=-12;i<=12;i++){
      const z=i*9;
      for(const side of [-1,1]){
        const x=side*(23+(i*i%5)*2);
        collect('butte',rock,wall,x,3.8,z,3.5,7.5,3.5,i);
        collect('pillar',rock,rust,x+side*3,2,z+3,1.2,4,1.2);
        if(i%3===0){collect('scaffold',box,wood,side*13,1,z,.32,2,.32);collect('beam',box,wood,side*13,2.2,z,3,.22,.22);}
      }
    }
    for(let i=-14;i<=14;i++)for(const side of [-1,1]){
      collect('fence',box,wood,side*10,.7,i*8,.12,1.4,.13);
      collect('rail',box,wood,side*10,.85,i*8, .16,.15,7.6);
    }
  }else if(mapId==='cemetery'){
    for(let i=-10;i<=10;i++)for(const side of [-1,1]){
      const z=i*10,x=side*(13+(i%3)*4);
      collect('grave',box,wall,x,.58,z,.9,1.16,.3);
      collect('cross',box,wood,x,1.27,z,1,.17,.25);
      collect('fence',box,rust,side*7,.82,z,.12,1.64,.12);
      collect('rail',box,rust,side*7,.8,z,.12,.12,9.7);
      if(i%4===0){collect('obelisk',rock,wall,x+side*5,2,z,1.25,3.5,1.25);collect('light',box,lamp,side*6,1.9,z,.23,.36,.23);glows.push([side*6,z,3]);}
    }
    for(let i=0;i<18;i++){
      const a=i*Math.PI*2/18;
      collect('mausoleum',box,wall,Math.cos(a)*72,2.8,Math.sin(a)*72,3.3,5.6,3.3,a);
    }
  }else{
    // Rua central transitável ladeada por fachadas, marquises e placas.
    for(let i=-5;i<=5;i++) {
      const z=i*21;
      for(const side of [-1,1]){
        collect('facade',box,wall,side*9,2.7,z,6.5,5.4,9);
        collect('roof',box,rust,side*9,5.5,z,7,0.65,10);
        collect('porch',box,wood,side*5.7,3.25,z,2.1,0.34,9);
        for(const end of [-1,1])collect('post',box,wood,side*5.3,1.6,z+end*3.7,0.32,3.2,0.32);
        collect('door',box,rust,side*5.74,1.55,z,0.22,3.1,1.3);
        collect('sign',box,wood,side*5.65,4.2,z,0.20,0.75,3.3);
        collect('cornice',box,wood,side*5.65,4.95,z,0.36,0.22,8.9);
        for(const end of [-1,1]){
          collect('window',box,rust,side*5.72,2.85,z+end*2.7,0.23,0.84,1.05);
          collect('frame',box,wood,side*5.53,2.85,z+end*2.7,0.22,0.12,1.2);
        }
        collect('light',box,lamp,side*5.1,3.18,z,0.27,0.4,0.27);
        glows.push([side*5.1,z,3.2]);
      }
    }
    for(let i=-12;i<=12;i++)for(const side of [-1,1]){
      collect('streetPost',box,wood,side*5.4,1.35,i*9,0.18,2.7,0.18);
      collect('light',box,lamp,side*5.4,2.75,i*9,0.33,0.4,0.33);
      glows.push([side*5.4,i*9,2.8]);
      if(i%3===0)collect('barrel',rock,rust,side*4.4,0.55,i*9+2,0.51,0.75,0.51);
    }
    for(let i=0;i<34;i++){
      const x=(i%2?1:-1)*(37+(i%5)*5),z=-107+i*6.1;
      collect('grave',box,wood,x,0.7,z,0.7,1.4,0.25);
      collect('cross',box,wood,x,1.3,z,0.9,0.17,0.26);
    }
  }
  for(const {geometry,material,transforms} of groups.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);
    transforms.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
  }
  // Um único decalque instanciado dá calor às lâmpadas sem adicionar luzes
  // dinâmicas e sem aumentar o custo conforme o jogador atravessa o cenário.
  const textureCanvas=document.createElement('canvas');
  textureCanvas.width=textureCanvas.height=64;
  const ctx=textureCanvas.getContext('2d');
  const gradient=ctx.createRadialGradient(32,32,1,32,32,31);
  gradient.addColorStop(0,'rgba(255,201,112,.42)');
  gradient.addColorStop(.36,'rgba(255,174,67,.17)');
  gradient.addColorStop(1,'rgba(255,159,56,0)');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,64,64);
  const glowTexture=new THREE.CanvasTexture(textureCanvas);
  const halos=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),glows.length);
  glows.forEach(([x,z,size],i)=>{
    dummy.position.set(x,.055,z);
    dummy.rotation.set(-Math.PI/2,0,0);
    dummy.scale.set(size*2,size*2,1);
    dummy.updateMatrix();
    halos.setMatrixAt(i,dummy.matrix);
  });
  halos.instanceMatrix.needsUpdate=true;
  scene.add(halos);
}
function sideFor(index){return index%4<2?-1:1;}
