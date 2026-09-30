import { useEffect, useRef, useState } from "react";
import { WORKSHEET_PRINT_FONT } from "../utils/worksheets/worksheetPrintFont.js";

let previewFont;
function loadPrintFont() {
  if (!previewFont) {
    previewFont = new FontFace("Worksheet Andika", `url(data:font/woff2;base64,${WORKSHEET_PRINT_FONT}) format("woff2")`);
    document.fonts.add(previewFont);
    // @font-face rules inside a shadow tree do not register document fonts.
    // The same offline font is registered explicitly for the inline preview.
    previewFont.load().catch(() => { previewFont = null; });
  }
}

// Render the exact student content and print CSS in a shadow tree. This keeps
// teacher styles out while respecting production's frame-src 'none' policy.
export function WorksheetPreview({ html, title }) {
  const container = useRef(null);
  const surface = useRef(null);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    loadPrintFont();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const root = surface.current.shadowRoot || surface.current.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = parsed.querySelector("style").textContent
      .replace(/\bhtml(?=\s*\{)/g, ":host")
      .replace(/\bbody(?=\s*\{)/g, ".ws-print-document");
    const documentBody = document.createElement("div");
    documentBody.className = "ws-print-document";
    // Only the escaped, script-free local worksheet builder supplies this HTML.
    documentBody.innerHTML = parsed.body.innerHTML;
    root.replaceChildren(style, documentBody);
  }, [html]);
  const scale = width / 794;
  return <div ref={container} className="ws-paper-viewport" style={{ height: `${1123 * scale}px` }}>
    <div ref={surface} className="ws-paper-frame" role="document" aria-label={title} style={{ transform: `scale(${scale})` }} />
  </div>;
}
