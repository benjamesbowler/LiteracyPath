import { worldForDifficulty } from '../../../../utils/palWorlds.js';

// Difficulty owns the world/cast; a game's selectable route remains a separate
// choice inside that world. The shared product world mapping is authoritative.
export const PHYSICAL_ARCADE_THEMES = Object.freeze({
  meadow: Object.freeze({ id: 'meadow', name: 'Meadow Pals', hero: 'Bouncy', characterId: 'bouncy',
    reference: '/images/arcade/drum-trail/bouncy-walk.webp',
    sky: '#a8d9ed', ground: '#87ae65', foliage: '#6f9b55', stone: '#baaa83', wood: '#a56b36', accent: '#e7ae52', light: '#fff0cc',
    landmarks: ['windmill', 'wildflowers', 'wooden workshop'] }),
  dino: Object.freeze({ id: 'dino', name: 'Dino Pals', hero: 'Chompy', characterId: 'chompy',
    reference: '/game-assets/sound-seekers/characters/chompy/pose-ready.webp',
    sky: '#efd3aa', ground: '#8d9e5d', foliage: '#3e7c4f', stone: '#ce986b', wood: '#986947', accent: '#d98841', light: '#ffe0aa',
    landmarks: ['fern grove', 'fossil arch', 'volcanic cliffs'] }),
  moonwood: Object.freeze({ id: 'moonwood', name: 'Moonwood', hero: 'Pip', characterId: 'pip',
    reference: '/game-assets/sound-seekers/characters/pip/pose-ready.webp',
    sky: '#273f68', ground: '#52676b', foliage: '#1e3a34', stone: '#8b83ad', wood: '#76617c', accent: '#e8b563', light: '#bfd3f2',
    landmarks: ['lantern grove', 'giant mushrooms', 'star observatory'] })
});

export function physicalThemeForDifficulty(difficulty) {
  return PHYSICAL_ARCADE_THEMES[worldForDifficulty(difficulty).id];
}
