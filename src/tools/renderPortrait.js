import * as THREE from "three";
import { preloadCowboyAsset } from "../views/CowboyRig.js";

export async function renderPortrait(id, host) {
  const gltf = await preloadCowboyAsset(id);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(512, 640);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffe4ba, 0x4b3451, 3));
  const sun = new THREE.DirectionalLight(0xffcf83, 4);
  sun.position.set(-3, 7, 5);
  scene.add(sun);
  const edge = new THREE.DirectionalLight(0x8dacc4, 2);
  edge.position.set(4, 4, -3);
  scene.add(edge);
  const avatar = gltf.scene.clone(true);
  avatar.rotation.y = -0.23;
  scene.add(avatar);
  const camera = new THREE.PerspectiveCamera(35, 512 / 640, 0.1, 100);
  camera.position.set(2.6, 1.8, 3.65);
  camera.lookAt(0, 1.02, 0);
  renderer.render(scene, camera);
  return renderer;
}
