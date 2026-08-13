#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { APPROVED_FOUNDATION_SKILL_IDS } from "../src/maths/curriculum/mathsSkillTree.js";
import { mathsActivityRecipes } from "../src/maths/learn/mathsActivityRecipes.js";
import { mathsAssessmentBank, MATHS_ASSESSMENT_BLUEPRINTS } from "../src/maths/assessment/mathsAssessmentBank.js";
import { mathsStories, releasedMathsStories } from "../src/maths/stories/mathsStoryCatalog.js";
import { mathsGames, createMathsGameSession } from "../src/maths/games/mathsGames.js";
import { mathsSongs } from "../src/maths/music/mathsSongs.js";

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(APPROVED_FOUNDATION_SKILL_IDS.length === 8, "expected exactly eight approved Foundation skills");
check(mathsActivityRecipes.length === 40, "expected 40 lesson recipes");
check(mathsAssessmentBank.length === 160, "expected 160 assessment models");
check(new Set(mathsAssessmentBank.map(item => item.blueprintId)).size === MATHS_ASSESSMENT_BLUEPRINTS.length, "not every assessment blueprint is represented");
check(mathsAssessmentBank.every(item => item.surfaceVariants.length === 4), "every assessment model needs four surface variants");
check(mathsAssessmentBank.every(item => item.representationFamilies.length >= 2), "every assessment model needs two representation families");
check(mathsStories.length === 4 && releasedMathsStories.length === 2, "story catalog or curriculum gate drifted");
check(mathsStories.every(item => item.pages.length === 8), "every launch story needs eight pages");
check(releasedMathsStories.every(item => item.pages.every(page => page.image)), "every released story page needs its own image mapping");
check(releasedMathsStories.every(item => item.pages.every(page => page.visualDescription && page.talkPrompt)), "every released story page needs distinct visual alternative text and a page-specific talk prompt");
check(releasedMathsStories.every(item => item.pages.every(page => fs.existsSync(path.join(process.cwd(), "public", page.image)))), "every released story page image must exist");
check(mathsGames.length === 4, "expected four Foundation practice games");
check(mathsGames.every(game => createMathsGameSession(game.id, "release").items.length === 8), "every game needs eight decisions");
check(mathsSongs.length === 3, "expected three original classroom chants");
if (failures.length) {
  console.error("Maths release gate failed:\n" + failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}
console.log("Maths release content gate passed: 8 skills, 40 lessons, 160 authored checks, 16 illustrated released-story pages, 4 games and 3 chants.");
