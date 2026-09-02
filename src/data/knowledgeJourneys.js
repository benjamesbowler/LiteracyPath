// Knowledge journeys turn the existing nonfiction library into cumulative
// text sets. They do not change EL order or claim that these books are
// independently decodable: the reading-purpose policy decides the support for
// each child. Vocabulary is deliberately repeated across levels and books.
export const KNOWLEDGE_JOURNEYS = Object.freeze([
  Object.freeze({
    id: "plants-and-growth",
    title: "Plants and growth",
    guidingQuestion: "What helps a living thing grow?",
    vocabulary: Object.freeze(["seed", "root", "stem", "flower", "pollen"]),
    bookIds: Object.freeze([
      "first-facts-level-a-17-a-seed-grows",
      "first-facts-level-a-14-the-tree",
      "first-facts-a-03-little-seeds-grow",
      "first-facts-a-05-flowers-and-trees",
      "level-c-nonfiction-05-how-seeds-grow",
      "level-c-nonfiction-01-bees",
      "level-c-nonfiction-08-butterflies"
    ]),
    writingPrompt: "Draw and label how a seed changes."
  }),
  Object.freeze({
    id: "earth-and-sky",
    title: "Earth and sky",
    guidingQuestion: "Why does the world around us change?",
    vocabulary: Object.freeze(["sun", "moon", "season", "weather", "rock"]),
    bookIds: Object.freeze([
      "first-facts-level-a-05-the-sky",
      "first-facts-level-a-19-day-and-night",
      "first-facts-level-a-20-space",
      "first-facts-a-02-the-four-seasons",
      "first-facts-a-04-what-is-weather",
      "first-facts-a-17-hello-sun",
      "first-facts-a-18-the-moon",
      "first-facts-a-24-rocks-and-pebbles",
      "level-c-nonfiction-02-volcanoes",
      "level-c-nonfiction-04-the-moon",
      "level-c-nonfiction-09-caves"
    ]),
    writingPrompt: "Write one change you notice in the sky."
  }),
  Object.freeze({
    id: "animals-and-habitats",
    title: "Animals and habitats",
    guidingQuestion: "How does a habitat meet an animal's needs?",
    vocabulary: Object.freeze(["animal", "habitat", "ocean", "shelter", "young"]),
    bookIds: Object.freeze([
      "first-facts-level-a-02-farm-animals",
      "first-facts-level-a-07-bugs",
      "first-facts-level-a-12-in-the-sea",
      "first-facts-level-a-15-baby-animals",
      "first-facts-a-08-animals-in-the-ocean",
      "first-facts-a-09-animals-at-night",
      "first-facts-a-10-bugs-all-around-us",
      "level-c-nonfiction-03-penguins",
      "level-c-nonfiction-06-spiders",
      "level-c-nonfiction-07-under-the-ocean",
      "level-c-nonfiction-10-frogs"
    ]),
    writingPrompt: "Draw a habitat and label what an animal needs."
  }),
  Object.freeze({
    id: "body-and-health",
    title: "Body and health",
    guidingQuestion: "How does your body help you live and learn?",
    vocabulary: Object.freeze(["body", "sense", "grow", "healthy", "protect"]),
    bookIds: Object.freeze([
      "first-facts-level-a-18-my-body",
      "first-facts-a-20-my-five-senses",
      "first-facts-a-21-how-i-grow",
      "first-facts-a-22-staying-healthy",
      "first-facts-a-23-my-body"
    ]),
    writingPrompt: "Write one way you care for your body."
  }),
  Object.freeze({
    id: "water-and-forces",
    title: "Water and forces",
    guidingQuestion: "What makes things move or change?",
    vocabulary: Object.freeze(["water", "float", "sink", "push", "pull"]),
    bookIds: Object.freeze([
      "first-facts-level-a-04-water",
      "first-facts-level-a-09-hot-and-cold",
      "first-facts-a-14-hot-and-cold",
      "first-facts-a-15-things-that-float-and-sink",
      "first-facts-a-16-push-and-pull",
      "first-facts-a-25-water-everywhere"
    ]),
    writingPrompt: "Draw a test and write what floated or sank."
  })
]);

const JOURNEY_BY_BOOK_ID = new Map(
  KNOWLEDGE_JOURNEYS.flatMap(journey => journey.bookIds.map(bookId => [bookId, journey]))
);

export function getKnowledgeJourney(journeyId = "") {
  return KNOWLEDGE_JOURNEYS.find(journey => journey.id === journeyId) || KNOWLEDGE_JOURNEYS[0];
}

export function getBookKnowledgeJourney(bookOrId = "") {
  const bookId = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return JOURNEY_BY_BOOK_ID.get(bookId) || null;
}

export function knowledgeJourneyBooks(journeyId = "", books = [], level = "") {
  const journey = getKnowledgeJourney(journeyId);
  const byId = new Map(books.map(book => [book.id, book]));
  return journey.bookIds
    .map(bookId => byId.get(bookId))
    .filter(book => book && (!level || book.level === level));
}
