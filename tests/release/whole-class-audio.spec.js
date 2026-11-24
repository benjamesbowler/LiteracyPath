import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V14 as bank } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { createWholeClassMockSession } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { literacyMockNarrationCues } from '../../src/utils/literacyMockNarration.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

import { literacyMockBoundarySchedule } from '../../src/policy/literacyMockBoundaryPolicy.js';

function opening(area = 'sound_awareness') {
  for (let number = 0; number < 100; number++) {
    const sessionId = `audio-class-${number}`;
    if (literacyMockBoundarySchedule([], {contentVersion: 'literacy-mock-v14', sessionId})[0] !== area) continue;
    const session = createWholeClassMockSession(bank, {sessionId, itemCount: 25});
    return {sessionId, seed: session.seed, item: session.rounds[0]};
  }
  throw new Error(`No opening for ${area}`);
}
async function auditNativeAudio(page) {
  await page.addInitScript(()=>{
    window.classAudioEvents=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      const url=new URL(this.src,location.href);
      if(url.protocol==='data:' || url.hash==='#mock-audio-unlock')return original.apply(this,args);
      const path=url.protocol==='blob:'?decodeURIComponent(url.hash.slice(1)):url.pathname;
      const record=type=>window.classAudioEvents.push({type,path,time:performance.now()});
      record('play');
      const onended=this.onended;
      this.onended=function(event){record('ended');onended?.call(this,event);};
      return original.apply(this,args);
    };
  });
}
async function openPractice(page, area) {
  const fixture = opening(area);
  await page.addInitScript(id => Object.defineProperty(crypto, 'randomUUID', {value: () => id}), fixture.sessionId);
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button', {name:'Open Mock MAP class test',exact:true}).click();
  await page.getByRole('button', {name:'Start class test',exact:true}).click();
  return fixture;
}
async function expectCompleteNarration(page, {item, seed}) {
  const choices = mockChoices(item, seed);
  const expected=literacyMockNarrationCues(item,choices).map(cue=>cue.path);
  await expect.poll(()=>page.evaluate(()=>window.classAudioEvents.filter(e=>e.type==='ended').map(e=>e.path)),{timeout:60000}).toEqual(expected);
  return {choices,expected,events:await page.evaluate(()=>window.classAudioEvents)};
}

for(const area of ['sound_awareness','phonics','print','vocabulary','listening','language','reading','writing'])test(`class ${area} automatically plays its complete authored narration without a script`,async({page})=>{
  test.setTimeout(90000);
  await auditNativeAudio(page);
  const fixture = await openPractice(page, area);
  const {item} = fixture;
  await expect(page.getByRole('button',{name:'Listen to the question',exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-teacher-script')).toHaveCount(0);
  await expect(page.locator('[data-child-instruction]')).toHaveText(item.prompt);
  await page.locator('.literacy-mock-choice').first().click();
  if(item.format==='match' || item.skillId==='letter_knowledge' && item.passage)await page.locator('.literacy-mock-slot').first().click();
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeDisabled();
  const {events,choices}=await expectCompleteNarration(page,fixture);
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeEnabled();
  const firstChoice=choices.find(choice=>choice.audioPath);
  if(firstChoice){
    const preceding=item.requiredAudioCues.filter(cue=>cue.role!=='choice').at(-1).path;
    const ended=events.find(e=>e.type==='ended'&&e.path===preceding);
    const started=events.find(e=>e.type==='play'&&e.path===firstChoice.audioPath);
    expect(started.time-ended.time).toBeGreaterThanOrEqual(1950);
    const plays=events.filter(e=>e.type==='play');
    for(let i=1;i<plays.length;i++){
      if(!choices.some(choice=>choice.audioPath===plays[i].path))continue;
      const previous=events.find(e=>e.type==='ended'&&e.path===plays[i-1].path);
      const gap=plays[i].time-previous.time;
      expect(gap).toBeGreaterThanOrEqual(i===plays.length-choices.filter(c=>c.audioPath).length?1950:1450);
      expect(gap).toBeLessThan(2300);
    }
    await page.getByRole('button',{name:`Hear answer ${choices.indexOf(firstChoice)+1}`,exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.classAudioEvents.filter(e=>e.type==='play').at(-1).path)).toBe(firstChoice.audioPath);
  }
});

test('the listening passage and blending phonemes remain audible',async({page})=>{
  test.setTimeout(120000);
  await auditNativeAudio(page);
  for (const role of ['passage', 'phoneme']) {
    const item = bank.find(row => row.mediaReady && row.requiredAudioCues.some(cue => cue.role === role));
    await page.goto(`/tests/fixtures/literacy-mock.html?mode=format&version=literacy-mock-v14&item=${encodeURIComponent(item.id)}`);
    await page.getByRole('button', {name:'Listen to the question',exact:true}).click();
    await expectCompleteNarration(page, {item, seed:'browser-format'});
  }
});

test('a failed required recording blocks checking and can be replayed successfully',async({page})=>{
  test.setTimeout(90000);
  await page.route('**/*.mp3',route=>route.abort());
  await openPractice(page);
  await expect(page.getByText('A picture or recording did not load. This question will not count.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeDisabled();
  await page.unroute('**/*.mp3');
  await page.getByRole('button',{name:'Try sound again',exact:true}).click();
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeEnabled({timeout:60000});
  await expect(page.locator('.whole-class-teacher-script')).toHaveCount(0);
});

test('a broken required picture blocks checking and skipping it cannot promote difficulty',async({page})=>{
  const broken = opening('vocabulary').item.requiredImagePaths[0];
  await page.route('**' + broken, route=>route.abort());
  await openPractice(page,'vocabulary');
  await expect(page.getByText('A picture or recording did not load. This question will not count.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Go to another question',exact:true}).click();
  await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible();
  await expect(page.locator('img').filter({visible:true}).first()).toBeVisible();
  await expect(page.locator(`img[src="${broken}"]`)).toHaveCount(0);
});


test('padded answer clips start with speech and retain consistent gaps after network preloading',async({page},info)=>{
  test.setTimeout(90000);
  const fixture = opening();
  const {item,seed} = fixture;
  const choices = mockChoices(item,seed);
  const clip=choices.find(choice=>choice.audioPath).audioPath;
  const padded=spawnSync('ffmpeg',['-v','error','-i',path.join(process.cwd(),'public',clip),'-af','adelay=2000,apad=pad_dur=2','-f','wav','pipe:1']);
  expect(padded.status).toBe(0);
  await page.route(`**${clip}`,async route=>{
    await new Promise(resolve=>setTimeout(resolve,700));
    await route.fulfill({body:padded.stdout,contentType:'audio/wav'});
  });
  await page.route('**/preview/teacher-a11y.html**',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,headers:{...response.headers(),'Content-Security-Policy':"media-src 'self' blob:"}});
  });
  await auditNativeAudio(page);
  await page.addInitScript(()=>{
    window.preparedSignals=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      const source=this.src;
      if(source.startsWith('blob:') && !source.endsWith('#mock-audio-unlock'))void fetch(source).then(r=>r.arrayBuffer()).then(async bytes=>{
        const decoded=await new OfflineAudioContext(1,1,48000).decodeAudioData(bytes);
        const samples=decoded.getChannelData(0);
        const first=samples.findIndex(value=>Math.abs(value)>0.001);
        let last=samples.length-1;while(last>first&&Math.abs(samples[last])<=0.001)last--;
        window.preparedSignals.push({path:decodeURIComponent(new URL(source).hash.slice(1)),
          leading:first/decoded.sampleRate,trailing:(samples.length-last-1)/decoded.sampleRate,duration:decoded.duration});
      });
      return original.apply(this,args);
    };
  });
  await openPractice(page);
  const {events}=await expectCompleteNarration(page,fixture);
  const signals=await page.evaluate(()=>window.preparedSignals);
  expect(signals.length).toBeGreaterThanOrEqual(choices.length);
  for(const signal of signals){expect(signal.leading).toBeLessThanOrEqual(0.016);expect(signal.trailing).toBeLessThanOrEqual(0.031);}
  expect(signals.find(signal=>signal.path===clip).duration).toBeLessThan(2);
  const evidence=JSON.stringify({signals,events},null,2);
  fs.writeFileSync(info.outputPath('speech-and-gaps.json'),evidence);
  await info.attach('prepared-speech-and-real-gaps',{body:evidence,contentType:'application/json'});
  for(const choice of choices){
    const index=events.findIndex(event=>event.type==='play'&&event.path===choice.audioPath);
    const gap=events[index].time-events[index-1].time;
    expect(gap).toBeGreaterThanOrEqual(choice===choices[0]?1950:1450);expect(gap).toBeLessThan(2300);
  }
});

test('retained pupil audio plays offline under the production media and connection policy',async({page,context})=>{
  test.setTimeout(90000);
  await page.route('**/preview/teacher-a11y.html**',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,headers:{...response.headers(),'Content-Security-Policy':"media-src 'self' blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co"}});
  });
  await auditNativeAudio(page);
  const fixture = await openPractice(page);
  const {item} = fixture;
  await expectCompleteNarration(page,fixture);
  const clip=item.requiredAudioCues.find(cue=>cue.role==='choice').path;
  await page.evaluate(async clip=>{
    const [{createMockOfflineMedia},{prepareMockAudio},{getMockAudioElement}]=await Promise.all([
      import('/src/utils/literacyMockOfflineMedia.js'),import('/src/utils/mockAudioPreparation.js'),import('/src/utils/mockAudioElement.js')]);
    const media=await createMockOfflineMedia([clip]);await media.ensure([clip]);
    window.playRetainedCue=async()=>{
      const preparation=prepareMockAudio([{path:clip}],media.resolve),sources=await preparation.ready;
      const source=sources.get(clip);if(source.error)throw source.error;
      const audio=getMockAudioElement(()=>{});
      try{return await new Promise((resolve,reject)=>{
        audio.onended=()=>resolve({ended:true,seconds:audio.currentTime});audio.onerror=reject;
        audio.src=source.src;audio.play().catch(reject);
      });}finally{audio.pause();audio.onended=audio.onerror=null;preparation.dispose();media.dispose();}
    };
  },clip);
  // WebKit's blanket offline emulation also disables in-memory Blob I/O.
  // Deny every real network request while retaining local media semantics.
  await context.route(/^https?:\/\//,route=>route.abort());
  expect(await page.evaluate(()=>fetch('/offline-network-probe').then(()=>false,()=>true))).toBe(true);
  const receipt=await page.evaluate(()=>window.playRetainedCue());
  expect(receipt.ended).toBe(true);expect(receipt.seconds).toBeGreaterThan(0.05);
});
