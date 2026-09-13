# Adventure Map games

Current product contract, 13 September 2026. Scope: the child Adventure Map,
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
| Word Match | Hear a taught sight word and tap its printed form, interleaved with short word-pair boards. | `sightWordChoice`, `wordMemory` |
| Letter Find | Find every requested big and small letter in a mixed grid. | `letterGrid` |
| Missing Letters | Complete the first or final letter of a pictured, spoken CVC word. | `missingLetter` |
| Rhyme Time | Choose two pictured words that rhyme. | `rhymePair` |
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
  Cycle 1 offers Letter Find once and omits Missing Letters until a CVC word
  is taught. Older Cycle 1 `build` links still open Letter Find. The shared
  picture pool retains the programme's exclusions for ambiguous or unsuitable
  basic picture labels; the existing spoken, illustrated yawn example keeps Y
  picture review available alongside yo-yo. CVC pictures are pinned to reviewed,
  text-free artwork so they do not
  print the answer. A containing letter does not establish a word's initial
  sound; a consonant cluster containing the target sound cannot be a wrong
  initial-sound choice.
- Sight words follow the separately taught high-frequency-word strand. Matching
  a sight word does not prove mastery of all phonics patterns inside it. The
  pronoun I keeps its correct capital form on matching cards.
- Rhymes are authored sound families, not guesses from final spelling. Rhyme
  and compound vocabulary is pictured and spoken; its richer vocabulary does
  not become independent decoding evidence.
- Rhyming is an optional three-question game with positive instructions only.
  Picture Words is also optional. Automatic station progression follows the
  core sound, letter and word games; it does not require either side activity.
  There are no poem or negative-rhyme questions.
- New levels practise both cases of the new letters and retain earlier taught
  targets in eligible games. Cycle 2 introduces Tt/Ss and reviews Aa/Mm. Current
  targets and earlier review are interleaved early; a long bank does not push
  new letters to the end. Letter Match asks for each case once per outing.
  Each letter occurs on one search grid, at most three times in either case.
- Choices, examples, rhyme families and compound targets vary under a recorded
  run seed. The same target and activity format appears at most three times
  per outing. Changed pictures or answer slots do not bypass that limit. Hidden
  cards have opaque identifiers and do not expose their word in the accessible
  name until turned over. Opening the station menu does not consume the play
  seed or repeatedly build all of the games.
- A search completes only after every matching object or letter is found.
  Wrong choices record misses; already found targets remain. A card cannot
  pair with itself and mismatches turn back over automatically.
- Cycle Quest focuses on sound and word recognition, retaining assigned targets
  plus earlier review without compulsory rhyme, compound or memory rounds.
  Cycles 1–4 revisit every taught high-frequency word and phonics target. Cycle 4
  therefore includes all eight words and eight sounds; Word Match offers two
  recognition opportunities per word interleaved with two short matching boards.
  Later cycles retain current targets and rotating earlier words. Cycles 25–27
  include sound teams and endings in Sound and Letter Match as well as letter grids.
  First-attempt evidence and support remain separate from eventual completion.
- Scores and stars remain practice evidence. This surface does not set EL
  placement, formal Secure judgements or oral-reading fluency.

Exact teacher cycle assignments are retained. Ordinary map progression, saved stars,
learner identity and the classroom lock remain in the existing progress and
session systems. A first visit starts with the current progress schema so its
first earned star and completed station survive saving and reload. There is no
progress reset or new hosted data field/service.

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

- Rounds and media: `src/components/elQuest/elQuestEngine.js`; shared reviewed
  CVC pictures: `src/data/cycleWordBuildInventory.js`.
- Shared sound examples: `src/data/cycleSoundWords.js`; taught-letter parsing
  and repetition limits: `src/utils/cyclePracticeVariation.js`.
- Render selection: `src/components/elQuest/mechanics/adventureMechanics.jsx`.
- Responses: `CodeMechanics.jsx`, `SimpleMechanics.jsx` and their pure state modules.
- Evidence/coaching: `src/components/elQuest/adventureRunState.js`.
- Child layout: `AdventureRoundFrame.jsx` and `src/styles/adventure-simple-games.css`.
- Unit coverage: Adventure Map code, simple-state, registry, curriculum, instruction
  audio, Cycle Quest, run state, progress and focus-lock suites.
- Browser coverage: Adventure Map distinct mechanics, recovery, simple layouts,
  spoken instructions, cumulative review/replay, responsive letter choices and
  session-lock suites.

Automated rules, actual browser play, visual review, native audio signal/playback,
hosted delivery, human listening, physical-device use and child observation are
different evidence classes. A browser-sized iPad view is not a physical iPad or
classroom observation. The current beta follows the Game Design Bible and
continuous-QA policy; no unknown manual evidence is presented as a pass.
