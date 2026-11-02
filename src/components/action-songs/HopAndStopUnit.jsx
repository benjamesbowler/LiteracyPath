import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  HOP_AND_STOP_ACTIONS, HOP_AND_STOP_MEDIA, HOP_AND_STOP_PAGES, HOP_AND_STOP_ROUNDS,
  hopAndStopActionImage, hopAndStopWordAudio, nextHopAndStopRound
} from "../../data/hopAndStop.js";
import { createHopAndStopMediaPlayer } from "../../utils/hopAndStopMedia.js";
import "../../styles/hop-and-stop.css";

function Picture({ src, alt, className = "", onUnavailable }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`hop-stop-picture-missing ${className}`} role="status">Picture unavailable. Ask a grown-up to describe the action.</span>;
  return <img className={className} src={src} alt={alt} onError={() => { setFailed(true); onUnavailable?.(); }} />;
}

function AudioNotice({ status }) {
  return <span className="hop-stop-audio-notice" role="status" aria-live="polite">
    {status === "loading" ? "Getting the recording ready…"
      : status === "playing" ? "Playing the recording."
        : status === "unavailable" ? "Recording unavailable. Read together or ask a grown-up to help."
          : ""}
  </span>;
}

function Watch({ videoRef, audio, playAudio, stopAudio }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const songPlaying = audio.src === HOP_AND_STOP_MEDIA.song && ["playing", "loading"].includes(audio.status);
  return <section className="hop-stop-watch" aria-label="Watch Hop and Stop">
    <p data-child-instruction="">Press play. Join in with hop, stop, up, and down.</p>
    <p className="hop-stop-progress" data-child-progress="">One song with Bouncy and Speedy</p>
    {videoFailed ? <div className="hop-stop-picture-missing" role="status">The video is unavailable right now. You can try the song or choose another activity.</div>
      : <video ref={videoRef} className="hop-stop-video" controls playsInline preload="metadata" poster={HOP_AND_STOP_PAGES[0].image}
        aria-label="Hop and Stop animated song" data-child-primary="" onPlay={stopAudio} onError={() => setVideoFailed(true)}>
        <source src={HOP_AND_STOP_MEDIA.video} type="video/mp4" />
        Your browser cannot play this video.
      </video>}
    <div className="hop-stop-secondary-actions" role="group" aria-label="Song listening and downloads" data-child-choices="">
      <button type="button" className={`hop-stop-button${videoFailed ? "" : " hop-stop-button-secondary"}`} {...(videoFailed ? { "data-child-primary": "" } : {})} onClick={() => songPlaying ? stopAudio() : playAudio(HOP_AND_STOP_MEDIA.song)}>{songPlaying ? "Stop song" : "Listen to the song"}</button>
      <a className="hop-stop-link" href={HOP_AND_STOP_MEDIA.video} download>Download video</a>
      <a className="hop-stop-link" href={HOP_AND_STOP_MEDIA.song} download>Download song</a>
    </div>
    <AudioNotice status={audio.src === HOP_AND_STOP_MEDIA.song ? audio.status : ""} />
  </section>;
}

function Reader({ audio, playAudio, stopAudio, chooseMode }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const finishedHeading = useRef(null);
  useEffect(() => { if (finished) finishedHeading.current?.focus(); }, [finished]);
  const page = HOP_AND_STOP_PAGES[pageIndex];
  const playing = audio.src === page.audio && ["loading", "playing"].includes(audio.status);
  function changePage(next) { stopAudio(); setPageIndex(next); }
  if (finished) return <section className="hop-stop-finished" aria-label="Reader finished">
    <h2 ref={finishedHeading} tabIndex={-1}>You read the story together!</h2>
    <p data-child-instruction="">Now choose the actions with Bouncy and Speedy.</p>
    <p data-child-progress="">All 8 pages read together</p>
    <div role="group" aria-label="Choose what to do after reading" data-child-choices=""><button type="button" className="hop-stop-button" data-child-primary="" onClick={() => chooseMode("play")}>Play the action game</button>
    <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => { setPageIndex(0); setFinished(false); }}>Read again</button></div>
  </section>;
  return <section className="hop-stop-reader" aria-label="Hop and Stop read together">
    <div className="hop-stop-reader-top"><p data-child-instruction="">Read together, or press Hear this page.</p><span className="hop-stop-progress" data-child-progress="">Page {page.number} of {HOP_AND_STOP_PAGES.length}</span></div>
    <figure className="hop-stop-reader-spread">
      <Picture key={page.image} src={page.image} alt={page.alt} />
      <figcaption>{page.text}</figcaption>
    </figure>
    <div className="hop-stop-reader-controls" role="group" aria-label="Story page controls" data-child-choices="">
      <button type="button" className="hop-stop-button hop-stop-button-secondary" disabled={pageIndex === 0} onClick={() => changePage(pageIndex - 1)}>Previous page</button>
      <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => playing ? stopAudio() : playAudio(page.audio)}>{playing ? "Stop page audio" : "Hear this page"}</button>
      <button type="button" className="hop-stop-button" data-child-primary="" onClick={() => {
        if (pageIndex + 1 === HOP_AND_STOP_PAGES.length) { stopAudio(); setFinished(true); }
        else changePage(pageIndex + 1);
      }}>{pageIndex + 1 === HOP_AND_STOP_PAGES.length ? "Finish story" : "Next page"}</button>
    </div>
    <AudioNotice status={audio.src === page.audio ? audio.status : ""} />
    <a className="hop-stop-link" href={HOP_AND_STOP_MEDIA.pdf} download>Print the reader</a>
    <p className="hop-stop-support-label">Read Together</p>
  </section>;
}

function ActionGame({ playAudio, stopAudio, audio, visible, chooseMode, songAvailable }) {
  const [state, dispatch] = useReducer(nextHopAndStopRound, { index: 0, phase: "choosing", wrong: "" });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [heardRound, setHeardRound] = useState(-1);
  const [helpRound, setHelpRound] = useState(-1);
  const [unavailableRound, setUnavailableRound] = useState(-1);
  const round = HOP_AND_STOP_ROUNDS[state.index];
  const action = HOP_AND_STOP_ACTIONS[round.target];
  const wordAudio = hopAndStopWordAudio(round.target);
  const supported = !soundEnabled || helpRound === state.index || unavailableRound === state.index || Boolean(state.wrong);
  const ready = supported || heardRound === state.index;
  const pendingRound = useRef(0);
  const questionHeading = useRef(null);
  const complete = state.phase === "complete";
  useEffect(() => { questionHeading.current?.focus(); }, [state.index, complete]);
  useEffect(() => () => { pendingRound.current += 1; }, []);
  useEffect(() => {
    if (state.phase !== "feedback" || !visible || paused) return undefined;
    const timer = setTimeout(() => { stopAudio(); dispatch({ type: "advance" }); }, 1500);
    return () => clearTimeout(timer);
  }, [state.phase, state.index, visible, paused, stopAudio]);

  function hear() {
    const request = ++pendingRound.current;
    playAudio(wordAudio).then(result => {
      if (request !== pendingRound.current) return;
      if (result === "completed") setHeardRound(state.index);
      if (result === "unavailable") setUnavailableRound(state.index);
    });
  }

  if (state.phase === "complete") return <section className="hop-stop-finished" aria-label="Action game finished">
    <h2 ref={questionHeading} tabIndex={-1}>You tried all four actions!</h2>
    <p data-child-instruction="">{songAvailable ? "Play again, or sing with the friends." : "Play again, or read the story together."}</p>
    <p data-child-progress="">8 action rounds finished</p>
    <div role="group" aria-label="Choose what to do after playing" data-child-choices=""><button type="button" className="hop-stop-button" data-child-primary="" onClick={() => {
      pendingRound.current += 1; setPaused(false); setHeardRound(-1); setHelpRound(-1); setUnavailableRound(-1); dispatch({ type: "restart" });
    }}>Play again</button>
    {songAvailable
      ? <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => chooseMode("watch")}>Watch the song</button>
      : <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => chooseMode("read")}>Read Together</button>}</div>
  </section>;

  return <section className="hop-stop-game" aria-label="Hop and Stop action game">
    <div className="hop-stop-game-top">
      <div><p className="hop-stop-progress" data-child-progress="">Round {state.index + 1} of {HOP_AND_STOP_ROUNDS.length}</p><h2 ref={questionHeading} tabIndex={-1}>{action.cue}</h2></div>
      <div className="hop-stop-header-actions"><button type="button" className={`hop-stop-button${paused ? "" : " hop-stop-button-secondary"}`} aria-pressed={paused}
        {...(paused ? { "data-child-primary": "" } : {})} onClick={() => { stopAudio(); pendingRound.current += 1; setPaused(value => !value); }}>{paused ? "Resume game" : "Pause game"}</button>
      <button type="button" className="hop-stop-button hop-stop-button-secondary" aria-pressed={soundEnabled} onClick={() => { stopAudio(); pendingRound.current += 1; setSoundEnabled(value => !value); }}>{soundEnabled ? "Sound on" : "Sound off"}</button></div>
    </div>
    {paused && <p className="hop-stop-support-note" role="status">Game paused. Press Resume game when you are ready.</p>}
    <p data-child-instruction="">{supported ? "Read the word together. Choose the matching picture." : "Hear the word. Choose the matching picture."}</p>
    <div className="hop-stop-cue">
      <button type="button" className="hop-stop-button" disabled={!soundEnabled || paused || state.phase !== "choosing"} onClick={hear} {...(!ready && !paused ? { "data-child-primary": "" } : {})}>Hear the word</button>
      {supported && <strong className="hop-stop-target">{round.target}</strong>}
      {!supported && <button type="button" className="hop-stop-link" onClick={() => { stopAudio(); setHelpRound(state.index); }}>Show the word</button>}
    </div>
    {supported && <p className="hop-stop-support-note" role="status">{!soundEnabled ? "Sound is off. Read the word or ask a grown-up to say it."
      : unavailableRound === state.index ? "A recording or picture is unavailable. Use the word and a grown-up’s help."
        : "Use the word and pictures together."}</p>}
    <AudioNotice status={audio.src === wordAudio ? audio.status : ""} />
    <div className="hop-stop-picture-choices" role="group" aria-label="Choose the matching action picture" data-child-choices="" {...(ready && !paused ? { "data-child-primary": "" } : {})}>
      {round.choices.map(word => <button key={`${state.index}-${word}`} type="button" className={`hop-stop-picture-choice${state.wrong === word ? " is-retry" : ""}${state.phase === "feedback" && word === round.target ? " is-chosen" : ""}`}
        aria-label={HOP_AND_STOP_ACTIONS[word].alt} disabled={!ready || paused || state.phase !== "choosing"} onClick={() => { pendingRound.current += 1; stopAudio(); dispatch({ type: "choose", word }); }}>
        <Picture src={hopAndStopActionImage(word)} alt="" onUnavailable={() => setUnavailableRound(state.index)} />
        {supported && <span>{word}</span>}
        {state.phase === "feedback" && word === round.target && <span aria-hidden="true">✓</span>}
      </button>)}
    </div>
    <p className="hop-stop-feedback" role="status" aria-live="polite">{state.phase === "feedback" ? action.result
      : state.wrong ? `That picture shows ${state.wrong}. Let’s find ${round.target}.`
        : !ready ? "Press Hear the word, or choose Show the word for help." : "Choose a picture."}</p>
    <p className="hop-stop-support-label">Picture vocabulary practice · Take your time</p>
  </section>;
}

export function HopAndStopUnit({ onExit, songAvailable = true }) {
  const [mode, setMode] = useState("overview");
  const [audio, setAudio] = useState({ src: "", status: "idle" });
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [player] = useState(() => createHopAndStopMediaPlayer({ onStatus: setAudio }));
  const videoRef = useRef(null);
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, [mode]);
  const bindVideo = useCallback(node => {
    if (videoRef.current && videoRef.current !== node) videoRef.current.pause();
    videoRef.current = node;
  }, []);
  const stopAudio = useCallback(() => player.stop(), [player]);
  const stopMedia = useCallback(() => { player.stop(); videoRef.current?.pause(); }, [player]);
  const playAudio = useCallback(src => { videoRef.current?.pause(); return player.play(src); }, [player]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) stopMedia(); setVisible(!document.hidden); };
    const leave = () => { stopMedia(); setVisible(false); };
    const restore = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", restore);
    return () => { document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", leave); window.removeEventListener("pageshow", restore); stopMedia(); };
  }, [stopMedia]);
  function chooseMode(next) { stopMedia(); setAudio({ src: "", status: "idle" }); setMode(next); }

  return <div className="hop-stop-unit" data-child-surface="hop-and-stop" data-learning-lane="language_and_meaning">
    <header className="hop-stop-header"><div><p className="hop-stop-eyebrow">Meadow Pals</p><h1 ref={titleRef} tabIndex={-1} data-child-title="">Hop and Stop</h1></div>
      <div className="hop-stop-header-actions">
        {mode !== "overview" && <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => chooseMode("overview")}>Choose an activity</button>}
        {onExit && <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => { stopMedia(); onExit(); }}>Back to Books</button>}
      </div>
    </header>
    {mode === "overview" && <section className="hop-stop-overview" aria-label="Choose a Hop and Stop activity">
      <Picture src={HOP_AND_STOP_PAGES[0].image} alt={HOP_AND_STOP_PAGES[0].alt} />
      <div><p data-child-instruction="">{songAvailable ? "Sing, read together, or play with Bouncy and Speedy." : "Read together or play with Bouncy and Speedy."}</p><p className="hop-stop-progress" data-child-progress="">{songAvailable ? "One song · 8 story pages · 8 action rounds" : "8 story pages · 8 action rounds"}</p>
        <div className="hop-stop-activity-choices" role="group" aria-label={songAvailable ? "Song, story and game" : "Story and game"} data-child-choices="">
          {songAvailable && <button type="button" className="hop-stop-button" data-child-primary="" onClick={() => chooseMode("watch")}>Watch the song</button>}
          <button type="button" className={`hop-stop-button${songAvailable ? " hop-stop-button-secondary" : ""}`} {...(!songAvailable ? { "data-child-primary": "" } : {})} onClick={() => chooseMode("read")}>Read Together</button>
          <button type="button" className="hop-stop-button hop-stop-button-secondary" onClick={() => chooseMode("play")}>Play the action game</button>
        </div>
      </div>
    </section>}
    {mode === "watch" && songAvailable && <Watch videoRef={bindVideo} audio={audio} playAudio={playAudio} stopAudio={stopAudio} />}
    {mode === "read" && <Reader audio={audio} playAudio={playAudio} stopAudio={stopAudio} chooseMode={chooseMode} />}
    {mode === "play" && <ActionGame audio={audio} playAudio={playAudio} stopAudio={stopAudio} visible={visible} chooseMode={chooseMode} songAvailable={songAvailable} />}
  </div>;
}
