# Present mode: weekly classroom lessons

Present offers five teacher-led lessons of about 15 minutes for every numbered
EL cycle. Monday is selected initially. The whole-cycle option remains a resource
collection, not a timed daily lesson. Assessment weeks retain their separate decks.

## Curriculum and sources

The live `elSkillsBlockCycles.js` records own the cycle order, assigned letter days,
high-frequency words, daily routines, and Friday practice/check designation.
`elCyclePoems.js` owns the poems. Present does not change either sequence or formal
assessment scoring. These daily lessons are local teaching adaptations, not official
EL Education lesson reproductions or replacements for differentiated small groups.

The adaptation draws on the existing cycle plans and classroom resources: the
Cycle 3 whole-group Lessons 1–3 slide decks in `Desktop/EL Sea Lions/EL Week 3`
(poem launch, word tracking and spaces, letter formation, high-frequency word
routines, call and response, chaining and checks for understanding), the app's
cycle-specific letter and clay-mat resources, and the
[EL Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf).
The classroom source slides order I before N; the app's current cycle record
assigns N to Monday and I to Tuesday. Present follows the live app sequence.

## Daily teaching contract

Each daily deck and its teacher plan share five activity budgets:

| Activity | Minutes | Purpose |
| --- | --- | --- |
| Listen and warm up | 2 | Model one oral example, then hear children's responses to another |
| Sounds, formation and reading | 4 | Assigned new learning or retrieval, picture-supported sound work, blending |
| High-frequency words | 3 | Read, spell, use in speech, then write from memory and compare |
| Apply | 4 | Purposeful poem work or dictation and supported shared writing |
| Show what you know | 2 | Everyone responds; sample individuals and identify what needs reteaching |

Timings include interaction and feedback; they are teaching budgets, not measured
classroom durations or slide-count estimates. The projected pacing label identifies
the current block's window. A teacher may pause, model again, or shorten a repeat.

- Monday introduces the assigned focus and launches the poem through listening,
  actions and echo reading.
- Tuesday retrieves learning, introduces the next assigned focus, and uses the
  poem to track spoken words and notice spaces.
- Wednesday includes any assigned third spelling, word reading and use, and a
  poem-specific question with partner talk and supporting evidence.
- Thursday combines oral manipulation, spelling from dictation, repair, and
  teacher-supported sentence composition using a poem-specific frame.
- Friday revisits familiar learning. Check cycles include practice dictation and
  a recap, with the formal Cycle Check administered separately. Practice cycles
  revisit sounds, reading and poem performance.

## Teaching boundaries

- Oral language and picture labels can exceed taught code; adults read them.
  Pictures support meaning, not guessing an unknown printed word.
- Poems are teacher-supported listening/reading. Echoing or memorising the poem
  is not independent decoding or fluency evidence.
- Word blending stays within the cycle's taught code. Later pattern cycles have
  explicit spelling-part reading; a spelling part can represent multiple sounds.
- High-frequency words retain their authored case, including the pronoun `I`.
- Answers are hidden visually and from accessibility until revealed. Writing
  prompts withhold the spelling until children have attempted it.
- Recaps and group responses do not create scores or formal mastery judgements.
- Native keyboard activation of buttons must work without also changing slides.

## Implementation and verification

`presentationBuilder.js` owns daily plans, lesson assembly, teacher guidance and
projected content. `PresentPage.jsx` shows the same plan and previews the actual
deck in a same-origin `srcdoc` iframe. `public/present/deck.js` handles scaling,
projection, answer reveals, thinking time and navigation. `present.css` styles
the teacher picker.

The fixed 1920×1080 stage scales to the screen. Child-decoded glyphs use Andika;
chrome uses the existing display fonts. Asset references, audio and stroke models
continue to come from current shared sources. Popup decks keep their same-origin
external script for CSP compatibility.

Behavioural coverage checks all 135 cycle/day combinations for complete timed
blocks, consistent preview indexing, word coverage, varied warm-ups, retained
letter-day assignments and assessment-week separation. Browser checks must also
exercise the real picker, projector, new slide types, reveals and keyboard controls;
mechanical checks do not establish observed classroom pacing.
