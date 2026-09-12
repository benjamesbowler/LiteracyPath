import { expect, test } from "@playwright/test";

const ACTIVITIES = [
  ["cycle-1", "letters", "letter-press"],
  ["cycle-24", "sounds", "sound-choice"],
  ["cycle-1", "hunt", "scene-hunt"],
  ["cycle-1", "quick", "word-memory"],
  ["cycle-2", "trace", "letter-grid"],
  ["cycle-4", "build", "missing-letter"],
  ["cycle-1", "play", "rhyme-pair"],
  ["cycle-1", "poem", "compound-picture"],
  ["cycle-1", "search", "picture-search"]
];

for (const viewport of [{ width: 1024, height: 650 }, { width: 768, height: 650 }]) {
  test(`all simple activities keep their pictures, directions and controls visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [cycle, station, mechanic] of ACTIVITIES) {
      await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`);
      await expect(page.locator(`[data-mechanic-stage="${mechanic}"]`)).toBeVisible();
      await expect.poll(() => page.locator(".adventure-round-frame").evaluate(root => {
        const stage = root.querySelector(".adventure-round-frame__stage");
        const plaque = root.querySelector(".adventure-round-frame__plaque");
        const stageRect = stage.getBoundingClientRect();
        const plaqueRect = plaque.getBoundingClientRect();
        const controls = [...root.querySelectorAll("button")].filter(button => {
          const rect = button.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        return {
          pageOverflow: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth,
            document.documentElement.scrollHeight - document.documentElement.clientHeight),
          frameOverflow: Math.max(root.scrollWidth - root.clientWidth, root.scrollHeight - root.clientHeight),
          stageOverflow: Math.max(stage.scrollWidth - stage.clientWidth, stage.scrollHeight - stage.clientHeight),
          overlap: Math.max(0, plaqueRect.bottom - stageRect.top),
          tooSmall: controls.filter(button => {
            const rect = button.getBoundingClientRect();
            return rect.width < 55.9 || rect.height < 55.9;
          }).map(button => button.getAttribute("aria-label") || button.textContent.trim()),
          clipped: controls.filter(button => {
            const rect = button.getBoundingClientRect();
            return rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1;
          }).map(button => button.getAttribute("aria-label") || button.textContent.trim())
        };
      }), { message: `${mechanic} should fit its classroom viewport` }).toEqual({
        pageOverflow: 0, frameOverflow: 0, stageOverflow: 0, overlap: 0, tooSmall: [], clipped: []
      });
      await expect(page.getByRole("button", { name: "Hear instructions again" })).toBeVisible();
    }
  });
}

test("grid letters respond to trusted touch without moving the page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This check requires a touch browser context.");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=adventure-map&quest=cycle-2&station=trace");
  const stage = page.locator('[data-mechanic-stage="letter-grid"]');
  await expect(stage).toBeVisible();
  const before = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await stage.evaluate(element => {
    window.__adventureTouches = [];
    element.addEventListener("pointerup", event => window.__adventureTouches.push({
      trusted: event.isTrusted, pointerType: event.pointerType
    }));
  });
  const targets = (await stage.locator(".am-simple-target-letters").textContent()).toLowerCase().replace(/\s/g, "");
  const target = stage.locator("[data-cell-id]").filter({ hasText: new RegExp(`^[${targets}A-Z]$`) });
  const choices = await target.evaluateAll(buttons => buttons.map(button => ({
    id: button.dataset.cellId,
    text: button.querySelector("span").textContent,
  })));
  const chosen = choices.find(item => targets.includes(item.text.toLowerCase()));
  expect(chosen).toBeTruthy();
  await stage.locator(`[data-cell-id="${chosen.id}"]`).tap();
  await expect(stage.locator(`[data-cell-id="${chosen.id}"]`)).toHaveAttribute("data-find-state", "found");
  expect(await page.evaluate(() => window.__adventureTouches)).toEqual([{ trusted: true, pointerType: "touch" }]);
  expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual(before);
});
