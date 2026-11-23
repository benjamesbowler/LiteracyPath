import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("last page stays resumable until Finish and a fresh reread starts on page one", async ({ page }) => {
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.getByRole("button", { name: "Find a book", exact: true }).click();
  await page.getByRole("button", { name: "Find by title", exact: true }).click();
  await page.getByLabel("Book title").fill("Big and Little");
  await page.getByRole("button", { name: "See 1 book", exact: true }).click();
  const book = page.locator('[data-book-id="first-facts-level-a-03-big-and-little"]');
  await book.click();
  const reader = page.getByRole("region", { name: "Big and Little full-screen reader" });
  const progress = reader.getByRole("status", { name: "Reading progress" });
  for (let number = 1; number < 7; number++) {
    await expect(progress).toHaveText(`Page ${number} of 7`);
    await reader.getByRole("button", { name: "Next page", exact: true }).click();
  }
  await expect(progress).toHaveText("Page 7 of 7");
  await reader.getByRole("button", { name: "Back to Books", exact: true }).click();
  await expect(book).not.toContainText("Read again");
  const keepReading = page.getByRole("button", { name: "Keep reading", exact: true });
  await keepReading.click();
  await expect(progress).toHaveText("Page 7 of 7");
  await reader.getByRole("button", { name: "Finish book", exact: true }).click();
  await expect(book).toContainText("Read again");
  await book.click();
  await expect(progress).toHaveText("Page 1 of 7");
  await reader.getByRole("button", { name: "Next page", exact: true }).click();
  await reader.getByRole("button", { name: "Back to Books", exact: true }).click();
  await expect(book).toContainText("Continue reading");
  await keepReading.click();
  await expect(progress).toHaveText("Page 2 of 7");
});

test("a two-sentence page keeps one listening cue through pause and buffering", async ({ page }) => {
  await page.addInitScript(() => {
    window.testAudio = [];
    const nativeAudio = window.Audio;
    window.Audio = function Audio(src) {
      const audio = new nativeAudio(src);
      window.testAudio.push(audio);
      audio.play = async () => audio.dispatchEvent(new Event("playing"));
      audio.pause = () => audio.dispatchEvent(new Event("pause"));
      return audio;
    };
  });
  await page.goto("/preview/guided-reading-preview.html?book=first-facts-level-a-03-big-and-little&mode=student");
  const reader = page.getByRole("region", { name: "Big and Little full-screen reader" });
  const cue = reader.locator(".guided-page-listening");
  await reader.getByRole("button", { name: "Hear this page", exact: true }).click();
  await expect(cue).toBeVisible();
  await reader.getByRole("button", { name: "Pause", exact: true }).click();
  await page.evaluate(() => window.testAudio.at(-1).dispatchEvent(new Event("waiting")));
  await page.waitForTimeout(2800); // Exceeds the previous wall-clock highlight schedule.
  await expect(cue).toBeVisible();
  await expect(reader.locator(".guided-sentence.active")).toHaveCount(0);
  await reader.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(cue).toBeVisible();
  await reader.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(cue).toHaveCount(0);
});
