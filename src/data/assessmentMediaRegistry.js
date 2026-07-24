import {
  audioPreferenceManifest,
  getApprovedAudioPath,
  isDeprecatedAudioPath
} from "./audioPreferenceManifest.js";
import { childWordAssets, getChildWordAsset } from "./childAssets.js";
import { importedVocabularyMediaManifest } from "./importedVocabularyMediaManifest.js";
import { kimiVocabulary500Lexicon } from "./kimiVocabulary500Lexicon.js";
import { endingSoundLevelQuestions } from "./finalSoundCoverageQuestions.js";
import { k3VocabularyMedia } from "./generated/k3VocabularyMediaManifest.generated.js";
import { kimiAssets2WordAssets } from "./kimiAssets2Manifest.js";
import { kimiAssets3WordAssets } from "./kimiAssets3Manifest.js";
import { kimiAssets4WordAssets } from "./kimiAssets4Manifest.js";
import { isMediaQaRuntimeAllowed } from "./mediaQaManifest.js";
import { legacyInitialSoundImageRegistry } from "./generated/legacyInitialSoundImageRegistry.generated.js";
import {
  hfwAssessmentImageVariants,
  rhymingAssessmentImageVariants
} from "./generated/assessmentImageVariants.generated.js";
import {
  kimiHighQualityMediaStyleImageTasks,
  kimiHighQualityMediaStyleAudioTasks
} from "./generated/kimiHighQualityMediaStyleManifest.generated.js";
import {
  HFW_WORDS_1_25,
  HFW_WORDS_26_50,
  HFW_WORDS_51_75,
  HFW_WORDS_76_100
} from "./highFrequencyWordBands.js";
import { initialSoundWordBank } from "../content/initialSounds/initialSoundWordBank.js";

const HFW_BANDS = {
  hfw_1_25: HFW_WORDS_1_25,
  hfw_26_50: HFW_WORDS_26_50,
  hfw_51_75: HFW_WORDS_51_75,
  hfw_76_100: HFW_WORDS_76_100
};

const EARLY_ASSESSMENT_SKILLS = new Set([
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "hfw_1_25",
  "hfw_26_50",
  "hfw_51_75",
  "hfw_76_100"
]);
const VARIATION_MANAGED_ASSESSMENT_SKILLS = new Set([
  ...EARLY_ASSESSMENT_SKILLS,
  "nouns",
  "verbs",
  "adjectives",
  "prepositions",
  "plurals",
  "antonyms_synonyms",
  "homophones_homonyms",
  "r_controlled",
  "r_controlled_vowels"
]);

const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|webp|svg)$/i;
const AUDIO_EXTENSIONS = /\.(?:mp3|m4a|wav|ogg)$/i;
const CONSONANTS = "bcdfghjklmnpqrstvwxyz";

export function normalizeAssessmentMediaWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^(?:noun|verb|adjective|preposition|plural|antonym|synonym)[-_\s]+/i, "")
    .replace(/[^a-z0-9'-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeToken(value = "") {
  return normalizeAssessmentMediaWord(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function normalizeAssessmentSkillId(value = "") {
  const text = String(value || "").toLowerCase().replace(/&/g, "and");
  if (text.includes("initial")) return "initial_sounds";
  if (text.includes("final") || text.includes("ending")) return "final_sounds";
  if (text.includes("rhym")) return "rhyming";
  if (text.includes("short_vowel_discrimination") || text.includes("short vowel discrimination")) return "short_vowel_discrimination";
  if (text.includes("cvc") || text.includes("short vowel")) return "cvc_short_vowels";
  if (text.includes("hfw") || text.includes("high frequency")) {
    if (text.includes("26") || text.includes("50")) return "hfw_26_50";
    if (text.includes("51") || text.includes("75")) return "hfw_51_75";
    if (text.includes("76") || text.includes("100")) return "hfw_76_100";
    return "hfw_1_25";
  }
  if (text.includes("prepositions_of_place") || text.includes("preposition")) return "prepositions";
  if (text.includes("prefix_suffix") || text.includes("prefixes_suffixes") || text.includes("prefix") || text.includes("suffix")) return "prefixes_suffixes";
  if (text.includes("homophones_homonyms") || text.includes("homophone") || text.includes("homonym")) return "homophones_homonyms";
  if (text.includes("antonyms_synonyms") || text.includes("antonym") || text.includes("synonym")) return "antonyms_synonyms";
  return text.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function wordLooksCvc(word = "") {
  return new RegExp(`^[${CONSONANTS}][aeiou][${CONSONANTS}]$`).test(word);
}

function getWordRime(word = "") {
  const value = normalizeAssessmentMediaWord(word);
  const index = value.search(/[aeiou]/);
  return index >= 0 ? value.slice(index) : "";
}

function getPhonicsPatternTags(word = "", extra = []) {
  const normalized = normalizeAssessmentMediaWord(word);
  return unique([
    wordLooksCvc(normalized) ? "cvc" : "",
    getWordRime(normalized) ? `rime:${getWordRime(normalized)}` : "",
    normalized[0] ? `initial:${normalized[0]}` : "",
    normalized.slice(-1) ? `final:${normalized.slice(-1)}` : "",
    ...extra
  ]);
}

function inferSkillTags(word = "", explicit = []) {
  const normalized = normalizeAssessmentMediaWord(word);
  const hfwSkills = Object.entries(HFW_BANDS)
    .filter(([, words]) => words.map(normalizeAssessmentMediaWord).includes(normalized))
    .map(([skillId]) => skillId);
  return unique([
    ...explicit,
    normalized ? "initial_sounds" : "",
    normalized ? "final_sounds" : "",
    wordLooksCvc(normalized) ? "cvc_short_vowels" : "",
    wordLooksCvc(normalized) ? "short_vowel_discrimination" : "",
    ...hfwSkills
  ]).filter(skillId => !skillId || EARLY_ASSESSMENT_SKILLS.has(skillId));
}

function inferAudioType(path = "", word = "") {
  const lower = String(path || "").toLowerCase();
  const normalized = normalizeAssessmentMediaWord(word);
  const fileWord = normalizeAssessmentMediaWord(String(path || "").split("/").pop() || "");
  if (normalized && fileWord === normalized) return "whole_word";
  if (/\/(?:graphemes|phonemes|letter-sounds|sounds)\//.test(lower)) return "phoneme";
  if (/\/(?:letters|alphabet)\//.test(lower)) return "letter";
  if (normalized.split(" ").length > 1) return "sentence";
  if (/\/(?:phrases|sentences|hfw-scenes|story|narration)\//.test(lower)) return "sentence";
  if (normalized) return "whole_word";
  return "unknown";
}

function inferImageRole(path = "", sourceManifest = "", explicitRole = "") {
  if (explicitRole) return explicitRole;
  const lower = `${path} ${sourceManifest}`.toLowerCase();
  if (lower.includes("assessment/hfw") || lower.includes("hfw")) return "hfw_scene";
  if (lower.includes("assessment/rhyming") || lower.includes("rhyming")) return "rhyming_target";
  if (/\/(?:noun|verb|adjective|preposition|plural|antonym|synonym)[-_]/.test(lower)) return "grammar_pos";
  if (lower.includes("child-mode") || lower.includes("vocabulary")) return "generic_word";
  return "target_object";
}

function parseVariantNumber(path = "") {
  const match = String(path || "").match(/(?:variant|v|p|scene)[-_]?(\d+)|[-_](\d{1,3})(?=\.[a-z0-9]+$)/i);
  return Number(match?.[1] || match?.[2] || 0) || 0;
}

function makeAvailability({ path, mediaType, word, sourceManifest }) {
  const qaAllowed = isMediaQaRuntimeAllowed(path, mediaType);
  const approvedAudio = mediaType === "audio" ? getApprovedAudioPath(word, path) : path;
  const deprecated = mediaType === "audio" ? isDeprecatedAudioPath(path) : false;
  const available = Boolean(path && qaAllowed && !deprecated && (mediaType !== "audio" || approvedAudio === path));
  return {
    qaStatus: available ? "approved" : qaAllowed ? "review_needed" : "blocked",
    blocked: !qaAllowed,
    rejected: !qaAllowed,
    deprecated,
    available,
    notes: available ? "" : `Not runtime-approved by ${mediaType === "audio" ? "audio preference/" : ""}QA gate (${sourceManifest}).`
  };
}

function createRecord({
  mediaType,
  path,
  targetWord,
  skillTags = [],
  phonicsPatternTags = [],
  level = null,
  phase = null,
  audioType = "",
  imageRole = "",
  imageability = true,
  visualVariantGroup = "",
  variantNumber = 0,
  sourceManifest = "unknown",
  notes = ""
}) {
  const normalizedWord = normalizeAssessmentMediaWord(targetWord);
  const availability = makeAvailability({ path, mediaType, word: normalizedWord, sourceManifest });
  return {
    id: `${mediaType}:${path}`,
    mediaType,
    path,
    targetWord: normalizedWord,
    normalizedWord,
    phonicsPatternTags: getPhonicsPatternTags(normalizedWord, phonicsPatternTags),
    skillTags: unique(inferSkillTags(normalizedWord, skillTags)),
    level,
    phase,
    qaStatus: availability.qaStatus,
    blocked: availability.blocked,
    rejected: availability.rejected,
    deprecated: availability.deprecated,
    available: availability.available,
    audioType: mediaType === "audio" ? audioType || inferAudioType(path, normalizedWord) : "",
    imageRole: mediaType === "image" ? inferImageRole(path, sourceManifest, imageRole) : "",
    imageability: mediaType === "image" ? Boolean(imageability) : false,
    visualVariantGroup: visualVariantGroup || `${mediaType}:${normalizedWord || "unknown"}`,
    variantNumber: variantNumber || parseVariantNumber(path),
    sourceManifest,
    notes: notes || availability.notes
  };
}

function mergeRecords(records = []) {
  const byId = new Map();
  for (const record of records.filter(item => item?.path)) {
    const prior = byId.get(record.id);
    if (!prior) {
      byId.set(record.id, record);
      continue;
    }
    byId.set(record.id, {
      ...prior,
      targetWord: prior.targetWord || record.targetWord,
      normalizedWord: prior.normalizedWord || record.normalizedWord,
      phonicsPatternTags: unique([...(prior.phonicsPatternTags || []), ...(record.phonicsPatternTags || [])]),
      skillTags: unique([...(prior.skillTags || []), ...(record.skillTags || [])]),
      level: prior.level ?? record.level,
      phase: prior.phase ?? record.phase,
      available: prior.available || record.available,
      qaStatus: prior.available || record.available ? "approved" : prior.qaStatus,
      blocked: prior.blocked && record.blocked,
      rejected: prior.rejected && record.rejected,
      deprecated: prior.deprecated && record.deprecated,
      sourceManifest: unique([prior.sourceManifest, record.sourceManifest]).join(", "),
      notes: unique([prior.notes, record.notes]).join(" ")
    });
  }
  return [...byId.values()].sort((a, b) => a.mediaType.localeCompare(b.mediaType) || a.path.localeCompare(b.path));
}

function recordsFromChildAssets() {
  return Object.entries(childWordAssets).flatMap(([key, asset]) => {
    const word = normalizeAssessmentMediaWord(asset?.word || key);
    const resolvedAsset = getChildWordAsset(word) || asset;
    return [
      resolvedAsset?.image ? createRecord({
        mediaType: "image",
        path: resolvedAsset.image,
        targetWord: word,
        imageRole: "generic_word",
        visualVariantGroup: `word:${word}`,
        sourceManifest: "childWordAssets"
      }) : null,
      resolvedAsset?.audio ? createRecord({
        mediaType: "audio",
        path: resolvedAsset.audio,
        targetWord: word,
        audioType: "whole_word",
        visualVariantGroup: `word:${word}`,
        sourceManifest: "childWordAssets"
      }) : null
    ].filter(Boolean);
  });
}

function recordsFromK3VocabularyMedia() {
  return Object.entries(k3VocabularyMedia).flatMap(([key, asset]) => {
    const targetWord = normalizeAssessmentMediaWord(asset?.textSpoken || key);
    return [
      asset?.image ? createRecord({
        mediaType: "image",
        path: asset.image,
        targetWord,
        imageRole: "generic_word",
        visualVariantGroup: `k3-vocabulary:${normalizeToken(targetWord)}`,
        sourceManifest: "k3VocabularyMedia",
        notes: "Approved K-3 vocabulary image used by runtime assessment questions."
      }) : null,
      asset?.audio ? createRecord({
        mediaType: "audio",
        path: asset.audio,
        targetWord,
        audioType: "whole_word",
        visualVariantGroup: `k3-vocabulary:${normalizeToken(targetWord)}`,
        sourceManifest: "k3VocabularyMedia",
        notes: "Approved K-3 vocabulary audio used by runtime assessment questions."
      }) : null
    ].filter(Boolean);
  });
}

function recordsFromKimiAssetPacks() {
  return [
    ["kimiAssets2WordAssets", kimiAssets2WordAssets],
    ["kimiAssets3WordAssets", kimiAssets3WordAssets],
    ["kimiAssets4WordAssets", kimiAssets4WordAssets]
  ].flatMap(([sourceManifest, assets]) =>
    Object.entries(assets).flatMap(([key, asset]) => {
      const targetWord = normalizeAssessmentMediaWord(asset?.word || key);
      return [
        asset?.image ? createRecord({
          mediaType: "image",
          path: asset.image,
          targetWord,
          imageRole: "generic_word",
          visualVariantGroup: `${sourceManifest}:${normalizeToken(targetWord)}`,
          sourceManifest,
          notes: asset.notes || asset.imageNote || ""
        }) : null,
        asset?.audio ? createRecord({
          mediaType: "audio",
          path: asset.audio,
          targetWord,
          audioType: "whole_word",
          visualVariantGroup: `${sourceManifest}:${normalizeToken(targetWord)}`,
          sourceManifest,
          notes: asset.notes || asset.audioNote || ""
        }) : null
      ].filter(Boolean);
    })
  );
}

function recordsFromImportedVocabulary() {
  return Object.entries(importedVocabularyMediaManifest).flatMap(([key, asset]) => {
    const word = normalizeAssessmentMediaWord(asset?.textSpoken || asset?.key || key);
    const imageRole = /^(?:noun|verb|adjective|preposition|plural|antonym|synonym)[-_]/i.test(asset?.key || key)
      ? "grammar_pos"
      : "generic_word";
    return [
      asset?.image ? createRecord({
        mediaType: "image",
        path: asset.image,
        targetWord: word,
        imageRole,
        visualVariantGroup: `${imageRole}:${word}`,
        sourceManifest: "importedVocabularyMediaManifest"
      }) : null,
      asset?.audio ? createRecord({
        mediaType: "audio",
        path: asset.audio,
        targetWord: word,
        audioType: inferAudioType(asset.audio, word),
        visualVariantGroup: `audio:${word}`,
        sourceManifest: "importedVocabularyMediaManifest"
      }) : null
    ].filter(Boolean);
  });
}

function kimiSkillTags(entry = {}) {
  const skills = entry.skills || {};
  return unique([
    skills.initialSounds?.eligible ? "initial_sounds" : "",
    skills.finalSounds?.eligible ? "final_sounds" : "",
    skills.rhyming?.eligible ? "rhyming" : "",
    skills.cvcShortVowels?.eligible ? "cvc_short_vowels" : "",
    skills.cvcShortVowels?.eligible ? "short_vowel_discrimination" : "",
    skills.blends?.eligible ? "blends" : "",
    skills.digraphs?.eligible ? "digraphs" : "",
    skills.longVowelsSilentE?.eligible ? "long_vowels_silent_e" : "",
    skills.vowelTeams?.eligible ? "vowel_teams" : "",
    skills.rControlledVowels?.eligible ? "r_controlled_vowels" : ""
  ]);
}

function recordsFromKimiVocabularyLexicon() {
  return kimiVocabulary500Lexicon.flatMap(entry => {
    if (entry?.status !== "approved") return [];
    const targetWord = entry.normalizedWord || entry.word;
    const skillTags = kimiSkillTags(entry);
    return [
      entry.imagePath && entry.isImageable !== false ? createRecord({
        mediaType: "image",
        path: entry.imagePath,
        targetWord,
        skillTags,
        level: entry.recommendedLevel,
        imageRole: "generic_word",
        imageability: entry.isImageable !== false,
        visualVariantGroup: `kimi-vocabulary:${normalizeToken(targetWord)}`,
        sourceManifest: "kimiVocabulary500Lexicon",
        notes: entry.notes
      }) : null,
      entry.audioPath ? createRecord({
        mediaType: "audio",
        path: entry.audioPath,
        targetWord,
        skillTags,
        level: entry.recommendedLevel,
        audioType: "whole_word",
        visualVariantGroup: `kimi-vocabulary:${normalizeToken(targetWord)}`,
        sourceManifest: "kimiVocabulary500Lexicon",
        notes: entry.notes
      }) : null
    ].filter(Boolean);
  });
}

function recordsFromFinalSoundOverrides() {
  return endingSoundLevelQuestions.flatMap(question => {
    const targetWord = normalizeAssessmentMediaWord(question.targetWord || question.audioText);
    return [
      question.imagePath ? createRecord({
        mediaType: "image",
        path: question.imagePath,
        targetWord,
        skillTags: ["final_sounds", "cvc_short_vowels", "short_vowel_discrimination"],
        level: question.level,
        phase: question.phase,
        imageRole: "target_object",
        visualVariantGroup: `final-sound:${normalizeToken(targetWord)}`,
        sourceManifest: "finalSoundCoverageQuestions",
        notes: "Exact target image used by the approved Final Sounds assessment bank."
      }) : null,
      question.audioPath ? createRecord({
        mediaType: "audio",
        path: question.audioPath,
        targetWord,
        skillTags: ["final_sounds", "cvc_short_vowels", "short_vowel_discrimination"],
        level: question.level,
        phase: question.phase,
        audioType: "whole_word",
        visualVariantGroup: `final-sound:${normalizeToken(targetWord)}`,
        sourceManifest: "finalSoundCoverageQuestions",
        notes: "Exact target audio used by the approved Final Sounds assessment bank."
      }) : null
    ].filter(Boolean);
  });
}

function recordsFromAudioPreferences() {
  return Object.entries(audioPreferenceManifest).flatMap(([key, preference]) => {
    if (preference?.status !== "approved" || !preference.preferredAudioPath) return [];
    const word = normalizeAssessmentMediaWord(key.replace(/^hfw:/i, ""));
    if (!word) return [];
    return createRecord({
      mediaType: "audio",
      path: preference.preferredAudioPath,
      targetWord: word,
      audioType: inferAudioType(preference.preferredAudioPath, word),
      visualVariantGroup: `audio-preference:${word}`,
      sourceManifest: "audioPreferenceManifest"
    });
  });
}

function recordsFromHfwVariants() {
  const out = [];
  for (const [skillId, words] of Object.entries(hfwAssessmentImageVariants || {})) {
    for (const [word, phases] of Object.entries(words || {})) {
      for (const [phaseKey, paths] of Object.entries(phases || {})) {
        const level = phaseKey.includes("l2") ? 2 : 1;
        const phase = phaseKey.includes("p2") ? 2 : 1;
        (paths || []).forEach((assetPath, index) => {
          out.push(createRecord({
            mediaType: "image",
            path: assetPath,
            targetWord: word,
            skillTags: [skillId],
            level,
            phase,
            imageRole: "hfw_scene",
            visualVariantGroup: `hfw:${skillId}:${normalizeToken(word)}:${phaseKey}`,
            variantNumber: index + 1,
            sourceManifest: "assessmentImageVariants:hfw"
          }));
        });
      }
    }
  }
  return out;
}

function recordsFromRhymingVariants() {
  const out = [];
  for (const [family, words] of Object.entries(rhymingAssessmentImageVariants || {})) {
    for (const [word, paths] of Object.entries(words || {})) {
      (paths || []).forEach((assetPath, index) => {
        out.push(createRecord({
          mediaType: "image",
          path: assetPath,
          targetWord: word,
          skillTags: ["rhyming"],
          phonicsPatternTags: [`rime:${family}`],
          imageRole: "rhyming_target",
          visualVariantGroup: `rhyming:${family}:${normalizeToken(word)}`,
          variantNumber: index + 1,
          sourceManifest: "assessmentImageVariants:rhyming"
        }));
      });
    }
  }
  return out;
}

function recordsFromInitialSoundBank() {
  return initialSoundWordBank.flatMap(item => {
    const wordKey = normalizeToken(item.targetWord).replace(/_/g, "-");
    return [
      item.imageUrl ? createRecord({
      mediaType: "image",
      path: item.imageUrl,
      targetWord: item.targetWord,
      skillTags: ["initial_sounds"],
      level: item.level,
      imageRole: "target_object",
      visualVariantGroup: `initial:${item.letter}:${normalizeToken(item.targetWord)}`,
      sourceManifest: "initialSoundWordBank",
      notes: item.active === false ? item.qaNotes || "Inactive Initial Sounds item." : ""
      }) : null,
      createRecord({
        mediaType: "image",
        path: `/images/child-mode/initial-sounds/${wordKey}.png`,
        targetWord: item.targetWord,
        skillTags: ["initial_sounds", "final_sounds", "cvc_short_vowels", "short_vowel_discrimination"],
        level: item.level,
        imageRole: "target_object",
        visualVariantGroup: `initial-legacy:${item.letter}:${normalizeToken(item.targetWord)}`,
        sourceManifest: "initialSoundWordBank:legacy-child-mode",
        notes: "Legacy child-mode Initial Sounds asset path indexed so live assessment rows are not invisible to the registry."
      }),
      item.audioUrl ? createRecord({
      mediaType: "audio",
      path: item.audioUrl,
      targetWord: item.targetWord,
      skillTags: ["initial_sounds"],
      level: item.level,
      audioType: "whole_word",
      visualVariantGroup: `initial:${item.letter}:${normalizeToken(item.targetWord)}`,
      sourceManifest: "initialSoundWordBank",
      notes: item.active === false ? item.qaNotes || "Inactive Initial Sounds item." : ""
      }) : null
    ].filter(Boolean);
  });
}

function recordsFromLegacyInitialSoundImages() {
  return Object.entries(legacyInitialSoundImageRegistry).map(([assetPath, word]) =>
    createRecord({
      mediaType: "image",
      path: assetPath,
      targetWord: word,
      skillTags: ["initial_sounds", "final_sounds", "cvc_short_vowels", "short_vowel_discrimination"],
      imageRole: "target_object",
      visualVariantGroup: `legacy-initial-image:${normalizeToken(word)}`,
      sourceManifest: "legacyInitialSoundImageRegistry",
      notes: "Existing child-mode Initial Sounds image indexed for assessment media resolution."
    })
  );
}

function recordsFromHfwBaseImages() {
  return Object.entries(HFW_BANDS).flatMap(([skillId, words]) =>
    words.map(word => createRecord({
      mediaType: "image",
      path: `/images/assessment/hfw/${normalizeToken(word).replace(/_/g, "-")}.webp`,
      targetWord: word,
      skillTags: [skillId],
      imageRole: "hfw_scene",
      visualVariantGroup: `hfw:${skillId}:${normalizeToken(word)}:base`,
      sourceManifest: "assessment:hfw-base-images",
      notes: "Base HFW assessment image indexed as approved fallback when the variant pack lacks a specific phase scene."
    }))
  );
}

function imageRoleForKimiHighQualityTask(task = {}) {
  if (task.skillId === "nouns" || task.itemType === "noun") return "noun_image";
  if (task.skillId === "verbs" || task.itemType === "verb") return "verb_action";
  if (task.skillId === "adjectives" || task.itemType === "adjective") return "adjective_visual";
  if (task.skillId === "prepositions") return "preposition_scene";
  if (task.skillId === "plurals" || task.itemType === "plural") return "plural_pair";
  if (task.skillId === "antonyms_synonyms") return "antonym_synonym_scene";
  if (task.skillId === "homophones_homonyms") return "homophone_context";
  if (task.skillId === "hfw_1_25" || task.skillId === "hfw_26_50" || task.skillId === "hfw_51_75" || task.skillId === "hfw_76_100") return "hfw_scene";
  if (task.skillId === "rhyming") return "rhyming_target";
  return "grammar_pos";
}

function recordsFromKimiHighQualityMediaStyle() {
  return [
    ...kimiHighQualityMediaStyleImageTasks.map(task => ({
      ...createRecord({
        mediaType: "image",
        path: task.path,
        targetWord: task.targetWord,
        skillTags: [task.skillId],
        imageRole: imageRoleForKimiHighQualityTask(task),
        visualVariantGroup: `kimi-high-quality:${task.skillId}:${normalizeToken(task.pair || task.targetWord)}`,
        sourceManifest: "kimiHighQualityMediaStyleManifest",
        notes: task.reason
      }),
      id: `image:${task.path}:${normalizeToken(task.targetWord)}`
    })),
    ...kimiHighQualityMediaStyleAudioTasks.map(task =>
      createRecord({
        mediaType: "audio",
        path: task.path,
        targetWord: task.targetWord,
        skillTags: [task.skillId],
        audioType: "whole_word",
        visualVariantGroup: `kimi-high-quality-audio:${normalizeToken(task.targetWord)}`,
        sourceManifest: "kimiHighQualityMediaStyleManifest",
        notes: task.reason
      })
    )
  ];
}

let cachedRegistry = null;
let cachedRegistryByPath = null;
let cachedRegistryByTypeAndWord = null;

export function getAssessmentMediaRegistry() {
  if (!cachedRegistry) {
    cachedRegistry = mergeRecords([
      ...recordsFromChildAssets(),
      ...recordsFromKimiAssetPacks(),
      ...recordsFromK3VocabularyMedia(),
      ...recordsFromImportedVocabulary(),
      ...recordsFromKimiVocabularyLexicon(),
      ...recordsFromFinalSoundOverrides(),
      ...recordsFromAudioPreferences(),
      ...recordsFromInitialSoundBank(),
      ...recordsFromLegacyInitialSoundImages(),
      ...recordsFromHfwBaseImages(),
      ...recordsFromHfwVariants(),
      ...recordsFromRhymingVariants(),
      ...recordsFromKimiHighQualityMediaStyle()
    ].filter(record => {
      if (!record?.path) return false;
      return record.mediaType === "image" ? IMAGE_EXTENSIONS.test(record.path) : AUDIO_EXTENSIONS.test(record.path);
    }));
    cachedRegistryByPath = new Map();
    cachedRegistryByTypeAndWord = new Map();
    for (const record of cachedRegistry) {
      const pathKey = `${record.mediaType}:${record.path}`;
      if (!cachedRegistryByPath.has(pathKey)) cachedRegistryByPath.set(pathKey, record);
      const wordKey = `${record.mediaType}:${record.normalizedWord}`;
      const records = cachedRegistryByTypeAndWord.get(wordKey) || [];
      records.push(record);
      cachedRegistryByTypeAndWord.set(wordKey, records);
    }
  }
  return cachedRegistry;
}

export const assessmentMediaRegistry = getAssessmentMediaRegistry();

export function getAssessmentMediaByPath(path = "", mediaType = "") {
  const normalizedPath = String(path || "").trim();
  getAssessmentMediaRegistry();
  if (mediaType) {
    return cachedRegistryByPath.get(`${mediaType}:${normalizedPath}`) || null;
  }
  return cachedRegistryByPath.get(`image:${normalizedPath}`) ||
    cachedRegistryByPath.get(`audio:${normalizedPath}`) ||
    null;
}

export function isAssessmentMediaApproved(path = "", mediaType = "") {
  const record = getAssessmentMediaByPath(path, mediaType);
  return Boolean(record?.available);
}

export function findAssessmentMediaCandidates({
  word = "",
  skillId = "",
  mediaType = "image",
  role = "",
  audioType = "",
  level = null,
  phase = null,
  includeGenericFallback = true
} = {}) {
  const normalizedWord = normalizeAssessmentMediaWord(word);
  const normalizedSkillId = normalizeAssessmentSkillId(skillId);
  getAssessmentMediaRegistry();
  const sourceRecords = normalizedWord
    ? cachedRegistryByTypeAndWord.get(`${mediaType}:${normalizedWord}`) || []
    : cachedRegistry.filter(record => record.mediaType === mediaType);
  const seenPaths = new Set();
  return sourceRecords.filter(record => {
    if (!record.available) return false;
    if (normalizedSkillId && record.skillTags.length && !record.skillTags.includes(normalizedSkillId)) {
      if (!includeGenericFallback || !record.skillTags.some(tag => ["initial_sounds", "final_sounds", "cvc_short_vowels", "short_vowel_discrimination"].includes(tag))) {
        return false;
      }
    }
    if (role && mediaType === "image") {
      if (record.imageRole !== role) {
        const acceptableExactTargetRoles = role === "target_object"
          ? ["generic_word", "target_object", "rhyming_target", "grammar_pos", "noun_image", "verb_action", "adjective_visual", "plural_pair", "antonym_synonym_scene", "homophone_context"]
          : role === "plural_pair"
            ? ["generic_word", "target_object", "grammar_pos"]
            : ["generic_word", "target_object"];
        if (!includeGenericFallback || !acceptableExactTargetRoles.includes(record.imageRole)) return false;
      }
    }
    if (audioType && mediaType === "audio" && record.audioType !== audioType) return false;
    if (level && record.level && Number(record.level) !== Number(level)) return false;
    if (phase && record.phase && Number(record.phase) !== Number(phase)) return false;
    if (seenPaths.has(record.path)) return false;
    seenPaths.add(record.path);
    return true;
  });
}

export function isEarlyAssessmentMediaSkill(skillId = "") {
  return EARLY_ASSESSMENT_SKILLS.has(normalizeAssessmentSkillId(skillId));
}

export function isAssessmentMediaVariationSkill(skillId = "") {
  return VARIATION_MANAGED_ASSESSMENT_SKILLS.has(normalizeAssessmentSkillId(skillId));
}
