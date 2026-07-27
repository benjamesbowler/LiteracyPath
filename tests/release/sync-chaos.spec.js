import { expect, test } from "@playwright/test";

function installCloudRoute(context, cloud) {
  return context.route("**/preview/progress-chaos-endpoint", async route => {
    const request = route.request();
    if (request.headers().authorization !== "Bearer valid-token") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "token-expired" })
      });
      return;
    }

    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cloud)
      });
      return;
    }

    const body = request.postDataJSON();
    cloud.writes += 1;
    if (Number(body.baseVersion || 0) !== cloud.version) {
      cloud.conflicts += 1;
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify(cloud)
      });
      return;
    }

    cloud.version += 1;
    cloud.payload = body.payload;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(cloud)
    });
  });
}

async function openDevice(browser, cloud) {
  const context = await browser.newContext();
  await installCloudRoute(context, cloud);
  const page = await context.newPage();
  await page.goto("/preview/progress-sync-chaos.html");
  await expect(page.getByRole("heading", { name: "Progress sync recovery" })).toBeVisible();
  return { context, page };
}

test("A9.7 two devices recover offline, refresh, token-expiry, and stale-version conflicts", async ({
  browser
}) => {
  const cloud = {
    version: 0,
    payload: {
      resetEpoch: 0,
      resetAt: "",
      resetId: "legacy",
      resetHistory: [],
      resetPending: false,
      trail: { stopsDone: [], routeCursor: 1 },
      mastery: {},
      stones: []
    },
    writes: 0,
    conflicts: 0
  };
  const deviceA = await openDevice(browser, cloud);
  const deviceB = await openDevice(browser, cloud);

  await deviceA.context.setOffline(true);
  await deviceA.page.evaluate(() => window.__progressSyncChaos.saveStops(["s1"]));
  const deferred = await deviceA.page.evaluate(() => window.__progressSyncChaos.flush());
  expect(deferred.pending).toBe(1);
  await expect(deviceA.page.getByRole("status")).toContainText("No connection");

  await deviceA.context.setOffline(false);
  await deviceA.page.reload();
  await expect(deviceA.page.getByText("1", { exact: true }).first()).toBeVisible();

  await deviceB.page.evaluate(() => window.__progressSyncChaos.saveStops(["s2"]));
  await deviceB.page.evaluate(() => window.__progressSyncChaos.flush());
  expect(cloud.version).toBe(1);
  expect(cloud.payload.trail.stopsDone).toEqual(["s2"]);

  const reconciledA = await deviceA.page.evaluate(() => window.__progressSyncChaos.flush());
  expect(reconciledA.pending).toBe(0);
  expect(new Set(reconciledA.stopsDone)).toEqual(new Set(["s1", "s2"]));
  expect(reconciledA.metrics.conflicts).toBe(1);
  expect(reconciledA.metrics.recovered).toBe(1);
  expect(cloud.conflicts).toBe(1);
  await expect(deviceA.page.getByRole("status")).toContainText("recovered");
  await expect(deviceA.page.getByTestId("stops-done")).toContainText("s1");
  await expect(deviceA.page.getByTestId("stops-done")).toContainText("s2");

  await deviceA.page.evaluate(() => {
    window.__progressSyncChaos.saveStops(["s1", "s2", "s3"]);
    window.__progressSyncChaos.setToken("expired-token");
  });
  const expired = await deviceA.page.evaluate(() => window.__progressSyncChaos.flush());
  expect(expired.pending).toBe(1);
  expect(expired.metrics.tokenExpiries).toBe(1);
  await expect(deviceA.page.getByRole("status")).toContainText("Sign-in expired");

  await deviceA.page.reload();
  await expect(deviceA.page.getByRole("status")).toContainText("waiting safely");
  await deviceA.page.evaluate(() => window.__progressSyncChaos.setToken("valid-token"));
  const tokenRecovered = await deviceA.page.evaluate(() => window.__progressSyncChaos.flush());
  expect(tokenRecovered.pending).toBe(0);
  expect(tokenRecovered.stopsDone).toContain("s3");

  await deviceB.page.evaluate(() => window.__progressSyncChaos.saveStops(["s2", "s4"]));
  const reconciledB = await deviceB.page.evaluate(() => window.__progressSyncChaos.flush());
  expect(reconciledB.metrics.conflicts).toBe(1);
  expect(new Set(cloud.payload.trail.stopsDone)).toEqual(new Set(["s1", "s2", "s3", "s4"]));
  expect(cloud.conflicts).toBe(2);

  await deviceA.page.reload();
  const finalA = await deviceA.page.evaluate(() => window.__progressSyncChaos.hydrate());
  expect(new Set(finalA.stopsDone)).toEqual(new Set(["s1", "s2", "s3", "s4"]));
  expect(finalA.pending).toBe(0);
  expect(cloud.writes).toBe(6);

  await deviceA.context.close();
  await deviceB.context.close();
});
