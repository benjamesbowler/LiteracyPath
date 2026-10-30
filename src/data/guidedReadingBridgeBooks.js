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
    imageAlt: row[2] || row[1],
    pageDescription: row[2] || row[1],
    embeddedImageText: "",
    active: true,
    qaStatus: "approved",
    qaNotes: "Final Story Bible manuscript, page-specific visual media, and exact-current-text narration are installed; direct human listening is tracked separately.",
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

const makeBook = ({ slug, title, type, bridgeGenre, visualTreatment, mediaLicense, cast, repeatedLanguage, coverBrief, storyBibleReview, safetyNote, rows }) => Object.freeze({
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
  ...(mediaLicense ? { mediaLicense } : {}),
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
      "They read the labels, return the mixed-up things to their owners, and sit down with the correct lunches.",
      ["WILLOW-MAYA", "WILLOW-SAMIR"]
    ),
    rows: [
      ["Maya opens her lunchbox and finds Samir's blue cup.", "At the school oak table, Maya opens her yellow lunchbox with Samir's blue lidded cup inside; Samir's open green box contains Maya's green apple. The silver spoon lies beside Samir's folded orange napkin between them. Each box stays with its owner."],
      ["Maya checks the labels on both lunchboxes.", "Maya compares blank cream label patches on both open lunchbox lids. The blue cup stays inside her yellow box and the green apple inside Samir's green box; spoon and orange napkin stay together on the table. No readable lettering."],
      ["Samir checks the labels and spots Maya's green apple.", "Samir points from the blank label on his open green box to Maya's green apple inside. Maya's open yellow box still contains the blue cup. Spoon and orange napkin remain on the table between them."],
      ["They swap the things, but one spoon stays behind.", "Maya hands the blue cup to Samir while he hands her the green apple. Their open empty yellow and green lunchboxes stay in front of their respective owners. The silver spoon remains on the table beside Samir's folded orange napkin; no duplicate contents."],
      ["Maya sees the spoon beside Samir's folded napkin.", "Maya notices the silver spoon resting beside Samir's folded orange napkin; Samir pauses with his blue cup, and the yellow and green lunchboxes remain by their owners with the contents corrected."],
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
      "Searching under the table, between books and beside the window seat does not find the missing book.",
      "A leaf caught in the bag points them back to the bench, where the librarian has kept the book safe.",
      ["WILLOW-ZOE", "WILLOW-LEO"]
    ),
    rows: [
      ["Zoe's library book is missing from her blue bag.", "Illustrated close medium view inside Willow Street Library: Zoe, with two puff buns and coral jacket, holds open an empty blue book bag; Leo stands beside her, and a clear book-shaped gap is visible."],
      ["Zoe and Leo look under the reading table first.", "Low angle beneath the round oak reading table as Zoe and Leo peer under chairs and cushions; the space is clearly empty, with library shelves softly framed behind them."],
      ["They look between the animal books next.", "Front view of Zoe and Leo carefully scanning a child-height shelf marked only by animal picture symbols; Leo separates two books while Zoe checks the gap, with no lost book visible."],
      ["They look beside the window seat too.", "Willow Street Library window nook with green cushion: both children lift the cushion edge and check beside the seat; late-afternoon light shows the place is empty and orderly."],
      ["A dry leaf falls from Zoe's bag.", "Close-up of a crisp brown leaf dropping from Zoe's blue book bag onto the library floor; Zoe notices it while Leo recalls the leafy return bench outside."],
      ["Leo remembers the bench. They ask the librarian.", "Leo points through the glass doors toward the oak return bench under a plane tree; Zoe follows his gaze, holding the leaf and blue bag, making the clue visually explicit."],
      ["“I found it there!” She hands Zoe her book.", "At the library desk, the librarian offers Zoe the familiar green-covered book found on the outside bench; Leo smiles, and the blue bag remains open to receive it."],
      ["Zoe closes the bag with her book inside.", "Resolved close medium view: Zoe slides the green-covered library book fully into the blue bag and closes its flap; Leo and the librarian watch approvingly in the warm library entrance." ]
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
      ["Leo catches two napkins, then chases the last one.", "Leo catches two napkins against his yellow rain vest while the third skims across the paved park path; Maya and Zoe remain by the cloth in the background."],
      ["With all three napkins, they move behind the hedge.", "The friends carry the folded cloth and closed basket together toward the sheltered side of a tall green hedge; the exposed trees still bend while leaves beside the hedge remain calm."],
      ["Four food boxes hold the cloth corners down.", "Overhead view of the striped cloth spread beside the hedge, with four closed reusable food boxes safely weighting its corners; all three children check that nothing can blow away."],
      ["The napkins stay still beside the basket.", "Close view of the three recovered napkins tucked beneath the basket handle on the secured cloth; Maya points to their still edges as Zoe and Leo smile."],
      ["Now Maya can eat without holding the cloth!", "Wide resolved picnic scene beside the hedge: Maya, Zoe, and Leo share fruit and sandwiches from reusable boxes; the distant treetops move, but their cloth and napkins stay secure." ]
    ]
  }),
  makeBook({
    slug: "the-puddle-plan",
    title: "The Puddle Plan",
    type: "fiction",
    bridgeGenre: "everyday-fiction",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-LEO", "WILLOW-SAMIR"],
    repeatedLanguage: "the stones",
    coverBrief: "Illustrated Willow Street garden path after rain, Leo and Samir studying a broad shallow puddle with two orange cones and a dry curved edge visible; boots, reflections, and determined faces, no lettering.",
    storyBibleReview: fictionReview(
      "Leo and Samir need a dry way past a puddle on the garden path.",
      "Leo tests the edge, but his shoe sinks into sticky mud.",
      "They test dry stones, mark the route with cones and help Maya cross with dry shoes.",
      ["WILLOW-LEO", "WILLOW-SAMIR"]
    ),
    rows: [
      ["A wide puddle blocks the garden path.", "Illustrated wide view of the Willow Street community garden after rain: a broad shallow puddle spans the main path; Leo and Samir stop in boots before the water, with the shed beyond."],
      ["Leo points to the edge. “Let’s try over there.”", "Leo points to the near straight edge while Samir holds two small orange cones; ripples and darker mud show this route is wet despite appearing short."],
      ["Leo’s foot sinks into the soft, sticky mud.", "Close side view of Leo testing one boot at the puddle edge; it presses into soft mud without danger, while Samir stays on firm ground and notices the problem."],
      ["Samir spots some dry stones beside the muddy patch.", "Samir points to a curved line of pale dry paving stones around the puddle; Leo lifts his muddy boot back onto firm ground, and the orange cones remain ready."],
      ["He tests each stone. It stays still under his foot.", "Samir takes a careful step along the dry curved stones while Leo watches from firm ground; show stable flat stones, shallow water, and no jumping or risky balancing."],
      ["Leo puts cones beside the stones to mark the way.", "Leo sets the two orange cones on firm ground beside the curved dry route; Samir stands near the shed end, clearly showing the complete safe path around the puddle."],
      ["Maya follows the stones. Her shoes stay dry.", "Maya approaches and follows the cone-marked dry stones while Leo gestures along the route and Samir waits ahead; her shoes stay dry and the puddle remains undisturbed."],
      ["Three friends reach the garden. Only Leo has a muddy shoe!", "Resolved garden view beyond the puddle: Maya, Leo, and Samir stand by the shed; Leo keeps his muddy boot while the others stay dry, and the safe coned route remains visible." ]
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
      "No trapped stone explains the noise; a second try makes the wheel squeak louder.",
      "They ask the adult gardener, who oils the axle before they test the quiet cart.",
      ["WILLOW-ZOE", "WILLOW-SAMIR"]
    ),
    rows: [
      ["The wheel squeaks when Zoe pushes the garden cart.", "Illustrated garden path: Zoe pushes an empty low green handcart while its front-left wheel shows gentle squeak motion lines; Samir looks down at the wheel, with no heavy load present."],
      ["Samir checks for stones caught beside the wheel.", "Samir kneels at a safe distance to look around the stopped cart wheel without touching the axle; Zoe holds the handle steady, and the path around the wheel is clear."],
      ["Zoe tries again. The wheel squeaks even louder.", "Side view of both children giving the empty cart one careful test push; the same front-left wheel shows stronger motion lines, their faces concerned rather than comic or reckless."],
      ["They stop the cart and ask the gardener.", "Zoe and Samir park the cart flat beside the path and raise a hand to the adult community gardener; the adult approaches with a small plain maintenance bottle kept out of children's reach."],
      ["The gardener drips oil onto the wheel’s axle.", "Close adult-supervised view: the gardener applies one drop of oil to the metal axle while Zoe and Samir stand back watching; wheel, bottle, and hands are mechanically plausible."],
      ["The gardener turns the wheel several times.", "The adult gardener safely spins the lifted wheel by hand to spread the oil; the cart is stable and empty, while the children observe from beside the handles."],
      ["The wheel rolls quietly along the path.", "Zoe gives the cart a gentle test push as the repaired front-left wheel rolls smoothly without motion marks; Samir listens and gives a pleased thumbs-up."],
      ["Zoe and Samir roll the seedlings down the quiet path.", "Resolved wide view: Zoe and Samir pull the quiet green cart loaded lightly with seedling trays toward the garden beds; the gardener waves, and the repaired wheel stays visually consistent." ]
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
    coverBrief: "Illustrated Willow Street community garden entrance, Maya and Leo studying a green wooden gate caught above one small gray stone; watering can and flower beds beyond, clear cause visible, fresh morning light, no text.",
    storyBibleReview: fictionReview(
      "Maya and Leo need to open the garden gate and inspect what blocks its swing.",
      "Pulling together fails because a stone is wedged beneath the lower rail.",
      "They close the gate, move the loose stone safely, sweep the grit, and open it freely.",
      ["WILLOW-MAYA", "WILLOW-LEO"]
    ),
    rows: [
      ["The gate stops halfway across the garden path.", "Wide illustrated entrance view: the green wooden garden gate is stuck halfway open; Maya holds it gently while Leo looks along the ground, with one gray stone partly hidden below."],
      ["Maya pulls once, but the gate stays still.", "Maya, in her mustard cardigan, pulls the green gate's latch-side handle while Leo, with auburn hair and a rust-and-cream striped shirt, watches the lower rail. The gray stone remains on the ground beneath the gate; neither child lifts it yet. Keep the stone path, gray-roof shed, and blue watering can."],
      ["Leo kneels and sees a stone underneath.", "Low close view from the safe latch side: Leo points to a small loose gray stone wedged beneath the gate's bottom rail; Maya steadies the gate and the hinge side stays clear."],
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
    bridgeGenre: "family-community",
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
      ["Nani makes warm chapatis for Maya's family lunch.", "Illustrated family kitchen: Nani, wearing a plain plum long-sleeved top and cream apron, cooks one round chapati on a flat tawa at the adult stove while Maya watches from the table; safe distance is clear."],
      ["Maya stacks them inside the round steel tin.", "At the kitchen table away from heat, Maya places a stack of cooked chapatis into the lower round steel tiffin; Nani sets a covered bowl nearby and steam is gentle."],
      ["The flat chapatis leave no room for lentils.", "Overhead view of the open tiffin: flat chapatis fill the lower tier while a small sealed lentil container cannot fit; Maya compares the spaces with a puzzled expression."],
      ["Nani folds one chapati into a neat triangle.", "Close view of Nani's hands folding a cooled round chapati once and then again into a triangle on a clean plate; Maya watches closely, with the hot stove distant."],
      ["Nani folds another, and Maya copies carefully.", "Maya folds a second cooled chapati into the same triangle beside Nani's completed one; their hands and the two shapes are clearly distinct and the table remains tidy."],
      ["The folded chapatis fit beside the lentil pot.", "Overhead tiffin view: folded chapati triangles sit neatly beside the sealed small lentil pot, leaving an exact open space; Maya points to the successful arrangement."],
      ["Maya adds cool cucumber slices to the top.", "Maya places pre-cut cucumber slices into the upper tiffin tier using clean tongs; Nani closes the lower tier, and no child handles knives or the hot pan."],
      ["Maya opens the tin. Lunch for everyone fits inside!", "Warm family lunch scene at the Willow Street kitchen table: Maya, Nani, and family members share chapatis, lentils, and cucumber from the open tiffin, with joyful natural interaction and no ceremonial tokenism." ]
    ]
  }),
  makeBook({
    slug: "dumplings-for-new-year",
    title: "Dumplings for Dinner",
    type: "fiction",
    bridgeGenre: "family-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-ZOE", "WILLOW-AUNT-MEI"],
    repeatedLanguage: "wrapper",
    coverBrief: "Neutral everyday family kitchen, Zoe and Aunt Mei shaping crescent dumplings at a clean pale wood table with green cabinets and ordinary plants and utensils; adult tends the steaming pot. Casual clothing, no festival decorations, symbols or lettering.",
    storyBibleReview: fictionReview(
      "Zoe learns to seal dumplings for her family's dinner.",
      "Her first wrapper holds too much filling for its edges to meet.",
      "She uses less filling and pinches the edges together; her cooked dumpling keeps its filling inside.",
      ["WILLOW-ZOE", "WILLOW-AUNT-MEI"]
    ),
    rows: [
      ["Zoe's family makes dumplings for dinner together.", "Neutral family kitchen: Zoe in her plain coral jacket with sleeves rolled safely joins Aunt Mei at a clean table set with round wrappers and vegetable filling; green cabinets, ordinary plants and utensils, no festival decorations or symbols.", "Zoe and Aunt Mei prepare dumplings at a kitchen table."],
      ["Aunt Mei spoons filling onto the middle of a wrapper.", "Close overhead view of Aunt Mei placing a modest spoonful of vegetable filling in the center of one round wrapper; Zoe watches, and ingredients remain separated in tidy bowls.", "Aunt Mei spoons a small amount of filling onto a round wrapper."],
      ["Zoe adds a heap. Her wrapper will not close.", "Zoe's first wrapper lies open on the tray because a large mound of filling prevents the edges meeting; her expression shows surprise, while Aunt Mei responds calmly.", "Zoe tries to close a wrapper holding too much filling."],
      ["“Just a little,” says Aunt Mei, showing a smaller spoonful.", "Aunt Mei removes extra filling and demonstrates the smaller amount beside Zoe; show both wrappers for a clear comparison and keep the cooking pot distant with another adult.", "Aunt Mei shows Zoe a smaller spoonful of filling."],
      ["Zoe folds her wrapper and pinches the edges together.", "Close view of Zoe folding the wrapper into a crescent and pinching its curved edge carefully from left to right; filling stays enclosed and Aunt Mei's guiding hand remains nearby.", "Zoe folds a dumpling and pinches its edge closed."],
      ["She holds it up. No gaps this time!", "Zoe holds a second fully sealed crescent dumpling up for Aunt Mei to inspect; the smooth unbroken edge is clearly visible, with several family-made dumplings on the tray.", "Zoe holds up a sealed dumpling for Aunt Mei to see."],
      ["Aunt Mei lowers the dumplings into a pot of boiling water.", "Aunt Mei uses a long slotted spoon at the adult stove, fingers outside the steam zone and pot handles inward. Zoe watches with both hands on a separate cool preparation table beside raw crescent dumplings; a clear aisle separates her from the hot station. Keep green cabinets, ordinary plants and established casual clothing, with no festival decorations.", "Aunt Mei cooks dumplings while Zoe watches from a separate table."],
      ["Zoe takes a bite. Her filling stays tucked inside!", "Everyday family dinner: Zoe and relatives share cooked dumplings at one bright table in casual clothes; ordinary plants and kitchen utensils, no ceremonial or festival decoration, symbols or lettering.", "Zoe bites a cooked dumpling while Aunt Mei holds a plate of dumplings."]
    ]
  }),
  makeBook({
    slug: "drums-for-carnival",
    title: "Drums Together",
    type: "fiction",
    bridgeGenre: "family-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-LEO", "WILLOW-MR-BAPTISTE"],
    repeatedLanguage: "call",
    coverBrief: "Neutral Willow Street community hall music practice, Leo with a small hand drum beside bandleader Mr Baptiste in a plain teal shirt and cream trousers and a mixed-age percussion group in everyday clothes; plain walls, instruments correctly held, lively but controlled motion, no identity-themed costumes, flags, symbols, logos or text.",
    storyBibleReview: fictionReview(
      "Leo wants to join a neighborhood drum practice and must learn where his part fits.",
      "Starting too soon covers the leader's call and interrupts the group's pattern.",
      "Leo listens for the call, plays the answering beat, and marches with the group.",
      ["WILLOW-LEO", "WILLOW-MR-BAPTISTE"]
    ),
    rows: [
      ["Leo brings his small drum to band practice.", "Neutral community hall: Leo in his striped shirt and navy trousers enters carrying a child-size hand drum; Mr Baptiste in a plain teal shirt and cream trousers and a mixed-age neighborhood percussion group in everyday clothes prepare against plain walls. No sashes, ceremonial costume, festival decorations or identity flags.", "Leo brings his drum into the community hall for practice."],
      ["Mr. Baptiste plays first. Everyone waits to answer.", "Bandleader Mr Baptiste raises one hand and plays a short call on a barrel drum; the circle watches attentively, instruments held correctly, with Leo ready but not yet playing.", "Mr. Baptiste plays a drum while the group waits."],
      ["Leo starts too soon. His drum covers the call.", "Leo enthusiastically continues drumming while the group begins its answer; overlapping motion lines and concerned listening faces show the rhythm has become crowded without shaming him.", "Leo drums while Mr. Baptiste is still playing the call."],
      ["Mr. Baptiste raises his hand. The group stops.", "The whole percussion circle becomes still as Mr Baptiste calmly repeats the call with a hand cue; Leo lowers his sticks and leans forward to listen closely.", "Mr. Baptiste raises his hand and the group stops playing."],
      ["This time, Leo waits for the call to end.", "Mr Baptiste finishes the call and points to the group; Leo joins exactly as the answering beat starts, matching the neighbors' hand drums in coordinated motion.", "Leo listens for Mr. Baptiste to finish his call."],
      ["Then Leo answers with the group. Softly, then loudly.", "The percussion group follows two visible hand cues: a small low hand for soft playing and raised open hand for strong playing; Leo mirrors both dynamics attentively.", "Leo plays an answering rhythm with the percussion group."],
      ["In the hall, their drums answer Mr. Baptiste together.", "Wide neutral hall view: Leo, Mr Baptiste, and the full community group sustain one coordinated rhythm in ordinary casual clothes; families watch beside plain walls, with joyful expressions and mechanically plausible instruments. No identity-themed costume or symbols.", "Leo and the group play together inside the hall."],
      ["Outside, Leo marches beside Mr. Baptiste. Call, wait, answer!", "Resolved daylight music practice outside an ordinary flat-roofed community hall: Leo walks safely with the supervised band in casual clothes, keeping his small drum beat steady; plain pedestrian square, no ceremonial costume, festival decoration, symbols or identity flags.", "Leo marches beside Mr. Baptiste with the supervised band."]
    ]
  }),
  makeBook({
    slug: "a-morning-with-friends",
    title: "A Morning with Friends",
    type: "fiction",
    bridgeGenre: "family-community",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-SAMIR", "WILLOW-MAYA", "WILLOW-NANI", "WILLOW-ZOE", "WILLOW-LEO"],
    repeatedLanguage: "the table",
    coverBrief: "Neutral everyday community room with plain cream walls, rectangular blue doors, timber floor, one shelf and a long light-oak breakfast table. Samir in his cobalt hoodie and Maya in her mustard cardigan arrange four blue cups, four white plates and one fruit bowl; Nani in a plain plum top and cream apron helps nearby. A table problem is the premise, not its solution: no wooden block is in place. Bold clean outlined cartoon throughout, full essential faces/hands/props within the safe frame, lower22 percent quiet cream. No religious buildings, symbols, clothing, ceremonial decoration or identity flags; no lettering.",
    storyBibleReview: fictionReview(
      "Samir and Maya want breakfast ready for their friends, but a short table leg makes the cups wobble.",
      "Holding the cups stops an immediate spill but does not make the table steady; Maya looks below and finds the short leg.",
      "They find a flat block, Nani safely puts it beneath the short leg, and the children test the now-steady table before friends join breakfast.",
      ["WILLOW-SAMIR", "WILLOW-MAYA", "WILLOW-NANI", "WILLOW-ZOE", "WILLOW-LEO"]
    ),
    rows: [
      ["Samir and Maya set breakfast on a long table.", "Same neutral community room. Samir and Maya arrange exactly four blue cups, four white plates and one bowl of apples and bananas on the light-oak table; Nani is nearby. One near-right leg is slightly short but not yet examined; no block has been placed.", "Samir and Maya put cups, plates and fruit on a table."],
      ["The cups wobble when the table starts to rock.", "One moment as the same table rocks slightly on its short near-right leg; the same four cups tilt a little on the tabletop with simple motion marks, without spilling. Samir reaches to steady them and Maya notices the movement. No floating cups or extra table legs.", "The table rocks, and the cups wobble."],
      ["Samir holds the cups. Maya looks under the table.", "Samir steadies the four cups on the tabletop with two natural hands. Maya crouches beside the near-right table leg and looks below. All four table legs are coherent; the short near-right foot leaves a small visible gap above the timber floor.", "Samir steadies the cups while Maya checks a table leg."],
      ["One short leg hangs above the uneven floor.", "Clear low-angle evidence view of the same short near-right table leg with a small air gap above the floor; the other three feet support the table. Maya points beside the gap without placing fingers beneath the table. No block is present yet.", "Maya points to a gap beneath one short table leg."],
      ["Maya finds a flat wooden block beside the shelf.", "Maya picks up one small flat rectangular wooden block from beside the room's shelf. Samir stays beside the same breakfast table and its four cups, four plates and fruit bowl. The short near-right leg still has its gap; no duplicate block.", "Maya picks up a flat wooden block beside a shelf."],
      ["Nani slides the block under the short leg.", "Nani alone manages the pinch point: one adult hand safely steadies the table while her other hand slides the single flat block beneath the short near-right leg. Samir and Maya watch from clear of her hands. No child's fingers under furniture; the four cups, four plates and fruit bowl stay on top.", "Nani places the block beneath the short table leg."],
      ["Maya nudges the table. The cups do not move!", "The single block supports the same near-right leg. Maya gently nudges the table edge with an open hand; all four blue cups are upright and still. Samir looks relieved and Nani watches nearby. No second support, moving cups or spills.", "Maya tests the table while the cups remain upright."],
      ["Friends join them, and breakfast begins without a spill.", "Resolved neutral community breakfast: Samir, Maya, Zoe and Leo sit at the same stable table using exactly four blue cups and four white plates, with one fruit bowl. Nani stands nearby in plain everyday clothes. The single block is still visible beneath the near-right leg. No religious or national symbols, festival decorations, costumes, flags or lettering.", "Four friends share breakfast at the steady table." ]
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
    coverBrief: "Illustrated Willow Street Park: Samir flies one blue diamond paper kite with crossed wooden sticks and one continuous blue ribbon tail. A white line runs from the blue-ended spool through his raised hand to the sticks' crossing. The page-one adult supervises: warm brown skin, side-part wavy black hair, short beard and moustache, forest-green crewneck, tan trousers, dark gray trainers. Broad open grass, distant trees, quiet cream lower panel, no roads, wires, or text.",
    storyBibleReview: nonfictionReview(
      "How can a child make and safely fly a simple paper kite?",
      "Shape paper, attach supports, add tail and line, inspect, then choose a safe open flying place.",
      "A balanced frame, secure tail, and open windy space help the kite lift safely."
    ),
    rows: [
      ["Ask an adult to cut a paper diamond.", "At a wooden outdoor park table, an adult cuts blue paper into a diamond while Samir watches. Adult anchor: warm brown skin, side-part wavy black hair, short beard and moustache, forest-green crewneck. Scissors stay in adult hands; ruler, tape, two sticks, and a blue-ended spool of white line lie on the table."],
      ["Lay two light sticks across the diamond.", "At the same wooden park table, Samir lays two light wooden sticks across the flat blue diamond while the same bearded adult in a forest-green crewneck watches. Blue ribbon and a blue-ended spool of white line remain beside the paper; scissors are absent."],
      ["Tape both sticks firmly to the paper.", "Samir presses short tape strips over the stick ends and crossing on the flat blue diamond at the wooden park table. The same bearded adult in a forest-green crewneck supervises. The single blue ribbon and blue-ended white-line spool lie nearby; grass and trees continue the outdoor setting."],
      ["Tie a ribbon tail to the bottom.", "At the same outdoor table, the bearded adult in a forest-green crewneck helps Samir attach one continuous blue ribbon by one end at the kite's bottom point. A tiny knot end stays beside the attachment; the single long tail trails across the table. The taped wooden cross and blue paper remain unchanged."],
      ["Ask an adult to tie the line where the sticks cross.", "Kneeling on park grass beside Samir, the same bearded adult in a forest-green crewneck, tan trousers, and dark gray trainers ties white line at the kite's central stick crossing. Samir holds the blue-ended spool. Tape remains visible at the four stick ends and crossing; one blue ribbon tail lies on the grass."],
      ["Check the kite's tape, tail, and line together.", "Samir and the same bearded adult kneel on park grass to inspect the blue kite: tape at the wooden stick ends and crossing, one attached blue ribbon tail, white line from the center to the blue-ended spool. Adult clothing stays forest-green crewneck, tan trousers, and dark gray trainers."],
      ["Choose open ground, far from roads and wires.", "Wide Willow Street Park field: the same bearded adult in a forest-green crewneck, tan trousers, and dark gray trainers points across the open grass. Samir holds the blue kite and white-line spool. One blue ribbon tail hangs below the kite; trees and benches remain at the distant field edges, with no roads or wires in the flying area."],
      ["Keep the wind behind you and let the kite rise.", "Samir faces right with the wind behind him, flying the blue diamond kite above the open grass; its single blue ribbon tail streams to the right. One white line runs from his blue-ended spool through his raised hand to the sticks' crossing. The same bearded adult in a forest-green crewneck, tan trousers, and dark gray trainers supervises beside him. Distant trees, clear flying space, no roads or wires." ]
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
    coverBrief: "Leo holds the red hatchback ready for release at the high end of one rigid cardboard slope on hardwood. Blue over green books support only that end; the low end is taped flat to the floor. The fixed short-haired adult in teal crewneck, navy trousers and gray trainers supervises in the sage playroom with left cubby and right window/cream-and-blue plant pot. No stop markers or text.",
    storyBibleReview: nonfictionReview(
      "How can a child build and test a safe low ramp for toy cars?",
      "Choose materials, make a low support, secure the slope, clear the path, test, compare, and restore safely.",
      "Changing the ramp height changes the toy car's motion while the structure stays low and stable."
    ),
    rows: [
      ["Ask an adult for strong, flat cardboard.", "Leo and the fixed short-haired adult in teal crewneck, navy trousers and gray trainers examine one rigid board laid flat on hardwood. Blue over green books, paper tape and a red hatchback wait beside it. Same sage playroom, left cubby with blue/yellow bins, right window above cream-and-blue plant pot; no blades or staples."],
      ["Stack two wide books on the floor.", "Leo places the broad blue book on the green book on hardwood; the same adult checks aligned edges. The same board waits flat nearby with tape and red hatchback. Keep the fixed playroom and wardrobe."],
      ["Rest the cardboard across the book stack.", "Leo and the same adult place the board's high left end on blue-over-green books and its low right end directly on hardwood. One continuous gentle slope, no receiving-end books or attached tape yet. The red hatchback waits beside the tape roll."],
      ["Tape the ramp so it cannot slide.", "The same adult secures the high board-to-book joint and low board-to-hardwood joint with cream paper tape while Leo watches. Two books only, same board, red hatchback waiting beside the ramp; fingers stay outside the underside."],
      ["Clear toys away from the landing space.", "Leo puts blocks away to the left while the same adult points to the empty hardwood landing path on the right. Red hatchback waits at the high left end; two-book support and both taped joints stay fixed. No markers yet."],
      ["Release one car, then mark its stopping point.", "After release without pushing, the same red hatchback rests on hardwood beyond the low end. Leo places a blue counter beside its rear wheel for the first stop. The same adult steadies the blue-over-green stack; ramp, tape, floor and room stay fixed."],
      ["Raise the ramp, release the car again, then mark its second stop.", "One yellow book is added under green, below blue, at the high end only. The same board is retaped with low endpoint fixed on hardwood. After the second release from the same top point, Leo marks the same red hatchback's rear wheel with yellow; blue retains the first stop. Same adult, room and surface."],
      ["Compare both marks to see which roll traveled farther.", "The same side view shows blue at the first stop and yellow beside the red hatchback at its second stop. Leo points to both marks while the same adult discusses the comparison. Three-book blue/green/yellow stack, board, tape, hardwood and stop positions stay fixed."]
    ]
  }),
  makeBook({
    slug: "make-fruit-and-yoghurt-cups",
    title: "Make Fruit and Yogurt Cups",
    type: "nonfiction",
    bridgeGenre: "procedure",
    visualTreatment: "willow-street-illustrated",
    cast: ["WILLOW-ZOE"],
    repeatedLanguage: "each cup",
    safetyNote: "An adult checks every ingredient for allergies before food preparation, cuts firm fruit, and keeps yogurt cold until serving.",
    coverBrief: "Illustrated Willow Street kitchen table, Zoe and an adult displaying four clear reusable cups layered with plain yogurt, berries, and banana; knife remains at adult counter, cold ingredients and clean hands emphasized, no text.",
    storyBibleReview: nonfictionReview(
      "How can a child assemble safe fruit and yogurt cups?",
      "Check allergies, clean, adult-cut, portion, layer, cover, chill, and serve in food-safe order.",
      "Clean cold ingredients become an even layered snack when each cup receives the same safe steps."
    ),
    rows: [
      ["Ask an adult to check every ingredient for allergies.", "Before any food is opened, Zoe shows the adult the plain yogurt, banana, and berries; the adult checks each package's ingredient panel while Zoe waits, with labels kept unreadable."],
      ["Wash your hands and rinse the fruit.", "Illustrated kitchen sink: Zoe washes soapy hands while an adult rinses berries and banana nearby; clean towel, colander, and uncluttered food-safe surfaces are clearly shown."],
      ["Ask an adult to cut the banana.", "At the adult-height counter, the adult slices peeled banana on a board while Zoe waits at the table; knife remains firmly in adult hands and berries stay whole."],
      ["Spoon plain yogurt into each cup.", "Overhead table view: Zoe uses one clean spoon to place equal plain yogurt portions into four clear reusable cups; adult supervises and fruit bowls remain separate."],
      ["Add banana and berries to each cup.", "Zoe adds visible banana slices and mixed berries evenly to each of the four cups; show matching fruit layers and keep her hands away from cutting tools."],
      ["Spoon more yogurt over the fruit.", "Side view through the clear cups as Zoe adds a second plain yogurt layer that partly covers the fruit; all four cups show the same tidy sequence."],
      ["Cover and chill each cup until snack time.", "The adult and Zoe place snug reusable lids on the four cups, then set them together on a refrigerator shelf; cold storage is clear and cups stay upright."],
      ["Serve the cold cups with clean spoons.", "Resolved kitchen table: Zoe serves the four chilled fruit-and-yogurt cups with clean spoons to family members; bright fruit layers remain visible and uneaten cups stay cold." ]
    ]
  }),
  makeBook({
    slug: "from-wheat-to-bread",
    title: "From Wheat to Bread",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "self-created-photorealistic",
    mediaLicense: "self-created",
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
    visualTreatment: "self-created-photorealistic",
    mediaLicense: "self-created",
    cast: [],
    repeatedLanguage: "Some rainwater",
    coverBrief: "Photorealistic Willow Street after rain, droplets falling across roof, rain garden, pavement drain, and a small stream visible in one coherent landscape; overcast daylight, realistic water flow, no flooding drama, signs, or text.",
    storyBibleReview: nonfictionReview(
      "Where can rainwater travel after it reaches the ground?",
      "Roof runoff, soil soaking, street drainage, streams, rivers, sea, and evaporation show branching connected pathways.",
      "Rainwater may soak into ground or flow downhill, eventually rejoining waterways and the atmosphere."
    ),
    rows: [
      ["Rain falls onto roofs, gardens, roads, and rivers.", "Photorealistic neighborhood landscape during moderate rain: droplets visibly reach tiled roofs, planted garden soil, wet road, and a small river in the distance; safe normal weather, no storm damage."],
      ["Some rainwater soaks slowly into loose garden soil.", "Photorealistic macro view of rain soaking into dark crumbly garden soil around plant roots, with fewer surface puddles; realistic pore texture and diffuse overcast light."],
      ["Some rainwater runs downhill across hard pavement.", "Photorealistic low-angle view of shallow rainwater following the slope of an unbranded pavement toward the curb; flow direction visible through tiny leaves, no dangerous flood depth."],
      ["Roof gutters carry water into pipes or rain barrels.", "Photorealistic house detail: clean roof gutter channels rain into a downpipe that branches to a covered rain barrel, with overflow continuing safely toward drainage; accurate fittings, no labels."],
      ["Street drains guide water away from busy roads.", "Photorealistic curb drain receiving a thin sheet of road runoff while vehicles remain distant; grate openings, curb slope, and water direction mechanically plausible, with no person entering the road."],
      ["Small streams join wider rivers moving toward the sea.", "Photorealistic aerial-oblique landscape where two narrow streams visibly meet a broader river winding toward a coastal horizon; natural banks, accurate scale, clear connected flow."],
      ["Sunlight warms water, and some rises as vapor.", "Photorealistic calm reservoir after rain under returning sunlight; subtle atmospheric haze rises from the surface without cartoon arrows, with warm light glinting on realistic water."],
      ["Cooling vapor forms clouds that can bring more rain.", "Photorealistic wide sky and landscape: moist air has formed layered rain clouds above the same river basin, with a distant gentle rain shaft completing the cycle plausibly." ]
    ]
  }),
  makeBook({
    slug: "inside-a-fire-station",
    title: "Inside a Fire Station",
    type: "nonfiction",
    bridgeGenre: "illustrated-nonfiction",
    visualTreatment: "self-created-cartoon",
    mediaLicense: "self-created",
    cast: [],
    repeatedLanguage: "Firefighters",
    coverBrief: "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. The four firefighters stand by their engine and organized protective gear in the station bay.",
    storyBibleReview: nonfictionReview(
      "What work happens inside a fire station before, during, and after a call?",
      "Readiness, dispatch, protective gear, travel, emergency work, return, equipment care, and training show the complete duty cycle.",
      "Firefighters prepare, respond as a trained team, maintain equipment, and practice for future emergencies."
    ),
    rows: [
      ["Firefighters check their engine, tools, and safety gear.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. Two firefighters check the engine equipment and breathing gear in the station bay.", "Two firefighters check the engine equipment and breathing gear in the station bay."],
      ["A dispatcher sends details when someone needs help.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. A firefighter uses the desk radio and points to a wall map.", "A firefighter uses the desk radio and points to a wall map."],
      ["Firefighters pull on protective clothing before they leave.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. The crew puts on tan protective jackets and yellow helmets beside the gear rack.", "The crew puts on tan protective jackets and yellow helmets beside the gear rack."],
      ["The engine carries people, water, hoses, and tools.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. The parked engine has a crew cab and separate compartments for hoses and tools.", "The parked engine has a crew cab and separate compartments for hoses and tools."],
      ["At emergencies, firefighters work together under one leader.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. The gray-haired leader directs two firefighters holding a flexible hose and nozzle.", "The gray-haired leader directs two firefighters holding a flexible hose and nozzle."],
      ["They may stop fires, rescue people, or give first aid.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. A firefighter wraps a bandage around a seated adult\u2019s forearm beside a first-aid kit.", "A firefighter wraps a bandage around a seated adult\u2019s forearm beside a first-aid kit."],
      ["Back at the station, every tool is cleaned and checked.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. A firefighter scrubs a coiled hose with a blue brush beside a bucket and floor drain.", "A firefighter scrubs a coiled hose with a blue brush beside a bucket and floor drain."],
      ["Firefighters train often, ready for the next call.", "Clean bright cartoon, crisp outlines and smooth flat colors; no paint texture, grain, embossing or lettering. Keep the four established adult crew members, red engine with white roof and stripe, white-brick station with red trim, and quiet lower cream print area. The crew practices carrying a ladder together in the station yard.", "The crew practices carrying a ladder together in the station yard."]
    ]
  }),
  makeBook({
    slug: "how-paper-is-recycled",
    title: "How Paper Is Recycled",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "self-created-photorealistic",
    mediaLicense: "self-created",
    cast: [],
    repeatedLanguage: "The paper",
    coverBrief: "Photorealistic recycling sequence still life: used clean paper, sorted bales, wet pulp, a new paper roll, and finished plain notebooks arranged left to right; cool industrial daylight, realistic fibers, no logos or printed text.",
    storyBibleReview: nonfictionReview(
      "How can used paper become new paper?",
      "Collection, sorting, pulping, screening, cleaning, pressing, drying, and remanufacture follow a factual mill sequence.",
      "Water separates paper into fibers, which are cleaned, flattened, dried, and made useful again."
    ),
    rows: [
      ["Clean used paper is collected for recycling.", "Photorealistic community recycling point: plain newspapers without legible print, office paper, and cardboard enter a paper-only bin; clean dry materials, adult hands, no food or plastic contamination."],
      ["Workers sort the paper, picking out anything that is not paper.", "Photorealistic sorting conveyor: trained adult workers and mechanical separators remove plastic film and metal objects from mixed paper; guarded machinery, realistic protective equipment, no brand marks."],
      ["The paper mixes with water to make wet pulp.", "Photorealistic mill pulper seen through a safe viewing panel: paper and water form a thick fibrous slurry under mechanical mixing; accurate vessel, guards, and neutral industrial light."],
      ["Screens catch staples, tape, and larger unwanted pieces.", "Photorealistic close process view of wet pulp passing through metal screens while staples and tape fragments collect separately; fiber slurry texture and scale are technically plausible."],
      ["The pulp is cleaned before making new sheets.", "Photorealistic mill cleaning stage: pale pulp flows through covered pipes and tanks designed to remove inks and tiny dirt; sample jars show cleaner fibers without impossible pure whiteness."],
      ["Rollers press water from the thin pulp layer.", "Photorealistic paper machine: an even wet fiber mat travels between broad press rollers as water drains below; safety guards in place, no worker near moving parts."],
      ["Heated rollers dry the long sheet of paper.", "Photorealistic guarded drying section where the continuous paper web passes over large heated cylinders and becomes smooth and dry; realistic tension, scale, and warm industrial light."],
      ["The old paper is now new boxes, bags, and notebooks.", "Photorealistic final table with unbranded cardboard boxes, plain notebooks, paper bags, and a large recycled paper roll; fiber color remains naturally off-white, no labels or claims printed." ]
    ]
  }),
  makeBook({
    slug: "a-snail-comes-out-at-night",
    title: "A Snail Comes Out at Night",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "self-created-photorealistic",
    mediaLicense: "self-created",
    cast: [],
    repeatedLanguage: "The snail",
    coverBrief: "Photorealistic garden snail emerging on a damp leaf at blue hour, spiral shell intact, two upper eye tentacles and two shorter lower tentacles visible, natural slime trail and soft moonlit ambience, anatomically accurate, no text.",
    storyBibleReview: nonfictionReview(
      "What does a garden snail do during a damp night?",
      "Day shelter, night emergence, sensing, movement, feeding, protection, moisture needs, and dawn shelter form a natural behavior sequence.",
      "Cool damp nights help the snail move, feed, and avoid drying before it returns to shelter."
    ),
    rows: [
      ["By day, the snail rests in a cool shelter.", "Photorealistic daytime macro beneath a low garden stone: one garden snail rests withdrawn in shade on damp soil, shell opening protected, natural scale and no staged human objects."],
      ["At dusk, the snail comes out into the damp air.", "Photorealistic blue-hour macro: the same shell and markings as page one, with the snail's body slowly extending onto a wet leaf as fine moisture beads collect nearby."],
      ["The snail's tentacles feel and smell its surroundings.", "Anatomically accurate photorealistic head close-up: two long upper tentacles and two shorter lower tentacles extended toward a leaf edge, with natural skin texture and shallow depth of field."],
      ["Tiny eyes sit at the longer tentacles' tips.", "Extreme but plausible macro of the snail's two upper tentacles showing dark eye spots at their tips; lower sensory tentacles remain visible, with no enlarged fantasy eyes."],
      ["The snail glides on one strong, muscular foot.", "Photorealistic low side view through glass-like wet leaf surface: broad muscular foot makes wave-like contact while the shell rides steadily above, anatomically correct and not floating."],
      ["Slime under its foot helps it slide over rough ground.", "Photorealistic moonlit macro behind the moving snail: a narrow glistening mucus trail follows the foot across a rough leaf, showing how the moist layer separates body from surface."],
      ["The snail scrapes soft plants and decaying leaves.", "Photorealistic feeding close-up: the snail's mouth meets the softened edge of a decaying leaf with tiny scrape marks visible; no oversized teeth, damaged crop, or harmful bait."],
      ["At dawn, it shelters under leaves so it won’t dry out.", "Photorealistic dawn scene: the same snail moves beneath dense low leaves as the sky brightens; moist shade remains under foliage while exposed ground begins to dry." ]
    ]
  }),
  makeBook({
    slug: "how-a-book-is-made",
    title: "How a Book Is Made",
    type: "nonfiction",
    bridgeGenre: "photorealistic-nonfiction",
    visualTreatment: "self-created-photorealistic",
    mediaLicense: "self-created",
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
