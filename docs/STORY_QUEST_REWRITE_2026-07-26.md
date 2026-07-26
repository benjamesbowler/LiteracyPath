# Story Quest rewrite — 2026-07-26

Every page of all 13 Story Quests was re-authored. This file records what changed, why,
and what art work is still outstanding.

## Why

The catalogue was mislevelled in a way that inverted the reading ladder: the declared
Level B books were harder than the declared Level C books, so a child promoted A to B was
handed a text harder than the C waiting for them. Measured before / after, words per page:

| Band | Before | After |
|---|---|---|
| A | 13.8 | **5.0** |
| B | 22.5 | **12.0** |
| C | 17.7 | **18.3** |

Not one of the 125 "Level A" pages was a single line of text (the band allows 2-6 words on
one line). 128 of 129 Level B pages and 178 of 194 Level C pages carried past-tense
narration, which the band puts at Level D minimum. All four Level C books and both Level B
v2 books declared `was` and `were` as target sight words in bands specified as present
tense — the level label had been applied after authoring, not designed to.

Every quest also declared target words and high-frequency words that never appeared in its
own text; `mp_ra_a_04` declared nine unused, including `help` as both a target word and a
sight word, in 664 words.

## How

Text was written to the illustrations, not the other way round. All 465 images were
reviewed page by page first, and the new text asserts only what the pictures actually show.
Where a picture could not carry the beat, the page was cut or a re-render was briefed —
see the work orders below. Page count 460 -> 313; no new art was commissioned.

Every page carries `narrationNeedsRebuild: true`. The text changed, so all 465 existing
narration mp3s now read the wrong words; the flag suppresses audio playback until narration
is regenerated. **Do not clear the flag globally — clear it per page as audio is rebuilt.**

## Gates

- `node tools/checkStoryQuestIntegrity.js` — wiring. Passed before this work too; it does
  not test level, decodability, path coherence or art.
- `node tools/checkStoryQuestLevels.js` — **new.** Band ceilings (lines, words per line,
  words per page, longest route, multisyllabic ratio), past-tense narration, told-emotion
  and safety-hedge registers, stated morals, choice-label length, declared-vocabulary
  truth, and the ladder itself. This is the gate that would have caught the inversion.
- `node tools/auditStoryQuestAssets.js` — 0 missing images, 0 missing audio.

Three assertions in `checkStoryQuestIntegrity.js` were rewritten because they encoded the
old, mislevelled text and directly contradicted the band spec. Each keeps the same intent
and tests it with level-legal evidence; all three are commented inline with the date:

- Sam & Pam endings required the word `park`. `park` is r-controlled and cannot appear in a
  short-a decodable. Now requires `van`, which is drawn on both ending pages.
- `mp_ra_a_03 p01_start` required `surprise` — three syllables, r-controlled vowel plus a
  split digraph, impossible at Level A. Now requires `map`, which is CVC and is the object
  the quest is about.
- `mp_ra_a_04 p01_start` required the literal phrase `one mystery at a time` — the 27-word
  Level F opening this rewrite removed. Now requires the page to name **both** objects,
  `hat` and `bell`, which is a stronger test of the same intent and legal at Level A.

## Craft rules applied

1. One genuine failure per book. Somebody is actually wrong, thwarted or refused, and it
   costs at least one page. Previously no character in 13 books and 40+ endings was ever
   wrong for longer than a page.
2. Emotion is staged, never stated. `beams`, `almost smiled`, `frown softened`,
   `looks sorry` and their kin are gone; the picture carries feeling, the text carries
   action.
3. No stated morals, no narrator addressing the reader, no printed rules.
4. No safety hedging. `safely`, `carefully`, `nobody was hurt`, `called a warning`,
   `asked before helping` — the loudest marker of machine-written children's text.
5. Every choice changes something visible on the next page.
6. Path coherence: no character speaks or acts on a route they never joined; no prop is
   referenced before the page that puts it in the scene; object state is monotonic.
7. Choice labels are 4 words or fewer and easier than the page text.

---

# Per-book changes


## `mp_ra_a_01_muddy_splashy_missing_hat`

**Muddy and Splashy: The Missing Hat** — Level A · 20 pages · 8 cut · 1 re-renders

- **Sentence frame:** A ___ is not the hat.
- **Genuine failure:** `p08_clucky_grumpy`
- **Cut:** `p03_mud_pat`, `p03_water_splash`, `p04_mud_search`, `p04_pond_search`, `p05_grumpy_boot`, `p06_big_splash`, `p07_clucky_wet_hat`, `p08_hat_on_clucky`

Rebuilt on one frame, A ___ is not the hat, which carries the four red-herring pages and flips to The hat is in the ___ at each payoff. The mud/pond split now has consequences instead of one adjective: a mud hat has to be washed and a wet hat only has to be fanned, and only the mud route can go wrong. Grumpy is cut from the book with p05_grumpy_boot (extra-limb goat) so no re-render is owed there, and p08_clucky_grumpy keeps its id but never names the goat who is not in the frame; its text now matches what is drawn, a mud blob on a hat Clucky is already wearing. That page is the genuine failure: they hand back a dirty hat and it costs a page either way: wash it now and the hat gets back to Clucky clean, or take it off Clucky and the hat ends up on Muddy instead. Cut the three interchangeable pond shots down to two, cut both they-search-together pages as pure fork pages, and cut p08_hat_on_clucky because p09_mud_ending and p09_pond_ending already show the hat back on Clucky and are better pictures. Three endings now differ in outcome: mud splash, pond splash, or Muddy keeps the hat on.

**Art work orders:**

- `p03_meet_splashy` — Same meeting shot of Muddy and Splashy on the mud edge, but delete the blank two-board signpost at far left; a lettered-looking prop with no letters on it stops beginning readers.

## `mp_ra_a_02_shy_cuddly_quiet_adventure`

**Shy and Cuddly: Up in the Tree** — Level A · 21 pages · 11 cut · 1 re-renders

- **Sentence frame:** Shy is ___.
- **Genuine failure:** `p04_call_shy`
- **Cut:** `p03_stay_still`, `p03_barn_look`, `p04_quiet_tiny`, `p04_say_hi_tiny`, `p04_wait_quietly`, `p05_cuddly_arrives`, `p05_sit_together`, `p05_tiny_tree`, `p07_tiny_waits`, `p09_quiet_ending`, `p09_tree_happy_ending`

Tiny is cut from the book outright, which removes every page that asked a four-year-old to tell two grey mice apart; the five pages built on Tiny go with him, and Bouncy the yellow lamb now carries the whole make-a-friend thread because she is the one animal on the page nobody can confuse with Shy. The edge p08_tree_purr to p08_tree_hug is deleted and p08_tree_purr is now an ending, so no route in this book lets a child choose space and then have the story overrule it one turn later. The barn yes-or-no beat is promoted rather than buried: p08_barn_hug is the only place a hug is offered by name, its prompt asks the question outright, and both answers are real endings. Five of the seven interchangeable barn-doorway pages are cut, keeping only p04_call_shy, p08_barn_hug and the two barn endings. The frame is Shy is ___, which runs across seven pages and makes the whole book a position-word book the pictures can actually carry; the only beat that asks the art for an emotion is p04_call_shy, whose startle the review calls unmistakable. p07_tree_up now offers waving from the branch or coming down for a hug rather than a plain climb-down, which keeps every path inside the ten-page cap. That page is the genuine failure: Cuddly gets it wrong, is too loud, and it costs a page before she can try again.

**Art work orders:**

- `p08_wave_from_tree` — Same busy group shot of Shy and Cuddly waving from the low branch with Bouncy below, but reattach Bouncy's raised coil-spring leg to her body; it currently reads as detached and floating.

## `mp_ra_a_03_bouncy_speedy_fast_map`

**Bouncy and Speedy: Go to the Big Tree** — Level A · 27 pages · 2 cut · 2 re-renders

- **Sentence frame:** Go to the ___.
- **Genuine failure:** `p04_too_fast`
- **Cut:** `p05_grumpy_wet`, `p09_race_ending`

Splashy is added to characters because the review confirms she is the duckling drawn on p04_splashy_help; she is named only there. p04_map_caught no longer hands the reader back to Bouncy at p03_pond; both its exits stay with Speedy. The whole payoff is rewritten to what is actually drawn: p07_tree_stop now says only that the X is in the dirt, because no snack and no arrow exist in that frame, and p08_farm_view is demoted from a secret hilltop view to a plain true sentence about the barn being far off, then promoted to an ending. Nothing in the text mentions an arrow anywhere, which lets p01_start be reused as drawn even though Tiny is absent from it and the map has no arrow. p05_grumpy_wet is cut rather than re-rendered, taking the floating towel, the stray boot and the unrepentant grin with it; the splash on p04_map_splash still lands and stays unapologised for, which the picture can carry. The genuine failure is p04_too_fast: Speedy outruns the map and loses it, and it costs him the mud pages before anyone gets it back. p09_race_ending is cut as a duplicate of p09_home_ending. All three endings now say map out loud, which is what a map book owes its last page; p09_tiny_snack_ending gains the map on the grass as a one-object addition.

**Art work orders:**

- `p08_farm_view` — Same wide shot of Bouncy and Speedy under the oak with the barn and pond small in the distance, but give Bouncy the open map in her hoof-hands and separate the two bodies so Speedy has exactly one tail.
- `p09_tiny_snack_ending` — Same shot of Bouncy, Tiny and Speedy sharing the small red snack under the oak, but add the folded paper map lying open on the grass beside Tiny.

## `mp_ra_a_04_brave_tiny_big_little_rescue`

**Brave and Tiny: The Little Rescue** — Level A · 32 pages · 4 cut · 2 re-renders

- **Sentence frame:** The ___ is in the ___.
- **Genuine failure:** `p05_brave_stuck`
- **Cut:** `p04_under_wool`, `p05_feather_back`, `p05_feather_brave`, `p09_helpful_ending`

DECISION: one book, two committed mysteries, not two books. The schema fixes the quest id and the deliverable is four quests, so a split is not available; more to the point the two subtrees only ever shared p01_start and the bad shared ending, and cutting p09_helpful_ending makes them cleanly independent inside one file. Every ending now shows the object it is about. The bell contradiction is solved by writing rather than repainting: p01_start names both objects but claims nothing about where either one is, so the bell still swinging on Woolly's ribbon there is simply her bell and not a plot hole; the bell mystery opens on p02_tiny where her ribbon is genuinely drawn bare. p04_under_wool, the other page where the text said the bell was gone while the art showed it attached, is cut outright, and the wool search now runs p03_woolly to p05_brave_in_wool to p06_woolly_laughs, where the small gold glint under the fleece is really drawn. Only two re-renders remain: the bell must come out of the pot on p04_tiny_in_pot so a hat reader never sees the other mystery's object, and Clucky must be wearing her hat on p09_fancy_brave_ending. p01_start drops from 27 words to 6. The genuine failure is p05_brave_stuck, with the reassurance deleted: she cannot get out, full stop, and it costs a page before anyone tips the pot. NOT FIXABLE IN TEXT: the book still splits roughly half painterly and half thick-outline cartoon, and a hat reader still crosses that line between p03_pot and p03_wall; Clucky also swings between russet and orange-red and between twice and four times Brave's height across those two styles.

**Art work orders:**

- `p04_tiny_in_pot` — Same shot of Tiny at the bottom of the pot on a knotted string, but remove the gold bell so only the red hat is down there, and put the rope end in Tiny's paws instead of ending in mid-air.
- `p09_fancy_brave_ending` — Same shot of Clucky handing Brave a red feather, but Clucky must be wearing her red hat and drawn at the same scale and in the same painterly style as p07_clucky_happy.

## `dp_ra_b_01_chompy_big_lunch_hunt`

**Chompy's Big Lunch Hunt** — Level B · 21 pages · 7 cut · 1 re-renders

- **Sentence frame:** Chompy can see the ___. "___," said Chompy.
- **Genuine failure:** `p05_grumpy_tiny_smile`
- **Cut:** `p04_not_full`, `p04_more_food`, `p04_leaf_lunch`, `p05_mud_face`, `p06_tummy_big`, `p07_more_please`, `p08_star_ending`

Cut p08_star_ending outright: a full Milky Way night image with Chompy alone and no food cannot end a book whose only question is when lunch happens. Cut p06_tummy_big and p07_more_please, which carried paediatric hunger-cue language, and cut p04_not_full, p04_more_food, p04_leaf_lunch and p05_mud_face as filler or verbatim repeats. p05_grumpy_tiny_smile is rewritten to the picture that actually exists - Chompy still holding the berry out, Grumpy's face unchanged - so it becomes the book's genuine failure: Grumpy refuses, and it costs Chompy the whole basket on p06_grumpy_full before Grumpy quietly empties it. p06_everyone_eats now names the melon and banana the picture shows. All 21 pages run present tense on a single frame, Chompy can see the ___, with the thing and the reply as the two changing elements; Chompy wants an enormous lunch, Sunny wants everybody eating in one place. Checked against the verified art inventory: p06_grumpy_full now shows what is drawn - Grumpy lying on the flat rock with the basket in front of him - so the text no longer says the basket is empty. p05_big_flat_rock and p06_everyone_eats name Sunny, Grumpy, Chompy and Bouncy, who are all drawn there, and p08_thank_you_ending names all three pals around the rock. The berry on p05_grumpy_tiny_smile is purple, as drawn. p08_leaf_hat_ending is the golden sunset page so the sun goes down in the text; p08_berry_mess_ending is pale day and says nothing about time. p03_ask_sunny is re-voiced so it is not a repeat of p02_cave_door, whose art it nearly duplicates. p06_everyone_eats is flagged for re-render only to fix Bouncy's footless springs.

**Art work orders:**

- `p06_everyone_eats` — Same four-pal picnic on the big flat rock with the watermelon and banana slices, but Bouncy drawn with three-toed feet above his coil springs instead of bare footless spring tips.

## `dp_ra_b_02_sunnys_rainy_day_rescue`

**Sunny's Rainy Day Rescue** — Level B · 22 pages · 5 cut · 1 re-renders

- **Sentence frame:** ___ is wet. "I want a dry ___," said ___.
- **Genuine failure:** `p05_grumpy_splash`
- **Cut:** `p04_wait`, `p05_honky_rain`, `p06_grumpy_ears`, `p06_leaf_rain`, `p06_dozy_again`

Hard bug fixed: Grumpy has no shell anywhere in the art, so p02_grumpy now reads rain dripping off Grumpy's back and p04_cave_grumpy names the club tail. Cut the five-page consent-checking sequence over a puddle splash (p06_dozy_again and the risk-assessment lines on p04_splash, p04_wiggly_tail, p05_tail_wave), cut the pure bounce page p03_dry_rock and the filler p04_wait, and cut Honky entirely with p05_honky_rain and p06_grumpy_ears - the latter never drew the ear-covering its text described. p05_leaf_roof is rewritten to the picture that exists, Sunny alone holding a leaf over herself with the rain still falling; the built shelter is only claimed one page later on p06_grumpy_dry. p07_leaf_boat no longer asks how the adventure should end and no longer jumps backward to page 5; both its choices now go to endings. The genuine failure is p05_grumpy_splash: Sunny asked Grumpy what he wanted, then covered him in mud, and he walks off - p06_sorry_grumpy costs her a page before p06_grumpy_smile repairs it. Built on p01_start's three readable moods: Grumpy wants a dry place, Dozy wants a dry nap, Sunny wants the rain to be fun. Checked against the verified art inventory: p05_grumpy_splash now matches the drawn shock rather than an exit; p06_grumpy_dry names the built A-frame leaf shelter that is actually drawn; p06_grumpy_smile puts Grumpy coming out of the dark cave mouth, which is where the one genuine softening beat is drawn; p08_quiet_ending names Dozy and Grumpy lying in the lantern-lit cave. p08_rainbow_ending carries no cape reference, since Sunny is drawn without her leaf cape only on that page. p03_dry_rock stays cut - the boulder is drawn wet, which is exactly why the page was a dead bounce. Gate fixes: restored p03_dry_rock on the Grumpy arm (the boulder really is drawn wet, so the text says so) and re-pointed p02_dozy's leaf choice to p03_puddle, where the broad leaf is actually drawn; shortest route is now 6 scenes. Both remaining endings now name Dozy and Grumpy.

**Art work orders:**

- `p08_grumpy_laugh_ending` — Same rainbow-sky meadow with Sunny laughing and Grumpy splashing in the shallow puddle, but add Dozy lying on the grass at the puddle's edge with his blue polka-dot pillow, watching them.

## `dp_ra_b_03_grumpy_almost_good_day`

**Grumpy's Almost-Good Day** — Level B · 29 pages · 6 cut · 7 re-renders

- **Sentence frame:** Grumpy ___ the ___. "___," said Grumpy.
- **Genuine failure:** `p04_ignore_chompy`
- **Cut:** `p05_chompy_delight`, `p06_fish_jumps`, `p06_warm_sun`, `p07_peaceful_stream`, `p07_berry_everywhere`, `p08_stone_ending`

The written list is gone from the story: p03_list_making, p04_tell_sunny and p06_twig_fixed are re-briefed around a single twig, which page one already puts on Grumpy's tail, so the book now has one concrete spine object instead of twelve abstract grievances. p08_stone_ending is cut and p07_tower_rebuilt becomes the stones ending, and p06_twig_fixed becomes the path ending, so nothing is a 75 per cent copy of the page before it. The confirmed same-picture pairs are resolved by cutting p06_warm_sun and p06_fish_jumps. p07_all_soaked is re-rendered into the book's continuous golden hour, and p08_almost_ending is re-rendered so the face actually changes. All three fossil ids get their conflict back: on p04_ignore_chompy Grumpy tells Chompy to go away and Chompy sits far down the bank - that is the genuine failure, and p05_quiet_stream is the page it costs before p04_splash_chompy can repair it; on p04_eat_secretly Grumpy eats the whole bowl before Dozy arrives; on p06_berry_chaos the berries go everywhere. Grumpy never almost-smiles here - he swings a tail, hooks a twig, hides a bowl. Fancy now wants something: a taller tower, and she says so. Checked against the verified art inventory: the twig on p01_start is one twig in front of Grumpy's face, not three at his tail, and p05_sunny_helps is corrected the same way - no ferns are held back and nothing is hooked with the tail, so both pages now describe the twig lying in front of him. p02_bush is differentiated from its near-identical twin p01_start by the twig being gone. p03_berry_protest is kept because the inventory confirms it reads as a distinct moment. p03_stones_fall describes the spilled heap that is drawn rather than a tower being struck. Re-renders: the three lettered-leaf pages, p06_berry_chaos (no chaos is drawn), p04_eat_secretly (saddle-pillow artefact), p07_all_soaked (only rainy page) and p08_almost_ending (unchanged face). Gate fixes: restored four real beats so no arm ends in four page turns - p04_look_at_stones and p06_rebuild_stones deepen the stones arm, p05_bouncy_berries deepens the berry game, and p07_one_thing_done gives the twig arm the beat where Sunny walks away down the empty path. p03_stones_fall's second choice now sends Grumpy back into the water rather than straight to Fancy. Shortest route is 6.

**Art work orders:**

- `p07_all_soaked` — Same three-pal shallow pool with Chompy, Grumpy and Wiggly dripping, but relit into the book's golden sunrise with clear sky and no rain falling.
- `p03_list_making` — Grumpy lying under the berry bush at sunrise, scowling at one brown twig on the sand in front of his face - no lettered leaf, no list, and his front claw drawn as an ordinary claw rather than a pencil point.
- `p04_eat_secretly` — Same sunrise berry-bush frame with Grumpy over his leaf bowl of berries, but Dozy drawn lying with his chin resting on the blue pillow on the ground, not with the cushion sitting on his back like a saddle.
- `p06_berry_chaos` — Same sunrise berry-bush frame but with the leaf basket knocked over and red berries scattered across the sand, Bouncy caught mid-bounce above them, and one berry balanced on Grumpy's snout.
- `p04_tell_sunny` — Grumpy lying under the berry bush at sunrise looking at one brown twig on the sand, Sunny sitting beside him in her leaf cape - no lettered leaf, no list, no pencil-point claw.
- `p06_twig_fixed` — A clear sandy path at sunrise with the brown twig pushed well off to one side and Grumpy walking down the open path alone - no lettered leaf, no strikethrough, no pencil-point claw.
- `p08_almost_ending` — Grumpy lying under the berry bush in golden sunset light with a face visibly different from page one - heavy brow lifted, one corner of the mouth up, eyes half closed.

## `dp_ra_b_04_bouncy_big_bounce`

**Bouncy's Big Bounce** — Level B · 30 pages · 9 cut · 2 re-renders

- **Sentence frame:** Bouncy bounces to the ___. Boing! ___ goes up.
- **Genuine failure:** `p05_legs_give_up`
- **Cut:** `p04_nearly_there`, `p05_launched_out`, `p06_dozy_wide_awake`, `p06_fancy_dismay`, `p06_over_stream`, `p06_bouncy_launched`, `p07_bouncy_repairs`, `p07_grumpy_sticky`, `p07_grumpy_stream`

39 pages of four-line risk assessment become 28 pages of two lines. Every pre-announced warning is gone; Bouncy now bounces first. The blue pillow stays and is used properly - it is the cave's landmark on p02_cozy_cave, p03_tiptoe_out and p05_cave_echo. p05_legs_give_up is the genuine failure and is written to the picture that exists: whole round berries spilled and Bouncy flat in the ferns with no boing left, and p06_everyone_sticky no longer claims the corner is tidy - the berries are still all over the sand and Bouncy is on the ground picking them up one at a time. p07_big_flat_rock is re-rendered because the hero shot draws Bouncy on bare metal springs with no feet. p04_bush_crash gets its crash back and p04_cave_chaos gets its poof of moss over Dozy. Cut the two Grumpy-almost-smiles pages, the sail-cleaning pages, and the interiority page p06_dozy_wide_awake. Fancy now wants something and says it once: she wants the bush to stand tall. Checked against the verified art inventory: p04_bush_crash is re-staged rather than re-rendered - the picture shows a smiling landing in soft leaves with berries loose on the path, so the arm's real damage now sits on p05_fancy_bush_hit, where the bent branch on the ground is the only damage drawn. p04_cave_chaos is likewise written to the dust puff that is drawn, with the consequence paid off on p05_cave_echo. Every leaf basket in the berry arm is corrected to the leaf bowl that is actually drawn, and p07_grumpy_nose describes the bowl balanced on Grumpy's back. p05_legs_give_up is re-rendered because the picture draws Bouncy still airborne over the ferns; p07_big_flat_rock is re-rendered for the footless springs. Gate fix: restored the mud arm's two middle pages, p05_mud_everywhere and p06_fancy_mud_sail, so p04_puddle_bounce no longer drops straight into an ending; the mud on Fancy is now caused by the clean-up she walks into. Shortest route is 6.

**Art work orders:**

- `p05_legs_give_up` — Same fern bank and scattered whole red berries, but Bouncy drawn sprawled flat in the ferns with both coil springs splayed and slack and no motion arc, and Chompy staring rather than laughing.
- `p07_big_flat_rock` — Same cheering group on the big flat grey rock at sunburst, but Bouncy's legs drawn complete - three-toed feet above each coil spring, planted on the stone, with no bare footless spring tips.

## `mw_ra_c_01_pip_stone_loud_thing`

**Pip and Stone: The Loud Thing** — Level C · 25 pages · 5 cut · 0 re-renders

- **Sentence frame:** Pip does one thing. Stone does another. The marsh answers.
- **Genuine failure:** `p08_stone_calls`
- **Cut:** `p03_luna_says_together`, `p05_together`, `p06_small_answer`, `p08_stone_carries`, `p09_answer_far_side`

Rewritten wholly in present tense; every past-tense narration line is gone and dialogue is tagged only with says. The coined three-syllable word toadling is replaced throughout by frog, which the art actually shows. Luna's single theme-statement page is cut rather than expanded, since she is drawn once and never again. p05_together (the emptiest frame) and p06_small_answer (a near-duplicate of p06_mossy_stone) are cut, and p08_stone_carries and p09_answer_far_side are cut to bring every path inside the 14-page cap. Every pair of pages that previously offered identical target sets now offers different ones. The reunion is staged on the page at p10_family_found instead of happening off-stage, and p08_stone_calls is now a real failure: Stone's loud call gets no answer at all, and the follow-up call at p09_pip_covers_ears drives the frog into hiding. The two endings differ in outcome: in one the wood hears the story, in the other nobody is told.

## `mw_ra_c_02_fern_wren_walking_garden`

**Fern and Wren: The Walking Garden** — Level C · 23 pages · 6 cut · 1 re-renders

- **Sentence frame:** Wren tries a spell. The pots walk. Fern sings them back.
- **Genuine failure:** `p05_too_late`
- **Cut:** `p06_wrong_book`, `p06_crystal_stream`, `p07_dewdrop_laughs`, `p09_tiny_bow`, `p10_wren_sorry`, `p11_fewer_books`

The MOTION/POTION near-homophone is gone: p06_wrong_book, the page that carried it and drew it on the book page, is cut. The plot no longer turns on reading anything at all - it turns on a colour a child can see. The recipe art says GREEN and ONE DROP; Wren's potion is purple and she tips in far more than one drop, and the reader can check her against the picture. The fewer/less grammar joke (p11_fewer_books) and the teacher's plenary question on p10_wren_sorry are both cut, and those two pages were near-identical art anyway. Dewdrop is dropped from this book so her body is never described in a book where she is drawn as a blob and elsewhere as a nymph, and Burrow is removed from the location line since he is never drawn. Everything is present tense, all tags are says, and the three endings differ in outcome: the garden fully restored, the potion locked away with one plant still twitching, or Fern deciding to let one pot keep its legs.

**Art work orders:**

- `p07_book_fix` — Same composition, same GREEN / ONE DROP / STIR SLOWLY lettering; redraw Wren's left hand on the book board, which is currently a mitten with fused fingers.

## `mw_ra_c_03_luna_burrow_star_shell_door`

**Luna and Burrow: The Star Shell Door** — Level C · 25 pages · 30 cut · 0 re-renders

- **Sentence frame:** Luna holds the star. Burrow reads the map. The door waits.
- **Genuine failure:** `p05_cracked_shell`
- **Cut:** `p03_marsh_path`, `p04_bird_riddle`, `p04_quiet_mist`, `p05_door_answer`, `p05_feather`, `p05_song_answer`, `p05_tunnel_wide`, `p06_map_sings`, `p06_stone_helps`, `p07_knock_reply`, `p07_luna_fixes`, `p07_moss_laughs`, `p07_stone_too_big`, `p07_wrong_shell`, `p08_key_joke`, `p08_polite_door`, `p08_star_room`, `p08_stone_guard`, `p09_blue_path`, `p09_door_answer`, `p09_echo_room`, `p09_kind_sleep`, `p09_luna_laughs`, `p09_star_choice`, `p10_free_seed`, `p10_funny_ending`, `p10_home_seed`, `p10_marsh_light`, `p10_stone_star`, `p10_wren_ending`

Cut from 55 pages to 24. The frame that was reused eight times is now used once (p06_hidden_door) and the star chamber that was reused nine times is now used twice (p08_map_inside, p09_gold_path). The five competing door mechanisms are reduced to one and enforced everywhere: old doors open for kind hands. The door is opened at exactly one page, p07_door_opens, and that page is reachable only after the rule is met - either by leaving a star that is not theirs (p05_kind_choice) or by Wren reading it out (p06_wren_warning, p07_wren_checks, whose KIND HANDS OPEN THIS DOOR lettering is kept because it is the best decodable text in the project). The abstract riddle at p04_bird_riddle and its whole marsh arm are cut. p03_stream_path no longer counts arrows, so the two-choice prompt no longer contradicts the three drawn on the map. The double negative at p05_kind_choice is replaced with a plain action. Burrow cracking the star at p05_cracked_shell is the one genuine failure and it costs him a solo page walking back. Stone is dropped entirely rather than named on pages where the reader would have to accept four near-identical Stone-and-door frames. The three endings differ in outcome: the star fish leave through the water gate and the earth door is never opened; the door opens onto a new place under a great tree; or they go home and the door stays shut. Book 3 remains painterly against three books of flat cel art - that is a re-render decision outside the text.

## `mw_ra_c_04_dewdrop_flint_lost_glow`

**Dewdrop and Flint: The Hidden Glow** — Level C · 28 pages · 52 cut · 0 re-renders

- **Sentence frame:** Flint lifts the lantern. Dewdrop listens to the water. The glow stays hidden.
- **Genuine failure:** `p06_lantern_pop`
- **Cut:** `p02_dewdrop_listens`, `p03_spark_bush`, `p04_fern_garden`, `p04_pip_glows`, `p04_spark_jar`, `p04_upstream_dark`, `p04_wren_spell`, `p05_crack_path`, `p05_fern_clue`, `p05_fish_answer`, `p05_fish_tunnel`, `p05_pip_lamp`, `p05_shadow_moth`, `p05_spark_water`, `p06_burrow_dig`, `p06_dewdrop_alone`, `p06_dry_path`, `p06_pip_mushroom`, `p06_stone_guard`, `p06_water_answer`, `p07_door_question`, `p07_dry_crawl`, `p07_footprint_voice`, `p07_frog_guard`, `p07_lantern_crack`, `p07_lantern_rolls`, `p07_moth_lantern`, `p07_moth_thanks`, `p07_pip_lamp_big`, `p07_pip_sits`, `p07_puddle_laugh`, `p07_tiny_door`, `p07_waiting_room`, `p08_crystal_moves`, `p08_frog_ending_path`, `p08_lantern_light`, `p08_pip_proud`, `p08_quiet_wait`, `p08_safe_promise`, `p08_team_pull`, `p08_two_crystals`, `p08_water_song`, `p09_bright_wrong`, `p09_everyone_helps`, `p09_fern_repairs`, `p09_stream_returns`, `p09_wren_rule`, `p10_frog_ending`, `p10_lantern_ending`, `p10_pip_ending`, `p10_splash_ending`, `p10_wren_ending`

Reframed exactly as instructed: the glow is HIDING, not gone. The glow is the small round gold creature the art actually draws, and p03_lantern_path states the rule the pictures follow - blue is the water's own light, gold is the glow - so no page has to deny a glowing stream, a lit lantern or a luminous Dewdrop. Cut from 80 pages to 26. The frog runner is gone (p06_stone_guard, p07_frog_guard, p08_frog_ending_path, p10_frog_ending), all 21 undercooked flat-backdrop pages are cut rather than re-encoded, and so are p07_pip_sits (face beam), p08_quiet_wait (glow drawn as a cat), p07_door_question (unsupported doorway), p07_waiting_room (two chairs in a bare room), p10_splash_ending (omits both leads) and both squiggle-script pages, p09_wren_rule and p10_wren_ending, which printed the moral in capitals beside thirty lines of undecodable fake handwriting. Pip is dropped from the book entirely so his book-4-only wings and cheek mark are never described, and Dewdrop's body is never described anywhere. Four of the five Pip-lamp pages went with him. Seven identical endings become three that differ in outcome: the glow goes back into the stream, the glow picks a different bend and leaves, or the glow stays in its cave and Flint and Dewdrop stay with it. The one genuine failure is p06_lantern_pop - Flint goes down in the water and his lantern will not relight - and the reader carries the dark forward from there.

## `story_quest_short_a_sam_pam_01`

**Sam and Pam and the Cat** — Level Early · 10 pages · 0 cut · 0 re-renders

- **Sentence frame:** ___ has the ___.
- **Genuine failure:** `page-05`

Rebuilt as a true decodable. Every content word is now short-a CVC (Sam, Pam, Dad, am, cat, mat, bag, map, van, jam, has, pats, bad) and every other word is on the declared list, which is now genuinely inside Fry's first 25 (I, a, the, is, in, on, and, it). Everything that broke the cycle is gone: laughs, tight, route, field, carefully, buckled, begun, beside, safe, and above all park, the r-controlled word that was the destination and appeared five times. The destination is never named, because it cannot be named in short a and the art carries no lettering, so the map is never asked to say a word. No page exceeds eight words. page-07 keeps its art but takes a different beat from page-04: page-04 puts the jam in, page-07 is the packed bag being patted shut. The genuine failure is page-05: the cat parks itself on the map and they cannot use it, which is exactly what the picture shows. The two endings differ in outcome - page-10 ends in the van on the way out, page-09 ends arrived with the cat in its carrier. All ten drawn images that survive are reused untouched; this is the strongest art set in the project.

---

# Outstanding art work

**18 pages need a re-render.** No new art is required — every one of these is
a corrected version of an image that already exists, at the same size and in the same style.

| Quest | Page | Brief |
|---|---|---|
| `mp_a` | `p03_meet_splashy` | Same meeting shot of Muddy and Splashy on the mud edge, but delete the blank two-board signpost at far left; a lettered-looking prop with no letters on it stops beginning readers. |
| `mp_a` | `p08_wave_from_tree` | Same busy group shot of Shy and Cuddly waving from the low branch with Bouncy below, but reattach Bouncy's raised coil-spring leg to her body; it currently reads as detached and floating. |
| `mp_a` | `p08_farm_view` | Same wide shot of Bouncy and Speedy under the oak with the barn and pond small in the distance, but give Bouncy the open map in her hoof-hands and separate the two bodies so Speedy has exactly one tail. |
| `mp_a` | `p09_tiny_snack_ending` | Same shot of Bouncy, Tiny and Speedy sharing the small red snack under the oak, but add the folded paper map lying open on the grass beside Tiny. |
| `mp_a` | `p04_tiny_in_pot` | Same shot of Tiny at the bottom of the pot on a knotted string, but remove the gold bell so only the red hat is down there, and put the rope end in Tiny's paws instead of ending in mid-air. |
| `mp_a` | `p09_fancy_brave_ending` | Same shot of Clucky handing Brave a red feather, but Clucky must be wearing her red hat and drawn at the same scale and in the same painterly style as p07_clucky_happy. |
| `dp_b` | `p06_everyone_eats` | Same four-pal picnic on the big flat rock with the watermelon and banana slices, but Bouncy drawn with three-toed feet above his coil springs instead of bare footless spring tips. |
| `dp_b` | `p08_grumpy_laugh_ending` | Same rainbow-sky meadow with Sunny laughing and Grumpy splashing in the shallow puddle, but add Dozy lying on the grass at the puddle's edge with his blue polka-dot pillow, watching them. |
| `dp_b` | `p07_all_soaked` | Same three-pal shallow pool with Chompy, Grumpy and Wiggly dripping, but relit into the book's golden sunrise with clear sky and no rain falling. |
| `dp_b` | `p03_list_making` | Grumpy lying under the berry bush at sunrise, scowling at one brown twig on the sand in front of his face - no lettered leaf, no list, and his front claw drawn as an ordinary claw rather than a pencil point. |
| `dp_b` | `p04_eat_secretly` | Same sunrise berry-bush frame with Grumpy over his leaf bowl of berries, but Dozy drawn lying with his chin resting on the blue pillow on the ground, not with the cushion sitting on his back like a saddle. |
| `dp_b` | `p06_berry_chaos` | Same sunrise berry-bush frame but with the leaf basket knocked over and red berries scattered across the sand, Bouncy caught mid-bounce above them, and one berry balanced on Grumpy's snout. |
| `dp_b` | `p04_tell_sunny` | Grumpy lying under the berry bush at sunrise looking at one brown twig on the sand, Sunny sitting beside him in her leaf cape - no lettered leaf, no list, no pencil-point claw. |
| `dp_b` | `p06_twig_fixed` | A clear sandy path at sunrise with the brown twig pushed well off to one side and Grumpy walking down the open path alone - no lettered leaf, no strikethrough, no pencil-point claw. |
| `dp_b` | `p08_almost_ending` | Grumpy lying under the berry bush in golden sunset light with a face visibly different from page one - heavy brow lifted, one corner of the mouth up, eyes half closed. |
| `dp_b` | `p05_legs_give_up` | Same fern bank and scattered whole red berries, but Bouncy drawn sprawled flat in the ferns with both coil springs splayed and slack and no motion arc, and Chompy staring rather than laughing. |
| `dp_b` | `p07_big_flat_rock` | Same cheering group on the big flat grey rock at sunburst, but Bouncy's legs drawn complete - three-toed feet above each coil spring, planted on the stone, with no bare footless spring tips. |
| `mw_c` | `p07_book_fix` | Same composition, same GREEN / ONE DROP / STIR SLOWLY lettering; redraw Wren's left hand on the book board, which is currently a mitten with fused fingers. |

## Separate from this rewrite — image issues that text cannot fix

1. **`meadow-pals/brave-tiny-rescue` is rendered in two different styles.** Roughly half the
   pages are soft painterly and half are thick-outline flat cartoon, and a child taking the
   hat route crosses the boundary between `p03_pot` and `p03_wall`. Clucky's hue and scale
   swing with it. This needs a style-unification pass on one half of the book.

2. **`moonwood/luna-burrow-star-shell-door` — 8 ending images are a different render batch**
   at 1672x941 / 1677x938 / 1672x940 against 1536x864 for the other 47. They are lighter,
   airbrushed, thinner-lined, and two are full daylight in a book that is otherwise night.
   Non-round dimensions mean crop or upscale, not clean output.

3. **`moonwood/dewdrop-flint-lost-glow` mixes three pipelines** — 1376x768 (x63),
   1536x864 (x16) and one 2752x1536. 21 images are visibly undercooked: flat unmodulated
   backdrops with no world in them, not compression artefacts. Most are cut by this rewrite.

4. **`moonwood/pip-stone-loud-thing` is entirely 1376x768** and painterly, against three
   books of flat cel art. It does not read as the same series.

5. **52 MB of orphaned art still ships in `public/`** — `dino-pals/bossy-picnic-mix-up`
   (38 images, 39 MB) and `dino-pals/zippy-flappy-fast-slow` (27 images, 13 MB). Neither
   quest is in the live export. Safe to delete.

6. **210 images and 210 audio files are now unused** following the cuts. Retired page ids
   are recorded per quest in `retiredPageIds` so nothing is lost by accident. Decide whether
   to delete the assets or keep them for a future expansion before pruning.

7. **Character drift worth a decision, not a bug:** Dewdrop is a round blue blob in
   `fern-wren` and a humanoid water nymph in `dewdrop-flint`. Pip gains wings and a glowing
   cheek mark in `dewdrop-flint` that he has in neither other book. Luna's owl subtype flips
   between books. The rewrite avoids describing any of their bodies, so nothing contradicts
   the art today, but the series has no model sheet and will drift again.

8. **What is genuinely good, and should be protected:** across 129 Dino Pals images there
   are no melted faces, no extra or missing limbs, no mangled hands and no duplicated
   characters — a well-controlled run. `sam-pam` is the strongest set in the project:
   consistent characters, correct hands on every page, real prop continuity, and an actual
   change of location at the end. `dp_ra_b_02 p01_start` shows three distinct readable moods
   in one frame. `luna p07_wren_checks` carries the only rendered lettering in the project
   that a Level C child can actually decode.

## Correction to the 2026-07-26 audit

The first-pass audit flagged rendered text in the artwork as possibly misspelled, based on
OCR reading `RONG`, `REEN`, `EAM` and `Kat`. **Those were OCR false positives.** Viewing the
images confirms every rendered word is correctly spelled: `GRUMPY'S LIST / 1 WRONG SLEEPING
SPOT / 2 TWIGS BY PATH / 3-12 TEN MORE THINGS`, `MOTION POTION`, `GROWING POTION`,
`WALK SOFTLY BY THE STREAM`, and the Sam & Pam map carries no lettering at all. The audit
flagged them as needing visual confirmation and they were wrong.

The real problem with that lettering was never spelling — it was decodability. All-caps on
a curved baseline, a possessive apostrophe-s, `-ing` suffixes, `th`/`ng` digraphs and a
numeral range (`3-12`) are all far above Level B. That is why the list is cut rather than
re-lettered.

Two other first-pass findings were also wrong and are corrected here: the hat on
`mp_ra_a_01 p04_hat_found_early` **is** drawn muddy, and the pillow on
`dp_ra_b_04 p07_dozy_advice` **is** drawn — it is the most consistent prop in that book,
appearing on nine pages, not an import from another story.
