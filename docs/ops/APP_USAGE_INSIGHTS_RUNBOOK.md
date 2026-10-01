# Admin app usage and improvement exports

**Authority:** implementation and operational contract for Admin → App usage.

**Audience:** application administrators reviewing product quality. This report is
not a child status report, placement, diagnosis or a claim about effort.

## Generate and use a report

1. Open **Admin → App usage** (`/admin/app/usage-insights`).
2. Select all schools or one school, the first calendar day and the last day.
   The browser timezone and exclusive UTC end boundary appear in the JSON.
3. Select **Generate report**. No partial totals are shown. A failed page,
   missing required source, count mismatch, expired snapshot or privacy deletion
   requires a fresh report. The source coverage section distinguishes an
   available source with no rows from an unavailable source.
4. Inspect feature use, question review signals and coverage. The screen shows
   at most 20 review items for readability; the JSON includes **every** captured
   raw row, normalized response, item metric and current manifest item.
5. Select **Download JSON for Codex** within the prepared snapshot's access
   window. The server rechecks validity, records `download_requested`, and
   removes the temporary server evidence before the browser creates the file.
   A download-request audit is not proof the operator received or read the file.
6. Supply the file to Codex only for the approved app-improvement review. It
   uses export-specific learner/class/school references, excludes direct names,
   credentials, contacts, device identifiers and staff notes, and remains
   sensitive learning evidence. Delete operator/transfer copies when the review
   is no longer needed, as required by the data-rights runbook.

The export contains no learner names or ranking. It includes raw projected
cloud evidence and interpretation limits so a reviewer can inspect support,
media failures, first responses, content versions, dates and denominators.

## Collection and interpretation

Current telemetry extends the existing durable `learn_activity` queue and
`student_log_activity_v2` RPC; it does not introduce a second event warehouse.
`collectionVersion: 2` marks new object payloads. Individual field coverage is
reported separately: a v2 event does not imply timing, opportunities or every
press was observed.

- Authenticated child navigation records areas entered and the areas actually
  available in that context. Preview mode does not send events. Focused teacher
  sessions expose only their assigned area as available.
- Skills trail, formal Skills assessment and Cycle Practice preserve their
  separate area/mode/level/phase/content-version cohorts. Formal assessment
  timing begins at image readiness or its last completed audio delivery;
  Cycle Practice timing begins after its pictures and instruction are ready.
  The response carries its recorded boundary; unrecorded timing stays `null`.
  Skills trail additionally retains actual instruction/target delivery states;
  missing required-target evidence is unscored, rather than a learning error.
  Optional narration still playing does not by itself establish failed media.
  Delivery states remain separate in item review cohorts.
- Area exits record wall elapsed time and its observation count. This includes
  inactive time and is not called active learning time. Missing exit events
  prevent complete duration reconstruction.
- Additional/ignored presses are interaction observations. They do **not**
  establish guessing, cheating, attention, motivation or learning ability.
  Interface locks continue preventing extra answers and premature advance.
  A dedicated `interactionReason` retains only the whitelisted interface-state
  enums (for example `answer_locked`, `images_pending`, `feedback_pending`).
  Arbitrary reason strings, staff reasons and notes are still omitted.
- Supported responses, retries, explicit invalid responses and unavailable
  required media never enter independent accuracy. Immutable answer receipts
  prevent an attempt plus its activity event from doubling the score.
- Review heuristics live in `USAGE_REVIEW_RULES` in
  `src/data/adminUsageInsights.js`. The response floor reuses Reporting Bible
  evidence sufficiency. The learner-count and low/high accuracy cutoffs are
  explicitly exploratory app-review heuristics, never progression or proficiency
  rules. Signals are evaluated within comparable recorded cohorts; an item may
  have different signals in different cohorts.
- Catalog membership proves an item exists, not that it was offered. A no-use
  label needs explicit area availability or an `items_offered` observation.
  Without that denominator, the result is **Opportunity not recorded**.
- `student_progress`, mastery, sync health and presence sources are mutable
  latest stored records. The date range selects records whose recorded update
  lies in the range; it cannot reconstruct overwritten historic state, prove
  active time, or turn a reset record into a play session. Cumulative sync
  counters are not interval counts. Raw versions and coverage remain available.
  Recognized progress shapes contribute descriptive content-use evidence:
  game plays and stored practice records/checkpoints, book page visits/reached
  pages/read counts, Story Quest routes, letter/word supported practice, and map
  cycles/stops/campaign missions. Counters stay separate from dated events and
  independent responses. Per-learner duplicate state metrics take the maximum,
  then aggregate across learners; raw rows remain intact. Unsupported progress
  areas are counted explicitly in `progressCoverage` and retained for review.
  The current book manifest names app reading levels separately from legacy
  instructional levels and retains text-review fingerprints and Lexile status.
- Older cloud rows may lack stable item IDs, timing, media/support fields or
  opportunity observations. Local-only data, pending device queues, anonymous
  preview use and deleted/unlinked legacy records are outside linked cloud
  capture. Missing historical telemetry cannot be recovered retroactively.

## Database boundary and snapshot lifecycle

Migration: `20261001103000_admin_usage_insights.sql`.

RPCs (all authenticated **application admins only**, rechecked on every call):

```text
admin_create_usage_snapshot(p_from timestamptz, p_to timestamptz, p_school_id uuid default null)
admin_read_usage_snapshot(p_snapshot_id uuid, p_after bigint default 0, p_limit integer default 500)
admin_release_usage_snapshot(p_snapshot_id uuid, p_download_requested boolean default false)
admin_purge_usage_snapshots()
```

The snapshot owner is also checked; another admin cannot read or release it.
All three new tables deny direct access to browser roles. Creation reads its
source UNION in one PostgreSQL statement, giving every captured source the
same statement snapshot. Subsequent pages read only the materialized rows,
with monotonically numbered pages and verified per-source/overall counts.
Later source writes or resets cannot alter a prepared report.

The declared source registry includes minimal current `learner_context` counts
(without names or credentials), then `learn_activity`, `answers`, immutable
`assessment_attempts`, `student_progress`, `mastery`, `item_mastery`,
`activity_sync_health`, plus optional Cycle Practice attempts, focus-session
membership, reading presence and non-secret student-session history. A missing
optional source is declared unavailable with a null count. A missing required
source fails creation. Add future learner usage sources to this registry and
its coverage tests rather than silently reading an extra source in the UI.

`admin_usage_snapshot_rows.student_id` has `ON DELETE CASCADE`. A before-delete
learner trigger invalidates every affected snapshot; the normal verified
learner deletion and school retention transaction therefore remove all cache
rows for that learner, and the prepared export cannot be downloaded. The
snapshot holds no independent learner facts absent from the source records;
the minimal audit holds actor, export reference, filters/counts/version/event,
never learner IDs, answers, names or evidence content.

Access expires after 30 minutes. Download, cancel/failure cleanup and panel
unmount release caches. Panel open, snapshot create and the purge RPC remove
expired/invalidated rows. **Expiry denies access; it is not proof of physical
purge at exactly 30 minutes.** An approved deployment scheduler should invoke
the purge path regularly with an application-admin identity if unattended
physical expiry is required. This migration installs no hosted scheduler.
Provider/backup propagation and deletion evidence still follow the current
school policy and retention/data-rights runbooks.

## Verification and deployment boundary

Focused executable SQL tests in `adminUsageInsightsSql.test.js` cover real
PostgreSQL execution through PGlite: anonymous/non-admin denial, private-table
ACLs, cross-admin denial, school/date isolation, more than 1,000 rows, immutable
source capture, projection, malformed input, expiry/purge, release audit and
learner deletion cascade/invalidation. Client tests cover complete paging,
gaps/count mismatches, missing opportunity/timing, support/media exclusion and
receipt deduplication. The browser fixture exercises the actual admin panel,
filters, download content, empty/errors/expiry and responsive presentation.

Run the `supabase-local` task profile and changed SQL tests before application.
Hosted readiness requires applying this exact migration to the authorized
environment and checking these RPC grants/denials there. A browser preview
with synthetic data, local SQL execution or passing source gates cannot prove
hosted authorization, migration state, provider expiry or physical-device use.
