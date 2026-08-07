const BIG_IDEA_VERSION = "single-big-idea-v1";

// Most Story Bible nonfiction manuscripts end with their child-readable
// synthesis sentence. These are the reviewed exceptions where the final page
// is a question, invitation, safety reminder, or one last detail rather than
// the whole-book idea.
const BIG_IDEA_OVERRIDES = Object.freeze({
  "gr-a-27": "The Sun's light and warmth help life on Earth.",
  "gr-a-28": "Colors can be seen all around us.",
  "gr-b-33": "Tools have different jobs and must be used safely.",
  "gr-b-34": "Earth turns. Day and night take turns.",
  "gr-e-46": "Reptiles have traits that help them live.",
  "gr-e-48": "Magnets can pull some things and push other magnets.",
  "first-facts-level-a-05-the-sky": "The sky can look different at different times.",
  "first-facts-level-a-06-animals-can": "Animals can move in many ways.",
  "first-facts-level-a-10-shapes": "Shapes are all around us.",
  "first-facts-level-a-11-at-the-farm": "Many animals and plants live on a farm.",
  "first-facts-level-a-12-in-the-sea": "Many animals live and move in the sea.",
  "first-facts-level-a-16-fast-and-slow": "Things can move fast or slow.",
  "first-facts-level-a-17-a-seed-grows": "A seed can grow into a flower.",
  "first-facts-a-01-look-at-the-colors": "Colors fill our world.",
  "first-facts-a-03-little-seeds-grow": "A seed can grow into a flowering plant.",
  "first-facts-a-15-things-that-float-and-sink": "Many things can float or sink in water.",
  "first-facts-a-17-hello-sun": "The Sun seems to move because Earth turns.",
  "first-facts-a-20-my-five-senses": "Our five senses work together to help us learn.",
  "first-facts-a-24-rocks-and-pebbles": "Rocks form, change, and make up Earth's crust.",
  "level-c-nonfiction-01-bees": "Honeybees share hive jobs and help flowering plants grow.",
  "level-c-nonfiction-02-volcanoes": "Volcanoes erupt and slowly reshape Earth's land.",
  "level-c-nonfiction-03-penguins": "Penguins have traits that help them live in different places.",
  "level-c-nonfiction-04-the-moon": "The Moon moves around Earth and reflects sunlight.",
  "level-c-nonfiction-05-how-seeds-grow": "Flowering plants grow from seeds and make new seeds.",
  "level-c-nonfiction-06-spiders": "Spiders use their bodies, silk, and senses to survive.",
  "level-c-nonfiction-07-under-the-ocean": "Ocean life changes as water gets deeper, darker, and colder.",
  "level-c-nonfiction-08-butterflies": "Monarchs change through four life stages and migrate.",
  "level-c-nonfiction-09-caves": "Caves form slowly and can hold signs of life and people.",
  "level-c-nonfiction-10-frogs": "Frogs grow from eggs and live on land and in water."
});

const BIG_IDEA_DISTRACTOR_OVERRIDES = Object.freeze({
  "first-facts-level-a-03-big-and-little": [
    "Only big things are important.",
    "Only little things are important."
  ]
});

function cleanSentence(value = "") {
  return String(value).replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
}

function firstSentence(value = "") {
  const text = String(value).replace(/\s+/g, " ").trim();
  return cleanSentence(text.match(/^.*?[.!?](?=\s|$)/)?.[0] || text);
}

function normalized(value = "") {
  return cleanSentence(value)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value = "") {
  return normalized(value).split(" ").filter(Boolean).length;
}

function lowerInitial(value = "") {
  if (!value) return value;
  if (/^(?:Earth|I|Moon|Sun)\b/.test(value)) return value;
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function usableDetail(page = {}) {
  const text = firstSentence(page.text);
  if (!text || /[?]$/.test(String(page.text).trim())) return false;
  if (/^(?:after|as|at|before|by|during|in|inside|look|near|notice|now|observe|on|outside|remember|stay|then|through|try|under|watch|when|which|while)\b/i.test(text)) return false;
  if (/^(?:many|other|several|some|thousands)\b/i.test(text)) return false;
  return wordCount(text) >= 3 && wordCount(text) <= 13;
}

export function guidedReadingBigIdeaAnswer(book = {}) {
  const override = BIG_IDEA_OVERRIDES[book.id];
  if (override) return override;
  return String(book.pages?.at(-1)?.text || "").trim();
}

export function buildGuidedReadingBigIdeaDistractors(book = {}, preferredIndexes = []) {
  const reviewedDistractors = BIG_IDEA_DISTRACTOR_OVERRIDES[book.id];
  if (reviewedDistractors) {
    return {
      distractors: [...reviewedDistractors],
      sourceIndexes: [preferredIndexes[0] ?? 0, preferredIndexes[1] ?? 1]
    };
  }
  const answer = guidedReadingBigIdeaAnswer(book);
  const preferred = preferredIndexes
    .map(index => ({ index, page: book.pages?.[index] }))
    .filter(item => item.page);
  const remaining = (book.pages || [])
    .map((page, index) => ({ index, page }))
    .filter(item => !preferred.some(candidate => candidate.index === item.index))
    .sort((first, second) => wordCount(first.page.text) - wordCount(second.page.text) || first.index - second.index);

  const distractors = [];
  const sourceIndexes = [];
  for (const { index, page } of [...preferred, ...remaining]) {
    if (!usableDetail(page) || normalized(page.text) === normalized(answer)) continue;
    const choice = `Only ${lowerInitial(firstSentence(page.text))}.`;
    if (normalized(choice) === normalized(answer) || distractors.some(item => normalized(item) === normalized(choice))) continue;
    distractors.push(choice);
    sourceIndexes.push(index);
    if (distractors.length === 2) break;
  }

  if (distractors.length !== 2) {
    throw new Error(`${book.id}: could not build two age-readable big-idea distractors`);
  }
  return { distractors, sourceIndexes };
}

export function guidedReadingBigIdeaFairnessIssues(question = {}, book = {}) {
  if (question.skill !== "main_idea") return [];
  const issues = [];
  const answer = guidedReadingBigIdeaAnswer(book);
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const distractors = choices.filter(choice => normalized(choice) !== normalized(question.answer));
  const pageTexts = (book.pages || []).map(page => normalized(page.text)).filter(Boolean);

  if (String(book.type || "").toLowerCase() !== "nonfiction") {
    issues.push("big-idea questions are only defined for nonfiction books");
  }
  if (normalized(question.answer) !== normalized(answer)) {
    issues.push("answer does not match the reviewed whole-book big idea");
  }
  if (wordCount(question.answer) > 12) {
    issues.push("answer is longer than the 12-word early-reader limit");
  }
  if (distractors.length !== 2) {
    issues.push("question must have exactly two distractors");
  }

  for (const distractor of distractors) {
    const reviewedDistractor = BIG_IDEA_DISTRACTOR_OVERRIDES[book.id]?.some(
      choice => normalized(choice) === normalized(distractor)
    );
    if (!/^Only\s/i.test(String(distractor))) {
      issues.push(`distractor is not an explicit narrow-scope misconception: "${distractor}"`);
      continue;
    }
    if (pageTexts.includes(normalized(distractor))) {
      issues.push(`distractor repeats a true statement from the book: "${distractor}"`);
    }
    const groundedDetail = normalized(distractor).replace(/^only\s+/, "");
    if (!reviewedDistractor && !pageTexts.some(pageText => pageText.includes(groundedDetail))) {
      issues.push(`distractor is not grounded in a real book detail: "${distractor}"`);
    }
    if (wordCount(distractor) > 14) {
      issues.push(`distractor is longer than the 14-word early-reader limit: "${distractor}"`);
    }
  }

  if (question.bigIdeaPolicy !== BIG_IDEA_VERSION) {
    issues.push(`bigIdeaPolicy must be "${BIG_IDEA_VERSION}"`);
  }
  return issues;
}

export { BIG_IDEA_VERSION as GUIDED_READING_BIG_IDEA_POLICY_VERSION };
