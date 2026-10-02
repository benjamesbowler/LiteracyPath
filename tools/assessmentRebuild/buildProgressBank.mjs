import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import wordContrasts from './authoring/progress/wordContrasts.mjs';
import wordMeaning from './authoring/progress/wordMeaning.mjs';
import readingDetails from './authoring/progress/readingDetails.mjs';
import listeningDetails from './authoring/progress/listeningDetails.mjs';
import { PROGRESS_TRACKS } from './authoring/progress/tracks.mjs';
import { getLedaInstructionAudioPath, getLedaProductionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { RATIONALE_CODES, skeleton, shingles, jaccard, loadLexicon, mediaDecisionContractIssues } from './lib.mjs';
import { questions as publishedSentences } from '../../src/data/v3/banks/sentence_comprehension.v3.generated.js';
import { questions as publishedDetails } from '../../src/data/v3/banks/key_details.v3.generated.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const PROGRESS_BANK_PATH = path.join(ROOT, 'src/content/assessments/v3/progressBank.generated.js');
const normalize = value => String(value || '').toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
const digest = value => createHash('sha256').update(value).digest('hex');
const exists = value => Boolean(value) && value.startsWith('/') && !value.includes('..') && fs.existsSync(path.join(ROOT, 'public', value.slice(1)));
const approvedWordRecording = text => ({ text, path: getLedaWordAudioPath(text), required: true, provenance: 'existing_approved_leda_word_recording' });

export function expandProgressItems(sources = [...wordContrasts, ...wordMeaning, ...listeningDetails, ...readingDetails]) {
  return sources.map((source, index) => {
    const track = PROGRESS_TRACKS.find(candidate => candidate.id === source.trackId);
    if (!track) throw new Error(`Unknown progress track ${source.trackId}`);
    const id = `lpp.${source.trackId}.t${source.tier}.${source.sourceKey}`;
    const hidden = track.modality === 'audio' && ['hear_sounds', 'word_meaning'].includes(track.id);
    const rotated = source.options.map((_, i) => source.options[(i + index % source.options.length) % source.options.length]);
    const choices = rotated.map((choice, i) => ({
      id: `${id}.choice${i + 1}`, label: choice.text, rationale: choice.rationale,
      ...(hidden ? { audioText: choice.text } : {}),
      ...(track.allowsChoiceAudio ? { audio: hidden ? approvedWordRecording(choice.text) : { text: choice.text, path: /^[a-z'-]+$/i.test(choice.text) ? getLedaWordAudioPath(choice.text) : '', required: false, fallback: 'speech_access' } } : {})
    }));
    const keyIndex = rotated.findIndex(choice => choice.key);
    const family = `progress:${track.id}:${digest(normalize(source.passage || source.target)).slice(0, 20)}`;
    const publicFamily = source.sourceReuse ? `passage:${digest(normalize(source.passage)).slice(0, 20)}` : null;
    const audio = {
      instruction: { text: source.prompt, path: getLedaInstructionAudioPath(source.prompt), required: false, fallback: 'speech_access' },
      ...(source.target ? { target: approvedWordRecording(source.target) } : {}),
      ...(track.id === 'listening_stories' ? { passage: { text: source.passage, path: getLedaProductionAudioPath(source.passage, ['assessment_passage']), required: true, provenance: 'existing_approved_leda_passage_recording' } } : {}),
      ...(track.allowsChoiceAudio ? { choices: choices.map(choice => ({ choiceId: choice.id, ...choice.audio })) } : {})
    };
    const requiredSources = [
      ...Object.entries(audio).filter(([role, recording]) => role !== 'choices' && recording.required).map(([role, recording]) => ({ kind: 'audio', role, path: recording.path, text: recording.text })),
      ...(audio.choices || []).filter(recording => recording.required).map(recording => ({ kind: 'audio', role: `choice:${recording.choiceId}`, path: recording.path, text: recording.text }))
    ];
    return {
      id, instrument: 'adaptive_progress', reservedPurpose: 'progress_test', contentStandardVersion: 3,
      trackId: track.id, reportStrandId: track.reportStrandId, construct: track.construct, modality: track.modality,
      difficultyTier: source.tier, difficultyVersion: track.difficultyVersion, difficultyRationale: track.tierRationales[source.tier],
      stimulusFamilyId: family, enemyItemGroups: [family, ...(publicFamily ? [publicFamily, source.sourceItemId] : [])],
      formatType: track.formatType, prompt: source.prompt, choices, answer: choices[keyIndex]?.id,
      ...(source.target ? { targetWord: source.target } : {}),
      ...(source.passage ? { passage: source.passage } : {}),
      displayPassageDuringResponse: track.id === 'reading_stories', hideWrittenLabels: hidden,
      suppressStimulusAudio: track.id === 'reading_stories', allowsChoiceAudio: track.allowsChoiceAudio,
      media: { requiredSources, decision: { itemId: id, role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'not-applicable-no-pictures', rationale: source.note } },
      audio,
      exposure: {
        itemStatus: 'reserved_original_question', priorExposureStatus: 'unknown', sourceReuse: source.sourceReuse || (source.target ? 'existing_approved_words_and_recordings' : 'none'),
        ...(source.sourceReuse ? { sourceItemId: source.sourceItemId, publicStimulusFamilyId: publicFamily, limitation: 'The question is original; its recorded passage was previously public. Prior passage familiarity is unknown unless learner exposure records establish it.' } : { limitation: source.target ? 'Word learning is expected. Prior exact contrast exposure is unknown until learner exposure records are checked.' : 'New reserved text; learner exposure must still be checked at family level.' })
      },
      editorial: { note: source.note, keyReview: 'one-explicit-key', originality: source.sourceReuse ? 'original_question_reused_disclosed_stimulus' : 'original_reserved_content' },
      retentionOnly: false, nonGating: false
    };
  });
}

export function validateProgressBank(items) {
  const errors = [];
  const ids = new Set();
  const fingerprints = new Set();
  const optionSignatures = new Map();
  const { knownWords } = loadLexicon();
  const publishedSources = new Map([...publishedSentences, ...publishedDetails].map(item => [item.id, item]));
  const fail = (item, message) => errors.push({ itemId: item.id, message });
  for (const item of items) {
    if (!item.id || ids.has(item.id)) fail(item, 'Missing or duplicate stable item ID');
    ids.add(item.id);
    const track = PROGRESS_TRACKS.find(candidate => candidate.id === item.trackId);
    if (!track || item.construct !== track.construct || item.modality !== track.modality) fail(item, 'Track construct/modality mismatch');
    if (!Number.isInteger(item.difficultyTier) || item.difficultyTier < 0 || item.difficultyTier > 2 || !item.difficultyRationale) fail(item, 'Invalid ordinal difficulty metadata');
    if (item.instrument !== 'adaptive_progress' || item.reservedPurpose !== 'progress_test' || item.retentionOnly) fail(item, 'Content is not an original reserved progress item');
    if (item.choices.length !== 3 || new Set(item.choices.map(choice => normalize(choice.label))).size !== 3 || !item.choices.some(choice => choice.id === item.answer)) fail(item, 'Exactly three distinct choices with one authored key are required');
    if (item.choices.some(choice => !RATIONALE_CODES.has(choice.rationale) || (choice.id === item.answer) !== (choice.rationale === 'KEY'))) fail(item, 'Key/rationale contract mismatch');
    if (item.trackId === 'printed_words' && item.choices.some(choice => !knownWords.has(normalize(choice.label)))) fail(item, 'Printed phonics choices must be approved real words');
    if (!item.stimulusFamilyId || !item.enemyItemGroups?.includes(item.stimulusFamilyId) || !item.exposure?.priorExposureStatus) fail(item, 'Missing family, enemies or exposure policy');
    for (const issue of mediaDecisionContractIssues(item, item.media?.decision, [])) fail(item, issue);
    const fingerprint = [item.trackId, normalize(item.prompt), normalize(item.passage || item.targetWord), item.choices.map(choice => normalize(choice.label)).sort().join('|')].join('::');
    if (fingerprints.has(fingerprint)) fail(item, 'Duplicate prompt/stimulus/options');
    fingerprints.add(fingerprint);
    const optionSignature = item.choices.map(choice => normalize(choice.label)).sort().join('|');
    if (['word_meaning','reading_stories','listening_stories'].includes(item.trackId)) {
      const prior = optionSignatures.get(`${item.trackId}|${optionSignature}`);
      if (prior) fail(item, `Open-set option set repeated from ${prior}`);
      optionSignatures.set(`${item.trackId}|${optionSignature}`, item.id);
    }
    for (const source of item.media?.requiredSources || []) {
      if (!exists(source.path) || !source.text) fail(item, `Missing exact approved required ${source.role} recording: ${source.text}`);
      if (exists(source.path) && fs.statSync(path.join(ROOT, "public", source.path.replace(/^\//, ""))).size > 350 * 1024) fail(item, `Required ${source.role} recording exceeds the 350KB media budget: ${source.path}`);
      const expected = source.role === 'passage' ? getLedaProductionAudioPath(source.text, ['assessment_passage']) : getLedaWordAudioPath(source.text);
      if (!expected || source.path !== expected) fail(item, `Required recording does not match its authored ${source.role} text`);
    }
    if (item.targetWord && item.audio?.target?.text !== item.targetWord) fail(item, 'Target replay must contain only the authored target');
    if (!item.allowsChoiceAudio && (item.audio?.choices || item.choices.some(choice => choice.audio))) fail(item, 'Printed recognition options must not be narrated');
    if (['hear_sounds','word_meaning'].includes(item.trackId) && (!item.hideWrittenLabels || item.audio?.choices?.length !== 3 || item.audio.choices.some(choice => !choice.required))) fail(item, 'Spoken comparisons require hidden print and complete exact choice recordings');
    if (item.trackId === 'reading_stories' && (item.audio?.passage || !item.displayPassageDuringResponse || !item.suppressStimulusAudio)) fail(item, 'Independent reading passage may not be spoken');
    if (item.trackId === 'listening_stories' && (!item.audio?.passage?.required || item.displayPassageDuringResponse || !item.exposure.publicStimulusFamilyId || !item.exposure.limitation)) fail(item, 'Listening requires recorded passage and an honest public-family familiarity limit');
    if (item.trackId === 'listening_stories') {
      const original = publishedSources.get(item.exposure?.sourceItemId);
      if (!original || original.retentionOnly || original.passage !== item.passage || original.prompt === item.prompt) fail(item, 'Listening source must be a published ordinary passage with a genuinely new question; retention reserves are forbidden');
    }
    if (!item.prompt || item.prompt.split(/\s+/).length > 16 || /\b(not|except)\b/i.test(item.prompt)) fail(item, 'Prompt is missing, too long or negatively worded');
  }
  const readings = items.filter(item => item.trackId === 'reading_stories');
  for (let i = 0; i < readings.length; i++) for (let j = i + 1; j < readings.length; j++) {
    const left = readings[i], right = readings[j];
    if (skeleton(left.passage) === skeleton(right.passage) || (left.passage.split(/\s+/).length >= 20 && right.passage.split(/\s+/).length >= 20 && jaccard(shingles(left.passage), shingles(right.passage)) >= .35)) fail(right, `Story skeleton duplicates ${left.id}`);
  }
  return errors;
}

export function progressStockReadiness(items, minimumFamiliesPerTier = 32) {
  const tracks = PROGRESS_TRACKS.map(track => {
    const counts = [0,1,2].map(tier => new Set(items.filter(item => item.trackId === track.id && item.difficultyTier === tier).map(item => item.stimulusFamilyId)).size);
    return { trackId: track.id, familyCountsByTier: counts, minimumFamiliesPerTier, ready: counts.every(count => count >= minimumFamiliesPerTier), formats: [...new Set(items.filter(item => item.trackId === track.id).map(item => item.formatType))], formatRationale: 'One response mechanic preserves this declared single construct; no alternate mechanic is invented for a format quota.' };
  });
  return { ready: tracks.every(track => track.ready), tracks, caveats: ['Ordinal demand only; no calibrated scale.', 'Listening questions reuse public recorded passages; unknown prior familiarity is disclosed and known exposure excludes those families.', 'Branch feasibility also requires the runtime frozen-policy route simulation and exposure/media exclusions; raw stock counts are not proof of a completed route.'] };
}

export function buildProgressBank() {
  const items = expandProgressItems();
  const errors = validateProgressBank(items);
  return { bank: { version: `progress-2026-10-02.1-${digest(JSON.stringify(items)).slice(0,12)}`, difficultyVersion: 'progress-ordinal-2026-10-02.1', instrument: 'adaptive_progress', tracks: PROGRESS_TRACKS, items, readiness: progressStockReadiness(items) }, errors };
}

export function generatedProgressBankSource(bank) {
  return `// GENERATED by tools/assessmentRebuild/buildProgressBank.mjs. Edit authoring/progress sources only.\nexport const PROGRESS_BANK = ${JSON.stringify(bank, null, 2)};\nexport const progressBank = PROGRESS_BANK;\nexport default PROGRESS_BANK;\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { bank, errors } = buildProgressBank();
  const source = generatedProgressBankSource(bank);
  if (errors.length) {
    console.error(JSON.stringify({ ready: false, errorCount: errors.length, errors }, null, 2));
    process.exitCode = 1;
  } else if (!bank.readiness.ready) {
    console.error(JSON.stringify(bank.readiness, null, 2));
    process.exitCode = 1;
  } else if (process.argv.includes('--write')) {
    fs.writeFileSync(PROGRESS_BANK_PATH, source);
    console.log(JSON.stringify({ ready: true, items: bank.items.length, familyCounts: bank.readiness.tracks.map(track => [track.trackId, track.familyCountsByTier]), version: bank.version }));
  } else if (!fs.existsSync(PROGRESS_BANK_PATH) || fs.readFileSync(PROGRESS_BANK_PATH, 'utf8') !== source) {
    console.error('Progress bank generated view is stale; regenerate through buildProgressBank.mjs --write.');
    process.exitCode = 1;
  } else console.log(JSON.stringify({ ready: true, items: bank.items.length, version: bank.version }));
}
