import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getAllLetters, getLessonByLetter } from '../../src/data/phonicsLessons.js';
import { buildLetterPracticeQuestions, getLetterPracticeTraceLesson, letterPracticeSoundKey } from '../../src/data/letterPractice.js';
import { LETTER_PRACTICE_VERSION, LETTER_PRACTICE_ROUNDS } from '../../src/policy/letterPractice.js';
import { getLetterPracticeProgress, letterPracticeSessionKey, loadLetterPracticeSession, saveLetterPracticeSession } from '../../src/utils/letterPracticeProgress.js';
import { mergePracticeProgressRecords } from '../../src/utils/practiceCompletionRecords.js';
import { localLearnerDataKeysForStudent } from '../../src/utils/progressKeys.js';

const event = (round, id = `round-${round}`) => ({ id, completedAt: '2026-09-14T01:00:00Z', contentVersion: LETTER_PRACTICE_VERSION,
  steps: [1,2,3].map(practiceStep => ({ practiceRound: round, practiceStep, independent: false })) });
const record = events => ({ v: 3, status: 'completed', completions: events });

test('every letter has at least five times the former three-stage lesson and meaningful required responses', () => {
  let questions = 0;
  const media = new Set();
  const ids = new Set();
  for (const letter of getAllLetters()) {
    assert.ok(LETTER_PRACTICE_ROUNDS.length * 3 >= 5 * 3);
    let required = 0;
    for (let round = 2; round <= LETTER_PRACTICE_ROUNDS.length; round++) for (const step of [2,3]) {
      const deck = buildLetterPracticeQuestions({letter, round, step, seed:'classroom', reviewLetters:getAllLetters()});
      assert.ok(deck.length >= 8);
      for (const question of deck) {
        assert.ok(!ids.has(question.id)); ids.add(question.id);
        assert.equal(question.options.length, 3);
        assert.equal(new Set(question.options.map(option => option.id)).size, 3);
        assert.equal(question.options.filter(option => option.id === question.answer).length, 1);
        assert.ok(question.instructionAudio, `${question.id} needs a spoken instruction`);
        media.add(question.audio); media.add(question.instructionAudio);
        for (const option of question.options) if (option.image) media.add(option.image);
        media.add(question.targetWord.image);
        if (question.mode === 'letter-sound') {
          assert.equal(question.options.filter(option => letterPracticeSoundKey(option.id) === letterPracticeSoundKey(question.answer)).length,1);
        }
        if (question.mode === 'word-letter') {
          const printed = question.targetWord.word;
          assert.equal(question.answer.toLowerCase(), question.construct === 'printed_ending_matching' ? printed.at(-1) : printed[0]);
        }
      }
      required += deck.length;
    }
    // Even the short Q word bank gets the whole practice programme.
    assert.ok(required >= 72, `${letter}: ${required}`);
    questions += required;
  }
  assert.equal(questions, 1872);
  for (const source of media) assert.ok(source && fs.existsSync(new URL(`../../public${source}`, import.meta.url)), `Missing media: ${source}`);
});

test('replay changes order and choices while saved seeds restore the exact questions', () => {
  for (const letter of getAllLetters()) for (const round of [2,3,4,5]) for (const step of [2,3]) {
    const args={letter,round,step,seed:'first-visit',reviewLetters:['A','M','S','T','C','K','X']};
    const first=buildLetterPracticeQuestions(args);
    assert.deepEqual(buildLetterPracticeQuestions(args),first);
    assert.notDeepEqual(buildLetterPracticeQuestions({...args,seed:'second-visit'}),first);
    assert.ok(new Set(first.map(q=>q.options.findIndex(option=>option.id===q.answer))).size>1);
  }
  const deck=buildLetterPracticeQuestions({letter:'T',round:5,step:2,seed:'review',reviewLetters:['A','M']});
  assert.ok(deck.some(question=>question.targetLetter==='A'));
  assert.ok(deck.some(question=>question.targetLetter==='M'));
  assert.ok(deck.some(question=>question.targetLetter==='T'));
});

test('all uppercase and lowercase traces remain within the existing finger canvas', () => {
  for (const letter of getAllLetters()) for (let round=1;round<=5;round++) {
    const lesson=getLetterPracticeTraceLesson(getLessonByLetter(letter),round);
    assert.equal(lesson.letter,[2,4].includes(round)?letter.toLowerCase():letter);
    const coords=lesson.traceSVG.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.ok(coords.every(n=>n>0&&n<400),`${letter} round ${round}`);
  }
});

test('old finished letters earn one round and new completions require all five distinct full rounds', () => {
  assert.equal(getLetterPracticeProgress('completed').completedCount,1);
  assert.equal(getLetterPracticeProgress('completed').nextRound,2);
  assert.equal(getLetterPracticeProgress('completed').status,'inprogress');
  const old = mergePracticeProgressRecords('completed',record([event(2),event(2,'repeat')]));
  assert.equal(getLetterPracticeProgress(old).completedCount,2);
  assert.equal(getLetterPracticeProgress(old).nextRound,3);
  const all=mergePracticeProgressRecords(old,record([event(3),event(4),event(5)]));
  assert.equal(getLetterPracticeProgress(all).complete,true);
  assert.equal(getLetterPracticeProgress(record([event(1),event(3),event(4),event(5)])).nextRound,2);
  const incomplete=event(2);incomplete.steps.pop();
  assert.equal(getLetterPracticeProgress(record([incomplete])).completedCount,0);
  assert.equal(getLetterPracticeProgress({...record([event(2)]),completionConflictIds:['round-2']}).completedCount,0);
});

test('resume is learner-scoped and participates in reset and privacy cleanup', t => {
  const old=globalThis.localStorage;const values=new Map();
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  t.after(()=>{globalThis.localStorage=old;});
  const session={round:2,step:2,seed:'resume',evidence:[{practiceStep:1}],checkpoint:{answers:[{questionId:'A:2:2:0'}]}};
  assert.equal(saveLetterPracticeSession('one','A',session),true);
  assert.deepEqual(loadLetterPracticeSession('one','A').checkpoint,session.checkpoint);
  assert.equal(loadLetterPracticeSession('two','A'),null);
  assert.ok(localLearnerDataKeysForStudent('one').includes(letterPracticeSessionKey('one')));
  saveLetterPracticeSession('one','A',null);
  assert.equal(loadLetterPracticeSession('one','A'),null);
});
