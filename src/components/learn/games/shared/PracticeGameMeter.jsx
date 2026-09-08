export function GameMeter({ current, total }) {
  return <div className="lg-game-meter" aria-label={`${current} of ${total}`}>
    <span>{Math.min(current, total)} of {total}</span>
    <div><i style={{ width: `${Math.min(100, current / Math.max(1, total) * 100)}%` }} /></div>
  </div>;
}
