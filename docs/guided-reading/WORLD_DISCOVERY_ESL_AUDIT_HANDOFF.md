# World Discovery ESL and image audit — 9 November 2026

This is a remediation handoff, not a new publication approval. The
[writing Bible](../content/STORY_BIBLE_PART_1_WRITING.md#78-natural-voice-edit),
[collection Bible](WORLD_DISCOVERY_CONTENT_BIBLE.md),
[cohort contract](WORLD_DISCOVERY_COHORT_REGISTRATION.md) and
[illustration standard](../design/ILLUSTRATION_STYLE_STANDARD.md) remain the
authorities. The product owner reaffirmed that every book must serve ESL
children, avoiding abstract or outdated language at every reading level.

## Scope and evidence

The audit covered both November cohorts, World Discovery 01–10 and 11–20 at
levels A–E: 100 books, 880 reading pages and 100 covers. All page text, titles,
discussion prompts and oral vocabulary preparation were read. All 980 images
received visual review in page-order sheets with text; 55 unique images also
received native-resolution follow-up. This does not claim a new deployed-reader,
listening, physical-device or comprehensive scientific acceptance.

Result: 84 required revision finding families across 59 books, including 14
confirmed image repairs across nine books. Another 42 findings are optional
polish. Counts refer to grouped editorial findings, not bad pages or a quality
percentage. Most imagery is coherent; the recurring weakness is abstract
endings and unnecessarily difficult surrounding language, especially in D/E.

Detailed before/after proposals, all-book coverage, exact source hashes,
980 image hashes and retained visual evidence are local ignored QA artifacts:

- `.artifacts/world-discovery-esl-audit-20261109/REPORT.md`
- `.artifacts/world-discovery-esl-audit-20261109/REVIEW.html`
- `.artifacts/world-discovery-esl-audit-20261109/audit.json`
- `.artifacts/world-discovery-esl-audit-20261109/book-coverage.csv`
- per-level reviewer reports and sequence sheets in that directory.

The consolidated report is the reconciled audit result. It downgrades B13's
literal postal-distance phrase to optional polish, clears suspected E12 bench
geometry and E16 model geometry errors, and retains E17 species markings and
E20 crisp plant detail rather than calling visual density alone an art defect.

## Repair priorities

| Book | Location | Required correction |
| --- | --- | --- |
| B11, A Break for Kit | pp6–7 | Restore seven road blocks, one loose eighth block and the visible final gap. The current visual question lacks its expected evidence. |
| C14, The Arrow Bookmark | pp2, 5 | Separate the opposing arrowheads; the assessed backward arrow currently merges into an X. |
| D06, Marks on the Moon | p9 | A rock hits a rim and makes a crater. The current wording incorrectly makes the smaller crater the thing that strikes. |
| B19, Can Light Get Through? | pp2, 4 | Name the pictured freestanding screen, rather than a wall. |
| C11, A Way to Remember | p2 | Kit is already indoors; describe walking to the shelf. |
| D04, The Pocket of Wind | title and repeated object name | The pictured prop is a detached zip bag; use the matching concrete object name. |
| D03, Two Pipes Under the Sink | p1 | Give the tilted pouring cup a connected holding hand or stable support. |
| A08, A Chick Grows | p2 | Replace dense simulated feather/straw texture with the prescribed clean cartoon finish. |
| C20, The Log Stays | pp2, 4 | Replace hyper-textured bark/soil and focus blur while retaining the ecological clues. |
| D11, D12, D14 | p10, p4, p3 respectively | Simplify mottled wall/floor finishes. These are subtler style defects, not anatomy failures; recheck sequence consistency during repair. |
| E19, One Group Is Not Enough | pp5–7 | Simplify continuous simulated tabletop fibres; preserve the correct chart, labels, shape placement and hands. |

The D06 causal correction was checked against
[NASA's impact-crater explanation](https://spaceplace.nasa.gov/impact-crater/en/).
The E06 viewer-language proposal was checked against
[NASA's explanation of Moon phases](https://science.nasa.gov/moon/top-moon-questions/).
These targeted checks do not replace each nonfiction book's scientific review.

Writing revisions should replace phrases such as “your loud bit,” “the battery
connects two parts of the day,” “one meal connects two lives” and “the path,
hedge, and window share the night” with named objects and visible actions.
Keep useful science terms, accurate mechanisms and the intended thinking task;
make their explanations easier than the target word. Edit teacher questions
and vocabulary support alongside the manuscript.

## State and next implementation boundary

Only the canonical writing requirement and this handoff changed in the audit.
No manuscript, image, narration, exact-text review hash, runtime registration or
hosted publication state changed. The 119 proposed full-page replacements
(required and optional combined) were checked against the source snapshots and
page limits: A ≤6 words, B ≤14, C–E ≤22.

Implement the required revisions as a deliberate content/media remediation:
update matching narration and exact-text level/content reviews with the source;
update art provenance and applicable image integrity records with replacements;
then inspect the actual reader, images and playback. Preserve the pinned original
cohort during unrelated expansion work. Do not weaken its non-interference fixture
or reuse old approvals to make changed text or pixels pass.

The audit artifacts are retained as required review evidence. Temporary report
builders are disposable after validation. Source media, protected animation,
other projects and broad disk cleanup are outside this task.
