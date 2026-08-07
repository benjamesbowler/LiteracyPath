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
      "They rest side by side.",
      "Bob and Nan are pals!"
    ]
  }),
  "bob-and-nan-02-park": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan want to enjoy the park together.",
    failedAttempt: "Bob runs ahead and reaches the swing alone.",
    resolution: "Nan catches up, and they climb the hill together.",
    pages: [
      "Bob and Nan reach the park.",
      "Bob runs to the swings.",
      "Nan runs to Bob.",
      "Bob swings on his own.",
      "Nan swings with Bob.",
      "They climb the big hill.",
      "Both reach the top!"
    ]
  }),
  "bob-and-nan-03-fluff": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-FLUFF"],
    storySpine: "Fluff wants to join Bob and Nan in the garden.",
    failedAttempt: "Fluff first approaches from across the garden.",
    resolution: "Gentle pats welcome Fluff between his pals.",
    pages: [
      "Bob and Nan sit outside.",
      "Their pup Fluff walks over.",
      "Fluff runs to Nan.",
      "Nan strokes his soft ears.",
      "Bob pats him gently.",
      "Fluff stays close.",
      "Fluff sits between his pals."
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
    failedAttempt: "Bob stops at the doorway until Nan smiles with him.",
    resolution: "They smile, sit together and begin drawing.",
    pages: [
      "Today is their first school day.",
      "Bob holds his bag.",
      "Nan holds her bag.",
      "Bob stops at the classroom door.",
      "Nan smiles. Bob smiles too.",
      "They sit together at one table.",
      "Soon they draw side by side."
    ]
  }),
  "bob-and-nan-06-zoo": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Bob and Nan want to spot every animal on their zoo card.",
    failedAttempt: "They see large animals but cannot find the small frog.",
    resolution: "They find the frog and elephant, completing the card.",
    pages: [
      "Their zoo card shows six animals.",
      "Bob spots a big cat.",
      "Nan spots a red bird.",
      "They spot the big fish.",
      "Nan finds the hidden frog.",
      "Bob spots the big ape.",
      "They spot the big elephant.",
      "Their zoo card is complete!"
    ]
  }),
  "bob-and-nan-07-birthday": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN"],
    storySpine: "Nan wants to give Bob a birthday he can join and enjoy.",
    failedAttempt: "The tightly wrapped gift will not open at first.",
    resolution: "Bob opens the bat, celebrates with Nan and rests beside Fluff.",
    pages: [
      "Today is Bob's birthday.",
      "Nan brings one big gift.",
      "The paper does not rip.",
      "Bob pulls harder.",
      "A red bat pops out!",
      "They share the big cake.",
      "They run and hop.",
      "Bob rests beside Nan and Fluff."
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
      "Mom brings a warm drink.",
      "They sip and rest.",
      "Bob and Nan feel well!",
      "They run with Fluff!"
    ]
  }),
  "bob-and-nan-09-read": fictionReview({
    canonIds: ["HUMAN-BOB", "HUMAN-NAN", "HUMAN-FLUFF"],
    storySpine: "Bob wants to read Nan's book by himself.",
    failedAttempt: "The first word is too hard for Bob.",
    resolution: "Bob reads with Nan while Fluff naps beside them.",
    pages: [
      "Nan has a red book.",
      "Bob cannot read it yet.",
      "Nan helps Bob.",
      "Bob sounds out cat.",
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
    resolution: "Muddy washes again and stays clean for supper.",
    pages: [
      "Muddy rolls in the mud.",
      "Supper starts soon.",
      "Muddy needs a bath.",
      "Muddy jumps into the bath.",
      "The water turns brown.",
      "Muddy is still muddy.",
      "He washes once more.",
      "Muddy stays out of mud.",
      "Muddy stays clean for supper."
    ]
  }),
  "meadow-pals-02-woolly-cant-sleep": fictionReview({
    canonIds: ["MEADOW-WOOLLY", "MEADOW-NOISY"],
    storySpine: "Woolly wants to sleep despite the meadow noises.",
    failedAttempt: "Listening for every noise keeps Woolly awake.",
    resolution: "Woolly stops listening for each noise and sleeps.",
    pages: [
      "Woolly wants to sleep.",
      "The wind goes hoo.",
      "Woolly listens for more.",
      "A bug goes buzz.",
      "Woolly listens again.",
      "Hungry goes moo.",
      "Woolly is still awake.",
      "Woolly stops listening.",
      "Woolly falls asleep."
    ]
  }),
  "meadow-pals-03-clucky-lays-an-egg": fictionReview({
    canonIds: ["MEADOW-CLUCKY"],
    storySpine: "Clucky wants a safe, clean place for her egg.",
    failedAttempt: "The nest, log, box and hat do not feel right.",
    resolution: "Clucky lays the egg in mud, then moves it to clean straw.",
    pages: [
      "Clucky needs a safe nest.",
      "The nest feels too high.",
      "The log feels too hard.",
      "The box feels too small.",
      "The hat tips over.",
      "Clucky sits in the mud.",
      "Her egg lands in the mud.",
      "Clucky moves her egg to straw."
    ]
  }),
  "meadow-pals-04-bouncy-wont-stop": fictionReview({
    canonIds: ["MEADOW-BOUNCY", "MEADOW-GRUMPY", "MEADOW-CLUCKY"],
    storySpine: "Bouncy's joyful hopping bumps Grumpy and Clucky before she chooses a safer pass.",
    failedAttempt: "She bumps Grumpy's bucket and ignores Clucky's warning before bumping the basket.",
    resolution: "Bouncy stops, notices her friends and hops past without another bump.",
    pages: [
      "Bouncy loves to hop.",
      "Bouncy hops down the path.",
      "Splash! She bumps Grumpy's bucket.",
      "Clucky tells Bouncy to stop.",
      "Bouncy bumps Clucky's basket.",
      "Bouncy stops. Her friends watch.",
      "Bouncy hops by. No more bumps!"
    ]
  }),
  "meadow-pals-05-grumpy-gets-a-surprise": fictionReview({
    canonIds: ["MEADOW-GRUMPY", "MEADOW-TINY"],
    storySpine: "The Meadow Pals want Grumpy to enjoy one birthday treat.",
    failedAttempt: "Hats and a loud surprise make Grumpy retreat.",
    resolution: "A quiet slice of cake suits him.",
    pages: [
      "Today is Grumpy's birthday.",
      "Grumpy does not want noise.",
      "He pushes the hats away.",
      "He hides from the crowd.",
      "His friends wait by the barn.",
      "Tiny brings a small cake.",
      "Grumpy tries one bite.",
      "He asks for one more bite.",
      "The cake is all gone.",
      "Grumpy smiles at his friends."
    ]
  }),
  "meadow-pals-06-sleepy-cant-wake-up": fictionReview({
    canonIds: ["MEADOW-SLEEPY", "MEADOW-CLUCKY", "MEADOW-BOUNCY", "MEADOW-NOISY"],
    storySpine: "The friends need Sleepy awake for breakfast.",
    failedAttempt: "Calling louder does not keep Sleepy up.",
    resolution: "Sleepy smells breakfast, wakes and joins the table.",
    pages: [
      "Hot toast is on the table.",
      "Sleepy does not wake.",
      "Clucky taps the bed.",
      "Sleepy stays in bed.",
      "Bouncy shakes the bell.",
      "Sleepy still snores.",
      "Noisy lets out a loud call.",
      "Sleepy smells hot toast.",
      "Sleepy joins the table."
    ]
  }),
  "meadow-pals-07-noisy-tries-to-be-quiet": fictionReview({
    canonIds: ["MEADOW-NOISY", "MEADOW-SLEEPY"],
    storySpine: "Noisy wants to stay quiet near Sleepy's bed.",
    failedAttempt: "A bug makes Noisy yell.",
    resolution: "Noisy whispers when the worm appears.",
    pages: [
      "Sleepy needs quiet to sleep.",
      "Noisy shuts his beak.",
      "A bug lands on Noisy.",
      "Noisy lets out one loud yell.",
      "Sleepy starts to wake.",
      "Noisy tries once more.",
      "A worm crawls past.",
      "Noisy points and whispers.",
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
      "Tiny brings the key. All cheer!"
    ]
  }),
  "meadow-pals-09-shy-comes-out-to-play": fictionReview({
    canonIds: ["MEADOW-SHY", "MEADOW-BOUNCY", "MEADOW-CUDDLY"],
    storySpine: "Shy wants to join a game but feels safer near the barn.",
    failedAttempt: "Fast invitations make Shy hide again.",
    resolution: "Cuddly waits quietly and Shy chooses to join.",
    pages: [
      "Shy wants to play.",
      "Shy waits by the barn.",
      "Bouncy runs up.",
      "Shy goes back in.",
      "Cuddly sits near Shy.",
      "Cuddly stays quite still.",
      "Shy steps out.",
      "Shy sits with Cuddly.",
      "Shy joins the game."
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
      "Her laughs make them worse.",
      "A sip does not help.",
      "A hop does not help.",
      "Giggly takes one slow breath.",
      "The hiccups stop.",
      "Hic! One pops back out.",
      "One breath. The hiccups stop again!"
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
      "Brave stands tall at last.",
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
      "Hungry feels full and happy now!"
    ]
  }),
  "meadow-pals-13-splashy-finds-a-puddle": fictionReview({
    canonIds: ["MEADOW-SPLASHY", "MEADOW-GRUMPY", "MEADOW-CLUCKY", "MEADOW-SLEEPY"],
    storySpine: "Splashy wants bigger splashes but soaks friends and their things before making amends.",
    failedAttempt: "Bigger jumps wet Grumpy, Clucky's hat and Sleepy's bed.",
    resolution: "Splashy dries the wet things, then picks a puddle with space.",
    pages: [
      "Splashy finds a small puddle.",
      "Splashy wants a big splash.",
      "Splashy jumps in.",
      "Splashy jumps up high.",
      "Splash! Drops fly far and wide.",
      "Grumpy gets wet. He scowls.",
      "Clucky's hat drips. She frowns.",
      "Splashy dries the hat and bed.",
      "Splashy picks a puddle with space."
    ]
  }),
  "meadow-pals-14-speedy-slows-down": fictionReview({
    canonIds: ["MEADOW-SPEEDY", "MEADOW-TINY"],
    storySpine: "Speedy wants to race home but runs too quickly to notice the path.",
    failedAttempt: "Speedy races past every landmark and becomes lost.",
    resolution: "Speedy stops, listens to Tiny and follows the path home.",
    pages: [
      "Speedy runs home.",
      "Speedy runs past the barn.",
      "Speedy runs past the pond.",
      "Speedy runs past the hill.",
      "Speedy misses the home path.",
      "No one sees Speedy.",
      "Speedy is lost.",
      "Speedy stops and listens.",
      "Tiny calls from home.",
      "Speedy finds his way home!"
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
      "Speedy runs past.",
      "Muddy drips with mud.",
      "Cuddly waits.",
      "She asks Woolly.",
      "Woolly hugs her.",
      "She asks for one more.",
      "Woolly nods. They hug. Cuddly smiles!"
    ]
  }),
  "meadow-pals-16-muddy-and-splashy-make-a-mess": fictionReview({
    canonIds: ["MEADOW-MUDDY", "MEADOW-SPLASHY", "MEADOW-GRUMPY"],
    storySpine: "Muddy and Splashy want a mud pool without covering Grumpy.",
    failedAttempt: "Their first giant jump splashes Grumpy.",
    resolution: "They wash Grumpy, who smiles and walks with them.",
    pages: [
      "Muddy brings some mud.",
      "Splashy brings a pail.",
      "They make a mud pool.",
      "They both jump in.",
      "Mud flies up.",
      "Mud lands all round.",
      "Mud hits Grumpy. He frowns.",
      "They wash Grumpy clean.",
      "Grumpy grins and walks with them."
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
    storySpine: "Noisy starts morning too soon, then learns to wait for light.",
    failedAttempt: "Noisy calls before sunrise and wakes the meadow too early.",
    resolution: "Noisy sees his friends frown and waits quietly.",
    pages: [
      "The sky is dark.",
      "Noisy starts the day too soon.",
      "Noisy lets out a loud call.",
      "Three friends wake.",
      "Sleepy stays in bed.",
      "Noisy calls once more.",
      "Sleepy peeks with one eye.",
      "The sky is still dark.",
      "Friends frown. Noisy waits till dawn."
    ]
  }),
  "meadow-pals-19-tiny-and-brave-go-on-an-adventure": fictionReview({
    canonIds: ["MEADOW-TINY", "MEADOW-BRAVE"],
    storySpine: "Tiny and Brave want to recover Tiny's hat after the wind blows it away.",
    failedAttempt: "The hat is trapped inside a narrow log that Brave cannot enter.",
    resolution: "Tiny retrieves the hat and Brave ties it securely under his chin.",
    pages: [
      "Wind lifts Tiny's red hat.",
      "Tiny and Brave chase it.",
      "The hat falls into a log.",
      "Brave cannot fit inside.",
      "Tiny crawls through the log.",
      "Tiny reaches the red hat.",
      "Tiny carries it outside.",
      "Brave ties the red hat tight.",
      "Tiny's red hat stays on."
    ]
  }),
  "meadow-pals-20-shy-and-cuddly-find-each-other": fictionReview({
    canonIds: ["MEADOW-SHY", "MEADOW-CUDDLY"],
    storySpine: "Cuddly wants a friend and Shy wants company without being rushed.",
    failedAttempt: "Cuddly searches the ground while Shy hides above.",
    resolution: "Cuddly asks before hugging, and Shy leans into the cuddle.",
    pages: [
      "Cuddly looks for a friend.",
      "Shy hides close by.",
      "Cuddly checks the tree.",
      "Shy waits on a branch.",
      "Shy makes a soft hum.",
      "Cuddly looks up.",
      "They sit in the tree.",
      "Cuddly asks for a hug.",
      "Shy leans in for her hug.",
      "They smile in the tree."
    ]
  }),
  "meadow-pals-21-woolly-and-grumpy-are-stuck": fictionReview({
    canonIds: ["MEADOW-WOOLLY", "MEADOW-GRUMPY", "MEADOW-TINY"],
    storySpine: "Woolly and Grumpy want to untangle Woolly's wool from Grumpy's horn.",
    failedAttempt: "Pulling and moving together tightens the tangle.",
    resolution: "They stop, Tiny frees the wool, and they leave space.",
    pages: [
      "Woolly and Grumpy are stuck.",
      "Wool catches Grumpy's horn.",
      "They pull too hard.",
      "They both move left.",
      "They both move right.",
      "The knot gets tighter.",
      "They stop moving.",
      "Tiny frees the wool.",
      "Now they leave space between them."
    ]
  }),
  "meadow-pals-22-sleepys-big-dream": fictionReview({
    canonIds: ["MEADOW-SLEEPY"],
    storySpine: "Sleepy wants to finish a dream race before waking.",
    failedAttempt: "The dream fades and Sleepy begins to stir.",
    resolution: "Sleepy shuts his eyes and stays long enough to win.",
    pages: [
      "Sleepy closes his eyes.",
      "A big race dream begins.",
      "Dream Sleepy runs fast.",
      "Dream Sleepy jumps high.",
      "Dream Sleepy runs even faster!",
      "Dream Sleepy feels like a hero.",
      "Sleepy stirs. He shuts his eyes.",
      "Dream Sleepy wins the race!"
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
      "The cake goes in the oven.",
      "A flat cake comes out.",
      "They measure and bake again.",
      "They share the tall cake."
    ]
  }),
  "meadow-pals-24-grumpys-secret": fictionReview({
    canonIds: ["MEADOW-GRUMPY", "MEADOW-TINY", "MEADOW-WOOLLY", "MEADOW-CLUCKY", "MEADOW-BOUNCY"],
    sourcePageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11],
    storySpine: "Tiny wants to find Grumpy and learn his morning secret.",
    failedAttempt: "Woolly, Clucky and Bouncy do not know.",
    resolution: "Tiny finds Grumpy's garden and beams when Grumpy shares it.",
    pages: [
      "Grumpy goes out at dawn.",
      "Tiny looks for him.",
      "Woolly does not know.",
      "Clucky does not know.",
      "Bouncy does not know.",
      "Tiny takes the path.",
      "Grumpy grows green plants.",
      "He gives the shoots a drink.",
      "Grumpy shows his friends.",
      "Tiny beams in Grumpy's garden."
    ]
  }),
  "meadow-pals-25-the-big-farm-party": fictionReview({
    canonIds: ["MEADOW-MUDDY", "MEADOW-CLUCKY", "MEADOW-NOISY", "MEADOW-BOUNCY", "MEADOW-TINY", "MEADOW-SHY", "MEADOW-CUDDLY", "MEADOW-GRUMPY"],
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 13],
    storySpine: "The Meadow Pals want every friend, including Shy and Grumpy, to enjoy the farm party.",
    failedAttempt: "The first party is too loud and crowded for them.",
    resolution: "The friends lower the music and make a quiet place where everyone joins.",
    pages: [
      "The farm party starts!",
      "Muddy makes a mud cake.",
      "Clucky brings a fruit cake.",
      "Noisy bangs a loud drum.",
      "Tiny hangs the flags.",
      "Shy hides by the barn.",
      "Cuddly finds Shy.",
      "Grumpy sits far off.",
      "The friends make less noise.",
      "Shy and Grumpy join the party."
    ]
  }),

  "gr-a-26": nonfictionReview({
    topicQuestion: "How do different pets need different kinds of care?",
    progression: "Each page connects one familiar pet to the food, space, exercise or rest it needs.",
    synthesis: "Dogs, cats, fish, birds and rabbits need care that fits the animal.",
    pages: [
      "A dog needs food, exercise, and rest.",
      "A cat needs food, play, and quiet.",
      "A fish needs clean water and the right food.",
      "A pet bird needs room to fly.",
      "A rabbit needs hay and space to hop.",
      "Different pets need different kinds of care."
    ]
  }),
  "gr-a-27": nonfictionReview({
    topicQuestion: "How does the Sun help life on Earth?",
    progression: "The pages move from the Sun's identity to daylight, warmth, plant food and safe observation.",
    synthesis: "The Sun's light and warmth support life across Earth.",
    pages: [
      "Our Sun is one huge star in space.",
      "Its light makes daytime on our side.",
      "Its warmth heats land and water.",
      "Plants use sunlight to make food.",
      "Enjoy daylight safely. Never look straight at the Sun.",
      "The Sun's light and warmth help life on Earth."
    ]
  }),
  "gr-a-28": nonfictionReview({
    topicQuestion: "Which colors can we spot in familiar things?",
    progression: "The pages pair five colors with qualified, visible examples before inviting a new search.",
    synthesis: "The reader can transfer the color words to objects nearby.",
    pages: [
      "A ripe apple can look red.",
      "A clear sky can look blue.",
      "The Sun can look yellow from Earth.",
      "Fresh grass can look green.",
      "Clouds can look bright white.",
      "Look around. Which colors can you spot?"
    ]
  }),
  "gr-a-29": nonfictionReview({
    topicQuestion: "What can these parts of my body help me do?",
    progression: "The pages move from seeing, hearing and smelling to eating, speaking, holding and making.",
    synthesis: "The useful parts belong to one whole body, and that body belongs to the child.",
    pages: [
      "My eyes help me see.",
      "My ears help me hear.",
      "My nose helps me smell.",
      "My mouth helps me eat and speak.",
      "My hands help me hold and make things.",
      "My body is mine, and I care for it."
    ]
  }),
  "gr-b-31": nonfictionReview({
    topicQuestion: "How can seasons change in a temperate place?",
    progression: "The pages follow one place from spring through summer, fall and winter, then back to spring.",
    synthesis: "Seasonal changes repeat in a yearly cycle.",
    pages: [
      "In some places, spring brings buds and rain.",
      "Summer sunshine lasts late into the day.",
      "In fall, many leaves change color.",
      "Winter air may bring frost or snow.",
      "Plants and animals change with each season.",
      "After winter, spring begins the changing pattern again."
    ]
  }),
  "gr-b-32": nonfictionReview({
    topicQuestion: "How can fruits look, feel and taste different?",
    progression: "The pages move through a crisp apple, soft banana, bunched grapes, bumpy orange peel, varied fruit shapes and a flower growing into fruit.",
    synthesis: "Fruits differ in color, shape, feel and taste, and a flower can grow into a fruit.",
    pages: [
      "Bite an apple. It feels crisp.",
      "A ripe banana feels soft and sweet.",
      "Grapes grow together in bunches.",
      "An orange has a bright, bumpy peel.",
      "Fruits come in many colors, shapes, and sizes.",
      "A flower can grow into a fruit."
    ]
  }),
  "gr-b-33": nonfictionReview({
    topicQuestion: "What jobs do common tools perform?",
    progression: "Each page pairs one tool with its main function.",
    synthesis: "Each tool has a particular job and needs careful use.",
    pages: [
      "A hammer drives nails into wood.",
      "A saw cuts wood.",
      "A wrench turns nuts and bolts.",
      "A drill makes holes.",
      "A ruler checks length.",
      "Each tool has a job. Adults help us use tools safely."
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
      "Our place turns away from the Sun.",
      "Now our sky grows dark.",
      "Earth turns. Day and night take turns."
    ]
  }),
  "gr-b-35": nonfictionReview({
    topicQuestion: "How do different community workers help people?",
    progression: "Each page names one worker and a concrete service.",
    synthesis: "Different jobs meet different needs and help a community work.",
    pages: [
      "A chef cooks meals.",
      "A doctor helps sick people.",
      "A firefighter puts out a blaze.",
      "A teacher helps kids learn.",
      "Police come to help in an emergency.",
      "These jobs help our town run well."
    ]
  }),
  "gr-c-37": nonfictionReview({
    level: "B",
    topicQuestion: "How can water change, and why does it matter?",
    progression: "The pages move from poured liquid water to ice and vapor, then connect water to plants and animals.",
    synthesis: "Water changes form, but life on Earth still depends on it.",
    pages: [
      "Liquid water pours and flows.",
      "Cold can freeze water into ice.",
      "Warmth can turn water into invisible vapor.",
      "Plants take in water through their roots.",
      "People and other animals need water.",
      "Water changes form. Life on Earth still needs it."
    ]
  }),
  "gr-c-38": nonfictionReview({
    level: "B",
    topicQuestion: "How do our five senses collect information?",
    progression: "Each page connects one sense organ or body system to its job.",
    synthesis: "The five senses work together while we learn.",
    pages: [
      "Eyes help us see light and color.",
      "Ears help us hear sounds.",
      "Our nose helps us smell.",
      "Our tongue helps us taste.",
      "Skin helps us feel touch and warmth.",
      "Our five senses work together. They help us learn."
    ]
  }),
  "gr-c-39": nonfictionReview({
    level: "B",
    topicQuestion: "How can flat shapes appear in everyday objects?",
    progression: "Each page looks closely at the flat face or outline of one solid object.",
    synthesis: "Flat shapes can be found on solid things all around us.",
    pages: [
      "Look at the wheel. Its face is a circle.",
      "This sign has a square face.",
      "This roof edge makes a triangle.",
      "This book cover is a rectangle.",
      "This egg has an oval outline.",
      "Flat shapes hide on solid things all around us."
    ]
  }),
  "gr-d-42": nonfictionReview({
    level: "B",
    topicQuestion: "Which large features make Earth our shared home?",
    progression: "The pages travel from Earth in space to a coast, mountains, ocean, forest and one way people can help.",
    synthesis: "Earth's many places form one shared home that people can help care for.",
    pages: [
      "Earth is our home in space.",
      "Blue water meets green land along the coast.",
      "High peaks rise from the land.",
      "Deep oceans cover much of Earth.",
      "Green forests grow on many continents.",
      "We can help keep our shared home clean."
    ]
  }),
  "gr-d-43": nonfictionReview({
    level: "B",
    topicQuestion: "Which daily habits support health?",
    progression: "A first-person sequence moves through washing, food, water, toothbrushing, play and sleep.",
    synthesis: "Small repeated habits help a child care for their body.",
    pages: [
      "I wash my hands with soap and water.",
      "I eat many kinds of food.",
      "I drink water through the day.",
      "I brush my teeth twice a day.",
      "I make time for play and sleep.",
      "These small habits help care for my body."
    ]
  }),
  "gr-d-44": nonfictionReview({
    level: "B",
    title: "Animal Shelters and Habitats",
    topicQuestion: "Where can animals shelter or find what they need?",
    progression: "The pages distinguish nests, dens, ponds, burrows and webs by the jobs each place performs.",
    synthesis: "A habitat supplies the food, water and shelter an animal needs.",
    pages: [
      "Many birds build nests to hold eggs and young.",
      "Some bears rest in dens.",
      "Fish find food and shelter in ponds.",
      "Rabbits hide from danger inside burrows.",
      "Some spiders catch prey in sticky webs.",
      "A habitat gives an animal food, water, and shelter."
    ]
  }),
  "gr-d-45": nonfictionReview({
    level: "B",
    topicQuestion: "What lies near Earth, and what lies farther away?",
    progression: "The pages move outward from the Sun-Earth-Moon system to distant stars and human space travel.",
    synthesis: "The nearby objects sit within space that stretches far beyond our view.",
    pages: [
      "The Sun is our nearest star.",
      "Earth travels around the Sun.",
      "The Moon circles Earth again and again.",
      "Other stars lie far beyond our Sun.",
      "Astronauts travel through space in spacecraft.",
      "Space stretches far beyond our view."
    ]
  }),
  "gr-e-46": nonfictionReview({
    level: "B",
    topicQuestion: "Which traits are common among reptiles?",
    progression: "The pages move from shared skin and egg traits to snakes, turtles, lizards and body warmth.",
    synthesis: "Warm surroundings can help a reptile move and hunt.",
    pages: [
      "Reptiles have dry, scaly skin.",
      "Most reptiles lay eggs.",
      "Snakes are reptiles with no legs.",
      "A turtle's shell helps protect its body.",
      "Many lizards bask in warm places.",
      "Warm sun helps a reptile move and hunt."
    ]
  }),
  "gr-e-47": nonfictionReview({
    level: "B",
    title: "Living Things Change",
    topicQuestion: "What do living things need as they grow and change?",
    progression: "Food and water lead into visible changes in a seed, tadpole and caterpillar.",
    synthesis: "Growing and changing take time and care.",
    pages: [
      "Living things need food to grow and change.",
      "Living things need water too.",
      "A seed grows roots, a stem, and leaves.",
      "A tadpole grows legs. Soon it is a frog.",
      "A caterpillar forms a chrysalis. A butterfly comes out.",
      "Growing takes time and care."
    ]
  }),
  "gr-e-48": nonfictionReview({
    level: "B",
    topicQuestion: "What can magnets attract or repel?",
    progression: "The pages identify poles, one magnetic material, two non-magnetic materials and unlike or like pole pairs.",
    synthesis: "Opposite poles attract; matching poles push apart.",
    pages: [
      "A magnet has two poles.",
      "It pulls on some kinds of metal.",
      "It does not pull on wood.",
      "It does not pull on glass.",
      "Opposite poles attract each other.",
      "Matching poles push apart."
    ]
  }),
  "gr-e-49": nonfictionReview({
    level: "B",
    topicQuestion: "How can clothes suit weather and activity?",
    progression: "Each page pairs a garment with a visible condition or purpose.",
    synthesis: "Different clothes fit different weather and activities.",
    pages: [
      "A sun hat shades my face.",
      "A warm coat holds heat close.",
      "Rain boots keep my feet dry.",
      "Gloves help warm my hands.",
      "Pajamas are clothes for sleeping.",
      "Different clothes fit different weather and activities."
    ]
  }),
  "gr-e-50": nonfictionReview({
    level: "B",
    topicQuestion: "How do our senses help us explore?",
    progression: "Each page gives one sense a concrete contrast or detail to discover.",
    synthesis: "The five senses work together during exploration.",
    pages: [
      "My eyes find colors and shapes.",
      "My ears catch loud and soft sounds.",
      "My nose finds many smells.",
      "My tongue finds different tastes.",
      "My skin feels heat, cold, and touch.",
      "Together, my senses help me explore."
    ]
  }),

  "first-facts-a-01-look-at-the-colors": nonfictionReview({
    title: "Colors We Can See",
    topicQuestion: "Which colors can natural and everyday objects appear?",
    progression: "Each page introduces one color through two qualified visible examples.",
    synthesis: "The ending asks readers to transfer the color words to their surroundings.",
    pages: [
      "A ripe apple looks red. A robin's breast looks orange-red.",
      "The Sun can look yellow. This duck has yellow feathers.",
      "A clear sky looks blue. These flowers can look blue.",
      "Fresh grass looks green. This frog has green skin.",
      "This fox has orange fur. This pumpkin is orange, too.",
      "These grapes look purple. Lavender flowers can look purple.",
      "Colors fill our world. Which ones can you find?"
    ]
  }),
  "first-facts-a-02-the-four-seasons": nonfictionReview({
    title: "Seasons Change",
    topicQuestion: "How can one temperate place change across four seasons?",
    progression: "The pages follow spring, summer, fall and winter in one place, using qualified local examples.",
    synthesis: "After winter, spring returns and the yearly cycle begins again.",
    pages: [
      "In some places, spring brings rain and new flowers.",
      "Some birds nest. Other animals have their young.",
      "Summer often brings long, warm days.",
      "Many plants grow in the summer Sun.",
      "In fall, some leaves change color.",
      "Animals prepare for cold in many ways.",
      "Winter can bring frost or snow.",
      "People and animals find ways to stay warm.",
      "Then spring returns. The yearly cycle starts again."
    ]
  }),
  "first-facts-a-03-little-seeds-grow": nonfictionReview({
    title: "A Seed Starts to Grow",
    topicQuestion: "How can one flowering-plant seed begin to grow?",
    progression: "The sequence follows damp soil, water, seed coat, root, shoot, leaves and flower in biological order.",
    synthesis: "The first flower completes the visible change from seed to growing plant.",
    pages: [
      "A tiny plant waits inside this seed.",
      "The seed rests in damp soil.",
      "Water enters the seed. Its coat splits.",
      "First, a root pushes down.",
      "Next, a green shoot pushes up.",
      "Leaves open and catch sunlight.",
      "At last, the plant opens its first flower."
    ]
  }),
  "first-facts-a-04-what-is-weather": nonfictionReview({
    topicQuestion: "Which conditions make up weather?",
    progression: "The pages move through sunshine, rain, wind, snow, cloud, storm and rainbow conditions.",
    synthesis: "Weather changes, and the reader can observe today's conditions.",
    pages: [
      "The Sun warms the ground.",
      "Raindrops fall from clouds.",
      "Wind makes twigs and grass bend.",
      "Snow falls in soft, white flakes.",
      "Gray clouds can hide the Sun.",
      "Lightning lights the sky. Then thunder booms.",
      "Sunlight and raindrops can make a rainbow.",
      "Weather can change. What do you see now?"
    ]
  }),
  "first-facts-a-05-flowers-and-trees": nonfictionReview({
    title: "Flowers and Trees",
    topicQuestion: "How do flowering plants and trees use their parts?",
    progression: "The pages compare flower colors and forms before moving below ground and through two kinds of trees.",
    synthesis: "Flowers and trees share basic needs even though their parts can look different.",
    pages: [
      "This plant has a flower, stem, and roots.",
      "This sunflower grows tall with bright yellow petals.",
      "Daisies can have white petals and gold centers.",
      "Roses come in many colors. Their stems may have thorns.",
      "Tree roots hold firm and take in water.",
      "Some trees drop their leaves each fall.",
      "Pine trees stay green through the cold months.",
      "Flowers and trees need light, rain, soil, and space."
    ]
  }),
  "first-facts-a-06-baby-animals": nonfictionReview({
    topicQuestion: "What are young animals called and how do they change?",
    progression: "Each page names one young animal and a visible feature or action.",
    synthesis: "The ending gathers growth without assigning universal colors or textures.",
    pages: [
      "A young dog is called a puppy.",
      "A young cat is called a kitten.",
      "A young cow is called a calf.",
      "A young chicken is called a chick.",
      "A young sheep is called a lamb.",
      "A young horse is called a foal.",
      "A young duck is called a duckling.",
      "They grow bigger and learn new things."
    ]
  }),
  "first-facts-a-07-animals-on-the-farm": nonfictionReview({
    topicQuestion: "What can we observe about animals on one farm?",
    progression: "The pages identify food, body covering, products and movement without universal color claims.",
    synthesis: "The ending frames farms as places where animals need skilled care.",
    pages: [
      "This cow munches grass and hay.",
      "A cow makes milk for her calf.",
      "This pig rolls in mud to keep cool.",
      "A sheep grows a thick, woolly coat.",
      "A hen lays eggs.",
      "A horse can pull a heavy load.",
      "This duck paddles across the pond.",
      "Each farm animal needs food, water, shelter, and care."
    ]
  }),
  "first-facts-a-08-animals-in-the-ocean": nonfictionReview({
    topicQuestion: "How do different ocean animals move, breathe and protect themselves?",
    progression: "The sequence moves through fins, air breathing, arms, shells, gripping tails and group swimming.",
    synthesis: "Ocean animals move, hide and breathe in many different ways.",
    pages: [
      "Oceans are home to animals of every size.",
      "Fish flick their fins to swim.",
      "Blue whales are Earth's biggest animals, yet they breathe air.",
      "An octopus uses eight arms to crawl and grab.",
      "A crab's hard shell guards its soft body.",
      "A seahorse curls its tail around plants.",
      "Dolphins breathe air and often swim in groups.",
      "Ocean animals move, hide, and breathe in many ways."
    ]
  }),
  "first-facts-a-09-animals-at-night": nonfictionReview({
    topicQuestion: "How do some nocturnal animals find food after dark?",
    progression: "An opening question leads through sight, echoes, smell and hearing used after dark.",
    synthesis: "Darkness is an active time for many nocturnal animals.",
    pages: [
      "Night falls. Which animals wake up?",
      "Owls spot movement in dim light.",
      "Many bats hunt insects with echoes.",
      "Hedgehogs sniff for insects after dark.",
      "Foxes listen and smell for prey.",
      "Darkness brings a busy time for night animals."
    ]
  }),
  "first-facts-a-10-bugs-all-around-us": nonfictionReview({
    title: "Small Creatures Around Us",
    topicQuestion: "How do different small invertebrates live and help ecosystems?",
    progression: "The pages move from winged insects to colony insects, soil workers and a gliding mollusk.",
    synthesis: "Small creatures support flowers, soil and other animals in different ways.",
    pages: [
      "Look down. Small creatures work near us.",
      "A butterfly flies on four broad wings.",
      "Bees move pollen from bloom to bloom.",
      "Some ladybugs hunt aphids on plants.",
      "Ants share jobs inside their nests.",
      "Earthworms dig through soil.",
      "Snails glide on one strong foot.",
      "Small creatures help flowers, soil, and other animals."
    ]
  }),
  "first-facts-a-11-pets-we-love": nonfictionReview({
    title: "Caring for Pets",
    topicQuestion: "What does responsible care look like for different pets?",
    progression: "The pages compare the food, movement, space, water and health needs of several familiar pets.",
    synthesis: "Good care changes to fit the animal rather than following one rule for every pet.",
    pages: [
      "Dogs need play, exercise, and rest.",
      "Dogs need food, clean water, and regular care.",
      "Cats need food, play, and quiet places.",
      "Rabbits need hay, shelter, company, and room.",
      "Fish need the right food and clean water.",
      "Hamsters need space to dig and explore.",
      "Good pet care fits the animal."
    ]
  }),
  "first-facts-a-12-shapes-everywhere": nonfictionReview({
    title: "Shapes on Everyday Objects",
    topicQuestion: "Where can we find flat shapes on three-dimensional objects?",
    progression: "Each page gives one defining feature, then locates the shape on an object's face or outline.",
    synthesis: "The reader can use sides, points and curves to find more flat shapes nearby.",
    pages: [
      "A circle has no straight sides. This wheel face is round.",
      "A square has four equal sides. This window looks square.",
      "A triangle has three sides. This roof edge makes one.",
      "A rectangle has four square corners. This door looks rectangular.",
      "A star shape has points. This one has five.",
      "An oval is round and stretched. This egg outline looks oval.",
      "Now look around. Which flat shapes can you find?"
    ]
  }),
  "first-facts-a-13-big-and-small": nonfictionReview({
    topicQuestion: "How does size change when two things are compared?",
    progression: "Each page makes one explicit paired comparison rather than assigning absolute size.",
    synthesis: "The words big and small only make sense through comparison.",
    pages: [
      "An elephant looks big beside a mouse.",
      "That mouse looks small beside the elephant.",
      "A bus looks big beside a toy car.",
      "A tree looks big beside a flower.",
      "This fish looks small beside a whale.",
      "Big or small? Compare two things."
    ]
  }),
  "first-facts-a-14-hot-and-cold": nonfictionReview({
    topicQuestion: "Which things have higher or lower temperatures?",
    progression: "The pages compare sunlight, fire, ice, food and water, then connect temperature words to safe touch.",
    synthesis: "Hot and cold describe temperature, and extreme temperatures can hurt.",
    pages: [
      "Sunlight can feel warm on our skin.",
      "Fire feels hot from far away. Stay back.",
      "Ice and snow feel very cold.",
      "Hot food needs time to cool.",
      "Cool water can feel good on a hot day.",
      "Hot and cold tell us about temperature.",
      "Ask an adult before touching something very hot or cold."
    ]
  }),
  "first-facts-a-15-things-that-float-and-sink": nonfictionReview({
    title: "Why Things Float or Sink",
    topicQuestion: "How do material density and shape affect floating?",
    progression: "Paired examples disprove the heavy-sinks rule before a supervised comparison.",
    synthesis: "A heavy object can float and a light object can sink, so weight alone is not enough.",
    pages: [
      "A hollow toy duck floats on water.",
      "This solid stone sinks to the bottom.",
      "A leaf may float. A coin sinks.",
      "Even a heavy, hollow boat can float.",
      "Shape and material both matter.",
      "Try safe objects with an adult. What happens?",
      "Heavy things can float. Light things can sink."
    ]
  }),
  "first-facts-a-16-push-and-pull": nonfictionReview({
    topicQuestion: "How can pushes, pulls and magnets change motion?",
    progression: "The pages move from contact forces to motion examples and magnetic attraction or repulsion.",
    synthesis: "Pushes and pulls can start, stop or turn motion.",
    pages: [
      "A push can send something away.",
      "A pull can bring something close.",
      "A door moves with a push or pull.",
      "A push sends this swing up.",
      "A pull opens this zipper.",
      "A magnet pulls this steel paper clip.",
      "Pushes and pulls can start, stop, or turn things."
    ]
  }),
  "first-facts-a-17-hello-sun": nonfictionReview({
    title: "Watching the Sun Safely",
    topicQuestion: "Why does the Sun seem to cross our sky?",
    progression: "The pages move from the Sun and its light through morning, midday and evening before safe viewing and Earth's rotation.",
    synthesis: "Earth turns, so the Sun only seems to cross our sky; safe watching never means staring.",
    pages: [
      "The Sun is the star closest to Earth.",
      "Its light brightens and warms our world.",
      "Earth turns, and morning sunlight reaches us.",
      "The day often feels warmest after midday.",
      "Earth keeps turning. Evening sunlight fades.",
      "Never stare at the Sun. Its light can hurt your eyes.",
      "Earth turns, so the Sun only seems to cross our sky."
    ]
  }),
  "first-facts-a-18-the-moon": nonfictionReview({
    topicQuestion: "Why does the Moon shine and seem to change shape?",
    progression: "The pages move from reflected sunlight through crescent and full views, orbit, Moon exploration and day or night viewing.",
    synthesis: "Every view of the shining Moon begins with reflected sunlight.",
    pages: [
      "The Moon makes no light of its own.",
      "Its rocky surface reflects sunlight back to us.",
      "A crescent shows part of the Moon's sunlit face.",
      "A full Moon shows its fully sunlit face.",
      "The Moon travels around Earth.",
      "People have walked on the Moon.",
      "By day or night, moonlight is reflected sunlight."
    ]
  }),
  "first-facts-a-19-day-and-night": nonfictionReview({
    topicQuestion: "How does Earth's rotation create day and night?",
    progression: "Every observational page remains tied to Earth's sunlit and dark sides.",
    synthesis: "The ending returns to the repeating rotation cycle.",
    pages: [
      "The Sun lights one half of Earth.",
      "The side toward the Sun has day.",
      "Earth turns all day and all night.",
      "The side turned from the Sun has night.",
      "The Moon can appear by day or night.",
      "Earth turns. Day changes to night.",
      "Earth keeps turning. Day comes back."
    ]
  }),
  "first-facts-a-20-my-five-senses": nonfictionReview({
    topicQuestion: "How do five sensory systems help one child learn?",
    progression: "An opening question leads through sight, hearing, smell, taste and touch before the senses combine.",
    synthesis: "The five senses work together and give the reader new things to notice.",
    pages: [
      "How do I learn about the world around me?",
      "My eyes find light, color, and shape.",
      "My ears catch sounds.",
      "My nose notices smells.",
      "My tongue notices tastes.",
      "My skin feels touch, warmth, and cold.",
      "My senses work together every day.",
      "What are your senses noticing now?"
    ]
  }),
  "first-facts-a-21-how-i-grow": nonfictionReview({
    title: "Ways I Grow",
    topicQuestion: "How can one child change and learn over time?",
    progression: "The pages move from a baby's need for help through crawling, walking, active play, new skills and supportive care.",
    synthesis: "Bodies and skills change, and people grow in their own way and time.",
    pages: [
      "Babies need help with many things.",
      "First, I learn to sit and crawl.",
      "Then, I practice standing and walking.",
      "Soon, I can run, jump, and play.",
      "I learn new words and skills.",
      "Food, sleep, activity, and care support growth.",
      "We all grow in our own way and time."
    ]
  }),
  "first-facts-a-22-staying-healthy": nonfictionReview({
    title: "Healthy Habits",
    topicQuestion: "Which everyday habits can support health?",
    progression: "The pages move through food, water, active play, clean hands, tooth care and sleep.",
    synthesis: "Small healthy habits build their effect through daily repetition.",
    pages: [
      "Different foods give our bodies different nutrients.",
      "Drinking water helps our bodies work well.",
      "Active play gets hearts and muscles moving.",
      "Soap and water wash germs from hands.",
      "Fluoride toothpaste helps guard our teeth.",
      "Sleep gives bodies and brains time to rest.",
      "Small healthy habits add up each day."
    ]
  }),
  "first-facts-a-23-my-body": nonfictionReview({
    topicQuestion: "Which body parts help one child act and sense?",
    progression: "The pages move from head to limbs, digestion, senses and whole-body movement.",
    synthesis: "The ending affirms body ownership and care.",
    pages: [
      "My head holds my brain and face.",
      "My arms and hands reach, clap, and hold.",
      "My stomach helps break down food.",
      "My legs and feet carry me.",
      "My eyes, ears, and nose gather clues.",
      "All my parts work together through the day.",
      "I care for my body every day.",
      "This is my body. It belongs to me."
    ]
  }),
  "first-facts-a-24-rocks-and-pebbles": nonfictionReview({
    topicQuestion: "How can rocks and pebbles vary and change?",
    progression: "The pages move through rock sizes, pebbles, water smoothing, human uses, close observation and safe collecting.",
    synthesis: "Close observation can reveal clues from Earth's long story.",
    pages: [
      "Rocks can be hard, large, or small.",
      "A pebble is a small piece of rock.",
      "Moving water can rub a pebble smooth.",
      "People build roads and walls with rock.",
      "Look closely. What colors and layers do you see?",
      "Collect loose rocks only where an adult says it is safe.",
      "Each rock holds clues from Earth's long story."
    ]
  }),
  "first-facts-a-25-water-everywhere": nonfictionReview({
    topicQuestion: "Where do we find water, and how do living things use it?",
    progression: "The pages move through waterways, rain, living needs, household uses, water's forms and rain collection.",
    synthesis: "Water in many places and forms shapes and supports life on Earth.",
    pages: [
      "Water fills oceans, rivers, lakes, and clouds.",
      "Raindrops fall from clouds and refill rivers.",
      "Plants and animals need fresh water to live.",
      "People need clean water to drink.",
      "We also use water to wash.",
      "Water helps gardens and crops grow.",
      "Water can be liquid, ice, or invisible vapor.",
      "We can collect rainwater for plants.",
      "Water shapes and supports life on our blue planet."
    ]
  }),

  "level-c-nonfiction-01-bees": nonfictionReview({
    title: "Honeybees and Pollination",
    topicQuestion: "How do honeybees share hive work and help flowering plants reproduce?",
    progression: "The sequence follows hive roles, nectar, honey, pollen transfer, fruit growth and practical help.",
    synthesis: "The ending connects a honeybee colony's work to both food stores and plant reproduction.",
    pages: [
      "One garden can buzz with many kinds of bees. Which ones make honey?",
      "Inside a honeybee hive, one queen lays the eggs.",
      "Worker bees sip flower nectar and gather dusty pollen.",
      "Back at the hive, workers turn the sweet nectar into honey.",
      "As a bee visits flowers, pollen brushes onto its body.",
      "The bee carries pollen to the next flower. Later, fruit can grow.",
      "Making honey takes many bees and thousands of flower visits.",
      "More blooming plants give hungry bees more places to feed.",
      "Honeybees feed their hive and help many garden plants grow."
    ]
  }),
  "level-c-nonfiction-02-volcanoes": nonfictionReview({
    topicQuestion: "How do volcanoes form, erupt and change Earth's surface?",
    progression: "The pages move from magma to vents, eruption styles, islands, soil, global distribution and monitoring.",
    synthesis: "The ending gathers destructive and constructive effects without treating a volcano as the erupting magma itself.",
    pages: [
      "Far below a volcano, melted rock gathers. It is called magma.",
      "Magma can rise through cracks and openings called vents.",
      "Erupted magma becomes lava. Some lava flows slowly.",
      "Other eruptions blast ash, rocks, and gases high into the air.",
      "Repeated underwater eruptions can build new volcanic islands.",
      "Old volcanic rock breaks down into soil rich in minerals.",
      "Look around the globe: volcanoes rise on land and under oceans.",
      "Scientists watch small earthquakes, gases, and moving ground for warning signs.",
      "Eruptions can destroy old ground, then build new land in its place."
    ]
  }),
  "level-c-nonfiction-03-penguins": nonfictionReview({
    title: "Emperor Penguins and Their Relatives",
    topicQuestion: "How do emperor penguins survive and how do other penguin species differ?",
    progression: "The sequence follows swimming anatomy, Antarctic conditions, egg care, chicks, diving, colonies, countershading and warmer-climate species.",
    synthesis: "The ending places emperor adaptations within a diverse penguin family.",
    pages: [
      "Penguins cannot fly, but their strong wings sweep them through water.",
      "Emperor penguins live through fierce Antarctic cold and wind.",
      "A father balances one egg on his feet beneath warm skin.",
      "The fathers huddle close for warmth while the mothers hunt at sea.",
      "When the mothers return, both parents feed and warm their chicks.",
      "Emperors dive deep and steer with their flippers to catch fish.",
      "In a noisy colony, special calls help each family find one another.",
      "A dark back hides from above. A pale belly hides from below. This camouflage is called countershading.",
      "Not every penguin lives on ice. Some make their homes on warmer coasts."
    ]
  }),
  "level-c-nonfiction-04-the-moon": nonfictionReview({
    topicQuestion: "What causes the Moon's light, phases, craters and effects on Earth?",
    progression: "The pages connect orbit, reflected light, phases, impacts, exploration, tides, samples, scale and continued motion.",
    synthesis: "The ending keeps the Moon present even when its lit portion is not visible.",
    pages: [
      "Look up: our Moon is always traveling around Earth.",
      "The Moon cannot make light. Sunlight bounces from its rocky surface.",
      "As the Moon moves, we see different parts of its sunlit half.",
      "Space rocks struck the Moon long ago, leaving bowl-shaped craters.",
      "Apollo 11 astronauts first walked on the Moon in 1969.",
      "The Moon's gravity pulls on Earth's oceans and helps make tides.",
      "Moon rocks brought home by astronauts hold clues to its past.",
      "The Moon is about one quarter as wide as Earth.",
      "Even when we cannot see it, the Moon keeps circling Earth."
    ]
  }),
  "level-c-nonfiction-05-how-seeds-grow": nonfictionReview({
    title: "How a Flowering Plant Grows",
    topicQuestion: "How can one flowering plant germinate, grow, reproduce and disperse seeds?",
    progression: "The sequence follows a scoped seed through germination, root, shoot, photosynthesis, pollination, new seeds and dispersal.",
    synthesis: "The ending invites observation of the same evidence-based cycle.",
    pages: [
      "Seeds come in many shapes. Each holds a tiny plant inside.",
      "With water, air, and warmth, a seed begins to grow.",
      "A root emerges first and absorbs water from soil.",
      "A shoot reaches light and opens its first leaves.",
      "The leaves use sunlight, water, and air to make food. This is photosynthesis.",
      "Flowers attract visitors. Bees and butterflies can carry pollen between flowers.",
      "After pollination, new seeds grow inside the plant's pods.",
      "Wind, water, and animals carry some seeds to new places.",
      "Plant one seed, add water, and watch the whole story begin again."
    ]
  }),
  "level-c-nonfiction-06-spiders": nonfictionReview({
    topicQuestion: "How do spider bodies, silk and senses support survival?",
    progression: "The sequence compares anatomy, silk production, web types, hunting, sensing, feeding, reproduction and ecological roles.",
    synthesis: "The ending connects spider anatomy, senses and silk to hunting, egg care and a garden web.",
    pages: [
      "A spider has eight legs and two body sections—but no wings. How does it catch flying insects?",
      "Tiny spinnerets at its rear make strong, stretchy silk.",
      "An orb-weaver stretches silk into a round web of spokes and spirals.",
      "Other spiders make flat sheets, deep funnels, or loose tangles.",
      "A jumping spider needs no web. It watches, creeps, and pounces.",
      "A web spider feels trapped prey tugging on the silk.",
      "The spider bites its prey, then wraps it tightly in silk.",
      "A mother spider may wrap her eggs in a silk sac.",
      "That garden web may catch insects before they reach the tomatoes."
    ]
  }),
  "level-c-nonfiction-07-under-the-ocean": nonfictionReview({
    topicQuestion: "How do ocean depth, light and pressure shape habitats?",
    progression: "The pages descend from surface waters through reefs, twilight, darkness, trenches and global oxygen production.",
    synthesis: "The ending returns to the vast portion of ocean still unobserved.",
    pages: [
      "Oceans cover most of Earth, but sunlight reaches only the top.",
      "Dive down. The water grows colder, and the sunlight fades.",
      "Near the warm, bright surface, coral reefs crowd with life.",
      "Tiny coral animals build hard homes. Together, those homes make a reef.",
      "Below 200 meters, light fades and water pressure keeps climbing.",
      "Deeper still, darkness rules. Some fish make their own light. This is bioluminescence.",
      "The Mariana Trench reaches nearly eleven kilometers below sea level.",
      "Far above, sunlit plankton make about half the oxygen in Earth's air.",
      "From bright reefs to black trenches, most of the ocean is still unseen."
    ]
  }),
  "level-c-nonfiction-08-butterflies": nonfictionReview({
    title: "The Monarch Butterfly Life Cycle",
    topicQuestion: "How does a monarch change through four life stages and migrate?",
    progression: "The pages move through insect anatomy, egg, caterpillar, chrysalis, metamorphosis, emergence, feeding and migration.",
    synthesis: "The ending connects several generations to one long migration cycle.",
    pages: [
      "This monarch has six legs, four wings, and two antennae.",
      "But it did not begin with wings. A monarch has four life stages.",
      "A monarch lays a tiny egg on milkweed.",
      "A striped caterpillar hatches, eats milkweed, and grows and grows.",
      "It hangs upside down and forms a green chrysalis.",
      "Inside, its whole body changes. This change is called metamorphosis.",
      "The new butterfly crawls out with wet, crumpled wings.",
      "Soon its wings harden, and a long proboscis sips nectar.",
      "Monarchs cross a continent. No one butterfly makes the whole round trip. New generations carry it on."
    ]
  }),
  "level-c-nonfiction-09-caves": nonfictionReview({
    topicQuestion: "How do caves form and what histories or habitats can they preserve?",
    progression: "The sequence covers cave types, limestone dissolution, passages, mineral deposits, columns, bats, cave specialists and ancient art.",
    synthesis: "The ending gathers caves as slowly formed archives of geology, life and people.",
    pages: [
      "Water, waves, and flowing lava can each make a cave. What might we find inside?",
      "Slightly acidic rainwater seeps into limestone and slowly widens its cracks.",
      "Drop by drop, small cracks can grow into rooms and winding passages.",
      "Mineral-rich water drips from the ceiling. Stalactites grow downward.",
      "Drops splash onto the floor. Stalagmites grow upward.",
      "Joined stalactites and stalagmites form stone columns.",
      "Some bats rest in caves by day, then fly out at dusk.",
      "Some cave animals are pale, with tiny eyes or none at all.",
      "From dripping stone to ancient art, caves hold clues from long ago."
    ]
  }),
  "level-c-nonfiction-10-frogs": nonfictionReview({
    title: "The Common Frog Life Cycle",
    topicQuestion: "How does a common frog develop and live on land and in water?",
    progression: "The pages follow frogspawn, tadpole, metamorphosis, froglet, diet, breathing, color and breeding calls.",
    synthesis: "The ending returns calls to their specific spring breeding purpose.",
    pages: [
      "A common frog needs two worlds: a pond and damp land.",
      "In spring, a female lays a wobbling clump of jelly-covered eggs.",
      "Tadpoles hatch with tails and gills, but no legs.",
      "Back legs grow first. Front legs follow as the tail shrinks.",
      "Now it is a froglet. It climbs out but stays near water.",
      "An adult frog flicks out its sticky tongue to catch a small insect.",
      "A frog breathes with its lungs and through its moist skin.",
      "Brown, green, gray, or red skin helps frogs blend in.",
      "In spring, males call to females beside the pond. The life cycle can begin again."
    ]
  }),

  "first-facts-level-a-01-colors": nonfictionReview({
    topicQuestion: "What colors can we see on familiar things?",
    progression: "Each page pairs one color with visible everyday objects.",
    synthesis: "The final page gathers the named colors.",
    pages: [
      "The ball and hat are red.",
      "The cup and bag are blue.",
      "The bright sun looks yellow.",
      "The frog is green.",
      "The cat and bat are black.",
      "The pig and flower are pink.",
      "We can see many colors!"
    ]
  }),
  "first-facts-level-a-02-farm-animals": nonfictionReview({
    topicQuestion: "Which animals live on a farm and what sounds do they make?",
    progression: "Each page names one familiar farm animal and its sound.",
    synthesis: "The ending gathers the different animal sounds in one farm setting.",
    pages: [
      "A pig says oink.",
      "A hen says cluck.",
      "A cow says moo.",
      "A dog says woof.",
      "A duck says quack.",
      "A cat says meow.",
      "Farm animals make many sounds."
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
    topicQuestion: "What can small creatures do?",
    progression: "The pages introduce insects and a worm through observable behaviors.",
    synthesis: "The ending gathers them accurately as small creatures nearby.",
    pages: [
      "A little bug can fly.",
      "A bee can sting.",
      "An ant can dig.",
      "A worm digs through soil.",
      "A bug can hide.",
      "A bug can crawl.",
      "Small creatures live all around us."
    ]
  }),
  "first-facts-level-a-08-my-pet": nonfictionReview({
    title: "Pets We Care For",
    topicQuestion: "What can different pets be like at home?",
    progression: "The pages compare where pets rest, move and sing before showing gentle companionship.",
    synthesis: "Different pets need suitable homes and gentle care.",
    pages: [
      "A dog sleeps in a bed.",
      "A cat rests on a mat.",
      "A fish swims in a tank.",
      "A bird sings from its perch.",
      "A rabbit has soft fur.",
      "This dog enjoys a gentle cuddle.",
      "Every pet needs gentle care."
    ]
  }),
  "first-facts-level-a-09-hot-and-cold": nonfictionReview({
    topicQuestion: "Which familiar things feel hot or cold?",
    progression: "The pages alternate clear examples of heat and cold.",
    synthesis: "The ending contrasts the two temperature words.",
    pages: [
      "Sunlight can feel hot.",
      "Ice feels cold.",
      "Fire is very hot.",
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
    synthesis: "The ending gathers the visited sights in one farm view.",
    pages: [
      "A red barn stands tall.",
      "A pig says oink.",
      "A chick says peep.",
      "A cow says moo.",
      "Green grass grows beside hay.",
      "A farm dog runs fast.",
      "Together they make a busy farm."
    ]
  }),
  "first-facts-level-a-12-in-the-sea": nonfictionReview({
    topicQuestion: "How do animals and people move in water?",
    progression: "The pages compare sea animal movements before ending with human swimming.",
    synthesis: "The final page connects the movement pattern to people.",
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
    topicQuestion: "How can familiar fruits differ?",
    progression: "The examples compare taste, texture, size, shape and color.",
    synthesis: "The ending gathers different fruits by their bright colors.",
    pages: [
      "A red apple is sweet.",
      "A ripe banana feels soft.",
      "A purple plum is small.",
      "An orange is round.",
      "A grape is small and round.",
      "Fruit can be big or small.",
      "Fruit can be many colors."
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
      "These parts make one tree."
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
      "Find one fast and one slow."
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
      "Space has stars and many planets."
    ]
  })
});
