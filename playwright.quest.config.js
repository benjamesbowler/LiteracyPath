import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5190",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5190",
    url: "http://127.0.0.1:5190/preview/quest.html",
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:5190",
      VITE_SUPABASE_ANON_KEY: "quest-browser-test-key"
    }
  },
  reporter: "line"
});
