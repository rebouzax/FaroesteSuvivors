import * as THREE from "three";
import batUrl from "../assets/models/bat.glb?url";
import dogUrl from "../assets/models/dog.glb?url";
import vultureUrl from "../assets/models/vulture.glb?url";
import skeletonUrl from "../assets/models/skeleton.glb?url";
import minerUrl from "../assets/models/miner.glb?url";
import bossUrl from "../assets/models/boss.glb?url";
import marshalUrl from "../assets/models/marshal.glb?url";

const URLS={bat:batUrl,dog:dogUrl,vulture:vultureUrl,skeleton:skeletonUrl,miner:minerUrl,boss:bossUrl,marshal:marshalUrl};
const BOSS_SHAPES={giantBat:"bat",fireChupacabra:"dog",shadowMarshal:"marshal",shovelMiner:"miner",giantMoth:"vulture",minerGeneral:"miner",boneHound:"dog",boneSinger:"skeleton",zombieDeputy:"marshal",ashSerpent:"dog",stormVulture:"vulture",railRevenant:"marshal",cryptMother:"miner",deadPreacher:"skeleton",lastConductor:"marshal"};
export const enemyAppearance=(type,bossId)=>bossId?bossId:type;
const meshFor=(type,bossId)=>bossId?BOSS_SHAPES[bossId]||type:({wraith:"miner",crow:"vulture"}[type]||type);
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
  create(type,bossId){
    const view=new THREE.Group();
    view.userData.species=enemyAppearance(type,bossId);
    const shape=meshFor(type,bossId);
    asset(shape).then(({scene,animations})=>{
      if (view.userData.disposed) return;
      const model=scene.clone(true);
      if (bossId || type === "wraith" || type === "crow")
        model.traverse((part) => {
          if (part.isMesh) part.material = part.material.clone();
        });
      view.add(model);
      const mixer=new THREE.AnimationMixer(model);
      const preferred=shape==="bat"||shape==="vulture"?"Fly":shape==="dog"?"Run":"Walk";
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
