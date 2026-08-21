export function summarizeMediaQaWorkload(items = []) {
  const imageItems = items.filter(item => Boolean(item.imagePath));
  const quarantinedItems = items.filter(item => item.status === "quarantined");
  const acceptedItems = items.filter(item => item.status !== "quarantined");
  const acceptedImageItems = acceptedItems.filter(item => Boolean(item.imagePath));

  return {
    pairings: items.length,
    imagePairings: imageItems.length,
    uniqueImages: new Set(imageItems.map(item => item.imagePath)).size,
    textOnlyPairings: items.length - imageItems.length,
    acceptedPairings: acceptedItems.length,
    acceptedImagePairings: acceptedImageItems.length,
    acceptedUniqueImages: new Set(acceptedImageItems.map(item => item.imagePath)).size,
    acceptedTextOnlyPairings: acceptedItems.length - acceptedImageItems.length,
    quarantinedPairings: quarantinedItems.length
  };
}
