import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildExactRepairSpeechInput, validateExactRepairWorklist } from '../../tools/assessmentLedaExactRepair.mjs';

const bytes = Buffer.from('reviewed original recording');
const record = { role: 'isolated_word', exactText: 'sprain', publicPath: '/audio/production/en-US/isolated_word/sprain-123.mp3',
 sha256: createHash('sha256').update(bytes).digest('hex'), pronunciations: [{ phrase: 'sprain', ipa: 'spreɪn' }] };
const worklist = records => ({ scope: 'literacy-mock-exact-repair', records });
const dependencies = { readAudio: async () => bytes, resolveAudio: () => record.publicPath };

test('pronunciation repairs preserve literal text and only replace the reviewed whole phrase', () => {
 assert.deepEqual(buildExactRepairSpeechInput(record), { ssml: '<speak><phoneme alphabet="ipa" ph="spreɪn">sprain</phoneme></speak>' });
 const input = buildExactRepairSpeechInput({ exactText: 'With a little effort, move it.', pronunciations: [{ phrase: 'it', ipa: 'ɪt' }] });
 assert.equal(input.ssml, '<speak>With a little effort, move <phoneme alphabet="ipa" ph="ɪt">it</phoneme>.</speak>');
 assert.throws(() => buildExactRepairSpeechInput({ exactText: 'it and it', pronunciations: [{ phrase: 'it', ipa: 'ɪt' }] }), /exactly one/);
 assert.throws(() => buildExactRepairSpeechInput({ exactText: 'title', pronunciations: [{ phrase: 'it', ipa: 'ɪt' }] }), /exactly one/);
 assert.throws(() => buildExactRepairSpeechInput({ ...record, pronunciations: [{ phrase: 'sprain', ipa: '<audio>' }] }), /Invalid/);
 assert.throws(() => buildExactRepairSpeechInput({ exactText: 'used the', pronunciations: [{ phrase: 'used the', ipa: 'juːzd ðə' }] }), /Invalid/);
 const cloze = buildExactRepairSpeechInput({ exactText: 'Nell felt ….', pronunciations: [{ phrase: 'Nell', ipa: 'nɛl' }] });
 assert.ok(cloze.ssml.includes('<break time="600ms"/>'));
 assert.ok(cloze.ssml.includes('>Nell</phoneme>'));
});

test('exact repair permits only a bounded slower pace while preserving literal words and cloze pauses', () => {
 const input = buildExactRepairSpeechInput({ exactText: 'Nell felt ….', pronunciations: [{ phrase: 'Nell', ipa: 'nɛl' }], speakingRate: 0.85 });
 assert.equal(input.ssml, '<speak><prosody rate="85%"><phoneme alphabet="ipa" ph="nɛl">Nell</phoneme> felt <break time="600ms"/>.</prosody></speak>');
 assert.deepEqual(buildExactRepairSpeechInput({ ...record, speakingRate: 1 }), buildExactRepairSpeechInput(record));
 for (const speakingRate of [0, 0.84, 1.01, 0.855, NaN, Infinity, '0.85', '85%"><audio>']) {
  assert.throws(() => buildExactRepairSpeechInput({ ...record, speakingRate }), /Invalid exact repair speaking rate/);
 }
});

test('exact repair requires the current mapped file and reviewed bytes before any synthesis', async () => {
 const [valid] = await validateExactRepairWorklist(worklist([record]), dependencies);
 assert.equal(valid.originalPublicPath, record.publicPath);
 assert.equal(valid.originalSha256, record.sha256);
 assert.ok(valid.speechInput.ssml.includes('spreɪn'));
 await assert.rejects(validateExactRepairWorklist(worklist([record]), { ...dependencies, resolveAudio: () => '/changed.mp3' }), /mapping changed/);
 await assert.rejects(validateExactRepairWorklist(worklist([record]), { ...dependencies, readAudio: async () => Buffer.from('changed') }), /bytes changed/);
 await assert.rejects(validateExactRepairWorklist(worklist([record, record]), dependencies), /Repeated/);
 await assert.rejects(validateExactRepairWorklist(worklist([{ ...record, publicPath: '/audio/production/en-US/isolated_word/../../secret.mp3' }]), dependencies), /Invalid/);
 await assert.rejects(validateExactRepairWorklist({ ...worklist([record]), scope: 'all' }, dependencies), /Invalid/);
});
