import { useChildBrowseMedia, useCompactChildBrowse } from "../../hooks/useCompactChildBrowse.js";

export function usePassageCatalogueSize() {
  const compact = useCompactChildBrowse();
  const narrow = useChildBrowseMedia("(max-width: 640px)");
  const tall = useChildBrowseMedia("(min-height: 900px)");
  const wide = useChildBrowseMedia("(min-width: 951px)");
  return compact ? 2 : narrow ? 3 : (wide ? 3 : 2) * (tall ? 3 : 2);
}
