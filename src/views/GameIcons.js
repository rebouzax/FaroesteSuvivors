// Símbolos vetoriais locais. Compartilhados por cartas, loja, HUD e bússola.
// SVG inline evita fonte de ícones externa e mantém as bordas nítidas no celular.
const drawings = {
  pistol:
    '<path d="M9 25h30l6-5h9v8l-9 3-6-2-8 5H19l-4 14-7 2-2-4 8-18H9z"/><path d="M28 22v12M20 38l9 4M47 21v9"/>',
  molotov:
    '<path d="M25 11h14v8H25zM29 19v8c-10 8-14 15-14 21 0 8 8 11 17 11s17-3 17-11c0-7-6-14-14-21v-8"/><path d="M32 31c4 7-4 9-1 14 3-2 3-5 7-5 4 10-1 14-7 14-8 0-11-7-7-14 0 4 3 5 4 5-2-6 1-9 4-14z"/>',
  heart:
    '<path d="M32 54 9 32c-13-15 3-32 18-18l5 5 5-5c15-14 31 3 18 18z"/><path d="M16 31h9l4-8 6 18 5-9h8"/>',
  horseshoe:
    '<path d="M17 9h9v19c0 8 2 14 6 14s6-6 6-14V9h9v19c0 15-5 25-15 25S17 43 17 28z"/><path d="M17 16h9m12 0h9M20 47l-4 5m29-5 4 5"/>',
  ghostShot:
    '<path d="M30 8c13 0 18 9 18 21v22l-7-5-7 5-6-5-8 5V29C20 17 22 8 30 8z"/><path d="M16 22 6 14m13 23-13 4m31-15 5-2M28 26l5-2"/>',
  requiem:
    '<path d="M7 39c10-24 23-24 30-9 4 8 8 11 19-4M7 51c7-10 14-14 22-10 9 4 17 3 28-8M8 24c6-7 11-8 16-7"/><path d="M42 13h3m-35 4h2"/>',
  silverRain:
    '<path d="M13 13 6 30l9 15 9-15zm19-5-7 17 9 15 9-15zm19 5-7 17 9 15 9-15z"/><path d="M12 50v7m20-12v12m20-7v7"/>',
  lantern:
    '<path d="M23 19h18l4 9-4 24H23l-4-24zM26 19v-6c0-5 12-5 12 0v6M17 52h30"/><path d="M32 26c5 7 7 12 0 19-7-7-5-12 0-19z"/>',
  soulHarvest:
    '<path d="M28 54V26c0-8 6-14 13-14s13 6 13 14-6 13-13 13H18c-6 0-11-4-11-10s5-10 11-10c5 0 9 4 9 9"/><path d="M21 54h21M32 34c3-7 7-10 13-10"/>',
  boneStorm:
    '<path d="m12 15 5-5 9 6 12 17 7 3 7-5 4 5-7 7-9-1-12-11-16-11z"/><path d="m10 49 7-9m4 13 1-9m28-29-7 8m12 3-9 2"/>',
  ironWill:
    '<path d="M32 7 52 15v18c0 14-7 20-20 26C19 53 12 47 12 33V15z"/><path d="m22 32 7 7 14-17"/>',
  lastStand:
    '<path d="M11 49c5-16 15-24 28-24h16v9l-13 3-7-4-12 7-4 13z"/><path d="m21 24 5-15 5 13m-6-6 10-4M43 12h13"/>',
  whip: '<path d="M14 47c-6-6-3-14 3-18 6-3 11 0 13 4 2 6-3 11-7 8-3-2-1-5 2-5m5-3c6-5 15-11 21-9 6 2 6 11 0 15-4 3-6 6-5 10"/><path d="m11 52 8-10m25 9 1 5"/>',
  bow: '<path d="M16 7c17 12 17 38 0 50M16 7v50M10 32h42m-9-7 9 7-9 7"/><path d="M16 7c-3 4-3 7-1 10m1 40c-3-4-3-7-1-10"/>',
  haste:
    '<path d="M32 6v8m0 36v8M6 32h8m36 0h8M32 15a17 17 0 1 0 17 17"/><path d="m32 20 8 11-10 5"/>',
  spur: '<path d="M13 11h16l4 19 15 8 8 1v12H13l-5-5V33l6-6z"/><path d="m10 52-3 6m35-7 5 7"/>',
  magnet:
    '<path d="M17 9h11v22c0 10 8 10 8 0V9h11v22c0 17-8 25-20 25S17 48 17 31z"/><path d="M17 19h11m8 0h11"/>',
  fortune:
    '<path d="m32 7 7 15 16 3-11 12 2 17-14-8-14 8 2-17L9 25l16-3z"/><path d="m32 21 4 10-4 12-4-12z"/>',
  learning:
    '<path d="M32 15C23 9 14 9 8 13v38c9-5 17-4 24 1 7-5 15-6 24-1V13c-6-4-15-4-24 2zm0 0v37"/><path d="M16 23c4-2 8-2 12 0m-12 9c4-2 8-2 12 0m8-9c4-2 8-2 12 0m-12 9c4-2 8-2 12 0"/>',
  merchant:
    '<path d="M10 26 32 10l22 16v27H10z"/><path d="M12 29h40l-3 10H15zm20 10v14m-10-14v14m20-14v14M25 20h14"/>',
  coins:
    '<path d="M32 7 56 22v20L32 57 8 42V22z"/><path d="m8 22 24 15 24-15M32 37v20M25 24h14"/>',
};
const shopNames = {
  health: "heart",
  attack: "haste",
  movement: "spur",
  primary: "whip",
  armor: "ironWill",
  magnet: "magnet",
  fortune: "fortune",
  learning: "learning",
};
export function gameIcon(name, className = "") {
  const paths = drawings[shopNames[name] ?? name] ?? drawings.fortune;
  return `<svg class="game-icon ${className}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}
