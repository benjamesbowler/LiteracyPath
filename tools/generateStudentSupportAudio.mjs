import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CHILD_READING_PURPOSE_COPY } from '../src/policy/literacyExperiencePolicy.js';
import { LETTER_PRACTICE_RECOMMENDATION_COPY } from '../src/policy/letterPracticeRecommendation.js';
import { HOLLOW_NEXT_ACTION_COPY } from '../src/policy/hollowNextActionPolicy.js';
import { PROJECTS } from '../demos/sound-seekers/src/chapter/content.js';
import { homeHeroInstruction, STUDENT_HOME_COPY } from '../src/copy/studentNavigationCopy.js';
import { LEDA_PRODUCTION_VOICE } from '../src/data/ledaProductionVoice.js';
import { normalizeLedaAudioText } from '../src/data/normalizeLedaAudioText.js';
import { GAME_LIST } from '../src/data/learnGamesData.js';
import { arcadeRecommendationAudioTexts } from '../src/components/learn/games/arcadeRecommendation.js';
import { PRESENT_AIR_WRITING_READY_COPY } from '../src/copy/presentLearningCopy.js';
import { ARCADE_GUIDE_EXAMPLES } from '../src/components/learn/games/shared/arcadeGuideExamples.js';

const texts = [...new Set([
  PRESENT_AIR_WRITING_READY_COPY,
  'Skate through each sound part in order to build the word.',
  'Press the sound keys in order to build the word.',
  'Climb up, then jump to a word that starts with the sound.',
  ...['drum-trail', 'lantern-lagoon'].map(id => ARCADE_GUIDE_EXAMPLES[id].instruction),
  ...arcadeRecommendationAudioTexts(GAME_LIST),
  ...Object.values(CHILD_READING_PURPOSE_COPY), ...Object.values(LETTER_PRACTICE_RECOMMENDATION_COPY),
  ...Object.values(HOLLOW_NEXT_ACTION_COPY), ...PROJECTS.flatMap(project => project.acts.map(act => act.title)),
  'The woodland is ready for the Pals.', STUDENT_HOME_COPY.explore,
  STUDENT_HOME_COPY.unreadableProgress, STUDENT_HOME_COPY.phonicsStop, STUDENT_HOME_COPY.storiesStop,
  STUDENT_HOME_COPY.hollowStop, ...[undefined, {label:'Continue'}, {label:'Teacher picked'}].map(homeHeroInstruction)
])];
const voice = LEDA_PRODUCTION_VOICE;
const verify = process.argv.includes('--verify');
const dryRun = process.argv.includes('--dry-run');
const onlyTextIndex = process.argv.indexOf('--only-text');
const onlyText = onlyTextIndex < 0 ? null : process.argv[onlyTextIndex + 1];
if (onlyTextIndex >= 0 && !onlyText) throw new Error('--only-text requires the exact authored instruction');
const root = path.resolve(import.meta.dirname, '..');
const rows = texts.map(text => {
  const id = createHash('sha256').update(`${voice}|instruction|${text}|student-support-v1`).digest('hex').slice(0, 12);
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
  const audio = `/audio/production/en-US/instruction/${slug}-${id}.mp3`;
  return {text, audio, target:path.join(root,'public',audio)};
});
const missing = [];
for (const row of rows) if (!(await fs.stat(row.target).catch(()=>null))?.size) missing.push(row);
if (onlyText && (!texts.includes(onlyText) || missing.some(row => row.text !== onlyText))) throw new Error('Requested instruction is not authored, or other missing recordings would exceed the requested scope');
if (dryRun) {
  console.log(JSON.stringify({ voice, totalClips: rows.length, missing: missing.map(({ text, audio }) => ({ text, audio })) }, null, 2));
  process.exit(0);
}
if (verify && missing.length) throw new Error(`${missing.length} student support recordings missing`);
const token = missing.length ? execFileSync('gcloud',['auth','application-default','print-access-token'],{encoding:'utf8'}).trim() : '';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(),'student-support-audio-'));
const metadata = {}, lookup = {};
try {
  for (const [index,row] of rows.entries()) {
    if (missing.includes(row)) {
      let encoded;
      for (let attempt=0;attempt<3;attempt++) {
        const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
          method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','x-goog-user-project':process.env.GOOGLE_CLOUD_PROJECT || 'project-3c66c1c8-cc9e-4d6d-bdf'},
          body:JSON.stringify({input:{text:row.text},voice:{languageCode:'en-US',name:voice},audioConfig:{audioEncoding:'LINEAR16',sampleRateHertz:24000,speakingRate:0.94}})
        });
        if (response.ok) { encoded=(await response.json()).audioContent;break; }
        if (![429,500,502,503,504].includes(response.status) || attempt===2) throw new Error(`Student support speech generation failed HTTP ${response.status}`);
        await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));
      }
      if (!encoded) throw new Error('Student support speech generation returned no audio');
      const wav=path.join(temporary,`${index}.wav`);await fs.writeFile(wav,Buffer.from(encoded,'base64'));
      const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',wav],{encoding:'utf8'}).trim());
      await fs.mkdir(path.dirname(row.target),{recursive:true});
      const result=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',wav,'-af',`highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=${Math.max(0,duration-0.025)}:d=0.025`,'-ar','44100','-ac','1','-codec:a','libmp3lame','-b:a','128k',row.target],{encoding:'utf8'});
      if (result.status!==0) throw new Error('Student support normalization failed');
      console.log(`Generated ${row.text}`);
    }
    const decoded=spawnSync('ffmpeg',['-hide_banner','-nostats','-i',row.target,'-af','volumedetect','-f','null','-'],{encoding:'utf8'});
    const peak=Number(decoded.stderr.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1]);
    const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',row.target],{encoding:'utf8'}).trim());
    if (decoded.status!==0 || !Number.isFinite(peak) || peak<=-40 || !Number.isFinite(duration) || duration<=0) throw new Error(`Invalid student support clip: ${row.text}`);
    const normalized=normalizeLedaAudioText(row.text);lookup[normalized]=row.audio;
    metadata[normalized]={text:row.text,audio:row.audio,voice,provider:'Google Cloud Text-to-Speech',aiGenerated:true,sha256:createHash('sha256').update(await fs.readFile(row.target)).digest('hex'),durationSeconds:duration,humanListening:'unknown'};
  }
} finally { await fs.rm(temporary,{recursive:true,force:true}); }
const output=path.join(root,'src/data/generated/studentSupportAudio.generated.js');
const source=`// Generated by tools/generateStudentSupportAudio.mjs. Do not edit.\nexport const STUDENT_SUPPORT_AUDIO = Object.freeze(${JSON.stringify(lookup,null,2)});\nexport const STUDENT_SUPPORT_AUDIO_METADATA = Object.freeze(${JSON.stringify(metadata,null,2)});\n`;
if (verify) { if (await fs.readFile(output,'utf8')!==source) throw new Error('Student support manifest stale'); }
else await fs.writeFile(output,source);
console.log(`Student support audio: ${rows.length} clips decoded; ${missing.length} new recordings.`);
