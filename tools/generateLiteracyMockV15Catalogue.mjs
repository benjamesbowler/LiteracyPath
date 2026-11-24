import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { literacyMockCatalogueDelta } from './literacyMockCatalogueDelta.mjs';

export const V15_CATALOGUE_MIGRATION = '20261124143100_literacy_mock_catalogue_v15.sql';
const root = new URL('../', import.meta.url);
export const literacyMockV15CatalogueSql = () => literacyMockCatalogueDelta(14, 15);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL(`supabase/migrations/${V15_CATALOGUE_MIGRATION}`, root);
  const sql = await literacyMockV15CatalogueSql();
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(path, 'utf8'), sql);
  else fs.writeFileSync(path, sql);
  console.log(`${V15_CATALOGUE_MIGRATION}: ${Buffer.byteLength(sql)} bytes; local publication only.`);
}
