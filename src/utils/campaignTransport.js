import { encodeProgressStorage, decodeProgressStorage } from './progressStorageCodec.js';
const CODEC = 'campaign-challenges-gzip-v1';
function codePointOrder(a,b) {
  const left=Array.from(a),right=Array.from(b);
  for(let i=0;i<Math.min(left.length,right.length);i++)if(left[i]!==right[i])return left[i].codePointAt(0)-right[i].codePointAt(0);
  return left.length-right.length;
}
function decimal(number) {
  const text=JSON.stringify(number);
  if(!/[eE]/.test(text))return text;
  const negative=text.startsWith('-'),[mantissa,exponent]=text.replace(/^-/,'').toLowerCase().split('e');
  const point=(mantissa.indexOf('.')<0?mantissa.length:mantissa.indexOf('.'))+Number(exponent),digits=mantissa.replace('.','');
  return (negative?'-':'')+(point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point));
}
// Matches PostgreSQL JSONB canonical keys, compact separators and expanded
// numeric exponents. Inputs are JSON-normalized before hashing.
export function canonicalCampaignChallenges(value) {
  if(Array.isArray(value))return '['+value.map(canonicalCampaignChallenges).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort(codePointOrder).map(key=>JSON.stringify(key)+':'+canonicalCampaignChallenges(value[key])).join(',')+'}';
  return typeof value==='number'?decimal(value):JSON.stringify(value);
}
export async function encodeCampaignTransport(progress) {
  if(progress?.v!==3||progress?.campaign?.v!==1)return progress;
  const raw=decodeCampaignTransport(progress),checkpoints={...raw.campaign.checkpoints};
  await Promise.all(Object.entries(checkpoints).map(async([id,checkpoint])=>{
    if(!Array.isArray(checkpoint.challenges))return;
    const exact=JSON.parse(JSON.stringify(checkpoint.challenges));
    const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalCampaignChallenges(exact)));
    checkpoints[id]={...checkpoint,challenges:{codec:CODEC,sha256:Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join(''),data:encodeProgressStorage(exact,{force:true})}};
  }));
  return {...raw,campaign:{...raw.campaign,checkpoints}};
}
/** Called before authority validation or merging; compressed blobs never reach
 * the renderer. CRC and length checks preserve failure/recovery boundaries.
 */
export function decodeCampaignTransport(progress) {
  if(progress?.v!==3||progress?.campaign?.v!==1)return progress;
  let changed=false;const checkpoints={...progress.campaign.checkpoints};
  for(const [id,checkpoint] of Object.entries(checkpoints)) {
    const packed=checkpoint?.challenges;
    if(!packed||Array.isArray(packed))continue;
    if(packed.codec!==CODEC||!/^[a-f0-9]{64}$/.test(packed.sha256)||typeof packed.data!=='string')throw new Error('Unreadable campaign challenge transport');
    const challenges=decodeProgressStorage(packed.data);
    if(!Array.isArray(challenges))throw new Error('Unreadable campaign challenge transport');
    checkpoints[id]={...checkpoint,challenges};changed=true;
  }
  return changed?{...progress,campaign:{...progress.campaign,checkpoints}}:progress;
}
