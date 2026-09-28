// Same-origin external runtime: popup and srcdoc decks inherit the app CSP.
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var slides = Array.from(document.querySelectorAll('.slide'));
  var idx = -1, started = false, timerId = 0, writeRaf = 0, modelId = 0;
  var activeAudio = null, resolveAudio = null;
  var initial = Number(document.body.dataset.startIndex) || 0;
  var deckKey = document.body.dataset.deckKey;
  var embedded = window.self !== window.top;
  // about:srcdoc reports a null URL origin although its document inherits the parent origin.
  var messageOrigin = embedded ? window.parent.location.origin : location.origin;
  var overview = document.getElementById('overview');
  var blank = document.getElementById('blank-screen');
  var audioStatus = document.getElementById('audio-status');
  var liveChannel;
  try { liveChannel = new BroadcastChannel('lp-present-live'); } catch { /* optional projector status */ }

  function fitStage() {
    stage.style.transform = 'translate(-50%, -50%) scale(' + Math.min(innerWidth / 1920, innerHeight / 1080) + ')';
  }
  ['resize', 'orientationchange'].forEach(function (event) { window.addEventListener(event, fitStage); });
  document.addEventListener('fullscreenchange', fitStage);
  fitStage();

  function hideBroken(img) {
    var selector = img.getAttribute('data-hide-on-error');
    if (!selector) return;
    var target = selector === 'self' ? img : img.closest(selector);
    if (target) target.style.display = 'none';
  }
  document.addEventListener('error', function (event) {
    if (event.target.tagName === 'IMG') hideBroken(event.target);
  }, true);
  Array.from(document.images).forEach(function (img) { if (img.complete && !img.naturalWidth) hideBroken(img); });

  function stopAudio() {
    if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }
    if (resolveAudio) { resolveAudio(); resolveAudio = null; }
  }
  function playAudio(src) {
    stopAudio();
    audioStatus.textContent = '';
    if (!src) return Promise.resolve();
    return new Promise(function (resolve) {
      var audio = new Audio(src);
      activeAudio = audio;
      resolveAudio = resolve;
      function finish() {
        if (activeAudio === audio) { activeAudio = null; resolveAudio = null; }
        resolve();
      }
      audio.addEventListener('ended', finish, { once: true });
      audio.addEventListener('error', function () { audioStatus.textContent = 'Audio unavailable. Model the sound or word aloud.'; finish(); }, { once: true });
      audio.play().catch(function () { audioStatus.textContent = 'Tap the speaker to play again, or model aloud.'; finish(); });
    });
  }
  function stopTimer() { clearInterval(timerId); timerId = 0; }
  function resetTimer(slide) {
    stopTimer();
    var button = slide && slide.querySelector('[data-timer-start]');
    if (!button) return;
    button.querySelector('.p-timer-face').textContent = slide.dataset.timer;
    button.style.setProperty('--t-deg', '360deg');
    button.setAttribute('aria-label', 'Start thinking time');
    button.setAttribute('aria-pressed', 'false');
  }
  function runTimer(button) {
    var slide = button.closest('.slide');
    if (timerId) { resetTimer(slide); return; }
    var total = Number(slide.dataset.timer) || 60, left = total;
    button.setAttribute('aria-label', 'Reset thinking time');
    button.setAttribute('aria-pressed', 'true');
    function paint() {
      button.querySelector('.p-timer-face').textContent = left;
      button.style.setProperty('--t-deg', (left / total * 360) + 'deg');
    }
    paint();
    timerId = setInterval(function () {
      left = Math.max(0, left - 1); paint();
      if (!left) { stopTimer(); button.setAttribute('aria-label', 'Restart thinking time'); button.setAttribute('aria-pressed', 'false'); }
    }, 1000);
  }

  function animateWriting(slide) {
    cancelAnimationFrame(writeRaf);
    var svg = slide.querySelector('.p-write-svg');
    if (!svg) return;
    var pencil = svg.querySelector('[data-pencil]');
    var paths = Array.from(svg.querySelectorAll('[data-write-stroke]')).map(function (path) {
      var length = Math.max(path.getTotalLength(), 0.6);
      path.style.strokeDasharray = length; path.style.strokeDashoffset = length;
      return { path: path, length: length, duration: Math.max(300, length / 130 * 1000) };
    });
    var i = 0, start = 0, pause = 0;
    function step(now) {
      var item = paths[i];
      if (!item) { if (pencil) pencil.style.opacity = 0; return; }
      if (pause && now < pause) { writeRaf = requestAnimationFrame(step); return; }
      if (pause) { pause = 0; start = 0; }
      if (!start) start = now;
      var t = Math.min(1, (now - start) / item.duration);
      item.path.style.strokeDashoffset = item.length * (1 - t);
      if (pencil) {
        var pt = item.path.getPointAtLength(item.length * t);
        pencil.setAttribute('transform', 'translate(' + (pt.x + Number(item.path.dataset.offset || 0)) + ',' + pt.y + ')');
        pencil.style.opacity = 1;
      }
      if (t >= 1) { i++; pause = now + 260; }
      writeRaf = requestAnimationFrame(step);
    }
    writeRaf = requestAnimationFrame(step);
  }
  function syncReveal(slide) {
    var button = slide.querySelector('[data-reveal-toggle]');
    if (!button) return;
    var revealed = slide.classList.contains('revealed');
    button.querySelector('span').textContent = button.dataset.revealKind === 'example'
      ? (revealed ? 'Hide the example' : 'Show an example')
      : (revealed ? 'Hide the answer' : 'Show the answer');
    button.setAttribute('aria-expanded', String(revealed));
    slide.querySelectorAll('.p-answer').forEach(function (answer) { answer.inert = !revealed; });
  }
  function cancelModel() {
    modelId++;
    document.querySelectorAll('.is-guided').forEach(function (node) { node.classList.remove('is-guided'); });
  }
  async function guideBlend(slide) {
    cancelModel(); stopAudio();
    var run = modelId;
    var parts = Array.from(slide.querySelectorAll('.p-compound .p-tile-btn, .p-compound .p-tile'));
    for (var part of parts) {
      if (run !== modelId) return;
      part.classList.add('is-guided');
      await Promise.all([playAudio(part.dataset.play), new Promise(function (resolve) { setTimeout(resolve, 650); })]);
      if (run !== modelId) return;
      part.classList.remove('is-guided');
    }
    if (run !== modelId) return;
    if (slide.hasAttribute('data-reveal')) { slide.classList.add('revealed'); syncReveal(slide); }
    var word = slide.querySelector('.p-made, .p-answer [data-play]');
    if (word) { word.classList.add('is-guided'); await playAudio(word.dataset.play); if (run === modelId) word.classList.remove('is-guided'); }
  }
  function resetBuild(slide) {
    var build = slide.querySelector('.p-build');
    if (!build) return;
    build.dataset.position = '0';
    build.querySelectorAll('.p-build-slot').forEach(function (slot, i) { slot.textContent = ''; slot.classList.remove('filled'); slot.setAttribute('aria-label', 'Spelling part ' + (i + 1)); });
    build.querySelectorAll('[data-build-part]').forEach(function (tile) { tile.disabled = false; });
    build.querySelector('.p-build-feedback').textContent = 'Say the word before you build it.';
  }
  function choosePart(button) {
    var build = button.closest('.p-build');
    var parts = JSON.parse(build.dataset.buildTarget);
    var position = Number(build.dataset.position || 0);
    var feedback = build.querySelector('.p-build-feedback');
    if (button.dataset.buildPart !== parts[position]) {
      feedback.textContent = 'Listen again. Which spelling part comes next?';
      button.classList.remove('try-again'); void button.offsetWidth; button.classList.add('try-again');
      return;
    }
    var slot = build.querySelectorAll('.p-build-slot')[position];
    slot.textContent = parts[position]; slot.classList.add('filled'); slot.setAttribute('aria-label', 'Spelling part ' + (position + 1) + ': ' + parts[position]);
    button.disabled = true; build.dataset.position = String(++position);
    feedback.textContent = position === parts.length ? 'You built ' + parts.join('') + '. Read the whole word.' : 'Now choose the next part.';
    var next = build.querySelector('[data-build-part]:not(:disabled)') || build.querySelector('[data-build-reset]');
    next.focus({ preventScroll: true });
  }
  function resetTracking(slide) {
    slide.dataset.trackPosition = '-1';
    slide.querySelectorAll('[data-track-word]').forEach(function (word) { word.classList.remove('is-guided'); word.removeAttribute('aria-current'); });
    var button = slide.querySelector('[data-track-next]'); if (button) { button.disabled = false; button.textContent = 'Point to the next word'; }
  }
  function trackNext(slide) {
    var words = Array.from(slide.querySelectorAll('[data-track-word]'));
    var position = Number(slide.dataset.trackPosition ?? -1) + 1;
    words.forEach(function (word, i) { word.classList.toggle('is-guided', i === position); if (i === position) word.setAttribute('aria-current', 'true'); else word.removeAttribute('aria-current'); });
    slide.dataset.trackPosition = position;
    if (position === words.length - 1) { var button = slide.querySelector('[data-track-next]'); button.disabled = true; button.textContent = 'Sentence complete'; }
  }

  var sectionOrder = [];
  slides.forEach(function (slide, i) {
    if (slide.dataset.section && !sectionOrder.some(function (entry) { return entry.name === slide.dataset.section; })) sectionOrder.push({ name: slide.dataset.section, index: i });
  });
  var pills = sectionOrder.map(function (entry) {
    var button = document.createElement('button'); button.type = 'button'; button.className = 'rail-pill'; button.textContent = entry.name;
    button.addEventListener('click', function () { show(entry.index); });
    document.getElementById('rail-sections').appendChild(button); return button;
  });
  function show(index, force) {
    index = Math.max(0, Math.min(slides.length - 1, Math.trunc(index)));
    if (!Number.isFinite(index) || (!force && index === idx)) return;
    idx = index; stopAudio(); cancelModel(); stopTimer(); cancelAnimationFrame(writeRaf);
    audioStatus.textContent = '';
    slides.forEach(function (slide, n) {
      slide.classList.toggle('active', n === idx); slide.classList.remove('revealed'); slide.inert = n !== idx;
      syncReveal(slide);
    });
    var current = slides[idx];
    resetTimer(current); resetBuild(current); resetTracking(current); animateWriting(current);
    document.getElementById('counter').textContent = (idx + 1) + ' / ' + slides.length;
    document.getElementById('prev').disabled = idx === 0;
    document.getElementById('next').disabled = idx === slides.length - 1;
    var progress = document.getElementById('lesson-progress');
    progress.setAttribute('aria-valuenow', String(idx + 1)); progress.firstElementChild.style.transform = 'scaleX(' + ((idx + 1) / slides.length) + ')';
    stage.classList.toggle('chromeless', !current.dataset.section);
    var section = sectionOrder.findIndex(function (entry) { return entry.name === current.dataset.section; });
    pills.forEach(function (pill, i) { pill.className = 'rail-pill' + (i === section ? ' on' : i < section ? ' done' : ''); if (i === section) pill.setAttribute('aria-current', 'step'); else pill.removeAttribute('aria-current'); });
    overview.querySelectorAll('[data-go-slide]').forEach(function (button, i) { button.setAttribute('aria-current', String(i === idx)); });
    if (started && current.dataset.audio) playAudio(current.dataset.audio);
    if (embedded) { window.parent.postMessage({ type: 'lp-present-preview', index: idx }, messageOrigin); }
    else {
      var message = { type: 'lp-present-slide', deckKey: deckKey, index: idx };
      try { if (window.opener) window.opener.postMessage(message, messageOrigin); liveChannel?.postMessage(message); } catch { /* closed teacher window */ }
    }
  }
  function closeOverview() { overview.hidden = true; document.getElementById('deck').inert = false; document.getElementById('overview-toggle').focus(); }
  function openOverview() { overview.hidden = false; document.getElementById('deck').inert = true; (overview.querySelector('[aria-current="true"]') || document.getElementById('overview-close')).focus(); }
  function toggleBlank() {
    blank.hidden = !blank.hidden;
    document.getElementById('deck').inert = !blank.hidden;
    document.getElementById('nav').inert = !blank.hidden;
    document.getElementById('rail').inert = !blank.hidden;
    if (!blank.hidden) { stopAudio(); stopTimer(); cancelModel(); cancelAnimationFrame(writeRaf); blank.focus(); }
    else document.getElementById('blank-toggle').focus();
  }
  function toggleFs() {
    try {
      var request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      if (request?.catch) request.catch(function () { /* windowed presentation stays usable */ });
    } catch { /* fullscreen unavailable */ }
  }
  document.addEventListener('keydown', function (event) {
    if (event.target.closest('input, select, textarea, [contenteditable]')) return;
    if (!blank.hidden) { if (event.key === 'Tab') { event.preventDefault(); blank.focus(); } if (event.key.toLowerCase() === 'b' || event.key === 'Escape') { event.preventDefault(); toggleBlank(); } return; }
    if (!overview.hidden) {
      if (event.key === 'Escape') { event.preventDefault(); closeOverview(); }
      if (event.key === 'Tab') {
        var items = Array.from(overview.querySelectorAll('button')); var first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('button, a')) return;
    if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); show(idx + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); show(idx - 1); }
    else if (event.key === 'Home') { event.preventDefault(); show(0); }
    else if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    else if (event.key.toLowerCase() === 'f') toggleFs();
    else if (event.key.toLowerCase() === 'b') toggleBlank();
    else if (event.key.toLowerCase() === 'o') openOverview();
    else if (event.key === 'Enter' && slides[idx].hasAttribute('data-reveal')) { event.preventDefault(); slides[idx].classList.toggle('revealed'); syncReveal(slides[idx]); }
  });
  document.addEventListener('click', function (event) {
    var target = event.target;
    var toggle = target.closest('[data-reveal-toggle]');
    if (toggle) { var slide = toggle.closest('.slide'); slide.classList.toggle('revealed'); syncReveal(slide); return; }
    var timer = target.closest('[data-timer-start]'); if (timer) { runTimer(timer); return; }
    var tile = target.closest('[data-build-part]'); if (tile) { choosePart(tile); return; }
    if (target.closest('[data-build-reset]')) { resetBuild(slides[idx]); return; }
    if (target.closest('[data-model-blend]')) { guideBlend(slides[idx]); return; }
    if (target.closest('[data-track-next]')) { trackNext(slides[idx]); return; }
    if (target.closest('[data-track-reset]')) { resetTracking(slides[idx]); return; }
    if (target.closest('[data-replay]')) { animateWriting(slides[idx]); return; }
    var audio = target.closest('[data-play]'); if (audio) { cancelModel(); playAudio(audio.dataset.play); return; }
    var jump = target.closest('[data-go-slide]'); if (jump) { closeOverview(); show(Number(jump.dataset.goSlide)); }
  });
  document.getElementById('prev').addEventListener('click', function () { show(idx - 1); });
  document.getElementById('next').addEventListener('click', function () { show(idx + 1); });
  document.getElementById('overview-toggle').addEventListener('click', openOverview);
  document.getElementById('overview-close').addEventListener('click', closeOverview);
  document.getElementById('blank-toggle').addEventListener('click', toggleBlank);
  blank.addEventListener('click', toggleBlank);
  document.getElementById('fullscreen-toggle').addEventListener('click', toggleFs);
  document.getElementById('startBtn').addEventListener('click', function () {
    started = true; document.getElementById('start').hidden = true; toggleFs(); show(initial, true); document.getElementById('next').focus();
  });
  window.addEventListener('message', function (event) {
    if (!embedded || event.source !== window.parent || event.origin !== messageOrigin) return;
    if (event.data?.type === 'lp-present-show' && typeof event.data.index === 'number') show(event.data.index);
  });
  window.addEventListener('pagehide', function () { stopAudio(); stopTimer(); cancelModel(); cancelAnimationFrame(writeRaf); liveChannel?.close(); });
  if (embedded) { document.getElementById('start').hidden = true; document.body.classList.add('embedded'); }
  show(initial);
}());
