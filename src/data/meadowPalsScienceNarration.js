import { MEADOW_PALS_SCIENCE_BOOKS } from "./meadowPalsScienceBooks.js";
import * as narrationMedia from "./generated/meadowPalsScienceNarration.generated.js";

export const MEADOW_PALS_SCIENCE_VOICES = Object.freeze({
  narrator: "en-US-Chirp3-HD-Leda",
  "MEADOW-MUDDY": "Algieba",
  "MEADOW-SPLASHY": "Laomedeia"
});

export const MEADOW_PALS_SCIENCE_VOICE_ENGINES = Object.freeze({
  narrator: "Google Cloud Text-to-Speech Chirp 3 HD",
  "MEADOW-MUDDY": "gemini-2.5-pro-tts",
  "MEADOW-SPLASHY": "gemini-2.5-pro-tts"
});

export function canonicalScienceText(value = "") {
  return String(value).normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function spokenWords(value = "") {
  return canonicalScienceText(value).toLowerCase()
    .match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
}

export function expectedScienceSpeakerWords(page = {}) {
  let dialogueIndex = 0;
  return (String(page.text || "").match(/"[^"]*"|[^"]+/g) || []).flatMap(part => {
    const speaker = part.startsWith('"')
      ? page.dialogueSpeakers?.[dialogueIndex++]
      : "narrator";
    return spokenWords(part).map(word => ({ word, speaker }));
  });
}

export function validateScienceNarration(page = {}, record = {}) {
  const errors = [];
  if (canonicalScienceText(record.displayedText) !== canonicalScienceText(page.text)) {
    errors.push("displayed_text_mismatch");
  }
  if (record.bookId !== page.bookId || record.pageNumber !== page.pageNumber) {
    errors.push("page_identity_mismatch");
  }
  if (record.audioPath !== page.pageAudioPath) errors.push("audio_path_mismatch");
  if (!/^[a-f0-9]{64}$/.test(record.audioSha256 || "")) errors.push("missing_audio_hash");
  if (!(Number(record.durationSeconds) > 0)) errors.push("missing_audio_duration");
  const expected = expectedScienceSpeakerWords(page);
  const actual = (record.segments || []).flatMap(segment => {
    if (segment.voice !== MEADOW_PALS_SCIENCE_VOICES[segment.speaker]
      || segment.engine !== MEADOW_PALS_SCIENCE_VOICE_ENGINES[segment.speaker]) {
      errors.push("character_voice_mismatch");
    }
    return spokenWords(segment.text).map(word => ({ word, speaker: segment.speaker }));
  });
  if (expected.length !== actual.length
    || expected.some((entry, index) => entry.word !== actual[index]?.word)) {
    errors.push("spoken_words_mismatch");
  }
  if (expected.some((entry, index) => entry.speaker !== actual[index]?.speaker)) {
    errors.push("speaker_assignment_mismatch");
  }
  return [...new Set(errors)];
}

export function getMeadowPalsSciencePageNarration(page = {}, manifest = narrationMedia.MEADOW_PALS_SCIENCE_NARRATION) {
  const source = MEADOW_PALS_SCIENCE_BOOKS.find(book => book.id === page.bookId)
    ?.pages.find(item => item.pageNumber === (page.storyPageNumber || page.pageNumber));
  if (!source || canonicalScienceText(source.text) !== canonicalScienceText(page.text)) return null;
  const record = manifest?.[`${source.bookId}::${source.pageNumber}`];
  return record && validateScienceNarration(source, record).length === 0 ? record : null;
}

export function getMeadowPalsScienceWordAudioPath(value = "", manifest = narrationMedia.MEADOW_PALS_SCIENCE_WORD_AUDIO) {
  const text = canonicalScienceText(value).toLowerCase();
  const record = manifest?.[text];
  const characterSound = text === "pffft"
    && record?.kind === "character-sound-replay"
    && record.speaker === "MEADOW-MUDDY"
    && record.reusedFrom?.pageNumber === 10
    && record.reusedFrom?.segmentId === "page-10-02"
    && record.reusedFrom?.audioPath === "/audio/production/en-US/meadow_science/missing-sandwich/page-10.mp3"
    && /^[a-f0-9]{64}$/.test(record.reusedFrom?.audioSha256 || "")
    && record.audioPath === "/audio/production/en-US/meadow_science/missing-sandwich/words/pffft.mp3";
  const speaker = characterSound ? "MEADOW-MUDDY" : "narrator";
  return record && canonicalScienceText(record.text).toLowerCase() === text
    && (text !== "pffft" || characterSound)
    && (record.kind !== "character-sound-replay" || characterSound)
    && record.voice === MEADOW_PALS_SCIENCE_VOICES[speaker]
    && record.engine === MEADOW_PALS_SCIENCE_VOICE_ENGINES[speaker]
    && /^[a-f0-9]{64}$/.test(record.audioSha256 || "")
    && /^\/audio\/production\/en-US\/meadow_science\/missing-sandwich\/words\/[a-z0-9-]+\.mp3$/.test(record.audioPath || "")
    ? record.audioPath
    : "";
}

export function getMeadowPalsScienceTitleNarration(pageOrBook = {}) {
  const bookId = pageOrBook.bookId || pageOrBook.id;
  const book = MEADOW_PALS_SCIENCE_BOOKS.find(item => item.id === bookId);
  const record = narrationMedia.MEADOW_PALS_SCIENCE_TITLE_NARRATION?.[bookId];
  if (!book || !record) return null;
  return canonicalScienceText(record.displayedText) === canonicalScienceText(book.titlePageText)
    && (!pageOrBook.text || canonicalScienceText(pageOrBook.text) === canonicalScienceText(book.titlePageText))
    && record.voice === MEADOW_PALS_SCIENCE_VOICES.narrator
    && record.engine === MEADOW_PALS_SCIENCE_VOICE_ENGINES.narrator
    && record.audioPath === "/audio/production/en-US/meadow_science/missing-sandwich/cover.mp3"
    && /^[a-f0-9]{64}$/.test(record.audioSha256 || "")
    && Number(record.durationSeconds) > 0
    ? record
    : null;
}
