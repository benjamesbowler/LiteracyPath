import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLiteracyMockBank, LITERACY_MOCK_VERSION, LITERACY_MOCK_VERSIONS, literacyMockSkillsForVersion } from '../src/data/literacyMockBank.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIRRORED_SNAPSHOT_FIELDS = ['id', 'skillId', 'domainId', 'level', 'format', 'choices', 'answer', 'answerMode', 'requiredAudioPaths'];

export function compactIncomingSql(items) {
  // This is a lossless transport representation only. Published JSONB keeps
  // the complete canonical item, including distinct outer/snapshot values.
  const canonical = JSON.parse(JSON.stringify(items));
  const snapshotOnly = canonical.every(item => item.itemSnapshot && typeof item.itemSnapshot === 'object'
    && !Array.isArray(item.itemSnapshot) && Object.keys(item).length === MIRRORED_SNAPSHOT_FIELDS.length + 1
    && MIRRORED_SNAPSHOT_FIELDS.every(key => Object.hasOwn(item, key) && Object.hasOwn(item.itemSnapshot, key)
      && JSON.stringify(item[key]) === JSON.stringify(item.itemSnapshot[key])));
  const records = snapshotOnly ? canonical.map(item => item.itemSnapshot) : canonical;
  const counts = new Map();
  const count = value => {
    if (value === null || typeof value !== 'object') {
      const key = JSON.stringify(value);
      counts.set(key, (counts.get(key) || 0) + 1);
    } else if (Array.isArray(value)) value.forEach(count);
    else for (const [key, child] of Object.entries(value)) { count(key); count(child); }
  };
  records.forEach(count);
  const dictionary = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([key]) => JSON.parse(key));
  const indices = new Map(dictionary.map((value, index) => [JSON.stringify(value), index]));
  // Every primitive, including numbers/null, is a dictionary reference.
  // Tags distinguish arrays [0,...] and objects [1,key,value,...] without
  // reserving any source key or confusing empty/missing/null values.
  const encode = value => {
    if (value === null || typeof value !== 'object') return indices.get(JSON.stringify(value));
    if (Array.isArray(value)) return [0, ...value.map(encode)];
    return [1, ...Object.entries(value).flatMap(([key, child]) => [indices.get(JSON.stringify(key)), encode(child)])];
  };
  const payload = JSON.stringify({ dictionary, records: records.map(encode) }).replace(/'/g, "''");
  const itemExpression = snapshotOnly
    ? `jsonb_build_object(${MIRRORED_SNAPSHOT_FIELDS.map(key => `'${key}', item->'${key}'`).join(', ')}, 'itemSnapshot', item)`
    : 'item';
  return `-- Primitive dictionary transport; decode completely before immutable publication checks.\n`
    + `set local search_path = '';\n`
    + `create function pg_temp.lp_literacy_mock_unpack(node jsonb, dictionary jsonb) returns jsonb\n`
    + `language plpgsql immutable as $decode$\n`
    + `declare result jsonb; reference integer; slot integer; decoded_key text; begin\n`
    + `  if dictionary is null or jsonb_typeof(dictionary) <> 'array' then raise exception 'Invalid mock catalogue dictionary'; end if;\n`
    + `  if jsonb_typeof(node) = 'number' then\n`
    + `    if (node#>>'{}') !~ '^(0|[1-9][0-9]*)$' then raise exception 'Invalid mock catalogue reference'; end if;\n`
    + `    reference := (node#>>'{}')::integer;\n`
    + `    if reference >= jsonb_array_length(dictionary) then raise exception 'Missing mock catalogue reference'; end if;\n`
    + `    if jsonb_typeof(dictionary->reference) in ('array', 'object') then raise exception 'Nonprimitive mock catalogue reference'; end if;\n`
    + `    return dictionary->reference;\n`
    + `  end if;\n`
    + `  if node is null or jsonb_typeof(node) <> 'array' then raise exception 'Invalid encoded mock catalogue node'; end if;\n`
    + `  if node->0 = '0'::jsonb then\n`
    + `    select coalesce(jsonb_agg(pg_temp.lp_literacy_mock_unpack(value, dictionary) order by ordinal), '[]'::jsonb)\n`
    + `    into result from jsonb_array_elements(node) with ordinality as elements(value, ordinal) where ordinal > 1;\n`
    + `  elsif node->0 = '1'::jsonb and mod(jsonb_array_length(node), 2) = 1 then\n`
    + `    result := '{}'::jsonb;\n`
    + `    for slot in 1..jsonb_array_length(node) - 1 by 2 loop\n`
    + `      if jsonb_typeof(node->slot) <> 'number' or (node->>slot) !~ '^(0|[1-9][0-9]*)$'\n`
    + `        then raise exception 'Invalid mock catalogue key reference'; end if;\n`
    + `      reference := (node->>slot)::integer;\n`
    + `      if reference >= jsonb_array_length(dictionary) or jsonb_typeof(dictionary->reference) <> 'string'\n`
    + `        then raise exception 'Missing or nonstring mock catalogue key'; end if;\n`
    + `      decoded_key := dictionary->>reference;\n`
    + `      if result ? decoded_key then raise exception 'Duplicate mock catalogue key'; end if;\n`
    + `      result := result || jsonb_build_object(decoded_key, pg_temp.lp_literacy_mock_unpack(node->(slot + 1), dictionary));\n`
    + `    end loop;\n`
    + `  else raise exception 'Invalid encoded mock catalogue tag'; end if;\n`
    + `  return result; end; $decode$;\n`
    + `revoke all on function pg_temp.lp_literacy_mock_unpack(jsonb,jsonb) from public;\n`
    + `with packed as (select '${payload}'::jsonb as data), decoded as materialized (\n`
    + `  select pg_temp.lp_literacy_mock_unpack(record, data->'dictionary') as item\n`
    + `  from packed cross join lateral jsonb_array_elements(data->'records') as records(record)\n`
    + `) insert into literacy_mock_incoming select ${itemExpression} from decoded;\n`
    + `drop function pg_temp.lp_literacy_mock_unpack(jsonb,jsonb);\n`;
}

export async function createLiteracyMockManifest({ requireAllMedia = true, contentVersion = LITERACY_MOCK_VERSION } = {}) {
  const authored = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion });
  const unavailable = authored.filter(item => !item.mediaReady);
  if (requireAllMedia && unavailable.length) throw new Error(`${unavailable.length} authored mock items are missing required audio or reviewed imagery.`);
  const bank = authored.filter(item => item.mediaReady);
  for (const item of bank) {
    for (const asset of [...item.requiredAudioPaths, ...item.requiredImagePaths]) {
      if (!asset.startsWith('/') || asset.includes('..') || !fs.existsSync(path.join(root, 'public', asset.split('#')[0]))) {
        throw new Error(`Missing or invalid mock media: ${item.id}: ${asset}`);
      }
    }
  }
  for (const skill of literacyMockSkillsForVersion(contentVersion)) for (const level of [1, 2]) {
    if (!bank.some(item => item.skillId === skill.id && item.level === level)) throw new Error(`Mock coverage missing: ${skill.id} level ${level}`);
  }
  return {
    contentVersion,
    itemCount: bank.length,
    unavailableItemIds: unavailable.map(item => item.id),
    items: bank.map(item => ({
      id: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
      format: item.format, choices: item.choices, answer: item.answer, answerMode: item.answerMode,
      requiredAudioPaths: item.requiredAudioPaths, itemSnapshot: item.itemSnapshot,
    })),
  };
}

export function literacyMockManifestSql(manifest) {
  if (!LITERACY_MOCK_VERSIONS.includes(manifest.contentVersion)) throw new Error('Unsupported literacy mock content version.');
  if (manifest.unavailableItemIds.length) throw new Error('A hosted manifest cannot omit authored items with unavailable media.');
  if (manifest.itemCount !== manifest.items.length || new Set(manifest.items.map(item => item.id)).size !== manifest.itemCount) {
    throw new Error('A hosted manifest requires an exact count of unique item IDs.');
  }
  const incoming = manifest.contentVersion === 'literacy-mock-v3'
    ? compactIncomingSql(manifest.items)
    : `insert into literacy_mock_incoming select item from jsonb_array_elements('${JSON.stringify(manifest.items).replace(/'/g, "''")}'::jsonb) item;\n`;
  return `-- Generated by tools/generateLiteracyMockManifest.mjs; do not edit item keys by hand.\n`
    + `-- Private canonical answers: no public or student table access.\nbegin;\n`
    + `create temporary table literacy_mock_incoming (item jsonb not null) on commit drop;\n`
    + incoming
    + `do $publication$ begin\n`
    + `  if exists (select 1 from public.literacy_mock_items old join literacy_mock_incoming incoming on old.id = incoming.item->>'id'\n`
    + `    where old.content_version = '${manifest.contentVersion}' and old.item is distinct from incoming.item) then\n`
    + `    raise exception 'Published mock content is immutable; publish a new version for changed items';\n`
    + `  end if;\nend $publication$;\n`
    + `insert into public.literacy_mock_items (id, content_version, item)\n`
    + `select item->>'id', '${manifest.contentVersion}', item\n`
    + `from literacy_mock_incoming\n`
    + `on conflict (content_version, id) do nothing;\n`
    + `do $publication$ begin\n`
    + `  if (select count(*) from public.literacy_mock_items where content_version = '${manifest.contentVersion}') <> ${manifest.itemCount} then\n`
    + `    raise exception 'Mock publication count differs from the complete authored manifest';\n`
    + `  end if;\n`
    + `  if exists (select 1 from public.literacy_mock_publications where content_version = '${manifest.contentVersion}' and item_count <> ${manifest.itemCount}) then\n`
    + `    raise exception 'Published mock catalogue count is immutable';\n`
    + `  end if;\nend $publication$;\n`
    + `insert into public.literacy_mock_publications (content_version, item_count) values ('${manifest.contentVersion}', ${manifest.itemCount})\n`
    + `on conflict (content_version) do nothing;\ncommit;\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const valueAfter = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : '';
  const allowUnavailable = args.includes('--allow-unavailable');
  try {
    const manifest = await createLiteracyMockManifest({ requireAllMedia: !allowUnavailable,
      contentVersion: valueAfter('--content-version') || LITERACY_MOCK_VERSION });
    const jsonFile = valueAfter('--json');
    const sqlFile = valueAfter('--sql');
    if (jsonFile) {
      fs.mkdirSync(path.dirname(path.resolve(jsonFile)), { recursive: true });
      fs.writeFileSync(jsonFile, `${JSON.stringify(manifest)}\n`);
    }
    if (sqlFile) {
      fs.mkdirSync(path.dirname(path.resolve(sqlFile)), { recursive: true });
      fs.writeFileSync(sqlFile, literacyMockManifestSql(manifest));
    }
    console.log(JSON.stringify({ contentVersion: manifest.contentVersion, itemCount: manifest.itemCount,
      unavailableCount: manifest.unavailableItemIds.length, jsonFile: jsonFile || null, sqlFile: sqlFile || null }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
