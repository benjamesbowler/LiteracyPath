import { expect, test } from "@playwright/test";

async function expectHearWordInFrame(page, word, next) {
  const round = page.locator(".cvc-hear-step");
  const controls = [`Hear ${word}`, ...[...word].map(letter => `Hear ${letter}`), "Sound out the word", next];
  for (const label of controls) {
    const button = round.getByRole("button", { name: label, exact: true });
    await expect(button).toBeInViewport({ ratio: 0.99 });
    const inFrame = await button.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const main = element.closest(".kg-main").getBoundingClientRect();
      const hit = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      return bounds.height >= 44 && bounds.width >= 44
        && bounds.top >= main.top && bounds.bottom <= main.bottom && element.contains(hit);
    });
    expect(inFrame, `${label} is reachable before scrolling`).toBe(true);
  }
}

for (const [width, height] of [[320, 568], [568, 320], [1024, 768]]) {
  test(`Word Workshop playback and Next fit the first round at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    await page.route("**/*.mp3", route => route.abort());
    await page.goto("/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1", { waitUntil: "commit" });
    await page.getByRole("button", { name: /^at word family,/ }).click();
    await expectHearWordInFrame(page, "cat", "Next Word");

    await page.getByRole("button", { name: "Hear cat", exact: true }).click();
    await page.getByRole("button", { name: "Hear c", exact: true }).click();
    await page.getByRole("button", { name: "Sound out the word", exact: true }).click();
    await expect(page.getByText("Sound stopped. Try again, or keep going.")).toBeInViewport({ ratio: 0.99 });
    await expectHearWordInFrame(page, "cat", "Next Word");
    await page.getByRole("button", { name: "Next Word", exact: true }).click();
    await expectHearWordInFrame(page, "bat", "Next Word");
    await page.getByRole("button", { name: "Next Word", exact: true }).click();
    await expectHearWordInFrame(page, "hat", "Continue");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(".cvc-build-step")).toBeVisible();
  });
}
