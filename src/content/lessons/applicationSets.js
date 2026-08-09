export function applicationFor(cycle, target) {
  const recommendations = cycle?.guidedReadingRecommendations || {};
  const book = recommendations.fiction || recommendations.nonfiction || null;
  const hfw = (cycle?.highFrequencyWords || []).slice(0, 2);
  return Object.freeze({
    bookId: book?.bookId || null,
    bookTitle: book?.title || null,
    bookLevel: book?.level || null,
    highFrequencyWords: Object.freeze(hfw),
    teacherText: book
      ? `Open ${book.title} and find one word or sentence containing ${target}. Read the whole sentence for meaning.`
      : `Build and read a short phrase using ${target}. Keep high-frequency words separate and label them as known words.`,
    learnerTask: "Apply the target in connected reading, then reread the whole sentence smoothly.",
    contentLimit: book ? "approved_guided_reading" : "reviewed_cycle_examples_only"
  });
}
