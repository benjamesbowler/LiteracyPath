// One original, supported language unit. It writes no learner results.
export const HOP_AND_STOP_ROOT = "/action-songs/hop-and-stop";

// These are the words in the performed song, including its extra chorus hop.
export const HOP_AND_STOP_SONG_LINES = Object.freeze([
  "Hop, hop, hop with me.",
  "Hop, hop, hop, one, two, three.",
  "Up we go and down we drop.",
  "Hop, hop, hop and stop!",
  "Bouncy goes up.",
  "Bouncy comes down.",
  "Two spring feet land on the ground.",
  "Speedy goes up.",
  "Speedy comes down.",
  "Now we stop and look around.",
  "Hop, hop, hop with me.",
  "Hop, hop, hop, one, two, three.",
  "Up we go and down we drop.",
  "Hop, hop, hop and stop!",
  "Up, up. Down.",
  "Feet are safely on the ground.",
  "Stop, stop. Still as can be.",
  "Then hop again with me!",
  "Hop, hop, hop and stop!",
  "Hop, hop, hop and stop!"
]);

export const HOP_AND_STOP_PAGES = Object.freeze([
  { text: "“Hop with me!” says Bouncy.", alt: "Bouncy invites Speedy to play on a safe grassy patch beside a low grassy hill." },
  { text: "Bouncy goes up.", alt: "Bouncy rises from the grass on her two spring legs. Speedy watches." },
  { text: "Bouncy comes down.", alt: "Bouncy lands on both attached hooves, her springs gently compressing." },
  { text: "Speedy hops up.", alt: "Speedy makes a small dog hop, with all four paws briefly above the grass." },
  { text: "Speedy comes down.", alt: "Speedy lands softly on the grassy ground while Bouncy watches." },
  { text: "“Stop!” They both stop.", alt: "Both friends stand still with their feet on the grass. A butterfly approaches." },
  { text: "A butterfly lands on Speedy’s nose.", alt: "Speedy holds still with a butterfly gently resting on his nose. Bouncy looks amused." },
  { text: "The butterfly flies up. They hop again.", alt: "The butterfly lifts away safely as the two friends hop again." }
].map((page, index) => Object.freeze({
  ...page,
  number: index + 1,
  image: `${HOP_AND_STOP_ROOT}/reader/page-${String(index + 1).padStart(2, "0")}.webp`,
  audio: `${HOP_AND_STOP_ROOT}/audio/page-${String(index + 1).padStart(2, "0")}.mp3`
})));

export const HOP_AND_STOP_ACTIONS = Object.freeze({
  hop: Object.freeze({ label: "hop", contrast: "stop", cue: "What is Bouncy doing?", alt: "Bouncy hopping while Speedy watches.", result: "Bouncy hops." }),
  stop: Object.freeze({ label: "stop", contrast: "hop", cue: "What is Bouncy doing?", alt: "Bouncy and Speedy standing still with their feet on the grass.", result: "Bouncy stops." }),
  up: Object.freeze({ label: "up", contrast: "down", cue: "Where is the butterfly?", alt: "The butterfly above Bouncy and Speedy.", result: "The butterfly is up above the friends." }),
  down: Object.freeze({ label: "down", contrast: "up", cue: "Where is the butterfly?", alt: "The butterfly low down beside the daisies.", result: "The butterfly is down beside the daisies." })
});

export const HOP_AND_STOP_ROUNDS = Object.freeze([
  ["hop", ["hop", "stop"]],
  ["stop", ["hop", "stop"]],
  ["up", ["down", "up"]],
  ["down", ["down", "up"]],
  ["stop", ["stop", "hop"]],
  ["hop", ["stop", "hop"]],
  ["down", ["up", "down"]],
  ["up", ["up", "down"]]
].map(([target, choices], index) => Object.freeze({ id: index + 1, target, choices: Object.freeze(choices) })));

export const HOP_AND_STOP_MEDIA = Object.freeze({
  video: `${HOP_AND_STOP_ROOT}/hop-and-stop.mp4`,
  song: `${HOP_AND_STOP_ROOT}/hop-and-stop.mp3`,
  pdf: `${HOP_AND_STOP_ROOT}/hop-and-stop-reader.pdf`,
  release: `${HOP_AND_STOP_ROOT}/release.json`
});

export function hopAndStopActionImage(word) {
  return HOP_AND_STOP_ACTIONS[word] ? `${HOP_AND_STOP_ROOT}/actions/${word}.webp` : "";
}

export function hopAndStopWordAudio(word) {
  return HOP_AND_STOP_ACTIONS[word] ? `${HOP_AND_STOP_ROOT}/audio/${word}.mp3` : "";
}

export const HOP_AND_STOP_REQUIRED_MEDIA = Object.freeze([
  HOP_AND_STOP_MEDIA.video,
  HOP_AND_STOP_MEDIA.song,
  HOP_AND_STOP_MEDIA.pdf,
  ...HOP_AND_STOP_PAGES.flatMap(page => [page.image, page.audio]),
  ...Object.keys(HOP_AND_STOP_ACTIONS).flatMap(word => [hopAndStopActionImage(word), hopAndStopWordAudio(word)])
]);

// The action-song catalogue is separate from independently graded A–H books.
export const ACTION_SONG_CONTENT = Object.freeze([Object.freeze({
  id: "hop-and-stop",
  title: "Hop and Stop",
  format: "song",
  readingPlacement: "Read Together; supported language, without an independent decoding level",
  pages: Object.freeze(HOP_AND_STOP_PAGES.map(page => page.text)),
  lyrics: HOP_AND_STOP_SONG_LINES,
  targets: Object.freeze(Object.keys(HOP_AND_STOP_ACTIONS))
})]);

// The producer writes this release receipt only after checking the complete pack.
// Partial or malformed receipts never add a new destination to a child's Books.
export function isHopAndStopPublished(receipt) {
  if (receipt?.schemaVersion !== 1 || receipt?.id !== "hop-and-stop" || receipt?.status !== "complete") return false;
  if (!Array.isArray(receipt.verifiedMedia)) return false;
  const verified = new Set(receipt.verifiedMedia);
  return HOP_AND_STOP_REQUIRED_MEDIA.every(path => verified.has(path));
}

export function canOpenHopAndStop({ published = false, focusLocked = false, exactBookLock = false, restrictedLibrary = false } = {}) {
  return published && !focusLocked && !exactBookLock && !restrictedLibrary;
}

export function nextHopAndStopRound(state, action) {
  if (action.type === "restart") return { index: 0, phase: "choosing", wrong: "" };
  if (action.type === "choose" && state.phase === "choosing") {
    const round = HOP_AND_STOP_ROUNDS[state.index];
    if (!round?.choices.includes(action.word)) return state;
    return action.word === round.target
      ? { ...state, phase: "feedback", wrong: "" }
      : { ...state, wrong: action.word };
  }
  if (action.type === "advance" && state.phase === "feedback") {
    return state.index + 1 === HOP_AND_STOP_ROUNDS.length
      ? { ...state, phase: "complete" }
      : { index: state.index + 1, phase: "choosing", wrong: "" };
  }
  return state;
}
