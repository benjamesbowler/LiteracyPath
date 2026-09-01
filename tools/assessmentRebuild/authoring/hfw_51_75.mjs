// HFW Band 3 (words 51–75) — v3 authored bank (wave W8, paired with hfw_76_100).
// Same architecture as bands 1–2 (see hfw_1_25.mjs header). Band-3 particulars:
//   - would/write carry silent letters — both get double retention coverage
//     (the doc's known-fragile rule) and their letter banks include the
//     tempting phonetic builds (wud's u alone, rite's missing w).
//   - two/to homophone pair spans bands — D-HOMOPHONE live on two.
//   - then/them/these are mutual visual neighbours.
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
  skillId: "hfw_51_75",
  skillName: "High-Frequency Words 51–75",
  items: [
    // ===== L1 phase 1: about go has her him into like look make many more other out =====
    cz("about", 1, 1, 1, "We talked ___ the six legs on an ant.", ["about", "for", "from", "by"], [FS, FS, FS],
      "body parts are the topic, not speakers or listeners"),
    cz("about", 1, 1, 2, "The book explains moon craters; it is ___ them.", ["about", "by", "with", "to"], [FS, FS, FS],
      "the explained craters pin the book-content relation"),
    rf("about", 1, 1, 3, ["about", "above", "out", "shout"], [VN, VN, VN]),
    cz("go", 1, 1, 1, "Green light means we can ___ now.", ["go", "look", "see", "write"], [FS, FS, FS],
      "the traffic signal pins the movement action"),
    cz("go", 1, 1, 2, "At the start signal, runners ___.", ["go", "look", "see", "do"], [FS, FS, FS],
      "the race-start signal pins go"),
    rf("go", 1, 1, 3, ["go", "got", "do", "gone"], [VN, VN, VN]),
    cz("has", 1, 1, 1, "Mia ___ one pet; she did not say so.", ["has", "is", "was", "said"], [FS, FS, FS],
      "present possession and the reporting contrast pin has"),
    cz("has", 1, 1, 2, "Mia ___ one pet now; she owns it.", ["has", "is", "was", "had"], [FS, FS, FS],
      "now and the ownership statement pin has"),
    rf("has", 1, 1, 3, ["has", "had", "his", "hats"], [VN, VN, VN]),
    cz("her", 1, 1, 1, "The girl owns this scarf. It is ___ scarf.", ["her", "his", "your", "their"], [FS, FS, FS],
      "the ownership statement pins the matching possessive"),
    cz("her", 1, 1, 2, "Grandma owns this chair; it is ___ chair.", ["her", "his", "your", "she"], [FS, FS, DV],
      "the named female owner pins her without a scene"),
    rf("her", 1, 1, 3, ["her", "here", "he", "hers"], [VN, VN, VN]),
    cz("him", 1, 1, 1, "Dad was alone; I waved only at ___.", ["him", "her", "them", "it"], [FS, FS, FS],
      "alone and only pin the singular male referent"),
    cz("him", 1, 1, 2, "You watched a boy fall; I helped ___ up.", ["him", "her", "them", "you"], [FS, FS, FS],
      "the singular male referent pins him"),
    rf("him", 1, 1, 3, ["him", "his", "hum", "hit"], [VN, VN, VN]),
    cz("into", 1, 1, 1, "Pour milk ___ the jug until it fills.", ["into", "on", "at", "by"], [FS, FS, FS],
      "the jug filling pins movement into it"),
    cz("into", 1, 1, 2, "Frog jumped ___ the pond and vanished underwater.", ["into", "on", "from", "by"], [FS, FS, FS],
      "ending underwater pins movement into the pond"),
    rf("into", 1, 1, 3, ["into", "onto", "in", "it"], [VN, VN, VN]),
    cz("like", 1, 1, 1, "These two red cups look ___ each other.", ["like", "at", "for", "with"], [FS, FS, FS],
      "inanimate matching cups pin resemblance"),
    cz("like", 1, 1, 2, "The matching socks look ___ each other.", ["like", "at", "for", "into"], [FS, FS, FS],
      "matching inanimate socks pin resemblance rather than another look relation"),
    rf("like", 1, 1, 3, ["like", "look", "lake", "bike"], [VN, VN, VN]),
    cz("look", 1, 1, 1, "Using our eyes, we ___ at the shells.", ["look", "go", "write", "are"], [FS, FS, FS],
      "the named sense organ pins the visual action"),
    cz("look", 1, 1, 2, "To check the map, we will ___ at it.", ["look", "write", "see", "use"], [FS, DV, DV],
      "checking a map pins look; the approved inventory forces two form traps"),
    rf("look", 1, 1, 3, ["look", "like", "book", "took"], [VN, VN, VN]),
    cz("make", 1, 1, 1, "We ___ a pie by mixing flour and water.", ["make", "use", "see", "write"], [FS, FS, FS],
      "mixing the ingredients pins make"),
    cz("make", 1, 1, 2, "Bees ___ wax from food inside their bodies.", ["make", "write", "do", "see"], [FS, FS, FS],
      "the biological production fact pins make"),
    rf("make", 1, 1, 3, ["make", "made", "cake", "mane"], [VN, VN, VN]),
    cz("many", 1, 1, 1, "___ hands waved: one hundred waved, one stayed still.", ["many", "one", "two", "all"], [FS, FS, FS],
      "the exact counts pin many and rule out all"),
    cz("many", 1, 1, 2, "___ eggs broke: sixty broke, two stayed whole.", ["many", "one", "two", "each"], [FS, FS, DV],
      "the exact counts pin many; each is the unavoidable agreement trap in the approved inventory"),
    rf("many", 1, 1, 3, ["many", "any", "more", "mane"], [VN, VN, VN]),
    cz("more", 1, 1, 1, "Yesterday: two. Today: five of six. I have ___.", ["more", "one", "each", "all"], [FS, FS, FS],
      "the before-and-now counts establish an increase without reaching all"),
    cz("more", 1, 1, 2, "Yesterday: five. Today: ten of twelve. I have ___.", ["more", "one", "two", "all"], [FS, FS, FS],
      "the before-and-now counts establish an increase without reaching all"),
    rf("more", 1, 1, 3, ["more", "most", "make", "core"], [VN, VN, VN]),
    cz("other", 1, 1, 1, "Two teams played; one wore red, the ___ blue.", ["other", "one", "two", "all"], [FS, FS, DV],
      "the two-group contrast pins other; all is the approved-inventory form trap"),
    cz("other", 1, 1, 2, "Two doors stand here: one shut, the ___ open.", ["other", "one", "two", "each"], [FS, FS, DV],
      "the two-object contrast pins other; each is the approved-inventory form trap"),
    rf("other", 1, 1, 3, ["other", "over", "otter", "order"], [VN, VN, VN]),
    cz("out", 1, 1, 1, "The tide went ___, leaving dry sand behind.", ["out", "in", "up", "on"], [FS, FS, FS],
      "the exposed sand pins the outgoing tide"),
    cz("out", 1, 1, 2, "The lamp went ___, making the room dark.", ["out", "on", "up", "to"], [FS, FS, DV],
      "the dark-room result pins out; to is the approved-inventory form trap"),
    rf("out", 1, 1, 3, ["out", "our", "cut", "shout"], [VN, VN, VN]),

    // ===== L1 phase 2: see so some them then these time two up will would write =====
    cz("see", 1, 2, 1, "Owls use their eyes to ___ mice at night.", ["see", "like", "have", "make"], [FS, FS, FS],
      "the named sense organ pins the matching action"),
    cz("see", 1, 2, 2, "Use your eyes to ___ my fort.", ["see", "use", "have", "make"], [FS, FS, FS],
      "the named sense organ pins the matching action"),
    rf("see", 1, 2, 3, ["see", "sea", "she", "seed"], [HM, VN, VN]),
    cz("so", 1, 2, 1, "‘Did Ana win?’ ‘Yes, I believe ___.’", ["so", "not", "then", "there"], [FS, FS, FS],
      "the stated yes answer pins so"),
    cz("so", 1, 2, 2, "‘Is rain wet?’ Yes, I think ___.", ["so", "not", "out", "up"], [FS, DV, DV],
      "the stated yes answer and familiar fact pin so"),
    rf("so", 1, 2, 3, ["so", "no", "son", "saw"], [VN, VN, VN]),
    cz("some", 1, 2, 1, "___ birds sang: five sang, five stayed silent.", ["some", "all", "one", "two"], [FS, FS, FS],
      "the exact split establishes a nonzero subset"),
    cz("some", 1, 2, 2, "___ slices remained: four remained, four were eaten.", ["some", "all", "one", "each"], [FS, FS, DV],
      "the exact split pins some; each is the unavoidable agreement trap in the approved inventory"),
    rf("some", 1, 2, 3, ["some", "come", "same", "sum"], [VN, VN, HM]),
    cz("them", 1, 2, 1, "The cups were dirty, so I washed ___.", ["them", "him", "it", "you"], [FS, FS, FS],
      "the plural object pronoun must refer back to the cups"),
    cz("them", 1, 2, 2, "The twins came alone, so I greeted ___.", ["them", "her", "it", "you"], [FS, FS, FS],
      "alone and the plural referent pin them"),
    rf("them", 1, 2, 3, ["them", "then", "they", "the"], [VN, VN, VN]),
    cz("then", 1, 2, 1, "‘When did you play?’ ‘We played ___.’", ["then", "there", "out", "up"], [FS, FS, FS],
      "the question asks for time, so then is the responsive completion"),
    cz("then", 1, 2, 2, "‘When did cups dry?’ ‘They dried ___.’", ["then", "there", "up", "more"], [FS, FS, FS],
      "the question asks for time, so then is the responsive completion"),
    rf("then", 1, 2, 3, ["then", "than", "them", "hen"], [VN, VN, VN]),
    cz("these", 1, 2, 1, "___ cups are beside me, close enough to touch.", ["these", "this", "that", "a"], [DV, DV, DV],
      "nearness pins these; other approved demonstratives do not agree with cups"),
    cz("these", 1, 2, 2, "___ books are here, close enough to touch.", ["these", "this", "that", "an"], [DV, DV, DV],
      "nearness pins these; other approved demonstratives do not agree with books"),
    rf("these", 1, 2, 3, ["these", "those", "them", "cheese"], [VN, VN, VN]),
    cz("time", 1, 2, 1, "The clock shows the ___: three o'clock.", ["time", "look", "use", "go"], [FS, FS, FS],
      "the stated clock reading pins time"),
    cz("time", 1, 2, 2, "Eight o'clock is the ___ for bed.", ["time", "use", "go", "other"], [FS, FS, FS],
      "the familiar bedtime schedule pins time"),
    rf("time", 1, 2, 3, ["time", "tame", "team", "lime"], [VN, VN, VN]),
    cz("two", 1, 2, 1, "One plus one equals ___.", ["two", "one", "all", "each"], [FS, FS, FS],
      "the stated arithmetic fact pins the number two"),
    cz("two", 1, 2, 2, "One sock beside another makes ___ socks.", ["two", "all", "many", "other"], [FS, FS, FS],
      "one sock plus another pins two"),
    rf("two", 1, 2, 3, ["two", "to", "too", "tow"], [HM, HM, VN]),
    cz("up", 1, 2, 1, "We moved ___, ending at the hilltop.", ["up", "out", "in", "by"], [FS, FS, FS],
      "ending at the hilltop pins up"),
    cz("up", 1, 2, 2, "Roll the sleeping bag ___ for packing.", ["up", "out", "on", "by"], [FS, FS, FS],
      "the packing purpose pins the roll-up action"),
    rf("up", 1, 2, 3, ["up", "us", "cup", "pup"], [VN, VN, VN]),
    cz("will", 1, 2, 1, "The forecast is certain: it ___ rain tomorrow.", ["will", "would", "was", "are"], [FS, DV, DV],
      "present certainty pins will; the approved inventory forces two form traps"),
    cz("will", 1, 2, 2, "She promised, ‘Tomorrow I ___ help Mia.’", ["will", "is", "was", "had"], [DV, DV, DV],
      "the direct promise pins will; other approved forms cannot fill the modal slot"),
    rf("will", 1, 2, 3, ["will", "well", "wall", "with"], [VN, VN, VN]),
    cz("would", 1, 2, 1, "___ you like tea? It is a polite offer.", ["would", "were", "are", "had"], [FS, FS, DV],
      "the polite-offer context pins would; had is the approved-inventory form trap"),
    cz("would", 1, 2, 2, "‘We will come.’ I reported they ___ come.", ["would", "is", "was", "has"], [DV, DV, DV],
      "the exact report pins would; other approved forms do not agree with they"),
    rf("would", 1, 2, 3, ["would", "could", "wood", "world"], [VN, HM, VN]),
    cz("write", 1, 2, 1, "Your pen moves because you ___ your name.", ["write", "like", "see", "have"], [FS, FS, FS],
      "writing the name explains why the pen moves"),
    cz("write", 1, 2, 2, "My pen moves as I ___ letters to Mia.", ["write", "use", "have", "see"], [FS, FS, FS],
      "the moving pen and letter context pin write"),
    rf("write", 1, 2, 3, ["write", "right", "white", "wrote"], [HM, VN, VN]),

    // ===== L2 phase 1 (spell): about … out =====
    sp("about", 2, 1, 1, "This song is ___ the sea.", ["a", "b", "o", "u", "t", "w"],
      "abowt — the w is present and tempting"),
    lb("about", 2, 1, 2, "Ask me ___ my hobby.", ["a", "b", "o", "u", "t", "w"]),
    sp("go", 2, 1, 1, "Time to ___ home now.", ["g", "o", "w", "e"],
      "gow — the w is present and tempting"),
    lb("go", 2, 1, 2, "Ready, steady, ___!", ["g", "o", "e", "w"]),
    sp("has", 2, 1, 1, "The hive ___ ten bees.", ["h", "a", "s", "z", "e"]),
    lb("has", 2, 1, 2, "Who ___ my pencil?", ["h", "a", "s", "e", "z"]),
    sp("her", 2, 1, 1, "Val fed ___ rabbit.", ["h", "e", "r", "u", "i"],
      "hur and hir — the sibling spellings are present"),
    lb("her", 2, 1, 2, "Is this ___ scarf or yours?", ["h", "e", "r", "i", "u"]),
    sp("him", 2, 1, 1, "Pass the map to ___.", ["h", "i", "m", "e", "y"]),
    lb("him", 2, 1, 2, "We picked ___ for our team.", ["h", "i", "m", "y", "e"]),
    sp("into", 2, 1, 1, "Hop ___ the boat, quick!", ["i", "n", "t", "o", "u"]),
    lb("into", 2, 1, 2, "The seeds went ___ the soil.", ["i", "n", "t", "o", "u"]),
    sp("like", 2, 1, 1, "Ducks ___ wet weather.", ["l", "i", "k", "e", "c"],
      "lick's c is present; the silent e is the work"),
    lb("like", 2, 1, 2, "I ___ my toast crunchy.", ["l", "i", "k", "e", "c"]),
    sp("look", 2, 1, 1, "___ both ways first.", ["l", "o", "o", "k", "u"],
      "luk — the double o is the work"),
    lb("look", 2, 1, 2, "Come ___ at the tadpoles!", ["l", "o", "o", "k", "u"]),
    sp("make", 2, 1, 1, "Let's ___ lemonade.", ["m", "a", "k", "e", "c"],
      "mak without the silent e is the tempting build"),
    lb("make", 2, 1, 2, "Spiders ___ silk webs.", ["m", "a", "k", "e", "c"]),
    sp("many", 2, 1, 1, "___ moths came to the lamp.", ["m", "a", "n", "y", "e"],
      "meny — the e is present and tempting"),
    lb("many", 2, 1, 2, "How ___ steps to the top?", ["m", "a", "n", "y", "e"]),
    sp("more", 2, 1, 1, "One ___ lap, then rest.", ["m", "o", "r", "e", "a"],
      "mor without the e is the tempting build"),
    lb("more", 2, 1, 2, "The plant needs ___ sun.", ["m", "o", "r", "e", "a"]),
    sp("other", 2, 1, 1, "Hold it with your ___ hand.", ["o", "t", "h", "e", "r", "u"],
      "uther — the u is present and tempting"),
    lb("other", 2, 1, 2, "The ___ team wore red.", ["o", "t", "h", "e", "r", "u"]),
    sp("out", 2, 1, 1, "School lets ___ at three.", ["o", "u", "t", "w"],
      "owt — the w is present and tempting"),
    lb("out", 2, 1, 2, "The tide went ___ fast.", ["o", "u", "t", "w"]),

    // ===== L2 phase 2 (spell): see … write =====
    sp("see", 2, 2, 1, "Can you ___ the lighthouse?", ["s", "e", "e", "a", "c"],
      "sea's a and c are present — the double e is the work"),
    lb("see", 2, 2, 2, "I ___ three sails!", ["s", "e", "e", "c", "a"]),
    sp("so", 2, 2, 1, "The bag was ___ heavy!", ["s", "o", "w", "e"],
      "sow — the w is present and tempting"),
    lb("so", 2, 2, 2, "I trained hard, ___ I won.", ["s", "o", "e", "w"]),
    sp("some", 2, 2, 1, "Take ___ grapes for the trip.", ["s", "o", "m", "e", "u"],
      "sum — the u is present; the silent e is the work"),
    lb("some", 2, 2, 2, "___ crabs hide under rocks.", ["s", "o", "m", "e", "u"]),
    sp("them", 2, 2, 1, "The chicks? Feed ___ at five.", ["t", "h", "e", "m", "n"],
      "then's n is present — the final m is the work"),
    lb("them", 2, 2, 2, "Stack the chairs and count ___.", ["t", "h", "e", "m", "n"]),
    sp("then", 2, 2, 1, "Wash up, ___ dry your hands.", ["t", "h", "e", "n", "m"],
      "them's m is present — the final n is the work"),
    lb("then", 2, 2, 2, "First stretch, ___ sprint.", ["t", "h", "e", "n", "m"]),
    sp("these", 2, 2, 1, "___ shells here are tiny.", ["t", "h", "e", "s", "e", "z"],
      "theez — the z is present and tempting"),
    lb("these", 2, 2, 2, "Are ___ seats taken?", ["t", "h", "e", "s", "e", "z"]),
    sp("time", 2, 2, 1, "It is snack ___!", ["t", "i", "m", "e", "y"],
      "tym — the y is present; the silent e is the work"),
    lb("time", 2, 2, 2, "What ___ is kickoff?", ["t", "i", "m", "e", "y"]),
    sp("two", 2, 2, 1, "A bike has ___ wheels.", ["t", "w", "o", "u", "e"],
      "the silent w is the work — tu and too tempt"),
    lb("two", 2, 2, 2, "___ crows sat on the fence.", ["t", "w", "o", "e", "u"]),
    sp("up", 2, 2, 1, "The balloon drifted ___.", ["u", "p", "o", "b"]),
    lb("up", 2, 2, 2, "Climb ___ the ladder slowly.", ["u", "p", "b", "o"]),
    sp("will", 2, 2, 1, "Gran ___ knit you a hat.", ["w", "i", "l", "l", "e"],
      "wil — the double l is the work"),
    lb("will", 2, 2, 2, "The bread ___ rise by noon.", ["w", "i", "l", "l", "e"]),
    sp("would", 2, 2, 1, "___ you feed my fish?", ["w", "o", "u", "l", "d", "e"],
      "wud — the silent oul cluster is the work"),
    lb("would", 2, 2, 2, "She said she ___ come.", ["w", "o", "u", "l", "d", "e"]),
    sp("write", 2, 2, 1, "___ a list before we shop.", ["w", "r", "i", "t", "e", "y"],
      "rite — building without the silent w is the tempting path"),
    lb("write", 2, 2, 2, "I ___ with my left hand.", ["w", "r", "i", "t", "e", "y"]),

    // ===== Retention reserve (form R) — would/write get the double coverage =====
    cz("would", 1, 2, 7, "‘We will help.’ I reported they ___ help.", ["would", "use", "have", "had"], [FS, FS, FS],
      "the exact direct statement pins its reported-future form"),
    cz("write", 1, 2, 7, "Students ___ answers with pencils during the test.", ["write", "make", "use", "have"], [FS, FS, FS],
      "the pencils and test-answer context pin write"),
    sp("would", 2, 2, 7, "Ben ___ trade his apple.", ["w", "o", "u", "l", "d", "e"]),
    lb("write", 2, 2, 7, "___ neatly on the line.", ["w", "r", "i", "t", "e", "y"]),
    cz("two", 1, 2, 8, "There are exactly ___ socks in this pair.", ["two", "one", "many", "some"], [FS, FS, FS],
      "a pair has exactly two socks"),
    cz("many", 1, 1, 7, "___ stars shone: two hundred shone, one stayed dark.", ["many", "one", "all", "each"], [FS, FS, DV],
      "the exact counts pin many; each is the approved-inventory form trap"),
    rf("these", 1, 2, 7, ["these", "those", "then", "them"], [VN, VN, VN], "", "point"),
    rf("about", 1, 1, 7, ["about", "out", "above", "boat"], [VN, VN, VN], "", "point"),
    sp("look", 2, 1, 7, "___ before you leap!", ["l", "o", "o", "k", "u"]),
    lb("time", 2, 2, 7, "Bath ___ for the pup!", ["t", "i", "m", "e", "y"])
  ].map(item => {
    if (item.v >= 7) item.retention = true;
    return item;
  })
};
