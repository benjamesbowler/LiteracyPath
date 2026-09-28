// Original teacher-administered content. These additions increase sampling,
// not the confidence or placement thresholds attached to a small item set.
// Each row keeps the same construct across forms; difficulty is not equated.
const oral = (strand, task, teacherSay, expectedAnswers) => ({ strand, task, teacherSay, expectedAnswers });
const spell = (targetWord, sentence, featureTags, plausibleSpellings = []) => ({ targetWord, sentence, featureTags, plausibleSpellings });

export const EL_PA_DEPTH_ITEMS = {
  "K-BOY": {
    a: [oral("syllable", "segmentation", "Say puppy in parts.", ["pup py", "pup-py"]), oral("phoneme_isolation", "initial", "What is the first sound in sock?", ["s", "/s/"])],
    b: [oral("syllable", "segmentation", "Say apple in parts.", ["ap ple", "ap-ple"]), oral("phoneme_isolation", "initial", "What is the first sound in nose?", ["n", "/n/"])],
    c: [oral("syllable", "segmentation", "Say window in parts.", ["win dow", "win-dow"]), oral("phoneme_isolation", "initial", "What is the first sound in hat?", ["h", "/h/"])]
  },
  "K-MOY": {
    a: [oral("phoneme_isolation", "medial", "What is the middle sound in cat?", ["short a", "/a/", "/æ/"]), oral("onset_rime", "blending", "What word is /b/ ... /ed/?", ["bed"])],
    b: [oral("phoneme_isolation", "medial", "What is the middle sound in pig?", ["short i", "/i/", "/ɪ/"]), oral("onset_rime", "blending", "What word is /r/ ... /ug/?", ["rug"])],
    c: [oral("phoneme_isolation", "medial", "What is the middle sound in hen?", ["short e", "/e/", "/ɛ/"]), oral("onset_rime", "blending", "What word is /t/ ... /op/?", ["top"])]
  },
  "K-EOY": {
    a: [oral("phoneme_deletion", "final", "Say lamp without /p/.", ["lamb", "lam"]), oral("phoneme_substitution", "final", "Change the /g/ in dog to /t/. What word now?", ["dot"])],
    b: [oral("phoneme_deletion", "final", "Say bend without /d/.", ["Ben", "ben"]), oral("phoneme_substitution", "final", "Change the /g/ in pig to /n/. What word now?", ["pin"])],
    c: [oral("phoneme_deletion", "final", "Say cold without /d/.", ["coal", "cole"]), oral("phoneme_substitution", "final", "Change the /p/ in cup to /t/. What word now?", ["cut"])]
  },
  "1-BOY": {
    a: [oral("phoneme_blending", "four_phoneme", "Blend /f/ /r/ /o/ /g/.", ["frog"]), oral("phoneme_substitution", "vowel", "Change the vowel in bed to /a/. What word now?", ["bad"])],
    b: [oral("phoneme_blending", "four_phoneme", "Blend /s/ /n/ /a/ /p/.", ["snap"]), oral("phoneme_substitution", "vowel", "Change the vowel in bag to /i/. What word now?", ["big"])],
    c: [oral("phoneme_blending", "four_phoneme", "Blend /g/ /r/ /i/ /n/.", ["grin"]), oral("phoneme_substitution", "vowel", "Change the vowel in hot to /a/. What word now?", ["hat"])]
  },
  "1-MOY": {
    a: [oral("phoneme_deletion", "final", "Say tent without /t/ at the end.", ["ten"]), oral("phoneme_substitution", "vowel", "Change the vowel in ship to /o/. What word now?", ["shop"])],
    b: [oral("phoneme_deletion", "final", "Say went without /t/.", ["when", "wen"]), oral("phoneme_substitution", "vowel", "Change the vowel in shop to /i/. What word now?", ["ship"])],
    c: [oral("phoneme_deletion", "final", "Say best without /t/.", ["Bess", "bess"]), oral("phoneme_substitution", "vowel", "Change the vowel in chop to /i/. What word now?", ["chip"])]
  },
  "1-EOY": {
    a: [oral("phoneme_segmentation", "four_phoneme", "Tell me every sound in lunch.", ["l u n ch", "/l/ /u/ /n/ /ch/"]), oral("phoneme_deletion", "final", "Say paint without /t/.", ["pain"])],
    b: [oral("phoneme_segmentation", "four_phoneme", "Tell me every sound in shelf.", ["sh e l f", "/sh/ /e/ /l/ /f/"]), oral("phoneme_deletion", "final", "Say bend without /d/.", ["Ben", "ben"])],
    c: [oral("phoneme_segmentation", "four_phoneme", "Tell me every sound in chest.", ["ch e s t", "/ch/ /e/ /s/ /t/"]), oral("phoneme_deletion", "final", "Say cold without /d/.", ["coal", "cole"])]
  },
  "2-BOY": {
    a: [oral("phoneme_deletion", "final", "Say wild without /d/.", ["while"]), oral("phoneme_substitution", "vowel", "Change the vowel in stamp to /u/. What word now?", ["stump"])],
    b: [oral("phoneme_deletion", "final", "Say mild without /d/.", ["mile"]), oral("phoneme_substitution", "vowel", "Change the vowel in track to /i/. What word now?", ["trick"])],
    c: [oral("phoneme_deletion", "final", "Say told without /d/.", ["toll"]), oral("phoneme_substitution", "vowel", "Change the vowel in stack to /u/. What word now?", ["stuck"])]
  },
  "2-MOY": {
    a: [oral("phoneme_segmentation", "five_phoneme", "Tell me every sound in twist.", ["t w i s t", "/t/ /w/ /i/ /s/ /t/"]), oral("phoneme_substitution", "vowel", "Change the vowel in slip to /o/. What word now?", ["slop"])],
    b: [oral("phoneme_segmentation", "five_phoneme", "Tell me every sound in slept.", ["s l e p t", "/s/ /l/ /e/ /p/ /t/"]), oral("phoneme_substitution", "vowel", "Change the vowel in spin to /u/. What word now?", ["spun"])],
    c: [oral("phoneme_segmentation", "five_phoneme", "Tell me every sound in frost.", ["f r o s t", "/f/ /r/ /o/ /s/ /t/"]), oral("phoneme_substitution", "vowel", "Change the vowel in drip to /o/. What word now?", ["drop"])]
  },
  "2-EOY": {
    a: [oral("phoneme_deletion", "medial", "Say splat without /l/.", ["spat"]), oral("phoneme_substitution", "final", "Change the /p/ in clamp to /z/. What word now?", ["clams"])],
    b: [oral("phoneme_deletion", "medial", "Say brand without /r/.", ["band"]), oral("phoneme_substitution", "final", "Change the /t/ in spent to /d/. What word now?", ["spend"])],
    c: [oral("phoneme_deletion", "medial", "Say glide without /l/.", ["guide"]), oral("phoneme_substitution", "final", "Change the last /t/ in tent to /z/. What word now?", ["tens"])]
  }
};

export const EL_ENCODING_DEPTH_ITEMS = {
  "K-BOY": {
    a: [spell("bat", "The bat flew out.", ["cvc", "short_a"]), spell("pet", "A dog can be a pet.", ["cvc", "short_e"]), spell("dig", "We can dig a hole.", ["cvc", "short_i"]), spell("mop", "Use the mop on the floor.", ["cvc", "short_o"])],
    b: [spell("tag", "The tag has my name.", ["cvc", "short_a"]), spell("bed", "The bed is soft.", ["cvc", "short_e"]), spell("pin", "The pin held the cloth.", ["cvc", "short_i"]), spell("dog", "The dog ran home.", ["cvc", "short_o"])],
    c: [spell("hat", "Put on your hat.", ["cvc", "short_a"]), spell("pen", "I wrote with a pen.", ["cvc", "short_e"]), spell("sit", "Please sit here.", ["cvc", "short_i"]), spell("cot", "The baby slept in a cot.", ["cvc", "short_o"])]
  },
  "K-MOY": {
    a: [spell("fin", "The fish has a fin.", ["cvc", "short_i"]), spell("log", "The log was on the ground.", ["cvc", "short_o"]), spell("hat", "My hat is blue.", ["cvc", "short_a"]), spell("nut", "The squirrel held a nut.", ["cvc", "short_u"])],
    b: [spell("sit", "Sit next to me.", ["cvc", "short_i"]), spell("cop", "The cop helped us cross.", ["cvc", "short_o"]), spell("map", "The map shows the park.", ["cvc", "short_a"]), spell("sun", "The sun is bright.", ["cvc", "short_u"])],
    c: [spell("lip", "There was a crumb on my lip.", ["cvc", "short_i"]), spell("hop", "The rabbit can hop.", ["cvc", "short_o"]), spell("rag", "Use the rag to clean up.", ["cvc", "short_a"]), spell("tug", "Give the rope a tug.", ["cvc", "short_u"])]
  },
  "K-EOY": {
    a: [spell("rock", "The rock felt smooth.", ["final_ck", "short_o"]), spell("mess", "We cleaned the mess.", ["final_double", "short_e"]), spell("wing", "The bird lifted one wing.", ["final_digraph", "short_i"]), spell("brush", "Use a brush to paint.", ["initial_blend", "digraph", "short_u"])],
    b: [spell("pack", "Pack the bag for school.", ["final_ck", "short_a"]), spell("puff", "A puff of air moved the paper.", ["final_double", "short_u"]), spell("bang", "The door shut with a bang.", ["final_digraph", "short_a"]), spell("fresh", "The bread is fresh.", ["initial_blend", "digraph", "short_e"])],
    c: [spell("neck", "The scarf covered my neck.", ["final_ck", "short_e"]), spell("buzz", "I heard a bee buzz.", ["final_double", "short_u"]), spell("song", "We sang a song.", ["final_digraph", "short_o"]), spell("crash", "We heard a loud crash.", ["initial_blend", "digraph", "short_a"])]
  },
  "1-BOY": {
    a: [spell("bunch", "Here is a bunch of grapes.", ["digraph", "final_blend"]), spell("stamp", "Put a stamp on the letter.", ["initial_blend", "final_blend"]), spell("trip", "Our trip was fun.", ["initial_blend", "short_i"]), spell("song", "That song has a nice tune.", ["final_digraph", "short_o"])],
    b: [spell("bench", "We sat on the bench.", ["digraph", "final_blend"]), spell("stump", "The stump was beside the path.", ["initial_blend", "final_blend"]), spell("grin", "She gave a big grin.", ["initial_blend", "short_i"]), spell("long", "The rope is long.", ["final_digraph", "short_o"])],
    c: [spell("pinch", "Add a pinch of salt.", ["digraph", "final_blend"]), spell("crisp", "The apple is crisp.", ["initial_blend", "final_blend"]), spell("snip", "Snip the paper with scissors.", ["initial_blend", "short_i"]), spell("hung", "We hung the coats on hooks.", ["final_digraph", "short_u"])]
  },
  "1-MOY": {
    a: [spell("line", "Stand in a line.", ["silent_e", "long_i"]), spell("cheek", "A tear ran down her cheek.", ["vowel_team", "long_e"]), spell("toast", "I had toast for breakfast.", ["vowel_team", "long_o"]), spell("stay", "Please stay beside me.", ["vowel_team", "long_a"])],
    b: [spell("shine", "The sun will shine today.", ["silent_e", "long_i"]), spell("sheep", "The sheep ate grass.", ["vowel_team", "long_e"]), spell("float", "The leaf can float.", ["vowel_team", "long_o"]), spell("clay", "We shaped the clay.", ["vowel_team", "long_a"])],
    c: [spell("spine", "The book has a red spine.", ["silent_e", "long_i"]), spell("sleep", "The baby needs sleep.", ["vowel_team", "long_e"]), spell("cloak", "The costume has a cloak.", ["vowel_team", "long_o"]), spell("spray", "Water came out in a spray.", ["vowel_team", "long_a"])]
  },
  "1-EOY": {
    a: [spell("shark", "The shark swam by.", ["r_controlled", "ar"]), spell("spoil", "Rain could spoil our picnic.", ["diphthong", "oi"]), spell("shout", "Please do not shout indoors.", ["diphthong", "ou"]), spell("tooth", "I lost a tooth.", ["vowel_team", "oo"])],
    b: [spell("scarf", "The scarf kept me warm.", ["r_controlled", "ar"]), spell("foil", "Wrap the food in foil.", ["diphthong", "oi"]), spell("sound", "I heard a strange sound.", ["diphthong", "ou"]), spell("roof", "Rain fell on the roof.", ["vowel_team", "oo"])],
    c: [spell("charm", "The bracelet has a charm.", ["r_controlled", "ar"]), spell("join", "Please join our game.", ["diphthong", "oi"]), spell("round", "The table is round.", ["diphthong", "ou"]), spell("spoon", "Use a spoon for soup.", ["vowel_team", "oo"])]
  },
  "2-BOY": {
    a: [spell("lunchbox", "Put your lunchbox on the shelf.", ["compound", "two_syllable"]), spell("flapping", "The bird is flapping its wings.", ["suffix", "inflection", "doubling"]), spell("waved", "She waved from the bus.", ["suffix", "inflection", "silent_e"]), spell("unzip", "Unzip your coat.", ["prefix", "closed_syllables"])],
    b: [spell("sandbox", "The toys are in the sandbox.", ["compound", "two_syllable"]), spell("clapping", "The audience is clapping.", ["suffix", "inflection", "doubling"]), spell("smiled", "The child smiled at me.", ["suffix", "inflection", "silent_e"]), spell("unplug", "Please unplug the lamp.", ["prefix", "closed_syllables"])],
    c: [spell("mailbox", "The letter is in the mailbox.", ["compound", "two_syllable"]), spell("stopping", "The bus is stopping here.", ["suffix", "inflection", "doubling"]), spell("hoped", "We hoped for a sunny day.", ["suffix", "inflection", "silent_e"]), spell("unclip", "Unclip the strap.", ["prefix", "closed_syllables"])]
  },
  "2-MOY": {
    a: [spell("rereading", "I am rereading my favorite page.", ["prefix", "suffix", "vowel_team"]), spell("brightly", "The lamp shone brightly.", ["suffix", "vowel_team"]), spell("hopeless", "The broken plan seemed hopeless.", ["suffix", "silent_e"]), spell("tidiness", "The teacher noticed the room's tidiness.", ["suffix", "y_change"])],
    b: [spell("repainting", "We are repainting the fence.", ["prefix", "suffix", "vowel_team"]), spell("lightly", "Tap the drum lightly.", ["suffix", "vowel_team"]), spell("nameless", "The nameless puppy needed a name.", ["suffix", "silent_e"]), spell("happiness", "Her face showed happiness.", ["suffix", "y_change"])],
    c: [spell("reheating", "Dad is reheating the soup.", ["prefix", "suffix", "vowel_team"]), spell("sweetly", "The bird sang sweetly.", ["suffix", "vowel_team"]), spell("shapeless", "The shapeless lump became a bowl.", ["suffix", "silent_e"]), spell("busyness", "The busyness of the market made it noisy.", ["suffix", "y_change"])]
  },
  "2-EOY": {
    a: [spell("unfriendly", "The loud noise sounded unfriendly.", ["prefix", "suffix", "multisyllable"]), spell("prediction", "My prediction was that it would rain.", ["suffix", "multisyllable"]), spell("reusable", "A reusable bottle can be used again.", ["prefix", "suffix", "multisyllable"]), spell("carefully", "Carry the tray carefully.", ["suffix", "multisyllable"])],
    b: [spell("unluckily", "Unluckily, the bus left just before we arrived.", ["prefix", "suffix", "multisyllable"]), spell("invention", "The new invention helped carry water.", ["suffix", "multisyllable"]), spell("washable", "The paint is washable.", ["suffix", "multisyllable"]), spell("peacefully", "The baby slept peacefully.", ["suffix", "multisyllable"])],
    c: [spell("unhappily", "The puppy waited unhappily by the gate.", ["prefix", "suffix", "multisyllable"]), spell("collection", "My collection has many shells.", ["suffix", "multisyllable"]), spell("readable", "Your large writing is readable.", ["suffix", "multisyllable"]), spell("thoughtfully", "She thoughtfully saved a seat for me.", ["suffix", "multisyllable"])]
  }
};

const FEATURE_GUIDANCE = {
  vc: "Listen for the vowel and final consonant; both need a written representation.",
  cvc: "Check the initial consonant, short vowel and final consonant separately.",
  short_a: "Listen for short a as in cat; do not substitute the long letter-name sound.",
  short_e: "Listen for short e as in bed, allowing the student's ordinary accent.",
  short_i: "Listen for short i as in sit, allowing the student's ordinary accent.",
  short_o: "Listen for the vowel in hot in the student's ordinary accent.",
  short_u: "Listen for the vowel in cup in the student's ordinary accent.",
  initial_blend: "Each consonant in the initial blend contributes a sound; note omissions.",
  final_blend: "Listen for every consonant at the end, including sounds within nk.",
  three_consonant_cluster: "Check all three consonants without adding a vowel between them.",
  digraph: "Two letters work together for a sound; count sounds separately from letters.",
  final_digraph: "Check the final spelling unit; ng is one consonant sound.",
  final_ck: "The final /k/ is conventionally written ck in this word.",
  final_double: "The final doubled letters represent one consonant sound, not two.",
  final_x: "Final x represents /k/ followed by /s/: two sounds, one letter.",
  initial_qu: "Qu usually represents /k/ followed by /w/: two sounds, two letters.",
  silent_e: "Notice the vowel-consonant-e spelling; the final e is not a separate spoken sound.",
  vowel_team: "Check the whole vowel spelling in this word, not just its first letter.",
  r_controlled: "Judge the vowel and r pattern in the student's accent; do not penalize non-rhotic speech.",
  diphthong: "Listen for the complete moving vowel sound and its spelling.",
  compound: "Both familiar base words contribute to the compound's spelling and meaning.",
  two_syllable: "Listen across both syllables; an unstressed vowel may sound reduced.",
  closed_syllables: "Check consonants and vowel spellings in each syllable, including reduced vowels.",
  multisyllable: "Notice all syllables and meaningful parts; do not score accent-related reduction as omission.",
  prefix: "Notice the prefix before the base and whether the remaining base is preserved.",
  suffix: "Notice the ending and the spelling of the base it joins.",
  inflection: "The ending may add a syllable or just a sound; read the actual form, not only the base.",
  doubling: "Check the doubled final consonant before the vowel suffix.",
  y_change: "Check the y-to-i change before this suffix.",
  one_to_one_cvc: "Each letter represents one phoneme in this transparent short-vowel word."
};

const FEATURE_LABELS = {
  vc: "Vowel and final consonant", cvc: "Short-vowel word", one_to_one_cvc: "One letter per sound",
  short_a: "Short a", short_e: "Short e", short_i: "Short i", short_o: "Short o", short_u: "Short u",
  initial_blend: "Beginning consonant group", final_blend: "Ending consonant group", three_consonant_cluster: "Three consonants together",
  digraph: "Two letters for one sound", final_digraph: "Final two-letter sound", final_ck: "Final ck", final_double: "Doubled final letter",
  final_x: "Two sounds written x", initial_qu: "Two sounds written qu", silent_e: "Vowel-consonant-e", vowel_team: "Vowel team",
  r_controlled: "Vowel with r", diphthong: "Moving vowel sound", compound: "Compound word", two_syllable: "Two syllables",
  closed_syllables: "Closed syllables", multisyllable: "Longer word", prefix: "Prefix before a base", suffix: "Suffix after a base",
  inflection: "Word ending", doubling: "Doubling before a suffix", y_change: "Y changes to i"
};

export function benchmarkFeatureGuidance(featureTags = []) {
  return featureTags.filter(feature => FEATURE_GUIDANCE[feature]).map(feature => ({
    feature, label: FEATURE_LABELS[feature] || feature.replaceAll("_", " "), guidance: FEATURE_GUIDANCE[feature]
  }));
}

export function benchmarkOralGuidance(item) {
  const syllables = item.strand === "syllable";
  const segmentation = item.strand === "phoneme_segmentation";
  const isolation = item.strand === "phoneme_isolation";
  const rhyme = item.strand === "rhyme" && item.task === "production";
  return {
    accept: rhyme ? "Any genuine spoken rhyme, including a familiar name. The list gives examples, not the only answers."
      : syllables && item.task === "segmentation" ? "The spoken word separated into its audible syllables, with dialect-appropriate boundaries."
      : segmentation ? "Every phoneme spoken in order. Accept an equivalent teacher transcription of the sounds heard."
      : isolation ? "The requested speech sound in the student's usual accent; letter names alone are not sound evidence."
      : "An oral response matching the requested sound operation; homophones are the same oral answer.",
    doNotAccept: syllables && item.task === "segmentation" ? "A number alone, spelling the letters, or repeating the word without separating its syllables."
      : segmentation ? "Letter names, a syllable count, or an omitted/added phoneme. Digraph letters are not separate phonemes."
      : rhyme ? "The same target word repeated or a word that shares only its initial sound."
      : "An answer obtained after the target was modeled, displayed in print, or broken into extra parts beyond the script.",
    listenFor: syllables ? "Larger spoken word parts; do not ask the student to read syllable spellings."
      : item.strand === "onset_rime" ? "Joining the onset with the whole rime; a consonant blend in the onset can contain several sounds."
      : "The sounds heard, not a match between the student's accent and the teacher's accent."
  };
}

export const EL_FLUENCY_PROSODY_LEVELS = [
  { score: 1, label: "Frequent support", description: "Mostly separate words or repeated restarts; phrasing and expression are difficult to judge because word reading needs frequent support." },
  { score: 2, label: "Emerging phrasing", description: "Some short groups of words; several pauses break meaning. Expression or pace is uneven." },
  { score: 3, label: "Mostly connected", description: "Mostly meaningful phrases with occasional hesitations; punctuation and meaning usually guide voice and pace." },
  { score: 4, label: "Consistently connected", description: "Meaningful phrases, smooth reading and an appropriate conversational pace; expression supports the text's meaning." }
];
