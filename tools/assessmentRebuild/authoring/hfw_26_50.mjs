// HFW Band 2 (words 26–50) — v3 authored bank (wave W7, paired with hfw_1_25).
// Same architecture as band 1 (see hfw_1_25.mjs header). Band-2 particulars:
//   - their/there is an IN-BAND homophone pair — D-HOMOPHONE is live in both
//     directions, plus the they/their and there/then visual-dev slips.
//   - said/each/which carry the classic irregular spellings; the L2 letter
//     banks always include the tempting phonetic letters (said → sed's e,
//     one → wun's w, what → wot's o).
//   - The in-band wh-inventory is exactly {how,what,when,which}; complete
//     sentences and distractor sets leave one defensible wh-word rather than
//     relying on an unstated scene.
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
  skillId: "hfw_26_50",
  skillName: "High-Frequency Words 26–50",
  items: [
    // ============ L1 phase 1: all an but by can do each had how if not one or ============
    cz("all", 1, 1, 1, "She fed ___ the cats; none stayed hungry.", ["all", "each", "one", "an"], [DV, DV, DV]),
    cz("all", 1, 1, 2, "Rain filled ___ the jars right to the top.", ["all", "each", "one", "his"], [DV, DV, DV]),
    rf("all", 1, 1, 3, ["all", "ball", "tall", "doll"], [VN, VN, VN]),
    cz("an", 1, 1, 1, "Sam wants ___ egg.", ["an", "a", "of", "they"], [DV, DV, DV]),
    cz("an", 1, 1, 2, "Mia needs ___ orange.", ["an", "a", "in", "he"], [DV, DV, DV]),
    rf("an", 1, 1, 3, ["an", "and", "on", "in"], [VN, VN, VN]),
    cz("but", 1, 1, 1, "The sun shone. ___ rain fell anyway.", ["but", "if", "when", "as"], [FS, FS, FS]),
    cz("but", 1, 1, 2, "Mia ran fast. ___ she missed the bus.", ["but", "if", "as", "that"], [FS, FS, FS]),
    rf("but", 1, 1, 3, ["but", "bat", "bus", "cut"], [VN, VN, VN]),
    cz("by", 1, 1, 1, "Ben won the race ___ one step.", ["by", "at", "on", "in"], [FS, FS, FS]),
    cz("by", 1, 1, 2, "The jar missed the shelf ___ an inch.", ["by", "from", "at", "with"], [FS, FS, FS]),
    rf("by", 1, 1, 3, ["by", "my", "buy", "be"], [VN, HM, VN]),
    cz("can", 1, 1, 1, "Mia learned to swim; now she ___ swim.", ["can", "is", "have", "was"], [DV, DV, DV]),
    cz("can", 1, 1, 2, "The twins learned the song; they ___ sing it.", ["can", "are", "is", "had"], [DV, DV, DV]),
    rf("can", 1, 1, 3, ["can", "cat", "cap", "ran"], [VN, VN, VN]),
    cz("do", 1, 1, 1, "___ you feed the hens every day?", ["do", "have", "is", "had"], [DV, DV, DV]),
    cz("do", 1, 1, 2, "What ___ cows eat each morning?", ["do", "are", "have", "was"], [DV, DV, DV]),
    rf("do", 1, 1, 3, ["do", "to", "go", "dot"], [VN, VN, VN]),
    cz("each", 1, 1, 1, "Four cards get one sticker ___.", ["each", "all", "the", "that"], [DV, DV, DV]),
    cz("each", 1, 1, 2, "Give the three pups one treat ___.", ["each", "all", "one", "that"], [DV, DV, DV]),
    rf("each", 1, 1, 3, ["each", "ear", "eat", "teach"], [VN, VN, VN]),
    cz("had", 1, 1, 1, "Yesterday we ___ a kite; today we do not.", ["had", "have", "said", "were"], [DV, FS, FS]),
    cz("had", 1, 1, 2, "Long ago, Gran ___ six cats at home.", ["had", "have", "was", "said"], [DV, FS, FS]),
    rf("had", 1, 1, 3, ["had", "has", "hat", "bad"], [VN, VN, VN]),
    cz("how", 1, 1, 1, "___ do you make jam, step by step?", ["how", "what", "which", "that"], [FS, FS, DV]),
    cz("how", 1, 1, 2, "___ can it work—by magnets or string?", ["how", "what", "which", "if"], [FS, FS, DV]),
    rf("how", 1, 1, 3, ["how", "who", "now", "cow"], [VN, VN, VN]),
    cz("if", 1, 1, 1, "We stay in only ___ it rains.", ["if", "and", "but", "that"], [FS, FS, FS]),
    cz("if", 1, 1, 2, "Ask me ___ you need help.", ["if", "for", "of", "to"], [FS, FS, FS]),
    rf("if", 1, 1, 3, ["if", "is", "it", "in"], [VN, VN, VN]),
    cz("not", 1, 1, 1, "The sums are easy, so they are ___ hard.", ["not", "all", "that", "one"], [FS, FS, DV]),
    cz("not", 1, 1, 2, "Mia owns this hat; it is ___ mine.", ["not", "his", "their", "your"], [FS, FS, FS]),
    rf("not", 1, 1, 3, ["not", "now", "nut", "hot"], [VN, VN, VN]),
    cz("one", 1, 1, 1, "From three buns, exactly ___ is left.", ["one", "all", "each", "not"], [DV, FS, DV]),
    cz("one", 1, 1, 2, "Mia had two mittens; exactly ___ is missing.", ["one", "all", "an", "the"], [DV, DV, DV]),
    rf("one", 1, 1, 3, ["one", "on", "own", "once"], [VN, VN, VN]),
    cz("or", 1, 1, 1, "Choose one filling: jam ___ ham.", ["or", "and", "but", "if"], [FS, FS, FS]),
    cz("or", 1, 1, 2, "Pick one colour: red ___ blue.", ["or", "and", "as", "with"], [FS, FS, FS]),
    rf("or", 1, 1, 3, ["or", "of", "for", "on"], [VN, VN, VN]),

    // ============ L1 phase 2: said she their there use we were what when which words your ============
    cz("said", 1, 2, 1, "Yesterday Mum ___, ‘We can camp.’", ["said", "had", "was", "were"], [FS, FS, DV]),
    cz("said", 1, 2, 2, "Dad ___, ‘Yes,’ when I asked.", ["said", "had", "can", "is"], [FS, FS, FS]),
    rf("said", 1, 2, 3, ["said", "sad", "says", "sand"], [VN, VN, VN]),
    cz("she", 1, 2, 1, "My aunt arrived alone. ___ carried her own bag.", ["she", "he", "we", "it"], [FS, FS, FS]),
    cz("she", 1, 2, 2, "Gran entered alone. ___ shut the door behind her.", ["she", "he", "I", "it"], [FS, FS, FS]),
    rf("she", 1, 2, 3, ["she", "he", "see", "sheep"], [VN, VN, VN]),
    cz("their", 1, 2, 1, "The twins flew ___ own kite.", ["their", "there", "they", "the"], [HM, DV, DV]),
    cz("their", 1, 2, 2, "The cubs slept in ___ own den.", ["their", "there", "they", "this"], [HM, DV, DV]),
    rf("their", 1, 2, 3, ["their", "there", "they", "then"], [HM, VN, VN]),
    cz("there", 1, 2, 1, "We walked to the pond and rested ___.", ["there", "their", "they", "your"], [HM, DV, DV]),
    cz("there", 1, 2, 2, "Leave your shoes by the door, right ___.", ["there", "their", "they", "that"], [HM, DV, DV]),
    rf("there", 1, 2, 3, ["there", "their", "then", "three"], [HM, VN, VN]),
    cz("use", 1, 2, 1, "Every day, we ___ soap to wash.", ["use", "said", "were", "do"], [FS, FS, FS]),
    cz("use", 1, 2, 2, "Now we ___ brushes to paint.", ["use", "do", "are", "said"], [FS, FS, FS]),
    rf("use", 1, 2, 3, ["use", "us", "fuse", "up"], [VN, VN, VN]),
    cz("we", 1, 2, 1, "Mia and I arrived. ___ carried the bags together.", ["we", "they", "she", "he"], [FS, FS, FS]),
    cz("we", 1, 2, 2, "Dad and I cooked together. ___ made the meal.", ["we", "they", "he", "you"], [FS, FS, FS]),
    rf("we", 1, 2, 3, ["we", "me", "be", "wet"], [VN, VN, VN]),
    cz("were", 1, 2, 1, "Yesterday, the shops ___ shut; today they are open.", ["were", "are", "was", "is"], [FS, DV, DV]),
    cz("were", 1, 2, 2, "At the vet yesterday, you ___ very brave.", ["were", "was", "are", "be"], [DV, FS, DV]),
    rf("were", 1, 2, 3, ["were", "where", "we", "her"], [VN, VN, VN]),
    cz("what", 1, 2, 1, "___ a huge splash the rock made!", ["what", "when", "how", "which"], [FS, FS, FS]),
    cz("what", 1, 2, 2, "___ fun we had at the park!", ["what", "when", "which", "if"], [FS, FS, DV]),
    rf("what", 1, 2, 3, ["what", "that", "when", "hat"], [VN, VN, VN]),
    cz("when", 1, 2, 1, "___ is lunch: at two or three?", ["when", "as", "if", "by"], [DV, DV, DV]),
    cz("when", 1, 2, 2, "Ring the bell ___ the race begins.", ["when", "but", "or", "that"], [FS, FS, FS]),
    rf("when", 1, 2, 3, ["when", "then", "hen", "what"], [VN, VN, VN]),
    cz("which", 1, 2, 1, "___ hat do you want: red or blue?", ["which", "when", "if", "that"], [FS, FS, DV]),
    cz("which", 1, 2, 2, "___ path is shorter: left or right?", ["which", "how", "when", "if"], [FS, FS, DV]),
    rf("which", 1, 2, 3, ["which", "witch", "with", "wish"], [HM, VN, VN]),
    cz("words", 1, 2, 1, "Mia wrote five ___ on the card.", ["words", "all", "each", "one"], [DV, DV, DV]),
    cz("words", 1, 2, 2, "Ten letters form three ___ on this page.", ["words", "all", "each", "that"], [DV, DV, DV]),
    rf("words", 1, 2, 3, ["words", "word", "works", "birds"], [VN, VN, VN]),
    cz("your", 1, 2, 1, "Mia, tie ___ own shoes.", ["your", "you", "the", "that"], [DV, DV, DV]),
    cz("your", 1, 2, 2, "Ben, bring ___ own lunch.", ["your", "you", "this", "an"], [DV, DV, DV]),
    rf("your", 1, 2, 3, ["your", "you", "our", "out"], [VN, VN, VN]),

    // ============ L2 phase 1 (spell): all … or ============
    sp("all", 2, 1, 1, "We ate ___ the grapes.", ["a", "l", "l", "o", "u"],
      "the double l is the work — one l is the tempting build"),
    lb("all", 2, 1, 2, "___ my pens ran out.", ["a", "l", "l", "u", "o"]),
    sp("an", 2, 1, 1, "He fed ___ ox at the farm.", ["a", "n", "e", "m"]),
    lb("an", 2, 1, 2, "I need ___ extra bed.", ["a", "n", "m", "e"]),
    sp("but", 2, 1, 1, "I tried, ___ I slipped.", ["b", "u", "t", "a", "d"]),
    lb("but", 2, 1, 2, "Small ___ strong!", ["b", "u", "t", "d", "a"]),
    sp("by", 2, 1, 1, "Stand ___ the door, please.", ["b", "y", "i", "e"],
      "bi is the tempting phonetic build"),
    lb("by", 2, 1, 2, "The mill sits ___ a stream.", ["b", "y", "e", "i"]),
    sp("can", 2, 1, 1, "Foxes ___ jump high.", ["c", "a", "n", "k", "e"],
      "kan — the k is present and tempting"),
    lb("can", 2, 1, 2, "___ we camp out back?", ["c", "a", "n", "e", "k"]),
    sp("do", 2, 1, 1, "___ frogs sleep in mud?", ["d", "o", "u", "w"],
      "doo — the u is present and tempting"),
    lb("do", 2, 1, 2, "We ___ sums after lunch.", ["d", "o", "w", "u"]),
    sp("each", 2, 1, 1, "Give ___ hen some corn.", ["e", "a", "c", "h", "i"],
      "eech — the i tempts the phonetic build"),
    lb("each", 2, 1, 2, "___ box has a lid.", ["e", "a", "c", "h", "t"]),
    sp("had", 2, 1, 1, "We ___ fun at the fair.", ["h", "a", "d", "e", "t"]),
    lb("had", 2, 1, 2, "The pup ___ my sock!", ["h", "a", "d", "t", "e"]),
    sp("how", 2, 1, 1, "___ do bees make honey?", ["h", "o", "w", "u", "n"],
      "hou — the u is present and tempting"),
    lb("how", 2, 1, 2, "Show me ___ to knit.", ["h", "o", "w", "n", "u"]),
    sp("if", 2, 1, 1, "Yell ___ you spot land!", ["i", "f", "e", "v"]),
    lb("if", 2, 1, 2, "Ask Dad ___ we may go.", ["i", "f", "v", "e"]),
    sp("not", 2, 1, 1, "That is ___ my cup.", ["n", "o", "t", "u", "k"]),
    lb("not", 2, 1, 2, "Do ___ wake the baby!", ["n", "o", "t", "k", "u"]),
    sp("one", 2, 1, 1, "Just ___ more lap to run!", ["o", "n", "e", "w", "u"],
      "wun — the w and u are present and tempting"),
    lb("one", 2, 1, 2, "___ star shone first.", ["o", "n", "e", "u", "w"]),
    sp("or", 2, 1, 1, "Milk ___ water with lunch?", ["o", "r", "e", "u"]),
    lb("or", 2, 1, 2, "Walk ___ ride — you pick.", ["o", "r", "u", "e"]),

    // ============ L2 phase 2 (spell): said … your ============
    sp("said", 2, 2, 1, "The vet ___ to rest the pup.", ["s", "a", "i", "d", "e"],
      "sed — the e is present; the ai is the irregular work"),
    lb("said", 2, 2, 2, "Gran ___ bedtime is nine.", ["s", "a", "i", "d", "e"]),
    sp("she", 2, 2, 1, "May ___ join our team?", ["s", "h", "e", "i", "c"]),
    lb("she", 2, 2, 2, "___ dug up a gem!", ["s", "h", "e", "c", "i"]),
    sp("their", 2, 2, 1, "The bees kept ___ honey safe.", ["t", "h", "e", "i", "r", "a"],
      "thair — the a is present; ei order is the work"),
    lb("their", 2, 2, 2, "The kids lost ___ ball again.", ["t", "h", "e", "i", "r", "a"]),
    sp("there", 2, 2, 1, "Park the bikes over ___.", ["t", "h", "e", "r", "e", "i"],
      "their letters minus one e — the double e is the work"),
    lb("there", 2, 2, 2, "Is anybody ___?", ["t", "h", "e", "r", "e", "i"]),
    sp("use", 2, 2, 1, "___ both hands to lift it.", ["u", "s", "e", "z", "o"],
      "yooz — z and o are present and tempting"),
    lb("use", 2, 2, 2, "We ___ twigs for the nest.", ["u", "s", "e", "o", "z"]),
    sp("we", 2, 2, 1, "Can ___ bake a plum pie?", ["w", "e", "i", "u"]),
    lb("we", 2, 2, 2, "___ swam till six.", ["w", "e", "u", "i"]),
    sp("were", 2, 2, 1, "The socks ___ still damp.", ["w", "e", "r", "e", "u"],
      "wur — the u is present; the double e is the work"),
    lb("were", 2, 2, 2, "You ___ fast today!", ["w", "e", "r", "e", "u"]),
    sp("what", 2, 2, 1, "___ fell off the shelf?", ["w", "h", "a", "t", "o"],
      "wot — the o is present and tempting"),
    lb("what", 2, 2, 2, "Guess ___ I found!", ["w", "h", "a", "t", "o"]),
    sp("when", 2, 2, 1, "___ does the pool open?", ["w", "h", "e", "n", "u"],
      "wen — the h placement is the work"),
    lb("when", 2, 2, 2, "Clap ___ the song ends.", ["w", "h", "e", "n", "u"]),
    sp("which", 2, 2, 1, "___ sock is mine?", ["w", "h", "i", "c", "h", "t"],
      "wich — the second h is the work"),
    lb("which", 2, 2, 2, "Pick ___ game we play.", ["w", "h", "i", "c", "h", "t"]),
    sp("words", 2, 2, 1, "Rhyming ___ end the same.", ["w", "o", "r", "d", "s", "u"],
      "wurds — the u is present and tempting"),
    lb("words", 2, 2, 2, "Long ___ need long tiles.", ["w", "o", "r", "d", "s", "u"]),
    sp("your", 2, 2, 1, "Tie ___ laces up tight.", ["y", "o", "u", "r", "e"],
      "yor — building without the u is the tempting path"),
    lb("your", 2, 2, 2, "Bring ___ kit on Monday.", ["y", "o", "u", "r", "e"]),

    // ============ Retention reserve (form R) ============
    cz("said", 1, 2, 7, "The coach ___, ‘Rest now.’", ["said", "had", "was", "can"], [FS, FS, FS]),
    cz("their", 1, 2, 7, "The ants built ___ own nest.", ["their", "there", "they", "a"], [HM, DV, DV]),
    cz("were", 1, 2, 7, "The buns ___ warm yesterday; now they are cold.", ["were", "was", "are", "had"], [DV, FS, DV]),
    cz("one", 1, 1, 7, "Exactly ___ of five buns remains.", ["one", "the", "an", "this"], [DV, DV, DV]),
    rf("which", 1, 2, 7, ["which", "witch", "wish", "when"], [HM, VN, VN], "", "point"),
    rf("all", 1, 1, 7, ["all", "tall", "ball", "ill"], [VN, VN, VN], "", "point"),
    sp("there", 2, 2, 7, "Sit ___ by the window.", ["t", "h", "e", "r", "e", "i"]),
    lb("said", 2, 2, 7, "Who ___ that?", ["s", "a", "i", "d", "e"]),
    sp("can", 2, 1, 7, "Crabs ___ nip — take care!", ["c", "a", "n", "k", "e"]),
    lb("your", 2, 2, 7, "Is this ___ pen or mine?", ["y", "o", "u", "r", "e"])
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
