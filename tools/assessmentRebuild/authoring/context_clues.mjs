// Meaning from definitions, examples, actions, contrast and implied contextual evidence.
// Every level contains 32 mastery items (16 per phase) and 8 reserves.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const it = (u, lvl, ph, v, passage, word, choices, extra = {}) => ({
  u, lvl, ph, v, fmt: "COMPREHENSION", cell: u, passage,
  prompt: `In this passage, what does "${word}" mean?`,
  choices, media: "text", target: word,
  // Direct definition cells intentionally teach the clue form. Other cells
  // must remain solvable by meaning without one answer dominating by copying.
  ...(u === "definition_clue" ? { copyExempt: "direct-definition-clue" } : {}),
  ...extra
});

export default {
  skillId: "context_clues",
  skillName: "Context Clues",
  items: [
    // ============ LEVEL 1 · definition_clue (8) ============
    it("definition_clue", 1, 1, 1,
      "Tara felt drowsy during her favorite show. Drowsy means so sleepy you can hardly stay awake. Her eyes kept closing before the show ended.",
      "drowsy",
      [K("very sleepy"), P("very hungry", "D-PLAUSIBLE-UNSUPPORTED"), P("wide awake", "D-PLAUSIBLE-UNSUPPORTED"), P("quite angry", "D-OPPOSITE")]),
    it("definition_clue", 1, 1, 2,
      "The vase was fragile, or easy to break. Mom held it carefully with both hands. She put it where no one could knock it.",
      "fragile",
      [K("easily broken"), P("hard to lift", "D-PLAUSIBLE-UNSUPPORTED"), P("hard to break", "D-PLAUSIBLE-UNSUPPORTED"), P("easily cleaned", "D-OPPOSITE")]),
    it("definition_clue", 1, 1, 3,
      "Our tent is sturdy, which means strongly made. Strong wind blew against it on the hill. The tent stayed up all through the night.",
      "sturdy",
      [K("strong and well made"), P("light and easy to move", "D-PLAUSIBLE-UNSUPPORTED"), P("weak and poorly made", "D-PLAUSIBLE-UNSUPPORTED"), P("new and brightly painted", "D-OPPOSITE")]),
    it("definition_clue", 1, 1, 4,
      "A murmur is a quiet sound of voices. Lila heard a murmur from downstairs. The adults were talking softly while the baby slept.",
      "murmur",
      [K("a soft sound of talking"), P("a sharp sound of shouting", "D-PLAUSIBLE-UNSUPPORTED"), P("a steady sound of footsteps", "D-PLAUSIBLE-UNSUPPORTED"), P("a deep sound of rumbling", "D-OPPOSITE")]),
    it("definition_clue", 1, 2, 5,
      "Jagged stones have sharp points and rough edges. The path was covered in jagged stones. We wore shoes to keep our feet safe.",
      "jagged",
      [K("sharp and rough at the edges"), P("smooth and round at the edges", "D-PLAUSIBLE-UNSUPPORTED"), P("soft and light in the middle", "D-PLAUSIBLE-UNSUPPORTED"), P("flat and slippery on the top", "D-OPPOSITE")]),
    it("definition_clue", 1, 2, 6,
      "Hollow means empty inside. The log beside the fence was hollow. Mice made a nest in that empty space.",
      "hollow",
      [K("empty on the inside"), P("solid all the way through", "D-PLAUSIBLE-UNSUPPORTED"), P("rough around the outside", "D-PLAUSIBLE-UNSUPPORTED"), P("narrow from side to side", "D-OPPOSITE")]),
    it("definition_clue", 1, 2, 7,
      "The lane was chilly, which means a little cold. Pip pulled his sleeves down over his fingers. The morning air felt cold against his face.",
      "chilly",
      [K("a little cold"), P("a little warm", "D-PLAUSIBLE-UNSUPPORTED"), P("very windy", "D-PLAUSIBLE-UNSUPPORTED"), P("very wet", "D-OPPOSITE")]),
    it("definition_clue", 1, 2, 8,
      "To mend something is to fix it. Grandpa mended the torn net with green string. Then we could use the net to play again.",
      "mend",
      [K("to fix something"),
       P("to throw something away", "D-OPPOSITE"),
       P("to paint something", "D-PLAUSIBLE-UNSUPPORTED"),
       P("to hide something", "D-PLAUSIBLE-UNSUPPORTED")]),

    // ============ LEVEL 1 · example_clue (8) ============
    it("example_clue", 1, 1, 1,
      "Our picnic was a feast. We had sandwiches, rolls and two big cakes. Bowls of cherries stood beside jugs of lemonade. There was plenty for every guest.",
      "feast",
      [K("a large and special meal"), P("a small and quick snack", "D-PLAUSIBLE-UNSUPPORTED"), P("a long and difficult journey", "D-PLAUSIBLE-UNSUPPORTED"), P("a quiet and early breakfast", "D-OPPOSITE")]),
    it("example_clue", 1, 1, 2,
      "Milo's desk was full of clutter. Old wrappers hid broken crayons and dried pens. A glove covered three notes from last term. There was no space for his work.",
      "clutter",
      [K("a mess of unwanted objects"), P("a neat collection of useful tools", "D-PLAUSIBLE-UNSUPPORTED"), P("a group of well-kept drawings", "D-PLAUSIBLE-UNSUPPORTED"), P("a set of brand-new supplies", "D-OPPOSITE")]),
    it("example_clue", 1, 1, 3,
      "Enormous things filled the museum hall. A whale skeleton was longer than a bus. A boulder stood taller than Dad. Nia could sit inside the model footprint.",
      "enormous",
      [K("very large in size"), P("very old in age", "D-PLAUSIBLE-UNSUPPORTED"), P("very bright in colour", "D-PLAUSIBLE-UNSUPPORTED"), P("very heavy to lift", "D-OPPOSITE")]),
    it("example_clue", 1, 1, 4,
      "Many things were gleaming after the school cleanup. The polished trumpet shone beside the window. Sunlight flashed on clean glass and silver stars. Even the wet floor looked bright.",
      "gleaming",
      [K("shining with reflected light"), P("darkened with a thick coating", "D-PLAUSIBLE-UNSUPPORTED"), P("covered with bright paint", "D-PLAUSIBLE-UNSUPPORTED"), P("newly made and unused", "D-OPPOSITE")]),
    it("example_clue", 1, 2, 5,
      "Timid animals lived in the hedge. A mouse ran away at one footstep. A wren hid when people passed. The rabbit stayed near its safe hole.",
      "timid",
      [K("easily frightened"), P("quickly angered", "D-PLAUSIBLE-UNSUPPORTED"), P("usually hungry", "D-PLAUSIBLE-UNSUPPORTED"), P("often sleepy", "D-OPPOSITE")]),
    it("example_clue", 1, 2, 6,
      "Swift things passed our train window. A motorbike sped along the road. A hawk rushed past after a small bird. Another train was gone in a moment.",
      "swift",
      [K("very fast"),
       P("very slow", "D-OPPOSITE"),
       P("very loud", "D-PLAUSIBLE-UNSUPPORTED"),
       P("far away", "D-TOPIC-ADJACENT")]),
    it("example_clue", 1, 2, 7,
      "Ancient things stood on Great-Uncle Ho's shelf. One coin was a thousand years old. A map showed places that no longer existed. A cracked pot was older than our town.",
      "ancient",
      [K("from a very long time ago"), P("from a place far away", "D-PLAUSIBLE-UNSUPPORTED"), P("worth a great deal of money", "D-PLAUSIBLE-UNSUPPORTED"), P("kept in very good condition", "D-OPPOSITE")]),
    it("example_clue", 1, 2, 8,
      "We put the soggy things by the radiator. Ken's socks dripped after his jump in a puddle. The swimming towel left a wet patch. Rain had soaked the newspaper on the step.",
      "soggy",
      [K("wet through"),
       P("dry and crisp", "D-OPPOSITE"),
       P("warm and cozy", "D-TOPIC-ADJACENT"),
       P("torn to bits", "D-PLAUSIBLE-UNSUPPORTED")]),

    // ============ LEVEL 1 · action_clue (8) ============
    it("action_clue", 1, 1, 1,
      "The hungry puppy gobbled his dinner. He took four huge mouthfuls without pausing to chew. In moments, the bowl was empty. Then he licked it across the floor.",
      "gobbled",
      [K("ate with great speed"), P("ate in small slow bites", "D-PLAUSIBLE-UNSUPPORTED"), P("sniffed without tasting anything", "D-PLAUSIBLE-UNSUPPORTED"), P("chewed one mouthful for ages", "D-OPPOSITE")]),
    it("action_clue", 1, 1, 2,
      "The swans glided across the lake. Their bodies moved smoothly without making a splash. Their feet paddled below the water. Small ripples spread behind them as they passed.",
      "glided",
      [K("travelled in a steady, flowing way"), P("moved in a loud, splashing way", "D-PLAUSIBLE-UNSUPPORTED"), P("sank below the lake’s surface", "D-PLAUSIBLE-UNSUPPORTED"), P("flew high above the lake", "D-OPPOSITE")]),
    it("action_clue", 1, 1, 3,
      "A squirrel scampered along the fence. It took quick, light steps, then leaped. More quick steps carried it up a tree. Milo barely had time to point.",
      "scampered",
      [K("ran lightly and rapidly"), P("stood still on the fence", "D-PLAUSIBLE-UNSUPPORTED"), P("climbed slowly up the tree", "D-PLAUSIBLE-UNSUPPORTED"), P("took one enormous leap down", "D-OPPOSITE")]),
    it("action_clue", 1, 1, 4,
      "Sol pleaded to keep the lost puppy. He pressed his hands together and asked again. He followed Mom, saying please over and over. He hoped she would agree.",
      "pleaded",
      [K("begged with great feeling"), P("spoke with a cross voice", "D-PLAUSIBLE-UNSUPPORTED"), P("stopped asking for the puppy", "D-PLAUSIBLE-UNSUPPORTED"), P("shared a secret with Mom", "D-OPPOSITE")]),
    it("action_clue", 1, 2, 5,
      "Thunder boomed, and Pepper the cat trembled. Her small body shook under the bed. She stayed there until the loud storm passed. Then she came out for her food.",
      "trembled",
      [K("shook with fear"), P("stretched out slowly", "D-PLAUSIBLE-UNSUPPORTED"), P("hid in a small space", "D-PLAUSIBLE-UNSUPPORTED"), P("jumped onto a high place", "D-OPPOSITE")]),
    it("action_clue", 1, 2, 6,
      "Grandpa grumbled as he walked up the hill. He complained quietly about his sore knees. He complained about the wind too. His voice was low and cross.",
      "grumbled",
      [K("muttered crossly about problems"), P("sang a song about the hill", "D-PLAUSIBLE-UNSUPPORTED"), P("called loudly to his neighbours", "D-PLAUSIBLE-UNSUPPORTED"), P("laughed about his sore knees", "D-OPPOSITE")]),
    it("action_clue", 1, 2, 7,
      "Soap bubbles drifted over the wall. The light breeze carried them slowly along. They went wherever the wind pushed them. No bubble moved quickly or in a straight line.",
      "drifted",
      [K("were carried gently by air"), P("fell quickly beside the wall", "D-PLAUSIBLE-UNSUPPORTED"), P("turned sharply against the breeze", "D-PLAUSIBLE-UNSUPPORTED"), P("burst loudly above the wall", "D-OPPOSITE")]),
    it("action_clue", 1, 2, 8,
      "Baby Yara gazed at the hanging toy fish. She watched them turn slowly above her bed. Her eyes stayed on them for ages. She did not look away when Dad passed.",
      "gazed",
      [K("kept her eyes on something"), P("looked away after a moment", "D-PLAUSIBLE-UNSUPPORTED"), P("searched quickly all around", "D-PLAUSIBLE-UNSUPPORTED"), P("closed her eyes to rest", "D-OPPOSITE")]),

    // ============ LEVEL 2 · synonym_clue (8) ============
    it("synonym_clue", 2, 1, 1,
      "The fireworks were dazzling. Their light was so brilliant that people covered their eyes. Even the bright streetlights seemed dull beside the display.",
      "dazzling",
      [K("very bright to look at"), P("very loud to listen to", "D-PLAUSIBLE-UNSUPPORTED"), P("very quick to finish", "D-PLAUSIBLE-UNSUPPORTED"), P("very far away from people", "D-OPPOSITE")]),
    it("synonym_clue", 2, 1, 2,
      "The hikers were weary after their mountain walk. They were tired and worn out from the climb. They dropped their heavy bags and sat down without speaking.",
      "weary",
      [K("lacking energy after effort"), P("ready for more hard work", "D-PLAUSIBLE-UNSUPPORTED"), P("in need of a cool drink", "D-PLAUSIBLE-UNSUPPORTED"), P("unsure of the way back", "D-OPPOSITE")]),
    it("synonym_clue", 2, 1, 3,
      "A commotion began outside the classroom. A noisy uproar of bangs and squawks came from the yard. Three teachers went to find out what caused the racket.",
      "commotion",
      [K("a lot of noisy activity"), P("a long quiet wait", "D-PLAUSIBLE-UNSUPPORTED"), P("a short break for food", "D-PLAUSIBLE-UNSUPPORTED"), P("a slow walk in pairs", "D-OPPOSITE")]),
    it("synonym_clue", 2, 1, 4,
      "Priya came home drenched by the sudden rain. Her clothes were soaked through and her hair dripped. She left a wet patch on the doormat.",
      "drenched",
      [K("soaking wet in every part"), P("dry on every outer layer", "D-PLAUSIBLE-UNSUPPORTED"), P("cold without getting wet", "D-PLAUSIBLE-UNSUPPORTED"), P("creased from being folded", "D-OPPOSITE")]),
    it("synonym_clue", 2, 2, 5,
      "The mouse nibbled the cheese. It took small bites, eating just a little each time. The dog would have swallowed that piece in one gulp.",
      "nibbled",
      [K("took tiny mouthfuls to eat it"), P("gulped the whole piece at once", "D-PLAUSIBLE-UNSUPPORTED"), P("pushed the food aside", "D-PLAUSIBLE-UNSUPPORTED"), P("sniffed it without eating", "D-OPPOSITE")]),
    it("synonym_clue", 2, 2, 6,
      "The baker kept his kitchen spotless. Every counter was perfectly clean, without a single crumb or mark. He wiped up flour as soon as it spilled.",
      "spotless",
      [K("clean with no marks at all"), P("tidy and neatly arranged", "D-PLAUSIBLE-UNSUPPORTED"), P("empty with nothing inside", "D-PLAUSIBLE-UNSUPPORTED"), P("shiny from fresh paint", "D-OPPOSITE")]),
    it("synonym_clue", 2, 2, 7,
      "The kestrel soared above the cliff. It flew higher and higher on warm rising air. Soon the bird looked like a tiny spot in the sky.",
      "soared",
      [K("rose and flew high in the air"), P("dived swiftly downward", "D-PLAUSIBLE-UNSUPPORTED"), P("stayed still above the cliff", "D-PLAUSIBLE-UNSUPPORTED"), P("skimmed low across the ground", "D-OPPOSITE")]),
    it("synonym_clue", 2, 2, 8,
      "The soup was bitter. Its taste was harsh and unsweet, but not sour like lemon. Jonah made a face and put down his spoon.",
      "bitter",
      [K("a harsh taste without sweetness"), P("a sweet taste like honey", "D-PLAUSIBLE-UNSUPPORTED"), P("a sour taste like lemon", "D-PLAUSIBLE-UNSUPPORTED"), P("a gentle taste without much flavour", "D-OPPOSITE")]),

    // ============ LEVEL 2 · antonym_contrast_clue (8) ============
    it("antonym_contrast_clue", 2, 1, 1,
      "Faye's sister said hello loudly whenever they met new people. Faye was bashful instead, waiting quietly behind her sister. She only stepped forward when someone gently welcomed her.",
      "bashful",
      [K("shy about meeting others"), P("confident when greeting strangers", "D-PLAUSIBLE-UNSUPPORTED"), P("annoyed about sharing attention", "D-PLAUSIBLE-UNSUPPORTED"), P("impatient to leave the gathering", "D-OPPOSITE")]),
    it("antonym_contrast_clue", 2, 1, 2,
      "The new bridge stayed firm through the storm. The old bridge was rickety, shaking at every step. Two loose boards creaked, and another board was missing.",
      "rickety",
      [K("unstable and poorly supported"), P("firmly built and dependable", "D-PLAUSIBLE-UNSUPPORTED"), P("too steep for most walkers", "D-PLAUSIBLE-UNSUPPORTED"), P("narrow but strongly built", "D-OPPOSITE")]),
    it("antonym_contrast_clue", 2, 1, 3,
      "The town square was full of people and market stalls. The side streets were bare. They had no stalls, lanterns or people. Everyone had gathered in the square.",
      "bare",
      [K("empty of the things usually there"), P("crowded with many different things", "D-PLAUSIBLE-UNSUPPORTED"), P("covered with a thin layer of dust", "D-PLAUSIBLE-UNSUPPORTED"), P("freshly cleaned for a special event", "D-OPPOSITE")]),
    it("antonym_contrast_clue", 2, 1, 4,
      "The hall was warm, but the office was frigid. The principal wore a coat and wrapped herself in a blanket. She rubbed her cold fingers while waiting for the heater.",
      "frigid",
      [K("extremely cold"),
       P("comfortably warm", "D-OPPOSITE"),
       P("strangely quiet", "D-PLAUSIBLE-UNSUPPORTED"),
       P("very tidy", "D-PLAUSIBLE-UNSUPPORTED")]),
    it("antonym_contrast_clue", 2, 2, 5,
      "Dad walks slowly on Sundays. On school mornings, his pace is brisk instead. Ida has to take quick little running steps to keep up.",
      "brisk",
      [K("quick and full of energy"), P("slow and without much effort", "D-PLAUSIBLE-UNSUPPORTED"), P("quiet and careful at each step", "D-PLAUSIBLE-UNSUPPORTED"), P("uneven and likely to stumble", "D-OPPOSITE")]),
    it("antonym_contrast_clue", 2, 2, 6,
      "Ade spoke clearly so everyone in the hall could hear. Bola chose to mutter instead. Her low, unclear words could hardly be heard nearby.",
      "mutter",
      [K("speak softly without clear words"), P("call out loudly and clearly", "D-PLAUSIBLE-UNSUPPORTED"), P("repeat something in a steady rhythm", "D-PLAUSIBLE-UNSUPPORTED"), P("explain something slowly and carefully", "D-OPPOSITE")]),
    it("antonym_contrast_clue", 2, 2, 7,
      "The harbor was lively during the day. Boats came and went while workers called across the dock. At midnight it was still, with no engines or voices.",
      "lively",
      [K("busy with things happening"), P("quiet and still", "D-PLAUSIBLE-UNSUPPORTED"), P("crowded with stored tools", "D-PLAUSIBLE-UNSUPPORTED"), P("unsafe because of deep water", "D-OPPOSITE")]),
    it("antonym_contrast_clue", 2, 2, 8,
      "The midday sun filled the room with bright light. That evening, the old lamp gave only a dim glow. Noor had to move her book close to see the words.",
      "dim",
      [K("producing only a weak light"), P("producing a dazzling bright light", "D-PLAUSIBLE-UNSUPPORTED"), P("changing between several different colours", "D-PLAUSIBLE-UNSUPPORTED"), P("flashing on and off very quickly", "D-OPPOSITE")]),

    // ============ LEVEL 2 · inference_clue (8) ============
    it("inference_clue", 2, 1, 1,
      "The magician held a coin between his fingers. After he clapped, it seemed to vanish. He showed both empty hands and turned them over. The children could not find the coin anywhere.",
      "vanish",
      [K("disappear completely"),
       P("grow much bigger", "D-PLAUSIBLE-UNSUPPORTED"),
       P("shine more brightly", "D-TOPIC-ADJACENT"),
       P("stay in plain sight", "D-OPPOSITE")]),
    it("inference_clue", 2, 1, 2,
      "Leo settled into a slumber after his long hike. His eyes closed, and his breathing became slow and quiet. An hour later, he woke when Dad called him for supper.",
      "slumber",
      [K("a period of rest while asleep"), P("a slow search for something to eat", "D-PLAUSIBLE-UNSUPPORTED"), P("a long time watching the view", "D-PLAUSIBLE-UNSUPPORTED"), P("a short walk to cool down", "D-OPPOSITE")]),
    it("inference_clue", 2, 1, 3,
      "A sweet scent reached Omar from the kitchen. He lifted his nose and breathed in again. He could tell Mom was cooking apples with cinnamon.",
      "scent",
      [K("an odour carried through the air"), P("a sound travelling through the house", "D-PLAUSIBLE-UNSUPPORTED"), P("a taste left inside the mouth", "D-PLAUSIBLE-UNSUPPORTED"), P("a breeze coming through the window", "D-OPPOSITE")]),
    it("inference_clue", 2, 1, 4,
      "The steep climb left everyone hot and tired. At the top, the wide valley repaid their effort. They smiled at the view and were glad they had climbed.",
      "repaid",
      [K("provided a reward for their effort"), P("returned money they had borrowed", "D-PLAUSIBLE-UNSUPPORTED"), P("required another difficult climb", "D-PLAUSIBLE-UNSUPPORTED"), P("made the effort seem wasted", "D-OPPOSITE")]),
    it("inference_clue", 2, 2, 5,
      "Dev peered through a keyhole to see the birthday preparations. He brought his eye very close and narrowed it. Then he tried a crack beside the door for another glimpse.",
      "peered",
      [K("looked closely with effort"), P("listened closely without looking", "D-PLAUSIBLE-UNSUPPORTED"), P("glanced briefly while passing", "D-PLAUSIBLE-UNSUPPORTED"), P("knocked gently before entering", "D-OPPOSITE")]),
    it("inference_clue", 2, 2, 6,
      "The little boat bobbed beside the dock. A small wave lifted its nose, then let it fall. The next wave lifted it once more. Its rope kept it from moving away.",
      "bobbed",
      [K("rose and fell on the water"), P("travelled quickly away from the shore", "D-PLAUSIBLE-UNSUPPORTED"), P("turned steadily around in a circle", "D-PLAUSIBLE-UNSUPPORTED"), P("slid sideways along the edge of the dock", "D-OPPOSITE")]),
    it("inference_clue", 2, 2, 7,
      "Roz patched the hole in her jeans. She sewed a square of cloth over the torn knee. Her skin no longer showed, and the hole stopped getting bigger.",
      "patched",
      [K("mended by adding a covering piece"), P("enlarged by cutting around the edge", "D-PLAUSIBLE-UNSUPPORTED"), P("cleaned by soaking in hot water", "D-PLAUSIBLE-UNSUPPORTED"), P("shaped by folding the material over", "D-OPPOSITE")]),
    it("inference_clue", 2, 2, 8,
      "The first heavy drops hit the picnic blanket. Everyone dashed toward the shelter before their food got wet. They reached the roof breathing hard, leaving muddy footprints behind.",
      "dashed",
      [K("ran there very quickly"), P("walked there very slowly", "D-PLAUSIBLE-UNSUPPORTED"), P("jumped around in place", "D-PLAUSIBLE-UNSUPPORTED"), P("stood still and waited", "D-OPPOSITE")]),

    // ============ RETENTION RESERVE (8 L1 + 8 L2) ============
    it("definition_clue", 1, 1, 9,
      "Snug means warm and comfortable. Mia sat in a snug nest of blankets. Outside, rain tapped the window. Inside, she stayed warm while reading her book.",
      "snug",
      [K("warm and comfortable"),
       P("cold and damp", "D-OPPOSITE"),
       P("bored and restless", "D-PLAUSIBLE-UNSUPPORTED"),
       P("half asleep", "D-TOPIC-ADJACENT")], { retention: true }),
    it("definition_clue", 1, 2, 10,
      "A faint sound is very quiet. We heard a faint chime from far away. Everyone stopped talking to hear it. The next small ring was almost too quiet.",
      "faint",
      [K("very quiet"),
       P("booming loud", "D-OPPOSITE"),
       P("out of tune", "D-PLAUSIBLE-UNSUPPORTED"),
       P("far too slow", "D-PLAUSIBLE-UNSUPPORTED")], { retention: true }),
    it("example_clue", 1, 1, 9,
      "Our tiny boat passed a gigantic ship. Its tall side blocked the harbor from view. Trucks on its deck looked like small toys. Hundreds of windows rose above our heads.",
      "gigantic",
      [K("very large in size"), P("very old in age", "D-PLAUSIBLE-UNSUPPORTED"), P("very loud to hear", "D-PLAUSIBLE-UNSUPPORTED"), P("very slow to move", "D-OPPOSITE")], { retention: true }),
    it("example_clue", 1, 2, 10,
      "We kept delicate things on the high shelf. Thin glass cups could break with a knock. The paper lanterns could tear in rough hands. We lifted each thing with care.",
      "delicate",
      [K("easily damaged"),
       P("hard to damage", "D-OPPOSITE"),
       P("very expensive", "D-PLAUSIBLE-UNSUPPORTED"),
       P("high up", "D-TOPIC-ADJACENT")], { retention: true }),
    it("action_clue", 1, 1, 9,
      "Uncle Ray seemed grumpy during dinner. He frowned at his peas and sighed. When people asked him questions, he answered sharply. Even his favorite pudding brought no smile.",
      "grumpy",
      [K("in a bad mood"),
       P("full of jokes", "D-OPPOSITE"),
       P("very hungry", "D-PLAUSIBLE-UNSUPPORTED"),
       P("fast asleep", "D-PLAUSIBLE-UNSUPPORTED")], { retention: true }),
    it("action_clue", 1, 2, 10,
      "The lizard darted across the hot path. One moment it was on a stone. A moment later it was under the bush. Nobody could follow its quick movement.",
      "darted",
      [K("moved with a sudden rush"), P("moved with a slow crawl", "D-PLAUSIBLE-UNSUPPORTED"), P("rested without any movement", "D-PLAUSIBLE-UNSUPPORTED"), P("turned slowly in a circle", "D-OPPOSITE")], { retention: true }),
    it("definition_clue", 1, 1, 11,
      "Elderly means old in age. Our elderly neighbor is nearly ninety. He has lived here longer than anyone else. He remembers when our road had no shops.",
      "elderly",
      [K("old in age"), P("very young", "D-PLAUSIBLE-UNSUPPORTED"), P("newly arrived", "D-PLAUSIBLE-UNSUPPORTED"), P("quite tall", "D-OPPOSITE")], { retention: true }),
    it("example_clue", 1, 1, 11,
      "The junk drawer held a jumble. Old keys lay mixed with buttons and string. Batteries were tangled in rubber bands. Finding the missing bicycle bell took a long time.",
      "jumble",
      [K("a mixed-up pile of things"), P("a neat row of things", "D-PLAUSIBLE-UNSUPPORTED"), P("a set of brand-new things", "D-PLAUSIBLE-UNSUPPORTED"), P("a box of matching things", "D-OPPOSITE")], { retention: true }),
    it("synonym_clue", 2, 1, 9,
      "The stray kitten was famished. It was so hungry that it ate the whole saucerful. Ella had barely stood up before it began looking for more.",
      "famished",
      [K("extremely hungry"), P("completely full", "D-PLAUSIBLE-UNSUPPORTED"), P("very frightened", "D-PLAUSIBLE-UNSUPPORTED"), P("quite exhausted", "D-OPPOSITE")], { retention: true }),
    it("synonym_clue", 2, 2, 10,
      "The riddle baffled the family. Dad was puzzled, and Grandma could not work it out. Even Priya kept changing her answer and shaking her head.",
      "baffled",
      [K("left everyone unable to work it out"), P("made everyone unwilling to try at all", "D-PLAUSIBLE-UNSUPPORTED"), P("helped everyone agree on one clear answer", "D-PLAUSIBLE-UNSUPPORTED"), P("made everyone laugh at the same mistake", "D-OPPOSITE")], { retention: true }),
    it("antonym_contrast_clue", 2, 1, 9,
      "Most days, rough waves crashed against the harbor wall. Today the sea was placid. Boats rested on quiet, smooth water without rocking from side to side.",
      "placid",
      [K("calm with little movement"), P("rough with powerful waves", "D-PLAUSIBLE-UNSUPPORTED"), P("cold with pieces of ice", "D-PLAUSIBLE-UNSUPPORTED"), P("shallow with a muddy bottom", "D-OPPOSITE")], { retention: true }),
    it("antonym_contrast_clue", 2, 2, 10,
      "The first clue was plain and simple to solve. The final clue was cunning instead. Even the puzzle club champion had to think carefully about it.",
      "cunning",
      [K("cleverly difficult to work out"), P("simple and quick to understand", "D-PLAUSIBLE-UNSUPPORTED"), P("long but familiar to everyone", "D-PLAUSIBLE-UNSUPPORTED"), P("incomplete because parts were missing", "D-OPPOSITE")], { retention: true }),
    it("inference_clue", 2, 1, 9,
      "The parcel was cumbersome. Jai wrapped both arms around it to keep hold. He had to turn sideways to fit through doorways. He stopped often to rest his arms.",
      "cumbersome",
      [K("large and difficult to handle"), P("light and simple to lift", "D-PLAUSIBLE-UNSUPPORTED"), P("small but very valuable", "D-PLAUSIBLE-UNSUPPORTED"), P("soft and easy to squeeze", "D-OPPOSITE")], { retention: true }),
    it("inference_clue", 2, 2, 10,
      "Asha sniffed the butter, then held it away from her face. It smelled bad after several days in the warm kitchen. The butter had turned rancid, so she threw it away.",
      "rancid",
      [K("spoiled and unpleasant to smell"), P("fresh and pleasant to spread", "D-PLAUSIBLE-UNSUPPORTED"), P("hard after becoming very cold", "D-PLAUSIBLE-UNSUPPORTED"), P("thin after mixing with water", "D-OPPOSITE")], { retention: true }),
    it("synonym_clue", 2, 1, 11,
      "The dog was loyal to Farmer Bell. It stayed by his side and never left him behind. Even in heavy rain, the dog followed him along the path.",
      "loyal",
      [K("staying true to someone"), P("staying afraid of someone", "D-PLAUSIBLE-UNSUPPORTED"), P("staying hidden from someone", "D-PLAUSIBLE-UNSUPPORTED"), P("staying angry with someone", "D-OPPOSITE")], { retention: true }),
    it("inference_clue", 2, 1, 11,
      "Zainab waited quietly while the judge read the results. At last, she heard her name as the winner. She beamed at her family. Her wide smile stayed through the whole prize giving.",
      "beamed",
      [K("smiled very broadly"), P("frowned with annoyance", "D-PLAUSIBLE-UNSUPPORTED"), P("stared without expression", "D-PLAUSIBLE-UNSUPPORTED"), P("laughed with a loud noise", "D-OPPOSITE")], { retention: true }),
    // Fresh retry stock: four additional questions in each phase.
    {
      "u": "definition_clue",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "definition_clue",
      "passage": "The path was narrow, with little space across it. We had to walk in a line.",
      "prompt": "What does \"narrow\" mean here?",
      "choices": [
        {
          "t": "not very wide",
          "r": "KEY",
          "k": true
        },
        {
          "t": "not very smooth",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "not very straight",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "not very long",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "example_clue",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "example_clue",
      "passage": "We sorted the fasteners into trays. Buttons went here, and zips went there. Hooks and buckles filled the last tray.",
      "prompt": "What are \"fasteners\"?",
      "choices": [
        {
          "t": "things that hold clothing closed",
          "r": "KEY",
          "k": true
        },
        {
          "t": "things that make clothing warmer",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "things that wash clothing clean",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "things that change clothing colour",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "action_clue",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "action_clue",
      "passage": "Tia peered through the tiny hole. She moved closer and squinted to see inside.",
      "prompt": "What does \"peered\" mean?",
      "choices": [
        {
          "t": "looked with careful effort",
          "r": "KEY",
          "k": true
        },
        {
          "t": "spoke in a quiet voice",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "moved at a quick pace",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "reached with both hands",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "example_clue",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "example_clue",
      "passage": "We packed utensils for the picnic. Each bag had a spoon, fork, and knife.",
      "prompt": "What are \"utensils\" here?",
      "choices": [
        {
          "t": "tools used for eating food",
          "r": "KEY",
          "k": true
        },
        {
          "t": "bags used for carrying food",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "cloths used for covering food",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "boxes used for storing food",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "action_clue",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "action_clue",
      "passage": "The puppy nudged my knee with its nose. My leg moved a little from the gentle push.",
      "prompt": "What does \"nudged\" mean?",
      "choices": [
        {
          "t": "pushed lightly",
          "r": "KEY",
          "k": true
        },
        {
          "t": "bit sharply",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "looked closely",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "called loudly",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "definition_clue",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "definition_clue",
      "passage": "The cloth was absorbent; it soaked up spilled water. Soon, the table was dry.",
      "prompt": "What does \"absorbent\" mean?",
      "choices": [
        {
          "t": "able to take in liquid",
          "r": "KEY",
          "k": true
        },
        {
          "t": "able to keep out dust",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "able to let light through",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "able to stretch without tearing",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "example_clue",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "example_clue",
      "passage": "The box held keepsakes from our trip. There was a ticket, postcard, and tiny shell. Each one helped us remember a special day.",
      "prompt": "What are \"keepsakes\"?",
      "choices": [
        {
          "t": "objects saved to remember something",
          "r": "KEY",
          "k": true
        },
        {
          "t": "objects collected to sell in shops",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "objects borrowed to finish a job",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "objects thrown away after a trip",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "action_clue",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "action_clue",
      "passage": "Jo fumbled with the wet soap. It slipped between her fingers twice. She could not get a firm grip.",
      "prompt": "What does \"fumbled\" mean?",
      "choices": [
        {
          "t": "handled in a clumsy way",
          "r": "KEY",
          "k": true
        },
        {
          "t": "washed in a careful way",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "dried in a gentle way",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "carried in a steady way",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "synonym_clue",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "synonym_clue",
      "passage": "The guide described the route as circular. It formed a loop and ended where it began.",
      "prompt": "What does \"circular\" mean?",
      "choices": [
        {
          "t": "going around and returning to the start",
          "r": "KEY",
          "k": true
        },
        {
          "t": "going straight on without changing direction",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "going upward until reaching the highest point",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "going back only along the same track",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "antonym_contrast_clue",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "antonym_contrast_clue",
      "passage": "The first cushion was rigid, but the second bent easily. Mia chose the flexible one for the curved seat.",
      "prompt": "What does \"rigid\" mean?",
      "choices": [
        {
          "t": "stiff and hard to bend",
          "r": "KEY",
          "k": true
        },
        {
          "t": "soft and easy to squeeze",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "rough and painful to touch",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "thin and easy to tear",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "inference_clue",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "inference_clue",
      "passage": "The hinge was corroded after years of rain. Orange flakes fell off, and the metal broke when pressed.",
      "prompt": "What does \"corroded\" mean here?",
      "choices": [
        {
          "t": "damaged as the metal slowly rusted",
          "r": "KEY",
          "k": true
        },
        {
          "t": "bent into a shape for a new use",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "covered with a fresh layer of paint",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "heated until the metal became soft",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "inference_clue",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "inference_clue",
      "passage": "The instructions were concise. I read them in half a minute and knew each step. Nothing important was missing.",
      "prompt": "What does \"concise\" mean?",
      "choices": [
        {
          "t": "brief while still giving what is needed",
          "r": "KEY",
          "k": true
        },
        {
          "t": "long because every detail is repeated",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "unclear because important steps are missing",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "careful to avoid giving a direct answer",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "antonym_contrast_clue",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "antonym_contrast_clue",
      "passage": "The loose rope sagged between the posts. Dan pulled it taut, so it ran straight without drooping.",
      "prompt": "What does \"taut\" mean?",
      "choices": [
        {
          "t": "pulled tight",
          "r": "KEY",
          "k": true
        },
        {
          "t": "hanging low",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "cut short",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "tied loosely",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "synonym_clue",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "synonym_clue",
      "passage": "We needed to postpone the outdoor show. We moved it to the following week because of rain.",
      "prompt": "What does \"postpone\" mean?",
      "choices": [K("move it to a later date"), P("cancel it completely", "D-PLAUSIBLE-UNSUPPORTED"), P("change its location", "D-PLAUSIBLE-UNSUPPORTED"), P("hold it earlier", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "inference_clue",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "inference_clue",
      "passage": "Eli was meticulous when building the model. He measured each piece twice and checked every tiny join.",
      "prompt": "What does \"meticulous\" mean?",
      "choices": [
        {
          "t": "very careful about small details",
          "r": "KEY",
          "k": true
        },
        {
          "t": "very quick to finish a task",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "very keen to change the plan",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "very willing to share materials",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "inference_clue",
      "lvl": 2,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "inference_clue",
      "passage": "The roof was permeable. After a shower, drops passed through tiny spaces and wet the floor.",
      "prompt": "What does \"permeable\" mean?",
      "choices": [
        {
          "t": "allowing water to pass through",
          "r": "KEY",
          "k": true
        },
        {
          "t": "able to fold into a small space",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "strong enough to hold heavy objects",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "able to reflect light from its surface",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    }
]
};
