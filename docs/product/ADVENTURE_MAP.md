# Adventure Map games

Current product contract, 12 September 2026. Scope: the child Adventure Map,
its practice stations and Cycle Quest across all 27 cycles. This implements the
product owner's requested simple, spoken, picture-supported games and replaces
the retired distinct-mechanics design and implementation plan.

## Child experience

The child hears one short direction, makes the learning decision directly and
gets immediate feedback. A correct response moves on automatically. An incorrect
response gives a supported retry; it never requires a separate Check, Open,
Hide, Reveal or Run button. Matching pairs and searches keep completed finds.
Every activity has a visible Listen control, short written direction, large
response targets, progress and a Stop action.

| Game | Learning action | Active mechanic |
| --- | --- | --- |
| Letter Match | Match the upper-case letter to its lower-case partner, or the reverse. | `letterPair` |
| Sound Match | Hear a sound and tap its letter or letter team. | `soundChoice` |
| Picture Sounds | Tap the picture whose name begins with the target sound. | `sceneHunt` |
| Word Pairs | Turn over hidden cards and find identical taught sight words. | `wordMemory` |
| Letter Find | Find every requested big and small letter in a mixed grid. | `letterGrid` |
| Missing Letters | Complete the first or final letter of a pictured, spoken CVC word. | `missingLetter` |
| Rhyme Time | Choose two pictured words that rhyme. | `rhymePair` |
| Rhyme Time | Choose the pictured word that does not rhyme with the other two. | `rhymeOdd` |
| Picture Words | Hear two pictured word parts and choose the compound word they make. | `compoundPicture` |
| Picture Search | Find all matching initial-sound objects in a large illustrated scene. | `pictureSearch` |

The familiar letter, picture, card and word objects are the play medium. The
world art supplies setting, while warm opaque boards protect letter and picture
legibility. Card turns, retained check marks, specific feedback and short success
effects communicate the result; colour alone does not. Non-essential motion
respects reduced motion. Pointer, touch and keyboard use the same buttons;
there are no drag, timing, steering or typing requirements.

## Curriculum and evidence

- Printed phonics choices and CVC words use code taught by the selected cycle.
  Cycle 1 uses Letter Find in the build slot because it cannot yet spell a CVC
  word. CVC pictures are pinned to reviewed, text-free artwork so they do not
  print the answer. A containing letter does not establish a word's initial
  sound; a consonant cluster containing the target sound cannot be a wrong
  initial-sound choice.
- Sight words follow the separately taught high-frequency-word strand. Matching
  a sight word does not prove mastery of all phonics patterns inside it. The
  pronoun I keeps its correct capital form on matching cards.
- Rhymes are authored sound families, not guesses from final spelling. Rhyme
  and compound vocabulary is pictured and spoken; its richer vocabulary does
  not become independent decoding evidence.
- The odd-rhyme prompt is the explicit oral comparison requested by the owner.
  Its three pictures contain exactly one rhyming pair and one outlier. The
  written negative is emphasized; its spoken wording has the same meaning.
- Choices and card positions are shuffled under a recorded run seed. Hidden
  cards have opaque identifiers and do not expose their word in the accessible
  name until turned over. Opening the station menu does not consume the play
  seed or repeatedly build all of the games.
- A search completes only after every matching object or letter is found.
  Wrong choices record misses; already found targets remain. A card cannot
  pair with itself and mismatches turn back over automatically.
- Cycle Quest samples every available construct, including first and final
  CVC completion, before repeating one. First-attempt evidence and support
  remain separate from eventual completion.
- Scores and stars remain practice evidence. This surface does not set EL
  placement, formal Secure judgements or oral-reading fluency.

Existing teacher station identifiers and exact cycle assignments are retained,
but resolve to the current simple game. Ordinary map progression, saved stars,
learner identity and the classroom lock remain in the existing progress and
session systems. There is no progress reset or new hosted data field/service.

## Recorded directions

`adventureRoundAudio.js` defines one current instruction plan per mechanic.
The instruction plays automatically on entry and on the next question, and
Listen repeats it. Initial autoplay rejection retries on the next gesture;
controls stay usable. Spoken instructions remain independent of music settings.
Rhyme and compound choices have recorded names. Hidden word cards are named
only after being turned over. Audio-required independent evidence depends on
actual completed target playback, without delaying input.

The retired generator applied a fade-out from time zero, making 23 referenced
recordings effectively silent while browser play events still succeeded. The
generator now fades the actual end, checks decoded signal levels and emits new
filenames for the repaired directions so cached silent files cannot persist.
`generateAdventureMapInstructionAudio.mjs --check` and the instruction-audio
unit tests check the current recordings; browser tests use actual media decoding
and playback as well as interruption/replay checks. Browser speech is not a
fallback for phonemes or instructions.

## Current sources and verification

- Rounds and media: `src/components/elQuest/elQuestEngine.js`.
- Render selection: `src/components/elQuest/mechanics/adventureMechanics.jsx`.
- Responses: `CodeMechanics.jsx`, `SimpleMechanics.jsx` and their pure state modules.
- Evidence/coaching: `src/components/elQuest/adventureRunState.js`.
- Child layout: `AdventureRoundFrame.jsx` and `src/styles/adventure-simple-games.css`.
- Unit coverage: Adventure Map code, simple-state, registry, curriculum, instruction
  audio, Cycle Quest, run state, progress and focus-lock suites.
- Browser coverage: Adventure Map distinct mechanics, recovery, simple layouts,
  spoken instructions and session-lock suites.

Automated rules, actual browser play, visual review, native audio signal/playback,
hosted delivery, human listening, physical-device use and child observation are
different evidence classes. A browser-sized iPad view is not a physical iPad or
classroom observation. The current beta follows the Game Design Bible and
continuous-QA policy; no unknown manual evidence is presented as a pass.
