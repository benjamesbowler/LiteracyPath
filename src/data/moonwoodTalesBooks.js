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
  }
].map(withPageWords);
