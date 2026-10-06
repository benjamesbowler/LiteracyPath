import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from '@babel/parser';
import { createLearningDwell } from '../../src/utils/learningPace.js';

function sourceFunction(path, name) {
  const source = readFileSync(path, 'utf8'), tree = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  function find(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) return node;
    for (const value of Object.values(node)) for (const child of Array.isArray(value) ? value : [value]) { const result = find(child); if (result) return result; }
    return null;
  }
  const node = find(tree); assert.ok(node, `actual production ${name} exists`);
  return source.slice(node.start, node.end);
}
function clock() {
  let time = 0, serial = 0; const tasks = new Map();
  return { now: () => time, schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { fn, at: time + ms }); return id; }, clear: id => tasks.delete(id),
    advance(ms) { const end = time + ms; while (true) { const due = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!due) break; time = due[1].at; tasks.delete(due[0]); due[1].fn(); } time = end; } };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test('Letter Leap Hear replaces the same result voice gate and cannot advance during its late replay', async () => {
  const c = clock(); let advances = 0, originalEnd, replayEnd;
  const owner = createLearningDwell({ ...c, onAdvance: () => advances++ });
  owner.waitFor(new Promise(resolve => { originalEnd = resolve; }));
  const replay = Function('resultDwell', 'canHearTarget', 'cue', 'paused', 'pendingSave', `${sourceFunction('src/components/learn/games/games/LetterLeapGame.jsx', 'speakTarget')}; return speakTarget;`)(owner, () => true, { play: () => new Promise(resolve => { replayEnd = resolve; }) }, false, null);
  c.advance(1400); replay(); originalEnd('superseded'); await flush(); c.advance(4000);
  assert.equal(advances, 0, 'the superseded result voice cannot release the new replay');
  replayEnd('ended'); await flush(); c.advance(499); assert.equal(advances, 0); c.advance(1); assert.equal(advances, 1);
});

test('Spell & Skate instruction replay owns every part through its final word end', async () => {
  const c = clock(); let advances = 0; const clips = [];
  const owner = createLearningDwell({ ...c, onAdvance: () => advances++ });
  const queue = (text,options) => new Promise(resolve => clips.push({text,options,resolve}));
  const host = Function('resultDwell','getSound','levelSpeechParts','speak','speakWord', `
    let running=true,assetsLoading=false,paused=false,levelVoice=null,resultVoice=null,wordReceipt=null,wordDelivery='pending',levelIndex=0;
    const level={audioWord:'cat'},supportReasons=new Set(),pictureDelivery='delivered',activeSimulationSeconds=3;
    const loadWordPicture=()=>{throw new Error('delivered picture must not reload');};
    ${sourceFunction('src/components/learn/games/games/GrammarGrindGame.jsx','speakLevelAloud')};
    return {replay:speakLevelAloud,snapshot:()=>({wordDelivery,wordReceipt,supportReasons:[...supportReasons]})};
  `)(owner,()=>true,()=>['Build the word.','cat'],queue,queue);
  host.replay({replay:true}); c.advance(3000);assert.equal(advances,0);assert.equal(clips[0].text,'Build the word.');
  clips[0].resolve();await flush();assert.equal(clips[1].text,'cat');c.advance(3000);assert.equal(advances,0);
  assert.equal(host.snapshot().wordDelivery,'pending','instruction completion does not deliver the whole word');
  // A new replay owns the dwell. A late whole-word end from its aborted
  // predecessor cannot fabricate delivery or release the new recording.
  host.replay({replay:true});assert.equal(clips[1].options.signal.aborted,true);
  clips[1].options.onEnd('/old-cat.mp3');clips[1].resolve();await flush();c.advance(3000);assert.equal(advances,0);
  assert.equal(host.snapshot().wordReceipt,null);assert.equal(host.snapshot().wordDelivery,'pending');
  assert.equal(clips[2].text,'Build the word.');clips[2].resolve();await flush();assert.equal(clips[3].text,'cat');
  clips[3].options.onEnd('/cat.mp3');clips[3].resolve();await flush();c.advance(499);assert.equal(advances,0);c.advance(1);assert.equal(advances,1);
  const state=host.snapshot();assert.equal(state.wordDelivery,'delivered');assert.equal(state.wordReceipt.source,'/cat.mp3');assert.equal(state.wordReceipt.playTimeMs,3000);
  assert.deepEqual(state.supportReasons,['word-audio-replay']);
});

test('recorded practice replay returns its actual terminal delivery and cannot deadlock on missing media', async () => {
  const c = clock(); let options, stops = 0, cancels = 0;
  const useCue = Function('useState', 'useCallback', 'useEffect', 'hasRecordedSpeech', 'getLedaWordAudioPath', 'getLedaInstructionAudioPath', 'playCueAudio', 'stopCueAudio', 'cancelSpeech', 'setTimeout', 'clearTimeout', `${sourceFunction('src/components/learn/games/shared/useRecordedPracticeCue.js', 'useRecordedPracticeCue')};return useRecordedPracticeCue;`)(() => ['', () => {}], fn => fn, () => {}, () => true, () => '/word.mp3', () => '/instruction.mp3', (_src, value) => { options = value; }, () => { stops++; }, () => { cancels++; }, c.schedule, c.clear);
  const cue = useCue('cat', true, false); let ended = false;
  const voice = cue.replay().then(status => { ended = true; return status; });
  options.onDelivery({ type: 'started' }); await flush(); assert.equal(ended, false);
  options.onDelivery({ type: 'completed' }); assert.equal(await voice, 'completed'); c.advance(30000); assert.equal(stops, 0);
  const missing = cue.replay(); c.advance(20000); assert.equal(await missing, 'unavailable'); assert.equal(stops, 1); assert.equal(cancels, 2);
});
