# The Reporting Bible

**Status: GOVERNING.** This document decides what Literacy Guide reports, to whom, how, and — most
importantly — what it refuses to report. Where this document and any other document, code comment, or
existing implementation disagree, **this document wins** and the other is a bug.

Written 2026-08-06. Locale: American English (per `docs/STALENESS_AND_DECISIONS_2026-07-31.md` §4).

Companion documents:

- `docs/reporting/REPORTING_AUDIT_2026-08-06.md` — where the product currently fails this bible
- `docs/reporting/MLL_LANGUAGE_REPORTING.md` — the multilingual-learner chapter, in full
- `src/policy/reportingBible.js` — the machine-readable form of every number in this document

Every number in this bible that governs runtime behavior is exported from `src/policy/reportingBible.js`
and guarded by `tools/checkReportingBible.mjs`. **No number in this document may be hand-copied into
another file.** That rule exists because of `docs/ADVERSARIAL_AUDIT_2026-07-31.md` finding H1, where a
tuned threshold table was silently overwritten by a flat constant and the comment above it claimed the
opposite.

---

## Part I — The five laws

Everything below is derived from these. If a proposed report feature violates one of them, it does not
ship, regardless of who asked for it.

### Law 1 — A report states what is known, not what is hoped

Missing evidence is reported as missing. It is never reported as zero, never averaged away, never
rounded into a neighboring category, and never allowed to lower a child's standing. "Not checked" and
"Needs support" are different facts about the world and must never share a color, a column, or a count.

This law already has partial force in the codebase and the existing comments defending it are correct —
see `AppPages.jsx` ("'Not enough results' and 'Not checked' are white cards, not a colour of failure")
and `ElClassReportDocument.jsx` ("A missing measure is shown as 'Not recorded,' never as zero"). This
bible generalizes that discipline to every surface, including exports, which currently break it.

### Law 2 — Every claim carries its evidence, and weak evidence is not a claim

A status is a claim about a child. The strength of the claim is bounded by the evidence behind it.

Sinharay's work on subscore added value is the binding constraint here: subscores built on fewer than
about 20 items rarely carry information beyond the total score, and "subscores based on tests smaller
than 10 items almost never have added value."
([Sinharay, ETS](https://files.eric.ed.gov/fulltext/ED523969.pdf);
[Frontiers in Psychology](https://frontiersin.org/articles/10.3389/fpsyg.2017.00305/full))

Therefore: **no proficiency judgment is rendered for any skill backed by fewer than 10 scored items**,
and between 10 and 19 items the judgment renders as provisional with a visible uncertainty affordance.
This is the single most defensible guardrail in the product and it is also a differentiator, because
nearly every competitor reports skill-level bars off four to six items.

### Law 3 — Status and growth are orthogonal and must never be merged

A child can be well below benchmark and making well-above-typical progress. A child can be at benchmark
and stalled. Collapsing these into one mark destroys exactly the information that tells a teacher
whether their instruction is working.

This is Acadience's Pathways of Progress insight: growth is normed **conditional on starting point**,
using quantile regression against the 20th/40th/60th/80th growth percentiles for every beginning-of-year
score. ([Acadience overview](https://acadiencelearning.org/wp-content/uploads/2026/02/AcadiencePathways-of-Progress_BriefOverview.pdf))

It is also Guskey's structural fix for standards-based reporting: **Product** (achievement), **Process**
(effort, work habits), and **Progress** (growth) are three separate reporting streams and must be three
separate data types in the schema, never collapsed into one mark.
([Michigan Assessment Consortium](https://www.michiganassessmentconsortium.org/wp-content/uploads/The-Challenges-of-Standards-Based-Grading.pdf))

### Law 4 — The software suggests; a human decides

No tier assignment, no placement, no diagnosis, no reclassification, and no special-education referral
is ever written by this product as a system-of-record fact. Every such output is a suggestion that
exposes its evidence, carries a prominent override, and records who confirmed it and when.

This follows the US Department of Education's AI report, whose first recommendation is that "humans are
in the loop" and that "teachers remain at the helm of major instructional decisions," and whose
developer guidance demands "Inspectable, Explainable, Overridable AI."
([ED AI report](https://www.ed.gov/sites/ed/files/documents/ai-report/ai-report.pdf))

The repo already has the right instinct here — `isReportableElBenchmarkCandidatePlacement` and the
"suggested reading stage is provisional until a teacher confirms it" copy. Law 4 makes that the rule
rather than one team's good habit.

### Law 5 — The report ends in an action, not in a number

A 2025 survey of 251 K-3 educators across 39 states found **76% felt confident interpreting screening
data but only 38% felt confident implementing tiered interventions**, and only 44% had a systematic
problem-solving process for intervention planning.
([Annals of Dyslexia](https://link.springer.com/article/10.1007/s11881-025-00342-1))

That 38-point gap is the product opportunity and it is the reason every report in this system
terminates in a named next instructional move for a named group of children, not in a chart.

---

## Part II — Audiences

Five audiences. Each gets a different report. A report is never re-used across audiences by hiding
columns; the transformations are semantic, not cosmetic.

| Audience | Gets | Never sees |
|---|---|---|
| **Teacher (diagnostic)** | Everything. Full skill spine, item detail, evidence counts, provenance. | — |
| **Teacher (planning)** | Groups, next moves, who to see today. | Raw provenance noise. |
| **School leader** | Class and cohort aggregates, coverage, comparability warnings. | Individual item detail; anything ranked with names attached. |
| **Family** | ≤6 strands, plain language, strengths first, two next steps, home actions. | Percentiles, scaled scores, reading levels, comparisons to classmates, any diagnostic-adjacent word. |
| **Child** | Their own effort and their own goal-relative progress. | Any color band, any status label, any comparison to another child. |

Guskey's interpretability ceiling governs the family view: report **5-6 strands per subject**, never
"twenty, thirty, or more individual language arts standards."
([tguskey.com](https://tguskey.com/how-to-keep-your-standards-based-report-card-simple-and-family-friendly/))

The child row is not squeamishness. Shepard's critique of data walls is that normative feedback *harms*
interest in learning and willingness to invest effort, and that color-category displays constitute "a
form of public shaming that does emotional harm" — which holds **even when anonymized**, because
children recognize their own category.
([NEPC](https://nepc.colorado.edu/sites/default/files/publications/Newsletter%20shepard_0.pdf))

Note the reconciliation with IES's recommendation that students examine their own data: students
engaging with their **own goal-relative** data is supported; students seeing **peer-comparative** data is
not. The child surface therefore shows "you read 4 more words than last week," never "you are orange."

---

## Part III — The reporting taxonomy

Four levels. Level 1 is the family view. Levels 2-4 are teacher views. Exports carry the level as a
column so a district can pivot at whatever grain they need.

### Level 1 — The Simple View of Reading (2 components, family-facing)

Word Recognition **×** Language Comprehension = Reading Comprehension. Multiplication, not addition: a
zero in either factor produces zero comprehension, which is why an overall comprehension score alone
never tells a teacher where to teach.
([Reading Universe](https://readinguniverse.org/article/explore-teaching-topics/big-picture/understanding-the-simple-view-of-reading-and-scarboroughs-rope))

**The single highest-value family-facing visual in K-3 literacy is the SVR quadrant** — word recognition
on one axis, language comprehension on the other, the child plotted, and the profile named in plain
language. It is diagnostic, it is non-ranking, and it implies an action directly. A stack of skill bars
does none of those things. Ship the quadrant.

The four profiles and what each implies:

| Profile | Reads words | Understands language | The move |
|---|---|---|---|
| Strong / Strong | yes | yes | Enrich; increase text complexity |
| Weak WR / Strong LC | no | yes | Phonics and decoding. Classic "dyslexic profile" pattern — **name the pattern, never the label** |
| Strong WR / Weak LC | yes | no | Vocabulary, background knowledge, syntax. Often the multilingual-learner profile |
| Weak / Weak | no | no | Both, with decoding first; check for a language screen |

### Level 2 — Scarborough's Rope (8 strands, teacher-facing)

*Word Recognition, becoming automatic:* phonological awareness · decoding · sight recognition.
*Language Comprehension, becoming strategic:* background knowledge · vocabulary · language structure ·
verbal reasoning · literacy knowledge.

Eight strands is already above the family interpretability ceiling, which is why it is level 2 and not
level 1. Use the Rope rather than the National Reading Panel five components, because NRP-5 has no home
for grammar and syntax and this product assesses those — they would become an orphan category. The Rope
files them under "language structure."

### Level 3 — Instructional groups

Phonics uses the **UFLI Foundations** scope and sequence, which is the best-supported public taxonomy for
a reporting hierarchy: ordered, non-overlapping, granular enough to teach from and coarse enough to
aggregate. ([UFLI](https://ufli.education.ufl.edu/wp-content/uploads/2022/01/UFLI-Scope-and-Sequence-5-21-1.pdf))

1. Consonants and short vowels · 2. Double letters and consonant digraphs · 3. CVCe · 4. Word ending
spelling patterns · 5. R-controlled vowels · 6. Vowel teams (long vowels) · 7. Other vowel teams ·
8. Diphthongs · 9. Silent letters · 10. Syllables · 11. Affixes · 12. Low-frequency spellings

Phonological awareness is ordered large unit → small unit, detection before manipulation, blending
before segmentation, with **full segmentation as the gateway indicator**:
rhyme/syllable → onset-rime → blending → **segmentation** → manipulation (optional, flagged).

Manipulation is reported but **manipulation failure is never a risk flag for a child who segments
fluently.** Shanahan and Clemens et al. argue advanced phoneme manipulation is *enabled by* reading
rather than enabling it. This is a live dispute; the product's position is to measure it and refuse to
alarm on it. ([Shanahan](https://www.shanahanonliteracy.com/blog/what-phonological-awareness-skill-should-we-be-screening);
[Clemens et al.](https://literacy.virginia.edu/sites/g/files/jsddwu1006/files/2023-03/Clemens%20et%20al.%202021%20Advanced%20PA%20Critique.pdf))

High-frequency words are reported in **three buckets, never as "X/100 sight words"**:

- **Flash Words** — regularly spelled, decodable, needed instantly (*can, not, did*). 138 of the Dolch 220 (63%).
- **Heart Words** — irregular; part must be learned by heart (*said, are, where*). 82 of the Dolch 220 (37%).
- **Temporarily irregular** — decodable once the relevant pattern is taught (*see*, after *ee*).

([Reading Rockets](https://www.readingrockets.org/topics/phonics-and-decoding/articles/new-model-teaching-high-frequency-words))

This split matters because it changes the instruction. A child failing Flash Words has a phonics problem.
A child failing Heart Words has an orthographic-memory problem. A single "sight words" percentage hides
the difference and is therefore not reportable.

### Level 4 — Item / GPC

Grapheme-phoneme correspondences, individual words, individual items. Teacher drill-down and export only.
Never aggregated into a family-facing number.

**Standards mapping.** Level 3 phonics groups map to CCSS **RF.x.3**; PA maps to **RF.x.2**; fluency maps
to **RF.x.4**; print concepts to **RF.x.1**. Four buckets per grade, comfortably inside the
interpretability ceiling, and the spine most report cards must map to.

---

## Part IV — The status scale

### IV.1 One vocabulary, everywhere

The product currently ships **five status vocabularies and two ad-hoc string sets** (see the audit,
finding S1). That ends here. There is exactly one displayed vocabulary:

| id | Label | Meaning | Color role |
|---|---|---|---|
| `secure` | **Secure** | Enough recent, scored, independent evidence supports a secure judgment | success |
| `developing` | **Developing** | Making progress; not secure yet | warning |
| `needs_support` | **Needs support** | Review first; reteach and reassess | danger |
| `not_enough_evidence` | **Not enough results** | Some answers, not enough for a judgment | neutral |
| `not_checked` | **Not checked** | No attempt recorded | neutral |
| `mixed_evidence` | **Mixed results** | Policy-ready sources disagree; do not average | neutral-alert |

`mixed_evidence` is a real state and must be displayed, not silently resolved. Two policy-ready sources
disagreeing is information; averaging them is destruction of information.

Internal ids may differ from the display label in exactly one place — the boundary translation function —
and nowhere else. `on_track`, `mastered`, `needs_teaching`, `not_started`, `not_assessed`, `unscored_evidence`,
`Growing`, `Not started yet` and `Got it / Almost there / Needs reteaching` are all **retired as display
strings**. They may survive as storage ids behind a single translator.

**Neutral is not a failure color.** `not_enough_evidence` and `not_checked` render on a white or grey
card, never red, never amber. A child who has not been assessed has not failed anything.

### IV.2 The mastery gates

The field convention of "80% across two sessions" is convention, not evidence. Fuller & Fienup compared
50%, 80%, and 90% acquisition criteria and measured maintenance three to four weeks later:

| Criterion at acquisition | Mean maintenance accuracy |
|---|---|
| 50% | 53.6% |
| 80% | 69.1% |
| **90%** | **88.2%** |

([PMC5843573](https://pmc.ncbi.nlm.nih.gov/articles/PMC5843573/))

The 80% convention loses roughly 19 percentage points of retained accuracy against 90%. The product
therefore separates a **current Secure acquisition judgement** from the stronger claim that learning
has been retained:

| Gate | Criterion |
|---|---|
| **1. Accuracy** | ≥ 90% correct on the target construct |
| **2. Volume** | ≥ 10 scored items (Law 2) |
| **3. Stability** | Retained-learning check: met on ≥ 2 separate days |
| **4. Retention** | Retained-learning check: re-probe 14-28 days later; **demote Secure on failure** |

Where a rate criterion exists for the construct (letter-sound correspondence, high-frequency words, oral
reading), accuracy alone is insufficient and the rate criterion is a fifth gate. Precision teaching is
right that mastery is accuracy *plus* rate; accuracy alone does not predict automaticity.

**The claim boundary is stated in the UI and exports.** Gates 1 and 2 create a current Secure status.
The app only claims **retained learning** when gates 3 and 4 are present as well. A failed later check
demotes Secure; a missing later check means retention is unknown, not failed and not silently assumed.

**Migration note.** Version `2026.08.09-a4.3c` moved the shared learning policy from 85/8 to 90/10,
so every screen and export now uses the same current Secure threshold. Retention validation remains a
separate longitudinal claim until every governed evidence source records distinct days and re-probes.
That limitation is explicit; the UI must never manufacture the missing checks.

### IV.3 Aggregation

Skill status is computed from **most-recent-evidence with recency decay, not the mean of all attempts.**
Competency-based grading practice is to give the grade "that represents their most recent level of
competence," and averaging punishes early failure — the single most common complaint about
standards-based gradebooks. ([Center for Assessment](https://www.nciea.org/blog/what-do-i-need-to-know-about-competency-based-grading/))

Evidence older than the recency window (currently 90 days) does not produce a current judgment. It is
still shown, labeled as historical, and still counts toward lifetime totals.

**Unlike sources are never averaged.** Formal assessment, teacher observation, and practice are different
kinds of evidence with different strengths, and the existing `REPORTING_EVIDENCE_STRENGTH` precedence
(formal 3, teacher observation 3, legacy projection 2, practice 1, exposure 0) is correct and stays.
**Practice can never produce Secure.** That rule already exists and is load-bearing; do not weaken it.

---

## Part V — Risk, benchmark and growth

### V.1 Vocabulary

These are three different things and the product must never blur them:

- **Benchmark goal** — an empirically derived, criterion-referenced target representing adequate skill
  for a grade and time of year; the level at which a student is likely to achieve the *next* benchmark.
- **Cut point for risk** — the level below which a student is unlikely to achieve subsequent goals
  without intensive support.
- **Growth** — change over time, normed against students who started in the same place.

([Acadience](https://acadiencelearning.org/help-center/acadience-reading-k-6-benchmarks-and-cut-points-for-risk/))

### V.2 Report risk in odds, not in colors

This is the most under-used communication asset in the field and the product should adopt it as its
house style:

| Band | Likelihood of achieving the next goal | Support level |
|---|---|---|
| Above benchmark | 90-99% | Core |
| At benchmark | 70-85% | Core |
| Below benchmark | 40-60% | Strategic |
| Well below benchmark | 10-20% | Intensive |

"Children at this level have historically had a 40-60% chance of meeting the next reading goal with
strong classroom instruction alone" is honest, actionable, and impossible to misread as a verdict on the
child. A colored dot is none of those.

**Support definitions**, stated in the UI wherever a band is shown: *Core* = effective base instruction.
*Strategic* = carefully targeted supplemental support in specific skill areas. *Intensive* = something
more or something different — smaller groups, more time, explicit modeling, greater scaffolding.

### V.3 Never map one instrument's bands onto another's

Acadience (Above/At/Below/Well Below + Core/Strategic/Intensive) and DIBELS 8 (Blue/Green/Yellow/Red +
negligible/minimal/some/at risk) are **different systems with different scales and different cut points.**
The source instrument is stored with every score and is displayed next to it. Cross-instrument
translation is a data-integrity bug, not a feature.

Reference bands, for interoperability only, never for computing a Literacy Guide band:

*DIBELS 8 composite, Red ceiling (= the "significant reading deficiency" line in several state statutes):*
K 279/355/405 · G1 320/376/426 · G2 315/372/420 · G3 313/376/423 (BOY/MOY/EOY).
([UO](https://dibels.uoregon.edu/sites/default/files/2024-01/dibels8_benchmark_goals.pdf);
cross-checked against [Colorado's separately published SRD cut scores](https://www.cde.state.co.us/coloradoliteracy/dibels8srdcutscores))

### V.4 Growth: what may be drawn

**No trend line below 5 data points.** Van Norman & Nelson simulated 15 weeks of weekly CBM-R data and
found the widely taught 4-point decision rule produces a **57% false-positive rate**; five points drops
it to 29%, six to 13%, seven to 6%. Their recommendation is a minimum of five to six consecutive points,
which reduces decision errors by at least half.
([Van Norman & Nelson](https://ga.thereadingleague.org/wp-content/uploads/sites/32/2021/07/Decision-making-accuracy-of-CBM.pdf))

This conflicts with NCII's official tip sheet, which endorses the four-point method at six data points
after three weeks. ([NCII](https://intensiveintervention.org/sites/default/files/2024-12/apm-decision-rules.pdf))
**The product's resolution:** implement the four-point rule because teachers expect it, label its output
**provisional**, and default the recommendation engine to a six-point threshold. Say in the UI that this
is a live methodological dispute. Do not pretend it is settled.

**Use a robust slope estimator, not ordinary least squares, below about ten points.** Theil-Sen was the
most robust method with small n and outliers in the Star Reading validity work, meaningfully better than
OLS at five to seven points.
([Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2018.00068/full))

**Every score carries an uncertainty band.** Oral reading fluency is the flagship offender: single-passage
CBM-R has a median standard error of measurement of **10 WCPM** (range 4-15), dropping to 5-7 with three
passages, and passage-difficulty variation alone can produce differences as large as **46 WCPM** between
the easiest and hardest form. ([BRT](https://brtprojects.org/wp-content/uploads/2022/07/NASP2013_v5.pdf))

So: never render an ORF score as a bare point value. **±10 WCPM single passage, ±6 for median-of-three.**
A 5-WCPM "gain" between windows is inside the noise floor and **must not be reported as growth.**

**Grade 1 has no fall ORF norms.** Hasbrouck & Tindal 2017 does not publish them, because first-graders
are not expected to read connected text in the fall. Any product showing a G1 fall ORF percentile is
fabricating it. This is a hard block.
([H&T 2017](https://files.eric.ed.gov/fulltext/ED594994.pdf))

### V.5 Growth display

Status on one axis, growth on the other. Never one composite. The product's growth descriptors, modeled
on Pathways of Progress:

| Descriptor | Growth percentile, conditional on starting point |
|---|---|
| Well above typical | ≥ 80th |
| Above typical | 60th-79th |
| Typical | 40th-59th |
| Below typical | 20th-39th |
| Well below typical | < 20th |

Goal logic: a child starting below benchmark targets the end-of-year benchmark **or** above-typical
progress. A child starting at or above benchmark targets maintaining status with **at least typical**
progress.

**Until Literacy Guide has its own conditional growth norms, it does not claim growth percentiles.** It
reports raw change with an uncertainty band and says plainly that it has no norm. Inventing a percentile
is worse than not having one. The current `growthAreas: []` and its comment ("A mixed list of attempts
split in half is not longitudinal growth") is **correct and stays** until the preconditions are met:
comparable forms, stable cohorts, and two policy-ready windows.

---

## Part VI — MTSS, tiers, and the legal red lines

### VI.1 What may be surfaced

Tier suggestions follow Law 4. Concretely:

1. Never write a tier assignment as a system-of-record field. Surface a **suggestion** with a
   team-confirmation step; store who confirmed and when.
2. Every suggestion exposes, in one click, which measures produced it, how many data points, and which
   rule fired.
3. The override is as prominent as the accept, and carries a free-text reason.
4. Never suggest a tier from a single measure or a single administration.
5. Language: "The data suggest this student may benefit from…" — never "This student is Tier 2."

Tier decisions are made by teaching teams using multiple measures — classroom teachers, special
educators, EL/ESL teachers, coaches, administrators — supported by written decision rules.
([MA DESE](https://www.doe.mass.edu/massliteracy/leading-mtss/data-based-decision.html);
[MTSS Center](https://mtss4success.org/essential-components/data-based-decision-making))

Default monitoring cadence, presented as **configurable defaults with the evidence level attached**:
Tier 1 universal screening only · Tier 2 every 2 weeks (minimum monthly) · Tier 3 weekly. Note honestly
that the WWC's own Recommendation 4 on Tier 2 progress monitoring carries a **LOW evidence rating**, and
that the panel found "little evidence demonstrates that weekly measures are superior to monthly ones."
Do not claim research support the field does not have.

### VI.2 The RTI red line — non-negotiable

**RTI cannot be used to delay or deny a special education evaluation.** OSEP Memo 11-07 is explicit: it
is inconsistent with the evaluation provisions for an LEA to reject a referral because a child has not
participated in an RTI framework; parents may request an initial evaluation **at any time** (34 CFR
§300.301(b)); and evaluation must occur within **60 days** of parental consent.
([OSEP 11-07](https://sites.ed.gov/idea/idea-files/osep-memo-11-07-response-to-intervention-rti-memo/))

**Any UI that shows a tier progression carries a persistent, non-dismissible note that a parent may
request an evaluation at any time and that tier progression is not a prerequisite.** Most MTSS
dashboards imply the opposite. This is a legal safety feature and a genuine differentiator.

### VI.3 Screening is not diagnosis

A screener identifies the probability of risk. It does not diagnose, does not identify a disability, and
"cannot definitively predict future outcomes."
([NCIL](https://www.improvingliteracy.org/resource/understanding-literacy-screening-classification-accuracy))
NAEYC: screening "identifies concerns requiring further evaluation; it does not diagnose or label
children." ([NAEYC](https://www.naeyc.org/resources/position-statements/dap/assessing-development))

If Literacy Guide ever publishes its own screening cut scores, it publishes **sensitivity and specificity**
alongside them (NCII thresholds: sensitivity ≥70%, specificity ≥80%). If it cannot, it does not call the
instrument a screener.

Every assessment in the system carries exactly **one purpose tag** — screening, diagnostic, progress
monitoring, or outcome — and the purpose **gates which reports it may feed**. A screening result may not
populate a diagnostic skill profile. ([IES](https://ies.ed.gov/learn/blog/making-sense-terms-used-early-reading-assessment))

---

## Part VII — The family report

### VII.1 Template

Fixed order. Every family report, every time.

1. **Summary highlight** — one sentence, plain language
2. **What your child can do** — named specifically. Not "meets standard" but "reads words with sh, ch, th"
3. **What we're working on next** — one or two items, maximum
4. **What this means** — benchmark context in odds language
5. **What you can do at home** — two or three concrete activities tied directly to item 3
6. **Who to talk to** — and how to ask for a conversation

Hambleton and Zenisky's score-report framework, applied to 40 real reports, found **Supporting Material
was the weakest domain in the field (1.28 out of 3.0)** while Language scored highest (2.45). The two
highest-leverage fixes it identifies are a **highlight/summary block at the top of every report** and a
**standalone interpretive guide under four pages** — not an 80-page manual, not a help-center article.
([Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00020/full);
[Zenisky & Hambleton 2012](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1745-3992.2012.00231.x))

Ship the four-page guide. It is where nearly everyone fails.

### VII.2 Language and design rules

Target an **8th-grade reading level**, measured, not assumed — CCSSO's guidance is to run report card
language through text-complexity tools and refine until it reaches that level.
([CCSSO](https://files.eric.ed.gov/fulltext/ED595053.pdf))

From the same source, as a hard checklist: simple familiar words over jargon · avoid compound and complex
sentences · **avoid percentiles and overly technical metrics** · most important information at the top ·
provide benchmarks that help interpret the data · keep colors, language and directionality consistent
across every report level · **avoid red-green color schemes** and test for color blindness · use
pictograms, which users remember better · large text · multiple languages · WCAG compliance.

Massachusetts adds: communicate in the family's preferred language and avoid educational jargon.

The existing `FAMILY_REPORT_BANNED_TERMS` linter in `reportAudienceTemplates.js` is exactly right and
must be **wired up rather than left dead** — it currently has no consumer outside its own test.

**Strengths-first is not concealment.** Lead with what the child can do; never omit or soften a risk
determination. California's report-card redesign was criticized precisely for obscuring low performance.
([EdSource](https://edsource.org/2024/will-test-score-reporting-clarify-or-further-befuddle-california-parents/723138))

---

## Part VIII — The do-not-report list

Hard rules. Each is a check, not a guideline.

| Do NOT report | To whom | Basis |
|---|---|---|
| A-Z / guided reading level | Families, children | [F&P's own position](https://fpblog.fountasandpinnell.com/a-level-is-a-teacher-s-tool-not-a-child-s-label) |
| Any ranked roster with names attached | Anyone | [Shepard](https://nepc.colorado.edu/sites/default/files/publications/Newsletter%20shepard_0.pdf); FERPA risk |
| A color band shown to the child | Children | Shepard |
| Percentiles by default | Families | [CCSSO](https://files.eric.ed.gov/fulltext/ED595053.pdf) |
| Any diagnosis or diagnosis-adjacent term ("dyslexic", "learning disability") | Anyone | [MA DESE](https://www.doe.mass.edu/instruction/screening-guide.pdf); NAEYC |
| Predicted future outcomes stated as fact | Anyone | [NCIL](https://www.improvingliteracy.org/resource/understanding-literacy-screening-classification-accuracy) |
| A proficiency judgment from < 10 scored items | Anyone | [Sinharay](https://files.eric.ed.gov/fulltext/ED523969.pdf) |
| A trend line from < 5 data points | Anyone | [Van Norman & Nelson](https://ga.thereadingleague.org/wp-content/uploads/sites/32/2021/07/Decision-making-accuracy-of-CBM.pdf) |
| An ORF percentile for Grade 1 fall | Anyone | [H&T 2017](https://files.eric.ed.gov/fulltext/ED594994.pdf) — the norms do not exist |
| A tier assignment without human confirmation | Anyone | [ED AI report](https://www.ed.gov/sites/ed/files/documents/ai-report/ai-report.pdf) |
| Comparisons to classmates | Families, children | Shepard |
| A WIDA proficiency level | Anyone | See the MLL chapter, §IX.6 |
| A special education referral recommendation | Anyone | [National Academies](https://www.nationalacademies.org/read/24677/chapter/12) |

**On A-Z levels specifically.** Fountas and Pinnell say of their own gradient that it was built "to be
used as a teacher's tool," that the levels "aren't meant to be shared with the children or parents," and
that reading levels have "no place in teacher evaluation or on report cards to be sent home to parents."
A level is a teacher's tool, not a child's label. Literacy Guide holds that line, and if a district
demands otherwise it is gated behind a teacher-only view with F&P's own position cited inline.

### VIII.1 What the product measures about itself

Two counter-metrics, both of which exist to keep the product honest:

- **Assessment time budget.** Show the running total of minutes this class has spent being assessed this
  month, on the teacher dashboard. Post-NCLB evidence on curriculum narrowing is unambiguous — 62% of
  districts increased ELA time, Au's synthesis of 49 studies found over 80% documented curriculum change
  toward teacher-centered instruction. A product that displays its own cost is a product a school can
  trust. ([ASCD](https://www.ascd.org/el/articles/high-stakes-testing-narrows-the-curriculum))
- **Never gamify assessment volume.** No dashboard, admin view, or leaderboard rewards "assessments
  completed."

---

## Part IX — The multilingual learner chapter

Full detail in `docs/reporting/MLL_LANGUAGE_REPORTING.md`. The governing rules, in brief:

### IX.1 Naming

The module is **MLL — multilingual learner.** WIDA's preferred term names the student by what they have
rather than what they lack, and the 2020 framework uses it throughout. "English Learner"/"EL" is retained
only where it is a legal term of art (Title III notices, state reporting).

**This also resolves a collision:** "EL" already means *EL Education Skills Block* throughout this
codebase — `elSkillsBlockCycles.js`, the six `el_*` assessments, `ElSkillsQuest.jsx`. Those are curriculum
alignment, not learner classification, and they keep their names.

### IX.2 What the module is

A **WIDA Language Development Portfolio**, not a scoring engine. WIDA's own definition: "a classroom-based
tool that can help teachers and multilingual learners see and understand students' language growth,"
holding "writings, transcripts of conversations, art projects, photographs, recordings, drawings, notes."
Its two analysis instruments — the **Portfolio Note Catcher** (observations across discourse, sentence,
word/phrase) and the **teacher-friendly PLD chart** (mapped quarterly) — are the model this module
implements.
([WIDA Focus Bulletin](https://wida.wisc.edu/sites/default/files/resource/FocusBulletin-Supporting-Multilingual-Learners-Language-Growth-Through-Language-Development-Portfolios.pdf))

This is both the legally safe position and, right now, the commercially strong one — see §IX.5.

### IX.3 Structure

Six proficiency levels: 1 Entering · 2 Emerging · 3 Developing · 4 Expanding · 5 Bridging · 6 Reaching.
Display **number first, name in parentheses** — "Level 3 (Developing)" — because the 2020 PLD tables are
numeric ("End of Level 1" … "Level 6") and will survive the 2027 revision, while the names keep it
legible to teachers.

Four domains (Listening, Speaking, Reading, Writing) for assessment; two modes (Interpretive, Expressive)
for standards. Carry both mappings.

Three dimensions on every descriptive judgment: **Discourse** (organization, cohesion, density) ·
**Sentence** (grammatical complexity) · **Word/Phrase** (precision).

Grade clusters **K, 1, 2-3** — three separate clusters, not one K-3 band. The single exception is
Standard 1 (Social and Instructional Language), which WIDA does band as `ELD-SI.K-3`. That band is the
most directly encodable artifact in the framework for a K-3 product and the module ships it verbatim.

Composite weights, printed on the ACCESS Individual Student Report itself:

| Composite | Listening | Speaking | Reading | Writing |
|---|---|---|---|---|
| Oral Language | 50% | 50% | — | — |
| Literacy | — | — | 50% | 50% |
| Comprehension | 30% | — | 70% | — |
| **Overall** | **15%** | **15%** | **35%** | **35%** |

Order of operations, which the module must respect: domain scale scores → weighted average → composite
scale score → composite proficiency level. **Proficiency levels cannot be averaged to produce a
composite.**

**Foreground Oral Language for K-3, not Overall.** Overall is 70% literacy-weighted. A young multilingual
learner who communicates well but cannot yet read posts a depressed Overall that under-represents their
functional English; the reverse profile posts a flattering one. Most platforms lead with Overall because
it is the exit number. For K-3 that is the wrong headline.

**Be kindergarten-aware in every calculation.** Kindergarten ACCESS uses a restricted scale (100-400 vs
100-600), so the maximum attainable levels are Listening 6.0, Speaking 6.0, **Reading 5.0, Writing 4.5**.
A naive distance-to-exit calculation will tell a teacher a kindergartner is failing to progress toward a
target that is arithmetically unreachable. Treat these as **configuration, not constants** — they may move
at the July 2026 standard setting.

### IX.4 Exit criteria are configuration, never constants

State exit thresholds range **4.0 to 5.0**: 5.0 is the most common (15 states), the remaining 17 spread
from 4.0 (Colorado, Florida) to about 4.8 (Alabama, North Carolina, Oklahoma). Eight states require
criteria *beyond* the ELP test — local reading/writing data, teacher judgment, a language-use inventory,
writing samples, passing grades.
([MPI](https://www.migrationpolicy.org/sites/default/files/publications/ESSA-Compendium-Final.pdf))

Criteria are frequently **conjunctive** — composite ≥ X **and** no domain below Y — so the data model must
support that shape. Every threshold carries an **effective date**, because the July 2026 standard setting
will force every WIDA state to revisit its cut.

That "additional criteria" list — writing samples, language-use inventories, teacher judgment — is exactly
what a classroom app can generate and what districts currently assemble by hand.

### IX.5 The 2025-27 discontinuity

WIDA rebuilt ACCESS for 2025-26. Kindergarten ACCESS was fully redesigned around a single storyline;
grades 1-12 changed behind the scenes with new speaking and writing rubrics. WIDA's own caveat: use
2025-26 proficiency level scores **"with caution"**, because they still reflect **2016 cut scores**; and
**"you cannot compare scale scores from previous years."** New cuts, revised PLDs and updated score
reports arrive **Spring 2027** following the standard-setting event of July 28-31, 2026.
([WIDA](https://wida.wisc.edu/news/how-standard-setting-impacts-2026-wida-access-scores))

**Hard rule: never join scale scores across the 2025-26 boundary.** Every trajectory chart carries a
visible break marker at that boundary. This is a correctness requirement, not a nicety.

It is also why WIDA is currently telling districts to "supplement assessment data with classroom
observations, interim measures, and family input" — which is precisely what this module produces.

### IX.6 What the product may and may not claim

| Defensible | Not defensible |
|---|---|
| "Aligned to the WIDA ELD Standards Framework, 2020 Edition" | "Your student's WIDA level is 3.2" |
| "This work sample shows features described at Level 2 in the WIDA PLDs" | "WIDA proficiency level: 2" |
| "Consistent with descriptors at Levels 2-3" (a **range**) | A single decimal implying scale-score precision |
| "Classroom evidence to bring to your ACCESS or ILP conversation" | "Predicted ACCESS score" |
| Describing along discourse / sentence / word-phrase | Any implication of substituting for the state ELP assessment |

Three mechanical safeguards: **emit ranges, never decimals** — "Levels 2-3" is descriptive, "2.4" mimics a
scale-score-derived quantity and is the clearest way to cross the line. **Label the source on every
score-like element** — "Classroom evidence (Literacy Guide)" versus "ACCESS (Spring 2026)" — and never let
them share a visual treatment or an axis. **Carry the standing disclaimer** (§IX.9).

Proficiency levels are computed from cut scores WIDA owns and is currently re-setting; a third party has
no access to the scale or the cuts and therefore cannot compute the quantity. Rosetta Stone's disclaimer
is the cleanest pattern in the market and the module copies it.

### IX.7 Language difference is not disability — the highest-care rule in the product

The National Academies finding that governs this section, verbatim: **"more than 90 percent of the
variance in DLL/EL classification was not related to learners' English proficiency. Rather, ethnicity,
social class, and reports from parents and teachers on quality of language use played a substantial role
in classification decisions."** And: **"the assessment scores of DLLs/ELs in English may reflect risk in
all areas measured. Yet measures administered in L1 may indicate that the student is in the low-risk
range."** ([National Academies ch.10](https://www.nationalacademies.org/read/24677/chapter/12))

The less English a student has, the more likely they are to be misclassified. Therefore:

1. **An English-only phonics screen cannot distinguish "cannot decode" from "does not yet have that
   phoneme."** A child who cannot hear a contrast cannot be expected to encode it. A /b/-for-/v/
   substitution in a Spanish-dominant child is a perception and production fact, not a
   grapheme-phoneme-correspondence failure.
2. **Low scores across all measured areas in English is the expected pattern for a newcomer.** At Levels
   1-2 the product **automatically suppresses deficit framing** and says so explicitly.
3. **English phonics data alone is never evidence toward a special education referral.** The product
   actively obstructs this. It emits no referral recommendation, ever; it points to the team process.
4. Consider disorder only when all three hold: intelligibility is genuinely compromised, patterns are
   not developmentally appropriate **in both languages**, and errors **cannot be explained by cue
   transfer.** All three, never any one.

**The mechanism is "forward cue transfer"** — a normal, expected, temporary stage of acquisition, not
error in any clinical sense.

**The module's flagship output is the non-transfer residue.** Not "these errors are transfer" but: *of
twelve error patterns, nine are explained by Spanish transfer; three are not, and those three are […]*.
That isolates the evidence that actually warrants attention and suppresses the noise that drives
misidentification. No competitor appears to ship it, including Ellevation.

Rules on transfer analysis: **require L1 before offering any transfer claim** — no L1, no claim. Track L1
**oral and L1 literacy separately**, because a child literate in Spanish transfers differently from one
who is not, and a child whose L1 uses a non-Latin script differs again. **Report confidence, not
verdicts** — "consistent with," never "this is transfer." **Always state the disconfirming evidence**;
transfer and difficulty are not mutually exclusive and a child can have both.

### IX.8 What an MLL report must contain

1. Identity and language background — L1 oral and L1 literacy separately, country of origin, years in
   US schools, date first identified
2. Current proficiency by domain, with the date and **source** of each score, labeled ACCESS vs screener
   vs classroom evidence
3. Trajectory — three years where available, with the 2025-26 rebaseline break marker
4. Distance to exit against the district's configured criteria, kindergarten-aware
5. What the student **can do now** — three to five PLD-anchored statements per domain, asset-framed
6. Growth evidence since the last report — dated work samples annotated on discourse / sentence /
   word-phrase
7. Services — program model, minutes, provider, accommodations
8. Goals — measurable, language-specific, tied to Language Expectations
9. **L1 transfer note**, including the non-transfer residue
10. What families can do — in the family's language, asset-framed, **explicitly affirming L1 maintenance**
11. Signatures, date, and communication method — the audit trail

Parent notification content is fixed by statute. ESEA §1112(e)(3) requires eight elements within 30 days
of the school year beginning, or the first two weeks for a mid-year enrollee. Elements 2 (level, how
assessed, academic status) and 6 (exit requirements and expected transition rate) are directly generatable
by this module.

### IX.9 The standing disclaimer

Shown on every MLL report surface and printed on every MLL export:

> Literacy Guide generates classroom evidence of language development aligned to the WIDA English Language
> Development Standards Framework, 2020 Edition. It describes what multilingual learners can do using the
> language of the WIDA Proficiency Level Descriptors across the discourse, sentence, and word/phrase
> dimensions.
>
> Literacy Guide does not produce WIDA proficiency levels or scores. Official English language proficiency
> levels come only from your state's designated ELP assessment. Use this evidence alongside — never
> instead of — those results.
>
> WIDA is a registered trademark of the Board of Regents of the University of Wisconsin System. These
> alignments are not affiliated with, sponsored by, or endorsed by the Board of Regents of the University
> of Wisconsin System.

### IX.10 Asset-based copy, enforced

A linter, not a style note. Banned on the left, required on the right:

| Never | Instead |
|---|---|
| "cannot yet", "struggles with", "lacks" | "is beginning to", "is developing", "can … with support" |
| "low proficiency", "weak in speaking" | "Level 2 (Emerging) in Speaking" |
| "language deficit", "language barrier" | "language development", "developing English alongside [L1]" |
| "non-English speaker" | "emerging bilingual", "multilingual learner" |
| "failed to progress" | "growth not yet visible on this measure" |

Every descriptor in the bank begins with a gerund of an observable action — "Retelling…", "Identifying…",
"Sorting…" — describing present capability, never absence. Level 6 is deliberately open-ended: the
framework refuses to define a point at which a multilingual learner is done.

---

## Part X — Exports

Exports are a first-class report surface, not a data dump. The current exports fail this part badly and
comprehensively (audit findings E1-E9).

### X.1 The governing principle

**A workbook is a report that happens to be in Excel.** It carries the same summary block, the same
vocabulary, the same colors and the same next-step guidance as the screen. A teacher who prints a sheet
and a teacher who opens the app must see the same words for the same child.

Concretely: the export uses `TEACHER_COPY` and the canonical status labels. It never invents export-only
synonyms. Today's exports say "Growing" where the screen says "Developing" and "Not started yet" where
the screen says "Not checked" — those are bugs.

### X.2 Every workbook has this shape

| Sheet | Purpose |
|---|---|
| **Cover** | Who, what class, what period, generated when, and the one-paragraph headline |
| **Summary** | The KPI band and the status split — the screen's top-of-report, in cells |
| **Teach next** | Groups and next moves. **The reason the file exists.** |
| *(body sheets)* | One per report section, in screen order |
| **How to read this** | Metric definitions, the status scale with its gates, and what missing values mean |
| **Data** | Long-format machine-readable rows for anyone who wants to pivot |
| **Provenance** | Sources read, versions, evidence window, privacy classification |

The **Teach next** sheet is the one teachers actually want and almost nobody ships: rows are students,
columns are next instructional targets, sortable and filterable. It converts the 76%-can-interpret /
38%-can-act gap directly into action. It goes third, before any detail sheet.

### X.3 Formatting requirements

Frozen header row and frozen first column · autofilter on every table · column widths fitted to content ·
wrapped text in prose columns · real number formats (percentages as percentages, not strings) · status
cells colored from the **canonical status id**, never by regex over the display string · conditional
formatting for heatmaps · tab colors matching the section accent · print setup configured (landscape
where wide, fit-to-width, repeating header row, footer with page numbers) · a confidentiality banner in
the header of every sheet.

**Colors match the screen exactly.** The current export palette does not: `greenSoft FFD9FBE8` against
the screen's `#F0FDF4`, `redSoft FFFFDADA` against `#FEF2F2`. One palette, defined once, consumed by both.

**Color by status, not by percentage.** `simpleStudentReports.js` already documents why — band comes from
status, not accuracy, so a 100%-accuracy tile can legitimately be neutral. An export that colors by
percentage will contradict the screen on exactly the cases that matter.

### X.4 Data-sheet rules

1. **Long format** — one row per student per skill per window. Teachers pivot; they do not parse nested
   JSON. Wide format is a secondary option.
2. **Code and label, always both.** `skill_code` and `skill_name`; `status_id` and `status_label`. Never
   export a bare enum.
3. **Always include the denominator.** Every score column has an adjacent `items_scored` column. Without
   it a teacher cannot tell 2/2 from 18/20 — and per Law 2, neither can the product.
4. **An explicit `evidence_sufficiency` column** derived from item count. This is the honest way to ship
   skill-level data.
5. Assessment date and window, not just the term.
6. Stable IDs across exports so files join across windows.
7. UTF-8 with BOM for CSV · ISO 8601 dates · quoted text fields · no locale-dependent number formats.
8. A data dictionary in every bundle.

### X.5 Privacy on exports

Exports containing direct identifiers are education records under FERPA the moment they leave the system.

- **Three identifiability modes**: De-identified (no direct identifiers, small-cell suppression) ·
  Pseudonymous (stable opaque id) · Identified (names). **Default to Pseudonymous** for anything leaving
  the roster context; require an extra confirmation for Identified.
- **Watermark and log.** Every export carries generating user, timestamp, scope, and the banner
  "Contains student education records — protected under FERPA. Do not redistribute." Log every export
  event with user, scope, and row count.
- **Suppress small cells** in aggregate exports; configurable, default n < 10.
- **Never include free-text teacher notes in a bulk export by default.** They are the highest-risk field
  type and the most likely to contain health, family or behavioral information.
- State at export time that the file leaves the product's control.
- No third-party analytics on export paths; no re-disclosure without district authorization.

### X.6 Interoperability

For district exports, follow **OneRoster v1.2**: `textScore` plus `ScoreScale` is exactly the mechanism
for exporting a four-point standards-based mark without misrepresenting it as a percentage, and
`learningObjectiveSet` attaches the CCSS RF standard to a line item.

For warehouse exports, follow **Ed-Fi**, whose `ObjectiveAssessment` hierarchical nesting maps cleanly
onto Part III: SVR component → Rope strand → phonics group → GPC. Adopt Ed-Fi's **minimum-inclusive,
maximum-exclusive** convention for performance-level boundaries internally, so exports need no
translation. It is a real interoperability rule and a classic off-by-one source.

---

## Part XI — Compliance floor

Build to the **union**, which is a superset satisfying most states:

- **FERPA** — the district must be able to direct deletion and the product must certify it; no
  re-disclosure of PII to any subprocessor (including analytics, LLM APIs, and error tracking) without
  explicit district authorization; "direct control" means the district decides retention.
- **COPPA as amended** — final compliance deadline was **22 April 2026**, so it is already binding. No
  indefinite retention; specific retention schedules; a written information security program with a
  designated coordinator, annual risk assessments and service-provider oversight; enhanced notice naming
  third-party recipients and their purposes. **Compliance cannot be delegated to schools or parents.**
- **NY Education Law 2-d / Part 121** — the de facto national ceiling. Parents Bill of Rights;
  NIST CSF alignment; **breach reported to the Chief Privacy Officer within 10 days and to impacted
  families within 60 days**.
- **SOPIPA** — no targeted advertising from student data, no profile-building for non-educational
  purposes, no sale of student information.

Two current-events items: the **Student Privacy Pledge was retired on 25 April 2025** — do not display
its badge, it now signals out-of-date compliance work. The practical replacement is the **SDPC National
Data Privacy Agreement, v2.2 (19 November 2025)**, developed by 28 state alliances with over 275,000
DPAs executed. Signing it and publishing the general offer removes per-district legal negotiation from
the sales cycle; it is the highest-ROI compliance action available to a K-12 vendor.

**A direct-to-consumer tier is a different compliance regime**, requiring verifiable parental consent
rather than school authorization. School and home products must be separated at the account and data
level, not merely in the UI. See `docs/product/FREE_TIER_SPEC.md`.

---

## Part XII — The rules, compressed

If a reviewer reads one page, this is it.

1. **≤ 6 family-facing strands.** Finer granularity is teacher-only.
2. **No proficiency judgment below 10 scored items; 10-19 renders provisional.**
3. **Status and growth are orthogonal.** Never merged. Growth is normed on starting point.
4. **No trend line below 5 points.** Robust estimator, not OLS. Four-point rule output is labeled provisional.
5. **Every score carries an uncertainty band.** ORF ±10 WCPM single passage.
6. **Current Secure = 90% accuracy and ≥10 recent items. Retained learning additionally requires ≥2
   separate days and a retention re-probe at 14-28 days.** A failed retention check demotes Secure. A
   rate criterion is also required where one exists.
7. **Tier suggestions are suggestions.** Evidence exposed, override prominent, actor logged. The RTI
   notice is non-dismissible.
8. **Family reports: 8th-grade reading level, no percentiles, summary block at top, four-page guide shipped.**
9. **Never report A-Z reading levels to families or children. Never produce a named ranked roster.**
10. **Screening is not diagnosis.** No diagnostic label, ever. Surface the right to request an evaluation.
11. **Missing is never zero.** "Not checked" is neutral-colored and never counted as failure.
12. **One status vocabulary on every surface, screen and export alike.**
13. **Exports are reports.** Cover, summary, Teach next, body, how-to-read, data, provenance. Long format,
    code plus label, denominator always, evidence-sufficiency column, watermarked, logged, pseudonymous
    by default.
14. **MLL emits ranges, never decimals; never a WIDA level; never a SPED referral.** Requires L1 before
    any transfer claim. Ships the non-transfer residue. Never joins scale scores across the 2025-26 break.
15. **Compliance floor = FERPA ∪ amended COPPA ∪ NY 2-d ∪ SOPIPA.** Sign NDPA v2.2. No Privacy Pledge badge.

---

## Appendix A — Open questions

Carried forward honestly rather than resolved by assertion.

1. **"Parent Interpretation and Use of Diagnostic Mastery-Based Score Reports,"** *Applied Measurement in
   Education* 38(3-4), 2026, [doi:10.1080/08957347.2026.2630044](https://doi.org/10.1080/08957347.2026.2630044).
   This product *is* a diagnostic mastery-based score report. Full text was paywalled. Obtain before
   finalizing the family report design.
2. **WIDA Language Charts** for clusters K, 1 and 2-3, both modes — only the Grades 4-5 Expressive sample
   is public. These supersede the Can Do Descriptors from 2026-27 and are the forward-compatible bank.
   Request them from wida.wisc.edu.
3. **Kindergarten ACCESS maxima post-redesign.** The 100-400 range and 6.0/6.0/5.0/4.5 ceilings predate
   the redesign and may move at standard setting. Held as configuration for this reason.
4. **The Arabic L1 transfer table** is consistent across sources but has no peer-reviewed anchor, and
   flattens real dialect variation. Have a linguist review before it ships to customers.
5. **The 2016→2020 Key Use crosswalk** (Recount → Narrate / Inform) is this product's inference, not a
   WIDA-published crosswalk. It is labeled as such in-product and the 2016 provenance is stored.
6. **Per-state exit cut scores** need ingesting from `wida.wisc.edu/sites/default/files/id-placement/`,
   and all of them will move after July 2026.
7. **Literacy Guide has no conditional growth norms of its own.** Until it does, it reports raw change
   with an uncertainty band and no percentile.
