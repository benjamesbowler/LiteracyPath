// Exact public scene semantics select committed painted question images.
// No answer key, label parsing, primitive painter or generic media fallback.
export const CAMPAIGN_QUESTION_ART_SIZE = Object.freeze({ width: 480, height: 400 });

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, ordered(value[key])]));
  return value;
}

export function campaignQuestionArtSignature(descriptor) {
  return JSON.stringify(ordered({
    kind: descriptor.kind, appearance: descriptor.appearance || {},
    residentId: descriptor.residentId || '', carriedKind: descriptor.carriedKind || '',
    destination: Boolean(descriptor.destination)
  }));
}

export function campaignQuestionImage(descriptor) {
  if (!descriptor?.kind) return '';
  const signature = campaignQuestionArtSignature(descriptor);
  let first = 2166136261, second = 5381;
  for (let i = 0; i < signature.length; i++) {
    first = Math.imul(first ^ signature.charCodeAt(i), 16777619);
    second = Math.imul(second, 33) ^ signature.charCodeAt(i);
  }
  return `/images/sound-seekers/questions/${descriptor.kind}-${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}.webp`;
}
