// Presentation deck runtime.
//
// 2026-07-26: moved out of src/utils/present/presentationBuilder.js, where it was
// emitted as an INLINE <script> into a blob: document. A blob: document inherits the
// opener's Content-Security-Policy, and vercel.json sets `script-src 'self'` with no
// 'unsafe-inline' (deliberately — tools/checkCsp.mjs asserts it). So the deck script
// was silently refused in production: show(0) never ran, no slide ever got .active,
// and every slide stayed `display:none`. The teacher saw a gradient and a dead
// "Start presentation" button. It worked in `npm run dev` because Vite serves no CSP.
//
// Served from /present/deck.js it is a real same-origin script, allowed by
// `script-src 'self'`, with no hash to keep in sync.
//
// 2026-07-28 REDESIGN. Four additions, all driven by attributes the builder
// emits — no new coupling to slide markup:
//   fitStage()   scales the fixed 1920x1080 #stage to the window
//   buildRail()  draws the section rail from the data-section values present
//   reveal       [data-reveal] slides hide .p-answer until the teacher asks
//   timer        [data-timer] slides get a thinking-time ring

  // Broken-image fallbacks. The deck used to carry inline onerror="" handlers,
  // but the same CSP that blocked the inline <script> (`script-src 'self'`, no
  // 'unsafe-inline') blocks inline event handlers too, so they never fired in
  // production and a missing asset showed the browser's broken-image icon on
  // the projector. The builder now emits data-hide-on-error instead:
  //   "self"      -> hide the <img>
  //   a CSS selector -> hide the nearest matching ancestor (the whole word card)
  function hideBroken(img){
    var sel = img.getAttribute('data-hide-on-error');
    if (!sel) return;
    var target = sel === 'self' ? img : img.closest(sel);
    if (target) target.style.display = 'none';
  }
  // 'error' does not bubble, so listen in the capture phase.
  document.addEventListener('error', function(e){
    var t = e.target;
    if (t && t.tagName === 'IMG') hideBroken(t);
  }, true);
  // Images that already failed while the document was parsing fired their error
  // before this script ran - sweep them once.
  Array.prototype.forEach.call(document.images, function(img){
    if (img.complete && !img.naturalWidth) hideBroken(img);
  });

  var STAGE_W = 1920, STAGE_H = 1080;
  var stage = document.getElementById('stage');
  var railSections = document.getElementById('rail-sections');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var idx = 0, started = false;
  var deckKey = document.body.getAttribute('data-deck-key') || '';
  var liveChannel = null;
  try { if ('BroadcastChannel' in window) liveChannel = new BroadcastChannel('lp-present-live'); } catch { liveChannel = null; }

  // ── Embedded preview ─────────────────────────────────────────────────────
  // PresentPage renders this same document in a same-origin <iframe srcdoc>
  // as its live preview (allowed under `frame-src 'none'`: about:srcdoc is
  // exempt, unlike blob: frames — verified against the production headers).
  // Framed, the deck skips the start overlay — no fullscreen, no audio
  // (`started` stays false) — and follows the picker's thumbnail rail via
  // postMessage. Only the embedding parent is obeyed; the projector popup is
  // top-level and ignores messages entirely.
  var embedded = false;
  try { embedded = window.self !== window.top; } catch { embedded = true; }
  if (embedded) {
    var startOverlay = document.getElementById('start');
    if (startOverlay) startOverlay.style.display = 'none';
  }
  window.addEventListener('message', function(e){
    if (!embedded || e.source !== window.parent) return;
    var data = e.data || {};
    if (data.type === 'lp-present-show' && typeof data.index === 'number') show(data.index);
  });

  // ── Stage scaling ────────────────────────────────────────────────────────
  // The deck lays out at exactly 1920x1080 and we scale that box down to the
  // window. Before this, slides were sized in vh/vw, so a tall slide clipped on
  // a short window and every projector produced a different composition.
  function fitStage(){
    if (!stage) return;
    var scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    // The translate keeps the stage centered; scaling about the center then
    // fits it exactly. (Grid centering is not used - Chromium start-aligns
    // grid items that overflow their track, which offset and clipped the
    // stage on any window smaller than 1920x1080.)
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);
  document.addEventListener('fullscreenchange', fitStage);
  fitStage();

  // ── The section rail ─────────────────────────────────────────────────────
  // Built from the sections THIS deck emitted, in the order they first appear,
  // so a Friday deck shows a shorter rail and the rail cannot promise a section
  // the deck does not contain.
  var sectionOrder = [];
  slides.forEach(function(s){
    var name = s.getAttribute('data-section');
    if (name && sectionOrder.indexOf(name) === -1) sectionOrder.push(name);
  });
  var pills = [];
  if (railSections) {
    sectionOrder.forEach(function(name){
      var el = document.createElement('span');
      el.className = 'rail-pill';
      el.textContent = name;
      railSections.appendChild(el);
      pills.push(el);
    });
  }
  function paintRail(section){
    var current = sectionOrder.indexOf(section);
    if (stage) stage.classList.toggle('chromeless', current === -1);
    pills.forEach(function(el, i){
      el.className = 'rail-pill' + (i === current ? ' on' : (current > -1 && i < current ? ' done' : ''));
    });
  }

  function playAudio(src){ if(!src) return; try { var a = new Audio(src); a.play().catch(function(){}); } catch { /* autoplay blocked or no audio device — the slide still shows */ } }

  // ── Thinking-time ring ───────────────────────────────────────────────────
  var timerId = 0;
  function stopTimer(){ clearInterval(timerId); timerId = 0; }
  function resetTimer(slideEl){
    stopTimer();
    var btn = slideEl && slideEl.querySelector('[data-timer-start]');
    if (!btn) return;
    var total = Number(slideEl.getAttribute('data-timer') || 60);
    var face = btn.querySelector('.p-timer-face');
    if (face) face.textContent = total;
    btn.style.setProperty('--t-deg', '360deg');
  }
  function runTimer(btn){
    var slideEl = btn.closest('.slide');
    var total = Number(slideEl.getAttribute('data-timer') || 60);
    var face = btn.querySelector('.p-timer-face');
    if (timerId) { resetTimer(slideEl); return; }
    var left = Number(face && face.textContent) || total;
    if (left <= 0) left = total;
    function paint(){
      if (face) face.textContent = left;
      btn.style.setProperty('--t-deg', (left / total * 360) + 'deg');
    }
    paint();
    timerId = setInterval(function(){
      left -= 1;
      if (left <= 0) { left = 0; paint(); stopTimer(); return; }
      paint();
    }, 1000);
  }

  var writeRaf = 0;
  function animateWriting(slideEl){
    cancelAnimationFrame(writeRaf);
    var svg = slideEl && slideEl.querySelector('.p-write-svg'); if(!svg) return;
    var pencil = svg.querySelector('[data-pencil]');
    // NOTE: the writing demo is TEACHING CONTENT (like a video), so it plays
    // even when the OS asks for reduced motion - only decorative motion obeys.
    var paths = Array.prototype.slice.call(svg.querySelectorAll('[data-write-stroke]'));
    var plan = paths.map(function(p){
      var L = Math.max(p.getTotalLength(), 0.6);
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      return { p: p, L: L, d: Math.max(300, L / 130 * 1000) };
    });
    if (!plan.length) return;
    var i = 0, start = 0, pause = 0;
    function step(now){
      var it = plan[i];
      if (!it) { if (pencil) pencil.style.opacity = 0; return; }
      if (pause && now < pause) { writeRaf = requestAnimationFrame(step); return; }
      if (pause) { pause = 0; start = 0; }
      if (!start) start = now;
      var t = Math.min(1, (now - start) / it.d), e = t * (2 - t);
      it.p.style.strokeDashoffset = it.L * (1 - e);
      if (pencil) {
        var pt = it.p.getPointAtLength(it.L * e);
        var off = Number(it.p.getAttribute('data-offset') || 0);
        pencil.setAttribute('transform', 'translate(' + (pt.x + off) + ',' + pt.y + ')');
        pencil.style.opacity = 1;
      }
      if (t >= 1) { i += 1; pause = now + 260; }
      writeRaf = requestAnimationFrame(step);
    }
    writeRaf = requestAnimationFrame(step);
  }

  function show(i){
    idx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function(s, n){
      s.classList.toggle('active', n === idx);
      // Answers and timers never carry over between slides: a teacher paging
      // back should find the question unanswered, exactly as the class saw it.
      if (n !== idx) s.classList.remove('revealed');
    });
    document.getElementById('counter').textContent = (idx+1) + ' / ' + slides.length;
    var s = slides[idx];
    paintRail(s.getAttribute('data-section') || '');
    resetTimer(s);
    animateWriting(s);
    if (started && s.getAttribute('data-audio')) playAudio(s.getAttribute('data-audio'));
    // A projector window reports only its slide number to the teacher page.
    // No learner identity or response data ever crosses into the projected view.
    if (!embedded && window.opener) {
      try { window.opener.postMessage({ type: 'lp-present-slide', deckKey: deckKey, index: idx }, window.location.origin); } catch { /* opener closed */ }
    }
    if (!embedded) {
      try { liveChannel && liveChannel.postMessage({ type: 'lp-present-slide', deckKey: deckKey, index: idx }); } catch { /* channel unavailable */ }
    }
  }
  function go(d){ show(idx + d); }

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'f' || e.key === 'F') { toggleFs(); }
    // Enter reveals the answer without the teacher hunting for the button.
    else if (e.key === 'Enter') {
      var cur = slides[idx];
      if (cur && cur.getAttribute('data-reveal')) { e.preventDefault(); cur.classList.toggle('revealed'); syncRevealLabel(cur); }
    }
  });
  document.getElementById('next').addEventListener('click', function(){ go(1); });
  document.getElementById('prev').addEventListener('click', function(){ go(-1); });

  function syncRevealLabel(slideEl){
    var label = slideEl.querySelector('[data-reveal-toggle] span');
    if (label) label.textContent = slideEl.classList.contains('revealed') ? 'Hide the answer' : 'Show the answer';
  }

  document.addEventListener('click', function(e){
    var toggle = e.target.closest('[data-reveal-toggle]');
    if (toggle) {
      var slideEl = toggle.closest('.slide');
      slideEl.classList.toggle('revealed');
      syncRevealLabel(slideEl);
      return;
    }
    var timerBtn = e.target.closest('[data-timer-start]');
    if (timerBtn) { runTimer(timerBtn); return; }
    var btn = e.target.closest('[data-play]'); if (btn) { playAudio(btn.getAttribute('data-play')); return; }
    if (e.target.closest('[data-replay]')) { animateWriting(slides[idx]); return; }
  });

  function toggleFs(){ try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch { /* full-screen refused by the browser — the deck still works windowed */ } }
  document.getElementById('startBtn').addEventListener('click', function(){
    started = true; document.getElementById('start').style.display = 'none';
    document.getElementById('nav').style.display = 'flex'; toggleFs(); fitStage(); show(0);
  });
  show(0);
