// Teacher-paced, unscored class games. The deck owns navigation and audio.
(function (root) {
  'use strict';
  // Shared with the deck's spelling, matching and choice activities. Colour is
  // paired with an explicit symbol and live text; none of this records a score.
  root.setPresentOutcome = function (node, state) {
    if (!node) return;
    state = state || 'neutral';
    node.dataset.feedback = state;
    node.classList.toggle('is-correct', state === 'correct');
    node.classList.toggle('is-incorrect', state === 'incorrect');
    node.classList.toggle('is-revealed', state === 'revealed');
  };
  root.setPresentFeedback = function (node, value, state) {
    if (!node) return;
    root.setPresentOutcome(node, state);
    node.classList.add('p-feedback');
    node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); node.setAttribute('aria-atomic', 'true');
    var prefix = state === 'correct' ? '✓ Correct. ' : state === 'incorrect' ? '✕ Try again. ' : state === 'revealed' ? '✓ Revealed. ' : '';
    node.textContent = prefix + value;
  };
  root.createPresentClassGames = function (options) {
    options = options || {};
    var playAudio = options.playAudio || function () {};
    var stopAudio = options.stopAudio || function () {};
    var active = null, run = null, interval = null, timerGeneration = 0;
    function find(selector) { return active && active.querySelector(selector); }
    function all(selector) { return active ? Array.from(active.querySelectorAll(selector)) : []; }
    function text(selector, value) { var node = find(selector); if (node) node.textContent = value; }
    function hidden(selector, value) { var node = find(selector); if (node) node.hidden = value; }
    function disabled(selector, value) { all(selector).forEach(function (node) { node.disabled = value; }); }
    function feedback(selector, value, state) { root.setPresentFeedback(find(selector), value, state); }
    function parse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
    function clearTimer() { timerGeneration += 1; if (interval !== null) clearInterval(interval); interval = null; }
    function cancel() { clearTimer(); if (active) stopAudio(); active = null; run = null; }
    function picture(selector, src) {
      var node = find(selector);
      if (node) { node.src = src; node.alt = 'Look at the picture.'; }
    }
    function progress(kind, cards) {
      var card = cards[run.index] || {};
      var label = card.reviewCycle ? 'Remember cycle ' + card.reviewCycle : card.roundRole === 'earlier-review' ? 'Remember earlier words' : "This week's practice";
      text('[data-' + kind + '-progress]', 'Round ' + (run.index + 1) + ' of ' + cards.length + ' · ' + label);
      text('[data-' + kind + '-next]', run.index === cards.length - 1 ? 'Play again' : kind === 'scramble' ? 'Next sentence' : 'Next round');
    }
    function detectiveRound() {
      var card = run.cards[run.index];
      if (!card) return;
      run.answered = false; run.repaired = false;
      progress('detective', run.cards);
      active.dataset.round = String(run.index);
      picture('[data-detective-image]', card.imagePath);
      text('[data-detective-sentence]', card.sentence);
      feedback('[data-detective-feedback]', 'Is the sentence true or false for this picture?');
      all('[data-detective-answer]').forEach(function (node) { node.setAttribute('aria-pressed', 'false'); root.setPresentOutcome(node); });
      disabled('[data-detective-repair],[data-detective-next]', true);
      hidden('[data-detective-hear]', !card.audioPath);
    }
    function missingRound() {
      if (run.rounds.length) {
        var card = run.rounds[run.index]; run.items = card.items;
        var board = find('[data-missing-board]');
        if (board) board.replaceChildren(...run.items.map(function (item, index) {
          var node = active.ownerDocument.createElement('span');
          node.setAttribute('data-missing-item', String(index)); return node;
        }));
        progress('missing', run.rounds);
      }
      active.dataset.round = String(run.index);
      run.concealed = false; run.revealed = false;
      all('[data-missing-item]').forEach(function (node) {
        var item = run.items[Number(node.dataset.missingItem)];
        node.textContent = item ? item.text : '';
        root.setPresentOutcome(node);
        node.removeAttribute('aria-label'); node.removeAttribute('title');
      });
      disabled('[data-missing-hide]', false);
      disabled('[data-missing-reveal],[data-missing-next]', true);
      feedback('[data-missing-feedback]', 'Read them together. Then hide one.');
    }
    function scrambleModel() {
      clearTimer(); stopAudio();
      if (run.cards.length) run.card = run.cards[run.index];
      run.words = String(run.card.sentence).trim().split(/\s+/).filter(Boolean);
      run.solved = false;
      active.dataset.round = String(run.index);
      progress('scramble', run.cards);
      picture('[data-scramble-image]', run.card.imagePath);
      disabled('[data-scramble-next]', true);
      run.remaining = 15000; run.startedAt = 0; run.placed = []; run.bank = [];
      active.dataset.phase = 'model';
      text('[data-scramble-model]', run.card.sentence);
      hidden('[data-scramble-model]', false);
      hidden('[data-scramble-bank]', true); hidden('[data-scramble-draft]', true);
      var bank = find('[data-scramble-bank]'), draft = find('[data-scramble-draft]');
      if (bank) bank.replaceChildren(); if (draft) draft.replaceChildren();
      root.setPresentOutcome(draft);
      text('[data-scramble-count]', '15');
      var count = find('[data-scramble-count]'); if (count) count.setAttribute('aria-live', 'off');
      text('[data-scramble-start]', 'Start 15 seconds');
      hidden('[data-scramble-start]', false); disabled('[data-scramble-start]', false);
      hidden('[data-scramble-hear]', !run.card.audioPath);
      hidden('[data-scramble-check]', true); disabled('[data-scramble-check]', true);
      feedback('[data-scramble-feedback]', 'Read the sentence together. Start when the class is ready.');
    }
    function tokenButton(index, placed) {
      var button = active.ownerDocument.createElement('button');
      button.type = 'button'; button.textContent = run.words[index];
      button.setAttribute(placed ? 'data-scramble-placed' : 'data-scramble-word', String(index));
      return button;
    }
    function paintTokens() {
      var bank = find('[data-scramble-bank]'), draft = find('[data-scramble-draft]');
      root.setPresentOutcome(draft);
      run.solved = false; disabled('[data-scramble-next]', true);
      if (bank) bank.replaceChildren(...run.bank.filter(function (index) { return !run.placed.includes(index); }).map(function (index) { return tokenButton(index, false); }));
      if (draft) draft.replaceChildren(...run.placed.map(function (index) { return tokenButton(index, true); }));
      disabled('[data-scramble-check]', run.placed.length !== run.words.length);
    }
    function mix() {
      clearTimer(); stopAudio();
      var original = run.words.map(function (_, index) { return index; });
      var mixed = original.slice();
      if (options.shuffle) {
        var result = options.shuffle(mixed);
        if (Array.isArray(result)) mixed = result;
      } else {
        for (var i = mixed.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var old = mixed[i]; mixed[i] = mixed[j]; mixed[j] = old; }
      }
      if (mixed.length !== original.length || new Set(mixed).size !== original.length || mixed.some(function (index) { return !original.includes(index); })) mixed = original.slice();
      if (mixed.length > 1 && mixed.every(function (index, position) { return index === position; })) mixed = mixed.slice(1).concat(mixed[0]);
      run.bank = mixed; run.placed = []; run.remaining = 0;
      active.dataset.phase = 'build';
      text('[data-scramble-model]', '');
      var model = find('[data-scramble-model]');
      if (model) { model.removeAttribute('aria-label'); model.removeAttribute('title'); }
      hidden('[data-scramble-model]', true); hidden('[data-scramble-hear]', true); hidden('[data-scramble-start]', true);
      hidden('[data-scramble-bank]', false); hidden('[data-scramble-draft]', false); hidden('[data-scramble-check]', false);
      text('[data-scramble-count]', '0');
      feedback('[data-scramble-feedback]', 'Build the sentence together. Tap a word in your sentence to put it back.');
      paintTokens();
    }
    function elapsed() { return Math.max(0, performance.now() - run.startedAt); }
    function tick() {
      if (!active || !run || active.dataset.phase !== 'countdown') return;
      if (active.isConnected === false) { cancel(); return; }
      if (active.ownerDocument.hidden) { pause(); return; }
      var left = Math.max(0, run.remaining - elapsed());
      text('[data-scramble-count]', String(Math.ceil(left / 1000)));
      if (left === 0) mix();
    }
    function pause() {
      if (!active || !run || run.type !== 'scramble' || active.dataset.phase !== 'countdown') return;
      run.remaining = Math.max(0, run.remaining - elapsed()); clearTimer();
      active.dataset.phase = 'paused';
      text('[data-scramble-count]', String(Math.ceil(run.remaining / 1000)));
      text('[data-scramble-start]', 'Resume countdown');
      feedback('[data-scramble-feedback]', 'Countdown paused. Resume when the class is ready.');
    }
    function startCountdown() {
      if (active.ownerDocument.hidden) return;
      active.dataset.phase = 'countdown'; run.startedAt = performance.now();
      text('[data-scramble-start]', 'Pause countdown');
      feedback('[data-scramble-feedback]', 'Read and remember the sentence.');
      clearTimer(); var generation = timerGeneration; interval = setInterval(function () { if (generation === timerGeneration) tick(); }, 50); tick();
    }
    function reset(slide) {
      cancel();
      if (!slide) return;
      active = slide.matches('[data-detective-game],[data-missing-game],[data-scramble-game]') ? slide : slide.querySelector('[data-detective-game],[data-missing-game],[data-scramble-game]');
      if (!active) return;
      if (active.matches('[data-detective-game]')) {
        run = { type: 'detective', cards: parse(active.dataset.detectiveRounds, []), index: 0 };
        detectiveRound();
      } else if (active.matches('[data-missing-game]')) {
        var items = parse(active.dataset.missingItems, []), order = parse(active.dataset.missingOrder, []);
        if (order.length !== items.length || new Set(order).size !== items.length || order.some(function (index) { return !Number.isInteger(index) || index < 0 || index >= items.length; })) order = items.map(function (_, index) { return index; });
        var rounds = parse(active.dataset.missingRounds, []);
        if (rounds.length) order = rounds.map(function (round) { return round.targetIndex; });
        run = { type: 'missing', items: items, order: order, rounds: rounds, index: 0 };
        missingRound();
      } else {
        var card = parse(active.dataset.scrambleCard, { sentence: '' });
        var cards = parse(active.dataset.scrambleRounds, [card]);
        if (cards.length) cards[0] = card;
        run = { type: 'scramble', card: card, cards: cards, index: 0 };
        picture('[data-scramble-image]', card.imagePath);
        scrambleModel();
      }
    }
    function handleClick(target) {
      if (!active || !run || !target || !active.contains(target)) return false;
      var control = target.closest('button');
      if (control && (control.disabled || control.getAttribute('aria-disabled') === 'true')) return true;
      function hit(selector) { return target.closest(selector); }
      if (run.type === 'detective') {
        var card = run.cards[run.index], answer = hit('[data-detective-answer]');
        if (!card) return false;
        if (answer) {
          run.answered = true;
          all('[data-detective-answer]').forEach(function (node) { node.setAttribute('aria-pressed', String(node === answer)); root.setPresentOutcome(node); });
          var agrees = (answer.dataset.detectiveAnswer === 'yes') === card.matches;
          root.setPresentOutcome(answer, agrees ? 'correct' : 'incorrect');
          feedback('[data-detective-feedback]', agrees ? (card.matches ? 'The sentence is true for this picture. Read it together.' : 'The sentence is false for this picture. Talk about how to repair it.') : 'Look again at the picture and each word. Talk about your choice.', agrees ? 'correct' : 'incorrect');
          disabled('[data-detective-repair],[data-detective-next]', false); return true;
        }
        if (hit('[data-detective-repair]')) {
          if (!run.answered) return true;
          stopAudio(); run.repaired = true; text('[data-detective-sentence]', card.correctSentence);
          hidden('[data-detective-hear]', !card.correctAudioPath);
          feedback('[data-detective-feedback]', 'Read the true sentence together.', 'revealed'); return true;
        }
        if (hit('[data-detective-next]')) { if (run.answered) { stopAudio(); run.index = (run.index + 1) % run.cards.length; detectiveRound(); } return true; }
        if (hit('[data-detective-hear]')) { var src = run.repaired ? card.correctAudioPath : card.audioPath; if (src) playAudio(src); return true; }
      }
      if (run.type === 'missing') {
        if (hit('[data-missing-hide]')) {
          if (!run.items.length || run.concealed) return true;
          var node = find('[data-missing-item="' + run.order[run.index] + '"]');
          if (node) { node.textContent = '?'; node.removeAttribute('aria-label'); node.removeAttribute('title'); }
          run.concealed = true; disabled('[data-missing-hide]', true); disabled('[data-missing-reveal]', false);
          feedback('[data-missing-feedback]', 'Which one is missing? Give everyone time to think.'); return true;
        }
        if (hit('[data-missing-reveal]')) {
          if (!run.concealed) return true;
          var index = run.order[run.index], item = run.items[index], itemNode = find('[data-missing-item="' + index + '"]');
          if (itemNode) { itemNode.textContent = item.text; root.setPresentOutcome(itemNode, 'revealed'); }
          run.revealed = true; disabled('[data-missing-reveal]', true); disabled('[data-missing-next]', false);
          feedback('[data-missing-feedback]', 'The missing one was ' + item.text + '. Read them together.', 'revealed'); return true;
        }
        if (hit('[data-missing-next]')) { if (run.revealed) { stopAudio(); run.index = (run.index + 1) % run.order.length; missingRound(); } return true; }
      }
      if (run.type === 'scramble') {
        if (hit('[data-scramble-next]')) { if (run.solved && run.cards.length) { run.index = (run.index + 1) % run.cards.length; scrambleModel(); } return true; }
        if (hit('[data-scramble-reset]')) { scrambleModel(); return true; }
        if (hit('[data-scramble-start]')) { if (active.dataset.phase === 'countdown') pause(); else if (active.dataset.phase === 'model' || active.dataset.phase === 'paused') startCountdown(); return true; }
        if (hit('[data-scramble-hear]')) { if (active.dataset.phase !== 'build' && run.card.audioPath) playAudio(run.card.audioPath); return true; }
        if (active.dataset.phase !== 'build') return false;
        var word = hit('[data-scramble-word]'), placed = hit('[data-scramble-placed]');
        if (word) { var wordIndex = Number(word.dataset.scrambleWord); if (run.bank.includes(wordIndex) && !run.placed.includes(wordIndex)) { run.placed.push(wordIndex); paintTokens(); feedback('[data-scramble-feedback]', 'Read your sentence. Tap any word to put it back.'); } return true; }
        if (placed) { var placedIndex = run.placed.indexOf(Number(placed.dataset.scramblePlaced)); if (placedIndex >= 0) { run.placed.splice(placedIndex, 1); paintTokens(); feedback('[data-scramble-feedback]', 'Choose where that word should go.'); } return true; }
        if (hit('[data-scramble-check]')) {
          if (run.placed.length !== run.words.length) return true;
          var matches = run.placed.every(function (index, position) { return run.words[index] === run.words[position]; });
          run.solved = matches; disabled('[data-scramble-next]', !matches);
          root.setPresentOutcome(find('[data-scramble-draft]'), matches ? 'correct' : 'incorrect');
          feedback('[data-scramble-feedback]', matches ? 'The words are in order. Read the sentence together.' : 'Keep your sentence and read it aloud. Which word could move?', matches ? 'correct' : 'incorrect'); return true;
        }
      }
      return false;
    }
    return { reset: reset, handleClick: handleClick, pause: pause, cancel: cancel };
  };
}(globalThis));
