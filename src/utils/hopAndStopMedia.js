// A single, explicitly started voice/song owner. Old requests always settle,
// including when another cue, a page change or page hiding interrupts them.
export function createHopAndStopMediaPlayer({ makeAudio = src => new Audio(src), onStatus = () => {} } = {}) {
  let owned = null;

  function stop() {
    if (!owned) return;
    owned.finish("interrupted");
  }

  function play(src) {
    stop();
    if (!src) return Promise.resolve("unavailable");
    return new Promise(resolve => {
      let audio;
      try { audio = makeAudio(src); } catch { onStatus({ src, status: "unavailable" }); resolve("unavailable"); return; }
      let settled = false;
      const events = [];
      let watchdog;
      const finish = status => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        for (const [event, listener] of events) audio.removeEventListener(event, listener);
        if (status !== "completed") {
          audio.pause();
          try { audio.currentTime = 0; } catch { /* No media timeline was available. */ }
        }
        if (owned?.audio === audio) owned = null;
        onStatus({ src, status });
        resolve(status);
      };
      const listen = (event, listener) => { events.push([event, listener]); audio.addEventListener(event, listener); };
      owned = { audio, finish };
      listen("playing", () => {
        clearTimeout(watchdog);
        onStatus({ src, status: "playing" });
      });
      listen("ended", () => finish("completed"));
      listen("error", () => finish("unavailable"));
      listen("abort", () => finish("interrupted"));
      watchdog = setTimeout(() => finish("unavailable"), 20000);
      onStatus({ src, status: "loading" });
      try {
        const started = audio.play();
        started?.catch(() => finish("unavailable"));
      } catch { finish("unavailable"); }
    });
  }

  return { play, stop };
}
