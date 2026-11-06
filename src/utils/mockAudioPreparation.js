// Keep only the outer silence. Quiet consonants and pauses inside speech stay
// intact; a small guard protects the beginning and end of each spoken sound.
export function mockSpeechBounds(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const audible = i => channels.some(channel => Math.abs(channel[i]) > 0.001); // -60 dB
  let first = 0, last = buffer.length - 1;
  while (first < buffer.length && !audible(first)) first++;
  if (first === buffer.length) throw new Error('Recording contains no audible sound');
  while (last > first && !audible(last)) last--;
  return { start: Math.max(0, first - Math.ceil(buffer.sampleRate * 0.015)),
    end: Math.min(buffer.length, last + 1 + Math.ceil(buffer.sampleRate * 0.03)) };
}

export function mockSpeechWav(buffer) {
  const { start, end } = mockSpeechBounds(buffer);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const frameSize = channels.length * 2, size = (end - start) * frameSize;
  const bytes = new ArrayBuffer(44 + size), view = new DataView(bytes);
  const label = (offset, text) => [...text].forEach((letter, i) => view.setUint8(offset + i, letter.charCodeAt(0)));
  label(0, 'RIFF'); view.setUint32(4, 36 + size, true); label(8, 'WAVE'); label(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels.length, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * frameSize, true);
  view.setUint16(32, frameSize, true); view.setUint16(34, 16, true); label(36, 'data'); view.setUint32(40, size, true);
  let offset = 44;
  for (let i = start; i < end; i++) for (const channel of channels) {
    const sample = Math.max(-1, Math.min(1, channel[i]));
    view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true); offset += 2;
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

// Prepare the whole current question before narration starts, so network or
// decoding time cannot become an extra gap between its answer options. Keep
// the original cue paths for delivery receipts and offline-media resolution.
export function prepareMockAudio(cues, resolveMedia) {
  const controller = new AbortController(), urls = [];
  const decoder = new OfflineAudioContext(1, 1, 48000);
  const ready = Promise.all([...new Set(cues.map(cue => cue.path))].map(async path => {
    try {
      if (!path) throw new Error('Missing recording');
      const retained = resolveMedia?.readBlob?.(path);
      let bytes;
      if (retained) bytes = await retained.arrayBuffer();
      else {
        const response = await fetch(resolveMedia ? resolveMedia(path) : path, { signal: controller.signal });
        if (!response.ok) throw new Error(`Recording HTTP ${response.status}`);
        bytes = await response.arrayBuffer();
      }
      const buffer = await decoder.decodeAudioData(bytes);
      if (controller.signal.aborted) throw new Error('Cancelled');
      const url = URL.createObjectURL(mockSpeechWav(buffer)); urls.push(url);
      // The fragment retains source identity for media diagnostics only.
      return [path, { src: `${url}#${encodeURIComponent(path)}` }];
    } catch (error) { return [path, { error }]; }
  })).then(entries => new Map(entries));
  return { ready, dispose() { controller.abort(); urls.splice(0).forEach(url => URL.revokeObjectURL(url)); } };
}
