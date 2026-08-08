/*
 * Little Literacy Guides SEL Books 1-10 — Level A, B and C draft collection.
 *
 * These manuscripts are intentionally not imported by guidedReadingBooks.js yet.
 * They remain draft-only until every page has approved art, exact narration,
 * accessibility evidence and a story-content review record.
 */

const page = (text, scene) => Object.freeze({ text, scene });

const A = (bookNumber, title, focus, characters, setting, spine, pages) => Object.freeze({
  id: `llg-sel-a-${String(bookNumber).padStart(2, "0")}`,
  collection: "Little Literacy Guides SEL Books 1-10",
  label: `Little Literacy Guides SEL Book ${bookNumber}`,
  level: "A",
  bookNumber,
  title,
  type: "fiction",
  category: "social-emotional-learning",
  interestAge: "4-8",
  learningFocus: focus,
  characters: Object.freeze(characters),
  setting,
  storySpine: spine,
  pages: Object.freeze(pages),
  mediaStatus: "manuscript-locked-media-not-started"
});

const B = (bookNumber, title, focus, characters, setting, spine, pages) => Object.freeze({
  id: `llg-sel-b-${String(bookNumber).padStart(2, "0")}`,
  collection: "Little Literacy Guides SEL Books 1-10",
  label: `Little Literacy Guides SEL Book ${bookNumber}`,
  level: "B",
  bookNumber,
  title,
  type: "fiction",
  category: "social-emotional-learning",
  interestAge: "5-8",
  learningFocus: focus,
  characters: Object.freeze(characters),
  setting,
  storySpine: spine,
  pages: Object.freeze(pages),
  mediaStatus: "manuscript-locked-media-not-started"
});

const C = (bookNumber, title, focus, characters, setting, spine, pages) => Object.freeze({
  id: `llg-sel-c-${String(bookNumber).padStart(2, "0")}`,
  collection: "Little Literacy Guides SEL Books 1-10",
  label: `Little Literacy Guides SEL Book ${bookNumber}`,
  level: "C",
  bookNumber,
  title,
  type: "fiction",
  category: "social-emotional-learning",
  interestAge: "6-9",
  learningFocus: focus,
  characters: Object.freeze(characters),
  setting,
  storySpine: spine,
  pages: Object.freeze(pages),
  mediaStatus: "manuscript-locked-media-not-started"
});

export const guidedReadingSelBooksDraft = Object.freeze([
  A(1, "Pip Finds a Quiet Spot", "self-regulation and noticing body signals", ["MOON-PIP", "MOON-STONE"], "Moonwood, beside the Crystal Stream", "Pip needs a quiet place after the forest drums feel too loud.", [
    page("Pip hears loud drums.", "Pip covers his ears beside the stream."),
    page("Pip runs past Stone.", "Pip hurries toward the Hollow Oak."),
    page("Pip sees a dark nook.", "A small mossy nook waits under roots."),
    page("Pip takes one slow breath.", "Pip breathes with one hand on his belly."),
    page("The drums sound far away.", "Pip opens his eyes and hears the softer stream."),
    page("Pip joins Stone when ready.", "Pip walks back with Stone at an easy pace.")
  ]),
  A(2, "Fern Waits", "patience and flexible waiting", ["MOON-FERN", "MOON-WREN"], "Moonwood, Fern's garden", "Fern wants to hear the night flower open, but rushing keeps disturbing it.", [
    page("Fern finds a shut flower.", "Fern kneels beside one closed moon flower."),
    page("Fern taps the flower.", "The flower stays shut after Fern taps its stem."),
    page("Fern shakes the flower.", "Fern shakes the stem and loose petals fall."),
    page("Wren holds up a hand.", "Wren holds up one gentle hand."),
    page("Fern sits by the flower.", "Fern and Wren sit without touching it."),
    page("The flower opens for Fern.", "The moon flower opens and shows its gold center.")
  ]),
  A(3, "Muddy's Turn", "turn-taking and fair play", ["MEADOW-MUDDY", "MEADOW-SPLASHY"], "Sunny Meadow Farm, the duck pond", "Muddy wants the blue pail, but Splashy is using it to fill the pond tray.", [
    page("Muddy sees the blue pail.", "Muddy reaches toward the pail."),
    page("Muddy grabs the pail.", "Splashy holds the other handle."),
    page("The pail tips over.", "Water spills across the dry tray."),
    page("Muddy gives it back.", "Muddy returns the pail to Splashy."),
    page("Splashy fills one cup.", "Splashy pours one cup and slides the pail over."),
    page("Muddy fills the next cup.", "Muddy takes a turn and the tray fills.")
  ]),
  A(4, "Bob and Nan Make Space", "personal boundaries and asking before touching", ["HUMAN-BOB", "HUMAN-NAN"], "A sunny garden beside Bob and Nan's home", "Bob wants Nan's bright cushion, but Nan is still using it for her quiet nest.", [
    page("Bob sees Nan's soft cushion.", "Nan sits on the cushion under a tree."),
    page("Bob pulls the cushion.", "Nan holds the cushion close."),
    page("Nan holds up a hand.", "Nan raises a hand and looks at Bob."),
    page("Bob lets go.", "Bob steps back from the cushion."),
    page("Bob asks for a turn.", "Bob points to the cushion and waits."),
    page("Nan moves it beside Bob.", "Nan and Bob share the cushion space.")
  ]),
  A(5, "James and Anna Share the Map", "collaboration and listening to another idea", ["HUMAN-JAMES", "HUMAN-ANNA"], "A small park with a red bridge", "James wants to lead with the map, but Anna has noticed the bridge is closed.", [
    page("James holds the red map.", "James points along the path."),
    page("James walks to the bridge.", "Anna follows and spots a rope."),
    page("Anna points to the rope.", "The rope blocks the bridge entrance."),
    page("James looks again.", "James turns the map toward Anna."),
    page("Anna finds a green path.", "Anna points to a safe path around the pond."),
    page("James and Anna reach the gate.", "They arrive together and hold the map between them.")
  ]),
  A(6, "Glimmer's Warm Breath", "calming through safe breathing and asking for help", ["MOON-GLIMMER", "MOON-PIP"], "Moonwood, the Glow Cave", "Glimmer's warm breath makes the cave lanterns flare when he feels rushed.", [
    page("Glimmer sees a dark cave.", "Glimmer stands at the cave mouth."),
    page("Glimmer blows warm air.", "The nearest lantern flares bright."),
    page("Pip steps back.", "Pip shields his eyes from the bright glow."),
    page("Glimmer stops his breath.", "Glimmer closes his mouth and lowers his wings."),
    page("Glimmer breathes out slow.", "A small warm puff lights one lantern."),
    page("The cave glows soft.", "Glimmer and Pip walk through the gentle light.")
  ]),
  A(7, "Chips Says Stop", "hearing a boundary and repairing play", ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"], "A safe farmyard with a low wooden gate", "Chips keeps tugging James's scarf until James says stop and the children change the game.", [
    page("Chips tugs James's scarf.", "The goat pulls the end of James's scarf."),
    page("James pulls it back.", "James holds the scarf and frowns."),
    page("James holds up a hand.", "James raises one palm toward Chips."),
    page("Chips drops the scarf.", "Chips releases the scarf and steps back."),
    page("Anna brings a rope ring.", "Anna offers Chips a safe tug ring."),
    page("Chips tugs the ring.", "Chips pulls the ring while James holds the other side.")
  ]),
  A(8, "Stone's Slow Step", "frustration tolerance and asking for a slower pace", ["MOON-STONE", "MOON-PIP"], "Moonwood, a narrow root path", "Stone wants to cross the root path with Pip, but his first step breaks the soft bridge.", [
    page("Stone sees the root path.", "Stone looks at the narrow path."),
    page("Stone takes one big step.", "The soft root bends under Stone's foot."),
    page("The root bridge breaks.", "Stone's foot rests beside the broken root."),
    page("Stone feels stuck.", "Stone lowers his head while Pip studies the roots."),
    page("Pip finds flat stones.", "Pip points to a row of flat stones."),
    page("Stone takes small steps.", "Stone crosses with careful feet beside Pip.")
  ]),
  A(9, "Luna Listens", "active listening and checking what a friend means", ["MOON-LUNA", "MOON-PIP"], "Moonwood, under the Hollow Oak", "Luna wants to help Pip find a lost bell, but she first listens for the sound instead of guessing.", [
    page("Pip looks for his bell.", "Pip searches the moss under the oak."),
    page("Luna points left.", "Luna turns her head toward a rustle."),
    page("Pip looks left.", "Pip finds only a leaf."),
    page("Luna listens again.", "Luna closes her eyes and tilts her head."),
    page("A soft bell rings.", "The bell sound comes from a hollow root."),
    page("Pip finds the bell.", "Pip lifts the bell from the root and smiles at Luna.")
  ]),
  A(10, "Fluff Needs a Pause", "recognizing overwhelm and choosing a safe pause", ["HUMAN-FLUFF", "HUMAN-BOB", "HUMAN-NAN"], "A family picnic beside a busy playground", "Fluff wants to join the game, but the busy sounds make him hide and he needs a quiet pause.", [
    page("Fluff sees the busy play.", "Fluff watches children run near the picnic."),
    page("Fluff covers his ears.", "Fluff tucks his ears down."),
    page("Fluff hides under the cloth.", "Fluff curls beneath the picnic cloth."),
    page("Bob makes a quiet nook.", "Bob places a cushion behind the picnic basket."),
    page("Fluff peeks out.", "Fluff looks from the quiet nook toward the play."),
    page("Fluff joins one calm game.", "Fluff carries one soft ball to Bob and Nan.")
  ]),

  B(1, "Muddy and the Muddy Mitt", "repair after a mistake and taking responsibility", ["MEADOW-MUDDY", "MEADOW-SPLASHY", "MEADOW-SHY"], "Sunny Meadow Farm, the shared art table", "Muddy borrows Shy's red mitt without asking, spills paint, then repairs the mitt and asks before borrowing.", [
    page("Muddy wants the red mitt.", "Muddy reaches across the art table toward Shy's mitt."),
    page("Muddy takes the mitt.", "Shy looks up as Muddy pulls it away."),
    page("Paint splashes the mitt.", "The red mitt lands in a blue paint tray."),
    page("Shy pulls her hand back.", "Shy looks at the stained mitt and steps away."),
    page("Muddy brings a clean cloth.", "Muddy carries a cloth and a bowl of water."),
    page("Muddy washes the mitt.", "Muddy scrubs while Splashy holds the bowl."),
    page("Muddy asks before borrowing.", "Muddy waits with an open hoof."),
    page("Shy offers the mitt.", "Shy gives the clean mitt to Muddy for one careful turn.")
  ]),
  B(2, "Wren's Plan Has Two Paths", "flexible thinking when a plan changes", ["MOON-WREN", "MOON-PIP", "MOON-BURROW"], "Moonwood, a root tunnel beside the Glow Cave", "Wren plans a straight path to the cave, but a fallen branch forces her to choose a new route.", [
    page("Wren draws a straight path.", "Wren marks a line on Burrow's map."),
    page("The branch blocks the path.", "A large branch lies across the tunnel mouth."),
    page("Wren pulls the branch.", "Wren strains while Pip pushes beside her."),
    page("The branch will not move.", "The branch stays lodged between the roots."),
    page("Burrow finds a side tunnel.", "Burrow points to a small tunnel on the map."),
    page("Wren changes the plan.", "Wren draws a curved line around the branch."),
    page("Pip carries the lantern.", "Pip lights the side tunnel while Wren leads."),
    page("The new path reaches the cave.", "The three friends arrive at the Glow Cave together.")
  ]),
  B(3, "James, Anna and the Unheard Idea", "including another person's idea", ["HUMAN-JAMES", "HUMAN-ANNA"], "A school garden with a seed bed", "James and Anna rush to build a tall scarecrow until they notice the small idea that makes it useful.", [
    page("James wants a tall scarecrow.", "James holds a long pole beside the seed bed."),
    page("Anna brings bright cloth.", "Anna carries a bundle of cloth strips."),
    page("The pole tips over.", "The tall pole falls across the empty bed."),
    page("Anna says, Try low.", "Anna points to the seedlings near the soil."),
    page("James listens to Anna.", "James kneels beside Anna and looks at the small plants."),
    page("They make a low flag.", "James ties Anna's cloth to a short stick."),
    page("The birds fly away.", "The bright flag moves above the seedlings."),
    page("The plants get room to grow.", "James and Anna water the bed beside the new flag.")
  ]),
  B(4, "Glimmer Shares the Glow", "sharing a resource and noticing fairness", ["MOON-GLIMMER", "MOON-FERN", "MOON-PIP"], "Moonwood, the Glow Cave", "Glimmer wants all the glow crystals for his nest, but Fern and Pip need light to cross the cave safely.", [
    page("Glimmer gathers the glow.", "Glimmer piles three crystals beside his nest."),
    page("Fern finds the cave dark.", "Fern reaches toward the dark path."),
    page("Pip trips on a root.", "Pip catches himself beside the unlit root."),
    page("Glimmer guards the crystals.", "Glimmer curls his wings around the pile."),
    page("Fern asks for one light.", "Fern holds out a leaf-shaped hand."),
    page("Glimmer carries two crystals.", "Glimmer places two crystals along the path."),
    page("The nest keeps one glow.", "One crystal remains warm beside Glimmer's nest."),
    page("All three cross safely.", "Fern, Pip and Glimmer walk through the shared light.")
  ]),
  B(5, "Chips and the Open Gate", "repairing trust through a safe choice", ["HUMAN-CHIPS", "HUMAN-JAMES", "HUMAN-ANNA"], "A farm lane with a low gate", "Chips pushes through an open gate and scatters the garden basket, so he helps gather everything before play resumes.", [
    page("Chips sees the open gate.", "Chips looks from the lane into the garden."),
    page("Chips pushes through.", "Chips trots through before James can close the gate."),
    page("The basket tips over.", "Apples and cloth spill across the path."),
    page("James blocks the lane.", "James stands between Chips and the road."),
    page("Anna gathers the apples.", "Anna kneels to collect the rolling apples."),
    page("Chips carries the basket.", "Chips lifts the empty basket by its handle."),
    page("James closes the gate.", "James closes the gate while Anna checks the latch."),
    page("Chips waits for the signal.", "Chips sits inside the garden until Anna opens the gate.")
  ]),
  B(6, "Stone and the Small Bridge", "asking for help without giving up", ["MOON-STONE", "MOON-PIP", "MOON-BURROW"], "Moonwood, Crystal Stream", "Stone wants to carry a wide basket across the stream, but the small bridge cannot hold his first plan.", [
    page("Stone carries the wide basket.", "Stone lifts a basket wider than his shoulders."),
    page("Stone steps on the bridge.", "The small bridge bends under Stone and the basket."),
    page("Stone backs away.", "Stone places the basket safely on the bank."),
    page("Stone says, I need help.", "Stone looks toward Pip and Burrow."),
    page("Burrow finds a flat raft.", "Burrow digs out a small raft beside the bank."),
    page("Pip ties the basket.", "Pip ties the basket to the raft with a short rope."),
    page("Stone pushes the raft.", "Stone uses one careful hand to push the raft."),
    page("The basket reaches the bank.", "Pip and Burrow pull the basket onto the far bank.")
  ]),
  B(7, "Bob and Nan's Two Listening Ears", "solving a disagreement by listening and restating", ["HUMAN-BOB", "HUMAN-NAN"], "A bedroom floor with one shared train set", "Bob wants a fast train and Nan wants a quiet train, so they listen and build two connected tracks.", [
    page("Bob builds a fast track.", "Bob lays a long track across the floor."),
    page("Nan covers her ears.", "Nan watches the noisy train roll by."),
    page("Nan builds a quiet track.", "Nan makes a short track beside the rug."),
    page("Bob says, You want quiet.", "Bob points to Nan's small track."),
    page("Nan says, You want speed.", "Nan points to Bob's long track."),
    page("They join the tracks.", "Bob and Nan connect the two tracks."),
    page("The train slows by Nan.", "The train rolls slowly around Nan's track."),
    page("The train speeds by Bob.", "The train travels fast along Bob's long track.")
  ]),
  B(8, "Luna and the Wrong Nest", "checking assumptions and making a respectful repair", ["MOON-LUNA", "MOON-PIP"], "Moonwood, a tall fir above the Fog Marsh", "Luna thinks a small nest is empty, but Pip notices a sleeping bird and helps her return the fallen twig quietly.", [
    page("Luna finds a fallen twig.", "Luna carries a twig below a low nest."),
    page("Luna reaches for the nest.", "Luna stretches one wing toward the nest."),
    page("A small bird moves.", "A young bird peeks over the nest rim."),
    page("Luna pulls back.", "Luna folds her wing and steps away."),
    page("Pip finds the nest side.", "Pip points to a lower branch near the nest."),
    page("Luna carries the twig there.", "Luna sets the twig beside the nest instead of touching it."),
    page("The bird pulls it in.", "The young bird tugs the twig into the nest."),
    page("Luna watches from below.", "Luna and Pip watch quietly from the marsh path.")
  ]),
  B(9, "Fern's Song for the Whole Garden", "belonging, inclusion and adapting a shared activity", ["MOON-FERN", "MOON-WREN", "MOON-GLIMMER"], "Moonwood, Fern's garden at dusk", "Fern plans a loud garden song, but Glimmer needs a gentle sound, so the friends make a song with quiet and bright parts.", [
    page("Fern starts a loud song.", "Fern sings while leaves shake around the garden."),
    page("Glimmer covers his ears.", "Glimmer folds his wings over his ears."),
    page("Wren stops the song.", "Wren lifts her wand but does not cast."),
    page("Fern asks what helps.", "Fern kneels beside Glimmer."),
    page("Glimmer taps one leaf.", "Glimmer taps a broad leaf softly."),
    page("Fern makes a soft beat.", "Fern brushes the leaf in a slow rhythm."),
    page("Wren adds one bright note.", "Wren adds a single clear chime."),
    page("The garden sings together.", "The song moves from soft leaves to one bright chime.")
  ]),
  B(10, "Fluff Finds the Lost Bell", "persistence, asking for clues and shared problem-solving", ["HUMAN-FLUFF", "HUMAN-BOB", "HUMAN-NAN"], "A garden path with stepping stones", "Fluff loses his bell and searches everywhere until Bob and Nan help him follow sound clues instead of guessing.", [
    page("Fluff hears no bell.", "Fluff looks at the empty red harness."),
    page("Fluff checks the basket.", "Fluff sniffs beside the picnic basket."),
    page("The basket is empty.", "Bob tips the basket while Nan checks the cloth."),
    page("Fluff checks the gate.", "Fluff sniffs near the garden gate."),
    page("Nan hears a faint ring.", "Nan raises one finger beside the stepping stones."),
    page("Bob follows the sound.", "Bob walks slowly along the stone path."),
    page("Fluff finds the bell.", "Fluff noses the bell beneath a fern leaf."),
    page("Fluff rings it with care.", "Fluff wears the bell again and walks beside Bob and Nan.")
  ]),

  C(1, "The Lantern That Needed Listening", "emotional regulation, active listening and repair", ["MOON-FLINT", "MOON-PIP", "MOON-LUNA"], "Moonwood, the Fog Marsh", "Flint rushes ahead with his lantern, scares Pip, and must listen to the marsh before choosing a safer light.", [
    page("Flint lifts his lantern and races into the Fog Marsh. Pip follows, but the thick fog swallows the path behind them.", "Flint strides ahead with the lantern held high while Pip reaches toward the fading path."),
    page("A sudden glow flashes across the reeds. Flint swings the lantern toward it, and Pip ducks behind a root.", "The lantern beam sweeps the reeds; Pip crouches behind the root."),
    page("Flint turns back. Pip's hands are shaking, and the marsh is too quiet to show what made the glow.", "Flint lowers the lantern and notices Pip's trembling hands."),
    page("Flint starts to charge forward again, then stops. He listens for water, wings and the soft knock of reeds.", "Flint pauses mid-step and listens while Pip stands beside him."),
    page("Luna calls from above. The glow is a wet leaf catching moonlight, not a creature on the path.", "Luna circles above a silver leaf while Flint and Pip look up."),
    page("Flint shields the lantern with his coat. The small light points down instead of startling the marsh.", "Flint covers the lantern sides so its beam rests on the ground."),
    page("Pip chooses the next step. He names the root, the reed and the shallow water before they move.", "Pip points out three safe features in the path."),
    page("They cross the marsh slowly. Flint keeps the light low, and Pip keeps the map open between them.", "Flint and Pip walk side by side with Luna above them."),
    page("At the far bank, Flint gives Pip the first look at the lantern. The marsh stays calm behind them.", "Flint offers the lantern handle to Pip at the safe far bank."),
    page("The lantern was not braver than the friends. It was useful because they changed how they carried it.", "The friends rest beside the quiet water with the lantern glowing softly.")
  ]),
  C(2, "Anna's Red Thread", "perspective-taking, clarification and collaborative planning", ["HUMAN-ANNA", "HUMAN-JAMES", "HUMAN-CHIPS"], "A community garden with a maze of beds", "Anna follows a red thread to find the garden gate, but James sees that the thread marks a boundary, not a path.", [
    page("Anna finds a red thread tied to the garden fence. She thinks it marks the quickest way to the gate.", "Anna lifts the red thread beside the fence while James studies the beds."),
    page("She follows it between the beds, stepping over small shoots and pulling the thread behind her.", "Anna walks between vegetable beds with the thread trailing behind."),
    page("James calls her back. The thread is tight around a post, and one seedling has bent beneath it.", "James points to the taut thread and the bent seedling."),
    page("Anna wants to keep going, but she notices Chips watching the gate from the other side of the fence.", "Anna looks from the seedling toward Chips beyond the gate."),
    page("James explains what he sees. The red thread marks the watering boundary, so crossing it would pull the beds apart.", "James traces the thread's boundary with one careful finger."),
    page("Anna asks Chips what he needs. Chips points to the latch, not the path, and waits beside it.", "Anna kneels near Chips while James holds the thread safely."),
    page("Together they lift the thread from the seedling, coil it on the fence and check the latch.", "Anna frees the seedling, James coils the thread and Chips watches the latch."),
    page("The gate opens without tugging the beds. Anna follows the stone path while James carries the coil.", "The group leaves through the gate on the clear stone path."),
    page("Anna keeps the red thread where it belongs. This time, the boundary helps everyone find the way.", "The red thread rests neatly on the fence as the garden settles."),
    page("James and Anna walk on either side of Chips. They agree to ask what a marker means before following it.", "James, Anna and Chips walk together beyond the garden.")
  ]),
  C(3, "Stone Carries the Quiet", "co-regulation, consent and making space for different needs", ["MOON-STONE", "MOON-FERN", "MOON-PIP"], "Moonwood, the Echo Root Hall", "Stone tries to protect Fern from an echo by carrying her, but Fern needs choice and quiet control over the solution.", [
    page("A deep echo rolls through the Echo Root Hall. Fern's leaves tremble, and Stone reaches down to lift her.", "Stone bends toward Fern while the hall sends back a soft echo."),
    page("Fern steps away. She wants help, but she does not want to be carried without warning.", "Fern raises one leaf-hand and keeps both feet on the root floor."),
    page("Stone freezes. His broad hands hover, and Pip notices that the echo grows when Stone speaks loudly.", "Stone lowers his hands while Pip points to the rippling roots."),
    page("Fern chooses a quiet signal: two taps on her leaf body when she needs a pause.", "Fern taps her leaf body twice and shows Stone the signal."),
    page("Stone answers with one slow nod. He moves beside Fern instead of in front of her.", "Stone kneels beside Fern with his hands open and low."),
    page("Pip finds a curtain of moss that softens the hall. Fern points to the space behind it.", "Pip lifts a moss curtain while Fern studies the quieter space."),
    page("Stone holds the moss aside only after Fern nods. The three friends enter without adding a new echo.", "Stone holds the curtain while Fern and Pip pass through first."),
    page("Inside, Fern's leaves settle. She taps twice, and Stone stops moving at once.", "Fern taps the agreed signal; Stone pauses beside the moss."),
    page("The hall is still not silent, but the friends can hear one another. Fern leads them toward the far door.", "Fern leads through the softened hall while Stone and Pip follow."),
    page("At the door, Fern thanks Stone for listening with his whole body. Stone says the quiet helped him listen too.", "The friends stand in the moonlit doorway with the moss curtain behind them.")
  ]),
  C(4, "The Garden With Two Entrances", "conflict resolution, shared ownership and compromise", ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-FLUFF"], "A community garden with a narrow gate and a wide gate", "Bob and Nan disagree about which entrance their garden should use until they observe who needs each gate and redesign the space together.", [
    page("Bob paints a sign for the narrow gate. Nan carries a wide basket toward the other entrance.", "Bob paints beside the narrow gate while Nan approaches the wide gate."),
    page("Bob says the narrow gate is faster. Nan says the basket will not fit through it.", "Bob points to the short path; Nan points to the broad basket."),
    page("They pull the same sign in opposite directions. The wet paint smears across both hands.", "The sign tilts between Bob and Nan as red paint marks their fingers."),
    page("Fluff backs away from the argument and noses the basket toward the wide gate.", "Fluff guides the basket toward the wider entrance."),
    page("Bob notices the wide path has a puddle. Nan notices the narrow path has a step.", "Bob points to the puddle; Nan points to the step."),
    page("They test each entrance with the basket, a watering can and Fluff's small cart.", "Bob and Nan move three objects through both gates while Fluff watches."),
    page("The narrow gate works for small tools. The wide gate works for the basket and cart, but needs a dry path.", "The objects line up beside the two gates with clear differences."),
    page("Bob carries stones to the puddle. Nan paints two signs instead of one.", "Bob lays flat stones while Nan paints matching entrance signs."),
    page("The garden now has two useful entrances. Neither idea vanished; each one found the job it could do.", "The finished gates show a dry wide path and a short narrow path."),
    page("Bob and Nan enter by different gates and meet beside the same tomato bed. Fluff rolls between them.", "The children and Fluff meet in the garden center beside the tomatoes.")
  ]),
  C(5, "Glimmer's Safe Spark", "impulse control, consent and repairing fear", ["MOON-GLIMMER", "MOON-WREN", "MOON-LUNA"], "Moonwood, the Star Room", "Glimmer wants to surprise Wren with a spark, but the surprise frightens her, so he learns to ask before making light.", [
    page("Glimmer discovers a gold spark between two stones. He holds it behind his wing and plans a surprise for Wren.", "Glimmer hides a tiny gold spark behind his wing in the Star Room."),
    page("Wren enters carrying a book. Glimmer releases the spark too close to her face, and she drops the book.", "The spark flashes near Wren; her book lies open on the floor."),
    page("Wren steps back. Glimmer reaches toward her, but Luna's calm wing signals him to stop and give space.", "Luna extends one wing between Glimmer and Wren while Wren steps back."),
    page("Glimmer lets the spark fade. He looks at the dropped book, then at Wren's tight shoulders.", "Glimmer lowers his head as the spark dims above his paw."),
    page("Wren says she likes light when she knows it is coming. She does not want a flash near her face.", "Wren points first to the safe lamp, then to the space near her face."),
    page("Glimmer asks before lighting the spark. Wren chooses the far wall, and Luna checks the clear space.", "Wren points to the far wall while Luna surveys the room."),
    page("The spark travels across the room and blooms like a small star. Wren watches without covering her eyes.", "The gold spark glows on the far wall with Wren at a comfortable distance."),
    page("Glimmer helps lift the book. Wren turns the page, and the spark follows the picture instead of interrupting it.", "Glimmer steadies the book while Wren reads beside the soft spark."),
    page("The surprise is gone, but the trust is clearer. Glimmer asks, Wren answers and Luna keeps the room safe.", "The three friends sit with the book and the spark between them."),
    page("Glimmer saves one small spark for later. This time, he carries a question with it.", "Glimmer cups the spark safely while Wren and Luna smile beside him.")
  ]),
  C(6, "The Listening Bench", "belonging, turn-taking and making a group decision", ["MEADOW-MUDDY", "MEADOW-GRUMPY", "MEADOW-SPLASHY"], "Sunny Meadow Farm, the old oak bench", "The friends must choose one place for a new bench, but Grumpy's quiet need and Splashy's water route are both easy to miss.", [
    page("Muddy finds three boards and imagines a bench beneath the oak. Splashy wants it near the pond for shade.", "Muddy stacks boards beneath the oak while Splashy points toward the pond."),
    page("Grumpy says little. He stands beside the stone wall, away from the clatter and splashing.", "Grumpy watches from the stone wall with his ears turned back."),
    page("Muddy marks the oak with chalk. Splashy carries a board toward the pond before the group has decided.", "Muddy makes a chalk mark while Splashy carries one board away."),
    page("The board blocks the pond path. Splashy steps around it, and a bucket tips into the mud.", "The board lies across the pond path as the bucket spills."),
    page("Muddy stops the building. Each friend names what the bench must allow: shade, a clear path and quiet.", "Muddy holds up three fingers while the others point to the three needs."),
    page("They test the oak, the pond and the stone wall. The oak has shade, but the bench would crowd the path.", "The friends inspect each location with a board and bucket."),
    page("The stone wall is quiet and wide enough. A short path from the oak can bring shade without blocking water.", "Grumpy stands beside the wall while Muddy measures the short path."),
    page("Splashy carries boards along the new path. Muddy builds, and Grumpy chooses the quiet side of the wall.", "Each friend works on a different part of the bench plan."),
    page("The bench faces the pond but leaves the route open. Grumpy sits first, and the others leave space beside him.", "The finished bench faces the pond with a clear path in front."),
    page("Soon the bench holds three friends, three kinds of comfort and one decision they made together.", "Muddy, Grumpy and Splashy sit with visible space between them on the bench.")
  ]),
  C(7, "James and Anna Repair the Kite", "conflict repair, accountability and shared agency", ["HUMAN-JAMES", "HUMAN-ANNA"], "A windy hill with a red kite", "James pulls the kite string while Anna is still holding the frame, tears the kite, and must repair both the kite and the partnership.", [
    page("Anna holds the kite frame while James checks the string. They agree to launch when both hands are clear.", "Anna holds the red kite frame; James checks the string spool."),
    page("A gust lifts the kite early. James pulls hard before Anna lets go, and the paper tears along the frame.", "The kite rises unevenly and tears while Anna still holds its frame."),
    page("Anna drops the frame. James blames the wind, but the loose string and Anna's red mark show what happened.", "The torn kite lies between them; the loose string curls beside it."),
    page("James stops arguing. He names his action: he pulled before checking. Anna says the next launch needs a signal.", "James points to the torn edge while Anna holds up one finger for a signal."),
    page("They smooth the paper and add a strip of cloth under the tear. The repair makes the kite heavier on one side.", "James smooths the paper while Anna places a cloth strip under the tear."),
    page("The first repaired launch tips left. Anna notices the cloth and moves a small tail to balance it.", "The kite leans left while Anna studies the uneven tail."),
    page("James holds the frame this time. Anna tests the string, then gives the agreed signal.", "James holds the frame and Anna checks the string before launching."),
    page("The kite climbs. Both children keep their roles clear, and the repaired edge holds against the wind.", "The red kite rises above the hill with both children working together."),
    page("James offers Anna the spool. Anna offers James the frame. They change roles without changing the agreement.", "The children swap the spool and frame while the kite stays in the air."),
    page("The kite is still marked by the tear, but the launch is stronger for showing exactly how the repair happened.", "The kite flies with the visible cloth patch as the children watch." )
  ]),
  C(8, "The Map That Changed Its Mind", "epistemic humility, revising a belief and collaborative evidence", ["MOON-BURROW", "MOON-PIP", "MOON-LUNA"], "Moonwood, Fog Marsh and Crystal Stream", "Burrow trusts an old map that says the stream ends at the marsh, but new evidence makes the friends redraw the route.", [
    page("Burrow opens an old map. Its inked stream ends at the Fog Marsh, so he marks the marsh as their final stop.", "Burrow spreads an old map on a root while Pip and Luna look over it."),
    page("Pip hears water beyond the reeds. Burrow points to the map and says the sound must be a marsh pool.", "Pip turns toward the reeds while Burrow taps the map's marsh mark."),
    page("Luna circles above the reeds and sees a silver line running past the marsh. The map has no silver line.", "Luna flies above the marsh while a narrow stream glints below."),
    page("Burrow feels certain, then notices the map's torn edge. Part of the route may be missing, not finished.", "Burrow holds the torn map edge beside the unmarked water."),
    page("The friends gather evidence: wet stones, flowing leaves and water that moves away from the marsh.", "Pip points to wet stones while Luna follows a drifting leaf."),
    page("Burrow turns the map over. A faint line on the back joins the old stream to Crystal Stream.", "Burrow turns the map over and discovers a pale route on the back."),
    page("They test the line at each bend. The water and the marks agree, but one bridge is missing from the map.", "The friends compare the map with a broken bridge ahead."),
    page("Burrow draws the bridge in pencil. The map changes because the world gave them better information.", "Burrow adds a small bridge symbol while Pip holds the map flat."),
    page("The new route reaches Crystal Stream. Burrow keeps the old mark and the new evidence side by side.", "The completed map shows the marsh route continuing to Crystal Stream."),
    page("A map can guide a journey without knowing everything. The friends carry it open to change again.", "Burrow folds the updated map while the stream runs behind them.")
  ]),
  C(9, "Nan's Red Scarf", "self-advocacy, repairing exclusion and changing a group routine", ["HUMAN-NAN", "HUMAN-BOB", "HUMAN-FLUFF"], "A winter play yard with a scarf game", "Nan is left out of a fast scarf game because the rules ignore her cold hands, so she names the problem and helps redesign the game.", [
    page("Bob starts a fast scarf game. Nan reaches for the red scarf, but the cold makes her fingers stiff.", "Bob swings the red scarf in a circle while Nan rubs her hands."),
    page("The scarf passes twice before Nan can catch it. Fluff picks it up and drops it at her feet.", "The scarf lies near Nan while Fluff nudges it toward her."),
    page("Nan says she wants to play but needs a warm start. Bob hears the words, yet the game keeps moving.", "Nan holds the scarf and speaks while Bob looks toward the next player."),
    page("Nan steps out of the circle. The game becomes faster, but the empty place makes the circle uneven.", "Nan stands beside the circle while the scarf passes between Bob and Fluff."),
    page("Bob stops the game. Nan explains that a warm turn and a slower first pass would let her join.", "Bob holds the scarf still while Nan shows a slower hand movement."),
    page("They wrap the scarf around Nan's hands for one breath, then place the first pass close to her.", "Nan warms her hands inside the scarf while Bob prepares a gentle pass."),
    page("Fluff learns the new rule too. He waits until Nan's hands are ready before nudging the scarf.", "Fluff waits beside Nan as Bob holds the scarf within easy reach."),
    page("The game begins again. Nan catches the first pass, then sends it to Bob with a clear turn.", "Nan catches the scarf and passes it to Bob."),
    page("The new routine is slower at the start and faster later. Everyone stays in the circle.", "The whole group plays with Nan inside the circle."),
    page("Nan keeps the red scarf nearby. It is part of the game now.", "Nan holds the scarf at the center of the warm, even circle.")
  ]),
  C(10, "The Door Wren Built", "repair after exclusion, shared leadership and restorative action", ["MOON-WREN", "MOON-PIP", "MOON-STONE", "MOON-FERN"], "Moonwood, a new reading nook inside Hollow Oak", "Wren builds a tiny door for her reading nook and leaves Stone outside, then changes the door and the plan so everyone can enter safely.", [
    page("Wren builds a small door beneath Hollow Oak. She wants a quiet reading nook for one careful reader.", "Wren fits a tiny blue door into a root opening while Pip watches."),
    page("Pip slips through first. Fern bends her leaf body and enters, but Stone cannot fit his broad shoulders through.", "Pip and Fern enter while Stone rests one hand beside the tiny door."),
    page("Wren says the nook is finished. Stone steps back, and the roots shake when his heel meets the floor.", "Stone backs away from the door while Wren stands beside the finished nook."),
    page("Pip asks what the nook is for. Wren says reading together, then sees that her door made together impossible.", "Pip points from the tiny door to Stone while Wren looks at the group."),
    page("Stone asks for a safe place where his size will not harm the roots.", "Stone kneels beside the root wall and points to the strong open space outside."),
    page("Fern finds a wide root arch beside the tiny door. It can hold books and leave the small nook quiet inside.", "Fern traces the wide root arch beside Wren's tiny door."),
    page("Wren moves the reading table beneath the arch. Pip carries cushions, and Stone checks the roots with one careful hand.", "The friends carry cushions and a low table under the strong root arch."),
    page("The tiny door remains for one quiet reader. The wide arch becomes the shared reading place.", "The nook has a small door and a separate wide arch with cushions."),
    page("Wren invites Stone to choose the first book. He chooses a picture book about roots and reads the title aloud.", "Stone holds the first book beneath the wide arch while the others gather."),
    page("The door Wren built was not wrong because it was small. It was unfinished because it did not yet include the readers.", "All four friends read together beneath the wide root arch while the tiny door stays open nearby.")
  ])
]);

export const guidedReadingSelBookCounts = Object.freeze({
  A: guidedReadingSelBooksDraft.filter(book => book.level === "A").length,
  B: guidedReadingSelBooksDraft.filter(book => book.level === "B").length,
  C: guidedReadingSelBooksDraft.filter(book => book.level === "C").length,
  total: guidedReadingSelBooksDraft.length
});
