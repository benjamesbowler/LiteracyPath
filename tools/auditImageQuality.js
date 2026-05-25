import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSkillBankItems } from "../src/content/skillMedia/skillAssetRegistry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const scanRoots = [
  path.join(publicDir, "media"),
  path.join(publicDir, "images", "child-mode")
];
const imageExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
const rainbowTerms = /\b(rainbow|multi[-_ ]?color|multicolor|colourful|colorful|psychedelic|neon)\b/i;
const semanticConflictPairs = [
  ["acorn", "nut"],
  ["sock", "duck"],
  ["seed", "bed"],
  ["rain", "pan"]
];
const knownUnsuitableAssets = [
  {
    word: "acorn",
    imagePath: "/media/initial-sounds/images/a/acorn.webp",
    reason: "Manual review: rainbow-colored cap/character styling is too stylized for an ordinary acorn assessment image.",
    prompt: "Create a clean, naturally colored acorn image with a plain background and no face, rainbow cap, embedded text, or extra objects."
  },
  {
    word: "nut",
    imagePath: "/media/initial-sounds/images/n/nut.webp",
    reason: "Manual review: rainbow-colored character styling is too stylized and too confusable for a generic nut assessment image.",
    prompt: "Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no face, rainbow colors, embedded text, or acorn shape."
  },
  {
    word: "nut",
    imagePath: "/images/child-mode/short-u/nut.png",
    reason: "Manual review: image is visually an acorn, not a generic nut, so it is blocked from active assessment use.",
    prompt: "Create a clean, naturally colored generic nut image, such as walnut/peanut/hazelnut or mixed nuts, with no acorn cap, no face, no embedded text, and no rainbow colors."
  },
  {
    word: "gum",
    imagePath: "/media/initial-sounds/images/g/gum.webp",
    reason: "Manual review: object image is babyfied with a face/decorative styling. Non-living objects must not have faces.",
    prompt: "Create a clear, natural-colored piece of chewing gum or pack of gum on a clean white/simple background. No face, no eyes, no smile, no rainbow colors, no sparkles, no text, no labels, no watermark."
  },
  {
    word: "hat",
    imagePath: "/media/initial-sounds/images/h/hat.webp",
    reason: "Manual review: object image is babyfied with a face/decorative shapes. Non-living objects must not have faces.",
    prompt: "Create one clear, natural-colored cartoon hat on a clean white/simple background. No face, no eyes, no smile, no sparkles, no confetti, no text, no labels, no watermark."
  },
  {
    word: "jam",
    imagePath: "/media/initial-sounds/images/j/jam.webp",
    reason: "Manual review: food/object image is babyfied with a face. Non-living food/object targets must not have faces.",
    prompt: "Create one clear jar of strawberry jam on a clean white/simple background. Natural red jam color, no face, no eyes, no smile, no sparkles, no embedded text, no labels, no watermark."
  },
  {
    word: "leg",
    imagePath: "/media/initial-sounds/images/l/leg.webp",
    reason: "Manual review: body-part image is babyfied with a face. Body-part targets should be natural and clear, not character objects.",
    prompt: "Create one clear, natural cartoon human leg from knee to foot, neutral skin tone, simple shoe optional, clean white/simple background. No face, no eyes, no smile, no sparkles, no text, no labels, no watermark."
  },
  {
    word: "sun",
    imagePath: "/media/initial-sounds/images/s/sun.webp",
    reason: "Manual review: nature/object image is babyfied with sunglasses/face. Non-living nature/object targets must not have faces.",
    prompt: "Create one clear natural yellow sun icon/cartoon on a clean white/simple sky background. No face, no sunglasses, no eyes, no smile, no rainbow colors, no sparkles, no text, no labels, no watermark."
  },
  {
    word: "wig",
    imagePath: "/media/initial-sounds/images/w/wig.webp",
    reason: "Manual review: object image is babyfied with a face/rainbow styling. Non-living objects must not have faces.",
    prompt: "Create one clear natural-colored wig on a simple wig stand or plain background. No face, no eyes, no smile, no rainbow colors, no sparkles, no text, no labels, no watermark."
  }
];
const excludedTargetWords = [
  {
    word: "zinnia",
    reason: "Unusual flower name for K-2 Initial Sounds. Replace with zebra, zipper, zoo, zero, or zigzag."
  },
  {
    word: "zinnia flower",
    reason: "Unusual phrase target for K-2 Initial Sounds. Replace with a simpler /z/ word."
  },
  {
    word: "zannia",
    reason: "Misspelled/unusual target. Do not use in active assessment."
  },
  {
    word: "zone",
    reason: "Abstract and hard to image clearly for early Initial Sounds."
  },
  {
    word: "observer",
    reason: "Abstract/role-based and hard to image clearly for early Initial Sounds."
  },
  {
    word: "opera",
    reason: "Culturally specific and not a strong early assessment target."
  },
  {
    word: "quartz",
    reason: "Obscure for K-2 Initial Sounds."
  },
  {
    word: "quiver",
    reason: "Potentially ambiguous for K-2 Initial Sounds."
  },
  {
    word: "quickstep",
    reason: "Obscure/culturally specific for K-2 Initial Sounds."
  },
  {
    word: "upbeat",
    reason: "Abstract and hard to image clearly."
  },
  {
    word: "uplift",
    reason: "Abstract and hard to image clearly."
  },
  {
    word: "urban garden",
    reason: "Phrase target with no single clear object for early Initial Sounds."
  },
  {
    word: "velvet",
    reason: "Texture-based and hard to image unambiguously."
  },
  {
    word: "yodeler",
    reason: "Culturally specific and not a strong K-2 assessment target."
  },
  {
    word: "yucca plant",
    reason: "Less familiar and not a strong early Initial Sounds target."
  }
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return imageExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function publicPath(filePath) {
  return `/${path.relative(publicDir, filePath).replaceAll(path.sep, "/")}`;
}

function hashFile(filePath) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return "";
  }
}

function markdownTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function analyzeImageColors(publicPaths = []) {
  const candidates = publicPaths
    .filter(assetPath => /\.(webp|png|jpe?g)$/i.test(assetPath))
    .map(assetPath => ({
      publicPath: assetPath,
      filePath: path.join(publicDir, assetPath.replace(/^\//, ""))
    }))
    .filter(entry => fs.existsSync(entry.filePath));

  if (!candidates.length) return [];

  const python = `
import colorsys, json, sys
from PIL import Image

items = json.load(sys.stdin)
rows = []
for item in items:
    try:
        img = Image.open(item["filePath"]).convert("RGB")
        img.thumbnail((96, 96))
        total = 0
        saturated = 0
        bright = 0
        hue_buckets = set()
        for r, g, b in img.getdata():
            # Ignore white/near-white backgrounds and dark outline pixels.
            if r > 238 and g > 238 and b > 238:
                continue
            if r < 35 and g < 35 and b < 35:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            total += 1
            if s > 0.55 and v > 0.45:
                saturated += 1
                hue_buckets.add(int(h * 12))
            if s > 0.65 and v > 0.70:
                bright += 1
        if total:
            rows.append({
                "publicPath": item["publicPath"],
                "samplePixels": total,
                "saturatedRatio": round(saturated / total, 3),
                "brightRatio": round(bright / total, 3),
                "hueBuckets": len(hue_buckets),
            })
    except Exception as exc:
        rows.append({"publicPath": item["publicPath"], "error": str(exc)})
print(json.dumps(rows))
`;

  try {
    return JSON.parse(execFileSync("python3", ["-c", python], {
      input: JSON.stringify(candidates),
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    }));
  } catch {
    return [];
  }
}

const imageFiles = scanRoots.flatMap(walk);
const imageHashByPublicPath = new Map();
const allItems = getSkillBankItems();
const activeItems = allItems.filter(item => item.active !== false);
const activeImageRows = [];
const wordToImages = new Map();

for (const filePath of imageFiles) {
  imageHashByPublicPath.set(publicPath(filePath), hashFile(filePath));
}

for (const item of activeItems) {
  const paths = [...new Set([item.imageUrl, ...(item.imagePaths || [])].filter(Boolean))];
  for (const imagePath of paths) {
    const row = {
      skill: item.skillId,
      id: item.id,
      word: item.targetWord || item.target || "",
      imagePath,
      hash: imageHashByPublicPath.get(imagePath) || ""
    };
    activeImageRows.push(row);
    if (row.word) {
      const key = row.word.toLowerCase();
      wordToImages.set(key, [...(wordToImages.get(key) || []), row]);
    }
  }
}

const filenameRainbowRows = activeImageRows
  .filter(row => rainbowTerms.test(row.imagePath) && row.word.toLowerCase() !== "rainbow")
  .map(row => [
    row.skill,
    row.id,
    row.word,
    row.imagePath,
    "Filename suggests rainbow/over-stylized ordinary object. Manual visual review needed."
  ]);
const knownUnsuitableRows = knownUnsuitableAssets
  .filter(asset => fs.existsSync(path.join(publicDir, asset.imagePath.replace(/^\//, ""))))
  .map(asset => [
    "initial_sounds",
    asset.word,
    asset.imagePath,
    asset.reason
  ]);
const knownUnsuitablePathSet = new Set(knownUnsuitableAssets.map(asset => asset.imagePath));
const activeKnownUnsuitableRows = activeImageRows
  .filter(row => knownUnsuitablePathSet.has(row.imagePath))
  .map(row => [
    row.skill,
    row.id,
    row.word,
    row.imagePath,
    knownUnsuitableAssets.find(asset => asset.imagePath === row.imagePath)?.reason || "Known unsuitable image is still active."
  ]);

const publicRainbowRows = imageFiles
  .map(filePath => publicPath(filePath))
  .filter(assetPath => rainbowTerms.test(assetPath) && !assetPath.endsWith("/rainbow.webp"))
  .map(assetPath => [
    assetPath,
    imageHashByPublicPath.get(assetPath)?.slice(0, 12) || "",
    "Filename/path suggests rainbow or overly colorful asset."
  ]);
const activeUniqueImagePaths = [...new Set(activeImageRows.map(row => row.imagePath).filter(Boolean))];
const colorAnalysisRows = analyzeImageColors(activeUniqueImagePaths);
const saturatedReviewRows = colorAnalysisRows
  .filter(row =>
    !row.error &&
    !String(row.publicPath).endsWith("/rainbow.webp") &&
    row.saturatedRatio > 0.55 &&
    row.hueBuckets >= 6
  )
  .map(row => {
    const matchingItems = activeImageRows.filter(item => item.imagePath === row.publicPath);
    const words = [...new Set(matchingItems.map(item => item.word).filter(Boolean))].join(", ");
    return [
      words || "-",
      row.publicPath,
      row.saturatedRatio,
      row.brightRatio,
      row.hueBuckets,
      "Color heuristic suggests possible over-saturated/multicolored ordinary object. Manual review recommended before blocking."
    ];
  });

const semanticConflictRows = [];
for (const [wordA, wordB] of semanticConflictPairs) {
  const rowsA = wordToImages.get(wordA) || [];
  const rowsB = wordToImages.get(wordB) || [];
  if (!rowsA.length && !rowsB.length) {
    semanticConflictRows.push([wordA, wordB, "not active", "No active image-backed items found for one or both words."]);
    continue;
  }

  for (const rowA of rowsA) {
    for (const rowB of rowsB) {
      const sharedPath = rowA.imagePath && rowA.imagePath === rowB.imagePath;
      const sharedHash = rowA.hash && rowA.hash === rowB.hash;
      if (sharedPath || sharedHash) {
        semanticConflictRows.push([
          wordA,
          wordB,
          "FAIL",
          `${rowA.id} and ${rowB.id} share ${sharedPath ? "image path" : "image file hash"} (${rowA.imagePath} / ${rowB.imagePath}).`
        ]);
      }
    }
  }

  if (!semanticConflictRows.some(row => row[0] === wordA && row[1] === wordB && row[2] === "FAIL")) {
    semanticConflictRows.push([wordA, wordB, "pass", "No active shared image path/hash detected."]);
  }
}

const recommendedReplacementRows = [
  ...knownUnsuitableAssets.map(asset => [
    asset.word,
    asset.imagePath,
    asset.prompt
  ]),
  ...filenameRainbowRows.map(row => [
    row[2],
    row[3],
    `Create a clean, naturally colored educational image for "${row[2]}". Use realistic/natural object colors, a simple background, no embedded text, and no face/eyes/smile on non-living objects.`
  ]),
  ...semanticConflictRows
    .filter(row => row[2] === "FAIL")
    .map(row => [
      `${row[0]} / ${row[1]}`,
      row[3],
      `Regenerate separate, semantically clear images. "${row[0]}" and "${row[1]}" must not share the same visual asset.`
    ])
];
const excludedTargetWordSet = new Set(excludedTargetWords.map(item => item.word.toLowerCase()));
const activeExcludedWordRows = activeItems
  .filter(item => excludedTargetWordSet.has(String(item.targetWord || "").toLowerCase()))
  .map(item => [
    item.skillId,
    item.id,
    item.targetWord,
    excludedTargetWords.find(entry => entry.word.toLowerCase() === String(item.targetWord || "").toLowerCase())?.reason || "Excluded target word is still active."
  ]);
const inactiveExcludedWordRows = allItems
  .filter(item => item.active === false && excludedTargetWordSet.has(String(item.targetWord || "").toLowerCase()))
  .map(item => [
    item.skillId,
    item.id,
    item.targetWord,
    item.raw?.qaStatus || "inactive",
    item.raw?.qaNotes || excludedTargetWords.find(entry => entry.word.toLowerCase() === String(item.targetWord || "").toLowerCase())?.reason || ""
  ]);

const fatalConflicts = semanticConflictRows.filter(row => row[2] === "FAIL");
const fatalActiveImageRows = [...activeKnownUnsuitableRows, ...activeExcludedWordRows];
const doc = `# Image Quality Visual Audit

Generated: ${new Date().toISOString()}

This audit focuses on assessment media. It uses safe static heuristics only: filenames/paths and exact-file hash comparisons. It does not delete or replace assets automatically.

## Summary

- Public assessment images scanned: ${imageFiles.length}
- Active image-backed assessment mappings scanned: ${activeImageRows.length}
- Likely rainbow/over-stylized active mappings: ${filenameRainbowRows.length}
- Known unsuitable assessment assets blocked/requested: ${knownUnsuitableRows.length}
- Known unsuitable assets still active: ${activeKnownUnsuitableRows.length}
- Excluded weird/unusual targets still active: ${activeExcludedWordRows.length}
- Rainbow/path warnings in public assets: ${publicRainbowRows.length}
- Over-saturated active image manual-review warnings: ${saturatedReviewRows.length}
- Known semantic conflict failures: ${fatalConflicts.length}
- Audio replacement requests: 0

## Likely Rainbow Or Over-Stylized Active Mappings

${markdownTable(["skill", "question id", "word", "image path", "reason"], filenameRainbowRows)}

## Known Unsuitable Assessment Assets

${markdownTable(["skill", "word", "image path", "reason"], knownUnsuitableRows)}

## Known Unsuitable Images Still Active

${markdownTable(["skill", "question id", "word", "image path", "reason"], activeKnownUnsuitableRows)}

## Rainbow/Colorful Filename Warnings In Public Assets

${markdownTable(["asset path", "hash", "warning"], publicRainbowRows.slice(0, 160))}

## Color-Heuristic Manual Review Warnings

${markdownTable(["word(s)", "image path", "saturated ratio", "bright ratio", "hue buckets", "warning"], saturatedReviewRows.slice(0, 160))}

## Known Semantic Conflict Checks

${markdownTable(["word A", "word B", "status", "detail"], semanticConflictRows)}

## Excluded Weird Or Unusual Targets

### Active Failures

${markdownTable(["skill", "question id", "target word", "reason"], activeExcludedWordRows)}

### Blocked/Inactive

${markdownTable(["skill", "question id", "target word", "qa status", "reason"], inactiveExcludedWordRows)}

## Recommended Replacement Requests

${markdownTable(["word", "current path/detail", "recommended Kimi prompt"], recommendedReplacementRows)}

## Kimi Style Rule

Cute cartoon educational images are acceptable. Rainbow-colored ordinary objects are not acceptable. Use natural colors unless the target word itself requires color, such as \`rainbow\`. Non-living objects, foods, body parts, tools, vehicles, and nature objects must not have faces, eyes, smiles, character expressions, sparkles, confetti, magical glow, or baby/kawaii styling. A \`nut\` image should show a generic nut such as a walnut, peanut, or hazelnut, not an acorn unless the target word is \`acorn\`.
`;

write(path.join(rootDir, "docs", "assets", "image_quality_visual_audit.md"), doc);

const replacementRequestRows = knownUnsuitableAssets.map(asset => [
  asset.imagePath.includes("/initial-sounds/") ? "initial_sounds" : "assessment_shared",
  asset.imagePath.includes("/initial-sounds/images/a/") ? "1" : asset.imagePath.includes("/initial-sounds/images/n/") ? "1" : "",
  asset.word,
  asset.word === "acorn" ? "a" : asset.word === "nut" ? "n" : "",
  asset.imagePath,
  asset.imagePath,
  asset.reason,
  asset.prompt
]);
const excludedWordRows = excludedTargetWords.map(item => [
  item.word,
  item.reason,
  item.word.startsWith("z") ? "Use zebra, zipper, zoo, zero, or zigzag if a replacement /z/ target is needed." : "Use a clearer, concrete, K-2 friendly replacement target if this slot needs to be restored."
]);
const replacementDoc = `# Kimi Image Replacement Request

Generated: ${new Date().toISOString()}

These are image-only replacement requests for assessment content quality. The existing audio is good unless a separate audit marks it genuinely missing or broken.

**AUDIO IS NOT NEEDED FOR THESE ITEMS. IMAGE ONLY.**

## Global Image Rules

- Realistic/natural object colors.
- Cute clean educational cartoon or semi-realistic style is fine.
- No rainbow-colored ordinary objects.
- No faces, eyes, smiles, or character expressions on non-living objects, foods, body parts, tools, vehicles, or nature objects.
- No embedded text, labels, captions, or watermarks.
- Single clear target object on a clean white/simple background.
- Kindergarten safe.
- Object must clearly match the target word.
- Do not use an acorn image for \`nut\`.

## Image Replacements Needed

| Skill ID | Level | Target Word | Letter/Sound/Pattern | Current Bad Image Path | Exact Replacement Image Path | Reason | Image-Only Prompt |
|---|---:|---|---|---|---|---|---|
${replacementRequestRows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`).join("\n")}

## Excluded Weird/Unusual Words

These targets should stay inactive unless replaced with better K-2 words. Do not generate audio for these excluded words.

| Excluded Word | Reason | Replacement Direction |
|---|---|---|
${excludedWordRows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`).join("\n")}
`;

write(path.join(rootDir, "docs", "assets", "kimi_image_replacement_request.md"), replacementDoc);

console.log(`Public images scanned: ${imageFiles.length}`);
console.log(`Active image mappings scanned: ${activeImageRows.length}`);
console.log(`Likely rainbow active mappings: ${filenameRainbowRows.length}`);
console.log(`Known unsuitable images still active: ${activeKnownUnsuitableRows.length}`);
console.log(`Excluded weird targets still active: ${activeExcludedWordRows.length}`);
console.log(`Semantic conflict failures: ${fatalConflicts.length}`);
console.log("Wrote docs/assets/image_quality_visual_audit.md");
console.log("Wrote docs/assets/kimi_image_replacement_request.md");

if (fatalConflicts.length || fatalActiveImageRows.length) {
  fatalConflicts.forEach(row => console.error(`- ${row[0]}/${row[1]}: ${row[3]}`));
  fatalActiveImageRows.forEach(row => console.error(`- ${row.join(": ")}`));
  process.exit(1);
}

console.log("Image quality audit completed with warnings only.");
