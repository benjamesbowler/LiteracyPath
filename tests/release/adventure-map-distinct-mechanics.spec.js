import { expect, test } from "@playwright/test";

async function openStation(page, cycle, station) {
  await page.goto(
    `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`,
    { waitUntil: "domcontentloaded" }
  );
  await expect(page.locator(`[data-quest-view="round"][data-station-id="${station}"]`))
    .toBeVisible();
}

test("Letter Press pairs both signs after a known-correct keyboard press", async ({ page }) => {
  await openStation(page, "cycle-1", "letters");
  const stage = page.locator('[data-mechanic-stage="letter-press"]');
  await expect(stage.locator(".am-code-sign-slot")).toHaveCount(2);
  await expect(stage.locator(".am-code-sign-slot").first()).toContainText("A");

  // Cycle 1 starts with the authored A -> a visual-letter pair.
  const candidate = stage.getByRole("button", { name: "a", exact: true });
  await candidate.focus();
  await page.keyboard.press("Enter");

  await expect(candidate).toHaveAttribute("aria-pressed", "true");
  await expect(stage.locator('[data-slot-state="paired"]')).toHaveCount(2);
});

test("Sound Gate opens for an accepted-equivalent spelling only after gate commit", async ({ page }) => {
  await openStation(page, "cycle-24", "sounds");
  const stage = page.locator('[data-mechanic-stage="sound-gate"]');
  // Cycle 24's first authored target is ff; f is its accepted equivalent.
  await expect(stage.getByRole("button", { name: "ff", exact: true })).toBeVisible();
  const magnet = stage.getByRole("button", { name: "f", exact: true });
  const gate = stage.getByRole("button", { name: "Open sound gate" });

  await magnet.focus();
  await page.keyboard.press("Space");
  await expect(magnet).toHaveAttribute("aria-pressed", "true");
  await expect(stage.locator(".am-sound-gate-slot")).toHaveAttribute("data-gate-state", "loaded");
  await expect(gate).toBeEnabled();

  await gate.focus();
  await page.keyboard.press("Enter");
  await expect(stage.locator(".am-sound-gate-slot")).toHaveAttribute("data-gate-state", "open");
  await expect(stage.locator(".am-sound-gate-slot")).toContainText("Gate open");
});

test("Scene Hunt completes only after the exact correct picture set is tagged", async ({ page }) => {
  await openStation(page, "cycle-22", "hunt");
  const stage = page.locator('[data-mechanic-stage="scene-hunt"]');
  const objects = stage.locator(".am-scene-object");
  await expect(objects).toHaveCount(5);
  await expect(stage.locator(".am-scene-object-label")).toHaveCount(5);
  await expect(stage.getByRole("button", { name: /^Hear .+/ })).toHaveCount(5);

  // Cycle 22 is the authored nk Sound Sort replacement. Select every and
  // only picture name ending in nk, independent of randomized positions.
  const correctObjects = [];
  for (let index = 0; index < await objects.count(); index += 1) {
    const object = objects.nth(index);
    const label = await object.getAttribute("aria-label");
    if (label?.split(" ").at(-1)?.endsWith("nk")) correctObjects.push(object);
  }
  expect(correctObjects.length).toBeGreaterThanOrEqual(2);
  for (const object of correctObjects) {
    await object.focus();
    await page.keyboard.press("Enter");
    await expect(object).toHaveAttribute("aria-pressed", "true");
  }

  await stage.getByRole("button", { name: "Check tags" }).click();
  await expect(stage).toHaveAttribute("data-hunt-state", "complete");
});
