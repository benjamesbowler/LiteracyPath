import fs from 'node:fs';
import { loadLiteracyPracticeBank, LITERACY_PRACTICE_SKILLS } from '../src/data/literacyPracticeBank.js';
import { literacyQuestionDemand } from '../src/policy/literacyPracticeRoutingPolicy.js';

export function literacyPracticeRoutingInventory(bank) {
  return Object.fromEntries(LITERACY_PRACTICE_SKILLS.map(skill => {
    const items = bank.filter(item => item.skillId === skill.id && !item.retentionOnly && !item.retiredFromNewPractice && item.literacyAudioReady !== false);
    const demands = items.map(literacyQuestionDemand);
    return [skill.id, { minimum: Math.min(...demands), maximum: Math.max(...demands),
      counts: Object.fromEntries([...new Set(demands)].sort((a,b)=>a-b).map(demand=>[demand,demands.filter(value=>value===demand).length])) }];
  }).sort(([a],[b])=>a.localeCompare(b)));
}
const output = JSON.stringify(literacyPracticeRoutingInventory(await loadLiteracyPracticeBank()), null, 2)+'\n';
const destination = new URL('../src/data/generated/literacyPracticeRouting.generated.json', import.meta.url);
if (process.argv.includes('--write')) fs.writeFileSync(destination, output);
else if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) throw new Error('Public literacy routing inventory is stale. Run node tools/generateLiteracyPracticeRouting.mjs --write.');
console.log(`Public literacy routing inventory: ${LITERACY_PRACTICE_SKILLS.length} skills; ${Buffer.byteLength(output)} bytes.`);
