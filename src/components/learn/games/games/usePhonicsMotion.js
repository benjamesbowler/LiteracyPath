import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    // Measure before the first playable frame. A deferred first resize used
    // to move freshly focused targets from the default board to the real one.
    const style = getComputedStyle(node);
    setSize({
      width: node.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0),
      height: node.clientHeight - parseFloat(style.paddingTop || 0) - parseFloat(style.paddingBottom || 0)
    });
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
