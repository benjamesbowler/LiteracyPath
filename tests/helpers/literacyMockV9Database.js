import { fixtureV8 } from './literacyMockV8Database.js';
import { read } from './literacyMockDatabase.js';
import { literacyMockV9SchemaSql, V9_CATALOGUE_MIGRATION } from '../../tools/generateLiteracyMockV9.mjs';
import { V9_DELIVERY_CACHE_MIGRATION } from '../../tools/generateLiteracyMockV9DeliveryCache.mjs';

export async function legacyPublicationDigests(db) {
  return (await db.query(`select content_version,count(*)::integer item_count,
    md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate "C")) digest
    from literacy_mock_items where content_version<>'literacy-mock-v9' group by content_version order by content_version`)).rows;
}

/** Entire fixture lives in isolated in-memory PGlite; no hosted access. Keep
 * the applied V8/cache behavior beneath the forward-only V9 definitions. */
export async function fixtureV9({ catalogue = false, deliveryCache = true } = {}) {
  const db = await fixtureV8();
  try {
    db.v9LegacyPublicationDigests = await legacyPublicationDigests(db);
    await db.exec(read('20261016080840_literacy_mock_plan_freshness_cache.sql'));
    await db.exec(literacyMockV9SchemaSql());
    if (deliveryCache) await db.exec(read(V9_DELIVERY_CACHE_MIGRATION));
    if (catalogue) {
      const publication = read(V9_CATALOGUE_MIGRATION);
      if (!publication.trim()) throw new Error('The exact V9 catalogue migration has not been generated.');
      await db.exec(publication);
    }
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
