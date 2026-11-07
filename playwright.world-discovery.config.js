import { defineConfig } from '@playwright/test';

const port = Number(process.env.LP_WORLD_DISCOVERY_PORT || 4197);
const url = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/release',
  testMatch: 'guided-reading-world-discovery.spec.js',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 2,
  fullyParallel: true,
  outputDir: '.artifacts/world-discovery/browser',
  reporter: [['list'], ['json', { outputFile: '.artifacts/world-discovery/browser-results.json' }]],
  use: { baseURL: url, browserName: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: false,
    timeout: 45_000
  }
});
