export const LANDMARKS = Object.freeze([
  {id:'picnic',name:'Mushroom picnic',x:-12,z:7,action:'Help at the picnic',icon:'basket'},
  {id:'brook',name:'Whispering brook',x:10,z:0,action:'Mend the bridge',icon:'bridge'},
  {id:'lanterns',name:'Lantern garden',x:-11,z:-20,action:'Wake the flowers',icon:'flower'},
  {id:'tree',name:'The lantern tree',x:1,z:-31,action:'Bring back the light',icon:'lantern'},
]);
export const START = {x:1,z:18};
export const SAVE_KEY = 'sound-seekers-lost-lights-demo-v1';
export const FIREFLIES = [{x:16,z:14},{x:-22,z:1},{x:21,z:-14},{x:-20,z:-27},{x:14,z:-29}];
export function freshProgress(seed = Math.floor(Math.random()*0x7fffffff)) {
  return {version:1,seed,mission:0,round:0,built:'',position:{...START},fireflies:[],seconds:0,complete:false,attempts:0,correct:0,mode:'explore'};
}
export function parseProgress(raw) {
  try {
    const p=JSON.parse(raw);
    if(p?.version!==1 || !Number.isInteger(p.seed) || !Number.isInteger(p.mission) || p.mission<0 || p.mission>3 || !Number.isInteger(p.round)||p.round<0||p.round>5) return null;
    return {...freshProgress(p.seed),...p,
      built:typeof p.built==='string'&&/^[a-z]{0,3}$/.test(p.built)?p.built:'',
      position:Number.isFinite(p.position?.x)&&Number.isFinite(p.position?.z)?{x:Math.max(-25,Math.min(25,p.position.x)),z:Math.max(-34,Math.min(22,p.position.z))}:{...START},
      fireflies:Array.isArray(p.fireflies)?[...new Set(p.fireflies.filter(i=>Number.isInteger(i)&&i>=0&&i<5))]:[],
      seconds:Math.max(0,Number(p.seconds)||0),mode:['activity','reward'].includes(p.mode)?p.mode:'explore',pending:p.pending===true,complete:p.complete===true&&p.mission===3,
    };
  }catch{return null;}
}
export function settleProgress(p) {
  if(!p.pending)return p;
  return {...p,pending:false,built:'',round:p.round===5?0:p.round+1,mode:p.round===5?'reward':'activity'};
}
export function shuffle(items, seed) {
  const out=[...items]; let s=(seed||1)>>>0;
  for(let i=out.length-1;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1);[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
export function roundFor(missions,p) {
  const mission=missions[p.mission]; if(!mission)return null;
  const rounds=shuffle(mission.rounds,p.seed+p.mission*173);
  const round=rounds[p.round];
  return {...round,choices:shuffle(round.choices,p.seed+p.round*79+p.mission*557)};
}
export function judge(round,choice,mission,built='') {
  const expected=mission===2?round.phonemes[built.length]:round.answer;
  const correct=choice===expected;
  return {correct,built:correct&&mission===2?built+choice:built,finished:correct&&(mission!==2||built.length+1===round.phonemes.length)};
}
export const riverZ=x=>-6+Math.sin(x*.13)*2;
export function canWalk(x,z,mission,obstacles=[]) {
  if(x<-25||x>25||z<-35||z>23)return false;
  const river=Math.abs(z-riverZ(x))<1.55;
  if(river&&!(mission>=2&&Math.abs(x-10)<2.1))return false;
  return !obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.42);
}
export function movePlayer(p,input,dt,mission,obstacles) {
  const len=Math.hypot(input.x,input.z);const speed=input.run?7:5;
  const targetX=len?input.x/len*speed:0,targetZ=len?input.z/len*speed:0;
  const rate=1-Math.exp(-dt*(len?12:18));
  p.vx+=(targetX-p.vx)*rate;p.vz+=(targetZ-p.vz)*rate;
  const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;
  if(canWalk(nx,p.z,mission,obstacles))p.x=nx;else p.vx=0;
  if(canWalk(p.x,nz,mission,obstacles))p.z=nz;else p.vz=0;
  return p;
}
