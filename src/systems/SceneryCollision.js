export function pushOut(entity,prop,radius=.4){
  let dx=entity.x-prop.x,dz=entity.z-prop.z;
  if(prop.halfX!=null){
    const c=Math.cos(prop.rotation||0),s=Math.sin(prop.rotation||0);
    const x=c*dx-s*dz,z=s*dx+c*dz;
    const qx=Math.max(-prop.halfX,Math.min(prop.halfX,x)),qz=Math.max(-prop.halfZ,Math.min(prop.halfZ,z));
    let nx=x-qx,nz=z-qz,d=Math.hypot(nx,nz),amount=radius-d;
    if(d===0){const ex=prop.halfX-Math.abs(x),ez=prop.halfZ-Math.abs(z);if(ex<ez){nx=x<0?-1:1;nz=0;amount=ex+radius;}else{nx=0;nz=z<0?-1:1;amount=ez+radius;}d=1;}
    if(amount<=0)return false;
    entity.x+=(c*nx+s*nz)*amount/d;entity.z+=(-s*nx+c*nz)*amount/d;return true;
  }
  const d=Math.hypot(dx,dz),r=(prop.radius||0)+radius;
  if(d>=r)return false;
  entity.x=prop.x+(d?dx/d:1)*r;entity.z=prop.z+(d?dz/d:0)*r;return true;
}
