# LiteracyPath item-difficulty and learning-threshold calibration protocol

Version: `2026.07.25-a4.10`
Traceability item: `A4.10`
Status: `ACTIVE — human execution ongoing pass-by-exception`

## 1. Purpose and limits

This protocol prepares independent literacy and measurement specialists to:

1. estimate the empirical difficulty of scored assessment items;
2. test whether the current evidence minimums and learning-status thresholds
   support proportionate decisions;
3. investigate possible false-positive reteach recommendations;
4. inspect descriptive subgroup performance without causal claims; and
5. screen for differential item behavior after matching on a declared ability
   proxy.

The included admin dashboard currently uses deterministic synthetic data. It
demonstrates calculations, suppression, labels, and review workflow. It is not
child evidence and cannot establish validity, efficacy, fairness, item
difficulty, threshold quality, or subgroup outcomes.

No threshold may be changed from this seeded preview. No seeded flag may block
or release an item. External reviewers must sign the versioned decision record
before an observed dataset can affect the learning policy.

## 2. Required independent team

The study owner recruits, where practical:

- at least one early-literacy specialist with current experience teaching or
  assessing the target age range;
- at least one measurement specialist with item-analysis and classification
  experience;
- a multilingual-learning specialist when language subgroups are reviewed;
- an accessibility/SEND specialist when additional-support groups or
  accommodations are reviewed; and
- a safeguarding/data-protection contact for collection and incident review.

Record each reviewer’s role, qualifications, relevant languages, years and
setting of practice, financial or advisory relationships, prior LiteracyPath
involvement, conflicts, and signed independence declaration. A reviewer may
not approve an item or rule they authored.

The product team may explain implementation facts. It may not rewrite a
reviewer’s rating, select a favorable subgroup after seeing outcomes, or mark
the external record complete.

## 3. Frozen materials

Before data collection, freeze and hash:

- application release and commit;
- curriculum and item-bank versions;
- exact published item IDs;
- `src/policy/learningPolicy.js` version and serialized policy values;
- assessment administration, support, retry, scoring, and interruption rules;
- approved media/audio versions;
- participant inclusion/exclusion criteria;
- declared subgroup dimensions;
- analysis code and provisional monitoring thresholds;
- missingness and small-cell rules;
- planned sample sizes and stopping rules;
- calibration dataset schema; and
- this protocol plus the blank decision record.

Every analysis artifact must carry these versions. Mixing item, scoring, or
policy versions requires a new analysis stratum or a restarted calibration
cycle; it must never be silently pooled.

## 4. Population and sampling

Recruit across the intended use range:

- ages and grade bands actually served;
- emergent, early, and transitional readers;
- more than one school/class context;
- multilingual learners across represented language backgrounds;
- learners with declared additional-support/accessibility needs;
- supported device and input modes; and
- the pronunciations and English variety declared for the product.

Recruitment must not exclude learners because they struggle with the assessed
construct. Do not use the production product as an unconsented experiment.
School permission, parent/guardian consent, child assent, withdrawal handling,
and incident rules from the research pack apply.

The statistical reviewer sets the target sample before collection. The
product’s preview minimums are only software suppression and review triggers;
they are not a power calculation. If a planned comparison cannot recruit an
adequate group, report it as not estimable.

## 5. Administration design

### 5.1 Item difficulty

Use the same construct, stimulus, response, scoring, media, support, and timing
rules as the intended assessment. Record for every administration:

- opaque participant code;
- item ID, skill, level, format, and content version;
- assessment and policy versions;
- date/time and administration phase;
- correct/incorrect/not-administered/not-scorable/skipped state;
- independent versus supported response;
- support stage and initiator;
- response latency when the task makes latency interpretable;
- retry state;
- interruption or technical failure;
- declared analysis strata; and
- assessor notes using bounded codes.

Supported correctness must remain separate from independent correctness.
Skipped, not-administered, interrupted, and not-scorable states are not
incorrect responses. A media or delivery failure is not item difficulty.

### 5.2 Threshold validation

The current policy uses a minimum evidence count, recency rule, confidence
requirements, and accuracy bands. The frozen analysis compares candidate rules
without changing production behavior.

For each candidate rule report:

- learners classified in every status;
- evidence and missingness contributing to each classification;
- classification stability on resampling;
- agreement with independent specialist judgment;
- sensitivity to one additional correct/incorrect response;
- transition rates between initial and follow-up administrations;
- consequences of false-positive and false-negative decisions;
- subgroup counts and descriptive differences;
- item and skill coverage; and
- cases withheld as not enough evidence.

The cost of an unnecessary reteach recommendation is not equivalent to the cost
of unsupported progression. Specialists must state the educational consequence
and choose an explicit trade-off; optimization for headline accuracy alone is
prohibited.

### 5.3 Follow-up administration

Use an independently administered follow-up inside the predeclared window.
Preserve whether teaching or practice occurred between administrations.
Repeated exposure to the same item must be identified; transfer items must not
have appeared in prior instruction or assessment for that participant.

The product preview uses a 14-day follow-up window. Reviewers must validate or
replace that window before observed analysis and state why it represents the
construct of interest.

## 6. Item-difficulty analysis

For each item and administration phase, report:

- number of eligible participants;
- number administered and independently scored;
- correct count and proportion;
- supported-correct count separately;
- missing/not-scorable/interrupted counts and reasons;
- latency denominator and median when applicable;
- distribution across declared ability bands;
- item/content/scoring versions; and
- uncertainty interval selected by the measurement specialist.

The dashboard’s `very hard`, `hard`, `target range`, `easy`, and `very easy`
bands are provisional monitoring labels only. Specialists must assess whether:

- difficulty matches the intended point in the curriculum;
- low performance reflects the target construct rather than vocabulary,
  syntax, accent, media, motor, device, or instruction load;
- high performance reflects genuine knowledge rather than answer leakage;
- distractors diagnose plausible misconceptions;
- supported and independent performance differ as expected; and
- the item remains educationally appropriate despite its observed proportion.

An item is not rejected merely for being hard or easy. The reviewer records the
intended purpose and the evidence needed for retention, revision, relocation,
restriction, or removal.

## 7. False-positive reteach review

The dashboard calls a case an `adjudication candidate` when:

1. the initial record met the current policy’s evidence minimum;
2. the initial record generated a reteach recommendation;
3. an independent follow-up also met the evidence minimum;
4. the follow-up occurred inside the frozen review window; and
5. follow-up performance contradicted the original classification.

This is a queue, not a verdict. For every candidate, two reviewers inspect:

- exact initial and follow-up item sets;
- content and policy versions;
- response and support states;
- item overlap or practice exposure;
- dates and the declared follow-up window;
- technical/media incidents;
- confidence and recency;
- assessor notes;
- whether instruction occurred;
- skill and item diversity; and
- plausible alternative explanations.

Allowed adjudications:

- `confirmed_false_positive`;
- `appropriate_initial_reteach`;
- `changed_after_instruction`;
- `practice_or_item_exposure_confound`;
- `administration_or_scoring_defect`;
- `insufficient_follow_up_evidence`;
- `version_mismatch`;
- `unresolved`.

Report the denominator of all eligible reteach recommendations, the number
reviewed, each disposition, missing cases, and unresolved disagreements. A
dashboard candidate rate must never be published as a confirmed false-positive
rate.

## 8. Subgroup reporting

Declare dimensions before viewing outcomes. Permitted dimensions must answer a
specific access, construct, or usability question and may include age/grade
band, multilingual-learner status, additional-support status, cohort, or device
class.

For every displayed group report:

- participant count;
- administered and independently scored item count;
- item/skill coverage;
- correct count and descriptive accuracy;
- support rate;
- eligible latency count and median;
- missingness and technical-failure counts; and
- content, assessment, and policy versions.

Cells below five participants are suppressed by the product. The statistical
reviewer may require a larger minimum. Suppressed cells must not be recoverable
by subtraction from totals. Combine groups only when educationally defensible
and predeclared; never combine them solely to expose a result.

Differences are descriptive. Do not state that group membership caused a
difference. Do not use a favorable subgroup as proof of overall efficacy, and
do not infer an individual child’s ability from a group result.

## 9. Differential item behavior

The seeded dashboard performs a transparent screening comparison:

- focal group: declared multilingual learners;
- reference group: other declared participants;
- matching strata: emerging, developing, and secure ability bands;
- per-stratum difference: focal minus reference proportion correct; and
- standardized difference: response-balanced mean of available stratum
  differences.

The preview opens specialist review at an absolute 15-point matched gap when
each group also satisfies the software evidence minimum. This is not a
validated DIF statistic, significance test, bias finding, or release decision.

Before observed use, the measurement specialist must:

1. select and justify the matching variable without using the target item;
2. assess whether strata are sufficiently comparable;
3. select the primary DIF method and uncertainty/error-rate controls;
4. declare minimum group and response counts;
5. address sparse/extreme score cells and missingness;
6. run sensitivity analyses using at least one reasonable alternative;
7. distinguish statistical DIF from educationally meaningful impact; and
8. require content review before any fairness or bias conclusion.

Every flagged item receives a blind content review where practical. Reviewers
inspect language load, dialect/accent, cultural knowledge, imagery, device
interaction, instruction wording, distractors, support, and construct
alignment. A statistical flag without a construct-irrelevant explanation is
`unresolved`, not automatically biased. An apparently clean screen is not proof
of fairness.

## 10. Missingness, exclusions, and data quality

Freeze valid exclusions before analysis. Report:

- approached, consented, assented, administered, followed up, and analysed
  counts;
- each exclusion rule and count;
- every missingness reason;
- technical/media incidents;
- version mismatches;
- duplicated events;
- out-of-window follow-ups;
- unsupported direct identifiers;
- subgroup cells suppressed; and
- deviations from the frozen plan.

Never delete an unfavorable valid result. No imputation is performed by the
current research scripts. If a specialist adds imputation, it must be a
separate preregistered sensitivity analysis with observed results still shown.

## 11. Decision meeting

Reviewers first make independent judgments. Preserve original forms before a
reconciliation meeting. Record disagreements and default to the more cautious
decision where educational safety or construct validity is uncertain.

For each item choose:

- retain at current location;
- retain with monitored condition;
- revise and re-calibrate;
- move within the sequence and re-calibrate;
- restrict from scored use;
- remove from runtime; or
- insufficient evidence.

For each learning-policy rule choose:

- retain;
- revise and repeat validation;
- restrict to named evidence conditions;
- withhold conclusion pending more evidence; or
- insufficient evidence.

Critical administration, scoring, identity, consent, accessibility, or
construct defects stop the affected analysis and reopen the relevant
traceability item. Product changes require a new content/policy version and an
independent re-check.

## 12. Required signed calibration record

The external record must include:

| Field | Required content |
|---|---|
| Record ID | Unique versioned identifier |
| Release/commit | Exact application version |
| Dataset hash | Hash of the de-identified frozen dataset |
| Protocol/analysis version | Exact documents and scripts used |
| Reviewers | Qualifications, roles, conflicts, signatures, dates |
| Population | Inclusion, recruitment, representation, limitations |
| Flow and missingness | Complete denominators and reasons |
| Item decisions | Every reviewed item and disposition |
| Threshold decisions | Every current/candidate rule and disposition |
| Reteach adjudication | All eligible, reviewed, and unresolved cases |
| Subgroup reporting | Declared dimensions, suppression, limitations |
| Differential review | Method, flags, content review, dispositions |
| Deviations | Every departure from the frozen plan |
| Open risks | Unresolved validity, fairness, access, or implementation issues |
| Release recommendation | Proceed, restrict, revise, or stop |

Only qualified external reviewers may sign the calibration judgment. The
product team records it as evidence and implements accepted changes through the
normal revision workflow.

## 13. Closure criteria

`A4.10` may move from `ACTIVE` to `EXTERNAL-CLOSED` only when:

- required reviewers and conflicts are documented;
- a consented, de-identified observed dataset has passed validation;
- all frozen versions and hashes are present;
- item difficulty, threshold stability, reteach adjudication, subgroup
  summaries, and differential screening are complete or explicitly
  not-estimable;
- every critical/major finding has an owned disposition;
- changed items/rules have independent re-check evidence;
- reviewers have signed the final record; and
- the release gate references the exact external evidence without copying or
  inventing its conclusions.

Until then, the application and scorecard must state:
`10/10 pending external — specialist calibration not yet executed`.
