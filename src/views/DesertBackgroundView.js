import * as THREE from "three";
import menuUrl from "../assets/models/menu.glb?url";
import { disposeObject } from "./CharacterFactory.js";

// O cenário inteiro é um GLB independente, com vultos, cerca, crânio e vento.
export class DesertBackgroundView {
  constructor(canvas) {
    this.canvas = canvas;
    this.coarsePointer = matchMedia("(pointer: coarse)").matches;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.coarsePointer,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, this.coarsePointer ? 1.05 : 1.45),
    );
    this.renderer.setClearColor(0xf1cf98);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffe7b0, 0xa06644, 2));
    const sun = new THREE.DirectionalLight(0xffd28c, 2);
    sun.position.set(-7, 15, 13);
    this.scene.add(sun);
    this.camera = new THREE.OrthographicCamera(-20, 20, 14, -14, 0.1, 160);
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.wind = true;
    this.last = null;
    this.frame = 0;
    this.time = 0;
    this.disposed = false;
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    window.addEventListener("resize", () => this.resize(), options);
    document.addEventListener("visibilitychange", () => this.sync(), options);
    this.motion.addEventListener("change", () => this.sync(), options);
    this.resize();
    import("three/addons/loaders/GLTFLoader.js")
      .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(menuUrl))
      .then(({ scene, animations }) => {
        if (this.disposed) return;
        this.scene.add(scene);
        this.mixer = new THREE.AnimationMixer(scene);
        const wind = animations.find((clip) => clip.name === "Wind");
        if (wind) this.mixer.clipAction(wind).play();
        this.addSand();
        this.draw();
      })
      .catch((error) => {
        if (!this.disposed)
          console.warn("Cenário 3D do menu indisponível.", error);
      });
    this.sync();
  }
  addSand() {
    const geometry = new THREE.BufferGeometry(),
      positions = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      positions[i * 3] = Math.sin(i * 17.25) * 25;
      positions[i * 3 + 1] = -0.45 + (i % 11) * 0.12;
      positions[i * 3 + 2] = 1 + (i % 9) * 1.5;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.grains = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffebbb,
        size: 0.09,
        transparent: true,
        opacity: 0.48,
      }),
    );
    this.scene.add(this.grains);
  }
  resize() {
    const width = innerWidth,
      height = innerHeight,
      aspect = width / Math.max(1, height);
    this.renderer.setSize(width, height, false);
    const visibleHalfHeight = 14;
    this.camera.left = -visibleHalfHeight * aspect;
    this.camera.right = visibleHalfHeight * aspect;
    this.camera.top = visibleHalfHeight;
    this.camera.bottom = -visibleHalfHeight;
    const focus = aspect < 0.8 ? 8 : 0;
    this.camera.position.set(focus, 10.5, 26);
    this.camera.lookAt(focus, 1.3, 0);
    this.camera.updateProjectionMatrix();
    this.draw();
  }
  draw() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }
  tick = (now) => {
    if (this.coarsePointer && this.last !== null && now - this.last < 32) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    const dt =
      this.last === null ? 0 : Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.time += dt;
    this.mixer?.update(dt);
    if (this.grains) {
      const attr = this.grains.geometry.attributes.position;
      for (let i = 0; i < 90; i++)
        attr.setX(
          i,
          ((attr.getX(i) + dt * (1 + (i % 5) * 0.28) + 26) % 52) - 26,
        );
      attr.needsUpdate = true;
    }
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };
  sync() {
    cancelAnimationFrame(this.frame);
    this.last = null;
    this.draw();
    if (this.wind && !this.motion.matches && !document.hidden)
      this.frame = requestAnimationFrame(this.tick);
  }
  setWind(enabled) {
    if (this.wind === enabled) return;
    this.wind = enabled;
    this.sync();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.controller.abort();
    this.mixer?.stopAllAction();
    disposeObject(this.scene);
    this.renderer.dispose();
  }
}
