import RacerSession from "../../../../features/soundRacer/RacerSession.jsx";

// Keep the existing GamePlayer entry and ten-track checkpoint contract. The
// game-owned controller, fixed-step simulation and authored scene are separate.
export default function SoundRacerGame(props) {
  return <RacerSession key={`${props.difficulty || "easy"}:${props.startLevel || 0}:${props.progressScopeKey || "default"}`} {...props} />;
}
