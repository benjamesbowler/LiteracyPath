import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/quest-soak",
  timeout: 120_000,
  expect: { timeout: 25_000 },
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5193",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build:quest-offline-test && npm run serve:quest-soak-test",
    url: "http://127.0.0.1:5193/preview/quest.html",
    reuseExistingServer: false,
    timeout: 150_000
  },
  reporter: "line"
});
