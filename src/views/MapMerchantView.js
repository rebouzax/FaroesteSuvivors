import * as THREE from "three";
import { loadMerchantAsset } from "./MerchantAsset.js";

export class MapMerchantView {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.visible = false;
    this.disposed = false;
    scene.add(this.root);
    const gold = new THREE.MeshBasicMaterial({
      color: 0xffcb66,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    this.marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), gold);
    this.marker.position.y = 3.4;
    this.root.add(this.marker);
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.72, 32), gold);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.08;
    this.root.add(halo);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.77, 16),
      new THREE.MeshBasicMaterial({
        color: 0x2b1712,
        transparent: true,
        opacity: 0.27,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    this.root.add(shadow);
    loadMerchantAsset()
      .then(({ scene: model, animations }) => {
        if (this.disposed) return;
        const copy = model.clone(true);
        copy.scale.setScalar(1.14);
        this.root.add(copy);
        this.mixer = new THREE.AnimationMixer(copy);
        this.mixer.clipAction(animations[0]).play();
      })
      .catch((error) => {
        if (!this.disposed) console.warn("Mercador indisponível", error);
      });
  }
  render(run, dt = 0) {
    this.root.visible = Boolean(run.merchant);
    if (!run.merchant) return;
    this.root.position.set(run.merchant.x, 0, run.merchant.z);
    this.marker.position.y = 3.4 + Math.sin(run.time * 2) * 0.12;
    this.marker.rotation.y = run.time;
    if (
      Math.hypot(run.player.x - run.merchant.x, run.player.z - run.merchant.z) <
      45
    )
      this.mixer?.update(dt);
  }
  dispose() {
    this.disposed = true;
    this.mixer?.stopAllAction();
  }
}
