/** A collection receipt starts the notice; only a current, verified report
 * can confirm delivery. Session completion alone never confirms missing data. */
export function literacyMockCollectionNotice(message, { sessionId, classId, snapshot, report, reportState } = {}) {
  if (typeof message === 'string') return message;
  if (message?.kind !== 'collection' || message.sessionId !== sessionId) return '';
  const session = snapshot?.session, mock = session?.mock;
  if (reportState !== 'ready' || session?.id !== sessionId || session?.class_id !== classId
    || report?.session?.id !== sessionId || !message.collectionId || mock?.collection_id !== message.collectionId) {
    return 'Collection requested. Refresh progress to confirm delivery.';
  }
  if (mock.state !== 'completed') return 'Collecting answers. Keep started iPads open and connected until their data is received.';
  if (mock.collection_pending_count !== 0) return 'Assessment finished. Some iPad data is still unconfirmed. Refresh progress to check received answers.';
  const started = report.pupils.filter(pupil => pupil.run);
  if (started.length && started.every(pupil => pupil.run.status === 'completed'
    && Number.isInteger(pupil.planned) && pupil.planned > 0 && pupil.answered === pupil.planned)) {
    return 'All started iPads have delivered their answers. The report is ready.';
  }
  if (!started.length) return 'Collection finished. No started sitting was received.';
  return started.some(pupil => Number.isInteger(pupil.planned) && pupil.planned > 0 && pupil.answered < pupil.planned)
    ? 'Collection finished. The report includes partial sittings and questions not reached.'
    : 'Collection finished. Check the report for received answers and questions not reached.';
}
