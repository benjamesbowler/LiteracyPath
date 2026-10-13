# Present: one simple daily classroom lesson

Present offers one 15–20 minute teacher-led presentation for each weekday of
all 27 teaching cycles: 135 choices. The home page contains Cycle, Day and
Present, alongside normal resource navigation. A launch starts at slide one.
There is no format picker, preview console, teaching-stage bar or word-chain
activity. These decisions reflect the product owner's 11 October 2026 direction
and supersede the earlier three-format contract.

## Weekly sequence

| Day | New focus | Practice |
| --- | --- | --- |
| Monday | First letter or spelling pattern | Separate uppercase/lowercase tracing, blending, matching, spelling, picture sort and sentence reading |
| Tuesday | Second letter; any remaining assigned spellings in multi-target cycles | Same simple routine, with fresh eligible practice words |
| Wednesday | First half of the cycle's sight words | Previously introduced letters, both writing cases and literacy games |
| Thursday | Remaining cycle sight words | Letter/word practice, picture sentences and the illustrated three-event story |
| Friday | None | Recap everything introduced Monday–Thursday; two matching rounds, two spelling rounds, two picture-word rounds, picture sort, story and weekly round-up |

Review and fluency cycles introduce no new letters. They trace familiar letters
and retain the applicable taught reading/spelling patterns. Formal Cycle Checks
remain separate from the Friday whole-class games.

`elSkillsBlockCycles.js` owns cycle order, spellings and sight-word targets.
Present adapts their introduction days to this weekly sequence without changing
shared learner placement, assessment scoring or other lesson surfaces. The
[EL Skills Block Resource Manual](https://eleducation.org/documents/1619/Curriculum_Tools_K2_Skills_Block_Resource_Manual-0124.pdf)
and the saved October research audit remain curriculum/research provenance;
this file is the current product implementation contract.

## Recap and pace

Each day opens with brief cumulative sound and sight-word retrieval. Every
previous cycle remains represented, including authored uppercase `I`. Only
already-introduced content from the current week enters the opening recap.
The opening letter recap displays one large uppercase/lowercase spelling with
its picture anchor and word, such as `Aa` / apple and `Tt` / turtle. Hear sound
and Hear [picture word] separately replay the approved recordings. Picture
anchors support oral recall, rather than requiring untaught-word decoding.
Pattern anchors use existing meaningful artwork when available. The sight-word
recap displays each learned word clearly, including abstract words without a
misleading picture. Both recaps have Back and Next and appear once at the start
of the presentation, not on every slide. Nothing autoplays or advances while
children respond. Friday adds a separate carousel
of this week's letters and words, also one item at a time.

The five planning blocks allow 18 minutes: recap 3, daily focus 4, blending/reading
2, games 5 and picture reading/round-up 4. Friday allocates 6 minutes to games
and 3 to story/round-up. These are planning allowances within the requested
15–20 minute session, not measurements of a real classroom lesson. Teachers
control pace; no setting or timer adds a second lesson format.

## Child-facing activities

- Memory always contains **eight cards, four pairs**, arranged in four columns
  and two rows. Prefer four distinct introduced sight words. If fewer than four
  are taught, repeat valid word pairs to fill eight cards. Before sight-word
  introduction, use eight taught uppercase/lowercase letter cards. Never add an
  untaught sight word to fill the board. A letter match needs both different
  cases of the same letter. A mismatch stays visible until the next deliberate
  turn; Play again reshuffles the complete board and moves every distinct word
  to different positions, with a fallback for an identity random shuffle. Daily
  word selection varies within introduced content, and weekday layouts stay
  distinct when the same bank is reused. A one-word introductory bank cannot
  yet offer a contrast between different words.
- CVC blends vary with cycle and day and use only already-taught letters.
  Pattern lessons retain eligible spelling chunks. Spelling gives the spoken
  target, a useful picture when available and shuffled tiles; it withholds the
  printed answer during the attempt. Check retains an incorrect draft for
  discussion and Undo allows repair. There are no guided/model-mode toggles.
  Before a CVC is available, use a taught VC or sight word; the first Monday
  cannot use an untaught `m` merely to make `am`.
- Uppercase and lowercase tracing use separate slides. Each has its own Start
  and Clear. The teacher pauses between cases and deliberately starts the next
  animation; the runtime never plays both consecutively. Existing numbered
  formation paths for a multi-letter spelling also show and play one letter
  at a time. Next letter changes the model and waits for a fresh Start press;
  finishing a letter never selects or plays the next. The writing board flexes
  within the slide so Start/Clear/Next letter stay above the bottom navigation.
  Real finger ink remains. Screen tracing is practice,
  not a pencil-control or handwriting score.
- Picture-word matching shows one clear picture with three readable labels.
  Adults support untaught vocabulary print. Feedback preserves a wrong choice
  for discussion and does not remove turns or lives.
- Starting-sound sorting has four pictures, picture-word replay and two large
  letter/sound destinations. Choose current/familiar taught contrasts that
  vary across cycles. When only one letter is taught, use an unlabelled Other
  sound destination; do not present an untaught letter as already learned.
- Sentence reading uses the exact authored weekly caption, its existing image
  and whole-sentence audio. Reading print is prominent; teacher meaning prompts
  are smaller. Word tracking remains a separate deliberate action.
- Change the verb has two controls, Hear and Change verb, and the visible
  matching cat scene. `A cat sat.` and `A cat ran.` update print, picture and
  exact recording together. This is supported shared reading until prerequisites
  are taught. It is not the removed Change one part word-chain activity.
- The seed story shows one event at a time with large visible text, its matching
  image, Hear and Next scene. After all three events, Put pictures in order opens
  three distinct picture/text cards. Check order preserves a wrong order; Again
  restarts. No alternate scene-count modes or automatic story playback.

Participation, matched pairs, choral reading and pointer completion never
become independent mastery, formal assessment scores or placement evidence.

## Appearance and access

Use the child app's current [blue interface standard](design/BLUE_UI_AND_SIMPLE_HOLLOW.md):
chalk white `#F7F8FA`, white panels, navy `#18263E`, cobalt `#3454C8`, secondary
ink `#5C677A`, selected fill `#E9EDF9` and quiet control boundaries. Preserve
Andika for learning print and self-hosted Source Sans 3 for teacher controls.
Teacher instructions are small and secondary; reading targets, letters and
pictures remain large. Do not put a large instructional paragraph above the
child's stimulus. Keep visible focus shapes and native viewport-sized controls.

Use canonical painted book characters through `bookCharacterAvatar.js`: Muddy
in cycles 1–9, Chompy in 10–18 and Pip in 19–27. Characters remain small,
decorative and in their original colors. The old generic rabbit poses are no
longer emitted by Present; their shared assets remain for other active uses.

Navigation exposes Slides, Pause, Full screen, Previous and Next. The teaching
stage selector and its additional footer are removed. Child stimuli retain the
1920×1080 canvas; the canvas scales into the space left by real viewport controls.
Keyboard movement/reveal/fullscreen, quiet animation policy and recoverable
media failures remain. Class-scoped local memory remembers only cycle and day
when a lesson is prepared to open. Entry defaults to the current class cycle
and today's teaching day. A saved lesson is offered separately through
“Use saved lesson”; it never silently overrides the current class cycle. The
selection opens from the beginning and does not imply saved slide progress.

## Audio and images

Reuse the existing approved phoneme and word resolvers and the generated exact
sentence registry. Both voiced and unvoiced `th` remain accessible. Each story
event and verb sentence has its own whole-sentence recording. The registry owns
all 59 exact scripts: 54 captions, two cat sentences and three story events.
Four reuse canonical exact recordings and 55 were installed by the approved
Leda batch. Do not hand-edit generated manifests or make paid regeneration
requests for a layout change.

`public/present/audio.js` owns a single instructional playback channel. Rapid
replay, completion, error and stale callbacks remain bounded. Slide navigation
cancels the prior audio/animation. Pause preserves position and resumes that
same playback; it never launches a different prompt. A recording or essential
picture failure offers explicit recoverable teacher access and never counts
as a child's incorrect response. No music/effect competes with teaching speech.

## Implementation and verification

`presentationBuilder.js` owns daily assembly, index, semantic metadata and
projection; `presentationActivities.js` owns the simple sentence/sort/story
views. `PresentPage.jsx` owns the two choosers and launch/fallback. Shared
curriculum, source artwork, canonical recordings and still-referenced authoring
banks remain authoritative inputs.

Focused tests enumerate all 135 choices for weekday target coverage, complete
cumulative review, no new Friday teaching, eight playable memory cards, taught
code, varied spelling targets, required media and separate writing cases.
Browser checks exercise popup/fallback, retained wrong drafts, keyboard matching,
finger ink, sentence/picture changes, manual story sequencing, actual selected
audio delivery/cancellation, palette/characters and rendered projector/tablet
fit. Required regression, mobile-layout and audio-integrity gates also apply.
Automated and rendered evidence is distinct from physical-device, back-row
listening and observed classroom duration.
