// Willow manifests own Willow revisions; other reviewed collections retain theirs.
export function mergeWillowImageRevisions(existingRevisions, manifestAssets) {
  const entries = Object.entries(existingRevisions).filter(
    ([imagePath]) => !imagePath.startsWith("/guided-reading/willow-street/")
  );
  for (const asset of manifestAssets) {
    if (!asset.cacheVersion) continue;
    if (!asset.path.startsWith("/guided-reading/willow-street/")
      || asset.cacheVersion !== asset.sha256.slice(0, 12)) {
      throw new Error("Invalid image cache version: " + asset.path);
    }
    entries.push([asset.path, asset.cacheVersion]);
  }
  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}
