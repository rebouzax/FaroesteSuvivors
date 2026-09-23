import * as THREE from "three";

export function createVulture() {
  const root = new THREE.Group();
  const feathers = new THREE.MeshStandardMaterial({
    color: 0x272324,
    flatShading: true,
  });
  const neck = new THREE.MeshStandardMaterial({
    color: 0xba6c55,
    flatShading: true,
  });
  const bone = new THREE.MeshStandardMaterial({ color: 0xe2cca0 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 5), feathers);
  body.scale.set(0.75, 0.7, 1.35);
  root.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 6, 4), neck);
  head.position.set(0, 0.19, 0.56);
  root.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), bone);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.16, 0.8);
  root.add(beak);
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.21, 0.075, 4, 8),
    bone,
  );
  collar.position.set(0, 0.09, 0.37);
  root.add(collar);
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.name = `vulture-wing-${side}`;
    wing.position.x = side * 0.2;
    const broad = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.5), feathers);
    broad.position.x = side * 0.5;
    wing.add(broad);
    for (let i = 0; i < 4; i++) {
      const feather = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.52),
        feathers,
      );
      feather.position.set(side * (0.4 + i * 0.22), 0, -0.3);
      feather.rotation.y = -side * i * 0.08;
      wing.add(feather);
    }
    root.add(wing);
  }
  return root;
}
