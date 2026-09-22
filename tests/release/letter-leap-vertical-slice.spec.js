import { expect, test } from "@playwright/test";

async function pressPointerControl(page, control) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
}

test("Letter Leap starts immediately and keeps optional guidance out of the play lane", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");
  await expect(page.getByRole("dialog", { name: "Letter Leap instructions", exact: true })).toHaveCount(0);
  const jump = page.locator('[data-ll="jump"]');
  await expect(jump).toBeVisible();
  expect(await jump.evaluate(element => element.closest("[inert]") !== null)).toBe(false);
  await page.waitForFunction(() => document.querySelector('.letter-leap')?.__letterLeapSnapshot?.().running);
  await page.getByRole('button', { name: 'Open Letter Leap mission guide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep playing', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  expect(await jump.evaluate(element => element.closest("[inert]") !== null)).toBe(false);
});

test("Letter Leap production-word replay is reachable, sized for children, and follows sound state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=1");

  const hear = page.getByRole("button", { name: "Hear the word", exact: true });
  await expect(hear).toBeVisible();
  await expect(hear).toBeEnabled();
  const box = await hear.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(56);
  expect(box?.height).toBeGreaterThanOrEqual(56);
  await hear.click();

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(hear).toBeHidden();
  await page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true }).click();
  await expect(hear).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Letter Leap fullscreen controls prevent selection and receive held pointer input", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0");

  const player = page.getByRole("dialog", { name: "Letter Leap", exact: true });
  await expect(player).toBeVisible();
  expect(await player.evaluate(element => element.closest(".student-mode-app"))).toBeNull();

  const controls = [
    page.getByRole("button", { name: "Move left", exact: true }),
    page.getByRole("button", { name: "Move right", exact: true }),
    page.getByRole("button", { name: "Leap right", exact: true })
  ];

  for (const control of controls) {
    await expect(control).toBeVisible();
    const inputStyles = await control.evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        touchAction: styles.touchAction,
        userSelect: styles.userSelect || styles.getPropertyValue("-webkit-user-select")
      };
    });
    expect(inputStyles).toEqual({
      touchAction: "none",
      userSelect: "none"
    });
  }

  await page.evaluate(() => {
    window.__letterLeapPointerEvents = [];
    document.body.addEventListener("pointerdown", event => {
      const control = event.target.closest?.('[data-ll="left"], [data-ll="right"], [data-ll="jump"]');
      if (!control) return;
      window.__letterLeapPointerEvents.push({
        control: control.getAttribute("data-ll"),
        defaultPrevented: event.defaultPrevented
      });
    });
  });

  for (const control of controls) await pressPointerControl(page, control);

  await expect.poll(() => page.evaluate(() => window.__letterLeapPointerEvents)).toEqual([
    { control: "left", defaultPrevented: true },
    { control: "right", defaultPrevented: true },
    { control: "jump", defaultPrevented: true }
  ]);
});

test("Letter Leap keeps the active ordered letter grounded after a fullscreen height change", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
    // Keep the first target in the left-most slot so running into it exercises
    // the actual canvas collision path without relying on jump timing.
    localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview",JSON.stringify({games:{"letter-leap":{checkpoints:{easy:{level:0,totalLevels:10,sessionSeed:0}}}}}));
  });
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");

  const completedSlots = page.locator('[data-ll="word"] [aria-label^="Completed letter"]');
  await expect(page.getByRole("button", { name: "Leap right", exact: true })).toBeVisible();
  await expect(page.locator(".letter-leap canvas")).toBeVisible();
  await expect(completedSlots).toHaveCount(0);

  // Reproduces the reported floating-letter failure: the shell grows after the
  // level has already stored its world coordinates.
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForTimeout(120);
  await page.keyboard.down("ArrowRight");
  await expect.poll(() => completedSlots.count()).toBeGreaterThanOrEqual(1);
  await page.keyboard.up("ArrowRight");

  await expect.poll(() => completedSlots.count()).toBeGreaterThanOrEqual(1);
  expect(pageErrors).toEqual([]);
});

test("Letter Leap keeps its target and 56px controls inside 568x320 phone landscape", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");

  const mount = page.locator(".letter-leap");
  const mountBox = await mount.boundingBox();
  expect(mountBox?.height).toBeGreaterThanOrEqual(240);
  expect(await mount.evaluate(element => element.scrollHeight)).toBe(await mount.evaluate(element => element.clientHeight));

  const visibleControls = [
    page.getByRole("button", { name: "Move left", exact: true }),
    page.getByRole("button", { name: "Move right", exact: true }),
    page.getByRole("button", { name: "Leap right", exact: true }),
    page.locator('[data-ll="target-panel"]')
  ];
  for (const control of visibleControls) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(321);
  }

  for (const control of visibleControls.slice(0, 3)) {
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
});

test("Letter Leap completes a word through pointer taps and keyboard leaps", async ({ page }) => {
  test.setTimeout(90000);
  await page.clock.install();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
    localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview",JSON.stringify({games:{"letter-leap":{checkpoints:{easy:{level:0,totalLevels:10,sessionSeed:0}}}}}));
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");

  const snapshot=()=>page.evaluate(()=>document.querySelector(".letter-leap").__letterLeapSnapshot());
  const right = page.getByRole("button", { name: "Move right", exact: true });
  const completedSlots = page.locator('[data-ll="word"] [aria-label^="Completed letter"]');
  await expect(page.getByRole("button", { name: "Leap right", exact: true })).toBeVisible();

  // A click used to release before an animation frame and produce no visible
  // movement. Pointer taps plus native Enter activation now reach the first
  // grounded choice without making a focused control swallow the keyboard.
  for (let tap = 0; tap < 6 && await completedSlots.count() === 0; tap += 1) {
    if (tap < 2) await right.click();
    else {
      await right.focus();
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(220);
  }
  await expect(completedSlots).toHaveCount(1);

  const initial=await snapshot();let held=new Set(),jumpUntil=0;
  for(let frame=0;frame<800;frame++){
    const state=await snapshot();if(state.wordsDone>=1)break;
    const target=state.bubbles.find(b=>!b.taken&&b.word===state.wordIndex&&b.order===state.letterIndex);
    let dx=(target?.x??state.flag)-state.player.x;
    const support=state.platforms.find(p=>state.player.x>=p.x&&state.player.x<=p.x+p.w&&Math.abs(state.player.y+23-p.y)<5);
    if(target&&target.y>state.player.y+48&&Math.abs(dx)<40&&support)dx=support.x+support.w+45-state.player.x;
    const direction=Math.sign(dx),edge=support?(direction>0?support.x+support.w:support.x):state.player.x;
    const gap=state.pits.some(([a,b])=>edge+direction*(support?35:85)>a&&edge+direction*(support?35:85)<b)&&(!support||Math.abs(edge-state.player.x)<60);
    const decoy=state.bubbles.some(b=>!b.taken&&b.word===-1&&b.decisionWord===state.wordIndex&&b.decisionOrder===state.letterIndex&&Math.sign(b.x-state.player.x)===direction&&Math.abs(b.x-state.player.x)<85&&Math.abs(b.x-state.player.x)>35);
    const foe=state.foes.some(f=>Math.sign(f.x-state.player.x)===direction&&Math.abs(f.x-state.player.x)<120);
    if(state.player.onGround&&frame>=jumpUntil&&(gap||decoy||foe||(target&&target.y<state.player.y-50&&Math.abs(dx)<125)))jumpUntil=frame+7;
    const next=new Set([...(Math.abs(dx)>=15?[direction<0?'ArrowLeft':'ArrowRight']:[]),...(frame<jumpUntil?['ArrowUp']:[])]);
    for(const key of held)if(!next.has(key))await page.keyboard.up(key);for(const key of next)if(!held.has(key))await page.keyboard.down(key);held=next;
    await page.clock.runFor(70);
  }
  for(const key of held)await page.keyboard.up(key);
  expect((await snapshot()).wordsDone).toBe(1);
  await expect(page.locator('[data-ll="lab"]')).toContainText(initial.word+' built');
  await expect(page.getByText("1 of 50", { exact: true })).toBeVisible();
  await page.clock.runFor(850);
  await expect(page.locator('[data-ll="lab"]')).toContainText("word 2 of 5");
  expect(pageErrors).toEqual([]);
});

test.describe("Letter Leap Retina rendering", () => {
  test.use({ viewport: { width: 1467, height: 953 }, deviceScaleFactor: 2 });

  test("keeps the live canvas responsive without a multi-million-pixel backing store", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
    });
    await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");
    await expect(page.getByRole("button", { name: "Leap right", exact: true })).toBeVisible();

    const dimensions = await page.locator(".letter-leap").evaluate(element => {
      const canvas = element.querySelector("canvas");
      return {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        backingWidth: canvas?.width || 0,
        backingHeight: canvas?.height || 0
      };
    });
    expect(dimensions.backingWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(dimensions.backingHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);

    const frameCount = await page.evaluate(() => new Promise(resolve => {
      let frames = 0;
      const startedAt = performance.now();
      const sample = () => {
        frames += 1;
        if (performance.now() - startedAt >= 2000) resolve(frames);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }));
    expect(frameCount).toBeGreaterThanOrEqual(20);
  });
});
