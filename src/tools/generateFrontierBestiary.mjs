import { mkdir,writeFile } from "node:fs/promises";
import { FRONTIER_ENEMIES,FRONTIER_BOSSES,FRONTIER_STAGES } from "../config/frontierExpansion.js";

const dir=new URL("../assets/bestiary/",import.meta.url);
await mkdir(dir,{recursive:true});
const hex=n=>`#${n.toString(16).padStart(6,"0")}`;
const shapes={
  dog:`<path d="M57 112 65 78 99 67 138 79 163 60 184 65 174 91 157 103 147 139 131 139 128 108 92 108 82 142 65 142 67 112z"/><path d="m177 67 13-27 20 9-8 24z"/><path d="M62 82 45 58 53 98"/>`,
  bat:`<path d="m120 104 36-47 20 4 43-28-8 49-34 28-24 32-21-13-12 30-12-30-21 13-24-32-34-28-8-49 43 28 20-4z"/>`,
  vulture:`<path d="m119 104-35-34-61-19 40 50-34 8 66 24 27 31 27-31 66-24-34-8 40-50-61 19-35 34z"/><path d="m156 87 14-34 30-13-12 30 19 16z"/>`,
  skeleton:`<path d="M86 72q0-29 34-29t34 29q0 15-13 22v14l28 15 12 42h-20l-13-28-18-6v39h-21v-39l-18 6-13 28H58l12-42 29-15V94Q86 87 86 72z"/><circle cx="105" cy="72" r="5" fill="#f2deae"/><circle cx="135" cy="72" r="5" fill="#f2deae"/><path d="M108 92h24m-24 12h24m-22 9v31m22-31v31" fill="none" stroke="#f2deae" stroke-width="5"/>`,
  miner:`<path d="M91 76q0-31 29-31t29 31v17l26 18 8 46h-21l-11-27-21-8v39h-22v-39l-21 8-11 27H55l8-46 28-18z"/><path d="m77 61 32-24 42 22-6 10H83zM150 89l34-35 8 8-31 37"/>`,
  marshal:`<path d="m77 78 21-15 44 0 22 17-7 18 20 17 8 46h-23l-12-29-18-10v40h-25v-40l-20 10-12 29H52l8-46 22-20z"/><path d="M77 63q39-34 83 0l-3 9H79zM91 71h56"/>`,
};
function art(id,spec,boss=false){
  const color=hex(spec.color??FRONTIER_STAGES[spec.stage]?.warm??0xb5a9ca);
  const form=shapes[spec.shape]??shapes.marshal;
  const bossMark=boss?`<circle cx="120" cy="93" r="62" fill="none" stroke="${color}" stroke-opacity=".4" stroke-width="3"/><path d="m79 45 10-23 15 16 16-24 16 24 15-16 10 23" fill="${color}" stroke="#24202c" stroke-width="6"/>`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><defs><radialGradient id="sky"><stop stop-color="${color}" stop-opacity=".48"/><stop offset="1" stop-color="#151c29"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="240" height="180" rx="15" fill="#202430"/><rect x="5" y="5" width="230" height="170" rx="12" fill="url(#sky)"/><circle cx="190" cy="34" r="19" fill="#e1dfd4" opacity=".7"/><path d="M12 149q55-17 108 0t108-1v18H12z" fill="#201d29"/><ellipse cx="120" cy="151" rx="55" ry="9" fill="${color}" opacity=".7" filter="url(#glow)"/>${bossMark}<g fill="${color}" stroke="#24202c" stroke-width="8" stroke-linejoin="round">${form}</g><path d="m116 81 8 5 8-5" fill="none" stroke="#f4dfb3" stroke-width="5"/><path d="M122 98q8 5 16 0" fill="none" stroke="#291d25" stroke-width="4"/><path d="M30 163h180" stroke="${color}" stroke-opacity=".7" stroke-width="3"/></svg>`;
}
let count=0;
for(const [id,spec] of Object.entries(FRONTIER_ENEMIES)){await writeFile(new URL(`${id}.svg`,dir),art(id,spec));count++;}
for(const [id,spec] of Object.entries(FRONTIER_BOSSES)){await writeFile(new URL(`${id}.svg`,dir),art(id,spec,true));count++;}
console.log(`Created ${count} bestiary illustrations.`);
