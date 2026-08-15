export function MisconceptionDetectivePanel({ signals = [], state = "ready", onOpenStudent }) {
  return (
    <section className="misconception-detective" aria-labelledby="misconception-detective-title">
      <header>
        <div>
          <p className="panel-label">Misconception Detective</p>
          <h2 id="misconception-detective-title">Repeated wrong-answer patterns</h2>
          <p>These are teaching hypotheses from repeated saved answers—not diagnoses and never a reason to demote a skill by themselves.</p>
        </div>
      </header>
      {state === "loading" ? <p role="status">Checking repeated answer patterns…</p>
        : state === "error" ? <p role="alert">The full answer history could not be checked, so no pattern claim is shown.</p>
          : signals.length === 0 ? <p>No repeated pattern is strong enough to show yet.</p>
            : <ul>{signals.slice(0, 6).map(signal => <li key={`${signal.studentId}:${signal.target}:${signal.chosen}`}>
              <div>
                <strong>{signal.studentName}</strong>
                <span>{signal.target.replaceAll("_", " ")}</span>
              </div>
              <p>Chose <b>{signal.chosen}</b> instead of <b>{signal.correct}</b> {signal.occurrences} times across {signal.distinctDays} day{signal.distinctDays === 1 ? "" : "s"}.</p>
              <p><strong>Worth checking:</strong> {signal.hypothesis}.</p>
              <p><strong>Try next:</strong> {signal.teachingMove}</p>
              <button className="lp-button lp-button-secondary" type="button" onClick={() => onOpenStudent?.(signal.studentId, signal.studentName)}>Open student</button>
            </li>)}</ul>}
    </section>
  );
}
