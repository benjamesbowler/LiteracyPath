import { normalizeSoundKeyEvent } from "./engine.js";

export function createComputerKeyboardProvider(onEvent) {
  const handler = event => {
    if (event.repeat) return;
    const key = String(event.key || "").toLowerCase();
    if (/^[a-z]$/.test(key)) onEvent({ type: "token", token: key, source: "computer" });
    if (key === "backspace") onEvent({ type: "control", action: "clear" });
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}

export async function connectWebMidi(onEvent) {
  if (!navigator.requestMIDIAccess) throw new Error("Web MIDI is not available in this browser.");
  const access = await navigator.requestMIDIAccess();
  const attach = input => {
    input.onmidimessage = message => {
      const [status, note, velocity] = message.data || [];
      const type = (status & 0xf0) === 0x90 && velocity > 0 ? "noteOn" : "noteOff";
      const normalized = normalizeSoundKeyEvent({ note, velocity, type });
      if (normalized) onEvent({ type: "midi", ...normalized, source: input.name || "MIDI" });
    };
  };
  access.inputs.forEach(attach);
  const state = event => {
    if (event.port?.type === "input" && event.port.state === "connected") attach(event.port);
    onEvent({ type: "midi-status", connected: [...access.inputs].some(input => input.state === "connected") });
  };
  access.onstatechange = state;
  onEvent({ type: "midi-status", connected: [...access.inputs].some(input => input.state === "connected") });
  return () => {
    access.onstatechange = null;
    access.inputs.forEach(input => { input.onmidimessage = null; });
  };
}

