import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import {
  buildQuestOfflineUpdateFixtures,
  fixtureBuildRecord,
  UPDATE_FIXTURES
} from "./buildQuestOfflineUpdateFixtures.mjs";

const PORT = Number(process.env.PORT || 5192);
const records = process.env.QUEST_UPDATE_USE_EXISTING === "1"
  ? { a: fixtureBuildRecord("a"), b: fixtureBuildRecord("b") }
  : buildQuestOfflineUpdateFixtures();
if (!records.a.buildId || !records.b.buildId || records.a.buildId === records.b.buildId) {
  throw new Error("Sound Seekers update fixtures must contain two distinct build ids");
}
let active = "a";

const CONTENT_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
});

function json(response, status, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(`${JSON.stringify(body)}\n`);
}

function safeFile(root, pathname) {
  const candidate = path.resolve(root, `.${pathname}`);
  return candidate.startsWith(`${root}${path.sep}`) ? candidate : null;
}

function selectedFile(pathname) {
  const primary = safeFile(UPDATE_FIXTURES[active], pathname);
  if (primary && existsSync(primary) && statSync(primary).isFile()) return primary;
  if (!pathname.startsWith("/assets/")) return null;
  for (const root of Object.values(UPDATE_FIXTURES)) {
    const retained = safeFile(root, pathname);
    if (retained && existsSync(retained) && statSync(retained).isFile()) return retained;
  }
  return null;
}

function sendFile(request, response, file, pathname) {
  const stat = statSync(file);
  const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  const headers = {
    "Accept-Ranges": "bytes",
    "Content-Type": CONTENT_TYPES[path.extname(file)] || "application/octet-stream",
    "Cache-Control": pathname === "/sw.js" || pathname.endsWith(".html")
      ? "no-store"
      : pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache"
  };
  if (pathname === "/sw.js") headers["Service-Worker-Allowed"] = "/";

  if (range) {
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) {
      response.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      response.end();
      return;
    }
    response.writeHead(206, {
      ...headers,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(file, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, "Content-Length": stat.size });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
}

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
  if (request.method === "GET" && url.pathname === "/__quest_update/state") {
    json(response, 200, {
      active,
      buildA: records.a.buildId,
      buildB: records.b.buildId
    });
    return;
  }
  if (request.method === "POST" && url.pathname === "/__quest_update/activate-b") {
    active = "b";
    json(response, 200, { active, buildId: records.b.buildId });
    return;
  }
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    json(response, 405, { error: "Method not allowed" });
    return;
  }
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const file = selectedFile(pathname);
  if (!file) {
    json(response, 404, { error: "Not found", pathname });
    return;
  }
  sendFile(request, response, file, pathname);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Sound Seekers update server listening on http://127.0.0.1:${PORT} (${records.a.buildId} -> ${records.b.buildId})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
