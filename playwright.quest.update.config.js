import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/quest-update",
  timeout: 120_000,
  expect: { timeout: 25_000 },
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5192",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run serve:quest-update-test",
    url: "http://127.0.0.1:5192/__quest_update/state",
    reuseExistingServer: false,
    timeout: 300_000
  },
  reporter: "line"
});
