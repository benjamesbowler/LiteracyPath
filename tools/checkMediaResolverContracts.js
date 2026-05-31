import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source, pattern, message) {
  assert(pattern.test(source), message);
}

const resolverPath = "src/utils/mediaResolver.js";
const learnCardMediaPath = "src/components/learn/LearnCardMedia.jsx";
const learnDeckPlayerPath = "src/components/LearnDeckPlayer.jsx";
const learnDeckInteractionPath = "src/components/LearnDeckInteractionLayer.jsx";

assert(exists(resolverPath), "src/utils/mediaResolver.js must exist.");

const resolver = read(resolverPath);
const learnCardMedia = read(learnCardMediaPath);
const learnDeckPlayer = read(learnDeckPlayerPath);
const learnDeckInteraction = read(learnDeckInteractionPath);
const learnDeckSources = [
  learnCardMedia,
  learnDeckPlayer,
  learnDeckInteraction,
  ...fs.readdirSync(path.join(ROOT, "src/components/learn"))
    .filter(fileName => fileName.endsWith(".jsx"))
    .map(fileName => read(`src/components/learn/${fileName}`))
];
const learnDeckSource = learnDeckSources.join("\n");

[
  "resolveLearnImage",
  "resolveLearnAudio",
  "resolveDeckSlideImage",
  "resolveGuidedReadingImage",
  "resolveGuidedReadingAudio",
  "resolveAssessmentAudio",
  "hasMediaPath",
  "normalizeMediaPath",
  "createMediaFallbackLabel"
].forEach(exportName => {
  assertIncludes(resolver, new RegExp(`export function ${exportName}\\b`), `mediaResolver missing ${exportName}.`);
});

assertIncludes(learnCardMedia, /mediaResolver/, "LearnCardMedia must use the shared media resolver.");
assertIncludes(learnCardMedia, /learn-card-image-fallback/, "LearnCardMedia must keep a missing image fallback.");
assertIncludes(learnCardMedia, /resolveLearnAudio/, "LearnCardMedia must resolve audio through mediaResolver.");
assertIncludes(learnCardMedia, /\.play\(\)\.catch/, "Learn audio click must catch playback errors.");

assert(!/autoplay/i.test(learnDeckSource), "Learn deck media must not introduce autoplay.");
assert(!/<(?:iframe|embed|object)\b/i.test(learnDeckSource), "Learn decks must not embed external PowerPoint/viewer content.");
assert(!/docs\.google\.com\/(?:presentation|viewer)|view\.officeapps\.live\.com/i.test(learnDeckSource), "No external PowerPoint viewer/embed is allowed.");

assertIncludes(learnDeckPlayer, /resolveDeckSlideImage/, "LearnDeckPlayer must resolve slide images through mediaResolver.");
assertIncludes(learnDeckPlayer, /learn-deck-image-placeholder/, "LearnDeckPlayer must keep missing slide placeholder fallback.");

execSync("npm run build", {
  cwd: ROOT,
  stdio: "inherit"
});

console.log("Media resolver contracts passed.");
