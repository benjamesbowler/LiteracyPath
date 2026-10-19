let element;
let owner;

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
