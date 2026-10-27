# Reading Comprehension

The approved comprehension area uses one original bank:
`src/content/comprehension/passages.js`. It contains 24 distinct passages:
four short-vowel, four digraph/blend, six silent-e and ten vowel-team passages.
Each has three four-choice practice questions and exact source-sentence
answer evidence, plus an open drawing/retelling task. Questions are unscored
practice and do not update mastery, book level, stars or assessment reports.

Teachers enter through **Teach -> Reading Comprehension** or the worksheet
studio. Children enter through **Books -> Reading Comprehension**. Home keeps
its existing destinations. A focused teacher assignment keeps its current
content/exit restrictions; the comprehension doorway is hidden while locked.
The new teacher hash is `#teacher/teach/comprehension`, scoped to the class.

## Modes and evidence

- **Whole group:** teacher-controlled questions and answer/evidence reveals.
- **Small group:** the same reading with initially hidden before/during/after
  notes and answer guidance; hide teacher notes before sharing the screen.
- **Student practice:** passage remains available, one question at a time,
  explicit Check, evidence feedback and supported retry. Four answers come
  from the authored record. Completion means the practice was finished.

Teacher preview uses a separate storage scope. Practice and three optional
rereading ticks live only in session storage, keyed by account/learner and
passage. First responses are retained across retry. Reload validates saved
shape/content; corrupt or unavailable storage starts safely or keeps the
current work in memory. Start again clears that passage's current practice.
No new hosted assignment protocol, synchronization or database write is added.

Phonics focus is a teaching label, not a calibrated reading level or a promise
of full decodability. The exact authored targets and conservative support-word
list appear before reading, with prerequisite patterns. Character names are
support words. Advanced silent-e/vowel-team passages are selected explicitly;
they are not automatically assigned to a kindergarten cycle that has not
introduced those patterns. No Lexile value or independent-reading mastery is
inferred. Equivalent oral/written answers supported by the text are welcome.

Device voice is explicitly labelled as support, started by the user and
stopped on exit, mode change, page hide or visibility loss. It is not a new
approved human recording or proof of independent decoding. Sound-off use is
complete; no timed response or audio-gated input is required.

## Everyday English for K–3 and ESL

Passages, questions, choices and child worksheet directions use concrete actions
and familiar, everyday English. Keep sentences short, make pronouns clear and
use the same object/action words in questions as in the story. Avoid idioms,
figurative phrases, unnecessary synonyms and abstract moral or theme questions.
A phonics pattern must not force an unnatural sentence or an unclear event.

Each record has brief `wordHelp` meanings for useful words a learner may not
know. They appear in Words to read together and on both child print pages,
and inform the teacher’s before-reading notes. Meanings explain vocabulary;
they must not answer a comprehension question. Concrete why/how questions
remain welcome when the story gives the cause or action. Drawing directions
name what to draw and which words to write. Retelling uses first, next and last.

K–3 describes the intended teaching range, not a measured grade or a promise
that every kindergarten ESL learner can read every passage independently.
Teachers choose taught phonics and read/explain new words before practice.

## Print resources

`src/content/comprehension/print.js` derives all sheets and teacher guides
from the same records. Each passage provides a one-page Read and answer sheet,
a one-page drawing/word-study/retell extension and a separate teacher guide.
Teachers can batch selected passages; selections persist while filtering.

Child pages use black text, approved Guide outline art on white paper, embedded
Andika, >=14pt ordinary text, 13mm A4 margins and roomy handwriting lines.
They can be coloured without colour-coded directions. Portraits identify the
character without revealing an answer; children supply the story scene in the
drawing task. Artwork is the existing `public/images/worksheets/` line art.

Print windows open during the user gesture; assets are embedded before the
prepared document replaces that window. Blocked popups or failed image loads
explain retry and do not print a blank worksheet. Preview uses the same HTML
and registered embedded font in the existing isolated shadow tree, with no
iframe or CSP change. Teacher keys have no child-mode control.

These fixed passage resources are distinguished from the existing six-stage
cycle generator in the Worksheet Design Bible. Neither replaces the other.

## Gates

- `node --test tests/unit/comprehension.test.js`: bank count, phonics targets,
  complete evidence/options, immutable first try, storage and route contracts.
- `node tools/checkComprehensionPrint.mjs`: all four formats for all 24 passages,
  batch documents, embedded assets/font, text size, clipping, footer overlap
  and exact physical PDF page counts.
- `node tools/checkComprehensionBrowser.mjs`: six device sizes, all 72 question
  controls, retry/reload/completion, teacher privacy/reveal, catalogue filters,
  batch selection, exact preview, print popup/recovery and teaching/Books links.
  Uses the production components in the established preview harness; set
  `LP_COMPREHENSION_BASE` to the tested local server.
- Existing question-contracts, regression, mobile-layout, worksheet policy and
  print-layout gates remain applicable. The child-surface registry and its
  device matrix include this new route.

Generated PDFs, screenshots and machine-readable receipts live under ignored
`.artifacts/comprehension/`. Browser/render checks do not claim physical iPad,
classroom or human-listening observations. Hosted authentication/release proof
is a separate boundary from the local component/navigation harness.
