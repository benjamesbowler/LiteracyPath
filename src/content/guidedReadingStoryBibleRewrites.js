/*
 * Locked Story Bible manuscripts for Guided Reading.
 *
 * These overrides are deliberately separate from the imported asset catalogues: the
 * pictures retain their stable paths while the child-facing manuscript can be reviewed,
 * fingerprinted and narrated word for word. Every entry records the story evidence used
 * by the publication gate.
 */

function fictionReview({ title, canonIds = [], storySpine, failedAttempt, resolution, sourcePageNumbers, pages }) {
  return Object.freeze({
    format: "guided-reading-book",
    kind: "fiction",
    ...(title ? { title } : {}),
    canonIds: Object.freeze(canonIds),
    storySpine,
    failedAttempt,
    resolution,
    ...(sourcePageNumbers ? { sourcePageNumbers: Object.freeze(sourcePageNumbers) } : {}),
    pages: Object.freeze(pages)
  });
}

function nonfictionReview({ title, level, topicQuestion, progression, synthesis, pages }) {
  return Object.freeze({
    format: "guided-reading-book",
    kind: "nonfiction",
    title,
    ...(level ? { level } : {}),
    topicQuestion,
    progression,
    synthesis,
    pages: Object.freeze(pages)
  });
}

export const GUIDED_READING_STORY_BIBLE_REWRITES = Object.freeze({
  "bob-and-nan-01": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan each want a running pal and discover one another.",
    failedAttempt: "Each child runs alone before they meet.",
    resolution: "They rest together as new pals.",
    pages: [
      "Bob wants a running pal.",
      "Bob runs alone.",
      "Nan wants a running pal.",
      "Nan runs alone.",
      "Bob and Nan meet.",
      "Their tired legs sit.",
      "Bob and Nan are pals!"
    ]
  }),
  "bob-and-nan-02-park": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan want to reach the top of the park hill together.",
    failedAttempt: "Running fast tires them before the hill.",
    resolution: "They slow down and reach the top together.",
    pages: [
      "Bob and Nan visit the park.",
      "Bob runs too fast.",
      "Nan runs too fast.",
      "Bob rests on the swing.",
      "Nan rests there too.",
      "They climb the big hill.",
      "They reach the top together!"
    ]
  }),
  "bob-and-nan-03-fluff": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-FLUFF", "HUMAN-MUM"],
    storySpine: "Bob and Nan find a lonely puppy and safely try to locate its family.",
    failedAttempt: "The puppy has no tag, and calling nearby does not find an owner.",
    resolution: "Mum helps them report the puppy found and care for him while they search.",
    pages: [
      "Bob and Nan sit outside.",
      "Bob sees a lonely pup.",
      "The pup runs to Nan.",
      "The pup has no name tag.",
      "Nan calls. No owner comes.",
      "Mum helps report the pup found.",
      "They care for the pup Fluff."
    ]
  }),
  "bob-and-nan-04-beach": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan want to build a sand fort before the tide arrives.",
    failedAttempt: "A wave knocks down their first fort.",
    resolution: "They rebuild together farther from the water.",
    pages: [
      "Bob and Nan reach the beach.",
      "They want a sand fort.",
      "Bob digs the wall.",
      "Nan digs the tower.",
      "A wave knocks it down.",
      "They build again together.",
      "The new fort stands!"
    ]
  }),
  "bob-and-nan-05-school": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan want to enter their new classroom and join the first activity.",
    failedAttempt: "Each waits alone at the doorway because the room feels unfamiliar.",
    resolution: "They walk in together, find their name cards and begin drawing.",
    pages: [
      "Today is their first school day.",
      "Bob holds his bag.",
      "Nan holds her bag.",
      "Bob stops at the classroom door.",
      "Nan stops there too.",
      "They find their name cards.",
      "They sit down and draw together."
    ]
  }),
  "bob-and-nan-06-zoo": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan want to spot every animal on their zoo card.",
    failedAttempt: "They see large animals but cannot find the small frog.",
    resolution: "Nan spots the hidden frog and they complete the visit.",
    pages: [
      "Their zoo card shows six animals.",
      "Bob spots a big cat.",
      "Nan spots a red bird.",
      "They spot the big fish.",
      "Nan finds the hidden frog.",
      "Bob spots the big ape.",
      "The ape eats a fig.",
      "Their zoo card is complete!"
    ]
  }),
  "bob-and-nan-07-birthday": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Nan wants to give Bob a birthday he can join and enjoy.",
    failedAttempt: "The tightly wrapped gift will not open at first.",
    resolution: "Bob opens the bat and celebrates with Nan.",
    pages: [
      "Today is Bob's birthday.",
      "Nan brings one big gift.",
      "The paper will not rip.",
      "Bob pulls harder.",
      "A red bat pops out!",
      "They share the big cake.",
      "They run and hop.",
      "Bob loves his birthday!"
    ]
  }),
  "bob-and-nan-08-sick": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-MUM", "HUMAN-FLUFF"],
    storySpine: "Bob and Nan want enough strength to play again.",
    failedAttempt: "A short rest is not enough.",
    resolution: "Longer rest and a warm drink help them recover.",
    pages: [
      "Bob feels too ill to play.",
      "Bob rests in bed.",
      "Nan feels too ill to play.",
      "One nap is not enough.",
      "Mum brings a warm drink.",
      "They sip and rest.",
      "Bob and Nan feel well!",
      "They run with Fluff!"
    ]
  }),
  "bob-and-nan-09-read": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-FLUFF"],
    storySpine: "Bob wants to read Nan's book by himself.",
    failedAttempt: "The first word is too hard for Bob.",
    resolution: "Nan helps him blend the sounds and Bob reads a sentence.",
    pages: [
      "Nan has a red book.",
      "Bob cannot read it yet.",
      "Nan helps Bob.",
      "Bob blends cat.",
      "Bob reads one sentence.",
      "Bob can read!",
      "They read together.",
      "Fluff naps beside them."
    ]
  }),
  "bob-and-nan-10-vet": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-FLUFF"],
    storySpine: "Bob and Nan want the vet to help Fluff's sore leg.",
    failedAttempt: "Rest at home has not fixed the pain.",
    resolution: "The vet treats Fluff and he runs comfortably again.",
    pages: [
      "Fluff has a sore leg.",
      "Rest does not help.",
      "They take Fluff to the vet.",
      "Fluff sits on the bed.",
      "The vet checks his leg.",
      "Fluff gets his medicine.",
      "Fluff stands without pain.",
      "Fluff can run again!"
    ]
  }),

  "meadow-pals-01-muddy-has-a-bath": fictionReview({
    canonIds: ["MEADOW-MUDDY", "MEADOW-SPLASHY"],
    storySpine: "Muddy must get clean for supper.",
    failedAttempt: "His first bath becomes muddy too.",
    resolution: "Muddy washes again and stays clean.",
    pages: [
      "Muddy rolls in the mud.",
      "Supper starts soon.",
      "Muddy needs a bath.",
      "Muddy jumps into the bath.",
      "The water turns brown.",
      "Muddy is still muddy.",
      "He washes once more.",
      "Muddy stays out of mud.",
      "Clean Muddy joins supper."
    ]
  }),
  "meadow-pals-02-woolly-cant-sleep": fictionReview({
    canonIds: ["MEADOW-WOOLLY", "MEADOW-NOISY"],
    storySpine: "Woolly wants to sleep despite the meadow noises.",
    failedAttempt: "Listening for every noise keeps Woolly awake.",
    resolution: "Woolly notices the noises stop and sleeps.",
    pages: [
      "Woolly wants to sleep.",
      "The wind goes hoo.",
      "Woolly listens for more.",
      "A bug goes buzz.",
      "Woolly listens again.",
      "Hungry goes moo.",
      "Woolly is still awake.",
      "The wind stops. The meadow rests.",
      "Woolly falls asleep."
    ]
  }),
  "meadow-pals-03-clucky-lays-an-egg": fictionReview({
    canonIds: ["MEADOW-CLUCKY"],
    storySpine: "Clucky wants a safe, clean place for her egg.",
    failedAttempt: "The nest, log, box and hat do not feel right.",
    resolution: "Clucky lays the egg, then moves it from the mud.",
    pages: [
      "Clucky needs a safe nest.",
      "The nest feels too high.",
      "The log feels too hard.",
      "The box feels too small.",
      "The hat tips over.",
      "Clucky sits in the mud.",
      "Her egg arrives!",
      "Clucky moves it to straw."
    ]
  }),
  "meadow-pals-04-bouncy-wont-stop": fictionReview({
    canonIds: ["MEADOW-BOUNCY", "MEADOW-GRUMPY"],
    storySpine: "Bouncy wants to hop without bumping her friends.",
    failedAttempt: "Hopping everywhere upsets Grumpy and Clucky.",
    resolution: "Bouncy finds an open field for hopping.",
    pages: [
      "Bouncy loves to hop.",
      "She hops by Grumpy.",
      "Bouncy bumps his bucket.",
      "She hops by Clucky.",
      "Bouncy bumps her basket.",
      "Bouncy stops and looks.",
      "She hops in the field."
    ]
  }),
  "meadow-pals-05-grumpy-gets-a-surprise": fictionReview({
    canonIds: ["MEADOW-GRUMPY", "MEADOW-TINY"],
    storySpine: "The Meadow Pals want Grumpy to enjoy one birthday treat.",
    failedAttempt: "Hats and a loud surprise make Grumpy retreat.",
    resolution: "A quiet slice of cake suits him.",
    pages: [
      "Today is Grumpy's birthday.",
      "Grumpy dislikes birthday noise.",
      "He pushes away the hats.",
      "He hides from the crowd.",
      "The loud surprise fails.",
      "Tiny brings quiet cake.",
      "Grumpy tastes one bite.",
      "Grumpy takes another bite.",
      "The cake is nearly gone.",
      "Quiet cake makes Grumpy smile."
    ]
  }),
  "meadow-pals-06-sleepy-cant-wake-up": fictionReview({
    canonIds: ["MEADOW-SLEEPY", "MEADOW-CLUCKY", "MEADOW-BOUNCY", "MEADOW-NOISY"],
    storySpine: "The friends need Sleepy awake for breakfast.",
    failedAttempt: "Calling louder does not keep Sleepy up.",
    resolution: "The smell of breakfast brings Sleepy to the table.",
    pages: [
      "Breakfast is ready.",
      "Sleepy does not wake.",
      "Clucky taps the bed.",
      "Sleepy stays asleep.",
      "Bouncy shakes the bell.",
      "Sleepy still snores.",
      "Noisy shouts too loudly.",
      "Breakfast smells reach Sleepy.",
      "Sleepy joins the table."
    ]
  }),
  "meadow-pals-07-noisy-tries-to-be-quiet": fictionReview({
    canonIds: ["MEADOW-NOISY", "MEADOW-SLEEPY"],
    storySpine: "Noisy wants to stay quiet near Sleepy's bed.",
    failedAttempt: "A bug makes Noisy yell.",
    resolution: "Noisy whispers when the worm appears.",
    pages: [
      "Sleepy needs quiet.",
      "Noisy closes his beak.",
      "A bug lands on Noisy.",
      "Noisy yells very loudly.",
      "Sleepy starts to wake.",
      "Noisy tries again.",
      "A worm wiggles past.",
      "Noisy whispers about it.",
      "Sleepy keeps sleeping.",
      "Noisy stays quiet!"
    ]
  }),
  "meadow-pals-08-tiny-is-very-small": fictionReview({
    canonIds: ["MEADOW-TINY"],
    storySpine: "Tiny wants to retrieve a key from a narrow log.",
    failedAttempt: "The larger friends cannot reach through the narrow opening.",
    resolution: "Tiny's small size lets him enter the log and fetch the key.",
    pages: [
      "A key falls inside a log.",
      "The hole is very small.",
      "A big hoof cannot fit.",
      "A wide wing cannot reach.",
      "Everyone looks at Tiny.",
      "Tiny is small enough.",
      "Tiny crawls inside.",
      "Tiny finds the key.",
      "Tiny brings back the key."
    ]
  }),
  "meadow-pals-09-shy-comes-out-to-play": fictionReview({
    canonIds: ["MEADOW-SHY", "MEADOW-BOUNCY", "MEADOW-CUDDLY"],
    storySpine: "Shy wants to join a game but feels safer near the barn.",
    failedAttempt: "Fast invitations make Shy hide again.",
    resolution: "Cuddly waits quietly and Shy chooses to join.",
    pages: [
      "Shy wants to play.",
      "Shy waits behind the barn.",
      "Bouncy rushes over.",
      "Shy hides again.",
      "Cuddly sits nearby.",
      "Cuddly waits quietly.",
      "Shy steps outside.",
      "Shy sits beside Cuddly.",
      "They play together."
    ]
  }),
  "meadow-pals-10-giggly-has-the-hiccups": fictionReview({
    canonIds: ["MEADOW-GIGGLY"],
    storySpine: "Giggly wants the hiccups to stop before quiet time.",
    failedAttempt: "Drinking and jumping make the hiccups funnier, not better.",
    resolution: "Slow breathing stops them.",
    pages: [
      "Giggly has the hiccups.",
      "Hic! Hic! Hic!",
      "Giggles make them bigger.",
      "A drink does not help.",
      "Jumping does not help.",
      "Giggly breathes very slowly.",
      "The hiccups stop.",
      "One small hiccup returns.",
      "Giggly breathes slowly again."
    ]
  }),
  "meadow-pals-11-brave-climbs-the-hay-bale": fictionReview({
    canonIds: ["MEADOW-BRAVE"],
    storySpine: "Brave wants to reach the top of the hay bale.",
    failedAttempt: "Brave falls twice using the same steep side.",
    resolution: "Brave finds a gentler path and reaches the top.",
    pages: [
      "The hay bale is huge.",
      "Brave wants the top.",
      "Brave climbs the steep side.",
      "Brave falls into straw.",
      "Brave tries there again.",
      "Brave falls again.",
      "Brave finds a lower step.",
      "Brave reaches the top!",
      "Brave stands very tall.",
      "Brave climbs down safely."
    ]
  }),
  "meadow-pals-12-hungry-eats-everything": fictionReview({
    canonIds: ["MEADOW-HUNGRY"],
    storySpine: "Hungry wants enough suitable food for lunch.",
    failedAttempt: "A little grass and hay do not fill him.",
    resolution: "Hungry asks at the gate and receives a full meal with water.",
    pages: [
      "Hungry eats some grass.",
      "Hungry eats some hay.",
      "Hungry is still hungry.",
      "Hungry asks at the gate.",
      "The farmer brings fresh hay.",
      "Hungry eats and drinks.",
      "Hungry feels full now."
    ]
  }),
  "meadow-pals-13-splashy-finds-a-puddle": fictionReview({
    canonIds: ["MEADOW-SPLASHY", "MEADOW-GRUMPY", "MEADOW-CLUCKY", "MEADOW-SLEEPY"],
    storySpine: "Splashy wants a puddle big enough for jumping without soaking friends.",
    failedAttempt: "Jumping near the beds splashes everyone.",
    resolution: "Splashy moves to an empty puddle.",
    pages: [
      "Splashy finds a small puddle.",
      "Splashy wants a bigger splash.",
      "Splashy jumps inside.",
      "Splashy jumps even higher.",
      "Water spreads everywhere.",
      "Grumpy's feet get wet.",
      "Clucky's hat gets wet.",
      "Sleepy's bed gets wet.",
      "Splashy moves beyond the gate."
    ]
  }),
  "meadow-pals-14-speedy-slows-down": fictionReview({
    canonIds: ["MEADOW-SPEEDY", "MEADOW-TINY"],
    storySpine: "Speedy wants to race home but runs too quickly to notice the path.",
    failedAttempt: "Speedy races past every landmark and becomes lost.",
    resolution: "Speedy stops, listens to Tiny and follows the path home.",
    pages: [
      "Speedy races toward home.",
      "Speedy passes the barn.",
      "Speedy passes the pond.",
      "Speedy passes the hill.",
      "Speedy misses the path.",
      "No one sees Speedy.",
      "Speedy is lost.",
      "Speedy stops and listens.",
      "Tiny calls from home.",
      "Speedy follows the path home."
    ]
  }),
  "meadow-pals-15-cuddly-wants-a-hug": fictionReview({
    canonIds: ["MEADOW-CUDDLY", "MEADOW-GRUMPY", "MEADOW-SPLASHY", "MEADOW-SPEEDY", "MEADOW-MUDDY", "MEADOW-WOOLLY"],
    storySpine: "Cuddly wants a hug and must find a willing friend.",
    failedAttempt: "Several friends cannot hug at that moment.",
    resolution: "Cuddly asks Woolly, who freely agrees.",
    pages: [
      "Cuddly wants a hug.",
      "Grumpy does not want one.",
      "Splashy is too wet.",
      "Speedy rushes past.",
      "Muddy is covered in mud.",
      "Cuddly waits.",
      "Cuddly asks Woolly.",
      "Woolly gives one big hug.",
      "Cuddly asks for another.",
      "Woolly chooses one more."
    ]
  }),
  "meadow-pals-16-muddy-and-splashy-make-a-mess": fictionReview({
    canonIds: ["MEADOW-MUDDY", "MEADOW-SPLASHY", "MEADOW-GRUMPY"],
    storySpine: "Muddy and Splashy want a mud pool without covering Grumpy.",
    failedAttempt: "Their first giant jump splashes Grumpy.",
    resolution: "They move the pool and clean their friend.",
    pages: [
      "Muddy brings some mud.",
      "Splashy brings some water.",
      "They make a mud pool.",
      "They jump together.",
      "Mud flies upward.",
      "Mud falls everywhere.",
      "Mud covers Grumpy.",
      "They wash Grumpy clean.",
      "They move beyond the gate."
    ]
  }),
  "meadow-pals-17-bouncy-and-speedy-have-a-race": fictionReview({
    canonIds: ["MEADOW-BOUNCY", "MEADOW-SPEEDY"],
    storySpine: "Bouncy and Speedy want to race to the hill and return.",
    failedAttempt: "They race past the turning point.",
    resolution: "They stop, turn together and share the finish.",
    pages: [
      "Speedy plans a race.",
      "Bouncy joins the race.",
      "They start together.",
      "Speedy runs beside Bouncy.",
      "They pass the barn.",
      "They pass the pond.",
      "They pass the hill.",
      "The turn is behind them!",
      "They stop and turn.",
      "They finish together."
    ]
  }),
  "meadow-pals-18-noisy-wakes-everyone-up": fictionReview({
    canonIds: ["MEADOW-NOISY", "MEADOW-GRUMPY", "MEADOW-WOOLLY", "MEADOW-CLUCKY", "MEADOW-SLEEPY"],
    storySpine: "Noisy wants to start morning at the correct time.",
    failedAttempt: "Noisy calls before sunrise and wakes the meadow too early.",
    resolution: "Noisy waits for daylight before calling again.",
    pages: [
      "The meadow is dark.",
      "Noisy thinks morning has come.",
      "Noisy calls very loudly.",
      "Three friends wake.",
      "Sleepy stays asleep.",
      "Noisy calls again.",
      "Sleepy opens one eye.",
      "The sky is still dark.",
      "Noisy waits for sunrise."
    ]
  }),
  "meadow-pals-19-tiny-and-brave-go-on-an-adventure": fictionReview({
    canonIds: ["MEADOW-TINY", "MEADOW-BRAVE"],
    storySpine: "Tiny and Brave want to recover Tiny's hat after the wind blows it away.",
    failedAttempt: "The hat is trapped inside a narrow log that Brave cannot enter.",
    resolution: "Tiny's small size lets him crawl through the log and retrieve it.",
    pages: [
      "Wind lifts Tiny's red hat.",
      "Tiny and Brave chase it.",
      "The hat falls into a log.",
      "Brave cannot fit inside.",
      "Tiny crawls through the log.",
      "Tiny reaches the red hat.",
      "Tiny carries it outside.",
      "Brave ties the hat under Tiny's chin.",
      "They walk home together."
    ]
  }),
  "meadow-pals-20-shy-and-cuddly-find-each-other": fictionReview({
    canonIds: ["MEADOW-SHY", "MEADOW-CUDDLY"],
    storySpine: "Cuddly wants a friend and Shy wants company without being rushed.",
    failedAttempt: "Cuddly searches the ground while Shy hides above.",
    resolution: "Cuddly finds Shy, asks before hugging and they sit together.",
    pages: [
      "Cuddly looks for a friend.",
      "Shy hides nearby.",
      "Cuddly checks behind the tree.",
      "Shy waits in the branches.",
      "Shy makes a small sound.",
      "Cuddly looks up.",
      "They sit in the tree.",
      "Cuddly asks for a hug.",
      "Shy says yes.",
      "They watch the pond together."
    ]
  }),
  "meadow-pals-21-woolly-and-grumpy-are-stuck": fictionReview({
    canonIds: ["MEADOW-WOOLLY", "MEADOW-GRUMPY", "MEADOW-TINY"],
    storySpine: "Woolly and Grumpy want to untangle Woolly's wool from Grumpy's horn.",
    failedAttempt: "Pulling and moving together tightens the tangle.",
    resolution: "They stop, and Tiny gently frees the wool.",
    pages: [
      "Woolly and Grumpy are stuck.",
      "Wool catches Grumpy's horn.",
      "They pull too hard.",
      "They both move left.",
      "They both move right.",
      "The knot gets tighter.",
      "They stop moving.",
      "Tiny frees the wool.",
      "They walk different ways."
    ]
  }),
  "meadow-pals-22-sleepys-big-dream": fictionReview({
    canonIds: ["MEADOW-SLEEPY"],
    storySpine: "Sleepy wants to finish a dream race before waking.",
    failedAttempt: "Waking interrupts the dream before the finish.",
    resolution: "Sleepy returns to sleep and completes the dream.",
    pages: [
      "Sleepy closes his eyes.",
      "A bright dream begins.",
      "Dream Sleepy runs fast.",
      "Dream Sleepy jumps high.",
      "The finish is near.",
      "Sleepy becomes a hero.",
      "Sleepy wakes too soon.",
      "Dream Sleepy crosses the finish line."
    ]
  }),
  "meadow-pals-23-giggly-and-clucky-bake-a-cake": fictionReview({
    canonIds: ["MEADOW-GIGGLY", "MEADOW-CLUCKY"],
    sourcePageNumbers: [1, 2, 3, 4, 5, 7, 8, 10, 11],
    storySpine: "Giggly and Clucky want to bake a tall cake for tea.",
    failedAttempt: "Giggly's flour play leaves the first cake flat.",
    resolution: "They laugh, measure again and share the next cake.",
    pages: [
      "Clucky plans a tall cake.",
      "Clucky brings the eggs.",
      "Clucky brings the flour.",
      "Giggly spills the flour.",
      "Giggly stops and cleans the mess.",
      "The cake goes inside.",
      "A flat cake comes out.",
      "They measure and bake again.",
      "They share the tall cake."
    ]
  }),
  "meadow-pals-24-grumpys-secret": fictionReview({
    canonIds: ["MEADOW-GRUMPY", "MEADOW-TINY", "MEADOW-WOOLLY", "MEADOW-CLUCKY", "MEADOW-BOUNCY"],
    sourcePageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11],
    storySpine: "Tiny wants to learn where Grumpy goes each day without spoiling his privacy.",
    failedAttempt: "Asking the meadow gives Tiny no answer.",
    resolution: "Tiny finds Grumpy's garden and keeps the surprise until the flowers bloom.",
    pages: [
      "Grumpy leaves every morning.",
      "Tiny wonders where he goes.",
      "Woolly does not know.",
      "Clucky does not know.",
      "Bouncy does not know.",
      "Tiny follows the path.",
      "Grumpy tends a garden.",
      "He waters tiny shoots.",
      "Grumpy shows everyone.",
      "Tiny keeps the surprise."
    ]
  }),
  "meadow-pals-25-the-big-farm-party": fictionReview({
    canonIds: ["MEADOW-MUDDY", "MEADOW-CLUCKY", "MEADOW-NOISY", "MEADOW-BOUNCY", "MEADOW-TINY", "MEADOW-SHY", "MEADOW-CUDDLY", "MEADOW-GRUMPY"],
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 13],
    storySpine: "The Meadow Pals want every friend, including Shy and Grumpy, to enjoy the farm party.",
    failedAttempt: "The first party is too loud and crowded for them.",
    resolution: "The friends lower the music and make a quiet place where everyone joins.",
    pages: [
      "Today is party day!",
      "Muddy makes a mud cake.",
      "Clucky makes a fruit cake.",
      "Noisy plays loud music.",
      "Tiny hangs the flags.",
      "Shy hides behind the barn.",
      "Cuddly finds Shy.",
      "Grumpy sits far away.",
      "The friends lower the music.",
      "Shy and Grumpy join the party."
    ]
  }),

  "gr-a-26": nonfictionReview({
    topicQuestion: "Which animals can be pets and what do they need?",
    progression: "Each page introduces a familiar pet before the ending gathers their shared care needs.",
    synthesis: "Different pets all need suitable food, shelter and gentle care.",
    pages: [
      "A dog can be a pet.",
      "A cat can be a pet.",
      "A fish can be a pet.",
      "A bird can be a pet.",
      "A rabbit can be a pet.",
      "Every pet needs gentle care."
    ]
  }),
  "gr-a-27": nonfictionReview({
    topicQuestion: "What is the Sun and how does it affect Earth?",
    progression: "The pages move from the Sun's identity to light, heat, plant growth and safe observation.",
    synthesis: "Earth receives light and warmth from its nearest star.",
    pages: [
      "The Sun is a star.",
      "Sunlight brightens our day.",
      "Sunlight warms land and water.",
      "Plants use sunlight to grow.",
      "Never stare at the Sun.",
      "Earth travels around the Sun."
    ]
  }),
  "gr-a-28": nonfictionReview({
    topicQuestion: "Which colours can familiar objects appear?",
    progression: "Each page pairs a visible object with a possible colour.",
    synthesis: "The ending gathers colour as something we observe across the world.",
    pages: [
      "An apple can look red.",
      "A clear sky can look blue.",
      "The Sun can look yellow.",
      "Healthy grass can look green.",
      "A cloud can look white.",
      "Colours appear all around us."
    ]
  }),
  "gr-a-29": nonfictionReview({
    topicQuestion: "Which visible parts make up one child's body?",
    progression: "The pages move from paired sense organs to the mouth and hands.",
    synthesis: "The ending gathers the parts into one valued body.",
    pages: [
      "I have two eyes.",
      "I have two ears.",
      "I have one nose.",
      "I have one mouth.",
      "I have two hands.",
      "This whole body is mine."
    ]
  }),
  "gr-b-31": nonfictionReview({
    topicQuestion: "How can seasons change in a temperate place?",
    progression: "The pages follow one year through spring, summer, autumn and winter.",
    synthesis: "The final page frames the examples as one repeating yearly cycle.",
    pages: [
      "In many temperate places spring brings rain.",
      "Summer often brings longer warm days.",
      "Many leaves change colour in autumn.",
      "Winter can bring frost or snow.",
      "Each season changes plants and weather.",
      "The four seasons repeat each year."
    ]
  }),
  "gr-b-32": nonfictionReview({
    topicQuestion: "Which foods are fruits?",
    progression: "Each page identifies a familiar fruit before the ending states a shared plant feature.",
    synthesis: "Fruits grow from flowers and contain seeds.",
    pages: [
      "An apple is a fruit.",
      "A banana is a fruit.",
      "A grape is a fruit.",
      "An orange is a fruit.",
      "Fruits can taste sweet or sour.",
      "Fruits grow from flowers."
    ]
  }),
  "gr-b-33": nonfictionReview({
    topicQuestion: "What jobs do common tools perform?",
    progression: "Each page pairs one tool with its main function.",
    synthesis: "The ending joins tools as equipment used carefully to build and repair.",
    pages: [
      "A hammer drives nails.",
      "A saw cuts wood.",
      "A wrench turns bolts.",
      "A drill makes holes.",
      "A ruler measures length.",
      "Adults use tools carefully."
    ]
  }),
  "gr-b-34": nonfictionReview({
    topicQuestion: "Why do day and night take turns?",
    progression: "The sequence shows sunlight, Earth's rotation, sunset, darkness and the next sunrise.",
    synthesis: "Earth's turning creates the repeating day-night cycle.",
    pages: [
      "Sunlight reaches one side of Earth.",
      "That side has daytime.",
      "Earth keeps turning.",
      "Our place turns away from sunlight.",
      "Then our sky becomes dark.",
      "Earth turns us toward sunlight again."
    ]
  }),
  "gr-b-35": nonfictionReview({
    topicQuestion: "How do different community workers help people?",
    progression: "Each page names one worker and a concrete service.",
    synthesis: "The ending gathers these roles as people working together in a community.",
    pages: [
      "A chef prepares food.",
      "A doctor treats people who are ill.",
      "A firefighter fights fires.",
      "A teacher helps children learn.",
      "Police officers respond to emergencies.",
      "Many workers help our community."
    ]
  }),
  "gr-c-37": nonfictionReview({
    level: "B",
    topicQuestion: "What forms can water take and why is it needed?",
    progression: "The pages identify liquid water, ice, invisible vapour and two living needs.",
    synthesis: "The ending gathers water as necessary for life.",
    pages: [
      "Water can flow as a liquid.",
      "Frozen water becomes solid ice.",
      "Water vapour mixes invisibly with air.",
      "Plants need water to grow.",
      "People need water to live.",
      "Life on Earth needs water."
    ]
  }),
  "gr-c-38": nonfictionReview({
    level: "B",
    topicQuestion: "How do our five senses collect information?",
    progression: "Each page connects one sense organ or body system to its job.",
    synthesis: "The ending explains that senses work together for learning.",
    pages: [
      "Eyes help us see.",
      "Ears help us hear.",
      "Noses help us smell.",
      "Tongues help us taste.",
      "Skin helps us feel touch.",
      "Our senses help us learn."
    ]
  }),
  "gr-c-39": nonfictionReview({
    level: "B",
    topicQuestion: "How can flat shapes appear in everyday objects?",
    progression: "Each page links an object's outline or face to a named two-dimensional shape.",
    synthesis: "The ending invites readers to notice shapes rather than mislabelling whole objects.",
    pages: [
      "A wheel face looks circular.",
      "This sign face looks square.",
      "This roof edge forms a triangle.",
      "A book cover looks rectangular.",
      "An egg outline looks oval.",
      "We can spot shapes on objects."
    ]
  }),
  "gr-d-42": nonfictionReview({
    level: "B",
    topicQuestion: "Which large features make Earth our shared home?",
    progression: "The pages move from Earth as a whole to land, water, mountains, oceans and forests.",
    synthesis: "The ending connects people to responsibility for shared places.",
    pages: [
      "Earth is our home planet.",
      "Earth has land and water.",
      "Mountains rise above the land.",
      "Deep oceans cover much of Earth.",
      "Forests grow on many continents.",
      "People share and care for Earth."
    ]
  }),
  "gr-d-43": nonfictionReview({
    level: "B",
    topicQuestion: "Which daily habits support health?",
    progression: "The pages move through hygiene, varied food, water, dental care and rest.",
    synthesis: "The ending gathers habits as repeated actions that help bodies.",
    pages: [
      "I wash my hands with soap.",
      "I eat many kinds of food.",
      "I drink water every day.",
      "I brush twice each day.",
      "I make time for sleep.",
      "Healthy habits help my body."
    ]
  }),
  "gr-d-44": nonfictionReview({
    level: "B",
    title: "Animal Shelters and Habitats",
    topicQuestion: "Where can animals shelter or find what they need?",
    progression: "The pages distinguish nests, dens, ponds, burrows and webs by their different uses.",
    synthesis: "The ending names habitat needs without claiming every animal uses one kind of home.",
    pages: [
      "Many birds build nests for young.",
      "Some bears rest in sheltered dens.",
      "Ponds provide fish food and shelter.",
      "Rabbits shelter inside burrows.",
      "Spiders catch prey in webs.",
      "Habitats provide food water and shelter."
    ]
  }),
  "gr-d-45": nonfictionReview({
    level: "B",
    topicQuestion: "How do nearby space objects move and appear?",
    progression: "The sequence identifies Sun, Earth, Moon, stars and human space travel.",
    synthesis: "The ending places these examples within a vast universe.",
    pages: [
      "The Sun is our nearest star.",
      "Earth travels around the Sun.",
      "The Moon travels around Earth.",
      "Stars seem to twinkle from Earth.",
      "Astronauts travel beyond Earth's air.",
      "Space extends far beyond our view."
    ]
  }),
  "gr-e-46": nonfictionReview({
    level: "B",
    topicQuestion: "Which traits are common among reptiles?",
    progression: "The pages move from skin and eggs to examples and temperature regulation.",
    synthesis: "The ending explains how external warmth affects reptile activity.",
    pages: [
      "Reptiles have dry scaly skin.",
      "Most reptiles lay eggs.",
      "Snakes are reptiles without legs.",
      "Turtles carry hard protective shells.",
      "Many lizards bask in warm places.",
      "Outside heat changes reptile body temperature."
    ]
  }),
  "gr-e-47": nonfictionReview({
    level: "B",
    title: "Living Things Change",
    topicQuestion: "How can living things change as time passes?",
    progression: "The pages compare plant growth with animal growth and metamorphosis without calling every process the same.",
    synthesis: "The ending distinguishes several visible forms of biological change.",
    pages: [
      "Living things change over time.",
      "Plants use light water and nutrients.",
      "A seedling can grow into a plant.",
      "A tadpole develops into a frog.",
      "A caterpillar transforms into a butterfly.",
      "Growth and metamorphosis are different changes."
    ]
  }),
  "gr-e-48": nonfictionReview({
    level: "B",
    topicQuestion: "What can magnets attract or repel?",
    progression: "The pages identify poles, magnetic materials, non-magnetic materials and pole interactions.",
    synthesis: "The ending contrasts attraction and repulsion.",
    pages: [
      "A magnet has two poles.",
      "Magnets attract some metals.",
      "Magnets do not attract wood.",
      "Magnets do not attract glass.",
      "Opposite poles attract each other.",
      "Matching poles push apart."
    ]
  }),
  "gr-e-49": nonfictionReview({
    level: "B",
    topicQuestion: "How can clothes suit weather and activity?",
    progression: "Each page pairs a garment with a visible condition or purpose.",
    synthesis: "The ending gathers clothing as protection and comfort.",
    pages: [
      "Hats shade us on sunny days.",
      "Coats help us stay warm.",
      "Boots keep feet dry in rain.",
      "Gloves help warm our hands.",
      "Pyjamas are clothes for sleeping.",
      "Clothes can protect and warm us."
    ]
  }),
  "gr-e-50": nonfictionReview({
    level: "B",
    topicQuestion: "How do our senses help us explore?",
    progression: "Each page connects one sense to its body system and action.",
    synthesis: "The ending explains that the senses work together.",
    pages: [
      "We use our eyes to see.",
      "We use our ears to hear.",
      "We use our nose to smell.",
      "We use our tongue to taste.",
      "We use our skin for touch.",
      "Our senses help us explore."
    ]
  }),

  "first-facts-a-01-look-at-the-colours": nonfictionReview({
    title: "Colours We Can See",
    topicQuestion: "Which colours can natural and everyday objects appear?",
    progression: "Each page introduces one colour through two qualified visible examples.",
    synthesis: "The ending asks readers to transfer the colour words to their surroundings.",
    pages: [
      "An apple can look red. A robin has an orange-red breast.",
      "The Sun can look yellow. This duck has yellow feathers.",
      "A clear sky looks blue. Forget-me-nots can have blue petals.",
      "Healthy grass looks green. This frog has green skin.",
      "This fox has orange fur. This pumpkin has orange skin.",
      "These grapes look purple. Lavender can have purple flowers.",
      "Colours appear all around us. Which can you see?"
    ]
  }),
  "first-facts-a-02-the-four-seasons": nonfictionReview({
    title: "Seasons in a Temperate Place",
    topicQuestion: "How can one temperate place change across four seasons?",
    progression: "The pages follow spring, summer, autumn and winter with qualified local examples.",
    synthesis: "The ending names the repeating seasonal cycle without claiming it looks identical everywhere.",
    pages: [
      "Spring can bring new flowers and birdsong.",
      "Some animals have young during spring.",
      "Summer often brings longer warm days.",
      "Many plants grow and fruit in summer.",
      "Some leaves change colour during autumn.",
      "Animals prepare for colder months in different ways.",
      "Winter can bring frost or snow.",
      "People and animals find ways to keep warm.",
      "These four seasons repeat through each year."
    ]
  }),
  "first-facts-a-03-little-seeds-grow": nonfictionReview({
    title: "A Seed Germinates",
    topicQuestion: "How can one flowering-plant seed begin to grow?",
    progression: "The sequence follows planting, water, root, shoot, leaves and flower in biological order.",
    synthesis: "The final flower visibly completes one seed-to-plant example.",
    pages: [
      "This tiny seed holds a young plant.",
      "Place the seed in suitable soil.",
      "Water enters the seed and starts germination.",
      "A root grows downward first.",
      "A green shoot pushes above the soil.",
      "Leaves use sunlight while roots absorb water.",
      "The growing plant can produce a flower."
    ]
  }),
  "first-facts-a-04-what-is-weather": nonfictionReview({
    topicQuestion: "Which conditions make up weather?",
    progression: "The pages move through sunlight, rain, wind, snow, cloud, storm and rainbow conditions.",
    synthesis: "The ending gathers weather as conditions that can change.",
    pages: [
      "Sunny weather brings bright sunlight.",
      "Rainy weather brings drops from clouds.",
      "Windy weather moves leaves and branches.",
      "Snowy weather brings frozen flakes.",
      "Cloudy weather can block some sunlight.",
      "Lightning flashes before thunder reaches our ears.",
      "Sunlight through water drops can make a rainbow.",
      "Weather can change from day to day."
    ]
  }),
  "first-facts-a-05-flowers-and-trees": nonfictionReview({
    title: "Flowering Plants and Trees",
    topicQuestion: "How do flowering plants and trees use their parts?",
    progression: "The pages compare varied flowers, roots, leaves and evergreen or deciduous trees.",
    synthesis: "The ending gathers shared plant needs without claiming all flowers look alike.",
    pages: [
      "Many flowers have petals stems and roots.",
      "Sunflowers can grow tall with yellow petals.",
      "Daisies often have small white petals.",
      "Roses come in many colours and may have prickles.",
      "Tree roots anchor trees and absorb water.",
      "Some trees lose their leaves each year.",
      "Evergreen trees keep living leaves through every season.",
      "Plants need light water nutrients and space."
    ]
  }),
  "first-facts-a-06-baby-animals": nonfictionReview({
    topicQuestion: "What are young animals called and how do they change?",
    progression: "Each page names one young animal and a visible feature or action.",
    synthesis: "The ending gathers growth without assigning universal colours or textures.",
    pages: [
      "A young dog is called a puppy.",
      "A young cat is called a kitten.",
      "A young cow is called a calf.",
      "A young chicken is called a chick.",
      "A young sheep is called a lamb.",
      "A young horse is called a foal.",
      "A young duck is called a duckling.",
      "Young animals grow and learn new skills."
    ]
  }),
  "first-facts-a-07-animals-on-the-farm": nonfictionReview({
    topicQuestion: "What can we observe about animals on one farm?",
    progression: "The pages identify food, body covering, products and movement without universal colour claims.",
    synthesis: "The ending frames farms as places where animals need skilled care.",
    pages: [
      "This cow eats grass and hay.",
      "A cow with a calf can produce milk.",
      "This pig cools its skin in mud.",
      "A sheep grows a woolly fleece.",
      "A hen can lay eggs.",
      "Horses can pull or carry loads.",
      "This duck swims across the pond.",
      "Farm animals need food water shelter and care."
    ]
  }),
  "first-facts-a-08-animals-in-the-ocean": nonfictionReview({
    topicQuestion: "How are different ocean animals adapted to life in water?",
    progression: "The sequence moves through fins, breathing, arms, shells, gripping and social swimming.",
    synthesis: "The ending gathers the animals as a diverse ocean community.",
    pages: [
      "Oceans contain many different animals.",
      "Fish use fins to move through water.",
      "Blue whales are Earth's largest animals and breathe air.",
      "An octopus has eight arms and can change colour.",
      "A crab's hard shell protects its body.",
      "A seahorse can grip plants with its tail.",
      "Dolphins breathe air and often live in groups.",
      "Ocean animals survive in many different ways."
    ]
  }),
  "first-facts-a-09-animals-at-night": nonfictionReview({
    topicQuestion: "How do some nocturnal animals find food after dark?",
    progression: "Each page gives one observable night-time adaptation or behaviour with suitable qualification.",
    synthesis: "The ending gathers nocturnal activity without claiming all species behave identically.",
    pages: [
      "Nocturnal animals are active mostly at night.",
      "Owls can see well in low light.",
      "Many bats use echoes to find flying insects.",
      "Hedgehogs may search for insects after dark.",
      "Foxes use hearing and smell while hunting.",
      "Different animals become busy after sunset."
    ]
  }),
  "first-facts-a-10-bugs-all-around-us": nonfictionReview({
    title: "Small Creatures Around Us",
    topicQuestion: "How do different small invertebrates live and help ecosystems?",
    progression: "The pages distinguish insects from worms and snails while showing their different roles.",
    synthesis: "The ending gathers the group as small creatures rather than calling all of them bugs.",
    pages: [
      "Many small creatures live near us.",
      "Butterflies are insects with four wings.",
      "Bees carry pollen between flowers.",
      "Ladybirds are insects that eat aphids.",
      "Ants are insects that live in colonies.",
      "Earthworms mix and tunnel through soil.",
      "Snails are molluscs with muscular feet.",
      "Small creatures perform many ecosystem jobs."
    ]
  }),
  "first-facts-a-11-pets-we-love": nonfictionReview({
    title: "Caring for Pets",
    topicQuestion: "What does responsible care look like for different pets?",
    progression: "The pages pair common pets with species-appropriate needs and behaviours.",
    synthesis: "The ending gathers care as food, water, shelter, health and gentle attention.",
    pages: [
      "Dogs need play exercise and rest.",
      "Dogs also need food water and veterinary care.",
      "Cats purr for several reasons.",
      "Rabbits need space hay shelter and company.",
      "Pet fish need suitable clean water.",
      "Hamsters need safe space for natural activity.",
      "Every pet needs informed gentle care."
    ]
  }),
  "first-facts-a-12-shapes-everywhere": nonfictionReview({
    title: "Shapes on Everyday Objects",
    topicQuestion: "Where can we find flat shapes on three-dimensional objects?",
    progression: "Each page defines a shape before locating that outline or face on an object.",
    synthesis: "The ending asks readers to identify shapes without confusing them with whole objects.",
    pages: [
      "A circle is round. A wheel face looks circular.",
      "A square has four equal sides. Some windows look square.",
      "A triangle has three sides. This roof edge forms one.",
      "A rectangle has four sides. This door face looks rectangular.",
      "A five-point star is a drawn shape.",
      "An oval is a stretched-circle shape. This egg outline looks oval.",
      "We can find flat shapes on many objects."
    ]
  }),
  "first-facts-a-13-big-and-small": nonfictionReview({
    topicQuestion: "How does size change when two things are compared?",
    progression: "Each page makes one explicit paired comparison rather than assigning absolute size.",
    synthesis: "The ending explains that big and small depend on what is compared.",
    pages: [
      "An elephant is big beside a mouse.",
      "The mouse is small beside the elephant.",
      "A bus is big beside a toy car.",
      "A tree is big beside a flower.",
      "A whale is big beside this fish.",
      "Size depends on what we compare."
    ]
  }),
  "first-facts-a-14-hot-and-cold": nonfictionReview({
    topicQuestion: "Which things have higher or lower temperatures?",
    progression: "The pages compare sunlight, fire, ice, food and water while including safety cues.",
    synthesis: "The ending names hot and cold as temperature descriptions.",
    pages: [
      "Sunlight can warm our skin.",
      "Fire is very hot. Stay back.",
      "Ice and snow have low temperatures.",
      "Let hot food cool before eating.",
      "Cool water can feel refreshing.",
      "Hot and cold describe temperature.",
      "We can compare temperatures safely."
    ]
  }),
  "first-facts-a-15-things-that-float-and-sink": nonfictionReview({
    title: "Why Things Float or Sink",
    topicQuestion: "How do material density and shape affect floating?",
    progression: "Paired examples disprove the heavy-sinks rule before a supervised comparison.",
    synthesis: "The ending states that weight alone cannot predict floating.",
    pages: [
      "A hollow toy duck can float.",
      "A dense stone usually sinks in water.",
      "A leaf may float while a coin sinks.",
      "A heavy hollow boat can float.",
      "Shape and material both affect floating.",
      "Test safe objects with an adult.",
      "Weight alone does not decide."
    ]
  }),
  "first-facts-a-16-push-and-pull": nonfictionReview({
    topicQuestion: "How can pushes, pulls and magnets change motion?",
    progression: "The pages move from contact forces to motion examples and magnetic attraction or repulsion.",
    synthesis: "The ending gathers these interactions as forces.",
    pages: [
      "A push can move something away.",
      "A pull can bring something closer.",
      "Doors can move with pushes or pulls.",
      "A push makes this swing move.",
      "A pull opens this zip.",
      "A magnet attracts this steel paperclip.",
      "Forces can change an object's motion."
    ]
  }),
  "first-facts-a-17-hello-sun": nonfictionReview({
    title: "Watching the Sun Safely",
    topicQuestion: "Why does the Sun seem to cross our sky?",
    progression: "The pages identify the Sun, its effects, apparent movement, delayed daily heating and safety.",
    synthesis: "The ending connects apparent motion to Earth's rotation.",
    pages: [
      "The Sun is our nearest star.",
      "Sunlight brightens and warms Earth.",
      "Earth's turning makes sunrise appear.",
      "Daily temperatures often peak after midday.",
      "Earth's turning makes sunset appear.",
      "Never look directly at the Sun.",
      "Earth's rotation changes the Sun's position in our sky."
    ]
  }),
  "first-facts-a-18-the-moon": nonfictionReview({
    topicQuestion: "Why does the Moon shine and seem to change shape?",
    progression: "The pages explain reflected sunlight, phases, orbit, daytime visibility and human exploration.",
    synthesis: "The ending gathers the Moon as Earth's changing natural satellite.",
    pages: [
      "The Moon is Earth's natural satellite.",
      "Sunlight reflects from the Moon's surface.",
      "We see different sunlit parts during Moon phases.",
      "A full Moon shows its fully lit face.",
      "The Moon travels around Earth.",
      "People have walked on the Moon.",
      "The Moon can appear by day or night."
    ]
  }),
  "first-facts-a-19-day-and-night": nonfictionReview({
    topicQuestion: "How does Earth's rotation create day and night?",
    progression: "Every observational page remains tied to Earth's sunlit and dark sides.",
    synthesis: "The ending returns to the repeating rotation cycle.",
    pages: [
      "Sunlight brightens one side of Earth.",
      "Places facing the Sun have daytime.",
      "Earth rotates all day and night.",
      "Places turned away from sunlight have night.",
      "The Moon may appear by day or night.",
      "Earth's rotation creates day and night.",
      "The cycle repeats as Earth turns."
    ]
  }),
  "first-facts-a-20-my-five-senses": nonfictionReview({
    topicQuestion: "How do five sensory systems help one child learn?",
    progression: "The pages connect sight, hearing, smell, taste and touch to accurate body systems.",
    synthesis: "The ending gathers senses as systems that work together.",
    pages: [
      "My senses help me learn about the world.",
      "My eyes detect light colour and shape.",
      "My ears detect sounds.",
      "My nose detects smells.",
      "My tongue detects tastes.",
      "Skin across my body senses touch and temperature.",
      "My senses work together every day.",
      "Which senses are you using now?"
    ]
  }),
  "first-facts-a-21-how-i-grow": nonfictionReview({
    title: "Ways I Grow",
    topicQuestion: "How can one child change and learn over time?",
    progression: "The pages move from infancy through movement, strength, learning and varied future change.",
    synthesis: "The ending values growth without promising one body size or timetable.",
    pages: [
      "As a baby I needed help moving.",
      "Later I learned to sit and crawl.",
      "My muscles strengthened as I practised walking.",
      "I learned new ways to move.",
      "Now I can do more things.",
      "Food sleep activity and care support growth.",
      "People grow in different ways and times."
    ]
  }),
  "first-facts-a-22-staying-healthy": nonfictionReview({
    title: "Habits That Support Health",
    topicQuestion: "Which everyday habits can support health?",
    progression: "The pages cover varied food, water, movement, hygiene, dental care and sleep without moral labels.",
    synthesis: "The ending gathers flexible habits rather than demanding a mood or body type.",
    pages: [
      "Eating varied foods gives our bodies nutrients.",
      "Drinking water replaces fluid our bodies use.",
      "Movement can strengthen hearts muscles and bones.",
      "Soap and water remove many germs from hands.",
      "Brush teeth twice daily with fluoride toothpaste.",
      "Enough sleep supports learning health and mood.",
      "Small repeated habits can support health."
    ]
  }),
  "first-facts-a-23-my-body": nonfictionReview({
    topicQuestion: "Which body parts help one child act and sense?",
    progression: "The pages move from head to limbs, digestion, senses and whole-body movement.",
    synthesis: "The ending affirms body ownership and care.",
    pages: [
      "My head holds my face and brain.",
      "My arms and hands can clap.",
      "My stomach helps digest food.",
      "My legs and feet help me move.",
      "My eyes ears and nose gather information.",
      "My whole body can move in many ways.",
      "I care for my body every day.",
      "My body belongs to me."
    ]
  }),
  "first-facts-a-24-rocks-and-pebbles": nonfictionReview({
    topicQuestion: "How can rocks and pebbles vary and change?",
    progression: "The pages move through size, texture, colour, uses, age and close observation.",
    synthesis: "The ending places rocks as materials within Earth's crust.",
    pages: [
      "Rocks can be hard large or small.",
      "Pebbles are small rocks that may be smooth.",
      "Moving water can slowly smooth pebbles.",
      "Rocks occur in many colours.",
      "People use rock in roads and walls.",
      "Rock layers can preserve clues from long ago.",
      "Observe rocks without removing protected specimens."
    ]
  }),
  "first-facts-a-25-water-everywhere": nonfictionReview({
    topicQuestion: "Where is water found and how can it change state?",
    progression: "The pages move through oceans, rain, freshwater, human use, living needs and three states.",
    synthesis: "The ending gathers Earth as a planet with abundant but precious water.",
    pages: [
      "Water fills oceans rivers and clouds.",
      "Water drops can fall as rain.",
      "Rain can refill rivers and lakes.",
      "People drink water every day.",
      "Water helps us wash.",
      "Plants and animals need water.",
      "Water can be liquid ice or invisible vapour.",
      "Clean fresh water is precious.",
      "Water shapes our blue planet."
    ]
  }),

  "level-c-nonfiction-01-bees": nonfictionReview({
    title: "Honeybees and Pollination",
    topicQuestion: "How do honeybees share hive work and help flowering plants reproduce?",
    progression: "The sequence follows hive roles, nectar, honey, pollen transfer, crop pollination and practical help.",
    synthesis: "The ending connects a honeybee colony's work to both food stores and plant reproduction.",
    pages: [
      "Thousands of bee species exist. This book follows social honeybees.",
      "A honeybee colony shares one hive. Its queen lays eggs.",
      "Worker honeybees collect sugary nectar from flowers.",
      "Back at the hive workers process nectar into honey.",
      "Pollen sticks to bees and moves between flowers.",
      "Pollination helps many flowering plants make seeds and fruit.",
      "Producing honey takes thousands of flower visits and shared work.",
      "Pesticide-free flowering plants can provide bees with food.",
      "Honeybees store honey while helping many plants reproduce."
    ]
  }),
  "level-c-nonfiction-02-volcanoes": nonfictionReview({
    topicQuestion: "How do volcanoes form, erupt and change Earth's surface?",
    progression: "The pages move from magma to vents, eruption styles, islands, soil, global examples and monitoring.",
    synthesis: "The ending gathers destructive and constructive effects without treating a volcano as the erupting magma itself.",
    pages: [
      "Deep underground some rock melts into hot magma.",
      "A volcano is an opening and landform where material reaches Earth's surface.",
      "Erupted magma becomes lava. Some lava flows slowly.",
      "Explosive eruptions can release ash rocks and volcanic gases.",
      "Repeated underwater eruptions can build new volcanic islands.",
      "Weathered volcanic rock can form mineral-rich soil.",
      "Active volcanoes occur in Iceland Hawaii Italy Indonesia and elsewhere.",
      "Volcanologists monitor earthquakes gases and ground movement for warning signs.",
      "Across immense time volcanoes have built land and reshaped Earth."
    ]
  }),
  "level-c-nonfiction-03-penguins": nonfictionReview({
    title: "Emperor Penguins and Their Relatives",
    topicQuestion: "How do emperor penguins survive and how do other penguin species differ?",
    progression: "The sequence follows swimming anatomy, Antarctic conditions, egg care, chicks, diving, colonies, countershading and warmer-climate species.",
    synthesis: "The ending places emperor adaptations within a diverse penguin family.",
    pages: [
      "Penguins are flightless birds whose wings work as swimming flippers.",
      "Emperor penguins survive Antarctica's extreme cold and wind.",
      "A male balances one egg on his feet beneath warm skin.",
      "Fathers huddle while mothers feed at sea before returning.",
      "New chicks depend on parents for warmth and food.",
      "Emperors dive deeply and swim quickly while hunting fish.",
      "Calls help partners and chicks recognise one another in colonies.",
      "Dark backs and pale fronts provide underwater camouflage called countershading.",
      "Eighteen penguin species live from Antarctica to warmer southern coasts."
    ]
  }),
  "level-c-nonfiction-04-the-moon": nonfictionReview({
    topicQuestion: "What causes the Moon's light, phases, craters and effects on Earth?",
    progression: "The pages connect orbit, reflected light, phases, impacts, exploration, tides, samples, scale and continued motion.",
    synthesis: "The ending keeps the Moon present even when its lit portion is not visible.",
    pages: [
      "The rocky Moon orbits Earth about once each month.",
      "The Moon reflects sunlight rather than making its own light.",
      "Moon phases reveal changing portions of its sunlit half.",
      "Ancient impacts made bowl-shaped craters across the surface.",
      "Apollo 11 astronauts first walked on the Moon in 1969.",
      "The Moon's gravity drives most tides while the Sun also contributes.",
      "Returned Moon rocks reveal clues about the early Solar System.",
      "The Moon is about one quarter as wide as Earth.",
      "Visible or hidden the Moon continues travelling around Earth."
    ]
  }),
  "level-c-nonfiction-05-how-seeds-grow": nonfictionReview({
    title: "How a Flowering Plant Grows",
    topicQuestion: "How can one flowering plant germinate, grow, reproduce and disperse seeds?",
    progression: "The sequence follows a scoped seed through germination, root, shoot, photosynthesis, pollination, new seeds and dispersal.",
    synthesis: "The ending invites observation of the same evidence-based cycle.",
    pages: [
      "Many flowering plants begin as seeds containing embryos and food stores.",
      "Germination needs water oxygen and a suitable temperature.",
      "A root emerges first and absorbs water from soil.",
      "A shoot reaches light and opens its first leaves.",
      "Leaves use light water and carbon dioxide during photosynthesis.",
      "Flowers can attract animals that transfer pollen.",
      "After fertilisation seeds develop inside fruit pods or other structures.",
      "Wind water and animals can carry seeds away.",
      "With suitable conditions a new flowering-plant cycle can begin."
    ]
  }),
  "level-c-nonfiction-06-spiders": nonfictionReview({
    topicQuestion: "How do spider bodies, silk and senses support survival?",
    progression: "The sequence compares anatomy, silk production, web types, hunting, sensing, feeding, reproduction and ecological roles.",
    synthesis: "The ending places spiders as varied arachnid predators rather than dangerous pests.",
    pages: [
      "Spiders are arachnids with eight legs and two main body sections.",
      "Spinnerets produce several kinds of strong flexible silk.",
      "Orb-weavers build spoke-and-spiral webs that trap flying insects.",
      "Other spiders build sheet or tangled webs for different prey.",
      "Jumping spiders stalk prey and judge distance with large eyes.",
      "Many web-builders detect prey through vibrations in silk.",
      "Some spiders wrap captured insects and subdue them with venom.",
      "Silk egg sacs protect developing spiderlings.",
      "Most spiders cannot harm people and help control insect populations."
    ]
  }),
  "level-c-nonfiction-07-under-the-ocean": nonfictionReview({
    topicQuestion: "How do ocean depth, light and pressure shape habitats?",
    progression: "The pages descend from surface waters through reefs, twilight, darkness, trenches and global oxygen production.",
    synthesis: "The ending returns to the vast portion of ocean still unobserved.",
    pages: [
      "Oceans cover over two thirds of Earth and remain largely unexplored.",
      "Sunlit surface water becomes colder dimmer twilight below about 200 metres.",
      "Warm shallow coral reefs support remarkably diverse communities.",
      "Tiny coral animals build hard skeletons that can form reefs.",
      "Between 200 and 1000 metres faint light favours unusual adaptations.",
      "Below about 1000 metres darkness makes bioluminescence especially useful.",
      "The Mariana Trench reaches nearly eleven kilometres below sea level.",
      "Ocean photosynthesis produces about half of Earth's oxygen.",
      "More than eighty percent of the ocean remains unmapped or unobserved."
    ]
  }),
  "level-c-nonfiction-08-butterflies": nonfictionReview({
    title: "The Monarch Butterfly Life Cycle",
    topicQuestion: "How does a monarch change through four life stages and migrate?",
    progression: "The pages move through insect anatomy, egg, caterpillar, chrysalis, metamorphosis, emergence, feeding and migration.",
    synthesis: "The ending connects several generations to one long migration cycle.",
    pages: [
      "Butterflies are six-legged insects with four wings and two antennae.",
      "A butterfly life cycle has four distinct stages.",
      "A monarch lays a tiny egg on milkweed.",
      "The caterpillar hatches eats milkweed and sheds its skin repeatedly.",
      "It hangs upside down and forms a green chrysalis.",
      "Inside the chrysalis metamorphosis reorganises the growing body.",
      "The adult emerges then expands dries and hardens its wings.",
      "A proboscis drinks nectar while feet can sense plant chemicals.",
      "Several monarch generations complete the vast yearly migration cycle."
    ]
  }),
  "level-c-nonfiction-09-caves": nonfictionReview({
    topicQuestion: "How do caves form and what histories or habitats can they preserve?",
    progression: "The sequence covers cave types, limestone dissolution, passages, mineral deposits, columns, bats, cave specialists and ancient art.",
    synthesis: "The ending gathers caves as slowly formed archives of geology, life and people.",
    pages: [
      "Water waves and lava can form different kinds of caves.",
      "Slightly acidic water slowly dissolves cracks in limestone.",
      "Over immense time connected tunnels and chambers can grow.",
      "Mineral deposits hanging from ceilings are called stalactites.",
      "Mineral deposits rising from floors are called stalagmites.",
      "Joined stalactites and stalagmites form stone columns.",
      "Some bats shelter in caves then feed outside after dusk.",
      "Cave specialists may evolve reduced eyes and pale bodies.",
      "Ancient cave art preserves evidence of people from long ago."
    ]
  }),
  "level-c-nonfiction-10-frogs": nonfictionReview({
    title: "The Common Frog Life Cycle",
    topicQuestion: "How does a common frog develop and live on land and in water?",
    progression: "The pages follow frogspawn, tadpole, metamorphosis, froglet, diet, breathing, colour and breeding calls.",
    synthesis: "The ending returns calls to their specific spring breeding purpose.",
    pages: [
      "Common frogs are amphibians that use freshwater and damp land.",
      "Females lay jelly-covered frogspawn in ponds during spring.",
      "Tadpoles hatch with tails and gills but no legs.",
      "Back legs then front legs grow as tails shrink during metamorphosis.",
      "A four-legged froglet leaves water but stays near damp cover.",
      "Common frogs eat small animals including insects worms and slugs.",
      "Moist skin and lungs both help adult frogs exchange gases.",
      "Variable brown green grey or red colours provide camouflage.",
      "Male common frogs make soft spring calls near breeding ponds."
    ]
  }),

  "first-facts-level-a-01-colors": nonfictionReview({
    topicQuestion: "What colours can we see on familiar things?",
    progression: "Each page pairs one colour with visible everyday objects.",
    synthesis: "The final page gathers the named colours.",
    pages: [
      "A ball and hat are red.",
      "A cup and bag are blue.",
      "The bright sun is yellow.",
      "The frog is green.",
      "A cat and bat are black.",
      "A pig and flower are pink.",
      "We can see many colours!"
    ]
  }),
  "first-facts-level-a-02-farm-animals": nonfictionReview({
    topicQuestion: "Which animals live on a farm and what sounds do they make?",
    progression: "Each page names one familiar farm animal and its sound.",
    synthesis: "The final page gathers the animals in their shared setting.",
    pages: [
      "A pig says oink.",
      "A hen says cluck.",
      "A cow says moo.",
      "A dog says woof.",
      "A duck says quack.",
      "A cat says meow.",
      "Many animals live on farms."
    ]
  }),
  "first-facts-level-a-03-big-and-little": nonfictionReview({
    topicQuestion: "How can two things differ in size?",
    progression: "Each page shows a concrete big and little comparison.",
    synthesis: "The last page repeats the comparison words in reverse order.",
    pages: [
      "Big dog. Little bug.",
      "Big fish. Little crab.",
      "Big bus. Little car.",
      "Big tree. Little seed.",
      "Big sun. Little moon.",
      "Big hat. Little cap.",
      "Things can be big or little."
    ]
  }),
  "first-facts-level-a-04-water": nonfictionReview({
    topicQuestion: "Who uses water and how?",
    progression: "The sequence moves from people using water to animals living in it.",
    synthesis: "The ending states the shared need for water.",
    pages: [
      "We drink water.",
      "We play in water.",
      "We wash with water.",
      "Fish swim in water.",
      "Ducks swim in water.",
      "Frogs hop into water.",
      "All living things need water."
    ]
  }),
  "first-facts-level-a-05-the-sky": nonfictionReview({
    topicQuestion: "What can we see in the sky?",
    progression: "Pages move from natural objects to living and human-made flyers.",
    synthesis: "The final page invites a full-sky observation.",
    pages: [
      "The Sun shines above us.",
      "The Moon glows at night.",
      "Stars shine at night.",
      "A bird flies above us.",
      "A cloud floats above us.",
      "A jet flies very fast.",
      "Look up at the wide sky."
    ]
  }),
  "first-facts-level-a-06-animals-can": nonfictionReview({
    topicQuestion: "How do different animals move?",
    progression: "Each page names one animal and one visible movement.",
    synthesis: "The ending connects animal movement to the child reader.",
    pages: [
      "A dog can run.",
      "A cat can jump.",
      "A fish can swim.",
      "A bird can fly.",
      "A frog can hop.",
      "A worm can dig.",
      "I can move too!"
    ]
  }),
  "first-facts-level-a-07-bugs": nonfictionReview({
    title: "Small Creatures",
    topicQuestion: "What can small bugs do?",
    progression: "The pages introduce distinct bugs and observable behaviours.",
    synthesis: "The ending asks readers to notice nearby small creatures.",
    pages: [
      "A little bug can fly.",
      "A bee can sting.",
      "An ant can dig.",
      "A worm digs through soil.",
      "A bug can hide.",
      "A bug can crawl.",
      "Small bugs live all around us."
    ]
  }),
  "first-facts-level-a-08-my-pet": nonfictionReview({
    title: "Pets We Care For",
    topicQuestion: "What do different pets need?",
    progression: "Each page links one pet to its home or body feature.",
    synthesis: "The final page describes care as friendship.",
    pages: [
      "A dog sleeps in a bed.",
      "A cat rests on a mat.",
      "A fish swims in a tank.",
      "A bird sings from its perch.",
      "A rabbit has soft fur.",
      "Every pet needs a name.",
      "Every pet needs gentle care."
    ]
  }),
  "first-facts-level-a-09-hot-and-cold": nonfictionReview({
    topicQuestion: "Which familiar things feel hot or cold?",
    progression: "The pages alternate clear examples of heat and cold.",
    synthesis: "The ending contrasts the two temperature words.",
    pages: [
      "The Sun feels hot.",
      "Ice feels cold.",
      "Fire feels very hot.",
      "Snow feels very cold.",
      "Soup can be hot.",
      "Milk can be cold.",
      "Hot and cold feel different."
    ]
  }),
  "first-facts-level-a-10-shapes": nonfictionReview({
    topicQuestion: "Which shapes appear in familiar objects?",
    progression: "Each page names an object and its matching shape.",
    synthesis: "The ending asks the reader to find another shape.",
    pages: [
      "A ball looks round.",
      "A box face is square.",
      "A door looks rectangular.",
      "A pie slice is triangular.",
      "Shapes are all around us.",
      "Wheels are circles.",
      "Which shape can you find?"
    ]
  }),
  "first-facts-level-a-11-at-the-farm": nonfictionReview({
    topicQuestion: "What can we notice on a farm?",
    progression: "The sequence tours a barn, animals, plants and a working dog.",
    synthesis: "The ending gathers the visit as one place.",
    pages: [
      "A red barn stands tall.",
      "A pig says oink.",
      "A chick says peep.",
      "A cow says moo.",
      "Green grass grows beside hay.",
      "A farm dog runs fast.",
      "There is much to see."
    ]
  }),
  "first-facts-level-a-12-in-the-sea": nonfictionReview({
    topicQuestion: "How do sea animals move?",
    progression: "Each page names one sea animal and a characteristic movement.",
    synthesis: "The ending connects water movement to the reader.",
    pages: [
      "A fish swims with a swish.",
      "A shark swims very fast.",
      "A crab crawls sideways.",
      "A huge whale swims far.",
      "A seal swims and dives.",
      "A turtle swims slowly.",
      "People can swim too!"
    ]
  }),
  "first-facts-level-a-13-fruit": nonfictionReview({
    topicQuestion: "How do familiar fruits look and feel?",
    progression: "Each page links one fruit to a visible colour, shape or texture.",
    synthesis: "The ending gathers fruits as food we can enjoy.",
    pages: [
      "A red apple tastes sweet.",
      "A yellow banana feels soft.",
      "A purple plum is small.",
      "An orange is round.",
      "A grape is small and round.",
      "Fruit is good to eat.",
      "Fruit has many bright colours."
    ]
  }),
  "first-facts-level-a-14-the-tree": nonfictionReview({
    title: "The Apple Tree",
    topicQuestion: "Which parts make up a tree?",
    progression: "The pages move from the whole tree to roots, trunk, branches, leaves and fruit.",
    synthesis: "The ending returns to the complete living tree.",
    pages: [
      "The tree grows tall.",
      "Roots grow under the ground.",
      "The trunk holds the tree.",
      "Branches reach toward the sky.",
      "Green leaves catch sunlight.",
      "Red apples grow on branches.",
      "Every part helps the tree."
    ]
  }),
  "first-facts-level-a-15-baby-animals": nonfictionReview({
    topicQuestion: "What are different baby animals called and like?",
    progression: "Each page introduces one visible young animal.",
    synthesis: "The ending states the shared change from small to grown.",
    pages: [
      "This little chick is yellow.",
      "This lamb has white wool.",
      "This little kitten feels soft.",
      "This little puppy can run.",
      "This little cub has brown fur.",
      "This little calf drinks milk.",
      "Baby animals grow bigger."
    ]
  }),
  "first-facts-level-a-16-fast-and-slow": nonfictionReview({
    topicQuestion: "Which things move quickly and which move slowly?",
    progression: "The pages contrast fast machines with slow animals.",
    synthesis: "The ending asks readers to classify movement.",
    pages: [
      "A car can move fast.",
      "A bus can move fast.",
      "A jet moves very fast.",
      "A snail moves slowly.",
      "A worm moves slowly.",
      "A turtle does not rush.",
      "Is it fast or slow?"
    ]
  }),
  "first-facts-level-a-17-a-seed-grows": nonfictionReview({
    topicQuestion: "How does a seed become a flower?",
    progression: "The pages follow planting, water, root, shoot, leaf, bud and flower in order.",
    synthesis: "The flower visibly completes the growth sequence.",
    pages: [
      "A seed rests in soil.",
      "Rain wets the seed.",
      "A root grows down.",
      "A green shoot grows up.",
      "A leaf opens in sunlight.",
      "A small bud forms.",
      "The bud becomes a flower."
    ]
  }),
  "first-facts-level-a-18-my-body": nonfictionReview({
    topicQuestion: "What can different body parts help us do?",
    progression: "Each page connects one visible body part to a concrete action.",
    synthesis: "The ending gathers the parts into one valued body.",
    pages: [
      "My two eyes can see.",
      "My two ears can hear.",
      "My nose can smell.",
      "My mouth can eat.",
      "My two hands can clap.",
      "My two feet can run.",
      "My whole body is mine."
    ]
  }),
  "first-facts-level-a-19-day-and-night": nonfictionReview({
    topicQuestion: "What changes between day and night?",
    progression: "The sequence moves from sunlight through sunset to Moon and stars.",
    synthesis: "The ending names the repeating contrast.",
    pages: [
      "The Sun lights the blue sky.",
      "Daytime is bright.",
      "Birds sing during the day.",
      "The Sun sets.",
      "The Moon lights the dark sky.",
      "Stars shine at night.",
      "Day and night take turns."
    ]
  }),
  "first-facts-level-a-20-space": nonfictionReview({
    topicQuestion: "What can we find in space?",
    progression: "The pages introduce the Moon, Sun, Earth, Mars, Saturn and distant stars.",
    synthesis: "The ending places those objects in a vast shared setting.",
    pages: [
      "The Moon looks round.",
      "The Sun is a hot star.",
      "Earth is our blue home.",
      "Mars is a rocky planet.",
      "Wide rings circle Saturn.",
      "Many stars are far away.",
      "Space holds all these worlds."
    ]
  })
});
