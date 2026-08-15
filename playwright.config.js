import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  // Chromium rendering is stable within an OS, while font rasterisation is
  // not byte-identical between macOS development and Ubuntu CI. Keep the
  // reviewed macOS baselines in their historic location and a separate,
  // explicitly refreshed Linux set for the release runner.
  snapshotPathTemplate: process.platform === "linux"
    ? "{testDir}/{testFilePath}-snapshots/linux/{arg}{ext}"
    : "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"]
      }
    }
  ]
});
