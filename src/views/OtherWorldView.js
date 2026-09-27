import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MAPS } from "../config/mapConfig.js";

// A cena permanece plana para manter a colisão 2.5D; postes, galerias e fachadas
// são batched por material/forma, evitando centenas de draw calls.
export function buildOtherWorld(scene, props, mapId, quality = "normal", colliders = []) {
  const high = quality === "high";
  const config = MAPS[mapId];
  const ground = new THREE.PlaneGeometry(240, 240, high ? 108 : 60, high ? 108 : 60);
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
  const groundMesh = new THREE.Mesh(ground,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  groundMesh.receiveShadow = high;
  scene.add(groundMesh);
  const dummy=new THREE.Object3D(), groups=new Map(), glows=[];
  function collect(key, geometry, material, x,y,z,sx,sy,sz,rotation=0) {
    if(key!=='rock'&&y-sy*.5<1.3&&y+sy*.5>.25){
      geometry.computeBoundingBox();const b=geometry.boundingBox;
      const halfX=Math.max(Math.abs(b.min.x),Math.abs(b.max.x))*sx,halfZ=Math.max(Math.abs(b.min.z),Math.abs(b.max.z))*sz;
      colliders.push({x,z,halfX,halfZ,rotation,radius:Math.hypot(halfX,halfZ),type:'visual-collider'});
    }
    if(!groups.has(key))groups.set(key,{geometry,material,transforms:[]});
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,rotation,0);dummy.updateMatrix();
    groups.get(key).transforms.push(dummy.matrix.clone());
  }
  const box=high?new RoundedBoxGeometry(1,1,1,3,.075):new THREE.BoxGeometry(1,1,1);
  const rock=high?new THREE.IcosahedronGeometry(1,2):new THREE.DodecahedronGeometry(1,0);
  const rustColor={cemetery:0x262b31,glassMarsh:0x263b39,midnightSaloon:0x34262d,crowFortress:0x282837,forsakenRail:0x3c3335}[mapId]||0x4b3933;
  const woodColor={cemetery:0x4c534e,mine:0x493b38,midnightSaloon:0x644136,glassMarsh:0x46574b,crowFortress:0x393747,forsakenRail:0x51413c,bellTown:0x57453f}[mapId]||0x784b3e;
  const wallColor={cemetery:0x879086,canyon:0xcc8060,mine:0x77625a,glassMarsh:0x627c70,midnightSaloon:0x8c634d,crowFortress:0x777187,forsakenRail:0x74625a,bellTown:0x9b8067}[mapId]||0xae8064;
  const rust=new THREE.MeshStandardMaterial({color:rustColor,roughness:1,flatShading:!high});
  const wood=new THREE.MeshStandardMaterial({color:woodColor,roughness:1,flatShading:!high});
  const wall=new THREE.MeshStandardMaterial({color:wallColor,roughness:1,flatShading:!high});
  const lamp=new THREE.MeshBasicMaterial({color:mapId==='cemetery'||mapId==='glassMarsh'||mapId==='crowFortress'?0x9bd7ed:0xffd887});
  const salt=new THREE.MeshStandardMaterial({color:0xc8d1d0,roughness:.72,metalness:.08,flatShading:true});
  const ember=new THREE.MeshBasicMaterial({color:0xff7141});
  const moon=new THREE.MeshBasicMaterial({color:0xb8c7ff});
  const thorn=new THREE.MeshStandardMaterial({color:0x556341,roughness:1,flatShading:true});
  for(const prop of props) if(prop.type==='rock')
    collect('rock',rock,rust,prop.x,prop.size*0.55,prop.z,prop.size,prop.size*0.75,prop.size,prop.x);
  if(mapId==='saltFlats'){
    const crystal=new THREE.ConeGeometry(1,1,high?9:5,high?2:1);
    for(let i=-13;i<=13;i++)for(const side of [-1,1]){
      const z=i*8,x=side*(13+(i%4)*2);
      collect('saltSpire',crystal,salt,x,1.8,z,.8,3.6,.8,i*.3);
      if(i%2===0)collect('saltCluster',rock,wall,x+side*3,.55,z+3,1.5,.75,1.2);
      if(i%4===0){collect('saltGlow',rock,lamp,side*5,.65,z,.45,1.3,.45);glows.push([side*5,z,2]);}
    }
  }else if(mapId==='emberFoundry'){
    for(let i=-9;i<=9;i++)for(const side of [-1,1]){
      const z=i*12,x=side*(17+(i%3)*2);
      collect('foundryStack',box,wall,x,3,z,4,6,5);collect('chimney',box,rust,x,8,z,1.3,10,1.5);
      collect('furnace',box,ember,side*9,1.5,z,1.5,2.2,1.1);
      if(i%3===0){collect('slag',rock,rust,side*27,.8,z+4,3,1.3,2);glows.push([side*9,z,2.5]);}
    }
  }else if(mapId==='moonMonastery'){
    for(let i=-10;i<=10;i++)for(const side of [-1,1]){
      const z=i*10;
      collect('moonPillar',box,wall,side*16,3.5,z,1.2,7,1.4);
      collect('moonArch',box,lamp,side*16,7,z,15,.45,1,i*.08);
      if(i%3===0){collect('moonBell',rock,moon,side*24,5,z+2,1,1.5,1);glows.push([side*24,z+2,2.5]);}
    }
    collect('eclipseMoon',new THREE.SphereGeometry(1,10,8),moon,0,28,-92,8,8,2);
  }else if(mapId==='thornGarden'){
    for(let i=-12;i<=12;i++)for(const side of [-1,1]){
      const z=i*9,x=side*(14+(i%4)*2);
      collect('thornTrunk',rock,wood,x,3,z,1.4,6,1.2,i*.1);
      for(const end of [-1,1])collect('thornBranch',box,thorn,x+end*1.8,4.1,z,.24,3,.24,end*.65);
      if(i%2===0)collect('thornBloom',rock,lamp,x-side*2,.6,z+2,.8,1,.8);
    }
  }else if(mapId==='lastDawn'){
    const obelisk=new THREE.ConeGeometry(1,1,high?9:5,high?2:1);
    for(let i=-8;i<=8;i++)for(const side of [-1,1]){
      const z=i*14,x=side*(18+(i%3)*2);
      collect('dawnObelisk',obelisk,wall,x,4.2,z,1.5,8.4,1.5,i*.18);
      collect('dawnRune',rock,lamp,x,7.7,z,1.1,.6,1.1);
      if(i%2===0)glows.push([x,z,3.5]);
    }
  }
  if(mapId==='saltFlats'||mapId==='emberFoundry'||mapId==='moonMonastery'||mapId==='thornGarden'||mapId==='lastDawn'){
    // Distinct silhouettes flank the broad, open combat lane.
  }else if(mapId==='mine') {
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
  }else if(mapId==='bellTown'){
    for(let i=-8;i<=8;i++){
      const z=i*14;
      for(const side of [-1,1]){
        const x=side*(12+(i%3)*2);
        collect('house',box,wall,x,2.5,z,7,5,8);
        collect('roof',rock,wood,x,5.1,z,5.4,1.4,5.5);
        collect('porch',box,wood,x-side*3.6,2.4,z,1,4.8,8);
        collect('bellTower',box,rust,side*31,4.8,z,2,9.6,2);
        collect('bell',rock,lamp,side*31,9.8,z,1.6,1.4,1.6);
        if(i%2===0)glows.push([side*31,z,3.2]);
      }
    }
  }else if(mapId==='glassMarsh'){
    for(let i=-13;i<=13;i++)for(const side of [-1,1]){
      const z=i*8,x=side*(10+(i%4)*3);
      collect('reed',box,wood,x,.95,z,.15,1.9,.15,i*.23);
      collect('reedTop',rock,wall,x+side*.18,1.85,z,.4,.65,.38,i*.23);
      if(i%3===0)collect('deadTree',rock,rust,x+side*7,2.1,z+3,1.4,4.2,1.3,i);
      if(i%4===0)collect('glassShard',rock,lamp,side*4,.65,z+2,.5,1.3,.5,i);
    }
  }else if(mapId==='midnightSaloon'){
    // Open dance floor; booths, tables, and the bar stay along the walls.
    for(const side of [-1,1]){
      collect('wall',box,wall,side*17,4.5,0,1,9,116);
      for(let i=-5;i<=5;i++){
        const z=i*18;
        collect('booth',box,wood,side*13,1.05,z,5,1.9,8);
        collect('table',box,rust,side*9,1.15,z,2.4,2.3,2.6);
        collect('stool',rock,wood,side*7,z%2?1.2:.15,z+2,.55,.7,.55);
        if(i%2===0){collect('sconce',box,lamp,side*16,5,z,.2,.55,.2);glows.push([side*15,z,3]);}
      }
    }
    collect('bar',box,wood,0,1.55,-28,28,3.1,5);
    collect('barTop',box,wall,0,3.2,-28,29,0.35,5.5);
    collect('mirror',box,rust,0,6.1,-31,18,4.8,.35);
    collect('stage',box,wood,0,.45,43,36,.9,12);
    collect('piano',box,rust,11,1.3,42,8,2.6,4);
    for(let i=-8;i<=8;i++)collect('ceilingBeam',box,wood,i*2.2,8.7,0,.4,.45,118);
  }else if(mapId==='forsakenRail'){
    for(let i=-20;i<=20;i++){
      const z=i*6;
      if(i%3===0)for(const side of [-1,1]){
        collect('telegraph',box,rust,side*16,4.2,z,2,8.4,2);
        collect('wire',box,wood,side*10,8.4,z,12,.12,.12);
      }
    }
  }else if(mapId==='crowFortress'){
    for(let i=-11;i<=11;i++){
      const z=i*9;
      for(const side of [-1,1]){
        const x=side*(20+(i%3)*2);
        collect('battlement',box,wall,x,3.4,z,5,6.8,7);
        collect('parapet',box,rust,x,7,z,6,1,8);
        if(i%3===0){
          collect('tower',rock,wood,side*36,5.2,z,5,10.4,5);
          collect('spire',rock,lamp,side*36,11,z,1.2,2.2,1.2);
          glows.push([side*36,z,2.8]);
        }
      }
    }
    for(let i=-12;i<=12;i++)collect('ironGate',box,rust,i*2,3.6,-103,.18,7.2,.7);
  }else if(mapId==='town'){
    // Supplied storefronts replace the former box buildings. The street stays open.
    for(let i=-5;i<=5;i++)for(const side of [-1,1]){
      collect('lampPost',box,wood,side*6,1.55,i*21,.14,3.1,.14);
      collect('light',box,lamp,side*6,3.2,i*21,.3,.3,.3);
      if(i%2===0)glows.push([side*6,i*21,2]);
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
    mesh.castShadow=high;
    mesh.receiveShadow=high;
    scene.add(mesh);
  }
  if(high){
    // Fine, low-contrast gravel catches the stage light without changing the
    // open combat lane. One instanced batch keeps the extra detail inexpensive.
    const detailGeometry=new THREE.IcosahedronGeometry(.5,1);
    const detailMaterial=new THREE.MeshStandardMaterial({
      color:new THREE.Color(config.ground).lerp(new THREE.Color(config.warm),.12),
      roughness:.96,
      flatShading:false,
    });
    const details=new THREE.InstancedMesh(detailGeometry,detailMaterial,520);
    for(let i=0;i<520;i++){
      const x=Math.sin(i*91.71)*116,z=Math.cos(i*53.17)*116;
      dummy.position.set(x,.035+(i%4)*.005,z);
      dummy.rotation.set(i*.17,i*2.39996,i*.31);
      const scale=.12+(i%7)*.035;
      dummy.scale.set(scale,.035+(i%3)*.012,scale*(.7+(i%5)*.08));
      dummy.updateMatrix();
      details.setMatrixAt(i,dummy.matrix);
    }
    details.instanceMatrix.needsUpdate=true;
    details.receiveShadow=true;
    scene.add(details);
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
