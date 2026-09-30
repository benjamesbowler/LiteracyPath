import { test, expect } from "@playwright/test";
import { openAtVerifiedStation } from "./word-climb-input.js";
import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";

const games = [
  ["word-climb", "[data-wc-control='left']", "[data-wc-control='right']", "[data-wc-control='up']"],
  ["letter-leap", "[data-ll='left']", "[data-ll='right']", "[data-ll='jump']"],
  ["word-bridge", "[data-wb='left']", "[data-wb='right']", "[data-wb='action']"],
  ["reel-read", "[data-rr='left']", "[data-rr='right']", "[data-rr='cast']"],
  ["grammar-grind", "[data-gg-btn='left']", "[data-gg-btn='right']", "[data-gg-btn='push']"],
  ["star-gallery", "[data-role='turn-left']", "[data-role='turn-right']", "[data-role='move-forward']"],
  ["sound-racer", "[data-sr='left-control']", "[data-sr='right-control']"],
  ["rocket-run", "[data-rr='left-control']", "[data-rr='right-control']"]
];
for (const size of [{width:1024,height:668},{width:768,height:1024},{width:320,height:568},{width:568,height:320}]) {
  test(`motor controls occupy independent thumb zones at ${size.width}x${size.height}`, async ({page}, info) => {
    test.setTimeout(180_000);
    await page.setViewportSize(size); await page.emulateMedia({reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    for (const [id,leftSelector,rightSelector,actionSelector] of games) {
      await page.goto(`/preview/game-overlay.html?game=${id}&sound=0`);
      await page.locator(".lg-game-loading").waitFor({state:"hidden",timeout:45000});
      const left=page.locator(leftSelector), right=page.locator(rightSelector), action=actionSelector? page.locator(actionSelector):null;
      await expect(left).toBeVisible();await expect(right).toBeVisible();
      const lb=await left.boundingBox(),rb=await right.boundingBox();
      expect(lb.x+lb.width,`${id} left thumb zone`).toBeLessThan(size.width/2);
      if(action){
        const ab=await action.boundingBox();
        expect(rb.x+rb.width,`${id} steering pair stays together`).toBeLessThan(size.width/2);
        expect(ab.x,`${id} action belongs to the right thumb`).toBeGreaterThan(size.width/2);
        expect(rb.x-lb.x-lb.width,`${id} steering separation`).toBeGreaterThanOrEqual(8);
      }else expect(rb.x,`${id} right-only steering`).toBeGreaterThan(size.width/2);
      const extraSelector=id==="grammar-grind"?"[data-gg-btn='brake'], [data-gg-btn='jump']":id==="star-gallery"?"[data-role='move-back'], [data-role='cut']":null;
      const buttons=[left,right,...(action?[action]:[]),...(extraSelector?await page.locator(extraSelector).all():[])];
      for(const button of buttons){
        const box=await button.boundingBox();const floor=size.width>=768&&size.height>420?72:56;
        expect(box.width,`${id} target width`).toBeGreaterThanOrEqual(floor);
        expect(box.height,`${id} target height`).toBeGreaterThanOrEqual(floor);
        expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x+box.width).toBeLessThanOrEqual(size.width);expect(box.y+box.height).toBeLessThanOrEqual(size.height);
        expect(await button.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),`${id} control is unobscured`).toBe(true);
      }
      if(id==="star-gallery"){
        const status=await page.locator('[data-role="status-bars"]').boundingBox();
        for(const button of buttons) expect((await button.boundingBox()).y+(await button.boundingBox()).height).toBeLessThan(status.y);
      }
      await page.screenshot({path:info.outputPath(`${id}.png`)});
    }
    expect(errors).toEqual([]);
  });
}

test("Word Climb accepts two real held touches and cancels both immediately", async ({page},info)=>{
  await page.setViewportSize({width:1024,height:668});
  await page.goto("/preview/game-overlay.html?game=word-climb&sound=0");
  const game=page.locator(".word-climb");await expect(page.locator('[data-wc-scene="ready"]')).toBeVisible();
  const left=await page.locator('[data-wc-control="left"]').boundingBox(),up=await page.locator('[data-wc-control="up"]').boundingBox();
  const client=await page.context().newCDPSession(page);
  const touches=[{id:1,x:left.x+left.width/2,y:left.y+left.height/2},{id:2,x:up.x+up.width/2,y:up.y+up.height/2}];
  await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:touches});
  await expect.poll(async()=>Number(await game.getAttribute("data-world-height"))).toBeGreaterThan(80);
  expect(Number(await game.getAttribute("data-world-x"))).toBeLessThan(480);
  await client.send("Input.dispatchTouchEvent",{type:"touchCancel",touchPoints:[]});
  const height=await game.getAttribute("data-world-height"),x=await game.getAttribute("data-world-x");
  await page.waitForTimeout(350);
  await expect(game).toHaveAttribute("data-world-height",height);await expect(game).toHaveAttribute("data-world-x",x);
  await expect(game).toHaveAttribute("data-reading-errors","0");await expect(game).toHaveAttribute("data-motor-falls","0");
  await page.screenshot({path:info.outputPath("thorn-approach.png")});
});

test("Word Climb touch steering selects a word before the other thumb jumps",async({browser})=>{
  test.setTimeout(120_000);
  const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:1024,height:668},hasTouch:true});
  const page=await context.newPage();
  try{
    const game=await openAtVerifiedStation(page);
    const choices=page.locator('[data-wc="choice"]');
    const target=(await page.locator('[data-wc="target"]').innerText()).replaceAll('/','');
    const words=await choices.locator('strong').allTextContents();
    const correct=words.findIndex(word=>wordStartsWithTargetSound(word,target));
    await page.locator('[data-wc-control="left"]').tap();
    await expect(choices.nth(0)).toHaveAttribute('data-selected','true');
    for(let i=0;i<correct;i++)await page.locator('[data-wc-control="right"]').tap();
    const id=await choices.nth(correct).getAttribute('data-ledge-id');
    await expect(choices.nth(correct)).toHaveAttribute('data-selected','true');
    await page.locator('[data-wc-control="up"]').tap();
    await expect(game).toHaveAttribute('data-wc-progress','1');
    await expect(game).toHaveAttribute('data-standing-ledge',id);
    await expect(game).toHaveAttribute('data-reading-errors','0');
  }finally{await context.close();}
});
