const PHONEMES: Record<string, string> = {
  a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff',
  g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll',
  m: 'mmm', n: 'nnn', o: 'oh', p: 'puh', q: 'kwuh', r: 'rrr',
  s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks',
  y: 'yuh', z: 'zzz',
};

function getPreferredVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith('en-GB') &&
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google uk english female'))
  );
  return preferred || voices.find((v) => v.lang.startsWith('en'));
}

export function speak(text: string, options?: { rate?: number; pitch?: number }): void {
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = options?.rate ?? 0.7;
    utterance.pitch = options?.pitch ?? 1.1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis not available
  }
}

export function speakPhoneme(letter: string): void {
  const phoneme = PHONEMES[letter.toLowerCase()] || letter.toLowerCase();
  speak(phoneme, { rate: 0.6, pitch: 1.2 });
}

export function cancelSpeech(): void {
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Speech synthesis not available
  }
}
