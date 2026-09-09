// Original faceted creature and habitat geometry for the sound ranger trail.
const polygon = (points, fill, extra='') => `<path d="${points}" fill="${fill}" ${extra}/>`;
const eye = (x,y) => `<path d="M${x-5} ${y-3}Q${x} ${y-8} ${x+5} ${y-3}V${y+4}Q${x} ${y+8} ${x-5} ${y+4}Z" fill="#fff4d9"/><circle cx="${x+1}" cy="${y+1}" r="3" fill="#172235"/><circle cx="${x+2}" cy="${y}" r=".9" fill="white"/>`;
const feet = (colour, small=false) => `<g class="ss-feet">${polygon(small?'M32 71 20 82 42 84 46 72Z':'M26 66 13 84 39 86 48 72Z',colour)}${polygon(small?'M75 71 85 82 63 84 61 72Z':'M79 66 91 84 65 86 58 72Z',colour)}</g>`;
const faces = {
  frog: `${feet('#3f8e80')}${polygon('M29 39 40 30 70 30 82 41 81 70 68 82H40L25 67Z','#87cda1')}${polygon('M29 42 39 28 47 37 65 37 74 28 85 42 77 60H35Z','#9ee0b1')}${polygon('M36 60 47 56H66L75 65 67 77H43Z','#d5e8b7')}${polygon('M29 43 30 64 41 78 35 62 40 42Z','#56ab8d')}${eye(41,43)}${eye(71,43)}<path d="M48 59Q56 64 64 58" fill="none" stroke="#2d635d" stroke-width="2.5"/><path d="M29 68 18 73M82 68 92 73" stroke="#a0dec0" stroke-width="5"/>`,
  snail: `${polygon('M15 72 18 62 28 58 39 64 80 66 91 75 83 82H23L12 77Z','#d0b780')}${polygon('M48 20 69 17 88 29 93 52 81 67 55 69 40 55 36 37Z','#d89576')}${polygon('M52 25 69 23 81 35 78 49 65 57 54 49 56 37 65 34 72 39 68 46 62 45','none','stroke="#f3ba8c" stroke-width="5" stroke-linejoin="round"')}${polygon('M45 52 58 65 80 65 91 51 88 60 80 72H53L39 57Z','#a46965')}<g class="ss-antennae"><path d="M22 64 17 43M32 62 34 39" stroke="#e3ca92" stroke-width="5" stroke-linecap="round"/>${eye(17,43)}${eye(34,39)}</g><path d="M21 72 31 72" stroke="#77675d" stroke-width="2"/>`,
  beetle: `<g class="ss-feet" fill="none" stroke="#6e667d" stroke-width="5" stroke-linecap="round"><path d="M34 49 21 43 17 48M32 60 17 63M37 70 26 80M73 49 84 43 91 48M75 60 91 63M69 70 81 80"/></g>${polygon('M33 38 47 30H64L79 40 84 60 73 77 55 85 36 78 24 61Z','#cb8f9a')}${polygon('M33 40 50 35 52 79 38 73 30 59Z','#e9b3ad')}${polygon('M60 35 77 43 79 60 68 75 56 81Z','#a9718c')}<path d="M54 34V81" stroke="#74536f" stroke-width="3"/>${polygon('M37 19 49 14 69 19 75 34 65 45H43L32 35Z','#7b929d')}${eye(46,29)}${eye(64,29)}<g class="ss-antennae"><path d="M39 20 30 11M69 20 79 10" stroke="#bccebb" stroke-width="3"/></g><path d="M38 49 43 45M67 55 73 59M39 65 43 68" stroke="#ffdec3" stroke-width="4" stroke-linecap="round"/>`,
  moth: `<g class="ss-wings">${polygon('M51 40 32 18 14 24 10 48 28 64 47 60 23 64 23 81 44 76 55 60Z','#b4a6da')}${polygon('M59 40 78 18 97 24 100 48 83 64 65 60 86 64 87 81 67 76 55 60Z','#b4a6da')}${polygon('M15 28 28 26 40 43 28 53 16 46Z','#ddc6da')}${polygon('M95 28 82 26 70 43 82 53 94 46Z','#ddc6da')}<path d="M25 36 30 43M86 36 81 43" stroke="#726896" stroke-width="7" stroke-linecap="round"/></g>${polygon('M49 35 60 35 65 51 60 77 55 83 49 73 44 51Z','#ddc596')}${polygon('M45 29 50 22H61L67 31 63 44H49Z','#eaddae')}${eye(50,33)}${eye(61,33)}<g class="ss-antennae"><path d="M50 25 40 14M61 25 70 14" stroke="#dcccac" stroke-width="3"/></g>`,
  gecko: `<path d="M75 66Q111 56 90 28Q102 67 68 81" stroke="#839e82" stroke-width="10" fill="none" stroke-linecap="round"/>${feet('#86ae83',true)}${polygon('M39 37 60 33 78 49 77 70 60 78 40 66 28 50Z','#adc987')}${polygon('M38 50 56 43 70 56 68 70 54 68Z','#d6ddb0')}${polygon('M21 30 33 20 52 23 66 33 61 49 42 56 25 48 16 40Z','#b8d591')}${polygon('M20 39 30 47 46 49 37 55 24 49 16 41Z','#789e83')}${eye(29,34)}${eye(51,34)}<path d="M33 47 46 47M32 57 15 62M67 51 85 47" stroke="#6e9879" stroke-width="3" stroke-linecap="round"/><path d="M14 57 14 66M11 62H20M87 42V51M82 47H91" stroke="#adc987" stroke-width="3"/>`,
  hedgehog: `${feet('#926e68',true)}${polygon('M19 56 13 45 25 39 25 24 39 28 44 13 56 22 70 17 77 29 91 30 87 46 96 58 84 70 36 74Z','#9c827e')}${polygon('M27 45 36 35 45 42 51 27 60 37 75 31 76 46 88 48 77 59 37 60Z','#c5a08c')}${polygon('M22 58 30 44 47 46 54 63 77 64 84 75 71 84H39L21 73 13 65Z','#dfc3a0')}${polygon('M21 58 14 64 23 68 31 60Z','#6d6570')}${eye(36,58)}<path d="M30 37 31 46M47 24 49 34M67 29 64 39M79 44 75 54" stroke="#e1bca0" stroke-width="3"/>`
};
export const CREATURE_TYPES = Object.freeze(Object.keys(faces));
export const safariCreatureForSlot = (slot, seed=1) => CREATURE_TYPES[((Number(slot) + (Number(seed) >>> 0)) % 6 + 6) % 6];
export const displaySafariGrapheme = grapheme => String(grapheme || '').replaceAll('_', '–');
export function creatureArt(type='frog') {
  return `<svg class="ss-creature-art" viewBox="0 0 110 96" aria-hidden="true"><ellipse cx="55" cy="87" rx="37" ry="6" fill="#020f1b" opacity=".5"/><g class="ss-creature-body">${faces[type] || faces.frog}</g></svg>`;
}
export function habitatArt(world='meadow') {
  const leaf=world==='dino'?'#79856e':world==='moonwood'?'#67739b':'#698e78';
  return `<svg viewBox="0 0 220 155" aria-hidden="true"><ellipse cx="111" cy="144" rx="89" ry="10" fill="#06121e" opacity=".8"/>${polygon('M21 139 28 81 62 39 112 22 165 44 199 81 205 139Z','#566365')}${polygon('M25 117 42 72 87 41 112 26 72 43 42 72 24 138Z','#87927c')}${polygon('M157 43 188 84 194 137H164L153 97 139 54Z','#394957')}${polygon('M67 139V89L88 68H132L155 90V139Z','#0b2332')}${polygon('M80 139V94L95 80H125L142 98V139Z','#17423f')}<path d="M81 138 96 106 124 99 144 139" fill="#50746b" opacity=".5"/>${polygon('M15 96 4 69 23 78 22 43 44 63 63 30 69 56 104 20 95 56 123 44 110 70 73 75 46 98Z',leaf)}${polygon('M157 58 168 27 184 50 207 40 204 73 219 87 197 103 174 83Z',leaf)}<path d="M35 137 48 122 61 137M175 139 187 118 191 139" stroke="#a3b68a" stroke-width="4" fill="none"/><path d="M67 90 76 90M147 90 156 90" stroke="#ffd493" stroke-width="5"/><circle cx="115" cy="59" r="8" fill="#d2b085"/><path d="M112 56 117 56 119 61 114 63 110 60Z" fill="#dbeab3"/></svg>`;
}

export const SAFARI_SCENE_ASSETS = Object.freeze([
  ['ranger', 'sound-safari-guide-v1.webp', 'c6b3f2ccb86f7f385bcb9a18d44128b0b6011bf74dc1c57507b234dace7f36bd'],
  ['meadow', 'sound-safari-meadow-bg-v1.webp', '08783c72241a38ac8031e6683bf76796183004e126906b4387925505645ab1ba'],
  ['dino', 'sound-safari-dino-bg-v1.webp', '461bba915945ea3c1d180fac8f537d6d4390cc0996026456e65ee7263450c833'],
  ['moonwood', 'sound-safari-moonwood-bg-v1.webp', '11bff7476f23ba8b1bc35af9683320f6263ca68a30ac2177da4efeaa2c778482']
].map(([role,name,sha256]) => Object.freeze({ role, path:`/images/learn-games/ps1-arcade/${name}`, sha256,
  origin:'Existing Literacy Guide PS1 Arcade source art', creator:'Not recorded in inherited source',
  licence:'Not recorded in inherited source; existing project use retained',
  revision:'src/content/appVisualAssetReviews.generated.js reviewed SHA-256 record',
  modifications:'Source bytes unchanged; responsive display crop and dim background overlay only' })));
export const SAFARI_SCENE_KIT = Object.freeze({version:3,assets:SAFARI_SCENE_ASSETS,
  geometry:Object.freeze({origin:'Original Literacy Guide SVG and responsive CSS source',creator:'Literacy Guide implementation',
    licence:'Project-owned original source',revision:'soundSafariScene.js v3',path:'src/components/learn/games/games/soundSafariScene.js',
    modifications:'Original geometry, not copied or traced from outside creature artwork',
    roles:Object.freeze(['six distinct faceted animals with body, feet, wing and antenna groups', 'ground contact islands, spelling stones and connected habitat path', 'three palette-coherent burrow habitats with arrival lights']),
    animation:'SoundSafariArcadeGame.css owns selected creature recoil, capture travel and foot/wing motion, habitat arrival, ranger cutout reactions, pause and reduced-motion equivalents. The inherited ranger is not a newly articulated rig.'
  })});
export const safariSceneMarkup = () => `
  <div class="ss-world" aria-hidden="true"><img data-ss="background" alt=""/></div>
  <div class="ss-play">
    <header class="ss-mission">
      <div class="ss-prompt"><span class="ss-kicker" data-ss="kicker"></span><strong data-ss="target"></strong></div>
      <div class="ss-controls">
        <button type="button" data-ss="hear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9H7L12 5V19L7 15H3Z"/><path d="M16 8Q22 12 16 16M18 4Q28 12 18 20"/></svg>Hear word</button>
        <button type="button" class="secondary" data-ss="model">Show me</button>
      </div>
    </header>
    <div class="ss-field" data-ss="field" role="group" aria-label="Choose the next word part"></div>
    <footer class="ss-route">
      <p class="ss-feedback" data-ss="feedback" role="status"></p>
      <div class="ss-path" data-ss="path" role="list" aria-label="Word parts guided home"></div>
      <div class="ss-helper" aria-hidden="true"><img src="${SAFARI_SCENE_ASSETS[0].path}" alt=""/></div>
      <div class="ss-habitat" data-ss="habitat" aria-hidden="true"></div>
      <small data-ss="support"></small>
    </footer>
  </div>
  <div class="ss-overlay" data-ss="overlay" hidden></div>`;
