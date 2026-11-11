import { GUIDED_READING_IMAGE_REVISIONS } from "../../data/generated/guidedReadingImageRevisions.generated.js";
import { GUIDED_READING_TOPIC_EDITIONS } from "./editions.js";
import { GUIDED_READING_IMMUTABLE_DELIVERY_PATHS } from "../../data/generated/guidedReadingImmutableDeliveryPaths.generated.js";

const replacementFolders = new Set(Object.keys(GUIDED_READING_TOPIC_EDITIONS)
  .map(id => `/guided-reading/world-discovery/${id.replace("world-discovery-", "")}/`));
const additionalImmutableImages = new Set(GUIDED_READING_IMMUTABLE_DELIVERY_PATHS);

function isReplacementImage(pathname, additionalImages = additionalImmutableImages) {
  const canonical = pathname.replace(/\.[a-f0-9]{12}\.webp$/, ".webp");
  if (additionalImages.has(canonical)) return true;
  const slash = pathname.lastIndexOf("/");
  return replacementFolders.has(pathname.slice(0, slash + 1))
    && /^(?:cover|page-\d{2})(?:\.[a-f0-9]{12})?\.webp$/.test(pathname.slice(slash + 1));
}

// Topic replacements and reported same-path repairs need a new pathname: old workers
// ignore query strings and can otherwise return art from the previous book.
// Both the source and this byte-identical full-resolution delivery copy are
// checked by tools/buildGuidedReadingReplacementImages.mjs before a build.
export function guidedReadingReplacementImagePath(pathname, revision, additionalImages = additionalImmutableImages) {
  return isReplacementImage(pathname, additionalImages) && /^[a-f0-9]{12}$/.test(revision)
    ? pathname.replace(/(?:\.[a-f0-9]{12})?\.webp$/, `.${revision}.webp`)
    : pathname;
}

// Canonical catalogue/QA identities remain unchanged; only delivery is revised.
export function withRepairedGuidedReadingImageVersion(src = "", fallbackRevision = "") {
  if (!src?.startsWith("/guided-reading/")) return src;
  const pathname = src.split(/[?#]/, 1)[0];
  const canonical = isReplacementImage(pathname)
    ? pathname.replace(/\.[a-f0-9]{12}\.webp$/, ".webp") : pathname;
  const revision = GUIDED_READING_IMAGE_REVISIONS[canonical] || fallbackRevision;
  if (!revision) return src;
  const url = new URL(src, "https://literacy.guide");
  url.pathname = guidedReadingReplacementImagePath(canonical, revision);
  url.searchParams.set("v", revision);
  return url.pathname + url.search + url.hash;
}
