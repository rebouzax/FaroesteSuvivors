import * as THREE from "three";

// Geometria compartilhada e instâncias mantêm o deserto amplo com poucas chamadas de desenho.
export function buildDesertWorld(scene, props, detailed = true) {
  const sand = new THREE.PlaneGeometry(240, 240, detailed ? 90 : 55, detailed ? 90 : 55);
  const colors = [];
  const base = new THREE.Color(0x74788b);
  const moon = new THREE.Color(0xaab8d1);
  const shade = new THREE.Color(0x454d65);
  const pos = sand.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getY(i);
    const ridges = Math.sin(x * 0.18 + Math.cos(z * 0.11) * 1.6) * 0.5 + Math.sin(z * 0.38 + x * 0.09) * 0.21;
    const trace = Math.sin(x * 0.034 + z * 0.019);
    const value = ridges * 0.72 + trace * 0.3;
    pos.setZ(i, Math.min(0, value * 0.08)); // terreno transitável plano, ondulações abaixo dos pés
    const tint = base.clone().lerp(value >= 0 ? moon : shade, Math.min(0.78, Math.abs(value) * 1.15));
    colors.push(tint.r, tint.g, tint.b);
  }
  sand.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  sand.rotateX(-Math.PI / 2);
  sand.computeVertexNormals();
  const ground = new THREE.Mesh(sand, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  scene.add(ground);

  // Veios de areia escura pintados com uma única malha instanciada.
  const patches=[];
  const patchDummy=new THREE.Object3D();
  for(let i=0;i<110;i++) {
    const x=Math.sin(i*12.77)*110, z=Math.cos(i*18.29)*110;
    patchDummy.position.set(x,0.014,z);
    patchDummy.rotation.set(-Math.PI/2,0,i*1.41);
    patchDummy.scale.set(2+(i%7)*0.7,1.1+(i%5)*0.52,1);
    patchDummy.updateMatrix();
    patches.push(patchDummy.matrix.clone());
  }
  const streaks=new THREE.InstancedMesh(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:0x444c65,transparent:true,opacity:0.18,depthWrite:false}),patches.length);
  patches.forEach((matrix,i)=>streaks.setMatrixAt(i,matrix));
  streaks.instanceMatrix.needsUpdate=true;
  scene.add(streaks);

  const dummy = new THREE.Object3D();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x777180, flatShading: true, roughness: 1 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6a7a, flatShading: true, roughness: 1 });
  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x405e55, flatShading: true, roughness: 1 });
  const paleMat = new THREE.MeshStandardMaterial({ color: 0xc0b9b5, roughness: 1 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5f5057, roughness: 1 });
  function instanced(geometry, material, matrices) {
    if (!matrices.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }
  function transform(x,y,z,sx,sy,sz,ry=0,rz=0) {
    dummy.position.set(x,y,z);
    dummy.rotation.set(0,ry,rz);
    dummy.scale.set(sx,sy,sz);
    dummy.updateMatrix();
    return dummy.matrix.clone();
  }
  function groundShadow(x,z,sx,sz) {
    dummy.position.set(x,0.021,z);
    dummy.rotation.set(-Math.PI/2,0,0);
    dummy.scale.set(sx,sz,1);
    dummy.updateMatrix();
    return dummy.matrix.clone();
  }
  const rocks=[], stems=[], arms=[], cactusTips=[], walls=[], dunes=[], scrub=[], bones=[], fences=[], shadows=[], lanterns=[], lanternHalos=[];
  for (const prop of props) {
    const { x,z,size } = prop;
    if (prop.type === "rock") {
      rocks.push(transform(x,0.65*size,z,size,size*1.25,size*0.86,x));
      shadows.push(groundShadow(x+size*0.42,z+size*0.22,size*1.1,size*0.65));
      if (size > 0.8) rocks.push(transform(x+size*0.5,0.18*size,z+size*0.4,size*0.4,size*0.38,size*0.32,x+2));
    } else {
      stems.push(transform(x,1.2*size,z,0.26*size,1.2*size,0.26*size,x));
      shadows.push(groundShadow(x+size*0.35,z+size*0.16,size*0.62,size*0.35));
      for (const sign of [-1,1]) {
        arms.push(transform(x+sign*0.39*size,(1.1+sign*0.18)*size,z,0.16*size,0.39*size,0.16*size,0,sign*Math.PI/2));
        cactusTips.push(transform(x+sign*0.73*size,(1.4+sign*0.18)*size,z,0.16*size,0.38*size,0.16*size));
      }
    }
  }
  for (let i=-120;i<=120;i+=8) for (const sign of [-1,1]) for (const [x,z] of [[i,sign*124],[sign*124,i]]) {
    const height = 3.7 + Math.abs(Math.sin(i*0.4)) * 4;
    walls.push(transform(x,height/2-0.4,z,3.9,height/2,3.9,i*0.1));
    if (i % 24 === 0) walls.push(transform(x+Math.sin(i)*2,height+1.4,z+Math.cos(i)*2,2.6,2.3,2.8,i));
  }
  for (let i=0;i<40;i++) {
    const x=Math.sin(i*42)*106,z=Math.cos(i*17)*106;
    dunes.push(transform(x,-0.45,z,10+(i%5)*3,0.6,6+(i%4)*3,i*0.34));
  }
  // Arbustos secos, ossos e cercas pontuam o deserto, longe do ponto de partida.
  for (let i=0;i<170;i++) {
    const x=Math.sin(i*15.43)*112,z=Math.cos(i*23.17)*112;
    if (Math.hypot(x,z)<13) continue;
    scrub.push(transform(x,0.35,z,0.22+(i%3)*0.09,0.45+(i%4)*0.1,0.22+(i%3)*0.09,i*1.9));
    if (i%11===0) {
      bones.push(transform(x+1,0.07,z,0.08,0.08,0.65,i));
      bones.push(transform(x+1.3,0.07,z+0.23,0.16,0.1,0.12,i));
    }
  }
  for (const [x,z] of [[15,-6],[-20,18],[38,24],[-45,-34]]) {
    for (let i=0;i<4;i++) {
      fences.push(transform(x+i*1.5,0.58,z,0.1,0.6,0.1));
      if(i<3) fences.push(transform(x+i*1.5+0.75,0.85,z,0.76,0.07,0.07));
    }
    lanterns.push(transform(x,1.35,z,0.18,0.24,0.18));
    lanternHalos.push(groundShadow(x,z,3.1,3.1));
  }
  instanced(new THREE.DodecahedronGeometry(1,0),rockMat,rocks);
  instanced(new THREE.CylinderGeometry(1,1,2,7),cactusMat,stems);
  instanced(new THREE.CylinderGeometry(1,1,2,7),cactusMat,arms);
  instanced(new THREE.CylinderGeometry(1,1,2,7),cactusMat,cactusTips);
  instanced(new THREE.DodecahedronGeometry(1,0),stoneMat,walls);
  instanced(new THREE.SphereGeometry(1,10,5),new THREE.MeshStandardMaterial({color:0x888497,roughness:1}),dunes);
  instanced(new THREE.ConeGeometry(1,2,5),woodMat,scrub);
  instanced(new THREE.CylinderGeometry(1,1,2,5),paleMat,bones);
  instanced(new THREE.BoxGeometry(2,2,2),woodMat,fences);
  instanced(new THREE.SphereGeometry(1,8,5),new THREE.MeshBasicMaterial({color:0xffd99a}),lanterns);
  const haloCanvas=document.createElement("canvas");
  haloCanvas.width=haloCanvas.height=64;
  const haloContext=haloCanvas.getContext("2d");
  const haloGradient=haloContext.createRadialGradient(32,32,1,32,32,31);
  haloGradient.addColorStop(0,"rgba(255,212,141,.3)");
  haloGradient.addColorStop(1,"rgba(255,212,141,0)");
  haloContext.fillStyle=haloGradient;
  haloContext.fillRect(0,0,64,64);
  instanced(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,side:THREE.DoubleSide}),lanternHalos);
  instanced(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:0x262d40,transparent:true,opacity:0.24,depthWrite:false,side:THREE.DoubleSide}),shadows);

  const ripplePositions=[];
  for(let i=0;i<(detailed?1300:700);i++) {
    const x=Math.sin(i*12.73)*117,z=Math.cos(i*8.31)*117;
    const length=0.5+(i%5)*0.3;
    ripplePositions.push(x,0.024,z,x+length,0.024,z+0.07);
  }
  const ripples=new THREE.BufferGeometry();
  ripples.setAttribute("position",new THREE.Float32BufferAttribute(ripplePositions,3));
  scene.add(new THREE.LineSegments(ripples,new THREE.LineBasicMaterial({color:0xd3dcf5,transparent:true,opacity:0.26})));
}
