import { storyQuests } from "../src/data/storyQuests.js";

const errors = [];
const warnings = [];

function describeQuest(quest) {
  return quest?.id || quest?.title || "(unknown quest)";
}

function addError(quest, message) {
  errors.push(`${describeQuest(quest)}: ${message}`);
}

function addWarning(quest, message) {
  warnings.push(`${describeQuest(quest)}: ${message}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateSerializable(value, path, quest) {
  if (typeof value === "function") {
    addError(quest, `${path} contains a function and is not build-safe data`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateSerializable(item, `${path}[${index}]`, quest));
    return;
  }
  Object.entries(value).forEach(([key, item]) => validateSerializable(item, `${path}.${key}`, quest));
}

function collectReachable(pageById, startPageId) {
  const reachable = new Set();
  const stack = [startPageId];

  while (stack.length > 0) {
    const pageId = stack.pop();
    if (!pageId || pageId === "end" || reachable.has(pageId)) continue;
    const page = pageById.get(pageId);
    if (!page) continue;
    reachable.add(pageId);
    (page.choices || []).forEach(choice => {
      if (choice?.nextPageId && choice.nextPageId !== "end") {
        stack.push(choice.nextPageId);
      }
    });
  }

  return reachable;
}

function hasPathToEnd(pageId, pageById) {
  const seen = new Set();
  const stack = [pageId];

  while (stack.length > 0) {
    const currentPageId = stack.pop();
    if (currentPageId === "end") return true;
    if (!currentPageId || seen.has(currentPageId)) continue;
    seen.add(currentPageId);

    const page = pageById.get(currentPageId);
    if (!page) continue;
    (page.choices || []).forEach(choice => stack.push(choice.nextPageId));
  }

  return false;
}

function detectClosedLoops(pageById, startPageId) {
  const loops = [];
  const stack = [];
  const inStack = new Set();
  const visited = new Set();

  function visit(pageId) {
    if (!pageId || pageId === "end") return;
    if (inStack.has(pageId)) {
      const startIndex = stack.indexOf(pageId);
      const cycle = stack.slice(startIndex);
      const hasEscape = cycle.some(cyclePageId => {
        const page = pageById.get(cyclePageId);
        return (page?.choices || []).some(choice => !cycle.includes(choice.nextPageId));
      });
      if (!hasEscape) loops.push(cycle);
      return;
    }
    if (visited.has(pageId)) return;

    visited.add(pageId);
    inStack.add(pageId);
    stack.push(pageId);
    const page = pageById.get(pageId);
    (page?.choices || []).forEach(choice => visit(choice.nextPageId));
    stack.pop();
    inStack.delete(pageId);
  }

  visit(startPageId);
  return loops;
}

if (!Array.isArray(storyQuests) || storyQuests.length === 0) {
  errors.push("storyQuests must export a non-empty array");
}

(storyQuests || []).forEach(quest => {
  if (!isPlainObject(quest)) {
    errors.push("Each story quest must be an object");
    return;
  }

  validateSerializable(quest, "quest", quest);

  if (!quest.id) addError(quest, "missing id");
  if (!quest.title) addError(quest, "missing title");
  if (!Array.isArray(quest.pages) || quest.pages.length === 0) {
    addError(quest, "missing pages array");
    return;
  }

  const pageById = new Map();
  quest.pages.forEach((page, index) => {
    if (!isPlainObject(page)) {
      addError(quest, `page ${index + 1} must be an object`);
      return;
    }
    if (!page.id) {
      addError(quest, `page ${index + 1} missing id`);
    } else if (pageById.has(page.id)) {
      addError(quest, `duplicate page id "${page.id}"`);
    } else {
      pageById.set(page.id, page);
    }

    if (!Array.isArray(page.text) || page.text.length === 0 || page.text.some(line => typeof line !== "string" || !line.trim())) {
      addError(quest, `${page.id || `page ${index + 1}`} missing readable text`);
    }
    if (typeof page.imageUrl !== "string" || !page.imageUrl.trim()) {
      addError(quest, `${page.id || `page ${index + 1}`} missing imageUrl`);
    }
    if (typeof page.audioUrl !== "string" || !page.audioUrl.trim()) {
      addError(quest, `${page.id || `page ${index + 1}`} missing audioUrl`);
    }
    if (typeof page.choicePrompt !== "string" || !page.choicePrompt.trim()) {
      addError(quest, `${page.id || `page ${index + 1}`} missing choicePrompt`);
    }
    if (page.narrationNeedsRebuild !== undefined && typeof page.narrationNeedsRebuild !== "boolean") {
      addError(quest, `${page.id || `page ${index + 1}`} narrationNeedsRebuild must be boolean`);
    }
    const joinedText = Array.isArray(page.text) ? page.text.join(" ") : "";
    const inanimateFacePatterns = [
      /(?:door|map|book|chair|lantern|sign)[^.]{0,60}(?:face|smil|frown|wink|eye|mouth)/i,
      /chair[^.]{0,30}snor/i
    ];
    if (inanimateFacePatterns.some(pattern => pattern.test(joinedText))) {
      addError(quest, `${page.id || `page ${index + 1}`} gives an inanimate object a face or facial action`);
    }
    if (!Array.isArray(page.choices)) {
      addError(quest, `${page.id || `page ${index + 1}`} choices must be an array`);
    } else {
      const normalizedLabels = page.choices.map(choice => String(choice?.label || "").trim().toLowerCase());
      if (normalizedLabels.some((label, labelIndex) => label && normalizedLabels.indexOf(label) !== labelIndex)) {
        addError(quest, `${page.id} has duplicate choice labels`);
      }
      page.choices.forEach((choice, choiceIndex) => {
        if (!choice?.label) addError(quest, `${page.id} choice ${choiceIndex + 1} missing label`);
        if (!choice?.nextPageId) addError(quest, `${page.id} choice "${choice?.label || choiceIndex + 1}" missing nextPageId`);
      });
    }
  });

  const startPageId = quest.startPageId || quest.pages[0]?.id;
  if (!startPageId || !pageById.has(startPageId)) {
    addError(quest, `start page "${startPageId || "(missing)"}" does not exist`);
  }

  quest.pages.forEach(page => {
    (page.choices || []).forEach(choice => {
      if (choice.nextPageId !== "end" && !pageById.has(choice.nextPageId)) {
        addError(quest, `${page.id} choice "${choice.label}" points to missing "${choice.nextPageId}"`);
      }
    });
  });

  const hasEnding = quest.pages.some(page => (page.choices || []).some(choice => choice.nextPageId === "end"));
  if (!hasEnding) addError(quest, "must have at least one ending choice pointing to end");

  if (startPageId && pageById.has(startPageId)) {
    const reachable = collectReachable(pageById, startPageId);
    quest.pages.forEach(page => {
      if (!reachable.has(page.id)) addError(quest, `${page.id} is unreachable from start`);
    });

    reachable.forEach(pageId => {
      if (!hasPathToEnd(pageId, pageById)) {
        const page = pageById.get(pageId);
        const readAgainOnly = (page?.choices || []).every(choice => choice.nextPageId === startPageId);
        if (!readAgainOnly) addWarning(quest, `${pageId} does not have an obvious path to end`);
      }
    });

    detectClosedLoops(pageById, startPageId).forEach(cycle => {
      if (cycle.length === 1 && cycle[0] === startPageId) return;
      addError(quest, `closed circular loop detected: ${cycle.join(" -> ")}`);
    });
  }
});

if (warnings.length > 0) {
  console.warn("Story Quest integrity warnings:");
  warnings.forEach(warning => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
  console.error("Story Quest integrity failed:");
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Story Quest integrity passed for ${storyQuests.length} quests.`);
