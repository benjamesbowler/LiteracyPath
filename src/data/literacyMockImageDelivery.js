// Published Mock snapshots retain their original evidence URI. Resolve only
// reviewed replacements at delivery; never rewrite an immutable publication
// or restore a retired drawing to make an existence check pass.
export const LITERACY_MOCK_IMAGE_DELIVERY = Object.freeze({
  "/images/assessment/hfw/look.webp": "/images/assessment/release-support/targets/look-e09315.webp"
});

export function resolveLiteracyMockImagePath(src = "") {
  if (typeof src !== "string") return "";
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  const pathname = src.split(/[?#]/, 1)[0];
  const replacement = LITERACY_MOCK_IMAGE_DELIVERY[pathname];
  return replacement ? replacement + src.slice(pathname.length) : src;
}
