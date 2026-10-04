import { getChildWordAsset } from '../data/childAssets.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { hasKnownBadWordAudio } from '../data/knownBadWordAudio.js';
import { replayShuffle, gameRandom } from './gameReplay.js';

import { RALLY_PALS_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
export { RALLY_PALS_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
export const RALLY_PALS_POINTS = 6;
export const RALLY_PALS_SIMULATION_STEP = 1 / 60;
const MAX_CATCHUP_STEPS = 12;
// A stalled tab can never enqueue seconds of delayed movement after it wakes.
export function consumeRallyPalsFrame(remainder, elapsed, { active = true } = {}) {
  if (!active) return { steps: 0, remainder: 0 };
  const available = Math.min(RALLY_PALS_SIMULATION_STEP * MAX_CATCHUP_STEPS,
    Math.max(0, Number(remainder) || 0) + Math.max(0, Number(elapsed) || 0));
  const steps = Math.floor((available + 1e-10) / RALLY_PALS_SIMULATION_STEP);
  return { steps, remainder: Math.max(0, available - steps * RALLY_PALS_SIMULATION_STEP) };
}
// Measured original-alpha atlas frames. Each court owns its texture instances.
export const RALLY_PALS_WORLD_ART = Object.freeze({
  meadow:{width:1672,height:941,horizonFoot:734,frames:{tree:[145,0,578,580],club:[884,22,744,514],flowers:[16,592,820,309],crowd:[836,536,835,395]}},
  dino:{width:1536,height:1024,horizonFoot:886,frames:{tree:[0,0,751,600],club:[751,0,785,561],flowers:[0,600,750,388],crowd:[747,558,781,444]}},
  moonwood:{width:1536,height:1024,horizonFoot:814,frames:{tree:[122,0,596,670],club:[775,26,749,590],flowers:[36,670,735,334],crowd:[775,616,748,398]}},
});
export const RALLY_PALS_COURTS = Object.freeze([
  { id: 'meadow', label: 'Meadow Court', court: 0x3f8b73, surround: 0x83ac5e, sky: 0x92d0ed, accent: 0xedb65c },
  { id: 'rooftop', label: 'Rooftop Court', court: 0xbb705b, surround: 0xd6b080, sky: 0xcfe3f4, accent: 0xe1b259 },
  { id: 'moonwood', label: 'Moonlit Court', court: 0x7082a8, surround: 0x777d9f, sky: 0x273f68, accent: 0xffd48b },
]);
// Authored sound contrasts, rather than spelling-derived pseudo phonemes.
const BANKS = {
  easy: [
    ['fish', 'f', ['f','s','v']], ['sun','s',['s','f','m']], ['map','m',['m','n','s']],
    ['dog','d',['d','t','g']], ['pig','p',['p','b','t']], ['net','n',['n','m','t']],
    ['cat','c',['c','t','s']], ['hat','h',['h','f','m']], ['bus','b',['b','p','d']],
    ['cup','c',['c','p','t']], ['goat','g',['g','d','c']], ['leaf','l',['l','r','n']],
  ],
  medium: [
    ['fish','sh',['sh','ch','th']], ['sock','ck',['ck','sh','ng']], ['duck','ck',['ck','ch','th']],
    ['ship','p',['p','t','n']], ['cat','t',['t','p','n']], ['dog','g',['g','d','k']],
    ['sun','n',['n','m','t']], ['cup','p',['p','b','t']], ['ring','ng',['ng','sh','ch']],
    ['bench','ch',['ch','sh','th']], ['brush','sh',['sh','ch','th']], ['map','p',['p','t','n']],
  ],
  hard: [
    ['fish','-ish',['-ish','-ash','-ush']], ['sock','-ock',['-ock','-ack','-ick']],
    ['ring','-ing',['-ing','-ang','-ong']], ['cat','-at',['-at','-et','-ot']],
    ['dog','-og',['-og','-ag','-ig']], ['sun','-un',['-un','-an','-in']],
    ['ship','-ip',['-ip','-ap','-op']], ['duck','-uck',['-uck','-ick','-ack']],
    ['bed','-ed',['-ed','-ad','-id']], ['net','-et',['-et','-at','-it']],
    ['pig','-ig',['-ig','-ag','-ug']], ['cup','-up',['-up','-ap','-ip']],
  ],
};

export function buildRallyPalsRounds(difficulty = 'easy', seed = 0, journeyIndex = 0) {
  const level = Object.hasOwn(BANKS, difficulty) ? difficulty : 'easy';
  const key = `${RALLY_PALS_CONTENT_VERSION}:${level}:${seed}:${journeyIndex}`;
  return replayShuffle(BANKS[level], `${key}:words`).slice(0, RALLY_PALS_POINTS).map(([word, expected, choices], index) => {
    const asset = getChildWordAsset(word);
    return { id: `rally-${word}`, roundId: `${key}:${index}:${word}`, word, expected,
      image: asset?.image || '', audio: hasKnownBadWordAudio(word) ? '' : getLedaWordAudioPath(word),
      construct: level === 'easy' ? 'initial-phoneme-grapheme' : level === 'medium' ? 'final-phoneme-grapheme' : 'spoken-rime-reading',
      cue: level === 'easy' ? 'Aim at the first sound.' : level === 'medium' ? 'Aim at the last sound.' : 'Aim at the ending family.',
      choices: replayShuffle(choices, `${key}:lanes:${index}`),
      // Styles and reach do not depend on the expected choice.
      opponentStyle: gameRandom(`${key}:opponent:${index}`)() < .5 ? 'rally' : 'lob',
      returnsGoal: 3 + (journeyIndex % 3),
    };
  });
}

export function newRallyPalsEvidence() { return { firstResponses: [], assistedRetries: [], completions: [] }; }

export function commitRallyPalsAim(evidence, round, selected, context = {}) {
  if (!round.choices.includes(selected) || evidence.completions.includes(round.roundId)) return { evidence, correct: false, awarded: 0, ignored: true };
  const correct = selected === round.expected;
  const first = !evidence.firstResponses.some(row => row.roundId === round.roundId);
  const supportReasons = [...new Set(context.supportReasons || [])];
  if (context.delivery !== 'delivered') supportReasons.push(context.delivery === 'pending' ? 'answered-before-audio-ended' : 'audio-unavailable');
  if (context.pictureDelivery !== 'delivered') supportReasons.push('picture-unavailable');
  const row = { roundId: round.roundId, itemId: round.id, word: round.word,
    expected: round.expected, selected, correct, construct: context.visualModel ? 'supported-visual-grapheme-matching' : round.construct,
    deliveryAtResponse: context.delivery || 'pending', stimulusDelivered: context.delivery === 'delivered',
    pictureDelivery: context.pictureDelivery || 'pending', wordVisible: false, motorAssist: Boolean(context.motorAssist), visualModel: Boolean(context.visualModel),
    supportReasons: [...new Set(supportReasons)], practiceOnly: true,
    independentPractice: first && context.delivery === 'delivered' && context.pictureDelivery === 'delivered' && !supportReasons.length && !context.visualModel,
  };
  return { correct, first, awarded: correct ? 10 : 0, response: row,
    evidence: { ...evidence,
      firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
      assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, { ...row, independentPractice: false }].slice(-RALLY_PALS_POINTS * 12),
      completions: correct ? [...evidence.completions, round.roundId] : evidence.completions,
    } };
}

export function rallyLaneX(lane) { return (Math.min(2, Math.max(0, lane)) - 1) * 3.15; }
export function rallyContactWindow(ball, player, assisted = false) {
  return ball.direction === 'near' && Math.abs(ball.z - player.z) < (assisted ? 1.65 : 1.15)
    && Math.abs(ball.x - player.x) < (assisted ? 2.6 : 1.45) && ball.y < (assisted ? 3.2 : 2.6);
}

export function rallyShot(from, to, { lob = false, soft = false, startHeight = 1.35 } = {}) {
  const heightAtContact = Number.isFinite(startHeight) ? Math.max(.32, startHeight) : 1.35;
  return { from: { ...from }, to: { ...to }, x: from.x, z: from.z, y: heightAtContact, startHeight: heightAtContact,
    time: 0, duration: soft ? 1.6 : lob ? 2.1 : 1.5,
    height: soft ? 2.8 : lob ? 6 : 3.2, direction: to.z < from.z ? 'far' : 'near', lob, soft };
}
export function stepRallyShot(ball, seconds) {
  const time = Math.min(ball.duration, ball.time + Math.max(0, seconds));
  const t = time / ball.duration;
  return { ...ball, time, x: ball.from.x + (ball.to.x - ball.from.x) * t,
    z: ball.from.z + (ball.to.z - ball.from.z) * t,
    y: .32 + ((ball.startHeight ?? 1.35) - .32) * (1 - t) + Math.sin(Math.PI * t) * ball.height,
    landed: t >= 1 };
}
export function chooseOpponentReturn(seed, pointIndex, rallyCount) {
  const random = gameRandom(`rally-return:${seed}:${pointIndex}:${rallyCount}`);
  return { x: -3.4 + random() * 6.8, z: 7.3 + random() * 1.0 };
}
