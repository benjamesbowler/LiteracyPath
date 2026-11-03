import { createHash } from 'node:crypto';
import { createReadStream, constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { COHORTS, MEDIA_ROOTS, MAX_ASSET_BYTES, MAX_COHORT_FILES, MANIFEST_PATH,
  HASH_PATTERN, STATIC_HEADERS, mediaCohort, validateRelease } from '../../infra/shared-media/protocol.mjs';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
const signature = stat => [stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].join(':');

export async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}

export async function planSharedMedia({ distRoot, publicRoot }) {
  const dist = await fs.realpath(distRoot);
  const source = await fs.realpath(publicRoot);
  if (dist === source || dist.startsWith(source + path.sep) || source.startsWith(dist + path.sep)) {
    throw new Error('Media output must be separate from source assets');
  }
  const files = [];
  const retained = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Shared media cannot contain symlinks');
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) {
        const pathname = '/' + path.relative(dist, file).split(path.sep).join('/');
        const cohort = mediaCohort(pathname);
        const stat = await fs.stat(file);
        if (stat.size > MAX_ASSET_BYTES) { retained.push({ pathname, size: stat.size, reason: 'Above Free static asset size limit' }); continue; }
        const hash = await hashFile(file);
        if (signature(await fs.stat(file)) !== signature(stat)) throw new Error('Media changed during planning');
        files.push({ pathname, cohort, file, size: stat.size, sha256: hash, signature: signature(stat) });
      }
    }
  }
  for (const root of MEDIA_ROOTS) {
    const directory = path.join(dist, root);
    const stat = await fs.lstat(directory).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error));
    if (!stat) continue;
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Invalid media output directory');
    await visit(directory);
  }
  files.sort((a, b) => a.pathname < b.pathname ? -1 : 1);
  const cohorts = Object.fromEntries(COHORTS.map(cohort => {
    const members = files.filter(file => file.cohort === cohort);
    if (members.length > MAX_COHORT_FILES) throw new Error(`${cohort} exceeds the Free static file budget; no uploads or upgrade performed`);
    const catalog = { schemaVersion: 2, cohort, files: Object.fromEntries(members.map(file => [file.pathname, { sha256: file.sha256, size: file.size }])) };
    const body = JSON.stringify(catalog);
    if (Buffer.byteLength(body) > MAX_ASSET_BYTES) throw new Error('Media catalog exceeds the Free asset size limit');
    return [cohort, { files: members, body, manifestSha256: sha256(body), bytes: members.reduce((n, file) => n + file.size, 0) }];
  }));
  return { distRoot: dist, files, retained, cohorts, bytes: files.reduce((n, file) => n + file.size, 0) };
}

export async function stageSharedMedia(plan, directory) {
  const requested = path.resolve(directory);
  const staging = path.join(await fs.realpath(path.dirname(requested)), path.basename(requested));
  if (staging === plan.distRoot || staging.startsWith(plan.distRoot + path.sep)
    || plan.distRoot.startsWith(staging + path.sep)) throw new Error('Staging must be separate from deployment output');
  await fs.mkdir(staging, { recursive: false });
  for (const cohort of COHORTS) {
    const root = path.join(staging, cohort, 'assets');
    for (const file of plan.cohorts[cohort].files) {
      if (signature(await fs.stat(file.file)) !== file.signature) throw new Error('Media changed before staging');
      const destination = path.join(root, file.pathname.slice(1));
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(file.file, destination, constants.COPYFILE_FICLONE);
      if (await hashFile(destination) !== file.sha256) throw new Error('Media staging checksum mismatch');
    }
    await fs.mkdir(path.join(root, '_shared-media'), { recursive: true });
    await fs.writeFile(path.join(root, MANIFEST_PATH.slice(1)), plan.cohorts[cohort].body);
    await fs.writeFile(path.join(root, '_headers'), STATIC_HEADERS);
  }
}

export async function fetchCatalogs(release, fetchImpl = fetch) {
  if (!validateRelease(release)) return null;
  const catalogs = {};
  for (const cohort of COHORTS) {
    const receipt = release.cohorts[cohort];
    const response = await fetchImpl(receipt.origin + MANIFEST_PATH, { redirect: 'error', signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error(`Pinned ${cohort} media catalog unavailable; deployment copies retained`);
    const body = await response.text();
    if (sha256(body) !== receipt.manifestSha256) throw new Error('Pinned media catalog checksum mismatch; deployment copies retained');
    const catalog = JSON.parse(body);
    if (catalog.schemaVersion !== 2 || catalog.cohort !== cohort || !catalog.files
      || Object.keys(catalog.files).length !== receipt.files) throw new Error('Invalid pinned media catalog');
    for (const [pathname, entry] of Object.entries(catalog.files)) {
      if (mediaCohort(pathname) !== cohort || !HASH_PATTERN.test(entry.sha256)
        || !Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > MAX_ASSET_BYTES) throw new Error('Invalid pinned media entry');
    }
    catalogs[cohort] = catalog.files;
  }
  return catalogs;
}

export async function stripPublishedMedia(plan, release, fetchImpl = fetch) {
  const catalogs = await fetchCatalogs(release, fetchImpl);
  if (!catalogs) return { stripped: 0, bytes: 0, local: plan.files.length + plan.retained.length };
  const matches = plan.files.filter(file => {
    // Preserve the recent song/video pack's existing native media delivery.
    if (file.pathname.startsWith('/action-songs/')) return false;
    const entry = catalogs[file.cohort][file.pathname];
    return Object.hasOwn(catalogs[file.cohort], file.pathname) && entry.sha256 === file.sha256 && entry.size === file.size;
  });
  // Check the entire removal set before deleting any generated deployment copy.
  for (const file of matches) if (signature(await fs.stat(file.file)) !== file.signature) throw new Error('Media changed before pruning');
  for (const file of matches) await fs.unlink(file.file);
  const result = { stripped: matches.length, bytes: matches.reduce((n, file) => n + file.size, 0),
    local: plan.files.length + plan.retained.length - matches.length };
  await fs.writeFile(path.join(plan.distRoot, 'shared-media-release.json'), JSON.stringify({ ...release, verification: result }));
  return result;
}

export async function verifyPublishedMedia(plan, release, { fetchImpl = fetch, onProgress = () => {}, concurrency = 12 } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64) throw new Error('Invalid verification concurrency');
  const catalogs = await fetchCatalogs(release, fetchImpl);
  if (!catalogs) throw new Error('Cannot verify disabled media');
  let next = 0;
  let verified = 0;
  let failed;
  await Promise.all(Array.from({ length: Math.min(concurrency, plan.files.length) }, async () => {
    while (!failed && next < plan.files.length) {
      const file = plan.files[next++];
      try {
        if (catalogs[file.cohort][file.pathname]?.sha256 !== file.sha256) throw new Error('Publication catalog differs from source');
        let failure;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const encodedPath = file.pathname.split('/').map(encodeURIComponent).join('/');
            const response = await fetchImpl(release.cohorts[file.cohort].origin + encodedPath, { redirect: 'error', signal: AbortSignal.timeout(60_000) });
            if (!response.ok || !response.body) throw new Error(`Media download returned ${response.status}`);
            const hash = createHash('sha256');
            let size = 0;
            for await (const bytes of response.body) { size += bytes.length; if (size > file.size) throw new Error('Media size mismatch'); hash.update(bytes); }
            if (size !== file.size || hash.digest('hex') !== file.sha256) throw new Error(`Served bytes differ: ${file.pathname}`);
            failure = null;
            break;
          } catch (error) { failure = error; }
        }
        if (failure) throw failure;
        verified += 1;
        if (verified % 500 === 0) onProgress({ verified, total: plan.files.length });
      } catch (error) { failed = error; }
    }
  }));
  if (failed) throw failed;
  return { verified, bytes: plan.bytes };
}
