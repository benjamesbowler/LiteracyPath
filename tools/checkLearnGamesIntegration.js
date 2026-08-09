import fs from "node:fs";
import path from "node:path";
import { CVC_WORDS, GAME_LIST, RHYMING_PAIRS, WORD_FAMILIES } from "../src/data/learnGamesData.js";
import { getChildWordAsset } from "../src/data/childAssets.js";
import { soundSafariAudioCoverage } from "../src/utils/soundSafariRounds.js";
import { AUDIO_FILE_PATHS } from "../src/data/generated/audioFilePaths.generated.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../src/data/ledaProductionAudio.js";

const root = process.cwd();
const requiredFiles = [
  "src/components/learn/games/GameArcadeHub.jsx",
  "src/components/learn/games/GamePlayer.jsx",
  "src/components/learn/games/games/ArcadePracticeGame.jsx",
  "src/components/learn/games/games/index.js",
  "src/components/learn/games/games/CVCWordBuilder.jsx",
  "src/components/learn/games/games/SightWordMemory.jsx",
  "src/components/learn/games/games/BlendAndBuild.jsx",
  "src/components/learn/games/games/PopTheWord.jsx",
  "src/components/learn/games/games/WordHopscotch.jsx",
  "src/components/learn/games/games/ReadingRace.jsx",
  "public/images/learn-games/phinny-celebrating.png",
  ...GAME_LIST.map(game => game.icon.startsWith("/") ? `public${game.icon}` : `public/${game.icon}`)
];

const forbiddenRuntimeRoots = [
  "src/components/learn/games",
  "src/data/learnGamesData.js",
  "src/utils/learnGamesAudio.js",
  "src/utils/learnGamesProgress.js"
];
const allowedLearnGameHexes = new Set([
  "#E2725B", "#FBEDEA", "#D97706", "#FEF3C7", "#7C5CBF", "#F1EDFA",
  "#3B82C4", "#EAF2FA", "#2F9E62", "#EAF7F0", "#0F172A", "#475569",
  "#334155", "#64748B", "#166534", "#CBD5E1", "#FECACA", "#ffffff"
]);

const missing = requiredFiles.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing Learn Games files:\n${missing.map(file => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const offenders = [];
const emojiOffenders = [];
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
    if (/[\u{1F300}-\u{1FAFF}]/u.test(source)) {
      emojiOffenders.push(path.relative(root, file));
    }
  }
}

if (offenders.length) {
  console.error(`Learn Games runtime imports from the extension folder:\n${offenders.map(file => `- ${file}`).join("\n")}`);
  process.exit(1);
}

if (emojiOffenders.length) {
  console.error(`Emoji found in Learn Games runtime files:\n${emojiOffenders.map(file => `- ${file}`).join("\n")}`);
  process.exit(1);
}

// Gold-voice is a production-wide invariant, not merely a convention in the
// current game. Direct browser speech must never creep back into another page.
const productionTtsOffenders = fs.readdirSync(path.join(root, "src"), { recursive: true })
  .map(file => path.join(root, "src", file))
  .filter(file => fs.statSync(file).isFile() && /\.(jsx?|tsx?)$/.test(file))
  .filter(file => /SpeechSynthesisUtterance|speechSynthesis\.speak\s*\(/.test(fs.readFileSync(file, "utf8")))
  .map(file => path.relative(root, file));
if (productionTtsOffenders.length) {
  console.error(`Browser TTS found in production source:\n${productionTtsOffenders.map(file => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const learnGamesCss = fs.readFileSync(path.join(root, "src/styles/learn-games.css"), "utf8");
const rawHexes = [...learnGamesCss.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(match => match[0]);
const disallowedHexes = [...new Set(rawHexes.filter(hex => !allowedLearnGameHexes.has(hex)))];
if (disallowedHexes.length) {
  console.error(`Disallowed raw hex colors in learn-games.css:\n${disallowedHexes.map(hex => `- ${hex}`).join("\n")}`);
  process.exit(1);
}

const gameWords = new Set([
  ...Object.values(CVC_WORDS).flat(),
  ...RHYMING_PAIRS.flat(),
  ...Object.values(WORD_FAMILIES).flat()
]);
const fallbackWordCards = [];
const missingWordImages = [...gameWords].filter(word => {
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true });
  const image = asset?.image || asset?.fallbackImage;
  if (!image) {
    fallbackWordCards.push(word);
    return false;
  }
  const normalized = image.startsWith("/") ? image.slice(1) : image;
  return !fs.existsSync(path.join(root, "public", normalized));
});

if (missingWordImages.length) {
  console.error(`Learn Games word image coverage missing ${missingWordImages.length} word(s): ${missingWordImages.join(", ")}`);
  process.exit(1);
}

if (fallbackWordCards.length) {
  console.error(`Learn Games still contain ${fallbackWordCards.length} text-only word card(s): ${fallbackWordCards.join(", ")}`);
  process.exit(1);
}

const safariCoverage = soundSafariAudioCoverage();
const invalidSafariBanks = Object.entries(safariCoverage).filter(([, result]) => (
  result.total !== 30 || result.recorded.length !== 30 || result.missing.length > 0
));
if (invalidSafariBanks.length) {
  console.error(`Sound Safari gold-voice coverage failed:\n${invalidSafariBanks.map(([difficulty, result]) => (
    `- ${difficulty}: ${result.recorded.length}/${result.total} recorded; missing ${result.missing.join(", ") || "bank entries"}`
  )).join("\n")}`);
  process.exit(1);
}

const requiredArcadeVoiceCues = [
  getLedaInstructionAudioPath("Listen and find"),
  getLedaWordAudioPath("tap"),
  getLedaInstructionAudioPath("Great job")
];
const missingArcadeVoiceCues = requiredArcadeVoiceCues.filter(src => !AUDIO_FILE_PATHS.has(src));
if (missingArcadeVoiceCues.length) {
  console.error(`Required recorded arcade/reward cues are missing:\n${missingArcadeVoiceCues.map(src => `- ${src}`).join("\n")}`);
  process.exit(1);
}

console.log(`Learn Games integration guard passed. Word image coverage: ${gameWords.size - fallbackWordCards.length}/${gameWords.size}; text fallback cards: ${fallbackWordCards.length}; Sound Safari gold voice: 90/90; arcade/reward voice cues: 3/3; browser TTS: blocked.`);
