import { expect, test } from '@playwright/test';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildCyclePlan, cycleStorageKey } from '../../src/components/cycle-practice/cyclePracticeState.js';
import { CYCLE_ACTIVITY_REVISION,CYCLE_PRACTICE_VERSION } from '../../src/policy/cyclePracticePolicy.js';
import { getQuestionAnswer } from '../../src/appState/assessmentRuntime.js';
import { STUDENT_MINIMUM_TARGET_PX } from '../../src/policy/studentDeviceMatrix.js';

test.describe.configure({ timeout: 90000 });
async function audio(page) {
 await page.addInitScript(() => {
 window.__learningAudio=[];
 window.Audio=class extends EventTarget {
 constructor(){super();this.src='';this.readyState=4;this.paused=true;this.volume=1;this.duration=.01;this.currentTime=0;}
 load(){this.dispatchEvent(new Event('canplay'));}
 play(){this.paused=false;window.__learningAudio.push(this.src);this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},10);return Promise.resolve();}
 pause(){clearTimeout(this.timer);this.paused=true;}
 };
 });
 page.on('pageerror',error=>{throw error;});
}
async function skillsAudio(page) {
 await audio(page);
 await page.addInitScript(()=>{crypto.randomUUID=()=> 'test-session';});
}
async function model(page) {
 const card=page.locator('[data-learning-phase]'); await expect(card).toBeVisible();
 const owner=await card.getAttribute('data-learning-episode');
 expect(await card.textContent()).not.toContain('[object Object]');
 for(let i=0;i<15&&await card.count()&&await card.getAttribute('data-learning-episode')===owner;i++){
 const enabled=card.locator('[data-guided-model]:enabled'); if(!await enabled.count()) break;
 await enabled.first().click();
 }
}
test('Skills teaching action clears the fixed navigation without scrolling at 1280x720',async({page},info)=>{
 await page.setViewportSize({width:1280,height:720});await skillsAudio(page);
 await page.goto('/preview/child-surfaces.html?surface=skills-practice&preserveSkills=1');
 await page.locator('[data-child-primary]').click();
 await expect(page.locator('.skills-practice-play')).toHaveAttribute('data-skills-practice-ready','true');
 const key='literacy-guide-learn-games:child-surface-preview';
 const question=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.responseEpisode.question,key);
 const choices=page.locator('.assessment-answer-card,.ixl-answer-button,.visual-assessment-card-button');
 const labels=await choices.allTextContents();
 const wrong=labels.findIndex(label=>label.trim()!==String(getQuestionAnswer(question)));
 expect(wrong).toBeGreaterThanOrEqual(0);
 await choices.nth(wrong).click();
 expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.responseEpisode.firstResponse,key)).isCorrect).toBe(false);
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 const action=await page.locator('[data-guided-model]:enabled').first().boundingBox();
 const navigation=await page.getByRole('navigation',{name:'Where to go'}).boundingBox();
 expect(action.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
 expect(action.y+action.height).toBeLessThanOrEqual(navigation.y);
 expect(await page.locator('.skills-practice-play').evaluate(element=>element.scrollTop)).toBe(0);
 expect(await page.locator('.learning-teaching-card').evaluate(element=>element.scrollTop)).toBe(0);
 await page.screenshot({path:info.outputPath('skills-teaching-action-visible.png')});
});
test('Skills wrong first remains frozen after reload and guided transfer',async({page})=>{
 await skillsAudio(page); await page.goto('/preview/child-surfaces.html?surface=skills-practice&preserveSkills=1');
 await page.locator('[data-child-primary]').click();
 await expect(page.locator('.skills-practice-play')).toHaveAttribute('data-skills-practice-ready','true');
 const key='literacy-guide-learn-games:child-surface-preview';
 const session=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice,key);
 const q=session.responseEpisode.question; const expected=getQuestionAnswer(q);
 const choices=page.locator('.assessment-answer-card,.ixl-answer-button,.visual-assessment-card-button');
 const labels=await choices.allTextContents();
 const index=labels.findIndex(label=>label.trim()!==String(expected));
 await choices.nth(index).click();
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 const first=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.responseEpisode.firstResponse,key);
 expect(first.isCorrect).toBe(false);
 await page.reload(); await page.getByRole('button',{name:/Carry on/}).click();
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible(); await model(page);
 const next=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.responseEpisode,key);
 expect(next.role).toBe('transfer'); expect(next.firstResponse).toEqual(first); expect(next.question.id).not.toBe(q.id);
 await expect(page.locator('.skills-practice-play')).toHaveAttribute('data-skills-practice-ready','true');
});
test('Cycle wrong option moves to modeled work and a new transfer with saved original evidence',async({page})=>{
 await audio(page);
 const cycle=elSkillsBlockCycles.find(c=>c.id==='cycle-1');const seed='response-cycle';const rounds=buildCyclePlan(cycle,seed).rounds;
 const index=rounds.findIndex(round=>['pictureSound','letterMatch'].includes(round.mechanicId));const round=rounds[index];
 const storageKey=cycleStorageKey('child-surface-preview',undefined,'cycle-1');
 await page.addInitScript(({storageKey,state})=>localStorage.setItem(storageKey,JSON.stringify(state)),{storageKey,state:{version:CYCLE_PRACTICE_VERSION,activityRevision:CYCLE_ACTIVITY_REVISION,practiceSeed:seed,attemptId:'response-test',mode:'practice',practiceIndex:index,pass:0,assessmentIndex:0,assessmentRecords:[],practiceRecords:[],attempts:0,result:null,pendingAttempt:null,paused:false,earnedCount:0,clock:{activePracticeSeconds:0,sessionElapsedSeconds:0,checkSeconds:0}}});
 await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced');
 const wrong=round.choices.find(choice=>String(choice.value)!==String(round.answer));
 await expect(page.getByRole('button',{name:wrong.label,exact:true})).toBeEnabled(); await page.getByRole('button',{name:wrong.label,exact:true}).click();
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
 expect(saved.practiceRecords).toHaveLength(1);expect(saved.responseEpisode.firstResponse.isCorrect).toBe(false);
 await model(page);
 const transfer=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).responseEpisode,storageKey);
 expect(transfer.role).toBe('transfer');expect(transfer.question.targetWord).not.toBe(round.targetWord);expect(transfer.firstResponse).toEqual(saved.responseEpisode.firstResponse);
});
test('Adventure keeps a first miss through teaching reload and never reopens the same scored board',async({page})=>{
 await audio(page); await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=letters&preserveAdventure=1');
 const board=page.locator('[data-mechanic-stage="letter-press"]'); await expect(board).toBeVisible();
 const wrong=board.getByRole('button').filter({hasText:/./}).first();
 const labels=await board.getByRole('button').allTextContents();
 const modelLetter=await page.locator('.am-letter-press-signs strong').first().textContent().catch(()=>null);
 const wrongIndex=labels.findIndex(label=>label.trim().toLowerCase()!==modelLetter?.trim().toLowerCase());
 await (wrongIndex>=0?board.getByRole('button').nth(wrongIndex):wrong).click();
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 const key='lp-el-quest:child-surface-preview';const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).learningCheckpoint,key);
 expect(before.episode.firstResponse.isCorrect).toBe(false);
 await page.reload();await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible();
 await model(page);const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).learningCheckpoint,key);
 expect(after.runState.firstAttempts[0]).toBe(false);
 expect(after.episode.role).toBe('transfer');expect(after.episode.firstResponse).toEqual(before.episode.firstResponse);
});

for (const viewport of [{width:1024,height:768},{width:768,height:1024},{width:320,height:568}]) {
 test(`Cycle bounded recovery and visible modeled action at ${viewport.width}x${viewport.height}`, async({page},info)=>{
  await page.setViewportSize(viewport);await audio(page);
  const cycle=elSkillsBlockCycles.find(c=>c.id==='cycle-1'), seed='response-cycle';
  const rounds=buildCyclePlan(cycle,seed).rounds,index=rounds.findIndex(round=>round.mechanicId==='pictureSound'),round=rounds[index];
  const key=cycleStorageKey('child-surface-preview',undefined,'cycle-1');
  await page.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));},{key,state:{version:CYCLE_PRACTICE_VERSION,activityRevision:CYCLE_ACTIVITY_REVISION,practiceSeed:seed,attemptId:'bounded-response',mode:'practice',practiceIndex:index,pass:0,assessmentIndex:0,assessmentRecords:[],practiceRecords:[],attempts:0,result:null,pendingAttempt:null,paused:false,earnedCount:0,clock:{activePracticeSeconds:0,sessionElapsedSeconds:0,checkSeconds:0}}});
  await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced');
  const wrong=round.choices.find(choice=>choice.value!==round.answer);await page.getByRole('button',{name:wrong.label,exact:true}).click();
  await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
  const target=page.locator('[data-guided-model]:enabled').first();await target.scrollIntoViewIfNeeded();
  const bounds=await target.boundingBox();expect(bounds.height).toBeGreaterThanOrEqual(56);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
  await page.screenshot({path:info.outputPath(`teaching-${viewport.width}.png`)});
  await model(page);
  const episode=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).responseEpisode,key);expect(episode.role).toBe('transfer');
  const nextWrong=episode.question.choices.find(choice=>choice.value!==episode.question.answer);
  await expect(page.getByRole('button',{name:nextWrong.label,exact:true})).toBeEnabled();await page.getByRole('button',{name:nextWrong.label,exact:true}).click();
  await expect(page.locator('[data-learning-phase="finish_teaching"]')).toBeVisible({timeout:15000});
  await model(page);const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  expect(saved.earnedCount).toBe(1);expect(saved.practiceIndex).toBe(index+1);
  expect(saved.learningResponses.filter(event=>event.learningEpisode.phase==='complete').at(-1).learningEpisode.responses).toHaveLength(2);
  await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible();
  expect(saved.responseEpisode?.modelFirst || saved.modelNext).toBe(true);
  await page.reload();await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible();
  expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).earnedCount).toBe(1);
 });
}

test('Cycle save failure holds the exact first answer and retries before teaching',async({page})=>{
 await audio(page);
 const cycle=elSkillsBlockCycles.find(c=>c.id==='cycle-1'),seed='response-cycle',rounds=buildCyclePlan(cycle,seed).rounds;
 const index=rounds.findIndex(round=>round.mechanicId==='pictureSound'),round=rounds[index],key=cycleStorageKey('child-surface-preview',undefined,'cycle-1');
 await page.addInitScript(({key,state})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(storageKey,value){if(window.__failLearningSave&&storageKey===key)throw new Error('Simulated storage failure');return original.call(this,storageKey,value);};
 },{key,state:{version:CYCLE_PRACTICE_VERSION,activityRevision:CYCLE_ACTIVITY_REVISION,practiceSeed:seed,attemptId:'save-response',mode:'practice',practiceIndex:index,pass:0,assessmentIndex:0,assessmentRecords:[],practiceRecords:[],attempts:0,result:null,pendingAttempt:null,paused:false,earnedCount:0,clock:{activePracticeSeconds:0,sessionElapsedSeconds:0,checkSeconds:0}}});
 await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced');
 await page.evaluate(()=>{window.__failLearningSave=true;});
 const wrong=round.choices.find(choice=>choice.value!==round.answer);
 await page.getByRole('button',{name:wrong.label,exact:true}).click();
 await expect(page.getByRole('button',{name:'Retry saving',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:wrong.label,exact:true})).toBeDisabled();
 expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).practiceRecords).toHaveLength(0);
 await page.evaluate(()=>{window.__failLearningSave=false;});
 await page.getByRole('button',{name:'Retry saving',exact:true}).click();
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 expect(saved.practiceRecords).toHaveLength(1);expect(saved.responseEpisode.responses).toHaveLength(1);
 expect(saved.responseEpisode.firstResponse.selected).toBe(wrong.value);expect(saved.responseEpisode.firstResponse.isCorrect).toBe(false);
});

test('Skills receipt saves foreground remainder and stays frozen while hidden',async({page})=>{
 await skillsAudio(page);await page.goto('/preview/child-surfaces.html?surface=skills-practice&preserveSkills=1');
 await page.locator('[data-child-primary]').click();await expect(page.locator('.skills-practice-play')).toHaveAttribute('data-skills-practice-ready','true');
 const key='literacy-guide-learn-games:child-surface-preview';
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice,key),expected=getQuestionAnswer(saved.responseEpisode.question);
 const choices=page.locator('.assessment-answer-card,.ixl-answer-button,.visual-assessment-card-button'),labels=await choices.allTextContents();
 await choices.nth(labels.findIndex(label=>label.trim()!==String(expected))).click();await expect(page.locator('.assessment-feedback')).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 const remainder=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.feedbackRemainingMs,key);
 expect(remainder).toBeGreaterThan(1500);expect(remainder).toBeLessThanOrEqual(3200);
 await page.waitForTimeout(750);await expect(page.locator('.assessment-feedback')).toBeVisible();
 await page.reload();await page.getByRole('button',{name:/Carry on/}).click();await expect(page.locator('.assessment-feedback')).toBeVisible();
 await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 const episode=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.responseEpisode,key);
 expect(episode.responses).toHaveLength(1);expect(episode.firstResponse.isCorrect).toBe(false);
});
test('Skills modeled cursor save failure retries the held action into fresh transfer',async({page})=>{
 await skillsAudio(page);await page.goto('/preview/child-surfaces.html?surface=skills-practice&preserveSkills=1');await page.locator('[data-child-primary]').click();
 await expect(page.locator('.skills-practice-play')).toHaveAttribute('data-skills-practice-ready','true');
 const key='literacy-guide-learn-games:child-surface-preview';
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice,key),expected=getQuestionAnswer(saved.responseEpisode.question);
 const choices=page.locator('.assessment-answer-card,.ixl-answer-button,.visual-assessment-card-button'),labels=await choices.allTextContents();
 await choices.nth(labels.findIndex(label=>label.trim()!==String(expected))).click();await expect(page.locator('[data-learning-phase="teaching"]')).toBeVisible({timeout:15000});
 await page.evaluate(key=>{window.__learningFailModel=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,value){if(k===key&&window.__learningFailModel)throw new Error('Simulated model storage failure');return original.call(this,k,value);};},key);
 await page.locator('[data-guided-model]:enabled').first().click();await expect(page.getByRole('button',{name:'Try saving again',exact:true})).toBeVisible();
 await page.evaluate(()=>{window.__learningFailModel=false;});await page.getByRole('button',{name:'Try saving again',exact:true}).click();
 const next=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).games['skills-trail'].checkpoints.practice.responseEpisode,key);
 expect(next.role).toBe('transfer');expect(next.guidedActions).toHaveLength(1);expect(next.firstResponse.isCorrect).toBe(false);
 await expect(page.locator('.skills-practice-play')).toHaveAttribute('data-skills-practice-ready','true');
});
