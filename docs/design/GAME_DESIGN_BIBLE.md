# LiteracyPath game design bible

Status: canonical product standard
Scope: every child-facing game, mini-game, world, map and game-like reward surface
Companion standards: [Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md), [Learning Policy](LEARNING_POLICY.md), [Child Surface Rules](CHILD_SURFACE_RULES.md), [Sound Seekers Release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md)

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

### Premium reference implementation

Rocket Run is the reference implementation for a visually intensive LiteracyPath game. This does not require every game to become 3D: the mechanic chooses the medium. It does require every game to reach the same level of finish in the areas that apply to it.

- The learning action and the game action are one action. In Rocket Run, steering to a word is the beginning-sound decision; the learning is not an interruption laid over the game.
- Art direction is coherent across the player, track, authored scenery, lighting, atmosphere, interface and effects. Owned production assets replace placeholder geometry when the device can render them reliably.
- Camera motion, depth, contact shadows, particles, sound and score feedback make input feel immediate without obscuring words or becoming the source of correctness.
- Touch, keyboard, audio, pause, resume, onboarding, recovery and completion are finished parts of the experience, not browser defaults around the game.
- Quality tiers reduce scenery, shadows, particles and pixel density before they reduce legibility or input response. A failed decorative asset load falls back to a complete playable scene.
- Reduced-motion mode keeps the route and feedback readable while removing non-essential intensity.
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

A game is not “ready” until all applicable gates are green:

1. **Construct gate:** objective, prompt, correct response and evidence chain documented.
2. **Ambiguity gate:** one correct answer under the shown and spoken prompt; distractors independently audited.
3. **Fresh-choice gate:** all choices rebuild after each answered item; no position or elimination giveaway.
4. **Control gate:** keyboard, pointer and touch parity; 56px targets; cancellation; safe areas; portrait and landscape.
5. **Route gate:** screenshots show player, residents, choices and gates on the visible road at start, middle and end of each world.
6. **Audio gate:** automatic instruction and replay match the current mechanic word for word; captions/text carry the same meaning.
7. **Accessibility gate:** reduced motion, contrast, focus, semantic fallback and non-audio/non-colour cues verified.
8. **Performance gate:** no input lock, stuck movement or materially dropped interaction frames on the supported low-power profile.
9. **Privacy gate:** no new data field, network call, identifier or external service without the privacy review.
10. **Child-play gate:** a child can state the goal after the instruction and recover from a first wrong answer without adult explanation.

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
