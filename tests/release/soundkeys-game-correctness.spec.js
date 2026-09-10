import { expect, test } from "@playwright/test";

test("SoundKeys freezes a completed phrase transition while paused", async ({ page }) => {
  await page.clock.install();
  await page.goto("/preview/game-overlay.html?game=soundkeys&sound=0&music=0");
  const stage=page.locator('.sk-stage');
  await expect(stage).toBeVisible({timeout:25000});
  const id=await stage.getAttribute('data-target');
  const tokens=await page.evaluate(async id=>(await import('/src/features/soundkeys/content.js')).SOUNDKEY_WORDS.find(word=>word.id===id).tokens,id);
  for(const token of tokens){
    for(let bank=0;bank<3;bank++){
      const key=page.locator(`.soundkeys-keyboard [data-token="${token}"]`);
      if(await key.count()){await key.click();break;}
      await page.getByRole('button',{name:'Next sound keys',exact:true}).click();
    }
  }
  await expect(stage).toHaveClass(/is-celebrating/);
  await page.keyboard.press('Escape');
  await page.clock.runFor(3000);
  await expect(stage).toHaveAttribute('data-round','0');
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await page.clock.runFor(900);
  await expect(stage).toHaveAttribute('data-round','1');
});
