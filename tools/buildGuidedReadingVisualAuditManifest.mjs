#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "public");
const docsRoot = path.join(repoRoot, "docs", "guided-reading");
const replacementManifestPath = path.join(docsRoot, "guided_reading_visual_replacement_manifest.json");
const coveragePath = path.join(docsRoot, "guided_reading_visual_audit_coverage.json");
const reportPath = path.join(docsRoot, "GUIDED_READING_VISUAL_CONTINUITY_AUDIT.md");
const installedAuditPath = path.join(docsRoot, "guided_reading_visual_installed.json");
const postInstallAuditPath = path.join(docsRoot, "guided_reading_post_install_visual_findings.json");
const IMAGE_PATTERN = /\.(?:png|jpe?g|webp)$/i;
const ALL = "all";

const issueLabels = {
  anthropomorphic: "anthropomorphic-object styling",
  anatomy: "anatomy or species error",
  composition: "unclear or incoherent composition",
  continuity: "character, prop, or setting continuity",
  duplicate: "duplicate or fused subject",
  ethics: "animal-welfare or ethical-content concern",
  misleading: "educationally misleading visual",
  promptLeak: "generation prompt or production text visible",
  safety: "unsafe behaviour presented without mitigation",
  science: "scientific inaccuracy",
  text: "unintended, malformed, or unnecessary embedded text",
  textMatch: "page text and image do not match",
  tone: "babyfied or tonally inconsistent art",
  style: "series or rendering-style inconsistency",
  duplication: "duplicate frame or repeated composition",
};

function audit({ pages, severity = "high", issues, finding, continuity, pageNotes = {}, copyNote = "" }) {
  return { pages, severity, issues, finding, continuity, pageNotes, copyNote };
}

// Keys are the one-based positions in guidedReadingBooks. Every omitted book is a visual pass.
const audits = {
  2: audit({ pages: [1, 2, 4, 5, 6], issues: ["anthropomorphic", "text"], finding: "Smiling sun characters replace the real Sun, and page 4 contains a fabricated book title.", continuity: "Use one natural, non-sentient Sun and a consistent observational illustration style; keep the Sun's apparent size and colour plausible." }),
  3: audit({ pages: [3, 5, 6], issues: ["anthropomorphic"], finding: "Sun faces reintroduce the babyfied object style.", continuity: "Keep the same clean colour-object visual language across all six pages; natural objects must have no faces." }),
  4: audit({ pages: ALL, issues: ["continuity", "anthropomorphic"], finding: "The first-person narrator changes appearance and the final natural scene uses a smiling sun.", continuity: "Lock one named child reference: identical face, skin tone, hair, clothes, proportions, and age on every page; show body actions clearly and naturally." }),
  5: audit({ pages: [6], severity: "moderate", issues: ["continuity"], finding: "The four-season summary does not preserve one identifiable child across all quadrants.", continuity: "Use the same child and the same viewpoint in all four seasonal quadrants; change only weather, foliage, and appropriate outerwear." }),
  6: audit({ pages: [3], issues: ["textMatch"], finding: "The text names one grape but the picture shows a bunch.", continuity: "Show exactly one clearly separated grape, matching the singular noun and the book's existing fruit scale." }),
  7: audit({ pages: [1, 5], issues: ["text", "misleading"], finding: "Page 1 contains the generated sound word CLACK; page 5 has malformed ruler markings.", continuity: "Keep the established tool illustration style. Show tools accurately, with no lettering; ruler ticks must be evenly spaced and physically credible." }),
  9: audit({ pages: [3, 4, 5, 6], issues: ["text", "anthropomorphic", "textMatch"], finding: "Generated signs and labels are baked into the art; the firefighter action is unclear; the final Sun has a face.", continuity: "Use coherent real-world community settings and plausible uniforms/equipment. No signs or labels unless added later as verified UI text." }),
  10: audit({ pages: [1], issues: ["composition", "safety"], finding: "Water is poured onto a table instead of into a vessel.", continuity: "Show a child carefully pouring water from a small jug into a clearly visible cup on a stable table, with no spill." }),
  11: audit({ pages: ALL, issues: ["continuity"], finding: "A first-person sequence uses multiple unrelated children.", continuity: "Lock one child narrator across all five senses: same face, hair, skin tone, clothes, age, and proportions; frame one unambiguous sense action per page." }),
  13: audit({ pages: [6], issues: ["text"], finding: "The shirt contains generated EARTH DAY lettering.", continuity: "Keep the child and globe composition but use a plain, unbranded shirt with no words or symbols." }),
  14: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "tone"], finding: "The narrator changes from page to page and the final art contains face-like sun/star decorations.", continuity: "Use one child reference throughout, in the same home and clothing family; present healthy actions calmly and without faces on food, weather, clothing, or decorations." }),
  16: audit({ pages: [4, 6], issues: ["science", "misleading"], finding: "Page 4 uses cartoon five-point symbols as stars; page 6 contains duplicate Earth-like planets.", continuity: "Use a restrained, scientifically plausible space style: luminous distant stars and clearly different planets, with Earth appearing no more than once." }),
  17: audit({ pages: [4], issues: ["textMatch", "science"], finding: "A tortoise is shown for text that names a turtle.", continuity: "Show an aquatic or semi-aquatic turtle with appropriate shell and feet in a credible habitat, not a land tortoise." }),
  18: audit({ pages: [4], issues: ["science", "text"], finding: "The frog life-cycle diagram is unclear and includes unreliable A/B/C/D labels.", continuity: "Show an accurate, clockwise frog life cycle with clearly separated eggs, tadpole, froglet, and adult frog; no embedded labels or letters." }),
  19: audit({ pages: [1], issues: ["text"], finding: "The illustrated book contains unreadable generated writing.", continuity: "Keep the magnet demonstration but make all books, papers, and packaging blank and unbranded." }),
  20: audit({ pages: [6], issues: ["anthropomorphic"], finding: "The Sun has a face.", continuity: "Use the same clothing style and child scale as adjacent pages; depict a natural Sun with no facial features." }),
  21: audit({ pages: [3], issues: ["text"], finding: "COOKIES is baked into the image.", continuity: "Show the same child smelling freshly baked biscuits or cookies on a tray; no written label, packaging text, or signage." }),
  23: audit({ pages: [3, 7], issues: ["anthropomorphic"], finding: "Smiling Sun characters break the otherwise observational farm style.", continuity: "Keep farm animals anatomically clear and use a natural sky and Sun with no faces." }),
  24: audit({ pages: [3, 5], issues: ["text", "anthropomorphic"], finding: "The bus contains embedded lettering and the Sun/Moon are drawn as characters.", continuity: "Use familiar objects at a child-readable scale, blank vehicles, and natural celestial bodies without faces." }),
  25: audit({ pages: [2, 7], issues: ["anthropomorphic", "composition"], finding: "The Sun and cloud have faces and the summary composition is incoherent.", continuity: "Use realistic water contexts with a natural sky. The summary must show water being used or found in several clearly separated, plausible places." }),
  26: audit({ pages: [1, 3, 4, 7], issues: ["anthropomorphic", "science", "tone"], finding: "Face-bearing Sun art, five-point star symbols, and an unnatural rainbow bird undermine the sky lesson.", continuity: "Use natural daytime and nighttime skies; stars are points of light, and any bird has plausible plumage and anatomy." }),
  27: audit({ pages: [5], issues: ["anthropomorphic"], finding: "The Sun has a face.", continuity: "Retain the animal action and terrain, replacing only the sky with natural weather and no face-like forms." }),
  28: audit({ pages: [2, 6, 7], issues: ["anthropomorphic", "science", "textMatch"], finding: "A smiling flower and Sun recur, the caterpillar does not look fast, and the book groups an earthworm with insects.", continuity: "Use biologically credible small animals at readable scale; no faces on plants or weather. Distinguish insects from other invertebrates.", copyNote: "Review the category label 'bugs' and explicitly identify the earthworm as an invertebrate, not an insect." }),
  29: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "safety"], finding: "The first-person child, home, and pets drift; a cage is implausibly small and natural objects have faces.", continuity: "Lock one child, one home, and the same individual pets throughout. Give each animal species-appropriate space, water, enrichment, and handling; no faces on objects or weather." }),
  30: audit({ pages: [1, 3, 6, 7], issues: ["anthropomorphic", "textMatch", "safety"], finding: "The Sun and summary objects have faces, a camping bear appears without context, and clear water is named as milk.", continuity: "Use safe everyday hot/cold comparisons, with exact substances and no face-bearing objects. Keep children supervised around hot items." }),
  31: audit({ pages: ALL, issues: ["misleading", "textMatch", "anthropomorphic"], finding: "Several pictures teach the object instead of the 2D shape: ball/circle, box/square, arched door/rectangle, kite/triangle; celestial symbols have faces.", continuity: "Make the target 2D outline unmistakable within a real object: circular face, square face, rectangular face, triangular face. Use separate, clean examples and no faces on shapes." }),
  32: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "textMatch"], finding: "The first-person farm visit lacks one stable child and coherent location; several skies contain smiling suns.", continuity: "Lock one child narrator, one farm, one time of day, and recurring farm layout across all pages; show exact animal counts and natural weather." }),
  33: audit({ pages: [7], issues: ["textMatch", "safety"], finding: "A child in a paddling pool is used for a sea/shore conclusion.", continuity: "Show a supervised child at the seashore, standing safely at the water's edge with visible beach and open sea." }),
  34: audit({ pages: [3, 5], issues: ["textMatch"], finding: "Singular fruit nouns are illustrated as multiple plums/grapes.", continuity: "Show exactly one plum on page 3 and exactly one detached grape on page 5, isolated clearly against the same simple background." }),
  35: audit({ pages: ALL, issues: ["continuity", "science"], finding: "The tree changes identity across a single growth/season sequence.", continuity: "Lock one identifiable apple tree, viewpoint, surrounding ground, and horizon. Change only the growth stage, leaves, blossom, and fruit required by the page text." }),
  36: audit({ pages: [7], issues: ["composition", "textMatch"], finding: "The summary does not clearly pair each baby animal with its adult.", continuity: "Use three or four separated adult-young pairs, with matching species placed directly together and no extra animals." }),
  37: audit({ pages: [1, 2, 3, 6, 7], issues: ["anthropomorphic", "text", "textMatch"], finding: "Faces on weather objects, bus lettering, and a tortoise called a turtle weaken the comparisons.", continuity: "Show clean side-by-side motion comparisons, blank vehicles, natural skies, and an actual turtle where the text says turtle." }),
  38: audit({ pages: ALL, issues: ["continuity", "science"], finding: "The seed, pot, plant, location, and caregiver change during one life cycle.", continuity: "Lock one sunflower seed, one distinctive pot, one child caregiver, one windowsill/garden location, and one camera angle; progress botanically from seed to mature sunflower." }),
  39: audit({ pages: ALL, issues: ["continuity"], finding: "The first-person child is not consistent across the body sequence.", continuity: "Lock one child narrator in plain clothes, with the same appearance and proportions; clearly frame the named body part or action without labels." }),
  40: audit({ pages: [1, 3, 5, 6, 7], issues: ["anthropomorphic", "misleading"], finding: "Sun and Moon characters dominate the day/night lesson.", continuity: "Use one consistent home/landscape through a natural day-to-night transition. Sun and Moon must be non-sentient and astronomically plausible." }),
  41: audit({ pages: ALL, issues: ["science", "anthropomorphic", "misleading", "continuity"], finding: "The sequence mixes an impossibly oversized Moon, face-bearing celestial bodies, symbol-shaped stars, and mutually incompatible rendering styles.", continuity: "Rebuild the full sequence in one scientifically grounded solar-system rendering language. Keep planet identities and broad scale relationships clear, use distant points of light for stars, show no faces, and never duplicate Earth.", copyNote: "Replace 'the Sun is the biggest' with wording scoped to the solar system, such as 'The Sun is much bigger than Earth.'" }),
  42: audit({ pages: [5, 6], issues: ["anthropomorphic"], finding: "A pumpkin and Sun have faces.", continuity: "Use natural objects with no facial features; preserve the clean single-colour teaching composition." }),
  43: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "science", "safety"], finding: "The landscape, children, and rendering style change between seasons; face-bearing Suns recur, and the hibernation page shows a blanket-covered bear beside a lit fireplace inside a cave.", continuity: "Lock one identifiable orchard-meadow viewpoint with the same tree, cottage, wall, and gate across the full sequence. Change only season, weather, plant growth, animal behaviour, and clothing; keep all natural objects non-sentient and show hibernation without human bedding or fire." }),
  44: audit({ pages: ALL, issues: ["continuity", "science", "anthropomorphic"], finding: "The seed, plant, pot, and children drift across one growth sequence; watering equipment and Sun have faces.", continuity: "Lock one sunflower seed, pot, location, and child pair across the entire sequence. Show accurate germination and growth with natural objects only." }),
  45: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "safety", "tone"], finding: "Every page swaps the child, location, and rendering style; weather is personified, and the summary shows a child balancing on a stool beside an open window with face-bearing weather cards.", continuity: "Lock one child and one identifiable home-garden viewpoint across all weather conditions. Change only weather and season-appropriate clothing; observe thunderstorms safely from indoors, and use four matched real-scene panels rather than icons for the summary." }),
  46: audit({ pages: [1, 4, 5, 8], issues: ["anthropomorphic", "textMatch", "science"], finding: "Sun faces recur and the rose page does not clearly show thorns.", continuity: "Use botanically recognisable plants with natural skies. On the rose page, show a close, safe view of visible stem thorns without a child touching them." }),
  47: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "science", "textMatch", "tone"], finding: "The sequence uses babyfied, thick-outline animal cartoons with oversized eyes; Sun faces recur, the hatching chick pose is implausible, and the labelled closing page omits most of the animals taught in the book.", continuity: "Rebuild the full book as a coherent, natural-history-inspired parent-and-young sequence with recognisable species, sound anatomy, natural habitats, no personified objects or embedded labels, and a closing spread that accurately recaps all seven young animals." }),
  48: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "science", "safety", "textMatch", "tone"], finding: "The full sequence uses babyfied thick-outline animals and inconsistent infographic devices; the milking page shows an unsupervised child and a split scene, the wool page floats a jumper beside a sheep, the horse does not pull or carry anything, and the closing scene muddles adult and young animal counts.", continuity: "Rebuild the book as one premium natural-history-inspired British farm sequence. Use anatomically sound adult animals, literal single-scene actions, supervised food-production context, natural weather, and exact quantities; show one duck on page 7 and a clear food-and-farming recap on page 8." }),
  49: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "science", "textMatch", "tone"], finding: "The entire ocean sequence uses thick-outline mascot animals; the whale has invented facial and mouth anatomy, the octopus does not present eight coherent arms, the crab and seahorse are personified, and the closing spread repeats the same scientifically weak stock forms.", continuity: "Rebuild the full book as a luminous, natural-history-inspired temperate Atlantic sequence with recognisable species, accurate anatomy and scale, natural behaviour, exact arm and animal counts, no personified sky or sea life, and a coherent closing reef-and-open-water recap." }),
  50: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "science", "text", "textMatch", "tone"], finding: "The full nocturnal sequence uses thick-outline mascot animals; the opening contains ZZZ lettering, bat and fox anatomy/expressions are babyfied, hunting and feeding behaviours are weakly shown, and the closing Moon has a face.", continuity: "Rebuild the book in one coherent British woodland-edge habitat, with the same tawny owl across the day/night contrast, recognisable native nocturnal species, accurate hunting and feeding behaviour, calm low-light visibility, natural lunar texture and phase, and no embedded text or personified objects." }),
  51: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "science", "text", "textMatch", "tone"], finding: "The full garden-invertebrate sequence uses smiling, thick-outline mascots with weak body segmentation and scale; the ant colony is a crowded cartoon cutaway, greenfly are barely legible, Sun and clouds have faces, and the final art contains BELOW GROUND lettering.", continuity: "Rebuild the book as one coherent British wildlife-garden macro study with biologically plausible close-ups, correct wings, legs, segments and shells, honest scale cues, visible greenfly on a stem, natural soil/root relationships, no personified objects, no embedded labels, and a closing ecosystem view that keeps every taught invertebrate recognisable." }),
  52: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "science", "safety", "text", "textMatch", "tone"], finding: "The full sequence treats pets as thick-outline mascots; the dog-care page contains DOG FOOD lettering and outdoor bowls, the cat uses music-note symbols, the aquarium lacks clear filtration and enrichment, the hamster enclosure is undersized, and the closing page places a fish bowl and all pets outdoors among face-bearing trees and Sun.", continuity: "Rebuild the book around one identifiable child and family home while keeping every pet in a species-appropriate domestic setting. Show humane handling, supervised walks, safe food and water placement, a large filtered planted aquarium, a deep enriched hamster habitat with a correctly sized solid wheel, no animal dressing or personified objects, and a closing home sequence that does not crowd incompatible animals together." }),
  53: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "misleading", "tone"], finding: "The whole sequence uses thick-outline flashcard compositions and personified objects; giant Sun, cloud, Moon and star characters confuse ordinary 2D object faces with natural bodies, while the final shape hunt is visually crowded and weakly prioritised.", continuity: "Rebuild the book as one coherent real-world shape walk using ordinary object faces and outlines, one clear pair of examples per teaching page, consistent child and setting, no sentient shapes, and a restrained closing search scene. On page 5, clearly distinguish a five-point drawn star symbol from real stars, which appear as small points of light rather than five-point physical objects.", copyNote: "At the next voice-and-copy revision, change the page 5 wording to distinguish a five-point star shape from a physical star in the night sky." }),
  54: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "text", "textMatch", "tone"], finding: "The full comparison sequence uses thick-outline nursery mascots: the elephant, mouse, whale, fish and Suns are personified, the bus has a face and BUS/SCHOOL lettering, and the closing park spread abandons the taught examples for unrelated dogs and balls.", continuity: "Rebuild the whole book as one coherent, naturalistic scale study with recognisable animals and ordinary objects, no faces on animals beyond natural expression, no personified sky, no embedded writing, and no forced side-by-side pairings that distort real scale. Use environmental scale cues and a closing recap that revisits the actual elephant/mouse, bus/toy car, tree/flower and whale/fish comparisons in their appropriate habitats.", copyNote: "At the next voice-and-copy revision, make every use of big and small explicitly comparative and replace the false generalisation that a fish is small; fish species range from tiny gobies to whale sharks." }),
  55: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "safety", "text", "textMatch", "tone"], finding: "The entire sequence uses thick-outline nursery cartoons and inconsistent children; Sun, kettle, drink and ice-lolly faces recur, HOT/COLD and book-spine writing are embedded, the recap is a labelled worksheet, and the fire and steaming-food scenes place children too close to burn hazards without clear adult control.", continuity: "Rebuild the full book around one identifiable child and caregiver across a British family home and garden. Model shade, hydration and sun protection; keep fires fully guarded with the child behind a clear safe boundary; keep hot food under adult control while it cools; show cold water in a normal drinking context; preserve the same child, home and weather cues; and use a restrained closing comparison with no labels, object faces or unsafe touching.", copyNote: "At the next voice-and-copy revision, do not define hot as warm or cold as cool. Present hot, warm, cool and cold as different relative ranges on a temperature scale." }),
  56: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "safety", "textMatch", "tone"], finding: "The full sequence shifts between unrelated nursery-cartoon scenes, personifies the duck and tree, uses a fish bowl and unstable open floor tub for experiments, suspends the stone and coin in mid-water instead of resting them on the bottom, and presents weight alone as the reason objects sink.", continuity: "Rebuild the entire book as one supervised tabletop investigation with the same child and caregiver, one stable transparent rectangular tank on an absorbent mat, a clear waterline, and consistent safe test objects. Show floaters intersecting the surface and sinkers visibly resting on the bottom; use a toy duck and model boat rather than living animals or open-water play; keep water shallow and under adult control; and preserve exact object identity and position across prediction, test and recap pages.", copyNote: "At the next voice-and-copy revision, say toy duck rather than duck, and explain that floating depends on density, shape and displaced water; weight alone does not decide whether something sinks." }),
  57: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "safety", "text", "textMatch", "tone"], finding: "The entire sequence uses inconsistent thick-outline children and settings; PUSH/PULL labels, arrows and product writing turn actions into worksheets, the zip slider has a face, the Sun is personified, and a giant lettered magnet lifts a hazardous cluster of sharp pins.", continuity: "Rebuild the full book around one identifiable child and caregiver moving between the same family home, garden and nearby playground. Make every push or pull readable from body position, contact point and resulting object position without arrows or labels; preserve one consistent door, coat, wagon, ball and swing; keep swing action supervised and modest; and stage magnet work as a seated tabletop investigation with small colour-coded magnets and blunt paperclips under adult control.", copyNote: "At the next voice-and-copy revision, replace pin with paperclip so the magnet demonstration uses a blunt classroom object rather than a sharp point." }),
  58: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "safety", "misleading", "textMatch", "tone"], finding: "The full sequence personifies the Sun, Earth, stars and sunflowers, uses a false same-scale planet lineup, changes children and settings, and visually supports the misconception that the Sun itself travels up and down around a stationary viewer; the midday page also reinforces a false hottest-time claim.", continuity: "Rebuild the whole book with accurate unpersonified space plates for the Sun-Earth relationship and one identifiable child and caregiver observing the same British home and garden from morning to evening. Preserve horizon direction, garden landmarks, clothing and weather across the day; use short midday shadows and warm low-angle evening light; model shade, hats, water and sunscreen; never show direct solar viewing; and keep all stars, planets and plants natural rather than sentient.", copyNote: "At the next voice-and-copy revision, explain that sunrise and sunset are apparent motions caused by Earth's rotation, and replace 'midday is the hottest part' because daily maximum air temperature often occurs later in the afternoon." }),
  59: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "misleading", "textMatch", "tone"], finding: "The full sequence mixes changing children and thick-outline astronomy cartoons; the Moon, Earth, planets and stars are personified, phase art treats the Moon as physically changing shape, the orbit is an arbitrary dotted loop, and the astronaut scene is generic and historically weak.", continuity: "Rebuild the whole book with one identifiable child and caregiver for ground observations, the same recognisable lunar maria and crater texture across every phase, realistic star pinpoints, and accurate unpersonified space plates. Show the crescent as a lit fraction of the same sphere, make the Earth-Moon relationship spatially clear without decorative arrows, and use one Apollo-era EVA astronaut, life-support backpack and lunar module on an airless grey surface with harsh sunlight and black sky.", copyNote: "At the next voice-and-copy revision, say the Moon looks different as its sunlit fraction changes, explain that moonlight is reflected sunlight, avoid the vague 'travels very slowly', and replace 'we can see it every night' because phase, weather and viewing time can make the Moon invisible." }),
  60: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "text", "misleading", "textMatch", "tone"], finding: "The whole sequence mixes unrelated children, homes, panel layouts and thick-outline nursery cartoons; Sun and Moon faces, symbolic stars, worksheet arrows and duplicate labels recur, while the night pages imply that the Sun leaves rather than that Earth rotates.", continuity: "Rebuild the full book around one identifiable child and caregiver moving through one chronological day in the same British home and garden. Preserve the house, tree, bench, shed, horizon direction, cast and clothing across outdoor views; use natural Sun, Moon and star appearances with no labels or arrows; show waking, eating, learning, playing and bedtime as a coherent routine; explain rotation with an accurate half-lit Earth and off-frame Sun; and close with a matched dawn-to-night time-lapse from the fixed garden viewpoint.", copyNote: "At the next voice-and-copy revision, replace 'the sun goes away' with an Earth-turning explanation and clarify that the Moon and stars do not literally come out; they become easier to see as the sky darkens." }),
  61: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "safety", "text", "textMatch", "tone"], finding: "The first-person narrator changes into six unrelated children; thick-outline nursery cartoons, rainbow motifs, face-bearing food and weather, decorative sense arrows, music notes and sound-effect words turn the lesson into inconsistent clip art, while the touch page does not model a safe distinction between texture exploration and testing unknown hot objects.", continuity: "Rebuild the full book around one identifiable child and caregiver in one bright British kitchen opening onto the same wildlife garden. Recur a restrained discovery set of coloured wooden shapes, a small wind chime, mint or lavender, safe sliced fruit, a smooth stone and a rough pinecone. Give each teaching page one readable sensory action with natural visual evidence rather than arrows, icons or words; keep food hygienic and supervised; demonstrate temperature only with known safe warm and cool cloth packs checked by the caregiver; and use the same child and objects for the recap and open question.", copyNote: "At the next voice-and-copy revision, avoid saying that hands should test whether unknown things are hot or cold. Teach children not to touch an unknown hot object and use safe warm/cool materials under adult supervision." }),
  62: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "safety", "text", "misleading", "textMatch", "tone"], finding: "The first-person narrator changes ethnicity, facial structure, hair, family and rendering style across nearly every page; split scenes use unrelated children, a smiling Sun returns, the final height chart contains generated numbers, and the sequence treats becoming tall as a universal or preferable outcome rather than showing healthy individual variation.", continuity: "Rebuild the book as a clear age progression of one child with one recurring caregiver and one recognisable British family home and garden. Lock facial features, skin tone, hair texture and family resemblance while showing the same child at about 6 months, 9 months, 14 months, 4 years and 7 years; change body proportions, movement skill and age-appropriate clothing deliberately. Show awake infant floor play on a firm mat with direct supervision, stable furniture and clear walking support; use matched vignettes only where the sentence genuinely requires more than one moment; keep food balanced and family-centred; and end with the present child being measured against an unnumbered doorframe mark rather than a labelled height chart or imagined ideal adult.", copyNote: "At the next voice-and-copy revision, explain that growth also depends on sleep, movement, health and inherited traits, and replace 'one day I will be tall' with body-positive wording because healthy people grow at different rates and to different adult heights." }),
  63: audit({ pages: ALL, issues: ["continuity", "composition", "safety", "text", "misleading", "textMatch", "tone"], finding: "The sequence has no established narrator: food is isolated clip art, then water, movement, handwashing, toothbrushing and sleep use unrelated children, homes and rendering styles; the movement page includes poorly protected wheeled play, and the labelled MORNING/MIDDAY/EVENING/NIGHT recap changes the child again. The lesson also moralises food and equates visible smiling with health.", continuity: "Rebuild the full book around one identifiable child and caregiver moving through one coherent day in the same British family home, garden and nearby park. Lock face, hair, clothing and home landmarks; show a varied ordinary meal without moral ranking, plain water, safe running/jumping/play with correctly fitted protective equipment where needed, effective handwashing with soap at a stable child-height setup, a pea-sized amount of fluoride toothpaste with adult supervision and spitting rather than swallowing, and a calm age-appropriate bedtime. Use the same child in an unlabelled recap sequence with natural day lighting and no icons.", copyNote: "At the next voice-and-copy revision, replace 'good food' with varied or nourishing food, explain that sleep supports growth and repair rather than being the only time the body grows, and do not treat smiling as a requirement or visible test of health." }),
  64: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "safety", "text", "misleading", "textMatch", "tone"], finding: "The first-person narrator changes face, skin tone, hair and clothing across the book; thick-outline nursery art embeds CLAP, symbolic food thoughts, anatomy circles/arrows, motion doodles and face-bearing Suns, while the final cape and smiling star badge confuse body ownership and safety with superhero strength.", continuity: "Rebuild the full book around one identifiable child and trusted caregiver in one recognisable British home and garden. Lock the child's face, hair, plain outfit and natural proportions; show head/face, clapping hands, abdomen after an ordinary meal, legs/feet in safe soft-ball play, and sensory attention through literal actions with no diagram symbols. Use matched frames only for genuinely sequential movement. Show everyday care through food, water, washing, rest and protective equipment, then close with the child practising a calm palm-out boundary gesture while the caregiver respects the space, alongside an ordinary fitted helmet and open route to tell a trusted adult; no superhero imagery, badges or claims about body shape.", copyNote: "At the next voice-and-copy revision, explain that food moves through the mouth, stomach and intestines rather than simply going into a 'tummy'; acknowledge that bodies move, sense and communicate in different ways; and prefer 'safe and cared for' to strength as the measure of a body." }),
  66: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "safety", "text", "misleading", "textMatch", "tone"], finding: "The full sequence uses changing children, thick-outline nursery cartoons, smiling Sun/cloud characters, symbolic water marks and labelled worksheet panels; the bath page presents hot-looking steam and crowded splashing, the plant/animal page is a disconnected split scene, the states page confuses visible mist with steam, and the closing Earth is another face-adjacent cartoon style.", continuity: "Rebuild the book around one identifiable child and caregiver following water through one recognisable British coastal catchment, family home and garden. Preserve the estuary, river, low hills, slate-roof village, home and cast; use natural clouds, rainfall, river levels, wildlife and drinking water; model safe handwashing rather than hot bath play; show plants and an animal using water in one supervised garden; stage state changes as an adult-led kitchen investigation with liquid water, ice and safely controlled warm water vapour/condensation; conserve rainwater with a covered water butt; and close with an accurate unpersonified Earth space plate. No labels, faces, worksheet icons or generated text.", copyNote: "At the next voice-and-copy revision, replace 'steam' with water vapour and explain that the visible white cloud is tiny condensed droplets; clarify that Earth is called a water planet because oceans cover most of its surface, but most water is salty and only a small fraction is readily available fresh water." }),
  67: audit({ pages: ALL, issues: ["anthropomorphic", "continuity", "composition", "science", "safety", "text", "misleading", "textMatch", "tone"], finding: "Every page uses thick-outline mascot bees with invented faces, inconsistent leg/wing/body anatomy and changing visual grammar; queen scale is distorted, nectar transfer is acted like a conversation, pollen is shown as decorative dots, pollination becomes an instant 'with bees / no bees' death panel, honey gains branding and a clock, and the child-gardening page abandons the macro sequence.", continuity: "Rebuild the full book as one premium British natural-history sequence around the same southern British apiary edge, wildflower strip and apple tree. Use a recurring anatomically plausible western honey bee with head, thorax, abdomen, six legs, two pairs of wings, antennae, body hairs and realistic pollen baskets; distinguish queen and workers by anatomy rather than crowns or scale fantasy; show natural nectar collection, trophallaxis, fanning/capped comb, pollen transfer, blossom-to-seed/fruit development, a plain unlabelled honey jar, and supervised bee-friendly planting at a safe distance. Keep hive, dry-stone wall, green-roofed wooden boxes, lavender, clover, oxeye daisies and apple tree consistent; no faces, labels, arrows or infographic panels.", copyNote: "At the next voice-and-copy revision, say many flowering plants rely on bees but also acknowledge other pollinators, wind and self-pollination; avoid implying that no bees means no vegetables; tie the 'two million flowers' estimate to a defined amount of honey; replace 'bees love' and 'work hard' with nectar/pollen and foraging language; and say pollination helps plants make seeds and fruit rather than making flowers grow." }),
  68: audit({ pages: ALL, severity: "critical", issues: ["science", "safety", "anthropomorphic", "continuity"], finding: "The original sequence placed children dangerously close to active lava, used inaccurate eruption/map visuals, personified volcanoes, and could not accept local repairs without a severe style break. The book was promoted to a full sequence rebuild.", continuity: "Use the approved premium painted geological style across all nine pages: dark charcoal-brown volcanic rock, muted sage vegetation, blue-grey distance, terracotta/amber magma, tactile paper grain, natural landforms, safe viewpoints, and no faces or decorative fire." }),
  69: audit({ pages: [3, 9], issues: ["science", "anthropomorphic"], finding: "The brood-pouch depiction needs anatomical review and the final Sun has a face.", continuity: "Use one penguin species throughout, accurate adult/chick markings and scale, a credible brood-patch pose, and natural Antarctic light." }),
  70: audit({ pages: [1, 2, 3, 6, 8], issues: ["science", "anthropomorphic", "misleading"], finding: "Moon phases, tide imagery, and face-bearing Moon art are inconsistent.", continuity: "Use a consistent natural Moon surface and scientifically plausible phases; show tide comparison from the same shoreline and viewpoint; no faces." }),
  71: audit({ pages: [2, 3, 4, 5, 6, 7, 8, 9], issues: ["continuity", "science"], finding: "The seed and plant identity drift across one biological sequence.", continuity: "Lock one runner bean seed, transparent observation pot, soil level, stem, first leaves, support, location, and camera angle; progress accurately through germination to mature plant." }),
  72: audit({ pages: [1, 2, 3, 5, 8, 9], issues: ["science", "anatomy", "anthropomorphic"], finding: "Spider anatomy and web behaviour are inconsistent and sometimes personified.", continuity: "Use one anatomically plausible garden spider with eight legs, two main body sections, correct leg attachment, and a credible web; no face or human gestures." }),
  73: audit({ pages: [1, 2, 5, 6, 7, 8, 9], issues: ["science", "anthropomorphic", "composition"], finding: "Ocean zones, vessel scale, and marine-life placement are inconsistent; some subjects are personified.", continuity: "Use a coherent cutaway from sunlight zone to deep sea, accurate broad animal placement, one plausible research submersible, and no faces or fantasy props." }),
  74: audit({ pages: [1, 2, 4, 5, 6, 9], issues: ["continuity", "science", "anatomy"], finding: "The butterfly species and life-cycle anatomy drift between pages.", continuity: "Lock one monarch individual/species and host plant; accurately show egg, caterpillar instars, chrysalis, emergence, and adult with consistent markings." }),
  75: audit({ pages: [2, 5, 6, 9], issues: ["science", "safety", "anthropomorphic"], finding: "Cave formations smile, rainbow decoration appears, and children use open flames.", continuity: "Use geologically credible cave formations and one safe guided visit: helmets, headlamps, marked path, adult supervision, no open flame, no faces." }),
  76: audit({ pages: [2, 4], issues: ["anthropomorphic", "duplicate", "science"], finding: "The Sun has a face and one life-cycle stage is duplicated.", continuity: "Use one natural pond and one frog species; show each stage once, with a natural sky and no faces." }),
  79: audit({ pages: ALL, issues: ["continuity", "text"], finding: "Page 1 contains a generated story sentence and Fluff's appearance drifts across the short sequence.", continuity: "Lock Bob, Nan, and one specific dog Fluff from a character sheet; preserve clothes, coat markings, collar, scale, and home; no embedded story text." }),
  80: audit({ pages: [3, 5], issues: ["composition", "duplicate"], finding: "Page 3 contains repeated/blurred fragments and page 5 has a hard compositing seam.", continuity: "Keep Bob, Nan, and Fluff on one continuous beach with clean silhouettes, correct limbs, no repeated subjects, and no collage seams." }),
  82: audit({ pages: [6, 7], issues: ["safety", "composition"], finding: "The gorilla encounter does not show a clear, credible zoo barrier.", continuity: "Show Bob and Nan viewing a gorilla from the public side of substantial glass or a clearly separated habitat moat/barrier; never share the enclosure." }),
  85: audit({ pages: [2], issues: ["duplicate", "continuity"], finding: "Fluff appears twice in one scene.", continuity: "Show exactly one Fluff, matching the established coat, collar, and scale, alongside Bob and Nan." }),
  86: audit({ pages: [4], issues: ["duplicate", "continuity"], finding: "Mum is duplicated.", continuity: "Show one Mum, one vet, Bob, Nan, and exactly one Fluff in a coherent examination-room layout." }),
  87: audit({ pages: [7, 8, 9, 10, 13], issues: ["continuity", "science", "safety"], finding: "The rocket changes between pages and spacesuits appear before the landing sequence is coherent.", continuity: "Lock one rocket exterior/interior, one suit design per child, and a physically ordered sequence: seated launch, travel, landing, then suited exit. Preserve James and Anna exactly." }),
  88: audit({ pages: [3, 11], issues: ["safety", "textMatch"], finding: "A goat is encouraged to eat a hat and the requested jumper is not clearly shown.", continuity: "Keep James, Anna, and Chips consistent. Page 3 must show the hat safely retrieved before the goat eats it; page 11 must clearly feature the named jumper." }),
  89: audit({ pages: [6, 8, 11], issues: ["duplicate", "textMatch", "continuity"], finding: "James is duplicated, an indoor sale is shown outside, and Mum's identity drifts.", continuity: "Lock James, Anna, Mum, outfits, and shop layout. Show one of each person; indoor actions remain inside the same shop." }),
  92: audit({ pages: [3, 4], issues: ["textMatch"], finding: "The visible animal counts do not match the text.", continuity: "Use the established farm and characters; show exactly five countable eggs on page 3 and exactly three countable ducks on page 4, with no partially hidden extras." }),
  93: audit({ pages: [1, 2, 4, 5, 6, 13], issues: ["promptLeak", "duplicate", "continuity"], finding: "Generation instructions are visible, Anna is duplicated, and Mum/character appearance drifts.", continuity: "Lock James, Anna, Mum, classmates, costumes, and school hall from character/location sheets. No prompt text, captions, page numbers, or duplicate people." }),
  94: audit({ pages: [5], severity: "moderate", issues: ["composition"], finding: "A motion montage reads as several overlapping copies rather than one action.", continuity: "Show one Chips moving through one clear play action, using pose and subtle motion cues rather than duplicate bodies or inset panels." }),
  95: audit({ pages: [11], issues: ["duplicate", "composition"], finding: "Chips is duplicated in inset fragments.", continuity: "Show exactly one Chips and one continuous scene with James and Anna; remove all inset/contact-sheet fragments." }),
  96: audit({ pages: [6, 12, 14], severity: "critical", issues: ["safety", "continuity", "textMatch"], finding: "Three pages break an otherwise established James-and-Anna cartoon sequence: the fire staging is unsafe, the tent consequence is unclear, and the ending needs a cleaner cast-and-prop match.", continuity: "Match the established James-and-Anna cartoon exactly: the same clean outlines, cel shading, stylised child proportions, facial construction, clothing, cast designs and colour palette as the surrounding books. Preserve James, Anna, Mum, Dad, Chips, the green dome tent and the suburban garden campsite without redesigning them. Keep Chips safely away from the fire with an adult visibly supervising; make the eaten tent corner and repaired zip clearly readable. Do not convert any character, animal or setting to photorealism or realistic painted anatomy." }),
  97: audit({ pages: [5], issues: ["text", "continuity"], finding: "Desk names are mirrored or incorrect (including AIDEN/BETTY variants).", continuity: "Show Aiden and Betty at their established desks with blank name-card areas; render names later in the app as verified text." }),
  98: audit({ pages: [6, 8], issues: ["composition", "textMatch"], finding: "Clocks appear improbably on trees and an indoor action is staged outside.", continuity: "Keep one coherent yard-sale location. Put clocks on a table or display board and keep house-interior actions visibly indoors." }),
  99: audit({ pages: [3, 13], issues: ["safety"], finding: "Vehicle scenes do not visibly show Aiden and Betty wearing seat belts.", continuity: "Use the established family and car; both children sit correctly in rear seats with visible, correctly routed seat belts." }),
  100: audit({ pages: ALL, severity: "critical", issues: ["ethics", "safety", "text", "continuity"], finding: "A wild primate is treated as a household pet; the sequence includes palette-dot artefacts, gibberish, and kitchen hazards.", continuity: "Rewrite Socks as an ethical domestic pet such as a small dog, preserving one coat pattern, collar, scale, and family home. Keep the pet away from toaster, hob, hot pans, and food-preparation surfaces; no generated text.", copyNote: "Rewrite the series premise so Socks is a species-appropriate domestic pet, not a wild primate kept in a home." }),
  101: audit({ pages: ALL, severity: "critical", issues: ["ethics", "duplicate", "text", "continuity"], finding: "The wild-primate pet premise continues; Betty is duplicated and notebook writing is malformed.", continuity: "Use the rewritten domestic-pet Socks model and the established Aiden/Betty family. Show exactly one of each character, plausible search locations, blank papers, and no cutaway collage artefacts.", copyNote: "Carry the ethical Socks rewrite through this entire story." }),
  102: audit({ pages: [4, 5, 6, 7, 8], severity: "critical", issues: ["safety", "science", "ethics"], finding: "Children and Socks handle an open copper-sulphate experiment without PPE or adequate supervision.", continuity: "Replace the experiment with a child-safe alum or salt crystal activity supervised by an adult: goggles on children, closed labelled-by-UI container, stable tray, no pet on the work surface, and handwashing afterwards.", copyNote: "Rewrite the experiment from copper sulphate to a school-approved alum or salt crystal activity with explicit adult supervision." }),
  103: audit({ pages: ALL, severity: "critical", issues: ["ethics", "duplicate", "text", "continuity"], finding: "The wild-primate premise persists; Socks is duplicated and notebooks contain gibberish.", continuity: "Use one ethical domestic-pet Socks, one Aiden, and one Betty throughout one coherent outdoor adventure. No duplicate subjects, inset fragments, or writing in props.", copyNote: "Carry the ethical domestic-pet rewrite through the full book." }),
  104: audit({ pages: [2, 13], issues: ["text", "composition"], finding: "A thought-bubble treatment is tonally inconsistent and notebook writing is malformed.", continuity: "Use natural staging and facial expression rather than a thought bubble. Keep notebooks blank and let the app render all reading text." }),
  105: audit({ pages: [5, 6, 11, 13], issues: ["continuity", "anatomy", "ethics"], finding: "Betty's hair/headband changes and Socks is shown with grotesque human-like teeth.", continuity: "Lock Betty's established hair and headband. Use the rewritten domestic pet with species-appropriate teeth shown only when narratively necessary, never a human dentition caricature." }),
  106: audit({ pages: [12], issues: ["duplicate", "safety"], finding: "The car contains two Aidens and two Betties.", continuity: "Show exactly one Aiden and one Betty seated in the rear of the established car, each with a visible seat belt, plus the correct adults only once." }),
  107: audit({ pages: ALL, issues: ["tone", "anthropomorphic", "continuity"], finding: "The Dino Pals visual language is highly babyfied, with face-bearing celestial objects and heart-emitting volcanoes.", continuity: "Lock Chompy and every recurring dinosaur from a series model sheet: species silhouette, colour, markings, proportions, eye style, and scale. Use a rich natural prehistoric valley with no faces or hearts on weather, plants, rocks, or volcanoes." }),
  108: audit({ pages: [4, 8], issues: ["text", "anthropomorphic"], finding: "SPLASH lettering dominates one scene and the volcano emits hearts.", continuity: "Keep Sunny's locked model and rainy-valley setting. Show the splash visually with water motion only; use a natural distant volcano with ordinary vapour." }),
  109: audit({ pages: [1, 8], issues: ["anthropomorphic"], finding: "Heart-emitting and face-bearing volcanoes appear.", continuity: "Keep Dozy's locked model and cave location; use a natural dormant volcano with no face, heart smoke, symbols, or emotion cues." }),
  110: audit({ pages: [8], issues: ["anthropomorphic"], finding: "A cloud has a face.", continuity: "Keep Grumpy and the completed action; replace the sky with natural clouds and no face-like marks." }),
  111: audit({ pages: [1, 3, 4, 5], issues: ["anthropomorphic", "text", "tone"], finding: "A heart volcano and giant decorative typography interrupt the story.", continuity: "Lock Bossy's model and valley. Show planning and action through pose, props, and composition; no words, symbols, or anthropomorphic landscape." }),
  112: audit({ pages: [5, 8], issues: ["continuity", "promptLeak", "text"], finding: "Bouncy changes species and the final page exposes prompt/character labels.", continuity: "Use the exact established Bouncy species, body plan, colours, and markings. No labels, production text, page numbers, or heart volcanoes." }),
  113: audit({ pages: [6, 8], issues: ["anatomy", "anthropomorphic", "text"], finding: "Wiggly's tail grows its own smiling face and text is embedded on the ground.", continuity: "Use one anatomically coherent Wiggly with a single normal tail; communicate mess/action through props and pose, with blank ground and no words." }),
  114: audit({ pages: [2, 8], issues: ["anthropomorphic"], finding: "The Sun has a face and the volcano emits hearts.", continuity: "Keep Zippy's locked model and natural valley lighting; no faces, hearts, symbols, or emotion in landscape elements." }),
  115: audit({ pages: [6, 8], issues: ["promptLeak", "text"], finding: "Generation instructions and character labels are visible.", continuity: "Keep Honky's established model and scene action; no prompt text, captions, names, page numbers, sound words, or signage." }),
  116: audit({ pages: [7, 8], issues: ["anthropomorphic", "tone"], finding: "A heart volcano and over-stylised sparkle rock undermine the natural setting.", continuity: "Use a natural volcano and a plausible wet/mineral-highlighted rock; no hearts, faces, magical sparkle symbols, or embedded text." }),
  117: audit({ pages: [6, 12], issues: ["promptLeak", "anthropomorphic", "text"], finding: "Prompt/character labels are visible and a heart volcano returns.", continuity: "Lock Shy's model and gift prop; use a natural valley and no generated writing, labels, or anthropomorphic scenery." }),
  118: audit({ pages: [9, 12], issues: ["composition", "continuity"], finding: "The water-fetch action is unclear and Fancy's tail coils into an incoherent airplane-like shape.", continuity: "Use Fancy's exact anatomy and tail length. Show the water container, route, and action clearly; the tail remains a normal connected tail in every pose." }),
  119: audit({ pages: [3, 7, 9, 10], issues: ["promptLeak", "science", "continuity"], finding: "Prompt text is visible and ordinary water repeatedly becomes an unexplained rainbow waterfall.", continuity: "Lock Clumsy and companions. Use one natural clear-water waterfall with consistent rocks, pool, and direction; no rainbow-coloured water unless a subtle optical rainbow is physically plausible." }),
  120: audit({ pages: ALL, severity: "critical", issues: ["science", "anatomy", "tone", "continuity"], finding: "Archaeopteryx is rendered as a modern yellow chick and the sequence contains face-bearing scenery.", continuity: "Rebuild Flappy as an anatomically plausible feathered Archaeopteryx: small non-avian dinosaur body, long bony feathered tail, clawed fingers on wings, teeth, feathered wings, consistent mottled plumage and scale. Natural Late Jurassic habitat, no heart volcanoes or face-bearing Sun.", copyNote: "Review every statement against current introductory Archaeopteryx science and avoid calling it simply a modern bird." }),
  121: audit({ pages: [1], issues: ["promptLeak", "text"], finding: "Generation instructions are visible.", continuity: "Keep Sneezy and the established waterfall; remove all prompt text, labels, page numbers, and decorative lettering." }),
  122: audit({ pages: [8, 9], issues: ["duplicate", "composition", "continuity"], finding: "Unrelated background dinosaurs and a tiny duplicate Chompy appear; the tail-rescue action is unclear.", continuity: "Show exactly one Chompy and one Grumpy, with no unrelated background cast. Stage the rescue in one readable action with connected anatomy and clear footing." }),
  123: audit({ pages: [11, 12], issues: ["promptLeak", "text", "anthropomorphic"], finding: "Prompt/character labels are visible and a heart volcano appears.", continuity: "Lock the games cast and arena layout; no production text, character labels, or anthropomorphic landscape. Any score or finish marker must be added later as verified UI." }),
  124: audit({ pages: [9], issues: ["anthropomorphic"], finding: "A heart-emitting volcano appears in the dream.", continuity: "Fantasy lighting is allowed, but the volcano remains a natural landform with ordinary mist/smoke and no face or heart symbols." }),
  125: audit({ pages: [3, 4, 6, 12], issues: ["anthropomorphic"], finding: "Face-bearing Sun and heart volcano imagery recur.", continuity: "Keep Zippy and race course consistent; natural sky and volcano only, with no faces, hearts, icons, or emotional landscape features." }),
  126: audit({ pages: [9, 11, 12], issues: ["promptLeak", "text", "anthropomorphic"], finding: "Prompt/character labels are visible and clouds are shaped as hearts.", continuity: "Lock the full storm cast, shelter, and valley; use meteorologically plausible clouds and no writing, labels, symbols, or face-like weather." }),
  127: audit({ pages: ALL, issues: ["continuity", "anatomy"], finding: "Muddy's spots, face, body proportions, and scale drift through one simple sequence.", continuity: "Lock one pig Muddy: exact pink tone, spot map, snout, ears, eye spacing, leg proportions, and size. Lock the same farmyard, tub, mud patch, and time of day." }),
  128: audit({ pages: ALL, issues: ["continuity", "anatomy", "composition"], finding: "Woolly changes scale and anatomy, including an impossible ball-shaped sheep; companion identity also drifts.", continuity: "Lock Woolly as one recognisable sheep with stable fleece volume, face, ears, legs, and scale. Lock the same barn stall and supporting animal; never detach or inflate the fleece beyond plausible cartoon anatomy." }),
  129: audit({ pages: ALL, issues: ["continuity", "anatomy", "anthropomorphic"], finding: "Clucky changes colour and anatomy across the egg-laying sequence and a Sun face appears.", continuity: "Lock one adult hen Clucky: feather colours, comb, beak, body size, and nest. Show one coherent egg-laying sequence in the same coop with natural light." }),
  130: audit({ pages: ALL, issues: ["continuity", "anatomy", "tone"], finding: "Bouncy alternates between normal legs and literal metal springs.", continuity: "Lock Bouncy as a real sheep with energetic but normal legs. Express bouncing through pose, squash-and-stretch, dust, and motion arcs, never mechanical springs." }),
  131: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "textMatch"], finding: "Grumpy changes horns, clothes, and proportions; the cake has a face.", continuity: "Lock one goat Grumpy with stable horns, coat, face, and no clothing unless introduced in text. Use a normal edible cake with no face or personality." }),
  132: audit({ pages: ALL, issues: ["continuity", "duplicate", "tone"], finding: "Sleepy's sequence introduces spring-legged sheep and unrelated miniature animals.", continuity: "Lock one Sleepy, one bed/stall, and only story-required companions at consistent scale. No spring legs, miniature duplicates, or unexplained background animals." }),
  133: audit({ pages: ALL, issues: ["continuity", "anatomy", "text"], finding: "Noisy shifts between rooster/hen and red/orange models; labels and an unexplained scarf appear.", continuity: "Lock one adult rooster Noisy: red comb, defined tail feathers, fixed plumage pattern, size, and no clothing. No embedded names, page labels, or unmentioned props." }),
  134: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "text", "composition"], finding: "Tiny's overalls appear once, weather has faces, and later pages contain text and a meta-book frame.", continuity: "Lock one small field mouse Tiny with no clothes unless present from page 1. Keep the same farm scale, remove all text, faces, labels, and book-within-book framing." }),
  135: audit({ pages: [3, 7], issues: ["tone", "text"], finding: "A spring-legged sheep appears and an embedded page number is visible.", continuity: "Keep Shy and companions anatomically consistent; use normal legs and no page numbers, captions, or labels." }),
  136: audit({ pages: ALL, issues: ["promptLeak", "text", "continuity", "tone"], finding: "Prompt text, page numbers, and giant speech-like lettering recur; Giggly changes appearance.", continuity: "Lock one goose Giggly with stable white plumage, orange beak/feet, size, and farm location. Show hiccups through pose and tiny motion cues only; no words, labels, or giant typography." }),
  137: audit({ pages: ALL, issues: ["continuity", "anthropomorphic", "composition"], finding: "A rectangular bale becomes a round stack, Brave drifts, and a Sun face appears.", continuity: "Lock one chick Brave and one rectangular hay bale stack from a fixed barnyard viewpoint. Preserve bale geometry and height through the climb; natural sky only." }),
  138: audit({ pages: ALL, severity: "critical", issues: ["safety", "ethics", "promptLeak", "tone"], finding: "Hungry is encouraged to eat a hat, map, and cake; prompt text and obesity caricature are present.", continuity: "Rewrite Hungry as a stable cow learning appropriate food choices. Show hay, grass, and safe treats offered by a caregiver; do not show eating clothing, paper, maps, packaging, or whole celebration cakes. Avoid body-shaming caricature.", copyNote: "Rewrite the story around hunger cues, appropriate animal food, and asking a caregiver, not indiscriminate eating." }),
  139: audit({ pages: ALL, issues: ["continuity", "composition", "text"], finding: "Splashy changes size, a numbered diagram appears, and a small puddle becomes a lake.", continuity: "Lock one duckling Splashy and one shallow farm puddle of fixed size and location. Show play through one continuous scene; no diagrams, numbers, or inset panels." }),
  140: audit({ pages: ALL, issues: ["continuity", "promptLeak", "anatomy"], finding: "Speedy changes from puppy to adult breed and prompt text appears.", continuity: "Lock one young dog Speedy: breed mix, coat markings, collar, puppy proportions, and scale. Age and anatomy do not change; no production text or labels." }),
  141: audit({ pages: ALL, severity: "moderate", issues: ["continuity"], finding: "Cuddly's markings, proportions, and companion scale drift across an otherwise coherent story.", continuity: "Lock one cat Cuddly with exact coat pattern, eye colour, face shape, tail, and size; preserve all companion models and the same farmyard geography." }),
  142: audit({ pages: ALL, issues: ["continuity", "promptLeak"], finding: "Prompt text appears and Muddy/Splashy/Grumpy drift late in the sequence.", continuity: "Use locked series models for Muddy, Splashy, and Grumpy, one mud patch and wash area, exact spot/plumage/horn patterns, and no production text." }),
  143: audit({ pages: ALL, issues: ["continuity", "promptLeak", "text", "tone"], finding: "Spring-legged sheep, page numbers, and a final palette/prompt legend appear.", continuity: "Use locked Bouncy and Speedy models with normal anatomy and one fixed race route. No labels, page numbers, palettes, legends, or prompt text; add START/FINISH later in UI only if needed." }),
  144: audit({ pages: ALL, issues: ["continuity", "composition"], finding: "A random sleeping human appears among the animals and cast scale/identity needs locking.", continuity: "Show only established Meadow Pals and any specifically introduced caregiver. Lock Noisy and each sleeper to their existing species, markings, stall, and scale." }),
  145: audit({ pages: ALL, issues: ["duplicate", "continuity", "composition"], finding: "Random animals appear and Tiny/Brave are duplicated, so the two-character adventure is not readable.", continuity: "Show exactly one Tiny and one Brave, using their locked models and one coherent route. No duck or extra cast unless named in text; no duplicate bodies or inset scenes." }),
  146: audit({ pages: ALL, issues: ["continuity", "anatomy"], finding: "Shy changes from lop-eared to upright-eared rabbit and Cuddly changes scale.", continuity: "Lock Shy as one rabbit with fixed ear type, fur colour, facial markings, and size; lock Cuddly's coat and size. Preserve one hideaway and farm location." }),
  147: audit({ pages: [6, 8], issues: ["anatomy", "continuity"], finding: "A huge detached wool mass appears while Woolly still has a full coat; later staging snags character silhouettes.", continuity: "Keep Woolly's fleece connected and plausible. Show a small snagged tuft only, with Grumpy clearly separate and both bodies unobstructed." }),
  149: audit({ pages: ALL, issues: ["promptLeak", "duplicate", "continuity", "composition"], finding: "Prompt text, a possible duplicate hen, a hulking hen model, and a changing oven break the baking sequence.", continuity: "Lock Giggly, Clucky, one safe kitchen, one oven, utensils, and cake. Show exactly one of each character at stable scale; an adult supervises oven use; no production text." }),
  150: audit({ pages: ALL, issues: ["text", "continuity", "textMatch"], finding: "Prompt text is visible, Grumpy drifts, and the ending contradicts the promise to keep a secret.", continuity: "Lock Grumpy and confidant models, one quiet farm location, and no written prompt text. Illustrations must follow the revised ending.", copyNote: "Revise the ending so the confidence is respected, or explicitly model asking permission before sharing." }),
  151: audit({ pages: ALL, severity: "critical", issues: ["promptLeak", "text", "continuity", "duplicate"], finding: "Many pages expose prompt text, numbers, labels, and random dressed or duplicated animals.", continuity: "Use the complete locked Meadow Pals cast sheet. Exactly one of each story-required animal, stable species/markings/scale, one decorated farmyard, and no labels, numbers, page markers, prompt text, or unintroduced clothing." }),
  152: audit({ pages: [5, 6, 7, 9, 11, 12], severity: "critical", issues: ["safety", "composition", "continuity"], finding: "Pip free-climbs without protection, characters sit in moving water, and the Bravery Stone changes size.", continuity: "Lock Pip and the palm-sized Bravery Stone. Replace the climb with a low, supervised woodland challenge or secured stepping route; keep characters on the bank or stable stepping stones, never seated in current." }),
  153: audit({ pages: [11], severity: "moderate", issues: ["text"], finding: "Tiny generated LUNA lettering appears in the art.", continuity: "Keep Fern, Luna, and the established greenhouse/garden; remove all embedded names and writing." }),
  154: audit({ pages: ALL, severity: "critical", issues: ["safety", "continuity", "composition"], finding: "Stone crosses and re-crosses a visibly damaged bridge while carrying Burrow.", continuity: "Lock Stone, Burrow, the stream, and bridge. Revise the action so they stop, mark the route closed, fetch adult/community help, repair or choose a safe crossing, then cross only after inspection.", copyNote: "Rewrite the damaged-bridge sequence to model stopping, reporting, repair, and safe crossing." }),
  155: audit({ pages: [11], severity: "critical", issues: ["safety", "composition"], finding: "Glimmer produces a large uncontrolled forest flame.", continuity: "Show one small, controlled flame over a bare stone practice circle, with Flint supervising, water nearby, vegetation well clear, and Glimmer stopping on signal." }),
  156: audit({ pages: [5, 6, 10, 12], issues: ["text", "continuity", "composition"], finding: "Garbled spell text appears and the mirror image is not clearly a reflection.", continuity: "Lock Wren, room, spellbook, and mirror. Keep books/pages blank; show Wren and an unmistakably mirrored reflection with reversed pose in one coherent room." }),
  157: audit({ pages: ALL, severity: "critical", issues: ["safety", "textMatch"], finding: "The visuals are polished but support a child walking alone for three days without rest or a check-in plan.", continuity: "Lock Flint and map kit. Reframe as a daylight, supervised mapping expedition with a companion, route markers, water, rest breaks, check-in time, and a safe return before dark.", copyNote: "Rewrite the journey to include a companion/adult plan, daylight route, rest, water, and check-ins." }),
  158: audit({ pages: [10, 11], issues: ["duplicate", "continuity"], finding: "A second blue-striped fish appears and Dewdrop then loses the defining stripe.", continuity: "Show exactly one blue-striped fish and one Dewdrop. Preserve Dewdrop's established body shape, water form, facial features, and markings across both pages." }),
  159: audit({ pages: [6, 8, 12], issues: ["promptLeak", "text"], finding: "Prompt text and character labels are visible.", continuity: "Lock Burrow, door, tunnel, and companions; no production text, labels, page numbers, signs, or generated writing." }),
  161: audit({ pages: ALL, severity: "critical", issues: ["continuity", "anatomy", "textMatch"], finding: "Luna changes owl species and colour on nearly every page; quantities are not reliably countable.", continuity: "Lock Luna as one owl species with exact plumage, facial disc, eye colour, beak, wing markings, and scale. Show exactly the quantities named in text, fully visible and countable, with no extras." }),
  162: audit({ pages: ALL, severity: "critical", issues: ["continuity", "anatomy", "safety"], finding: "Stone becomes a human, Pip changes model, and marsh creatures drift or fuse.", continuity: "Lock Pip, Stone, Burrow, and the toadling from series sheets. Keep every species separate and anatomically coherent; use a safe marked marsh path and stable footing." }),
  163: audit({ pages: ALL, severity: "critical", issues: ["continuity", "promptLeak", "safety"], finding: "Fern and Dewdrop are replaced by random human children on most pages and prompts are visible.", continuity: "Use only the established Fern and Dewdrop models plus named helpers. Keep one stream geography; move any blockage with a controlled lever/team method from stable banks, with no children in current and no production text." }),
  164: audit({ pages: ALL, severity: "critical", issues: ["continuity", "promptLeak", "safety"], finding: "Glimmer and Spark become random children/adults and dragons change between green/orange models.", continuity: "Lock Glimmer and Spark exactly from series sheets, one of each only. Use a bare stone fire-clearing, water/extinguishing kit, adult mentor, small controlled flame, and no prompt text." }),
  165: audit({ pages: ALL, severity: "critical", issues: ["safety", "continuity"], finding: "A visually coherent story still normalises travelling lost and alone without a safety plan.", continuity: "Lock Wren and Flint. Add daylight, route markers, a check-in plan, map/compass, water, whistle, and a companion or adult search protocol. Mushrooms remain natural and non-sentient.", copyNote: "Rewrite the lost sequence around stop-stay-put, signalling, route markers, and an agreed check-in plan." }),
  166: audit({ pages: ALL, severity: "critical", issues: ["continuity", "safety"], finding: "Burrow becomes a human, Luna changes species, and tunnel exploration lacks a safety structure.", continuity: "Lock Burrow and Luna to their series models. Use a mapped, stable, ventilated tunnel with lanterns, a surface check-in, companion system, and no unsupported excavation." }),
  167: audit({ pages: ALL, issues: ["continuity", "promptLeak", "duplicate"], finding: "Pip, Glimmer, Burrow, and Stone drift; Stone is omitted early; Burrow is duplicated and prompt text appears.", continuity: "Use the locked four-character cast, exactly one of each when present, one campsite/watch post, fixed lantern design, and no labels or production text." }),
  168: audit({ pages: ALL, issues: ["continuity", "text", "safety"], finding: "Wren is replaced on several pages and generated labels/books break the potion sequence.", continuity: "Lock Fern and Wren, one supervised herb room, and one set of vessels. Use identifiable safe herbs by visual shape only; all bottles/books remain blank and no tasting occurs." }),
  169: audit({ pages: ALL, severity: "critical", issues: ["composition", "promptLeak", "continuity", "safety"], finding: "Inset/contact-sheet fragments, prompt text, and drifting models obscure the fish rescue.", continuity: "Lock Stone, Dewdrop, and one stuck fish. Use one continuous riverbank scene, stable footing, a safe lever or water-channel solution, no hands under rocks, no inset panels, and no text." }),
  170: audit({ pages: ALL, severity: "critical", issues: ["promptLeak", "text", "continuity"], finding: "Prompt text, labels, and random human children replace the established Moonwood cast.", continuity: "Use only the established Moonwood characters named by the page, lock the seed pouch and garden, make all seeds countable, and remove every label, caption, prompt, and page number." }),
  171: audit({ pages: ALL, severity: "critical", issues: ["tone", "anthropomorphic", "continuity", "safety"], finding: "Babyfied face-star spirits and a night cliff route conflict with the series tone and safety standard.", continuity: "Use the locked Moonwood cast. Redesign star spirits as small astral moth-like lights with soft gold eyes, not five-point cartoon faces. Observe from a supervised fenced overlook or broad safe clearing, not a cliff edge." }),
  172: audit({ pages: ALL, severity: "critical", issues: ["continuity", "promptLeak", "safety"], finding: "Random humans/animals replace the cast, prompt text appears, and the hollow-oak resident lacks a stable design.", continuity: "Lock the named Moonwood cast and Twig as one hazel-dormouse/wood-sprite figure with twig crown and small spectacles. Keep one oak interior/exterior and ask Twig before modifying the doorway." }),
  173: audit({ pages: ALL, severity: "critical", issues: ["continuity", "promptLeak", "text", "safety"], finding: "Random cast substitutions, labels, and prompt text make the race incoherent.", continuity: "Use only locked Moonwood racers, one mapped course, safe bridge/stepping-stone stream crossing, clear marsh boundaries, and no embedded text. START/FINISH may be rendered later as verified UI." }),
  174: audit({ pages: ALL, severity: "critical", issues: ["continuity", "safety", "tone"], finding: "Random children replace Pip, Luna, Fern, Dewdrop, and the mist spirit.", continuity: "Lock the four heroes and a consistent translucent mist spirit. Use a safe marsh cleanup with gloves/tongs, baskets, stable paths, Luna supervising from above, and no bare-hand contact with litter." }),
  175: audit({ pages: ALL, severity: "critical", issues: ["continuity", "promptLeak", "safety", "textMatch"], finding: "The cast is random, Glimmer changes colour, Luna becomes an elderly woman, prompts are visible, and wildfire is framed as celebration.", continuity: "Lock Glimmer, Luna, and the Moonwood cast. Replace wildfire with a supervised stone-circle demonstration that activates magical lanterns: tiny controlled flame, water and extinguisher present, vegetation cleared, stop signal obeyed, no prompt text.", copyNote: "Rewrite the climax so success is controlled fire practice and lantern activation, never a spreading forest fire." }),
  176: audit({ pages: [4, 6, 11], issues: ["duplicate", "composition", "continuity"], finding: "Pages 4 and 6 are identical, so the decision beat is missing; later creatures appear visually fused.", continuity: "Keep the established Deep Dark cast and cave. Page 6 must show the group agreeing and preparing lanterns/route markers, distinct from page 4; page 11 must show each family creature as a separate readable body." }),
};

const installedAudits = fs.existsSync(installedAuditPath)
  ? JSON.parse(fs.readFileSync(installedAuditPath, "utf8"))
  : {};
const postInstallAudit = fs.existsSync(postInstallAuditPath)
  ? JSON.parse(fs.readFileSync(postInstallAuditPath, "utf8"))
  : { findings: [] };

function walkImages(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkImages(filePath);
    return IMAGE_PATTERN.test(entry.name) ? [filePath] : [];
  });
}

function toPublicPath(filePath) {
  return `/${path.relative(publicRoot, filePath)}`;
}

function selectedPages(book, spec) {
  if (!spec) return [];
  if (spec.pages === ALL) return book.pages.map((_, index) => index + 1);
  return spec.pages;
}

const severityRank = { moderate: 0, high: 1, critical: 2 };
const reopenedPagesByBook = new Map();
const postInstallFindingsByBook = new Map();

for (const finding of postInstallAudit.findings || []) {
  const book = guidedReadingBooks[finding.bookNumber - 1];
  if (!book || book.id !== finding.bookId) {
    throw new Error(`Post-install audit book mismatch at position ${finding.bookNumber}: ${finding.bookId}`);
  }
  const resolvedPages = new Set(postInstallAudit.resolved?.[String(finding.bookNumber)] || []);
  const unresolvedPages = finding.pages.filter(pageNumber => !resolvedPages.has(pageNumber));
  if (!unresolvedPages.length) continue;
  const grouped = postInstallFindingsByBook.get(finding.bookNumber) || [];
  grouped.push({ ...finding, pages: unresolvedPages });
  postInstallFindingsByBook.set(finding.bookNumber, grouped);
}

for (const [bookNumber, findings] of postInstallFindingsByBook) {
  const book = guidedReadingBooks[bookNumber - 1];
  const prior = audits[bookNumber];
  const reopenedPages = new Set(findings.flatMap(finding => finding.pages));
  reopenedPagesByBook.set(bookNumber, reopenedPages);

  const replacementPages = new Set([...selectedPages(book, prior), ...reopenedPages]);
  const pageNotes = { ...(prior?.pageNotes || {}) };
  for (const finding of findings) {
    for (const pageNumber of finding.pages) pageNotes[pageNumber] = finding.finding;
  }

  const postSeverity = findings.reduce((result, finding) => {
    const severity = finding.severity || "high";
    return severityRank[severity] > severityRank[result] ? severity : result;
  }, "moderate");
  const severity = prior && severityRank[prior.severity] > severityRank[postSeverity]
    ? prior.severity
    : postSeverity;
  const issues = [...new Set([...(prior?.issues || []), ...findings.flatMap(finding => finding.issues || [])])];
  const freshFinding = findings.map(finding => finding.finding).join(" ");

  audits[bookNumber] = audit({
    pages: replacementPages.size === book.pages.length ? ALL : [...replacementPages].sort((a, b) => a - b),
    severity,
    issues,
    finding: `${prior ? `${prior.finding} ` : ""}Post-install audit: ${freshFinding}`,
    continuity: `${prior?.continuity || "Match the established book and series exactly."} Fresh repair requirements: ${freshFinding}`,
    pageNotes,
    copyNote: prior?.copyNote || "",
  });
}

function pageRequirement(book, page, pageNumber, spec) {
  const specific = spec.pageNotes[pageNumber];
  if (specific) return specific;
  return `Depict this exact reading moment literally: “${page.text}” Use one clear scene, one primary action, and only the characters, animals, objects, and quantities required by that sentence and the locked sequence continuity.`;
}

function visualDirection(book) {
  if (book.type === "nonfiction") {
    return "Visual direction: premium naturalistic nonfiction imagery with observational accuracy, realistic anatomy, materials, scale, light and habitat; use polished photographic or natural-history editorial rendering appropriate to the subject; no mascot styling, face-bearing objects or decorative fantasy unless the factual text explicitly requires it; suitable for ages 5–8.";
  }

  return "Visual direction: premium children's storybook cartoon illustration matching the established series exactly; preserve the recurring cast's stylised proportions, facial construction, line weight, cel-shading or painted-cartoon treatment, palette, clothing and personality traits from adjacent books; expressive, warm and polished, but never photorealistic and never babyfied; suitable for ages 5–8.";
}

function replacementPrompt(book, page, pageNumber, spec, dimensions) {
  const aspectRatio = (dimensions.width / dimensions.height).toFixed(3);
  return [
    `Create one ${dimensions.width} x ${dimensions.height} landscape guided-reading illustration (aspect ratio ${aspectRatio}:1) for Level ${book.level}, page ${pageNumber} of “${book.title}”.`,
    `Reader text for alignment only (do not render it): “${page.text}”`,
    `Required scene: ${pageRequirement(book, page, pageNumber, spec)}`,
    `Continuity lock: ${spec.continuity}`,
    visualDirection(book),
    "Composition: keep all essential faces, limbs, props, and countable objects fully visible within an 8% edge-safe margin for responsive framing; use the full canvas confidently, one coherent camera, and no collage panels unless the page explicitly requires a sequence.",
    "Do not include any words, letters, numerals, captions, page numbers, signs, logos, watermarks, speech bubbles, prompt fragments, palette swatches, borders, inset duplicates, or UI. Do not put faces on the Sun, Moon, clouds, stars, plants, food, tools, vehicles, buildings, or other natural/inanimate objects. No duplicate or fused subjects, extra limbs, malformed hands, unsafe behaviour, or unrequested characters.",
  ].join("\n");
}

function archiveReason(imagePath) {
  if (imagePath.includes("/regen/covers/")) {
    return "Inactive alternate cover; many in this set use babyfied face-bearing objects or a style that no longer matches the live page sequence.";
  }
  if (imagePath.includes("/nonfiction/")) {
    return "Inactive legacy nonfiction art; this bank contains baked-in generated headings/labels, infographic copy, anthropomorphic objects, and styles incompatible with the live book.";
  }
  if (imagePath.includes("/series/")) {
    return "Inactive alternate series frame; character models, proportions, palette, or rendering style conflict with the live sequence and must not be substituted page-by-page.";
  }
  return "Inactive guided-reading asset with no live reference; quarantine to prevent accidental reuse until separately approved.";
}

const activeReferences = [];
const replacements = [];
const bookFindings = [];

const uniqueActiveImagePaths = [...new Set(guidedReadingBooks.flatMap(book => book.pages.map(page => page.image)))];
const activeImageDimensions = new Map(await Promise.all(uniqueActiveImagePaths.map(async imagePath => {
  const metadata = await sharp(path.join(publicRoot, imagePath.replace(/^\//, ""))).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions for ${imagePath}`);
  return [imagePath, { width: metadata.width, height: metadata.height }];
})));

guidedReadingBooks.forEach((book, bookOffset) => {
  const bookNumber = bookOffset + 1;
  const spec = audits[bookNumber];
  const replacePages = new Set(selectedPages(book, spec));
  const installedSpec = installedAudits[bookNumber] ? { pages: installedAudits[bookNumber] } : null;
  const installedPages = new Set(selectedPages(book, installedSpec));
  const reopenedPages = reopenedPagesByBook.get(bookNumber) || new Set();
  const invalidPages = [...replacePages].filter(pageNumber => pageNumber < 1 || pageNumber > book.pages.length);
  if (invalidPages.length) throw new Error(`Invalid page numbers for book ${bookNumber}: ${invalidPages.join(", ")}`);

  book.pages.forEach((page, pageOffset) => {
    const pageNumber = pageOffset + 1;
    const needsReplacement = replacePages.has(pageNumber);
    const isInstalled = installedPages.has(pageNumber) && !reopenedPages.has(pageNumber);
    const dimensions = activeImageDimensions.get(page.image);
    const coverageEntry = {
      assetType: "active-page",
      reviewStatus: isInstalled ? "installed-replacement" : needsReplacement ? "replace" : "pass",
      bookNumber,
      bookId: book.id,
      title: book.title,
      level: book.level,
      type: book.type,
      pageNumber,
      pageText: page.text,
      imagePath: page.image,
      width: dimensions.width,
      height: dimensions.height,
      finding: needsReplacement ? spec.finding : "No blocking visual continuity, AI-slop, text-image alignment, anatomy, embedded-text, age-suitability, or safety defect found in sequence review.",
    };
    activeReferences.push(coverageEntry);
    if (!needsReplacement) return;

    replacements.push({
      priority: spec.severity,
      status: isInstalled ? "approved-and-installed" : "approved-brief-awaiting-generation",
      bookNumber,
      bookId: book.id,
      title: book.title,
      level: book.level,
      type: book.type,
      pageNumber,
      pageText: page.text,
      currentImagePath: page.image,
      replacementImagePath: page.image,
      outputWidth: dimensions.width,
      outputHeight: dimensions.height,
      issueTypes: spec.issues.map(issue => issueLabels[issue]),
      observedProblem: spec.finding,
      continuityRequirements: spec.continuity,
      requiredScene: pageRequirement(book, page, pageNumber, spec),
      exactReplacementPrompt: replacementPrompt(book, page, pageNumber, spec, dimensions),
      copyOrCurriculumNote: spec.copyNote,
      acceptanceChecks: [
        "Matches the page text literally and does not add an unrequested story beat.",
        "Matches the locked cast, props, setting, scale, and chronology on adjacent pages.",
        "Contains no unintended text, prompt fragments, labels, watermarks, or duplicated/fused subjects.",
        "Passes anatomy, science, safeguarding, age-suitability, and recorded-aspect-ratio review at full size.",
      ],
    });
  });

  bookFindings.push({
    bookNumber,
    id: book.id,
    title: book.title,
    status: spec ? (spec.pages === ALL ? "full sequence rebuild" : "partial replacement") : "pass",
    priority: spec?.severity || "none",
    replacementPages: [...replacePages],
    finding: spec?.finding || "Pass: no blocking visual defect found.",
    continuity: spec?.continuity || "Retain current active artwork.",
    copyNote: spec?.copyNote || "",
  });
});

const activePaths = new Set(activeReferences.map(entry => path.join(publicRoot, entry.imagePath.replace(/^\//, ""))));
const physicalFiles = walkImages(path.join(publicRoot, "guided-reading")).sort();
const inactiveEntries = physicalFiles
  .filter(filePath => !activePaths.has(filePath))
  .map(filePath => {
    const imagePath = toPublicPath(filePath);
    return {
      assetType: "inactive-physical-file",
      reviewStatus: "archive-never-reuse-directly",
      imagePath,
      finding: archiveReason(imagePath),
      action: "Keep quarantined from the live book registry. Delete after backup, or recover only through a new sequence-level continuity review.",
    };
  });

const severityOrder = { critical: 0, high: 1, moderate: 2 };
replacements.sort((a, b) => severityOrder[a.priority] - severityOrder[b.priority] || a.bookNumber - b.bookNumber || a.pageNumber - b.pageNumber);

const coverage = {
  schemaVersion: 1,
  auditDate: "2026-07-20",
  method: "Full-size contact-sheet review of every active page in adjacent-page sequence, followed by full contact-sheet review of every inactive physical file and a second clean-slate visual audit after installation.",
  reviewStandard: "Text-image match, recurring-character and prop continuity, chronology, countability, anatomy, scientific accuracy, safeguarding, embedded text, prompt leakage, anthropomorphic-object styling, age suitability, and overall visual coherence.",
  totals: {
    books: guidedReadingBooks.length,
    activePageImages: activeReferences.length,
    activePasses: activeReferences.filter(entry => entry.reviewStatus === "pass").length,
    activeReplacements: replacements.length,
    installedReplacements: replacements.filter(entry => entry.status === "approved-and-installed").length,
    pendingReplacements: replacements.filter(entry => entry.status !== "approved-and-installed").length,
    physicalImages: physicalFiles.length,
    inactivePhysicalImages: inactiveEntries.length,
    reviewedPhysicalImages: physicalFiles.length,
  },
  books: bookFindings,
  activeImages: activeReferences,
  inactiveImages: inactiveEntries,
};

const replacementManifest = {
  schemaVersion: 1,
  auditDate: "2026-07-20",
  purpose: "Page-level source of truth for regenerating every guided-reading image rejected by the visual continuity audit.",
  generationRule: "Generate and approve a locked cast/location reference sheet before any full-sequence rebuild. Generate pages in story order. Never mix old and new models inside a rebuilt sequence.",
  outputRule: "Preserve each entry's outputWidth and outputHeight, then write the approved image to replacementImagePath only after side-by-side sequence review; retain the original in version control until approval.",
  totalReplacements: replacements.length,
  installedReplacements: replacements.filter(entry => entry.status === "approved-and-installed").length,
  pendingReplacements: replacements.filter(entry => entry.status !== "approved-and-installed").length,
  priorities: {
    critical: replacements.filter(entry => entry.priority === "critical").length,
    high: replacements.filter(entry => entry.priority === "high").length,
    moderate: replacements.filter(entry => entry.priority === "moderate").length,
  },
  replacements,
};

function markdownEscape(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

const cleanBooks = bookFindings.filter(book => book.status === "pass");
const flaggedBooks = bookFindings.filter(book => book.status !== "pass");
const criticalBooks = flaggedBooks.filter(book => book.priority === "critical");
const fullRebuildBooks = flaggedBooks.filter(book => book.status === "full sequence rebuild");
const partialBooks = flaggedBooks.filter(book => book.status === "partial replacement");

const report = `# Guided Reading Visual Continuity Audit

Status: complete visual audit; replacement briefs approved for generation

Audit date: 20 July 2026

## Scope And Proof Of Coverage

- ${guidedReadingBooks.length} active guided-reading books reviewed in reading order.
- ${activeReferences.length.toLocaleString()} active page images inspected at full contact-sheet size and against adjacent pages.
- ${physicalFiles.length.toLocaleString()} physical guided-reading image files checked in total.
- ${inactiveEntries.length} inactive/legacy physical files separately inspected and quarantined.
- ${replacements.length} active images require replacement: ${replacementManifest.priorities.critical} critical, ${replacementManifest.priorities.high} high, ${replacementManifest.priorities.moderate} moderate.
- ${replacementManifest.installedReplacements} replacements are approved and installed; ${replacementManifest.pendingReplacements} remain in the production queue.
- ${activeReferences.length - replacements.length} active images passed this visual audit.
- Every individual result is recorded in guided_reading_visual_audit_coverage.json; every rejected active page has an exact prompt in guided_reading_visual_replacement_manifest.json.

The covers intentionally reuse page 1 and are not a second physical image. They inherit page 1's pass/replacement result.

## Runtime Reader Check

The live student reader was opened through the real picture-password flow and checked at its normal desktop viewport. It presents the full 4:3 artwork beside the tappable text with clean letterboxing and no control overlay, so the defects recorded here are present in the source art rather than caused by UI cropping. The reader makes face-bearing objects, malformed text, and continuity shifts highly visible at large scale. Replacement prompts therefore use an 8% responsive edge-safe margin but do not waste image space for nonexistent overlaid controls.

## Pass Standard

An image passes only when it accurately supports its page text, is coherent at full size, preserves recurring characters, props, quantities, geography, and chronology, contains no unintended writing or generation residue, and is appropriate for a child to imitate or learn from. A polished render fails when it teaches the wrong concept, introduces unsafe behaviour, or breaks sequence identity.

Natural and inanimate objects must not be given decorative faces. Expression belongs on living story characters. All generated reader text, page numbers, signs, sound words, labels, prompt fragments, logos, palettes, and watermarks are disallowed inside the image; verified text must be rendered by the app.

## Executive Finding

The library is not uniformly poor. ${cleanBooks.length} books passed without a blocking visual defect. The main problem is concentrated in four production eras:

1. Early nonfiction repeatedly uses smiling suns, moons, clouds, plants, food, shapes, and other babyfied objects, plus scientifically misleading diagrams.
2. First-person nonfiction frequently changes the narrator, location, seed, plant, or animal between pages, so a supposed sequence reads as unrelated stock pictures.
3. Dino Pals and Meadow Pals use unstable character models, literal visual gags, embedded prompt text, page labels, duplicate bodies, and inconsistent anatomy.
4. Later Moonwood books contain severe cast substitution: named creatures become random human children or different species. Several stories also require safeguarding or curriculum rewrites before new art is generated.

The ${inactiveEntries.length}-file inactive bank is not an approved backup library. It includes the exact old face-bearing artwork, generated infographic copy, and incompatible alternate character models that can leak back into production. Its required disposition is archive-never-reuse-directly.

## Replacement Order

### Phase 1: Stop Educational And Safeguarding Harm

Complete the ${criticalBooks.length} critical books first. This includes volcano safety, copper-sulphate replacement, wild-primate pet stories, unsafe fire/bridge/cliff/marsh journeys, inaccurate Archaeopteryx content, and the Moonwood cast-collapse books. Approve copy changes before generating their images; otherwise the art will faithfully reproduce a bad lesson.

### Phase 2: Lock Series Bibles

Create one approved, orthographic reference sheet for every recurring cast and location before replacing sequence art: Bob/Nan/Fluff, James/Anna/Chips/family, Aiden/Betty/family and the rewritten Socks, all Dino Pals, all Meadow Pals, and every Moonwood character. Each sheet must define front/three-quarter/side view, palette swatches stored as metadata rather than drawn into pages, relative height, key markings, allowed clothing, and recurring props.

### Phase 3: Rebuild Whole Sequences

Generate the ${fullRebuildBooks.length} full-sequence books in page order, using the same references throughout. Do not approve individual attractive pages in isolation. Review each sequence as a strip for cast, direction of travel, object count, time of day, geography, and action chronology.

### Phase 4: Repair Localised Pages

Generate the ${partialBooks.length} partial-replacement books after their adjacent pages have been supplied as references. A local replacement passes only if it looks native beside the retained images. If that cannot be achieved after two attempts, promote the book to a full-sequence rebuild.

### Phase 5: Retire Legacy Assets

Move all inactive files out of the public runtime tree after a backup is confirmed, or enforce a build-time allowlist so only paths referenced by guidedReadingBooks.js can ship. Never recover an inactive image directly; recover its idea into a newly generated, sequence-approved image.

### Phase 6: Acceptance Gate

For every regenerated book: inspect 100% of pages at full resolution, compare the sequence strip, run the existing guided-reading validators, render the real reader at desktop and mobile sizes, and have a second adult review science, safeguarding, quantities, and character identity. Replace only after this gate passes.

## Book-By-Book Ledger

| # | Book | Result | Priority | Pages | Finding |
|---:|---|---|---|---|---|
${bookFindings.map(book => `| ${book.bookNumber} | ${markdownEscape(book.title)} | ${book.status} | ${book.priority} | ${book.replacementPages.length ? book.replacementPages.join(", ") : "—"} | ${markdownEscape(book.finding)} |`).join("\n")}

## Copy And Curriculum Changes Required Before Art

${bookFindings.filter(book => book.copyNote).map(book => `- **${book.bookNumber}. ${book.title}:** ${book.copyNote}`).join("\n") || "- None."}

## Generation Contract

Each manifest entry already includes the page text, exact required scene, continuity lock, full generation prompt, negative constraints, source dimensions, and acceptance checks. The generation process must preserve each page's recorded width, height, aspect ratio, and live path, but must write only after human approval.

Generate one candidate at a time for partial repairs and two candidates per page for full rebuilds. Keep a rejection log. Selection criteria are, in order: educational accuracy, cast continuity, action clarity, safety, anatomy, then surface beauty. Never select a prettier image that fails an earlier criterion.

## Current Validation Blockers

- The visual-audit integrity check passes: all ${physicalFiles.length.toLocaleString()} physical files are partitioned exactly once, all ${activeReferences.length.toLocaleString()} live paths exist, and all ${replacements.length} rejected pages have a complete prompt and live replacement path.
- npm run validate:guided-reading is already failing across legacy books because imageAlt, pageDescription, and targetWords metadata are missing; it also reports existing noun/image-metadata conflicts. This audit does not modify those content records.
- npm run validate:guided-reading-regen still expects /Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Regen Assets Pack, which no longer exists after the project migration. That path must be made configurable or pointed at the new pack location before regeneration-pack validation can run.
- Both new audit builders pass ESLint and Node syntax checks.

## Definition Of Done

The audit is resolved only when all ${replacements.length} manifest items have status approved-and-installed, all ${inactiveEntries.length} inactive files are outside the runtime allowlist, all book sequences pass full-size human review, no copy-change note remains open, and the guided-reading validators plus production build pass. Until then, the manifest is the source of truth for remaining work.
`;

fs.mkdirSync(docsRoot, { recursive: true });
fs.writeFileSync(replacementManifestPath, `${JSON.stringify(replacementManifest, null, 2)}\n`);
fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
fs.writeFileSync(reportPath, report);

console.log(JSON.stringify({
  reportPath,
  replacementManifestPath,
  coveragePath,
  totals: coverage.totals,
  replacementPriorities: replacementManifest.priorities,
  cleanBooks: cleanBooks.length,
  flaggedBooks: flaggedBooks.length,
  fullRebuildBooks: fullRebuildBooks.length,
  partialBooks: partialBooks.length,
}, null, 2));
