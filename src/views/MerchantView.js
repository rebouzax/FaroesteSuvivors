import * as THREE from "three";
import { disposeObject } from "./CharacterFactory.js";
export class MerchantView {
  constructor(host) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfce3b2, 0x272932, 2));
    const light = new THREE.DirectionalLight(0xffc682, 4);
    light.position.set(-3, 5, 4);
    this.scene.add(light);
    const rim = new THREE.DirectionalLight(0x879eac, 2);
    rim.position.set(3, 2, -3);
    this.scene.add(rim);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    this.camera.position.set(0.2, 2.2, 6.7);
    this.camera.lookAt(0, 1.25, 0);
    this.body = new THREE.Group();
    this.scene.add(this.body);
    this.build();
    this.time = 0;
    this.thanks = 0;
    this.last = null;
    this.observer = new ResizeObserver(() => {
      const w = host.clientWidth,
        h = host.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    this.observer.observe(host);
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.frame = requestAnimationFrame(this.tick);
  }
  build() {
    const cloth = new THREE.MeshStandardMaterial({
        color: 0x3e4245,
        roughness: 1,
        flatShading: true,
      }),
      leather = new THREE.MeshStandardMaterial({
        color: 0x75543a,
        roughness: 1,
      }),
      skin = new THREE.MeshStandardMaterial({ color: 0xb69b73 }),
      black = new THREE.MeshStandardMaterial({ color: 0x151b20 }),
      brass = new THREE.MeshStandardMaterial({
        color: 0xba995c,
        metalness: 0.4,
        roughness: 0.6,
      });
    const add = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this.body.add(mesh);
      return mesh;
    };
    add(new THREE.CylinderGeometry(0.43, 0.68, 1.6, 8), cloth, 0, 1.04, 0);
    const pack = add(
      new THREE.BoxGeometry(1.12, 1.35, 0.6),
      leather,
      0,
      1.35,
      -0.5,
    );
    pack.rotation.z = 0.08;
    add(
      new THREE.CylinderGeometry(0.17, 0.17, 1.3, 7),
      cloth,
      -0.57,
      1.83,
      -0.43,
    ).rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.27, 0.52, 0.35), black, side * 0.25, 0.28, 0);
      add(
        new THREE.BoxGeometry(0.32, 0.2, 0.54),
        leather,
        side * 0.25,
        0.09,
        0.13,
      );
      add(
        new THREE.BoxGeometry(0.1, 1, 0.11),
        leather,
        side * 0.33,
        1.28,
        0.42,
      );
      add(
        new THREE.BoxGeometry(0.25, 0.28, 0.2),
        leather,
        side * 0.46,
        0.94,
        0.42,
      );
      add(
        new THREE.BoxGeometry(0.08, 0.08, 0.035),
        brass,
        side * 0.46,
        1,
        0.535,
      );
    }
    // Open hood shell and dark face cavity, with a warm scarf and visible eyes.
    const hood = add(
      new THREE.SphereGeometry(0.44, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.86),
      cloth,
      0,
      2.03,
      -0.01,
    );
    hood.scale.set(1, 1.25, 0.86);
    add(new THREE.SphereGeometry(0.31, 8, 6), black, 0, 2.01, 0.24);
    add(new THREE.BoxGeometry(0.49, 0.2, 0.18), leather, 0, 1.82, 0.45);
    for (const side of [-1, 1])
      add(
        new THREE.SphereGeometry(0.026, 5, 4),
        brass,
        side * 0.1,
        2.075,
        0.53,
      );
    add(new THREE.BoxGeometry(0.76, 0.1, 0.13), leather, 0, 0.84, 0.43);
    add(new THREE.BoxGeometry(0.17, 0.14, 0.07), brass, 0, 0.84, 0.53);
    this.arms = [];
    for (const side of [-1, 1]) {
      const upper = add(
          new THREE.CylinderGeometry(0.16, 0.14, 1, 7),
          cloth,
          0,
          0,
          0,
        ),
        lower = add(
          new THREE.CylinderGeometry(0.14, 0.12, 1, 7),
          cloth,
          0,
          0,
          0,
        ),
        hand = add(new THREE.SphereGeometry(0.12, 7, 5), skin, 0, 0, 0);
      this.arms.push({ side, upper, lower, hand });
    }
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 32),
      new THREE.MeshBasicMaterial({
        color: 0x1a1611,
        transparent: true,
        opacity: 0.35,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    this.scene.add(floor);
  }
  segment(mesh, a, b) {
    const direction = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.y = direction.length();
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
  }
  thank() {
    this.thanks = 2.2;
  }
  tick = (now) => {
    const dt =
      this.last === null ? 0 : Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!document.hidden) {
      this.time += dt;
      this.thanks = Math.max(0, this.thanks - dt);
      const gesture =
        this.thanks > 0 ? Math.sin((1 - this.thanks / 2.2) * Math.PI) : 0;
      this.body.rotation.x = gesture * 0.18;
      this.body.position.y = this.motion.matches
        ? 0
        : Math.sin(this.time * 1.7) * 0.012;
      this.body.rotation.y = this.motion.matches
        ? 0
        : Math.sin(this.time * 0.5) * 0.035;
      for (const arm of this.arms) {
        const s = arm.side,
          a = new THREE.Vector3(s * 0.45, 1.62, 0.03),
          b = new THREE.Vector3(s * (0.5 + gesture * 0.1), 1.14, 0.37),
          c = new THREE.Vector3(-s * 0.23, 1.38, 0.59);
        if (s === 1) {
          c.x += gesture * 0.7;
          c.y += gesture * 0.3;
          c.z += gesture * 0.18;
        }
        this.segment(arm.upper, a, b);
        this.segment(arm.lower, b, c);
        arm.hand.position.copy(c);
      }
      this.renderer.render(this.scene, this.camera);
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
