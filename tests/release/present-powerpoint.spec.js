import {test, expect} from '@playwright/test';
import JSZip from 'jszip';
import fs from 'node:fs/promises';

const artifacts = '.artifacts/present-powerpoint';

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
      if (ids.size !== plan.slides.length) errors.push(`${cycle.id}/${day.value}: duplicate ID`);
      for (const source of deck.manifest.slides) if (!plan.slides.some(item => item.sourceIndex === source.index && item.main)) errors.push(`${cycle.id}/${day.value}: missing activity ${source.title}`);
      for (const slide of plan.slides) for (const target of [...(slide.buttons || []).map(item => item.target), ...(slide.cards || []).map(item => item.target), slide.next, slide.previous].filter(Boolean)) if (!ids.has(target)) errors.push(`${cycle.id}/${day.value}: broken ${target}`);
      for (const source of deck.manifest.slides.filter(item => item.rounds)) for (let i = 0; i < source.rounds.length; i++) if (!plan.slides.some(item => item.id.startsWith(`${source.index}:`) && (item.id.includes(`round${i}`) || item.id.includes(`build${i}`) || item.id.includes(`missing${i}`)))) errors.push(`${cycle.id}/${day.value}: missing round ${i}`);
      const falseSentences = deck.manifest.slides.flatMap(item => item.rounds || []).filter(item => item.matches === false);
      for (const round of falseSentences) for (const slide of plan.slides.filter(item => item.text === round.sentence)) if (slide.audio.length) errors.push('False sentence plays true audio');
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
