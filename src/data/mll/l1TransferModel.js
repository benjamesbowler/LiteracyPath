import { MLL_POLICY_VERSION } from "../../policy/mllLanguagePolicy.js";

/**
 * First-language transfer reference, and the non-transfer residue analysis.
 *
 * WHY THIS EXISTS. The National Academies finding that governs this file:
 * "more than 90 percent of the variance in DLL/EL classification was not related
 * to learners' English proficiency. Rather, ethnicity, social class, and reports
 * from parents and teachers on quality of language use played a substantial role
 * in classification decisions." And: "the assessment scores of DLLs/ELs in
 * English may reflect risk in all areas measured. Yet measures administered in
 * L1 may indicate that the student is in the low-risk range."
 *
 * An English-only phonics screen cannot distinguish "cannot decode" from "does
 * not yet have that phoneme." A /b/-for-/v/ substitution in a Spanish-dominant
 * child is a perception and production fact, not a grapheme-phoneme-
 * correspondence failure. The mechanism is forward cue transfer — a normal,
 * expected, temporary stage of acquisition, not error in any clinical sense.
 *
 * WHAT THIS MODULE OUTPUTS. Not "these errors are transfer." The flagship output
 * is the **residue**: of twelve error patterns, nine are explained by Spanish
 * transfer, three are not, and those three are named. That isolates the evidence
 * that warrants attention and suppresses the noise that drives misidentification.
 *
 * WHAT IT REFUSES. No verdicts, only "consistent with." No analysis at all
 * without a recorded home language. No special education referral, ever — it
 * points to the team process. Disconfirming evidence is always stated: transfer
 * and difficulty are not mutually exclusive and a child can have both.
 *
 * CONFIDENCE NOTE. The Spanish, Mandarin and Vietnamese tables are anchored in
 * academic sources. The Arabic table is consistent across sources but has no
 * peer-reviewed anchor and flattens real dialect variation (Egyptian, Levantine,
 * Gulf, Maghrebi). It is marked `reviewStatus: "needs_linguist_review"` and the
 * report says so.
 */

export const L1_TRANSFER_MODEL_VERSION = "2026.08.06-transfer-1";

export const TRANSFER_CONFIDENCE = Object.freeze({
  WELL_DOCUMENTED: "well_documented",
  DOCUMENTED: "documented",
  PLAUSIBLE: "plausible"
});

const CONFIDENCE_PHRASE = Object.freeze({
  [TRANSFER_CONFIDENCE.WELL_DOCUMENTED]: "is a well-documented pattern for",
  [TRANSFER_CONFIDENCE.DOCUMENTED]: "is a documented pattern for",
  [TRANSFER_CONFIDENCE.PLAUSIBLE]: "is consistent with reported patterns for"
});

/* ------------------------------------------------------------------ *
 * Phoneme notation
 * ------------------------------------------------------------------ */

/**
 * The app records sounds in several notations depending on the assessment —
 * IPA in the benchmark scoring, grapheme keys in the concept spine
 * (`final_sounds::st`), and plain letters in the letter assessments. Everything
 * enters this module through `normalizePhoneme`.
 */
const PHONEME_ALIASES = Object.freeze({
  th_voiceless: "θ", th: "θ", "θ": "θ",
  th_voiced: "ð", "ð": "ð",
  sh: "ʃ", "ʃ": "ʃ",
  zh: "ʒ", "ʒ": "ʒ",
  ch: "tʃ", "tʃ": "tʃ",
  j: "dʒ", "dʒ": "dʒ", jj: "dʒ",
  ng: "ŋ", "ŋ": "ŋ",
  y: "j", yod: "j",
  schwa: "ə", "ə": "ə",
  short_a: "æ", "æ": "æ",
  short_e: "ɛ", "ɛ": "ɛ",
  short_i: "ɪ", "ɪ": "ɪ",
  short_o: "ɒ", "ɒ": "ɒ", "ɑ": "ɒ",
  short_u: "ʌ", "ʌ": "ʌ",
  long_e: "i", "i:": "i", "iː": "i",
  long_a: "eɪ", "eɪ": "eɪ",
  long_i: "aɪ", "aɪ": "aɪ",
  long_o: "oʊ", "oʊ": "oʊ",
  long_u: "ju", "ju": "ju",
  oo: "u", "u:": "u", "uː": "u",
  aw: "ɔ", "ɔ": "ɔ",
  ow: "aʊ", "aʊ": "aʊ",
  oy: "ɔɪ", "ɔɪ": "ɔɪ",
  er: "ɝ", "ɝ": "ɝ", "ɜr": "ɝ"
});

export function normalizePhoneme(value) {
  if (!value) return "";
  const raw = String(value).trim().replace(/^\/|\/$/g, "").toLowerCase();
  if (PHONEME_ALIASES[raw]) return PHONEME_ALIASES[raw];
  const snake = raw.replace(/[\s-]+/g, "_");
  if (PHONEME_ALIASES[snake]) return PHONEME_ALIASES[snake];
  return raw;
}

const POSITIONS = Object.freeze({ INITIAL: "initial", MEDIAL: "medial", FINAL: "final", ANY: "any" });

/* ------------------------------------------------------------------ *
 * The language tables
 * ------------------------------------------------------------------ */

export const L1_PROFILES = Object.freeze({
  spanish: Object.freeze({
    id: "spanish",
    label: "Spanish",
    script: "latin",
    scriptNote: "Latin script, shallow orthography — letter-sound mapping in Spanish is far more consistent than in English, so a child literate in Spanish may expect English to behave regularly and be tripped by exceptions rather than by decoding itself.",
    reviewStatus: "sourced",
    sources: [
      "Colorado DOE, phoneme similarities in English and Spanish",
      "Gorman, Phonological Patterns of the English Language Learner (bilinguistics)",
      "Problematic Phonemes for Spanish Speakers (ERIC EJ1237446)"
    ],
    /** English phonemes with no Spanish counterpart. */
    absentPhonemes: Object.freeze(["v", "θ", "ð", "z", "ʃ", "ʒ", "dʒ", "ŋ", "eɪ", "ɪ", "aɪ", "ʌ", "ɔ", "aʊ", "ɔɪ", "ju", "ə"]),
    sharedPhonemes: Object.freeze(["p", "t", "k", "b", "d", "g", "f", "s", "tʃ", "m", "n", "l"]),
    substitutions: Object.freeze([
      { target: "θ", produced: "t", position: POSITIONS.ANY, example: "think → tink", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "ð", produced: "d", position: POSITIONS.ANY, example: "this → dis", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "z", produced: "s", position: POSITIONS.ANY, example: "zipper → sipper", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "v", produced: "b", position: POSITIONS.ANY, example: "very → bery", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "ʃ", produced: "tʃ", position: POSITIONS.ANY, example: "shop → chop", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "dʒ", produced: "j", position: POSITIONS.ANY, example: "just → yust", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ʒ", produced: "ʃ", position: POSITIONS.ANY, example: "treasure → tresher", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "d", produced: "t", position: POSITIONS.FINAL, example: "sad → sat", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED, note: "Final consonant devoicing." },
      { target: "ŋ", produced: "k", position: POSITIONS.FINAL, example: "sing → sink", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "p", produced: "b", position: POSITIONS.INITIAL, example: "pill heard as bill", confidence: TRANSFER_CONFIDENCE.DOCUMENTED, note: "Spanish stops are unaspirated, so an English /p t k/ can be heard and produced as /b d g/." },
      { target: "t", produced: "d", position: POSITIONS.INITIAL, example: "tie heard as die", confidence: TRANSFER_CONFIDENCE.DOCUMENTED, note: "Unaspirated stop." },
      { target: "k", produced: "g", position: POSITIONS.INITIAL, example: "coat heard as goat", confidence: TRANSFER_CONFIDENCE.DOCUMENTED, note: "Unaspirated stop." },
      { target: "ɪ", produced: "i", position: POSITIONS.ANY, example: "bit → beat", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED, note: "Spanish has no lax/tense vowel contrast." },
      { target: "æ", produced: "ɒ", position: POSITIONS.ANY, example: "man → mahn", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ɛ", produced: "eɪ", position: POSITIONS.ANY, example: "get → gate", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ʌ", produced: "ɒ", position: POSITIONS.ANY, example: "cup → cop", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ə", produced: "", position: POSITIONS.ANY, example: "any unstressed vowel given full value", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED, note: "Spanish has no schwa. This matters more than it looks: schwa is central to decoding English multisyllabic words." },
      { target: "r", produced: "ɾ", position: POSITIONS.ANY, example: "boring → boding", confidence: TRANSFER_CONFIDENCE.DOCUMENTED, note: "Spanish tap for English approximant." }
    ]),
    clusterRules: Object.freeze([
      {
        id: "s_cluster_epenthesis",
        describes: "Initial /s/ clusters",
        pattern: /^s[pktmnlfkw]/i,
        position: POSITIONS.INITIAL,
        effect: "epenthesis",
        example: "school → eschool, Spanish → Espanish",
        confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED,
        note: "Spanish words cannot begin with /s/ + consonant, so a vowel is inserted before the cluster."
      }
    ]),
    codaNote: "Spanish permits far fewer final consonants than English, so final-consonant devoicing and simplification are expected.",
    highValueFlags: Object.freeze([
      "Initial s-cluster epenthesis (school → eschool)",
      "/b/ for /v/",
      "th-stopping (think → tink)",
      "Final consonant devoicing (sad → sat)",
      "Short-vowel contrasts: /ɪ/ vs /i/, /ʌ/",
      "Schwa in unstressed syllables"
    ])
  }),

  mandarin: Object.freeze({
    id: "mandarin",
    label: "Mandarin",
    script: "logographic",
    scriptNote: "Mandarin is written logographically, so a child literate in Mandarin brings strong visual-word memory but no alphabetic-principle experience. Expect the alphabetic principle itself to need explicit teaching, not just individual sounds.",
    reviewStatus: "sourced",
    sources: ["Pronunciation Studio, Mandarin speakers' English pronunciation errors"],
    absentPhonemes: Object.freeze(["v", "θ", "ð", "z", "ʒ", "dʒ", "ɪ", "ɒ", "æ", "ə"]),
    sharedPhonemes: Object.freeze(["p", "t", "k", "f", "s", "ʃ", "m", "n", "ŋ", "l"]),
    substitutions: Object.freeze([
      { target: "l", produced: "r", position: POSITIONS.ANY, example: "light ↔ right", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED, note: "/l/ and /r/ are not contrastive in the same way; both directions occur." },
      { target: "r", produced: "l", position: POSITIONS.ANY, example: "report → lepolt", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "n", produced: "ŋ", position: POSITIONS.FINAL, example: "sun → sung, ban → bang", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "v", produced: "w", position: POSITIONS.ANY, example: "live → liw", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "v", produced: "f", position: POSITIONS.ANY, example: "every → efery", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "θ", produced: "s", position: POSITIONS.ANY, example: "Thursday → Sursday", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "ð", produced: "z", position: POSITIONS.ANY, example: "that → zat", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "ð", produced: "d", position: POSITIONS.INITIAL, example: "the → duh", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ɪ", produced: "i", position: POSITIONS.ANY, example: "bin → bean", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "ɒ", produced: "ɑ", position: POSITIONS.ANY, example: "lot with an unrounded vowel", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "z", produced: "s", position: POSITIONS.ANY, example: "zoo → soo", confidence: TRANSFER_CONFIDENCE.DOCUMENTED }
    ]),
    clusterRules: Object.freeze([
      {
        id: "no_clusters",
        describes: "Any consonant cluster",
        pattern: /[bcdfgjklmnpqrstvwxz]{2,}/i,
        position: POSITIONS.ANY,
        effect: "deletion_or_alteration",
        example: "asked → as, needs → need, actually → ashly",
        confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED,
        note: "Mandarin has no consonant clusters at all."
      },
      {
        id: "coda_restriction",
        describes: "Final consonants other than /n/ and /ŋ/",
        pattern: /[bcdfgjklmpqrstvxz]$/i,
        position: POSITIONS.FINAL,
        effect: "deletion",
        example: "cat → ca",
        confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED,
        note: "Mandarin permits very few syllable-final consonants."
      }
    ]),
    codaNote: "Mandarin permits almost no final consonants, so final-consonant deletion is the expected default rather than an error.",
    prosodyNote: "Equal stress on every syllable and no reduced syllables. This directly impairs English multisyllabic decoding and schwa — a real reading consequence, not just an accent.",
    highValueFlags: Object.freeze([
      "Final consonant deletion — expect it, do not score it as a decoding gap",
      "All consonant clusters",
      "/l/ and /r/",
      "Final /n/ and /ŋ/",
      "Final -s and -ed endings — these are cluster problems, not morphology problems, and are very commonly misread as grammar gaps"
    ])
  }),

  vietnamese: Object.freeze({
    id: "vietnamese",
    label: "Vietnamese",
    script: "latin",
    scriptNote: "Vietnamese uses a Latin alphabet with diacritics and a highly regular orthography, so alphabetic principle transfers well while English's irregularity does not.",
    reviewStatus: "sourced",
    sources: ["Can Tho University Journal of Science, consonant cluster errors of Vietnamese learners"],
    absentPhonemes: Object.freeze(["θ", "ð", "ʒ", "dʒ", "ʃ", "z", "æ", "ə"]),
    sharedPhonemes: Object.freeze(["p", "t", "k", "b", "d", "f", "s", "m", "n", "ŋ", "l"]),
    substitutions: Object.freeze([
      { target: "θ", produced: "t", position: POSITIONS.ANY, example: "think → tink", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ð", produced: "d", position: POSITIONS.ANY, example: "that → dat", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "z", produced: "s", position: POSITIONS.ANY, example: "zip → sip", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "ʃ", produced: "s", position: POSITIONS.ANY, example: "shop → sop", confidence: TRANSFER_CONFIDENCE.DOCUMENTED },
      { target: "dʒ", produced: "tʃ", position: POSITIONS.ANY, example: "jam → cham", confidence: TRANSFER_CONFIDENCE.PLAUSIBLE },
      { target: "p", produced: "b", position: POSITIONS.INITIAL, example: "unaspirated stop", confidence: TRANSFER_CONFIDENCE.DOCUMENTED, note: "Aspiration does not commonly occur in Vietnamese." }
    ]),
    clusterRules: Object.freeze([
      {
        id: "no_clusters_cc",
        describes: "Two-consonant clusters",
        pattern: /[bcdfgjklmnpqrstvwxz]{2}/i,
        position: POSITIONS.ANY,
        effect: "feature_change_or_deletion",
        example: "tree, price, cream — feature change in 77.4% of errors, deletion in 22.2%",
        confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED,
        note: "Vietnamese phonology has no consonant clusters. When a cluster is reduced, it is almost always the FIRST consonant that goes (55 of 56 observed tokens)."
      },
      {
        id: "no_clusters_ccc",
        describes: "Three-consonant clusters",
        pattern: /[bcdfgjklmnpqrstvwxz]{3}/i,
        position: POSITIONS.ANY,
        effect: "deletion",
        example: "street, splash",
        confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED,
        note: "Deletion in 78.2% of errors."
      },
      {
        id: "final_deletion",
        describes: "Final consonants",
        pattern: /[bcdfgjklmnpqrstvwxz]$/i,
        position: POSITIONS.FINAL,
        effect: "deletion",
        example: "cat → ca",
        confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED,
        note: "Vietnamese learners tend to skip most consonant sounds in final position. This is the dominant pattern."
      }
    ]),
    codaNote: "Final consonant deletion is the default expectation, not an error signal.",
    prosodyNote: "Vietnamese is tonal, so English stress and intonation carry no lexical function in the first language. Prosodic transfer is significant and affects fluency rating more than decoding.",
    highValueFlags: Object.freeze([
      "Final consonant deletion — expect it as the default",
      "Consonant clusters in both initial and final position",
      "Aspiration contrasts",
      "Inflectional endings — a phonotactic issue, not a morphology issue"
    ])
  }),

  arabic: Object.freeze({
    id: "arabic",
    label: "Arabic",
    script: "abjad",
    scriptNote: "Arabic is written right to left, and short vowels are typically unwritten. Both are plausibly relevant to early English orthographic development — a child may under-attend to vowels, which in English are load-bearing.",
    reviewStatus: "needs_linguist_review",
    reviewNote: "These patterns are consistent across sources and consistent with Arabic phonology, but no peer-reviewed anchor was available and the table flattens substantial dialect variation (Egyptian, Levantine, Gulf, Maghrebi). Treat with more caution than the other three.",
    sources: ["TALK, common pronunciation problems for Arabic speakers"],
    absentPhonemes: Object.freeze(["p", "v", "ŋ", "eɪ", "oʊ", "ɪ", "ɛ"]),
    sharedPhonemes: Object.freeze(["b", "t", "d", "k", "g", "f", "s", "z", "ʃ", "m", "n", "l", "r", "θ", "ð"]),
    substitutions: Object.freeze([
      { target: "p", produced: "b", position: POSITIONS.ANY, example: "parking → barking, pepper → bebber", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED, note: "The signature Arabic pattern. /p/ does not exist in Arabic." },
      { target: "v", produced: "f", position: POSITIONS.ANY, example: "voice → foice, very → fery", confidence: TRANSFER_CONFIDENCE.WELL_DOCUMENTED },
      { target: "ŋ", produced: "n", position: POSITIONS.FINAL, example: "sing → sin", confidence: TRANSFER_CONFIDENCE.PLAUSIBLE },
      { target: "ɪ", produced: "i", position: POSITIONS.ANY, example: "bit → beat", confidence: TRANSFER_CONFIDENCE.PLAUSIBLE },
      { target: "ɛ", produced: "æ", position: POSITIONS.ANY, example: "bed → bad", confidence: TRANSFER_CONFIDENCE.PLAUSIBLE }
    ]),
    clusterRules: Object.freeze([
      {
        id: "cluster_epenthesis",
        describes: "Consonant clusters",
        pattern: /[bcdfgjklmnpqrstvwxz]{2,}/i,
        position: POSITIONS.ANY,
        effect: "epenthesis",
        example: "stress → e-set-ress, split → e-spi-lit, gray → gi-ray",
        confidence: TRANSFER_CONFIDENCE.DOCUMENTED,
        note: "Arabic permits far fewer clusters, so a vowel is inserted to break them up."
      }
    ]),
    codaNote: "Clusters are broken by vowel insertion rather than deleted.",
    prosodyNote: "Flatter stress and intonation contours than English.",
    highValueFlags: Object.freeze([
      "/b/ for /p/ — near-certainly transfer in an Arabic-speaking child",
      "/f/ for /v/",
      "Cluster epenthesis (extra vowel inside a cluster)",
      "Short vowel representation in spelling"
    ])
  })
});

export const SUPPORTED_L1_IDS = Object.freeze(Object.keys(L1_PROFILES));

const LANGUAGE_ALIASES = Object.freeze({
  spanish: "spanish", espanol: "spanish", "español": "spanish", castellano: "spanish", es: "spanish",
  mandarin: "mandarin", chinese: "mandarin", putonghua: "mandarin", zh: "mandarin",
  "mandarin chinese": "mandarin", cantonese: "", // deliberately unmapped — different phonology
  vietnamese: "vietnamese", "tieng viet": "vietnamese", vi: "vietnamese",
  arabic: "arabic", ar: "arabic"
});

export function resolveL1Profile(homeLanguage) {
  const raw = String(homeLanguage || "").trim().toLowerCase();
  if (!raw) return null;
  const id = LANGUAGE_ALIASES[raw] || (SUPPORTED_L1_IDS.includes(raw) ? raw : "");
  return id ? L1_PROFILES[id] : null;
}

/* ------------------------------------------------------------------ *
 * The analysis
 * ------------------------------------------------------------------ */

function matchPosition(rulePosition, observedPosition) {
  if (!rulePosition || rulePosition === POSITIONS.ANY) return true;
  if (!observedPosition) return true;
  return rulePosition === observedPosition;
}

function explainSubstitution(profile, error) {
  const target = normalizePhoneme(error.targetPhoneme ?? error.target);
  const produced = normalizePhoneme(error.producedPhoneme ?? error.produced);
  if (!target) return null;

  const substitution = profile.substitutions.find(rule =>
    normalizePhoneme(rule.target) === target &&
    (!produced || !rule.produced || normalizePhoneme(rule.produced) === produced) &&
    matchPosition(rule.position, error.position)
  );
  if (substitution) {
    return {
      kind: "substitution",
      rule: substitution,
      confidence: substitution.confidence,
      absentInL1: profile.absentPhonemes.includes(target),
      explanation: substitution.note || ""
    };
  }

  if (profile.absentPhonemes.includes(target)) {
    return {
      kind: "absent_phoneme",
      rule: { target, produced, position: error.position || POSITIONS.ANY },
      confidence: TRANSFER_CONFIDENCE.DOCUMENTED,
      absentInL1: true,
      explanation: `/${target}/ does not exist in the ${profile.label} sound system, so it has to be learned as a new sound before it can be read or spelled reliably.`
    };
  }
  return null;
}

function explainCluster(profile, error) {
  const word = String(error.word || error.target || "");
  if (!word) return null;
  const rule = (profile.clusterRules || []).find(entry =>
    entry.pattern.test(word) && matchPosition(entry.position, error.position)
  );
  if (!rule) return null;
  return {
    kind: "cluster",
    rule,
    confidence: rule.confidence,
    absentInL1: false,
    explanation: rule.note || ""
  };
}

/**
 * The main entry point.
 *
 * `errors` is a list of observed patterns from any assessment that records what
 * a child produced against what was targeted:
 *   { targetPhoneme, producedPhoneme, position, word, itemId, occurrences,
 *     correctElsewhere }
 *
 * `correctElsewhere: true` means the same target was produced correctly in
 * another item. That is disconfirming evidence for the transfer hypothesis in
 * one direction and confirming for grapheme-phoneme knowledge in another, and
 * the report states it either way.
 */
export function analyzeL1Transfer({
  homeLanguage = "",
  homeLanguageLiteracy = null,
  errors = [],
  proficiencyLevelLow = null,
  studentName = "This student"
} = {}) {
  const profile = resolveL1Profile(homeLanguage);
  const rows = Array.isArray(errors) ? errors.filter(Boolean) : [];

  if (!homeLanguage) {
    return {
      version: L1_TRANSFER_MODEL_VERSION,
      policyVersion: MLL_POLICY_VERSION,
      available: false,
      reason: "no_home_language",
      narrative:
        "No home language is recorded for this student, so no language-transfer analysis is offered. A transfer hypothesis without a named first language is a guess, not evidence — add the home language to enable this section.",
      explained: [],
      residue: [],
      summary: null
    };
  }

  if (!profile) {
    return {
      version: L1_TRANSFER_MODEL_VERSION,
      policyVersion: MLL_POLICY_VERSION,
      available: false,
      reason: "language_not_in_reference",
      homeLanguage,
      narrative: `Literacy Guide does not yet hold a sound-system reference for ${homeLanguage}. The error patterns below are listed without a transfer analysis. They should not be read as decoding difficulties until someone who knows ${homeLanguage} has looked at them — many will be predictable differences between the two sound systems.`,
      explained: [],
      residue: rows.map(error => ({ ...error, note: "No reference available for this language." })),
      summary: null
    };
  }

  const explained = [];
  const residue = [];

  rows.forEach(error => {
    const match = explainSubstitution(profile, error) || explainCluster(profile, error);
    if (match) {
      explained.push({
        ...error,
        targetPhoneme: normalizePhoneme(error.targetPhoneme ?? error.target),
        producedPhoneme: normalizePhoneme(error.producedPhoneme ?? error.produced),
        transfer: match,
        sentence: transferSentence(profile, error, match)
      });
    } else {
      residue.push({
        ...error,
        targetPhoneme: normalizePhoneme(error.targetPhoneme ?? error.target),
        producedPhoneme: normalizePhoneme(error.producedPhoneme ?? error.produced),
        note: "Not explained by known differences between English and " + profile.label + "."
      });
    }
  });

  const total = rows.length;
  const level = Number(proficiencyLevelLow);
  const earlyLevel = Number.isFinite(level) && level <= 2;

  const summary = {
    total,
    explainedCount: explained.length,
    residueCount: residue.length,
    explainedShare: total ? Math.round((explained.length / total) * 100) : 0,
    language: profile.label,
    languageId: profile.id,
    reviewStatus: profile.reviewStatus,
    disconfirmingCount: explained.filter(row => row.correctElsewhere).length
  };

  return {
    version: L1_TRANSFER_MODEL_VERSION,
    policyVersion: MLL_POLICY_VERSION,
    available: true,
    homeLanguage: profile.label,
    homeLanguageId: profile.id,
    homeLanguageLiteracy,
    profile,
    explained,
    residue,
    summary,
    earlyLevelSuppression: earlyLevel,
    narrative: buildNarrative({ profile, summary, explained, residue, studentName, earlyLevel, homeLanguageLiteracy }),
    residueNarrative: buildResidueNarrative({ profile, residue, studentName }),
    caution: profile.reviewStatus === "needs_linguist_review" ? profile.reviewNote : "",
    disclaimer:
      "This is a descriptive observation based on documented differences between the two sound systems. It is not a clinical judgement, and it must not be used on its own in a special education referral decision."
  };
}

function transferSentence(profile, error, match) {
  const target = normalizePhoneme(error.targetPhoneme ?? error.target);
  const produced = normalizePhoneme(error.producedPhoneme ?? error.produced);
  const occurrences = Number(error.occurrences) || 1;
  const opportunities = Number(error.opportunities) || occurrences;
  const where = error.examples?.length ? ` (${error.examples.slice(0, 4).join(", ")})` : "";
  const phrase = CONFIDENCE_PHRASE[match.confidence] || CONFIDENCE_PHRASE[TRANSFER_CONFIDENCE.PLAUSIBLE];

  if (match.kind === "cluster") {
    return `${occurrences} of ${opportunities} ${opportunities === 1 ? "chance" : "chances"} with ${match.rule.describes.toLowerCase()}${where}. ${match.rule.note} This ${phrase} ${profile.label} speakers.`;
  }

  const substitutionText = produced
    ? `used /${produced}/ where /${target}/ was expected`
    : `did not yet produce /${target}/`;
  const absence = match.absentInL1
    ? ` /${target}/ does not exist in ${profile.label}.`
    : "";
  return `${substitutionText} in ${occurrences} of ${opportunities} ${opportunities === 1 ? "opportunity" : "opportunities"}${where}.${absence} This ${phrase} ${profile.label} speakers.`;
}

function buildNarrative({ profile, summary, studentName, earlyLevel, homeLanguageLiteracy }) {
  const parts = [];

  if (!summary.total) {
    return `No sound-level error patterns have been recorded for ${studentName} yet. Once phonics or spelling assessments are saved, this section compares the patterns against documented differences between English and ${profile.label}.`;
  }

  parts.push(
    `Of ${summary.total} recorded error ${summary.total === 1 ? "pattern" : "patterns"}, ${summary.explainedCount} ${summary.explainedCount === 1 ? "is" : "are"} explained by documented differences between English and ${profile.label}, and ${summary.residueCount} ${summary.residueCount === 1 ? "is" : "are"} not.`
  );

  if (summary.explainedCount) {
    parts.push(
      `The explained patterns are what second-language researchers call forward cue transfer — a normal, expected stage of learning a second sound system, not error in any clinical sense. They should be taught as new sounds, not treated as decoding difficulties.`
    );
  }

  if (summary.disconfirmingCount) {
    parts.push(
      `${summary.disconfirmingCount} of those ${summary.disconfirmingCount === 1 ? "sound was" : "sounds were"} produced correctly elsewhere, which is direct evidence that the letter-sound knowledge is there and the difficulty is with the sound itself.`
    );
  }

  if (earlyLevel) {
    parts.push(
      `${studentName} is at an early stage of English language development. Low scores across every English measure are the expected pattern at this stage and should not be read as a difficulty with reading.`
    );
  }

  if (homeLanguageLiteracy === false) {
    parts.push(
      `${studentName} is not yet reading in ${profile.label}, so there is no first-language literacy to transfer from. The alphabetic principle itself may need explicit teaching alongside the individual sounds.`
    );
  } else if (homeLanguageLiteracy === true) {
    parts.push(profile.scriptNote);
  }

  if (profile.prosodyNote) parts.push(profile.prosodyNote);

  return parts.join(" ");
}

function buildResidueNarrative({ profile, residue, studentName }) {
  if (!residue.length) {
    return `Every recorded pattern is explained by differences between English and ${profile.label}. There is nothing here that points beyond language transfer. That does not rule out a difficulty — it means this evidence does not show one.`;
  }
  const named = residue
    .slice(0, 6)
    .map(row => {
      const target = row.targetPhoneme || row.word || "this pattern";
      const produced = row.producedPhoneme ? ` produced as /${row.producedPhoneme}/` : "";
      return `/${target}/${produced}`;
    })
    .join(", ");
  return `${residue.length} ${residue.length === 1 ? "pattern is" : "patterns are"} not explained by ${profile.label} transfer: ${named}. These are the ones worth looking at more closely, because they are not predicted by the differences between the two sound systems. Look at them alongside ${studentName}'s first-language skills and the rest of the picture before drawing any conclusion — transfer and difficulty are not mutually exclusive, and a child can have both.`;
}

/** The reference table a teacher can read, for a language, as report rows. */
export function transferReferenceRows(homeLanguage) {
  const profile = resolveL1Profile(homeLanguage);
  if (!profile) return [];
  const rows = profile.substitutions.map(rule => ({
    category: "Sound",
    target: `/${rule.target}/`,
    expected: rule.produced ? `/${rule.produced}/` : "may be left out",
    position: rule.position === POSITIONS.ANY ? "anywhere" : rule.position,
    example: rule.example,
    confidence: rule.confidence,
    note: rule.note || ""
  }));
  (profile.clusterRules || []).forEach(rule => {
    rows.push({
      category: "Word shape",
      target: rule.describes,
      expected: rule.effect.replace(/_/g, " "),
      position: rule.position === POSITIONS.ANY ? "anywhere" : rule.position,
      example: rule.example,
      confidence: rule.confidence,
      note: rule.note || ""
    });
  });
  return rows;
}
