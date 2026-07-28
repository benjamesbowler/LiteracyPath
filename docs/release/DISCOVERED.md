# DISCOVERED — new findings (join the loop per TEN_OUT_OF_TEN_PLAN §0.7)

Format: ID · severity · area(s) · evidence · fix spec · gate. Found 2026-07-23 from live exports (student "Aaron") and the live assessment runner (literacy.guide).

---

## D-001 · P0 · Area 7/8 — Two exports about the same child flatly contradict each other
**Evidence:** EL workbook `elassessmentstudent aaron….xlsx` (generated 2026-07-23 19:06): "Assessments With Saved Evidence 0/6", "Letter Names & Sounds: Not assessed ×26, 0 attempts", "No EL assessment records". The whole-child CSV (same day) shows 52 letter name/sound judgments from Skills Check 2026-06-12 and a full initial-sounds Skills Check 2026-07-10.
**Cause to investigate:** the EL workbook reads only the EL saved-evidence store (`elAssessmentReportStore` / saved attempts), while whole-child reads item-mastery/letter-matrix stores. Two pipelines, two truths. Possibly compounded by D-006 (teacher cannot reach Finish → evidence never saved as EL attempts).
**Fix:** one evidence-read path for both exports (skill-spine); a formal export must state which stores it read and when they last synced.
**Gate:** integration test: after a seeded Skills Check, BOTH exports show the same letter evidence; a contradiction between exports fails CI.

## D-002 · P0 · Area 7 — Formal export shipped with zero evidence and unresolved identity
**Evidence:** filename literally contains `gradenotrecordedwindownotrecorded`; Student Summary says "Grade not recorded · Window not recorded"; 8 sheets of "Not assessed"/zero-count filler rows (26 letters, 28 patterns, 4 domains) that read as data at a glance.
**Fix:** exporting with 0/6 evidence requires an explicit interstitial ("Nothing to report for Aaron — no saved EL evidence. Run or save an assessment first. Export anyway?"); an exported empty report leads with ONE prominent no-evidence banner and omits filler rows; grade/window must resolve or be asked for before export, never defaulted to "not recorded".
**Gate:** unit test on export entry (0 evidence ⇒ warn path); snapshot test: empty export contains banner and no zero-filled rows; filename never contains "not recorded".

## D-003 · P1 · Area 7/4 — Snapshot timestamps presented as per-skill "Latest evidence"
**Evidence:** all 29 Sound Seekers rows in the CSV share the identical millisecond `2026-07-21T01:23:42.811Z` (a generation time, not evidence time); each letter's name+sound rows share one stamp; 52 "direct evidence" judgments span 46 seconds; formats mix `+00:00` and `Z`; raw UTC shown to a UTC+8 user.
**Fix:** store and export true per-item evidence timestamps; label the column honestly ("Snapshot taken" vs "Last evidence"); one ISO format; render local time with timezone in teacher-facing outputs (A7.9).
**Gate:** export test asserts distinct evidence timestamps for distinct attempts and a single timestamp format + timezone label.

## D-004 · P1 · Area 7/4/1 — Whole-child CSV: contradictions, no evidence basis, silent coverage holes
**Evidence:** "C: letter sound — Needs teaching" (Jun 12) vs "Sound for c — Developing" (Jul 21) unreconciled (same for S/D/E/F/K/L/N; "Initial sound /j/ Secure" vs "Sound for j Needs teaching"); no attempts/accuracy/denominator anywhere; boilerplate interpretation incl. ambiguous "developing performance OR practice-only success"; 6-week-old rows labeled "Current"; Phonics section missing k and z with no "Not seen" rows; PA has only 2 final-sound rows; PA is letter-keyed (separate Secure rows for /c/ and /k/ — same phoneme; "Initial sound /q/" — qu = /kw/, not one phoneme); "whole child" = only 3 areas; "Needs teaching" is a 4th wording of the third status.
**Fix:** reconcile same-construct rows via the skill spine with an explicit triangulation note; every status row carries attempts/window (A7.4, A4.1); enumerate not-assessed items as "Not seen"; key PA by phoneme (merge c/k; drop or re-frame /q/); rename report or include all areas with "No data yet" sections; adopt the ONE status vocabulary (A4.2).
**Gate:** export tests: no two rows for the same spine skill with conflicting statuses and no reconciliation note; every status row has evidence fields; PA keys are phonemes.

## D-005 · P1 · Area 4/6 — Assessment runner: teacher directive is missing or too small
**Evidence (screenshots 2026-07-23):** PA item shows tiny lowercase strand tag "rhyme" and words "moon / spoon" but never tells the teacher the exact question to ask; Encoding shows "SAY EXACTLY: cup. Fill the cup. cup." with no directive about what the student should do.
**Fix spec:** every item card gets a two-line instruction block ABOVE the stimulus, ≥16–18px:
1) **Task heading** (replaces the tiny tag): e.g. "Rhyme — yes or no?", "Dictated spelling".
2) **Teacher directive**, imperative, exact: PA-rhyme → "Say aloud: 'Do *moon* and *spoon* rhyme?' Say the words — never show this screen." · Encoding → "Dictate aloud — word, sentence, word. The student writes only the word **cup** on their paper." (Per-strand directive templates for all PA strands, decoding, and fluency; keep SAY EXACTLY styling for the script itself.)
**Gate:** DOM test: every item type renders heading + directive ≥16px; copy reviewed against the administration guide; no bare strand tags.

## D-006 · P0 · Area 4/3/6 — Bottom of the assessment page can be unreachable: "Finish assessment" and the FINAL STEP clip off-screen
**Evidence:** on a laptop viewport the page cannot scroll to the footer; screenshot of item 8/8 shows "FINAL STEP — Choose where to start next / SUGGESTED STARTING POINT: Middle Pre" cut off mid-word. Likely cause in `el-benchmark-assessment.css`: shell `min-height: 100vh/100dvh` (lines ~21–22) with `overflow: hidden` containers (~149, ~1501) and a `position: fixed` element (~2207) — content taller than the viewport gets clipped instead of scrolling.
**Why P0:** the teacher cannot finish or confirm placement ⇒ attempts stay drafts ⇒ no saved EL evidence ⇒ plausibly the direct cause of D-001/D-002's empty export.
**Fix:** the shell scrolls (`min-height` not fixed height; remove clipping overflow on the page container); action bar (progress · Save & exit · Finish) becomes sticky and always visible; FINAL STEP must be reachable at 1280×720, 1366×768, iPad both orientations.
**Gate:** device-matrix E2E (A3.6): at each breakpoint, "Finish assessment" and the placement confirmation are visible/clickable and an 8-item run can be completed end-to-end; regression screenshot diff.

## D-007 · P1 · Area 6 — "Kindergarten BOY: Middle Pre baseline" jargon on the item card — and "BOY" reads as gendered
**Evidence:** catalog `rangeLabel: "Kindergarten BOY: Middle Pre baseline"` (`elBenchmarkAssessmentCatalog.js:236,254,272`) renders raw next to a child's name. The page already maps BOY→"Beginning of year" (`ELBenchmarkAssessmentPage.jsx:143`) but `rangeLabel` bypasses it. Next to "Aaron", "Kindergarten BOY" is easily read as the child's gender.
**Fix:** never render raw rangeLabels; compose display copy from mapped parts: "Beginning of year · starting band: Middle Pre". Audit all catalog labels for teacher-facing leakage (with A6.8's language pass).
**Gate:** grep-guard: `BOY:|MOY:|EOY:` never appears in rendered DOM; copy test on the item header.

## D-008 · P2 · Area 9 — URL hash desynced from the actual surface
**Evidence:** while running the Encoding assessment, the address bar reads `literacy.guide/#student-report=other-learning` — a stale hash from a previous surface. Refresh/deep-link would restore the wrong screen (evidence for A9.7's router work; a refresh mid-assessment must resume the assessment, not a report page).
**Fix:** fold into A9.7: assessment routes get real, current URLs; refresh restores the in-progress session.
**Gate:** E2E: refresh mid-item resumes the same item; the hash/URL names the assessment surface.

## D-009 · P2 · Area 4 — One-tap auto-advance records evidence with no confirm at the end of the route
**Evidence:** "Choose one answer above — it saves and moves on." A single mis-tap records a judgment; mitigated by "Change previous answer", but the last item flows straight into FINAL STEP.
**Fix:** keep fast flow, but ensure "Change previous answer" remains available from the FINAL STEP, and Finish requires one deliberate confirmation showing the tally (n scored, n skipped) before archiving.
**Gate:** E2E: mis-tap on item 8 → change from final step → finish shows tally confirm.

## D-010 · P0 · Area 8/10 — Fresh database bootstrap is not reconstructable from managed migrations
**Evidence:** before this finding, the first managed migration was `20260528000000_create_app_admins.sql`, while later migrations altered or referenced `classes`, `students`, `answers`, `mastery`, and `item_mastery`; no managed migration created those five load-bearing tables. A clean local/CI Supabase instance therefore could not apply the repository's migration history without undocumented dashboard state.
**Fix:** add the missing first migration with the production-used columns, ownership constraints, grants, indexes, RLS policies, and update triggers; add an idempotent reconciliation migration for installations whose tables predate the managed history.
**Gate:** `check:database-bootstrap-schema` must prove every core table is created before first reference and that the first migration contains the ownership controls; a fresh local Supabase reset must apply every migration successfully before this finding can close.

## D-011 · P2 · Area 9 — Rapid reachable-route changes raise an unhandled View Transition rejection
**Evidence:** the first route-level teacher Playwright run completed the dashboard-to-report journey but captured `pageerror: Transition was skipped`. `setAppView` started browser View Transitions without observing the `finished` promise, so the expected abort from an overlapping transition became an unhandled rejection.
**Fix:** explicitly consume expected `AbortError` rejections, report unexpected transition failures, and fall back to the immediate React state change if the browser cannot start a transition.
**Gate:** the reachable teacher dashboard/report Playwright journey completes with zero `pageerror` events.

## D-012 · P1 · Area 10 — Smoke tests targeted deleted root preview URLs and exercised the wrong app
**Evidence:** the first canonical release manifest recorded four desktop/mobile smoke failures. Both specs requested `/guided-reading-preview.html` or `/student-home-preview.html`, but the maintained preview entry points live under `/preview/`. Vite therefore served the main application fallback; with the canonical Supabase environment enabled, the tests saw the teacher/student gateway rather than either preview.
**Fix:** target the maintained `/preview/` entry points, assert the expected preview surface before behavior checks, and add a Guided Reading keyboard/page-lifecycle journey so the hook correction is behavior-protected.
**Gate:** `test:smoke` passes on desktop and mobile while the canonical Supabase environment is present; a wrong fallback route cannot satisfy the preview assertions.

## D-013 · P0 · Area 4/7 — Selecting a learner collapsed complete cloud history to the 400-row browser cache
**Evidence:** after cloud hydration, the signed-in Aarav Skills Check route initially showed 174 attempts for the newest skill. Selecting Aarav then called `loadAssessmentAttempts()` and replaced live state with the bounded local cache, leaving only 133 attempts for that skill and making a complete formal export impossible.
**Fix:** hydrate the selected learner from cloud storage, build mastery from that complete result, and merge it into live report state; the bounded browser cache remains a resilience layer, never the formal-report source of truth.
**Gate:** the reachable teacher route shows the 174-attempt high-volume skill and exports all 520 seeded attempts plus 520 unique question records.

## D-014 · P0 · Area 7/10 — The 520-item audit fixture contained attempt summaries but no production-readable item records
**Evidence:** the fixture stored per-question rows under payload key `items`, while `normalizeAssessmentAttempt` consumes `questionRecords`. The first reachable download therefore had 520 attempt rows but zero question-evidence rows and zero seeded item summaries.
**Fix:** seed 520 uniquely keyed `questionRecords`, assert their count inside the SQL transaction, and make the static seed contract check require the production key and item identity.
**Gate:** the SQL seed aborts unless both long-history attempts and question records equal 520; the signed-in download proves 520 unique `audit-item-*` question IDs.

## D-015 · P1 · Area 6/7 — Report choices could open before complete learner evidence finished loading
**Evidence:** under the bounded release run, the Skills Check action repeatedly detached while the selected learner's complete cloud history was still hydrating. The UI presented report actions as ready even though their evidence source was changing, and the 520-item journey timed out waiting for a stable action.
**Fix:** track selected-learner evidence readiness, announce the loading state, and keep every learner report action disabled until the complete history, mastery, and progress record finishes loading.
**Gate:** unit rendering proves the loading state disables report choices; the authenticated route waits for the action to become enabled and then proves the complete 520-item export. The 10-gate bounded release manifest passes.

## D-016 · P0 · Area 4/6/7/10 — Audit-school EL records used non-production identifiers and the readers hid fallback identities
**Evidence:** the first reachable A4.9/A7.1 route test rendered “No completed benchmark routes” for seeded BOY/MOY evidence. The audit fixture used invented IDs such as `el_benchmark_encoding` and a generic `assessment_type = el_benchmark`, while production attempts use the canonical `el_encoding` ID. Separately, the shared resolver/export filters returned after the first nonmatching identity candidate and never inspected a valid fallback skill ID. The seeded saved report also claimed to be a PDF with a non-production `formal_class` type even though durable saved reports are Excel workbooks using `whole_class`.
**Fix:** make the deterministic audit school use the same canonical IDs, report types, filename format, scope, and summary payload as the production writers. Benchmark identity resolution must still inspect every identity candidate until it finds a supported formal benchmark ID so legacy category records remain readable.
**Gate:** the static/apply seed checks require production-shaped EL rows; a unit test proves a legacy generic-category record resolves to Grade 1 · BOY and enters the class export; both authenticated teacher route gates must show an enabled scope picker and complete the PDF/Excel/save/delete journey.

## D-017 · P0 · Area 9/10 — The enforced bundle ratchet has regressed red
**Evidence:** `npm run check:bundle-size` at exact commit `914cd9581e4c97d601fe8a86f958087637171ca7` reports 10 violations. `mediaQaReviewStatus` is 1,209,921 raw bytes against 599,601; the main `index` is 1,206,441/250,910 raw/gzip against 1,148,786/240,874; `childAssets`, `secondBlockSkillTopUpQuestions.generated`, and `QuestHub` also exceed one or both frozen ratchets. The intentionally over-complete A4.7 evidence run therefore passed 7/8 and was rejected as release evidence; the relevant 7/7 A4.7 run remains exact and green.
**Fix:** inspect the bundle graph and remove the static reachability that pulls media-QA data and route/data modules into oversized shared or entry chunks; split by live route/skill, eliminate duplicate/static import paths, and meet the existing dated ratchets. Do not raise, waive, or rebaseline the limits to obtain green.
**Gate:** `npm run check:bundle-size` passes every current raw and gzip ratchet, the main entry resumes its dated downward schedule toward 500 kB raw/150 kB gzip, the build reports zero ineffective dynamic imports where this work changes split points, and the full `npm run check:release` manifest is green.

## D-018 · P1 · Area 3/10 — A new child explanation made the map stop-reason unreadable
**Evidence:** the full release accessibility sweep found white text on a white tooltip for `.sbq-stop-reason` at both desktop and mobile breakpoints. The base map theme uses a dark tooltip, while the student comic theme changes that surface to white without changing the inherited reason colour.
**Fix:** give the stop-reason an explicit theme-safe ink colour and retain the explanation on the reachable Adventure Map rather than hiding it.
**Gate:** the permanent Adventure Map cases in `check:a11y-routes` pass desktop and mobile contrast analysis, with the explanation still visible in the DOM.

## D-019 · P0 · Area 1/4/10 — Reviewed release audio was rejected by the runtime registry
**Evidence:** `check:assessment-runtime-variation` reported 35 priority-skill failures because final-sound, short-vowel, and high-frequency-word recordings explicitly approved in the release wiring were absent from `assessmentMediaRegistry`. The picker therefore described reviewed release audio as blocked even though the runtime manifests selected it.
**Fix:** build registry records from the reviewed assessment and HFW release-wiring manifests as well as the generic preference map. Preserve QA/deprecated exclusions and do not globally approve the separate unreviewed K3 vocabulary inventory.
**Gate:** picker unit tests prove representative final-sound, short-vowel, and HFW release recordings are approved; `check:assessment-runtime-variation -- --check` reports zero failures for all priority skills; `check:assessment-media-evidence` remains green.

## D-020 · P0 · Area 8/10 — The dependency audit has regressed to nine high advisories
**Evidence:** the canonical full release run at exact commit `0b2262f8ce7ee7e07e8b536ba930c6a11a3877a7` failed `dependency-audit` with nine high-severity findings in the ExcelJS → archiver/glob/minimatch chain. The prior A8.5 zero-advisory evidence no longer describes the installed tree.
**Fix:** update or replace the affected export dependency path using maintained, attributable packages; keep workbook semantics, CSP-safe lazy loading, large-export memory ceilings, and the current bundle ratchets. Do not waive high/critical advisories or substitute an untrusted ExcelJS fork.
**Gate:** the canonical online dependency audit reports zero high/critical advisories and all export compatibility, CSP, 500-item memory, build, and bundle gates pass against the same committed tree.

## D-021 · P1 · Area 2/3/10 — Protected student visuals no longer represented the reviewed explanation work
**Evidence:** after A4.4 added child-readable “Why this one?” explanations, 18 protected comparisons failed across emphasis, key-route, and device-matrix suites. Review found the Phonics and Arcade shifts intentional, but also exposed a real Guided Reading defect: its explanation touched the clipped card edge at desktop and phone widths.
**Fix:** give the Guided Reading explanation contained padding and sizing, review every affected desktop/phone/device image individually, then refresh only the resulting accepted baselines.
**Gate:** `check:student-emphasis-budget`, `check:key-route-visuals`, and `check:device-matrix` all pass from a clean run; their DOM, overflow, tap-target, keyboard, and fullscreen assertions remain unchanged.

## D-022 · P0 · Area 8/9/10 — Three release-required gates are declared but not implemented
**Evidence:** the full release manifest reports `e2e-teacher`, `csp`, and `sync-chaos` as not implemented. The plan requires all three inside the single release truth, so an otherwise green manifest could not prove authenticated teacher journeys, enforced browser policy, or durable multi-device/offline reconciliation.
**Fix:** implement the named scripts as real reachable-product suites, add them to `package.json` and the canonical release runner, and make CI execute them with the audit school and test database.
**Gate:** `check:e2e-teacher`, `check:csp`, and `check:sync-chaos` each pass independently and as implemented entries in `check:release`.

## D-023 · P0 · Area 10 — A workstation restart strands authenticated release verification
**Evidence:** after the power cut, no `LP_AUDIT_*` variables or teacher password were available in the shell or project environment. Roughly thirty teacher, live-database, export, accessibility, and device gates consequently failed before reaching the product, despite the same journeys having prior evidence.
**Fix:** provide a documented, non-plaintext credential-hydration/preflight path for local release work and CI. The release runner must fail once, before the gate fan-out, with an exact remediation message when required audit credentials are unavailable; secrets must never enter tracked files or logs.
**Gate:** a credential-preflight test rejects missing/partial configuration without starting dependent gates, and a hydrated run executes every authenticated gate against the audit school.

## D-024 · P1 · Area 8/10 — The first data-rights draft could lose its audit tombstone and had no reachable-product gate
**Evidence:** the paused A8.8 draft attached cascading teacher/class foreign keys to `data_rights_requests`, so deleting the owning account or class could erase the request and every dependent audit event. It also had no package script, canonical release entry, authenticated browser journey, or in-product view of earlier requests; static source matching could therefore have been mistaken for a completed rights workflow.
**Fix:** retain opaque teacher/class/actor identifiers without cascading ownership foreign keys; expose privacy-minimal request/event history; lock non-relational evidence tables during deletion; revoke RPC execution from `PUBLIC`/`anon`; implement shared teacher/admin UI, exact-confirmation deletion, local cleanup, a permanent runbook, focused contract tests, and a destructive non-production E2E that proves export → deletion → zero residual records → failed re-export → surviving tombstone.
**Gate:** `check:learner-data-rights` must pass both authenticated journeys against a freshly hydrated audit database. Static verifier, seven unit tests, zero-warning lint, all 1,235 unit tests, build, and migration-order checks pass at `da2c763b`; the live gate remains open because the power-cut restart left no injected audit credentials.

## D-025 · P0 · Area 8/10 — The first retention draft could self-certify backup deletion and fast-forward deadlines
**Evidence:** the initial A8.9 job changed a propagation record straight from `awaiting_expiry` to `expired_verified` when its target dates elapsed, without checking any provider or backup evidence. Its exposed database functions also accepted a caller-supplied current time, so an authorised RPC caller could fast-forward inactivity, archive, annual, and propagation deadlines. Backend deletion did not tell the initiating browser which learner caches to clear.
**Fix:** make the database clock authoritative; elapsed records become `evidence_required`, never verified; require a retrievable evidence reference plus exact `VERIFY PROVIDER AND BACKUP EXPIRY` confirmation after both dates; keep an immutable job snapshot; return only the deleted learner IDs needed for the authorised admin browser to clear local progress, queues, attempts, drafts, and reports; and report local cleanup failure as follow-up without falsely claiming the already-committed database job failed.
**Gate:** `check:retention-policy` must prove no exposed retention function accepts `p_now`, the job cannot write `expired_verified`, evidence and exact confirmation are mandatory, the admin panel is reachable, local cleanup is wired, and the public disclosure/runbook state that elapsed time is not proof. Zero-warning lint, all unit tests, production build, legal-pack sync, and reconstructable migration order must remain green.

## D-026 · P0 · Area 8/10 — Legacy security-definer RPCs retained inherited PUBLIC execution and anonymous school writes
**Evidence:** the A8.1 audit found that several early migrations revoked obsolete child-enumeration functions from the named `anon` role without revoking PostgreSQL's default `PUBLIC` execute privilege. Because `anon` inherits `PUBLIC`, comments claiming that school → class → learner enumeration was closed did not prove it was unreachable. The pre-signup browser also called an anonymous `SECURITY DEFINER` school upsert and listed the school directory, while authenticated users retained direct `INSERT` permission on `schools`, bypassing RPC validation.
**Fix:** drop all eight obsolete child-login overloads; revoke `PUBLIC`, `anon`, and `authenticated` execution from every current public-schema `SECURITY DEFINER` function in one fail-closed migration; re-grant only eight anonymous learner/error signatures and 36 reviewed authenticated signatures; make the live catalogue fail on any drift, unsafe search path, or inherited `PUBLIC` execution; move school creation into the bounded trusted auth trigger; restrict the school directory and upsert to authenticated callers; and revoke direct school writes.
**Gate:** `check:db-policies` first proves the source allow-list and regression tests, then interrogates a real non-production PostgreSQL catalogue and exercises anonymous, learner-token, Teacher A, Teacher B, and administrator paths. It must prove RLS on every public table, only `app_config` anonymous table reads, no anonymous direct writes, tenant-isolated reads/deletes, owned deletes, expired and rotated codes, token scope, admin-only paths, pseudonymous leaderboards, and denial probes for every authenticated-only security-definer RPC. Commit `6ccce76f`; `docs/release/artifacts/2026-07-25T04-40-33-074Z/manifest.partial.json` passes zero-warning lint, all 1,250 unit tests, production build, reconstructable migration order, and the deterministic audit seed. The live catalogue/actor execution remains pending injected audit credentials, so A8.1 is not marked DONE.

## D-027 · P1 · Area 9/10 — Teacher URLs were write-only and reports discarded class/learner context
**Evidence:** the app emitted five teacher intention hashes but never parsed them during profile restoration or browser history changes. Refreshing or opening a teacher deep link therefore restored whichever local profile state happened to exist. Opening a report replaced the teacher route with the legacy `#student-report=…` fragment, losing the class and learner identity needed for a safe reload, while teacher navigation used history replacement so Back could not retrace real product moves.
**Fix:** define canonical teacher intention and class/learner/report routes; parse teacher routes from a lazy teacher-only runtime; resolve every requested class and learner through the signed-in teacher's RLS-filtered queries before exposing the destination; reject stale or foreign identifiers to the safe Progress surface; preserve report identity across tabs; and use real history entries for intentional navigation. Keep assessment resume on its existing session/item route and do not restore cached report evidence before route ownership validation completes.
**Gate:** `check:teacher-routing` combines route round-trip and stale-route unit contracts with an authenticated browser journey that deep-links to Aarav's Skills Check report, verifies report provenance, reloads successfully, changes report, and restores the prior report with browser Back. The Teacher B journey uses the same Teacher A report URL and must see neither the learner nor the report. The unchanged bundle ratchet must pass with the teacher router outside the student first-load chunk.

## D-028 · P1 · Area 4/8/9/10 — Backend responses crossed scattered untyped SDK call sites
**Evidence:** 135 application operations called Supabase's `from` or `rpc` interface across UI components, stores, and utilities. Although database permissions still applied, successful response envelopes were trusted without one runtime contract, malformed nested learner identities or versioned evidence could reach product logic, and a new table or RPC could be added without an explicit domain owner.
**Fix:** make the raw Supabase client private; expose only a boundary `table`/`call` API; register every table and RPC under auth, classes, evidence, reports, or content; validate successful response envelopes, common identifiers, learner roster/login identities, and stored schema versions; lazy-load validators so student first paint is unaffected; and reject direct SDK access, unknown resources, and registry/facade drift.
**Gate:** `check:domain-boundaries` must find zero direct application `from`/`rpc` calls, prove all 16 tables and 36 RPCs are registered in matching facade/domain allow-lists, reject malformed class, login, auth, and versioned evidence fixtures, pass backend errors through unchanged, and keep the raw client unexported. Commit `804d0c72`; `docs/release/artifacts/2026-07-25T05-33-26-496Z/manifest.partial.json` passes zero-warning lint, all 1,260 tests, production build, 12 browser smoke journeys, the focused boundary gate, and bundle budgets.

## D-029 · P1 · Area 4/9/10 — The application controller regressed to 9,716 lines without a ratchet
**Evidence:** `App.jsx` had accumulated authentication/session restoration, assessment normalization and validation, export loading, route-module loading, access guards, and final student/teacher rendering in one 9,716-line controller. No release gate capped that file or required explicit ownership boundaries. The first renderer extraction also exposed a real component-envelope mismatch (`AppSurface(surface)` instead of `AppSurface({ surface })`) that left the public gateway blank; the desktop/mobile smoke journey caught it before evidence was recorded.
**Fix:** move pure assessment runtime policy, lazy runtime services, lazy surface definitions, and final guarded route rendering into four owned modules; lazy-load the final surface so it becomes a separate production chunk; keep the public gateway available while stored authentication restores; and add an incremental controller-size ratchet. Milestone 1 reduces `App.jsx` to 6,937 lines. Milestone 2 moves session restoration, teacher account/admin, class/learner loading, learner settings, and destructive reset orchestration into a fifth controller boundary and reduces `App.jsx` to 4,582 lines. Milestone 3 moves assessment-path decisions, repeat/coverage selection, answer persistence, mastery updates, teaching feedback, and audio support behind a direct-import assessment controller and reduces `App.jsx` to 2,311 lines.
**Gate:** `check:app-decomposition` fails above the final 3,000-line maximum or when any of six required boundaries disappears. Commits `a681bd56`, `2ca3bc53`, and `ef996120`; final exact manifest `docs/release/artifacts/2026-07-25T06-40-43-443Z/manifest.partial.json` passes the ratchet, zero-warning lint, all 1,262 unit tests, production build, all 12 desktop/mobile smoke journeys, and every unchanged bundle budget.

## D-030 · P1 · Area 9/10 — Final module reshuffling exposed a one-byte child-assets budget failure
**Evidence:** after the final assessment-controller extraction, the enforced bundle check reported `childAssets` at 58,064 compressed bytes against the frozen 58,063-byte ceiling. The raw chunk remained below budget, but the minifier's changed shared-module ordering was enough to reveal that the chunk had no meaningful compression headroom.
**Fix:** remove the redundant `Set(Object.keys(...))` allocation from the blocked-assessment-image QA lookup and use the equivalent own-property check directly. This preserves the exact blocked-image behavior while reducing both runtime work and emitted bytes; no budget, waiver, or baseline changed.
**Gate:** `check:bundle-size` reports `childAssets` at 772.53 kB raw / 58.05 kB gzip with both limits green. Commit `ef996120`; `docs/release/artifacts/2026-07-25T06-40-43-443Z/manifest.partial.json` passes all six A9.5 evidence gates against the exact commit.

## D-031 · P1 · Area 9/10 — The formal benchmark engine was still in every first download
**Evidence:** after A9.5, the main entry remained 581.50 kB raw / 158.48 kB gzip—above the plan's final 500/150 target. Analysed production output showed that teacher-only EL benchmark catalog, session, and scoring modules were synchronously reachable from `App.jsx`, contributing more than 200 kB of rendered module source before a teacher opened a formal benchmark.
**Fix:** put benchmark session creation and attempt construction behind one retryable dynamic runtime boundary; show an honest preparing state and prevent duplicate starts while the chunk loads; preserve the existing draft, scoring, archival, and recovery implementations without cloning or weakening them. Activate the final main-entry ratchet immediately and keep every later schedule step at or below it.
**Gate:** `check:bundle-size` enforces 500,000 raw / 150,000 gzip bytes and reports the entry at 452.79 kB / 120.39 kB. `check:split-boundaries` traverses the production chunk graph and fails if the benchmark engine, catalog, session, or scorer becomes statically reachable from the entry. Commit `62934d5f`; `docs/release/artifacts/2026-07-25T06-52-35-427Z/manifest.partial.json` passes zero-warning lint, all 1,263 unit tests, production build, 12 browser smoke journeys, the final bundle ratchet, and the analysed split guard.

## D-032 · P1 · Area 9/10 — Audit-sized question banks and optional engines were delivered as monolithic runtime chunks
**Evidence:** A9.2 bundle analysis found five generated banks containing 3,654 questions in multi-megabyte source barrels, guided-reading and child-media catalogues grouped into oversized chunks, the Quest pixel route carrying a full unsplit Phaser runtime, and a 776 kB audio manifest loaded merely to resolve one spoken choice. The first production network proof also exposed the formal assessment hub's catalog/session imports on both public shells even though no assessment had been opened.
**Fix:** generate 53 deterministic per-skill/level question shards while retaining byte-equivalent complete audit barrels; make the runtime loader request only the selected skill's shards; replace the full audio-manifest lookup with the same SHA-1 naming contract plus the 120 physically present choice keys; split guided-reading, child-media, Phaser, and Quest ownership into bounded chunks; and move the formal assessment hub behind its own retryable lazy surface. No question, order, normalized candidate, bundle ceiling, or approval baseline changed.
**Gate:** `check:split-boundaries` analyses the production graph, requires all 52 browser-reachable runtime shards to be dynamic, rejects audit-barrel leaks, and fails any route/data chunk above 700,000 bytes. `check:first-load-network` serves the production build to fresh browsers and records zero deferred bank, guided-reading, benchmark-content, export, 3D, or game-engine requests on both student and teacher shells. Commit `599949a2`; `docs/release/artifacts/2026-07-25T07-30-01-030Z/manifest.partial.json` passes 7/7 with zero-warning lint, all 1,264 unit tests, build, 12 smoke journeys, bundle budgets, analysed splits, and both first-load network logs.

## D-033 · P1 · Area 9/10 — Fleet errors could be counted but not privately symbolicated or judged against an honest budget
**Evidence:** the remote monitor retained release-tagged generated frames, but production builds emitted no private source maps, recent-event rows hid the retained frame, and the release summary did not count fatal events. “No alerts” therefore lacked a documented budget decision, while an empty monitor could be mistaken for health despite having no seeded end-to-end telemetry. No session denominator exists, so deriving an uptime percentage from sampled global errors would be false.
**Fix:** define a strict per-release rolling 24-hour operational budget of zero fatal or repeat-fingerprint alert events; show fatal totals, budget state, and the first privacy-sanitized generated frame in the admin monitor; label no telemetry as unverified; retain the explicit distinction between an incident budget and availability; generate hidden production maps only into a restricted CI artifact retained for the same 30 days as events; add a local exact-frame symbolication command; and fail if a normal deployment contains any map or map reference.
**Gate:** `check:private-source-maps` builds 256 private maps, proves zero source-bearing page chunks are unmapped, confirms no public map reference, and resolves `assets/index-DDkmnal-.js:2:389760` to `src/utils/errorLog.js:4:1`. `check:public-source-maps` proves the deployable build has 259 scripts and zero maps/references. Commit `58bb6eeb`; `docs/release/artifacts/2026-07-25T07-53-41-223Z/manifest.partial.json` passes 9/9 with zero-warning lint, all 1,268 unit tests, production build, 12 smoke journeys, database reconstruction, bundle budgets, and split boundaries. The implemented deliberate error → release-tagged retained event → authenticated dashboard journey remains pending injected audit credentials, so A9.9 and D-033 stay IN-PROGRESS.

## D-034 · P0 · Area 3/8/9/10 — The private database boundary guard missed aliased callers
**Evidence:** the first A10.8/A10.10 readiness run reached all 48 route/state accessibility cases, but ten teacher cases failed with `Direct Supabase rpc access is private; use the domain boundary.` The A9.8 source guard only matched the exact receiver name `supabase`, so class-access, student-login, learner-data-rights, retention, admin-monitoring, and remote-error services using the receiver name `client` retained direct `.rpc()` calls despite the earlier green architecture gate.
**Fix:** migrate every remaining application RPC caller to the registered, response-validated `.call()` boundary; update focused contracts; replace the receiver-name-specific source check with an alias-independent direct `.rpc()`/`.from()` detector; and add self-test fixtures proving that `client.rpc`, `serviceClient.from`, and `supabase.rpc` are rejected while `Array.from` is not misclassified.
**Gate:** `check:domain-boundaries` reports all 16 tables and 36 RPCs registered with zero direct application query access; the focused service/boundary contracts pass; and `check:external-program-readiness` completes all 48 desktop/mobile route and key-state cases plus the research-pack contract without page errors. Commit `ffce41e3`; `docs/release/artifacts/2026-07-25T08-12-21-575Z/manifest.partial.json` passes 6/6 with zero-warning lint, all 1,268 unit tests, production build, runtime boundary contracts, unchanged bundle budgets, and external-program readiness.

## D-035 · P0 · Area 1/4/10 — Release-ready skills exposed questions outside their approved sets
**Evidence:** the first exact A10.9 board compared the strict audit with the real child loader and found multiple READY skills exposing more questions than the canonical audit approved: Final Sounds exposed 549 versus 366 approved, Rhyming 813 versus 666, and CVC Short Vowels 500 versus 412. The loader enforced the exact audited ID set only for Initial Sounds; every other passing skill returned its entire runtime candidate pool. It also revealed the opposite mismatch for three skills: the live bank could not reconstruct 100 Short Vowel, 124 Noun, and 130 Verb questions the strict audit had approved.
**Fix:** generate a lazy exact question-and-level exposure set for every release-ready skill; make every student bank filter to that set and fail closed on version/count/missing-ID drift; add live runtime selectability as a fifth canonical release dimension; block the three mismatched skills until their loaders can reconstruct every approved question; and generate the admin/Loop D board from the same final decisions and exposure fingerprints.
**Gate:** `check:curriculum-release-standard` proves zero strict/status/exposure/loader mismatches across all 30 skills; the static/model portions of `check:curriculum-board` prove each READY child count equals its exact eligible set, every BLOCKED count is zero with a visible reason, and the generated admin data is byte-equivalent to `docs/release/CURRICULUM_BOARD.md`. Commit `2036416b`; `docs/release/artifacts/2026-07-25T08-41-53-407Z/manifest.partial.json` passes 6/6 against the exact commit. The authenticated route case must still render those same fields before A10.9 can be DONE.

## D-036 · P1 · Area 9/10 — Exact curriculum exposure revealed a two-byte Quest bundle regression
**Evidence:** after the exact exposure set was moved into its own lazy chunk and the main entry became smaller, the unchanged bundle ratchet reported the QuestHub chunk at 140,277 gzip bytes against its 140,275-byte ceiling. Raw size remained below budget, but the two-byte compressed overage was still a real release failure.
**Fix:** remove redundant material properties whose values exactly matched Three.js defaults from the Quest world. Rendering and interaction are unchanged, while repeated runtime assignments and emitted bytes are removed. No budget, waiver, or baseline changed.
**Gate:** `check:bundle-size` reports QuestHub at 140.26 kB gzip with the existing 140.28 kB displayed ceiling green, and `check:split-boundaries` remains green with all route/data chunks bounded. Commit `2036416b`; both gates pass inside the exact 6/6 manifest.

## D-037 · P0 · Area 1/4/10 — Source-specific template labels overrode the canonical authored format
**Evidence:** the exact child bank still rejected valid language and phonics questions when a legacy `templateType` disagreed with the canonical `formatType`. The same filtering path was applied selectively by skill, so obsolete source semantics could both hide approved questions and admit questions outside the current level rubric. Homophone generation also selected the displayed word instead of the word matching the requested meaning in one schema branch.
**Fix:** route by canonical `formatType` first, apply the same release filter to every skill, align the Level 1/Level 2 format contracts with the designed picture/audio and language-pair tasks, repair homophone answer construction, and expand Level 1 review lists only with individually reviewed familiar targets.
**Gate:** strict production audit reports 30/30 READY with zero missing media, wiring fixes, or question gaps; exact release-standard checks report zero filter/loader/generator mismatches; focused contracts protect canonical format precedence, media requirements, reviewed Level 1 vocabulary, and homophone meaning answers.

## D-038 · P0 · Area 1/9/10 — Regeneration deleted statically imported empty runtime shards
**Evidence:** regenerating skill-level gaps removed `skill-gap.rhyming.generated.js` and `skill-gap.short-vowel-discrimination.generated.js` when those source groups happened to contain zero rows. The runtime loader still imported both modules statically, so a normal content-generation step could make the application fail to build.
**Fix:** define the statically loadable skill-gap groups once in a shared shard contract; make both the loader and generator consume it; emit a valid empty shard for every required group rather than deleting the module.
**Gate:** the shard generator always produces every required module, a focused unit contract covers the shared list, the production build succeeds immediately after regeneration, and split-boundary checks retain the intended lazy loading.

## D-039 · P0 · Area 1/4/10 — Runtime variation gates audited a broader candidate pool than children receive
**Evidence:** both variation tools initially sampled the pre-publication candidate pool, while the app serves the exact audited exposure set introduced for D-035. The shorter audit also treated answer-option audio as question-level audio and applied blanket language-skill image assumptions, producing 108 misleading failures while missing repetitive preposition teaching prompts in the actual child bank.
**Fix:** load the exact published bank in both variation gates, use the canonical per-format media requirement, distinguish question audio from answer-button audio, and replace generic preposition prompts and unrelated distractors with unique meaning clues and plausible spatial alternatives. The check scope is stronger because it now measures precisely what a child can encounter.
**Gate:** the exact 10-session audit reports zero failures for all priority skills; the 500-session simulation reports zero failures across all 30 managed skills; every published preposition question uses a target-specific meaning clue and spatial distractors.

## D-040 · P1 · Area 1/4/10 — Thin pattern inventory and one-rule plural content defeated long-run diversity
**Evidence:** the first exact 500-session simulation found 545 vowel-team failures and 500 plural failures. Vowel-team variants used inconsistent item identities and the Level 1 review list hid three familiar, fully mediated targets; plural rule questions were eight examples of only “add s”. Duplicate question variants also inflated apparent item-key capacity.
**Fix:** use phonics patterns consistently as item keys, calculate concept capacity from distinct learning targets rather than duplicate render variants, admit only the reviewed familiar vowel-team targets `beef`, `blue`, and `bright`, balance plural-rule questions across `s`, `es`, `ies`, and `ves`, distribute vowel-team introduction/review variants across phases, and author genuinely varied vowel-team distractor sets.
**Gate:** selector contracts prove duplicate variants do not masquerade as distinct concept capacity; strict readiness stays 30/30; the exact runtime audit and required 500-session simulation both pass with zero target, item, template, option-set, or media failures.

## D-041 · P1 · Area 1/4/10 — A legacy skill-contract audit still encodes unfinished phase maps and obsolete HFW bands
**Evidence:** after Loop D reached 30/30 on the canonical composed gate, `check:assessment-skill-contracts` still reported 56 failures across 20 skills. Sixteen rows explicitly declare `contract_incomplete_needs_formal_phase_map`; the four HFW rows compare the live bands with different historical word lists and model only two of four phase simulations.
**Fix:** move this audit onto the same canonical skill IDs, exact release exposure, HFW band source, level/phase model, and retry selector used by the live child bank. A skill without a formal phase contract must fail its owning task rather than remain indefinitely as a knowingly red optional audit.
**Gate:** `check:assessment-skill-contracts` covers all 30 canonical skills, reports exact runtime/audit parity and 4/4 phase simulations for each, and passes with zero failures without weakening the composed release standard.

## D-042 · P1 · Area 1/9/10 — Media QA silently skipped pixel analysis and audited blocked candidate questions as runtime
**Evidence:** `check:media-quality` printed a Python `PIL` import error and returned an empty colour-analysis result, while six already excluded Final Sounds candidates using owl, island, or quicksand images remained in the shared `runtimeQuestionSources` inventory. The release bank was safe, but the QA report failed and its visual heuristic depended on undeclared workstation software.
**Fix:** use the repository's installed `sharp` runtime for bounded concurrent pixel analysis; permanently remove media-QA-blocked questions from the shared runtime source registry; retain their waiver/audit records for traceability.
**Gate:** media quality scans all active mappings without an external Python dependency, reports zero active blocked/rejected mappings, preserves manual-review candidates, and the built-app media gate resolves all 2,415 referenced URLs with zero wiring, image, or audio failures.

## D-043 · P0 · Area 1/4/10 — Exact publication still contained two questions removed by the live media guard
**Evidence:** after the skill-contract gate moved onto the exact child bank, it found `digraphs_l1_38_wh_white` and `vowel_teams_l2_variety_06_igh_lighthouse` were published but rejected by `isQuestionBlockedByMediaQa`. The digraph question carried approved `imageCards` plus a stale blocked image for the same answer in `answerOptions`; the vowel-team question used the reviewed face-on-inanimate-object lighthouse image. The earlier strict and built-URL gates proved files and primary mappings, but did not compose the enriched question with the final live media guard.
**Fix:** when approved image cards and answer options name the same choice, make the answer option use the card's exact approved image so hidden duplicate fields cannot block the whole question. Replace the unsuitable lighthouse row with the familiar `light` target and its existing reviewed lamp image/audio, regenerate exact exposure, and keep both cases as loader-level regressions.
**Gate:** `check:assessment-skill-contracts` reads the enriched exact bank and reports 30/30 passing, 30/30 runtime/audit parity, 120/120 initial and retry phase simulations, and zero published blocked-media failures; focused unit contracts load both repaired questions and apply the same live media guard.

## D-044 · P1 · Area 3/4/10 — Calibration monitoring could leak weak evidence through timing, small cells, or inaccessible tables
**Evidence:** the first calibration critic pass accepted contradictory follow-up observations without enforcing the protocol's 14-day window, and a suppressed matched comparison could still expose one group's count. The first mobile browser audit also found two pale-blue labels below WCAG AA contrast and three independently scrollable result tables without Safari keyboard access.
**Fix:** validate follow-up timing before opening a reteach-adjudication candidate; reject direct identity fields and duplicate item events; suppress both matched-group counts whenever either cell is below five; expose only review candidates, never automated calibration, fairness, bias, or causal conclusions; strengthen the label colour; and give every result-table scroll area a descriptive keyboard focus target.
**Gate:** `check:calibration-readiness` must pass nine model/source contracts plus desktop and mobile production-component journeys with zero overflow, serious/critical Axe violations, console errors, or page errors. The dashboard must remain unmistakably synthetic, external specialist execution must remain `not_started`, and the gate is permanent in the release runner.

## D-045 · P0 · Area 1/4/10 — The five-dimensional curriculum result could not be run or evidenced independently
**Evidence:** the release runner had a correct `curriculum-composed` calculation, but appended it only during the all-gates credentialed release. `--only curriculum-composed` was rejected as unknown, so focused curriculum manifests could pass every dependency without recording the synthetic five-dimension result. That left A4.8 dependent on unrelated audit credentials and made the plan's “one command, five dimensions” contract impossible to execute locally.
**Fix:** make `curriculum-composed` a supported synthetic selection; deterministically expand it to every correctness, depth, variation, media, and runtime-selectability dependency; append the same per-skill composition used by the full release; preserve full-release credential preflight; and expose a stable package command.
**Gate:** `npm run check:curriculum-composed` must produce one partial manifest containing all nine dependency gates plus `curriculum-composed`, report every global dimension pass, report 30/30 per-skill releases, and fail if any dependency or per-skill dimension fails. The full release must continue to compute the identical synthetic result after all gates.

## D-046 · P0 · Area 6/9/10 — A signed-in teacher with no selected class hit the global error boundary
**Evidence:** the deployed teacher Today route rendered only “Something went wrong. Please refresh or go back.” The authenticated local reproduction captured `TypeError: Cannot read properties of null (reading 'data')` in `TeacherDashboardPage`: when both the class-access summary class ID and selected class ID were absent, `undefined === undefined` passed the ownership comparison and the component dereferenced the null summary.
**Fix:** require a real summary object and a real selected-class ID before reading class-scoped access data; retain the honest no-class state for a newly approved teacher.
**Gate:** the authenticated teacher dashboard-data journey must load the Today surface without a page error when no class is selected, and the complete 28-part teacher dashboard contract must pass.

## D-047 · P0 · Area 8/9/10 — Instructional-group tables were rejected by the application data boundary
**Evidence:** the reachable instructional-group flow failed with `Unregistered Supabase table: teacher_instructional_groups`. The migrations, UI and RPCs existed, but the two durable group tables were absent from the evidence registry and facade allow-list, so saves and reviews could not cross the private backend boundary.
**Fix:** register `teacher_instructional_groups` and `teacher_instructional_group_reviews` under the evidence domain in both the registry and facade; retain runtime validation and the raw-client ban.
**Gate:** the domain-boundary gate must report 18 registered tables and 36 RPCs, and the authenticated instructional-group create/review/reload journey must pass.

## D-048 · P0 · Area 8/9/10 — The final security lockdown made ordinary class creation fail
**Evidence:** teacher onboarding, demo setup and roster administration all failed with `permission denied for function gen_class_access_code`. The insert trigger ran with the teacher's privileges but called an intentionally private helper whose API-role execution had been revoked by the final security boundary.
**Fix:** make the trigger function a fixed-search-path private `SECURITY DEFINER` function, keep both the trigger and generator non-executable by browser roles, and reassert the complete reviewed security boundary after the trigger repair.
**Gate:** a fresh database must apply all 37 migrations; onboarding, demo-class and roster class creation must pass; the live catalogue must expose exactly eight anonymous and 36 authenticated security-definer RPCs while class-code expiry and rotation remain enforced.

## D-049 · P0 · Area 9/10 — Teacher deep links were overwritten during profile restoration
**Evidence:** hard-reloading valid Classes or Progress routes briefly restored the requested context and then reset to Today. The post-auth fallback effect observed a stale `profileLoaded = true` value in the same render that a restored identity was accepted, so it replaced the route before the new profile refresh completed.
**Fix:** mark the profile unresolved immediately whenever an authenticated identity is accepted or refreshed; persist and restore all five teacher intention routes even when no learner is selected.
**Gate:** unit routing contracts must preserve every teacher intention without learner context; authenticated class-progress and persistent-context browser journeys must survive hard reloads on their exact routes.

## D-050 · P0 · Area 7/10 — Repeated audit seeding accumulated legacy assessment evidence
**Evidence:** repeated teacher test runs produced 42+ synthetic EL Encoding attempts for the same learner. The legacy assessment/report tables use text identifiers and do not cascade from deletion of the UUID-based seeded learner rows, so the nominally deterministic seed left prior archive records behind and corrupted report/export assertions.
**Fix:** explicitly delete all audit-teacher assessment attempts and EL report rows before rebuilding the canonical fixture, then assert the production-shaped 520-attempt and formal-evidence counts inside the seed transaction.
**Gate:** applying the audit seed repeatedly must produce identical counts; empty-report and cross-report export journeys must pass after reseeding without manual database cleanup.

## D-051 · P1 · Area 8/10 — The live database policy verifier ignored its approved database target
**Evidence:** the clean database seed succeeded, but `check:db-policies` invoked `psql` without a connection argument and relied on `PGDATABASE` containing a URL. The installed client treated the invocation as a default local socket and failed at `/tmp/.s.PGSQL.5432`, so the release gate could not interrogate the database it had already approved.
**Fix:** pass the approved database URL as the first explicit `psql` argument and leave the caller environment unchanged; use the same invocation contract as the deterministic seed tool.
**Gate:** a unit contract must prove the approved URL is positional and cannot be overridden by ambient `PGDATABASE`; the clean live gate must pass catalogue, Auth, RLS, RPC, code, token, admin and deletion probes.

## D-052 · P0 · Area 2/8/9/10 — Frontend deployment outran the hosted class schema
**Evidence:** the deployed teacher query failed with PostgreSQL `42703` because `classes.access_code_created_at` was absent; after class loading recovered, the learner roster and automatic class dashboard failed because `students.updated_at` and `students.archived_at` were also absent. The student roster and sign-in calls failed with PostgREST `PGRST202` because the hosted project exposed the previous one-argument `student_class_by_code` and two-argument `student_login` signatures. Direct read-only probes proved the legacy class and student field sets and both legacy RPCs remained healthy, so the shared outage was release-order schema drift rather than missing classes or invalid user data.
**Fix:** add a single rolling-release class API boundary used by teacher and student flows. It prefers the current schema, retries the previous class/learner field sets, removes the active-roster archive filter only when that column is proven absent, and retries the previous RPC signature only for the exact missing-column/missing-overload codes. All authorization, network, validation and unrelated database failures pass through unchanged. The existing migrations remain the canonical final schema.
**Gate:** focused contracts must prove current calls are attempted first, only the known `42703`/`PGRST202` shapes trigger compatibility, permission errors never fall back, and teacher class/learner/dashboard loading plus student roster lookup and sign-in all work against the hosted schema without weakening the fully migrated path.

## D-053 · P0 · Area 1/4/10 — Letter tracing rewarded filled area instead of the requested letter shape
**Evidence:** in Adventure Map letter-trace practice, a child could cover enough of the grey guide to pass even when the drawn marks did not form the requested uppercase/lowercase letter. The score measured painted coverage, not the path, order, direction, continuity, or distance from the expected strokes.
**Fix:** replace coverage scoring with letter-specific geometric scoring. Each uppercase and lowercase target now has an explicit normalized stroke path; a response must stay close to that path, cover it in order, avoid large off-path scribbles, and complete enough of every required stroke. The task keeps its existing drawing UI and feedback but can no longer be passed by colouring the box or drawing an unrelated shape.
**Gate:** deterministic scoring contracts prove correct uppercase/lowercase traces pass while a filled box, an X, off-path scribbles, reversed/incomplete strokes, and partial coverage fail. The child trace surface is also opened in the browser as part of release review.

## D-054 · P1 · Area 2/4/6/7/10 — Product copy exposed internal language across screens and downloads
**Evidence:** teacher routes, child routes, reports, errors, accessible names and exports drifted between student/learner, assessment/checkpoint/check, evidence/results, login/sign-in, abbreviated check windows, raw status values, IDs and version strings. Child actions also included fractions and instructions longer than the agreed early-reader limit. Closed detail panels and downloads were outside the earlier source-only checks, so a green scan could miss copy a person could still read.
**Fix:** apply `APP_COPY_STANDARD_2026-07-25.md` across the seeded teacher and child product surfaces; use child/children, check, results and sign-in consistently; map check windows and raw statuses before rendering; simplify errors, empty states, actions, report language and family wording; preserve both class averages under plain labels; and strip internal ID/version columns and rows from teacher-facing Excel/CSV files while retaining the underlying internal report model.
**Gate:** `check:app-copy` now runs a source pre-filter, scans the complete rendered text (including closed details and accessible names) for eight teacher and nine child surfaces, enforces the eight-word child limit and no child fractions, and scans real export output. The gate is permanent in the release runner. All 17 rendered routes and the export contracts pass.

## D-055 · P0 · Area 5/8/9/10 — Teachers could not safely correct, archive, restore, or remove a child
**Evidence:** the roster exposed an Archive action but did not complete a durable state change, had no restore surface, and offered no ordinary way to correct a misspelled display name. Permanent deletion was buried inside the privacy-request workflow, so routine child administration and statutory data deletion were conflated.
**Fix:** add owned, validation-bound teacher RPCs for child renaming and archive-state changes; keep permanent deletion inside the separately verified privacy workflow; add focused Edit details, Archive, Restore, and Privacy settings actions; expose active and archived roster views; and refresh the selected child and class state after every mutation.
**Gate:** unit contracts cover validation, stale/cross-class ownership and response handling; the live database policy verifier probes anonymous denial and tenant isolation; and the authenticated child-lifecycle journey proves rename, privacy export readiness/history, archive, archived-list visibility, restore, and the original name restoration.

## D-056 · P1 · Area 6/8/9 — A failed privacy-history request disabled unrelated child data actions
**Evidence:** the child data-rights dialog treated request-history loading as a prerequisite for export and deletion. A transient history failure therefore disabled otherwise valid, independently authorised actions and left the teacher with no focused retry.
**Fix:** separate history state from action eligibility, retain verified requester/authority controls, let history fail and retry independently, and keep export/deletion responses honest about their own operation.
**Gate:** dialog unit contracts and the authenticated lifecycle journey prove verified export becomes available, history renders when reachable, and a history error cannot masquerade as an export or deletion failure.

## D-057 · P1 · Area 2/5/6/7/9 — Teacher navigation mixed daily work, administration, settings, and reports
**Evidence:** teachers had to scroll through oversized mixed-purpose surfaces; child actions, privacy controls, school details, site-code controls, settings and dense reporting competed in the same workflow. The selected-class path was unclear and the report chooser added a further decision screen after a child had already been chosen.
**Fix:** replace the mixed intention structure with six plain sections—Dashboard, Children, Checks, Reports, Resources and Settings. Give Settings its own School information, Site settings, Privacy settings and Account pages; keep child lifecycle actions inside Children; and open the chosen child's useful report directly from Reports.
**Gate:** authenticated desktop browser contracts prove all six sections, an honest no-class state, separate settings pages, active/archived child rosters, and direct child-report opening without the legacy five-card chooser.

## D-058 · P1 · Area 3/6 — Child administration used a scattered, low-focus drawer and modal stack
**Evidence:** actions appeared as a loose vertical list beside a dense roster, and translucent overlapping surfaces allowed the underlying page to compete with edit, privacy and archive tasks. At common laptop widths the workflow felt visually unbounded and required unnecessary scrolling.
**Fix:** use a compact roster row with one clear primary action, an opaque focused child-detail surface, short grouped actions, bounded dialogs, predictable footer buttons and responsive page-level sections rather than nested scrolling panels.
**Gate:** authenticated lifecycle and accessibility journeys exercise the focused child surface, dialogs, keyboard operation and 44-pixel targets at desktop and mobile sizes with no page error or serious/critical Axe violation.

## D-059 · P0 · Area 8/10 — An orphaned local database host made migration evidence contradict itself
**Evidence:** Docker's fresh PostgreSQL instance and an abandoned Lima host agent both claimed the local Supabase database port on different address families. Supabase CLI checks reached the stale Lima database while container inspection reached the clean Docker database, producing a false duplicate-version diagnosis and making release reconstruction non-reproducible.
**Fix:** identify and stop the orphaned host agent, require one resolved database listener before reconstruction, then rebuild and seed the complete Docker-backed local stack without changing or bypassing any migration.
**Gate:** a clean local reconstruction applies all 38 migrations in order, reports the exact migration-version range, starts Auth/REST/PostgreSQL healthily, applies the deterministic audit seed, and passes the live catalogue/Auth/RLS/RPC/delete/code/token verifier against that same target.

## D-060 · P0 · Area 6/9/10 — Opening Settings without a selected class crashed the teacher app
**Evidence:** the access-summary guard compared two absent class IDs. Because `undefined === undefined`, the component treated a missing summary as owned class data and dereferenced `accessSummary.data`, entering the global error boundary for a valid newly signed-in teacher state.
**Fix:** require a real summary object before comparing its class ID or reading its data, and render each Settings page independently of class selection where its content does not require a class.
**Gate:** the authenticated six-section journey opens Settings with no selected class and reaches all four settings pages without a page error.

## D-061 · P1 · Area 6/7/9/10 — Simple reports still detoured through the legacy chooser and lost their exact view on refresh
**Evidence:** the redesigned child summary existed, but Open report still routed to the previous five-card report-choice screen. A hard reload of a canonical report URL restored the picker rather than the selected child's exact Skills, Essential Literacy or High-frequency words view.
**Fix:** pass the selected child identity through the Reports row, open the canonical whole-child report directly, retain the class/child/report identity in the teacher URL, and restore the finished report surface itself after ownership validation.
**Gate:** the authenticated report journey verifies the plain exposure sentence, four-state colour legend, direct Skills view, exact canonical URL and hard-refresh restoration for the same class, child and report.

## D-062 · P0 · Area 5/6/7/9/10 — Release journeys still encoded the retired teacher information architecture
**Evidence:** the six-section teacher workflow was implemented, but several browser checks still searched for the old Today/Classes/Assess/Progress labels, drawer-only report entry, and superseded page headings. Those checks could fail without identifying a product regression or, worse, pass without exercising the new route.
**Fix:** move every teacher route, smoke, accessibility, device, reporting, and end-to-end contract onto Dashboard, Children, Checks, Reports, Resources, and Settings; assert the compact child workflow and direct report routes.
**Gate:** the canonical release suite exercises the authenticated six-section journey, deep links, refresh, Back, responsive roster, keyboard navigation, and teacher recovery states against the current interface.

## D-063 · P0 · Area 8/10 — Stateful release gates were not repeatable after another live gate changed audit data
**Evidence:** security, lifecycle, and data-rights journeys intentionally write records. A later gate could therefore observe more history rows or missing disposable learners than a clean standalone run, making results depend on execution order.
**Fix:** reapply the deterministic audit-school seed before stateful live checks and assert semantic bounded outcomes rather than incidental row totals.
**Gate:** `seed:audit-school` reconstructs the same teachers, classes, learners, evidence, reports, and security events; repeated focused and canonical runs produce the same outcomes.

## D-064 · P1 · Area 2/3/6/10 — Plain-language expansion caused avoidable child-screen crowding
**Evidence:** longer, clearer copy made the Story Quest status strip wrap and allowed the Adventure Map's current-stop hint to collide with the top edge on smaller layouts.
**Fix:** compact the Story Quest statistics without reducing readable type, keep them on one line, and position the current-stop hint to the right when an above placement would clip.
**Gate:** key-route, emphasis-budget, and full student-device screenshot matrices pass at phone, tablet, Chromebook, and projector sizes with reviewed baselines.

## D-065 · P0 · Area 8/9/10 — Preview and release helpers lagged behind the private data boundary
**Evidence:** after application reads moved behind the registered `table`/`call` facade, preview clients and static verifiers still used or expected raw SDK shapes. This produced false failures and allowed malformed preview identifiers to reach a real local endpoint.
**Fix:** use the same facade contract in previews and guards, register all lifecycle/data-rights calls, strengthen alias-independent raw-access detection, and use valid non-production UUID fixtures.
**Gate:** domain-boundary self-tests, preview accessibility routes, backend verifiers, and the full unit suite pass with zero direct application `.from()` or `.rpc()` access.

## D-066 · P0 · Area 8/10 — The documented recovery drill did not complete a real isolated restore
**Evidence:** the first live run exposed incompatible client invocation, target-database cleanup, catalogue comparison, and schema fingerprint assumptions that static checks could not reveal.
**Fix:** run the installed PostgreSQL tools through a bounded wrapper, restore only into an explicitly named isolated database, compare protected table counts and order-independent fingerprints, and write a secret-free evidence artifact.
**Gate:** `check:recovery-drill` performs a real backup and restore into `literacypath_recovery_drill`, verifies class, learner, evidence, and report data, and records the successful drill under `docs/release/artifacts/recovery/`.

## D-067 · P0 · Area 8/10 — Real learner deletion failed on an invalid JSONB section-count expression
**Evidence:** the authenticated data-rights journey reached permanent deletion but PostgreSQL rejected the zero-residual proof because `jsonb_object_length` was used where the deployed engine did not provide that function signature.
**Fix:** replace the brittle expression with a supported section-count calculation in a forward migration while preserving the atomic delete, audit tombstone, and zero-residual contract.
**Gate:** `check:learner-data-rights` exports a 520-attempt learner, creates and deletes a dedicated evidence-bearing learner, proves every protected record is absent, rejects re-export, and retains only the privacy-minimal completion record.

## D-068 · P0 · Area 8/9/10 — A release browser could silently run against a different backend from the live audit
**Evidence:** an orphaned Vite process and mismatched frontend/audit environment variables allowed browser checks to use one Supabase target while SQL and policy verifiers used another.
**Fix:** fail release preflight unless browser and audit Supabase URL/key values are present, valid, and exactly equal; use the current publishable key type; start the owned test server for every browser gate.
**Gate:** release-truth unit tests reject absent or mismatched targets, and the canonical run uses one local Supabase API and database for seed, browser, policy, recovery, and data-rights evidence.

## D-069 · P1 · Area 8/10 — The class-security check confused a privacy bound with a fixed event count
**Evidence:** the live UI correctly showed four recent generic security events after preceding denial probes, while the browser test required exactly three. The RPC contract is a bounded newest-first history, not a three-row history.
**Fix:** require the expected blocked and rejected event meanings, the explicit no-identifiers disclosure, and a history between 3 and the UI request limit of 20.
**Gate:** the focused live class-security gate re-seeds the database, triggers an 11-request device lockout, verifies the teacher alert/history, and saves and clears code expiry.

## D-070 · P1 · Area 3/8/10 — Accessibility previews queried the real sync-health table with synthetic context
**Evidence:** teacher preview routes first sent the malformed placeholder `class-a`; after that was corrected to a valid reserved UUID, the unauthenticated preview still made a real table request and correctly received a permission denial. Both paths created noisy false operational errors.
**Fix:** retain a valid reserved preview UUID and inject explicit empty preview telemetry into the dashboard. Do not grant anonymous table access, suppress production failures, or let a visual fixture depend on backend state.
**Gate:** teacher accessibility, learner-settings, all-route accessibility, and external route-readiness checks complete without malformed-UUID or denied sync-health console errors.

## D-071 · P1 · Area 3/6/9/10 — Teacher navigation used child-page view transitions and logged timeout errors
**Evidence:** the contextual-help browser journey completed correctly but repeated teacher route changes left `document.startViewTransition` phases waiting until the browser's DOM-update timeout, producing five console errors and false monitor noise.
**Fix:** scope the progressive view-transition enhancement to student sessions, which is the audience it was designed for. Teacher navigation uses the immediate React route update and retains all state, focus, URL, and Back behavior.
**Gate:** the contextual-help journey and complete authenticated teacher suite pass without `Page view transition failed` console output.

## D-072 · P0 · Area 6/8/10 — The learner-data-rights verifier contradicted the canonical copy gate
**Evidence:** the application and rendered copy gate correctly changed “Login tokens” to “Sign-in tokens”, but the backend verifier still required the retired wording and failed before running the real export/delete journeys.
**Fix:** make the verifier require the same canonical sign-in wording as the application copy standard.
**Gate:** `check:app-copy` and `check:learner-data-rights` both pass in the same canonical release.

## D-073 · P1 · Area 2/3/10 — Guided Reading verification could inspect an outgoing page during the page transition
**Evidence:** the reader progress changed to page 2 while the previous animated page remained in the DOM for its exit transition. The line-measure gate used an unscoped text locator, so it could measure the hidden outgoing page as empty even though the requested page rendered correctly.
**Fix:** identify every rendered reader page with its exact page number and bind the measure contract to that visible numbered page before checking text, line length or screenshots.
**Gate:** the Level A, B and C Guided Reading measure journey turns through every page, waits for the exact visible page, proves text is rendered, and enforces the level-specific line and image/text template.

## D-074 · P1 · Area 2/3/10 — Assessment answer text lost contrast during question transitions
**Evidence:** replacing a question after failed media could leave the new answer card part-way through an opacity animation when assistive checks or a fast child interaction reached it. The configured text colour passed at full opacity but not while blended with the card background.
**Fix:** keep assessment question content fully opaque throughout entry and exit; retain the short scale transition without temporarily weakening answer-label contrast.
**Gate:** the failed-media replacement journey waits for the safe refilled question, proves both replacement images are usable, and runs serious/critical Axe checks while the replacement transition may still be active.

## D-075 · P1 · Area 2/3/10 — Story Quest device baselines still described the superseded story revision
**Evidence:** the complete device matrix passed every overflow, control-size, focus and runtime assertion, but six reviewed screenshots still expected the older Story Quest title, story-word total and longer first-scene copy. The current compact story revision was therefore reported as a visual regression even though it reduced crowding and remained stable across repeated renders.
**Fix:** compare the old and current renders at phone, tablet, Chromebook and projector sizes, confirm that only the intentional story content and resulting image fit changed, then regenerate only the six affected Story Quest baselines.
**Gate:** all 12 device-matrix journeys pass with the reviewed current Story Quest route and fullscreen baselines while retaining zero horizontal overflow, visible focus and 44-pixel minimum controls.

## D-076 · P0 · Area 4/7/10 — Reports could turn thin, repeated, or mixed evidence into a confident learning conclusion
**Evidence:** one correct answer could become Secure; repeated variants from one sitting could count as independent attempts; a qualitative legacy mastery flag could acquire an invented score; current counts and status could use different date windows; and sentence choice, spelling, and isolated high-frequency-word reading could collapse into one result even though they measure different constructs. A stale formal result could also hide newer practice, while skill-name aliases produced duplicate class rows.
**Fix:** make one reporting-evidence policy own current windows, independent-attempt identity, minimum evidence, construct identity, alias normalization, recency, and the distinction between accuracy and learning status. Keep HFW sentence choice, spelling, and isolated reading separate; never derive an exact count or percentage from a qualitative flag; and withhold class conclusions until coverage and balance are sufficient.
**Gate:** `reportingEvidencePolicyIntegrity`, `simpleStudentReports`, whole-child evidence, formal class-report truth, and authenticated individual/class report journeys must all pass in the same integrated run. A one-answer, one-sitting, stale, mixed-construct, alias, or qualitative-only fixture must never render Secure or a fabricated percentage.

## D-077 · P0 · Area 4/7/8/9/10 — Reset and deletion paths could destroy retained learning data, lose classmates' shared evidence, or report incomplete cleanup as complete
**Evidence:** practice reset cleared learner profile, Guided Reading, Story Quest, and pending engagement data; permanent deletion removed whole shared observation/group-review rows containing the subject; direct authenticated table deletion bypassed request verification and audit; a database deletion could be called complete before browser caches were cleared; retries could duplicate answers or mastery; and active student sessions survived credential changes.
**Fix:** make practice reset delete only derived practice state while retaining formal evidence and the named learner records; revoke student sessions on reset and credential change; redact the subject from shared rows while retaining classmates; add idempotency keys; block direct deletes; add a one-way deletion tombstone; and split privacy deletion into database deletion, verified local cleanup, then completion. Interrupted cleanup must resume without recreating deleted evidence.
**Gate:** reset-propagation, learner-deletion migration, local-cleanup, insert-queue, immutable-evidence, `check:learner-data-rights`, `check:db-policies`, and `check:sync-chaos` must pass against one freshly rebuilt local database. The live journey must prove retained profile/reading/story data after reset, classmate preservation after deletion, revoked sessions, zero residual records, cleared browser stores, a surviving tombstone, and safe retry after interruption.

## D-078 · P1 · Area 3/5/6/7/9/10 — The teacher product still made routine work compete with administration, privacy, and dense reports
**Evidence:** Dashboard, Students, Assessments, Reports, Resources, and Settings each exposed long mixed-purpose pages; urgent work sat beside planning detail; a real roster required excessive scrolling; child details, privacy, archive, and settings stacked competing surfaces; reports led with technical density; and class/student/report selection could dead-end or lose context.
**Fix:** keep the six plain teacher sections, but make each a short task-focused page. Put urgent actions first and collapse secondary planning detail; paginate the roster at ten students; open one focused student layer at a time; separate school, sign-in, privacy, and account settings; use matching class → student → choice funnels for Assessments and Reports; keep Resources class-aware; and make everyday reports lead with Overview, Skills, High-frequency words, and Essential Literacy while technical context stays collapsed. Formal EL remains the detailed standalone record.
**Gate:** `teacherBusyWorkflow`, current teacher route/funnel contracts, `check:e2e-teacher`, `check:a11y-teacher`, and the authenticated roster device matrix must pass at laptop, tablet, and phone sizes. The final browser critic must complete every six-section workflow without a dead end, nested-scroll trap, lost context, raw jargon, or unnecessary full-page scroll.

## D-079 · P0 · Area 4/6/7/9/10 — Partial or stale dashboard reads were converted into zeros and false learning activity
**Evidence:** required dashboard queries caught errors and returned empty arrays, so a failed or truncated source could make established students appear at zero, not started, or safe to ignore. A late response for the previous class could overwrite the current class. Student creation and profile-update timestamps were also treated as learning activity, and incomplete evidence could still drive recommendations.
**Fix:** track error and truncation per required source; preserve the last complete figures while naming missing sources; give newly discovered students identity only, never invented zero evidence; block conclusions and recommendations until required sources are complete; reject stale class responses; page every source; and derive activity only from real learning records.
**Gate:** `classDashboardEvidence`, teacher loading-state, teacher class-model, Today briefing, complete-read, paging, and authenticated dashboard recovery contracts must pass. Simulated source failure, page ceiling, class switch, new student, profile rename, and retry-success cases must never create a zero, activity date, status, or recommendation that the evidence did not establish.

## D-080 · P0 · Area 1/4/7/10 — The live HFW and grammar curriculum drifted from its approved constructs and release counts
**Evidence:** four hand-maintained HFW bands disagreed with the approved 100-word source; runtime eligibility could select an option word instead of the declared target; HFW sentence tasks were incorrectly treated as requiring target-word audio and could regain audio during media enrichment; reporting merged sentence choice, spelling, and isolated reading; and the Nouns loader exposed only 30 questions instead of all 146 approved questions across both intended formats.
**Fix:** derive all four bands from the approved workbook; require the declared target to belong to its exact canonical band; keep active HFW sentence tasks intentionally text-only; preserve required answer-tile audio for grammar; publish all approved Nouns formats; keep the 100-word report complete with unseen words grey; and treat optional cartoon scenes as a future backlog rather than missing release media.
**Gate:** `check:hfw-coverage`, `check:hfw-runtime-smoke`, `check:hfw-distractor-ambiguity`, `check:audit:approved-hfw-media`, `check:curriculum-release-standard`, `check:assessment-skill-contracts`, and report construct tests must pass together. The gates must prove 100 of 100 HFW targets, 588 eligible HFW questions, zero unexpected HFW audio paths, and all 146 Nouns questions with both approved formats.

## D-081 · P0 · Area 1/2/4/10 — The D-053 letter scorer still accepted the right points in the wrong formation
**Evidence:** D-053 replaced painted-area coverage with path proximity, but the follow-up adversarial audit found that stroke direction and pedagogic stroke order were still not load-bearing. Reversed strokes, required strokes drawn in the wrong order, or all expected strokes concatenated into one continuous gesture could remain close enough to the guide to pass.
**Fix:** score a trace as an ordered sequence of letter-specific strokes, not one unordered cloud of nearby points. Match submitted strokes to expected strokes in order, check start/end direction, reject concatenated multi-stroke shortcuts, and retain age-appropriate tolerance for ordinary wobble, device sampling, and one accidental lift.
**Gate:** deterministic formation tests must pass correct and slightly noisy age-appropriate traces while rejecting reversed strokes, wrong stroke order, concatenated strokes, a different letter, box/fill scribbles, and incomplete traces. The real Letter Trace activity must then be reviewed in the browser on pointer and touch-sized viewports.

## D-082 · P1 · Area 5/8/9/10 — The final database boundary broke signed-out teacher school-name autocomplete
**Evidence:** the security-definer lockdown correctly revoked inherited `PUBLIC` execution, but the allow-list omitted the reviewed name-only `list_school_names()` RPC. Teacher signup therefore could not load school-name suggestions even though it exposes no school IDs, accounts, classes, students, or learning records.
**Fix:** re-grant the exact name-only function to `anon` and `authenticated` in the final security boundary, keep every richer school/class/student operation denied, and retain response validation in the auth boundary.
**Gate:** the source and live database-policy gates must prove anonymous callers can receive school names only, cannot read identifiers or related records, and cannot call any authenticated-only security-definer RPC. The signed-out browser signup journey must load autocomplete without console or raw database errors.

## D-083 · P0 · Area 7/8/9/10 — Legacy EL cleanup could delete another teacher's same-name student evidence
**Evidence:** legacy EL records without a learner UUID were matched by display name. Reset or deletion for one “Aaron” could therefore remove a second teacher's same-name legacy attempts or reports when the cleanup path did not require explicit teacher ownership.
**Fix:** require the signed-in teacher ID for every legacy name fallback, match within that owner only, and fail closed when ownership is absent or ambiguous. UUID-based records remain the primary path.
**Gate:** reset-propagation, legacy report isolation, learner-data-rights, and tenant-isolation database tests must prove that deleting or resetting Teacher A's same-name student cannot alter Teacher B's UUID or legacy evidence.

## D-084 · P1 · Area 6/7/10 — The formal class report fabricated `null%`, a nonzero bar, and a reading classification without evidence
**Evidence:** withheld accuracy interpolated as `null%`; a minimum-width progress rule drew a 4% bar when no percentage existed; the report printed a hard-coded Reading column containing `NR`; and empty Growth, Reading, Actions, and detail pages made an already dense report look complete despite absent source data.
**Fix:** use one null-safe percentage formatter; render no bar without a real value; use the canonical five plain-language learning states; remove the fake Reading column; omit empty pages; combine priorities with actionable groups; keep technical report details available for print but collapsed on screen; and calculate page numbers from the pages that actually exist.
**Gate:** formal class-report truth tests and the authenticated class-report browser/print journey must prove no `null%`, fake-width bar, `NR`, empty page, or unsupported reading classification is present, while genuine values and printable report details remain intact.

## D-085 · P1 · Area 3/5/6/9/10 — Teacher forms and errors could lose input, leak backend prose, or rely on browser-native confirmation
**Evidence:** a failed student-create request cleared the typed name; teacher sign-in did not use one complete form-submit path; assessment, worksheet, auth, and account-setup failures could expose raw backend messages; and progress reset relied on the browser's native confirm dialog instead of the product's keyboard/focus contract.
**Fix:** clear form fields only after confirmed success; use semantic forms with required fields, Enter submission, and an explicit password visibility control; map backend errors to teacher actions while retaining codes only for diagnostics; use the shared in-product confirmation dialog; and preserve drafts/input after failure.
**Gate:** auth-page, teacher error-message, roster-operation, EL assessment, busy-workflow, copy, and authenticated keyboard/accessibility contracts must pass. Failure fixtures must preserve input, reveal no SQL/RPC/schema/raw transport prose, and restore focus after cancellation.

## D-086 · P1 · Area 4/6/7/10 — Today recommendations could blame the current skill for unrelated, stale, or repeated evidence
**Evidence:** the current-focus label could sit beside accuracy calculated across other skills; stale low results could continue to create an urgent needs-support suggestion; repeated `mastered=true` rows for an already secure skill counted as newly secured; and a missing required source did not reliably pause recommendations.
**Fix:** calculate current-focus evidence only from answers for that exact skill; require current, sufficient evidence before attention or next-step claims; count only the first secure transition for each distinct skill; show current and previous windows separately; and suppress the recommendation layer whenever any required dashboard source is incomplete.
**Gate:** Today briefing, current-skill evidence, first-secure-transition, teacher class-model, and authenticated Dashboard contracts must pass with unrelated-skill, stale, duplicate-mastery, incomplete-source, and retry-success fixtures.

## D-087 · P1 · Area 3/6/10 — Two primary teacher pages had no main landmark
**Evidence:** the authenticated accessibility journey found that Assessments and the Reports landing surface rendered their page content without a `main` landmark. The individual report already owned its own `main`, so applying one wrapper indiscriminately would instead create invalid nested landmarks.
**Fix:** give each standalone Assessments and Reports surface exactly one main landmark, while allowing the embedded individual-report shell to remain the sole main landmark on that route.
**Gate:** the complete authenticated teacher accessibility journey must find exactly one usable main landmark on the Assessment funnel, Reports funnel, whole-class report, and individual report, with no serious or critical Axe finding.

## D-088 · P0 · Area 4/6/7/9/10 — Assessment launch failed open when a student's saved results were incomplete
**Evidence:** a student could be selected and an assessment started while the per-student progress/evidence read was still loading, failed, partial, or truncated. The chosen starting point could therefore be based on missing history and repeat content already completed by the student.
**Fix:** make an explicitly complete student-evidence read a prerequisite for assessment choices and launch; show a bounded loading or retry state otherwise; and re-check completion inside every launch handler rather than trusting a previously rendered button.
**Gate:** assessment-hub, busy-workflow, stale-read, and authenticated assessment journeys must prove loading/error/partial evidence cannot expose or start an assessment and that a successful retry restores the correct starting point.

## D-089 · P0 · Area 4/7/10 — A single correct Skills observation could become Secure in the formal EL workbook
**Evidence:** the Skills-to-EL reconciliation mapped a qualitative secure-looking aggregate directly to `Mastered`, even when the source contained only one correct response or several variants from one sitting. That bypassed the independent-attempt minimum used elsewhere.
**Fix:** run Skills-derived EL cells through the canonical exact-item policy, count independent sittings rather than repeated observations, and use the shared status labels. One sitting remains Not enough results; Secure requires the full minimum and accuracy rule.
**Gate:** EL export consistency tests must cover one correct observation, mixed observations, repeated variants in one sitting, and three qualifying sittings, and the real workbook must agree with the on-screen evidence policy.

## D-090 · P0 · Area 5/6/9/10 — Class-to-student route hydration raced and could render an empty roster
**Evidence:** direct report/assessment links and first sample-class creation could load the class successfully while the dependent student read still used stale class state. The database contained the students, but the teacher UI showed no student or lost the selected student context.
**Fix:** sequence dependent class and student reads with the resolved class ID rather than a render-time closure, reject stale completions, and hydrate the requested student only after the matching roster read completes.
**Gate:** direct report, Assessment EL, first sample-class, hard-refresh, and rapid class-switch journeys must retain the correct student and must never show a false empty roster when the database read succeeded.

## D-091 · P0 · Area 4/7/9/10 — Official class exports could be generated from partial assessment history
**Evidence:** global assessment-history hydration collapsed failed or truncated reads into the cached array and exposed print and EL Excel actions without a completeness state. An apparently official class record could therefore silently omit results.
**Fix:** retain loading, complete, failed, and truncated state for global assessment history; allow cached rows to remain visibly available only as incomplete context; disable official class print/export until a complete read succeeds; and provide a focused retry.
**Gate:** report/export state tests and authenticated failure/retry journeys must prove partial/error/truncated history cannot produce an official class print or workbook and that retry restores it without losing the teacher's selections.

## D-092 · P0 · Area 4/6/7/10 — Current teacher conclusions used lifetime answers with only the newest timestamp
**Evidence:** dashboard accuracy, answer count, skill diversity, and focus evidence aggregated the student's lifetime history, then passed the newest activity time into the 90-day policy. Old success or failure could therefore drive a current status and Today suggestion.
**Fix:** retain lifetime activity totals for history displays, but calculate current answer count, correct count, accuracy, skill diversity, latest current observation, focus evidence, status, and recommendations from the canonical 90-day window only.
**Gate:** class-dashboard, teacher-class-model, and Today tests must combine old and recent evidence and prove the lifetime total stays visible while every current conclusion uses only the current window.

## D-093 · P0 · Area 4/6/9/10 — A missing dashboard row defaulted to a confident new-student zero
**Evidence:** if the roster arrived before the dashboard, or the initial dashboard student read failed/truncated, the class model invented `0 answers`, `Not started`, and a complete evidence state for any student without a matching row. That was indistinguishable from a genuinely new student whose complete read proved no results.
**Fix:** treat a missing dashboard row as incomplete/unknown; mark retained rows incomplete when the identity read fails; and render Not assessed at zero only when a completed dashboard read explicitly returns the student's zero-result row.
**Gate:** roster-before-dashboard, initial error/truncation, class switch, retry, and genuine-new-student contracts must never turn absence of a row into absence of evidence.

## D-094 · P0 · Area 4/7/10 — Formal EL status ignored the canonical 90-day evidence window
**Evidence:** the formal report builder, saved summary, and Skills reconciliation explicitly disabled recency. Three correct attempts from years earlier could still render Secure as if they described the student's current attainment.
**Fix:** apply the shared conclusion window and a supplied deterministic `now` to every current EL cell and summary; keep stale evidence available as historical context while the current status becomes Not enough current results.
**Gate:** EL builder, persistence, screen, and workbook tests must contrast stale and recent qualifying evidence and prove stale records cannot create a current Secure conclusion.

## D-095 · P0 · Area 1/4/7/10 — Advanced Phonics pooled unlike sound and reading constructs into a fabricated overall result
**Evidence:** the formal EL builder added sound-identification and printed-pattern reading observations into one attempts/correct total. Two insufficient component results could combine into an apparently sufficient 4/4 overall Secure result.
**Fix:** report sound and reading as separate constructs and never sum them as repeated evidence. If an overall row is retained for navigation, it may be ready only when every required component independently has enough evidence and meets its stated rule.
**Gate:** Advanced Phonics tests must prove insufficient component results cannot combine into Secure and that exported labels, counts, and statuses remain component-specific.

## D-096 · P1 · Area 4/6/7/10 — Report period controls printed a period the calculations did not use
**Evidence:** teachers could select 30 days, 90 days, school year, or all time, but the report model silently re-filtered every record to 90 days while printing the selected period as provenance.
**Fix:** use the selected period for descriptive totals and history, while calculating present-tense learning conclusions from a separately labelled canonical 90-day subset. Never label a 90-day calculation as all time or school year.
**Gate:** period tests with both old and recent records must prove each descriptive total matches its label and every current status remains bound to the canonical window.

## D-097 · P0 · Area 4/6/7/10 — Simple reports compared incompatible denominators and could say “Right every time” after errors
**Evidence:** the sentence builder compared independent-attempt count with correct observation count. Three sittings containing nine observations and six correct could satisfy `correct >= attempts` and render “Right every time so far.” It also invented an across-days rule that the canonical policy does not require.
**Fix:** render the canonical policy conclusion and reason from like-for-like counts; do not infer perfect accuracy, day diversity, or another-day requirements unless the stored fields and policy establish them.
**Gate:** simple-report tests must cover multiple observations per sitting, mixed correctness, same-day independent attempts, stale evidence, and genuinely perfect evidence without producing contradictory prose.

## D-098 · P1 · Area 3/5/6/9/10 — A failed sign-in-picture save looked successful
**Evidence:** the save controller returned the same undefined value on failure and success, while the student modal always closed and cleared the selected pictures after awaiting it. A failed credential change therefore looked complete and discarded the teacher's work.
**Fix:** return an explicit success result, keep the modal and selected pictures open on failure, show a short inline retry message, and lock duplicate submissions while the save is in flight.
**Gate:** controller and roster-operation tests plus an authenticated failure/retry journey must prove failure preserves the draft and success alone closes the modal.

## D-099 · P1 · Area 5/6/8/10 — Permanent-delete confirmation contradicted retained privacy audit data
**Evidence:** the data-rights implementation correctly retains a minimal privacy-request reference, but the ordinary student delete confirmation promised “Nothing of theirs is kept.” That was legally and operationally false.
**Fix:** use the same truthful retention statement at both deletion entry points: the student's active data and results are removed, while the minimum privacy-request record required to evidence the action is retained.
**Gate:** copy contracts and the authenticated data-rights journey must show the same accurate retention message before deletion from either entry point and verify the retained minimal request record.

## D-100 · P0 · Area 5/6/9/10 — A failed roster read became a genuine empty class
**Evidence:** the student loader returned an empty array on error or truncation without exposing a read state. Because class changes deliberately clear the prior roster, Students then offered “Add your first student” and Today could issue no-review/no-due conclusions even though the roster was unknown rather than empty.
**Fix:** carry loading, complete, and incomplete roster state for the selected class; show a focused retry state on error/truncation; and allow empty-class onboarding or Today conclusions only after a complete read explicitly returns zero students.
**Gate:** initial roster error, class-switch error, truncation, stale completion, retry success, and genuine-empty authenticated journeys must never convert an incomplete roster into an empty class or recommendation.

## D-101 · P1 · Area 3/5/6/9/10 — Accessibility-setting save failures were hidden behind the open modal
**Evidence:** the accessibility dialog correctly stayed open when saving failed, but it had no local pending, success, or error state. The controller's only failure message rendered on the covered page behind the modal, so Save appeared to do nothing.
**Fix:** show saving and inline retry feedback inside the dialog, retain the teacher's draft and focus on false/rejected/undefined saves, prevent duplicate submissions, and close only after an explicit successful result.
**Gate:** dialog tests and an authenticated failure/retry journey must prove false, rejection, and undefined remain open with an alert, while strict success alone closes and refreshes the saved setting.

## D-102 · P0 · Area 5/6/8/10 — Permanent deletion could skip typed confirmation when the roster summary showed zero
**Evidence:** the ordinary deletion dialog required the teacher to type the student's name only when the roster summary contained saved answers or Sound Seekers stops. That summary does not include every formal report or legacy record, so a student with apparently zero roster activity could still have protected records deleted by one click.
**Fix:** require the exact normalized display name for every permanent deletion, regardless of the visible activity summary, and describe the summary as partial context rather than proof that nothing is saved.
**Gate:** roster-operation and authenticated deletion tests must cover zero roster answers with existing formal/legacy evidence and prove the destructive action remains disabled until the exact name is entered.

## D-103 · P1 · Area 5/6/7/10 — “No practice” and “Not started” labels ignored saved non-answer activity
**Evidence:** the live seeded roster showed Bao as “No practice yet” while the same row showed real saved activity five days earlier from Sound Seekers. The label was derived only from scored-answer count, so it made a broader claim than its source supported.
**Fix:** label that measure precisely as “No scored answers,” use “Run first assessments” for the related teacher action, and reserve practice/activity language for sources that include all saved activity types.
**Gate:** roster copy contracts and authenticated mixed-activity review must combine zero scored answers with saved Sound Seekers activity and never render a contradictory no-practice/no-activity claim.

## D-104 · P1 · Area 4/6/7/10 — Overall accuracy sat beside a focus skill without saying it covered other skills
**Evidence:** the live Aisha drawer showed “Initial Sounds” followed immediately by “Current accuracy 30%.” The 30% used all current answers, while Initial Sounds alone was 100%, so the layout invited a false skill-specific reading even though each figure was individually calculated correctly.
**Fix:** visibly label the first figure “Current focus” and the second “Accuracy across skills,” while keeping the 90-day denominator in its definition.
**Gate:** busy-workflow copy contracts and the authenticated mixed-skill drawer must show the two scopes explicitly and never imply that an overall percentage belongs to the adjacent focus skill.

## D-105 · P0 · Area 5/6/9/10 — Same-section route changes could restore the previous student
**Evidence:** while the real class request for a bare Reports or Assessments route was delayed, a newer student could render and then be replaced in state or URL by the older route restoration. Back and Forward during initial report restoration exposed the same synchronous gap before the lazy route parser installed its lock.
**Fix:** install an exact-hash navigation lock synchronously, bind every hydration to the current account generation and complete route context, re-check that context after every awaited read, and retire superseded work before it can publish state or rewrite the URL.
**Gate:** `teacher-route-races` must hold real Supabase responses and prove the newest learner wins in Reports and Assessments, Back stays on Dashboard, Back→Forward restores the exact report, and no late request from another account can publish.

## D-106 · P0 · Area 4/5/6/9/10 — Standalone report tabs changed the screen without keeping controller state and URL together
**Evidence:** the report shell changed its local view and pushed a new report URL, but a standalone report received no parent `onReportViewChange`. The app-level controller still held the previous view and could later mirror that stale view back into the URL or browser history.
**Fix:** always publish standalone report-view changes to the parent controller while retaining the Reports-funnel override, so the visible report, controller state, saved profile, and URL move as one transaction.
**Gate:** the owned direct-report journey must open Skills, survive refresh, change to Summary, update the exact report parameter, and return to Skills with browser Back on desktop and mobile.

## D-107 · P1 · Area 3/5/6/10 — Completed report choices pushed results below the fold, and the class report had no way back
**Evidence:** after a teacher made all three report choices, the heading and settled chooser cards remained above the result and consumed the laptop fold. Hiding them exposed a second problem: the whole-class result then had no explicit way back to change the choice.
**Fix:** use a focused open-report layout that hides settled chooser content, starts the result at the top, retains one main landmark, and gives both individual and class reports an explicit Back action.
**Gate:** teacher E2E must prove the first result heading is inside the viewport and the settled chooser is hidden; the class-report journey must show and exercise Back to reports; responsive and accessibility checks must retain one main landmark.

## D-108 · P1 · Area 3/4/6/7/10 — Legacy EL reports exposed BOY, MOY, and EOY codes in screens and downloads
**Evidence:** immutable reports saved before the copy migration retained labels such as `Grade 1 · BOY`. Current UI and export paths printed that stored label directly, leaking internal assessment-window abbreviations even though newly generated reports used teacher language.
**Fix:** preserve the stored evidence while normalizing presentation through one helper that expands the three legacy codes in saved-report lists, success messages, admin views, workbook summaries, and export provenance.
**Gate:** legacy-label units, authenticated report review, and a real persisted-report workbook round trip must show Beginning, Middle, or End of year and contain no standalone BOY/MOY/EOY token.

## D-109 · P1 · Area 3/5/6/8/10 — Saved-report Delete looked like the primary Download action
**Evidence:** a later important primary-button rule overrode the earlier danger selector, so destructive Delete used the same green treatment as Download.
**Fix:** give the report danger action explicit danger border, pale background, and text overrides that remain distinct in normal, hover, focus, and disabled states.
**Gate:** the source/style contract and authenticated computed-style journey must prove Download remains primary while Delete stays visibly destructive at desktop and mobile sizes.

## D-110 · P0 · Area 5/8/9/10 — A late admin lookup from the previous account could grant privileged state to the next account
**Evidence:** admin membership was resolved asynchronously across auth changes. Without a full identity and request-generation guard, a slow positive result for one user could complete after a non-admin user signed in and publish privileged UI into the new session.
**Fix:** make the account lookup side-effect-free, clear privileged state at account change, and publish only when the request generation, checked identity, session identity, and current authenticated identity all still match.
**Gate:** account-access units plus an authenticated race must hold the real positive `app_admins` response, switch to non-admin Teacher B, release the old response, and prove no transient Admin UI, state, route, class, learner, or saved-profile contamination.

## D-111 · P1 · Area 3/5/6/9/10 — Settings subsection URLs were rewritten to the generic Settings page
**Evidence:** the URL mirror compared valid subsection URLs such as School, Site, Privacy, and Account with a generic Settings fallback as different routes. An unrelated render could therefore replace a bookmarkable subsection URL and reload into the wrong page.
**Fix:** canonicalize every valid Settings subsection to the same app-view identity while preserving its exact subsection hash; keep invalid nested paths rejectable and preserve the subsection during class changes and browser history.
**Gate:** route units and authenticated Settings journeys must round-trip all four pages through render, reload, Back, Forward, and class changes.

## D-112 · P0 · Area 5/6/9/10 — Failed class or roster confirmation consumed a valid deep link
**Evidence:** a failed or truncated class/student read could be treated as a complete ownership denial. The requested learner was cleared and the Reports funnel rewrote the exact standalone report URL before a retry could succeed.
**Fix:** represent failed or truncated ownership reads as incomplete rather than empty, let only complete arrays reject a route, preserve an exact retryable route lock, and stop funnel writers from mutating a standalone report path.
**Gate:** unit and authenticated journeys must fail class and roster reads separately, retain the exact class/learner/report hash, retry into that report, avoid false empty/denial UI, and still reject a genuinely unowned route after a complete read.

## D-113 · P1 · Area 3/5/6/10 — A disabled saved-report action had no visible disabled state
**Evidence:** while the delete request was intentionally held, the saved-report Delete button was functionally disabled but kept opacity 1. The global disabled selector applied only below `.app`, while this teacher report surface sits outside that wrapper.
**Fix:** add a scoped report-button disabled treatment without weakening its danger identity or changing the real disabled behavior.
**Gate:** authenticated desktop/mobile computed-style evidence must hold the real delete request, prove the button becomes disabled and visibly dims, retain the report after an injected failure, and keep normal, hover, and keyboard-focus danger styling distinct from Download.

## D-114 · P1 · Area 2/3/6/7/10 — Untouched Story Quests looked completed and the status badge failed contrast
**Evidence:** the Story Quest library calculated the right text, but every badge used the same base class. The existing `not-started` and `in-progress` styles were never selected, so untouched quests inherited the green success treatment; the sage badge combination also measured only 2.37:1.
**Fix:** attach an explicit `not-started`, `in-progress`, or `completed` class from the saved state and give each sage state an AA-compliant foreground/background pair without relying on colour alone.
**Gate:** Story Quest state units and the desktop/mobile Axe route matrix must prove untouched quests are not success-styled, visible text names every state, and computed contrast is at least 4.5:1.

## D-115 · P1 · Area 3/5/6/10 — The compact teacher rail exposed a low-contrast class label during mount
**Evidence:** on compact teacher routes the selected-class label was already `aria-hidden`, but its opacity transition briefly painted the text at an intermediate low-contrast value. Axe therefore found a serious colour-contrast failure on every compact teacher preview, including the mobile student drawer.
**Fix:** remove the opacity animation for the class label and make the collapsed state immediately non-visible as well as hidden from assistive technology.
**Gate:** the primary-route inventory and desktop/mobile Axe matrix must cover every compact teacher route, the question guide, student drawer, student options, and assessment-discontinue panel with zero serious or critical findings.

## D-116 · P1 · Area 2/6/9/10 — Story Quest preview progress fed back into an endless React update loop
**Evidence:** the player published a progress snapshot, the parent merged it into a new `initialProgress` object, and the player treated that object identity as new input. Opening a teacher Story Quest preview therefore logged `Maximum update depth exceeded` even though the visible journey completed.
**Fix:** derive the seed-word dependency from stable normalized content rather than the parent object's identity, so a semantically unchanged progress merge cannot retrigger the same snapshot indefinitely.
**Gate:** the authenticated teacher-preview journey must open a real quest, retain read-only behavior and context, return to Students, and assert both page errors and console errors are empty.

## D-117 · P2 · Area 2/3/9/10 — A teacher preview opened a 3D game with deprecated timing and shadow APIs
**Evidence:** the full overlay matrix emitted Three.js runtime warnings for `THREE.Clock` and `PCFSoftShadowMap`; current Three.js already falls back from the latter, so the app paid warning and maintenance cost without receiving the requested mode.
**Fix:** use the browser's animation-frame timestamp with an explicit pause reset instead of a deprecated Three.js clock, and use the supported PCF shadow mode at every quality tier.
**Gate:** the 3D runtime contract must contain no deprecated timing/shadow API, and the complete standard/forced-colour overlay browser matrix must pass without those runtime warnings.

## D-118 · P1 · Area 4/6/9/10 — Release previews targeted retired teacher components and control names
**Evidence:** the learning-policy preview still mounted a component that had become a report picker, while class-summary and sparse-evidence tests asserted its retired analytics DOM. The accessibility inventory also tried to open controls renamed or replaced in the current product, so the release gate timed out before auditing the reachable modal.
**Fix:** mount the current production Students/Class surface with deterministic sparse and mixed evidence, exercise its real drawer and class-summary interactions, and update the modal inventory to the current reachable assessment guide, student settings, and discontinue controls.
**Gate:** the combined preview gate must prove sparse 1/1 evidence is withheld, both class averages and denominators remain truthful, all current modals are reachable, and the 52-test policy/Axe matrix passes.

## D-119 · P0 · Area 5/8/9/10 — A late profile restore could pull Admin back to Today
**Evidence:** one full learner-data-rights run opened the Admin dashboard and then unexpectedly returned to Today. A deterministic browser race reproduced it by suspending the real lazy teacher-route module, opening Admin, and releasing the older profile continuation. The fresh-login reset inside that continuation navigated to the saved default after the newer click.
**Fix:** give every public page navigation a monotonically increasing revision, capture that revision when profile restoration is scheduled, and let both saved-view restoration and fresh-login reset publish a page only while they still own the same revision. Profile data can still finish hydrating without replacing a newer destination.
**Gate:** revision-policy units plus a desktop/mobile authenticated race must hold the production route module, open Admin, release the old restoration, and prove Admin remains visible and Today never returns; the full learner-data-rights journey must remain stable under repetition.

## D-120 · P0 · Area 5/6/9/10 — The Reports funnel URL did not own the visible report
**Evidence:** the funnel wrote `report=` into a teacher Reports URL, but route parsing discarded it and the funnel only read its initial route once. A reload, bookmark, Back, or Forward operation could therefore leave the URL naming one report while the controller retained another previously selected report.
**Fix:** parse a valid report only when the Reports route also owns a learner, hydrate or explicitly clear the controller's report view from that route, and make the funnel react to both hash and browser-history changes. Keep each report selection, route, saved controller state, and visible result synchronized.
**Gate:** focused route units plus preview and authenticated production-controller journeys must select Skills and High-Frequency Words, reload, go Back and Forward, and prove the URL, chooser, controller, and visible report remain identical at every step.

## D-121 · P1 · Area 3/5/6/10 — The final Reports choice stranded keyboard focus
**Evidence:** after a keyboard user chose the final report type, the funnel attempted to focus a report heading that was not mounted until the report opened. Focus consequently remained in the choice grid even though the next required action was the newly enabled “Show the report” button.
**Fix:** give the final action a stable focus target and move focus to it when the last choice unlocks the action. Do not open the report automatically or skip the teacher's explicit confirmation.
**Gate:** the focused source contract and browser journey must complete the funnel without a pointer and assert that “Show the report” receives focus immediately after the final choice.

## D-122 · P1 · Area 3/5/6/10 — Today sent an assessment shortcut to Children and could show six urgent pupils
**Evidence:** “Assess a student” invoked the Children destination rather than Assessments. The two urgent sections also sliced themselves independently to three rows, so a page described as a short daily briefing could show three pupils needing attention plus three overdue pupils.
**Fix:** route the assessment shortcut directly to Assessments and allocate one global three-pupil urgency budget, prioritising “needs attention” before filling any remaining places with overdue pupils.
**Gate:** allocation units plus an authenticated Today journey must prove the combined urgent list never exceeds three and that the shortcut opens the Assessments chooser with the current class intact.

## D-123 · P1 · Area 3/5/6/10 — Large-class assessment and report pickers created unbounded keyboard work
**Evidence:** the assessment and report funnels rendered one button for every matching pupil. In a 30–40 pupil class, reaching the control after the roster meant tabbing through the entire class even though both pages already asked the teacher to make one quick selection.
**Fix:** use one shared searchable pupil picker with eight results per page, a truthful result count, explicit Previous/Next controls, and a controlled current page that resets when the search or selected class changes.
**Gate:** units and browser journeys must exercise both funnels with 40 pupils, prove no page exposes more than eight pupil buttons, retain search and selection, and keep the keyboard sequence bounded.

## D-124 · P1 · Area 3/5/6/10 — A 100-pupil roster rendered a button for every page
**Evidence:** Children pagination created its page controls with `Array.from(pageCount)`. At 100 or more pupils this added a long second roster of page buttons, made the footer wrap unpredictably, and turned a navigation aid into another scanning task.
**Fix:** show a maximum seven-item pagination window containing the ends, the current-page neighbourhood, and non-interactive ellipses. Preserve direct access to the beginning and end without producing a control for every page.
**Gate:** pagination units must cover the first, middle, and last pages, and a browser journey with 105 pupils must prove all 11 pages remain reachable while no more than seven pagination items are rendered.

## D-125 · P1 · Area 3/5/6/10 — The teacher rail clipped destinations on a short landscape screen
**Evidence:** the fixed teacher rail used hidden navigation overflow. At 667×320 the combined header, destinations, and account footer exceeded the available height, leaving lower destinations or sign-out outside the reachable viewport.
**Fix:** make the navigation region independently scrollable, keep the account footer fixed and reachable, retain 44-pixel targets, and use compact short-landscape spacing without changing the normal desktop rail.
**Gate:** the CSS contract plus an exact 667×320 browser journey must keyboard-focus every teacher destination and sign-out, automatically scroll each focused control into view, and report no unreachable rail action.

## D-126 · P0 · Area 4/5/6/7/10 — “Print or save EL PDF” printed a report with no EL benchmark evidence
**Evidence:** the whole-class EL button only invoked the browser print dialog while the print stylesheet exposed the generic class report. That generic model intentionally excludes descriptive EL benchmark attempts, and neither the chosen grade/time-of-year route nor its domain results reached the printable document. The Admin report path repeated the same mismatch.
**Fix:** build a dedicated printable EL class record from the same route-scoped report model as the spreadsheet, including the exact grade/time of year, class, students, four EL domains, administration status, measures, placement provenance, dates, and interpretation rules. Mark the intended document for the print snapshot so general class printing and EL printing cannot select one another.
**Gate:** component evidence must render route and student/domain values without fabricated zeroes; an authenticated desktop/mobile journey must capture the real print target, prove the selected EL document contains the seeded pupil and EL headings, and prove print CSS hides the generic class report.

## D-127 · P0 · Area 5/8/9/10 — Pending, rejected, and disabled teachers retained database access to owned learning data
**Evidence:** the account-status check existed in the interface, but the teacher-owned row policies generally checked only `teacher_id = auth.uid()`. A teacher whose account moved out of the approved state could therefore bypass the interface and continue reading or changing classes, learners, answers, mastery, reports, and related evidence through the authenticated table API. The authenticated privileged teacher RPCs were a second bypass because their owner context did not evaluate row policies.
**Fix:** make one stable account-access predicate require the teacher role and both approval fields to be approved, with an explicit application-administrator exemption, and apply it to every equivalent teacher-owned policy. Inventory every callable privileged `teacher_*` RPC and inject the same fail-closed assertion before argument validation, reads, or writes; migration must stop on inventory drift. Keep the bounded learner-token functions independent so changing a teacher account does not corrupt an already-issued child session.
**Gate:** a clean database reconstruction and SQL/API actor exercise must move the same teacher through pending, rejected, disabled, and approved states; prove core learning-table reads, inserts, and updates are blocked outside approved; invoke all 23 callable privileged teacher RPCs in every blocked state and require the exact account-boundary denial; prove approved access returns; and prove the learner-token persistence path still works.

## D-128 · P0 · Area 5/7/8/9/10 — Permanent deletion could report browser cleanup without clearing the live learner identity
**Evidence:** the deletion flow removed a subset of cached history, but it did not prove removal of the exact live profile, guided-reading draft, manual-assessment draft, session, queue, report, and attempt records. A caller-supplied success boolean could also complete the database request without a subject-bound account of what the browser had actually checked.
**Fix:** define the complete learner-evidence store set, remove or redact every matching identity and evidence field, delete malformed records rather than preserving unverifiable content, read the stores back, and fail closed on storage or removal errors. Send the server a fresh, learner-bound proof naming the exact checked stores and residual count; record it as client-reported cleanup rather than claiming the server verified browser storage.
**Gate:** exact-key, corrupt-record, and failed-removal units must prove cleanup behavior; an empty or mismatched proof must leave the database request open; the exact proof must complete only after database deletion; and the destructive browser journey must use the real cleanup result rather than a fabricated callback.

## D-129 · P0 · Area 5/7/8/10 — Learner deletion left empty interventions and identifying text in shared plans
**Evidence:** removing the learner ID from every intervention could retain a meaningless plan with no learners. When classmates shared a plan, the target learner's name or UUID could remain in the owner, group, focus, activity, or outcome text even after the relational ID was removed.
**Fix:** delete singleton interventions, retain shared interventions for the remaining classmates, redact the deleted learner's display name and UUID from every free-text field, report separate deleted/redacted counts, and make the residual database check reject any affected shared text that still contains either identity.
**Gate:** a database test must create singleton and shared interventions containing both identifiers, prove the singleton is gone, prove the shared plan still names only the classmate, prove all five text fields are clean, and prove the outcome counts distinguish deletion from redaction.

## D-130 · P0 · Area 4/6/7/10 — Repeated answers from one sitting could be reported as Secure
**Evidence:** the legacy reporting fallback treated raw answer count as independent attempts, and class/roster summaries trusted aggregate mastery rows without requiring immutable sitting evidence. Four responses from one activity could therefore satisfy a repetition threshold and appear as secure learning.
**Fix:** use distinct recorded sessions for legacy independence, treat missing session identity as insufficient evidence, and require completed or partial immutable attempts from at least three separate sittings, at least eight scored responses, and at least 85% accuracy before a class or learner summary can say Secure.
**Gate:** reporting-workspace, summary, class-dashboard, roster, and simple-report units must prove same-sitting repetition never becomes Secure, missing immutable history remains insufficient, and genuinely independent evidence still crosses the named threshold.

## D-131 · P0 · Area 5/8/9/10 — Later account-loading awaits could publish after the signed-in identity changed
**Evidence:** the first administrator lookup was generation-bound, but a later administrator-profile fetch, pending-account write, or final publication could still finish after sign-out or an account switch. That continuation could attach the prior identity's privileged or approval state to the new session.
**Fix:** bind every asynchronous account-access stage to one request sequence, expected user ID, and current authentication identity, and revalidate again immediately before publishing the final account state. Stale work may finish but must have no visible side effect.
**Gate:** deterministic held-promise tests must switch identity during the later administrator-profile and pending-account stages, then prove neither stale result is published; the final authenticated race must repeat the identity change against the production controller.

## D-137 · P1 · Area 2/3/9/10 — Paused 3D practice kept advancing animation time and held input
**Evidence:** the animation loop advanced its elapsed-time clock before checking the paused state. A key or touch held when the practice paused also remained active, so resuming could jump an animation phase or continue steering/boosting without a new student action.
**Fix:** use an explicit pausable frame timer that freezes elapsed time, discards all paused frames, and gives the first resumed frame a zero delta. Clear every held keyboard and pointer value on pause, resume, and onboarding dismissal, and ignore new movement input while paused.
**Gate:** executable timing and input-neutralization tests must advance multiple paused frames, prove elapsed time is unchanged, prove the first resumed delta is zero, and prove all held controls return to neutral; the full overlay runtime must remain console-clean.

## D-132 · P0 · Area 3/5/6/9/10 — Settings treated unknown class and student data as settled
**Evidence:** Settings could render empty or actionable class, student, privacy, and sign-in-code controls while the current class/profile/roster read was still loading, failed, or truncated. A busy teacher could mistake unknown data for “nothing saved” and start an action against an unverified scope.
**Fix:** gate every class- and student-scoped Settings action on explicit complete, current-owner read state; show specific loading, incomplete, safety-limit, and retry states; and keep protected controls unavailable until the current scope is verified.
**Gate:** Settings truth units and authenticated desktop/mobile journeys must cover loading, error, truncation, profile loading, retry, and real empty data without false empty or actionable UI.

## D-133 · P0 · Area 3/5/6/9/10 — A successful class-code rotation could hide the new code after a failed refresh
**Evidence:** rotating a class code succeeded on the server, then a best-effort class reload could fail and leave the screen showing the old list or no usable code. Retrying the mutation risked rotating again because the successful new value was not retained as authoritative.
**Fix:** validate and retain the mutation result immediately, show the new code in an isolated copyable confirmation card, label a failed follow-up reload separately, and make retry refresh the class rather than rotate again.
**Gate:** held-response unit/browser journeys must prove one rotation produces one retained new code through a failed reload and that the refresh retry never calls the rotation operation again.

## D-134 · P0 · Area 3/5/6/8/9/10 — Completed deletion could leave a stale student actionable
**Evidence:** after a confirmed permanent deletion, Settings waited for a roster refresh before removing the student locally. If that refresh failed, the deleted student and actions could remain visible, making a completed destructive action look uncertain and inviting invalid follow-up actions.
**Fix:** remove and disable the student in the current local scope as soon as deletion completion is verified, then describe a refresh failure as a separate display-refresh problem with a targeted retry.
**Gate:** deletion/refresh tests must prove the student disappears immediately, no stale action remains enabled, and failed refresh copy says deletion completed while offering only a roster reload.

## D-135 · P0 · Area 5/6/9/10 — Late Settings responses could publish under a different class
**Evidence:** class-code, privacy-history, and related Settings reads/mutations were not all keyed to the class that started them. A held response from Class A could finish after the teacher selected Class B and publish A's status, data, or busy state under B.
**Fix:** bind request generation, result data, feedback, and busy state to the originating class and suppress every completion that no longer owns the current class.
**Gate:** an authenticated held-response journey must switch A to B before releasing A and prove no A code, history, status, or disabled state appears under B.

## D-136 · P1 · Area 3/6/8/10 — Settings and privacy copy exposed stale navigation names and backend language
**Evidence:** teacher-facing Settings and learner-data-rights messages still used retired route names and implementation terms such as cloud-table or synchronization wording, increasing cognitive load in already sensitive workflows.
**Fix:** use the current Students, Assessments, Reports, and Settings names and describe saved, failed, and retained information in ordinary teacher language while keeping legal deletion meaning precise.
**Gate:** rendered-copy contracts and authenticated Settings/privacy journeys must reject the retired terms and preserve clear success, failure, retry, and retention meaning.

## D-138 · P1 · Area 3/5/6/10 — School administration and technical app checks shared one sprawling dashboard
**Evidence:** ordinary school tasks, content QA, release checks, media tools, calibration, map editing, reports, privacy, and account management appeared in one dense navigation and scrolling surface. Technical activity detail also appeared in the default school overview.
**Fix:** split Admin into explicit School administration and App checks areas, show only school pages by default, move technical health and content tools behind App checks, use one selected page at a time, and provide a compact mobile page selector.
**Gate:** authenticated desktop/mobile journeys must prove the default area contains only school administration, technical controls appear only after choosing App checks, and every section remains reachable.

## D-139 · P1 · Area 3/5/9/10 — Reported-question review ignored browser history and direct URLs
**Evidence:** opening the question-review subpage changed only component state. Back and Forward could not reliably leave or restore it, and refreshing/directly opening the route did not own the visible page.
**Fix:** give the page `/admin/question-flags`, synchronize component state from `popstate`, push a marked in-app entry when opening, and distinguish closing an in-app entry from closing a directly loaded page.
**Gate:** navigation units and an authenticated journey must open, Back, Forward, reload, and close the page while URL and visible content stay identical.

## D-140 · P0 · Area 5/6/9/10 — A 40-cell teacher state fixture was reported as production behaviour
**Evidence:** the release ledger claimed five surfaces across eight loading/error/recovery states, but production only selected a subset. Several pages exposed an unused generic override prop, while Offline, Conflict, Retry success, and other cells existed only in the fixture and tests.
**Fix:** remove the state-injection props, catalog only the eleven combinations selected by concrete current read-state branches, document states the app does not claim, and make the release checker reject invented combinations.
**Gate:** the runtime-state gate must render all eleven real combinations, verify their exact production branches and mounts, reject unsupported combinations, and confirm no generic state override remains.

## D-141 · P0 · Area 3/4/6/7/10 — Everyday class reporting remained a second intensive formal report
**Evidence:** the class report put dense reporting tools and a multi-page generic packet in the normal teacher workflow even though formal detail belongs in the standalone EL record. Missing accuracy could also be coerced through `Number(null)` and displayed as a confident 0%.
**Fix:** lead with one quick class view, no more than three teaching priorities and three suggested groups; collapse formal EL/history/download tools; make the everyday printout a single planning page; keep the detailed EL document separate; and treat absent accuracy as “Not enough results.”
**Gate:** report units and authenticated print journeys must prove one concise generic page, a separate route-scoped three-page EL record, period-correct evidence, bounded screen content, and no invented zero or invalid percentage.

## D-142 · P1 · Area 5/8/9/10 — Assessment question reports were saved only on one browser
**Evidence:** the assessment “Report image” and “Report question” controls wrote a local-browser record. An administrator using another device or browser could not see it, a cleared browser lost it, and a local success message did not prove that the school had received anything.
**Fix:** store reports in a private cloud table through one idempotent RPC that accepts either an approved owning teacher or a current student-session token. Return only a bounded acknowledgement to the reporter; rebuild and bound the review snapshot on the server; reject remote image URLs and unapproved fields; allow only app administrators to page through, review, or delete reports; and make reviewer identity and review time server-owned. Retain only a visible count of legacy device-only reports so they are not misrepresented as uploaded.
**Gate:** question-report store units, the fresh-database `assessment_question_reports.sql` actor/ownership/sanitisation proof, and a two-browser authenticated journey must prove that a teacher or valid student can send once, another administrator session can load and review the same report, disabled/foreign/anonymous callers cannot cross the boundary, direct writes and reviewer spoofing fail, and a failed cloud save never says “sent.”

## D-143 · P1 · Area 3/5/9/10 — The Reported questions page was not a complete cold-load or mobile Admin route
**Evidence:** the first history fix lived inside the already-mounted Admin dashboard. A direct or reloaded `/admin/question-flags` URL could restore the teacher’s previous page before Admin mounted, the compact Admin selector did not expose Reported questions, and leaving through the teacher rail could retain the Admin pathname beside a different visible page.
**Fix:** make the exact pathname own the parent Admin view after administrator identity is confirmed; initialize and synchronize the subpage from that pathname; preserve Back and Forward; include Reported questions in the compact Admin picker; and clear the Admin pathname and marked history state whenever the teacher leaves for another main section.
**Gate:** navigation units plus authenticated desktop and 390-pixel journeys must cold-open, reload, Back, Forward, close, select from the compact picker, and leave via the main teacher rail while the pathname and visible page remain identical at every step.

## D-144 · P0 · Area 5/6/9/10 — A failed saved-school lookup could become an editable blank school
**Evidence:** account/profile readiness was used as a proxy for the separate school-name read. A missing row, rejected request, or stale account result could therefore expose an empty School name field and Save action, making unknown saved data look like an intentional blank value.
**Fix:** give the school-name read its own teacher- and school-scoped idle, loading, complete, and error state. Query the exact saved school record, treat a missing name as an error rather than empty data, hide the field and Save action until a complete current-owner read succeeds, and provide a retry that restores the verified value.
**Gate:** school-profile units and Settings loading/error/retry browser journeys must prove that failure or a missing row cannot render an editable blank, a different teacher’s completion cannot publish, and only a complete matching read enables School name and Save.

## D-145 · P1 · Area 3/5/6/10 — Retry replaced the focused control and left keyboard users on the document body
**Evidence:** a teacher could activate Try again, after which React replaced that button with a loading state and later replaced loading with either another error or the recovered page. Browser focus remained on a detached node and fell back to the document body, so the teacher received no reliable indication of whether the retry was running, failed again, or succeeded.
**Fix:** start a bounded recovery-focus watcher when a real retry action is activated. Move focus to the live loading state while the request runs; on repeated failure focus the new enabled recovery action; on success focus the restored page heading; scope the watcher to the replaced state region and disconnect it after resolution or timeout.
**Gate:** recovery-focus units and an authenticated failed-retry/loading/success roster journey must prove the active element follows all three states, every programmatic target has a visible three-pixel focus treatment, and no replaced retry leaves focus on `<body>`.

## D-146 · P1 · Area 3/5/6/10 — An opened report received focus on a clipped or visually silent heading
**Evidence:** the Reports funnel moved focus after opening a result, but its context heading had been visually clipped or suppressed and its focus outline removed. The result therefore changed substantially without a visible keyboard focus destination; a cold or reloaded report could also leave focus outside the opened result.
**Fix:** retain the report-context heading as a compact visible heading, make it programmatically focusable, give it an explicit three-pixel outline, and focus it after Show the report as well as after an owned report cold load or reload.
**Gate:** the authenticated report journey must prove click, direct URL, and reload all focus the visible context heading, computed focus style is a solid three-pixel outline, the report’s first result remains inside the laptop viewport, and the settled chooser remains hidden without removing the result’s context.

## D-147 · P1 · Area 3/5/6/10 — Report disclosures reset after teachers opened, closed, or expanded their contents
**Evidence:** Overview disclosures were driven directly from their initial `defaultOpen` value. React therefore reapplied the default during later report renders, so a teacher’s open/closed choice could be lost when showing more rows or when adjacent report state changed.
**Fix:** use `defaultOpen` only to initialize independent local disclosure state, bind each `<details>` element to that state, and update it from the native toggle event. Keep row expansion state separate so Show all/Fewer cannot reopen a group the teacher closed or close a group they opened.
**Gate:** report-experience units plus an interactive report journey must open and close multiple groups independently, expand and reduce rows inside either group, and prove every disclosure retains the teacher’s choice across those rerenders.

## D-148 · P1 · Area 5/6/9/10 — Sign-in summary and sign-in history shared one failure state
**Evidence:** the 24-hour class sign-in summary and the privacy-minimal event history were separate reads but reused shared busy/error state. A summary failure could clear, hide, or strand a successful history result, while opening history could make the summary look as though it were loading again.
**Fix:** retain independent class-scoped read objects for summary and history, each with its own idle/loading/complete/error data. Retry only the failed source, preserve a successful sibling result, reject stale class results, and render each source’s feedback in its own region.
**Gate:** Settings units and browser journeys must combine summary failure with successful history and history failure with successful summary, then switch classes and retry, proving that one source never clears, relabels, or blocks the other.

## D-149 · P1 · Area 3/5/6/8/10 — Reported-question review controls claimed actions the system had not taken
**Evidence:** review filters used tab-like styling without matching tab semantics, error feedback could be announced as a neutral status, and action/export wording exposed internal decision tokens or implied that a live question or image had been replaced or deleted. The implementation only records an administrator’s review decision and can delete the report itself.
**Fix:** expose the filters as an ordinary labelled button group with `aria-pressed`; announce failures as alerts; use plain labels such as “Record question problem” and “Record no change needed”; translate stored decision tokens before display/export; and make report deletion explicitly state that the assessment question and image remain unchanged.
**Gate:** review-note/store units and an authenticated keyboard/browser journey must prove truthful accessible filter state, plain decision labels, alert semantics on failure, server-saved review ownership, and a two-step Delete report flow that never claims to alter live assessment content.

## D-150 · P1 · Area 2/3/6/7/10 — Formal EL screens and exports exposed routing-system terminology to teachers
**Evidence:** the formal EL panel, assessment runner, individual report, PDF, and workbook could display implementation terms including route, microphase, candidate microphase, decoding band, and route judgment. Those labels describe internal sequencing rather than the assessment decision a teacher needs to understand or record.
**Fix:** present the selection as grade and time of year, the runner sequence as the assessment plan, placement as a starting/suggested/teacher-confirmed reading stage, and the outcome as a next-step decision. Apply the same translation to legacy presentation and every visible workbook cell without changing immutable assessment evidence.
**Gate:** formal-EL language, report, export-copy, legacy-label, and browser contracts must find the teacher terms across the panel, runner, finished report, PDF and Excel workbook and no system-facing route or microphase token.

## D-151 · P1 · Area 3/5/6/10 — Archived students formed an unbounded list at the bottom of Students
**Evidence:** the active roster was paginated, but every archived student for the class rendered in one disclosure. A school with years of departures therefore regained the same scrolling and keyboard burden the active-roster redesign removed, with no way to find one former student quickly.
**Fix:** filter archived students to the selected class, sort them by display name, add a case-insensitive search, show at most ten matching rows per page, use the shared bounded pagination window, clamp stale pages, reset search/page on class changes, and announce truthful matching counts and empty-search results.
**Gate:** archived-roster units and a 25-student browser fixture must prove ten/five row pages, search and clear-search behavior, class isolation, page clamping/reset, current-page semantics, bounded controls, and a live matching-count announcement.

## D-152 · P1 · Area 5/8/9/10 — Archiving a student did not reliably revoke child access
**Evidence:** the normal archive action and the retention-policy fallback could leave a live student session usable. An archived learner could therefore sign in again or continue submitting assessment-question reports even though the teacher-facing roster treated the account as inactive.
**Fix:** make every archive path revoke all current learner sessions atomically, reject archived learners at class lookup, sign-in, token validation, learning-write, and question-report boundaries, and keep reactivation an explicit teacher-owned action rather than a side effect.
**Gate:** fresh-database archive/session SQL plus authenticated teacher/child browser journeys must prove that both archive paths invalidate an existing session, prevent a fresh sign-in and question report, preserve active classmates, and allow access only after an explicit teacher reactivation.

## D-153 · P1 · Area 5/7/8/10 — Question reports were omitted from learner export and deletion
**Evidence:** `assessment_question_reports` could contain a learner identifier and saved question snapshot, but learner export did not include those records and permanent deletion did not remove or explicitly retain them. The foreign key's `SET NULL` behaviour could hide the residual row from the post-delete learner check without removing the learner-linked content.
**Fix:** include the learner's own question reports in the private export, delete them during permanent learner deletion, and verify both direct identifiers and subject-bearing snapshots are absent before reporting zero residual records.
**Gate:** learner-data-rights units and transactional SQL must create learner question reports, prove they appear only in that learner's export, delete the learner, and fail unless the reports and every subject-bearing residual are gone.

## D-154 · P1 · Area 5/7/8/10 — Shared planning and observation records could retain deleted learner details
**Evidence:** shared observations, group reviews, and intervention records could retain a deleted learner's display name or UUID inside free text, arrays, or JSON even after the direct target relationship was removed. A direct-column residual count therefore understated the privacy residue.
**Fix:** treat every supported structured and free-text learner reference as part of deletion, remove singleton records, rebuild shared records for remaining learners, redact exact subject identifiers/names without damaging classmates' evidence, and fail closed if a post-delete scan finds a residual.
**Gate:** a fresh-database deletion exercise must cover singleton and shared observation, review, and intervention shapes, preserve unrelated classmates, and prove the deleted learner's UUID and normalized display name are absent from all retained payloads.

## D-155 · P1 · Area 4/6/7/10 — Transferred students lost former-class evidence from formal reports
**Evidence:** lifetime totals could count attempts from a student's former class while the formal report rows and heatmap queried only the current class. The same report could therefore claim more evidence than it showed and omit legitimate assessment history after a school-owned transfer.
**Fix:** scope formal student evidence by student ownership and assessment time rather than only the current class, label former-class context where useful, keep current-class roster access rules intact, and make all totals, rows, heatmaps, exports, and provenance count the same eligible attempts.
**Gate:** transfer SQL, report-builder units, and an authenticated transfer/report journey must prove that owned pre-transfer attempts remain visible and reconciled, foreign-school evidence remains inaccessible, and every displayed total equals its underlying rows.

## D-156 · P1 · Area 5/8/9/10 — Anonymous error ingestion could bypass throttling by rotating one fingerprint
**Evidence:** the anonymous monitoring endpoint limited one caller-supplied or easily rotated fingerprint at a time. A client could cycle that value and create an unbounded error stream even though each individual key appeared below its limit.
**Fix:** apply server-derived layered limits across short-lived caller, device/network bucket, and global ingestion windows; bound payload size and vocabulary; retain privacy-preserving hashes only; and return a generic acknowledgement without exposing monitoring state.
**Gate:** error-monitoring SQL and browser/API checks must prove per-key rotation cannot exceed the broader bucket, oversized or malformed payloads fail, normal bounded reports succeed, and no raw network address, token, class code, or learner detail is retained.

## D-157 · P1 · Area 5/8/9/10 — Rolling-release fallback restored retired insecure child-login RPCs
**Evidence:** when the secure device-aware student RPC overload was missing, the client retried the old class-code or student-login signature. A frontend deployed ahead of its database could therefore bypass the device, network, and class-code throttles introduced by the secure migration.
**Fix:** fail closed when either secure overload is unavailable, show the existing child-safe recovery state, never call the retired anonymous signatures, and require the backend migration to complete before child access resumes.
**Gate:** compatibility units and the class-access security verifier must prove exactly one device-aware call, a `migration-required` failure on `PGRST202`, no retired call shape in source or runtime, and unchanged handling of ordinary permission/network errors.

## D-158 · P2 · Area 5/8/9/10 — One valid student session could flood the question-report queue
**Evidence:** question-report submission validated the learner token and idempotency key but had no durable per-session or per-learner quota. A valid child session could submit unlimited unique reports and overwhelm the administrator review queue.
**Fix:** enforce bounded server-owned rolling quotas per learner session, learner, and school, preserve idempotent retries, return one plain retry-later response, and keep administrator review/delete activity outside the student quota.
**Gate:** transactional question-report SQL must prove duplicate retries remain one record, unique reports stop at each configured boundary, another active learner retains a fair allowance, archived/expired sessions fail, and direct table writes remain blocked.

## D-159 · P2 · Area 5/7/8/10 — Learner exports could disclose classmates through shared records
**Evidence:** shared intervention labels, notes, reviews, or saved snapshots could include other learners' names or identifiers when exported for one child. Returning the complete shared payload would satisfy record inclusion while violating the classmates' privacy.
**Fix:** project shared records into a subject-only export view, retain only the requested learner's role and evidence, replace group context with non-identifying counts where necessary, and exclude or redact peer labels, names, UUIDs, and snapshots.
**Gate:** learner-export SQL must seed mixed shared records and prove the subject receives all entitled evidence while no classmate name, UUID, login picture, note, or answer snapshot appears in the exported payload.

## D-160 · P2 · Area 5/8/9/10 — Unapproved accounts could create unlimited schools
**Evidence:** `find_or_create_school` was reachable before an account became approved and could create a new school on repeated calls. Pending, rejected, or disabled users could therefore mutate tenant data despite the broader teacher-account restrictions.
**Fix:** require an approved teacher or administrator for school creation and matching, keep signup requests separate from tenant mutation, normalize and de-duplicate names server-side, and rate-limit any public discovery path without revealing private school records.
**Gate:** four-account-state SQL must prove only approved teachers and administrators can create or select a school, non-approved calls create no rows, repeated approved calls are idempotent, and one school cannot enumerate another school's private data.

## D-161 · P2 · Area 5/8/9/10 — Account approval audit identity and time were client-controlled
**Evidence:** the approval workflow accepted reviewer identity or review timestamps from a client-visible mutation path. A pending user or compromised client could falsify who approved an account or when the decision was made even if the final status transition was otherwise restricted.
**Fix:** move every approval/rejection/disable transition behind an administrator-only RPC, derive actor identity and timestamp from the authenticated database context, reject direct writes to audit-owned fields, and preserve an append-only decision trail.
**Gate:** account-status SQL must prove pending and ordinary teacher actors cannot change status or audit metadata, administrator decisions record the real actor/server time, forged payload fields are ignored or rejected, and prior decisions cannot be rewritten.

## D-162 · P1 · Area 4/6/7/9/10 — Incomplete report reads rendered confident empty teaching claims
**Evidence:** failed, partial, or not-yet-complete report sources could flow through zero-valued defaults and render statements such as no exposure, no correct answers, or nothing yet learned. Those are teaching conclusions, not safe representations of unavailable evidence.
**Fix:** make source completeness load-bearing for every report calculation, suppress the report body until required reads are complete, show a compact unavailable/retry state, and never convert missing counts or accuracy into zero.
**Gate:** report-model units and authenticated held/failing-read journeys must prove loading, error, partial, empty-complete, and populated-complete states remain distinct and only the two complete states can render teaching conclusions or exports.

## D-163 · P1 · Area 4/5/6/9/10 — A support plan could be saved with no students
**Evidence:** the support planner allowed its final learner selection to be removed and the database accepted an empty target array. The resulting plan appeared valid but could not guide or evidence support for any child.
**Fix:** require at least one active student in the selected class in both the interface and database function, disable Save with a plain explanation when the selection is empty, and reject archived, duplicate, foreign-class, or foreign-school targets server-side.
**Gate:** planner units, intervention SQL, and an authenticated browser journey must prove zero targets cannot save, valid targets can, stale/foreign targets fail without a false success, and the saved plan contains exactly the current visible selection.

## D-164 · P1 · Area 3/4/5/6/9/10 — Planned support did not reliably return to Today for follow-through
**Evidence:** the plan → teach → note → review loop could exclude work scheduled for today, while delivered or recorded entries without a next date disappeared from the teacher's action list. Collapsed details made the lifecycle still harder to recover during a busy day.
**Fix:** define explicit due-today, overdue, delivered-needs-note, recorded-needs-review, and completed states; surface the next required action on Today; keep the relevant item expanded when opened from Today; and require or derive a truthful next date whenever work remains.
**Gate:** intervention-state units and a multi-day authenticated browser journey must move one plan through every lifecycle state and prove the correct action appears once on Today, survives reload, records ownership/time, and disappears only after the work is genuinely complete.

## D-165 · P2 · Area 3/5/6/9/10 — Changing class could carry the old learner into the support planner
**Evidence:** if the planner remained open while the teacher changed class, its local learner selection could survive and show or submit a student from the previous class under the new class context.
**Fix:** key planner draft state to the selected class, clear or rehydrate targets on every class change, validate every visible and submitted learner against the current roster, and announce the reset without silently discarding a saved server record.
**Gate:** an authenticated class-switch journey must open a draft for Class A, switch to Class B before saving, prove no A learner remains visible or submitted, and then save a valid B-only plan.

## D-166 · P2 · Area 3/5/6/9/10 — Saving “Never” expiry displayed the previous date
**Evidence:** the server correctly returned an explicit `null` expiry for “Never”, but client reconciliation used nullish fallback and restored the old date. The saved setting and the visible setting therefore disagreed until a later full refresh.
**Fix:** distinguish an explicit saved `null` from an absent response field, publish the server-owned setting immediately, and retain the old value only when the save itself fails.
**Gate:** settings-model units and an authenticated save/reload journey must move from a dated expiry to Never and back, prove visible/server parity after each response, and preserve the prior choice on failure without claiming success.

## D-167 · P2 · Area 3/6/10 — Signup called the email address a “Sign-in name”
**Evidence:** the registration form labelled the account email as a “Sign-in name” even though teachers subsequently authenticate with their email address. The wording introduced an unnecessary invented credential during an already unfamiliar approval flow.
**Fix:** label the field and all supporting/error copy as “Email address”, retain standard email autocomplete and validation semantics, and explain approval in ordinary school language without business or system terminology.
**Gate:** auth-copy units and the signed-out registration journey must expose one correctly labelled email field, no “Sign-in name” wording, working validation, and the same email-based sign-in explanation after submission.

## D-168 · P2 · Area 3/5/6/9/10 — Planned support could not be edited, rescheduled, cancelled, or removed
**Evidence:** once a support record was created, a teacher could add progress but could not correct its focus, learners, owner, schedule, or mistaken creation. The only practical workaround was to leave misleading work in the active lifecycle.
**Fix:** provide explicit Edit, Reschedule, Cancel, and Delete draft actions with role/ownership checks, preserve immutable delivery/review evidence, require a reason for cancelling delivered work, and keep every change in a plain audit history.
**Gate:** intervention SQL, units, and authenticated keyboard journeys must cover draft edit/reschedule/delete, delivered cancellation with reason, denied foreign-school changes, accurate Today resurfacing, and immutable historical events.

## D-169 · P0 · Area 5/8/9/10 — The configured hosted database was behind the audited application schema
**Evidence:** the configured hosted Supabase project exposed only 27 of 35 required application RPCs. Eight teacher transfer, deletion, login-picture, progress-reset, assessment-report, and empty-class operations existed in the clean local schema but not in the deployed database, so the hosted app could fail even while local tests passed.
**Fix:** link the exact hosted project through an authorized deployment identity, compare its migration ledger with the repository, back up and dry-run the pending set, apply every reviewed migration in order, and verify the live function, privilege, RLS, and browser contracts against that same project.
**Gate:** the hosted `check:live-database` inventory must pass every current required RPC and signature, the live policy verifier must pass all actor/account/tenant boundaries, and authenticated hosted teacher journeys must exercise the previously missing operations without fallback or console/network error.
