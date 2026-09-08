import assert from "node:assert/strict";
import test from "node:test";

import { buildSoundKeySession, findSoundKeyWord, soundKeyTokensForWord } from "../../src/features/soundkeys/content.js";
import { appendToken } from "../../src/features/soundkeys/engine.js";
import { connectWebMidi } from "../../src/features/soundkeys/inputProviders.js";

test("SoundKeys builds ten unique, seeded rounds for each curriculum band", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const first = buildSoundKeySession(difficulty, 20260908);
    const replay = buildSoundKeySession(difficulty, 20260908);
    assert.equal(first.length, 10);
    assert.deepEqual(first.map(word => word.id), replay.map(word => word.id));
    assert.equal(new Set(first.map(word => word.id)).size, 10);
  }

  const easy = buildSoundKeySession("easy", 20260908);
  const medium = buildSoundKeySession("medium", 20260908);
  const hard = buildSoundKeySession("hard", 20260908);
  assert.ok(easy.every(word => word.tokens.length === 3 && word.profile === "cvc"));
  assert.ok(medium.some(word => word.tokens.some(token => token.length > 1)));
  assert.ok(hard.some(word => word.tokens.length > 3 && word.tokens.some(token => token.length > 1)));
  assert.notDeepEqual(easy.map(word => word.id), medium.map(word => word.id));
  assert.notDeepEqual(medium.map(word => word.id), hard.map(word => word.id));
});

test("SoundKeys keeps authored grapheme units and exposes the matching input profile", () => {
  const hardWord = buildSoundKeySession("hard", 4).find(word => word.id === "boat") || buildSoundKeySession("hard", 4)[0];
  assert.ok(hardWord.tokens.some(token => token.length > 1));
  assert.ok(soundKeyTokensForWord(hardWord).includes("oa"));
  assert.deepEqual(appendToken([], "oa", hardWord.tokens.length), ["oa"]);
  assert.equal(findSoundKeyWord(hardWord.tokens)?.id, hardWord.id);
});

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
