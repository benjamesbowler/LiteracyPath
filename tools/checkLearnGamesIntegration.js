import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/components/learn/games/GameArcadeHub.jsx",
  "src/components/learn/games/GamePlayer.jsx",
  "src/components/learn/games/games/CVCWordBuilder.jsx",
  "src/components/learn/games/games/SightWordMemory.jsx",
  "src/components/learn/games/games/SoundSlide.jsx",
  "src/components/learn/games/games/BlendAndBuild.jsx",
  "src/components/learn/games/games/RhymeTime.jsx",
  "src/components/learn/games/games/SightWordFishing.jsx",
  "src/components/learn/games/games/CVCTrain.jsx",
  "src/components/learn/games/games/PopTheWord.jsx",
  "src/components/learn/games/games/WordHopscotch.jsx",
  "src/components/learn/games/games/ReadingRace.jsx",
  "public/images/learn-games/icon-blend-build.png",
  "public/images/learn-games/icon-cvc-builder.png",
  "public/images/learn-games/icon-pop-word.png",
  "public/images/learn-games/icon-reading-race.png",
  "public/images/learn-games/icon-rhyme-time.png",
  "public/images/learn-games/icon-sight-memory.png",
  "public/images/learn-games/icon-sound-slide.png",
  "public/images/learn-games/icon-word-fishing.png",
  "public/images/learn-games/icon-word-hopscotch.png",
  "public/images/learn-games/icon-word-train.png",
  "public/images/learn-games/phinny-celebrating.png"
];

const forbiddenRuntimeRoots = [
  "src/components/learn/games",
  "src/data/learnGamesData.js",
  "src/utils/learnGamesAudio.js",
  "src/utils/learnGamesProgress.js"
];

const missing = requiredFiles.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing Learn Games files:\n${missing.map(file => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const offenders = [];
for (const relativePath of forbiddenRuntimeRoots) {
  const absolutePath = path.join(root, relativePath);
  const files = fs.statSync(absolutePath).isDirectory()
    ? fs.readdirSync(absolutePath, { recursive: true }).map(file => path.join(absolutePath, file)).filter(file => fs.statSync(file).isFile())
    : [absolutePath];

  for (const file of files) {
    if (!/\.(jsx?|css)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("Phonics app extension")) {
      offenders.push(path.relative(root, file));
    }
  }
}

if (offenders.length) {
  console.error(`Learn Games runtime imports from the extension folder:\n${offenders.map(file => `- ${file}`).join("\n")}`);
  process.exit(1);
}

console.log("Learn Games integration guard passed.");
