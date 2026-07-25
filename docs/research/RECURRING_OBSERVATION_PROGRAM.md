# Recurring teacher and child observation programme

Status: `EXTERNAL-READY`; recruitment and human sessions are not started.

## Purpose and boundary

This programme turns representative teacher and child observations into owned,
testable release criteria. It does not establish efficacy, accessibility,
fairness, or validation by preparation alone. It uses the consent, assent,
privacy, stopping, data, and revision rules in the existing research pack.

## Cadence and triggers

- baseline cycle before production launch;
- monthly cycles for the first three months of live school use;
- quarterly cycles thereafter;
- an additional cycle after material changes to curriculum scope/sequence,
  scoring, recommendations, reports, teacher workflows, child navigation,
  accessibility modes, audio, motion, or supported devices.

The study owner freezes the exact app release, curriculum/policy versions,
tasks, recruitment targets, and analysis decisions before each cycle.

## Representation targets

These are recruitment targets, not achieved samples or statistical power
claims. Overlap between groups is expected and recorded.

- teachers from at least two schools, including classroom teachers,
  intervention/specialist staff, and a mix of first-time and familiar users;
- children across ages 5–10 and emergent, early, and transitional reading
  levels;
- multilingual learners, including different English-exposure histories;
- learners who use or would benefit from accessibility settings or assistive
  technology, including visual, hearing, motor, attention, language, and
  reading-support needs;
- a mix of supported phone, tablet, Chromebook/laptop, keyboard, touch, muted
  audio, and reduced-motion conditions.

Do not exclude a participant to improve completion or accuracy. Do not publish
small subgroup cells; the existing minimum-five suppression applies. Qualitative
representation does not justify subgroup outcome claims.

## Cycle structure

1. Confirm approvals, school permission, parent/guardian consent, teacher
   consent, child assent, safeguarding route, withdrawal, and incident process.
2. Run adult-only technical rehearsal on non-production data.
3. Observe first-use tasks without coaching beyond the protocol.
4. Observe familiar-use tasks after normal classroom exposure.
5. Include sign-in/recovery, recommended next step, one learning activity,
   Guided Reading, teacher class/learner navigation, assessment, report
   interpretation, export, and an intentional error/offline recovery.
6. Apply the A10.8 modes where relevant: screen reader, keyboard/switch, 200%
   zoom, audio off, and motion off.
7. Export only de-identified structured observations and record deviations,
   missingness, adult prompts, withdrawals, and stopped tasks.
8. Triage findings and make a release decision before expanding the cycle.

## Finding-to-release-criteria pipeline

Every finding receives a stable ID and the fields required by
`REVISION_WORKFLOW.md`. In addition:

- critical and major findings are appended to `docs/release/DISCOVERED.md`;
- affected plan items are set to `IN-PROGRESS` in
  `docs/release/TRACEABILITY.md`;
- the owner writes an acceptance criterion that can fail before the fix;
- mechanizable criteria become permanent unit, browser, content, security, or
  release gates;
- non-mechanizable criteria receive an independent human retest;
- the correction commit, exact release manifest, human verifier, and retest
  evidence are linked to the finding;
- repeat findings require root-cause escalation and cannot be closed by another
  rerun.

The author cannot self-close a critical/major educational, accessibility,
privacy, or safeguarding finding. A cycle cannot be called clean while such a
finding remains open.

## Required cycle record

- cycle ID, dates, owner, frozen releases/versions, and approved protocol;
- recruitment target and actual consented/assented/attempted/completed counts;
- representation table with suppressed small cells;
- task and device/assistive-technology coverage;
- deviations, withdrawals, stopped tasks, incidents, and missingness;
- finding register and severity/owner/due date;
- correction criteria, gates, re-review/retest, and release decision;
- limitations and explicitly unsupported claims.

Only real signed/linked cycle evidence may change A10.10 from
`EXTERNAL-READY` to `EXTERNAL-CLOSED`.
