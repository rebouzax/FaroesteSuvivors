import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { EARLY_ENEMIES } from "../config/earlyEnemies.js";
import { CREATURE_SHAPES, createCreatureAsset } from "./CreatureGeometry.js";
import { CREATURE_ART, MODEL_KINDS, SPECIAL_ART, AIRBORNE_ART } from '../config/creatureArt.js';
import { loadActor } from './SuppliedAssetLoader.js';
import { TREASURE_CREATURES } from '../config/treasureCreatures.js';
import { createSpecialCreature } from './SpecialCreatureGeometry.js';
import { equipCreature } from './CreatureEquipment.js';
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
  if(type.startsWith('treasure:'))return 'supplied:'+TREASURE_CREATURES[type.slice(9)].model;
  const id=bossId||type;
  if(CREATURE_ART[id])return 'supplied:'+CREATURE_ART[id];
  if(SPECIAL_ART[id])return 'special:'+SPECIAL_ART[id];
  if(bossId==="ashSerpent")return "snake";
  const anatomy=EARLY_ENEMIES[type]?.anatomy;
  if(CREATURE_SHAPES.includes(anatomy))return anatomy;
  const accurate={rattlesnake:"snake",saltScorpion:"scorpion",saltWidow:"spider",mireLeech:"snake",sapCrawler:"spider",wraith:"ghost",barBanshee:"ghost",windmillWraith:"ghost",scriptureWraith:"ghost",crystalWisp:"skull"};
  if(accurate[type])return accurate[type];
  if(["drownedBride"].includes(bossId))return "ghost";
  if(anatomy)return anatomy==="wolf"?"dog":anatomy==="headless"||anatomy==="skeleton"?"skeleton":"miner";
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
  if(type.startsWith('supplied:')){const id=type.slice(9);return loadActor(id,MODEL_KINDS[id]||'humanoid');}
  if(type.startsWith('special:')){if(!cached.has(type))cached.set(type,Promise.resolve(createSpecialCreature(type.slice(8))));return cached.get(type);}
  if(CREATURE_SHAPES.includes(type)){
    if(!cached.has(type))cached.set(type,Promise.resolve(createCreatureAsset(type)));
    return cached.get(type);
  }
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
    view.userData.shape=shape;
    view.userData.imported=shape.startsWith('supplied:');
    view.userData.airborne=AIRBORNE_ART.has(shape.split(':').at(-1));
    view.userData.ready=asset(shape).then(({scene,animations})=>{
      if (view.userData.disposed) return;
      const model=cloneSkinned(scene);
      if (bossId || !["bat","dog","vulture","skeleton","miner"].includes(type))
        model.traverse((part) => {
          if (part.isMesh) part.material = Array.isArray(part.material)?part.material.map(m=>m.clone()):part.material.clone();
        });
      if(!['bat','dog','vulture','skeleton','miner'].includes(type)||bossId)equipCreature(model,bossId||type,Boolean(bossId));
      view.add(model);
      if(type.startsWith('treasure:')){
        const sack=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshStandardMaterial({color:0xe6b34b,metalness:.55,roughness:.4}));
        sack.position.set(0,1,-.2);model.add(sack);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.75,.045,6,24),sack.material);ring.rotation.x=Math.PI/2;ring.position.y=.07;model.add(ring);
      }
      const mixer=new THREE.AnimationMixer(model);
      const preferred=shape==="bat"||shape==="vulture"?"Fly":shape==="dog"?"Run":"Walk";
      const clip=animations.find(item=>item.name===preferred)||animations.find(item=>item.name==='Walk')||animations[0];
      if(clip){mixer.clipAction(clip).play();mixer.setTime((view.userData.seed||0)*0.17%clip.duration);}
      view.userData.mixer=mixer;
      const attack=animations.find(item=>["Shoot","Lurch","Attack","Primary"].includes(item.name));
      if(attack){
        const action=mixer.clipAction(THREE.AnimationUtils.makeClipAdditive(attack.clone()));
        action.setLoop(THREE.LoopOnce,1);
        action.clampWhenFinished=true;
        view.userData.attackAction=action;
      }
    }).catch(error=>{view.userData.loadError=String(error);console.warn("Modelo de inimigo indisponível: "+type,error);});
    return view;
  }
}
