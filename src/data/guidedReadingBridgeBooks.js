const PRINT_PLACEMENT = "Two-line maximum in the same quiet cream panel along the lower edge; art contains no lettering.";

const makePages = (slug, rows, isProcedure = false) => Object.freeze(rows.map((row, index) => {
  const pageNumber = index + 1;
  const text = row[0];
  return Object.freeze({
    pageNumber,
    text,
    pageAudioText: text,
    image: "/guided-reading/willow-street/" + slug + "/page-" + String(pageNumber).padStart(2, "0") + ".webp",
    audio: "/guided-reading/audio/willow-street/" + slug + "/page-" + String(pageNumber).padStart(2, "0") + ".mp3",
    imageBrief: row[1],
    imageAlt: row[1],
    pageDescription: row[1],
    embeddedImageText: "",
    active: true,
    qaStatus: "approved",
    qaNotes: "Final Story Bible manuscript and visual brief approved; final media and exact-current-text narration remain scheduled.",
    narrationNeedsRebuild: true,
    printPlacement: PRINT_PLACEMENT,
    ...(isProcedure ? { procedureStep: pageNumber } : {})
  });
}));

const fictionReview = (storySpine, failedAttempt, resolution, canonIds) => Object.freeze({
  kind: "fiction",
  storySpine,
  failedAttempt,
  resolution,
  canonIds: Object.freeze(canonIds),
  evidence: "Reviewed page by page against Story Bible Part I for goal, causal development, meaningful repetition, repair, and earned resolution."
});

const nonfictionReview = (topicQuestion, progression, synthesis) => Object.freeze({
  kind: "nonfiction",
  topicQuestion,
  progression,
  synthesis,
  evidence: "Reviewed page by page against Story Bible Part I for an accurate sequence, concrete image evidence, child-safe language, and factual synthesis."
});

const makeBook = ({ slug, title, type, bridgeGenre, visualTreatment, cast, repeatedLanguage, coverBrief, storyBibleReview, safetyNote, rows }) => Object.freeze({
  id: "willow-street-" + slug,
  title,
  type,
  level: "C",
  guidedReadingLevel: "C",
  readingBandProfile: "standard",
  readingMode: "predictable-levelled",
  readingPageProfile: "compact-stable",
  collection: "Willow Street Readers",
  seriesId: "willow-street",
  bridgeGenre,
  visualTreatment,
  cast: Object.freeze(cast),
  repeatedLanguage,
  coverImage: "/guided-reading/willow-street/" + slug + "/cover.webp",
  cover: "/guided-reading/willow-street/" + slug + "/cover.webp",
  coverUrl: "/guided-reading/willow-street/" + slug + "/cover.webp",
  coverBrief,
  printPlacement: PRINT_PLACEMENT,
  storyBibleReview,
  ...(safetyNote ? { safetyNote } : {}),
  active: true,
  qaStatus: "approved",
  mediaStatus: "scheduled",
  pages: makePages(slug, rows, bridgeGenre === "procedure")
});

export const GUIDED_READING_BRIDGE_BOOKS = Object.freeze([
  makeBook({
    slug: "the-lunchbox-mix-up",
    title: "The Lunchbox Mix-Up",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-MAYA", "WILLOW-SAMIR"],
    repeatedLanguage: "checks the labels",
    coverBrief: "Illustrated Willow Street school lunch table, Maya holding a yellow lunchbox and Samir holding a green one, both noticing the swapped blue cup and green apple; warm midday light, clear puzzled expressions, no written text.",
    storyBibleReview: fictionReview(
      "Maya and Samir notice their lunches were swapped and use the name labels to return every item.",
      "Guessing by food does not work because both lunches contain familiar shared foods.",
      "They read the labels, exchange the boxes, and sit down with the correct lunches.",
      ["WILLOW-MAYA", "WILLOW-SAMIR"]
    ),
    rows: [
      ["Maya opens her lunchbox and finds Samir's blue cup.", "Illustrated medium view at the school lunch table: Maya, in mustard cardigan and teal trousers, opens her yellow lunchbox; Samir's blue lidded cup is unmistakably inside while Samir sits nearby."],
      ["Maya checks the labels beside each lunchbox.", "Close view of Maya comparing two simple name-label shapes on the yellow and green lunchboxes; keep lettering unreadable, show her finger moving from one label to the other, and preserve the blue cup."],
      ["Samir checks the labels and spots Maya's green apple.", "Samir, in cobalt hoodie and charcoal trousers, points from the green lunchbox label to Maya's green apple inside; Maya watches, with both boxes and the blue cup visible in stable positions."],
      ["They swap the lunchboxes, but one spoon stays behind.", "Overhead three-quarter view as Maya and Samir exchange the two closed lunchboxes; one small silver spoon remains alone on the table between them, creating the next clear problem."],
      ["Maya sees the spoon beside Samir's folded napkin.", "Maya notices the silver spoon resting beside Samir's folded orange napkin; Samir pauses with his blue cup, and the correctly swapped lunchboxes remain by their owners."],
      ["Samir returns the spoon and thanks Maya.", "Samir offers the silver spoon across the lunch table to Maya with a relieved smile; Maya reaches to accept it, while the blue cup and green apple confirm the corrected lunches."],
      ["Now each lunchbox holds the right things.", "Neat overhead view into both open lunchboxes: Maya's green apple and silver spoon together, Samir's blue cup and orange napkin together; the children compare them happily without any printed labels."],
      ["Maya and Samir eat lunch together at last.", "Wide illustrated finish at the bright school lunch table: Maya and Samir eat from their own lunchboxes, relaxed and chatting, with the resolved cup, apple, spoon, and napkin all consistent." ]
    ]
  }),
  makeBook({
    slug: "the-lost-library-book",
    title: "The Lost Library Book",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-ZOE", "WILLOW-LEO"],
    repeatedLanguage: "They look",
    coverBrief: "Illustrated Willow Street Library entrance, Zoe holding an empty blue book bag while Leo studies a trail of dry leaves leading toward the return bench; afternoon light, worried but capable expressions, no readable lettering.",
    storyBibleReview: fictionReview(
      "Zoe and Leo retrace their library visit to find a missing borrowed book.",
      "Looking only on the shelves fails because Zoe left the book near the return bench.",
      "A leaf caught in the bag points them back to the bench, where the librarian has kept the book safe.",
      ["WILLOW-ZOE", "WILLOW-LEO"]
    ),
    rows: [
      ["Zoe's library book is missing from her blue bag.", "Illustrated close medium view inside Willow Street Library: Zoe, with two puff buns and coral jacket, holds open an empty blue book bag; Leo stands beside her, and a clear book-shaped gap is visible."],
      ["They look under the reading table first.", "Low angle beneath the round oak reading table as Zoe and Leo peer under chairs and cushions; the space is clearly empty, with library shelves softly framed behind them."],
      ["They look between the animal books next.", "Front view of Zoe and Leo carefully scanning a child-height shelf marked only by animal picture symbols; Leo separates two books while Zoe checks the gap, with no lost book visible."],
      ["They look beside the window seat too.", "Willow Street Library window nook with green cushion: both children lift the cushion edge and check beside the seat; late-afternoon light shows the place is empty and orderly."],
      ["A dry leaf falls from Zoe's bag.", "Close-up of a crisp brown leaf dropping from Zoe's blue book bag onto the library floor; Zoe notices it while Leo recalls the leafy return bench outside."],
      ["The leaf reminds Leo of the outside bench.", "Leo points through the glass doors toward the oak return bench under a plane tree; Zoe follows his gaze, holding the leaf and blue bag, making the clue visually explicit."],
      ["The librarian found their book on that bench.", "At the library desk, the librarian offers Zoe the familiar green-covered book found on the outside bench; Leo smiles, and the blue bag remains open to receive it."],
      ["Zoe puts the book safely inside her bag.", "Resolved close medium view: Zoe slides the green-covered library book fully into the blue bag and closes its flap; Leo and the librarian watch approvingly in the warm library entrance." ]
    ]
  }),
  makeBook({
    slug: "the-windy-picnic",
    title: "The Windy Picnic",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-MAYA", "WILLOW-ZOE", "WILLOW-LEO"],
    repeatedLanguage: "The wind lifts",
    coverBrief: "Illustrated Willow Street Park picnic, Maya, Zoe, and Leo catching a striped cloth as wind bends the grass and lifts paper napkins; a sheltered hedge and picnic basket suggest the solution, bright breezy daylight, no text.",
    storyBibleReview: fictionReview(
      "Three friends try to start a picnic while gusts keep lifting their light things.",
      "Holding only one corner fails when another gust sends the napkins away.",
      "They move beside the hedge and use safe heavy containers to hold the cloth before eating.",
      ["WILLOW-MAYA", "WILLOW-ZOE", "WILLOW-LEO"]
    ),
    rows: [
      ["The wind lifts one corner of their picnic cloth.", "Wide park view: Maya, Zoe, and Leo kneel around a red-and-cream striped picnic cloth as one corner rises sharply in the breeze; basket stays closed and trees lean consistently."],
      ["Maya holds the cloth, while Zoe opens the basket.", "Maya grips two cloth corners with both hands while Zoe carefully opens the wicker basket; Leo watches loose napkins near the top, and gusting grass shows wind direction."],
      ["The wind lifts three napkins into the air.", "Three plain cream napkins spiral upward from the basket in a single gust; Zoe reaches toward them, Maya still anchors the cloth, and Leo turns to follow their path."],
      ["Leo catches two, but one crosses the path.", "Leo catches two napkins against his yellow rain vest while the third skims across the paved park path; Maya and Zoe remain by the cloth in the background."],
      ["They move beside the tall, quiet hedge.", "The friends carry the folded cloth and closed basket together toward the sheltered side of a tall green hedge; the exposed trees still bend while leaves beside the hedge remain calm."],
      ["Four food boxes hold the cloth corners down.", "Overhead view of the striped cloth spread beside the hedge, with four closed reusable food boxes safely weighting its corners; all three children check that nothing can blow away."],
      ["The napkins stay still beside the basket.", "Close view of the three recovered napkins tucked beneath the basket handle on the secured cloth; Maya points to their still edges as Zoe and Leo smile."],
      ["Now the friends enjoy their calm, windy picnic.", "Wide resolved picnic scene beside the hedge: Maya, Zoe, and Leo share fruit and sandwiches from reusable boxes; the distant treetops move, but their cloth and napkins stay secure." ]
    ]
  }),
  makeBook({
    slug: "the-puddle-plan",
    title: "The Puddle Plan",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-LEO", "WILLOW-SAMIR"],
    repeatedLanguage: "Their plan",
    coverBrief: "Illustrated Willow Street garden path after rain, Leo and Samir studying a broad shallow puddle with two orange cones and a dry curved edge visible; boots, reflections, and determined faces, no lettering.",
    storyBibleReview: fictionReview(
      "Leo and Samir need to reach the garden shed without splashing through a large puddle.",
      "Their first straight route reaches deeper water and must be abandoned.",
      "They test the dry edge, mark it with cones, and guide their friends around safely.",
      ["WILLOW-LEO", "WILLOW-SAMIR"]
    ),
    rows: [
      ["A wide puddle blocks the garden path.", "Illustrated wide view of the Willow Street community garden after rain: a broad shallow puddle spans the main path; Leo and Samir stop in boots before the water, with the shed beyond."],
      ["Their plan starts along the shortest edge.", "Leo points to the near straight edge while Samir holds two small orange cones; ripples and darker mud show this route is wet despite appearing short."],
      ["Leo's boot sinks into soft, sticky mud.", "Close side view of Leo testing one boot at the puddle edge; it presses into soft mud without danger, while Samir stays on firm ground and notices the problem."],
      ["Their plan changes toward the dry stones.", "Samir points to a curved line of pale dry paving stones around the puddle; Leo lifts his muddy boot back onto firm ground, and the orange cones remain ready."],
      ["Samir tests each stone with one careful step.", "Samir takes a careful step along the dry curved stones while Leo watches from firm ground; show stable flat stones, shallow water, and no jumping or risky balancing."],
      ["Leo places cones beside the safe dry way.", "Leo sets the two orange cones on firm ground beside the curved dry route; Samir stands near the shed end, clearly showing the complete safe path around the puddle."],
      ["Their plan guides Maya around the puddle.", "Maya approaches and follows the cone-marked dry stones while Leo gestures along the route and Samir waits ahead; her shoes stay dry and the puddle remains undisturbed."],
      ["Everyone reaches the garden with clean, dry feet.", "Resolved garden view beyond the puddle: Maya, Leo, and Samir stand by the shed with dry shoes except Leo's small muddy boot mark; the safe coned route remains visible behind them." ]
    ]
  }),
  makeBook({
    slug: "the-squeaky-wheel",
    title: "The Squeaky Wheel",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-ZOE", "WILLOW-SAMIR"],
    repeatedLanguage: "The wheel squeaks",
    coverBrief: "Illustrated Willow Street community garden, Zoe and Samir beside a small green handcart with one front wheel marked by motion lines; adult gardener carrying a safe oil bottle approaches, warm daylight, no text or brands.",
    storyBibleReview: fictionReview(
      "Zoe and Samir investigate a squeaking garden cart instead of forcing it.",
      "Pushing harder makes the dry wheel louder and does not solve the cause.",
      "They ask the adult gardener, who oils the axle before they test the quiet cart.",
      ["WILLOW-ZOE", "WILLOW-SAMIR"]
    ),
    rows: [
      ["The wheel squeaks when Zoe pushes the garden cart.", "Illustrated garden path: Zoe pushes an empty low green handcart while its front-left wheel shows gentle squeak motion lines; Samir looks down at the wheel, with no heavy load present."],
      ["Samir checks for stones caught beside the wheel.", "Samir kneels at a safe distance to look around the stopped cart wheel without touching the axle; Zoe holds the handle steady, and the path around the wheel is clear."],
      ["The wheel squeaks louder when they push harder.", "Side view of both children giving the empty cart one careful test push; the same front-left wheel shows stronger motion lines, their faces concerned rather than comic or reckless."],
      ["They stop the cart and ask the gardener.", "Zoe and Samir park the cart flat beside the path and raise a hand to the adult community gardener; the adult approaches with a small plain maintenance bottle kept out of children's reach."],
      ["The gardener puts one drop on the axle.", "Close adult-supervised view: the gardener applies one drop of oil to the metal axle while Zoe and Samir stand back watching; wheel, bottle, and hands are mechanically plausible."],
      ["The gardener turns the wheel several times.", "The adult gardener safely spins the lifted wheel by hand to spread the oil; the cart is stable and empty, while the children observe from beside the handles."],
      ["The wheel rolls quietly along the path.", "Zoe gives the cart a gentle test push as the repaired front-left wheel rolls smoothly without motion marks; Samir listens and gives a pleased thumbs-up."],
      ["Zoe and Samir carry seedlings without a squeak.", "Resolved wide view: Zoe and Samir pull the quiet green cart loaded lightly with seedling trays toward the garden beds; the gardener waves, and the repaired wheel stays visually consistent." ]
    ]
  }),
  makeBook({
    slug: "the-garden-gate",
    title: "The Garden Gate",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-MAYA", "WILLOW-LEO"],
    repeatedLanguage: "The gate",
    coverBrief: "Illustrated Willow Street community garden entrance, Maya and Leo studying a green wooden gate caught above one small grey stone; watering can and flower beds beyond, clear cause visible, fresh morning light, no text.",
    storyBibleReview: fictionReview(
      "Maya and Leo need to open the garden gate and inspect what blocks its swing.",
      "Pulling together fails because a stone is wedged beneath the lower rail.",
      "They close the gate, move the loose stone safely, sweep the grit, and open it freely.",
      ["WILLOW-MAYA", "WILLOW-LEO"]
    ),
    rows: [
      ["The gate stops halfway across the garden path.", "Wide illustrated entrance view: the green wooden garden gate is stuck halfway open; Maya holds it gently while Leo looks along the ground, with one grey stone partly hidden below."],
      ["Maya pulls once, but the gate stays still.", "Maya gives one careful pull at the handle while keeping fingers away from hinges; the gate remains fixed, and Leo watches the lower rail instead of adding force."],
      ["Leo kneels and sees a stone underneath.", "Low close view from the safe latch side: Leo points to a small loose grey stone wedged beneath the gate's bottom rail; Maya steadies the gate and the hinge side stays clear."],
      ["They close the gate before moving the stone.", "Maya gently returns the gate to its closed position while Leo steps back; show the stone now accessible on the path and both children's hands away from the hinge."],
      ["Leo lifts the loose stone with both hands.", "Leo uses both hands to lift the small manageable stone from the path while Maya holds a garden bucket nearby; posture is safe, and the gate remains fully closed."],
      ["Maya sweeps the gritty path beneath the gate.", "Maya uses a child-size brush to sweep loose grit from the gate's swing path into a small pan; Leo places the stone beside the garden border, not on the path."],
      ["The gate swings open without catching now.", "Maya opens the green gate smoothly from the handle while Leo watches the clear lower rail; the swept path and relocated stone make the repair visually understandable."],
      ["They carry the watering can into the garden.", "Resolved morning garden scene: Maya and Leo walk through the fully open gate together carrying one blue watering can between them; flowers, path, and gate details remain consistent." ]
    ]
  }),
  makeBook({
    slug: "nanis-chapati-lunch",
    title: "Nani's Chapati Lunch",
    type: "fiction",
    bridgeGenre: "culture-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-MAYA", "WILLOW-NANI"],
    repeatedLanguage: "Nani folds",
    coverBrief: "Illustrated family kitchen and lunch table, Maya beside her grandmother Nani as round chapatis, cucumber, and lentils are packed into a steel tiffin; the hot pan stays at the adult stove, affectionate everyday realism, no text.",
    storyBibleReview: fictionReview(
      "Maya worries the chapatis will not fit her lunch tin, and Nani shows a familiar folding solution.",
      "Stacking the chapatis flat leaves no room for the lentils and cucumber.",
      "Nani folds each chapati, Maya packs the side dishes, and they share the completed lunch.",
      ["WILLOW-MAYA", "WILLOW-NANI"]
    ),
    rows: [
      ["Nani makes warm chapatis for Maya's family lunch.", "Illustrated family kitchen: Nani, wearing plum kurta and cream apron, cooks one round chapati on a flat tawa at the adult stove while Maya watches from the table; safe distance is clear."],
      ["Maya stacks them inside the round steel tin.", "At the kitchen table away from heat, Maya places a stack of cooked chapatis into the lower round steel tiffin; Nani sets a covered bowl nearby and steam is gentle."],
      ["The flat chapatis leave no room for lentils.", "Overhead view of the open tiffin: flat chapatis fill the lower tier while a small sealed lentil container cannot fit; Maya compares the spaces with a puzzled expression."],
      ["Nani folds one chapati into a neat triangle.", "Close view of Nani's hands folding a cooled round chapati once and then again into a triangle on a clean plate; Maya watches closely, with the hot stove distant."],
      ["Nani folds another, and Maya copies carefully.", "Maya folds a second cooled chapati into the same triangle beside Nani's completed one; their hands and the two shapes are clearly distinct and the table remains tidy."],
      ["The folded chapatis fit beside the lentil pot.", "Overhead tiffin view: folded chapati triangles sit neatly beside the sealed small lentil pot, leaving an exact open space; Maya points to the successful arrangement."],
      ["Maya adds cool cucumber slices to the top.", "Maya places pre-cut cucumber slices into the upper tiffin tier using clean tongs; Nani closes the lower tier, and no child handles knives or the hot pan."],
      ["At lunch, everyone shares Nani's clever packed meal.", "Warm family lunch scene at the Willow Street kitchen table: Maya, Nani, and family members share chapatis, lentils, and cucumber from the open tiffin, with joyful natural interaction and no ceremonial tokenism." ]
    ]
  }),
  makeBook({
    slug: "dumplings-for-new-year",
    title: "Dumplings for New Year",
    type: "fiction",
    bridgeGenre: "culture-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-ZOE", "WILLOW-AUNT-MEI"],
    repeatedLanguage: "Zoe pinches",
    coverBrief: "Illustrated New Year family kitchen, Zoe and Aunt Mei shaping crescent dumplings at a flour-dusted table with red paper decorations high on the wall; adult tends the steaming pot, warm lantern light, no readable characters.",
    storyBibleReview: fictionReview(
      "Zoe learns to seal dumplings for her family's New Year meal.",
      "Her first wrapper holds too much filling and opens on the tray.",
      "She uses less filling, pinches the edge firmly, and adds a sealed dumpling to the shared plate.",
      ["WILLOW-ZOE", "WILLOW-AUNT-MEI"]
    ),
    rows: [
      ["Zoe's family makes dumplings for their New Year meal.", "Illustrated family kitchen: Zoe in coral jacket with sleeves rolled safely joins Aunt Mei at a clean table set with round wrappers and vegetable filling; red decorations hang high without readable writing."],
      ["Aunt Mei places one small spoonful in the middle.", "Close overhead view of Aunt Mei placing a modest spoonful of vegetable filling in the centre of one round wrapper; Zoe watches, and ingredients remain separated in tidy bowls."],
      ["Zoe adds too much, and her wrapper opens.", "Zoe's first wrapper lies open on the tray because a large mound of filling prevents the edges meeting; her expression shows surprise, while Aunt Mei responds calmly."],
      ["Aunt Mei shows a smaller spoonful this time.", "Aunt Mei removes extra filling and demonstrates the smaller amount beside Zoe; show both wrappers for a clear comparison and keep the cooking pot distant with another adult."],
      ["Zoe pinches the curved edge from end to end.", "Close view of Zoe folding the wrapper into a crescent and pinching its curved edge carefully from left to right; filling stays enclosed and Aunt Mei's guiding hand remains nearby."],
      ["Zoe pinches another dumpling without any gaps.", "Zoe holds a second fully sealed crescent dumpling up for Aunt Mei to inspect; the smooth unbroken edge is clearly visible, with several family-made dumplings on the tray."],
      ["An adult cooks the dumplings until they are ready.", "Adult-only cooking view: Aunt Mei lowers dumplings safely into a wide pot while Zoe watches from beyond the counter line; steam, handles turned inward, and supervision are explicit."],
      ["The family shares their dumplings around one bright table.", "Celebratory but everyday family meal: Zoe and relatives share cooked dumplings at one bright table with red decorations and oranges; warm connection, culturally grounded details, and no readable symbols." ]
    ]
  }),
  makeBook({
    slug: "drums-for-carnival",
    title: "Drums for Carnival",
    type: "fiction",
    bridgeGenre: "culture-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-LEO", "WILLOW-MR-BAPTISTE"],
    repeatedLanguage: "Leo plays",
    coverBrief: "Illustrated Willow Street community hall rehearsal, Leo with a small hand drum beside bandleader Mr Baptiste and a mixed-age percussion group; colourful fabric banners, instruments correctly held, lively but controlled motion, no logos or text.",
    storyBibleReview: fictionReview(
      "Leo wants to join a community Carnival rehearsal and must learn where his drum part fits.",
      "Playing continuously covers the leader's call and breaks the group's pattern.",
      "Leo listens for the call, plays the answering beat, and marches with the group.",
      ["WILLOW-LEO", "WILLOW-MR-BAPTISTE"]
    ),
    rows: [
      ["Leo brings his small drum to Carnival practice.", "Illustrated community hall: Leo, in yellow rain vest over striped shirt, enters carrying a child-size hand drum; Mr Baptiste and a mixed-age neighbourhood percussion group prepare beneath colourful fabric banners."],
      ["Mr Baptiste plays a call for everyone.", "Bandleader Mr Baptiste raises one hand and plays a short call on a barrel drum; the circle watches attentively, instruments held correctly, with Leo ready but not yet playing."],
      ["Leo plays all through the answering beat.", "Leo enthusiastically continues drumming while the group begins its answer; overlapping motion lines and concerned listening faces show the rhythm has become crowded without shaming him."],
      ["The group stops, and Leo listens again.", "The whole percussion circle becomes still as Mr Baptiste calmly repeats the call with a hand cue; Leo lowers his sticks and leans forward to listen closely."],
      ["Leo plays only when the answering beat begins.", "Mr Baptiste finishes the call and points to the group; Leo joins exactly as the answering beat starts, matching the neighbours' hand drums in coordinated motion."],
      ["Leo plays softly, then strongly, with the group.", "The percussion group follows two visible hand cues: a small low hand for soft playing and raised open hand for strong playing; Leo mirrors both dynamics attentively."],
      ["Their shared rhythm fills the community hall.", "Wide hall view: Leo, Mr Baptiste, and the full community group sustain one coordinated rhythm; families watch beside bright banners, with joyful expressions and mechanically plausible instruments."],
      ["Leo marches outside, keeping his part steady.", "Resolved daylight procession outside the community hall: Leo marches safely within the supervised group, keeping his small drum beat steady beneath colourful fabric streamers, with neighbours lining the pedestrian square." ]
    ]
  }),
  makeBook({
    slug: "eid-morning-with-samir",
    title: "Eid Morning with Samir",
    type: "fiction",
    bridgeGenre: "culture-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-SAMIR", "WILLOW-MAYA"],
    repeatedLanguage: "Samir's family",
    coverBrief: "Illustrated Eid morning outside Willow Street community hall, Samir in a cream kurta beside his family and Maya, carrying a covered food parcel and greeting neighbours; crescent bunting, fresh morning light, respectful everyday detail, no text.",
    storyBibleReview: fictionReview(
      "Samir prepares for an Eid morning gathering while waiting for Maya to arrive.",
      "He worries when she is delayed and cannot see her in the busy entrance.",
      "Samir helps with the family food parcel, then finds Maya at the welcome table and celebrates together.",
      ["WILLOW-SAMIR", "WILLOW-MAYA"]
    ),
    rows: [
      ["Samir's family dresses early for Eid morning.", "Illustrated home hallway in early light: Samir wears a cream kurta and blue waistcoat while family members finish shoes and scarves; a small crescent garland is visible, with natural varied clothing."],
      ["Samir's family walks together to morning prayers.", "Willow Street morning scene: Samir and family walk along the pavement toward the community hall prayer gathering, carrying folded prayer mats; respectful distance, safe crossing, and no readable signs."],
      ["After prayers, neighbours greet one another warmly.", "Outside the hall after prayers, Samir's family exchanges smiles, handshakes, and friendly greetings with neighbours of different ages; prayer mats are rolled and morning light remains consistent."],
      ["Samir looks for Maya beside the busy doorway.", "Samir scans the busy but orderly hall entrance for Maya; his family stays close, neighbours pass with food containers, and the welcome table is partly visible beyond the doorway."],
      ["His family carries a food parcel to share.", "Samir helps an adult family member carry one sealed food parcel toward the community welcome table; show shared responsibility, safe two-handed carrying, and several other donated parcels."],
      ["Maya waits there with dates and bright napkins.", "At the welcome table, Maya in mustard cardigan arranges a bowl of dates and bright folded napkins with an adult volunteer; Samir spots her and smiles with clear relief."],
      ["Samir and Maya share sweet dates together.", "Samir and Maya sit with family members and each hold one date from the shared bowl; water cups and the sealed food parcel remain visible, creating a calm communal moment."],
      ["Then everyone joins the joyful Eid breakfast.", "Wide resolved community breakfast: Samir, Maya, their families, and neighbours share varied dishes at long tables beneath crescent bunting; warm inclusive gathering, concrete cultural setting, no token poses." ]
    ]
  }),
  makeBook({
    slug: "grow-a-bean-in-a-jar",
    title: "Grow a Bean in a Jar",
    type: "nonfiction",
    bridgeGenre: "procedure",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-MAYA"],
    repeatedLanguage: "the bean",
    safetyNote: "Wash hands after handling soil; an adult helps transfer the sprouted bean and keeps the glass jar safe.",
    coverBrief: "Illustrated Willow Street kitchen windowsill, Maya observing a clear sturdy jar with one bean, damp paper, white roots, and green shoot; adult nearby for glass safety, bright indirect daylight, no labels or text.",
    storyBibleReview: nonfictionReview(
      "How can a child safely observe a bean begin to grow?",
      "Gather, dampen, place, position, maintain, observe, and transfer in complete chronological order.",
      "Water and warmth let the seed open, root, and shoot before careful planting in soil."
    ),
    rows: [
      ["Ask an adult for a clear jar and bean.", "Illustrated materials view on a low kitchen table: Maya stands beside an adult with one sturdy clear jar, one dry bean, paper towel, and water cup arranged separately; no glass handling alone."],
      ["Fold paper towel and place it inside.", "Close view of Maya folding clean paper towel and sliding it into the empty jar while the adult steadies the base; all materials match page one and the bean remains outside."],
      ["Add water until the paper feels damp.", "Maya pours a small measured amount of water from a child-safe cup into the jar; adult steadies it, paper darkens evenly, and no standing pool forms at the bottom."],
      ["Slide the bean between paper and glass.", "Detailed side view of the adult helping Maya slide the bean between damp paper and the inside wall of the clear jar, keeping the bean fully visible for observation."],
      ["Stand the jar in warm, indirect light.", "The jar sits securely on the Willow Street kitchen windowsill away from the edge; bright indirect light reaches it through a sheer curtain, while Maya checks its stable position."],
      ["Check the paper daily and keep it damp.", "Maya touches the top paper with one clean finger while an adult holds a small water dropper nearby; a simple day-to-day sequence is suggested without clocks or written labels."],
      ["The bean grows a root, then a shoot.", "Scientific close view through the jar: the bean coat has opened, one white root points downward, and one pale green shoot curves upward; Maya observes with a magnifier."],
      ["Plant the sprouted bean gently with adult help.", "In the community garden, Maya and an adult tip the rooted bean gently into a small soil pot, root downward and shoot above soil; jar is set safely aside and hands remain careful." ]
    ]
  }),
  makeBook({
    slug: "make-a-paper-kite",
    title: "Make a Paper Kite",
    type: "nonfiction",
    bridgeGenre: "procedure",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-SAMIR"],
    repeatedLanguage: "the kite",
    safetyNote: "An adult uses scissors and helps fly the kite in open ground, far from roads, trees, and power lines.",
    coverBrief: "Illustrated Willow Street Park, Samir flying a simple blue diamond paper kite with crossed lightweight sticks and ribbon tail in a broad open field; adult beside him, distant trees and roads, no wires or text.",
    storyBibleReview: nonfictionReview(
      "How can a child make and safely fly a simple paper kite?",
      "Shape paper, attach supports, add tail and line, inspect, then choose a safe open flying place.",
      "A balanced frame, secure tail, and open windy space help the kite lift safely."
    ),
    rows: [
      ["Ask an adult to cut a paper diamond.", "Illustrated craft table: an adult cuts thick blue paper into a broad diamond while Samir watches from the other side; scissors stay in adult hands, with ruler, tape, and sticks arranged clearly."],
      ["Lay two light sticks across the diamond.", "Overhead view of Samir placing one long and one short lightweight stick in a cross on the blue paper diamond; their meeting point is centred and scissors are absent."],
      ["Tape both sticks firmly to the paper.", "Samir presses four short tape strips over the stick ends and one at the crossing; the diamond stays flat, supports remain straight, and adult supervision is visible."],
      ["Tie a ribbon tail to the bottom.", "Close view of the adult helping Samir tie a long soft ribbon tail through a reinforced hole at the kite's bottom point; frame and blue paper remain unchanged."],
      ["Add the flying line at the centre.", "Adult hands attach the kite string securely around the crossed sticks at the centre while Samir holds the spool; show a simple safe knot and no string around fingers."],
      ["Check the kite's tape, tail, and line together.", "Samir and the adult inspect every connection before leaving: tape strips flat, ribbon tail secure, flying line centred, paper unbroken; present all checks in one uncluttered view."],
      ["Choose open ground, far from roads and wires.", "Wide Willow Street Park field with Samir and adult selecting open grass; roads, trees, and any utility lines are far beyond the flying area, under moderate wind."],
      ["Face the breeze and let the kite rise.", "Samir faces the breeze while the adult stands beside him; the blue diamond kite rises on a controlled line, ribbon tail streaming steadily, with safe open space in every direction." ]
    ]
  }),
  makeBook({
    slug: "build-a-cardboard-ramp",
    title: "Build a Cardboard Ramp",
    type: "nonfiction",
    bridgeGenre: "procedure",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-LEO"],
    repeatedLanguage: "the ramp",
    safetyNote: "An adult handles any cutting; build the ramp low on the floor and use it only for small toys, never for climbing.",
    coverBrief: "Illustrated Willow Street playroom floor, Leo rolling a small red toy car down a low cardboard ramp supported by two broad books; adult nearby, taped edges and clear landing space, no child climbing, no text.",
    storyBibleReview: nonfictionReview(
      "How can a child build and test a safe low ramp for toy cars?",
      "Choose materials, make a low support, secure the slope, clear the path, test, compare, and restore safely.",
      "Changing the ramp height changes the toy car's motion while the structure stays low and stable."
    ),
    rows: [
      ["Ask an adult for strong, flat cardboard.", "Illustrated playroom floor materials: Leo and an adult examine one stiff rectangular cardboard piece, two broad books, paper tape, and a small toy car; no blades or loose staples."],
      ["Stack two wide books on the floor.", "Leo places two broad closed books in a stable low stack on a clear rug; the adult checks that their edges align and the cardboard waits flat nearby."],
      ["Rest the cardboard across the book stack.", "Side view of Leo placing one end of the cardboard on the low book stack and the other on the floor, forming a gentle slope with full-width support."],
      ["Tape the ramp so it cannot slide.", "The adult helps Leo add paper tape where cardboard meets the books and floor; show broad secure strips, level supports, and no fingers beneath the ramp."],
      ["Clear toys away from the landing space.", "Leo moves blocks and figures out of the wide floor area beyond the ramp; adult points to the now-clear landing path, with the red toy car waiting at the top."],
      ["Release one toy car from the top.", "Leo places the red toy car at the ramp top and releases it without pushing; side angle shows the full slope and clear landing space as the car begins rolling."],
      ["Try one more book beneath the ramp.", "With adult help, Leo adds one broad book to make a slightly higher but still low stable stack; tape is replaced securely and both versions are visually comparable."],
      ["Compare how far the toy car rolls now.", "Overhead finish shows the red car's first and second stopping places marked by two removable wooden counters; Leo compares distances while the safe ramp stays fixed and uncluttered." ]
    ]
  }),
  makeBook({
    slug: "make-fruit-and-yoghurt-cups",
    title: "Make Fruit and Yoghurt Cups",
    type: "nonfiction",
    bridgeGenre: "procedure",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-ZOE"],
    repeatedLanguage: "each cup",
    safetyNote: "Wash hands and fruit; an adult cuts firm fruit, checks allergies, and keeps yoghurt cold until serving.",
    coverBrief: "Illustrated Willow Street kitchen table, Zoe and an adult displaying four clear reusable cups layered with plain yoghurt, berries, banana, and oats; knife remains at adult counter, cold ingredients and clean hands emphasized, no text.",
    storyBibleReview: nonfictionReview(
      "How can a child assemble safe fruit and yoghurt cups?",
      "Clean, adult-cut, portion, layer, finish, cover, chill, and serve in food-safe order.",
      "Clean cold ingredients become an even layered snack when each cup receives the same safe steps."
    ),
    rows: [
      ["Wash your hands and rinse the fruit.", "Illustrated kitchen sink: Zoe washes soapy hands while an adult rinses berries and banana nearby; clean towel, colander, and uncluttered food-safe surfaces are clearly shown."],
      ["Ask an adult to cut the banana.", "At the adult-height counter, the adult slices peeled banana on a board while Zoe waits at the table; knife remains firmly in adult hands and berries stay whole."],
      ["Spoon plain yoghurt into each cup.", "Overhead table view: Zoe uses one clean spoon to place equal plain yoghurt portions into four clear reusable cups; adult supervises and fruit bowls remain separate."],
      ["Add banana and berries to each cup.", "Zoe adds visible banana slices and mixed berries evenly to each of the four cups; show matching first fruit layers and keep her hands away from cutting tools."],
      ["Spoon another yoghurt layer over the fruit.", "Side view through the clear cups as Zoe adds a second plain yoghurt layer that partly covers the fruit; all four cups show the same tidy sequence."],
      ["Sprinkle oats across the top of each cup.", "Zoe uses a small spoon to sprinkle a light oat layer over every cup; adult checks a plain allergy-information card kept unreadable, with no branded packaging."],
      ["Cover and chill each cup until snack time.", "The adult and Zoe place snug reusable lids on the four cups, then set them together on a refrigerator shelf; cold storage is clear and cups stay upright."],
      ["Serve the cold cups with clean spoons.", "Resolved kitchen table: Zoe serves the four chilled fruit-and-yoghurt cups with clean spoons to family members; bright fruit layers remain visible and uneaten cups stay cold." ]
    ]
  }),
  makeBook({
    slug: "from-wheat-to-bread",
    title: "From Wheat to Bread",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "willow-street-photorealistic",
    cast: [],
    repeatedLanguage: "The grain",
    coverBrief: "Photorealistic editorial still life connecting ripe wheat heads, a bowl of whole grain, pale flour, risen dough, and one unbranded crusty loaf; soft natural side light, accurate scale and textures, no people or text.",
    storyBibleReview: nonfictionReview(
      "How does grain from a wheat field become bread?",
      "Ripening, harvesting, separating, milling, mixing, rising, baking, and cooling follow real production order.",
      "Wheat grain is milled into flour, then dough changes through yeast activity and oven heat into bread."
    ),
    rows: [
      ["Wheat plants grow tall, with grain inside each head.", "Photorealistic close field view at child eye level: ripe golden wheat heads on intact stalks, several kernels visibly enclosed in one naturally opened head, soft morning light, accurate botany."],
      ["A harvester cuts wheat and gathers the grain.", "Photorealistic wide farm view of a modern combine harvesting ripe wheat, cut stems behind and grain tank visible; safe distant camera, no logos, no child near machinery."],
      ["The grain is cleaned before it reaches the mill.", "Photorealistic industrial food-process close view: whole wheat kernels moving across clean sieves that remove bits of straw and dust; stainless equipment, accurate scale, neutral lighting, no brand marks."],
      ["The grain is ground into soft, pale flour.", "Photorealistic mill detail showing wheat kernels entering rollers and pale flour collecting below in a food-safe bin; mechanical guards in place, no airborne dust cloud or unsafe access."],
      ["Bakers mix flour, water, yeast, and salt.", "Photorealistic bakery workbench: measured flour, water, yeast, and salt being combined in one large bowl by adult baker hands; exact ingredients visible, clean surface, no labels."],
      ["The dough rests, while yeast makes it rise.", "Photorealistic before-and-after bakery scene: the same covered dough bowl shown small and then visibly expanded after resting; warm even light, plausible texture, no magical inflation."],
      ["Oven heat bakes the risen dough into bread.", "Photorealistic adult bakery oven view through closed glass: shaped risen loaves browning on trays as heat sets crust; protected hands outside frame, mechanically plausible commercial oven."],
      ["The bread cools before people slice and share it.", "Photorealistic final bakery rack: golden loaves cooling with visible airflow space; one fully cooled loaf sliced on a separate board by adult hands, natural crumb and crust, no branding." ]
    ]
  }),
  makeBook({
    slug: "where-rainwater-goes",
    title: "Where Rainwater Goes",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "willow-street-photorealistic",
    cast: [],
    repeatedLanguage: "Some rainwater",
    coverBrief: "Photorealistic Willow Street after rain, droplets falling across roof, rain garden, pavement drain, and a small stream visible in one coherent landscape; overcast daylight, realistic water flow, no flooding drama, signs, or text.",
    storyBibleReview: nonfictionReview(
      "Where can rainwater travel after it reaches the ground?",
      "Roof runoff, soil soaking, street drainage, streams, rivers, sea, and evaporation show branching connected pathways.",
      "Rainwater may soak into ground or flow downhill, eventually rejoining waterways and the atmosphere."
    ),
    rows: [
      ["Rain falls onto roofs, gardens, roads, and rivers.", "Photorealistic neighbourhood landscape during moderate rain: droplets visibly reach tiled roofs, planted garden soil, wet road, and a small river in the distance; safe normal weather, no storm damage."],
      ["Some rainwater soaks slowly into loose garden soil.", "Photorealistic macro view of rain soaking into dark crumbly garden soil around plant roots, with fewer surface puddles; realistic pore texture and diffuse overcast light."],
      ["Some rainwater runs downhill across hard pavement.", "Photorealistic low-angle view of shallow rainwater following the slope of an unbranded pavement toward the curb; flow direction visible through tiny leaves, no dangerous flood depth."],
      ["Roof gutters carry water into pipes or water butts.", "Photorealistic house detail: clean roof gutter channels rain into a downpipe that branches to a covered rain barrel, with overflow continuing safely toward drainage; accurate fittings, no labels."],
      ["Street drains guide water away from busy roads.", "Photorealistic curb drain receiving a thin sheet of road runoff while vehicles remain distant; grate openings, curb slope, and water direction mechanically plausible, with no person entering the road."],
      ["Small streams join wider rivers moving toward the sea.", "Photorealistic aerial-oblique landscape where two narrow streams visibly meet a broader river winding toward a coastal horizon; natural banks, accurate scale, clear connected flow."],
      ["Sunlight warms water, and some rises as vapour.", "Photorealistic calm reservoir after rain under returning sunlight; subtle atmospheric haze rises from the surface without cartoon arrows, with warm light glinting on realistic water."],
      ["Cooling vapour forms clouds that can bring more rain.", "Photorealistic wide sky and landscape: moist air has formed layered rain clouds above the same river basin, with a distant gentle rain shaft completing the cycle plausibly." ]
    ]
  }),
  makeBook({
    slug: "inside-a-fire-station",
    title: "Inside a Fire Station",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "willow-street-photorealistic",
    cast: [],
    repeatedLanguage: "Firefighters",
    coverBrief: "Photorealistic wide interior of an unbranded community fire station apparatus bay, diverse firefighters beside a clean fire engine, protective clothing arranged on racks and tools secured; balanced daylight, realistic proportions, no emergency spectacle or text.",
    storyBibleReview: nonfictionReview(
      "What work happens inside a fire station before, during, and after a call?",
      "Readiness, dispatch, protective gear, travel, emergency work, return, equipment care, and training show the complete duty cycle.",
      "Firefighters prepare, respond as a trained team, maintain equipment, and practise for future emergencies."
    ),
    rows: [
      ["Firefighters check their engine, tools, and safety gear.", "Photorealistic station bay at shift start: two firefighters inspect hose couplings, breathing apparatus, and engine compartments; all equipment secured, uniforms unbranded, calm professional daylight."],
      ["A dispatcher sends details when someone needs help.", "Photorealistic communications desk inside the station: adult firefighter receives an alert on a screen shown without readable private details, then points to a wall map with no legible addresses."],
      ["Firefighters pull on protective clothing before they leave.", "Photorealistic gear area: firefighters put on boots, trousers, jackets, helmets, gloves, and breathing equipment in correct sequence; no exposed flames, complete protective kit, realistic adult anatomy."],
      ["The engine carries people, water, hoses, and tools.", "Photorealistic open-side equipment view of the parked fire engine: hose reels, water controls, ladders, hand tools, and crew seats clearly organised; no brands or misleading loose equipment."],
      ["At emergencies, firefighters work together under one leader.", "Photorealistic safe training-ground response: a crew follows one officer's hand signal while positioning a hose line toward a controlled practice target; full gear, no identifiable casualty."],
      ["They may stop fires, rescue people, or give first aid.", "Photorealistic three-part station display using separate real training photographs: hose practice, ladder rescue dummy, and first-aid mannequin; dignified non-graphic scenes with accurate equipment."],
      ["Back at the station, every tool is cleaned and checked.", "Photorealistic return-to-station scene: firefighters wash hose, inspect breathing apparatus, and replace tools in labelled-by-shape compartments without readable words; wet floor managed safely."],
      ["Firefighters train often, ready for the next call.", "Photorealistic station drill yard: crew practise carrying a ladder and communicating together under instructor supervision; engine waits in bay, bright daylight, calm readiness rather than alarm." ]
    ]
  }),
  makeBook({
    slug: "how-paper-is-recycled",
    title: "How Paper Is Recycled",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "willow-street-photorealistic",
    cast: [],
    repeatedLanguage: "The paper",
    coverBrief: "Photorealistic recycling sequence still life: used clean paper, sorted bales, wet pulp, a new paper roll, and finished plain notebooks arranged left to right; cool industrial daylight, realistic fibres, no logos or printed text.",
    storyBibleReview: nonfictionReview(
      "How can used paper become new paper?",
      "Collection, sorting, pulping, screening, cleaning, pressing, drying, and remanufacture follow a factual mill sequence.",
      "Water separates paper into fibres, which are cleaned, flattened, dried, and made useful again."
    ),
    rows: [
      ["Clean used paper is collected for recycling.", "Photorealistic community recycling point: plain newspapers without legible print, office paper, and cardboard enter a paper-only bin; clean dry materials, adult hands, no food or plastic contamination."],
      ["Workers sort the paper and remove wrong materials.", "Photorealistic sorting conveyor: trained adult workers and mechanical separators remove plastic film and metal objects from mixed paper; guarded machinery, realistic protective equipment, no brand marks."],
      ["The paper mixes with water to make wet pulp.", "Photorealistic mill pulper seen through a safe viewing panel: paper and water form a thick fibrous slurry under mechanical mixing; accurate vessel, guards, and neutral industrial light."],
      ["Screens catch staples, tape, and larger unwanted pieces.", "Photorealistic close process view of wet pulp passing through metal screens while staples and tape fragments collect separately; fibre slurry texture and scale are technically plausible."],
      ["The pulp is cleaned before making new sheets.", "Photorealistic mill cleaning stage: pale pulp flows through covered pipes and tanks designed to remove inks and tiny dirt; sample jars show cleaner fibres without impossible pure whiteness."],
      ["Rollers press water from the thin pulp layer.", "Photorealistic paper machine: an even wet fibre mat travels between broad press rollers as water drains below; safety guards in place, no worker near moving parts."],
      ["Heated rollers dry the long sheet of paper.", "Photorealistic guarded drying section where the continuous paper web passes over large heated cylinders and becomes smooth and dry; realistic tension, scale, and warm industrial light."],
      ["The new paper becomes boxes, notebooks, and more.", "Photorealistic final table with unbranded cardboard boxes, plain notebooks, paper bags, and a large recycled paper roll; fibre colour remains naturally off-white, no labels or claims printed." ]
    ]
  }),
  makeBook({
    slug: "a-snail-comes-out-at-night",
    title: "A Snail Comes Out at Night",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "willow-street-photorealistic",
    cast: [],
    repeatedLanguage: "The snail",
    coverBrief: "Photorealistic garden snail emerging on a damp leaf at blue hour, spiral shell intact, two upper eye tentacles and two shorter lower tentacles visible, natural slime trail and soft moonlit ambience, anatomically accurate, no text.",
    storyBibleReview: nonfictionReview(
      "What does a garden snail do during a damp night?",
      "Day shelter, night emergence, sensing, movement, feeding, protection, moisture needs, and dawn shelter form a natural behaviour sequence.",
      "Cool damp nights help the snail move, feed, and avoid drying before it returns to shelter."
    ),
    rows: [
      ["By day, the snail rests in a cool shelter.", "Photorealistic daytime macro beneath a low garden stone: one garden snail rests withdrawn in shade on damp soil, shell opening protected, natural scale and no staged human objects."],
      ["After dusk, damp air helps the snail emerge.", "Photorealistic blue-hour macro: the same shell and markings as page one, with the snail's body slowly extending onto a wet leaf as fine moisture beads collect nearby."],
      ["The snail's tentacles feel and smell its surroundings.", "Anatomically accurate photorealistic head close-up: two long upper tentacles and two shorter lower tentacles extended toward a leaf edge, with natural skin texture and shallow depth of field."],
      ["Tiny eyes sit at the longer tentacles' tips.", "Extreme but plausible macro of the snail's two upper tentacles showing dark eye spots at their tips; lower sensory tentacles remain visible, with no enlarged fantasy eyes."],
      ["The snail glides on one strong, muscular foot.", "Photorealistic low side view through glass-like wet leaf surface: broad muscular foot makes wave-like contact while the shell rides steadily above, anatomically correct and not floating."],
      ["A thin slime trail reduces rubbing as it moves.", "Photorealistic moonlit macro behind the moving snail: a narrow glistening mucus trail follows the foot across a rough leaf, showing how the moist layer separates body from surface."],
      ["The snail scrapes soft plants and decaying leaves.", "Photorealistic feeding close-up: the snail's mouth meets the softened edge of a decaying leaf with tiny scrape marks visible; no oversized teeth, damaged crop, or harmful bait."],
      ["Before warm daylight, the snail hides from drying air.", "Photorealistic dawn scene: the same snail moves beneath dense low leaves as the sky brightens; moist shade remains under foliage while exposed ground begins to dry." ]
    ]
  }),
  makeBook({
    slug: "how-a-book-is-made",
    title: "How a Book Is Made",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "willow-street-photorealistic",
    cast: [],
    repeatedLanguage: "The book",
    coverBrief: "Photorealistic publishing worktable linking handwritten story notes, thumbnail sketches, page proofs, folded printed sections, thread binding, plain cover, and finished unbranded picture book; neutral studio light, no readable manuscript text.",
    storyBibleReview: nonfictionReview(
      "How do people's ideas become a finished printed book?",
      "Writing, editing, illustration, design, printing, folding, binding, and distribution show collaborative production order.",
      "Many specialised steps combine words, pictures, paper, ink, and binding into books readers can use."
    ),
    rows: [
      ["An author writes and revises the book's words.", "Photorealistic adult author's desk: hands revise a printed manuscript with marks kept unreadable, beside notes and a laptop showing blurred lines; natural daylight, no identifiable person or brand."],
      ["An editor helps make the meaning clear.", "Photorealistic collaborative desk: editor and author point to the same page proof, discussing one marked paragraph with all text deliberately illegible; respectful professional setting, no logos."],
      ["An illustrator creates pictures for each page.", "Photorealistic artist workspace: adult illustrator paints an original simple woodland scene on paper while eight small thumbnail boxes suggest page planning; tools realistic, art not copying any named style."],
      ["A designer places words and pictures together.", "Photorealistic design monitor and print proofs: adult designer aligns blank text blocks and original illustrations within page margins; interface details unreadable, page order visible through numbered shape tabs only."],
      ["Printing machines press ink onto large paper sheets.", "Photorealistic guarded printing press running large sheets with repeated page layouts; cyan, magenta, yellow, and black units visible, no worker touching moving parts or readable publication content."],
      ["The printed sheets are folded into page groups.", "Photorealistic bindery line: large printed sheets fold into neat multi-page sections, with one section opened to show correct page sequence; guarded rollers and realistic paper grain."],
      ["The book's page groups are bound inside a cover.", "Photorealistic binding close-up: folded sections sewn or glued at the spine, then placed into a plain sturdy cover by adult hands; adhesive controlled and book anatomy mechanically plausible."],
      ["Finished books travel to libraries, shops, and readers.", "Photorealistic final distribution scene: plain cartons of finished books move from bindery trolley toward a library shelf and bookshop delivery area; one child reads with an adult, no brands or text." ]
    ]
  })
]);
