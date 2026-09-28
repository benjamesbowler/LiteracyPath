import { EL_LEGACY_BENCHMARK_CONTENT } from "./elBenchmarkLegacyContent.js";
import { EL_FLUENCY_DESIGN } from "./elBenchmarkFluencyDesign.js";
import { EL_PA_DEPTH_ITEMS, EL_ENCODING_DEPTH_ITEMS, benchmarkFeatureGuidance, benchmarkOralGuidance, EL_FLUENCY_PROSODY_LEVELS } from "./elBenchmarkContentDepth.js";
import {
  EL_PARALLEL_DECODING_WORDS,
  EL_PARALLEL_ENCODING_CONTENT,
  EL_PARALLEL_FLUENCY_CONTENT,
  EL_PARALLEL_PA_CONTENT
} from "./elBenchmarkParallelFormContent.js";
import { EL_DECODING_MICROPHASES } from "./elDecodingMicrophases.js";
export { EL_DECODING_MICROPHASES } from "./elDecodingMicrophases.js";

/**
 * Original Literacy Guide benchmark content.
 *
 * These fixed forms are EL Skills Block-aligned in sequence and language, but
 * they are not copied from, endorsed by, or represented as official EL
 * Education benchmark assessments.  The version is deliberately embedded in
 * every plan and item id so future revisions do not silently change the meaning
 * of saved evidence.
 */

export const EL_BENCHMARK_SCHEMA_VERSION = 1;
export const EL_BENCHMARK_CONTENT_VERSION = "2026.09.28-depth-v3";
export const EL_BENCHMARK_FORM_ID = "form-a-v3";
export const EL_BENCHMARK_FORM_IDS = Object.freeze({
  A: EL_BENCHMARK_FORM_ID,
  B: "form-b-v2",
  C: "form-c-v2"
});
export const EL_BENCHMARK_FORM_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: EL_BENCHMARK_FORM_IDS.A,
    key: "a",
    label: "Form A",
    contentVersion: EL_BENCHMARK_CONTENT_VERSION,
    parallelSetId: "lp-el-parallel-2026-depth-v2",
    equatingStatus: "blueprint_matched_not_empirically_equated"
  }),
  Object.freeze({
    id: EL_BENCHMARK_FORM_IDS.B,
    key: "b",
    label: "Form B",
    contentVersion: "2026.09.28-depth-v2",
    parallelSetId: "lp-el-parallel-2026-depth-v2",
    equatingStatus: "blueprint_matched_not_empirically_equated"
  }),
  Object.freeze({
    id: EL_BENCHMARK_FORM_IDS.C,
    key: "c",
    label: "Form C",
    contentVersion: "2026.09.28-depth-v2",
    parallelSetId: "lp-el-parallel-2026-depth-v2",
    equatingStatus: "blueprint_matched_not_empirically_equated"
  })
]);

const FORM_DEFINITION_BY_ID = Object.freeze(Object.fromEntries(
  EL_BENCHMARK_FORM_DEFINITIONS.map(definition => [definition.id, definition])
));

export const EL_BENCHMARK_IDS = Object.freeze({
  PHONOLOGICAL_AWARENESS: "el_phonological_awareness",
  ENCODING: "el_encoding",
  DECODING: "el_decoding",
  ORAL_READING_FLUENCY: "el_oral_reading_fluency"
});

export const EL_ADMINISTRATION_STATUSES = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PARTIAL: "partial",
  DISCONTINUED: "discontinued",
  NOT_ADMINISTERED: "not_administered",
  NOT_SCORABLE: "not_scorable"
});

export const EL_ITEM_RESPONSE_STATUSES = Object.freeze({
  RECORDED: "recorded",
  CORRECT: "correct",
  INCORRECT: "incorrect",
  SELF_CORRECTED: "self_corrected",
  NO_RESPONSE: "no_response",
  NOT_ADMINISTERED: "not_administered",
  NOT_SCORABLE: "not_scorable"
});

export const EL_BENCHMARK_ERROR_TAGS = Object.freeze({
  NO_RESPONSE: "no_response",
  RHYME_CONFUSION: "rhyme_confusion",
  SYLLABLE_CONFUSION: "syllable_confusion",
  ONSET_RIME_CONFUSION: "onset_rime_confusion",
  INITIAL_PHONEME: "initial_phoneme",
  MEDIAL_PHONEME: "medial_phoneme",
  FINAL_PHONEME: "final_phoneme",
  BLENDING: "blending",
  SEGMENTATION: "segmentation",
  DELETION: "deletion",
  SUBSTITUTION: "substitution",
  OMISSION: "omission",
  INSERTION: "insertion",
  REVERSAL: "reversal",
  VOWEL_PATTERN: "vowel_pattern",
  CONSONANT_PATTERN: "consonant_pattern",
  MORPHOLOGY: "morphology",
  WHOLE_WORD_SUBSTITUTION: "whole_word_substitution",
  LOSS_OF_PLACE: "loss_of_place",
  REPEATED_WORD: "repeated_word",
  OTHER: "other"
});

const GRADES = Object.freeze(["K", "1", "2"]);
const WINDOWS = Object.freeze(["BOY", "MOY", "EOY"]);

const FRAMEWORK = Object.freeze({
  label: "Literacy Guide provisional",
  isProvisional: true,
  source: "Original Literacy Guide-authored assessment content",
  disclaimer: "EL-aligned, not an official or proprietary EL Education assessment and not nationally normed."
});

const COMMON_ALLOWED_STATUSES = Object.freeze(Object.values(EL_ADMINISTRATION_STATUSES));

export const EL_BENCHMARK_CATALOG = Object.freeze([
  Object.freeze({
    id: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    title: "Phonological and Phonemic Awareness",
    shortTitle: "Sound Awareness",
    description: "Teacher-led oral tasks across rhyme, syllables, onset-rime, phoneme isolation, blending, segmentation, deletion, and substitution.",
    administrationMode: "teacher_oral",
    estimatedMinutes: { minimum: 1, maximum: 5 },
    supportedGrades: GRADES,
    supportedWindows: WINDOWS,
    framework: FRAMEWORK
  }),
  Object.freeze({
    id: EL_BENCHMARK_IDS.ENCODING,
    title: "Word Encoding and Spelling",
    shortTitle: "Encoding",
    description: "Teacher-led word dictation with separate exact-spelling and phonologically plausible evidence.",
    administrationMode: "teacher_dictation",
    estimatedMinutes: { minimum: 15, maximum: 15, approximate: true },
    supportedGrades: GRADES,
    supportedWindows: WINDOWS,
    framework: FRAMEWORK
  }),
  Object.freeze({
    id: EL_BENCHMARK_IDS.DECODING,
    title: "Word Decoding and Automaticity",
    shortTitle: "Decoding",
    description: "Fixed eight-word microphase bands that separate accurate reading from automatic reading and retain stopping evidence.",
    administrationMode: "teacher_word_reading",
    estimatedMinutes: { minimum: 5, maximum: 10 },
    supportedGrades: GRADES,
    supportedWindows: WINDOWS,
    framework: FRAMEWORK
  }),
  Object.freeze({
    id: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    title: "Oral Reading Fluency",
    shortTitle: "Reading Fluency",
    description: "Original fixed passages for descriptive rate, accuracy, self-correction, and prosody evidence.",
    administrationMode: "teacher_timed_reading",
    estimatedMinutes: { minimum: 1, maximum: 10 },
    routineGrades: ["1", "2"],
    optionalGrades: ["K"],
    supportedGrades: GRADES,
    supportedWindows: WINDOWS,
    framework: FRAMEWORK
  })
]);

const MICROPHASE_BY_ID = Object.freeze(Object.fromEntries(
  EL_DECODING_MICROPHASES.map((microphase, index) => [microphase.id, { ...microphase, order: index + 1 }])
));

const ROUTES = Object.freeze({
  "K-BOY": Object.freeze({
    expectedMicrophase: "middle_pre", expectedCycle: 1,
    rangeStart: "middle_pre", rangeEnd: "middle_pre",
    rangeLabel: "Kindergarten BOY: Middle Pre baseline",
    decodingRoutine: "optional"
  }),
  "K-MOY": Object.freeze({
    expectedMicrophase: "early_partial", expectedCycle: 15,
    rangeStart: "middle_pre", rangeEnd: "early_partial",
    rangeLabel: "Kindergarten MOY: optional Middle Pre to Early Partial check after letter-sound prerequisite",
    decodingRoutine: "optional_after_letter_sound_prerequisite"
  }),
  "K-EOY": Object.freeze({
    expectedMicrophase: "middle_partial", expectedCycle: 25,
    rangeStart: "early_partial", rangeEnd: "late_partial",
    rangeLabel: "Kindergarten EOY: Early Partial to Late Partial",
    decodingRoutine: "routine_after_letter_sound_prerequisite"
  }),
  "1-BOY": Object.freeze({
    expectedMicrophase: "late_partial", expectedCycle: 26,
    rangeStart: "early_partial", rangeEnd: "late_partial",
    rangeLabel: "Grade 1 BOY: Early Partial to Late Partial",
    decodingRoutine: "routine"
  }),
  "1-MOY": Object.freeze({
    expectedMicrophase: "middle_full", expectedCycle: 39,
    rangeStart: "late_partial", rangeEnd: "middle_full",
    rangeLabel: "Grade 1 MOY: Late Partial to Middle Full",
    decodingRoutine: "routine"
  }),
  "1-EOY": Object.freeze({
    expectedMicrophase: "late_full", expectedCycle: 50,
    rangeStart: "early_full", rangeEnd: "late_full",
    rangeLabel: "Grade 1 EOY: Early Full to Late Full",
    decodingRoutine: "routine"
  }),
  "2-BOY": Object.freeze({
    expectedMicrophase: "early_consolidated", expectedCycle: 51,
    rangeStart: "middle_full", rangeEnd: "early_consolidated",
    rangeLabel: "Grade 2 BOY: Middle Full to Early Consolidated",
    decodingRoutine: "routine"
  }),
  "2-MOY": Object.freeze({
    expectedMicrophase: "middle_consolidated", expectedCycle: 61,
    rangeStart: "late_full", rangeEnd: "middle_consolidated",
    rangeLabel: "Grade 2 MOY: Late Full to Middle Consolidated",
    decodingRoutine: "routine"
  }),
  "2-EOY": Object.freeze({
    expectedMicrophase: "late_consolidated", expectedCycle: 75,
    rangeStart: "early_consolidated", rangeEnd: "late_consolidated",
    rangeLabel: "Grade 2 EOY: Early Consolidated to Late Consolidated",
    decodingRoutine: "routine"
  })
});

function paItem(id, strand, task, teacherSay, expectedAnswers, prompt = "Listen and answer aloud.", options = {}) {
  return {
    id,
    kind: "oral_sound_task",
    strand,
    task,
    prompt,
    teacherSay,
    expectedAnswers,
    teacherJudgmentRequired: options.teacherJudgmentRequired ?? task === "production",
    dialectSensitive: options.dialectSensitive === true,
    administrationNote: options.administrationNote || "",
    featureTags: [strand, task]
  };
}

const PA_FORMS = Object.freeze({
  "K-BOY": [
    paItem("pa-k-boy-01", "rhyme", "recognition", "Do moon and spoon rhyme?", ["yes"]),
    paItem("pa-k-boy-02", "rhyme", "recognition", "Do cap and fish rhyme?", ["no"]),
    paItem("pa-k-boy-03", "syllable", "blending", "What word do these parts make: sun ... set?", ["sunset"]),
    paItem("pa-k-boy-04", "syllable", "blending", "What word do these parts make: pic ... nic?", ["picnic"]),
    paItem("pa-k-boy-05", "onset_rime", "blending", "What word is /m/ ... /ap/?", ["map"]),
    paItem("pa-k-boy-06", "onset_rime", "blending", "What word is /s/ ... /un/?", ["sun"]),
    paItem("pa-k-boy-07", "phoneme_isolation", "initial", "What is the first sound in fish?", ["f", "/f/"]),
    paItem("pa-k-boy-08", "phoneme_isolation", "initial", "What is the first sound in moon?", ["m", "/m/"])
  ],
  "K-MOY": [
    paItem("pa-k-moy-01", "rhyme", "production", "Tell me a word that rhymes with log.", ["dog", "fog", "hog", "jog"]),
    paItem("pa-k-moy-02", "rhyme", "production", "Tell me a word that rhymes with pin.", ["fin", "win", "bin", "tin"]),
    paItem("pa-k-moy-03", "syllable", "segmentation", "Say rabbit in parts.", ["rab it", "rab-it", "rabbit:2"]),
    paItem("pa-k-moy-04", "syllable", "segmentation", "Say sunset in parts.", ["sun set", "sun-set", "sunset:2"]),
    paItem("pa-k-moy-05", "phoneme_isolation", "final", "What is the last sound in map?", ["p", "/p/"]),
    paItem("pa-k-moy-06", "phoneme_isolation", "final", "What is the last sound in sun?", ["n", "/n/"]),
    paItem("pa-k-moy-07", "phoneme_blending", "three_phoneme", "Blend /m/ /a/ /p/.", ["map"]),
    paItem("pa-k-moy-08", "phoneme_blending", "three_phoneme", "Blend /s/ /i/ /t/.", ["sit"]),
    paItem("pa-k-moy-09", "phoneme_segmentation", "three_phoneme", "Tell me every sound in fog.", ["f o g", "/f/ /o/ /g/"]),
    paItem("pa-k-moy-10", "phoneme_segmentation", "three_phoneme", "Tell me every sound in red.", ["r e d", "/r/ /e/ /d/"])
  ],
  "K-EOY": [
    paItem("pa-k-eoy-01", "rhyme", "production", "Tell me a word that rhymes with cake.", ["bake", "lake", "make", "rake", "take"]),
    paItem("pa-k-eoy-02", "syllable", "segmentation", "Say napkin in parts.", ["nap kin", "nap-kin", "napkin:2"]),
    paItem("pa-k-eoy-03", "onset_rime", "blending", "What word is /sh/ ... /ip/?", ["ship"]),
    paItem("pa-k-eoy-04", "phoneme_isolation", "medial", "What is the middle sound in pet?", ["e", "/e/"]),
    paItem("pa-k-eoy-05", "phoneme_blending", "four_phoneme", "Blend /f/ /l/ /a/ /g/.", ["flag"]),
    paItem("pa-k-eoy-06", "phoneme_blending", "three_phoneme", "Blend /ch/ /o/ /p/.", ["chop"]),
    paItem("pa-k-eoy-07", "phoneme_segmentation", "four_phoneme", "Tell me every sound in frog.", ["f r o g", "/f/ /r/ /o/ /g/"]),
    paItem("pa-k-eoy-08", "phoneme_segmentation", "three_phoneme", "Tell me every sound in shop.", ["sh o p", "/sh/ /o/ /p/"]),
    paItem("pa-k-eoy-09", "phoneme_deletion", "initial", "Say smile without /s/.", ["mile"]),
    paItem("pa-k-eoy-10", "phoneme_deletion", "final", "Say seat without /t/.", ["see"]),
    paItem("pa-k-eoy-11", "phoneme_substitution", "initial", "Change the /m/ in map to /t/. What word now?", ["tap"]),
    paItem("pa-k-eoy-12", "phoneme_substitution", "medial", "Change the /i/ in sit to /a/. What word now?", ["sat"])
  ],
  "1-BOY": [
    paItem("pa-1-boy-01", "rhyme", "production", "Tell me a word that rhymes with bright.", ["light", "night", "right", "sight", "tight"]),
    paItem("pa-1-boy-02", "syllable", "segmentation", "Say cactus in parts.", ["cac tus", "cac-tus", "cactus:2"]),
    paItem("pa-1-boy-03", "onset_rime", "blending", "What word is /st/ ... /op/?", ["stop"]),
    paItem("pa-1-boy-04", "phoneme_isolation", "medial", "What vowel sound do you hear in moon?", ["oo", "/oo/", "u"]),
    paItem("pa-1-boy-05", "phoneme_blending", "four_phoneme", "Blend /s/ /t/ /e/ /p/.", ["step"]),
    paItem("pa-1-boy-06", "phoneme_segmentation", "four_phoneme", "Tell me every sound in milk.", ["m i l k", "/m/ /i/ /l/ /k/"]),
    paItem("pa-1-boy-07", "phoneme_deletion", "initial", "Say plane without /p/.", ["lane"]),
    paItem("pa-1-boy-08", "phoneme_deletion", "final", "Say bead without /d/.", ["bee"]),
    paItem("pa-1-boy-09", "phoneme_substitution", "initial", "Change the /f/ in fan to /r/. What word now?", ["ran"]),
    paItem("pa-1-boy-10", "phoneme_substitution", "final", "Change the /p/ in cap to /t/. What word now?", ["cat"])
  ],
  "1-MOY": [
    paItem("pa-1-moy-01", "syllable", "blending", "What word do these parts make: rain ... coat?", ["raincoat"]),
    paItem("pa-1-moy-02", "syllable", "segmentation", "Say robot in parts.", ["ro bot", "ro-bot", "robot:2"]),
    paItem("pa-1-moy-03", "onset_rime", "blending", "What word is /br/ ... /ush/?", ["brush"]),
    paItem(
      "pa-1-moy-04",
      "phoneme_isolation",
      "medial",
      "What vowel sound do you hear in train?",
      ["long a", "long-a", "ay", "/eɪ/", "eɪ"],
      undefined,
      {
        teacherJudgmentRequired: true,
        dialectSensitive: true,
        administrationNote: "Accept an unambiguous oral production of the long /eɪ/ vowel appropriate to the student's dialect; do not accept a bare letter-name transcription without hearing the response."
      }
    ),
    paItem("pa-1-moy-05", "phoneme_blending", "five_phoneme", "Blend /s/ /p/ /l/ /a/ /sh/.", ["splash"]),
    paItem("pa-1-moy-06", "phoneme_segmentation", "five_phoneme", "Tell me every sound in crisp.", ["c r i s p", "k r i s p", "/k/ /r/ /i/ /s/ /p/"]),
    paItem("pa-1-moy-07", "phoneme_deletion", "initial", "Say grow without /g/.", ["row"]),
    paItem("pa-1-moy-08", "phoneme_deletion", "medial", "Say slip without /l/.", ["sip"]),
    paItem("pa-1-moy-09", "phoneme_substitution", "initial", "Change the /ch/ in chop to /sh/. What word now?", ["shop"]),
    paItem("pa-1-moy-10", "phoneme_substitution", "final", "Change the /m/ in team to /ch/. What word now?", ["teach"])
  ],
  "1-EOY": [
    paItem("pa-1-eoy-01", "syllable", "deletion", "Say sunset without sun.", ["set"]),
    paItem("pa-1-eoy-02", "syllable", "deletion", "Say cupcake without cake.", ["cup"]),
    paItem("pa-1-eoy-03", "phoneme_isolation", "medial", "What vowel sound do you hear in coin?", ["oi", "/oi/"]),
    paItem("pa-1-eoy-04", "phoneme_isolation", "medial", "What vowel sound do you hear in turn?", ["ur", "/ur/", "er"]),
    paItem("pa-1-eoy-05", "phoneme_blending", "cluster", "Blend /s/ /t/ /r/ /i/ /ng/.", ["string"]),
    paItem("pa-1-eoy-06", "phoneme_segmentation", "cluster", "Tell me every sound in stamp.", ["s t a m p", "/s/ /t/ /a/ /m/ /p/"]),
    paItem("pa-1-eoy-07", "phoneme_deletion", "initial", "Say stone without /s/.", ["tone"]),
    paItem("pa-1-eoy-08", "phoneme_deletion", "medial", "Say clamp without /l/.", ["camp"]),
    paItem("pa-1-eoy-09", "phoneme_substitution", "initial", "Change the /b/ in brag to /d/. What word now?", ["drag"]),
    paItem("pa-1-eoy-10", "phoneme_substitution", "medial", "Change the /r/ in frog to /l/. What word now?", ["flog"]),
    paItem("pa-1-eoy-11", "phoneme_substitution", "vowel", "Change the vowel in pin to /a/. What word now?", ["pan"]),
    paItem("pa-1-eoy-12", "phoneme_substitution", "final", "Change the /t/ in seat to /m/. What word now?", ["seam"])
  ],
  "2-BOY": [
    paItem("pa-2-boy-01", "syllable", "segmentation", "Say fantastic in parts.", ["fan tas tic", "fan-tas-tic", "fantastic:3"]),
    paItem("pa-2-boy-02", "syllable", "deletion", "Say raincoat without rain.", ["coat"]),
    paItem("pa-2-boy-03", "phoneme_isolation", "medial", "What vowel sound do you hear in shout?", ["ou", "ow", "/ou/"]),
    paItem("pa-2-boy-04", "phoneme_blending", "cluster", "Blend /s/ /k/ /r/ /a/ /p/.", ["scrap"]),
    paItem("pa-2-boy-05", "phoneme_segmentation", "cluster", "Tell me every sound in thrift.", ["th r i f t", "/th/ /r/ /i/ /f/ /t/"]),
    paItem("pa-2-boy-06", "phoneme_deletion", "initial", "Say spray without /s/.", ["pray"]),
    paItem("pa-2-boy-07", "phoneme_deletion", "medial", "Say crash without /r/.", ["cash"]),
    paItem("pa-2-boy-08", "phoneme_substitution", "initial", "Change the /k/ in clap to /f/. What word now?", ["flap"]),
    paItem("pa-2-boy-09", "phoneme_substitution", "medial", "Change the /l/ in slip to /k/. What word now?", ["skip"]),
    paItem("pa-2-boy-10", "phoneme_substitution", "final", "Change the /t/ in bright to /d/. What word now?", ["bride"])
  ],
  "2-MOY": [
    paItem("pa-2-moy-01", "syllable", "segmentation", "Say adventure in parts.", ["ad ven ture", "ad-ven-ture", "adventure:3"]),
    paItem("pa-2-moy-02", "syllable", "deletion", "Say replay without re.", ["play"]),
    paItem("pa-2-moy-03", "phoneme_isolation", "medial", "What vowel sound do you hear in choice?", ["oi", "/oi/"]),
    paItem("pa-2-moy-04", "phoneme_blending", "cluster", "Blend /s/ /p/ /r/ /i/ /ng/.", ["spring"]),
    paItem("pa-2-moy-05", "phoneme_segmentation", "cluster", "Tell me every sound in branch.", ["b r a n ch", "/b/ /r/ /a/ /n/ /ch/"]),
    paItem("pa-2-moy-06", "phoneme_deletion", "initial", "Say scream without /s/.", ["cream"]),
    paItem("pa-2-moy-07", "phoneme_deletion", "medial", "Say blend without /l/.", ["bend"]),
    paItem("pa-2-moy-08", "phoneme_substitution", "initial", "Change the /t/ in track to /k/. What word now?", ["crack"]),
    paItem("pa-2-moy-09", "phoneme_substitution", "medial", "Change the /r/ in frog to /l/. What word now?", ["flog"]),
    paItem("pa-2-moy-10", "phoneme_substitution", "final", "Change the /p/ in sweep to /t/. What word now?", ["sweet"])
  ],
  "2-EOY": [
    paItem("pa-2-eoy-01", "syllable", "segmentation", "Say information in parts.", ["in for ma tion", "in-for-ma-tion", "information:4"]),
    paItem("pa-2-eoy-02", "syllable", "deletion", "Say unfinished without un.", ["finished"]),
    paItem("pa-2-eoy-03", "phoneme_isolation", "medial", "What vowel sound do you hear in boil?", ["oi", "/oi/"]),
    paItem("pa-2-eoy-04", "phoneme_blending", "cluster", "Blend /s/ /t/ /r/ /e/ /ch/.", ["stretch"]),
    paItem("pa-2-eoy-05", "phoneme_segmentation", "cluster", "Tell me every sound in sprint.", ["s p r i n t", "/s/ /p/ /r/ /i/ /n/ /t/"]),
    paItem("pa-2-eoy-06", "phoneme_deletion", "initial", "Say stripe without /s/.", ["tripe"]),
    paItem("pa-2-eoy-07", "phoneme_deletion", "medial", "Say brand without /r/.", ["band"]),
    paItem("pa-2-eoy-08", "phoneme_substitution", "initial", "Change the /s/ in slide to /g/. What word now?", ["glide"]),
    paItem("pa-2-eoy-09", "phoneme_substitution", "medial", "Change the /l/ in clam to /r/. What word now?", ["cram"]),
    paItem("pa-2-eoy-10", "phoneme_substitution", "medial", "Change the /p/ in spoke to /t/. What word now?", ["stoke"]),
    paItem("pa-2-eoy-11", "phoneme_substitution", "vowel", "Change the vowel sound in team to long /ī/ (the sound /aɪ/). What word now?", ["time"]),
    paItem("pa-2-eoy-12", "phoneme_deletion", "final", "Say paint without /t/.", ["pain"])
  ]
});

function encodingItem(id, targetWord, sentence, featureTags, plausibleSpellings = []) {
  return {
    id,
    kind: "word_dictation",
    prompt: "Write the word you hear.",
    teacherSay: `${targetWord}. ${sentence} ${targetWord}.`,
    targetWord,
    sentence,
    acceptedSpellings: [targetWord],
    plausibleSpellings,
    featureTags
  };
}

const ENCODING_FORMS = Object.freeze({
  "K-BOY": [
    encodingItem("enc-k-boy-01", "am", "I am here.", ["vc", "short_a"]),
    encodingItem("enc-k-boy-02", "at", "Look at the cup.", ["vc", "short_a"]),
    encodingItem("enc-k-boy-03", "map", "I drew a map.", ["cvc", "short_a"]),
    encodingItem("enc-k-boy-04", "sit", "Please sit down.", ["cvc", "short_i"]),
    encodingItem("enc-k-boy-05", "sun", "The sun is warm.", ["cvc", "short_u"]),
    encodingItem("enc-k-boy-06", "red", "The hat is red.", ["cvc", "short_e"]),
    encodingItem("enc-k-boy-07", "hop", "The rabbit can hop.", ["cvc", "short_o"]),
    encodingItem("enc-k-boy-08", "cup", "Fill the cup.", ["cvc", "short_u"])
  ],
  "K-MOY": [
    encodingItem("enc-k-moy-01", "cat", "The cat naps.", ["cvc", "short_a"]),
    encodingItem("enc-k-moy-02", "hen", "The hen pecks.", ["cvc", "short_e"]),
    encodingItem("enc-k-moy-03", "pig", "The pig digs.", ["cvc", "short_i"]),
    encodingItem("enc-k-moy-04", "fox", "The fox ran.", ["cvc", "short_o", "final_x"], ["foks"]),
    encodingItem("enc-k-moy-05", "rug", "The rug is soft.", ["cvc", "short_u"]),
    encodingItem("enc-k-moy-06", "jam", "Spread the jam.", ["cvc", "short_a"]),
    encodingItem("enc-k-moy-07", "bed", "Make the bed.", ["cvc", "short_e"]),
    encodingItem("enc-k-moy-08", "bus", "The bus stopped.", ["cvc", "short_u"])
  ],
  "K-EOY": [
    encodingItem("enc-k-eoy-01", "ship", "The ship can sail.", ["digraph", "short_i"]),
    encodingItem("enc-k-eoy-02", "chat", "We had a chat.", ["digraph", "short_a"], ["chatt"]),
    encodingItem("enc-k-eoy-03", "thin", "The twig is thin.", ["digraph", "short_i"], ["thinn"]),
    encodingItem("enc-k-eoy-04", "frog", "A frog can jump.", ["initial_blend", "short_o"]),
    encodingItem("enc-k-eoy-05", "clap", "Clap your hands.", ["initial_blend", "short_a"]),
    encodingItem("enc-k-eoy-06", "nest", "A bird has a nest.", ["final_blend", "short_e"]),
    encodingItem("enc-k-eoy-07", "jump", "Jump over the line.", ["final_blend", "short_u"]),
    encodingItem("enc-k-eoy-08", "ring", "The bell will ring.", ["final_digraph", "short_i"])
  ],
  "1-BOY": [
    encodingItem("enc-1-boy-01", "shop", "We went to the shop.", ["digraph", "short_o"]),
    encodingItem("enc-1-boy-02", "much", "That is too much.", ["digraph", "short_u"]),
    encodingItem("enc-1-boy-03", "path", "The path is wet.", ["digraph", "short_a"]),
    encodingItem("enc-1-boy-04", "flag", "The flag moved.", ["initial_blend", "short_a"]),
    encodingItem("enc-1-boy-05", "stop", "Stop at the gate.", ["initial_blend", "short_o"]),
    encodingItem("enc-1-boy-06", "hand", "Raise your hand.", ["final_blend", "short_a"]),
    encodingItem("enc-1-boy-07", "milk", "The milk is cold.", ["final_blend", "short_i"]),
    encodingItem("enc-1-boy-08", "fast", "The dog can run fast.", ["final_blend", "short_a"])
  ],
  "1-MOY": [
    encodingItem("enc-1-moy-01", "cake", "We baked a cake.", ["silent_e", "long_a"], ["kake"]),
    encodingItem("enc-1-moy-02", "bike", "I ride my bike.", ["silent_e", "long_i"]),
    encodingItem("enc-1-moy-03", "home", "We went home.", ["silent_e", "long_o"], ["hoam"]),
    encodingItem("enc-1-moy-04", "cube", "The block is a cube.", ["silent_e", "long_u"]),
    encodingItem("enc-1-moy-05", "rain", "The rain fell.", ["vowel_team", "long_a"], ["rane"]),
    encodingItem("enc-1-moy-06", "seed", "Plant the seed.", ["vowel_team", "long_e"], ["sead"]),
    encodingItem("enc-1-moy-07", "boat", "The boat can float.", ["vowel_team", "long_o"], ["bote"]),
    encodingItem("enc-1-moy-08", "play", "We like to play.", ["vowel_team", "long_a"])
  ],
  "1-EOY": [
    encodingItem("enc-1-eoy-01", "farm", "We visited a farm.", ["r_controlled", "ar"]),
    encodingItem("enc-1-eoy-02", "bird", "The bird can sing.", ["r_controlled", "ir"], ["berd"]),
    encodingItem("enc-1-eoy-03", "turn", "Turn the page.", ["r_controlled", "ur"], ["tern"]),
    encodingItem("enc-1-eoy-04", "coin", "I found a coin.", ["diphthong", "oi"]),
    encodingItem("enc-1-eoy-05", "cloud", "A cloud crossed the sky.", ["diphthong", "ou"]),
    encodingItem("enc-1-eoy-06", "moon", "The moon is bright.", ["vowel_team", "oo"]),
    encodingItem("enc-1-eoy-07", "sunset", "We watched the sunset.", ["compound", "two_syllable"]),
    encodingItem("enc-1-eoy-08", "jumping", "The frog is jumping.", ["suffix", "inflection", "two_syllable"])
  ],
  "2-BOY": [
    encodingItem("enc-2-boy-01", "magnet", "The magnet held the note.", ["two_syllable", "closed_syllables"]),
    encodingItem("enc-2-boy-02", "napkin", "Use a clean napkin.", ["two_syllable", "closed_syllables"]),
    encodingItem("enc-2-boy-03", "farmer", "The farmer fed the hens.", ["suffix", "r_controlled"], ["farmur"]),
    encodingItem("enc-2-boy-04", "hopeful", "We felt hopeful.", ["suffix", "silent_e"], ["hopefull"]),
    encodingItem("enc-2-boy-05", "camping", "We are camping tonight.", ["suffix", "inflection"]),
    encodingItem("enc-2-boy-06", "rested", "The tired dog rested.", ["suffix", "inflection"]),
    encodingItem("enc-2-boy-07", "refill", "Please refill the cup.", ["prefix", "closed_syllables"]),
    encodingItem("enc-2-boy-08", "wishes", "She makes three wishes.", ["suffix", "inflection"])
  ],
  "2-MOY": [
    encodingItem("enc-2-moy-01", "painter", "The painter used a brush.", ["suffix", "vowel_team"]),
    encodingItem("enc-2-moy-02", "fearless", "The fearless fox crossed.", ["suffix", "vowel_team"], ["feerless"]),
    encodingItem("enc-2-moy-03", "dislike", "I dislike soggy toast.", ["prefix", "silent_e"]),
    encodingItem("enc-2-moy-04", "slowly", "The snail moved slowly.", ["suffix", "vowel_team"]),
    encodingItem("enc-2-moy-05", "kindness", "Kindness helps a team.", ["suffix", "closed_syllables"]),
    encodingItem("enc-2-moy-06", "replay", "We can replay the song.", ["prefix", "vowel_team"]),
    encodingItem("enc-2-moy-07", "careful", "Be careful near the edge.", ["suffix", "r_controlled"], ["carefull"]),
    encodingItem("enc-2-moy-08", "movement", "The movement was smooth.", ["suffix", "exceptional_vowel"], ["moovment"])
  ],
  "2-EOY": [
    encodingItem("enc-2-eoy-01", "adventure", "The hike was an adventure.", ["multisyllable", "r_controlled"]),
    encodingItem("enc-2-eoy-02", "discover", "We may discover a clue.", ["prefix", "multisyllable"]),
    encodingItem("enc-2-eoy-03", "unfinished", "The picture is unfinished.", ["prefix", "suffix", "multisyllable"]),
    encodingItem("enc-2-eoy-04", "enjoyment", "The game brought enjoyment.", ["suffix", "diphthong"], ["enjoiment"]),
    encodingItem("enc-2-eoy-05", "impossible", "The first plan felt impossible.", ["prefix", "multisyllable"], ["impossibul"]),
    encodingItem("enc-2-eoy-06", "information", "The sign gives information.", ["suffix", "multisyllable"], ["informashun"]),
    encodingItem("enc-2-eoy-07", "helpfulness", "Her helpfulness mattered.", ["suffix", "multisyllable"]),
    encodingItem("enc-2-eoy-08", "happily", "The puppy played happily.", ["suffix", "y_change"], ["hapily"])
  ]
});

const DECODING_WORDS = Object.freeze({
  middle_pre: [["an", ["vc", "short_a"]], ["if", ["vc", "short_i"]], ["in", ["vc", "short_i"]], ["it", ["vc", "short_i"]], ["on", ["vc", "short_o"]], ["up", ["vc", "short_u"]], ["sat", ["cvc", "short_a", "one_to_one_cvc"]], ["mat", ["cvc", "short_a", "one_to_one_cvc"]]],
  early_partial: [["man", ["cvc", "short_a", "one_to_one_cvc"]], ["rag", ["cvc", "short_a", "one_to_one_cvc"]], ["ten", ["cvc", "short_e", "one_to_one_cvc"]], ["web", ["cvc", "short_e", "one_to_one_cvc"]], ["lip", ["cvc", "short_i", "one_to_one_cvc"]], ["nod", ["cvc", "short_o", "one_to_one_cvc"]], ["run", ["cvc", "short_u", "one_to_one_cvc"]], ["mud", ["cvc", "short_u", "one_to_one_cvc"]]],
  middle_partial: [["back", ["closed_syllable", "short_a", "final_ck"]], ["bell", ["closed_syllable", "short_e", "final_double"]], ["kiss", ["closed_syllable", "short_i", "final_double"]], ["sock", ["closed_syllable", "short_o", "final_ck"]], ["duck", ["closed_syllable", "short_u", "final_ck"]], ["wax", ["closed_syllable", "short_a", "final_x"]], ["buzz", ["closed_syllable", "short_u", "final_double"]], ["quit", ["closed_syllable", "short_i", "initial_qu"]]],
  late_partial: [["shed", ["digraph", "initial_sh"]], ["chin", ["digraph", "initial_ch"]], ["bath", ["digraph", "final_th"]], ["whip", ["digraph", "initial_wh"]], ["crab", ["initial_blend"]], ["grip", ["initial_blend"]], ["lamp", ["final_blend"]], ["desk", ["final_blend"]]],
  early_full: [["shelf", ["digraph", "final_blend"]], ["chest", ["digraph", "final_blend"]], ["thank", ["digraph", "final_blend"]], ["whisk", ["digraph", "final_blend"]], ["scrap", ["three_consonant_cluster"]], ["twist", ["initial_blend", "final_blend"]], ["blend", ["initial_blend", "final_blend"]], ["crust", ["initial_blend", "final_blend"]]],
  middle_full: [["gate", ["silent_e", "long_a"]], ["kite", ["silent_e", "long_i"]], ["rope", ["silent_e", "long_o"]], ["mule", ["silent_e", "long_u"]], ["mail", ["vowel_team", "long_a"]], ["feet", ["vowel_team", "long_e"]], ["coat", ["vowel_team", "long_o"]], ["tray", ["vowel_team", "long_a"]]],
  late_full: [["storm", ["r_controlled", "or"]], ["fern", ["r_controlled", "er"]], ["shirt", ["r_controlled", "ir"]], ["burn", ["r_controlled", "ur"]], ["join", ["diphthong", "oi"]], ["boy", ["diphthong", "oy"]], ["pouch", ["diphthong", "ou"]], ["room", ["vowel_team", "oo"]]],
  early_consolidated: [["sandpit", ["compound", "two_syllable"]], ["kitten", ["two_syllable", "closed_syllables"]], ["basket", ["two_syllable", "closed_syllables"]], ["cobweb", ["compound", "two_syllable"]], ["helmet", ["two_syllable", "closed_syllables"]], ["lemon", ["two_syllable"]], ["helper", ["suffix"]], ["landed", ["inflection"]]],
  middle_consolidated: [["thankful", ["suffix"]], ["skipping", ["inflection"]], ["wished", ["inflection"]], ["unlock", ["prefix"]], ["reader", ["suffix"]], ["endless", ["suffix"]], ["melted", ["inflection"]], ["recheck", ["prefix"]]],
  late_consolidated: [["wonderful", ["multisyllable", "suffix"]], ["remember", ["multisyllable"]], ["musician", ["multisyllable", "suffix"]], ["cheerfulness", ["multisyllable", "suffix"]], ["preview", ["prefix"]], ["misbehave", ["prefix", "multisyllable"]], ["agreement", ["multisyllable", "suffix"]], ["quietly", ["multisyllable", "suffix"]]]
});

function fluencyPassage(microphaseId, title, text, referenceGrade, referenceWindow, featureTags, audit = {}, formKey = "a") {
  const microphase = MICROPHASE_BY_ID[microphaseId];
  if (!microphase) throw new RangeError(`Unsupported fluency passage microphase: ${microphaseId}`);
  const words = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  const design = EL_FLUENCY_DESIGN[formKey]?.[microphaseId];
  return {
    id: `orf-${microphaseId}-${formKey}-v2`,
    contentVersion: formKey === "a" ? EL_BENCHMARK_CONTENT_VERSION : "2026.09.28-depth-v2",
    kind: "fluency_passage",
    title,
    text,
    wordCount: words.length,
    referenceGrade,
    referenceWindow,
    microphase: microphase.id,
    microphaseLabel: microphase.label,
    microphaseOrder: microphase.order,
    anchorCycle: microphase.anchorCycle,
    bandId: microphase.id,
    featureTags,
    timingSeconds: 60,
    wordAudit: {
      tokenPattern: "letters_with_internal_apostrophe_or_hyphen",
      auditedWordCount: words.length,
      minimumOpportunityWords: audit.minimumOpportunityWords,
      meetsMinimumOpportunity: words.length >= audit.minimumOpportunityWords
    },
    featureAudit: {
      primaryPatterns: featureTags,
      controlNotes: design ? "The listed focus words sample this named band's spelling structures in an original connected text. Supporting vocabulary is disclosed for teacher review and is not a word list to preteach. This audit does not certify every token as independently decodable or equate passage difficulty." : audit.controlNotes,
      focusWords: design?.focusWords || [],
      plannedSupportWords: design?.plannedSupportWords || audit.plannedSupportWords || [],
      originalAuthoredText: true
    },
    finishEarlyProtocol: "If the student reaches the end before 60 seconds, record finishedEarly and the actual elapsed time. Do not extrapolate or report WCPM; retain the completed-text accuracy observation and use teacher judgement before continuing.",
    prosodyRubric: {
      dimensions: ["expression", "phrasing", "smoothness", "pace"],
      minimum: 1,
      maximum: 4,
      levels: EL_FLUENCY_PROSODY_LEVELS,
      administrationNote: "Rate only what was observed. Use the descriptors separately for expression, phrasing, smoothness and pace; this is an original descriptive rubric, not a normed scale."
    },
    meaningCheck: { prompt: "Tell me what happened or what you learned in this passage.", expectedEvidence: "A relevant idea supported by this passage. Invite the student to point to the part they remember; record their exact words without awarding a score.", scored: false, administrationNote: "Optional, after timing and after the complete text has been read. Keep separate from fluency and placement evidence." }
  };
}

/**
 * One original connected-text passage for every named decoding microphase.
 * The overview directs Fluency to begin at the Decoding handoff microphase
 * and move upward until the first passage the teacher judges no longer
 * accurate after one minute.  These texts are therefore keyed to microphase,
 * not to benchmark window; grade/window below records the reference route that
 * originally supplied each text and does not restrict its administration.
 */
export const EL_FLUENCY_PASSAGES = Object.freeze([
  fluencyPassage(
    "middle_pre",
    "A Cup for the Pup",
    "Sam has a pup. The pup can run and hop. It can dig in the mud. Sam has a red cup for the pup. He can put the cup on a mat. The pup can get a sip. Sam sits on a log. The pup sits by him. Sam pats the pup on its back. The pup has a nap on the mat. Sam can get his cap and sit in the sun. The cup is on the mat by the pup.",
    "K",
    "BOY",
    ["vc", "cvc", "short_vowels", "repeated_sentence_frames"],
    {
      minimumOpportunityWords: 80,
    }
  ),
  fluencyPassage(
    "early_partial",
    "The Bag of Pots",
    "Dan has a big bag. In it he has a red pot and a tan pot. He can fit a cup in the bag, but not a jug. The jug is too big. Dan puts the jug on a mat. He gets his dad to help. His dad has a tub. The jug can fit in the tub. Dan puts the bag by the tub. His dad can lift the tub, and Dan can lift the bag. They set them in the hut. Now each pot has a spot.",
    "K",
    "MOY",
    ["cvc", "short_vowels", "one_to_one_cvc"],
    {
      minimumOpportunityWords: 85,
    }
  ),
  fluencyPassage(
    "middle_partial",
    "A Bell for the Cat",
    "Jess has a cat with a bell on its neck. The cat can run up to a box and hop in. Jess can hear the bell, but she cannot see the cat. She looks in a sack and by a tall pot. Then the bell rings from the box. Jess lifts the lid. The cat jumps out and knocks a sock off the bed. What a mess! Jess puts the sock back. The cat sits by her and gives a soft puff. Jess can pat the cat as the bell goes still.",
    "K",
    "EOY",
    ["closed_syllables", "final_ck", "final_double", "final_x"],
    {
      minimumOpportunityWords: 90,
    }
  ),
  fluencyPassage(
    "late_partial",
    "A Shell on the Path",
    "Chad and Beth walk on a path by a pond. Beth spots a shell in the mud. She lifts it and rubs off the mud with a cloth. The shell has a crack, but its pink stripes still show. Chad finds a flat rock. He puts the shell on it so Beth can sketch it in her pad. A frog jumps past them and lands with a splash. Beth shuts her pad and puts it in her bag. They leave the shell by the pond. On the way back, they tell Dad what they found.",
    "1",
    "BOY",
    ["digraphs", "initial_blends", "final_blends"],
    {
      minimumOpportunityWords: 95,
    }
  ),
  fluencyPassage(
    "early_full",
    "The Class Print Shop",
    "The class has a plan to print cards for the school fair. Fran cuts a thick pad into the shape of a leaf. Brad dips it in red paint and presses it on a card. The first print has a blank spot. Fran checks the pad and finds a small lump. She trims it off. Brad tests the pad on a scrap, and the next print looks clear. The rest of the class help fold and stack the cards. They set them on a shelf to dry. At the fair, each card has a crisp print and a message from the class.",
    "1",
    "EOY",
    ["digraphs", "initial_blends", "final_blends", "consonant_clusters"],
    {
      minimumOpportunityWords: 100,
    }
  ),
  fluencyPassage(
    "middle_full",
    "Rain for the Garden",
    "For many days, the garden soil is dry. Leila carries a can of water to each plant before school. She waits for rain, but the sky stays clear. One evening, dark clouds roll over the town. Rain beats on the roof and fills the small pond. A cool stream runs beside the bean rows. The next morning, green shoots stand tall. Drops gleam on every leaf, and snails creep along the wet stones. Leila checks the seed beds and sees that each plant has enough water. She places the empty can in the shed and makes a neat sign that reads, Rain did the job today.",
    "1",
    "MOY",
    ["vowel_teams", "silent_e", "open_syllables", "inflections", "two_syllable_words"],
    {
      minimumOpportunityWords: 105,
      controlNotes: "Common long-vowel teams and silent-e patterns recur across a longer connected text, with transparent inflections and a small set of two-syllable words.",
      plannedSupportWords: ["before", "one", "every", "enough", "today"]
    }
  ),
  fluencyPassage(
    "late_full",
    "The Night Walk",
    "After dinner, Arun and his aunt walk along the quiet trail behind their farm. Their torch makes a bright circle on the ground. A moth darts past, and an owl calls from a tall tree. Arun hears dry leaves crunch near a thorn bush. He turns and sees a small hedgehog hurry across the path. Farther on, moonlight shines on a pool beside the trail. A brown frog crouches on a round stone, then dives with a soft splash. Arun points toward the north field, where fireflies flash around the corn. They pause to enjoy the glow. When a cool wind starts, Arun and his aunt return home under the moon.",
    "1",
    "EOY",
    ["r_controlled_vowels", "diphthongs", "complex_vowel_teams", "inflections", "two_syllable_words"],
    {
      minimumOpportunityWords: 110,
      controlNotes: "R-controlled vowels, diphthongs, and less common vowel teams repeat in a cohesive narrative with manageable two-syllable words.",
      plannedSupportWords: ["after", "their", "where", "toward", "when", "under"]
    }
  ),
  fluencyPassage(
    "early_consolidated",
    "The Bridge of Sticks",
    "A spring storm washes part of the footbridge into the creek near the outdoor classroom. The children cannot cross, so their teacher helps them plan a safe model. First, they collect craft sticks, string, tape, and small stones. Each team sketches a different bridge. One group builds a flat deck, while another adds triangle supports underneath. They place stones on each model, one at a time. The flat bridge bends after six stones. The bridge with triangles stays firm through twelve. The children compare the results and mark the strongest joints. Their careful experiment shows where a repaired footbridge will need thicker boards and stronger supports before anyone crosses the creek again. They save the plans for the repair team.",
    "2",
    "BOY",
    ["compound_words", "two_syllable_words", "inflections", "syllable_junctures", "informational_narrative"],
    {
      minimumOpportunityWords: 115,
      controlNotes: "Compounds, inflected bases, and transparent two-syllable words extend established vowel patterns in an informational narrative.",
      plannedSupportWords: ["their", "different", "another", "through", "before", "anyone"]
    }
  ),
  fluencyPassage(
    "middle_consolidated",
    "A Library for the Hall",
    "Our class notices that families often wait in the empty front hall after school. We decide to build a small sharing library for everyone. First, two students measure a sturdy shelf while the rest collect donated books. We sort the books by topic, reading level, and language. Next, we create simple labels, a borrowing chart, and a bright return box. A helpful parent repairs torn covers and reinforces the shelf. On opening day, a younger child chooses a book about distant planets. His sister selects a funny collection of poems. By Friday, nearly every book has travelled home with a reader and returned for someone new. The class celebrates the library's usefulness and begins planning a second shelf. Soon, neighbors donate more stories.",
    "2",
    "MOY",
    ["prefixes", "suffixes", "inflected_endings", "multisyllable_words", "sequence_language"],
    {
      minimumOpportunityWords: 120,
      controlNotes: "Common prefixes, suffixes, and inflected bases occur in increasingly long words while sequence language supports meaning and phrasing.",
      plannedSupportWords: ["everyone", "language", "younger", "distant", "nearly", "begins"]
    }
  ),
  fluencyPassage(
    "late_consolidated",
    "Why the Pond Changed",
    "During spring, Mei records what she observes at the neighborhood pond each week. At first, the water is clear, the reeds are short, and tiny insects skim the surface. Later, tadpoles gather near the sunlit edge while dragonflies hover above them. By early summer, taller plants shade part of the bank, and the tadpoles have developed back legs. Mei photographs the same three places during every visit. Then she compares the pictures with her dated notes and a rainfall chart. Her evidence shows that the pond has not become a completely different place. Instead, living things have grown, arrived, disappeared, or changed as the season moved forward. Mei organizes her observations into a display so visitors can understand the pond's gradual transformation. Her classmates ask thoughtful questions.",
    "2",
    "EOY",
    ["multisyllable_words", "derivational_morphology", "prefixes", "suffixes", "cause_and_change", "informational_text"],
    {
      minimumOpportunityWords: 125,
      controlNotes: "Longer multisyllable words and transparent derivational morphology appear in a coherent informational explanation with comparison and change language.",
      plannedSupportWords: ["neighborhood", "dragonflies", "photographs", "developed", "completely", "transformation"]
    }
  )
]);

function buildParallelFluencyPassages(formKey) {
  return Object.freeze(EL_FLUENCY_PASSAGES.map(blueprint => {
    const content = EL_PARALLEL_FLUENCY_CONTENT[formKey]?.[blueprint.microphase];
    if (!content?.title || !content?.text) {
      throw new RangeError(`Missing Form ${formKey.toUpperCase()} Fluency passage for ${blueprint.microphase}.`);
    }
    return fluencyPassage(
      blueprint.microphase,
      content.title,
      content.text,
      blueprint.referenceGrade,
      blueprint.referenceWindow,
      blueprint.featureTags,
      {
        minimumOpportunityWords: blueprint.wordAudit.minimumOpportunityWords,
        controlNotes: `Parallel ${formKey.toUpperCase()} passage authored to the same named microphase and feature blueprint as Form A.`,
        plannedSupportWords: []
      },
      formKey
    );
  }));
}

export const EL_FLUENCY_PASSAGES_BY_FORM = Object.freeze({
  [EL_BENCHMARK_FORM_IDS.A]: EL_FLUENCY_PASSAGES,
  [EL_BENCHMARK_FORM_IDS.B]: buildParallelFluencyPassages("b"),
  [EL_BENCHMARK_FORM_IDS.C]: buildParallelFluencyPassages("c")
});

const FLUENCY_PASSAGES_BY_FORM = Object.freeze(Object.fromEntries(
  Object.entries(EL_FLUENCY_PASSAGES_BY_FORM).map(([formId, passages]) => [
    formId,
    Object.freeze(Object.fromEntries(passages.map(item => [item.microphase, item])))
  ])
));

const INSTRUCTIONS = Object.freeze({
  [EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS]: Object.freeze({
    practiceExamples: [
      { teacherSay: "Listen: bear and chair rhyme because their endings sound alike.", expectedResponse: "This is a model; no student answer is scored.", explanation: "Use this only to explain rhyme. Do not rehearse the scored target words." },
      { teacherSay: "Listen: mush ... room makes mushroom. I can also say mushroom in two parts: mush ... room.", expectedResponse: "An unscored demonstration of joining and separating syllables.", explanation: "Keep syllable parts separate from individual phonemes." },
      { teacherSay: "Listen: zoo starts with /z/. The sounds are /z/ /oo/.", expectedResponse: "An unscored demonstration of saying sounds rather than letter names.", explanation: "Use a pure consonant sound without adding 'uh'. Do not show the spelling." }
    ],
    teacher: [
      "Administer orally without showing letters or written words to the student.",
      "Give the prompt once, repeat it once if requested, and do not stretch or segment sounds beyond the scripted prompt.",
      "For an open rhyme, mark another genuine rhyme correct even when it is not in the example answer list.",
      "Judge dialect-sensitive vowel responses from the student's oral production; written answer labels are examples and must not override the sound heard.",
      "Record not administered, no response, and not scorable separately; do not turn them into the same result."
    ],
    studentPrompt: "We are going to play with the sounds in words. Listen carefully and answer aloud.",
    scoringNotes: ["Score the oral response, not pronunciation accent or dialect.", "Short vowel notation means the vowel in cat, bed, sit, hot or cup. Long vowel notation is explicitly marked; slash marks are teacher notation only.", "For segmentation, hear every sound or spoken syllable; a count alone does not demonstrate separation.", "Use error tags only when the observed response supports them."]
  }),
  [EL_BENCHMARK_IDS.ENCODING]: Object.freeze({
    practiceExamples: [
      { teacherSay: "Go. We can go now. Go.", expectedResponse: "go", explanation: "Unscored practice: check that the student knows to write the whole word. Explain the routine, then remove the practice spelling before assessment." }
    ],
    teacher: [
      "Give the student a pencil and lined paper before beginning.",
      "Say the target word, read its sentence, then repeat the target word.",
      "Do not show the word or name its spelling pattern.",
      "Use the quick outcome buttons for every item. Transcribe the student's spelling only when that added detail will help instruction.",
      "Mark phonologically plausible only when every heard phoneme has a reasonable representation for the student's dialect; exact spelling is scored separately."
    ],
    studentPrompt: "Write each word as carefully as you can. If you are unsure, write the sounds you hear.",
    scoringNotes: ["Exact and plausible are separate evidence fields.", "Authored plausible examples are examples, not an exhaustive list; teacher judgement can override them."]
  }),
  [EL_BENCHMARK_IDS.DECODING]: Object.freeze({
    practiceExamples: [
      { teacherSay: "This practice word is me. Try reading it. During the assessment, I will show each word without saying it first.", expectedResponse: "me", explanation: "A model of the response routine only. Never speak a scored word before the student attempts it." }
    ],
    teacher: [
      "Show one word at a time without pictures or sentence clues.",
      "Mark accurate when the final word is correct. Mark automatic only when it is read accurately without overt sounding out, using teacher judgement rather than an invented time cutoff.",
      "A self-correction may count as accurate but not automatic.",
      "Complete all eight words in a band before applying the stopping rule unless the student cannot continue; otherwise save the band as partial or discontinued."
    ],
    studentPrompt: "Read each word. You may try it even if you are not sure.",
    scoringNotes: ["Five or fewer automatic words out of eight is stopping evidence for that band.", "The rule guides administration; it is not a normed grade-level cut score."]
  }),
  [EL_BENCHMARK_IDS.ORAL_READING_FLUENCY]: Object.freeze({
    practiceExamples: [
      { teacherSay: "When I say begin, start at the first word. Keep reading until I say stop. You may try a hard word and keep going.", expectedResponse: "The student understands where to start and the stop signal.", explanation: "Explain the routine without previewing or rehearsing the scored passage. Read no passage words aloud beforehand." }
    ],
    teacher: [
      "Let the student read the passage directly from the screen. A printable clean copy is available in Optional details when needed.",
      "Start timing on the first spoken word. At 60 seconds, mark the last word attempted; let the student finish only if useful for instruction.",
      "Count an uncorrected substitution, omission, insertion, or supplied word as an error. Record self-corrections separately rather than as errors.",
      "After exactly one minute, explicitly judge whether the passage was read accurately; do not replace this teacher judgement with a percentage cutoff.",
      "Begin with the passage at the Decoding handoff microphase. If it is accurate, continue upward one named microphase at a time; stop after the first passage judged not accurate.",
      "Do not report a rate when elapsed time or words attempted is unreliable; use not scorable and retain the observation notes."
    ],
    studentPrompt: "Read this passage aloud in your best reading voice. If you come to a hard word, try it and keep going.",
    scoringNotes: ["WCPM is descriptive and not nationally normed here.", "Prosody uses four 1-4 ratings: expression, phrasing, smoothness, and pace."]
  })
});

function normalizeGrade(value) {
  const grade = String(value ?? "").trim().toUpperCase().replace(/^GRADE\s*/, "");
  if (["K", "KG", "KINDERGARTEN", "0"].includes(grade)) return "K";
  if (grade === "1") return "1";
  if (grade === "2") return "2";
  throw new RangeError(`Unsupported EL benchmark grade: ${value}`);
}

function normalizeWindow(value) {
  const window = String(value || "").trim().toUpperCase();
  if (WINDOWS.includes(window)) return window;
  throw new RangeError(`Unsupported EL benchmark window: ${value}`);
}

function normalizeFormId(value) {
  const normalized = String(value || "A").trim().toLowerCase();
  const aliases = {
    a: EL_BENCHMARK_FORM_IDS.A,
    "form-a": EL_BENCHMARK_FORM_IDS.A,
    "form-a-v3": EL_BENCHMARK_FORM_IDS.A,
    b: EL_BENCHMARK_FORM_IDS.B,
    "form-b": EL_BENCHMARK_FORM_IDS.B,
    "form-b-v2": EL_BENCHMARK_FORM_IDS.B,
    c: EL_BENCHMARK_FORM_IDS.C,
    "form-c": EL_BENCHMARK_FORM_IDS.C,
    "form-c-v2": EL_BENCHMARK_FORM_IDS.C
  };
  if (EL_LEGACY_BENCHMARK_CONTENT[normalized]) return normalized;
  if (aliases[normalized]) return aliases[normalized];
  throw new RangeError(`Unsupported EL benchmark form: ${value}`);
}

function getCatalogEntry(assessmentId) {
  const entry = EL_BENCHMARK_CATALOG.find(row => row.id === assessmentId);
  if (!entry) throw new RangeError(`Unsupported EL benchmark assessment: ${assessmentId}`);
  return entry;
}

function normalizeMicrophase(value, fallback) {
  if (value === undefined || value === null || value === "") return MICROPHASE_BY_ID[fallback];
  const text = String(value).trim().toLowerCase().replace(/^cycle[-_ ]?/, "").replace(/[ -]+/g, "_");
  if (MICROPHASE_BY_ID[text]) return MICROPHASE_BY_ID[text];
  const numeric = Number(text);
  if (Number.isInteger(numeric)) {
    const byCycle = EL_DECODING_MICROPHASES.find(microphase => microphase.anchorCycle === numeric);
    if (byCycle) return MICROPHASE_BY_ID[byCycle.id];
    const byOrder = EL_DECODING_MICROPHASES[numeric - 1];
    if (byOrder) return MICROPHASE_BY_ID[byOrder.id];
  }
  throw new RangeError(`Unsupported EL benchmark decoding microphase: ${value}`);
}

function microphaseRange(startId, endId) {
  const start = MICROPHASE_BY_ID[startId]?.order;
  const end = MICROPHASE_BY_ID[endId]?.order;
  if (!start || !end || start > end) throw new RangeError(`Invalid EL benchmark microphase range: ${startId} to ${endId}`);
  return EL_DECODING_MICROPHASES.slice(start - 1, end);
}

function plannedMicrophases(route, selected) {
  const routeRange = microphaseRange(route.rangeStart, route.rangeEnd);
  const rangeStartOrder = MICROPHASE_BY_ID[route.rangeStart].order;
  const rangeEndOrder = MICROPHASE_BY_ID[route.rangeEnd].order;
  if (selected.order < rangeStartOrder - 1 || selected.order > rangeEndOrder + 1) {
    throw new RangeError(
      `Selected microphase ${selected.id} is outside the ${route.rangeStart} to ${route.rangeEnd} route and its adjacent bands.`
    );
  }
  // The overview directs decoding to begin at the encoding-indicated band.
  // Keep the grade/window range as context, but never silently prepend easier
  // bands before the explicitly selected start.
  const plannedStart = selected.order;
  const plannedEnd = Math.max(selected.order, rangeEndOrder);
  return {
    routeRange,
    planned: EL_DECODING_MICROPHASES.slice(plannedStart - 1, plannedEnd)
  };
}

function formDefinition(formId) {
  const definition = FORM_DEFINITION_BY_ID[formId] || EL_LEGACY_BENCHMARK_CONTENT[formId]?.definition;
  if (!definition) throw new RangeError(`Unsupported EL benchmark form: ${formId}`);
  return definition;
}

function enrichPaItems(items, routeKey, formId) {
  const definition = formDefinition(formId);
  const rows = [...items, ...EL_PA_DEPTH_ITEMS[routeKey][definition.key]];
  return rows.map((item, index) => ({
    ...item,
    id: `pa-${routeKey.toLowerCase()}-${definition.key}-${String(index + 1).padStart(2, "0")}-${definition.key === "a" ? "v3" : "v2"}`,
    kind: "oral_sound_task",
    prompt: "Listen and answer aloud.",
    expectedAnswers: item.expectedAnswers.filter(answer => !/:\d+$/.test(answer)),
    teacherJudgmentRequired: !(item.strand === "rhyme" && item.task === "recognition"),
    dialectSensitive: true,
    featureTags: [item.strand, item.task],
    contentVersion: definition.contentVersion,
    administrationNote: [item.administrationNote, "Oral only. Say slash-marked units as sounds, not letter names, with no extra vowel after a consonant. Repeat the exact script once if needed; do not add clues."].filter(Boolean).join(" "),
    scoringGuidance: benchmarkOralGuidance(item)
  }));
}

function enrichEncodingItems(items, routeKey, formId) {
  const definition = formDefinition(formId);
  const rows = [...items, ...EL_ENCODING_DEPTH_ITEMS[routeKey][definition.key]];
  return rows.map((item, index) => ({
    ...item,
    id: `enc-${routeKey.toLowerCase()}-${definition.key}-${String(index + 1).padStart(2, "0")}-${definition.key === "a" ? "v3" : "v2"}`,
    kind: "word_dictation",
    prompt: "Listen, then write the word.",
    teacherSay: `${item.targetWord}. ${item.sentence} ${item.targetWord}.`,
    acceptedSpellings: [item.targetWord],
    plausibleSpellings: item.plausibleSpellings || [],
    contentVersion: definition.contentVersion,
    administrationNote: "Say word, sentence, word. Keep spelling and feature guidance hidden until the student has written. Repeat the whole script once if requested without stretching or segmenting the word.",
    featureGuidance: benchmarkFeatureGuidance(item.featureTags),
    scoringGuidance: {
      accept: "Exact spelling means conventional spelling. Phonologically plausible means every spoken phoneme is represented reasonably, allowing the student's accent; record these outcomes separately.",
      doNotAccept: "A plausible spelling is not an exact spelling. Do not infer a pattern was secure from a copied or teacher-supplied answer.",
      listenFor: "Record the actual letters written and compare the vowel, consonant groups, syllables and endings. Handwriting or language-access concerns can make an item not scorable."
    }
  }));
}

function parallelPaItems(routeKey, formId) {
  if (EL_LEGACY_BENCHMARK_CONTENT[formId]) return EL_LEGACY_BENCHMARK_CONTENT[formId].pa[routeKey];
  if (formId === EL_BENCHMARK_FORM_IDS.A) return enrichPaItems(PA_FORMS[routeKey], routeKey, formId);
  const definition = formDefinition(formId);
  const replacements = EL_PARALLEL_PA_CONTENT[routeKey];
  const blueprint = PA_FORMS[routeKey];
  if (!Array.isArray(replacements) || replacements.length !== blueprint.length) {
    throw new RangeError(`Incomplete ${definition.label} Sound Awareness blueprint for ${routeKey}.`);
  }
  return enrichPaItems(blueprint.map((item, index) => {
    const replacement = replacements[index]?.[definition.key];
    if (!replacement) throw new RangeError(`Missing ${definition.label} Sound Awareness item ${routeKey} ${index + 1}.`);
    return {
      ...item,
      id: `pa-${routeKey.toLowerCase()}-${definition.key}-${String(index + 1).padStart(2, "0")}-v1`,
      teacherSay: replacement[0],
      expectedAnswers: replacement[1]
    };
  }), routeKey, formId);
}

function parallelEncodingItems(routeKey, formId) {
  if (EL_LEGACY_BENCHMARK_CONTENT[formId]) return EL_LEGACY_BENCHMARK_CONTENT[formId].encoding[routeKey];
  if (formId === EL_BENCHMARK_FORM_IDS.A) return enrichEncodingItems(ENCODING_FORMS[routeKey], routeKey, formId);
  const definition = formDefinition(formId);
  const replacements = EL_PARALLEL_ENCODING_CONTENT[routeKey];
  const blueprint = ENCODING_FORMS[routeKey];
  if (!Array.isArray(replacements) || replacements.length !== blueprint.length) {
    throw new RangeError(`Incomplete ${definition.label} Encoding blueprint for ${routeKey}.`);
  }
  const offset = definition.key === "b" ? 0 : 3;
  return enrichEncodingItems(blueprint.map((item, index) => {
    const replacement = replacements[index];
    const targetWord = replacement?.[offset];
    const sentence = replacement?.[offset + 1];
    const plausibleSpellings = replacement?.[offset + 2];
    if (!targetWord || !sentence || !Array.isArray(plausibleSpellings)) {
      throw new RangeError(`Missing ${definition.label} Encoding item ${routeKey} ${index + 1}.`);
    }
    return {
      ...item,
      id: `enc-${routeKey.toLowerCase()}-${definition.key}-${String(index + 1).padStart(2, "0")}-v1`,
      teacherSay: `${targetWord}. ${sentence} ${targetWord}.`,
      targetWord,
      sentence,
      acceptedSpellings: [targetWord],
      plausibleSpellings,
      featureTags: replacement[6]?.[definition.key] || item.featureTags
    };
  }), routeKey, formId);
}

function decodingItems(microphases, formId) {
  if (EL_LEGACY_BENCHMARK_CONTENT[formId]) return microphases.flatMap(microphase => EL_LEGACY_BENCHMARK_CONTENT[formId].decoding[microphase.id]);
  const definition = formDefinition(formId);
  return microphases.flatMap(microphase => {
    const blueprint = DECODING_WORDS[microphase.id];
    const replacementWords = definition.key === "a"
      ? blueprint.map(([targetWord]) => targetWord)
      : EL_PARALLEL_DECODING_WORDS[definition.key]?.[microphase.id];
    if (!Array.isArray(replacementWords) || replacementWords.length !== blueprint.length) {
      throw new RangeError(`Incomplete ${definition.label} Decoding blueprint for ${microphase.id}.`);
    }
    return blueprint.map(([, featureTags], index) => {
      const targetWord = replacementWords[index];
      return {
        id: definition.key === "a"
          ? `dec-${microphase.id}-${String(index + 1).padStart(2, "0")}-v3`
          : `dec-${microphase.id}-${definition.key}-${String(index + 1).padStart(2, "0")}-v2`,
        kind: "word_reading",
        prompt: "Read this word.",
        displayWord: targetWord,
        targetWord,
        microphase: microphase.id,
        microphaseLabel: microphase.label,
        microphaseOrder: MICROPHASE_BY_ID[microphase.id].order,
        anchorCycle: microphase.anchorCycle,
        constructFocus: microphase.constructFocus,
        progressionBasis: microphase.progressionBasis,
        bandId: microphase.id,
        position: index + 1,
        contentVersion: definition.contentVersion,
        administrationNote: "Show only the isolated word. Do not pronounce it, name its pattern or provide a picture before the response.",
        featureGuidance: benchmarkFeatureGuidance(featureTags),
        scoringGuidance: { accept: "The whole word read accurately in the student’s ordinary accent. Record a self-correction separately.", doNotAccept: "A word supplied by the adult or guessed from a picture/context. A sounded-out response is accurate but not automatic.", listenFor: "The printed spelling, all syllables and any endings, without applying an invented time threshold." },
        featureTags
      };
    });
  });
}

function fluencyPassagesFrom(selectedMicrophase, formId) {
  const definition = formDefinition(formId);
  const passages = EL_LEGACY_BENCHMARK_CONTENT[formId]
    ? Object.fromEntries(EL_LEGACY_BENCHMARK_CONTENT[formId].fluency.map(item => [item.microphase, item]))
    : FLUENCY_PASSAGES_BY_FORM[definition.id];
  return EL_DECODING_MICROPHASES
    .slice(selectedMicrophase.order - 1)
    .map((microphase, index) => ({
      ...passages[microphase.id],
      position: index + 1
    }));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Return one deterministic, serializable administration plan.
 *
 * `startMicrophase` names the Encoding-informed Decoding start or the
 * Decoding-to-Fluency handoff and may name a band or one of the overview's
 * explicit anchor cycles. The overview route remains visible separately from
 * the selected start. Every planned Decoding band contains exactly eight
 * items. A Fluency plan contains one original passage for every named
 * microphase from the handoff upward; scoring, not planning, marks passages
 * after the first explicit not-accurate judgement as not administered.
 */
export function getElBenchmarkPlan({
  assessmentId,
  grade,
  window,
  startMicrophase,
  formId
} = {}) {
  const currentCatalog = getCatalogEntry(assessmentId);
  const normalizedGrade = normalizeGrade(grade);
  const normalizedWindow = normalizeWindow(window);
  const normalizedFormId = normalizeFormId(formId);
  const catalog = { ...currentCatalog, ...(EL_LEGACY_BENCHMARK_CONTENT[normalizedFormId]?.catalog[assessmentId] || {}) };
  const selectedForm = formDefinition(normalizedFormId);
  const routeKey = `${normalizedGrade}-${normalizedWindow}`;
  const route = ROUTES[routeKey];
  const encodingRoutine = normalizedGrade !== "K"
    ? "routine"
    : normalizedWindow === "BOY"
      ? "not_routine"
      : "routine_after_letter_sound_prerequisite";
  const selectedStart = normalizeMicrophase(startMicrophase, route.expectedMicrophase);
  const decodingRoute = assessmentId === EL_BENCHMARK_IDS.DECODING
    ? plannedMicrophases(route, selectedStart)
    : { routeRange: microphaseRange(route.rangeStart, route.rangeEnd), planned: [] };
  const fluencyPassageSequence = assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
    ? fluencyPassagesFrom(selectedStart, normalizedFormId)
    : [];

  let items = [];
  let passage = null;
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    items = parallelPaItems(routeKey, normalizedFormId);
  } else if (assessmentId === EL_BENCHMARK_IDS.ENCODING) {
    items = parallelEncodingItems(routeKey, normalizedFormId);
  } else if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    items = decodingItems(decodingRoute.planned, normalizedFormId);
  } else if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    items = fluencyPassageSequence;
    passage = items[0];
  }

  const plannedMicrophaseRecords = assessmentId === EL_BENCHMARK_IDS.DECODING
    ? decodingRoute.planned
    : assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
      ? fluencyPassageSequence.map(item => MICROPHASE_BY_ID[item.microphase])
      : [];
  const routeCycleAnchors = plannedMicrophaseRecords
    .map(microphase => microphase.anchorCycle)
    .filter(Number.isInteger)
    .map(cycle => `cycle-${cycle}`);
  const stopRule = assessmentId === EL_BENCHMARK_IDS.DECODING
    ? {
        metric: "automatic_count",
        operator: "less_than_or_equal",
        threshold: 5,
        denominator: 8,
        action: "discontinue_after_completed_band"
      }
    : assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
      ? {
          metric: "teacher_accuracy_judgment",
          operator: "explicit_false",
          requiredTimingSeconds: 60,
          action: "discontinue_after_passage",
          accuracyPercentageCutoff: null
        }
      : null;

  return deepClone({
    schemaVersion: EL_BENCHMARK_SCHEMA_VERSION,
    contentVersion: selectedForm.contentVersion,
    planId: [
      "lp-el",
      assessmentId,
      normalizedGrade.toLowerCase(),
      normalizedWindow.toLowerCase(),
      normalizedFormId,
      [EL_BENCHMARK_IDS.DECODING, EL_BENCHMARK_IDS.ORAL_READING_FLUENCY].includes(assessmentId)
        ? `start-${selectedStart.id}`
        : "fixed"
    ].join(":"),
    assessmentId,
    title: catalog.title,
    shortTitle: catalog.shortTitle,
    description: catalog.description,
    estimatedMinutes: catalog.estimatedMinutes,
    routineGrades: catalog.routineGrades || GRADES,
    optionalGrades: catalog.optionalGrades || [],
    grade: normalizedGrade,
    window: normalizedWindow,
    formId: normalizedFormId,
    form: {
      id: selectedForm.id,
      key: selectedForm.key,
      label: selectedForm.label,
      parallelSetId: selectedForm.parallelSetId,
      equatingStatus: selectedForm.equatingStatus
    },
    framework: FRAMEWORK,
    route: {
      routeKey,
      expectedMicrophase: route.expectedMicrophase,
      expectedCycle: route.expectedCycle,
      expectedAnchor: {
        microphase: route.expectedMicrophase,
        cycle: route.expectedCycle,
        label: MICROPHASE_BY_ID[route.expectedMicrophase].label
      },
      defaultStartMicrophase: route.expectedMicrophase,
      selectedStartMicrophase: selectedStart.id,
      selectedStartCycle: selectedStart.anchorCycle,
      selectedStartSource: startMicrophase === undefined || startMicrophase === null || startMicrophase === ""
        ? "expected_anchor_fallback"
        : assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
          ? "decoding_handoff"
          : "encoding_indicated_or_teacher_selected",
      administrationRange: {
        startMicrophase: route.rangeStart,
        endMicrophase: route.rangeEnd,
        label: route.rangeLabel,
        decodingRoutine: route.decodingRoutine,
        encodingRoutine
      },
      candidateMicrophases: assessmentId === EL_BENCHMARK_IDS.DECODING
        ? decodingRoute.routeRange.map(microphase => microphase.id)
        : assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
          ? fluencyPassageSequence.map(item => item.microphase)
        : [],
      administeredMicrophases: assessmentId === EL_BENCHMARK_IDS.DECODING
        ? decodingRoute.planned.map(microphase => microphase.id)
        : assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
          ? fluencyPassageSequence.map(item => item.microphase)
        : [],
      cycleAnchorIds: routeCycleAnchors,
      microphaseLabel: route.rangeLabel,
      selectedMicrophaseLabel: selectedStart.label
    },
    instructions: EL_LEGACY_BENCHMARK_CONTENT[normalizedFormId]?.instructions[assessmentId] || INSTRUCTIONS[assessmentId],
    administration: {
      allowedStatuses: COMMON_ALLOWED_STATUSES,
      stopRule,
      requiredTimingSeconds: assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY ? 60 : null,
      isRoutineForGrade: assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
        ? normalizedGrade !== "K"
        : assessmentId === EL_BENCHMARK_IDS.DECODING
          ? route.decodingRoutine === "routine"
          : assessmentId === EL_BENCHMARK_IDS.ENCODING
            ? encodingRoutine === "routine"
            : true,
      optionalReason: assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY && normalizedGrade === "K"
        ? "The overview treats oral reading fluency as optional rather than routine in Kindergarten."
        : assessmentId === EL_BENCHMARK_IDS.DECODING && route.decodingRoutine !== "routine"
          ? route.rangeLabel
          : assessmentId === EL_BENCHMARK_IDS.ENCODING && encodingRoutine !== "routine"
            ? normalizedWindow === "BOY"
              ? "Encoding is not routine in the Kindergarten beginning-of-year route."
              : "Encoding follows confirmed taught letter-sound evidence in Kindergarten."
          : ""
    },
    items,
    passage,
    passages: assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY ? items : []
  });
}

export function listElBenchmarkRoutes() {
  return Object.keys(ROUTES).map(routeKey => {
    const [grade, window] = routeKey.split("-");
    return deepClone({ grade, window, ...ROUTES[routeKey] });
  });
}

/** Resume the exact administered content, including drafts from older forms. */
export function getElBenchmarkSessionPlan(session = {}) {
  const snapshot = session.planSnapshot;
  if (snapshot) {
    if (!Array.isArray(snapshot.items) || !snapshot.items.length ||
        snapshot.assessmentId !== session.assessmentId ||
        snapshot.grade !== normalizeGrade(session.grade) ||
        snapshot.window !== normalizeWindow(session.window) ||
        snapshot.formId !== session.formId ||
        snapshot.planId !== session.planId ||
        snapshot.contentVersion !== session.contentVersion ||
        (session.startMicrophase && snapshot.route?.selectedStartMicrophase !== session.startMicrophase) ||
        snapshot.items.length > 100 || new Set(snapshot.items.map(item => item?.id)).size !== snapshot.items.length ||
        snapshot.items.some(item => !item || typeof item.id !== "string" || !item.id || typeof item.kind !== "string")) {
      throw new RangeError("The saved assessment plan does not match this session. Keep the original draft for review; do not replace its questions.");
    }
    return deepClone(snapshot);
  }
  return getElBenchmarkPlan({
    assessmentId: session.assessmentId,
    grade: session.grade,
    window: session.window,
    startMicrophase: session.startMicrophase,
    formId: session.formId
  });
}
