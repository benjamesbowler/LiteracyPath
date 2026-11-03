// Local end-to-end fixture: the production Worker reads a filesystem-backed R2
// substitute. No cloud credentials, external writes or learner data are used.
import fs from 'node:fs/promises';
import { constants, createReadStream } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createMediaHandler } from '../infra/shared-media/worker.mjs';
import { isMediaPath, mediaType } from '../infra/shared-media/protocol.mjs';
import { planSharedMedia, publishSharedMedia } from './lib/sharedMediaPublisher.mjs';
import baseConfig from '../config/vercel-base.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(root, 'dist');
const fixtureRoot = path.join(root, '.artifacts/shared-media-migration/local-r2');
const metadataPath = path.join(fixtureRoot, 'index.json');
const snapshot = process.env.SHARED_MEDIA_SNAPSHOT;
await fs.mkdir(fixtureRoot, { recursive: true });
let metadata = {};
try { metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

function storedPath(key) {
  if (!/^(objects\/[a-f0-9]{64}|snapshots\/[a-f0-9]{40}\/(?:[a-f0-9]{2}|release)\.json)$/.test(key)) throw new Error('Invalid fixture key');
  return path.join(fixtureRoot, key);
}

if (process.argv.includes('--prepare')) {
  const plan = await planSharedMedia({ distRoot, publicRoot: path.join(root, 'public'), snapshot });
  const store = {
    async list() {
      const rows = [];
      for (const [key, record] of Object.entries(metadata)) {
        const stat = await fs.stat(storedPath(key));
        rows.push({ key, size: stat.size, etag: record.etag });
      }
      return rows;
    },
    async getText(key) {
      try { return await fs.readFile(storedPath(key), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async putIfAbsent(object) {
      if (!metadata[object.key]) {
        const target = storedPath(object.key);
        await fs.mkdir(path.dirname(target), { recursive: true });
        if (object.file) await fs.copyFile(object.file, target, constants.COPYFILE_FICLONE);
        else await fs.writeFile(target, object.body, { flag: 'wx' });
        metadata[object.key] = { size: object.size, etag: object.md5 };
      }
      return metadata[object.key];
    }
  };
  const result = await publishSharedMedia(plan, store, { stripOutput: true,
    onProgress: row => console.log('[local media fixture]', JSON.stringify(row)) });
  await fs.writeFile(metadataPath, JSON.stringify(metadata));
  await fs.writeFile(path.join(fixtureRoot, 'fixture.json'), JSON.stringify(result));
  console.log(JSON.stringify({ localFixtureOnly: true, pathsVerified: result.files,
    logicalBytesExternalized: result.logicalBytes, remainingMediaDirectories: 0 }));
} else {
  const details = JSON.parse(await fs.readFile(path.join(fixtureRoot, 'fixture.json'), 'utf8'));
  const handler = createMediaHandler();
  const bucket = {
    async get(key, options) {
      if (!metadata[key]) return null;
      const file = storedPath(key);
      const range = options?.range;
      let body;
      return {
        get body() {
          body ||= Readable.toWeb(createReadStream(file, range ? { start: range.offset, end: range.offset + range.length - 1 } : {}));
          return body;
        },
        json: () => fs.readFile(file, 'utf8').then(JSON.parse)
      };
    }
  };
  const globalHeaders = Object.fromEntries(baseConfig.headers.find(rule => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]));
  const proof = { snapshot: details.snapshot, requests: 0, mediaRequests: 0, rangeResponses: 0, errors: [] };
  const port = Number(process.env.SHARED_MEDIA_PREVIEW_PORT || 5187);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
  const server = http.createServer(async (request, response) => {
    proof.requests += 1;
    try {
      const url = new URL(request.url, `http://127.0.0.1:${port}`);
      if (isMediaPath(url.pathname)) {
        proof.mediaRequests += 1;
        const headers = new Headers();
        for (const key of ['range', 'if-range', 'if-none-match', 'if-match']) {
          if (request.headers[key]) headers.set(key, request.headers[key]);
        }
        const upstream = new Request(`https://local-worker.invalid/v1/${details.snapshot}${url.pathname}${url.search}`, { method: request.method, headers });
        const result = await handler(upstream, { MEDIA: bucket });
        if (result.status === 206) proof.rangeResponses += 1;
        if (result.status >= 400) proof.errors.push({ path: url.pathname, status: result.status });
        response.writeHead(result.status, { ...globalHeaders, ...Object.fromEntries(result.headers) });
        if (result.body) {
          const stream = Readable.fromWeb(result.body);
          stream.on('error', () => response.destroy());
          response.on('close', () => stream.destroy());
          stream.pipe(response);
        } else response.end();
        return;
      }
      const rewrite = baseConfig.rewrites.find(rule => rule.source === url.pathname);
      const relative = (rewrite?.destination || (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname))).replace(/^\//, '');
      const file = path.resolve(distRoot, relative);
      if (!file.startsWith(distRoot + path.sep)) { response.writeHead(404).end(); return; }
      const stat = await fs.stat(file).catch(() => null);
      if (!stat?.isFile()) { response.writeHead(404).end(); return; }
      response.writeHead(200, { ...globalHeaders, 'Content-Type': mediaType(file), 'Content-Length': stat.size });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch {
      if (!response.headersSent) response.writeHead(500);
      response.end();
      proof.errors.push({ path: new URL(request.url, 'http://localhost').pathname, status: 500 });
    }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Shared-media local preview: http://127.0.0.1:${port}`));
  async function close() {
    await fs.writeFile(path.join(root, '.artifacts/shared-media-migration/local-request-proof.json'), JSON.stringify(proof, null, 2));
    server.close(() => process.exit(0));
    server.closeAllConnections();
  }
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}
