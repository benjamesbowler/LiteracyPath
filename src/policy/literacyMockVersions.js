/** Published sessions keep their original bank; new sessions use the reviewed V10 material and repeated-observation route. */
export const LITERACY_MOCK_VERSION = 'literacy-mock-v10';
export const LITERACY_MOCK_VERSIONS = Object.freeze([
  'literacy-mock-v1', 'literacy-mock-v2', 'literacy-mock-v3', 'literacy-mock-v4', 'literacy-mock-v5', 'literacy-mock-v6', 'literacy-mock-v7', 'literacy-mock-v8', 'literacy-mock-v9', LITERACY_MOCK_VERSION,
]);
export const LITERACY_MOCK_EVIDENCE_VERSIONS = Object.freeze(['literacy-mock-v3', 'literacy-mock-v4', 'literacy-mock-v5', 'literacy-mock-v6', 'literacy-mock-v7', 'literacy-mock-v8', 'literacy-mock-v9', LITERACY_MOCK_VERSION]);
export const LITERACY_MOCK_BOUNDARY_VERSIONS = Object.freeze(['literacy-mock-v9', 'literacy-mock-v10']);
export const isLiteracyMockBoundaryVersion = version => LITERACY_MOCK_BOUNDARY_VERSIONS.includes(version);
