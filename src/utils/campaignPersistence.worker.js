import { processCampaignPersistenceWork } from './campaignPersistenceWork.js';
self.onmessage=async({data:{id,job}})=>{
  try{self.postMessage({id,result:await processCampaignPersistenceWork(job)});}
  catch(error){self.postMessage({id,error:error.message});}
};
