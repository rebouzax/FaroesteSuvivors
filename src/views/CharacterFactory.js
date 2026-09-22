import * as THREE from "three";

export function createBat() {
  const root = new THREE.Group(),
    bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f3048,
      roughness: 1,
    });
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 6, 4),
    bodyMaterial,
  );
  body.scale.set(1, 1.3, 0.7);
  root.add(body);
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(1, 0.25);
  wingShape.lineTo(0.8, -0.3);
  wingShape.lineTo(0.55, -0.12);
  wingShape.lineTo(0.35, -0.43);
  wingShape.lineTo(0.15, -0.2);
  wingShape.closePath();
  const wingGeometry = new THREE.ShapeGeometry(wingShape),
    wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x69465b,
      side: THREE.DoubleSide,
      roughness: 1,
    });
  const wings = [];
  for (const sign of [-1, 1]) {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(wingGeometry, wingMaterial);
    mesh.scale.x = sign;
    pivot.add(mesh);
    root.add(pivot);
    wings.push(pivot);
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.32, 3),
      bodyMaterial,
    );
    ear.position.set(sign * 0.16, 0.34, 0);
    root.add(ear);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.047, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xffcf62 }),
    );
    eye.position.set(sign * 0.1, 0.06, 0.16);
    root.add(eye);
  }
  root.userData.wings = wings;
  return root;
}

export function disposeObject(root) {
  const geometries = new Set(),
    materials = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material)
      for (const mat of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(mat);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
