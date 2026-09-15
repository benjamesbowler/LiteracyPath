import React, { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import SoundSeekersRoute from "../../src/features/soundSeekers/SoundSeekersRoute.jsx";

function RouteIsolationHarness() {
  const [mounted, setMounted] = useState(false);
  const [scopeKey, setScopeKey] = useState("route-isolation-a");

  useEffect(() => {
    const opener = document.getElementById("route-opener");
    const openRoute = () => setMounted(true);
    opener.addEventListener("click", openRoute);
    window.__setSoundSeekersRouteScope = setScopeKey;
    window.__unmountSoundSeekersRoute = () => setMounted(false);
    document.documentElement.dataset.routeHarnessReady = "true";

    return () => {
      opener.removeEventListener("click", openRoute);
      delete window.__setSoundSeekersRouteScope;
      delete window.__unmountSoundSeekersRoute;
      delete document.documentElement.dataset.routeHarnessReady;
    };
  }, []);

  return mounted ? (
    <SoundSeekersRoute
      progressScopeKey={scopeKey}
      isSoundEnabled={false}
      onExit={() => setMounted(false)}
      accessibilitySettings={{ reducedMotion: true }}
    />
  ) : <><p data-route-closed="">Sound Seekers is closed.</p><label>Learner <select value={scopeKey} onChange={event => setScopeKey(event.target.value)}><option value="route-isolation-a">Learner A</option><option value="route-isolation-b">Learner B</option></select></label></>;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouteIsolationHarness />
  </StrictMode>
);
