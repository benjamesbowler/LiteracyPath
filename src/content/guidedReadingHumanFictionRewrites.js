/*
 * Story-Bible manuscripts for the James and Anna and Aiden and Betty series.
 *
 * This file is intentionally standalone. It does not mutate the imported book
 * catalogues. Each manuscript preserves the current illustration sequence while
 * making the goal, failed attempt, causal turn and earned resolution explicit.
 */

const humanFictionRewrite = ({ canonIds, storySpine, failedAttempt, resolution, sourcePageNumbers, pages }) =>
  Object.freeze({
    kind: "fiction",
    canonIds: Object.freeze(canonIds),
    storySpine,
    failedAttempt,
    resolution,
    ...(sourcePageNumbers
      ? { sourcePageNumbers: Object.freeze(sourcePageNumbers) }
      : {}),
    pages: Object.freeze(pages)
  });

export const GUIDED_READING_HUMAN_FICTION_REWRITES = Object.freeze({
  "james-and-anna-01-space": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-ZIM"],
    storySpine: "James and Anna want their cardboard rocket to carry them to the Moon.",
    failedAttempt: "Their first countdown ends with the cardboard rocket still in the garden.",
    resolution: "They try again through shared imaginative play, visit Zim and return for cake.",
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14],
    pages: [
      "James and Anna find big, flat boxes in the garden.",
      "“Let us build a rocket and fly to space!” says James.",
      "Anna draws wings and a pointed nose cone on her plan.",
      "They cut, tape and test the boxes all morning.",
      "By lunchtime, their garden rocket has wings, a door and a pointed nose.",
      "They count down. Nothing moves except one loose strip of tape.",
      "They close their eyes, count again and blast through the clouds!",
      "It lands on the pale, quiet Moon with a bump.",
      "A small green alien called Zim hurries over to greet them.",
      "They play with Zim and bounce high across the Moon.",
      "Anna steers them home while Zim waves from below.",
      "They open their eyes in the garden. Mum brings cake."
    ]
  }),

  "james-and-anna-02-chips": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to walk Chips without letting him chew other people's things.",
    failedAttempt: "Their rope lead does not stop Chips from destroying a rose bush.",
    resolution: "They learn to offer his proper food first and plan a safer next walk.",
    pages: [
      "Chips is their small white goat with big brown patches.",
      "His blue bell jingles whenever he hurries towards trouble.",
      "Chips eats grass, bark and, one day, Dad's best hat.",
      "Dad points at the hat. Chips calmly looks away.",
      "James makes a rope lead for a safe first walk.",
      "They keep Chips close as he munches the lane's grass.",
      "Then Chips pulls free and crunches through a neighbour's rose bush.",
      "Anna stops him and checks the silly goat is safe.",
      "At home, James fills his bowl with grass and apple.",
      "Chips empties it, then stares hopefully at James's jumper.",
      "Before James can move it, Chips takes one enormous bite.",
      "They move clothes higher and pack more apple for tomorrow's walk."
    ]
  }),

  "james-and-anna-03-shopping": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to bring every item on Mum's list home safely.",
    failedAttempt: "The cake display distracts them from checking their basket and list.",
    resolution: "They refocus, protect the eggs and wait until lunch to eat the treats.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "Mum needs help bringing every item on her list home.",
      "James carries the list. Anna carries the shopping bags.",
      "Inside the bright shop, warm bread and ripe fruit fill the air.",
      "“Bread, grapes, cheese, eggs and orange juice,” James reads.",
      "Anna chooses the round loaf with seeds on top.",
      "They find grapes, cheese, eggs and juice. James guards the eggs.",
      "Then the shining cake stand makes them forget the list.",
      "Mum holds up one finger. They check the basket again.",
      "James chooses lemon cake. Anna chooses a strawberry jam tart.",
      "At the till, they check the list. Even the eggs have no cracks.",
      "James reaches for the bread, but Anna reminds him to wait.",
      "After lunch, they eat cake. Chips grabs the bag; James trades it for apple."
    ]
  }),

  "james-and-anna-04-dentist": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to finish their dental checks despite feeling frightened.",
    failedAttempt: "The waiting-room distractions help briefly, but James's fear returns when the chair rises.",
    resolution: "He uses a calm breath to open wide, then helps Anna feel ready too.",
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "James does not want to sit in the dentist's chair. Anna is not keen either.",
      "Mum says the kind dentist will only check their teeth.",
      "Anna squeezes James's hand. He keeps watching the door.",
      "Bright fish dart through the waiting-room tank.",
      "Anna reads about sharks. Soon she stops twisting her sleeve.",
      "The chair hums upwards. James grips both armrests.",
      "He takes one slow breath, then opens wide. The check is over quickly.",
      "James tells Anna the check is quick and gentle.",
      "Anna climbs into the chair and copies James's slow breath.",
      "The dentist checks her teeth while singing a little tune.",
      "Outside, James shows his rocket sticker. Anna shows her star.",
      "That night, they brush for two whole minutes. Chips watches the foam."
    ]
  }),

  "james-and-anna-05-tree-house": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to build a safe tree house from their own plan.",
    failedAttempt: "Chips steals the paint-tin lid before the new walls are finished.",
    resolution: "They move the paint out of his reach, complete every planned feature and sleep safely inside.",
    sourcePageNumbers: [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14],
    pages: [
      "James and Anna study the old oak tree for days.",
      "James draws a tree house with a door, window and ladder.",
      "Dad handles high work, but they lead the plan.",
      "They pass tools and hold each wooden plank steady.",
      "Their careful floor test shows every plank holding firmly.",
      "With Dad guiding, they help cut the door and window.",
      "James paints blue. Anna paints yellow. Chips steals the paint lid.",
      "They put the paint beyond Chips's reach, then raise Anna's red-star flag.",
      "Every part on their plan is finished and strong.",
      "They climb up and admire the garden from their window.",
      "Mum raises juice and biscuits while Chips waits below.",
      "That night, their sleeping bags rustle beneath the shining stars."
    ]
  }),

  "ja-b-06": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to help Grandma care for every animal before supper.",
    failedAttempt: "Their two-way chase cannot return escaped Percy to his pen.",
    resolution: "Grandma closes Percy's gate, and the children finish the chores before sharing supper.",
    pages: [
      "James, Anna and Chips arrive for a week at Grandma's farm.",
      "Hens, ducks, Percy the pig and Bess the horse need care.",
      "James gathers five eggs. Not one shell cracks.",
      "Anna feeds three white ducks beside the pond.",
      "Bess lowers her enormous nose, and James strokes the white blaze.",
      "Anna brushes Bess while James offers one red apple.",
      "A gate bangs. Percy charges out and scatters the hens.",
      "James and Anna chase from both sides, but Percy dodges them.",
      "While Grandma shuts Percy's gate, they find Chips eating beans.",
      "Grandma helps close every gate and moves Chips away from the beans.",
      "She cooks garden soup and the eggs James gathers.",
      "Chips starts chewing the fence. James brings safe hay instead."
    ]
  }),

  "ja-b-07": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James wants to perform as the dragon while Anna creates the play's world.",
    failedAttempt: "James steps onstage, sees the crowd and forgets his first line.",
    resolution: "Anna's quiet signal helps him use his practised roar and finish the play.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pages: [
      "Mrs Green announces a school play called The Lost Dragon.",
      "James wants the dragon role, but six classmates do too.",
      "Anna chooses to paint the mountains, sunset and castle.",
      "James practises roaring until Mum needs her earmuffs.",
      "His strongest roar wins him the dragon role.",
      "Anna paints the huge backdrop for three careful days.",
      "On play night, James wears green scales and a red mask.",
      "He steps onstage, sees the crowd and feels his legs wobble.",
      "His first line vanishes. Anna catches his eye and signals.",
      "James breathes deeply and gives his best practised roar.",
      "Then he stomps through the play as children giggle.",
      "James and Anna bow together before the cheering school."
    ]
  }),

  "ja-b-08": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want Chips and Bella to enjoy a safe first play date.",
    failedAttempt: "Uncontrolled chasing soaks the children and damages the flower bed.",
    resolution: "The pets finally rest, share refreshments and leave the children a calmer plan for next time.",
    pages: [
      "Mrs Chen brings bouncy Bella to meet Chips.",
      "James and Anna expect one calm, easy play date.",
      "Anna opens the gate, and Bella bounds inside like a rocket.",
      "Bella circles Chips once. He bolts after her.",
      "The pets race faster than James and Anna can stop them.",
      "Bella crashes into the pool, soaking both children.",
      "Then both pets leap through the flower bed, scattering petals.",
      "Their first plan fails. Even Mrs Chen sits down laughing.",
      "After three wild laps, Chips and Bella flop onto the lawn.",
      "They like each other, but their games need calmer rules.",
      "Mum brings water for Bella and chopped apple for Chips.",
      "Next time, James and Anna begin with bowls and a rest area."
    ]
  }),

  "ja-b-09": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to ride their new bicycles to the duck pond.",
    failedAttempt: "James watches the ground, wobbles and lands in the hedge.",
    resolution: "He follows Anna's advice, practises safely and completes the family ride.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13],
    pages: [
      "James receives a red bike. Anna receives a purple one.",
      "They wear helmets. Anna checks both brakes before riding.",
      "James stares down, wobbles and tumbles softly into the hedge.",
      "Anna looks ahead and rides steadily to the path's end.",
      "“Keep your eyes where you want to go,” Anna explains.",
      "James tries again. He looks ahead and stays upright.",
      "Soon they can ride the whole lane without stopping.",
      "James ignores the safety rule, lets go and reaches the same hedge.",
      "Keeping both hands on, they ride with Dad to the pond.",
      "They rest beside the ducks and eat their sandwiches.",
      "James and Anna race home and reach the gate together.",
      "Their legs ache, but tomorrow's safe ride is already planned."
    ]
  }),

  "ja-b-10": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to complete one whole night camping in the garden.",
    failedAttempt: "Their air-horn plan scares Dad, and the crowded tent keeps everyone awake.",
    resolution: "They adjust, last until morning and learn how to plan the next camp better.",
    sourcePageNumbers: [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14],
    pages: [
      "Dad raises a green tent for one garden camping night.",
      "James and Anna help, while Dad removes a peg from Chips.",
      "They pack sleeping bags, a torch, cards, books and snacks.",
      "Dad lights a safe fire dish for toasted marshmallows.",
      "Chips lunges for a hot marshmallow, but Dad pulls it away.",
      "At midnight, a fox bark makes everyone freeze.",
      "Anna chooses Dad's air horn to scare it away.",
      "The horn scares the fox, but it startles Dad too.",
      "They try sleeping in a squashed, uncomfortable row.",
      "Morning arrives. Chips has chewed one corner of the tent.",
      "At sunrise, they crawl from the tent and eat hot toast with jam.",
      "Chips grabs the zip. Anna rescues it. Next time, he sleeps indoors."
    ]
  }),

  "ab-c-01": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden wants to discover whether he can manage the unfamiliar work in Grade 1.",
    failedAttempt: "His first joined-writing attempt ends in a large ink blot and embarrassment.",
    resolution: "Betty's imperfect page helps him try again, then curiosity carries him through the day.",
    pages: [
      "Summer ended. Aiden studied his new school bag and wondered whether Grade 1 would be too hard.",
      "Betty had packed twice. She expected proper lessons; Aiden expected difficult mistakes.",
      "Miss Okafor welcomed them into a bright classroom filled with books.",
      "She promised reading, number puzzles and investigations. Aiden leaned forward despite himself.",
      "His desk stood beside Betty's. The smooth space felt ready for new work.",
      "During handwriting, Aiden's pen slipped and left a huge blot. His face burned.",
      "Betty showed her wonky letters. They laughed, then both began another line.",
      "At lunch, Mum's hidden note read, “You've got this, star.”",
      "The next number puzzle stretched Aiden's thinking, but he kept working.",
      "He answered one question aloud and earned a gold star beside Betty.",
      "During science, a woodlouse made Aiden forget every morning worry.",
      "At the gate, both children told Mum about the day at once.",
      "That night, Aiden fell asleep before tomorrow's worry could begin."
    ]
  }),

  "ab-c-02": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden and Betty want to clear their crowded playroom and earn enough for a reading tent.",
    failedAttempt: "Their first slow customer spends only twenty cents, making the goal seem unreachable.",
    resolution: "Their careful sorting, signs and lemonade attract buyers, while Aiden chooses one treasured toy to keep.",
    pages: [
      "Toys filled every shelf and covered the playroom floor. Something had to change.",
      "Betty proposed a yard sale. Aiden proposed saving for a garden reading tent.",
      "They sorted everything: red meant sell, blue meant keep, yellow meant maybe.",
      "Betty made price stickers while Aiden decorated the gate sign.",
      "On Saturday, they arranged toys and books across two folding tables.",
      "Mr Perkins examined everything for twenty minutes, then spent only twenty cents.",
      "Their tent fund looked impossible. Then families arrived and the tables emptied quickly.",
      "By midday, Betty counted forty-eight dollars and thirty cents.",
      "Rosa chose books, a snow globe and the forgotten foam sword.",
      "Their lemonade sold out, adding the final money they needed.",
      "They compared ideas and chose a proper tent for reading together.",
      "They pictured rainy afternoons with books inside their dry garden shelter.",
      "Aiden found Nelly, his old elephant, and chose memories over one more sale."
    ]
  }),

  "ab-c-03": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden and Betty want to discover the coast and bring home one true memory each.",
    failedAttempt: "Heavy rain cancels their outdoor plan and makes their short holiday feel as if it is slipping away.",
    resolution: "They use the clearing weather to climb the lighthouse, record discoveries and choose lasting keepsakes.",
    pages: [
      "The final bell rang. Aiden and Betty raced home shouting, “Holiday!”",
      "Their blue cottage stood beside a clifftop path and the wide sea.",
      "During the long drive, they planned to bring home one true coastal memory each.",
      "Aiden chose the larger bedroom; Betty chose the room with the sea view.",
      "Beyond the last dune, the green sea made both children stop and stare.",
      "Aiden filled his field notebook with rock-pool creatures and careful labels.",
      "Betty learned to steer her boogie board through the foaming waves.",
      "Then hard rain cancelled their outdoor plans. The holiday clock kept moving.",
      "When the rain cleared, they climbed all one hundred and forty-seven lighthouse steps.",
      "From the top, silver water curved around bays, cliffs and a fishing village.",
      "That evening, they shared salty chips beside the sea wall.",
      "Betty chose one smooth white pebble. Aiden chose his filled notebook.",
      "Home looked unchanged, but their real coastal memories had changed them."
    ]
  }),

  "ab-c-04": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to help foster dog Socks feel safe in their unfamiliar home.",
    failedAttempt: "The cosy kitchen crate does not settle Socks; he leaves it to seek Aiden's room.",
    resolution: "The family observes his needs, builds dependable routines and lets trust grow at his pace.",
    pages: [
      "Uncle Eddie arrived with a travel bag and a scratching pet carrier.",
      "He helped rescue centres understand how frightened dogs learn to trust.",
      "Inside curled Socks, a cream-and-brown dog with four black paws.",
      "Uncle Eddie said Socks learned quickly, liked people and sometimes caused trouble.",
      "Socks carried Aiden's watch to his blanket and guarded it proudly.",
      "Uncle Eddie needed a safe foster home. Their family agreed to help.",
      "Socks explored low drawers, warm windowsills, slippers and hidden corners.",
      "“Hide anything shiny,” Uncle Eddie said, “and shut the airing cupboard.”",
      "At dinner, Socks wore his harness and carried a fallen napkin away.",
      "Dad's cosy kitchen crate failed; Socks slept beside Aiden's torch instead.",
      "So they built routines: one harness peg, gentle greetings and quiet resting places.",
      "Socks still collected pegs, ribbon and every one of Betty's hair bobbles.",
      "Mum measured his food while Socks waited calmly on his mat.",
      "Aiden added one last note: Socks sleeps wherever I leave my torch."
    ]
  }),

  "ab-c-05": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to find Socks after discovering his harness hook empty.",
    failedAttempt: "Searching the entire house, garden and street produces no sign of him.",
    resolution: "A neighbour's call and Aiden's notes reveal Socks followed warmth through a cat flap; the family improves his safety.",
    pages: [
      "Socks's red harness hook was empty. So was his sleeping crate.",
      "Every morning he waited there, but on Tuesday he had vanished.",
      "They searched cushions, shelves, cupboards and the garden. Socks was nowhere.",
      "Then Mum remembered the loose side-gate latch and its dog-sized gap.",
      "They called along the windy street. Only dry leaves answered.",
      "Betty made clear missing-dog posters, and everyone delivered them.",
      "Aiden opened his notes: warm spots, shiny things, interesting smells.",
      "Still no clue fitted. Aiden waited on the step as clouds gathered.",
      "Mrs Obi phoned. A small dog was sleeping beside her radiator.",
      "The family ran three houses down without stopping for shoes.",
      "Socks lay beside the warm radiator, chewing a dog biscuit.",
      "Muddy prints showed he had entered through Mrs Obi's cat flap.",
      "Aiden held Socks close and let out the breath he had been holding.",
      "They fixed the latch and added a tracker tag. Socks trotted home on his lead."
    ]
  }),

  "ab-c-06": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to grow safe crystals and explain their method at the Science Fair.",
    failedAttempt: "After several careful mornings, the closed jar still appears unchanged.",
    resolution: "They keep the conditions steady, record every day and earn recognition for explaining their method.",
    pages: [
      "Miss Okafor announced the Science Fair. Aiden opened his notebook immediately.",
      "Aiden and Betty compared ideas until safe crystal growing won.",
      "They ordered the kit, then waited four impatient days for it.",
      "With Mum supervising, they wore goggles and followed every safe instruction.",
      "For several mornings, the closed jar looked unchanged on its high shelf.",
      "They did not restart it. They photographed and charted the same jar daily.",
      "Then sharp blue crystals began to climb the sides of the jar.",
      "Betty packed the board. Aiden held the closed jar in both hands.",
      "In the crowded hall, their small jar looked lost beside the bigger projects.",
      "The judges stayed because Betty explained why each recorded change happened.",
      "Their project won third place. The judges praised their daily record.",
      "Aiden recorded six rules that made their investigation fair and safe.",
      "Socks watched the moving pen. Betty warned Aiden not to teach him."
    ]
  }),

  "ab-c-07": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to record the reserve's hidden wildlife with Socks and Uncle Eddie.",
    failedAttempt: "Watching only from the bird hide reveals one quick kingfisher, then nothing else nearby.",
    resolution: "They follow Socks safely across the bridge, find a spring pool and add several species to the log.",
    pages: [
      "Uncle Eddie returned for a weekend. Socks greeted him by racing in circles.",
      "He suggested a reserve where they could record birds, insects and river life.",
      "Inside, Socks stopped and listened as many wild sounds crossed the path.",
      "Betty found the hide, binoculars and a board listing twelve species.",
      "She logged one flashing kingfisher, but the nearby reeds revealed nothing more.",
      "Socks pulled towards the footbridge. Uncle Eddie checked the map and clipped his lead.",
      "Across the river, Socks followed new sounds into thicker trees.",
      "He found a spring pool alive with dragonflies and tiny swimmers.",
      "Back at the hide, Betty logged every species while Uncle Eddie checked names.",
      "At sunset, Socks walked beside Uncle Eddie through the glowing meadow.",
      "After Uncle Eddie left, Socks watched the road, then rested against Aiden.",
      "Aiden and Betty each began a nature notebook that evening.",
      "Their first pages proved the reserve adventure had travelled home with them."
    ]
  }),

  "ab-c-08": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden wants repeated name-calling to stop without facing it alone or unsafely.",
    failedAttempt: "Betty asks Marcus to stop, but the name-calling happens again on Monday.",
    resolution: "Aiden uses his practised words, walks away and reports the pattern to Miss Okafor, who intervenes.",
    pages: [
      "Marcus kept calling Aiden a hurtful name. Aiden wanted it to stop.",
      "At home, Aiden told Betty exactly what had been happening.",
      "Betty suggested clear words, walking away and telling a trusted adult.",
      "Aiden practised the plan aloud while Socks stayed beside him.",
      "On Friday, Betty said, “His name is Aiden. Please stop.”",
      "Aiden was glad Betty had helped, but next time he wanted to say it himself.",
      "On Monday, Marcus repeated it. Aiden said clearly, “My name is Aiden. Stop.”",
      "He walked away with Betty and reported every incident to Miss Okafor.",
      "His voice had wobbled, but he had said the words and found help.",
      "Betty bumped his shoulder with hers. “I heard you,” she said.",
      "A week later, Marcus used Aiden's name and apologised for an accidental bump.",
      "Miss Okafor taught the class how to report repeated unkind behaviour.",
      "Aiden knew the bullying was not his fault and adults would help keep him safe."
    ]
  }),

  "ab-c-09": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden wants to know whether losing his loose tooth will hurt or change how he looks.",
    failedAttempt: "Mum's explanation comforts him briefly, but uncertainty returns before the tooth falls out.",
    resolution: "Betty's experience and Aiden's painless loss give him evidence; he welcomes the growing adult tooth.",
    pages: [
      "Aiden bit an apple and felt one front tooth wobble.",
      "Betty gave the tooth one tiny wiggle. “A new one grows underneath,” she said.",
      "That night, Aiden worried about pain and the strange empty gap.",
      "Mum explained that loose baby teeth were normal, but he still wondered.",
      "Next day, Betty lost a tooth and wrapped the tiny thing in tissue.",
      "She showed her gap and said the pain lasted only a moment.",
      "On Thursday, Aiden's tooth slipped out while he read. It did not hurt.",
      "He placed the tiny tooth in an envelope beneath his pillow.",
      "By morning, a coin had replaced the envelope. Aiden grinned.",
      "Three weeks later, a larger new tooth appeared inside the gap.",
      "Betty said he looked older, not strange. Aiden grinned at the mirror.",
      "Socks inspected both tooth gaps with his curious nose.",
      "Aiden could not stop checking the new tooth with his tongue."
    ]
  }),

  "ab-c-10": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden wants four drawings that explain how people used the castle, while Betty guides the route.",
    failedAttempt: "The dim underground room leaves his page blank because he cannot see enough evidence to draw.",
    resolution: "He looks more closely at later clues and completes a four-part memory page at home.",
    pages: [
      "Dad showed them a castle picture. Aiden packed his notebook; Betty packed a guidebook.",
      "Seat belts fastened, they watched the real castle rise above the hill.",
      "Across the wooden bridge, Aiden drew his first clue: protection over the moat.",
      "Inside the great hall, worn floor stones showed where countless feet had passed.",
      "Betty's picture map led them from the hall towards armour and tower.",
      "A guide showed plate armour, and Aiden tested one heavy glove.",
      "Underground, dim light defeated his next sketch. The notebook page stayed blank.",
      "After climbing 112 steps, the tower's wide view revealed another purpose.",
      "Betty imagined lookouts watching the river while Aiden drew what they saw.",
      "On the way down, Aiden spotted an arrow slit. The thick wall made sense now.",
      "Betty chose a model; Aiden chose a picture book with clearer details.",
      "Driving home, they compared the worn floor, high view and hidden opening.",
      "Using every clue, Aiden completed four drawings that explained their castle day."
    ]
  })
});

export default GUIDED_READING_HUMAN_FICTION_REWRITES;
