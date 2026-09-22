import * as THREE from "three";

export function createCowboy() {
  const root = new THREE.Group();
  const materials = {
    leather: new THREE.MeshStandardMaterial({ color: 0x795036, roughness: 1 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0xb58d60, roughness: 1 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc18b63, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x372a22, roughness: 1 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9b4936, roughness: 1 }),
  };
  const box = (w, h, d, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  };
  box(0.72, 0.85, 0.42, materials.leather, 0, 1.12, 0);
  box(0.48, 0.72, 0.045, materials.shirt, 0, 1.12, 0.235);
  box(0.75, 0.13, 0.46, materials.dark, 0, 0.76, 0);
  box(0.15, 0.11, 0.04, materials.shirt, 0, 0.77, 0.26);
  box(0.43, 0.44, 0.4, materials.skin, 0, 1.79, 0);
  box(0.46, 0.17, 0.43, materials.dark, 0, 1.56, 0);
  box(0.51, 0.12, 0.46, materials.red, 0, 1.49, 0);
  // Worn patches on leather, stitched trouser knee and sleeves.
  box(0.2, 0.21, 0.025, materials.shirt, -0.23, 1.08, -0.225);
  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.2, 0.74, 0);
    root.add(pivot);
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.57, 0.28),
      materials.leather,
    );
    leg.position.y = -0.28;
    pivot.add(leg);
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.22, 0.43),
      materials.dark,
    );
    boot.position.set(0, -0.62, 0.065);
    pivot.add(boot);
    legs.push(pivot);
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.64, 0.24),
      materials.leather,
    );
    arm.position.set(side * 0.48, 1.14, 0);
    root.add(arm);
    if (side === 1) root.userData.arm = arm;
  }
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.63, 0.65, 0.075, 10),
    materials.leather,
  );
  brim.position.y = 2.03;
  root.add(brim);
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.39, 0.32, 8),
    materials.leather,
  );
  crown.position.y = 2.21;
  root.add(crown);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.4, 0.075, 8),
    materials.dark,
  );
  band.position.y = 2.09;
  root.add(band);
  for (const x of [-0.11, 0.11])
    box(0.055, 0.055, 0.025, materials.dark, x, 1.83, 0.21);
  const handle = box(0.08, 0.38, 0.08, materials.dark, 0.49, 0.77, 0.08);
  handle.rotation.x = 0.4;
  root.userData.legs = legs;
  return root;
}

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
