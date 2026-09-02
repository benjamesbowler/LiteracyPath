import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

const externalOfflineRoot = Boolean(process.env.QUEST_OFFLINE_DIST);
process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN ||= randomBytes(32).toString("hex");
process.env.QUEST_OFFLINE_CONTROL_PORT ||= "5193";

export default defineConfig({
  testDir: "tests/quest-offline",
  outputDir: ".artifacts/sound-seekers-v2/content-art/offline-playwright",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5191",
    screenshot: "off",
    trace: "off",
    video: "off"
  },
  webServer: {
    command: externalOfflineRoot
      ? "npm run serve:quest-offline-test"
      : "node tools/serveQuestOfflineRangeTest.mjs --temporary-build --host 127.0.0.1 --port 5191",
    env: {
      ...process.env,
      QUEST_OFFLINE_SHUTDOWN_TOKEN: process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN,
      QUEST_OFFLINE_CONTROL_PORT: process.env.QUEST_OFFLINE_CONTROL_PORT
    },
    url: "http://127.0.0.1:5191/preview/quest.html",
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    reuseExistingServer: false,
    timeout: 120_000
  },
  reporter: "line"
});
