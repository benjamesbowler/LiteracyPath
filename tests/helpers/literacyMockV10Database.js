import { fixtureV9 } from './literacyMockV9Database.js';
import { read } from './literacyMockDatabase.js';
import { literacyMockV10SchemaSql, V10_CATALOGUE_MIGRATION } from '../../tools/generateLiteracyMockV10.mjs';

// The small common fixture intentionally seeds synthetic V1 questions and
// omits full V2/V3 banks. Recover the exact original V1 SQL records here; its
// pre-composite ON CONFLICT(id) statement cannot run above the later schema.
const frozenV1 = (() => {
  const literal = read('20261006092000_literacy_mock_items.sql').match(/from jsonb_array_elements\('([\s\S]*)'::jsonb\) item\non conflict/);
  if (!literal) throw new Error('The immutable V1 catalogue transport is missing.');
  return JSON.parse(literal[1].replaceAll("''", "'"));
})();

/** Hash every complete frozen publication beneath V10, not just source IDs. */
export async function historicalPublicationDigests(db) {
  return (await db.query(`select content_version,count(*)::integer item_count,
    md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate "C")) digest
    from literacy_mock_items where content_version<>'literacy-mock-v10' group by content_version order by content_version`)).rows;
}

/** Isolated in-memory SQL, with all nine historical publications intact.
 * No environment credentials, network connection or hosted queries. */
export async function fixtureV10({ catalogue = false } = {}) {
  const db = await fixtureV9({ catalogue: true });
  try {
    // Replace only isolated synthetic fixture content before establishing the
    // baseline. Production migrations and all stored historical bytes remain
    // untouched. V2/V3 execute their exact immutable publication statements.
    await db.query("delete from literacy_mock_items where content_version='literacy-mock-v1'");
    await db.query("insert into literacy_mock_items(id,content_version,item) select q->>'id','literacy-mock-v1',q from jsonb_array_elements($1) q", [frozenV1]);
    await db.query("update literacy_mock_publications set item_count=$1 where content_version='literacy-mock-v1'", [frozenV1.length]);
    await db.exec(read('20261010121000_literacy_mock_items_v2.sql'));
    await db.exec(read('20261010141000_literacy_mock_items_v3.sql'));
    db.v10HistoricalPublicationDigests = await historicalPublicationDigests(db);
    if (db.v10HistoricalPublicationDigests.length !== 9) throw new Error('The V10 fixture requires every V1–V9 publication.');
    const schema = literacyMockV10SchemaSql();
    if (!schema.trim()) throw new Error('The V10 schema migration has not been generated.');
    await db.exec(schema);
    if (catalogue) {
      const publication = read(V10_CATALOGUE_MIGRATION);
      if (!publication.trim()) throw new Error('The exact V10 catalogue migration has not been generated.');
      await db.exec(publication);
    }
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
