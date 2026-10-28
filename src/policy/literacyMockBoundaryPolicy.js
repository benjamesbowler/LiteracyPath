import { LITERACY_MOCK_AREA_ORDER,LITERACY_MOCK_AREA_MAX } from './literacyMockAdaptivePolicy.js';
import { literacyMockBoundaryStateV9, literacyMockBoundaryScheduleV9,
  LITERACY_MOCK_V9_AREA_BUDGETS, LITERACY_MOCK_V9_MAX_ITEMS, LITERACY_MOCK_V9_AREA_VERSION } from './literacyMockBoundaryV9.js';
import { literacyMockProgressionV11, LITERACY_MOCK_V11_AREA_BUDGETS,
  LITERACY_MOCK_V11_MAX_ITEMS, LITERACY_MOCK_V11_AREA_VERSION } from './literacyMockProgressionV11.js';

export function literacyMockBoundaryLimits(version) {
  return ['literacy-mock-v11','literacy-mock-v12'].includes(version)
    ? { budgets: LITERACY_MOCK_V11_AREA_BUDGETS, maximum: LITERACY_MOCK_V11_MAX_ITEMS, areaVersion: LITERACY_MOCK_V11_AREA_VERSION }
    : { budgets: LITERACY_MOCK_V9_AREA_BUDGETS, maximum: LITERACY_MOCK_V9_MAX_ITEMS, areaVersion: LITERACY_MOCK_V9_AREA_VERSION };
}
export function literacyMockBoundaryVersion(rows = [], { bank, contentVersion } = {}) {
  if (contentVersion) return contentVersion;
  const values = bank instanceof Map ? bank.values() : bank || [];
  for (const item of values) if (item?.contentVersion) return item.contentVersion;
  return rows.find(row => row.itemSnapshot?.contentVersion || row.contentVersion)?.itemSnapshot?.contentVersion
    || rows.find(row => row.contentVersion)?.contentVersion;
}
export function literacyMockBoundaryState(rows = [], options = {}) {
  return ['literacy-mock-v11','literacy-mock-v12'].includes(literacyMockBoundaryVersion(rows, options))
    ? literacyMockProgressionV11(rows, options) : literacyMockBoundaryStateV9(rows, options);
}
export function literacyMockBoundarySchedule(rows = [], options = {}) {
  const version = literacyMockBoundaryVersion(rows, options);
  if (!['literacy-mock-v11','literacy-mock-v12'].includes(version)) return literacyMockBoundaryScheduleV9(rows, options);
  const byId = options.bank instanceof Map ? options.bank : new Map((options.bank || []).map(item => [item.id,item]));
  const prefix = rows.filter(row => row.responseStatus !== 'media_failed').map(row => (byId.get(row.questionId) || row.itemSnapshot || row.questionSnapshot || row).domainId);
  const {budgets,maximum} = literacyMockBoundaryLimits(version);
  if (prefix.length > maximum || prefix.some(domain => !budgets[domain])) throw Error('Invalid adaptive boundary history.');
  const states = literacyMockBoundaryState(rows, options), seen = {}, future = [];
  for (const domain of LITERACY_MOCK_AREA_ORDER) {
    if (states[domain].answered > budgets[domain]) throw Error('Invalid adaptive boundary history.');
    seen[domain] = 0;
  }
  for (let round=0; round<Math.ceil(Math.max(...Object.values(budgets))/2); round++) {
    for (const domain of LITERACY_MOCK_AREA_ORDER) for(let slot=0;slot<2;slot++) {
      const ordinal = ++seen[domain];
      if (ordinal<=budgets[domain] && ordinal>states[domain].answered && !states[domain].complete) future.push(domain);
    }
  }
  return [...prefix,...future];
}

// Unseen placeholders reserve a feasible spread of tasks; they never predict
// a response. The next unseen item alone is replaced by the observed demand.
export function literacyMockBoundaryPlaceholderBand(version,domain,ordinal){
 if(domain==='print')return ordinal>5?2:0;
 if(!['literacy-mock-v11','literacy-mock-v12'].includes(version))return 0;
 return Math.min(LITERACY_MOCK_AREA_MAX[domain],ordinal<=3?0:1+Math.floor((ordinal-4)/2));
}
