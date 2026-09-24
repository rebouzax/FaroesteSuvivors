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
  for (let i = 0; i < (mapId === "desert" ? 220 : 110); i++) {
    const x = (random() - 0.5) * 225,
      z = (random() - 0.5) * 225;
    if (Math.hypot(x, z) < 14) continue;
    const type = mapId === "desert" ? (i % 3 === 0 ? "rock" : "cactus") : "rock";
    const size = mapId === "desert" ? 0.8 + random() * 2 : 0.6 + random() * 1.0;
    props.push({
      x,
      z,
      type,
      size,
      radius: type === "rock" ? size * 0.9 : size * 0.3,
    });
  }
  if (mapId === "town") for (let i = -4; i <= 4; i++) {
    const z = i * 23;
    for (const side of [-1,1]) props.push({x:side*9,z,type:"building",size:1,radius:3});
  }
  if (mapId === "mine") for(let i=0;i<20;i++) {
    const z=-105+i*11;
    for (const side of [-1,1]) props.push({x:side*22,z,type:"support",size:1,radius:0.65});
  }
  return props;
}
