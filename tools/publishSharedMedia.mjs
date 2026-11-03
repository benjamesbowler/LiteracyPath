import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { COHORTS, STATIC_HEADERS } from '../infra/shared-media/protocol.mjs';
import { planSharedMedia, stageSharedMedia, verifyPublishedMedia } from './lib/sharedMediaPublisher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = await planSharedMedia({ distRoot: path.join(root, 'dist'), publicRoot: path.join(root, 'public') });
const summary = { files: plan.files.length, bytes: plan.bytes, local: plan.retained,
  cohorts: Object.fromEntries(COHORTS.map(cohort => [cohort, { files: plan.cohorts[cohort].files.length, bytes: plan.cohorts[cohort].bytes }])) };
console.log('[free static media]', JSON.stringify(summary));

const verifyOnly = process.argv.includes('--verify-only');
if (process.argv.includes('--publish') || verifyOnly) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!verifyOnly && !/^[a-f0-9]{32}$/.test(account || '')) throw new Error('CLOUDFLARE_ACCOUNT_ID is required; no deployment performed');
  const reports = path.join(root, '.artifacts/shared-media-free');
  await fs.mkdir(reports, { recursive: true });
  const resume = process.argv.find(value => value.startsWith('--resume='))?.slice('--resume='.length);
  if (verifyOnly && !resume) throw new Error('Verification-only requires an existing publication staging directory');
  const staging = resume ? await fs.realpath(resume) : path.join(reports, `publish-${Date.now()}`);
  if (resume) {
    if (path.dirname(staging) !== await fs.realpath(reports) || !/^publish-\d+$/.test(path.basename(staging))) throw new Error('Invalid publication staging directory');
    for (const cohort of COHORTS) {
      const body = await fs.readFile(path.join(staging, cohort, 'assets/_shared-media/manifest.json'), 'utf8');
      if (body !== plan.cohorts[cohort].body) throw new Error('Staging differs from current build; do not resume');
      await fs.writeFile(path.join(staging, cohort, 'assets/_headers'), STATIC_HEADERS);
    }
  } else await stageSharedMedia(plan, staging);
  const receipt = verifyOnly ? JSON.parse(await fs.readFile(path.join(staging, 'candidate.json'), 'utf8'))
    : { schemaVersion: 2, provider: 'cloudflare-static-free', enabled: true, cohorts: {} };
  for (const cohort of verifyOnly ? [] : COHORTS) {
    const name = `literacy-media-${cohort}`;
    // Assets-only deployments never enable an R2, KV, D1 or paid compute service.
    const config = { name, account_id: account, compatibility_date: '2026-11-03',
      workers_dev: true, preview_urls: true, observability: { enabled: false },
      assets: { directory: path.join(staging, cohort, 'assets'), html_handling: 'none', not_found_handling: 'none' } };
    const configPath = path.join(staging, cohort, 'wrangler.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    const log = await new Promise((resolve, reject) => {
      let output = '';
      const child = spawn(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), 'deploy', '--config', configPath], {
        cwd: root, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe']
      });
      for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes; process.stdout.write(bytes); });
      child.once('error', reject);
      child.once('close', code => code === 0 ? resolve(output) : reject(new Error(`Static ${cohort} deployment failed; existing site unchanged`)));
    });
    await fs.writeFile(path.join(staging, cohort, 'deploy.log'), log);
    const version = /(?:Current Version ID|Version ID):\s*([a-f0-9-]{36})/i.exec(log)?.[1];
    const hostname = new RegExp(`https://(${name}\\.[a-z0-9-]+\\.workers\\.dev)`).exec(log)?.[1];
    if (!version || !hostname) throw new Error('Cannot pin immutable static version; site configuration unchanged');
    receipt.cohorts[cohort] = { origin: `https://${version.slice(0, 8)}-${hostname}`,
      manifestSha256: plan.cohorts[cohort].manifestSha256, files: plan.cohorts[cohort].files.length,
      bytes: plan.cohorts[cohort].bytes };
    await fs.writeFile(path.join(staging, 'candidate.json'), JSON.stringify(receipt, null, 2));
  }
  const verification = await verifyPublishedMedia(plan, receipt, { concurrency: 64,
    onProgress: row => console.log('[served bytes]', JSON.stringify(row)) });
  await fs.writeFile(path.join(reports, 'verified-candidate.json'), JSON.stringify(receipt, null, 2));
  await fs.writeFile(path.join(reports, 'verification.json'), JSON.stringify({ ...summary, ...verification, staging }, null, 2));
  console.log(`Verified every served file. Candidate: ${path.join(reports, 'verified-candidate.json')}. Review and test this pinned receipt before activating it in config/shared-media-release.json.`);
} else if (!process.argv.includes('--plan')) {
  throw new Error('Choose --plan or --publish. This tool never activates paid storage.');
}
