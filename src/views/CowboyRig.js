import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { HighQualityCharacterAnimation } from "./HighQualityCharacterAnimation.js";
import { HERO_MODELS } from '../config/specialHeroes.js';
import { loadActor } from './SuppliedAssetLoader.js';
import joaoUrl from "../assets/models/joao.glb?url";
import mariaUrl from "../assets/models/maria.glb?url";
import indigoUrl from "../assets/models/indigo.glb?url";
import labutaUrl from "../assets/models/labuta.glb?url";
import rosaUrl from "../assets/models/rosa.glb?url";
import eliasUrl from "../assets/models/elias.glb?url";
import silasUrl from "../assets/models/silas.glb?url";
import adaUrl from "../assets/models/ada.glb?url";
import ruthUrl from "../assets/models/ruth.glb?url";
import teoUrl from "../assets/models/teo.glb?url";
import valeriaUrl from "../assets/models/valeria.glb?url";
import tomasUrl from "../assets/models/tomas.glb?url";
import luziaUrl from "../assets/models/luzia.glb?url";
import benicioUrl from "../assets/models/benicio.glb?url";
import inesUrl from "../assets/models/ines.glb?url";
import dynamiteUrl from "../assets/models/dynamite.glb?url";
import jacintoUrl from "../assets/models/jacinto.glb?url";
import auroraUrl from "../assets/models/aurora.glb?url";
import gasparUrl from "../assets/models/gaspar.glb?url";
import celesteUrl from "../assets/models/celeste.glb?url";
import severinoUrl from "../assets/models/severino.glb?url";
import amaraUrl from "../assets/models/amara.glb?url";
const URLs = { joao: joaoUrl, maria: mariaUrl, indigo: indigoUrl, labuta: labutaUrl, rosa: rosaUrl, elias: eliasUrl, silas: silasUrl, ada: adaUrl, ruth: ruthUrl, teo: teoUrl, valeria:valeriaUrl, tomas:tomasUrl, luzia:luziaUrl, benicio:benicioUrl, ines:inesUrl, dynamite:dynamiteUrl,jacinto:jacintoUrl,aurora:auroraUrl,gaspar:gasparUrl,celeste:celesteUrl,severino:severinoUrl,amara:amaraUrl };
const cache = new Map();
export function preloadCowboyAsset(id = "joao") {
  if(HERO_MODELS[id]){
    if(!cache.has(id))cache.set(id,loadActor(HERO_MODELS[id]).then(source=>({scene:cloneSkinned(source.scene),animations:source.animations})).catch(error=>{cache.delete(id);throw error;}));
    return cache.get(id);
  }
  if (!URLs[id]) throw new Error("Personagem desconhecido: " + id);
  if (!cache.has(id)) {
    cache.set(
      id,
      import("three/addons/loaders/GLTFLoader.js")
        .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(URLs[id]))
        .catch((error) => {
          cache.delete(id);
          throw error;
        }),
    );
  }
  return cache.get(id);
}
export function createCowboyRig(id = "joao") {
  const root = new THREE.Group();
  root.name = id;
  root.userData.disposed = false;
  root.userData.ready = preloadCowboyAsset(id)
    .then((gltf) => {
      if (root.userData.disposed) return;
      // GLBs do Blender usam SkinnedMesh: clone() sozinho conserva os ossos
      // do modelo em cache e faz instâncias diferentes compartilharem poses.
      const avatar = cloneSkinned(gltf.scene);
      root.add(avatar);
      const mixer = new THREE.AnimationMixer(avatar);
      const actions = Object.fromEntries(
        gltf.animations.map((clip) => {
          const combat = ["Whip", "Primary", "Shot", "Throw", "Hurt"].includes(
            clip.name,
          );
          const action = mixer.clipAction(
            combat ? THREE.AnimationUtils.makeClipAdditive(clip.clone()) : clip,
          );
          if (combat) {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = false;
          }
          return [clip.name, action];
        }),
      );
      actions.Idle.play();
      // No novo João o cano é uma malha deformada pelo osso da mão direita.
      // O flash precisa acompanhar o osso, pois filhos de SkinnedMesh não
      // recebem a deformação da malha.
      const joaoHand = id === "joao" ? avatar.getObjectByName("HandR") : null;
      const revolver = joaoHand || avatar.getObjectByName(
        ["maria", "rosa", "valeria"].includes(id) ? "RevolverR" : "Revolver",
      );
      const bowBack=avatar.getObjectByName("BowBack"),bowHand=avatar.getObjectByName("BowHand");
      if(bowHand)bowHand.scale.setScalar(0.001);
      let flash;
      if (revolver) {
        flash = new THREE.Mesh(
          new THREE.ConeGeometry(0.095, 0.28, 6),
          new THREE.MeshBasicMaterial({
            color: 0xffd998,
            transparent: true,
            opacity: 0.8,
          }),
        );
        if (joaoHand) {
          avatar.updateWorldMatrix(true, true);
          const muzzle = joaoHand.worldToLocal(
            avatar.localToWorld(new THREE.Vector3(0.548, 0.77, 0.23)),
          );
          const forward = joaoHand.worldToLocal(
            avatar.localToWorld(new THREE.Vector3(0.548, 0.77, 0.33)),
          ).sub(muzzle).normalize();
          flash.position.copy(muzzle);
          flash.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
        } else {
          flash.position.set(0, 0.035, 0.74);
          flash.rotation.x = Math.PI / 2;
        }
        flash.visible = false;
        revolver.add(flash);
      }
      root.userData.rig = {
        mixer,
        actions,
        flash,
        locomotion: "Idle",
        attacking: false,
        shooting: false,
        throwing: false,
        hurt: false,
        bowBack,
        bowHand,
        bowHold:0,
        bowDeployment:0,
      };
    })
    .catch((error) => {
      if (!root.userData.disposed)
        console.error("Não foi possível carregar personagem em 3D.", error);
    });
  return root;
}
function playCombat(rig, name) {
  const action = rig.actions[name];
  if (!action) return;
  action.stop().reset().setEffectiveWeight(1).play();
}
export function animateCowboyPreview(root, dt) {
  root.userData.rig?.mixer.update(dt);
}
export function animateCowboy(root, run, dt, highQuality = false) {
  const p = run.player,
    direction = (highQuality || run.characterId === 'clanker') && run.attack
      ? Math.atan2(Math.cos(run.attack.angle), Math.sin(run.attack.angle))
      : Math.atan2(p.dx, p.dz);
  const difference = Math.atan2(
    Math.sin(direction - root.rotation.y),
    Math.cos(direction - root.rotation.y),
  );
  root.rotation.y += difference * Math.min(1, dt * 13);
  root.position.set(
    p.x,
    p.moving ? Math.abs(Math.sin(p.walkTime * 8)) * 0.035 : 0,
    p.z,
  );
  const rig = root.userData.rig;
  if (!rig) return;
  if (highQuality && !rig.highAnimation)
    rig.highAnimation = new HighQualityCharacterAnimation(root.children[0], run.hero.primary);
  rig.highAnimation?.restore();
  const desired = p.moving ? "Walk" : "Idle";
  if (rig.locomotion !== desired) {
    rig.actions[rig.locomotion].fadeOut(0.16);
    rig.actions[desired].reset().fadeIn(0.16).play();
    rig.locomotion = desired;
  }
  const attacking = Boolean(run.attack);
  if (attacking && !rig.attacking && run.characterId === "joao")
    playCombat(rig, "Whip");
  if (attacking && !rig.attacking && run.characterId === 'clanker')
    playCombat(rig, 'Primary');
  rig.attacking = attacking;
  const shooting = run.shotFlash > 0.15 || run.primaryFlash > 0.15;
  if (shooting && !rig.shooting && run.characterId !== 'clanker') {
    const action=run.characterId==="joao"?"Shot":["dynamite","boomerang","axe"].includes(run.hero.primary)?"Throw":["pistol","dual"].includes(run.hero.primary)?"Shot":"Primary";
    playCombat(rig,action);
    if(run.hero.primary==="bow")rig.bowHold=.64;
  }
  rig.shooting = shooting;
  if(rig.bowBack&&rig.bowHand){
    rig.bowHold=Math.max(0,rig.bowHold-dt);
    const wanted=rig.bowHold>0?1:0;
    rig.bowDeployment+= (wanted-rig.bowDeployment)*Math.min(1,dt*10);
    rig.bowBack.scale.setScalar(Math.max(.001,1-rig.bowDeployment));
    rig.bowHand.scale.setScalar(Math.max(.001,rig.bowDeployment));
  }
  if (rig.flash) rig.flash.visible = shooting;
  const throwing = run.throwFlash > 0.57;
  if (throwing && !rig.throwing && run.characterId !== 'clanker') playCombat(rig, "Throw");
  rig.throwing = throwing;
  const hurt = p.invulnerable > 0.84 && p.invulnerable <= 0.9;
  if (hurt && !rig.hurt) playCombat(rig, "Hurt");
  rig.hurt = hurt;
  if (highQuality && rig.actions.Walk)
    rig.actions.Walk.setEffectiveTimeScale(Math.max(.8, Math.min(1.4, run.moveSpeed / 5)));
  rig.mixer.update(dt);
  if (highQuality) rig.highAnimation.update(root, run, dt);
}
export function disposeCowboyRig(root) {
  root.userData.disposed = true;
  root.userData.rig?.mixer.stopAllAction();
}
