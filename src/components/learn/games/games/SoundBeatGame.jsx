import { useCallback, useRef } from "react";
import Ps1ArcadeGame from "./Ps1ArcadeGame.jsx";

export default function SoundBeatGame({
  onEngineReady,
  isSoundEnabled = true,
  isMusicEnabled = false,
  ...props
}) {

  const engineRef = useRef(null);

  const handleEngineReady = useCallback(api => {
    engineRef.current = api;
    onEngineReady?.(api);
  }, [onEngineReady]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 0 }}>
      <Ps1ArcadeGame
        kind="sound-beat"
        {...props}
        isSoundEnabled={isSoundEnabled}
        isMusicEnabled={isMusicEnabled}
        onEngineReady={handleEngineReady}
      />
      {isSoundEnabled && (
        <button
          type="button"
          aria-label="Hear the current sound again"
          onPointerDown={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
          onClick={() => engineRef.current?.replayPrompt?.()}
          style={{
            position: "absolute",
            top: 62,
            right: 10,
            zIndex: 2,
            minWidth: 56,
            minHeight: 56,
            border: "2px solid rgba(184,255,61,.72)",
            borderRadius: 12,
            background: "rgba(4,9,20,.9)",
            color: "#eaffc8",
            boxShadow: "0 8px 22px rgba(0,0,0,.38)",
            fontSize: 13,
            fontWeight: 900,
            lineHeight: 1.05,
            cursor: "pointer"
          }}
        >
          Hear<br />sound
        </button>
      )}
    </div>
  );
}
