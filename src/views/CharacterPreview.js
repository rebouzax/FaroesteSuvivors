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
    this.camera.position.set(2.55, 2.4, 3.9);
    this.camera.lookAt(0, 1.1, 0);
    this.started = performance.now();
    this.frame = 0;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const tick = now => {
      if (!this.reducedMotion.matches) {
        const t = (now-this.started)/1000;
        const rig = this.character.userData.rig;
        rig.torso.rotation.y = Math.sin(t*0.7)*0.08;
        rig.head.rotation.x = Math.sin(t*1.15)*0.035;
        rig.arms[1].rotation.x = -0.17+Math.sin(t*0.8)*0.05;
        this.character.rotation.y = -0.45+Math.sin(t*0.35)*0.15;
        this.renderer.render(this.scene,this.camera);
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.observer = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    });
    this.observer.observe(host);
    this.frame = requestAnimationFrame(tick);
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
