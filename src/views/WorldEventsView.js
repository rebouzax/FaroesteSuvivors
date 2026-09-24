import * as THREE from "three";
export class WorldEventsView {
  constructor(scene) {
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
    this.wind=new THREE.InstancedMesh(new THREE.ConeGeometry(1.55,3.1,7,1,true),
      new THREE.MeshBasicMaterial({color:0xc4ad9b,transparent:true,opacity:0.36,side:THREE.DoubleSide,depthWrite:false}),12);
    this.wind.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.wind.frustumCulled=false;
    scene.add(this.wind);
  }
  render(run) {
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
      for(let i=0;i<4;i++){
        const scale=1-i*0.22;
        this.dummy.position.set(tornado.x,0.55+i*0.76,tornado.z);
        this.dummy.rotation.set(0,run.time*6+i*0.7,0);
        this.dummy.scale.set(scale,0.5,scale);
        this.dummy.updateMatrix();
        this.wind.setMatrixAt(slot++,this.dummy.matrix);
      }
    }
    this.wind.count=slot;
    this.wind.instanceMatrix.needsUpdate=true;
  }
}
