import { expect, test } from "@playwright/test";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";

test.use({ hasTouch: true, viewport: { width: 568, height: 320 } });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("lp-arcade-onboarded-v1:reel-read", "1");
    window.__reelEnded = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      this.addEventListener("ended", () => window.__reelEnded.push(this.currentSrc || this.src), { once: true });
      return play.apply(this, args);
    };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image?.src?.endsWith("/reel-read/angler-boat.webp") && args.length === 4) window.__reelBoatX = args[0];
      return draw.call(this, image, ...args);
    };
  });
});

async function start(page, sound = 0) {
  await page.goto(`/preview/game-overlay.html?game=reel-read&sound=${sound}&music=0`);
  await expect(page.locator('[data-rr-cue-delivery]').first()).toHaveAttribute("data-rr-phase", "playing");
}

test("released finger drift acts once; cancellation, outside release and pause discard held choices", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Trusted moving touch is injected through Chromium CDP.");
  await start(page);
  const client = await page.context().newCDPSession(page);
  const point = async button => {
    const r = await button.boundingBox();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const down = async button => {
    const p = await point(button);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    return p;
  };
  const up = () => client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const drift = async button => {
    const p = await down(button);
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x:p.x+12, y:p.y+12 }] });
    await up();
  };
  const rain = page.getByRole("button", { name: "Choose fish rain", exact:true });
  const game = page.locator('[data-rr-cue-delivery]').first();
  await down(rain);
  await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await expect(rain).toHaveAttribute("aria-pressed", "false");
  await down(rain);
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x:560,y:315 }] });
  await up();
  await expect(rain).toHaveAttribute("aria-pressed", "false");
  await down(rain);
  await page.keyboard.press("Escape");
  await up();
  await page.getByRole("button", { name:"Keep playing", exact:true }).click();
  await expect(rain).toHaveAttribute("aria-pressed", "false");
  await drift(rain);
  await expect(rain).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: ".artifacts/g14-production/nominated-touch.png" });
  await drift(page.locator('[data-rr="cast"]'));
  await expect(page.locator('[data-rr="status"]')).toHaveText("rain fits!");
  await expect(game).toHaveAttribute("data-rr-first-responses", "1");
  await expect(page.locator('[data-rr="cast"]')).toHaveText("CAST");
  await page.screenshot({ path: ".artifacts/g14-production/collected-on-boat.png" });
  await page.getByRole("button", { name:"Choose fish bow", exact:true }).focus();
  await page.keyboard.press("Enter");
  await page.locator('[data-rr="cast"]').focus();
  await page.keyboard.press("Space");
  await expect(page.locator('[data-rr="result"]')).toContainText("rain + bow = rainbow");
  await expect(game).toHaveAttribute("data-rr-first-responses", "2");
  await page.screenshot({ path: ".artifacts/g14-production/assembled-touch-keyboard.png" });
  await client.detach();
});

test("focused steering buttons move on keyboard hold and stop on release or lost focus", async ({ page }) => {
  await start(page);
  await expect.poll(() => page.evaluate(() => window.__reelBoatX)).toEqual(expect.any(Number));
  const before = await page.evaluate(() => window.__reelBoatX);
  await page.getByRole("button", { name:"Move left", exact:true }).focus();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(120);
  await page.keyboard.up("Enter");
  await page.waitForTimeout(80);
  const after = await page.evaluate(() => window.__reelBoatX);
  expect(after).toBeLessThan(before-10);
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.__reelBoatX)).toBeCloseTo(after, 1);
  await page.getByRole("button", { name:"Move right", exact:true }).focus();
  await page.keyboard.down("Space");
  await page.waitForTimeout(80);
  await page.locator('[data-rr="cast"]').focus();
  await page.keyboard.up("Space");
  await page.waitForTimeout(80);
  const stopped = await page.evaluate(() => window.__reelBoatX);
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.__reelBoatX)).toBeCloseTo(stopped, 1);
});

test("recorded replay completes from a touch and remains silent after mute", async ({ page }) => {
  await start(page, 1);
  const game = page.locator('[data-rr-cue-delivery]').first();
  await page.locator('[data-rr="replay"]').tap();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", "completed", { timeout:15000 });
  expect(await page.evaluate(path => window.__reelEnded.some(src => new URL(src).pathname === path), getLedaWordAudioPath("rainbow"))).toBe(true);
  await page.getByRole("button", { name:"Choose fish rain", exact:true }).tap();
  await page.getByRole("button", { name:"Turn spoken audio and game sounds off", exact:true }).tap();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", "muted");
  await expect(page.locator('[data-rr="replay"]')).toBeDisabled();
});

test("failed recorded cues leave a usable printed task and recover through replay", async ({ page }) => {
  const path = getLedaWordAudioPath("rainbow");
  const pattern = `**${path}`;
  await page.route(pattern, route => route.abort());
  await start(page, 1);
  const game = page.locator('[data-rr-cue-delivery]').first();
  await page.locator('[data-rr="replay"]').tap();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", /failed|unavailable/);
  await expect(page.getByRole("button", { name:"Choose fish rain", exact:true })).toBeEnabled();
  await page.unroute(pattern);
  await page.locator('[data-rr="replay"]').tap();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", "completed", { timeout:15000 });
});

test("trip stars include prior levels and reopening saves one new play without changing the first receipt", async ({ page }) => {
  test.setTimeout(90000);
  const key = "literacy-guide-learn-games:fullscreen-overlay-preview";
  await page.addInitScript(key => {
    if (sessionStorage.getItem("g14-trip-seeded")) return;
    sessionStorage.setItem("g14-trip-seeded", "1");
    localStorage.setItem(key, JSON.stringify({ games:{ "reel-read":{ checkpoints:{ medium:{level:8,totalLevels:10} } } } }));
  }, key);
  const open = async () => {
    await page.goto("/preview/game-overlay.html?game=reel-read&difficulty=medium&sound=0&music=0");
    await page.getByRole("button", { name:"Continue", exact:true }).click();
    await expect(page.locator('[data-rr-cue-delivery]').first()).toHaveAttribute("data-rr-phase", "playing");
  };
  const catchWord = async (word, correct = true) => {
    await page.getByRole("button", { name:`Choose fish ${word}`, exact:true }).tap();
    await page.locator('[data-rr="cast"]').tap();
    await expect(page.locator('[data-rr="status"]')).toContainText(correct ? `${word} fits!` : `Try again: ${word}`);
    await expect(page.locator('[data-rr="cast"]')).toHaveText("CAST");
  };
  await open();
  const wrong = await page.locator('[data-rr="fish"]').filter({ hasNotText:/bold|fearless|courageous/ }).first().textContent();
  await catchWord(wrong, false);
  await catchWord(wrong, false);
  for (const word of ["bold", "fearless", "courageous"]) await catchWord(word);
  await expect(page.locator('[data-rr="result-title"]')).toHaveText("Pond cleared!");
  await page.locator('[data-rr="next"]').tap();
  await expect(page.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.");
  for (const word of ["read", "-er"]) await catchWord(word);
  const first = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).games["reel-read"], key);
  expect(first.stars).toBe(2);
  expect(first.plays).toBe(1);
  expect(first.practiceRecord.completions).toHaveLength(1);
  await page.locator('[data-rr="next"]').tap();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Closed Reel & Read", { exact:true })).toBeVisible();

  // Resume a later checkpoint in a second visit while retaining the first
  // actual receipt. Neither its grade nor its answers may be regenerated.
  await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    saved.games["reel-read"].checkpoints = { medium:{level:9,totalLevels:10} };
    localStorage.setItem(key, JSON.stringify(saved));
  }, key);
  await open();
  for (const word of ["read", "-er"]) await catchWord(word);
  await page.locator('[data-rr="next"]').tap();
  const second = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).games["reel-read"], key);
  expect(second.plays).toBe(2);
  expect(second.practiceRecord.completions).toHaveLength(2);
  expect(second.practiceRecord.completions[0]).toEqual(first.practiceRecord.completions[0]);
});
