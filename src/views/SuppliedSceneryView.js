import * as THREE from 'three';
import { sceneryFor } from '../config/sceneryPlan.js';
import { loadSupplied,normalizeModel } from './SuppliedAssetLoader.js';
export class SuppliedSceneryView{
  constructor(scene,stage,high){
    this.root=new THREE.Group();this.root.name='SuppliedScenery';scene.add(this.root);this.disposed=false;this.failures=[];
    this.ready=Promise.allSettled(sceneryFor(stage).map(async p=>{
      try{
        const gltf=await loadSupplied(p.assetId);if(this.disposed)return;
        const model=normalizeModel(gltf.scene,p.width,'width');model.position.set(p.x,p.flat?.015:0,p.z);model.rotation.y=p.rotation;
        // Ceiling modules are used as raised vaults, not obstacles at foot level.
        if(p.assetId.includes('ceiling'))model.position.y=5;
        model.traverse(part=>{if(part.isMesh){part.castShadow=high&&!p.flat;part.receiveShadow=true;}});
        this.root.add(model);
      }catch(error){this.failures.push(p.assetId);console.error('Scenery asset failed:',p.assetId,error);throw error;}
    }));
  }
  dispose(){this.disposed=true;}
}
