export function retrievalSetFor(cycles, cycle, target) {
  const previous = cycles
    .filter(item => item.cycleNumber && item.cycleNumber < cycle.cycleNumber)
    .flatMap(item => item.focusLetters || [])
    .slice(-4)
    .map(card => card.spelling)
    .filter(Boolean);
  const items = [...new Set(previous.filter(item => item !== target))].slice(-3);
  return Object.freeze({
    items: Object.freeze(items),
    teacherText: items.length
      ? `Quickly show ${items.join(", ")}. Ask for the sound, then reveal the card.`
      : "Use the established echo-and-point routine before introducing the new card.",
    learnerTask: items.length ? "Say each known sound and point to its spelling." : "Echo, then point."
  });
}
