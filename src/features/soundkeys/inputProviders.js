import { normalizeSoundKeyEvent } from "./engine.js";
import { isInteractiveKeyTarget } from "../../utils/interactiveEventTarget.js";

export function createComputerKeyboardProvider(onEvent, options = {}) {
  const handler = event => {
    const key = String(event.key || "").toLowerCase();
    if (event.repeat || (isInteractiveKeyTarget(event.target) && !options.acceptTarget?.(event.target, key))) return;
    const mapped = options.resolveKey?.(key);
    if (mapped) { event.preventDefault(); onEvent({ type: "token", token: mapped, source: "computer", key }); return; }
    if (/^[a-z]$/.test(key)) onEvent({ type: "token", token: key, source: "computer" });
    if (key === "backspace") onEvent({ type: "control", action: "clear" });
  };
  window.addEventListener("keydown", handler);
  const release = event => onEvent({ type: "release", key: String(event.key || "").toLowerCase(), source: "computer" });
  const blur = () => onEvent({ type: "release-all", source: "computer" });
  window.addEventListener("keyup", release);
  window.addEventListener("blur", blur);
  return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", release); window.removeEventListener("blur", blur); };
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
      const command = status & 0xf0;
      if (command === 0x80 || (command === 0x90 && velocity === 0)) { onEvent({ type: "release", note, source: input.name || "MIDI" }); return; }
      if (command !== 0x90) return;
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
    onEvent({ type: "release-all", source: input.name || "MIDI" });
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
