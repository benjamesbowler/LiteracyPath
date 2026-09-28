# Present mode: weekly classroom lessons

Present offers five teacher-led lessons for each of the 27 numbered EL cycles,
with three formats: Daily lesson (15 minutes), Explore further (25 minutes), and
Quick revisit (8 minutes). This gives 405 cycle/day/format choices. Monday is
selected initially. The whole-cycle option remains an untimed resource collection;
assessment weeks retain their separate decks.

## Curriculum and sources

The live `elSkillsBlockCycles.js` records own the cycle order, assigned letter days,
high-frequency words, daily routines, and Friday practice/check designation.
Present follows that sequence and does not change formal assessment scoring.
Poems and poem-related questions are excluded from whole-cycle and daily decks. These daily lessons are local teaching adaptations, not official
EL Education lesson reproductions or replacements for differentiated small groups.

The adaptation draws on the existing cycle plans and classroom resources: the
Cycle 3 whole-group Lessons 1–3 slide decks in `Desktop/EL Sea Lions/EL Week 3`
(letter formation, high-frequency word routines, sound recall, chaining and
checks for understanding), the app's
cycle-specific letter and clay-mat resources, and the
[EL Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf).
The classroom source slides order I before N; the app's current cycle record
assigns N to Monday and I to Tuesday. Present follows the live app sequence.

## Daily teaching contract

Each daily deck and its private teacher plan share five activity budgets. The
Daily lesson uses the following windows:

| Activity | Minutes | Purpose |
| --- | --- | --- |
| Listen and warm up | 2 | Model one oral example, then hear children's responses to another |
| Sounds, formation and reading | 4 | Assigned new learning or retrieval, picture-supported sound work, blending |
| High-frequency words | 3 | Read, spell, use in speech, then write from memory and compare |
| Apply | 4 | Taught-word application, dictation and supported shared writing |
| Show what you know | 2 | Everyone responds; sample individuals and identify what needs reteaching |

Explore further allocates 3, 7, 5, 7 and 3 minutes to those same blocks. It adds
word building, a one-part word change where the taught code permits a valid pair,
supported sentence tracking, and a second oral-language card. Quick revisit uses
1, 2, 2, 2 and 1 minutes, selecting a shorter retrieval sequence without formation
animations or shared sentence composition.

Timings include interaction and feedback; they are teaching budgets, not measured
classroom durations or slide-count estimates. The projected pacing label identifies
the current block's window. A teacher may pause, model again, or shorten a repeat.

- Monday introduces the assigned focus and uses taught words in spoken sentences.
- Tuesday retrieves learning, introduces the next assigned focus, and continues
  sound recall and meaningful use of taught words.
- Wednesday includes any assigned third spelling, word reading, partner talk and
  dictation using current cycle content.
- Thursday combines oral manipulation, spelling from dictation, repair, and
  teacher-supported sentence composition with a taught high-frequency word.
- Friday revisits familiar sounds, word reading and sentence use. Check cycles
  include practice dictation and a recap, with the formal Cycle Check separate.

## Teaching boundaries

- Oral language and picture labels can exceed taught code; adults read them.
  Pictures support meaning, not guessing an unknown printed word.
- Sentence application accepts any meaningful use of the taught word. Its example
  is a teaching model, never a uniquely scored answer.
- Word blending and word changes stay within code introduced by the selected
  day, including the day of a new digraph or word ending. Regular short-vowel
  examples come from a curated bank; letter membership alone is insufficient.
  Later pattern cycles have explicit spelling-part reading. A spelling part can
  represent multiple sounds; `x` is excluded from one-sound-per-letter examples.
- High-frequency words retain their authored case, including the pronoun `I`.
- The 54 oral-language cards in `presentVocabulary.js` provide two distinct
  words per cycle, each with a meaning, question, model and extension prompt.
  They reuse current shared artwork and recorded word audio. Later weekdays
  revisit the words with a deeper question; these are adult-supported language
  tasks, not independent reading or scored comprehension items.
- Answers are hidden visually and from accessibility until revealed. Writing
  prompts withhold the spelling until children have attempted it.
- Recaps and group responses do not create scores or formal mastery judgements.
- Native keyboard activation of buttons must work without also changing slides.

## Implementation and verification

`presentationBuilder.js` owns daily plans, lesson assembly, private teacher
metadata and projected content. `PresentPage.jsx` uses that single assembly for
its searchable slide outline, interactive preview, support/extension guidance
and printable lesson plan. The teacher can start from any selected slide.
Teacher notes are removed from the projector HTML, including dictation targets.
The preview and popup report navigation back to the teacher workspace.

`public/present/deck.js` handles scaling, ordered word-building input, spelling
emphasis during guided blending, teacher-controlled sentence tracking, formation,
answer reveals, silent thinking time, a slide chooser, screen pause, fullscreen
and keyboard navigation. Audio and running animations stop on navigation or
screen pause. Native button activation takes priority over deck shortcuts.
`present.css` styles the responsive teacher workspace and printable notes.

The fixed 1920×1080 stage scales to the screen. Child-decoded glyphs use the
self-hosted Andika regular/bold files in `public/fonts/present/`, with their OFL
licence. Chrome uses the existing display fonts. Motion demonstrates formation,
spelling sequence or the current spoken word; decorative looping was removed.
Reduced-motion preferences suppress nonessential transitions. Asset references, audio and stroke models
continue to come from current shared sources. Popup decks keep their same-origin
external script for CSP compatibility.

Unit coverage checks all 405 daily choices for complete budgets, consistent
preview indexing, format-specific content and assessment separation. It checks
all 54 vocabulary cards and their media, retained letter-day assignments and
representative day boundaries for new spellings. Browser checks exercise the
real picker at desktop/tablet/phone widths, projector controls under CSP, private
notes, popup recovery, all new activities, printed notes and representative
stage fit. Automated and rendered checks do not establish observed classroom
pacing, physical projector/iPad behaviour or human listening evidence.
