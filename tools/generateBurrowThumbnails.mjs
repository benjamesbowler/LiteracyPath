// Run against this checkout's Vite server: node tools/generateBurrowThumbnails.mjs http://127.0.0.1:4201
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:4201';
const destination = `${root}public/game-assets/physical-arcade/burrow-builders/thumbnails`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/__burrow-thumbnail-studio.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Burrow thumbnail production</title>' }));
  await page.goto(`${base}/__burrow-thumbnail-studio.html`);
  const images = await page.evaluate(async () => (await import('/tools/lib/burrowThumbnailStudio.js')).renderBurrowThumbnails());
  await mkdir(destination, { recursive: true });
  for (const image of images) await writeFile(`${destination}/${image.filename}`, Buffer.from(image.data, 'base64'));
  const sources = ['src/components/learn/games/games/burrowPartMeshes.js', 'tools/lib/burrowThumbnailStudio.js', ...['plank', 'stone', 'shingle'].map(id => `public/game-assets/physical-arcade/burrow-builders/materials/${id}-albedo-v1.webp`)];
  const sourceHashes = Object.fromEntries(await Promise.all(sources.map(async path => [path, createHash('sha256').update(await readFile(`${root}${path}`)).digest('hex')])));
  await writeFile(`${destination}/manifest.json`, JSON.stringify({ purpose: 'Exact live building meshes rendered locally at build time; no external assets or services.', generator: 'tools/generateBurrowThumbnails.mjs', size: [192, 192], sourceHashes, files: images.map(image => image.filename) }, null, 2)+'\n');
  console.log(`Rendered ${images.length} canonical piece thumbnails.`);
} finally { await browser.close(); }
