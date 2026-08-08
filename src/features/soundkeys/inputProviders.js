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

function unsupportedMidiError() {
  const error = new Error("Web MIDI is not available in this browser.");
  error.code = "unsupported";
  return error;
}

function midiInputs(access) {
  if (typeof access?.inputs?.values === "function") return [...access.inputs.values()];
  const inputs = [];
  access?.inputs?.forEach?.(input => inputs.push(input));
  return inputs;
}

export async function connectWebMidi(onEvent, midiNavigator = globalThis.navigator) {
  if (typeof midiNavigator?.requestMIDIAccess !== "function") throw unsupportedMidiError();
  const access = await midiNavigator.requestMIDIAccess();
  const attached = new Set();

  const emitStatus = () => {
    const connectedInputs = midiInputs(access).filter(input => input?.state !== "disconnected");
    onEvent({
      type: "midi-status",
      connected: connectedInputs.length > 0,
      inputCount: connectedInputs.length,
      inputNames: connectedInputs.map(input => input.name || "MIDI keyboard")
    });
  };

  const attach = input => {
    if (!input || input.state === "disconnected" || attached.has(input)) return;
    input.onmidimessage = message => {
      const [status, note, velocity] = message.data || [];
      const type = (status & 0xf0) === 0x90 && velocity > 0 ? "noteOn" : "noteOff";
      const normalized = normalizeSoundKeyEvent({ note, velocity, type });
      if (!normalized) return;
      const { type: typeName, ...noteEvent } = normalized;
      onEvent({ type: "midi", ...noteEvent, typeName, source: input.name || "MIDI" });
    };
    attached.add(input);
    try {
      const opening = input.open?.();
      opening?.catch?.(error => onEvent({
        type: "midi-error",
        code: "input-open-failed",
        message: error?.message || "The MIDI keyboard could not be opened."
      }));
    } catch (error) {
      onEvent({
        type: "midi-error",
        code: "input-open-failed",
        message: error?.message || "The MIDI keyboard could not be opened."
      });
    }
  };

  const detach = input => {
    if (!input || !attached.has(input)) return;
    input.onmidimessage = null;
    attached.delete(input);
  };

  midiInputs(access).forEach(attach);
  const handleStateChange = event => {
    if (event.port?.type === "input") {
      if (event.port.state === "disconnected") detach(event.port);
      else attach(event.port);
    }
    emitStatus();
  };

  if (typeof access.addEventListener === "function") access.addEventListener("statechange", handleStateChange);
  else access.onstatechange = handleStateChange;
  emitStatus();

  return () => {
    if (typeof access.removeEventListener === "function") access.removeEventListener("statechange", handleStateChange);
    else if (access.onstatechange === handleStateChange) access.onstatechange = null;
    [...attached].forEach(detach);
  };
}
