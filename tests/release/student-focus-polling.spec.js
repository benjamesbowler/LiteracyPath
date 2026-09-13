import { expect, test } from "@playwright/test";

async function openPolling(page, scenario) {
  await page.clock.install();
  await page.goto(`/tests/fixtures/student-focus-polling.html?scenario=${scenario}`);
  await expect(page.getByTestId("connection")).toBeVisible();
}

const requestCount = page => page.evaluate(() => window.__focusPollingRequests.length);

test("a stalled first session read times out and retries successfully", async ({ page }) => {
  await openPolling(page, "first-stall");
  await page.clock.runFor(10_000);
  await expect(page.getByTestId("connection")).toHaveText("connecting");
  expect(await page.evaluate(() => window.__focusPollingRequests[0].aborted)).toBe(true);
  await page.clock.runFor(1000);
  await expect(page.getByTestId("connection")).toHaveText("connected");
  await expect(page.getByTestId("assignment")).toHaveText("focus-first");
  expect(await requestCount(page)).toBe(2);
});

test("a stalled heartbeat retains its assignment and recovers after retry", async ({ page }) => {
  await openPolling(page, "active-stall");
  await expect(page.getByTestId("connection")).toHaveText("connected");
  await page.clock.runFor(11_000);
  await expect(page.getByTestId("connection")).toHaveText("reconnecting");
  await expect(page.getByTestId("assignment")).toHaveText("focus-first");
  await page.clock.runFor(1000);
  await expect(page.getByTestId("connection")).toHaveText("connected");
  expect(await requestCount(page)).toBe(3);
});

test("an online event cancels a stalled heartbeat and reads the assignment afresh", async ({ page }) => {
  await openPolling(page, "active-stall");
  await expect(page.getByTestId("connection")).toHaveText("connected");
  await page.clock.runFor(1000);
  expect(await requestCount(page)).toBe(2);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => requestCount(page)).toBe(3);
  expect(await page.evaluate(() => window.__focusPollingRequests[1].aborted)).toBe(true);
  await expect(page.getByTestId("assignment")).toHaveText("focus-first");
});

test("hiding an iPad cancels an in-flight read and foregrounding starts a fresh one", async ({ page }) => {
  await openPolling(page, "always-stall");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await page.evaluate(() => window.__focusPollingRequests[0].aborted)).toBe(true);
  await page.clock.runFor(20_000);
  expect(await requestCount(page)).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => requestCount(page)).toBe(2);
});

test("a late answer for the previous student cannot overwrite the new student's assignment", async ({ page }) => {
  await openPolling(page, "first-stall");
  await page.getByRole("button", { name: "Switch student" }).click();
  await expect(page.getByTestId("assignment")).toHaveText("focus-second");
  expect(await page.evaluate(() => window.__focusPollingRequests[0].aborted)).toBe(true);
  await page.evaluate(() => window.__completeFocusPollingRequest(1));
  await expect(page.getByTestId("assignment")).toHaveText("focus-second");
  expect(await requestCount(page)).toBe(2);
});

test("changing student clears the previous lock while the new assignment loads", async ({ page }) => {
  await openPolling(page, "switch-after-connected");
  await expect(page.getByTestId("assignment")).toHaveText("focus-first");
  await page.getByRole("button", { name: "Switch student" }).click();
  await expect(page.getByTestId("assignment")).toHaveText("none");
  await page.evaluate(() => window.__completeFocusPollingRequest(2));
  await expect(page.getByTestId("assignment")).toHaveText("focus-second");
});
