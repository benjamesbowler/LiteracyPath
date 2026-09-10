import { enqueueProgressQueueEntry, readProgressQueueRecords, mergeProgressQueueRecords, progressEntryIdentity } from './progressQueue.js';
import { encodeCampaignTransport } from './campaignTransport.js';
import { campaignDeltaFromAck } from './campaignDelta.js';
export async function processCampaignPersistenceWork(job){
  if(job.operation==='transport')return encodeCampaignTransport(campaignDeltaFromAck(job.payload,job.ack));
  const data=new Map(job.records),writes=[];
  const storage={get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);writes.push([k,v]);},removeItem:k=>data.delete(k)};
  if(job.operation==='metadata'){const records=readProgressQueueRecords(storage);return records.map(r=>({studentId:r.entry.studentId,identity:progressEntryIdentity(r.entry)}));}
  if(job.operation==='enqueue'){
    const result=enqueueProgressQueueEntry(storage,job.incoming,{deferred:job.deferred,revision:job.revision});
    return {stored:result.stored,writes,removed:job.records.filter(([k])=>!data.has(k)),entry:{...result.entry,payload:undefined}};
  }
  if(job.operation==='read'){
    const records=readProgressQueueRecords(storage).filter(r=>progressEntryIdentity(r.entry)===job.identity);
    const inputs=job.volatile?[...records,{storageKey:null,legacy:false,entry:job.volatile}]:records;
    return {current:mergeProgressQueueRecords(inputs),records:records.map(({entry,...record})=>({...record,entry:{studentId:entry.studentId,area:entry.area,key:entry.key}}))};
  }
  throw new Error('Unsupported campaign persistence work');
}
