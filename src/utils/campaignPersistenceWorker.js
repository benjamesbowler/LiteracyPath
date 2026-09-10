import { LEGACY_PROGRESS_QUEUE_KEY, PROGRESS_QUEUE_ENTRY_PREFIX } from './progressQueue.js';
let worker=null,sequence=0;
const pending=new Map();
export const campaignWorkerAvailable=()=>typeof Worker!=='undefined';
export function disposeCampaignPersistenceWorker(){worker?.terminate();worker=null;for(const {reject}of pending.values())reject(new Error('Campaign persistence worker disposed'));pending.clear();}
export function campaignQueueBytes(storage){const records=[];for(let i=0;i<(storage?.length||0);i++){const key=storage.key(i);if(key===LEGACY_PROGRESS_QUEUE_KEY||key?.startsWith(PROGRESS_QUEUE_ENTRY_PREFIX)){const raw=storage.getItem(key);if(raw!==null)records.push([key,raw]);}}return records;}
export function runCampaignPersistenceWork(job){
  if(!worker){worker=new Worker(new URL('./campaignPersistence.worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{const call=pending.get(data.id);if(!call)return;pending.delete(data.id);if(data.error)call.reject(new Error(data.error));else call.resolve(data.result);};worker.onerror=()=>disposeCampaignPersistenceWorker();}
  return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});try{worker.postMessage({id,job});}catch(error){pending.delete(id);reject(error);}});
}
