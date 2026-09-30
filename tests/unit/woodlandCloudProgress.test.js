import assert from 'node:assert/strict';
import test from 'node:test';
import { freshChapter, judgeChoice, currentRound, restartChapter } from '../../demos/sound-seekers/src/chapter/progress.js';
import { encodeWoodlandProgress, decodeWoodlandProgress, mergeWoodlandProgress, woodlandParticipation } from '../../src/features/soundSeekers/woodlandProgress.js';
import { mergeProgressQueueEntries } from '../../src/utils/progressQueue.js';

test('a fresh device resumes a woodland partial word using the original seeded deck', () => {
  let chapter = freshChapter(73);
  chapter.active = 'brook'; chapter.jobs.brook.act = 1;
  while (currentRound(chapter).kind !== 'build') chapter.jobs.brook.round++;
  const round = currentRound(chapter);
  chapter = judgeChoice(chapter, round.choices.find(choice => choice.label === round.word[0]).id).progress;
  chapter.updatedAt = '2026-09-30T10:00:00.000Z';
  const packet = encodeWoodlandProgress(chapter), restored = decodeWoodlandProgress(packet);
  assert.equal(restored.seed, 73);
  assert.equal(restored.jobs.brook.built, round.word[0]);
  assert.deepEqual(restored.jobs.brook.used, chapter.jobs.brook.used);
  assert.deepEqual(packet.evidence, [], 'no assessment evidence from supported play');
  assert.equal(woodlandParticipation(packet).practiceOnly, true);
});

test('concurrent devices retain both woodland projects without restoring an obsolete partial word', () => {
  const a = freshChapter(73), b = freshChapter(81);
  a.jobs.picnic = {act:1,round:5,built:'',used:[],pending:false};
  b.jobs.brook = {act:1,round:3,built:'',used:[],pending:false};
  a.updatedAt = '2026-09-30T10:00:00.000Z'; b.updatedAt = '2026-09-30T11:00:00.000Z';
  a.attempts = 14; b.attempts = 12; a.fireflies=[1]; b.fireflies=[2];
  const left=encodeWoodlandProgress(a), right=encodeWoodlandProgress(b);
  const ab=mergeWoodlandProgress(left,right), ba=mergeWoodlandProgress(right,left);
  assert.deepEqual(ab,ba);
  const restored=decodeWoodlandProgress(ab);
  assert.deepEqual([restored.jobs.picnic.act,restored.jobs.picnic.round],[1,5]);
  assert.deepEqual([restored.jobs.brook.act,restored.jobs.brook.round],[1,3]);
  assert.deepEqual(restored.fireflies.sort(),[1,2]);
  assert.equal(restored.attempts,14);
  assert.equal(woodlandParticipation(ab).lastActiveAt,'', 'settings, walking and sync do not count as a learning answer');
});

test('replaying a woodland chapter has an explicit reset generation and stale devices cannot undo it', () => {
  const old=freshChapter(17);old.jobs.picnic.act=3;
  const replay=restartChapter(91,1000);
  const merged=mergeWoodlandProgress(encodeWoodlandProgress(replay),encodeWoodlandProgress(old));
  assert.equal(decodeWoodlandProgress(merged).jobs.picnic.act,0);
  assert.equal(decodeWoodlandProgress(merged).seed,91);
  const entry={mode:'student',studentId:'one',area:'phonics_quest',key:'woodland_homecoming_v1'};
  const queued=mergeProgressQueueEntries({...entry,payload:encodeWoodlandProgress(old)},{...entry,payload:encodeWoodlandProgress(replay)});
  assert.equal(decodeWoodlandProgress(queued.payload).resetEpoch,1000);
  assert.throws(()=>mergeProgressQueueEntries({...entry,payload:merged},{...entry,studentId:'two',payload:merged}),/identity mismatch/);
});

test('a completed pending answer settles once after device resume and corrupt checkpoints are not accepted', () => {
  const chapter=freshChapter(18), round=currentRound(chapter);
  const answered=judgeChoice(chapter,round.answer).progress;
  const packet=encodeWoodlandProgress(answered);
  const restored=decodeWoodlandProgress(packet);
  assert.equal(restored.jobs.picnic.round,1);
  assert.equal(decodeWoodlandProgress(encodeWoodlandProgress(restored)).jobs.picnic.round,1);
  assert.equal(decodeWoodlandProgress({...packet,checkpoint:{...packet.checkpoint,woodland:{version:99}}}),null);
  assert.equal(encodeWoodlandProgress({version:1}),null);
});
