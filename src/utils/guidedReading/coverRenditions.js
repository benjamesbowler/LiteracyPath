import { GUIDED_READING_COVER_RENDITIONS } from "../../data/generated/guidedReadingCoverRenditions.generated.js";
import { withRepairedGuidedReadingImageVersion } from "./mediaVersion.js";

// Call only after the book's approved/deleted source policy. A failed delivery
// copy can still use that same canonical art, then the book's approved pages.
// Reader images deliberately keep their full-resolution canonical paths.
export function bookCoverDeliverySources(sources = [], renditions = GUIDED_READING_COVER_RENDITIONS) {
  return [...new Set(sources.flatMap(source => {
    const rendition = renditions[source];
    const canonical = withRepairedGuidedReadingImageVersion(source);
    const revision = new URL(canonical, "https://literacy.guide").searchParams.get("v");
    // A repaired source must never be masked by an older delivery copy.
    const current = rendition && (!revision || rendition.sourceSha256.startsWith(revision));
    return current ? [rendition.src, canonical] : [canonical];
  }))];
}
