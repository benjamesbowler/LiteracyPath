// Dev-only visual harness for the layered My Pal renderer. The real Hollow is
// behind student progress and market state; this makes equipment combinations
// directly addressable for browser QA without changing a child's save.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import "../src/styles/hollow.css";
import { PalFigure } from "../src/components/HollowPage.jsx";

const params = new URLSearchParams(window.location.search);
const companionId = params.get("companion") || "chips";
const companion = {
  id: companionId,
  name: companionId[0].toUpperCase() + companionId.slice(1),
  image: `/images/companions/${companionId}.webp`
};
const equipped = {
  back: params.get("back") || "gear-explorer-pack",
  feet: params.get("feet") || "gear-trail-boots",
  head: params.get("head") || null,
  neck: params.get("neck") || null,
  held: params.get("held") || null
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#dce9dd" }}>
      <div style={{ width: "min(520px, 92vw)", textAlign: "center" }}>
        <PalFigure companion={companion} equipped={equipped} />
        <strong>{Object.values(equipped).filter(Boolean).join(" + ")}</strong>
      </div>
    </main>
  </StrictMode>
);

requestAnimationFrame(() => requestAnimationFrame(() => {
  window.__palReady = true;
  window.__questReady = true;
}));
