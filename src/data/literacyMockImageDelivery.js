// Published Mock snapshots retain their original evidence URI. Resolve only
// reviewed replacements at delivery; never rewrite an immutable publication
// or restore a retired drawing to make an existence check pass.
export const LITERACY_MOCK_IMAGE_DELIVERY = Object.freeze({
  "/images/assessment/hfw/look.webp": "/images/assessment/release-support/targets/look-e09315.webp",
  // Exact word pictures must remain legible as small answer tiles. These
  // reviewed deliveries remove unrelated rooms, scenery and competing objects
  // while retaining the original published media identity and spoken target.
  "/images/assessment/rhyming/variants/og/log-02.webp": "/images/assessment/literacy-classroom/log.webp",
  "/images/assessment/blends/hand.webp": "/media/initial-sounds/images/h/hand.webp",
  "/images/assessment/digraphs/chair.webp": "/images/child-mode/digraphs/chair.webp",
  "/images/assessment/language/variants/homophones-homonyms/tail-tale-01.webp": "/images/assessment/literacy-mock/clarity/tail-v1.webp",
  "/images/assessment/rhyming/variants/eg/peg-02.webp": "/images/assessment/generated/phonics-quality/peg.webp",
  "/images/assessment/literacy-mock/capacity/foundation-fin.webp": "/images/child-mode/vocabulary/fin.webp",
  "/images/child-mode/initial-sounds/red.webp": "/images/child-mode/vocabulary/red.webp",
  "/images/child-mode/reviewed/sat.webp": "/images/child-mode/short-i/sit.webp",
  "/images/child-mode/vocabulary/dug.webp": "/images/assessment/literacy-mock/capacity/foundation-dig.webp",
  "/media/vocabulary/images/eat.webp": "/images/assessment/literacy-mock/clarity/eat-v1.webp",
  "/media/vocabulary/images/point.webp": "/images/assessment/literacy-mock/capacity/foundation-point.webp"
});

export function resolveLiteracyMockImagePath(src = "") {
  if (typeof src !== "string") return "";
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  const pathname = src.split(/[?#]/, 1)[0];
  const replacement = LITERACY_MOCK_IMAGE_DELIVERY[pathname];
  return replacement ? replacement + src.slice(pathname.length) : src;
}
