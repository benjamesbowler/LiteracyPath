const patternInventory = [
  { pattern: "oa", examples: ["boat", "coat", "road"] },
  { pattern: "ch", examples: ["chip", "chair", "lunch"] },
  { pattern: "a_e", examples: ["cake", "make", "gate"] },
  { pattern: "ur", examples: ["turn", "hurt", "nurse"] },
  { pattern: "ay", examples: ["play", "day", "tray"] },
  { pattern: "sh", examples: ["ship", "shop", "wish"] },
  { pattern: "i_e", examples: ["bike", "time", "slide"] },
  { pattern: "er", examples: ["her", "fern", "term"] },
  { pattern: "ai", examples: ["rain", "train", "mail"] },
  { pattern: "th", examples: ["thin", "bath", "path"] },
  { pattern: "oo", examples: ["moon", "spoon", "food"] },
  { pattern: "ar", examples: ["car", "farm", "star"] },
  { pattern: "e_e", examples: ["these", "theme", "complete"] },
  { pattern: "ing", examples: ["singing", "jumping", "reading"] },
  { pattern: "ow", examples: ["cow", "now", "brown"] },
  { pattern: "ir", examples: ["bird", "shirt", "girl"] },
  { pattern: "ee", examples: ["tree", "green", "sheep"] },
  { pattern: "tion", examples: ["station", "action", "fiction"] },
  { pattern: "o_e", examples: ["home", "rope", "note"] },
  { pattern: "air", examples: ["chair", "hair", "fair"] },
  { pattern: "ue", examples: ["blue", "glue", "rescue"] },
  { pattern: "or", examples: ["fork", "storm", "corn"] },
  { pattern: "ea", examples: ["leaf", "team", "beach"] },
  { pattern: "ts", examples: ["cats", "hats", "bats"] },
  { pattern: "igh", examples: ["night", "light", "bright"] },
  { pattern: "oy", examples: ["boy", "toy", "enjoy"] },
  { pattern: "ey", examples: ["key", "monkey", "honey"] },
  { pattern: "aw", examples: ["saw", "draw", "straw"] },
  { pattern: "ie", examples: ["pie", "tie", "cried"] },
  { pattern: "-le", examples: ["table", "apple", "little"] },
  { pattern: "ui", examples: ["fruit", "suit", "juice"] },
  { pattern: "oi", examples: ["coin", "soil", "point"] },
  { pattern: "ou", examples: ["cloud", "shout", "found"] }
];


export const PHONICS_PATTERN_FORM_VERSION = "phonics-patterns-2026.09-v2";
const patternGuidance = {
  oa: ["Vowel teams", "/ō/ as in boat"], ch: ["Consonant digraphs", "/ch/ as in chip; /k/ as in school or /sh/ as in chef are also valid"],
  a_e: ["Split vowel spellings", "/ā/ as in cake"], ur: ["R-controlled vowels", "The vowel sound in turn; accept the student's consistent accent"],
  ay: ["Vowel teams", "/ā/ as in day"], sh: ["Consonant digraphs", "/sh/ as in ship"], i_e: ["Split vowel spellings", "/ī/ as in bike"],
  er: ["R-controlled vowels", "The vowel sound in her; accept the student's consistent accent"], ai: ["Vowel teams", "/ā/ as in rain"],
  th: ["Consonant digraphs", "Either /th/ in thin or the voiced /th/ in this"], oo: ["Vowel teams", "Either the vowel in moon or the vowel in book"],
  ar: ["R-controlled vowels", "The vowel sound in car; accept the student's consistent accent"], e_e: ["Split vowel spellings", "/ē/ as in these"],
  ing: ["Word endings", "The sounds /i/ /ng/ together; this ending represents more than one sound"], ow: ["Vowel teams", "Either the vowel in cow or /ō/ in snow"],
  ir: ["R-controlled vowels", "The vowel sound in bird; accept the student's consistent accent"], ee: ["Vowel teams", "/ē/ as in tree"],
  tion: ["Word endings", "The ending /shən/ as in station; this is a syllable, not one phoneme"], o_e: ["Split vowel spellings", "/ō/ as in home"],
  air: ["R-controlled vowels", "The vowel sound in chair; accept the student's consistent accent"], ue: ["Vowel teams", "Either /oo/ in blue or /y/ /oo/ in rescue"],
  or: ["R-controlled vowels", "The vowel in fork; an alternative with a valid example such as work is acceptable"],
  ea: ["Vowel teams", "/ē/ in team, /e/ in bread, or /ā/ in steak"], ts: ["Word endings", "Both /t/ and /s/ in order; this is two sounds, not a digraph"],
  igh: ["Vowel teams", "/ī/ as in night"], oy: ["Vowel teams", "The vowel sound in boy"], ey: ["Vowel teams", "/ē/ in key or /ā/ in they"],
  aw: ["Vowel teams", "The vowel sound in saw; accept the student's consistent accent"], ie: ["Vowel teams", "/ī/ in pie or /ē/ in field"],
  "-le": ["Word endings", "The final syllable in table or apple; accept syllabic /l/ or a reduced vowel plus /l/"],
  ui: ["Vowel teams", "The vowel sound in fruit"], oi: ["Vowel teams", "The vowel sound in coin"],
  ou: ["Vowel teams", "The vowel in cloud; other valid examples include soup, young and soul"]
};

export const advancedPhonicsPatterns = patternInventory.map(item => ({
  ...item,
  id: `phonics-pattern-${item.pattern.replace(/[^a-z]/g, "-")}`,
  group: patternGuidance[item.pattern][0],
  soundGuidance: patternGuidance[item.pattern][1],
  soundPrompt: ["ing", "tion", "ts", "-le"].includes(item.pattern)
    ? "Say the sounds this word part represents."
    : "Tell me a sound these letters can make.",
  construct: ["ing", "tion", "ts", "-le"].includes(item.pattern) ? "spelling_part_pronunciation" : "grapheme_sound_correspondence",
  administrationNote: "Accept a valid pronunciation supported by a real word. Record the response, then assess the example word separately. Do not model a sound or show the word before the first response.",
  formVersion: PHONICS_PATTERN_FORM_VERSION
}));
