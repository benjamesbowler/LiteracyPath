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

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var idx = 0, started = false;
  function playAudio(src){ if(!src) return; try { var a = new Audio(src); a.play().catch(function(){}); } catch { /* autoplay blocked or no audio device — the slide still shows */ } }
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
    slides.forEach(function(s, n){ s.classList.toggle('active', n === idx); });
    document.getElementById('counter').textContent = (idx+1) + ' / ' + slides.length;
    var s = slides[idx];
    animateWriting(s);
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
    if (e.target.closest('[data-replay]')) { animateWriting(slides[idx]); return; }
  });
  function toggleFs(){ try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch { /* full-screen refused by the browser — the deck still works windowed */ } }
  document.getElementById('startBtn').addEventListener('click', function(){
    started = true; document.getElementById('start').style.display = 'none';
    document.getElementById('nav').style.display = 'flex'; toggleFs(); show(0);
  });
  show(0);
