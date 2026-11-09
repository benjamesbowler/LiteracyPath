// Authored, reviewed repairs to already published audio. New URLs preserve
// cache identity: the old file remains available with its original bytes.
import { WORLD_DISCOVERY_AUDIO_REPAIRS } from "./worldDiscoveryAudioRepairs.mjs";
import { WORLD_DISCOVERY_EXPANSION_AUDIO_REPAIRS } from "./worldDiscoveryExpansionAudioRepairs.mjs";
import { GUIDED_READING_REMEDIATION_AUDIO_REPAIRS } from "./guidedReadingRemediationAudioRepairs.mjs";

export const GUIDED_READING_AUDIO_REPAIRS = Object.freeze({
  ...WORLD_DISCOVERY_AUDIO_REPAIRS,
  ...WORLD_DISCOVERY_EXPANSION_AUDIO_REPAIRS,
  ...GUIDED_READING_REMEDIATION_AUDIO_REPAIRS,
  "guided_page:woolly chases the loose wool": Object.freeze({
    role: "guided_page",
    normalizedLookupText: "woolly chases the loose wool",
    spokenText: "Woolly chases the loose wool.",
    voiceName: "en-US-Chirp3-HD-Leda",
    audioPath: "/audio/production/en-US/guided_page/woolly-chases-the-loose-wool-1d879edf3d.mp3",
    audioSha256: "1d879edf3dbaa63b468051477e4a25dabbb516e1dcc3a33f5fbbeb6e5ada56e3",
    reviewedAt: "2026-11-05",
    pronunciation: "ˈwʊli",
    pronunciationEncoding: "PHONETIC_ENCODING_IPA",
    pronunciationSource: "https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#custom-pronunciations",
    reviewEvidence: "Exact page text with Google's explicit Woolly pronunciation override; decoded signal and independent speech screening recorded. Automated evidence, not human listening."
  }),
  "isolated_word:plip": Object.freeze({
    role: "isolated_word",
    normalizedLookupText: "plip",
    spokenText: "Plip.",
    voiceName: "en-US-Chirp3-HD-Leda",
    audioPath: "/audio/production/en-US/isolated_word/plip-d27250beab.mp3",
    audioSha256: "d27250beab92a05abc71341074619625db1d0c36bf98be9d556f7d558df6acc3",
    reviewedAt: "2026-11-05",
    pronunciation: "plɪp",
    pronunciationEncoding: "PHONETIC_ENCODING_IPA",
    pronunciationSource: "https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#custom-pronunciations",
    reviewEvidence: "Exact-text Google Leda custom IPA pronunciation; full FFmpeg decode and speech-window signal. Unprompted recognizers normalize this invented splash word variably. Automated evidence, not human listening."
  }),
  "isolated_word:stood": Object.freeze({
    role: "isolated_word",
    normalizedLookupText: "stood",
    spokenText: "Stood.",
    voiceName: "en-US-Chirp3-HD-Leda",
    audioPath: "/audio/production/en-US/isolated_word/stood-de8407816c.mp3",
    audioSha256: "de8407816c3ab0b0c4ac10428f0625228efdd905b30dcc2c0978d686d18f51e3",
    reviewedAt: "2026-10-29",
    reviewEvidence: "Exact-text Leda repair; independent unprompted small.en and tiny.en recover Stood; complete FFmpeg decode. Automated evidence, not human listening."
  })
});
