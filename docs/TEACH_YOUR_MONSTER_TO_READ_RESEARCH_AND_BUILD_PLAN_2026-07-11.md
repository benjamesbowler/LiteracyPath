# Teach Your Monster to Read: research, mechanics, art style, and a LiteracyPath build plan

Date: 2026-07-11

Purpose: explain how Teach Your Monster to Read appears to be developed, how its learning mechanics and art direction work, and how LiteracyPath can build something with similar educational strength without copying the brand, characters, game names, or artwork.

Evidence labels used throughout:

- **Observed** means confirmed from an official Teach Your Monster source, an official fact-file PDF, the EEF phonics evidence page, or this repo.
- **Derived** means a conclusion that follows from observed facts.
- **Inferred** means a design or production guess. It is useful, but it should be verified by building or testing.

## Executive summary

Teach Your Monster to Read works because it is not just a set of phonics mini-games. It is a full learning loop wrapped in a child-owned adventure: create a monster, travel through fantasy islands, meet characters, practise a new sound or word, win a short game, collect a story-world reward, repair the spaceship, unlock the next island, and keep revising old material. **Observed:** its official materials describe three linked games covering the first two years of reading, from matching letters and sounds through sentences and little books. Sources: [Teach Your Monster to Read](https://www.teachyourmonster.org/teachyourmonstertoread), [Game 1 fact file](https://www.teachyourmonster.org/static/89ca02c4de4f4b63a05e4469182faf69/53697/Teach_Your_Monster_To_Read_-_Game_1_-_First_Steps.pdf), [Game 2 fact file](https://www.teachyourmonster.org/static/851ac3eac5f79105506a68c87211f3d0/53697/Teach_Your_Monster_To_Read_-_Game_2_-_Fun_With_Words.pdf), [Game 3 fact file](https://www.teachyourmonster.org/static/d8bc7bb45afab75ef0f5fd0a854538ad/53697/Teach_Your_Monster_To_Read_-_Game_3_-_Champion_Reader.pdf).

The key development model is expert-led, classroom-tested, and multidisciplinary. **Observed:** the official about page says Teach Your Monster works with academics and experts, includes player testing in classrooms from early project stages, and uses game designers, UX/UI specialists, artists, animators, and creative technologists. Source: [About Teach Your Monster](https://www.teachyourmonster.org/about-us/).

The educational spine is synthetic phonics plus cumulative practice. **Observed:** the official game page says the game covers grapheme-phoneme correspondences, blending, segmenting, tricky words, and reading full sentences. **Observed:** the EEF phonics evidence page says phonics has an average positive impact of about five additional months over a year and should be systematic, explicit, and matched to the child's current skill. Source: [EEF phonics toolkit](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics).

The art style is not PS1, not realistic 3D, and not generic edtech flat art. It is a whimsical illustrated game world with chunky readable shapes, friendly monsters, fantasy islands, kings/queens, animals, rocket/spaceship objects, high-colour visual rewards, and deliberately simple focal screens. **Observed:** official press-centre imagery names and shows island adventure maps, space mini-games, feed-the-monster, ducks-in-pond, sky-writer, hide-and-seek, book parts, and make-a-match screens. Source: [Press Centre](https://www.teachyourmonster.org/press-centre-teach-your-monster-to-read).

For LiteracyPath, the strongest version is not another isolated arcade game. The closest equivalent would be a "Reading Quest" product layer: a persistent world map, a child-owned Pal/avatar, 12 to 18 curriculum stops, 6 reusable mini-game templates, adaptive practice mode, and teacher/parent stats. **Observed in this repo:** the app already has lazy-loaded games in `src/components/learn/games/games/index.js`, game metadata in `src/data/learnGamesData.js`, progress/checkpoint saving in `GamePlayer`, audio/music hooks, guided-reading data, word lexicon infrastructure, and many validation scripts. The opportunity is to connect these into a coherent reading adventure instead of adding more standalone games.

## Source map

Primary Teach Your Monster sources:

- [Teach Your Monster home](https://www.teachyourmonster.org/) - current product family, nonprofit positioning, public scale.
- [About Us](https://www.teachyourmonster.org/about-us/) - funding, mission, development process, experts, classroom testing.
- [Teach Your Monster to Read game page](https://www.teachyourmonster.org/teachyourmonstertoread) - product scope, three-game structure, reading skills covered.
- [Practice Mode](https://www.teachyourmonster.org/teachyourmonstertoread/practice-mode) - placement/practice loop, teacher tools, grapheme/phoneme and tricky-word selection.
- [Stats](https://www.teachyourmonster.org/teachyourmonstertoread/stats) - teacher/parent progress monitoring.
- [Press Centre](https://www.teachyourmonster.org/press-centre-teach-your-monster-to-read) - mini-game/media examples and official fact files.
- [Game 1: First Steps PDF](https://www.teachyourmonster.org/static/89ca02c4de4f4b63a05e4469182faf69/53697/Teach_Your_Monster_To_Read_-_Game_1_-_First_Steps.pdf) - early letter-sound and first blending content.
- [Game 2: Fun With Words PDF](https://www.teachyourmonster.org/static/851ac3eac5f79105506a68c87211f3d0/53697/Teach_Your_Monster_To_Read_-_Game_2_-_Fun_With_Words.pdf) - GPC 22-46, CVC/CVCC/CCVC, tricky words, sentences.
- [Game 3: Champion Reader PDF](https://www.teachyourmonster.org/static/d8bc7bb45afab75ef0f5fd0a854538ad/53697/Teach_Your_Monster_To_Read_-_Game_3_-_Champion_Reader.pdf) - full-sentence reading, consolidation, books, reduced audio support.

Independent literacy evidence:

- [Education Endowment Foundation: Phonics](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics).

Local LiteracyPath files inspected:

- `src/components/learn/games/GamePlayer.jsx`
- `src/components/learn/games/games/index.js`
- `src/data/learnGamesData.js`
- Graphify query around game/phonics architecture.

## What Teach Your Monster to Read is

### Product shape

Teach Your Monster to Read is a free-to-play web reading game family from Teach Your Monster, a nonprofit funded by The Usborne Foundation. **Observed:** the official about page says The Usborne Foundation was established by Peter Usborne in 2011, and that Teach Your Monster Ltd is a nonprofit funded by that foundation. The about page also states the first game, Teach Your Monster to Read, reached more than 30 million players, was approved by the UK government's Hungry Little Minds campaign in 2019, and won a BAFTA in 2015.

The current Teach Your Monster product family includes more than reading. **Observed:** the homepage lists Teach Your Monster to Read, Reading for Fun, Number Skills, and Adventurous Eating. But the first and most important product pattern is still the reading game: a child-friendly adventure that hides systematic practice inside a reward loop.

### Reading-game structure

Teach Your Monster to Read is split into three big reading games:

1. **First Steps**
   - **Observed:** for children just starting letters and sounds.
   - Covers the first two weeks of reading according to the official game page.
   - Focuses on early grapheme-phoneme correspondences, initial sounds, and the beginning of blending/segmenting VC and CVC words.

2. **Fun With Words**
   - **Observed:** for children who are confident with basic letter-sound combinations and starting to read sentences.
   - Covers GPCs 22-46 in the Game 2 fact file.
   - Adds CVC/CVCC/CCVC blending/segmenting, tricky words, and simple caption/story contexts.

3. **Champion Reader**
   - **Observed:** for children reading short sentences and knowing the basic letter-sound combinations.
   - Consolidates the first-year/early second-year reading sequence.
   - Adds more sentence reading, all key phonemes/graphemes, tricky-word revision, books, and later tasks with less audio support.

The product is supported by:

- **Practice Mode.** **Observed:** the official practice page describes a personalized practice tool, a quick quiz, teacher-added players, progress monitoring, selectable grapheme/phoneme sets, tricky-word sets, flashcards, games, lessons, and printables.
- **Stats.** **Observed:** the official stats page says parents/teachers can monitor game progress, percentages, stars, game time, letter-sound combinations played/taught, and reader progress/book readiness.
- **Printables and teacher resources.** **Observed:** the game page and practice page mention printable resources and classroom support.

### The core promise

Teach Your Monster to Read makes early reading feel like a magical adventure, but the underlying learning objective is narrow and serious:

- hear a sound;
- see the grapheme;
- match grapheme to phoneme;
- identify sounds in words;
- blend sounds into words;
- segment words into sounds;
- learn tricky words;
- read captions and sentences;
- read little books;
- revise and consolidate.

**Derived:** the game succeeds because it uses a large, playful wrapper to make a small number of high-value reading actions feel varied, repeated, and meaningful.

## How it appears to be developed

### 1. Nonprofit mission first, product second

**Observed:** Teach Your Monster presents itself as a nonprofit making learning games for children. Its about page says the goal is to use games and technology to create free educational resources, including for children furthest from help.

This matters because the product is not optimized like a typical ad-funded app. It can be slower, calmer, more teacher-friendly, and more curriculum-aligned. It can favour long-term trust over aggressive monetization.

**LiteracyPath lesson:** do not design the equivalent as "an arcade game with phonics labels." Design it as a learning product that happens to be joyful. The child's progress, teacher visibility, and curriculum spine must be as important as the moment-to-moment game feel.

### 2. Built with education experts

**Observed:** the about page says Teach Your Monster works with leading academics and experts. It names reading-related experts from the University of Roehampton, Sendat, and BookTrust across its reading products.

**Observed:** the official game page says Teach Your Monster to Read was designed in collaboration with leading academics.

**Derived:** the sequence and tasks were probably not invented by game designers alone. The reading progression appears to be a curriculum map first, then game mechanics second.

**LiteracyPath lesson:** every level should come from a curriculum progression table, not from whatever words are convenient for a game mechanic. If a game says it teaches `/sh/`, every correct answer, distractor, audio cue, sentence, and image must be aligned to that focus.

### 3. Classroom player testing from early stages

**Observed:** the about page says player testing in classrooms is included from the early stages of projects.

This is a major clue. Teach Your Monster's mechanics are unusually simple compared with normal games. That is probably not accidental. Early readers cannot handle too much input complexity, dense UI, tiny text, or punishment-heavy play while also processing sounds and letters.

**Derived:** classroom testing likely forces these decisions:

- large click/tap targets;
- one literacy decision at a time;
- simple instructions;
- cheerful feedback;
- repeated formats;
- minimal reading required outside the target skill;
- audio support for children who cannot yet read instructions;
- short rounds;
- forgiving failure loops.

**LiteracyPath lesson:** a LiteracyPath equivalent needs live child testing or at least strict adult QA with child-observable criteria: "Could a 4-6 year old understand what to do within 5 seconds?" and "Is the literacy target visible without reading a long instruction?"

### 4. Multidisciplinary production team

**Observed:** the about page lists game designers, UX/UI specialists, artists, animators, creative technologists, and more.

**Derived:** the polished feel comes from the overlap of disciplines:

- game designers create short challenge loops;
- literacy experts define the scope and sequence;
- UX specialists reduce confusion;
- artists create an inviting world;
- animators make feedback feel alive;
- engineers make progress reliable;
- audio designers make instructions and rewards accessible.

**LiteracyPath lesson:** trying to solve the whole thing with only code will under-deliver. The product needs a repeated pipeline: curriculum brief -> level data -> art brief -> audio brief -> mini-game template -> child/teacher QA -> analytics check.

### 5. Developed around repetition without making it feel repetitive

**Observed:** the Game 1 PDF explicitly frames games as useful for engagement, sustained attention, repetitive practice, rewards, agency, appropriate feedback, and confidence-building.

**Derived:** Teach Your Monster's trick is not avoiding repetition. It is changing the wrapper around repetition. A child may practise the same sound in a cave, race, pond, animal rescue, rocket task, or book screen, but the underlying cognitive move is still a grapheme-phoneme match or blend.

**LiteracyPath lesson:** build fewer mechanics, but reuse them elegantly. Six excellent mini-game templates can cover 200 levels if the maps, characters, rewards, and skill targets rotate.

## Learning mechanics style

### The macro loop

The macro loop looks like this:

1. The child owns a character.
2. The story gives a reason to travel.
3. A map shows the next destination.
4. A friendly NPC introduces a target sound/word/task.
5. A short mini-game asks the child to apply the target.
6. The child receives immediate feedback.
7. The child earns a collectible.
8. The collectible repairs/unlocks something in the story.
9. Previous sounds and words return in review.
10. The map moves forward.

**Observed examples:** Game 1 has monster creation, a spaceship journey, island kings, spaceship parts, and prizes. Game 2 has eight islands, kings/queens, solar flowers, and a spaceship. Game 3 has seven islands, island rulers, sunstars, books, and prizes.

**Derived:** the macro loop does three jobs:

- gives meaning to repetition;
- shows visible progress;
- makes mistakes feel like part of an adventure rather than a test.

### The micro loop

Most mini-games appear to use a compact micro loop:

1. Hear or see the target.
2. Look at 2-5 options.
3. Choose the option that matches.
4. Get a strong correct/incorrect animation.
5. Repeat with slight variation.
6. Win the round after enough correct choices.

This is not mechanically complex. It is intentionally light because the literacy skill is the actual challenge.

### Skill progression

Teach Your Monster's reading progression has four broad bands:

1. **Letters and sounds**
   - match letter to sound;
   - identify the target sound;
   - begin initial-sound awareness.

2. **Blending and segmenting**
   - blend VC/CVC words;
   - segment words into phonemes;
   - build words from letters;
   - later handle CVCC, CCVC, and CCVCC words.

3. **Tricky words and sentence reading**
   - read high-frequency/tricky words;
   - apply words in captions;
   - choose words in sentence contexts;
   - read short sentences.

4. **Books and consolidation**
   - read simple books;
   - revise all GPCs;
   - reduce audio support;
   - practise across mixed tasks.

**Observed:** these bands come directly from the official game page and the three fact-file PDFs.

### Mini-game taxonomy

The exact implementation details are not public, but the official fact files and press-centre labels give enough to identify the learning patterns.

| Officially referenced activity | Surface action | Literacy action | Why it works | LiteracyPath equivalent |
| --- | --- | --- | --- | --- |
| Air Race | Fly through the correct item | Match sound/grapheme | Fast but focused recognition | Rocket/hover race through target sounds |
| Sheep Rescue | Rescue/select the correct animal/sound | Match target sound | Emotional rescue reward | Pal rescue with sound gates |
| Ducks in Pond / Duck Pond | Select ducks/items in water | Sound/word recognition | Cute repeated choice field | Pond/lake fishing for graphemes |
| Chowing / pond initial sounds | Feed/select by initial sound | Initial phoneme isolation | Physical feeding is rewarding | Feed Pal only words with target sound |
| Word Cannon | Fire letters/words | Blend/build/read words | Strong cause-effect | Word blaster with decodable-only options |
| Animal Grid | Grid-based selection | Sound/word matching | Simple scan-and-choose | Safari grid with animated animals |
| Litter Picking | Collect correct objects | Sort/read target items | Turns cleanup into practice | Meadow cleanup for target sounds |
| Flower Power | Grow/collect flowers | GPC/word choice | Visible growth reward | Letter garden as review mode |
| Mountain Climb | Climb via correct answers | Sequenced recognition | Progress is spatial | Beanstalk/mountain climb |
| Rocket Rescue | Save/repair through choices | Blending/word reading | Story stakes | Fix Pal craft with correct words |
| Dark Cave | Explore/revise | Review old items | Mystery supports repetition | Review cave with mixed targets |
| Word Reading | Read words directly | Decoding fluency | Removes extra wrapper | Speed-read panel after practice |
| Cows and Sheep / sentence tasks | Sort or read simple captions | Sentence comprehension | Contextualizes word reading | Sentence field with picture support |
| Easy/Hard Books | Read books | Fluency/comprehension | Authentic reading payoff | Connect to Guided Reading books |
| Match Card | Flip/match cards | Tricky-word memory | Low-pressure repetition | Existing Sight Word Memory improved |
| Words in Space | Catch/select words | Tricky-word recognition | Arcade motion | Rocket Run variant for tricky words |
| Sorting Game | Sort words | Classification | Reinforces categories | Sound Sort Factory with story purpose |
| Island Practice | Review station | Adaptive practice | Consolidates before moving on | Practice Den for weak sounds |

**Important:** each of these is a thin interaction shell. The real power is in the sequencing, feedback, and repeated revisiting.

### Adaptive and practice mechanics

Teach Your Monster's main adventure appears mostly sequence-based, while Practice Mode adds more explicit personalization.

**Observed:** Practice Mode can quiz a child, determine what they know, let teachers choose grapheme/phoneme and tricky-word sets, and give extra practice on items the child finds difficult.

**Derived:** the best design is hybrid:

- main quest = motivating linear progression;
- practice mode = targeted spaced revision;
- teacher dashboard = visibility and override.

### Feedback mechanics

Teach Your Monster uses strong child-readable feedback:

- sound effects;
- character reactions;
- animations;
- collectibles;
- map progress;
- stars/points;
- prizes for the monster/spaceship.

**Derived:** feedback is not only "correct/incorrect." It shows consequence in the world. A correct answer may repair the spaceship, grow a flower, rescue an animal, unlock an island, or earn a costume item.

**LiteracyPath requirement:** every correct answer should create visible state change. A star counter alone is not enough.

### Failure mechanics

The official materials emphasize confidence, feedback, and struggling readers. **Derived:** failure must be gentle:

- wrong choices should not hard-punish;
- the game should replay audio or isolate the target;
- after repeated errors, reduce distractor difficulty;
- after success, restore difficulty;
- avoid public failure language.

**LiteracyPath requirement:** use "Try again" feedback plus scaffolding. Do not make children lose a level because they misheard one sound.

## Art and graphics style

### High-level art direction

Teach Your Monster to Read has a whimsical children's storybook-game look:

- soft, bright fantasy worlds;
- friendly monsters;
- weird but readable silhouettes;
- storybook islands;
- animal helpers;
- playful kings and queens;
- rockets and spaceship parts;
- collectible flowers, sunstars, books, trophies, cakes, ducks, animals, and decorations;
- UI that feels like part of a children's game, not a school worksheet.

**Observed:** these motifs are repeatedly named in the fact files and press-centre media labels.

### What the style is not

It is not:

- PS1 racing realism;
- classroom worksheet UI;
- generic flat SaaS illustration;
- "PNG background with letter blocks over it";
- over-detailed fantasy art that distracts from reading;
- tiny text-heavy game UI.

### Shape language

**Inferred from official media labels and visible page previews:** the shape language likely uses:

- large simple silhouettes;
- exaggerated character proportions;
- rounded monsters;
- big eyes and expressive faces;
- playful asymmetry;
- toy-like spaceships and props;
- clear figure/ground separation;
- high contrast between interactive objects and background.

How to check: collect official screenshots from the press centre and make a contact sheet sorted by game, then annotate silhouettes, palette, prop scale, UI placement, and text size.

### Colour style

**Inferred:** the palette is broad and cheerful rather than locked to one hue. It likely uses:

- saturated reward objects;
- softer world backgrounds;
- high contrast for clickable objects;
- colour-coded islands/sets;
- warm highlights for friendly feedback;
- darker caves/space levels for variety.

This matters because children need the target object to pop instantly. Background art can be charming, but answers must be visually dominant.

### Animation style

**Inferred:** the animation style is probably short, readable, and state-based rather than cinematic:

- idle bobs;
- blink/smile loops;
- correct answer burst;
- wrong answer wobble;
- collectible fly-to-inventory;
- map movement;
- monster costume changes;
- object transformation after repair.

**LiteracyPath lesson:** animation should clarify the literacy action. A correct `/sh/` choice should be celebrated by the object moving to the monster/rocket/book, not by unrelated confetti only.

### UI style

The UI is child-first:

- large targets;
- short instructions;
- audio support;
- icon-heavy feedback;
- clear next step;
- low number of simultaneous choices;
- progress visible on maps and rewards.

**Derived:** it avoids the trap of showing too many scores, timers, currencies, or adult labels during play.

### Text treatment

The text target must be the sharpest object on the screen.

Rules for our version:

- never bake answer text into background art;
- never put text on a low-contrast moving object;
- never use decorative fonts for target graphemes/words;
- use a school-friendly rounded sans for UI and a decodable/print-friendly face for reading targets;
- keep letters upright, front-facing, and isolated;
- support digraphs as joined units where educationally appropriate (`sh`, `ch`, `th`);
- pair ambiguous cloze prompts with a picture cue.

This addresses a recurring LiteracyPath risk: if the child sees `sh_p` without context, "ship" and "shop" are both plausible. The target must include a picture or sentence context.

## Development principles behind the game

### Principle 1: Curriculum is the source of truth

The game does not appear to start from "what is fun to click?" It starts from the phonics progression.

For LiteracyPath, every level should be generated from:

- skill focus;
- taught graphemes;
- review graphemes;
- decodable word bank;
- allowed tricky words;
- sentence patterns;
- required audio;
- required images;
- distractor rules;
- mastery threshold.

### Principle 2: One literacy decision per moment

Each play beat should ask one clear question:

- Which letter says /m/?
- Which word starts with /sh/?
- Which letters build "ship"?
- Which word completes the sentence?
- Which tricky word did you hear?

Do not ask the child to steer, time a jump, read four words, avoid hazards, and remember the target all in the same half-second unless it is a later fluency challenge.

### Principle 3: Repetition is disguised as story progress

The child may repeat the same sound many times, but the wrapper changes:

- first hear it from a character;
- then collect it;
- then use it in a word;
- then review it in a cave;
- then read it in a sentence;
- then find it in a book.

### Principle 4: The avatar creates ownership

**Observed:** Game 1 lets the child choose/change/design a monster and collect prizes for it.

This is not decoration. It is motivation architecture. A child who owns the monster wants to continue.

LiteracyPath should use the existing Pals world, but allow:

- choose a Pal;
- name it;
- unlock costumes;
- unlock den decorations;
- unlock world badges;
- show collected books.

### Principle 5: The map makes learning visible

Maps turn abstract curriculum progress into physical travel. "I learned six GPCs" is abstract; "I crossed Meadow Dock and opened Moonwood Cave" is meaningful.

LiteracyPath should show:

- worlds by difficulty/phonics band;
- stops for each set;
- completed stops;
- review stops;
- locked next area;
- personal best or mastery markers.

### Principle 6: Assessment is embedded, not separate

Teach Your Monster appears to assess through gameplay and then exposes progress in stats. The child mostly experiences adventure; the adult sees data.

LiteracyPath should record:

- target;
- response;
- attempt count;
- response time;
- support level used;
- whether the item was new or review;
- whether the child succeeded after scaffold;
- mastery status.

### Principle 7: Practice mode is the safety net

Main quest should not be infinitely adaptive to the point that a child never progresses. Practice mode catches weak items and lets adults assign support.

## What we can safely imitate

We can imitate:

- curriculum-first adventure structure;
- avatar ownership;
- island/world map progression;
- short mini-game templates;
- grapheme/phoneme practice;
- blending/segmenting progression;
- tricky-word practice;
- full-sentence reading;
- little-book payoff;
- practice mode;
- teacher stats;
- classroom testing loop;
- clear child-readable art direction.

We should not copy:

- the Teach Your Monster name;
- monster designs;
- exact island characters;
- exact maps;
- exact mini-game names;
- exact artwork;
- exact reward names like "sunstars" or "solar flowers";
- exact spaceship premise if too close;
- exact UI layouts from screenshots.

The safest route is a LiteracyPath-native quest using the existing Pal worlds: Meadow Pals, Dino Pals, and Moonwood Pals.

## LiteracyPath app fit

### Current app assets and rails

**Observed in repo:**

- `src/components/learn/games/games/index.js` lazy-loads game components by id.
- `src/data/learnGamesData.js` defines game ids, titles, skills, categories, icons, descriptions, and arcade surfaces.
- `src/components/learn/games/GamePlayer.jsx` handles full-screen play, score, progress meter, checkpoints, saved results, sound toggles, speech, game music, pause/resume, and completion.
- Existing arcade games include Rocket Run, Letter Leap, Sound Racer, Word Bridge, Sound Beat, Rhyme Pop, Sound Safari, Reel & Read, Sentence Grove, Sentence Express, and Grammar Grind.
- `learnGamesData.js` already contains CVC words, sight words, rhyming pairs, sentence data, sentence-fix rounds, word families, magic-e families, vowel-team families, and syllable words.
- Graphify shows many relevant validation and content tools: runtime question coverage, early phonics validity, rhyming coverage, ambiguity checks, media audits, guided-reading books, lexicon, assessment registries, and skill routing checks.

### Strategic implication

LiteracyPath already has many individual game pieces. What it lacks, compared with Teach Your Monster, is a unified quest layer that turns those pieces into one coherent reading journey.

**Derived:** the most Teach-Your-Monster-like move is not to build "another game." It is to build a connected "Reading Quest" shell that reuses and improves the best of the existing games as stations.

## Proposed LiteracyPath equivalent: Reading Pals Quest

Working title: **Reading Pals Quest**

Alternative names:

- Pal Phonics Quest
- Letter Lands
- Sound Trails
- The Great Reading Rescue
- Pal Reading Adventure

Avoid "monster" in the title to keep it distinct.

### Product pitch

Children choose a Literacy Pal and travel through Meadow, Dino Valley, and Moonwood to restore the Story Lanterns. Each lantern is powered by sounds, words, and sentences. Every stop teaches or reviews one focused reading skill through a short mini-game. As children progress, they unlock costumes, den decorations, readable mini-books, and world badges. Adults see exactly which sounds, words, tricky words, and reading levels are secure.

### Core loop

1. Choose or customize a Pal.
2. Enter the world map.
3. See the next locked/unlocked stop.
4. Meet a character who introduces the target.
5. Play a 60-120 second mini-game.
6. Earn a glow-piece or story token.
7. Watch the world repair/change.
8. Unlock a reward for the Pal.
9. Add weak items to Practice Den.
10. Read a tiny book after each world section.

### World structure

| World | Theme | Reading band | Example reward | Tone |
| --- | --- | --- | --- | --- |
| Meadow Pals | sunny fields, ponds, gardens, friendly animals | first letters/sounds, initial sounds, VC/CVC | seed badges, garden props | safe and bright |
| Dino Valley | jungle, volcano, fossils, swamp, playful dinos | digraphs, CVC/CVCC/CCVC, blending | fossil pieces, dino stickers | adventurous |
| Moonwood | moonlit forest, lanterns, caves, magic books | tricky words, sentence reading, books, review | lantern sparks, costumes, book covers | magical but readable |

### Curriculum spine

The exact scope should be aligned to the app's existing instructional standards, but a Teach-Your-Monster-like spine would look like this:

| Act | Sets | Main focus | Unlock condition |
| --- | --- | --- | --- |
| Act 1 | 1-4 | first grapheme-phoneme correspondences, initial sounds | 80 percent success across new items and review |
| Act 2 | 5-8 | VC/CVC blending and segmenting | blend/read 12 decodable words with support |
| Act 3 | 9-12 | digraphs and adjacent consonants | identify and use sounds in words |
| Act 4 | 13-16 | tricky words and sentence captions | read/complete 10 captions |
| Act 5 | 17-20 | little books and mixed review | read book pages with decreasing support |

This is a sample, not a final curriculum map. The final map should be authored from the current LiteracyPath phonics progression and reviewed against the validation tools.

## Mini-game templates to build

The goal is not dozens of unrelated games. It is six reusable templates with different art skins, levels, and target data.

### Template 1: Sound Gate

Closest inspiration: Air Race, Rocket Rescue, Rocket Run.

Player action:

- steer a Pal glider, cart, rocket, or creature through the correct sound/word gate.

Learning action:

- identify target grapheme/phoneme;
- later identify target sound inside a word.

Design requirements:

- target sound shown and spoken before each run;
- three lanes max for early levels;
- word/gate text large and front-facing;
- wrong lane slows player but does not fail instantly;
- after two wrong choices, replay sound and reduce distractor similarity.

Use in LiteracyPath:

- improve Rocket Run and Sound Racer into quest stations rather than standalone cards.

### Template 2: Build-a-Word Workshop

Closest inspiration: Word Cannon, Flower Power, Letter Garden, Word Bridge.

Player action:

- collect letters or sound tiles in order to build a word for a character.

Learning action:

- segment a spoken word;
- map sounds to graphemes;
- blend the built word.

Design requirements:

- picture cue always shown;
- audio says the whole word, then the target sounds;
- letters sit in physical sockets;
- digraph tiles are single joined tiles (`sh`, `ch`, `th`);
- decoys must not make another valid answer for the same picture.

Use in LiteracyPath:

- replace ambiguous cloze-only tasks with picture-supported word building.

### Template 3: Feed the Pal

Closest inspiration: Feed the Monster, Chowing, animal rescue.

Player action:

- drag or tap correct food/items into a Pal's basket or mouth.

Learning action:

- sort by beginning sound, ending sound, rhyme, or tricky word.

Design requirements:

- very simple early levels;
- expressive character feedback;
- wrong item bounces away and the Pal reacts gently;
- correct items visibly fill a basket or power meter.

Use in LiteracyPath:

- turn existing "pick the correct word" tasks into character-driven sorting.

### Template 4: Story Fix

Closest inspiration: sentence and book tasks.

Player action:

- choose the missing word, capital, punctuation, or sentence part to repair a scene.

Learning action:

- sentence mechanics;
- high-frequency word choice;
- comprehension from picture context.

Design requirements:

- complete sentence must be grammatical;
- no ambiguous answer;
- image cue provided;
- after correct answer, the scene animates to show meaning.

Use in LiteracyPath:

- evolve Sentence Grove and Sentence Express into a quest line.

### Template 5: Review Cave

Closest inspiration: Dark Cave, Island Practice, Practice Mode.

Player action:

- light cave crystals/lanterns by answering mixed review items.

Learning action:

- retrieval practice for weak sounds/words;
- spaced repetition.

Design requirements:

- generated from error history;
- low-stress with no timer;
- rewards mastery streaks;
- automatically returns items after 1 day, 3 days, 7 days if using calendar-based practice.

Use in LiteracyPath:

- a real Practice Den connected to the main quest.

### Template 6: Little Book Reward

Closest inspiration: Easy Books, Hard Books, Champion Reader book tasks.

Player action:

- read a short illustrated book unlocked by the world.

Learning action:

- apply phonics in authentic reading;
- build fluency and comprehension.

Design requirements:

- words limited to taught sounds plus approved tricky words;
- tap-to-hear support;
- page audio optional;
- word highlighting;
- comprehension micro-question at the end.

Use in LiteracyPath:

- connect directly to `guidedReadingBooks` and the existing guided-reading content.

## Data architecture for a similar system

### Level data model

Each stop should be data-driven:

```js
{
  id: "meadow-set-03-satpin",
  world: "meadow",
  set: 3,
  title: "Pond Sound Rescue",
  template: "sound-gate",
  newGpcs: ["s", "a", "t", "p", "i", "n"],
  reviewGpcs: ["m", "d"],
  trickyWords: [],
  decodableWords: ["sat", "pin", "tap", "tin"],
  targetItems: [
    {
      promptType: "sound-match",
      sound: "s",
      grapheme: "s",
      correct: "sun",
      picture: "/images/reading-quest/items/sun.webp",
      audio: "/audio/words/sun.mp3",
      distractors: ["mat", "pin"]
    }
  ],
  rewards: ["seed-badge-03"],
  mastery: {
    passAccuracy: 0.8,
    minimumCorrect: 8,
    scaffoldAfterErrors: 2
  }
}
```

### Player progress model

```js
{
  playerId: "child-123",
  selectedPal: "fox",
  currentStop: "meadow-set-03-satpin",
  unlockedStops: ["meadow-set-01", "meadow-set-02"],
  rewards: ["meadow-hat", "seed-badge-01"],
  mastery: {
    "s": { attempts: 20, correct: 17, lastSeen: "2026-07-11", supportLevel: 0 },
    "a": { attempts: 16, correct: 10, lastSeen: "2026-07-11", supportLevel: 1 }
  },
  practiceQueue: [
    { skill: "a", reason: "low_accuracy", due: "2026-07-12" }
  ],
  booksUnlocked: ["meadow-book-01"]
}
```

### Content validation rules

Every build should fail if:

- a level has fewer than the required number of correct items;
- a correct word contains untaught graphemes unless explicitly marked as tricky;
- a distractor is also correct;
- a cloze has multiple plausible answers;
- a word lacks an image where ambiguity is possible;
- a target sound lacks audio;
- a target word lacks audio when audio support is required;
- text is baked into background art;
- a level references missing WebP/MP3 assets;
- a mini-game cannot report progress/checkpoints;
- a game can complete without recording mastery data.

This fits the repo's existing validation culture. **Observed:** the repo already includes many audit/check scripts for runtime question coverage, phonics validity, rhyming coverage, HFW ambiguity, media reachability, and guided-reading integrity.

## Art production plan for LiteracyPath

### Style target

Teach Your Monster's lesson is not "copy their art." The lesson is "make a cohesive world where every educational interaction is staged like part of the fiction."

LiteracyPath style target:

- handcrafted storybook game art;
- expressive Pals;
- 2.5D layered scenes for performance;
- occasional low-poly PS1/PS2-style worlds only where the mechanic benefits from depth;
- crisp readable letters/words rendered in HTML/canvas/Three text, not baked into images;
- world-specific palettes:
  - Meadow: sky, grass, warm yellow, pond blue, flower accents;
  - Dino: jungle green, lava orange, swamp teal, fossil cream;
  - Moonwood: moonlit blue, violet, warm lantern gold, moss green.

### Asset types needed

For a full Teach-Your-Monster-like quest:

1. Pal avatars
   - idle, happy, thinking, wrong-but-encouraging, walking/running, collecting;
   - transparent WebP sprites or simple skeletal rigs.

2. World backgrounds
   - no baked-in interactive text;
   - no baked-in line/path/answer objects;
   - layered foreground, midground, background;
   - separate lighting/particle overlays.

3. NPCs
   - one guide per world;
   - one helper per set cluster;
   - simple dialogue poses.

4. Interactive props
   - gates, food, letters, word tiles, books, crystals, flowers, rockets, carts;
   - all separate transparent WebP or model assets.

5. Rewards
   - badges, costume items, den decorations, book covers.

6. UI frame kit
   - child-friendly buttons;
   - map nodes;
   - progress meter;
   - skill target card;
   - practice queue badge;
   - reward modal.

### Asset rules

- Use WebP for raster assets.
- Keep answer text out of generated images.
- Keep characters separate from backgrounds unless they are non-interactive scenic extras.
- Use transparent-background cutouts for characters and props.
- Maintain contact sheets for QA.
- Do not use black text on dark shadows for answer labels.
- Make target words/letters 2x bigger than decorative labels.
- Test on tablet and laptop sizes.

## Mechanics production plan

### Phase 1: Quest shell MVP

Goal: prove the unified Teach-Your-Monster-style loop.

Build:

- Reading Pals Quest landing screen;
- choose Pal;
- Meadow map with 6 stops;
- one NPC guide;
- one mini-game template: Sound Gate or Feed the Pal;
- reward inventory;
- simple progress saving;
- parent/teacher summary for sounds taught and sounds needing practice.

Use existing rails:

- add a new standalone quest route or product area rather than cramming into `GAME_LIST`;
- reuse `learnGamesAudio` and `gameMusic`;
- reuse the progress/checkpoint approach from `GamePlayer`;
- pull words from existing lexicon and generated skill banks where possible.

Exit check:

- child can complete 6 stops;
- each stop records target, attempts, correct, and support level;
- no missing assets/audio;
- map persists progress after refresh.

### Phase 2: Mini-game template expansion

Add:

- Build-a-Word Workshop;
- Story Fix;
- Review Cave.

Exit check:

- each template supports pause/resume;
- each template is data-driven;
- each template can render a set from the same level schema;
- validation script checks all content.

### Phase 3: Practice Den

Add:

- quick placement quiz;
- weak-item queue;
- teacher-selectable grapheme/tricky-word sets;
- flashcards;
- replay mini-games with targeted items.

Exit check:

- wrong answers in quest feed into practice queue;
- practice success updates mastery;
- teacher can assign specific sounds/words.

### Phase 4: Little books

Add:

- unlockable books after set clusters;
- guided-reading integration;
- tap-to-hear words;
- word highlighting;
- book readiness indicator.

Exit check:

- book text only uses allowed taught sounds plus approved tricky words;
- teacher dashboard shows readiness.

### Phase 5: Full world production

Add:

- Dino Valley;
- Moonwood;
- more NPCs/rewards;
- 18-24 stops total;
- complete art/audio pass;
- cross-world review.

Exit check:

- each world has unique art, music, rewards, and at least one unique mechanic wrapper;
- content coverage and media validation pass.

## How to make it feel as good as Teach Your Monster

### Make the educational target physically meaningful

Weak version:

- "Click the word that starts with /s/."

Better version:

- The pond bridge is missing stepping stones. Each correct `/s/` word becomes a stone. The Pal crosses after three correct stones.

The child should see why reading matters inside the world.

### Use characters to deliver tasks

Weak version:

- Text box says "Find words beginning with W."

Better version:

- Meadow guide says the windmill lost its `/w/` wind. The child catches `/w/` words to restart it.

### Turn mastery into world repair

Correct answers should repair, grow, open, light, rescue, decorate, or unlock:

- grow a flower path;
- repair a rocket panel;
- light a Moonwood lantern;
- hatch a friendly dino egg;
- fill a bookcase;
- decorate the Pal den.

### Keep game mechanics age-appropriate

For early readers, heavy mechanics fight learning. The best Teach-Your-Monster-like interactions are:

- tap;
- drag;
- steer slowly;
- choose;
- collect;
- match;
- build;
- sort.

High-speed racing and physics should be reserved for review/fluency levels where the child already knows the target.

### Avoid ambiguity

Every prompt must have one correct answer.

Risk examples:

- `sh_p` without picture could be "ship" or "shop."
- "Find The" gets repetitive and low-value if overused.
- "Cat sat on the mat." is not a complete standard sentence for early teaching if the intended sentence is "The cat sat on the mat."
- Capitalization choices need real sentence context.
- Homophones need picture/sentence context.

Build-time check:

- run an ambiguity audit for clozes and distractors;
- require picture cues for missing-vowel/missing-digraph items;
- forbid overuse of low-information words such as "the" as the main target unless the level focus is explicitly articles/capitalization.

## What our version should do better than Teach Your Monster

### 1. Stronger visual polish in modern browsers

Teach Your Monster is charming but older in feel. LiteracyPath can use:

- layered parallax;
- subtle particle effects;
- WebP/AVIF asset compression;
- high-quality generated but curated character art;
- 2.5D or low-poly scenes where appropriate;
- shader-like lighting in canvas/Three for special scenes;
- responsive tablet-first layout.

### 2. Better teacher analytics

Teach Your Monster shows progress, stars, time, and taught/played letter-sound combinations. LiteracyPath can go deeper:

- accuracy by grapheme;
- error type;
- audio support used;
- time-to-answer;
- decodable word mastery;
- tricky-word mastery;
- sentence/punctuation mastery;
- recommended next practice;
- book readiness.

### 3. Deeper connection to guided reading

LiteracyPath already has guided-reading infrastructure. The quest should unlock actual little books and report readiness. That is the strongest educational payoff.

### 4. Cleaner asset pipeline

Prior LiteracyPath arcade work has sometimes used backgrounds with characters/lines baked in. This quest should enforce:

- no baked-in characters unless decorative;
- separate moving characters;
- no baked-in answer text;
- all gameplay props separate;
- generated source prompts stored;
- WebP compressed deliverables;
- contact-sheet QA.

## Proposed MVP specification

### MVP name

Reading Pals Quest: Meadow Launch

### MVP audience

Children in the first phase of phonics instruction, roughly the same starting band as Teach Your Monster's First Steps.

### MVP content

- 1 world: Meadow.
- 1 chosen Pal.
- 6 map stops.
- 3 new/review sound clusters.
- 2 mini-game templates.
- 1 reward screen.
- 1 tiny book unlock.
- basic teacher/parent progress summary.

### MVP level list

| Stop | Focus | Game template | Reward |
| --- | --- | --- | --- |
| 1 | hear and match first sounds | Feed the Pal | meadow badge |
| 2 | identify initial sounds in pictures | Sound Gate | seed trail |
| 3 | blend VC/CVC words | Build-a-Word | cart wheel |
| 4 | review weak sounds | Review Cave | lantern spark |
| 5 | read decodable words | Sound Gate slower fluency | Pal hat |
| 6 | read tiny book | Little Book Reward | book badge |

### MVP screen flow

1. Start screen: choose Pal.
2. Map: Meadow path with six stops.
3. Stop intro: NPC introduces target with audio.
4. Mini-game: 6-10 items, no more than 3 options at once.
5. Reward: physical object earned.
6. Map update: next stop unlocks.
7. Book unlock after stop 6.
8. Adult stats view updates automatically.

### MVP technical tasks

1. Create `src/components/readingQuest/ReadingQuest.jsx`.
2. Create `src/data/readingQuestLevels.js`.
3. Create `src/utils/readingQuestProgress.js`.
4. Create reusable templates:
   - `SoundGateTemplate.jsx`;
   - `FeedPalTemplate.jsx`;
   - later `BuildWordTemplate.jsx`.
5. Create validation:
   - level content completeness;
   - decodability;
   - asset/audio existence;
   - distractor ambiguity.
6. Connect to route/menu.
7. Add WebP asset folders:
   - `/images/reading-quest/pals/`;
   - `/images/reading-quest/worlds/meadow/`;
   - `/images/reading-quest/props/`;
   - `/images/reading-quest/rewards/`.

## Suggested production pipeline

### Step 1: Curriculum brief

For each set, define:

- target GPCs;
- review GPCs;
- word bank;
- tricky words;
- sentence patterns;
- picture needs;
- audio needs;
- expected mastery.

### Step 2: Game brief

For each stop, define:

- story reason;
- mini-game template;
- number of items;
- reward;
- feedback;
- failure scaffold.

### Step 3: Art brief

For each world and stop, define:

- background layers;
- characters;
- props;
- rewards;
- UI accents;
- animation states;
- forbidden baked-in elements.

### Step 4: Audio brief

For each stop, define:

- NPC intro;
- target sound;
- target words;
- correct feedback;
- try-again feedback;
- reward sting;
- ambient/music loop.

### Step 5: Build

Build template once. Feed it data. Do not hand-code one-off levels unless absolutely necessary.

### Step 6: Validation

Run automated checks:

- content schema;
- decodability;
- media existence;
- ambiguity;
- game smoke.

Then run human checks:

- child-readable target text;
- no hidden answer;
- no ambiguous image;
- no audio mismatch;
- no distracting animation over the word.

### Step 7: Classroom/user test

Watch children play without instruction. Record:

- do they know what to do?
- do they look at the letter/word?
- do they understand correct/incorrect feedback?
- do they want to continue?
- where do they misread or misclick?

## Quality bar

A LiteracyPath Teach-Your-Monster-level quest is not ready unless:

- a child can understand the first task without adult explanation;
- every text target is large and readable;
- every ambiguous word has picture/sentence context;
- every new sound is explicitly taught before testing;
- every level includes review;
- every correct action changes the world;
- every mistake gives scaffolded feedback;
- progress persists;
- adult stats explain what was learned;
- the game runs smoothly on a normal school tablet/laptop;
- all assets are optimized WebP/MP3/OGG as appropriate;
- there is no IP copying.

## Risks and mitigations

### Risk 1: making it too game-heavy

If the game becomes too fast or visually busy, children may play around the reading instead of through it.

Mitigation:

- early levels use slow, clear, single-decision mechanics;
- racing/skill timing reserved for review;
- target text always visually dominant.

### Risk 2: copying too closely

Teach Your Monster has a distinctive brand and monster/island/spaceship premise.

Mitigation:

- use LiteracyPath Pals, Meadow/Dino/Moonwood worlds, Story Lanterns, and books;
- design original mechanics and names;
- avoid exact maps, characters, and reward names.

### Risk 3: content drift

Games can accidentally use words with untaught sounds or ambiguous distractors.

Mitigation:

- decodability validator;
- ambiguity validator;
- reading-specialist review;
- no level ships without source-of-truth curriculum data.

### Risk 4: asset bloat

A quest can become slow if every screen loads large raster art.

Mitigation:

- WebP only for generated raster assets;
- split background layers;
- lazy-load world bundles;
- reuse props;
- keep text rendered live;
- maintain an asset inventory.

### Risk 5: insufficient teacher trust

Teachers will not trust a game if they cannot see what it taught.

Mitigation:

- progress dashboard;
- taught vs practised vs mastered distinctions;
- recommended next practice;
- book readiness.

## Practical next build recommendation

Build a tiny but polished Meadow slice before attempting a full clone-scale product.

Recommended first slice:

1. Reading Pals Quest route.
2. Pal selection.
3. Meadow map with 6 stops.
4. Feed the Pal mini-game for initial sounds.
5. Sound Gate mini-game for sound recognition.
6. Reward screen.
7. Basic stats output.
8. Content/media validator.

Why this first:

- It tests the Teach-Your-Monster macro loop.
- It reuses existing LiteracyPath strengths.
- It avoids sinking time into giant art production before proving the learning loop.
- It creates a scalable shell for later worlds.

## Bottom line

Teach Your Monster to Read is successful because it combines systematic phonics, expert-led design, classroom testing, child-owned character progression, many short mini-games, world-map motivation, gentle feedback, and adult-visible progress. The surface is charming, but the engine is curriculum discipline plus reward design.

For LiteracyPath, the way to make something similar is to stop thinking in isolated arcade games and build a connected reading adventure: one Pal, one map, one curriculum spine, several reusable mini-game templates, strong art direction, persistent rewards, adaptive practice, and teacher-readable stats. That would be spiritually similar to Teach Your Monster while remaining original, LiteracyPath-native, and technically achievable in the current app.

