import * as THREE from "three";

const smooth = n => n * n * (3 - 2 * n);
const flyShapes = new Set(["bat", "vulture"]);
const beastShapes = new Set(["dog"]);

function controller(view) {
  if (!view.children.length) return null;
  if (view.userData.highBossAnimation) return view.userData.highBossAnimation;
  const model = view.children[0];
  view.userData.highBossAnimation = { model, saved: [], age: 0 };
  return view.userData.highBossAnimation;
}

export function resetBossHigh(view) {
  const animation = view.userData.highBossAnimation;
  if (!animation) return;
  for (const [part, quaternion, position] of animation.saved) {
    part.quaternion.copy(quaternion);
    part.position.copy(position);
  }
  animation.saved.length = 0;
}

export function animateBossHigh(view, boss, warning, time, dt) {
  const animation = controller(view);
  if (!animation) return;
  animation.age += dt;
  const windup = warning && warning.fromX != null
    ? smooth(Math.max(0, Math.min(1, 1-warning.delay/(warning.totalDelay||1)))) : 0;
  const release = Math.max(0, Math.min(1,(boss.releaseFlash||0)/.42));
  const hit = Math.max(0, Math.min(1, (boss.hitFlash||0)/.12));
  const fury = Math.max(0, Math.min(1, (boss.phaseFlash||0)/.8));
  const phase = boss.phase || 1;
  const flying = flyShapes.has(view.userData.shape);
  const beast = beastShapes.has(view.userData.shape);
  const pulse = Math.sin(time*(flying?9:4.5)+boss.id);
  const dash = boss.dash ? 1 : 0;
  const remember = part => {
    if (!part || animation.saved.some(item => item[0] === part)) return;
    animation.saved.push([part,part.quaternion.clone(),part.position.clone()]);
  };
  const rotate = (name,x=0,y=0,z=0) => {
    const part=name==="model"?animation.model:animation.model.getObjectByName(name);
    if (!part) return;
    remember(part);
    part.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)));
  };
  const move = (name,x=0,y=0,z=0) => {
    const part=name==="model"?animation.model:animation.model.getObjectByName(name);
    if (!part) return;
    remember(part);
    part.position.add(new THREE.Vector3(x,y,z));
  };
  // A readable wind-up, committed strike, and recovery use the same timing
  // as the gameplay telegraph. None of these transforms changes hitboxes.
  rotate("model", (flying?-.06:.04)*pulse + windup*(beast?-.23:-.13) + dash*.23 + hit*.19,
    windup*.13 + fury*.11, Math.sin(time*2.2+boss.id)*.025 + hit*.13);
  move("model",0, Math.abs(pulse)*(flying?.095:.022) - windup*.12 + fury*.06,0);
  rotate("Body",windup*-.1+release*.14,0,hit*-.1);
  rotate("Chest",windup*-.13+release*.19,windup*.08,hit*-.12);
  rotate("Head",windup*.11-release*.1,windup*-.08,hit*.14);
  rotate("ArmR",-windup*.56+release*.4,0,-windup*.18);
  rotate("ArmL",-windup*.32+release*.28,0,windup*.16);
  if (flying) {
    rotate("WingL",0,0,pulse*.2*(1+phase*.12));
    rotate("WingR",0,0,-pulse*.2*(1+phase*.12));
  } else if (beast) {
    rotate("LegL",Math.max(0,pulse)*.13);
    rotate("LegR",Math.max(0,-pulse)*.13);
  }
}
