import { buildLiteracyMockBeginnerReadingV12 } from './literacyMockBeginnerReadingV12.js';
import { buildLiteracyMockBeginnerWritingV12 } from './literacyMockBeginnerWritingV12.js';

export function buildLiteracyMockBeginnerV12(base, normalize) {
  return [...buildLiteracyMockBeginnerReadingV12(base, normalize), ...buildLiteracyMockBeginnerWritingV12(base, normalize)];
}
