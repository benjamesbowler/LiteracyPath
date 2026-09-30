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

function narrativeRoutes(pageById, startPageId) {
  const routes = [];
  function walk(id, route) {
    if (route.includes(id) || !pageById.has(id)) return;
    const nextRoute = [...route, id];
    for (const choice of pageById.get(id).choices || []) {
      if (choice.nextPageId === "end") routes.push(nextRoute);
      else if (!isReplayChoice(choice, startPageId)) walk(choice.nextPageId, nextRoute);
    }
  }
  walk(startPageId, []);
  return routes;
}

function validateNarrativeContracts(quest, pageById, startPageId, endingPages) {
  const minimumRouteByLevel = { Early: 5, A: 5, B: 6, C: 8 };
  const minimumRoute = minimumRouteByLevel[quest.level];
  const shortestRoute = shortestNarrativeRouteLength(pageById, startPageId);
  if (minimumRoute && shortestRoute < minimumRoute) {
    addError(quest, `shortest route is only ${shortestRoute} scenes; ${quest.level} requires at least ${minimumRoute}`);
  }
  endingPages.forEach(page => {
    if (!(page.choices || []).some(choice => isReplayChoice(choice, startPageId))
      || !(page.choices || []).some(choice => choice.nextPageId === "end")) {
      addError(quest, `${page.id} must offer both Read again and Finish`);
    }
    if (!page.replayPrompt?.trim()) addError(quest, `${page.id} needs a story-specific replay invitation`);
  });

  const routes = narrativeRoutes(pageById, startPageId);
  function everyRouteIncludes(ids, reason) {
    for (const route of routes) {
      let previous = -1;
      for (const id of ids) {
        const index = route.indexOf(id);
        if (index <= previous) {
          addError(quest, `${reason}: ${route.join(" -> ")} misses ordered beat ${id}`);
          break;
        }
        previous = index;
      }
    }
  }
  function before(later, earlier, reason) {
    for (const route of routes.filter(path => path.includes(later))) {
      if (!route.includes(earlier) || route.indexOf(earlier) >= route.indexOf(later)) {
        addError(quest, `${reason}: ${earlier} must precede ${later}`);
      }
    }
  }
  function text(id, pattern, reason) { requireTextMatch(quest, pageById, id, pattern, reason); }

  switch (quest.id) {
    case "story_quest_short_a_sam_pam_01":
      everyRouteIncludes(["page-01", "page-02", "page-04", "page-05", "page-07"], "Packing, obstruction and map recovery must precede either family ending");
      text("page-07", /Sam has the map/, "must confirm recovery before choosing the day");
      if (pageById.get("page-07")?.choicePrompt !== "Will they go or stay?") addError(quest, "The stay-home ending must be an explicit family choice");
      break;
    case "mp_ra_a_01_muddy_splashy_missing_hat":
      everyRouteIncludes(["p07_dry_hat", "p07_clucky_muddy_hat"], "The wet hat must dry and return to its owner before lending");
      before("p07_wash_hat", "p06_hat_muddy", "Washing follows finding the muddy hat");
      for (const route of routes.filter(path => path.includes("p06_hat_muddy"))) {
        if (!route.includes("p07_wash_hat") || route.indexOf("p07_wash_hat") > route.indexOf("p07_dry_hat")) addError(quest, "Mud route needs washing before drying");
      }
      // Pond routes arrive wet but already clean; they do not need the mud wash.
      break;
    case "mp_ra_a_02_shy_cuddly_quiet_adventure":
      everyRouteIncludes(["p04_call_shy", "p02_cuddly", "p06_go_to_tree", "p07_tree_under"], "The startled friend receives space and leads the next step");
      text("p08_tree_purr", /rests nearby/, "must honour the space choice");
      break;
    case "mp_ra_a_03_bouncy_speedy_fast_map":
      everyRouteIncludes(["p02_speedy", "p03_barn_fast", "p04_too_fast", "p05_speedy_waits", "p03_barn", "p05_big_tree"], "Both catches must recover the map and complete the search for Tiny");
      text("p05_speedy_waits", /spread out the map/, "must make recovered map possession explicit");
      break;
    case "mp_ra_a_04_brave_tiny_big_little_rescue":
      everyRouteIncludes(["p05_brave_stuck", "p05_hat_found", "p07_clucky_happy"], "Both rescues must free Brave and return Clucky's hat");
      before("p04_tiny_in_pot", "p06_tiny_helps", "Brave cannot climb the rope before Tiny provides it");
      text("p06_tiny_helps", /rope/, "must provide the rescue equipment");
      break;
    case "dp_ra_b_01_chompy_big_lunch_hunt":
      everyRouteIncludes(["p02_berries", "p03_save_berries"], "Picnic branches begin with gathered food");
      before("p08_thank_you_ending", "p03_ask_sunny", "Grumpy's chosen food must arrive before his ending");
      before("p08_leaf_hat_ending", "p08_berry_mess_ending", "Spilled food must be collected and washed before lunch");
      text("p08_berry_mess_ending", /washes/, "must repair the spill");
      break;
    case "dp_ra_b_02_sunnys_rainy_day_rescue":
      everyRouteIncludes(["p04_cave_grumpy", "p05_leaf_roof", "p06_grumpy_dry", "p06_dozy_dry", "p06_grumpy_smile"], "Every ending must follow shelter, leak repair and a dry pillow");
      text("p06_grumpy_smile", /pillow dries/, "must resolve Dozy's need before the final choice");
      before("p08_grumpy_laugh_ending", "p07_leaf_boat", "The boat must exist before its payoff");
      break;
    case "dp_ra_b_03_grumpy_almost_good_day":
      before("p07_tower_rebuilt", "p06_rebuild_stones", "The damaged tower must be repaired");
      for (const route of routes.filter(path => path.includes("p03_stones_fall"))) {
        if (!route.includes("p06_rebuild_stones")) addError(quest, "A route abandons Fancy's damaged tower");
      }
      endingPages.forEach(page => { if (!/nap/i.test(pageText(page))) addError(quest, `${page.id} must resolve Grumpy's original need for rest`); });
      break;
    case "dp_ra_b_04_bouncy_big_bounce":
      everyRouteIncludes(["p02_berry_corner", "p03_help_chompy"], "Every route must establish the berry picnic");
      before("p08_berry_ending", "p06_everyone_sticky", "Fallen berries need washing before eating");
      before("p05_cave_echo", "p02_cozy_cave", "Bouncy must receive the basket before setting it down");
      before("p08_rock_ending", "p07_dozy_advice", "Dozy must be invited before the four-friend picnic");
      text("p02_cozy_cave", /Bouncy takes the basket/, "must make the handoff explicit");
      break;
    case "dp_ra_b_05_shys_snail_shade":
      for (const route of routes) {
        const bark = route.includes("p03_bark");
        if (route.some(id => id.includes(bark ? "moss" : "bark"))) addError(quest, "A snail route changes path material without an action");
        if (route.at(-1) !== (bark ? "p06_log_ending" : "p06_fern_ending")) addError(quest, "Snail route ends at the wrong shelter");
      }
      before("p04_moss_strip", "p04_moss_dots", "Filling the moss gap must follow encountering it");
      break;
    case "mw_ra_c_01_pip_stone_loud_thing":
      everyRouteIncludes(["p06_mossy_stone", "p07_pip_speaks", "p08_stone_calls", "p09_pip_covers_ears", "p09_pip_listens"], "The frog's need, failed loud call and heard answer precede either reunion");
      endingPages.forEach(page => { if (!/family/i.test(pageText(page))) addError(quest, `${page.id} must reunite the frog's family`); });
      break;
    case "mw_ra_c_02_fern_wren_walking_garden":
      everyRouteIncludes(["p02_recipe", "p03_pour_potion", "p04_all_walk", "p05_too_late", "p08_return_home"], "Potion rules, spill, failed catch and return must precede both solutions");
      endingPages.forEach(page => { if (!/green drop/i.test(pageText(page)) || !/leaves/i.test(pageText(page))) addError(quest, `${page.id} leaves the original drooping plant unresolved`); });
      break;
    case "mw_ra_c_03_luna_burrow_star_shell_door":
      everyRouteIncludes(["p02_moon_map", "p06_hidden_door", "p05_cracked_shell", "p05_burrow_repairs", "p07_door_opens", "p08_map_inside"], "Both discoveries require the map, broken shell and visible repair");
      text("p06_hidden_door", /upside down/, "must explain the failed fit");
      text("p07_door_opens", /turn/i, "must correct the fit rather than magically repair it");
      break;
    case "mw_ra_c_04_dewdrop_flint_lost_glow":
      everyRouteIncludes(["p03_water_whisper", "p06_glow_cave", "p07_glow_sleeps", "p06_lantern_pop", "p07_heavy_crystal", "p08_team_pull", "p08_crystal_moves", "p07_glow_wakes", "p08_sorry_glow"], "Both endings require a seeded water rule, released flow and respect for the glow's quiet home");
      text("p07_heavy_crystal", /dark lantern/, "must preserve the extinguished lantern state");
      endingPages.forEach(page => { if (!/Gold light fills the path/i.test(pageText(page))) addError(quest, `${page.id} must resolve the dark path`); });
      break;
    default:
      addError(quest, "missing reviewed narrative contract");
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
    if (page.choices?.length > 1 && (typeof page.choicePrompt !== "string" || !page.choicePrompt.trim())) {
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
      if (page.choices.length < 1 || page.choices.length > 2) {
        addError(quest, `${page.id} must offer one continuation or two meaningful choices`);
      }
      if (page.choices.length === 1 && page.choices[0].label !== "Next") {
        addError(quest, `${page.id} single continuation must say Next`);
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
