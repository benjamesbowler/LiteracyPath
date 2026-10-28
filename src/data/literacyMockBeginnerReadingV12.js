import { getLedaInstructionAudioPath } from './ledaProductionAudio.js';

export const LITERACY_MOCK_BEGINNER_READING_V12_SOURCE = 'src/data/literacyMockBeginnerReadingV12.js';
// New V12 reading targets. V1–V11 publications are immutable. Cross-area word
// exposure remains shared; a new question ID never makes an old word fresh.
// Actual rasters and all proposed responses were inspected on 28 October 2026.
const ROWS = [
  ['run', 'R AH N', '/images/assessment/objective-words/run.webp', 'run cat bed pig', 'run rug rat rib', 'A child runs with a long stride, bent arms and both feet above the ground. Red is excluded because the shirt is red.'],
  ['sit', 'S IH T', '/images/child-mode/short-i/sit.webp', 'sit dog map cup', 'sit sip sun six', 'A child sits on a chair with hands in the lap; no drinking or sun is depicted.'],
  ['hug', 'HH AH G', '/images/assessment/literacy-mock/capacity/foundation-hug.webp', 'hug bed pig cup', 'hug hut hat hen', 'Two children have their arms around each other; no hat, hut or hen appears.'],
  ['dig', 'D IH G', '/images/assessment/literacy-mock/capacity/foundation-dig.webp', 'dig cup pen log', 'dig dog dot dad', 'A child holds a shovel of soil beside a visible hole; this is a child rather than an adult father.'],
  ['cut', 'K AH T', '/images/assessment/literacy-mock/capacity/foundation-cut.webp', 'cut pig log bed', 'cut cat cup cot', 'Hands use scissors to cut a strip of paper; none of the object alternatives is present.'],
  ['hop', 'HH AA P', '/images/child-mode/initial-sounds/hop.webp', 'hop bed cat sun', 'hop hot hat hen', 'A frog is airborne above its shadow with a curved motion trail; no hat or hen appears and nothing suggests heat.'],
  ['sad', 'S AE D', '/media/vocabulary/images/sad.webp', 'sad dog cup pen', 'sad sun sip sum', 'An unhappy child has downturned brows and mouth. Sit and sat are excluded because the child is also sitting; there is no sun, drink or arithmetic.'],
];

export function buildLiteracyMockBeginnerReadingV12(base, normalize) {
  const existing = new Set(base.filter(q => q.adaptiveMixedEligible && q.skillId === 'picture_word_reading').map(q => q.targetWord));
  const prompt = 'Which word matches the picture?';
  const audio = getLedaInstructionAudioPath(prompt);
  if (!audio) throw Error('V12 beginner reading needs its existing exact instruction recording.');
  const result = [];
  for (const [word, phonemes, image, starter, contrast, review] of ROWS) {
    if (existing.has(word)) continue;
    for (const band of [0, 1]) {
      const labels = (band === 0 ? starter : contrast).split(' ');
      const choices = labels.map((label, index) => ({ id: `c${index}`, label }));
      const id = `mock.v12.beginner-reading.${band}.${word}`;
      const constructClaim = band === 0 ? 'read_word_distinct_initials' : 'read_complete_cvc_word';
      const source = {
        id, skillId: 'picture_word_reading', domainId: 'reading', level: band + 1,
        format: 'choice', answerMode: 'exact', answer: 'c0', prompt, passage: '',
        targetWord: word, image, imageAlt: word, choices, renderTargetText: false,
        hideWrittenLabels: false, modality: 'reading', evidenceModality: 'image+print',
        constructClaim, exposureFamilyId: `mock-foundation-word:${word}`,
        canonicalPassageId: word, stimulusKey: `read-picture-word:${word}`,
        requiredAudioCues: [{ role: 'instruction', text: prompt, path: audio, required: true }],
        sourceProvenance: { kind: 'original_literacy_guide_v12_beginner_reading', file: LITERACY_MOCK_BEGINNER_READING_V12_SOURCE, sourceId: id },
        mediaDecision: { role: 'evidence', paths: [image], constructReview: 'approved', answerNeutral: 'approved', reviewType: 'model_visual_review_2026_10_28', reason: review },
        distractorRationales: Object.fromEntries(choices.slice(1).map(c => [c.id, `${c.label} is a different word and does not name the pictured action or condition.`])),
        taskDemand: { reviewed: true, operation: constructClaim,
          features: { phonemeCount: 3, silentPrintedResponses: true, distinctInitials: band === 0, completeWordContrast: band === 1 },
          proof: { targetWord: word, targetPhonemes: phonemes.split(' '), retained: word, rejected: labels.slice(1), targetImage: image } },
        explanation: `${word} is the complete printed word that matches the picture.`,
      };
      const item = { ...normalize(source), routeReservationArea: 'reading', foundationBand: band,
        canonicalPassageId: word, lexicalExposureWords: [word], adaptiveAreaBand: band,
        adaptiveMixedEligible: true };
      result.push({ ...item, itemSnapshot: { ...item } });
    }
    existing.add(word);
  }
  return result;
}
