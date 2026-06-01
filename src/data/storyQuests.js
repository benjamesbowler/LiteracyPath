const samAlfImagePath = page => `/images/story-quests/sam-alf/page-${String(page).padStart(2, "0")}.webp`;
const samAlfAudioPath = page => `/audio/story-quests/sam-alf/page-${String(page).padStart(2, "0")}.mp3`;
const samAlfWordImagePath = word => `/images/story-quests/sam-alf/words/word-${word}.webp`;

export const storyQuests = [
  {
    id: "story_quest_short_a_sam_alf_01",
    title: "Sam and Alf Go Out",
    skillFocus: "CVC and Short Vowels",
    cycleFocus: "short a CVC + HFW 1-25",
    targetWords: ["Sam", "Alf", "am", "cat", "mat", "bag", "map", "van", "jam"],
    highFrequencyWords: ["I", "am", "you", "go", "to", "the", "see", "can", "we"],
    coverImageUrl: "/images/story-quests/sam-alf/cover.webp",
    wordCards: ["bag", "cat", "jam", "map", "mat", "van"].map(word => ({
      word,
      imageUrl: samAlfWordImagePath(word)
    })),
    startPageId: "page-01",
    pages: [
      {
        id: "page-01",
        text: ["I am Sam.", "I see Alf.", "We can go out."],
        imageUrl: samAlfImagePath(1),
        audioUrl: samAlfAudioPath(1),
        skillTags: ["short_a", "hfw_1_25", "sam", "alf"],
        choices: [
          { label: "Go to the van", nextPageId: "page-02" },
          { label: "See the cat", nextPageId: "page-03" }
        ]
      },
      {
        id: "page-02",
        text: ["Sam and Alf go to the van.", "Sam has a map."],
        imageUrl: samAlfImagePath(2),
        audioUrl: samAlfAudioPath(2),
        skillTags: ["short_a", "van", "map"],
        choices: [
          { label: "Get the bag", nextPageId: "page-04" },
          { label: "See the map", nextPageId: "page-05" }
        ]
      },
      {
        id: "page-03",
        text: ["Alf can see a cat.", "The cat is on a mat."],
        imageUrl: samAlfImagePath(3),
        audioUrl: samAlfAudioPath(3),
        skillTags: ["short_a", "cat", "mat"],
        choices: [
          { label: "Pat the cat", nextPageId: "page-05" },
          { label: "Get the bag", nextPageId: "page-04" }
        ]
      },
      {
        id: "page-04",
        text: ["Sam has the bag.", "Alf can see jam in the bag."],
        imageUrl: samAlfImagePath(4),
        audioUrl: samAlfAudioPath(4),
        skillTags: ["short_a", "bag", "jam"],
        choices: [
          { label: "Go to the mat", nextPageId: "page-06" },
          { label: "Go to the van", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-05",
        text: ["Alf has the map.", "Sam can see the cat on the map."],
        imageUrl: samAlfImagePath(5),
        audioUrl: samAlfAudioPath(5),
        skillTags: ["short_a", "map", "cat"],
        choices: [
          { label: "Go with Alf", nextPageId: "page-06" },
          { label: "Go with Sam", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-06",
        text: ["We go to the mat.", "The cat sat by Sam and Alf."],
        imageUrl: samAlfImagePath(6),
        audioUrl: samAlfAudioPath(6),
        skillTags: ["short_a", "mat", "cat"],
        choices: [
          { label: "See the jam", nextPageId: "page-07" },
          { label: "See the map", nextPageId: "page-08" }
        ]
      },
      {
        id: "page-07",
        text: ["Sam can see jam.", "Alf can see the cat."],
        imageUrl: samAlfImagePath(7),
        audioUrl: samAlfAudioPath(7),
        skillTags: ["short_a", "jam", "cat"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-09" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-08",
        text: ["Alf can see the map.", "Sam can see the van."],
        imageUrl: samAlfImagePath(8),
        audioUrl: samAlfAudioPath(8),
        skillTags: ["short_a", "map", "van"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-09" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-09",
        text: ["Sam and Alf go to the van.", "The cat can go too."],
        imageUrl: samAlfImagePath(9),
        audioUrl: samAlfAudioPath(9),
        skillTags: ["short_a", "van", "cat"],
        choices: [
          { label: "Go home", nextPageId: "page-10" },
          { label: "See the map", nextPageId: "page-10" }
        ]
      },
      {
        id: "page-10",
        text: ["Sam, Alf, and the cat go in the van.", "We can go out again."],
        imageUrl: samAlfImagePath(10),
        audioUrl: samAlfAudioPath(10),
        skillTags: ["short_a", "sam", "alf", "cat", "van"],
        choices: [
          { label: "Read again", nextPageId: "page-01" },
          { label: "Restart", nextPageId: "page-01" }
        ]
      }
    ]
  }
];

export function getStoryQuestById(id) {
  return storyQuests.find(quest => quest.id === id) || null;
}
