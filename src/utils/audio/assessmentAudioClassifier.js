export const ASSESSMENT_AUDIO_STANDARD = {
  description: "Neutral soft American female voice",
  provider: "unknown",
  voiceId: "",
  modelId: "",
  standardRoot: "/audio/child-mode/clean-human/",
  source: "Kimi/Pack 6 clean-human assessment audio where available"
};

export const REPLACEMENT_VOICE_INSTRUCTIONS = [
  "Neutral soft American female voice.",
  "American English.",
  "Calm, warm, clear, teacher-like delivery.",
  "Suitable for Kindergarten to Grade 2 assessment tasks.",
  "Natural pacing, slightly slower than normal adult speech but not exaggerated.",
  "Use the exact script only.",
  "No extra words, intro, music, sound effects, character acting, or background noise.",
  "Normalize volume consistently.",
  "Add a tiny silence at the beginning and end."
];

export function normalizeAssessmentAudioText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyAssessmentAudioPath(audioPath = "", preference = null) {
  const path = String(audioPath || "");
  const lower = path.toLowerCase();
  const issues = [];

  if (!path) {
    return {
      matchesStandardVoice: "no",
      status: "MISSING_AUDIO",
      issues: ["missing_file"]
    };
  }

  if (preference?.status === "review_needed") {
    issues.push("needs_human_review");
  }
  if (preference?.reviewNeededPaths?.includes(path)) {
    issues.push("needs_human_review");
  }
  if (preference?.deprecatedAudioPaths?.includes(path)) {
    issues.push("old_original_audio");
  }
  if (lower.includes("-kimi3") || lower.includes("-kimi4")) {
    issues.push("wrong_voice");
    issues.push("needs_human_review");
  }
  if (lower.includes("/audio/choices/")) {
    issues.push("old_original_audio");
    issues.push("needs_human_review");
  }
  if (
    lower.includes("/audio/child-mode/words/") ||
    lower.includes("/audio/child-mode/hfw/") ||
    lower.includes("/audio/child-mode/phrases/")
  ) {
    issues.push("old_original_audio");
  }
  if (/\b(letter|alphabet|spell|spelling|phoneme)\b/.test(lower)) {
    issues.push("needs_human_review");
  }

  const isCleanHuman = lower.includes(ASSESSMENT_AUDIO_STANDARD.standardRoot);
  const isApprovedCleanHuman = preference?.status === "approved" && preference.preferredAudioPath === path && isCleanHuman;

  if (isApprovedCleanHuman && issues.length === 0) {
    return {
      matchesStandardVoice: "yes",
      status: "KEEP_STANDARD_VOICE",
      issues: []
    };
  }

  if (isCleanHuman && preference?.status !== "review_needed" && !issues.includes("wrong_voice")) {
    return {
      matchesStandardVoice: preference?.status === "approved" ? "yes" : "uncertain",
      status: preference?.status === "approved" ? "KEEP_STANDARD_VOICE" : "NEEDS_HUMAN_REVIEW",
      issues: preference?.status === "approved" ? [] : ["needs_human_review"]
    };
  }

  const uniqueIssues = [...new Set(issues.length ? issues : ["needs_human_review"])];
  let status = "NEEDS_HUMAN_REVIEW";
  if (uniqueIssues.includes("old_original_audio")) status = "REPLACE_OLD_ORIGINAL";
  if (uniqueIssues.includes("wrong_voice")) status = "REPLACE_WRONG_VOICE";

  return {
    matchesStandardVoice: "uncertain",
    status,
    issues: uniqueIssues
  };
}

export function replacementInstructionForAudio(script = "", extra = "") {
  const cleanScript = normalizeAssessmentAudioText(script);
  return [
    `Record MP3 saying exactly: "${cleanScript || "[SCRIPT NEEDED]"}".`,
    ...REPLACEMENT_VOICE_INSTRUCTIONS,
    extra
  ].filter(Boolean).join(" ");
}
