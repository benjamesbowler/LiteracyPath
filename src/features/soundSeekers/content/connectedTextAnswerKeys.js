const AUTHORED_FEEDBACK = [
  [1, ["lift"], "Lifting the mat repeats the exact scene action.", [
    ["a", "Sitting beside the mat leaves the lantern cover in place.", "The words say lift, so show the mat moving up."],
    ["c", "The picture of the mat already down repeats the problem.", "Choose the picture that shows the mat being lifted."]
  ]],
  [2, ["sit"], "Sitting on the fin matches every word.", [
    ["b", "Fitting the fin changes sit to a different action.", "Read the first action word again: sit."],
    ["c", "Fanning the fin is not named in the scene.", "Show the body action named by sit."]
  ]],
  [3, ["hit"], "Hitting the hot rock follows the wind-stone command.", [
    ["a", "Sitting on the rock cannot turn the wind stone.", "Find the action hit before hot rock."],
    ["b", "Hitting the hot hat changes the named object from rock to hat.", "Keep the action hit, but match it to the hot rock."]
  ]],
  [4, ["fit"], "Fitting the bun in the bin repeats the ford repair.", [
    ["a", "Putting the bun on the bin changes the named position.", "The words place the bun in the bin, not on it."],
    ["c", "The bud is a close-sounding object, but the text names a bun.", "Fit the bun, not the bud, in the bin."]
  ]],
  [6, ["home"], "Putting the buzz home in the box follows all five words.", [
    ["a", "Putting the buzz in the net changes its named home.", "Guide the buzz home to the box, not the net."],
    ["b", "Loading the box into the van moves the wrong thing.", "The buzz is the thing that must go home in the box."]
  ]],
  [7, ["off"], "Taking jam off the bell frees the ferry signal.", [
    ["b", "Taking the bell off the mat moves the bell but leaves its jam.", "Move the jam off the bell, not the bell off the mat."],
    ["c", "Leaving the jam on the bell keeps the signal stuck.", "Off means the jam must leave the bell."]
  ]],
  [8, ["mat"], "Patching the net with the mat uses the named repair material.", [
    ["a", "The box is a plausible patch, but the text names the mat.", "Match the net to the mat named in the words."],
    ["c", "Using the mat on the bell fixes the wrong object.", "The mat must fix the net, not the bell."]
  ]],
  [9, ["fix"], "Fixing the ship is the stated wheelhouse repair.", [
    ["a", "Fixing the fish changes the object named in the sentence.", "Fix the ship, not the fish."],
    ["b", "Fixing the net is a useful job, but not this wheelhouse job.", "The sentence names the ship as the thing to fix."]
  ]],
  [11, ["pick"], "Picking up the path rock reveals the amber marker.", [
    ["b", "Kicking the path rock ignores the action pick.", "Keep the path rock and pick it up."],
    ["c", "Sitting on the rock covers the marker.", "Raise the rock so the path can show."]
  ]],
  [12, ["lift"], "Lifting the lamp by hand follows the complete sentence.", [
    ["a", "Kicking the lamp uses a different action and could damage it.", "The sentence tells Amber to lift the lamp."],
    ["b", "Picking the lamp does not show the upward action named in the text.", "Choose the action lift, not pick."]
  ]],
  [13, ["spin"], "Spinning at the marked spot reveals the ash-flat route.", [
    ["a", "Sitting at the spot performs no turning action.", "Make the marked spot spin."],
    ["c", "Skipping at the spot changes the named action from spin.", "Stay at the spot and do the named spin action."]
  ]],
  [14, ["clap"], "Clapping at the flag makes the bridge signal named in the text.", [
    ["b", "Flipping the flag off removes the bridge signal.", "Keep the flag on the block and clap at it."],
    ["c", "Clapping at the block targets the support instead of the flag.", "Clap at the flag named in the sentence."]
  ]],
  [16, ["click"], "Clicking the lock by the gate follows the gearworks command.", [
    ["a", "Clicking the flag selects a nearby marker instead of the lock.", "The instruction names the lock as the thing to click."],
    ["c", "Flying by the lock does not operate it.", "Bolt's lane opens when the lock is clicked."]
  ]],
  [17, ["lift"], "Lifting the rock off the ship removes the hopper block.", [
    ["a", "Kicking the rock can strike the ship instead of clearing it.", "Lift the rock off the ship without kicking it."],
    ["b", "Sitting on the rock adds weight to the jam.", "Do not sit on the rock that blocks the ship."]
  ]],
  [18, ["hot"], "Making the flame hot directly relights the plate foundry.", [
    ["b", "Heating the cake changes the wrong thing.", "The second sentence says to make the flame hot."],
    ["c", "Heating the plate leaves the flame cold.", "Relight the foundry by making the flame hot."]
  ]],
  [19, ["slide"], "Sliding the bike off the ship clears the named block.", [
    ["a", "Hiding the bike leaves it on the ship.", "The bike must slide off the ship."],
    ["c", "Riding the bike does not remove it from the ship.", "Slide the bike off instead of riding it."]
  ]],
  [21, ["cube"], "Fastening the rope to the cube matches both ship sentences.", [
    ["a", "The mule is not the object beside the ship.", "Find the object the text places by the ship."],
    ["b", "The gate is not named as the rope anchor.", "The rope is on the cube, not the gate."]
  ]],
  [22, ["rain"], "The rain picture directly matches the stated theme.", [
    ["b", "Run is a close-sounding action, not the named rain theme.", "Match the picture to rain, not run."],
    ["c", "The flame picture contradicts the rain theme.", "The theme is rain, not flame."]
  ]],
  [23, ["by"], "Placing the rain tray by the train preserves the stated position.", [
    ["a", "Putting the tray on the train changes by to on.", "By means beside, not on top."],
    ["c", "Putting the tray in the train changes by to in.", "Keep the rain tray beside the train."]
  ]],
  [24, ["clap"], "Clapping with the singing tree supplies the causeway rhythm.", [
    ["a", "Singing repeats what the tree already does but omits the named clap.", "Join the tree's song with the clap action."],
    ["b", "Sitting by the tree does not add the named rhythm.", "Stay with the tree and clap."]
  ]],
  [26, ["coat"], "The coat road is the landmark explicitly named for the boat.", [
    ["b", "Snow is a rhyming decoy, not the road marker.", "Read the landmark again: coat."],
    ["c", "Goat is a plausible rhyme but is not the landmark.", "Match the road to coat, not goat."]
  ]],
  [27, ["glue"], "Gluing the blue moon coat follows the shelter repair sentence.", [
    ["a", "Food in the room does not cover the snowy shelter.", "Choose the blue moon coat named after glue."],
    ["c", "Putting snow in the room adds to the shelter problem.", "Attach the blue moon coat with glue."]
  ]],
  [28, ["light"], "Hooking the light shown in the book restores the signal.", [
    ["a", "Hooking the book to the boat moves the clue instead of the signal.", "Look in the book, then hook the light."],
    ["b", "Hiding the light in the book keeps the harbour dark.", "The signal light must show, not hide."]
  ]],
  [29, ["stop"], "Sitting while the loud sound stops follows the calm-cove sequence.", [
    ["b", "Banging the rock adds a new loud sound.", "Let the sound stop instead of adding a bang."],
    ["c", "Making the sound louder is the opposite of calm.", "Calm needs less sound, not more."]
  ]],
  [31, ["by"], "Parking the car by the gate repeats the route sentence.", [
    ["a", "Starting down the dark path passes the stopping place.", "The scene says park by the gate."],
    ["c", "Hiding at the farm moves the car away from the gate.", "The car belongs beside the gate, not at the farm."]
  ]],
  [32, ["draw"], "Drawing the dark star on the tree follows the echo-root repair.", [
    ["a", "Sawing cuts down the tree instead of marking it.", "Keep the tree and draw the dark star."],
    ["b", "Storing the star does not put its mark on the tree.", "The final sentence says to draw the star on the tree."]
  ]],
  [33, ["draw"], "Drawing the bird's turn records the place on Orbit's map.", [
    ["b", "Looking at the bird observes it but records no turn.", "Draw where the bird turned instead."],
    ["c", "Sitting by the fern records no route.", "The living map needs the turn drawn."]
  ]],
  [34, ["stair"], "Pairing chair with stair repeats the final alignment sentence.", [
    ["a", "Hair is a rhyme decoy, not the chair's partner.", "Match the two objects named together."],
    ["c", "Pairing the stair with hair leaves the chair unmatched.", "The text pairs chair with stair."]
  ]],
  [36, ["bright"], "Pure light making the stair bright supplies the stated repair.", [
    ["a", "Following the creature does not change the dark stair.", "Stay at the stair and change its light."],
    ["b", "Showing the stair still dark repeats the problem.", "The stair must become bright."]
  ]],
  [37, ["read"], "Reading the magic words at the lock follows the archive clue.", [
    ["b", "Climbing into the city cell bypasses the archive lock.", "The words act at the lock."],
    ["c", "Resting beside the lock ignores the ready words.", "Read the ready words instead of resting."]
  ]],
  [38, ["join"], "Joining the star path lets the cats step across the causeway.", [
    ["a", "Following the dogs leaves the cats' path divided.", "Stay with the star path and join it."],
    ["c", "Sitting by the stars leaves the path divided.", "The cats need the path joined."]
  ]],
  [39, ["little"], "Taking the little puzzle over the bridge follows both clauses.", [
    ["a", "Leaving the puzzle behind cannot complete the bridge.", "The little puzzle must cross the bridge."],
    ["b", "Taking the rocks contradicts the instruction to leave them.", "Leave the rocks and take the puzzle."]
  ]]
];

function record(stopIndex, forbiddenPromptTokens, supportedRationale, misses) {
  const sceneId = `scene-s${stopIndex}`;
  const tokens = ["a", "b", "c"].map(letter => `ct-s${stopIndex}-${letter}`);
  const misconceptionByToken = Object.fromEntries(misses.map(([letter, misconception]) =>
    [`ct-s${stopIndex}-${letter}`, misconception]));
  const correctionByToken = Object.fromEntries(misses.map(([letter, , correction]) =>
    [`ct-s${stopIndex}-${letter}`, correction]));
  const rationaleByToken = Object.fromEntries(tokens.map(token => [token,
    misconceptionByToken[token] || supportedRationale]));
  return [sceneId, Object.freeze({
    forbiddenPromptTokens: Object.freeze(forbiddenPromptTokens),
    misconceptionByToken: Object.freeze(misconceptionByToken),
    correctionByToken: Object.freeze(correctionByToken),
    rationaleByToken: Object.freeze(rationaleByToken)
  })];
}

export const CONNECTED_TEXT_DECISION_FEEDBACK = Object.freeze(
  Object.fromEntries(AUTHORED_FEEDBACK.map(args => record(...args)))
);
