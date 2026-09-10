// Use one recorded sentence when available; otherwise blend its recorded
// words in order. The same abort signal owns the complete phrase.
export async function speakSoundBeatSentence(item, options, { hasRecordedSpeech, speak, speakWord }) {
  if (options.signal?.aborted) return;
  if (hasRecordedSpeech(item.say)) return speak(item.say, options);
  for (const word of item.beats) {
    if (options.signal?.aborted) return;
    await speakWord(word, options);
  }
}
