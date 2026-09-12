---
name: supabase-changes
description: Implement or audit LiteracyPath database migrations, RPCs, RLS, authentication and persisted learner data. Use for database behavior or access boundaries; not when Supabase is merely mentioned in documentation.
---

# Supabase changes

Trace the browser caller through [domain boundaries](../../../src/data/boundaries/client.js),
its domain module and the exact migration/RPC signature. Check the governing
product standard through [the index](../../../docs/INDEX.md); use
[data rights](../../../docs/ops/DATA_RIGHTS_RUNBOOK.md),
[retention](../../../docs/ops/RETENTION_RUNBOOK.md) or
[recovery](../../../docs/ops/RECOVERY_RUNBOOK.md) only for those operations.

Preserve immutable applied migration history. Add the necessary forward
migration, maintain client signatures, and verify ownership, cross-class or
cross-school denial, child-token handling, RLS and security-definer grants.
Exercise null, missing, expired and unauthorized inputs where the changed
boundary admits them. Use synthetic fixtures in an isolated database.

Run the `supabase-local` profile in [task gates](../../../docs/verification/TASK_GATES.md)
and focused behavioral tests of the changed SQL. That profile checks local
source contracts; it does not prove an applied migration or hosted permissions.

Inspect command bodies before using a broader check: `check:db-policies`
invokes a seed with `--apply`, and recovery/seed tools can mutate data. Local
code work does not authorize hosted application, data deletion or seeding.
When already authorized, confirm the exact target and applicable safeguards,
then apply and verify that target without asking for the same permission again.

Keep credentials in the process environment or secret store. Report the
migration and exact RPC signature, tests, target environment and actual
authorization outcomes without copying secrets or learner records.
