import { ADVENTURE_MECHANICS } from "./adventureMechanics.jsx";
import { SoundChoiceMechanic } from "./CodeMechanics.jsx";

export function AdventureMechanicRenderer({ round, simplifySoundChoice = false, ...props }) {
  const Mechanic = simplifySoundChoice && round?.mechanicId === "soundGate"
    ? SoundChoiceMechanic
    : ADVENTURE_MECHANICS[round?.mechanicId];
  if (!Mechanic) {
    return (
      <p className="adventure-mechanic-unavailable" role="alert">
        This activity is not available. Return to the trail and choose another station.
      </p>
    );
  }
  return <Mechanic key={round.roundKey || `${round.mechanicId}:${round.id || "round"}`} round={round} {...props} />;
}
