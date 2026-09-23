import * as THREE from "three";
import modelUrl from "../assets/models/joao-vaqueiro.glb?url";

// Uma única transferência do GLB atende à seleção e à partida. Instâncias
// compartilham malhas, mas cada personagem tem seu próprio AnimationMixer.
let assetPromise;
export function preloadCowboyAsset() {
  assetPromise ??= import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => new GLTFLoader().loadAsync(modelUrl)).catch(error => {
    assetPromise = null; // permite uma nova tentativa após uma falha de rede
    throw error;
  });
  return assetPromise;
}

export function createCowboyRig() {
  const root = new THREE.Group();
  root.name = "JoaoVaqueiro";
  root.userData.disposed = false;
  root.userData.ready = preloadCowboyAsset().then(gltf => {
    if (root.userData.disposed) return;
    const avatar = gltf.scene.clone(true);
    root.add(avatar);
    const mixer = new THREE.AnimationMixer(avatar);
    const actions = Object.fromEntries(gltf.animations.map(clip => {
      const combat = ["Whip", "Shot", "Throw", "Hurt"].includes(clip.name);
      const action = mixer.clipAction(combat ? THREE.AnimationUtils.makeClipAdditive(clip.clone()) : clip);
      if (combat) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      return [clip.name, action];
    }));
    actions.Idle.play();
    const revolver = avatar.getObjectByName("Revolver");
    const flash = new THREE.Mesh(
      new THREE.ConeGeometry(0.095, 0.28, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd998, transparent: true, opacity: 0.8 }),
    );
    flash.position.set(0, 0.035, 0.74);
    flash.rotation.x = Math.PI / 2;
    flash.visible = false;
    revolver.add(flash);
    root.userData.rig = {mixer, actions, flash, locomotion: "Idle", attacking: false, shooting: false, throwing: false, hurt: false};
  }).catch(error => {
    if (!root.userData.disposed) console.error("Não foi possível carregar João Vaqueiro em 3D.", error);
  });
  return root;
}

function playCombat(rig, name) {
  rig.actions[name].stop();
  rig.actions[name].reset().setEffectiveWeight(1).play();
}

export function animateCowboyPreview(root, dt) {
  const rig = root.userData.rig;
  if (rig) rig.mixer.update(dt);
}

export function animateCowboy(root, run, dt) {
  const p=run.player;
  const direction=Math.atan2(p.dx,p.dz);
  const difference=Math.atan2(Math.sin(direction-root.rotation.y),Math.cos(direction-root.rotation.y));
  root.rotation.y+=difference*Math.min(1,dt*13);
  root.position.set(p.x, p.moving ? Math.abs(Math.sin(p.walkTime*8))*0.035 : 0, p.z);
  const rig=root.userData.rig;
  if (!rig) return;
  const desired=p.moving ? "Walk" : "Idle";
  if (rig.locomotion!==desired) {
    rig.actions[rig.locomotion].fadeOut(0.16);
    rig.actions[desired].reset().fadeIn(0.16).play();
    rig.locomotion=desired;
  }
  const attacking=Boolean(run.attack);
  if(attacking&&!rig.attacking) playCombat(rig,"Whip");
  rig.attacking=attacking;
  const shooting=run.shotFlash>0.15;
  if(shooting&&!rig.shooting) playCombat(rig,"Shot");
  rig.shooting=shooting;
  rig.flash.visible=shooting;
  const throwing=run.throwFlash>0.57;
  if(throwing&&!rig.throwing) playCombat(rig,"Throw");
  rig.throwing=throwing;
  const hurt=p.invulnerable>0.84&&p.invulnerable<=0.9;
  if(hurt&&!rig.hurt) playCombat(rig,"Hurt");
  rig.hurt=hurt;
  rig.mixer.update(dt);
}

export function disposeCowboyRig(root) {
  root.userData.disposed=true;
  root.userData.rig?.mixer.stopAllAction();
}
