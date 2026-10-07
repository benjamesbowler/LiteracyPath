import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { APP_VIEWS } from "../../src/appState/appViews.js";
import { metadataForAppView, metadataForPath, SITEMAP_PATHS } from "../../src/policy/pageMetadata.js";
import { pageMetadataPlugin, withMetadata } from "../../tools/vitePageMetadataPlugin.mjs";

test("public entry and private app states have useful titles without learner data", () => {
  assert.match(metadataForAppView(APP_VIEWS.SELECT, "entry").title, /Reading, phonics/);
  assert.equal(metadataForAppView(APP_VIEWS.SELECT, "teacher").title, "Teacher sign in — Literacy Guide");
  assert.equal(metadataForAppView(APP_VIEWS.GUIDED_READING, "student", true).title, "Books — Literacy Guide");
  for (const view of Object.values(APP_VIEWS)) {
    const metadata = metadataForAppView(view, "A real child's name", true);
    assert.equal(metadata.robots, "noindex,nofollow");
    assert.ok(metadata.title.endsWith("— Literacy Guide"));
    assert.doesNotMatch(JSON.stringify(metadata), /real child's name/);
  }
});

test("family sharing uses a fixed canonical and private routes are excluded from the sitemap", () => {
  const metadata = metadataForPath("/parent/");
  assert.equal(metadata.path, "/parent");
  assert.equal(metadata.robots, "noindex,nofollow");
  assert.ok(!SITEMAP_PATHS.includes("/parent"));
  assert.ok(SITEMAP_PATHS.includes("/privacy.html"));
  const html = withMetadata("<html><head><title>Old</title></head></html>", metadata);
  assert.match(html, /rel="canonical" href="https:\/\/literacy.guide\/parent"/);
  assert.match(html, /og:url" content="https:\/\/literacy.guide\/parent"/);
  assert.match(html, /summary_large_image/);
  assert.equal((withMetadata(html, metadata).match(/<title>/g) || []).length, 1);
});

test("build output gives crawlers route-specific shells without JavaScript", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lp-page-metadata-"));
  try {
    const output = path.join(root, "dist");
    fs.mkdirSync(output);
    fs.writeFileSync(path.join(output, "index.html"), withMetadata(
      '<html><head><script type="module" src="/assets/app-hash.js"></script></head><body><div id="root"></div></body></html>',
      metadataForPath("/")
    ));
    for (const route of [...SITEMAP_PATHS.filter(route => route.endsWith(".html")), "/404.html"]) {
      fs.copyFileSync(new URL(`../../public${route}`, import.meta.url), path.join(output, route.slice(1)));
    }
    const plugin = pageMetadataPlugin();
    plugin.configResolved({ root, build: { outDir: "dist" } });
    plugin.writeBundle();
    const family = fs.readFileSync(path.join(output, "parent.html"), "utf8");
    assert.match(family, /Family access — Literacy Guide/);
    assert.match(family, /noindex,nofollow/);
    assert.match(family, /\/assets\/app-hash.js/);
    assert.match(fs.readFileSync(path.join(output, "soundkeys.html"), "utf8"), /Sound Keys — Literacy Guide/);
    assert.doesNotMatch(fs.readFileSync(path.join(output, "sitemap.xml"), "utf8"), /parent|invite|report|#/);
    assert.match(fs.readFileSync(path.join(output, "robots.txt"), "utf8"), /Sitemap: https:\/\/literacy.guide\/sitemap.xml/);
    assert.match(fs.readFileSync(path.join(output, "privacy.html"), "utf8"), /property="og:title"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
