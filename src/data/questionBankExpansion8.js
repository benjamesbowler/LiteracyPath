import { getChildWordAsset } from "./childAssets.js";

const adjectiveItems = [
  ["qb8_adj_01", "Which word best describes the blanket?", "soft", ["soft", "runs", "under", "jump"]],
  ["qb8_adj_02", "Which word best describes the soup?", "warm", ["warm", "table", "beside", "walk"]],
  ["qb8_adj_03", "Which word best describes the lemon?", "sour", ["sour", "sleep", "between", "paper"]],
  ["qb8_adj_04", "Which word best describes the mountain?", "tall", ["tall", "carry", "under", "pencil"]],
  ["qb8_adj_05", "Which word best describes the feather?", "light", ["light", "run", "inside", "basket"]],
  ["qb8_adj_06", "Which word best describes the rock?", "heavy", ["heavy", "write", "behind", "garden"]],
  ["qb8_adj_07", "Which word best describes the road?", "bumpy", ["bumpy", "think", "above", "window"]],
  ["qb8_adj_08", "Which word best describes the lake?", "calm", ["calm", "climb", "near", "folder"]],
  ["qb8_adj_09", "Which word best describes the puppy?", "playful", ["playful", "beside", "teacher", "open"]],
  ["qb8_adj_10", "Which word best describes the hallway?", "quiet", ["quiet", "share", "inside", "marker"]],
  ["qb8_adj_11", "Which word best describes the apple?", "crisp", ["crisp", "before", "draw", "chair"]],
  ["qb8_adj_12", "Which word best describes the pillow?", "fluffy", ["fluffy", "listen", "between", "class"]],
  ["qb8_adj_13", "Which word best describes the box?", "empty", ["empty", "dance", "over", "rain"]],
  ["qb8_adj_14", "Which word best describes the basket of berries?", "full", ["full", "read", "below", "string"]],
  ["qb8_adj_15", "Which word best describes the shell?", "smooth", ["smooth", "push", "near", "lesson"]],
  ["qb8_adj_16", "Which word best describes the cactus?", "prickly", ["prickly", "under", "borrow", "story"]],
  ["qb8_adj_17", "Which word best describes the scarf?", "striped", ["striped", "inside", "build", "ticket"]],
  ["qb8_adj_18", "Which word best describes the morning sky?", "bright", ["bright", "between", "carry", "notebook"]],
  ["qb8_adj_19", "Which word best describes the old coin?", "shiny", ["shiny", "around", "march", "river"]],
  ["qb8_adj_20", "Which word best describes the tiny seed?", "small", ["small", "beside", "explain", "clock"]],
  ["qb8_adj_21", "Which word best describes the long rope?", "long", ["long", "through", "answer", "map"]],
  ["qb8_adj_22", "Which word best describes the cold drink?", "cold", ["cold", "behind", "collect", "field"]]
];

const prepositionItems = [
  ["qb8_prep_01", "Where is the pencil? The pencil is ___ the notebook.", "under", ["under", "yellow", "write", "pencil"]],
  ["qb8_prep_02", "Where is the clock? The clock is ___ the shelf.", "above", ["above", "small", "read", "clock"]],
  ["qb8_prep_03", "Where is the rug? The rug is ___ the table.", "beneath", ["beneath", "happy", "draw", "rug"]],
  ["qb8_prep_04", "Where is the backpack? The backpack is ___ the chair.", "behind", ["behind", "green", "listen", "backpack"]],
  ["qb8_prep_05", "Where is the cup? The cup is ___ the plate.", "beside", ["beside", "soft", "share", "cup"]],
  ["qb8_prep_06", "Where is the ball? The ball is ___ the box.", "inside", ["inside", "quick", "jump", "ball"]],
  ["qb8_prep_07", "Where is the bird? The bird is ___ the branch.", "on", ["on", "blue", "sing", "bird"]],
  ["qb8_prep_08", "Where is the bridge? The bridge goes ___ the stream.", "over", ["over", "quiet", "count", "bridge"]],
  ["qb8_prep_09", "Where is the path? The path goes ___ the trees.", "through", ["through", "warm", "paint", "path"]],
  ["qb8_prep_10", "Where is the line? The line is ___ the door.", "near", ["near", "funny", "carry", "line"]],
  ["qb8_prep_11", "Where is the cat? The cat is ___ the pillows.", "between", ["between", "round", "sleep", "cat"]],
  ["qb8_prep_12", "Where is the kite? The kite is ___ the house.", "above", ["above", "sweet", "fold", "kite"]],
  ["qb8_prep_13", "Where is the marker? The marker is ___ the desk.", "on", ["on", "soft", "march", "marker"]],
  ["qb8_prep_14", "Where is the toy car? The toy car rolled ___ the couch.", "under", ["under", "tall", "whisper", "car"]],
  ["qb8_prep_15", "Where is the photo? The photo hangs ___ the window.", "beside", ["beside", "heavy", "skip", "photo"]],
  ["qb8_prep_16", "Where is the worm? The worm is ___ the soil.", "below", ["below", "bright", "smile", "worm"]],
  ["qb8_prep_17", "Where is the flag? The flag is ___ the school.", "outside", ["outside", "crisp", "read", "flag"]],
  ["qb8_prep_18", "Where is the class? The class is ___ the library.", "inside", ["inside", "tiny", "run", "class"]],
  ["qb8_prep_19", "Where is the trail? The trail curves ___ the pond.", "around", ["around", "striped", "help", "trail"]],
  ["qb8_prep_20", "Where is the bell? The bell hangs ___ the door.", "above", ["above", "sour", "build", "bell"]],
  ["qb8_prep_21", "Where is the bus? The bus stops ___ the school.", "near", ["near", "bumpy", "write", "bus"]],
  ["qb8_prep_22", "Where is the bookmark? The bookmark is ___ two pages.", "between", ["between", "calm", "dance", "bookmark"]],
  ["qb8_prep_23", "Where is the microphone? The microphone is ___ the speaker.", "near", ["near", "polite", "solve", "microphone"]],
  ["qb8_prep_24", "Where is the paper clip? The paper clip is ___ the papers.", "on", ["on", "careful", "explain", "clip"]],
  ["qb8_prep_25", "Where is the sign? The sign stands ___ the door.", "outside", ["outside", "honest", "measure", "sign"]],
  ["qb8_prep_26", "Where is the tunnel? The tunnel goes ___ the hill.", "through", ["through", "curious", "observe", "tunnel"]],
  ["qb8_prep_27", "Where is the scarf? The scarf is wrapped ___ the neck.", "around", ["around", "gentle", "compare", "scarf"]],
  ["qb8_prep_28", "Where is the stool? The stool is ___ the sink.", "below", ["below", "brave", "predict", "stool"]],
  ["qb8_prep_29", "Where is the bicycle? The bicycle is parked ___ the fence.", "beside", ["beside", "proud", "repair", "bicycle"]],
  ["qb8_prep_30", "Where is the note? The note is tucked ___ the folder.", "inside", ["inside", "clear", "describe", "note"]],
  ["qb8_prep_31", "Where is the bench? The bench sits ___ the tree.", "under", ["under", "patient", "estimate", "bench"]],
  ["qb8_prep_32", "Where is the rainbow? The rainbow arcs ___ the field.", "over", ["over", "fair", "collect", "rainbow"]]
];

const advancedPassageSets = [
  {
    skill: "inference",
    prefix: "qb8_infer",
    passage: "On Monday, the class fish tank looked cloudy. Maya noticed that the filter was quiet, even though it usually made a soft hum. She wrote a note for the teacher before morning meeting began. By afternoon, the filter was humming again and the water looked clearer. Maya smiled when the fish swam out from behind the plant.",
    questions: [
      ["What can you infer Maya noticed first?", "something was wrong with the tank filter", ["something was wrong with the tank filter", "the fish needed a new plant", "the class had no meeting", "the water was too cold"], "The passage says the filter was quiet when it usually hummed."],
      ["Why did Maya write a note?", "to let the teacher know about the tank problem", ["to let the teacher know about the tank problem", "to ask for a new pencil", "to change the morning meeting", "to feed the fish candy"], "Her note helped the adult know the filter needed attention."],
      ["How did Maya probably feel at the end?", "relieved", ["relieved", "jealous", "confused about lunch", "angry at the plant"], "The tank improved and Maya smiled."]
    ]
  },
  {
    skill: "inference",
    prefix: "qb8_infer",
    passage: "Theo carried two library books to the return bin. He paused when he saw the poster for the reading challenge. Only one blank star was left beside his name. Instead of going outside right away, he chose a short mystery book and sat near the window. When recess ended, he was already on chapter three.",
    questions: [
      ["What can you infer about Theo?", "he wants to finish the reading challenge", ["he wants to finish the reading challenge", "he dislikes mystery books", "he lost his library card", "he plans to skip class"], "He notices one blank star and starts another book immediately."],
      ["Why did Theo choose a short book?", "he could read it quickly for the challenge", ["he could read it quickly for the challenge", "it was too heavy to carry", "the cover was blank", "the window told him to"], "The challenge clue makes the short book choice meaningful."],
      ["Which clue best supports the inference?", "only one blank star was left beside his name", ["only one blank star was left beside his name", "the bin was in the library", "the book was a mystery", "recess ended later"], "That clue shows he is close to finishing."]
    ]
  },
  {
    skill: "main idea",
    prefix: "qb8_main",
    passage: "Some animals change their behavior when seasons change. Squirrels gather nuts before winter. Birds may fly to warmer places when food becomes hard to find. Bears eat extra food before resting for a long time. These changes help animals survive when the weather is cold.",
    questions: [
      ["What is the main idea of the passage?", "animals prepare for seasonal changes in different ways", ["animals prepare for seasonal changes in different ways", "all animals sleep through winter", "birds gather nuts under trees", "cold weather helps food grow"], "Every detail explains a way animals respond to changing seasons."],
      ["Which title fits best?", "How Animals Get Ready for Winter", ["How Animals Get Ready for Winter", "The Fastest Flying Bird", "A Bear's Favorite Berry", "Why Trees Drop Leaves"], "The whole paragraph is about animal preparation."],
      ["Which detail supports the main idea?", "squirrels gather nuts before winter", ["squirrels gather nuts before winter", "food is easy to find in snow", "all animals live in caves", "birds never leave home"], "This is one example of seasonal preparation."]
    ]
  },
  {
    skill: "main idea",
    prefix: "qb8_main",
    passage: "A good classroom helper watches for what needs to be done. One student may pass out papers while another checks that chairs are pushed in. Helpers can also remind friends to recycle scraps after art. These jobs are small, but they help the classroom run smoothly and make everyone feel responsible.",
    questions: [
      ["What is the main idea?", "classroom helpers do small jobs that support the whole class", ["classroom helpers do small jobs that support the whole class", "papers should never be passed out", "art scraps belong on the floor", "chairs are the only classroom job"], "All details show small helpful classroom responsibilities."],
      ["Which detail supports the main idea?", "helpers remind friends to recycle scraps", ["helpers remind friends to recycle scraps", "students never need jobs", "chairs can talk", "paper is always blue"], "It is one example of helping the class."],
      ["Which title fits best?", "Small Jobs That Help Everyone", ["Small Jobs That Help Everyone", "The Longest Paper Line", "A Chair in the Hall", "The Art Scrap Mystery"], "The title matches the main idea about helpful jobs."]
    ]
  },
  {
    skill: "context clues",
    prefix: "qb8_context",
    passage: "The trail was narrow, so hikers walked in a single line. Branches brushed their sleeves as they moved carefully between the trees. When the path finally opened into a wide meadow, everyone had room to walk side by side. The guide said the narrow part helped protect the plants near the trail.",
    questions: [
      ["What does narrow mean in the passage?", "not wide", ["not wide", "very loud", "full of water", "easy to carry"], "The hikers had to walk in a single line."],
      ["Which clue helps you understand narrow?", "hikers walked in a single line", ["hikers walked in a single line", "the guide spoke", "plants grew nearby", "the meadow was pretty"], "Single line shows the trail did not have much width."],
      ["What is the opposite of narrow here?", "wide", ["wide", "quiet", "dark", "smooth"], "The passage contrasts narrow trail with wide meadow."]
    ]
  },
  {
    skill: "context clues",
    prefix: "qb8_context",
    passage: "Lina handled the old photograph with care because it was fragile. The paper had tiny cracks near the edges, and the corners bent easily. She placed it in a clear sleeve before adding it to the family history board. Her uncle said fragile things can break or tear if people rush.",
    questions: [
      ["What does fragile mean?", "easy to damage", ["easy to damage", "very noisy", "newly painted", "hard to find"], "The photograph had cracks and could tear."],
      ["Which clue helps explain fragile?", "the corners bent easily", ["the corners bent easily", "the board was about family", "Lina had an uncle", "the sleeve was clear"], "Something that bends or cracks easily is fragile."],
      ["Why did Lina use a clear sleeve?", "to protect the photograph", ["to protect the photograph", "to make it heavier", "to hide the picture", "to change its color"], "The sleeve protects something fragile."]
    ]
  },
  {
    skill: "theme",
    prefix: "qb8_theme",
    passage: "Nia wanted the biggest part in the class play, but she was chosen to make sound effects. At first she felt disappointed. During practice, she discovered that the rainstick and drum helped the story feel real. On performance day, the audience clapped when thunder boomed at just the right moment. Nia bowed with the actors.",
    questions: [
      ["What lesson does Nia learn?", "every role can matter", ["every role can matter", "only actors help a play", "drums should be hidden", "rain is always loud"], "Her sound effects helped the performance."],
      ["Which detail supports the theme?", "the audience clapped when thunder boomed", ["the audience clapped when thunder boomed", "Nia wanted a big part", "practice happened before the show", "the rainstick was in class"], "The audience reaction shows her role mattered."],
      ["What is the best theme?", "small contributions can make a big difference", ["small contributions can make a big difference", "never join a play", "loud sounds are always best", "actors should not bow"], "The story values a less obvious contribution."]
    ]
  },
  {
    skill: "theme",
    prefix: "qb8_theme",
    passage: "Ravi found a wallet near the soccer field. He saw money inside and thought about the new comic he wanted. Then he noticed a library card with Mrs. Bell's name. Ravi took the wallet to the office. Later, Mrs. Bell thanked him and said the photos inside meant even more than the money.",
    questions: [
      ["What is the best lesson of the story?", "honesty is more important than getting what you want", ["honesty is more important than getting what you want", "comic books are never fun", "wallets should stay outside", "library cards are money"], "Ravi chooses to return the wallet instead of keeping it."],
      ["Which detail supports the theme?", "Ravi took the wallet to the office", ["Ravi took the wallet to the office", "the field was for soccer", "Mrs. Bell had photos", "the comic was new"], "His action shows honesty."],
      ["Why do the photos matter in the ending?", "they show the wallet held personal things", ["they show the wallet held personal things", "they were worth many coins", "they were library books", "they proved soccer was over"], "The ending helps readers see why returning the wallet mattered."]
    ]
  },
  {
    skill: "cause and effect",
    prefix: "qb8_cause",
    passage: "The class opened the windows after lunch because the room felt stuffy. A breeze moved through the room and lifted the corner of the science chart. When the chart slipped from the wall, students helped tape it back more firmly. After that, they clipped the bottom corners so the paper would stay flat.",
    questions: [
      ["Why did the class open the windows?", "the room felt stuffy", ["the room felt stuffy", "the chart was missing", "the tape was new", "lunch was outside"], "The passage gives the reason directly."],
      ["What happened because the breeze came in?", "the chart began to slip from the wall", ["the chart began to slip from the wall", "students went home", "lunch started", "the windows closed themselves"], "The breeze moved the chart."],
      ["Why did students clip the bottom corners?", "to keep the chart flat", ["to keep the chart flat", "to make the paper shorter", "to hide the science words", "to open the window"], "They learned from the slipping chart."]
    ]
  },
  {
    skill: "cause and effect",
    prefix: "qb8_cause",
    passage: "The soccer field was muddy after two days of rain. Coach Rivera moved practice to the blacktop so the grass would not be damaged. Players used softer passes because the ball bounced faster on the hard surface. By the end, everyone understood why practice felt different from usual.",
    questions: [
      ["What caused practice to move to the blacktop?", "the field was muddy", ["the field was muddy", "the ball was lost", "the team had no coach", "the sun was too bright"], "Rain made the field muddy."],
      ["Why did players use softer passes?", "the ball bounced faster on the blacktop", ["the ball bounced faster on the blacktop", "the grass grew taller", "the goal was closed", "the rain started again"], "The hard surface changed how the ball moved."],
      ["What was one effect of the rain?", "practice felt different from usual", ["practice felt different from usual", "no one could play soccer again", "the coach forgot the rules", "the ball became a book"], "The muddy field led to a different practice location."]
    ]
  }
];

const finalSoundItems = [
  ["qb8_final_01", "bed", "d", ["d", "g", "n", "p"]],
  ["qb8_final_02", "red", "d", ["d", "t", "m", "g"]],
  ["qb8_final_03", "lid", "d", ["d", "b", "n", "p"]],
  ["qb8_final_04", "web", "b", ["b", "d", "m", "t"]],
  ["qb8_final_05", "dog", "g", ["g", "p", "n", "t"]],
  ["qb8_final_06", "log", "g", ["g", "d", "m", "p"]],
  ["qb8_final_07", "mug", "g", ["g", "b", "n", "t"]],
  ["qb8_final_08", "jam", "m", ["m", "d", "p", "t"]],
  ["qb8_final_09", "ram", "m", ["m", "g", "n", "b"]],
  ["qb8_final_10", "sun", "n", ["n", "m", "p", "d"]],
  ["qb8_final_11", "pen", "n", ["n", "t", "g", "b"]],
  ["qb8_final_12", "cup", "p", ["p", "d", "m", "n"]],
  ["qb8_final_13", "map", "p", ["p", "g", "t", "b"]],
  ["qb8_final_14", "hat", "t", ["t", "p", "m", "g"]],
  ["qb8_final_15", "pot", "t", ["t", "d", "n", "b"]]
];

const advancedPhonics8 = [
  ["qb8_digraph_01", "digraphs", "digraphs", "sh", "Which word has the sh digraph?", "shell", ["shell", "sell", "cell", "bell"]],
  ["qb8_digraph_02", "digraphs", "digraphs", "sh", "Which word has the sh digraph?", "shine", ["shine", "line", "fine", "pine"]],
  ["qb8_digraph_03", "digraphs", "digraphs", "sh", "Which word has the sh digraph?", "shape", ["shape", "tape", "cape", "grape"]],
  ["qb8_digraph_04", "digraphs", "digraphs", "sh", "Which word has the sh digraph?", "brush", ["brush", "brag", "bring", "brim"]],
  ["qb8_digraph_05", "digraphs", "digraphs", "sh", "Which word has the sh digraph?", "flash", ["flash", "flag", "flat", "flap"]],
  ["qb8_digraph_06", "digraphs", "digraphs", "ch", "Which word has the ch digraph?", "lunch", ["lunch", "luck", "lamp", "leaf"]],
  ["qb8_digraph_07", "digraphs", "digraphs", "ch", "Which word has the ch digraph?", "bench", ["bench", "bend", "belt", "best"]],
  ["qb8_digraph_08", "digraphs", "digraphs", "ch", "Which word has the ch digraph?", "cheese", ["cheese", "please", "freeze", "tease"]],
  ["qb8_digraph_09", "digraphs", "digraphs", "ch", "Which word has the ch digraph?", "chase", ["chase", "case", "base", "vase"]],
  ["qb8_digraph_10", "digraphs", "digraphs", "ch", "Which word has the ch digraph?", "beach", ["beach", "beak", "beam", "bean"]],
  ["qb8_digraph_11", "digraphs", "digraphs", "th", "Which word has the th digraph?", "three", ["three", "tree", "free", "green"]],
  ["qb8_digraph_12", "digraphs", "digraphs", "th", "Which word has the th digraph?", "thank", ["thank", "tank", "bank", "rank"]],
  ["qb8_digraph_13", "digraphs", "digraphs", "th", "Which word has the th digraph?", "thorn", ["thorn", "corn", "horn", "fork"]],
  ["qb8_digraph_14", "digraphs", "digraphs", "th", "Which word has the th digraph?", "bath", ["bath", "back", "bag", "bat"]],
  ["qb8_digraph_15", "digraphs", "digraphs", "th", "Which word has the th digraph?", "tooth", ["tooth", "tool", "took", "tune"]],
  ["qb8_digraph_16", "digraphs", "digraphs", "wh", "Which word has the wh digraph?", "wheel", ["wheel", "feel", "peel", "heel"]],
  ["qb8_digraph_17", "digraphs", "digraphs", "wh", "Which word has the wh digraph?", "whisk", ["whisk", "wish", "wink", "wing"]],
  ["qb8_digraph_18", "digraphs", "digraphs", "wh", "Which word has the wh digraph?", "whisper", ["whisper", "winter", "winner", "window"]],
  ["qb8_digraph_19", "digraphs", "digraphs", "wh", "Which word has the wh digraph?", "white", ["white", "write", "kite", "bite"]],
  ["qb8_digraph_20", "digraphs", "digraphs", "wh", "Which word has the wh digraph?", "whale", ["whale", "sale", "tale", "male"]],
  ["qb8_long_01", "long vowels", "long_vowels_silent_e", "a_e", "Which word has a long a silent-e pattern?", "brave", ["brave", "brag", "brick", "brush"]],
  ["qb8_long_02", "long vowels", "long_vowels_silent_e", "a_e", "Which word has a long a silent-e pattern?", "plane", ["plane", "plant", "plum", "plug"]],
  ["qb8_long_03", "long vowels", "long_vowels_silent_e", "e_e", "Which word has a long e silent-e pattern?", "theme", ["theme", "them", "thin", "then"]],
  ["qb8_long_04", "long vowels", "long_vowels_silent_e", "e_e", "Which word has a long e silent-e pattern?", "complete", ["complete", "compost", "corner", "candle"]],
  ["qb8_long_05", "long vowels", "long_vowels_silent_e", "i_e", "Which word has a long i silent-e pattern?", "smile", ["smile", "smell", "small", "spill"]],
  ["qb8_long_06", "long vowels", "long_vowels_silent_e", "i_e", "Which word has a long i silent-e pattern?", "slide", ["slide", "slid", "sled", "solid"]],
  ["qb8_long_07", "long vowels", "long_vowels_silent_e", "o_e", "Which word has a long o silent-e pattern?", "stone", ["stone", "stun", "stand", "stem"]],
  ["qb8_long_08", "long vowels", "long_vowels_silent_e", "o_e", "Which word has a long o silent-e pattern?", "those", ["those", "this", "then", "than"]],
  ["qb8_long_09", "long vowels", "long_vowels_silent_e", "u_e", "Which word has a long u silent-e pattern?", "flute", ["flute", "flat", "fleet", "float"]],
  ["qb8_long_10", "long vowels", "long_vowels_silent_e", "u_e", "Which word has a long u silent-e pattern?", "mule", ["mule", "mull", "mall", "meal"]],
  ["qb8_vteam_01", "vowel teams", "vowel_teams", "ai", "Which word has the ai vowel team?", "paint", ["paint", "pant", "punt", "pent"]],
  ["qb8_vteam_02", "vowel teams", "vowel_teams", "ai", "Which word has the ai vowel team?", "chain", ["chain", "chin", "chop", "chip"]],
  ["qb8_vteam_03", "vowel teams", "vowel_teams", "ay", "Which word has the ay vowel team?", "play", ["play", "ply", "plan", "plum"]],
  ["qb8_vteam_04", "vowel teams", "vowel_teams", "ay", "Which word has the ay vowel team?", "tray", ["tray", "try", "tree", "trip"]],
  ["qb8_vteam_05", "vowel teams", "vowel_teams", "ee", "Which word has the ee vowel team?", "green", ["green", "grain", "grin", "groan"]],
  ["qb8_vteam_06", "vowel teams", "vowel_teams", "ee", "Which word has the ee vowel team?", "sleep", ["sleep", "slip", "slope", "slap"]],
  ["qb8_vteam_07", "vowel teams", "vowel_teams", "ea", "Which word has the ea vowel team?", "beach", ["beach", "bench", "batch", "bunch"]],
  ["qb8_vteam_08", "vowel teams", "vowel_teams", "oa", "Which word has the oa vowel team?", "float", ["float", "flat", "fleet", "flute"]],
  ["qb8_vteam_09", "vowel teams", "vowel_teams", "ow", "Which word has the ow vowel team?", "pillow", ["pillow", "pilot", "pencil", "pickle"]],
  ["qb8_vteam_10", "vowel teams", "vowel_teams", "oi", "Which word has the oi vowel team?", "point", ["point", "paint", "plant", "print"]],
  ["qb8_vteam_11", "vowel teams", "vowel_teams", "oy", "Which word has the oy vowel team?", "enjoy", ["enjoy", "energy", "enter", "empty"]],
  ["qb8_vteam_12", "vowel teams", "vowel_teams", "oa", "Which word has the oa vowel team?", "coast", ["coast", "cost", "cast", "case"]],
  ["qb8_long_11", "long vowels", "long_vowels_silent_e", "a_e", "Which word has a long a silent-e pattern?", "shade", ["shade", "shed", "shut", "ship"]],
  ["qb8_long_12", "long vowels", "long_vowels_silent_e", "i_e", "Which word has a long i silent-e pattern?", "stripe", ["stripe", "strap", "step", "stop"]],
  ["qb8_long_13", "long vowels", "long_vowels_silent_e", "o_e", "Which word has a long o silent-e pattern?", "globe", ["globe", "glad", "glum", "glib"]],
  ["qb8_long_14", "long vowels", "long_vowels_silent_e", "u_e", "Which word has a long u silent-e pattern?", "prune", ["prune", "print", "prank", "press"]],
  ["qb8_long_15", "long vowels", "long_vowels_silent_e", "e_e", "Which word has a long e silent-e pattern?", "athlete", ["athlete", "atlas", "after", "animal"]],
  ["qb8_long_16", "long vowels", "long_vowels_silent_e", "a_e", "Which word has a long a silent-e pattern?", "escape", ["escape", "except", "insect", "inspect"]],
  ["qb8_vteam_13", "vowel teams", "vowel_teams", "ee", "Which word has the ee vowel team?", "between", ["between", "button", "basket", "better"]],
  ["qb8_vteam_14", "vowel teams", "vowel_teams", "ea", "Which word has the ea vowel team?", "teacher", ["teacher", "ticker", "taller", "tunnel"]],
  ["qb8_vteam_15", "vowel teams", "vowel_teams", "ai", "Which word has the ai vowel team?", "railroad", ["railroad", "riverbank", "ribbon", "rocket"]],
  ["qb8_vteam_16", "vowel teams", "vowel_teams", "ay", "Which word has the ay vowel team?", "playground", ["playground", "planet", "plastic", "pocket"]],
  ["qb8_vteam_17", "vowel teams", "vowel_teams", "ow", "Which word has the ow vowel team?", "window", ["window", "winter", "wander", "winner"]],
  ["qb8_vteam_18", "vowel teams", "vowel_teams", "oy", "Which word has the oy vowel team?", "loyal", ["loyal", "local", "label", "ladder"]]
];

const verbItems8 = [
  ["qb8_verb_01", "Which word is an action verb?", "compare", ["compare", "gentle", "under", "basket"]],
  ["qb8_verb_02", "Which word is an action verb?", "measure", ["measure", "quiet", "beside", "paper"]],
  ["qb8_verb_03", "Which word is an action verb?", "observe", ["observe", "bright", "above", "notebook"]],
  ["qb8_verb_04", "Which word is an action verb?", "predict", ["predict", "round", "inside", "window"]],
  ["qb8_verb_05", "Which word is an action verb?", "explain", ["explain", "smooth", "between", "folder"]],
  ["qb8_verb_06", "Which word is an action verb?", "repair", ["repair", "striped", "near", "teacher"]]
];

const pluralItems8 = [
  ["qb8_plural_01", "Choose the correct plural for more than one fox.", "foxes", ["foxes", "foxs", "fox", "foxies"], "es"],
  ["qb8_plural_02", "Choose the correct plural for more than one wish.", "wishes", ["wishes", "wishs", "wish", "wishies"], "es"],
  ["qb8_plural_03", "Choose the correct plural for more than one city.", "cities", ["cities", "citys", "city", "cityes"], "ies"],
  ["qb8_plural_04", "Choose the correct plural for more than one shelf.", "shelves", ["shelves", "shelfs", "shelf", "shelfes"], "irregular"],
  ["qb8_plural_05", "Choose the correct plural for more than one child.", "children", ["children", "childs", "child", "childes"], "irregular"],
  ["qb8_plural_06", "Choose the correct plural for more than one class.", "classes", ["classes", "classs", "class", "classies"], "es"]
];

const morphologyItems8 = [
  ["qb8_morph_01", "What does redo mean?", "do again", ["do again", "not do", "do before", "full of doing"], "re"],
  ["qb8_morph_02", "What does repaint mean?", "paint again", ["paint again", "not paint", "paint before", "without paint"], "re"],
  ["qb8_morph_03", "What does unlock mean?", "make not locked", ["make not locked", "lock again", "full of locks", "before locking"], "un"],
  ["qb8_morph_04", "What does unsafe mean?", "not safe", ["not safe", "safe again", "very safe", "before safe"], "un"],
  ["qb8_morph_05", "What does preheat mean?", "heat before", ["heat before", "not heat", "heat again", "without heat"], "pre"],
  ["qb8_morph_06", "What does preview mean?", "view before", ["view before", "not view", "view again", "full of view"], "pre"],
  ["qb8_morph_07", "What does careful mean?", "full of care", ["full of care", "without care", "care again", "not care"], "ful"],
  ["qb8_morph_08", "What does thankful mean?", "full of thanks", ["full of thanks", "without thanks", "thanks again", "not thanks"], "ful"],
  ["qb8_morph_09", "What does fearless mean?", "without fear", ["without fear", "full of fear", "fear again", "not before fear"], "less"],
  ["qb8_morph_10", "What does painless mean?", "without pain", ["without pain", "full of pain", "pain again", "before pain"], "less"],
  ["qb8_morph_11", "What does walking mean?", "doing the action now", ["doing the action now", "a person who walks", "walk again", "not walk"], "ing"],
  ["qb8_morph_12", "What does painted mean?", "painted in the past", ["painted in the past", "paint again", "not painted", "a person who paints"], "ed"],
  ["qb8_morph_13", "What is a teacher?", "a person who teaches", ["a person who teaches", "not teach", "teach again", "full of teaching"], "er"],
  ["qb8_morph_14", "What is a runner?", "a person who runs", ["a person who runs", "run before", "without running", "not run"], "er"],
  ["qb8_morph_15", "What does kindness mean?", "the state of being kind", ["the state of being kind", "not kind", "kind again", "full of kind"], "ness"],
  ["qb8_morph_16", "What does washable mean?", "able to be washed", ["able to be washed", "not washed", "washed before", "full of wash"], "able"],
  ["qb8_morph_17", "What does slowly mean?", "in a slow way", ["in a slow way", "not slow", "slow again", "full of slow"], "ly"],
  ["qb8_morph_18", "What does quickly mean?", "in a quick way", ["in a quick way", "not quick", "quick again", "without quick"], "ly"],
  ["qb8_morph_19", "What does hopeful mean?", "full of hope", ["full of hope", "without hope", "hope again", "not hope"], "ful"],
  ["qb8_morph_20", "What does helpful mean?", "full of help", ["full of help", "without help", "help before", "not help"], "ful"],
  ["qb8_morph_21", "What does careless mean?", "without care", ["without care", "full of care", "care again", "not care"], "less"],
  ["qb8_morph_22", "What does rebuild mean?", "build again", ["build again", "not build", "build before", "full of building"], "re"],
  ["qb8_morph_23", "What does rewrite mean?", "write again", ["write again", "not write", "write before", "without writing"], "re"],
  ["qb8_morph_24", "What does unkind mean?", "not kind", ["not kind", "kind again", "full of kindness", "before kind"], "un"],
  ["qb8_morph_25", "What does painter mean?", "a person who paints", ["a person who paints", "paint again", "not paint", "full of paint"], "er"],
  ["qb8_morph_26", "What does carefully mean?", "in a careful way", ["in a careful way", "without care", "care again", "not careful"], "ly"],
  ["qb8_morph_27", "What does joyful mean?", "full of joy", ["full of joy", "without joy", "joy again", "not joy"], "ful"],
  ["qb8_morph_28", "What does unlocked mean?", "made not locked", ["made not locked", "locked again", "full of locks", "before locking"], "ed"],
  ["qb8_morph_29", "What does previewed mean?", "viewed before", ["viewed before", "not viewed", "viewed again", "full of viewing"], "pre"],
  ["qb8_morph_30", "What does reusable mean?", "able to be used again", ["able to be used again", "not useful", "used before school", "without use"], "able"],
  ["qb8_morph_31", "What does brightness mean?", "the state of being bright", ["the state of being bright", "not bright", "bright again", "full of bright"], "ness"],
  ["qb8_morph_32", "What does quietly mean?", "in a quiet way", ["in a quiet way", "not quiet", "quiet again", "without quiet"], "ly"],
  ["qb8_morph_33", "What does playful mean?", "full of play", ["full of play", "without play", "play again", "not play"], "ful"],
  ["qb8_morph_34", "What does tireless mean?", "without getting tired", ["without getting tired", "full of tires", "tired again", "not tired before"], "less"],
  ["qb8_morph_35", "What does misread mean?", "read incorrectly", ["read incorrectly", "read again", "not read", "full of reading"], "mis"],
  ["qb8_morph_36", "What does disobey mean?", "not obey", ["not obey", "obey again", "obey before", "full of obeying"], "dis"],
  ["qb8_morph_37", "What does performer mean?", "a person who performs", ["a person who performs", "perform again", "not perform", "before performing"], "er"],
  ["qb8_morph_38", "What does washable mean in a label?", "can be washed", ["can be washed", "was washed yesterday", "not washed", "washed again"], "able"]
];

function makeGrammarQuestion([id, question, answer, choices], skill, skillId, itemType, grade = "1") {
  return {
    id,
    grade,
    skill,
    skillId,
    difficulty: skillId === "prepositions" ? 2 : 1,
    passage: "",
    question,
    prompt: question,
    questionType: "multiple_choice",
    formatType: "GRAMMAR_BASICS",
    itemType,
    itemKey: answer,
    choices,
    answer,
    explanation: `${answer} is the word that best completes the sentence.`,
    source: "question_bank_expansion_8"
  };
}

function makeFinalSoundQuestion([id, targetWord, answer, choices]) {
  const asset = getChildWordAsset(targetWord) || {};
  return {
    id,
    grade: "K",
    skill: "final sounds",
    skillId: "final_sounds",
    difficulty: 1,
    passage: "",
    question: "Listen to the word. Which sound does it end with?",
    prompt: "Listen to the word. Which sound does it end with?",
    questionType: "ixl_template",
    templateType: "ENDING_SOUND",
    formatType: "ENDING_SOUND",
    itemType: "final_sound",
    itemKey: answer,
    targetWord,
    audioText: targetWord,
    audioPath: asset.audio || "",
    imagePath: asset.image || "",
    choices,
    answer,
    explanation: `${targetWord} ends with /${answer}/.`,
    source: "question_bank_expansion_8"
  };
}

function makeAdvancedPhonicsQuestion([id, skill, skillId, itemKey, question, answer, choices]) {
  return {
    id,
    grade: skillId === "digraphs" ? "1" : "2",
    skill,
    skillId,
    difficulty: skillId === "digraphs" ? 3 : 4,
    passage: "",
    question,
    prompt: question,
    questionType: "multiple_choice",
    formatType: "DECODING",
    itemType: "phonics_pattern",
    itemKey,
    targetPattern: itemKey,
    targetWord: answer,
    choices,
    answer,
    explanation: `${answer} is the word that matches the ${itemKey} pattern.`,
    source: "question_bank_expansion_8"
  };
}

function makePluralQuestion([id, question, answer, choices, itemKey]) {
  return {
    id,
    grade: itemKey === "irregular" ? "2" : "1",
    skill: "plurals",
    skillId: "plurals",
    difficulty: itemKey === "irregular" ? 3 : 2,
    passage: "",
    question,
    prompt: question,
    questionType: "multiple_choice",
    formatType: "PLURAL_SPELLING_CONTEXT",
    itemType: "grammar_plural",
    itemKey,
    choices,
    answer,
    explanation: `${answer} is the correct plural form.`,
    source: "question_bank_expansion_8"
  };
}

function makeMorphologyQuestion([id, question, answer, choices, itemKey]) {
  return {
    id,
    grade: "2",
    skill: "prefixes and suffixes",
    skillId: "prefix_suffix",
    difficulty: 4,
    passage: "",
    question,
    prompt: question,
    questionType: "multiple_choice",
    formatType: "MORPHEME_MEANING_CONTEXT",
    itemType: "morphology",
    itemKey,
    targetMorpheme: itemKey,
    choices,
    answer,
    explanation: `${itemKey} helps show the meaning "${answer}".`,
    source: "question_bank_expansion_8"
  };
}

function makeComprehensionQuestions(set, setIndex) {
  const groupId = `${set.prefix}_${String(setIndex + 1).padStart(2, "0")}`;
  return set.questions.map(([question, answer, choices, explanation], index) => ({
    id: `${groupId}_${String(index + 1).padStart(2, "0")}`,
    grade: "3",
    skill: set.skill,
    skillId: set.skill.replace(/\s+/g, "_"),
    difficulty: 5,
    passage: set.passage,
    question,
    prompt: question,
    questionType: "multiple_choice",
    formatType: "COMPREHENSION",
    itemType: "reading_comprehension",
    itemKey: `${groupId}_${String(index + 1).padStart(2, "0")}`,
    choices,
    answer,
    explanation,
    source: "question_bank_expansion_8"
  }));
}

export const questionBankExpansion8 = [
  ...finalSoundItems.map(makeFinalSoundQuestion),
  ...advancedPhonics8
    .filter(([, , skillId]) => skillId !== "digraphs")
    .map(makeAdvancedPhonicsQuestion),
  ...adjectiveItems.map(item =>
    makeGrammarQuestion(item, "adjectives", "adjectives", "grammar_adjective")
  ),
  ...prepositionItems.map(item =>
    makeGrammarQuestion(item, "prepositions", "prepositions", "preposition")
  ),
  ...verbItems8.map(item =>
    makeGrammarQuestion(item, "verbs", "verbs", "grammar_verb", "1")
  ),
  ...pluralItems8.map(makePluralQuestion),
  ...morphologyItems8.map(makeMorphologyQuestion),
  ...advancedPassageSets.flatMap((set, index) => makeComprehensionQuestions(set, index))
];
