const wordAudio = word => `/audio/child-mode/words/${word.toLowerCase().replace(/\s+/g, "-")}.mp3`;

const words = text =>
  text
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

export const guidedReadingBooks = [
  {
    id: "max-map",
    title: "Max and the Map",
    type: "fiction",
    level: "A",
    targetSkills: ["CVC words", "sight words", "short a"],
    coverImage: "/images/child-mode/cvc/map.png",
    pages: [
      {
        text: "Max has a map.",
        image: "/images/child-mode/cvc/map.png",
        words: words("Max has a map")
      },
      {
        text: "Max sees a cat.",
        image: "/images/child-mode/cvc/cat.png",
        words: words("Max sees a cat")
      },
      {
        text: "The cat sits in the sun.",
        image: "/images/child-mode/cvc/sun.png",
        words: words("The cat sits in the sun")
      },
      {
        text: "Max can nap.",
        image: "/images/child-mode/cvc/nap.png",
        words: words("Max can nap")
      }
    ]
  },
  {
    id: "the-little-bag",
    title: "The Little Bag",
    type: "fiction",
    level: "A",
    targetSkills: ["CVC words", "sight words", "short a"],
    coverImage: "/images/child-mode/cvc/bag.png",
    pages: [
      {
        text: "I see a bag.",
        image: "/images/child-mode/cvc/bag.png",
        words: words("I see a bag")
      },
      {
        text: "The bag is big.",
        image: "/images/child-mode/short-i/big.png",
        words: words("The bag is big")
      },
      {
        text: "A hat is in the bag.",
        image: "/images/child-mode/cvc/hat.png",
        words: words("A hat is in the bag")
      },
      {
        text: "The hat is for me.",
        image: "/images/child-mode/cvc/hat.png",
        words: words("The hat is for me")
      }
    ]
  },
  {
    id: "ducks-in-water",
    title: "Ducks in Water",
    type: "nonfiction",
    level: "B",
    targetSkills: ["nonfiction", "animal words", "short u"],
    coverImage: "/images/child-mode/short-u/duck.png",
    pages: [
      {
        text: "A duck can swim.",
        image: "/images/child-mode/short-u/duck.png",
        words: words("A duck can swim")
      },
      {
        text: "A duck has a bill.",
        image: "/images/child-mode/short-u/duck.png",
        words: words("A duck has a bill")
      },
      {
        text: "A duck can sit in mud.",
        image: "/images/child-mode/short-u/mud.png",
        words: words("A duck can sit in mud")
      },
      {
        text: "A duck can rest in the sun.",
        image: "/images/child-mode/short-u/sun.png",
        words: words("A duck can rest in the sun")
      }
    ]
  },
  {
    id: "fish-live-in-water",
    title: "Fish Live in Water",
    type: "nonfiction",
    level: "B",
    targetSkills: ["nonfiction", "animal words", "short i"],
    coverImage: "/images/child-mode/cvc/fish.png",
    pages: [
      {
        text: "A fish lives in water.",
        image: "/images/child-mode/cvc/fish.png",
        words: words("A fish lives in water")
      },
      {
        text: "A fish can swim fast.",
        image: "/images/child-mode/cvc/fish.png",
        words: words("A fish can swim fast")
      },
      {
        text: "A fish has fins.",
        image: "/images/child-mode/short-i/fin.png",
        words: words("A fish has fins")
      },
      {
        text: "Some fish hide by rocks.",
        image: "/images/child-mode/short-o/rock.png",
        words: words("Some fish hide by rocks")
      }
    ]
  }
];

export function summarizeGuidedReadingRecord(record) {
  const pages = Object.values(record?.pages || {});
  const markEntries = pages.flatMap(page => Object.entries(page.wordMarks || {}));
  const correct = markEntries.filter(([, mark]) => mark === "correct").length;
  const support = markEntries.filter(([, mark]) => mark === "support").length;
  const attempted = correct + support;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const supportWords = [];

  pages.forEach((page, pageIndex) => {
    Object.entries(page.wordMarks || {}).forEach(([wordIndex, mark]) => {
      if (mark === "support") {
        const word = page.words?.[wordIndex] || page.wordTexts?.[wordIndex] || "";
        if (word) supportWords.push(word);
      }
    });
  });

  return {
    attempted,
    correct,
    support,
    accuracy,
    supportWords: [...new Set(supportWords.map(word => String(word).toLowerCase()))],
    pageNotes: pages
      .map((page, index) => ({ page: index + 1, note: page.note || "" }))
      .filter(item => item.note.trim()),
    wholeBookNote: record?.wholeBookNote || "",
    completedAt: record?.completedAt || ""
  };
}

export function summarizeGuidedReadingRecords(records = {}) {
  return Object.entries(records)
    .map(([bookId, record]) => {
      const book = guidedReadingBooks.find(item => item.id === bookId);
      return {
        bookId,
        title: book?.title || record.title || bookId,
        type: book?.type || record.type || "",
        level: book?.level || record.level || "",
        ...summarizeGuidedReadingRecord(record)
      };
    })
    .filter(summary => summary.attempted > 0 || summary.wholeBookNote || summary.pageNotes.length > 0);
}
