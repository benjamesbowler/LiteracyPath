// One instructional voice owner per deck. Terminal delivery is explicit;
// cancelled and failed cues never mean that a class heard the recording.
(function (root) {
  'use strict';
  root.createPresentAudioController = function (options) {
    options = options || {};
    var makeAudio = options.makeAudio || function (src) { return new Audio(src); };
    var notify = options.onStatus || function () {};
    var active = null, serial = 0, speech = true, effects = false;
    function finish(run, result) {
      if (!run || run.done) return;
      run.done = true; clearTimeout(run.watchdog);
      run.listeners.forEach(function (pair) { run.audio.removeEventListener(pair[0], pair[1]); });
      run.audio.pause();
      if (active === run) active = null;
      run.resolve({ status: result, requestId: run.id, src: run.src });
      if (run.id === serial) notify(result);
    }
    function stop() { if (active) finish(active, 'cancelled'); }
    function watchdog(run) {
      clearTimeout(run.watchdog);
      var duration = Number(run.audio.duration);
      var remaining = Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - (Number(run.audio.currentTime) || 0)) : 12;
      run.watchdog = setTimeout(function () { if (active === run) finish(run, 'interrupted'); }, Math.max(5000, remaining * 1000 + 5000));
    }
    function play(src, role) {
      stop(); serial += 1;
      if (!src) { notify('unavailable'); return Promise.resolve({ status: 'unavailable', requestId: serial, src: '' }); }
      if ((role || 'speech') === 'effect' ? !effects : !speech) { notify('muted'); return Promise.resolve({ status: 'muted', requestId: serial, src: src }); }
      return new Promise(function (resolve) {
        var audio;
        try { audio = makeAudio(src); } catch { notify('unavailable'); resolve({ status: 'unavailable', requestId: serial, src: src }); return; }
        var run = { id: serial, src: src, audio: audio, resolve: resolve, done: false, listeners: [], paused: false };
        active = run;
        function listen(name, callback) { audio.addEventListener(name, callback); run.listeners.push([name, callback]); }
        listen('ended', function () { if (active === run) finish(run, 'ended'); });
        listen('error', function () { if (active === run) finish(run, 'unavailable'); });
        listen('playing', function () { if (active === run) { notify('playing'); watchdog(run); } });
        listen('loadedmetadata', function () { if (active === run && !run.paused) watchdog(run); });
        notify('loading'); watchdog(run);
        try { var request = audio.play(); if (request && request.catch) request.catch(function () { if (active === run) finish(run, 'interrupted'); }); } catch { finish(run, 'interrupted'); }
      });
    }
    function pause() { if (active) { active.paused = true; clearTimeout(active.watchdog); active.audio.pause(); notify('paused'); } }
    function resume() {
      if (!active || !active.paused) return;
      var run = active; run.paused = false; watchdog(run);
      try { var request = run.audio.play(); if (request && request.catch) request.catch(function () { if (active === run) finish(run, 'interrupted'); }); } catch { finish(run, 'interrupted'); }
    }
    return { play: play, stop: stop, pause: pause, resume: resume,
      setSpeechEnabled: function (value) { speech = Boolean(value); if (!speech) stop(); },
      setEffectsEnabled: function (value) { effects = Boolean(value); },
      getState: function () { return { active: Boolean(active), paused: Boolean(active?.paused), speech: speech, effects: effects, requestId: serial }; }
    };
  };
}(globalThis));
