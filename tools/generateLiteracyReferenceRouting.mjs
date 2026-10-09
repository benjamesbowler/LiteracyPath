import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const questions = JSON.parse(fs.readFileSync(new URL('src/content/literacy-reference/questions.json', root), 'utf8'));
const ranges = {};
for (const { skillId, demand } of questions) {
  const prior = ranges[skillId];
  ranges[skillId] = { minimum: Math.min(prior?.minimum ?? demand, demand), maximum: Math.max(prior?.maximum ?? demand, demand) };
}
const output = JSON.stringify(Object.fromEntries(Object.entries(ranges).sort(([a],[b])=>a.localeCompare(b))), null, 2)+'\n';
const destination = new URL('src/content/literacy-reference/routing.generated.json', root);
if (process.argv.includes('--write')) fs.writeFileSync(destination, output);
else if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) {
  throw new Error('Reference demand index is stale. Run node tools/generateLiteracyReferenceRouting.mjs --write.');
}
console.log(`Reference routing index: ${Object.keys(ranges).length} skills; ${Buffer.byteLength(output)} bytes; ${fileURLToPath(destination)}.`);
