export function summarizeMediaQaWorkload(items = []) {
  const imageItems = items.filter(item => Boolean(item.imagePath));
  const pendingItems = items.filter(item => (item.status || "pending") === "pending");
  const pendingImageItems = pendingItems.filter(item => Boolean(item.imagePath));

  return {
    pairings: items.length,
    imagePairings: imageItems.length,
    uniqueImages: new Set(imageItems.map(item => item.imagePath)).size,
    textOnlyPairings: items.length - imageItems.length,
    pendingPairings: pendingItems.length,
    pendingImagePairings: pendingImageItems.length,
    pendingUniqueImages: new Set(pendingImageItems.map(item => item.imagePath)).size,
    pendingTextOnlyPairings: pendingItems.length - pendingImageItems.length
  };
}
