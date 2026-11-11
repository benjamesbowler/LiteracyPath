import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";

import { GUIDED_READING_IMAGE_REVISIONS } from "../../src/data/generated/guidedReadingImageRevisions.generated.js";
import { REPAIRED_IMAGE_REVISIONS } from "../../src/data/generated/repairedImageRevisions.generated.js";
import { guidedReadingReplacementImagePath, withRepairedGuidedReadingImageVersion } from "../../src/utils/guidedReading/mediaVersion.js";
import { buildGuidedReadingReplacementImages, reviewedSiblingImageDeliveries } from "../../tools/buildGuidedReadingReplacementImages.mjs";
import { serviceWorkerSource } from "../../tools/viteQuestOfflinePlugin.mjs";

const origin = "https://literacy.guide";
const canonical = "/guided-reading/world-discovery/e-21/page-01.webp";
const revision = GUIDED_READING_IMAGE_REVISIONS[canonical];
const currentBytes = readFileSync(new URL("../../public" + canonical, import.meta.url));
const legacyWorker = readFileSync(new URL("../fixtures/guidedReadingLegacyMediaWorker.js", import.meta.url), "utf8");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

// Model CacheStorage's actual ignoreSearch matching, not a Map's exact-key
// behavior. The old implementation fails only with this realistic warm cache.
function workerHarness(source, { stored = [], network = () => new Response(currentBytes) } = {}) {
  const values = new Map(stored);
  const listeners = new Map();
  const requested = [];
  const key = value => new URL(typeof value === "string" ? value : value.url, origin);
  const cache = {
    async match(request, { ignoreSearch = false } = {}) {
      const wanted = key(request);
      if (ignoreSearch) wanted.search = "";
      for (const [url, response] of values) {
        const candidate = key(url);
        if (ignoreSearch) candidate.search = "";
        if (candidate.href === wanted.href) return response.clone();
      }
      return undefined;
    },
    async put(request, response) { values.set(key(request).href, response.clone()); }
  };
  runInNewContext(source, {
    Request, URL,
    caches: { async open() { return cache; } },
    fetch: async request => { requested.push(request.url); return network(request); },
    self: { location: { origin }, addEventListener(type, listener) { listeners.set(type, listener); } }
  });
  return {
    requested, values,
    async fetch(src) {
      let result;
      listeners.get("fetch")({ request: new Request(new URL(src, origin)), respondWith(promise) { result = promise; } });
      assert.ok(result, "the worker must handle the actual image request");
      return result;
    },
    async warm(src) {
      let completed;
      const messages = [];
      listeners.get("message")({ data: { type: "LP_WARM_QUEST_ASSETS", urls: [src], requestId: "repair-test" },
        source: { postMessage(value) { messages.push(value); } }, waitUntil(promise) { completed = promise; } });
      await completed;
      return messages.at(-1);
    }
  };
}

test("an already-active old worker reproduces the mismatched picture, while the new delivery pathname bypasses it", async () => {
  let online = true;
  const legacy = workerHarness(legacyWorker, {
    stored: [[origin + canonical + "?v=previous-book", new Response("old journey diagram")]],
    network: () => {
      if (!online) throw Error("offline");
      return new Response(currentBytes);
    }
  });
  assert.equal(await (await legacy.fetch(canonical + "?v=" + revision)).text(), "old journey diagram",
    "a changed query cannot repair this already-installed worker");
  const delivery = withRepairedGuidedReadingImageVersion(canonical);
  assert.notEqual(new URL(delivery, origin).pathname, canonical);
  assert.deepEqual(Buffer.from(await (await legacy.fetch(delivery)).arrayBuffer()), currentBytes);
  online = false;
  assert.deepEqual(Buffer.from(await (await legacy.fetch(delivery)).arrayBuffer()), currentBytes,
    "only the current picture is restored offline at its immutable pathname");
  assert.equal(legacy.values.get(origin + canonical + "?v=previous-book")?.status, 200,
    "the repair does not clear unrelated or historical cache entries");
});

test("Guided-only and unknown paths preserve the requesting manuscript's explicit revision", async () => {
  let online = true;
  const unknown = "/guided-reading/future-repair/page-01.webp";
  const harness = workerHarness(serviceWorkerSource({ buildId: "guided-image-repair", precache: [] }), {
    stored: [[origin + canonical, new Response("old topic")], [origin + unknown, new Response("old other image")]],
    network: () => {
      if (!online) throw Error("offline");
      return new Response(currentBytes);
    }
  });
  const currentRequests = [canonical, canonical + "?v=newer-reviewed-version", unknown + "?v=future-reviewed-version"];
  for (const src of currentRequests) {
    assert.deepEqual(Buffer.from(await (await harness.fetch(src)).arrayBuffer()), currentBytes);
  }
  assert.equal(harness.requested[0], origin + canonical + "?v=" + revision);
  assert.equal(harness.requested[1], origin + canonical + "?v=newer-reviewed-version");
  online = false;
  for (const src of currentRequests) {
    assert.deepEqual(Buffer.from(await (await harness.fetch(src)).arrayBuffer()), currentBytes);
  }
  await assert.rejects(harness.fetch(unknown + "?v=another-version"), /offline/);
  await assert.rejects(harness.fetch(canonical + "?v=another-version"), /offline/);
});

test("existing quarantine repairs still force reviewed bytes for old clients, including overlapping Guided paths", async () => {
  const overlap = Object.keys(REPAIRED_IMAGE_REVISIONS).find(path => GUIDED_READING_IMAGE_REVISIONS[path]);
  assert.ok(overlap);
  let online = true;
  const oldRequest = overlap + "?v=0123456789ab";
  const harness = workerHarness(serviceWorkerSource({ buildId: "retained-quarantine-contract", precache: [] }), {
    stored: [[origin + oldRequest, new Response("rejected old art")]],
    network: () => { if (!online) throw Error("offline"); return new Response(currentBytes); }
  });
  assert.deepEqual(Buffer.from(await (await harness.fetch(oldRequest)).arrayBuffer()), currentBytes);
  assert.equal(harness.requested[0], origin + overlap + "?v=" + REPAIRED_IMAGE_REVISIONS[overlap]);
  online = false;
  assert.deepEqual(Buffer.from(await (await harness.fetch(oldRequest)).arrayBuffer()), currentBytes);
});

test("failed warmup does not report old unversioned pictures as ready for a new revision", async () => {
  const unknown = "/guided-reading/future-repair/page-01.webp";
  const harness = workerHarness(serviceWorkerSource({ buildId: "guided-image-repair", precache: [] }), {
    stored: [[origin + canonical, new Response("old topic")], [origin + unknown, new Response("old image")]],
    network: () => { throw Error("offline"); }
  });
  for (const src of [canonical, canonical + "?v=newer-reviewed-version", unknown + "?v=new-version"]) {
    const result = await harness.warm(src);
    assert.equal(result.completed, 0);
    assert.equal(result.failed, 1);
  }
});

test("five replaced books and all15 accepted sibling repairs deliver exact full-resolution reviewed bytes", async () => {
  const rows = await buildGuidedReadingReplacementImages({ check: true });
  const additional = await reviewedSiblingImageDeliveries();
  assert.equal(additional.length, 15);
  assert.equal(rows.length, 66);
  const topicRows = rows.filter(row => !additional.some(image => image.path === row.canonical));
  assert.equal(topicRows.length, 51);
  assert.equal(new Set(topicRows.map(row => row.canonical.split("/").at(-2))).size, 5);
  for (const row of rows) {
    const source = await fs.readFile(new URL("../../public" + row.canonical, import.meta.url));
    const delivered = await fs.readFile(new URL("../../public" + row.delivery, import.meta.url));
    assert.equal(hash(source), row.sha256);
    assert.deepEqual(delivered, source);
    assert.equal(new URL(withRepairedGuidedReadingImageVersion(row.canonical), origin).pathname, row.delivery);
  }
});

test("delivery generation fails closed for missing, stale and corrupted copies", async () => {
  const publicRoot = await fs.mkdtemp(path.join(os.tmpdir(), "guided-replacement-delivery-"));
  const source = path.join(publicRoot, canonical);
  const revisions = { [canonical]: hash(currentBytes).slice(0, 12) };
  try {
    await fs.mkdir(path.dirname(source), { recursive: true });
    await fs.writeFile(source, currentBytes);
    await assert.rejects(buildGuidedReadingReplacementImages({ publicRoot, revisions, additionalImages: [], check: true }), /Missing replacement/);
    await buildGuidedReadingReplacementImages({ publicRoot, revisions, additionalImages: [] });
    await buildGuidedReadingReplacementImages({ publicRoot, revisions, additionalImages: [], check: true });
    await fs.writeFile(source, "unreviewed replacement");
    await assert.rejects(buildGuidedReadingReplacementImages({ publicRoot, revisions, additionalImages: [] }), /Stale reviewed image/);
    await fs.writeFile(source, currentBytes);
    await fs.writeFile(path.join(publicRoot, guidedReadingReplacementImagePath(canonical, revisions[canonical])), "corrupted delivery");
    await assert.rejects(buildGuidedReadingReplacementImages({ publicRoot, revisions, additionalImages: [], check: true }), /delivery bytes changed/);
  } finally {
    await fs.rm(publicRoot, { recursive: true, force: true });
  }
});
