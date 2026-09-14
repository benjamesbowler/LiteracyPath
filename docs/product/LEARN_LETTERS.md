# Learn Letters

The round plan in `src/policy/letterPractice.js` owns the programme. All 26
letters have five saved rounds with three activities each: 130 rounds and 390
activity stages, five times the former 26 lessons and 78 stages. Rounds two
through five also require 72 correct practice responses per letter (1,872
across the alphabet). This is a content-volume guarantee; elapsed classroom
time depends on the child and has not been measured for the expanded version.

| Round | Tracing | Other activities |
| --- | --- | --- |
| Meet the letter | Uppercase | Original word listening and sound-picture matching |
| Little letters | Lowercase | Spoken-word picture choices and upper/lowercase pairs |
| Sound detective | Uppercase | Heard-sound letter choices and printed word beginnings/endings |
| Letter explorer | Lowercase | Picture choices and mixed practice |
| Letter champion | Uppercase | Two longer mixed activities |

The existing authored letter stroke bank supplies both cases. Each subpath
must meet the existing tracing coverage rule; a single tap cannot complete a
trace. The keyboard/switch stroke alternative remains available.

`src/data/letterPractice.js` builds choices from the active phonics lessons
and recorded audio. It varies target order and distractors on replay, keeps
saved seeds stable on resume, and mixes in letters the child has already
practised. X word tasks match its authored ending contract. C and K cannot
oppose each other in a heard /k/ question. Printed-word activities are named
as printed matching rather than independent sound identification.

Directions start automatically, can be replayed, and never lock answer input.
Errors give immediate correction and another attempt; unavailable audio offers
a visible target and a retry. These are supported practice completions, not
independent assessment or mastery evidence.

`src/utils/letterPracticeProgress.js` derives the five-round status from the
existing immutable phonics completion records. Old completed letters retain
one round of credit; repeated old events never become five rounds. New rounds
require three distinct step records. Letter completion on the picker and Home
requires all five distinct rounds. Existing Word Workshop prerequisites still
recognise the child's original taught-letter progress.

Completed rounds use the existing local/cloud progress queue. A learner-scoped
local checkpoint saves finished steps, question answers, and the practice seed
between rounds; partial tracing restarts its current stroke activity. Local
checkpoints participate in learner reset and privacy cleanup. Completing a
round provides the next round and a return to the letter picker.

Verification: `tests/unit/letterPractice.test.js` covers all letters, media,
volume, choice validity, replay and progress compatibility.
`tests/release/learn-letters-depth.spec.js` exercises the complete journey,
resume, errors, audio failure, pointer tracing, and tablet/phone rendering.
Run these alongside the applicable task gates and existing phonics regression.
