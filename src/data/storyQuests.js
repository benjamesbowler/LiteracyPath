const samPamImagePath = page => `/images/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.webp`;
const samPamAudioPath = page => `/audio/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.mp3`;
const samPamWordImagePath = word => `/images/story-quests/sam-pam/words/word-${word}.webp`;

export const storyQuests = [
  {
    id: "story_quest_short_a_sam_pam_01",
    title: "Sam and Pam Go Out",
    skillFocus: "CVC and Short Vowels",
    cycleFocus: "short a CVC + HFW 1-25",
    targetWords: ["Sam", "Pam", "am", "cat", "mat", "bag", "map", "van", "jam"],
    highFrequencyWords: ["I", "am", "you", "go", "to", "the", "see", "can", "we"],
    coverImageUrl: samPamImagePath(1),
    wordCards: ["bag", "cat", "jam", "map", "mat", "van"].map(word => ({
      word,
      imageUrl: samPamWordImagePath(word)
    })),
    startPageId: "page-01",
    pages: [
      {
        id: "page-01",
        text: ["I am Sam.", "I see Pam.", "We can go out."],
        imageUrl: samPamImagePath(1),
        audioUrl: samPamAudioPath(1),
        skillTags: ["short_a", "hfw_1_25", "sam", "pam"],
        choices: [
          { label: "Go to the van", nextPageId: "page-02" },
          { label: "See the cat", nextPageId: "page-03" }
        ]
      },
      {
        id: "page-02",
        text: ["Sam and Pam go to the van.", "Sam has a map."],
        imageUrl: samPamImagePath(2),
        audioUrl: samPamAudioPath(2),
        skillTags: ["short_a", "van", "map"],
        choices: [
          { label: "Get the bag", nextPageId: "page-04" },
          { label: "See the map", nextPageId: "page-05" }
        ]
      },
      {
        id: "page-03",
        text: ["Pam can see a cat.", "The cat is on a mat."],
        imageUrl: samPamImagePath(3),
        audioUrl: samPamAudioPath(3),
        skillTags: ["short_a", "cat", "mat"],
        choices: [
          { label: "Pat the cat", nextPageId: "page-05" },
          { label: "Get the bag", nextPageId: "page-04" }
        ]
      },
      {
        id: "page-04",
        text: ["Sam has the bag.", "Pam can see jam in the bag."],
        imageUrl: samPamImagePath(4),
        audioUrl: samPamAudioPath(4),
        skillTags: ["short_a", "bag", "jam"],
        choices: [
          { label: "Go to the mat", nextPageId: "page-06" },
          { label: "Go to the van", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-05",
        text: ["Pam has the map.", "Sam can see the cat on the map."],
        imageUrl: samPamImagePath(5),
        audioUrl: samPamAudioPath(5),
        skillTags: ["short_a", "map", "cat"],
        choices: [
          { label: "Go with Pam", nextPageId: "page-06" },
          { label: "Go with Sam", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-06",
        text: ["We go to the mat.", "The cat sat by Sam and Pam."],
        imageUrl: samPamImagePath(6),
        audioUrl: samPamAudioPath(6),
        skillTags: ["short_a", "mat", "cat"],
        choices: [
          { label: "See the jam", nextPageId: "page-07" },
          { label: "See the map", nextPageId: "page-08" }
        ]
      },
      {
        id: "page-07",
        text: ["Sam can see jam.", "Pam can see the cat."],
        imageUrl: samPamImagePath(7),
        audioUrl: samPamAudioPath(7),
        skillTags: ["short_a", "jam", "cat"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-09" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-08",
        text: ["Pam can see the map.", "Sam can see the van."],
        imageUrl: samPamImagePath(8),
        audioUrl: samPamAudioPath(8),
        skillTags: ["short_a", "map", "van"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-09" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-09",
        text: ["Sam and Pam go to the van.", "The cat can go too."],
        imageUrl: samPamImagePath(9),
        audioUrl: samPamAudioPath(9),
        skillTags: ["short_a", "van", "cat"],
        choices: [
          { label: "Go home", nextPageId: "page-10" },
          { label: "See the map", nextPageId: "page-10" }
        ]
      },
      {
        id: "page-10",
        text: ["Sam, Pam, and the cat go in the van.", "We can go out again."],
        imageUrl: samPamImagePath(10),
        audioUrl: samPamAudioPath(10),
        skillTags: ["short_a", "sam", "pam", "cat", "van"],
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
