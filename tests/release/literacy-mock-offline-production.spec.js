import { expect,test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';
import { resolveLiteracyMockImagePath } from '../../src/data/literacyMockImageDelivery.js';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';
test.describe.configure({timeout:600000});
test.skip(process.env.LP_MOCK_PRODUCTION_PROOF!=='1','Run against the temporary production offline-proof build.');
// Four spoken choices can take more than the default Playwright assertion
// timeout even with instant recordings, because the production gaps are real.
const answerTimeout = 25000;
function retainedMediaPaths(bank, ids) {
  const reserve = new Set(ids);
  return [...new Set(bank.filter(item => reserve.has(item.id)).flatMap(item =>
    [...item.requiredAudioPaths, ...item.requiredImagePaths].map(path =>
      withRepairedImageVersion(resolveLiteracyMockImagePath(path.split('#')[0]))
    )
  ))];
}
async function simulatedAudio(page, duration = 20) {
  await page.addInitScript(({ duration }) => {
    window.__mockAudio = { played: [], paused: [], failNext: false };
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.paused = true; this.currentTime = 0; }
      play() {
        const source = new URL(this.src, location.href);
        if (source.protocol === 'data:' || source.hash === '#mock-audio-unlock') return Promise.resolve();
        window.__mockAudio.played.push(source.protocol === 'blob:' ? decodeURIComponent(source.hash.slice(1)) : source.pathname); this.paused = false;
        if (window.__mockAudio.failNext) {
          window.__mockAudio.failNext = false;
          this.timer = setTimeout(() => { this.onerror?.(new Event('error')); this.dispatchEvent(new Event('error')); }, duration);
        } else {
          this.onplaying?.(new Event('playing'));
          this.timer = setTimeout(() => { this.onended?.(new Event('ended')); this.dispatchEvent(new Event('ended')); }, duration);
        }
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; window.__mockAudio.paused.push(this.src); }
      load() {}
    };
  }, { duration });
}
async function chooseAnswer(page, current = null, choiceOrder = null) {
  current ||= await page.evaluate(() => window.__literacyMock.deviceItem());
  const buttons = page.locator('.literacy-mock-choice');
  const ordered = choiceOrder || await page.evaluate(id => window.__literacyMock.choiceOrder(id), current.id);
  const byId = id => buttons.nth(ordered.findIndex(choice => choice.id === id));
  if (current.format === 'choice') {
    await byId(current.answer).click();
    if(current.skillId==='letter_knowledge' && /^[A-Za-z]$/.test(current.passage||'')) await page.getByRole('button',{name:/^Space 1 for/}).click();
  } else if (current.format === 'select_text') {
    const answer = current.choices.find(choice => choice.id === current.answer);
    await page.locator('.literacy-mock-text-selection button').nth(answer.tokenIndex).click();
  } else if (current.format === 'multi_select' || current.format === 'order') {
    for (let slot = 0; slot < current.answer.length; slot++) {
      await byId(current.answer[slot]).click();
      if (current.format === 'order') await page.locator('.literacy-mock-construction .literacy-mock-slot').nth(slot).click();
    }
  } else if (current.format === 'match') {
    for (let i = 0; i < current.answer.length; i++) {
      await byId(current.answer[i]).click();
      await page.getByRole('button', { name: new RegExp(`^Space ${i + 1} for`) }).click();
    }
  } else if (current.alphabetSpelling) {
    await page.getByRole('textbox', { name:'Your spelling' }).fill(current.answer);
  } else if (current.format === 'build_word') {
    function compose(text, choices) {
      if (!text) return [];
      for (const choice of choices) if (text.startsWith(choice.label)) {
        const suffix = compose(text.slice(choice.label.length), choices.filter(value => value.id !== choice.id));
        if (suffix) return [choice.id, ...suffix];
      }
      return null;
    }
    const tiles = compose(current.answer, current.choices);
    expect(tiles, 'The authored tile bank must construct the whole dictated word').not.toBeNull();
    for (let slot = 0; slot < tiles.length; slot++) {
      await byId(tiles[slot]).click();
      await page.locator('.literacy-mock-construction .literacy-mock-slot').nth(slot).click();
    }
  }
}

const root='/tests/fixtures/literacy-mock.html';
async function openDevice(page, info) {
 await simulatedAudio(page,5);await page.setViewportSize({width:1024,height:724});
 await page.goto(`${root}?case=${info.testId}&device=1&count=43`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__literacyMock.device()?.serverRun.offlineLeaseId))).toBe(true);
}
async function answerOne(page,n) {
 const current=await page.evaluate(()=>window.__literacyMock.deviceItem());expect(current).toBeTruthy();
 await chooseAnswer(page,current);const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});
 await expect(next).toBeEnabled({timeout:answerTimeout});await next.click();
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(n);
}

test.describe('V14 short sittings through the production offline shell', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const count of [15, 25, 40]) test(`${count} questions prepare, recover offline and collect`, async ({ page, context }, info) => {
    await simulatedAudio(page, 5);
    await page.setViewportSize({ width: 1024, height: 768 });
    const fixture = `${root}?case=${encodeURIComponent(info.testId)}&version=literacy-mock-v14&device=1&warmup=1&count=${count}`;
    const metadataResponse = await page.request.get('/offline-build.json');
    expect(metadataResponse.ok()).toBe(true);
    const metadata = await metadataResponse.json();
    expect(metadata.mockExecutable.mixedByVersion['literacy-mock-v14'].some(path => /RuntimeV14/i.test(path))).toBe(true);
    expect(metadata.mockExecutable.mixedByVersion['literacy-mock-v12'].some(path => /RuntimeV12/i.test(path))).toBe(true);
    await page.goto(`${fixture}&mode=teacher`);
    await page.getByRole('combobox', { name: 'Questions' }).selectOption(String(count));
    await page.getByRole('button', { name: 'Prepare for 2 students' }).click();
    await expect.poll(() => page.evaluate(() => window.__literacyMock.state().session.id)).toMatch(/^prepared-session-/);
    await expect.poll(() => page.evaluate(() => window.__literacyMock.state().session.mock.item_count)).toBe(count);
    await page.getByRole('button', { name: 'Start assessment', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
    const assignmentId = await page.evaluate(() => window.__literacyMock.state().session.id);
    const prepare = await page.evaluate(() => window.__literacyMock.state().calls.find(call => call.name === 'teacher_prepare_literacy_mock_session_v14'));
    expect(prepare.args.p_item_count).toBe(count);

    await page.goto(fixture);
    await page.getByRole('button', { name: 'Circle', exact: true }).click({ timeout: 30000 });
    await page.getByRole('button', { name: 'Check my sound', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    const tutorials = await page.evaluate(() => window.__literacyMock.tutorials());
    for (const [index, tutorial] of tutorials.entries()) {
      await expect(page.locator('[data-child-progress]')).toHaveText(`Button practice ${index + 1} of ${tutorials.length}`);
      await chooseAnswer(page, tutorial);
      await page.getByRole('button', { name: 'Next', exact: true }).click({ timeout: answerTimeout });
    }
    await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible({ timeout: 90000 });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await answerOne(page, 1);
    await answerOne(page, 2);
    const before = await page.evaluate(() => window.__literacyMock.device());
    expect(before.run.contentVersion).toBe('literacy-mock-v14');
    const bank = await loadLiteracyMockBank({ contentVersion: before.run.contentVersion });
    const paths = retainedMediaPaths(bank, before.mediaItemIds);
    await expect.poll(() => page.evaluate(async urls => {
      const cache = await caches.open('lp-mock-public-media-v1');
      return (await Promise.all(urls.map(path => cache.match(path)))).every(response => response?.ok);
    }, paths), { timeout: 90000 }).toBe(true);

    await page.evaluate(() => {
      const box = window.__literacyMock.device();
      localStorage.setItem('lp-student-session-v1', JSON.stringify({ token: 'local-browser-fixture', studentId: box.studentId,
        studentName: 'Alex', teacherId: box.focusSession.teacher_id, classId: box.focusSession.class_id,
        expiresAt: Date.parse(box.focusSession.expires_at) }));
      window.__literacyMock.setFault('offline');
    });
    await context.setOffline(true);
    await page.goto('/');
    const device = () => page.evaluate(sessionId => JSON.parse(localStorage.getItem(`lp-mock-outbox:student-a:${sessionId}`)), assignmentId);
    for (let index = 2; index < count; index++) {
      if (index === 2 || index === Math.floor(count / 2)) await page.reload();
      await expect(page.getByRole('region', { name: `Question ${index + 1}`, exact: true })).toBeVisible({ timeout: 60000 });
      const box = await device();
      expect(box.run.responses).toHaveLength(index);
      const current = bank.find(item => item.id === box.run.plan.itemIds[index]);
      expect(current).toBeTruthy();
      await chooseAnswer(page, current, mockChoices(current, box.run.plan.seed));
      await page.getByRole('button', { name: index === count - 1 ? 'Finish test' : 'Next question', exact: true }).click({ timeout: answerTimeout });
      await expect.poll(async () => (await device()).run.responses.length).toBe(index + 1);
    }
    const finished = await device();
    expect(finished.run.responses.slice(0, 2)).toEqual(before.run.responses);
    expect(new Set(finished.run.responses.map(answer => answer.questionId)).size).toBe(count);
    expect(finished.requests.length).toBeGreaterThan(0);

    await context.setOffline(false);
    await page.goto(fixture);
    await page.waitForFunction(() => Boolean(window.__literacyMock));
    await page.evaluate(() => { window.__literacyMock.setFault(null); window.dispatchEvent(new Event('online')); });
    await expect.poll(() => page.evaluate(() => window.__literacyMock.state().run.responses.length), { timeout: 60000 }).toBe(count);
    await expect.poll(async () => (await device()).requests.length).toBe(0);
    await page.goto(`${fixture}&mode=teacher&phase=live&session=${encodeURIComponent(assignmentId)}`);
    await page.getByRole('button', { name: 'Collect all data and finish', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Collect all data and finish', exact: true }).click();
    const pupil = page.getByRole('row').filter({ hasText: 'Alex' });
    await expect(pupil).toContainText('Full sitting received');
    await expect(pupil).toContainText(`${count} of ${count}`);
    const report = await page.evaluate(() => window.__literacyMock.state().run.responses);
    expect(report.map(answer => answer.questionId)).toEqual(finished.run.responses.map(answer => answer.questionId));
    expect(report.every(answer => answer.isCorrect === true && answer.evidenceType === 'independent')).toBe(true);
    await info.attach('offline-collection-verification', { contentType: 'application/json', body: JSON.stringify({
      buildId: metadata.buildId, cap: count, beforeDisconnection: before.run.responses.length,
      continuedAfterOfflineReload: [2, Math.floor(count / 2)], preservedDistinctResponses: report.length,
      pendingRequestsAfterCollection: (await device()).requests.length,
    }) });
  });
});

test('V12 production code and media retain three answers and accept the fourth after an offline app reload',async({page,context},info)=>{
 await simulatedAudio(page,5); // Audio lifecycle only; executable/media HTTP and CacheStorage are real.
 await page.setViewportSize({width:1024,height:724});
 const metadataResponse=await page.request.get('/offline-build.json');expect(metadataResponse.ok()).toBe(true);
 const metadata=await metadataResponse.json();
 expect(metadata.mockExecutable.contentVersion).toBe('literacy-mock-v12');
 expect(metadata.mockExecutable.mixedByVersion['literacy-mock-v12']).toEqual(metadata.mockExecutable.assets);
 expect(metadata.mockExecutable.assets.length).toBeGreaterThan(0);
 for(const version of ['literacy-mock-v10','literacy-mock-v11','literacy-mock-v12']) {
  expect(metadata.mockExecutable.byVersion[version].length).toBeGreaterThan(0);
  expect(metadata.mockExecutable.mixedByVersion[version].length).toBeGreaterThan(0);
 }
 const metadataPath=info.outputPath('served-v12-offline-build.json');
 await writeFile(metadataPath,JSON.stringify(metadata,null,2));
 await info.attach('served-v12-offline-build',{path:metadataPath,contentType:'application/json'});
 await page.goto(`${root}?case=${info.testId}&version=literacy-mock-v12&device=1`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__literacyMock.device()?.serverRun.offlineLeaseId))).toBe(true);
 const executableCache=await page.evaluate(async metadata=>{
  const cache=await caches.open(`lp-shell-${metadata.buildId}`);
  return {count:metadata.mockExecutable.assets.length,missing:(await Promise.all(metadata.mockExecutable.assets.map(async path=>(await cache.match(path))?.ok?null:path))).filter(Boolean)};
 },metadata);
 expect(executableCache.missing).toEqual([]);
 await answerOne(page,1);await answerOne(page,2);await answerOne(page,3);
 const before=await page.evaluate(()=>window.__literacyMock.device());
 expect(before.run.contentVersion).toBe('literacy-mock-v12');
 const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v12'});
 const paths=retainedMediaPaths(bank,before.mediaItemIds);
 expect(paths.length).toBeGreaterThan(0);
 await expect.poll(()=>page.evaluate(async paths=>{
  const cache=await caches.open('lp-mock-public-media-v1');
  return (await Promise.all(paths.map(path=>cache.match(path)))).filter(response=>response?.ok).length;
 },paths),{timeout:90000}).toBe(paths.length);
 await page.evaluate(()=>{
  const box=window.__literacyMock.device();
  localStorage.setItem('lp-student-session-v1',JSON.stringify({token:'local-browser-fixture',studentId:box.studentId,
   studentName:'Alex',teacherId:box.focusSession.teacher_id,classId:box.focusSession.class_id,
   expiresAt:Date.parse(box.focusSession.expires_at)}));
  window.__literacyMock.setFault('offline');
 });
 await context.setOffline(true);
 await page.goto('/');
 await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 await page.reload();
 await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 await page.screenshot({path:info.outputPath('actual-app-v12-offline-question4.png')});
 const device=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lp-mock-outbox:student-a:mock-session')));
 const resumed=await device();expect(resumed.run.responses).toEqual(before.run.responses);
 const fourth=bank.find(item=>item.id===resumed.run.plan.itemIds[3]);expect(fourth).toBeTruthy();
 await chooseAnswer(page,fourth,mockChoices(fourth,resumed.run.plan.seed));
 const next=page.getByRole('button',{name:'Next question',exact:true});await expect(next).toBeEnabled({timeout:answerTimeout});await next.click();
 await expect.poll(async()=>(await device()).run.responses.length).toBe(4);
 const answered=await device();
 expect(answered.run.responses.slice(0,3)).toEqual(before.run.responses);
 expect(answered.run.responses[3].questionId).toBe(fourth.id);
 expect(answered.requests.length).toBeGreaterThan(0);
 await page.reload();
 await expect(page.getByRole('region',{name:'Question 5',exact:true})).toBeVisible({timeout:60000});
 expect((await device()).run.responses).toEqual(answered.run.responses);
 await page.screenshot({path:info.outputPath('actual-app-v12-offline-question5.png')});
 const evidencePath=info.outputPath('v12-offline-receipt.json');
 await writeFile(evidencePath,JSON.stringify({buildId:metadata.buildId,contentVersion:answered.run.contentVersion,
  executableCache,retainedMediaPaths:paths.length,offlineResponses:answered.run.responses,queuedRequests:answered.requests.length,
  audioEvidence:'simulated playback lifecycle; real executable and media fetch/cache; no human listening claim'},null,2));
 await info.attach('v12-offline-receipt',{path:evidencePath,contentType:'application/json'});
});

test('the installed production shell, assessment code, bank and media survive a real offline page reload',async({page,context},info)=>{
 await openDevice(page,info);
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await answerOne(page,1);await answerOne(page,2);await answerOne(page,3);
 // Full disconnected sittings require the complete reserve, while question one
 // now opens as soon as its own exact media is retained.
 const initialBox=await page.evaluate(()=>window.__literacyMock.device());
 const reserveBank=await loadLiteracyMockBank({contentVersion:initialBox.run.contentVersion});
 const paths=retainedMediaPaths(reserveBank,initialBox.mediaItemIds);
 await expect.poll(()=>page.evaluate(async paths=>{const cache=await caches.open('lp-mock-public-media-v1');return (await Promise.all(paths.map(path=>cache.match(path)))).every(response=>response?.ok);},paths),{timeout:90000}).toBe(true);
 await page.evaluate(()=>{
  const box=window.__literacyMock.device();
  localStorage.setItem('lp-student-session-v1',JSON.stringify({token:'local-browser-fixture',studentId:box.studentId,
   studentName:'Alex',teacherId:box.focusSession.teacher_id,classId:box.focusSession.class_id,
   expiresAt:Date.parse(box.focusSession.expires_at)}));
  window.__literacyMock.setFault('offline');
 });
 await context.setOffline(true);
 await page.goto('/');
 await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 for(let reload=0;reload<2;reload++) {
  await page.reload();await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 }
 await expect(page.getByRole('button',{name:'Try again',exact:true})).toHaveCount(0);
 const boxes=await page.locator('.literacy-mock-choice').evaluateAll(elements=>elements.map(element=>{
  const style=getComputedStyle(element);
  return {width:Number.parseFloat(style.borderTopWidth),style:style.borderTopStyle,display:style.display};
 }));
 // Current choice and construction layouts use one-pixel borders. The flex
 // layout and solid borders demonstrate that offline styles were restored.
 expect(boxes.length).toBeGreaterThan(0);
 expect(boxes.every(box=>box.width>=1 && box.style==='solid' && box.display==='flex')).toBe(true);
 await page.screenshot({path:info.outputPath('actual-app-offline-resume.png')});
 const bank=await loadLiteracyMockBank();
 const device=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lp-mock-outbox:student-a:mock-session')));
 for(let n=4;n<=43;n++) {
  const box=await device(),current=bank.find(item=>item.id===box.run.plan.itemIds[n-1]);expect(current).toBeTruthy();
  await chooseAnswer(page,current,mockChoices(current,box.run.plan.seed));
  const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});await expect(next).toBeEnabled({timeout:answerTimeout});await next.click();
  await expect.poll(async()=>(await device()).run.responses.length).toBe(n);
 }
 await expect(page.getByText('Your answers are saved on this iPad. Wait for your teacher.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Try again',exact:true})).toHaveCount(0);
 const queued=await device();expect(queued.run.responses).toHaveLength(43);
 expect(queued.requests.length).toBeGreaterThan(43);
 await page.screenshot({path:info.outputPath('production-offline-complete.png')});
 await context.setOffline(false);
 await page.goto(`${root}?case=${info.testId}&device=1&count=43`);
 await page.waitForFunction(()=>Boolean(window.__literacyMock));
 await page.evaluate(()=>{window.__literacyMock.setFault(null);window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:30000}).toBe(43);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().requests.length)).toBe(0);
});
