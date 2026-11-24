import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_RUNTIME_V14 as bank } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { LITERACY_MOCK_RUNTIME_V12 as legacy } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { scoreLiteracyMockResponse } from '../../src/data/literacyMockRuntimeContract.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';
import { fillMockQuestion } from './support/mockAnswer.js';

test.describe.configure({ mode:'parallel' });

const sessionId = 'f6503f29-14af-403d-844b-f9cd0dd4c71e';

for (const [pattern, count] of [['correct',15],['incorrect',25],['reversal',40]]) {
  test(`complete mixed class assessment: ${pattern}`, async ({ page }, info) => {
    test.setTimeout(900000);
    await page.addInitScript(id => Object.defineProperty(crypto, 'randomUUID', { value:() => id }), sessionId);
    await page.addInitScript(() => {
      window.audioTimeline = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        if (!this.dataset.watched) {
          this.dataset.watched = 'true';
          for (const event of ['playing','ended','pause','error','stalled']) this.addEventListener(event, () => {
            window.audioTimeline.push({ event, path:decodeURIComponent(new URL(this.src,location.href).hash), time:this.currentTime, hidden:document.hidden });
          });
        }
        return play.apply(this,args);
      };
    });
    await page.goto('/preview/teacher-a11y.html?surface=resources');
    await page.getByRole('button', { name:'Open Mock MAP class test', exact:true }).click();
    await page.getByRole('combobox', { name:'Questions', exact:true }).selectOption(String(count));
    const writes = [];
    page.on('request', request => { if (request.method() === 'POST' && /rpc|rest\/v1/.test(request.url())) writes.push(request.url()); });
    await page.getByRole('button', { name:'Start class test', exact:true }).click();
    let session = createWholeClassMockSession(bank.filter(item=>item.mediaReady), { sessionId, itemCount:count });
    const history = [];
    while (session.run.responses.length < session.rounds.length) {
      const index = session.run.responses.length;
      expect(index).toBeLessThan(count);
      const item = session.rounds[index];
      const correct = pattern === 'correct' || pattern === 'reversal' && index < Math.floor(count/2);
      await expect(page.locator('[data-child-instruction]')).toHaveText(item.prompt);
      await expect(page.getByRole('button', { name:/^(Check answer|Previous question|Show answer)$/ })).toHaveCount(0);
      const selected = await fillMockQuestion(page, item, session.seed, correct);
      expect(scoreLiteracyMockResponse(item, selected),item.id).toBe(correct);
      const next = page.getByRole('button', { name:/^(Next question|Finish test)$/ });
      try {
        await expect(next, `${item.id}: ${item.prompt}`).toBeEnabled({ timeout:60000 });
      } catch (error) {
        const state = { item:item.id, text:await page.locator('.literacy-mock-canvas').innerText(), audio:await page.evaluate(()=>window.audioTimeline.slice(-40)) };
        await info.attach('question-state', { body:JSON.stringify(state,null,2), contentType:'application/json' });
        throw error;
      }
      if (index === 1) await page.screenshot({ path:info.outputPath('class-assessment.png') });
      await next.click();
      history.push({ item:item.id, domain:item.domainId, demand:item.adaptiveAreaBand, format:item.format, correct });
      session = submitWholeClassMockAnswer(session,item,{ questionId:item.id, responseStatus:'answered', selected,
        responseTimeMs:1000, supportUsed:false, knownFamiliar:false, audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path=>[path,'completed'])) });
    }
    await expect(page.getByText('Class test finished.', { exact:true })).toBeVisible();
    expect(new Set(history.map(row=>row.item)).size).toBe(history.length);
    expect(new Set(history.map(row=>row.domain)).size).toBe(8);
    expect(history.some(row=>row.demand !== history[0].demand)).toBe(true);
    expect(writes).toEqual([]);
    await info.attach('delivered-questions', { body:JSON.stringify(history,null,2), contentType:'application/json' });
  });
}

test('individual learner recordings retain the two-second processing pause',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(crypto,'randomUUID',{value:()=> 'smooth-class-browser'});
    window.nativeMockAudio=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      const url=new URL(this.src,location.href);
      if(url.protocol==='data:' || url.hash==='#mock-audio-unlock')return original.apply(this,args);
      const source=()=>{const u=new URL(this.src,location.href);return u.protocol==='blob:'?decodeURIComponent(u.hash.slice(1)):u.pathname;};
      window.nativeMockAudio.push({type:'play',path:source(),time:performance.now()});
      if(!this.processingAuditListener){
        this.processingAuditListener=true;
        this.addEventListener('ended',()=>window.nativeMockAudio.push({type:'ended',path:source(),time:performance.now()}));
      }
      return original.apply(this,args);
    };
  });
  const item=legacy.find(item=>item.mediaReady && item.domainId==='sound_awareness' && item.requiredAudioCues.some(cue=>cue.role==='choice'));
  await page.goto(`/tests/fixtures/literacy-mock.html?mode=format&version=literacy-mock-v12&item=${encodeURIComponent(item.id)}`);
  const instruction=item.requiredAudioCues.filter(cue=>cue.role!=='choice').at(-1).path;
  const firstChoice=mockChoices(item,'browser-format').map(choice=>item.requiredAudioCues.find(cue=>cue.role==='choice' && cue.choiceId===choice.id)).find(Boolean).path;
  await expect.poll(()=>page.evaluate(path=>window.nativeMockAudio.some(event=>event.path===path && event.type==='play'),firstChoice),{timeout:30000}).toBe(true);
  const events=await page.evaluate(()=>window.nativeMockAudio);
  const ended=events.find(event=>event.path===instruction && event.type==='ended');
  const answer=events.find(event=>event.path===firstChoice && event.type==='play');
  expect(ended).toBeTruthy();
  expect(answer.time-ended.time).toBeGreaterThanOrEqual(1950);
});
