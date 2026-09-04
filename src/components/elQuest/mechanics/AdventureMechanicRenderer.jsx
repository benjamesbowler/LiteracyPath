import { ADVENTURE_MECHANICS } from "./adventureMechanics.jsx";

export function AdventureMechanicRenderer({ round, ...props }) {
  const Mechanic = ADVENTURE_MECHANICS[round?.mechanicId];
  if (!Mechanic) {
    return (
      <p className="adventure-mechanic-unavailable" role="alert">
        This activity is not available. Return to the trail and choose another station.
      </p>
    );
  }
  return <Mechanic key={round.roundKey || `${round.mechanicId}:${round.id || "round"}`} round={round} {...props} />;
}
