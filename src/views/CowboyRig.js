import * as THREE from "three";
export function createCowboyRig() {
  const root = new THREE.Group(),
    torso = new THREE.Group();
  torso.position.y = 0.92;
  root.add(torso);
  const material = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const leather = material(0x62402d),
    leatherLight = material(0x9c6b40),
    cloth = material(0xc5a982),
    skin = material(0xb98260),
    dark = material(0x302723),
    metal = new THREE.MeshStandardMaterial({ color: 0xa6a49a, metalness: 0.7, roughness: 0.4 }),
    brass = new THREE.MeshStandardMaterial({ color: 0xc4a45b, metalness: 0.6, roughness: 0.5 });
  const mesh = (parent, geometry, mat, x, y, z) => {
    const part = new THREE.Mesh(geometry, mat);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  };
  const box = (parent, w, h, d, mat, x, y, z) =>
    mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  mesh(
    torso,
    new THREE.CylinderGeometry(0.32, 0.38, 0.78, 8),
    leather,
    0,
    0.36,
    0,
  );
  box(torso, 0.36, 0.58, 0.06, cloth, 0, 0.36, 0.31);
  // Lapelas de couro sobre a camisa, costura e abotoamento visíveis de frente.
  for (const side of [-1, 1]) {
    const lapel = box(torso, 0.17, 0.5, 0.04, leatherLight, side * 0.21, 0.47, 0.34);
    lapel.rotation.z = side * 0.27;
    for (let j = 0; j < 3; j++)
      mesh(torso, new THREE.SphereGeometry(0.021, 6, 4), brass, side * 0.28, 0.3 + j * 0.15, 0.375);
  }
  box(torso, 0.1, 0.16, 0.025, dark, 0, 0.5, 0.36);
  box(torso, 0.76, 0.11, 0.5, dark, 0, 0, 0);
  box(torso, 0.15, 0.11, 0.07, metal, 0, 0, 0.28);
  for (const side of [-1, 1]) {
    const belt = box(torso, 0.2, 0.13, 0.07, brass, side * 0.27, 0.01, 0.27);
    belt.rotation.z = side * 0.07;
  }
  const holster = box(torso, 0.17, 0.32, 0.19, dark, -0.39, -0.28, 0.1);
  holster.rotation.z = -0.18;
  // Corda enrolada à cintura, formada por pequenos laços de geometria compartilhada.
  const ropeGeo = new THREE.TorusGeometry(0.17, 0.018, 5, 12);
  for (let i = 0; i < 3; i++) mesh(torso, ropeGeo, leatherLight, 0.38, -0.1 - i * 0.085, 0.17);
  const tails = [];
  for (const sign of [-1, 1]) {
    const tail = new THREE.Group();
    tail.position.set(sign * 0.2, 0.08, -0.12);
    torso.add(tail);
    box(tail, 0.34, 0.45, 0.13, leather, 0, -0.24, 0);
    tails.push(tail);
  }
  box(torso, 0.18, 0.2, 0.035, cloth, -0.25, 0.4, -0.3);
  for (let i = 0; i < 4; i++)
    box(torso, 0.055, 0.008, 0.038, dark, -0.31 + i * 0.04, 0.49, -0.32);
  const head = new THREE.Group();
  head.position.y = 0.91;
  torso.add(head);
  const face = mesh(head, new THREE.SphereGeometry(0.25, 12, 9), skin, 0, 0, 0);
  face.scale.set(0.85, 1.1, 0.86);
  box(head, 0.29, 0.055, 0.18, dark, 0, 0.16, -0.025); // cabelo curto
  mesh(head, new THREE.BoxGeometry(0.075, 0.065, 0.085), skin, 0, -0.03, 0.23); // nariz
  box(head, 0.12, 0.012, 0.016, dark, 0, -0.135, 0.21); // boca, sem barba
  for (const sign of [-1, 1]) {
    mesh(head, new THREE.SphereGeometry(0.028, 6, 5), dark, sign * 0.09, 0.04, 0.207);
    const brow = box(head, 0.105, 0.025, 0.032, dark, sign * 0.09, 0.103, 0.198);
    brow.rotation.z = sign * 0.12;
    mesh(head, new THREE.SphereGeometry(0.055, 6, 5), skin, sign * 0.217, -0.035, 0);
  }
  mesh(
    head,
    new THREE.CylinderGeometry(0.61, 0.62, 0.052, 20),
    leather,
    0,
    0.26,
    0,
  );
  mesh(
    head,
    new THREE.CylinderGeometry(0.25, 0.36, 0.27, 12),
    leather,
    0,
    0.41,
    0,
  );
  mesh(head, new THREE.CylinderGeometry(0.35, 0.38, 0.065, 8), dark, 0, 0.3, 0);
  const hatBand = mesh(head, new THREE.CylinderGeometry(0.325, 0.34, 0.055, 12), dark, 0, 0.33, 0);
  mesh(hatBand, new THREE.BoxGeometry(0.075, 0.048, 0.022), brass, 0, 0, 0.337);
  const legs = [],
    knees = [],
    arms = [],
    elbows = [];
  for (const sign of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sign * 0.2, 0.93, 0);
    root.add(hip);
    legs.push(hip);
    box(hip, 0.25, 0.39, 0.28, leather, 0, -0.2, 0);
    const knee = new THREE.Group();
    knee.position.y = -0.39;
    hip.add(knee);
    knees.push(knee);
    box(knee, 0.23, 0.3, 0.25, leather, 0, -0.16, 0);
    box(knee, 0.29, 0.23, 0.42, dark, 0, -0.42, 0.07);
    box(knee, 0.29, 0.22, 0.035, leatherLight, 0, -0.1, 0.14); // perneiras
    mesh(knee, new THREE.CylinderGeometry(0.05, 0.05, 0.06, 7), brass, sign * 0.13, -0.32, 0.06); // espora
    box(knee, 0.15, 0.15, 0.02, cloth, 0, -0.08, 0.135);
    const shoulder = new THREE.Group();
    shoulder.position.set(sign * 0.43, 0.65, 0);
    torso.add(shoulder);
    arms.push(shoulder);
    box(shoulder, 0.22, 0.34, 0.25, leather, 0, -0.17, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    elbows.push(elbow);
    box(elbow, 0.19, 0.29, 0.22, leather, 0, -0.145, 0);
    box(elbow, 0.23, 0.09, 0.255, dark, 0, -0.27, 0);
    mesh(elbow, new THREE.SphereGeometry(0.115, 6, 5), skin, 0, -0.32, 0);
  }
  const grip = box(elbows[1], 0.07, 0.3, 0.07, dark, 0, -0.37, 0.04);
  grip.rotation.x = 0.35;
  const whipCoil = mesh(
    elbows[1],
    new THREE.TorusGeometry(0.18, 0.023, 5, 16),
    leather,
    0,
    -0.48,
    0.05,
  );
  const pistol = new THREE.Group();
  elbows[0].add(pistol);
  pistol.position.set(0, -0.3, 0.06);
  pistol.visible = false;
  box(pistol, 0.1, 0.11, 0.4, metal, 0, 0, 0.18);
  mesh(pistol, new THREE.CylinderGeometry(0.09, 0.09, 0.13, 8), metal, 0, -0.035, 0.13).rotation.x = Math.PI / 2;
  box(pistol, 0.08, 0.06, 0.4, dark, 0, 0.065, 0.18);
  box(pistol, 0.1, 0.21, 0.12, dark, 0, -0.1, 0.01);
  const flash = mesh(
    pistol,
    new THREE.ConeGeometry(0.13, 0.38, 5),
    new THREE.MeshBasicMaterial({ color: 0xffe499 }),
    0,
    0,
    0.53,
  );
  flash.rotation.x = Math.PI / 2;
  flash.visible = false;
  root.userData.rig = {
    torso,
    head,
    legs,
    knees,
    arms,
    elbows,
    tails,
    whipCoil,
    pistol,
    flash,
  };
  return root;
}
export function animateCowboy(root, run, dt) {
  const rig = root.userData.rig,
    p = run.player,
    t = p.walkTime * 10;
  const moving = p.moving,
    amplitude = moving ? 1 : 0;
  const target = Math.atan2(p.dx, p.dz),
    difference = Math.atan2(
      Math.sin(target - root.rotation.y),
      Math.cos(target - root.rotation.y),
    );
  root.rotation.y += difference * Math.min(1, dt * 14);
  root.position.set(p.x, Math.abs(Math.sin(t)) * amplitude * 0.07, p.z);
  rig.torso.rotation.z = Math.sin(t) * 0.055 * amplitude;
  rig.torso.rotation.x = -0.055 * amplitude + Math.sin(t * 2) * 0.035 * amplitude;
  rig.torso.rotation.y = Math.sin(t) * 0.06 * amplitude;
  rig.head.rotation.z = -rig.torso.rotation.z * 0.5;
  rig.head.rotation.x = Math.sin((run.time + run.introTime) * 2) * 0.025;
  for (let i = 0; i < 2; i++) {
    const cycle = Math.sin(t + i * Math.PI);
    rig.legs[i].rotation.x = cycle * 0.65 * amplitude;
    rig.knees[i].rotation.x = Math.max(0, -cycle) * 0.95 * amplitude;
    rig.arms[i].rotation.set(-cycle * 0.35 * amplitude, 0, i ? -0.07 : 0.07);
    rig.elbows[i].rotation.x = -0.25 + Math.max(0, cycle) * 0.12 * amplitude;
    rig.tails[i].rotation.x = 0.12 + Math.sin(t + i) * 0.12 * amplitude;
  }
  if (run.attack) {
    const phase = run.attack.age / 0.38;
    rig.arms[1].rotation.x = -Math.sin(phase * Math.PI) * 2.15;
    rig.arms[1].rotation.z = -Math.sin(phase * Math.PI) * 0.65;
    rig.torso.rotation.y += -Math.sin(phase * Math.PI) * 0.28;
    rig.elbows[1].rotation.x = -Math.cos(phase * Math.PI) * 0.6;
  }
  if (run.throwFlash > 0) {
    rig.arms[0].rotation.x =
      -Math.sin((1 - run.throwFlash / 0.65) * Math.PI) * 2.4;
    rig.elbows[0].rotation.x = -0.55;
  }
  rig.pistol.visible = Boolean(run.abilities?.pistol);
  rig.flash.visible = run.shotFlash > 0.12;
  if (run.shotFlash > 0) {
    rig.arms[0].rotation.x = -Math.PI / 2 + run.shotFlash;
    rig.elbows[0].rotation.x = -0.1;
  }
  rig.whipCoil.visible = !run.attack;
}
