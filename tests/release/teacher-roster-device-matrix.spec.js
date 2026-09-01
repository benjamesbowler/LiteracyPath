import { expect, test } from "@playwright/test";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const teacherId = "10000000-0000-4000-8000-000000000001";
const snapshotVariant = teacherPassword ? "authenticated" : "preview";
const supportsCurrentSnapshotVariant = process.platform === "linux"
  || (process.platform === "darwin" && snapshotVariant === "preview");

async function expectTeacherScreenshot(locator, name, options, testInfo) {
  if (!supportsCurrentSnapshotVariant) {
    if (!testInfo.annotations.some(annotation => annotation.type === "visual-evidence")) {
      testInfo.annotations.push({
        type: "visual-evidence",
        description: `${snapshotVariant} teacher pixels are not baselined on ${process.platform}; behavioral assertions still run, and hosted Linux captures both variants.`
      });
    }
    return;
  }
  await expect(locator).toHaveScreenshot(name, options);
}

async function openAuditRoster(page) {
  if (!teacherPassword) {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("teacherRosterPreviewDeviceGatePrepared")) {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("teacherRosterColumns:")) localStorage.removeItem(key);
        }
        sessionStorage.setItem("teacherRosterPreviewDeviceGatePrepared", "true");
      }
    });
    await page.goto("/preview/teacher-a11y.html?surface=classes&students=12");
  } else {
    await page.addInitScript(id => {
      if (!sessionStorage.getItem("teacherRosterDeviceGatePrepared")) {
        localStorage.removeItem(`teacherRosterColumns:${id}`);
        sessionStorage.setItem("teacherRosterDeviceGatePrepared", "true");
      }
    }, teacherId);
    await page.goto("/");
    await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
    await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await completeTeacherClassEntry(page);
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Students", exact: true })
      .click();
  }
  await expect(page.getByRole("heading", {
    name: "Audit Class A — 12 students",
    exact: true
  })).toBeVisible();
  await expect(page.locator(".teacher-roster-table tbody > tr")).toHaveCount(10);
  await expect(page.getByRole("navigation", { name: "Student roster pages" })).toContainText(
    "Page 1 of 2"
  );
}

async function expectNoViewportOverflow(page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth
    && document.body.scrollWidth <= window.innerWidth
  ))).toBe(true);
}

async function expectReadableFocusPills(roster, expectedLabels = ["Initial Sounds", "Final Sounds"]) {
  const measurements = await roster.locator(".teacher-focus-pill").evaluateAll(pills => pills.map(pill => {
    const value = pill.querySelector(".lp-defined-metric-value");
    const info = pill.querySelector(".lp-metric-definition-trigger");
    const pillBox = pill.getBoundingClientRect();
    const cellBox = pill.closest("td")?.getBoundingClientRect();
    const infoBox = info?.getBoundingClientRect();
    const valueStyle = value ? getComputedStyle(value) : null;
    const infoStyle = info ? getComputedStyle(info) : null;
    const range = document.createRange();
    if (value) range.selectNodeContents(value);
    const textBoxes = value ? [...range.getClientRects()] : [];
    const contains = (container, box) => Boolean(container)
      && box.left >= container.left - 1
      && box.top >= container.top - 1
      && box.right <= container.right + 1
      && box.bottom <= container.bottom + 1;
    return {
      text: value?.textContent?.trim() || "",
      textClientWidth: value?.clientWidth || 0,
      textScrollWidth: value?.scrollWidth || 0,
      textClientHeight: value?.clientHeight || 0,
      textScrollHeight: value?.scrollHeight || 0,
      textPainted: Boolean(
        valueStyle
        && valueStyle.display !== "none"
        && valueStyle.visibility !== "hidden"
        && Number.parseFloat(valueStyle.opacity || "1") > 0
        && valueStyle.color !== "rgba(0, 0, 0, 0)"
        && textBoxes.some(box => box.width >= 1 && box.height >= 1)
      ),
      textInsidePill: textBoxes.length > 0 && textBoxes.every(box => contains(pillBox, box)),
      textInsideCell: textBoxes.length > 0 && textBoxes.every(box => contains(cellBox, box)),
      infoVisible: Boolean(
        infoBox?.width
        && infoBox?.height
        && infoStyle?.display !== "none"
        && infoStyle?.visibility !== "hidden"
        && Number.parseFloat(infoStyle?.opacity || "1") > 0
      ),
      infoInsidePill: contains(pillBox, infoBox),
      infoInsideCell: contains(cellBox, infoBox),
      pillInsideCell: contains(cellBox, pillBox)
    };
  }));

  expect(measurements).toHaveLength(10);
  expect(measurements.every(({ text }) => text.length > 0)).toBe(true);
  expect(measurements.map(({ text }) => text)).toEqual(expect.arrayContaining(expectedLabels));
  expect(
    measurements.filter(measurement => (
      measurement.textScrollWidth > measurement.textClientWidth + 1
      || measurement.textScrollHeight > measurement.textClientHeight + 1
      || !measurement.textPainted
      || !measurement.textInsidePill
      || !measurement.textInsideCell
    )),
    `Current focus labels must not be shortened: ${JSON.stringify(measurements)}`
  ).toEqual([]);
  expect(
    measurements.filter(({ infoVisible, infoInsidePill, infoInsideCell, pillInsideCell }) => (
      !infoVisible || !infoInsidePill || !infoInsideCell || !pillInsideCell
    )),
    `Current focus information controls must stay usable: ${JSON.stringify(measurements)}`
  ).toEqual([]);
}

test("@teacher-roster-device-matrix keeps a configurable roster and student panel usable on Chromebook and tablet", async ({
  page
}, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await openAuditRoster(page);

  const roster = page.locator(".teacher-roster-table");
  // The compact design keeps every essential learning field fixed. Sign-in
  // readiness is permanently visible under the student's name.
  for (const column of ["Student", "Current focus", "Accuracy", "Status", "Last active", "Actions"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeAttached();
  }
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toHaveCount(0);
  await expectNoViewportOverflow(page);
  await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);
  await expectReadableFocusPills(roster);

  const columnPicker = page.locator(".teacher-roster-column-picker");
  await columnPicker.getByText(/More filters and columns/).click();
  await columnPicker.getByLabel("Sound Seekers", { exact: true }).check();
  await columnPicker.getByLabel("Progress", { exact: true }).check();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toBeAttached();

  await page.reload();
  await expect(page.getByRole("heading", {
    name: "Audit Class A — 12 students",
    exact: true
  })).toBeVisible({
    timeout: 20_000
  });
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toBeAttached();
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toBeAttached();
  await columnPicker.getByText(/More filters and columns/).click();
  await columnPicker.getByRole("button", { name: "Restore scannable defaults", exact: true }).click();
  await expect(roster.getByRole("columnheader", { name: "Sound Seekers", exact: true })).toHaveCount(0);
  await expect(roster.getByRole("columnheader", { name: "Progress", exact: true })).toHaveCount(0);
  await columnPicker.getByText(/More filters and columns/).click();
  // The interaction and overflow checks above run at 1366 × 768. Give the
  // component capture enough vertical room to include its header and all ten
  // rows without the app shell clipping either edge.
  await page.setViewportSize({ width: 1366, height: 1600 });
  await expectTeacherScreenshot(
    page.locator(".teacher-dashboard-roster"),
    `teacher-roster-chromebook-${snapshotVariant}.png`,
    {
      animations: "disabled",
      mask: [roster.locator('td[data-label="Last active"]')],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    },
    testInfo
  );

  await page.setViewportSize({ width: 1366, height: 768 });
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  const openAarav = aaravRow.getByRole("button", { name: /^Aarav\b/ });
  await openAarav.click();
  const studentPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await expect(studentPanel).toBeVisible();
  await expect(studentPanel).toContainText("Pictures ready");
  await expect(openAarav).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("dialog", { name: "Student details: Aarav" })).toHaveCount(0);
  const chromebookPanelBox = await studentPanel.boundingBox();
  expect(chromebookPanelBox).not.toBeNull();
  expect(chromebookPanelBox.x + chromebookPanelBox.width).toBeLessThanOrEqual(1366);
  expect(chromebookPanelBox.width).toBeLessThanOrEqual(400);
  // Capture the whole long region instead of letting the app shell's internal
  // 768px scroller obscure its lower half. Width remains Chromebook-sized.
  await page.setViewportSize({ width: 1366, height: 4000 });
  await expectTeacherScreenshot(
    studentPanel,
    `teacher-learner-drawer-chromebook-${snapshotVariant}.png`,
    {
      animations: "disabled",
      maxDiffPixelRatio: 0.025
    },
    testInfo
  );
  await studentPanel.getByRole("button", { name: "Close student details", exact: true }).click();
  await expect(page.getByRole("region", { name: "Student panel" })).toBeVisible();
  await expect(openAarav).toHaveAttribute("aria-pressed", "false");

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectNoViewportOverflow(page);
  const rosterTools = page.getByRole("region", {
    name: "Search and filter students"
  });
  await expect.poll(async () => {
    const toolsBox = await rosterTools.boundingBox();
    const statusBox = await rosterTools.getByRole("status").boundingBox();
    return Boolean(
      toolsBox
      && statusBox
      && statusBox.x >= toolsBox.x
      && statusBox.x + statusBox.width <= toolsBox.x + toolsBox.width + 1
    );
  }).toBe(true);
  await expect.poll(() => roster.locator("tbody").evaluate(body => getComputedStyle(body).display)).toBe("block");
  const tabletRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await expect.poll(() => tabletRow.evaluate(row => getComputedStyle(row).display)).toBe("grid");
  await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);
  await expectReadableFocusPills(roster);
  const tabletRowBox = await tabletRow.boundingBox();
  const rosterBox = await roster.boundingBox();
  expect(tabletRowBox).not.toBeNull();
  expect(rosterBox).not.toBeNull();
  expect(tabletRowBox.x).toBeGreaterThanOrEqual(rosterBox.x);
  expect(tabletRowBox.x + tabletRowBox.width).toBeLessThanOrEqual(rosterBox.x + rosterBox.width + 1);
  await expect.poll(() => tabletRow.getByRole("button", { name: /^Aarav\b/ })
    .evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  // The interaction and overflow checks above run at 1024 × 768. Give the
  // component capture enough vertical room to include its header and all ten
  // rows without the app shell clipping either edge.
  await page.setViewportSize({ width: 1024, height: 1600 });
  await expectTeacherScreenshot(
    page.locator(".teacher-dashboard-roster"),
    `teacher-roster-tablet-${snapshotVariant}.png`,
    {
      animations: "disabled",
      mask: [roster.locator('td[data-label="Last active"]')],
      maskColor: "#eef2f7",
      maxDiffPixelRatio: 0.025
    },
    testInfo
  );

  await page.setViewportSize({ width: 1024, height: 768 });
  await tabletRow.getByRole("button", { name: /^Aarav\b/ }).click();
  const tabletPanel = page.getByRole("region", { name: "Student details: Aarav" });
  await expect(tabletPanel).toBeVisible();
  const tabletPanelBox = await tabletPanel.boundingBox();
  expect(tabletPanelBox).not.toBeNull();
  expect(tabletPanelBox.x).toBeGreaterThanOrEqual(0);
  expect(tabletPanelBox.x + tabletPanelBox.width).toBeLessThanOrEqual(1024);
  // The app itself remains exercised at 1024 × 768. Expand only the capture
  // height so Playwright can record this long region without clipping it at
  // the internally scrolling app shell's viewport edge.
  await page.setViewportSize({ width: 1024, height: 4000 });
  await expectTeacherScreenshot(
    tabletPanel,
    `teacher-learner-drawer-tablet-${snapshotVariant}.png`,
    {
      animations: "disabled",
      maxDiffPixelRatio: 0.025
    },
    testInfo
  );
});

test("@teacher-roster-device-matrix preserves full focus labels when a narrow viewport needs internal roster scrolling", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 639, height: 768 });
  await openAuditRoster(page);

  const rosterRegion = page.locator(".teacher-data-table-region");
  const roster = page.locator(".teacher-roster-table");
  await expectNoViewportOverflow(page);
  await expect.poll(() => rosterRegion.evaluate(region => region.scrollWidth > region.clientWidth + 1)).toBe(true);
  await expectReadableFocusPills(roster);
});

test("@teacher-roster-device-matrix preserves the longest authoritative focus labels", async ({ page }) => {
  test.setTimeout(90_000);
  const longLabels = [
    "Short Vowel Discrimination",
    "High-Frequency Words 76-100",
    "Theme and Higher Comprehension"
  ];
  await page.setViewportSize({ width: 1366, height: 768 });
  await openAuditRoster(page);

  const roster = page.locator(".teacher-roster-table");
  const rosterRegion = page.locator(".teacher-data-table-region");
  for (const width of [1366, 1024, 639]) {
    await page.setViewportSize({ width, height: 768 });
    await roster.locator(".lp-defined-metric-value").evaluateAll((values, labels) => {
      values.forEach((value, index) => {
        value.textContent = labels[index % labels.length];
      });
    }, longLabels);
    await expectNoViewportOverflow(page);
    await expectReadableFocusPills(roster, longLabels);
    if (width === 639) {
      await expect.poll(() => rosterRegion.evaluate(region => (
        region.scrollWidth > region.clientWidth + 1
      ))).toBe(true);
    } else {
      await expect.poll(() => roster.evaluate(table => table.scrollWidth <= table.clientWidth + 1)).toBe(true);
    }
  }
});
