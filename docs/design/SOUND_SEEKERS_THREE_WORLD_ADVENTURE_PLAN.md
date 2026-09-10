# Sound Seekers: the three-world adventure

Status: proposed product and production plan, 10 September 2026. Requested deliverable: a detailed plan, not an implementation or runtime cutover. This proposal does not activate a new curriculum, evidence policy or save format. The current route and product bibles remain authoritative until implementation adopts and reconciles the replacement.

## 1. The game we should make

Choose a recognisable Pal, explore their world, meet friends with concrete problems, and solve those problems through short, substantial 2D platform adventures. Reading, listening and spelling determine what the player builds, rescues, finds and changes. Each completed mission leaves a visible consequence in the land. The player has freedom over nearby destinations and optional discoveries, while new learning follows an explicit prerequisite sequence.

The proposed full campaign contains **three worlds, 30 stages and 150 main missions**, designed for approximately **20 hours of first-time play**. A further **60 optional quests** provide extra discovery and practice; they do not pad the main campaign estimate. Those are production scope proposals, not assertions about existing content or mandatory mastery thresholds.

Use clean, animated, book-faithful 2D characters and layered 2.5D scenery. Keep the playable plane clear. The ambition is the cohesion, variety, independent child playability and sustained progression associated with Teach Your Monster to Read, with our own characters, settings, missions and art.

## 2. What exists, what changed, and what to recover

### Source review boundary

Reviewed the working source at `5cd190712`, the current route and v3 renderer/director/progress, the older v2 game before the v3 cutover, the earlier Quest root before the v2 cutover, relevant history and current standards. Also fetched `origin/main` at `58d016660` and inspected its Sound Seekers and game-standard differences: instruction-completion gates have been removed, and the latest broader upgrade plan explicitly restores substantial exploration and continuous gameplay. This proposal incorporates those changes. This is source-grounded planning, not a fresh full playthrough, physical-device test or visual-quality certification. No particular historical revision is assumed to be the user's preferred version without evidence.

| Version or source | Verified foundation | Treatment in this plan |
| --- | --- | --- |
| Earlier Quest, before `dd524409a` | `QuestRoot.jsx` imports creature selection, world/trail views, equipment, chapter rewards, free-roam review, checkpointing and established progress utilities. The eight-chapter blueprint describes varied geography and persistent repairs. | Recover the adventure ambitions and selectively reuse tested systems. Do not restore the old UI, generic creature identity or old defects wholesale. Source presence is not proof that every intended feature worked well. |
| v2, introduced by `dd524409a`, before `32d8cb7aa` | `SoundSeekersGame.jsx` composes CampaignMap, teaching, mission planning, stage rendering, character customisation, journal, rewards and evidence/checkpoints. | Reuse validated content and learning contracts where compatible. The later v3 plan documents card-heavy presentation; that historical critique is not a new visual audit. |
| Current v3, introduced by `32d8cb7aa` | The real route imports `SoundSeekersV3`. Three lands, four map panels, 40 stops, three playable heroes and book-character encounter lines are present. The encounter renderer implements walking/jumping and different objects for hunt, sorting, forge, bridge, lantern and story tasks. | Keep recognisable lands/cast, selected usable art and speech, and real movement foundations. It would be inaccurate to say the current runtime has no platform movement. Expand its level and mission design substantially. |
| Current progression/director | `isStopUnlocked` requires the previous stop. The director follows a mostly fixed teaching/practice/heart-word/review/story order with an eight-scored-beat cap. Rooms are constructed by mechanic. | Replace the single-next-stop progression with a stage graph. Author complete missions with distinct layouts and consequences, rather than increasing the number of repeated activity rooms. |
| Current curriculum | `questSequence.js` supplies 40 teaching anchors; the eight old chapters offer useful destinations. | Preserve identifiers and review content. Decouple teaching anchors from the number of locations. Crosswalk them to the current EL cycle and high-frequency-word authorities before using them for independent practice. |
| Current storage | v3 stores local progress and queues `phonics_quest` sync. Its normalizer accepts version 3 and otherwise creates fresh progress; its local event log is capped at 600. | Explicit migration, evidence retention and account-switch testing are necessary for a longer game. Do not assume legacy saves migrate or that this local log is a complete reporting ledger. |

The right direction is to recover the **exploration, character attachment, visible repairs and sense of a journey**, then build enough real game around them. A wholesale rollback would recover old limitations along with useful work.

The standards also need reconciliation when implementation begins. The current Sound Seekers bible correctly identifies v3 ownership but retains older pixel/3D wording and a legacy mastery reference; the older world blueprint prescribes eight chapters and a 3D avatar. The current v3 has its own progress/director. The curriculum matrix also repeats numerical mastery rules. Do not copy these conflicting descriptions into a fourth authority: resolve them against live consumers and the current learning/reporting policies in the cutover change.

## 3. What to borrow from the benchmark

Teach Your Monster's official material describes a progression from letter–sound work through blending, segmenting and increasingly purposeful reading. Its mini-game catalogue includes jumping, building, herding, climbing, aiming and instruction-following. These are useful examples of changing the action while maintaining the learning purpose. This is a reference for design properties, not evidence that our game currently matches its quality.

Borrow four properties: a character the child owns emotionally; a coherent journey; several genuinely different physical actions; and literacy that has a reason inside the story. Avoid copying characters, distinctive levels, artwork or branded rewards. Grammar, broader vocabulary and our three-world open exploration are our proposed scope, not claims about the comparator's exact feature set.

Sources checked on 10 September 2026: [official game coverage](https://www.teachyourmonster.org/teachers/helpful-articles-for-teachers/what-does-each-game-cover/) and [official mini-game catalogue](https://www.teachyourmonster.org/teach-your-monster-to-read-mini-games/).

## 4. Player identity and story

Offer **Speedy, Bouncy, Woolly, Splashy, Clucky and Muddy** from Meadow Pals, plus **Chompy** and **Pip**, as the proposed eight launch heroes. The current three-hero selection is the starting point, not the finished roster. All eight must have complete movement/action animation and be usable through all three worlds. None is paywalled or mechanically better at literacy.

Character identity affects gait, expressions, greeting and cosmetic flourishes. It does not affect jump reach, evidence, answer availability or access to lessons. Bouncy can have a springy jump animation, for example, but another Pal must reach the same platform. Switch heroes at a camp without resetting progress. Clothing layers must preserve the canonical silhouette and coexist correctly; a small backpack, hat and scarf collection is enough initially.

This campaign explicitly proposes a **travelling-Pal crossover**. A brief departure/arrival establishes why the chosen visitor is in another land. Residents, buildings, physics and permitted magic retain their home-world rules. This needs a campaign canon record before final art; permission to travel does not make Moonwood magic appear in the farm. When the chosen hero is normally a mission giver, an authored substitute resident gives that mission, with reviewed alternate dialogue and staging. Never spawn the same Pal as both player and resident.

Working story: **The Pals' Great Journey**. The communities are preparing to visit one another, but local routes and plans need help. Meadow prepares its paths and picnic; Sunny Hollow restores its valley routes and supplies; Moonwood reconnects its lantern trail and observatory. Small problems introduce larger shared projects. Each world resolves its own story before the next opens. The final gathering shows the actual rescued friends and repaired landmarks.

Use concrete causes: a washed-out bridge, misplaced deliveries, muddled signs, a fallen ladder. In Moonwood, define a magical object's rule before asking the child to apply it. Do not blame every problem on a vague stolen-sounds spell.

## 5. Freedom within learning structure

Each stage is a compact explorable neighbourhood, with landmarks visible from the hub, loops, short branches, a return shortcut and residents doing something. Main missions open a dedicated side-view level at that location. Finish and return to the same place, now changed. The camera transition should make geographical sense.

Give the child control while dialogue/instructions play. Teaching is available inside the action; no compulsory listen-to-finish card, demonstration or countdown gates input. After a repair, return movement immediately and provide a real stretch of travel, discovery or physical interaction before the next required encounter. Do not automatically open another activity after each correct answer. The timing budget includes this playable space inside missions as well as the hub time; a cooldown or passive walk animation is not exploration.

Each stage has four regular main missions, one main finale and two optional quests. After a short arrival/tutorial, normally two or three appropriate main destinations are available. The child chooses their order. A prerequisite unlocks a new teaching mission when needed; review and oral-language missions can often be chosen alongside it.

The stage graph should have parallel work rather than four sequential locks. Example: arrival opens a listening delivery and a sound-tile garden; their shared taught code then supports either a bridge build or tree rescue; the completed repairs enable the stage finale. At least two meaningful route choices should survive beyond the opening stage. This is a proposed level-design acceptance rule, not a reporting gate.

Keep three states separate:

- **Story:** which bridge, route or resident problem is resolved.
- **Teaching access:** which code/language has been introduced, including the child's teacher-confirmed cycle when applicable.
- **Evidence:** what the child independently demonstrated and what still needs support/review.

Supported success can repair the bridge and advance the story. It cannot create mastery. A later mission can offer an easier supported path while scheduling a fresh independent probe. Do not trap a child for days at a story gate waiting for longitudinal evidence. Conversely, finishing a story does not silently unlock untaught independent decoding demands.

Previously explored areas remain accessible. Show one suggested destination through a resident gesture or short spoken cue, with two other understandable choices. No quest spreadsheet for the child. Optional discoveries yield world details, keepsakes or cosmetic items, never prerequisites for the next lesson. Add camp-to-camp fast travel after the first visit, so backtracking does not become padding.

## 6. Campaign length: an auditable 20-hour budget

| World | Regular main missions | Stage finales | Exploration, meetings and transitions | Target total |
| --- | --- | --- | --- | --- |
| Sunny Meadow Farm | 40 × 4.5 minutes = 180 | 10 × 9 minutes = 90 | 60 minutes | 330 minutes / 5.5 hours |
| Sunny Hollow | 40 × 6 minutes = 240 | 10 × 9 minutes = 90 | 60 minutes | 390 minutes / 6.5 hours |
| Moonwood | 40 × 7.5 minutes = 300 | 10 × 12 minutes = 120 | 60 minutes | 480 minutes / 8 hours |
| Full main campaign | 120 missions / 720 minutes | 30 finales / 300 minutes | 180 minutes | **1,200 minutes / 20 hours** |

Meeting dialogue inside a mission belongs to that mission's time; the exploration column counts only hub activity outside missions. No double-counting. The 30 finales are included in the 150 main missions. The optional 60 quests, at roughly four to six minutes each, add approximately four to six hours and are excluded from the 20-hour claim.

These are first production estimates, not measured duration. Later missions are longer because they contain several connected decisions and consequences, not because the child waits longer or sees more tutorial screens. Regular missions need internal rest/checkpoints so a child can stop during a longer encounter. A normal session is around 10–20 minutes, usually one or two missions; completing a stage is not required in one sitting.

Measure active play separately from pause, loading, inactivity and repeated recovery. Pilot timing must include learners with different reading and motor confidence. Track first-play mission duration, help, retries, quit/resume and mandatory traversal. Review both the typical playthrough and the spread; do not promise every child exactly 20 hours. If the full campaign is materially short, author richer missions or additional main content. Never enforce a timer, lock a quick reader out, or require grinding to reach the advertised duration. Nor does 20 hours of play promise mastery of the full curriculum.

## 7. The three worlds and 30 stages

The stage names below are proposed game locations or adaptations of existing landmarks. They require the normal canon/location review before art. Existing stop IDs are **curriculum/provenance crosswalks**, not automatic placement equivalences. World-book labels A/B/C are not EL assessment results.

### World 1 — Sunny Meadow Farm: help the farm get ready

Warm daylight, ponds, barns, hedges, vegetable patches and an oak canopy. Early sound awareness, taught letter–sound correspondences, simple blending/encoding, oral vocabulary and short instructions. Independent print expands only with taught code; grammar begins through concrete spoken actions.

| Stage | Resident problem and setting | Main play identities | Existing anchor |
| --- | --- | --- | --- |
| 1. Hollow Tree | Muddy's bath kit is scattered around the tree. | Explore, choose sound tiles, find by spoken description; finale restores the bath corner. | s1 |
| 2. Fern Steps | Woolly's bedding has blown up the hillside. | Low climbing, sound sorting, carry-and-place; finale prepares a cosy shelter. | s2 |
| 3. Rook Stones | Clucky needs help returning an egg and clearing the nest path. | Stepping-stone choices, ordered builds, listen-and-place; finale reconnects the nesting area. | s3 |
| 4. Otter Ford | Splashy's pond crossing has washed away. | Build and cross bridges, choose landing tiles, position objects; finale safely guides the chicks across. | s4 |
| 5. Bramble Gate | Bouncy's picnic route is tangled and broken. | Vine-clipping targets, grapheme construction, short delivery loop; finale opens the picnic clearing. | s5 |
| 6. Beehive Bluff | Brave cannot get the supplies back down the hill. | Gentle hoist, climbing, read-and-carry; finale lowers a supply basket. No bee combat. | s6 |
| 7. Lily Ferry | Giggly's ferry cargo is on the wrong banks. | Sound-group routing, raft navigation, listening delivery; finale runs the ferry service. | s7 |
| 8. Fishpool Reach | Hungry's picnic order is muddled. | Food vocabulary, short spoken instructions, build/read labels; finale sets the right places. | s8, cumulative |
| 9. Wheelhouse Bend | Cuddly is stranded above a broken wheelhouse ladder. | Real tree/ladder ascent, digraph word building, gear placement; finale brings Cuddly down. | s9 |
| 10. Singing Weir | Noisy needs the water route and picnic signals working. | Three linked repair actions using previously learned mechanics; finale opens the farm gathering and departure route. | s10 |

Stage 1 splits the existing four new targets into short teaching encounters; it does not introduce them all on one crowded screen. Example early print can use already-taught `a, m, t, s` for `am`, `at`, `mat`, `sat`, only after their constituent code is available. A chick-rescue story can be narrated before the printed word `chick` is decodable; never pretend those are the same task.

### World 2 — Sunny Hollow: reconnect the valley

Rounded prehistoric forms, fern gullies, caves, stone ledges, water channels and a practical repair settlement. Expand blending and spelling with adjacent consonants, taught alternative values and split digraphs; develop sentence order, descriptors and multi-step listening. Existing forge/train landmarks must be reviewed against the prehistoric world canon before retaining their industrial treatment; use coherent wood/stone mechanisms if needed.

| Stage | Resident problem and setting | Main play identities | Existing anchor |
| --- | --- | --- | --- |
| 11. Amber Ridge | Sunny's trail signs point supplies the wrong way. | Aim at the word sign, route delivery, build route markers; finale reconnects the ridge. | s11 |
| 12. Rattlebones | Dozy's shelter parts are mixed with loose stones. | Sort cargo, assemble words, position beams; finale builds the shelter. | s12 |
| 13. Ash Flats | Zippy's parcels are scattered along split paths. | Branching platform delivery, word retrieval, sentence instructions; finale completes a delivery loop. | s13 |
| 14. Fern Canyon | Wiggly needs a safe crossing for the valley picnic. | Counterweight bridge, word-climb, listening sequence; finale escorts the group. | s14 |
| 15. Claw Pass | Bossy's route-building plan has missing steps. | Read-and-order actions, route levers, precision-assisted aiming; finale opens the pass. | s15 |
| 16. Gearworks Gate | Honky needs the signal mechanism repaired. | Sort words by the taught value of y, build parts, relay instructions; finale tests the signal. | s16 |
| 17. Ore Hopper | Dino Grumpy's supplies have been delivered to the wrong places. | Meaning-based cargo routing, sentence construction, review; finale restores the store. | s17, cumulative |
| 18. Plate Foundry | Fancy's sign-making workshop has mixed-up labels. | Split-digraph builds, target selection, sentence repair; finale labels the route correctly. | s18 |
| 19. Night Train Yard | Cheeky has mixed up the convoy's message boards. | Couple sentence carts, follow directions, word retrieval; finale sends the convoy correctly. | s19 |
| 20. Word Forge | Dino Shy notices the last pieces missing from the valley crossing. | Combine construction, delivery and reading; finale reunites the supplies and opens the next journey. | s20 |

Adjacent consonants are segmented as separate phonemes; a written cluster such as `st` must not be taught as one new sound. Review old metadata labels, including sound-count treatment of `qu`, `x` and `nk`, rather than trusting a historical `kind` string. Alternative spellings are practised in a word context when a bare-sound choice would have more than one correct answer.

### World 3 — Moonwood: reconnect the lantern trail

Moonlit but readable woodland, luminous streams, roots, coast, gardens and an observatory. Broader vowel patterns, morphology, longer words and purposeful connected text. Grammar and vocabulary become increasingly central: tense, pronoun reference, conjunctions, precise descriptions and causal language. Speaking/listening access remains available without being counted as independent reading.

| Stage | Resident problem and setting | Main play identities | Existing anchors |
| --- | --- | --- | --- |
| 21. Reedlight Landing | Wren and Burrow need a route through the reeds. | Build a floating crossing, follow a spoken route, decode labels; finale opens the landing. | s21–22 |
| 22. Mica Steps | Flint and Luna need a safe illuminated stair. | Vertical climb, vowel-pattern sorting, instruction reading; finale guides a traveller through. | s23–24 |
| 23. Mirror Fen | Glimmer needs the correct paths reflected in the fen. | Evidence-based route choice, word aiming, sentence meaning; finale repairs the mirror route. | s25–26 |
| 24. Shellhaven | Spark's supplies are scattered around the shore. | Contrasting word sorts, boat deliveries, recipe sequencing; finale restores the workshop. | s27–28 |
| 25. Thunder Lighthouse | Luna's harbour signals and instructions are muddled. | Aim-and-light targets, read route instructions, cargo matching; finale guides boats home. | s29–30 |
| 26. Mothlight Gate | Fern needs the garden-to-root path reopened. | Word construction, sound-pattern sorting, light-path navigation; finale restores the garden route. | s31–32 |
| 27. Wispwood Turn | Stone cannot carry supplies through the narrow forest route. | Read precise directions, bridge engineering, comparison language; finale finds a route suited to Stone. | s33–34 |
| 28. Sleeping Observatory | Luna and Flint need to recover the observatory's missing parts. | Climbing, clue reading, word-part builds; finale reopens the dome. | s35–36 |
| 29. Aster Archive | Wren's messages describe the wrong times and actions. | Contextual pronunciation, morphology machines, tense/sentence repair; finale restores usable instructions. | s37–38 |
| 30. First Reading Star | All three communities need a final clear route to the gathering. | Read clues, construct and deliver, choose a justified route; finale reconnects the skybridge and resolves the campaign. | s39–40 |

Moonwood contains 20 old teaching anchors across ten larger stages, so its time budget is deliberately larger. Distribute these targets across the four missions, with teach/review/application spacing; do not squeeze two old stops into one unbroken tutorial. If the detailed curriculum crosswalk shows overload, redistribute introductions and main mission content before production. Protect the total campaign scope and honest timing.

## 8. Twelve actual mini-game families

Share physics, input, audio and evidence infrastructure. Each family owns a different action loop, spatial arrangement, camera and visible result. A basket and a lantern that both ask for the same button click are not automatically two different mechanics.

| Family | Physical play and learning decision | Meaningful variants | Error and motor recovery |
| --- | --- | --- | --- |
| Sound Steps | Walk/jump to a tile representing the heard sound or target word. Selection commits at an intentional landing/action. | Ground stepping stones; two-height garden route; branching canopy; moving platforms with a stationary assist. | Incorrect tile gives contrast and remains available. Falling returns to the last foothold without a literacy miss. |
| Word Pop | Aim a seed launcher or bubble tool at the chosen printed target; firing commits the language decision. | Static sign targets; slow floating bubbles; rotating signboard; contextual word selection. | A missed shot is motor-only. Choosing a wrong labelled target is a language attempt. Target lock/tap-to-aim preserves the same options. Never shoot animals. |
| Rescue Bridge | Hear a word, select grapheme planks in order and physically build the crossing. | Straight bridge; split span; drawbridge; later two-part bridge mechanism. | Wrong unit bounces back with specific support. Keep completed slots and allow undo. A correct build leads to an actual crossing. |
| Tree Rescue | Climb successive world-space footholds through word reading or ordered spelling to reach Cuddly. | Ladder rescue; branching oak; vine/ledge ascent; multi-platform canopy. | Camera follows real height, never a capped screen-offset animation. Missed jumps keep literacy credit and restore position. |
| Pals Post | Read/listen to a parcel's destination and deliver it to the right resident or place. | Two-house loop; descriptor-based cargo; multi-stop route; short written instructions. | Resident names the mismatch; parcel remains recoverable. Destination distance cannot signal correctness. |
| Sound Herd | Route moving picture/word carriers into groups by a stated sound contrast. | Farm gates; cargo chutes; ferry lanes; Moonwood channels. | Wrong grouping returns the carrier calmly. Pause movement while explaining the contrast. No herding precision score presented as phonics. |
| River Route | Steer a raft or choose junctions by reading or remembering instructions. | One-step spatial direction; landmark delivery; two-step sequence; printed route clue. | Safe eddies let the child replay and decide. Wrong steering without a committed choice is not a language error. |
| Sentence Express | Carry and couple word carts to express the illustrated or spoken meaning. | Simple agent/action; expanded phrase; question; repair tense or punctuation. | Keep valid assembly. Accept all genuinely equivalent grammatical orders or author an unambiguous target; never silently reject a valid sentence. |
| Fix-It Workshop | Change a grapheme or morpheme to produce the requested word or meaning; the mechanism visibly changes. | Word chains; plural objects; present/past action; building a longer word in parts. | Show which unit changes and why. Do not generalise irregular spelling with a naive suffix rule. |
| Garden Kitchen | Choose and place ingredients/objects from an oral or written description. | Vocabulary contrasts; prepositions; ordered recipe; causal instruction. | Show the actual mismatch. Ingredients and commands match the reviewed meaning. Rich spoken vocabulary is not scored as print decoding. |
| Lantern Search | Explore a small scene, read signs/clues and locate the object matching the meaning. | High-frequency-word signs; short notes; descriptive clues; two-clue inference. | Keep clues inspectable. Art may establish context but cannot reveal the answer to a supposed decoding probe. |
| Story Rescue | Perform a short sequence of actions supported by a message or story. | Single instruction; contrasting pronouns; because/but; multi-step plan. | Explain the relevant sentence and offer another try. Returning to help changes support status, not the story's availability. |

Each regular mission primarily uses one family, with a short application payoff. Each stage finale combines two or three already-taught families. Finales are cooperative set pieces, not a renamed extra word-build question or a speed boss.

Proposed variety rules: use at least three families per stage; do not repeat the primary family in consecutive mandatory missions; change at least two substantive dimensions on a return visit, such as route topology, application, mechanism, camera or partner behaviour. Changing just the word list, colour or backdrop does not count. Keep equivalent difficulty across sibling routes. Difficulty rises through language demand before motor challenge.

## 9. One complete mission example: Clucky's crossing

Clucky waits at the near bank; Brave is on the far side with a clear safe resting place. A missing bridge is visible immediately. Clucky says, “The bridge is broken. Help Brave get home.” The scene demonstrates the problem before explaining the control.

1. The child reaches the plank rack. In the applicable taught-code band, the guide introduces or reviews one relevant sound with a short model. This teaching is unscored.
2. The rack speaks a familiar decodable word such as `map`, only once `m`, `a` and `p` are available. Three persistent phoneme slots appear on the bridge workbench. The full written word is not displayed as the answer during an independent encoding attempt.
3. The player selects/carries or taps each grapheme plank into its ordered slot. The same named actions serve keyboard, touch and assisted navigation. A valid digraph in a later variant occupies one phoneme slot despite containing two letters.
4. A wrong selection produces a short contrast, replays the target word, and leaves the bridge and choices stable. Further modelling marks support. No lost life, destroyed bridge or distressed chick.
5. The finished word assembles a usable span. The child crosses with Brave; movement uses the actual bridge collision surface. Several short builds can repair later spans in a longer mission, with new authored words and layouts.
6. A short fresh direction leads to the destination. If this is a reading probe, the printed cue is not spoken first; reading help remains available but changes the evidence classification. If it is listening practice, narration is the intended stimulus.
7. Brave returns to Clucky, the bridge remains on the hub map, and a new route becomes available. Save the completed repair and learning attempts. The child can exit immediately or choose another nearby resident.

This mission combines a visible problem, an encoding action, an actual playable consequence and a meaningful return to the world. It does not repeatedly interrupt walking with a quiz modal.

## 10. Curriculum, teaching and assessment

The content pipeline must start from the current EL cycle/high-frequency-word authorities and map the old 40-stop inventory into them. Preserve useful IDs and provenance without asserting that old stop number equals EL cycle number. The fixed 27-cycle teaching sequence must not be silently rewritten by this game plan.

For each mission declare its primary construct, taught-code prerequisites, language/vocabulary support, allowed words, plausible distractors, evidence type and non-target demands. A curricular coverage table must cross every target with first teaching, supported practice, independent retrieval, different-context application and later review. Those functions should occur in different missions where useful, not as five mandatory screens before every game.

| Strand | Early campaign | Middle campaign | Later campaign |
| --- | --- | --- | --- |
| Phonics | Sound discrimination, taught GPCs, simple word reading | Digraphs and adjacent consonants; taught alternative/split patterns | Broader vowel patterns and contextual alternatives |
| Spelling | Oral segmentation and ordered simple builds | More complex syllable shapes and spelling choices | Inflections, word parts and controlled longer words |
| Listening | One clear direction and familiar object vocabulary | Two-step directions and descriptors | Multi-step instructions, reference and causal relations |
| Grammar | Spoken agent/action; in/on/under; singular/plural meaning | Sentence order, agreement, questions and taught pronouns | Tense, conjunctions, reference and sentence repair |
| Vocabulary | Concrete nouns, actions and attributes | Place, quantity, comparison and useful polysemy | Precise description, relationships and context-supported meaning |
| Connected text | Short decodable phrase after its code is taught | Purposeful sentences and brief messages | Short connected instructions and evidence-based story actions |

Grammar is taught through meaning: put the basket **under** the table, choose what **they** refers to, or repair a message about what happened yesterday. Do not make early learners memorise grammatical terminology. Separate literacy difficulty from English-language familiarity and from motor confidence.

Content production must include reviewed answer equivalence, sound/grapheme segmentation, dialect-sensitive pronunciation, high-frequency-word introduction, decodability, image meaning and specific error feedback. Use current committed pronunciation assets. No runtime LLM-generated questions, guessed image paths, stock-image keyword matching or browser TTS phoneme fallback.

### Teaching, practice and assessment are different modes

**Teach:** model and demonstrate freely; record exposure/support only. **Practice:** give immediate specific feedback; classify independent first attempts separately from correction and modelling. **Check:** use a fresh item and an independently answerable presentation; preserve the initial response before feedback, without revealing the target through narration, highlights or a picture giveaway.

The user has requested that missions can teach or assess. Build in-game checks as **formative evidence** and an explicit teacher-assigned assessment entry as a separate integration requirement. A formal result may be written only through an existing approved blueprint and its administration/scoring rules. If a skill has no approved mapping, its game result remains formative. Game success must never override EL placement or invent a formal assessment band.

Short assessment encounters use the same familiar mechanics with reduced motor demands, fresh equivalent items and controlled assistance. There is no surprise exam or high-stakes boss. If a child needs help, allow it and report the supported response honestly. Sounds-off or captions may preserve gameplay access but cannot magically measure auditory discrimination; route to an appropriate alternative and record the different construct/support.

Recognition from options does not prove oral fluency. Tapping a picture after hearing the word does not prove independent decoding. Seeing the answer during teaching and selecting it immediately does not prove retention. Repeated items in one sitting must not create repeated independent mastery credit. Use current learning policy functions rather than new percentages in this plan.

### Content volume and exhaustion

Plan roughly 6–12 meaningful decisions per regular mission and 12–18 per finale, adjusted to the action and age. This implies about 1,080–1,980 main-campaign decision opportunities; a three-grapheme build is one word-level encoding attempt with diagnostic substeps, not three mastered words. Duration includes meaningful construction/travel, not only choosing answers.

Every mission needs at least three reviewed equivalent content sets for first play, fresh check and replay, plus error-specific feedback. This means at least 450 main-mission content configurations, not necessarily 450 unique word banks. Share canonical words/audio where appropriate, but preserve distinct authored mission layouts and use a deck ledger to avoid identical recent prompts/answer orders. Review all configurations, not just one sample. Where a tiny early code inventory limits fresh words, change the valid task context or schedule later review; never invent invalid words to meet a count.

## 11. Art, animation, sound and controls

**Visual direction:** the current character canon's smooth classic children's-cartoon finish. Clear silhouettes, restrained shading, expressive faces, painted depth layers and ground contact. No pseudo-canvas texture, embossed surfaces, generic substitute monsters or mixing cut-out book portraits with unrelated pixel props. Keep whichever current paintings pass an in-game comparison; file existence alone does not qualify them.

Budget for three world kits; 30 individually composed stage neighbourhoods and permanent before/after landmarks; 150 authored main mission layouts; and the optional quest layouts. Modular terrain is welcome, but the production inventory must name every scene and set piece rather than count one panorama as ten finished stages.

Each of the eight heroes needs idle, walk/run, turn, jump, fall, land, climb, aim, carry/place, interact, recover and celebrate states, with species-appropriate equivalents. Residents need at least readable problem, interaction and resolution performances. Any resident who moves, carries or escorts needs those action states too. Derive sprite atlases or lightweight 2D rigs from editable sources, preserve registration and transparent edges, and inspect them at actual game scale. Do not assume an unrelated animation task has delivered game-ready rigs.

Give each family its own camera: broad lateral framing for bridges, vertical follow for climbing, stable framing for aiming, clear junction framing for route decisions. Foreground plants may frame the action but never cover letters. Limit decorative parallax and particles in low-power mode; keep targets, contrast and responsiveness.

**Audio:** retain character-specific spoken lines where the mission still matches. Supply an exact instruction, replay, first-error contrast, model and completion cue for every action. Use a stable instructional voice for pure phoneme cues; comic character voices should not distort them. Music/ambience duck under speech, pause with the mission and respect current independent music/speech settings. Missing essential audio must lead to honest supported access or a clear recoverable state, never a silent independent score.

**Controls:** persistent responsive movement, jump and one contextual action. Use the current Game Design Bible's placement, safe-area, 56-pixel target and spacing rules. Tap an object to select/auto-approach as an equivalent motor assist; provide select-then-place for carrying instead of requiring dragging. Keep semantic controls aligned with world objects without a permanent second wall of answer buttons over the field. Direct keyboard/switch access must use the same decision contract.

Implement forgiving jumps, stable landings, a short input buffer and clear recovery. Avoid compulsory rapid reaction, tiny ledges, timed reading and repeated stop-start input release after every correct unit. Pausing, interruption, rotation and lost pointer capture must release movement and preserve the target. Accessibility modes use the same world state and reward; if presentation changes the measured construct, reflect that honestly in evidence.

## 12. Engineering and migration

Keep React/Vite and the current full-screen integration. Build on the current Canvas 2D encounter foundations if a representative slice proves them suitable. Extract fixed-step movement, collision, camera, input and sprite state from the large scene into reusable modules, with family-specific scene controllers. Do not replace the engine just because another library has an attractive demo. A renderer change would require a concrete demonstrated limitation and a bounded comparison.

Separate curriculum selection, mission state, simulation, rendering, audio, semantic interaction, persistence and evidence. The renderer consumes state; it does not award learning credit. Replace the mostly fixed mission director with an authored mission graph plus a constrained curriculum/review selector. Distinct game mechanics should not be reduced to one generic multiple-choice component.

Proposed records: world/stage graph; mission objective and prerequisites; resident/canon reference; layout and family/variant; content-set IDs; initial/checkpoint/repair state; audio/asset manifest; evidence contract; replay exclusions. Proposed save data covers chosen hero, visited places, repairs, completed missions, exact active challenge/choices/support state, content version, review state and idempotent attempt IDs. Validate this against existing authorised progress fields before adoption; hosted schema changes require their own explicit action authority.

Persistence acceptance must include leaving mid-word, returning after reload, offline completion, retrying uploads, two tabs, account switching, old save import and updated content. Save locally before network work; partition all queues/debounces by learner; merge completions and attempts without duplication or loss. Persist enough checkpoint state that revisiting cannot reroll a hard question or erase an assisted attempt.

Migration maps old s1–s40 progress to corresponding **story** anchors and preserves valid evidence with its original version/support provenance. Do not turn a completed old stop into five completed new missions or manufacture mastery. Already-earned routes/rewards need an intentional placement in the expanded world, and new missions can remain available as new content. Keep a recoverable original until migration is verified. Test v1/v2/v3 sources explicitly; the current v3 normalizer is not a migration plan.

The 600-event local v3 cap requires a retention design: preserve sufficient authorised evidence in the existing storage/reporting architecture before compacting local records. Do not extend retention or collect extra child data merely to make an analytics graph. No child open chat, ad system, public leaderboard, microphone recording or runtime generation service is needed for this campaign.

## 13. Production order and ownership

| Phase | Concrete deliverable | Exit condition |
| --- | --- | --- |
| 1. Baseline and detailed pre-production | Current-runtime state captures; historical feature comparison; exact 30-stage/150-mission register; EL crosswalk; canon crossover; asset/audio inventory; dependency and save audit. | Every mission has a learning purpose, action, prerequisite, payoff and production owner. Standards conflicts have an explicit resolution plan. |
| 2. Representative finished slice | One complete five-mission Meadow stage, connected hub, two optional quests, several genuine mechanics, all eight playable heroes, final art/audio, save/resume and accessible modes. | Actual opening-to-resolution play passes the learning, motion, visual and interaction checks. Test the riskiest climb/aim/build actions before multiplying scenes. |
| 3. Campaign foundation | Stage graph, review selection, content validator/editor workflow, migration, persistence, fast travel and family controllers. | Branches cannot strand a learner; content/evidence/save rules survive automated and real-input checks. Shared abstractions have real second consumers. |
| 4. Complete Meadow | Ten stages, 50 main missions, 20 optional quests, full world resolution. | Full route playable, all repairs and content variants checked; measured pacing informs later production. |
| 5. Complete Sunny Hollow | Ten stages, 50 main missions, 20 optional quests with different geography and rising language demand. | No mass reskin; full continuity, word/sentence work, progression and timing checks. |
| 6. Complete Moonwood | Ten stages, 50 main missions, 20 optional quests and campaign conclusion. | Advanced content load, story logic and entire campaign timing verified; retained/review claims remain evidence-bound. |
| 7. Full release verification and cutover | Main and side paths, all heroes/input modes, reporting, migration, hosted/offline checks, scoped cleanup and updated bibles/index. | All executable requirements and reported defects resolved; manual evidence states recorded accurately. Only one child runtime and one active authority remain. |

The slice is an internal risk-reduction step, never the delivered substitute for the three-world game. It should include a miniature assessment encounter and one return/replay so evaluation does not stop at the happy path. Do not build 150 unfinished scenes before establishing the playable and artistic standard.

Required work disciplines: game/level design, curriculum editing, character/environment art and animation, audio, engineering and QA. These may be combined across people, but none disappears because an agent writes code. A preliminary capacity assumption of three to five experienced contributors suggests months, not a weekend: provisionally 2–3 weeks pre-production, 4–6 weeks finished slice, 10–16 weeks world/content production and 3–5 weeks final integration/QA, with some overlap. This is an unvalidated planning range, not a quote or delivery promise. Re-estimate after measuring approved scene, animation and mission throughput in the slice; include revision and recording time.

## 14. Acceptance and evidence

The completion ledger must list all 30 stages, all 150 main missions, all 60 optional quests, eight heroes, twelve families and every authored content set. Each entry tracks designed, authored, integrated, exercised and unresolved defects. A level name, source stub, screenshot or manifest does not count as a finished mission.

Test the real route and real inputs: opening, movement, teaching, first choice, wrong choice, support, recovery, mid-mission exit, resume, completion, replay, branch choice, world transition and final ending. A mission must show that its problem was actually solved in the world. Review continuous climbing and aiming, not only screenshots of attractive scenery.

Automate graph reachability, prerequisite coverage, ambiguity/answer equivalence, taught-code boundaries, choice independence, valid evidence, migration/idempotency and scene lifecycle. Use current relevant quest checks and repository test/lint/build/hygiene checks; audit which legacy checks actually import v3 before citing them as coverage. Add mission-family behavioural tests that protect outcomes rather than frozen screenshots or implementation details.

Review visual states across supported layouts, low-power and failed-asset modes, with full-size target comparisons. Profile active game scenes. Human listening, supported physical iPad play and consented child observations through the existing observation programme remain separate evidence classes. Never turn browser emulation into physical-device evidence or a simulated duration into an observed 20-hour campaign. Under current beta policy, unknown manual metadata is not itself a new approval switch; it cannot support the corresponding quality claim. Reported defects must still be corrected.

For the Teach Your Monster quality ambition, observe whether children understand their goal, choose routes independently, recover after a first mistake, notice the repaired world and willingly continue to another mission. Avoid arbitrary numerical satisfaction scores. Rework scenes that depend on an adult repeatedly explaining what to do.

Before cutover, update the current Sound Seekers bible, world blueprint and curriculum-mechanic matrix to the adopted graph and authoritative policy owners. Mark prior plans superseded or remove them only after confirming they are no longer needed as active operational references. Remove retired runtime/assets only after reference analysis and successful save migration; preserve canonical source art and required provenance. Do not retain a permanent old/new product fork.

## 15. Main risks and intended decisions

| Risk | Response |
| --- | --- |
| The new game again becomes the same question room repeatedly | Protect the twelve family action contracts, three-family stage rule, distinct layouts and physical problem resolutions. Review whole missions in motion. |
| “20 hours” is content multiplication without play value | Keep main/optional time separate; measure real first-play duration and add authored substance if short. |
| Art production stalls after three hero cutouts | Inventory complete eight-hero animation, residents and before/after landmarks before scene expansion; measure throughput in the slice. |
| Freedom breaks teaching order | Separate story repair, taught-code access and evidence; validate all mission graph paths, including support and reassignment. |
| The late curriculum is overloaded or mismatched with EL | Complete the 40-anchor-to-EL crosswalk first, distribute teaching across missions, and rebalance content before final recording. |
| Score claims exceed the child's action | Use precise construct/support events; retain formal assessment boundaries and current policy functions. |
| Longer saves silently lose evidence or reset old players | Design and exercise migration, retention, offline merge and account isolation before world production scales. |
| Eight avatars collide with resident roles/canon | Author substitute mission givers and a narrow crossover rule; use exact model sheets and species-aware animation. |
| Strong graphics hide poor touch performance | Test the actual slice on the supported device profile early; reduce decorative cost before legibility or input quality. |

The next implementation action should be the detailed mission/curriculum register and representative finished stage, with the **entire three-world campaign retained as the endpoint**. No gameplay replacement is authorised or performed by this planning document alone.

## Source map

- Current entry: `src/features/soundSeekers/SoundSeekersRoute.jsx`, `v3/SoundSeekersV3.jsx`.
- Current world/cast: `v3/content/trail.js`, `v3/content/cast.js`.
- Current mission/movement: `v3/engine/director.js`, `v3/render/encounterScene.js`, `v3/render/mapScene.js`.
- Evidence/save review: `v3/engine/authority.js`, `v3/engine/progress.js`, `v3/storage.js`.
- Curriculum: `src/data/questSequence.js`, current EL/high-frequency-word sources identified by `docs/instructional/instructional_standards.md`.
- Current standards: `docs/design/GAME_DESIGN_BIBLE.md`, `GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md`, `LEARNING_POLICY.md`, `docs/content/QUESTION_DESIGN_BIBLE.md`, `STORY_BIBLE_PART_2_CANON.md`, `docs/reporting/REPORTING_BIBLE.md`, `docs/audio/PHONEME_RECORDING_STANDARD.md`.
- Historical direction compared with source: `docs/SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md`, `docs/design/SOUND_SEEKERS_V3_STORY_TRAIL_PLAN.md`, `SOUND_SEEKERS_10000_PERCENT_REBUILD_PLAN.md`; Git cutovers `dd524409a` and `32d8cb7aa`.
- Latest remote coordination: `docs/design/GAMEPLAY_GRAPHICS_LEARNING_UPGRADE_PLAN.md` section 25 at `58d016660`, plus immediate-activity-access changes in the current Game Design Bible. This detailed Sound Seekers proposal preserves that exploration and uninterrupted-input direction.
