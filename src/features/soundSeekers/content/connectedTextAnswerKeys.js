const AUTHORED_FEEDBACK = [
  [1, ["lift"], "Lifting the mat reveals the seed light named by the mission.", [
    ["a", "Lifting the light moves the thing that should be uncovered.", "Lift the covering mat, not the seed light."],
    ["c", "Lifting several mats changes the single mat named in the text.", "Lift the one mat that covers the light."]
  ]],
  [2, ["fit"], "Fitting the missing fin repairs Tumble's fern step.", [
    ["b", "Sitting beside the fin leaves the step part loose.", "Fit the fin into its matching step."],
    ["c", "Fanning the fin moves air but does not attach the part.", "Mend the step by fitting its fin."]
  ]],
  [3, ["hit"], "Hitting the hot rock drum starts the wind-stone mechanism.", [
    ["a", "Sitting on the rock drum does not strike it.", "Hit the hot rock drum to start it."],
    ["b", "Hitting a hat changes the rock drum into the wrong object.", "Keep hit and hot, but choose the rock drum."]
  ]],
  [4, ["fit"], "Fitting the hard rock in the gap completes the ford path.", [
    ["a", "A soft bun is lunch, not a firm piece for the ford gap.", "Fit the hard rock into the gap."],
    ["c", "Putting the rock on the gap leaves the open space unfilled.", "Fit the rock in the gap, not on it."]
  ]],
  [6, ["home"], "Moving the buzzing bee box home guides the bees with it.", [
    ["a", "Taking the net home leaves the buzzing bee box behind.", "Move the box that buzzes home."],
    ["b", "Taking the van home chooses a vehicle instead of the bee box.", "The buzzing box is the thing that goes home."]
  ]],
  [7, ["off"], "Taking jam off the bell frees the ferry signal.", [
    ["b", "Taking the bell off the mat moves the bell but leaves its jam.", "Move the jam off the bell, not the bell off the mat."],
    ["c", "Leaving the jam on the bell keeps the signal stuck.", "Off means the jam must leave the bell."]
  ]],
  [8, ["cut"], "Cutting the blocking net clears the fishpool channel.", [
    ["a", "Fixing the net keeps the channel block in place.", "Clear the channel by cutting the net."],
    ["c", "Cutting the bell damages the signal and leaves the net blocking the channel.", "Cut the net, not the bell."]
  ]],
  [9, ["fit"], "Fitting the ship fin lets the wheelhouse mechanism spin.", [
    ["a", "A fish fin belongs to a fish, not the ship mechanism.", "Fit the ship fin into the wheelhouse."],
    ["b", "Sitting beside the ship does not attach its missing fin.", "Fit the fin so the mechanism can spin."]
  ]],
  [11, ["pick"], "Picking the rock off the path reveals the amber marker.", [
    ["b", "Kicking the rock on the path can leave it covering the marker.", "Pick the rock off the path."],
    ["c", "Sitting on the path rock keeps the marker covered.", "Remove the rock instead of sitting on it."]
  ]],
  [12, ["fit"], "Fitting the lamp into the lift repairs the loose lift part.", [
    ["a", "Lifting the loose lamp moves it without fitting it into place.", "Fit the lamp in the lift."],
    ["b", "A ship lamp is a different part from Amber's lift lamp.", "Fit the named lamp into the lift."]
  ]],
  [13, ["spin"], "Spinning the fan blows the ash away and clears the path.", [
    ["a", "Sitting at the fan makes no air to move the ash.", "Spin the fan to clear the trail."],
    ["c", "Hitting the fan does not make the steady wind the path needs.", "Use the spin action named in the text."]
  ]],
  [14, ["clap"], "Clapping at the magic flag makes the fern path grow.", [
    ["b", "Flipping the flag changes its position but does not trigger its clap magic.", "Clap at the flag to grow the bridge."],
    ["c", "Clapping at the block targets the support instead of the magic flag.", "Aim the clap at the flag."]
  ]],
  [16, ["click"], "Clicking the gearworks lock lifts the gate from Bolt's lane.", [
    ["a", "Clicking the flag chooses a marker instead of the gate lock.", "Click the lock that controls the gate."],
    ["c", "Flying past the lock leaves the gate mechanism untouched.", "Operate the lock with a click."]
  ]],
  [17, ["lift"], "Lifting the rock off the bin clears Soot's ore hopper.", [
    ["a", "Kicking the rock farther in makes the hopper jam worse.", "Lift the rock off the hopper bin."],
    ["b", "Sitting on the rock adds weight to the hopper block.", "Lift the blocking rock instead of sitting on it."]
  ]],
  [18, ["hot"], "Making the flame hot directly relights the plate foundry.", [
    ["b", "Heating the cake changes the wrong thing.", "The second sentence says to make the flame hot."],
    ["c", "Heating the plate leaves the flame cold.", "Relight the foundry by making the flame hot."]
  ]],
  [19, ["slide"], "Sliding the bike off the train path clears the night-train track.", [
    ["a", "Hiding the bike can leave it blocking the train path.", "Slide the bike off the track."],
    ["c", "Riding the bike follows it instead of clearing it from the train path.", "Move the bike off with the slide action."]
  ]],
  [21, ["cube"], "Fitting the rope on the big cube gives the ship a heavy anchor.", [
    ["a", "The mule can walk away and is not the heavy cube anchor.", "Fit the rope on the big cube."],
    ["b", "The gate is not the weight named to stop the ship.", "Fasten the rope to the cube, not the gate."]
  ]],
  [22, ["rain"], "Picking the rain sign starts the clear-water pump.", [
    ["b", "Run sounds close to rain but is not the water sign on the pump.", "Pick rain to start the pump."],
    ["c", "Flame contradicts the water theme of the rain sign.", "Choose the rain sign, not the flame."]
  ]],
  [23, ["lift"], "Lifting the rain tray pulls up Glint's hidden path.", [
    ["a", "Lifting the train moves the wrong object and leaves the tray down.", "Lift the rain tray that controls the steps."],
    ["c", "Sitting beside the tray does not pull its rope upward.", "Lift the tray instead of sitting near it."]
  ]],
  [24, ["clap"], "Clapping with the singing tree makes the causeway path sing in tune.", [
    ["a", "Singing copies the tree but omits the clap that tunes the path.", "Clap with the tree's song."],
    ["b", "Sitting by the tree adds no rhythm to the causeway.", "Stay with the tree and clap."]
  ]],
  [26, ["coat"], "Showing the coat on the right road marks the boat's safe course.", [
    ["b", "Snow is a rhyming decoy and does not mark the right road.", "Show the coat marker on the road."],
    ["c", "Goat is another rhyme but is not Kelp's road marker.", "Choose coat, not goat, for the road."]
  ]],
  [27, ["glue"], "Gluing the blue moon coat follows the shelter repair sentence.", [
    ["a", "Food in the room does not cover the snowy shelter.", "Choose the blue moon coat named after glue."],
    ["c", "Putting snow in the room adds to the shelter problem.", "Attach the blue moon coat with glue."]
  ]],
  [28, ["light"], "Hooking the planned light high restores the harbour signal.", [
    ["a", "Hooking the book to the boat moves the plan instead of its light.", "Follow the book plan and hook the light high."],
    ["b", "Hiding the light in the book keeps the harbour signal dark.", "Raise the light where boats can see it."]
  ]],
  [29, ["close"], "Closing the box lid contains the loud sound and calms the cove.", [
    ["b", "Banging on the box adds another loud sound.", "Close the lid instead of banging the box."],
    ["c", "Making the sound louder is the opposite of calming it.", "Contain the sound by closing the box."]
  ]],
  [31, ["park"], "Parking the car on the star pad activates and lifts the gate.", [
    ["a", "Starting the car at the gate does not press the star pad.", "Park the car on the star."],
    ["c", "Hiding the car at the farm moves it away from the gate control.", "Bring the car to the star pad and park it."]
  ]],
  [32, ["draw"], "Drawing the star turns on the storm-dark echo-root light.", [
    ["a", "Sawing cuts down the tree instead of marking it.", "Keep the tree and draw the dark star."],
    ["b", "Storing the star does not put its mark on the tree.", "The final sentence says to draw the star on the tree."]
  ]],
  [33, ["draw"], "Drawing the bird's turn on the path records Orbit's route.", [
    ["b", "Looking at the bird observes it but records no turn.", "Draw where the bird turned instead."],
    ["c", "Sitting by the fern records no route.", "The living map needs the turn drawn."]
  ]],
  [34, ["stair"], "Pairing the chair and stair markers aligns the hollow rings.", [
    ["a", "Hair is a rhyme decoy, not the chair's partner.", "Pair the chair with the stair."],
    ["c", "Pairing the stair with hair leaves the chair unmatched.", "The text pairs chair with stair."]
  ]],
  [36, ["bright"], "Making the stair bright with pure light activates its lift.", [
    ["a", "Following the creature does not change the dark stair.", "Stay at the stair and change its light."],
    ["b", "Showing the stair still dark repeats the problem.", "The stair must become bright."]
  ]],
  [37, ["read"], "Reading the ready magic words makes the archive lock click.", [
    ["b", "Climbing into the city cell bypasses the archive lock.", "The words act at the lock."],
    ["c", "Resting beside the lock ignores the ready words.", "Read the ready words instead of resting."]
  ]],
  [38, ["join"], "Joining the star path lets the cats step across the causeway.", [
    ["a", "Following the dogs leaves the cats' path divided.", "Stay with the star path and join it."],
    ["c", "Sitting by the stars leaves the path divided.", "The cats need the path joined."]
  ]],
  [39, ["fit"], "Fitting the little puzzle into the gap completes the skybridge.", [
    ["a", "Leaving the puzzle by the table leaves the bridge gap open.", "Fit the little puzzle into the gap."],
    ["b", "Rocks are not the matching puzzle tile for this bridge gap.", "Fit the little puzzle, not the rocks."]
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
