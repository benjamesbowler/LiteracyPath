export function nextReadingWordMark(existing = "") {
  if (!existing) return "correct";
  if (existing === "correct") return "support";
  return "";
}

export function readingMarkAction({ markTarget, pageIndex, wordIndex, existingMark = "" }) {
  if (!markTarget?.id) return null;
  return {
    studentId: markTarget.id,
    pageIndex,
    wordIndex,
    previousMark: existingMark,
    nextMark: nextReadingWordMark(existingMark)
  };
}

export function clearReadingMarkTargetOnTurn() {
  return null;
}
