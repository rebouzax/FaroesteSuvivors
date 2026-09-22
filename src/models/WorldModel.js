export function createWorld() {
  let seed = 1887;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const props = [
    { x: -11, z: -7, type: "rock", size: 2.7, radius: 2.43 },
    { x: -14, z: -9, type: "rock", size: 3.5, radius: 3.15 },
    { x: 9, z: 5, type: "cactus", size: 1.4, radius: 0.42 },
  ];
  for (let i = 0; i < 220; i++) {
    const x = (random() - 0.5) * 225,
      z = (random() - 0.5) * 225;
    if (Math.hypot(x, z) < 14) continue;
    const type = i % 3 === 0 ? "rock" : "cactus";
    const size = 0.8 + random() * 2;
    props.push({
      x,
      z,
      type,
      size,
      radius: type === "rock" ? size * 0.9 : size * 0.3,
    });
  }
  return props;
}
