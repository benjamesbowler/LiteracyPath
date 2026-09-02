import { expect, test } from "@playwright/test";

async function openStation(page, cycle, station) {
  await page.goto(
    `/preview/child-surfaces.html?surface=adventure-map&quest=${cycle}&station=${station}`,
    { waitUntil: "domcontentloaded" }
  );
  await expect(page.locator(`[data-quest-view="round"][data-station-id="${station}"]`))
    .toBeVisible();
}

test("Letter Press uses two signs and commits a keyboard-operated press", async ({ page }) => {
  await openStation(page, "cycle-1", "letters");
  const stage = page.locator('[data-mechanic-stage="letter-press"]');
  await expect(stage.locator(".am-code-sign-slot")).toHaveCount(2);

  const candidate = stage.locator(".am-letter-press-button").first();
  const selected = (await candidate.textContent())?.trim();
  await candidate.focus();
  await page.keyboard.press("Enter");

  await expect(candidate).toHaveAttribute("aria-pressed", "true");
  await expect(stage.locator(".am-code-sign-slot").nth(1)).toContainText(selected);
});

test("Sound Gate previews a keyboard-selected magnet before a separate commit", async ({ page }) => {
  await openStation(page, "cycle-1", "sounds");
  const stage = page.locator('[data-mechanic-stage="sound-gate"]');
  const magnet = stage.locator(".am-sound-gate-magnet").first();
  const gate = stage.getByRole("button", { name: "Open sound gate" });

  await magnet.focus();
  await page.keyboard.press("Space");
  await expect(magnet).toHaveAttribute("aria-pressed", "true");
  await expect(stage.locator(".am-sound-gate-slot")).toHaveAttribute("data-gate-state", "loaded");
  await expect(gate).toBeEnabled();

  await gate.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).not.toBeEmpty();
});

test("Scene Hunt hides captions, toggles picture tags, and checks the full set", async ({ page }) => {
  await openStation(page, "cycle-1", "hunt");
  const stage = page.locator('[data-mechanic-stage="scene-hunt"]');
  const objects = stage.locator(".am-scene-object");
  await expect(objects).toHaveCount(3);
  await expect(stage.locator(".am-scene-object-label")).toHaveCount(0);

  const first = objects.first();
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-pressed", "false");

  await objects.nth(0).click();
  await objects.nth(1).click();
  await stage.getByRole("button", { name: "Labels" }).click();
  await expect(stage.locator(".am-scene-object-label")).toHaveCount(3);
  await stage.getByRole("button", { name: "Check tags" }).click();
  await expect(page.getByRole("status")).not.toBeEmpty();
});
