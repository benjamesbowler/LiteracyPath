#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { storyQuests } from "../src/data/storyQuests.js";
import {
  STORY_CONTENT_POLICY_VERSION,
  STORY_CONTENT_SCORE_CATEGORIES
} from "../src/content/storyContentPolicy.js";
import { storyQuestPolicyReviews } from "../src/content/storyContentReviews.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(
  repoRoot,
  "docs",
  "content",
  "STORY_QUEST_POLICY_AUDIT_2026-07-31.md"
);

const reviewById = new Map(storyQuestPolicyReviews.map(review => [review.id, review]));
const genericPromptPattern =
  /^(?:what happens(?: now| next)?|what does .+ do|what do they do|what can .+ do|what can help(?: first)?|what next|what now|where do they look|who comes next)\??$/i;

const characterNames = Object.freeze([
  "Pip", "Stone", "Fern", "Wren", "Luna", "Burrow", "Dewdrop", "Flint",
  "Chompy", "Sunny", "Grumpy", "Bouncy", "Dozy", "Fancy", "Wiggly",
  "Sam", "Pam", "Muddy", "Splashy", "Clucky", "Shy", "Cuddly", "Speedy",
  "Brave", "Tiny", "Woolly"
]);

const settingBySeries = Object.freeze({
  "Moonwood Tales": "the exact Moonwood location established by the incoming scene, with consistent magical-night lighting",
  "Dino Pals": "the exact Dino Land location established by the incoming scene, with warm prehistoric meadow light",
  "Meadow Pals": "the exact Meadow Pals farm or meadow location established by the incoming scene, with warm natural daylight",
  "Short A Adventures": "the same simple, child-readable real-world setting shown on adjacent Sam and Pam pages"
});

const fullTextOverrides = Object.freeze({
  mw_ra_c_01_pip_stone_loud_thing: Object.freeze({
    p01_start: ["A crash shakes the Fog Marsh.", "\"Help! I am lost,\" calls a toadling.", "Thick fog curls across the path."]
  }),
  mw_ra_c_02_fern_wren_walking_garden: Object.freeze({
    p01_start: ["Three garden pots walk toward the gate.", "\"My potion made feet,\" says Wren.", "Fern must stop them before moonrise."]
  }),
  mw_ra_c_03_luna_burrow_star_shell_door: Object.freeze({
    p01_start: ["A star shell opens a hidden map.", "A round door seals at moonset.", "Luna and Burrow must reach it."]
  }),
  mw_ra_c_04_dewdrop_flint_lost_glow: Object.freeze({
    p01_start: ["The stream has lost its glow.", "Dark paths spread through Moonwood.", "\"We must restore it,\" says Dewdrop."]
  }),
  dp_ra_b_01_chompy_big_lunch_hunt: Object.freeze({
    p01_start: ["The picnic starts at noon.", "Chompy must find food for every friend."],
    p05_grumpy_tiny_smile: ["Chompy offers one purple berry.", "Grumpy needs a different lunch."]
  }),
  dp_ra_b_02_sunnys_rainy_day_rescue: Object.freeze({
    p01_start: ["Rain soaks Grumpy and Dozy.", "Sunny must dry both before night."]
  }),
  dp_ra_b_03_grumpy_almost_good_day: Object.freeze({
    p01_start: ["Grumpy needs a quiet nap spot.", "A twig blocks the bush path."],
    p02_stream: ["The cool stream looks quiet.", "Chompy sits on the bank."],
    p03_chompy_finds: ["Grumpy tests the shallow stream.", "Chompy splashes beside him."],
    p04_ignore_chompy: ["Grumpy asks for quiet.", "Chompy moves to the far bank."],
    p04_splash_chompy: ["Grumpy tries one small splash.", "Chompy splashes back. SPLASH!"],
    p05_quiet_stream: ["The stream goes still.", "Then a little fish jumps."],
    p06_wiggly_splash: ["Wiggly makes one huge wave.", "Grumpy's nap spot is soaked."],
    p07_all_soaked: ["One last wave soaks everyone.", "This spot is not quiet."],
    p08_soaked_ending: ["Grumpy rests beside the calm stream.", "Chompy guards the quiet."],
    p03_stones_fall: ["Grumpy's tail bumps the stones.", "Fancy's tower falls. CLATTER!"],
    p04_look_at_stones: ["The tower blocks the dry spot.", "Grumpy looks at Fancy."],
    p05_fancy_stones: ["\"I can mend it,\" said Grumpy.", "Fancy holds the bottom stone."],
    p06_rebuild_stones: ["Grumpy stacks each flat stone.", "Fancy keeps the tower still."],
    p07_tower_rebuilt: ["The tower stands in the sun.", "Its shade makes a quiet spot."],
    p02_bush: ["Grumpy tries the berry bush.", "A twig blocks the soft sand."],
    p03_berry_protest: ["Grumpy eats one purple berry.", "The nap spot is still blocked."],
    p03_list_making: ["Grumpy looks at the brown twig.", "It must move before nap time."],
    p04_eat_secretly: ["Grumpy fills a leaf bowl.", "Dozy sleeps beside the bush."],
    p05_dozy_finds: ["Dozy keeps the shady spot.", "Grumpy holds the berry bowl."],
    p07_grumpy_naps: ["Grumpy shares the soft shade.", "The two friends close their eyes."],
    p08_nap_ending: ["Grumpy and Dozy nap together.", "The twig is off the path."],
    p04_berry_throw: ["Bouncy brings a leaf basket.", "A berry game can move the twig."],
    p05_bouncy_berries: ["Bouncy catches three purple berries.", "The basket bumps the twig."],
    p06_berry_chaos: ["Berries roll across the sand.", "The twig rolls with them."],
    p04_tell_sunny: ["Sunny sits beside the blocked spot.", "Grumpy points at the twig."],
    p05_sunny_helps: ["Sunny holds one end.", "Grumpy holds the other end."],
    p07_one_thing_done: ["Sunny clears the sandy path.", "The quiet spot is ready."],
    p06_twig_fixed: ["The twig is off the path.", "Grumpy curls up in the shade."],
    p08_almost_ending: ["Grumpy finds one quiet spot.", "\"Not bad,\" said Grumpy."]
  }),
  dp_ra_b_04_bouncy_big_bounce: Object.freeze({
    p01_start: ["Bouncy carries berries to Big Flat Rock.", "Two paths lead there."],
    p02_berry_corner: ["The basket needs more berries.", "Chompy cannot reach the top branch."],
    p03_help_chompy: ["Chompy holds the basket.", "Bouncy looks at the high branch."],
    p04_big_bounce: ["Bouncy makes one enormous bounce.", "Up go all the berries!"],
    p04_careful_bounce: ["Bouncy makes three small bounces.", "Three berries fill the basket."],
    p05_berries_fly: ["The berries fall like rain.", "Chompy holds the basket up."],
    p05_legs_give_up: ["Bouncy flops into the ferns.", "The picnic berries roll away."],
    p06_chompy_catches: ["Grumpy holds out a broad leaf.", "Three berries roll inside."],
    p06_everyone_sticky: ["Bouncy gathers every rolling berry.", "The picnic basket fills again."],
    p07_grumpy_nose: ["One berry lands on Grumpy's nose.", "The full basket stays safe."],
    p03_too_fast: ["Bouncy rushes with the basket.", "The path splits by a puddle."],
    p04_bush_crash: ["Bouncy lands in the berry bush.", "The basket and branch tumble down."],
    p05_fancy_bush_hit: ["The bent branch blocks the path.", "Fancy guards the picnic basket."],
    p07_new_bush: ["Bouncy and Fancy plant the bush.", "They lift the basket together."],
    p04_puddle_bounce: ["SPLASH! Bouncy lands in mud.", "Mud covers the picnic basket."],
    p05_mud_everywhere: ["Bouncy carries water to the basket.", "Fancy waits with clean moss."],
    p06_fancy_mud_sail: ["Bouncy rinses the muddy basket.", "Fancy dries it with moss."],
    p02_cozy_cave: ["The cave is a short path.", "Dozy sleeps beside the narrow track."],
    p03_tiptoe_out: ["Bouncy tiptoes with the basket.", "Left foot. Right foot. No boing."],
    p03_bounce_inside: ["Bouncy tries one tiny bounce.", "BOING! The basket shakes."],
    p04_pebble_trip: ["A grey pebble goes tink.", "One berry rolls from the basket."],
    p04_cave_chaos: ["Bouncy lands on dusty moss.", "Dust covers the picnic berries."],
    p05_cave_echo: ["Dozy opens both eyes.", "\"Keep the basket still,\" said Dozy."],
    p05_wiggly_enters: ["Wiggly makes a steady tail rail.", "Bouncy holds the basket tight."],
    p07_dozy_advice: ["Bouncy waits for ten quiet counts.", "The basket stops shaking."],
    p07_big_flat_rock: ["Bouncy reaches Big Flat Rock.", "The picnic berries stay safe."],
    p08_berry_ending: ["The full basket reaches the picnic.", "\"Best berry team,\" said Chompy."],
    p08_fancy_ending: ["The bush stands beside the path.", "The saved berries reach the picnic."],
    p08_stream_ending: ["The clean basket crosses the stream.", "Big Flat Rock is ahead."],
    p08_rock_ending: ["The friends share berries on the rock.", "Bouncy made the delivery."]
  }),
  story_quest_short_a_sam_pam_01: Object.freeze({
    p01_start: ["Sam and Pam pack a map."]
  }),
  mp_ra_a_01_muddy_splashy_missing_hat: Object.freeze({
    p01_start: ["Wind takes the red hat."],
    p09_mud_ending: ["Muddy finds the red hat."],
    p09_pond_ending: ["Splashy finds the red hat."]
  }),
  mp_ra_a_02_shy_cuddly_quiet_adventure: Object.freeze({
    p01_start: ["Cuddly wants to sit with Shy."]
  }),
  mp_ra_a_03_bouncy_speedy_fast_map: Object.freeze({
    p01_start: ["A map leads to the tree."],
    p08_farm_view: ["The big tree is near home."],
    p09_home_ending: ["They find the big tree."],
    p09_tiny_snack_ending: ["Tiny waits by the big tree."]
  }),
  mp_ra_a_04_brave_tiny_big_little_rescue: Object.freeze({
    p01_start: ["Pick the lost hat or bell."]
  })
});

const exactIllustrationFixes = Object.freeze({
  "mw_ra_c_02_fern_wren_walking_garden:p07_book_fix":
    "Re-render the hands and repair action: Fern holds the damaged book open with two anatomically clean hands while Wren secures one loose page; no fused fingers, duplicate limbs or floating paper.",
  "dp_ra_b_02_sunnys_rainy_day_rescue:p08_rainbow_ending":
    "Show Sunny, Dozy and Grumpy together under the clearing rainbow. Dozy and Grumpy must both be visibly dry because the text resolves both rescues.",
  "dp_ra_b_02_sunnys_rainy_day_rescue:p08_grumpy_laugh_ending":
    "Show Dozy watching Grumpy laugh, exactly as stated. Do not substitute another dinosaur or crop Dozy out.",
  "dp_ra_b_03_grumpy_almost_good_day:p03_list_making":
    "Remove every written list or unexplained symbol. Show only Grumpy, the single brown twig blocking the sand and the unusable nap spot.",
  "mp_ra_a_01_muddy_splashy_missing_hat:p03_meet_splashy":
    "Remove or redesign the signboard so it cannot be read as a hat clue. The only story information should be Muddy meeting Splashy beside the established path.",
  "mp_ra_a_02_shy_cuddly_quiet_adventure:p08_wave_from_tree":
    "Remove the unmentioned Tiny. Show Shy waving from the tree and Bouncy with both spring legs correctly attached.",
  "mp_ra_a_03_bouncy_speedy_fast_map:p08_farm_view":
    "Re-render in the opening Meadow Pals style. Keep Bouncy and Speedy on-model and make the map direction agree with the visible farm view.",
  "mp_ra_a_03_bouncy_speedy_fast_map:p09_snack":
    "Re-render in the opening Meadow Pals style with the same character proportions, map state and destination continuity as the prior page.",
  "mp_ra_a_04_brave_tiny_big_little_rescue:p04_tiny_in_pot":
    "On the hat route, show the hat only. Remove Woolly's bell so the illustration does not reveal or falsely complete the other branch.",
  "mp_ra_a_04_brave_tiny_big_little_rescue:p09_fancy_brave_ending":
    "Re-render Clucky at canonical Meadow Pals scale, colour and contour, wearing the correctly recovered hat. Match the quest-wide unified art style."
});

function markdown(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function pageText(quest, page) {
  return fullTextOverrides[quest.id]?.[page.id] || page.text || [];
}

function targetPrompt(page) {
  const current = String(page.choicePrompt || "").trim();
  if (!genericPromptPattern.test(current)) return current;
  const labels = (page.choices || [])
    .filter(choice => choice.nextPageId !== "end")
    .map(choice => choice.label)
    .slice(0, 2);
  if (labels.length === 0) return current;
  if (labels.length === 1) return `Choose: ${labels[0]}.`;
  return `Choose: ${labels[0]} or ${labels[1]}.`;
}

function incomingMap(quest) {
  const incoming = new Map(quest.pages.map(page => [page.id, []]));
  for (const page of quest.pages) {
    for (const choice of page.choices || []) {
      if (
        choice.nextPageId === quest.startPageId &&
        String(choice.label).trim().toLowerCase() === "read again"
      ) {
        continue;
      }
      if (!incoming.has(choice.nextPageId)) continue;
      incoming.get(choice.nextPageId).push({
        pageId: page.id,
        choice: choice.label
      });
    }
  }
  return incoming;
}

function routeCount(quest) {
  const byId = new Map(quest.pages.map(page => [page.id, page]));
  const memo = new Map();
  function walk(pageId, active) {
    if (pageId === "end") return 1;
    if (memo.has(pageId)) return memo.get(pageId);
    if (active.has(pageId)) return 0;
    const page = byId.get(pageId);
    if (!page) return 0;
    active.add(pageId);
    let count = 0;
    for (const choice of page.choices || []) {
      if (
        choice.nextPageId === quest.startPageId &&
        String(choice.label).trim().toLowerCase() === "read again"
      ) {
        continue;
      }
      count += walk(choice.nextPageId, active);
    }
    active.delete(pageId);
    memo.set(pageId, count);
    return count;
  }
  return walk(quest.startPageId, new Set());
}

function requiredCast(quest, text) {
  const joined = text.join(" ");
  const named = characterNames.filter(name => new RegExp(`\\b${name}\\b`).test(joined));
  if (named.length > 0) return named;
  return (quest.characters || []).slice(0, 2);
}

function illustrationOutline(quest, page, text, incoming) {
  const key = `${quest.id}:${page.id}`;
  const cast = requiredCast(quest, text);
  const entryState = incoming.length
    ? incoming.map(item => `${item.pageId} via “${item.choice}”`).join("; ")
    : "opening state";
  const setting = quest.location || settingBySeries[quest.series] || "the established story location";
  const exactFix = exactIllustrationFixes[key];
  const core =
    `Required cast: ${cast.length ? cast.join(", ") : "only the characters explicitly required by the text"}. ` +
    `Location: ${setting}. Main readable beat: ${text.join(" ")} ` +
    `Preserve route state from ${entryState}. Use one dominant action, clear eye-lines and expressions readable at thumbnail size. ` +
    "Keep canonical size, colour, marks, clothing, pose logic, carried objects, weather, light and object count. " +
    "Do not add unmentioned characters, contradictory props, embedded words, duplicate limbs or a second competing action.";
  return exactFix ? `${exactFix} ${core}` : core;
}

function disposition(quest, page) {
  const key = `${quest.id}:${page.id}`;
  if (exactIllustrationFixes[key]) return "Rewrite text as listed; re-render required";
  if (fullTextOverrides[quest.id]?.[page.id]) return "Rewrite text as listed; art must be rechecked against new wording";
  if (genericPromptPattern.test(String(page.choicePrompt || "").trim())) {
    return "Retain story text; replace prompt; continuity review required";
  }
  return "Retain target text; approve only after page-level art and audio evidence";
}

function scoreTotal(review, part) {
  return STORY_CONTENT_SCORE_CATEGORIES
    .filter(category => !part || category.part === part)
    .reduce((sum, category) => sum + Number(review.scores[category.id] || 0), 0);
}

const targetBands = Object.freeze({
  Early: Object.freeze({ maxLines: 2, maxWordsPerLine: 8, maxWordsPerPage: 8 }),
  A: Object.freeze({ maxLines: 1, maxWordsPerLine: 6, maxWordsPerPage: 6 }),
  B: Object.freeze({ maxLines: 2, maxWordsPerLine: 8, maxWordsPerPage: 14 }),
  C: Object.freeze({ maxLines: 3, maxWordsPerLine: 9, maxWordsPerPage: 22 })
});
const wordTokens = value =>
  String(value).replace(/[“”‘’]/g, "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
const targetErrors = [];
for (const quest of storyQuests) {
  const band = targetBands[quest.level];
  for (const page of quest.pages) {
    const text = pageText(quest, page);
    const perLine = text.map(line => wordTokens(line).length);
    const total = perLine.reduce((sum, count) => sum + count, 0);
    if (text.length > band.maxLines) {
      targetErrors.push(`${quest.id}/${page.id}: ${text.length} target lines exceed ${band.maxLines}`);
    }
    if (perLine.some(count => count > band.maxWordsPerLine)) {
      targetErrors.push(`${quest.id}/${page.id}: target line exceeds ${band.maxWordsPerLine} words`);
    }
    if (total > band.maxWordsPerPage) {
      targetErrors.push(`${quest.id}/${page.id}: ${total} target words exceed ${band.maxWordsPerPage}`);
    }
    if (quest.level === "A") {
      const joined = text.join(" ");
      if (/\b(but|so|because|while|when|if|will|might|could|would|should)\b/i.test(joined)) {
        targetErrors.push(`${quest.id}/${page.id}: target Level A text contains a forbidden conjunction or modal`);
      }
      if (/(\b\w+'s\b|\b(?:her|his|its|their|my|your)\b)/i.test(joined)) {
        targetErrors.push(`${quest.id}/${page.id}: target Level A text contains a possessive`);
      }
    }
  }
}
if (targetErrors.length > 0) {
  console.error("Target-manuscript level validation failed:");
  for (const error of targetErrors) console.error(`- ${error}`);
  process.exit(1);
}

const lines = [];
lines.push("# Story Quest policy audit and complete remediation blueprint");
lines.push("");
lines.push(`**Audit date:** 2026-07-31  `);
lines.push(`**Policy version:** ${STORY_CONTENT_POLICY_VERSION}  `);
lines.push("**Scope:** all 13 active Story Quests, all 313 active pages and all start-to-ending route combinations  ");
lines.push("**Audio action in this pass:** none; missing or withheld narration is recorded as a release failure.");
lines.push("");
lines.push("## Executive verdict");
lines.push("");
lines.push(
  "No active Story Quest currently adheres 100% to the complete two-part Story Bible. " +
  "This is not inferred from a single score: every quest has at least one open mandatory violation and all 313 rewritten pages still withhold narration."
);
lines.push("");
lines.push(
  "The strongest manuscript is **Muddy and Splashy: The Missing Hat**. Its story spine is suitable to retain, but it is still not approved because one illustration is ambiguous and exact replacement narration is absent. " +
  "**Grumpy's Almost-Good Day** and **Bouncy's Big Bounce** require complete story-spine rewrites; line edits cannot repair their episodic structure."
);
lines.push("");
lines.push("| Quest | Level | Pages | Complete routes | Part I | Full score | 100% policy | Primary reason |");
lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- | --- |");
for (const quest of storyQuests) {
  const review = reviewById.get(quest.id);
  lines.push(
    `| ${markdown(quest.title)} | ${markdown(quest.level)} | ${quest.pages.length} | ${routeCount(quest).toLocaleString("en-GB")} | ` +
    `${scoreTotal(review, 1)}/36 | ${scoreTotal(review)}/48 | No | ${markdown(review.summary)} |`
  );
}
lines.push("");
lines.push("## What “100%” means in this audit");
lines.push("");
lines.push(
  "An item passes only when every mandatory rule has evidence, no mandatory violation remains open, every score is at least 3, the total is at least 38/48, the reviewed source fingerprint still matches, every interactive route has been checked, every page image matches its exact text and the final audio matches word for word. Automated checks catch measurable defects; accountable editorial evidence covers subjective claims."
);
lines.push("");
lines.push("## Catalogue result");
lines.push("");
lines.push("- Part I writing-policy adherence at 100%: **0 of 13**.");
lines.push("- Complete two-part release adherence at 100%: **0 of 13**.");
lines.push("- Active pages audited: **313 of 313**.");
lines.push("- Distinct start-to-ending route combinations represented by the graphs: **4,325**.");
lines.push("- Pages with replacement narration withheld: **313 of 313**.");
lines.push("- Quests requiring a complete structural rewrite: **2**.");
lines.push("- Quests whose core story spine can be retained and repaired: **11**.");
lines.push("");
lines.push("## Story-by-story findings and complete target manuscripts");
lines.push("");

for (const quest of storyQuests) {
  const review = reviewById.get(quest.id);
  const incoming = incomingMap(quest);
  const openIssues = review.mandatoryViolations.join(", ");

  lines.push(`### ${quest.title}`);
  lines.push("");
  lines.push(`**ID:** \`${quest.id}\`  `);
  lines.push(`**Series / level:** ${quest.series || quest.adventureType} / ${quest.level}  `);
  lines.push(`**Verdict:** Not 100% compliant  `);
  lines.push(`**Scores:** Part I ${scoreTotal(review, 1)}/36; complete ${scoreTotal(review)}/48  `);
  lines.push(`**Open mandatory rules:** ${openIssues}`);
  lines.push("");
  lines.push(`**Why it fails:** ${review.summary}`);
  lines.push("");
  lines.push(`**Target story promise:** ${review.targetGoal}`);
  lines.push("");
  lines.push("**Required writing changes**");
  lines.push("");
  for (const action of review.rewriteActions) lines.push(`- ${action}`);
  lines.push("");
  lines.push("**Required illustration changes**");
  lines.push("");
  for (const action of review.illustrationActions) lines.push(`- ${action}`);
  lines.push("");
  lines.push("**Score evidence**");
  lines.push("");
  lines.push("| Category | Score |");
  lines.push("| --- | ---: |");
  for (const category of STORY_CONTENT_SCORE_CATEGORIES) {
    lines.push(`| ${category.label} | ${review.scores[category.id]}/4 |`);
  }
  lines.push("");
  lines.push("<details>");
  lines.push(`<summary>Complete target text and illustration outline — ${quest.pages.length} pages</summary>`);
  lines.push("");

  for (const page of quest.pages) {
    const text = pageText(quest, page);
    const prompt = targetPrompt(page);
    const choices = (page.choices || [])
      .map(choice => `“${choice.label}” → \`${choice.nextPageId}\``)
      .join("; ");
    const pageIncoming = incoming.get(page.id) || [];
    lines.push(`#### ${page.id}`);
    lines.push("");
    lines.push(`- **Full target text:** ${text.map(line => `“${line}”`).join(" / ")}`);
    lines.push(`- **Target prompt:** ${prompt ? `“${prompt}”` : "No prompt; non-interactive page"}`);
    lines.push(`- **Choices and route targets:** ${choices || "No choices"}`);
    lines.push(`- **Illustration outline:** ${illustrationOutline(quest, page, text, pageIncoming)}`);
    lines.push(`- **Disposition:** ${disposition(quest, page)}`);
    lines.push(`- **Audio requirement:** Record the full target text above exactly, then pass word-for-word, pronunciation, pacing and intelligibility checks. Current replacement narration is not approved.`);
    lines.push("");
  }

  lines.push("</details>");
  lines.push("");
}

lines.push("## Release sequence");
lines.push("");
lines.push("1. Approve the target story promise and complete target manuscript for one quest.");
lines.push("2. Apply the manuscript to source and run wiring, level and policy gates.");
lines.push("3. Re-render every page marked for re-render and conduct a page-by-page image/text match.");
lines.push("4. Generate narration only from the locked text and conduct word-for-word plus listening-quality review.");
lines.push("5. Traverse every route in the browser and record route-specific consequence and ending evidence.");
lines.push("6. Complete the accountable editorial scorecard and update the exact source fingerprint.");
lines.push("7. Mark the quest approved only when the strict release gate passes with no mandatory violation.");
lines.push("");
lines.push("## Files that enforce this policy");
lines.push("");
lines.push("- `src/content/storyContentPolicy.js` — formats, levels, mandatory rules and approval rule.");
lines.push("- `src/content/storyContentReviews.js` — registered catalogue fingerprints and item verdicts.");
lines.push("- `tools/checkStoryContentPolicy.mjs` — admission, evidence-shape and anti-false-approval gate.");
lines.push("- `docs/content/STORY_CONTENT_AUTHORING_TEMPLATE.md` — required authoring and approval record.");
lines.push("- `docs/content/STORY_BIBLE_PART_1_WRITING.md` — research-grounded writing standard.");
lines.push("- `docs/content/STORY_BIBLE_PART_2_CANON.md` — LiteracyPath canon, art and audio standard.");

fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);
console.log(`Quests: ${storyQuests.length}; pages: ${storyQuests.reduce((sum, quest) => sum + quest.pages.length, 0)}.`);
