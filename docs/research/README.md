# LiteracyPath expert-review and pilot pack

This directory is the execution-ready external research pack for A1.10, the
child-usability observation attached to Area 2, and the A4.10
item-difficulty/threshold calibration programme. It prepares the work; it does
not claim that a literacy expert, measurement specialist, teacher, child,
parent, school, ethics body, or legal adviser has reviewed or approved
LiteracyPath.

The machine-readable status is in `PACK_MANIFEST.json`. Its honest state is:

- pack preparation: `EXTERNAL-READY`;
- human execution: `not_started`;
- human results included: `false`;
- human review certified: `false`.

## Contents

| File | Purpose | Completion evidence |
|---|---|---|
| `MEASUREMENT_PLAN.md` | Questions, outcomes, estimands, denominators, schedule, subgroup handling, stopping rules, and interpretation limits | Covers accuracy, latency, retention, unseen transfer, support use, and subgroup outcomes |
| `EXPERT_REVIEW_PROTOCOL.md` | Independent literacy-expert recruitment, blinded review flow, complete curriculum rubric, conflict handling, and sign-off form | Produces item-, skill-, and system-level decisions without self-certification |
| `PILOT_PROTOCOL.md` | Pre/post/retention design, child session script, teacher workflow, Area 2 usability observation, safety and deviation handling | A facilitator can run every session without inventing procedure |
| `CONSENT_AND_ASSENT_TEMPLATES.md` | School permission, parent/guardian consent, child assent, teacher consent, withdrawal and incident wording | Templates require local legal/ethics adaptation before use |
| `DATA_DICTIONARY.md` | Canonical de-identified input schema, permitted values, derivations, missingness and privacy rules | Matches the runnable scripts |
| `REVISION_WORKFLOW.md` | Finding intake, severity, educational-risk escalation, change control, re-review and release decisions | Every human finding has an owner and auditable disposition |
| `CALIBRATION_PROTOCOL.md` | Independent item-difficulty, threshold, reteach-adjudication, subgroup, and differential-item review | Separates seeded monitoring rehearsal from observed evidence and requires signed external decisions |
| `CALIBRATION_PACK_MANIFEST.json` | Machine-readable A4.10 preparation and no-fake-results contract | Keeps human execution `not_started` and seeded preview evidence explicitly non-validating |
| `scripts/pilotData.mjs` | Shared validation, de-identification, CSV creation and descriptive summary logic | Rejects direct identifiers and invalid study states |
| `scripts/exportPilotDataset.mjs` | Converts one canonical JSON capture into analysis-ready CSV/JSON files with hashes | Fails closed on invalid, non-consented or identifying data |
| `scripts/summarizePilotDataset.mjs` | Produces descriptive metric summaries with small-cell suppression | Does not invent significance, causality or missing outcomes |

## Required human roles

No one person should fill incompatible roles. Record people by role code in the
study log, with the identity key stored outside the exported research dataset.

| Role | Minimum responsibility |
|---|---|
| Study owner | Local approvals, data controller decisions, incident response and final go/no-go |
| Independent literacy reviewer | Curriculum, item, threshold, and assessment review; no authorship of the material being rated |
| Measurement specialist | Frozen analysis design, uncertainty, threshold stability, subgroup suppression, and differential-item method |
| School lead | School permission, safeguarding route and scheduling |
| Facilitator | Child assent, standard administration, deviations and safety |
| Teacher participant | Workflow/usability sessions and teaching-context feedback |
| Data steward | Participant-code key, access control, deletion and export verification |
| Analyst | Pre-declared descriptive analysis and limitations |

## Execution order

1. Obtain local legal, ethics, school and safeguarding clearance. Adapt the
   templates without weakening withdrawal, privacy or child-assent rights.
2. Freeze the tested app release, curriculum version, pack commit, target
   skills, planned sample and analysis decisions in the study registration.
3. Recruit independent reviewers and complete the expert protocol before
   exposing children to any unresolved critical educational-risk item.
4. Run the technical rehearsal with adult test accounts only. Confirm device
   clocks, offline handling, event capture and export validation.
5. Obtain school permission, parent/guardian consent, teacher consent and child
   assent in that order. A child declining or withdrawing stops their session.
6. Run pre, teaching/practice, post, retention and unseen-transfer sessions
   exactly as specified. Record deviations at the time they occur.
7. Capture the teacher workflow sessions and the Area 2 child-usability tasks.
8. Export with `exportPilotDataset.mjs`, verify its manifest hashes, then create
   descriptive summaries with `summarizePilotDataset.mjs`.
9. Apply the revision workflow. Educational-safety findings block release until
   independently re-reviewed.
10. Only the named human owner may add closure evidence to
    `docs/release/EXTERNAL.md`. Pack preparation alone never closes A1.10.

## Command contract

The canonical capture file is documented in `DATA_DICTIONARY.md`.

```bash
node docs/research/scripts/exportPilotDataset.mjs \
  --input /approved/path/pilot-capture.json \
  --output /approved/path/deidentified-export

node docs/research/scripts/summarizePilotDataset.mjs \
  --input /approved/path/deidentified-export/analysis-ready.json \
  --output /approved/path/deidentified-export/descriptive-summary.json \
  --minimum-subgroup-size 5
```

The scripts create directories only at the explicit output path. They never
connect to production, upload data, or accept child names, contact details,
addresses or dates of birth.

## Human closure package

The study owner must provide all of the following before A1.10 can become
externally closed:

- dated approval references and the frozen protocol version;
- reviewer qualifications, independence declarations and signed rubrics;
- recruitment, consent, assent, withdrawal and attrition counts;
- protocol deviations and safety incidents, including a zero-incidents
  statement when accurate;
- the de-identified export manifest and script/pack commit;
- descriptive results with denominators, missingness and suppressed small
  cells;
- revision decisions linked to findings and re-review evidence;
- an explicit statement of limitations and what the pilot did not establish.

No raw child identity key, consent form, contact detail, audio/video recording,
free-text answer content or production secret belongs in this repository.
