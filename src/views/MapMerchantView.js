import * as THREE from "three";

// A small recognizable hooded merchant and stall, rendered in the game's scene.
export class MapMerchantView {
  constructor(scene) {
    this.root = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({
      color: 0x343c46,
      flatShading: true,
    });
    const wood = new THREE.MeshStandardMaterial({ color: 0x795033 });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xf1bd60,
      emissive: 0x533109,
    });
    const add = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this.root.add(mesh);
      return mesh;
    };
    this.body = add(new THREE.ConeGeometry(0.65, 1.7, 8), cloth, 0, 1, 0);
    add(new THREE.SphereGeometry(0.4, 8, 6), cloth, 0, 2, 0);
    add(
      new THREE.SphereGeometry(0.25, 7, 5),
      new THREE.MeshBasicMaterial({ color: 0x111219 }),
      0,
      2,
      0.25,
    );
    for (const side of [-1, 1]) {
      add(new THREE.SphereGeometry(0.045, 5, 4), gold, side * 0.09, 2.05, 0.48);
      const arm = add(
        new THREE.BoxGeometry(0.7, 0.19, 0.25),
        cloth,
        side * 0.13,
        1.2,
        0.5,
      );
      arm.rotation.z = side * 0.2;
    }
    add(new THREE.BoxGeometry(1.15, 1.4, 0.5), wood, 0, 1.3, -0.45);
    add(new THREE.BoxGeometry(2.7, 0.65, 0.9), wood, 0, 0.33, 1.3);
    for (let i = 0; i < 3; i++)
      add(
        new THREE.BoxGeometry(0.35, 0.05, 0.5),
        gold,
        -0.7 + i * 0.7,
        0.69,
        1.3,
      );
    this.marker = add(new THREE.OctahedronGeometry(0.3), gold, 0, 3.2, 0);
    const ring = add(
      new THREE.RingGeometry(2.2, 2.4, 40),
      new THREE.MeshBasicMaterial({
        color: 0xffcb66,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      }),
      0,
      0.08,
      0,
    );
    ring.rotation.x = -Math.PI / 2;
    this.root.visible = false;
    scene.add(this.root);
  }
  render(run) {
    this.root.visible = Boolean(run.merchant);
    if (!run.merchant) return;
    this.root.position.set(run.merchant.x, 0, run.merchant.z);
    this.marker.position.y = 3.2 + Math.sin(run.time * 2) * 0.12;
    this.marker.rotation.y = run.time;
  }
}
