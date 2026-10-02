import { DRUM_TRAIL_WORDS, DRUM_TRAIL_CONTENT_VERSION } from '../data/drumTrailContent.js';
import { replayShuffle } from './gameReplay.js';

export const DRUM_TRAIL_ROUNDS = 16;
export const DRUM_TRAIL_ROUTE_POSITIONS = Object.freeze([
  { x: 23, y: 49 }, { x: 52, y: 53 }, { x: 82, y: 49 },
]);

// Difficulty changes the oral contrast, never the deadline, hit area or tempo.
export function buildDrumTrailRounds(difficulty = 'easy', sessionSeed = 0, count = DRUM_TRAIL_ROUNDS, journeyIndex = 0) {
  const band = difficulty === 'hard' ? [2, 3, 4] : difficulty === 'medium' ? [1, 2, 3] : [1, 2];
  const seed = `drum:${difficulty}:${sessionSeed}:${journeyIndex}`;
  const pool = replayShuffle(DRUM_TRAIL_WORDS.filter(item => band.includes(item.syllables) && item.image), `${seed}:words`);
  const buckets = new Map(band.map(n => [n, pool.filter(item => item.syllables === n)]));
  // Spread all contrasts through the outing without a predictable answer cycle.
  const deck = [], desired = Math.min(Math.max(1, Number.isFinite(count) ? Math.floor(count) : DRUM_TRAIL_ROUNDS), pool.length);
  while (deck.length < desired) {
    for (const n of replayShuffle(band, `${seed}:band:${deck.length}`)) {
      const item = buckets.get(n).shift();
      if (item && deck.length < desired) deck.push(item);
    }
  }
  return deck.map((item, index) => ({ ...item,
    roundId: `${DRUM_TRAIL_CONTENT_VERSION}:${difficulty}:${sessionSeed}:${journeyIndex}:${index}:${item.id}`,
    routes: replayShuffle(band, `${seed}:routes:${index}`).map((drums, routeIndex) => ({
      id: `route-${routeIndex}`, drums,
      ...DRUM_TRAIL_ROUTE_POSITIONS[band.length === 2 ? routeIndex * 2 : routeIndex],
    })) }));
}

export function newDrumTrailEvidence() { return { firstResponses: [], assistedRetries: [], completions: [] }; }

// Freeze delivery/support at the RESPONSE, never retrospectively at clip end.
// Rhythm, actor motion and elapsed time are deliberately absent from scoring.
export function commitDrumTrailAnswer(evidence, round, drums, context = {}) {
  const correct = drums === round.syllables;
  const first = !evidence.firstResponses.some(row => row.roundId === round.roundId);
  const response = { roundId: round.roundId, itemId: round.id, word: round.word,
    construct: context.wordVisible ? 'multimodal-whole-word-syllable-count' : round.construct,
    presentationVersion: context.wordVisible ? 2 : 1,
    wordVisible: Boolean(context.wordVisible), pictureDelivery: context.pictureDelivery || 'not_recorded',
    expected: round.syllables, selected: drums, correct,
    stimulusDelivered: context.delivery === 'delivered', deliveryAtResponse: context.delivery || 'pending',
    supportReasons: [...new Set(context.supportReasons || [])], modelUsed: Boolean(context.modelUsed),
    independentOralPractice: !context.wordVisible && context.delivery === 'delivered' && !(context.supportReasons?.length) && !context.modelUsed && first,
    practiceOnly: true };
  const result = { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, response] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, { ...response, independentOralPractice: false }].slice(-DRUM_TRAIL_ROUNDS * 6),
    retryCount: (evidence.retryCount || 0) + (first ? 0 : 1),
    completions: correct && !evidence.completions.includes(round.roundId) ? [...evidence.completions, round.roundId] : evidence.completions };
  return { evidence: result, response, first, correct, awarded: correct && !evidence.completions.includes(round.roundId) ? 10 : 0 };
}

export function drumTrailFeedback(round, selected, { correct, modelUsed } = {}) {
  if (correct) return `${round.word}: ${round.syllables} ${round.syllables === 1 ? 'part' : 'parts'}. Bouncy can cross!`;
  if (modelUsed) return `${round.parts.join(' · ')} — ${round.syllables} parts. Try that drum path.`;
  return `You chose ${selected} ${selected === 1 ? 'drum' : 'drums'}. Hear the whole word again; count its parts.`;
}

// A deterministic fixed-step scene. Route choice, rather than a separate Check
// button, is the action that sends Bouncy into the crossing. No speed evidence.
export function drumTrailActor(route, progress = 0, correct = true, reducedMotion = false) {
  const bounded = Math.max(0, Math.min(1, progress));
  const t = reducedMotion ? (bounded >= 1 ? 1 : 0) : bounded;
  const travel = correct ? t : Math.sin(t * Math.PI) * 0.45;
  // Same quadratic walkway coordinates as the SVG, then step onto the grass
  // behind the entrance. The actor never covers the selectable drum group.
  const u = Math.min(1, travel / .82), inverse = 1 - u;
  const x = inverse * inverse * 10 + 2 * inverse * u * route.x * .7 + u * u * route.x;
  const entranceY = route.y + 24 / 563 * 100;
  let y = inverse * inverse * 85 + 2 * inverse * u * (460 / 563 * 100) + u * u * entranceY;
  if (travel > .82) y = entranceY + ((travel - .82) / .18) * (route.y - 8 - entranceY);
  const hop = reducedMotion ? 0 : Math.abs(Math.sin(travel * Math.PI * (route.drums + 1))) * 3.5;
  return { x, y: y - hop, frame: reducedMotion ? 0 : Math.floor(t * 12) % 4,
    facing: !correct && t > 0.5 ? -1 : 1, landed: bounded >= 1 };
}
