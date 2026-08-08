import assert from "node:assert/strict";
import test from "node:test";

import { connectWebMidi } from "../../src/features/soundkeys/inputProviders.js";

function fakeMidiAccess(initialInputs = []) {
  const inputs = new Map(initialInputs.map(input => [input.id, input]));
  const listeners = new Set();
  return {
    inputs,
    addEventListener(type, listener) {
      if (type === "statechange") listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === "statechange") listeners.delete(listener);
    },
    emitStateChange(port) {
      listeners.forEach(listener => listener({ port }));
    }
  };
}

function fakeMidiInput(overrides = {}) {
  return {
    id: "keyboard-1",
    name: "Classroom Keys",
    type: "input",
    state: "connected",
    connection: "closed",
    onmidimessage: null,
    openCalls: 0,
    async open() {
      this.openCalls += 1;
      this.connection = "open";
    },
    ...overrides
  };
}

test("SoundKeys reports MIDIInputMap values and accepts note-on messages", async () => {
  const input = fakeMidiInput();
  const access = fakeMidiAccess([input]);
  const events = [];
  const midiNavigator = { requestMIDIAccess: async () => access };

  const disconnect = await connectWebMidi(event => events.push(event), midiNavigator);

  assert.deepEqual(events[0], {
    type: "midi-status",
    connected: true,
    inputCount: 1,
    inputNames: ["Classroom Keys"]
  });
  assert.equal(input.openCalls, 1);

  input.onmidimessage({ data: Uint8Array.from([0x90, 60, 100]) });
  input.onmidimessage({ data: Uint8Array.from([0x80, 60, 0]) });

  assert.deepEqual(events[1], {
    type: "midi",
    note: 60,
    velocity: 100,
    typeName: "noteOn",
    source: "Classroom Keys"
  });

  disconnect();
  assert.equal(input.onmidimessage, null);
});

test("SoundKeys attaches a keyboard connected after permission is granted", async () => {
  const access = fakeMidiAccess();
  const events = [];
  const midiNavigator = { requestMIDIAccess: async () => access };
  const disconnect = await connectWebMidi(event => events.push(event), midiNavigator);

  assert.equal(events.at(-1).connected, false);

  const input = fakeMidiInput({ id: "keyboard-2", name: "USB Piano" });
  access.inputs.set(input.id, input);
  access.emitStateChange(input);

  assert.equal(input.openCalls, 1);
  assert.deepEqual(events.at(-1), {
    type: "midi-status",
    connected: true,
    inputCount: 1,
    inputNames: ["USB Piano"]
  });

  disconnect();
});

test("SoundKeys reports a disconnected keyboard and detaches its listener", async () => {
  const input = fakeMidiInput();
  const access = fakeMidiAccess([input]);
  const events = [];
  const midiNavigator = { requestMIDIAccess: async () => access };
  const disconnect = await connectWebMidi(event => events.push(event), midiNavigator);

  input.state = "disconnected";
  access.inputs.delete(input.id);
  access.emitStateChange(input);

  assert.equal(input.onmidimessage, null);
  assert.equal(events.at(-1).connected, false);
  disconnect();
});

test("SoundKeys explains unsupported Web MIDI instead of silently failing", async () => {
  await assert.rejects(
    connectWebMidi(() => {}, {}),
    error => error?.code === "unsupported" && /Web MIDI/.test(error.message)
  );
});
