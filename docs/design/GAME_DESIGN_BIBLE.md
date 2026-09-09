# LiteracyPath game design bible

Status: canonical product standard
Scope: every child-facing game, mini-game, world, map and game-like reward surface
Companion standards: [Game Visual and Playability Production Guide](GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md), [Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md), [Learning Policy](LEARNING_POLICY.md), [Child Surface Rules](CHILD_SURFACE_RULES.md), [Sound Seekers Release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md)

This document separates **research-backed requirements** from **LiteracyPath product decisions**. A product decision may be stricter than the research floor. It may not weaken accessibility, learning integrity, child safety or privacy.

## 1. The non-negotiable promise

A LiteracyPath game must be a good game and a valid learning activity at the same time. Movement, collecting, speed or visual celebration are not evidence of literacy learning. The action that advances the game must require the child to perceive, recall, discriminate, build, read or apply the target knowledge.

Every playable task therefore has this chain:

1. one observable learning objective;
2. one clear child goal;
3. an action that directly demonstrates the objective;
4. immediate, specific feedback;
5. a supported retry;
6. progress that reflects the demonstrated skill, not time spent or button speed.

If any link is missing, the activity is decoration around a quiz or movement around an answer, not an integrated learning game.

## 2. Research basis

- Digital games can improve learning, but outcomes depend on design rather than the presence of a game wrapper. The Clark, Tanner-Smith and Killingsworth meta-analysis is the baseline evidence for using game mechanics deliberately: [Digital Games, Design, and Learning](https://doi.org/10.3102/0034654315582065).
- Serious games work better when paired with instructional support and repeated play; entertainment alone is not the mechanism: [Wouters et al., 2013](https://doi.org/10.1037/a0031311).
- Feedback should reduce the gap between current and intended performance and should answer “Where am I going?”, “How am I going?” and “Where to next?”: [Hattie and Timperley, 2007](https://doi.org/10.3102/003465430298487) and [Shute, 2008](https://doi.org/10.3102/0034654307313795).
- Learning interfaces must manage essential processing and remove extraneous processing. Signalling, segmenting and coordinated words/pictures are preferable to redundant noise: [Mayer and Moreno, 2003](https://doi.org/10.1207/S15326985EP3801_6) and [Sweller et al., 2019](https://doi.org/10.1007/s10648-019-09465-5).
- Motivation is best supported through competence, autonomy and relatedness rather than pressure or arbitrary reward schedules: [Niemiec and Ryan, 2009](https://doi.org/10.1177/1477878509104318).
- WCAG 2.2 is the accessibility floor. It requires alternatives to complex pointer gestures, pointer cancellation, non-text contrast, control over non-essential motion and a minimum target size; the enhanced target criterion is 44 by 44 CSS pixels: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced).
- Children’s touch performance is not adult touch performance. In a 30-child study (ages 4–10), movement time improved with age and drag-and-drop was slower than tapping for children aged 4–6; the authors caution against applying adult Fitts-law assumptions unchanged: [Yadav et al., 2021](https://doi.org/10.1002/hbe2.305). Research with children aged 2–3 shows that some direct multi-touch gestures are feasible, but it does not establish a universal target-size rule: [Nacher et al., 2015](https://doi.org/10.1016/j.ijhcs.2014.08.004). LiteracyPath’s 56-pixel floor below is therefore a conservative product decision, not a value claimed by either study.
- UNICEF’s RITEC framework identifies safety, inclusion, autonomy, emotions, competence, relationships, creativity and identity as dimensions of children’s wellbeing in digital play: [RITEC Design Toolbox](https://www.unicef.org/childrightsandbusiness/workstreams/responsible-technology/online-gaming/ritec-design-toolbox).
- Child privacy must be high by default, data collection minimised, geolocation off, and nudges must not encourage children to surrender privacy: [ICO Children’s Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/). The United States baseline is [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions).

## 3. Educational mechanic standard

### Required

- Name the construct before designing the mechanic: for example, “select the grapheme that represents the heard /sh/ phoneme,” not “collect letters.”
- The correct action must be impossible through a stable visual giveaway, unchanged position, elimination artefact or repeated answer slot.
- When a question advances, every choice object is cleared and rebuilt. Position, order and distractors must not reveal the answer.
- Distractors must be plausible for the precise skill but clearly wrong under the prompt. Apply the Question Design Bible ambiguity and distractor rules.
- Ordered spelling displays persistent slots at the top of the play area. The child sees completed parts and the next empty slot.
- A wrong attempt names what was selected, explains the relevant contrast in child language, replays the cue when helpful, and permits another attempt without punishment.
- Difficulty changes the literacy demand first. Faster hazards, smaller targets or tighter timing may never be the main distinction between Levels 1 and 2.

### Forbidden

- movement-only completion presented as learning evidence;
- one replacement tile while old distractors remain;
- “wait for a flash” or another event that is not visibly and reliably signalled;
- shapes, colours or symbols with no taught literacy meaning;
- ambiguous phoneme/grapheme units such as asking for “same ending” when one option matches the last letter and another matches a multi-letter rime;
- correctness determined by reaction time, steering precision or device performance when the target is literacy.

## 4. Goal, instruction and feedback

- One primary instruction is visible and spoken before play begins.
- Instruction text and audio must describe the exact current action. “Build the word” is not valid when the task is “Find /m/.”
- A replay control remains visible during play. Audio is never the only carrier of essential information.
- Prompts use a verb plus target: “Find /m/,” “Build cat,” “Choose the sentence that matches the picture.”
- Correct feedback says what made the answer correct. Incorrect feedback says why it did not match and what to attend to next.
- No extra confirmation screen is inserted when the next question can begin automatically after a readable feedback beat.
- Celebration is brief, proportionate and interruptible. Non-essential animation lasting more than five seconds must be pausable or disabled, following [WCAG Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

## 5. Controls and iPad layout

LiteracyPath product decision: the preschool touch target is **56 by 56 CSS pixels minimum**, stricter than the 44-pixel WCAG enhanced target. There must be at least 8 pixels of clear separation between adjacent primary controls.

- Forward and back live at the lower left.
- Left, right and contextual actions live at the lower right.
- Controls respect safe-area insets and remain within the visible game frame at 320px landscape height and standard iPad landscape/portrait sizes.
- A held pointer keeps the action active; pointer-up, pointer-cancel and lost-pointer-capture always release it.
- A tap produces a visible response even if released before the next animation frame.
- Keyboard, pointer and touch reach the same gameplay actions. Arrow keys and WASD support movement; Space/Enter activates the primary action where applicable.
- No required action is drag-only, multi-finger-only, motion-only or hover-only.
- Controls have accessible names that describe the action, not the icon.
- The game must not page-scroll, zoom or select text during intentional control use.

## 6. World and route integrity

- The collision route, actor route, camera route and painted road are one coordinate system.
- A visible path is traversable. An invisible path may not constrain a child away from the painted road.
- Characters, answer objects, gates and pickups sit on walkable ground, never water, lava, scenery or a decorative island unless that location is deliberately reachable.
- Every object has a gameplay or storytelling purpose. Completed answer tiles, collision markers and debug squares are removed immediately.
- Maps use clear landmarks and readable spatial hierarchy. The playable route must remain legible beneath characters and effects.
- Environment motion supports place—water ripples, foliage sways, lights flicker—but does not obscure literacy objects and honours reduced motion.

## 7. Visual and character standard

- Use the app’s book characters and world canon. Generic substitute monsters are not shippable avatars.
- Character silhouette, proportions, expression and palette remain recognisable at game scale.
- Wearables are composable transparent layers anchored per character body and per slot. Back, head, neck and held items can be equipped simultaneously; one pre-rendered outfit may not replace another slot.
- Layer order is coherent: back items behind the body; head/neck items above the body; held items in front and beside the hand.
- Visual depth uses contour, value grouping, contact shadow, overlap and restrained atmospheric effects. Blur and glow do not substitute for readable form.
- Text is never baked into generated scenery or item art.
- Colour is not the sole indicator of target, status or correctness. Selected and correct states also use shape, outline, label, motion or icon.

### Current mechanics and systems reference

Rocket Run is the current reference implementation for learning/game integration,
shared lifecycle, controls, quality tiers and fallback in a visually intensive
LiteracyPath game. It is not an evergreen aesthetic ceiling or proof that the
current rendered art meets the [Game Visual and Playability Production Guide](GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md).
The mechanic chooses the medium, and every substantially changed game must meet
the production guide in the areas that apply to it.

- The learning action and the game action are one action. In Rocket Run, steering to a word is the beginning-sound decision; the learning is not an interruption laid over the game.
- A production-ready scene has coherent art direction across the player, track, authored scenery, lighting, atmosphere, interface and effects. Owned production assets replace placeholder geometry when the device can render them reliably.
- Camera motion, depth, contact shadows, particles, sound and score feedback must make input feel immediate without obscuring words or becoming the source of correctness.
- Touch, keyboard, audio, pause, resume, onboarding, recovery and completion must be finished parts of the experience, not browser defaults around the game.
- Quality tiers must reduce scenery, shadows, particles and pixel density before they reduce legibility or input response. A failed decorative asset load falls back to a complete playable scene.
- Reduced-motion mode must keep the route and feedback readable while removing non-essential intensity.
- A visually simpler literacy game may use flat illustration, stop-motion, cards or physical-feeling type. It is premium when those choices are authored, coherent and responsive—not when it imitates Rocket Run's genre.

## 8. Motivation, rewards and replay

- Rewards acknowledge demonstrated learning, effortful retry, discovery or meaningful creation.
- Optional exploration never blocks the next lesson.
- Children can choose an avatar, route or cosmetic without changing assessment validity.
- No streak anxiety, loot boxes, variable-ratio purchases, countdown pressure, shame, loss aversion or pay-to-progress.
- A replay changes arrangement or application while preserving the learning objective; repeating an identical answer pattern is not replayability.
- Progress is recoverable and resumable. Exiting a game does not erase earned learning evidence.

## 9. Safety, privacy and wellbeing

- No ads, behavioural profiling, geolocation, public leaderboards, open chat or child free-text sharing.
- Collect only data necessary for learning continuity and teacher reporting. Retention and access follow the legal/privacy standards.
- Privacy settings are high by default. Adult gates protect external links and account/privacy actions.
- Avoid dark patterns and persuasive prompts that trade data, attention or spending for belonging or progress.
- Representation must be inclusive without stereotyping; customisation supports identity without ranking bodies, cultures or abilities.
- Provide a clear pause/exit path and a natural stopping point after each short learning loop.

## 10. Shipping gates

Assess every applicable gate and record `PASS`, `FAIL`, `UNKNOWN` or `NOT
APPLICABLE`. A recorded failure blocks the affected release or claim. An
unknown is not a pass and cannot support the corresponding claim; under the
current [continuous-QA decision](../brain/decisions/2026-08-21-continuous-qa-pass-by-exception.md),
missing human, device or observation metadata alone does not block a beta
release. Explicit user qualifiers can still require that exact evidence, and a
reported critical or major defect remains quarantined until corrected and
retested.

1. **Construct gate:** objective, prompt, correct response and evidence chain documented.
2. **Ambiguity gate:** one correct answer under the shown and spoken prompt; distractors independently audited.
3. **Fresh-choice gate:** all choices rebuild after each answered item; no position or elimination giveaway.
4. **Control gate:** keyboard, pointer and touch parity; 56px targets; cancellation; safe areas; portrait and landscape.
5. **Route gate:** screenshots show player, residents, choices and gates on the visible road at start, middle and end of each world.
6. **Audio gate:** automatic instruction and replay match the current mechanic word for word; captions/text carry the same meaning.
7. **Accessibility gate:** reduced motion, contrast, focus, semantic fallback and non-audio/non-colour cues verified.
8. **Performance gate:** no input lock, stuck movement or materially dropped interaction frames on the supported low-power profile.
9. **Privacy gate:** no new data field, network call, identifier or external service without the privacy review.
10. **Child-play gate:** when observed through the
    [recurring observation programme](../research/RECURRING_OBSERVATION_PROGRAM.md),
    a child can state the goal after the instruction and recover from a first
    wrong answer without adult explanation. Agents do not run ad hoc child tests.

Automated checks prove deterministic logic and layout invariants. Browser checks prove rendered behaviour. A real iPad check remains required before claiming physical-device readiness; desktop emulation is evidence, not a substitute for the hardware.

## 11. Authoring record for each game

Every new or substantially changed game records:

- game and version;
- age/reading band;
- target construct and non-target demands;
- input methods and control map;
- level ladder;
- prompt/audio script;
- answer/distractor generator and ambiguity proof;
- feedback for first and repeated error;
- reward logic;
- reduced-motion and no-audio behaviour;
- data written or transmitted;
- named automated and browser checks;
- physical-device result when available.

If a field is unknown, mark it unknown. Do not convert an untested assumption into “pass.”

### Vertical-slice brief contract

Before a new flagship game—or a substantial change to one—moves beyond its first complete playable slice, write one machine-readable brief using `arcadeVerticalSliceBriefs.js`. The brief turns an ambitious creative prompt into an inspectable product contract. It must name the player promise, learning action, complete moment-to-moment loop, prompt and replay script, control parity, curriculum-first difficulty ladder, game-feel and forgiveness decisions, world/route rules, pause/checkpoint/completion behaviour, accessibility fallbacks, low-power behaviour, privacy footprint and the exact automated/browser/hardware evidence.

`validateGameVerticalSliceBrief()` is the structural gate. It rejects missing fields, touch targets below 56 CSS pixels, incomplete pointer-release handling, movement counted as evidence, pressure-led difficulty, undeclared identifiers/services and physical-device claims that are not explicitly `pass`, `fail` or `unknown`. Passing it means the brief is complete enough to review; it does not replace runtime, screenshot, browser or child-play evidence.

Letter Leap 2.0 is the reference brief. It records the real 0.12-second coyote window, 0.14-second jump buffer, catch-up queue, production-audio replay, checkpoint path and still-unknown physical-iPad result. `premiumGameStandard.test.js` checks the brief, named evidence files and implementation anchors so the plan cannot silently drift away from the playable slice.

### Rocket Run reference record

- **Age/reading band:** early readers practising taught initial sounds.
- **Target construct:** decide whether a spoken and printed word begins with the shown target grapheme/phoneme.
- **Non-target demands:** choose one of three lanes; hazards are supportive game pressure and never decide literacy correctness.
- **Controls:** tap left/right screen regions, swipe, Arrow Left/Right, or A/D. The game pauses for the app exit prompt, hidden tabs and WebGL context loss.
- **Level ladder:** completion-paced rounds move from common single-letter onsets towards later sounds and digraphs according to the selected difficulty. Difficulty changes the word/sound demand before hazard pressure.
- **Prompt/audio:** “Catch the [target] words.” The target is shown, spoken and replayed after the first trusted iPad user gesture; easy mode also speaks incoming words.
- **Generator/ambiguity proof:** `rocketRunRounds.js` builds unique correct words and distractors with a different onset sound; its full target set is exercised by `rocketRunRounds.test.js`.
- **Feedback:** a correct catch repeats the word and celebrates it; a wrong catch names the word and its actual onset; missed correct words return with support instead of disappearing.
- **Reward:** score, combo, sector progress and stars reflect correct catches and recovery. Cosmetic motion does not create learning evidence.
- **Reduced motion/no audio:** reduced motion selects the low rendering tier and quiets non-essential movement; all essential cues remain printed when sound is off.
- **Data:** normal local/cloud game progress only—score, stars, completed words and resumable round checkpoint. No new identifier, profile or network service.
- **Automated checks:** `rocketRunRounds.test.js`, `premiumGameStandard.test.js`, `gameCheckpoints.test.js`, and the all-games iPad activity viewport browser check.
- **Physical-device result:** unknown until the changed build is exercised on a real supported iPad; browser emulation is not recorded as a physical-device pass.

### Flagship arcade records

The thirteen records below document intended version 2.0 contracts and mechanic
decisions. Shared automated checks assert named structure, prose fields and
selected implementation anchors; they do not prove that all thirteen contracts
or mechanics work end to end, and they do not certify the games against the
composed-scene, motion, human-listening, physical-device or child-play evidence
in the Game Visual and Playability Production Guide. Only Letter Leap, Word
Climb, Word Bridge, Sound Beat and Sound Racer currently have validated
vertical-slice briefs. The records share these product decisions: progress contains only the existing
score, stars, completed-item count and resumable checkpoint; no new identifier or
network service is introduced; sound-off preserves a non-audio goal, choice and
feedback path without accidentally leaking a hidden answer; any game that
intentionally changes to model-supported reconstruction labels that support mode;
reduced motion removes or slows decorative intensity without changing the answer
rule; and a completed run ends with a scored debrief and an explicit **Back to
Arcade** action. Their shared automated coverage is `premiumGameStandard.test.js`,
`gameSurfaces.test.js`, `gameCheckpoints.test.js`, `gameAudioLifecycle.test.js`
and the all-games activity-viewport browser check. Physical-device result remains
unknown until each changed build is exercised on a real supported iPad.

#### Rocket Run 2.0

- **Age/reading band and construct:** early readers decide whether a word begins with the shown and spoken target sound. Lane steering and flight scenery are non-target demands.
- **Controls:** Left/Right or A/D, tap-side steering and swipe share one cancellation-safe release rule; focused chrome controls keep their native keyboard behaviour.
- **Level ladder and prompt/audio:** ten curriculum-ramped targets retain a visible grapheme, an approved phoneme cue and a replay action throughout each run.
- **Generator and ambiguity:** exact target-sound pools handle short vowels, hard c/g and unvoiced th; distractors use the shared phonetic-onset classifier so alternate spellings cannot become false negatives.
- **Feedback and reward:** correct catches reinforce the target sound, wrong catches name the word's real onset, and missed targets return without turning vehicle handling into literacy evidence.

#### Letter Leap 2.0

- **Age/reading band and construct:** early readers encode spoken words by collecting their graphemes in order; later levels extend to words within sentences. Platform movement is the non-target demand.
- **Controls:** Left/Right or A/D moves; Up/W/Space jumps; held touch controls use pointer cancellation and lost-capture release.
- **Level ladder and prompt/audio:** ten difficulty-led stages move from short taught words to longer words and sentence legs. A reviewed picture or recorded cue identifies the word; when neither is available, a labelled model-supported target replaces ambiguous context. Persistent slots show completed spelling and the next empty position.
- **Generator and ambiguity:** `curriculumLadder.js` supplies the ordered targets; only the next required grapheme advances the word. `curriculumLadder.test.js` exercises ladder depth and determinism.
- **Feedback and reward:** a wrong collision leaves the next slot visible; difficult stages re-enter the catch-up queue without removing completed-word evidence. Literacy stars reflect ordered spelling rather than falls or survival time.

#### Word Climb 2.0

- **Age/reading band and construct:** early readers identify which printed word begins with the shown and spoken target phoneme. Following the climber's route is a decorative, non-target demand.
- **Controls:** native word buttons support tap/click, Tab/Shift+Tab and Enter/Space; the component relies on native button activation rather than a custom pointer-capture contract.
- **Level ladder and prompt/audio:** authored onset and vocabulary sets change with difficulty while the target, exact instruction, three choices and current climb count remain visible. A 56-pixel replay control uses the current local production-audio library when available.
- **Generator and ambiguity:** `wordClimbLevels.js` supplies fresh equal-position word sets with one valid onset match; `wordClimbLevels.test.js` and `word-climb-premium.spec.js` exercise the choice, feedback, pause, checkpoint and completion contracts.
- **Feedback and reward:** a correct word names the matching onset and advances the climb; a wrong word names its actual onset while every choice and the target remain available for immediate retry. Route animation never creates learning evidence.

#### Sound Racer 2.0

- **Age/reading band and construct:** early readers choose a printed word whose beginning sound matches the target. Printed-target and audio-supported practice are distinguished in response evidence; vehicle motion never decides correctness.
- **Controls:** native word signs select a road; Drive through confirms. Left/Right or A/D selects, Space/Enter confirms when the game surface owns focus; focused native buttons retain normal keyboard activation. Decisions wait without a time limit. Touch controls meet the 56-pixel floor.
- **Level ladder and prompt/audio:** ten authored curriculum tracks retain their exact eligible target quotas. The tutorial uses a verified recorded example for the current target and a game-owned exact instruction. Muted or unavailable audio leaves printed practice usable with truthful support records.
- **Generator and ambiguity:** `soundRacerTracks.js` supplies exact-sound pools; `soundRacerMission.js` creates stable seeded forks with one valid match and two sound-distinct alternatives. The current classifier excludes soft c, silent-letter and vowel mismatches. Mission and track tests exercise every current difficulty and target.
- **Feedback and reward:** a wrong choice names its actual onset and preserves the same fork for supported retry. First responses remain immutable; stars reward deliberate first choices while independent sound evidence is counted separately. The selected barrier opens and the car travels only after a validated correct choice. Checkpoints and completion fire once per mission.
- **Presentation and recovery:** an owned authored village/vehicle kit follows one curved route model, with wheel and chassis animation, responsive quality and reduced motion. The DOM/SVG rally uses the same controller after missing assets, WebGL failure or context loss. Local pause, hidden tabs and parent overlays hold independent pause reasons. `sound-racer-rally.spec.js` and `sound-racer-lifecycle.spec.js` exercise the complete loop and recovery.

#### Word Bridge 2.0

- **Age/reading band and construct:** early readers construct words from written graphemes and reconstruct sentences from word pieces. Worked printed models alternate with fresh recorded targets when an exact cue exists. Practice remains separate from independent assessment; model exposure, actual cue delivery and assisted retries stay explicit.
- **Controls:** native piece and socket buttons use select-then-place by released touch or keyboard activation. Tab/Left/Right selects focus; Enter/Space activates. Cancelled releases do not answer. All primary controls meet the 56-pixel floor and 8-pixel separation. Compact construction scrolls inside the fixed game surface so complete words remain readable.
- **Level ladder and prompt/audio:** ten authored levels per difficulty preserve their targets. Fresh stages conceal the solution and socket ghosts until a whole recorded cue has played; Show model, muted sound or playback failure restores supported matching. Pause/exit stops detached cue and effect media.
- **Generator and ambiguity:** `wordBridgeLevels.js` supplies written-grapheme pieces (including joined units such as CH, SH, IR and NG), unique occurrence/slot IDs and sound-distinct decoys. Either unused identical token fits a compatible socket, including lower rows. Correct construction persists through a wrong-piece repair.
- **Feedback and reward:** immutable first responses retain actual target/response/correctness/support; successful assisted retries are separate. The final accepted placement fixes the result once. Carrying, crossing, Finish and replay dismissal cannot change it; a replay creates one new session. Stars use the shared accuracy rubric including mistakes.
- **Presentation and evidence:** measured native socket anchors also drive the canonical helper's carry/snap and all pals crossing to the arrival. Completed bridges persist until the learner advances. `word-bridge-lifecycle.spec.js` checks every authored target at three sizes, actual hit testing and word clipping, lower-row/duplicate placement, media cancellation, pause, resize, fallback and receipt/replay behaviour. Browser automation does not establish physical-device, human-listening or child-play evidence.

#### Sound Beat 2.0

- **Age/reading band and construct:** early readers identify and order taught phoneme, syllable and sentence-word units. Beat timing supports the action but does not replace the literacy decision.
- **Controls:** Left/Right selects among equivalent pads; Space/Enter/Up activates the selected pad, number keys choose directly, and touch commits on release. GO models the completed target.
- **Level ladder and prompt/audio:** `soundBeatTracks.js` changes the literacy unit from phonemes to syllables and sentence words before BPM. With sound on, unreached units remain masked; sound off is a labelled model-supported reconstruction mode. Approved recordings cover every live listening state.
- **Generator and ambiguity:** each beat rebuilds four deterministic but freshly positioned choices; an audited live-unit equivalence table keeps c/k/ck, ch/tch, ee/ea and w/wh out of one-right/one-wrong choices, and every hidden unit uses one fixed marker so label length cannot leak the answer. `soundBeatTracks.test.js` verifies runtime seeds, choice uniqueness, position variation, cue coverage and the ladder.
- **Feedback and reward:** a correct unit fills the next slot; a wrong choice names the selected and required units and stays available. Rhythm precision adds optional score and visual flourish but never changes literacy credit or stars.

#### Rhyme Pop 2.0

- **Age/reading band and construct:** early readers identify words sharing the cued rime. Aiming the launcher is the non-target demand.
- **Controls:** pointer/touch aims and pops; Left/Right or A/D cycles a visible, non-answer-revealing keyboard focus ring; Space/Enter/Up fires.
- **Level ladder and prompt/audio:** the cue remains printed at the launcher and can be replayed. Later levels widen vocabulary and distractor closeness rather than shrinking targets.
- **Generator and ambiguity:** `rhymePopLevels.js` builds fresh balloon sets with independently checked rhyme membership; `rhymePopLevels.test.js` verifies the banks.
- **Feedback and reward:** every popped word is named; a miss leaves the remaining rhymes in play. Only found rhymes advance progress and score.

#### Sound Safari 2.0

- **Age/reading band and construct:** early readers segment a spoken word into its ordered sounds. Moving the net is the non-target demand.
- **Controls:** Arrow keys or W/A/S/D move the net; Space/Enter catches; pointer/touch positions and catches directly.
- **Level ladder and prompt/audio:** the field guide keeps the word and next sound readable. Later levels conceal more support and introduce longer sound sequences.
- **Generator and ambiguity:** `soundSafariRounds.js` builds a fresh critter field for every step; `soundSafariRounds.test.js` checks capture order, uniqueness and presented stars.
- **Feedback and reward:** the first error names the selected sound; support increases without revealing later answers. Progress records ordered sounds completed.

#### Reel & Read 2.0

- **Age/reading band and construct:** developing readers apply word-part, meaning and morphology knowledge. Boat steering and casting are non-target demands.
- **Controls:** Left/Right or A/D steers; Space/Enter/E/Up/Down casts; drag and held touch buttons provide direct alternatives.
- **Level ladder and prompt/audio:** ten levels per difficulty mix word parts, meaning matches and morphology; ordered constructions retain visible catch slots.
- **Generator and ambiguity:** `reelReadLevels.js` proves every catch against the current rule and expected order; `gameSurfaces.test.js` exercises all three task types and distractors.
- **Feedback and reward:** a wrong fish explains why it does not fit while the clue remains. Score and stars count literacy catches, not steering precision.

#### Sentence Grove 2.0

- **Age/reading band and construct:** developing readers select the unique word or mark that repairs a sentence. Driving through the grove is the non-target demand.
- **Controls:** Arrow keys or W/A/S/D drive; Space/Enter/E cuts; touch movement and CUT controls meet the 56-pixel floor.
- **Level ladder and prompt/audio:** ten repairs per difficulty progress through capitals, end marks, vocabulary and grammar; the exact broken sentence stays printed and replayable.
- **Generator and ambiguity:** `starGalleryRounds.js` supplies one valid repair per fresh tree set; `starGalleryRounds.test.js` verifies the rounds.
- **Feedback and reward:** a wrong tree names the choice and adds a specific repair hint. Score and stars follow sentences fixed.

#### Sentence Express 2.0

- **Age/reading band and construct:** developing readers reconstruct sentence order, capitals, missing words and punctuation. Train coupling is the non-target demand.
- **Controls:** Tab/Shift+Tab moves focus; Enter/Space or tap chooses cars and repairs. All primary repair, replay, whistle and continuation controls meet the 56-pixel floor and show keyboard focus.
- **Level ladder and prompt/audio:** ten stations per difficulty add engine capitals, rusty-word repairs, missing crates and caboose punctuation while preserving the full sentence goal.
- **Generator and ambiguity:** `sentenceExpressLevels.js` creates authored, uniquely solvable trains; `sentenceExpressLevels.test.js` checks level and fault integrity.
- **Feedback and reward:** a wrong part names the fault without clearing the train. Express departures, score and stars reflect completed sentence work.

#### Spell & Skate 2.0

- **Age/reading band and construct:** early to developing readers encode a spoken word with ordered graphemes, then recognise the completed word. Skating is the non-target demand.
- **Controls:** Arrow keys or W/A/S/D skate, Space/Enter performs a trick, Shift/B boosts, and the on-screen movement, replay and action controls meet the 56-pixel floor.
- **Level ladder and prompt/audio:** ten levels per difficulty introduce single-letter spellings, digraphs, vowel teams and split digraphs before increasing movement pressure.
- **Generator and ambiguity:** `grammarGrindLevels.js` rebuilds three unique grapheme choices at every step and one correct final gate; `gameSurfaces.test.js` exercises every difficulty and repeated-error rule.
- **Feedback and reward:** the first miss teaches the contrast; a repeated miss points to the correct spelling. Score, combo and stars reflect completed word builds and recoveries.

#### SoundKeys 2.0

- **Age/reading band and construct:** developing readers map taught sounds and graphemes into ordered word-building actions while the musical layer provides expression rather than evidence.
- **Controls:** computer keyboard, on-screen keys and supported MIDI input share the same token/control contract; focused app controls are isolated from global game keys.
- **Level ladder and prompt/audio:** curriculum-led targets keep the current build state, next action and available recorded cue visible; device input never changes the answer rule.
- **Generator and ambiguity:** the existing authored target sequence and shared input providers reject unsupported tokens and keep equivalent input sources behaviourally aligned.
- **Feedback and reward:** accepted units appear in order, specific correction preserves the target for retry, and music or animation rewards do not create literacy credit by themselves.
