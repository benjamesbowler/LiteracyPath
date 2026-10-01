import { expect, test } from "@playwright/test";

const scope = "child-surface-preview";
const ledgerKey = `lp-hollow:${scope}`;
const route = "/preview/child-surfaces.html?surface=my-hollow";

async function ledger(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}"), ledgerKey);
}

test("gift reveals the owned friend immediately, once, with no locked collection wall", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("button", { name: "Open your gift", exact: true })).toBeVisible();
  await expect(page.locator(".hollow-doorways button")).toHaveCount(3);
  await expect(page.locator(".kg-currency, .hollow-wallet, .hollow-tabs, .hollow-spot")).toHaveCount(0);
  await page.getByRole("button", { name: "Open your gift", exact: true }).dblclick();
  await expect(page.getByRole("heading", { name: "My Beasties", exact: true })).toBeVisible();
  await expect(page.locator(".hollow-beastie")).toHaveCount(1);
  await expect(page.locator(".hollow-beastie.mystery, .hollow-hatch-overlay")).toHaveCount(0);
  expect((await ledger(page)).purchases.filter(p => p.item === "egg-welcome")).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole("button", { name: "Decorate my Hollow" })).toBeVisible();
  await page.getByRole("button", { name: "Beasties", exact: true }).click();
  await expect(page.locator(".hollow-beastie")).toHaveCount(1);
  await expect(page.locator(".hollow-feed-help small")).toHaveText("Read a book to earn food.");
});

test("affordable decorations come first and a purchase goes straight to saved placement", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Decorate", exact: true }).click();
  await expect(page.locator(".hollow-spot")).toHaveCount(0);
  await page.getByRole("button", { name: "Choose a decoration" }).click();
  const jar = page.locator(".hollow-ware").filter({ hasText: "Glow jar" });
  await expect(page.locator(".hollow-ware").first()).toContainText("Glow jar");
  await expect(jar).toBeEnabled();
  await jar.click();
  await expect(page.getByRole("heading", { name: "Decorate", exact: true })).toBeVisible();
  await page.locator(".hollow-spot.empty.recommended").click();
  await expect(page.locator(".hollow-picker")).toHaveCount(0);
  let stored = await ledger(page);
  expect(stored.purchases.filter(p => p.item === "hollow-glow-jar")).toHaveLength(1);
  expect(Object.values(stored.layout.slots)).toContain("hollow-glow-jar");
  await page.reload();
  await page.getByRole("button", { name: "Decorate", exact: true }).click();
  await expect(page.locator('.hollow-spot.filled[title="Put away Glow jar"]')).toBeVisible();
  await page.locator('.hollow-spot.filled[title="Put away Glow jar"]').click();
  await page.locator(".hollow-spot.empty.recommended").click();
  await page.getByRole("button", { name: "Glow jar", exact: true }).click();
  stored = await ledger(page);
  expect(Object.values(stored.layout.slots)).toContain("hollow-glow-jar");
});

test("gear purchase equips immediately and owned gear remains editable", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: "My Guide", exact: true }).click();
  await expect(page.locator(".hollow-guide-balance")).toHaveCount(0);
  await page.getByRole("button", { name: "Find Guide gear" }).click();
  const boots = page.locator(".hollow-ware").filter({ hasText: "Trail boots" });
  await boots.click();
  await expect(page.getByRole("heading", { name: "My Guide", exact: true })).toBeVisible();
  expect((await ledger(page)).layout.equipped.feet).toBe("gear-trail-boots");
  const ownedBoots = page.locator(".hollow-gear").filter({ hasText: "Trail boots" });
  await expect(ownedBoots).toContainText("Wearing");
  await ownedBoots.click();
  expect((await ledger(page)).layout.equipped.feet).toBeUndefined();
  await page.getByRole("button", { name: "Change Guide", exact: true }).click();
  await expect(page.getByText("Changing costs 10 stars. You have 0.")).toBeVisible();
});

test("feeding spends one earned berry and preserves the creature after reload", async ({ page }) => {
  await page.addInitScript(({ scope }) => {
    localStorage.setItem(`literacyPath.guidedReadingRecords.${scope}`, JSON.stringify({ fixtureBook: { readCount: 1 } }));
  }, { scope });
  await page.goto(route);
  await page.getByRole("button", { name: "Open your gift", exact: true }).click();
  await page.getByRole("button", { name: /^Feed / }).click();
  expect((await ledger(page)).feeds).toHaveLength(1);
  await expect(page.getByLabel("0 berries", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Beasties", exact: true }).click();
  await expect(page.locator(".hollow-beastie em")).toHaveText("2 feeds to grow");
  await expect(page.getByRole("button", { name: /^Feed / })).toBeDisabled();
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1194, height: 834 }]) {
  test(`entry, shop and owned collection fit at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(route);
    const surface = page.locator(".hollow-simple");
    for (const action of [null, "Decorate", "Choose a decoration"]) {
      if (action) await page.getByRole("button", { name: action, exact: true }).click();
      await expect(surface.locator("[data-child-primary]")).toHaveCount(1);
      await surface.locator("[data-child-primary]").scrollIntoViewIfNeeded();
      await expect(surface.locator("[data-child-primary]")).toBeInViewport({ ratio: .99 });
      expect(await surface.evaluate(el => ({ x: el.scrollWidth > el.clientWidth + 1, page: document.documentElement.scrollHeight <= innerHeight + 1 }))).toEqual({ x: false, page: true });
    }
    await page.getByRole("button", { name: "← My Hollow", exact: true }).click();
    await page.getByRole("button", { name: "Open your gift", exact: true }).click();
    await expect(page.locator(".hollow-beastie")).toHaveCount(1);
    await surface.locator("[data-child-primary]").scrollIntoViewIfNeeded();
    await expect(surface.locator("[data-child-primary]")).toBeInViewport({ ratio: .99 });
    expect(await surface.evaluate(el => ({ x: el.scrollWidth > el.clientWidth + 1, page: document.documentElement.scrollHeight <= innerHeight + 1 }))).toEqual({ x: false, page: true });
  });
}

test("a full room keeps the bought decoration selected while making space", async ({ page }) => {
  await page.addInitScript(({ scope }) => {
    const items = ["hollow-glow-jar", "hollow-mushroom-stool", "hollow-moss-rug", "hollow-moon-lantern", "hollow-star-banner", "hollow-root-table"];
    const prices = [20, 35, 45, 40, 50, 55];
    localStorage.setItem(`lp-hollow:${scope}`, JSON.stringify({
      purchases: items.map((item, i) => ({ id: `fixture-${i}`, item, cost: prices[i], at: "2026-09-01T00:00:00Z" })),
      feeds: [], chests: [], layout: { at: "2026-09-01T00:00:00Z", equipped: {}, slots: Object.fromEntries(items.map((id, i) => [`s${i + 1}`, id])) }
    }));
    localStorage.setItem(`literacyPath.guidedReadingRecords.${scope}`, JSON.stringify(Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`book-${i}`, { readCount: 1 }]))));
  }, { scope });
  await page.goto(route);
  await page.getByRole("button", { name: "Decorate", exact: true }).click();
  await page.getByRole("button", { name: "Choose a decoration" }).click();
  const previous = new Set((await ledger(page)).purchases.map(p => p.item));
  await page.locator(".hollow-ware").first().click();
  const bought = (await ledger(page)).purchases.find(p => !previous.has(p.item)).item;
  await expect(page.getByText("Tap a decoration to make space.")).toBeVisible();
  await page.locator(".hollow-spot.filled[data-child-primary]").click();
  await page.locator(".hollow-spot.empty.recommended").click();
  expect(Object.values((await ledger(page)).layout.slots)).toContain(bought);
  await expect(page.locator(".hollow-picker")).toHaveCount(0);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1194, height: 834 }]) {
  test(`the full collection stays available through native scrolling at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(({ scope }) => {
      localStorage.setItem(`lp-hollow:${scope}`, JSON.stringify({
        purchases: Array.from({ length: 5 }, (_, i) => ({ id: `friend-${i}`, item: i ? "egg-bronze" : "egg-welcome", cost: i ? 100 : 0, at: "2026-09-01T00:00:00Z" })),
        feeds: [], chests: [], layout: { slots: {}, equipped: {} }
      }));
      localStorage.setItem(`literacyPath.guidedReadingRecords.${scope}`, JSON.stringify(Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`book-${i}`, { readCount: 1 }]))));
    }, { scope });
    await page.goto(route);
    await page.getByRole("button", { name: "Beasties", exact: true }).click();
    const friends = page.locator(".hollow-beastie");
    await expect(friends).toHaveCount(5);
    await expect(page.getByRole("button", { name: "More friends", exact: true })).toHaveCount(0);
    const lastFeed = friends.last().getByRole("button", { name: /^Feed / });
    await lastFeed.scrollIntoViewIfNeeded();
    await expect(lastFeed).toBeInViewport({ ratio: 1 });
    const before = (await ledger(page)).feeds.length;
    await lastFeed.click();
    expect((await ledger(page)).feeds).toHaveLength(before + 1);
    await expect(friends).toHaveCount(5);
    const scroll = await page.locator(".hollow-simple").evaluate(root => {
      const panel = root.querySelector(".hollow-panel");
      return { page: document.documentElement.scrollHeight <= innerHeight + 1, top: Math.max(root.scrollTop, panel.scrollTop) };
    });
    expect(scroll.page).toBe(true);
    if (viewport.width <= 600 || viewport.height <= 430) expect(scroll.top).toBeGreaterThan(0);
  });
}
