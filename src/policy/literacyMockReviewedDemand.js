import { isEligibleLiteracyResponse } from '../utils/literacyEvidence.js';

// Editorial anchors for the visible response operation. Tracking one printed
// letter is below independently encoding a whole word. Navigating connected
// print has a real ceiling below multi-episode inference and extended spelling.
export const LITERACY_MOCK_DEMAND_ANCHORS = Object.freeze({
  sound_awareness: [0, 1, 2, 3, 5, 8],
  phonics: [0, 2, 3, 4, 5, 6, 8],
  print: [0, 1, 2, 4, 6],
  vocabulary: [0, 1, 2, 4, 6, 8],
  listening: [0, 1, 2, 4, 5, 6, 8],
  language: [0, 1, 2, 4, 6, 8],
  reading: [0, 1, 2, 4, 5, 6, 8],
  writing: [0, 1, 3, 4, 6, 8],
});

function responseDirection(row) {
  if ((row.classification && row.classification !== 'independent') || !isEligibleLiteracyResponse(row)) return 0;
  return row.isCorrect ? 1 : -1;
}

function itemAnchor(item) {
  return LITERACY_MOCK_DEMAND_ANCHORS[item.domainId][item.adaptiveAreaBand];
}

// Rounding a held target independently in each area must not feed the rounded
// result back into the next decision. A new independent decision starts from
// the task actually answered, including a task frozen by an earlier presentation.
function referenceRow(rows) {
  let neutral;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row.responseStatus === 'media_failed') continue;
    if (responseDirection(row) !== 0) return neutral || row;
    neutral = row;
  }
  return neutral;
}

const shownItem = (row, byId) => byId.get(row.questionId) || row.itemSnapshot || row.questionSnapshot || row;

export function reviewedLiteracyMockNextBand(rows, byId, nextArea) {
  const reference = referenceRow(rows);
  return reviewedLiteracyMockBand(reference, reference && shownItem(reference, byId), nextArea);
}

export function reviewedLiteracyMockBand(row, item, nextArea) {
  if (!row) return 1;
  const previous = itemAnchor(item);
  const anchors = LITERACY_MOCK_DEMAND_ANCHORS[nextArea];
  const direction = responseDirection(row);
  if (direction > 0) {
    const higher = anchors.findIndex(anchor => anchor > previous);
    return higher < 0 ? anchors.length - 1 : higher;
  }
  if (direction < 0) return Math.max(0, anchors.findLastIndex(anchor => anchor < previous));
  return anchors.reduce((best, anchor, index) =>
    Math.abs(anchor - previous) <= Math.abs(anchors[best] - previous) ? index : best, 0);
}

// Preserve the blueprint order whenever its next skill can meet the demand.
// Sample print before a successful reader outgrows its highest task. On a
// sustained high route, use other scheduled skills for further challenge.
export function reviewedLiteracyMockFuture(future, rows, byId) {
  const answered = rows.filter(row => row.responseStatus !== 'media_failed');
  const reference = referenceRow(answered);
  if (!reference || !future.length) return future;
  const previous = itemAnchor(shownItem(reference, byId));
  const direction = responseDirection(reference);
  const print = LITERACY_MOCK_DEMAND_ANCHORS.print;
  let next = 0;
  if (direction > 0 && previous >= print.at(-2) && previous < print.at(-1)
      && !answered.some(row => shownItem(row, byId).domainId === 'print')) {
    next = future.indexOf('print');
  } else if (direction >= 0 && future[0] === 'print'
      && (direction > 0 ? previous >= print.at(-1) : previous > print.at(-1))) {
    next = future.findIndex(area => area !== 'print');
    if (next < 0 && previous > print.at(-1)) return [];
  }
  if (next <= 0) return future;
  return [future[next], ...future.slice(0, next), ...future.slice(next + 1)];
}
