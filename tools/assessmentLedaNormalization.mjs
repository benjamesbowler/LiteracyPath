import { spawnSync } from 'node:child_process';

export function normalizeAssessmentLedaMp3(inputPath, outputPath, { startSeconds = 0, bitrate = '128k' } = {}) {
  const probe = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=duration_ts,time_base', '-of', 'json', inputPath,
  ], { encoding: 'utf8' });
  const stream = probe.status === 0 ? JSON.parse(probe.stdout)?.streams?.[0] : null;
  const [numerator, denominator] = String(stream?.time_base).split('/').map(Number);
  const ticks = Number(stream?.duration_ts);
  const duration = ticks * numerator / denominator;
  if (probe.status !== 0 || !Number.isFinite(duration) || duration <= 0) {
    throw new Error(probe.stderr || 'Cannot determine assessment audio duration');
  }
  // BS.1770 integrated loudness needs a complete 400 ms block. Without one,
  // loudnorm can leave a very short spoken word at the provider's loud level.
  // Apply the existing fades to the original word edges, pad for measurement,
  // then remove exactly the added silence. Measuring after the fades also
  // avoids their proportionally larger energy change in very short words.
  const short = duration < 0.4;
  const onset = startSeconds > 0 ? `atrim=start=${startSeconds.toFixed(4)},asetpts=PTS-STARTPTS,` : '';
  const fades = 'afade=t=in:st=0:d=0.015,areverse,afade=t=in:st=0:d=0.025,areverse';
  const filter = short
    ? `highpass=f=60,${onset}${fades},apad=whole_dur=0.4,loudnorm=I=-24:TP=-2:LRA=7,aresample=44100,atrim=end_sample=${Math.round(ticks * numerator * 44100 / denominator - startSeconds * 44100)}`
    : `highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,${onset}${fades}`;
  const result = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', inputPath,
    '-af', filter, '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', bitrate, outputPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'ffmpeg normalization failed');
}
