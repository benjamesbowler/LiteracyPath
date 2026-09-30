import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignFeedbackSources } from '../../src/features/soundSeekers/rounded/campaignFeedback.js';

const echo = {
  mechanic: 'echo_hunt', domain: 'grapheme_to_phoneme',
  prompt: { cues: [{ src: '/instruction.mp3' }] },
  view: { direction: 'letter-to-sound', options: [{ id: 'right', audio: '/a.mp3' }, { id: 'wrong', audio: '/m.mp3' }] }
};
test('a first wrong sound contrasts the selected recording with the instruction without pronouncing the answer', () => {
  const sources = campaignFeedbackSources(echo, {}, { optionId: 'wrong' }, { type: 'incorrect' }, '/retry.mp3');
  assert.deepEqual(sources, ['/m.mp3', '/retry.mp3', '/instruction.mp3']);
  assert.ok(!sources.includes('/a.mp3'));
});
test('the authority must explicitly model before a revealed option is spoken', () => {
  const outcome = { type: 'model', revealId: 'right' };
  assert.deepEqual(campaignFeedbackSources(echo, {}, {}, outcome), ['/instruction.mp3']);
  assert.deepEqual(campaignFeedbackSources(echo, { modelShown: true }, {}, outcome), ['/instruction.mp3', '/a.mp3']);
});
test('oral sorting replays the current item; read sorting retains its print decision', () => {
  const sort = { mechanic: 'sound_sort', prompt: { cues: [{ src: '/read-instruction.mp3' }] }, view: {
    mode: 'initial', bins: [{ id: 'm', audio: '/m.mp3' }], items: [{ audio: '/map.mp3' }, { audio: '/mat.mp3' }]
  } };
  assert.deepEqual(campaignFeedbackSources(sort, { itemIndex: 1 }, { binId: 'm' }, { type: 'incorrect' }, '/retry.mp3'), ['/m.mp3', '/retry.mp3', '/mat.mp3']);
  assert.deepEqual(campaignFeedbackSources({ ...sort, view: { ...sort.view, mode: 'read' } }, { itemIndex: 1 }, { binId: 'm' }, { type: 'incorrect' }, '/retry.mp3'), ['/m.mp3', '/retry.mp3', '/read-instruction.mp3']);
});
test('construction models preserve the current slot and non-corrective events have no speech plan', () => {
  const forge = { mechanic: 'word_forge', prompt: { cues: [{ src: '/map.mp3' }] }, view: { tiles: [{ id: 'p', audio: '/p.mp3' }] } };
  assert.deepEqual(campaignFeedbackSources(forge, { modelShown: true, placed: ['m','a'] }, {}, { type: 'model', revealId: 'p' }), ['/map.mp3', '/p.mp3']);
  for (const type of ['ignored','correct','complete','heard','progress']) assert.deepEqual(campaignFeedbackSources(forge, {}, {}, { type }), []);
});
