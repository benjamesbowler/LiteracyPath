# School retention job runbook

**Owner:** privacy operations owner
**Scope:** per-school inactivity archive, archive expiry, annual archive/delete,
and provider/backup deletion-propagation evidence
**Safety rule:** never run a destructive retention job against an unreviewed
policy or use the product defaults as a legal conclusion

## What the product enforces

An application administrator can open **Admin → Schools → Retention** and record:

- days without learner activity before archive;
- days after archive before permanent deletion;
- the school-year-end month and annual archive-or-delete instruction; and
- provider-copy and backup-expiry target days after active deletion.

The supported bounds prevent accidental zero-day policies. A new policy records
the latest completed default school year so its first preview cannot
retroactively archive or delete every learner. Product defaults are operational
safeguards only. The executed agreement, school instruction, public notice, and
verified provider settings must supply the approved values.

## Configure and review a school

1. Obtain the authorised school instruction and verify the school, policy owner,
   effective date, approved periods, year-end action, and any legal hold.
2. Compare the provider and backup targets with current provider evidence. Do
   not enter an aspirational period that the provider cannot meet.
3. Save the policy. Saving does not alter a learner record.
4. Select **Preview next run**. Record the preview time and counts for inactive
   archive, archived deletion, annual action, and propagation evidence due.
5. Investigate unexpected counts before proceeding. If a hold or dispute applies,
   stop; this version has no legal-hold exception mechanism.
6. Re-check the public notice and contract when a period, provider, region, or
   annual action changes.

## Run the retention job

The current release provides an authorised, transactional job function and admin
control. Production scheduling is an environment operation, not silently
installed by this migration. Until a reviewed scheduler or service account is
configured, the privacy operations owner must preview and run every school at
least daily and after an approved policy change.

1. Confirm the preview belongs to the intended school.
2. Type `APPLY RETENTION POLICY` exactly.
3. The job performs the due annual action; otherwise it archives inactive
   learners. It then deletes learners whose archive period has expired.
4. Permanent deletion uses the verified data-rights transaction: direct and
   embedded evidence is removed, residual managed records must be zero, and a
   privacy-minimal deletion tombstone remains.
5. The job records its actor, policy snapshot, preview snapshot, completion time,
   and action counts in `retention_job_runs`.
6. The initiating admin browser clears cached progress, retry queues, assessment
   attempts, drafts, and saved reports for the returned deleted learner IDs. If
   browser storage is unavailable, the completion message reports a follow-up
   warning instead of falsely reporting that the database job failed.
7. Review the residual preview. If any due learner count remains, treat the job
   as failed and investigate before rerunning.

The job is atomic. A failed learner deletion rolls back the run instead of
recording partial success.

## Provider and backup propagation

Active-system deletion creates a propagation record containing only the
irreversible learner reference, school reference, deletion time, and target
dates. Passing a target date is not deletion evidence.

1. Run the retention job to move elapsed records to `evidence_required`.
2. Check the provider dashboard, backup inventory/report, support ticket, or
   approved signed checklist for both provider copies and backups.
3. Use **Record evidence** and enter a reference that an auditor can retrieve.
   Do not paste learner data, credentials, secrets, or provider exports.
4. Type `VERIFY PROVIDER AND BACKUP EXPIRY` exactly.
5. The product records the reference, actor, and verification time. It refuses
   verification before both target dates pass.

If provider evidence contradicts the configured period, do not verify the row.
Open a privacy incident or exception, correct the public/contractual statement,
and update the policy only after owner and legal review.

## Scheduling and alerting

A production scheduler should call the same reviewed job path once per school
daily, using a dedicated application-admin identity and retaining the immutable
run record. It must:

- fail closed if authentication, preview, or confirmation is unavailable;
- alert when no successful school run exists for 25 hours;
- alert on a failed transaction or non-zero residual preview;
- alert when `evidence_required` records remain unresolved past the operational
  escalation window; and
- never place learner data or raw subject identifiers in scheduler logs.

Scheduler identity, cadence, alert destination, and the first successful
production run are deployment facts. Record them before claiming automation.

## End-of-year checklist

At least 30 days before the configured year end:

1. confirm the school remains active and its instruction has not changed;
2. export records only where the school is entitled to and requests them;
3. resolve holds, disputes, transfers, and open data-rights cases;
4. preview the annual count and obtain the required operational approval;
5. execute once, then confirm `last_end_of_year_applied` advanced; and
6. review deletion propagation and recovery controls.

## Release evidence

`npm run check:retention-policy` verifies the bounded policy model, admin-only
RPC boundary, exact destructive confirmations, evidence-gated propagation,
reachable admin panel, public disclosure, this runbook, and migration structure.
The full release gate also runs lint, all unit tests, build, and reconstructable
migration checks. A code gate cannot verify provider regions, contracts, backup
settings, a production scheduler, or legal approval.
