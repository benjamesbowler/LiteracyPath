import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { prepareAssessmentLedaRetirement, assessmentLedaMapSource, parseAssessmentLedaMapSource } from './assessmentLedaRetirement.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

/** Local-only retirement. No provider, credentials, synthesis, or generic pruning. */
export async function retireAssessmentLedaGaps({ root, voice, worklistPath, dryRun }) {
  const mapRelative = 'src/data/generated/assessmentLedaGaps.generated.js';
  const mapPath = path.join(root, mapRelative);
  const wordMapRelative = 'src/data/generated/ledaWordAudio.generated.js';
  const wordMapPath = path.join(root, wordMapRelative);
  const wordMapBytes = await fs.readFile(wordMapPath);
  const evidenceDir = path.dirname(path.resolve(worklistPath));
  if (!evidenceDir.startsWith(path.join(root, '.artifacts') + path.sep)) throw new Error('Retirement evidence must live in this repository’s ignored .artifacts directory.');
  const worklist = JSON.parse(await fs.readFile(worklistPath, 'utf8'));
  const mapBytes = await fs.readFile(mapPath);
  const map = parseAssessmentLedaMapSource(mapBytes);
  const { ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE: cachedMap } = await import(mapPath);
  if (JSON.stringify(cachedMap) !== JSON.stringify(map)) throw new Error('Cached audio map differs from reviewed bytes; restart retirement.');
  const targets = new Set((worklist.records || []).map(row => row.publicPath));
  const references = [];
  const add = (value, source) => {
    if (typeof value === 'string' && targets.has(value.split(/[?#]/)[0])) references.push({ path:value, source });
  };
  const inspect = (value, source) => {
    if (typeof value === 'string') add(value, source);
    else if (Array.isArray(value)) value.forEach(child => inspect(child, source));
    else if (value && typeof value === 'object') Object.values(value).forEach(child => inspect(child, source));
  };

  // Literal paths include published SQL, immutable banks, games, books, test and
  // operational references. Only this exact map is being replaced; QC is kept.
  const files = execFileSync('rg', ['--files', 'src', 'public', 'tests', 'tools', 'docs', 'supabase'], { cwd:root, encoding:'utf8', maxBuffer:32 * 1024 * 1024 })
    .trim().split('\n').filter(file => file !== mapRelative && /\.(?:[cm]?[jt]sx?|json|sql|md|html|txt|ya?ml)$/.test(file));
  const sourceHashes = [];
  for (const file of files) {
    const bytes = await fs.readFile(path.join(root, file));
    const text = bytes.toString('utf8');
    sourceHashes.push({ path:file, sha256:digest(bytes) });
    // The compact lookup is regenerated from the canonical map in this same
    // operation. Every other literal reference, including frozen SQL, blocks.
    if (file !== wordMapRelative) for (const target of targets) if (text.includes(target)) references.push({ path:target, source:file });
  }

  // Resolve the same active audio surfaces as the complete audibility gate;
  // preserve frozen v1/v2 media too. This catches paths assembled at runtime.
  const { getLedaProductionAudioPath, getLedaWordAudioPath } = await import('../src/data/ledaProductionAudio.js');
  const { normalizeSpokenCloze } = await import('../src/utils/assessmentSpokenText.js');
  const { importV3Bank, listV3PublishedSkillIds } = await import('../src/data/v3/v3Registry.js');
  for (const skill of listV3PublishedSkillIds()) {
    const items = await importV3Bank(skill);
    inspect(items, `published-assessment:${skill}`);
    for (const item of items) {
      const texts = [normalizeSpokenCloze(item.spokenPrompt || item.prompt), item.sentence ? normalizeSpokenCloze(item.sentence) : '',
        item.passage, ...(item.imageCards || []).map(card => card.word), ...(item.choices || []),
        !item.suppressStimulusAudio && item.targetWord && !/[/_]/.test(item.targetWord) ? item.targetWord : ''];
      for (const text of texts) if (typeof text === 'string' && text) add(getLedaProductionAudioPath(text), `published-assessment:${skill}:${item.id}`);
      // Word playback honors child-word overrides before the generic lookup.
      // Keep both paths when a surface still uses the older generic resolver.
      for (const word of [...(item.imageCards || []).map(card => card.word), ...(item.choices || []),
        !item.suppressStimulusAudio && item.targetWord && !/[/_]/.test(item.targetWord) ? item.targetWord : '']) {
        if (typeof word === 'string' && word) add(getLedaWordAudioPath(word), `published-assessment-word:${skill}:${item.id}`);
      }
    }
  }
  const { loadLiteracyMockBank, LITERACY_MOCK_VERSIONS } = await import('../src/data/literacyMockBank.js');
  for (const contentVersion of LITERACY_MOCK_VERSIONS) inspect(await loadLiteracyMockBank({ includeUnavailable:true, contentVersion }), contentVersion);
  const { PROGRESS_BANK } = await import('../src/content/assessments/v3/progressBank.generated.js');
  const { PROGRESS_CHECK_INSTRUCTIONS } = await import('../src/data/progressCheckInstructions.js');
  const { progressAudioCues, progressCheckAudioPath } = await import('../src/utils/progressCheckAudio.js');
  inspect(PROGRESS_BANK.items.flatMap(progressAudioCues), 'progress-check');
  Object.values(PROGRESS_CHECK_INSTRUCTIONS).forEach(text => add(progressCheckAudioPath(text), 'progress-instruction'));
  const { loadLiteracyPracticeExtensions } = await import('../src/data/literacyPracticeExtensions.js');
  const { literacyPracticeRequiredAudioCues } = await import('./lib/literacyPracticeContracts.mjs');
  inspect(literacyPracticeRequiredAudioCues(await loadLiteracyPracticeExtensions()), 'literacy-practice');
  const { loadLiteracyReferenceBank } = await import('../src/data/literacyReferenceBank.js');
  inspect(loadLiteracyReferenceBank(), 'literacy-reference');
  const { loadLiteracyInteractionBank } = await import('../src/data/literacyInteractionBank.js');
  inspect(await loadLiteracyInteractionBank(), 'literacy-interaction');

  const prepared = await prepareAssessmentLedaRetirement(worklist, { map, mapBytes, references,
    readAudio:publicPath => fs.readFile(path.join(root, 'public', publicPath.slice(1))), });
  const after = assessmentLedaMapSource(prepared.nextMap, voice);
  const receipt = { checkedAt:new Date().toISOString(), scope:worklist.scope, dryRun,
    mapBeforeSha256:digest(mapBytes), mapAfterSha256:digest(after), checkedSourceFiles:sourceHashes.length,
    wordMapBeforeSha256:digest(wordMapBytes), wordMapGenerator:'tools/generateLedaWordLookup.mjs',
    runtimeSurfaces:['published-assessment','literacy-mock-v1','literacy-mock-v2','literacy-mock-v3','progress-check','literacy-practice','literacy-reference','literacy-interaction'],
    references, records:prepared.records.map(({ bytes, ...record }) => ({ ...record, bytes:bytes.length })),
    synthesisRequestsSent:0, sourceHashes };
  if (!dryRun) {
    // Fail closed on concurrent source or map changes. Back up exact bytes before
    // the single atomic map replacement; never remove a referenced file first.
    for (const source of sourceHashes) if (digest(await fs.readFile(path.join(root, source.path))) !== source.sha256) throw new Error(`Source changed during retirement: ${source.path}`);
    if (digest(await fs.readFile(mapPath)) !== worklist.expectedMapSha256) throw new Error('Audio map changed during retirement.');
    if (digest(await fs.readFile(wordMapPath)) !== digest(wordMapBytes)) throw new Error('Compact word map changed during retirement.');
    const originalDir = path.join(evidenceDir, 'original');
    await fs.mkdir(originalDir, { recursive:true });
    await fs.writeFile(path.join(originalDir, 'assessmentLedaGaps.before.js'), mapBytes, { flag:'wx' });
    await fs.writeFile(path.join(originalDir, 'ledaWordAudio.before.js'), wordMapBytes, { flag:'wx' });
    for (const record of prepared.records) await fs.writeFile(path.join(originalDir, path.basename(record.publicPath)), record.bytes, { flag:'wx' });
    await fs.writeFile(path.join(evidenceDir, 'retirement-receipt.json'), JSON.stringify({ ...receipt,
      status:'recovery-saved-before-mutation', originalDirectory:originalDir }, null, 2) + '\n', { flag:'wx' });
    const temporary = `${mapPath}.${process.pid}.retirement.tmp`;
    await fs.writeFile(temporary, after, { flag:'wx' });
    await fs.rename(temporary, mapPath);
    execFileSync(process.execPath, ['tools/generateLedaWordLookup.mjs'], { cwd:root, stdio:'pipe' });
    const rebuiltWordMap = await fs.readFile(wordMapPath);
    if ([...targets].some(target => rebuiltWordMap.toString('utf8').includes(target))) throw new Error('Canonical word lookup still references retired audio; preserved public files.');
    receipt.wordMapAfterSha256 = digest(rebuiltWordMap);
    for (const record of prepared.records) {
      const file = path.join(root, 'public', record.publicPath.slice(1));
      if (digest(await fs.readFile(file)) !== record.sha256) throw new Error(`Audio changed after map retirement; preserved public file: ${record.publicPath}`);
      await fs.unlink(file);
    }
  }
  await fs.writeFile(path.join(evidenceDir, dryRun ? 'retirement-preflight.json' : 'retirement-receipt.json'), JSON.stringify({ ...receipt,
    status:dryRun ? 'preflight-passed' : 'complete' }, null, 2) + '\n');
  console.log(`Exact audio retirement ${dryRun ? 'preflight' : 'complete'}: ${prepared.records.length} unused bindings; no synthesis requests.`);
}
