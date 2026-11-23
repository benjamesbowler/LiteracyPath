import { expect, test } from "@playwright/test";

test("current-focus support opens useful teaching and matches the roster without changing the whole-profile scope", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=today&focus-evidence=1");
  await expect(page.getByRole("button", { name: "Plan focused practice for Aisha in Initial Sounds" })).toBeVisible();
  await page.getByRole("button", { name: "Plan focused practice for Aisha in Initial Sounds" }).click();
  const planner = page.locator(".teacher-intervention-planner");
  await expect(planner).toBeVisible();
  await expect(planner.getByRole("textbox", { name: "Skill to work on" })).toHaveValue("Initial Sounds");
  await expect(planner.getByLabel("Aisha", { exact: true })).toBeChecked();
  await expect(planner.getByRole("textbox", { name: "Teaching activity" })).toHaveValue(/Initial Sounds/);
  await page.getByText("Class briefing and counts", { exact: true }).click();
  await expect(page.locator(".teacher-today-metrics")).toContainText("Skills answers saved");
  await expect(page.locator(".teacher-today-metrics")).toContainText("Saved activity today");
  await page.goto("/preview/teacher-a11y.html?surface=classes&focus-evidence=1");
  await page.locator(".teacher-roster-column-picker > summary").click();
  await page.getByLabel("Focus accuracy", { exact: true }).check();
  const nameButton = page.locator(".teacher-roster-name").filter({ hasText: "Aisha" });
  const row = page.getByRole("row").filter({ has: nameButton });
  await expect(row.locator('[data-label="Focus status"]')).toHaveText("Needs support");
  await expect(row.locator('[data-label="Focus accuracy"]')).toContainText("30%");
  await nameButton.click();
  await page.getByText("Across skills and latest results", { exact: true }).click();
  await expect(page.locator(".teacher-student-panel-summary").filter({ hasText: "Across skills:" })).toContainText("Not enough results");
  await expect(page.getByRole("button", { name: "Open guided reading", exact: true })).toBeVisible();
  await expect(page.getByText("Open guided reading — Level C", { exact: true })).toHaveCount(0);
});

test("one click opens the current class report and keeps report choices changeable", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=progress#teacher/reports?class=00000000-0000-4000-8000-0000000000a1");
  await page.getByRole("button", { name: "Open Audit Class A summary", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Audit Class A · class report", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit Class A · class report", exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => new URLSearchParams(location.hash.split("?")[1]).get("who"))).toBe("class");
  await expect.poll(() => page.evaluate(() => new URLSearchParams(location.hash.split("?")[1]).get("show"))).toBe("1");
  await page.getByRole("button", { name: "Change student or class summary", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Find a student" })).toBeVisible();
});

for (const practice of ["woodland", "campaign"]) {
  test(`${practice} participation stays distinct from earlier trail history and Skills evidence`, async ({ page }) => {
    await page.goto(`/preview/teacher-a11y.html?surface=classes&learner=1&sound-seekers-practice=${practice}`);
    await page.getByText("More for Aarav", { exact: true }).click();
    await expect(page.getByLabel("Aarav results summary")).toContainText("3 of 3");
    const summary = page.locator('[data-sound-seekers-evidence="practice"]');
    await expect(summary).toContainText(practice === "campaign" ? "3 of 30 stages · 15 of 150 missions" : "2 of 5 projects");
    await expect(summary).toContainText("supported practice, separate from Skills results");
    if (practice === "campaign") {
      await expect(summary).toContainText("Last reported practice answer");
      await expect(summary).toContainText("45 practice responses");
      await expect(summary).not.toContainText("mastered");
    }
    await page.getByRole("button", { name: "Show Aarav's sound map", exact: true }).click();
    await expect(page.locator(".quest-heat-panel")).toContainText("Earlier trail history");
    await expect(page.getByRole("button", { name: "Assign practice", exact: true })).toHaveCount(0);
  });
}

test("short-a support opens the exact practice materials for the confirmed three-pupil group", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/preview/teacher-a11y.html?surface=today&focus-evidence=1&short-a-pilot=1", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Plan focused practice for Aisha in CVC and Short Vowels", exact: true }).click();
  const planner = page.locator(".teacher-intervention-planner");
  const sequence = planner.getByRole("region", { name: "Short-vowel teaching sequence" });
  await expect(planner.getByRole("checkbox", { name: "Aisha", exact: true })).toBeChecked();
  await planner.getByRole("checkbox", { name: "Aarav", exact: true }).check();
  await planner.getByRole("checkbox", { name: "Camila", exact: true }).check();
  await sequence.getByRole("button", { name: "See a short-vowel teaching sequence" }).click();
  await expect(sequence).toContainText("join c to at");
  await expect(sequence).toContainText("I am a cat.");
  await expect(sequence).toContainText("show “tap” by itself if it is fresh");
  const game = sequence.getByRole("button", { name: "Prepare Blend & Build" });
  const book = sequence.getByRole("button", { name: "Prepare book practice" });
  const ready = sequence.getByRole("checkbox", { name: /I have taught through Cycle 10/ });
  await expect(game).toBeDisabled();
  await expect(book).toBeDisabled();
  await ready.check();
  await game.click();
  await book.click();
  const preparations = await page.evaluate(() => window.__preparedSupportSessions);
  expect(preparations).toHaveLength(2);
  expect(preparations.map(item => item.context)).toEqual([
    { audience: "selected_students", target: "arcade_game", gameId: "blend-and-build" },
    { audience: "selected_students", target: "assigned_book", bookId: "small-steps-01" }
  ]);
  for (const preparation of preparations) {
    expect(new Set(preparation.studentIds)).toEqual(new Set(["student-aisha", "student-camila", "student-aarav"]));
  }
  await sequence.getByRole("button", { name: "Use this teaching sequence" }).click();
  await expect(planner.getByRole("textbox", { name: "Teaching activity" })).toHaveValue(/show tap without a picture or spoken cue/);
  await expect(planner.getByRole("button", { name: "Save support plan" })).toBeEnabled();
  await planner.getByRole("checkbox", { name: "Camila", exact: true }).uncheck();
  await expect(ready).not.toBeChecked();
  await expect(game).toBeDisabled();
  await expect(planner.getByRole("button", { name: "Save support plan" })).toBeDisabled();
  await planner.getByRole("textbox", { name: "Skill to work on" }).fill("Short vowel i");
  await expect(sequence).toHaveCount(0);
  await expect(planner.getByRole("button", { name: "Save support plan" })).toBeDisabled();
});

test("short-a preparation keeps unavailable and quarantined materials out of the planner", async ({ page }) => {
  test.setTimeout(90_000);
  await page.route("**/images/child-mode/cvc/cat.webp", route => route.abort());
  await page.route("**/images/cvc/cat.svg", route => route.abort());
  await page.goto("/preview/teacher-a11y.html?surface=today&focus-evidence=1&short-a-pilot=1&short-a-quarantine=1", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Plan focused practice for Aisha in CVC and Short Vowels", exact: true }).click();
  const sequence = page.getByRole("region", { name: "Short-vowel teaching sequence" });
  await sequence.getByRole("button", { name: "See a short-vowel teaching sequence" }).click();
  await expect(sequence).toContainText("The reviewed game round or picture is unavailable.");
  await expect(sequence).toContainText("The approved book page could not be verified.");
  await expect(sequence.getByRole("button", { name: /Prepare|Use this teaching sequence/ })).toHaveCount(0);
});
