// Runtime-facing game records for the flagship arcade. The canonical design
// rules live in docs/design/GAME_DESIGN_BIBLE.md. Keeping the child mission,
// control summary and recovery language here lets the chrome present the same
// finished help and completion experience around every engine.

export const ARCADE_PREMIUM_PROFILES = Object.freeze({
  "tower-tumble": Object.freeze({
    version: "1.0", mission: "Climb the towers and smash sound bricks to rescue the cargo.",
    objective: "Encode a picture- and audio-cued word with ordered graphemes; motor timing does not determine correctness.",
    action: "Climb or jump to a brick, then smash the next sound part.",
    controls: Object.freeze(["Arrows or WASD: move and climb; Space: jump; E: smash", "Touch: movement on the left, Jump and Smash on the right; Hear replays"]),
    retry: "Accepted parts stay built. Two wrong spelling attempts offer a partial hint. Barrel contact costs one of three lives and returns you to a safe ledge; Retry route keeps your built sounds. Each new word changes the platforms and ladders.",
    completionTitle: "Cargo rescued", rewardLabel: "words built"
  }),
  "rally-pals": Object.freeze({
    version: "1.0", mission: "Aim a sound serve, return the ball and build a rally.",
    objective: "Choose the grapheme or reading response matching the heard sound; shot intent is separate from racket contact.",
    action: "Aim at a sound zone and swing, then play the rally.",
    controls: Object.freeze(["Arrows or WASD: move; choose a court zone; Space: swing; E: lob", "Touch: move on the left, aim across the court, Swing and Lob on the right"]),
    retry: "The serve waits for your sound choice. A missed ball is a motor miss; replay keeps the same sound zones.",
    completionTitle: "Match complete", rewardLabel: "sound serves"
  }),
  "burrow-builders": Object.freeze({
    completionPresentation: "engine", version: "1.0", mission: "Craft useful structures and build your own island.",
    objective: "Encode heard blueprint words and apply reading instructions; building artistry and motor placement are separate from literacy evidence.",
    action: "Place the next sound part to craft a structure, then build with the blocks.",
    controls: Object.freeze(["Arrows or WASD: move; E: place; Backspace: pick up; Q: rotate", "Touch: choose a large grid cell, then Place or Pick up; ordinary blocks are unlimited"]),
    retry: "Lift the mistaken piece and try again. Correct pieces and your island stay saved; two wrong attempts permit partial help.",
    completionTitle: "Island ready", rewardLabel: "blueprints built"
  }),
  "drum-trail": Object.freeze({
    version: "1.1",
    mission: "Help Bouncy cross the stream by counting a word’s syllables.",
    objective: "Count the syllables in a familiar whole word, supported by its picture and unsegmented spelling, without a beat deadline.",
    action: "Look at or hear the word and select the crossing with that many drum stones.",
    controls: Object.freeze(["Keyboard: Tab to a crossing, then Enter or Space", "Touch: tap a crossing; tap Hear to replay"]),
    retry: "Hear the whole word again. A demonstrated syllable count becomes supported practice.",
    completionTitle: "Crossings complete",
    rewardLabel: "words practised"
  }),
  "lantern-lagoon": Object.freeze({
    version: "1.0",
    mission: "Light the scene that matches the sentence.",
    objective: "Understand who, what or where in a literal sentence; keep reading and delivered listening support distinct.",
    action: "Read or hear the sentence, then tap its matching scene to open the lagoon route.",
    controls: Object.freeze(["Keyboard: Tab to a scene, then Enter or Space", "Touch: tap a scene; tap Hear for available sentence audio"]),
    retry: "Compare the chosen scene with the sentence. A full-sentence replay or demonstration remains supported practice.",
    completionTitle: "Lagoon lit",
    rewardLabel: "sentences practised"
  }),
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
    mission: "Listen, then run and jump to collect each letter in order.",
    objective: "Spell the word you hear by collecting its letters in order, with picture cues and supported retries.",
    action: "Run and jump through the next needed letter.",
    controls: Object.freeze(["Move: Left / Right or A / D", "Jump: Up, W, or Space"]),
    retry: "Missed letters stay in place. After two mistakes, a partial hint helps; words already spelled stay saved through catch-up stages.",
    completionTitle: "Trail complete",
    rewardLabel: "words spelled"
  }),
  "word-climb": Object.freeze({
    completionPresentation: "engine",
    version: "2.0",
    mission: "Climb to the canopy and jump to the matching word.",
    objective: "Identify the printed word whose beginning sound matches the target phoneme.",
    action: "Hold up to climb. Steer around branches, collect lights, then jump to a word that starts with the target sound.",
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
    mission: "Tap the arriving sounds to perform the word.",
    objective: "Practise the sound sequence of a word through a musical performance.",
    action: "Tap as each sound reaches the line; a finished sequence blends automatically.",
    controls: Object.freeze(["Tap: Space, Enter or Up", "Touch: tap the stage on the beat"]),
    retry: "Missed notes return with a slower, wider timing window.",
    completionTitle: "Set complete",
    rewardLabel: "words performed"
  }),
  "rhyme-pop": Object.freeze({
    version: "2.0",
    mission: "Pop every word that rhymes with the cue.",
    objective: "Identify words that share the target rime.",
    action: "Aim at and pop each rhyming balloon.",
    controls: Object.freeze(["Aim: pointer, touch, Left/Right or A/D", "Fire: blue button, Space, Enter or Up"]),
    retry: "A wrong rhyme names the contrast and keeps the same choices; two errors add an ending-sound hint.",
    completionTitle: "Festival complete",
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
    rewardLabel: "words completed"
  }),
  "reel-read": Object.freeze({
    version: "2.0",
    mission: "Catch the word parts or meanings that fit.",
    objective: "Apply word-part, meaning and morphology knowledge to a clue.",
    action: "Steer over a matching fish and cast. Hold Reel to bring it in; release to ease the line.",
    controls: Object.freeze(["Steer: Left / Right or A / D", "Cast / Reel: Space, Enter, E, or Up / Down", "Hold to reel; release to ease"]),
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
    rewardLabel: "repairs completed"
  }),
  "sentence-express": Object.freeze({
    completionPresentation: "engine",
    version: "2.0",
    mission: "Couple word cars to build the sentence in order.",
    objective: "Reconstruct sentence order, capitals, words and punctuation.",
    action: "Choose each car or repair part, then press Send the train!",
    controls: Object.freeze(["Move focus: Tab or Shift + Tab", "Choose: Enter, Space, or tap"]),
    retry: "A wrong part names the fault and the unfinished sentence stays visible.",
    completionTitle: "Rail line complete",
    rewardLabel: "sentence words coupled"
  }),
  "grammar-grind": Object.freeze({
    version: "2.0",
    mission: "Skate through the sounds to build each word.",
    objective: "Build a pictured, recorded word with its ordered graphemes.",
    action: "Skate through each grapheme in order. The final part completes the word.",
    controls: Object.freeze(["Skate: arrows or W / A / S / D. Forward builds speed.", "Jump / Trick: Space or Enter. Press again in the air to spin; use by a rail to grind."]),
    retry: "A wrong choice teaches the sound contrast; two wrong choices unlock a partial spelling hint.",
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
