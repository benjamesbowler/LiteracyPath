# Multilingual learner language reporting

The MLL module — what it is, what it refuses to do, and how to use it.

Governed by `docs/reporting/REPORTING_BIBLE.md` Part IX. Implemented in `src/policy/mllLanguagePolicy.js`,
`src/data/mll/`, and `src/utils/exportMllReportExcel.js`. Tested in `tests/unit/mllLanguageReporting.test.js`.

---

## Why it is called MLL and not EL

Two reasons, and they point the same way.

**The collision.** "EL" already means something in this codebase: **EL Education**, the curriculum.
`elSkillsBlockCycles.js`, `ElSkillsQuest.jsx`, `elBenchmarkAssessmentCatalog.js`, and the six `el_*`
assessments are Skills Block alignment, not learner classification. Roughly a hundred files carry the
prefix. Adding a second, unrelated meaning of "EL" to the same codebase would be a permanent source of
confusion in exactly the area where confusion is most expensive.

**The better reason.** "Multilingual learner" is WIDA's own preferred term, used throughout the 2020
framework. It names the student by what they have — more than one language — rather than by what they
lack. That is not decoration; it is the Can Do Philosophy applied to the first word a teacher reads.

"English Learner" and "EL" survive where they are legal terms of art: Title III parent notifications,
state reporting, the ESSA accountability indicator. In those places the law's word is the right word.

---

## What this module is

**A WIDA Language Development Portfolio.** Not a scoring engine.

WIDA's own definition: "a classroom-based tool that can help teachers and multilingual learners see and
understand students' language growth," holding "writings, transcripts of conversations, art projects,
photographs, recordings, drawings, notes, and so on." Its two analysis instruments — the **Portfolio
Note Catcher** (observations across discourse, sentence and word/phrase) and the **teacher-friendly PLD
chart** (mapped quarterly) — are what this module implements.
([WIDA Focus Bulletin](https://wida.wisc.edu/sites/default/files/resource/FocusBulletin-Supporting-Multilingual-Learners-Language-Growth-Through-Language-Development-Portfolios.pdf))

This is both the legally safe position and, right now, the commercially strong one.

---

## Why right now is the moment

WIDA rebuilt ACCESS for 2025-26 and rebaselined the scale. In WIDA's own words:

- Use 2025-26 proficiency level scores **"with caution"** — they still carry **cut scores set in 2016**.
- **"You cannot compare scale scores from previous years."** 2025-26 is a new baseline.
- New cut scores, revised proficiency level descriptors and updated score reports arrive **Spring 2027**,
  after the standard-setting event held 28-31 July 2026 in Boston.
- Kindergarten ACCESS was rebuilt entirely around a single storyline; grades 1-12 changed behind the
  scenes with new speaking and writing rubrics.
- The tests are now **"WIDA ACCESS"** and **"WIDA ACCESS for Kindergarten"** — "for ELLs" was dropped.
  UI copy should not say it.

([How Standard Setting Impacts 2026 Scores](https://wida.wisc.edu/news/how-standard-setting-impacts-2026-wida-access-scores);
[WIDA ACCESS in 2025-26](https://wida.wisc.edu/revisingaccess))

So for roughly the next year, teachers **cannot** trust year-over-year ACCESS comparisons — and WIDA is
telling districts to *"supplement assessment data with classroom observations, interim measures, and
family input."* That is precisely what this module produces. The tailwind is real and it is temporary;
the module is built to still be correct after it passes.

Separately: the **2015 OCR/DOJ Dear Colleague Letter** on EL students was rescinded in August 2025, and
the federal **EL Toolkit** now carries a formal rescission header. **The law did not change.** Title VI,
the EEOA of 1974, *Lau v. Nichols*, the *Castañeda* three-prong test and every ESSA Title I and Title III
statutory requirement all still bind. In-product citations therefore point at **statute and case law**,
not at the rescinded guidance.

---

## The five hard rules

### 1. Never emit a WIDA proficiency level

Proficiency levels are computed from cut scores WIDA owns and is currently re-setting. A third party has
no access to the scale or the cuts, so it cannot compute the quantity — and any mapping published today
is against 2016 cuts that expire in Spring 2027.

`MLL_PROHIBITIONS.no_wida_level`, asserted in test.

### 2. Emit ranges, never decimals

"Levels 2-3" is a description. "2.4" mimics a scale-score-derived quantity and is the single clearest
way to cross the line. `mllLevelRangeLabel` is the only sanctioned formatter, and a test asserts no
decimal can appear in its output.

A working range is anchored on an official score and widened by one level, because classroom
performance moves within a level between tests. **With no official score, no range is offered at all** —
`estimateWorkingLevelRange` returns `basis: "classroom_only"` and says so in plain words. Estimating a
range from classroom evidence alone would be a WIDA level in all but name.

### 3. Label the source on every score-like element

"WIDA ACCESS · 2026-02-14" and "Classroom evidence (Literacy Guide)" never share a table, a colour or an
axis. `MLL_EVIDENCE_SOURCES` carries an `official` flag; `latestOfficialLevels` reads only official rows
and leaves a domain empty rather than filling it with classroom evidence.

### 4. Never join scale scores across the 2025-26 rebaseline

`crossesScaleRebaseline` detects it in both directions and `buildMllTrajectory` inserts a visible break
row. The workbook fills that row amber so it cannot be skimmed past. This is a correctness requirement,
not decoration.

### 5. Never recommend a special education referral

The National Academies finding that governs this: **"more than 90 percent of the variance in DLL/EL
classification was not related to learners' English proficiency. Rather, ethnicity, social class, and
reports from parents and teachers on quality of language use played a substantial role in classification
decisions."** And: **"the assessment scores of DLLs/ELs in English may reflect risk in all areas measured.
Yet measures administered in L1 may indicate that the student is in the low-risk range."**

The module points at the team process. A test asserts no output text recommends a referral.

---

## Kindergarten is different, and the difference is a trap

Kindergarten ACCESS uses a restricted scale (100-400 versus 100-600), so some proficiency levels are
simply unavailable. WIDA's framing: *"This is not a score cap. Rather, not having the full scale score
range that is available to Grades 1-12 also means some corresponding proficiency levels are also not
available."*

| Domain | Kindergarten maximum |
|---|---|
| Listening | 6.0 |
| Speaking | 6.0 |
| Reading | 5.0 |
| **Writing** | **4.5** |

The naive failure is obvious once stated: a district rule of "no domain below 4.5" is **unsatisfiable
for every kindergartner in the state**, and a distance-to-exit calculation that does not know this
reports every one of them as falling short. `evaluateDistanceToExit` handles three cases:

- **Composite target above the arithmetic ceiling** → no shortfall shown, and the note says "this is a
  property of the test, not of the student."
- **Domain floor above a domain ceiling** → same treatment, naming the domain, plus "check the
  district's kindergarten exit criteria."
- **Target within half a level of the ceiling** → shortfall shown, with a caveat that it needs close to
  the maximum in every domain.

These figures predate the kindergarten redesign and may move at standard setting. They are held as
configuration with `verified: false`, and a test asserts that flag.

---

## Composites, and why K-3 leads with Oral Language

| Composite | Listening | Speaking | Reading | Writing |
|---|---|---|---|---|
| Oral Language | 50% | 50% | — | — |
| Literacy | — | — | 50% | 50% |
| Comprehension | 30% | — | 70% | — |
| **Overall** | **15%** | **15%** | **35%** | **35%** |

Printed on the face of the ACCESS Individual Student Report. WIDA's rationale is that literacy scale
scores carry greater weight "due to their relative emphasis and importance to success in school."

**Order of operations matters:** domain scale scores → weighted average → composite scale score →
composite proficiency level. **Proficiency levels cannot be averaged to produce a composite.**
`computeCompositeScaleScore` works on scale scores and returns `complete: false` with the missing
domains named rather than filling a gap with zero.

**Overall is 70% literacy-weighted.** For K-3 that makes it the wrong headline in both directions: a
child who communicates beautifully but cannot yet read posts a depressed Overall that under-represents
their functional English, and a strong decoder with a speaking gap posts a flattering one. Most
platforms lead with Overall because it is the exit number. This module leads with Oral Language and says
why on the report.

---

## The differentiator: the non-transfer residue

Every competitor that touches phonics data for multilingual learners reports the errors. None appear to
separate the errors that are *expected* from the errors that are not.

An English-only phonics screen cannot distinguish "cannot decode" from "does not yet have that phoneme
in their inventory." A /b/-for-/v/ substitution in a Spanish-dominant child is a perception and
production fact, not a grapheme-phoneme-correspondence failure. The mechanism is **forward cue
transfer** — a normal, expected, temporary stage of acquisition, not error in any clinical sense.

So the flagship output is not "these errors are transfer." It is:

> Of 12 error patterns, 9 are explained by Spanish transfer; 3 are not, and those 3 are: […]

That isolates the evidence that actually warrants attention and suppresses the noise that drives
misidentification.

### The rules around it

- **No home language, no analysis.** `analyzeL1Transfer` returns `available: false` and says a transfer
  hypothesis without a named first language is a guess dressed as evidence.
- **Track L1 oral and L1 literacy separately.** A child literate in Spanish transfers differently from
  one who is not, and a child whose L1 uses a non-Latin script differs again.
- **Confidence, never verdicts.** "Is a well-documented pattern for" / "is consistent with reported
  patterns for" — never "this is transfer."
- **Always state the disconfirming evidence.** If the same sound is produced correctly elsewhere, the
  report says so — that is direct evidence the letter-sound knowledge is intact.
- **An empty residue is not a clean bill of health.** The narrative says: "That does not rule out a
  difficulty — it means this evidence does not show one."
- **Levels 1-2 automatically suppress deficit framing.** Low English performance at Entering and
  Emerging is the expected pattern, and the report says that rather than letting a teacher read a low
  number as a problem.

### The reference tables

| Language | Sourcing | Highest-value K-3 flags |
|---|---|---|
| **Spanish** | Colorado DOE phoneme comparison; Gorman (bilinguistics); ERIC EJ1237446 | Initial s-cluster epenthesis (*school → eschool*) · /b/ for /v/ · th-stopping · final devoicing · lax/tense vowels · schwa |
| **Mandarin** | Pronunciation Studio | **Final consonant deletion — expect it** · all consonant clusters · /l/~/r/ · final /n/~/ŋ/ · -s and -ed endings (a cluster problem, not a morphology problem) |
| **Vietnamese** | Can Tho University Journal of Science | **Final consonant deletion as the default** · clusters in both positions · aspiration · inflectional endings |
| **Arabic** | Commercial sources only — ⚠ `needs_linguist_review` | **/b/ for /p/ is the signature pattern** · /f/ for /v/ · cluster epenthesis · short vowels in spelling |

The `-s` and `-ed` observation is worth calling out on its own: for a Mandarin or Vietnamese speaker
those are **phonotactic** problems, not grammar problems, because the languages permit almost no final
clusters. A teacher reading them as a morphology gap will teach the wrong thing. The report says which
it is.

The Arabic table is flagged in the data (`reviewStatus: "needs_linguist_review"`), surfaced in the
report as a caution, and asserted in test. Its patterns are consistent across sources and consistent
with Arabic phonology, but no peer-reviewed anchor was available and the table flattens real dialect
variation across Egyptian, Levantine, Gulf and Maghrebi.

**Cantonese is deliberately not aliased to Mandarin.** Different phonology; mapping one to the other
would produce confident wrong answers, which is worse than none.

---

## The descriptor bank

195 verbatim WIDA Can Do Descriptors: three grade clusters (K, Grade 1, Grades 2-3) × four domains ×
five proficiency levels, plus the oral-only Discuss rows.

Two things to know before using it.

**It is keyed to the 2016 Key Uses.** Recount, Explain, Argue, Discuss — while the current standards use
the 2020 Key Language Uses: Narrate, Inform, Explain, Argue. WIDA split Recount into Narrate and Inform
and absorbed Discuss into Standard 1. There is no 2020-aligned rewrite of the Can Do Descriptors; WIDA's
forward path is the **Language Charts**, which become the interpretive tool for ACCESS scores from
2026-27.

`KEY_USE_CROSSWALK_2016_TO_2020` maps Recount to Narrate where the descriptor is time-sequenced and to
Inform where it is definitional. **That row-by-row split is this product's inference, not a
WIDA-published crosswalk.** Every affected row carries `crosswalkInferred: true`, the workbook prints
"(mapping inferred)" next to it, and `keyUse2016` is retained as provenance so the bank can be re-keyed
when WIDA publishes one.

**Level 6 has no descriptors.** That is the source's choice, not an omission here — the framework
declines to define an endpoint at which a multilingual learner is finished. `descriptorsFor` returns an
empty list and a note saying so, never a fabricated statement.

Report statements are taken at the **lower** bound of a range, because a report should claim what is
securely observable rather than the most flattering reading.

Two tests keep the bank honest: every descriptor must open with a gerund of an observable action, and no
descriptor may trip the asset-based copy linter.

---

## Exit criteria are configuration, never constants

State exit thresholds range **4.0 to 5.0**. 5.0 is the most common (15 states); the remaining 17 spread
from 4.0 (Colorado, Florida) to about 4.8 (Alabama, North Carolina, Oklahoma). Eight states require
criteria *beyond* the ELP test — local reading or writing data, teacher judgment, a language-use
inventory, writing samples, passing grades.

Criteria are frequently **conjunctive**: composite ≥ X **and** no domain below Y. Every threshold carries
an **effective date**, because the July 2026 standard setting will force every WIDA state to revisit its
cut.

That "additional criteria" list is the module's strongest wedge: writing samples, language-use
inventories and teacher judgment are exactly what a classroom app can generate and what districts
currently assemble by hand.

`MLL_DEFAULT_EXIT_CRITERIA` ships a placeholder that says, in its own `source` field, to replace it
before using distance-to-exit. With nothing configured, the report shows no distance at all.

---

## What an MLL report contains

Eleven sections, in this order. Identity and assets come before any score, and the transfer analysis
comes before anything that could be read as a concern.

1. Student and language background — L1 oral and L1 literacy **separately**, country of origin, years in
   US schools, date first identified, and **funds of knowledge** as a first-class field
2. Current English language proficiency — four domains plus composites, each with date and source
3. Language proficiency over time — three years where available, with the rebaseline break marker
4. Progress toward exit criteria — kindergarten-aware
5. What this student can do now — PLD-anchored, asset-framed
6. Classroom language evidence — the Portfolio Note Catcher across discourse, sentence, word/phrase
7. First-language transfer — including the residue
8. Services and accommodations
9. Language goals, tied to Language Expectations rather than to a score
10. For families — in plain language, explicitly affirming first-language maintenance
11. Record of communication — date, method, language, interpreter — the audit trail

Sections 2 and 4 generate two of the eight elements ESEA §1112(e)(3) requires in a parent notification:
the child's proficiency level and how it was assessed, and the specific exit requirements. That is the
concrete "we save you the annual letter" hook.

---

## The workbook

`createMllStudentWorkbook` and `createMllClassWorkbook`. The standing disclaimer prints on the cover and
at the foot of every sheet showing anything score-like.

The class workbook is a **caseload**, not a ranking: alphabetical, grouped by service need, with an
explicit note saying so. A named ranked roster is not something this product produces.

`createCanDoBankWorkbook` exports the descriptor bank on its own, which is useful as a planning
reference independent of any student.

---

## The copy linter

`lintMllLanguage` is a linter, not a style note. It runs over generated prose and fails on the deficit
constructions the Can Do Philosophy exists to displace:

| Never | Instead |
|---|---|
| "cannot yet", "struggles with", "lacks" | "is beginning to", "is developing", "can … with support" |
| "low proficiency", "weak in speaking" | "Level 2 (Emerging) in Speaking" |
| "language deficit", "language barrier" | "language development", "developing English alongside [L1]" |
| "non-English speaker" | "emerging bilingual", "multilingual learner" |
| "failed to progress" | "growth not yet visible on this measure" |

`buildMllStudentReport` runs it over its own output and returns `copyIssues`. A test asserts that array
is empty for a normal report.

---

## Positioning

> Literacy Guide generates classroom evidence of language development aligned to the WIDA English
> Language Development Standards Framework, 2020 Edition. It describes what multilingual learners can do
> using the language of the WIDA Proficiency Level Descriptors across the discourse, sentence, and
> word/phrase dimensions.
>
> Literacy Guide does not produce WIDA proficiency levels or scores. Official English language
> proficiency levels come only from your state's designated ELP assessment. Use this evidence
> alongside — never instead of — those results.
>
> WIDA is a registered trademark of the Board of Regents of the University of Wisconsin System. These
> alignments are not affiliated with, sponsored by, or endorsed by the Board of Regents of the
> University of Wisconsin System.

The pattern is Rosetta Stone's, which is the cleanest disclaimer in the market. Lexia's architecture is
the one to copy structurally: align to standards, claim impact through research, never claim to produce
the score.

**Ellevation is the market leader and the wrong target.** Its benchmark is ~20 minutes across four
domains up to three times a year, and its data is largely aggregated from other systems rather than
generated in the instructional moment. A K-3 literacy app has continuous, phoneme-level,
instructionally-grounded evidence that Ellevation structurally cannot produce. Position as
evidence-generating and complementary; an export path into Ellevation is worth more than competing with
it.

**Do the free PRIME 2020 Portfolio Workbook self-analysis.** It disciplines the alignment claims and
gives defensible internal documentation. Defer the $20,000-per-grade-cluster Seal — WIDA states plainly
that it "does not endorse any set of instructional materials" and that PRIME "is not an evaluative tool
that judges the effectiveness of published materials." Note that products still citing a "PRIME V2 seal"
are citing a superseded protocol.

---

## Still to do

**Data layer.** The profile fields need a migration:
`supabase/migrations/20260806120000_multilingual_learner_profile.sql` adds them to `students` with RLS
matching the existing teacher-ownership pattern. Nothing reads them until the roster UI writes them.

**Roster UI.** A teacher needs somewhere to set the MLL flag, home language, L1 literacy and program
model. Until that exists, the module runs on data nobody can enter.

**Get these files from WIDA.** The **Language Charts** for clusters K, 1 and 2-3, both modes — only the
Grades 4-5 Expressive sample is public. They supersede the Can Do Descriptors from 2026-27 and are the
forward-compatible bank.

**Verify.** The kindergarten maxima after the July 2026 standard setting. Per-state exit criteria from
`wida.wisc.edu/sites/default/files/id-placement/[XX]-ID-Placement-Guidance.pdf`. The Arabic transfer
table, with a linguist. The K-3 Key Language Use prominence table in Appendix C, which an automated read
returned as "all four most prominent" and which is worth five minutes of human eyes before it is used as
a filter.
