// HFW Band 1 (words 1–25) — v3 authored bank (wave W7, paired with hfw_26_50).
// The P0 fix: itemKey IS the word (25 units), never a per-question key.
// L1 read & choose: HFW_SENTENCE_CLOZE (the complete spoken sentence leaves
//   exactly one grammatically and semantically defensible answer; distractors
//   are real function-word, developmental, or visual-neighbour errors) plus
//   HFW_AUDIO_FIND_WORD (hear a production recording, then identify
//   the matching printed word among real visual neighbours).
// L2 spell: HFW_SENTENCE_SPELL_CONTEXT + HFW_LETTER_BUILD — tile builds; the
//   word is never displayed, the letter bank always includes the tempting
//   wrong letters (was → z, o present). Text tier runs read-and-spell from the
//   sentence; recorded audio is resolved through the production registry.
// Frames use band-1 words plus decodable content words only.
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

// Sentence cloze. The task stays explicit in the prompt while the sentence
// remains a separate visible stimulus.
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

// Audio-find: the target is never printed in the prompt.
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

// Spell in context (tile build, word never shown).
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

// Letter build.
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

export default {
  skillId: "hfw_1_25",
  skillName: "High-Frequency Words 1–25",
  items: [
    // ================= L1 phase 1: a and are as at be for from have he his i in =================
    cz("a", 1, 1, 1, "Mia wants ___ dog.", ["a", "of", "it", "they"], [DV, DV, DV]),
    cz("a", 1, 1, 2, "Ben needs ___ hat.", ["a", "in", "he", "you"], [DV, DV, DV]),
    rf("a", 1, 1, 3, ["a", "at", "as", "an"], [VN, VN, VN]),
    cz("and", 1, 1, 1, "We packed both jam ___ bread.", ["and", "as", "for", "at"], [DV, DV, DV]),
    cz("and", 1, 1, 2, "Both a cat ___ a dog came.", ["and", "as", "for", "with"], [DV, DV, DV]),
    rf("and", 1, 1, 3, ["and", "an", "ant", "as"], [VN, VN, VN]),
    cz("are", 1, 1, 1, "These animals ___ pigs, not hens.", ["are", "is", "was", "that"], [DV, DV, DV]),
    cz("are", 1, 1, 2, "The labels say these pets ___ cats, not dogs.", ["are", "is", "be", "his"], [DV, DV, DV]),
    rf("are", 1, 1, 3, ["are", "ear", "arm", "art"], [VN, VN, VN]),
    cz("as", 1, 1, 1, "Mia is tall. Ben is just ___ tall.", ["as", "at", "for", "in"], [DV, DV, DV]),
    cz("as", 1, 1, 2, "The box is big. The bag is ___ big.", ["as", "with", "from", "on"], [DV, DV, DV]),
    rf("as", 1, 1, 3, ["as", "at", "an", "is"], [VN, VN, VN]),
    cz("at", 1, 1, 1, "We meet ___ noon.", ["at", "on", "as", "with"], [FS, FS, FS]),
    cz("at", 1, 1, 2, "Lunch starts ___ six o'clock.", ["at", "on", "as", "of"], [FS, FS, FS]),
    rf("at", 1, 1, 3, ["at", "as", "an", "it"], [VN, VN, VN]),
    cz("be", 1, 1, 1, "Mia chose this career; she will ___ a vet.", ["be", "is", "was", "his"], [DV, DV, DV]),
    cz("be", 1, 1, 2, "Ben earned the role; he will ___ our captain.", ["be", "is", "was", "are"], [DV, DV, DV]),
    rf("be", 1, 1, 3, ["be", "by", "bee", "he"], [VN, VN, VN]),
    cz("for", 1, 1, 1, "This key is ___ opening the box.", ["for", "of", "to", "with"], [DV, DV, DV]),
    cz("for", 1, 1, 2, "These boots are ___ walking in rain.", ["for", "of", "as", "in"], [DV, DV, DV]),
    rf("for", 1, 1, 3, ["for", "of", "from", "fog"], [VN, VN, VN]),
    cz("from", 1, 1, 1, "Gran mailed it alone; the card comes ___ Gran.", ["from", "to", "for", "at"], [FS, FS, FS]),
    cz("from", 1, 1, 2, "He begins at the park and walks ___ it.", ["from", "to", "with", "at"], [FS, FS, FS]),
    rf("from", 1, 1, 3, ["from", "for", "form", "fort"], [VN, VN, VN]),
    cz("have", 1, 1, 1, "The hens belong to us; we ___ ten hens.", ["have", "are", "is", "his"], [FS, DV, DV]),
    cz("have", 1, 1, 2, "The red van belongs to them; they ___ it.", ["have", "are", "be", "he"], [FS, DV, DV]),
    rf("have", 1, 1, 3, ["have", "has", "had", "gave"], [VN, VN, VN]),
    cz("he", 1, 1, 1, "Ben put on his boots. ___ wore them.", ["he", "it", "they", "I"], [FS, FS, FS]),
    cz("he", 1, 1, 2, "Dad got into bed. ___ slept there.", ["he", "it", "they", "you"], [FS, FS, FS]),
    rf("he", 1, 1, 3, ["he", "be", "the", "she"], [VN, VN, VN]),
    cz("his", 1, 1, 1, "Ben hurt ___ own leg.", ["his", "the", "that", "this"], [DV, DV, DV]),
    cz("his", 1, 1, 2, "Rex wags ___ own tail.", ["his", "the", "that", "it"], [DV, DV, DV]),
    rf("his", 1, 1, 3, ["his", "is", "has", "him"], [VN, VN, VN]),
    cz("i", 1, 1, 1, "Ben said about himself, “___ can bake.”", ["I", "he", "it", "you"], [FS, FS, FS]),
    cz("i", 1, 1, 2, "Mia said about herself, “___ will swim.”", ["I", "he", "they", "you"], [FS, FS, FS]),
    rf("i", 1, 1, 3, ["I", "in", "it", "is"], [VN, VN, VN]),
    cz("in", 1, 1, 1, "The jam is sealed ___ the jar.", ["in", "of", "as", "the"], [DV, DV, DV]),
    cz("in", 1, 1, 2, "The fish swims ___ the tank.", ["in", "is", "he", "they"], [DV, DV, DV]),
    rf("in", 1, 1, 3, ["in", "on", "an", "win"], [VN, VN, VN]),

    // ================= L1 phase 2: is it of on that the they this to was with you =================
    cz("is", 1, 2, 1, "Right now, the thermometer shows the soup ___ hot.", ["is", "are", "be", "he"], [DV, DV, DV]),
    cz("is", 1, 2, 2, "The label proves the cup ___ full, not empty.", ["is", "are", "have", "that"], [DV, DV, DV]),
    rf("is", 1, 2, 3, ["is", "his", "it", "as"], [VN, VN, VN]),
    cz("it", 1, 2, 1, "The egg fell. ___ cracked on the floor.", ["it", "I", "they", "you"], [FS, FS, FS]),
    cz("it", 1, 2, 2, "I found the hat. ___ fits my head.", ["it", "he", "they", "is"], [FS, FS, DV]),
    rf("it", 1, 2, 3, ["it", "is", "at", "sit"], [VN, VN, VN]),
    cz("of", 1, 2, 1, "The cup is full ___ milk.", ["of", "at", "to", "as"], [FS, FS, FS]),
    cz("of", 1, 2, 2, "The box is full ___ toys.", ["of", "at", "he", "is"], [FS, DV, DV]),
    rf("of", 1, 2, 3, ["of", "off", "for", "on"], [VN, VN, VN]),
    cz("on", 1, 2, 1, "It is dark. Please turn ___ the lamp.", ["on", "of", "is", "he"], [DV, DV, DV]),
    cz("on", 1, 2, 2, "The stove is cold. Turn ___ the heat.", ["on", "of", "are", "it"], [DV, DV, DV]),
    rf("on", 1, 2, 3, ["on", "in", "an", "no"], [VN, VN, VN]),
    cz("that", 1, 2, 1, "___ ship is far away across the bay.", ["that", "it", "he", "they"], [DV, DV, DV]),
    cz("that", 1, 2, 2, "___ cup is over there, far from me.", ["that", "it", "they", "you"], [DV, DV, DV]),
    rf("that", 1, 2, 3, ["that", "than", "hat", "this"], [VN, VN, VN]),
    cz("the", 1, 2, 1, "Earth has one moon. ___ moon circles Earth.", ["the", "of", "it", "they"], [DV, DV, DV]),
    cz("the", 1, 2, 2, "Our class has one teacher. ___ teacher is here.", ["the", "of", "he", "they"], [DV, DV, DV]),
    rf("the", 1, 2, 3, ["the", "they", "then", "she"], [VN, VN, VN]),
    cz("they", 1, 2, 1, "The pigs love mud; ___ can roll in it.", ["they", "he", "it", "this"], [FS, FS, FS]),
    cz("they", 1, 2, 2, "My socks got wet; ___ may need to dry.", ["they", "he", "it", "are"], [FS, FS, DV]),
    rf("they", 1, 2, 3, ["they", "them", "then", "the"], [VN, VN, VN]),
    cz("this", 1, 2, 1, "I hold a cup. ___ cup is near me.", ["this", "he", "they", "you"], [DV, DV, DV]),
    cz("this", 1, 2, 2, "I hold a hat. ___ hat is in hand.", ["this", "it", "you", "I"], [DV, DV, DV]),
    rf("this", 1, 2, 3, ["this", "that", "his", "is"], [VN, VN, VN]),
    cz("to", 1, 2, 1, "The shed is ahead; we walk ___ it.", ["to", "from", "with", "on"], [FS, FS, FS]),
    cz("to", 1, 2, 2, "Ben receives the pen; I hand it ___ him.", ["to", "from", "at", "in"], [FS, FS, FS]),
    rf("to", 1, 2, 3, ["to", "too", "top", "ten"], [VN, VN, VN]),
    cz("was", 1, 2, 1, "Today it thawed; yesterday the pond ___ frozen.", ["was", "is", "are", "his"], [FS, DV, DV]),
    cz("was", 1, 2, 2, "The thermometer showed the milk ___ cold then.", ["was", "is", "be", "that"], [FS, DV, DV]),
    rf("was", 1, 2, 3, ["was", "saw", "has", "wag"], [VN, VN, VN]),
    cz("with", 1, 2, 1, "Mia mixed red paint ___ blue paint.", ["with", "at", "of", "to"], [FS, DV, DV]),
    cz("with", 1, 2, 2, "Ben filled the cup ___ milk.", ["with", "from", "on", "at"], [FS, FS, FS]),
    rf("with", 1, 2, 3, ["with", "wish", "wit", "win"], [VN, VN, VN]),
    cz("you", 1, 2, 1, "Ben, I choose ___ to start now.", ["you", "he", "they", "his"], [DV, DV, DV]),
    cz("you", 1, 2, 2, "Mia, I choose ___ to read first.", ["you", "they", "his", "is"], [DV, DV, DV]),
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
    cz("a", 1, 1, 7, "Mia needs ___ pen.", ["a", "as", "be", "they"], [DV, DV, DV]),
    cz("for", 1, 1, 7, "This brush is ___ painting the wall.", ["for", "of", "at", "as"], [DV, DV, DV]),
    cz("was", 1, 2, 7, "The thermometer proved yesterday's pond ___ cold.", ["was", "are", "be", "have"], [DV, DV, DV]),
    cz("they", 1, 2, 7, "The ducks left together; ___ may return after lunch.", ["they", "he", "I", "this"], [FS, FS, FS]),
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
