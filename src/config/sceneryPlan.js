import { SUPPLIED_ASSETS } from './suppliedAssets.js';
const ground=id=>/tile|road-|ground|scatter|verge|ceiling/.test(id);
const passage=id=>/arch|corridor|gate|door/.test(id);
const widthFor=id=>id==='model-western'?30:id==='cemetery-1'?16:id==='canyon-scene-1'?24:id==='cathedral'?15:/house|saloon|store|crypta|shed|shack|shelter|shell/.test(id)?8:/wagon|van/.test(id)?7:/track|road|tile/.test(id)?6:/tree/.test(id)?4:/arch|corridor|ceiling/.test(id)?5:/boulder|rock/.test(id)?3.5:1.8;
export function sceneryFor(stage){
  const assets=Object.entries(SUPPLIED_ASSETS).filter(([,a])=>a.role==='environment'&&a.stage===stage);
  const placements=assets.map(([assetId],index)=>{
    const width=widthFor(assetId),angle=index*2.399963,radius=Math.max(20,width*.6+14)+Math.floor(index/6)*20;
    let x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,rotation=-angle;
    if(stage==='town'){x=(index%2?-1:1)*(assetId==='model-western'?62:30);z=-42+Math.floor(index/2)*18;rotation=x<0?Math.PI/2:-Math.PI/2;}
    if(stage==='forsakenRail'){
      if(assetId.startsWith('track-')){const n=assets.filter(([id])=>id.startsWith('track-')).findIndex(([id])=>id===assetId);x=-25;z=-21+n*6;rotation=0;}
      else{x=index%2?28:-35;z=-32+index*8;rotation=0;}
    }
    const flat=ground(assetId),open=passage(assetId);
    return {assetId,x,z,rotation,width,flat,open,radius:flat||open?0:width*Math.SQRT1_2};
  });
  const add=(assetId,x,z,width,rotation=0)=>placements.push({assetId,x,z,width,rotation,flat:ground(assetId),open:passage(assetId),radius:ground(assetId)||passage(assetId)?0:width*Math.SQRT1_2});
  if(stage==='town'){
    for(const p of placements){
      if(p.assetId==='saloon'){p.x=-11;p.z=-8;p.rotation=Math.PI/2;}
      if(p.assetId==='general-store'){p.x=11;p.z=-8;p.rotation=-Math.PI/2;}
    }
    for(let i=-4;i<=4;i++)if(i!==0)for(const side of [-1,1])add(i%2?'bld-general-store-01':'general-store',side*11,i*22-8,8,side<0?Math.PI/2:-Math.PI/2);
  }
  if(stage==='forsakenRail'){
    for(let i=-18;i<=18;i++)add('track-straight-tile',0,i*6,6);
    for(let i=-4;i<=4;i++)for(const side of [-1,1])add(i%2?'freight-van':'open-coal-wagon',side*15,i*22,8);
  }
  // Repeat local vegetation and burial props, preserving the central fighting lane.
  const repeat={glassMarsh:'cypress-tree',cemetery:'gravestone-1',thornGarden:'bare-tree-01',saltFlats:'dead-tree-1',crowFortress:'dun-wall-torch',moonMonastery:'runestone',emberFoundry:'oil-drum-stack'}[stage];
  if(repeat)for(let i=-4;i<=4;i++)for(const side of [-1,1])add(repeat,side*(14+Math.abs(i%3)*3),i*22,widthFor(repeat),i*.4);
  // Scatter the supplied local props across the playable map, not only at landmarks.
  const local=assets.map(([id])=>id).filter(id=>!ground(id)&&!passage(id)&&!['model-western','cemetery-1','canyon-scene-1','cathedral'].includes(id));
  if(local.length)for(let i=0;i<100;i++){
    const assetId=local[i%local.length],width=Math.min(5,widthFor(assetId))*(.8+(i%3)*.1);
    const x=Math.sin(i*71.13+stage.length)*102,z=Math.cos(i*37.71+stage.length)*102;
    if(Math.abs(x)<12||Math.hypot(x,z)<20||placements.some(p=>Math.hypot(x-p.x,z-p.z)<p.width*.72+width*.72+3))continue;
    add(assetId,x,z,width,i*2.399963);
  }
  return placements;
}
export function sceneryColliders(stage){
  return sceneryFor(stage).flatMap(p=>{
    if(p.flat)return [];
    if(p.open){
      // Keep the doorway open; corridor walls also need coverage along their length.
      const offsets=p.assetId.includes('corridor')?[-.32,0,.32]:[0];
      return [-1,1].flatMap(side=>offsets.map(depth=>({x:p.x+Math.cos(p.rotation)*side*p.width*.44+Math.sin(p.rotation)*depth*p.width,z:p.z-Math.sin(p.rotation)*side*p.width*.44+Math.cos(p.rotation)*depth*p.width,radius:offsets.length>1?p.width*.18:.3,type:'supplied-collider',size:1,assetId:p.assetId})));
    }
    return [{...p,type:'supplied-collider',size:1}];
  });
}
