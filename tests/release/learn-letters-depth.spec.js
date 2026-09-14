import { expect, test } from '@playwright/test';
import { buildLetterPracticeQuestions } from '../../src/data/letterPractice.js';
import { LETTER_PRACTICE_VERSION } from '../../src/policy/letterPractice.js';

const progressKey='lp_phonics_progress_child-surface-preview';
const sessionKey=`${progressKey}:practice-session-v1`;
const route='/preview/child-surfaces.html?surface=phonics';
const capturedModes=new Set();
async function openLetter(page,letter='A') {
  await page.getByRole('button',{name:new RegExp(`^Letter ${letter}(?:,|$)`)}).click();
}
async function trace(page) {
  await expect(page.locator('.phonics-trace-pad')).toBeVisible();
  const skip=page.getByRole('button',{name:'Skip',exact:true});
  if(await skip.isVisible()) await skip.click();
  await expect(page.getByRole('button',{name:/^Trace stroke/})).toBeVisible();
  for(let stroke=0;stroke<5;stroke++) {
    const button=page.getByRole('button',{name:/^Trace stroke/});
    if(!await button.count()) break;
    const label=await button.innerText();
    await button.click();
    await expect(page.getByRole('button',{name:label,exact:true})).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Next Step',exact:true}).click();
}
async function getQuestion(page,letter) {
  const session=await page.evaluate(({sessionKey,letter})=>JSON.parse(localStorage.getItem(sessionKey))[letter],{sessionKey,letter});
  const questions=buildLetterPracticeQuestions({letter,round:session.round,step:session.step,seed:session.seed,reviewLetters:session.reviewLetters});
  return questions[session.checkpoint?.answers?.length||0];
}
async function answerQuestions(page,letter) {
  const label=await page.locator('.phonics-practice-question-heading p').innerText();
  const [start,total]=label.match(/\d+/g).map(Number);
  for(let index=start;index<=total;index++) {
    const question=await getQuestion(page,letter);
    if(!capturedModes.has(question.mode)) {
      await page.screenshot({path:`.artifacts/learn-letters/activity-${question.mode}.png`});
      capturedModes.add(question.mode);
    }
    await page.getByRole('button',{name:`Choose ${question.answer}`,exact:true}).click();
    await expect(page.locator(`[data-practice-question="${question.id}"]`)).toHaveCount(0);
  }
}

test('a child completes all five rounds, resumes inside a round and earns one finished letter',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:1024,height:768});
  await page.goto(route);
  await openLetter(page);
  await expect(page.locator('.phonics-round-label')).toContainText('Round 1 of 5');
  await trace(page);
  await page.getByRole('button',{name:'Hear the word ant',exact:true}).click();
  await page.getByRole('button',{name:'Next Step',exact:true}).click();
  for(const word of ['apple','ant','axe','alligator']) await page.getByRole('button',{name:`Word tile: ${word}`,exact:true}).click();
  await expect(page.getByRole('heading',{name:'Round complete!',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back to letters',exact:true}).last().click();
  const a=page.getByRole('button',{name:/^Letter A(?:,|$)/});
  await expect(a).toHaveAttribute('aria-description','1 of 5 rounds');
  await expect(a).not.toHaveClass(/completed/);
  await openLetter(page);
  await expect(page.locator('.phonics-round-label')).toContainText('Round 2 of 5');
  await trace(page);
  const first=await getQuestion(page,'A');
  await page.getByRole('button',{name:'Hear the question',exact:true}).click();
  await expect(page.locator('.phonics-practice-question')).toHaveAttribute('data-audio-delivery','delivered',{timeout:20000});
  const wrong=first.options.find(option=>option.id!==first.answer);
  await page.getByRole('button',{name:`Choose ${wrong.id}`,exact:true}).click();
  await expect(page.locator('.phonics-practice-feedback')).toContainText(`That is ${wrong.label}`);
  await expect(page.getByRole('button',{name:`Choose ${first.answer}`,exact:true})).toBeEnabled();
  await page.getByRole('button',{name:`Choose ${first.answer}`,exact:true}).click();
  await expect(page.locator(`[data-practice-question="${first.id}"]`)).toHaveCount(0);
  const second=await getQuestion(page,'A');
  await page.reload();
  await openLetter(page);
  await expect(page.locator('.phonics-practice-question')).toHaveAttribute('data-practice-question',second.id);
  await expect(page.locator('.phonics-practice-question-heading p')).toHaveText('2 of 8');
  for(let round=2;round<=5;round++) {
    if(round>2) await trace(page);
    await answerQuestions(page,'A');
    // Step 3 mounts after the transition out of step 2.
    await expect(page.locator('.phonics-practice-question')).toBeVisible();
    await answerQuestions(page,'A');
    await expect(page.getByRole('heading',{name:round===5?'Five rounds complete!':'Round complete!',exact:true})).toBeVisible();
    if(round<5) await page.getByRole('button',{name:'Next round',exact:true}).click();
  }
  const events=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.completions,progressKey);
  expect(events).toHaveLength(5);
  expect(new Set(events.map(event=>event.steps[0].practiceRound)).size).toBe(5);
  expect(events.every(event=>event.contentVersion===LETTER_PRACTICE_VERSION&&event.steps.length===3)).toBe(true);
  expect(events.every(event=>event.steps.every(step=>step.independent===false))).toBe(true);
  expect(events[1].steps[1].questions[0].firstResponse.correct).toBe(false);
  expect(events[1].steps[1].questions[0].options).toHaveLength(3);
  expect(events[1].steps[1].questions[0].instructionSource).toContain('listen-tap-the-picture');
  await page.getByRole('button',{name:'Learn Another Letter',exact:true}).click();
  await expect(a).toHaveClass(/completed/);
  await expect(a).toHaveAttribute('aria-description','5 of 5 rounds');
  await page.reload();await openLetter(page);
  await expect(page.locator('.phonics-round-label')).toContainText('Round 1 of 5');
});

for(const letter of ['Q','X']) test(`previously finished ${letter} opens four more rounds with supported audio recovery`,async({page})=>{
  await page.setViewportSize({width:768,height:1024});
  await page.addInitScript(({progressKey,letter})=>localStorage.setItem(progressKey,JSON.stringify({[letter]:'completed'})),{progressKey,letter});
  await page.route('**/*.mp3',route=>route.abort());
  await page.goto(route);await openLetter(page,letter);await trace(page);
  const question=await getQuestion(page,letter);
  await expect(page.locator('.phonics-practice-word-model')).toBeVisible();
  await expect(page.locator('.phonics-practice-audio')).toContainText('Tap to hear again');
  await expect(page.getByRole('button',{name:`Choose ${question.answer}`,exact:true})).toBeEnabled();
  await page.getByRole('button',{name:`Choose ${question.answer}`,exact:true}).click();
  await expect(page.locator(`[data-practice-question="${question.id}"]`)).toHaveCount(0);
});

for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:1366,height:768},{width:568,height:320},{width:320,height:568}]) {
  test(`extended lesson fits ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.addInitScript(({progressKey,sessionKey,version})=>{
      localStorage.setItem(progressKey,JSON.stringify({A:'completed'}));
      localStorage.setItem(sessionKey,JSON.stringify({A:{version,round:2,step:2,evidence:[{practiceStep:1}],seed:'viewport',reviewLetters:[]}}));
    },{progressKey,sessionKey,version:LETTER_PRACTICE_VERSION});
    await page.goto(route);await openLetter(page);
    await expect(page.locator('.phonics-practice-question')).toBeVisible();
    const options=page.locator('.phonics-practice-option');
    const tabs=await page.locator('.kg-tabbar').boundingBox();
    for(const option of await options.all()) {
      const box=await option.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
      expect(box.y+box.height).toBeLessThanOrEqual(tabs.y+1);
      const picture = option.locator('img');
      await expect.poll(() => picture.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      const imageBox = await picture.boundingBox();
      expect(imageBox.x).toBeGreaterThanOrEqual(box.x);
      expect(imageBox.y).toBeGreaterThanOrEqual(box.y);
      expect(imageBox.x+imageBox.width).toBeLessThanOrEqual(box.x+box.width);
      expect(imageBox.y+imageBox.height).toBeLessThanOrEqual(box.y+box.height);
      expect(imageBox.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({path:`.artifacts/learn-letters/practice-${viewport.width}x${viewport.height}.png`});
  });
}

for (const viewport of [{width:320,height:568},{width:568,height:320},{width:1024,height:768}]) {
  test(`case matching and visible help fit ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.addInitScript(({progressKey,sessionKey,version})=>{
      localStorage.setItem(progressKey,JSON.stringify({A:'completed'}));
      localStorage.setItem(sessionKey,JSON.stringify({A:{version,round:2,step:3,evidence:[{practiceStep:1},{practiceStep:2}],seed:'mixed-viewport',reviewLetters:[]}}));
    },{progressKey,sessionKey,version:LETTER_PRACTICE_VERSION});
    await page.goto(route);await openLetter(page);
    await expect(page.locator('.phonics-practice-letter-model')).toBeVisible();
    const checkFit=async()=>{
      const tabs=await page.locator('.kg-tabbar').boundingBox();
      for(const control of await page.locator('.phonics-practice-option, .phonics-practice-audio button, .phonics-practice-letter-model, .phonics-practice-word-model').all()) {
        const box=await control.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
        expect(box.y+box.height).toBeLessThanOrEqual(tabs.y+1);
      }
      const heading=await page.locator('.phonics-practice-question-heading').boundingBox();
      const replay=await page.getByRole('button',{name:'Hear the question'}).boundingBox();
      expect(replay.y).toBeGreaterThanOrEqual(heading.y+heading.height);
    };
    await checkFit();
    await page.screenshot({path:`.artifacts/learn-letters/case-match-${viewport.width}x${viewport.height}.png`});
    // A supported recovery must fit too, with the correction and target visible.
    const question=await getQuestion(page,'A');
    const wrong=question.options.find(option=>option.id!==question.answer);
    await page.getByRole('button',{name:`Choose ${wrong.id}`,exact:true}).click();
    await checkFit();
  });
}

test('lowercase tracing requires the complete shape and accepts pointer strokes',async({page})=>{
  await page.setViewportSize({width:768,height:1024});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(key=>localStorage.setItem(key,JSON.stringify({B:'completed'})),progressKey);
  await page.goto(route);await openLetter(page,'B');
  await expect(page.locator('.phonics-round-label')).toContainText('Round 2 of 5');
  await expect(page.locator('.phonics-step')).toContainText('Trace b.');
  const paths=await page.locator('.phonics-trace-pad svg').evaluate(svg=>{
    const matrix=svg.getScreenCTM();
    return [...svg.querySelectorAll('.phonics-trace-demo-layer path')].map(path=>
      Array.from({length:51},(_,index)=>{
        const point=path.getPointAtLength(index/50*path.getTotalLength());
        const transformed=new DOMPoint(point.x,point.y).matrixTransform(matrix);
        return {x:transformed.x,y:transformed.y};
      })
    );
  });
  expect(paths.length).toBeGreaterThan(0);
  await page.mouse.click(paths[0][0].x,paths[0][0].y);
  await expect(page.getByRole('button',{name:'Next Step',exact:true})).toHaveCount(0);
  for(const points of paths) {
    await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();
    for(const point of points.slice(1)) await page.mouse.move(point.x,point.y);
    await page.mouse.up();
  }
  await expect(page.getByRole('button',{name:'Next Step',exact:true})).toBeVisible();
  await page.screenshot({path:'.artifacts/learn-letters/lowercase-b-traced.png'});
});

for(const viewport of [{width:1280,height:720},{width:1024,height:768},{width:320,height:568},{width:568,height:320}]) {
  test(`tracing instructions and controls stay separate at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.addInitScript(key=>localStorage.setItem(key,JSON.stringify({A:'completed'})),progressKey);
    await page.goto(route);await openLetter(page);
    await expect(page.locator('.phonics-step-tracer')).toHaveCSS('opacity','1');
    const pad=await page.locator('.phonics-trace-pad').boundingBox();
    const heading=await page.locator('.phonics-step-heading').boundingBox();
    const status=await page.locator('.phonics-step-status').boundingBox();
    const tabs=await page.locator('.kg-tabbar').boundingBox();
    await page.screenshot({path:`.artifacts/learn-letters/tracing-fit-${viewport.width}x${viewport.height}.png`});
    expect(Math.abs(pad.width-pad.height)).toBeLessThan(1);
    expect(pad.width).toBeGreaterThanOrEqual(80);
    expect(pad.y+pad.height).toBeLessThanOrEqual(tabs.y);
    if(viewport.height>500) {
      expect(pad.y).toBeGreaterThanOrEqual(heading.y+heading.height);
      expect(pad.y+pad.height).toBeLessThanOrEqual(status.y);
    } else expect(pad.x).toBeGreaterThanOrEqual(heading.x+heading.width);
    for(const button of await page.locator('.phonics-step-actions button').all()) {
      const box=await button.boundingBox();
      expect(box.y+box.height).toBeLessThanOrEqual(tabs.y);
    }
  });
}
