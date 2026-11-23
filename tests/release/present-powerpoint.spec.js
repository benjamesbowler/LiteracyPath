import {test, expect} from '@playwright/test';
import JSZip from 'jszip';
import fs from 'node:fs/promises';

const artifacts = process.env.LP_PRESENT_POWERPOINT_ARTIFACTS || '.artifacts/present-powerpoint';

test('every daily PowerPoint plan preserves all activities and has valid native paths', async ({page}) => {
  test.setTimeout(120000);
  await page.goto('/preview/teacher-a11y.html?surface=present');
  const result = await page.evaluate(async () => {
    const {buildCyclePresentation, presentationCycleOptions, PRESENTATION_DAYS} = await import('/src/utils/present/presentationBuilder.js');
    const {buildPresentationPowerPointPlan} = await import('/src/utils/present/presentationPowerPointPlan.js');
    const errors = [], counts = [];
    for (const cycle of presentationCycleOptions().filter(item => item.type !== 'assessment')) for (const day of PRESENTATION_DAYS) {
      const deck = buildCyclePresentation(cycle.id, {day: day.value});
      const doc = new DOMParser().parseFromString(deck.html, 'text/html');
      const plan = buildPresentationPowerPointPlan(deck, doc);
      const ids = new Set(plan.slides.map(item => item.id));
      const byId = new Map(plan.slides.map(item => [item.id, item]));
      const sections = [...doc.querySelectorAll('#deck > section')];
      if (ids.size !== plan.slides.length) errors.push(`${cycle.id}/${day.value}: duplicate ID`);
      for (const source of deck.manifest.slides) if (!plan.slides.some(item => item.sourceIndex === source.index && item.main)) errors.push(`${cycle.id}/${day.value}: missing activity ${source.title}`);
      for (const slide of plan.slides) for (const target of [...(slide.buttons || []).map(item => item.target), ...(slide.cards || []).map(item => item.target), slide.next, slide.previous].filter(Boolean)) if (!ids.has(target)) errors.push(`${cycle.id}/${day.value}: broken ${target}`);
      for (const slide of plan.slides.filter(item => item.formation)) {
        const svg = atob(slide.images[0].src.split(',')[1]);
        if (!svg.includes('marker-end="url(#direction)"') || !svg.includes('<circle')) errors.push(`${cycle.id}/${day.value}: missing stroke direction`);
      }
      for (const source of deck.manifest.slides.filter(item => item.rounds)) for (let i = 0; i < source.rounds.length; i++) if (!plan.slides.some(item => item.id.startsWith(`${source.index}:`) && (item.id.includes(`round${i}`) || item.id.includes(`build${i}`) || item.id.includes(`missing${i}`)))) errors.push(`${cycle.id}/${day.value}: missing round ${i}`);
      const falseSentences = deck.manifest.slides.flatMap(item => item.rounds || []).filter(item => item.matches === false);
      for (const round of falseSentences) for (const slide of plan.slides.filter(item => item.text === round.sentence)) if (slide.audio.length) errors.push('False sentence plays true audio');
      for (const item of plan.slides.filter(item => item.cards)) {
        const cards = [...sections[item.sourceIndex].querySelectorAll('[data-match-word]')];
        const letterPairs = Boolean(sections[item.sourceIndex].querySelector('[data-match-kind="letters"]'));
        const pending = item.cards.flatMap((card, i) => card.revealed && !card.matched ? [i] : []);
        const match = (a, b) => a.dataset.matchWord === b.dataset.matchWord && (!letterPairs || a.querySelector('.p-card-word').textContent !== b.querySelector('.p-card-word').textContent);
        const bits = (board, key) => board.cards.map(card => card[key]).join(',');
        const fail = name => errors.push(`${cycle.id}/${day.value}/${item.id}: ${name}`);
        const reset = byId.get(item.buttons.find(button => button.label === 'Play again').target);
        const hidden = byId.get(item.buttons.find(button => button.label === 'Hide unmatched cards').target);
        if (!reset.main || reset.cards.some(card => card.revealed)) fail('replay must close all cards');
        if (bits(hidden, 'revealed') !== bits(item, 'matched')) fail('hide must keep exactly the matched cards open');
        if (pending.length > 2 || item.cards.filter(card => card.matched).length % 2) fail('only pairs may match and only two cards may be pending');
        item.cards.forEach((card, i) => {
          if (card.revealed || pending.length === 2) {
            if (card.target !== item.id) fail('a matched, open or comparison-locked card moved');
            return;
          }
          const target = byId.get(card.target);
          const completesPair = pending.length === 1 && match(cards[pending[0]], cards[i]);
          const expected = item.cards.map((before, j) => before.matched || (completesPair && (j === i || j === pending[0])));
          const expectedReveals = item.cards.map((before, j) => before.revealed || j === i);
          if (bits(target, 'matched') !== expected.join(',') || bits(target, 'revealed') !== expectedReveals.join(',')) fail('one click should reveal one card and match at most one pair');
        });
      }
      for (const item of plan.slides.filter(item => sections[item.sourceIndex]?.querySelector('.p-short-title'))) {
        const source = sections[item.sourceIndex];
        const passage = source.querySelector('.p-short-story, .p-short-reread');
        const focus = [...new Set([...passage.querySelectorAll('strong')].map(word => word.textContent.toLowerCase()))];
        if (item.storyTitle !== source.querySelector('.p-short-title').textContent || item.story !== passage.textContent || JSON.stringify(item.storyEmphasis) !== JSON.stringify(focus)) errors.push(`${cycle.id}/${day.value}/${item.id}: missing passage title, text or focus marks`);
      }
      for (const item of plan.slides) {
        const source = sections[item.sourceIndex];
        const recap = source?.querySelector('.p-roundup-stimulus');
        if (recap?.children.length && item.text !== [...recap.children].map(word => word.textContent).join(' ')) errors.push(`${cycle.id}/${day.value}/${item.id}: missing round-up print`);
        if (source?.classList.contains('p-week-roundup') && item.prompt !== source.querySelector('.p-teacher-prompt').textContent) errors.push(`${cycle.id}/${day.value}/${item.id}: weekly prompt omits sound recall`);
      }
      counts.push({cycle: cycle.id, day: day.value, slides: plan.slides.length});
    }
    return {errors, counts};
  });
  expect(result.errors).toEqual([]);
  expect(result.counts).toHaveLength(135);
  await fs.mkdir(artifacts, {recursive: true});
  await fs.writeFile(`${artifacts}/all-daily-plan-coverage.json`, JSON.stringify(result, null, 2));
});

test('downloaded PowerPoint contains offline pictures, audio, links, all rounds and hidden branches', async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/preview/teacher-a11y.html?surface=present');
  await page.getByLabel('Cycle', {exact:true}).selectOption('cycle-9');
  await page.getByLabel('Day', {exact:true}).selectOption('friday');
  const started = Date.now();
  const downloadEvent = page.waitForEvent('download', {timeout:150000});
  await page.getByRole('button', {name:'Download PowerPoint', exact:true}).click();
  await expect(page.getByRole('button', {name:'Preparing PowerPoint…', exact:true})).toBeDisabled();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('Literacy-Guide-cycle-9-friday.pptx');
  await fs.mkdir(artifacts, {recursive:true});
  const path = `${artifacts}/${download.suggestedFilename()}`;
  await download.saveAs(path);
  const bytes = await fs.readFile(path), zip = await JSZip.loadAsync(bytes);
  const slides = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  expect(slides.length).toBeGreaterThan(300);
  expect(bytes.length).toBeLessThan(30_000_000);
  const xmls = await Promise.all(slides.map(name => zip.file(name).async('string')));
  expect(xmls.filter(xml => /show="0"/.test(xml)).length).toBeGreaterThan(250);
  const storySlides = xmls.filter(xml => /descr="Cycle Shorts · (?:Sunny Meadow Farm|Question)/.test(xml));
  expect(storySlides).toHaveLength(16);
  expect(storySlides.every(xml => xml.includes('descr="A Quilt for Splashy"'))).toBe(true);
  const weeklyReview = xmls.filter(xml => xml.includes('descr="Our week · Monday to Thursday"'));
  expect(weeklyReview).toHaveLength(5);
  expect(weeklyReview.every(xml => xml.includes('descr="Say the sounds and read the words from this week."'))).toBe(true);
  expect(xmls.some(xml => xml.includes('descr="Weekly round-up"') && xml.includes('descr="he me she"'))).toBe(true);
  const media = Object.keys(zip.files).filter(name => /^ppt\/media\//.test(name) && !zip.files[name].dir);
  expect(media.some(name => name.endsWith('.mp3'))).toBe(true);
  expect(media.some(name => name.endsWith('.png'))).toBe(true);
  const rels = await Promise.all(Object.keys(zip.files).filter(name => /ppt\/slides\/_rels\/.*\.rels$/.test(name)).map(name => zip.file(name).async('string')));
  expect(rels.join('')).not.toMatch(/TargetMode="External"/);
  expect(rels.join('')).toContain('/relationships/slide');
  expect(rels.join('')).toContain('/relationships/audio');
  for (const xml of xmls) {
    const ids = [...xml.matchAll(/<p:cNvPr id="(\d+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    if (xml.includes('a:audioFile')) {
      expect(xml).toContain('<p:audio>');
      expect(xml).toContain('presetClass="mediacall"');
      expect(xml).not.toContain('a:videoFile');
    }
  }
  await expect(page.getByRole('status')).toContainText('PowerPoint downloaded');
  await fs.writeFile(`${artifacts}/download-evidence.json`, JSON.stringify({bytes:bytes.length, elapsedMs:Date.now()-started, slideCount:slides.length, hiddenSlides:xmls.filter(xml => /show="0"/.test(xml)).length, mediaFiles:media.length}, null, 2));
  await page.screenshot({path:`${artifacts}/download-complete.png`, fullPage:true});
});

test('a lesson with letter formation downloads under the production image and connection policy', async ({page}) => {
  test.setTimeout(60000);
  const config = JSON.parse(await fs.readFile(new URL('../../config/vercel-base.json', import.meta.url), 'utf8'));
  const policy = config.headers.find(rule => rule.source === '/(.*)').headers
    .find(header => header.key === 'Content-Security-Policy').value;
  // Apply the production media directives while letting the preview load Vite's development scripts.
  const mediaPolicy = policy.split(';').map(directive => directive.trim())
    .filter(directive => /^(img-src|connect-src) /.test(directive)).join('; ');
  await page.route(url => url.pathname === '/preview/teacher-a11y.html', async route => {
    const response = await route.fetch();
    await route.fulfill({response, headers: {...response.headers(), 'content-security-policy': mediaPolicy}});
  });
  await page.goto('/preview/teacher-a11y.html?surface=present');
  await page.getByLabel('Cycle', {exact:true}).selectOption('cycle-13');
  await page.getByLabel('Day', {exact:true}).selectOption('thursday');
  const [download] = await Promise.all([
    page.waitForEvent('download', {timeout:45000}),
    (async () => {
      await page.getByRole('button', {name:'Download PowerPoint', exact:true}).click();
      const status = page.getByRole('status');
      await expect(status).toHaveText(/PowerPoint downloaded|Failed to fetch/, {timeout:40000});
      await expect(status).toContainText('PowerPoint downloaded', {timeout:1000});
    })()
  ]);
  expect(download.suggestedFilename()).toBe('Literacy-Guide-cycle-13-thursday.pptx');
  const zip = await JSZip.loadAsync(await fs.readFile(await download.path()));
  const types = await zip.file('[Content_Types].xml').async('string');
  const missingParts = [...types.matchAll(/<Override PartName="\/([^"]+)"/g)]
    .map(match => match[1]).filter(part => !zip.file(part));
  expect(missingParts).toEqual([]);
  const slides = zip.file(/^ppt\/slides\/slide\d+\.xml$/);
  const xmls = await Promise.all(slides.map(slide => slide.async('string')));
  expect(xmls.every(xml => !xml.includes('r:id=""'))).toBe(true);
  const picture = xmls.flatMap(xml => xml.match(/<p:pic>[\s\S]*?<\/p:pic>/g) || [])
    .find(xml => xml.includes('descr="Formation model for K"'));
  expect(picture).toBeDefined();
  const x = Number(/<a:off x="(\d+)"/.exec(picture)[1]);
  const width = Number(/<a:ext cx="(\d+)"/.exec(picture)[1]);
  const presentation = await zip.file('ppt/presentation.xml').async('string');
  const slideWidth = Number(/<p:sldSz cx="(\d+)"/.exec(presentation)[1]);
  expect(Math.abs(x + width / 2 - slideWidth / 2)).toBeLessThan(2);
});

test('failed required media offers retry without downloading an incomplete deck', async ({page}) => {
  await page.goto('/preview/teacher-a11y.html?surface=present');
  await page.getByLabel('Cycle', {exact:true}).selectOption('cycle-1');
  await page.getByLabel('Day', {exact:true}).selectOption('monday');
  await page.route('**/*.mp3*', route => route.fulfill({status:404, contentType:'text/plain',body:'not found'}));
  let downloaded = false;page.on('download', () => {downloaded = true;});
  await page.getByRole('button', {name:'Download PowerPoint', exact:true}).click();
  await expect(page.getByRole('status')).toContainText('could not download');
  await expect(page.getByRole('button', {name:'Download PowerPoint', exact:true})).toBeEnabled();
  expect(downloaded).toBe(false);
});
