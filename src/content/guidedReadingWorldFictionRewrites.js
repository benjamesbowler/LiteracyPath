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
    storySpine: "Chompy wants to stop his rumbling tummy, but gobbling each food leaves him hungry, so he slows down and finishes Sunny's shared lunch.",
    failedAttempt: "Chompy gobbles berries and leaves, yet his tummy still rumbles.",
    resolution: "Chompy eats Sunny's lunch slowly, feels full, and saves one berry for breakfast.",
    pages: [
      "Chompy wakes with a loud, hungry tummy.",
      "He gobbles berries. His tummy rumbles again.",
      "He munches leaves. The rumble stays.",
      "Sunny shares her lunch. Chompy thanks her.",
      "Chompy gobbles again. The basket is empty.",
      "His tummy feels stretched, but not settled.",
      "Chompy slows down. His friends count each bite.",
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
      "Rain fills Sunny Hollow with deep puddles.",
      "Grumpy, Dozy, and Wiggly hurry under leaves.",
      "Sunny wants everyone to play outside.",
      "Her biggest jump splashes all three friends.",
      "Sunny sees their faces. She stops jumping.",
      "She taps one puddle softly. Wiggly joins.",
      "Grumpy makes one neat splash beside them.",
      "The sun returns over four muddy tracks."
    ]
  }),
  "dino-pals-03-dozy-wont-wake-up": fictionRewrite({
    level: "B",
    canonIds: ["DINO-DOZY", "DINO-BOUNCY", "DINO-ZIPPY", "DINO-HONKY", "DINO-BOSSY", "DINO-CHOMPY"],
    storySpine: "The Pals need Dozy for their picnic, but three loud calls fail, so Chompy wakes him with the picnic smell.",
    failedAttempt: "Bouncy, Zippy, and Honky call loudly, but Dozy sleeps through every call.",
    resolution: "Chompy brings the picnic close enough to smell, and Dozy wakes and carries his pillow outside.",
    pages: [
      "Picnic morning begins, but Dozy still sleeps.",
      "Bouncy calls. Dozy hugs his blue pillow.",
      "Zippy calls. Dozy does not move.",
      "Honky calls. The cave shakes, not Dozy.",
      "Bossy needs Dozy before the picnic starts.",
      "Chompy brings warm berry buns beside him.",
      "Dozy sniffs. One sleepy eye opens.",
      "Dozy carries his pillow and buns to the picnic."
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
      "Bouncy waits nearby without touching the rock.",
      "Grumpy pulls. The rock sinks deeper.",
      "He stops and studies the rock's flat side.",
      "\"Push here together,\" says Grumpy. His tail springs free.",
      "Grumpy checks his tail. \"That was the right help.\""
    ]
  }),
  "dino-pals-05-bossy-makes-a-plan": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOSSY", "DINO-CHOMPY", "DINO-SUNNY", "DINO-WIGGLY", "DINO-DOZY"],
    storySpine: "Bossy wants the picnic ready, but assigning every job alone creates a mess, so she rebuilds the plan with the Pals.",
    failedAttempt: "Bossy's first plan ignores what each Pal can manage, so food vanishes, supplies fall, and Dozy sleeps.",
    resolution: "Bossy asks for ideas, matches each Pal to a useful job, and completes the picnic plan.",
    pages: [
      "Bossy wants the picnic ready before noon.",
      "Her clipboard gives every Pal a job.",
      "Chompy gathers berries, then eats the pile.",
      "Wiggly carries leaves. His tail scatters them.",
      "Dozy guards baskets, then falls asleep.",
      "Bossy's first plan leaves an empty rock.",
      "Sunny suggests jobs that fit each Pal.",
      "Bossy writes their ideas. The picnic fills the rock."
    ]
  }),
  "dino-pals-06-bouncy-bumps-into-everything": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOUNCY", "DINO-FANCY", "DINO-WIGGLY", "DINO-SNEEZY", "DINO-BOSSY"],
    storySpine: "Bouncy wants a morning bounce, but watching only his landing causes collisions, so he plans a clear route to the meadow.",
    failedAttempt: "Bouncy apologises after each bump but repeats the same unsafe route until Sneezy's sneeze scatters everything.",
    resolution: "Bouncy checks the whole path, helps repair the mess, and bounces safely in the empty meadow.",
    pages: [
      "Bouncy hits the cave wall on his first bounce.",
      "Near the waterfall, he bumps Fancy's sail.",
      "Bouncy checks Fancy and helps straighten it.",
      "He bumps Wiggly's basket. They gather every berry.",
      "Then Bouncy lands beside Sneezy's twitching nose.",
      "One sneeze scatters leaves, berries, and Bossy's clipboard.",
      "Bouncy gathers the mess and checks the whole path.",
      "He follows clear stones to the wide, empty meadow."
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
      "It bumps Grumpy's favourite flat rock.",
      "One fast swish splashes Fancy with mud.",
      "Wiggly freezes. His tail still rolls three berries.",
      "\"Staying still does not help,\" says Wiggly.",
      "Dozy shows him where a slow swish makes breeze.",
      "Bright stones mark Wiggly's space. His cool breeze stays inside."
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
      "Sunny calls, \"Which way?\" Zippy has not looked.",
      "He speeds past the waterfall and meadow.",
      "Zippy stops. Sunny Hollow is nowhere nearby.",
      "Three blue flowers point toward a bent tree.",
      "Zippy follows them slowly and finds the path.",
      "Sunny meets him beside the bent tree.",
      "They walk home, naming each turn together."
    ]
  }),
  "dino-pals-09-honkys-inside-voice": fictionRewrite({
    level: "B",
    canonIds: ["DINO-HONKY", "DINO-GRUMPY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-DOZY"],
    storySpine: "Honky wants to greet friends without shaking breakfast, but excitement enlarges his voice again, so he learns when each voice helps.",
    failedAttempt: "Honky's excited cheer becomes huge again and scatters the breakfast leaves.",
    resolution: "Honky uses a big voice to guide friends through a storm, then a small voice inside the cave.",
    pages: [
      "Honky's morning greeting shakes leaves onto breakfast.",
      "Grumpy asks for a voice that fits nearby friends.",
      "Bossy shows one small call and one big call.",
      "Honky greets Chompy softly. The bowls stay still.",
      "He cheers too soon. Leaves scatter again.",
      "Thunder wakes Dozy as rain covers the paths.",
      "Honky's biggest call guides everyone to Cozy Cave.",
      "Inside, Honky whispers, \"We are all here.\""
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
      "Cheeky spreads mud on Fancy's favourite rock.",
      "Fancy slips. Cheeky slips in the same mud.",
      "Cheeky helps Fancy up and cleans the rock.",
      "He asks what joke both friends would enjoy.",
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
      "Grumpy finds a smooth grey pebble.",
      "Chompy finds a small basket of berries.",
      "Dozy finds a broad leaf for shade.",
      "Bossy wants to thank the hidden giver.",
      "Bouncy, Zippy, and Honky search too loudly.",
      "Cheeky watches after supper, then falls asleep.",
      "Sunny waits silently behind one fern.",
      "Two pink feet place a grass bracelet down.",
      "Sunny says, \"Thank you, Shy. I can wait here.\"",
      "Shy sits near Sunny, with the rock between them.",
      "Next morning, a gift from every Pal waits for Shy."
    ]
  }),
  "dino-pals-12-fancys-bad-day": fictionRewrite({
    level: "B",
    canonIds: ["DINO-FANCY", "DINO-CLUMSY", "DINO-CHOMPY", "DINO-BOUNCY", "DINO-DOZY", "DINO-HONKY", "DINO-WIGGLY"],
    storySpine: "Fancy wants her bent sail straight again, but forceful fixes risk damage, so Wiggly dampens and presses it slowly.",
    failedAttempt: "Sitting, bouncing, softness, and shouting are proposed, but none safely fits the bent sail.",
    resolution: "Wiggly uses water and gentle pressure; Fancy restores her sail and gives Wiggly a woven bracelet.",
    pages: [
      "Fancy wakes with her purple sail badly bent.",
      "She stays inside and studies the sharp fold.",
      "Clumsy cannot see the bend from above.",
      "Chompy offers to sit on it. Fancy refuses.",
      "Bouncy offers one bounce. Fancy refuses again.",
      "Dozy's pillow is soft, but it changes nothing.",
      "Honky's shout only makes the sail flap.",
      "Wiggly suggests warm water and slow pressure.",
      "He carries water without touching Fancy's sail.",
      "Fancy guides his tail as the fold relaxes.",
      "The pool shows Fancy's straight sail again.",
      "Fancy gives Wiggly a bracelet. He catches it with care."
    ]
  }),
  "dino-pals-13-clumsy-to-the-rescue": fictionRewrite({
    level: "B",
    canonIds: ["DINO-CLUMSY", "DINO-DOZY", "DINO-BOUNCY", "DINO-ZIPPY", "DINO-CHEEKY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-WIGGLY"],
    storySpine: "Dozy wants his missing pillow, but a hurried ground search fails, so Clumsy's height finds it and Wiggly's reach retrieves it.",
    failedAttempt: "Bouncy, Zippy, and Cheeky search quickly at ground level and miss the pillow in the waterfall pool.",
    resolution: "Clumsy spots the pillow from above, Wiggly reaches it, and Dozy rests on the recovered blue pillow.",
    pages: [
      "Dozy cannot find his blue pillow anywhere.",
      "Bouncy, Zippy, and Cheeky search every low corner.",
      "Bossy's map shows too many places to check.",
      "\"Not from up here,\" says tall Clumsy.",
      "Clumsy scans beyond the ferns and waterfall.",
      "He spots Chompy, bushes, puddles, and one blue square.",
      "Dozy's pillow floats below the waterfall.",
      "Bouncy remembers knocking it downstream.",
      "Clumsy sees it clearly but cannot reach the pool.",
      "Wiggly lowers his neck and lifts the pillow.",
      "Dozy hugs it and falls asleep at once.",
      "Clumsy spots problems. Wiggly reaches them. Their new team works."
    ]
  }),
  "dino-pals-14-what-is-flappy": fictionRewrite({
    level: "B",
    canonIds: ["DINO-FLAPPY", "DINO-GRUMPY", "DINO-BOSSY", "DINO-SUNNY"],
    storySpine: "Flappy wants to reach a high branch, but copying other dinosaurs fails, so Flappy combines small feet, feathers, and short glides.",
    failedAttempt: "Roaring and stomping do not help Flappy reach the branch, and the first flight ends in mud.",
    resolution: "Flappy nests, catches insects, and glides onto the branch using a body that fits those actions.",
    pages: [
      "Flappy flaps toward a branch, then lands in mud.",
      "\"I have wings. Why can I not reach it?\"",
      "Bossy flies differently. Grumpy cannot explain how.",
      "Sunny praises Flappy, but Flappy still wants an answer.",
      "Flappy tries roaring. Only a small squawk comes.",
      "Flappy tries stomping. Small feet make small thumps.",
      "Those feet grip a tree while Flappy builds a nest.",
      "The wings catch insects during one short glide.",
      "Flappy shows Grumpy the useful feet and feathers.",
      "\"Use what your body does,\" says Grumpy.",
      "Flappy climbs, flaps, and aims for the same branch.",
      "This time, Flappy lands neatly beside the nest."
    ]
  }),
  "dino-pals-15-sneezy-and-the-waterfall": fictionRewrite({
    level: "B",
    canonIds: ["DINO-SNEEZY", "DINO-BOSSY", "DINO-CHOMPY", "DINO-SUNNY", "DINO-GRUMPY", "DINO-WIGGLY"],
    storySpine: "The Pals want Rainbow Waterfall flowing, but pushing cannot shift the rockfall, so Sneezy safely directs a powerful sneeze.",
    failedAttempt: "The group pushes, Chompy pushes, and Grumpy strikes one rock, yet the stream remains blocked.",
    resolution: "Sneezy warns everyone back, aims upstream, and clears the rocks so the waterfall and rainbow return.",
    pages: [
      "Rainbow Waterfall stops flowing during the night.",
      "Fallen rocks block the stream above it.",
      "Bossy leads one push. Nothing moves.",
      "Chompy pushes, then tumbles into a berry bush.",
      "Grumpy's tail shifts one rock from fifty.",
      "The tired Pals sit beside the silent stream.",
      "Pollen from the ferns makes Sneezy's nose twitch.",
      "Sneezy warns everyone and points upstream.",
      "He takes one enormous, careful breath.",
      "The Pals move behind the strongest boulder.",
      "Sneezy aims. His sneeze scatters the loose rocks.",
      "Water and rainbow return. Sneezy gathers the fallen leaves."
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
      "Chompy joins, stopping often to taste leaves.",
      "Grumpy names one leaf. Chompy eats it.",
      "Grumpy names one pebble. Chompy leaves it.",
      "They reach the rock and a berry patch.",
      "Grumpy stretches out on the flat, sun-warmed rock.",
      "Chompy falls into a ditch and slides back twice.",
      "Grumpy leaves the rock and lowers his club tail.",
      "Chompy grips it. Grumpy pulls him free.",
      "Mud-covered Chompy sits quietly beside Grumpy.",
      "Grumpy points Chompy toward the berry patch.",
      "Later, Grumpy calls out one better bush. Chompy waves."
    ]
  }),
  "dino-pals-17-the-sunny-hollow-games": fictionRewrite({
    level: "B",
    canonIds: ["DINO-BOSSY", "DINO-ZIPPY", "DINO-BOUNCY", "DINO-HONKY", "DINO-WIGGLY", "DINO-SHY", "DINO-GRUMPY", "DINO-CHEEKY", "DINO-DOZY", "DINO-FANCY", "DINO-SNEEZY", "DINO-CHOMPY"],
    storySpine: "Bossy wants fair Sunny Hollow Games, but single-skill contests create messes and obvious winners, so she records useful, specific achievements.",
    failedAttempt: "The tidy contest collapses under Wiggly's tail, showing that Bossy's first scoreboard cannot compare unlike skills fairly.",
    resolution: "Bossy replaces one overall winner with clear event records, including a final picnic job for Chompy.",
    pages: [
      "Bossy opens the first Sunny Hollow Games.",
      "Her board lists running, jumping, loudness, and tidying.",
      "Zippy finishes before Bossy sees the start.",
      "Bouncy wins jumping, then bumps the markers.",
      "Honky wins loudness and empties every tree.",
      "Wiggly's tail ruins the tidy corner.",
      "Shy's hidden pebble row stays perfectly neat.",
      "Cheeky records Grumpy's strongest grumpy face.",
      "Dozy wakes only when the picnic begins.",
      "Fancy displays the tallest, straightest sail.",
      "Sneezy sends one test leaf beyond the meadow.",
      "Bossy names each event record. Chompy sits beside the prize baskets without eating them."
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
      "Bossy and Sunny wait beside him.",
      "Inside his dream, Dozy seeks the warmest cloud bed.",
      "He walks across soft clouds above Sunny Hollow.",
      "Chompy's food-cloud has nothing to eat.",
      "Grumpy's seat-cloud will not stay firm.",
      "Bouncy's cloud springs away above them.",
      "A golden waterfall points toward Mount Rumble.",
      "Dozy finds every friend on the warm peak.",
      "The whole green valley rests below their cloud.",
      "Dozy wakes inside his waiting circle of friends.",
      "Dozy closes his eyes. The waiting friends remain beside him."
    ]
  }),
  "dino-pals-19-zippys-race": fictionRewrite({
    level: "B",
    canonIds: ["DINO-ZIPPY", "DINO-SUNNY", "DINO-WIGGLY", "DINO-HONKY"],
    storySpine: "Zippy wants to feel ready for a real race, but endless practice laps deepen his worry, so he runs the marked course and meets his rival.",
    failedAttempt: "Five extra circuits do not make Zippy feel ready; they leave his legs tired before race day.",
    resolution: "Zippy wins narrowly, thanks the close runner, and changes his next circuit into an easy recovery lap.",
    pages: [
      "Zippy delivers news of a race between valleys.",
      "Everyone expects Zippy to win. Zippy goes quiet.",
      "He runs five practice circuits without stopping.",
      "Wiggly asks why. Zippy still does not feel ready.",
      "Race day brings several fast young runners.",
      "Zippy starts first, with one runner close behind.",
      "His tired legs work harder near the final bend.",
      "Zippy crosses just before the second runner.",
      "Honky's cheer shakes leaves across the finish.",
      "The close runner says, \"Good race.\" Zippy agrees.",
      "Zippy studies the small winner's pebble.",
      "He runs one easy recovery lap, watching every marker."
    ]
  }),
  "dino-pals-20-the-big-storm": fictionRewrite({
    level: "B",
    canonIds: ["DINO-GRUMPY", "DINO-BOSSY", "DINO-CLUMSY", "DINO-SNEEZY", "DINO-HONKY", "DINO-WIGGLY", "DINO-ZIPPY", "DINO-BOUNCY", "DINO-SHY", "DINO-DOZY", "DINO-SUNNY"],
    storySpine: "The Pals want everyone safe before a storm, but Bossy's long plan gives everyone too many jobs, so each Pal contributes one observable strength.",
    failedAttempt: "Bossy reads one long plan, but every Pal receives too many jobs to remember at once.",
    resolution: "Clumsy spots, Sneezy times, Honky calls, and the others prepare Cozy Cave before the storm arrives.",
    pages: [
      "Heavy, still air covers Sunny Hollow.",
      "Grumpy reads the clouds. \"A big storm is coming.\"",
      "Bossy's long plan gives every Pal too many jobs at once.",
      "Clumsy spots bent eastern ferns from above.",
      "Sneezy smells rain. \"Fifteen minutes,\" he warns.",
      "Honky's clear call reaches every corner.",
      "Wiggly sweeps loose supplies off Big Flat Rock.",
      "Zippy collects food, blankets, and lamps.",
      "Bouncy secures high branches without leaving the clear path.",
      "Shy leads everyone to Cozy Cave's warmest nook.",
      "The storm pounds outside. Dozy's blue pillow stays dry.",
      "Afterward, each clear path begins at the cave."
    ]
  }),
  "moonwood-tales-c-01": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-BURROW"],
    storySpine: "Pip wants the Bravery Stone to remove his fear, but it changes nothing, so he climbs with real safety supports and his own choices.",
    failedAttempt: "Pip waits for the stone to make him fearless, yet his legs still wobble at the practice wall.",
    resolution: "Pip climbs one hold at a time, crosses the marsh path, and keeps the ordinary stone as a record of his actions.",
    pages: [
      "Pip kicks a tiny gold stone on a Moonwood path.",
      "He lifts it. Warm light rests across his fingers.",
      "Burrow says old stories call it a Bravery Stone.",
      "Pip waits to feel fearless. Nothing changes.",
      "At Tumblerock Cliffs, he chooses a low wall above a thick mat.",
      "His legs wobble, but he uses one strong hold at a time.",
      "Pip reaches the top, then carries the stone toward Fog Marsh.",
      "Reeds rustle beside him. Pip keeps to the marked path.",
      "That evening, the stone's borrowed gold light fades.",
      "\"Did its brave run out?\" Pip asks Burrow.",
      "Burrow shows him an ordinary stone. Pip remembers every choice.",
      "Pip keeps the plain stone to remember what his own hands did."
    ]
  }),
  "moonwood-tales-c-02": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-LUNA", "MOON-PIP"],
    storySpine: "Fern wants one seed to grow beside Hollow Oak, but an unfinished growth song makes it overrun the doorway, so she completes the song.",
    failedAttempt: "Fern's slowing and stopping spells add more magic without finishing the seed's established song, so the plant keeps growing.",
    resolution: "Fern sings the missing final verse; the plant settles beside the Oak and leaves Luna's doorway clear.",
    pages: [
      "Fern plants one seed beside Hollow Oak and hums its growth song.",
      "She sings only the opening verse before night falls.",
      "By morning, leaves fill the doorway and curl through every window.",
      "Fern tries slowing and stopping spells. The unfinished plant grows faster.",
      "Its stem pushes through the roof while everyone steps back.",
      "Luna calls through the leaves, \"Please clear the doorway.\"",
      "Fern notices the plant repeats the unfinished tune in rustling leaves.",
      "She sings the final verse her mother taught her.",
      "The stem lowers. Window leaves fold toward the garden.",
      "By evening, one large plant stands beside the open doorway.",
      "Luna tests the clear path. Fern waters the settled roots.",
      "Fern sings the missing final notes. Settled leaves rustle them back."
    ]
  }),
  "moonwood-tales-c-03": fictionRewrite({
    level: "C",
    canonIds: ["MOON-STONE", "MOON-PIP", "MOON-BURROW"],
    storySpine: "Stone wants to avoid the swaying rope bridge, but Burrow becomes stranded, so Stone crosses by focusing on one fixed rope at a time.",
    failedAttempt: "Stone places one foot on the bridge, feels it sway, and steps back before Burrow needs help.",
    resolution: "Stone crosses, carries Burrow back, and inspects the bridge from underneath on solid ground.",
    pages: [
      "Everyone crosses the Crystal Stream bridge except Stone.",
      "Stone worries about its sway and anything waiting underneath.",
      "Pip checks the ropes, but facts do not stop Stone's worry.",
      "Stone tries one step. The bridge sways, so Stone steps back.",
      "Then Burrow loses his glasses on the far bank.",
      "Stone watches Burrow circle beside the rushing stream.",
      "He grips one fixed rope and steps onto the bridge.",
      "At the middle, Stone watches Pip's hand signal, not the water.",
      "Stone reaches Burrow and lifts him with both broad hands.",
      "They cross back, one rope and one careful step at a time.",
      "Burrow finds his glasses. Stone's feet reach solid ground.",
      "Stone checks beneath the bridge from shore. Nothing answers."
    ]
  }),
  "moonwood-tales-c-04": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-SPARK", "MOON-PIP", "MOON-FERN", "MOON-LOCAL-C04-FOX"],
    storySpine: "Glimmer wants one steady flame, but forcing harder produces smoke, so an urgent rescue reveals one brief, uncontrolled flare and a safer next step.",
    failedAttempt: "Repeated deep breaths produce smoke, sparks, and cinnamon warmth, but never a steady flame Glimmer can repeat.",
    resolution: "Glimmer's protective rush makes one accidental flare; the seeds are safe, but supervised practice must continue.",
    pages: [
      "Each morning, Glimmer practises one safe breath inside a stone circle.",
      "The first breath brings smoke, but no flame.",
      "The next breath makes one spark that quickly fades.",
      "Spark says, \"Push harder.\" Thick smoke covers both friends.",
      "A slower breath comes out warm and cinnamon-scented.",
      "Pip calls the warmth progress. Glimmer still wants steady fire.",
      "By Crystal Stream, ten careful tries bring sparks, warmth, and smoke.",
      "Glimmer stops. Forcing more breaths has made their throat sore.",
      "A marsh fox grabs Fern's seed pouch and runs.",
      "Glimmer blocks the path, plants both feet, and warns the fox.",
      "One sudden orange flare makes it drop the seeds and flee.",
      "Glimmer cannot repeat the flare. Pip marks it as a supervised next step."
    ]
  }),
  "moonwood-tales-c-05": fictionRewrite({
    level: "C",
    canonIds: ["MOON-WREN", "MOON-LUNA", "MOON-PIP"],
    storySpine: "Wren wants to become taller with a spell, but reading its mirrored script backwards shrinks her, so she decodes the direction mark and restores herself.",
    failedAttempt: "Wren repeats the words before checking the moon-shaped direction mark, leaving herself one inch tall beside an enormous book.",
    resolution: "Wren reads the marked line forward, returns to normal size, and shelves the height spell unfinished.",
    pages: [
      "Wren finds a height spell written in mirrored blue ink.",
      "She reads from the wrong moon mark. Blue light flashes.",
      "Her hands seem distant because Wren is now one inch tall.",
      "The desk towers above her, and her tiny voice barely carries.",
      "Wren climbs the book and notices its arrow points the other way.",
      "She starts at the silver moon and reads each word forward.",
      "Luna enters and finds tiny Wren standing on the page.",
      "Wren finishes the forward spell while Luna keeps the book flat.",
      "Blue light returns Wren to her usual height.",
      "The unused height charm remains below the mirrored line.",
      "Pip asks whether she will try it. Wren closes the book.",
      "She shelves that spell and opens a book about safe step stools."
    ]
  }),
  "moonwood-tales-c-06": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FLINT", "MOON-PIP"],
    storySpine: "Flint wants a reliable map of Moonwood, but his detailed static map fails when paths move, so he records time and change instead.",
    failedAttempt: "After three days drawing every fixed turn, Flint discovers the forest has rearranged and his beautiful map cannot guide him home.",
    resolution: "Flint labels the first map 'Yesterday' and begins a dated atlas showing how paths shift.",
    pages: [
      "Flint leaves Hollow Oak to map every Moonwood path.",
      "He records Crystal Stream, Tumblerock Cliffs, and each careful turn.",
      "For three days, his detailed parchment grows longer.",
      "Flint lifts the finished map and declares every path fixed.",
      "The surrounding trees do not match his drawing.",
      "His map says Whispering Meadow, but grey marsh reeds surround him.",
      "Flint sighs. Yesterday's map cannot guide him today.",
      "He dates a fresh page and marks the path's new bend.",
      "The changing route takes him home after one long loop.",
      "Pip asks whether the map worked. Flint says, \"The new one does.\"",
      "He pins the first map up under a label: YESTERDAY.",
      "Outside, paths shift. Flint adds today's line to his growing atlas."
    ]
  }),
  "moonwood-tales-c-07": fictionRewrite({
    level: "C",
    canonIds: ["MOON-DEWDROP", "MOON-BURROW", "MOON-PIP", "MOON-LOCAL-C07-RIPPLE"],
    storySpine: "Dewdrop wants to know the new blue-striped fish, but its grand claims fail every check, so she asks for one true detail at a time.",
    failedAttempt: "Dewdrop follows the fish's boast about a Deep Dark secret and finds no matching evidence.",
    resolution: "The fish admits inventing stories because it felt ordinary, then shares a true name and real stream knowledge.",
    pages: [
      "Dewdrop knows every fish in Crystal Stream and their usual morning news.",
      "A new silver fish arrives with one bright blue stripe.",
      "It claims to be Moonwood's oldest fish, though it is very small.",
      "It boasts about Hollow Oak and secrets from the Deep Dark.",
      "Dewdrop checks one clue. The old badger, not the fish, keeps it.",
      "Burrow has never seen the striped fish in any tunnel record.",
      "Dewdrop asks why its stories do not match the stream.",
      "The fish makes one small circle. “I wanted to sound important.”",
      "Dewdrop points to its blue stripe. That true detail is already rare.",
      "The fish shows her a cold spring hidden below one root.",
      "After that, it shares small facts Dewdrop can test.",
      "\"My name is Ripple,\" it tells Pip. One true story begins."
    ]
  }),
  "moonwood-tales-c-08": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-STONE"],
    storySpine: "Burrow wants to open and understand an old root-carved door, but pulling and Luna's fading memory fail, so he matches the carving to real roots.",
    failedAttempt: "Burrow pulls the door and Luna traces its carving, yet the sealed wood does not move.",
    resolution: "Burrow presses the carved north root, opens the Memory Room, and adds Hollow Oak to its living wall.",
    pages: [
      "Burrow's spade strikes old wood beneath Hollow Oak's roots.",
      "He clears soil from a small underground door.",
      "Its carving shows one tree with roots reaching every direction.",
      "Burrow gathers friends, but pulling does not open it.",
      "Stone squeezes sideways while Luna folds her wings through the tunnel.",
      "Luna recognises the carving, though its opening rule escapes her.",
      "She traces each root. The door remains shut.",
      "Burrow matches the carved roots to the real roots overhead and presses north.",
      "The door opens onto glowing pictures of Moonwood's living past.",
      "Friends follow streams, creatures, and vanished paths around the walls.",
      "Luna remembers its name: the Memory Room.",
      "Burrow finds clear wall and draws today's Hollow Oak.",
      "The new picture glows beside the old ones."
    ]
  }),
  "moonwood-tales-c-09": fictionRewrite({
    level: "C",
    canonIds: ["MOON-SPARK", "MOON-WREN", "MOON-FERN", "MOON-DEWDROP"],
    storySpine: "Spark wants to contain cold-triggered magic sneezes, but holding one in builds dangerous power, so friends use a checked remedy and a cloth.",
    failedAttempt: "Spark suppresses a sneeze until magic builds, then transforms the stream fish and water when the sneeze escapes.",
    resolution: "Wren checks and gives the correct remedy; Spark's next sneeze lands safely in a cloth without changing anything.",
    pages: [
      "Spark catches a cold, and every sneeze carries loose wand magic.",
      "At breakfast, one sneeze turns porridge into a flying bird.",
      "Wren asks Spark to warn everyone before the next twitch.",
      "In Whispering Meadow, a sneeze turns every flower blue.",
      "Spark apologises and feels another tickle starting.",
      "He holds it in. Gold magic builds around his watering eyes.",
      "Fern points away from Crystal Stream and brings a cloth.",
      "The trapped sneeze escapes beside the water.",
      "Fish turn purple, the stream changes key, and one fish briefly becomes a frog.",
      "Spark stops practising magic and asks Dewdrop to count every changed fish.",
      "Dewdrop needs the fish restored before another spell is tested.",
      "Wren checks the remedy title, direction arrow, and exact dose.",
      "The remedy restores fish, flowers, water, and Spark's clear nose.",
      "Spark sneezes into the cloth. Nothing changes, so Dewdrop checks off every fish."
    ]
  }),
  "moonwood-tales-c-10": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-BURROW", "MOON-DEWDROP", "MOON-WREN"],
    storySpine: "Luna wants to remember an urgent task before afternoon, but searching places at random fails, so the Crystal Stream clue leads to stored seeds.",
    failedAttempt: "The group searches Hollow Oak, paths, and Whispering Meadow without using Luna's one useful memory: outside water.",
    resolution: "Luna retrieves the first-tree seeds and the group plants them in a ring around tired Hollow Oak.",
    pages: [
      "Luna wakes knowing one important task must happen today.",
      "She remembers only that it is outside and cannot wait.",
      "Pip asks for one sense. Luna remembers cold water.",
      "Fern and Burrow suggest places, but none feels right.",
      "They search Hollow Oak, every path, and Whispering Meadow without success.",
      "Dewdrop names Crystal Stream. Luna stops and faces the water.",
      "She flies to the stepping stones and studies the pebbles below.",
      "A silver box waits underwater where Luna once hid it.",
      "The cold box brings back the task: plant its contents today.",
      "Inside, twelve first-tree seeds glow with steady gold light.",
      "Luna explains the tired old trees need young neighbours.",
      "She gives one seed to each waiting Moonwood friend.",
      "They plant a ring around Hollow Oak before sunset.",
      "By night, twelve gold shoots mark the task Luna nearly missed."
    ]
  }),
  "moonwood-tales-c-11": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-STONE", "MOON-LOCAL-C11-TOADLING"],
    storySpine: "Pip wants to identify a frightening marsh noise, but Stone's first call overwhelms its tiny source, so they listen and answer gently.",
    failedAttempt: "Stone's first enormous call shakes the reeds and makes the lost toadling hide behind its rock.",
    resolution: "Stone uses three soft calls, the toadling's family answers, and their joined song follows Pip and Stone home.",
    pages: [
      "A huge sound rolls from Fog Marsh while Pip and Stone sit outside.",
      "Pip wants to identify it. Stone wants distance from anything so loud.",
      "Pip starts alone. Stone moves one foot after him.",
      "At the marsh edge, another crash lifts Pip's hair. Stone catches up.",
      "They enter together while echoes bounce between twisted trees.",
      "Reeds shake and dark water ripples as the noise draws closer.",
      "One tiny toadling sits on a mossy rock with its mouth wide open.",
      "It sees them and stops. The whole marsh becomes quiet.",
      "The lost toadling says it has been calling for its family.",
      "Stone kneels. \"I will try a small call.\"",
      "His first boom makes it hide. Three softer calls bring three answers.",
      "Back home, Pip and Stone hear the reunited marsh family singing."
    ]
  }),
  "moonwood-tales-c-12": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-DEWDROP", "MOON-PIP"],
    storySpine: "Fern and Dewdrop want Crystal Stream singing again, but neither plant strength nor water pressure moves the boulder, so they combine both.",
    failedAttempt: "Dewdrop's strongest current and Fern's strongest push each fail against the mud-locked boulder.",
    resolution: "Fern's vine pulls while Dewdrop loosens the mud, freeing the singing stones and restoring the stream's sound.",
    pages: [
      "Fern hears that Crystal Stream still flows but no longer sings.",
      "Dewdrop listens below the surface. The silence begins upstream.",
      "They follow the water toward its oldest source.",
      "Roots grow broader while the stream becomes quieter.",
      "A fallen boulder pins the singing stones under thick mud.",
      "Dewdrop drives water against it. The boulder stays fixed.",
      "Fern pushes with both hands. Mud grips the stone tighter.",
      "Fern loops a strong vine while Dewdrop sends water underneath.",
      "Vine pulls, water lifts, and the loosened boulder rolls aside.",
      "Current rushes over the stones until their clear notes return.",
      "Fern and Dewdrop sit beside the song they restored together.",
      "At Hollow Oak, Pip hears the stream before he sees them."
    ]
  }),
  "moonwood-tales-c-13": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-SPARK"],
    storySpine: "Glimmer and Spark trade lessons in steady heat and floating, but technical instructions fail, so each describes one physical feeling the other can test.",
    failedAttempt: "Spark's charts produce only Glimmer's smoke, while Glimmer's vague wing example lifts Spark's hat instead of Spark.",
    resolution: "Glimmer makes controlled cinnamon warmth and a five-step glide; Spark floats one boot, giving both a measurable next step.",
    pages: [
      "Spark offers fire lessons if Glimmer helps test a floating spell.",
      "His first lesson fills three boards with complicated heat diagrams.",
      "Glimmer follows every arrow. Only grey smoke appears.",
      "Glimmer demonstrates lift by spreading both small wings and hovering.",
      "Spark copies the motion. His hat floats, but his boots stay down.",
      "More charts add pressure, angles, and numbers without changing either result.",
      "Glimmer pushes the charts aside. “Breathe out as if the air is warm.”",
      "Spark lowers his wand. One boot rises for a steady second.",
      "Spark asks about lift. Glimmer says, \"Lean into the air, then trust it.\"",
      "Glimmer runs, opens both wings, and glides five whole steps.",
      "No flame appears, and Spark cannot float yet, but both mark exact progress.",
      "Tomorrow's deal begins with one warm breath and one balanced boot."
    ]
  }),
  "moonwood-tales-c-14": fictionRewrite({
    level: "C",
    canonIds: ["MOON-WREN", "MOON-FLINT"],
    storySpine: "Wren and Flint want Whispering Meadow, but choosing between a stale map and unstable spell gets them lost, so they read living mushroom signals.",
    failedAttempt: "They reject both conflicting directions and go straight, reaching Fog Marsh with maps and spell arrows that cannot orient them.",
    resolution: "Wren notices the mushrooms brighten toward open ground; they follow the pulse trail to the meadow and record the clue.",
    pages: [
      "Wren and Flint set out for Whispering Meadow with map and direction spell.",
      "The map says left. The spell says right. They choose straight ahead.",
      "An hour later, vanished paths and unfamiliar trees surround them.",
      "Flint's map places them near meadow, but grey marsh fog appears.",
      "Wren's arrow spins, then points at Flint instead of a path.",
      "Seven spare maps show other places, old turns, or upside-down routes.",
      "They rest below one mushroom whose meadow-facing side glows brighter.",
      "Wren closes her spell book and asks the mushroom for the open path.",
      "Its bright side pulses. Another distant mushroom answers, then another.",
      "They follow the living light until golden meadow opens ahead.",
      "Flint marks the mushroom signal and today's date on his map.",
      "Behind them, the final mushroom darkens after both travellers arrive."
    ]
  }),
  "moonwood-tales-c-15": fictionRewrite({
    level: "C",
    canonIds: ["MOON-BURROW", "MOON-LUNA"],
    storySpine: "Burrow wants to understand a carved underground room, but looking alone reveals no meaning, so Luna's remembered touch wakes its stored stories.",
    failedAttempt: "Burrow studies every carving and glowing stone alone, yet cannot tell what the room records.",
    resolution: "Luna identifies the Memory Room, lights each carving by touch, and begins its first story while Burrow listens.",
    pages: [
      "Burrow's quiet morning tunnel breaks through an old room wall.",
      "He tumbles into a chamber wider than any tunnel.",
      "Carvings cover the walls beneath tiny glowing ceiling stones.",
      "Burrow studies them alone, but cannot read their order.",
      "He brings Luna, who folds her wings through the narrow tunnel.",
      "At the doorway, Luna becomes still and whispers, \"Oh.\"",
      "Her wing touches one carving. Blue and gold lines wake around it.",
      "Burrow asks whether Luna has stood here before.",
      "She names the Memory Room, where Moonwood stores its oldest stories.",
      "Luna settles beneath the first lit carving and begins its tale.",
      "As Burrow listens, each next picture glows in story order.",
      "Night finds them still there, with many warm carvings left to hear."
    ]
  }),
  "moonwood-tales-c-16": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-GLIMMER", "MOON-STONE", "MOON-BURROW"],
    storySpine: "Pip and Glimmer want to identify who moves clearing objects at night, but their first watch nearly ends in sleep, so a second sound exposes Burrow.",
    failedAttempt: "Hours of silent watching make Glimmer doze and reveal nothing before the shuffling finally begins.",
    resolution: "They observe Burrow sleep-digging, show him the trail next morning, and place his muddy boot by the door as evidence.",
    pages: [
      "Pip's boots move overnight, and a clearing bench tips over.",
      "The next night brings more moved things, but nobody remembers touching them.",
      "Pip asks Glimmer to help watch the clearing after dark.",
      "They hide behind a mushroom while Moonwood glows softly.",
      "Nothing moves for hours. Glimmer's cinnamon breath fades as their eyes close.",
      "A sudden shuffle wakes them. One round shape crosses the clearing.",
      "Burrow walks with closed eyes, fast asleep.",
      "He bumps the bench and moves Pip's boots without waking.",
      "Burrow pockets acorn biscuits while Glimmer covers a laugh.",
      "He sits against their hiding mushroom and snores.",
      "Morning finds Pip and Glimmer beside Burrow's muddy sleep trail.",
      "Burrow places his dirty boot by the door to reveal the next walk."
    ]
  }),
  "moonwood-tales-c-17": fictionRewrite({
    level: "C",
    canonIds: ["MOON-FERN", "MOON-WREN", "MOON-BURROW"],
    storySpine: "Wren wants to help Fern's garden grow, but she ignores the potion's warning colour and makes every plant walk, so both follow the reversal recipe.",
    failedAttempt: "Wren pours a purple motion potion after Fern questions it, sending every rooted pot wandering away.",
    resolution: "Fern calls the plants with their root-song while Wren applies plain stream water, then keeps the two recipes clearly separated.",
    pages: [
      "Wren brings Fern a potion meant to help the garden grow.",
      "Fern asks whether Wren checked the recipe. Wren says, \"Mostly.\"",
      "The mixture should be green, but it shines purple. Fern points this out.",
      "Wren pours anyway. One plant straightens, leans, and takes a step.",
      "Soon every pot walks politely around Fern and Wren.",
      "Wren opens her book while plants leave the garden.",
      "Some enter Hollow Oak; the smallest heads toward Burrow's tunnel.",
      "Wren finds the motion recipe: root-song first, plain stream water second.",
      "Fern sings the root-song from the centre of the clearing.",
      "Wren sprinkles stream water. Each wandering plant turns home.",
      "The smallest pot settles last in its own patch of soil.",
      "Wren sets both recipe books beside the empty cauldron. Every plant is home."
    ]
  }),
  "moonwood-tales-c-18": fictionRewrite({
    level: "C",
    canonIds: ["MOON-STONE", "MOON-DEWDROP", "MOON-LOCAL-C18-FISH"],
    storySpine: "Dewdrop wants a fish freed from two rocks, but water pressure fails and Stone fears getting wet, so Stone chooses one careful reach.",
    failedAttempt: "Dewdrop's strongest current presses the fish tighter, while Stone's first reach stops above the water.",
    resolution: "Stone moves the loose rock, accepts one enormous splash, and watches the freed fish surface.",
    pages: [
      "Dewdrop finds a large fish trapped in Crystal Stream.",
      "Two rocks grip its body while its tail keeps flicking.",
      "Dewdrop pushes water hard, but the fish wedges tighter.",
      "She asks Stone for one broad hand and careful strength.",
      "Stone reaches the bank, then admits he dislikes getting wet.",
      "His first reach stops above the sparkling water.",
      "Stone rolls one sleeve and studies the loose rock.",
      "His hand enters the stream and grips its dry upper edge.",
      "Stone pushes. Mud releases, the rock turns, and the fish swims free.",
      "Its grateful splash soaks Stone from head to feet.",
      "Stone drips beside Dewdrop while the fish circles once.",
      "The fish surfaces beyond the rocks. Stone says, \"Good.\""
    ]
  }),
  "moonwood-tales-c-19": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FLINT", "MOON-WREN", "MOON-SPARK", "MOON-STONE", "MOON-BURROW", "MOON-DEWDROP", "MOON-FERN"],
    storySpine: "Luna wants the missing glow seeds found before night, but hurried searches and spells fail, so Fern listens for their living shoots.",
    failedAttempt: "Every group searches the expected hiding places while search spells point only at their casters, finding no seeds.",
    resolution: "Fern discovers she planted them two nights earlier; the group protects the glowing seedlings where they are growing.",
    pages: [
      "Luna finds the glow-seed box open and empty.",
      "Without its seeds, Moonwood paths may darken tonight.",
      "The friends divide the forest into search routes.",
      "Pip finds marsh mud; Flint finds three unmapped turns, but no seeds.",
      "Wren and Spark's search spells point at each other.",
      "Burrow checks every tunnel and returns with empty paws.",
      "Dewdrop scans the stream while Fern listens beside the clearing.",
      "A faint hum rises from small gold-green shoots under Fern's leaves.",
      "Fern remembers planting every seed there two nights ago.",
      "The searchers return and find seedlings lighting the clearing.",
      "Luna checks their roots. Moving them now would cause damage.",
      "That night, protected seedlings mark every path around Hollow Oak."
    ]
  }),
  "moonwood-tales-c-20": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-LUNA", "MOON-STONE", "MOON-WREN", "MOON-FLINT", "MOON-SPARK", "MOON-LOCAL-C20-STAR-SPIRITS"],
    storySpine: "The friends want fallen star spirits returned before dawn, but tossing them from the clearing fails, so they carry them to Tumblerock Cliffs.",
    failedAttempt: "Pip tosses one spirit upward from the clearing, but it falls back and bounces away.",
    resolution: "The group climbs to Moonwood's highest safe ledge and lifts each spirit until the sky draws it home.",
    pages: [
      "Near midnight, small gold lights fall from the sky into Moonwood.",
      "They bounce, giggle, and leave glowing trails across the ground.",
      "Pip catches one warm spirit with enormous golden eyes.",
      "It says only, \"Star. Fell.\" Pip holds it close.",
      "Luna explains fallen star spirits must return before dawn.",
      "Pip lifts one from ground level. The sky does not pull it.",
      "Luna says the sky can pull them only from Moonwood's highest ledge.",
      "Flint leads everyone correctly to Tumblerock Cliffs.",
      "They climb while the star spirits reach toward the dark sky.",
      "Stone lifts both hands as Pip and Spark guide the bouncing lights.",
      "One by one, the sky draws each spirit into its old place.",
      "The last spirit blinks at Stone, then rises before dawn."
    ]
  }),
  "moonwood-tales-c-21": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-WREN", "MOON-LUNA", "MOON-BURROW", "MOON-FERN", "MOON-LOCAL-C21-TWIG"],
    storySpine: "Pip wants to identify scratching inside Hollow Oak, but searching every known room fails, so Burrow follows the sound through a root door.",
    failedAttempt: "Pip, Wren, Burrow, and Fern search every ordinary room without finding the speaker inside the walls.",
    resolution: "Fern meets Twig, returns her spectacles, and helps make a larger door that preserves Twig's private room.",
    pages: [
      "Late at Hollow Oak, Pip hears scratching and a voice searching for something.",
      "Wren listens beside him. The sound moves inside the root wall.",
      "Luna admits the scratching is old, though its source escapes her.",
      "Four friends search every known room and find nothing.",
      "Burrow's nose locates a tiny root door hidden behind moss.",
      "Fern fits through and calls back that someone lives inside.",
      "A warm room holds collected objects and one searching creature.",
      "Twig asks Fern to help find spectacles missing for three days.",
      "Fern sees them resting on top of Twig's head.",
      "Twig returns to sorting the room she has always called home.",
      "Fern tells the others Twig wants company, not a different room.",
      "They widen her door. Twig joins one biscuit, then walks home."
    ]
  }),
  "moonwood-tales-c-22": fictionRewrite({
    level: "C",
    canonIds: ["MOON-LUNA", "MOON-PIP", "MOON-FERN", "MOON-STONE", "MOON-DEWDROP", "MOON-WREN", "MOON-FLINT", "MOON-GLIMMER", "MOON-SPARK", "MOON-BURROW"],
    storySpine: "Moonwood's runners want to finish a marked race, but Wren's wide-circle speed spell scatters them, so Dewdrop returns from the finish to guide everyone home.",
    failedAttempt: "Wren's shortcut accelerates nearby racers but not herself, sending Glimmer, Spark, and Stone off balance and Flint off route.",
    resolution: "Dewdrop finishes, turns back along the marked course, and helps every racer reach Luna's final count.",
    pages: [
      "Luna marks a race from Hollow Oak to stream, cliffs, and back.",
      "Pip runs while Fern flies, Stone trots, and Wren reads a spell.",
      "Flint takes two confident left turns and reaches Fog Marsh.",
      "Wren casts a wide-circle speed spell. Everyone nearby shoots ahead except Wren.",
      "Glimmer bumps Spark, whose hat and gold sparkles fly apart.",
      "Stone catches a root and lowers slowly like a sitting cliff.",
      "Pip slips into Crystal Stream, climbs out, and follows the markers.",
      "Racers scatter while Wren closes the spell book and walks the true route.",
      "Dewdrop crosses first, then turns back instead of waiting.",
      "She guides Flint, Spark, Stone, and wet Pip through the final markers.",
      "Luna counts everyone before Burrow tunnels up beside the line.",
      "Dewdrop earns the finish leaf and a second leaf for returning."
    ]
  }),
  "moonwood-tales-c-23": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-LUNA", "MOON-FERN", "MOON-DEWDROP", "MOON-LOCAL-C23-MARSH-SPIRIT"],
    storySpine: "Pip wants to stop Fog Marsh spreading, but marking its edge only proves the mist keeps moving, so the group enters and finds the crowded spirit's cause.",
    failedAttempt: "Pip marks the fog line with a stick, but days later the mist crosses it and the edge mushrooms go dark.",
    resolution: "The group removes the dumped objects, marks the marsh boundary, and the spirit condenses as its mushrooms glow again.",
    pages: [
      "Pip marks Fog Marsh's edge when grey mist creeps nearer Hollow Oak.",
      "Days later, fog crosses his stick while edge mushrooms go dark.",
      "Luna enters with Pip, Fern, and Dewdrop to find the cause.",
      "Dewdrop follows still-water ripples while Luna, Pip, and Fern cross the marsh bridge.",
      "At the centre, a grey mist spirit rests against a dead tree.",
      "It says its home shrinks whenever Moonwood leaves objects behind.",
      "Rope, lamp, and torn mushroom caps crowd the marsh edge.",
      "Pip recognises things his neighbours abandoned without checking the boundary.",
      "They carry every object out while Dewdrop clears the blocked water.",
      "With space restored, the spirit stands in one clear shape.",
      "At Hollow Oak, each neighbour places a boundary stone.",
      "Fog holds behind the line as edge mushrooms relight one by one."
    ]
  }),
  "moonwood-tales-c-24": fictionRewrite({
    level: "C",
    canonIds: ["MOON-GLIMMER", "MOON-LUNA", "MOON-PIP", "MOON-STONE"],
    storySpine: "After smoke, warmth, sparks, and one accidental flare, Glimmer wants one controlled flame, but excitement breaks the second attempt, so Glimmer resets safely.",
    failedAttempt: "Glimmer's first tiny flame goes out, and excitement interrupts the longer second flame, requiring a full safety pause.",
    resolution: "Under Luna's supervision, Glimmer lights one magic lantern inside the fire circle, and the lantern network carries that careful light.",
    pages: [
      "After weeks of smoke, warmth, sparks, and one wild flare, Glimmer enters Luna's fire circle.",
      "Water, extinguisher, stone boundary, and watching friends are ready.",
      "Glimmer breathes out. One tiny orange flame burns steadily, then fades.",
      "Pip covers his mouth while Luna checks every stone.",
      "A second flame grows longer but stays inside the circle.",
      "Excitement breaks Glimmer's breath. Luna calls a full pause.",
      "After resetting, Glimmer aims one small flame at a magic lantern.",
      "The lantern sends its spark to the next lamp, as its old rule allows.",
      "Safe golden light travels through Moonwood's lamps and mushrooms.",
      "Glimmer checks the glowing path, then checks the unburned circle.",
      "Luna names the success: one careful flame; the lanterns carried everything else.",
      "Glimmer closes their mouth. Friends stay outside the circle while Luna checks every safety tool."
    ]
  }),
  "moonwood-tales-c-25": fictionRewrite({
    level: "C",
    canonIds: ["MOON-PIP", "MOON-STONE", "MOON-BURROW", "MOON-WREN", "MOON-LUNA", "MOON-GLIMMER", "MOON-LOCAL-C25-SILVER-EYE"],
    storySpine: "Pip wants to return a frightened silver-eyed creature to the Deep Dark, but Luna's surface paths become indistinguishable, so Burrow finds its underground route.",
    failedAttempt: "Luna's surface route reaches a place where every dark path looks alike, and the group stops rather than guess.",
    resolution: "Burrow discovers the homeward tunnel, the creature rejoins its family, and a silver blink confirms the safe return.",
    pages: [
      "Deep at night, a small sound reaches the clearing edge.",
      "Pip finds one frightened creature with enormous silver eyes.",
      "He kneels without reaching. The creature chooses two steps closer.",
      "Inside, Stone offers one acorn biscuit while everyone keeps space.",
      "The creature points outside and says, \"Home. Deep Dark.\"",
      "Pip offers to return it, and the friends choose to travel together.",
      "Luna leads while Glimmer uses one small, supervised path flame.",
      "Beyond Glimmer's small flame, every path looks alike. The group stops instead of guessing.",
      "Burrow smells familiar soil and uncovers a tunnel below the roots.",
      "Silver moss lights a warm clearing filled with matching eyes.",
      "The creature runs to its family, who gather around without fear.",
      "On the walk back, one silver light blinks twice from home."
    ]
  })
});
