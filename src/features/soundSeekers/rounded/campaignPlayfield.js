// Motor actions and scenery never judge literacy. This inventory also drives
// the all-mission coverage audit; families keep their own physical verb.
export const CAMPAIGN_PLAY = Object.freeze({
  'sound-steps': { action: 'hop', tool: 'scene-stepping-stone', hint: 'Choose a stone to hop across.', landscape: 'river' },
  'word-pop': { action: 'aim', tool: 'scene-bubble-machine', hint: 'Aim at a bubble, then pop it. You can tap it too.', landscape: 'day' },
  'rescue-bridge': { action: 'build', tool: 'scene-bridge-frame', hint: 'Fit the sound pieces from left to right. Drag or tap a piece.', landscape: 'river' },
  'tree-rescue': { action: 'climb', tool: 'tree', hint: 'Choose a landing to climb towards your friend.', landscape: 'day' },
  'pals-post': { action: 'deliver', tool: 'scene-mailbox', hint: 'Pick up the parcel. Choose its home, or drag it there.', landscape: 'day' },
  'sound-herd': { action: 'route', tool: 'basket', hint: 'Guide this carrier to a sound basket. Drag or tap the basket.', landscape: 'day' },
  'river-route': { action: 'sail', tool: 'raft', hint: 'Choose a dock, or drag the raft along its route.', landscape: 'river' },
  'sentence-express': { action: 'couple', tool: 'scene-engine', hint: 'Couple the words in order. Drag or tap a carriage.', landscape: 'day' },
  'fix-it-workshop': { action: 'change', tool: 'workbench', hint: 'Fit a piece into the marked place. Drag or tap it.', landscape: 'day' },
  'garden-kitchen': { action: 'place', tool: 'scene-seedling', hint: 'Choose where it belongs, or carry it there.', landscape: 'day' },
  'lantern-search': { action: 'search', tool: 'lantern', hint: 'Open the lanterns to look. Then choose the find.', landscape: 'night' },
  'story-rescue': { action: 'resolve', tool: 'door', hint: 'Use the clue to choose how to help your friend.', landscape: 'day' }
});

export function campaignLayoutSeed(beat) {
  // Authored identity, rather than answer or current choice correctness,
  // controls the arrangement. Unfinished packs restore identical layouts.
  return [...String(beat?.id || '')].reduce((seed, c) => (Math.imul(seed, 31) + c.charCodeAt(0)) >>> 0, 17);
}

export function campaignMotorDrop({ sourceId, targetId, choices, assembly, search = false, opened = [] }) {
  const source = choices.find(choice => choice.id === sourceId && !choice.used);
  const target = choices.find(choice => choice.id === targetId && !choice.used);
  if (!assembly && search && target && !opened.includes(target.id)) return { type: 'PLAYFIELD', openId: target.id };
  return assembly ? targetId === 'assembly' ? source?.action || null : null : target?.action || null;
}

export const campaignActionSound = familyId => CAMPAIGN_PLAY[familyId] ? `/audio/sound-seekers/actions/${familyId}.wav` : '';

// Reuse owned painted biome media for the later worlds without mounting the
// retired runtime. Landscape selection depends on the authored place only.
export function campaignPlayfieldLandscape(beat) {
  const identity = beat?.stageId || beat?.missionId || beat?.id || '';
  if (identity.startsWith('dino-')) return '/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp';
  if (identity.startsWith('moonwood-')) return '/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp';
  return `/game-assets/sound-seekers/question-art/landscape-${CAMPAIGN_PLAY[beat?.familyId]?.landscape || 'day'}.webp`;
}
