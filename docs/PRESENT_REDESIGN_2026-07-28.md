# Present mode: whole-class cycle lessons

Present offers five teacher-led lessons for each of the 27 numbered EL cycles,
with three formats: Daily lesson (15 minutes), Explore further (25 minutes), and
Quick revisit (8 minutes). All 405 choices use concrete classroom activities.
The whole-cycle option is an untimed resource collection; assessment weeks retain
their separate routine decks. Poems remain excluded.

## Curriculum and sources

`elSkillsBlockCycles.js` owns cycle order, letter introduction days,
high-frequency words and Friday practice/check designations. Present follows
that sequence and leaves formal assessment scoring unchanged. These lessons are
local teaching adaptations for whole-group EL Education Skills Block teaching,
not official EL lesson reproductions or replacements for differentiated groups.

The adaptation's classroom sources include the Cycle 3 whole-group Lessons 1–3
decks in `Desktop/EL Sea Lions/EL Week 3`, the app's cycle-specific letter and
clay mats, and the [EL Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf).
Where a source deck's letter order differs, the current app cycle record owns
the assigned teaching days.

## Daily teaching contract

Every daily format includes the complete cumulative sound and high-frequency
word review, current-letter finger tracing, picture vocabulary, illustrated
sentence reading, sight-word pairs, spelling tiles and picture-word matching.
No format replaces an activity with a bare instruction to write or talk.

| Block | Daily lesson minutes | Classroom activity |
| --- | --- | --- |
| Listen and warm up | 2 | Model oral sound play, then everyone responds |
| Retrieve sounds and trace | 4 | Read every sound set, model new letters on their assigned day, finger-trace current letters, blend taught words |
| Read and match sight words | 3 | Read every word set, practise current targets, turn cards and find word pairs |
| Picture words, sentences and spelling | 4 | Name and read pictures, track a short illustrated sentence, build a heard word with tiles |
| Picture word match | 2 | Read three choices, everyone points, a volunteer chooses and the class receives feedback |

Explore further allocates 3, 7, 5, 7 and 3 minutes. It adds a sound hunt, a
one-part word change when the taught code permits it, another word-pair game,
a second illustrated sentence, another spelling round and a second picture match.
Quick revisit allocates 1, 2, 2, 2 and 1 minutes. It shortens modelling and extra
rounds while retaining all previous words and sounds, finger tracing and each
core game. Timings are adjustable teaching budgets, not observed classroom durations.
A large accumulated review may need more time when the class needs reteaching.

- Monday and Tuesday introduce the assigned letters. A Wednesday introduction
  is retained where the curriculum assigns one.
- Every day retrieves all earlier spellings plus current spellings introduced
  by that day, in sets of at most eight large cards. Weekly high-frequency targets
  and all prior high-frequency words appear once each across complete review sets,
  preserving authored case, including `I`.
- Current letters are traced every day after introduction, including Quick
  revisit and Friday. Review cycles trace familiar letters. Pattern cycles trace
  their spelling sequences where applicable; fluency cycles add no new letters.
- The vocabulary gallery mixes current-cycle picture words, relevant sound
  examples and familiar vocabulary from earlier cycles. A teacher can name a word
  for everyone to point to, or invite a mime or a silly-voice rereading.
- `presentVocabulary.js` owns 54 short, image-supported sentence captions, two
  per cycle. Daily formats rotate them; Explore further and whole-cycle decks
  include both. The shared picture and recorded word catalogues own their media.
- On check Fridays the deck remains whole-class practice. The formal Cycle Check
  is administered separately.

## Interaction and teaching boundaries

Finger tracing uses the shared vector formation paths and numbered stroke starts.
Children trace on their palm, desk or in the air; a volunteer can leave real finger
or mouse marks over the screen model. Watch the pencil and Write with me retain
the recorded readiness cue and controlled formation animation. Clear finger marks,
slide navigation and screen pause stop active pointer input. No handwriting score
is inferred from these marks.

Sight-word pairs reveal two cards for the class to read. A mismatch remains open
for comparison until the next choice, and the same cards stay in place. Matched
pairs remain visible; completing every pair gives feedback and Play again resets.
Picture-word matching retains all three options during a retry and confirms the
matching label. These are supported vocabulary and retrieval games, not scored
independent mastery checks.

Spelling tiles withhold the printed target. Children hear the recorded word and,
where available, see its picture before selecting parts in order. A wrong part
leaves the slots unchanged for another attempt. CVC words use taught letters;
digraph and later-pattern tasks use introduced spelling units. Before a CVC word
is possible, spelling uses a taught high-frequency word with explicit teacher
modelling. A spelling part can represent multiple sounds; `x` is excluded from
one-sound-per-letter CVC models. The completed spelling is read together.

Adults support picture labels and sentence words beyond taught code. Pictures
establish meaning and do not justify guessing unfamiliar print. Illustrated
sentences support shared reading and word tracking; echo reading and group
responses do not create independent-reading, fluency or assessment scores.
Native keyboard activation of controls takes priority over deck navigation.
Answers on retained phonemic-awareness, blending and word-change slides remain
hidden visually and from accessibility until deliberately revealed.

## Implementation and verification

`presentationBuilder.js` owns cumulative review, daily plans, lesson assembly,
private teacher metadata and projected content. `PresentPage.jsx` uses that same
assembly for the slide outline, preview, printable plan and selected-slide launch.
Teacher guidance is excluded from the projector document. Preview and popup
navigation report their current slide back to the workspace.

`public/present/deck.js` owns scaling, word pairs, picture matching, pointer
tracing, ordered spelling input, guided blending, sentence tracking, formation,
reveals, thinking time, slide choice, pause, fullscreen and keyboard navigation.
Audio and animations stop on navigation or screen pause. Games reset on return.
`present.css` owns the responsive teacher workspace.

The fixed 1920×1080 stage scales to the screen. Decoded glyphs use self-hosted
Andika. Existing artwork remains uncropped in picture cards and games.
Reduced-motion preferences suppress nonessential transitions. Popup and preview
decks use the same-origin external runtime for CSP compatibility.

Unit checks cover all daily choices and whole-cycle decks, complete cumulative
review, assigned-day boundaries, finger models, picture/audio references, CVC
code, private notes and deterministic choices. Browser checks exercise the real
workspace and popup, word-pair mismatch/completion/reset, picture-match retry,
spelling, sentence tracking, actual pointer traces at different scales, navigation,
keyboard/CSP behavior and stage fit. Rendered/browser evidence does not establish
physical-projector or classroom pacing observations.
