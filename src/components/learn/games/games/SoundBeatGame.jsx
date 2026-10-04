import { useCallback, useRef } from "react";
import Ps1ArcadeGame from "./Ps1ArcadeGame.jsx";
import './SoundBeatGame.css';

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
    </div>
  );
}
