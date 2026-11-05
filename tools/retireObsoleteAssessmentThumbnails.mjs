import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {collectAppVisualSourceGraph} from './lib/appVisualSourceGraph.mjs';
import {retirePlaceholderQaRows} from './retirePrepositionPlaceholderScenes.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--write', '--check'].includes(arg))) throw new Error('Usage: node tools/retireObsoleteAssessmentThumbnails.mjs [--write|--check]');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/manifests/retired-obsolete-assessment-thumbnails.json')));
  const graph = collectAppVisualSourceGraph(root);
  if (graph.issues.length || graph.dynamic.length) throw new Error('Incomplete current source graph');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-thumbnail-retirement-'));
  let finite;
  try {
    const report = path.join(temp, 'finite.json');
    execFileSync(process.execPath, [path.join(root, 'tools/auditFiniteImageBindings.mjs'), '--output=' + report], {cwd: root, stdio: 'pipe'});
    finite = JSON.parse(fs.readFileSync(report));
  } finally {fs.rmSync(temp, {recursive: true, force: true});}
  if (finite.errors.length) throw new Error('Incomplete finite image consumer proof');
  const retired = new Set(manifest.assets.map(asset => asset.path));
  const bindings = finite.allFiniteImageBindings.filter(row => retired.has(row.path));
  if (bindings.some(row => row.surface !== 'Admin Media QA actual all-row thumbnail selector')) throw new Error('Image has a learner, history or authoring authority binding');
  const qa = path.join(root, 'src/data/generated/mediaQaReviewItems.generated.js');
  const priorSource = fs.readFileSync(qa, 'utf8');
  const {mediaQaReviewItems} = await import(pathToFileURL(qa));
  const result = retirePlaceholderQaRows(mediaQaReviewItems, manifest.assets);
  for (const asset of manifest.assets) {
    const filename = path.join(root, 'public', asset.path);
    if (fs.existsSync(filename) && hash(fs.readFileSync(filename)) !== asset.sha256) throw new Error('Reviewed source changed: ' + asset.path);
  }
  const existing = manifest.assets.filter(asset => fs.existsSync(path.join(root, 'public', asset.path)));
  const summary = {retiredPaths: [...retired], obsoleteQaRows: result.removed.length, retainedQaRows: result.items.length, retainedQaSha256: result.retainedSha256, existingImages: existing.length, finiteErrors: finite.errors, currentBindings: bindings, sourceGraph: {moduleCount: graph.modules.length, issues: graph.issues, dynamic: graph.dynamic}};
  if (args.includes('--write')) {
    fs.writeFileSync(path.join(root, '.artifacts/app-image-logic-audit/shard-1/obsolete-thumbnail-retirement-receipt.json'), JSON.stringify({...summary, removedQaRows: result.removed}, null, 2) + '\n');
    if (result.removed.length) {
      const first = priorSource.indexOf('export const mediaQaReviewItems = '), tail = priorSource.indexOf(';\n\nexport default mediaQaReviewItems;', first);
      if (first < 0 || tail < 0) throw new Error('Unrecognized QA inventory serialization');
      fs.writeFileSync(qa, priorSource.slice(0, first) + 'export const mediaQaReviewItems = ' + JSON.stringify(result.items, null, 2) + priorSource.slice(tail));
    }
    for (const asset of existing) fs.unlinkSync(path.join(root, 'public', asset.path));
  } else if (args.includes('--check') && (existing.length || result.removed.length)) process.exitCode = 1;
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {console.error(error.message); process.exitCode = 1;});
