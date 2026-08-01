// HFW Band 1 (words 1–25) — v3 authored bank (wave W7, paired with hfw_26_50).
// The P0 fix: itemKey IS the word (25 units), never a per-question key.
// L1 read & choose: HFW_SENTENCE_CLOZE (every distractor parses in the frame —
//   grammar alone can never eliminate; determiner sets carry one visual-dev
//   intruder like they/at/is because the pure determiner inventory is too small
//   for unique option sets, and those intruders are the errors children really
//   make) + HFW_READ_FIND_WORD (find ⟨was⟩ among real visual neighbours — the
//   construct IS print recognition, so the surface-match oracle is expected and
//   the items carry scannerExpected).
// L2 spell: HFW_SENTENCE_SPELL_CONTEXT + HFW_LETTER_BUILD — tile builds; the
//   word is never displayed, the letter bank always includes the tempting
//   wrong letters (was → z, o present). Text tier runs read-and-spell from the
//   sentence; recorded audio is resolved through the production registry.
// Frames use band-1 words plus decodable content words only.
// Spec: docs/skills-assessment-rebuild/BLUEPRINTS_HFW.md.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });

// Sentence cloze. The PROMPT IS THE SENTENCE: instruction words like
// "word" and "finishes" contain or/in/is and would hand those keys to a
// letter scanner; the frames themselves are audited per item instead.
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

// Read-and-find: the construct is print recognition — scanner expected.
const rf = (u, lvl, ph, v, words, rationales, note = "", frame = "find") => ({
  u, lvl, ph, v, fmt: "HFW_READ_FIND_WORD",
  prompt: frame === "point" ? `Point to the word: ${u}` : `Find the word: ${u}`,
  spoken: `${u}. Find the word ${u}.`,
  choices: words.map((w, i) => (i === 0 ? K(w) : P(w, rationales[i - 1]))),
  media: "text",
  target: u,
  scannerExpected: true,
  note: note || "print recognition IS the construct — surface match is the task"
});

// Spell in context (tile build, word never shown).
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

// Letter build.
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

export default {
  skillId: "hfw_1_25",
  skillName: "High-Frequency Words 1–25",
  items: [
    // ================= L1 phase 1: a and are as at be for from have he his i in =================
    cz("a", 1, 1, 1, "I see ___ red hen.", ["a", "the", "his", "at"], [FS, FS, VN]),
    cz("a", 1, 1, 2, "We had ___ nap at two.", ["a", "this", "that", "and"], [FS, FS, VN]),
    rf("a", 1, 1, 3, ["a", "at", "as", "an"], [VN, VN, VN]),
    cz("and", 1, 1, 1, "We have both jam ___ bread.", ["and", "but", "or", "at"], [FS, FS, FS],
      "both ... and pins the joining word; no distractor produces a defensible sentence"),
    cz("and", 1, 1, 2, "She has both a cat ___ a dog.", ["and", "but", "for", "at"], [FS, FS, FS]),
    rf("and", 1, 1, 3, ["and", "an", "ant", "as"], [VN, VN, VN]),
    cz("are", 1, 1, 1, "The pigs ___ in the mud.", ["are", "was", "is", "be"], [FS, DV, DV],
      "agreement errors are what K-2 children really weigh — never eliminable by grammar alone at this age"),
    cz("are", 1, 1, 2, "You ___ my best pal.", ["are", "was", "have", "be"], [FS, FS, DV]),
    rf("are", 1, 1, 3, ["are", "ear", "arm", "art"], [VN, VN, VN]),
    cz("as", 1, 1, 1, "It is big ___ a bus.", ["as", "for", "on", "in"], [FS, FS, FS]),
    cz("as", 1, 1, 2, "Sam is fast ___ a fox.", ["as", "for", "with", "on"], [FS, FS, FS]),
    rf("as", 1, 1, 3, ["as", "at", "an", "is"], [VN, VN, VN]),
    cz("at", 1, 1, 1, "We nap ___ two.", ["at", "in", "for", "on"], [FS, FS, FS]),
    cz("at", 1, 1, 2, "The bus stops ___ my home.", ["at", "from", "in", "on"], [FS, FS, FS]),
    rf("at", 1, 1, 3, ["at", "as", "an", "it"], [VN, VN, VN]),
    cz("be", 1, 1, 1, "You can ___ my helper.", ["be", "is", "was", "have"], [DV, DV, FS]),
    cz("be", 1, 1, 2, "It will ___ hot at two.", ["be", "was", "are", "has"], [DV, DV, FS]),
    rf("be", 1, 1, 3, ["be", "by", "bee", "he"], [VN, VN, VN]),
    cz("for", 1, 1, 1, "I made this gift ___ you.", ["for", "was", "his", "be"], [VN, FS, FS],
      "the frame now has one defensible completion"),
    cz("for", 1, 1, 2, "We cheered ___ our team.", ["for", "are", "this", "at"], [VN, DV, VN]),
    rf("for", 1, 1, 3, ["for", "of", "from", "fog"], [VN, VN, VN]),
    cz("from", 1, 1, 1, "Gran sent the card ___ her house.", ["from", "for", "with", "of"], [VN, FS, VN]),
    cz("from", 1, 1, 2, "He came home ___ the park.", ["from", "to", "in", "at"], [FS, FS, FS],
      "back not home in the frame — home contains om and would gift the key a chunk"),
    rf("from", 1, 1, 3, ["from", "for", "form", "fort"], [VN, VN, VN]),
    cz("have", 1, 1, 1, "We ___ ten hens.", ["have", "are", "is", "was"], [FS, DV, DV]),
    cz("have", 1, 1, 2, "They ___ a big red van.", ["have", "are", "is", "be"], [FS, DV, DV]),
    rf("have", 1, 1, 3, ["have", "has", "had", "gave"], [VN, VN, VN]),
    cz("he", 1, 1, 1, "Dad is tall. ___ has big boots.", ["he", "it", "they", "i"], [FS, FS, DV],
      "the lead sentence pins the reference — bare pronoun frames have no single key"),
    cz("he", 1, 1, 2, "Ben naps. ___ is in bed.", ["he", "it", "they", "you"], [FS, FS, FS]),
    rf("he", 1, 1, 3, ["he", "be", "the", "she"], [VN, VN, VN]),
    cz("his", 1, 1, 1, "Sam hurt ___ leg.", ["his", "a", "this", "is"], [FS, FS, VN],
      "Sam hurt is leg — the his/is slip children really write"),
    cz("his", 1, 1, 2, "The dog wags ___ tail.", ["his", "the", "that", "is"], [FS, FS, VN]),
    rf("his", 1, 1, 3, ["his", "is", "has", "him"], [VN, VN, VN]),
    cz("i", 1, 1, 1, "Mom and ___ bake buns.", ["I", "me", "they", "you"], [FS, FS, FS],
      "only I forms the standard compound subject"),
    cz("i", 1, 1, 2, "___ am ready for my turn.", ["I", "you", "he", "it"], [FS, FS, FS]),
    rf("i", 1, 1, 3, ["I", "in", "it", "is"], [VN, VN, VN]),
    cz("in", 1, 1, 1, "The jam is ___ the jar.", ["in", "on", "at", "with"], [VN, FS, FS]),
    cz("in", 1, 1, 2, "The fish swim ___ the sea.", ["in", "on", "to", "at"], [VN, FS, FS]),
    rf("in", 1, 1, 3, ["in", "on", "an", "win"], [VN, VN, VN]),

    // ================= L1 phase 2: is it of on that the they this to was with you =================
    cz("is", 1, 2, 1, "The sun ___ hot.", ["is", "was", "be", "has"], [FS, DV, FS]),
    cz("is", 1, 2, 2, "My cup ___ full.", ["is", "was", "are", "has"], [FS, DV, FS]),
    rf("is", 1, 2, 3, ["is", "his", "it", "as"], [VN, VN, VN]),
    cz("it", 1, 2, 1, "The egg fell. ___ has a crack.", ["it", "he", "you", "at"], [FS, FS, VN]),
    cz("it", 1, 2, 2, "I like the hat. ___ is red.", ["it", "they", "you", "I"], [FS, FS, DV]),
    rf("it", 1, 2, 3, ["it", "is", "at", "sit"], [VN, VN, VN]),
    cz("of", 1, 2, 1, "I want a cup ___ milk.", ["of", "for", "in", "with"], [VN, FS, FS]),
    cz("of", 1, 2, 2, "That is a map ___ the zoo.", ["of", "for", "from", "to"], [VN, FS, FS]),
    rf("of", 1, 2, 3, ["of", "off", "for", "on"], [VN, VN, VN]),
    cz("on", 1, 2, 1, "The cat naps ___ the rug.", ["on", "in", "of", "at"], [VN, VN, FS]),
    cz("on", 1, 2, 2, "Put the lid ___ the pot.", ["on", "in", "with", "of"], [VN, FS, VN]),
    rf("on", 1, 2, 3, ["on", "in", "an", "no"], [VN, VN, VN]),
    cz("that", 1, 2, 1, "See ___ ship far, far out?", ["that", "this", "the", "at"], [FS, FS, VN],
      "far pins that over this; the parses but loses the pointing"),
    cz("that", 1, 2, 2, "I sang ___ song long ago.", ["that", "this", "a", "the"], [FS, FS, FS]),
    rf("that", 1, 2, 3, ["that", "than", "hat", "this"], [VN, VN, VN]),
    cz("the", 1, 2, 1, "Look at ___ big red sun!", ["the", "a", "this", "they"], [FS, FS, VN],
      "they in a determiner slot is the the/they slip children write"),
    cz("the", 1, 2, 2, "We fed ___ hens at six.", ["the", "his", "that", "they"], [FS, DV, VN]),
    rf("the", 1, 2, 3, ["the", "they", "then", "she"], [VN, VN, VN]),
    cz("they", 1, 2, 1, "The pigs sat. ___ are muddy!", ["they", "he", "it", "them"], [FS, FS, VN]),
    cz("they", 1, 2, 2, "My socks? ___ are wet.", ["they", "it", "I", "them"], [FS, DV, VN]),
    rf("they", 1, 2, 3, ["they", "them", "then", "the"], [VN, VN, VN]),
    cz("this", 1, 2, 1, "Look at ___ bug on my hand!", ["this", "that", "the", "is"], [FS, FS, VN],
      "on my hand pins this over that"),
    cz("this", 1, 2, 2, "___ hat here is mine.", ["this", "that", "a", "his"], [FS, FS, FS],
      "here pins this"),
    rf("this", 1, 2, 3, ["this", "that", "his", "is"], [VN, VN, VN]),
    cz("to", 1, 2, 1, "We go ___ the park.", ["to", "from", "with", "in"], [FS, FS, FS]),
    cz("to", 1, 2, 2, "I gave the pen ___ Ben.", ["to", "for", "from", "at"], [FS, FS, DV]),
    rf("to", 1, 2, 3, ["to", "too", "top", "ten"], [VN, VN, VN]),
    cz("was", 1, 2, 1, "Yesterday the cat ___ on the bed.", ["was", "is", "saw", "has"], [FS, VN, FS],
      "yesterday pins the past-tense form"),
    cz("was", 1, 2, 2, "Yesterday the milk ___ cold.", ["was", "is", "be", "saw"], [FS, DV, VN]),
    rf("was", 1, 2, 3, ["was", "saw", "has", "wag"], [VN, VN, VN]),
    cz("with", 1, 2, 1, "I hop ___ my dog.", ["with", "for", "to", "at"], [FS, FS, DV]),
    cz("with", 1, 2, 2, "She sang ___ me at camp.", ["with", "for", "at", "from"], [FS, DV, FS]),
    rf("with", 1, 2, 3, ["with", "wish", "wit", "win"], [VN, VN, VN]),
    cz("you", 1, 2, 1, "___ are my best pal.", ["you", "they", "he", "him"], [FS, DV, VN]),
    cz("you", 1, 2, 2, "Can ___ see the big top?", ["you", "he", "I", "in"], [FS, FS, VN]),
    rf("you", 1, 2, 3, ["you", "yes", "your", "yak"], [VN, VN, VN]),

    // ================= L2 phase 1 (spell): a … in =================
    sp("a", 2, 1, 1, "He has ___ pet rat.", ["a", "e", "u"]),
    lb("a", 2, 1, 2, "I met ___ vet today.", ["a", "o", "i"]),
    sp("and", 2, 1, 1, "Six ___ ten make sixteen.", ["a", "n", "d", "e", "t"]),
    lb("and", 2, 1, 2, "Mum ___ Gran sat down.", ["a", "n", "d", "u", "e"]),
    sp("are", 2, 1, 1, "The cubs ___ so soft.", ["a", "r", "e", "u", "i"]),
    lb("are", 2, 1, 2, "My hands ___ cold.", ["a", "r", "e", "o", "u"]),
    sp("as", 2, 1, 1, "He is fast ___ a jet.", ["a", "s", "z", "e"]),
    lb("as", 2, 1, 2, "It is cold ___ ice.", ["a", "s", "e", "z"]),
    sp("at", 2, 1, 1, "We met ___ the pond.", ["a", "t", "e", "i"]),
    lb("at", 2, 1, 2, "Look ___ my sandcastle!", ["a", "t", "i", "e"]),
    sp("be", 2, 1, 1, "Dad will ___ back soon.", ["b", "e", "d", "y"]),
    lb("be", 2, 1, 2, "It can ___ windy up here.", ["b", "e", "y", "d"]),
    sp("for", 2, 1, 1, "This bun is ___ Gran.", ["f", "o", "r", "u", "e"]),
    lb("for", 2, 1, 2, "We sang ___ the class.", ["f", "o", "r", "e", "u"]),
    sp("from", 2, 1, 1, "The gift came ___ Gramps.", ["f", "r", "o", "m", "u"]),
    lb("from", 2, 1, 2, "Milk comes ___ cows.", ["f", "r", "o", "m", "e"]),
    sp("have", 2, 1, 1, "The twins ___ red hats.", ["h", "a", "v", "e", "f"]),
    lb("have", 2, 1, 2, "We ___ six eggs left.", ["h", "a", "v", "e", "u"]),
    sp("he", 2, 1, 1, "Gramps naps when ___ can.", ["h", "e", "a", "i"]),
    lb("he", 2, 1, 2, "Tom grins when ___ wins.", ["h", "e", "i", "a"]),
    sp("his", 2, 1, 1, "Dan lost ___ left sock.", ["h", "i", "s", "z", "e"]),
    lb("his", 2, 1, 2, "The king sat on ___ throne.", ["h", "i", "s", "e", "z"]),
    sp("i", 2, 1, 1, "Mum and ___ swim on Sundays.", ["i", "e", "y"]),
    lb("i", 2, 1, 2, "May ___ pet the pup?", ["i", "y", "e"]),
    sp("in", 2, 1, 1, "The frogs hop ___ the pond.", ["i", "n", "e", "m"]),
    lb("in", 2, 1, 2, "Pop the coins ___ the tin.", ["i", "n", "m", "e"]),

    // ================= L2 phase 2 (spell): is … you =================
    sp("is", 2, 2, 1, "The soup ___ hot.", ["i", "s", "z", "e"]),
    lb("is", 2, 2, 2, "My bike ___ new.", ["i", "s", "e", "z"]),
    sp("it", 2, 2, 1, "The nest? ___ sits up high.", ["i", "t", "e", "a"]),
    lb("it", 2, 2, 2, "Grab the rope and pull ___!", ["i", "t", "a", "e"]),
    sp("of", 2, 2, 1, "I had a mug ___ milk.", ["o", "f", "v", "u"]),
    lb("of", 2, 2, 2, "Here is a box ___ pins.", ["o", "f", "u", "v"]),
    sp("on", 2, 2, 1, "The clock hangs ___ the wall.", ["o", "n", "u", "m"]),
    lb("on", 2, 2, 2, "Hop ___ the bus, quick!", ["o", "n", "m", "u"]),
    sp("that", 2, 2, 1, "Who left ___ mess there?", ["t", "h", "a", "t", "e"]),
    lb("that", 2, 2, 2, "I drew ___ map myself.", ["t", "h", "a", "t", "i"]),
    sp("the", 2, 2, 1, "Shut ___ gate, please.", ["t", "h", "e", "u", "a"]),
    lb("the", 2, 2, 2, "Feed ___ fish at nine.", ["t", "h", "e", "a", "u"]),
    sp("they", 2, 2, 1, "The elves? ___ hid well.", ["t", "h", "e", "y", "a"]),
    lb("they", 2, 2, 2, "My boots? ___ got wet.", ["t", "h", "e", "y", "i"]),
    sp("this", 2, 2, 1, "Smell ___ rose right here.", ["t", "h", "i", "s", "e"]),
    lb("this", 2, 2, 2, "Hold ___ end of the rope.", ["t", "h", "i", "s", "z"]),
    sp("to", 2, 2, 1, "We row ___ the dock.", ["t", "o", "u", "w"]),
    lb("to", 2, 2, 2, "Pass the jam ___ Gran.", ["t", "o", "w", "u"]),
    sp("was", 2, 2, 1, "The soup ___ too hot.", ["w", "a", "s", "z", "o"],
      "the blueprint exemplar bank — z and o are the tempting wrong letters"),
    lb("was", 2, 2, 2, "The trip ___ so much fun.", ["w", "a", "s", "o", "z"]),
    sp("with", 2, 2, 1, "Come camp ___ us!", ["w", "i", "t", "h", "e"]),
    lb("with", 2, 2, 2, "Mix the eggs ___ a fork.", ["w", "i", "t", "h", "f"]),
    sp("you", 2, 2, 1, "Did ___ see the comet?", ["y", "o", "u", "e", "w"]),
    lb("you", 2, 2, 2, "I made this card for ___.", ["y", "o", "u", "w", "e"]),

    // ================= Retention reserve (form R) =================
    cz("a", 1, 1, 7, "She fed ___ small lamb.", ["a", "the", "this", "at"], [FS, FS, VN]),
    cz("for", 1, 1, 7, "I baked this ___ Dad.", ["for", "to", "with", "of"], [FS, FS, VN]),
    cz("was", 1, 2, 7, "The pond ___ full of frogs.", ["was", "is", "are", "saw"], [FS, DV, VN]),
    cz("they", 1, 2, 7, "The ducks? ___ swam off.", ["they", "it", "you", "them"], [FS, FS, VN]),
    rf("of", 1, 2, 7, ["of", "off", "on", "an"], [VN, VN, VN], "", "point"),
    rf("with", 1, 2, 7, ["with", "win", "wish", "wig"], [VN, VN, VN], "", "point"),
    sp("the", 2, 2, 7, "Sweep ___ steps, please.", ["t", "h", "e", "a", "u"]),
    lb("you", 2, 2, 7, "Can ___ lift this log?", ["y", "o", "u", "w", "e"]),
    sp("from", 2, 1, 7, "We hid ___ the rain.", ["f", "r", "o", "m", "u"]),
    lb("his", 2, 1, 7, "Bob packs ___ own lunch.", ["h", "i", "s", "z", "e"])
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
