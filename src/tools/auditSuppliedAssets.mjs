import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Read-only inspection of user originals. No admission/copy occurs here.
const source=process.argv[2];
if(!source)throw new Error("Informe a pasta de modelos GLB.");
const stageGroups={
  desert:["Canyon Scene(1)","dune-slope-corner-tile","dune-tile","sand-tile","road-sand-corner","road-sand-straight","waypost","Scropiao"],
  mine:["rockfall-debris","scree-rock-cluster","Aranha(1)","bats-01","Caveira_voadora","dun-rat"],
  town:["Saloon","model_western","bld-general-store-01","general-store","shop-hanging-sign-01","Poste(1)","road-dirt-4way","road-dirt-corner","road-dirt-straight","Zombie(1)","Ghoul","Esqueleto_sem_cabeça"],
  canyon:["moraine-boulder","dirt-path-ground","Cobra","Lobo"],
  cemetery:["Cemetery(1)","Coffin(1)","Coffin(2)","Crypta(1)","Grave(2)","Gravestone(1)","tombstone-01","Tree Dead","skeleton-01","ghost","Morte"],
  bellTown:["mudbrick-house","campfire","square-hay-bale-01","grass-verge-01"],
  glassMarsh:["cypress-knee-cluster","cypress-tree","driftwood-snag","dry-hummock-tile","mooring-post","mossy-boulder","shack"],
  midnightSaloon:["Dama_Malvina","ghost_2","dun-ale-barrel","jack-o-lantern-01"],
  forsakenRail:["crossing-keeper-hut","freight-van","goods-shed","open-coal-wagon","railway-boulder","track-curve-wide-tile","track-diamond-crossing-tile","track-double-curve-tile","track-double-straight-tile","track-end-stub-tile","track-points-left-t-tile","track-straight-tile","Clanker"],
  crowFortress:["dun-arch-doorway","dun-cell-bar-door","dun-corridor-4way","dun-corridor-corner","dun-corridor-straight","dun-floor-candles","dun-treasure-chest","dun-vaulted-ceiling","dun-wall-manacles","dun-wall-torch","dun-skeleton"],
  saltFlats:["shell-pebble-scatter","Dead tree(1)","Gigante"],
  emberFoundry:["oil-drum-stack","oil-drum","scrap-metal-shelter"],
  moonMonastery:["Cathedral","runestone"],
  thornGarden:["countryside-grass-tile","farm-gate-sign","farm-gate","farmhouse","garden-shed","scarecrow-01","bare-tree-01"],
  lastDawn:["obelisk","ruined-house-shell"],
  merchant:["Viking(1)","centuriao_romano"],
  campaignReward:["pirata"],
};
const actors=new Set(["Aranha(1)","bats-01","Caveira_voadora","centuriao_romano","Clanker","Cobra","Dama_Malvina","Esqueleto_sem_cabeça","ghost","ghost_2","Ghoul","Gigante","Lobo","Morte","pirata","Scropiao","skeleton-01","dun-skeleton","dun-rat","Viking(1)","Zombie(1)"]);
const rows=[];
for(const filename of fs.readdirSync(source).filter(f=>f.toLowerCase().endsWith(".glb")).sort()){
  const file=path.join(source,filename),bytes=fs.readFileSync(file);
  if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw new Error(`GLB inválido: ${filename}`);
  if(bytes.readUInt32LE(16)!==0x4e4f534a)throw new Error(`JSON GLB ausente: ${filename}`);
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for(const buffer of gltf.buffers||[])if(buffer.uri)throw new Error(`Buffer externo: ${filename}`);
  for(const image of gltf.images||[])if(image.uri&&!image.uri.startsWith("data:"))throw new Error(`Imagem externa: ${filename}`);
  const name=filename.slice(0,-4),destination=Object.entries(stageGroups).find(([,names])=>names.includes(name))?.[0];
  if(!destination)throw new Error(`Modelo sem destino: ${filename}`);
  rows.push({file:filename,sha256:crypto.createHash("sha256").update(bytes).digest("hex"),bytes:bytes.length,role:actors.has(name)?"actor":"environment",destination,
    license:"unverified — awaiting user confirmation",admission:"pending",requiredExtensions:gltf.extensionsRequired||[],
    triangles:(gltf.meshes||[]).reduce((sum,m)=>sum+m.primitives.reduce((n,p)=>n+(gltf.accessors[p.indices??p.attributes.POSITION]?.count||0)/3,0),0),
    skins:gltf.skins?.length||0,animations:(gltf.animations||[]).map(a=>a.name),
  });
}
const manifest={schema:1,source,validation:"Local GLB container/metadata inspection only; game-dev CLI unavailable. Rendering and admission pending.",releaseBlocked:true,
  count:rows.length,bytes:rows.reduce((sum,a)=>sum+a.bytes,0),assets:rows};
fs.mkdirSync("docs",{recursive:true});
fs.writeFileSync("docs/supplied-assets-audit.json",JSON.stringify(manifest,null,2)+"\n");
const lines=["# Destinação dos modelos fornecidos","","Inspeção estrutural local; importação e validação visual pendentes da confirmação de licença. Os arquivos originais não foram alterados.","","| Arquivo | Destino proposto | Papel | Animações existentes |","| --- | --- | --- | --- |"];
for(const a of rows)lines.push(`| ${a.file} | ${a.destination} | ${a.role} | ${a.animations.length} |`);
fs.writeFileSync("docs/supplied-assets-plan.md",lines.join("\n")+"\n");
console.log(JSON.stringify({count:manifest.count,bytes:manifest.bytes,animated:rows.filter(a=>a.animations.length).map(a=>a.file),unassigned:0}));
