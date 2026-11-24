import { adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia, sameLiteracyMockPlan, selectLiteracyMockPlan } from '../../utils/literacyMockPlanner.js';
import { projectMockMutation } from '../../utils/literacyMockOutbox.js';
import { scoreLiteracyMockResponse } from '../../data/literacyMockRuntimeContract.js';

export const WHOLE_CLASS_CYCLE_ACTIVITIES = Object.freeze([
  ['pictureSound', 'Sound Safari'], ['letterMatch', 'Letter Friends'],
  ['rhymeMatch', 'Rhyme Picnic'], ['wordBuild', 'Word Workshop'],
  ['soundSort', 'Sound Delivery'], ['letterTrace', 'Rainbow Writing']
]);

// A teacher operates the same test locally. Project answers with the pupil
// device's scoring/evidence rules without writing a learner record.
export function createWholeClassMockSession(bank, { sessionId, studentId = 'whole-class', seed, itemCount, exposures = [], routingPolicy }) {
  let reserve;
  const options = { sessionId, studentId, seed, itemCount, exposures, routingPolicy };
  const plan = selectLiteracyMockPlan(bank, {
    ...options,
    onOfflineItems(ids) {
      const allowed = new Set(ids);
      reserve = bank.filter(item => allowed.has(item.id));
    },
  });
  const byId = new Map(bank.map(item => [item.id, item]));
  const run = { plan, revision: 0, contentVersion: bank[0].contentVersion, responses: [], presentations: [], mediaFailures: [] };
  return { seed: plan.seed, bank, reserve, options, run, byId, rounds: plan.itemIds.map(id => byId.get(id)) };
}

export function submitWholeClassMockAnswer(session, item, answer) {
  if (answer.questionId !== item.id || session.run.plan.itemIds[session.run.responses.length] !== item.id) return session;
  const { options, byId, bank } = session;
  const shown = projectMockMutation(session.run, { type: 'event', event: 'presented', questionId: item.id }, { item });
  const run = projectMockMutation(shown, { expectedRevision: shown.revision, response: answer },
    { item, isCorrect: scoreLiteracyMockResponse(item, answer.selected) });
  let reserve = session.reserve;
  let plan;
  if (answer.responseStatus === 'media_failed') {
    let repair = replaceFailedLiteracyMockMedia(reserve, run.plan, run.responses, run.mediaFailures, run.presentations, options);
    if (repair.unavailable) {
      repair = replaceFailedLiteracyMockMedia(bank, run.plan, run.responses, run.mediaFailures, run.presentations, options);
      if (repair.unavailable) throw new Error('A replacement for this question is unavailable.');
      const allowed = new Set([...reserve.map(value => value.id), ...repair.plan.itemIds]);
      reserve = bank.filter(value => allowed.has(value.id));
    }
    plan = repair.plan;
  } else {
    plan = adaptLiteracyMockPlan(reserve, run.plan, run.responses, run.mediaFailures, run.presentations, options);
  }
  const nextRun = sameLiteracyMockPlan(plan, run.plan) ? run
    : projectMockMutation(run, { expectedRevision: run.revision, plan }, { itemCount: options.itemCount });
  return { ...session, reserve, run: nextRun, rounds: plan.itemIds.map(id => byId.get(id)) };
}
