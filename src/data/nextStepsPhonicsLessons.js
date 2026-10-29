// Supplemental teaching prerequisites for this authored sequence. These are
// separate lessons, not additions to the existing EL cycle curriculum.
export const NEXT_STEPS_PHONICS_LESSONS = Object.freeze([
  Object.freeze({
    id: "next-steps-final-blends", firstBook: 16, afterCycle: 15,
    title: "Blend final consonants", wordShape: "CVCC / VCC", example: "hand",
    model: "Say each sound in hand: /h/ /æ/ /n/ /d/. Blend them without dropping either final sound, then read hand as one word."
  }),
  Object.freeze({
    id: "next-steps-initial-blends", firstBook: 18, afterCycle: 16,
    title: "Blend initial consonants", wordShape: "CCVC", example: "stop",
    model: "Say each sound in stop: /s/ /t/ /ɑ/ /p/. Blend both beginning consonants without adding a vowel between them."
  }),
  Object.freeze({
    id: "next-steps-both-blends", firstBook: 21, afterCycle: 18,
    title: "Blend consonants at both ends", wordShape: "CCVCC", example: "stamp",
    model: "Say each sound in stamp: /s/ /t/ /æ/ /m/ /p/. Keep both beginning and ending consonants as you blend the whole word."
  })
]);

export function nextStepsBookNumber(book = {}) {
  const match = /^next-steps-(\d{2})$/u.exec(book.id || "");
  const number = match ? Number(match[1]) : 0;
  return number >= 1 && number <= 30 ? number : null;
}

export function requiredNextStepsLessons(book = {}) {
  const number = nextStepsBookNumber(book);
  return number === null ? [] : NEXT_STEPS_PHONICS_LESSONS.filter(lesson => number >= lesson.firstBook);
}

export function declaredNextStepsLessons(book = {}) {
  const ids = book.decodableScope?.additionalPrerequisites || [];
  return NEXT_STEPS_PHONICS_LESSONS.filter(lesson => ids.includes(lesson.id));
}
