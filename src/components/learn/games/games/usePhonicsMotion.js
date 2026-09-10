import { useEffect, useRef, useState } from 'react';

export function usePlayClock(paused) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (paused) return undefined;
    let frame, last;
    const tick = now => {
      if (last != null) setTime(t => t + Math.min(0.05, (now - last) / 1000));
      last = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);
  return time;
}

export function usePlaySize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 320 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
