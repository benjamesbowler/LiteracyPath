import { defineConfig } from '@playwright/test';

const port = Number(process.env.LP_WORLD_DISCOVERY_PORT || 4197);
const url = `http://127.0.0.1:${port}`;
const evidenceDirectory = process.env.LP_WORLD_DISCOVERY_EVIDENCE_DIR || '.artifacts/world-discovery';

export default defineConfig({
  testDir: './tests/release',
  testMatch: 'guided-reading-world-discovery.spec.js',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 2,
  fullyParallel: true,
  outputDir: `${evidenceDirectory}/browser`,
  reporter: [['list'], ['json', { outputFile: `${evidenceDirectory}/browser-results.json` }]],
  use: { baseURL: url, browserName: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: false,
    timeout: 45_000
  }
});
