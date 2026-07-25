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
