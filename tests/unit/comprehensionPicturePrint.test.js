import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSION_PASSAGES } from '../../src/content/comprehension/passages.js';
import { passagePicture } from '../../src/content/comprehension/pictures.js';
import { buildComprehensionDocument as build, embedComprehensionImages, esc } from '../../src/content/comprehension/print.js';
import { shuffleAnswerPositions } from '../../src/utils/answerPositionShuffle.js';

test('every picture sheet preserves its exact passage and authoritative story illustration', () => {
  for (const passage of COMPREHENSION_PASSAGES) {
    const picture = passagePicture(passage);
    assert.ok(picture, passage.id);
    const document = build({ passageIds: [passage.id], variant: 'picture' });
    assert.deepEqual(document, build({ passageIds: [passage.id], variant: 'picture' }));
    assert.equal(document.pages, 1);
    assert.match(document.html, /data-print-variant="picture"/);
    assert.ok(document.html.includes(`<p class="passage">${esc(passage.text)}</p>`), passage.id);
    assert.ok(document.html.includes(`<h1>${esc(passage.title)}</h1>`));
    assert.ok(document.html.includes(`Phonics focus: ${esc(passage.focus)}`));
    assert.match(document.html, /Name:.*Date:/);
    assert.ok(document.html.includes(`href="${picture.src}"`));
    assert.ok(document.html.includes(`aria-label="${esc(picture.alt)}"`));
    assert.ok(document.html.includes(`data-picture-kind="${picture.kind}"`));
    assert.match(document.html, /Tell what happened\. Use first, next and last\./);
    assert.match(document.html, /Colour the story picture\./);
    assert.match(document.html, /data:font\/woff2;base64,/);
    assert.doesNotMatch(document.html, /<script\b|comprehension-portrait-|data-task-kind="draw-retell"/);
  }
});

test('the complete picture pack embeds exactly its 172 story rasters and no portrait bytes', async () => {
  const ids = COMPREHENSION_PASSAGES.map(p => p.id);
  const document = build({ passageIds: [...ids, ids[0]], variant: 'picture' });
  assert.equal(document.pages, 172);
  assert.equal((document.html.match(/data-worksheet-page=/g) || []).length, 172);
  const sources = [];
  const html = await embedComprehensionImages(document.html, { fetchImpl: async source => {
    sources.push(source);
    return { ok: true, blob: async () => new Blob(['fixture'], { type: 'image/webp' }) };
  } });
  assert.deepEqual(sources.sort(), COMPREHENSION_PASSAGES.map(p => passagePicture(p).src).sort());
  assert.equal((html.match(/data:image\/webp;base64,/g) || []).length, 172);
  assert.doesNotMatch(html, /href="\/images\//);
  const tasks = [...html.matchAll(/data-task-id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(tasks).size, tasks.length);
});

test('picture print preparation rejects missing story assets instead of printing blank art', async () => {
  const passage = COMPREHENSION_PASSAGES[0];
  const document = build({ passageIds: [passage.id], variant: 'picture' });
  await assert.rejects(embedComprehensionImages(document.html, { fetchImpl: async () => ({ ok: false }) }), /Worksheet picture could not be loaded/);
});

test('picture pages do not alter the independent drawing activity or matching print answer keys', () => {
  for (const passage of COMPREHENSION_PASSAGES) {
    const extension = build({ passageIds: [passage.id], variant: 'extension' }).html;
    assert.ok(extension.includes(esc(passage.draw)));
    assert.match(extension, /data-task-kind="draw-retell"/);
    assert.match(extension, /class="draw-box"/);
    assert.doesNotMatch(extension, /data-picture-kind=/);
    const choice = build({ passageIds: [passage.id], variant: 'choice' }).html;
    const guide = build({ passageIds: [passage.id], variant: 'teacher' }).html;
    for (const question of passage.questions) {
      const options = shuffleAnswerPositions(question.options, `comprehension-print-v1:${question.id}`);
      const letter = 'ABCD'[options.indexOf(question.answer)];
      assert.ok(guide.includes(`Answer: ${letter}. ${esc(question.answer)}.`), question.id);
      assert.ok(choice.includes(`<strong>${letter}.</strong> ${esc(question.answer)}`), question.id);
    }
  }
});
