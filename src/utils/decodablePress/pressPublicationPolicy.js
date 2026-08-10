export function canPublishBookRevision({ revisionId, review, requestedVisibility }) {
  if (!new Set(["private", "class"]).has(requestedVisibility)) return { allowed: false, reason: "Unsupported visibility." };
  if (!review || review.revisionId !== revisionId) return { allowed: false, reason: "This exact revision has not been reviewed." };
  if (review.decision !== "approved") return { allowed: false, reason: "Teacher approval is required." };
  if (requestedVisibility === "class" && review.allowClassLibrary !== true) return { allowed: false, reason: "Class-library approval is required." };
  return { allowed: true, reason: null };
}

export function validatePressBook(book, { assetIds = [], pageCount = 4, requireComplete = true } = {}) {
  if (!book || typeof book !== "object") throw new Error("Book content is required.");
  const title = String(book.title || "").trim();
  if (!title || title.length > 80) throw new Error("Add a title of 80 characters or fewer.");
  if (!Array.isArray(book.pages) || book.pages.length !== pageCount) throw new Error(`This project needs exactly ${pageCount} pages.`);
  const allowedAssets = new Set(assetIds);
  const pages = book.pages.map((page, index) => {
    const text = String(page.text || "").trim();
    if (text.length > 240) throw new Error(`Page ${index + 1} must use 240 characters or fewer.`);
    if (requireComplete && !text) throw new Error(`Finish page ${index + 1} before sending the book to your teacher.`);
    if (!allowedAssets.has(page.assetId)) throw new Error(`Page ${index + 1} uses an unapproved picture.`);
    return { pageNumber: index + 1, promptId: String(page.promptId || ""), text, assetId: page.assetId };
  });
  return Object.freeze({ title, planner: Object.freeze({ ...(book.planner || {}) }), pages: Object.freeze(pages), complete: pages.every(page => page.text.length > 0) });
}
