// Uses the existing project's Leda speech service for exact narrative text.
// Pure phonemes remain unchanged in the previously selected recorded bank.
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile, access, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CYCLE_WORD_BUILD_INVENTORY } from '../../../src/data/cycleWordBuildInventory.js';
import { getLedaWordAudioPath } from '../../../src/data/ledaProductionAudio.js';
import { CHAPTER_WORDS, NARRATION, CHAPTER_AUDIO, pictureFor } from '../src/chapter/content.js';
import { probeSoundSeekersAudio } from '../../../tools/checkSoundSeekersSceneAudio.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const demo = fileURLToPath(new URL('../', import.meta.url));
const manifestFile = path.join(demo, 'source/chapter-media-provenance.json');
const generate = process.argv.includes('--generate');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = async file => access(file).then(() => true, () => false);
const previous = await readFile(manifestFile, 'utf8').then(JSON.parse, () => ({ assets: [] }));
const original = JSON.parse(await readFile(path.join(demo, 'source/audio-provenance.json'), 'utf8'));
const records = new Map(previous.assets.map(a => [a.id, a]));
const selected = new Map(CYCLE_WORD_BUILD_INVENTORY.map(row => [row.word, row]));
const assets = [];
await mkdir(path.join(demo, 'assets/audio/chapter'), { recursive: true });

for (const word of CHAPTER_WORDS) {
  for (const role of ['picture', 'word']) {
    const target = path.join(demo, role === 'picture' ? pictureFor(word).slice(1) : CHAPTER_AUDIO['word:' + word].slice(1));
    const row = selected.get(word);
    let source = original.assets.find(a => a.destination === path.relative(demo, target))?.source;
    if (!source && row) source = path.join('public', (role === 'picture' ? row.image : getLedaWordAudioPath(word)).slice(1));
    if (!(await exists(target))) {
      if (!row) throw new Error('No current source authority for ' + word);
      source = path.join('public', (role === 'picture' ? row.image : getLedaWordAudioPath(word)).slice(1));
      await copyFile(path.join(root, source), target);
    } else source = records.get(role + ':' + word)?.source || source;
    if (!source) throw new Error('No source provenance for ' + word);
    const bytes = await readFile(target);
    assets.push({ id: role + ':' + word, role, word, source, path: path.relative(demo, target),
      sourceAuthority: role === 'picture' ? 'src/data/cycleWordBuildInventory.js' : 'src/data/ledaProductionAudio.js',
      sha256: sha(bytes), bytes: bytes.length,
      ...(role === 'word' ? { signal: probeBankWord(target) } : {}),
    });
  }
}
let token = null;
const scripts = Object.entries(NARRATION);
let cursor = 0;
let manifestWrite = Promise.resolve();
function probeBankWord(file) {
  const data = JSON.parse(execFileSync('ffprobe', ['-v','error','-show_entries','stream=codec_name,sample_rate,channels:format=duration','-of','json',file], {encoding:'utf8'}));
  const pcm = execFileSync('ffmpeg', ['-v','error','-i',file,'-f','f32le','-ac','1','-ar','24000','-'], {maxBuffer:10000000});
  let peak = 0, squares = 0;
  for (let i = 0; i < pcm.length; i += 4) { const n = pcm.readFloatLE(i); peak = Math.max(peak, Math.abs(n)); squares += n*n; }
  const rmsDb = 20 * Math.log10(Math.sqrt(squares / (pcm.length / 4)));
  if (!(peak > .01 && peak < 1 && rmsDb > -70 && Number(data.format.duration) > .15)) throw new Error('Invalid word audio: ' + file);
  return {...data.streams[0],durationSeconds:Number(data.format.duration),peak,rmsDb,decoded:true};
}
async function worker() {
  while (cursor < scripts.length) {
    const [id, text] = scripts[cursor++];
    const target = path.join(demo, 'assets/audio/chapter/' + id + '.mp3');
    const old = records.get(id);
    if (old?.text === text && await exists(target) && sha(await readFile(target)) === old.sha256) {
      assets.push(old); continue;
    }
    if (!generate) throw new Error('Recorded chapter speech is missing or changed: ' + id);
    if (!token) token = execFileSync('gcloud', ['auth','application-default','print-access-token'],
      { encoding:'utf8', stdio:['ignore','pipe','ignore'] }).trim();
    let bytes;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method:'POST', signal:AbortSignal.timeout(45000),
        headers: { 'Content-Type':'application/json', Authorization:'Bearer ' + token,
          'x-goog-user-project':process.env.GOOGLE_CLOUD_PROJECT || 'project-3c66c1c8-cc9e-4d6d-bdf' },
        body:JSON.stringify({input:{text},voice:{languageCode:'en-US',name:'en-US-Chirp3-HD-Leda'},
          audioConfig:{audioEncoding:'MP3',speakingRate:.94,pitch:0}}),
      });
      if (response.ok) {
        const result = await response.json();
        if (!result.audioContent) throw new Error('No audio for ' + id);
        bytes = Buffer.from(result.audioContent,'base64'); break;
      }
      if (attempt === 2 || response.status < 429) throw new Error('Speech status ' + response.status + ' for ' + id);
      await new Promise(resolve => setTimeout(resolve,1000 * (attempt + 1)));
    }
    const temp = target + '.pending.mp3';
    execFileSync('ffmpeg', ['-v','error','-y','-i','pipe:0','-ar','44100','-ac','1','-b:a','128k',temp], {input:bytes});
    bytes = await readFile(temp);
    const signal = probeSoundSeekersAudio(temp);
    if (!(signal.durationSeconds > 0)) { await unlink(temp); throw new Error('Empty speech for ' + id); }
    await rename(temp,target);
    const record = { id, role:'narration',text,path:path.relative(demo,target),
      sha256:sha(bytes),bytes:bytes.length,voice:'en-US-Chirp3-HD-Leda',
      sourceAuthority:'tools/generateSoundSeekersCampaignAudio.mjs production configuration',
      generatedAt:new Date().toISOString(),signal };
    assets.push(record);
    // Save after each completed clip, so an interruption never discards provenance.
    records.set(id,record);
    manifestWrite = manifestWrite.then(() => writeFile(manifestFile,JSON.stringify({schemaVersion:1,assets:[...records.values()]},null,2)+'\n'));
    await manifestWrite;
    process.stdout.write('Recorded ' + id + '\n');
  }
}
await Promise.all([worker(),worker()]);
await writeFile(manifestFile,JSON.stringify({
  schemaVersion:1,title:'The Lost Little Lights chapter one media',
  disclosure:'New narrative speech is AI-generated with the existing Leda service. Phonemes and selected whole words retain their recorded-bank provenance.',
  evidenceBoundary:'Signal checks are mechanical evidence. Visual and listening findings are recorded separately; no human listening or physical device approval is inferred.',
  assets:assets.sort((a,b)=>a.id.localeCompare(b.id)),
},null,2)+'\n');
process.stdout.write('Chapter media complete: ' + assets.length + ' records.\n');
