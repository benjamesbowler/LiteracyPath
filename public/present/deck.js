// Same-origin external runtime: popup and srcdoc decks inherit the app CSP.
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var slides = Array.from(document.querySelectorAll('.slide'));
  var idx = -1, started = false, timerId = 0, writeRaf = 0, modelId = 0;
  var activeAudio = null, resolveAudio = null;
  var writingRun = null;
  var fingerRun = null;
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

  function resetWriting(slide) {
    cancelAnimationFrame(writeRaf);
    if (writingRun?.readyAudio) { writingRun.readyAudio.pause(); writingRun.readyAudio.currentTime = 0; }
    writingRun = null;
    var svg = slide.querySelector('.p-write-svg');
    if (!svg) return;
    var pencil = svg.querySelector('[data-pencil]');
    if (pencil) pencil.style.opacity = 0;
    svg.querySelectorAll('[data-write-stroke]').forEach(function (path) {
      var length = Math.max(path.getTotalLength(), 0.6);
      path.style.strokeDasharray = length; path.style.strokeDashoffset = length;
    });
    var status = slide.querySelector('[data-write-status]');
    if (status) status.textContent = 'Follow the numbered paths on screen, in the air or on your palm.';
    var watch = slide.querySelector('[data-replay] span');
    if (watch) watch.textContent = 'Watch the pencil';
  }
  function stopWriting(slide) {
    cancelAnimationFrame(writeRaf);
    if (writingRun?.readyAudio) { writingRun.readyAudio.pause(); writingRun.readyAudio.currentTime = 0; }
    writingRun = null;
    var pencil = slide.querySelector('[data-pencil]');
    if (pencil) pencil.style.opacity = 0;
    var status = slide.querySelector('[data-write-status]');
    if (status) status.textContent = 'Stopped. Watch again when you are ready.';
    var watch = slide.querySelector('[data-replay] span');
    if (watch) watch.textContent = 'Watch again';
  }
  function animateWriting(slide, together) {
    clearFinger(slide);
    resetWriting(slide);
    var svg = slide.querySelector('.p-write-svg');
    if (!svg) return;
    var pencil = svg.querySelector('[data-pencil]');
    var status = slide.querySelector('[data-write-status]');
    var paths = Array.from(svg.querySelectorAll('[data-write-stroke]')).map(function (path) {
      var length = Math.max(path.getTotalLength(), 0.6);
      path.style.strokeDasharray = length; path.style.strokeDashoffset = length;
      var minimum = together ? 1800 : 1200, maximum = together ? 2500 : 2000;
      return { path: path, length: length, duration: length < 2 ? 800 : Math.min(maximum, Math.max(minimum, length / (together ? 45 : 65) * 1000)) };
    });
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var run = { preparedAt: performance.now() + 3000, pausedAt: 0, resume: null, readyPending: false, readyAudio: null, readyDeadline: 0 };
    writingRun = run;
    stopAudio();
    if (slide.dataset.writingReadyAudio) {
      var readyAudio = new Audio(slide.dataset.writingReadyAudio);
      run.readyAudio = readyAudio; run.readyPending = true; run.readyDeadline = performance.now() + 15000;
      function readyFinished(failed) {
        if (writingRun !== run) return;
        readyAudio.pause(); run.readyPending = false;
        if (failed) audioStatus.textContent = 'Preparation audio unavailable. Model the finger-ready instruction aloud.';
      }
      readyAudio.addEventListener('playing', function () {
        var duration = Number(readyAudio.duration);
        run.readyDeadline = performance.now() + (Number.isFinite(duration) && duration > 0 ? Math.max(5000, duration * 1000 + 2000) : 15000);
      });
      readyAudio.addEventListener('ended', function () { readyFinished(false); }, { once: true });
      readyAudio.addEventListener('error', function () { readyFinished(true); }, { once: true });
      readyAudio.play().catch(function () { readyFinished(true); });
      run.finishReady = readyFinished;
    }
    var i = 0, start = 0, pause = 0;
    function step(now) {
      run.resume = step;
      if (writingRun !== run) return;
      if (!blank.hidden) { run.pausedAt = now; run.resume = step; return; }
      if (run.pausedAt) {
        var hiddenFor = now - run.pausedAt;
        run.preparedAt += hiddenFor; if (start) start += hiddenFor; if (pause) pause += hiddenFor;
        run.readyDeadline += hiddenFor;
        run.pausedAt = 0;
      }
      if (run.readyPending && now >= run.readyDeadline) run.finishReady(true);
      if (now < run.preparedAt || run.readyPending) {
        if (status) status.textContent = now < run.preparedAt ? 'Finger ready… ' + Math.ceil((run.preparedAt - now) / 1000) : 'Finger ready… listen to the instruction.';
        writeRaf = requestAnimationFrame(step); return;
      }
      var item = paths[i];
      if (!item) { if (pencil) pencil.style.opacity = 0; if (status) status.textContent = 'Your turn. Draw it in the air, or watch again.'; var watch = slide.querySelector('[data-replay] span'); if (watch) watch.textContent = 'Watch again'; writingRun = null; return; }
      if (pause && now < pause) { writeRaf = requestAnimationFrame(step); return; }
      if (pause) { pause = 0; start = 0; }
      if (!start) start = now;
      if (status) status.textContent = (together ? 'Write with me. ' : 'Watch the pencil. ') + 'Part ' + (i + 1) + ' of ' + paths.length;
      var t = Math.min(1, (now - start) / item.duration);
      item.path.style.strokeDashoffset = item.length * (1 - (reduced ? t >= 1 ? 1 : 0 : t));
      if (pencil && !reduced) {
        var pt = item.path.getPointAtLength(item.length * t);
        pencil.setAttribute('transform', 'translate(' + (pt.x + Number(item.path.dataset.offset || 0)) + ',' + pt.y + ')');
        pencil.style.opacity = 1;
      }
      if (t >= 1) { i++; pause = now + 600; }
      writeRaf = requestAnimationFrame(step);
    }
    run.resume = step;
    writeRaf = requestAnimationFrame(step);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) endFinger();
    if (!writingRun) return;
    if (document.hidden) { writingRun.pausedAt = performance.now(); writingRun.readyAudio?.pause(); cancelAnimationFrame(writeRaf); }
    else if (writingRun.resume) {
      var run = writingRun;
      if (run.readyPending) run.readyAudio.play().catch(function () { if (writingRun === run) run.finishReady(true); });
      writeRaf = requestAnimationFrame(writingRun.resume);
    }
  });
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

  function resetMatch(slide) {
    slide.querySelectorAll('[data-match-word]').forEach(function (card, i) {
      card.disabled = false; card.classList.remove('is-open', 'is-matched');
      card.querySelector('.p-card-word').hidden = true; card.querySelector('.p-card-back').hidden = false;
      card.setAttribute('aria-label', 'Card ' + (i + 1));
    });
    var feedback = slide.querySelector('[data-match-feedback]');
    if (feedback) feedback.textContent = 'Read each word as it turns over.';
  }
  function chooseMatch(card) {
    var game = card.closest('[data-match-game]');
    if (card.disabled || card.classList.contains('is-open')) return;
    var open = Array.from(game.querySelectorAll('.is-open:not(.is-matched)'));
    if (open.length === 2) {
      open.forEach(function (item) {
        item.classList.remove('is-open'); item.querySelector('.p-card-word').hidden = true;
        item.querySelector('.p-card-back').hidden = false;
        item.setAttribute('aria-label', 'Card ' + (Array.from(game.querySelectorAll('[data-match-word]')).indexOf(item) + 1));
      });
      open = [];
    }
    card.classList.add('is-open'); card.querySelector('.p-card-word').hidden = false;
    card.querySelector('.p-card-back').hidden = true; card.setAttribute('aria-label', card.dataset.matchWord);
    var feedback = game.querySelector('[data-match-feedback]');
    if (!open.length) { feedback.textContent = 'Read ' + card.dataset.matchWord + '. Find the same word.'; return; }
    var first = open[0];
    if (first.dataset.matchWord !== card.dataset.matchWord) {
      feedback.textContent = first.dataset.matchWord + ' and ' + card.dataset.matchWord + ' are different. Compare the letters, then choose another card.';
      return;
    }
    [first, card].forEach(function (item) { item.classList.add('is-matched'); item.disabled = true; item.setAttribute('aria-label', 'Matched ' + item.dataset.matchWord); });
    feedback.textContent = game.querySelector('[data-match-word]:not(:disabled)')
      ? 'A pair of ' + card.dataset.matchWord + '! Find another pair.' : 'Every pair found! Read all the words together.';
    (game.querySelector('[data-match-word]:not(:disabled)') || game.querySelector('[data-match-reset]')).focus({ preventScroll: true });
  }
  function resetChoice(slide) {
    slide.querySelectorAll('[data-choice-value]').forEach(function (button) { button.disabled = false; button.classList.remove('is-correct', 'try-again'); });
    var feedback = slide.querySelector('[data-choice-feedback]');
    if (feedback) feedback.textContent = 'Read the words. Point to your choice.';
  }
  function choosePicture(button) {
    var game = button.closest('[data-choice-target]');
    var feedback = game.querySelector('[data-choice-feedback]');
    if (button.dataset.choiceValue !== game.dataset.choiceTarget) {
      feedback.textContent = 'You chose ' + button.dataset.choiceValue + '. Look at the picture again. Read all three words and try again.';
      button.classList.remove('try-again'); void button.offsetWidth; button.classList.add('try-again'); return;
    }
    button.classList.add('is-correct');
    feedback.textContent = 'Yes — ' + game.dataset.choiceTarget + '! Say it and read it together.';
    // Keep the completed choice focusable for a keyboard user.
    game.querySelectorAll('[data-choice-value]').forEach(function (choice) { choice.disabled = choice !== button; });
  }
  function endFinger() {
    if (fingerRun && fingerRun.svg.hasPointerCapture(fingerRun.id)) fingerRun.svg.releasePointerCapture(fingerRun.id);
    fingerRun = null;
  }
  function clearFinger(slide) {
    endFinger();
    var ink = slide.querySelector('[data-trace-ink]');
    if (ink) ink.replaceChildren();
  }
  document.querySelectorAll('[data-trace-surface]').forEach(function (svg) {
    svg.querySelectorAll('g[data-trace-ink]').forEach(function (ink) { ink.setAttribute('aria-hidden', 'true'); });
    svg.querySelectorAll('g').forEach(function (group) {
      group.querySelectorAll('.p-ghost-stroke').forEach(function (path, i) {
        var pt = path.getPointAtLength(0);
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('r', '6'); dot.setAttribute('class', 'p-stroke-start');
        var number = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        number.setAttribute('x', pt.x); number.setAttribute('y', pt.y + 2); number.setAttribute('class', 'p-stroke-number'); number.textContent = String(i + 1);
        group.append(dot, number);
      });
    });
    function point(event) {
      var matrix = svg.getScreenCTM();
      if (!matrix) return null;
      return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    }
    svg.addEventListener('pointerdown', function (event) {
      if (!svg.closest('.slide.active') || !blank.hidden || !overview.hidden || (event.pointerType === 'mouse' && event.button !== 0)) return;
      var pt = point(event); if (!pt) return;
      event.preventDefault(); endFinger(); stopWriting(svg.closest('.slide')); stopAudio();
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'p-finger-stroke'); path.setAttribute('d', 'M' + pt.x + ' ' + pt.y + ' l0.01 0');
      svg.querySelector('[data-trace-ink]').append(path);
      svg.setPointerCapture(event.pointerId); fingerRun = { svg: svg, path: path, id: event.pointerId };
      svg.closest('.slide').querySelector('[data-write-status]').textContent = 'Trace the paths. Lift your finger between strokes.';
    });
    svg.addEventListener('pointermove', function (event) {
      if (!fingerRun || fingerRun.svg !== svg || fingerRun.id !== event.pointerId) return;
      var pt = point(event); if (!pt) return;
      event.preventDefault(); fingerRun.path.setAttribute('d', fingerRun.path.getAttribute('d') + ' L' + pt.x + ' ' + pt.y);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) { svg.addEventListener(name, function (event) { if (fingerRun?.id === event.pointerId) endFinger(); }); });
  });

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
    if (writingRun) stopWriting(slides[idx]);
    endFinger();
    idx = index; stopAudio(); cancelModel(); stopTimer(); cancelAnimationFrame(writeRaf); writingRun = null;
    audioStatus.textContent = '';
    slides.forEach(function (slide, n) {
      slide.classList.toggle('active', n === idx); slide.classList.remove('revealed'); slide.inert = n !== idx;
      syncReveal(slide);
    });
    var current = slides[idx];
    resetTimer(current); resetBuild(current); resetTracking(current); resetWriting(current);
    resetMatch(current); resetChoice(current); clearFinger(current);
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
    endFinger();
    blank.hidden = !blank.hidden;
    document.getElementById('deck').inert = !blank.hidden;
    document.getElementById('nav').inert = !blank.hidden;
    document.getElementById('rail').inert = !blank.hidden;
    if (!blank.hidden) { stopAudio(); stopTimer(); cancelModel(); if (writingRun) { writingRun.pausedAt = performance.now(); writingRun.readyAudio?.pause(); cancelAnimationFrame(writeRaf); } blank.focus(); }
    else { if (writingRun?.resume) { var run = writingRun; if (run.readyPending) run.readyAudio.play().catch(function () { if (writingRun === run) run.finishReady(true); }); writeRaf = requestAnimationFrame(run.resume); } document.getElementById('blank-toggle').focus(); }
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
    var match = target.closest('[data-match-word]'); if (match) { chooseMatch(match); return; }
    if (target.closest('[data-match-reset]')) { resetMatch(slides[idx]); return; }
    var choice = target.closest('[data-choice-value]'); if (choice) { choosePicture(choice); return; }
    if (target.closest('[data-trace-clear]')) { clearFinger(slides[idx]); return; }
    var tile = target.closest('[data-build-part]'); if (tile) { choosePart(tile); return; }
    if (target.closest('[data-build-reset]')) { resetBuild(slides[idx]); return; }
    if (target.closest('[data-model-blend]')) { guideBlend(slides[idx]); return; }
    if (target.closest('[data-track-next]')) { trackNext(slides[idx]); return; }
    if (target.closest('[data-track-reset]')) { resetTracking(slides[idx]); return; }
    if (target.closest('[data-replay]')) { animateWriting(slides[idx]); return; }
    if (target.closest('[data-write-together]')) { animateWriting(slides[idx], true); return; }
    if (target.closest('[data-writing-stop]')) { stopWriting(slides[idx]); return; }
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
  window.addEventListener('pagehide', function () { endFinger(); stopAudio(); stopTimer(); cancelModel(); if (writingRun) stopWriting(slides[idx]); cancelAnimationFrame(writeRaf); liveChannel?.close(); });
  if (embedded) { document.getElementById('start').hidden = true; document.body.classList.add('embedded'); }
  show(initial);
}());
