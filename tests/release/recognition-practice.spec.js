import { test, expect } from '@playwright/test';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const scope='literacy-guide-learn-games:fullscreen-overlay-preview';
const result=(page,game)=>page.evaluate(({scope,game})=>JSON.parse(localStorage.getItem(scope)||'{}').games?.[game],{scope,game});
// Full outings, curriculum bands, geometry, error coaching and exact replay are
// exercised by the three phonics-*-overhaul suites. These checks cover the
// shared host contracts independently of each redesigned stage.
test('completion-only engines announce replay explicitly and duplicate completion callbacks save once',async({page})=>{
 const file=`.artifacts/g10-legacy-fixture-${randomUUID()}.js`;
 await mkdir('.artifacts',{recursive:true});
 await writeFile(file,`
import React from 'react';
export default function Fixture({onComplete,onSessionStart}) {
 const [completed,setCompleted]=React.useState(false);
 return React.createElement('button',{onClick:()=>{
  if(completed){onSessionStart();setCompleted(false);}else{onComplete(1,10,1);onComplete(1,10,1);setCompleted(true);}
 }},completed?'Replay fixture':'Complete fixture run');
}`);
 try {
  await page.route('**/src/components/learn/games/games/WordRescue.jsx*',route=>route.fulfill({contentType:'application/javascript',body:`export {default} from "/${file}";`}));
  await page.goto('/preview/game-overlay.html?game=word-rescue&sound=0&music=0');
  for(let i=1;i<=2;i++) {
   await page.getByRole('button',{name:'Complete fixture run'}).click();
   expect((await result(page,'word-rescue')).plays).toBe(i);
   await page.getByRole('button',{name:'Replay fixture'}).click();
  }
 } finally { await unlink(file); }
});

test('clearing a host checkpoint discards old partial construction work',async({page})=>{
 await page.goto('/preview/game-overlay.html?game=cvc-word-builder&sound=0&music=0');
 await expect(page.locator('.pb-workbench')).toBeVisible();
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-phonics-play:fullscreen-overlay-preview:build:easy')).gameState.rounds[0].units[0].grapheme);
 await page.getByRole('button',{name:`Place ${first}`,exact:true}).click();
 await expect(page.locator('.pb-slot.is-filled')).toHaveCount(1);
 await page.evaluate(({scope})=>{const data=JSON.parse(localStorage.getItem(scope));delete data.games['cvc-word-builder'].checkpoints.easy;localStorage.setItem(scope,JSON.stringify(data));},{scope});
 await page.reload();
 await expect(page.locator('.pb-workbench')).toBeVisible();
 await expect(page.locator('.pb-slot.is-filled')).toHaveCount(0);
 const total = await page.evaluate(() => JSON.parse(localStorage.getItem('literacy-guide-phonics-play:fullscreen-overlay-preview:build:easy')).gameState.rounds.length);
  await expect(page.locator('.pb-progress')).toHaveText(`0/${total}`);
});
test('paused memory mismatch preserves the visible contrast until resuming',async({page})=>{
 await page.goto('/preview/game-overlay.html?game=sight-word-memory&sound=0&music=0');
 const cards=page.locator('.pp-memory-card');
 await expect(cards).toHaveCount(8);
 const ids=await cards.evaluateAll(es=>es.map(e=>e.dataset.pairId));
 await cards.first().click();await cards.nth(ids.findIndex(id=>id!==ids[0])).click();
 await page.getByRole('button',{name:'Close Sight Word Memory',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toBeVisible();
 await page.waitForTimeout(1400);
 await expect(page.locator('.pp-memory-card.is-revealed')).toHaveCount(2);
 await page.getByRole('button',{name:'Keep playing',exact:true}).click();
 await expect(page.locator('.pp-memory-card.is-revealed')).toHaveCount(0);
});
