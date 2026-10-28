/** Published sessions keep their original bank; new sessions use the reviewed V12 beginner material and gradual independent-observation route. */
export const LITERACY_MOCK_VERSION = 'literacy-mock-v12';
export const LITERACY_MOCK_VERSIONS = Object.freeze([
  'literacy-mock-v1', 'literacy-mock-v2', 'literacy-mock-v3', 'literacy-mock-v4', 'literacy-mock-v5', 'literacy-mock-v6', 'literacy-mock-v7', 'literacy-mock-v8', 'literacy-mock-v9', 'literacy-mock-v10', 'literacy-mock-v11', 'literacy-mock-v12',
]);
export const LITERACY_MOCK_EVIDENCE_VERSIONS = Object.freeze(['literacy-mock-v3', 'literacy-mock-v4', 'literacy-mock-v5', 'literacy-mock-v6', 'literacy-mock-v7', 'literacy-mock-v8', 'literacy-mock-v9', 'literacy-mock-v10', 'literacy-mock-v11','literacy-mock-v12']);
export const LITERACY_MOCK_BOUNDARY_VERSIONS = Object.freeze(['literacy-mock-v9', 'literacy-mock-v10', 'literacy-mock-v11','literacy-mock-v12']);
export const isLiteracyMockBoundaryVersion = version => LITERACY_MOCK_BOUNDARY_VERSIONS.includes(version);
