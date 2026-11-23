import { expect, test } from "@playwright/test";
import { ADVENTURE_ATLASES, mapAreaDetails } from "../../src/data/adventureMapAtlas.js";
import { emptyElQuestProgress } from "../../src/utils/adventureMapProgress.js";

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
    const cycle = page.locator('[data-quest-view="round"]');
    await expect(cycle).toBeVisible();
    await expect(cycle).toHaveAttribute("data-cycle-id", "cycle-14");
    await expect(cycle).toHaveAttribute("data-station-id", /\w+/);
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

test("the sample preview blocks an ordinary direct cycle while preserving an exact teacher cycle", async ({ page }) => {
  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&sampleContent=1&quest=cycle-2",
    { waitUntil: "domcontentloaded" }
  );

  await expect(page.locator('[data-child-surface="adventure-map"]')).toBeVisible();
  await expect(page.locator("[data-child-progress]")).toHaveText("0 of 5 stops complete");
  await expect(page.locator('[data-quest-view="cycle"], [data-quest-view="round"]')).toHaveCount(0);

  await page.goto(
    "/preview/child-surfaces.html?surface=adventure-map&sampleContent=1&lockedCycle=cycle-14",
    { waitUntil: "domcontentloaded" }
  );

  const assignedMap = page.locator('[data-child-surface="adventure-map"]');
  await expect(assignedMap).toHaveAttribute("data-locked-cycle-id", "cycle-14");
  await expect(assignedMap.locator('[data-cycle-id="cycle-14"][data-node-state="next"]')).toBeVisible();
  await assignedMap.locator('[data-cycle-id="cycle-14"]').click();
  await expect(page.locator('[data-quest-view="round"][data-cycle-id="cycle-14"]')).toBeVisible();
  await expect(page.locator('[data-child-surface="adventure-map"], [data-quest-view="cycle"]')).toHaveCount(0);
});

const sampleCycles = ["cycle-1", "cycle-6", "cycle-11", "cycle-17", "cycle-22"];
const mapUrl = "/preview/child-surfaces.html?surface=adventure-map";
const mapKey = "lp-el-quest:child-surface-preview";

test("all sample stops keep their authored landmarks across both Adventure Maps", async ({ page }) => {
  test.setTimeout(90_000);
  const authored = [
    ["meadow", 0, "Farm Gate"], ["meadow", 5, "Sheep Pen"],
    ["dino", 1, "Mud Pits"], ["dino", 7, "Lava Flow"], ["moonwood", 3, "Moonlit Pond"]
  ];
  await page.goto(`${mapUrl}&sampleContent=1`, { waitUntil: "domcontentloaded" });
  for (const [index, [world, slot, name]] of authored.entries()) {
    const cycleId = sampleCycles[index];
    const progress = { ...emptyElQuestProgress(), cycles: Object.fromEntries(
      sampleCycles.slice(0, Math.max(0, index - (index === 1 || index === 3 ? 1 : 0))).map(id => [id, { stars: 3 }])
    ) };
    await page.evaluate(({ mapKey, progress }) => {
      localStorage.setItem(mapKey, JSON.stringify(progress));
      window.dispatchEvent(new CustomEvent("lp-progress-hydrated", { detail: { studentId: "child-surface-preview" } }));
    }, { mapKey, progress });
    const marker = page.locator(`.kg-atlas-stop[data-stop="${cycleId}"]`);
    await expect(marker).toHaveAccessibleName(new RegExp(`^${name},`));
    const [x, y] = ADVENTURE_ATLASES[world].points[slot];
    expect(await marker.evaluate(node => [node.style.left, node.style.top])).toEqual([`${x}%`, `${y}%`]);
    if (cycleId === "cycle-6") {
      await marker.click();
      await expect(page.getByRole("complementary", { name: "Sheep Pen details" })).toContainText(mapAreaDetails(world, slot));
    }
  }

  // A non-entitled direct link exercises the genuine inner map.
  await page.evaluate(({ mapKey, progress }) => localStorage.setItem(mapKey, JSON.stringify(progress)),
    { mapKey, progress: { ...emptyElQuestProgress(), cycles: { "cycle-1": { stars: 3 } } } });
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto(`${mapUrl}&sampleContent=1&quest=cycle-2&preserveAdventure=1`, { waitUntil: "domcontentloaded" });
  for (const viewport of [{ width: 1100, height: 760 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    const sheep = page.locator('.sbq-stop[data-stop="cycle-6"]');
    await expect(sheep).toHaveAccessibleName("Sheep Pen - you are here");
    const wide = await page.evaluate(() => matchMedia("(min-width: 1024px) and (pointer: fine)").matches);
    const [x, y] = (wide ? ADVENTURE_ATLASES.meadow.points : ADVENTURE_ATLASES.meadow.portraitPoints)[5];
    await expect.poll(() => sheep.evaluate(node => [node.style.left, node.style.top])).toEqual([`${x}%`, `${y}%`]);
  }
});

const completedProgress = cycles => ({
  ...emptyElQuestProgress(), cycles: Object.fromEntries(cycles.map(id => [id, { stars: 3 }]))
});
const fullCycleIds = Array.from({ length: 27 }, (_, index) => `cycle-${index + 1}`);

test("a completed sample map offers Home even when cached progress also covers every full-catalogue cycle", async ({ page }) => {
  test.slow();
  await page.goto(`${mapUrl}&sampleContent=1`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".kg-atlas-continue [data-child-primary]")).toHaveAttribute("data-cycle-id", "cycle-1");
  await page.evaluate(({ mapKey, progress }) => {
    localStorage.setItem(mapKey, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", { detail: { studentId: "child-surface-preview" } }));
  }, { mapKey, progress: completedProgress(fullCycleIds) });
  await expect(page.getByText("You finished this map!")).toBeVisible();
  await expect(page.getByRole("button", { name: "More Word Match", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to Home", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-student-destination", "student-home");
});

test("full map completion names the More Word Match extension consistently", async ({ page }) => {
  test.slow();
  await page.addInitScript(({ mapKey, progress }) => localStorage.setItem(mapKey, JSON.stringify(progress)),
    { mapKey, progress: completedProgress(fullCycleIds) });
  await page.goto(`${mapUrl}&preserveAdventure=1`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Play More Word Match.")).toBeVisible();
  await page.getByRole("button", { name: "More Word Match", exact: true }).click();
  await expect(page.locator('[data-quest-view="round"]')).toHaveAttribute("data-cycle-id", "cycle-27");
  await expect(page.locator('[data-quest-view="round"]')).toHaveAttribute("data-station-id", "spell");
});

test("an exact assignment can reopen a completed cycle outside ordinary sample entitlement", async ({ page }) => {
  test.slow();
  await page.addInitScript(({ mapKey, progress }) => localStorage.setItem(mapKey, JSON.stringify(progress)),
    { mapKey, progress: completedProgress(["cycle-14"]) });
  await page.goto(`${mapUrl}&sampleContent=1&lockedCycle=cycle-14&preserveAdventure=1`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".kg-atlas-continue [data-child-primary]")).toHaveAttribute("data-cycle-id", "cycle-14");
  await page.locator(".kg-atlas-continue [data-child-primary]").click();
  await expect(page.locator('[data-quest-view="round"]')).toHaveAttribute("data-cycle-id", "cycle-14");
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
