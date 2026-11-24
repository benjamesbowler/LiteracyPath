import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { literacyMockCatalogueDelta } from './literacyMockCatalogueDelta.mjs';

export const V14_CATALOGUE_MIGRATION = '20261124090100_literacy_mock_catalogue_v14.sql';
const root = new URL('../', import.meta.url);
export const literacyMockV14CatalogueSql = () => literacyMockCatalogueDelta(13, 14);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL(`supabase/migrations/${V14_CATALOGUE_MIGRATION}`, root);
  const sql = await literacyMockV14CatalogueSql();
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(path, 'utf8'), sql);
  else fs.writeFileSync(path, sql);
  console.log(`${V14_CATALOGUE_MIGRATION}: ${Buffer.byteLength(sql)} bytes; local publication only.`);
}
