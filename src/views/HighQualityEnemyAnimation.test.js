import { expect, it } from "vitest";
import * as THREE from "three";
import { animateEnemyHigh, resetEnemyHigh } from "./HighQualityEnemyAnimation.js";

it("anima dano e mira sem acumular rotação entre quadros",()=>{
  const model=new THREE.Group();
  for(const name of ["Frame","Head","ArmL","ArmR","LegL","LegR"])
    model.add(Object.assign(new THREE.Group(),{name}));
  const view=new THREE.Group();view.add(model);view.userData.shape="skeleton";
  const enemy={id:4,x:1,z:2,speed:2,hitFlash:.12,attackFlash:.58,aimTimer:.4};
  animateEnemyHigh(view,enemy,1,.016);
  expect(model.getObjectByName("ArmR").rotation.x).toBeLessThan(0);
  resetEnemyHigh(view);
  expect(model.getObjectByName("ArmR").quaternion.equals(new THREE.Quaternion())).toBe(true);
  expect(model.position.y).toBe(0);
});
