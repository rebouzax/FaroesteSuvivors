import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { SUPPLIED_ASSETS } from '../config/suppliedAssets.js';

// Three.js resolves its decoder with import.meta URLs; Vite emits these locally.
const draco=new DRACOLoader().setWorkerLimit(2);
const loader=new GLTFLoader().setDRACOLoader(draco),cache=new Map(),actors=new Map();
// Authored forward axes, verified in an orthographic top view: the wolf faces
// -X/-Z and the scorpion +X. Gameplay and procedural rigs use +Z as forward.
// Apply this before skinning so legs, head and equipment share the same frame.
const ACTOR_FORWARD_YAW={lobo:Math.PI*3/4,scropiao:-Math.PI/2,'aranha-1':Math.PI/2,morte:-Math.PI/2,clanker:Math.PI};
export function loadSupplied(id){
  if(!SUPPLIED_ASSETS[id])return Promise.reject(new Error('Unknown supplied asset: '+id));
  if(!cache.has(id))cache.set(id,loader.loadAsync(SUPPLIED_ASSETS[id].url).catch(error=>{cache.delete(id);throw error;}));
  return cache.get(id);
}
export function normalizeModel(source,size=1.6,axis='height'){
  const root=new THREE.Group(),model=clone(source);root.add(model);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),extent=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=size/Math.max(.001,axis==='height'?extent.y:Math.max(extent.x,extent.z));
  model.scale.multiplyScalar(scale);model.position.add(new THREE.Vector3(-center.x*scale,-box.min.y*scale,-center.z*scale));
  root.updateMatrixWorld(true);return root;
}
// Assign static meshes a lightweight skeletal rig. Geometry/materials remain shared
// by all clones of an actor; animation mixers and skeletons are instance-local.
function rigStatic(root,kind,id){
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),h=size.y;
  const tPose=kind==='humanoid'&&size.x/h>.7;
  const frame=new THREE.Bone();frame.name='Frame';
  const specs=kind==='spectral'?[]:kind==='arthropod'?Array.from({length:8},(_,i)=>['Leg'+i,(i%2?1:-1)*size.x*.2,h*.2,(Math.floor(i/2)-1.5)*size.z*.18]):kind==='bird'?[['WingL',-.05,h*.5,0],['WingR',.05,h*.5,0],['Head',0,h*.6,size.z*.25]]:
    kind==='quadruped'?[['LegL',-.2,h*.4,size.z*.25],['LegR',.2,h*.4,size.z*.25],['RearL',-.2,h*.4,-size.z*.25],['RearR',.2,h*.4,-size.z*.25],['Head',0,h*.65,size.z*.3]]:
    [['LegL',-h*.13,h*.46,0],['LegR',h*.13,h*.46,0],['ArmL',-h*.23,h*.67,0],['ArmR',h*.23,h*.67,0],['Head',0,h*.84,0]];
  const bones=[frame,...specs.map(([name,x,y,z])=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);frame.add(b);return b;})];
  const skeleton=new THREE.Skeleton(bones),scene=new THREE.Group();scene.add(frame);
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),p=geometry.attributes.position,indices=[],weights=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let index=0,weight=1;
      if(kind==='spectral'){index=0;}
      else if(kind==='arthropod'){if(Math.abs(x)>size.x*.23&&y<h*.55)index=1+Math.min(3,Math.max(0,Math.floor((z/Math.max(.01,size.z)+.5)*4)))*2+(x>0?1:0);}
      else if(kind==='bird'){if(Math.abs(x)>size.x*.12)index=x<0?1:2;else if(z>size.z*.22)index=3;}
      else if(kind==='quadruped'){if(y<h*.45)index=z>0?(x<0?1:2):(x<0?3:4);else if(z>size.z*.25)index=5;}
      else{if(y<h*.46)index=x<0?1:2;else if(y>h*.83)index=5;else if(Math.abs(x)>h*.23)index=x<0?3:4;}
      if(index>0&&kind==='humanoid')weight=Math.min(1,Math.max(.2,index<=2?(h*.5-y)/(h*.18):index===5?(y-h*.8)/(h*.08):(Math.abs(x)-h*.2)/(h*.1)));
      indices.push(index,0,0,0);weights.push(weight,1-weight,0,0);
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const skin=new THREE.SkinnedMesh(geometry,mesh.material);skin.name=`Skin_${scene.children.length}`;skin.castShadow=true;skin.receiveShadow=true;scene.add(skin);scene.updateMatrixWorld(true);skin.bind(skeleton);
  });
  const quaternionTrack=(bone,axis,values,times)=>new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`,times,values.flatMap(v=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0),v).toArray()));
  const clip=(name,duration,amplitude)=>{
    const times=[0,duration*.25,duration*.5,duration*.75,duration],tracks=[];
    for(const [index,bone] of bones.entries()){
      if(index===0)continue;
      const wing=bone.name.startsWith('Wing'),head=bone.name==='Head',arm=bone.name.startsWith('Arm');
      const attack=['Primary','Throw'].includes(name),hurt=name==='Hurt';
      const amount=head?.035:attack&&arm?1.1:amplitude*(wing?1.9:1);
      const sign=index%2?1:-1;
      let values=attack&&arm?[0,-amount,-amount*.7,.2,0]:[0,amount*sign,0,-amount*sign,0];
      if(attack&&id==='clanker'){
        if(bone.name==='ArmR')values=[0,-.55,-1.3,-.35,0];
        else if(bone.name==='ArmL')values=[0,-.12,-.22,-.08,0];
      }
      if(arm&&tPose){
        const rest=bone.name==='ArmL'?1.02:-1.02;
        tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`,times,values.flatMap(v=>new THREE.Quaternion().setFromEuler(new THREE.Euler(v,0,rest)).toArray())));
      }else tracks.push(quaternionTrack(bone.name,wing?'z':hurt?'z':'x',values,times));
    }
    const lift=kind==='spectral'?.075:.015;
    tracks.push(new THREE.VectorKeyframeTrack('Frame.position',times,[0,0,0,0,lift,0,0,0,0,0,lift,0,0,0,0]));
    return new THREE.AnimationClip(name,duration,tracks);
  };
  scene.userData.tPose=tPose;
  return {scene,animations:[clip('Idle',2.8,.025),clip('Walk',.85,.38),clip('Primary',.5,.12),clip('Throw',.65,.2),clip('Hurt',.3,.18)]};
}
export function loadActor(id,kind='humanoid'){
  const key=id+':'+kind;
  if(!actors.has(key))actors.set(key,loadSupplied(id).then(gltf=>{
    const oriented=new THREE.Group();const source=clone(gltf.scene);
    oriented.rotation.y=ACTOR_FORWARD_YAW[id]||0;
    oriented.add(source);
    const upright=kind==='humanoid'||kind==='spectral';
    const scene=normalizeModel(oriented,upright?1.65:1.5,upright?'height':'width');
    if(!gltf.animations.length)return rigStatic(scene,kind,id);
    const animations=gltf.animations.map(clip=>{
      const copy=clip.clone();
      const name=['Idle','Walk','Run','Attack','Sword','Punch','HitReact','HitRecieve'].find(n=>new RegExp(`(?:_|\\|)${n}$`,'i').test(copy.name));
      if(name)copy.name=name==='Run'?'Walk':['Attack','Sword','Punch'].includes(name)?'Primary':['HitReact','HitRecieve'].includes(name)?'Hurt':name;
      return copy;
    });
    return {scene,animations};
  }).catch(error=>{actors.delete(key);throw error;}));
  return actors.get(key);
}
