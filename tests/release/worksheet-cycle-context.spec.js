import { expect, test } from "@playwright/test";

const classA = "00000000-0000-4000-8000-0000000000a1";
const classB = "00000000-0000-4000-8000-0000000000b2";
const worksheetUrl = (classId, cycleId) => `/preview/teacher-a11y.html?surface=worksheets&workspace-class=${classId}&cycle=${cycleId}`;
test.setTimeout(90000);

test("worksheets inherit teaching context and retain deliberate overrides only for their class", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("lp-worksheets-last-cycle", "cycle-1"));
  await page.goto(worksheetUrl(classA, "cycle-6"));
  const cycle = page.getByRole("combobox", { name: "Teaching cycle", exact: true });
  await expect(cycle).toHaveValue("cycle-6");
  await expect(page.locator(".ws-cycle-context")).toContainText("Audit Class A · Current class cycle: Cycle 6");
  await cycle.selectOption("cycle-9");
  await expect(page.getByText(/Worksheet override: Cycle 9/)).toBeVisible();

  await page.goto(worksheetUrl(classB, "cycle-3"));
  await expect(cycle).toHaveValue("cycle-3");
  await expect(page.locator(".ws-cycle-context")).toContainText("Audit Class B · Current class cycle: Cycle 3");

  await page.goto(worksheetUrl(classA, "cycle-6"));
  await expect(cycle).toHaveValue("cycle-9");
  await page.getByRole("button", { name: "Use current class cycle", exact: true }).click();
  await expect(cycle).toHaveValue("cycle-6");
  await page.reload();
  await expect(cycle).toHaveValue("cycle-6");
});

test("an unknown class cycle is explicit and printing waits for a deliberate selection", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(worksheetUrl(classB, ""));
  const cycle = page.getByRole("combobox", { name: "Teaching cycle", exact: true });
  await expect(cycle).toHaveValue("");
  await expect(page.locator(".ws-cycle-context")).toContainText("Current class cycle: Not set");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save to bank", exact: true })).toBeDisabled();
  await cycle.selectOption("cycle-6");
  await expect(page.getByRole("button", { name: "Open print preview", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Use current class cycle", exact: true }).click();
  await expect(cycle).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: ".artifacts/app-simplification/teacher/worksheet-unknown-390.png", animations: "disabled" });
});

test("a saved character pack restores every preview and keeps the class cycle", async ({ page }) => {
  test.setTimeout(120_000);
  const recipe = { id: classA, cycle_id: "cycle-4", type: "characterColouring:pip", pages: 6, title: "Cycle 4 character pack" };
  let response = "network";
  let posted = null;
  await page.route(/\/rest\/v1\/worksheet_bank(?:\?|$)/, async route => {
    const headers = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": route.request().headers()["access-control-request-headers"] || "*" };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers });
    if (route.request().method() === "GET") {
      if (response === "saved") return route.fulfill({ status: 400, json: { code: "mock_network", message: "Network unreachable" }, headers });
      return route.fulfill({ json: [recipe], headers });
    }
    posted = route.request().postDataJSON();
    if (response === "network") return route.abort("failed");
    if (response === "expired") return route.fulfill({ status: 401, json: { code: "PGRST301", message: "JWT expired" }, headers });
    return route.fulfill({ status: 201, json: recipe, headers });
  });
  await page.goto(worksheetUrl(classA, "cycle-6"));
  const cycle = page.getByRole("combobox", { name: "Teaching cycle", exact: true });
  const length = page.getByRole("combobox", { name: "Pack length", exact: true });
  const open = page.getByRole("button", { name: "Open in studio", exact: true });
  await open.click();
  await expect(cycle).toHaveValue("cycle-4");
  await expect(length).toHaveValue("6");
  await expect(page.getByLabel("Start with your favourite Guide")).toHaveValue("pip");
  await expect(page.locator(".ws-cycle-context")).toContainText("Current class cycle: Cycle 6");
  const rendered = async () => {
    const frames = [];
    for (let pageNumber = 1; pageNumber <= 6; pageNumber++) {
      await page.getByRole("button", { name: new RegExp(`^Preview page ${pageNumber}:`) }).click();
      const preview = page.locator(".ws-paper-frame");
      await expect(preview.locator(`[data-worksheet-page="${pageNumber}"]`)).toHaveCount(1);
      frames.push(await preview.evaluate(element => element.shadowRoot.querySelector(".ws-print-document").innerHTML));
    }
    return frames;
  };
  const original = await rendered();
  expect(new Set(original).size).toBe(6);
  await cycle.selectOption("cycle-9");
  await length.selectOption("3");
  await open.click();
  expect(await rendered()).toEqual(original);
  await expect(page.getByRole("button", { name: "Print teacher answers separately", exact: true })).toBeEnabled();
  const save = page.getByRole("button", { name: "Save to bank", exact: true });
  await save.click();
  await expect(page.getByText(/Check your connection and try saving again/)).toBeVisible();
  await expect(cycle).toHaveValue("cycle-4");
  response = "expired";
  await save.click();
  await expect(page.getByText(/Sign in again and retry/)).toBeVisible();
  response = "saved";
  await save.click();
  await expect(page.getByText("Saved to your worksheet bank. Try refreshing the bank to see the latest list.")).toBeVisible();
  await expect(open).toBeVisible();
  expect(posted).toMatchObject({ cycle_id: recipe.cycle_id, type: recipe.type, pages: recipe.pages });
});
