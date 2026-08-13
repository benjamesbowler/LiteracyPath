const maximumForSkill = skillId => skillId.includes("20") || skillId === "F-N-COMPARE" ? 20 : skillId.includes("5") ? 5 : 10;

export const MATHS_WORKSHEET_LEVELS = Object.freeze({
  support: Object.freeze({ label: "Supported", count: 6, step: 1 }),
  core: Object.freeze({ label: "Core", count: 8, step: 3 }),
  extend: Object.freeze({ label: "Extend", count: 10, step: 4 })
});

export const MATHS_WORKSHEET_TEMPLATES = Object.freeze({
  frame: Object.freeze({ label: "Make in a frame", skills: ["F-N-COUNT-10", "F-N-COUNT-20", "F-N-SUBITISE-5", "F-N-MATCH", "F-N-PART-5", "F-N-PART-10"] }),
  part: Object.freeze({ label: "Part–whole missing part", skills: ["F-N-PART-5", "F-N-PART-10"] }),
  line: Object.freeze({ label: "Number-line hops", skills: ["F-N-SEQ-20"] }),
  match: Object.freeze({ label: "Count and match", skills: ["F-N-COUNT-10", "F-N-COUNT-20", "F-N-SUBITISE-5", "F-N-MATCH"] }),
  compare: Object.freeze({ label: "Compare two groups", skills: ["F-N-COMPARE"] }),
  cut_build: Object.freeze({ label: "Cut and build", skills: ["F-N-SEQ-20", "F-N-MATCH", "F-N-PART-5", "F-N-PART-10"] })
});

export function worksheetTemplatesForSkill(skillId) {
  return Object.entries(MATHS_WORKSHEET_TEMPLATES)
    .filter(([, definition]) => definition.skills.includes(skillId))
    .map(([id, definition]) => Object.freeze({ id, ...definition }));
}

function distractorsFor(value, maximum) {
  const candidates = [value - 1, value + 1, value - 2, value + 2, 0, maximum]
    .filter(candidate => Number.isInteger(candidate) && candidate >= 0 && candidate <= maximum && candidate !== value);
  for (let candidate = 0; candidates.length < 2 && candidate <= maximum; candidate += 1) {
    if (candidate !== value && !candidates.includes(candidate)) candidates.push(candidate);
  }
  return [value, ...new Set(candidates)].slice(0, 3);
}

export function buildMathsWorksheetTasks({ skillId, template, version = "A", level = "core", count = null }) {
  const maximum = maximumForSkill(skillId);
  const levelDefinition = MATHS_WORKSHEET_LEVELS[level] || MATHS_WORKSHEET_LEVELS.core;
  const taskCount = Number.isInteger(count) ? count : levelDefinition.count;
  const offset = version === "B" ? 2 : 0;
  const availableTemplates = worksheetTemplatesForSkill(skillId).map(item => item.id);
  const safeTemplate = availableTemplates.includes(template) ? template : availableTemplates[0];
  return Object.freeze(Array.from({ length: taskCount }, (_, index) => {
    const value = 1 + ((index * levelDefinition.step) + offset) % maximum;
    if (safeTemplate === "part") {
      const whole = maximum;
      return Object.freeze({ id: `${safeTemplate}-${level}-${version}-${index}`, kind: "part_whole", prompt: `${value} and ____ make ${whole}.`, known: value, whole, answer: String(whole - value) });
    }
    if (safeTemplate === "line") {
      const start = Math.max(0, value - (2 + index % 2));
      return Object.freeze({ id: `${safeTemplate}-${level}-${version}-${index}`, kind: "number_line", prompt: `Start at ${start}. Draw one-step hops to ${value}.`, start, end: value, maximum, answer: `${value - start} forward hop${value - start === 1 ? "" : "s"}; finish at ${value}.` });
    }
    if (safeTemplate === "match") {
      return Object.freeze({ id: `${safeTemplate}-${level}-${version}-${index}`, kind: "dot_match", prompt: "Count the collection. Circle the matching numeral.", value, maximum, options: distractorsFor(value, maximum), answer: String(value) });
    }
    if (safeTemplate === "compare") {
      const other = Math.max(0, Math.min(maximum, value + (index % 3 === 0 ? 0 : index % 2 ? -1 : 2)));
      const relation = value === other ? "same" : value > other ? "left has more" : "right has more";
      return Object.freeze({ id: `${safeTemplate}-${level}-${version}-${index}`, kind: "compare", prompt: "Count both groups. Circle more, fewer or the same.", left: value, right: other, maximum, answer: relation });
    }
    if (safeTemplate === "cut_build") {
      const sequence = skillId === "F-N-SEQ-20" ? [Math.max(0, value - 1), value, Math.min(maximum, value + 1)] : distractorsFor(value, maximum);
      return Object.freeze({ id: `${safeTemplate}-${level}-${version}-${index}`, kind: "cut_build", prompt: skillId === "F-N-SEQ-20" ? "Cut out the cards. Put them in order." : `Cut out the cards. Choose the card that matches ${value}.`, value, cards: sequence, answer: skillId === "F-N-SEQ-20" ? [...sequence].sort((a, b) => a - b).join(", ") : String(value) });
    }
    const capacity = maximum <= 5 ? 5 : maximum <= 10 ? 10 : 20;
    return Object.freeze({ id: `${safeTemplate}-${level}-${version}-${index}`, kind: "empty_frame", prompt: `Show ${value} in the ${capacity === 20 ? "double ten-frame" : capacity === 10 ? "ten frame" : "five frame"}.`, value, capacity, answer: `${value} filled spaces.` });
  }));
}

export function worksheetVersionBalance(tasks) {
  return tasks.reduce((counts, task) => {
    const value = task.value ?? task.known ?? task.end;
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}
