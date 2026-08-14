import { useEffect, useRef, useState } from "react";
import { mathsLedaAudioById } from "./generated/mathsLedaAudio.generated.js";
import { MATHS_PERFORMED_SONG_RELEASE_STATUSES } from "../music/mathsSongs.js";
import "../../styles/maths-song-player.css";

const mathsAudioPath = requestId => mathsLedaAudioById.get(String(requestId || "")) || "";

export function MathsAudioButton({
  requestId,
  label = "Hear this",
  client = null,
  token = "",
  compact = false
}) {
  const audioRef = useRef(null);
  const [state, setState] = useState("idle");
  const [showFlag, setShowFlag] = useState(false);
  const [flagState, setFlagState] = useState("");
  const [flagged, setFlagged] = useState(false);
  const path = mathsAudioPath(requestId);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  if (!path) return <span className="maths-audio-unavailable">Audio unavailable</span>;

  const toggle = async () => {
    if (flagged) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setState("idle");
      return;
    }
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("blocked");
    }
  };

  const flag = async () => {
    setFlagState("Sending…");
    try {
      if (!client?.call) throw new Error("unavailable");
      const rpc = token ? "student_report_maths_media_issue" : "teacher_report_maths_media_issue";
      const args = token
        ? { p_token: token, p_audio_id: requestId, p_reason: "playback_or_content_issue" }
        : { p_audio_id: requestId, p_reason: "playback_or_content_issue" };
      const { data, error } = await client.call(rpc, args);
      if (error || !data?.ok) throw error || new Error(data?.error || "flag_failed");
      audioRef.current?.pause();
      setState("idle");
      setFlagged(true);
      setFlagState("Flagged for review. Ask your teacher to read this instruction instead.");
      setShowFlag(false);
    } catch {
      setFlagState("The flag could not be sent. Please tell a teacher.");
    }
  };

  return <div className={`maths-audio-control${compact ? " is-compact" : ""}`}>
    <audio
      onEnded={() => setState("idle")}
      onError={() => setState("error")}
      preload="none"
      ref={audioRef}
      src={path}
    />
    <button aria-pressed={state === "playing"} disabled={flagged} onClick={toggle} type="button">
      <span aria-hidden="true">{state === "playing" ? "Ⅱ" : "▶"}</span>
      {flagged ? "Audio flagged" : state === "playing" ? "Pause" : state === "blocked" ? "Tap to play" : state === "error" ? "Audio unavailable" : label}
    </button>
    <button
      aria-expanded={showFlag}
      className="maths-audio-flag"
      onClick={() => setShowFlag(value => !value)}
      title="Flag this exact audio clip for review"
      type="button"
    >{flagged ? "Flag sent" : "Flag audio"}</button>
    {showFlag && <div className="maths-audio-flag-panel"><p>Did this exact clip sound wrong or fail to play?</p><button onClick={flag} type="button">Send audio flag</button></div>}
    {flagState && <small aria-live="polite">{flagState}</small>}
  </div>;
}

export function MathsSongPlayer({ song, compact = false, client = null, token = "" }) {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const performed = song.media?.performed;
  const fallback = song.media?.fallback;
  const performedReleased = MATHS_PERFORMED_SONG_RELEASE_STATUSES.includes(performed?.releaseStatus);
  const [mode, setMode] = useState(performedReleased ? "performed" : "fallback");
  const [state, setState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeCue, setActiveCue] = useState("");
  const [showFlag, setShowFlag] = useState(false);
  const [flagState, setFlagState] = useState("");
  const [flaggedSources, setFlaggedSources] = useState(() => new Set());
  const source = mode === "performed" ? performed?.publicPath : fallback?.instrumentalPath;
  const captions = mode === "performed" ? performed?.captionsPath : "";
  const currentRequestId = `song:${song.id}:${mode === "performed" ? "performed" : "instrumental"}`;
  const currentFlagged = flaggedSources.has(currentRequestId);
  const sourceLabel = mode === "performed" ? "Full song with vocals" : "Backing track";

  useEffect(() => {
    const textTrack = trackRef.current?.track;
    if (!textTrack) return undefined;
    textTrack.mode = "hidden";
    const updateActiveCue = () => setActiveCue(String(textTrack.activeCues?.[0]?.text || ""));
    textTrack.addEventListener("cuechange", updateActiveCue);
    return () => textTrack.removeEventListener("cuechange", updateActiveCue);
  }, [captions, source]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || currentFlagged || !source) return;
    if (!audio.paused) {
      audio.pause();
      setState("idle");
      return;
    }
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("blocked");
    }
  };

  const restart = async () => {
    const audio = audioRef.current;
    if (!audio || currentFlagged || !source) return;
    audio.currentTime = 0;
    setActiveCue("");
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("blocked");
    }
  };

  const handleAudioError = () => {
    if (mode === "performed" && fallback?.instrumentalPath) {
      setMode("fallback");
      setState("idle");
      setActiveCue("");
      setStatusMessage("The full song could not load. The backing track and adult lyric guide are available instead.");
      return;
    }
    setState("error");
    setStatusMessage("This audio is unavailable. The lyrics are still available below.");
  };

  const flagCurrentAudio = async () => {
    setFlagState("Sending…");
    try {
      if (!client?.call) throw new Error("unavailable");
      const rpc = token ? "student_report_maths_media_issue" : "teacher_report_maths_media_issue";
      const args = token
        ? { p_token: token, p_audio_id: currentRequestId, p_reason: "playback_or_content_issue" }
        : { p_audio_id: currentRequestId, p_reason: "playback_or_content_issue" };
      const { data, error } = await client.call(rpc, args);
      if (error || !data?.ok) throw error || new Error(data?.error || "flag_failed");
      audioRef.current?.pause();
      setState("idle");
      setFlaggedSources(previous => new Set(previous).add(currentRequestId));
      if (mode === "performed" && fallback?.instrumentalPath) {
        setMode("fallback");
        setActiveCue("");
        setFlagState("Full song flagged for review. The backing track and adult lyric guide are available instead.");
      } else {
        setFlagState("Backing track flagged for review. The written lyrics remain available.");
      }
      setShowFlag(false);
    } catch {
      setFlagState("The flag could not be sent. Please tell a teacher.");
    }
  };

  const fallbackReason = performed?.releaseStatus === "planned"
    ? "The full performed song is not released yet."
    : "The full performed song is under review.";

  return <div className={`maths-song-player${compact ? " is-compact" : ""}`}>
    <audio
      aria-label={`${song.title} — ${sourceLabel}`}
      key={source}
      onEnded={() => setState("idle")}
      onError={handleAudioError}
      preload="none"
      ref={audioRef}
      src={source}
    >
      {captions && <track default kind="captions" label="English song lyrics" ref={trackRef} src={captions} srcLang="en" />}
    </audio>
    <p className={`maths-song-source is-${mode}`}><strong>{sourceLabel}</strong><span>{mode === "performed" ? "Complete vocal performance" : `${fallbackReason} Backing track plus adult LEDA guide.`}</span></p>
    <div className="maths-song-actions">
      <button aria-pressed={state === "playing"} disabled={currentFlagged || !source} onClick={toggle} type="button">
        {currentFlagged ? `${sourceLabel} flagged` : state === "playing" ? `Pause ${sourceLabel.toLowerCase()}` : state === "blocked" ? "Tap to play" : state === "error" ? "Audio unavailable" : `Play ${sourceLabel.toLowerCase()}`}
      </button>
      <button disabled={currentFlagged || !source} onClick={restart} type="button">Restart</button>
      <button aria-expanded={showFlag} className="maths-audio-flag" onClick={() => setShowFlag(value => !value)} type="button">{currentFlagged ? "Flag sent" : `Flag ${mode === "performed" ? "full song" : "backing track"}`}</button>
    </div>
    {showFlag && <div className="maths-audio-flag-panel"><p>Did this exact {mode === "performed" ? "full song" : "backing track"} sound wrong or fail to play?</p><button onClick={flagCurrentAudio} type="button">Send audio flag</button></div>}
    {activeCue && <p aria-live="off" className="maths-song-now"><span>Now singing</span>{activeCue}</p>}
    {statusMessage && <small aria-live="polite">{statusMessage}</small>}
    {flagState && <small aria-live="polite">{flagState}</small>}
    {mode === "fallback" && <MathsAudioButton client={client} compact label="Hear adult lyric guide" requestId={fallback?.guideRequestId || `song:${song.id}:guide`} token={token} />}
    <details className="maths-song-lyrics" open={!compact}>
      <summary>Lyrics</summary>
      <div>{song.lyrics.split(/\n{2,}/).map((verse, index) => <p key={`${song.id}-verse-${index}`}>{verse.split("\n").map((line, lineIndex) => <span key={`${song.id}-line-${lineIndex}`}>{line}</span>)}</p>)}</div>
    </details>
  </div>;
}
