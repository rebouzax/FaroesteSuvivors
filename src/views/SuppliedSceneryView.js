import * as THREE from 'three';
import { sceneryFor } from '../config/sceneryPlan.js';
import { STAGE_TERRAIN } from '../config/stageLayout.js';
import { loadSupplied,normalizeModel } from './SuppliedAssetLoader.js';
export class SuppliedSceneryView{
  constructor(scene,stage,high){
    this.root=new THREE.Group();this.root.name='SuppliedScenery';scene.add(this.root);this.disposed=false;this.failures=[];
    this.ready=Promise.allSettled([this.buildTerrain(stage),...sceneryFor(stage).map(async p=>{
      try{
        const gltf=await loadSupplied(p.assetId);if(this.disposed)return;
        const model=normalizeModel(gltf.scene,p.width,'width');model.position.set(p.x,p.flat?.015:0,p.z);model.rotation.y=p.rotation;
        // Ceiling modules are used as raised vaults, not obstacles at foot level.
        if(p.assetId.includes('ceiling'))model.position.y=5;
        model.traverse(part=>{if(part.isMesh){part.castShadow=high&&!p.flat;part.receiveShadow=true;}});
        this.root.add(model);
      }catch(error){this.failures.push(p.assetId);console.error('Scenery asset failed:',p.assetId,error);throw error;}
    })]);
  }
  async buildTerrain(stage){
    const id=STAGE_TERRAIN[stage];if(!id)return;
    try{
      const gltf=await loadSupplied(id);if(this.disposed)return;
      const model=normalizeModel(gltf.scene,1,'width');model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
      // Bake floor tiles into a continuous, flat gameplay surface. Side walls
      // collapse to zero area; the top retains the supplied materials and UVs.
      model.traverse(part=>{
        if(!part.isMesh)return;
        const geo=part.geometry.clone().applyMatrix4(part.matrixWorld),p=geo.attributes.position;
        for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)/size.x,0,p.getZ(i)/size.z);
        p.needsUpdate=true;geo.computeVertexNormals();
        const material=Array.isArray(part.material)?part.material.map(m=>m.clone()):part.material.clone();
        for(const m of Array.isArray(material)?material:[material])m.side=THREE.FrontSide;
        const tiles=new THREE.InstancedMesh(geo,material,256),dummy=new THREE.Object3D();
        for(let z=0;z<16;z++)for(let x=0;x<16;x++){
          dummy.position.set(-112.5+x*15,.025,-112.5+z*15);dummy.scale.set(15,1,15);dummy.updateMatrix();tiles.setMatrixAt(z*16+x,dummy.matrix);
        }
        tiles.receiveShadow=true;tiles.instanceMatrix.needsUpdate=true;this.root.add(tiles);
      });
    }catch(error){this.failures.push(id);throw error;}
  }
  dispose(){this.disposed=true;}
}
