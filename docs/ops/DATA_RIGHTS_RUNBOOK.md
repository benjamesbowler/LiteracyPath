# Learner data-rights runbook

**Owner:** privacy operations owner  
**Operational response target:** 30 calendar days from receipt, or sooner where
law, regulator guidance, or the executed contract requires  
**Scope:** access/export, correction, restriction, and deletion requests for a
school-managed learner

## Intake and identity verification

1. Record the received time, school, requester role, request type, safe contact,
   and requested scope without copying learner records into email or tickets.
2. Route through the school privacy contact unless law requires a direct
   response.
3. Verify identity and authority using one supported method:
   school-record match, parent/guardian verification by the school, or an
   authorised school official.
4. Never request a password, picture credential, class code, raw session token,
   or unnecessary identity document.
5. Record the verified method in the in-product workflow. The request receives a
   due date and a privacy-safe irreversible subject reference.

If identity, authority, scope, competing guardianship instructions, or legal
exceptions are unclear, pause disclosure/deletion and escalate to the school
privacy owner and counsel. Do not mark the request complete.

## Access export

Open Classes, select the learner, choose **Export or delete learner data**, record
the requester and verification method, and download the export. The package
contains the learner profile, learning evidence, progress, activity, assessment
attempts, individual report data, class-report references, intervention/group
context, teacher observations, and non-secret session history.

The export deliberately omits raw login tokens and device identifiers and does
not expose other learners’ group membership or full whole-class report payloads.
Inspect the file before secure delivery. Confirm the recipient and delivery
channel separately. Record delivery and completion in the case record.

## Correction and restriction

Confirm the exact field or processing purpose. Correct source records through
the authorised product path so reports can be regenerated consistently. Do not
rewrite immutable completed assessment evidence; add a clear correction record
or corrected administration as approved. For restriction, disable the affected
use while preserving only what law or a defensible claim requires. A correction
or restriction request remains tracked until every affected surface and export
has been verified.

## Permanent deletion

1. Export first when the requester is entitled to a copy or the school requires
   one.
2. Prepare the deletion in the same in-product panel. This creates the verified
   request but does not delete data.
3. Check the learner, request ID, due date, and irreversible subject reference.
4. Type the exact phrase `DELETE LEARNER DATA`.
5. The database transaction removes direct and embedded managed references,
   deletes the learner so relational rows cascade, checks every managed table
   for residual records, and commits only if the residual count is zero.
6. The browser clears local progress, retry queues, cached cloud rows, assessment
   archives, and saved reports before refreshing the roster.
7. Record the returned request ID and subject reference. The audit log keeps
   actor, event, time, status, and zero-residual result but no learner name, raw
   learner ID, answer, credential, token, or report content.

If the transaction, local cleanup, or verification fails, the workflow reports
failure and the request remains open. Do not manually claim completion.

## Provider and backup propagation

Active Supabase records are deleted by the transaction. The deletion-completed
event creates a privacy-minimal propagation record with provider and backup
target dates taken from the school policy. Until those dates pass, its status is
`awaiting_expiry`. A retention run changes it to `evidence_required` when both
dates have passed; it does not claim that any provider copy is gone.

Check the relevant provider dashboard, backup report, support response, or
approved signed checklist. In the admin school-retention panel, record the
evidence reference and type `VERIFY PROVIDER AND BACKUP EXPIRY`. Only that
explicit evidence step can set `expired_verified`. Never enter a learner name,
raw learner ID, answer, credential, token, or report content in the evidence
reference. A restored backup must replay data-rights tombstones before it can
serve users, as required by the recovery runbook.

Vercel request logs should not contain learner record payloads; provider log and
cache expiry still require confirmation. Any separately exported file must be
deleted from operator devices and secure transfer locations when no longer
needed.

## Completion evidence

A deletion case can close only when:

- the verified request and due date exist;
- the database returns `completed` and `residualManagedRecords: 0`;
- the learner is absent from the roster and cannot be exported again;
- answers, mastery, item mastery, progress, activity, sync health, sessions,
  assessment attempts, reports, interventions, group reviews, and observations
  no longer reference the learner;
- a `deletion_completed` tombstone exists for the request;
- local browser stores and pending queues are cleared;
- backup/provider expiry is recorded; and
- the requester receives an accurate completion notice through the approved
  channel.

## Release exercise

The `check:learner-data-rights` gate creates a temporary seeded learner under
the audit teacher, adds representative evidence and an individual report,
downloads
and inspects the in-product export, performs the verified deletion, proves the
learner and evidence disappear from the UI and database, and confirms the
privacy-safe tombstone. The gate recreates its dedicated test learner on each
run and never deletes a normal audit-school learner. Never run this destructive
exercise against production.
