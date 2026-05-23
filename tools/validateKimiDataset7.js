import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { getChildAudioPath, getChildWordAsset } from "../src/data/childAssets.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const datasetPath = path.join(rootDir, "docs", "imports", "kimi_phonics_dataset7.json");
const packRoot = "/Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Assets 7";

const skillMap = {
  beginning_sounds: { original: "Beginning Sounds", mappedSkillId: "initial_sounds" },
  final_sounds: { original: "Final Sounds", mappedSkillId: "final_sounds" },
  rhyming: { original: "Rhyming", mappedSkillId: "rhyming" },
  cvc: { original: "CVC Words", mappedSkillId: "cvc_short_vowels" },
  short_vowels: { original: "Short Vowels", mappedSkillId: "short_vowel_discrimination" },
  blends: { original: "Consonant Blends", mappedSkillId: "blends" },
  digraphs: { original: "Consonant Digraphs", mappedSkillId: "digraphs" },
  silent_e: { original: "Silent E / Magic E", mappedSkillId: "long_vowels_silent_e" },
  long_vowels: { original: "Long Vowels", mappedSkillId: "long_vowels" },
  vowel_teams: { original: "Vowel Teams", mappedSkillId: "vowel_teams" },
  r_controlled: { original: "R-Controlled Vowels", mappedSkillId: "r_controlled" }
};

const easyImageableWords = new Set([
  "ant", "apple", "axe", "bad", "bag", "ball", "bat", "bear", "bed", "bee",
  "bell", "big", "bin", "bird", "black", "blue", "boat", "book", "box", "brush",
  "bug", "bun", "bus", "cake", "cap", "car", "cat", "chair", "chick", "clap",
  "coat", "corn", "cot", "crab", "cup", "deer", "desk", "dig", "dish", "dog",
  "drum", "duck", "egg", "elephant", "fan", "farm", "fin", "fish", "flag", "fork",
  "fox", "frog", "gate", "girl", "goat", "gum", "ham", "hand", "hat", "hen",
  "hit", "home", "hook", "hop", "horse", "hot", "house", "hut", "igloo", "ink",
  "jam", "jet", "jug", "key", "kid", "king", "kite", "lamp", "leaf", "leg",
  "lid", "lion", "log", "man", "map", "mat", "moon", "mop", "mud", "mug",
  "nap", "net", "nut", "octopus", "orange", "ox", "pan", "park", "pen", "pig",
  "pin", "pot", "queen", "quilt", "rain", "ram", "rat", "red", "ring", "rock",
  "roof", "rope", "rug", "run", "seal", "seed", "shell", "ship", "shop", "sit",
  "sled", "slide", "snake", "sock", "spin", "star", "stop", "sun", "tap", "ten",
  "tent", "thin", "thumb", "tiger", "top", "train", "tree", "tub", "umbrella",
  "uncle", "under", "up", "van", "vase", "vest", "vet", "web", "whale", "wheel",
  "wig", "worm", "yak", "yarn", "zebra", "zip", "zoo"
]);

const blockedWords = new Set(["pun"]);
const overusedWords = new Set(["cat", "map", "mop", "pan", "pig", "hat"]);
const advancedOrAwkward = /^(afar|boil|brake|close|dwarf|foe|ghoul|grove|hike|idea|purer|quire|rash|revert|rook|scarf|skew|tried|vim|whet|yep)$/;

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function wordPatternFor(skillKey, word) {
  const clean = normalize(word);
  if (skillKey === "final_sounds") {
    if (clean.endsWith("sh")) return "final_sh";
    if (clean.endsWith("ch")) return "final_ch";
    if (clean.endsWith("ck")) return "final_k";
    if (clean.endsWith("se")) return "final_s";
    if (clean.length > 2 && clean.endsWith("e")) return `final_${clean.at(-2)}`;
    return `final_${clean.at(-1) || ""}`;
  }
  if (skillKey === "beginning_sounds") return `initial_${clean[0] || ""}`;
  if (skillKey === "rhyming") return `rhyme_${clean.slice(-2)}`;
  return "";
}

function hasProjectAssets(word) {
  const asset = getChildWordAsset(word);
  const audio = getApprovedAudioPath(word, asset?.audio || getChildAudioPath(word));
  return {
    image: Boolean(asset?.image || asset?.fallbackImage),
    audio: Boolean(audio),
    imagePath: asset?.image || asset?.fallbackImage || "",
    audioPath: audio
  };
}

function validateItem(skillKey, item, seenSignatures) {
  const reasons = [];
  const word = normalize(item.word);
  const distractors = Array.isArray(item.distractors) ? item.distractors.map(normalize) : [];
  const pattern = normalize(item.pattern);
  const signature = `${skillKey}:${word}:${pattern}:${distractors.join("|")}`;

  if (!word || !pattern || distractors.length !== 3) reasons.push("missing required fields");
  if (seenSignatures.has(signature)) reasons.push("duplicate item signature");
  seenSignatures.add(signature);
  if (blockedWords.has(word) || distractors.some(choice => blockedWords.has(choice))) reasons.push("blocked weak word");
  if (distractors.includes(word)) reasons.push("correct answer appears in distractors");
  if (new Set(distractors).size !== distractors.length) reasons.push("duplicate distractors");
  if (word.length > 8 && ["beginning_sounds", "final_sounds", "cvc", "short_vowels"].includes(skillKey)) reasons.push("word too long for early skill");
  if (!/^[a-z-]+$/.test(word)) reasons.push("invalid word characters");
  if (advancedOrAwkward.test(word) || distractors.some(choice => advancedOrAwkward.test(choice))) reasons.push("advanced or obscure vocabulary");
  if (item.image_safe && !easyImageableWords.has(word) && ["beginning_sounds", "final_sounds", "rhyming", "cvc", "short_vowels", "blends", "digraphs"].includes(skillKey)) reasons.push("image_safe overclaimed for unfamiliar/non-imageable word");
  if (!item.audio_safe) reasons.push("not marked audio safe");
  if (!item.ambiguity_safe) reasons.push("not marked ambiguity safe");

  if (["beginning_sounds", "final_sounds", "rhyming"].includes(skillKey)) {
    const expected = wordPatternFor(skillKey, word);
    if (expected && pattern !== expected) reasons.push(`target pattern mismatch: expected ${expected}`);
    const ambiguous = distractors.filter(choice => wordPatternFor(skillKey, choice) === pattern);
    if (ambiguous.length) reasons.push(`multiple valid answers: ${ambiguous.join(", ")}`);
  }

  if (skillKey === "cvc" && !/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(word)) {
    reasons.push("not simple CVC");
  }

  const assets = hasProjectAssets(word);
  const canActivate = reasons.length === 0 && assets.audio && assets.image && !overusedWords.has(word);

  return {
    word,
    pattern,
    distractors,
    audioSafe: Boolean(item.audio_safe),
    imageSafe: Boolean(item.image_safe),
    ambiguitySafe: Boolean(item.ambiguity_safe),
    validationStatus: reasons.length ? "blocked" : "candidate",
    activationStatus: canActivate ? "active_candidate" : "candidate",
    blockedReason: reasons.join("; "),
    requiredAssets: {
      hasImage: assets.image,
      hasAudio: assets.audio,
      imagePath: assets.imagePath,
      audioPath: assets.audioPath
    }
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, " ")).join(" | ")} |`)
  ].join("\n");
}

fs.mkdirSync(path.join(rootDir, "docs", "imports"), { recursive: true });
fs.mkdirSync(path.join(rootDir, "src", "data", "imported"), { recursive: true });

const data = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const seenSignatures = new Set();
const skillSummaries = [];
const candidates = [];
const reasonCounts = new Map();
let totalItems = 0;

for (const [skillKey, skillData] of Object.entries(data.skills || {})) {
  const mapped = skillMap[skillKey] || { original: skillData.skill_name || skillKey, mappedSkillId: "unmapped" };
  const items = Array.isArray(skillData.items) ? skillData.items : [];
  let approved = 0;
  let blocked = 0;
  let activeCandidates = 0;
  const patterns = new Set();

  for (const item of items) {
    totalItems += 1;
    const result = validateItem(skillKey, item, seenSignatures);
    patterns.add(result.pattern);
    if (result.validationStatus === "blocked") {
      blocked += 1;
      for (const reason of result.blockedReason.split("; ").filter(Boolean)) {
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      }
    } else {
      approved += 1;
    }
    if (result.activationStatus === "active_candidate") activeCandidates += 1;

    if (
      candidates.length < 600 &&
      (result.activationStatus === "active_candidate" ||
        ["final_sounds", "silent_e", "long_vowels", "vowel_teams", "r_controlled"].includes(skillKey))
    ) {
      candidates.push({
        source: "kimi_dataset7",
        originalSkill: mapped.original,
        mappedSkillId: mapped.mappedSkillId,
        word: result.word,
        pattern: result.pattern,
        distractors: result.distractors,
        audioSafe: result.audioSafe,
        imageSafe: result.imageSafe,
        ambiguitySafe: result.ambiguitySafe,
        validationStatus: result.validationStatus,
        requiredAssets: result.requiredAssets,
        activationStatus: result.activationStatus,
        blockedReason: result.blockedReason
      });
    }
  }

  skillSummaries.push({
    skillKey,
    original: mapped.original,
    mappedSkillId: mapped.mappedSkillId,
    claimed: skillData.total_items,
    actual: items.length,
    approved,
    blocked,
    activeCandidates,
    patternCount: patterns.size,
    samplePatterns: [...patterns].slice(0, 18).join(", ")
  });
}

const reportPath = path.join(rootDir, "docs", "imports", "kimi_dataset7_validation_report.md");
const taxonomyPath = path.join(rootDir, "docs", "imports", "kimi_dataset7_taxonomy_mapping.md");
const candidateJsonPath = path.join(rootDir, "docs", "imports", "kimi_dataset7_candidates.json");
const candidateJsPath = path.join(rootDir, "src", "data", "imported", "kimiDataset7Candidates.js");
const summaryJsPath = path.join(rootDir, "src", "data", "imported", "kimiDataset7Summary.js");

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(fullPath);
  }
}
walk(packRoot);
const extCounts = files.reduce((counts, file) => {
  const ext = path.extname(file).toLowerCase() || "(none)";
  counts[ext] = (counts[ext] || 0) + 1;
  return counts;
}, {});
const claimedTotal = Object.values(data.skills || {}).reduce((sum, skill) => sum + Number(skill.total_items || 0), 0);

fs.writeFileSync(candidateJsonPath, JSON.stringify(candidates, null, 2));
fs.writeFileSync(
  candidateJsPath,
  `export const kimiDataset7Candidates = ${JSON.stringify(candidates.slice(0, 120), null, 2)};\n`
);
fs.writeFileSync(
  summaryJsPath,
  `export const kimiDataset7Summary = ${JSON.stringify({
    source: "kimi_dataset7",
    rawDatasetPath: "docs/imports/kimi_phonics_dataset7.json",
    totalItems,
    claimedTotal,
    uniqueWords: new Set(Object.values(data.skills || {}).flatMap(skill => (skill.items || []).map(item => normalize(item.word)))).size,
    approvedCandidates: skillSummaries.reduce((sum, item) => sum + item.approved, 0),
    blockedCandidates: skillSummaries.reduce((sum, item) => sum + item.blocked, 0),
    activeCandidatesWithCurrentAssets: skillSummaries.reduce((sum, item) => sum + item.activeCandidates, 0),
    exportedCandidateSampleCount: Math.min(120, candidates.length),
    docsCandidateCount: candidates.length,
    skills: skillSummaries
  }, null, 2)};\n`
);

const report = [
  "# Kimi Dataset 7 Validation Report",
  "",
  `Generated by \`node tools/validateKimiDataset7.js\`. Raw dataset is stored at \`docs/imports/kimi_phonics_dataset7.json\` and is not imported into active runtime.`,
  "",
  "## Discovery",
  "",
  `- Pack path: \`${packRoot}\``,
  `- Files found: ${files.length}`,
  `- Extension counts: ${Object.entries(extCounts).map(([ext, count]) => `${ext}:${count}`).join(", ")}`,
  `- JSON files: ${files.filter(file => file.endsWith(".json")).length}`,
  `- Image files: ${files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file)).length}`,
  `- Audio files: ${files.filter(file => /\.(mp3|wav|m4a|aac|ogg)$/i.test(file)).length}`,
  `- Archive files: ${files.filter(file => /\.(zip|tar|gz)$/i.test(file)).length}`,
  "",
  "## Claimed Vs Actual",
  "",
  `- Kimi claimed dataset total from skill totals: ${claimedTotal}`,
  `- Actual parsed items: ${totalItems}`,
  `- Claimed app note: 10,222 items / 5,232 unique words. Actual parsed item count is ${totalItems}.`,
  `- Unique words parsed: ${new Set(Object.values(data.skills || {}).flatMap(skill => (skill.items || []).map(item => normalize(item.word)))).size}`,
  "",
  markdownTable(
    ["Skill", "Mapped skill", "Claimed", "Actual", "Approved candidates", "Blocked", "Active candidates with current assets", "Patterns"],
    skillSummaries.map(item => [item.original, item.mappedSkillId, item.claimed, item.actual, item.approved, item.blocked, item.activeCandidates, item.patternCount])
  ),
  "",
  "## Top Rejection Reasons",
  "",
  markdownTable(
    ["Reason", "Count"],
    [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  ),
  "",
  "## Highest Value Candidate Samples",
  "",
  markdownTable(
    ["Mapped skill", "Word", "Pattern", "Status", "Assets", "Blocked reason"],
    candidates.slice(0, 80).map(item => [
      item.mappedSkillId,
      item.word,
      item.pattern,
      item.activationStatus,
      `image:${item.requiredAssets.hasImage ? "yes" : "no"} audio:${item.requiredAssets.hasAudio ? "yes" : "no"}`,
      item.blockedReason || ""
    ])
  ),
  "",
  "## Decision",
  "",
  "- Do not activate the full dataset in runtime.",
  "- Use only curated candidates that pass LiteracyPath validation and already have approved clean-human audio plus required images.",
  "- Add blocked but promising words to asset request lists rather than faking coverage."
].join("\n");

fs.writeFileSync(reportPath, `${report}\n`);

const taxonomy = [
  "# Kimi Dataset 7 Taxonomy Mapping",
  "",
  markdownTable(
    ["Kimi key", "Kimi label", "LiteracyPath skillId"],
    Object.entries(skillMap).map(([key, value]) => [key, value.original, value.mappedSkillId])
  )
].join("\n");
fs.writeFileSync(taxonomyPath, `${taxonomy}\n`);

console.log(`Kimi Dataset 7 parsed items: ${totalItems}`);
console.log(`Kimi claimed total from file: ${claimedTotal}`);
console.log(`Candidates written: ${candidates.length}`);
console.log(`Validation report: ${path.relative(rootDir, reportPath)}`);
console.log(`Taxonomy mapping: ${path.relative(rootDir, taxonomyPath)}`);
console.log(`Candidate source: ${path.relative(rootDir, candidateJsPath)}`);
console.log(`Summary source: ${path.relative(rootDir, summaryJsPath)}`);
