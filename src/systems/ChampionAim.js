// Observe actual displacement, including collision avoidance. Ignore teleports.
export function trackTargets(run, dt) {
  for (const enemy of run.enemies) {
    const old=enemy.aimSample;
    const vx=old&&dt>0?(enemy.x-old.x)/dt:0;
    const vz=old&&dt>0?(enemy.z-old.z)/dt:0;
    const valid=Math.hypot(vx,vz)<=20;
    const velocity=enemy.aimVelocity??(enemy.aimVelocity={x:0,z:0});
    velocity.x=valid?vx:0;velocity.z=valid?vz:0;
    const sample=old??(enemy.aimSample={x:0,z:0});
    sample.x=enemy.x;sample.z=enemy.z;
  }
}

export function intercept(origin, target, speed, minFlight=0) {
  const dx=target.x-origin.x,dz=target.z-origin.z;
  const v=target.aimVelocity||{x:0,z:0};
  const a=v.x*v.x+v.z*v.z-speed*speed,b=2*(dx*v.x+dz*v.z),c=dx*dx+dz*dz;
  const roots=[];
  if(Math.abs(a)<1e-6){if(Math.abs(b)>1e-6)roots.push(-c/b);}
  else if(b*b-4*a*c>=0){const d=Math.sqrt(b*b-4*a*c);roots.push((-b-d)/(2*a),(-b+d)/(2*a));}
  const positive=roots.filter(t=>t>=0&&Number.isFinite(t));
  const flight=Math.max(minFlight,Math.min(1.5,positive.length?Math.min(...positive):Math.sqrt(c)/speed));
  return {x:target.x+v.x*flight,z:target.z+v.z*flight,flight};
}
