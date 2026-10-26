# Reading Comprehension: shared passages, teaching and print

Status: proposed design; awaiting approval before product implementation.

## Intent and agreed direction

Add a Reading Comprehension area inside LiteracyPath, with whole-group,
small-group and student use, plus matching black-and-white worksheets that
children can colour. The owner selected a shared comprehension area rather
than a standalone printable pack or an extension inside Guided Reading.

The two supplied PDFs are visual and difficulty references, not instructions
to follow or source text to republish. Their useful classroom pattern is a
short phonics-focused passage, rereading checks, simple questions, roomy
handwriting lines and outline art. All new passages, questions and layouts
will be original and use LiteracyPath's established characters.

## Approaches

1. Shared passage bank with three modes and print output: selected by owner.
   One passage and answer source keeps teaching, practice and print consistent.
2. Worksheet-studio-only addition: simpler print integration, but insufficient
   for the requested screen-based group and student activities.
3. Guided Reading extension: reuses book navigation, but mixes a short-passage
   comprehension task with the existing book-reading experience and its retired
   scored quizzes. Keep books and their current completion policy intact.

## Discoverability and flow

Teachers: Teach -> Reading Comprehension -> choose passage -> Whole group,
Small group, Student practice or Print. Link to the same catalogue from the
worksheet studio. Students: Books -> Reading Comprehension -> choose a passage
-> read and answer. Preserve the eight existing Home destinations.

Use a compact catalogue with phonics focus and reading-demand filters, clear
passage titles, character and word count. Avoid an extra setup wizard. The
same selection opens in another mode or prints without another search.

## Starter content and reading claims

Builder proposal: ship 24 distinct, authored passages: four short-vowel/CVC,
four consonant digraph/blend, six silent-e and ten vowel-team passages,
including ai, ay, ee, ea, oa, ow, igh and long-vowel contrasts. Include several
long-a passages at the supplied examples' approximate difficulty.

Use roughly 30-90 words, with shorter early passages and longer vowel-team
passages. Stories need a concrete goal, action and outcome, natural sentences
and explicit evidence for questions. Do not reuse a template with swapped
names to satisfy the count. Use the six current Guides and their correct
identities; character choice must not mix incompatible story worlds.

Each passage declares prerequisite graphemes, exact target words, exception
words (including character names), support vocabulary and intended reading
demand. Match cycle eligibility to current taught-content sources where the
curriculum actually covers that pattern. Do not assign advanced vowel teams
to an earlier cycle or infer decodability from spelling substrings alone.
Display support words before reading. Label teacher/read-together access
honestly; no Lexile, calibrated level or independent-decoding claim from an
editorial tag. Later phonics patterns remain explicitly selectable by focus.

Every passage has three core comprehension questions with answer guidance and
exact supporting sentences. Cover retrieval and sequence/cause, and include
supported inference only where two actual clues support it. Add an open draw
and label/retell prompt. Closed questions have one answer and plausible,
parallel distractors. Open responses allow equivalent wording.

## Three modes

Whole group: readable shared passage; teacher-controlled question navigation;
optional target-word marking and evidence reveal; answers hidden until the
teacher chooses to reveal. No timed actions or student-result recording.

Small group: same passage with short before/during/after teaching prompts,
support-word preview, partner rereading and private answers/listen-for notes.
The child-facing passage can be shown without exposing teacher guidance.
Groups use one shared screen and/or matching printouts. This version does not
add a new synchronized multi-device session protocol or hosted assignment type.

Student practice: passage stays available alongside one question at a time;
clear selection and Check action; first try retained locally during practice,
helpful evidence feedback, then retry and continue. Open drawing/writing stays
on the printable with a clearly named print action rather than a pretend
digital drawing box. Three rereading ticks are optional fluency practice.
Completion means practice finished; no quiz score changes reading placement,
mastery, stars or existing reports. Teacher-led work never becomes an
individual learner's independent result. Reload/navigation behavior must be
explicit and scoped to the current learner; a reset starts a fresh practice.

Use existing approved audio only where exact text matches. Teacher-led reading
remains teacher-read; student access may use the app's clearly identified
read-aloud fallback where permitted. Hearing a passage is supported
comprehension and must not be labelled independent decoding. Do not claim new
human narration, pronunciation verification or listening evidence.

## Print output

For each passage provide: (1) one A4 read-and-answer worksheet with name/date,
phonics focus, passage, three rereading ticks, three questions and handwriting
lines; (2) one A4 draw/label/retell and word-study extension with the complete
passage available; (3) a separately printed teacher guide/answer sheet.

Children can print one sheet or the two-sheet pair; teachers can batch selected
passages. Longer passages use an explicitly labelled two-page reading/response
layout if necessary to preserve readable type and answer space. Never shrink
child text below the Worksheet Bible's floor to force a one-page claim.

All child pages use white paper, black text and clean black outline art, large
blank colouring regions and no colour-dependent directions. Reuse approved
Guide line art where it meaningfully identifies the story character. Draw and
label prompts provide the story-specific scene response; decorative portrait
art must not reveal a comprehension answer. Do not recolour shaded portraits
and call them colouring pages. New scene art, if needed, must preserve approved
character likeness and pass visual review.

Use embedded Andika, live selectable text, at least 12mm margins, sufficient
line spacing and beginner writing space. Use the established asset-embedding
print and isolated preview approach. No network-only images/fonts, embedded
frames or weakened CSP. Print failure must explain retry; never print blank
assets. Preview, child print and answers derive from the same passage records.

These are fixed authored passage resources with named worksheet variants,
not a new recipe pretending to satisfy the existing six-stage cycle generator.
Document the distinction in the Worksheet Bible. Existing six-stage activities
retain all current gates. New passage sheets carry stable passage/question/
task/answer metadata and have their own deterministic print coverage.

## Implementation boundaries and acceptance

Use lazy-loaded React components, existing teacher primitives and child
surface rules. Keep a single content bank and shared answer/evidence and print
builders. No new external service, dependency, migration or hosted write is
needed. Reuse existing learner identity/access boundaries. Implementation
details such as component names and layout breakpoints are the builder's call.

Acceptance requires all 24 complete passages; every mode reachable through real
teacher/student navigation; correct teacher-answer privacy; substantive content
and phonics checks; student answer/feedback/retry/reset behavior; deterministic
print/answers; no missing assets; physical page-count checks and visual PDF
inspection; teacher and child tablet/phone/desktop browser checks; required
question-contracts, regression, worksheet and affected navigation gates.
Browser emulation does not establish classroom, human-listening or physical
iPad acceptance. Publish status must distinguish local, committed, pushed and
live; manual deployment or hosted mutation needs separate authorization.

Work in the isolated comprehension checkout because other work is active in
the repository. Verify, commit only named scope and follow repository Git
publication instructions, respecting actual approval-review restrictions.
Remove task-owned disposable previews/caches after checking protected roots;
retain original supplied PDFs and required verification evidence.
