import { drawCampaignProp } from './campaignProps.js';
import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
/** Draw only public payloads. Parent owns selecting the destination and scoring. */
export function drawCampaignActionMotion(ctx,motion){
 if(!motion||['cancelled','returned'].includes(motion.phase))return;
 const {x,y}=motion.position;
 const kind=motion.familyId==='river-route'?'raft':motion.familyId==='sentence-express'||motion.familyId==='sound-herd'?'cart':motion.objectId||'parcel';
 drawCampaignProp(ctx,kind,x,y,{size:motion.familyId==='river-route'?135:85,...(['river-route','sentence-express','sound-herd'].includes(motion.familyId)?{}:motion.appearance)});
 if(motion.objectId&&['river-route','sound-herd'].includes(motion.familyId))drawCampaignProp(ctx,motion.objectId,x,y-45,{size:45,...motion.appearance});
 if(motion.label){
  const width=Math.max(80,Math.min(240,motion.label.length*14+24));
  ctx.fillStyle=P['world-tone-2'];ctx.strokeStyle=P['world-tone-1'];ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(x-width/2,y-115,width,48,10);ctx.fill();ctx.stroke();
  ctx.fillStyle=P['world-tone-1'];ctx.font='800 21px "Nunito", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(motion.label,x,y-91,width-16);
 }
}
