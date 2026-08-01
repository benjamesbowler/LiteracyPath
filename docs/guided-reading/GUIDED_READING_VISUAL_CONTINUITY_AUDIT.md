# Guided Reading Visual Continuity Audit

Status: complete visual audit; replacement briefs approved for generation

Audit date: 20 July 2026

## Scope And Proof Of Coverage

- 176 active guided-reading books reviewed in reading order.
- 1,616 active page images inspected at full contact-sheet size and against adjacent pages.
- 2,005 physical guided-reading image files checked in total.
- 389 inactive/legacy physical files separately inspected and quarantined.
- 951 active images require replacement: 279 critical, 659 high, 13 moderate.
- 951 replacements are approved and installed; 0 remain in the production queue.
- 665 active images passed this visual audit.
- Every individual result is recorded in guided_reading_visual_audit_coverage.json; every rejected active page has an exact prompt in guided_reading_visual_replacement_manifest.json.

The covers intentionally reuse page 1 and are not a second physical image. They inherit page 1's pass/replacement result.

## Runtime Reader Check

The live student reader was opened through the real picture-password flow and checked at its normal desktop viewport. It presents the full 4:3 artwork beside the tappable text with clean letterboxing and no control overlay, so the defects recorded here are present in the source art rather than caused by UI cropping. The reader makes face-bearing objects, malformed text, and continuity shifts highly visible at large scale. Replacement prompts therefore use an 8% responsive edge-safe margin but do not waste image space for nonexistent overlaid controls.

## Pass Standard

An image passes only when it accurately supports its page text, is coherent at full size, preserves recurring characters, props, quantities, geography, and chronology, contains no unintended writing or generation residue, and is appropriate for a child to imitate or learn from. A polished render fails when it teaches the wrong concept, introduces unsafe behaviour, or breaks sequence identity.

Humans, children, animals, and other living story characters who normally have faces must retain complete, expressive, anatomically appropriate faces. Only inanimate objects and non-character scenery must remain faceless. All generated reader text, page numbers, signs, sound words, labels, prompt fragments, logos, palettes, and watermarks are disallowed inside the image; verified text must be rendered by the app.

## Executive Finding

The library is not uniformly poor. 15 books passed without a blocking visual defect. The main problem is concentrated in four production eras:

1. Early nonfiction repeatedly uses smiling suns, moons, clouds, plants, food, shapes, and other babyfied objects, plus scientifically misleading diagrams.
2. First-person nonfiction frequently changes the narrator, location, seed, plant, or animal between pages, so a supposed sequence reads as unrelated stock pictures.
3. Dino Pals and Meadow Pals use unstable character models, literal visual gags, embedded prompt text, page labels, duplicate bodies, and inconsistent anatomy.
4. Later Moonwood books contain severe cast substitution: named creatures become random human children or different species. Several stories also require safeguarding or curriculum rewrites before new art is generated.

The 389-file inactive bank is not an approved backup library. It includes the exact old face-bearing artwork, generated infographic copy, and incompatible alternate character models that can leak back into production. Its required disposition is archive-never-reuse-directly.

## Replacement Order

### Phase 1: Stop Educational And Safeguarding Harm

Complete the 26 critical books first. This includes volcano safety, copper-sulphate replacement, wild-primate pet stories, unsafe fire/bridge/cliff/marsh journeys, inaccurate Archaeopteryx content, and the Moonwood cast-collapse books. Approve copy changes before generating their images; otherwise the art will faithfully reproduce a bad lesson.

### Phase 2: Lock Series Bibles

Create one approved, orthographic reference sheet for every recurring cast and location before replacing sequence art: Bob/Nan/Fluff, James/Anna/Chips/family, Aiden/Betty/family and the rewritten Socks, all Dino Pals, all Meadow Pals, and every Moonwood character. Each sheet must define front/three-quarter/side view, palette swatches stored as metadata rather than drawn into pages, relative height, key markings, allowed clothing, and recurring props.

### Phase 3: Rebuild Whole Sequences

Generate the 80 full-sequence books in page order, using the same references throughout. Do not approve individual attractive pages in isolation. Review each sequence as a strip for cast, direction of travel, object count, time of day, geography, and action chronology.

### Phase 4: Repair Localised Pages

Generate the 81 partial-replacement books after their adjacent pages have been supplied as references. A local replacement passes only if it looks native beside the retained images. If that cannot be achieved after two attempts, promote the book to a full-sequence rebuild.

### Phase 5: Retire Legacy Assets

Move all inactive files out of the public runtime tree after a backup is confirmed, or enforce a build-time allowlist so only paths referenced by guidedReadingBooks.js can ship. Never recover an inactive image directly; recover its idea into a newly generated, sequence-approved image.

### Phase 6: Acceptance Gate

For every regenerated book: inspect 100% of pages at full resolution, compare the sequence strip, run the existing guided-reading validators, render the real reader at desktop and mobile sizes, and have a second adult review science, safeguarding, quantities, and character identity. Replace only after this gate passes.

## Book-By-Book Ledger

| # | Book | Result | Priority | Pages | Finding |
|---:|---|---|---|---|---|
| 1 | Pets | pass | none | — | Pass: no blocking visual defect found. |
| 2 | The Sun | partial replacement | high | 1, 2, 4, 5, 6 | Smiling sun characters replace the real Sun, and page 4 contains a fabricated book title. |
| 3 | Colors | partial replacement | high | 3, 5, 6 | Sun faces reintroduce the babyfied object style. |
| 4 | My Body | full sequence rebuild | high | 1, 2, 3, 4, 5, 6 | The first-person narrator changes appearance and the final natural scene uses a smiling sun. |
| 5 | Seasons | partial replacement | moderate | 6 | The four-season summary does not preserve one identifiable child across all quadrants. |
| 6 | Fruits | partial replacement | high | 3 | The text names one grape but the picture shows a bunch. |
| 7 | Tools | partial replacement | high | 1, 5 | Page 1 contains the generated sound word CLACK; page 5 has malformed ruler markings. |
| 8 | Day and Night | pass | none | — | Pass: no blocking visual defect found. |
| 9 | Community Helpers | partial replacement | high | 3, 4, 5, 6 | Generated signs and labels are baked into the art; the firefighter action is unclear; the final Sun has a face. |
| 10 | Water | partial replacement | high | 1 | Water is poured onto a table instead of into a vessel. |
| 11 | Five Senses | full sequence rebuild | high | 1, 2, 3, 4, 5, 6 | A first-person sequence uses multiple unrelated children. |
| 12 | Shapes | pass | none | — | Pass: no blocking visual defect found. |
| 13 | Our Earth | partial replacement | high | 6 | The shirt contains generated EARTH DAY lettering. |
| 14 | Healthy Habits | full sequence rebuild | high | 1, 2, 3, 4, 5, 6 | The narrator changes from page to page and the final art contains face-like sun/star decorations. |
| 15 | Animal Homes | pass | none | — | Pass: no blocking visual defect found. |
| 16 | Space | partial replacement | high | 4, 6 | Page 4 uses cartoon five-point symbols as stars; page 6 contains duplicate Earth-like planets. |
| 17 | Reptiles | partial replacement | high | 4 | A tortoise is shown for text that names a turtle. |
| 18 | How Things Grow | partial replacement | high | 4 | The frog life-cycle diagram is unclear and includes unreliable A/B/C/D labels. |
| 19 | Magnets | partial replacement | high | 1 | The illustrated book contains unreadable generated writing. |
| 20 | Clothes | partial replacement | high | 6 | The Sun has a face. |
| 21 | Our Five Senses | partial replacement | high | 3 | COOKIES is baked into the image. |
| 22 | Colors | pass | none | — | Pass: no blocking visual defect found. |
| 23 | Farm Animals | partial replacement | high | 3, 7 | Smiling Sun characters break the otherwise observational farm style. |
| 24 | Big and Little | partial replacement | high | 3, 5 | The bus contains embedded lettering and the Sun/Moon are drawn as characters. |
| 25 | Water | partial replacement | high | 2, 7 | The Sun and cloud have faces and the summary composition is incoherent. |
| 26 | The Sky | partial replacement | high | 1, 3, 4, 7 | Face-bearing Sun art, five-point star symbols, and an unnatural rainbow bird undermine the sky lesson. |
| 27 | Animals Can! | partial replacement | high | 5 | The Sun has a face. |
| 28 | Bugs | partial replacement | high | 2, 6, 7 | A smiling flower and Sun recur, the caterpillar does not look fast, and the book groups an earthworm with insects. |
| 29 | My Pet | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The first-person child, home, and pets drift; a cage is implausibly small and natural objects have faces. |
| 30 | Hot and Cold | partial replacement | high | 1, 3, 6, 7 | The Sun and summary objects have faces, a camping bear appears without context, and clear water is named as milk. |
| 31 | Shapes | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | Several pictures teach the object instead of the 2D shape: ball/circle, box/square, arched door/rectangle, kite/triangle; celestial symbols have faces. |
| 32 | At the Farm | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The first-person farm visit lacks one stable child and coherent location; several skies contain smiling suns. |
| 33 | In the Sea | partial replacement | high | 7 | A child in a paddling pool is used for a sea/shore conclusion. |
| 34 | Fruit | partial replacement | high | 3, 5 | Singular fruit nouns are illustrated as multiple plums/grapes. |
| 35 | The Tree | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The tree changes identity across a single growth/season sequence. |
| 36 | Baby Animals | partial replacement | high | 7 | The summary does not clearly pair each baby animal with its adult. |
| 37 | Fast and Slow | partial replacement | high | 1, 2, 3, 6, 7 | Faces on weather objects, bus lettering, and a tortoise called a turtle weaken the comparisons. |
| 38 | A Seed Grows | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The seed, pot, plant, location, and caregiver change during one life cycle. |
| 39 | My Body | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The first-person child is not consistent across the body sequence. |
| 40 | Day and Night | partial replacement | high | 1, 3, 5, 6, 7 | Sun and Moon characters dominate the day/night lesson. |
| 41 | Space | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The sequence mixes an impossibly oversized Moon, face-bearing celestial bodies, symbol-shaped stars, and mutually incompatible rendering styles. |
| 42 | Look at the Colours! | partial replacement | high | 5, 6 | A pumpkin and Sun have faces. |
| 43 | The Four Seasons | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | The landscape, children, and rendering style change between seasons; face-bearing Suns recur, and the hibernation page shows a blanket-covered bear beside a lit fireplace inside a cave. |
| 44 | Little Seeds Grow | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The seed, plant, pot, and children drift across one growth sequence; watering equipment and Sun have faces. |
| 45 | What is Weather? | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | Every page swaps the child, location, and rendering style; weather is personified, and the summary shows a child balancing on a stool beside an open window with face-bearing weather cards. |
| 46 | Flowers and Trees | partial replacement | high | 1, 4, 5, 8 | Sun faces recur and the rose page does not clearly show thorns. |
| 47 | Baby Animals | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The sequence uses babyfied, thick-outline animal cartoons with oversized eyes; Sun faces recur, the hatching chick pose is implausible, and the labelled closing page omits most of the animals taught in the book. |
| 48 | Animals on the Farm | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The full sequence uses babyfied thick-outline animals and inconsistent infographic devices; the milking page shows an unsupervised child and a split scene, the wool page floats a jumper beside a sheep, the horse does not pull or carry anything, and the closing scene muddles adult and young animal counts. |
| 49 | Animals in the Ocean | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The entire ocean sequence uses thick-outline mascot animals; the whale has invented facial and mouth anatomy, the octopus does not present eight coherent arms, the crab and seahorse are personified, and the closing spread repeats the same scientifically weak stock forms. |
| 50 | Animals at Night | full sequence rebuild | high | 1, 2, 3, 4, 5, 6 | The full nocturnal sequence uses thick-outline mascot animals; the opening contains ZZZ lettering, bat and fox anatomy/expressions are babyfied, hunting and feeding behaviours are weakly shown, and the closing Moon has a face. |
| 51 | Bugs All Around Us | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The full garden-invertebrate sequence uses smiling, thick-outline mascots with weak body segmentation and scale; the ant colony is a crowded cartoon cutaway, greenfly are barely legible, Sun and clouds have faces, and the final art contains BELOW GROUND lettering. |
| 52 | Pets We Love | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The full sequence treats pets as thick-outline mascots; the dog-care page contains DOG FOOD lettering and outdoor bowls, the cat uses music-note symbols, the aquarium lacks clear filtration and enrichment, the hamster enclosure is undersized, and the closing page places a fish bowl and all pets outdoors among face-bearing trees and Sun. |
| 53 | Shapes Everywhere | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The whole sequence uses thick-outline flashcard compositions and personified objects; giant Sun, cloud, Moon and star characters confuse ordinary 2D object faces with natural bodies, while the final shape hunt is visually crowded and weakly prioritised. |
| 54 | Big and Small | full sequence rebuild | high | 1, 2, 3, 4, 5, 6 | The full comparison sequence uses thick-outline nursery mascots: the elephant, mouse, whale, fish and Suns are personified, the bus has a face and BUS/SCHOOL lettering, and the closing park spread abandons the taught examples for unrelated dogs and balls. |
| 55 | Hot and Cold | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The entire sequence uses thick-outline nursery cartoons and inconsistent children; Sun, kettle, drink and ice-lolly faces recur, HOT/COLD and book-spine writing are embedded, the recap is a labelled worksheet, and the fire and steaming-food scenes place children too close to burn hazards without clear adult control. |
| 56 | Things That Float and Sink | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The full sequence shifts between unrelated nursery-cartoon scenes, personifies the duck and tree, uses a fish bowl and unstable open floor tub for experiments, suspends the stone and coin in mid-water instead of resting them on the bottom, and presents weight alone as the reason objects sink. |
| 57 | Push and Pull | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The entire sequence uses inconsistent thick-outline children and settings; PUSH/PULL labels, arrows and product writing turn actions into worksheets, the zip slider has a face, the Sun is personified, and a giant lettered magnet lifts a hazardous cluster of sharp pins. |
| 58 | Hello, Sun! | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The full sequence personifies the Sun, Earth, stars and sunflowers, uses a false same-scale planet lineup, changes children and settings, and visually supports the misconception that the Sun itself travels up and down around a stationary viewer; the midday page also reinforces a false hottest-time claim. |
| 59 | The Moon | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The full sequence mixes changing children and thick-outline astronomy cartoons; the Moon, Earth, planets and stars are personified, phase art treats the Moon as physically changing shape, the orbit is an arbitrary dotted loop, and the astronaut scene is generic and historically weak. |
| 60 | Day and Night | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The whole sequence mixes unrelated children, homes, panel layouts and thick-outline nursery cartoons; Sun and Moon faces, symbolic stars, worksheet arrows and duplicate labels recur, while the night pages imply that the Sun leaves rather than that Earth rotates. |
| 61 | My Five Senses | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The first-person narrator changes into six unrelated children; thick-outline nursery cartoons, rainbow motifs, face-bearing food and weather, decorative sense arrows, music notes and sound-effect words turn the lesson into inconsistent clip art, while the touch page does not model a safe distinction between texture exploration and testing unknown hot objects. |
| 62 | How I Grow | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The first-person narrator changes ethnicity, facial structure, hair, family and rendering style across nearly every page; split scenes use unrelated children, a smiling Sun returns, the final height chart contains generated numbers, and the sequence treats becoming tall as a universal or preferable outcome rather than showing healthy individual variation. |
| 63 | Staying Healthy | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | The sequence has no established narrator: food is isolated clip art, then water, movement, handwashing, toothbrushing and sleep use unrelated children, homes and rendering styles; the movement page includes poorly protected wheeled play, and the labelled MORNING/MIDDAY/EVENING/NIGHT recap changes the child again. The lesson also moralises food and equates visible smiling with health. |
| 64 | My Body | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The first-person narrator changes face, skin tone, hair and clothing across the book; thick-outline nursery art embeds CLAP, symbolic food thoughts, anatomy circles/arrows, motion doodles and face-bearing Suns, while the final cape and smiling star badge confuse body ownership and safety with superhero strength. |
| 65 | Rocks and Pebbles | pass | none | — | Pass: no blocking visual defect found. |
| 66 | Water Everywhere | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | The full sequence uses changing children, thick-outline nursery cartoons, smiling Sun/cloud characters, symbolic water marks and labelled worksheet panels; the bath page presents hot-looking steam and crowded splashing, the plant/animal page is a disconnected split scene, the states page confuses visible mist with steam, and the closing Earth is another face-adjacent cartoon style. |
| 67 | Bees | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Every page uses thick-outline mascot bees with invented faces, inconsistent leg/wing/body anatomy and changing visual grammar; queen scale is distorted, nectar transfer is acted like a conversation, pollen is shown as decorative dots, pollination becomes an instant 'with bees / no bees' death panel, honey gains branding and a clock, and the child-gardening page abandons the macro sequence. |
| 68 | Volcanoes | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9 | The original sequence placed children dangerously close to active lava, used inaccurate eruption/map visuals, personified volcanoes, and could not accept local repairs without a severe style break. The book was promoted to a full sequence rebuild. |
| 69 | Penguins | partial replacement | high | 3, 9 | The brood-pouch depiction needs anatomical review and the final Sun has a face. |
| 70 | The Moon | partial replacement | high | 1, 2, 3, 6, 8 | Moon phases, tide imagery, and face-bearing Moon art are inconsistent. |
| 71 | How Seeds Grow | partial replacement | high | 2, 3, 4, 5, 6, 7, 8, 9 | The seed and plant identity drift across one biological sequence. |
| 72 | Spiders | partial replacement | high | 1, 2, 3, 5, 8, 9 | Spider anatomy and web behaviour are inconsistent and sometimes personified. |
| 73 | Under the Ocean | partial replacement | high | 1, 2, 5, 6, 7, 8, 9 | Ocean zones, vessel scale, and marine-life placement are inconsistent; some subjects are personified. |
| 74 | Butterflies | partial replacement | high | 1, 2, 4, 5, 6, 9 | The butterfly species and life-cycle anatomy drift between pages. |
| 75 | Caves | partial replacement | high | 2, 5, 6, 9 | Cave formations smile, rainbow decoration appears, and children use open flames. |
| 76 | Frogs | partial replacement | high | 2, 4 | The Sun has a face and one life-cycle stage is duplicated. |
| 77 | Bob and Nan | pass | none | — | Pass: no blocking visual defect found. |
| 78 | Bob and Nan go to the Park | pass | none | — | Pass: no blocking visual defect found. |
| 79 | Bob, Nan and Fluff | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | Page 1 contains a generated story sentence and Fluff's appearance drifts across the short sequence. |
| 80 | Bob and Nan go to the Beach | partial replacement | high | 3, 5 | Page 3 contains repeated/blurred fragments and page 5 has a hard compositing seam. |
| 81 | Bob and Nan's First Day at School | pass | none | — | Pass: no blocking visual defect found. |
| 82 | Nan and Bob go to the Zoo | partial replacement | high | 6, 7 | The gorilla encounter does not show a clear, credible zoo barrier. |
| 83 | Nan and Bob: Bob's Birthday Party | pass | none | — | Pass: no blocking visual defect found. |
| 84 | Nan and Bob get Sick | pass | none | — | Pass: no blocking visual defect found. |
| 85 | Nan and Bob Learn to Read | partial replacement | high | 2 | Fluff appears twice in one scene. |
| 86 | Fluff Visits the Vet | partial replacement | high | 4 | Mum is duplicated. |
| 87 | James and Anna go to Space | partial replacement | high | 7, 8, 9, 10, 13 | The rocket changes between pages and spacesuits appear before the landing sequence is coherent. |
| 88 | James and Anna and Chips | partial replacement | high | 3, 11 | A goat is encouraged to eat a hat and the requested jumper is not clearly shown. |
| 89 | James and Anna go Shopping | partial replacement | high | 6, 8, 11 | James is duplicated, an indoor sale is shown outside, and Mum's identity drifts. |
| 90 | James and Anna go to the Dentist | pass | none | — | Pass: no blocking visual defect found. |
| 91 | James and Anna build a Tree House | pass | none | — | Pass: no blocking visual defect found. |
| 92 | James and Anna visit Grandma's Farm | partial replacement | high | 3, 4 | The visible animal counts do not match the text. |
| 93 | James and Anna and the School Play | partial replacement | high | 1, 2, 4, 5, 6, 13 | Generation instructions are visible, Anna is duplicated, and Mum/character appearance drifts. |
| 94 | Chips's Play Date | partial replacement | moderate | 5 | A motion montage reads as several overlapping copies rather than one action. |
| 95 | James and Anna's New Bikes | partial replacement | high | 11 | Chips is duplicated in inset fragments. |
| 96 | James, Anna and Chips go Camping | partial replacement | critical | 6, 12, 14 | Three pages break an otherwise established James-and-Anna cartoon sequence: the fire staging is unsafe, the tent consequence is unclear, and the ending needs a cleaner cast-and-prop match. |
| 97 | Aiden and Betty Start Grade 1 | partial replacement | high | 5 | Desk names are mirrored or incorrect (including AIDEN/BETTY variants). |
| 98 | Aiden and Betty have a Yard Sale | partial replacement | high | 6, 8 | Clocks appear improbably on trees and an indoor action is staged outside. |
| 99 | Aiden and Betty go on Holiday | partial replacement | high | 3, 13 | Vehicle scenes do not visibly show Aiden and Betty wearing seat belts. |
| 100 | Aiden and Betty and Socks | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | A wild primate is treated as a household pet; the sequence includes palette-dot artefacts, gibberish, and kitchen hazards. |
| 101 | Socks Goes Missing | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | The wild-primate pet premise continues; Betty is duplicated and notebook writing is malformed. |
| 102 | Aiden and Betty and the Science Fair | partial replacement | critical | 4, 5, 6, 7, 8 | Children and Socks handle an open copper-sulphate experiment without PPE or adequate supervision. |
| 103 | Aiden, Betty and Socks's Big Adventure | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 | The wild-primate premise persists; Socks is duplicated and notebooks contain gibberish. |
| 104 | Aiden and Betty and the Bully | partial replacement | high | 2, 13 | A thought-bubble treatment is tonally inconsistent and notebook writing is malformed. |
| 105 | Aiden and Betty: New Teeth | partial replacement | high | 5, 6, 11, 13 | Betty's hair/headband changes and Socks is shown with grotesque human-like teeth. |
| 106 | Aiden and Betty and the Castle | partial replacement | high | 12 | The car contains two Aidens and two Betties. |
| 107 | Chompy's Big Lunch | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The Dino Pals visual language is highly babyfied, with face-bearing celestial objects and heart-emitting volcanoes. |
| 108 | Sunny's Rainy Day | partial replacement | high | 4, 8 | SPLASH lettering dominates one scene and the volcano emits hearts. |
| 109 | Dozy Won't Wake Up | partial replacement | high | 1, 8 | Heart-emitting and face-bearing volcanoes appear. |
| 110 | Grumpy Needs Help | partial replacement | high | 8 | A cloud has a face. |
| 111 | Bossy Makes a Plan | partial replacement | high | 1, 3, 4, 5 | A heart volcano and giant decorative typography interrupt the story. |
| 112 | Bouncy Bumps Into Everything | partial replacement | high | 5, 8 | Bouncy changes species and the final page exposes prompt/character labels. |
| 113 | Wiggly's Messy Day | partial replacement | high | 6, 8 | Wiggly's tail grows its own smiling face and text is embedded on the ground. |
| 114 | Zippy Slows Down | partial replacement | high | 2, 8 | The Sun has a face and the volcano emits hearts. |
| 115 | Honky's Inside Voice | partial replacement | high | 6, 8 | Generation instructions and character labels are visible. |
| 116 | Cheeky's Prank Goes Wrong | partial replacement | high | 7, 8 | A heart volcano and over-stylised sparkle rock undermine the natural setting. |
| 117 | Shy's Secret Gift | partial replacement | high | 6, 12 | Prompt/character labels are visible and a heart volcano returns. |
| 118 | Fancy's Bad Day | partial replacement | high | 9, 12 | The water-fetch action is unclear and Fancy's tail coils into an incoherent airplane-like shape. |
| 119 | Clumsy to the Rescue | partial replacement | high | 3, 7, 9, 10 | Prompt text is visible and ordinary water repeatedly becomes an unexplained rainbow waterfall. |
| 120 | What is Flappy? | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Archaeopteryx is rendered as a modern yellow chick and the sequence contains face-bearing scenery. |
| 121 | Sneezy and the Waterfall | partial replacement | high | 1 | Generation instructions are visible. |
| 122 | Chompy and Grumpy's Day Out | partial replacement | high | 8, 9 | Unrelated background dinosaurs and a tiny duplicate Chompy appear; the tail-rescue action is unclear. |
| 123 | The Sunny Hollow Games | partial replacement | high | 5, 6, 11, 12 | Several event pages used the wrong competitor, rainbow effects, face-bearing weather/thought bubbles, prompt labels or anthropomorphic scenery instead of the stated games action. |
| 124 | Dozy's Wonderful Dream | partial replacement | high | 9 | A heart-emitting volcano appears in the dream. |
| 125 | Zippy's Race | partial replacement | high | 3, 4, 6, 12 | Face-bearing Sun and heart volcano imagery recur. |
| 126 | The Big Storm | partial replacement | high | 9, 11, 12 | Prompt/character labels are visible and clouds are shaped as hearts. |
| 127 | Muddy Has a Bath | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Muddy's spots, face, body proportions, and scale drift through one simple sequence. |
| 128 | Woolly Can't Sleep | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Woolly changes scale and anatomy, including an impossible ball-shaped sheep; companion identity also drifts. |
| 129 | Clucky Lays an Egg | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | Clucky changes colour and anatomy across the egg-laying sequence and a Sun face appears. |
| 130 | Bouncy Won't Stop | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7 | Bouncy alternates between normal legs and literal metal springs. |
| 131 | Grumpy Gets a Surprise | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Grumpy changes horns, clothes, and proportions; the cake has a face. |
| 132 | Sleepy Can't Wake Up | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Sleepy's sequence introduces spring-legged sheep and unrelated miniature animals. |
| 133 | Noisy Tries to Be Quiet | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Noisy shifts between rooster/hen and red/orange models; labels and an unexplained scarf appear. |
| 134 | Tiny is Very Small | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Tiny's overalls appear once, weather has faces, and later pages contain text and a meta-book frame. |
| 135 | Shy Comes Out to Play | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8 | The pages drifted Shy from the canonical larger pale-grey mouse into a rabbit and reversed the final two story beats. |
| 136 | Giggly Has the Hiccups | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Prompt text, page numbers, and giant speech-like lettering recur; Giggly changes appearance. |
| 137 | Brave Climbs the Hay Bale | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | A rectangular bale becomes a round stack, Brave drifts, and a Sun face appears. |
| 138 | Hungry Finds Lunch | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7 | The former sequence rendered Hungry as a pig and paired that species error with unsafe indiscriminate eating. The revised story and artwork require the established cow learning suitable food choices and noticing fullness. |
| 139 | Splashy Finds a Puddle | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Splashy changes size, a numbered diagram appears, and a small puddle becomes a lake. |
| 140 | Speedy Slows Down | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Speedy changes from puppy to adult breed and prompt text appears. |
| 141 | Cuddly Wants a Hug | full sequence rebuild | moderate | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Cuddly's markings, proportions, and companion scale drift across an otherwise coherent story. |
| 142 | Muddy and Splashy Make a Mess | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Prompt text appears and Muddy/Splashy/Grumpy drift late in the sequence. |
| 143 | Bouncy and Speedy Have a Race | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Spring-legged sheep, page numbers, and a final palette/prompt legend appear. |
| 144 | Noisy Wakes Everyone Up | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | A random sleeping human appears among the animals and cast scale/identity needs locking. |
| 145 | Tiny and Brave Go on an Adventure | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Random animals appear and Tiny/Brave are duplicated, so the two-character adventure is not readable. |
| 146 | Shy and Cuddly Find Each Other | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | The sequence drifted canonical Shy into a rabbit and treated a hug as automatic rather than invited. |
| 147 | Woolly and Grumpy Are Stuck | partial replacement | high | 6, 8 | A huge detached wool mass appears while Woolly still has a full coat; later staging snags character silhouettes. |
| 148 | Sleepy's Big Dream | pass | none | — | Pass: no blocking visual defect found. |
| 149 | Giggly and Clucky Bake a Cake | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | Prompt text, a possible duplicate hen, a hulking hen model, and a changing oven break the baking sequence. |
| 150 | Grumpy's Secret | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | Prompt text is visible, Grumpy drifts, and the ending contradicts the promise to keep a secret. |
| 151 | The Big Farm Party | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 | Many pages expose prompt text, numbers, labels, and random dressed or duplicated animals. |
| 152 | Pip and the Bravery Stone | partial replacement | critical | 5, 6, 7, 9, 11, 12 | Pip free-climbs without protection, characters sit in moving water, and the Bravery Stone changes size. |
| 153 | Fern Grows Too Much | partial replacement | moderate | 11 | Tiny generated LUNA lettering appears in the art. |
| 154 | Stone Crosses the Bridge | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Stone crosses and re-crosses a visibly damaged bridge while carrying Burrow. |
| 155 | Glimmer Tries and Tries | partial replacement | critical | 11 | Glimmer produces a large uncontrolled forest flame. |
| 156 | Wren and the Backwards Spell | partial replacement | high | 5, 6, 10, 12 | Garbled spell text appears and the mirror image is not clearly a reflection. |
| 157 | Flint Makes a Map | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | The visuals are polished but support a child walking alone for three days without rest or a check-in plan. |
| 158 | Dewdrop and the Lying Fish | partial replacement | high | 10, 11 | A second blue-striped fish appears and Dewdrop then loses the defining stripe. |
| 159 | Burrow Finds a Door | partial replacement | high | 6, 8, 12 | Prompt text and character labels are visible. |
| 160 | Spark's Very Big Sneeze | pass | none | — | Pass: no blocking visual defect found. |
| 161 | What Luna Forgot | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | Luna changes owl species and colour on nearly every page; quantities are not reliably countable. |
| 162 | Pip and Stone and the Loud Thing | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Stone becomes a human, Pip changes model, and marsh creatures drift or fuse. |
| 163 | Fern and Dewdrop Save the Stream | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Fern and Dewdrop are replaced by random human children on most pages and prompts are visible. |
| 164 | Glimmer and Spark Make a Deal | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Glimmer and Spark become random children/adults and dragons change between green/orange models. |
| 165 | Wren and Flint Get Lost | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | A visually coherent story still normalises travelling lost and alone without a safety plan. |
| 166 | Burrow and Luna and the Old Secret | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Burrow becomes a human, Luna changes species, and tunnel exploration lacks a safety structure. |
| 167 | Pip and Glimmer and the Night Watch | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Pip, Glimmer, Burrow, and Stone drift; Stone is omitted early; Burrow is duplicated and prompt text appears. |
| 168 | Fern and Wren and the Wrong Potion | full sequence rebuild | high | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Wren is replaced on several pages and generated labels/books break the potion sequence. |
| 169 | Stone and Dewdrop and the Stuck Fish | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Inset/contact-sheet fragments, prompt text, and drifting models obscure the fish rescue. |
| 170 | The Missing Magic Seeds | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Prompt text, labels, and random human children replace the established Moonwood cast. |
| 171 | The Night the Stars Fell | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Babyfied face-star spirits and a night cliff route conflict with the series tone and safety standard. |
| 172 | Something Lives in the Hollow Oak | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Random humans/animals replace the cast, prompt text appears, and the hollow-oak resident lacks a stable design. |
| 173 | The Big Moonwood Race | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Random cast substitutions, labels, and prompt text make the race incoherent. |
| 174 | The Fog Marsh Mystery | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | Random children replace Pip, Luna, Fern, Dewdrop, and the mist spirit. |
| 175 | Glimmer Breathes Fire at Last | full sequence rebuild | critical | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 | The cast is random, Glimmer changes colour, Luna becomes an elderly woman, prompts are visible, and wildfire is framed as celebration. |
| 176 | One Night in the Deep Dark | partial replacement | high | 4, 6, 11 | Pages 4 and 6 are identical, so the decision beat is missing; later creatures appear visually fused. |

## Copy And Curriculum Changes Required Before Art

- **28. Bugs:** Review the category label 'bugs' and explicitly identify the earthworm as an invertebrate, not an insect.
- **41. Space:** Replace 'the Sun is the biggest' with wording scoped to the solar system, such as 'The Sun is much bigger than Earth.'
- **53. Shapes Everywhere:** At the next voice-and-copy revision, change the page 5 wording to distinguish a five-point star shape from a physical star in the night sky.
- **54. Big and Small:** At the next voice-and-copy revision, make every use of big and small explicitly comparative and replace the false generalisation that a fish is small; fish species range from tiny gobies to whale sharks.
- **55. Hot and Cold:** At the next voice-and-copy revision, do not define hot as warm or cold as cool. Present hot, warm, cool and cold as different relative ranges on a temperature scale.
- **56. Things That Float and Sink:** At the next voice-and-copy revision, say toy duck rather than duck, and explain that floating depends on density, shape and displaced water; weight alone does not decide whether something sinks.
- **57. Push and Pull:** At the next voice-and-copy revision, replace pin with paperclip so the magnet demonstration uses a blunt classroom object rather than a sharp point.
- **58. Hello, Sun!:** At the next voice-and-copy revision, explain that sunrise and sunset are apparent motions caused by Earth's rotation, and replace 'midday is the hottest part' because daily maximum air temperature often occurs later in the afternoon.
- **59. The Moon:** At the next voice-and-copy revision, say the Moon looks different as its sunlit fraction changes, explain that moonlight is reflected sunlight, avoid the vague 'travels very slowly', and replace 'we can see it every night' because phase, weather and viewing time can make the Moon invisible.
- **60. Day and Night:** At the next voice-and-copy revision, replace 'the sun goes away' with an Earth-turning explanation and clarify that the Moon and stars do not literally come out; they become easier to see as the sky darkens.
- **61. My Five Senses:** At the next voice-and-copy revision, avoid saying that hands should test whether unknown things are hot or cold. Teach children not to touch an unknown hot object and use safe warm/cool materials under adult supervision.
- **62. How I Grow:** At the next voice-and-copy revision, explain that growth also depends on sleep, movement, health and inherited traits, and replace 'one day I will be tall' with body-positive wording because healthy people grow at different rates and to different adult heights.
- **63. Staying Healthy:** At the next voice-and-copy revision, replace 'good food' with varied or nourishing food, explain that sleep supports growth and repair rather than being the only time the body grows, and do not treat smiling as a requirement or visible test of health.
- **64. My Body:** At the next voice-and-copy revision, explain that food moves through the mouth, stomach and intestines rather than simply going into a 'tummy'; acknowledge that bodies move, sense and communicate in different ways; and prefer 'safe and cared for' to strength as the measure of a body.
- **66. Water Everywhere:** At the next voice-and-copy revision, replace 'steam' with water vapour and explain that the visible white cloud is tiny condensed droplets; clarify that Earth is called a water planet because oceans cover most of its surface, but most water is salty and only a small fraction is readily available fresh water.
- **67. Bees:** At the next voice-and-copy revision, say many flowering plants rely on bees but also acknowledge other pollinators, wind and self-pollination; avoid implying that no bees means no vegetables; tie the 'two million flowers' estimate to a defined amount of honey; replace 'bees love' and 'work hard' with nectar/pollen and foraging language; and say pollination helps plants make seeds and fruit rather than making flowers grow.
- **100. Aiden and Betty and Socks:** Rewrite the series premise so Socks is a species-appropriate domestic pet, not a wild primate kept in a home.
- **101. Socks Goes Missing:** Carry the ethical Socks rewrite through this entire story.
- **102. Aiden and Betty and the Science Fair:** Rewrite the experiment from copper sulphate to a school-approved alum or salt crystal activity with explicit adult supervision.
- **103. Aiden, Betty and Socks's Big Adventure:** Carry the ethical domestic-pet rewrite through the full book.
- **120. What is Flappy?:** Review every statement against current introductory Archaeopteryx science and avoid calling it simply a modern bird.
- **150. Grumpy's Secret:** Revise the ending so the confidence is respected, or explicitly model asking permission before sharing.
- **154. Stone Crosses the Bridge:** Rewrite the damaged-bridge sequence to model stopping, reporting, repair, and safe crossing.
- **157. Flint Makes a Map:** Rewrite the journey to include a companion/adult plan, daylight route, rest, water, and check-ins.
- **165. Wren and Flint Get Lost:** Rewrite the lost sequence around stop-stay-put, signalling, route markers, and an agreed check-in plan.
- **175. Glimmer Breathes Fire at Last:** Rewrite the climax so success is controlled fire practice and lantern activation, never a spreading forest fire.

## Generation Contract

Each manifest entry already includes the page text, exact required scene, continuity lock, full generation prompt, negative constraints, source dimensions, and acceptance checks. The generation process must preserve each page's recorded width, height, aspect ratio, and live path, and may write only after the image passes every recorded visual acceptance check.

Generate one candidate at a time for partial repairs and two candidates per page for full rebuilds. Keep a rejection log. Selection criteria are, in order: educational accuracy, cast continuity, action clarity, safety, anatomy, then surface beauty. Never select a prettier image that fails an earlier criterion.

## Current Validation Blockers

- The visual-audit integrity check passes: all 2,005 physical files are partitioned exactly once, all 1,616 live paths exist, and all 951 rejected pages have a complete prompt and live replacement path.
- npm run validate:guided-reading is already failing across legacy books because imageAlt, pageDescription, and targetWords metadata are missing; it also reports existing noun/image-metadata conflicts. This audit does not modify those content records.
- npm run validate:guided-reading-regen still expects /Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Regen Assets Pack, which no longer exists after the project migration. That path must be made configurable or pointed at the new pack location before regeneration-pack validation can run.
- Both new audit builders pass ESLint and Node syntax checks.

## Definition Of Done

The audit is resolved only when all 951 manifest items have status approved-and-installed, all 389 inactive files are outside the runtime allowlist, all book sequences pass full-size human review, no copy-change note remains open, and the guided-reading validators plus production build pass. Until then, the manifest is the source of truth for remaining work.
