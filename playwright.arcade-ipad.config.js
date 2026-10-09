import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testMatch: 'release/arcade-ipad-performance.spec.js',
  workers: 1,
  timeout: 60_000,
  outputDir: '.artifacts/ipad-arcade/browser',
  use: { ...base.use, trace: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'ipad-safari', use: { ...devices['iPad (gen 7)'], browserName: 'webkit',
    viewport: { width: 1080, height: 810 }, deviceScaleFactor: 2 } }]
});
