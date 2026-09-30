import { expect, test } from "@playwright/test";
import { STUDENT_DEVICE_PROFILES, STUDENT_MINIMUM_TARGET_PX } from "../../src/policy/studentDeviceMatrix.js";
import { STUDENT_SUPPORT_AUDIO } from "../../src/data/generated/studentSupportAudio.generated.js";

async function hydrateHollow(page, owned) {
  await page.evaluate(ownsJar => {
    localStorage.setItem("lp-hollow:child-surface-preview", JSON.stringify({
      purchases: [
        { id: "synthetic-gift", item: "egg-welcome", cost: 0, at: "2026-09-30T00:00:00Z" },
        ...(ownsJar ? [{ id: "synthetic-jar", item: "hollow-glow-jar", cost: 20, at: "2026-09-30T00:00:01Z" }] : [])
      ],
      feeds: [], chests: [], layout: { slots: {}, equipped: {}, at: "" }
    }));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", { detail: { studentId: "child-surface-preview" } }));
  }, owned);
}

for (const device of STUDENT_DEVICE_PROFILES) {
  for (const surface of ["my-hollow", "phonics", "reading-library"]) {
    test(`${surface} next action and replay fit ${device.id}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto(`/preview/child-surfaces.html?surface=${surface}&teachingCycle=cycle-6`);
      const root = page.locator(`[data-child-surface="${surface}"]`);
      await expect(root).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`${surface}-${device.id}.png`) });
      const primary = root.locator("[data-child-primary]");
      await expect(primary).toHaveCount(1);
      // Browser intersection ratios have subpixel noise on scaled stages.
      await expect(primary).toBeInViewport({ ratio: 0.999 });
      const replay = root.getByRole("button", { name: surface === "my-hollow" ? "Hear what to do next" : surface === "phonics" ? "Hear why this letter" : "Hear this", exact: true }).first();
      await expect(replay).toBeInViewport({ ratio: 0.999 });
      for (const control of [primary, replay]) {
        const box = await control.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
        expect(box.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      if (surface === "phonics" && device.id === "chromebook-landscape") {
        const letters = root.locator(".phonics-letter-card");
        await expect(letters).toHaveCount(26);
        for (const letter of await letters.all()) await expect(letter).toBeInViewport({ ratio: 0.999 });
        await expect(root.locator("[data-child-progress]")).toBeInViewport({ ratio: 0.999 });
      }
      await page.screenshot({ path: testInfo.outputPath(`${surface}-${device.id}.png`) });
      if (surface === "my-hollow") {
        await expect(root.getByRole("button", { name: "Empty display spot", exact: true }).first()).toBeDisabled();
        await hydrateHollow(page, true);
        await expect(primary).toHaveText(/Place next/);
        await primary.click();
        const picker = root.getByRole("dialog", { name: "Choose something to place" });
        await expect(picker.getByRole("button", { name: "Glow jar", exact: true })).toBeVisible();
        // Hydration can replace inventory while the picker is open. Its recovery
        // must remain usable instead of leaving an empty chooser on any device.
        await hydrateHollow(page, false);
        await expect(picker.locator("[data-child-primary]")).toHaveText("Visit the Market");
        for (const control of [picker.locator("[data-child-primary]"), picker.getByRole("button", { name: "Hear what to do next" }), picker.getByRole("button", { name: "Close placement choices" })]) {
          await expect(control).toBeInViewport({ ratio: 0.999 });
          const box = await control.boundingBox();
          expect(box.width).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
          expect(box.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
        }
        await page.screenshot({ path: testInfo.outputPath(`empty-picker-${device.id}.png`) });
        await picker.getByRole("button", { name: "Close placement choices" }).click();
        await expect(primary).toBeFocused();
      }
    });
  }
}

test("empty Hollow leads to the gift and Market without a placement dead end", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=my-hollow");
  const root = page.locator('[data-child-surface="my-hollow"]');
  await expect(root.locator('[data-child-primary]')).toHaveCount(1);
  await expect(root.locator('[data-child-primary]')).toHaveText("Open your gift");
  await expect.poll(() => root.locator(".hollow-room-next img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(root.getByText("Place next", { exact: true })).toHaveCount(0);
  await root.getByRole("button", { name: "Open your gift", exact: true }).click();
  await expect(root.getByRole("dialog", { name: /Your egg hatched/ })).toBeVisible();
  await root.getByRole("button", { name: /^Meet / }).click();
  await root.getByRole("button", { name: "My Hollow", exact: true }).click();
  await expect(root.locator('[data-child-primary]')).toHaveText("Visit the Market");
  await expect(root.getByRole("button", { name: "Empty display spot", exact: true }).first()).toBeDisabled();
  await root.getByRole("button", { name: "Visit the Market", exact: true }).click();
  await expect(root.getByRole("button", { name: "For your Hollow", exact: true })).toHaveAttribute("aria-pressed", "true");
  await root.getByRole("button", { name: /^Glow jar/ }).click();
  await root.getByRole("button", { name: "My Hollow", exact: true }).click();
  await expect(root.locator('[data-child-primary]')).toHaveText(/Place next/);
  await root.locator('[data-child-primary]').click();
  const picker = root.getByRole("dialog", { name: "Choose something to place" });
  await picker.getByRole("button", { name: "Glow jar", exact: true }).click();
  await expect(picker).toHaveCount(0);
  await expect(root.locator(".hollow-spot.filled")).toHaveAttribute("title", "Put away Glow jar");
});

test("Letters uses teaching context and keeps every letter freely available", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=phonics&teachingCycle=cycle-6");
  const root = page.locator('[data-child-surface="phonics"]');
  await expect(root.locator('[data-child-primary]')).toHaveAccessibleName(/Letter R/);
  await expect(root.locator(".phonics-letter-card")).toHaveCount(26);
  await expect(root.locator('[data-child-progress]')).not.toContainText("130");
  await expect(root.getByRole("button", { name: "Hear why this letter" })).toBeVisible();
  await root.getByRole("button", { name: /^Letter Z(?:,|$)/ }).click();
  await expect(page.getByText("Start at the dot. Trace Z.", { exact: true })).toBeVisible();
});

test("library speaks child-purpose copy and labels broad books as browsing", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const root = page.locator('[data-child-surface="reading-library"]');
  await expect(root.getByText("You can listen while you read.", { exact: true })).toBeVisible();
  await expect(root.getByRole("heading", { name: "Books to try", exact: true })).toBeVisible();
  await expect(root.getByText("Just right for you", { exact: true })).toHaveCount(0);
  await expect(root.locator(".kg-book-purpose").first()).toHaveText("Listen and read");
  await expect(root.getByRole("button", { name: "Hear this", exact: true }).first()).toBeVisible();
});

test("an unready evidence read cannot label library books as independently decodable", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=reading-library&placementCycle=80&evidenceReady=0");
  const labels = page.locator(".kg-book-purpose");
  await expect(labels.first()).toBeVisible();
  expect(await labels.allTextContents()).toEqual(expect.arrayContaining(["Listen and read"]));
  expect(await labels.allTextContents()).not.toContain("Read it yourself");
});

test("Hollow refreshes owned items when cloud hydration arrives and restores picker focus", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=my-hollow");
  const root = page.locator('[data-child-surface="my-hollow"]');
  await expect(root.getByRole("button", { name: "Open your gift", exact: true })).toBeVisible();
  await hydrateHollow(page, true);
  const placement = root.locator("[data-child-primary]");
  await expect(placement).toHaveText(/Place next/);
  await placement.click();
  const picker = root.getByRole("dialog", { name: "Choose something to place" });
  await expect(picker.getByRole("button", { name: "Glow jar", exact: true })).toBeFocused();
  await picker.getByRole("button", { name: "Glow jar", exact: true }).press("Escape");
  await expect(picker).toHaveCount(0);
  await expect(placement).toBeFocused();
});

for (const replay of [
  { id: "Hollow gift", surface: "my-hollow", name: "Hear what to do next", audioKey: "open your gift" },
  { id: "Hollow Market", surface: "my-hollow", name: "Hear what to do next", audioKey: "visit the market to find something for your hollow", market: true },
  { id: "Letters teaching", surface: "phonics&teachingCycle=cycle-6", name: "Hear why this letter", audioKey: "practise a letter from class" },
  { id: "Letters placement", surface: "phonics&placementCycle=6", name: "Hear why this letter", audioKey: "practise a letter you have learned" },
  { id: "Letters exploration", surface: "phonics", name: "Hear why this letter", audioKey: "try this letter, or choose another" },
  { id: "library reading purpose", surface: "reading-library", name: "Hear this", audioKey: "you can listen while you read" }
]) {
  test(`${replay.id} replay loads and plays the recorded instruction`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__childNextPlayback = [];
      const NativeAudio = window.Audio;
      window.Audio = function (...args) {
        const audio = new NativeAudio(...args);
        audio.addEventListener("playing", () => window.__childNextPlayback.push({
          path: new URL(audio.currentSrc).pathname,
          duration: audio.duration
        }));
        return audio;
      };
      window.Audio.prototype = NativeAudio.prototype;
    });
    await page.goto(`/preview/child-surfaces.html?surface=${replay.surface}`);
    if (replay.market) await hydrateHollow(page, false);
    const audioPath = STUDENT_SUPPORT_AUDIO[replay.audioKey];
    expect(audioPath).toMatch(/^\/audio\/production\/en-US\/instruction\//);
    const audioResponse = page.waitForResponse(response => new URL(response.url()).pathname === audioPath);
    await page.getByRole("button", { name: replay.name, exact: true }).first().click();
    const response = await audioResponse;
    expect([200, 206]).toContain(response.status());
    expect(response.headers()["content-type"]).toMatch(/audio/);
    await expect.poll(() => page.evaluate(path => window.__childNextPlayback.some(
      playback => playback.path === path && Number.isFinite(playback.duration) && playback.duration > 0
    ), audioPath)).toBe(true);
  });
}
