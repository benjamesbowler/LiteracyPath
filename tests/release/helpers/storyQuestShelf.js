import { expect } from "@playwright/test";

/** Find a title by using the same arrows available to a pupil. */
export async function showStoryQuestCard(page, card) {
  const shelf = page.locator('[data-child-surface="story-quests"]');
  await expect(shelf).toBeVisible();
  if (await card.isVisible()) return card;

  const pager = shelf.getByRole("navigation", { name: "More stories in this world" });
  if (await pager.isVisible()) {
    const previous = pager.getByRole("button", { name: "Previous stories" });
    const next = pager.getByRole("button", { name: "Next stories" });
    const pageCount = Number((await pager.locator("output").textContent()).split(" of ").at(-1));
    for (let turn = 0; turn < pageCount && await previous.isEnabled(); turn += 1) {
      await previous.click();
    }
    for (let turn = 1; turn < pageCount && !(await card.isVisible()) && await next.isEnabled(); turn += 1) {
      await next.click();
    }
  }
  await expect(card).toBeVisible();
  return card;
}

export async function showStoryQuestReaderPane(reader, name) {
  const button = reader.getByRole("navigation", { name: "This scene" }).getByRole("button", { name, exact: true });
  if (await button.isVisible() && await button.getAttribute("aria-pressed") !== "true") {
    await button.click();
  }
}
