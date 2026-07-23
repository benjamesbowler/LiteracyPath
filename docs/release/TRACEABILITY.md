# Release traceability

This ledger is the authoritative status map for `TEN_OUT_OF_TEN_PLAN_2026-07-23.md`.

Status values are limited to `TODO`, `IN-PROGRESS`, `DONE`, `WAIVED`, `EXTERNAL-READY`, and `EXTERNAL-CLOSED`. A row may become `DONE` only when its named gate passes against the reachable product and the evidence column links to the validating commit and release-manifest entry.

| Item | Area | Priority | Status | Named gate | Evidence |
|---|---:|---|---|---|---|
| A1.1 | 1 | P0 | TODO | `check:curriculum-release-standard` | — |
| A1.2 | 1 | P0 | TODO | `check:assessment-runtime-variation` + `check:runtime-variation-simulation` | — |
| A1.3 | 1 | P0 | TODO | `check:media-runtime-resolution` | — |
| A1.4 | 1 | P1 | TODO | strict audit balance report | — |
| A1.5 | 1 | P1 | TODO | `check:skill-progression` | — |
| A1.6 | 1 | P1 | TODO | admin content-QA route test | — |
| A1.7 | 1 | P2 | TODO | Guided Reading student-mode smoke test | — |
| A1.8 | 1 | P1 | TODO | `check:assessment-question-integrity` active-image flags | — |
| A1.9 | 1 | P2 | TODO | decoding-support unit + teacher-report route tests | — |
| A1.10 | 1 | P1 EXTERNAL | TODO | expert/pilot pack external-readiness check | — |
| A2.1 | 2 | P1 | TODO | student-home hierarchy DOM + screenshot test | — |
| A2.2 | 2 | P1 | TODO | seeded continuation CTA DOM test | — |
| A2.3 | 2 | P1 | TODO | daily-mission completion E2E | — |
| A2.4 | 2 | P1 | TODO | seeded student-card state DOM test | — |
| A2.5 | 2 | P2 | TODO | rail a11y-name + settings-persistence tests | — |
| A2.6 | 2 | P1 | TODO | student-login recovery E2E | — |
| A2.7 | 2 | P3 | TODO | student-login screenshot test | — |
| A2.8 | 2 | P2 | TODO | Guided Reading control-hierarchy DOM test | — |
| A2.9 | 2 | P2 | TODO | Sound Racer target/tutorial unit test | — |
| A2.10 | 2 | P1 | TODO | fullscreen-overlay semantic sweep | — |
| A3.1 | 3 | P2 | TODO | child-surface rules route checklist | — |
| A3.2 | 3 | P2 | TODO | key-route visual + throttled-placeholder tests | — |
| A3.3 | 3 | P0 | TODO | `check:a11y-routes` | — |
| A3.4 | 3 | P1 | TODO | learner accessibility-settings E2E | — |
| A3.5 | 3 | P1 | TODO | overlay contrast + focus-visible sweep | — |
| A3.6 | 3 | P1 | TODO | `check:device-matrix` | — |
| A3.7 | 3 | P2 | TODO | reader line-length template test | — |
| A3.8 | 3 | P2 | TODO | locked-item DOM + contrast test | — |
| A3.9 | 3 | P2 | TODO | student emphasis-budget visual checklist | — |
| A3.10 | 3 | P1 | TODO | media-failure refill + evidence-image a11y tests | — |
| A4.1 | 4 | P1 | TODO | learning-policy minimum-evidence unit + route tests | — |
| A4.2 | 4 | P1 | TODO | learning-policy threshold grep guard | — |
| A4.3 | 4 | P1 | TODO | class-summary aggregation unit + DOM tests | — |
| A4.4 | 4 | P1 | TODO | recommendation-explanation DOM tests | — |
| A4.5 | 4 | P1 | DONE | `lint --max-warnings=0` + focused regression tests | `docs/release/artifacts/2026-07-23T12-46-12-124Z/manifest.partial.json`: lint, 976 unit tests, build, 10 desktop/mobile smoke journeys, authenticated teacher/admin routes, and bundle budget all pass |
| A4.6 | 4 | P0 | TODO | `check:release-readiness-surface` + export completeness | — |
| A4.7 | 4 | P1 | TODO | activity-queue unit + sync-health + chaos tests | — |
| A4.8 | 4 | P0 | IN-PROGRESS | composed curriculum gate in `check:release` | Implementation added; full manifest evidence pending Phase 0 exit |
| A4.9 | 4 | P0 | TODO | route-level teacher-data + product-finish gates | — |
| A4.10 | 4 | P1 EXTERNAL | TODO | calibration dashboard + protocol external-readiness check | — |
| A5.1 | 5 | P1 | TODO | teacher-nav DOM + old-route redirect tests | — |
| A5.2 | 5 | P0 | TODO | seeded Today briefing E2E | — |
| A5.3 | 5 | P1 | TODO | persistent teacher-context E2E | — |
| A5.4 | 5 | P0 | TODO | dashboard parity matrix + route test + dead-branch grep guard | — |
| A5.5 | 5 | P1 | TODO | fresh-teacher onboarding E2E | — |
| A5.6 | 5 | P1 | TODO | roster-scale import/bulk/archive/transfer E2E | — |
| A5.7 | 5 | P2 | TODO | class-code feedback interaction + a11y test | — |
| A5.8 | 5 | P1 | TODO | print-route test + `document.write` grep guard | — |
| A5.9 | 5 | P2 | TODO | teacher student-preview safety E2E | — |
| A5.10 | 5 | P1 | TODO | intervention lifecycle E2E | — |
| A6.1 | 6 | P0 | IN-PROGRESS | deterministic audit-school seed used in CI | SQL assertions and live Auth/RLS gate pass locally; CI manifest evidence pending P0.5 |
| A6.2 | 6 | P1 | TODO | teacher roster device-matrix + drawer tests | — |
| A6.3 | 6 | P2 | TODO | contextual teacher-help reachability DOM test | — |
| A6.4 | 6 | P1 | TODO | teacher-dashboard urgency DOM-order test | — |
| A6.5 | 6 | P1 | TODO | shared-feedback adoption guard + a11y tests | — |
| A6.6 | 6 | P1 | TODO | metric-definition DOM + export snapshot tests | — |
| A6.7 | 6 | P0 | TODO | `check:a11y-teacher` | — |
| A6.8 | 6 | P2 | TODO | assessment-hub nav copy test | — |
| A6.9 | 6 | P1 | TODO | teacher state-matrix fixture tests | — |
| A6.10 | 6 | P1 | TODO | teacher UI duplication guard + visual snapshots | — |
| A7.1 | 7 | P0 | TODO | route-level teacher-data + product-finish gates | — |
| A7.2 | 7 | P0 | TODO | report release-readiness + 500-item export test | — |
| A7.3 | 7 | P1 | TODO | class-to-item-evidence E2E | — |
| A7.4 | 7 | P1 | TODO | evidence-basis + insufficient-evidence DOM tests | — |
| A7.5 | 7 | P1 | TODO | seeded growth-chart + version-marker tests | — |
| A7.6 | 7 | P2 | TODO | instructional-group lifecycle E2E | — |
| A7.7 | 7 | P1 | TODO | insight-action DOM sweep | — |
| A7.8 | 7 | P2 | TODO | evidence-version migration + replay test | — |
| A7.9 | 7 | P1 | TODO | PDF/Excel/CSV provenance snapshots | — |
| A7.10 | 7 | P2 | TODO | three report-template + plain-language tests | — |
| A8.1 | 8 | P1 | TODO | `check:db-policies` | — |
| A8.2 | 8 | P0 + EXTERNAL REVIEW | TODO | leaderboard DB policy tests + privacy-review readiness | — |
| A8.3 | 8 | P1 | TODO | class-code rate-limit + access-log tests | — |
| A8.4 | 8 | P1 | TODO | enforced CSP header + violation tests | — |
| A8.5 | 8 | P0 | TODO | `npm audit` high/critical gate + export snapshots | — |
| A8.6 | 8 | P1 | TODO | remote-error redaction + delivery tests | — |
| A8.7 | 8 | P1 | TODO | isolated restore-drill evidence | — |
| A8.8 | 8 | P1 | TODO | seeded learner data-rights E2E | — |
| A8.9 | 8 | P1 | TODO | retention-job unit tests + disclosure docs | — |
| A8.10 | 8 | P0 EXTERNAL | TODO | legal-pack external-readiness check | — |
| A9.1 | 9 | P1 | IN-PROGRESS | enforced main-entry bundle budget | Exact Phase 0 baseline is frozen and dated ratchets are enforced; `docs/release/artifacts/2026-07-23T12-11-25-561Z/manifest.partial.json` passes; final 500 kB raw / 150 kB gzip WS9 target remains open |
| A9.2 | 9 | P1 | TODO | route/data chunk + first-load network budgets | — |
| A9.3 | 9 | P1 | TODO | zero ineffective dynamic imports + split-boundary guard | — |
| A9.4 | 9 | P1 | TODO | eval-free build + 500-item export memory test | — |
| A9.5 | 9 | P1 | TODO | `App.jsx` line-count ratchet + full tests | — |
| A9.6 | 9 | P0 | TODO | dashboard consolidation + reachable route contracts | — |
| A9.7 | 9 | P2 | TODO | deep-link + refresh/resume E2E | — |
| A9.8 | 9 | P1 | TODO | domain-boundary validation + Supabase-call-site guard | — |
| A9.9 | 9 | P1 | TODO | fleet-health dashboard + error-budget evidence | — |
| A9.10 | 9 | P1 | TODO | `check:sync-chaos` | — |
| A10.1 | 10 | P0 | IN-PROGRESS | required whole-product CI release job | `release-gate` job implemented with fresh DB, audit seed, manifest artifact, and enforced result; hosted CI + branch-protection evidence pending |
| A10.2 | 10 | P0 | IN-PROGRESS | `check:release` manifest + generated scorecard | Implementation added; full manifest and scorecard evidence pending Phase 0 exit |
| A10.3 | 10 | P1 | DONE | zero-warning lint gate | CI invokes `npm run lint -- --max-warnings=0`; `docs/release/artifacts/2026-07-23T12-46-12-124Z/manifest.partial.json` proves zero warnings with focused route and lifecycle regressions |
| A10.4 | 10 | P1 | DONE | enforced bundle budgets + PR trend table | `docs/release/artifacts/2026-07-23T12-11-25-561Z/manifest.partial.json` passes build + budget; dated config, Markdown/JSON artifacts, and CI step summary are enforced |
| A10.5 | 10 | P2 | DONE | zero-failure baselined repo hygiene | `docs/release/artifacts/2026-07-23T12-20-36-943Z/manifest.partial.json`: 0 failures; explicit preview/generated allowlist in `tools/hygiene-baseline.json` |
| A10.6 | 10 | P2 | DONE | read-only audit check-mode guard | Same manifest passes OS-constrained `--check` write redirection; 23 report commands have paired check modes and canonical tracked reports remain unchanged |
| A10.7 | 10 | P1 | TODO | `check:e2e-teacher` | — |
| A10.8 | 10 | P0 + EXTERNAL MANUAL AUDIT | TODO | automated a11y gates + manual-program readiness | — |
| A10.9 | 10 | P1 | TODO | live admin content-QA route + Loop D board test | — |
| A10.10 | 10 | P1 EXTERNAL | TODO | research-program external-readiness check | — |

## Discovered findings

These rows are mechanically consumed by the scorecard. Each ID also has a full evidence, fix, and gate specification in `DISCOVERED.md`.

| Item | Area | Priority | Status | Named gate | Evidence |
|---|---:|---|---|---|---|
| D-001 | 7, 8 | P0 | TODO | seeded cross-export evidence-consistency integration test | `DISCOVERED.md` D-001 |
| D-002 | 7 | P0 | TODO | zero-evidence export interstitial + empty-export snapshot | `DISCOVERED.md` D-002 |
| D-003 | 4, 7 | P1 | TODO | per-attempt timestamp provenance export test | `DISCOVERED.md` D-003 |
| D-004 | 1, 4, 7 | P1 | TODO | skill-spine reconciliation + evidence-basis export tests | `DISCOVERED.md` D-004 |
| D-005 | 4, 6 | P1 | TODO | assessment-item directive DOM + administration-copy review | `DISCOVERED.md` D-005 |
| D-006 | 3, 4, 6 | P0 | TODO | assessment completion device-matrix E2E | `DISCOVERED.md` D-006 |
| D-007 | 6 | P1 | TODO | assessment header copy DOM + jargon guard | `DISCOVERED.md` D-007 |
| D-008 | 9 | P2 | TODO | assessment deep-link refresh/resume E2E | `DISCOVERED.md` D-008 |
| D-009 | 4 | P2 | TODO | final-item correction + finish-tally E2E | `DISCOVERED.md` D-009 |
| D-010 | 8, 10 | P0 | DONE | `check:database-bootstrap-schema` + fresh local Supabase reset | Fresh local reset applied all 20 migrations; canonical `docs/release/manifest.json` passes schema reconstruction, deterministic seed, live Auth, fixtures, and RLS isolation |
| D-011 | 9 | P2 | DONE | reachable teacher dashboard/report Playwright journey | Zero `pageerror` events; `docs/release/artifacts/2026-07-23T11-59-30-807Z/manifest.partial.json` passes all three authenticated route gates |
| D-012 | 10 | P1 | DONE | canonical-env `test:smoke` preview-route journey | Same partial manifest passes 10/10 desktop/mobile smoke tests against the maintained `/preview/` entry points under canonical Supabase configuration |
