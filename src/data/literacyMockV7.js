import { literacyMockDemandV7, LITERACY_MOCK_V7_LADDERS } from '../policy/literacyMockDemandV7.js';

/** A separate immutable publication strengthens the middle comprehension
 * rungs without changing the already published V6 snapshots or saved runs. */
export function buildLiteracyMockV7(base){
 return base.map(q=>{
  const band=literacyMockDemandV7(q),snapshot={...q.itemSnapshot,contentVersion:'literacy-mock-v7',adaptiveAreaVersion:'areas-v3',
   adaptiveAreaBand:band,adaptiveMixedEligible:band!==null,adaptiveDemand:band===null?null:LITERACY_MOCK_V7_LADDERS[q.domainId][band]};
  return {...q,...snapshot,itemSnapshot:snapshot};
 });
}
