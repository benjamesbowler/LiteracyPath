import { defineConfig } from "@playwright/test";

const port = Number(process.env.LP_FOUNDATIONS_PORT || 4196);
const url = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/release",
  testMatch: ["guided-reading-small-steps.spec.js", "guided-reading-foundations-expansion.spec.js"],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 2,
  fullyParallel: true,
  outputDir: ".artifacts/guided-reading-regression/browser",
  reporter: [["list"], ["json", { outputFile: ".artifacts/guided-reading-regression/results.json" }]],
  use: { baseURL: url, browserName: "chromium", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: false,
    timeout: 45_000
  }
});
