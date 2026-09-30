import { openingSceneAppearance } from '../v3/content/campaignLanguage.js';

// Presentation only. All decisions still belong to resolveCampaignAction;
// these selectors can operate on publicBeat without an answer key.
export const CAMPAIGN_ACTIVITY_FAMILIES = Object.freeze({
  'sound-steps': { title: 'Sound stones', prop: 'stone', verb: 'Step', success: 'A new step across.' },
  'word-pop': { title: 'Bubble clearing', prop: 'launcher', verb: 'Pop', success: 'The bubble found its mark.' },
  'rescue-bridge': { title: 'Bridge workshop', prop: 'bridge', verb: 'Place', success: 'Another plank fits.' },
  'tree-rescue': { title: 'Tree rescue', prop: 'ladder', verb: 'Climb', success: 'A little closer to the rescue.' },
  'pals-post': { title: 'Pals post', prop: 'parcel', verb: 'Deliver', success: 'The parcel is in place.' },
  'sound-herd': { title: 'Sound baskets', prop: 'basket', verb: 'Send', success: 'Into its sound basket.' },
  'river-route': { title: 'River crossing', prop: 'raft', verb: 'Sail', success: 'Along the river route.' },
  'sentence-express': { title: 'Message train', prop: 'cart', verb: 'Place', success: 'Another word joins the train.' },
  'fix-it-workshop': { title: 'Word workshop', prop: 'tool', verb: 'Fit', success: 'That piece fits.' },
  'garden-kitchen': { title: 'Garden helpers', prop: 'pot', verb: 'Place', success: 'Everything has its place.' },
  'lantern-search': { title: 'Lantern search', prop: 'lantern', verb: 'Find', success: 'The lantern lights the find.' },
  'story-rescue': { title: 'Help a friend', prop: 'scroll', verb: 'Help', success: 'One more part of the rescue.' }
});

export const CAMPAIGN_ACTIVITY_MECHANICS = Object.freeze([
  'sound_signpost', 'echo_hunt', 'word_forge', 'story_bridge', 'sound_sort', 'sentence_build'
]);

export function campaignFamily(beat) {
  return CAMPAIGN_ACTIVITY_FAMILIES[beat?.familyId] || null;
}

export function campaignDisplayChoices(beat, state = {}) {
  const view = beat?.view || {};
  switch (beat?.mechanic) {
    case 'echo_hunt':
      return (view.options || []).map(option => ({
        ...option, label: option.grapheme || option.label || option.word || '',
        action: { type: 'CHOOSE', optionId: option.id }
      }));
    case 'story_bridge':
      return (view.choices || []).map(choice => ({
        ...choice, action: { type: 'CHOOSE', choiceId: choice.id }
      }));
    case 'sound_sort':
      return (view.bins || []).map(bin => ({
        ...bin, label: bin.grapheme || bin.label || bin.soundLabel || '',
        action: { type: 'PLACE', itemId: view.items?.[state.itemIndex || 0]?.id, binId: bin.id }
      }));
    case 'word_forge':
    case 'sentence_build':
      return (view.tiles || []).map(tile => ({
        ...tile, label: tile.grapheme,
        used: (state.placed || []).includes(tile.id),
        action: { type: 'PLACE_TILE', tileId: tile.id }
      }));
    default: return [];
  }
}

export function campaignSlots(beat, state = {}) {
  const view = beat?.view || {};
  if (view.workshop?.mode === 'replace') {
    return (state.wordUnits || view.workshop.baseUnits || []).map((label, index) => ({
      id: `base-${index}`, label, marked: index === view.workshop.slotIndex,
      filled: index !== view.workshop.slotIndex || Boolean(state.done)
    }));
  }
  const placed = state.placed || [];
  return Array.from({ length: view.slots || 0 }, (_, index) => ({
    id: `slot-${index}`, tileId: placed[index] || '',
    label: view.tiles?.find(tile => tile.id === placed[index])?.grapheme || '',
    marked: index === placed.length && !state.done,
    filled: Boolean(placed[index])
  }));
}

export function campaignSceneDescriptor(beat, choice) {
  const object = beat?.view?.sceneObjects?.find(entry => entry.id === choice.icon);
  if (!object) return null;
  const appearance = openingSceneAppearance(object);
  return {
    kind: appearance.kind || object.kind || object.icon || object.id,
    label: object.label || choice.label || '',
    appearance,
    residentId: object.residentId || appearance.residentId || appearance.landmark?.residentId || '',
    carriedKind: beat.view.phase === 'delivery' ? beat.view.objectId || '' : '',
    destination: beat.view.phase === 'delivery'
  };
}

// Delivery choices depict the destination. Older authored packs place its
// shape/size beside the relation; the canonical placement helper reads the
// landmark. Explicit landmark attributes keep their authored precedence.
// Search scenes instead describe the object and must retain that distinction.
export function campaignDestinationAppearance(descriptor) {
  const appearance = descriptor?.appearance || {};
  if (!descriptor?.destination || !appearance.relation || !appearance.landmark) return appearance;
  const hostAttributes = Object.fromEntries(Object.entries(appearance).filter(([key]) => !['relation', 'landmark', 'scenery', 'kind'].includes(key)));
  const host = typeof appearance.landmark === 'string' ? { kind: appearance.landmark } : appearance.landmark;
  return { ...appearance, landmark: { ...hostAttributes, ...host } };
}

// The canonical basket painter uses lengthVariant for horizontal length.
// Retained authored packs also call that attribute sizeVariant: 'long'.
// Translate the explicit attribute, never the spoken label or an answer key.
export function campaignPropAppearance(kind, appearance = {}) {
  const longBasket = kind === 'basket' && appearance.sizeVariant === 'long' && !appearance.lengthVariant;
  let result = longBasket ? { ...appearance, sizeVariant: 'regular', lengthVariant: 'long' } : appearance;
  if (result.landmark && typeof result.landmark === 'object') {
    const landmark = campaignPropAppearance(result.landmark.kind, result.landmark);
    if (landmark !== result.landmark) result = { ...result, landmark };
  }
  return result;
}

export function campaignInstructionText(beat) {
  if (!beat) return '';
  if (beat.mechanic === 'echo_hunt' && beat.view.direction === 'letter-to-sound') {
    return `Hear the choices. Find the sound for ${beat.view.target.grapheme}.`;
  }
  if (beat.view.workshop?.mode === 'replace') return 'Listen. Change the marked part.';
  if (beat.view.workshop?.mode === 'assembly') return 'Listen. Build the word at the workshop.';
  if (beat.mechanic === 'sound_sort') {
    if (beat.view.mode === 'read') return beat.prompt?.text || 'Read the word. Choose its group.';
    return beat.view.mode === 'initial' ? 'Listen. Choose its first sound.' : 'Listen. Choose its sound basket.';
  }
  if (beat.mechanic === 'story_bridge') {
    if (beat.domain === 'auditory_word_recognition') return 'Listen. Find the word.';
    return beat.view.phase === 'pickup' ? 'Listen. Pick up the object.'
      : beat.view.phase === 'delivery' ? 'Listen. Choose where it goes.' : 'Listen. Find the pictured clue.';
  }
  return beat.prompt?.text || 'Listen, then choose.';
}

export function campaignMotion(beat, state = {}, feedback = {}) {
  const accepted = ['progress', 'correct', 'complete'].includes(feedback?.type)
    && ['CHOOSE', 'PLACE', 'PLACE_TILE'].includes(feedback?.action?.type);
  const action = feedback?.action || {};
  const choiceId = action.choiceId || action.optionId || action.tileId || action.binId || '';
  const choices = campaignDisplayChoices(beat, state);
  const index = Math.max(0, choices.findIndex(choice => choice.id === choiceId));
  return {
    accepted, choiceId, index,
    key: `${beat?.id}:${choiceId}:${state.placed?.length || 0}:${state.itemIndex || 0}:${Boolean(state.done)}:${state.errors || 0}`,
    fraction: choices.length > 1 ? index / (choices.length - 1) : .5
  };
}
