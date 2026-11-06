import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V12 as bank } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';
import { createWholeClassMockSession } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { literacyMockNarrationCues } from '../../src/utils/literacyMockNarration.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

const seed='class-practice:audio-class-6';
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
async function openPractice(page,area='sound_awareness',band='adaptive') {
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:()=> 'audio-class-6'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption(area);
  if(band!=='adaptive')await page.getByRole('combobox',{name:'Practice step',exact:true}).selectOption(band);
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  return createWholeClassMockSession(bank,{area,band,seed,count:25}).rounds[0];
}
async function expectCompleteNarration(page,item) {
  const choices=mockChoices(item,`${seed}:0`);
  const expected=literacyMockNarrationCues(item,choices).map(cue=>cue.path);
  await expect.poll(()=>page.evaluate(()=>window.classAudioEvents.filter(e=>e.type==='ended').map(e=>e.path)),{timeout:60000}).toEqual(expected);
  return {choices,expected,events:await page.evaluate(()=>window.classAudioEvents)};
}

for(const area of ['sound_awareness','phonics','print','vocabulary','listening','language','reading','writing'])test(`class ${area} automatically plays its complete authored narration without a script`,async({page})=>{
  test.setTimeout(90000);
  await auditNativeAudio(page);
  const item=await openPractice(page,area);
  await expect(page.getByRole('button',{name:'Listen to the question',exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-teacher-script')).toHaveCount(0);
  if(area==='sound_awareness')await expect(page.locator('[data-child-instruction]')).toHaveText(`Which word has the same starting sound as ${item.targetWord}?`);
  await page.locator('.literacy-mock-choice').first().click();
  if(item.format==='match')await page.locator('.literacy-mock-slot').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  const {events,choices}=await expectCompleteNarration(page,item);
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled();
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
  const item=await openPractice(page,'listening','3');
  await expectCompleteNarration(page,item);
  expect(item.requiredAudioCues.some(cue=>cue.role==='passage')).toBe(true);
  await page.getByRole('button',{name:'Change practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('sound_awareness');
  await page.getByRole('combobox',{name:'Practice step',exact:true}).selectOption('4');
  await page.evaluate(()=>{window.classAudioEvents=[];});
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  const blending=createWholeClassMockSession(bank,{area:'sound_awareness',band:'4',seed,count:25}).rounds[0];
  await expectCompleteNarration(page,blending);
  expect(blending.requiredAudioCues.filter(cue=>cue.role==='phoneme').length).toBeGreaterThan(0);
});

test('a failed required recording blocks checking and can be replayed successfully',async({page})=>{
  test.setTimeout(90000);
  await page.route('**/*.mp3',route=>route.abort());
  await openPractice(page);
  await expect(page.getByText('A picture or recording did not load. Try again or choose another question.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await page.unroute('**/*.mp3');
  await page.getByRole('button',{name:'Try sound again',exact:true}).click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled({timeout:60000});
  await expect(page.locator('.whole-class-teacher-script')).toHaveCount(0);
});

test('a broken required picture blocks checking and skipping it cannot promote difficulty',async({page})=>{
  await page.route('**/images/**',route=>route.abort());
  await openPractice(page,'vocabulary');
  await expect(page.getByText('A picture or recording did not load. Try again or choose another question.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Go to another question',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Practice question 2 of 25',exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-practice-step')).toContainText('First steps');
});


test('padded answer clips start with speech and retain consistent gaps after network preloading',async({page},info)=>{
  test.setTimeout(90000);
  const item=createWholeClassMockSession(bank,{area:'sound_awareness',band:'adaptive',seed,count:25}).rounds[0];
  const choices=mockChoices(item,`${seed}:0`);
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
  const {events}=await expectCompleteNarration(page,item);
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
  const item=await openPractice(page);
  await expectCompleteNarration(page,item);
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
