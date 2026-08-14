// HFW Band 2 (words 26–50) — v3 authored bank (wave W7, paired with hfw_1_25).
// Same architecture as band 1 (see hfw_1_25.mjs header). Band-2 particulars:
//   - their/there is an IN-BAND homophone pair — D-HOMOPHONE is live in both
//     directions, plus the they/their and there/then visual-dev slips.
//   - said/each/which carry the classic irregular spellings; the L2 letter
//     banks always include the tempting phonetic letters (said → sed's e,
//     one → wun's w, what → wot's o).
//   - The in-band wh-inventory is exactly {how,what,when,which}, so wh-frames
//     carry one that/if/this intruder to keep option sets unique, and frames
//     pin the single right wh-word by meaning (a tag like "— at two or
//     three?" pins when over how).
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_HFW.md.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

const cz = (u, lvl, ph, v, sentence, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_SENTENCE_CLOZE",
  prompt: sentence,
  spoken: `Which word finishes the sentence? ${sentence.replace("___", "hmm")}`,
  sentence,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  target: u,
  note
});

const rf = (u, lvl, ph, v, words, rationales, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_AUDIO_FIND_WORD", questionType: "listen_and_find_word",
  prompt: "Tap sound. Pick its match.",
  spoken: "Tap sound. Pick its match.",
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
  prompt: `Build the missing word: ${sentence}`,
  spoken: `Build the missing word. ${sentence.replace("___", "hmm")}`,
  sentence,
  sentenceText: sentence.replace("___", u),
  choices: [K(u)],
  letterTiles: tiles,
  media: "text",
  target: u,
  note
});

const lb = (u, lvl, ph, v, sentence, tiles, note = "") => ({
  u, lvl, ph, v, fmt: "HFW_LETTER_BUILD",
  prompt: `Build the missing word: ${sentence}`,
  spoken: `Build the missing word. ${sentence.replace("___", "hmm")}`,
  sentence,
  sentenceText: sentence.replace("___", u),
  choices: [K(u)],
  letterTiles: tiles,
  media: "text",
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
    cz("all", 1, 1, 1, "She fed ___ of the cats.", ["all", "one", "each", "both"], [FS, FS, FS]),
    cz("all", 1, 1, 2, "He drank ___ the milk. The jug is empty!", ["all", "some", "one", "most"], [FS, DV, FS],
      "the empty jug pins all; some and most parse but contradict it"),
    rf("all", 1, 1, 3, ["all", "ball", "tall", "doll"], [VN, VN, VN]),
    cz("an", 1, 1, 1, "I ate ___ egg.", ["an", "a", "the", "one"], [DV, FS, FS],
      "a egg — THE a/an error"),
    cz("an", 1, 1, 2, "She saw ___ owl at dusk.", ["an", "a", "the", "that"], [DV, FS, FS]),
    rf("an", 1, 1, 3, ["an", "and", "on", "in"], [VN, VN, VN]),
    cz("but", 1, 1, 1, "I ran fast, ___ I missed the bus.", ["but", "and", "or", "if"], [FS, FS, FS]),
    cz("but", 1, 1, 2, "The sun is out, ___ it is cold.", ["but", "and", "when", "or"], [FS, FS, FS]),
    rf("but", 1, 1, 3, ["but", "bat", "bus", "cut"], [VN, VN, VN]),
    cz("by", 1, 1, 1, "The nest is ___ the gate.", ["by", "at", "on", "in"], [FS, FS, FS]),
    cz("by", 1, 1, 2, "We sat ___ the pond.", ["by", "on", "with", "at"], [FS, DV, FS]),
    rf("by", 1, 1, 3, ["by", "my", "buy", "be"], [VN, HM, VN]),
    cz("can", 1, 1, 1, "___ you hop like a frog?", ["can", "do", "are", "were"], [FS, DV, DV]),
    cz("can", 1, 1, 2, "The twins ___ swim fast.", ["can", "had", "are", "said"], [DV, DV, DV],
      "do stays out — the twins do swim fast would be a second key"),
    rf("can", 1, 1, 3, ["can", "cat", "cap", "ran"], [VN, VN, VN]),
    cz("do", 1, 1, 1, "___ you like plums?", ["do", "can", "had", "is"], [FS, DV, DV]),
    cz("do", 1, 1, 2, "What ___ cows eat?", ["do", "can", "are", "had"], [FS, DV, DV]),
    rf("do", 1, 1, 3, ["do", "to", "go", "dot"], [VN, VN, VN]),
    cz("each", 1, 1, 1, "___ kid got a badge.", ["each", "one", "all", "the"], [FS, DV, FS],
      "all kid — the agreement slip children make"),
    cz("each", 1, 1, 2, "Put a cup at ___ desk.", ["each", "one", "all", "that"], [FS, DV, FS]),
    rf("each", 1, 1, 3, ["each", "ear", "eat", "teach"], [VN, VN, VN]),
    cz("had", 1, 1, 1, "Last week we ___ a picnic.", ["had", "have", "has", "do"], [FS, DV, DV],
      "last week pins the past tense; have is the tense slip"),
    cz("had", 1, 1, 2, "Gran ___ six cats long ago.", ["had", "has", "have", "was"], [FS, DV, DV]),
    rf("had", 1, 1, 3, ["had", "has", "hat", "bad"], [VN, VN, VN]),
    cz("how", 1, 1, 1, "___ do you make jam?", ["how", "what", "when", "which"], [FS, FS, FS]),
    cz("how", 1, 1, 2, "Tell me ___ the trick works.", ["how", "when", "what", "if"], [FS, DV, FS]),
    rf("how", 1, 1, 3, ["how", "who", "now", "cow"], [VN, VN, VN]),
    cz("if", 1, 1, 1, "Ask me ___ you get stuck.", ["if", "when", "and", "but"], [FS, FS, FS]),
    cz("if", 1, 1, 2, "___ it rains, we stay in.", ["if", "when", "but", "as"], [FS, DV, DV]),
    rf("if", 1, 1, 3, ["if", "is", "it", "in"], [VN, VN, VN]),
    cz("not", 1, 1, 1, "The sums are ___ hard — they are easy!", ["not", "all", "that", "very"], [DV, FS, FS],
      "the easy tag pins not"),
    cz("not", 1, 1, 2, "That is ___ my hat!", ["not", "now", "all", "for"], [VN, DV, FS],
      "now is the not/now slip"),
    rf("not", 1, 1, 3, ["not", "now", "nut", "hot"], [VN, VN, VN]),
    cz("one", 1, 1, 1, "I have just ___ wish.", ["one", "a", "an", "each"], [FS, DV, DV]),
    cz("one", 1, 1, 2, "___ duck swam off; two stayed.", ["one", "a", "each", "all"], [FS, FS, DV]),
    rf("one", 1, 1, 3, ["one", "on", "own", "once"], [VN, VN, VN]),
    cz("or", 1, 1, 1, "Do you want jam ___ ham?", ["or", "and", "but", "not"], [FS, DV, FS]),
    cz("or", 1, 1, 2, "Is the cup full ___ empty?", ["or", "and", "as", "if"], [FS, DV, DV]),
    rf("or", 1, 1, 3, ["or", "of", "for", "on"], [VN, VN, VN]),

    // ============ L1 phase 2: said she their there use we were what when which words your ============
    cz("said", 1, 2, 1, "Mum ___ we can camp!", ["said", "says", "sad", "saw"], [FS, VN, VN],
      "sad is the said/sad slip; saw parses and reverses the meaning"),
    cz("said", 1, 2, 2, "Dad ___ yes at last.", ["said", "says", "sad", "had"], [FS, VN, DV]),
    rf("said", 1, 2, 3, ["said", "sad", "says", "sand"], [VN, VN, VN]),
    cz("she", 1, 2, 1, "My aunt naps when ___ can.", ["she", "he", "we", "it"], [FS, DV, FS],
      "the aunt pins she"),
    cz("she", 1, 2, 2, "Gran hums as ___ bakes.", ["she", "he", "it", "they"], [FS, FS, DV]),
    rf("she", 1, 2, 3, ["she", "he", "see", "sheep"], [VN, VN, VN]),
    cz("their", 1, 2, 1, "The twins lost ___ kite.", ["their", "there", "they", "his"], [HM, DV, FS],
      "there is the homophone; they is the they/their slip; his misses the plural"),
    cz("their", 1, 2, 2, "The cubs drank ___ milk.", ["their", "there", "the", "they"], [HM, FS, DV]),
    rf("their", 1, 2, 3, ["their", "there", "they", "then"], [HM, VN, VN]),
    cz("there", 1, 2, 1, "Look — the bus is over ___!", ["there", "their", "that", "the"], [HM, DV, DV]),
    cz("there", 1, 2, 2, "We got ___ just in time.", ["there", "their", "that", "then"], [HM, FS, VN],
      "got their — the classic reversal; then is the there/then slip"),
    rf("there", 1, 2, 3, ["there", "their", "then", "three"], [HM, VN, VN]),
    cz("use", 1, 2, 1, "___ the key to open the box.", ["use", "have", "do", "can"], [DV, DV, DV]),
    cz("use", 1, 2, 2, "We ___ mud to make bricks.", ["use", "are", "do", "can"], [DV, DV, DV],
      "had stays out — we had mud would be true too"),
    rf("use", 1, 2, 3, ["use", "us", "fuse", "up"], [VN, VN, VN]),
    cz("we", 1, 2, 1, "Sis and I hid. ___ both grinned.", ["we", "they", "she", "you"], [FS, DV, FS],
      "the speaker is in the pair, so we is the only true reference"),
    cz("we", 1, 2, 2, "Dad and I fish. ___ catch cod!", ["we", "they", "he", "you"], [FS, FS, FS],
      "catch cod, not get wet — wet contains we and would gift the key a chunk"),
    rf("we", 1, 2, 3, ["we", "me", "be", "wet"], [VN, VN, VN]),
    cz("were", 1, 2, 1, "The shops ___ shut at ten.", ["were", "was", "are", "is"], [DV, FS, DV],
      "the shops was — the agreement slip; are misses the tense"),
    cz("were", 1, 2, 2, "You ___ so brave at the vet!", ["were", "was", "are", "be"], [DV, FS, DV],
      "you was — THE developmental error"),
    rf("were", 1, 2, 3, ["were", "where", "we", "her"], [VN, VN, VN]),
    cz("what", 1, 2, 1, "___ is in the big box?", ["what", "which", "when", "that"], [FS, DV, DV]),
    cz("what", 1, 2, 2, "Guess ___ I made for you!", ["what", "which", "when", "if"], [FS, DV, DV]),
    rf("what", 1, 2, 3, ["what", "that", "when", "hat"], [VN, VN, VN]),
    cz("when", 1, 2, 1, "___ does the show start?", ["when", "how", "what", "that"], [FS, DV, DV],
      "the two-or-three tag pins when over how"),
    cz("when", 1, 2, 2, "I clap ___ you sing.", ["when", "if", "as", "and"], [FS, FS, DV]),
    rf("when", 1, 2, 3, ["when", "then", "hen", "what"], [VN, VN, VN]),
    cz("which", 1, 2, 1, "___ hat is yours — red or blue?", ["which", "what", "that", "this"], [FS, DV, DV]),
    cz("which", 1, 2, 2, "Tell me ___ pup you like best.", ["which", "what", "each", "that"], [FS, FS, DV]),
    rf("which", 1, 2, 3, ["which", "witch", "with", "wish"], [HM, VN, VN]),
    cz("words", 1, 2, 1, "We read six new ___ today.", ["words", "word", "works", "wands"], [DV, VN, VN],
      "six new word — the plural slip"),
    cz("words", 1, 2, 2, "Big ___ can be fun to spell.", ["words", "word", "works", "worms"], [DV, VN, VN]),
    rf("words", 1, 2, 3, ["words", "word", "works", "birds"], [VN, VN, VN]),
    cz("your", 1, 2, 1, "Is this ___ scarf?", ["your", "you", "his", "the"], [DV, FS, FS],
      "is this you scarf — the you/your slip"),
    cz("your", 1, 2, 2, "Pack ___ bags for camp.", ["your", "you", "the", "their"], [DV, FS, FS]),
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
    cz("said", 1, 2, 7, "The coach ___ to rest up.", ["said", "says", "saw", "had"], [FS, VN, DV]),
    cz("their", 1, 2, 7, "The ants built ___ nest fast.", ["their", "there", "the", "his"], [HM, FS, FS]),
    cz("were", 1, 2, 7, "The buns ___ still warm.", ["were", "was", "are", "had"], [DV, FS, DV]),
    cz("one", 1, 1, 7, "Just ___ bun is left.", ["one", "an", "each", "all"], [DV, FS, DV],
      "only would gift the key its on-chunk"),
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
