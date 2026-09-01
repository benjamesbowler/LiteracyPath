import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/release",
  testMatch: [
    "student-session-controls.spec.js",
    "adventure-map-session-lock.spec.js"
  ],
  timeout: 45_000,
  expect: { timeout: 12_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4194",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4194 --strictPort",
    url: "http://127.0.0.1:4194/preview/student-session-controls.html",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:4194",
      VITE_SUPABASE_ANON_KEY: "student-session-browser-test-key"
    }
  },
  workers: 1,
  reporter: "line"
});
