import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const appSource = fs.readFileSync(path.join(repoRoot, "src", "App.jsx"), "utf8");
const appPagesSource = fs.readFileSync(path.join(repoRoot, "src", "components", "AppPages.jsx"), "utf8");
const appSurfaceSource = fs.readFileSync(path.join(repoRoot, "src", "components", "AppSurface.jsx"), "utf8");
const assessmentControllerSource = fs.readFileSync(path.join(repoRoot, "src", "appState", "assessmentRoundController.js"), "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(
  !/Something went wrong loading this assessment/i.test(appSource + appPagesSource),
  "Assessment fallback must not show the old scary error copy during question transitions."
);

expect(
  appPagesSource.includes("assessment-loading-card") &&
    appPagesSource.includes("Next question is getting ready"),
  "Assessment transitions must use the shared loading card."
);

expect(
  appPagesSource.includes("assessmentShellClassName") &&
    appPagesSource.includes("assessmentFullscreen"),
  "Assessment shell must carry fullscreen state into every assessment screen."
);

expect(
  appSource.includes("toggleAssessmentFullscreen") &&
    appSurfaceSource.includes("assessment-fullscreen-app"),
  "Assessment fullscreen toggle and app-level fullscreen class are required."
);

expect(
  appPagesSource.includes("SHORT_VOWEL_AUDIO_PATHS") &&
    appPagesSource.includes("normalizeSoundTile") &&
    appPagesSource.includes("getPhonemeAudioPath(getChoiceAudioText(choice)"),
  "Assessment vowel choices and sound-order tiles must use phoneme audio paths."
);

expect(
  !appPagesSource.includes("`short ${choice.label.toLowerCase()}`"),
  "Vowel choice audio must not speak the label 'short a' as browser text."
);

const setQuestionIndex = assessmentControllerSource.indexOf("setCurrentQuestion(preparedQuestion);");
const preloadIndex = assessmentControllerSource.lastIndexOf("preloadAssessmentQuestionWindow(", setQuestionIndex);
expect(
  preloadIndex !== -1 && setQuestionIndex !== -1 && preloadIndex < setQuestionIndex,
  "Assessment question media should be preloaded before the next question is committed."
);

if (failures.length) {
  console.error("Assessment shell regression check failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Assessment shell regression check passed.");
