import { readFile, writeFile } from 'node:fs/promises';
import { PROGRESS_BANK } from '../src/content/assessments/v3/progressBank.generated.js';

// Keep each hosted migration below the service's request-size limit. The
// private bank is assembled before any administration RPC is installed.
// Once applied, publish later bank changes in a new forward migration.
const root = new URL('../supabase/migrations/', import.meta.url);
const path = new URL('20261002170000_adaptive_progress_checks.sql', root);
const start = '-- BEGIN GENERATED PROGRESS MANIFEST';
const end = '-- END GENERATED PROGRESS MANIFEST';
const sql = await readFile(path, 'utf8');
const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const chunkSize = Math.ceil(PROGRESS_BANK.items.length / 3);
const chunks = [0, 1, 2].map(index => PROGRESS_BANK.items.slice(index * chunkSize, (index + 1) * chunkSize));
const schema = `create table public.progress_test_banks (
  version text primary key,
  difficulty_version text not null,
  manifest jsonb not null check (jsonb_typeof(manifest) = 'object')
);
alter table public.progress_test_banks enable row level security;
revoke all on public.progress_test_banks from public, anon, authenticated;`;
const append = items => `update public.progress_test_banks set manifest=jsonb_set(manifest,'{items}',
  (manifest->'items') || $progress_bank$${JSON.stringify(items)}$progress_bank$::jsonb)
where version=${literal(PROGRESS_BANK.version)};`;
const first = `-- Generated private bank, part 1 of 3. No browser RPC is installed here.
begin;
${schema}
insert into public.progress_test_banks(version,difficulty_version,manifest) values
(${literal(PROGRESS_BANK.version)},${literal(PROGRESS_BANK.difficultyVersion)},$progress_bank$${JSON.stringify({ ...PROGRESS_BANK, items: chunks[0] })}$progress_bank$::jsonb);
commit;
`;
const second = `-- Generated private bank, part 2 of 3. No browser RPC is installed here.
begin;
${append(chunks[1])}
commit;
`;
const block = `${start}\n${append(chunks[2])}\ndo $$ begin\n  if (select jsonb_array_length(manifest->'items') from public.progress_test_banks where version=${literal(PROGRESS_BANK.version)}) is distinct from ${PROGRESS_BANK.items.length}\n  then raise exception 'Incomplete progress bank'; end if;\nend $$;\n${end}`;
const existing = sql.slice(sql.indexOf(start), sql.indexOf(end) + end.length);
const outputs = [
  [new URL('20261002165900_progress_bank_manifest_part_one.sql', root), first],
  [new URL('20261002165910_progress_bank_manifest_part_two.sql', root), second],
  [path, sql.replace(existing, () => block)]
];
for (const [file, next] of outputs) {
  if (process.argv.includes('--check')) {
    if (await readFile(file, 'utf8') !== next) throw new Error(`Progress SQL manifest differs: ${file.pathname}`);
  } else await writeFile(file, next);
}
