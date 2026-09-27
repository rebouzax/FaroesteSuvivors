import * as THREE from "three";

const TWO_HANDS = new Set(["shotgun", "sawedoff", "rifle", "repeater", "crossbow"]);
const SHOTGUNS = new Set(["shotgun", "sawedoff"]);
const ease = (value) => value * value * (3 - 2 * value);
const envelope = (age, duration) => {
  if (age >= duration) return 0;
  return ease(Math.min(1, age / .075)) * ease(Math.min(1, (duration - age) / .2));
};

// Applied after AnimationMixer, then removed before the next mixer update.
// This also works with the older jointed rigs and João's Blender skeleton.
export class HighQualityCharacterAnimation {
  constructor(avatar, weapon) {
    this.weapon = weapon;
    this.twoHands = TWO_HANDS.has(weapon);
    this.shotgun = SHOTGUNS.has(weapon);
    this.newRig = Boolean(avatar.getObjectByName("Firearm"));
    this.parts = Object.fromEntries(Object.entries({
      chest: ["Chest"], head: ["Head"],
      leftArm: ["ArmL", "UpperArm.L"], rightArm: ["ArmR", "UpperArm.R"],
      leftElbow: ["ElbowL", "Forearm.L"], rightElbow: ["ElbowR", "Forearm.R"],
      leftHand: ["HandL", "Hand.L"], rightHand: ["HandR", "Hand.R"],
      leftLeg: ["LegL", "Thigh.L"], rightLeg: ["LegR", "Thigh.R"],
      leftKnee: ["KneeL", "Shin.L"], rightKnee: ["KneeR", "Shin.R"],
      foreGrip: ["ForeGrip"],
    }).map(([key, names]) => [key, names.map(name => avatar.getObjectByName(name)).find(Boolean)]));
    this.previous = [];
    this.time = 0;
    this.walkWeight = 0;
    this.aimWeight = 0;
    this.fireAge = 2;
    this.hurtAge = 2;
    this.lastShot = false;
    this.lastInvulnerable = 0;
  }

  restore() {
    for (const [part, rotation, position] of this.previous) {
      part.quaternion.copy(rotation);
      if (position) part.position.copy(position);
    }
    this.previous.length = 0;
  }

  rotate(key, x = 0, y = 0, z = 0) {
    const part = this.parts[key];
    if (!part || (!x && !y && !z)) return;
    if (!this.previous.some(item => item[0] === part))
      this.previous.push([part, part.quaternion.clone(), null]);
    part.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
  }

  move(key, x = 0, y = 0, z = 0) {
    const part = this.parts[key];
    if (!part) return;
    let item = this.previous.find(entry => entry[0] === part);
    if (!item) {
      item = [part, part.quaternion.clone(), part.position.clone()];
      this.previous.push(item);
    } else if (!item[2]) item[2] = part.position.clone();
    part.position.add(new THREE.Vector3(x, y, z));
  }

  update(root, run, dt) {
    const p = run.player;
    this.time += dt;
    const blend = 1 - Math.exp(-dt * 9);
    this.walkWeight += ((p.moving ? 1 : 0) - this.walkWeight) * blend;
    const shooting = run.shotFlash > .15 || run.primaryFlash > .15;
    if (shooting && !this.lastShot) this.fireAge = 0;
    this.lastShot = shooting;
    if (p.invulnerable > this.lastInvulnerable + .25 && p.invulnerable <= 1)
      this.hurtAge = 0;
    this.lastInvulnerable = p.invulnerable;
    this.fireAge += dt;
    this.hurtAge += dt;
    const shot = envelope(this.fireAge, this.shotgun ? .68 : .43);
    const hurt = envelope(this.hurtAge, .48);
    const aimTarget = this.twoHands ? (shooting || this.fireAge < .48 ? 1 : .55) : shooting ? 1 : 0;
    this.aimWeight += (aimTarget - this.aimWeight) * (1 - Math.exp(-dt * 12));
    const stride = Math.sin(p.walkTime * 14);
    const breath = Math.sin(this.time * 2.7);
    const sway = this.walkWeight * stride;
    this.rotate("chest", .018 * breath + .035 * Math.abs(sway) + .18 * shot - .2 * hurt,
      .035 * sway, .023 * sway + .09 * hurt);
    this.rotate("head", -.015 * breath - .05 * shot + .08 * hurt, -.025 * sway, -.04 * hurt);
    this.rotate("leftLeg", -.045 * sway, 0, -.018 * this.walkWeight);
    this.rotate("rightLeg", .045 * sway, 0, .018 * this.walkWeight);
    this.rotate("leftKnee", Math.max(0, -sway) * .16);
    this.rotate("rightKnee", Math.max(0, sway) * .16);

    if (this.twoHands) {
      const brace = this.aimWeight;
      const legacy = this.newRig ? .22 : .8;
      this.rotate("rightArm", -legacy * brace + .16 * shot, -.055 * brace, -.07 * brace);
      this.rotate("leftArm", -(legacy + .1) * brace + .1 * shot, .06 * brace,
        (this.newRig ? .09 : .48) * brace);
      this.rotate("rightElbow", -.16 * brace + .11 * shot);
      this.rotate("leftElbow", -.28 * brace);
      this.rotate("rightHand", -.06 * brace);
      this.rotate("leftHand", .1 * brace);
      // A shotgun's fore-end and supporting hand travel back and forward
      // together in two deliberate beats after the recoil.
      if (this.shotgun && this.fireAge < .68) {
        const pump = Math.max(0, Math.sin((this.fireAge - .19) * Math.PI / .29));
        const returnBeat = Math.max(0, Math.sin((this.fireAge - .38) * Math.PI / .3));
        const travel = Math.max(pump, returnBeat * .55) * .12;
        this.move("foreGrip", 0, 0, -travel);
        this.move(this.parts.leftHand ? "leftHand" : "leftElbow", 0, 0, -travel);
        this.rotate("leftElbow", pump * .22 - returnBeat * .12);
      }
    } else if (this.weapon === "bow" || this.weapon === "crossbow") {
      this.rotate("leftArm", -.4 * this.aimWeight, 0, .16 * this.aimWeight);
      this.rotate("rightArm", -.5 * this.aimWeight, 0, -.12 * this.aimWeight);
    } else {
      const lead = this.weapon === "dual" ? 1 : .7;
      this.rotate("rightArm", -.27 * this.aimWeight + .2 * shot - sway * .06);
      this.rotate("leftArm", -lead * .2 * this.aimWeight + sway * .06);
      this.rotate("rightElbow", -.12 * this.aimWeight + .08 * shot);
    }
    if (hurt) {
      this.rotate("leftArm", .26 * hurt, 0, -.18 * hurt);
      this.rotate("rightArm", .22 * hurt, 0, .18 * hurt);
    }
    root.position.y += this.walkWeight * Math.abs(stride) * .025 + (1 - this.walkWeight) * breath * .007;
    root.rotation.z = sway * .025 + hurt * .055;
  }
}
