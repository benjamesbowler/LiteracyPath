import { expect, test } from "@playwright/test";

const IPAD_VIEWPORTS = [
  { name: "iPad landscape", width: 1024, height: 768 },
  { name: "iPad portrait", width: 768, height: 1024 },
  { name: "short landscape", width: 568, height: 320 }
];

async function pageGeometry(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector(".student-session-setup");
    const backdrop = document.querySelector(".student-session-modal-backdrop");
    return {
      documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      dialogOverflowX: dialog.scrollWidth - dialog.clientWidth,
      dialogFitsViewport: dialog.getBoundingClientRect().bottom <= window.innerHeight + 1,
      backdropPosition: getComputedStyle(backdrop).position,
      dialogOverflowYStyle: getComputedStyle(dialog).overflowY
    };
  });
}

test("Adventure Map whole-class setup stays usable across classroom iPad sizes", async ({ page }) => {
  for (const viewport of IPAD_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/student-session-controls.html", { waitUntil: "domcontentloaded" });

    const dialog = page.getByRole("dialog", { name: "Start student session" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

    const adventure = page.getByRole("button", { name: /^Adventure Map/ });
    await adventure.scrollIntoViewIfNeeded();
    await adventure.click();
    await expect(page.getByRole("button", { name: /^Each child's current space/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /^Whole class/ })).toHaveAttribute("aria-pressed", "true");

    const exactMode = page.getByRole("button", { name: /^One space for everyone/ });
    await exactMode.scrollIntoViewIfNeeded();
    await exactMode.click();
    const spaceSelect = page.getByLabel("Adventure Map space");
    await expect(spaceSelect).toBeEnabled();
    await spaceSelect.selectOption("cycle-14");
    await expect(dialog).toContainText("Fern Jungle, Cycle 14");

    const start = page.getByRole("button", { name: "Start for whole class" });
    await start.scrollIntoViewIfNeeded();
    await expect(start).toBeEnabled();
    const keyControlHeights = await Promise.all([
      adventure,
      exactMode,
      page.getByRole("button", { name: /^Each child's current space/ }),
      start
    ].map(locator => locator.evaluate(element => element.getBoundingClientRect().height)));
    expect(Math.min(...keyControlHeights), `${viewport.name} controls meet the 44px touch floor`)
      .toBeGreaterThanOrEqual(44);

    const geometry = await pageGeometry(page);
    expect(geometry.documentOverflowX, `${viewport.name} has no page-width overflow`).toBeLessThanOrEqual(1);
    expect(geometry.documentOverflowY, `${viewport.name} keeps scrolling inside the modal`).toBeLessThanOrEqual(1);
    expect(geometry.dialogOverflowX, `${viewport.name} modal has no sideways scroll`).toBeLessThanOrEqual(1);
    expect(geometry.dialogFitsViewport, `${viewport.name} modal remains inside the viewport`).toBe(true);
    expect(geometry.backdropPosition).toBe("fixed");
    expect(geometry.dialogOverflowYStyle).toBe("auto");
  }
});

test("whole-class exact-space start sends one bounded assignment", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/student-session-controls.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /^Adventure Map/ }).click();
  await page.getByRole("button", { name: /^One space for everyone/ }).click();
  await page.getByLabel("Adventure Map space").selectOption("cycle-14");
  await page.getByRole("button", { name: "Start for whole class" }).click();

  await expect.poll(() => page.evaluate(() => window.__studentSessionPreviewLastRpc)).toEqual({
    name: "teacher_start_student_focus_session",
    args: {
      p_class_id: "class-preview",
      p_target: "adventure_map",
      p_student_ids: [],
      p_assignments: {
        "*": {
          map_mode: "one_space_for_everyone",
          cycle_id: "cycle-14",
          cycle_number: 14,
          space_name: "Fern Jungle"
        }
      },
      p_duration_minutes: 60,
      p_content_version: expect.any(String),
      p_whole_class: true
    }
  });
});

test("Cycle Practice reserves time for 30 minutes of practice and its check", async ({ page }) => {
  for (const viewport of IPAD_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/preview/student-session-controls.html?target=cycle_practice", { waitUntil: "domcontentloaded" });
    const expiry = page.getByLabel("Safety expiry");
    await expect(expiry).toHaveValue("60");
    await expect(expiry.locator("option")).toHaveText(["1 hour", "90 minutes", "2 hours"]);
    await expiry.scrollIntoViewIfNeeded();
    await expect(page.getByText("Allows 30 minutes of active practice and a short check.")).toBeVisible();
    const geometry = await pageGeometry(page);
    expect(geometry.dialogFitsViewport, viewport.name).toBe(true);
    expect(geometry.documentOverflowX, viewport.name).toBeLessThanOrEqual(1);
    expect(geometry.dialogOverflowX, viewport.name).toBeLessThanOrEqual(1);
  }
});

test("switching from a 30-minute activity to Cycle Practice sends a 60-minute expiry", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/student-session-controls.html", { waitUntil: "domcontentloaded" });
  const expiry = page.getByLabel("Safety expiry");
  await expiry.selectOption("30");
  await page.getByRole("button", { name: /^Cycle Practice/ }).click();
  await expect(expiry).toHaveValue("60");
  await expect(expiry.locator('option[value="30"]')).toHaveCount(0);
  await page.getByRole("button", { name: /^Cycle 4 / }).click();
  await page.getByRole("button", { name: "Start for whole class" }).click();
  await expect.poll(() => page.evaluate(() => window.__studentSessionPreviewLastRpc)).toMatchObject({
    name: "teacher_start_cycle_practice_session",
    args: { p_duration_minutes: 60, p_whole_class: true, p_student_ids: [], p_assignments: { "*": { cycle_id: "cycle-4" } } }
  });
});

test("Cycle Practice preserves a longer expiry and other activities retain 30 minutes", async ({ page }) => {
  await page.goto("/preview/student-session-controls.html", { waitUntil: "domcontentloaded" });
  const expiry = page.getByLabel("Safety expiry");
  await expiry.selectOption("90");
  await page.getByRole("button", { name: /^Cycle Practice/ }).click();
  await expect(expiry).toHaveValue("90");
  await page.getByRole("button", { name: /^Adventure Map/ }).click();
  await expect(expiry).toHaveValue("90");
  await expiry.selectOption("30");
  await page.getByRole("button", { name: "Start for whole class" }).click();
  await expect.poll(() => page.evaluate(() => window.__studentSessionPreviewLastRpc?.args.p_duration_minutes)).toBe(30);
});

test("Cycle 27 practice uses a word-and-sound title without changing its curriculum assignment", async ({ page }) => {
  await page.goto("/preview/student-session-controls.html?target=cycle_practice", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Cycle 27: Word and sound review/ }).click();
  await expect(page.locator(".student-session-start-summary")).toContainText("Cycle 27: Word and sound review");
  await expect(page.getByRole("dialog")).not.toContainText("Poem Launch");
  await page.getByRole("button", { name: "Start for whole class" }).click();
  await expect.poll(() => page.evaluate(() => window.__studentSessionPreviewLastRpc?.args.p_assignments)).toMatchObject({
    "*": { cycle_id: "cycle-27", cycle_number: 27, cycle_title: "Cycle 27" }
  });
});

test("a preselected small group can use each learner's current map space", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(
    "/preview/student-session-controls.html?selected=student-b",
    { waitUntil: "domcontentloaded" }
  );
  await page.getByRole("button", { name: /^Adventure Map/ }).click();
  await expect(page.getByRole("button", { name: /^Choose students/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByRole("button", { name: /^Each child's current space/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("button", { name: "Start for 1 student" }).click();

  await expect.poll(() => page.evaluate(() => window.__studentSessionPreviewLastRpc)).toEqual({
    name: "teacher_start_student_focus_session",
    args: {
      p_class_id: "class-preview",
      p_target: "adventure_map",
      p_student_ids: ["student-b"],
      p_assignments: { "*": { map_mode: "each_child_current" } },
      p_duration_minutes: 60,
      p_content_version: expect.any(String),
      p_whole_class: false
    }
  });
});

test("live controls distinguish normal end from immediate student switching", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/student-session-controls.html?active=1", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Adventure Map: One space for everyone · Fern Jungle, Cycle 14")).toBeVisible();
  await page.getByRole("button", { name: "End & switch students" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.lastEndAction))
    .toBe("student_picker");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "End session" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.lastEndAction))
    .toBe("return_home");
});

test("Cycle practice teacher results show independent denominator and unscored reasons", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/student-session-controls.html?active=1&cycleResults=1", { waitUntil: "domcontentloaded" });
  await page.getByText("Students", { exact: true }).click();
  await expect(page.getByText(/1 of 2 independent responses correct/)).toBeVisible();
  await expect(page.getByText(/No independent score/).first()).toBeVisible();
  await expect(page.getByText(/Active practice 1810s/).first()).toBeVisible();
  await expect(page.getByText("Check incomplete", { exact: true })).toHaveCount(3);
  await expect(page.getByText(/Areas practised .*letter sound .*12 responses/).first()).toBeVisible();
  await expect(page.getByText("Areas checked: letter sound, letter formation, phoneme").first()).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export practice results" }).click();
  expect((await download).suggestedFilename()).toBe("cycle-practice-results.csv");
  await expect(page.getByText("Practice evidence · not a formal assessment").first()).toBeVisible();
  const evidence = page.getByText(/1 of 2 independent responses correct/);
  expect(await evidence.evaluate(element => {
    const box = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.left + 5, box.top + 5));
  })).toBe(true);
  await page.getByText("Practise next", { exact: true }).click();
  await expect(page.getByText("Response: n", { exact: true })).toBeVisible();
  await expect(page.getByText(/Practise with support, then try independently/)).toBeVisible();
  await expect(page.getByText(/Replay the required media before checking/)).toBeVisible();
  await page.screenshot({ path: ".artifacts/cycle-practice-teacher-results.png" });
  const mediaRetry = page.getByText(/Replay the required media before checking/);
  await mediaRetry.scrollIntoViewIfNeeded();
  expect(await mediaRetry.evaluate(element => {
    const box = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.left + 5, box.top + 5));
  })).toBe(true);
  await page.screenshot({ path: ".artifacts/cycle-practice-teacher-next-media.png" });
});
