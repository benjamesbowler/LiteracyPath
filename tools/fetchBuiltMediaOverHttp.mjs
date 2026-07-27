import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(repoRoot, "dist");

function resolveDistPath(urlPath = "") {
  const decoded = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const absolutePath = path.resolve(distRoot, relative);
  if (absolutePath !== distRoot && !absolutePath.startsWith(`${distRoot}${path.sep}`)) return "";
  return absolutePath;
}

function createDistServer() {
  return http.createServer((request, response) => {
    const filePath = resolveDistPath(request.url);
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Not found");
      return;
    }
    const stat = fs.statSync(filePath);
    response.writeHead(200, {
      "content-length": stat.size,
      "cache-control": "no-store"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not resolve the local built-app server port.");
  return address.port;
}

async function close(server) {
  await new Promise(resolve => server.close(resolve));
}

async function fetchInBatches(urls, baseUrl, batchSize = 32) {
  const results = [];
  for (let index = 0; index < urls.length; index += batchSize) {
    const batch = urls.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(async assetPath => {
      try {
        const response = await fetch(`${baseUrl}${encodeURI(assetPath)}`, { cache: "no-store" });
        const body = await response.arrayBuffer();
        return {
          path: assetPath,
          status: response.status,
          bytes: body.byteLength,
          pass: response.status === 200 && body.byteLength > 0,
          error: ""
        };
      } catch (error) {
        return {
          path: assetPath,
          status: 0,
          bytes: 0,
          pass: false,
          error: error.message
        };
      }
    }));
    results.push(...batchResults);
  }
  return results;
}

const assetPaths = JSON.parse(fs.readFileSync(0, "utf8"));
const server = createDistServer();
const port = await listen(server);
let results;
try {
  results = await fetchInBatches(assetPaths, `http://127.0.0.1:${port}`);
} finally {
  await close(server);
}
process.stdout.write(JSON.stringify(results));
