import { expect, test } from "@playwright/test";

const IPAD_VIEWPORTS = [
  { name: "iPad landscape", width: 1024, height: 768 },
  { name: "iPad portrait", width: 768, height: 1024 }
];

async function oneScreenGeometry(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".kg-stage");
    const main = document.querySelector(".kg-main");
    const notice = document.querySelector(".student-session-notice--header");
    const stageRect = stage.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const noticeRect = notice.getBoundingClientRect();
    return {
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      stageOverflowX: stage.scrollWidth - stage.clientWidth,
      stageOverflowY: stage.scrollHeight - stage.clientHeight,
      mainOverflowX: main.scrollWidth - main.clientWidth,
      noticePosition: getComputedStyle(notice).position,
      noticeInsideStage: noticeRect.left >= stageRect.left - 1
        && noticeRect.right <= stageRect.right + 1
        && noticeRect.top >= stageRect.top - 1,
      noticeClearsActivity: noticeRect.bottom <= mainRect.top + 1
    };
  });
}

test("an assigned Adventure Map space stays pinned and keeps its notice out of the activity", async ({ page }) => {
  for (const viewport of IPAD_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      "/preview/child-surfaces.html?surface=adventure-map&lockedCycle=cycle-14",
      { waitUntil: "domcontentloaded" }
    );

    const map = page.locator('[data-child-surface="adventure-map"]');
    await expect(map).toHaveAttribute("data-focus-locked", "true");
    await expect(map).toHaveAttribute("data-locked-cycle-id", "cycle-14");
    await expect(page.locator('.kg-map-card[data-node-state="next"]')).toHaveCount(1);
    await expect(page.locator('.kg-map-card[data-cycle-id="cycle-14"]')).toBeVisible();
    const assignedReason = map.locator(
      '[data-child-primary] [data-child-emphasis-cue] [data-recommendation-surface="adventure-map"]'
    );
    await expect(assignedReason).toHaveText("Your teacher chose this map space.");
    await expect(assignedReason).not.toContainText("next unfinished stop");
    await expect(page.locator(".kg-tabbar")).toHaveCount(0);
    await expect(page.locator(".student-session-notice--header")).toContainText(
      "Your teacher has chosen this activity"
    );

    const mapGeometry = await oneScreenGeometry(page);
    expect(mapGeometry, `${viewport.name} focused map geometry`).toEqual({
      documentOverflowX: 0,
      documentOverflowY: 0,
      stageOverflowX: 0,
      stageOverflowY: 0,
      mainOverflowX: 0,
      noticePosition: "static",
      noticeInsideStage: true,
      noticeClearsActivity: true
    });

    await page.locator('.kg-map-card[data-cycle-id="cycle-14"]').click();
    const cycle = page.locator('[data-quest-view="cycle"]');
    await expect(cycle).toBeVisible();
    await expect(cycle.getByText("Cycle 14", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Map", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back to your path", exact: true })).toHaveCount(0);
    await expect(page.locator(".kg-tabbar")).toHaveCount(0);

    const questGeometry = await oneScreenGeometry(page);
    expect(questGeometry.documentOverflowX, `${viewport.name} quest page width`).toBe(0);
    expect(questGeometry.documentOverflowY, `${viewport.name} quest page height`).toBe(0);
    expect(questGeometry.noticePosition).toBe("static");
    expect(questGeometry.noticeClearsActivity).toBe(true);
  }
});

test("a missing assigned Adventure Map cycle fails closed", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&lockedCycle=cycle-99",
    { waitUntil: "domcontentloaded" }
  );

  await expect(page.getByText("This assigned map space is not available.")).toBeVisible();
  await expect(page.locator("[data-child-primary]")).toHaveCount(0);
  await expect(page.locator(".kg-map-card[data-node-state='next']")).toHaveCount(0);
  await expect(page.locator(".kg-tabbar")).toHaveCount(0);
});

test("a teacher-assigned map space is the first visible small-phone action", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&lockedCycle=cycle-14",
    { waitUntil: "domcontentloaded" }
  );

  const map = page.locator('[data-child-surface="adventure-map"]');
  const primary = map.locator('[data-child-primary][data-cycle-id="cycle-14"]');
  await expect(primary).toBeVisible();
  await expect(map.locator(".kg-map-card").first()).toHaveAttribute("data-cycle-id", "cycle-14");
  expect(await primary.evaluate(element => {
    const card = element.getBoundingClientRect();
    const pane = element.closest(".kg-main")?.getBoundingClientRect();
    return Boolean(pane
      && card.top >= pane.top - 1
      && card.bottom <= pane.bottom + 1
      && card.left >= pane.left - 1
      && card.right <= pane.right + 1
      && card.top >= -1
      && card.bottom <= window.innerHeight + 1);
  })).toBe(true);
});
