import { expect, test } from "@playwright/test";

async function openLesson(page, cycle, day) {
  await page.goto("/preview/teacher-a11y.html?surface=present");
  await page.getByLabel("Cycle", { exact: true }).selectOption(cycle);
  await page.getByLabel("Day", { exact: true }).selectOption(day);
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  return popup;
}

test("Friday shows its focus, groups rounds and finishes after the story questions", async ({ page }) => {
  const projector = await openLesson(page, "cycle-15", "friday");
  await expect(page.getByText("Estimated teaching time is", { exact: false })).toContainText("priority rounds");
  const start = projector.getByRole("dialog", { name: /Cycle 15/ });
  await expect(start).toContainText("Friday · Weekly review");
  await start.getByRole("button", { name: "Start presentation" }).click();

  const slides = projector.getByRole("button", { name: "Choose a slide" });
  await slides.click();
  const chooser = projector.getByRole("dialog", { name: "Choose a slide" });
  for (const block of ["Recall", "Focus", "Blend", "Games", "Reading"]) {
    await expect(chooser.getByRole("heading", { name: block, exact: true })).toBeVisible();
  }
  await expect(chooser.getByRole("button", { name: /Build a word · Round 1/ })).toBeVisible();
  await expect(chooser.getByRole("button", { name: /Build a word · Round 2.*Extra practice/ })).toBeVisible();
  await chooser.getByRole("button", { name: /Our week · Monday to Thursday/ }).click();
  await expect(projector.getByRole("button", { name: "Next card", exact: true })).toBeVisible();
  await expect(projector.getByRole("button", { name: "Next slide", exact: true })).toBeVisible();

  await slides.click();
  await chooser.getByRole("button", { name: /Weekly round-up/ }).click();
  await expect(projector.getByRole("button", { name: "Finish lesson" })).toBeHidden();
  await slides.click();
  await chooser.getByRole("button", { name: /Cycle Shorts · Question 3 of 3/ }).click();
  const finish = projector.getByRole("button", { name: "Finish lesson" });
  await finish.click();
  const complete = projector.getByRole("dialog", { name: "Week complete" });
  await expect(complete.getByRole("button", { name: "Return to Teach" })).toBeFocused();
  await complete.getByRole("button", { name: "Review last slide" }).click();
  await expect(projector.getByRole("button", { name: "Show the answer" })).toBeVisible();
  await finish.click();
  await page.route(url => url.pathname === "/", route => route.fulfill({ contentType: "text/html", body: "<title>Teach route test</title>" }));
  await Promise.all([
    page.waitForURL(url => url.hash.startsWith("#teacher/teach?class=")),
    projector.waitForEvent("close"),
    complete.getByRole("button", { name: "Return to Teach" }).click()
  ]);
});

test("phone layout keeps native lesson controls large and avoids horizontal clipping", async ({ page }) => {
  const projector = await openLesson(page, "cycle-23", "tuesday");
  await projector.setViewportSize({ width: 390, height: 844 });
  await projector.evaluate(() => { document.documentElement.requestFullscreen = undefined; });
  await projector.getByRole("button", { name: "Start presentation" }).click();
  const slides = projector.getByRole("button", { name: "Choose a slide" });
  for (const title of [/Uppercase · finger trace/, /Sentence Mix-Up/, /Starting sound picture sort/, /Cycle Shorts · Question 3 of 3/]) {
    await slides.click();
    await projector.getByRole("dialog", { name: "Choose a slide" }).getByRole("button", { name: title }).first().click();
    const fit = await projector.locator(".slide.active").evaluate(slide => {
      const buttons = [...slide.querySelectorAll("button")].filter(button => button.getClientRects().length && getComputedStyle(button).visibility !== "hidden");
      return {
        horizontalOverflow: slide.scrollWidth - slide.clientWidth,
        undersized: buttons.filter(button => {
          const { height, width } = button.getBoundingClientRect();
          return height < 44 || width < 44;
        }).map(button => button.textContent.trim())
      };
    });
    expect(fit.horizontalOverflow, String(title)).toBeLessThanOrEqual(1);
    expect(fit.undersized, String(title)).toEqual([]);
  }
});
