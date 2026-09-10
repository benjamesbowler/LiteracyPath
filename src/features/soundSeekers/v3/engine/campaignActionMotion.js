// Motor presentation only. This timeline never determines literacy correctness.
const ROUTED=new Set(['sound-herd','river-route','sentence-express','pals-post','garden-kitchen','story-rescue','fix-it-workshop']);
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function createCampaignActionMotion({familyId,action,from,to,objectId='',appearance={},label='',reducedMotion=false}={}){
 if(!ROUTED.has(familyId))return null;
 if(!finitePoint(from)||!finitePoint(to))throw new TypeError('Action motion needs finite from/to coordinates');
 if(!action||typeof action.type!=='string')throw new TypeError('Action motion needs an explicit player action');
 const distance=Math.hypot(to.x-from.x,to.y-from.y);
 return {familyId,action:{...action},from:{...from},to:{...to},position:{...from},objectId,appearance:{...appearance},label,phase:'outbound',elapsed:0,duration:reducedMotion?0:Math.max(.18,Math.min(.8,distance/900)),committed:false,reducedMotion};
}
export function advanceCampaignActionMotion(motion,dt){
 if(!motion||!Number.isFinite(dt)||dt<0)throw new TypeError('Action motion needs a finite nonnegative elapsed time');
 if(!['outbound','returning'].includes(motion.phase))return [];
 motion.elapsed+=Math.min(dt,.25);
 const t=motion.duration===0?1:Math.min(1,motion.elapsed/motion.duration),u=t*t*(3-2*t);
 const returning=motion.phase==='returning',a=returning?motion.to:motion.from,b=returning?motion.from:motion.to;
 const arc=motion.familyId==='river-route'?24:motion.familyId==='sentence-express'?0:45;
 motion.position={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u-Math.sin(Math.PI*u)*arc};
 if(t<1)return [];
 if(returning){motion.phase='returned';return [{type:'returned',objectId:motion.objectId}];}
 motion.phase='awaiting-outcome';
 if(motion.committed)return [];
 motion.committed=true;return [{type:'commit',action:{...motion.action}}];
}
export function resolveCampaignActionMotion(motion,outcome){
 if(!motion||motion.phase!=='awaiting-outcome')return motion;
 if(outcome?.type==='incorrect'){
  motion.phase='returning';motion.elapsed=0;
 }else if(['complete','progress','correct'].includes(outcome?.type))motion.phase='settled';
 else if(outcome?.type==='ignored'){motion.phase='returning';motion.elapsed=0;}
 return motion;
}
export function cancelCampaignActionMotion(motion){
 if(!motion)return;
 motion.phase='cancelled';motion.position={...motion.from};
}
