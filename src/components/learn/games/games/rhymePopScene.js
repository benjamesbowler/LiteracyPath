// Existing reviewed source art stays unchanged. Creator/licence were not
// supplied in the inherited records; do not invent a new provenance claim.
export const RHYME_SCENE_ASSETS = Object.freeze([
  ['background', 'rhyme-pop-bg.webp', '59c8cd37fbe892b2d5284e93f6730bffa0cc9dbbc22d7339dafb7d562039db5b'],
  ['canonical dinosaur-hooded balloon popper', 'rhyme-pop-helper-v1.webp', '84a06487d945fb8ea70df2303a1f7aae2ca0789c39f0d8eb62dab712e64ae434']
].map(([role, name, sha256]) => Object.freeze({ role, path: `/images/learn-games/ps1-arcade/${name}`, sha256,
  origin: 'Existing Literacy Guide PS1 Arcade source art', creator: 'Not recorded in inherited source',
  licence: 'Not recorded in inherited source; existing project use retained',
  revision: 'src/content/appVisualAssetReviews.generated.js reviewed SHA-256 record',
  modifications: 'Source bytes unchanged; display crop and dark scene overlay only' })));

const COLOURS = ['#8fcff2', '#eeadca', '#ebcb80', '#a7d6b8', '#b8b4ef', '#efb698', '#9bd8d8'];
export const RHYME_SCENE_KIT = Object.freeze({
  version: 3, assets: RHYME_SCENE_ASSETS,
  geometry: Object.freeze({
    origin: 'Original Literacy Guide SVG and responsive CSS source', creator: 'Literacy Guide implementation',
    licence: 'Project-owned original source', revision: 'rhymePopScene.js v3', modifications: 'Original construction, not derived from downloaded artwork',
    path: 'src/components/learn/games/games/rhymePopScene.js',
    roles: Object.freeze(['equal faceted balloon bodies, highlights, knots and tethers', 'six-slot wicker parade basket and contact shadow', 'quiet native answer plane and collected-word labels']),
    animation: 'RhymePopArcadeGame.css owns selected balloon pop/shake, basket fill/lift, source-preserving helper cutout recoil/lean/hop, paused and reduced-motion equivalents.'
  })
});
// Slot/seed only: the same hue, shape, contrast and size for every answer.
export const balloonSkin = (slot, seed = 1) => COLOURS[((slot + (Number(seed) >>> 0)) % COLOURS.length + COLOURS.length) % COLOURS.length];
export const balloonArtwork = () => `<svg class="rp-balloon-art" viewBox="0 0 160 130" preserveAspectRatio="none" aria-hidden="true">
  <path class="rp-balloon-tether" d="M80 111Q69 118 80 129" fill="none" stroke="#bbd4eb" stroke-width="2"/>
  <path class="rp-balloon-body" d="M38 5H122L150 31 153 62 132 91 87 109H73L28 91 7 62 10 31Z" fill="var(--balloon)"/>
  <path d="M38 5 10 31 7 62 31 78 26 33 50 17 122 5Z" fill="#fff" opacity=".2"/>
  <path d="M122 5 150 31 153 62 132 91 87 109H73L114 84 130 51Z" fill="#10283e" opacity=".22"/>
  <path d="M38 20 26 36 25 47" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/>
  <path class="rp-balloon-knot" d="M79 105 70 116H90L81 105Z" fill="var(--balloon)"/>
</svg>`;

export function basketArtwork(found = 0) {
  const anchors = [[48,42],[79,22],[110,43],[32,76],[80,65],[130,76]];
  return `<svg class="rp-basket-art" viewBox="0 0 170 215" aria-hidden="true">
    ${anchors.map(([x,y], i) => `<g data-collected="${i < found}" class="rp-basket-balloon">
      <path d="M${x} ${y+30} ${75+(i%3)*10} 157" fill="none" stroke="#d3dae6" stroke-width="1.6"/>
      <path d="M${x-14} ${y-19}H${x+14}L${x+23} ${y-3} ${x+19} ${y+13} ${x} ${y+31} ${x-19} ${y+13} ${x-23} ${y-3}Z" fill="${COLOURS[i]}"/>
      <path d="M${x-10} ${y-12} ${x-15} ${y-3}" stroke="#fff" stroke-width="3" opacity=".6"/>
      <path d="M${x} ${y+29} ${x-4} ${y+34}H${x+4}Z" fill="${COLOURS[i]}"/>
    </g>`).join('')}
    <ellipse cx="83" cy="202" rx="51" ry="7" fill="#020b1f" opacity=".55"/>
    <path d="M48 153H123L114 193H57Z" fill="#be8b54" stroke="#352c43" stroke-width="3" class="rp-basket-hull"/>
    <path d="M54 160 119 160M56 170H117M58 181H114" stroke="#f2c986" stroke-width="3"/>
    <path d="M66 155 68 191M85 155V193M105 155 101 191" stroke="#724b49" stroke-width="3"/>
    <path d="M44 150H127V161H44Z" fill="#f4c17b"/>
    <path d="M48 151H60V160H48ZM76 151H88V160H76ZM104 151H116V160H104Z" fill="#b45367"/>
    <path d="M85 168 93 180 85 188 77 180Z" fill="#ffe3a1"/>
  </svg>`;
}

export const rhymeSceneMarkup = () => `
  <div class="rp-world" aria-hidden="true"><img src="${RHYME_SCENE_ASSETS[0].path}" alt=""/><div class="rp-bunting"></div></div>
  <div class="rp-play">
    <header class="rp-mission"><div class="rp-target-copy"><span>Rhymes with</span><button type="button" data-rp="hear"><strong data-rp="target"></strong><small>Hear ♫</small></button></div><div class="rp-count"><strong data-rp="remaining"></strong><small data-rp="round"></small></div></header>
    <div class="rp-field" role="group" aria-label="Pop the rhyming balloons" data-rp="field"></div>
    <footer class="rp-stage"><img class="rp-helper" src="${RHYME_SCENE_ASSETS[1].path}" alt=""/><div class="rp-stage-copy"><div data-rp="feedback" role="status" aria-live="polite"></div><small data-rp="support"></small><div class="rp-collected" data-rp="collected" aria-label="Collected rhyming words"></div></div><div class="rp-basket" data-rp="basket">${basketArtwork()}</div></footer>
  </div>
  <div class="rp-overlay" data-rp="overlay" hidden></div>`;
