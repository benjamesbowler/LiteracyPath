// Runtime-facing game records for the flagship arcade. The canonical design
// rules live in docs/design/GAME_DESIGN_BIBLE.md. Keeping the child mission,
// control summary and recovery language here lets the chrome present the same
// finished help and completion experience around every engine.

export const ARCADE_PREMIUM_PROFILES = Object.freeze({
  "rocket-run": Object.freeze({
    version: "3.0",
    mission: "Power word gates to deliver the cargo.",
    objective: "Match a spoken and printed word to its beginning sound.",
    action: "Choose a matching word, then fly through its gate.",
    controls: Object.freeze(["Steer: Left / Right or A / D", "Touch: choose a gate, then Fly through", "Fly: Enter / Space outside a button; Enter activates the focused button"]),
    retry: "A wrong gate names the word's first sound and returns you to fresh choices. No word is lost to timing or steering.",
    completionTitle: "Delivery complete",
    rewardLabel: "word gates powered"
  }),
  "letter-leap": Object.freeze({
    version: "2.0",
    mission: "Grab each letter in order to spell the word.",
    objective: "Encode a spoken or picture-cued word by selecting its graphemes in order.",
    action: "Run and jump through the next needed letter.",
    controls: Object.freeze(["Move: Left / Right or A / D", "Jump: Up, W, or Space"]),
    retry: "Words already spelled stay saved when a difficult stage returns later.",
    completionTitle: "Trail complete",
    rewardLabel: "words spelled"
  }),
  "word-climb": Object.freeze({
    version: "2.0",
    mission: "Choose every word that starts with the shown sound.",
    objective: "Identify the printed word whose beginning sound matches the target phoneme.",
    action: "Read three leaf words, then choose the matching word to climb.",
    controls: Object.freeze(["Choose: Tab, then Enter or Space", "Touch: tap a word leaf"]),
    retry: "A wrong leaf names its real beginning sound while the target and all choices stay visible.",
    completionTitle: "Canopy reached",
    rewardLabel: "words climbed"
  }),
  "sound-racer": Object.freeze({
    version: "2.0",
    mission: "Choose a matching word to open each village road.",
    objective: "Identify a printed word whose beginning sound matches the target; printed-target support remains explicit.",
    action: "Choose a word on a road sign, then press Drive through.",
    controls: Object.freeze(["Choose: Left / Right or A / D; drive: Space", "Touch: tap a word sign, then Drive through"]),
    retry: "A wrong choice names its real beginning sound. The same fork stays open for another try.",
    completionTitle: "Rally complete",
    rewardLabel: "roads opened"
  }),
  "word-bridge": Object.freeze({
    version: "2.0",
    mission: "Choose pieces to build a bridge for your pals.",
    objective: "Build words and sentences from a model or a recorded cue.",
    action: "Choose a piece, then choose its bridge space.",
    controls: Object.freeze(["Choose: Tab or Left / Right", "Pick and place: Enter or Space; touch: tap each piece and space"]),
    retry: "A wrong tile stays available while the next required slot remains visible.",
    completionTitle: "Bridge complete",
    rewardLabel: "bridges built"
  }),
  "sound-beat": Object.freeze({
    version: "2.0",
    mission: "Choose each matching sound or word part, then blend.",
    objective: "Identify and order the taught units that rebuild a word or sentence.",
    action: "Choose the next matching pad, then choose GO to blend or read the result.",
    controls: Object.freeze(["Choose: Left/Right, then Space or Enter", "Touch: tap a sound pad"]),
    retry: "A wrong pad names the contrast and stays available; beat timing only adds bonus feedback.",
    completionTitle: "Set complete",
    rewardLabel: "words blended"
  }),
  "rhyme-pop": Object.freeze({
    version: "3.0",
    mission: "Pop the rhyming words to lift each balloon basket.",
    objective: "Identify words that share the target rime.",
    action: "Choose every rhyming balloon; each different rhyme fills a basket tether.",
    controls: Object.freeze(["Choose: released tap, Tab or Arrow keys", "Pop: Space or Enter"]),
    retry: "Both words are compared aloud. The target and remaining rhymes stay in play.",
    completionTitle: "Parade ready!",
    rewardLabel: "rhymes found"
  }),
  "sound-safari": Object.freeze({
    version: "2.0",
    mission: "Net each sound in the word, in order.",
    objective: "Segment a spoken word into its ordered phoneme sequence.",
    action: "Move the net to the next sound and catch it.",
    controls: Object.freeze(["Move: Arrow keys or W / A / S / D", "Catch: Space or Enter"]),
    retry: "The field guide keeps the next sound visible and replays the word when needed.",
    completionTitle: "Safari complete",
    rewardLabel: "sounds collected"
  }),
  "reel-read": Object.freeze({
    version: "2.0",
    mission: "Catch the word parts or meanings that fit.",
    objective: "Apply word-part, meaning and morphology knowledge to a clue.",
    action: "Steer over a matching fish and cast the hook.",
    controls: Object.freeze(["Steer: Left / Right or A / D", "Cast: Space, Enter, E, or Up"]),
    retry: "A wrong catch explains the mismatch and keeps the clue on screen.",
    completionTitle: "Fishing trip complete",
    rewardLabel: "catches read"
  }),
  "star-gallery": Object.freeze({
    version: "2.0",
    mission: "Cut the tree that fixes the sentence.",
    objective: "Choose the unique word or mark that repairs a sentence.",
    action: "Drive to the matching tree and cut it.",
    controls: Object.freeze(["Drive: Arrow keys or W / A / S / D", "Cut: Space, Enter, or E"]),
    retry: "A wrong tree names the choice and gives a more specific repair hint.",
    completionTitle: "Grove restored",
    rewardLabel: "sentences fixed"
  }),
  "sentence-express": Object.freeze({
    version: "2.0",
    mission: "Couple word cars to build the sentence in order.",
    objective: "Reconstruct sentence order, capitals, words and punctuation.",
    action: "Choose each car or repair part, then send the train.",
    controls: Object.freeze(["Move focus: Tab or Shift + Tab", "Choose: Enter, Space, or tap"]),
    retry: "A wrong part names the fault and the unfinished sentence stays visible.",
    completionTitle: "Rail line complete",
    rewardLabel: "sentence words coupled"
  }),
  "grammar-grind": Object.freeze({
    version: "2.0",
    mission: "Collect sound spellings, then choose the built word.",
    objective: "Encode a spoken word with its ordered graphemes.",
    action: "Skate through the next grapheme, then the matching word gate.",
    controls: Object.freeze(["Skate: Arrow keys or W / A / S / D", "Trick: Space or Enter"]),
    retry: "The first miss teaches the contrast; a repeated miss points to the correct spelling.",
    completionTitle: "Skate line complete",
    rewardLabel: "words built"
  }),
  "soundkeys": Object.freeze({
    version: "1.0",
    mission: "Play the sounds in order to build the word.",
    objective: "Blend ordered phonemes into a printed word.",
    action: "Press a sound key or play its MIDI note.",
    controls: Object.freeze(["Choose a sound: onscreen key or computer keyboard", "Optional: connect a MIDI keyboard"]),
    retry: "Listen again, clear the row, and build the sounds from left to right.",
    completionTitle: "Word lab complete",
    rewardLabel: "words built"
  })
});

export function premiumProfileForGame(gameId) {
  return ARCADE_PREMIUM_PROFILES[String(gameId || "")] || null;
}
