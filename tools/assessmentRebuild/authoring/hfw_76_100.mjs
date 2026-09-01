// HFW Band 4 (words 76–100) — v3 authored bank (wave W8, paired with hfw_51_75).
// Same architecture as bands 1–3 (see hfw_1_25.mjs header). Band-4 particulars:
//   - who/how are mutual visual neighbours (doc rule) — both directions live.
//   - could joins band-3 would as a silent-oul spelling; been doubles its e.
//   - oil/number/water/people/part behave like content words — their clozes
//     still make them function meaningfully, never as picture labels.
//   - This orphaned band finally gets a real L2 spelling bank of its own
//     (the legacy hfw-level-2.51-100 shard dies).
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_HFW.md.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const avoidsTarget = (text, target) => !String(text).toLowerCase().split(/[^a-z']+/).includes(String(target).toLowerCase());
const clozePrompt = target => {
  const primary = "Listen to the sentence. Which printed word fills the blank?";
  return avoidsTarget(primary, target)
    ? primary
    : "Hear this sentence. What printed word fills its blank?";
};
const buildPrompt = (target, sentence) => {
  const primary = `Listen, then build the missing word: ${sentence}`;
  return avoidsTarget(primary, target)
    ? primary
    : `Hear this sentence. Build its missing word: ${sentence}`;
};

const cz = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_SENTENCE_CLOZE",
  prompt: clozePrompt(u),
  spoken: `Listen to the whole sentence. ${sentence.replace("___", u)} Which printed word fills the blank?`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  target: u,
  note
});

const rf = (u, lvl, ph, v, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_AUDIO_FIND_WORD", questionType: "listen_and_find_word",
  prompt: u === "which"
    ? "What printed word matches this recording?"
    : u === "this"
      ? "Which printed word matches the recording?"
      : "Which printed word matches this recording?",
  spoken: "Listen. Which printed word matches the recording?",
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "audio-required",
  target: u,
  audioRole: "target_word",
  evidenceModality: "audio+print",
  constructClaim: "spoken_to_print_high_frequency_word_recognition",
  note
});

const sp = (u, lvl, ph, v, sentence, tiles, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_SENTENCE_SPELL_CONTEXT",
  prompt: buildPrompt(u, sentence),
  spoken: `Listen to the whole sentence. ${sentence.replace("___", u)} Build the missing word.`,
  sentence,
  sentenceText: sentence.replace("___", u),
  choices: [K(u)],
  letterTiles: tiles,
  media: "audio-required",
  target: u,
  note
});

const lb = (u, lvl, ph, v, sentence, tiles, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_LETTER_BUILD",
  prompt: buildPrompt(u, sentence),
  spoken: `Listen to the whole sentence. ${sentence.replace("___", u)} Build the missing word.`,
  sentence,
  sentenceText: sentence.replace("___", u),
  choices: [K(u)],
  letterTiles: tiles,
  media: "audio-required",
  target: u,
  note
});

const FS = "D-FUNCTION-SWAP";
const VN = "D-VISUAL-NEIGHBOR";
const DV = "D-DEVELOPMENTAL";
const HM = "D-HOMOPHONE";

export default {
  skillId: "hfw_76_100",
  skillName: "High-Frequency Words 76–100",
  items: [
    // ===== L1 phase 1: been called come could day did down find first get long made may =====
    cz("been", 1, 1, 1, "The gate has ___ open all day.", ["been", "called", "made", "said"], [FS, FS, FS],
      "the state needs the copular past participle, not another past-participle verb"),
    cz("been", 1, 1, 2, "The paint has ___ wet since lunch.", ["been", "made", "called", "had"], [FS, FS, FS],
      "the state needs the copular past participle, not another past-participle verb"),
    rf("been", 1, 1, 3, ["been", "bean", "seen", "be"], [HM, VN, VN]),
    cz("called", 1, 1, 1, "Mum ___ me, so my phone rang.", ["called", "said", "made", "had"], [FS, FS, FS],
      "the ringing phone identifies the contact action"),
    cz("called", 1, 1, 2, "Pip is our new puppy. We ___ him Pip.", ["called", "did", "had", "said"], [FS, FS, FS],
      "the sentence uses called in its naming sense"),
    rf("called", 1, 1, 3, ["called", "call", "cold", "calmed"], [VN, VN, VN]),
    cz("come", 1, 1, 1, "We are inside waiting for you. Please ___.", ["come", "sit", "look", "write"], [FS, FS, FS],
      "the waiting speakers ask the listener to come to them"),
    cz("come", 1, 1, 2, "Please ___ inside; we are waiting for you.", ["come", "find", "make", "write"], [FS, FS, FS],
      "come is the only intransitive motion verb that fits"),
    rf("come", 1, 1, 3, ["come", "came", "some", "comb"], [VN, VN, VN]),
    cz("could", 1, 1, 1, "With a stool, I ___ reach the shelf yesterday.", ["could", "may", "will", "has"], [FS, FS, DV],
      "yesterday pins past ability; has is an unavoidable auxiliary-form error"),
    cz("could", 1, 1, 2, "Yesterday, fog cleared; we ___ see the road.", ["could", "has", "is", "were"], [DV, DV, DV],
      "the cumulative inventory has no other unambiguous past-ability modal, so the fillers are auxiliary-form errors"),
    rf("could", 1, 1, 3, ["could", "would", "cold", "cloud"], [VN, VN, VN]),
    cz("day", 1, 1, 1, "We played outside all ___.", ["day", "words", "part", "way"], [FS, FS, FS],
      "all day is the natural duration phrase"),
    cz("day", 1, 1, 2, "Each ___, Dad walks the dog before school.", ["day", "part", "way", "number"], [FS, FS, FS],
      "the repeated daily routine pins day"),
    rf("day", 1, 1, 3, ["day", "dab", "way", "dad"], [VN, VN, VN]),
    cz("did", 1, 1, 1, "Mia ___ her best in the race.", ["did", "made", "called", "was"], [FS, FS, FS],
      "did her best is the fixed natural phrase"),
    cz("did", 1, 1, 2, "We ___ our best to help.", ["did", "said", "made", "had"], [FS, FS, FS],
      "did is the only verb that completes the phrase"),
    rf("did", 1, 1, 3, ["did", "dad", "bid", "hid"], [VN, VN, VN]),
    cz("down", 1, 1, 1, "The ball rolled ___ from top to bottom.", ["down", "of", "with", "at"], [DV, DV, DV],
      "top to bottom pins down; the closed inventory leaves unavoidable preposition-form errors"),
    cz("down", 1, 1, 2, "The lift went from ten ___ to one.", ["down", "up", "about", "by"], [FS, FS, FS],
      "the descending floor numbers pin down"),
    rf("down", 1, 1, 3, ["down", "dawn", "town", "gown"], [VN, VN, VN]),
    cz("find", 1, 1, 1, "Please ___ my hat. I lost it.", ["find", "look", "use", "write"], [FS, FS, FS],
      "the lost object needs to be found"),
    cz("find", 1, 1, 2, "We must ___ the ball we lost.", ["find", "look", "sit", "use"], [FS, FS, FS],
      "find is the only transitive search verb in the set"),
    rf("find", 1, 1, 3, ["find", "fine", "found", "kind"], [VN, VN, VN]),
    cz("first", 1, 1, 1, "Lia won because she was the ___ runner.", ["first", "other", "long", "many"], [FS, FS, DV],
      "winning pins the runner's rank; many is an unavoidable number-form error"),
    cz("first", 1, 1, 2, "The red team won because it finished ___.", ["first", "down", "out", "up"], [FS, FS, FS],
      "winning pins the finishing rank"),
    rf("first", 1, 1, 3, ["first", "fist", "fast", "frost"], [VN, VN, VN]),
    cz("get", 1, 1, 1, "My boots ___ wet in puddles.", ["get", "come", "find", "make"], [FS, FS, FS],
      "get marks the change of state"),
    cz("get", 1, 1, 2, "The ducks ___ muddy in the rain.", ["get", "go", "find", "use"], [FS, FS, FS],
      "get marks the change from clean to muddy"),
    rf("get", 1, 1, 3, ["get", "got", "wet", "yet"], [VN, VN, VN]),
    cz("long", 1, 1, 1, "The ten-metre rope was too ___ for the bag.", ["long", "many", "more", "other"], [DV, DV, DV],
      "the inventory lacks alternative gradable adjectives, so the fillers are developmental form errors"),
    cz("long", 1, 1, 2, "Her hair reached her knees; it was very ___.", ["long", "more", "other", "all"], [DV, DV, DV],
      "the inventory lacks alternative gradable adjectives, so the fillers are developmental form errors"),
    rf("long", 1, 1, 3, ["long", "song", "lung", "log"], [VN, VN, VN]),
    cz("made", 1, 1, 1, "We ___ a kite from paper.", ["made", "called", "said", "were"], [FS, FS, FS],
      "from paper identifies creating the kite"),
    cz("made", 1, 1, 2, "The children ___ a snowman from three balls.", ["made", "called", "said", "was"], [FS, FS, DV],
      "from three balls identifies creating the snowman"),
    rf("made", 1, 1, 3, ["made", "make", "mad", "maze"], [VN, VN, VN]),
    cz("may", 1, 1, 1, "We are unsure; Mia ___ have missed the bus.", ["may", "has", "is", "are"], [DV, DV, DV],
      "other cumulative modals allow rival readings, so the fillers are unavoidable auxiliary-form errors"),
    cz("may", 1, 1, 2, "We are unsure; Dad ___ have left already.", ["may", "has", "was", "were"], [DV, DV, DV],
      "other cumulative modals allow rival readings, so the fillers are unavoidable auxiliary-form errors"),
    rf("may", 1, 1, 3, ["may", "my", "way", "man"], [VN, VN, VN]),

    // ===== L1 phase 2: my no now number oil part people sit than water way who =====
    cz("my", 1, 2, 1, "I own these shoes; they are ___ shoes.", ["my", "your", "his", "their"], [FS, FS, FS],
      "the stated first-person ownership pins my"),
    cz("my", 1, 2, 2, "This bag belongs to me; it is ___ bag.", ["my", "your", "her", "their"], [FS, FS, FS],
      "the stated first-person ownership pins my"),
    rf("my", 1, 2, 3, ["my", "me", "may", "by"], [VN, VN, VN]),
    cz("no", 1, 2, 1, "The empty box had ___ toys in it.", ["no", "some", "many", "two"], [FS, FS, FS],
      "empty makes the quantity unambiguous"),
    cz("no", 1, 2, 2, "Every apple was eaten, so ___ apples were left.", ["no", "all", "some", "two"], [FS, FS, FS],
      "the completed eating event leaves none"),
    rf("no", 1, 2, 3, ["no", "on", "now", "not"], [VN, VN, VN]),
    cz("now", 1, 2, 1, "The paint was wet before but is dry ___.", ["now", "then", "first", "down"], [FS, FS, FS],
      "the contrast with before pins the present time"),
    cz("now", 1, 2, 2, "The baby slept before, but is awake ___.", ["now", "first", "up", "out"], [FS, FS, FS],
      "the contrast with before pins the present time"),
    rf("now", 1, 2, 3, ["now", "no", "new", "own"], [VN, VN, VN]),
    cz("number", 1, 2, 1, "Write your phone ___ here.", ["number", "words", "part", "way"], [FS, FS, FS],
      "phone number is the natural noun phrase"),
    cz("number", 1, 2, 2, "Seven is my lucky ___.", ["number", "words", "oil", "people"], [FS, FS, FS],
      "seven identifies a number"),
    rf("number", 1, 2, 3, ["number", "lumber", "nimble", "numbers"], [VN, VN, DV]),
    cz("oil", 1, 2, 1, "The chain squeaked until Dad added ___.", ["oil", "words", "people", "time"], [FS, FS, FS],
      "ending the chain's squeak pins oil"),
    cz("oil", 1, 2, 2, "The cook spread the ___ over the dry pan.", ["oil", "words", "number", "day"], [FS, FS, FS],
      "coating a dry pan before cooking pins oil"),
    rf("oil", 1, 2, 3, ["oil", "boil", "soil", "owl"], [VN, VN, VN]),
    cz("part", 1, 2, 1, "Mia played the ___ of the queen.", ["part", "way", "time", "number"], [FS, FS, FS],
      "played the part is the natural acting phrase"),
    cz("part", 1, 2, 2, "This wheel is ___ of the bike.", ["part", "way", "day", "water"], [FS, FS, FS],
      "the component relationship pins part"),
    rf("part", 1, 2, 3, ["part", "park", "past", "art"], [VN, VN, VN]),
    cz("people", 1, 2, 1, "Many ___ waited for the bus.", ["people", "words", "water", "oil"], [FS, FS, FS],
      "only people can wait for a bus"),
    cz("people", 1, 2, 2, "The hall was full of ___ who sang.", ["people", "words", "number", "part"], [FS, FS, FS],
      "who sang requires a human plural noun"),
    rf("people", 1, 2, 3, ["people", "purple", "person", "puddle"], [VN, VN, VN]),
    cz("sit", 1, 2, 1, "Please ___ still on this chair.", ["sit", "find", "make", "write"], [FS, FS, FS],
      "sit is the only intransitive posture verb"),
    cz("sit", 1, 2, 2, "The children ___ on the mat for story time.", ["sit", "find", "use", "make"], [FS, FS, FS],
      "the mat and story-time context pin sit"),
    rf("sit", 1, 2, 3, ["sit", "sat", "set", "silt"], [VN, VN, VN]),
    cz("than", 1, 2, 1, "Sam ran farther ___ I did.", ["than", "as", "with", "from"], [DV, DV, DV],
      "the comparative clause requires than; the other fillers create form errors"),
    cz("than", 1, 2, 2, "This box weighs more ___ the red box does.", ["than", "as", "by", "from"], [DV, DV, DV],
      "the comparative clause requires than; the other fillers create form errors"),
    rf("than", 1, 2, 3, ["than", "then", "that", "thin"], [VN, VN, VN]),
    cz("water", 1, 2, 1, "I was thirsty, so I drank some ___.", ["water", "oil", "words", "number"], [FS, FS, FS],
      "thirst and drinking make water functional"),
    cz("water", 1, 2, 2, "The plants need ___ every day.", ["water", "oil", "part", "words"], [FS, FS, FS],
      "daily plant care pins water"),
    rf("water", 1, 2, 3, ["water", "waiter", "winter", "wonder"], [VN, VN, VN]),
    cz("way", 1, 2, 1, "Show me the ___ home.", ["way", "time", "part", "water"], [FS, FS, FS],
      "home makes way a route"),
    cz("way", 1, 2, 2, "Which ___ leads to the beach?", ["way", "day", "time", "number"], [FS, FS, FS],
      "a route is the only thing in the set that can lead to a destination"),
    rf("way", 1, 2, 3, ["way", "why", "day", "wax"], [VN, VN, VN]),
    cz("who", 1, 2, 1, "Someone knocked. Tell me ___ it was.", ["who", "how", "what", "when"], [VN, FS, FS],
      "someone pins a person's identity"),
    cz("who", 1, 2, 2, "Someone won the race. Tell me ___ it was.", ["who", "how", "what", "there"], [VN, FS, FS],
      "someone pins a person's identity"),
    rf("who", 1, 2, 3, ["who", "how", "with", "what"], [VN, VN, VN]),

    // ===== L2 phase 1 (spell): been … may =====
    sp("been", 2, 1, 1, "Have you ___ to the fair?", ["b", "e", "e", "n", "i"],
      "bean's pattern tempts; the double e is the work"),
    lb("been", 2, 1, 2, "The barn has ___ painted.", ["b", "e", "e", "n", "i"]),
    sp("called", 2, 1, 1, "The pup is ___ Biscuit.", ["c", "a", "l", "l", "e", "d", "k"],
      "kalled and single-l tempt"),
    lb("called", 2, 1, 2, "Mum ___ the vet at once.", ["c", "a", "l", "l", "e", "d", "k"]),
    sp("come", 2, 1, 1, "___ and see the chicks!", ["c", "o", "m", "e", "u"],
      "cum — the u is present; the silent e is the work"),
    lb("come", 2, 1, 2, "Storms ___ fast at sea.", ["c", "o", "m", "e", "u"]),
    sp("could", 2, 1, 1, "___ we camp by the lake?", ["c", "o", "u", "l", "d", "k"],
      "cud — the silent oul cluster is the work"),
    lb("could", 2, 1, 2, "Owls ___ hear a pin drop.", ["c", "o", "u", "l", "d", "k"]),
    sp("day", 2, 1, 1, "Sports ___ is on Friday.", ["d", "a", "y", "e"],
      "dae — the e tempts"),
    lb("day", 2, 1, 2, "What a fine ___ for a hike!", ["d", "a", "y", "e"]),
    sp("did", 2, 1, 1, "___ the alarm ring?", ["d", "i", "d", "e"],
      "ded tempts"),
    lb("did", 2, 1, 2, "You ___ a fine job.", ["d", "i", "d", "e"]),
    sp("down", 2, 1, 1, "Roll the barrel ___ the ramp.", ["d", "o", "w", "n", "u"],
      "doun — the u is present and tempting"),
    lb("down", 2, 1, 2, "The sun went ___ at eight.", ["d", "o", "w", "n", "u"]),
    sp("find", 2, 1, 1, "Help me ___ my keys.", ["f", "i", "n", "d", "e"],
      "fined's e is present — the bare ind is the work"),
    lb("find", 2, 1, 2, "Crows ___ shiny things.", ["f", "i", "n", "d", "e"]),
    sp("first", 2, 1, 1, "Ladders ___, then paint.", ["f", "i", "r", "s", "t", "u"],
      "furst — the u is present and tempting"),
    lb("first", 2, 1, 2, "Who came ___ in the quiz?", ["f", "i", "r", "s", "t", "u"]),
    sp("get", 2, 1, 1, "___ your boots — it snowed!", ["g", "e", "t", "i"],
      "git tempts"),
    lb("get", 2, 1, 2, "We ___ eggs from the coop.", ["g", "e", "t", "i"]),
    sp("long", 2, 1, 1, "Giraffes have ___ necks.", ["l", "o", "n", "g", "u"],
      "lung's u is present"),
    lb("long", 2, 1, 2, "The queue was so ___!", ["l", "o", "n", "g", "u"]),
    sp("made", 2, 1, 1, "We ___ jam tarts today.", ["m", "a", "d", "e", "i"],
      "mad without the silent e is the tempting build"),
    lb("made", 2, 1, 2, "Ants ___ a nest by the step.", ["m", "a", "d", "e", "i"]),
    sp("may", 2, 1, 1, "___ I ring the bell?", ["m", "a", "y", "e"],
      "mae tempts"),
    lb("may", 2, 1, 2, "It ___ thunder later.", ["m", "a", "y", "e"]),

    // ===== L2 phase 2 (spell): my … who =====
    sp("my", 2, 2, 1, "Where is ___ other mitten?", ["m", "y", "i", "e"],
      "mi — the i is present and tempting"),
    lb("my", 2, 2, 2, "___ turn on the swing!", ["m", "y", "e", "i"]),
    sp("no", 2, 2, 1, "There is ___ milk left.", ["n", "o", "w", "e"],
      "know's pattern lurks — the bare no is the work"),
    lb("no", 2, 2, 2, "___ two snowflakes match.", ["n", "o", "e", "w"]),
    sp("now", 2, 2, 1, "The paint is dry ___.", ["n", "o", "w", "u"],
      "nou — the u is present and tempting"),
    lb("now", 2, 2, 2, "___ add the flour slowly.", ["n", "o", "w", "u"]),
    sp("number", 2, 2, 1, "Ring this ___ if lost.", ["n", "u", "m", "b", "e", "r", "o"],
      "the silent-ish b is the work"),
    lb("number", 2, 2, 2, "Seven is my lucky ___.", ["n", "u", "m", "b", "e", "r", "o"]),
    sp("oil", 2, 2, 1, "Bike chains need ___.", ["o", "i", "l", "y"],
      "oyl — the y is present and tempting"),
    lb("oil", 2, 2, 2, "___ the wheels, please.", ["o", "i", "l", "y"]),
    sp("part", 2, 2, 1, "This ___ clips on last.", ["p", "a", "r", "t", "e"]),
    lb("part", 2, 2, 2, "Play your ___ in the show.", ["p", "a", "r", "t", "e"]),
    sp("people", 2, 2, 1, "Six ___ fit in the lift.", ["p", "e", "o", "p", "l", "e", "u"],
      "peeple tempts — the eo order is the work"),
    lb("people", 2, 2, 2, "Kind ___ share the bench.", ["p", "e", "o", "p", "l", "e", "u"]),
    sp("sit", 2, 2, 1, "___ still for the photo.", ["s", "i", "t", "e"],
      "set's e is present"),
    lb("sit", 2, 2, 2, "Cats ___ where they please.", ["s", "i", "t", "e"]),
    sp("than", 2, 2, 1, "Silk is softer ___ wool.", ["t", "h", "a", "n", "e"],
      "then's e is present — the a is the work"),
    lb("than", 2, 2, 2, "Ice is colder ___ snow.", ["t", "h", "a", "n", "e"]),
    sp("water", 2, 2, 1, "Fill the trough with ___.", ["w", "a", "t", "e", "r", "o"],
      "wotter tempts — the a is the work"),
    lb("water", 2, 2, 2, "The ___ froze overnight.", ["w", "a", "t", "e", "r", "o"]),
    sp("way", 2, 2, 1, "This ___ to the exit.", ["w", "a", "y", "e"],
      "wae tempts"),
    lb("way", 2, 2, 2, "A compass shows the ___.", ["w", "a", "y", "e"]),
    sp("who", 2, 2, 1, "___ ate the last plum?", ["w", "h", "o", "u"],
      "hoo — the silent w order is the work"),
    lb("who", 2, 2, 2, "Ask ___ owns the scooter.", ["w", "h", "o", "u"]),

    // ===== Retention reserve (form R) — could/been double coverage =====
    cz("could", 1, 1, 7, "Last night, the gate opened; we ___ leave then.", ["could", "has", "is", "was"], [DV, DV, DV],
      "the cumulative inventory has no other unambiguous past-ability modal, so the fillers are auxiliary-form errors"),
    cz("been", 1, 1, 7, "It has ___ a long day.", ["been", "be", "is", "were"], [DV, DV, DV],
      "has requires the past-participle form"),
    sp("could", 2, 1, 7, "We ___ hear the sea from camp.", ["c", "o", "u", "l", "d", "k"]),
    lb("been", 2, 1, 7, "It has ___ ages!", ["b", "e", "e", "n", "i"]),
    cz("who", 1, 2, 7, "Someone has the key. ___ has it?", ["who", "how", "when", "there"], [VN, FS, FS],
      "someone pins a person's identity"),
    cz("than", 1, 2, 7, "Feathers are lighter ___ stones.", ["than", "as", "from", "about"], [DV, DV, DV],
      "the comparative frame requires than; the other fillers create form errors"),
    rf("people", 1, 2, 7, ["people", "person", "purple", "pebble"], [VN, VN, VN], "", "point"),
    rf("water", 1, 2, 7, ["water", "winter", "waiter", "wander"], [VN, VN, VN], "", "point"),
    sp("number", 2, 2, 7, "Pick an odd ___.", ["n", "u", "m", "b", "e", "r", "o"]),
    lb("water", 2, 2, 7, "Save ___ — take short showers.", ["w", "a", "t", "e", "r", "o"])
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
