#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const fsp = fs.promises;

const desktop = '/Users/benjaminbowler/Desktop';
const projectRoot = '/Users/benjaminbowler/Desktop/LiteracyPath';
const requestedDest = path.join(desktop, 'LP Assets');
const destRoot = path.join(projectRoot, 'LP Assets');

const sourceDirPattern = /kimi_agent_literacypath.*(?:assets|assests|assest|asset)|literacypath.*asset.*pack/i;
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const audioExts = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg']);
const manifestExts = new Set(['.json', '.md', '.csv', '.txt', '.yaml', '.yml']);
const docExts = new Set(['.pdf', '.docx', '.xlsx']);
const archiveExts = new Set(['.zip', '.tar', '.gz']);
const junkNames = new Set(['.DS_Store', 'Thumbs.db']);

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function exists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function cleanNamePart(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'asset';
}

function cleanFilename(file) {
  const ext = path.extname(file).toLowerCase();
  const base = cleanNamePart(
    path
      .basename(file, path.extname(file))
      .replace(/\bcopy\b/gi, '')
      .replace(/\(\d+\)/g, ''),
  );
  return `${base}${ext}`;
}

function csvEscape(value) {
  const text = value == null ? '' : Array.isArray(value) ? value.join('; ') : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function getPackNumber(dir) {
  const name = path.basename(dir).toLowerCase();
  const match = name.match(/(?:assets|assests|assest|asset)\s*(\d+)/i) || name.match(/pack\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getType(ext) {
  if (imageExts.has(ext)) return 'image';
  if (audioExts.has(ext)) return 'audio';
  if (manifestExts.has(ext)) return 'json/doc';
  if (docExts.has(ext)) return 'doc';
  if (archiveExts.has(ext)) return 'archive';
  return 'unsupported';
}

async function walk(dir) {
  const files = [];
  async function visit(current) {
    let entries = [];
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  await visit(dir);
  return files;
}

function inferCategory(filePath, type) {
  const lowerPath = filePath.toLowerCase();
  const basename = path.basename(filePath).toLowerCase();

  if (lowerPath.includes('guided-reading') || lowerPath.includes('guided_reading') || lowerPath.includes('guided reading')) {
    if (type === 'audio') return lowerPath.includes('word') ? 'guided-reading/word-audio' : 'guided-reading/page-narration';
    if (type === 'image') return lowerPath.includes('cover') || basename.includes('cover') ? 'guided-reading/covers' : 'guided-reading/pages';
    return 'guided-reading';
  }

  if (lowerPath.includes('learning-world') || lowerPath.includes('space-hub')) return 'learning-world';

  const categoryChecks = [
    ['initial-sounds', ['initial', 'beginning', 'first-sound', 'first_sound']],
    ['final-sounds', ['final', 'ending-sound', 'ending_sound']],
    ['rhyming', ['rhyme', 'rhyming']],
    ['short-vowels', ['short-vowel', 'short_vowel', 'short-a', 'short-e', 'short-i', 'short-o', 'short-u']],
    ['cvc', ['cvc', 'minimal-pair']],
    ['blends', ['blend', 'blends']],
    ['digraphs', ['digraph', 'digraphs', 'sh-', 'ch-', 'th-', 'wh-', 'ck-']],
    ['long-vowels', ['long-vowel', 'silent-e', 'magic-e', 'long_vowel']],
    ['vowel-teams', ['vowel-team', 'vowel_team', 'vowel-teams']],
    ['r-controlled', ['r-controlled', 'r_controlled', 'rcontrolled']],
    ['plurals', ['plural', 'plurals']],
    ['hfw', ['hfw', 'sight-word', 'sight_word', 'high-frequency']],
    ['vocabulary', ['vocab', 'vocabulary', 'category', 'categories']],
    ['grammar', ['grammar', 'sentence', 'verb', 'noun']],
    ['ui', ['listen-icon', 'ui', 'button', 'icon']],
  ];

  const match = categoryChecks.find(([, needles]) => needles.some((needle) => lowerPath.includes(needle)));
  if (match) return match[0];

  if (type === 'audio') {
    if (lowerPath.includes('phrase')) return 'assessment/phrases';
    if (lowerPath.includes('hfw')) return 'assessment/hfw';
    return 'assessment/words';
  }
  if (type === 'image') return 'assessment/review-needed';
  return 'source-manifests';
}

function destinationSubdir(category, type) {
  if (type === 'json/doc' || type === 'doc') return 'source-manifests';
  if (type === 'image') {
    if (category === 'learning-world') return 'images/learning-world';
    if (category === 'guided-reading/covers') return 'images/guided-reading/covers';
    if (category === 'guided-reading/pages') return 'images/guided-reading/pages';
    if (category === 'assessment/review-needed') return 'images/review-needed';
    return `images/assessment/${category.replace(/^assessment\//, '')}`;
  }
  if (type === 'audio') {
    if (category === 'guided-reading/page-narration') return 'audio/guided-reading/page-narration';
    if (category === 'guided-reading/word-audio') return 'audio/guided-reading/word-audio';
    if (category === 'assessment/hfw') return 'audio/assessment/hfw';
    if (category === 'assessment/phrases') return 'audio/assessment/phrases';
    if (category === 'assessment/review-needed') return 'audio/assessment/review-needed';
    return 'audio/assessment/words';
  }
  return 'rejected/unsupported';
}

function semanticKey(filePath, category) {
  const ext = path.extname(filePath);
  let base = path.basename(filePath, ext).toLowerCase();
  if (category.includes('guided-reading')) {
    const parts = filePath.toLowerCase().split(/[\\/]/).map(cleanNamePart).filter(Boolean);
    const bookIndex = parts.findIndex((part) => part === 'books');
    return bookIndex >= 0 && parts[bookIndex + 1] ? parts.slice(bookIndex + 1).join('-') : cleanNamePart(base);
  }
  base = base
    .replace(/^(short-[aeiou]|initial|final|rhyme|rhyming|cvc|blend|digraph|hfw|word|audio|image)[-_]+/g, '')
    .replace(/[-_]+(image|audio|word|clean|kimi|human|voice|final|initial)$/g, '')
    .replace(/[-_]+copy[-_]*\d*$/g, '')
    .replace(/\(\d+\)/g, '');
  return cleanNamePart(base);
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function readImageSize(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(32);
    fs.readSync(fd, header, 0, 32, 0);
    fs.closeSync(fd);
    if (header.toString('ascii', 1, 4) === 'PNG') {
      return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
    }
    if (header[0] === 0xff && header[1] === 0xd8) {
      const data = fs.readFileSync(filePath);
      let index = 2;
      while (index < data.length) {
        if (data[index] !== 0xff) break;
        const marker = data[index + 1];
        const length = data.readUInt16BE(index + 2);
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
          return { height: data.readUInt16BE(index + 5), width: data.readUInt16BE(index + 7) };
        }
        index += 2 + length;
      }
    }
  } catch {
    // Best-effort dimensions only.
  }
  return { width: null, height: null };
}

async function safeCopy(src, dest) {
  await ensureDir(path.dirname(dest));
  try {
    await fsp.copyFile(src, dest, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

function uniqueDest(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base}-${index}${ext}`);
    index += 1;
  }
  return candidate;
}

async function main() {
  const desktopEntries = await fsp.readdir(desktop, { withFileTypes: true });
  const sourceDirs = desktopEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(desktop, entry.name))
    .filter((dir) => sourceDirPattern.test(path.basename(dir)) && path.resolve(dir) !== path.resolve(destRoot))
    .sort((a, b) => (getPackNumber(a) ?? 999) - (getPackNumber(b) ?? 999) || a.localeCompare(b));

  if (await exists(destRoot)) {
    await fsp.rename(destRoot, path.join(projectRoot, `LP Assets Backup ${nowStamp()}`));
  }

  const requiredDirs = [
    'manifests',
    'images/assessment/initial-sounds',
    'images/assessment/final-sounds',
    'images/assessment/rhyming',
    'images/assessment/cvc',
    'images/assessment/short-vowels',
    'images/assessment/blends',
    'images/assessment/digraphs',
    'images/assessment/long-vowels',
    'images/assessment/vowel-teams',
    'images/assessment/r-controlled',
    'images/assessment/plurals',
    'images/assessment/hfw',
    'images/assessment/vocabulary',
    'images/assessment/grammar',
    'images/assessment/ui',
    'images/guided-reading/covers',
    'images/guided-reading/pages',
    'images/learning-world',
    'images/review-needed',
    'audio/assessment/words',
    'audio/assessment/hfw',
    'audio/assessment/phrases',
    'audio/assessment/review-needed',
    'audio/guided-reading/page-narration',
    'audio/guided-reading/word-audio',
    'audio/review-needed',
    'source-manifests',
    'reports',
    'rejected/duplicates',
    'rejected/unsupported',
    'rejected/malformed',
  ];
  await ensureDir(destRoot);
  await Promise.all(requiredDirs.map((dir) => ensureDir(path.join(destRoot, dir))));

  const projectAssetRoots = [
    path.join(projectRoot, 'public/images'),
    path.join(projectRoot, 'public/audio'),
    path.join(projectRoot, 'public/guided-reading'),
  ];
  const projectHashMap = new Map();
  const projectBaseMap = new Map();
  for (const root of projectAssetRoots) {
    if (!(await exists(root))) continue;
    const files = await walk(root);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!imageExts.has(ext) && !audioExts.has(ext) && !manifestExts.has(ext)) continue;
      const hash = await hashFile(file);
      if (!projectHashMap.has(hash)) projectHashMap.set(hash, []);
      projectHashMap.get(hash).push(file);
      const base = cleanFilename(path.basename(file));
      if (!projectBaseMap.has(base)) projectBaseMap.set(base, []);
      projectBaseMap.get(base).push(file);
    }
  }

  const sourceSummaries = [];
  const allRecords = [];
  const unsupportedRecords = [];
  let totalFilesFound = 0;

  for (const dir of sourceDirs) {
    const files = await walk(dir);
    const summary = {
      folderName: path.basename(dir),
      folderPath: dir,
      packNumber: getPackNumber(dir),
      totalFiles: files.length,
      imageCount: 0,
      audioCount: 0,
      jsonManifestCount: 0,
      zipDocUnsupportedCount: 0,
      duplicateFilenames: 0,
      likelyPackNumber: getPackNumber(dir) ?? 'unknown',
    };
    const filenameCounts = new Map();
    files.forEach((file) => {
      const lower = path.basename(file).toLowerCase();
      filenameCounts.set(lower, (filenameCounts.get(lower) || 0) + 1);
    });
    summary.duplicateFilenames = [...filenameCounts.values()].filter((count) => count > 1).length;

    for (const file of files) {
      const name = path.basename(file);
      if (junkNames.has(name)) continue;
      totalFilesFound += 1;
      const ext = path.extname(file).toLowerCase();
      const type = getType(ext);
      if (type === 'image') summary.imageCount += 1;
      else if (type === 'audio') summary.audioCount += 1;
      else if (type === 'json/doc') summary.jsonManifestCount += 1;
      else summary.zipDocUnsupportedCount += 1;

      const stat = await fsp.stat(file);
      if (type === 'archive' || type === 'unsupported') {
        unsupportedRecords.push({
          originalSourcePath: file,
          type,
          size: stat.size,
          sourcePack: summary.folderName,
          status: 'unsupported',
          notes: type === 'archive' ? 'Archive detected; not copied into canonical asset folders.' : 'Unsupported file type.',
        });
        continue;
      }

      const category = inferCategory(file, type);
      const hash = await hashFile(file);
      const dimensions = type === 'image' ? readImageSize(file) : { width: null, height: null };
      const clean = cleanFilename(name);
      const usedPaths = projectHashMap.get(hash) || projectBaseMap.get(clean) || [];

      allRecords.push({
        originalSourcePath: file,
        sourcePack: summary.folderName,
        packNumber: summary.packNumber,
        originalFilename: name,
        cleanFilename: clean,
        ext,
        type,
        category,
        semanticKey: semanticKey(file, category),
        hash,
        size: stat.size,
        width: dimensions.width,
        height: dimensions.height,
        currentlyUsedInProject: usedPaths.length > 0,
        projectPathIfUsed: usedPaths[0] || '',
        duplicateSourcePaths: [],
        status: 'candidate',
        preferredForLiteracyPath: false,
        canonicalFile: '',
        canonicalPath: '',
        notes: '',
      });
    }
    sourceSummaries.push(summary);
  }

  const byHash = new Map();
  allRecords.forEach((record) => {
    if (!byHash.has(record.hash)) byHash.set(record.hash, []);
    byHash.get(record.hash).push(record);
  });

  const uniqueByHash = [];
  const duplicateEntries = [];
  for (const group of byHash.values()) {
    group.sort(
      (a, b) =>
        Number(b.currentlyUsedInProject) - Number(a.currentlyUsedInProject) ||
        (a.packNumber ?? 999) - (b.packNumber ?? 999) ||
        b.size - a.size,
    );
    const keeper = group[0];
    keeper.duplicateSourcePaths = group.slice(1).map((record) => record.originalSourcePath);
    uniqueByHash.push(keeper);
    group.slice(1).forEach((duplicate) => {
      duplicate.status = 'duplicate';
      duplicate.notes = `Exact content duplicate of ${keeper.originalSourcePath}`;
      duplicateEntries.push(duplicate);
    });
  }

  const bySemantic = new Map();
  uniqueByHash.forEach((record) => {
    const key = `${record.type}|${record.category}|${record.semanticKey}`;
    if (!bySemantic.has(key)) bySemantic.set(key, []);
    bySemantic.get(key).push(record);
  });

  const manifestEntries = [];
  const conflictEntries = [];
  let copiedCanonical = 0;
  let copiedConflicts = 0;

  for (const group of bySemantic.values()) {
    group.sort((a, b) => {
      const score = (record) =>
        (record.currentlyUsedInProject ? 1000000000 : 0) +
        (record.width || 0) * (record.height || 0) +
        Math.min(record.size, 500000000) / 1000 -
        (record.packNumber ?? 99) * 10;
      return score(b) - score(a);
    });

    const canonical = group[0];
    canonical.status = 'canonical';
    canonical.preferredForLiteracyPath = canonical.currentlyUsedInProject || group.length === 1;
    canonical.notes =
      group.length > 1
        ? `Canonical selected from ${group.length} same-key candidates; alternatives preserved for review.`
        : canonical.duplicateSourcePaths.length
          ? `Canonical exact asset; ${canonical.duplicateSourcePaths.length} duplicate source path(s) skipped.`
          : 'Canonical asset copied from source pack.';

    const destDir = path.join(destRoot, destinationSubdir(canonical.category, canonical.type));
    const dest = uniqueDest(destDir, canonical.cleanFilename);
    await safeCopy(canonical.originalSourcePath, dest);
    copiedCanonical += 1;
    canonical.canonicalFile = path.basename(dest);
    canonical.canonicalPath = path.relative(destRoot, dest);
    manifestEntries.push(canonical);

    for (const alternate of group.slice(1)) {
      alternate.status = 'review_needed';
      alternate.preferredForLiteracyPath = false;
      alternate.notes = `Same semantic key as preferred asset ${canonical.canonicalPath}; preserved for human review.`;
      const altSubdir = alternate.type === 'image' ? 'images/review-needed' : alternate.type === 'audio' ? 'audio/review-needed' : 'source-manifests';
      const altName = `${path.basename(alternate.cleanFilename, alternate.ext)}--alt-${cleanNamePart(alternate.sourcePack)}${alternate.ext}`;
      const altDest = uniqueDest(path.join(destRoot, altSubdir), altName);
      await safeCopy(alternate.originalSourcePath, altDest);
      copiedConflicts += 1;
      alternate.canonicalFile = path.basename(altDest);
      alternate.canonicalPath = path.relative(destRoot, altDest);
      conflictEntries.push(alternate);
    }
  }

  await fsp.writeFile(path.join(destRoot, 'rejected/unsupported/unsupported-files.json'), JSON.stringify(unsupportedRecords, null, 2));

  const manifestRows = [
    ...manifestEntries,
    ...conflictEntries,
    ...duplicateEntries,
    ...unsupportedRecords.map((record) => ({
      canonicalFile: '',
      canonicalPath: '',
      type: record.type,
      category: 'unsupported',
      semanticKey: '',
      sourcePack: record.sourcePack,
      originalSourcePath: record.originalSourcePath,
      duplicateSourcePaths: [],
      status: 'unsupported',
      preferredForLiteracyPath: false,
      currentlyUsedInProject: false,
      projectPathIfUsed: '',
      notes: record.notes,
    })),
  ];

  const masterManifest = manifestRows.map((record) => ({
    canonicalFile: record.canonicalFile || '',
    canonicalPath: record.canonicalPath || '',
    type: record.type || '',
    category: record.category || '',
    semanticKey: record.semanticKey || '',
    sourcePack: record.sourcePack || '',
    originalSourcePath: record.originalSourcePath || '',
    duplicateSourcePaths: record.duplicateSourcePaths || [],
    status: record.status || '',
    preferredForLiteracyPath: Boolean(record.preferredForLiteracyPath),
    currentlyUsedInProject: Boolean(record.currentlyUsedInProject),
    projectPathIfUsed: record.projectPathIfUsed || '',
    notes: record.notes || '',
  }));

  await fsp.writeFile(path.join(destRoot, 'manifests/lp-assets-master-manifest.json'), JSON.stringify(masterManifest, null, 2));

  const csvHeaders = [
    'canonicalFile',
    'canonicalPath',
    'type',
    'category',
    'semanticKey',
    'sourcePack',
    'originalSourcePath',
    'duplicateSourcePaths',
    'status',
    'preferredForLiteracyPath',
    'currentlyUsedInProject',
    'projectPathIfUsed',
    'notes',
  ];
  const csv = [
    csvHeaders.join(','),
    ...masterManifest.map((record) => csvHeaders.map((header) => csvEscape(record[header])).join(',')),
  ].join('\n');
  await fsp.writeFile(path.join(destRoot, 'manifests/lp-assets-master-manifest.csv'), csv);

  const copiedFiles = await walk(destRoot);
  const canonicalPaths = manifestEntries.map((record) => path.join(destRoot, record.canonicalPath)).filter((file) => fs.existsSync(file));
  const canonicalHashes = new Map();
  let duplicateCanonicalHashes = 0;
  for (const file of canonicalPaths) {
    const hash = await hashFile(file);
    if (canonicalHashes.has(hash)) duplicateCanonicalHashes += 1;
    else canonicalHashes.set(hash, file);
  }
  const brokenManifestPaths = masterManifest.filter((record) => record.canonicalPath && !fs.existsSync(path.join(destRoot, record.canonicalPath))).length;
  const folderCounts = new Map();
  copiedFiles.forEach((file) => {
    const relDir = path.dirname(path.relative(destRoot, file));
    folderCounts.set(relDir, (folderCounts.get(relDir) || 0) + 1);
  });

  const byTypeCanonical = manifestEntries.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {});
  const guidedCanonical = manifestEntries.filter((record) => String(record.category).startsWith('guided-reading')).length;
  const assessmentImageCanonical = manifestEntries.filter((record) => record.type === 'image' && String(record.category).startsWith('assessment')).length;
  const assessmentAudioCanonical = manifestEntries.filter((record) => record.type === 'audio' && String(record.category).startsWith('assessment')).length;
  const usedInProject = manifestEntries.filter((record) => record.currentlyUsedInProject).length;

  const sourceTable = sourceSummaries
    .map(
      (summary) =>
        `| ${summary.folderName} | ${summary.likelyPackNumber} | ${summary.totalFiles} | ${summary.imageCount} | ${summary.audioCount} | ${summary.jsonManifestCount} | ${summary.zipDocUnsupportedCount} | ${summary.duplicateFilenames} |`,
    )
    .join('\n');
  const folderTable = [...folderCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([folder, count]) => `| ${folder} | ${count} |`)
    .join('\n');

  const report = `# Asset Consolidation Report

Generated: ${new Date().toISOString()}

## Destination

Requested destination: \`${requestedDest}\`

Actual destination created: \`${destRoot}\`

The requested Desktop-level folder could not be created from the current sandbox, so this clean backup was created inside the writable LiteracyPath workspace. Original source folders were not modified.

## Source Folders Scanned

| Folder | Pack | Total files | Images | Audio | JSON/manifests | Zip/doc/unsupported | Duplicate filenames |
|---|---:|---:|---:|---:|---:|---:|---:|
${sourceTable}

## Summary

- Source folders scanned: ${sourceSummaries.length}
- Total source files considered, excluding junk files: ${totalFilesFound}
- Canonical files copied: ${copiedCanonical}
- Exact duplicate source paths skipped: ${duplicateEntries.length}
- Same-key conflicts preserved in review-needed: ${copiedConflicts}
- Unsupported/archive files logged: ${unsupportedRecords.length}
- Canonical files by type: ${Object.entries(byTypeCanonical).map(([key, value]) => `${key}: ${value}`).join(', ')}
- Guided Reading canonical assets/manifests: ${guidedCanonical}
- Assessment canonical images: ${assessmentImageCanonical}
- Assessment canonical audio: ${assessmentAudioCanonical}
- Canonical assets detected as currently used in LiteracyPath project: ${usedInProject}

## Deduplication Validation

- Duplicate hashes inside canonical manifest files: ${duplicateCanonicalHashes}
- Broken manifest paths: ${brokenManifestPaths}
- Original source folders deleted or moved: no
- Active LiteracyPath runtime paths changed: no

## Folder Counts

| Folder | Files |
|---|---:|
${folderTable}

## Review Needed

Assets in \`images/review-needed\` and \`audio/review-needed\` are semantic conflicts or uncertain alternate versions. They were preserved with an \`--alt-pack\` suffix and should not be treated as approved production assets without review.

## Unsupported

Unsupported and archive files were not copied into canonical folders. A machine-readable list is available at \`rejected/unsupported/unsupported-files.json\`.
`;

  await fsp.writeFile(path.join(destRoot, 'reports/asset_consolidation_report.md'), report);

  const readme = `# LP Assets

This folder is a clean, deduplicated local backup of the Kimi/LiteracyPath asset pack folders found on the Desktop.

It is an archive, not the active app runtime. The LiteracyPath application still uses its existing assets under \`public/\` and data manifests under \`src/data/\`.

## Important Safety Notes

- Original Kimi/source folders were not deleted, moved, or modified.
- Active LiteracyPath runtime paths were not changed.
- Exact duplicate files were skipped from canonical folders and recorded in the master manifest.
- Same-key conflicts were preserved under \`images/review-needed\` or \`audio/review-needed\` with suffixes.
- Unsupported/archive files are listed under \`rejected/unsupported/unsupported-files.json\`.

## Key Files

- Master manifest JSON: \`manifests/lp-assets-master-manifest.json\`
- Master manifest CSV: \`manifests/lp-assets-master-manifest.csv\`
- Consolidation report: \`reports/asset_consolidation_report.md\`

## How To Use Later

Use this folder as a reference library when choosing future production assets. Before moving anything into the active LiteracyPath app, run the app's normal validation and approved-audio checks. Do not treat review-needed alternatives as approved assets without human review.

## Actual Location

The requested Desktop-level path was \`${requestedDest}\`, but the current sandbox cannot write there directly. This backup was created at:

\`${destRoot}\`
`;

  await fsp.writeFile(path.join(destRoot, 'README.md'), readme);

  console.log(JSON.stringify({
    requestedDest,
    destRoot,
    sourceFolders: sourceSummaries,
    totalFilesFound,
    copiedCanonical,
    exactDuplicatesSkipped: duplicateEntries.length,
    conflictsPreserved: copiedConflicts,
    unsupportedLogged: unsupportedRecords.length,
    guidedCanonical,
    assessmentImageCanonical,
    assessmentAudioCanonical,
    currentlyUsedInProject: usedInProject,
    duplicateCanonicalHashes,
    brokenManifestPaths,
    copiedFiles: copiedFiles.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
