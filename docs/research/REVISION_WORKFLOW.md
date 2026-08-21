# Evidence-to-revision workflow

## 1. Principles

Human findings are evidence, not suggestions to hide or average away. Every
finding receives a stable ID, severity, owner, disposition, verification and
release decision. Original evidence remains immutable.

Product authors cannot self-close a critical or major educational-validity
finding. The independent reviewer who raised it, or an equivalently qualified
independent replacement, performs re-review.

## 2. Finding sources

Accepted sources:

- independent expert rubric/finding;
- child task observation;
- teacher workflow observation;
- pre/post/retention/transfer descriptive result;
- subgroup disparity requiring investigation;
- protocol deviation or safety incident;
- data-quality/export validation failure;
- automated gate failure discovered during the study.

Each finding links to de-identified evidence and exact release/content version.
Do not copy identities, raw safeguarding details or uncontrolled recordings.

## 3. Severity

| Severity | Definition | Required action |
|---|---|---|
| Critical | Wrong/harmful instruction; invalid construct/scoring; identity/privacy/safeguarding breach; child cannot safely access a critical flow; systematic bias risk | Stop affected sessions/release; notify owner; contain; correct; independent re-review |
| Major | Material learning, evidence, accessibility or workflow defect likely to alter outcomes for multiple users | Restrict affected content; owner and due date; fix before expansion; independent verification |
| Minor | Bounded clarity, consistency or friction issue without material construct/safety effect | Prioritized correction; product verification |
| Observation | Context or hypothesis without demonstrated defect | Record; investigate or accept with rationale |

When uncertain between two severities, use the more cautious severity until
qualified review resolves it.

## 4. Finding record

Required fields:

- finding ID and source ID;
- discovered at and exact release/content versions;
- affected skill, item, page, task or report;
- severity and rationale;
- observed evidence and denominator;
- affected participants/groups, using codes or aggregates;
- educational, usability, accessibility, privacy or reporting consequence;
- immediate containment;
- root cause;
- correction specification and acceptance gate;
- owner and due date;
- status: `open`, `contained`, `in_correction`, `awaiting_verification`,
  `closed`, `accepted_observation`;
- verifier, verification evidence and date;
- release decision.

“Cannot reproduce” does not close a finding. Record the attempted conditions and
keep the finding open or accept it transparently as an observation with risk
rationale.

## 5. Triage and containment

Within one working day for critical and two for major:

1. preserve the source evidence;
2. stop or restrict affected content/session where required;
3. assess participants, versions and exports affected;
4. notify the study owner and appropriate safeguarding/privacy route;
5. create a testable correction specification;
6. decide whether collected outcomes remain interpretable;
7. log any notification, deletion or re-consent requirement.

No pilot deadline overrides child safety, valid consent or evidence integrity.

## 6. Root-cause categories

Choose the primary category and any contributors:

- curriculum sequence/prerequisite;
- item construct or ambiguity;
- scoring/evidence state;
- pronunciation/audio role;
- image/context leakage;
- support/cueing;
- accessibility;
- teacher workflow/copy;
- child navigation/copy;
- persistence/synchronization;
- report aggregation/provenance;
- release/version control;
- protocol/facilitator deviation;
- data capture/export/privacy.

Root cause states why the system allowed the issue, not only where it appeared.

## 7. Correction requirements

A correction specification states:

- intended educational/user outcome;
- affected and unaffected scope;
- content/data migration need;
- test/gate that fails before and passes after;
- whether earlier pilot evidence is invalidated;
- re-review role;
- rollback/containment plan.

Do not use silent exclusions, label changes that leave scoring unchanged,
one-off seed exceptions, unapproved audio, synthetic human results, or threshold
changes chosen after viewing outcomes.

## 8. Verification

Critical/major closure requires:

- implementation/content commit;
- automated gate where mechanizable;
- targeted regression on the reachable product;
- independent expert re-review for educational/assessment findings;
- affected accessibility/manual retest where automation is insufficient;
- data/export replay when records or reports changed;
- release note and study impact decision.

Minor findings require product-owner verification plus regression proportionate
to risk. The verifier must not be the sole author for critical/major closure.

## 9. Study impact decisions

For every corrected critical/major finding choose one:

- `no_outcome_impact`, with evidence;
- `exclude_affected_metric`, under a pre-declared rule;
- `exclude_affected_session`, with reason;
- `new_version_cohort`, do not pool silently;
- `restart_pilot`;
- `terminate_study`.

Report counts under every decision. Never retroactively edit raw outcomes.

## 10. Release decision meeting

Inputs:

- complete finding register;
- expert skill/system decisions;
- recruitment and missingness flow;
- descriptive metric/subgroup summaries;
- usability task outcomes;
- deviations/incidents;
- corrected release evidence;
- unresolved limitations.

Outputs:

- skills/content ready, restricted or blocked;
- product surfaces ready, restricted or blocked;
- further calibration/research required;
- external closure state;
- named owner/date for every open action.

A1.10 may become `EXTERNAL-CLOSED` only when the human closure package listed in
`README.md` is committed or linked from the current release issue. A prepared
pack remains `ACTIVE`, even when all automated pack gates pass.

## 11. Recurrence

Convert every critical/major mechanizable finding into a permanent release gate.
Schedule a fresh independent review when:

- a target skill’s scope/sequence or scoring changes;
- a new pronunciation/dialect scope is claimed;
- support behavior changes;
- a new assessment/report interpretation is introduced;
- a materially affected subgroup or accessibility mode was not covered;
- accumulated minor findings show a pattern.

Track recurrence by root-cause category. A repeated gate failure requires a
root-cause note rather than rerunning until green.
