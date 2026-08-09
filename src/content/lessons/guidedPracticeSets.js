export function guidedPracticeFor(card, durationMinutes) {
  const examples = [...new Set(card?.examples || [])].slice(0, durationMinutes === 8 ? 2 : 4);
  if (!examples.length) throw new Error("The target has no reviewed guided examples.");
  return Object.freeze({
    examples: Object.freeze(examples),
    teacherText: `Read and sort ${examples.join(", ")}. Prompt only as much as needed.`,
    learnerTask: `Say each word, find ${card.spelling}, and explain where it appears.`
  });
}
