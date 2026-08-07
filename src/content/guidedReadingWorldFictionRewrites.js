/*
 * Story-Bible manuscripts for the Dino Pals and Moonwood Guided Reading series.
 *
 * This catalogue is intentionally standalone. It does not mutate the imported book
 * records or their stable illustration paths. Every page array preserves the active
 * source-book page count and follows the existing illustration sequence.
 */

const fictionRewrite = ({ level, canonIds, storySpine, failedAttempt, resolution, pages }) =>
  Object.freeze({
    kind: "fiction",
    level,
    canonIds: Object.freeze(canonIds),
    storySpine,
    failedAttempt,
    resolution,
    pages: Object.freeze(pages)
  });

export const GUIDED_READING_WORLD_FICTION_REWRITES = Object.freeze({
  "dino-pals-01-chompys-big-lunch": fictionRewrite({
    level: "B",
    canonIds: ["DINO-CHOMPY", "DINO-SUNNY"],
    storySpine: "Chompy wants to quiet his rumbling tummy, but berries and leaves are not enough, so Sunny shares her lunch.",
    failedAttempt: "Berries and leaves do not quiet Chompy's tummy.",
    resolution: "Sunny's shared lunch fills Chompy; one tiny burp makes the Pals laugh, and he rests with a quiet tummy.",
    pages: [
      "Chompy wakes with a giant tummy rumble.",
      "He gobbles berries. His tummy rumbles again.",
      "He munches leaves. The rumble stays.",
      "Sunny opens her basket. \"Lunch for two,\" she says.",
      "Chompy gobbles his half. The basket is empty.",
      "His round tummy goes quiet at last.",
      "BURP! Chompy laughs. All the Pals laugh too.",
      "Under the stars, Chompy rests with one quiet tummy."
    ]
  }),
  "dino-pals-02-sunnys-rainy-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-SUNNY", "DINO-GRUMPY", "DINO-DOZY", "DINO-WIGGLY"],
    storySpine: "Sunny wants her friends to enjoy the puddles, but her huge splash soaks them, so she repairs the game with small splashes.",
    failedAttempt: "Sunny's biggest jump sprays friends who did not choose to get wet.",
    resolution: "Sunny starts a small-splash game, and the friends join before the sun returns.",
    pages: [
      "Rain fills the path with deep pools.",
      "Grumpy, Dozy, and Wiggly hide in leaf shade.",
      "Sunny wants all her Pals to play.",
      "Her big jump soaks all three friends.",
      "Sunny sees three frowns. She stops.",
      "She taps one pool. Wiggly steps in.",
      "Grumpy steps in. \"Not bad.\"",
      "The sun shines on four wet tracks."
    ]
  }),
  "dino-pals-03-dozy-wont-wake-up": fictionRewrite({
    level: "B",
    canonIds: ["DINO-DOZY", "DINO-BOUNCY", "DINO-ZIPPY", "DINO-HONKY", "DINO-BOSSY", "DINO-CHOMPY"],
    storySpine: "The Pals need Dozy for their picnic, but three loud calls fail, so Chompy wakes him with the picnic smell.",
    failedAttempt: "Bouncy, Zippy, and Honky call loudly, but Dozy sleeps through every call.",
    resolution: "Chompy brings the picnic close enough to smell, and Dozy wakes and carries his pillow outside.",
    pages: [
      "The picnic starts. Dozy still sleeps.",
      "Bouncy calls. Dozy hugs his blue pillow.",
      "Zippy calls. Dozy does not move.",
      "Honky honks. The cave rocks. Dozy sleeps.",
      "Bossy keeps Dozy's spot by the food.",
      "Chompy sets hot berry buns by Dozy.",
      "Dozy sniffs. One eye peeks out.",
      "Dozy takes his pillow and buns to lunch."
    ]
  }),
  "dino-pals-04-grumpy-needs-help": fictionRewrite({
    level: "B",
    canonIds: ["DINO-GRUMPY", "DINO-SUNNY", "DINO-BOUNCY"],
    storySpine: "Grumpy wants his trapped tail free without help, but pulling alone fails, so he chooses the exact help he needs.",
    failedAttempt: "Grumpy pulls until the rock sinks deeper and his tail remains trapped.",
    resolution: "Grumpy directs Sunny and Bouncy to push together, freeing his tail without changing his boundaries.",
    pages: [
      "A heavy rock traps Grumpy's club tail.",
      "Grumpy wants to free it alone.",
      "Sunny offers help. Grumpy says, \"Not yet.\"",
      "Bouncy waits nearby. He does not touch the rock.",
      "Grumpy pulls. The rock sinks deeper.",
      "He stops and studies the rock's flat side.",
      "\"Push here together,\" says Grumpy. His tail springs free.",
      "Grumpy checks his tail. \"That was the right help.\""
    ]
  }),
  "dino-pals-05-bossy-makes-a-plan": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOSSY", "DINO-CHOMPY", "DINO-SUNNY", "DINO-WIGGLY", "DINO-DOZY"],
    storySpine: "Bossy wants the picnic ready, but her first job list creates a mess, so she asks the Pals to choose jobs that fit.",
    failedAttempt: "Bossy's first plan ignores what each Pal can manage, so food vanishes, supplies fall, and Dozy sleeps.",
    resolution: "Bossy asks for choices, writes the new jobs, and watches lunch fill Big Flat Rock.",
    pages: [
      "Bossy wants lunch set out by noon.",
      "Her list has one job for each Pal.",
      "Chompy picks berries, then eats the pile.",
      "Wiggly hauls leaves. His tail sends them wide.",
      "Dozy guards the bags, then falls fast asleep.",
      "Bossy's first plan is one big mess.",
      "Bossy stops. \"Which job fits you?\" she asks.",
      "Bossy marks the new jobs. Lunch fills the rock."
    ]
  }),
  "dino-pals-06-bouncy-bumps-into-everything": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOUNCY", "DINO-FANCY", "DINO-WIGGLY", "DINO-SNEEZY", "DINO-BOSSY"],
    storySpine: "Bouncy wants a morning bounce, but watching only his landing causes collisions, so he plans a clear route to the meadow.",
    failedAttempt: "Bouncy apologizes after each bump but repeats the same unsafe route until Sneezy's sneeze scatters everything.",
    resolution: "Bouncy checks the whole path, helps repair the mess, and bounces safely in the empty meadow.",
    pages: [
      "Bouncy hits the cave wall on his first bounce.",
      "By the falls, he bumps Fancy's plates.",
      "Bouncy checks Fancy. He helps brush off her plates.",
      "He bumps Wiggly's basket. Both gather the fruit.",
      "Bouncy lands by Sneezy's nose. It starts to shake.",
      "WHOOSH! Leaves, fruit, and Bossy's list fly high.",
      "Bouncy picks up the mess. He checks the path.",
      "He takes the stone path to the wide, bare field."
    ]
  }),
  "dino-pals-07-wigglys-messy-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-WIGGLY", "DINO-CHOMPY", "DINO-GRUMPY", "DINO-FANCY", "DINO-DOZY"],
    storySpine: "Wiggly wants his long tail to stop making messes, but freezing still fails, so he marks the space his tail needs.",
    failedAttempt: "Wiggly sits perfectly still, yet his tail rolls berries and a leaf away.",
    resolution: "Wiggly uses bright boundary stones and slow swishes, turning his tail into a useful breeze.",
    pages: [
      "Wiggly plans to watch his long tail today.",
      "His tail tips Chompy's breakfast. They clean it.",
      "It bumps Grumpy's favorite rock. Grumpy drags it back.",
      "One fast swish splashes Fancy. She stomps away.",
      "Wiggly freezes. His tail still rolls three berries.",
      "Wiggly sighs. \"My tail needs more room.\"",
      "Fancy comes back. Dozy marks a wide spot.",
      "Bright stones mark his space. Wiggly swishes slowly inside."
    ]
  }),
  "dino-pals-08-zippy-slows-down": fictionRewrite({
    level: "B",
    canonIds: ["DINO-ZIPPY", "DINO-SUNNY"],
    storySpine: "Zippy wants to find a new picnic path quickly, but racing without looking gets him lost, so he follows visible landmarks home.",
    failedAttempt: "Zippy speeds past every landmark and cannot see Sunny Hollow when he stops.",
    resolution: "Zippy walks with Sunny, naming flowers, trees, clouds, and turns that make a usable route.",
    pages: [
      "Zippy races out to find a picnic path.",
      "Sunny calls, \"Which way?\" Zippy races on.",
      "He speeds past the waterfall and meadow.",
      "Zippy stops. Sunny Hollow is nowhere nearby.",
      "Three blue flowers point toward a bent tree.",
      "Zippy follows them slowly and finds the path.",
      "Sunny meets him beside the bent tree.",
      "They walk home. Together, they name each turn."
    ]
  }),
  "dino-pals-09-honkys-inside-voice": fictionRewrite({
    level: "B",
    canonIds: ["DINO-HONKY", "DINO-GRUMPY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-DOZY"],
    storySpine: "Honky wants to greet friends without shaking breakfast, but excitement enlarges his voice again, so he learns when each voice helps.",
    failedAttempt: "Honky's excited cheer becomes huge again and scatters the breakfast leaves.",
    resolution: "Honky uses a big voice to guide friends through a storm, then a small voice inside the cave.",
    pages: [
      "Honky calls. Leaves drop on the food.",
      "Grumpy looks at the food. \"That voice is too big.\"",
      "Bossy shows one small call and one big call.",
      "Honky greets Chompy. The bowls stay still.",
      "He cheers too soon. The leaves fly.",
      "BOOM! Dozy jumps. Rain floods the paths.",
      "Honky's big call brings all Pals to Cozy Cave.",
      "In the cave, Honky says, \"We are all here.\""
    ]
  }),
  "dino-pals-10-cheekys-prank-goes-wrong": fictionRewrite({
    level: "B",
    canonIds: ["DINO-CHEEKY", "DINO-WIGGLY", "DINO-FANCY"],
    storySpine: "Cheeky wants shared laughter, but two surprise pranks upset friends, so he asks them to help make a visible, harmless joke.",
    failedAttempt: "The leaf hat blinds Wiggly and the muddy rock upsets Fancy; Cheeky then slips in his own mud.",
    resolution: "Cheeky repairs the rock and creates silly faces with Wiggly and Fancy's consent.",
    pages: [
      "Cheeky wants to make Wiggly and Fancy laugh.",
      "He hides a soft leaf hat on Wiggly's path.",
      "The hat covers Wiggly's eyes. Only Cheeky laughs.",
      "Cheeky spreads mud on Fancy's favorite rock.",
      "Fancy slips. Cheeky slips in the same mud.",
      "Cheeky helps Fancy up, then scrubs the rock.",
      "\"What makes you laugh?\" Cheeky asks both friends.",
      "All three make silly faces beside the clean rock."
    ]
  }),
  "dino-pals-11-shys-secret-gift": fictionRewrite({
    level: "B",
    canonIds: ["DINO-SHY", "DINO-GRUMPY", "DINO-CHOMPY", "DINO-DOZY", "DINO-BOSSY", "DINO-BOUNCY", "DINO-ZIPPY", "DINO-HONKY", "DINO-CHEEKY", "DINO-SUNNY"],
    storySpine: "The Pals want to thank their hidden gift-giver, but noisy searches fail, so Sunny waits quietly and lets Shy choose to appear.",
    failedAttempt: "Bouncy searches bushes, Zippy races along paths, Honky calls, and Cheeky falls asleep on watch without finding anyone.",
    resolution: "Sunny discovers Shy without crowding, and the Pals leave a return gift on the rock.",
    pages: [
      "Each morning, a new gift waits on Big Flat Rock.",
      "Grumpy finds a smooth gray pebble.",
      "Chompy finds a small basket of berries.",
      "Dozy finds a broad leaf for shade.",
      "Bossy wants to thank the hidden giver.",
      "Bouncy, Zippy, and Honky search too loudly.",
      "Cheeky watches after supper, then falls asleep.",
      "Sunny waits silently behind one fern.",
      "Two small feet place a grass bracelet down.",
      "Sunny says, \"Thank you, Shy. I can wait here.\"",
      "Shy sits near Sunny, with the rock between them.",
      "Next morning, a gift from every Pal waits for Shy."
    ]
  }),
  "dino-pals-12-fancys-bad-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-FANCY", "DINO-CLUMSY", "DINO-CHOMPY", "DINO-BOUNCY", "DINO-DOZY", "DINO-HONKY", "DINO-WIGGLY"],
    storySpine: "Fancy wants her folded leaf fan flat again, but forceful fixes risk damage, so Wiggly dampens and presses it slowly.",
    failedAttempt: "Sitting, bouncing, softness, and shouting are proposed, but none safely fits the folded fan.",
    resolution: "Wiggly uses water and gentle pressure; Fancy restores her fan and gives Wiggly a woven bracelet.",
    pages: [
      "Fancy wakes. Her woven leaf fan has a sharp fold.",
      "She stays in and stares at the sharp fold.",
      "Clumsy peers down. The bend looks small.",
      "\"I can sit on it,\" says Chompy. \"No,\" says Fancy.",
      "Bouncy offers to bounce it flat. Fancy says, \"No.\"",
      "Dozy brings his soft pillow. The bend stays.",
      "Honky shouts. Fancy's leaf fan flaps wildly.",
      "Wiggly nods toward warm water and a flat rock.",
      "He brings the water. His tail stays off Fancy.",
      "Fancy steers his tail over the fan. The fold lifts.",
      "Fancy sees her straight leaf fan in the pool.",
      "Fancy gives Wiggly the bracelet. His tail holds it."
    ]
  }),
  "dino-pals-13-clumsy-to-the-rescue": fictionRewrite({
    level: "B",
    canonIds: ["DINO-CLUMSY", "DINO-DOZY", "DINO-BOUNCY", "DINO-ZIPPY", "DINO-CHEEKY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-WIGGLY"],
    storySpine: "Dozy wants his missing pillow, but a hurried ground search fails, so Clumsy's height finds it and Wiggly's reach retrieves it.",
    failedAttempt: "Bouncy, Zippy, and Cheeky search quickly at ground level and miss the pillow in the waterfall pool.",
    resolution: "Clumsy spots the pillow from above, Wiggly reaches it, and Dozy rests on the recovered blue pillow.",
    pages: [
      "Dozy cannot find his blue pillow.",
      "Bouncy, Zippy, and Cheeky search all low spots.",
      "Bossy's map is full of red marks.",
      "\"Not from up here,\" says tall Clumsy.",
      "Clumsy scans beyond the ferns and waterfall.",
      "He spots Chompy, mud, rocks, and one blue square.",
      "Dozy's pillow floats below the waterfall.",
      "Bouncy gulps. \"I knocked it down the stream.\"",
      "Clumsy sees it, but his neck falls short.",
      "Wiggly bends low and lifts the pillow.",
      "Dozy hugs it and falls asleep at once.",
      "Clumsy spots Wiggly's hat in the grass. \"I see it!\""
    ]
  }),
  "dino-pals-14-what-is-flappy": fictionRewrite({
    level: "B",
    canonIds: ["DINO-FLAPPY", "DINO-GRUMPY", "DINO-BOSSY", "DINO-SUNNY"],
    storySpine: "Flappy wants to know what kind of flier fits that body, but copying other dinosaurs fails, so Flappy tests small feet, feathers, and short glides.",
    failedAttempt: "Roaring and stomping do not help Flappy reach the branch, and the first flight ends in mud.",
    resolution: "Flappy builds a nest, catches an insect, and uses a short glide to reach the high branch.",
    pages: [
      "Flappy flaps toward a branch, then lands in mud.",
      "\"I have wings. Why can't I reach that branch?\"",
      "Bossy flies high. Grumpy does not know why.",
      "Sunny cheers. Flappy still wants a real answer.",
      "Flappy tries roaring. Only a small squawk comes.",
      "Flappy tries stomping. Small feet make small thumps.",
      "Small feet grip the tree. Flappy builds a nest.",
      "Flappy glides past one branch and catches an insect.",
      "Flappy shows Grumpy the useful feet and feathers.",
      "Grumpy looks up. \"You built that nest.\"",
      "\"I am Flappy,\" says Flappy. \"Watch this.\"",
      "Flappy climbs, glides, and lands neatly beside the nest."
    ]
  }),
  "dino-pals-15-sneezy-and-the-waterfall": fictionRewrite({
    level: "B",
    canonIds: ["DINO-SNEEZY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-SUNNY", "DINO-GRUMPY", "DINO-WIGGLY"],
    storySpine: "The Pals want Rainbow Waterfall flowing, but pushing cannot shift the rockfall, so Sneezy safely directs a powerful sneeze.",
    failedAttempt: "The group pushes, Chompy pushes, and Grumpy strikes one rock, yet the stream remains blocked.",
    resolution: "Sneezy warns everyone back, aims upstream, and clears the rocks so the waterfall and rainbow return.",
    pages: [
      "Rainbow Waterfall stops in the night.",
      "A rock pile blocks the stream.",
      "Bossy leads one push. The rocks stay put.",
      "Chompy shoves. He lands in a berry bush.",
      "Grumpy's club tail shifts just one rock.",
      "The Pals sit by the still stream.",
      "Fern dust lands on Sneezy's nose.",
      "Sneezy looks up. \"Stand back!\"",
      "He draws one huge, slow breath.",
      "The Pals duck at the far side of a rock.",
      "Sneezy aims. ACHOO! Loose rocks fly.",
      "The falls roar. A bright rainbow arcs high. Sneezy sniffs."
    ]
  }),
  "dino-pals-16-chompy-and-grumpys-day-out": fictionRewrite({
    level: "B",
    canonIds: ["DINO-CHOMPY", "DINO-GRUMPY"],
    storySpine: "Grumpy wants quiet time on a flat rock, but Chompy falls into a ditch, so Grumpy gives up the rock briefly to help.",
    failedAttempt: "Chompy tries climbing out with tiny arms but slides back into the ditch.",
    resolution: "Grumpy lowers a club tail, frees Chompy, and chooses to share the rock and nearby berry patch.",
    pages: [
      "Grumpy walks toward a quiet Long Meadow rock.",
      "Chompy joins. He stops often to taste leaves.",
      "Grumpy names one leaf. Chompy eats it.",
      "Grumpy names one pebble. Chompy leaves it.",
      "They reach the rock and a berry patch.",
      "Grumpy stretches out on the flat, sun-warmed rock.",
      "Chompy falls into a ditch and slides back twice.",
      "Grumpy leaves the rock and lowers his club tail.",
      "Chompy grips it. Grumpy pulls him free.",
      "Mud-covered Chompy sits quietly beside Grumpy.",
      "Grumpy tips his head toward the berry patch.",
      "\"Better berries on your left!\" calls Grumpy. Chompy waves."
    ]
  }),
  "dino-pals-17-the-sunny-hollow-games": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOSSY", "DINO-ZIPPY", "DINO-BOUNCY", "DINO-HONKY", "DINO-WIGGLY", "DINO-SHY", "DINO-GRUMPY", "DINO-CHEEKY", "DINO-DOZY", "DINO-FANCY", "DINO-SNEEZY", "DINO-CHOMPY"],
    storySpine: "Bossy wants one overall Games winner, but each event suits a different Pal, so she fills the board with separate records.",
    failedAttempt: "Running, jumping, loudness, and tidying cannot produce one fair overall winner.",
    resolution: "Bossy gives each event its own record and fills the board with bright ribbons.",
    pages: [
      "Bossy starts the first Games in the Hollow.",
      "Bossy's board has one blank line: ONE WINNER.",
      "Zippy wins the race. Bossy blinks.",
      "Bouncy jumps high, then bumps all the flags.",
      "Honky honks. The trees go bare.",
      "Wiggly sorts the fruit. His tail flings it wide.",
      "Shy's pebble row stays neat by the rock.",
      "Cheeky picks Grumpy's best scowl.",
      "Dozy sleeps straight through the lunch bell.",
      "Fancy's neat display wins one bright bow.",
      "Sneezy blows one leaf past the last flag.",
      "Bossy fills each line. Bright bows fill the board."
    ]
  }),
  "dino-pals-18-dozys-wonderful-dream": fictionRewrite({
    level: "B",
    canonIds: ["DINO-DOZY", "DINO-BOSSY", "DINO-SUNNY", "DINO-CHOMPY", "DINO-GRUMPY", "DINO-BOUNCY"],
    storySpine: "Dreaming Dozy wants the warmest cloud bed, but each low cloud fails, so he follows the golden waterfall to Mount Rumble.",
    failedAttempt: "Food-clouds disappoint Chompy, seat-clouds wobble under Grumpy, and Bouncy's cloud flies away.",
    resolution: "Dozy reaches the warm peak with his friends, then wakes surrounded by those same friends in the meadow.",
    pages: [
      "Dozy sleeps for hours in Long Meadow.",
      "Bossy and Sunny wait near him.",
      "Dozy dreams of the best warm cloud bed.",
      "Soft clouds lift him high. Sunny Hollow looks small.",
      "Chompy bites his food-cloud. His mouth stays bare.",
      "Grumpy's seat-cloud will not stay firm.",
      "Bouncy's cloud springs off with one BOING!",
      "A gold stream points up to Mount Rumble.",
      "Dozy finds all his friends on the warm peak.",
      "Their cloud rests high. Green hills spread far and wide.",
      "Dozy wakes. His friends sit in a ring.",
      "Dozy shuts his eyes. His friends curl up close."
    ]
  }),
  "dino-pals-19-zippys-race": fictionRewrite({
    level: "B",
    canonIds: ["DINO-ZIPPY", "DINO-SUNNY", "DINO-WIGGLY", "DINO-HONKY"],
    storySpine: "Zippy wants to feel ready for a real race, but endless practice laps deepen his worry, so he runs the marked course and meets his rival.",
    failedAttempt: "Five extra circuits do not make Zippy feel ready; they leave his legs tired before race day.",
    resolution: "Zippy wins narrowly, respects the close runner, and changes his next practice into one easy lap with Sunny.",
    pages: [
      "Zippy delivers news of a race between valleys.",
      "His friends call, \"Easy win!\" Zippy goes quiet.",
      "He runs five practice loops without a rest.",
      "Wiggly asks why. \"One more lap,\" says Zippy.",
      "Race day brings several fast young runners.",
      "Zippy starts first. One runner stays close.",
      "His tired legs drag near the final bend.",
      "Zippy crosses just before the second runner.",
      "Honky's cheer shakes leaves across the finish.",
      "The close runner says, \"Good race.\" Zippy nods.",
      "Zippy rests with Sunny and turns the winner's pebble.",
      "One slow lap is enough. Sunny counts each marker."
    ]
  }),
  "dino-pals-20-the-big-storm": fictionRewrite({
    level: "B",
    canonIds: ["DINO-GRUMPY", "DINO-BOSSY", "DINO-CLUMSY", "DINO-SNEEZY", "DINO-HONKY", "DINO-WIGGLY", "DINO-ZIPPY", "DINO-BOUNCY", "DINO-SHY", "DINO-DOZY", "DINO-SUNNY"],
    storySpine: "The Pals want everyone safe before a storm, but Bossy's long plan gives everyone too many jobs, so each Pal contributes one observable strength.",
    failedAttempt: "Bossy reads one long plan, but every Pal receives too many jobs to remember at once.",
    resolution: "Bossy gives one job each; the Pals prepare Cozy Cave, stay dry, and clear the paths after the storm.",
    pages: [
      "The air hangs still in Sunny Hollow.",
      "Grumpy reads the clouds. \"A big storm comes.\"",
      "Bossy reads her long plan. The Pals mix up their jobs.",
      "Clumsy looks east. Bossy gives each Pal one job.",
      "\"Rain soon!\" Sneezy warns.",
      "Honky's call brings each Pal back.",
      "Wiggly sweeps all loose things off Big Flat Rock.",
      "Zippy brings food, rugs, and lamps.",
      "Bouncy ties each branch high off the path.",
      "Shy leads all the Pals to Cozy Cave.",
      "Rain pounds the cave. Dozy's blue pillow stays dry.",
      "The sun comes back. Each Pal clears one cave path."
    ]
  }),
  "moonwood-tales-c-01": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-BURROW"],
    storySpine: "Pip wants the Bravery Stone to remove his fear, but it changes nothing, so he climbs with real safety supports and his own choices.",
    failedAttempt: "Pip waits for the stone to make him fearless, yet his legs still wobble at the practice wall.",
    resolution: "Pip climbs one hold at a time, crosses the marsh path, and keeps the ordinary stone as a record of his actions.",
    pages: [
      "Pip walked along a quiet Moonwood path, wondering what adventure might find him that day. His boot tapped a tiny stone that shone with soft gold light.",
      "Pip knelt between the old roots and lifted the glowing stone carefully. Golden light warmed his fingers, and he wondered what kind of stone it could be.",
      "Burrow popped out of a nearby tunnel and peered closely at Pip's new discovery. \"Old stories call that a Bravery Stone,\" the mole explained.",
      "Pip held the stone close and waited for a rush of courage. He still felt like himself, and the steep cliffs still seemed frightening.",
      "To test the stone, Pip visited the safe practice wall at Tumblerock Cliffs. He chose the lowest route, where a thick blue mat waited below.",
      "Pip's legs wobbled as he reached for the first hold. He breathed slowly, checked each grip, and climbed one careful step at a time.",
      "When Pip reached the top, his worried face opened into a grin. He climbed down safely, then carried the warm stone toward Fog Marsh.",
      "Thick fog covered the marked marsh path, and reeds rustled beside Pip. He felt afraid, but he watched the markers and kept walking forward.",
      "That evening, Pip rested quietly beside Crystal Stream and studied the little stone. Its last golden light grew dim, then disappeared in the sunset.",
      "Pip hurried to Burrow and opened his hands around the dull stone. \"Did it run out of brave?\" he asked, remembering the long, dark marsh.",
      "Burrow turned the plain stone over and reminded Pip what happened. The stone did not climb the wall or follow the marsh markers; Pip did.",
      "Pip remembered every careful choice he made while fear was still there. He kept the ordinary stone as a reminder of what his own hands could do."
    ]
  }),
  "moonwood-tales-c-02": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-LUNA", "MOON-PIP"],
    storySpine: "Fern wants one seed to grow beside Hollow Oak, but an unfinished growth song makes it overrun the doorway, so she completes the song.",
    failedAttempt: "Fern adds a slower verse without finishing the seed's established song, so the plant keeps growing.",
    resolution: "Fern sings the missing final verse; the plant settles beside the Oak and leaves Luna's doorway clear.",
    pages: [
      "Fern planted one small seed in the soft ground beside Hollow Oak. As she patted down the soil, she hummed the beginning of its growth song.",
      "A pale green shoot appeared while Fern sang the opening verse. Night fell before she reached the ending, so Fern left the song unfinished.",
      "By morning, the unfinished magic had made the plant enormous. Thick leaves blocked Hollow Oak's wide doorway and curled through every small glowing window.",
      "Fern tried a slower verse, then a careful stopping spell, but neither one completed the song. The wild plant twisted higher and grew even faster.",
      "By afternoon, the enormous stem pushed straight through Hollow Oak's roof. Pip and the others stepped back as heavy branches spread above their heads.",
      "Luna was trapped behind a dense curtain of leaves deep inside the tree. \"Fern, please clear the doorway,\" she called through the tangled green wall.",
      "Fern stopped casting spells and listened to the green leaves rustling around her. They repeated the opening notes, then paused where her song ended.",
      "Fern finally understood what the hungry magic needed. She closed her eyes and softly sang the ending her mother had taught her.",
      "The completed song changed the wild plant at once. Its tall stem lowered, and the leaves slid away from every window toward the garden.",
      "By evening, one large flowering plant stood neatly beside Hollow Oak. The doorway was open again, with plenty of space for Luna to pass.",
      "Luna walked along the narrow clear path to make sure nothing blocked it. Beside her, Fern carefully watered the roots until the tired plant settled.",
      "Pip asked how Fern stopped the plant, so she sang the missing final notes. The quiet leaves rustled the whole finished song back to them."
    ]
  }),
  "moonwood-tales-c-03": fictionRewrite({
    level: "C",
    canonIds: ["MOON-STONE", "MOON-PIP", "MOON-BURROW"],
    storySpine: "Stone wants to avoid the swaying rope bridge, but Burrow becomes stranded, so Stone crosses by focusing on one fixed rope at a time.",
    failedAttempt: "Stone places one foot on the bridge, feels it sway, and steps back before Burrow needs help.",
    resolution: "Stone crosses, carries Burrow back, and inspects the bridge from underneath on solid ground.",
    pages: [
      "The Moonwood friends crossed the rope bridge over Crystal Stream, but Stone stayed behind. From the bank, the wooden boards looked narrow beneath his huge feet.",
      "Stone watched the wooden bridge sway over the bright, rushing water. \"What if something is waiting underneath?\" he asked, hugging his broad arms close.",
      "Pip quickly returned to Stone and pulled hard on each thick rope. \"The ropes are strong,\" he said, but Stone's worry did not disappear.",
      "Stone placed one foot on the first board, and the whole bridge moved. His heart jumped, so he quickly stepped back onto solid ground.",
      "Across the stream, Burrow called for help from the far bank. The swaying bridge frightened him, and he did not want to cross alone.",
      "Stone watched Burrow wait beside the rushing water on the far bank. Burrow needed help, yet every bridge board still seemed small and shaky.",
      "Stone gripped the thick fixed side rope with both broad hands. Keeping his eyes on that steady rope, he stepped onto the bridge again.",
      "At the middle, the boards swayed and the stream flashed below Stone. He watched Pip's clear hand signal instead and took another careful step.",
      "Stone reached the far bank, where Burrow was still searching the grass. He gently lifted the little mole with both hands and turned toward home.",
      "Together they crossed back, one strong rope and one careful step at a time. Burrow stayed still in Stone's hands while Pip guided them forward.",
      "On the near bank, Burrow adjusted his round glasses while Stone caught his breath. Both friends smiled as Stone placed both feet on solid ground.",
      "Stone still wanted to know what waited under the swaying bridge. From the safe shore, he bent down to look, but only water answered him."
    ]
  }),
  "moonwood-tales-c-04": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-SPARK", "MOON-PIP", "MOON-FERN", "MOON-LOCAL-C04-FOX"],
    storySpine: "Glimmer wants one steady flame, but forcing harder produces smoke and a sore throat, so an urgent seed rescue reveals one protective flare.",
    failedAttempt: "Repeated deep breaths produce smoke, sparks, and cinnamon warmth, but never a steady flame Glimmer can repeat.",
    resolution: "Glimmer's warning flare makes the fox drop Fern's seeds; they bring the seeds home, and the friends recognize the real flame that appeared when help was needed.",
    pages: [
      "Every morning, Glimmer practiced breathing fire inside a wide circle of stones. The empty ground kept the lesson safe, even when sparks jumped sideways.",
      "Glimmer planted all four feet and took the first careful breath. A round cloud of gray smoke appeared, but there was no flame inside it.",
      "On the second try, one bright spark landed on a broad green leaf. It glowed for a moment, then faded before Glimmer could cheer.",
      "Spark told Glimmer to push harder on the next breath. Thick smoke rolled across the stone circle, making both friends cough and wave their hands.",
      "Glimmer tried a slower breath after the smoke cleared. This time, gentle warmth floated out with a sweet cinnamon smell, but no fire appeared.",
      "Pip called the warm breath real, useful progress, but Glimmer lowered their head. \"Warmth is useful,\" Glimmer said, \"but I still want a flame.\"",
      "Beside Crystal Stream, Glimmer made ten careful tries while Pip counted the stones. Each breath brought smoke, cinnamon warmth, or a spark that faded.",
      "After the tenth try, Glimmer's throat felt sore from forcing every breath. They closed their mouth, drank cool water, and stopped practicing to rest.",
      "While the friends rested, a marsh fox darted from the trees with Fern's seed pouch. Glimmer saw the stolen seeds and raced after it.",
      "Glimmer reached the open forest path and planted both feet firmly. \"Drop Fern's seeds!\" they warned as the fox ran toward the far trees.",
      "A sudden orange flare burst from Glimmer's mouth and landed across the empty path. Startled, the fox dropped the pouch and raced away from the heat.",
      "Glimmer brought Fern's seeds safely home. Fern smiled beside the full seed boxes while Pip watched. Glimmer had made one real flame when their friend needed help."
    ]
  }),
  "moonwood-tales-c-05": fictionRewrite({
    level: "C",
    canonIds: ["MOON-WREN", "MOON-LUNA", "MOON-PIP"],
    storySpine: "Wren wants to become taller with a spell, but reading its mirrored script backwards shrinks her, so she decodes the direction mark and restores herself.",
    failedAttempt: "Wren repeats the words before checking the moon-shaped direction mark, leaving herself one inch tall beside an enormous book.",
    resolution: "Wren reads the marked line forward, returns to normal size, and shelves the height spell unfinished.",
    pages: [
      "While studying in her tree-room, Wren found a height spell written in shining blue ink. The words looked backward, as if they belonged inside a mirror.",
      "Wren rushed to try the spell before checking both ends of the line. She began at the wrong moon mark, and blue light filled the room.",
      "When the light cleared, Wren saw her tiny reflection far below the mirror. The spell had made her only one inch tall instead of taller.",
      "The desk now rose above Wren like a wooden cliff. She called for help, but her tiny voice could not carry beyond the enormous books.",
      "Wren climbed onto the open spell book and studied the shining marks again. A small arrow beside the words pointed in the opposite direction.",
      "Following the arrow, Wren started at the silver moon and read each word forward. The page hummed, but she was still too small to finish safely.",
      "Luna entered the room and heard a faint voice coming from the desk. She looked down and found tiny Wren standing between the blue words.",
      "Wren explained the arrow, so Luna held the heavy book flat with one wing. Standing safely on the page, Wren finished the forward spell.",
      "Blue light circled Wren again and lifted her from the page. When it faded, she was back to her usual height beside a relieved Luna.",
      "Wren checked the book once more and found an unused height charm below the mirrored line. This time, she read every mark before touching anything.",
      "Pip arrived and asked whether Wren would try the real height charm next. Wren looked at the crowded desk, then firmly closed the spell book.",
      "Wren shelved the risky spell and chose a book about safe step stools. Soon she could reach the high shelf without changing her size at all."
    ]
  }),
  "moonwood-tales-c-06": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FLINT", "MOON-PIP"],
    storySpine: "Flint wants a reliable map of Moonwood, but his detailed static map fails when paths move, so he records time and change instead.",
    failedAttempt: "After three days drawing every fixed turn, Flint discovers the forest has rearranged and his beautiful map cannot guide him home.",
    resolution: "Flint labels the first map 'Yesterday' and begins a dated atlas showing how paths shift.",
    pages: [
      "Flint left Hollow Oak with fresh parchment, a sharp quill, and an enormous plan. He intended to draw every path in Moonwood exactly where it belonged.",
      "As Flint walked north, he recorded Crystal Stream and Tumblerock Cliffs. He also marked each bend carefully, so no traveler would miss a turn.",
      "For three days, Flint followed paths and added new details to the parchment. His map grew so long that he had to unroll it across the trail.",
      "At last, Flint held up the finished map and admired every tiny neat symbol. \"Now every Moonwood path is fixed on paper,\" he declared.",
      "Flint lowered the map and looked at the forest around him. The nearby trees stood in different places from the ones in his careful drawing.",
      "The map promised Whispering Meadow beyond the next turn, but gray marsh reeds surrounded Flint. Somehow, the path had moved since he drew it.",
      "Flint spread yesterday's map across a mossy rock and studied the mismatch. \"This was correct then,\" he sighed, \"but it cannot guide me today.\"",
      "Instead of throwing the old map away, Flint opened a fresh blank page. He wrote today's date, then marked the path's newly curved bend.",
      "Flint checked each present landmark and followed the changing route through one long loop. Near sunset, the new marks finally led him back to Hollow Oak.",
      "Pip greeted Flint at the doorway and asked whether his map worked. Flint showed both pages and answered, \"The map I dated today did.\"",
      "Inside, Flint pinned his first beautiful map to the wall under one clear label: YESTERDAY. It showed how Moonwood looked before the paths moved.",
      "Outside the round window, two forest paths quietly traded places again. Flint smiled, dated another page, and added today's change to his growing atlas."
    ]
  }),
  "moonwood-tales-c-07": fictionRewrite({
    level: "C",
    canonIds: ["MOON-DEWDROP", "MOON-BURROW", "MOON-PIP", "MOON-LOCAL-C07-RIPPLE"],
    storySpine: "Dewdrop wants to know the new blue-striped fish, but its grand claims fail every check, so she asks for one true detail at a time.",
    failedAttempt: "Dewdrop follows the fish's boast about a Deep Dark secret and finds no matching evidence.",
    resolution: "The fish admits inventing stories because it felt ordinary, then shares a true name and real stream knowledge.",
    pages: [
      "Dewdrop visited Crystal Stream each morning and listened to its fish. She knew every silver fin, favorite hiding place, and piece of ordinary stream news.",
      "One morning, a fish Dewdrop had never met swam into the clear pool. Its silver body carried a single bright blue stripe along one side.",
      "The small visitor claimed to be the oldest fish in all Moonwood. Dewdrop noticed its young face, but she listened before asking any questions.",
      "Next, the striped fish boasted that it knew Hollow Oak's oldest secret. It also claimed to have explored the deepest tunnels beneath the Deep Dark.",
      "Dewdrop asked the fish to show one clue from the oldest story it claimed to remember. The visitor looked away and could not name a single detail.",
      "Burrow checked his careful tunnel records for Dewdrop. He had never drawn the blue-striped fish or found its name beside a single underground path.",
      "Back at the stream, Dewdrop calmly shared exactly what she discovered. \"Why do your stories lead to places you have never visited?\" she asked.",
      "The striped fish swam one slow circle and looked down at the pebbles. \"I wanted to sound important,\" it admitted in a small voice.",
      "Dewdrop pointed to the fish's unusual blue stripe, which flashed in the water. \"You already have something true and interesting to share,\" she said.",
      "The fish led Dewdrop beneath a twisting root beside the stream. There, fresh water bubbled from a hidden spring and chilled the bright pebbles.",
      "Dewdrop dipped one finger into the bubbling spring and felt its icy water. The fish then shared smaller facts about the current that she could check.",
      "When Pip arrived, the fish finally offered one simple truth. \"My name is Ripple,\" it said, and began a real story about the cold spring."
    ]
  }),
  "moonwood-tales-c-08": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-STONE"],
    storySpine: "Burrow wants to open and understand an old root-carved door, but pulling and Luna's fading memory fail, so he matches the carving to real roots.",
    failedAttempt: "Burrow pulls the door and Luna traces its carving, yet the sealed wood does not move.",
    resolution: "Burrow presses the carved north root, opens the Memory Room, and adds Hollow Oak to its living wall.",
    pages: [
      "While digging beneath Hollow Oak, Burrow's spade struck something that was not stone. He brushed away the dirt and found a wide piece of ancient wood.",
      "Burrow dug carefully around the wooden edge instead of striking it again. Soon, a small hidden underground door appeared between Hollow Oak's thick roots.",
      "A deep carving covered the old door from top to bottom. It showed one great tree with long roots reaching north, south, east, and west.",
      "Burrow gathered his friends around Hollow Oak's table and showed them a sketch of the hidden door. Together, they planned how to inspect it safely.",
      "Everyone squeezed through the narrow tunnel until they reached the door. Stone turned sideways, and Luna folded her wings close. Together they pulled the iron ring, but it did not move.",
      "Luna studied the carved tree and knew she had seen it long ago. She remembered the door, but its opening rule had slipped from her memory.",
      "Luna traced every deep carved root with one careful wing tip. Warm gold light followed her touch, yet the wooden door stayed firmly closed.",
      "Burrow looked up at Hollow Oak's real roots and compared them with the carving. He found the root pointing north and pressed its matching mark.",
      "The wide old door swung inward, filling the tunnel with warm golden light. Beyond it, glowing pictures showed Moonwood's creatures, streams, and vanished paths.",
      "The friends stepped inside and slowly followed the shining pictures around the curved walls. Each picture showed a small piece of Moonwood's living past.",
      "As Luna studied the oldest glowing tree picture, the forgotten name suddenly returned to her. \"This is the Memory Room,\" she told everyone quietly.",
      "Burrow noticed a clear space waiting among the old pictures. He took a piece of chalk and carefully drew Hollow Oak as it looked that day.",
      "The new picture began to glow beside the older memories on the wall. Burrow smiled because that day's Moonwood now had a place in the room."
    ]
  }),
  "moonwood-tales-c-09": fictionRewrite({
    level: "C",
    canonIds: ["MOON-SPARK", "MOON-WREN", "MOON-FERN", "MOON-DEWDROP"],
    storySpine: "Spark wants to contain cold-triggered magic sneezes, but holding one in builds dangerous power, so friends use a checked remedy and a cloth.",
    failedAttempt: "Spark suppresses a sneeze until magic builds, then transforms the stream fish and water when the sneeze escapes.",
    resolution: "Wren checks and gives the correct remedy; Spark's next sneeze lands safely in a cloth without changing anything.",
    pages: [
      "Spark woke with a cold and a tickle deep inside his nose. Because loose wand magic followed every sneeze, golden sparks already danced around him.",
      "At breakfast, Spark felt the first sneeze arrive too quickly to warn anyone. Magic struck his porridge, which flapped from the bowl like a frightened bird.",
      "Wren caught the flying breakfast and checked Spark's bright red nose. She asked him to warn everyone as soon as he felt the next tickle.",
      "In Whispering Meadow, Spark raised one hand to give the warning. The sneeze arrived anyway, and a golden ring turned every nearby flower blue.",
      "Spark apologized to the field of blue flowers and lowered his wand. Before he could plan a repair, another strong tickle started inside his nose.",
      "Spark squeezed his nose and tried to hold the sneeze inside. Gold magic gathered around his watering eyes, growing brighter with every silent second.",
      "Fern saw the dangerous glow and pointed Spark away from Crystal Stream. She brought a soft cloth, but the trapped sneeze was already too powerful.",
      "The sneeze burst free just as Spark turned beside the water. A wide wave of gold magic raced across the stream before anyone could stop it.",
      "Every fish turned purple, and the flowing stream began to sing in a strange key. One surprised fish even became a green frog for a moment.",
      "Spark carefully dropped his wand so no more magic could escape through it. \"Please count every nearby changed fish with me,\" he asked Dewdrop.",
      "Dewdrop pointed out each nearby purple fish while Spark checked the stream. \"We restore every one before you cast another spell,\" she said firmly.",
      "Wren searched her remedy book instead of guessing at a potion. She checked the correct leaf picture, the direction arrow, and the three-drop dose twice.",
      "Wren added exactly three drops to the stream, and the remedy spread outward. The fish, flowers, water, and Spark's clear nose returned to normal.",
      "When Spark felt one final tickle, he turned away and sneezed into Fern's cloth. Nothing changed, so Dewdrop happily checked off every ordinary fish."
    ]
  }),
  "moonwood-tales-c-10": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-BURROW", "MOON-DEWDROP", "MOON-WREN"],
    storySpine: "Luna wants to remember an urgent task before afternoon, but searching places at random fails, so the Crystal Stream clue leads to stored seeds.",
    failedAttempt: "The group searches Hollow Oak, paths, and Whispering Meadow without using Luna's one useful memory: outside water.",
    resolution: "Luna retrieves the first-tree seeds and the group plants them in a ring around tired Hollow Oak.",
    pages: [
      "Luna woke with the strong feeling that one important task had to happen that day. She searched her memory, but the task itself had completely disappeared.",
      "The old owl remembered only two clues: the task had to happen outside, and it could not wait. Luna called her friends before more time slipped away.",
      "Pip asked Luna to remember a sound, smell, or feeling connected to the task. After thinking quietly, she recalled the touch of very cold water.",
      "Fern suggested the shaded garden, while Burrow named his cool underground tunnels. Luna visited both places, but neither one brought the missing task back.",
      "The friends searched Hollow Oak, the nearby paths, and all of Whispering Meadow. They found many cold places, yet none held Luna's lost memory.",
      "Dewdrop finally said the name Crystal Stream, and Luna turned toward the water at once. The familiar rushing sound made her forgotten clue feel close.",
      "Luna flew ahead to the stream's broad stepping stones and landed on the largest one. She studied the bright pebbles moving beneath the clear water.",
      "Between the pebbles, a silver box waited exactly where Luna had once hidden it. Dewdrop lifted the box from the current and passed it to her.",
      "The cold silver box touched Luna's feathers, and the whole task returned. Whatever was inside the box had to be planted before that day ended.",
      "Luna opened the lid and found twelve first-tree seeds inside. Each round seed glowed with steady gold light, waiting for a place in the soil.",
      "As Luna touched one seed, she remembered why she had saved them. \"The tired old trees need young neighbors to grow beside them,\" she explained.",
      "Luna carried the box back to the friends waiting near Hollow Oak. She gave one glowing seed to each helper and showed them where to dig.",
      "Before sunset, the friends planted all twelve seeds in a wide ring around Hollow Oak. They covered each hole gently and watered the dark soil.",
      "After the last seed was planted, Luna gathered her friends around the new ring. She thanked them for helping her remember and finish the important task before sunset."
    ]
  }),
  "moonwood-tales-c-11": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-STONE", "MOON-LOCAL-C11-TOADLING"],
    storySpine: "Pip wants to identify a frightening marsh noise, but Stone's first call overwhelms its tiny source, so they listen and answer gently.",
    failedAttempt: "Stone's first enormous call shakes the reeds and makes the lost toadling hide behind its rock.",
    resolution: "Stone uses three soft calls, the toadling's family answers, and their joined song follows Pip and Stone home.",
    pages: [
      "Pip and Stone were resting outside when a huge sound rolled from Fog Marsh. It rattled the leaves, and both friends turned toward the distant reeds.",
      "Pip wanted to discover what could make such a powerful noise. Stone would rather have stayed far away, because anything that loud had to be enormous.",
      "Pip took his lantern and started down the marsh path alone. After one worried pause, Stone lifted a foot and slowly followed his smaller friend.",
      "At the edge of Fog Marsh, another crash sent ripples across the dark water. Pip's hair lifted with surprise, and Stone quickly caught up.",
      "The friends entered the marsh side by side instead of separating. Each booming echo bounced between the twisted trees, making its source hard to find.",
      "As Pip and Stone followed the sound, tall reeds began to shake nearby. Dark water circled their boots, and the next call seemed very close.",
      "The reeds opened to reveal one tiny toadling sitting on a mossy rock. Its mouth stretched wide, and the enormous noise rolled out again.",
      "When the toadling saw Pip and Stone, it closed its mouth at once. The last echo faded, leaving the whole misty marsh suddenly quiet.",
      "Pip asked why the little toadling was making such a giant call. It explained that it was lost and had been calling for its family.",
      "Stone knelt beside the mossy rock so he would not seem so large. \"I can help with a small call,\" he told the toadling.",
      "Stone's first call still boomed, and the toadling hid behind its rock. He tried three softer calls, and three gentle answers came across the water.",
      "The toadling's family gathered around the mossy rock and sang together. Walking home, Pip and Stone could still hear their happy marsh song behind them."
    ]
  }),
  "moonwood-tales-c-12": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-DEWDROP", "MOON-PIP"],
    storySpine: "Fern and Dewdrop want Crystal Stream singing again, but neither plant strength nor water pressure moves the boulder, so they combine both.",
    failedAttempt: "Dewdrop's strongest current and Fern's strongest push each fail against the mud-locked boulder.",
    resolution: "Fern's vine pulls while Dewdrop loosens the mud, freeing the singing stones and restoring the stream's sound.",
    pages: [
      "Fern paused beside Crystal Stream because its familiar music had vanished. The water still flowed between the banks, but none of the singing stones made a sound.",
      "Dewdrop dipped below the surface and listened to the silent current. When she rose, she told Fern that the trouble began somewhere farther upstream.",
      "Fern and Dewdrop followed the narrowing stream toward its oldest source. With every bend, the water grew quieter and the forest became more still.",
      "Farther upstream, ancient roots spread wider across the banks and under the water. The friends followed them while the last faint stream note disappeared.",
      "At the source, a fallen boulder rested in thick mud across the stream. Beneath it, the smooth singing stones were trapped without moving water.",
      "Dewdrop sent her strongest rush of water against the boulder's round side. Water splashed everywhere, but the heavy stone remained locked in the mud.",
      "Fern braced both feet and pushed the boulder with her hands. The pressure only sank it deeper, allowing the wet mud to grip even tighter.",
      "Fern looped a strong green vine around the boulder and pulled from the bank. At the same time, Dewdrop sent a steady current underneath it.",
      "The water loosened the thick mud while Fern's vine pulled the boulder forward. With one heavy roll, the stone moved safely onto the bank.",
      "Freed from the boulder, the current rushed over every smooth singing stone. One clear note rang out, then the whole stream joined the bright song.",
      "Fern and Dewdrop rested beside the flowing water and listened to the music they had restored together. The stream carried their laughter down through Moonwood.",
      "At Hollow Oak, Pip heard Crystal Stream singing before Fern and Dewdrop appeared. He followed the returning music outside and welcomed both friends home."
    ]
  }),
  "moonwood-tales-c-13": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-SPARK"],
    storySpine: "Glimmer and Spark trade lessons in warmth and floating, but charts and copying fail, so each gives the other one physical cue to test.",
    failedAttempt: "Spark's charts produce only Glimmer's smoke, while Glimmer's vague wing example lifts Spark's hat instead of Spark.",
    resolution: "Spark floats one boot, Glimmer glides five steps and warms their hands, and both name the progress they can repeat.",
    pages: [
      "Spark offered Glimmer fire lessons if they helped test his floating spell. Glimmer liked the trade, so they placed one claw in Spark's hand and sealed the deal.",
      "Spark began by covering three boards with arrows, numbers, and tiny flames. He explained each mark carefully, but Glimmer's eyes grew wider as the lesson grew harder.",
      "Glimmer followed every arrow and took a careful breath. A soft gray cloud puffed from their nose, so Spark frowned at his notes and wrote 'more smoke.'",
      "That afternoon, Glimmer showed how their wings caught the air. They spread them wide, hovered for a moment, and landed softly. 'Now you try,' they told Spark.",
      "Spark copied Glimmer's pose and waved his arms with great care. Golden sparkles lifted his hat, but both boots stayed firmly on the ground. 'Almost,' Spark said.",
      "On the third day, Spark brought even more charts about heat, breathing, and dragon bodies. Glimmer tried every new instruction, yet smoke still curled out and Spark still could not float.",
      "Glimmer pushed the crowded charts aside. 'Let's try one small thing,' they said. They told Spark to lift one boot and notice the cool air underneath it.",
      "Spark lowered his wand, stopped waving, and slowly raised one boot. For one steady second it floated above the grass. Both friends stared, then cheered at the same time.",
      "Now Spark asked Glimmer to practice moving through the air. 'Run first,' Glimmer suggested. 'Open your wings when you feel the wind, and let it carry you.'",
      "Glimmer ran across the clearing, opened both wings, and jumped. The air caught them, and they glided five whole steps before landing. 'That was real flying!' Spark cried.",
      "For one last fire lesson, Spark cupped his hands near Glimmer's nose. 'Breathe slowly into this little space,' he said. Cinnamon warmth filled the gap between them.",
      "Spark counted their repeatable successes: one floating boot, five gliding steps, and one warm breath. Glimmer tapped one claw against Spark's hand. They had kept their deal."
    ]
  }),
  "moonwood-tales-c-14": fictionRewrite({
    level: "C",
    canonIds: ["MOON-WREN", "MOON-FLINT"],
    storySpine: "Wren and Flint want Whispering Meadow, but choosing between a stale map and unstable spell gets them lost, so they read living mushroom signals.",
    failedAttempt: "They reject both conflicting directions and go straight, reaching Fog Marsh with maps and spell arrows that cannot orient them.",
    resolution: "Wren notices the mushrooms brighten toward open ground; they follow the pulse trail to the meadow and record the clue.",
    pages: [
      "Wren and Flint set out for Whispering Meadow with a map, a direction spell, and lunch. Both were certain their own guide would work.",
      "At the first fork, Flint's map said left while Wren's glowing arrow pointed right. They argued, chose the middle path, and marched straight into the trees.",
      "An hour later, the path disappeared beneath roots and leaves. The trees looked unfamiliar in every direction, and neither traveler could see the golden meadow grass.",
      "Flint unfolded his map and insisted the meadow was close. Then gray fog curled between the trunks, and Wren recognized the cold, damp edge of Fog Marsh.",
      "Wren cast her direction spell again, but the bright arrow spun in circles. At last it stopped and pointed at Flint, who was standing beside her.",
      "Flint searched through seven spare maps. One showed an old road, another was upside down, and the others described places far away.",
      "Tired and worried, they sat beneath a glowing mushroom. Flint noticed that one side shone brighter than the other, always facing away from the dark marsh.",
      "Wren closed her spell book and knelt beside the mushroom. 'Can you show us the open meadow?' she asked. Its bright side pulsed as if answering.",
      "A second mushroom flashed farther ahead, and then a third answered beyond it. Wren and Flint followed the line of gentle lights through the thick trees.",
      "The last trees opened onto Whispering Meadow, where golden grass waved in the sun. Flint laughed with relief, and Wren thanked the mushrooms for guiding them.",
      "Before they ate lunch, Flint drew the mushroom trail onto his map and added the date. Wren marked each bright side facing Whispering Meadow, so they could read the signal again.",
      "When both travelers stepped safely into the meadow, the final mushroom behind them grew dim. Wren and Flint looked back at its quiet glow, then smiled at each other."
    ]
  }),
  "moonwood-tales-c-15": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-LUNA"],
    storySpine: "Burrow wants to understand a carved underground room, but looking alone reveals no meaning, so Luna's remembered touch wakes its stored stories.",
    failedAttempt: "Burrow studies every carving and glowing stone alone, yet cannot tell what the room records.",
    resolution: "Luna identifies the Memory Room, lights each carving by touch, and begins its first story while Burrow listens.",
    pages: [
      "Burrow was digging a quiet morning tunnel when his shovel broke through an old stone wall. Before he could stop, the loose earth carried him into darkness.",
      "He landed in a chamber wider than any tunnel he had ever made. Burrow brushed dirt from his waistcoat and slowly lifted his lantern to look around.",
      "Carved animals, trees, and stars covered every wall. Far above Burrow, tiny stones glowed across the ceiling like a sky hidden deep beneath Moonwood.",
      "Burrow studied each picture and tried to find where the story began. No carving had words or numbers, so their order remained a complete mystery.",
      "He hurried to find Luna, who knew Moonwood's oldest secrets. The tunnel was narrow, but Luna carefully folded her broad wings and followed Burrow underground.",
      "At the chamber doorway, Luna stopped so suddenly that Burrow nearly bumped her. Her amber eyes widened behind her tiny glasses. 'Oh,' she whispered.",
      "As Luna stepped inside, one wing brushed a carving. Blue and gold lines woke around the picture, spreading warm light across the dark stone wall.",
      "Burrow stared at the shining picture. 'Have you been here before?' he asked. Luna touched the stone gently, as if greeting a friend she remembered.",
      "'This is the Memory Room,' Luna explained. 'Moonwood keeps its oldest stories here, so they remain safe when spoken words are forgotten.' Burrow listened closely.",
      "Luna settled beneath the first glowing carving and began its tale. Burrow sat beside her, listening as the pictured characters seemed to move in the light.",
      "When Luna reached the next part, another carving glowed. Then the next picture brightened, until a clear path of light carried the story around the room.",
      "Night came while Burrow and Luna were still listening belowground. Many carvings remained dark, but Burrow smiled. The Memory Room had many more stories to share."
    ]
  }),
  "moonwood-tales-c-16": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-GLIMMER", "MOON-STONE", "MOON-BURROW"],
    storySpine: "Pip and Glimmer want to identify who moves clearing objects at night, but their first watch nearly ends in sleep, so a second sound exposes Burrow.",
    failedAttempt: "Hours of silent watching make Glimmer doze and reveal nothing before the shuffling finally begins.",
    resolution: "They observe Burrow sleep-digging, show him the muddy trail at sunrise, and Burrow asks to be woken before his boot walks again.",
    pages: [
      "One morning, Pip found his boots across the clearing and a heavy bench tipped on its side. He knew both things had stood in their proper places overnight.",
      "The following night, more objects moved while everyone slept. Bowls, baskets, and boots changed places, yet no Moonwood friend remembered waking or touching them.",
      "Pip asked Glimmer to help watch the clearing after dark. They planned to stay hidden, find the nighttime mover, and stop anything else from being knocked over.",
      "When moonlight filled the clearing, Pip and Glimmer crouched behind a broad mushroom. Hollow Oak stood quiet, and nothing moved except the softly glowing leaves.",
      "They watched for hours without seeing a single clue. Glimmer's cinnamon-warm breath faded, Pip's head drooped, and soon both friends were fighting to keep their eyes open.",
      "A sudden shuffling sound woke them. Pip peeked around the mushroom and saw a round figure dragging one foot across the clearing.",
      "The figure stepped into the moonlight. It was Burrow, walking quickly with his eyes closed. Pip realized their friend was still fast asleep.",
      "Burrow bumped the bench, then picked up Pip's boots and carried them away. He never opened his eyes, even when one boot thumped against his knee.",
      "Next, Burrow tucked several acorn biscuits into his waistcoat pockets. Glimmer covered a laugh, but Pip pointed to the muddy trail and kept watching quietly.",
      "Still asleep, Burrow leaned against the mushroom where Pip and Glimmer were hiding. His loud snore shook the cap, and both watchers had to move aside.",
      "At sunrise, Burrow finally woke. Pip and Glimmer showed him the tipped bench, missing biscuits, and muddy footprints matching his dirty boot.",
      "Burrow placed the dirty boot beside his door as a reminder. 'If it starts walking tonight, please wake me first,' he said. Pip and Glimmer promised they would."
    ]
  }),
  "moonwood-tales-c-17": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-WREN", "MOON-BURROW"],
    storySpine: "Wren wants to help Fern's garden grow, but she ignores the potion's warning color and makes every plant walk, so both follow the reversal recipe.",
    failedAttempt: "Wren pours a purple motion potion after Fern questions it, sending every rooted pot wandering away.",
    resolution: "Fern calls the plants with their root-song while Wren applies stream water, then Wren separates the color-coded recipes and admits her mistake.",
    pages: [
      "Wren arrived at Fern's garden carrying a small cauldron filled with bubbling potion. She said it would help every plant grow, while Fern studied the purple liquid.",
      "'Did you check the whole recipe?' Fern asked. Wren hugged the book to her robe and answered, 'Mostly.' That answer did not make Fern feel better.",
      "Fern opened the recipe and pointed to a warning. The finished growing potion should be green, but the mixture inside Wren's cauldron shone bright purple.",
      "Wren decided to pour it anyway. One flowerpot straightened, leaned toward the path, and stepped out of its soil. Fern stared as its roots began walking.",
      "Within moments, every pot was marching politely around the garden. Some plants followed the path, while others circled Fern and Wren in a leafy parade.",
      "Wren opened her book and searched for an answer, but the wandering plants kept leaving. Fern hurried after them, calling each plant by its name.",
      "Several pots entered Hollow Oak, and the smallest one waddled toward Burrow's tunnel. Burrow jumped aside as its roots tapped past his door.",
      "At last, Wren found the purple motion recipe. The cure required Fern's root-song first, followed by plain stream water sprinkled over every moving plant.",
      "Fern stood in the center of the clearing and sang the slow root-song. Each plant stopped marching, turned toward her voice, and waited for the next step.",
      "Wren hurried between the waiting pots and sprinkled them with stream water. One by one, the plants walked back toward their own patches of garden soil.",
      "The smallest pot returned last and settled into its empty patch. Its roots curled safely beneath the soil, and Fern gently pressed the earth around them.",
      "When every plant was home, Wren placed the green and purple recipes in separate books. She set both books beside the empty cauldron. 'I skipped three important words,' she admitted. The garden stood still around them."
    ]
  }),
  "moonwood-tales-c-18": fictionRewrite({
    level: "C",
    canonIds: ["MOON-STONE", "MOON-DEWDROP", "MOON-LOCAL-C18-FISH"],
    storySpine: "Dewdrop wants a fish freed from two rocks, but water pressure fails and Stone fears getting wet, so Stone chooses one careful reach.",
    failedAttempt: "Dewdrop's strongest current presses the fish tighter, while Stone's first reach stops above the water.",
    resolution: "Stone moves the loose rock, accepts one enormous splash, and watches the freed fish surface.",
    pages: [
      "Dewdrop was swimming through Crystal Stream when she found a large fish trapped in the shallows. Its silver body twisted between two rocks, but it could not escape.",
      "The rocks gripped the fish on both sides while its tail flicked desperately. Dewdrop checked for injuries, then asked the fish to stay as still as possible.",
      "Dewdrop sent a strong current against the rocks. Instead of freeing the fish, the rushing water pressed its body tighter, so she stopped at once.",
      "She hurried to Stone and asked for his broad hand and careful strength. Stone followed her to the bank, though his worried eyes stayed on the sparkling water.",
      "Stone crouched beside the stream and reached toward the fish. Then he pulled back. 'I want to help,' he admitted, 'but I really dislike getting wet.'",
      "He tried once more, but his hand stopped above the surface. Dewdrop waited without pushing him, while the trapped fish gave another frightened flick.",
      "Stone rolled up one sleeve and studied both rocks carefully. One was buried deep, but the other had a dry upper edge and loose mud underneath.",
      "Taking a slow breath, Stone put his hand into the stream and gripped the dry edge. Cold water swirled around his wrist, but he held on.",
      "Stone pushed the loose rock with steady strength. Mud released with a wet sucking sound, the rock turned aside, and the fish darted into open water.",
      "The fish leaped in a shining arc and landed with an enormous splash. Water soaked Stone from head to feet, and Dewdrop waited for his reaction.",
      "Stone stood dripping beside Dewdrop while the fish circled them once. His shoulders relaxed when he saw it swimming strongly, with no rocks blocking its path.",
      "Beyond the shallows, the fish lifted its head above the stream. Stone gave one small nod and said, 'Good.' Getting soaked had been worth it."
    ]
  }),
  "moonwood-tales-c-19": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FLINT", "MOON-WREN", "MOON-SPARK", "MOON-STONE", "MOON-BURROW", "MOON-DEWDROP", "MOON-FERN"],
    storySpine: "Luna wants the missing glow seeds found before night, but hurried searches and spells fail, so Fern listens for their living shoots.",
    failedAttempt: "Every group searches the expected hiding places while search spells point only at their casters, finding no seeds.",
    resolution: "Fern discovers she planted them two nights earlier; the group protects the glowing seedlings where they are growing.",
    pages: [
      "Luna opened the glow-seed box and found it completely empty. She searched the shelf and floor, but not one tiny golden seed remained inside Hollow Oak.",
      "Without the glow seeds, Moonwood's paths might become dark that night. Luna called the friends together and explained why they had to find every missing seed.",
      "The friends divided the forest into careful search routes. Each group chose one place to check, and Luna asked everyone to return before the daylight faded.",
      "Pip searched Fog Marsh and found only sticky mud. Flint explored three unmapped turns, drew them neatly, and returned without seeing a single seed.",
      "Wren and Spark tried search spells in the clearing. Their arrows pointed at each other, so both wizards lowered their wands and searched by hand.",
      "Burrow checked every tunnel beneath Hollow Oak. He searched old shelves, fresh piles of earth, and secret corners, but came back with two empty paws.",
      "Dewdrop scanned Crystal Stream while Fern listened near the clearing. Everyone else watched the ground, yet Fern stayed still because she heard a faint hum.",
      "The soft sound came from beneath a layer of leaves in Fern's garden. When she lifted them, small gold-green shoots glowed, and their new roots hummed together.",
      "Fern gasped as she remembered. 'I planted the glow seeds two nights ago!' She had meant to help them sprout, then forgotten to tell Luna.",
      "The searchers returned from every path and gathered around the bright seedlings. Their worried faces changed to smiles when they saw the missing seeds were safely growing.",
      "Luna touched one shallow root and felt it tremble. 'We should leave them here,' she said. The young plants needed soil, water, and room to grow.",
      "That night, the friends placed small guards around each seedling. Their gold-green light marked every path near Hollow Oak, and no traveler had to walk in darkness."
    ]
  }),
  "moonwood-tales-c-20": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-LUNA", "MOON-STONE", "MOON-WREN", "MOON-FLINT", "MOON-SPARK", "MOON-LOCAL-C20-STAR-SPIRITS"],
    storySpine: "The friends want fallen star spirits returned before dawn, but tossing them from the clearing fails, so they carry them to Tumblerock Cliffs.",
    failedAttempt: "Pip tosses one spirit upward from the clearing, but it falls back and bounces away.",
    resolution: "The group climbs to Moonwood's highest safe ledge and lifts each spirit until the sky draws it home.",
    pages: [
      "Near midnight, several small golden lights fell from the sky into Moonwood. They landed softly among the mushrooms, then began bouncing across the clearing.",
      "The strange lights giggled as they bounced, leaving glowing trails behind them. Pip, Luna, and the others hurried outside to see what had fallen.",
      "Pip caught one warm light before it bounced into a bush. It had enormous golden eyes, tiny hands, and a frightened face that made him hold it gently.",
      "The little spirit pointed upward and managed two worried words: 'Star fell.' Pip held it close while the other spirits reached toward the dark sky.",
      "Luna listened to their soft cries. 'These are fallen star spirits,' she explained. 'They must return to their places in the sky before dawn arrives.'",
      "Pip lifted one spirit above his head from the clearing. It stretched upward, but the sky did not pull, and the tired spirit fell into his arms.",
      "'The sky can reach them from Tumblerock's highest safe ledge,' Luna said. Flint knew the route, so he quickly unfolded a map and led the group.",
      "Everyone followed Flint up the rocky path before dawn. Stone carried two spirits, while Wren and Spark kept the bouncing travelers safely away from the cliff edge.",
      "As they climbed, the star spirits reached toward the sky. Their golden trails grew brighter, and the dark stars above seemed to answer with gentle flashes.",
      "At the highest ledge, Stone raised both hands. Pip and Spark guided the bouncing spirits beside him, while Luna watched the paling sky for sunrise.",
      "One by one, each spirit floated from their hands and rose. The sky drew every golden traveler back into its old place among the waiting stars.",
      "The last spirit blinked at Stone from his palm. Then it rose just before dawn. Stone watched one distant star flash brightly, confirming that the final traveler was home."
    ]
  }),
  "moonwood-tales-c-21": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-WREN", "MOON-LUNA", "MOON-BURROW", "MOON-FERN", "MOON-LOCAL-C21-TWIG"],
    storySpine: "Pip wants to identify scratching inside Hollow Oak, but searching every known room fails, so Burrow follows the sound through a root door.",
    failedAttempt: "Pip, Wren, Burrow, and Fern search every ordinary room without finding the speaker inside the walls.",
    resolution: "Fern finds Twig's spectacles, the friends widen her tiny door, and Twig shares company before returning to her private room.",
    pages: [
      "Late one evening inside Hollow Oak, Pip heard scratching behind the root wall. A tiny voice seemed to be searching for something, but he could not see anyone.",
      "Wren pressed one ear against the wall beside him. The scratching moved from root to root, followed by quiet muttering that neither friend could understand.",
      "Luna listened from her perch and said she had heard that scratching long ago. Still, she could not remember who lived behind that part of the oak.",
      "Pip, Wren, Burrow, and Fern searched every room they knew. They looked under tables and behind shelves, but found no doorway into the root wall.",
      "Burrow sniffed along the moss until his nose stopped at one thick patch. Hidden behind it was a root door so tiny that Pip could not enter.",
      "Fern folded her wings, squeezed through the narrow doorway, and called back. 'There is a whole room inside, and someone is searching through a very large collection!'",
      "The hidden room felt warm and cozy. Acorns, buttons, feathers, and other collected objects filled its shelves, while a small creature searched each pile.",
      "The creature introduced herself as Twig. She had searched for her spectacles for three days and asked Fern to check the crowded shelves.",
      "Fern looked around, then noticed the spectacles resting on Twig's head. 'They are above your ears,' she said gently. Twig reached up and laughed.",
      "Twig slipped the spectacles onto her nose and returned to sorting acorns. With the lenses in place, she could finally see which acorns belonged in each basket.",
      "Fern leaned through the tiny doorway and called to the others. 'Twig found her spectacles, and she would like some visitors!' The friends cheered from outside.",
      "Together they widened the doorway, then shared one biscuit in Twig's warm room. When visiting time ended, Twig waved happily and closed her own little door."
    ]
  }),
  "moonwood-tales-c-22": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-STONE", "MOON-DEWDROP", "MOON-WREN", "MOON-FLINT", "MOON-GLIMMER", "MOON-SPARK", "MOON-BURROW"],
    storySpine: "Moonwood's runners want to finish a marked race, but Wren's wide-circle speed spell scatters them, so Dewdrop returns from the finish to guide everyone home.",
    failedAttempt: "Wren's shortcut accelerates nearby racers but not herself, sending Glimmer, Spark, and Stone off balance and Flint off route.",
    resolution: "Dewdrop finishes, turns back to guide every racer home, and receives one leaf for finishing and one for returning.",
    pages: [
      "Luna marked a long race from Hollow Oak to Crystal Stream, around Tumblerock Cliffs, and back. Every racer gathered beside the starting line, ready to follow the trail markers.",
      "At Luna's signal, Pip ran, Fern flew, and Stone began a steady trot. Wren opened her spell book while the other racers followed the first markers.",
      "Flint hurried ahead and made two confident left turns. Instead of finding the stream, he reached the gray edge of Fog Marsh and finally checked his map.",
      "Wren cast a wide-circle speed spell to help everyone. The nearby racers suddenly shot forward, but Wren stayed behind and realized the spell had missed its caster.",
      "Glimmer bumped into Spark as the spell pushed them ahead. Spark's hat flew one way, golden sparkles flew another, and both racers tumbled onto the soft grass.",
      "Stone caught one foot on a thick root. He wobbled, stretched both arms, and slowly lowered himself until he sat on the path.",
      "Pip slid into Crystal Stream with a splash. He climbed out dripping, found the next bright marker, and kept running instead of taking another risky shortcut.",
      "Wren saw the scattered racers and closed her spell book. She followed the marked trail on foot, determined not to cause another tumble with hurried magic.",
      "Dewdrop crossed the finish line first and smiled at Luna. Then she noticed the empty path behind her. 'Wait,' she asked, 'where is everyone else?'",
      "Dewdrop turned around and followed the markers back. She found Flint, Spark, Stone, and soggy Pip, then guided the tired racers safely to Hollow Oak.",
      "Luna counted everyone as Burrow tunneled up beside the finish line. Wren apologized for scattering the racers with her spell. Then the whole group thanked Dewdrop for coming back.",
      "Luna gave Dewdrop one leaf for finishing first and a second leaf for returning. Dewdrop held both leaves against her blue-green glow. Every racer cheered beside her."
    ]
  }),
  "moonwood-tales-c-23": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-LUNA", "MOON-FERN", "MOON-DEWDROP", "MOON-LOCAL-C23-MARSH-SPIRIT"],
    storySpine: "Pip wants to stop Fog Marsh spreading, but marking its edge only proves the mist keeps moving, so the group enters and finds the crowded spirit's cause.",
    failedAttempt: "Pip marks the fog line with a stick, but days later the mist crosses it and the edge mushrooms go dark.",
    resolution: "The group removes the dumped objects, marks the marsh boundary, and the spirit condenses as its mushrooms glow again.",
    pages: [
      "Pip pushed a stick into the ground at Fog Marsh's edge. Gray mist had crept closer to Hollow Oak, and he wanted to see whether it was still spreading.",
      "Several days later, the fog had crossed Pip's marker. The mushrooms along the old marsh edge were dark, so he hurried to tell Luna what had changed.",
      "Luna entered the marsh with Pip, Fern, and Dewdrop. They planned to follow every sign toward the center until they discovered why the mist was moving.",
      "Dewdrop followed small ripples through the still water. Beside her, Luna, Pip, and Fern crossed the narrow bridge and kept the moving fog in sight.",
      "At the marsh center, they found a gray mist spirit resting against a dead tree. The spirit looked squeezed and tired, with clutter piled around its home.",
      "The spirit pointed toward the crowded edge. 'Every forgotten thing takes away part of my home,' it explained. Pip looked around and understood the problem.",
      "Old rope, a broken lamp, torn mushroom caps, and empty baskets covered the marsh. There was barely enough open space for mist or water to move.",
      "Pip recognized objects that Moonwood neighbors had left behind. 'We filled your home without asking,' he admitted. The mist spirit gave one slow, unhappy nod.",
      "Pip, Fern, and Luna carried every object out of the marsh. At the same time, Dewdrop cleared the blocked channel so clean water could flow again.",
      "When the final basket left, the mist spirit stretched tall and clear. Fresh water moved around its tree, and the gray fog began drawing back.",
      "At the marsh edge, each Moonwood neighbor carried one stone into place. Together they built a clear boundary, so everyone could see where the mist spirit's home began.",
      "The fog stayed behind the new stone line, and mushrooms along the edge lit one by one. Pip checked his old marker and smiled at the peaceful marsh."
    ]
  }),
  "moonwood-tales-c-24": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-LUNA", "MOON-PIP", "MOON-STONE"],
    storySpine: "After weeks of smoke and sparks, Glimmer wants one controlled flame, but excitement wobbles the second attempt, so they pause and try one careful lantern light.",
    failedAttempt: "Glimmer's first tiny flame fades, and excitement makes the longer second flame wobble, so Luna stops the attempt.",
    resolution: "Under Luna's supervision, Glimmer lights one magic lantern inside the fire circle, and the lantern network carries that careful light.",
    pages: [
      "After weeks of making only smoke and sparks, Glimmer entered Luna's fire circle. Today, the young dragon hoped to breathe one small flame that stayed under control.",
      "A full water bucket and red extinguisher waited outside the stone ring. Pip and Stone watched from a safe distance while Luna checked the practice area.",
      "Glimmer took a slow breath and blew gently. One tiny orange flame burned steadily inside the circle, then faded before it touched any of the stones.",
      "Pip covered his mouth to hold back a cheer. Luna checked the ring and nodded. 'The flame stayed inside,' she told Glimmer. 'That was careful.'",
      "Glimmer tried again, and a longer flame glowed inside the ring. Excitement rushed through the young dragon as the warm orange light grew brighter.",
      "Glimmer gasped, and the flame began to wobble toward the stones. 'Stop,' Luna said firmly. Glimmer closed their mouth, and the unsafe flame vanished.",
      "After one long breath, Glimmer faced the magic lantern inside the circle. They aimed one small, steady flame at its waiting wick, following the lantern's old rule.",
      "The lantern caught the flame and shone. Golden sparks traveled from lamp to lamp, lighting the path without spreading fire across the ground.",
      "Soon, a line of safe golden light wound through Moonwood. Lanterns and glowing mushrooms marked every turn. From the fire circle, Glimmer watched the whole path brighten.",
      "Glimmer looked from the bright lanterns to the stone practice ring. The path was glowing, but the stones remained cool and nothing nearby had burned.",
      "Luna smiled at the young dragon. 'One careful flame lit the whole path,' she said. Glimmer's eyes shone as brightly as the nearest lantern.",
      "Glimmer closed their mouth and beamed while Luna checked every stone again. All were cool, and the friends celebrated a safe first flame under the golden lights."
    ]
  }),
  "moonwood-tales-c-25": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-STONE", "MOON-BURROW", "MOON-WREN", "MOON-LUNA", "MOON-GLIMMER", "MOON-LOCAL-C25-SILVER-EYE"],
    storySpine: "Pip wants to return a frightened silver-eyed creature to the Deep Dark, but Luna's surface paths become indistinguishable, so Burrow finds its underground route.",
    failedAttempt: "Luna's surface route reaches a place where every dark path looks alike, and the group stops rather than guess.",
    resolution: "Burrow discovers the homeward tunnel, the creature rejoins its family, and a silver blink confirms the safe return.",
    pages: [
      "Deep in the night, Moonwood lay quiet beneath the trees. Then a small scratching sound came from the clearing's edge. Something tiny waited there.",
      "Pip opened the door and saw a small creature at the clearing's edge. Its enormous silver eyes shone in the dark. It trembled but did not run.",
      "Pip knelt down and held completely still, speaking only in a soft voice. The creature watched him, then chose to step closer. One step, then another.",
      "Pip brought the creature inside Hollow Oak, where the others had woken. Stone placed an acorn biscuit nearby. Everyone stayed back while the creature ate.",
      "Burrow lowered his voice and asked, \"Where is your home?\" The creature looked at its paws, then pointed through the window. \"Deep,\" it whispered. \"Deep Dark.\"",
      "Pip promised, \"We'll take you home.\" Wren looked uncertain, but Stone moved beside Pip. One by one, every friend stepped forward to join them.",
      "The friends entered the forest together, with Luna leading the way. Glimmer carried one small flame in the middle. The silver-eyed creature walked safely between them.",
      "Soon, Glimmer's flame reached only a little way ahead. Beyond its glow, every dark forest path looked the same. The friends stopped close together instead of guessing.",
      "Burrow sniffed the soil and found a familiar smell beneath the roots. He uncovered a narrow underground path. The creature stepped forward. \"Here,\" it said.",
      "Beyond the roots, silver moss lit a warm hidden clearing. Several small creatures waited together in its glow. Their enormous silver eyes matched the visitor's.",
      "The lost creature raced toward the waiting silver-eyed rabbits. Its family pressed close around it, warm and safe. Then one rabbit looked toward Pip and blinked.",
      "On the walk back, Pip paused at the edge of Deep Dark. One silver light blinked twice behind him. Pip smiled. The little creature had found its way home."
    ]
  }),
  "moonwood-tales-c-26": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-BURROW"],
    storySpine: "Pip wants to stop Hollow Oak's bell shaking lanterns loose, but grabbing the visible rope worsens it, so he traces the vibration below ground.",
    failedAttempt: "Pip holds the upper rope still, which transmits the buried branch's tugs and makes the bell ring harder.",
    resolution: "Pip and Burrow find the wind-pulled branch, secure its lower rope to a root peg, and rehang the fallen lantern beside a silent bell.",
    pages: [
      "A brass bell rang beneath Hollow Oak, though nobody touched its hanging rope. Pip looked up in surprise. Why was the bell moving by itself?",
      "The ringing made every lantern rattle against its hook. Pip watched one sway farther with each chime. He needed to quiet the bell before it fell.",
      "Pip grabbed the rope with both hands and tried to hold it still. Instead, the bell swung harder above him. The lanterns shook even more.",
      "Pip released the rope and pressed one palm against the wooden floor. With every chime, a root trembled under his hand. The shaking came from below.",
      "Burrow dug carefully beneath the floor while Pip followed the trembling root. Soon they uncovered a buried branch tugging a second rope. That rope led upward.",
      "Outside, the old tree bent under a strong night wind. Each bend moved its buried branch. Underground, the branch pulled the bell rope again.",
      "Pip pushed a wooden wedge beside the branch to hold it still. For one moment, the bell stopped. Then a gust knocked the wedge loose.",
      "Pip needed something stronger than the loose wedge. He looped the lower rope around a smooth root peg. Burrow watched while Pip pulled the knot tight.",
      "Another gust bent the old tree and tugged its buried branch. This time, the tied rope could not move. Above them, the bell stayed silent, and one fallen lantern rested below it.",
      "Pip rehung the fallen lantern beside the still bell. Burrow listened while the wind rushed outside. Not one clang disturbed Hollow Oak, and every lantern stayed safely hooked."
    ]
  }),
  "moonwood-tales-c-27": fictionRewrite({
    level: "C",
    canonIds: ["MOON-STONE", "MOON-FERN", "MOON-PIP"],
    storySpine: "Stone wants to help Fern open the glassleaf buds, but his huge shadow blocks the moon, so he reflects stream light from outside the garden.",
    failedAttempt: "Stone moves around the root ring, yet his body remains between the moon and every bud.",
    resolution: "Stone tilts a flat wet rock until reflected moonlight opens the buds, which scatter tiny moon shapes across his hands.",
    pages: [
      "Fern cupped one glassleaf bud as the moon rose over her garden. The bud needed moonlight before it closed, but old branches shaded the flower bed.",
      "Stone saw branches shading the flower bed and reached across the old roots. \"I can clear those,\" he said. Pip watched his enormous hands move closer.",
      "As Stone leaned forward, his enormous shadow spread across the garden. Every glassleaf bud disappeared from the moonbeam. The whole flower bed grew dark.",
      "Stone stepped to the left, hoping the moonlight would return. Curving roots still blocked his reach, and his shadow covered the buds again. He sighed.",
      "Pip noticed a silver patch shining beneath the roots on the garden's far side. \"That light comes from the stream!\" he called. Stone turned to look.",
      "Stone walked to Crystal Stream and chose one flat, wet rock. Its smooth surface caught the moonlight. He carried it back without entering the fragile flower bed.",
      "Stone held the rock outside the roots and tilted it toward the garden. A bright moonbeam flashed over the buds and struck the branches. Too high.",
      "Fern lowered one finger toward the waiting buds. \"Just this much,\" she said. Stone tipped the wet rock slowly until the beam followed her hand.",
      "The reflected moonlight slid across the flower bed from one end to the other. Each glassleaf bud opened into a shining bell. Warm gold light filled every flower.",
      "Tiny moon shapes danced across Stone's broad hands as the glassleaf bells opened. He held perfectly still so the beam stayed in place. The silver patterns shimmered."
    ]
  }),
  "moonwood-tales-c-28": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-LUNA", "MOON-LOCAL-28-HUMMING-ROOT"],
    storySpine: "Fern wants a silver root off Hollow Oak's step, but every calming note adds a loop, so she uses silence and three slow taps instead.",
    failedAttempt: "Fern sings four calming notes, and the sound-copying root answers with four loops that tangle the rail.",
    resolution: "Fern lets the root rest in silence, then three spaced taps guide it around a frame and clear the step for Luna's class.",
    pages: [
      "At sunrise, Fern found a silver root curled across Hollow Oak's front step. One loose curve stretched from side to side, blocking every stair. Nobody could pass.",
      "The silver root hummed whenever a forest sound crossed the clearing. Tiny vibration rings traveled along its shining surface. Fern listened and recognized each copied note.",
      "Luna and her young owls gathered on the far side of the step. \"Our way is blocked,\" Luna called. Fern promised to move the root gently.",
      "Fern sang one calm note and waited for the root to relax. Instead, the root copied her sound by curling into one new loop. Fern stared.",
      "Fern tried three more soft notes, hoping a longer song would help. The silver root answered with three tight loops. They wrapped around the wooden rail.",
      "Fern stopped singing and waited until the clearing became completely quiet. With no new sound to copy, the silver root stopped moving.",
      "Beside the step stood an empty wooden frame, safely clear of the doorway. Fern tapped the frame once, making one small vibration. Then she waited.",
      "Fern waited until the root became still again. Then she tapped once more near the frame. The root followed that single vibration without making extra loops.",
      "Fern gave one final tap, making three slow taps in all. The root followed the three vibrations around the wooden frame. Soon the front step was clear.",
      "The silver root rested around the frame as a living arch. One by one, Luna's young owls walked beneath it. Fern listened to their happy hoots."
    ]
  }),
  "moonwood-tales-c-29": fictionRewrite({
    level: "C",
    canonIds: ["MOON-WREN", "MOON-FERN"],
    storySpine: "Wren wants to carry ten moonberries before rain, but her one-object pocket ejects each previous berry, so she bundles all ten together.",
    failedAttempt: "Wren loads the berries separately and arrives at Hollow Oak with only the last berry still in her pocket.",
    resolution: "Wren ties all ten berries inside one leaf, and the single bundle reaches Fern's bowl dry while rain drums outside.",
    pages: [
      "Rain began to fall over Fern's garden, where ten moonberries lay drying on a cloth. Fern watched the drops. The berries had to reach Hollow Oak before they were soaked.",
      "Wren opened her magic pocket beside the ten berries. \"I'll carry them inside before the rain grows heavy,\" she promised. Fern nodded as the dark clouds thickened.",
      "Wren tapped her pocket and cast a familiar spell. The pocket could hold one object without any weight. She smiled, certain ten little berries would fit.",
      "Wren placed the first moonberry inside, then added another and another. The pocket still felt completely light. She hurried toward Hollow Oak without looking behind her.",
      "Each new berry pushed the previous one out of the magic pocket. Plop after plop, moonberries landed safely on the path behind Wren. She never noticed.",
      "At Hollow Oak, Wren reached into her weightless pocket and pulled out one moonberry. \"Only one?\" she cried. Then she raced back along the garden path.",
      "Wren followed the berry trail and gathered the other nine onto a broad leaf. None had rolled away. As she lifted the leaf, Wren had a new idea.",
      "Wren placed the tenth berry beside the other nine. Then she folded the broad leaf around all ten and tied it shut. \"Now they are one bundle.\"",
      "Wren slipped the single leaf bundle into her magic pocket. This time, nothing popped out behind her. She hurried to Hollow Oak as the rain fell harder.",
      "Rain drummed outside while Fern opened the dry leaf bundle. She counted every moonberry into her bowl. All ten had reached Hollow Oak together."
    ]
  }),
  "moonwood-tales-c-30": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA"],
    storySpine: "Luna wants to restore a tangled star mobile before class, but sorting by size makes the wrong pattern, so she matches its shadows to the sky.",
    failedAttempt: "Luna's neat size order creates a straight row that matches no constellation on the ceiling.",
    resolution: "Luna turns each thread until seven lights form an owl, then secures the window while her pupils trace the restored shape.",
    pages: [
      "After a windy night, Luna entered Hollow Oak's star room and stopped. Seven colored glass stars hung in a tangled knot. Their threads crossed in every direction.",
      "Young owls hooted outside the round door, ready for their lesson. Luna had only a few minutes to restore the mobile. She began with a tidy plan.",
      "Luna untangled the glass stars and arranged them from smallest to largest. The seven stars made one neat row. She lifted the mobile toward the ceiling.",
      "Light from the mobile cast a straight row of bright spots on the ceiling. Luna studied the pattern and shook her head. The row did not show any constellation.",
      "Instead of guessing again, Luna opened the round roof window. The true night sky appeared above her. She compared each glass star with the lights overhead.",
      "Luna found one red star east of three close silver points. She held that part of the pattern in her mind. Then she checked the remaining stars.",
      "Luna turned one hanging thread, then another, while watching the ceiling. Each reflected light moved closer to its place in the sky. The pattern slowly formed.",
      "At last, all seven lights joined into the shape of an owl. Luna checked the real stars once more. The restored pattern matched perfectly.",
      "The young owls entered just as the glowing shape settled overhead. \"There it is!\" they hooted. Together, they traced the bright owl with their wing tips.",
      "Before beginning the lesson, Luna tied the roof window latch securely. Wind rustled outside, but the glass stars stayed still. The owl constellation shone above her class."
    ]
  }),
  "moonwood-tales-c-31": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-FERN"],
    storySpine: "Burrow wants a straight garden tunnel, but following a curved root brings him back to his shovel, so he measures the root's full circle.",
    failedAttempt: "Burrow follows the root's easy curve and digs a complete circle back to his starting entrance.",
    resolution: "Burrow tests a firm gap below the root, digs through to Fern's bench, and adds the hidden circle to his corrected map.",
    pages: [
      "Before planting began, Burrow planned a short tunnel from Hollow Oak to Fern's garden. His simple map showed one straight line. He picked up his shovel.",
      "Burrow dug beneath the clearing and followed the straight route on his map. The soil stayed firm and easy at first. Then his shovel struck something hard.",
      "A thick curved root blocked the tunnel from floor to roof. Burrow could not dig through it. He turned left and followed the root instead.",
      "The root curved farther and farther until Burrow suddenly popped aboveground. His own shovel stood beside him. He had dug a complete circle back to the start.",
      "Burrow blinked, then studied the root instead of following it again. He marked its curve with clay dots and measured the full circle using cord.",
      "His measurements showed a narrow strip of firm soil beneath the root's deepest bend. That gap crossed the circle. It might lead straight toward Fern's garden.",
      "Burrow pressed the firm soil twice to make sure it would hold. Then he dug carefully through the narrow gap. His new tunnel stayed straight.",
      "A little later, Burrow's shovel broke through beneath Fern's empty potting bench. He climbed out and looked around. \"Right place!\" he cheered.",
      "Fern checked both tunnel entrances and planted soft moss around their edges. The moss held the soil neatly in place. Now the short garden route was ready.",
      "Burrow drew the hidden root circle on his map before adding the new crossing below it. This time, his straight line reached Fern's garden exactly."
    ]
  }),
  "moonwood-tales-c-32": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FLINT", "MOON-PIP"],
    storySpine: "Flint wants a trustworthy lantern for Deep Dark, but its doubled shadows lead into a fern wall, so Pip checks the light source.",
    failedAttempt: "Flint covers one panel and follows the darker shadow, yet the split beam remains and points him off the path.",
    resolution: "Pip finds the beam-splitting crystal; Flint pouches it, retests one-shadow light, and only then carries the maps into Deep Dark.",
    pages: [
      "Before carrying maps into Deep Dark, Flint stopped at the fern path to test his lantern. He held the light low beside the rolled maps and checked its glow.",
      "Flint lifted the lantern and frowned at the ground. Every root cast two shadows in different directions. A guide light should show one clear way around each root.",
      "Flint covered one glass panel with his gloved hand. He expected one shadow to vanish, but both remained. The problem was not inside that panel.",
      "Flint chose the darker shadow and followed it beside the known path. After only a few steps, he walked straight into a thick fern wall. The shadow had misled him.",
      "Pip examined the lantern instead of the path. Beneath its handle, he spotted one bright crystal at an odd angle. \"That should not be there,\" he said.",
      "Light entered one side of the crystal and left through two angled faces. One lantern beam became two. Now Flint understood the double shadows.",
      "Flint pulled the crystal free, but it slipped from his fingers. As it fell through the beam, two shadows jumped across the ground again. The crystal had caused them.",
      "Flint picked up the crystal and wrapped it inside his brown explorer pouch. He fastened the pouch tightly. This time, no crystal could slip back into the light.",
      "Flint lifted the lantern low and tested every nearby root again. Each root now cast one clear shadow away from the path. The guide light worked properly.",
      "Flint tested the lantern two more times before gathering his maps. One shadow appeared each time. Satisfied, he carried the steady light into Deep Dark."
    ]
  }),
  "moonwood-tales-c-33": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-LUNA"],
    storySpine: "Glimmer wants to separate Luna's sap-stuck paper stars, but direct warmth curls the top one, so they warm every layer slowly from below.",
    failedAttempt: "Glimmer blows cinnamon warmth across the exposed star, curling its points while the deeper sap stays cold.",
    resolution: "Glimmer warms a flat rock at a safe distance; Luna slides it below the stack, and the softened stars lift apart without tearing.",
    pages: [
      "Luna showed Glimmer a stack of paper stars glued together with cold tree sap. The amber sap had hardened between every layer. Class would begin soon.",
      "Glimmer touched the stiff edge and tried to lift the top star. It would not move. \"We need to separate them before class,\" they said.",
      "Glimmer leaned over the table and blew cinnamon warmth across the top paper star. Warm air brushed its points. Luna watched the stack carefully.",
      "The top star's points curled inward, but the deeper stars remained stuck. The sap between them was still cold and hard. Glimmer closed their mouth at once.",
      "Glimmer stepped away from the table and measured three tail-lengths across the floor. Direct warmth was too strong. They needed the heat to rise slowly.",
      "From that safe distance, Glimmer warmed one flat rock with gentle breath. They kept the rock far from the paper. Soon its surface felt evenly warm.",
      "Luna carried the warm rock to the table and slid it beneath the star stack. Glimmer kept their breath away from the paper. Together, they waited.",
      "Gentle warmth rose from the flat rock through the stack. Slowly, the hard amber sap softened between every layer. The paper stars loosened one by one.",
      "Glimmer lifted one paper star, then another, while Luna held the stack steady. Every layer came apart cleanly. Not one star point tore.",
      "Later, the repaired paper stars turned above Luna's evening class. Glimmer watched their smooth points circle overhead. They smiled as every star stayed flat and free."
    ]
  }),
  "moonwood-tales-c-34": fictionRewrite({
    level: "C",
    canonIds: ["MOON-SPARK", "MOON-LUNA", "MOON-FERN"],
    storySpine: "Spark wants a lasting lantern hook, but every copied hook vanishes at ten, so he uses the temporary shape to make a permanent one.",
    failedAttempt: "Spark hangs the lantern from a copied hook, which disappears at count ten and drops the lantern into Luna's catch.",
    resolution: "Spark molds the copy in clay, Fern fills it with root fiber, and the new hook keeps holding beyond the tenth count.",
    pages: [
      "Before moonrise, Spark found the lowest lantern hanging beside a broken curved hook. Hollow Oak needed a matching replacement. Spark studied the good hook above it.",
      "Spark raised his wand and copied the good hook in golden light. His copy spell always lasted exactly ten spoken counts. \"That is plenty,\" he said.",
      "Spark hung the waiting lantern from the glowing copied hook and began to count. For nine counts, the hook held firmly. Luna watched from below.",
      "When Spark called \"ten,\" the golden hook vanished without warning. The lantern dropped, but Luna caught it safely. Spark stared at the empty rail.",
      "Spark cast the copy spell again, hoping the second hook might last longer. He counted without hanging the lantern. At ten, that hook vanished too.",
      "This time, Spark pressed soft clay around a third glowing hook before it disappeared. The clay covered the entire curved shape. He held everything steady as he counted.",
      "At count ten, the golden copy vanished from inside the clay. A smooth curved hollow remained. Spark had captured the hook's shape, even though its magic was gone.",
      "Fern packed strong woven root fiber into every part of the curved mold. Spark pressed the material down carefully. Then they left it beside the warm lanterns.",
      "When the root fiber dried, Fern lifted a solid hook from the mold. Its curve matched the good hook exactly. Spark carried it to the lowest rail.",
      "Spark hung the lantern on the new root-fiber hook, then counted aloud. \"Ten, eleven, twelve!\" The hook remained solid, even after the last gold dot faded."
    ]
  }),
  "moonwood-tales-c-35": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-STONE", "MOON-LUNA"],
    storySpine: "Pip and Stone want four root chimes ready for moonrise, but Stone's one large pebble makes the notes collide, so they match four touches.",
    failedAttempt: "Stone taps every differently sized chime with the same pebble, producing harsh overlap and twisting the smallest chime.",
    resolution: "Stone steadies the small chime while Pip matches four tools, and their low-to-high pattern rings clearly through the open doors.",
    pages: [
      "Before moonrise, Hollow Oak's four root chimes made dull, uneven sounds. Pip listened to each one while Stone inspected their cords. Something needed careful tuning.",
      "Luna waited outside Hollow Oak's doors. \"Can you tune them before I open the doors?\" she asked. Pip nodded, and Stone picked up a large pebble.",
      "Stone tapped the largest chime with his pebble, then used it on the other three. Every chime answered with the same heavy strike. Pip covered his ears.",
      "CLANG! Four harsh notes crashed together inside Hollow Oak. The smallest chime twisted on its cord, and Stone quickly lowered the pebble. \"That did not work.\"",
      "Pip laid out an acorn, a leaf stem, a smooth stone, and his own fingertip. He tested each touch on a different chime. Stone listened closely.",
      "The large chime rang clearly beneath the smooth stone. The acorn, leaf stem, and fingertip brought clean notes from the others. Pip had found four matches.",
      "Stone used one enormous finger to steady the smallest chime without bending it. Pip gently straightened the twisted cord. Soon the little chime hung evenly again.",
      "Pip placed each matching object beneath its chime so they would remember the pattern. Stone checked every pair. Then they stood ready to play together.",
      "Stone began with the lowest root chime, and Pip answered on the next. Together, they followed the matching tools upward. Four separate notes rang in order.",
      "Dong, ding, ting, tink! Luna opened Hollow Oak's doors as four clear notes danced into the moonlit forest. This time, each note stayed separate and bright."
    ]
  })
});
