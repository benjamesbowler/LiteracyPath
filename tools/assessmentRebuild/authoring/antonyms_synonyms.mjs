// Antonyms & Synonyms: explicit authored relations and context-sensitive contrasts.
// Authority: BLUEPRINTS_LANGUAGE.md section 21; retained legacy cell IDs are text-only.
export default {
  "skillId": "antonyms_synonyms",
  "skillName": "Antonyms & Synonyms",
  "items": [
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "hot — cold",
          "r": "KEY",
          "k": true
        },
        {
          "t": "hot — scorching",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "hot — warm",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "hot — heated",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "big — small",
          "r": "KEY",
          "k": true
        },
        {
          "t": "big — huge",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "big — tall",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "big — high",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "up — down",
          "r": "KEY",
          "k": true
        },
        {
          "t": "up — high",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "up — over",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "up — top",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Down reverses upward direction; over describes relative position rather than the reverse direction."
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "What is the opposite of wet?",
      "spoken": "What is the opposite of wet?",
      "choices": [
        {
          "t": "dry",
          "r": "KEY",
          "k": true
        },
        {
          "t": "soaked",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "damp",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "dripping",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 5,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The cup is full. Which word is its opposite?",
      "spoken": "The cup is full. Which word is its opposite?",
      "choices": [
        {
          "t": "empty",
          "r": "KEY",
          "k": true
        },
        {
          "t": "filled",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "packed",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "overflowing",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "empty reverses full; the other options describe contents rather than absence"
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 6,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "This gate is wide. Which word is its opposite?",
      "spoken": "This gate is wide. Which word is its opposite?",
      "choices": [
        {
          "t": "narrow",
          "r": "KEY",
          "k": true
        },
        {
          "t": "broad",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "deep",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "thick",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 1,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "happy — glad",
          "r": "KEY",
          "k": true
        },
        {
          "t": "happy — sad",
          "r": "D-OPPOSITE"
        },
        {
          "t": "happy — proud",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "happy — hopeful",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Glad matches feeling happy. Proud concerns achievement; hopeful concerns an expected good outcome. Sad is the opposing feeling."
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 2,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "shout — yell",
          "r": "KEY",
          "k": true
        },
        {
          "t": "shout — whisper",
          "r": "D-OPPOSITE"
        },
        {
          "t": "shout — talk",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "shout — sing",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 3,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means about the same as little?",
      "spoken": "Which word means about the same as little?",
      "choices": [
        {
          "t": "small",
          "r": "KEY",
          "k": true
        },
        {
          "t": "huge",
          "r": "D-OPPOSITE"
        },
        {
          "t": "thin",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "wide",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 4,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means about the same as begin?",
      "spoken": "Which word means about the same as begin?",
      "choices": [
        {
          "t": "start",
          "r": "KEY",
          "k": true
        },
        {
          "t": "finish",
          "r": "D-OPPOSITE"
        },
        {
          "t": "continue",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "pause",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "finish is the true opposite; continue and pause are plausible event-stage near-misses"
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 5,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The child feels cross. Which word means the same?",
      "spoken": "The child feels cross. Which word means the same?",
      "choices": [
        {
          "t": "angry",
          "r": "KEY",
          "k": true
        },
        {
          "t": "calm",
          "r": "D-OPPOSITE"
        },
        {
          "t": "sad",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "worried",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Cross means angry here; sadness and worry are different unhappy feelings."
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 6,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The rain makes things wet. Which word is closest to 'wet'?",
      "spoken": "The rain makes things wet. Which word is closest to 'wet'?",
      "choices": [
        {
          "t": "damp",
          "r": "KEY",
          "k": true
        },
        {
          "t": "dry",
          "r": "D-OPPOSITE"
        },
        {
          "t": "cold",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "muddy",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 1,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "awake — asleep",
          "r": "KEY",
          "k": true
        },
        {
          "t": "awake — alert",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "awake — lively",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "awake — watchful",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Asleep reverses awake; alert, lively and watchful do not."
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 2,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "night — day",
          "r": "KEY",
          "k": true
        },
        {
          "t": "night — dark",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "night — moon",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "night — midnight",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 3,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "new — old",
          "r": "KEY",
          "k": true
        },
        {
          "t": "new — fresh",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "new — shiny",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "new — clean",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 4,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word is the opposite of open?",
      "spoken": "Which word is the opposite of open?",
      "choices": [
        {
          "t": "shut",
          "r": "KEY",
          "k": true
        },
        {
          "t": "wide",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "unlocked",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "empty",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The towel is clean. Choose the opposite of clean.",
      "spoken": "The towel is clean. Choose the opposite of clean.",
      "choices": [
        {
          "t": "dirty",
          "r": "KEY",
          "k": true
        },
        {
          "t": "washed",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "spotless",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "fresh",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Dirty reverses clean; the other descriptions are compatible with cleanliness."
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "What is the opposite of tall?",
      "spoken": "What is the opposite of tall?",
      "choices": [
        {
          "t": "short",
          "r": "KEY",
          "k": true
        },
        {
          "t": "giant",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "long",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "high",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "short alone reverses height; giant, long, and high remain plausible size words"
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 1,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The room is bright. Which word means the same here?",
      "spoken": "The room is bright. Which word means the same here?",
      "choices": [
        {
          "t": "light",
          "r": "KEY",
          "k": true
        },
        {
          "t": "dark",
          "r": "D-OPPOSITE"
        },
        {
          "t": "pale",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "glossy",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Bright and light describe illumination. Pale concerns color strength; glossy concerns a reflective surface."
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 2,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "hard — firm",
          "r": "KEY",
          "k": true
        },
        {
          "t": "hard — soft",
          "r": "D-OPPOSITE"
        },
        {
          "t": "hard — smooth",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "hard — rough",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Firm matches resistance to pressure; smooth and rough concern surface texture, which is separate from hardness."
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 3,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "cold — chilly",
          "r": "KEY",
          "k": true
        },
        {
          "t": "cold — warm",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "cold — mild",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "cold — hot",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Chilly means cold. Hot supplies the true opposite; warm and mild are less cold temperatures."
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 4,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The child feels scared. Which word means the same?",
      "spoken": "The child feels scared. Which word means the same?",
      "choices": [
        {
          "t": "afraid",
          "r": "KEY",
          "k": true
        },
        {
          "t": "fearless",
          "r": "D-OPPOSITE"
        },
        {
          "t": "angry",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "lonely",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Afraid names fear; angry and lonely are different feelings."
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 5,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Pick a word that means quick.",
      "spoken": "Pick a word that means quick.",
      "choices": [
        {
          "t": "fast",
          "r": "KEY",
          "k": true
        },
        {
          "t": "slow",
          "r": "D-OPPOSITE"
        },
        {
          "t": "steady",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "early",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 6,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means about the same as sleepy?",
      "spoken": "Which word means about the same as sleepy?",
      "choices": [
        {
          "t": "tired",
          "r": "KEY",
          "k": true
        },
        {
          "t": "alert",
          "r": "D-OPPOSITE"
        },
        {
          "t": "cozy",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "calm",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Tired matches sleepy; alert contrasts with feeling drowsy. Comfort and calmness do not mean needing sleep."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which is the exact opposite of 'whisper'?",
      "spoken": "Which is the exact opposite of 'whisper'?",
      "choices": [
        {
          "t": "shout",
          "r": "KEY",
          "k": true
        },
        {
          "t": "talk",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "mumble",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "sing",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Shout reverses very quiet speech with loud speech. Talk gives no volume; mumble stays quiet or unclear; singing changes the vocal action."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word names extreme heat, opposite to 'icy cold'?",
      "spoken": "Which word names extreme heat, opposite to 'icy cold'?",
      "choices": [
        {
          "t": "boiling",
          "r": "KEY",
          "k": true
        },
        {
          "t": "icy",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "warm",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "chilly",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Boiling names the opposite temperature extreme. Warm is positive heat but does not match the requested extreme."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means extremely small, the reverse of 'giant'?",
      "spoken": "Which word means extremely small, the reverse of 'giant'?",
      "choices": [
        {
          "t": "tiny",
          "r": "KEY",
          "k": true
        },
        {
          "t": "huge",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "short",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "thin",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Tiny reverses overall extreme size. Short and thin change only one dimension; huge keeps the original meaning."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Pick the opposite of 'noisy'.",
      "spoken": "Pick the opposite of 'noisy'.",
      "choices": [
        {
          "t": "silent",
          "r": "KEY",
          "k": true
        },
        {
          "t": "loud",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "busy",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "musical",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Silent reverses noisy by removing sound entirely; busy describes activity without fixing volume, and musical describes sound quality."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 5,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The kitten is tame. The tiger is ___.",
      "spoken": "Which opposite word fits? The kitten is tame. The tiger is hmm.",
      "sentence": "The kitten is tame. The tiger is ___.",
      "choices": [
        {
          "t": "wild",
          "r": "KEY",
          "k": true
        },
        {
          "t": "gentle",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "calm",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "trained",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Wild reverses tame in the animal context. Gentle and calm describe behavior; trained concerns learned tasks, not whether the animal is wild."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 6,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: This puzzle is simple. Its opposite is ___.",
      "spoken": "Which opposite word fits? This puzzle is simple. Its opposite is hmm.",
      "sentence": "This puzzle is simple. Its opposite is ___.",
      "choices": [
        {
          "t": "tricky",
          "r": "KEY",
          "k": true
        },
        {
          "t": "easy",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "plain",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "basic",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "The puzzle context fixes simple as easy to solve. Tricky reverses difficulty; easy, plain and basic stay close to simplicity."
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 1,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word is closest to 'giggle'?",
      "spoken": "Which word is closest to 'giggle'?",
      "choices": [
        {
          "t": "chuckle",
          "r": "KEY",
          "k": true
        },
        {
          "t": "whisper",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "sob",
          "r": "D-OPPOSITE"
        },
        {
          "t": "chat",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "chuckle alone names the same small laugh; no broader laugh synonym competes"
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 2,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means very large, just like 'huge'?",
      "spoken": "Which word means very large, just like 'huge'?",
      "choices": [
        {
          "t": "enormous",
          "r": "KEY",
          "k": true
        },
        {
          "t": "small",
          "r": "D-OPPOSITE"
        },
        {
          "t": "large",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "tall",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Enormous keeps the extreme degree of huge. Large loses that degree; tall concerns height alone."
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 3,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word is closest to 'cautious'?",
      "spoken": "Which word is closest to 'cautious'?",
      "choices": [
        {
          "t": "careful",
          "r": "KEY",
          "k": true
        },
        {
          "t": "reckless",
          "r": "D-OPPOSITE"
        },
        {
          "t": "slow",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "nervous",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Cautious means careful about risk. Slow is speed and nervous is a feeling; neither requires care."
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 4,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word is closest to 'grin'?",
      "spoken": "Which word is closest to 'grin'?",
      "choices": [
        {
          "t": "smile",
          "r": "KEY",
          "k": true
        },
        {
          "t": "frown",
          "r": "D-OPPOSITE"
        },
        {
          "t": "cry",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "laugh",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "smile alone matches the facial expression; laugh remains a related but distinct response"
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 5,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits best: The mouse was very small: it was ___.",
      "spoken": "Which same-meaning word fits best? The mouse was very small: it was hmm.",
      "sentence": "The mouse was very small: it was ___.",
      "choices": [
        {
          "t": "tiny",
          "r": "KEY",
          "k": true
        },
        {
          "t": "huge",
          "r": "D-OPPOSITE"
        },
        {
          "t": "short",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "slim",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "text",
      "note": "Tiny matches very small; short and slim describe different dimensions."
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 6,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits best: The lake was icy: its surface was ___.",
      "spoken": "Which same-meaning word fits best? The lake was icy: its surface was hmm.",
      "sentence": "The lake was icy: its surface was ___.",
      "choices": [
        {
          "t": "frozen",
          "r": "KEY",
          "k": true
        },
        {
          "t": "melted",
          "r": "D-OPPOSITE"
        },
        {
          "t": "cool",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "chilly",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Icy requires ice on the surface. Cool and chilly mean low temperature without requiring ice; melted reverses the frozen state."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 1,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: Our team won. Their team did the opposite: they ___.",
      "spoken": "Which opposite word fits: Our team won. Their team did the opposite: they hmm.",
      "sentence": "Our team won. Their team did the opposite: they ___.",
      "choices": [
        {
          "t": "lost",
          "r": "KEY",
          "k": true
        },
        {
          "t": "played",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "scored",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "cheered",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "The team-result context fixes lost as the reverse of winning. Playing, scoring and cheering can occur for either side."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 2,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The bag was heavy to carry. This bag feels ___.",
      "spoken": "Which opposite word fits: The bag was heavy to carry. This bag feels hmm.",
      "sentence": "The bag was heavy to carry. This bag feels ___.",
      "choices": [
        {
          "t": "light",
          "r": "KEY",
          "k": true
        },
        {
          "t": "big",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "bulky",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "full",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Carrying fixes heavy as weight, so light reverses it. Big and bulky describe size; full describes contents, which do not fix weight."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 3,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The gate blocks our way. Opening it ___ our way.",
      "spoken": "Which opposite word fits: The gate blocks our way. Opening it hmm our way.",
      "sentence": "The gate blocks our way. Opening it ___ our way.",
      "choices": [
        {
          "t": "clears",
          "r": "KEY",
          "k": true
        },
        {
          "t": "closes",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "covers",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "narrows",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Blocks means obstructs the path here. Clears reverses obstruction; the other actions restrict or cover the path."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 4,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: At first they agreed. Later they ___ about the plan.",
      "spoken": "Which opposite word fits: At first they agreed. Later they hmm about the plan.",
      "sentence": "At first they agreed. Later they ___ about the plan.",
      "choices": [
        {
          "t": "disagreed",
          "r": "KEY",
          "k": true
        },
        {
          "t": "discussed",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "agreed",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "asked",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Disagreed reverses shared opinions. Agreed repeats the original meaning; discussing or asking about a plan does not establish agreement or disagreement."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The room was light. At bedtime it became ___.",
      "spoken": "Which opposite word fits: The room was light. At bedtime it became hmm.",
      "sentence": "The room was light. At bedtime it became ___.",
      "choices": [
        {
          "t": "dark",
          "r": "KEY",
          "k": true
        },
        {
          "t": "bright",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "pale",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "shiny",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Room illumination fixes the light/dark sense, not the weight sense. Pale concerns color and shiny concerns reflection."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: We arrived early. The opposite of early is ___.",
      "spoken": "Which opposite word fits? We arrived early. The opposite of early is hmm.",
      "sentence": "We arrived early. The opposite of early is ___.",
      "choices": [
        {
          "t": "late",
          "r": "KEY",
          "k": true
        },
        {
          "t": "soon",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "first",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "promptly",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Late reverses arriving early. Soon describes time from now, first describes order, and promptly describes responding without delay."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 1,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: Dad fixed the gate. In the same way, he ___ the fence.",
      "spoken": "Which same-meaning word fits? Dad fixed the gate. In the same way, he hmm the fence.",
      "sentence": "Dad fixed the gate. In the same way, he ___ the fence.",
      "choices": [
        {
          "t": "mended",
          "r": "KEY",
          "k": true
        },
        {
          "t": "broke",
          "r": "D-OPPOSITE"
        },
        {
          "t": "painted",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "built",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "text",
      "note": "Fixed means repaired the gate here. Mended preserves that sense; painting and building are different kinds of work, while broke reverses repair."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 2,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: The soup was tasty, or ___.",
      "spoken": "Which same-meaning word fits? The soup was tasty, or hmm.",
      "sentence": "The soup was tasty, or ___.",
      "choices": [
        {
          "t": "delicious",
          "r": "KEY",
          "k": true
        },
        {
          "t": "awful",
          "r": "D-OPPOSITE"
        },
        {
          "t": "warm",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "salty",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "delicious alone matches tasty; awful contrasts while warm and salty are related food qualities"
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 3,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: We shouted with joy — with ___.",
      "spoken": "Which same-meaning word fits? We shouted with joy — with hmm.",
      "sentence": "We shouted with joy — with ___.",
      "choices": [
        {
          "t": "glee",
          "r": "KEY",
          "k": true
        },
        {
          "t": "sorrow",
          "r": "D-OPPOSITE"
        },
        {
          "t": "hope",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "pride",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "text",
      "note": "Glee is happiness like joy. Hope concerns a wished-for future and pride concerns satisfaction in achievement; sorrow is the opposite feeling."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 4,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: The ribbon was narrow, or ___.",
      "spoken": "Which same-meaning word fits? The ribbon was narrow, or hmm.",
      "sentence": "The ribbon was narrow, or ___.",
      "choices": [
        {
          "t": "thin",
          "r": "KEY",
          "k": true
        },
        {
          "t": "wide",
          "r": "D-OPPOSITE"
        },
        {
          "t": "long",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "smooth",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "text",
      "note": "Thin is the only same-meaning description of the ribbon's width."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 5,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: Mum purchased a ticket. She ___ it at the desk.",
      "spoken": "Which same-meaning word fits: Mum purchased a ticket. She hmm it at the desk.",
      "sentence": "Mum purchased a ticket. She ___ it at the desk.",
      "choices": [
        {
          "t": "bought",
          "r": "KEY",
          "k": true
        },
        {
          "t": "sold",
          "r": "D-OPPOSITE"
        },
        {
          "t": "printed",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "checked",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Purchased fixes bought as an exchange for payment. Printing and checking do not establish purchase; selling is the reverse role."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 6,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: Jo is my friend. Jo is my ___.",
      "spoken": "Which same-meaning word fits? Jo is my friend. Jo is my hmm.",
      "sentence": "Jo is my friend. Jo is my ___.",
      "choices": [
        {
          "t": "pal",
          "r": "KEY",
          "k": true
        },
        {
          "t": "enemy",
          "r": "D-OPPOSITE"
        },
        {
          "t": "teacher",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "teammate",
          "r": "D-TOPIC-ADJACENT"
        }
      ],
      "media": "text",
      "note": "Pal preserves the friendship relation. A teacher or teammate can also be a friend, but those role words do not mean friend; enemy is the contrasting relation."
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 7,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "high — low",
          "r": "KEY",
          "k": true
        },
        {
          "t": "high — up",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "high — tall",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "high — top",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair.",
      "retention": true
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 8,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "front — back",
          "r": "KEY",
          "k": true
        },
        {
          "t": "front — first",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "front — near",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "front — side",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Back reverses front position. First concerns order, near concerns distance and side names a different position.",
      "retention": true
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 7,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "rest — relax",
          "r": "KEY",
          "k": true
        },
        {
          "t": "rest — work",
          "r": "D-OPPOSITE"
        },
        {
          "t": "rest — wait",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "rest — sit",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Relax matches taking a rest. Waiting and sitting may happen while resting, but neither means resting.",
      "retention": true
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 8,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Pick the pair with the same meaning.",
      "spoken": "Pick the pair with the same meaning.",
      "choices": [
        {
          "t": "exit — leave",
          "r": "KEY",
          "k": true
        },
        {
          "t": "exit — enter",
          "r": "D-OPPOSITE"
        },
        {
          "t": "exit — wait",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "exit — visit",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Exit and leave both mean going out. Enter reverses direction; waiting and visiting name different actions at a place.",
      "retention": true
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "sit — stand",
          "r": "KEY",
          "k": true
        },
        {
          "t": "sit — rest",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "sit — kneel",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "sit — crouch",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Stand is the conventional opposite posture to sit. Kneeling and crouching are other bent-body postures; rest does not specify posture.",
      "retention": true
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 7,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Pick the pair with the same meaning.",
      "spoken": "Pick the pair with the same meaning.",
      "choices": [
        {
          "t": "glows — shines",
          "r": "KEY",
          "k": true
        },
        {
          "t": "glows — dims",
          "r": "D-OPPOSITE"
        },
        {
          "t": "glows — flickers",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "glows — warms",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair.",
      "retention": true
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 7,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means the opposite of 'tighten'?",
      "spoken": "Which word means the opposite of 'tighten'?",
      "choices": [
        {
          "t": "loosen",
          "r": "KEY",
          "k": true
        },
        {
          "t": "fasten",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "twist",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "pull",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Loosen reduces grip or tension. Fastening, twisting and pulling are related actions that can increase or preserve tightness.",
      "retention": true
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 8,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which event reverses sunrise, when daylight begins?",
      "spoken": "Which event reverses sunrise, when daylight begins?",
      "choices": [
        {
          "t": "sunset",
          "r": "KEY",
          "k": true
        },
        {
          "t": "daybreak",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "noon",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "morning",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Sunset reverses the daylight transition. Daybreak names its beginning; noon and morning name other points within daylight.",
      "retention": true
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 7,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means completely soaked, not just slightly wet?",
      "spoken": "Which word means completely soaked, not just slightly wet?",
      "choices": [
        {
          "t": "drenched",
          "r": "KEY",
          "k": true
        },
        {
          "t": "dry",
          "r": "D-OPPOSITE"
        },
        {
          "t": "damp",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "wet",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Drenched preserves complete soaking. Damp is slight wetness and wet alone does not specify the extent.",
      "retention": true
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 8,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means extremely pleased?",
      "spoken": "Which word means extremely pleased?",
      "choices": [
        {
          "t": "thrilled",
          "r": "KEY",
          "k": true
        },
        {
          "t": "unhappy",
          "r": "D-OPPOSITE"
        },
        {
          "t": "pleased",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "glad",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Thrilled conveys intense pleasure; pleased and glad state happiness without that extreme degree.",
      "retention": true
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The cork floats. A stone does the opposite: it ___.",
      "spoken": "Which opposite word fits: The cork floats. A stone does the opposite: it hmm.",
      "sentence": "The cork floats. A stone does the opposite: it ___.",
      "choices": [
        {
          "t": "sinks",
          "r": "KEY",
          "k": true
        },
        {
          "t": "drifts",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "bobs",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "sails",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Sinking reverses staying on the surface. Drifting, bobbing and sailing can all occur at the surface.",
      "retention": true
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 7,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: The old map was torn. It was ___.",
      "spoken": "Which same-meaning word fits? The old map was torn. It was hmm.",
      "sentence": "The old map was torn. It was ___.",
      "choices": [
        {
          "t": "ripped",
          "r": "KEY",
          "k": true
        },
        {
          "t": "mended",
          "r": "D-OPPOSITE"
        },
        {
          "t": "folded",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "creased",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Ripped matches torn, describing broken material. Folded and creased change shape without a tear; mended repairs the damage.",
      "retention": true
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "push — pull",
          "r": "KEY",
          "k": true
        },
        {
          "t": "push — press",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "push — shove",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "push — nudge",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 10,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "A fast car moves quickly. Choose the opposite of fast.",
      "spoken": "A fast car moves quickly. Choose the opposite of fast.",
      "choices": [
        {
          "t": "slow",
          "r": "KEY",
          "k": true
        },
        {
          "t": "speedy",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "quick",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "rapid",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 9,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "near — close",
          "r": "KEY",
          "k": true
        },
        {
          "t": "near — far",
          "r": "D-OPPOSITE"
        },
        {
          "t": "near — above",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "near — behind",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "synonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 10,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The rope is strong. Which word means the same here?",
      "spoken": "The rope is strong. Which word means the same here?",
      "choices": [
        {
          "t": "tough",
          "r": "KEY",
          "k": true
        },
        {
          "t": "weak",
          "r": "D-OPPOSITE"
        },
        {
          "t": "thick",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "stiff",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "soft — hard",
          "r": "KEY",
          "k": true
        },
        {
          "t": "soft — fluffy",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "soft — squishy",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "soft — spongy",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Compare both members of each word pair."
    },
    {
      "u": "antonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 9,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The stone feels smooth. Choose the opposite of smooth.",
      "spoken": "The stone feels smooth. Choose the opposite of smooth.",
      "choices": [
        {
          "t": "rough",
          "r": "KEY",
          "k": true
        },
        {
          "t": "silky",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "slick",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "even",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 8,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Close the lid. Which word means the same as close?",
      "spoken": "Close the lid. Which word means the same as close?",
      "choices": [
        {
          "t": "shut",
          "r": "KEY",
          "k": true
        },
        {
          "t": "open",
          "r": "D-OPPOSITE"
        },
        {
          "t": "lift",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "turn",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "The sentence fixes close as the action of shutting, rather than the adjective meaning near."
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 9,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The child feels ill. Which word means the same here?",
      "spoken": "The child feels ill. Which word means the same here?",
      "choices": [
        {
          "t": "sick",
          "r": "KEY",
          "k": true
        },
        {
          "t": "well",
          "r": "D-OPPOSITE"
        },
        {
          "t": "tired",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "hungry",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": ""
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word is the opposite of 'carefully'?",
      "spoken": "Which word is the opposite of 'carefully'?",
      "choices": [
        {
          "t": "carelessly",
          "r": "KEY",
          "k": true
        },
        {
          "t": "gently",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "slowly",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "neatly",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Carelessly reverses attention to an action. Gently, slowly and neatly change force, speed or tidiness without making an action careless."
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 10,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The towel was soaked. Its opposite is completely ___.",
      "spoken": "Which opposite word fits? The towel was soaked. Its opposite is completely hmm.",
      "sentence": "The towel was soaked. Its opposite is completely ___.",
      "choices": [
        {
          "t": "dry",
          "r": "KEY",
          "k": true
        },
        {
          "t": "wet",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "damp",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "dripping",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Completely dry reverses being soaked. Damp is less wet, but still wet; dripping names a visible result of excess water."
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 9,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means angry enough to rage?",
      "spoken": "Which word means angry enough to rage?",
      "choices": [
        {
          "t": "furious",
          "r": "KEY",
          "k": true
        },
        {
          "t": "calm",
          "r": "D-OPPOSITE"
        },
        {
          "t": "annoyed",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "upset",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Furious names strong anger. Annoyed is weaker irritation; upset is a broader negative feeling."
    },
    {
      "u": "synonym_shade",
      "lvl": 2,
      "ph": 1,
      "v": 10,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits best: The puppy was exhausted, meaning very ___.",
      "spoken": "Which same-meaning word fits best? The puppy was exhausted, meaning very hmm.",
      "sentence": "The puppy was exhausted, meaning very ___.",
      "choices": [
        {
          "t": "tired",
          "r": "KEY",
          "k": true
        },
        {
          "t": "energetic",
          "r": "D-OPPOSITE"
        },
        {
          "t": "calm",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "quiet",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Exhausted means very tired, as the sentence requests. Quiet and calm do not imply lack of energy."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The balloon expanded. Which pair reverses that change?",
      "spoken": "The balloon expanded. Which pair reverses that change?",
      "choices": [
        {
          "t": "expanded — shrank",
          "r": "KEY",
          "k": true
        },
        {
          "t": "expanded — stretched",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "expanded — swelled",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "expanded — grew",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Expanded means became larger; shrank reverses that change. Stretching, swelling and growing move toward greater extent."
    },
    {
      "u": "antonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 9,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which opposite word fits: The water rose. Later it did the opposite: it ___.",
      "spoken": "Which opposite word fits? The water rose. Later it did the opposite: it hmm.",
      "sentence": "The water rose. Later it did the opposite: it ___.",
      "choices": [
        {
          "t": "fell",
          "r": "KEY",
          "k": true
        },
        {
          "t": "climbed",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "flowed",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "rippled",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "The water-level context fixes rose as upward movement. Fell reverses that direction; flowing and rippling describe different water motions."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 8,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "The child was brave. Which pair means the same here?",
      "spoken": "The child was brave. Which pair means the same here?",
      "choices": [
        {
          "t": "brave — bold",
          "r": "KEY",
          "k": true
        },
        {
          "t": "brave — fearful",
          "r": "D-OPPOSITE"
        },
        {
          "t": "brave — reckless",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "brave — stubborn",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Bold matches brave as willingness despite risk. Reckless ignores danger; stubborn refuses to change a decision. Neither necessarily shows courage."
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 9,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: He spoke in a quiet voice: a ___ voice.",
      "spoken": "Which same-meaning word fits? He spoke in a quiet voice: a hmm voice.",
      "sentence": "He spoke in a quiet voice: a ___ voice.",
      "choices": [
        {
          "t": "soft",
          "r": "KEY",
          "k": true
        },
        {
          "t": "loud",
          "r": "D-OPPOSITE"
        },
        {
          "t": "deep",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "high",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Soft preserves quiet as vocal volume. Deep and high concern pitch, while loud reverses volume."
    },
    {
      "u": "antonym_concrete",
      "lvl": 1,
      "ph": 1,
      "v": 31,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Which pair has opposite meanings?",
      "spoken": "Which pair has opposite meanings?",
      "choices": [
        {
          "t": "give — take",
          "r": "KEY",
          "k": true
        },
        {
          "t": "give — lend",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "give — share",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "give — offer",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Take reverses the direction of giving. Lending, sharing and offering are related ways of making something available.",
      "retention": true
    },
    {
      "u": "synonym_picture",
      "lvl": 1,
      "ph": 2,
      "v": 31,
      "fmt": "WORD_RELATION_TEXT_CHOICE",
      "prompt": "Find two words that mean the same.",
      "spoken": "Find two words that mean the same.",
      "choices": [
        {
          "t": "neat — tidy",
          "r": "KEY",
          "k": true
        },
        {
          "t": "neat — messy",
          "r": "D-OPPOSITE"
        },
        {
          "t": "neat — bare",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "neat — fancy",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Tidy matches neat. Messy reverses order; bare and fancy describe decoration rather than tidiness.",
      "retention": true
    },
    {
      "u": "antonym_precise",
      "lvl": 2,
      "ph": 1,
      "v": 31,
      "fmt": "LANGUAGE_PAIR_TEXT_CHOICE",
      "prompt": "Which word means the opposite of 'include'?",
      "spoken": "Which word means the opposite of 'include'?",
      "choices": [
        {
          "t": "exclude",
          "r": "KEY",
          "k": true
        },
        {
          "t": "contain",
          "r": "D-SAME-DOMAIN"
        },
        {
          "t": "add",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "collect",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Exclude reverses membership or inclusion. Contain, add and collect can all put something into a group.",
      "retention": true
    },
    {
      "u": "synonym_in_context",
      "lvl": 2,
      "ph": 2,
      "v": 31,
      "fmt": "WORD_IN_SENTENCE_SWAP",
      "prompt": "Which same-meaning word fits: The treasure was concealed, meaning ___.",
      "spoken": "Which same-meaning word fits? The treasure was concealed, meaning hmm.",
      "sentence": "The treasure was concealed, meaning ___.",
      "choices": [
        {
          "t": "hidden",
          "r": "KEY",
          "k": true
        },
        {
          "t": "visible",
          "r": "D-OPPOSITE"
        },
        {
          "t": "lost",
          "r": "D-TOPIC-ADJACENT"
        },
        {
          "t": "buried",
          "r": "D-SAME-DOMAIN"
        }
      ],
      "media": "text",
      "note": "Hidden matches concealed; buried is one possible method, and lost does not require concealment.",
      "retention": true
    }
  ]
};
