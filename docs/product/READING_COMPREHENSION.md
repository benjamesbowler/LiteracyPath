# Reading Comprehension

The approved comprehension area uses one original bank:
`src/content/comprehension/passages.js`. It contains 72 distinct passages, authored in that module and
`additionalPassages.js`: 16 short-vowel, 16 digraph/blend, 15 silent-e and
25 vowel-team passages. These provide 216 questions and 144 student sheets
in the complete multiple-choice and drawing pack.
Each has three four-choice practice questions and exact source-sentence
answer evidence, plus an open drawing/retelling task. Questions are unscored
practice and do not update mastery, book level, stars or assessment reports.

Teachers enter through **Teach -> Reading Comprehension** or the worksheet
studio. Children enter through **Books -> Reading Comprehension**. Home keeps
its existing destinations. A focused teacher assignment keeps its current
content/exit restrictions; the comprehension doorway is hidden while locked.
The new teacher hash is `#teacher/teach/comprehension`, scoped to the class.

## Modes and evidence

- **Whole group:** four visible A–D choices, optional group selection and
  teacher-controlled answer/evidence reveals. Selecting does not reveal a key.
- **Small group:** the same four choices and reading with initially hidden before/during/after
  notes and answer guidance; hide teacher notes before sharing the screen.
- **Student practice:** passage remains available, one question at a time,
  explicit Check, evidence feedback and supported retry. Four answers come
  from the authored record. Completion means the practice was finished.

Teacher preview uses a separate storage scope. Practice and three optional
rereading ticks live only in session storage, keyed by account/learner and
passage. First responses are retained across retry. A fresh run saves a new
seed; the shared Fisher–Yates helper shuffles each complete choice bank from
that seed. Replay, retry and reload keep the exact order. Reset starts a new
run. Answer values remain attached to their choices; group selections do not
write student responses. Reload validates saved
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

## Phonics marks and Leda narration

`phonics.js` owns a reviewed spelling-and-sound vocabulary for all current
stories. The control marks every occurrence of a focused word, including
inflections and compounds, rather than just the target examples. Known regular character names also qualify for their focused spelling.
Spelling lookalikes with a different sound are excluded; names remain support
words rather than a promise of full independent decoding. The active focus is
shown beside the passage. Short-vowel spelling follows the app’s US-English
teaching convention; dialect-sensitive short-a words are documented in source.

Leda narration uses stored `en-US-Chirp3-HD-Leda` MP3s. The story includes its
title. Questions use the exact prompt, A–D labels and option text in the saved
visible order; atomic clips support any shuffle. The canonical cue player
owns the sequence with a 450ms pause between parts, warmed media and learner
audio intensity. Stop, replay, mode/question change, global child-audio stop,
unmount and hidden/page-exit boundaries retire the old owner and pending gaps.
Missing/failed audio gives an explicit retry/read-together message and leaves
reading usable. There is no device-speech substitution.

Narration is reading support, not evidence of independent decoding. Sound-off
use is complete; no timed response or audio-gated input is required. Generated
source/hash/signal evidence does not imply human listening or physical-iPad
acceptance. The current pass-by-exception review policy still governs release.

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

## Full-screen lessons and story pictures

**Full screen** opens a named lesson stage with the app navigation and printing
tools removed. It requests native browser fullscreen from the button gesture;
if unavailable or declined, the same lesson fills the visible viewport. Exit
and Escape stop narration and restore focus without resetting the question,
selected answer, rereading ticks or saved first-response evidence.

Classroom landscape screens show the complete readable passage, picture and
one four-choice question together. Short/narrow viewports use explicit Read,
Pictures and Questions views and measured text pages, including word-help and
evidence pages. Complete content must remain reachable without scrolling or
clipping. Desktop offers separate story/question Leda controls; compact views
use the active reading/question context. Visible A–D letters match narration.
Teacher notes remain outside the shared lesson stage.

Each passage has its own black-and-white raster illustration: one spatial scene
or a three-panel first/next/last comic, chosen for that story. Pictures can be
shown or hidden; a load failure explains retry while reading and Leda remain
usable. These are supported-comprehension pictures, not evidence of independent
decoding. Plot-essential notes/labels may use exact readable source wording;
art never adds answer letters or unrelated events.

`tools/authoring/comprehensionPictures.mjs` owns the exact scenes, source hashes,
character references and real generation prompts. The generator writes lean
browser metadata to `pictures.js`; prompts stay outside learner code. Accepted
image/source/prompt/reference hashes and actual visual-review notes live in
`docs/content/comprehension-images/provenance.json`. Final art is served from
`/images/comprehension/passages/`; older shared comprehension images remain separate. The image gate decodes
every raster, rejects coloured fills and stale metadata, and checks coverage.

The user's explicit 27 October 2026 decision keeps **Guide Socks as the existing
monkey** with buttoned vest and curled tail. This comprehension identity is
separate from the Aiden and Betty story character `HUMAN-SOCKS`, a dog; do not
substitute that dog for the approved Guide reference.

## Print resources

`src/content/comprehension/print.js` derives all sheets and teacher guides
from the same records. Each passage provides a one-page multiple-choice sheet, a one-page
written-answer alternative, a one-page drawing/word-study/retell extension and
a separate teacher guide. The default two-sheet pack is multiple choice plus
drawing. A separate **Picture story** page pairs the complete text with its
approved scene/comic and a short retell/colour task; it preserves the child's
independent drawing activity. Printed A–D order is deterministic Fisher–Yates by question ID; the
teacher guide uses that same order and states that letters match print.
Teachers can select all shown passages or add individual stories to a pack;
selections persist while filtering. Print actions stay above the gallery.

Child pages use black text, approved Guide outline art on white paper, embedded
Andika, >=14pt ordinary text, 13mm A4 margins and roomy handwriting lines.
They can be coloured without colour-coded directions. Portraits identify the
character without revealing an answer; children supply the story scene in the
drawing task. Artwork is the existing `public/images/worksheets/` line art. A script-free
SVG resource pool embeds each approved raster once and reuses it across pages,
so a 144-page pack avoids repeated multi-megabyte data URLs. Every character
portrait remains the same approved raster, not a newly constructed picture.

Print windows open during the user gesture; assets are embedded before the
prepared document replaces that window. Blocked popups or failed image loads
explain retry and do not print a blank worksheet. Preview uses the same HTML
and registered embedded font in the existing isolated shadow tree, with no
iframe or CSP change. Teacher keys have no child-mode control.

These fixed passage resources are distinguished from the existing six-stage
cycle generator in the Worksheet Design Bible. Neither replaces the other.

## Gates

- `node --test tests/unit/comprehension*.test.js`: bank/evidence/language,
  exhaustive focused-word audit, saved shuffles, immutable first try, scoped
  storage, large-pack portrait pooling, exact narration and cue ownership.
- `npm run check:comprehension-pictures`: current generated metadata, all 72
  decoded story illustrations, source/generation/visual-review provenance and
  black-and-white pixels. Generator changes never invent listening approval.
- `node tools/checkComprehensionFullscreen.mjs`: all 72 stories at six device
  sizes, complete paged content, choices/feedback, native and fallback entry,
  accessible exit/focus, saved retry, Leda and failed-picture recovery.
- `node tools/checkComprehensionPrint.mjs`: all five formats for all 72 passages,
  batch documents, embedded assets/font, text size, clipping, footer overlap
  and exact physical PDF page counts.
- `node tools/checkComprehensionBrowser.mjs`: six device sizes, all 216 question
  controls, retry/reload/completion, teacher privacy/reveal, catalogue filters,
  batch selection, group choices, exact preview, print popup/recovery, actual
  Leda starts/stops and teaching/Books links.
  Uses the production components in the established preview harness; set
  `LP_COMPREHENSION_BASE` to the tested local server.
- `node tools/generateComprehensionLedaAudio.mjs --plan` inventories exact
  required narration; default generation uses the existing Google Leda path,
  content hashes and provenance. `--check` verifies current source/bytes without
  network. Regenerate the shared audio index with `node tools/generateAudioManifest.js`.
- `node tools/checkComprehensionLedaAudio.mjs` fully decodes every current clip,
  checking signal, clipping, boundary silence, source/hash, pause and pacing
  evidence. Superseded clips are removed only after valid replacements exist.
- Existing question-contracts, regression, mobile-layout, worksheet policy and
  print-layout gates remain applicable. The child-surface registry and its
  device matrix include this new route.

Generated PDFs, screenshots and machine-readable receipts live under ignored
`.artifacts/comprehension/`. Browser/render checks do not claim physical iPad,
classroom or human-listening observations. Hosted authentication/release proof
is a separate boundary from the local component/navigation harness.

Long Leda passage clips that exceeded the shared 350 KiB speech budget use
96 kbps encoding, with unchanged words, voice, pacing and pauses. The exact
text-hash overrides live in `tools/comprehensionLedaEncoding.json`; the encoding
is part of the recipe and asset path so clients request fresh bytes. Thirteen
explicit compatibility URLs serve identical optimised recordings to cached
previous-release lessons; their text and byte hashes remain in the manifest.
