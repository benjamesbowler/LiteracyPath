const readable = carrier => carrier && carrier.alive !== false && !carrier.passed
  && carrier.visible === true && carrier.readable === true;

/** The nearest actually readable word in a lane can be deliberately selected.
 * Word correctness is never consulted here. A default-lane flight position,
 * a boost or an unreadable future carrier cannot arm a language response. */
export function nearestRocketCourier(plan, carriers, lane) {
  return carriers.filter(carrier => readable(carrier) && carrier.lane === lane
    && plan.choices.some(trial => trial.id === carrier.trialId && trial.word === carrier.word))
    .sort((left, right) => Math.abs(left.z) - Math.abs(right.z))[0] || null;
}

export function armRocketIntent(plan, carriers, { lane, trialId = null, source, at }) {
  if (!Number.isFinite(at) || at < 0 || !['keyboard', 'pointer', 'touch', 'assistive'].includes(source)) return null;
  const carrier = trialId ? carriers.find(row => row.trialId === trialId && row.lane === lane && readable(row))
    : nearestRocketCourier(plan, carriers, lane);
  if (!carrier || !plan.choices.some(trial => trial.id === carrier.trialId && trial.word === carrier.word)) return null;
  return { round: plan.round, target: plan.target, trialId: carrier.trialId,
    flightId: carrier.flightId, source, at };
}

/** Ownership follows the exact live carrier and readable window rather than a
 * guessed delay after spawn. Boost/slow flight cannot leave a stale scheduled
 * selection; the same physical carrier must remain visible and actionable. */
export function validRocketIntent(intent, plan, carriers) {
  return Boolean(intent && intent.round === plan.round && intent.target === plan.target
    && carriers.some(carrier => carrier.trialId === intent.trialId && carrier.flightId === intent.flightId && readable(carrier)));
}

/** Only the first real contact with that exact deliberately selected carrier
 * may write a word response. Any contact consumes ownership; an interception
 * or passive catch stays motor-only and cannot become a language mistake. */
export function consumeRocketIntent(intent, plan, carriers, contactedCarrier) {
  return { intent: null, deliberate: validRocketIntent(intent, plan, carriers)
    && contactedCarrier?.trialId === intent.trialId && contactedCarrier.flightId === intent.flightId,
  source: intent?.source || null };
}
