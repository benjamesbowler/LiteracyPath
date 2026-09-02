import { defineConfig, devices } from "@playwright/test";

const playwrightPort = Number(process.env.LP_PLAYWRIGHT_PORT || 4174);
const playwrightBaseUrl = `http://127.0.0.1:${playwrightPort}`;

const mobileSnapshotPathTemplate = process.platform === "linux"
  ? "{testDir}/{testFilePath}-snapshots/linux/mobile/{arg}{ext}"
  : "{testDir}/{testFilePath}-snapshots/mobile/{arg}{ext}";

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
    baseURL: playwrightBaseUrl,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${playwrightPort} --strictPort`,
    url: playwrightBaseUrl,
    // Reusing a process from another branch can turn its pixels into this
    // checkout's evidence. Make reuse an explicit local-only choice.
    reuseExistingServer: process.env.LP_PLAYWRIGHT_REUSE_SERVER === "1",
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
      // A bare multi-project run must never overwrite the desktop evidence.
      snapshotPathTemplate: mobileSnapshotPathTemplate,
      use: {
        ...devices["Pixel 5"]
      }
    }
  ]
});
