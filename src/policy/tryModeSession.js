/**
 * The anonymous try-mode session.
 *
 * A child arrives with no account, is given a nickname they did not choose,
 * plays, and leaves no trace. Everything about this module exists to keep that
 * sentence literally true.
 *
 * THE NICKNAME IS ASSIGNED, NEVER TYPED. This looks like a small detail and is
 * the most important line of defence in the whole feature. The moment a child
 * can type into a name field, some of them type their real name — and a real
 * name typed by a child is exactly the personal information the mode exists to
 * avoid collecting. There is no input. There is a list.
 *
 * The nickname is also not derived from anything about the visitor. No device
 * id, no IP hash, no timestamp fingerprint — it is a random pick, so two
 * children on the same device are not linkable and the same child is not
 * recognisable on their second visit. Being un-rejoinable is the point.
 */
import { demoEntitlement } from "./entitlementPolicy.js";
import { installEphemeralStorage } from "./ephemeralSession.js";

/**
 * Adjective + creature. Chosen to be warm, pronounceable by a five-year-old,
 * and impossible to read as a comment about the child — nothing about size,
 * cleverness, speed or appearance, because a child assigned "Tiny" or "Slow"
 * has been told something about themselves by a computer.
 */
const ADJECTIVES = Object.freeze([
  "Sunny", "Brave", "Merry", "Lucky", "Jolly", "Cosy", "Bright", "Kind",
  "Happy", "Cheery", "Bouncy", "Snug", "Breezy", "Sparkly", "Golden", "Cloudy"
]);

const CREATURES = Object.freeze([
  "Otter", "Badger", "Puffin", "Rabbit", "Hedgehog", "Squirrel", "Fox", "Owl",
  "Turtle", "Panda", "Koala", "Robin", "Beaver", "Seal", "Dormouse", "Heron"
]);

/** 256 combinations — plenty for a name that never has to be unique. */
export function makeNickname(random = Math.random) {
  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)] ?? ADJECTIVES[0];
  const creature = CREATURES[Math.floor(random() * CREATURES.length)] ?? CREATURES[0];
  return `${adjective} ${creature}`;
}

/**
 * The levels a visitor can start at.
 *
 * Choosing replaces the placement that would normally come from assessment
 * history, and it is better than the alternative in two ways: nothing has to be
 * measured about the child, and an adult can jump straight to the part that
 * interests them instead of grinding up from the beginning.
 */
export const TRY_LEVELS = Object.freeze([
  Object.freeze({
    id: "A",
    label: "Just starting",
    detail: "Learning letters and their sounds. Simple books with a few words a page."
  }),
  Object.freeze({
    id: "B",
    label: "Getting going",
    detail: "Sounding out short words. Longer books, a sentence or two a page."
  }),
  Object.freeze({
    id: "C",
    label: "Reading already",
    detail: "Reading sentences with confidence. Fuller stories and trickier sounds."
  })
]);

export function isTryLevel(id) {
  return TRY_LEVELS.some(level => level.id === id);
}

/**
 * What the grown-up is told. NOT the child — a five-year-old cannot read this
 * and would not care.
 *
 * `beforeStart` sets the expectation. `onLeaving` is the one that matters: the
 * moment that actually stings is finishing a book and finding there is nothing
 * to keep, and that is where an invitation to make an account belongs. Warning
 * somebody only at the front door means they meet the consequence alone.
 */
export const TRY_MODE_NOTICE = Object.freeze({
  beforeStart: {
    heading: "A quick try — nothing is saved",
    body:
      "No account, no sign-up, and nothing about your child is stored or sent anywhere. "
      + "That also means progress disappears when this page closes. "
      + "You are seeing a sample: about a fifth of the books, games and activities."
  },
  onLeaving: {
    heading: "Nothing from this session was kept",
    body:
      "That was the free try-out, so none of it was saved — by design, because we did not "
      + "ask for an account and did not want to hold anything about your child. "
      + "A school account keeps every child's progress and gives their teacher the reports.",
    callToAction: "See the full version"
  }
});

/**
 * Starts a try-mode session.
 *
 * Returns null if the storage swap fails, and THE CALLER MUST TREAT THAT AS
 * FATAL — show an apology, not the demo. A try-mode running against real
 * storage would be collecting data from a child while the screen told their
 * parent it was not, which is materially worse than the demo being unavailable.
 *
 * The caller is also responsible for `setEphemeralNetworkMode(true)` before any
 * child surface mounts; it lives in the data boundary rather than here so the
 * refusal sits at the choke point every request already passes through.
 */
export function beginTryModeSession({
  level = "A",
  random = Math.random,
  storageTarget = globalThis
} = {}) {
  const restore = installEphemeralStorage(storageTarget);
  if (!restore) return null;

  return {
    nickname: makeNickname(random),
    level: isTryLevel(level) ? level : TRY_LEVELS[0].id,
    entitlement: demoEntitlement(),
    startedAt: null,
    /** Puts real storage back. Ends the session; nothing survives it. */
    end: restore
  };
}
