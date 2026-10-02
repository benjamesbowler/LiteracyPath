# Illustrated phonics practice in the Arcade

Current contract, 2 October 2026. Scope: the nine illustrated practice games,
separate from the fifteen action Arcade games. The Game Design Bible, visual
production guide and Question Design Bible remain authoritative. Machine-readable
briefs are registered through `shared/phonicsPracticeBriefs.js`.

| Game | Learning action and world outcome |
| --- | --- |
| CVC Word Builder | Choose the next grapheme from three tiles. Retain slots, Undo and the pictured/printed model; the built object is used automatically. |
| Blend & Build | Choose an onset for the retained rime, then collect the pictured word automatically. Each tier has a distinct reviewed family deck. |
| Letter Garden | Change the one marked written letter from the printed source to the pictured/printed target. A correct seed grows a flower. Twenty-six directed contrasts per tier. |
| Sight Word Memory | Turn two opaque cards to match four printed word pairs and light Luna’s lanterns. Retain the ordered curriculum and exact board. |
| Word Rescue | Choose the matching word plank from three answers; Speedy delivers it and builds Splashy’s bridge automatically. Six bridges of six planks. |
| Pop the Word | Choose the heard/printed word from six stable balloons in Chompy’s festival. Fresh outings contain 16/20/24 targets; optional gentle motion is never a literacy gate. |
| Word Hopscotch | Follow a complete model using three unique next-word choices. Completed stepping stones retain word order. Fresh 9/9/7 target sentences and a distinct model use existing complete recorded authored sentences of the same tier. |
| Sentence Fix-It | Tap one repair piece. The actual completed sentence and explicit story facts determine acceptance; valid alternatives remain accepted. |
| Sound Sort Factory | Match the parcel’s first written letters to a chute. If both prefixes match, use the longer group. Fresh 16/24/32-parcel shifts sample 4/6/8 reviewed contrasts. This is written grapheme practice, not isolated-phoneme assessment. |

Every game keeps native named response buttons of at least 56 CSS pixels, one
visible current task, specific wrong-answer coaching, automatic feedback and
advancement, the shared Pause/Exit controls, and a usable sound-off/art-failure
path. No compulsory Fetch, Carry, Manual feed, Drag or Check follow-up remains.
Current owned scenery, transparent canon cast and opaque literacy props give
each game its setting; interface controls retain the blue/cobalt system.

The existing shared engines own scores, support evidence and receipts. All
responses remain `practiceOnly`, with independent evidence false. A printed
model, a matched memory card, an eventual correct response or optional movement
does not establish independent decoding, listening, fluency or placement.

Pop the Word, Word Hopscotch and Sentence Fix-It retain the current
`learning-response-v1` contract: freeze the first judged error, complete an
active worked model, then offer one genuinely distinct eligible transfer.
A second error closes with supported work and starts the next task with a model.
Original choices never reopen for a replacement independent score. Hopscotch
retains the correctly built prefix; native memory exploration stays outside
generic choice scoring. The exact episode and held save survive reload, and
the final modeled part and its transition form one save transaction.
Fresh transfers reset recording delivery before accepting their first response;
a completed recording for the earlier question cannot certify the new cue.

Fresh decks use recorded session seeds and explicit difficulty banks. Saved
local decks remain authoritative, including their previous lengths. Index-zero
seeded checkpoints retain partial first questions. Adventure responses persist
the accepted result phase so reload resumes its dwell once, preserves score and
first responses, and cannot award a second completion receipt. Missing older
Blend content envelopes clamp to the actual current family length.
Pop, Hopscotch and Fix-It persist each accepted scene change together with its
score, progress, supported evidence and discovery before applying the visual
result. Durable action receipts prevent duplicate credit after reload or a save
retry. A failed save holds the selected answer without advancing its scene.

Only existing owned recordings are used. Blocked autoplay or a transport failure
leaves Hear retryable. Missing recordings expose the actual printed task; there
is no synthetic voice or false audio-delivery claim. Sentence Fix-It never
voices the completed answer before the response, and only voices an accepted
alternative if that exact resulting sentence has a recording. Old Hopscotch
saved decks keep their content and explicit printed fallback when a whole
sentence recording is absent.

The renamed Factory and Garden recommendation reasons have no exact existing
recording and explicitly use text cues. Their game recordings retain the
delivery and retry contract above.

`check:learn-games` continues to reject browser speech in these games and their
worked models. Its source guard follows the Question Design Bible and Progress
check contract for the separate renderer: only optional `speech_access` cues
without required target audio and an explicitly unscored warmup are permitted.
The guard verifies their positive control flow; it does not exempt the whole
Progress component or allow synthetic independent-reading or target audio.

Unit and browser contracts live in the three `phonics-*-overhaul` groups plus
`phonicsCheckpointContinuity.test.js`, `adventure-world-games.spec.js` and
`recognition-practice.spec.js`, `pop-learning-festival.spec.js` and the current
learning-response browser groups. The evidence report under
`.artifacts/phonics-overhaul/` records actual local/remote checks and release
identity separately. Browser touch/iPad-profile proof is distinct from physical
iPad use, human listening and classroom observation; unknowns remain unknown.
