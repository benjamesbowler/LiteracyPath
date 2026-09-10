# Complete gameplay, graphics and learning upgrade plan

Status: active implementation; the full programme remains unfinished. The ledger below distinguishes delivered repairs from planned upgrades.
Scope: all 22 catalogue games (13 Arcade and nine Phonics), plus the separately routed Sound Seekers adventure. Updated with product-owner feedback on 10 September 2026.
Baseline: restored gameplay in `4c4108437`, with immediate activity access in `85598ee85`.

### Implementation ledger

- Baseline audit: `d8447fc52` was a partial five-game patch, not completion of the programme. The follow-through below repairs its racing, climbing, letter-choice and paired-word audio defects.
- First repair batch: Sentence Grove uses the committed word-image resolver; Sentence Grove and Spell & Skate have compact prompts with separate control space; Sound Beat has separate collected-letter, note-arrival and press-pad regions; narrow-screen shared chrome keeps all utility controls in one row. Local picture/content, geometry, responsive interaction, lint and build checks cover this batch. These repairs do not complete those games’ gameplay, art or content upgrades.
- Second repair batch, committed and pushed in `3dec7fb46` (implementation `dc5504348`): Rocket Run owns each approaching word clip and cancels stale loading/playback; Letter Leap uses persistent physical pickups and continuous movement; Word Climb lands on lasting higher ledges; Sound Racer shares real circuit geometry across steering, collisions and rendering. Sound Beat has timed independent pads, a shared musical clock, preserved final-word playback and a new stage. The scoped release passed 88 focused unit checks, the relevant browser progression/input checks, lint, an isolated build and repository hygiene. These are substantive mechanics repairs; final character animation, scene production and full catalogue upgrades remain unfinished.
- Recording coverage: 97 missing current circuit words generated using the existing Leda word workflow. All live circuit word gates resolve to shipped recordings in the focused coverage check. This establishes file coverage, not a pronunciation listening claim.
- Sound Seekers is owned by the separate `Plan Sound Seekers game` task (`01a08980-ad87-7082-9161-d0c046648fd8`), implementing its three-world adventure plan. This task owns the 22 catalogue games and shared integration. The adventure is handed off, not completed.
- Third mechanics batch: the nine Phonics modes now use distinct physical play stages with scoped saved work; Word Bridge has traversable construction and SoundKeys has a playable instrument. Parent integration passed 75 focused unit checks and scoped lint. Lane browser evidence covers all nine Phonics scenes and progression, all three Word Bridge ladders, and all three SoundKeys ladders with pause, retry, touch and checkpoint recovery. The isolated production build and repository hygiene passed. After the standard copy step exhausted local disk space, the exact 40,696 committed public files were packaged with hard links; no public media was omitted. The failed duplicate output was removed. These changes preserve direct play and do not claim finished character rigs or the full visual programme.
- Fourth batch: Sentence Express has three produced panorama worlds, authored rolling stock, full-size independent carriage sidings, immediate concurrent readback/travel, a shared pause-aware journey clock, partial-train resume and an accessible owned replay dialog. Separate executed checks cover the full easy route totals, all repair types, responsive inputs, current final-level replay and long-frame recovery; historical full-route failures and their fixes are retained rather than described as one green run. Sentence Grove now shares a single physical cut target between hint and action and faces the vehicle along travel. Phonics pictures stop retrying after both image sources fail. Parent also reconciled source checks with the restored engines while retaining behavioural input/save coverage. This batch passed 87 focused integration checks, scoped lint, the isolated production build and repository hygiene, and was pushed as `56e0c75c0`; the remote SHA matched. Vercel subsequently reported the matching commit READY on `literacy.guide`; the root returned HTTP 200 with its new bundle. Hosted gameplay remains a separate check.
- Fifth batch: Sound Racer’s animated canonical kart and continuous circuit scenery passed the frozen production checks and isolated build/hygiene, and were pushed as `eb4cbe79d`; the matching Vercel deployment is READY. A subsequent Letter Leap repair was pushed as `ab0b2effc` and is also READY: correct collection removes only its own object, ground springs launch independently of held jump input, and ten course layouts combine longer routes with six physical room types. A complete first course passed through real keyboard input in 2.2 minutes; separate spring, neighbouring-object, wrong-contact and 390/568px touch checks passed, along with all-curriculum terrain checks, lint, isolated build and hygiene. These changes do not complete the shared continuation or remaining long-level programme, which is still being verified.
- Remaining: continue every full per-game upgrade below. Spell & Skate, Sound Racer and Word Climb have active production lanes. The remaining character animation and scene work is still required; do not stop at the repair batches.

## 1. The requested result

Move from the feel of an educational Amstrad/NES game to a polished, console-style educational game: substantially better play, animation, environments, sound and learning depth. Preserve the recognisable game and improve what the player can do and feel inside it.

“PS3” expresses the desired leap in production quality. It is not a request for photorealism, a console port, or a new engine. The practical target is expressive book-world characters, well-produced vehicles and environments, satisfying physical interactions, varied levels and readable action on the supported browser and tablet paths. Use the medium that supports the game, with one explicit requirement: Sound Racer must have a real, fully 3D turning track and kart-style steering. A painted bend behind a straight lane simulation does not meet that request. The other games still require a substantial production leap wherever their current presentation is flat or primitive.

This plan follows the [Game Design Bible](GAME_DESIGN_BIBLE.md), [Game Visual and Playability Production Guide](GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md), [Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md), [Learning Policy](LEARNING_POLICY.md) and [Child Surface Rules](CHILD_SURFACE_RULES.md). It specifies the next work for all 22 catalogue games and Sound Seekers; it supersedes earlier upgrade proposals wherever they prescribe staged answer selection followed by a confirmation, delivery or collection button. It does not authorise implementing the upgrades merely because the plan has been written.


- Sixth repair batch: Sound Safari now uses90 authored contextual sound models with sound-distinct distractors, compact moving-creature layouts and unobstructed56px targets at1024×768,390×844 and568×320. Three final native catches after viewport changes passed; separate earlier recorded-cue/pause checks cover contextual speech. Sound Beat excludes x from its one-phoneme beat model.79 focused parent checks, scoped lint, exact committed build and repository hygiene passed. Pushed `4462102c8`; remote SHA matched and Vercel reports READY. This establishes deployment, not a hosted gameplay or human-listening claim.

- Seventh batch, local release candidate: Word Climb preserves the successful word jumps and adds long physical ascents, three route families, canonical animated Pip, persistent height/checkpoints and next/replay. Full easy traversal plus Next,16 boundary cases and32 lane units passed. Shared completion controls continue to the next difficulty or replay in place, retain pending-save recovery and fit short landscape. Sound Beat now uses48/47/42 distinct reviewed performance phrases across its10 continuous sections; all three timed-pad playthroughs exceed two minutes at normal tempo. Missing word recordings are excluded and sentence blends use a complete recording or cancellable ordered recorded words. SoundKeys further upgrades are deferred at the owner’s request to conserve usage; its current draft is excluded from this release. This batch is verified locally and awaiting commit/build/hosted status; it does not close the nine-Phonics duration lane, Skate/Rhyme/Reel/Racer outings or the complete visual programme.

### Latest feedback and required response

The owner praised Word Climb's climbing gameplay on 10 September, but completed its outing in about one minute and was returned to the Arcade. Preserve that successful physical mechanic. Across all 22 games, a level must contain at least a few minutes of real playable activity, and completion must offer next level and replay without forcing an exit. Short words, catches, families and jumps are encounters inside a longer level; renaming an encounter is insufficient. Extend terrain, routes, physical challenges and reviewed learning variety. Do not slow movement artificially, add minimum-time locks, repeat identical tasks as padding, or restore instruction/audio gates. Verify elapsed active play over a complete level, its variation on the next level, saved evidence and continuing/replaying in place.

Letter Leap additionally has two reproduced defects: correct collection removes its paired block, and ground springs are checked before ground contact is registered. Only the collected object may disappear. Springs must produce an actual launch from walking or falling contact. Its short repeated terrain must become longer courses with distinct jump routes, working springs, moving platforms, safe recovery and optional discoveries; preserve the taught word progression.

These are reported defects and requested changes, not completed repairs. The earlier engine restoration recovered gameplay; it did not deliver these upgrades.

| Priority | Surface | Required result |
| --- | --- | --- |
| Repair first | Rocket Run | Speak the moving word as it approaches the rocket, tied to its actual position; remove early spawn announcements and stale queued speech. |
| Repair first, then platformer overhaul | Letter Leap | Remove the relocating groups of three. Persistent individual letters, real authored terrain, satisfying running and jumping, exploration and checkpoints. |
| Core mechanic overhaul | Word Climb | Climb to higher ledges and remain there; ascending camera and persistent height, not a jump animation and progress counter. |
| Full racing overhaul | Sound Racer | Real 3D circuit, corners, vehicle heading, steering, chase camera, laps and road collisions. |
| Layout repair and performance overhaul | Sound Beat, also called Word Beat | Letter boxes never cover the press pads. Build a varied, satisfying musical performance. |
| Layout repair and visual overhaul | Sentence Grove | Remove the huge instruction stack; supply an actual picture where intended and keep the driving/cutting field visible. No child-facing “picture cue cat” metadata. |
| Layout repair and visual/gameplay overhaul | Spell & Skate | Free the game view from oversized text; replace crude block art with an animated skater and a produced skate environment. |
| Adventure overhaul | Sound Seekers | Restore substantial player-controlled travel, exploration and physical world interaction; stop the constant sequence of activities. |
| Build on the strongest current game | Sentence Express | Preserve its effective train/sentence mechanics while adding convincing depth, train movement, animation and world progression. |
| Preserve and polish | Rhyme Pop, Sound Safari, Reel & Read | Keep the play the owner says works. Targeted art, movement, audio and content improvements, no wholesale mechanical replacement. |
| Complete the catalogue | Word Bridge, SoundKeys and all nine Phonics games | Distinct playable designs below, not a shared quiz shell or a decorative scene behind answer buttons. |

### How the regression happened, and what prevents a repeat

The rejected design changed the core interaction contract: continuous steering, catching and performing became held choices followed by deliberate confirmation. Project notes then described those replacements as successful improvements. Those notes conflict with the restored runtime and the owner’s stated goal; this plan replaces their future direction. Technical checks can demonstrate that a replacement works as coded while missing that it no longer plays like the requested game.

The exact contribution of individual commits or authors is not established by this plan; do not invent a blame history. The demonstrable design failure is accepting reduced play as an upgrade. From now on each game has a preserved-action comparison and explicit physical-behaviour acceptance below. Regressions reported by the owner remain open until exercised and resolved; document counts and green builds cannot close them.

### Complete catalogue and implementation map

Names below come from the current catalogue and lazy imports. Paths in the implementation column are under `src/components/learn/games/games/`, unless qualified. Sound Seekers is additional scope, not counted as one of the nine Phonics catalogue games.

| Group | Game / route id | Current implementation |
| --- | --- | --- |
| Arcade | Rocket Run / `rocket-run` | `RocketRunGame.jsx` |
| Arcade | Letter Leap / `letter-leap` | `LetterLeapGame.jsx` |
| Arcade | Word Climb / `word-climb` | `WordClimbGame.jsx` |
| Arcade | Sound Racer / `sound-racer` | `SoundRacerGame.jsx` |
| Arcade | Word Bridge / `word-bridge` | `WordBridgeGame.jsx` |
| Arcade | Sound Beat / `sound-beat` | `SoundBeatGame.jsx` → `Ps1ArcadeGame.jsx` |
| Arcade | Rhyme Pop / `rhyme-pop` | `RhymePopGame.jsx` → `RhymePopArcadeGame.jsx` |
| Arcade | Sound Safari / `sound-safari` | `SoundSafariGame.jsx` → `SoundSafariArcadeGame.jsx` |
| Arcade | Reel & Read / `reel-read` | `ReelReadGame.jsx` |
| Arcade | Sentence Grove / `star-gallery` | `StarGalleryGame.jsx` → `StarGalleryArcadeGame.jsx` |
| Arcade | Sentence Express / `sentence-express` | `SentenceExpressArcade.jsx` → `SentenceExpressGame.jsx` |
| Arcade | Spell & Skate / `grammar-grind` | `GrammarGrindGame.jsx` |
| Arcade | SoundKeys / `soundkeys` | `SoundKeysGame.jsx` |
| Phonics | CVC Word Builder / `cvc-word-builder` | `CVCWordBuilder.jsx` → `ArcadePracticeGame.jsx` build mode |
| Phonics | Sight Word Memory / `sight-word-memory` | `SightWordMemory.jsx` → `ArcadePracticeGame.jsx` memory mode |
| Phonics | Blend & Build / `blend-and-build` | `BlendAndBuild.jsx` → `ArcadePracticeGame.jsx` family mode |
| Phonics | Word Rescue / `word-rescue` | `WordRescue.jsx` → `AdventureGame.jsx` rescue mode |
| Phonics | Sound Sort Factory / `sound-sort-factory` | `SoundSortFactory.jsx` → `AdventureGame.jsx` sort mode |
| Phonics | Letter Garden / `letter-garden` | `LetterGarden.jsx` → `AdventureGame.jsx` garden mode |
| Phonics | Pop the Word / `pop-the-word` | `PopTheWord.jsx` → `ArcadePracticeGame.jsx` target mode |
| Phonics | Word Hopscotch / `word-hopscotch` | `WordHopscotch.jsx` → `ArcadePracticeGame.jsx` sentence mode |
| Phonics | Sentence Fix-It / `reading-race` | `ReadingRace.jsx` → `ArcadePracticeGame.jsx` quiz mode |
| Additional adventure | Sound Seekers | `src/features/soundSeekers/SoundSeekersRoute.jsx` → `v3/SoundSeekersV3.jsx` |

### The restored games’ identities stay intact

| Game | The action to preserve | The upgrade should feel like |
| --- | --- | --- |
| Rocket Run — the game referred to as Rocket Racer | Steer a rocket and catch appropriate words during continuous flight | A responsive space adventure with spectacular, readable flight routes |
| Word Bridge | Walk, carry language tiles, place them and let the pals cross | A tactile construction platformer in a living storybook world |
| Sound Racer | Steer the racing vehicle through word gates and track hazards | A polished arcade racer where reading guides the racing line |
| Sound Beat | Tap arriving sound notes in rhythm and blend the word | A musical performance with expressive animation and satisfying timing |
| Rhyme Pop | Aim and fire at moving rhyme balloons | A lively balloon-popping arcade game with physical chain reactions |
| Sound Safari | Move a net and catch ordered sound-bearing critters | A characterful catching adventure with believable creature movement |
| Reel & Read | Move the boat, cast and catch the right word fish | A responsive fishing adventure with water, tension and discoveries |
| Sentence Grove | Drive through the grove and cut the tree carrying the repair | A playful vehicle adventure where repairing language transforms the grove |

No compulsory instruction card, demonstration, audio wait or startup countdown returns. Instructions and replay are available while input is enabled. Keep intentional game actions such as casting, placing a tile and performing the final rhythm blend; do not add a separate answer-submission stage around them.

## 2. Shared production contract

### Gameplay quality

- Preserve each game’s useful input actions. Change camera and movement where required for the expressly requested turning racer, platformer and actual climbing world. Improve acceleration, stopping, anticipation and follow-through without adding input lag. A press must affect play immediately; a cosmetic animation cannot postpone the action.
- Design an enjoyable repeatable interaction for each genre: banking a rocket, snapping a plank into place, striking a note or feeling a cast land. Give actions distinctive motion and sound rather than applying the same sparkle to everything.
- Make level variation affect movement and decisions. Recolouring the background or swapping nouns is insufficient. Introduce readable route shapes, encounter arrangements and environmental behaviours while keeping the target skill stable.
- Separate literacy demand from motor pressure. New vocabulary must not automatically mean faster objects, narrower gates and shorter reading windows at the same time. Motor assistance changes speed, attraction or tolerance; it retains the actual game.
- Keep feedback local and brief. Correct actions change the world immediately. An error names the relevant contrast and leaves a recoverable situation. Do not reset a whole word because a child handled a vehicle badly.
- Preserve pause, resumed timing, cancellation, checkpoints, replay and save recovery. Instruction removal must never become removal of essential learner protections.

### Graphics and animation

For each game, produce a coherent scene specification covering hero, materials, environment, lighting, camera, interactable objects, effects and HUD. Review existing assets in the actual scene before deciding what must be replaced. Reuse assets that fit; do not rebuild them merely to show activity.

The scene must have readable foreground, playable middle ground and background depth. Use authored silhouettes and meaningful landmarks. Literacy objects must remain recognisable against every environment and during motion. Letters cannot inherit glass distortion, aggressive bloom, tiny perspective scaling or texture blur from the decorative world.

Use the existing Meadow Pals, Dino Pals and Moonwood Tales canon and the current world mappings. Keep world appearance separate from content eligibility: changing scenery does not prove a child knows a sound. Character faces, proportions and colour markings come from current source art. Do not invent substitute mascots.

Every asset package includes the editable source, runtime export, provenance/licence, materials, scale/pivot, attachment points, collision boundary and required animation states. Transparent effects must have clean edges. Static scenery can use the existing owned-model loader; animated characters need a skeleton-safe loading/cloning path, not the static `scene.clone(true)` helper treated as a complete rig solution.

Lower quality settings reduce expensive decoration first, following the production guide. They retain the same movement, collision geometry, learning objects and controls. No low-power path may silently become a button quiz. Measure frame stability, input response, loading and repeated-entry memory behaviour on the supported devices; use current performance policy rather than inventing new numerical release gates here.

### Educational content

Every new content pack identifies its target construct, prerequisite grapheme–phoneme knowledge, accepted answers, meaningful distractors, recorded cue, image when needed, specific retry feedback and support status. Use the current curriculum and reviewed audio/word sources. Do not feed arbitrary generated vocabulary directly into a game.

Distinguish phonemes, graphemes, syllables, onset/rime, morphemes and words. A beat, tile or catch must represent the unit the prompt actually asks for. Digraphs are not automatically two sounds; `x` cannot automatically be treated as one phoneme because it is one letter. Accent-sensitive rhymes and ambiguous sentence repairs require explicit handling.

Track motor outcomes separately from learning outcomes. A missed gate may be a driving miss; a late note is a timing miss. A visible answer model describes supported practice. A guessed answer before the target audio finishes must not fabricate an audio-delivery receipt. Game scores may reward skillful play; mastery records may only claim what the task demonstrates under the existing learning policy.

### Audio and interface

Keep speech intelligible above effects and optional music, with short, game-specific sounds for actions and results. Preserve the current music defaults and opt-in settings. No new mandatory soundtrack, narration wait, timed reading overlay or repeated spoken lecture.

Maintain the current 56 CSS-pixel control floor, keyboard equivalents, focus visibility, safe areas and release-on-cancel behaviour. Test short landscape as well as portrait. In reduced motion, preserve object positions and timing while reducing camera roll, parallax and decorative movement. Colour alone never identifies a correct target.

## 3. Rocket Run

**Experience:** “I pilot a rocket through an amazing space route, steering into words that match the sound I am hunting.”

### Gameplay upgrade

Retain the current lane-steering and moving-word collection loop. Make lane changes feel responsive through a short bank, thruster asymmetry, lateral easing and a controlled settle. The collision position must follow the visible craft, and a new input must interrupt an unfinished steering animation.

Author flight sections with distinct silhouettes and rhythm: a planet approach, an asteroid corridor, a station fly-through and a comet-side passage. Start with visual route curvature around the existing lane model; do not change to unrestricted flight or add altitude controls. Mix generously spaced learning encounters with short stretches of expressive flying. Reveal each word early enough to read before the steering decision.

Add optional style rewards for smooth flight or clean hazard avoidance, separately from the learning result. Do not force a speed boost to catch a target. A missed target returns naturally later; it does not create a wrong reading answer. Correct catches power the ship or light a route beacon immediately. Wrong catches produce a soft shield response and a short onset contrast while flight continues.

### Graphics, camera and assets

Produce a finished rocket model with coherent materials, exhaust sockets, readable damage/recovery states and matching cockpit/HUD motifs. Build the route kit: asteroid variants, station entrance and exit, planet/sky layers, comet trail, navigational beacons and word carriers. Word surfaces stay camera-readable independently of their rotating carrier frames.

Camera work adds gentle look-ahead and damping, with restrained emphasis on a successful pass. Keep the horizon stable and make roll optional under reduced motion. The spectacle comes from composed encounters and authored models, not fog hiding empty space.

### Learning and progression

Keep initial-sound discrimination as the primary construct. Extend reviewed pools from familiar single consonants to taught digraphs and relevant spelling alternatives, with target-specific handling of hard/soft c and g. Do not use the first printed letter as a universal sound classifier.

Example: for /m/, `moon` is an appropriate catch; `sun` is a meaningful contrast. Catching `sun` says its initial sound and keeps the /m/ target visible. A later encounter reuses the contrast in a new arrangement, rather than repeating an identical lane pattern.

Increase linguistic complexity before combining it with a more demanding flight section. Preserve an assisted flight pace for the same content.

### Position-linked word audio — required repair

Current source calls word speech in `spawnOne`, far before the carrier reaches the rocket, and also speaks words during catch/miss feedback. Replace automatic spawn speech with an approach event attached to a specific carrier ID. Compute time to the rocket’s collision plane from current position and relative speed; use a near-encounter window that is tuned by listening during actual play. A fixed delay after spawn will drift with speed changes and is not sufficient.

Preload the relevant committed clip. Announce once when that carrier enters the near-rocket window, highlight the same carrier, and expire its cue when it passes, is removed or the run changes. Pausing suspends approach scheduling; resuming recomputes it. Boosting or changing difficulty must not leave a stale schedule. Pair spawns need readable spacing and a single nearest actionable cue; do not queue overlapping words that will be spoken after they have passed. Catch feedback must not repeat an obsolete word over the next approaching target. Target-phoneme replay remains available separately and never locks steering.

Proof: trace carrier position, relative speed, approach event and actual clip onset for normal flight, boost, lane changes, simultaneous approaches, pause and low frame rate. Listen through full runs. The audible word must match the highlighted near-rocket carrier, with no spawn-time announcement or delayed word after passage. Tune approach distance against actual clips and player reaction, rather than claiming an arbitrary millisecond constant is sufficient.

### An uninterrupted run

The rocket is controllable as the target cue begins. A clear word carrier approaches against open space; the child banks into it, hears the confirmation and sees the next beacon power on. Scenery opens into a station route, the next target appears without a modal, and a missed word returns in a forgiving position later.

### Build and prove

Primary seams: `RocketRunGame.jsx`, `rocketRunRounds.js`, shared rendering and input utilities. First improve steering and carrier readability inside the existing engine; then integrate the route kit; then expand reviewed content and authored encounters.

Acceptance: compare the same route before/after; immediately reverse a lane change; catch a word with keyboard and touch; distinguish a missed collision from a wrong onset choice; finish and resume the complete existing ladder; show the same gameplay in low quality and reduced motion. The pilot is unfinished until its normal, error, retry and completion states are as produced as its opening view.

## 4. Word Bridge

**Experience:** “I help my book friends cross a gap by carrying and building the words they need.”

### Gameplay upgrade

Preserve walking, pickup, carrying, placement and the pals’ crossing. Add a clear reach/grab animation, a carried-tile pose, a readable placement preview and a satisfying snap when the tile is placed. The preview shows where the tile will land, not whether its answer is correct. Movement remains available during carrying.

Improve walking and automatic approach so the child never gets stuck just outside pickup range. A tap on an object uses the same walk-and-interact action as keyboard play. Add compact environmental variations: a stream bridge, a broken walkway, a raised treetop crossing. Moving scenery must not make a required tile unreachable.

Let success create a physical payoff: the bridge settles, boards flex, pals cross with personality, and the next work area comes into view. Preserve existing final construction actions; do not ask the learner to confirm a completed answer again. A misplaced tile returns nearby without erasing correct placements or making the player walk a punitive distance.

### Graphics, camera and assets

Create an expressive builder animation set: idle, walk, reach, lift, carry, place, stumble/recover and celebrate. Produce compatible bridge pieces, sockets, foundations, terrain edges, water/foliage layers and crossing animations for the pals. Distinguish the tile’s printed face from its timber or material frame so text remains crisp.

Use a side-on or shallow 2.5D presentation retaining the current control plane. Add depth through layered scenery, contact shadows and lighting. Do not introduce free-camera controls or change the game into a top-down placement board.

### Learning and progression

Begin with current visible-model reconstruction, honestly labelled as supported matching. Expand to meaningful taught word families and sentence constructions. An optional later challenge can use a spoken word plus a picture instead of a printed model, but help remains available immediately and no memorise/hide/recall gate is introduced.

Match tile units to the content: a taught digraph can occupy one grapheme tile; sentence levels use word tiles and punctuation. Repeated letters need multiple real tile instances. Distractors should diagnose a plausible sound or order confusion rather than visually telegraphing the answer.

Example: carry `c`, `a`, `t` to build a bridge for the pictured cat. Later use a fresh taught CVC word with the same movement. A sentence bridge can place `The`, `cat`, `sat` in order; with a visible model, it remains reconstruction rather than independent sentence production.

### An uninterrupted run

The child starts walking while the cue plays, picks up a tile, sees its weight in the character’s pose and places it into the bridge. A wrong tile receives local feedback; the right tile stays. When the construction is ready, the existing crossing action brings the pals across, and the next gap opens in the world.

### Build and prove

Primary seams: `WordBridgeGame.jsx`, `wordBridgeLevels.js`. Implement input/range and carry-state improvements before camera and art. Add content only after tile layout supports repeated letters and different token lengths.

Acceptance: carry and replace a tile with every input method; cancel a touch without a stuck carry; use repeated letters; recover from a wrong placement without losing correct work; read every slot on short landscape screens; verify crossing collisions against the rendered bridge; preserve support metadata and full-ladder completion.

## 5. Sound Racer

**Experience:** “I steer a kart around a real 3D circuit, take corners, discover exciting track sections and drive through the words I need.” This is a full mechanical and visual overhaul. Cosmetic bends in a straight three-lane runner fail the brief.

### Gameplay upgrade

Build a coherent world-space circuit from an authored road mesh and centreline, with vehicle position, heading, speed, steering angle and road-relative recovery. Steering changes the kart’s heading and trajectory. Begin with broad left/right corners and a hairpin, then compose elevation, bridges and banked sections once handling and sightlines work. The road, barriers, gates and collision geometry share the same coordinate system.

Use auto-acceleration and forgiving steering assistance for younger players. Touch left/right and keyboard steer the same vehicle; provide a clear brake if needed. Advanced drift or boosts are optional rewards after the basic racer works, never prerequisites for a reading answer. Assisted play still follows the actual turning circuit. Recover an off-road kart at a safe recent track point, retaining completed language work.

Create laps, checkpoints, a recognisable start/finish and an optional rival pack with readable behaviour. Rivals cannot shove a child away from a required answer. Racing placement and cornering streaks are game rewards, not literacy mastery. Author forked word-gate approaches on wide, visible sections; avoid demanding new decoding during a blind hairpin. Include stretches where the player simply enjoys driving, with new scenery and optional driving rewards.

### Graphics, camera and assets

Produce a finished kart with a canonical driver, steering wheels, suspension, seated/leaning/recovery animations and readable materials. Build road edges, barriers, verges, bridge/tunnel kits, checkpoints and distinctive book-world landmarks. Use a chase camera whose heading turns with the kart, with damping, corner look-ahead and safe wall behaviour. The exit from a bend must visibly face a different direction in the world.

Create depth through actual geometry, material response, lighting, contact shadows and authored scenery. Word plaques face the useful reading direction and remain sharp on approach. Road banking and spectacle cannot tilt words into illegibility. Low quality reduces dressing and effects but retains the same 3D road, steering and collision topology.

### Learning and progression

Retain reviewed initial-sound contrasts and expand through taught prerequisites. For /sh/, an approach might offer `ship`, `sun` and `chip`; each is reachable without a hidden positional advantage. Vary gate positions and words, not just backgrounds. Separate content band from speed and steering assistance. A missed gate is a motor miss unless the child actually makes a language selection.

Tie relevant word audio to approaching gates using position-based scheduling, adapted from Rocket Run. Do not speak a gate at the far end of the track or keep narrating it after the kart has passed. Target replay remains optional while driving.

### Build and prove

Primary seams: `SoundRacerGame.jsx`, `soundRacerTracks.js`, `shared/threeShell.js`, `shared/arcadePremiumRender.js`. First make a complete drivable closed circuit with matching collisions and assistance. Then integrate finished vehicle/world assets and an entire learning/race progression. A grey test track is an intermediate engineering artefact, not delivery.

Acceptance: steer through consecutive left and right turns and a hairpin; demonstrate that continuing straight leaves the intended road; verify lap/checkpoint ordering prevents shortcut completion; recover from barriers and off-road positions; check camera heading at each corner; finish a full race using keyboard and touch. Exercise gate readability, near-encounter audio, correct/wrong/missed gates, pause, repeated entry, context loss, low quality and saved progress. A straight track with a rotating background or cinematic corner cutscene does not pass.

## 6. Sound Beat

**Experience:** “I perform the sounds of words in time and turn them into a little musical show.”

### Gameplay upgrade

First repair the reported obstruction: allocate separate bounds for the word/letter display, note approach area, hit line and press pads. Letter boxes and decorative layers cannot enter or intercept the pads. Keep controls visible and reachable at every supported aspect ratio, including short landscape. Fix the layout geometry rather than shrinking all text or placing controls over hidden notes.

Preserve moving notes, timed taps and the final blend action. Tighten the relationship between visible note position, accepted input time, sound onset and judgement feedback. Schedule rhythm against an appropriate audio clock and compensate consistently for pause; do not let animation frame rate decide a tap’s timing.

Make hits feel good: responsive pad compression, note impact, a brief character/performance response and clear timing feedback. Missing a beat brings that word back at a forgiving pace; it does not throw the player into an untimed answer-selection screen. Keep optional timing calibration unobtrusive and skippable, with a usable default.

Give tracks authored musical phrasing and playable variation: call-and-response phrases, alternating pads, short familiar motifs, phrase streaks and a satisfying whole-word finale. Let successful phrases visibly bring instruments and performers into the arrangement; a mistake softens the phrase and creates an immediate playable recovery. Vary performance and arrangement rather than increasing speed alone. Keep Sound Beat’s timing/performance identity distinct from SoundKeys’ instrument exploration.

Give tracks musical phrasing and playful visual development. Do not turn decorative beat hits into extra phonemes, or stretch a recorded phoneme to fill a musical bar. Avoid overlapping a new cue with an unfinished target word.

### Graphics, animation and assets

Produce a coherent performance-stage kit: note carriers, track surface, blend marker, hit pad, stage props, backdrops and a book-character performance animation set. Animate anticipation, strike, sustained groove, missed-beat recovery and phrase completion. Align light pulses to the music without strobing or obscuring words.

The note highway stays visually stable. Camera and background movement are subordinate to readable timing. Music-off retains the visual rhythm and any enabled target-sound cues; spoken-audio-off retains a supported visual performance without pretending the sound was heard.

### Learning and progression

Explicitly distinguish tracks practising phoneme sequences, syllables and word reading. A visible label and prompt establish the unit; do not mix these within an unannounced sequence. Audit `segmentWord` use and the authored track data before expanding content, especially digraphs and letters representing multiple phonemes.

Example: a taught CVC track presents the three sounds of `cat`, then the blend action says the whole word. A syllable track uses a reviewed syllable division and is recorded as syllable/rhythm practice. Accuracy of tapping alone is not independent decoding evidence.

Progress by familiar patterns, new taught word structures and longer musical phrases. Tempo increases remain a separate performance challenge, not a hidden literacy level.

### An uninterrupted run

The first notes arrive with readable lead-in space while input is already active. The child taps, sees an immediate response and blends the word. The performance develops into the next phrase. An early or late tap gets a timing cue and a playable recovery, with no spoken instruction lock.

### Build and prove

Primary seams: `SoundBeatGame.jsx`, `Ps1ArcadeGame.jsx`, `soundBeatTracks.js`. Keep the rhythm engine isolated from generic practice controls. Verify scheduling and pause before adding more music and animation.

Acceptance: prove letter boxes never overlap pad bounds and real touches reach every pad at each viewport; complete varied phrases rather than one repeated dull pattern; reproduce early, on-time and late inputs; pause over a note and resume without a false miss; verify target audio does not overlap; retain the final blend action; exercise slower recovery; test actual tablet speaker/touch timing as well as automated clocks; confirm performance records never claim unsupported independent mastery.

## 7. Rhyme Pop

**Owner assessment: currently works quite well. Preserve its existing feel and core mechanics; apply targeted polish and content improvements. Do not rebuild it simply to match the scale of weaker games.**

**Experience:** “I aim at drifting word balloons and burst the ones that rhyme.”

### Gameplay upgrade

Keep aiming, firing, moving balloons and physical pops. Improve the relationship between aim point, projectile, hit area and visible impact. Add readable balloon bobbing, gentle wind lanes, launcher recoil and fragments that clear promptly. The child should feel a successful shot without waiting for a result panel.

Design balloon formations with purposeful gaps, different approach patterns and recoverable missed shots. Correct balloons can cause decorative ribbon or confetti chains, but chain effects must not silently answer neighbouring balloons or award learning credit for untouched words.

Missed shots leave the target available. Wrong-word hits name the word and compare its ending with the target, then provide another chance. Keep a gentle assistance option for aiming and movement; it must still involve shooting balloons.

### Graphics and assets

Build a launcher with aim/fire/recover states, a coordinated balloon-and-ribbon family, readable printed word panels, pop/deflate effects and a layered festival setting matched to the current worlds. Vary shapes and colours without correlating them with correct answers. Avoid a stock particle explosion that masks the remaining choices.

Use camera depth and foreground scenery around a stable aiming plane. Text remains upright enough to read; wind animation moves balloons without whipping their letters around.

### Learning and progression

Broaden from familiar spoken rhymes to reviewed rime contrasts and misleading spelling similarities. Examples: `cat` and `hat` rhyme; `cat` and `cap` share an onset but do not rhyme. Later `blue` and `shoe` demonstrate rhyme across spellings if within the taught vocabulary band. Accent-sensitive sets must have explicit accepted variants or be omitted from automatic judgement.

Mix fresh targets and spaced revisits, not identical arrangements. Do not require a fixed “collect all six” basket flow that turns the play into a checklist. Authored encounters can contain different numbers of valid targets, with truthful remaining-target progress.

### An uninterrupted run

The launcher is live, the target word plays and balloons drift into view. A shot bursts a matching word and ripples the festival decorations. A wrong hit gets a concise audible contrast while other balloons remain playable. Fresh formations enter without a ‘Next basket’ stage.

### Build and prove

Primary seams: `RhymePopArcadeGame.jsx`, `rhymePopLevels.js`. Improve hit/aim feedback and spawn fairness first; then art and formation authoring; then reviewed content expansion.

Acceptance: compare aim and hit locations at each viewport; show readable words during motion; test missed shots, wrong words and supported retries; confirm decorative chains cannot generate extra answers; validate every rhyme family and distractor; complete the full run with pointer and keyboard aiming.

## 8. Sound Safari

**Owner assessment: currently works quite well. Preserve its existing feel and core mechanics; apply targeted polish and content improvements. Do not rebuild it simply to match the scale of weaker games.**

**Experience:** “I move my net around a lively habitat and catch the sounds of the word in order.”

### Gameplay upgrade

Retain free net movement and catching of sound-bearing critters. Improve net tracking, a visible anticipation-and-scoop action, forgiving capture volume and immediate catch response. The net cannot visually touch a critter while the hidden hit area says it missed.

Give critters distinct, readable movement: perching, short hops, broad loops and brief pauses. Variation must not make the next required sound permanently evasive. Keep a recoverable target available and prevent off-screen spawns or clusters covering one another.

Correct catches travel into the field guide’s ordered positions; the creature is gently released as the word is completed. A wrong catch releases promptly, names the selected sound and leaves completed positions intact. Add habitat discoveries and character reactions as rewards without adding a confirmation after each scoop.

### Graphics and assets

Produce a cohesive critter family with idle, travel, evade, catch and release states; a net with visible rim/depth; habitat foreground/background layers; and a readable field-guide HUD. Give moving creatures character through silhouette and animation, while keeping the sound label distinct from their bodies.

Build habitat changes from useful landmarks, water/foliage movement and lighting. Do not place required critters behind decorative reeds, under HUD controls or in visually unreachable scenery. A low-quality habitat retains authored simplified art and the same net play.

### Learning and progression

Audit the current grapheme-based segmentation before describing it as phoneme segmentation. A `sh` spelling can represent one phoneme; a word such as `fox` requires handling /k/ and /s/ even though `x` is one grapheme. Until the representation and recorded cues support a case accurately, exclude that case from the relevant phoneme mode rather than score it incorrectly.

Progress from reviewed simple sound sequences to taught digraphs and consonant clusters, with explicit mapping between a caught sound and its spelling. Spoken word, picture and optional print provide access; visible completed/target models remain supported practice. Do not increase creature speed merely because the word is longer.

### An uninterrupted run

The word is cued as the child moves the net. They scoop the next sound, see it settle in the field guide and immediately move to the next critter. A wrong catch explains the selected sound without clearing the guide. Completing the word creates a release animation as the next word’s habitat activity begins.

### Build and prove

Primary seams: `SoundSafariArcadeGame.jsx`, `soundSafariRounds.js`, current grapheme/phoneme and audio sources. Resolve unit mapping and capture geometry first; implement creature states and habitat art next; expand only validated word sets.

Acceptance: exercise the full net route on touch and keyboard; cancel a pointer without a stuck scoop; capture near visible edges; prove all required sounds remain reachable; test repeated sounds and digraphs; distinguish motor misses from incorrect sound selections; verify every content unit against its recording and displayed spelling.

## 9. Reel & Read

**Owner assessment: currently works quite well. Preserve its existing feel and core mechanics; apply targeted polish and content improvements. Do not rebuild it simply to match the scale of weaker games.**

**Experience:** “I steer my boat, cast into moving schools and reel in the word fish I need.”

### Gameplay upgrade

Keep the existing boat movement and cast/catch action. Improve cast anticipation, hook trajectory, water entry, line tension and reeling payoff. Use generous, predictable catch windows. Do not add a mandatory second timing mini-game that causes a correctly chosen word to be lost after the learning decision.

Let schools move through readable water lanes, with fish behaviour and gentle currents producing variation. Show the word while there is still time to plan a cast. A missed cast returns quickly; required fish recirculate. Accepted word parts stay on the boat rather than being lost after a steering error.

Give the run a fishing-adventure structure through changing shores, small discoveries and a growing completed-catch display. The boat remains useful to play; it must not become decorative scenery behind stationary answer buttons.

### Graphics and assets

Produce a finished boat with movement/casting/reeling states, fishing line and hook rig, fish animation family, shore/dock kit, water surface, wake, ripples and splash effects. Word labels remain above water distortion and sufficiently stable during a fish’s movement.

Use a clear waterline and visible relation between hook and catch volume. Reflections, caustics and particles are quality-tier decoration, not necessary clues. Keep different fish silhouettes independent of answer correctness.

### Learning and progression

Preserve the current word-part, meaning and morphology modes and make their goals visually distinct. Compound tasks combine meaningful parts; morphology tasks use reviewed bases and affixes; meaning tasks have a clear pictured or spoken context. Do not describe compound parts as phonemes or syllables.

Example: cast for `rain` then `bow` to build `rainbow`, with the whole word and appropriate meaning context. A later taught morphology task builds a plural from a base and its ending. Audio support for a target-reading task must be reflected in the evidence rather than used to claim unaided reading.

Choose distractors from plausible part/order/meaning confusions. Validate the complete construction, including changes in spelling where applicable. Avoid affix combinations that look possible but are not valid words in the intended task.

### An uninterrupted run

The child steers as the target cue plays, sees a useful fish enter the casting area and casts. The line tightens, the fish comes aboard and its part fills a visible position. The next school is already moving. A wrong fish receives feedback and returns to the water without an answer-confirmation screen.

### Build and prove

Primary seams: `ReelReadGame.jsx`, `reelReadLevels.js`. Stabilise hook/fish alignment and catch lifecycle before water polish; then add route/school variation and reviewed content packs.

Acceptance: test missed casts, correct and wrong catches, ordered parts, interrupted reeling and resume; compare hook/fish geometry with rendered contact; verify required fish always recirculate; preserve accepted parts through motor mistakes; prove all three content modes and all existing difficulty ladders.

## 10. Sentence Grove

**Experience:** “I drive through a living grove and choose the tree that repairs the sentence.”

### Gameplay upgrade

First repair the reported unusable composition. Replace the oversized instruction stack with one compact sentence, its focused gap and a small replay control. Keep the route, vehicle, answer trees and cut control visible together. Repeated “choose…” and “hear sentence again” prose must not dominate the field. Use accessible labels on compact icon controls instead of printing their full descriptions across the game.

Resolve the intended picture through the current asset registry: show a real, recognisable cat image when the item calls for that context. “Picture cue cat” is authoring metadata and must never be visible child copy. Validate required image availability with the item; an essential missing picture is a content defect to resolve, not a reason to print its name. Omit an optional absent illustration cleanly without changing the answer’s meaning. Reserve bounded image space; do not let image loading move the controls.

Preserve driving, steering and the cut action. Improve acceleration, turning radius, stopping, tool anticipation and the physical response of the chosen tree. The cut registers from the input action; the subsequent animation does not delay or duplicate judgement.

Arrange repair trees in compact clearings connected by visible trails. Add route variety, readable obstacles and shortcuts for enjoyable driving, without putting the correct answer consistently nearest to the starting point. Every answer tree must be reachable with each input method.

Make the repaired sentence change something tangible in the grove: a trail sign is restored, a bridge receives its missing text, or the clearing comes to life. Correct work changes the world immediately. Wrong cuts identify the selected word/mark and the relevant rule; keep the sentence and a recoverable tree available. Avoid multi-page explanations and repeated confirmations.

### Graphics and assets

Produce the current vehicle/tool as a coherent animated asset with drive, turn, brake, cut and recovery states. Build tree/trunk/leaf variations with readable answer plaques, coherent trails, landmarks, roots, bridges and a restrained cutting/restoration effect set. Keep decorative leaves and fragments away from the sentence and answer text.

Use a stable, readable overhead or three-quarter camera retaining the current movement interpretation. Framing should include the sentence, nearby route and repair choices without demanding camera manipulation. The grove’s geometry and painted paths must agree.

### Learning and progression

Retain the current sentence-repair focus: capitals, punctuation, word choice and grammar, sequenced by taught prerequisites. Preserve repairs already made to accepted-answer logic. Short, concrete pictured contexts precede longer or subtler language demands.

Example: a clear telling context supports `The cat is asleep__` with a full stop. Do not infer a unique punctuation answer from an ambiguous line such as `Stop__` without specifying the intended utterance. Grammar and word-choice alternatives must be checked in the whole sentence; more than one defensible repair means accept the alternatives or rewrite the item.

Feedback should explain the actual error: “A telling sentence ends with a full stop,” rather than “Wrong tree.” Replay provides the relevant sentence without turning listening into a start gate. Keep model-supported and independent responses distinct under current policy.

### An uninterrupted run

The child drives into a clearing while the sentence cue plays, reads its persistent short sentence, approaches a tree and cuts. The correct word or mark joins the sentence and the clearing changes. They drive onward immediately. A wrong choice leaves a clear, local opportunity to repair the same sentence.

### Build and prove

Primary seams: `StarGalleryArcadeGame.jsx`, `starGalleryRounds.js`. Improve vehicle/tool response and route composition before replacing scenery; then add tangible restoration states and the reviewed sentence ladder.

Acceptance: reproduce the owner’s cat-starter item and the longest sentence at portrait/short-landscape sizes, with real picture support and the entire usable game field; prove the prompt cannot cover trees or controls; cut using touch and keyboard; verify tool/target contact, camera visibility and route reachability; exercise every repair type and accepted alternative; retain the displayed sentence through error recovery; show that driving speed never converts a correct repair into a wrong language result.

## 11. Letter Leap

**Experience:** “I run, jump, explore and collect letters through a proper platform adventure.” The Mario-style reference means responsive platforming and designed levels, with original project characters and worlds.

### Gameplay upgrade

Remove the forced three-choice relocation system. Current code creates three offset choices per decision and uses `refreshChoiceGroup`, recovery centres and `reserveLetterLeapChoiceLane` to move groups and clear terrain. Replace that behaviour with persistent, individually placed letter pickups and authored platform geometry. Correct or wrong contact cannot teleport the other letters in front of the character or remove surrounding obstacles.

Build running acceleration, reliable stopping, variable-height jumps, forgiving jump buffering and edge tolerance. Tune them together against actual play. Levels need platforms at different heights, gaps, springs, moving platforms, safe lower routes and optional discoveries. Teach each new movement through forgiving terrain while the player remains in control. Coins and exploration reward platform skill separately from spelling.

Letters belong to a place in the level. Guide the learner toward a word’s next useful letter without turning every platform into a row of three answers. A wrong letter gives local sound feedback; already collected letters stay collected. Use a reachable authored retry loop or later pickup, not dynamic terrain deletion or a group chasing the player. Checkpoints restore the character and collected-word state consistently. Optional backtracking and camera bounds must work together.

### Graphics and learning

Replace crude blocks with a coherent terrain kit, animated canonical hero, expressive running/jumping/landing states and layered scenery. Keep platform edges and collisions legible beneath foliage and shadows. Animation must follow the physical jump, not fake movement around a stationary actor.

Progress through taught word structures, with repeated letters represented by separate pickups and grapheme units explicitly authored. Spoken word/picture support is available during motion; it does not pause the level. Correct collection shows the growing word in a compact HUD. Longer words receive longer or richer routes, not unavoidable speed pressure.

### Build and prove

Primary seam: `LetterLeapGame.jsx`, its current curriculum/word source and platform collision/input helpers. Replace choice-placement/recovery first, then build complete level routes and integrate art.

Acceptance: record every uncollected letter’s world coordinate before and after correct, wrong and missed pickups; those positions and terrain remain unchanged. Complete a level with genuine jumps, lower/upper routes, a checkpoint and retry using touch and keyboard. Prove repeated-letter words, platform landings, backtracking and camera tracking. Three answer tokens moving as a group fail even if the character animation improves.

## 12. Word Climb

**Experience:** “I climb a tall living world, choosing useful words to reach new ledges and the summit.”

### Gameplay upgrade

Replace the current mostly static stage: the progress-derived `--wc-rise` only changes by a small screen offset, with an `isClimbing` animation. Build actual world height, grounded/airborne/clinging states and solid ledges or holds. A successful move lands at a higher world coordinate and stays there when the animation finishes. The camera follows upward, leaving earlier platforms below.

Give the player a choice of reachable next holds through direction/jump or an accessible destination tap driving the same physical simulation. Word labels belong to ledges, not detached answer buttons. Include short climbs, branching shelves, a resting platform, moving vines introduced safely and visible summit landmarks. Reachability comes from the movement model, not arbitrary answer indices.

Wrong choices produce a local slip to a nearby safe leaf or allow a corrected route; do not discard the whole climb. A motor fall cannot become a wrong reading response. Checkpoints retain the last safe ledge and learning progress. Avoid placing the correct word consistently highest, nearest or most brightly coloured.

### Graphics and learning

Create a finished climber with reach, grip, pull, jump, landing, rest and recovery animation; a beanstalk/cliff kit with believable ledges, vines and layered altitude scenery. Keep readable word faces independent of leaves’ decorative motion. The visual progression should show roots, canopy and summit as real sections of the ascent.

Keep the current reviewed word-climb learning ladder from `wordClimbLevels.js`, auditing each level’s stated skill and distractors before expansion. Early climbs use familiar taught words and generous ledges; later climbs add linguistic contrasts and route variety separately. Optional spoken support is recorded as support and never delays movement.

### Build and prove

Primary seams: `WordClimbGame.jsx`, `WordClimbGame.css`, `wordClimbLevels.js`. Introduce the persistent climbing simulation and camera before art integration; retain semantic input over the same world state.

Acceptance: after several successful landings and after animations end, the hero is still progressively higher in world space. Old platforms remain below, camera rise matches world rise, and a complete summit is reachable. Test wrong holds, motor falls, checkpoint resume, different word lengths and all input modes. A rising percentage, bobbing sprite or scrolling background without persistent landings fails.

## 13. Sentence Express

**Experience:** “I build and repair a working train, then see it travel through a rich railway world.” The owner regards this as the strongest game; preserve its successful sentence and train interaction.

### Gameplay upgrade

Keep the existing coupling, sentence construction/repair and departure actions. Improve dragging or tapping carriages so placement has clear physical intent, predictable snapping and reversible mistakes. Animate couplers joining, carriages settling, wheels turning and the locomotive responding. The train must remain manipulable through feedback; no narration wait or extra confirmation after the existing meaningful departure action.

Develop railway yards with different arrangements, sidings and destinations. Sentence completion drives a tangible journey: the train leaves a yard, passes an authored landmark and reaches a new station. Keep language choices in a clear working area; scenery and travel should support the strong puzzle rather than replace it with driving controls. Let subsequent puzzles vary construction and repair demands, not repeat the same slide with different text.

### Graphics and learning

Use a produced train kit with proper volumes, materials, wheel/coupler motion, station depth, track perspective, passengers and restrained steam or lighting effects. Use a staged 2.5D or 3D yard with a readable working view and an animated departure camera; avoid flat rectangles sliding over a backdrop. The lowest quality scene retains the moving railway and carriage manipulation.

Sequence familiar short sentences into richer taught structures. Ensure punctuation attaches to the correct token, repeated words have separate instances, and alternative grammatical orders are accepted where appropriate. Spoken replay and optional pictures support meaning without revealing an answer that is then scored as independent. Train length expands without shrinking words or blocking controls.

### Build and prove

Primary seams: `SentenceExpressGame.jsx`, `SentenceExpressArcade.jsx`, `sentenceExpressLevels.js`. Capture the existing strongest flows first; improve train manipulation and world transitions incrementally.

Acceptance: complete the current construction and repair modes before/after with identical input capability. Exercise repeated words, longest trains, wrong coupling, undo/recovery, departure and resume. Show continuous wheel/coupler/camera movement through a full journey, not only attractive stills. No improvement may destroy the existing puzzle clarity.

## 14. Spell & Skate

**Experience:** “I skate through a beautiful park, collect the spelling I need and land satisfying runs.”

### Gameplay upgrade

First remove the reported huge text panel. Keep a compact target word or short objective and optional replay above a separately bounded skating field. The skater, upcoming obstacle, learning object and press controls must be visible simultaneously. Long content must reflow within its reserved region, never grow over the route.

Audit and retain the current useful steering/skating actions in `GrammarGrindGame.jsx`, then strengthen momentum, jumping, landing and obstacle recovery. Build authored park sections with ramps, bowls, rails and open learning approaches. Add optional skill routes and forgiving assisted movement. A reading/spelling encounter cannot require a difficult trick to validate a correct choice. Distinguish trick rewards, motor misses and language responses.

Completing a word changes the run physically: a route opens, a ramp lights or the skater reaches a new park section. Mistakes give local correction and another reachable opportunity without a worksheet overlay. Do not add tricks until basic skating feels responsive and the field stays readable.

### Graphics and learning

Replace the reported NES-like blocks with a coherent animated skater/board, shaped skate terrain, finished surface materials, lighting, contact shadows and authored background landmarks. Include push, coast, turn, crouch, jump, land, grind where supported, stumble and recover. Board contact and collision must match ramps; particles cannot substitute for the missing animation.

Inspect `grammarGrindLevels.js` against the child-facing Spell & Skate name. Make each existing spelling or grammar mode explicit and validate its real construct; do not silently score grammar as spelling. Extend taught patterns with plausible distractors and word-level meaning context. Keep longer words readable and give them adequate travel time independently of trick difficulty.

### Build and prove

Primary seams: `GrammarGrindGame.jsx`, `grammarGrindLevels.js`. Repair HUD bounds first, prove a satisfying complete skate section second, then integrate final art and full content progression.

Acceptance: demonstrate the previously obstructed view and longest objective on short landscape and portrait; perform normal skating, jumps/landings, correct/wrong collection and recovery with touch and keyboard. Compare finished skater and terrain in motion against the crude baseline. A large text box over better blocks fails.

## 15. SoundKeys

**Experience:** “I play sounds on an instrument and turn them into words and little performances.”

### Gameplay upgrade

Give keys immediate visual depression, audible response and an expressive performer reaction. Keep free experimentation available between guided phrases. A guided sequence lights the next meaningful region without covering the instrument; a child can play before or during its cue. Retain supported keyboard, touch and MIDI input with consistent note/target mapping.

Create short call-and-response and word-building performances, with distinct instrument voices and arrangement changes as rewards. This game emphasises selecting and combining sounds; Sound Beat owns the rhythm challenge. Do not add mandatory timing judgement to SoundKeys or treat arbitrary musical notes as phonemes. Errors retain the phrase and enable an immediate retry.

### Graphics and learning

Build a coherent instrument and animated book-character stage. Keys need depth, tactile travel and clear labels; fingers/effects cannot obscure them. Performance rewards can animate band members or stage props while keeping the instrument layout stable. Longer labels use planned key faces, not tiny type.

Map each language task to reviewed phoneme/grapheme or word units and committed clips. Where a key is a musical pitch, label and record that as music play rather than literacy evidence. Progress from familiar supported phrases to fresh taught sequences; completion and mastery remain distinct.

### Build and prove

Primary seams: `SoundKeysGame.jsx`, `src/features/soundkeys/content.js`, `engine.js`, `inputProviders.js`, `soundkeys.css`. Preserve the current instrument/input contract while improving response, production and content.

Acceptance: play repeated notes, rapid changes and held/released input; recover after pointer cancellation, focus loss and MIDI disconnect; verify no stuck sounds or duplicate attempts. Show touch/keyboard parity and actual MIDI evidence where available, readable keys at supported sizes and a complete guided performance plus free play.

## 16. CVC Word Builder

**Experience:** “I build a word with physical letter pieces and make something happen in my workshop.”

### Gameplay upgrade

Turn the build interaction into tactile assembly: pick up a piece, carry or drag it, preview its destination and snap it into a real slot. Tap-select/tap-place remains an equivalent accessible action. Make wrong placement immediately reversible while correct pieces stay. Duplicate letters must be separate objects. Completing the word assembles or activates a recognisable pictured object in the workshop, then opens the next build without a Check screen.

Add varied workbench arrangements and optional construction discoveries while keeping letters easily reachable. The game’s pleasure comes from handling and making things; it does not need a forced timer or unrelated jumping wrapper.

### Graphics and learning

Create a finished workbench, letter pieces, slot frames, tools and builder animation with depth, shadows and responsive material motion. The pictured result needs a real asset, not its name inside a box. Keep word faces crisp and controls outside the build area.

Progress through taught CVC contrasts and carefully reviewed word sets. Keep a spoken/pictured target, with optional printed model recorded as support. Sound feedback follows the actual grapheme/phoneme mapping; a completed visible-model copy is not independent spelling. Retry feedback identifies the misplaced unit rather than merely shaking the whole word.

### Build and prove

Current seams: `CVCWordBuilder.jsx`, build mode and `BuildGame` in `ArcadePracticeGame.jsx`, its imported content banks. Extract only presentation/interaction that must become distinct; retain validated content and result ownership.

Acceptance: build, replace and complete several fresh words using touch and keyboard; exercise duplicate pieces, interrupted drag, replay and sound-off support. Show the assembled object’s payoff during playable progression. A row of buttons with new workshop wallpaper fails.

## 17. Sight Word Memory

**Experience:** “I explore a beautiful card table, remember where words are and uncover matching pairs.”

### Gameplay upgrade

Preserve intentional memory-game turns: selecting two cards is the game, unlike an imposed confirmation around a racer. Cards have stable positions, immediate selection, clear flip motion and generous viewing time. A mismatch turns back predictably; a match remains visible or moves into a compact collection without reshuffling the remaining board. Optional pair-count and reveal support alter difficulty without imposing audio waits.

Add small board layouts, themed collections and character reactions. Let progress reveal an illustrated scene or collection through matches. Avoid auto-flipping unseen cards, flashing all answers before play or forcing a spoken lecture between pairs.

### Graphics and learning

Produce tactile cards with readable faces, coherent backs, table depth and restrained flip/settle animation. Match effects do not obscure other cards. Focus order and accessible card state follow the stable board.

Use reviewed high-frequency words with taught regular parts and explicitly supported irregular parts. Do not claim that remembering two identical visual shapes proves decoding. Optional word audio is support, available on demand or at reveal without blocking the next valid action. Word-to-picture variants require genuinely unambiguous pictured words and a separate matching contract.

### Build and prove

Current seams: `SightWordMemory.jsx`, memory mode/`MatchGame` in `ArcadePracticeGame.jsx` and its board generator. Keep the game-specific memory state independent from generic round transitions.

Acceptance: finish boards with matches and mismatches, rapid double taps, pause during a reveal and resume. Verify remaining card positions never shuffle, audio never overlaps into unrelated pairs, and longest words remain readable. Retain a calm playable option; visual polish must not increase memory load accidentally.

## 18. Blend & Build

**Experience:** “I combine sound and word-family pieces to build a growing collection of things.”

### Gameplay upgrade

Make onset/rime or other explicitly selected units into pieces that physically join, with an immediate blend payoff. Allow exploration of valid combinations, a clear target challenge and reversible swaps. Keep the family base stable while the player tests a new onset; do not replace every action with a fresh multiple-choice card.

A successful construction adds an object to a small workshop or town scene, providing a reason to keep building. Variation comes from new families, construction arrangements and discoveries. A wrong combination gives a specific contrast and leaves the pieces manipulable. No extra submit step after the physical join.

### Graphics and learning

Create compatible unit pieces with clean text surfaces, satisfying join motion, a book-world builder and distinct pictured completed words. Keep the result picture and assembled print connected visually; no generic identical reward for every noun.

Use reviewed onset/rime families and taught graphemes. Label the units accurately: a rime is not necessarily a phoneme. Audit generated combinations for real words and suitable meaning; include irregularity only with explicit teaching support. Spoken blending and printed models are recorded as assistance. Maintain fresh examples so the game is not solved by position memory.

### Build and prove

Current seams: `BlendAndBuild.jsx`, family mode/`FamilyGame` in `ArcadePracticeGame.jsx` and its imported word-family source. Preserve the validated generation contract while giving the mode its own construction scene.

Acceptance: complete a family, swap an incorrect onset, build a fresh family and resume with previous constructions intact. Verify all accepted combinations and images; exercise long units, sound-off, touch and keyboard. The joined pieces and resulting world change must be directly visible.

## 19. Word Rescue

**Experience:** “I travel to help a stranded friend, using the right words to build a way through.”

### Gameplay upgrade

Expand the current rescue/plank progression into a compact traversable rescue route. The learner moves a helper, fetches a word-bearing plank or tool and uses it at the obstacle. Correct choices build usable geometry and bring the friend closer to safety. Include safe paths, short carrying sections and optional discoveries; allow destination taps to perform the same movement for accessibility.

Space learning actions with meaningful travel and rescue animation. Wrong tools return nearby with specific feedback; already built route sections remain. The finale is the actual friend crossing/reaching safety while the player sees the consequence, not a score dialog substituting for rescue.

### Graphics and learning

Create expressive stranded/helper characters, carry/use animation, coherent river or ravine terrain and sturdy constructed pieces. Show the reason help is needed without threatening punishment. Water and scenery support readable route boundaries.

Keep reviewed word-recognition targets and make the support condition explicit: matching a spoken or printed target is supported recognition. Meaningful distractors must not be distinguishable solely by plank size or colour. Introduce fresh words and rescue layouts separately from motor difficulty.

### Build and prove

Current seams: `WordRescue.jsx`, rescue mode in `AdventureGame.jsx` and its `RescueStage` consumer. Add real movement/build geometry without changing the persistence contract shared with other modes.

Acceptance: move, retrieve, place, cross, recover from a wrong tool and complete a rescue using each input mode. Check interrupted carrying and checkpoint recovery. A stationary row of word buttons that increments a decorative bridge counter fails the planned upgrade.

## 20. Sound Sort Factory

**Experience:** “I run a lively little sorting machine, sending sound objects along the right routes.”

### Gameplay upgrade

Make the conveyor and sorting mechanism playable. Items travel into a readable work area; the player diverts or physically drags each into a sound chute. Give switches and machinery immediate motion and let sorted items visibly become a finished output. Keep generous spacing, a slow/manual-feed option and a recoverable return belt for mistakes.

Add route arrangements, machine modules and production goals that change interaction. Avoid a new question overlay for each object. Machine decoration continues while the learner considers an item; the game must not force fast reading to keep up with a hidden timer.

### Graphics and learning

Create conveyors, rollers, gates, containers, expressive machinery and coherent materials. Input and collision regions match the visible chute mouths. Labels stay attached to the correct item and cannot be hidden by moving machinery.

Audit current classification: the runtime records printed orthographic-grapheme support. If a round asks for sound, classify by reviewed sound, not first-letter coincidence. Use accurate spoken cues/pictures for the intended construct and meaningful contrasts. A print-based sorting round remains honestly labelled. Separate production speed from literacy accuracy.

### Build and prove

Current seams: `SoundSortFactory.jsx`, sort mode in `AdventureGame.jsx`, `SortStage` and its content source. Preserve correct/wrong return state while replacing button-only interaction with a coherent conveyor simulation.

Acceptance: divert correct and wrong items, retrieve a returned item, pause mid-belt, resize and resume with stable identity. Prove no item becomes unreachable or answers itself at timeout. Test classifications, sound-off support, touch cancellation and full production completion.

## 21. Letter Garden

**Experience:** “I change a word’s letter and watch my garden transform.”

### Gameplay upgrade

Build a small interactive garden where the player carries a letter seed to a word bed, replaces the intended unit and sees a distinct plant or pictured object grow. Keep unchanged letters physically stable. Make planting, watering and exploration enjoyable, but do not require repetitive watering taps after every correct answer merely to advance.

Offer garden plots, discoveries and short movement between beds. A wrong seed can be lifted back out with useful contrast feedback; completed growth persists. The next task appears in the garden, without an instruction card replacing the scene.

### Graphics and learning

Produce a gardener, seed packets, soil/bed kit and animated sprout-to-grown states with coherent lighting and foliage depth. Word plaques remain readable beside the garden, never buried under plant growth. Use distinct reviewed pictures where words need meaning support.

Preserve the current one-unit word-change construct. For example, a reviewed `cat` to `hat` item changes the initial unit while retaining the others. Check every source/target pair, change position and audio mapping. Expand initial, medial and final contrasts according to taught prerequisites; do not introduce unsupported multi-letter transformations accidentally.

### Build and prove

Current seams: `LetterGarden.jsx`, garden mode in `AdventureGame.jsx` and its garden-stage/content consumers. Keep correct source letters and response evidence while implementing tactile planting and a persistent garden.

Acceptance: plant, replace, retry and grow several target words; exercise repeated letters, different change positions, pause and sound-off support. Verify growth never covers required labels and movement mistakes cannot change a literacy answer. A flower appearing behind unchanged answer buttons is insufficient.

## 22. Pop the Word

**Experience:** “I spot and pop the word I am hunting in a lively target field.”

### Gameplay upgrade

Use a responsive target field with readable movement, direct popping and immediate physical feedback. Maintain enough separation and dwell time for the target word; required objects recirculate if missed. Add playful formation changes, gentle trajectories and a collected-discovery goal. Keep deliberate static/slow assistance available over the same field.

Make wrong pops local and recoverable; the current target stays available. A missed tap or object leaving the screen is not a reading error. Keep this recognisable as word hunting, while Rhyme Pop remains the aiming/projectile rhyme game.

### Graphics and learning

Produce finished target carriers, layered scenery and short pop/release animations. Text remains camera-readable and is not distorted by squash effects. Use sufficient contrast and stable letter shapes throughout travel; no confetti over remaining words.

Continue reviewed word recognition with clear target support. A spoken word hunt and a printed matching hunt carry different support evidence. Select plausible visual/phonological distractors, vary positions and include fresh examples. Increase vocabulary challenge separately from speed or field density.

### Build and prove

Current seams: `PopTheWord.jsx`, target mode/`TargetGame` in `ArcadePracticeGame.jsx` and its target generator. Give target motion and hit testing one shared source of position.

Acceptance: pop visible edge targets using touch/keyboard navigation, recover after wrong and missed actions, finish multiple formations and pause mid-motion. Verify labels and hit areas align, target recirculation works and long words never overlap. New target artwork alone does not establish improved play.

## 23. Word Hopscotch

**Experience:** “I hop along word stones to make a sentence and reach a new part of the playground.”

### Gameplay upgrade

The current route uses sentence mode, so make that purpose explicit. Put word tokens on persistent hopscotch stones and let a destination tap or keyboard action send the character through a real jump to the selected stone. Correct sequence choices build the sentence and advance the route. Landing remains visible and persistent; avoid recreating Word Climb’s jump-and-reset defect.

Use short paths, branches, stepping patterns and small optional discoveries. A wrong stone provides local sentence feedback and a safe return, retaining prior correct words. Physical jump timing is assisted by default so sentence reasoning remains accessible. The next sentence extends the path without a giant written prompt.

### Graphics and learning

Create a finished playground/garden path, shaped stones, character anticipation/jump/land animation and layered surroundings. Clearly show reachable destinations and the growing sentence without covering the path. Camera movement follows real progress.

Use coherent short sentences, reviewed grammar, repeated word instances and explicit punctuation handling. Accept valid alternative orders where context permits. Visible-model reconstruction is supported practice; a later spoken/pictured construction task requires separate content validation rather than merely hiding the model.

### Build and prove

Current seams: `WordHopscotch.jsx`, sentence mode/`SentenceGame` in `ArcadePracticeGame.jsx`, current sentence banks. Keep content correctness while replacing detached word selection with destination-driven hopping.

Acceptance: complete sentence routes, select a wrong stone, retry, use repeated words and resume on the correct landing. Show stable stone positions and real forward movement. Test short landscape, long sentences and alternate valid constructions. A hopping animation over a stationary multiple-choice card fails.

## 24. Sentence Fix-It

**Experience:** “I repair broken sentence signs and bring a little place back to life.” The current title is Sentence Fix-It; its historical route ID remains `reading-race`.

### Gameplay upgrade

Make repair direct and tactile: locate the broken word or mark, pick up a replacement tool/token and apply it to the sign. The corrected sentence immediately changes the place it describes—a shop sign lights, a gate opens or a character understands the message. Do not add a separate Check step after applying the repair.

Use a small repair trail with varied objects and concise objectives. Wrong replacements stay recoverable, with the affected unit highlighted locally. Keep the sentence visible while allowing short exploration and movement between repairs. Avoid duplicating Sentence Grove’s driving/cutting or Sentence Express’s carriage construction.

### Graphics and learning

Create authored signs, physical replacement pieces, repair animation and a characterful neighbourhood scene with depth. Keep sign text on stable readable surfaces; camera flourishes cannot obscure the edit. The repaired state should visibly persist in the world.

Audit existing quiz/fix items and preserve only unambiguous, taught repairs. Sequence capitals, punctuation and word-level grammar using explicit context; accept every defensible answer. Feedback explains the changed rule with short speech/text support while input remains available. Do not infer independent grammar knowledge when a model already provides the repair.

### Build and prove

Current seams: `ReadingRace.jsx`, quiz mode/`FixGame` in `ArcadePracticeGame.jsx` and its fix-item generator. Give the mode a specific repair scene while retaining validated learning and result boundaries.

Acceptance: perform each repair type, apply a wrong replacement, undo/recover and revisit the repaired object. Check longest sentences, all accepted alternatives, sound-off support and touch/keyboard equivalence. A decorated quiz card is not the finished repair game.

## 25. Sound Seekers — restore the adventure

**Experience:** “I explore a large world with my book friends, run and jump through places, discover things and use sounds and words to solve problems along the way.” This is additional to the 22 catalogue games.

### Diagnosis and scope

The owner reports that most gameplay has disappeared and activities occur constantly. The percentage is their experience report, not a measured telemetry result. The active route imports `v3/SoundSeekersV3.jsx`; it manages trail/encounter modes, mission beats and return-to-trail transitions. Work must inspect that live route, not patch an unused older engine or point to an attractive disconnected preview.

The [current Sound Seekers bible](../SOUND_SEEKERS_RELEASE_BIBLE.md) continues to own curriculum, progress, lifecycle and accessibility. This plan supersedes older presentation/pacing prescriptions where they produce the reported activity-heavy experience. Keep the canonical chapter/stop teaching sequence; restore an adventure around it rather than treating each teaching beat as the entire game.

### Gameplay overhaul

Make exploration a substantial part of each chapter: player-controlled movement, branching local paths, platforming, objects to carry/use, characters to approach, environmental discoveries and meaningful return routes. Optional routes give game rewards, not fabricated literacy evidence. Story progress still follows the authored curriculum, with motor assistance retaining the same explorable places.

Learning encounters occur at authored places reached by the player. Do not automatically open another activity because the previous answer was completed. After solving a problem, return control immediately and give a real stretch of travel or world interaction before the next required encounter. A cooldown alone is insufficient if the child merely waits beside a stationary activity button.

Use learning as the action inside the world: collect and fit sound-bearing bridge pieces, steer a raft toward a word landing, carry a key that matches a taught sound, or repair a message for a character. Each mechanic needs its own physical affordance and level design. Keep a few focused puzzles where appropriate, but do not route every encounter through an identical card panel.

For a representative chapter, author a continuous journey: leave a character’s home, explore a fork and optional discovery, cross a safe platform section, meet a friend at a broken crossing, collect/use the relevant sound objects, cross the repaired structure and continue through a distinct area. There must be meaningful play both before and after the teaching action. Extend that standard across every current chapter and stop, not just the first Seedwake slice.

### Pacing specification and proof

Create an encounter map per chapter showing travel paths, discoveries, movement challenges, teaching objectives, recovery and exits. Log time in player-controlled traversal, physical puzzle interaction, detached activity panels, passive travel and mandatory non-interactive states. Inspect continuous playthroughs, not isolated activity clips.

Acceptance requires substantial uninterrupted sections where the child chooses movement and interacts with the world; no back-to-back forced activity transitions and no travel that consists only of an automatic cutscene. Tune route lengths and encounter frequency through actual play, preserving learning coverage across the journey. Do not invent a universal seconds-per-question quota or claim the reported 90% has been restored without a comparable baseline.

### Graphics, sound and educational content

Produce coherent book-world chapter kits, recognisable canonical characters with full locomotion/interact states, meaningful landmarks and readable depth. The requested leap cannot be fulfilled by enlarged pixel tiles or static illustrated slides. Choose authored high-resolution 2.5D or 3D presentation per actual mechanic; maintain one curriculum/progress system across quality settings.

Characters speak briefly while the child remains able to act. Ambient audio, action sounds and optional music support exploration without masking taught phonemes. Encounter prompts are small, image-backed where needed and embedded beside the relevant object. There is no instruction-listening gate on entry, retry, chapter handoff or resume.

Preserve taught prerequisites, accepted alternatives, independent/support distinctions, first attempts and review scheduling. Wrong answers teach a specific contrast and leave a playable recovery. A missed jump is a motor event. Completing a chapter is narrative progress, not automatic mastery. Review items should appear in suitable later world encounters rather than forcibly inserting a worksheet after every action.

### Build and prove

Primary seams: `src/features/soundSeekers/v3/SoundSeekersV3.jsx`, `render/mapScene.js`, `render/encounterScene.js`, `content/trail.js`, `engine/director.js`, `engine/challenges.js`, canonical `src/data/questSequence.js` and current storage. Preserve learner progress and migrate only when a verified schema change is necessary; never reset a journey to simplify a new renderer.

First reproduce and trace the current activity/travel sequence. Build a complete chapter journey with responsive movement, physical encounters and finished art; then extend the authored route grammar and content coverage to all chapters. Verify entry, free movement, encounter entry/exit, optional exploration, wrong-answer recovery, save/reload, chapter transitions and final completion. Low quality and accessible movement retain an actual world journey. A beautiful map between constant slide activities fails.

## 26. Work packages and delivery order

This programme covers 22 catalogue games plus Sound Seekers. Complete games and journeys are the endpoint; a pilot is a production checkpoint, not a scope reduction. The urgent defect package does not need to wait for a shared rendering framework.

| Package | Concrete output | Completion condition |
| --- | --- | --- |
| A. Reported blockers | Rocket Run approach audio; Sound Beat unobstructed pads; Sentence Grove real picture/compact HUD; Spell & Skate compact HUD; Letter Leap stable pickup positions | Reproduce each report and show the same route usable after correction; no claims that these repairs alone deliver the full upgrades |
| B. Missing gameplay | Letter Leap complete platforming levels; Word Climb persistent climbing; Sound Seekers substantial playable travel and physical encounters | Real movement and world progression verified over complete routes; no teleporting answer groups, fake climbing or constant forced activities |
| C. Sound Racer flagship | Complete real 3D turning circuit, kart handling, camera, produced art and race/content progression | Full keyboard/touch race through real corners with matching collisions and readable word gates |
| D. Weak presentation/performance | Sound Beat varied musical performance; Spell & Skate finished skating world; Sentence Grove produced driving/repair world | Controls remain clear; full routes show stronger physical play, animation, depth and valid learning |
| E. Strong foundations | Sentence Express richer railway production; Word Bridge tactile construction; SoundKeys responsive instrument production | Existing strengths preserved and specific genre improvements demonstrated |
| F. Conservative polish | Rhyme Pop, Sound Safari and Reel & Read | Owner-valued play retained; focused content/audio/art improvements with before/after comparisons |
| G. Nine Phonics games | All nine distinct designs in sections 16–24, with their full content ladders and supporting states | Each playable identity demonstrated; no common worksheet interaction replacing the named genre |
| H. Fleet and journey completion | Complete catalogue, Sound Seekers chapters, cross-game input/audio/layout/persistence and quality coverage | Every named defect resolved in implementation; all planned games complete; evidence distinguishes browser, listening and physical-device observations |

Sound Seekers’ scope is large: begin its pacing/mechanics work with package B and continue chapter production until complete. Do not declare the adventure finished after one good chapter. Similarly, repairs in A can ship independently of later art work once verified. Avoid speculative shared-framework work before a concrete game needs it.

Within each package, work in this order:

1. Reproduce the existing game and capture the actions to preserve. Inspect the current branch and runtime; never use an abandoned rewrite as the starting point.
2. Specify the experience, controls, content boundaries and target frames. Target frames must include normal play and mistakes, not just a promotional opening.
3. Improve interaction in the existing engine and validate it with real input. Placeholder engineering work is intermediate only.
4. Integrate finished art, animation, camera and sound into a representative complete level. Compare the same moments with the baseline.
5. Complete every current level/route, planned content pack and supporting state. A single attractive scene is not a finished upgrade.
6. Run focused content, interaction and lifecycle checks; exercise the actual rendered game. Record direct visual, listening, browser and physical-device evidence separately.
7. Review the scoped diff, preserve unrelated work, then release the complete game under current repository policy. Verify the deployed version and a live launch/action path.
8. Remove temporary outputs and disconnected replacement code after confirming references. Keep required provenance and regression evidence in their designated locations.

### Implementation boundaries

The runtime remains selected through `src/components/learn/games/games/index.js` and the current game catalogue. `GamePlayer.jsx` continues to own full-screen, audio preferences, quit/recovery and result delivery. The named per-game files own their distinct simulations and presentation. The corresponding content utilities and the current practice-mode banks own existing generation and answer logic. Sound Seekers retains its separate route, director, curriculum and progress ownership. Shared practice modes may be separated where a distinct game needs its own simulation; do not rewrite all nine simultaneously merely because they share a file.

Reuse proven input, timing, resource loading, rendering and audio lifecycle where there is a real second consumer. Do not extract a universal ‘choose, submit, next’ game loop. Do not migrate engines, add a paid asset service, replace the entire art library or rewrite persistence without a demonstrated need and the applicable existing authority.

### Immediate-access rule across the whole learning journey

The instruction rule also covers assessments, Cycles, workshops and other activities outside the game roster. Inventory entry, retry, next activity and resume states. Controls are usable while instructions play; replay is optional and cancellation/failed audio cannot leave input disabled. Preserve intentional pause and an explicit user-requested help view, but no compulsory tutorial, countdown or “listen first” barrier. Record actual audio delivery honestly when a child responds early. Check these shared flows again after audio/HUD changes, without expanding this plan into an unsolicited redesign of assessment content.

## 27. Acceptance: prove an upgrade in all three dimensions

For every game, retain a compact comparison showing:

- **Gameplay:** the preserved action performed before and after; the specific improvement in response, physical feedback, level variation and recovery; no input lost to narration or decorative animation.
- **Graphics:** matching gameplay states showing improvements in character/vehicle, materials, environment depth, lighting, motion and interface readability. A still image alone cannot establish animation or game feel.
- **Learning:** the actual skill, a valid example, a plausible wrong choice, specific feedback, a fresh retry and accurate support/audio evidence. A larger bank alone cannot establish better learning content.

Exercise fresh storage, sound on/off, optional music, reduced motion, the declared quality tiers, keyboard and touch, short landscape and portrait, held/released/cancelled input, pause, hidden tab, resize, loading failure, repeated entry, correct/wrong/missed actions, completion, save failure and recovery. Use existing policies for device targets and thresholds. Report unperformed physical-device/listening observations as such rather than presenting automated tests as their substitute.

The upgrade fails if it removes useful physical play, ignores an explicitly requested overhaul, blocks play for instructions, reduces a low-power path to worksheets, makes text hard to read in motion, hides content errors behind effects, or claims mastery from reflexes. A technically green build does not overrule those failures.

### Scope and cost control

Finish and evaluate one game before propagating a technique across the fleet. Generate or commission assets from an agreed asset specification with explicit runtime use; do not create large speculative asset batches. Extract shared systems after successful use, not in anticipation of every imagined genre. Run focused verification during iteration and the required wider checks once per stable release batch.

Keep a small ledger per package: preserved mechanics, proposed changes, delivered assets, implemented content, verified states and remaining work. Count implementation and proof, not token expenditure, generated screenshots or new code volume. If an approach damages play, correct it in the isolated work rather than publishing it and treating a later rollback as progress.
