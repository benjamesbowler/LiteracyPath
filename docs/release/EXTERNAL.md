# External dependencies

Codex may prepare these items but must never simulate or self-certify the required human work.

| Item | Human dependency | Status | Owner | Prepared evidence | Human closure evidence |
|---|---|---|---|---|---|
| A1.10 | Expert curriculum review and pre/post pilot | EXTERNAL-READY | Ben | `docs/research/`: versioned pack manifest, measurement plan, independent 30-skill review rubric, child/teacher pilot protocol, consent/assent/withdrawal templates, de-identified data dictionary, evidence-to-revision workflow, validated CSV/JSON exporter, descriptive summary script and permanent readiness gate. Human execution not started; no human results or certification claimed. | — |
| A2 pilot | Child usability observation, delivered through the A1.10 pack | EXTERNAL-READY | Ben | `docs/research/PILOT_PROTOCOL.md` includes first-use/familiar-use child tasks, observable outcomes, assent, stop rules, adult-prompt logging, accessibility barriers and recovery checks. Human execution not started. | — |
| A4.10 | Literacy-specialist threshold and difficulty calibration | EXTERNAL-READY | Ben | `docs/research/CALIBRATION_PROTOCOL.md` and its machine-readable manifest freeze the item-difficulty, threshold-stability, false-positive reteach adjudication, subgroup suppression, and matched differential-item workflow. The admin Calibration section is implemented with 72 synthetic participants and 1,152 deterministic preview events, unmistakable non-child-evidence labeling, small-cell suppression, provisional review queues, and no automatic threshold, fairness, bias, or validity conclusion. Human execution not started; no observed outcome, specialist judgment, calibration, efficacy, or fairness claim is made. | — |
| A8.2 review | Privacy/security review of the live leaderboard RPC | READY | Ben | Token-derived class/school scope, pseudonym-only response, teacher opt-in, fail-closed live DB gate, and `docs/legal/LEADERBOARD_PRIVACY.md` | — |
| A8.10 | Qualified legal review of the compliance pack | EXTERNAL-READY | Ben | `docs/legal/` contains the versioned 12-document pack and public-policy sync: draft ToS and DPA, provider/subprocessor and region/transfer register, security and accessibility summaries, incident process, school/parent/learner notices and consent/assent materials, COPPA/FERPA/PPRA/UK/EU decision matrix, candid unresolved deployment facts, and an unchecked counsel review record. Implementation commit `6d77c791`; `docs/release/artifacts/2026-07-25T03-21-54-118Z/manifest.partial.json` passes lint, 1,228 tests, build, and the fail-closed legal-pack gate. No legal approval, executed contract, lawful-basis decision, provider-region confirmation, transfer approval, or compliance certification is claimed. | — |
| A10.8 manual | Manual assistive-technology audits | EXTERNAL-READY | Ben | Human-readable 17-route/7-state/two-viewport inventory, automated serious/critical gates, six-mode manual programme, dated target calendar, stop/retest rules, and the unexecuted first-run record below. Human execution not started; no auditor or child result is claimed. | — |
| A10.10 | Recurring teacher and child observation programme | EXTERNAL-READY | Ben | `docs/research/RECURRING_OBSERVATION_PROGRAM.md` defines launch/monthly/quarterly/trigger cycles, representative teacher/age/reading-level/multilingual/accessibility recruitment targets, consent/assent and stop rules, required records, and a finding-to-release-criteria pipeline. Recruitment and human sessions have not started. | — |

## A10.8 manual audit calendar

The full programme and platform/mode requirements are in
`docs/accessibility/MANUAL_AUDIT_PROGRAM.md`. These are target windows only;
they do not claim that an auditor, school, teacher, parent, or child is booked.

| Target date | Planned work | Human owner confirmation |
|---|---|---|
| 2026-08-03 | Adult test-data rehearsal | Unconfirmed |
| 2026-08-10 | Screen reader plus keyboard/switch | Unconfirmed |
| 2026-08-12 | 200% zoom, audio-off, motion-off | Unconfirmed |
| 2026-08-17 | Child usability, only after approvals/consent/assent | Unconfirmed |
| 2026-08-21 | Triage and independent retest plan | Unconfirmed |
| 2026-11-16 | First quarterly recurrence | Unconfirmed |

## A10.8 first-run record — unexecuted template

Copy this block for the real run. Do not tick a box from automated Axe output or
from preparation of this document.

- [ ] Human audit owner and independent verifier recorded
- [ ] Exact app release, curriculum version, inventory version, date, and
  non-production environment recorded
- [ ] OS, browser, assistive-technology/input versions, viewport, zoom, audio,
  and motion settings recorded
- [ ] Screen-reader run completed
- [ ] Switch/keyboard-only run completed
- [ ] 200% zoom run completed
- [ ] Audio-off run completed
- [ ] Motion-off run completed
- [ ] Child-usability run completed after school/guardian/child permissions
- [ ] All 17 primary routes attempted
- [ ] All 7 key modal/overlay states attempted
- [ ] Withdrawals, stopped tasks, deviations, incidents, and missing coverage
  recorded, including explicit zero statements only when observed
- [ ] Every finding has ID, severity, evidence, containment, owner, due date,
  acceptance gate, release decision, and independent retest requirement
- [ ] Critical/major mechanizable findings added to permanent release gates
- [ ] Unresolved limitations and unsupported claims recorded

Actual run ID: —

Actual dates: —

Auditor/reviewer role codes: —

Evidence location: —

Open critical findings: —

Open major findings: —

Release decision: not assessed
