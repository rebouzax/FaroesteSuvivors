import * as THREE from "three";
import batUrl from "../assets/models/bat.glb?url";
import dogUrl from "../assets/models/dog.glb?url";
import vultureUrl from "../assets/models/vulture.glb?url";
import skeletonUrl from "../assets/models/skeleton.glb?url";
import minerUrl from "../assets/models/miner.glb?url";
import bossUrl from "../assets/models/boss.glb?url";

const URLS={bat:batUrl,dog:dogUrl,vulture:vultureUrl,skeleton:skeletonUrl,miner:minerUrl,boss:bossUrl};
let loaderPromise;
const cached=new Map();
function asset(type){
  if (!URLS[type]) return Promise.reject(new Error("Tipo desconhecido: "+type));
  if (!cached.has(type)){
    loaderPromise ??= import("three/addons/loaders/GLTFLoader.js").then(({GLTFLoader})=>new GLTFLoader());
    const request=loaderPromise.then(loader=>loader.loadAsync(URLS[type])).catch(error=>{
      cached.delete(type);
      throw error;
    });
    cached.set(type,request);
  }
  return cached.get(type);
}

export class EnemyAssetView {
  constructor(){
    this.ready=Promise.allSettled(Object.keys(URLS).map(asset));
  }
  create(type){
    const view=new THREE.Group();
    view.userData.species=type;
    asset(type).then(({scene,animations})=>{
      if (view.userData.disposed) return;
      const model=scene.clone(true);
      view.add(model);
      const mixer=new THREE.AnimationMixer(model);
      const preferred=type==="bat"||type==="vulture"?"Fly":type==="dog"?"Run":"Walk";
      const clip=animations.find(item=>item.name===preferred)||animations[0];
      mixer.clipAction(clip).play();
      mixer.setTime((view.userData.seed||0)*0.17%clip.duration);
      view.userData.mixer=mixer;
      const attack=animations.find(item=>["Shoot","Lurch","Attack"].includes(item.name));
      if(attack){
        const action=mixer.clipAction(THREE.AnimationUtils.makeClipAdditive(attack.clone()));
        action.setLoop(THREE.LoopOnce,1);
        action.clampWhenFinished=true;
        view.userData.attackAction=action;
      }
    }).catch(error=>console.warn("Modelo de inimigo indisponível: "+type,error));
    return view;
  }
}
