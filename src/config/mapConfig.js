import { FRONTIER_STAGES } from "./frontierExpansion.js";
export const MAPS = Object.freeze({
  desert: { name: "Deserto dos Condenados", ground: 0x77798b, sky: 0x1b2a45, fog: 0x293750, warm: 0xd9e7ff, ambient: 0xc5d4f0 },
  mine: { name: "Mina da Noite", ground: 0x4b4140, sky: 0x211c24, fog: 0x211c24, warm: 0xe6b771, ambient: 0x91899c },
  town: { name: "Cidade Fantasma", ground: 0x494856, sky: 0x111827, fog: 0x192131, warm: 0xc6d5ef, ambient: 0x8795b5 },
  canyon: { name: "Desfiladeiro das Cinzas", ground: 0xaa6c54, sky: 0x915d70, fog: 0x915d70, warm: 0xffba78, ambient: 0xf3c0ab },
  cemetery: { name: "Necrópole da Fronteira", ground: 0x646c65, sky: 0x343b53, fog: 0x343b53, warm: 0x9caacc, ambient: 0xb8bfc9 },
  bellTown: { name: "Pueblo das Campanas", ground: 0x6f696f, sky: 0x3c324b, fog: 0x514458, warm: 0xe6bc75, ambient: 0xb8a8c7 },
  glassMarsh: { name: "Pântano de Vidro", ground: 0x4d7068, sky: 0x243d48, fog: 0x294f53, warm: 0x9fd4b2, ambient: 0x93b9ae },
  midnightSaloon: { name: "Dama da Meia-Noite", ground: 0x594441, sky: 0x251e2d, fog: 0x302631, warm: 0xf3a866, ambient: 0xc59b81 },
  forsakenRail: { name: "Ferrovia dos Condenados", ground: 0x625b58, sky: 0x292d3c, fog: 0x343743, warm: 0xe2aa68, ambient: 0xb8a49b },
  crowFortress: { name: "Fortaleza dos Corvos", ground: 0x514b5d, sky: 0x201f33, fog: 0x2a2a42, warm: 0xabb9d6, ambient: 0x9aa7c1 },
  ...FRONTIER_STAGES,
});
export const MAP_IDS = Object.keys(MAPS);
