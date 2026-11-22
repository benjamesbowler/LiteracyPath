/** Published sessions keep their original bank and routing. V13 activation requires backend availability. */
export const LITERACY_MOCK_VERSION = 'literacy-mock-v12';
export const LITERACY_MOCK_BALANCED_VERSION = 'literacy-mock-v13';
export const LITERACY_MOCK_VERSIONS = Object.freeze([
  'literacy-mock-v1', 'literacy-mock-v2', 'literacy-mock-v3', 'literacy-mock-v4', 'literacy-mock-v5', 'literacy-mock-v6', 'literacy-mock-v7', 'literacy-mock-v8', 'literacy-mock-v9', 'literacy-mock-v10', 'literacy-mock-v11', 'literacy-mock-v12',
  LITERACY_MOCK_BALANCED_VERSION,
]);
export const LITERACY_MOCK_EVIDENCE_VERSIONS = Object.freeze(LITERACY_MOCK_VERSIONS.slice(2));
export const LITERACY_MOCK_BOUNDARY_VERSIONS = Object.freeze(LITERACY_MOCK_VERSIONS.slice(8));
export const isLiteracyMockBoundaryVersion = version => LITERACY_MOCK_BOUNDARY_VERSIONS.includes(version);
export const LITERACY_MOCK_PROGRESSION_VERSIONS = Object.freeze(LITERACY_MOCK_VERSIONS.slice(10));
export const isLiteracyMockProgressionVersion = version => LITERACY_MOCK_PROGRESSION_VERSIONS.includes(version);
