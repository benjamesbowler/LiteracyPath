// Same-origin external runtime: popup and srcdoc decks inherit the app CSP.
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var slides = Array.from(document.querySelectorAll('.slide'));
  var idx = -1, started = false, timerId = 0, writeRaf = 0, modelId = 0;
  var mediaState = "idle";
  var sessionId = document.body.dataset.sessionId || "";
  var quiet = document.body.dataset.quiet !== "false";
  var retrievalMode = document.body.dataset.retrievalMode || "retrieval";
  var handledCommands = new Set();
  var timerRun = null;
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
  try { liveChannel = new BroadcastChannel('lp-present-live:' + sessionId); } catch { /* optional projector status */ }

  function fitStage() {
    var nav=document.getElementById('nav'),rail=document.getElementById('rail');
    var top=embedded?0:(rail?.getBoundingClientRect().height || 52);
    var bottom=embedded?0:(nav?.getBoundingClientRect().height || 56);
    var available=Math.max(150,innerHeight-top-bottom);stage.style.top=(top+available/2)+'px';
    stage.style.transform = 'translate(-50%, -50%) scale(' + Math.min(innerWidth / 1920, available / 1080) + ')';
  }
  ['resize', 'orientationchange'].forEach(function (event) { window.addEventListener(event, fitStage); });
  document.addEventListener('fullscreenchange', fitStage);
  fitStage();

  // Teacher controls stay in viewport pixels while only the child canvas scales.
  ['rail','nav','overview','blank-screen','audio-status'].forEach(function (id) { var node = document.getElementById(id); if (node) document.body.append(node); });
  fitStage();
  var audioOwner = globalThis.createPresentAudioController({onStatus:function(state){
    mediaState = state;
    audioStatus.textContent = state === 'muted' ? 'Speech is muted. Turn speech on to replay this available recording.' : state === 'unavailable' ? 'Recording unavailable. Use the private spoken prompt, retry or skip.' : state === 'interrupted' ? 'Audio delivery interrupted. Replay deliberately, model aloud or skip.' : state === 'paused' ? 'Audio paused. Resume when the class is ready.' : '';
    publishStatus();
  }});
  audioOwner.setSpeechEnabled(document.body.dataset.speech !== 'false');
  audioOwner.setEffectsEnabled(false);
  document.body.classList.toggle('quiet-teaching',quiet);
  function hideBroken(img) {
    var slide = img.closest('.slide');
    if (!slide) return;
    if (img.classList.contains('p-pal') || img.classList.contains('p-book-cover')) { img.hidden = true; return; }
    img.dataset.mediaFailed = 'true';
    var panel = slide.querySelector('.p-media-failure');
    if (!panel) {
      panel = document.createElement('div'); panel.className = 'p-media-failure'; panel.setAttribute('role','status');
      panel.innerHTML = '<strong>Picture unavailable.</strong> This activity needs its picture. <button type="button" data-image-retry>Retry picture</button><button type="button" data-image-model>Teacher model with an object or description</button><button type="button" data-image-skip>Skip activity</button>';
      slide.append(panel);
    }
    slide.dataset.mediaInterrupted = 'true';
    slide.querySelectorAll('[data-choice-value],[data-build-part],[data-sort-item],[data-retell-event],[data-cooperate-choice]').forEach(function(button){ button.dataset.disabledForMedia='true'; button.disabled=true; });
    if (slide.classList.contains('active')) { mediaState='interrupted'; publishStatus(); }
  }
  document.addEventListener('error',function(event){if(event.target.tagName==='IMG')hideBroken(event.target);},true);
  Array.from(document.images).forEach(function(img){if(img.complete&&!img.naturalWidth)hideBroken(img);});
  function repairImage(slide,model) {
    if (model) {
      slide.dataset.mediaSupported='true'; slide.dataset.mediaInterrupted='false';
      slide.querySelectorAll('[data-disabled-for-media]').forEach(function(button){button.disabled=false;delete button.dataset.disabledForMedia;});
      var panel=slide.querySelector('.p-media-failure'); if(panel)panel.textContent='Teacher supplies the missing picture meaning. This response is supported; do not treat it as an independent picture response.';
      mediaState='teacher-model';publishStatus();return;
    }
    var images=Array.from(slide.querySelectorAll('[data-media-failed]'));
    images.forEach(function(img){
      img.addEventListener('load',function(){
        delete img.dataset.mediaFailed;
        if (!slide.querySelector('[data-media-failed]')) {
          slide.dataset.mediaInterrupted='false';slide.querySelector('.p-media-failure')?.remove();
          slide.querySelectorAll('[data-disabled-for-media]').forEach(function(button){button.disabled=false;delete button.dataset.disabledForMedia;});
          if(slide===slides[idx]){mediaState='restored';publishStatus();}
        }
      },{once:true});
      var src=img.src;img.src='';img.src=src;
    });
  }
  function stopAudio(){audioOwner.stop();}
  function playAudio(src){return audioOwner.play(src,'speech');}
  function stopTimer(){clearInterval(timerId);timerId=0;if(timerRun)timerRun.running=false;}
  function paintTimer(){
    if(!timerRun)return;
    var run=timerRun;run.button.querySelector('.p-timer-face').textContent=run.left;
    run.button.style.setProperty('--t-deg',(run.left/run.total*360)+'deg');
    run.button.setAttribute('aria-label',run.running?'Pause thinking time':run.left<run.total&&run.left>0?'Resume thinking time':run.left===0?'Restart thinking time':'Start thinking time');
    run.button.setAttribute('aria-pressed',String(run.running));publishStatus();
  }
  function resetTimer(slide){
    stopTimer();var button=slide&&slide.querySelector('[data-timer-start]');
    timerRun=button?{button:button,total:Number(slide.dataset.timer)||60,left:Number(slide.dataset.timer)||60,running:false}:null;
    paintTimer();
  }
  function pauseTimer(){stopTimer();paintTimer();}
  function runTimer(button){
    if(!timerRun||timerRun.button!==button)resetTimer(button.closest('.slide'));
    if(timerRun.running){pauseTimer();return;}
    if(!timerRun.left)timerRun.left=timerRun.total;
    timerRun.running=true;paintTimer();
    timerId=setInterval(function(){timerRun.left=Math.max(0,timerRun.left-1);if(!timerRun.left)stopTimer();paintTimer();},1000);
  }

  function selectWritingLetter(slide) {
    var svg = slide.querySelector('.p-write-svg');
    if (!svg) return;
    var letters = Array.from(svg.querySelectorAll('[data-writing-letter]'));
    if (!letters.length) return;
    var position = Number(slide.dataset.writingLetterIndex) || 0;
    var current = letters[position];
    letters.forEach(function (letter, index) { letter.toggleAttribute('hidden', index !== position); });
    svg.setAttribute('aria-label', 'Finger trace ' + current.dataset.writingLetter);
    var next = slide.querySelector('[data-writing-next-letter]');
    if (next) next.textContent = (position === letters.length - 1 ? 'First letter: ' : 'Next letter: ') + letters[(position + 1) % letters.length].dataset.writingLetter;
  }
  function resetWriting(slide) {
    cancelAnimationFrame(writeRaf);
    if (writingRun?.readyAudio) { writingRun.readyAudio.pause(); writingRun.readyAudio.currentTime = 0; }
    writingRun = null;
    var svg = slide.querySelector('.p-write-svg');
    if (!svg) return;
    selectWritingLetter(slide);
    var pencil = svg.querySelector('[data-pencil]');
    if (pencil) pencil.style.opacity = 0;
    svg.querySelectorAll('[data-write-stroke]').forEach(function (path) {
      var length = Math.max(path.getTotalLength(), 0.6);
      path.style.strokeDasharray = length; path.style.strokeDashoffset = length;
    });
    var status = slide.querySelector('[data-write-status]');
    if (status) status.textContent = 'Follow the numbered paths on screen, in the air or on your palm.';
    var watch = slide.querySelector('[data-replay] span');
    if (watch) {
      var letters = svg.querySelectorAll('[data-writing-letter]');
      var current = letters[Number(slide.dataset.writingLetterIndex) || 0];
      watch.textContent = 'Start ' + (slide.dataset.letterCase === 'upper' ? 'uppercase' : 'lowercase') + (letters.length > 1 ? ' ' + current.dataset.writingLetter : '');
    }
  }
  function stopWriting(slide) {
    if(writingRun)stopAudio();
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
    var letter=svg.querySelector('[data-writing-letter-index="'+(Number(slide.dataset.writingLetterIndex)||0)+'"]')||svg;
    var paths = Array.from(letter.querySelectorAll('[data-write-stroke]')).map(function (path) {
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
      run.readyPending=true;run.readyDeadline=Infinity;
      playAudio(slide.dataset.writingReadyAudio).then(function(result){
        if(writingRun!==run)return;
        run.readyPending=false;
        if(result.status!=='ended')audioStatus.textContent='Preparation cue was not delivered. Model the finger-ready instruction aloud.';
      });
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
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){endFinger();audioOwner.pause();pauseTimer();cancelModel();if(writingRun){writingRun.pausedAt=performance.now();cancelAnimationFrame(writeRaf);}}
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
      if(part.dataset.play){var delivery=await playAudio(part.dataset.play);if(delivery.status!=='ended')return;}else{audioStatus.textContent='Visual model: teacher says this multi-sound spelling chunk aloud.';await new Promise(function(resolve){setTimeout(resolve,650);});}
      if (run !== modelId) return;
      part.classList.remove('is-guided');
    }
    if (run !== modelId) return;
    if (slide.hasAttribute('data-reveal')) { slide.classList.add('revealed'); syncReveal(slide); }
    var word = slide.querySelector('.p-made, .p-answer [data-play]');
    if (word) { word.classList.add('is-guided'); await playAudio(word.dataset.play); if (run === modelId) word.classList.remove('is-guided'); }
  }
  function resetBuild(slide){
    var build=slide.querySelector('.p-build');if(!build)return;
    build.dataset.draft='[]';build.dataset.position='0';build.dataset.checked='false';
    build.querySelectorAll('.p-build-slot').forEach(function(slot,i){slot.textContent='';slot.classList.remove('filled');slot.setAttribute('aria-label','Spelling part '+(i+1));});
    build.querySelectorAll('[data-build-part]').forEach(function(tile){tile.disabled=slide.dataset.mediaInterrupted==='true';});
    build.querySelector('.p-build-feedback').textContent=build.dataset.supported==='true'?'Supported retry: keep the whole draft until Check.':'Listen, then build the whole draft before Check.';
  }
  function paintBuild(build){
    var draft=JSON.parse(build.dataset.draft||'[]');
    build.dataset.position=String(draft.length);
    build.querySelectorAll('.p-build-slot').forEach(function(slot,i){slot.textContent=draft[i]?.part||'';slot.classList.toggle('filled',Boolean(draft[i]));slot.setAttribute('aria-label','Spelling part '+(i+1)+(draft[i]?': '+draft[i].part:''));});
    build.querySelectorAll('[data-build-part]').forEach(function(tile){tile.disabled=draft.some(function(item){return item.id===tile.dataset.tileId;});});
  }
  function choosePart(button){
    var build=button.closest('.p-build');var parts=JSON.parse(build.dataset.buildTarget);var draft=JSON.parse(build.dataset.draft||'[]');
    if(draft.length>=parts.length)return;
    var feedback=build.querySelector('.p-build-feedback');
    if(build.dataset.attemptMode==='guided'){
      build.dataset.supported='true';
      if(button.dataset.buildPart!==parts[draft.length]){feedback.textContent='Guided model: say the sounds again and attend to the next spelling part.';return;}
    }
    draft.push({part:button.dataset.buildPart,id:button.dataset.tileId});build.dataset.draft=JSON.stringify(draft);paintBuild(build);
    feedback.textContent=draft.length===parts.length?'Your whole draft is ready. Check it when everyone has tried.':'Keep building your draft; errors remain until Check.';
    (build.querySelector('[data-build-part]:not(:disabled)')||build.querySelector('[data-build-check]')).focus({preventScroll:true});
  }
  function checkBuild(build){
    var parts=JSON.parse(build.dataset.buildTarget),draft=JSON.parse(build.dataset.draft||'[]');
    var feedback=build.querySelector('.p-build-feedback');
    if(draft.length!==parts.length){feedback.textContent='Finish the whole draft before Check.';return;}
    var errors=parts.map(function(part,i){return draft[i].part===part?-1:i;}).filter(function(i){return i>=0;});
    build.dataset.checked='true';
    feedback.textContent=!errors.length?'The spelling matches '+parts.join('')+'. Read it, then hide and write from memory.':errors.length===1&&errors[0]===1&&parts.length===3?'Keep your draft. Say the word again and listen to the middle sound; compare before repairing.':'Keep your draft. Say the sounds together and compare each spelling part before repairing.';
    if(errors.length)build.dataset.supported='true';
  }
  function undoBuild(build){var draft=JSON.parse(build.dataset.draft||'[]');draft.pop();build.dataset.draft=JSON.stringify(draft);paintBuild(build);build.querySelector('.p-build-feedback').textContent='Repair your draft, then check the whole word again.';}
  function modelBuild(build){
    var parts=JSON.parse(build.dataset.buildTarget);var used=new Set();
    var tiles=Array.from(build.querySelectorAll('[data-build-part]'));
    build.dataset.draft=JSON.stringify(parts.map(function(part){var tile=tiles.find(function(item){return item.dataset.buildPart===part&&!used.has(item.dataset.tileId);});if(tile)used.add(tile.dataset.tileId);return {part:part,id:tile?.dataset.tileId||'model'};}));
    build.dataset.supported='true';paintBuild(build);build.querySelector('.p-build-feedback').textContent='Supported model. Say, blend and read; hide it for a fresh written attempt.';
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
    if (position === words.length - 1) { var button = slide.querySelector('[data-track-next]'); button.disabled = true; button.textContent = 'Word pointer finished · discuss meaning'; }
  }

  function resetMatch(slide, fresh) {
    var game=slide.querySelector("[data-match-game]");
    if(fresh&&game){
      var cards=Array.from(game.querySelectorAll("[data-match-word]"));
      var cardKey=function(card){return card.querySelector('.p-card-word').textContent;};
      var values=Array.from(new Set(cards.map(cardKey)));
      var positions=function(list,value){return list.flatMap(function(card,i){return cardKey(card)===value?[i]:[];}).join(',');};
      var changed=function(list){return values.every(function(value){return positions(cards,value)!==positions(list,value);});};
      var shuffled=shuffleRuntime(cards);
      for(var attempt=0;attempt<12&&!changed(shuffled);attempt++)shuffled=shuffleRuntime(cards);
      if(values.length>1&&!changed(shuffled)){
        // Even an identity random shuffle must move every visible word. Group
        // and rotate into the original slots as a bounded deterministic fallback.
        var ordered=cards.map(function(card,index){return {card:card,index:index};}).sort(function(a,b){return cardKey(a.card).localeCompare(cardKey(b.card));});
        var largest=Math.max.apply(null,values.map(function(value){return cards.filter(function(card){return cardKey(card)===value;}).length;}));
        ordered.forEach(function(item,i){shuffled[item.index]=ordered[(i+largest)%ordered.length].card;});
      }
      shuffled.forEach(function(card){game.querySelector(".p-match-grid").append(card);});
    }
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
    if (first.dataset.matchWord !== card.dataset.matchWord || (game.dataset.matchKind === 'letters' && first.querySelector('.p-card-word').textContent === card.querySelector('.p-card-word').textContent)) {
      feedback.textContent = first.dataset.matchWord + ' and ' + card.dataset.matchWord + ' are different. Compare the letters, then choose another card.';
      if (game.dataset.matchKind === 'letters') feedback.textContent = 'Find the uppercase and lowercase forms of the same letter.';
      return;
    }
    [first, card].forEach(function (item) { item.classList.add('is-matched'); item.disabled = true; item.setAttribute('aria-label', 'Matched ' + item.dataset.matchWord); });
    feedback.textContent = game.querySelector('[data-match-word]:not(:disabled)')
      ? 'A pair of ' + card.dataset.matchWord + '. Everyone uses it in a spoken phrase before the next turn.' : 'Every pair found. Everyone uses one word in a new phrase; pairs are supported participation.';
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

  function statusMessage(){
    var current=slides[idx];
    return {type:'lp-present-slide',sessionId:sessionId,deckKey:deckKey,index:idx,count:slides.length,reveal:Boolean(current?.classList.contains('revealed')),mediaStatus:current?.dataset.mediaInterrupted==='true'?'interrupted':mediaState,timerRemaining:timerRun?.left??null,surface:embedded?'preview':'projector',embedded:embedded};
  }
  function publishStatus(){
    if(idx<0)return;
    var message=statusMessage();
    try{if(embedded)window.parent.postMessage(message,messageOrigin);else{if(window.opener)window.opener.postMessage(message,messageOrigin);liveChannel?.postMessage(message);}}catch{/* teacher window closed */}
  }
  function shuffleRuntime(items){
    var result=items.slice();for(var i=result.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var item=result[i];result[i]=result[j];result[j]=item;}return result;
  }
  function resetAdditional(slide){
    slide.querySelectorAll('.p-memory-model').forEach(function(node){node.hidden=false;});
    if(retrievalMode==='retrieval')slide.querySelectorAll('.p-memory-hint').forEach(function(node){node.hidden=true;});
    var svg=slide.querySelector('[data-trace-surface]');if(svg)svg.style.visibility='visible';
    slide.querySelectorAll('[data-counter-place]').forEach(function(button){button.setAttribute('aria-pressed','false');button.firstElementChild.textContent='';});
    var boxes=slide.querySelector('.p-sound-boxes');if(boxes)boxes.hidden=true;var tiles=slide.querySelector('[data-box-tiles]');if(tiles)tiles.hidden=true;
    var boxToggle=slide.querySelector('[data-box-reveal]');if(boxToggle)boxToggle.textContent='Show sound boxes';
    var meaning=slide.querySelector('.p-meaning-prompt');if(meaning)meaning.hidden=true;
    var vocabularyGame=slide.querySelector('[data-vocabulary-contrast]');if(vocabularyGame)paintVocabulary(vocabularyGame,'example');
    var studio=slide.querySelector('[data-sentence-studio]');if(studio){studio.dataset.position='0';paintStudio(studio);}
    var sort=slide.querySelector('[data-sort-game]');if(sort)resetSort(sort);
    var retell=slide.querySelector('[data-retell-game]');if(retell)resetRetell(retell);
    var review=slide.querySelector('[data-review-carousel]');if(review){review.dataset.position='0';paintReview(review);}
    var cooperate=slide.querySelector('[data-cooperate-game]');if(cooperate){cooperate.dataset.round='0';cooperate.querySelector('.p-packed-items').replaceChildren();paintCooperate(cooperate);}
    slide.querySelectorAll('[data-transfer-value]').forEach(function(button){button.disabled=false;button.classList.remove('is-correct');});
  }
  function paintVocabulary(game,phase){
    game.dataset.phase=phase;game.dataset.selected='';
    game.querySelector('[data-vocabulary-model]').hidden=phase!=='example';game.querySelector('[data-vocabulary-pair]').hidden=phase!=='contrast';game.querySelector('[data-vocabulary-fresh]').hidden=phase!=='retrieve';game.querySelector('[data-vocabulary-frame]').hidden=true;game.querySelector('[data-vocabulary-expressive]').hidden=phase!=='retrieve';
    var reveal=game.querySelector('[data-vocabulary-compare-reveal]');reveal.hidden=phase!=='contrast';reveal.disabled=true;
    game.querySelectorAll('[data-vocabulary-scene]').forEach(function(button){button.setAttribute('aria-pressed','false');});
    var prompt=game.querySelector('[data-vocabulary-prompt]');prompt.textContent=prompt.dataset[phase==='contrast'?'contrast':phase==='retrieve'?'retrieve':'example'];
  }
  function paintStudio(game){
    var bank=JSON.parse(game.dataset.studioSentences),card=bank[Number(game.dataset.position)||0];
    game.querySelector('.p-studio-print').textContent=card.sentence;var picture=game.querySelector('.p-studio-scene');picture.hidden=false;picture.src=card.imagePath;picture.alt=card.sceneRequirements;game.querySelector('[data-studio-prompt]').textContent=card.meaningPrompt;
  }
  function resetSort(game){
    game.dataset.selected='';game.querySelectorAll('[data-sort-item]').forEach(function(item){item.disabled=false;item.classList.remove('is-selected','is-sorted');item.setAttribute('aria-pressed','false');});
    game.querySelectorAll('[data-sort-placed]').forEach(function(node){node.replaceChildren();});
    game.querySelector('[data-sort-feedback]').textContent='Everyone sorts first. Select a card, then tap its group; explain the one rule.';
  }
  function chooseSort(game,bin){
    var item=game.querySelector('[data-sort-item="'+game.dataset.selected+'"]');if(!item)return;
    var feedback=game.querySelector('[data-sort-feedback]');
    if(item.dataset.sortGroup!==bin.dataset.sortBin){feedback.textContent='Keep this card. '+item.dataset.sortReason+' Explain the rule before trying another group.';return;}
    var placed=document.createElement('span');placed.textContent=item.dataset.sortWord;bin.querySelector('[data-sort-placed]').append(placed);item.disabled=true;item.classList.add('is-sorted');item.classList.remove('is-selected');game.dataset.selected='';
    feedback.textContent=item.dataset.sortReason+' Tell your partner why. '+(game.querySelector('[data-sort-item]:not(:disabled)')?'Choose the next card.':'All sorted; give a fresh example using this rule.');
  }
  function paintReview(game) {
    var cards=JSON.parse(game.dataset.reviewItems),position=Number(game.dataset.position)||0,card=cards[position];
    game.querySelector('.p-review-focus').textContent=card.text;
    var anchor=game.querySelector('[data-review-anchor]');
    if(anchor){var image=anchor.querySelector('img');image.hidden=!card.imagePath;if(card.imagePath)image.src=card.imagePath;else image.removeAttribute('src');image.alt=card.anchorWord||'';anchor.querySelector('[data-review-anchor-word]').textContent=card.anchorWord||'';anchor.hidden=!card.anchorWord;}
    var anchorHear=game.querySelector('[data-review-anchor-hear]');
    if(anchorHear){anchorHear.hidden=!card.anchorAudio;anchorHear.textContent='Hear '+(card.anchorWord||'picture');}
    game.querySelector('.p-review-count').textContent=(position+1)+' / '+cards.length;
    game.querySelector('[data-review-prev]').disabled=position===0;
    game.querySelector('[data-review-next]').disabled=position===cards.length-1;
    var variants=game.querySelector('[data-review-variants]');variants.replaceChildren();
    (card.variants||[]).forEach(function(variant){var button=document.createElement('button');button.type='button';button.className='p-audio';button.dataset.play=variant.src;button.textContent=variant.label;variants.append(button);});
  }
  function paintStory(game) {
    var story=JSON.parse(game.dataset.story),position=Number(game.dataset.storyPosition)||0,event=story.events[position];
    var picture=game.querySelector('[data-story-panel] img');picture.src=event.imagePath;picture.alt=event.sceneRequirements;
    game.querySelector('[data-story-text]').textContent=event.text;
    game.querySelector('[data-story-next]').textContent=position===story.events.length-1?'Put pictures in order':'Next scene';
    game.querySelector('[data-retell-feedback]').textContent=['First','Next','Later'][position]+': '+event.text;
  }
  function resetRetell(game){
    game.dataset.order='[]';game.dataset.storyPosition='0';game.dataset.support='three';
    game.querySelector('[data-story-panel]').hidden=false;game.querySelector('[data-story-actions]').hidden=false;game.querySelector('[data-story-sequence]').hidden=true;
    game.querySelectorAll('[data-retell-event]').forEach(function(button){button.disabled=false;button.querySelector('.p-story-position').textContent='';});
    game.querySelector('[data-retell-check]').disabled=true;paintStory(game);
  }
  function paintCooperate(game){
    var rounds=JSON.parse(game.dataset.cooperateRounds),round=rounds[Number(game.dataset.round)||0];if(!round)return;
    var bank=game.querySelector('.p-cooperate-choices');bank.replaceChildren();round.choices.forEach(function(word){var button=document.createElement('button');button.type='button';button.className='p-chip';button.dataset.cooperateChoice=word;button.textContent=word;bank.append(button);});
    game.dataset.settled='false';game.querySelector('[data-cooperate-next]').hidden=true;game.querySelector('[data-cooperate-feedback]').textContent='Everyone listens and points before a volunteer packs the requested item.';
  }
  function handleAdditionalClick(target){
    let slide=target.closest('.slide')||slides[idx];if(!slide)return false;
    if(target.closest('[data-audio-unavailable]')){stopAudio();mediaState='unavailable';audioStatus.textContent='This exact recording is unavailable. Your teacher models the private spoken prompt; replay has not delivered it.';publishStatus();return true;}
    if(target.closest('[data-image-retry]')){repairImage(slide,false);return true;}
    if(target.closest('[data-image-model]')){repairImage(slide,true);return true;}
    if(target.closest('[data-image-skip]')){show(idx+1);return true;}
    let build=target.closest('.p-build');
    if(target.closest('[data-build-check]')){checkBuild(build);return true;}
    if(target.closest('[data-build-undo]')){undoBuild(build);return true;}
    if(target.closest('[data-build-model]')){modelBuild(build);return true;}
    let mode=target.closest('[data-build-mode]');if(mode){let guided=build.dataset.attemptMode!=='guided';build.dataset.attemptMode=guided?'guided':'whole-word';if(guided)build.dataset.supported='true';mode.textContent=guided?'Use whole-attempt mode':'Use guided mode';resetBuild(slide);return true;}
    let counter=target.closest('[data-counter-place]');if(counter){let on=counter.getAttribute('aria-pressed')!=='true';counter.setAttribute('aria-pressed',String(on));counter.firstElementChild.textContent=on?'●':'';return true;}
    let box=target.closest('[data-box-reveal]');if(box){let boxes=slide.querySelector('.p-sound-boxes');boxes.hidden=!boxes.hidden;box.textContent=boxes.hidden?'Show sound boxes':'Hide sound boxes';return true;}
    if(target.closest('[data-box-tiles-toggle]')){let tiles=slide.querySelector('[data-box-tiles]');tiles.hidden=!tiles.hidden;return true;}
    let memory=target.closest('[data-memory-toggle]');if(memory){let models=slide.querySelectorAll('.p-memory-model'),hide=!models[0].hidden;models.forEach(function(node){node.hidden=hide;});memory.textContent=hide?'Uncover and compare':'Hide, write, compare';return true;}
    let formation=target.closest('[data-formation-hide]');if(formation){stopWriting(slide);clearFinger(slide);let svg=slide.querySelector('[data-trace-surface]');let hide=svg.style.visibility!=='hidden';svg.style.visibility=hide?'hidden':'visible';formation.querySelector('span').textContent=hide?'Reveal and compare your paper writing':'Hide, write on paper, compare';slide.querySelector('[data-write-status]').textContent=hide?'Everyone writes from memory on a whiteboard or paper. Teacher notices start, direction, sequence and legibility.':'Compare the real writing with the numbered model; no trace score is a handwriting result.';return true;}
    if(target.closest('[data-meaning-toggle]')){let meaning=slide.querySelector('.p-meaning-prompt');meaning.hidden=!meaning.hidden;return true;}
    let vocabularyScene=target.closest('[data-vocabulary-scene]');if(vocabularyScene){let game=vocabularyScene.closest('[data-vocabulary-contrast]');game.dataset.selected=vocabularyScene.dataset.vocabularyScene;game.querySelectorAll('[data-vocabulary-scene]').forEach(function(button){button.setAttribute('aria-pressed',String(button===vocabularyScene));});game.querySelector('[data-vocabulary-compare-reveal]').disabled=false;game.querySelector('[data-vocabulary-prompt]').textContent='Keep your chosen scene. Explain where the cat is before your teacher models.';return true;}
    let vocabularyReveal=target.closest('[data-vocabulary-compare-reveal]');if(vocabularyReveal){let game=vocabularyReveal.closest('[data-vocabulary-contrast]');game.querySelector('[data-vocabulary-prompt]').textContent=game.dataset.selected==='under'?'The cat below the table is under it. Tell how the other scene differs.':'Keep your selection to compare. This cat is on top. Under means below: find the cat below the tabletop.';game.dataset.supported='true';return true;}
    let vocabularyExpressive=target.closest('[data-vocabulary-expressive]');if(vocabularyExpressive){let game=vocabularyExpressive.closest('[data-vocabulary-contrast]');game.querySelector('[data-vocabulary-frame]').hidden=false;game.querySelector('[data-vocabulary-prompt]').textContent='Tell your partner where the dog is.';return true;}
    let vocabulary=target.closest('[data-vocabulary-step]');if(vocabulary){let game=vocabulary.closest('[data-vocabulary-contrast]');if(game)paintVocabulary(game,vocabulary.dataset.vocabularyStep);else{let prompt=slide.querySelector('[data-vocabulary-prompt]');prompt.textContent=prompt.dataset[vocabulary.dataset.vocabularyStep==='example'?'example':vocabulary.dataset.vocabularyStep==='contrast'?'contrast':'retrieve'];}return true;}
    let transfer=target.closest('[data-transfer-value]');if(transfer){let game=transfer.closest('[data-transfer-target]'),feedback=game.querySelector('[data-transfer-feedback]');feedback.textContent=transfer.dataset.transferValue===game.dataset.transferTarget?'This is '+game.dataset.transferTarget+'. Use it in a new spoken phrase; your teacher listens.':'Keep the choices. Replay and compare the print, then try again.';transfer.classList.toggle('is-correct',transfer.dataset.transferValue===game.dataset.transferTarget);return true;}
    let studio=target.closest('[data-sentence-studio]');
    if(target.closest('[data-studio-change]')){stopAudio();studio.dataset.position=String(1-(Number(studio.dataset.position)||0));paintStudio(studio);return true;}
    if(target.closest('[data-studio-scene]')){let picture=studio.querySelector('.p-studio-scene');picture.hidden=!picture.hidden;return true;}
    if(target.closest('[data-studio-hear]')){let card=JSON.parse(studio.dataset.studioSentences)[Number(studio.dataset.position)||0];playAudio(card.audioPath);return true;}
    let sort=target.closest('[data-sort-game]'),item=target.closest('[data-sort-item]');
    if(item){sort.dataset.selected=item.dataset.sortItem;sort.querySelectorAll('[data-sort-item]').forEach(function(card){card.classList.toggle('is-selected',card===item);card.setAttribute('aria-pressed',String(card===item));});sort.querySelector('[data-sort-feedback]').textContent='Everyone chooses its group before the board turn.';return true;}
    let bin=target.closest('[data-sort-bin]');if(bin){chooseSort(sort,bin);return true;}
    if(target.closest('[data-movement-toggle]')){let rule=slide.querySelector('[data-movement-rule]');rule.hidden=!rule.hidden;return true;}
    if(target.closest('[data-sort-reset]')){resetSort(sort);return true;}
    let review=target.closest('[data-review-carousel]');
    if(target.closest('[data-review-prev],[data-review-next]')){stopAudio();review.dataset.position=String(Number(review.dataset.position||0)+(target.closest('[data-review-prev]')?-1:1));paintReview(review);return true;}
    if(target.closest('[data-review-hear]')){let card=JSON.parse(review.dataset.reviewItems)[Number(review.dataset.position)||0];playAudio(card.audio);return true;}
    if(target.closest('[data-review-anchor-hear]')){let card=JSON.parse(review.dataset.reviewItems)[Number(review.dataset.position)||0];playAudio(card.anchorAudio);return true;}
    let retell=target.closest('[data-retell-game]'),scene=target.closest('[data-retell-event]');
    if(target.closest('[data-story-next]')){stopAudio();let story=JSON.parse(retell.dataset.story),position=Number(retell.dataset.storyPosition)||0;if(position<story.events.length-1){retell.dataset.storyPosition=String(position+1);paintStory(retell);}else{retell.querySelector('[data-story-panel]').hidden=true;retell.querySelector('[data-story-actions]').hidden=true;retell.querySelector('[data-story-sequence]').hidden=false;retell.querySelector('[data-retell-feedback]').textContent='Choose first, next and last.';}return true;}
    if(target.closest('[data-story-hear]')){let story=JSON.parse(retell.dataset.story);playAudio(story.events[Number(retell.dataset.storyPosition)||0].audioPath);return true;}
    if(scene){let order=JSON.parse(retell.dataset.order||'[]');order.push(scene.dataset.retellEvent);retell.dataset.order=JSON.stringify(order);scene.disabled=true;scene.querySelector('.p-story-position').textContent=String(order.length);retell.querySelector('[data-retell-check]').disabled=order.length!==3;return true;}
    if(target.closest('[data-retell-check]')){let order=JSON.parse(retell.dataset.order||'[]'),expected=JSON.parse(retell.dataset.story).events.map(event=>event.id);retell.querySelector('[data-retell-feedback]').textContent=JSON.stringify(order)===JSON.stringify(expected)?'First plant, next water, later a sprout. Tell the story together.':'Look at your order. What happened first? Tap Again to try.';return true;}
    if(target.closest('[data-retell-reset]')){resetRetell(retell);return true;}
    let cooperate=target.closest('[data-cooperate-game]');
    if(target.closest('[data-cooperate-hear]')){let round=JSON.parse(cooperate.dataset.cooperateRounds)[Number(cooperate.dataset.round)||0];playAudio(round.audio);return true;}
    let choice=target.closest('[data-cooperate-choice]');if(choice){let rounds=JSON.parse(cooperate.dataset.cooperateRounds),position=Number(cooperate.dataset.round)||0,round=rounds[position],feedback=cooperate.querySelector('[data-cooperate-feedback]');if(cooperate.dataset.settled==='true')return true;if(choice.dataset.cooperateChoice!==round.target){feedback.textContent='Our Pal can wait. Replay and read the labels together; explain your choice.';return true;}let packed=document.createElement('img');packed.src=round.image;packed.alt='Packed '+round.target;cooperate.querySelector('.p-packed-items').append(packed);cooperate.dataset.settled='true';feedback.textContent=round.target+' is packed. Explain how it helps. '+(position===rounds.length-1?'All three useful items packed. Try the fresh exit response.':'Then choose Next item.');cooperate.querySelector('[data-cooperate-next]').hidden=position===rounds.length-1;return true;}
    if(target.closest('[data-cooperate-next]')){cooperate.dataset.round=String(Number(cooperate.dataset.round)+1);paintCooperate(cooperate);return true;}
    if(target.closest('[data-cooperate-reset]')){cooperate.dataset.round='0';cooperate.querySelector('.p-packed-items').replaceChildren();paintCooperate(cooperate);return true;}
    return false;
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
    if (writingRun) stopWriting(slides[idx]);
    endFinger();
    idx = index; stopAudio(); cancelModel(); stopTimer(); cancelAnimationFrame(writeRaf); writingRun = null;
    audioStatus.textContent = '';
    slides.forEach(function (slide, n) {
      slide.classList.toggle('active', n === idx); slide.classList.remove('revealed'); slide.inert = n !== idx;
      syncReveal(slide);
    });
    var current = slides[idx];
    current.dataset.writingLetterIndex = '0';
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
    if(started&&retrievalMode==='model'&&current.dataset.audio)playAudio(current.dataset.audio);
    resetAdditional(current);
    if(current.dataset.mediaInterrupted==='true')current.querySelectorAll('[data-choice-value],[data-build-part],[data-sort-item],[data-retell-event],[data-cooperate-choice]').forEach(function(button){button.disabled=true;});
    if (embedded) { window.parent.postMessage({ type: 'lp-present-preview', sessionId:sessionId, deckKey:deckKey, index:idx },messageOrigin);publishStatus(); }
    else {
      var message = statusMessage();
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
    if (!blank.hidden) { audioOwner.pause(); pauseTimer(); cancelModel(); if (writingRun) { writingRun.pausedAt = performance.now(); writingRun.readyAudio?.pause(); cancelAnimationFrame(writeRaf); } blank.focus(); }
    else { audioOwner.resume(); if (writingRun?.resume) { var run = writingRun; if (run.readyPending) audioOwner.resume(); writeRaf = requestAnimationFrame(run.resume); } document.getElementById('blank-toggle').focus(); }
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
    else if (event.key === 'Enter' && slides[idx].hasAttribute('data-reveal')) {event.preventDefault();slides[idx].classList.toggle('revealed');syncReveal(slides[idx]);publishStatus();}
  });
  document.addEventListener('click', function (event) {
    var target = event.target;
    if(handleAdditionalClick(target))return;
    var toggle = target.closest('[data-reveal-toggle]');
    if(toggle){var slide=toggle.closest('.slide');slide.classList.toggle('revealed');syncReveal(slide);publishStatus();return;}
    var timer = target.closest('[data-timer-start]'); if (timer) { runTimer(timer); return; }
    var match = target.closest('[data-match-word]'); if (match) { chooseMatch(match); return; }
    if (target.closest('[data-match-reset]')) { resetMatch(slides[idx],true); return; }
    var choice = target.closest('[data-choice-value]'); if (choice) { choosePicture(choice); return; }
    if (target.closest('[data-trace-clear]')) { clearFinger(slides[idx]); return; }
    if (target.closest('[data-writing-next-letter]')) {
      var writingSlide = slides[idx];
      stopWriting(writingSlide); clearFinger(writingSlide);
      var count = writingSlide.querySelectorAll('[data-writing-letter]').length;
      writingSlide.dataset.writingLetterIndex = String(((Number(writingSlide.dataset.writingLetterIndex) || 0) + 1) % count);
      resetWriting(writingSlide);
      return;
    }
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
  function handleCommand(message){
    if(!message||message.sessionId!==sessionId||message.deckKey!==deckKey)return;
    if(message.commandId){if(handledCommands.has(message.commandId))return;handledCommands.add(message.commandId);if(handledCommands.size>200)handledCommands.delete(handledCommands.values().next().value);}
    if(message.type==='lp-present-show'&&typeof message.index==='number'){show(message.index);return;}
    if(message.type!=='lp-present-command')return;
    var command=message.command,value=message.value;
    if(command==='next')show(idx+1);else if(command==='prev')show(idx-1);else if(command==='show')show(Number(value));
    else if(command==='reveal'){slides[idx].classList.toggle('revealed');syncReveal(slides[idx]);}
    else if(command==='blank')toggleBlank();else if(command==='stop-audio'){stopAudio();cancelModel();}
    else if(command==='resume'){audioOwner.resume();if(writingRun?.resume){writeRaf=requestAnimationFrame(writingRun.resume);}}
    else if(command==='quiet'){quiet=Boolean(value);document.body.classList.toggle('quiet-teaching',quiet);audioOwner.setEffectsEnabled(false);}
    else if(command==='speech')audioOwner.setSpeechEnabled(value);
    else if(command==='retrieval'){retrievalMode=value==='model'?'model':'retrieval';}
    publishStatus();
  }
  window.addEventListener('message',function(event){if(event.origin!==messageOrigin)return;if(embedded&&event.source!==window.parent)return;if(!embedded&&event.source!==window.opener)return;handleCommand(event.data);});
  if(liveChannel)liveChannel.addEventListener('message',function(event){if(!embedded)handleCommand(event.data);});
  window.addEventListener('pagehide', function () { var disconnected=statusMessage();disconnected.disconnected=true;try{if(window.opener)window.opener.postMessage(disconnected,messageOrigin);if(!embedded)liveChannel?.postMessage(disconnected);}catch{/* closing */} endFinger(); stopAudio(); stopTimer(); cancelModel(); if (writingRun) stopWriting(slides[idx]); cancelAnimationFrame(writeRaf); liveChannel?.close(); });
  if (embedded) { document.getElementById('start').hidden = true; document.body.classList.add('embedded'); }
  show(initial);
}());
