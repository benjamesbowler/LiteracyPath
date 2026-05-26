export const masteryRules = {
  "Initial Sounds": {
    roundLength: 8,
    passScore: 7,
    reviewAfter: 15
  },

  "Final Sounds": {
    roundLength: 15,
    passScore: 12,
    reviewAfter: 15
  },

  "Rhyming": {
    roundLength: 8,
    passScore: 7,
    reviewAfter: 15
  },

  "CVC and Short Vowels": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "Short Vowel Discrimination": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "High-Frequency Words 1-25": {
    roundLength: 10,
    passScore: 9,
    reviewAfter: 20
  },

  "High-Frequency Words 26-50": {
    roundLength: 10,
    passScore: 9,
    reviewAfter: 20
  },

  "High-Frequency Words 51-100": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Blends": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "Digraphs": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "Long Vowels and Silent E": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Vowel Teams": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "R-Controlled Vowels": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Nouns": {
    roundLength: 8,
    passScore: 7,
    reviewAfter: 15
  },

  "Verbs": {
    roundLength: 8,
    passScore: 7,
    reviewAfter: 15
  },

  "Adjectives": {
    roundLength: 8,
    passScore: 7,
    reviewAfter: 15
  },

  "Prepositions of Place": {
    roundLength: 8,
    passScore: 7,
    reviewAfter: 15
  },

  "Plurals": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "Prefixes and Suffixes": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "Antonyms and Synonyms": {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  },

  "Homophones and Homonyms": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Sentence Comprehension": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Key Details": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Sequencing": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Main Idea": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Inference": {
    roundLength: 14,
    passScore: 12,
    reviewAfter: 30
  },

  "Cause and Effect": {
    roundLength: 12,
    passScore: 10,
    reviewAfter: 25
  },

  "Context Clues": {
    roundLength: 14,
    passScore: 12,
    reviewAfter: 30
  },

  "Theme and Higher Comprehension": {
    roundLength: 14,
    passScore: 12,
    reviewAfter: 30
  }
};

export function getMasteryRule(skillLabel) {
  const rule = masteryRules[skillLabel] || {
    roundLength: 10,
    passScore: 8,
    reviewAfter: 20
  };

  const originalRoundLength = Math.max(1, rule.roundLength || 10);
  const passRate = (rule.passScore || Math.ceil(originalRoundLength * 0.8)) / originalRoundLength;

  return {
    ...rule,
    roundLength: 15,
    passScore: Math.ceil(passRate * 15)
  };
}
