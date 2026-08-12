const maximumForSkill = skillId => skillId.includes("20") || skillId === "F-N-COMPARE" ? 20 : skillId.includes("5") ? 5 : 10;

export function buildMathsWorksheetTasks({ skillId, template, version = "A", count = 8 }) {
  const maximum = maximumForSkill(skillId);
  const offset = version === "B" ? 2 : 0;
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const value = 1 + ((index * 3) + offset) % maximum;
    if (template === "part") {
      const whole = Math.max(value, maximum);
      return Object.freeze({ id: `${template}-${version}-${index}`, kind: "part_whole", prompt: `${value} and ____ make ${whole}.`, known: value, whole, answer: String(whole - value) });
    }
    if (template === "line") {
      const start = Math.max(0, value - (2 + index % 2));
      return Object.freeze({ id: `${template}-${version}-${index}`, kind: "number_line", prompt: `Start at ${start}. Draw the hops to ${value}.`, start, end: value, maximum, answer: `Finish at ${value}.` });
    }
    if (template === "match") {
      const options = [...new Set([value, Math.max(0, value - 1), Math.min(maximum, value + 1)])];
      return Object.freeze({ id: `${template}-${version}-${index}`, kind: "dot_match", prompt: "Count the dots. Circle the matching numeral.", value, maximum, options, answer: String(value) });
    }
    return Object.freeze({ id: `${template}-${version}-${index}`, kind: "empty_frame", prompt: `Show ${value} in the frame.`, value, capacity: maximum <= 5 ? 5 : 10, answer: `${value} filled spaces.` });
  }));
}

export function worksheetVersionBalance(tasks) {
  return tasks.reduce((counts, task) => {
    const value = task.value ?? task.known ?? task.end;
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}
