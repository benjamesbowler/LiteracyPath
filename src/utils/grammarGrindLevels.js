import { starRubric } from "./starRubric.js";

const EASY = [
  {
    type: "punctuation",
    prompt: "Fix the sentence ending.",
    sentence: "The dog can run _",
    cue: "A telling sentence ends with a full stop.",
    correct: ".",
    options: [".", "?", "!"]
  },
  {
    type: "capital",
    prompt: "Choose the correct sentence start.",
    sentence: "_e can see a frog.",
    cue: "The first word in a sentence starts with a capital letter.",
    correct: "We",
    options: ["We", "we", "WE"]
  },
  {
    type: "properNoun",
    prompt: "Choose the correct name.",
    sentence: "_ went to school.",
    cue: "A person's name starts with a capital letter.",
    correct: "Maya",
    options: ["maya", "Maya", "MAYA"]
  },
  {
    type: "punctuation",
    prompt: "Choose the question ending.",
    sentence: "Can you find it _",
    cue: "A question ends with a question mark.",
    correct: "?",
    options: [".", "?", "!"]
  },
  {
    type: "comma",
    prompt: "Choose the missing comma.",
    sentence: "Yes _ I can help.",
    cue: "Use a comma after yes or no at the start.",
    correct: ",",
    options: [",", ".", "?"]
  },
  {
    type: "punctuation",
    prompt: "Choose the calm ending.",
    sentence: "The sun is hot _",
    cue: "This is a telling sentence, not a question.",
    correct: ".",
    options: ["!", ".", "?"]
  },
  {
    type: "punctuation",
    prompt: "Choose the excited ending.",
    sentence: "Wow _",
    cue: "A strong feeling can end with an exclamation mark.",
    correct: "!",
    options: [".", "?", "!"]
  },
  {
    type: "conjunction",
    prompt: "Join the two ideas.",
    sentence: "I like red _ blue.",
    cue: "Choose the joining word that lists two things.",
    correct: "and",
    options: ["and", "because", "but"]
  },
  {
    type: "tense",
    prompt: "Choose the past tense verb.",
    sentence: "Yesterday I _ to the park.",
    cue: "Yesterday tells us the action happened in the past.",
    correct: "went",
    options: ["go", "went", "going"]
  },
  {
    type: "capital",
    prompt: "Name the sentence rule.",
    sentence: "A sentence starts with a _ letter.",
    cue: "The first letter in a sentence should be uppercase.",
    correct: "capital",
    options: ["small", "capital", "quiet"]
  }
];

const MEDIUM = [
  {
    type: "agreement",
    prompt: "Choose the verb that agrees.",
    sentence: "The birds _ in the tree.",
    cue: "More than one bird uses sing, not sings.",
    correct: "sing",
    options: ["sing", "sings", "sang"]
  },
  {
    type: "tense",
    prompt: "Choose the past tense verb.",
    sentence: "Last night we _ pizza.",
    cue: "Last night tells us to use the past tense.",
    correct: "ate",
    options: ["eat", "ate", "eating"]
  },
  {
    type: "conjunction",
    prompt: "Choose the reason word.",
    sentence: "I wore boots _ it was raining.",
    cue: "The second idea explains the reason.",
    correct: "because",
    options: ["but", "because", "and"]
  },
  {
    type: "wordClass",
    prompt: "Choose an adjective.",
    sentence: "The _ dragon slept.",
    cue: "An adjective describes a noun.",
    correct: "green",
    options: ["green", "quickly", "under"]
  },
  {
    type: "wordClass",
    prompt: "Choose an adverb.",
    sentence: "The rabbit hopped _.",
    cue: "An adverb can tell how an action happens.",
    correct: "quickly",
    options: ["quickly", "fluffy", "under"]
  },
  {
    type: "prefix",
    prompt: "Choose the word that means not happy.",
    sentence: "not happy = _",
    cue: "The prefix un- can mean not.",
    correct: "unhappy",
    options: ["rehappy", "unhappy", "happily"]
  },
  {
    type: "suffix",
    prompt: "Choose the person word.",
    sentence: "A person who teaches is a _.",
    cue: "The suffix -er can mean a person who does something.",
    correct: "teacher",
    options: ["teaching", "teach", "teacher"]
  },
  {
    type: "possessive",
    prompt: "Show who owns the bowl.",
    sentence: "The dog owns it: the _ bowl.",
    cue: "Use apostrophe s to show one owner.",
    correct: "dog's",
    options: ["dogs", "dog's", "dogs'"]
  },
  {
    type: "plural",
    prompt: "Choose the irregular plural.",
    sentence: "One child, two _.",
    cue: "Child has an irregular plural.",
    correct: "children",
    options: ["childs", "childes", "children"]
  },
  {
    type: "comparison",
    prompt: "Complete the comparison.",
    sentence: "big, bigger, _",
    cue: "The last word compares the most.",
    correct: "biggest",
    options: ["biggest", "bigly", "more big"]
  }
];

const HARD = [
  {
    type: "conjunction",
    prompt: "Choose the result word.",
    sentence: "I studied, _ I passed.",
    cue: "The second clause is the result.",
    correct: "so",
    options: ["but", "so", "because"]
  },
  {
    type: "comma",
    prompt: "Choose the punctuation after the opener.",
    sentence: "After lunch _ we played outside.",
    cue: "Use a comma after an introductory phrase.",
    correct: ",",
    options: [",", ".", ";"]
  },
  {
    type: "agreement",
    prompt: "Choose the verb that agrees.",
    sentence: "Neither the cats nor the dog _ outside.",
    cue: "The nearest subject is dog, so use is.",
    correct: "is",
    options: ["are", "is", "were"]
  },
  {
    type: "agreement",
    prompt: "Choose the collective noun verb.",
    sentence: "The team _ ready.",
    cue: "Team acts as one group in this sentence.",
    correct: "is",
    options: ["are", "is", "were"]
  },
  {
    type: "pronoun",
    prompt: "Choose the best pronoun.",
    sentence: "Mia and I packed _ bags.",
    cue: "Mia and I means we, so the bags are ours.",
    correct: "our",
    options: ["their", "our", "his"]
  },
  {
    type: "relative",
    prompt: "Choose the owner word.",
    sentence: "The book, _ cover is blue, is mine.",
    cue: "Whose shows ownership.",
    correct: "whose",
    options: ["who", "whose", "which"]
  },
  {
    type: "conditional",
    prompt: "Choose the verb for the condition.",
    sentence: "I would have gone if I _ time.",
    cue: "Would have gone pairs with had.",
    correct: "had",
    options: ["have", "had", "has"]
  },
  {
    type: "vocabulary",
    prompt: "Choose the strongest verb.",
    sentence: "The eagle _ over the cliffs.",
    cue: "Choose the vivid verb that means flew high.",
    correct: "soared",
    options: ["did", "went", "soared"]
  },
  {
    type: "fragment",
    prompt: "Fix the fragment.",
    sentence: "Because it rained, _.",
    cue: "The sentence needs a complete main clause.",
    correct: "we stayed inside",
    options: ["we stayed inside", "after lunch", "because wet"]
  },
  {
    type: "colon",
    prompt: "Choose the punctuation for a list.",
    sentence: "Bring three things _ a hat, a coat, and a snack.",
    cue: "A colon can introduce a list.",
    correct: ":",
    options: [":", ",", "?"]
  }
];

const LEVELS = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD
};

const FOCUS_BY_TYPE = {
  agreement: "Subject and verb agreement",
  capital: "Capital letters",
  colon: "List punctuation",
  comma: "Comma placement",
  comparison: "Comparing words",
  conditional: "Condition grammar",
  conjunction: "Joining ideas",
  fragment: "Complete sentences",
  plural: "Plural words",
  possessive: "Apostrophes for ownership",
  prefix: "Prefix meaning",
  pronoun: "Pronoun choice",
  properNoun: "Names and capitals",
  punctuation: "Sentence endings",
  relative: "Relative words",
  suffix: "Suffix meaning",
  tense: "Verb tense",
  vocabulary: "Precise verbs",
  wordClass: "Word classes"
};

const TEACHING_BY_TYPE = {
  agreement: "Check the subject first, then choose the verb form that belongs with it.",
  capital: "A complete sentence starts with a capital letter.",
  colon: "A colon can point forward to a list that explains what comes next.",
  comma: "Small pause words and opening phrases often need a comma before the main idea.",
  comparison: "Comparing three or more things often uses the strongest ending, like -est.",
  conditional: "Condition sentences need matching verb forms on both sides of the idea.",
  conjunction: "The joining word should explain the relationship between the two ideas.",
  fragment: "A full sentence needs a complete main clause, not just an unfinished thought.",
  plural: "Some plural words change shape instead of just adding s.",
  possessive: "Use an apostrophe to show ownership, then check whether there is one owner or many.",
  prefix: "A prefix changes the meaning at the start of a word.",
  pronoun: "Replace the people with the matching pronoun before choosing the answer.",
  properNoun: "A person's name is a proper noun, so it starts with a capital letter.",
  punctuation: "Read the sentence job: statement, question, or strong feeling.",
  relative: "Use whose when the sentence is showing ownership.",
  suffix: "A suffix changes the job or meaning at the end of a word.",
  tense: "Time words like yesterday and last night tell you which verb tense to use.",
  vocabulary: "Choose the word with the exact meaning, not the empty filler word.",
  wordClass: "Ask what job the missing word is doing in the sentence."
};

export const GRAMMAR_GRIND_LEVELS_PER_DIFFICULTY = 10;

export function grammarGrindLadder(difficulty = "easy") {
  const key = Object.hasOwn(LEVELS, difficulty) ? difficulty : "easy";
  return LEVELS[key].map((level, index) => ({
    ...level,
    level: index,
    difficulty: key,
    focus: level.focus || FOCUS_BY_TYPE[level.type] || "Grammar choice",
    teaching: level.teaching || TEACHING_BY_TYPE[level.type] || level.cue,
    success: level.success || `Good grammar: ${level.cue}`,
    wrongHint: level.wrongHint || TEACHING_BY_TYPE[level.type] || level.cue,
    options: [...level.options]
  }));
}

export function grammarGrindIsCorrect(choice, level) {
  return String(choice) === String(level?.correct ?? "");
}

export function grammarGrindChoiceFeedback(choice, level) {
  if (!level) return "Read the sentence again, then choose the grammar that fits.";
  if (grammarGrindIsCorrect(choice, level)) return level.success || level.cue || "That choice fits the sentence.";
  const chosen = String(choice);
  const correct = String(level.correct ?? "");
  const cue = level.cue || level.teaching || TEACHING_BY_TYPE[level.type] || "Use the rule shown in the sentence.";
  return `"${chosen}" does not fit here. ${cue} Aim for "${correct}".`;
}

export function grammarGrindStars(result = {}) {
  return starRubric(result);
}
