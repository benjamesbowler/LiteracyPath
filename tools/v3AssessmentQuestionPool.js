import { questions as adjectivesQuestions } from "../src/data/v3/banks/adjectives.v3.generated.js";
import { questions as antonymsSynonymsQuestions } from "../src/data/v3/banks/antonyms_synonyms.v3.generated.js";
import { questions as blendsQuestions } from "../src/data/v3/banks/blends.v3.generated.js";
import { questions as causeEffectQuestions } from "../src/data/v3/banks/cause_effect.v3.generated.js";
import { questions as contextCluesQuestions } from "../src/data/v3/banks/context_clues.v3.generated.js";
import { questions as cvcShortVowelsQuestions } from "../src/data/v3/banks/cvc_short_vowels.v3.generated.js";
import { questions as digraphsQuestions } from "../src/data/v3/banks/digraphs.v3.generated.js";
import { questions as finalSoundsQuestions } from "../src/data/v3/banks/final_sounds.v3.generated.js";
import { questions as hfw125Questions } from "../src/data/v3/banks/hfw_1_25.v3.generated.js";
import { questions as hfw2650Questions } from "../src/data/v3/banks/hfw_26_50.v3.generated.js";
import { questions as hfw5175Questions } from "../src/data/v3/banks/hfw_51_75.v3.generated.js";
import { questions as hfw76100Questions } from "../src/data/v3/banks/hfw_76_100.v3.generated.js";
import { questions as homophonesHomonymsQuestions } from "../src/data/v3/banks/homophones_homonyms.v3.generated.js";
import { questions as inferenceQuestions } from "../src/data/v3/banks/inference.v3.generated.js";
import { questions as initialSoundsQuestions } from "../src/data/v3/banks/initial_sounds.v3.generated.js";
import { questions as keyDetailsQuestions } from "../src/data/v3/banks/key_details.v3.generated.js";
import { questions as longVowelsQuestions } from "../src/data/v3/banks/long_vowels_silent_e.v3.generated.js";
import { questions as mainIdeaQuestions } from "../src/data/v3/banks/main_idea.v3.generated.js";
import { questions as nounsQuestions } from "../src/data/v3/banks/nouns.v3.generated.js";
import { questions as pluralsQuestions } from "../src/data/v3/banks/plurals.v3.generated.js";
import { questions as prefixesSuffixesQuestions } from "../src/data/v3/banks/prefixes_suffixes.v3.generated.js";
import { questions as prepositionsQuestions } from "../src/data/v3/banks/prepositions_of_place.v3.generated.js";
import { questions as rControlledVowelsQuestions } from "../src/data/v3/banks/r_controlled_vowels.v3.generated.js";
import { questions as rhymingQuestions } from "../src/data/v3/banks/rhyming.v3.generated.js";
import { questions as sentenceComprehensionQuestions } from "../src/data/v3/banks/sentence_comprehension.v3.generated.js";
import { questions as sequencingQuestions } from "../src/data/v3/banks/sequencing.v3.generated.js";
import { questions as shortVowelDiscriminationQuestions } from "../src/data/v3/banks/short_vowel_discrimination.v3.generated.js";
import { questions as themeQuestions } from "../src/data/v3/banks/theme_higher_comprehension.v3.generated.js";
import { questions as verbsQuestions } from "../src/data/v3/banks/verbs.v3.generated.js";
import { questions as vowelTeamsQuestions } from "../src/data/v3/banks/vowel_teams.v3.generated.js";
import { isV3PublishedSkill } from "../src/data/v3/v3Registry.js";

const V3_BANKS_BY_SKILL_ID = Object.freeze({
  initial_sounds: initialSoundsQuestions,
  final_sounds: finalSoundsQuestions,
  rhyming: rhymingQuestions,
  cvc_short_vowels: cvcShortVowelsQuestions,
  short_vowel_discrimination: shortVowelDiscriminationQuestions,
  hfw_1_25: hfw125Questions,
  hfw_26_50: hfw2650Questions,
  hfw_51_75: hfw5175Questions,
  hfw_76_100: hfw76100Questions,
  blends: blendsQuestions,
  digraphs: digraphsQuestions,
  long_vowels_silent_e: longVowelsQuestions,
  vowel_teams: vowelTeamsQuestions,
  r_controlled_vowels: rControlledVowelsQuestions,
  nouns: nounsQuestions,
  verbs: verbsQuestions,
  adjectives: adjectivesQuestions,
  prepositions_of_place: prepositionsQuestions,
  plurals: pluralsQuestions,
  prefixes_suffixes: prefixesSuffixesQuestions,
  antonyms_synonyms: antonymsSynonymsQuestions,
  homophones_homonyms: homophonesHomonymsQuestions,
  sentence_comprehension: sentenceComprehensionQuestions,
  key_details: keyDetailsQuestions,
  sequencing: sequencingQuestions,
  main_idea: mainIdeaQuestions,
  inference: inferenceQuestions,
  cause_effect: causeEffectQuestions,
  context_clues: contextCluesQuestions,
  theme_higher_comprehension: themeQuestions
});

export function getPublishedV3SkillIds() {
  return Object.keys(V3_BANKS_BY_SKILL_ID).filter(isV3PublishedSkill);
}

export function loadPublishedV3QuestionPool() {
  return getPublishedV3SkillIds().flatMap(skillId =>
    V3_BANKS_BY_SKILL_ID[skillId].map((question, index) => ({
      ...question,
      _source: `v3_${skillId}`,
      _sourceFile: `src/data/v3/banks/${skillId}.v3.generated.js`,
      _sourceIndex: index
    }))
  );
}
