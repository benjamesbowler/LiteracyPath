# Applying the migrations to a real PostgreSQL, locally

These scripts exist because on 2026-07-27 the assembled migration SQL failed on
the hosted database **four times in a row**, once per paste, with the owner
acting as the test harness. Each failure was a different missing column. That is
not a debugging loop; it is guessing with a slow oracle.

PGlite is PostgreSQL compiled to WebAssembly. It runs in Node with no server and
no install, so the migrations can be applied for real before anyone pastes them.

    cd tools/db && npm install @electric-sql/pglite
    node run.mjs       ../../docs/ops/APPLY_PENDING_DATABASE_UPDATES_2026-07-27.sql  # empty database
    node runlegacy.mjs ../../docs/ops/APPLY_PENDING_DATABASE_UPDATES_2026-07-27.sql  # legacy database
    node verify.mjs    ../../docs/ops/APPLY_PENDING_DATABASE_UPDATES_2026-07-27.sql  # 3 runs + checks

## The trap that cost three of the four attempts

`legacy.sql` is the important file. An EMPTY database does not reproduce the
hosted one, because almost every migration begins with
`create table if not exists`. On a database where the table already exists but
is missing a column added later, that statement **does nothing at all** — it does
not add the column — and the next statement referencing it fails:

    ERROR: 42703: column "archived_at" does not exist

`run.mjs` (empty) passed while the hosted database failed. `runlegacy.mjs`
creates tables as an older schema version defined them, and reproduces the real
failure. Test against both, always.

`introspect.mjs` regenerates the reconciliation prelude by reading the schema
that the migrations actually produce, so the prelude cannot drift from them.
