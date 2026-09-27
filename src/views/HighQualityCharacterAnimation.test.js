import { expect, it } from "vitest";
import * as THREE from "three";
import { HighQualityCharacterAnimation } from "./HighQualityCharacterAnimation.js";

it("mantém as duas mãos na escopeta e restaura a pose do mixer", () => {
  const avatar = new THREE.Group();
  for (const name of ["Chest","Head","ArmL","ArmR","ElbowL","ElbowR","HandL","HandR","LegL","LegR","KneeL","KneeR","Firearm","ForeGrip"])
    avatar.add(Object.assign(new THREE.Group(), { name }));
  const animator = new HighQualityCharacterAnimation(avatar,"shotgun");
  const root = new THREE.Group();
  const run = { player:{ moving:false, walkTime:0, invulnerable:0 }, shotFlash:.2, primaryFlash:0 };
  animator.update(root,run,.01);
  animator.restore();
  animator.update(root,run,.25);
  expect(avatar.getObjectByName("ArmL").rotation.x).toBeLessThan(0);
  expect(avatar.getObjectByName("ArmR").rotation.x).toBeLessThan(0);
  expect(avatar.getObjectByName("ForeGrip").position.z).toBeLessThan(0);
  animator.restore();
  expect(avatar.getObjectByName("ArmL").quaternion.equals(new THREE.Quaternion())).toBe(true);
  expect(avatar.getObjectByName("ForeGrip").position.z).toBe(0);
});
