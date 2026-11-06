let element;
let owner;
let primerUrl;

// Claim Safari's media-element permission synchronously in the speaker tap,
// before fetching/decoding the question. This tiny silent clip is never a cue
// and never produces a delivery receipt.
export function primeMockAudioElement(audio) {
  if (!primerUrl) primerUrl = URL.createObjectURL(new Blob([Uint8Array.from(atob('UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'), character => character.charCodeAt(0))], { type: 'audio/wav' }));
  audio.src = `${primerUrl}#mock-audio-unlock`;
  audio.play().catch(() => {});
}

// Safari grants playback permission to a media element. Keep the sound-check
// element through tutorials, questions and clips rather than losing that grant.
export function getMockAudioElement(interrupt) {
  if (owner && owner !== interrupt) owner();
  owner = interrupt;
  if (!element) {
    element = new Audio();
    element.preload = 'auto';
    element.playsInline = true;
  }
  return element;
}
