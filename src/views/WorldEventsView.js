import * as THREE from "three";
export class WorldEventsView {
  constructor(scene, quality = "normal") {
    this.highQuality=quality==="high";
    this.layers=this.highQuality?6:4;
    this.dummy=new THREE.Object3D();
    this.crates=new THREE.InstancedMesh(new THREE.BoxGeometry(1.1,1.05,1.1),
      new THREE.MeshStandardMaterial({color:0x795039,roughness:1,flatShading:true}),2);
    this.crates.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.crates.frustumCulled=false;
    scene.add(this.crates);
    this.bands=new THREE.InstancedMesh(new THREE.BoxGeometry(1.14,0.13,1.14),
      new THREE.MeshStandardMaterial({color:0xb59660,roughness:1}),2);
    this.bands.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bands.frustumCulled=false;
    scene.add(this.bands);
    this.wind=new THREE.InstancedMesh(new THREE.ConeGeometry(1.55,3.1,this.highQuality ? 12 : 7,1,true),
      new THREE.MeshBasicMaterial({color:this.highQuality ? 0xd8c8c0 : 0xc4ad9b,transparent:true,opacity:this.highQuality ? .29 : .36,side:THREE.DoubleSide,depthWrite:false}),this.layers*3);
    this.wind.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.wind.frustumCulled=false;
    scene.add(this.wind);
    const batch=(geometry,material,count)=>{const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);return mesh;};
    this.rain=batch(new THREE.CylinderGeometry(.014,.014,.65,3),new THREE.MeshBasicMaterial({color:0xa4d7ff,transparent:true,opacity:.55}),this.highQuality?650:260);
    const dustCanvas=document.createElement('canvas');dustCanvas.width=dustCanvas.height=32;
    const context=dustCanvas.getContext('2d'),gradient=context.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0,'rgba(255,255,255,.7)');gradient.addColorStop(1,'rgba(255,255,255,0)');context.fillStyle=gradient;context.fillRect(0,0,32,32);
    this.sand=batch(new THREE.PlaneGeometry(1.4,1.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(dustCanvas),color:0xd8af72,transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide}),this.highQuality?320:130);
    this.warning=batch(new THREE.RingGeometry(.88,1,32),new THREE.MeshBasicMaterial({color:0xffcb54,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}),12);
    this.bolts=batch(new THREE.CylinderGeometry(.06,.1,1,5),new THREE.MeshBasicMaterial({color:0xd7efff}),72);
    this.gold=batch(new THREE.IcosahedronGeometry(.09,0),new THREE.MeshBasicMaterial({color:0xffd550}),96);
  }
  render(run) {
    const time=run.visualTime??run.time,w=run.weather;
    const matrix=(mesh,index,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{this.dummy.position.set(x,y,z);this.dummy.scale.set(sx,sy,sz);this.dummy.rotation.set(rx,ry,rz);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);};
    this.rain.count=w.kind==='rain'&&w.remaining>0?(this.highQuality?650:260):0;
    for(let i=0;i<this.rain.count;i++)matrix(this.rain,i,run.player.x+Math.sin(i*73.13)*23,(i*.731-time*18)%14+14,run.player.z+Math.cos(i*31.71)*20,1,1,1,0,0,.18);
    this.sand.count=w.kind==='sand'&&w.remaining>0?(this.highQuality?320:130):0;
    for(let i=0;i<this.sand.count;i++)matrix(this.sand,i,run.player.x+((i*13.17+time*12)%48)-24,.3+(i%17)*.18,run.player.z+Math.sin(i*21.37)*22,2+(i%3),1,1,-Math.PI/2,0,.15*Math.sin(time+i));
    let rings=0,bolts=0;
    for(const s of w.strikes||[]){
      if(rings>=12)break;
      matrix(this.warning,rings++,s.x,.06,s.z,s.radius,s.radius,1,-Math.PI/2);
      if(s.age>=1.2)for(let j=0;j<6;j++){
        const x0=Math.sin(j*7.7)*.35,x1=Math.sin((j+1)*7.7)*.35;
        matrix(this.bolts,bolts++,s.x+(x0+x1)/2,j*1.7+.9,s.z,1,Math.hypot(x1-x0,1.7),1,0,0,-Math.atan2(x1-x0,1.7));
      }
    }
    this.warning.count=rings;this.bolts.count=bolts;
    let gold=0;for(const b of run.treasureBursts||[])for(let i=0;i<48&&gold<96;i++){
      const a=i*2.399963,r=b.age*(2+i%5);matrix(this.gold,gold++,b.x+Math.cos(a)*r,Math.max(.1,1+b.age*(4+i%3)-b.age*b.age*4),b.z+Math.sin(a)*r,1,1,1,time,i);
    }
    this.gold.count=gold;
    for(const mesh of [this.rain,this.sand,this.warning,this.bolts,this.gold])mesh.instanceMatrix.needsUpdate=true;
    let count=0;
    for(const crate of run.crates){
      if(count>=2)break;
      this.dummy.position.set(crate.x,0.54,crate.z);
      this.dummy.rotation.set(0,crate.id*0.71,0);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      this.crates.setMatrixAt(count,this.dummy.matrix);
      this.dummy.position.y=0.57;
      this.dummy.scale.set(1,1,1);
      this.dummy.updateMatrix();
      this.bands.setMatrixAt(count++,this.dummy.matrix);
    }
    this.crates.count=this.bands.count=count;
    this.crates.instanceMatrix.needsUpdate=this.bands.instanceMatrix.needsUpdate=true;
    let slot=0;
    for(const tornado of run.tornadoes){
      for(let i=0;i<this.layers;i++){
        const scale=.22+i*(this.highQuality?.16:.25);
        this.dummy.position.set(tornado.x,0.45+i*(this.highQuality?.52:.76),tornado.z);
        this.dummy.rotation.set(Math.PI,(run.visualTime??run.time)*(this.highQuality?8:6)+i*0.7,0);
        this.dummy.scale.set(scale,0.5,scale);
        this.dummy.updateMatrix();
        this.wind.setMatrixAt(slot++,this.dummy.matrix);
      }
    }
    this.wind.count=slot;
    this.wind.instanceMatrix.needsUpdate=true;
  }
}
