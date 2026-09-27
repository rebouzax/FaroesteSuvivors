import * as THREE from "three";

const rotation = new THREE.Quaternion();
const euler = new THREE.Euler();
const flying = new Set(["bat", "vulture"]);

function animationFor(view) {
  if (!view.children.length) return null;
  if (view.userData.highEnemyAnimation) return view.userData.highEnemyAnimation;
  const model=view.children[0];
  const parts={model,frame:model.getObjectByName("Frame"),head:model.getObjectByName("Head"),
    armL:model.getObjectByName("ArmL"),armR:model.getObjectByName("ArmR"),
    legL:model.getObjectByName("LegL"),legR:model.getObjectByName("LegR"),
    wingL:model.getObjectByName("WingL")||model.getObjectByName("vulture-wing--1"),
    wingR:model.getObjectByName("WingR")||model.getObjectByName("vulture-wing-1"),
    dogLegs:[0,1,2,3].map(i=>model.getObjectByName("dog-leg-"+i))};
  const state={parts, snapshots:new Map(), active:[], lastX:null,lastZ:null,move:0,age:0};
  view.userData.highEnemyAnimation=state;
  return state;
}

export function resetEnemyHigh(view) {
  const state=view.userData.highEnemyAnimation;
  if(!state)return;
  for(const [part,snapshot] of state.active){
    part.quaternion.copy(snapshot.q);
    part.position.copy(snapshot.p);
    snapshot.active=false;
  }
  state.active.length=0;
}

export function animateEnemyHigh(view,enemy,time,dt) {
  const state=animationFor(view);
  if(!state)return;
  state.age+=dt;
  const shape=view.userData.shape;
  const isFlying=flying.has(shape)||view.userData.airborne,isDog=shape==="dog"||shape==='supplied:lobo'||shape==='supplied:dun-rat';
  const movement=state.lastX==null?0:Math.hypot(enemy.x-state.lastX,enemy.z-state.lastZ)/Math.max(.016,dt);
  state.lastX=enemy.x;state.lastZ=enemy.z;
  const target=Math.min(1,movement/Math.max(1,enemy.speed||3));
  state.move+=(target-state.move)*(1-Math.exp(-dt*10));
  const pace=time*(isFlying?10:isDog?12:8)+enemy.id*.81;
  const step=Math.sin(pace),breath=Math.sin(time*2.1+enemy.id);
  const hurt=Math.min(1,(enemy.hitFlash||0)/.12);
  const attack=Math.min(1,(enemy.attackFlash||0)/.58);
  const charge=enemy.charge?.warning>0?Math.min(1,enemy.charge.warning/.7):0;
  const aim=enemy.aimTimer>0?Math.min(1,enemy.aimTimer/.55):0;
  const remember=part=>{
    if(!part)return false;
    let snapshot=state.snapshots.get(part);
    if(!snapshot){snapshot={q:new THREE.Quaternion(),p:new THREE.Vector3(),active:false};state.snapshots.set(part,snapshot);}
    if(!snapshot.active){snapshot.q.copy(part.quaternion);snapshot.p.copy(part.position);snapshot.active=true;state.active.push([part,snapshot]);}
    return true;
  };
  const turn=(part,x=0,y=0,z=0)=>{
    if(!part||(!x&&!y&&!z)||!remember(part))return;
    euler.set(x,y,z);rotation.setFromEuler(euler);part.quaternion.multiply(rotation);
  };
  const lift=(part,y)=>{if(remember(part))part.position.y+=y;};
  const p=state.parts;
  // Additive silhouettes complement the shared GLB locomotion clips. The
  // warning, shot, charge and hit states all remain legible at game camera size.
  turn(p.model,(isFlying?-.05:.018)*step*state.move+charge*-.14+hurt*.18,
    0,(isFlying?.09:.025)*step*state.move+hurt*.14);
  lift(p.model,(isFlying?.055:.018)*Math.abs(step)*state.move + breath*.008 - charge*.045);
  if(isFlying){
    turn(p.wingL,0,0,step*.19);
    turn(p.wingR,0,0,-step*.19);
    turn(p.head,attack*-.1+hurt*.13);
  }else if(isDog){
    turn(p.head,charge*.22-attack*.12+hurt*.16,0,step*.025);
    p.dogLegs.forEach((leg,index)=>turn(leg,(index%2?1:-1)*step*.11*state.move));
  }else{
    turn(p.frame,.018*breath+charge*-.12+hurt*.19,step*.035*state.move,hurt*.12);
    turn(p.head,-.015*breath+aim*-.08+hurt*.12,aim*.07,step*.025*state.move);
    turn(p.armR,-aim*.5-attack*.28+hurt*.24,0,-aim*.1);
    turn(p.armL,-aim*.18+hurt*.18,0,aim*.08);
    turn(p.legL,-step*.07*state.move);
    turn(p.legR,step*.07*state.move);
  }
}
