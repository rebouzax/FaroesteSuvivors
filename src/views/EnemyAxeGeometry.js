import * as THREE from 'three';
export function enemyAxeGeometry(){
 const edge=new THREE.Shape();edge.moveTo(.01,.13);edge.lineTo(.28,.04);edge.quadraticCurveTo(.42,.23,.28,.43);edge.lineTo(.01,.33);edge.closePath();
 const head=new THREE.ExtrudeGeometry(edge,{depth:.065,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:1,steps:1,curveSegments:5});head.translate(0,0,-.0325);
 return {shaft:new THREE.CylinderGeometry(.035,.04,.8,6),head};
}
