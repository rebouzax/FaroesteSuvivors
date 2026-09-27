import { FRONTIER_STAGES } from "../config/frontierExpansion.js";
import { sceneryFor,sceneryColliders } from '../config/sceneryPlan.js';

const landmarkStages=new Set(Object.keys(FRONTIER_STAGES));
export function createWorld(mapId = "desert") {
  let seed = 1887;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const props = mapId === "desert" ? [
    { x: -11, z: -7, type: "rock", size: 2.7, radius: 2.43 },
    { x: -14, z: -9, type: "rock", size: 3.5, radius: 3.15 },
    { x: 9, z: 5, type: "cactus", size: 1.4, radius: 0.42 },
  ] : [];
  const sparseLandmarks=landmarkStages.has(mapId);
  for (let i = 0; i < (mapId === "desert" ? 220 : sparseLandmarks ? 28 : 110); i++) {
    const x = (random() - 0.5) * 225,
      z = (random() - 0.5) * 225;
    if (Math.hypot(x, z) < (sparseLandmarks ? 27 : 14)) continue;
    const type = mapId === "desert" ? (i % 3 === 0 ? "rock" : "cactus") : "rock";
    const size = mapId === "desert" ? 0.8 + random() * 2 : sparseLandmarks ? 0.35 + random() * 0.5 : 0.6 + random() * 1.0;
    props.push({
      x,
      z,
      type,
      size,
      radius: type === "rock" ? size * 0.9 : size * 0.3,
    });
  }
  const landmarks=sceneryFor(mapId);
  for(const prop of props)prop.radius=prop.type==='rock'?prop.size*1.1:prop.size*.9;
  if(mapId==='desert'){
    for(const [x,z] of [[15,-6],[-20,18],[38,24],[-45,-34]])props.push({x:x+2.25,z,halfX:2.4,halfZ:.12,radius:2.41,type:'visual-collider'});
    for(const [x,z] of [[-15,-4],[16,19],[-22,29],[24,-17],[-33,1],[38,35],[-8,21],[20,11],[-25,-15],[7,-27],[33,-8]])props.push({x,z,radius:.35,type:'visual-collider'});
    for(const [x,z,rotation] of [[-15,19,.38],[19,-13,-.43],[-37,-29,.2]])props.push({x,z,rotation,halfX:2.2,halfZ:1.1,radius:2.46,type:'visual-collider'});
  }
  return props.filter(prop=>prop.type==='visual-collider'||!landmarks.some(p=>Math.hypot(prop.x-p.x,prop.z-p.z)<p.width*.65+prop.radius+1)).concat(sceneryColliders(mapId));
}
