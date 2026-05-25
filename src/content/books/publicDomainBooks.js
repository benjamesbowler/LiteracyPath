import { publicDomainRuntimeManifest } from "./publicDomainRuntimeManifest.js";

export const publicDomainBookSourcePdf = "https://filecabinet9.eschoolview.com/D64E465C-E09E-4F7D-96F6-C12A63B1F126/ChildrensBookswithNoCopyright.pdf";

const selectedBooks = [
  ["the-tale-of-peter-rabbit", "The Tale of Peter Rabbit", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "K-1", "early", ["animals", "mischief", "family"], ["characters-setting", "sequencing", "retell", "prediction"], 5],
  ["the-tale-of-benjamin-bunny", "The Tale of Benjamin Bunny", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "Grade 1", "early", ["animals", "adventure", "family"], ["sequencing", "characters-setting", "retell"], 4],
  ["the-tale-of-squirrel-nutkin", "The Tale of Squirrel Nutkin", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "Grade 1-2", "developing", ["animals", "nature", "consequences"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-tale-of-jemima-puddle-duck", "The Tale of Jemima Puddle-Duck", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "Grade 1-2", "developing", ["animals", "farm", "problem-solution"], ["prediction", "problem-solution", "retell"], 4],
  ["the-story-of-miss-moppet", "The Story of Miss Moppet", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "K-1", "early", ["animals", "humor"], ["sequencing", "retell", "characters-setting"], 4],
  ["the-tale-of-tom-kitten", "The Tale of Tom Kitten", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "K-1", "early", ["animals", "family", "humor"], ["sequencing", "retell"], 4],
  ["the-tale-of-mrs-tiggy-winkle", "The Tale of Mrs. Tiggy-Winkle", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "Grade 1", "early", ["animals", "chores", "kindness"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-tale-of-mr-jeremy-fisher", "The Tale of Mr. Jeremy Fisher", "Beatrix Potter", "https://www.gutenberg.org/ebooks/572", "Grade 1-2", "developing", ["animals", "nature", "adventure"], ["sequencing", "vocabulary", "retell"], 4],
  ["the-story-of-the-three-little-pigs", "The Story of the Three Little Pigs", "L. Leslie Brooke", "https://www.gutenberg.org/ebooks/18155", "K-1", "early", ["folk tale", "animals", "sequencing"], ["beginning-middle-end", "prediction", "retell"], 5],
  ["the-little-red-hen", "The Little Red Hen", "Florence White Williams", "https://www.gutenberg.org/ebooks/18735", "K-1", "early", ["folk tale", "animals", "work"], ["sequencing", "repeated language", "retell"], 5],
  ["denslows-three-bears", "Denslow's Three Bears", "W. W. Denslow", "https://www.gutenberg.org/ebooks/19772", "K-1", "early", ["folk tale", "family", "repetition"], ["compare-contrast", "sequencing", "characters-setting"], 5],
  ["the-gingerbread-man", "The Gingerbread Man", "L. Leslie Brooke", "https://www.gutenberg.org/ebooks/15661", "K-1", "early", ["folk tale", "repetition", "humor"], ["repeated language", "prediction", "retell"], 5],
  ["a-apple-pie", "A Apple Pie", "Kate Greenaway", "https://www.gutenberg.org/ebooks/15809", "K", "emergent", ["alphabet", "rhyme", "classic"], ["rhyme", "fluency", "vocabulary"], 4],
  ["the-funny-alphabet", "The Funny Alphabet", "Edward P. Cogger", "https://www.gutenberg.org/ebooks/20286", "K", "emergent", ["alphabet", "humor"], ["alphabet", "vocabulary", "fluency"], 3],
  ["the-absurd-abc", "The Absurd ABC", "Walter Crane", "https://www.gutenberg.org/ebooks/17283", "K", "emergent", ["alphabet", "humor"], ["alphabet", "vocabulary", "rhyme"], 3],
  ["johnny-crows-garden", "Johnny Crow's Garden", "L. Leslie Brooke", "https://www.gutenberg.org/ebooks/10469", "K-1", "early", ["animals", "garden", "rhyme"], ["rhyme", "vocabulary", "retell"], 4],
  ["johnny-crows-party", "Johnny Crow's Party", "L. Leslie Brooke", "https://www.gutenberg.org/ebooks/10557", "K-1", "early", ["animals", "party", "humor"], ["characters-setting", "sequencing", "vocabulary"], 4],
  ["the-house-that-jack-built", "The House That Jack Built", "Randolph Caldecott", "https://www.gutenberg.org/ebooks/12109", "K-1", "early", ["cumulative tale", "rhyme"], ["repeated language", "fluency", "sequencing"], 4],
  ["denslows-mother-goose", "Denslow's Mother Goose", "W. W. Denslow", "https://www.gutenberg.org/ebooks/18546", "K", "read-aloud", ["rhyme", "nursery", "oral language"], ["rhyme", "fluency", "vocabulary"], 4],
  ["the-real-mother-goose", "The Real Mother Goose", "Blanche Fisher Wright", "https://www.gutenberg.org/ebooks/10607", "K", "read-aloud", ["rhyme", "nursery", "oral language"], ["rhyme", "fluency", "vocabulary"], 4],
  ["the-babys-own-aesop", "The Baby's Own Aesop", "Walter Crane", "https://www.gutenberg.org/ebooks/25433", "Grade 1-2", "developing", ["fables", "animals", "moral"], ["main idea-details", "vocabulary", "retell"], 4],
  ["the-aesop-for-children", "The Aesop for Children", "Milo Winter", "https://www.gutenberg.org/ebooks/19994", "Grade 2", "developing", ["fables", "animals", "moral"], ["main idea-details", "problem-solution", "compare-contrast"], 4],
  ["the-velveteen-rabbit", "The Velveteen Rabbit", "Margery Williams", "https://www.gutenberg.org/ebooks/11757", "Read Aloud", "read-aloud", ["toys", "family", "feelings"], ["characters-setting", "vocabulary", "retell"], 4],
  ["the-burgess-bird-book-for-children", "The Burgess Bird Book for Children", "Thornton W. Burgess", "https://www.gutenberg.org/ebooks/3074", "Grade 2", "read-aloud", ["birds", "nature", "science"], ["main idea-details", "vocabulary", "compare-contrast"], 4],
  ["the-burgess-animal-book-for-children", "The Burgess Animal Book for Children", "Thornton W. Burgess", "https://www.gutenberg.org/ebooks/2441", "Grade 2", "read-aloud", ["animals", "nature", "science"], ["main idea-details", "vocabulary", "compare-contrast"], 4],
  ["animal-children", "Animal Children", "Edith Brown Kirkwood", "https://www.gutenberg.org/ebooks/17782", "K-1", "early", ["animals", "rhyme", "nature"], ["rhyme", "vocabulary", "fluency"], 4],
  ["the-tales-of-mother-goose", "The Tales of Mother Goose", "Charles Perrault", "https://www.gutenberg.org/ebooks/17208", "Grade 1-2", "read-aloud", ["fairy tale", "classic"], ["retell", "characters-setting", "prediction"], 3],
  ["childrens-hour-red-riding-hood", "Children's Hour with Red Riding Hood and Other Stories", "Watty Piper", "https://www.gutenberg.org/ebooks/11592", "Grade 1-2", "read-aloud", ["fairy tale", "classic"], ["sequencing", "prediction", "retell"], 3],
  ["little-cinderella", "Little Cinderella", "Anonymous", "https://www.gutenberg.org/ebooks/20723", "Grade 1", "early", ["fairy tale", "family"], ["characters-setting", "retell", "sequencing"], 3],
  ["old-mother-hubbard-and-her-dog", "Old Mother Hubbard and Her Dog", "Sarah Catherine Martin", "https://www.gutenberg.org/ebooks/23348", "K-1", "early", ["rhyme", "humor", "animals"], ["rhyme", "sequencing", "fluency"], 3],
  ["hey-diddle-diddle-and-baby-bunting", "Hey Diddle Diddle and Baby Bunting", "Randolph Caldecott", "https://www.gutenberg.org/ebooks/19177", "K", "emergent", ["rhyme", "nursery"], ["rhyme", "fluency", "oral language"], 3],
  ["ring-o-roses", "Ring O' Roses", "L. Leslie Brooke", "https://www.gutenberg.org/ebooks/20652", "K-1", "early", ["rhyme", "classic"], ["rhyme", "fluency", "vocabulary"], 3],
  ["finger-plays-for-nursery-and-kindergarten", "Finger Plays for Nursery and Kindergarten", "Emilie Poulsson", "https://www.gutenberg.org/ebooks/24912", "K", "read-aloud", ["movement", "rhyme", "oral language"], ["fluency", "vocabulary", "rhyme"], 3],
  ["punky-dunk-and-the-mouse", "Punky Dunk and the Mouse", "Anonymous", "https://www.gutenberg.org/ebooks/19531", "K-1", "early", ["animals", "humor"], ["sequencing", "characters-setting", "retell"], 3],
  ["punky-dunk-and-the-spotted-pup", "Punky Dunk and the Spotted Pup", "Anonymous", "https://www.gutenberg.org/ebooks/19366", "K-1", "early", ["animals", "humor"], ["characters-setting", "sequencing", "retell"], 3],
  ["willie-mouse", "Willie Mouse", "Alta Tabor", "https://www.gutenberg.org/ebooks/18742", "K-1", "early", ["animals", "family"], ["characters-setting", "retell", "sequencing"], 3]
];

const pilotDownloadMetadata = {
  "a-apple-pie": {
    pilot: true,
    sourceUrl: "https://archive.org/details/applepie00gree2",
    pdfUrl: "https://archive.org/download/applepie00gree2/applepie00gree2.pdf",
    downloadPageUrl: "https://archive.org/details/applepie00gree2",
    copyrightNote: "Internet Archive scan of Kate Greenaway's public-domain A Apple Pie. Selected from the no-copyright source list and still requires final classroom-use review after page rendering.",
    libraryStatus: "needs_pdf"
  },
  "the-story-of-the-three-little-pigs": {
    pilot: true,
    sourceUrl: "https://www.loc.gov/item/84181093/",
    pdfUrl: "https://www.loc.gov/resource/rbc0001.2003juv81093/?st=pdf",
    downloadPageUrl: "https://www.loc.gov/item/84181093/",
    copyrightNote: "Library of Congress public-domain scan of L. Leslie Brooke's edition. LOC provides a complete PDF/download view; verify the downloaded file before activation.",
    libraryStatus: "needs_pdf"
  },
  "denslows-three-bears": {
    pilot: true,
    sourceUrl: "https://www.loc.gov/item/96779493/",
    pdfUrl: "https://www.loc.gov/resource/rbc0001.2003juv96794/?st=pdf",
    downloadPageUrl: "https://www.loc.gov/item/96779493/",
    copyrightNote: "Library of Congress public-domain scan of W. W. Denslow's edition. LOC provides a complete PDF/download view; verify the downloaded file before activation.",
    libraryStatus: "needs_pdf"
  }
};

export const publicDomainBooks = selectedBooks.map(([
  id,
  title,
  author,
  sourceUrl,
  gradeBand,
  difficulty,
  tags,
  skills,
  suitabilityScore
]) => {
  const pilot = pilotDownloadMetadata[id] || {};
  const runtime = publicDomainRuntimeManifest[id] || {};
  const downloadStatus = pilot.pdfUrl ? "needs_pdf" : "needs_pdf_url";
  const pages = runtime.pages || [];

  return {
    id,
    title,
    author,
    illustrator: "",
    sourceUrl: pilot.sourceUrl || sourceUrl,
    sourcePdfUrl: publicDomainBookSourcePdf,
    pdfUrl: pilot.pdfUrl || "",
    downloadPageUrl: pilot.downloadPageUrl || sourceUrl,
    localPdfPath: `/books/public-domain/${id}/original.pdf`,
    publicDomain: true,
    licenseNote: pilot.copyrightNote || "Selected from the Children's Books with No Copyright source list; verify exact edition before commercial deployment.",
    gradeBand,
    readingType: "guided-reading",
    difficulty,
    tags,
    skills,
    suitabilityScore,
    cover: runtime.cover || `/books/public-domain/${id}/cover.webp`,
    pageCount: runtime.pageCount || pages.length,
    estimatedPages: runtime.estimatedPages || pages.length,
    active: Boolean(runtime.active && pages.length > 0),
    pilot: Boolean(pilot.pilot),
    libraryStatus: runtime.libraryStatus || pilot.libraryStatus || downloadStatus,
    downloadStatus: runtime.downloadStatus || downloadStatus,
    processingStatus: runtime.processingStatus || "not_processed",
    pages,
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
  };
});

export const publicDomainBookSummary = {
  sourcePdfUrl: publicDomainBookSourcePdf,
  selectedCount: publicDomainBooks.length,
  activeCount: publicDomainBooks.filter(book => book.active).length,
  pendingCount: publicDomainBooks.filter(book => !book.active).length
};
