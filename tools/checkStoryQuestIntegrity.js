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

function isReplayChoice(choice, startPageId) {
  return choice?.nextPageId === startPageId
    && String(choice?.label || "").trim().toLowerCase() === "read again";
}

function detectNarrativeLoops(pageById, startPageId) {
  const components = [];
  const stack = [];
  const onStack = new Set();
  const indexByPageId = new Map();
  const lowLinkByPageId = new Map();
  let nextIndex = 0;

  function narrativeTargets(pageId) {
    const page = pageById.get(pageId);
    return (page?.choices || [])
      .filter(choice => !isReplayChoice(choice, startPageId))
      .map(choice => choice.nextPageId)
      .filter(targetId => targetId && targetId !== "end" && pageById.has(targetId));
  }

  function connect(pageId) {
    indexByPageId.set(pageId, nextIndex);
    lowLinkByPageId.set(pageId, nextIndex);
    nextIndex += 1;
    stack.push(pageId);
    onStack.add(pageId);

    narrativeTargets(pageId).forEach(targetId => {
      if (!indexByPageId.has(targetId)) {
        connect(targetId);
        lowLinkByPageId.set(
          pageId,
          Math.min(lowLinkByPageId.get(pageId), lowLinkByPageId.get(targetId))
        );
      } else if (onStack.has(targetId)) {
        lowLinkByPageId.set(
          pageId,
          Math.min(lowLinkByPageId.get(pageId), indexByPageId.get(targetId))
        );
      }
    });

    if (lowLinkByPageId.get(pageId) !== indexByPageId.get(pageId)) return;

    const component = [];
    let memberId;
    do {
      memberId = stack.pop();
      onStack.delete(memberId);
      component.push(memberId);
    } while (memberId !== pageId);

    const isSelfLoop = component.length === 1 && narrativeTargets(component[0]).includes(component[0]);
    if (component.length > 1 || isSelfLoop) components.push(component.reverse());
  }

  if (pageById.has(startPageId)) connect(startPageId);
  return components;
}

function pageText(page) {
  return Array.isArray(page?.text) ? page.text.join(" ") : "";
}

function collectNarrativeReachable(pageById, firstPageId, startPageId) {
  const reachable = new Set();
  const stack = [firstPageId];

  while (stack.length > 0) {
    const pageId = stack.pop();
    if (!pageId || pageId === "end" || reachable.has(pageId)) continue;
    const page = pageById.get(pageId);
    if (!page) continue;
    reachable.add(pageId);
    (page.choices || []).forEach(choice => {
      if (!isReplayChoice(choice, startPageId)) stack.push(choice.nextPageId);
    });
  }

  return reachable;
}

function shortestNarrativeRouteLength(pageById, startPageId) {
  const queue = [[startPageId, 1]];
  const shortestSeen = new Map([[startPageId, 1]]);

  while (queue.length > 0) {
    const [pageId, length] = queue.shift();
    const page = pageById.get(pageId);
    if (!page) continue;

    for (const choice of page.choices || []) {
      if (choice.nextPageId === "end") return length;
      if (isReplayChoice(choice, startPageId) || !pageById.has(choice.nextPageId)) continue;
      const nextLength = length + 1;
      if ((shortestSeen.get(choice.nextPageId) || Infinity) <= nextLength) continue;
      shortestSeen.set(choice.nextPageId, nextLength);
      queue.push([choice.nextPageId, nextLength]);
    }
  }

  return Infinity;
}

function requireTextMatch(quest, pageById, pageId, pattern, description) {
  const page = pageById.get(pageId);
  if (!page) return;
  if (!pattern.test(pageText(page))) addError(quest, `${pageId} ${description}`);
}

function validateNarrativeContracts(quest, pageById, startPageId, endingPages) {
  const minimumRouteByLevel = { A: 5, B: 6, C: 8 };
  const minimumRoute = minimumRouteByLevel[quest.level];
  if (minimumRoute) {
    const shortestRoute = shortestNarrativeRouteLength(pageById, startPageId);
    if (shortestRoute < minimumRoute) {
      addError(quest, `shortest route is only ${shortestRoute} scenes; Level ${quest.level} requires at least ${minimumRoute}`);
    }
  }

  endingPages.forEach(page => {
    const hasReplay = (page.choices || []).some(choice => isReplayChoice(choice, startPageId));
    const hasFinish = (page.choices || []).some(choice => choice.nextPageId === "end");
    if (!hasReplay || !hasFinish) addError(quest, `${page.id} must offer both Read again and Finish`);
  });

  if (quest.id === "mw_ra_c_01_pip_stone_loud_thing") {
    const softCall = pageById.get("p09_soft_call");
    if ((softCall?.choices || []).some(choice => choice.nextPageId === "p11_back_home")) {
      addError(quest, "p09_soft_call must reunite the lost toadling before the return-home route");
    }
    requireTextMatch(quest, pageById, "p11_toadling_answer", /family|reunite/i, "must resolve the lost-toadling search");
  }

  if (quest.id === "mw_ra_c_04_dewdrop_flint_lost_glow") {
    endingPages.forEach(page => {
      if (!/stream/i.test(pageText(page)) || !/glow|shone|shining|shine/i.test(pageText(page))) {
        addError(quest, `${page.id} must confirm that the stream's glow was restored`);
      }
    });
  }

  if (quest.id === "dp_ra_b_02_sunnys_rainy_day_rescue") {
    endingPages.forEach(page => {
      if (!/Dozy/i.test(pageText(page)) || !/Grumpy/i.test(pageText(page))) {
        addError(quest, `${page.id} must resolve both Dozy's and Grumpy's rainy-day needs`);
      }
    });
  }

  if (quest.id === "dp_ra_b_03_grumpy_almost_good_day") {
    const stoneDamage = pageById.get("p03_stones_fall");
    if ((stoneDamage?.choices || []).some(choice => choice.nextPageId === "p04_ignore_chompy")) {
      addError(quest, "p03_stones_fall cannot abandon Fancy's damaged stone tower");
    }
  }

  if (quest.id === "story_quest_short_a_sam_pam_01") {
    endingPages.forEach(page => {
      // 2026-07-26: was /park/i. "park" is an r-controlled vowel and cannot appear in a
      // short-a CVC decodable, which is what this quest declares. Same intent, legal evidence:
      // the trip completes when they reach the van, which is drawn on both ending pages.
      if (!/van/i.test(pageText(page))) addError(quest, `${page.id} must complete the planned trip`);
    });
  }

  if (quest.id === "mp_ra_a_03_bouncy_speedy_fast_map") {
    // 2026-07-26: was /surprise/i. "surprise" is three syllables with an r-controlled vowel and a
    // split digraph — it cannot appear in a Level A text. Same intent, legal evidence: the start
    // page must establish the map, which is the object the whole quest is about. "map" is CVC.
    requireTextMatch(quest, pageById, "p01_start", /map/i, "must establish the map the quest is about");
    const bootText = pageText(pageById.get("p04_boot"));
    if (/not the map/i.test(bootText)) addError(quest, "p04_boot must be a useful map clue, not a contradiction");
    endingPages.forEach(page => {
      if (!/map/i.test(pageText(page))) addError(quest, `${page.id} must pay off the map mystery`);
    });
  }

  if (quest.id === "mp_ra_a_04_brave_tiny_big_little_rescue") {
    const startChoices = pageById.get(startPageId)?.choices || [];
    const firstChoiceLabel = String(startChoices[0]?.label || "");
    const secondChoiceLabel = String(startChoices[1]?.label || "");
    if (!/Clucky|hat/i.test(firstChoiceLabel)) {
      addError(quest, `${startPageId} first choice must clearly open Clucky's hat rescue`);
    }
    if (!/Woolly|bell/i.test(secondChoiceLabel)) {
      addError(quest, `${startPageId} second choice must clearly open Woolly's bell rescue`);
    }
    const hatReachable = collectNarrativeReachable(pageById, startChoices[0]?.nextPageId, startPageId);
    const bellReachable = collectNarrativeReachable(pageById, startChoices[1]?.nextPageId, startPageId);
    const hatOnlyPages = new Set(["p03_pot", "p03_wall", "p03_hat", "p04_hat_in_pot", "p04_tiny_in_pot", "p04_feather", "p04_clucky_wall", "p04_hat_on_wall", "p05_hat_found", "p06_hat_on_brave", "p05_brave_stuck", "p05_feather_brave", "p05_feather_back", "p05_tiny_climbs", "p05_brave_climbs", "p06_tiny_helps", "p06_woolly_helps", "p06_brave_boost", "p06_brave_slips", "p07_clucky_happy", "p09_fancy_brave_ending"]);
    const bellOnlyPages = new Set(["p03_woolly", "p04_under_wool", "p04_stream", "p05_brave_in_wool", "p05_bell_stream", "p05_bell_found", "p06_bell_ring", "p06_woolly_laughs", "p06_brave_stream", "p07_woolly_happy", "p09_loud_bell_ending"]);
    const hatCrossovers = [...bellOnlyPages].filter(pageId => hatReachable.has(pageId));
    const bellCrossovers = [...hatOnlyPages].filter(pageId => bellReachable.has(pageId));
    if (hatCrossovers.length > 0) addError(quest, `hat mystery crosses into bell-only scenes: ${hatCrossovers.join(", ")}`);
    if (bellCrossovers.length > 0) addError(quest, `bell mystery crosses into hat-only scenes: ${bellCrossovers.join(", ")}`);
  }
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
  if (quest.pages.length < 10) {
    addError(quest, `must contain at least 10 authored scenes (found ${quest.pages.length})`);
  }

  const pageById = new Map();
  const pageByImageUrl = new Map();
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
    } else {
      const canonicalImageUrl = page.imageUrl.split("?")[0];
      const priorPageId = pageByImageUrl.get(canonicalImageUrl);
      if (priorPageId) {
        addError(
          quest,
          `${page.id || `page ${index + 1}`} reuses the image from ${priorPageId}; every authored scene needs its own route-true illustration`
        );
      } else {
        pageByImageUrl.set(canonicalImageUrl, page.id || `page ${index + 1}`);
      }
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
      if (page.choices.length < 2) {
        addError(quest, `${page.id} must offer at least two choices`);
      }
      const normalizedLabels = page.choices.map(choice => String(choice?.label || "").trim().toLowerCase());
      if (normalizedLabels.some((label, labelIndex) => label && normalizedLabels.indexOf(label) !== labelIndex)) {
        addError(quest, `${page.id} has duplicate choice labels`);
      }
      const targetPageIds = page.choices.map(choice => String(choice?.nextPageId || "").trim());
      if (targetPageIds.some((targetId, targetIndex) => targetId && targetPageIds.indexOf(targetId) !== targetIndex)) {
        addError(quest, `${page.id} has choices that lead to the same next scene`);
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
        return;
      }

      const nextPage = pageById.get(choice.nextPageId);
      if (nextPage && page.imageUrl.split("?")[0] === nextPage.imageUrl.split("?")[0]) {
        addError(
          quest,
          `${page.id} choice "${choice.label}" repeats the same image on ${nextPage.id}; every page turn needs a visible consequence`
        );
      }
    });
  });

  const endingPages = quest.pages.filter(page => (page.choices || []).some(choice => choice.nextPageId === "end"));
  const hasEnding = endingPages.length > 0;
  if (!hasEnding) addError(quest, "must have at least one ending choice pointing to end");
  if (endingPages.length < 2) {
    addError(quest, `must have at least two distinct ending pages for replay value (found ${endingPages.length})`);
  }

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

    detectNarrativeLoops(pageById, startPageId).forEach(component => {
      addError(quest, `mid-story circular route joins: ${component.join(" -> ")}`);
    });

    validateNarrativeContracts(quest, pageById, startPageId, endingPages);
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
