import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export function assessmentLedaDeliveryBitrate(durationSeconds, bitrate, maxBytes) {
  if (maxBytes == null) return bitrate;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0
    || !Number.isSafeInteger(maxBytes) || maxBytes <= 4096 || !/^\d+k$/.test(bitrate)) {
    throw new Error('Invalid assessment audio delivery budget');
  }
  const requested = Number.parseInt(bitrate, 10);
  // Reserve space for complete MP3 frames and metadata. Never shorten the
  // recording, raise its requested bitrate, or go below established 48k speech.
  const rate = [320, 256, 224, 192, 160, 128, 112, 96, 80, 64, 56, 48]
    .find(candidate => candidate <= requested && Math.ceil(durationSeconds * candidate * 125) + 4096 <= maxBytes);
  if (!rate) throw new Error('Complete assessment speech cannot fit the delivery budget at 48k or better');
  return `${rate}k`;
}

export function normalizeAssessmentLedaMp3(inputPath, outputPath, { startSeconds = 0, bitrate = '128k', maxBytes } = {}) {
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
  const deliveryBitrate = assessmentLedaDeliveryBitrate(duration - startSeconds, bitrate, maxBytes);
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
    '-af', filter, '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', deliveryBitrate, outputPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'ffmpeg normalization failed');
  if (maxBytes != null && fs.statSync(outputPath).size > maxBytes) throw new Error('Encoded assessment audio exceeds its delivery budget');
}
