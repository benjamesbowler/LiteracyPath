import { literacyMockDemandV6, LITERACY_MOCK_DEMAND_LADDERS } from './literacyMockDemandV6.js';

const comprehension=(domain)=>LITERACY_MOCK_DEMAND_LADDERS[domain].map((rung,band)=>band===3
 ? {operation:`resolve_${domain==='reading'?'printed':'spoken'}_temporal_links`,requires:'Combine two before/after links when the order of mention conflicts with the actual event order.'}
 : band===4?{operation:`integrate_${domain==='reading'?'printed':'spoken'}_topic_against_details`,requires:'Integrate at least two functions or stages; reject two true but incomplete main-idea alternatives.'}:rung);
export const LITERACY_MOCK_V7_LADDERS=Object.freeze({...LITERACY_MOCK_DEMAND_LADDERS,reading:comprehension('reading'),listening:comprehension('listening')});

export function literacyMockDemandV7(q){
 if(!['reading','listening'].includes(q.domainId))return literacyMockDemandV6(q);
 const previous=literacyMockDemandV6(q);
 if(previous!==null&&previous<=2)return previous;
 if(q.tutorialOnly||q.taskDemand?.reviewed!==true)return null;
 const claim=(q.constructClaim||'').replace(/^listening_/,''),features=q.taskDemand.features||{};
 if(claim==='story_event_order'&&features.temporalLinks>=2&&features.presentationConflicts>=1)return 3;
 if(claim==='mostly_about_info'&&features.requiredEvidenceParts>=2&&features.competingTruePartialAccounts>=2)return 4;
 if(claim==='lesson_mistake_fixed'&&features.episodesToIntegrate===1)return 5;
 if(claim==='lesson_mistake_fixed'&&features.episodesToIntegrate===2&&features.plausiblePartialLessons>=2)return 6;
 return null;
}
