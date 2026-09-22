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
      "Under the stars, Chompy listens. Not one rumble."
    ]
  }),
  "dino-pals-02-sunnys-rainy-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-SUNNY", "DINO-GRUMPY", "DINO-DOZY", "DINO-WIGGLY"],
    storySpine: "Sunny wants her friends to enjoy the puddles, but her huge splash soaks them, so she repairs the game with small splashes.",
    failedAttempt: "Sunny's biggest jump sprays friends who did not choose to get wet.",
    resolution: "Sunny makes a small splash; Wiggly and Grumpy join, and she makes room for Dozy in the puddle.",
    pages: [
      "Rain fills the path with deep pools.",
      "Grumpy, Dozy, and Wiggly huddle under broad leaves.",
      "Sunny wants all her Pals to play.",
      "Her big jump soaks all three friends.",
      "Sunny sees three frowns. She stops.",
      "She taps one pool. Wiggly steps in.",
      "Grumpy steps in. \"Not bad.\"",
      "Dozy steps in too. Sunny makes room in the puddle."
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
    resolution: "Grumpy directs the Pals to push together, then swings his freed tail and thanks them.",
    pages: [
      "A heavy rock traps Grumpy's club tail.",
      "Grumpy wants to free it alone.",
      "Sunny offers help. Grumpy says, \"Not yet.\"",
      "Bouncy waits nearby. He does not touch the rock.",
      "Grumpy pulls. The rock sinks deeper.",
      "He stops and studies the rock's flat side.",
      "\"Push here together,\" says Grumpy. His tail springs free.",
      "Grumpy swings his free tail. \"Much better. Thank you.\""
    ]
  }),
  "dino-pals-05-bossy-makes-a-plan": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOSSY", "DINO-CHOMPY", "DINO-SUNNY", "DINO-WIGGLY", "DINO-DOZY"],
    storySpine: "Bossy wants lunch ready, but assigning unsuitable jobs creates a mess, so she asks the Pals to show what they can do.",
    failedAttempt: "Chompy eats his berry pile, Wiggly scatters the leaves and Dozy falls asleep over his assigned job.",
    resolution: "Sunny spreads leaves, Wiggly brings a basket and Chompy fetches fruit; Bossy records those jobs while Chompy waits for everyone.",
    pages: [
      "Bossy wants lunch set out by noon.",
      "Her list has one job for each Pal.",
      "Chompy picks berries, then eats the pile.",
      "Wiggly hauls leaves. His tail sends them wide.",
      "Dozy guards the bags, then falls fast asleep.",
      "Bossy stops reading. \"Show me your best jobs,\" she says.",
      "Sunny spreads leaves. Wiggly brings a basket. Chompy fetches fruit.",
      "Bossy marks three new jobs. Chompy waits for everyone."
    ]
  }),
  "dino-pals-06-bouncy-bumps-into-everything": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOUNCY", "DINO-FANCY", "DINO-WIGGLY", "DINO-SNEEZY", "DINO-BOSSY"],
    storySpine: "Bouncy wants a morning bounce, but watching only his landing causes collisions, so he plans a clear route to the meadow.",
    failedAttempt: "Bouncy helps after each collision but keeps bouncing into crowded places until a sneeze scatters the picnic.",
    resolution: "Bouncy clears up the picnic, checks the path and takes his next big bounce in an empty field.",
    pages: [
      "Bouncy hits the cave wall on his first bounce.",
      "By the falls, he bumps Fancy's plates.",
      "Bouncy checks Fancy. He helps brush off her plates.",
      "He bumps Wiggly's basket. Both gather the fruit.",
      "Bouncy lands by Sneezy's nose. It starts to shake.",
      "WHOOSH! Leaves, fruit, and Bossy's list fly high.",
      "Bouncy picks up the mess. He checks the path.",
      "In the empty field, Bouncy takes one enormous bounce."
    ]
  }),
  "dino-pals-07-wigglys-messy-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-WIGGLY", "DINO-CHOMPY", "DINO-GRUMPY", "DINO-FANCY", "DINO-DOZY"],
    storySpine: "Wiggly wants his long tail to stop making messes, but freezing still fails, so he marks the space his tail needs.",
    failedAttempt: "Wiggly sits perfectly still, yet his tail rolls berries and a leaf away.",
    resolution: "Wiggly apologizes to Fancy; Dozy marks a wide space, and Wiggly keeps his slow swishes inside it.",
    pages: [
      "Wiggly plans to watch his long tail today.",
      "His tail tips Chompy's breakfast. They clean it.",
      "It bumps Grumpy's favorite rock. Grumpy drags it back.",
      "One fast swish splashes Fancy. She stomps away.",
      "Wiggly freezes. His tail still rolls three berries.",
      "Wiggly calls, \"Sorry, Fancy! My tail needs more room.\"",
      "Fancy keeps clear. Dozy marks a wide spot for Wiggly.",
      "Bright stones mark his space. Wiggly swishes slowly inside."
    ]
  }),
  "dino-pals-08-zippy-slows-down": fictionRewrite({
    level: "B",
    canonIds: ["DINO-ZIPPY", "DINO-SUNNY"],
    storySpine: "Zippy races along a supposed shortcut home but gets lost, so he recognizes familiar flowers and retraces the route slowly.",
    failedAttempt: "Racing past landmarks leaves Zippy unable to see Sunny Hollow.",
    resolution: "Zippy recognizes the blue flowers, reaches the bent tree and leads Sunny home past the waterfall.",
    pages: [
      "Zippy knows a shortcut home. Off he goes!",
      "Sunny calls, \"Which way?\" Zippy races on.",
      "He speeds past the waterfall and meadow.",
      "Zippy stops. Sunny Hollow is nowhere nearby.",
      "Zippy spots three blue flowers. \"I passed those!\"",
      "He walks toward the bent tree, one slow step at a time.",
      "Sunny meets him beside the bent tree.",
      "Sunny follows. Zippy leads her home past the waterfall."
    ]
  }),
  "dino-pals-09-honkys-inside-voice": fictionRewrite({
    level: "B",
    canonIds: ["DINO-HONKY", "DINO-GRUMPY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-DOZY"],
    storySpine: "Honky wants the Pals at breakfast, but loud calls scatter leaves over the food; a storm forces breakfast inside, where he finally serves it quietly.",
    failedAttempt: "After one quiet greeting Honky cheers too loudly and showers breakfast with leaves again.",
    resolution: "Honky calls the Pals through the rain, rescues the fruit and whispers as he sets breakfast down inside the cave.",
    pages: [
      "Honky calls the Pals to breakfast. Leaves tumble onto the fruit.",
      "Grumpy brushes them off. \"Not so loud!\"",
      "Bossy whispers. \"Try it like this.\"",
      "Honky calls softly. Chompy sits beside the bowls.",
      "Honky cheers. Another shower of leaves lands on breakfast.",
      "Thunder booms. Dozy bolts inside. Rain splashes over the food.",
      "Honky calls across the rain. \"Breakfast in the cave!\"",
      "Honky sets the rescued fruit down. \"Breakfast,\" he whispers."
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
      "He ties a leaf hat above Wiggly's path.",
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
    resolution: "Sunny asks about the grass bracelet without approaching; Shy sits down and answers, and the Pals return the gesture with gifts.",
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
      "Sunny stays by the fern. \"Is this one for me?\"",
      "Shy sits across the rock. \"I made it for you.\"",
      "Next morning, a gift from every Pal waits for Shy."
    ]
  }),
  "dino-pals-12-fancys-bad-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-FANCY", "DINO-CLUMSY", "DINO-CHOMPY", "DINO-BOUNCY", "DINO-DOZY", "DINO-HONKY", "DINO-WIGGLY"],
    storySpine: "Fancy wants her creased leaf fan flat again, but bouncing, a pillow and noise cannot fix it; Wiggly brings water and Fancy presses the softened leaves herself.",
    failedAttempt: "Fancy rejects sitting and bouncing; the pillow leaves the crease intact and Honky's shout only flaps the fan.",
    resolution: "Fancy wets the leaves and presses the fan with her own tail, then gives Wiggly a bracelet for helping.",
    pages: [
      "Fancy wakes. Her woven leaf fan has a sharp fold.",
      "She stays in and stares at the sharp fold.",
      "Clumsy peers down. The bend looks small.",
      "\"I can sit on it,\" says Chompy. \"No,\" says Fancy.",
      "Bouncy offers to bounce it flat. Fancy says, \"No.\"",
      "Dozy brings his soft pillow. The bend stays.",
      "Honky shouts. Fancy's leaf fan flaps wildly.",
      "Wiggly leads Fancy to warm water and a flat rock.",
      "He fills a bowl. Fancy wets the folded leaves.",
      "Fancy presses the damp fan with her tail. The fold flattens.",
      "The fan is flat again. Fancy dips it beside her smiling reflection.",
      "Fancy slips a bracelet onto Wiggly's tail. \"For you.\""
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
      "Bossy marks the map. \"We've looked everywhere!\"",
      "Clumsy lifts his head. \"I'll look from up here.\"",
      "Clumsy scans beyond the ferns and waterfall.",
      "He spots Chompy, mud, rocks, and one blue square.",
      "Dozy's pillow floats below the waterfall.",
      "Bouncy gulps. \"I knocked it down the stream.\"",
      "Clumsy sees it, but his neck falls short.",
      "Wiggly bends low and lifts the pillow.",
      "Dozy hugs the soggy pillow. His eyes close at once.",
      "Clumsy spots Wiggly's hat in the grass. \"I see it!\""
    ]
  }),
  "dino-pals-14-what-is-flappy": fictionRewrite({
    level: "B",
    canonIds: ["DINO-FLAPPY", "DINO-GRUMPY", "DINO-BOSSY", "DINO-SUNNY"],
    storySpine: "Flappy wants to reach a branch but cannot fly straight up; gripping the ground reveals climbing claws, and an insect draws Flappy into a short glide from the tree.",
    failedAttempt: "Hard flapping from the ground ends in mud or leaves Flappy standing in place.",
    resolution: "Flappy climbs to a nest and learns to glide down from a higher branch, then demonstrates that route to Grumpy.",
    pages: [
      "Flappy flaps toward a branch, then lands in mud.",
      "\"I have wings. Why can't I reach that branch?\"",
      "Bossy flies overhead. Flappy flaps just as hard, but stays down.",
      "Sunny studies the feathered wings. \"Try a jump,\" she says.",
      "Flappy gives one angry squawk. A feather drifts down.",
      "Flappy stamps. Small claws dig into the soft ground.",
      "Those claws grip bark too. Flappy climbs and makes a nest.",
      "An insect drifts past. Flappy spreads both wings and glides after it.",
      "\"I climb up,\" Flappy tells Grumpy, \"and glide down!\"",
      "Grumpy looks up. \"You built that nest.\"",
      "\"I am Flappy,\" says Flappy. \"Watch this.\"",
      "From the branch above, Flappy glides down into the nest."
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
    storySpine: "Bossy wants one Games winner, but different Pals excel at different events, so she changes the plan to one winner per game.",
    failedAttempt: "The race, jump, loud call and neat row each produce a different winner for a board with only one space.",
    resolution: "Bossy gives each game a winner and fills the board; Fancy uses the scattered fruit in her winning pattern.",
    pages: [
      "Bossy plans the Games. She wants one winner.",
      "She leaves one blank space on her board.",
      "Zippy wins the race. Bossy starts to write.",
      "Bouncy jumps farthest, then picks up his fallen flags.",
      "Honky's blast shakes the trees. A third winner?",
      "Wiggly tries tidying. Whoosh! His tail scatters the fruit.",
      "Shy gathers pebbles into one neat row. Another winner!",
      "Bossy changes her plan. Each game gets its own winner.",
      "Dozy gets a bow for the longest yawn.",
      "Fancy sorts the scattered fruit into patterns. Another bow!",
      "Sneezy blows a leaf past every flag. One more bow!",
      "Bossy adds the last bow. Her board is full of different winners."
    ]
  }),
  "dino-pals-18-dozys-wonderful-dream": fictionRewrite({
    level: "B",
    canonIds: ["DINO-DOZY", "DINO-BOSSY", "DINO-SUNNY", "DINO-CHOMPY", "DINO-GRUMPY", "DINO-BOUNCY"],
    storySpine: "Dozy dreams of a soft bed, but unsupported clouds blow away, sag or bounce, so he spreads a thin cloud on solid rock beside Sunny.",
    failedAttempt: "The clouds float too high, break, sag or throw their occupants off.",
    resolution: "A cloud resting on rock gives Dozy and Sunny a steady bed; he wakes and asks his friends to stay beside his real pillow.",
    pages: [
      "Dozy sleeps for hours in Long Meadow.",
      "Bossy and Sunny wait near him.",
      "Dozy dreams of finding a soft place to sleep.",
      "His first cloud bed blows high above the ground.",
      "Chompy bites a cloud. A great hole opens in it.",
      "Grumpy's cloud sags. His bottom nearly touches the ground.",
      "Bouncy lands on another cloud. BOING! It throws him off.",
      "Dozy follows a golden stream down toward a rocky peak.",
      "His friends stand on the peak. The rock does not wobble.",
      "Dozy spreads a thin cloud on the rock. Sunny curls up beside him.",
      "Dozy wakes beside his friends. \"Stay here,\" he murmurs.",
      "His friends settle around his pillow. Dozy closes his eyes again."
    ]
  }),
  "dino-pals-19-zippys-race": fictionRewrite({
    level: "B",
    canonIds: ["DINO-ZIPPY", "DINO-SUNNY", "DINO-WIGGLY", "DINO-HONKY"],
    storySpine: "Zippy wants to feel ready for a real race, but endless practice laps deepen his worry, so he runs the marked course and meets his rival.",
    failedAttempt: "Five extra circuits do not make Zippy feel ready; they leave his legs tired before race day.",
    resolution: "Zippy narrowly wins despite tired legs; the next morning he stops after one easy lap beside Sunny.",
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
      "Next morning, Zippy runs one easy lap. Then he stops beside Sunny."
    ]
  }),
  "dino-pals-20-the-big-storm": fictionRewrite({
    level: "B",
    canonIds: ["DINO-GRUMPY", "DINO-BOSSY", "DINO-CLUMSY", "DINO-SNEEZY", "DINO-HONKY", "DINO-WIGGLY", "DINO-ZIPPY", "DINO-BOUNCY", "DINO-SHY", "DINO-DOZY", "DINO-SUNNY"],
    storySpine: "The Pals want everyone safe before a storm, but Bossy's long plan gives everyone too many jobs, so each Pal contributes one observable strength.",
    failedAttempt: "Bossy's long list leaves her unsure who has the rugs; she stops and gives each Pal one job.",
    resolution: "Bossy gives one job each; the Pals prepare Cozy Cave, stay dry, and clear the paths after the storm.",
    pages: [
      "The air hangs still in Sunny Hollow.",
      "\"Storm coming,\" says Grumpy. \"A big one.\"",
      "Bossy's list trails to the ground. \"Wait. Who has the rugs?\"",
      "\"One job each,\" says Bossy. Clumsy watches the clouds.",
      "\"Rain soon!\" Sneezy warns.",
      "Honky calls the scattered Pals back to the rock.",
      "Wiggly clears the rock with one long sweep.",
      "Zippy stacks the supplies by the cave. \"That's the lot!\"",
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
    resolution: "After climbing and crossing the marsh despite his fear, Pip pockets the dull stone and offers to lead Burrow home.",
    pages: [
      "Pip walked along the Moonwood path with his hands in his pockets. His boot struck a little stone. Gold light flickered beneath it, bright enough to stop him.",
      "Pip knelt between the old roots and lifted the glowing stone carefully. Golden light warmed his fingers, and he wondered what kind of stone it could be.",
      "Burrow popped out of a nearby tunnel and peered closely at Pip's new discovery. \"Old stories call that a Bravery Stone,\" the mole explained.",
      "Pip held the stone close and waited for a rush of courage. He still felt like himself, and the steep cliffs still seemed frightening.",
      "To test the stone, Pip visited the safe practice wall at Tumblerock Cliffs. He chose the lowest route, where a thick blue mat waited below.",
      "Pip's legs wobbled as he reached for the first hold. He breathed slowly, checked each grip, and climbed one careful step at a time.",
      "When Pip reached the top, his worried face opened into a grin. He climbed down safely, then carried the warm stone toward Fog Marsh.",
      "Thick fog covered the marked marsh path, and reeds rustled beside Pip. He felt afraid, but he watched the markers and kept walking forward.",
      "That evening, Pip rested quietly beside Crystal Stream and studied the little stone. Its last golden light grew dim, then disappeared in the sunset.",
      "Pip hurried to Burrow and opened his hands around the dull stone. \"Did it run out of brave?\" he asked, remembering the long, dark marsh.",
      "Burrow held the dull stone up to the light. \"Where did you keep it while you climbed?\" he asked. Pip looked down at the pocket on his belt.",
      "Pip turned the plain stone over once more. He slipped it into his pocket. \"Come on, Burrow,\" he said. \"I'll show you the way back.\""
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
      "Luna stepped through the cleared doorway and shook a leaf from her feathers. Fern knelt beside the roots. \"One song was enough,\" she murmured, watering the earth.",
      "Pip asked how Fern stopped the plant, so she sang the missing final notes. The quiet leaves rustled the whole finished song back to them."
    ]
  }),
  "moonwood-tales-c-03": fictionRewrite({
    level: "C",
    canonIds: ["MOON-STONE", "MOON-PIP", "MOON-BURROW"],
    storySpine: "Stone wants to avoid the swaying rope bridge, but Burrow becomes stranded, so Stone crosses by focusing on one fixed rope at a time.",
    failedAttempt: "Stone places one foot on the bridge, feels it sway, and steps back before Burrow needs help.",
    resolution: "Stone carries Burrow back in one arm while gripping the rope with his free hand, then sets him down on the near bank.",
    pages: [
      "The Moonwood friends crossed the rope bridge over Crystal Stream, but Stone stayed behind. From the bank, the wooden boards looked narrow beneath his huge feet.",
      "Stone watched the wooden bridge sway over the bright, rushing water. \"What if something is waiting underneath?\" he asked, hugging his broad arms close.",
      "Pip quickly returned to Stone and pulled hard on each thick rope. \"The ropes are strong,\" he said, but Stone's worry did not disappear.",
      "Stone placed one foot on the first board, and the whole bridge moved. His heart jumped, so he quickly stepped back onto solid ground.",
      "Across the stream, Burrow called for help from the far bank. The swaying bridge frightened him, and he did not want to cross alone.",
      "Stone watched Burrow wait beside the rushing water on the far bank. Burrow needed help, yet every bridge board still seemed small and shaky.",
      "Stone gripped the thick fixed side rope with both broad hands. Keeping his eyes on that steady rope, he stepped onto the bridge again.",
      "At the middle, the boards swayed and the stream flashed below Stone. He watched Pip's clear hand signal instead and took another careful step.",
      "Stone reached Burrow and bent close to the grass. \"Up you come.\" He lifted the little mole against his chest, leaving one hand free for the rope.",
      "On the way back, Stone held Burrow in one arm and gripped the rope with his free hand. Pip walked just ahead. Board by board, the far bank drew closer.",
      "Stone set Burrow on the grass and let go of the rope. Burrow straightened his glasses. Behind them, the empty bridge still swayed over Crystal Stream.",
      "Stone still wanted to know what waited under the swaying bridge. From the safe shore, he bent down to look, but only water answered him."
    ]
  }),
  "moonwood-tales-c-04": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-SPARK", "MOON-PIP", "MOON-FERN", "MOON-LOCAL-C04-FOX"],
    storySpine: "Glimmer wants to breathe fire, but practice produces only smoke and cinnamon warmth; the smell attracts a fox to Fern's seed pouch, and Glimmer retrieves it with a breath that makes the fox sneeze.",
    failedAttempt: "Harder breaths create smoke and a sore throat, while the cinnamon smell draws a hungry fox into the practice area.",
    resolution: "The fox drops the pouch when it sneezes in Glimmer's cinnamon breath; Glimmer returns every seed and chooses to stop practice for the day.",
    pages: [
      "Glimmer stood in the bare practice patch between two piles of leaves. Fern had left her seed pouch nearby. \"One flame,\" Glimmer muttered, moving the leaves farther away.",
      "Glimmer planted their feet and puffed out a breath. A round cloud of gray smoke rolled over the bare ground. They peered through it, hunting for one orange flicker.",
      "On the second try, one bright spark landed on a broad green leaf. It glowed for a moment, then faded before Glimmer could cheer.",
      "Spark stood outside the bare patch and called, \"Harder!\" Glimmer blew until thick smoke rolled between the trees. Both friends coughed and waved the smoke away.",
      "After the smoke cleared, Glimmer tried a slower breath. Warm air curled past Pip, carrying a sweet cinnamon smell. Something rustled in the ferns beyond the practice patch.",
      "\"That smells like buns,\" Pip said, sniffing the warm air. Glimmer scowled at the empty space before their nose. \"Buns are not fire,\" they said, and tried again.",
      "Beside Crystal Stream, Glimmer made ten careful tries while Pip counted the stones. Each breath brought smoke, cinnamon warmth, or a spark that faded.",
      "After the tenth try, Glimmer's throat felt sore from forcing every breath. They closed their mouth, drank cool water, and stopped practicing to rest.",
      "Following the cinnamon smell, a fox nosed into Fern's seed pouch. It snatched the pouch and bolted. Glimmer sprang after it, calling to Pip behind them.",
      "Glimmer caught up on the open path. \"Those are seeds, not buns!\" they called. The fox looked back but kept the pouch clamped in its teeth.",
      "Glimmer blew across the fox's nose. Cinnamon warmth curled around it, but there was nothing to eat. The fox sneezed, dropped the pouch and fled into the ferns.",
      "Fern counted every seed back into her pouch. Glimmer sat beside the empty practice patch and yawned. \"No more today,\" they said, and Pip sat down beside them."
    ]
  }),
  "moonwood-tales-c-05": fictionRewrite({
    level: "C",
    canonIds: ["MOON-WREN", "MOON-LUNA", "MOON-PIP"],
    storySpine: "Wren wants to become taller with a spell, but reading its mirrored script backwards shrinks her, so she decodes the direction mark and restores herself.",
    failedAttempt: "Wren starts the spell at the wrong end and shrinks; the curling page then prevents her from reaching the final word of the reversal.",
    resolution: "Wren identifies the correct reading direction, asks Luna to hold the page down and completes the reversal before choosing a book about a step stool.",
    pages: [
      "While studying in her tree-room, Wren found a height spell written in shining blue ink. The words looked backward, as if they belonged inside a mirror.",
      "Wren rushed to try the spell before checking both ends of the line. She began at the wrong moon mark, and blue light filled the room.",
      "When the light cleared, Wren saw her tiny reflection far below the mirror. The spell had made her only one inch tall instead of taller.",
      "The desk now rose above Wren like a wooden cliff. She called for help, but her tiny voice could not carry beyond the enormous books.",
      "Wren climbed onto the open spell book and studied the shining marks again. A small arrow beside the words pointed in the opposite direction.",
      "Wren followed the arrow from the silver moon. Halfway across, the page curled beneath her feet. She slid back toward the spine before she could read the last word.",
      "Luna entered the room and heard a faint voice coming from the desk. She looked down and found tiny Wren standing between the blue words.",
      "Luna pressed one wing across the curling page. Wren scrambled to the final word and shouted it. This time, she reached the end of the spell.",
      "Blue light circled Wren again and lifted her from the page. When it faded, she was back to her usual height beside a relieved Luna.",
      "Wren checked the book once more and found an unused height charm below the mirrored line. This time, she read every mark before touching anything.",
      "Pip arrived and asked whether Wren would try the real height charm next. Wren looked at the crowded desk, then firmly closed the spell book.",
      "Wren put the spell away and opened a book about building a step stool. \"Four legs,\" she read. \"At least those stay the same size.\""
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
    storySpine: "Dewdrop wants to know whether a boasting newcomer's tunnel story is true; Burrow's dry passage contradicts it, so she asks for something the fish has really seen.",
    failedAttempt: "The visitor claims to have swum through a dry tunnel and met blue moles, which Burrow's account contradicts.",
    resolution: "The fish admits boasting and shows Dewdrop a real cold spring; it introduces itself as Ripple when Pip arrives.",
    pages: [
      "Dewdrop visited Crystal Stream each morning and listened to its fish. She knew every silver fin, favorite hiding place, and piece of ordinary stream news.",
      "One morning, a fish Dewdrop had never met swam into the clear pool. Its silver body carried a single bright blue stripe along one side.",
      "\"I'm the oldest fish in Moonwood,\" announced the stranger, flicking its blue-striped tail. Dewdrop settled beside the pool. She had never heard an old fish introduce itself quite like that.",
      "\"I swam right under Hollow Oak,\" the fish boasted. \"Its deepest tunnel has a sandy floor.\" Dewdrop knew Burrow lived there; she decided to ask him.",
      "\"What did the moles look like?\" Dewdrop asked. \"Blue, with long tails,\" said the fish. Dewdrop stopped trailing her fingers through the water and looked at the visitor.",
      "Burrow spread his tunnel map across the table. \"Water never reaches that passage,\" he said. \"I'm the only mole under Hollow Oak.\" Dewdrop looked from her brown friend to the map.",
      "Dewdrop returned to the stream. \"Burrow's tunnels are dry,\" she said. \"A fish couldn't swim through them.\" She waited for an answer, but the visitor said nothing.",
      "The striped fish swam one slow circle and looked down at the pebbles. \"I wanted to sound important,\" it admitted in a small voice.",
      "Dewdrop waited beside the root. \"Tell me something you've really seen.\" The fish turned toward a string of bubbles. \"I found those this morning,\" it said.",
      "The fish swam beneath the root, and Dewdrop followed along the bank. Cold water bubbled up between the pebbles. It was a spring she had never noticed.",
      "Dewdrop touched the spring water and drew back her fingers. \"Cold!\" The fish circled the bubbling stones. \"I found it with my nose,\" it said.",
      "Pip leaned over the root and asked his new friend's name. \"Ripple,\" said the fish. \"Want to see what I found under here?\" Dewdrop moved closer to look."
    ]
  }),
  "moonwood-tales-c-08": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-STONE"],
    storySpine: "Burrow wants to open and understand an old root-carved door, but pulling and Luna's fading memory fail, so Luna traces its glowing line to a hidden latch.",
    failedAttempt: "Pulling the iron ring fails, and Luna can remember the door but not its opening rule.",
    resolution: "Burrow presses a digging claw into the notch to release the latch, discovers the Memory Room and adds a glowing chalk drawing of today's tree.",
    pages: [
      "While digging beneath Hollow Oak, Burrow's spade struck something that was not stone. He brushed away the dirt and found a wide piece of ancient wood.",
      "Burrow dug carefully around the wooden edge instead of striking it again. Soon, a small hidden underground door appeared between Hollow Oak's thick roots.",
      "A deep carving covered the old door from top to bottom. It showed one great tree with long roots reaching north, south, east, and west.",
      "Burrow gathered his friends around Hollow Oak's table and showed them a sketch of the hidden door. Together, they planned how to inspect it safely.",
      "Everyone squeezed through the narrow tunnel until they reached the door. Stone turned sideways, and Luna folded her wings close. Together they pulled the iron ring, but it did not move.",
      "Luna studied the carved tree and knew she had seen it long ago. She remembered the door, but its opening rule had slipped from her memory.",
      "Luna traced a carved root with her wingtip. Gold light followed her touch, then stopped at a deep notch. \"Something goes in here,\" she said, stepping aside.",
      "Burrow examined the notch Luna had found. It was just wide enough for one digging claw. He pressed his claw inside, and a wooden latch clicked behind the door.",
      "The wide old door swung inward, filling the tunnel with warm golden light. Beyond it, glowing pictures showed Moonwood's creatures, streams, and vanished paths.",
      "The friends stepped inside and slowly followed the shining pictures around the curved walls. Each picture showed a small piece of Moonwood's living past.",
      "As Luna studied the oldest glowing tree picture, the forgotten name suddenly returned to her. \"This is the Memory Room,\" she told everyone quietly.",
      "Burrow noticed a clear space waiting among the old pictures. He took a piece of chalk and carefully drew Hollow Oak as it looked that day.",
      "Burrow stepped back from his chalk tree. A gold line crept up its trunk and spread along each branch. Beside the old pictures, the tree he knew began to shine."
    ]
  }),
  "moonwood-tales-c-09": fictionRewrite({
    level: "C",
    canonIds: ["MOON-SPARK", "MOON-WREN", "MOON-FERN", "MOON-DEWDROP"],
    storySpine: "Spark's sneezes spill wand magic onto breakfast, flowers and fish; trying to hold a sneeze back worsens it, so he puts the wand away and helps prepare and apply Wren's leaf wash.",
    failedAttempt: "Warning others and holding a sneeze in do not stop the wand magic; rubbing a blue flower cannot remove the spell.",
    resolution: "Spark fetches the leaves and carries the finished wash, then rinses the flowers while Wren treats the stream; his final cloth-covered sneeze with no wand changes nothing.",
    pages: [
      "Spark woke with a cold and a tickle deep inside his nose. Because loose wand magic followed every sneeze, golden sparks already danced around him.",
      "At breakfast, Spark felt the first sneeze arrive too quickly to warn anyone. Magic struck his porridge, which flapped from the bowl like a frightened bird.",
      "Wren caught the flying bowl. \"There's a leaf wash for stray sneeze spells,\" she said. Spark sniffed and reached for his wand again with his free hand.",
      "In Whispering Meadow, Spark raised one hand to give the warning. The sneeze arrived anyway, and a golden ring turned every nearby flower blue.",
      "Spark knelt beside a blue flower and rubbed its petals. The blue stayed. \"That was yellow,\" he said, just as another tickle climbed up his nose.",
      "Spark squeezed his nose and tried to hold the sneeze inside. Gold magic gathered around his watering eyes, growing brighter with every silent second.",
      "Fern saw the dangerous glow and pointed Spark away from Crystal Stream. She brought a soft cloth, but the trapped sneeze was already too powerful.",
      "The sneeze burst free just as Spark turned beside the water. A wide wave of gold magic raced across the stream before anyone could stop it.",
      "Every fish turned purple, and the flowing stream began to sing in a strange key. One surprised fish even became a green frog for a moment.",
      "Spark laid his wand on the bank and knelt beside Dewdrop. \"They're supposed to be silver,\" she said. Spark swallowed and kept both hands away from his wand.",
      "Dewdrop called the fish into a quiet pool. \"Stay here,\" she told them. Spark watched the purple fins gather, then ran to find Wren and her leaf wash.",
      "Spark fetched leaves while Wren measured the water for her wash. He carried the finished bowl carefully between both hands. His wand could wait by the stream.",
      "Wren dripped the wash into the stream. Spark carried another bowlful to the blue flowers and rinsed their petals. Silver fish flashed through the clear water again.",
      "Spark's nose tickled again. He buried it in Fern's cloth and sneezed. Across the bank, the flowers stayed pink and yellow; below them, silver fish kept swimming."
    ]
  }),
  "moonwood-tales-c-10": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-BURROW", "MOON-DEWDROP", "MOON-WREN"],
    storySpine: "Luna remembers that first-tree seeds must be planted today, but the storm has moved the marker for their storage box.",
    failedAttempt: "The group checks Luna's usual garden and tunnel stores, but neither holds the missing seed box.",
    resolution: "Dewdrop retrieves the cold box; Luna opens it at Hollow Oak, distributes the twelve intact seeds and plants them with her friends before sunset.",
    pages: [
      "Luna remembered an urgent job: twelve first-tree seeds had to be planted before sunset. She could not find their silver box anywhere.",
      "She had stored the box outside beside cold water. A storm had moved the little stone that once marked its hiding place.",
      "Pip asked Luna to remember one more helpful detail. She pictured bright pebbles shifting beneath very cold water. One pebble was striped silver.",
      "Fern checked the shaded garden while Burrow checked the cool tunnels. Neither place held the silver box. Luna crossed both places off her list.",
      "The friends searched the nearby paths and Whispering Meadow. They found several bright stones, but no flowing water beside them anywhere nearby.",
      "Dewdrop named Crystal Stream. Luna remembered hiding the box where its current kept the old seeds cool. The silver pebble marked one broad step.",
      "Luna flew ahead to the stream's broad stepping stones and landed on the largest one. She studied the bright pebbles moving beneath the clear water.",
      "Between the pebbles, a silver box waited exactly where Luna had once hidden it. Dewdrop lifted the box from the current and passed it to her.",
      "Luna held the cold box against her feathers. Water dripped from its corners. She carried it back to Hollow Oak before opening the little silver latch.",
      "Fern leaned closer as Luna lifted the lid. Twelve round seeds shone inside the box, bright as candle flames. Luna counted them once; none had cracked in the cold water.",
      "Luna looked up through Hollow Oak's old branches. She had saved the seeds to grow young trees beside them. Now twelve small lights waited in her open box.",
      "Luna set the open box on the ground outside Hollow Oak. She gave each helper a seed and pointed to a bare patch beneath the old branches.",
      "Before sunset, the friends planted all twelve seeds in a wide ring around Hollow Oak. They covered each hole gently and watered the dark soil.",
      "Luna settled beside the last small mound. Above her, the old leaves rustled; below, twelve seeds rested in damp soil. She listened until the light left the clearing."
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
      "As Pip and Stone followed the sound, tall reeds shook beside the path. Stone stopped. Something rustled behind the reeds, and the next call was close.",
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
      "Fern and Dewdrop followed the narrowing stream toward its oldest source. With every bend, the water grew shallower. Fern could see dry pebbles along both banks.",
      "Farther upstream, old roots stretched across the banks and under the water. The friends followed the thin trickle between them. Soon even its splashing over the roots grew faint.",
      "At the source, a fallen boulder rested in thick mud across the stream. Beneath it, the smooth singing stones were trapped without moving water.",
      "Dewdrop sent her strongest rush of water against the boulder's round side. Water splashed everywhere, but the heavy stone remained locked in the mud.",
      "Fern braced both feet and pushed the boulder with her hands. The pressure only sank it deeper, allowing the wet mud to grip even tighter.",
      "Fern looped a strong green vine around the boulder and pulled from the bank. At the same time, Dewdrop sent a steady current underneath it.",
      "The water loosened the thick mud while Fern's vine pulled the boulder forward. With one heavy roll, the stone moved safely onto the bank.",
      "Freed from the boulder, the current rushed over every smooth singing stone. One clear note rang out, then the whole stream joined the bright song.",
      "Fern and Dewdrop rested beside the flowing water and listened to the music they had restored together. The stream carried their laughter down through Moonwood.",
      "Pip heard the stream from Hollow Oak and ran to the door. Fern and Dewdrop were still climbing the path. \"Your song got here before you!\" he called."
    ]
  }),
  "moonwood-tales-c-13": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-SPARK"],
    storySpine: "Spark and Glimmer trade lessons, but crowded instructions fail; Glimmer suggests lifting one boot, and Spark notices the steady breath in Glimmer's glide.",
    failedAttempt: "Extra diagrams and copied poses produce smoke and a floating hat instead of the intended skills.",
    resolution: "Spark's spell supports one relaxed leg, and Glimmer repeats an even warm breath without a chart; they share a cinnamon-smell joke.",
    pages: [
      "Spark offered to help Glimmer make a steady warm breath. In return, Glimmer would help test his floating spell. They shook hands and spread their lesson plans on the grass.",
      "Spark began by covering three boards with arrows, numbers, and tiny flames. He explained each mark carefully, but Glimmer's eyes grew wider as the lesson grew harder.",
      "Glimmer followed every arrow and took a careful breath. A soft gray cloud puffed from their nose, so Spark frowned at his notes and wrote 'more smoke.'",
      "That afternoon, Glimmer showed how their wings caught the air. They spread them wide, hovered for a moment, and landed softly. 'Now you try,' they told Spark.",
      "Spark copied Glimmer's pose and waved his arms with great care. Golden sparkles lifted his hat, but both boots stayed firmly on the ground. 'Almost,' Spark said.",
      "On the third day, Spark brought even more charts about heat, breathing, and dragon bodies. Glimmer tried every new instruction, yet smoke still curled out and Spark still could not float.",
      "Glimmer nudged the charts aside. \"Can your spell lift just a boot?\" they asked. Spark looked down at his feet and slowly raised one knee.",
      "Spark cast his spell under the raised boot, then let his leg go loose. The boot stayed up. A thin curl of gold held it above the grass.",
      "Spark sat down beside Glimmer. \"When you glide, your breath goes out slowly,\" he said. \"Show me again.\" Glimmer spread their wings and backed toward the edge of the clearing.",
      "Glimmer ran three steps, opened their wings and glided past Spark. This time, Spark watched their breathing. The long, even breath continued after their feet touched the grass.",
      "Spark cupped his hands near Glimmer's nose. \"That breath,\" he said. \"Just like the glide.\" Glimmer breathed out slowly, and cinnamon warmth filled the space between Spark's palms.",
      "Glimmer sniffed Spark's warm fingers. \"Now you smell like cinnamon too.\" Spark laughed and held out his hands again. This time, Glimmer needed no chart."
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
      "Flint folded the map beside his lunch. The final mushroom's light slowly faded. Wren touched its cap with one finger. \"Thanks for waiting for us,\" she whispered."
    ]
  }),
  "moonwood-tales-c-15": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-LUNA"],
    storySpine: "Burrow wants to read the hidden gallery's story, but the unordered carvings confuse him; comparing the trees' sizes reveals how Hollow Oak grew around an old rabbit doorway.",
    failedAttempt: "Reading the pictures in either direction without following the tree's growth gives Burrow no beginning.",
    resolution: "Burrow follows the rabbit, buried acorn and growing tree to recognize Hollow Oak's first doorway, then compares it with his own new tunnel.",
    pages: [
      "Behind the known Memory Room, Burrow found a narrow tunnel. An old stone wall blocked it, marked with one deeply carved root.",
      "A loose stone opened into a hidden gallery beyond the wall. Burrow brushed dirt from his waistcoat and slowly lifted his little brass lantern.",
      "Carved animals, trees, and stars covered every wall. Far above Burrow, tiny stones glowed across the ceiling like a sky hidden deep beneath Moonwood.",
      "Burrow followed the carved trees around the wall. Some were tiny shoots; others spread tall branches. He tried both directions, but could not find where Hollow Oak's story began.",
      "He hurried to find Luna, who knew the Memory Room well. She folded her broad wings and followed Burrow into the narrow new tunnel.",
      "Luna stopped beside the gallery door and looked along the carved roots. They curled under every picture. \"A tree doesn't begin at the top,\" she said, crouching beside Burrow.",
      "Luna brushed one raised carving with her wing. Gold light outlined a deer beneath a tall tree. Burrow noticed a smaller rabbit beside a much younger tree.",
      "Burrow pointed to the rabbit beside the smallest tree. \"Does this part come first?\" he asked. Luna settled beside him and began to read the pictures.",
      "Luna pointed to a carved rabbit beside a fallen acorn. \"The first oak seed rolled into this rabbit's doorway.\" Burrow leaned closer. \"I see what happened next.\"",
      "The next carving showed rain falling over the tunnel. The rabbit had pushed the acorn aside and covered it with earth. A tiny green shoot rose from that spot.",
      "Burrow followed the glowing line to a huge tree around a little round doorway. \"That is Hollow Oak,\" he said. \"It grew around the rabbit's front door.\" Luna nodded.",
      "Burrow looked from the old carving to the tunnel he had dug. He brushed earth from his paws. \"I hope my doorway lasts that long,\" he said."
    ]
  }),
  "moonwood-tales-c-16": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-GLIMMER", "MOON-STONE", "MOON-BURROW"],
    storySpine: "Pip and Glimmer want to identify who moves clearing objects at night, but their first watch nearly ends in sleep, so a second sound exposes Burrow.",
    failedAttempt: "Hours of silent watching make Glimmer doze and reveal nothing before the shuffling finally begins.",
    resolution: "Pip gathers the boots and moves the biscuit bowl while Glimmer watches; awake Burrow rights the bench, returns the boots and empties his crumb-filled pockets.",
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
      "Burrow leaned against the mushroom and began to snore. Pip gathered the boots beside him. Glimmer kept watch while Pip moved the biscuit bowl out of reach.",
      "At sunrise, Burrow found crumbs in his pockets and Pip's boots beside him. Pip showed him the muddy footprints. Burrow stared at the overturned bench. \"Was that me?\"",
      "Burrow set the bench upright and returned Pip's boots. He shook crumbs from his pockets, then checked another boot beside the door. \"No biscuits in this one, either.\""
    ]
  }),
  "moonwood-tales-c-17": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-WREN", "MOON-BURROW"],
    storySpine: "Wren wants to help Fern's garden grow, but she ignores the potion's warning color and makes every plant walk, so both follow the reversal recipe.",
    failedAttempt: "Wren pours a purple motion potion after Fern questions it, sending every plant walking out of its bed.",
    resolution: "Fern calls the plants with their root-song while Wren applies stream water, then Wren separates the recipes, agrees to show Fern before pouring, and cleans up the spills.",
    pages: [
      "Wren arrived at Fern's garden carrying a small cauldron filled with bubbling potion. She said it would help every plant grow, while Fern studied the purple liquid.",
      "'Did you check the whole recipe?' Fern asked. Wren hugged the book to her robe and answered, 'Mostly.' That answer did not make Fern feel better.",
      "Fern opened the recipe and pointed to a warning. The finished growing potion should be green, but the mixture inside Wren's cauldron shone bright purple.",
      "Wren decided to pour it anyway. One flower straightened, leaned toward the path, and tugged its roots out of the soil. Fern stared as it began walking.",
      "Within moments, every plant was marching around the garden on its roots. Some followed the path, while others circled Fern and Wren in a leafy parade.",
      "Wren opened her book and searched for an answer, but the wandering plants kept leaving. Fern hurried after them, calling each plant by its name.",
      "Several plants entered Hollow Oak, and the smallest one waddled toward Burrow's tunnel. Burrow jumped aside as its muddy roots tapped past his door.",
      "At last, Wren found the purple motion recipe. The cure required Fern's root-song first, followed by plain stream water sprinkled over every moving plant.",
      "Fern stood in the center of the clearing and sang the slow root-song. Each plant stopped marching, turned toward her voice, and waited for the next step.",
      "Wren hurried between the waiting plants and sprinkled them with stream water. One by one, they walked back toward the holes they had left in the garden.",
      "The smallest plant returned last and settled into its empty patch. Its roots curled beneath the soil, and Fern gently pressed the earth around them.",
      "Wren put the green and purple recipes in separate books. \"Next time, show me before you pour,\" said Fern. Wren nodded and wiped purple drops from the path."
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
      "Stone spread his broad fingers and studied both rocks carefully. One was buried deep, but the other had a dry upper edge and loose mud underneath.",
      "Stone spread his palm across the rock's dry top. Then he curled his fingers down into the water. His hand stayed there, although the stream felt cold.",
      "Stone pushed the loose rock with steady strength. Mud released with a wet sucking sound, the rock turned aside, and the fish darted into open water.",
      "The fish leaped in a shining arc and landed with an enormous splash. Water soaked Stone from head to feet, and Dewdrop waited for his reaction.",
      "Stone sat dripping beside Dewdrop while the fish circled them once. His shoulders relaxed when he saw it swimming strongly, with no rocks blocking its path.",
      "Beyond the shallows, the fish lifted its head above the stream. Stone gave one small nod and said, \"Good.\" Water dripped from the end of his nose."
    ]
  }),
  "moonwood-tales-c-19": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FLINT", "MOON-WREN", "MOON-SPARK", "MOON-STONE", "MOON-BURROW", "MOON-DEWDROP", "MOON-FERN"],
    storySpine: "Luna wants the missing glow seeds found before night, but hurried searches fail until a cracked box and gold dust lead to Fern's garden.",
    failedAttempt: "Every group searches the expected hiding places while search spells point only at their casters, finding no seeds.",
    resolution: "The trail reveals that storm water carried the escaped seeds into Fern's garden, where the group protects their growing shoots.",
    pages: [
      "Luna opened the glow-seed box and found it completely empty. A thin crack crossed one corner, with gold dust scattered beneath it.",
      "The paths near Hollow Oak needed the glow seeds for their evening light. Luna called the friends together. They had to find the seeds before nightfall.",
      "The friends divided into careful search groups. Pip followed the gold dust outside, where the storm had washed it into several faint trails.",
      "Pip followed a gold trail all the way to Fog Marsh. It ended in sticky mud, with no seeds. Flint marked the empty trail on his map.",
      "Wren and Spark tried search spells beside the empty box. Both arrows pointed at the wizards' dusty sleeves. \"Seed dust,\" said Wren, brushing it off with a sigh.",
      "Burrow searched below Hollow Oak and came back empty-handed. The tunnel floors were dry. If rain had carried the seeds away, they must still be aboveground.",
      "Dewdrop followed water running downhill from the oak. Fern listened beside the channel. From under the wet leaves in her garden came a faint, familiar hum.",
      "Fern lifted the wet leaves. Small gold-green shoots glowed underneath, and their new roots hummed together. She called for Luna, keeping her hands clear of the delicate stems.",
      "Dewdrop traced the rain channel back to the cracked box. Storm water had carried the escaped seeds straight into Fern's soft garden soil.",
      "The searchers returned from every path and gathered around the bright seedlings. Their worried faces changed to smiles when they saw the missing seeds were safely growing.",
      "Luna touched one shallow root and felt it tremble. \"We can mark the paths from here,\" she said. Fern showed everyone where to stand without crushing the new plants.",
      "That night, the friends placed small guards around each seedling. Their gold-green light marked every path near Hollow Oak, and no traveler had to walk in darkness."
    ]
  }),
  "moonwood-tales-c-20": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-LUNA", "MOON-STONE", "MOON-WREN", "MOON-FLINT", "MOON-SPARK"],
    storySpine: "The friends want fallen star fragments returned before dawn, but lifting them from the clearing fails, so they carry them to Tumblerock Cliffs.",
    failedAttempt: "Pip raises one sky spark from the clearing, but it sinks back because the trees block its constellation.",
    resolution: "The group climbs to Moonwood's highest safe ledge and turns each fragment until its light answers the matching constellation.",
    pages: [
      "Near midnight, several small golden fragments fell from the sky into Moonwood. They landed softly among the mushrooms, leaving bright trails across the clearing.",
      "The silent fragments pulsed with warm light and rolled between the mushrooms. Pip, Luna, and the others hurried outside to examine what had fallen.",
      "Pip caught one fragment before it rolled into a dark bush. A tiny star pattern glowed across its smooth, warm golden surface.",
      "Every fragment brightened when Luna turned it toward the sky. High above the trees, the matching constellations answered with faint white flashes.",
      "Luna studied every pattern carefully. 'These are pieces of old shooting stars,' she explained. 'Their light belongs with those constellations before dawn.'",
      "Pip lifted one fragment above his head. The trees hid its constellation, so its glow faded and it settled back into his hands.",
      "'The fragments need a clear view from Tumblerock's highest safe ledge,' Luna said. Flint quickly unfolded a map and led the whole group.",
      "Everyone followed Flint up the rocky path before dawn. Stone carried two fragments while Wren and Spark kept the others wrapped safely.",
      "Above the trees, each fragment answered its constellation. Fine golden lines joined the little glowing patterns to the distant waiting stars overhead.",
      "At the highest ledge, Stone raised both broad hands. Pip and Spark turned each fragment while Luna watched the slowly paling sky.",
      "One by one, the fragments became narrow beams of light. Each golden beam rose into its matching place among the waiting stars.",
      "The final fragment answered with one bright flash, then joined its constellation just before dawn. Stone watched the complete pattern shine overhead."
    ]
  }),
  "moonwood-tales-c-21": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-WREN", "MOON-LUNA", "MOON-BURROW", "MOON-FERN", "MOON-LOCAL-C21-TWIG"],
    storySpine: "Pip wants to identify scratching inside Hollow Oak, but searching every known room fails, so Burrow follows the sound through a root door.",
    failedAttempt: "Pip, Wren, Burrow, and Fern search every ordinary room without finding the speaker inside the walls.",
    resolution: "Fern finds Twig's spectacles, Fern loosens the roots around her door, and Twig joins the others at their table before returning home.",
    pages: [
      "Late one evening inside Hollow Oak, Pip heard scratching behind the root wall. A tiny voice seemed to be searching for something, but he could not see anyone.",
      "Wren pressed one ear against the wall beside him. The scratching moved from root to root, followed by quiet muttering that neither friend could understand.",
      "Luna listened from her perch and said she had heard that scratching long ago. Still, she could not remember who lived behind that part of the oak.",
      "Pip, Wren, Burrow, and Fern searched every room they knew. They looked under tables and behind shelves, but found no doorway into the root wall.",
      "Burrow sniffed along the moss until his nose stopped at one thick patch. Fern brushed it aside and found a wooden door tangled in tight roots.",
      "Fern pressed one palm against the roots until they loosened. She pulled the door open, slipped inside, and called back. \"There is a whole room in here!\"",
      "The hidden room felt warm and cozy. Acorns, buttons, feathers, and other collected objects filled its shelves, while a small creature searched each pile.",
      "The creature introduced herself as Twig. She had searched for her spectacles for three days and asked Fern to check the crowded shelves.",
      "Fern looked around, then noticed the spectacles resting on Twig's head. 'They are above your ears,' she said gently. Twig reached up and laughed.",
      "Twig slipped the spectacles onto her nose and returned to sorting acorns. With the lenses in place, she could finally see which acorns belonged in each basket.",
      "Fern stepped back into Hollow Oak's main room with Twig beside her. \"We found the spectacles,\" she said. Pip hurried to make room at the little table.",
      "Twig shared a biscuit with her new neighbors around the table. Then she gathered the crumbs in her hand and went home. Her own little door clicked shut."
    ]
  }),
  "moonwood-tales-c-22": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-STONE", "MOON-DEWDROP", "MOON-WREN", "MOON-FLINT", "MOON-GLIMMER", "MOON-SPARK", "MOON-BURROW"],
    storySpine: "Wren wants to win the race with a speed spell, but it scatters the other runners instead; she marks their way home, and Dewdrop returns to guide them.",
    failedAttempt: "Wren's wide-circle spell speeds everyone around her except herself, sending Glimmer, Spark, Stone and Pip off balance.",
    resolution: "Wren lays leaf arrows instead of racing, Dewdrop follows them to bring the others home, and Wren cheers the winner despite her own empty hands.",
    pages: [
      "Luna marked a race from Hollow Oak to Crystal Stream, around Tumblerock Cliffs, and back. Wren stood at the starting line, clutching her spell book. She wanted to win.",
      "At Luna's signal, the racers shot away from Hollow Oak. Dewdrop skimmed beside the path, counting the markers. Wren ran with one finger tucked into her book.",
      "Flint hurried ahead and made two confident left turns. Instead of finding the stream, he reached the gray edge of Fog Marsh and finally checked his map.",
      "Wren cast a speed spell in a wide circle around herself. Everyone in the circle shot forward, except Wren in the middle. She stared after them.",
      "Glimmer bumped into Spark as the spell pushed them ahead. Spark's hat flew one way, golden sparkles flew another, and both racers tumbled onto the soft grass.",
      "Stone caught one foot on a thick root. He wobbled, stretched both arms, and slowly lowered himself until he sat on the path.",
      "Pip shot past a turn and slid into Crystal Stream with a splash. He climbed out dripping, found the next marker, and started walking before he could slip again.",
      "Wren shut her book and followed the scattered racers. At each confusing turn, she laid bright leaves pointing toward home. She had stopped thinking about winning.",
      "Dewdrop crossed the finish line first and smiled at Luna. Then she noticed the empty path behind her. 'Wait,' she asked, 'where is everyone else?'",
      "Dewdrop followed Wren's leaf arrows back along the path. She found Flint, Spark, Stone, and soggy Pip, then led them past each bright marker toward Hollow Oak.",
      "Luna counted everyone as Burrow tunneled up beside the finish line. Wren waited for the last tired racer. \"I'm sorry about my spell,\" she said, tucking the book away.",
      "Luna gave Dewdrop two golden leaves: one for finishing first and one for coming back. Wren cheered with the others, though her own hands were empty."
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
    storySpine: "After weeks of smoke, sparks and useful warm breath, Glimmer wants one controlled flame, but excitement wobbles the second attempt, so they pause and try one careful lantern light.",
    failedAttempt: "Glimmer's first tiny flame fades, and excitement makes the longer second flame wobble, so Luna stops the attempt.",
    resolution: "Under Luna's supervision, Glimmer lights one magic lantern inside the fire circle, and the lantern network carries that careful light.",
    pages: [
      "After weeks of smoke, sparks, and useful warm breath, Glimmer entered Luna's fire circle. Today, the young dragon hoped to make a first controlled flame.",
      "A full water bucket and red extinguisher waited outside the stone ring. Pip and Stone watched from a safe distance while Luna checked the practice area.",
      "Glimmer took a slow breath and blew gently. One tiny orange flame burned steadily inside the circle, then faded before it touched any of the stones.",
      "Pip covered his mouth to hold back a cheer. \"You saw that?\" Glimmer whispered, looking up at Luna. She nodded, and the young dragon gave a tiny grin.",
      "Glimmer tried again, and a longer flame glowed inside the ring. Excitement rushed through the young dragon as the warm orange light grew brighter.",
      "Glimmer gasped, and the flame began to wobble toward the stones. 'Stop,' Luna said firmly. Glimmer closed their mouth, and the unsafe flame vanished.",
      "Luna set a lantern inside the circle. \"One flame will wake the whole row,\" she said. Glimmer took a long breath, then aimed a small flame at the wick.",
      "The lantern caught the flame and shone. Golden sparks traveled from lamp to lamp, lighting the path without spreading fire across the ground.",
      "Soon, a line of safe golden light wound through Moonwood. Lanterns and glowing mushrooms marked every turn. From the fire circle, Glimmer watched the whole path brighten.",
      "Glimmer turned to the friends waiting behind the ring. \"All those lights?\" they asked, looking back along the path. Pip finally let out the cheer he had been holding.",
      "Luna settled beside Glimmer under the golden lanterns. \"How does it feel?\" she asked. Glimmer opened their mouth to answer, then closed it and grinned.",
      "Pip wrapped his arms around Glimmer while the others crowded closer. The young dragon leaned into the hug. Above them, the first lantern burned with a small, steady flame."
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
    resolution: "Stone tilts a flat wet rock and props it against a root; reflected moonlight opens the buds, which scatter tiny moon shapes across his hands.",
    pages: [
      "Fern cupped one glassleaf bud as the moon rose over her garden. The flowers needed moonlight to open, but old branches shaded their bed.",
      "Stone saw branches shading the flower bed and reached across the old roots. \"I can clear those,\" he said. Pip watched his enormous hands move closer.",
      "As Stone leaned forward, his enormous shadow spread across the garden. Every glassleaf bud disappeared from the moonbeam. The whole flower bed grew dark.",
      "Stone stepped to the left, hoping the moonlight would return. Curving roots still blocked his reach, and his shadow covered the buds again. He sighed.",
      "Pip noticed a silver patch shining beneath the roots on the garden's far side. \"That light comes from the stream!\" he called. Stone turned to look.",
      "Stone walked to Crystal Stream and chose one flat, wet rock. Its smooth surface caught the moonlight. He carried it back without entering the fragile flower bed.",
      "Stone held the rock outside the roots and tilted it toward the garden. A bright moonbeam flashed over the buds and struck the branches. Too high.",
      "Fern lowered one finger toward the waiting buds. \"Just this much,\" she said. Stone tipped the wet rock slowly until the beam followed her hand.",
      "Stone propped the wet rock against a root. Reflected moonlight slid across the flower bed. Each glassleaf bud opened into a bell filled with golden light.",
      "Tiny moon shapes danced across Stone's broad hands as the glassleaf bells opened. He turned his palms toward Fern, and she traced one shining crescent with her finger."
    ]
  }),
  "moonwood-tales-c-28": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-LUNA", "MOON-LOCAL-28-HUMMING-ROOT"],
    storySpine: "Fern wants a silver root off Hollow Oak's step, but every calming note adds a loop, so she pauses, then guides it with three brief taps instead.",
    failedAttempt: "Fern sings four calming notes, and the sound-copying root answers with four loops that tangle the rail.",
    resolution: "Brief taps make the root stretch rather than loop; Fern guides it onto a frame, which holds its coils while the young owls pass underneath.",
    pages: [
      "At sunrise, Fern found a silver root curled across Hollow Oak's front step. One loose curve stretched from side to side, blocking every stair. Nobody could pass.",
      "The silver root hummed along with the birds in the clearing. When a bird held a long note, one curve began to tighten. Fern leaned closer to listen.",
      "Luna and her young owls gathered on the far side of the step. \"Our way is blocked,\" Luna called. Fern promised to move the root gently.",
      "Fern sang one calm note and waited for the root to relax. Instead, the root copied her sound by curling into one new loop. Fern stared.",
      "Fern tried three more soft notes, hoping a longer song would help. The silver root answered with three tight loops. They wrapped around the wooden rail.",
      "Fern stopped singing and waited until the clearing became completely quiet. With no new sound to copy, the silver root stopped moving.",
      "Beside the step stood an empty wooden frame. Fern gave it one quick tap. The root stretched toward the brief sound, then stopped before it could curl.",
      "Fern tapped the ground beside the frame. The root unwound from the rail and slid toward her finger. She waited for it to stop moving.",
      "Fern tapped higher on the frame. The root climbed toward her finger and gripped the wood. Its last loose curve slid away from the step.",
      "Luna's young owls walked beneath the arch, hooting as they went. The root hummed along and tightened its grip on the frame. Fern stepped through after the last owl."
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
    failedAttempt: "Luna's neat size order creates a straight row that matches no constellation on the wall.",
    resolution: "Luna turns each thread until seven lights form an owl, then secures the window while her pupils trace the restored shape.",
    pages: [
      "After a windy night, Luna entered Hollow Oak's star room and stopped. Seven colored glass stars hung in a tangled knot. Their threads crossed in every direction.",
      "Young owls hooted outside the round door, ready for their lesson. Luna had only a few minutes to restore the mobile. She began with a tidy plan.",
      "Luna untangled the glass stars and arranged them from smallest to largest. The seven stars made one neat row. She lifted the mobile toward the ceiling.",
      "Light from the mobile cast a straight row of bright spots on the curved wall. Luna studied the pattern and shook her head. The row did not show any constellation.",
      "Instead of guessing again, Luna opened the round roof window. The true night sky appeared above her. She compared each glass star with the lights overhead.",
      "Luna found one red star east of three close silver points. She held that part of the pattern in her mind. Then she checked the remaining stars.",
      "Luna turned one hanging thread, then another, while watching the wall. Each reflected light moved closer to its place in the sky. The pattern slowly formed.",
      "At last, all seven lights joined into the shape of an owl. Luna checked the real stars once more. The restored pattern matched perfectly.",
      "The young owls entered just as the glowing shape settled overhead. \"There it is!\" they hooted. Together, they traced the bright owl with their wing tips.",
      "Before beginning the lesson, Luna tied the roof window latch securely. Wind rustled outside, but the glass stars stayed still. The owl constellation shone above her class."
    ]
  }),
  "moonwood-tales-c-31": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-FERN"],
    storySpine: "Burrow wants a straight garden tunnel, but following a curved root brings him back to his starting hole, so he measures the root's full circle.",
    failedAttempt: "Burrow follows the root's easy curve and digs a complete circle back to his starting entrance.",
    resolution: "Burrow tests a firm gap below the root, digs through to Fern's bench, and adds the hidden circle to his corrected map.",
    pages: [
      "Burrow spread out his map of the clearing. The path to Fern's garden took a long bend around a stump. He picked up his shovel to make a shortcut.",
      "Burrow dug beneath the clearing and followed the straight route on his map. The soil stayed firm and easy at first. Then his shovel struck something hard.",
      "A thick curved root blocked the tunnel from floor to roof. Burrow could not dig through it. He turned left and followed the root instead.",
      "The root curved farther and farther until Burrow popped aboveground beside the same old stump. He looked down at his starting hole. All that digging had brought him back here.",
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
    storySpine: "Flint wants to carry his maps into Deep Dark, but doubled root shadows make the path hard to see; Pip discovers a crystal splitting the lantern beam.",
    failedAttempt: "Flint turns the lantern, then tries to avoid every dark shape; he ends up off the path in the ferns.",
    resolution: "Flint puts the crystal away, sees the clear spaces between real roots, and carries his maps onward with a fern leaf caught on his collar.",
    pages: [
      "Before carrying maps into Deep Dark, Flint stopped at the fern path to test his lantern. He held the light low beside the rolled maps and checked its glow.",
      "Two shadows stretched across the path from every root. Flint lifted his foot, then hesitated. He could not tell which dark shapes hid real roots.",
      "Flint turned the lantern to shine between the roots. The shadows turned too. He tilted it the other way, but two dark shapes still stretched across the path.",
      "Flint tried stepping around all the dark shapes. He edged farther from the path until his face brushed a fern. Now he could not see the path at all.",
      "Pip examined the lantern instead of the path. Beneath its handle, he spotted one bright crystal at an odd angle. \"That should not be there,\" he said.",
      "Light entered one side of the crystal and left through two angled faces. One lantern beam became two. Now Flint understood the double shadows.",
      "Flint pulled the crystal free, but it slipped from his fingers. As it fell through the beam, two shadows jumped across the ground again. The crystal had caused them.",
      "Flint picked up the crystal and tucked it inside his brown explorer pouch. He closed the flap, then lifted the lantern. The extra shadows had gone.",
      "The lantern lit the path between the roots. Each root had just one shadow, and Flint could see where to put his feet. He stepped back onto the path.",
      "Flint gathered his maps and followed the path into Deep Dark. Behind him, Pip brushed a fern leaf from his collar. \"You brought some forest back,\" he called."
    ]
  }),
  "moonwood-tales-c-33": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-LUNA"],
    storySpine: "Glimmer wants to separate Luna's sap-stuck paper stars, but direct warmth curls the top one, so they warm every layer slowly from below.",
    failedAttempt: "Glimmer blows cinnamon warmth across the exposed star, curling its points while the deeper sap stays cold.",
    resolution: "Glimmer warms a flat rock at a safe distance; Luna slides it below the stack, the softened stars lift apart, and they smooth the curled points against the table.",
    pages: [
      "Luna showed Glimmer a stack of paper stars glued together with cold tree sap. The amber sap had hardened between every layer. Class would begin soon.",
      "Glimmer touched the stiff edge and tried to lift the top star. It would not move. \"We need to separate them before class,\" they said.",
      "Glimmer leaned over the table and blew cinnamon warmth across the top paper star. Warm air brushed its points. Luna watched the stack carefully.",
      "The top star's points curled inward, but the deeper stars remained stuck. The sap between them was still cold and hard. Glimmer closed their mouth at once.",
      "Glimmer stared at the curled star, then stepped back from the table. Blowing on the paper had made things worse. They needed to warm the sap underneath.",
      "Glimmer chose a flat rock and blew gentle warmth across its surface. Luna checked it with one claw. The rock was warm enough to touch.",
      "Luna carried the warm rock to the table and slid it beneath the star stack. Glimmer kept their breath away from the paper. Together, they waited.",
      "Gentle warmth rose from the flat rock through the stack. Slowly, the hard amber sap softened between every layer. The paper stars loosened one by one.",
      "Glimmer lifted the loosened stars apart while Luna held the stack. They smoothed the curled points against the tabletop. Soon every paper star lay flat again.",
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
      "Before moonrise, Spark found a broken hook beside the lowest lantern. Hollow Oak needed a matching replacement. Spark set the lantern down and studied the good hook above it.",
      "Spark raised his wand and copied the good hook in golden light. His copy spell always lasted exactly ten spoken counts. \"That is plenty,\" he said.",
      "Spark hung the waiting lantern from the glowing copied hook and began to count. For nine counts, the hook held firmly. Luna watched from below.",
      "When Spark called \"ten,\" the golden hook vanished, just as it always did. The lantern dropped, but Luna caught it. Spark stared at the empty rail.",
      "Spark cast the copy spell again, hoping the second hook might last longer. He counted without hanging the lantern. At ten, that hook vanished too.",
      "This time, Spark pressed soft clay around a third glowing hook before it disappeared. The clay covered the entire curved shape. He held everything steady as he counted.",
      "At count ten, the golden copy vanished from inside the clay. A smooth curved hollow remained. Spark had captured the hook's shape, even though its magic was gone.",
      "Fern packed strong woven root fiber into every part of the curved mold. Spark pressed the material down carefully. Then they left it beside the warm lanterns.",
      "When the root fiber dried, Spark lifted a solid hook from the mold. Its curve matched the good hook exactly. He carried it to the lowest rail.",
      "Spark hung the lantern on the new root-fiber hook, then counted aloud. \"Ten, eleven, twelve!\" The hook stayed firm, and the lantern kept shining."
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
      "Pip laid out an acorn, a leaf stem, and a smooth stone. He tried each on the chimes, then tapped the smallest with his fingertip. Stone listened.",
      "The acorn brought a deep note from the largest chime. The leaf stem and smooth stone suited the middle pair. Pip's fingertip made the smallest chime tinkle.",
      "Stone pointed to the smallest chime, still tilted on its cord. Pip reached up and untwisted it. Stone steadied the chime until it hung straight again.",
      "Pip placed the acorn, leaf stem, and stone beneath their matching chimes. Beside the smallest one, he held up his finger. They were ready to play.",
      "Stone began with the lowest root chime, and Pip answered on the next. Together, they followed the matching tools upward. Four separate notes rang in order.",
      "Dong, ding, ting, tink! Luna opened Hollow Oak's doors as four clear notes danced into the moonlit forest. This time, each note stayed separate and bright."
    ]
  })
});
