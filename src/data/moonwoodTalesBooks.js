const wordAudio = word => `/guided-reading/audio/words/${String(word).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

const normalizeReadingText = text =>
  String(text || "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

const words = text =>
  normalizeReadingText(text)
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

const withPageWords = book => ({
  ...book,
  pages: book.pages.map(page => ({
    ...page,
    text: normalizeReadingText(page.text),
    words: words(page.text),
    qaStatus: "approved",
    qaNotes: "Released for student Guided Reading.",
    active: true
  }))
});

export const moonwoodTalesBooks = [
  {
    "id": "moonwood-tales-c-01",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Pip and the Bravery Stone",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 1,
    "order": 1,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-01/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-01/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Pip was walking through Moonwood when his foot kicked something small. It was a tiny stone. It glowed with a soft gold light.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "\"What is this?\" said Pip. He picked it up carefully. The glow made his fingers feel warm.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "Burrow appeared from a nearby tunnel. \"That is a Bravery Stone,\" said Burrow. \"Whoever holds it will feel brave.\"",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "Pip looked at the stone. \"But I don't feel brave,\" he said. \"I feel the same as always.\"",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "\"Try something scary,\" said Burrow. So Pip walked to the Tumblerock Cliffs. He found the high ledge and began to climb.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "His legs felt wobbly. The ground was a long way below. But he did not stop. He reached the top.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "\"The stone did that!\" said Pip. He tucked it safely into his pocket. Then he walked toward the Fog Marsh.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "The fog was thick and grey. Something rustled in the reeds nearby. Pip kept walking. He came out the other side.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "That evening, Pip sat by the Crystal Stream. He looked at the stone. The gold glow had gone out.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "\"Did it run out of brave?\" asked Pip.",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "Burrow smiled. \"The stone doesn't do anything,\" he said. \"I wanted to see what you would do. And you were brave.\"",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "Pip looked at the stone for a long time. \"I'll keep it,\" he said. \"To remember.\"",
        "image": "/guided-reading/series/moonwood-tales/book-01/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-01/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-01/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-02",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Fern Grows Too Much",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 2,
    "order": 2,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-02/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-02/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Fern had one small seed. She planted it in the soft ground near the Hollow Oak.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "She said a growing spell. Just a small one. Just to help it along.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "The next morning, the plant had grown so much it filled the Hollow Oak doorway. Leaves were coming out of every window. \"Oh,\" said Fern.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "She tried a slowing spell. The plant kept growing. She tried a stopping spell. The plant kept growing.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "By afternoon, the plant had grown through the roof. It was still growing. Everyone stood back and watched.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "Luna was inside. \"Fern,\" said Luna, through a curtain of leaves, \"do something, please.\"",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Fern sat down and thought. Spells had made it grow. But a growing thing needed something different.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "She did not use a spell. She sang to it, very softly. She sang the song her mother had taught her about seeds.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "The plant stopped growing. The leaves curled gently inward. Then, slowly, it began to shrink.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "By evening, it was a large, beautiful plant beside the Hollow Oak. Not too small. Not too large. Luna came out through the door.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "Luna smiled. \"That is quite nice, actually,\" said Luna. Fern smiled. She was very tired.",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "\"How did you make it stop?\" asked Pip. \"I didn't make it do anything,\" said Fern. \"I asked it nicely.\"",
        "image": "/guided-reading/series/moonwood-tales/book-02/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-02/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-02/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-03",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Stone Crosses the Bridge",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 3,
    "order": 3,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-03/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-03/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "There was a rope bridge over the Crystal Stream. Everyone crossed it without thinking. Everyone except Stone.",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "Stone would not cross the bridge. \"There is a troll under the bridge,\" said Stone. \"I do not want to meet it.\"",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "Pip thought for a moment. \"Stone,\" said Pip carefully. \"You are a troll.\"",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "Stone thought about this for a long time. \"Yes,\" said Stone. \"But I still don't like the bridge.\"",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "One day, Burrow got stuck on the other side of the stream. \"Help!\" called Burrow. \"I cannot find the tunnel. Everything looks the same to me!\"",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "Stone looked at the bridge. Stone looked at the water. Stone looked at Burrow on the other side.",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Stone stepped onto the bridge. It creaked under Stone's weight. Stone kept going.",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "Halfway across, Stone looked straight ahead. The bridge swayed a little. The Crystal Stream sang below. Stone kept walking.",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "Stone reached the other side. Stone reached down and picked up Burrow very carefully. \"Oh, thank you,\" said Burrow. \"I was going in circles.\"",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "They crossed back together. Stone did not look at the water. Stone looked at the far end of the bridge. One step, then another.",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "They reached the other side. Burrow found his glasses. Stone stood up straight.",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "\"You crossed the bridge,\" said Pip. \"Yes,\" said Stone. \"But there might still be a troll under it.\" Stone looked at the bridge. \"I should probably check.\"",
        "image": "/guided-reading/series/moonwood-tales/book-03/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-03/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-03/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-04",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Glimmer Tries and Tries",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 4,
    "order": 4,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-04/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-04/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Every morning, Glimmer practised. Fire breathing was the most important thing a dragon could do. And Glimmer could not do it yet.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "On the first day: a small puff of smoke. Just smoke. No fire at all.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "On the second day: a tiny spark. It landed on a leaf. It glowed for one second. Then it went out.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "\"Maybe you need to try harder,\" said Spark. Spark's own magic crackled around his ears. Glimmer tried harder. More smoke came out. Still no fire.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "On the fifth day, Glimmer breathed in as deeply as possible. A warm puff came out. It smelled of cinnamon. \"That's something,\" said Pip.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "\"That is not fire,\" said Glimmer. \"No,\" agreed Pip. \"But it smells nice.\" Glimmer did not look convinced.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "On the tenth day, Glimmer went to the Crystal Stream alone. Again and again. Smoke. Sparks. Warm cinnamon breath. Still no fire.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "Glimmer sat down. \"I will never breathe fire,\" said Glimmer. \"I have tried every day and it is never fire.\"",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "That evening, a Fog Marsh fox came creeping into Moonwood. It had found Fern's seed collection. The seeds were small and precious. Glimmer saw the fox.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "Glimmer did not think. Glimmer just ran toward the fox. Glimmer breathed in as hard as possible.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "And a jet of brilliant orange fire came out. The fox ran. The seeds were safe.",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "Glimmer stared at their own mouth. \"Oh,\" said Glimmer. The fire had been inside all along. \"I just needed to really mean it.\"",
        "image": "/guided-reading/series/moonwood-tales/book-04/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-04/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-04/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-05",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Wren and the Backwards Spell",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 5,
    "order": 5,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-05/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-05/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Wren wanted to be taller. She had found a spell in her book. A growing spell, she was sure. She read it very carefully.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "She said the spell. There was a flash of bright blue light. Then it was quiet.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "Wren looked at her hands. Her hands were a very long way away. She was not taller. She was one inch tall.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "Oh, said Wren. Her voice came out very small. Everything around her was enormous.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "Wren found her spell book. It was enormous now. She climbed up onto it and looked at the spell. She had read it backwards.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "Right, said Wren. She walked to the beginning of the spell. She read it again. This time, she read it forwards.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Luna flew in through the window. She looked at the desk. She looked more closely. \"Wren?\" said Luna.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "\"Fixing it,\" said tiny Wren. She raised her tiny hands. She said the spell again. Forwards, this time.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "There was another flash of blue. Wren was back to her normal size. She brushed off her robe. She straightened her hat.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "She looked at herself carefully. She was exactly the same height as before. The growing spell had not worked at all.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "\"Did it work?\" asked Pip. \"No,\" said Wren. \"I am exactly the same height.\"",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "Wren picked up her spell book. She turned to the next spell. \"But I am going to find a better one,\" she said. She began to read very, very carefully. Forwards.",
        "image": "/guided-reading/series/moonwood-tales/book-05/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-05/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-05/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-06",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Flint Makes a Map",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 6,
    "order": 6,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-06/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-06/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Flint had decided to map every single path in Moonwood. He had a new roll of parchment and a good quill. He started at the Hollow Oak and walked north.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "He drew as he walked. He mapped the Crystal Stream path. He mapped the way to Tumblerock Cliffs. He drew everything carefully.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "He walked for three days. He did not stop. His map grew longer and longer. It was full of detail.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "On the fourth day, Flint held up his finished map. \"There,\" he said. \"Every path in Moonwood. All of it.\"",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "He looked around to show someone. He was alone. The forest around him looked very different to the forest on his map.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "He checked his map. According to the map, he was standing in the Whispering Meadow. He was not in the Whispering Meadow. The paths had moved.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Flint sat down on a mossy rock. He looked at the map for a long time. It was very beautiful. It was also completely wrong.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "Flint took out a new piece of parchment. \"I'll make another one,\" he said. He was not upset about this. He had always known the paths would move.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "By the time Flint found his way home, he was, as usual, slightly lost. The new map was already three pages long. He had taken a very interesting route.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "\"How was the mapping?\" asked Pip. \"Perfect,\" said Flint. \"I know exactly where everything was.\"",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "Flint pinned the first map up inside the Hollow Oak. It was very beautiful. Everyone agreed it was the best wrong map they had ever seen.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "Then Flint started on the next map. He was already very happy. Outside, the paths rearranged themselves quietly. They always did.",
        "image": "/guided-reading/series/moonwood-tales/book-06/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-06/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-06/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-07",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Dewdrop and the Lying Fish",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 7,
    "order": 7,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-07/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-07/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 12,
    "availableStoryPageCount": 12,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dewdrop knew every fish in the Crystal Stream. She talked to them every morning. They told her things: where the water was cold, where the best pebbles were.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "One morning, a new fish appeared. It was silver with a bright blue stripe. Dewdrop had never seen a fish like it.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "Hello, said Dewdrop. I am the oldest fish in Moonwood, said the fish. Dewdrop tilted her head. The fish was not very large.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "I have been here longer than the Hollow Oak, said the fish. Dewdrop looked carefully. The fish was, if anything, quite new-looking. I know all the secrets of the Deep Dark, the fish added.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "Dewdrop was not sure any of this was true. She knew the Deep Dark secrets. They were kept by a very old badger, not a fish.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "Can fish lie? Dewdrop asked Burrow. Some of them can, said Burrow. Which fish? The new one with the blue stripe, said Dewdrop. Burrow had not seen a new fish.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Dewdrop went back to the Crystal Stream. Why do you say things that are not true? she asked. She said it kindly. She just wanted to know.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "The fish was quiet for a while. It swam a small, slow circle. Then it came back. Because I am new here, said the fish. And I wanted to sound interesting.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "You are interesting, said Dewdrop. You are the only fish in this stream with a blue stripe. The fish looked at its own stripe. That is true, it said.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "Is being the only blue-stripe fish enough? asked the fish. Yes, said Dewdrop. It is very enough.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "After that, the fish told Dewdrop true things. Small things, mostly. Where the water was coldest. Where the most unusual pebbles were. These things were true.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "What is the fish called? asked Pip. I... said Dewdrop. She stopped. She had forgotten to ask. She turned back toward the water.",
        "image": "/guided-reading/series/moonwood-tales/book-07/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-07/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-07/audio/page-012.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-08",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Burrow Finds a Door",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 8,
    "order": 8,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-08/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-08/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 13,
    "availableStoryPageCount": 13,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Burrow was digging a new tunnel. He dug down, and he dug sideways, and he dug carefully around the roots. Then his spade hit something hard and wooden.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "Burrow set down his spade. He felt around it very carefully. It was a door. A small, very old wooden door, deep underground.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "He polished his glasses and looked more closely. On the door was a small carving. A tree with roots going in every direction. It was very old.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "I have found something, Burrow told everyone. They gathered at the Hollow Oak. A door, said Burrow, underground. Very old. I don't know what is inside.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "They all came to look. The tunnel was small. Stone had to go sideways. Luna had to be helped around three corners.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "They gathered around the door. Luna looked at it for a long time. I know this door, she said slowly. I think. A very long time ago.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "What is inside? said Pip. Luna was quiet. Good things, I think, she said finally. I cannot quite remember what kind.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "Burrow opened the door. A warm golden light came from inside. Everyone leaned forward.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "Inside was a small round room. The walls were covered in tiny glowing drawings. Trees and streams. Creatures and old paths. Every living thing that had ever been in Moonwood.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "They walked along the walls slowly. There were drawings of things no one had seen in hundreds of years. What is this place? asked Fern.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "The memory room, said Luna. That is what it was called. She touched the wall very gently. I remember now.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "They stayed for a long time. No one wanted to leave. The room was very quiet and very warm.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-012.mp3",
        "words": []
      },
      {
        "pageNumber": 13,
        "text": "Burrow found a blank patch of wall. He picked up a small flat stone. Very carefully, he drew the Hollow Oak. Now we are in it too, he said.",
        "image": "/guided-reading/series/moonwood-tales/book-08/page-013.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-08/audio/page-013.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-08/audio/page-013.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-09",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "Spark's Very Big Sneeze",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 9,
    "order": 9,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-09/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-09/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 14,
    "availableStoryPageCount": 14,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Spark had a cold. Usually a cold was nothing much. But Spark's magic crackled around him all the time. A cold, for Spark, was a very big problem.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "He sneezed at breakfast. The porridge turned into a bird. The bird flew out of the window. Spark stared at his empty bowl.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "Don't sneeze again, said Wren. I will try not to, said Spark. His nose twitched.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "He sneezed in the Whispering Meadow. Every flower changed colour at the same moment. The meadow turned entirely blue. It was very quiet.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "Sorry, said Spark. The flowers looked at him. He looked at them. His nose twitched again.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "Spark tried to hold the sneeze in. His eyes went watery. His magic began to build and build. The sparkles around him grew very bright.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Whatever you do, said Fern, looking at the Crystal Stream, do NOT sneeze near the water.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "Spark sneezed near the Crystal Stream.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "Every fish in the stream turned purple. The water sang in a different key. One fish turned into a frog for a moment, and then turned back.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "Sorry, said Spark. This was his third sorry. He meant all three of them very much.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "I think, said Dewdrop slowly, we should find you a cold remedy before anything else changes.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "Wren found a cold remedy in her spell book. She read it very, very carefully. Forwards? said Spark. Forwards, said Wren.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-012.mp3",
        "words": []
      },
      {
        "pageNumber": 13,
        "text": "The remedy worked. Spark's cold was gone. The flowers slowly turned back to their usual colours. The fish returned to normal.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-013.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-013.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-013.mp3",
        "words": []
      },
      {
        "pageNumber": 14,
        "text": "Spark breathed in carefully. I think, he said, I might need to sneeze again. Everyone took a large step back.",
        "image": "/guided-reading/series/moonwood-tales/book-09/page-014.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-09/audio/page-014.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-09/audio/page-014.mp3",
        "words": []
      }
    ]
  },
  {
    "id": "moonwood-tales-c-10",
    "seriesId": "moonwood-tales",
    "seriesTitle": "Moonwood Tales",
    "seriesName": "Moonwood Tales",
    "title": "What Luna Forgot",
    "type": "fiction",
    "category": "fiction",
    "level": "C",
    "guidedReadingLevel": "C",
    "ageRange": "5-6",
    "bookNumber": 10,
    "order": 10,
    "author": "Lina Moss",
    "illustrator": "Kimi",
    "status": "approved",
    "qaStatus": "approved",
    "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C source pack.",
    "active": true,
    "visible": true,
    "teacherPreviewOnly": false,
    "source": "moonwood_tales_level_c_pack_2026_05_28",
    "coverImage": "/guided-reading/series/moonwood-tales/book-10/cover.webp",
    "fullBookAudio": "/guided-reading/series/moonwood-tales/book-10/audio/full-book.mp3",
    "targetSkills": [
      "level-c",
      "fiction",
      "moonwood-tales",
      "longer-story-pages"
    ],
    "sightWords": [
      "the",
      "said",
      "was",
      "you",
      "I",
      "to",
      "and",
      "it",
      "they",
      "there"
    ],
    "targetPatterns": [
      "level-c",
      "fiction",
      "dialogue",
      "comprehension",
      "story-sequence"
    ],
    "theme": "Moonwood magic and friendship",
    "characterReference": {
      "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
      "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
      "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
      "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
      "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
      "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
      "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
      "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
      "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
      "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
    },
    "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
    "expectedStoryPageCount": 14,
    "availableStoryPageCount": 14,
    "missingStoryPages": [],
    "pages": [
      {
        "pageNumber": 1,
        "text": "Luna woke up knowing she had forgotten something important. She sat on her branch. She thought very hard. She could not remember what it was.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-001.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-001.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-001.mp3",
        "words": []
      },
      {
        "pageNumber": 2,
        "text": "This was the problem with forgetting things. You couldn't always remember what you had forgotten. Luna knew it was important. She knew it was today.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-002.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-002.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-002.mp3",
        "words": []
      },
      {
        "pageNumber": 3,
        "text": "What do you remember about it? asked Pip. I remember it was today, said Luna. And it was important. And... she paused. I think it was outside.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-003.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-003.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-003.mp3",
        "words": []
      },
      {
        "pageNumber": 4,
        "text": "Was it a meeting? asked Fern. I don't think so, said Luna. Was it something to collect? asked Burrow. Possibly, said Luna. I cannot quite say.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-004.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-004.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-004.mp3",
        "words": []
      },
      {
        "pageNumber": 5,
        "text": "Everyone helped. They checked the Hollow Oak from top to bottom. They walked the paths. They looked in the Whispering Meadow. Nothing triggered the memory.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-005.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-005.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-005.mp3",
        "words": []
      },
      {
        "pageNumber": 6,
        "text": "Was it something to do with the Crystal Stream? asked Dewdrop. Luna stopped walking. She looked at the stream for a moment. Wait, said Luna.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-006.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-006.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-006.mp3",
        "words": []
      },
      {
        "pageNumber": 7,
        "text": "Luna flew to the Crystal Stream. She landed on a stepping stone. She looked down into the water.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-007.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-007.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-007.mp3",
        "words": []
      },
      {
        "pageNumber": 8,
        "text": "Under the water, among the pebbles, there was a small silver box. Luna had put it there herself. A very long time ago.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-008.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-008.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-008.mp3",
        "words": []
      },
      {
        "pageNumber": 9,
        "text": "Yes, said Luna. I remember now. She picked it up. I put it there to keep it safe. For today.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-009.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-009.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-009.mp3",
        "words": []
      },
      {
        "pageNumber": 10,
        "text": "She opened the box. Inside were twelve small seeds. Each one glowed with a soft gold light. Oh, said Fern, very quietly.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-010.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-010.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-010.mp3",
        "words": []
      },
      {
        "pageNumber": 11,
        "text": "Moonwood seeds, said Luna. From the first trees. For the day the old trees grow tired and need new ones beside them.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-011.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-011.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-011.mp3",
        "words": []
      },
      {
        "pageNumber": 12,
        "text": "Luna gave one to each creature. One for each of them. The seeds glowed gently in their hands. Plant them this afternoon, said Luna.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-012.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-012.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-012.mp3",
        "words": []
      },
      {
        "pageNumber": 13,
        "text": "They planted the seeds in a ring around the Hollow Oak. One from each of them. In the golden afternoon light.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-013.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-013.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-013.mp3",
        "words": []
      },
      {
        "pageNumber": 14,
        "text": "What would have happened if you hadn't remembered? asked Wren. I did remember, said Luna. With help. She looked at all of them. That is the point.",
        "image": "/guided-reading/series/moonwood-tales/book-10/page-014.webp",
        "audio": "/guided-reading/series/moonwood-tales/book-10/audio/page-014.mp3",
        "pageAudio": "/guided-reading/series/moonwood-tales/book-10/audio/page-014.mp3",
        "words": []
      }
    ]
  },
  {
      "id": "moonwood-tales-c-11",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Pip and Stone and the Loud Thing",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 11,
      "order": 11,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-11/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-11/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-11/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Pip and Stone were sitting outside the Hollow Oak.\nThen a noise came from the Fog Marsh.\nIt was very, very loud.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-001.mp3",
              "pageAudioText": "Pip and Stone were sitting outside the Hollow Oak.\nThen a noise came from the Fog Marsh.\nIt was very, very loud.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "\"I want to find out what it is,\" said Pip.\n\"I do not,\" said Stone.\n\"It is very loud.\"",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-002.mp3",
              "pageAudioText": "\"I want to find out what it is,\" said Pip.\n\"I do not,\" said Stone.\n\"It is very loud.\"",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Pip walked toward the Fog Marsh.\nHe looked back.\nStone had not moved.\nStone had moved one foot.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-003.mp3",
              "pageAudioText": "Pip walked toward the Fog Marsh.\nHe looked back.\nStone had not moved.\nStone had moved one foot.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "At the edge of the marsh, the noise came again.\nIt was even louder.\nPip's hair stood on end.\nStone appeared behind him.\n\"I came anyway,\" said Stone.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-004.mp3",
              "pageAudioText": "At the edge of the marsh, the noise came again.\nIt was even louder.\nPip's hair stood on end.\nStone appeared behind him.\n\"I came anyway,\" said Stone.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "They stood at the edge together.\nThe fog was thick and grey-green.\nThe noise bounced off the twisted trees.\n\"Together,\" said Stone.\nPip nodded.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-005.mp3",
              "pageAudioText": "They stood at the edge together.\nThe fog was thick and grey-green.\nThe noise bounced off the twisted trees.\n\"Together,\" said Stone.\nPip nodded.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Inside the marsh, the noise was everywhere.\nThe reeds shook.\nThe water rippled.\nThey crept closer.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-006.mp3",
              "pageAudioText": "Inside the marsh, the noise was everywhere.\nThe reeds shook.\nThe water rippled.\nThey crept closer.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "On a mossy stone in the marsh sat a toadling.\nIt was very small.\nIts mouth was very wide open.\nAll the noise was coming from it.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-007.mp3",
              "pageAudioText": "On a mossy stone in the marsh sat a toadling.\nIt was very small.\nIts mouth was very wide open.\nAll the noise was coming from it.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "The toadling stopped when it saw them.\nEverything was suddenly very quiet.\n\"Oh,\" said Pip.\n\"Oh,\" said Stone.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-008.mp3",
              "pageAudioText": "The toadling stopped when it saw them.\nEverything was suddenly very quiet.\n\"Oh,\" said Pip.\n\"Oh,\" said Stone.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "\"Why were you shouting?\" asked Pip.\nThe toadling blinked.\n\"I am lost,\" it said.\n\"I was calling for my family.\"\nIts voice was very small now.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-009.mp3",
              "pageAudioText": "\"Why were you shouting?\" asked Pip.\nThe toadling blinked.\n\"I am lost,\" it said.\n\"I was calling for my family.\"\nIts voice was very small now.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Stone knelt down carefully.\n\"We will help,\" said Stone.\nThe toadling looked at Stone.\n\"You are very large,\" said the toadling.\n\"Yes,\" said Stone. \"But I am gentle.\"",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-010.mp3",
              "pageAudioText": "Stone knelt down carefully.\n\"We will help,\" said Stone.\nThe toadling looked at Stone.\n\"You are very large,\" said the toadling.\n\"Yes,\" said Stone. \"But I am gentle.\"",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "Stone stood up and called out across the marsh.\nIt was the loudest sound Pip had ever heard.\nLouder than the toadling.\nMuch louder.\nSomething answered from the far side of the marsh.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-011.mp3",
              "pageAudioText": "Stone stood up and called out across the marsh.\nIt was the loudest sound Pip had ever heard.\nLouder than the toadling.\nMuch louder.\nSomething answered from the far side of the marsh.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "Back at the Hollow Oak, everyone asked:\n\"What was the loud thing?\"\n\"Very small,\" said Pip.\n\"Very loud,\" said Stone.\nThey both smiled.",
              "image": "/guided-reading/series/moonwood-tales/book-11/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-11/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-11/audio/page-012.mp3",
              "pageAudioText": "Back at the Hollow Oak, everyone asked:\n\"What was the loud thing?\"\n\"Very small,\" said Pip.\n\"Very loud,\" said Stone.\nThey both smiled.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-12",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Fern and Dewdrop Save the Stream",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 12,
      "order": 12,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-12/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-12/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-12/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "The Crystal Stream was not singing.\nFern heard it first.\nOr rather — she heard nothing.\nShe went to find Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-001.mp3",
              "pageAudioText": "The Crystal Stream was not singing.\nFern heard it first.\nOr rather — she heard nothing.\nShe went to find Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "\"It flows,\" said Fern.\n\"But it does not sing,\" said Dewdrop.\n\"Something is wrong at the source.\"",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-002.mp3",
              "pageAudioText": "\"It flows,\" said Fern.\n\"But it does not sing,\" said Dewdrop.\n\"Something is wrong at the source.\"",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "\"The song comes from the source,\" said Dewdrop.\n\"We must follow the stream up.\"\nFern looked at the deep forest ahead.\n\"Then we go,\" said Fern.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-003.mp3",
              "pageAudioText": "\"The song comes from the source,\" said Dewdrop.\n\"We must follow the stream up.\"\nFern looked at the deep forest ahead.\n\"Then we go,\" said Fern.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "They followed the stream upstream.\nThe forest grew older.\nThe roots grew bigger.\nThe stream grew quieter.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-004.mp3",
              "pageAudioText": "They followed the stream upstream.\nThe forest grew older.\nThe roots grew bigger.\nThe stream grew quieter.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "At the source, they found it.\nA great boulder had fallen.\nIt lay across the singing stones.\nThe stones could not sing.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-005.mp3",
              "pageAudioText": "At the source, they found it.\nA great boulder had fallen.\nIt lay across the singing stones.\nThe stones could not sing.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Dewdrop tried to push it with water.\nShe pushed as hard as she could.\nThe boulder did not move.\n\"I am not strong enough,\" said Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-006.mp3",
              "pageAudioText": "Dewdrop tried to push it with water.\nShe pushed as hard as she could.\nThe boulder did not move.\n\"I am not strong enough,\" said Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "Fern tried to push with her hands.\nThe boulder did not move.\nFern stepped back and thought.\n\"We need each other,\" said Fern.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-007.mp3",
              "pageAudioText": "Fern tried to push with her hands.\nThe boulder did not move.\nFern stepped back and thought.\n\"We need each other,\" said Fern.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Fern grew a strong vine around the boulder.\nDewdrop sent water under it to loosen the mud.\n\"Ready?\" said Fern.\n\"Ready,\" said Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-008.mp3",
              "pageAudioText": "Fern grew a strong vine around the boulder.\nDewdrop sent water under it to loosen the mud.\n\"Ready?\" said Fern.\n\"Ready,\" said Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "They pushed and pulled together.\nThe boulder shifted.\nThe mud let go.\nThe boulder rolled aside.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-009.mp3",
              "pageAudioText": "They pushed and pulled together.\nThe boulder shifted.\nThe mud let go.\nThe boulder rolled aside.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "The water rushed over the singing stones.\nAnd the Crystal Stream began to sing.\nFirst very quietly.\nThen louder.\nThen loud enough to hear all the way to the Hollow Oak.",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-010.mp3",
              "pageAudioText": "The water rushed over the singing stones.\nAnd the Crystal Stream began to sing.\nFirst very quietly.\nThen louder.\nThen loud enough to hear all the way to the Hollow Oak.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "They sat on the bank and listened.\nThe stream sang around them.\n\"We did it,\" said Fern.\nDewdrop smiled.\n\"It sang itself. We just moved the stone.\"",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-011.mp3",
              "pageAudioText": "They sat on the bank and listened.\nThe stream sang around them.\n\"We did it,\" said Fern.\nDewdrop smiled.\n\"It sang itself. We just moved the stone.\"",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "At the Hollow Oak, everyone heard it.\n\"The stream is singing again!\" said Pip.\n\"We just moved a stone,\" said Fern.\n\"And asked the water nicely,\" said Dewdrop.\n\"It did the rest.\"",
              "image": "/guided-reading/series/moonwood-tales/book-12/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-12/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-12/audio/page-012.mp3",
              "pageAudioText": "At the Hollow Oak, everyone heard it.\n\"The stream is singing again!\" said Pip.\n\"We just moved a stone,\" said Fern.\n\"And asked the water nicely,\" said Dewdrop.\n\"It did the rest.\"",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-13",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Glimmer and Spark Make a Deal",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 13,
      "order": 13,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-13/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-13/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-13/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Glimmer and Spark made a deal.\nSpark would teach Glimmer to breathe fire properly.\nGlimmer would teach Spark to fly.\nThey shook on it.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-001.mp3",
              "pageAudioText": "Glimmer and Spark made a deal.\nSpark would teach Glimmer to breathe fire properly.\nGlimmer would teach Spark to fly.\nThey shook on it.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "On the first day, Spark explained fire.\nHe drew many diagrams.\nThe diagrams were very complicated.\nGlimmer did not understand any of them.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-002.mp3",
              "pageAudioText": "On the first day, Spark explained fire.\nHe drew many diagrams.\nThe diagrams were very complicated.\nGlimmer did not understand any of them.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Glimmer tried.\nSmoke came out.\nJust smoke.\n\"Interesting,\" said Spark, and wrote things down.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-003.mp3",
              "pageAudioText": "Glimmer tried.\nSmoke came out.\nJust smoke.\n\"Interesting,\" said Spark, and wrote things down.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "That afternoon, it was Glimmer's turn to teach.\nGlimmer spread both wings.\nGlimmer hovered for a moment.\nThen landed.\n\"Like that,\" said Glimmer.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-004.mp3",
              "pageAudioText": "That afternoon, it was Glimmer's turn to teach.\nGlimmer spread both wings.\nGlimmer hovered for a moment.\nThen landed.\n\"Like that,\" said Glimmer.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Spark tried.\nSparkles shot everywhere.\nHis hat fell off.\nHis feet stayed on the ground.\n\"I think I need more practice,\" said Spark.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-005.mp3",
              "pageAudioText": "Spark tried.\nSparkles shot everywhere.\nHis hat fell off.\nHis feet stayed on the ground.\n\"I think I need more practice,\" said Spark.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "On the third day, the diagrams had multiplied.\nThere were charts about heat.\nCharts about breathing.\nCharts about dragon anatomy.\nGlimmer stared at them all.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-006.mp3",
              "pageAudioText": "On the third day, the diagrams had multiplied.\nThere were charts about heat.\nCharts about breathing.\nCharts about dragon anatomy.\nGlimmer stared at them all.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "\"Spark,\" said Glimmer.\n\"You are trying too hard.\"\n\"Fire is not thinking.\"\n\"It is feeling.\"\nSpark looked at Glimmer for a long time.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-007.mp3",
              "pageAudioText": "\"Spark,\" said Glimmer.\n\"You are trying too hard.\"\n\"Fire is not thinking.\"\n\"It is feeling.\"\nSpark looked at Glimmer for a long time.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Spark put down his wand.\nHe put down his notes.\nHe stood very still.\nHe stopped thinking.\nA small real flame came.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-008.mp3",
              "pageAudioText": "Spark put down his wand.\nHe put down his notes.\nHe stood very still.\nHe stopped thinking.\nA small real flame came.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "\"What does flying feel like?\" asked Spark.\nGlimmer thought.\n\"Like falling upward,\" said Glimmer.\nSpark nodded slowly.\n\"I think I understand.\"",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-009.mp3",
              "pageAudioText": "\"What does flying feel like?\" asked Spark.\nGlimmer thought.\n\"Like falling upward,\" said Glimmer.\nSpark nodded slowly.\n\"I think I understand.\"",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Glimmer ran.\nGlimmer spread both wings.\nGlimmer jumped.\nGlimmer glided five whole steps.\n\"That's more,\" said Spark.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-010.mp3",
              "pageAudioText": "Glimmer ran.\nGlimmer spread both wings.\nGlimmer jumped.\nGlimmer glided five whole steps.\n\"That's more,\" said Spark.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "At the end of the day, they sat down.\nSpark could not fly.\nGlimmer had not breathed fire properly yet.\nBut something was different.\nNeither of them could say exactly what.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-011.mp3",
              "pageAudioText": "At the end of the day, they sat down.\nSpark could not fly.\nGlimmer had not breathed fire properly yet.\nBut something was different.\nNeither of them could say exactly what.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "\"Did we succeed?\" asked Spark.\n\"I don't know,\" said Glimmer.\n\"Let's try again tomorrow.\"\n\"Yes,\" said Spark.\nThey both smiled.",
              "image": "/guided-reading/series/moonwood-tales/book-13/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-13/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-13/audio/page-012.mp3",
              "pageAudioText": "\"Did we succeed?\" asked Spark.\n\"I don't know,\" said Glimmer.\n\"Let's try again tomorrow.\"\n\"Yes,\" said Spark.\nThey both smiled.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-14",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Wren and Flint Get Lost",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 14,
      "order": 14,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-14/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-14/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-14/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Wren and Flint were going to the Whispering Meadow.\nFlint had a map.\nWren had a direction spell.\n\"We will be perfectly fine,\" said Flint.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-001.mp3",
              "pageAudioText": "Wren and Flint were going to the Whispering Meadow.\nFlint had a map.\nWren had a direction spell.\n\"We will be perfectly fine,\" said Flint.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "Flint's map said go left.\nWren's spell said go right.\n\"Straight ahead,\" they agreed.\nThis turned out to be wrong.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-002.mp3",
              "pageAudioText": "Flint's map said go left.\nWren's spell said go right.\n\"Straight ahead,\" they agreed.\nThis turned out to be wrong.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "An hour later, nothing looked right.\nThe trees were wrong.\nThe paths had gone.\n\"Where are we?\" asked Wren.\nFlint checked his map.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-003.mp3",
              "pageAudioText": "An hour later, nothing looked right.\nThe trees were wrong.\nThe paths had gone.\n\"Where are we?\" asked Wren.\nFlint checked his map.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "\"We are here,\" said Flint.\nHe pointed at the map.\nWren looked around.\nGrey fog was appearing between the trees.\n\"That is the Fog Marsh,\" said Wren.\n\"We are not near the meadow.\"",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-004.mp3",
              "pageAudioText": "\"We are here,\" said Flint.\nHe pointed at the map.\nWren looked around.\nGrey fog was appearing between the trees.\n\"That is the Fog Marsh,\" said Wren.\n\"We are not near the meadow.\"",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Wren tried her direction spell.\nThe arrow spun three times.\nThen it pointed at Flint.\n\"That's you,\" said Wren.\n\"I know I'm here,\" said Flint.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-005.mp3",
              "pageAudioText": "Wren tried her direction spell.\nThe arrow spun three times.\nThen it pointed at Flint.\n\"That's you,\" said Wren.\n\"I know I'm here,\" said Flint.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Flint opened his satchel.\nSeven maps fell out.\nOne was of the coast.\nOne was upside down.\nNone of them were quite right.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-006.mp3",
              "pageAudioText": "Flint opened his satchel.\nSeven maps fell out.\nOne was of the coast.\nOne was upside down.\nNone of them were quite right.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "They sat down under a large mushroom.\nThey were tired.\nThey were lost.\nThe mushroom glowed cheerfully.\nWren looked at it.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-007.mp3",
              "pageAudioText": "They sat down under a large mushroom.\nThey were tired.\nThey were lost.\nThe mushroom glowed cheerfully.\nWren looked at it.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "\"I wonder,\" said Wren.\nShe closed her spell book.\nShe spoke to the mushroom.\nVery quietly.\nShe asked it the way.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-008.mp3",
              "pageAudioText": "\"I wonder,\" said Wren.\nShe closed her spell book.\nShe spoke to the mushroom.\nVery quietly.\nShe asked it the way.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "The mushroom's glow changed.\nIt pulsed once — pointing.\nAnother mushroom far away pulsed the same way.\nAnd another.\nA trail of glowing mushrooms lit up through the trees.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-009.mp3",
              "pageAudioText": "The mushroom's glow changed.\nIt pulsed once — pointing.\nAnother mushroom far away pulsed the same way.\nAnd another.\nA trail of glowing mushrooms lit up through the trees.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Wren and Flint followed the mushroom trail.\nThe forest opened up.\nThe golden light of the Whispering Meadow was ahead.\n\"Oh,\" said Flint.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-010.mp3",
              "pageAudioText": "Wren and Flint followed the mushroom trail.\nThe forest opened up.\nThe golden light of the Whispering Meadow was ahead.\n\"Oh,\" said Flint.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "They arrived at the Whispering Meadow.\nIt was exactly where they had been going.\nFlint wrote something on his map.\n\"Mushroom trail,\" he said.\n\"I should have had that already.\"",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-011.mp3",
              "pageAudioText": "They arrived at the Whispering Meadow.\nIt was exactly where they had been going.\nFlint wrote something on his map.\n\"Mushroom trail,\" he said.\n\"I should have had that already.\"",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "\"Why didn't we try that first?\" asked Flint.\n\"I don't know,\" said Wren.\nShe looked back at the mushroom trail.\n\"They seemed happy about it though.\"\nThe last mushroom blinked once and went out.",
              "image": "/guided-reading/series/moonwood-tales/book-14/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-14/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-14/audio/page-012.mp3",
              "pageAudioText": "\"Why didn't we try that first?\" asked Flint.\n\"I don't know,\" said Wren.\nShe looked back at the mushroom trail.\n\"They seemed happy about it though.\"\nThe last mushroom blinked once and went out.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-15",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Burrow and Luna and the Old Secret",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 15,
      "order": 15,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-15/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-15/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-15/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Burrow was digging a new tunnel.\nHe dug every morning.\nHe liked the quiet of it.\nHe liked the dark of it.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-001.mp3",
              "pageAudioText": "Burrow was digging a new tunnel.\nHe dug every morning.\nHe liked the quiet of it.\nHe liked the dark of it.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "Then his tunnel fell open.\nHe tumbled into a room.\nIt was large.\nIt was old.\nIt was not a tunnel.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-002.mp3",
              "pageAudioText": "Then his tunnel fell open.\nHe tumbled into a room.\nIt was large.\nIt was old.\nIt was not a tunnel.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "The room had carvings on every wall.\nIt had small glowing stones in the ceiling.\nIt smelled of old wood and old magic.\nBurrow had never seen it before.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-003.mp3",
              "pageAudioText": "The room had carvings on every wall.\nIt had small glowing stones in the ceiling.\nIt smelled of old wood and old magic.\nBurrow had never seen it before.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Burrow went up to find Luna.\n\"Come with me,\" he said.\n\"Bring a light.\"\nLuna said nothing.\nShe came.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-004.mp3",
              "pageAudioText": "Burrow went up to find Luna.\n\"Come with me,\" he said.\n\"Bring a light.\"\nLuna said nothing.\nShe came.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Luna was very large for a tunnel.\nShe came anyway.\nShe did not say anything about this.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-005.mp3",
              "pageAudioText": "Luna was very large for a tunnel.\nShe came anyway.\nShe did not say anything about this.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Luna stood in the doorway.\nShe was very still.\nHer eyes went wide.\nThen soft.\n\"Oh,\" said Luna.\nVery quietly.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-006.mp3",
              "pageAudioText": "Luna stood in the doorway.\nShe was very still.\nHer eyes went wide.\nThen soft.\n\"Oh,\" said Luna.\nVery quietly.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "Luna walked slowly around the room.\nShe touched the carvings.\nThey lit up where she touched.\nBlue and gold.\nShe had been here before.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-007.mp3",
              "pageAudioText": "Luna walked slowly around the room.\nShe touched the carvings.\nThey lit up where she touched.\nBlue and gold.\nShe had been here before.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "\"Have you been here before?\" asked Burrow.\n\"Yes,\" said Luna.\nShe looked around the room.\n\"A very long time ago.\"\n\"What is it?\" asked Burrow.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-008.mp3",
              "pageAudioText": "\"Have you been here before?\" asked Burrow.\n\"Yes,\" said Luna.\nShe looked around the room.\n\"A very long time ago.\"\n\"What is it?\" asked Burrow.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "\"This is the Memory Room,\" said Luna.\n\"This is where Moonwood keeps its oldest stories.\"\nBurrow looked at the carvings.\n\"All of them?\" he asked.\n\"All of them,\" said Luna.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-009.mp3",
              "pageAudioText": "\"This is the Memory Room,\" said Luna.\n\"This is where Moonwood keeps its oldest stories.\"\nBurrow looked at the carvings.\n\"All of them?\" he asked.\n\"All of them,\" said Luna.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Luna settled on a ledge.\nShe folded her wings.\nShe looked at the carvings for a moment.\n\"The first story of Moonwood,\" she began,\n\"is this.\"",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-010.mp3",
              "pageAudioText": "Luna settled on a ledge.\nShe folded her wings.\nShe looked at the carvings for a moment.\n\"The first story of Moonwood,\" she began,\n\"is this.\"",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "Burrow sat very still and listened.\nThe room grew warmer.\nThe carvings lit up one by one.\nLuna's voice was quiet and certain.\nShe had always known these stories.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-011.mp3",
              "pageAudioText": "Burrow sat very still and listened.\nThe room grew warmer.\nThe carvings lit up one by one.\nLuna's voice was quiet and certain.\nShe had always known these stories.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "It was very late when Burrow noticed.\n\"Will you tell me the rest?\" he asked.\n\"Yes,\" said Luna.\n\"There is quite a lot.\"\nThey both settled in.",
              "image": "/guided-reading/series/moonwood-tales/book-15/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-15/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-15/audio/page-012.mp3",
              "pageAudioText": "It was very late when Burrow noticed.\n\"Will you tell me the rest?\" he asked.\n\"Yes,\" said Luna.\n\"There is quite a lot.\"\nThey both settled in.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-16",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Pip and Glimmer and the Night Watch",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 16,
      "order": 16,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-16/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-16/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-16/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "One morning, things had moved in the night.\nPip's boots were not where he had left them.\nA bench was tipped over.\nSomeone had been in the clearing.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-001.mp3",
              "pageAudioText": "One morning, things had moved in the night.\nPip's boots were not where he had left them.\nA bench was tipped over.\nSomeone had been in the clearing.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "The next night, it happened again.\nMore things had moved.\n\"Was it you?\" asked Stone.\n\"No,\" said Pip.\n\"Was it you?\" asked Pip.\n\"No,\" said everyone.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-002.mp3",
              "pageAudioText": "The next night, it happened again.\nMore things had moved.\n\"Was it you?\" asked Stone.\n\"No,\" said Pip.\n\"Was it you?\" asked Pip.\n\"No,\" said everyone.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "\"I am going to find out,\" said Pip.\nHe told Glimmer his plan.\nThey would stay awake.\nThey would watch the clearing.\nGlimmer said yes immediately.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-003.mp3",
              "pageAudioText": "\"I am going to find out,\" said Pip.\nHe told Glimmer his plan.\nThey would stay awake.\nThey would watch the clearing.\nGlimmer said yes immediately.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Night fell.\nMoonwood glowed softly.\nPip and Glimmer hid behind the big mushroom.\nThey watched.\nNothing happened.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-004.mp3",
              "pageAudioText": "Night fell.\nMoonwood glowed softly.\nPip and Glimmer hid behind the big mushroom.\nThey watched.\nNothing happened.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "It was very late.\nThe clearing was empty.\nGlimmer's eyes kept closing.\n\"Don't fall asleep,\" whispered Pip.\n\"I am not asleep,\" said Glimmer.\nGlimmer was almost asleep.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-005.mp3",
              "pageAudioText": "It was very late.\nThe clearing was empty.\nGlimmer's eyes kept closing.\n\"Don't fall asleep,\" whispered Pip.\n\"I am not asleep,\" said Glimmer.\nGlimmer was almost asleep.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Then — a sound.\nA shuffling.\nA round shape moving through the clearing.\nPip and Glimmer looked at each other.\nThey crept closer.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-006.mp3",
              "pageAudioText": "Then — a sound.\nA shuffling.\nA round shape moving through the clearing.\nPip and Glimmer looked at each other.\nThey crept closer.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "It was Burrow.\nHis eyes were closed.\nHe was fast asleep.\nHe was walking.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-007.mp3",
              "pageAudioText": "It was Burrow.\nHis eyes were closed.\nHe was fast asleep.\nHe was walking.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Burrow bumped the bench.\nIt fell over.\nBurrow kept walking.\nHe found Pip's door.\nHe moved the boots with his paws.\nHe did not wake up.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-008.mp3",
              "pageAudioText": "Burrow bumped the bench.\nIt fell over.\nBurrow kept walking.\nHe found Pip's door.\nHe moved the boots with his paws.\nHe did not wake up.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "He found the acorn biscuits.\nHe put some in his pocket.\nHe was still asleep.\nGlimmer covered their mouth.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-009.mp3",
              "pageAudioText": "He found the acorn biscuits.\nHe put some in his pocket.\nHe was still asleep.\nGlimmer covered their mouth.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Then Burrow sat down.\nAgainst the big mushroom.\nPip and Glimmer were still behind it.\nBurrow began to snore.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-010.mp3",
              "pageAudioText": "Then Burrow sat down.\nAgainst the big mushroom.\nPip and Glimmer were still behind it.\nBurrow began to snore.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "In the morning, Burrow woke up.\nHe looked around.\nPip and Glimmer were standing in front of him.\n\"Good morning,\" said Burrow.\nThere was a long pause.",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-011.mp3",
              "pageAudioText": "In the morning, Burrow woke up.\nHe looked around.\nPip and Glimmer were standing in front of him.\n\"Good morning,\" said Burrow.\nThere was a long pause.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "\"It was you,\" said Pip gently. \"You sleep-dig.\"\n\"I am very sorry,\" said Burrow.\nHe put his boot by the door.\n\"Will that stop you?\" asked Glimmer.\n\"I don't know,\" said Burrow.\n\"I am asleep.\"",
              "image": "/guided-reading/series/moonwood-tales/book-16/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-16/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-16/audio/page-012.mp3",
              "pageAudioText": "\"It was you,\" said Pip gently. \"You sleep-dig.\"\n\"I am very sorry,\" said Burrow.\nHe put his boot by the door.\n\"Will that stop you?\" asked Glimmer.\n\"I don't know,\" said Burrow.\n\"I am asleep.\"",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-17",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Fern and Wren and the Wrong Potion",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 17,
      "order": 17,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-17/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-17/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-17/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Fern's garden was her favourite place.\nOne morning, Wren arrived with a cauldron.\n\"I have a potion,\" said Wren.\n\"It will help your plants.\"",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-001.mp3",
              "pageAudioText": "Fern's garden was her favourite place.\nOne morning, Wren arrived with a cauldron.\n\"I have a potion,\" said Wren.\n\"It will help your plants.\"",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "\"Are you sure?\" said Fern.\n\"Completely,\" said Wren.\nShe had practised many times.\nMostly.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-002.mp3",
              "pageAudioText": "\"Are you sure?\" said Fern.\n\"Completely,\" said Wren.\nShe had practised many times.\nMostly.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Wren stirred the potion.\nIt was meant to be green.\nIt was more purple.\nWren did not notice this.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-003.mp3",
              "pageAudioText": "Wren stirred the potion.\nIt was meant to be green.\nIt was more purple.\nWren did not notice this.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Wren poured the potion on the plants.\nThe plants stood very straight.\nThen they leaned.\nThen one of them took a step.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-004.mp3",
              "pageAudioText": "Wren poured the potion on the plants.\nThe plants stood very straight.\nThen they leaned.\nThen one of them took a step.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Then all the plants began to walk.\nThey were very polite about it.\nThey walked around Fern.\nThey walked around Wren.\nThey went for a stroll.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-005.mp3",
              "pageAudioText": "Then all the plants began to walk.\nThey were very polite about it.\nThey walked around Fern.\nThey walked around Wren.\nThey went for a stroll.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "\"Oh,\" said Wren.\n\"Oh no,\" said Fern.\n\"The plants are walking.\"\nWren checked her book.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-006.mp3",
              "pageAudioText": "\"Oh,\" said Wren.\n\"Oh no,\" said Fern.\n\"The plants are walking.\"\nWren checked her book.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "The plants walked into the Hollow Oak.\nSome walked toward the Crystal Stream.\nA very small plant walked very slowly toward Burrow's tunnel.\nThey were not in a hurry.\nThey were just walking.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-007.mp3",
              "pageAudioText": "The plants walked into the Hollow Oak.\nSome walked toward the Crystal Stream.\nA very small plant walked very slowly toward Burrow's tunnel.\nThey were not in a hurry.\nThey were just walking.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Wren found the problem.\nShe had used the wrong book.\n\"This is the motion recipe,\" she said.\n\"Not the growing recipe.\"\nShe showed Fern.\nThey were both quiet for a moment.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-008.mp3",
              "pageAudioText": "Wren found the problem.\nShe had used the wrong book.\n\"This is the motion recipe,\" she said.\n\"Not the growing recipe.\"\nShe showed Fern.\nThey were both quiet for a moment.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "Fern went to the middle of the clearing.\nShe closed her eyes.\nShe sang.\nVery softly.\nThe same song from long ago.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-009.mp3",
              "pageAudioText": "Fern went to the middle of the clearing.\nShe closed her eyes.\nShe sang.\nVery softly.\nThe same song from long ago.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "The plants slowed.\nThe far ones turned.\nThey walked back.\nSlowly.\nLike sleepy creatures going home.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-010.mp3",
              "pageAudioText": "The plants slowed.\nThe far ones turned.\nThey walked back.\nSlowly.\nLike sleepy creatures going home.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "One by one they found their places.\nEach plant settled.\nThe smallest sat down last.\nIt made a small sound.\nIt seemed happy.",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-011.mp3",
              "pageAudioText": "One by one they found their places.\nEach plant settled.\nThe smallest sat down last.\nIt made a small sound.\nIt seemed happy.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "Everything was back.\n\"I'm sorry,\" said Wren.\n\"Did you learn something?\" asked Fern.\n\"Yes,\" said Wren. \"I need more books.\"\n\"Fewer,\" said Fern.\n\"Fewer books.\"",
              "image": "/guided-reading/series/moonwood-tales/book-17/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-17/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-17/audio/page-012.mp3",
              "pageAudioText": "Everything was back.\n\"I'm sorry,\" said Wren.\n\"Did you learn something?\" asked Fern.\n\"Yes,\" said Wren. \"I need more books.\"\n\"Fewer,\" said Fern.\n\"Fewer books.\"",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-18",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Stone and Dewdrop and the Stuck Fish",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 18,
      "order": 18,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-18/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-18/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-18/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Dewdrop was at the Crystal Stream.\nShe was looking at something in the water.\nIt was a large fish.\nIt was stuck.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-001.mp3",
              "pageAudioText": "Dewdrop was at the Crystal Stream.\nShe was looking at something in the water.\nIt was a large fish.\nIt was stuck.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "The fish was wedged between two rocks.\nIt had been there since morning.\nIts tail kept flicking.\nIt could not get free.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-002.mp3",
              "pageAudioText": "The fish was wedged between two rocks.\nIt had been there since morning.\nIts tail kept flicking.\nIt could not get free.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Dewdrop tried to push it loose.\nShe sent the water flowing hard against the rocks.\nThe fish did not move.\n\"I need help,\" said Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-003.mp3",
              "pageAudioText": "Dewdrop tried to push it loose.\nShe sent the water flowing hard against the rocks.\nThe fish did not move.\n\"I need help,\" said Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Dewdrop found Stone at the Hollow Oak.\n\"I need your hands,\" she said.\n\"Just to reach in and move a rock.\"\nStone understood immediately.\nThen Stone understood all of it.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-004.mp3",
              "pageAudioText": "Dewdrop found Stone at the Hollow Oak.\n\"I need your hands,\" she said.\n\"Just to reach in and move a rock.\"\nStone understood immediately.\nThen Stone understood all of it.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Stone stood at the edge of the Crystal Stream.\nThe water sparkled.\nStone's feet stayed on the bank.\n\"I don't like getting wet,\" said Stone.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-005.mp3",
              "pageAudioText": "Stone stood at the edge of the Crystal Stream.\nThe water sparkled.\nStone's feet stayed on the bank.\n\"I don't like getting wet,\" said Stone.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "\"Just your arm,\" said Dewdrop.\n\"Just the one arm.\"\n\"Just for a moment.\"\nStone looked at the arm.\nStone looked at the water.\nStone sat down on the bank.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-006.mp3",
              "pageAudioText": "\"Just your arm,\" said Dewdrop.\n\"Just the one arm.\"\n\"Just for a moment.\"\nStone looked at the arm.\nStone looked at the water.\nStone sat down on the bank.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "Stone rolled up one sleeve.\nThe arm was very large.\nStone leaned forward.\nThe hand went toward the water.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-007.mp3",
              "pageAudioText": "Stone rolled up one sleeve.\nThe arm was very large.\nStone leaned forward.\nThe hand went toward the water.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Stone's hand went into the stream.\nIt found the rock.\nIt gripped it.\nStone's face: very unhappy about this.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-008.mp3",
              "pageAudioText": "Stone's hand went into the stream.\nIt found the rock.\nIt gripped it.\nStone's face: very unhappy about this.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "Stone pushed.\nThe rock moved.\nThe mud let go.\nThe fish was free.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-009.mp3",
              "pageAudioText": "Stone pushed.\nThe rock moved.\nThe mud let go.\nThe fish was free.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "The fish made a very large splash.\nStone was completely wet.\nAll of Stone.\nDewdrop was not wet.\n\"I'm sorry,\" said Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-010.mp3",
              "pageAudioText": "The fish made a very large splash.\nStone was completely wet.\nAll of Stone.\nDewdrop was not wet.\n\"I'm sorry,\" said Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "Stone sat and dripped.\nStone looked at the arm.\nStone looked at the rest of Stone.\n\"The fish is free,\" said Stone.\n\"Yes,\" said Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-011.mp3",
              "pageAudioText": "Stone sat and dripped.\nStone looked at the arm.\nStone looked at the rest of Stone.\n\"The fish is free,\" said Stone.\n\"Yes,\" said Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "They sat by the stream together.\nStone dripped for a long time.\nThe fish surfaced once.\nIt seemed happy.\n\"Good,\" said Stone.\nAnd meant it.",
              "image": "/guided-reading/series/moonwood-tales/book-18/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-18/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-18/audio/page-012.mp3",
              "pageAudioText": "They sat by the stream together.\nStone dripped for a long time.\nThe fish surfaced once.\nIt seemed happy.\n\"Good,\" said Stone.\nAnd meant it.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-19",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "The Missing Magic Seeds",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 19,
      "order": 19,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-19/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-19/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-19/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "The magic seeds were gone.\nThe box that held them was open and empty.\nLuna looked at the box for a long time.\n\"This is not good,\" she said.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-001.mp3",
              "pageAudioText": "The magic seeds were gone.\nThe box that held them was open and empty.\nLuna looked at the box for a long time.\n\"This is not good,\" she said.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "Luna called everyone together.\n\"The seeds keep Moonwood glowing,\" she said.\n\"Without them, the forest will grow dark.\"\nEveryone looked at each other.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-002.mp3",
              "pageAudioText": "Luna called everyone together.\n\"The seeds keep Moonwood glowing,\" she said.\n\"Without them, the forest will grow dark.\"\nEveryone looked at each other.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "They split into groups.\nEach group took a different path.\nEach path led somewhere different.\n\"Find the seeds,\" said Luna.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-003.mp3",
              "pageAudioText": "They split into groups.\nEach group took a different path.\nEach path led somewhere different.\n\"Find the seeds,\" said Luna.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Pip searched the Fog Marsh.\nHe found no seeds.\nHe found mud.\nFlint searched the Tumblerock Cliffs.\nHe found no seeds.\nHe found three new things to map.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-004.mp3",
              "pageAudioText": "Pip searched the Fog Marsh.\nHe found no seeds.\nHe found mud.\nFlint searched the Tumblerock Cliffs.\nHe found no seeds.\nHe found three new things to map.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Wren and Spark tried search spells.\nThe spells pointed at each other.\nStone looked under every log.\nGently.\nThere were no seeds under the logs.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-005.mp3",
              "pageAudioText": "Wren and Spark tried search spells.\nThe spells pointed at each other.\nStone looked under every log.\nGently.\nThere were no seeds under the logs.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Burrow went underground.\nHe searched every tunnel.\nHe found three interesting things.\nHe did not find any seeds.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-006.mp3",
              "pageAudioText": "Burrow went underground.\nHe searched every tunnel.\nHe found three interesting things.\nHe did not find any seeds.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "Dewdrop searched the stream.\nFern walked slowly around the clearing.\nShe was not searching.\nShe was listening.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-007.mp3",
              "pageAudioText": "Dewdrop searched the stream.\nFern walked slowly around the clearing.\nShe was not searching.\nShe was listening.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Fern stopped.\nShe knelt down.\nThere were small green shoots in the ground.\nThey glowed.\nJust a little.\nJust like the seeds.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-008.mp3",
              "pageAudioText": "Fern stopped.\nShe knelt down.\nThere were small green shoots in the ground.\nThey glowed.\nJust a little.\nJust like the seeds.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "\"Oh,\" said Fern.\nShe remembered.\nTwo nights ago she had been in the clearing.\nShe had planted the seeds.\nShe had not meant to forget.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-009.mp3",
              "pageAudioText": "\"Oh,\" said Fern.\nShe remembered.\nTwo nights ago she had been in the clearing.\nShe had planted the seeds.\nShe had not meant to forget.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Everyone came back with nothing.\nThen they saw Fern.\nShe was sitting in the middle of the clearing.\nSmall glowing seedlings were growing all around her.\n\"Oh,\" said everyone.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-010.mp3",
              "pageAudioText": "Everyone came back with nothing.\nThen they saw Fern.\nShe was sitting in the middle of the clearing.\nSmall glowing seedlings were growing all around her.\n\"Oh,\" said everyone.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "Luna bent down to look.\nThe seedlings were strong.\nThey were growing along the paths.\nAround the Hollow Oak.\nAll through the clearing.\n\"Better than a box,\" said Luna.",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-011.mp3",
              "pageAudioText": "Luna bent down to look.\nThe seedlings were strong.\nThey were growing along the paths.\nAround the Hollow Oak.\nAll through the clearing.\n\"Better than a box,\" said Luna.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "That night, Moonwood glowed more than ever.\nThe seedlings lit the ground.\nEveryone sat outside the Hollow Oak.\n\"I'm sorry I forgot,\" said Fern.\n\"Don't be,\" said Luna.\n\"They like it better here.\"",
              "image": "/guided-reading/series/moonwood-tales/book-19/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-19/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-19/audio/page-012.mp3",
              "pageAudioText": "That night, Moonwood glowed more than ever.\nThe seedlings lit the ground.\nEveryone sat outside the Hollow Oak.\n\"I'm sorry I forgot,\" said Fern.\n\"Don't be,\" said Luna.\n\"They like it better here.\"",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-20",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "The Night the Stars Fell",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 20,
      "order": 20,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-20/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-20/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-20/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "It was the middle of the night.\nEveryone was nearly asleep.\nThen a light flashed.\nThen another.\nThen small glowing things began to fall from the sky.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-001.mp3",
              "pageAudioText": "It was the middle of the night.\nEveryone was nearly asleep.\nThen a light flashed.\nThen another.\nThen small glowing things began to fall from the sky.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "The small things landed and bounced.\nThey bounced along the ground.\nThey made a sound like giggling.\nThey left gold trails where they bounced.\n\"What ARE they?\" said Pip.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-002.mp3",
              "pageAudioText": "The small things landed and bounced.\nThey bounced along the ground.\nThey made a sound like giggling.\nThey left gold trails where they bounced.\n\"What ARE they?\" said Pip.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Pip caught one.\nIt was warm.\nIt had very large golden eyes.\nIt looked up at Pip and giggled.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-003.mp3",
              "pageAudioText": "Pip caught one.\nIt was warm.\nIt had very large golden eyes.\nIt looked up at Pip and giggled.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "\"What are you?\" asked Pip.\nThe star spirit blinked its large gold eyes.\n\"Star,\" it said.\nIts voice was very small.\n\"Fell,\" it added.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-004.mp3",
              "pageAudioText": "\"What are you?\" asked Pip.\nThe star spirit blinked its large gold eyes.\n\"Star,\" it said.\nIts voice was very small.\n\"Fell,\" it added.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Luna pushed forward.\nShe looked at the star spirit over her glasses.\n\"I know what these are,\" said Luna.\n\"They lose their grip once a year.\"\n\"They need to go back before dawn.\"",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-005.mp3",
              "pageAudioText": "Luna pushed forward.\nShe looked at the star spirit over her glasses.\n\"I know what these are,\" said Luna.\n\"They lose their grip once a year.\"\n\"They need to go back before dawn.\"",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "They gathered the star spirits.\nThere were many of them.\nStone held several.\nWren had two in her hat.\nThey kept bouncing.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-006.mp3",
              "pageAudioText": "They gathered the star spirits.\nThere were many of them.\nStone held several.\nWren had two in her hat.\nThey kept bouncing.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "\"They need height,\" said Luna.\n\"The highest point in Moonwood.\"\nFlint reached for his satchel.\nEveryone looked at Flint.\n\"I know exactly where it is,\" said Flint.\nEveryone kept looking at him.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-007.mp3",
              "pageAudioText": "\"They need height,\" said Luna.\n\"The highest point in Moonwood.\"\nFlint reached for his satchel.\nEveryone looked at Flint.\n\"I know exactly where it is,\" said Flint.\nEveryone kept looking at him.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "\"This way,\" said Flint.\nHe was right.\nThe Tumblerock Cliffs rose ahead.\n\"You found it,\" said Pip.\n\"I always find things,\" said Flint.\n\"Eventually.\"",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-008.mp3",
              "pageAudioText": "\"This way,\" said Flint.\nHe was right.\nThe Tumblerock Cliffs rose ahead.\n\"You found it,\" said Pip.\n\"I always find things,\" said Flint.\n\"Eventually.\"",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "They climbed to the top.\nMoonwood spread below them in the dark.\nThe sky was full of stars above.\nThe star spirits reached upward with their tiny arms.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-009.mp3",
              "pageAudioText": "They climbed to the top.\nMoonwood spread below them in the dark.\nThe sky was full of stars above.\nThe star spirits reached upward with their tiny arms.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Stone raised their hands high.\nPip and Spark added a little push.\nThe star spirits lifted.\nUp.\nAnd up.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-010.mp3",
              "pageAudioText": "Stone raised their hands high.\nPip and Spark added a little push.\nThe star spirits lifted.\nUp.\nAnd up.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "The star spirits went up.\nSlowly at first.\nThen faster.\nOne by one they found their places.\nThe sky filled back up with stars.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-011.mp3",
              "pageAudioText": "The star spirits went up.\nSlowly at first.\nThen faster.\nOne by one they found their places.\nThe sky filled back up with stars.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "The last star spirit sat in Stone's hand.\nIt blinked its large gold eyes at everyone.\n\"See you next year,\" it said.\nThen it bounced once.\nThen it went up.\nThen it was gone.",
              "image": "/guided-reading/series/moonwood-tales/book-20/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-20/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-20/audio/page-012.mp3",
              "pageAudioText": "The last star spirit sat in Stone's hand.\nIt blinked its large gold eyes at everyone.\n\"See you next year,\" it said.\nThen it bounced once.\nThen it went up.\nThen it was gone.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-21",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Something Lives in the Hollow Oak",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 21,
      "order": 21,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-21/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-21/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-21/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "It was late in the Hollow Oak.\nEveryone was asleep.\nThen Pip heard it.\nScratch.\nShuffle.\nA tiny voice: \"...where DID I put them...\"",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-001.mp3",
              "pageAudioText": "It was late in the Hollow Oak.\nEveryone was asleep.\nThen Pip heard it.\nScratch.\nShuffle.\nA tiny voice: \"...where DID I put them...\"",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "Pip woke Wren.\nThey listened together.\nScratch.\nShuffle.\n\"...they were right here...\"\n\"Something is in the walls,\" said Wren.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-002.mp3",
              "pageAudioText": "Pip woke Wren.\nThey listened together.\nScratch.\nShuffle.\n\"...they were right here...\"\n\"Something is in the walls,\" said Wren.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "By morning, everyone knew.\nThey stood outside the Hollow Oak.\n\"It makes those sounds,\" said Luna.\n\"It always has.\"\n\"It HAS?\" said everyone.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-003.mp3",
              "pageAudioText": "By morning, everyone knew.\nThey stood outside the Hollow Oak.\n\"It makes those sounds,\" said Luna.\n\"It always has.\"\n\"It HAS?\" said everyone.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Pip, Wren, Burrow, and Fern went inside to search.\nThey searched every room.\nThey found nothing.\nThen Burrow's nose twitched.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-004.mp3",
              "pageAudioText": "Pip, Wren, Burrow, and Fern went inside to search.\nThey searched every room.\nThey found nothing.\nThen Burrow's nose twitched.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "\"There is a room here,\" said Burrow.\nHe found a small door near the roots.\nIt was very small.\nToo small for most of them.\n\"I can go,\" said Fern.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-005.mp3",
              "pageAudioText": "\"There is a room here,\" said Burrow.\nHe found a small door near the roots.\nIt was very small.\nToo small for most of them.\n\"I can go,\" said Fern.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Fern went through the small door.\nShe was inside for a moment.\nThen she called back:\n\"There is someone here.\"\nEveryone pressed their ears to the door.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-006.mp3",
              "pageAudioText": "Fern went through the small door.\nShe was inside for a moment.\nThen she called back:\n\"There is someone here.\"\nEveryone pressed their ears to the door.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "Inside was a room.\nIt was small and warm.\nIt was full of collected things.\nA tiny creature was searching through them.\nShe did not look up.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-007.mp3",
              "pageAudioText": "Inside was a room.\nIt was small and warm.\nIt was full of collected things.\nA tiny creature was searching through them.\nShe did not look up.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "\"Hello,\" said Fern.\nThe tiny creature looked up.\n\"Have you seen my spectacles?\" she said.\n\"I've been looking for three days.\"",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-008.mp3",
              "pageAudioText": "\"Hello,\" said Fern.\nThe tiny creature looked up.\n\"Have you seen my spectacles?\" she said.\n\"I've been looking for three days.\"",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "Fern looked around the room.\nThen she looked at Twig.\nThe spectacles were on top of Twig's head.\nThey had been there all along.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-009.mp3",
              "pageAudioText": "Fern looked around the room.\nThen she looked at Twig.\nThe spectacles were on top of Twig's head.\nThey had been there all along.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "\"I am Twig,\" said the tiny creature.\n\"I live here.\"\n\"I have always lived here.\"\nShe seemed perfectly happy about this.",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-010.mp3",
              "pageAudioText": "\"I am Twig,\" said the tiny creature.\n\"I live here.\"\n\"I have always lived here.\"\nShe seemed perfectly happy about this.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "Fern came back through the door.\n\"Her name is Twig,\" said Fern.\n\"She has lived here for many years.\"\nEveryone looked at Luna.\n\"Of course,\" said Luna.\n\"Twig.\"",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-011.mp3",
              "pageAudioText": "Fern came back through the door.\n\"Her name is Twig,\" said Fern.\n\"She has lived here for many years.\"\nEveryone looked at Luna.\n\"Of course,\" said Luna.\n\"Twig.\"",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "They made Twig a slightly larger door.\nTwig came out for acorn biscuits.\nShe sat in the big room and looked around.\n\"I like it here,\" she said.\n\"But I like my room better.\"\n\"This is also very nice.\"",
              "image": "/guided-reading/series/moonwood-tales/book-21/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-21/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-21/audio/page-012.mp3",
              "pageAudioText": "They made Twig a slightly larger door.\nTwig came out for acorn biscuits.\nShe sat in the big room and looked around.\n\"I like it here,\" she said.\n\"But I like my room better.\"\n\"This is also very nice.\"",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-22",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "The Big Moonwood Race",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 22,
      "order": 22,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-22/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-22/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-22/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Luna read out the race rules.\nThe course: from the Hollow Oak to the Crystal Stream to the Tumblerock Cliffs and back.\nEveryone was at the starting line.\nEveryone was ready.\nMostly.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-001.mp3",
              "pageAudioText": "Luna read out the race rules.\nThe course: from the Hollow Oak to the Crystal Stream to the Tumblerock Cliffs and back.\nEveryone was at the starting line.\nEveryone was ready.\nMostly.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "They were off.\nPip ran.\nFern flew.\nStone trotted.\nDewdrop glided.\nWren ran and read her spell book.\nFlint took a very confident turn left.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-002.mp3",
              "pageAudioText": "They were off.\nPip ran.\nFern flew.\nStone trotted.\nDewdrop glided.\nWren ran and read her spell book.\nFlint took a very confident turn left.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Flint went left.\nThen left again.\nThen the Fog Marsh was ahead of him.\n\"I am taking a scenic route,\" said Flint.\nThere was no one to hear him.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-003.mp3",
              "pageAudioText": "Flint went left.\nThen left again.\nThen the Fog Marsh was ahead of him.\n\"I am taking a scenic route,\" said Flint.\nThere was no one to hear him.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Wren found a speed spell.\nShe cast it.\nIt worked on everyone near her.\nEveryone shot forward very fast.\nExcept Wren.\nShe watched them all go.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-004.mp3",
              "pageAudioText": "Wren found a speed spell.\nShe cast it.\nIt worked on everyone near her.\nEveryone shot forward very fast.\nExcept Wren.\nShe watched them all go.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Glimmer could not stop.\nGlimmer hit Spark.\nSparkles went everywhere.\nThey both kept moving.\nVery fast.\nIn new directions.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-005.mp3",
              "pageAudioText": "Glimmer could not stop.\nGlimmer hit Spark.\nSparkles went everywhere.\nThey both kept moving.\nVery fast.\nIn new directions.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Stone hit a root.\nStone began to fall.\nThis took a while.\nStone was very large.\nStone fell slowly.\nMagnificently.\nLike a small cliff sitting down.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-006.mp3",
              "pageAudioText": "Stone hit a root.\nStone began to fall.\nThis took a while.\nStone was very large.\nStone fell slowly.\nMagnificently.\nLike a small cliff sitting down.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "Pip reached the Crystal Stream.\nHe leaped from stone to stone.\nOne stone was slippery.\nPip went in.\nHe came out the other side.\nStill running.\nVery wet.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-007.mp3",
              "pageAudioText": "Pip reached the Crystal Stream.\nHe leaped from stone to stone.\nOne stone was slippery.\nPip went in.\nHe came out the other side.\nStill running.\nVery wet.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "Halfway through, everyone was somewhere different.\nPip was wet.\nStone was standing up again.\nSpark had lost his hat.\nFlint was not visible.\nWren was still walking.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-008.mp3",
              "pageAudioText": "Halfway through, everyone was somewhere different.\nPip was wet.\nStone was standing up again.\nSpark had lost his hat.\nFlint was not visible.\nWren was still walking.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "Dewdrop crossed the finish line.\nShe had glided the whole way.\nShe was not wet.\nShe was not ruffled.\n\"Finished,\" said Dewdrop.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-009.mp3",
              "pageAudioText": "Dewdrop crossed the finish line.\nShe had glided the whole way.\nShe was not wet.\nShe was not ruffled.\n\"Finished,\" said Dewdrop.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Everyone finished.\nEventually.\nPip was still damp.\nSpark had found his hat.\nStone had found a bruise.\nFlint arrived from the wrong direction.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-010.mp3",
              "pageAudioText": "Everyone finished.\nEventually.\nPip was still damp.\nSpark had found his hat.\nStone had found a bruise.\nFlint arrived from the wrong direction.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "Luna counted everyone.\nEveryone was back.\nThen there was a rumbling.\nBurrow came up through the ground.\nRight beside the finish line.\nHe did not look tired.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-011.mp3",
              "pageAudioText": "Luna counted everyone.\nEveryone was back.\nThen there was a rumbling.\nBurrow came up through the ground.\nRight beside the finish line.\nHe did not look tired.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "Dewdrop won a gold leaf for finishing.\nBurrow won a gold leaf for best route.\n\"I did not win,\" said Flint.\n\"You went to the Fog Marsh,\" said Pip.\n\"I saw many things,\" said Flint.\nHe was already drawing them.",
              "image": "/guided-reading/series/moonwood-tales/book-22/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-22/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-22/audio/page-012.mp3",
              "pageAudioText": "Dewdrop won a gold leaf for finishing.\nBurrow won a gold leaf for best route.\n\"I did not win,\" said Flint.\n\"You went to the Fog Marsh,\" said Pip.\n\"I saw many things,\" said Flint.\nHe was already drawing them.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-23",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "The Fog Marsh Mystery",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 23,
      "order": 23,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-23/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-23/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-23/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "Pip noticed it on a Tuesday.\nThe grey fog of the Fog Marsh was closer.\nIt had never come this near before.\nHe marked the edge with a stick.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-001.mp3",
              "pageAudioText": "Pip noticed it on a Tuesday.\nThe grey fog of the Fog Marsh was closer.\nIt had never come this near before.\nHe marked the edge with a stick.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "By the end of the week, the fog had crept closer.\nThe mushrooms at the edge were going out.\nOne by one.\nThe fog was not stopping.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-002.mp3",
              "pageAudioText": "By the end of the week, the fog had crept closer.\nThe mushrooms at the edge were going out.\nOne by one.\nThe fog was not stopping.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Pip told Luna.\nLuna listened carefully.\n\"Something is wrong at the marsh,\" she said.\n\"We must go in.\"\nPip, Fern, and Dewdrop came too.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-003.mp3",
              "pageAudioText": "Pip told Luna.\nLuna listened carefully.\n\"Something is wrong at the marsh,\" she said.\n\"We must go in.\"\nPip, Fern, and Dewdrop came too.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Inside the marsh, it was colder.\nThe trees drooped.\nThe water did not move.\nDewdrop led them through the fog.\nShe could feel the water.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-004.mp3",
              "pageAudioText": "Inside the marsh, it was colder.\nThe trees drooped.\nThe water did not move.\nDewdrop led them through the fog.\nShe could feel the water.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "At the centre of the marsh, they found it.\nA figure made of grey mist.\nIt sat against a dead tree.\nIt was very still.\nIt looked very sad.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-005.mp3",
              "pageAudioText": "At the centre of the marsh, they found it.\nA figure made of grey mist.\nIt sat against a dead tree.\nIt was very still.\nIt looked very sad.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Dewdrop went close.\n\"What is wrong?\" she asked.\nThe spirit looked up slowly.\nIts eyes were dim.\n\"My home,\" it said.\n\"Every year, smaller.\"",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-006.mp3",
              "pageAudioText": "Dewdrop went close.\n\"What is wrong?\" she asked.\nThe spirit looked up slowly.\nIts eyes were dim.\n\"My home,\" it said.\n\"Every year, smaller.\"",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "The spirit pointed to the edges.\nThey looked.\nThere were things left behind.\nA rope.\nAn old lamp.\nA pile of mushroom caps.\nLeft by Moonwood creatures.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-007.mp3",
              "pageAudioText": "The spirit pointed to the edges.\nThey looked.\nThere were things left behind.\nA rope.\nAn old lamp.\nA pile of mushroom caps.\nLeft by Moonwood creatures.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "\"We didn't know,\" said Pip.\n\"We left things without thinking,\" said Fern.\nThe spirit looked at them.\n\"Every year, more things.\"\n\"Every year, a little smaller.\"",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-008.mp3",
              "pageAudioText": "\"We didn't know,\" said Pip.\n\"We left things without thinking,\" said Fern.\nThe spirit looked at them.\n\"Every year, more things.\"\n\"Every year, a little smaller.\"",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "\"We'll clear it,\" said Pip.\n\"Now,\" said Fern.\nThey spent the afternoon clearing the marsh edge.\nAs they worked, the spirit watched.\nSlowly, it began to sit up.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-009.mp3",
              "pageAudioText": "\"We'll clear it,\" said Pip.\n\"Now,\" said Fern.\nThey spent the afternoon clearing the marsh edge.\nAs they worked, the spirit watched.\nSlowly, it began to sit up.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "When the edge was clear, the spirit stood.\nIts shape was clearer now.\n\"Thank you,\" said the spirit.\nIt was not mist anymore.\nIt was something more solid.\nSomething more itself.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-010.mp3",
              "pageAudioText": "When the edge was clear, the spirit stood.\nIts shape was clearer now.\n\"Thank you,\" said the spirit.\nIt was not mist anymore.\nIt was something more solid.\nSomething more itself.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "They marked the boundary at the Hollow Oak.\nEveryone placed a stone.\n\"The marsh is the marsh,\" said Luna.\n\"Moonwood is Moonwood.\"\n\"And we leave space for both.\"",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-011.mp3",
              "pageAudioText": "They marked the boundary at the Hollow Oak.\nEveryone placed a stone.\n\"The marsh is the marsh,\" said Luna.\n\"Moonwood is Moonwood.\"\n\"And we leave space for both.\"",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "That evening, the fog stayed at the line.\nThe mushrooms began to come back on.\nOne by one.\nPip watched them light up.\nThe marsh was where it should be.\nThe forest was where it should be.",
              "image": "/guided-reading/series/moonwood-tales/book-23/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-23/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-23/audio/page-012.mp3",
              "pageAudioText": "That evening, the fog stayed at the line.\nThe mushrooms began to come back on.\nOne by one.\nPip watched them light up.\nThe marsh was where it should be.\nThe forest was where it should be.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-24",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "Glimmer Breathes Fire at Last",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 24,
      "order": 24,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-24/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-24/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-24/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "There was a sign on the Hollow Oak door.\nGLIMMER'S FIRE PERFORMANCE — TODAY.\nEveryone came.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-001.mp3",
              "pageAudioText": "There was a sign on the Hollow Oak door.\nGLIMMER'S FIRE PERFORMANCE — TODAY.\nEveryone came.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "They all sat in the clearing.\nGlimmer stood at the front.\nIt was very quiet.\n\"Ready,\" said Glimmer.\nIt did not quite feel true.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-002.mp3",
              "pageAudioText": "They all sat in the clearing.\nGlimmer stood at the front.\nIt was very quiet.\n\"Ready,\" said Glimmer.\nIt did not quite feel true.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Glimmer breathed in.\nDeeply.\nGlimmer breathed out.\nA jet of orange fire came out.\nSmall.\nPerfect.\nReal.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-003.mp3",
              "pageAudioText": "Glimmer breathed in.\nDeeply.\nGlimmer breathed out.\nA jet of orange fire came out.\nSmall.\nPerfect.\nReal.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Everyone gasped.\nPip covered his mouth.\nStone's eyes went very wide.\nLuna took off her glasses and put them back on.\nIt was real.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-004.mp3",
              "pageAudioText": "Everyone gasped.\nPip covered his mouth.\nStone's eyes went very wide.\nLuna took off her glasses and put them back on.\nIt was real.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "Glimmer did it again.\nLonger.\nThe fire was steady.\nIt was warm.\nGlimmer's scales caught the light.\nGlimmer had never looked so much like a dragon.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-005.mp3",
              "pageAudioText": "Glimmer did it again.\nLonger.\nThe fire was steady.\nIt was warm.\nGlimmer's scales caught the light.\nGlimmer had never looked so much like a dragon.",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "Glimmer got excited.\nGlimmer breathed in very deeply.\nMuch more deeply than before.\nStone took a small step back.\n\"Glimmer,\" said Pip.\nGlimmer breathed out.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-006.mp3",
              "pageAudioText": "Glimmer got excited.\nGlimmer breathed in very deeply.\nMuch more deeply than before.\nStone took a small step back.\n\"Glimmer,\" said Pip.\nGlimmer breathed out.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "The fire was very large.\nIt was taller than Glimmer.\nIt caught the torch on the Hollow Oak door.\nThe torch lit the first lamp.\nThe lamp lit a mushroom.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-007.mp3",
              "pageAudioText": "The fire was very large.\nIt was taller than Glimmer.\nIt caught the torch on the Hollow Oak door.\nThe torch lit the first lamp.\nThe lamp lit a mushroom.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "The light spread.\nMushroom to mushroom.\nLamp to lamp.\nThrough every path.\nThrough every dark corner of Moonwood.\nAll of it lighting up.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-008.mp3",
              "pageAudioText": "The light spread.\nMushroom to mushroom.\nLamp to lamp.\nThrough every path.\nThrough every dark corner of Moonwood.\nAll of it lighting up.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "Moonwood blazed with gold.\nEvery mushroom.\nEvery lamp.\nEvery glowing stone.\nThe forest was more beautiful than anyone had ever seen it.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-009.mp3",
              "pageAudioText": "Moonwood blazed with gold.\nEvery mushroom.\nEvery lamp.\nEvery glowing stone.\nThe forest was more beautiful than anyone had ever seen it.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Everyone looked at the forest.\nThen everyone looked at Glimmer.\nGlimmer looked at the forest.\nGlimmer looked at their own mouth.\n\"Oh,\" said Glimmer.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-010.mp3",
              "pageAudioText": "Everyone looked at the forest.\nThen everyone looked at Glimmer.\nGlimmer looked at the forest.\nGlimmer looked at their own mouth.\n\"Oh,\" said Glimmer.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "The fire faded slowly.\nMoonwood kept its glow.\nLuna looked at Glimmer over her glasses.\n\"Quite controlled,\" said Luna.\n\"Thank you,\" said Glimmer.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-011.mp3",
              "pageAudioText": "The fire faded slowly.\nMoonwood kept its glow.\nLuna looked at Glimmer over her glasses.\n\"Quite controlled,\" said Luna.\n\"Thank you,\" said Glimmer.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "\"I did it,\" said Glimmer.\n\"You did,\" said Pip.\n\"I'd like to do it again,\" said Glimmer.\nEveryone who heard this took a small step back.\n\"We know,\" said everyone.",
              "image": "/guided-reading/series/moonwood-tales/book-24/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-24/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-24/audio/page-012.mp3",
              "pageAudioText": "\"I did it,\" said Glimmer.\n\"You did,\" said Pip.\n\"I'd like to do it again,\" said Glimmer.\nEveryone who heard this took a small step back.\n\"We know,\" said everyone.",
              "words": []
          }
      ]
  },
  {
      "id": "moonwood-tales-c-25",
      "seriesId": "moonwood-tales",
      "seriesTitle": "Moonwood Tales",
      "seriesName": "Moonwood Tales",
      "title": "One Night in the Deep Dark",
      "type": "fiction",
      "category": "fiction",
      "level": "C",
      "guidedReadingLevel": "C",
      "ageRange": "5-6",
      "bookNumber": 25,
      "order": 25,
      "author": "Lina Moss",
      "illustrator": "Kimi",
      "status": "approved",
      "qaStatus": "approved",
      "qaNotes": "Released for student Guided Reading from complete Moonwood Tales Level C books 11-25 source pack. Cover uses story page 1 art because no separate cover file was delivered.",
      "active": true,
      "visible": true,
      "teacherPreviewOnly": false,
      "source": "moonwood_tales_books_11_25_pack_2026_05_28",
      "coverImage": "/guided-reading/series/moonwood-tales/book-25/cover.webp",
      "fullBookAudio": "/guided-reading/series/moonwood-tales/book-25/audio/full-book.mp3",
      "bookAudioPath": "/guided-reading/series/moonwood-tales/book-25/audio/full-book.mp3",
      "readAloudAvailable": true,
      "readAloudMode": "human_audio",
      "targetSkills": [
          "level-c",
          "fiction",
          "moonwood-tales",
          "longer-story-pages"
      ],
      "sightWords": [
          "the",
          "said",
          "was",
          "you",
          "I",
          "to",
          "and",
          "it",
          "they",
          "there"
      ],
      "targetPatterns": [
          "level-c",
          "fiction",
          "dialogue",
          "comprehension",
          "story-sequence"
      ],
      "theme": "Moonwood magic and friendship",
      "characterReference": {
          "pip": "Young elf with pointed ears, brown hair, green eyes, dark green tunic, brown belt, and small brown boots.",
          "fern": "Leaf fairy with leaf-green skin, fern-frond wings, amber eyes, and moss-and-leaf clothing.",
          "stone": "Gentle baby troll with pale grey-blue skin, enormous hands, soft eyes, and simple brown clothing.",
          "glimmer": "Young dragon with purple-blue scales, gold highlights, small wings, teal eyes, and cinnamon-warm breath.",
          "wren": "Witch apprentice with wild dark hair, oversized dark blue robe, large hat, and battered green spell book.",
          "flint": "Explorer elf with copper-red hair, amber eyes, practical clothes, satchel, and many maps.",
          "dewdrop": "Water sprite with translucent blue-green shimmer, flowing blue-white hair, and clear blue eyes.",
          "burrow": "Old mole with dark brown fur, gold glasses, large digging paws, and brown waistcoat.",
          "spark": "Junior wizard with bright red hair, freckles, red and gold robe, oversized wand, and floating gold sparkles.",
          "luna": "Ancient owl with deep grey feathers, white face disc, amber eyes, and tiny gold-framed glasses."
      },
      "settingReference": "Moonwood is an ancient enchanted forest with glowing mushrooms, Hollow Oak, Crystal Stream, Fog Marsh, Tumblerock Cliffs, Whispering Meadow, and gently unreliable magic.",
      "expectedStoryPageCount": 12,
      "availableStoryPageCount": 12,
      "missingStoryPages": [],
      "pages": [
          {
              "pageNumber": 1,
              "text": "It was the deepest part of the night.\nMoonwood was very quiet.\nThen there was a sound at the edge of the clearing.\nSomething small was there.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-001.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-001.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-001.mp3",
              "pageAudioText": "It was the deepest part of the night.\nMoonwood was very quiet.\nThen there was a sound at the edge of the clearing.\nSomething small was there.",
              "words": []
          },
          {
              "pageNumber": 2,
              "text": "Pip opened the door.\nA small creature was at the edge of the clearing.\nIt had very large silver eyes.\nIt was frightened.\nIt did not run.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-002.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-002.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-002.mp3",
              "pageAudioText": "Pip opened the door.\nA small creature was at the edge of the clearing.\nIt had very large silver eyes.\nIt was frightened.\nIt did not run.",
              "words": []
          },
          {
              "pageNumber": 3,
              "text": "Pip knelt down.\nHe held still.\nThe creature came closer.\nOne step.\nThen another.\n\"Hello,\" said Pip, very quietly.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-003.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-003.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-003.mp3",
              "pageAudioText": "Pip knelt down.\nHe held still.\nThe creature came closer.\nOne step.\nThen another.\n\"Hello,\" said Pip, very quietly.",
              "words": []
          },
          {
              "pageNumber": 4,
              "text": "Pip brought it inside.\nEveryone woke up.\nStone brought a piece of acorn biscuit.\nThe creature ate it very carefully.\nIt watched everyone with its large silver eyes.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-004.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-004.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-004.mp3",
              "pageAudioText": "Pip brought it inside.\nEveryone woke up.\nStone brought a piece of acorn biscuit.\nThe creature ate it very carefully.\nIt watched everyone with its large silver eyes.",
              "words": []
          },
          {
              "pageNumber": 5,
              "text": "\"Where is your home?\" asked Burrow, gently.\nThe creature looked at its paws.\nThen at the window.\n\"Deep,\" it said.\n\"Deep dark.\"",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-005.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-005.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-005.mp3",
              "pageAudioText": "\"Where is your home?\" asked Burrow, gently.\nThe creature looked at its paws.\nThen at the window.\n\"Deep,\" it said.\n\"Deep dark.\"",
              "words": []
          },
          {
              "pageNumber": 6,
              "text": "\"We'll take you home,\" said Pip.\n\"But the Deep Dark—\" said Wren.\n\"We'll go together,\" said Pip.\nEveryone looked at each other.\n\"Together,\" said Stone.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-006.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-006.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-006.mp3",
              "pageAudioText": "\"We'll take you home,\" said Pip.\n\"But the Deep Dark—\" said Wren.\n\"We'll go together,\" said Pip.\nEveryone looked at each other.\n\"Together,\" said Stone.",
              "words": []
          },
          {
              "pageNumber": 7,
              "text": "They all went together.\nLuna led — her eyes could see in any dark.\nGlimmer breathed a small flame for the path.\nThe creature walked between them.\nInto the deep.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-007.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-007.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-007.mp3",
              "pageAudioText": "They all went together.\nLuna led — her eyes could see in any dark.\nGlimmer breathed a small flame for the path.\nThe creature walked between them.\nInto the deep.",
              "words": []
          },
          {
              "pageNumber": 8,
              "text": "The Deep Dark was very dark.\nThe trees had no glow.\nThe light went only a little way ahead.\nThey walked close together.\nNo one was last.\nNo one was alone.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-008.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-008.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-008.mp3",
              "pageAudioText": "The Deep Dark was very dark.\nThe trees had no glow.\nThe light went only a little way ahead.\nThey walked close together.\nNo one was last.\nNo one was alone.",
              "words": []
          },
          {
              "pageNumber": 9,
              "text": "Burrow found the underground path.\nHe could smell the way.\nThe creature stepped forward.\nIt knew this place.\n\"Here,\" it said.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-009.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-009.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-009.mp3",
              "pageAudioText": "Burrow found the underground path.\nHe could smell the way.\nThe creature stepped forward.\nIt knew this place.\n\"Here,\" it said.",
              "words": []
          },
          {
              "pageNumber": 10,
              "text": "Beyond the roots, a small clearing.\nSilver moss lit the ground.\nIt was warm.\nOther creatures were there.\nThey looked up.\nThey had the same enormous silver eyes.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-010.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-010.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-010.mp3",
              "pageAudioText": "Beyond the roots, a small clearing.\nSilver moss lit the ground.\nIt was warm.\nOther creatures were there.\nThey looked up.\nThey had the same enormous silver eyes.",
              "words": []
          },
          {
              "pageNumber": 11,
              "text": "The creature ran to its family.\nThe family gathered around it.\nThey looked at the Moonwood creatures.\nNot afraid.\nJust looking.\nThen one of them blinked.",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-011.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-011.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-011.mp3",
              "pageAudioText": "The creature ran to its family.\nThe family gathered around it.\nThey looked at the Moonwood creatures.\nNot afraid.\nJust looking.\nThen one of them blinked.",
              "words": []
          },
          {
              "pageNumber": 12,
              "text": "They walked back through the Dark.\nAt the edge, Pip looked back.\nOne silver light blinked twice.\n\"That was brave,\" said Glimmer.\nPip touched the stone in his pocket.\n\"Yes,\" he said. \"It ran home.\"\n\"That's the bravest kind.\"",
              "image": "/guided-reading/series/moonwood-tales/book-25/page-012.webp",
              "audio": "/guided-reading/series/moonwood-tales/book-25/audio/page-012.mp3",
              "pageAudio": "/guided-reading/series/moonwood-tales/book-25/audio/page-012.mp3",
              "pageAudioText": "They walked back through the Dark.\nAt the edge, Pip looked back.\nOne silver light blinked twice.\n\"That was brave,\" said Glimmer.\nPip touched the stone in his pocket.\n\"Yes,\" he said. \"It ran home.\"\n\"That's the bravest kind.\"",
              "words": []
          }
      ]
  }
].map(withPageWords);
