import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningDwell, createPausableTasks, LEARNING_PACE, practiceResultMinimum } from '../../src/utils/learningPace.js';

function clock() {
  let time = 0, serial = 0; const tasks = new Map();
  const advance = ms => { const end = time + ms; while (true) { const due = [...tasks].filter(([,t]) => t.at <= end).sort((a,b) => a[1].at-b[1].at)[0]; if (!due) break; time=due[1].at; tasks.delete(due[0]); due[1].fn(); } time=end; };
  return { now: () => time, schedule: (fn, ms) => { const id=++serial; tasks.set(id,{fn,at:time+ms}); return id; }, clear: id => tasks.delete(id), advance };
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
test('result floors follow the learning construct, not a sentence-shaped instruction', () => {
  assert.equal(practiceResultMinimum({questionType:'listen_and_find_word',prompt:'Which word did you hear?'}),1600);
  assert.equal(practiceResultMinimum({questionType:'sentence_build'}),2400);
  assert.equal(practiceResultMinimum({questionType:'multiple_choice',passage:'A short passage.'}),2400);
  assert.equal(practiceResultMinimum({questionType:'picture_sound'}),2000);
});
test('a long feedback recording retains its semantic target past the minimum, then settles', async () => {
  const c=clock(); let finish, advanced=0;
  const dwell=createLearningDwell({...c,onAdvance:()=>advanced++}); dwell.waitFor(new Promise(r=>finish=r));
  c.advance(4000); assert.equal(advanced,0); finish(true); await flush();
  c.advance(499); assert.equal(advanced,0); c.advance(1); assert.equal(advanced,1);
});
test('pause freezes remaining dwell, including time while the feedback ends', async () => {
  const c=clock(); let finish, advanced=0;
  const dwell=createLearningDwell({...c,onAdvance:()=>advanced++}); dwell.waitFor(new Promise(r=>finish=r));
  c.advance(600); dwell.pause(); c.advance(10000); finish(true); await flush();
  assert.equal(advanced,0); assert.equal(dwell.remainingMs,1000); dwell.resume(); c.advance(999); assert.equal(advanced,0); c.advance(1); assert.equal(advanced,1);
});
test('replay replaces obsolete voice completion and cancellation prevents duplicate credit', async () => {
  const c=clock(); let oldEnd, newEnd, advanced=0;
  const dwell=createLearningDwell({...c,onAdvance:()=>advanced++}); dwell.waitFor(new Promise(r=>oldEnd=r));
  dwell.waitFor(new Promise(r=>newEnd=r)); oldEnd(); await flush(); c.advance(5000); assert.equal(advanced,0);
  newEnd(); await flush(); dwell.cancel(); c.advance(10000); assert.equal(advanced,0);
});
test('unavailable/rejected media retains the readable minimum but cannot deadlock', async () => {
  const c=clock(); let advanced=0; const dwell=createLearningDwell({...c,onAdvance:()=>advanced++});
  dwell.waitFor(Promise.reject(new Error('missing'))); await flush(); c.advance(LEARNING_PACE.word-1); assert.equal(advanced,0); c.advance(1); assert.equal(advanced,1);
});
test('native game tasks cannot change the item through pause and resume uses remaining time', () => {
  const c=clock(); let advanced=0; const queue=createPausableTasks(c); queue.schedule(()=>advanced++,2400);
  c.advance(600); queue.pause(); c.advance(10000); assert.equal(advanced,0); queue.resume(); c.advance(1799); assert.equal(advanced,0); c.advance(1); assert.equal(advanced,1);
  queue.schedule(()=>advanced++,10); queue.cancel(); c.advance(100); assert.equal(advanced,1);
});
