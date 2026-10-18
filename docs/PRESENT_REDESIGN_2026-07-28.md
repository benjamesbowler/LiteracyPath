# Present: one simple daily classroom lesson

Present offers one teacher-led presentation for each weekday of all 27 teaching
cycles: 135 choices. Monday–Thursday target 15–20 minutes; Friday targets 30
minutes of supported weekly and cumulative review. The 18 October 2026 direction
supersedes the former 18-minute Friday and exhaustive daily recap. The home page contains Cycle, Day and
Present, alongside normal resource navigation. A launch starts at slide one.
There is no format picker, preview console, teaching-stage bar or word-chain
activity. The simple chooser follows the 11 October 2026 direction. The daily variety and
three selected class games follow the 17 October 2026 direction; they supersede
the repeated daily cat activity and universal seed story. The later 18 October
weekly-minimum request sets at least two syllable activities, two rhyming
activities, two hidden sight-word activities and two of each selected sentence
game in every cycle; it supersedes the earlier occasional-pairs schedule.

## Weekly sequence

| Day | New focus | Practice |
| --- | --- | --- |
| Monday | First letter or spelling pattern | Syllable clapping, Sentence Detective, spelling and picture-word matching |
| Tuesday | Second letter; remaining assigned spellings | Rhyming, Sentence Mix-Up, spelling and starting-sound sorting |
| Wednesday | First half of the cycle's sight words | Syllable clapping, What's Missing?, spelling and picture-word matching |
| Thursday | Remaining cycle sight words | Hidden sight words, fresh Sentence Detective, spelling and starting-sound sorting |
| Friday | None | Current-week recap, Sentence Detective, Sentence Mix-Up, What's Missing?, hidden sight words, rhyming, three spelling and three picture-match rounds, sound sorting, six picture sentences and four language choices |

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

Each day opens with bounded sound and sight-word retrieval: already-introduced
current-week targets first, then the previous week's targets, then a rotating
older sample (up to four older sounds and four older words Monday–Thursday;
eight each on Friday). `presentationReviewContent` retains the complete taught
inventory for code eligibility; `presentationDailyReviewContent` selects the
actual visible recap. The manifest records the visible selection and the
remaining inventory honestly. No future target fills a small early bank.

Letter recaps rotate appropriate recorded picture anchors by cycle/day rather
than using apple every time. Say the sound, name the picture and give a fresh
spoken example. Pictures support oral vocabulary, not untaught-word decoding.
Abstract sight words remain clear print without a misleading picture. Back,
Hear and Next are deliberate; nothing advances while children respond.
Thursday revisits current-week targets after introducing its assigned sight
words. Friday's dedicated weekly carousel contains all that week's targets.

The first Monday has no prior recap: its two minutes move to modelling and
retrieval, and an oral sound sort fills the pre-blending block. Once a VC word
is possible (a+m), show it honestly rather than waiting for a CVC.

The five planning blocks Monday–Thursday allow 20 minutes: recall 2, focus 5,
blending 3, games 6, language/reading 4. Friday allows 30 minutes: recall 4,
weekly focus 5, blending 4, games 10, language/reading 7. Friday contains all
three selected class games, three spelling rounds, three picture matches,
sound sorting, six picture readings (two fresh and four labelled rereads from
Monday–Thursday), and four language choices. Short early spelling banks may
reuse their few taught words; pictures and oral language still vary.

These are teacher pacing allowances backed by actual activity rounds, not
measurements of classroom duration. Everyone thinks, responds, explains and
repairs before the teacher advances. Participation is unscored.

## Child-facing activities

- Syllable activities appear Monday and Wednesday with different pictured
  words. Establish the spoken name, listen, clap its one to three beats and
  show the number with fingers before the teacher chooses. Rhyming activities
  appear Tuesday and Friday with different anchors: listen to the picture
  names and choose the one with the same ending sound. Both use existing exact
  word recordings, pictures and green/red retry feedback. These are oral
  awareness activities, never independent decoding or spelling claims.
  Each activity has three numbered rounds, advanced with the normal Next slide
  control. The two activities use six distinct spoken targets across the week.
  From cycle 2, each activity includes a review round naming an actual earlier
  occurrence: last-week retrieval first, then rotating older retrieval from
  cycle 3 onward. Cycle 1 uses six starter examples. Weekly practice prioritises
  the current vocabulary where it has a supported syllable count or rhyme
  family; examples and distractors remain orally modelled. Each round has its
  own picture, exact word replay, response, feedback and retry. There is no
  score or automatic advance.
- Hidden sight-word pairs appear Thursday and Friday in every cycle, after the
  full current-week sight-word set has been introduced.
  It contains eight cards/four pairs in a 4×2 grid. Only introduced words or
  uppercase/lowercase letter forms may enter. A mismatch remains visible for
  two seconds and then both cards hide automatically; a third choice cannot
  interrupt that comparison. Matched pairs stay revealed. Screen pause, overview
  and a hidden document freeze that comparison. Restart, navigation and page
  exit cancel stale callbacks. Play again reshuffles all cards and moves each
  distinct word, including the identity-shuffle fallback.
- Sentence Detective has three numbered rounds per activity (nine distinct matching sentences across Monday, Thursday and Friday). Some match
  and some do not; neither the answer position nor every round's outcome is
  fixed. Everyone gives a thumbs-up/down response before the teacher selects.
  A wrong choice is retained for discussion with red retry feedback; a correct choice has green confirmation. Read and compare explicitly reveals
  the correct matching text. False printed drafts never replay a correct
  sentence recording; Hear is offered only for the exact visible true/repaired
  sentence. Next round is deliberate; the final control becomes Play again and
  resets the three-round set. From cycle two, every session includes an actual
  earlier practice sentence; the week includes last-week and rotating older
  retrieval. Review points to the source practice cycle, never a future lesson
  or a review of a review. Cycle one uses varied starter descriptions. Additional
  facts use already-familiar pictures and existing exact recordings. False drafts
  are explicit authored contrasts, not runtime colour/word substitutions. There
  are no scores or lives.
- What's Missing? displays up to four already-introduced sight words. If there
  are none, it uses already-introduced letter forms. Everyone reads the complete
  set; the teacher hides one and invites recall plus a fresh spoken phrase.
  Hidden print is removed from accessible labels as well. Reveal restores it;
  each activity has three numbered rounds. Next round changes the board and
  hidden target, mixing the day's introduced words with earlier-cycle words.
  Six hidden targets are distinct across Wednesday and Friday when the taught
  bank permits; every board still includes current teaching. Play again resets
  the set and clears reveal feedback. Early tiny banks
  remain honest rather than introducing future targets to fill the board.
- Sentence Mix-Up has three numbered sentences per activity (six different
  sentences across Tuesday and Friday), each with its matching picture. From
  cycle two, each session includes an actual earlier practice sentence and the
  week rotates last-week and older review.
  The teacher starts a 15-second countdown after supported reading. Pause and
  Resume preserve remaining reading time. At zero, the sentence automatically
  disappears and every word becomes a mixed-up tile, while the picture remains.
  The full model and its audio control are unavailable during construction.
  Everyone proposes the next word; the teacher selects it. Selecting an assembled
  word returns it for repair. Duplicate words retain separate tile identities.
  Check order compares the restored text with the original; an incorrect draft
  remains available for discussion and repair. Read it again restores the model
  and a fresh, stopped 15-second countdown for the same round. Next sentence
  enables only after a correct order; editing that order disables progression
  again. It changes the picture, sentence, tiles and recording, clears feedback,
  and waits for a fresh teacher-started 15 seconds. Play again resets all three
  rounds. Normal slide navigation returns to round one. Screen pause, overview, backgrounding
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
  of descriptive statements, useful questions and meaningful commands. A game sentence is revisited as an
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

## Sentence structure and feedback

Each Monday–Thursday lesson adds one punctuation/print-convention choice and
one basic grammar choice, using the actual daily sentence and matching picture.
Friday has two of each. Print conventions rotate capital starts, spaces and
full stops/question marks. Grammar contrasts is/are, has/have, a/an or complete
sentence order as supported by the source sentence. Adults model unfamiliar
print. Children choose orally before the teacher presses the board choice;
after feedback everyone explains and rereads the complete sentence.

Every checkable game gives a green tick plus explicit correct text or red cross
plus gentle retry text. The chosen answer or retained draft also changes colour;
colour is never the only signal. Editing and restarting clear stale outcomes.
Missing-word Reveal is green and says “Revealed”, without inventing correctness.
Pair mismatches turn red during their two-second comparison; matched pairs stay
green and visible. No score, lives or independent-mastery claim is added.

## Appearance and access

Use the child app's current [blue interface standard](design/BLUE_UI_AND_SIMPLE_HOLLOW.md):
chalk white `#F7F8FA`, white panels, navy `#18263E`, cobalt `#3454C8`, secondary
ink `#5C677A`, selected fill `#E9EDF9` and quiet control boundaries. Preserve
Andika for learning print and self-hosted Source Sans 3 for teacher controls.
Learning print, including recap words and letters, explicitly uses self-hosted
Andika with its barred uppercase I and single-storey a/g; adult controls use
Source Sans 3. Sight-word examples are complete, useful sentences at 88 canvas
pixels. Sound buttons say “Hear sound”, keeping the spelling Cc distinct from
its /k/ recording. Prefer accessible concrete vocabulary such as goat, girl
and gate rather than gap. Teacher instructions are small and secondary;
reading targets, letters and pictures remain large. Do not put a large instructional paragraph above the
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
`presentationClassGames.js` owns the three selected game views,
`presentationLanguage.js` owns picture-based grammar/print choices,
`presentationPhonology.js` owns oral syllable counting and rhyming, and
`public/present/classGames.js` owns their bounded interactions/countdown. `PresentPage.jsx` owns the two choosers and launch/fallback. Shared
curriculum, source artwork, canonical recordings and still-referenced authoring
banks remain authoritative inputs.

Focused tests enumerate all 135 choices for weekday target coverage, current-week priority and rotated
cumulative review, no new Friday teaching, two weekly eight-card sight-word pair games,
two syllable and two rhyme activities, the selected weekday game rotation, taught
code, fresh daily reading, varied spelling targets, required media and separate writing cases.
Browser checks exercise popup/fallback, retained wrong drafts, keyboard matching,
finger ink, literal sentence/picture contrasts, barred I and large HFW examples, visible
green/red feedback and reset, sentence language choices, missing-word concealment, the
15-second shuffle with retained/repairable drafts, pause/reset/navigation
lifecycle, actual selected
audio delivery/cancellation, palette/characters and rendered projector/tablet
fit. Required regression, mobile-layout and audio-integrity gates also apply.
Automated and rendered evidence is distinct from physical-device, back-row
listening and observed classroom duration.
