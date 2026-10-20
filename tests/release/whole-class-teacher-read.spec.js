import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_RUNTIME_V11 as bank } from '../../src/data/generated/literacyMockRuntimeV11.generated.js';
import { createWholeClassMockSession } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

const seed='class-practice:teacher-read-browser';
async function openPractice(page,area='sound_awareness',band='adaptive') {
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:()=> 'teacher-read-browser'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption(area);
  if(band!=='adaptive') await page.getByRole('combobox',{name:'Practice step',exact:true}).selectOption(band);
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  return createWholeClassMockSession(bank,{area,band,seed,count:12}).rounds[0];
}

test('class practice has a complete shuffled teacher script and needs no recording downloads or playback',async({page})=>{
  const media=[];
  await page.addInitScript(()=>{
    window.classPlaybackCalls=0;
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){window.classPlaybackCalls++;return original.apply(this,args);};
  });
  await page.route('**/*.mp3',route=>{media.push(route.request().url());return route.abort();});
  const item=await openPractice(page);
  const script=page.getByRole('region',{name:'Teacher reading script',exact:true});
  await expect(script).toBeVisible();
  for(const cue of item.requiredAudioCues.filter(cue=>cue.role!=='choice'))
    await expect(script).toContainText(cue.text);
  const choices=mockChoices(item,`${seed}:0`);
  const spoken=choices.flatMap((choice,index)=>item.requiredAudioCues
    .filter(cue=>cue.role==='choice'&&cue.choiceId===choice.id).map(cue=>`${index+1}. ${cue.text}`));
  await expect(script.locator('.whole-class-script-choice')).toHaveText(spoken);
  await expect(page.getByRole('button',{name:'Listen to the question',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Hear answer/})).toHaveCount(0);
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled({timeout:2000});
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.locator('.whole-class-feedback')).toBeVisible();
  expect(media).toEqual([]);
  expect(await page.evaluate(()=>window.classPlaybackCalls)).toBe(0);
  await page.getByText('Teacher script · recordings off',{exact:true}).click();
  await expect(script).not.toBeVisible();
});

test('teacher script preserves silent decoding choices and lets the class read printed passages',async({page})=>{
  const item=await openPractice(page,'reading','2');
  const script=page.getByRole('region',{name:'Teacher reading script',exact:true});
  await expect(script).toBeVisible();
  await expect(script).toContainText('Read the passage in the box. Then answer this question.');
  await expect(script).not.toContainText(item.passage);
  await expect(script.locator('.whole-class-script-choice')).toHaveCount(0);
  await expect(script).toContainText('Let the class read the printed answer choices.');
});

test('teacher script gives the complete listening passage rather than only the visible short prompt',async({page})=>{
  const item=await openPractice(page,'listening','3');
  const script=page.getByRole('region',{name:'Teacher reading script',exact:true});
  await expect(script).toContainText(item.passage);
  await expect(script).toContainText(item.prompt);
});

test('the blending script asks for separate sounds and identifies the short vowel',async({page})=>{
  await openPractice(page,'sound_awareness','4');
  const script=page.getByRole('region',{name:'Teacher reading script',exact:true});
  await expect(script.locator('.whole-class-script-line')).toHaveText([
    'Listen to the sounds. Which word do they make?',
    'Sound, not letter name: /sh/',
    'Sound, not letter name: /i/ (short vowel)',
    'Sound, not letter name: /p/'
  ]);
});

test('teacher-read practice still blocks a broken required picture and can choose another question',async({page})=>{
  await page.route('**/images/**',route=>route.abort());
  await openPractice(page,'vocabulary');
  await expect(page.getByText('A picture or teacher script did not load. Choose another question.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Go to another question',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Practice question 2 of 12',exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-practice-step')).toContainText('First steps');
});

test('teacher-read cannot bypass required audio in an individual learner question',async({page})=>{
  const item=bank.find(item=>item.adaptiveMixedEligible&&item.domainId==='phonics'&&item.adaptiveAreaBand===0);
  const media=[];
  await page.route('**/*.mp3',route=>{media.push(route.request().url());return route.abort();});
  await page.goto(`/tests/fixtures/literacy-mock.html?mode=format&version=literacy-mock-v11&teacherRead&item=${encodeURIComponent(item.id)}`);
  await expect(page.getByRole('button',{name:'Listen to the question',exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeDisabled();
  await expect.poll(()=>media.length).toBeGreaterThan(0);
});
