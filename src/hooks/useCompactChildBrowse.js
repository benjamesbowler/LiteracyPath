import { useSyncExternalStore } from "react";

export function useChildBrowseMedia(query) {
  return useSyncExternalStore(callback => {
    const media = globalThis.matchMedia?.(query);
    media?.addEventListener("change", callback);
    return () => media?.removeEventListener("change", callback);
  }, () => Boolean(globalThis.matchMedia?.(query).matches), () => false);
}

// Short screens use smaller pages, so every choice keeps its physical target.
export const useCompactChildBrowse = () => useChildBrowseMedia("(max-height: 430px) and (orientation: landscape)");
