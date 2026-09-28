/**
 * Original Literacy Guide-authored parallel content for EL Assessments 3-6.
 *
 * Form A lives in elBenchmarkAssessmentCatalog.js. These compact
 * specifications provide controlled Form B and Form C replacements. The
 * catalog keeps the Form A construct sequence and item order; any word-specific
 * feature exceptions are authored explicitly. Route and administration rules stay shared.
 */

const pair = (bPrompt, bAnswers, cPrompt, cAnswers) => Object.freeze({
  b: Object.freeze([bPrompt, Object.freeze(bAnswers)]),
  c: Object.freeze([cPrompt, Object.freeze(cAnswers)])
});

export const EL_PARALLEL_PA_CONTENT = Object.freeze({
  "K-BOY": Object.freeze([
    pair("Do star and car rhyme?", ["yes"], "Do goat and boat rhyme?", ["yes"]),
    pair("Do sun and cake rhyme?", ["no"], "Do fish and tree rhyme?", ["no"]),
    pair("What word do these parts make: rain ... bow?", ["rainbow"], "What word do these parts make: cup ... cake?", ["cupcake"]),
    pair("What word do these parts make: foot ... ball?", ["football"], "What word do these parts make: bed ... room?", ["bedroom"]),
    pair("What word is /k/ ... /at/?", ["cat"], "What word is /p/ ... /ig/?", ["pig"]),
    pair("What word is /h/ ... /en/?", ["hen"], "What word is /f/ ... /ox/?", ["fox"]),
    pair("What is the first sound in dog?", ["d", "/d/"], "What is the first sound in cat?", ["c", "k", "/k/"]),
    pair("What is the first sound in leaf?", ["l", "/l/"], "What is the first sound in van?", ["v", "/v/"])
  ]),
  "K-MOY": Object.freeze([
    pair("Tell me a word that rhymes with hen.", ["pen", "ten", "men", "den"], "Tell me a word that rhymes with sun.", ["fun", "run", "bun", "none"]),
    pair("Tell me a word that rhymes with cake.", ["bake", "lake", "make", "rake"], "Tell me a word that rhymes with tree.", ["bee", "free", "see", "three"]),
    pair("Say basket in parts.", ["bas ket", "bas-ket", "basket:2"], "Say tiger in parts.", ["ti ger", "ti-ger", "tiger:2"]),
    pair("Say football in parts.", ["foot ball", "foot-ball", "football:2"], "Say bedroom in parts.", ["bed room", "bed-room", "bedroom:2"]),
    pair("What is the last sound in cat?", ["t", "/t/"], "What is the last sound in cup?", ["p", "/p/"]),
    pair("What is the last sound in pig?", ["g", "/g/"], "What is the last sound in red?", ["d", "/d/"]),
    pair("Blend /k/ /a/ /t/.", ["cat"], "Blend /p/ /i/ /g/.", ["pig"]),
    pair("Blend /h/ /e/ /n/.", ["hen"], "Blend /m/ /o/ /p/.", ["mop"]),
    pair("Tell me every sound in van.", ["v a n", "/v/ /a/ /n/"], "Tell me every sound in cup.", ["c u p", "k u p", "/k/ /u/ /p/"]),
    pair("Tell me every sound in jet.", ["j e t", "/j/ /e/ /t/"], "Tell me every sound in log.", ["l o g", "/l/ /o/ /g/"])
  ]),
  "K-EOY": Object.freeze([
    pair("Tell me a word that rhymes with boat.", ["coat", "goat", "float", "note"], "Tell me a word that rhymes with light.", ["bright", "night", "right", "sight"]),
    pair("Say picnic in parts.", ["pic nic", "pic-nic", "picnic:2"], "Say rabbit in parts.", ["rab bit", "rab-bit", "rabbit:2"]),
    pair("What word is /ch/ ... /op/?", ["chop"], "What word is /th/ ... /in/?", ["thin"]),
    pair("What is the middle sound in map?", ["a", "/a/"], "What is the middle sound in fish?", ["i", "/i/"]),
    pair("Blend /s/ /t/ /e/ /p/.", ["step"], "Blend /k/ /l/ /a/ /p/.", ["clap"]),
    pair("Blend /sh/ /e/ /d/.", ["shed"], "Blend /th/ /i/ /n/.", ["thin"]),
    pair("Tell me every sound in milk.", ["m i l k", "/m/ /i/ /l/ /k/"], "Tell me every sound in desk.", ["d e s k", "/d/ /e/ /s/ /k/"]),
    pair("Tell me every sound in chin.", ["ch i n", "/ch/ /i/ /n/"], "Tell me every sound in path.", ["p a th", "/p/ /a/ /th/"]),
    pair("Say stop without /s/.", ["top"], "Say plane without /p/.", ["lane"]),
    pair("Say bead without /d/.", ["bee"], "Say moon without /n/.", ["moo"]),
    pair("Change the /k/ in cat to /h/. What word now?", ["hat"], "Change the /p/ in pig to /d/. What word now?", ["dig"]),
    pair("Change the /a/ in map to /o/. What word now?", ["mop"], "Change the /i/ in fin to /a/. What word now?", ["fan"])
  ]),
  "1-BOY": Object.freeze([
    pair("Tell me a word that rhymes with stone.", ["bone", "cone", "phone", "tone"], "Tell me a word that rhymes with rain.", ["chain", "gain", "main", "train"]),
    pair("Say magnet in parts.", ["mag net", "mag-net", "magnet:2"], "Say velvet in parts.", ["vel vet", "vel-vet", "velvet:2"]),
    pair("What word is /fl/ ... /ag/?", ["flag"], "What word is /dr/ ... /um/?", ["drum"]),
    pair("What vowel sound do you hear in seed?", ["ee", "long e", "/ee/", "/iː/"], "What vowel sound do you hear in boat?", ["oa", "long o", "/oh/", "/oʊ/"]),
    pair("Blend /k/ /l/ /a/ /p/.", ["clap"], "Blend /d/ /r/ /u/ /m/.", ["drum"]),
    pair("Tell me every sound in desk.", ["d e s k", "/d/ /e/ /s/ /k/"], "Tell me every sound in hand.", ["h a n d", "/h/ /a/ /n/ /d/"]),
    pair("Say stop without /s/.", ["top"], "Say glow without /g/.", ["low"]),
    pair("Say moon without /n/.", ["moo"], "Say seed without /d/.", ["see"]),
    pair("Change the /k/ in cat to /h/. What word now?", ["hat"], "Change the /p/ in pan to /r/. What word now?", ["ran"]),
    pair("Change the /g/ in bag to /t/. What word now?", ["bat"], "Change the /d/ in red to /n/. What word now?", ["ren", "wren"])
  ]),
  "1-MOY": Object.freeze([
    pair("What word do these parts make: sun ... light?", ["sunlight"], "What word do these parts make: play ... ground?", ["playground"]),
    pair("Say music in parts.", ["mu sic", "mu-sic", "music:2"], "Say paper in parts.", ["pa per", "pa-per", "paper:2"]),
    pair("What word is /cl/ ... /oud/?", ["cloud"], "What word is /tr/ ... /ain/?", ["train"]),
    pair("What vowel sound do you hear in day?", ["long a", "long-a", "ay", "/eɪ/", "eɪ"], "What vowel sound do you hear in play?", ["long a", "long-a", "ay", "/eɪ/", "eɪ"]),
    pair("Blend /s/ /t/ /r/ /e/ /ch/.", ["stretch"], "Blend /s/ /k/ /r/ /a/ /p/.", ["scrap"]),
    pair("Tell me every sound in plant.", ["p l a n t", "/p/ /l/ /a/ /n/ /t/"], "Tell me every sound in trust.", ["t r u s t", "/t/ /r/ /u/ /s/ /t/"]),
    pair("Say skate without /s/.", ["Kate", "kate"], "Say train without /t/.", ["rain"]),
    pair("Say clap without /l/.", ["cap"], "Say frog without /r/.", ["fog"]),
    pair("Change the /sh/ in shop to /ch/. What word now?", ["chop"], "Change the /th/ in thin to /ch/. What word now?", ["chin"]),
    pair("Change the /n/ in rain to /d/. What word now?", ["raid"], "Change the /t/ in boat to /n/. What word now?", ["bone"])
  ]),
  "1-EOY": Object.freeze([
    pair("Say football without foot.", ["ball"], "Say bedroom without bed.", ["room"]),
    pair("Say rainbow without bow.", ["rain"], "Say playground without play.", ["ground"]),
    pair("What vowel sound do you hear in boy?", ["oy", "oi", "/oi/", "/ɔɪ/"], "What vowel sound do you hear in cloud?", ["ou", "ow", "/ou/", "/aʊ/"]),
    pair("What vowel sound do you hear in fork?", ["or", "/or/", "/ɔr/"], "What vowel sound do you hear in bird?", ["ir", "er", "/ur/", "/ɜr/"]),
    pair("Blend /s/ /p/ /l/ /a/ /sh/.", ["splash"], "Blend /s/ /k/ /r/ /a/ /p/.", ["scrap"]),
    pair("Tell me every sound in crisp.", ["c r i s p", "k r i s p", "/k/ /r/ /i/ /s/ /p/"], "Tell me every sound in blend.", ["b l e n d", "/b/ /l/ /e/ /n/ /d/"]),
    pair("Say slide without /s/.", ["lied", "lide"], "Say snow without /s/.", ["know", "no"]),
    pair("Say blend without /l/.", ["bend"], "Say crash without /r/.", ["cash"]),
    pair("Change the /k/ in crab to /g/. What word now?", ["grab"], "Change the /p/ in plan to /k/. What word now?", ["clan"]),
    pair("Change the /r/ in brush to /l/. What word now?", ["blush"], "Change the /l/ in glass to /r/. What word now?", ["grass"]),
    pair("Change the vowel in cap to /u/. What word now?", ["cup"], "Change the vowel in bed to /i/. What word now?", ["bid"]),
    pair("Change the /n/ in rain to /d/. What word now?", ["raid"], "Change the /t/ in boat to /n/. What word now?", ["bone"])
  ]),
  "2-BOY": Object.freeze([
    pair("Say computer in parts.", ["com pu ter", "com-pu-ter"], "Say tomato in parts.", ["to ma to", "to-ma-to"]),
    pair("Say sunlight without sun.", ["light"], "Say playground without play.", ["ground"]),
    pair("What vowel sound do you hear in brown?", ["ow", "ou", "/ou/", "/aʊ/"], "What vowel sound do you hear in coin?", ["oi", "oy", "/oi/", "/ɔɪ/"]),
    pair("Blend /s/ /p/ /l/ /i/ /t/.", ["split"], "Blend /s/ /t/ /r/ /a/ /p/.", ["strap"]),
    pair("Tell me every sound in plant.", ["p l a n t", "/p/ /l/ /a/ /n/ /t/"], "Tell me every sound in crust.", ["c r u s t", "k r u s t", "/k/ /r/ /u/ /s/ /t/"]),
    pair("Say spill without /s/.", ["pill"], "Say bread without /b/.", ["red"]),
    pair("Say plant without /l/.", ["pant"], "Say blend without /l/.", ["bend"]),
    pair("Change the /b/ in brag to /d/. What word now?", ["drag"], "Change the /t/ in track to /k/. What word now?", ["crack"]),
    pair("Change the /r/ in brush to /l/. What word now?", ["blush"], "Change the /l/ in glass to /r/. What word now?", ["grass"]),
    pair("Change the /g/ in bag to /t/. What word now?", ["bat"], "Change the /d/ in road to /m/. What word now?", ["roam"])
  ]),
  "2-MOY": Object.freeze([
    pair("Say visitor in parts.", ["vis i tor", "vis-i-tor"], "Say remembered in parts.", ["re mem bered", "re-mem-bered", "remembered:3"]),
    pair("Say preview without pre.", ["view"], "Say rebuild without re.", ["build"]),
    pair("What vowel sound do you hear in cloud?", ["ou", "ow", "/ou/", "/aʊ/"], "What vowel sound do you hear in point?", ["oi", "oy", "/oi/", "/ɔɪ/"]),
    pair("Blend /s/ /t/ /r/ /e/ /ch/.", ["stretch"], "Blend /s/ /k/ /r/ /a/ /p/.", ["scrap"]),
    pair("Tell me every sound in trust.", ["t r u s t", "/t/ /r/ /u/ /s/ /t/"], "Tell me every sound in blend.", ["b l e n d", "/b/ /l/ /e/ /n/ /d/"]),
    pair("Say flight without /f/.", ["light"], "Say prize without /p/.", ["rise"]),
    pair("Say plant without /l/.", ["pant"], "Say crash without /r/.", ["cash"]),
    pair("Change the /p/ in plan to /k/. What word now?", ["clan"], "Change the /b/ in brag to /d/. What word now?", ["drag"]),
    pair("Change the /r/ in brush to /l/. What word now?", ["blush"], "Change the /l/ in slip to /k/. What word now?", ["skip"]),
    pair("Change the /d/ in slide to /m/. What word now?", ["slime"], "Change the /n/ in rain to /d/. What word now?", ["raid"])
  ]),
  "2-EOY": Object.freeze([
    pair("Say helicopter in parts.", ["hel i cop ter", "hel-i-cop-ter"], "Say calculator in parts.", ["cal cu la tor", "cal-cu-la-tor"]),
    pair("Say disagreement without dis.", ["agreement"], "Say rereading without re.", ["reading"]),
    pair("What vowel sound do you hear in cloud?", ["ou", "ow", "/ou/", "/aʊ/"], "What vowel sound do you hear in point?", ["oi", "oy", "/oi/", "/ɔɪ/"]),
    pair("Blend /s/ /k/ /r/ /a/ /p/.", ["scrap"], "Blend /s/ /p/ /l/ /i/ /t/.", ["split"]),
    pair("Tell me every sound in strand.", ["s t r a n d", "/s/ /t/ /r/ /a/ /n/ /d/"], "Tell me every sound in splint.", ["s p l i n t", "/s/ /p/ /l/ /i/ /n/ /t/"]),
    pair("Say spout without /s/.", ["pout"], "Say crease without /k/.", ["Reese", "reese"]),
    pair("Say plant without /l/.", ["pant"], "Say crash without /r/.", ["cash"]),
    pair("Change the /k/ in crab to /g/. What word now?", ["grab"], "Change the /t/ in track to /k/. What word now?", ["crack"]),
    pair("Change the /r/ in brush to /l/. What word now?", ["blush"], "Change the /l/ in slip to /k/. What word now?", ["skip"]),
    pair("Change the /l/ in glass to /r/. What word now?", ["grass"], "Change the /r/ in frog to /l/. What word now?", ["flog"]),
    pair("Change the vowel sound in boat to long /ē/. What word now?", ["beat"], "Change the vowel sound in team to long /ā/. What word now?", ["tame"]),
    pair("Say field without /d/.", ["feel"], "Say seat without /t/.", ["see"])
  ])
});

// Each entry is [Form B word, B sentence, B plausible spellings,
//                Form C word, C sentence, C plausible spellings].
export const EL_PARALLEL_ENCODING_CONTENT = Object.freeze({
  "K-BOY": [
    ["an", "I see an ant.", [], "am", "I am ready.", []],
    ["as", "It is as big as me.", [], "at", "Look at the cup.", []],
    ["cat", "The cat can nap.", [], "van", "The van is red.", []],
    ["pig", "The pig is big.", [], "fin", "The fish has a fin.", []],
    ["rug", "The rug is soft.", [], "mud", "The boot has mud.", []],
    ["hen", "The hen is in the pen.", [], "jet", "The jet can fly.", []],
    ["fox", "The fox can run.", ["foks"], "log", "The log is wet.", []],
    ["bus", "The bus is here.", [], "gum", "The gum is pink.", []]
  ],
  "K-MOY": [
    ["ham", "We had ham for lunch.", [], "tap", "Turn off the tap.", []],
    ["pen", "Use the red pen.", [], "peg", "Hang it on a peg.", []],
    ["fin", "The fish has a fin.", [], "zip", "Zip the bag.", []],
    ["box", "Put it in the box.", ["boks"], "fox", "The fox ran.", ["foks"]],
    ["bun", "The bun is soft.", [], "cub", "The bear cub slept.", []],
    ["bag", "Pack the bag.", [], "ram", "The ram stood still.", []],
    ["leg", "My leg is sore.", [], "web", "The spider made a web.", []],
    ["gum", "The gum is sticky.", [], "hut", "The hut is small.", []]
  ],
  "K-EOY": [
    ["fish", "The fish can swim.", [], "wish", "Make a wish.", []],
    ["cash", "Put the cash away.", [], "dash", "Make a quick dash.", []],
    ["dish", "Wash the dish.", [], "chip", "The cup has a chip.", []],
    ["spot", "Stand on the spot.", [], "drop", "A drop fell.", []],
    ["flag", "The flag is red.", [], "plan", "We made a plan.", []],
    ["tent", "The tent is dry.", [], "bend", "Bend the wire.", []],
    ["bump", "The road has a bump.", [], "dust", "Wipe off the dust.", []],
    ["sing", "We can sing.", [], "king", "The king wore a crown.", []]
  ],
  "1-BOY": [
    ["chop", "Chop the carrots.", [], "moth", "A moth landed.", []],
    ["rush", "Do not rush.", [], "such", "It was such a surprise.", []],
    ["path", "Stay on the path.", [], "cash", "Put the cash away.", []],
    ["clap", "Clap your hands.", [], "grab", "Grab the rope.", []],
    ["frog", "The frog jumped.", [], "plot", "We have a small garden plot.", []],
    ["sand", "The sand felt warm.", [], "lamp", "Turn on the lamp.", []],
    ["pink", "The shell is pink.", [], "silk", "The silk felt smooth.", []],
    ["last", "I came last.", [], "camp", "We set up camp.", []]
  ],
  "1-MOY": [
    ["name", "Write your name.", [], "wave", "Give a wave.", []],
    ["time", "It is time to go.", [], "ride", "We went for a ride.", []],
    ["hope", "I hope it is sunny.", [], "note", "Write a note.", ["noat"]],
    ["tune", "Hum the tune.", [], "cute", "The puppy is cute.", []],
    ["sail", "The boat will sail.", ["sale"], "paid", "I paid for the book.", ["pade"]],
    ["weed", "Pull the weed.", [], "keep", "Keep the card.", []],
    ["road", "Cross the road.", ["rode"], "foam", "The foam was white.", ["fome"]],
    ["stay", "Please stay here.", [], "day", "It was a bright day.", []]
  ],
  "1-EOY": [
    ["park", "We played at the park.", [], "star", "The star was bright.", []],
    ["girl", "The girl waved.", ["gurl"], "shirt", "The shirt is clean.", ["shert"]],
    ["hurt", "My knee did not hurt.", ["hert"], "curl", "The leaf began to curl.", ["kerl"]],
    ["soil", "The soil was dark.", [], "point", "Point to the door.", []],
    ["house", "The house is tall.", ["hows"], "brown", "The dog is brown.", ["broun"]],
    ["spoon", "Use a spoon.", [], "boot", "The boot is wet.", []],
    ["raincoat", "Wear your raincoat.", [], "campfire", "The campfire was warm.", []],
    ["helping", "She is helping us.", [], "rested", "The dog rested.", []]
  ],
  "2-BOY": [
    ["rabbit", "The rabbit hid.", [], "button", "The button fell off.", []],
    ["picnic", "We packed a picnic.", [], "velvet", "The velvet felt soft.", []],
    ["helper", "The helper carried books.", [], "singer", "The singer smiled.", []],
    ["useful", "The map was useful.", [], "grateful", "We felt grateful.", []],
    ["running", "The child is running.", [], "swimming", "We are swimming.", []],
    ["jumped", "The cat jumped down.", [], "melted", "The ice melted.", []],
    ["unlock", "Please unlock the gate.", [], "unpack", "We can unpack now.", []],
    ["boxes", "Move the boxes.", [], "dishes", "Wash the dishes.", []]
  ],
  "2-MOY": [
    ["reader", "The reader chose a book.", [], "sailor", "The sailor tied a rope.", []],
    ["cheerful", "The class felt cheerful.", ["cheerfull"], "dreamless", "It was a dreamless sleep.", ["dreemless"]],
    ["misplace", "Do not misplace the key.", [], "inside", "Wait inside the hall.", []],
    ["neatly", "We stacked the books neatly.", [], "deeply", "The child breathed deeply.", []],
    ["sadness", "The story showed sadness.", [], "softness", "Feel the softness.", []],
    ["preheat", "Please preheat the oven.", [], "repaint", "We will repaint the wall.", []],
    ["fearful", "The rabbit seemed fearful.", ["feerful"], "harmful", "The smoke is harmful.", ["harmfull"]],
    ["payment", "The payment was due.", ["paiment"], "treatment", "The treatment helped.", [], { b: ["suffix", "vowel_team"], c: ["suffix", "vowel_team"] }]
  ],
  "2-EOY": [
    ["departure", "The departure was delayed.", [], "furniture", "The furniture was moved.", []],
    ["misbehave", "The puppies may misbehave.", [], "disappear", "The tracks may disappear.", []],
    ["unhelpful", "The clue was unhelpful.", [], "disagreement", "The disagreement ended.", [], { b: ["prefix", "suffix", "multisyllable"], c: ["prefix", "suffix", "multisyllable"] }],
    ["appointment", "The appointment is today.", ["apointment"], "employment", "The job offered employment.", []],
    ["incorrect", "That answer is incorrect.", [], "impatient", "The child felt impatient.", []],
    ["celebration", "The celebration began.", ["celebrashun"], "operation", "The operation was careful.", ["operashun"]],
    ["carelessness", "Carelessness caused the spill.", [], "thoughtfulness", "Her thoughtfulness helped.", []],
    ["easily", "The lid opened easily.", [], "angrily", "The dog barked angrily.", []]
  ]
});

export const EL_PARALLEL_DECODING_WORDS = Object.freeze({
  b: Object.freeze({
    middle_pre: ["at", "if", "in", "it", "on", "up", "ran", "tap"],
    early_partial: ["dad", "lap", "net", "yes", "rib", "pot", "hut", "mug"],
    middle_partial: ["tack", "fell", "miss", "lock", "luck", "tax", "fuzz", "quiz"],
    late_partial: ["shop", "chip", "with", "when", "spin", "glad", "pond", "mask"],
    early_full: ["shift", "chimp", "think", "chomp", "split", "trust", "spent", "frost"],
    middle_full: ["late", "five", "bone", "rule", "wait", "team", "soap", "gray"],
    late_full: ["fork", "herd", "third", "curl", "boil", "toy", "mouth", "broom"],
    early_consolidated: ["sunfish", "muffin", "cactus", "bathtub", "magnet", "robin", "singer", "rested"],
    middle_consolidated: ["playful", "hopping", "filled", "dislike", "teacher", "careless", "mended", "reread"],
    late_consolidated: ["beautiful", "tomorrow", "magician", "peacefulness", "preplan", "misunderstand", "excitement", "safely"]
  }),
  c: Object.freeze({
    middle_pre: ["an", "if", "in", "it", "on", "up", "pan", "cab"],
    early_partial: ["dam", "cap", "men", "vet", "dip", "sob", "fun", "nut"],
    middle_partial: ["pack", "sell", "fill", "rock", "tuck", "max", "muff", "quill"],
    late_partial: ["shut", "chop", "bath", "whim", "frog", "clap", "tent", "soft"],
    early_full: ["fresh", "lunch", "thump", "shrink", "strap", "drift", "grand", "blast"],
    middle_full: ["made", "like", "rose", "huge", "train", "green", "goal", "clay"],
    late_full: ["short", "term", "girl", "hurt", "coin", "joy", "house", "food"],
    early_consolidated: ["sunset", "rabbit", "napkin", "backpack", "insect", "tiger", "painter", "hunted"],
    middle_consolidated: ["joyful", "waving", "packed", "unfair", "farmer", "fearless", "called", "refill"],
    late_consolidated: ["colorful", "yesterday", "comedian", "helpfulness", "pregame", "misremember", "enjoyment", "slowly"]
  })
});

const passage = (title, text) => Object.freeze({ title, text });

export const EL_PARALLEL_FLUENCY_CONTENT = Object.freeze({
  b: Object.freeze({
    middle_pre: passage("The Map in the Bag", "Ben has a map in a bag. He puts the bag on a bed. A cat sits on the bag. Ben pats the cat. The cat hops off, and Ben gets the map. It has a red dot on it. Ben can tap the dot. The dot is by a hut. Ben can see the hut from his home. He puts the map in the bag. Then he gets his cap. Ben and his dad can go to the hut. The cat has a nap on the bed."),
    early_partial: passage("The Mud on the Rug", "Pam has a tan rug by a red mat. Her dog runs in with mud on his legs. He sits on the rug. Pam gets a rag and a tub. She can rub the mud off the dog. Her mom can help with the rug. They put the wet rug in the sun. Pam has a pet bed for the dog. He sits in it and has a nap. The rug can dry in the sun. Pam puts the rag by the tub and sits with her dog."),
    middle_partial: passage("The Duck in the Box", "Ross has a duck that likes to sit in a box. The box has a soft pad in it. One day, the duck gets wet. Ross puts a thick cloth in the box and sets it by the sun. The duck hops in and gives a little quack. Ross sits on a log to watch. A bug lands on his neck. He flicks it off. The duck comes out to peck at the bug. Soon the duck goes back in the box. Ross shuts the gate so the duck can rest."),
    late_partial: passage("The Flag at Camp", "Glen and Kim help put up a flag at camp. Glen grips the pole while Kim clips the flag to it. A strong gust makes the flag flap. The pole tips, and Glen calls for help. Kim fetches Dad. He digs a deep hole and sets the pole in it. Glen packs mud by the pole to hold it still. Then Kim tugs on the flag. This time the pole stands firm. They step back to check their work. The flag snaps in the wind as the rest of the group come to camp. Dad nods."),
    early_full: passage("A Shelter for the Plants", "A gust of wind bends the stems in the class plant bed. The class plans a shelter to block the wind. Trent brings thick sticks, and Beth gets a strip of mesh. They press the sticks into the mud and stretch the mesh from end to end. At first, the mesh sags. Beth lifts it while Trent clips it to each stick. Then they add a strip at the back. The next gust hits the mesh, but the plants stay still. The class checks that light and rain can still reach the bed. Their small shelter has done its job."),
    middle_full: passage("The Boat Race", "Three teams meet beside the stream to test small boats. Mia makes a green boat from folded card. Jose uses a wide leaf, and Ruby shapes one from clay. They place each boat behind a stone line. At the same time, they let go. The leaf boat rides the fast stream first. Mia's card boat follows, but a wave turns it sideways. The clay boat moves slowly and sinks near a reed. Jose cheers when the leaf reaches the bridge. The teams make notes about shape and weight. Then they trade materials and create new boats for one more careful race. Each team hopes to improve."),
    late_full: passage("The Storm Lantern", "During a summer storm, Nora hears thunder roll beyond the farm. Rain pounds the roof, and the power turns off. Her father finds a lantern in the hall cupboard. Nora carries it to the porch while he checks the doors. The warm light makes a golden circle around them. A branch has fallen across the garden path, but the young trees are safe. They hear a frightened bird flutter under a chair. Nora sets a dry towel near it and steps back. Soon the bird darts toward the barn. When the storm moves north, the moon shines through a break in the clouds, and the lights return. Everyone feels calm again."),
    early_consolidated: passage("Building a Bird Table", "The children want to watch birds from their classroom window, so they decide to build a feeding table. First, they measure a square board and mark the center. Their teacher helps them attach four short rails around the edge. Two children sand the rough corners while another team paints the wooden post. When every part is dry, they fasten the board on top. Outside, they press the post deep into the garden soil. They scatter seeds, crushed nuts, and small pieces of apple on the table. The next morning, a blackbird lands first. Sparrows follow and share the food. The class records each visitor in a notebook and plans to refill the table every Friday."),
    middle_consolidated: passage("The Reusable Lunch Challenge", "Our class noticed that the lunch bins filled with wrappers every afternoon. We decided to reduce the waste for one week. First, everyone recorded each wrapper, carton, and plastic bag. Then we discussed reusable choices. Some students packed sandwiches in small boxes. Others brought metal bottles or washable cloth napkins. By Wednesday, the rubbish bin was only half full. On Friday, we counted again and compared both totals. The class had prevented more than one hundred pieces of waste. We displayed the results beside the cafeteria and invited another class to repeat the challenge. Their teacher agreed, so we prepared a simple checklist and explained which changes had helped most. We also promised to measure the results again next month."),
    late_consolidated: passage("Why Wetlands Matter", "Wetlands may look like muddy, unimportant places, but they perform several remarkable jobs. During heavy rain, wetland plants slow the moving water and reduce flooding downstream. Their tangled roots also trap soil that might otherwise wash into rivers. This filtration creates cleaner water for fish, birds, insects, and nearby communities. Wetlands provide shelter and breeding areas for many animals, including species that cannot survive elsewhere. Unfortunately, construction and pollution have destroyed large wetland areas. Restoration teams can reverse some damage by reopening natural channels, removing waste, and planting native reeds. Protecting these environments is practical as well as responsible because a healthy wetland supports wildlife while making the surrounding landscape safer for people. Careful monitoring helps communities recognize improvements and respond quickly when new threats appear." )
  }),
  c: Object.freeze({
    middle_pre: passage("The Red Cap", "Meg has a red cap. She puts it on a bed. Her cat sits on the cap. Meg can pat the cat, but the cat will not get up. Meg gets a cup. She puts it on a mat for the cat. The cat gets up and has a sip. Meg can get the cap. She puts it on and sits by the cat. The cat is on the mat. Meg can rub its back. Then the cat has a nap, and Meg sits in the sun."),
    early_partial: passage("The Hen and the Cup", "Jen has a hen in a pen. Each day, Jen puts a cup of food in the pen. The hen can peck at it. One day, the cup is not in the pen. Jen looks by a log and in a tub. She can see a red cup, but it is not the hen's cup. Her dad has it. He can fill it and put it back. Jen pats the hen. The hen has its food. Jen and her dad sit on the log as the sun sets."),
    middle_partial: passage("The Picnic Sack", "Nell has a sack with six buns in it. She puts the sack by a rock. Dad has a cup and a pot of jam. They sit on a log for a picnic. A gust hits the sack, and a bun tips out. It lands in the grass. Nell picks it up, but it has mud on it. She puts that bun in a box to take home. Dad gets a clean bun from the sack. Nell has jam on her bun. They pack the cups and put the box back in the sack."),
    late_partial: passage("The Frog by the Bench", "Ruth and Jim sit on a bench by the pond. A small frog hops from the grass to a flat rock. Jim bends to look at it. Ruth asks him to stay back so the frog can rest. They spot its thin legs and wide mouth. Jim gets a pad from his bag and sketches the frog. A duck swims past with a splash. The frog jumps into the pond. Ruth and Jim watch it swim to the far bank. Then they put the pad in the bag and head back up the path to class."),
    early_full: passage("The Track in the Sand", "Frank and Ash spot a track in the sand by the pond. A thin line runs between two sets of prints. They crouch to look but do not touch it. Ash thinks a bird made the track. Frank points to the line in the middle. Could it be a tail mark? They scan the bank and find a small lizard by a stump. It darts into a crack, leaving a fresh track. Ash checks the new prints against the first set. They match. Frank sketches the tracks in a pad so the class can discuss what made the tracks in the sand."),
    middle_full: passage("A Day at the Beach", "Kai and Elena reach the beach before the tide is high. They carry a striped shade, two spades, and a pail. Kai digs a deep channel while Elena shapes a round wall of sand. Small waves creep closer and fill the channel. They place shells along the wall and make a gate for the water. A larger wave breaks through and flattens one side. Instead of giving up, they study the marks and build a wider base. Their next wall stays firm through three waves. When the tide begins to fall, they smooth the sand, gather their things, and stroll home along the coast. They smile."),
    late_full: passage("The Bird Count", "Early on Saturday, Priya joins a bird count in the park. Her group follows a curved path through tall ferns and around a quiet pond. At first, they hear only the chirp of a sparrow. Then two bright finches swoop toward a feeder. Priya records each kind and the number seen. Near the north gate, a woodpecker drums against an old tree. Farther along, a heron stands in shallow water and watches for fish. The group pauses under an oak to compare notes. Their careful count will help the park team learn which birds return each season and which habitats need more protection. They plan another count in early spring."),
    early_consolidated: passage("Testing Paper Towers", "Each science team receives ten sheets of paper and a short strip of tape. Their challenge is to build the tallest tower that can hold a small book. At first, one team stacks folded sheets, but the tower bends quickly. Another team rolls paper into tubes and joins three tubes at the base. Their structure stands longer, although the top still leans. The children compare both designs and notice that wide bases provide better support. They rebuild the second tower with four tubes below and two above. This time, the book remains balanced for a full minute. Everyone sketches the final design, labels the strongest parts, and explains how testing helped improve the tower. Success!"),
    middle_consolidated: passage("Restoring the School Garden", "After winter, the school garden looked untidy and overgrown. Our class created a restoration plan before planting anything new. One group removed litter and separated materials for recycling. Another loosened the soil and mixed in compost. Students trimmed dead stems but left healthy roots undisturbed. Next, we replanted herbs that had spread across the path. We added labels so younger classes could identify each plant. Finally, we installed a water barrel beneath the shed gutter. Rain collected overnight and supplied enough water for every bed. Within three weeks, fresh leaves appeared, insects returned, and the garden became a useful outdoor classroom again. We wrote instructions so future classes could maintain each improvement. The plan included a weekly watering schedule for summer."),
    late_consolidated: passage("How Animals Adapt to Cities", "As cities expand, some animals disappear, while others adjust in surprising ways. Foxes may search gardens for food after dark, when streets are quieter. Peregrine falcons nest on tall buildings because ledges resemble the cliffs they use in the wild. Certain birds change the pitch of their songs so calls can be heard above traffic. These adaptations help individuals survive, but city life still creates serious dangers. Artificial light can confuse migrating birds, and discarded plastic can injure many species. Communities can improve urban habitats by planting native flowers, protecting mature trees, reducing nighttime lighting, and securing rubbish. Thoughtful planning allows people and wildlife to share space more safely, even in densely populated neighborhoods. Regular surveys reveal whether these practical changes create lasting improvements for local wildlife." )
  })
});
