# Present: one simple daily classroom lesson

Present offers one 15–20 minute teacher-led presentation for each weekday of
all 27 teaching cycles: 135 choices. The home page contains Cycle, Day and
Present, alongside normal resource navigation. A launch starts at slide one.
There is no format picker, preview console, teaching-stage bar or word-chain
activity. The simple chooser follows the 11 October 2026 direction. The daily variety and
three selected class games follow the 17 October 2026 direction; they supersede
the repeated daily cat activity, universal seed story and daily hidden pairs.

## Weekly sequence

| Day | New focus | Practice |
| --- | --- | --- |
| Monday | First letter or spelling pattern | Sentence Detective, spelling and picture-word matching |
| Tuesday | Second letter; remaining assigned spellings | Sentence Mix-Up, spelling and starting-sound sorting |
| Wednesday | First half of the cycle's sight words | What's Missing?, spelling and picture-word matching |
| Thursday | Remaining cycle sight words | Fresh Sentence Detective, spelling and starting-sound sorting |
| Friday | None | Weekly recap, a fresh Sentence Mix-Up, What's Missing? (odd cycles) or hidden pairs (even cycles), two spelling rounds and picture matching |

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
of the presentation, not on every slide. Review items never autoplay or advance while children respond. Sentence Mix-Up
has its own explicitly started reading countdown, described below. Friday adds a separate carousel
of this week's letters and words, also one item at a time.

The five planning blocks allow 18 minutes: recap 3, daily focus 4, blending/reading
2, games 5 and picture reading/round-up 4. Friday allocates 6 minutes to games
and 3 to picture reading/round-up. These are planning allowances within the requested
15–20 minute session, not measurements of a real classroom lesson. Teachers
control pace; no setting or timer adds a second lesson format.

## Child-facing activities

- Hidden pairs appears once every second cycle, on Friday, rather than daily.
  It contains eight cards/four pairs in a 4×2 grid. Only introduced words or
  uppercase/lowercase letter forms may enter. A mismatch remains visible for
  two seconds and then both cards hide automatically; a third choice cannot
  interrupt that comparison. Matched pairs stay revealed. Screen pause, overview
  and a hidden document freeze that comparison. Restart, navigation and page
  exit cancel stale callbacks. Play again reshuffles all cards and moves each
  distinct word, including the identity-shuffle fallback.
- Sentence Detective uses two authored picture/sentence contrasts. Some match
  and some do not; neither the answer position nor every round's outcome is
  fixed. Everyone gives a thumbs-up/down response before the teacher selects.
  A wrong choice is retained for discussion. Read and compare explicitly reveals
  the correct matching text. False printed drafts never replay a correct
  sentence recording; Hear is offered only for the exact visible true/repaired
  sentence. Next picture is deliberate, with no scores or lives.
- What's Missing? displays up to four already-introduced sight words. If there
  are none, it uses already-introduced letter forms. Everyone reads the complete
  set; the teacher hides one and invites recall plus a fresh spoken phrase.
  Hidden print is removed from accessible labels as well. Reveal restores it;
  Next round restores the set and chooses another hidden item. Early tiny banks
  remain honest rather than introducing future targets to fill the board.
- Sentence Mix-Up shows one complete simple sentence with its matching picture.
  The teacher starts a 15-second countdown after supported reading. Pause and
  Resume preserve remaining reading time. At zero, the sentence automatically
  disappears and every word becomes a mixed-up tile, while the picture remains.
  The full model and its audio control are unavailable during construction.
  Everyone proposes the next word; the teacher selects it. Selecting an assembled
  word returns it for repair. Duplicate words retain separate tile identities.
  Check order compares the restored text with the original; an incorrect draft
  remains available for discussion and repair. Read it again restores the model
  and a fresh, stopped 15-second countdown. Screen pause, overview, backgrounding
  or essential-picture failure pauses timing; navigation/replay/exit cancel
  pending callbacks. No additional race timer or speed score is added.
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
- Picture reading has ten authored sentences per cycle: two distinct sentences
  per day, 270 cards across all 135 lessons. Each week includes at least four
  meaningful picture words, current vocabulary plus familiar review, and a mix
  of statements, questions and commands. A game sentence is revisited as an
  explicitly labelled reread; other daily captions are fresh. Exact picture
  details govern claims; an isolated-object picture is vocabulary support, not
  proof of an unshown action. Adults read untaught code. Word tracking is a
  separate deliberate action. No daily fixed cat pair or seed-story game remains.
- Children need no paper, whiteboards, counters or individual devices. They
  respond through speech, pointing, thumbs, partner explanation, air writing or
  palm tracing. Only the teacher operates the presentation. Selective spelling,
  matching and sorting practice retains taught-code constraints; eligible words
  vary across days, while small early banks may repeat through different tasks.

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
sentence registry. Both voiced and unvoiced `th` remain accessible. Every active daily sentence resolves to its exact whole-sentence recording.
`presentDailyReading.js` owns the 270-card daily bank; the existing narration
generator owns exact-script collection, canonical reuse, finite approved batch
accounting, full decode/signal verification and generated manifest provenance.
Do not hand-edit generated registries or generate paid audio for a layout change.

`public/present/audio.js` owns a single instructional playback channel. Rapid
replay, completion, error and stale callbacks remain bounded. Slide navigation
cancels the prior audio/animation. Pause preserves position and resumes that
same playback; it never launches a different prompt. A recording or essential
picture failure offers explicit recoverable teacher access and never counts
as a child's incorrect response. No music/effect competes with teaching speech.

## Implementation and verification

`presentationBuilder.js` owns daily assembly, index, semantic metadata and
projection; `presentationActivities.js` owns starting-sound sorts,
`presentationClassGames.js` owns the three selected game views, and
`public/present/classGames.js` owns their bounded interactions/countdown. `PresentPage.jsx` owns the two choosers and launch/fallback. Shared
curriculum, source artwork, canonical recordings and still-referenced authoring
banks remain authoritative inputs.

Focused tests enumerate all 135 choices for weekday target coverage, complete
cumulative review, no new Friday teaching, occasional eight-card pairs, the selected weekday game rotation, taught
code, fresh daily reading, varied spelling targets, required media and separate writing cases.
Browser checks exercise popup/fallback, retained wrong drafts, keyboard matching,
finger ink, literal sentence/picture contrasts, missing-word concealment, the
15-second shuffle with retained/repairable drafts, pause/reset/navigation
lifecycle, actual selected
audio delivery/cancellation, palette/characters and rendered projector/tablet
fit. Required regression, mobile-layout and audio-integrity gates also apply.
Automated and rendered evidence is distinct from physical-device, back-row
listening and observed classroom duration.
