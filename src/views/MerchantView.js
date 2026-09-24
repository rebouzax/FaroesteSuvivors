import * as THREE from "three";
import { disposeObject } from "./CharacterFactory.js";
import { loadMerchantAsset } from "./MerchantAsset.js";

export class MerchantView {
  constructor(host) {
    this.disposed = false;
    this.coarsePointer = matchMedia("(pointer: coarse)").matches;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !this.coarsePointer,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, this.coarsePointer ? 1.2 : 1.45),
    );
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfce3b2, 0x272932, 2.5));
    const light = new THREE.DirectionalLight(0xffc682, 4);
    light.position.set(-3, 5, 4);
    this.scene.add(light);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    this.camera.position.set(0.2, 2.2, 6.7);
    this.camera.lookAt(0, 1.25, 0);
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.last = null;
    loadMerchantAsset()
      .then(({ scene, animations }) => {
        if (this.disposed) return;
        this.model = scene.clone(true);
        this.scene.add(this.model);
        this.mixer = new THREE.AnimationMixer(this.model);
        this.idle = this.mixer.clipAction(
          animations.find((clip) => clip.name === "Idle"),
        );
        this.gesture = this.mixer.clipAction(
          animations.find((clip) => clip.name === "Thanks"),
        );
        this.gesture.setLoop(THREE.LoopOnce, 1);
        this.gesture.clampWhenFinished = true;
        this.idle.play();
      })
      .catch((error) => {
        if (!this.disposed) console.warn("Mercador indisponível", error);
      });
    this.observer = new ResizeObserver(() => {
      const width = host.clientWidth,
        height = host.clientHeight;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();
    });
    this.observer.observe(host);
    this.frame = requestAnimationFrame(this.tick);
  }
  thank() {
    if (!this.gesture) return;
    this.gesture.stop().reset().play();
  }
  tick = (now) => {
    if (this.coarsePointer && this.last !== null && now - this.last < 32) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    const dt = this.last == null ? 0 : Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!document.hidden) {
      if (!this.motion.matches) this.mixer?.update(dt);
      this.renderer.render(this.scene, this.camera);
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.mixer?.stopAllAction();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
