import {SUPPLIED_ASSETS} from './suppliedAssets.js';
// Keep the original procedural floors. Flattened GLB tiles contain overlapping
// faces and caused depth flicker in all three stages that used this technique.
export const STAGE_TERRAIN={};
const THEMES={
 desert:['waypost'],mine:['rockfall-debris','scree-rock-cluster'],town:['saloon','general-store','bld-general-store-01'],canyon:['moraine-boulder'],
 cemetery:['gravestone-1','tombstone-01','coffin-1','crypta-1','tree-dead'],bellTown:['mudbrick-house','square-hay-bale-01','campfire'],
 glassMarsh:['cypress-tree','cypress-knee-cluster','driftwood-snag','mossy-boulder','shack'],midnightSaloon:['dun-ale-barrel'],
 forsakenRail:['freight-van','open-coal-wagon','goods-shed'],crowFortress:['dun-wall-torch','dun-treasure-chest'],saltFlats:['dead-tree-1'],
 emberFoundry:['oil-drum','oil-drum-stack','scrap-metal-shelter'],moonMonastery:['runestone'],
 thornGarden:['bare-tree-01','scarecrow-01','garden-shed'],lastDawn:['obelisk','ruined-house-shell'],
};
export function stageLayout(stage){
 const placements=[];
 const add=(assetId,x,z,width,rotation=0,flat=false)=>{
  if(!SUPPLIED_ASSETS[assetId])throw Error('Unknown scenery: '+assetId);
  placements.push({assetId,x,z,width,rotation,flat,radius:flat?0:width*Math.SQRT1_2});
 };
 const ids=THEMES[stage];if(!ids)return null;
 for(let row=-6;row<=6;row++)for(const side of [-1,1]){
  const id=ids[((row+6)*2+(side>0?1:0))%ids.length];
  const building=/house|saloon|store|shed|shack|shelter|shell|crypta/.test(id);
  const width=building?7:/van|wagon/.test(id)?7:/tree/.test(id)?3.8:/rock|boulder|debris/.test(id)?3:1.7;
  const x=side*(stage==='midnightSaloon'?14:building?22:18+(row+6)%3*5),z=row*16;
  add(id,x,z,width,building?(side<0?Math.PI/2:-Math.PI/2):row*.4);
 }
 if(stage==='forsakenRail')for(let i=-19;i<=19;i++)add('track-straight-tile',0,i*6,6,0,true);
 if(stage==='moonMonastery')add('cathedral',0,-105,15);
 if(stage==='thornGarden')add('farmhouse',38,72,9);
 return placements;
}
