import { useEffect, useRef, useState } from "react";
import { mathsLedaAudioById } from "./generated/mathsLedaAudio.generated.js";

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
  const path = mathsAudioPath(requestId);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  if (!path) return <span className="maths-audio-unavailable">Audio unavailable</span>;

  const toggle = async () => {
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
      setFlagState("Flagged for review. You can keep learning.");
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
    <button aria-pressed={state === "playing"} onClick={toggle} type="button">
      <span aria-hidden="true">{state === "playing" ? "Ⅱ" : "▶"}</span>
      {state === "playing" ? "Pause" : state === "blocked" ? "Tap to play" : state === "error" ? "Audio unavailable" : label}
    </button>
    <button
      aria-expanded={showFlag}
      className="maths-audio-flag"
      onClick={() => setShowFlag(value => !value)}
      title="Flag this exact audio clip for review"
      type="button"
    >Flag audio</button>
    {showFlag && <div className="maths-audio-flag-panel"><p>Did this exact clip sound wrong or fail to play?</p><button onClick={flag} type="button">Send audio flag</button></div>}
    {flagState && <small aria-live="polite">{flagState}</small>}
  </div>;
}

export function MathsSongPlayer({ song, compact = false, client = null, token = "" }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const path = `/audio/music/maths/songs/${song.id}-instrumental.mp3`;
  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };
  const [showFlag, setShowFlag] = useState(false);
  const [flagState, setFlagState] = useState("");
  const flagInstrumental = async () => {
    setFlagState("Sending…");
    try {
      if (!client?.call) throw new Error("unavailable");
      const requestId = `song:${song.id}:instrumental`;
      const rpc = token ? "student_report_maths_media_issue" : "teacher_report_maths_media_issue";
      const args = token
        ? { p_token: token, p_audio_id: requestId, p_reason: "playback_or_content_issue" }
        : { p_audio_id: requestId, p_reason: "playback_or_content_issue" };
      const { data, error } = await client.call(rpc, args);
      if (error || !data?.ok) throw error || new Error(data?.error || "flag_failed");
      setFlagState("Instrumental flagged for review.");
      setShowFlag(false);
    } catch {
      setFlagState("The flag could not be sent. Please tell a teacher.");
    }
  };
  return <div className={`maths-song-player${compact ? " is-compact" : ""}`}>
    <audio onEnded={() => setPlaying(false)} preload="none" ref={audioRef} src={path} />
    <button aria-pressed={playing} onClick={toggle} type="button">{playing ? "Pause instrumental" : "Play instrumental"}</button>
    <button aria-expanded={showFlag} className="maths-audio-flag" onClick={() => setShowFlag(value => !value)} type="button">Flag instrumental</button>
    {showFlag && <div className="maths-audio-flag-panel"><p>Did this backing track sound wrong or fail to play?</p><button onClick={flagInstrumental} type="button">Send instrumental flag</button></div>}
    {flagState && <small aria-live="polite">{flagState}</small>}
    <MathsAudioButton client={client} compact label="Hear lyric guide" requestId={`song:${song.id}:guide`} token={token} />
  </div>;
}
