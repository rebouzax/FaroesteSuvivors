import * as THREE from "three";
import joaoUrl from "../assets/models/joao-vaqueiro.glb?url";
import mariaUrl from "../assets/models/maria-bonita.glb?url";
import indigoUrl from "../assets/models/indigo.glb?url";
const URLs = { joao: joaoUrl, maria: mariaUrl, indigo: indigoUrl };
const cache = new Map();
export function preloadCowboyAsset(id = "joao") {
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
      const avatar = gltf.scene.clone(true);
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
            action.clampWhenFinished = true;
          }
          return [clip.name, action];
        }),
      );
      actions.Idle.play();
      const revolver = avatar.getObjectByName(
        id === "maria" ? "RevolverR" : "Revolver",
      );
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
        flash.position.set(0, 0.035, 0.74);
        flash.rotation.x = Math.PI / 2;
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
export function animateCowboy(root, run, dt) {
  const p = run.player,
    direction = Math.atan2(p.dx, p.dz);
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
  const desired = p.moving ? "Walk" : "Idle";
  if (rig.locomotion !== desired) {
    rig.actions[rig.locomotion].fadeOut(0.16);
    rig.actions[desired].reset().fadeIn(0.16).play();
    rig.locomotion = desired;
  }
  const attacking = Boolean(run.attack);
  if (attacking && !rig.attacking && run.characterId === "joao")
    playCombat(rig, "Whip");
  rig.attacking = attacking;
  const shooting = run.shotFlash > 0.15 || run.primaryFlash > 0.15;
  if (shooting && !rig.shooting)
    playCombat(rig, run.characterId === "joao" ? "Shot" : "Primary");
  rig.shooting = shooting;
  if (rig.flash) rig.flash.visible = shooting;
  const throwing = run.throwFlash > 0.57;
  if (throwing && !rig.throwing) playCombat(rig, "Throw");
  rig.throwing = throwing;
  const hurt = p.invulnerable > 0.84 && p.invulnerable <= 0.9;
  if (hurt && !rig.hurt) playCombat(rig, "Hurt");
  rig.hurt = hurt;
  rig.mixer.update(dt);
}
export function disposeCowboyRig(root) {
  root.userData.disposed = true;
  root.userData.rig?.mixer.stopAllAction();
}
