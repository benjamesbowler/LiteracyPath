import { expect, test } from "@playwright/test";

async function clickExactPracticeWord(page, word) {
  const index = await page.locator(".lg-hop-grid button").evaluateAll(
    (buttons, target) => buttons.findIndex(button => button.textContent.trim() === target),
    word
  );
  expect(index, `missing practice choice ${word}`).toBeGreaterThanOrEqual(0);
  await page.locator(".lg-hop-grid button").nth(index).click();
}

async function sentenceWords(page) {
  return page.locator(".lg-sentence-path span").evaluateAll(nodes => nodes.map(node => node.textContent.trim()));
}

test("shared practice games keep replay muted and commit the final sentence once", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1024, height: 768 });

  for (const gameId of ["word-hopscotch", "reading-race"]) {
    await page.goto(`/preview/game-overlay.html?game=${gameId}&sound=0&music=0`);
    await expect(page.getByRole("dialog", { name: gameId === "word-hopscotch" ? "Word Hopscotch" : "Sentence Fix-It", exact: true })).toBeVisible();
    await expect(page.locator(".lg-game-audio")).toHaveCount(0);
  }

  await page.goto("/preview/game-overlay.html?game=word-hopscotch&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Word Hopscotch", exact: true });
  await expect(player).toBeVisible();
  await expect(player.locator(".lg-sentence-path span").first()).toBeVisible({ timeout: 90_000 });

  for (let round = 0; round < 5; round += 1) {
    for (const word of await sentenceWords(page)) await clickExactPracticeWord(page, word);
    await expect(player.locator(".lg-game-meter")).toHaveAttribute("aria-label", `${round + 2} of 6`, { timeout: 5_000 });
  }

  const finalWords = await sentenceWords(page);
  for (const word of finalWords.slice(0, -1)) await clickExactPracticeWord(page, word);
  const scoreBeforeFinalWord = Number((await player.locator(".lg-game-score").textContent()).match(/\d+/)?.[0] || 0);
  const lastWord = finalWords.at(-1);
  const lastIndex = await page.locator(".lg-hop-grid button").evaluateAll(
    (buttons, target) => buttons.findIndex(button => button.textContent.trim() === target),
    lastWord
  );

  await page.locator(".lg-hop-grid button").nth(lastIndex).evaluate(button => {
    for (let index = 0; index < 6; index += 1) {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }
  });

  await expect(player.getByRole("heading", { name: "Word Hopscotch complete!", exact: true })).toBeVisible({ timeout: 5_000 });
  const finalScore = Number((await player.locator(".lg-game-complete p").first().textContent()).match(/\d+/)?.[0] || 0);
  // The final word intentionally carries the normal word score plus one
  // sentence-completion bonus. Six rapid activations must not multiply it.
  expect(finalScore).toBe(scoreBeforeFinalWord + 50);
});
