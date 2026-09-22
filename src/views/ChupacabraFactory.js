import * as THREE from "three";
export function createChupacabra() {
  const root = new THREE.Group(),
    hide = new THREE.MeshStandardMaterial({
      color: 0x65584a,
      roughness: 1,
      flatShading: true,
    }),
    dark = new THREE.MeshStandardMaterial({ color: 0x342d31 }),
    bone = new THREE.MeshStandardMaterial({ color: 0xd6c496 });
  const part = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  const body = part(new THREE.SphereGeometry(0.5, 7, 5), hide, 0, 0.65, 0);
  body.scale.set(0.6, 0.8, 1.4);
  const head = part(new THREE.SphereGeometry(0.31, 6, 4), hide, 0, 0.82, 0.73);
  head.scale.set(1, 0.85, 1.1);
  part(new THREE.BoxGeometry(0.29, 0.19, 0.44), dark, 0, 0.69, 0.99);
  for (const side of [-1, 1]) {
    const ear = part(
      new THREE.ConeGeometry(0.14, 0.45, 3),
      hide,
      side * 0.2,
      1.13,
      0.65,
    );
    ear.rotation.z = -side * 0.25;
    part(
      new THREE.SphereGeometry(0.06, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xff6432 }),
      side * 0.17,
      0.85,
      0.97,
    );
    const fang = part(
      new THREE.ConeGeometry(0.055, 0.19, 4),
      bone,
      side * 0.11,
      0.55,
      1.12,
    );
    fang.rotation.x = Math.PI;
  }
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Group();
    leg.name = `dog-leg-${i}`;
    leg.position.set(i % 2 ? -0.25 : 0.25, 0.62, i < 2 ? 0.4 : -0.48);
    root.add(leg);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.17), hide);
    shin.position.y = -0.28;
    leg.add(shin);
    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.27), dark);
    paw.position.set(0, -0.55, 0.07);
    leg.add(paw);
    const spike = part(
      new THREE.ConeGeometry(0.11, 0.32, 4),
      bone,
      0,
      1,
      -0.48 + i * 0.25,
    );
    spike.rotation.x = -0.2;
  }
  const tail = part(new THREE.ConeGeometry(0.12, 0.8, 5), hide, 0, 0.75, -0.97);
  tail.rotation.x = -1.1;
  return root;
}
