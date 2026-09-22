import * as THREE from "three";
import { disposeObject } from "./CharacterFactory.js";
import { createCowboyRig } from "./CowboyRig.js";
export class CharacterPreview {
  constructor(host) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffefce, 0x806047, 3));
    const sun = new THREE.DirectionalLight(0xffdba7, 3);
    sun.position.set(-2, 4, 3);
    this.scene.add(sun);
    this.character = createCowboyRig();
    this.character.rotation.y = -0.4;
    this.scene.add(this.character);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    this.camera.position.set(3, 2.7, 5);
    this.camera.lookAt(0, 1.1, 0);
    this.observer = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    });
    this.observer.observe(host);
  }
  dispose() {
    this.observer.disconnect();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
