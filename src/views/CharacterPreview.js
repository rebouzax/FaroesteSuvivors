import * as THREE from "three";
import { disposeObject } from "./CharacterFactory.js";
import {
  createCowboyRig,
  animateCowboyPreview,
  disposeCowboyRig,
} from "./CowboyRig.js";
export class CharacterPreview {
  constructor(host, id = "joao") {
    this.coarsePointer = matchMedia("(pointer: coarse)").matches;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !this.coarsePointer,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, this.coarsePointer ? 1.2 : 1.5),
    );
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffefce, 0x806047, 3));
    const sun = new THREE.DirectionalLight(0xffdba7, 3);
    sun.position.set(-2, 4, 3);
    this.scene.add(sun);
    this.character = createCowboyRig(id);
    this.character.rotation.y = -0.4;
    this.scene.add(this.character);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    this.camera.position.set(2, 2.2, 5);
    this.camera.lookAt(0, 1.25, 0);
    this.started = performance.now();
    this.frame = 0;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    this.lastFrame = this.started;
    const tick = (now) => {
      if (this.coarsePointer && now - this.lastFrame < 32) {
        this.frame = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
      this.lastFrame = now;
      if (!this.reducedMotion.matches) {
        const t = (now - this.started) / 1000;
        animateCowboyPreview(this.character, dt);
        this.character.rotation.y = -0.45 + Math.sin(t * 0.35) * 0.15;
      }
      this.renderer.render(this.scene, this.camera);
      this.frame = requestAnimationFrame(tick);
    };
    this.observer = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.position.set(
        w / h < 0.9 ? 1.7 : 2,
        2.2,
        w / h < 0.9 ? 6.4 : 5,
      );
      this.camera.lookAt(0, 1.25, 0);
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    });
    this.observer.observe(host);
    this.frame = requestAnimationFrame(tick);
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    disposeCowboyRig(this.character);
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
