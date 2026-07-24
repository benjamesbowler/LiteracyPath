import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RECOMMENDATION_EXPLANATION_SURFACES
} from "../src/policy/recommendationExplanationPolicy.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = Object.freeze({
  child: Object.freeze({
    "student-home": "src/components/StudentHomePage.jsx",
    "phonics-letter": "src/components/learn/phonics/PhonicsAlphabetPicker.jsx",
    "adventure-map": "src/components/elQuest/ElSkillsQuest.jsx",
    arcade: "src/components/learn/games/GameArcadeHub.jsx",
    "guided-reading": "src/components/guided-reading/GuidedReadingPage.jsx"
  }),
  teacher: Object.freeze({
    "teacher-dashboard-next-steps": "src/components/TeacherDashboardPage.jsx",
    "teacher-today": "src/components/TeacherDashboardPage.jsx",
    "teacher-progress": "src/components/teacher/TeacherProgressOverview.jsx",
    "guided-reading": "src/components/guided-reading/GuidedReadingPage.jsx",
    "targeted-review": "src/components/AppPages.jsx"
  })
});

for (const audience of ["child", "teacher"]) {
  assert.deepEqual(
    [...Object.keys(inventory[audience])].sort(),
    [...RECOMMENDATION_EXPLANATION_SURFACES[audience]].sort(),
    `${audience} recommendation surface registry and source inventory differ`
  );
  for (const [surface, relativePath] of Object.entries(inventory[audience])) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
    const component = audience === "child"
      ? "ChildRecommendationExplanation"
      : "TeacherRecommendationExplanation";
    assert.match(source, new RegExp(`<${component}[\\s\\S]*?surface="${surface}"`));
  }
}

console.log(
  `Recommendation explanation surfaces: `
  + `${RECOMMENDATION_EXPLANATION_SURFACES.child.length} child, `
  + `${RECOMMENDATION_EXPLANATION_SURFACES.teacher.length} teacher`
);
