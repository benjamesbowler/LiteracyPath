/** Build one durable accepted-answer envelope before advancing its scene.
 * A receipt identifies the learning action, not the rendered button or timer.
 * Failed persistence leaves the caller's counters and evidence untouched. */
export function phonicsAcceptance(current, round, snapshot, credit) {
  if (!current || !credit?.id || !Number.isFinite(credit.score) || credit.score < 0) return null;
  const receipts = current.acceptedReceipts || [];
  if (receipts.includes(credit.id)) return { state: current, applied: false };
  const correct = credit.correct ?? current.correct;
  if (!Number.isInteger(correct) || correct < current.correct) return null;
  const evidence = current.evidence || { firstResponses: [], assistedRetries: [] };
  const assisted = credit.assisted ? {
    ...credit.assisted, practiceOnly: true, independent: false, audioDelivery: "not_measured",
    supportUsed: [...(credit.assisted.supportUsed || [])]
  } : null;
  const hasAssisted = assisted?.learningEpisode?.id && evidence.assistedRetries.some(row => row.learningEpisode?.id === assisted.learningEpisode.id);
  const discoveries = credit.discovery && !current.discoveries.some(item => item.id === credit.discovery.id)
    ? [...current.discoveries, credit.discovery] : current.discoveries;
  return { applied: true, state: {
    ...current, round, stage: { round, data: snapshot },
    score: current.score + credit.score + Math.min(10, current.streak * 2),
    streak: current.streak + 1, correct, discoveries,
    evidence: { ...evidence, assistedRetries: assisted && !hasAssisted ? [...evidence.assistedRetries, assisted] : evidence.assistedRetries },
    modelNext: credit.modelNext ?? current.modelNext,
    acceptedReceipts: [...receipts, credit.id]
  } };
}
