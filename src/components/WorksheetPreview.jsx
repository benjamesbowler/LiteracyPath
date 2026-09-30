import { useEffect, useRef, useState } from "react";

// Show the exact printable A4 page at a readable scale. The document contains
// live text, embedded type and local pictures; scripts and forms are sandboxed.
export function WorksheetPreview({ html, title }) {
  const container = useRef(null);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const scale = width / 794;
  return <div ref={container} className="ws-paper-viewport" style={{ height: `${1123 * scale}px` }}>
    <iframe className="ws-paper-frame" title={title} srcDoc={html} sandbox="allow-same-origin" style={{ transform: `scale(${scale})` }} />
  </div>;
}
