// Homophones & Homonyms — v3 authored bank (wave W12, paired with antonyms).
// 16 curated pair units (8 L1, 8 L2) + two nonGating homonym exposure units.
// Law: the paired homophone rides as a MANDATORY D-HOMOPHONE distractor in
// every item (both mates for to/two/too). Cloze fillers parse grammatically
// wherever English allows and are always defensibly wrong — near-true
// fillers (very/there/nearby) carry notes defending why the key is uniquely
// right. Meaning cues pin ONE spelling before the choices appear.
// Scanner-proofing: pair mates share their root chunk in most units, so
// frame gifts tie; units whose mates share nothing (sun/son, ate/eight)
// have frames audited chunk-by-chunk.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_LANGUAGE.md §22.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const HOM = "D-HOMOPHONE";
const VN = "D-VISUAL-NEIGHBOR";
const FS = "D-FUNCTION-SWAP";
const SEM = "D-SEMANTIC";

const hm = (u, lvl, ph, v, prompt, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "HOMOPHONE_MEANING",
  prompt,
  spoken: prompt,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

const hcc = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "HOMOPHONE_CONTEXT_CLOZE",
  prompt: `Which spelling fits: ${sentence}`,
  spoken: `Which spelling fits? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  note
});

export default {
  skillId: "homophones_homonyms",
  skillName: "Homophones & Homonyms",
  items: [
    // ================= L1 phase 1 =================
    hm("sea_see", 1, 1, 1, "Which spelling names a large body of salt water?",
      ["sea", "see", "sand", "say"], [HOM, SEM, VN],
      "salty gifts sa to sand and say — tied distractors, key clean"),
    hm("sea_see", 1, 1, 2, "Which spelling completes ‘I can ___ the moon’?",
      ["see", "sea", "saw", "say"], [HOM, VN, VN],
      "means gifts ea to sea — a distractor tops, never the key"),
    hcc("sea_see", 1, 1, 3, "We sailed far out on the deep blue ___.",
      ["sea", "see", "seat", "snow"], [HOM, VN, SEM],
      "deep gifts ee to the pair mate see — a distractor tops"),
    hcc("sea_see", 1, 1, 4, "Open your eyes so you can ___ the picture.",
      ["see", "sea", "sing", "sit"], [HOM, SEM, SEM]),

    hm("sun_son", 1, 1, 1, "Which spelling is the hot star in the sky?",
      ["sun", "son", "sand", "sock"], [HOM, SEM, VN]),
    hm("sun_son", 1, 1, 2, "Which spelling means a male child in a family?",
      ["son", "sun", "sock", "sad"], [HOM, VN, SEM]),
    hcc("sun_son", 1, 1, 3, "The ___ rose over the hill at dawn.",
      ["sun", "son", "spoon", "sofa"], [HOM, SEM, SEM],
      "spoon and sofa parse and are absurd — no rising rival like moon or star"),
    hcc("sun_son", 1, 1, 4, "Grandpa hugged his ___ at the gate.",
      ["son", "sun", "sock", "spoon"], [HOM, SEM, SEM]),

    hm("be_bee", 1, 1, 1, "Which spelling is the buzzing insect?",
      ["bee", "be", "leaf", "bat"], [HOM, SEM, SEM]),
    hm("be_bee", 1, 1, 2, "Which spelling completes the phrase ‘Let it ___’?",
      ["be", "bee", "by", "bed"], [HOM, VN, VN]),
    hcc("be_bee", 1, 1, 3, "A buzzing ___ landed on the flower.",
      ["bee", "be", "sock", "spoon"], [HOM, SEM, SEM],
      "on gifts its chunk to spoon — a distractor tops; no landing rival like bug or leaf"),
    hcc("be_bee", 1, 1, 4, "I will ___ seven on my next birthday.",
      ["be", "bee", "draw", "sing"], [HOM, SEM, SEM],
      "draw seven parses (the numeral) and is defensibly wrong for an age"),

    hm("no_know", 1, 1, 1, "Which spelling is the word for 'not yes'?",
      ["no", "know", "now", "new"], [HOM, VN, VN],
      "not gifts no to key, know and now together — three-way tie"),
    hm("no_know", 1, 1, 2, "Which spelling fits 'to ___ the answer'?",
      ["know", "no", "now", "nod"], [HOM, VN, VN]),
    hcc("no_know", 1, 1, 3, "Dad refused to buy candy, so he said ___.",
      ["no", "know", "now", "oops"], [HOM, VN, SEM]),
    hcc("no_know", 1, 1, 4, "Do you ___ the way to school by heart?",
      ["know", "no", "now", "name"], [HOM, VN, SEM]),

    // ================= L1 phase 2 =================
    hm("one_won", 1, 2, 1, "Which spelling is the number after zero?",
      ["one", "won", "own", "once"], [HOM, VN, VN]),
    hm("one_won", 1, 2, 2, "Which spelling tells that your team came first?",
      ["won", "one", "win", "when"], [HOM, FS, VN],
      "which gifts wh to when — a distractor tops, never the key"),
    hcc("one_won", 1, 2, 3, "Pick just ___ card from the pack.",
      ["one", "won", "two", "ten"], [HOM, FS, FS],
      "two card and ten card break number agreement — the classic count trap"),
    hcc("one_won", 1, 2, 4, "Our team ___ the cup last year!",
      ["won", "one", "win", "wins"], [HOM, FS, FS]),

    hm("ate_eight", 1, 2, 1, "Which spelling is the number after seven?",
      ["eight", "ate", "eighty", "ten"], [HOM, VN, SEM],
      "after gifts te to ate and ten — tied distractors, key clean"),
    hm("ate_eight", 1, 2, 2, "Pick the spelling for ‘I ___ my lunch’.",
      ["ate", "eight", "eat", "egg"], [HOM, FS, VN],
      "that gifts at to key and eat together — tie"),
    hcc("ate_eight", 1, 2, 3, "Ben ___ all his peas at dinner yesterday.",
      ["ate", "eight", "eat", "eats"], [HOM, FS, FS],
      "at gifts itself to key, eat and eats — three-way tie"),
    hcc("ate_eight", 1, 2, 4, "There are ___ legs on a spider.",
      ["eight", "ate", "six", "sixty"], [HOM, SEM, SEM],
      "six parses but a spider has eight — the fact pins it"),

    hm("hear_here", 1, 2, 1, "Which spelling means to notice a sound?",
      ["hear", "here", "heart", "head"], [HOM, VN, VN],
      "ears gifts ear to key and heart together — tie"),
    hm("hear_here", 1, 2, 2, "Which spelling points to this place?",
      ["here", "hear", "there", "home"], [HOM, VN, SEM],
      "this gifts th to there — a distractor tops, never the key"),
    hcc("hear_here", 1, 2, 3, "I can ___ the owl calling outside.",
      ["hear", "here", "am", "was"], [HOM, FS, FS]),
    hcc("hear_here", 1, 2, 4, "The bus stops right ___, where I am standing.",
      ["here", "hear", "there", "then"], [HOM, SEM, SEM]),

    hm("blue_blew", 1, 2, 1, "Which spelling names the color of a clear daytime sky?",
      ["blue", "blew", "black", "brown"], [HOM, SEM, SEM]),
    hm("blue_blew", 1, 2, 2, "Which spelling tells what the wind did?",
      ["blew", "blue", "blow", "grew"], [HOM, FS, VN]),
    hcc("blue_blew", 1, 2, 3, "The wind ___ my hat into the pond!",
      ["blew", "blue", "blows", "grew"], [HOM, FS, SEM],
      "blows misses the story's past tense; grew is absurd"),
    hcc("blue_blew", 1, 2, 4, "Milo wore his ___ scarf, like a clear sky.",
      ["blue", "blew", "loud", "tall"], [HOM, SEM, SEM],
      "the color of the sea pins blue — loud and tall parse and contradict it"),

    // ================= L2 phase 1 =================
    hcc("to_two_too", 2, 1, 1, "May I come ___ the park with you?",
      ["to", "too", "two", "toe"], [HOM, HOM, VN]),
    hcc("to_two_too", 2, 1, 2, "Grandma baked ___ pies, one for each hand.",
      ["two", "too", "to", "ten"], [HOM, HOM, SEM],
      "one for each hand counts to exactly two — ten parses and is pinned wrong"),
    hcc("to_two_too", 2, 1, 3, "That soup is ___ hot to eat!",
      ["too", "to", "two", "tool"], [HOM, HOM, VN]),
    hm("to_two_too", 2, 1, 4, "Which spelling is the number?",
      ["two", "to", "too", "tow"], [HOM, HOM, VN]),

    hcc("there_their", 2, 1, 1, "The twins packed ___ bags for camp.",
      ["their", "there", "them", "they"], [HOM, FS, FS],
      "the gifts th to all four options — full tie by construction"),
    hcc("there_their", 2, 1, 2, "Look over ___ — the parade is coming!",
      ["there", "their", "they", "then"], [HOM, FS, VN]),
    hm("there_their", 2, 1, 3, "Which spelling shows something belongs to them?",
      ["their", "there", "then", "thin"], [HOM, VN, VN],
      "them gifts the to key, there and then — three-way tie"),
    hm("there_their", 2, 1, 4, "Which spelling points to a place?",
      ["there", "their", "then", "them"], [HOM, VN, FS]),

    hcc("right_write", 2, 1, 1, "My answer matched the key, so it was ___.",
      ["right", "write", "wrong", "long"], [HOM, "D-OPPOSITE", SEM],
      "Matching the key pins right; wrong directly contradicts the sentence."),
    hcc("right_write", 2, 1, 2, "I will ___ a letter to Grandma tonight.",
      ["write", "right", "wrote", "sing"], [HOM, FS, SEM],
      "letter gifts te to key and wrote together — tie"),
    hm("right_write", 2, 1, 3, "Which spelling is the opposite of left?",
      ["right", "write", "night", "light"], [HOM, VN, VN],
      "opposite gifts it to write — a distractor tops, never the key"),
    hm("right_write", 2, 1, 4, "Which spelling means to put words on paper with a pencil?",
      ["write", "right", "wrote", "white"], [HOM, FS, VN],
      "with gifts it to key and white together — tie"),

    hcc("new_knew", 2, 1, 1, "My shoes came straight from the box. They are ___.",
      ["new", "knew", "knee", "news"], [HOM, VN, VN]),
    hcc("new_knew", 2, 1, 2, "I ___ the answer before anyone else.",
      ["knew", "new", "know", "knows"], [HOM, FS, FS],
      "know and knows clash with the before-past frame"),
    hm("new_knew", 2, 1, 3, "Which spelling tells you understood it all along?",
      ["knew", "new", "now", "nod"], [HOM, VN, VN],
      "understood gifts od to nod — a distractor tops, never the key"),
    hm("new_knew", 2, 1, 4, "Which spelling is the opposite of old?",
      ["new", "knew", "now", "near"], [HOM, VN, VN]),

    // ================= L2 phase 2 =================
    hcc("hour_our", 2, 2, 1, "The cake bakes for one ___.",
      ["hour", "our", "hours", "week"], [HOM, FS, SEM],
      "one hours breaks agreement; a one-week cake bake is defensibly absurd"),
    hcc("hour_our", 2, 2, 2, "That swing is ___ special spot.",
      ["our", "hour", "out", "oar"], [HOM, VN, VN]),
    hm("hour_our", 2, 2, 3, "Which spelling names a period of sixty minutes?",
      ["hour", "our", "hand", "day"], [HOM, SEM, SEM]),
    hm("hour_our", 2, 2, 4, "Which spelling means it belongs to us?",
      ["our", "hour", "four", "out"], [HOM, VN, VN]),

    hcc("flower_flour", 2, 2, 1, "Sift the ___ into the bowl for the cake.",
      ["flour", "flower", "floor", "flow"], [HOM, VN, VN]),
    hcc("flower_flour", 2, 2, 2, "A bee landed on the pink ___.",
      ["flower", "flour", "floor", "flag"], [HOM, VN, SEM],
      "landed gifts la to flag — a distractor tops, never the key"),
    hm("flower_flour", 2, 2, 3, "Which spelling names a garden bloom?",
      ["flower", "flour", "floor", "four"], [HOM, VN, SEM]),
    hm("flower_flour", 2, 2, 4, "Which spelling names the powder used for baking?",
      ["flour", "flower", "floor", "fork"], [HOM, VN, SEM],
      "powder gifts ow to flower and for gifts or to fork — tied distractors"),

    hcc("would_wood", 2, 2, 1, "___ Mia like some juice?",
      ["Would", "Wood", "Wool", "Word"], [HOM, VN, VN]),
    hcc("would_wood", 2, 2, 2, "The bench is made of ___ from the old oak.",
      ["wood", "would", "wool", "glass"], [HOM, VN, SEM],
      "from the old oak pins wood; old gifts ol to wool, a distractor tops"),
    hm("would_wood", 2, 2, 3, "Which spelling comes from trees?",
      ["wood", "would", "wool", "rock"], [HOM, VN, SEM],
      "no tree-borne rival like leaf — rock and wool are clean foils"),
    hm("would_wood", 2, 2, 4, "Which spelling completes the polite question, '___ you help me?'",
      ["would", "wood", "wound", "word"], [HOM, VN, VN],
      "you gifts ou to the key — wound carries ou too and ties"),

    hcc("made_maid", 2, 2, 1, "Yesterday Grandma ___ pancakes for breakfast.",
      ["made", "maid", "make", "makes"], [HOM, FS, FS],
      "pancakes gifts ke to make and makes — tied distractors, key clean"),
    hcc("made_maid", 2, 2, 2, "In the old story, the palace ___ swept the hall.",
      ["maid", "made", "mouse", "moon"], [HOM, SEM, SEM],
      "floor gifts oo to moon — a distractor tops; no sweeping rival like cook"),
    hm("made_maid", 2, 2, 3, "Which spelling completes ‘Yesterday I ___ a tower’?",
      ["made", "maid", "make", "mend"], [HOM, FS, VN],
      "something gifts me to mend — a distractor tops, never the key"),
    hm("made_maid", 2, 2, 4, "Which spelling names a helper in an old castle story?",
      ["maid", "made", "mad", "map"], [HOM, VN, VN]),

    // ================= NonGating homonym exposure =================
    hm("homonym_bat", 2, 1, 1, "Which sentence uses bat to mean the animal?",
      ["The bat slept upside down in the cave.",
       "Ben swung the bat at the ball.",
       "The bat cracked when it hit the post.",
       "Dad bought a new bat for baseball."], [SEM, SEM, SEM],
      "every sentence carries bat — the shared word ties all four"),
    hm("homonym_bat", 2, 1, 2, "Which sentence uses bat to mean sports equipment?",
      ["Mia gripped the bat and faced the pitcher.",
       "The bat flew out at dusk to catch moths.",
       "A baby bat clung to its mother.",
       "The bat hung from the branch by its feet."], [SEM, SEM, SEM]),
    hm("homonym_ring", 2, 2, 1, "A ring can be jewelry or a sound. Which sentence uses ring to mean a sound?",
      ["We heard the ring of the doorbell.",
       "Her gold ring sparkled in the sun.",
       "The ring slipped off her finger.",
       "Grandma keeps her ring in a tiny box."], [SEM, SEM, SEM]),
    hm("homonym_ring", 2, 2, 2, "Which sentence uses ring to mean a piece of jewelry?",
      ["The silver ring fit her thumb perfectly.",
       "We heard the phone ring twice.",
       "Give the bell a loud ring at noon.",
       "The ring of laughter filled the hall."], [SEM, SEM, SEM]),

    // ================= Retention reserve (form R) =================
    hcc("sea_see", 1, 1, 5, "Shells wash up from the ___.",
      ["sea", "see", "seat", "sofa"], [HOM, VN, SEM]),
    hm("sun_son", 1, 1, 5, "Which spelling names what warms Earth?",
      ["sun", "son", "moon", "rain"], [HOM, SEM, SEM],
      "no warming rival — star would be defensibly true"),
    hcc("be_bee", 1, 1, 5, "The ___ buzzed from rose to rose.",
      ["bee", "be", "dog", "key"], [HOM, SEM, SEM],
      "no buzzing rival like fly — dog and key are clean foils"),
    hm("no_know", 1, 1, 5, "Which spelling completes ‘I ___ my phone number by heart’?",
      ["know", "no", "now", "nest"], [HOM, VN, SEM]),
    hcc("one_won", 1, 2, 5, "We ___ the quiz by a single point!",
      ["won", "one", "when", "wins"], [HOM, VN, FS],
      "single and point gift in to wins — a distractor tops; lost would be defensibly true"),
    hm("ate_eight", 1, 2, 5, "Which spelling names the number of arms an octopus has?",
      ["eight", "ate", "six", "ten"], [HOM, SEM, SEM]),
    hcc("hear_here", 1, 2, 5, "Stand still and you can ___ the waves.",
      ["hear", "here", "hold", "name"], [HOM, SEM, SEM],
      "stand and can gift an to name — a distractor tops, never the key"),
    hm("blue_blew", 1, 2, 5, "Which spelling is a color?",
      ["blue", "blew", "blow", "glue"], [HOM, VN, VN],
      "color gifts lo to blow — a distractor tops, never the key"),
    hcc("to_two_too", 2, 1, 5, "It is ___ dark to read outside now.",
      ["too", "to", "two", "top"], [HOM, HOM, VN]),
    hcc("there_their", 2, 1, 5, "The birds built ___ nest in the oak.",
      ["their", "there", "they", "thin"], [HOM, FS, VN],
      "the gifts the to key, there and they — three-way tie"),
    hcc("right_write", 2, 1, 5, "Use the pencil to ___ your name.",
      ["write", "right", "wrote", "sit"], [HOM, FS, VN]),
    hcc("made_maid", 2, 2, 5, "Yesterday we ___ a fort out of pillows.",
      ["made", "maid", "make", "mad"], [HOM, FS, VN])
  ].map(item => {
    if (item.v >= 5) item.retention = true;
    return item;
  })
};
