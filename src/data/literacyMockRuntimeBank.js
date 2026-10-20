import { LITERACY_MOCK_VERSION } from '../policy/literacyMockVersions.js';
export { literacyMockTutorialIdsForVersion, scoreLiteracyMockResponse } from './literacyMockRuntimeContract.js';

const pending = new Map();
/** The mixed V10 route needs its published eligible items, not every legacy
 * authoring input. Fresh checks and historical sessions retain the full bank. */
export async function loadLiteracyMockRuntimeBank({contentVersion = LITERACY_MOCK_VERSION, mixed = false} = {}) {
  const key = `${contentVersion}:${mixed}`;
  if (!pending.has(key)) pending.set(key, (async()=>{
    if (mixed && contentVersion === 'literacy-mock-v11') {
      const {LITERACY_MOCK_RUNTIME_V11} = await import('./generated/literacyMockRuntimeV11.generated.js');
      return LITERACY_MOCK_RUNTIME_V11.filter(item=>item.mediaReady);
    }
    if (mixed && contentVersion === 'literacy-mock-v10') {
      const { LITERACY_MOCK_RUNTIME_V10 } = await import('./generated/literacyMockRuntimeV10.generated.js');
      return LITERACY_MOCK_RUNTIME_V10.filter(item=>item.mediaReady);
    }
    const {loadLiteracyMockBank} = await import('./literacyMockBank.js');
    return loadLiteracyMockBank({contentVersion});
  })().catch(error=>{pending.delete(key);throw error;}));
  return pending.get(key);
}
