import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {collectAppVisualSourceGraph} from './lib/appVisualSourceGraph.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
export function retirePlaceholderQaRows(items, assets) {
  const paths = new Set(assets.map(asset => asset.path));
  const removed = items.filter(item => paths.has(item.imagePath));
  const retained = items.filter(item => !paths.has(item.imagePath));
  return {items: retained, removed, retainedSha256: digest(JSON.stringify(retained))};
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--write', '--check'].includes(arg))) throw new Error('Usage: node tools/retirePrepositionPlaceholderScenes.mjs [--write|--check]');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/manifests/retired-preposition-placeholder-scenes.json')));
  const graph = collectAppVisualSourceGraph(root);
  if (graph.issues.length || graph.dynamic.length || graph.modules.includes(manifest.authorModule)) throw new Error('Cannot retire a reachable or unresolved author source');
  if (manifest.assets.length !== 60 || new Set(manifest.assets.map(a => a.path)).size !== 60 || manifest.assets.some(a => !/^\/images\/assessment\/language\/variants\/prepositions\/[a-z0-9-]+\.svg$/.test(a.path))) throw new Error('Invalid exact retirement cohort');
  for (const asset of manifest.assets) {
    const filename = path.join(root, 'public', asset.path);
    if (fs.existsSync(filename) && digest(fs.readFileSync(filename)) !== asset.sha256) throw new Error('Placeholder bytes changed: ' + asset.path);
  }
  for (const asset of manifest.preservedRuntimePaths) if (!fs.existsSync(path.join(root, 'public', asset))) throw new Error('Missing preserved runtime scene: ' + asset);
  const qaPath = path.join(root, 'src/data/generated/mediaQaReviewItems.generated.js');
  const {mediaQaReviewItems} = await import(pathToFileURL(qaPath));
  const result = retirePlaceholderQaRows(mediaQaReviewItems, manifest.assets);
  const existing = manifest.assets.filter(a => fs.existsSync(path.join(root, 'public', a.path)));
  const authorExists = fs.existsSync(path.join(root, manifest.authorModule));
  const summary = {retiredPaths: manifest.assets.map(a => a.path), removedQaRows: result.removed.length, retainedQaRows: result.items.length, retainedQaSha256: result.retainedSha256, sourceGraph: {modules: graph.modules.length, issues: graph.issues, dynamic: graph.dynamic}, existingPlaceholderFiles: existing.length, authorExists};
  if (args.includes('--write')) {
    const receipt = path.join(root, '.artifacts/app-image-logic-audit/shard-1/preposition-retirement-receipt.json');
    fs.writeFileSync(receipt, JSON.stringify({...summary, removedQaRows: result.removed, authorSource: authorExists ? fs.readFileSync(path.join(root, manifest.authorModule), 'utf8') : null}, null, 2) + '\n');
    if (result.removed.length) {
      const previous = fs.readFileSync(qaPath, 'utf8');
      const first = previous.indexOf('export const mediaQaReviewItems = ');
      const tail = previous.indexOf(';\n\nexport default mediaQaReviewItems;', first);
      if (first < 0 || tail < 0) throw new Error('Unrecognized QA inventory serialization');
      fs.writeFileSync(qaPath, previous.slice(0, first) + 'export const mediaQaReviewItems = ' + JSON.stringify(result.items, null, 2) + previous.slice(tail));
    }
    for (const asset of existing) fs.unlinkSync(path.join(root, 'public', asset.path));
    if (authorExists) fs.unlinkSync(path.join(root, manifest.authorModule));
  } else if (args.includes('--check') && (result.removed.length || existing.length || authorExists)) process.exitCode = 1;
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {console.error(error.message); process.exitCode = 1;});
