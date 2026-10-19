import { expect,test } from '@playwright/test';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';
test.describe.configure({timeout:180000});
test.skip(process.env.LP_MOCK_PRODUCTION_PROOF!=='1','Run against the temporary production offline-proof build.');
async function simulatedAudio(page, duration = 20) {
  await page.addInitScript(({ duration }) => {
    window.__mockAudio = { played: [], paused: [], failNext: false };
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.paused = true; this.currentTime = 0; }
      play() {
        window.__mockAudio.played.push(this.src); this.paused = false;
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
  } else if (current.format === 'select_text') {
    const answer = current.choices.find(choice => choice.id === current.answer);
    await page.locator('.literacy-mock-text-selection button').nth(answer.tokenIndex).click();
  } else if (current.format === 'multi_select' || current.format === 'order') {
    for (const id of current.answer) await byId(id).click();
  } else if (current.format === 'match') {
    for (let i = 0; i < current.answer.length; i++) {
      await byId(current.answer[i]).click();
      await page.getByRole('button', { name: new RegExp(`^Space ${i + 1} for`) }).click();
    }
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
    for (const id of tiles) await byId(id).click();
  }
}

const root='/tests/fixtures/literacy-mock.html';
async function openDevice(page, info) {
 await simulatedAudio(page,5);await page.setViewportSize({width:1024,height:724});
 await page.goto(`${root}?case=${info.testId}&device=1&count=43&focusHook=1`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__literacyMock.device()?.serverRun.offlineLeaseId))).toBe(true);
}
async function answerOne(page,n) {
 const current=await page.evaluate(()=>window.__literacyMock.deviceItem());expect(current).toBeTruthy();
 await chooseAnswer(page,current);const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});
 await expect(next).toBeEnabled();await next.click();
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(n);
}

test('the installed production shell, assessment code, bank and media survive a real offline page reload',async({page,context},info)=>{
 await openDevice(page,info);
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await answerOne(page,1);await answerOne(page,2);await answerOne(page,3);
 // Full disconnected sittings require the complete reserve, while question one
 // now opens as soon as its own exact media is retained.
 const initialBox=await page.evaluate(()=>window.__literacyMock.device());
 const reserveBank=await loadLiteracyMockBank({contentVersion:initialBox.run.contentVersion});
 const reserveIds=new Set(initialBox.mediaItemIds);
 const paths=[...new Set(reserveBank.filter(item=>reserveIds.has(item.id)).flatMap(item=>[...item.requiredAudioPaths,...item.requiredImagePaths]).map(path=>path.split('#')[0]))];
 await expect.poll(()=>page.evaluate(async paths=>{const cache=await caches.open('lp-mock-public-media-v1');return (await Promise.all(paths.map(path=>cache.match(path)))).every(response=>response?.ok);},paths),{timeout:90000}).toBe(true);
 await page.evaluate(()=>window.__literacyMock.setFault('offline'));await context.setOffline(true);
 await page.reload();
 await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 await page.evaluate(()=>{
  const box=window.__literacyMock.device();
  localStorage.setItem('lp-student-session-v1',JSON.stringify({token:'local-browser-fixture',studentId:box.studentId,
   studentName:'Alex',teacherId:box.focusSession.teacher_id,classId:box.focusSession.class_id,
   expiresAt:Date.parse(box.focusSession.expires_at)}));
 });
 await page.goto('/');
 await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 for(let reload=0;reload<2;reload++) {
  await page.reload();await expect(page.getByRole('region',{name:'Question 4',exact:true})).toBeVisible({timeout:60000});
 }
 await expect(page.getByRole('button',{name:'Try again',exact:true})).toHaveCount(0);
 const boxes=await page.locator('.literacy-mock-choice').evaluateAll(elements=>elements.map(element=>{
  const style=getComputedStyle(element);return {width:Number.parseFloat(style.borderTopWidth),style:style.borderTopStyle};
 }));
 expect(boxes.length).toBeGreaterThan(0);expect(boxes.every(box=>box.width>=2 && box.style==='solid')).toBe(true);
 await page.screenshot({path:info.outputPath('actual-app-offline-resume.png')});
 const bank=await loadLiteracyMockBank();
 const device=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lp-mock-outbox:student-a:mock-session')));
 for(let n=4;n<=43;n++) {
  const box=await device(),current=bank.find(item=>item.id===box.run.plan.itemIds[n-1]);expect(current).toBeTruthy();
  await chooseAnswer(page,current,mockChoices(current,box.run.plan.seed));
  const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});await expect(next).toBeEnabled();await next.click();
  await expect.poll(async()=>(await device()).run.responses.length).toBe(n);
 }
 await expect(page.getByText('Your answers are saved on this iPad. Wait for your teacher.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Try again',exact:true})).toHaveCount(0);
 const queued=await device();expect(queued.run.responses).toHaveLength(43);
 expect(queued.requests.length).toBeGreaterThan(43);
 await page.screenshot({path:info.outputPath('production-offline-complete.png')});
 await context.setOffline(false);
 await page.goto(`${root}?case=${info.testId}&device=1&count=43&focusHook=1`);
 await page.evaluate(()=>{window.__literacyMock.setFault(null);window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:30000}).toBe(43);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().requests.length)).toBe(0);
});
