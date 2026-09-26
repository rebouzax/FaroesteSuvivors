// Builds the v0.8 low-poly PS2-style hero set as compact animated GLBs.
// Run: node src/tools/generateV08Heroes.mjs
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFile } from "node:fs/promises";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((bytes) => { this.result = bytes; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((bytes) => { this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString("base64")}`; this.onloadend?.(); }); }
};

const designs = {
  // João follows the four-view PS2 vaqueiro concept: clean-shaven, white shirt,
  // open weathered duster, curved leather hat, revolver and coiled lasso.
  joao:{coat:0x68432e,shirt:0xe7e2d6,pants:0x344556,skin:0xad7554,hat:0x52331f,accent:0xa6815a,height:1.8,shoulders:.38,weapon:"whip",build:"lean",hair:"short",trim:"leather"},
  maria:{coat:0x8d342d,shirt:0xe2d1b0,pants:0x483a39,skin:0xc1845e,hat:0x57241f,accent:0xe6b34f,height:1.73,shoulders:.36,weapon:"pistol",build:"lean",hair:"braid",scarf:0xbd3229},
  indigo:{coat:0x354b63,shirt:0xb2bec3,pants:0x343740,skin:0x96664f,hat:0x273444,accent:0x9bb7c8,height:1.82,shoulders:.38,weapon:"bow",build:"lean",hair:"long"},
  labuta:{coat:0x536047,shirt:0xb5a486,pants:0x4d4a3d,skin:0xa87553,hat:0x373e30,accent:0xc5a768,height:1.82,shoulders:.48,weapon:"shotgun",build:"heavy",beard:"full",trim:"brass"},
  rosa:{coat:0x793e4d,shirt:0xe0c49f,pants:0x354148,skin:0xbc8465,hat:0x51363a,accent:0xd8a45d,height:1.75,shoulders:.36,weapon:"dual",build:"lean",hair:"braid",scarf:0x9e3344},
  elias:{coat:0x56605a,shirt:0xc8b28c,pants:0x343a42,skin:0x996a51,hat:0x625742,accent:0xd7b263,height:1.88,shoulders:.43,weapon:"rifle",build:"broad",beard:"full",trim:"brass"},
  silas:{coat:0x443d4a,shirt:0x8b8b83,pants:0x33313a,skin:0xb5866b,hat:0x292630,accent:0xa99779,height:1.84,shoulders:.36,weapon:"knives",build:"lean",hair:"long"},
  ada:{coat:0x354456,shirt:0xe2c998,pants:0x494a50,skin:0x764c37,hat:0x403640,accent:0xc4ae7a,height:1.74,shoulders:.36,weapon:"crossbow",build:"lean",hair:"braid"},
  ruth:{coat:0x925342,shirt:0xd8ad7b,pants:0x4e5149,skin:0xbe7e5c,hat:0x62443a,accent:0xe4b15f,height:1.8,shoulders:.43,weapon:"sawedoff",build:"broad",hair:"short"},
  teo:{coat:0x5c6a4e,shirt:0xdfcba9,pants:0x555045,skin:0xa16c51,hat:0x493d30,accent:0xd5aa66,height:1.86,shoulders:.38,weapon:"repeater",build:"lean",hair:"short"},
  valeria:{coat:0x773f51,shirt:0xd9c19f,pants:0x39404b,skin:0xa36a52,hat:0x35303b,accent:0xd5a96f,height:1.75,shoulders:.36,weapon:"dual",build:"lean",hair:"braid",scarf:0xb03950},
  tomas:{coat:0x524d3e,shirt:0xbda77e,pants:0x4b4941,skin:0xac7350,hat:0x342e29,accent:0xc99657,height:1.83,shoulders:.5,weapon:"shotgun",build:"heavy",beard:"full",trim:"brass"},
  luzia:{coat:0x42594d,shirt:0xcbbd97,pants:0x404a44,skin:0x794d3c,hat:0x29382f,accent:0x8db89a,height:1.76,shoulders:.37,weapon:"lantern",build:"lean",hair:"braid",scarf:0x7ba48a},
  benicio:{coat:0x68513c,shirt:0xd2bd88,pants:0x49443d,skin:0xaa704b,hat:0x342c27,accent:0xd39e52,height:1.84,shoulders:.4,weapon:"rifle",build:"broad",beard:"stubble",trim:"brass"},
  ines:{coat:0x3c3b49,shirt:0xc8b392,pants:0x3b3c44,skin:0x563a31,hat:0x292735,accent:0x9e9eaf,height:1.77,shoulders:.35,weapon:"bow",build:"lean",hair:"braid",scarf:0x56415f},
  dynamite:{coat:0x7d492d,shirt:0xd6c49d,pants:0x4b4540,skin:0xa9754d,hat:0x593321,accent:0xe08c36,height:1.79,shoulders:.41,weapon:"dynamite",build:"broad",beard:"mustache",trim:"brass"},
  jacinto:{coat:0x496449,shirt:0xd5b96e,pants:0x343c34,skin:0x71925a,hat:0x493d28,accent:0xe4b74c,height:1.78,shoulders:.4,weapon:"boomerang",build:"lean",hair:"short",lizard:true,scarf:0xa94f32},
  aurora:{coat:0x41596a,shirt:0xd4c6a5,pants:0x333a48,skin:0xb17e62,hat:0x273e4b,accent:0xe4bf69,height:1.75,shoulders:.35,weapon:"crossbow",build:"lean",hair:"braid",scarf:0x578c91},
  gaspar:{coat:0x75533b,shirt:0xd2b47e,pants:0x483b34,skin:0x9a6a4d,hat:0x493125,accent:0xd89a4f,height:1.91,shoulders:.55,weapon:"shotgun",build:"heavy",beard:"full",trim:"brass"},
  celeste:{coat:0x544b6a,shirt:0xc9c7bd,pants:0x343748,skin:0x845a4d,hat:0x343046,accent:0xb6c8ed,height:1.8,shoulders:.37,weapon:"lantern",build:"lean",hair:"long",scarf:0x777ca4},
  severino:{coat:0x80513c,shirt:0xd7c39e,pants:0x3d3935,skin:0xb37d5c,hat:0x523729,accent:0xe1b257,height:1.73,shoulders:.36,weapon:"knives",build:"lean",hair:"short",scarf:0x9a3730},
  amara:{coat:0x47604e,shirt:0xd4c5a0,pants:0x383e3b,skin:0x704c3e,hat:0x29392f,accent:0xb9c27d,height:1.84,shoulders:.42,weapon:"repeater",build:"broad",hair:"braid",trim:"brass"},
};

const mat=(color,metalness=0,roughness=.92)=>new THREE.MeshStandardMaterial({color,metalness,roughness,flatShading:true});
const group=(parent,name,x=0,y=0,z=0)=>{const o=new THREE.Group();o.name=name;o.position.set(x,y,z);parent.add(o);return o;};
const mesh=(parent,name,geo,material,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,material);o.name=name;o.position.set(x,y,z);parent.add(o);return o;};
const ball=(p,n,m,s,x,y,z)=>{const o=mesh(p,n,new THREE.IcosahedronGeometry(1,1),m,x,y,z);o.scale.set(...s);return o;};
const cylinder=(p,n,a,b,h,m,x=0,y=0,z=0,sides=10)=>mesh(p,n,new THREE.CylinderGeometry(a,b,h,sides),m,x,y,z);
const bar=(p,n,length,radius,m,x,y,z,axis="z")=>{const o=cylinder(p,n,radius,radius,length,m,x,y,z,8);if(axis==="z")o.rotation.x=Math.PI/2;else if(axis==="x")o.rotation.z=Math.PI/2;return o;};
function segment(parent,name,start,end,radius,material){
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),delta=b.clone().sub(a);
  const o=mesh(parent,name,new THREE.CylinderGeometry(radius*.78,radius,delta.length(),8),material);
  o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;
}
function bowShape(parent,name,material){
  const points=[new THREE.Vector3(0,-.57,0),new THREE.Vector3(.18,-.38,0),new THREE.Vector3(.24,0,0),new THREE.Vector3(.18,.38,0),new THREE.Vector3(0,.57,0)];
  const curve=new THREE.CatmullRomCurve3(points);
  const bow=mesh(parent,name,new THREE.TubeGeometry(curve,12,.026,5,false),material);
  const string=mesh(parent,name+"String",new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.57,.008),new THREE.Vector3(0,.57,.008)]),mat(0xd9c89f));
  return [bow,string];
}
function coatPanel(parent,material,x,y,z,sign){
  const shape=new THREE.Shape();shape.moveTo(-.17,.2);shape.lineTo(.17,.2);shape.lineTo(.13,-.42);shape.lineTo(0,-.55);shape.lineTo(-.13,-.42);shape.closePath();
  const panel=mesh(parent,"CoatTail",new THREE.ShapeGeometry(shape),material,x,y,z);panel.scale.set(.68,1.05,.8);panel.rotation.y=sign*.12;return panel;
}
function makeHero(id,s){
  const root=new THREE.Group();root.name=id;
  const cloth=mat(s.coat),shirt=mat(s.shirt),pants=mat(s.pants),skin=mat(s.skin),hat=mat(s.hat),gold=mat(s.accent,.34,.57),leather=mat(s.trim==="brass"?0x493326:0x3a2a22),hair=mat(s.hair==="braid"?0x211a1b:s.hair==="long"?0x241f25:0x30221d),boot=mat(id==="joao"?0x503628:0x292321,.08),steel=mat(0x737b80,.72,.42),ivory=mat(0xdfcfab,.06);
  const hip=group(root,"Hips",0,.98,0),chest=group(hip,"Chest",0,.02,0);
  const torsoWidth=s.build==="heavy"?.47:s.build==="broad"?.4:.34;
  const torso=cylinder(chest,"CoatBody",torsoWidth*.78,torsoWidth, .82,cloth,0,.16,0,9);torso.scale.z=.72;
  const vest=mesh(chest,"Vest",new THREE.CylinderGeometry(torsoWidth*.64,torsoWidth*.64,.71,8),shirt,0,.2,id==="joao"?.22:.17);vest.scale.set(id==="joao"?.9:.63,1,id==="joao"?.62:.58);
  if(id==="joao"){
    // A flat pale front reads as an open shirt at the distant game camera.
    mesh(chest,"OpenWhiteShirt",new THREE.BoxGeometry(.31,.67,.035),shirt,0,.19,.258);
    for(const side of [-1,1]){
      const front=mesh(chest,"DusterFront",new THREE.BoxGeometry(.15,.83,.09),cloth,side*.235,.14,.235);
      front.rotation.z=side*.035;
      const hem=mesh(chest,"WeatheredHem",new THREE.BoxGeometry(.11,.06,.096),mat(0x4e3225),side*.238,-.29,.234);
      hem.rotation.z=side*.13;
    }
  }
  // Tailcoat panels and contrasting lapels add a tailored frontier silhouette.
  for(const side of [-1,1]){
    coatPanel(hip,cloth,side*.16,-.12,-.09,side);
    const lapel=mesh(chest,"Lapel",new THREE.ConeGeometry(id==="joao"?.09:.12,.45,4),id==="joao"?mat(0x8c6041):gold,side*(id==="joao"?.19:.14),.42,id==="joao"?.28:.235);lapel.rotation.z=side*.22;
    ball(chest,"ShoulderPad",cloth,id==="joao"?[.105,.055,.12]:[.15,.085,.16],side*s.shoulders,.51,0);
    for(let i=0;i<4;i++)ball(chest,"CoatButton",gold,[.018,.018,.012],side*.045,.23-i*.13,.26);
  }
  // Cross-body strap, cartridge loops, belt and square buckle.
  const strap=bar(chest,"Bandolier",1.12,.034,leather,-.05,.28,.18);strap.rotation.z=-.46;
  for(let i=0;i<9;i++){
    const x=-.31+i*.075,y=.23-Math.abs(4-i)*.045;
    cylinder(chest,"BrassCartridge",.026,.026,.09,gold,x,y,.215,6);
  }
  const belt=cylinder(hip,"GunBelt",.34,.34,.13,leather,0,-.04,.01,10);belt.scale.z=.78;
  const buckle=mesh(hip,"BeltBuckle",new THREE.BoxGeometry(.15,.13,.04),gold,.03,-.03,.28);
  mesh(hip,"BuckleInset",new THREE.BoxGeometry(.07,.055,.02),leather,.03,-.03,.306);
  // Legs are articulated at the hips and knees for a readable walk cycle.
  for(const side of [-1,1]){
    const leg=group(hip,side<0?"LegL":"LegR",side*(s.build==="heavy"?.23:.18),-.28,0);
    const thigh=cylinder(leg,"TrouserLeg",.13,.105,.46,pants,0,-.22,0,9);thigh.rotation.z=side*.045;
    const knee=group(leg,side<0?"KneeL":"KneeR",0,-.45,.015);
    cylinder(knee,"LowerLeg",.105,.085,.43,pants,0,-.2,0,9);
    cylinder(knee,"BootCuff",.114,.112,.12,leather,0,-.42,.015,9);
    const shoe=ball(knee,"Boot",boot,[.14,.105,.25],0,-.52,.105);shoe.rotation.x=-.08;
    mesh(knee,"BootToe",new THREE.BoxGeometry(.2,.105,.16),boot,0,-.54,.23);
    bar(knee,"Spur",.13,.022,steel,side*.13,-.49,-.03,"x");
  }
  // Open collar, neckerchief and layered face with distinct hair/beard shapes.
  cylinder(chest,"Neck",.1,.12,.2,skin,0,.62,0,8);
  if(s.scarf){const scarf=mesh(chest,"Neckerchief",new THREE.ConeGeometry(.19,.25,5),mat(s.scarf),0,.55,.14);scarf.rotation.x=.1;}
  const head=group(chest,"Head",0,.79,.035);head.scale.setScalar(1.08);
  ball(head,"Face",skin,[.22,.29,.2],0,0,.04);
  ball(head,"Jaw",skin,[.17,.12,.17],0,-.105,.085);
  if(s.lizard){
    head.getObjectByName("Face").visible=false;
    head.getObjectByName("Jaw").visible=false;
    head.traverse(part=>{if(part.name==="Ear")part.visible=false;});
    const scale=mat(0x688b50),belly=mat(0xa4ae72),slit=mat(0x181910);
    ball(head,"LizardSkull",skin,[.245,.3,.22],0,.015,.025);
    ball(head,"LizardMuzzle",scale,[.20,.13,.26],0,-.105,.22);
    ball(head,"JawPlate",belly,[.17,.065,.20],0,-.175,.21);
    for(const side of [-1,1]){
      ball(head,"AmberEye",mat(0xe4bd4c),[.052,.068,.028],side*.153,.085,.208);
      ball(head,"VerticalPupil",slit,[.012,.045,.009],side*.153,.086,.235);
      ball(head,"Nostril",slit,[.014,.009,.009],side*.07,-.075,.45);
      for(let i=0;i<3;i++)ball(head,"Scale",gold,[.018,.015,.012],side*(.16-i*.035),-.17-i*.03,.30);
      const frill=mesh(head,"NeckFrill",new THREE.ConeGeometry(.09,.2,4),scale,side*.2,.1,-.26);frill.rotation.z=side*.55;
    }
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.02,-.22),new THREE.Vector3(.08,-.04,-.50),new THREE.Vector3(.15,-.12,-.83),new THREE.Vector3(.1,-.3,-1.1),new THREE.Vector3(.02,-.35,-1.31)]);
    mesh(hip,"LongLizardTail",new THREE.TubeGeometry(curve,12,.105,5,false),scale,0,.02,0);
    mesh(hip,"TailSpade",new THREE.ConeGeometry(.16,.36,5),mat(0x87945a),.02,-.33,-1.35).rotation.x=Math.PI/2;
    for(let i=0;i<5;i++){const spike=mesh(hip,"TailRidge",new THREE.ConeGeometry(.035,.13,4),gold,.08+i*.018,-.04-i*.05,-.48-i*.12);spike.rotation.x=.5;}
    const sash=mesh(chest,"RangerSash",new THREE.BoxGeometry(.11,.7,.07),mat(0xa94f32),-.27,.16,.24);sash.rotation.z=-.34;
  }
  if(id==="joao"){
    // Black hair is visible below the brim, especially in the rear view.
    ball(head,"ShortBlackHair",hair,[.205,.18,.18],0,.16,-.055);
    for(const side of [-1,1])ball(head,"TempleHair",hair,[.052,.13,.065],side*.185,.055,-.035);
    ball(head,"CheekL",skin,[.075,.07,.042],-.135,-.06,.175);
    ball(head,"CheekR",skin,[.075,.07,.042],.135,-.06,.175);
  }
  for(const side of [-1,1]){
    ball(head,"Ear",skin,[.045,.075,.045],side*.195,-.005,.02);
    ball(head,"Eye",mat(0x17191c),[.022,.016,.012],side*.072,.025,.265);
    const brow=bar(head,"Brow",.08,.018,hair,side*.073,.064,.264,"x");
    const bootLash=brow;bootLash.rotation.z=side*.12;
  }
  const nose=mesh(head,"Nose",new THREE.ConeGeometry(.037,.1,5),skin,0,-.012,.28);nose.rotation.x=-.18;
  bar(head,"Mouth",.07,.012,mat(0x52312a),0,-.085,.265,"x");
  if(s.beard){
    if(s.beard==="full"){
      const beard=ball(head,"Beard",hair,[.17,.15,.1],0,-.16,.19);
      for(let i=0;i<4;i++)ball(head,"BeardFacet",hair,[.06,.08,.035],-.11+i*.073,-.19,.26);
    } else if(s.beard==="mustache"){
      for(const side of [-1,1]){const m=ball(head,"Mustache",hair,[.08,.03,.025],side*.05,-.07,.265);m.rotation.z=-side*.18;}
    } else ball(head,"Stubble",hair,[.13,.04,.035],0,-.17,.22);
  }
  if(s.hair==="long")for(const side of [-1,1]){const braid=cylinder(head,"HairLock",.06,.035,.55,hair,side*.18,-.25,-.02,7);braid.rotation.z=side*.12;}
  if(s.hair==="braid"){
    for(const side of [-1,1]){
      const lock=cylinder(head,"Braid",.055,.035,.48,hair,side*.17,-.22,-.01,7);lock.rotation.z=side*.1;
      for(let i=0;i<3;i++)ball(head,"BraidKnot",gold,[.04,.045,.04],side*.18,-.08-i*.12,.02);
    }
  }
  // Wide brim, tapered crown, contrasting hatband and signature ornament.
  const broadBrim=["elias","labuta","tomas","ruth"].includes(id)?.47:.41;
  const brim=cylinder(head,"HatBrim",broadBrim,broadBrim,.055,hat,0,.28,0,12);brim.scale.z=id==="indigo"?.7:.78;
  const crownHeight=id==="silas"?.36:id==="benicio"?.27:.31;
  cylinder(head,"HatCrown",.22,.26,crownHeight,hat,0,.44,-.005,9);
  cylinder(head,"HatBand",.237,.237,.065,gold,0,.39,.005,10);
  if(id==="joao"){
    // Upturned edges form the distinctive vaqueiro hat in the concept sheet.
    for(const side of [-1,1]){
      const edge=mesh(head,"CurvedHatEdge",new THREE.ConeGeometry(.065,.13,5),hat,side*.405,.30,0);
      edge.rotation.z=-side*.36;
      const strap=bar(head,"HatChinStrap",.37,.012,leather,side*.19,-.11,.005,"y");
      strap.rotation.z=side*.09;
    }
    const seam=bar(head,"HatCrownSeam",.21,.014,gold,0,.56,.187,"y");seam.rotation.x=.06;
  }
  for(let i=0;i<5;i++)ball(head,"HatStud",gold,[.018,.018,.012],-.14+i*.07,.395,.198);
  if(id==="benicio"){
    for(const side of [-1,1]){
      const lens=mesh(head,"GoggleLens",new THREE.TorusGeometry(.058,.01,5,8),gold,side*.085,.17,.274);
      lens.rotation.x=.1;
    }
    bar(head,"GoggleBridge",.1,.01,leather,0,.17,.274,"x");
  }
  if(id==="silas"||id==="ines"){
    const feather=mesh(head,"CrowFeather",new THREE.ConeGeometry(.08,.42,5),mat(0x242c39),.23,.65,-.03);feather.rotation.z=-.35;
  }
  // Holsters, knife sheath, satchel and quiver make the models read as individual outlaws.
  for(const side of [-1,1]){
    const holster=mesh(hip,"Holster",new THREE.BoxGeometry(.13,.28,.14),leather,side*.31,-.12,.15);holster.rotation.z=side*.08;
    bar(hip,"HolsterStrap",.2,.026,gold,side*.28,.015,.18,"x");
  }
  if(id==="joao"){
    const rope=mat(0x8d653c);
    for(let i=0;i<4;i++){
      const coil=mesh(hip,"CoiledLasso",new THREE.TorusGeometry(.14+i*.016,.018,5,16),rope,.38,-.19,.25+i*.025);
      coil.rotation.y=.17;
    }
    bar(hip,"LassoAttachment",.2,.018,leather,.37,-.07,.17,"y");
  }
  if(s.weapon==="bow"){
    const quiver=mesh(chest,"Quiver",new THREE.CylinderGeometry(.075,.105,.56,7),leather,0,.17,-.24);quiver.rotation.x=-.25;
    for(let i=0;i<4;i++)bar(chest,"ArrowInQuiver",.54,.012,steel,-.05+i*.035,.48,-.25,"y");
    const back=group(chest,"BowBack",0,.22,-.33);back.rotation.y=Math.PI;
    bowShape(back,"BackBow",gold);
    const handBow=group(chest,"BowHand",-.24,.03,.44);handBow.scale.setScalar(.001);
    bowShape(handBow,"DrawnBow",gold);
    const arrow=bar(handBow,"DrawnArrow",.82,.015,steel,.01,0,.06,"y");arrow.rotation.z=Math.PI/2;
    const fletch=ball(handBow,"ArrowFeather",mat(0x9c473a),[.04,.08,.035],.0,.38,.06);
    fletch.rotation.z=.4;
  }
  // Jointed arms. Two-handed guns use a stable shoulder-width firing stance.
  const twoHand=["shotgun","rifle","repeater","sawedoff","crossbow"].includes(s.weapon);
  const arms={};
  const gunOrigin=[0,.10,.22];
  for(const side of [-1,1]){
    const key=side<0?"L":"R";
    const shoulder=[side*s.shoulders,.48,0];
    let elbowPoint,handPoint;
    if(twoHand){
      elbowPoint=side>0?[.23,.17,.12]:[-.22,.17,.24];
      handPoint=side>0?[.08,.08,.30]:[-.08,.08,.50];
    }else if(s.weapon==="bow"){
      elbowPoint=side>0?[.37,.18,.12]:[-.36,.18,.12];
      handPoint=side>0?[.31,.08,.32]:[-.23,.08,.46];
    }else{
      elbowPoint=side>0?[.43,.14,.04]:[-.42,.14,.02];
      handPoint=side>0?[.43,.04,.15]:[-.42,.04,.08];
      if(s.weapon==="pistol"||s.weapon==="dual")handPoint[2]=.25;
      if(s.weapon==="dynamite")handPoint[2]=.16;
    }
    const arm=group(chest,"Arm"+key,...shoulder);arms[key]=arm;
    const elbowOffset=elbowPoint.map((v,i)=>v-shoulder[i]);
    const handOffset=handPoint.map((v,i)=>v-elbowPoint[i]);
    segment(arm,"Sleeve",[0,0,0],elbowOffset,id==="joao"?.095:.12,cloth);
    const elbow=group(arm,"Elbow"+key,...elbowOffset);arms["Elbow"+key]=elbow;
    segment(elbow,"Forearm",[0,0,0],handOffset,id==="joao"?.075:.09,cloth);
    cylinder(elbow,"Cuff",.102,.094,.08,gold,handOffset[0],handOffset[1]*.82,handOffset[2]*.82,8);
    const hand=group(elbow,"Hand"+key,...handOffset);arms["Hand"+key]=hand;
    ball(hand,"Glove",skin,[.082,.085,.09],0,0,.02);
  }
  const firearm=group(chest,"Firearm",...gunOrigin);
  if(s.weapon==="boomerang"){
    const weapon=mesh(arms.HandR,"ReturningBoomerang",new THREE.TorusGeometry(.18,.045,5,9,Math.PI*1.6),gold,0,.02,.12);
    weapon.rotation.set(.35,0,-.2);
    const grip=bar(arms.HandR,"BoomerangGrip",.15,.027,leather,0,.02,.06,"x");
  }
  if(["rifle","shotgun","repeater","sawedoff","crossbow"].includes(s.weapon)){
    const length=s.weapon==="rifle"||s.weapon==="repeater"?1.2:s.weapon==="crossbow"?.65:.86;
    bar(firearm,"GunBarrel",length,.042,steel,0,.03,length*.48);
    bar(firearm,"BarrelRib",length*.48,.07,leather,0,-.025,.03);
    const stock=mesh(firearm,"WoodStock",new THREE.BoxGeometry(.13,.16,.42),leather,0,-.045,-.18);stock.rotation.x=-.08;
    if(s.weapon==="shotgun"||s.weapon==="sawedoff"){
      bar(firearm,"SecondBarrel",length,.034,steel,.105,.03,length*.48);
      bar(firearm,"ForeGrip",.25,.085,gold,0,-.08,.43);
    } else if(s.weapon==="crossbow"){
      bar(firearm,"CrossbowLimb",.82,.035,gold,0,.02,.28,"x");
      bar(firearm,"CrossbowString",.8,.012,ivory,0,.02,.28,"x");
      bar(firearm,"CrossbowRail",.55,.045,leather,0,-.02,.24);
    } else {
      bar(firearm,"ForeGrip",.25,.065,leather,0,-.08,.46);
      for(let i=0;i<4;i++)bar(firearm,"ReceiverRivet",.045,.018,gold,-.055+i*.035,.045,.16,"x");
    }
    // Rest pose brings both hands to the stock and foregrip.
    // The right hand holds the stock; the left hand lands at the foregrip.
  } else if(s.weapon==="pistol"||s.weapon==="dual"){
    const pistol=(parent,name)=>{
      const w=group(parent,name,0,0,.08);
      bar(w,"RevolverBarrel",.28,.03,steel,0,.02,.24);
      mesh(w,"RevolverCylinder",new THREE.CylinderGeometry(.075,.075,.13,8),steel,0,-.005,.08);
      mesh(w,"RevolverGrip",new THREE.BoxGeometry(.075,.18,.07),leather,0,-.09,-.01);
      bar(w,"Sights",.06,.013,gold,0,.05,.3);
      return w;
    };
    const gunR=pistol(arms.HandR,"RevolverR");
    if(s.weapon==="dual")pistol(arms.HandL,"RevolverL");
    arms.R.rotation.set(-.05,0,0);
    firearm.add(gunR);
  } else if(s.weapon==="bow"){
    // Idle hands remain relaxed; the Primary clip raises both arms as the bow
    // is taken from the back and brought to the firing position.
  } else if(s.weapon==="dynamite"){
    const stick=mesh(arms.HandR,"DynamiteStick",new THREE.CylinderGeometry(.075,.075,.46,8),mat(0x9a3026),0,-.02,.18);stick.rotation.x=Math.PI/2;
    bar(arms.HandR,"DynamiteFuse",.1,.017,gold,0,.02,.43);
    for(const side of [-1,1])bar(arms.HandR,"FuseSpark",.07,.03,mat(0xffb23d),side*.035,.02,.49,"x");
  } else if(s.weapon==="whip"){
    const revolver=group(arms.HandR,"Revolver",0,-.02,.10);
    bar(revolver,"LongRevolverBarrel",.35,.035,steel,0,.015,.24);
    const chamber=cylinder(revolver,"RevolverCylinder",.068,.068,.13,steel,0,.015,.07,8);chamber.rotation.z=Math.PI/2;
    const grip=mesh(revolver,"WoodenGrip",new THREE.BoxGeometry(.085,.18,.09),leather,0,-.105,0);grip.rotation.x=-.3;
    bar(revolver,"Sight",.045,.014,gold,0,.055,.40);
    bar(arms.HandL,"LassoHandle",.17,.027,leather,0,-.03,.10);
  } else if(s.weapon==="knives"){
    for(const side of [-1,1]){
      const knife=mesh(arms[side<0?"HandL":"HandR"],"ThrowingKnife",new THREE.ConeGeometry(.065,.42,5),steel,0,.01,.21);knife.rotation.x=Math.PI/2;
      bar(arms[side<0?"HandL":"HandR"],"KnifeHandle",.15,.04,leather,0,-.02,.02);
    }
  } else if(s.weapon==="lantern"){
    const lantern=group(arms.HandR,"Lantern",0,-.08,.18);
    mesh(lantern,"LanternBody",new THREE.BoxGeometry(.19,.25,.16),mat(0x7c4825,.3),0,-.05,0);
    mesh(lantern,"LanternGlass",new THREE.BoxGeometry(.12,.16,.12),mat(0xf6ba52,0,.35),0,-.05,.083);
    const handle=mesh(lantern,"LanternHandle",new THREE.TorusGeometry(.1,.015,5,8,Math.PI),gold,0,.1,0);handle.rotation.z=Math.PI;
  }
  // Shoulder sling and fine stitching distinguish model silhouettes without heavy textures.
  if(["rifle","shotgun","repeater"].includes(s.weapon)){
    const sling=bar(chest,"Sling",.82,.017,leather,-.28,.2,.1);sling.rotation.z=-.52;
  }
  const q=(e)=>new THREE.Quaternion().setFromEuler(e);
  const quatTrack=(part,times,rotations)=>new THREE.QuaternionKeyframeTrack(part+".quaternion",times,rotations.flatMap(r=>{const v=q(r);return[v.x,v.y,v.z,v.w];}));
  const clip=(name,duration,tracks)=>new THREE.AnimationClip(name,duration,tracks.map(([part,times,values])=>quatTrack(part,times,values)));
  const idle=clip("Idle",2,[["Chest",[0,1,2],[new THREE.Euler(0,0,0),new THREE.Euler(.014,.02,0),new THREE.Euler(0,0,0)]],["Head",[0,1,2],[new THREE.Euler(0,0,0),new THREE.Euler(.02,.025,0),new THREE.Euler(0,0,0)]]]);
  const duration=s.weapon==="dynamite"?.64:.46,t=[0,duration*.24,duration*.48,duration*.74,duration];
  const stride=s.build==="heavy"?.34:.49;
  const walkTracks=[["LegL",[0,.21,.42,.63,.84],[new THREE.Euler(stride,0,0),new THREE.Euler(0,0,0),new THREE.Euler(-stride,0,0),new THREE.Euler(0,0,0),new THREE.Euler(stride,0,0)]],["LegR",[0,.21,.42,.63,.84],[new THREE.Euler(-stride,0,0),new THREE.Euler(0,0,0),new THREE.Euler(stride,0,0),new THREE.Euler(0,0,0),new THREE.Euler(-stride,0,0)]]];
  if(id==="joao"){
    walkTracks.push(["ArmL",[0,.21,.42,.63,.84],[new THREE.Euler(-.2,0,0),new THREE.Euler(0,0,0),new THREE.Euler(.2,0,0),new THREE.Euler(0,0,0),new THREE.Euler(-.2,0,0)]]);
    walkTracks.push(["ArmR",[0,.21,.42,.63,.84],[new THREE.Euler(.12,0,0),new THREE.Euler(0,0,0),new THREE.Euler(-.12,0,0),new THREE.Euler(0,0,0),new THREE.Euler(.12,0,0)]]);
  }
  const walk=clip("Walk",.84,walkTracks);
  const primaryTracks=[["ArmR",t,[new THREE.Euler(0,0,0),new THREE.Euler(-.05,0,-.12),new THREE.Euler(.1,0,.06),new THREE.Euler(.03,0,.02),new THREE.Euler(0,0,0)]],["ElbowR",t,[new THREE.Euler(0,0,0),new THREE.Euler(-.12,0,0),new THREE.Euler(.1,0,0),new THREE.Euler(.02,0,0),new THREE.Euler(0,0,0)]],["ArmL",t,[new THREE.Euler(0,0,0),new THREE.Euler(-.06,0,.08),new THREE.Euler(.08,0,-.04),new THREE.Euler(.01,0,0),new THREE.Euler(0,0,0)]],["Chest",t,[new THREE.Euler(0,0,0),new THREE.Euler(0,-.03,0),new THREE.Euler(0,.045,0),new THREE.Euler(0,.01,0),new THREE.Euler(0,0,0)]]];
  if(s.weapon==="bow"){
    primaryTracks.splice(0,3);
    const bowTimes=[0,.10,.25,.38,.46],rest=new THREE.Euler(0,0,0),drawR=new THREE.Euler(-.92,0,-.42),drawL=new THREE.Euler(-.96,0,.50);
    primaryTracks.push(["ArmR",bowTimes,[rest,drawR,drawR,new THREE.Euler(-.83,0,-.34),rest]]);
    primaryTracks.push(["ArmL",bowTimes,[rest,drawL,drawL,new THREE.Euler(-.88,0,.44),rest]]);
    primaryTracks.push(["ElbowR",bowTimes,[rest,new THREE.Euler(-.3,0,0),new THREE.Euler(-.4,0,0),new THREE.Euler(-.2,0,0),rest]]);
    primaryTracks.push(["ElbowL",bowTimes,[rest,new THREE.Euler(-.22,0,0),new THREE.Euler(-.3,0,0),new THREE.Euler(-.16,0,0),rest]]);
  }
  const primary=clip("Primary",duration,primaryTracks);
  const shot=clip("Shot",.3,[["ArmR",[0,.1,.22,.3],[new THREE.Euler(0,0,0),new THREE.Euler(-.13,0,-.09),new THREE.Euler(.11,0,.04),new THREE.Euler(0,0,0)]]]);
  const thrown=clip("Throw",.64,[["ArmR",[0,.16,.32,.48,.64],[new THREE.Euler(0,0,0),new THREE.Euler(-.72,0,-.2),new THREE.Euler(-1.45,0,-.3),new THREE.Euler(.48,0,.18),new THREE.Euler(0,0,0)]],["ElbowR",[0,.16,.32,.48,.64],[new THREE.Euler(0,0,0),new THREE.Euler(-.35,0,0),new THREE.Euler(.1,0,0),new THREE.Euler(.18,0,0),new THREE.Euler(0,0,0)]]]);
  const whip=clip("Whip",.5,[[id==="joao"?"ArmL":"ArmR",[0,.12,.27,.5],[new THREE.Euler(0,0,0),new THREE.Euler(-.4,0,id==="joao"?.48:-.48),new THREE.Euler(.22,0,id==="joao"?-.72:.72),new THREE.Euler(0,0,0)]]]);
  const hurt=clip("Hurt",.46,[["Chest",[0,.1,.3,.46],[new THREE.Euler(0,0,0),new THREE.Euler(.12,0,0),new THREE.Euler(-.04,0,0),new THREE.Euler(0,0,0)]]]);
  if(id==="joao"){
    // Small deterministic face-to-face color shifts evoke worn PS2-era
    // leather and denim without a large image texture or network request.
    let seed=0;
    root.traverse(part=>{
      if(!part.isMesh||![cloth,hat,pants,leather,boot].includes(part.material))return;
      part.geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
      const original=part.material.color;
      const count=part.geometry.attributes.position.count;
      const colors=new Float32Array(count*3);
      for(let i=0;i<count;i+=3){
        const grain=Math.sin((i/3+seed*37)*12.9898)*43758.5453;
        const amount=.86+(grain-Math.floor(grain))*.20;
        for(let j=i;j<Math.min(i+3,count);j++){
          colors[j*3]=original.r*amount;
          colors[j*3+1]=original.g*amount;
          colors[j*3+2]=original.b*amount;
        }
      }
      part.geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
      part.material=part.material.clone();
      part.material.color.set(0xffffff);
      part.material.vertexColors=true;
      seed++;
    });
  }
  root.userData.height=s.height;
  root.scale.y=s.height/1.8;
  return {root,animations:[idle,walk,primary,shot,thrown,whip,hurt]};
}

const exporter=new GLTFExporter();
const selected=new Set(process.argv.slice(2));
for(const [id,spec] of Object.entries(designs)){
  if(selected.size&&!selected.has(id))continue;
  const {root,animations}=makeHero(id,spec);
  const bytes=await exporter.parseAsync(root,{binary:true,animations,onlyVisible:false,trs:true});
  await writeFile(new URL(`../assets/models/${id}.glb`,import.meta.url),Buffer.from(bytes));
  console.log(`${id}: ${(bytes.byteLength/1024).toFixed(0)} KiB · ${animations.length} clips`);
}
