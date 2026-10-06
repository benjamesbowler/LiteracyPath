import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundSafariCue } from '../../src/components/learn/games/games/soundSafariCue.js';
import { phonemeAudioCandidates } from '../../src/data/phonemeAudioBank.js';
import { AUDIO_QUEST_PATHS } from '../../src/data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../src/data/knownBadWordAudio.js';
import { requestSoundSafariWordReplay } from '../../src/components/learn/games/games/soundSafariLearning.js';

const flush = () => new Promise(resolve => setImmediate(resolve));

test('Hear support is saved before play and a new quota hold prevents replay without claiming an audio receipt', () => {
  const supportReasons = {}; let playable = true, played = 0;
  const result = requestSoundSafariWordReplay({ round: { roundId: 'held-word' }, supportReasons,
    canReplay: () => playable, persist: () => { playable = false; }, play: () => { played++; } });
  assert.equal(result, null); assert.equal(played, 0);
  assert.deepEqual(supportReasons, { 'held-word': ['word-audio-replay'] });
  const before = structuredClone(supportReasons);
  assert.equal(requestSoundSafariWordReplay({ round: { roundId: 'another-word' }, supportReasons,
    canReplay: () => false, persist: () => assert.fail('No save during paused/muted/hidden input'), play: () => assert.fail('No playback') }), null);
  assert.deepEqual(supportReasons, before);
});
const round = { roundId: 'actual-round', word: 'shine', audio: '/actual-shine.mp3',
  pictures: ['/literal-shine.webp'], pictureKind: 'meaning-context' };
function fixture() {
  const pictures = [], clips = [];
  const cue = createSoundSafariCue({ getSound: () => true, now: () => 25,
    speakWord: (word, options) => new Promise(resolve => clips.push({ word, options, resolve })),
    makeImage: () => {
      const image = { naturalWidth: 100, naturalHeight: 80, decode: async () => {},
        removeAttribute() { this.src = ''; } };
      pictures.push(image); return image;
    } });
  return { cue, pictures, clips };
}

test('Safari image decode and matching actual clip end provide separate immutable context-picture receipts', async () => {
  const { cue, pictures, clips } = fixture(); cue.setRound(round);
  assert.equal(cue.snapshot().pictureDelivery, 'pending');
  await pictures[0].onload(); await flush();
  const playback = cue.play(); clips[0].options.onEnd('/wrong-file.mp3');
  assert.equal(cue.snapshot().delivery, 'pending');
  clips[0].options.onEnd(round.audio); clips[0].resolve(); await playback;
  const snapshot = cue.snapshot();
  assert.deepEqual(snapshot.deliveryReceipt, { source: round.audio, endedAt: 25 });
  assert.deepEqual(snapshot.pictureReceipt, { source: round.pictures[0], decodedAt: 25 });
  assert.equal(snapshot.pictureKind, 'meaning-context');
  snapshot.deliveryReceipt.source = '/forged'; assert.equal(cue.snapshot().deliveryReceipt.source, round.audio);
  cue.dispose();
});

test('Safari cancellation, stale targets and bare promise resolution cannot claim word delivery', async () => {
  const { cue, clips } = fixture(); cue.setRound(round);
  const first = cue.play(); cue.stop(); clips[0].options.onEnd(round.audio); clips[0].resolve(); await first;
  assert.equal(clips[0].options.signal.aborted, true); assert.equal(cue.snapshot().delivery, 'unavailable');
  const second = cue.play(); clips[1].resolve(); await second;
  assert.equal(cue.snapshot().deliveryReceipt, null);
  cue.dispose();
});

test('Safari failed first picture tries only admitted fallback and late decode after round change or disposal stays unavailable', async () => {
  const { cue, pictures } = fixture(); cue.setRound({ ...round, pictures: ['/failed.webp', '/actual.webp'] });
  pictures[0].onerror(); await flush(); assert.equal(pictures.length, 2);
  await pictures[1].onload(); await flush(); assert.equal(cue.snapshot().pictureReceipt.source, '/actual.webp');
  let settleDecode; cue.setRound(round);
  pictures[2].decode = () => new Promise(resolve => { settleDecode = resolve; });
  const decode = pictures[2].onload(); cue.dispose(); settleDecode(); await decode; await flush();
  assert.equal(cue.picture, null); assert.equal(cue.snapshot().pictureDelivery, 'unavailable');
  assert.equal(pictures[2].src, '');
});

test('Safari teaching mix belongs to the actual current clip and releases on end, failure, pause or disposal', async () => {
  const clips = [], mix = []; let sound = true;
  const cue = createSoundSafariCue({ getSound: () => sound, now: () => 40,
    speakWord: (word, options) => new Promise((resolve, reject) => clips.push({ word, options, resolve, reject })),
    duckMusic: owner => mix.push({ action: 'duck', owner }),
    restoreMusic: owner => mix.push({ action: 'restore', owner }) });
  cue.setRound({ ...round, pictures: [] });
  const first = cue.play(); assert.deepEqual(mix, [], 'A request is not actual teaching playback');
  clips[0].options.onStart(); assert.equal(mix.at(-1).action, 'duck');
  cue.stop(); assert.equal(mix.at(-1).action, 'restore');
  const next = cue.play(); clips[1].options.onStart();
  const currentCount = mix.length;
  clips[0].options.onStart(); clips[0].options.onEnd(round.audio); clips[0].resolve(); await first;
  assert.equal(mix.length, currentCount, 'A late stopped clip cannot release the current teaching mix');
  clips[1].options.onEnd('/unrelated.mp3'); assert.equal(mix.length, currentCount);
  clips[1].options.onEnd(round.audio); clips[1].resolve(); await next;
  assert.equal(mix.at(-1).action, 'restore'); assert.equal(cue.snapshot().delivery, 'delivered');
  const failure = cue.play(); clips[2].options.onStart(); clips[2].reject(Error('missing file')); await failure;
  assert.equal(mix.at(-1).action, 'restore'); assert.equal(cue.snapshot().delivery, 'unavailable');
  const disposed = cue.play(); clips[3].options.onStart(); cue.dispose();
  const disposedCount = mix.length;
  clips[3].options.onStart(); clips[3].resolve(); await disposed;
  assert.equal(mix.length, disposedCount); assert.equal(mix.at(-1).action, 'restore');
  sound = false; await cue.play(); assert.equal(clips.length, 4);
  assert(mix.every(row => row.owner === mix[0].owner), 'A cue owns one isolated mix identity throughout its lifecycle');
});

test('actual caught-sound feedback owns its mix and cannot replace the heard-word receipt', async () => {
  const clips = [], mix = [], source = phonemeAudioCandidates('s').find(source => AUDIO_QUEST_PATHS.has(source) && !isKnownBadAudioPath(source));
  assert(source, 'The actual retained phoneme resolver supplies its source');
  const cue = createSoundSafariCue({ getSound: () => true, now: () => 60,
    speakWord: (value, options) => new Promise(resolve => clips.push({ value, options, resolve })),
    speakPhoneme: (value, options) => new Promise(resolve => clips.push({ value, options, resolve })),
    duckMusic: owner => mix.push({ action: 'duck', owner }), restoreMusic: owner => mix.push({ action: 'restore', owner }) });
  cue.setRound({ ...round, pictures: [] });
  const target = cue.play(); clips[0].options.onStart(); clips[0].options.onEnd(round.audio); clips[0].resolve(); await target;
  const original = cue.snapshot().deliveryReceipt;
  const phoneme = cue.playPhoneme('s'); assert.equal(cue.mixSnapshot().kind, 'phoneme-feedback');
  const beforeStart = mix.length; assert.equal(cue.mixSnapshot().ducked, false);
  clips[1].options.onStart(); assert.equal(mix.length, beforeStart + 1); assert.equal(cue.mixSnapshot().ducked, true);
  clips[1].options.onEnd('/not-the-sound.mp3'); assert.equal(cue.feedbackSnapshot().delivery, 'pending');
  clips[1].options.onEnd(source); assert.equal(cue.mixSnapshot().ducked, false);
  clips[1].options.onStart(); assert.equal(mix.length, beforeStart + 2, 'A terminal clip cannot duck again');
  clips[1].resolve(); assert.equal(await phoneme,true,'The completed feedback request is still current, independently of its receipt');
  assert.deepEqual(cue.feedbackSnapshot().deliveryReceipt, { source, endedAt: 60 });
  assert.deepEqual(cue.snapshot().deliveryReceipt, original, 'Post-response feedback is never a substitute word cue');
  const detached = cue.feedbackSnapshot(); detached.deliveryReceipt.source = '/forged';
  assert.equal(cue.feedbackSnapshot().deliveryReceipt.source, source); cue.dispose();
});

test('stopped phoneme feedback and failed readback release only their current music ownership', async () => {
  const clips = [], mix = []; let sound = true;
  const cue = createSoundSafariCue({ getSound: () => sound,
    speakWord: (value, options) => new Promise((resolve, reject) => clips.push({ value, options, resolve, reject })),
    speakPhoneme: (value, options) => new Promise((resolve, reject) => clips.push({ value, options, resolve, reject })),
    duckMusic: owner => mix.push({ action: 'duck', owner }), restoreMusic: owner => mix.push({ action: 'restore', owner }) });
  cue.setRound({ ...round, pictures: [] });
  const phoneme = cue.playPhoneme('s'); clips[0].options.onStart(); cue.stop();
  assert(clips[0].options.signal.aborted); assert.equal(cue.feedbackSnapshot().delivery, 'unavailable');
  const readback = cue.play(); clips[1].options.onStart(); const currentCount = mix.length;
  clips[0].options.onStart(); clips[0].options.onEnd(phonemeAudioCandidates('s')[0]); clips[0].resolve(); assert.equal(await phoneme,false);
  assert.equal(mix.length, currentCount, 'Late phoneme callbacks cannot unduck a new readback');
  clips[1].reject(Error('actual readback failed')); await readback;
  assert.equal(mix.at(-1).action, 'restore'); assert.equal(cue.snapshot().deliveryReceipt, null);
  sound = false; await cue.playPhoneme('s'); await cue.play(); assert.equal(clips.length, 2);
  cue.dispose();
});

test('muting before an actual end prevents word and caught-sound delivery even before the host stop callback', async () => {
  let sound=true;const clips=[],mix=[];
  const cue=createSoundSafariCue({getSound:()=>sound,
    speakWord:(value,options)=>new Promise(resolve=>clips.push({options,resolve})),
    speakPhoneme:(value,options)=>new Promise(resolve=>clips.push({options,resolve})),
    duckMusic:owner=>mix.push({action:'duck',owner}),restoreMusic:owner=>mix.push({action:'restore',owner})});
  cue.setRound({...round,pictures:[]});
  const target=cue.play();clips[0].options.onStart();sound=false;
  clips[0].options.onEnd(round.audio);clips[0].resolve();await target;
  assert.equal(cue.snapshot().delivery,'unavailable');assert.equal(cue.snapshot().deliveryReceipt,null);
  assert.equal(mix.at(-1).action,'restore');
  sound=true;const feedback=cue.playPhoneme('s');clips[1].options.onStart();sound=false;
  const source=phonemeAudioCandidates('s').find(source=>AUDIO_QUEST_PATHS.has(source)&&!isKnownBadAudioPath(source));
  assert(source);clips[1].options.onEnd(source);clips[1].resolve();await feedback;
  assert.equal(cue.feedbackSnapshot().delivery,'unavailable');assert.equal(cue.feedbackSnapshot().deliveryReceipt,null);
  assert.equal(mix.at(-1).action,'restore');cue.dispose();
});
