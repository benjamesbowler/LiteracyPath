// Authoring paths for independently downloaded, byte-identical model recovery.
// Runtime URLs remain literal in gameRecoveryAssets.js so Vite emits binaries.
export const GAME_RECOVERY_SOURCES = Object.freeze({
  kart: Object.freeze({ source: 'sound-racer/models/pip-kart', name: 'pip-kart' }),
  skater: Object.freeze({ source: 'spell-skate/spell-skater', name: 'spell-skater' }),
  climber: Object.freeze({ source: 'word-climb/pip-climber', name: 'pip-climber' }),
  kartBouncy: Object.freeze({ source: 'sound-racer/models/bouncy-kart-v2', name: 'bouncy-kart-v2' }),
  kartChompy: Object.freeze({ source: 'sound-racer/models/chompy-kart-v2', name: 'chompy-kart-v2' }),
  kartPip: Object.freeze({ source: 'sound-racer/models/pip-kart-v2', name: 'pip-kart-v2' }),
  skaterBouncy: Object.freeze({ source: 'spell-skate/models/bouncy-skater-v2', name: 'bouncy-skater-v2' }),
  skaterChompy: Object.freeze({ source: 'spell-skate/models/chompy-skater-v2', name: 'chompy-skater-v2' }),
  skaterPip: Object.freeze({ source: 'spell-skate/models/pip-skater-v2', name: 'pip-skater-v2' })
});
