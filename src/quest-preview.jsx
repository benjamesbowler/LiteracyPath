// Sound Seekers — playable preview (dev only, not in the build).
//
//   npm run dev -- --host      then open the NETWORK url on the iPad
//                              (not localhost — the Chrome extension can't reach it)
//   /quest-preview.html
//
// Query params:
//   ?scope=demo   which save file to use (so you can start fresh without
//                 wiping a real child's progress)
//   ?reset=1      wipe that save and start from the egg
//   ?sound=0      mute
//
// This is the whole Slice 1 loop: creature -> hatch -> Den -> Meadow map ->
// Stop 1 -> Knowledge Tree -> Sound Stones -> Beast Feed -> Stone Bridge ->
// the Gate -> reward -> back to the map, with real save and resume.

import { useState } from "react";
import { createRoot } from "react-dom/client";
import QuestRoot from "./components/quest/QuestRoot.jsx";
import { localProgressStorageKey } from "./utils/progressKeys.js";

const params = new URLSearchParams(window.location.search);
const scope = params.get("scope") || "quest-preview";
const soundEnabled = params.get("sound") !== "0";

if (params.get("reset") === "1") {
  window.localStorage.removeItem(localProgressStorageKey("phonics_quest", scope));
}

function Preview() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100dvh", color: "#fff", fontFamily: "system-ui", gap: 16 }}>
        <p style={{ opacity: 0.7 }}>Closed. Your progress was saved.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ minHeight: 56, padding: "0 28px", borderRadius: 999, border: 0, background: "#ffd166", fontSize: 18, fontWeight: 700, cursor: "pointer" }}
        >
          Open Sound Seekers
        </button>
        <a href={`?scope=${scope}&reset=1`} style={{ color: "#8fd3e8", fontSize: 14 }}>Start over from the egg</a>
      </div>
    );
  }

  return (
    <QuestRoot
      progressScopeKey={scope}
      isSoundEnabled={soundEnabled}
      onExit={() => setOpen(false)}
    />
  );
}

export default Preview;

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<Preview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
