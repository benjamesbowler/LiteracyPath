import { GUIDED_READING_IMAGE_REVISIONS } from "../../data/generated/guidedReadingImageRevisions.generated.js";

// Preserve canonical data/manifest paths while replacing stale browser bytes.
export function withRepairedGuidedReadingImageVersion(src = "", fallbackRevision = "") {
  if (!src?.startsWith("/guided-reading/")) return src;
  const pathname = src.split(/[?#]/, 1)[0];
  const revision = GUIDED_READING_IMAGE_REVISIONS[pathname] || fallbackRevision;
  if (!revision) return src;
  const url = new URL(src, "https://literacy.guide");
  url.searchParams.set("v", revision);
  return url.pathname + url.search + url.hash;
}
