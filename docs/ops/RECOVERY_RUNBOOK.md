# Recovery runbook

Owner: product operations. Technical approver: database owner. Last reviewed: 2026-07-25.

## Recovery objective

- **RPO:** no more than 24 hours of durable school data for a regional database loss. Transaction logs or provider point-in-time recovery should reduce this where the deployment plan supports it.
- **RTO:** restore the service and verify the protected learning record within 4 hours of declaring a recoverable database incident.
- A backup is not considered usable because it exists. It must list successfully, restore into an **isolated** non-production database, and reproduce the protected table counts and fingerprints.

The protected recovery set is `classes`, `students`, `answers`, `mastery`, `item_mastery`, `assessment_attempts`, and `el_assessment_reports`. These cover the roster, item evidence, learning state, assessment history, and generated report history required by A8.7.

## Normal verification

1. Confirm the managed provider reports the scheduled backup or point-in-time restore window as healthy. Record provider, region, backup time, and expiry in the incident ticket; never paste a database URL or secret.
2. Provision a fresh non-production target whose database name contains `restore-drill` or `recovery-drill`. It must have no production traffic, users, webhooks, email, or scheduled jobs.
3. Inject credentials through the secret manager/process environment only:
   - `LP_RECOVERY_SOURCE_DATABASE_URL`
   - `LP_RECOVERY_TARGET_DATABASE_URL`
   - `LP_RECOVERY_DRILL_TARGET_MARKER` exactly equal to the isolated database name
   - `LP_RECOVERY_DRILL_CONFIRM=RESTORE:<isolated database name>`
4. Run `npm run check:recovery-drill`. The command creates a PostgreSQL custom-format backup, verifies its catalogue, restores it into the isolated target, and compares exact row counts and content fingerprints.
5. Commit only the generated `restore-drill.json` evidence artifact after checking it. It contains opaque database identities, counts, fingerprints, duration, and timestamps—never hosts, usernames, URLs, or passwords.
6. In the restored product, use the audit school to open one class, one learner, one assessment history with 500+ attempts, and one saved EL report. Record the authenticated browser result beside the JSON artifact.
7. Destroy or expire the isolated target under the infrastructure retention policy after evidence review.

## Data-rights safeguard

Before any recovered database can become a serving environment, replay every active data-rights deletion tombstone created after the backup point. A restore that makes a deleted learner, their evidence, or an expired report visible must be rejected. Backup copies age out within the configured backup-deletion window and cannot be used to reintroduce deleted records.

## Incident restore

1. Declare the incident, name the incident lead, stop writes if continuing writes would widen inconsistency, and record the last known-good time.
2. Select the newest verified recovery point that meets the RPO. Restore into isolation first.
3. Run the same protected-table comparison and the data-rights safeguard. Investigate every mismatch; do not waive missing assessment or report history.
4. Complete the audit-school browser checks and verify login sessions, class ownership, RLS, and security-definer RPCs before traffic moves.
5. Move traffic only after database owner and incident lead approval. Revoke pre-incident sessions if credential or token exposure is possible.
6. Monitor error, sync-loss, authentication, and report-generation rates. Publish a plain-language school notice when required.
7. Record actual RPO/RTO, cause, decisions, affected schools, deletion-tombstone replay, and follow-up actions. A failed or partial drill remains failed evidence.

## Failure and escalation

Stop the drill if the target marker or explicit confirmation fails, the source equals the target, the backup catalogue cannot be read, restore reports an error, any protected count/fingerprint differs, or data-rights deletions reappear. Escalate to the database owner; retain secret-free command output and the failed comparison, but never retain database URLs.
