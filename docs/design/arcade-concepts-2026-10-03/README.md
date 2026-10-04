---
type: design-proposal
status: approved-design-reference
updated: 2026-10-03
---

# Three new Arcade games

**Deliverable:** three gameplay-screen mockups and an interactive design board. These are proposals, not implemented games or production-ready character assets. [Open the board](index.html). Image-generation inputs are retained in [prompts.json](prompts.json).

The owner approved all three designs and requested parallel implementation.
The current playable implementations are registered in `src/data/learnGamesData.js`;
their actual mechanics and checks are governed by
[the physical Arcade contracts](../../../src/components/learn/games/shared/physicalArcadeBriefs.js)
and the [Game Design Bible](../GAME_DESIGN_BIBLE.md). These retained concept
screens remain design references. Each implementation now has Meadow Pals,
Dino Pals and Moonwood difficulty themes, with Bouncy, Chompy and Pip respectively.

## The menu distinction

**Arcade — Move, aim and build while you learn.** The physical game has a continuous world, player control, interesting movement or construction, and reasons to replay beyond answering the next question.

**Phonics games — Listen, look and practise.** The main activity is a sound, spelling, reading or sentence task. An illustrated world supports that activity.

Drum Trail and Lantern Lagoon belong under Phonics in this proposed grouping: their principal actions are choosing a syllable crossing and matching a sentence to a scene. This proposal does not change their runtime registration, Daily Challenge eligibility, checkpoints or existing progress. Grouping in the menu must be separate from those contracts when implemented. Retain the shared Games page, small section headers, aligned artwork and a grid that fills the available space. All three new games are selectable immediately; skill difficulty and movement assistance are independent settings.

## What the existing catalogue already covers

Reviewed `src/data/learnGamesData.js` and `src/components/learn/games/shared/arcadeVerticalSliceBriefs.js`: 24 registered games, including 15 currently flagged for Arcade. The catalogue already has rocket catching, running/jumping, beanstalk climbing, racing, bridge construction from letters, rhythmic sound play, rhyming balloons, net-catching, fishing, sentence repair, trains, skating and a sound keyboard. The nine direct practice games cover word construction, word memory, onset/rime, rescue reading, sorting, letter replacement, heard-word balloons, sentence order and Sentence Fix-It.

The three proposals add **route demolition**, **sport shot placement** and **editable world construction**. Tower Tumble must not become Word Climb with a hammer; Burrow Builders must not become Word Bridge with cubes.

| Game | Arcade pleasure | Literacy action | Typical outing |
| --- | --- | --- | --- |
| Tower Tumble | Climb ladders, jump hazards, smash routes, rescue cargo | Strike the grapheme needed next in the heard word | Three compact towers, 4–6 minutes |
| Rally Pals | Move, aim, return, lob, outplay a rival | Direct a shot to the matching sound or decoded target | Three short rally rounds, 3–5 minutes |
| Burrow Builders | Gather, place, remove and reshape a voxel world | Assemble a heard building word or carry out a reading instruction | One useful construction mission, 6–10 minutes; free building continues |

Times are design targets, not measured sessions. SNES-to-PS3 is a reference for rich, readable family-game action rather than a requirement to recreate a particular console engine.

## 1. Tower Tumble

**Fantasy:** Bouncy repairs an old meadow mill from the bottom upward. Ladders, pulleys, breakable brickwork and rolling padded barrels create a vertical rescue playground. A wooden mallet makes smashing satisfying; there is no combat with people or animals.

**Camera and movement:** side-on 2.5D, three or four ledges visible at once, a gentle upward scroll, deep painted hills behind solid playable platforms. Run either way, climb, jump and swing while moving. Jump timing, barrel dodging, opening shortcuts and activating pulleys remain enjoyable between learning encounters. The hammer can also break unlettered cracked scenery, so it has a physical purpose beyond answering.

**A complete encounter:** a sailing-ship picture appears with recorded audio and three empty grapheme slots. Reachable bricks contain shuffled `sh`, `s`, `ch`, `i`, `a`, `p`, `t`. The task spelling is never printed. Bouncy climbs to the first brick cluster, strikes `sh`, moves through the newly opened section, strikes `i`, then `p`. Each accepted grapheme becomes a piece of a working lift. The final correct impact automatically starts the lift and rescues the waiting cargo; the next tower cue follows naturally. A first incorrect strike gives a brief spoken contrast and a wobble, retaining the same bricks and order. After two wrong literacy attempts, an optional partial hint is `**ip`. Correct work is retained while an incorrect suffix is repaired.

**What keeps it a platform game:** multiple traversal routes, short moving platforms, safe falling cargo, a barrel you can redirect, destructible shortcuts and a final pulley sequence. Later towers alter geometry and object behavior independently of the word difficulty. Three themed sets: Meadow Mill, Treetop Workshop and Cloud Crane. Optional collectibles reward exploration; they do not establish literacy mastery.

**Controls:** lower-left left/right and contextual ladder up/down; lower-right Jump and Smash. Keyboard arrows or WASD, Space to jump, E to smash. A 72px recommended action target on tablet, at least 56px everywhere, and an 8px gap. A forgiving motor mode snaps ladder approach, enlarges landing surfaces and safely returns falls to the last ledge. It never chooses a grapheme. Empty swings and falls are motor events, not wrong answers. A semantic nearby-brick mode exposes the same encounter and learning choices without precision platforming.

**Learning ladder:** single phoneme/grapheme routes, CVC segmentation, then digraph encoding and selected four-phoneme words from the existing curriculum. A correct compound chunk such as `sh` fills one sound slot, not two separate sound slots. Keep printed choices legible while the character and camera move; the cue and replay action stay anchored. No timer on the spelling task.

**Distinct from Word Climb:** the player changes traversable geometry with a hammer and joins mechanical rescue structures. Word Climb's main loop is jumping between vine platforms and selecting starting-sound words. Climbing alone is not sufficient differentiation.

## 2. Rally Pals

**Fantasy:** Bouncy joins a friendly meadow tennis club. Real serves, returns, cross-court shots, lobs and a moving opponent create the central experience. The game should still feel like a racket sport with the learning HUD hidden.

**Camera and feel:** elevated behind-player view, full court and net always visible, restrained ball trail, a soft landing reticle, squash/stretch racket contact, and an opponent with readable preparation. The far court has three broad, equally styled sound landing zones. Character movement and shot direction are independent; touchscreen aiming uses the court itself rather than tiny letter buttons.

**A complete encounter:** before an untimed serve, a fish picture and its recording cue the final sound. Far-court zones show `ch`, `sh`, `th` in shuffled positions. The child sets the shot direction and swings toward `sh`. Record the intended zone at swing activation; only the chosen linguistic response determines correctness. A correct serve activates that lane's return bonus and begins an ordinary continuous rally. The cue stays available during play, but repeating the same selection in that rally earns no new independent-learning credit. At the next point or calm dead-ball moment, a fresh cue changes the court objective. No separate quiz panel interrupts each return.

**Real sporting decisions:** move to intercept, send the ball away from the rival, choose a safe lob or flatter drive, rally off broad practice targets, and time a power return. A wrong sound lane produces an informative cue and a soft rebound; it does not remove a life or erase a rally achievement. The learning encounter remains open until repaired. After two wrong literacy choices, show the relevant partial ending hint `**sh` for this example and mark the repair as supported. Avoid telegraphing the correct zone through color, width, rival position or a pre-aimed trajectory.

**Controls:** lower-left movement rocker; aim by dragging/tapping a broad court landing area; lower-right Swing and Lob. Keyboard arrows or WASD move, three accessible focusable zone controls choose aim, Space swings and E lobs. Assisted mode follows the ball and widens the contact window while preserving the child's aim decision. The opening serve has unlimited thinking time; Rally Pause can hold the ball safely at any learning encounter. New learning decisions have no reaction deadline. Match score and rally record measure sporting play; learning accuracy is a separate record. A failed contact after correct aim records a motor miss and replays the ball, without marking the reading wrong.

**Learning ladder:** initial phonemes, final phonemes/digraphs, then decoding one of three printed response words for a heard sound family. Reading choices are legitimate task material; a spelling target is never supplied as a caption. Sound-off support must change to a valid visual reading task or use an established accessible modality, rather than pretending a picture alone disambiguates a spoken phoneme. Use production recordings, not browser speech.

**Replay:** three-point quick matches, cooperative rally goals and target practice, all immediately selectable. Meadow Court, Rooftop Court and Moonlit Court change camera-safe scenery and opponent style. No public multiplayer, microphone, camera, motion-controller hardware or competitive child leaderboard is required.

**Distinct from existing Arcade:** no current game combines ball flight, opponent positioning and deliberate racket-shot placement. A pool concept is a sensible later alternate aiming sport; tennis adds more lively movement and a clearer first child-control prototype, so it occupies this slot.

## 3. Burrow Builders

**Fantasy:** transform a meadow island into a home for the existing pals. Gather wood and stone, build bridges, put up a useful shelter, redirect a shallow stream and arrange a garden. Chunky voxel terrain remains editable after each mission, so children can keep creating.

**Camera and construction:** three-quarter view, fixed comfortable camera angles with explicit rotate controls. Move through stepped terrain, pick up resources, snap a preview to a grid and place or remove blocks. Begin with a small finite island to make navigation and persistence manageable. Make structure effects physical: a bridge crosses the stream, a roof keeps an interior dry, a gate opens a paddock, and planted beds grow.

**A complete encounter:** the blueprint cue is an unlabelled hut picture plus its recorded word, with three empty slots. The workbench inventory mixes `t`, `m`, `u`, `r`, `h`, `e`. Place the selected grapheme blocks into a foundation rail in spoken order. Three accepted placements craft the functional shelter kit and automatically fit its essential frame into the player's chosen grid location. The child can then extend walls, move windows, add a roof and decorate freely with ordinary unlettered materials. The learning assembly is part of building a usable object; there is no disconnected spelling modal and no extra confirm action. A wrong grapheme can be lifted and repaired without tearing down the world. After two incorrect placements, show `*ut` as optional partial help, recording subsequent success as supported.

**What makes it a construction game:** rotate pieces, stack, dismantle, create ramps, design alternate bridge spans, experiment with water channels and invent structures outside the current blueprint. Each mission awards a useful new piece family and a pal animation, not simply a score popup. Unlimited ordinary building blocks remain available in free build, so children are not forced to answer repeated questions to place every cube. Optional learning blueprints remain available there.

**Controls:** lower-left movement; tap a large grid cell to aim placement; lower-right Place and Pick up; contextual Rotate for the selected part. Keyboard movement, focusable grid/blueprint controls, E to place, Backspace to pick up, Q to rotate. A 3×3 assisted placement region expands the selectable cell while the actual construction grid stays precise. Camera motion can be disabled. An overhead accessible build view names cells, neighbors and blueprint slots; it preserves construction choices rather than automating the spelling.

**Learning ladder:** CVC building nouns, digraph nouns and then reading/meaning instructions such as placing a gate beside a pond. The instruction phase is a comprehension task, so its sentence is legitimate reading material rather than a spelling answer. Spatial building, artistry and block count are observed play, not reading mastery.

**Replay and ownership:** choose any island and any suitable blueprint immediately. One island checkpoint retains a bounded grid of placed block types/orientations, gathered mission pieces and active cue/choice order through the existing child-owned save system. Three initial themes: Meadow Homes, River Workshop and Moonwood Village. No online sharing, chat, imported builds or new child identifiers. A destructive edit is locally undoable; returning to a mission never discards a child's creative build.

**Distinct from Word Bridge / CVC Word Builder:** those games complete fixed word constructions. This game supports persistent editable terrain and freely designed structures whose geometry matters. The reading task supplies a meaningful construction component rather than defining every available action.

## Shared learning and recovery contract

- Image and recorded audio carry a spelling cue. No target text in captions, world signs, textures, fallback labels or opening instructions. The child's own accepted graphemes can remain visible.
- Keep plausible distractors and the original visible choice order through retry, pause and resume; change positions only for a fresh encounter. Do not bake correct positions into scenery.
- Two wrong **literacy** attempts permit partial spelling help; falls, misses and camera adjustments never count toward that threshold. Support is recorded from the first contrast, model or hint actually supplied, not only from the final hint button.
- Separate first response, incorrect response, repaired response, supported completion and independent fresh transfer. A repeated correct hit on the same cue is practice, not another independent mastery event.
- The gameplay action commits the response, and its final successful learning action completes the task automatically. Retain ordinary sporting/building actions when they serve the physical game.
- Help can slow movement, expand motor targets or safely position the character. It cannot silently answer a learning choice. Reading windows are untimed.
- Pause, narration, tab hiding and asset failure must have explicit recovery. Production images/audio need approved provenance; a missing asset retains a functional game and a cue that does not disclose the spelling answer.
- Use shared curriculum, production recordings, profile scope, checkpoints and learning-event writer. Do not create a parallel mastery, account or economy service.
- Reduced motion removes decorative shake and rapid camera effects. Low tiers reduce scenery/shadows before controls, choices or learning feedback. All production games require real end-to-end touch, keyboard, resume, audio and sustained-performance proof under the current game Bible.

## Recommended first implementation

**Tower Tumble first.** Its short, bounded rooms let us prove a satisfying smash/jump loop and clean spelling evidence quickly. Tennis comes next to add a different physical skill. Burrow Builders follows after establishing bounded world-save and undo behavior; it has the greatest creative replay potential and the largest engineering scope.

The first playable slice should contain one complete small outing, its recovery and accessibility modes, and real learning events. Select an implementation renderer after that slice's camera/physics/performance needs are measured. These mockups are not evidence that Three.js, Unity or any particular renderer meets school-device requirements.

## Inspiration and project authority

- Platform route rhythm and friendly recovery: [Nintendo's Donkey Kong Country Returns HD tips](https://play.nintendo.com/news-tips/tips-tricks/donkey-kong-country-returns-hd-tips-tricks/). Use the genre properties, with original meadow characters, geometry and assets.
- Directional shot play: [Nintendo Switch Sports tennis basics](https://www.nintendo.com/jp/ichikara/as8sa/03_en.html). Our controls use ordinary touch/keyboard, not motion controllers.
- Picking up and placing blocks for open construction: [Minecraft's introductory building guide](https://www.minecraft.net/en-us/article/how-minecraft). Use original voxel materials and a child-safe finite meadow world.
- Project authority: [Game Design Bible](../GAME_DESIGN_BIBLE.md), [Game Visual and Playability Production Guide](../GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md), [Child Surface Rules](../CHILD_SURFACE_RULES.md), current game roster and vertical-slice briefs.

## Mockup review and evidence boundary

The three screens show opening cues, meaningful game geometry and illustrated touch controls. They contain picture/audio spelling cues and blank answer slots; no complete target spelling appears in the image. The review board's controls switch concepts and explain opening, hint and assistance states. Controls drawn inside the images are illustrative.

Rendered board checks and image inspection establish the design pack's usability and visual communication. They do not establish playable game physics, authored character fidelity, actual audio listening, physical-iPad behavior or classroom learning impact. No production game registration or hosted progress changed as part of this design proposal.
