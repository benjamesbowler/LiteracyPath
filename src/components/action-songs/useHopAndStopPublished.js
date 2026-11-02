import { useEffect, useState } from "react";
import { HOP_AND_STOP_MEDIA, isHopAndStopPublished } from "../../data/hopAndStop.js";

export function useHopAndStopPublished(enabled = true) {
  const [published, setPublished] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let current = true;
    const abort = new AbortController();
    fetch(HOP_AND_STOP_MEDIA.release, { signal: abort.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(receipt => { if (current) setPublished(isHopAndStopPublished(receipt)); })
      .catch(() => { if (current) setPublished(false); });
    return () => { current = false; abort.abort(); };
  }, [enabled]);
  return enabled && published;
}
