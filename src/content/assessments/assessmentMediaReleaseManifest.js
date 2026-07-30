import { getPreferredPhonemeAudioPath } from "../../data/phonemeAudioBank.js";

const INTERNAL_GENERATED_LICENSE = "Internal generated/commissioned asset; no third-party licence recorded";

function metadataForPath(filePath = "", mediaType = "") {
  if (filePath.includes("/audio/phonemes/") || filePath.includes("/audio/production/en-US/pattern/")) {
    return {
      source: "Human-reviewed LiteracyPath phoneme bank",
      license: INTERNAL_GENERATED_LICENSE,
      reviewStatus: "approved by human listening review",
      pronunciationVariant: mediaType === "audio" ? "General American; isolated phoneme or reviewed phonics pattern" : "n/a"
    };
  }
  if (filePath.includes("/clean-human/")) {
    return {
      source: "Kimi Pack 6 clean-human assessment audio",
      license: INTERNAL_GENERATED_LICENSE,
      reviewStatus: "approved preference or source-pack reviewed",
      pronunciationVariant: mediaType === "audio" ? "General American; exact standalone word or isolated phoneme" : "n/a"
    };
  }
  if (filePath.includes("/guided-reading/audio/words/")) {
    return {
      source: "Guided Reading deduplicated word-audio pack",
      license: INTERNAL_GENERATED_LICENSE,
      reviewStatus: "runtime allowed; source-pack pronunciation review inherited",
      pronunciationVariant: "General American; exact standalone word"
    };
  }
  if (filePath.includes("/audio/assessment/")) {
    return {
      source: "Assessment audio pack",
      license: INTERNAL_GENERATED_LICENSE,
      reviewStatus: "runtime approved assessment source",
      pronunciationVariant: "General American; exact standalone word"
    };
  }
  if (filePath.includes("/media/vocabulary/audio/")) {
    return {
      source: "Strict-media vocabulary repair pack",
      license: INTERNAL_GENERATED_LICENSE,
      reviewStatus: "runtime allowed; source-pack review inherited",
      pronunciationVariant: "General American; exact standalone word"
    };
  }
  if (filePath.includes("/images/assessment/")) {
    return {
      source: "Assessment image pack",
      license: INTERNAL_GENERATED_LICENSE,
      reviewStatus: "runtime allowed by image QA",
      pronunciationVariant: "n/a"
    };
  }
  return {
    source: "LiteracyPath public media",
    license: "No third-party licence recorded",
    reviewStatus: "runtime allowed",
    pronunciationVariant: mediaType === "audio" ? "General American" : "n/a"
  };
}

export function getAssessmentMediaSourceMetadata(filePath = "", mediaType = "") {
  return metadataForPath(filePath, mediaType);
}

function wiring(mediaType, target, filePath, questionIds) {
  return Object.freeze({
    mediaType,
    target,
    filePath,
    questionIds: Object.freeze(questionIds),
    ...metadataForPath(filePath, mediaType)
  });
}

export const assessmentMediaWiring = Object.freeze([
  wiring("audio", "p", getPreferredPhonemeAudioPath("p"), ["qb12_fs_017", "phonics_k_072"]),
  wiring("audio", "m", getPreferredPhonemeAudioPath("m"), ["qb12_fs_018"]),
  wiring("audio", "n", getPreferredPhonemeAudioPath("n"), ["qb12_fs_019", "qb12_fs_033", "phonics_k_046", "phonics_k_094"]),
  wiring("audio", "k", getPreferredPhonemeAudioPath("k"), ["qb12_fs_020", "phonics_k_048"]),
  wiring("audio", "sat", "/audio/child-mode/clean-human/words/sat.mp3", ["qb12_fs_024"]),
  wiring("audio", "sing", "/audio/child-mode/clean-human/words/sing.mp3", ["qb12_fs_027", "qb12_dg_021"]),
  wiring("image", "bath", "/images/assessment/digraphs/bath.webp", ["qb12_fs_028"]),
  wiring("audio", "bath", "/audio/child-mode/clean-human/words/bath.mp3", ["qb12_fs_028"]),
  wiring("audio", "t", getPreferredPhonemeAudioPath("t"), ["qb12_fs_032", "phonics_k_085"]),
  wiring("audio", "cash", "/media/vocabulary/audio/cash.mp3", ["gen_final_l2_sh_cash_2_word"]),
  wiring("audio", "fell", "/guided-reading/audio/words/fell.mp3", ["gen_final_l2_ll_fell_12_word"]),
  wiring("audio", "bang", "/guided-reading/audio/words/bang.mp3", ["gen_final_l2_ng_bang_0_word"]),
  wiring("audio", "hang", "/media/vocabulary/audio/hang.mp3", ["gen_final_l2_ng_hang_4_word"]),
  wiring("audio", "rang", "/guided-reading/audio/words/rang.mp3", ["gen_final_l2_ng_rang_7_word"]),
  wiring("audio", "song", "/audio/child-mode/clean-human/words/song.mp3", ["gen_final_l2_ng_song_9_word"]),
  wiring("audio", "bank", "/audio/child-mode/clean-human/words/bank.mp3", ["gen_final_l2_nk_bank_0_word"]),
  wiring("audio", "sink", "/audio/child-mode/clean-human/words/sink.mp3", ["gen_final_l2_nk_sink_4_word"]),
  wiring("audio", "g", getPreferredPhonemeAudioPath("g"), ["phonics_k_008", "phonics_k_052"]),
  wiring("audio", "span", "/media/vocabulary/audio/span.mp3", ["svd_l2p2_listen_short_a_span"]),
  wiring("audio", "shack", "/media/vocabulary/audio/shack.mp3", ["svd_l2p2_listen_short_a_shack"]),
  wiring("audio", "blend", "/media/vocabulary/audio/blend.mp3", ["svd_l2p2_listen_short_e_blend"]),
  wiring("audio", "melt", "/media/vocabulary/audio/melt.mp3", ["svd_l2p2_listen_short_e_melt"]),
  wiring("audio", "limp", "/media/vocabulary/audio/limp.mp3", ["svd_l2p2_listen_short_i_limp"]),
  wiring("audio", "crisp", "/media/vocabulary/audio/crisp.mp3", ["svd_l2p2_listen_short_i_crisp"]),
  wiring("audio", "slip", "/media/vocabulary/audio/slip.mp3", ["svd_l2p2_listen_short_i_slip"]),
  wiring("audio", "fist", "/media/vocabulary/audio/fist.mp3", ["svd_l2p2_listen_short_i_fist", "qb12_sv_018"]),
  wiring("audio", "trim", "/media/vocabulary/audio/trim.mp3", ["svd_l2p2_listen_short_i_trim"]),
  wiring("audio", "slug", "/media/vocabulary/audio/slug.mp3", ["svd_l2p2_listen_short_u_slug"]),
  wiring("audio", "set", "/guided-reading/audio/words/set.mp3", ["qb12_sv_002"]),
  wiring("audio", "fond", "/media/vocabulary/audio/fond.mp3", ["qb12_sv_019"]),
  wiring("audio", "bump", "/guided-reading/audio/words/bump.mp3", ["qb12_sv_025"]),
  wiring("audio", "short a", getPreferredPhonemeAudioPath("a"), ["qb12_sv_040"]),
  wiring("audio", "short i", getPreferredPhonemeAudioPath("i"), ["qb12_sv_041"]),
  wiring("audio", "baby", "/guided-reading/audio/words/baby.mp3", ["spelling-k-2-038"]),
  wiring("audio", "chase", "/guided-reading/audio/words/chase.mp3", ["spelling-k-2-045"]),
  wiring("audio", "sweet", "/guided-reading/audio/words/sweet.mp3", ["spelling-k-2-061"]),
  wiring("audio", "warm", "/guided-reading/audio/words/warm.mp3", ["spelling-k-2-070"]),
  wiring("audio", "purple", "/guided-reading/audio/words/purple.mp3", ["spelling-k-2-076"]),
  wiring("audio", "school", "/guided-reading/audio/words/school.mp3", ["spelling-k-2-099"]),
  wiring("audio", "last", "/guided-reading/audio/words/last.mp3", ["qb12_bl_019"]),
  wiring("audio", "crash", "/guided-reading/audio/words/crash.mp3", ["qb12_bl_052"]),
  wiring("audio", "stick", "/audio/assessment/digraphs/stick.mp3", ["digraphs_l2_58_ck_stick"]),
  wiring("audio", "chat", "/audio/child-mode/clean-human/words/chat.mp3", ["qb12_dg_024"]),
  wiring("audio", "think", "/audio/child-mode/clean-human/hfw/think.mp3", ["qb12_dg_026"]),
  wiring("audio", "ck", getPreferredPhonemeAudioPath("ck"), ["qb12_dg_031"]),
  wiring("audio", "thick", "/guided-reading/audio/words/thick.mp3", ["qb12_dg_052"]),
  wiring("audio", "note", "/audio/assessment/long-vowels/note.mp3", ["qb10_lv_003"]),
  wiring("audio", "rice", "/media/vocabulary/audio/rice.mp3", ["qb10_lv_010"]),
  wiring("audio", "pale", "/guided-reading/audio/words/pale.mp3", ["qb10_lv_016"]),
  wiring("audio", "dome", "/media/vocabulary/audio/dome.mp3", ["qb10_lv_018"]),
  wiring("audio", "late", "/guided-reading/audio/words/late.mp3", ["qb10_lv_019", "qb10_lv_052"]),
  wiring("audio", "hope", "/media/vocabulary/audio/hope.mp3", ["qb10_lv_021"]),
  wiring("audio", "wide", "/guided-reading/audio/words/wide.mp3", ["qb10_lv_022"]),
  wiring("audio", "those", "/guided-reading/audio/words/those.mp3", ["qb10_lv_027"]),
  wiring("audio", "hike", "/media/vocabulary/audio/hike.mp3", ["qb10_lv_032"]),
  wiring("audio", "tame", "/guided-reading/audio/words/tame.mp3", ["qb10_lv_035"]),
  wiring("audio", "price", "/guided-reading/audio/words/price.mp3", ["qb10_lv_045"]),
  wiring("audio", "made", "/audio/child-mode/clean-human/hfw/made.mp3", ["qb10_lv_051"]),
  wiring("audio", "boy", "/guided-reading/audio/words/boy.mp3", ["vowel_teams_l2_variety_04_oy_boy"]),
  wiring("audio", "first", "/audio/child-mode/clean-human/hfw/first.mp3", ["safe_r_ir_2"]),
  wiring("audio", "sharp", "/guided-reading/audio/words/sharp.mp3", ["exp7_r_controlled_2"]),
  wiring("audio", "born", "/guided-reading/audio/words/born.mp3", ["qb10_rc_032"]),
  wiring("audio", "look", "/audio/child-mode/clean-human/hfw/look.mp3", ["ixl_grammar_7", "workbook_verbs_look_165", "qb11_v_016", "second_antonyms_synonyms_l2_18_look_see", "workbook_synonym_look_107"]),
  wiring("audio", "listen", "/guided-reading/audio/words/listen.mp3", ["workbook_verbs_listen_164"]),
  wiring("audio", "new", "/audio/child-mode/clean-human/hfw/new.mp3", ["workbook_synonym_new_178"]),
  wiring("audio", "knew", "/guided-reading/audio/words/knew.mp3", ["approved_homophone_040"])
]);

export const assessmentHfwAudioWiring = Object.freeze(Object.fromEntries([
  ["words", "/guided-reading/audio/words/words.mp3"],
  ["each", "/audio/child-mode/clean-human/hfw/each.mp3"],
  ["many", "/audio/child-mode/clean-human/hfw/many.mp3"],
  ["these", "/audio/child-mode/clean-human/hfw/these.mp3"],
  ["him", "/audio/child-mode/clean-human/hfw/him.mp3"],
  ["look", "/audio/child-mode/clean-human/hfw/look.mp3"],
  ["two", "/audio/child-mode/clean-human/hfw/two.mp3"],
  ["write", "/audio/child-mode/clean-human/morphology/write.mp3"],
  ["see", "/audio/child-mode/clean-human/hfw/see.mp3"],
  ["number", "/guided-reading/audio/words/number.mp3"],
  ["people", "/audio/child-mode/clean-human/hfw/people.mp3"],
  ["first", "/audio/child-mode/clean-human/hfw/first.mp3"],
  ["water", "/guided-reading/audio/words/water.mp3"],
  ["called", "/guided-reading/audio/words/called.mp3"],
  ["oil", "/media/vocabulary/audio/oil.mp3"],
  ["sit", "/audio/child-mode/clean-human/words/sit.mp3"],
  ["find", "/audio/child-mode/clean-human/hfw/find.mp3"],
  ["long", "/audio/child-mode/clean-human/hfw/long.mp3"],
  ["day", "/audio/child-mode/clean-human/hfw/day.mp3"],
  ["made", "/audio/child-mode/clean-human/hfw/made.mp3"],
  ["may", "/audio/child-mode/clean-human/hfw/may.mp3"],
  ["part", "/audio/child-mode/clean-human/hfw/part.mp3"]
]));

const existingLegacyVocabularyAudioWords = new Set([
  "brave", "build", "close", "drive", "fall", "fly", "glue", "hide", "huge", "pink", "play", "zip"
]);

const guidedReadingLegacyAudioReplacementWords = new Set([
  "add", "answer", "ask", "awake", "baby", "best", "better", "bounce", "boy", "bring",
  "brown", "busy", "careful", "carry", "chase", "choose", "clear", "cloudy", "collect",
  "cool", "count", "cross", "curved", "deep", "different", "eat", "explain", "explore",
  "finish", "fluffy", "follow", "funny", "gentle", "give", "gold", "good", "grow",
  "harder", "help", "hold", "hug", "kind", "label", "large", "last", "late", "learn",
  "listen", "look", "move", "narrow", "neat", "notice", "old", "pack", "point", "pretend",
  "proud", "purple", "put", "rainy", "remember", "rest", "rough", "safe", "salty", "same",
  "say", "school", "see", "serious", "shallow", "sharp", "shy", "silly", "silver", "sing",
  "smooth", "snowy", "solve", "spotted", "square", "stay", "stick", "straight", "striped",
  "strong", "sunny", "sweet", "talk", "taste", "thick", "think", "tiny", "touch", "travel",
  "tricky", "try", "wait", "wake", "walk", "warm", "wear", "wide", "windy", "wonder"
]);

const cleanHumanLegacyAudioReplacements = Object.freeze({
  noisy: "/audio/child-mode/clean-human/words/noisy.mp3",
  polite: "/audio/child-mode/clean-human/words/polite.mp3",
  practice: "/audio/child-mode/clean-human/words/practice.mp3",
  search: "/audio/child-mode/clean-human/words/search.mp3",
  sleepy: "/audio/child-mode/clean-human/words/sleepy.mp3",
  slippery: "/audio/child-mode/clean-human/words/slippery.mp3"
});

export function resolveLegacyAssessmentAudioPath(filePath = "") {
  const normalizedPath = String(filePath || "").trim();
  if (normalizedPath === "/audio/child-mode/hfw/new.mp3") {
    return "/audio/child-mode/clean-human/hfw/new.mp3";
  }
  const match = normalizedPath.match(/^\/audio\/vocabulary\/([a-z0-9-]+)\.mp3$/i);
  if (!match) return normalizedPath;
  const word = match[1].toLowerCase();
  if (existingLegacyVocabularyAudioWords.has(word)) return normalizedPath;
  if (cleanHumanLegacyAudioReplacements[word]) return cleanHumanLegacyAudioReplacements[word];
  if (guidedReadingLegacyAudioReplacementWords.has(word)) {
    return `/guided-reading/audio/words/${word}.mp3`;
  }
  return "";
}

function waiver(skillId, questionIds, mediaTypes, reason) {
  return Object.freeze({
    skillId,
    questionIds: Object.freeze(questionIds),
    mediaTypes: Object.freeze(mediaTypes),
    status: "waived-from-release",
    owner: "Curriculum and media lead",
    reviewBy: "2026-10-23",
    excludeFromRuntime: true,
    reason
  });
}

export const assessmentMediaWaivers = Object.freeze([
  waiver(
    "final_sounds",
    ["qb12_fs_011", "qb12_fs_012", "qb12_fs_013", "qb12_fs_014", "qb12_fs_015"],
    ["audio"],
    "Composite two-word response choices have no exact pair recordings. Excluded until every option has reviewed pair audio."
  ),
  waiver(
    "final_sounds",
    ["gen_final_l2_ng_gong_3_word"],
    ["audio"],
    "No exact reviewed recording for “gong”. Excluded until the word-audio pack is completed."
  ),
  waiver(
    "cvc_short_vowels",
    ["qb12_cvc_039", "qb12_cvc_040", "qb12_cvc_041", "qb12_cvc_042", "qb12_cvc_043"],
    ["audio"],
    "Composite minimal-pair choices have no exact option recordings. Excluded rather than presenting a print-reading proxy for a phonological task."
  ),
  waiver(
    "short_vowel_discrimination",
    ["qb12_sv_006", "qb12_sv_007", "qb12_sv_008", "qb12_sv_009", "qb12_sv_010", "qb12_sv_022", "qb12_sv_024"],
    ["audio"],
    "The vowel-comparison items lack exact reviewed audio for every spoken choice. Excluded until the complete option set is recorded."
  ),
  waiver(
    "digraphs",
    ["phonics_k_040"],
    ["audio"],
    "The answer choices mix a voiced digraph example and metalinguistic labels without a complete reviewed option-audio set."
  ),
  waiver(
    "long_vowels_silent_e",
    ["qb10_lv_020"],
    ["audio"],
    "No exact reviewed recording for “site”. Excluded until the word-audio pack is completed."
  ),
  waiver(
    "r_controlled_vowels",
    ["qb10_rc_036", "qb10_rc_037", "qb10_rc_038", "qb10_rc_039", "qb10_rc_040"],
    ["audio"],
    "Composite two-word response choices have no exact pair recordings. Excluded until every option has reviewed pair audio."
  )
]);

const wiringByQuestionId = new Map();
for (const entry of assessmentMediaWiring) {
  for (const questionId of entry.questionIds) {
    const entries = wiringByQuestionId.get(questionId) || [];
    entries.push(entry);
    wiringByQuestionId.set(questionId, entries);
  }
}

const waiverByQuestionId = new Map();
for (const entry of assessmentMediaWaivers) {
  for (const questionId of entry.questionIds) {
    waiverByQuestionId.set(questionId, entry);
  }
}

export function getAssessmentMediaWiring(questionId = "") {
  return wiringByQuestionId.get(String(questionId || "")) || [];
}

export function getAssessmentHfwAudioWiring(targetWord = "") {
  return assessmentHfwAudioWiring[String(targetWord || "").toLowerCase().trim()] || "";
}

export function getAssessmentMediaWaiver(questionId = "") {
  return waiverByQuestionId.get(String(questionId || "")) || null;
}

export function isAssessmentMediaReleaseExcluded(questionId = "") {
  return Boolean(getAssessmentMediaWaiver(questionId)?.excludeFromRuntime);
}
