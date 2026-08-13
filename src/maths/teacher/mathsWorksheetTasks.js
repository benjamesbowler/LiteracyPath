const maximumForSkill = skillId => skillId.includes("20") ? 20 : skillId.includes("5") ? 5 : 10;

export const MATHS_WORKSHEET_LEVELS = Object.freeze({
  support: Object.freeze({ label: "Supported", count: 6, note: "Smaller quantities, one instruction and a worked visual cue." }),
  core: Object.freeze({ label: "Core", count: 8, note: "The released Foundation goal in varied representations." }),
  extend: Object.freeze({ label: "Extend", count: 8, note: "Larger choices, missing information and an explanation prompt." })
});

export const MATHS_WORKSHEET_TEMPLATES = Object.freeze({
  frame: Object.freeze({ label: "Build and explain a frame", skills: ["F-N-COUNT-10", "F-N-COUNT-20", "F-N-SUBITISE-5", "F-N-MATCH", "F-N-PART-5", "F-N-PART-10"] }),
  part: Object.freeze({ label: "Find the missing part", skills: ["F-N-PART-5", "F-N-PART-10"] }),
  line: Object.freeze({ label: "Repair the number path", skills: ["F-N-SEQ-20"] }),
  match: Object.freeze({ label: "Match quantity and numeral", skills: ["F-N-COUNT-10", "F-N-COUNT-20", "F-N-SUBITISE-5", "F-N-MATCH"] }),
  compare: Object.freeze({ label: "Compare by matching", skills: ["F-N-COMPARE"] }),
  cut_build: Object.freeze({ label: "Cut, sort and build", skills: ["F-N-SEQ-20", "F-N-MATCH", "F-N-PART-5", "F-N-PART-10"] })
});

export function worksheetTemplatesForSkill(skillId) {
  return Object.entries(MATHS_WORKSHEET_TEMPLATES)
    .filter(([, definition]) => definition.skills.includes(skillId))
    .map(([id, definition]) => Object.freeze({ id, ...definition }));
}

function balancedValues(maximum, level, version, count) {
  const minimum = level === "support" ? 1 : maximum > 10 ? 6 : 1;
  const span = maximum - minimum + 1;
  const offset = version === "B" ? Math.ceil(span / 2) : 0;
  const step = span > 10 ? 3 : span > 5 ? 2 : 1;
  return Array.from({ length: count }, (_, index) => minimum + ((index * step + offset) % span));
}

function rotatedOptions(value, maximum, index) {
  const values = [...new Set([value, Math.max(0, value - 1), Math.min(maximum, value + 1), Math.max(0, value - 2)])].slice(0, 3);
  while (values.length < 3) values.push(values.length ? values.at(-1) + 1 : 0);
  return values.map((_, optionIndex) => values[(optionIndex + index) % values.length]);
}

function explanation(level) {
  return level === "extend" ? "Explain how the picture proves your answer: ______________________________" : "";
}

export function buildMathsWorksheetTasks({ skillId, template, version = "A", level = "core", count = null }) {
  const maximum = maximumForSkill(skillId);
  const levelDefinition = MATHS_WORKSHEET_LEVELS[level] || MATHS_WORKSHEET_LEVELS.core;
  const taskCount = Number.isInteger(count) ? count : levelDefinition.count;
  const availableTemplates = worksheetTemplatesForSkill(skillId).map(item => item.id);
  const safeTemplate = availableTemplates.includes(template) ? template : availableTemplates[0];
  const values = balancedValues(maximum, level, version, taskCount);
  return Object.freeze(values.map((value, index) => {
    const id = `${safeTemplate}-${level}-${version}-${index}`;
    if (safeTemplate === "part") {
      const whole = level === "support" ? Math.min(maximum, 5) : maximum;
      const known = Math.min(value, whole - 1);
      return Object.freeze({ id, kind: "part_whole", prompt: `The whole is ${whole}. One part is ${known}. Find the missing part.`, known, whole, explain: explanation(level), answer: `${whole - known}; ${known} and ${whole - known} make ${whole}.` });
    }
    if (safeTemplate === "line") {
      const hidden = Math.max(level === "support" ? 1 : 0, Math.min(maximum - 1, value));
      const start = Math.max(0, hidden - (level === "support" ? 1 : 2));
      const end = Math.min(maximum, hidden + (level === "extend" ? 3 : 2));
      return Object.freeze({ id, kind: "number_path", prompt: "Write the missing number, then read the repaired path forwards and backwards.", start, end, hidden, maximum, explain: explanation(level), answer: String(hidden) });
    }
    if (safeTemplate === "match") {
      return Object.freeze({ id, kind: "dot_match", prompt: "Count or recognise the collection. Circle the numeral that matches.", value, maximum, options: rotatedOptions(value, maximum, index), explain: explanation(level), answer: String(value) });
    }
    if (safeTemplate === "compare") {
      const difference = index % 3 === 0 ? 0 : index % 2 ? 1 : -1;
      const other = Math.max(1, Math.min(maximum, value + difference));
      const relation = value === other ? "same" : value > other ? "left has more and right has fewer" : "right has more and left has fewer";
      return Object.freeze({ id, kind: "compare", prompt: "Match the objects one-to-one. Circle: left has more, right has more, or same.", left: value, right: other, maximum, explain: explanation(level), answer: relation });
    }
    if (safeTemplate === "cut_build") {
      if (skillId === "F-N-SEQ-20") {
        const cards = [Math.max(0, value - 1), value, Math.min(maximum, value + 1)];
        return Object.freeze({ id, kind: "cut_build", prompt: "Cut out the number cards. Put them in order and read the path.", value, cards: version === "B" ? [cards[1], cards[2], cards[0]] : [cards[2], cards[0], cards[1]], explain: explanation(level), answer: [...cards].sort((a, b) => a - b).join(", ") });
      }
      const parts = [Math.max(0, value - Math.min(3, value)), Math.min(3, value)];
      const cards = skillId.startsWith("F-N-PART") ? parts : rotatedOptions(value, maximum, index);
      return Object.freeze({ id, kind: "cut_build", prompt: skillId.startsWith("F-N-PART") ? `Cut out both part cards. Put them together to make ${value}.` : "Cut out the numeral that matches the shown quantity.", value, cards, showQuantity: !skillId.startsWith("F-N-PART"), explain: explanation(level), answer: skillId.startsWith("F-N-PART") ? `${parts[0]} and ${parts[1]} make ${value}.` : String(value) });
    }
    const capacity = maximum <= 5 ? 5 : maximum <= 10 ? 10 : 20;
    if (skillId.startsWith("F-N-PART")) {
      const partA = Math.max(1, value - Math.min(3, value - 1));
      const partB = value - partA;
      return Object.freeze({ id, kind: "split_frame", prompt: `Colour ${partA} spaces one way and ${partB} another. Complete the parts and whole.`, value, partA, partB, capacity, explain: explanation(level), answer: `${partA} and ${partB} make ${value}.` });
    }
    const prompt = skillId === "F-N-SUBITISE-5"
      ? "Look for smaller parts. Write how many altogether without pointing to every dot."
      : skillId === "F-N-MATCH"
        ? `Build a collection that matches the numeral ${value}.`
        : `Show ${value} in the ${capacity === 20 ? "double ten-frame" : capacity === 10 ? "ten-frame" : "five-frame"}.`;
    return Object.freeze({ id, kind: "empty_frame", prompt, value, capacity, explain: explanation(level), answer: `${value} filled spaces.` });
  }));
}

export function worksheetVersionBalance(tasks) {
  return tasks.reduce((counts, task) => {
    const value = task.value ?? task.known ?? task.hidden;
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}
