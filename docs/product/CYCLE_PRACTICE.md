# Cycle Practice

Cycle Practice is spoken, pictured practice for children learning English who
cannot yet read instructions independently. Its current runtime is
`src/components/cycle-practice/CyclePracticePage.jsx`; its curriculum and
question source is `cyclePracticeContent.js` in the same directory. It no
longer uses the Adventure Map's memory, gate, poem or confirmation mechanics.

## Learning through play

All 27 numbered cycles use the taught sounds, patterns and words from
`elSkillsBlockCycles.js`. Full interleaved decks provide distinct learning tasks before any replay.
Earlier taught content supplies spaced review; choices and answer positions vary. Review cycles retain all their
assigned mappings. A missing image or instruction blocks the affected item
without recording a literacy error.

| Activity | Child's action | Learning evidence |
| --- | --- | --- |
| Sound Safari | Tap a pictured object for the heard sound or ending | Picture identification for the declared first sound, final sound or ending chunk |
| Letter Friends | Match a heard sound, letter case, or spoken word | Grapheme–phoneme matching, visual letter identity, or auditory word recognition |
| Rhyme Picnic | Join a pictured word to a rhyming picture | Oral rhyme recognition, with picture-name replay available |
| Word Workshop | Fill word-train cars by tapping letters; choose which letter to change, then replace it; choose the remaining pictured word part | Encoding, sound substitution, or explicitly named compound deletion |
| Sound Delivery | Sort three objects into persistent sound baskets, or match a spoken word to beat dots | First/final sound or ending classification and spoken syllable counting; dragging is optional |
| Rainbow Writing | Follow a large letter trail with a finger or pointer | Supported formation practice, never independent handwriting mastery |

High-frequency words stay visible while the child learns to build them.
Each word is modeled and copied before its recognition task appears. A spoken
sentence connects the target to a meaningful pictured object. These are
supported learning opportunities and are excluded from the independent check.
A separate practiced task asks children to match a spoken high-frequency word
to its printed form without a model. This checks auditory word recognition,
not independent decoding, with a meaningful context picture.
The child never has to hide a word, recall an interface instruction, or press a
button to check an answer, letter, or drawing.

`cyclePracticeSessionBlueprint` reports each cycle's unique tasks, response
actions, activity and construct coverage, taught/review content, and planning
allowances. These allowances size the content bank; they are not measured child
timings or enforced waits. The actual active-time gate is independent of the
estimate. Inactive, hidden and paused intervals do not satisfy it.

## Instruction and feedback

A single Play tap establishes browser audio permission. Every question then
plays its short recorded instruction and exact target automatically. The
persistent speaker replays the same cue. Picture speakers name unfamiliar
objects, removing non-target vocabulary barriers. Recorded wording and the
visible caption come from `cyclePracticeAudioScripts.js` and its generated
Leda manifest. No device speech synthesis or live generation service is used.
The listening state is visibly separate from “Your turn”; tapping Listen while
it is already speaking cannot restart the waiting period. A stalled recording
returns to the replay route. Responses require both delivered teaching audio
and loaded pictures. A picture that fails or stalls for 15 seconds offers
Reload pictures. Reloading never adds a literacy attempt or erases accepted
word parts.

Responses validate automatically. Practice errors remain on the same item,
name the selected picture when appropriate, replay the learning cue, and give
another attempt. Repeated errors reveal a teaching hint; subsequent attempts
remain marked supported. Correct responses receive spoken and visual feedback
before automatic advancement. Duplicate taps cannot create extra records.
Accepted word-building letters survive a wrong next letter, pause and replay.
Completed sorting pictures sit on a separate shelf below each sound basket,
clear of its permanent letter and speaker. In Cycle Check, an incorrect first
classification stays in the record while the shelf shows the corrected match.

Six completed activities fill a star trail. Rewards acknowledge completed
learning actions and supported effort; they do not confer assessment mastery,
change the reporting denominator, or depend on speed.

## Writing tolerance

`cycleTraceRules.js` is the single tracing rule source. The visible guide is a
wide corridor; either direction, out-of-order strokes, shortened endpoints,
wobble and several finger lifts are accepted. Coverage is checked separately
for every letter in a team. Taps and unrelated scribbles cannot complete a
letter. Partial useful ink survives a retry. Completion happens on finger
release; erasing and visual demonstrations are optional. The accessible
stroke-building alternative records its assistance. All guided tracing is
supported evidence.

## Session and results

The existing teacher-assigned cycle, foreground active-practice clock,
30-minute practice minimum, pause/resume, local recovery, immutable final
payload and retry-save behavior remain in force. Cycle Check requires both at least 1,800 seconds of active
practice and completed coverage of every assigned sound and high-frequency word,
all six activity families, rhyme, word parts, syllable counting, and the cycle
applicable letter-case and sound-change work. At least 36 distinct semantic
tasks must be completed. Repeated IDs, changed distractors and reshuffled answers
do not manufacture distinct tasks. Finishing the current activity then
automatically starts Cycle Check.
There is no child-facing Start Check or answer-confirmation button.

Cycle Check covers the taught sounds, high-frequency words and practiced
phonological constructs. It records one independent response per item or sorting object, then gives feedback and
moves on. Guided writing and visible-model HFW copying are not check items.
The last response is frozen before saving; retrying a failed save resends that
same attempt. A saved result is announced only after the corresponding save
succeeds. Children see a brief completion celebration; teachers retain the
existing detailed results and support/media distinctions.

The reporting protocol remains `cycle-practice-v2`; the activity revision is
`cycle-play-2026-09`. Change this revision when a future deck replacement makes
saved indexes or question identities incompatible. Old unfinished local sessions restart against the new deck
and retain their previous evidence locally. Frozen pending saves and completed
results remain unchanged. Sorting resumes from its recorded object responses.
The forward `cycle_practice_activity_audio_contract` migration extends the
existing saved-result validator with the new activities and required-audio rules.
Its token, ownership, duration and immutable-retry protections are unchanged.
The report retains exact question ids,
constructs, selected responses, audio-delivery evidence and support retained.
This is descriptive cycle practice, not formal Skills mastery or placement.

## Visual and access contract

The activity occupies the full available frame with compact controls, large
pictures and a short caption. Important controls retain at least 56 rendered pixels even inside the scaled child stage.
Keyboard activation reaches all tap actions; tracing has an explicit supported
keyboard alternative. Reduced motion removes decorative animation. Incorrect
and correct states use words, shape and icons as well as colour. Missing media
retains a visible replay/reload route and cannot silently turn into a text-only
question.
Finger and pen choices activate on release inside the same button, including a
small drift that a browser may otherwise mistake for scrolling. Cancellation,
lost capture, pause and lost focus discard the held gesture. Native keyboard
activation is retained and a browser's subsequent click cannot duplicate the
response. Dragging a sorting picture shows the carried object and destination.
On short landscape screens the instruction shares the top bar, and the model
and responses use a compact row. Feedback has its own footer. The complete
tracing pad and its tools remain visible together; the picture and sorting
destinations never require alternating scroll positions.

Reference properties: [Raz-Kids](https://www.raz-kids.com/main/aboutrazkids/)
provides modeled listening and self-paced child access; [Teach Your Monster to
Read](https://help.teachyourmonster.org/en/articles/5586062-what-areas-does-teach-your-monster-to-read-cover)
connects games to phonics, blending and word practice. These inform the design;
the overhaul makes no claim of measured equivalence to either platform.

## Verification

- Unit: `cyclePracticeContent`, `cyclePracticeAudio`, `cyclePracticeState`,
  `cyclePracticeReporting`, `cyclePracticeRecovery`, and `cycleTraceRules` tests.
- Browser: `cycle-practice-overhaul.spec.js`,
  `cycle-trace-activity.spec.js`, and `cycle-practice-audio-layout.spec.js`.
- Touch and layout: `cycle-practice-touch.spec.js` exercises all 27 cycles,
  drift/cancellation, retained construction, sorting shelves, media recovery,
  every activity variant, and tablet/short-landscape geometry.
- Database: `tools/db/verifyCyclePracticeEvidence.mjs` applies all migrations in
  isolated PostgreSQL and exercises evidence validation plus all 27 actual
  cycle check payloads through the anonymous student-token boundary.
- Repository: unit suite, lint, build and repository hygiene.
- Direct visual and real recorded-audio delivery are checked in the running
  activity. Human listening quality, physical-iPad play and observed independent
  child play remain separate evidence; browser checks do not establish them.
