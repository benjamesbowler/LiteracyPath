const sourcePdfUrl = "https://filecabinet9.eschoolview.com/D64E465C-E09E-4F7D-96F6-C12A63B1F126/ChildrensBookswithNoCopyright.pdf";

const searchUrl = title => `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(title)}`;

const selectedBooks = [
  ["the-tale-of-peter-rabbit", "The Tale of Peter Rabbit", "Beatrix Potter", "K-1", "early", ["animals", "mischief", "family"], ["characters-setting", "sequencing", "retell", "prediction"], 5],
  ["the-tale-of-benjamin-bunny", "The Tale of Benjamin Bunny", "Beatrix Potter", "Grade 1", "early", ["animals", "adventure", "family"], ["sequencing", "characters-setting", "retell"], 4],
  ["the-tale-of-squirrel-nutkin", "The Tale of Squirrel Nutkin", "Beatrix Potter", "Grade 1-2", "developing", ["animals", "nature", "consequences"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-tale-of-jemima-puddle-duck", "The Tale of Jemima Puddle-Duck", "Beatrix Potter", "Grade 1-2", "developing", ["animals", "farm", "problem-solution"], ["prediction", "problem-solution", "retell"], 4],
  ["the-story-of-miss-moppet", "The Story of Miss Moppet", "Beatrix Potter", "K-1", "early", ["animals", "humor"], ["sequencing", "retell", "characters-setting"], 4],
  ["the-tale-of-tom-kitten", "The Tale of Tom Kitten", "Beatrix Potter", "K-1", "early", ["animals", "family", "humor"], ["sequencing", "retell"], 4],
  ["the-tale-of-mrs-tiggy-winkle", "The Tale of Mrs. Tiggy-Winkle", "Beatrix Potter", "Grade 1", "early", ["animals", "chores", "kindness"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-tale-of-mr-jeremy-fisher", "The Tale of Mr. Jeremy Fisher", "Beatrix Potter", "Grade 1-2", "developing", ["animals", "nature", "adventure"], ["sequencing", "vocabulary", "retell"], 4],
  ["the-story-of-the-three-little-pigs", "The Story of the Three Little Pigs", "L. Leslie Brooke", "K-1", "early", ["folk tale", "animals", "sequencing"], ["beginning-middle-end", "prediction", "retell"], 5],
  ["the-little-red-hen", "The Little Red Hen", "Traditional", "K-1", "early", ["folk tale", "animals", "work"], ["sequencing", "repeated language", "retell"], 5],
  ["the-three-bears", "The Three Bears", "Traditional", "K-1", "early", ["folk tale", "family", "repetition"], ["compare-contrast", "sequencing", "characters-setting"], 5],
  ["the-gingerbread-man", "The Gingerbread Man", "Traditional", "K-1", "early", ["folk tale", "repetition", "humor"], ["repeated language", "prediction", "retell"], 5],
  ["a-apple-pie", "A Apple Pie", "Kate Greenaway", "K", "emergent", ["alphabet", "rhyme", "classic"], ["rhyme", "fluency", "vocabulary"], 4],
  ["under-the-window", "Under the Window", "Kate Greenaway", "K-1", "early", ["rhyme", "children", "classic"], ["rhyme", "fluency", "vocabulary"], 4],
  ["johnny-crows-garden", "Johnny Crow's Garden", "L. Leslie Brooke", "K-1", "early", ["animals", "garden", "rhyme"], ["rhyme", "vocabulary", "retell"], 4],
  ["johnny-crows-party", "Johnny Crow's Party", "L. Leslie Brooke", "K-1", "early", ["animals", "party", "humor"], ["characters-setting", "sequencing", "vocabulary"], 4],
  ["the-house-that-jack-built", "The House That Jack Built", "Randolph Caldecott", "K-1", "early", ["cumulative tale", "rhyme"], ["repeated language", "fluency", "sequencing"], 4],
  ["mother-gooses-nursery-rhymes", "Mother Goose's Nursery Rhymes", "Walter Crane", "K", "read-aloud", ["rhyme", "nursery", "oral language"], ["rhyme", "fluency", "vocabulary"], 4],
  ["the-babys-own-aesop", "The Baby's Own Aesop", "Walter Crane", "Grade 1-2", "developing", ["fables", "animals", "moral"], ["main idea-details", "vocabulary", "retell"], 4],
  ["aesops-fables-for-children", "Aesop's Fables for Children", "Milo Winter", "Grade 2", "developing", ["fables", "animals", "moral"], ["main idea-details", "problem-solution", "compare-contrast"], 4],
  ["the-velveteen-rabbit", "The Velveteen Rabbit", "Margery Williams", "Read Aloud", "read-aloud", ["toys", "family", "feelings"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-slant-book", "The Slant Book", "Peter Newell", "Grade 1-2", "developing", ["humor", "adventure"], ["sequencing", "prediction", "vocabulary"], 4],
  ["the-rocket-book", "The Rocket Book", "Peter Newell", "Grade 1-2", "developing", ["humor", "adventure"], ["sequencing", "prediction", "cause-effect"], 4],
  ["the-book-of-nonsense", "The Book of Nonsense", "Edward Lear", "Read Aloud", "read-aloud", ["rhyme", "humor", "poetry"], ["rhyme", "fluency", "vocabulary"], 3],
  ["the-goops-and-how-to-be-them", "The Goops and How to Be Them", "Gelett Burgess", "Grade 1-2", "developing", ["manners", "humor", "rhyme"], ["compare-contrast", "rhyme", "main idea-details"], 3],
  ["old-mother-west-wind", "Old Mother West Wind", "Thornton W. Burgess", "Grade 2", "developing", ["animals", "nature", "moral"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-adventures-of-peter-cottontail", "The Adventures of Peter Cottontail", "Thornton W. Burgess", "Grade 2", "developing", ["animals", "nature", "adventure"], ["sequencing", "characters-setting", "prediction"], 4],
  ["the-adventures-of-old-mr-toad", "The Adventures of Old Mr. Toad", "Thornton W. Burgess", "Grade 2", "developing", ["animals", "nature"], ["vocabulary", "main idea-details", "retell"], 4],
  ["the-adventures-of-jerry-muskrat", "The Adventures of Jerry Muskrat", "Thornton W. Burgess", "Grade 2", "developing", ["animals", "nature", "water"], ["main idea-details", "characters-setting", "vocabulary"], 4],
  ["the-adventures-of-prickly-porky", "The Adventures of Prickly Porky", "Thornton W. Burgess", "Grade 2", "developing", ["animals", "nature"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-burgess-bird-book-for-children", "The Burgess Bird Book for Children", "Thornton W. Burgess", "Grade 2", "read-aloud", ["birds", "nature", "science"], ["main idea-details", "vocabulary", "compare-contrast"], 4],
  ["the-burgess-animal-book-for-children", "The Burgess Animal Book for Children", "Thornton W. Burgess", "Grade 2", "read-aloud", ["animals", "nature", "science"], ["main idea-details", "vocabulary", "compare-contrast"], 4],
  ["little-busybodies", "Little Busybodies", "Jeannette Augustus Marks", "Grade 1-2", "developing", ["insects", "nature", "science"], ["main idea-details", "vocabulary", "compare-contrast"], 4],
  ["among-the-meadow-people", "Among the Meadow People", "Clara Dillingham Pierson", "Grade 1-2", "developing", ["animals", "nature", "moral"], ["characters-setting", "vocabulary", "retell"], 4],
  ["among-the-forest-people", "Among the Forest People", "Clara Dillingham Pierson", "Grade 1-2", "developing", ["animals", "nature", "moral"], ["characters-setting", "vocabulary", "retell"], 4],
  ["raggedy-ann-stories", "Raggedy Ann Stories", "Johnny Gruelle", "Grade 1-2", "read-aloud", ["toys", "adventure", "family"], ["characters-setting", "sequencing", "retell"], 3]
];

export const publicDomainBookSourcePdf = sourcePdfUrl;

export const publicDomainBooks = selectedBooks.map(([
  id,
  title,
  author,
  gradeBand,
  difficulty,
  tags,
  skills,
  suitabilityScore
]) => ({
  id,
  title,
  author,
  illustrator: "",
  sourceUrl: searchUrl(title),
  sourcePdfUrl,
  publicDomain: true,
  licenseNote: "Selected from the Children's Books with No Copyright source list; verify exact edition before commercial deployment.",
  gradeBand,
  readingType: "guided-reading",
  difficulty,
  tags,
  skills,
  suitabilityScore,
  cover: `/books/public-domain/${id}/cover.webp`,
  pageCount: 0,
  estimatedPages: 0,
  active: false,
  downloadStatus: "pending_network_download",
  processingStatus: "not_processed",
  pages: [],
  comprehension: [
    {
      type: "open-response",
      question: "Who or what is this book mostly about?",
      options: [],
      correctAnswer: ""
    },
    {
      type: "open-response",
      question: "What happened first, next, and last?",
      options: [],
      correctAnswer: ""
    },
    {
      type: "open-response",
      question: "What is one new or interesting word from this book?",
      options: [],
      correctAnswer: ""
    }
  ]
}));

export const publicDomainBookSummary = {
  sourcePdfUrl,
  selectedCount: publicDomainBooks.length,
  activeCount: publicDomainBooks.filter(book => book.active).length,
  pendingCount: publicDomainBooks.filter(book => !book.active).length
};
