# Measurement plan

## 1. Purpose and boundaries

The pilot asks whether children can use the tested LiteracyPath release as
intended and whether performance changes are promising enough to justify a
larger, independently governed study. It is not powered or designed to prove
causality, population-wide effectiveness, diagnostic validity, or fairness.

Primary questions:

1. Does accuracy on the taught target improve from pre to immediate post?
2. Is any improvement retained after 7–21 days without coached rehearsal
   immediately before the retention check?
3. Can children transfer the target to genuinely unseen items?
4. Does correct-response latency improve without increased support dependence?
5. How often and at which ladder stage is support used?
6. Are outcome patterns materially different across pre-declared subgroups?
7. Can children and teachers complete the critical flows safely and
   independently enough for a larger pilot?

## 2. Design

Use a prospective repeated-measures feasibility design:

- **Pre:** unseen baseline items for the selected target skills.
- **Practice:** the frozen LiteracyPath release and assigned activities.
- **Immediate post:** parallel, non-identical items matched to the pre blueprint.
- **Retention:** parallel items 7–21 days after post.
- **Transfer:** unseen words/items that instantiate the target rule but were not
  used in pre, practice, post, examples, audio checks or demonstrations.
- **Usability:** task-based observation during first use and after familiar use.

Do not call the design randomized unless allocation is actually randomized,
concealed and documented. If a comparison group is used, pre-register its
instruction, exposure, contamination controls and analysis before recruitment.

## 3. Population and sampling

Record the intended age and curriculum range before recruitment. The default
feasibility range is children aged 4–7 who are learning English literacy, but a
local school and qualified reviewer must approve the actual range.

Use explicit inclusion and exclusion criteria. Never exclude a child merely to
improve results. Accessibility or language needs should lead to documented
reasonable adjustments unless the task would no longer measure the declared
construct.

Pre-declare:

- planned number approached, consented, assented and analysed;
- schools/classes and recruitment route;
- target age/grade bands;
- multilingual-learner definition;
- additional-support grouping definition;
- device and adult-support constraints;
- reasons a session may be stopped or omitted;
- whether sibling/class clustering will be reported.

This feasibility pack does not prescribe a universal sample size. The study
owner and independent analyst must justify the chosen sample against the
questions and local context. Small subgroup cells are suppressed below five
participants by the supplied summary script; local policy may require a higher
threshold.

## 4. Content and release freeze

Before the first pre session, record:

- Git commit and deployed release ID;
- curriculum-policy version and item-bank version;
- exact target skills and teaching sequence;
- pre, post, retention and transfer item keys;
- audio/media approval state;
- allowed support ladder and facilitator wording;
- device/browser versions and accessibility settings.

Items used for transfer must be checked against every prior exposure list.
Changing content, scoring, thresholds or support behavior after the first
participant starts creates a new cohort/version and must not be silently pooled.

## 5. Outcome definitions

### 5.1 Accuracy

For a phase and target:

`accuracy = correct administered responses / responses scored correct or incorrect`

Report numerator and denominator. `no_response`, `not_administered`,
`discontinued` and missing records are never silently scored incorrect. Report
each separately. Self-corrections must follow the frozen item policy and remain
identifiable.

Primary accuracy comparisons:

- pre to immediate post on matched blueprints;
- immediate post to retention;
- transfer accuracy as its own outcome, not pooled with taught-item accuracy.

### 5.2 Latency

Latency begins when the complete stimulus is available and ends at the first
committed response. Pause timing when the app is backgrounded, a device error
occurs, or administration is interrupted.

Primary latency uses correct responses completed without support. Report median
and interquartile range because response times are commonly skewed. Also report
the number of eligible latency observations. Do not replace missing latency
with zero or a maximum value.

### 5.3 Retention

Retention is performance 7–21 days after post on a parallel form without a
coached warm-up on the tested target. Report:

- retention accuracy;
- change from immediate post;
- change from pre;
- elapsed days for every included participant;
- participants outside the window as deviations, not pooled silently.

### 5.4 Transfer to unseen items

An unseen transfer item must:

- instantiate the target knowledge or rule;
- have a new item key and stimulus;
- not occur in demonstrations, practice, pre, post or retention forms;
- not be disclosed by a picture/context cue;
- be reviewed for comparable language and difficulty.

The exporter rejects a transfer item key that appears in any non-transfer event
for the same participant.

### 5.5 Support use

Record each child-initiated or adult-initiated support event. For the Guided
Reading ladder, allowed stages are:

1. `whole_word_audio`;
2. `segmented_phonemes`;
3. `reread_prompt`.

Report:

- participants using any support;
- support events per administered item;
- items reaching each stage;
- correct-after-support separately from independent correct;
- change in support rate by phase.

Never treat supported correctness as independent automaticity.

### 5.6 Subgroup outcomes

Pre-declared group dimensions may include:

- age band;
- grade band;
- multilingual-learner status;
- additional-support status;
- school/class cohort;
- device class, when it addresses a usability question.

For every displayed group report participant count, administered-item count,
accuracy, eligible latency count, median latency and support rate. Suppress
cells below the minimum. Do not infer that a difference is caused by group
membership. Do not run post-hoc searches for a favorable subgroup.

## 6. Usability outcomes

Critical child tasks:

- enter through the child login safely;
- identify the one dominant next action;
- start/resume the assigned activity;
- use audio/support intentionally;
- recover from one safe, staged error;
- complete and return without adult navigation;
- explain what to do next in their own words.

Critical teacher tasks:

- find the correct class and learner;
- identify the evidence basis for a recommendation;
- start the intended assessment or reading flow;
- correct a final-item mis-tap before finishing;
- view support use in Guided Reading;
- export a report and explain its scope;
- recover from an offline or failed-save state.

Measures: completion state, duration, navigation errors, adult prompts, observed
confusion, accessibility barrier, recovery success and child/teacher rating.
Quotes are optional, separately consented, redacted and never required from a
child.

## 7. Analysis set and missingness

Publish a flow count:

`approached → guardian consent → child assent → pre → post → retention → analysed`

Use all valid observed records in descriptive tables. Also report a
protocol-concordant set, clearly labeled, when deviations materially alter the
construct. Never delete an unfavorable valid record because the child struggled.

For each metric report:

- number of participants contributing;
- number of events/items contributing;
- missing count and reason;
- exclusions and the frozen rule that caused each exclusion;
- suppressed cells;
- release/content version.

No imputation is performed by the supplied scripts.

## 8. Decision thresholds

These are feasibility decisions, not claims of efficacy:

- **Stop immediately:** safeguarding incident, unconsented data, identity leak,
  misleading/unsafe instruction, systematic inaccessible critical task, or a
  scoring defect that changes the construct.
- **Revise before more child sessions:** any critical educational-risk expert
  finding; more than one child receives a wrong phoneme/word model; a critical
  task cannot be completed by at least two children for the same product cause;
  or support cues invite picture/context guessing.
- **Proceed with documented revision:** no stop condition, data completeness is
  adequate for the declared descriptive questions, and independent review
  confirms that remaining findings are non-critical.

The study owner must pre-register any numeric progression threshold before
seeing outcomes. Do not choose a threshold after viewing the result.

## 9. Reporting

Every report must show the protocol version, app release, curriculum version,
dates, recruitment flow, denominators, missingness, deviations, subgroup
suppression rule, adverse events, findings, revisions and limitations.

Permitted language: “observed,” “in this pilot,” “descriptive,” “feasible,”
“requires revision,” and “supports a larger study.”

Prohibited without an appropriate design and analysis: “proves,” “caused,”
“effective for all children,” “diagnostic,” “validated,” “fair,” and
“statistically significant.”
