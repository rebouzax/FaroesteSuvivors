import * as THREE from "three";
import { FRONTIER_ENEMIES, FRONTIER_BOSSES } from "../config/frontierExpansion.js";
import batUrl from "../assets/models/bat.glb?url";
import dogUrl from "../assets/models/dog.glb?url";
import vultureUrl from "../assets/models/vulture.glb?url";
import skeletonUrl from "../assets/models/skeleton.glb?url";
import minerUrl from "../assets/models/miner.glb?url";
import bossUrl from "../assets/models/boss.glb?url";
import marshalUrl from "../assets/models/marshal.glb?url";

const URLS={bat:batUrl,dog:dogUrl,vulture:vultureUrl,skeleton:skeletonUrl,miner:minerUrl,boss:bossUrl,marshal:marshalUrl};
const BOSS_SHAPES={...Object.fromEntries(Object.entries(FRONTIER_BOSSES).map(([id,s])=>[id,s.shape])),giantBat:"bat",fireChupacabra:"dog",shadowMarshal:"marshal",shovelMiner:"miner",giantMoth:"vulture",minerGeneral:"miner",boneHound:"dog",boneSinger:"skeleton",zombieDeputy:"marshal",ashSerpent:"dog",stormVulture:"vulture",railRevenant:"marshal",cryptMother:"miner",deadPreacher:"skeleton",lastConductor:"marshal",
  bellTowerKeeper:"marshal",windmillWidow:"vulture",mudKing:"miner",drownedBride:"wraith",bottleBaron:"marshal",damaMalvina:"wraith",ironLocomotive:"miner",railWitchQueen:"marshal",boneCactusMatriarch:"dog",crowKing:"vulture"};
export const enemyAppearance=(type,bossId)=>bossId?bossId:type;
const SPECIES={...Object.fromEntries(Object.entries(FRONTIER_ENEMIES).map(([id,s])=>[id,s.shape])),wraith:"miner",crow:"vulture",swampCrow:"vulture",cinderHawk:"vulture",dustCoyote:"dog",mireLeech:"dog",reedStalker:"skeleton",
  bellRinger:"skeleton",lanternThief:"marshal",windmillWraith:"miner",drownedProspector:"miner",cardsharpGhoul:"marshal",barBanshee:"wraith",
  whiskeyImp:"dog",pianoCrawler:"miner",railWitch:"marshal",coalMimic:"miner",ironLocust:"vulture",graveRider:"dog",
  boneCactus:"dog",sundownBandit:"marshal",rattlesnake:"dog"};
export function meshFor(type, bossId) {
  let shape = bossId ? BOSS_SHAPES[bossId] || "marshal" : type;
  const visited = new Set();
  while (SPECIES[shape] && !visited.has(shape)) {
    visited.add(shape);
    shape = SPECIES[shape];
  }
  return URLS[shape] ? shape : "marshal";
}
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
      if (bossId || !["bat","dog","vulture","skeleton","miner"].includes(type))
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
