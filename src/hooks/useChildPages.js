import { useCallback, useState, useSyncExternalStore } from "react";

export function useChildMediaQuery(query) {
  const subscribe = useCallback(notify => {
    const media = window.matchMedia(query);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
  }, [query]);
  const matches = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, matches, () => false);
}

export function useChildPages(items, pageSize, resetKey) {
  const [position, setPosition] = useState({ resetKey, firstItem: 0 });
  const reset = position.resetKey !== resetKey;
  if (reset) setPosition({ resetKey, firstItem: 0 });
  const firstItem = reset ? 0 : position.firstItem;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const pageIndex = Math.min(pageCount - 1, Math.floor(firstItem / pageSize));
  const start = pageIndex * pageSize;

  function setPageIndex(index) {
    const page = Math.max(0, Math.min(pageCount - 1, index));
    setPosition({ resetKey, firstItem: page * pageSize });
  }

  return { visibleItems: items.slice(start, start + pageSize), pageIndex, pageCount, setPageIndex };
}
