export const REQUIRED_ACTION_MEANING_WORD_IDS = Object.freeze([
  "action", "bike", "bird", "boat", "book", "box", "bun", "by", "cake", "car", "cat", "cats",
  "chair", "city", "clap", "coin", "cube", "cup", "fiction", "frog", "hand", "hear", "home", "hot",
  "jam", "light", "little", "mat", "moon", "near", "night", "point", "pure", "rain", "rock", "ship",
  "sit", "sound", "spin", "stone", "storm", "theme", "thin", "thing", "tree", "truck"
]);

const COPY = Object.freeze({
  action: ["An action is something a person or character does.", "Show one clear action with your hands.", "An action is something done, not an object held.", "Doing, moving, and helping are actions.", "Move both hands to show something being done.", "person-doing-something"],
  bike: ["A bike is a two-wheeled vehicle moved by pedals.", "Move your feet as if you are pedaling a bike.", "A bike has two wheels; a car usually has four.", "Pedals help the wheels turn.", "Circle both hands like two turning wheels.", "two-wheel-pedal-vehicle"],
  bird: ["A bird is an animal with feathers, wings, and a beak.", "Flap both arms like a bird flying.", "A bird has feathers; a frog has smooth skin.", "Wings help many birds fly.", "Make a beak with one hand and flap the other arm.", "feathered-winged-animal"],
  boat: ["A boat is a vehicle that travels on water.", "Rock both hands gently like a boat on waves.", "A boat travels on water; a car travels on a road.", "A boat floats instead of driving on land.", "Cup both hands into a small floating shape.", "water-travel-vessel"],
  book: ["A book holds pages with words, pictures, or both.", "Open your hands like the pages of a book.", "A book has pages; a box holds objects.", "Pages turn in order from front to back.", "Press palms together, then open them like a cover.", "bound-pages-for-reading"],
  box: ["A box is a container with flat sides.", "Make a square box shape with both hands.", "A box holds things inside; a mat lies flat below.", "A container has space for something inside it.", "Trace four straight sides in the air.", "flat-sided-container"],
  bun: ["A bun is a small round piece of bread.", "Curve both hands around an imaginary bun.", "A bun is bread; a cup holds a drink.", "Bread can be soft and baked.", "Make a small round shape between both hands.", "small-round-bread"],
  by: ["By means beside or close to something.", "Put one hand by the other hand.", "By means close beside, not far away.", "Two things can be next to each other.", "Hold both palms side by side.", "beside-position-word"],
  cake: ["A cake is a sweet baked food often cut into slices.", "Pretend to cut one slice from a cake.", "Cake is baked food; a coin is money.", "A slice is one piece cut from a whole.", "Hold one flat hand and cut above it with the other.", "sweet-sliced-baked-food"],
  car: ["A car is a road vehicle with wheels and seats.", "Turn your hands like a car steering wheel.", "A car drives on roads; a boat moves on water.", "A driver steers the car along a road.", "Hold an imaginary round steering wheel.", "road-vehicle-with-seats"],
  cat: ["A cat is a small animal with whiskers, paws, and a tail.", "Make whiskers beside your cheeks with your fingers.", "A cat has fur and paws; a bird has feathers and wings.", "Whiskers help identify the animal in the picture.", "Spread three fingers beside each cheek.", "small-whiskered-animal"],
  cats: ["Cats means more than one cat.", "Show two pretend cats with two curled hands.", "Cats names a group; cat names just one.", "The final s tells us there is more than one.", "Raise one curled hand, then add a second.", "more-than-one-cat"],
  chair: ["A chair is a seat made for one person.", "Bend your knees as if you are sitting on a chair.", "A chair is for sitting; a table holds things higher up.", "The seat supports a person who sits down.", "Make a flat seat with one palm and a back with the other.", "single-person-seat"],
  city: ["A city is a large place where many people live and work.", "Point to several pretend buildings in a city.", "A city has many streets and buildings; one home is smaller.", "Many neighborhoods can be part of one city.", "Hold fingers upright like a row of buildings.", "large-place-with-buildings"],
  clap: ["Clap means strike your open hands together.", "Clap your hands together one time.", "Clap brings hands together; point sends one finger outward.", "The two hands meet to make a sound.", "Bring open palms together once.", "hands-striking-together"],
  coin: ["A coin is a small flat piece of money.", "Draw a small round coin in the air.", "A coin is money; a stone is a natural rock piece.", "Coins are usually round and thin.", "Pinch an imaginary small circle between two fingers.", "small-round-money"],
  cube: ["A cube is a solid shape with six equal square faces.", "Use both hands to outline a cube.", "A cube is solid and deep; a square is flat.", "All six faces have the same square shape.", "Hold palms apart to show front and back faces.", "six-square-faced-solid"],
  cup: ["A cup is a small container used for drinking.", "Hold an imaginary cup and lift it carefully.", "A cup holds a drink; a bun is food.", "The open top lets a drink go inside.", "Curve one hand and hold a handle with the other.", "small-drinking-container"],
  fiction: ["Fiction is a story made by an author’s imagination.", "Open a pretend book and show an imagined character.", "Fiction is imagined; a fact tells what is real.", "An author can invent people, places, and events.", "Open both hands like a book, then point above your head.", "imagined-story-writing"],
  frog: ["A frog is a small animal that can hop and live near water.", "Crouch and make a small frog hop with your hand.", "A frog hops on legs; a bird uses wings.", "Strong back legs help a frog jump.", "Crouch two fingers, then spring them forward.", "hopping-water-animal"],
  hand: ["A hand is the part at the end of your arm with fingers.", "Open one hand and wiggle all five fingers.", "A hand has fingers; a foot has toes.", "Hands can hold, point, clap, and build.", "Hold one palm forward with fingers spread.", "five-finger-arm-end"],
  hear: ["Hear means notice a sound with your ears.", "Cup one hand behind your ear to hear.", "Hear is using ears; look is using eyes.", "Sounds can be heard even when their source is hidden.", "Cup a hand around one ear and pause.", "notice-sound-with-ears"],
  home: ["A home is the place where someone lives.", "Make a roof shape over your head for home.", "A home is where someone lives; a shop is where things are sold.", "Homes can look different and still be places to live.", "Touch fingertips together above your head like a roof.", "place-someone-lives"],
  hot: ["Hot means having a high temperature.", "Hold your hands near pretend warmth, then pull back.", "Hot feels warm; cold has a low temperature.", "Steam or a warning can show that something is hot.", "Fan one hand gently as if cooling food.", "high-temperature-state"],
  jam: ["Jam is fruit cooked into a soft spread.", "Pretend to spread jam across bread.", "Jam is a soft food spread; a bun is baked bread.", "The fruit becomes thick enough to spread.", "Slide one flat hand across the other like a spreader.", "fruit-spread-food"],
  light: ["Light makes things visible so we can see them.", "Open both hands like a light shining outward.", "Light helps us see; night is a dark time.", "A lamp, star, or sun can give light.", "Start with fists closed, then open fingers wide.", "brightness-that-helps-seeing"],
  little: ["Little means small in size or amount.", "Hold finger and thumb close to show little.", "Little means small; huge means very big.", "A little object takes up less space.", "Bring thumb and first finger close together.", "small-size-or-amount"],
  mat: ["A mat is a flat piece placed on the ground.", "Lay both hands flat like a mat.", "A mat lies flat; it is not a box.", "Flat means spread out, not standing tall.", "Hold both hands flat and low.", "flat-ground-cover"],
  moon: ["The moon is the round object seen in the sky at night.", "Make a round moon shape above your head.", "The moon is seen in the sky; a coin is held in a hand.", "The moon can look full, half, or curved from Earth.", "Curve both arms into a circle overhead.", "round-night-sky-object"],
  near: ["Near means only a short distance away.", "Bring one hand near the other without touching.", "Near means close; far means a long distance away.", "A nearby object can be reached with little travel.", "Hold both palms a small space apart.", "short-distance-away"],
  night: ["Night is the dark time between evening and morning.", "Rest your cheek on your hands for night.", "Night is dark; daytime is usually bright.", "Many people sleep while the sky is dark.", "Tilt your head onto joined hands.", "dark-time-before-morning"],
  point: ["Point means aim one finger toward a place or object.", "Point one finger toward a nearby object.", "Point directs attention; clap brings both hands together.", "The finger shows exactly where to look.", "Extend one index finger and hold the others closed.", "aim-finger-at-place"],
  pure: ["Pure means not mixed with anything else.", "Show one clear drop with one fingertip.", "Pure water has nothing mixed in; muddy water does.", "Nothing extra has been added to it.", "Hold one fingertip above a cupped clean hand.", "not-mixed-with-other-things"],
  rain: ["Rain is water that falls from clouds.", "Wiggle your fingers downward like falling rain.", "Rain falls from clouds; a stream flows along the ground.", "Many drops fall together from the sky.", "Move spread fingers down from above your head.", "water-falling-from-clouds"],
  rock: ["A rock is a hard natural piece of stone.", "Make one firm fist like a rock.", "A rock is hard; a bun is soft food.", "Rocks can be small pebbles or large boulders.", "Close one hand firmly and keep it still.", "hard-natural-stone-piece"],
  ship: ["A ship is a large boat made to travel on water.", "Move both hands forward like a ship at sea.", "A ship travels on water; a truck travels on land.", "A ship is usually larger than a small boat.", "Join hands into a pointed bow and glide forward.", "large-water-travel-vessel"],
  sit: ["Sit means rest your body on a seat or the ground.", "Bend your knees and pretend to sit.", "Sit means rest in place; run means move quickly.", "Your body becomes supported instead of standing.", "Lower one flat hand onto the other.", "rest-body-on-seat"],
  sound: ["A sound is something the ears can hear.", "Tap softly, then cup your ear for the sound.", "A sound is heard; light is seen.", "Voices, bells, and rain can make sounds.", "Tap two fingers, then point to one ear.", "something-ears-can-hear"],
  spin: ["Spin means turn around and around one center.", "Circle one finger to show something spin.", "Spin turns in circles; slide moves along a path.", "The center stays in place while the outside turns.", "Draw repeated small circles with one finger.", "turn-around-one-center"],
  stone: ["A stone is a small hard piece of rock.", "Hold a small imaginary stone in your palm.", "A stone is hard and natural; a coin is made as money.", "A stone can fit in a hand while a boulder is much larger.", "Cup one palm and tap its center with a finger.", "small-hard-rock-piece"],
  storm: ["A storm is strong weather with wind, rain, snow, or thunder.", "Sweep your arms like strong storm wind.", "A storm is rough weather; a calm day is still.", "Storm weather can change the sky and water quickly.", "Wave both arms firmly, then drum fingers for rain.", "strong-wind-rain-weather"],
  theme: ["A theme is a big idea that a story helps us understand.", "Hold a pretend book, then tap your head for its theme.", "A theme is an idea; a plot tells what happened.", "Several story events can point to the same message.", "Open hands like a book, then bring one finger to your temple.", "big-story-idea"],
  thin: ["Thin means having little distance from one side to the other.", "Hold finger and thumb close to show something thin.", "Thin has little width; thick has more width.", "A thin object has narrow edges.", "Bring thumb and finger close with a tiny gap.", "small-width-between-sides"],
  thing: ["A thing is an object, idea, event, or action being named.", "Point to one thing you can see nearby.", "Thing names something; person names a human being.", "We use the word when the exact name is not needed yet.", "Hold up one finger, then point to one object.", "something-being-named"],
  tree: ["A tree is a tall plant with a trunk, branches, and leaves.", "Stand one arm like a trunk and spread branch fingers.", "A tree has a woody trunk; grass has soft blades.", "Roots hold the tree while branches reach upward.", "Raise both arms and spread fingers like branches.", "tall-trunked-plant"],
  truck: ["A truck is a road vehicle made to carry heavy loads.", "Pretend to steer a truck carrying a load.", "A truck carries loads on land; a ship carries them on water.", "The back or trailer gives a truck room for cargo.", "Hold a steering wheel, then gesture to a load behind it.", "road-vehicle-for-loads"],
  buzz: ["A buzz is a low humming sound like a bee makes.", "Hum softly and move one finger like a flying bee.", "A buzz is a sound; a light is something we see.", "Bees and small machines can make a steady buzz.", "Circle one finger while humming softly.", "low-humming-bee-sound"],
  lift: ["Lift means move something upward.", "Raise both hands as if lifting a light object.", "Lift moves up; put down moves toward the ground.", "Hands can lift an object from a lower place to a higher place.", "Start with low hands and raise them together.", "move-something-upward"],
  clear: ["Clear means open and free from anything in the way.", "Sweep one hand aside to clear a path.", "A clear path is open; a blocked path is closed.", "Moving a block away can make a path clear.", "Sweep both palms away from the middle.", "open-unblocked-path"],
  drum: ["A drum is an instrument that sounds when it is hit.", "Tap an imaginary drum with both hands.", "A drum is hit; a bell is rung.", "The stretched top moves and makes a sound.", "Tap both palms down in a steady beat.", "hit-to-make-rhythm"],
  fit: ["Fit means put something into its matching place.", "Move one hand into a matching space.", "Fit joins matching parts; pull takes them apart.", "A part fits when its shape and place match.", "Slide one flat hand into a gap beside the other.", "matching-part-in-place"],
  gap: ["A gap is an open space between two things.", "Hold two hands apart to show a gap.", "A gap is open space; a block fills space.", "A path can stop at a gap until something fills it.", "Hold palms apart, then move one hand into the space.", "open-space-between-things"],
  gate: ["A gate opens and closes an entrance in a fence or wall.", "Swing one arm open like a gate.", "A gate controls an entrance; a wall has no opening.", "Opening the gate lets someone pass through.", "Hold one arm still and swing the other outward.", "opening-in-fence-or-wall"],
  grow: ["Grow means become bigger, taller, or more developed.", "Raise one hand slowly to show something grow.", "Grow gets bigger; shrink gets smaller.", "Plants and living things grow over time.", "Start with a low fist, then raise and open it.", "become-bigger-or-taller"],
  net: ["A net is crossed cord or thread used to catch or hold things.", "Cross your fingers to make a net pattern.", "A net has open spaces; a mat is a flat cover.", "The crossed strands make many small openings.", "Spread crossed fingers in front of you.", "crossed-cord-mesh"],
  read: ["Read means look at written words and understand them.", "Open a pretend book and follow one line with a finger.", "Read uses written words; listen uses spoken sounds.", "Letters and words carry a message for the reader.", "Move one finger from left to right across an open palm.", "understand-written-words"],
  see: ["See means notice something with your eyes.", "Point from your eyes toward something you see.", "See uses eyes; hear uses ears.", "Light helps our eyes see objects.", "Point to both eyes, then point outward.", "notice-with-eyes"],
  start: ["Start means make something begin.", "Move one hand forward from a still position.", "Start begins an action; stop ends it.", "A switch or signal can start a machine.", "Hold a fist still, then move it forward.", "make-something-begin"],
  train: ["A train is a line of connected vehicles that travels on tracks.", "Move one hand forward like a train on its track.", "A train travels on tracks; a ship travels on water.", "Connected cars follow the engine along the same track.", "Link fingers, then move both hands forward.", "connected-track-vehicles"],
  turn: ["Turn means move around or change direction.", "Rotate one hand to show a turn.", "Turn changes direction; stay keeps the same direction.", "A wheel can turn around its center.", "Point forward, then curve your hand to one side.", "change-direction-or-rotate"]
});

const ADVANCED_REASON = Object.freeze({
  buzz: "new_concept",
  clear: "new_concept",
  drum: "new_concept",
  gap: "new_concept",
  gate: "new_concept",
  grow: "new_concept",
  home: "new_concept",
  lift: "new_concept",
  light: "new_concept",
  rain: "new_concept",
  rock: "new_concept",
  see: "new_concept",
  sit: "new_concept",
  spin: "new_concept",
  start: "new_concept",
  train: "new_concept",
  turn: "new_concept"
});

function record(wordId) {
  const [childDefinition, actionPrompt, contrastPrompt, oralBridge, gesturePrompt,
    visualSuffix] = COPY[wordId];
  return Object.freeze({
    wordId,
    childDefinition,
    actionPrompt,
    contrastPrompt,
    visualSemanticId: `meaning-${wordId}-${visualSuffix}`,
    audioKey: `quest/meaning/${wordId}`,
    ageBand: "5-8",
    ellSupport: Object.freeze({ oralBridge, gesturePrompt }),
    advancedReason: ADVANCED_REASON[wordId] || null,
    answerLeakPolicy: "post_decision_or_non_assessed_help"
  });
}

export const MEANING_SUPPORT_RECORDS = Object.freeze(
  [...new Set([
    ...REQUIRED_ACTION_MEANING_WORD_IDS,
    "buzz", "clear", "drum", "gap", "gate", "grow", "lift", "see", "start", "train", "turn"
  ])].sort().map(record)
);
