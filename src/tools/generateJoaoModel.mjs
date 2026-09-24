// Execute com `node src/tools/generateJoaoModel.mjs` na raiz do projeto.
// Produz um GLB independente com rig e clips. Não roda no navegador.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";

// GLTFExporter utiliza FileReader para montar os bytes finais mesmo sem texturas.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const model = new THREE.Group();
const variant = process.argv[2] || "joao";
if (!["joao", "maria", "indigo"].includes(variant))
  throw new Error("Personagem desconhecido: " + variant);
model.name = { joao: "JoaoVaqueiro", maria: "MariaBonita", indigo: "Indigo" }[
  variant
];
const mat = (color, metalness = 0) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: metalness ? 0.48 : 0.88,
    metalness,
    flatShading: true,
  });
const palette = {
  joao: [0x66432e, 0x926b48, 0xe7dbbf, 0x424f58, 0xbd8765],
  maria: [0x692d32, 0xb88062, 0xf6e6cf, 0x343642, 0xb47759],
  indigo: [0x275461, 0x65989a, 0xcbb491, 0x38352f, 0xa76e50],
}[variant];
const maria = variant === "maria",
  indigo = variant === "indigo",
  joao = variant === "joao";
const leather = mat(palette[0]),
  coatEdge = mat(0x3e3028),
  lapel = mat(palette[1]),
  shirt = mat(palette[2]),
  jeans = mat(palette[3]),
  jeansLight = mat(0x677078),
  skin = mat(palette[4]),
  shadeSkin = mat(0x895a45),
  hair = mat(maria ? 0x302322 : indigo ? 0x1b1c20 : 0x201d20),
  boots = mat(0x3b2e28),
  belt = mat(0x352c25),
  brass = mat(0xc6a66d, 0.65),
  steel = mat(0x808b91, 0.72),
  bone = mat(0xf0d7ad),
  eye = mat(0x292524),
  cord = mat(0x7c5439);
const group = (parent, name, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
};
const mesh = (parent, geo, material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
};
const box = (parent, w, h, d, material, x = 0, y = 0, z = 0) =>
  mesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
const cyl = (parent, rt, rb, h, material, x, y, z, sides = 10) =>
  mesh(parent, new THREE.CylinderGeometry(rt, rb, h, sides), material, x, y, z);
const ellipsoid = (parent, rx, ry, rz, material, x, y, z) => {
  const m = mesh(parent, new THREE.SphereGeometry(1, 12, 9), material, x, y, z);
  m.scale.set(rx, ry, rz);
  return m;
};
// Superfície afunilada compartilhada por torso e membros: as secções arredondadas
// formam cintura, quadris e articulações sem o aspecto de blocos empilhados.
const sculpt = (parent, rings, material, x = 0, z = 0, segments = 12) => {
  const vertices = [],
    indices = [];
  for (const [y, rx, rz, cx = 0, cz = 0] of rings)
    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      vertices.push(
        x + cx + Math.cos(angle) * rx,
        y,
        z + cz + Math.sin(angle) * rz,
      );
    }
  for (let row = 0; row < rings.length - 1; row++)
    for (let i = 0; i < segments; i++) {
      const a = row * segments + i,
        b = row * segments + ((i + 1) % segments),
        c = a + segments,
        d = b + segments;
      indices.push(a, c, b, b, c, d);
    }
  for (let i = 1; i < segments - 1; i++)
    indices.push(
      0,
      i,
      i + 1,
      (rings.length - 1) * segments,
      (rings.length - 1) * segments + i + 1,
      (rings.length - 1) * segments + i,
    );
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(parent, geo, material);
};
const seam = (parent, points, radius, material) =>
  mesh(
    parent,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      ),
      Math.max(7, points.length * 3),
      radius,
      4,
      false,
    ),
    material,
  );
const coatBack = (parent, rings, material) => {
  const vertices = [],
    indices = [],
    segments = 12;
  for (const [y, rx, rz] of rings)
    for (let j = 0; j <= segments; j++) {
      const a = Math.PI + (j * Math.PI) / segments;
      vertices.push(Math.cos(a) * rx, y, Math.sin(a) * rz);
    }
  for (let k = 0; k < rings.length - 1; k++)
    for (let j = 0; j < segments; j++) {
      const a = k * (segments + 1) + j,
        b = a + segments + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const back = mesh(parent, geo, material.clone());
  back.material.side = THREE.DoubleSide;
  return back;
};
const poly = (parent, coords, depth, material, z) => {
  const shape = new THREE.Shape();
  coords.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 1,
  });
  return mesh(parent, geo, material, 0, 0, z);
};

// Silhuetas independentes: duster de João, jaqueta curta de Maria e túnica de Indigo.
const hips = group(model, "Hips", 0, 0.96, 0);
const chest = group(hips, "Chest", 0, 0.1, 0);
sculpt(
  chest,
  maria
    ? [
        [0.02, 0.22, 0.17],
        [0.12, 0.2, 0.15],
        [0.35, 0.25, 0.18],
        [0.48, 0.29, 0.2],
        [0.61, 0.245, 0.17],
        [0.72, 0.19, 0.15],
      ]
    : indigo
      ? [
          [0.02, 0.28, 0.2],
          [0.16, 0.26, 0.19],
          [0.42, 0.3, 0.205],
          [0.62, 0.34, 0.22],
          [0.73, 0.205, 0.15],
        ]
      : [
          [0.02, 0.25, 0.19],
          [0.17, 0.25, 0.18],
          [0.43, 0.305, 0.21],
          [0.62, 0.33, 0.225],
          [0.73, 0.205, 0.15],
        ],
  shirt,
);
if (maria) {
  for (const sign of [-1, 1]) {
    ellipsoid(chest, 0.14, 0.1, 0.105, shirt, sign * 0.115, 0.46, 0.13);
    poly(
      chest,
      [
        [sign * 0.1, 0.68],
        [sign * 0.3, 0.6],
        [sign * 0.31, 0.42],
        [sign * 0.22, 0.12],
        [sign * 0.1, 0.16],
      ],
      0.064,
      leather,
      0.155,
    );
    poly(
      chest,
      [
        [sign * 0.1, 0.68],
        [sign * 0.29, 0.6],
        [sign * 0.18, 0.39],
        [sign * 0.095, 0.5],
      ],
      0.036,
      lapel,
      0.248,
    );
    const tail = group(
      hips,
      sign === 1 ? "CoatTailR" : "CoatTailL",
      sign * 0.2,
      0.03,
      -0.12,
    );
    poly(
      tail,
      [
        [sign * 0.01, 0],
        [sign * 0.14, -0.05],
        [sign * 0.21, -0.28],
        [sign * 0.07, -0.37],
      ],
      0.1,
      leather,
      -0.11,
    );
  }
  sculpt(
    chest,
    [
      [0.04, 0.235, 0.185],
      [0.13, 0.24, 0.188],
      [0.19, 0.21, 0.17],
    ],
    lapel,
    0,
    -0.02,
  );
  seam(
    chest,
    [
      [-0.18, 0.47, 0.249],
      [-0.1, 0.44, 0.27],
      [0, 0.42, 0.3],
      [0.1, 0.44, 0.27],
      [0.18, 0.47, 0.249],
    ],
    0.012,
    brass,
  );
} else if (indigo) {
  for (const sign of [-1, 1]) {
    const mantle = poly(
      chest,
      [
        [sign * 0.12, 0.68],
        [sign * 0.34, 0.59],
        [sign * 0.38, 0.35],
        [sign * 0.21, 0.19],
        [sign * 0.09, 0.34],
      ],
      0.07,
      leather,
      0.15,
    );
    mantle.rotation.z = sign * 0.05;
    const tail = group(
      hips,
      sign === 1 ? "CoatTailR" : "CoatTailL",
      sign * 0.14,
      0.03,
      -0.06,
    );
    poly(
      tail,
      [
        [sign * 0.01, 0],
        [sign * 0.2, -0.03],
        [sign * 0.29, -0.48],
        [sign * 0.19, -0.62],
        [sign * 0.03, -0.52],
      ],
      0.09,
      leather,
      0.01,
    );
    for (let i = 0; i < 3; i++)
      cyl(
        tail,
        0.01,
        0.01,
        0.12,
        bone,
        sign * (0.075 + i * 0.06),
        -0.48 - i * 0.02,
        0.12,
        5,
      );
  }
  poly(
    chest,
    [
      [-0.27, 0.65],
      [0.27, 0.65],
      [0.16, 0.47],
      [0, 0.25],
      [-0.16, 0.47],
    ],
    0.035,
    lapel,
    0.2,
  );
  for (let i = 0; i < 5; i++)
    ellipsoid(chest, 0.023, 0.025, 0.018, brass, (i - 2) * 0.053, 0.41, 0.273);
} else
  for (const sign of [-1, 1]) {
    poly(
      chest,
      [
        [sign * 0.13, 0.69],
        [sign * 0.37, 0.55],
        [sign * 0.33, 0.08],
        [sign * 0.21, -0.15],
        [sign * 0.13, 0.07],
      ],
      0.085,
      leather,
      0.18,
    );
    poly(
      chest,
      [
        [sign * 0.13, 0.69],
        [sign * 0.29, 0.56],
        [sign * 0.16, 0.39],
        [sign * 0.095, 0.52],
      ],
      0.045,
      lapel,
      0.285,
    );
    cyl(
      chest,
      0.019,
      0.019,
      0.017,
      brass,
      sign * 0.28,
      0.18,
      0.29,
      6,
    ).rotation.x = Math.PI / 2;
    const tail = group(
      hips,
      sign === 1 ? "CoatTailR" : "CoatTailL",
      sign * 0.18,
      0.11,
      -0.13,
    );
    poly(
      tail,
      [
        [sign * 0.01, 0.05],
        [sign * 0.21, -0.02],
        [sign * 0.29, -0.6],
        [sign * 0.24, -0.79],
        [sign * 0.05, -0.71],
      ],
      0.12,
      leather,
      -0.07,
    );
    seam(
      tail,
      [
        [sign * 0.05, -0.67, 0.05],
        [sign * 0.17, -0.74, 0.05],
        [sign * 0.24, -0.72, 0.05],
      ],
      0.014,
      coatEdge,
    );
  }
if (!indigo) {
  coatBack(
    chest,
    maria
      ? [
          [0.09, 0.23, 0.19],
          [0.36, 0.3, 0.23],
          [0.61, 0.275, 0.22],
        ]
      : [
          [0.04, 0.28, 0.2],
          [0.35, 0.32, 0.235],
          [0.62, 0.34, 0.24],
        ],
    leather,
  );
  seam(
    chest,
    [
      [-0.25, 0.61, -0.18],
      [-0.14, 0.63, -0.24],
      [0, 0.64, -0.25],
      [0.14, 0.63, -0.24],
      [0.25, 0.61, -0.18],
    ],
    0.013,
    coatEdge,
  );
}
const waist = cyl(
  hips,
  maria ? 0.245 : indigo ? 0.3 : 0.32,
  maria ? 0.26 : indigo ? 0.32 : 0.34,
  0.13,
  belt,
  0,
  0.01,
  0,
  12,
);
waist.scale.z = 0.8;
box(hips, 0.14, 0.105, 0.02, brass, 0, 0.01, 0.22);
box(hips, 0.076, 0.063, 0.032, belt, 0, 0.01, 0.238);
for (let i = 0; i < 9; i++) {
  const x = -0.3 + i * 0.073;
  const cartridge = cyl(hips, 0.021, 0.021, 0.105, brass, x, 0.01, 0.221, 6);
  cartridge.rotation.z = 0.02;
}
if (!indigo) {
  for (const sign of maria ? [-1, 1] : [-1]) {
    const holster = poly(
      hips,
      [
        [sign * 0.43, 0.035],
        [sign * 0.25, -0.03],
        [sign * 0.3, -0.34],
        [sign * 0.38, -0.41],
      ],
      0.1,
      boots,
      0.1,
    );
    holster.rotation.z = -sign * 0.12;
  }
} else {
  const quiver = cyl(hips, 0.13, 0.11, 0.78, boots, -0.36, 0.44, -0.27, 10);
  quiver.rotation.z = -0.27;
  for (let i = 0; i < 5; i++) {
    const arrow = cyl(
      hips,
      0.014,
      0.014,
      0.56,
      bone,
      -0.37 + (i - 2) * 0.04,
      0.96,
      -0.27,
      5,
    );
    arrow.rotation.z = -0.26;
    mesh(
      hips,
      new THREE.ConeGeometry(0.045, 0.14, 5),
      brass,
      -0.48 + (i - 2) * 0.04,
      1.19,
      -0.27,
    );
  }
  seam(
    chest,
    [
      [-0.27, 0.62, 0.05],
      [-0.07, 0.47, 0.24],
      [0.24, 0.22, 0.25],
    ],
    0.025,
    cord,
  );
}
if (joao)
  for (let i = 0; i < 3; i++) {
    const coil = mesh(
      hips,
      new THREE.TorusGeometry(0.18 + i * 0.012, 0.016, 5, 22),
      cord,
      0.39,
      -0.17,
      0.09,
    );
    coil.rotation.y = 0.2;
    coil.position.x += i * 0.012;
  }
if (maria)
  for (const sign of [-1, 1]) {
    const panel = poly(
      hips,
      [
        [sign * 0.04, -0.1],
        [sign * 0.23, -0.07],
        [sign * 0.31, -0.39],
        [sign * 0.22, -0.61],
        [sign * 0.08, -0.54],
      ],
      0.06,
      lapel,
      0.1,
    );
    panel.rotation.z = sign * 0.08;
    seam(
      hips,
      [
        [sign * 0.09, -0.54, 0.177],
        [sign * 0.2, -0.6, 0.177],
        [sign * 0.3, -0.4, 0.177],
      ],
      0.012,
      brass,
    );
  }

const head = group(chest, "Head", 0, 0.84, 0.015);
ellipsoid(
  head,
  maria ? 0.194 : 0.225,
  maria ? 0.255 : 0.275,
  maria ? 0.165 : 0.19,
  skin,
  0,
  0.005,
  0.01,
);
// João mantém maxilar definido; Maria tem nariz e queixo mais delicados.
const jaw = sculpt(
  head,
  maria
    ? [
        [-0.235, 0.1, 0.113],
        [-0.18, 0.144, 0.13],
        [-0.055, 0.18, 0.152],
      ]
    : [
        [-0.235, 0.132, 0.115],
        [-0.19, 0.166, 0.145],
        [-0.055, 0.192, 0.165],
      ],
  skin,
  0,
  0.035,
  10,
);
ellipsoid(head, maria ? 0.048 : 0.066, 0.078, 0.073, skin, 0, -0.045, 0.177);
for (const sign of [-1, 1]) {
  ellipsoid(
    head,
    0.039,
    0.07,
    0.022,
    shadeSkin,
    sign * (maria ? 0.197 : 0.224),
    -0.025,
    0,
  );
  ellipsoid(
    head,
    maria ? 0.057 : 0.051,
    0.019,
    0.009,
    bone,
    sign * 0.082,
    0.037,
    maria ? 0.17 : 0.19,
  );
  ellipsoid(
    head,
    0.025,
    0.018,
    0.011,
    eye,
    sign * 0.082,
    0.037,
    maria ? 0.179 : 0.2,
  );
  const brow = ellipsoid(
    head,
    0.065,
    0.014,
    0.017,
    hair,
    sign * 0.08,
    0.092,
    maria ? 0.171 : 0.192,
  );
  brow.rotation.z = sign * (maria ? -0.09 : 0.13);
}
ellipsoid(
  head,
  maria ? 0.046 : 0.069,
  0.012,
  0.01,
  maria ? mat(0x965146) : shadeSkin,
  0,
  -0.164,
  0.182,
);
ellipsoid(head, maria ? 0.205 : 0.21, 0.095, 0.18, hair, 0, 0.205, 0);
if (maria) {
  // Volume lateral e uma trança baixa: silhueta feminina reconhecível mesmo de costas.
  for (const sign of [-1, 1]) {
    sculpt(
      head,
      [
        [-0.24, 0.068, 0.08],
        [0.025, 0.082, 0.09],
        [0.22, 0.073, 0.083],
      ],
      hair,
      sign * 0.165,
      -0.056,
      7,
    );
    ellipsoid(head, 0.07, 0.16, 0.08, hair, sign * 0.17, -0.13, -0.07);
    sculpt(
      head,
      [
        [-0.6, 0.04, 0.04],
        [-0.39, 0.06, 0.06],
        [-0.13, 0.08, 0.07],
        [0.15, 0.063, 0.07],
      ],
      hair,
      sign * 0.173,
      0.08,
      8,
    );
  }
  const braid = group(head, "BraidR", 0.18, -0.08, -0.09);
  for (let i = 0; i < 6; i++)
    ellipsoid(
      braid,
      0.049 - i * 0.004,
      0.055,
      0.052,
      hair,
      0.016 * Math.sin(i * 1.3),
      -0.085 - i * 0.085,
      0,
    );
  cyl(braid, 0.03, 0.03, 0.025, brass, 0, -0.54, 0, 7);
  for (const sign of [-1, 1])
    ellipsoid(head, 0.052, 0.028, 0.021, shadeSkin, sign * 0.095, -0.11, 0.16);
} else if (indigo) {
  sculpt(
    head,
    [
      [-0.41, 0.08, 0.075],
      [-0.19, 0.13, 0.11],
      [0.13, 0.15, 0.13],
    ],
    hair,
    0,
    -0.14,
    9,
  );
  const braid = group(head, "BraidR", -0.14, -0.07, -0.1);
  for (let i = 0; i < 6; i++)
    ellipsoid(
      braid,
      0.052 - i * 0.004,
      0.06,
      0.053,
      hair,
      -0.013 * Math.sin(i * 1.3),
      -0.095 - i * 0.09,
      0,
    );
  const band = cyl(head, 0.235, 0.235, 0.065, lapel, 0, 0.228, 0, 12);
  for (let i = 0; i < 5; i++)
    ellipsoid(head, 0.025, 0.028, 0.016, brass, (i - 2) * 0.073, 0.235, 0.208);
  // Pena simples na faixa; traje do arqueiro fica reconhecível sem chapéu de vaqueiro.
  const feather = ellipsoid(head, 0.046, 0.2, 0.015, bone, 0.18, 0.42, -0.03);
  feather.rotation.z = -0.23;
  seam(
    head,
    [
      [0.18, 0.26, -0.03],
      [0.21, 0.47, -0.03],
      [0.23, 0.59, -0.03],
    ],
    0.008,
    lapel,
  );
}
// Aba com laterais dobradas e copa poligonal; fita, fivela e barbicacho.
const brimGeo = new THREE.BufferGeometry();
const brimPts = [],
  brimIdx = [],
  N = 24;
for (let i = 0; i < N; i++) {
  const a = (i * 2 * Math.PI) / N;
  brimPts.push(Math.cos(a) * 0.29, 0.259, Math.sin(a) * 0.235);
  brimPts.push(
    Math.cos(a) * 0.57,
    0.254 + 0.11 * Math.pow(Math.abs(Math.cos(a)), 4),
    Math.sin(a) * 0.44,
  );
  const j = (i + 1) % N;
  brimIdx.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1);
}
brimGeo.setAttribute("position", new THREE.Float32BufferAttribute(brimPts, 3));
brimGeo.setIndex(brimIdx);
brimGeo.computeVertexNormals();
if (!indigo) {
  if (maria) {
    // Aba oval baixa, de pistoleira, distinta da copa alta de João.
    const brim = mesh(
      head,
      new THREE.CylinderGeometry(0.47, 0.49, 0.035, 18),
      coatEdge,
      0,
      0.256,
      0,
    );
    brim.scale.z = 0.78;
    sculpt(
      head,
      [
        [0.275, 0.225, 0.185],
        [0.41, 0.205, 0.155],
        [0.51, 0.19, 0.142],
      ],
      leather,
    );
    const trim = cyl(head, 0.225, 0.225, 0.045, brass, 0, 0.314, 0, 12);
    trim.scale.z = 0.82;
    ellipsoid(head, 0.053, 0.034, 0.02, steel, 0, 0.32, 0.191);
  } else {
    const brim = mesh(head, brimGeo, leather);
    brim.material.side = THREE.DoubleSide;
    sculpt(
      head,
      [
        [0.27, 0.32, 0.28],
        [0.33, 0.26, 0.23],
        [0.58, 0.205, 0.17],
        [0.64, 0.18, 0.15],
      ],
      leather,
    );
    cyl(head, 0.337, 0.342, 0.055, coatEdge, 0, 0.291, 0, 11);
    box(head, 0.074, 0.049, 0.018, brass, 0, 0.305, 0.34);
    for (let i = 0; i < 5; i++)
      box(
        head,
        0.015,
        0.017,
        0.017,
        lapel,
        0,
        0.33 + i * 0.046,
        0.249 - i * 0.015,
      );
    const strap = cyl(head, 0.013, 0.011, 0.36, cord, -0.51, 0.02, 0.035, 6);
    strap.rotation.z = 0.05;
  }
}

for (const sign of [-1, 1]) {
  const side = sign === -1 ? "L" : "R";
  const leg = group(
    model,
    `Leg${side}`,
    sign * (maria ? 0.143 : 0.175),
    0.94,
    0,
  );
  sculpt(
    leg,
    [
      [-0.44, 0.13, 0.128],
      [-0.34, 0.13, 0.132],
      [-0.16, maria ? 0.152 : 0.164, 0.15],
      [0, maria ? 0.158 : 0.165, 0.145],
    ],
    jeans,
    0,
    0,
    10,
  );
  ellipsoid(leg, 0.14, 0.105, 0.15, jeans, 0, -0.42, 0);
  const knee = group(leg, `Knee${side}`, 0, -0.44, 0);
  sculpt(
    knee,
    [
      [-0.39, 0.09, 0.095],
      [-0.3, 0.092, 0.1],
      [-0.17, 0.114, 0.114],
      [0, 0.133, 0.132],
    ],
    jeans,
    0,
    0.006,
    10,
  );
  cyl(knee, 0.105, 0.105, 0.045, jeansLight, 0, -0.36, 0.008, 9);
  const boot = group(knee, `Boot${side}`, 0, -0.32, 0);
  sculpt(
    boot,
    [
      [-0.18, 0.135, 0.14],
      [-0.06, 0.12, 0.12],
      [0.08, 0.105, 0.105],
    ],
    boots,
    0,
    0,
    10,
  );
  ellipsoid(boot, 0.14, 0.085, 0.205, boots, 0, -0.16, 0.092);
  ellipsoid(boot, 0.145, 0.023, 0.222, coatEdge, 0, -0.222, 0.086);
  if (maria) cyl(boot, 0.11, 0.11, 0.026, brass, 0, -0.08, 0, 9);

  const shoulder = group(
    chest,
    `Arm${side}`,
    sign * (maria ? 0.285 : 0.36),
    0.58,
    0,
  );
  sculpt(
    shoulder,
    [
      [-0.38, maria ? 0.09 : 0.1, 0.105],
      [-0.2, maria ? 0.105 : 0.115, 0.12],
      [0, maria ? 0.137 : 0.15, 0.14],
    ],
    leather,
    sign * 0.035,
    0,
    10,
  );
  ellipsoid(
    shoulder,
    maria ? 0.129 : 0.15,
    0.11,
    maria ? 0.13 : 0.15,
    leather,
    0,
    -0.025,
    0,
  );
  const elbow = group(shoulder, `Elbow${side}`, sign * 0.07, -0.37, 0);
  sculpt(
    elbow,
    [
      [-0.34, 0.085, 0.079],
      [-0.17, 0.1, 0.096],
      [0, 0.109, 0.108],
    ],
    indigo ? skin : leather,
    0,
    0,
    10,
  );
  cyl(elbow, 0.1, 0.085, 0.04, indigo ? lapel : coatEdge, 0, -0.33, 0, 9);
  const hand = group(elbow, `Hand${side}`, 0, -0.36, 0.015);
  ellipsoid(hand, maria ? 0.077 : 0.087, 0.117, 0.077, skin, 0, -0.076, 0);
  ellipsoid(
    hand,
    0.034,
    0.066,
    0.035,
    skin,
    -sign * 0.077,
    -0.102,
    0.04,
  ).rotation.z = sign * 0.4;
  if ((sign === -1 && !indigo) || (sign === 1 && maria)) {
    // Revólver na mão esquerda em repouso; durante o disparo o braço mira.
    const gun = group(
      hand,
      sign === -1 ? "Revolver" : "RevolverR",
      0,
      -0.14,
      0.052,
    );
    gun.rotation.x = Math.PI / 2;
    const handle = box(gun, 0.1, 0.18, 0.085, boots, 0, -0.07, 0);
    handle.rotation.x = -0.18;
    const cylinder = cyl(gun, 0.086, 0.086, 0.13, steel, 0, 0.01, 0.077, 8);
    cylinder.rotation.x = Math.PI / 2;
    box(gun, 0.11, 0.1, 0.28, steel, 0, 0.038, 0.17);
    const barrel = cyl(gun, 0.049, 0.05, 0.43, steel, 0, 0.036, 0.43, 8);
    barrel.rotation.x = Math.PI / 2;
    box(gun, 0.03, 0.045, 0.035, steel, 0, 0.13, 0.35);
  } else if (indigo) {
    if (sign === 1) {
      const bow = group(hand, "Bow", 0, -0.19, 0.11);
      const wood = mat(0x65462d);
      const arc = mesh(
        bow,
        new THREE.TorusGeometry(0.47, 0.035, 5, 16, Math.PI),
        wood,
        0,
        0.08,
        0,
      );
      arc.rotation.z = -Math.PI / 2;
      box(bow, 0.018, 0.9, 0.015, bone, -0.04, 0.08, 0);
      cyl(bow, 0.04, 0.042, 0.22, cord, 0, 0, 0.06, 7);
    } else {
      const arrow = cyl(hand, 0.012, 0.013, 0.9, bone, 0, -0.26, 0.12, 6);
      arrow.rotation.x = Math.PI / 2;
      mesh(
        hand,
        new THREE.ConeGeometry(0.043, 0.14, 5),
        steel,
        0,
        -0.27,
        0.56,
      ).rotation.x = Math.PI / 2;
    }
  } else if (sign === 1) {
    cyl(hand, 0.032, 0.036, 0.32, cord, 0, -0.195, 0.045, 7).rotation.x = 0.1;
  }
}
// Costuras e camadas mais estreitas quebram a silhueta cilíndrica sem texturas pesadas.
if (joao)
  for (const sign of [-1, 1]) {
    poly(
      chest,
      [
        [sign * 0.28, 0.53],
        [sign * 0.335, 0.53],
        [sign * 0.32, 0.13],
        [sign * 0.26, 0.13],
      ],
      0.008,
      lapel,
      0.286,
    );
    for (let i = 0; i < 3; i++)
      box(hips, 0.07, 0.013, 0.018, brass, sign * 0.26, 0.13 - i * 0.16, 0.243);
  }

// Biblioteca de clipes exportada no próprio GLB; os nomes são consumidos pelo runtime.
const tracks = (items) =>
  items.map(([name, times, values, axis = "x"]) => {
    const quaternions = [];
    for (const angle of values) {
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          axis === "x" ? angle : 0,
          axis === "y" ? angle : 0,
          axis === "z" ? angle : 0,
        ),
      );
      quaternions.push(q.x, q.y, q.z, q.w);
    }
    return new THREE.QuaternionKeyframeTrack(
      `${name}.quaternion`,
      times,
      quaternions,
    );
  });
const animation = (name, duration, items) =>
  new THREE.AnimationClip(name, duration, tracks(items));
const idle = animation("Idle", 2, [
  ["Chest", [0, 0.5, 1, 1.5, 2], [0, 0.018, 0, -0.012, 0]],
  ["Head", [0, 1, 2], [maria ? -0.04 : 0, 0.028, maria ? -0.04 : 0]],
  [
    "ArmR",
    [0, 1, 2],
    [
      maria ? -0.1 : indigo ? -0.16 : 0,
      -0.036,
      maria ? -0.1 : indigo ? -0.16 : 0,
    ],
  ],
  ["ArmL", [0, 1, 2], [indigo ? -0.13 : 0, 0, indigo ? -0.13 : 0]],
  ...(maria || indigo
    ? [["BraidR", [0, 1, 2], [-0.065, 0.08, -0.065], "z"]]
    : []),
]);
const cadence = maria ? 0.72 : indigo ? 0.9 : 0.82,
  stride = maria ? 0.43 : indigo ? 0.55 : 0.5,
  times = [0, cadence * 0.25, cadence * 0.5, cadence * 0.75, cadence];
const walk = animation("Walk", cadence, [
  ["LegL", times, [stride, 0, -stride, 0, stride]],
  ["LegR", times, [-stride, 0, stride, 0, -stride]],
  ["KneeL", times, [0, maria ? 0.38 : 0.47, 0, 0.08, 0]],
  ["KneeR", times, [0, 0.08, 0, maria ? 0.38 : 0.47, 0]],
  ["ArmL", times, [-0.28, 0, 0.28, 0, -0.28]],
  ["ArmR", times, [0.28, 0, -0.28, 0, 0.28]],
  ["Chest", times, [0.07, 0, -0.07, 0, 0.07], "y"],
  ["Head", times, [-0.035, 0, 0.035, 0, -0.035], "y"],
  ["CoatTailL", times, [-0.12, 0.02, -0.12, 0.02, -0.12]],
  ["CoatTailR", times, [0.02, -0.12, 0.02, -0.12, 0.02]],
  ...(maria || indigo
    ? [["BraidR", times, [-0.1, 0.08, -0.1, 0.08, -0.1], "z"]]
    : []),
]);
walk.tracks.push(
  new THREE.VectorKeyframeTrack(
    "Hips.position",
    times,
    [0, 0.97, 0, 0, 1.005, 0, 0, 0.97, 0, 0, 1.005, 0, 0, 0.97, 0],
  ),
);
const whip = animation("Whip", 0.38, [
  ["ArmR", [0, 0.07, 0.16, 0.24, 0.38], [0, -1, -2.15, -1.1, 0]],
  ["ElbowR", [0, 0.07, 0.16, 0.24, 0.38], [0, -0.42, -0.18, 0.28, 0]],
  ["Chest", [0, 0.07, 0.16, 0.24, 0.38], [0, 0.05, -0.22, 0.13, 0]],
]);
const primary = maria
  ? animation("Primary", 0.4, [
      ["ArmR", [0, 0.1, 0.2, 0.3, 0.4], [-0.1, -1.05, -1.53, -1.43, -0.1]],
      ["ElbowR", [0, 0.1, 0.2, 0.3, 0.4], [0, -0.23, -0.4, -0.29, 0]],
      ["ArmL", [0, 0.1, 0.2, 0.3, 0.4], [0, 0.19, 0.17, 0.13, 0]],
      ["Chest", [0, 0.1, 0.2, 0.3, 0.4], [0, -0.1, -0.15, 0.07, 0], "y"],
      ["Head", [0, 0.1, 0.2, 0.3, 0.4], [0, 0.05, 0.07, -0.03, 0], "y"],
    ])
  : animation("Primary", 0.64, [
      ["ArmR", [0, 0.12, 0.3, 0.46, 0.64], [-0.13, -0.65, -1.17, -0.67, -0.13]],
      ["ArmL", [0, 0.12, 0.3, 0.46, 0.64], [-0.13, -0.67, -1.28, -1.18, -0.13]],
      ["ElbowL", [0, 0.12, 0.3, 0.46, 0.64], [0, -0.35, -0.62, -0.21, 0]],
      ["Chest", [0, 0.12, 0.3, 0.46, 0.64], [0, -0.11, -0.2, 0.07, 0], "y"],
      ["Head", [0, 0.12, 0.3, 0.46, 0.64], [0, 0.05, 0.09, 0, 0], "y"],
    ]);
const shot = animation("Shot", 0.27, [
  ["ArmL", [0, 0.06, 0.16, 0.27], [0, -1.38, -1.53, 0]],
  ["ElbowL", [0, 0.06, 0.16, 0.27], [0, -0.12, -0.22, 0]],
  ["Chest", [0, 0.06, 0.16, 0.27], [0, -0.06, -0.12, 0]],
]);
const thrown = animation("Throw", 0.65, [
  ["ArmL", [0, 0.2, 0.42, 0.65], [0, 0.75, -1.7, 0]],
  ["ElbowL", [0, 0.2, 0.42, 0.65], [0, -0.65, 0.16, 0]],
]);
const hurt = animation("Hurt", 0.5, [
  ["Chest", [0, 0.12, 0.35, 0.5], [0, 0.22, -0.06, 0]],
  ["Head", [0, 0.12, 0.5], [0, -0.13, 0]],
]);
const exporter = new GLTFExporter();
const result = await exporter.parseAsync(model, {
  binary: true,
  animations: [
    idle,
    walk,
    variant === "joao" ? whip : primary,
    shot,
    thrown,
    hurt,
  ],
  onlyVisible: false,
  trs: true,
});
const output = new URL(
  `../assets/models/${{ joao: "joao-vaqueiro", maria: "maria-bonita", indigo: "indigo" }[variant]}.glb`,
  import.meta.url,
);
await writeFile(output, Buffer.from(result));
let triangles = 0;
model.traverse((obj) => {
  if (obj.isMesh)
    triangles += obj.geometry.index
      ? obj.geometry.index.count / 3
      : obj.geometry.attributes.position.count / 3;
});
console.log(
  `Modelo salvo: ${output.pathname} (${Math.round(result.byteLength / 1024)} KiB, ${Math.round(triangles)} triângulos, 6 animações).`,
);
