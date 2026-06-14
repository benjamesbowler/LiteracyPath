// Whole-class "Present" mode: builds a self-contained, fullscreen teaching deck
// for one cycle, opened in a new window for the projector. Deterministic (same
// cycle => same deck). Uses existing gold-voice audio and picture-word images;
// letter-sound video/song links are an optional future add (see notes in code).
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { AUDIO_FILE_PATHS } from "../../data/generated/audioFilePaths.generated.js";
import { graphemeAudioPath, wordAudioPath } from "../../components/elQuest/elQuestEngine.js";
import { getChildWordAsset } from "../../data/childAssets.js";
import { themeWorldForCycle } from "../../utils/palWorlds.js";

function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

// The Pals mascot for the current deck's world (set per build). Used to brand
// every slide with the right world character + palette. Rotates every 3 cycles.
let CURRENT_WORLD = themeWorldForCycle(1);
function palImg(pose, cls = "") {
  return `<img class="p-pal ${cls}" src="/images/pals/poses/${CURRENT_WORLD.id}-${pose}.webp" alt="" onerror="this.style.display='none'"/>`;
}
function wordImage(word) {
  const asset = getChildWordAsset(word) || {};
  return asset.image || "";
}

export function presentationCycleOptions() {
  return elSkillsBlockCycles
    .filter(c => c.cycleNumber)
    .map(c => ({ id: c.id, cycleNumber: c.cycleNumber, title: c.title }));
}

export function getPresentationCycle(cycleId) {
  return elSkillsBlockCycles.find(c => c.id === cycleId) || null;
}

// ── Curated phonemic-awareness content (general K warm-ups, deterministic) ────
const CHANGE_FIRST = [
  { base: "cat", made: ["hat", "bat", "rat"] },
  { base: "man", made: ["fan", "pan", "ran"] },
  { base: "pig", made: ["wig", "dig", "big"] },
  { base: "dog", made: ["log", "fog", "jog"] },
  { base: "sun", made: ["bun", "fun", "run"] },
  { base: "bed", made: ["red", "fed", "led"] }
];
const TAKE_AWAY = [
  { word: "cup", left: "up" }, { word: "sit", left: "it" }, { word: "man", left: "an" },
  { word: "sand", left: "and" }, { word: "ball", left: "all" }, { word: "fox", left: "ox" }
];
const COMPOUNDS = [
  ["sun", "set"], ["cup", "cake"], ["rain", "bow"], ["pan", "cake"], ["back", "pack"], ["pop", "corn"]
];
const PATTERN_SORTS = [
  { label: "end with y", words: ["by", "my", "why", "try", "fly", "sky"] },
  { label: "end with -ay", words: ["day", "say", "may", "play", "stay", "way"] },
  { label: "have -ng", words: ["ring", "king", "song", "bang", "hang", "long"] }
];
const CHAINS = [["sat", "sit", "sip", "lip"], ["man", "mat", "map", "cap"], ["pig", "pin", "pan", "pat"]];

function pick(list, n) {
  return list[((n % list.length) + list.length) % list.length];
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function focusCards(cycle) {
  const cards = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
  return cards
    .map(card => ({ grapheme: card.grapheme || card.spelling, sound: card.sound || "", spelling: (card.spelling || "").toLowerCase() }))
    .filter(card => /^[a-z]{1,2}$/.test(card.spelling));
}

function exampleWords(spelling, limit = 3) {
  return (LETTER_EXAMPLES[spelling] || []).filter(w => /^[a-z]{2,6}$/.test(w)).slice(0, limit);
}

// ── Slide builders (each returns one .slide section) ─────────────────────────
function slide(inner, opts = {}) {
  const data = [
    opts.audio ? `data-audio="${esc(opts.audio)}"` : "",
    opts.stroke ? `data-stroke="${esc(opts.stroke)}"` : ""
  ].join(" ");
  const char = opts.char ? palImg(opts.char, "p-pal-corner") : "";
  return `<section class="slide ${opts.cls || ""}" ${data}>${inner}${char}</section>`;
}

function audioButton(src, label = "Play sound") {
  if (!src) return "";
  return `<button class="p-audio" data-play="${esc(src)}" type="button">🔊 ${esc(label)}</button>`;
}

function cycleHeading(cycle) {
  const letters = (cycle.focusLetters || []).map(c => c.grapheme).filter(Boolean);
  if (!isFluencyCycle(cycle) && letters.length) return letters.join(" and ");
  if (cycle.title && cycle.title !== `Cycle ${cycle.cycleNumber}`) return cycle.title;
  return String(cycle.phase || "Review time").replace(/-/g, " ");
}

function titleSlide(cycle) {
  const phase = String(cycle.phase || "").replace(/-/g, " ");
  return slide(`
    ${palImg("celebrate", "p-pal-hero")}
    <p class="p-kicker">Cycle ${esc(cycle.cycleNumber)} · ${esc(CURRENT_WORLD.name)}</p>
    <h1 class="p-title">${esc(cycleHeading(cycle))}</h1>
    <p class="p-phase">${esc(phase)}</p>
    <p class="p-hint">Press → or click to begin</p>`, { cls: "p-cover" });
}

function letterSoundSlide(card) {
  const big = card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.spelling;
  const phoneme = graphemeAudioPath(card.spelling);
  // Only show example words that actually have a picture - no empty boxes.
  const words = exampleWords(card.spelling, 6).filter(w => wordImage(w)).slice(0, 3);
  const pics = words.map(word => `<button class="p-word" data-play="${esc(wordAudioPath(word))}" type="button">
      <img src="${esc(wordImage(word))}" alt="${esc(word)}" onerror="this.closest('.p-word').style.display='none'"/>
      <span>${esc(word)}</span></button>`).join("");
  // Optional video/song embed: drop a URL here per letter later to upgrade.
  return slide(`
    <p class="p-kicker">Our sound</p>
    <div class="p-letter">${esc(big)}</div>
    <p class="p-says">This says <b>${esc(card.sound || "/" + card.spelling + "/")}</b></p>
    ${audioButton(phoneme, "Hear the sound")}
    <div class="p-words">${pics}</div>`, { cls: "p-letter-slide", audio: phoneme, char: "wave" });
}

function writingSlide(card) {
  const big = card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.spelling;
  return slide(`
    <p class="p-kicker">Let's write it</p>
    <div class="p-write2" aria-hidden="true">
      <span class="p-write-ghost2">${esc(big)}</span>
      <span class="p-write-ink2" data-ink>${esc(big)}</span>
    </div>
    <button class="p-audio" type="button" data-replay>✏️ Watch again</button>
    <p class="p-hint">Now you write it in the air!</p>`, { cls: "p-writing", stroke: "1", char: "think" });
}

function sightWordSlide(word) {
  return slide(`
    <p class="p-kicker">Tricky word</p>
    <div class="p-sight">${esc(word)}</div>
    ${audioButton(wordAudioPath(word), "Read it")}
    <p class="p-sentence">Find it, say it, spell it: <b>${esc(word.split("").join(" "))}</b></p>`,
  { cls: "p-sight-slide", audio: wordAudioPath(word), char: "read" });
}

function changeFirstSlide(item) {
  const made = item.made.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(`
    <p class="p-kicker">Change the first sound</p>
    <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
    <p class="p-says">Change the first sound to make a new word:</p>
    <div class="p-chips">${made}</div>`, { cls: "p-phoneme", char: "wave" });
}

function takeAwaySlide(item) {
  return slide(`
    <p class="p-kicker">Take the first sound away</p>
    <div class="p-take">
      <span class="p-big-word" data-play="${esc(wordAudioPath(item.word))}">${esc(item.word)}</span>
      <span class="p-arrow">→</span>
      <span class="p-big-word made" data-play="${esc(wordAudioPath(item.left))}">${esc(item.left)}</span>
    </div>
    <p class="p-says">Say <b>${esc(item.word)}</b> without the first sound. What is left?</p>`, { cls: "p-phoneme", char: "wave" });
}

function compoundSlide(parts) {
  const [a, b] = parts;
  const whole = a + b;
  return slide(`
    <p class="p-kicker">Put words together</p>
    <div class="p-compound">
      <span class="p-chip big" data-play="${esc(wordAudioPath(a))}">${esc(a)}</span>
      <span class="p-arrow">+</span>
      <span class="p-chip big" data-play="${esc(wordAudioPath(b))}">${esc(b)}</span>
      <span class="p-arrow">=</span>
      <span class="p-big-word made" data-play="${esc(wordAudioPath(whole))}">${esc(whole)}</span>
    </div>`, { cls: "p-phoneme", char: "wave" });
}

function poemSlide(cycle) {
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (!poem) return "";
  const narration = `/audio/learn-games/poems/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.mp3`;
  const audio = AUDIO_FILE_PATHS.has(narration) ? narration : "";
  const pics = (poem.findWords || []).map(word => {
    const asset = getChildWordAsset(word) || {};
    return asset.image ? `<img src="${esc(asset.image)}" alt="${esc(word)}" onerror="this.style.display='none'"/>` : "";
  }).filter(Boolean).slice(0, 3).join("");
  // Bespoke per-poem illustration (generated from the art briefs). Shows when
  // the file exists; until then it hides and the text + word pictures remain.
  const poemImg = `/images/pals/poems/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.webp`;
  return slide(`
    <p class="p-kicker">Our poem</p>
    <h2 class="p-poem-title">${esc(poem.title)}</h2>
    ${audioButton(audio, "Listen to the poem")}
    <div class="p-poem-wrap">
      <img class="p-poem-hero" src="${esc(poemImg)}" alt="" onerror="this.style.display='none'"/>
      <div class="p-poem">${esc(poem.lines.join("\n"))}</div>
    </div>
    <div class="p-poem-pics">${pics}</div>`, { cls: "p-poem-slide", audio, char: "read" });
}

function patternSlide(cycle) {
  const sort = pick(PATTERN_SORTS, cycle.cycleNumber);
  const chips = sort.words.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(`
    <p class="p-kicker">Pattern power</p>
    <h2 class="p-says">Read the words that <b>${esc(sort.label)}</b></h2>
    <div class="p-chips big">${chips}</div>`, { cls: "p-phoneme", char: "wave" });
}

function chainSlide(cycle) {
  const chain = pick(CHAINS, cycle.cycleNumber);
  const chips = chain.map((w, i) => `${i ? '<span class="p-arrow">→</span>' : ""}<button class="p-chip big" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(`
    <p class="p-kicker">Word chain</p>
    <h2 class="p-says">Change one sound each time</h2>
    <div class="p-compound">${chips}</div>`, { cls: "p-phoneme", char: "wave" });
}

function endSlide() {
  return slide(`${palImg("celebrate", "p-pal-hero")}
    <div class="p-stars">★ ★ ★</div><h1 class="p-title">Great learning!</h1>
    <p class="p-hint">Press Esc to leave full screen</p>`, { cls: "p-cover" });
}

// ── Deck assembly ────────────────────────────────────────────────────────────
export function buildCyclePresentation(cycleId) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  CURRENT_WORLD = themeWorldForCycle(cycle.cycleNumber);

  const slides = [titleSlide(cycle)];
  const cards = focusCards(cycle);
  if (!isFluencyCycle(cycle)) {
    cards.forEach(card => { slides.push(letterSoundSlide(card)); slides.push(writingSlide(card)); });
  }
  (cycle.highFrequencyWords || []).slice(0, 4).forEach(word => slides.push(sightWordSlide(String(word).toLowerCase())));
  slides.push(changeFirstSlide(pick(CHANGE_FIRST, cycle.cycleNumber)));
  slides.push(takeAwaySlide(pick(TAKE_AWAY, cycle.cycleNumber)));
  slides.push(compoundSlide(pick(COMPOUNDS, cycle.cycleNumber)));
  if (isFluencyCycle(cycle)) { slides.push(patternSlide(cycle)); slides.push(chainSlide(cycle)); }
  const poem = poemSlide(cycle);
  if (poem) slides.push(poem);
  slides.push(endSlide());

  const title = `Cycle ${cycle.cycleNumber} - ${cycleHeading(cycle)}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@400;500;600&display=swap" rel="stylesheet">
<style>${DECK_CSS}</style></head>
<body>
<div id="deck" style="--w-accent:${CURRENT_WORLD.accent};--w-soft:${CURRENT_WORLD.accentSoft};--w-deep:${CURRENT_WORLD.deep}">${slides.join("")}</div>
<div id="start"><button id="startBtn" type="button">▶ Start presentation</button><p>Best on a projector. Use → ← to move, F for full screen.</p></div>
<div id="nav"><button id="prev" type="button" aria-label="Previous">‹</button><span id="counter"></span><button id="next" type="button" aria-label="Next">›</button></div>
<script>${DECK_JS}</script>
</body></html>`;
  return { title, slideCount: slides.length, html };
}

export function openCyclePresentation(cycleId) {
  const { html, title } = buildCyclePresentation(cycleId);
  const win = window.open("", "lp-present", "width=1280,height=800");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  return true;
}

const DECK_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden;
    color: #2b2118; font-family: 'Fredoka','Andika','Comic Sans MS',sans-serif;
    background:
      radial-gradient(80vw 60vh at 50% -10%, color-mix(in srgb, var(--w-accent) 22%, #fff), transparent 70%),
      linear-gradient(180deg, #FFFDF7 0%, var(--w-soft) 100%); }
  #deck { height: 100vh; }
  .slide { position: absolute; inset: 0; display: none; flex-direction: column;
    align-items: center; justify-content: center; gap: 2.2vh; text-align: center; padding: 6vh 6vw; }
  .slide.active { display: flex; animation: pop .5s cubic-bezier(.2,1.3,.4,1) both; }
  @keyframes pop { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
  .p-kicker { margin: 0; text-transform: uppercase; letter-spacing: .14em; font-weight: 600;
    color: var(--w-deep); font-size: 2.4vh; }
  .p-title { font-family: 'Fredoka',sans-serif; font-weight: 600; font-size: 9vh; margin: 0; color: var(--w-deep);
    text-transform: capitalize; }
  .p-phase { font-size: 3vh; color: #6b5a48; text-transform: capitalize; }
  .p-hint { color: #9a8a76; font-size: 2.4vh; }
  .p-letter { font-family: 'Andika',sans-serif; font-size: 34vh; line-height: .95; font-weight: 700; color: var(--w-accent);
    text-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 28%, #fff); animation: wobble 2.4s ease-in-out infinite; }
  @keyframes wobble { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
  .p-says { font-size: 4.4vh; margin: 0; }
  .p-says b, .p-sentence b { color: var(--w-accent); }
  .p-words { display: flex; gap: 3vw; margin-top: 1vh; }
  .p-word, .p-chip, .p-big-word, .p-audio { cursor: pointer; }
  .p-word { background: none; border: 0; color: inherit; display: flex; flex-direction: column; align-items: center; gap: 1vh; font: inherit; }
  .p-word img { width: 20vh; height: 20vh; object-fit: contain; background: #fff; border: 4px solid #fff;
    border-radius: 24px; box-shadow: 0 10px 24px rgba(0,0,0,.12); padding: 1vh; }
  .p-word:hover img { transform: translateY(-1vh) rotate(-2deg); }
  .p-word span { font-size: 3.6vh; font-weight: 600; }
  .p-audio { margin-top: 1vh; background: var(--w-accent); color: #fff; border: 0; border-radius: 999px;
    padding: 1.6vh 3.4vw; font: inherit; font-weight: 600; font-size: 3vh; box-shadow: 0 8px 0 var(--w-deep); }
  .p-audio:active { transform: translateY(4px); box-shadow: 0 4px 0 var(--w-deep); }
  .p-sight { font-family: 'Fredoka',sans-serif; font-size: 24vh; font-weight: 600; color: var(--w-accent); line-height: 1;
    text-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 28%, #fff); }
  .p-sentence { font-size: 3.6vh; }
  .p-big-word { font-family: 'Fredoka',sans-serif; font-size: 17vh; font-weight: 600; color: var(--w-accent); background: none; border: 0; }
  .p-big-word.made { color: #E0991C; }
  .p-take, .p-compound { display: flex; align-items: center; gap: 2.5vw; flex-wrap: wrap; justify-content: center; }
  .p-arrow { font-size: 9vh; color: #E0991C; }
  .p-chips { display: flex; gap: 2vw; flex-wrap: wrap; justify-content: center; margin-top: 1vh; }
  .p-chip { background: #fff; color: var(--w-deep); border: 3px solid var(--w-accent); border-radius: 18px;
    padding: 1.4vh 3vw; font: inherit; font-weight: 600; font-size: 5vh; box-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 30%, #fff); }
  .p-chip.big, .p-chips.big .p-chip { font-size: 7vh; }
  .p-stars { font-size: 14vh; color: #E0991C; letter-spacing: 1vh; }
  .p-poem-title { font-family: 'Fredoka',sans-serif; font-weight: 600; font-size: 5.4vh; margin: 0; color: var(--w-deep); }
  .p-poem-wrap { display: flex; align-items: center; gap: 3vw; flex-wrap: wrap; justify-content: center; }
  .p-poem-hero { height: 40vh; max-width: 42vw; object-fit: contain; border-radius: 22px;
    box-shadow: 0 14px 34px rgba(0,0,0,.16); background: #fff; }
  .p-poem { white-space: pre-wrap; font-size: 4vh; line-height: 1.5; background: #fff;
    border: 4px solid #fff; border-radius: 22px; box-shadow: 0 12px 30px rgba(0,0,0,.1); padding: 3vh 4vw; }
  .p-poem-pics { display: flex; gap: 2vw; margin-top: 1vh; }
  .p-poem-pics img { width: 16vh; height: 16vh; object-fit: contain; background: #fff; border: 4px solid #fff; border-radius: 18px; box-shadow: 0 10px 24px rgba(0,0,0,.12); padding: 1vh; }
  .p-write2 { position: relative; display: inline-block; line-height: 1;
    font-family: 'Andika','Comic Sans MS',sans-serif; font-weight: 700; font-size: 44vh; }
  .p-write-ghost2 { color: color-mix(in srgb, var(--w-accent) 22%, #fff); }
  .p-write-ink2 { position: absolute; left: 0; top: 0; color: var(--w-accent);
    clip-path: inset(0 0 100% 0); -webkit-clip-path: inset(0 0 100% 0); }
  .slide.active .p-write-ink2.draw { animation: writeReveal 1.8s ease forwards; }
  @keyframes writeReveal {
    from { clip-path: inset(0 0 100% 0); -webkit-clip-path: inset(0 0 100% 0); }
    to { clip-path: inset(0 0 0 0); -webkit-clip-path: inset(0 0 0 0); }
  }
  /* The Pals mascot, branding every slide */
  .p-pal-corner { position: absolute; bottom: 3vh; right: 3vw; height: 22vh; pointer-events: none;
    animation: bob 2.6s ease-in-out infinite; filter: drop-shadow(0 8px 14px rgba(0,0,0,.18)); }
  .p-pal-hero { height: 34vh; animation: bob 2.6s ease-in-out infinite; filter: drop-shadow(0 10px 18px rgba(0,0,0,.2)); }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.4vh); } }
  #start { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2vh; z-index: 10;
    background: radial-gradient(80vw 60vh at 50% 0%, color-mix(in srgb, var(--w-accent) 22%, #fff), transparent 70%), linear-gradient(180deg, #FFFDF7, var(--w-soft)); }
  #start button { font: inherit; font-weight: 600; font-size: 4.4vh; background: var(--w-accent); color: #fff; border: 0; border-radius: 999px; padding: 2.2vh 6vw; cursor: pointer; box-shadow: 0 10px 0 var(--w-deep); }
  #start button:active { transform: translateY(5px); box-shadow: 0 5px 0 var(--w-deep); }
  #start p { color: #9a8a76; font-size: 2.4vh; }
  #nav { position: fixed; bottom: 2vh; left: 0; right: 0; display: none; align-items: center; justify-content: center; gap: 3vw; z-index: 9; }
  #nav button { font-size: 5vh; background: #fff; color: var(--w-deep); border: 3px solid var(--w-accent); border-radius: 16px; width: 8vh; height: 8vh; cursor: pointer; }
  #counter { color: #9a8a76; font-size: 2.6vh; min-width: 8ch; }
  @media (prefers-reduced-motion: reduce) {
    .slide.active, .p-letter, .p-pal-corner, .p-pal-hero { animation: none; }
    .slide.active .p-write-ink2.draw { animation: none; clip-path: inset(0 0 0 0); -webkit-clip-path: inset(0 0 0 0); }
  }
`;

const DECK_JS = `
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var idx = 0, started = false;
  function playAudio(src){ if(!src) return; try { var a = new Audio(src); a.play().catch(function(){}); } catch(e){} }
  function show(i){
    idx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function(s, n){ s.classList.toggle('active', n === idx); });
    document.getElementById('counter').textContent = (idx+1) + ' / ' + slides.length;
    var s = slides[idx];
    var ink = s.querySelector('[data-ink]');
    if (ink) { ink.classList.remove('draw'); void ink.offsetWidth; setTimeout(function(){ ink.classList.add('draw'); }, 30); }
    if (started && s.getAttribute('data-audio')) playAudio(s.getAttribute('data-audio'));
  }
  function go(d){ show(idx + d); }
  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'f' || e.key === 'F') { toggleFs(); }
  });
  document.getElementById('next').addEventListener('click', function(){ go(1); });
  document.getElementById('prev').addEventListener('click', function(){ go(-1); });
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-play]'); if (btn) { playAudio(btn.getAttribute('data-play')); return; }
    if (e.target.closest('[data-replay]')) { var ink = slides[idx].querySelector('[data-ink]'); if(ink){ ink.classList.remove('draw'); setTimeout(function(){ ink.classList.add('draw'); }, 30);} return; }
  });
  function toggleFs(){ try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch(e){} }
  document.getElementById('startBtn').addEventListener('click', function(){
    started = true; document.getElementById('start').style.display = 'none';
    document.getElementById('nav').style.display = 'flex'; toggleFs(); show(0);
  });
  show(0);
`;
