import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/quest-offline",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5191",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build:quest-offline-test && npm run serve:quest-offline-test",
    url: "http://127.0.0.1:5191/preview/quest.html",
    reuseExistingServer: false,
    timeout: 120_000
  },
  reporter: "line"
});
