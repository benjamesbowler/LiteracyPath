import {buildLiteracyMockActionCapacityV11} from './literacyMockActionCapacityV11.js';
import {retainPublishedV11Audio} from './literacyMockV11AudioHistory.js';
import {buildLiteracyMockWritingCapacityV11} from './literacyMockWritingCapacityV11.js';
import {LITERACY_MOCK_V11_LADDERS} from '../policy/literacyMockDemandV11.js';
import {buildLiteracyMockEverydayCapacityV11} from './literacyMockEverydayCapacityV11.js';
import {buildLiteracyMockPhonicsCapacityV11} from './literacyMockPhonicsCapacityV11.js';
import {upgradeFoundationChoicesV11} from './literacyMockFourChoiceFoundationsV11.js';
import {upgradeMeaningChoicesV11} from './literacyMockFourChoiceMeaningV11.js';
import {LITERACY_MOCK_V11_AREA_VERSION} from '../policy/literacyMockProgressionV11.js';

/** Corrected new snapshots; frozen V1–V10 publications and semantic exposure
 * identities remain intact. Retired sources are retained but cannot be routed. */
export function buildLiteracyMockV11(base,normalize){
 const result=[];
 for(const source of base){
  const changed=upgradeMeaningChoicesV11(upgradeFoundationChoicesV11(source,base),base);
  const publish=(item,eligible)=>{
   const snapshot={...item,contentVersion:'literacy-mock-v11',adaptiveAreaVersion:LITERACY_MOCK_V11_AREA_VERSION,adaptiveMixedEligible:eligible};
   delete snapshot.itemSnapshot;
   return {...snapshot,itemSnapshot:{...snapshot}};
  };
  if(changed.id!==source.id) result.push(publish(source,false));
  result.push(publish(changed,source.adaptiveMixedEligible===true));
 }
 result.push(...[...buildLiteracyMockPhonicsCapacityV11(base,normalize),...buildLiteracyMockEverydayCapacityV11(base,normalize),...buildLiteracyMockWritingCapacityV11(base,normalize),...buildLiteracyMockActionCapacityV11(base,normalize)].map(item=>{
  const snapshot={...item,contentVersion:'literacy-mock-v11',adaptiveAreaVersion:LITERACY_MOCK_V11_AREA_VERSION,adaptiveMixedEligible:true,adaptiveDemand:LITERACY_MOCK_V11_LADDERS[item.domainId][item.adaptiveAreaBand]};delete snapshot.itemSnapshot;return {...snapshot,itemSnapshot:{...snapshot}};
 }));
 if(new Set(result.map(item=>item.id)).size!==result.length)throw Error('Duplicate V11 question identity.');
 return retainPublishedV11Audio(result);
}
