import { getChildWordAsset } from "./childAssets.js";
import { ARCADE_CUE_PICTURES } from "./generated/arcadeCuePictures.generated.js";

// Audio-led Arcade meaning scenes are intentionally scoped here. Broad
// scenes must not enter assessment target-object or image-matching pools.
export function getArcadeCuePicture(word = "") {
  const normalized = String(word).trim().toLowerCase();
  if (ARCADE_CUE_PICTURES[normalized]) return ARCADE_CUE_PICTURES[normalized];
  return { image: getChildWordAsset(normalized)?.image || "", kind: "word" };
}
