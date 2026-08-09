export const PRESS_ASSETS = Object.freeze([
  Object.freeze({ id: "sheep-meadow", label: "Sheep in the meadow", src: "/images/quest/ui/sheep.webp", alt: "A woolly sheep standing in a green meadow", kind: "character", attribution: "LiteracyPath original", reviewStatus: "approved" }),
  Object.freeze({ id: "turtle", label: "Small turtle", src: "/images/objects/turtle.png", alt: "A small green turtle", kind: "character", attribution: "LiteracyPath approved learning asset", reviewStatus: "approved" }),
  Object.freeze({ id: "spider", label: "Friendly spider", src: "/images/objects/spider.png", alt: "A small friendly spider", kind: "character", attribution: "LiteracyPath approved learning asset", reviewStatus: "approved" }),
  Object.freeze({ id: "meadow", label: "Meadow", src: "/images/quest/meadow/mid.webp", alt: "A wide green meadow with plants and paths", kind: "setting", attribution: "LiteracyPath original", reviewStatus: "approved" }),
  Object.freeze({ id: "moonwood", label: "Moonlit woods", src: "/images/quest/moonwood/mid.webp", alt: "A calm woodland lit by the moon", kind: "setting", attribution: "LiteracyPath original", reviewStatus: "approved" }),
  Object.freeze({ id: "dino-land", label: "Rocky valley", src: "/images/quest/dino/mid.webp", alt: "A warm rocky valley with distant plants", kind: "setting", attribution: "LiteracyPath original", reviewStatus: "approved" }),
  Object.freeze({ id: "goal-flag", label: "Goal flag", src: "/images/quest/props/goal-flag.webp", alt: "A bright flag marking a goal", kind: "sticker", attribution: "LiteracyPath original", reviewStatus: "approved" }),
  Object.freeze({ id: "broken-bridge", label: "Bridge with a gap", src: "/images/quest/props/broken-bridge.webp", alt: "A wooden bridge with a gap to solve", kind: "sticker", attribution: "LiteracyPath original", reviewStatus: "approved" }),
  Object.freeze({ id: "flower-patch", label: "Flower patch", src: "/images/quest/props/flower-patch.webp", alt: "A patch of colourful flowers", kind: "sticker", attribution: "LiteracyPath original", reviewStatus: "approved" })
]);

export function getPressAsset(assetId) {
  return PRESS_ASSETS.find(asset => asset.id === assetId && asset.reviewStatus === "approved") || null;
}
