// Fry's 1,000 high-frequency words, grouped into increasing-rarity bands.
// The app's reviewed 1-100 assessment sequence remains authoritative for the
// first four bands; this file extends the usable practice bank from 101-1000.
// Source checked 2026-07-30:
// https://www.uen.org/earlylearning/word_lists.shtml
// https://www.educationoutside.org/wp-content/uploads/2022/01/Fry-Sight-Words-1-1000.pdf

export const EXTENDED_HFW_WORDS_BY_SKILL = Object.freeze({
  hfw_101_125: [
    "after", "again", "air", "also", "america",
    "animal", "another", "answer", "any", "around",
    "ask", "away", "back", "because", "before",
    "big", "boy", "came", "change", "different",
    "does", "end", "even", "follow", "form"
  ],
  hfw_126_150: [
    "found", "give", "good", "great", "hand",
    "help", "here", "home", "house", "just",
    "kind", "know", "land", "large", "learn",
    "letter", "line", "little", "live", "man",
    "me", "means", "men", "most", "mother"
  ],
  hfw_151_175: [
    "move", "much", "must", "name", "need",
    "new", "off", "old", "only", "our",
    "over", "page", "picture", "place", "play",
    "point", "put", "read", "right", "same",
    "say", "sentence", "set", "should", "show"
  ],
  hfw_176_200: [
    "small", "sound", "spell", "still", "study",
    "such", "take", "tell", "things", "think",
    "three", "through", "too", "try", "turn",
    "us", "very", "want", "well", "went",
    "where", "why", "work", "world", "years"
  ],
  hfw_201_225: [
    "above", "add", "almost", "along", "always",
    "began", "begin", "being", "below", "between",
    "book", "both", "car", "carry", "children",
    "city", "close", "country", "cut", "don't",
    "earth", "eat", "enough", "every", "example"
  ],
  hfw_226_250: [
    "eyes", "face", "family", "far", "father",
    "feet", "few", "food", "four", "girl",
    "got", "group", "grow", "hard", "head",
    "hear", "high", "idea", "important", "indian",
    "it's", "keep", "last", "late", "leave"
  ],
  hfw_251_275: [
    "left", "let", "life", "light", "list",
    "might", "mile", "miss", "mountains", "near",
    "never", "next", "night", "often", "once",
    "open", "own", "paper", "plant", "real",
    "river", "run", "saw", "school", "sea"
  ],
  hfw_276_300: [
    "second", "seem", "side", "something", "sometimes",
    "song", "soon", "start", "state", "stop",
    "story", "talk", "those", "thought", "together",
    "took", "tree", "under", "until", "walk",
    "watch", "while", "white", "without", "young"
  ],
  hfw_301_325: [
    "body", "music", "color", "stand", "sun",
    "questions", "fish", "area", "mark", "dog",
    "horse", "birds", "problem", "complete", "room",
    "knew", "since", "ever", "piece", "told",
    "usually", "didn't", "friends", "easy", "heard"
  ],
  hfw_326_350: [
    "order", "red", "door", "sure", "become",
    "top", "ship", "across", "today", "during",
    "short", "better", "best", "however", "low",
    "hours", "black", "products", "happened", "whole",
    "measure", "remember", "early", "waves", "reached"
  ],
  hfw_351_375: [
    "listen", "wind", "rock", "space", "covered",
    "fast", "several", "hold", "himself", "toward",
    "five", "step", "morning", "passed", "vowel",
    "true", "hundred", "against", "pattern", "numeral",
    "table", "north", "slowly", "money", "map"
  ],
  hfw_376_400: [
    "farm", "pulled", "draw", "voice", "seen",
    "cold", "cried", "plan", "notice", "south",
    "sing", "war", "ground", "fall", "king",
    "town", "i'll", "unit", "figure", "certain",
    "field", "travel", "wood", "fire", "upon"
  ],
  hfw_401_425: [
    "able", "ago", "among", "ball", "base",
    "became", "behind", "boat", "box", "bread",
    "bring", "brought", "building", "built", "cannot",
    "carefully", "check", "circle", "class", "clear",
    "common", "contain", "correct", "course", "dark"
  ],
  hfw_426_450: [
    "decided", "deep", "done", "dry", "english",
    "equation", "explain", "fact", "feel", "filled",
    "finally", "fine", "fly", "force", "front",
    "full", "game", "gave", "government", "green",
    "half", "heat", "heavy", "hot", "inches"
  ],
  hfw_451_475: [
    "include", "inside", "island", "known", "language",
    "less", "machine", "material", "minutes", "note",
    "nothing", "noun", "object", "ocean", "oh",
    "pair", "person", "plane", "power", "produce",
    "quickly", "ran", "rest", "road", "round"
  ],
  hfw_476_500: [
    "rule", "scientists", "shape", "shown", "six",
    "size", "special", "stars", "stay", "stood",
    "street", "strong", "surface", "system", "ten",
    "though", "thousands", "understand", "verb", "wait",
    "warm", "week", "wheels", "yes", "yet"
  ],
  hfw_501_525: [
    "anything", "arms", "beautiful", "believe", "beside",
    "bill", "blue", "brother", "can't", "cause",
    "cells", "center", "clothes", "dance", "describe",
    "developed", "difference", "direction", "discovered", "distance",
    "divided", "drive", "drop", "edge", "eggs"
  ],
  hfw_526_550: [
    "energy", "europe", "exercise", "farmers", "felt",
    "finished", "flowers", "forest", "general", "gone",
    "grass", "happy", "heart", "held", "instruments",
    "interest", "job", "kept", "lay", "legs",
    "length", "love", "main", "matter", "meet"
  ],
  hfw_551_575: [
    "members", "million", "mind", "months", "moon",
    "paint", "paragraph", "past", "perhaps", "picked",
    "present", "probably", "race", "rain", "raised",
    "ready", "reason", "record", "region", "represent",
    "return", "root", "sat", "shall", "sign"
  ],
  hfw_576_600: [
    "simple", "site", "sky", "soft", "square",
    "store", "subject", "suddenly", "sum", "summer",
    "syllables", "teacher", "test", "third", "train",
    "wall", "weather", "west", "whether", "wide",
    "wild", "window", "winter", "wish", "written"
  ],
  hfw_601_625: [
    "act", "africa", "age", "already", "although",
    "amount", "angle", "appear", "baby", "bear",
    "beat", "bed", "bottom", "bright", "broken",
    "build", "buy", "care", "case", "cat",
    "century", "consonant", "copy", "couldn't", "count"
  ],
  hfw_626_650: [
    "cross", "dictionary", "died", "dress", "either",
    "everyone", "everything", "exactly", "factors", "fight",
    "fingers", "floor", "fraction", "free", "french",
    "gold", "hair", "hill", "hole", "hope",
    "ice", "instead", "iron", "jumped", "killed"
  ],
  hfw_651_675: [
    "lake", "laughed", "lead", "let's", "lot",
    "melody", "metal", "method", "middle", "milk",
    "moment", "nation", "natural", "outside", "per",
    "phrase", "poor", "possible", "pounds", "pushed",
    "quiet", "quite", "remain", "result", "ride"
  ],
  hfw_676_700: [
    "rolled", "sail", "scale", "section", "sleep",
    "smiled", "snow", "soil", "solve", "someone",
    "son", "speak", "speed", "spring", "stone",
    "surprise", "tall", "temperature", "themselves", "tiny",
    "trip", "type", "village", "within", "wonder"
  ],
  hfw_701_725: [
    "alone", "art", "bad", "bank", "bit",
    "break", "brown", "burning", "business", "captain",
    "catch", "caught", "cents", "child", "choose",
    "clean", "climbed", "cloud", "coast", "continued",
    "control", "cool", "cost", "decimal", "desert"
  ],
  hfw_726_750: [
    "design", "direct", "drawing", "ears", "east",
    "else", "engine", "england", "equal", "experiment",
    "express", "feeling", "fell", "flow", "foot",
    "garden", "gas", "glass", "god", "grew",
    "history", "human", "hunting", "increase", "information"
  ],
  hfw_751_775: [
    "itself", "joined", "key", "lady", "law",
    "least", "lost", "maybe", "mouth", "party",
    "pay", "period", "plains", "please", "practice",
    "president", "received", "report", "ring", "rise",
    "row", "save", "seeds", "sent", "separate"
  ],
  hfw_776_800: [
    "serve", "shouted", "single", "skin", "statement",
    "stick", "straight", "strange", "students", "suppose",
    "symbols", "team", "touch", "trouble", "uncle",
    "valley", "visit", "wear", "whose", "wire",
    "woman", "wrote", "yard", "you're", "yourself"
  ],
  hfw_801_825: [
    "addition", "army", "bell", "belong", "block",
    "blood", "blow", "board", "bone", "branches",
    "cattle", "chief", "compare", "compound", "consider",
    "cook", "corner", "crops", "crowd", "current",
    "doctor", "dollars", "eight", "electric", "elements"
  ],
  hfw_826_850: [
    "enjoy", "entered", "except", "exciting", "expect",
    "famous", "fit", "flat", "fruit", "fun",
    "guess", "hat", "hit", "indicate", "industry",
    "insects", "interesting", "japanese", "lie", "lifted",
    "loud", "major", "mall", "meat", "mine"
  ],
  hfw_851_875: [
    "modern", "movement", "necessary", "observe", "park",
    "particular", "planets", "poem", "pole", "position",
    "process", "property", "provide", "rather", "rhythm",
    "rich", "safe", "sand", "science", "sell",
    "send", "sense", "seven", "sharp", "shoulder"
  ],
  hfw_876_900: [
    "sight", "silent", "soldiers", "spot", "spread",
    "stream", "string", "suggested", "supply", "swim",
    "terms", "thick", "thin", "thus", "tied",
    "tone", "trade", "tube", "value", "wash",
    "wasn't", "weight", "wife", "wings", "won't"
  ],
  hfw_901_925: [
    "action", "actually", "adjective", "afraid", "agreed",
    "ahead", "allow", "apple", "arrived", "born",
    "bought", "british", "capital", "chance", "chart",
    "church", "column", "company", "conditions", "corn",
    "cotton", "cows", "create", "dead", "deal"
  ],
  hfw_926_950: [
    "death", "details", "determine", "difficult", "division",
    "doesn't", "effect", "entire", "especially", "evening",
    "experience", "factories", "fair", "fear", "fig",
    "forward", "france", "fresh", "greek", "gun",
    "hoe", "huge", "isn't", "led", "level"
  ],
  hfw_951_975: [
    "located", "march", "match", "molecules", "northern",
    "nose", "office", "opposite", "oxygen", "plural",
    "prepared", "pretty", "printed", "radio", "repeated",
    "rope", "rose", "score", "seat", "settled",
    "shoes", "shop", "similar", "sir", "sister"
  ],
  hfw_976_1000: [
    "smell", "solution", "southern", "steel", "stretched",
    "substances", "suffix", "sugar", "tools", "total",
    "track", "triangle", "truck", "underline", "various",
    "view", "washington", "we'll", "western", "win",
    "women", "workers", "wouldn't", "wrong", "yellow"
  ]
});

export const EXTENDED_HFW_WORDS = Object.freeze(
  Object.values(EXTENDED_HFW_WORDS_BY_SKILL).flat()
);

export const EXTENDED_HFW_PRACTICE_TIERS = Object.freeze({
  developing: Object.freeze(EXTENDED_HFW_WORDS.slice(0, 200)),
  fluent: Object.freeze(EXTENDED_HFW_WORDS.slice(200, 500)),
  advanced: Object.freeze(EXTENDED_HFW_WORDS.slice(500))
});
