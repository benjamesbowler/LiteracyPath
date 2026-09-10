// Runtime-facing game records for the flagship arcade. The canonical design
// rules live in docs/design/GAME_DESIGN_BIBLE.md. Keeping the child mission,
// control summary and recovery language here lets the chrome present the same
// finished help and completion experience around every engine.

export const ARCADE_PREMIUM_PROFILES = Object.freeze({
  "rocket-run": Object.freeze({
    completionPresentation: "engine",
    version: "2.0",
    mission: "Catch words that start with the shown sound.",
    objective: "Match a spoken and printed word to its beginning sound.",
    action: "Steer into a matching word.",
    controls: Object.freeze(["Steer: Left / Right or A / D", "Touch: tap a side or swipe"]),
    retry: "A missed target returns with support; a wrong catch names its real first sound.",
    completionTitle: "Flight complete",
    rewardLabel: "words caught"
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
    completionPresentation: "engine",
    version: "2.0",
    mission: "Climb through Moonwood to the lantern lookout.",
    objective: "Identify the printed word whose beginning sound matches the target phoneme.",
    action: "Hold up to climb. Steer around branches, collect lanterns, then jump to a word that starts with the target sound.",
    controls: Object.freeze(["Up or W: climb; Left/Right or A/D: steer", "At a word station: Left/Right choose; Space/Enter jump", "Touch: hold the arrows to climb; tap a word ledge to jump"]),
    retry: "Hear the beginning sound again. A safety vine returns you to your last safe ledge.",
    completionTitle: "Canopy reached",
    rewardLabel: "words climbed"
  }),
  "sound-racer": Object.freeze({
    version: "2.0",
    mission: "Drive through words that start with the sound.",
    objective: "Discriminate the target onset in printed and spoken words.",
    action: "Steer through a matching word gate.",
    controls: Object.freeze(["Steer: Left / Right or A / D", "Touch: tap a side or swipe"]),
    retry: "A wrong gate names the word and the target stays available on the next run.",
    completionTitle: "Race complete",
    rewardLabel: "sound matches"
  }),
  "word-bridge": Object.freeze({
    version: "2.0",
    mission: "Match and carry each shown part to rebuild the target.",
    objective: "Practise supported grapheme matching and ordered word or sentence reconstruction.",
    action: "Pick up the next tile and place it on the bridge.",
    controls: Object.freeze(["Move: Left / Right or A / D", "Pick or drop: Space, Enter, E, or Up"]),
    retry: "A wrong tile stays available while the next required slot remains visible.",
    completionTitle: "Bridge complete",
    rewardLabel: "bridges built"
  }),
  "sound-beat": Object.freeze({
    version: "2.0",
    mission: "Tap the arriving sounds on the beat, then blend the word.",
    objective: "Practise the sound sequence of a word through a musical performance.",
    action: "Tap as each sound reaches the line, then tap GO.",
    controls: Object.freeze(["Tap: Space, Enter or Up", "Touch: tap the stage on the beat"]),
    retry: "Missed notes return with a slower, wider timing window; the final GO waits for you.",
    completionTitle: "Set complete",
    rewardLabel: "words performed"
  }),
  "rhyme-pop": Object.freeze({
    version: "2.0",
    mission: "Pop every word that rhymes with the cue.",
    objective: "Identify words that share the target rime.",
    action: "Aim at and pop each rhyming balloon.",
    controls: Object.freeze(["Aim: pointer, touch, or Arrow keys", "Pop: Space, Enter, or Up"]),
    retry: "A miss names the chosen word and leaves the rhyming targets in play.",
    completionTitle: "Balloon round complete",
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
    completionPresentation: "engine",
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
