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
    storySpine: "James and Anna want to turn their cardboard rocket into a shared journey to the Moon.",
    failedAttempt: "Their first countdown leaves the rocket sitting in the garden.",
    resolution: "Anna starts a make-believe flight; they land on the Moon, jump with Zim and return to cake in the garden.",
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14],
    pages: [
      "James and Anna find big boxes in the garden.",
      "“Let’s make a rocket!” says James. “To the Moon!”",
      "Anna draws wings, a door, and one pointy nose.",
      "Snip! Rip! Tape! Their rocket grows all morning.",
      "At last, the red and silver rocket is ready.",
      "“Five, four, three, two, one!” The rocket stays still.",
      "“Let’s pretend!” says Anna. Up, up goes their rocket.",
      "In their game, the rocket lands on the Moon.",
      "A little green alien waves. “I’m Zim! Come and jump!”",
      "James jumps. Anna jumps. Their feet hardly touch the ground!",
      "“Home!” calls James. They wave to Zim and blast off.",
      "Mom brings cake. The astronauts tumble onto the grass."
    ]
  }),

  "james-and-anna-02-chips": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James wants to teach Chips to drop things; Chips ignores him, Dad demonstrates with a hat, and James finally gets his sweater back with the same command.",
    failedAttempt: "Chips trots past James, then pulls free on the walk and tugs a rose bush.",
    resolution: "After Anna frees the rose and they feed Chips at home, James uses Drop to get the sweater back.",
    pages: [
      "This is Chips. James wants to teach him “Drop!”",
      "Chips hears James. He trots straight past. Jingle, jingle!",
      "Chips grabs Dad’s hat. Chomp! That is not grass.",
      "“Drop!” says Dad. Chips lets go. Dad grabs his hat.",
      "James clips on the lead. “My turn to try!”",
      "Chips eats grass. James has nothing to rescue.",
      "Chips pulls free. He tugs at a rose bush.",
      "Anna frees the rose. Chips licks her nose.",
      "At home, James fills his bowl. Chips leaves the flowers alone.",
      "The bowl is empty. Chips eyes James’s sweater.",
      "Chomp! Chips pulls the sleeve. James holds out his hand.",
      "“Drop!” says James. Down goes the sweater. Jingle, jingle!"
    ]
  }),

  "james-and-anna-03-shopping": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to bring every item on Mom's list home safely.",
    failedAttempt: "The cake stand distracts them before they finish checking the list.",
    resolution: "They check again, protect the eggs and unpack every item before Mom cuts the cakes.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "Mom has a long list. She needs two helpers.",
      "James grabs the list. Anna grabs the bags. Ready!",
      "The bright shop smells of warm bread and ripe fruit.",
      "“Bread, grapes, cheese, eggs, and orange juice,” James reads.",
      "Anna picks the round loaf with crunchy seeds.",
      "Grapes, cheese, eggs, juice—everything goes in. James carries the eggs with both hands.",
      "Then a shiny cake stand stops them. Is the list done?",
      "“Check first,” says Mom. They tick off every item.",
      "One lemon cake for James. One jam tart for Anna.",
      "At checkout, James counts each item. Every egg stays whole.",
      "The bread smells wonderful. James reaches in. Anna gives him the look.",
      "At home, they unpack every item. Then Mom cuts the cakes."
    ]
  }),

  "james-and-anna-04-dentist": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to finish their dental checks despite feeling frightened.",
    failedAttempt: "The waiting room calms them, but James's fear returns in the rising chair.",
    resolution: "James uses one slow breath, then Anna copies him and completes her check.",
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "A dental checkup today! James frowns. Anna folds her arms.",
      "Mom kneels beside them. “I’m coming in with you.”",
      "Anna holds James’s hand. He frowns all the way.",
      "Bright fish zip through the waiting-room tank.",
      "Anna finds a shark book. Her tight shoulders drop.",
      "The chair hums up. James grips both armrests.",
      "He breathes in. He opens wide. The check is quick!",
      "James runs back smiling. “It doesn’t hurt, Anna!”",
      "Anna climbs into the chair. She breathes in too.",
      "The dentist sings. Anna opens wide for the last tooth.",
      "Outside, James shows his rocket sticker. Anna shows her star.",
      "Brush, brush, brush! Two minutes. Chips watches from the door."
    ]
  }),

  "james-and-anna-05-tree-house": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to build a safe tree house from their own plan.",
    failedAttempt: "Chips steals the paint lid before the final details are finished.",
    resolution: "They recover the paint lid, finish their tree house and sleep in the place they designed.",
    sourcePageNumbers: [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14],
    pages: [
      "James and Anna stare up at the old oak tree.",
      "James draws their tree house: door, window, flag, ladder.",
      "Dad studies the plan. “You two are in charge.”",
      "Dad climbs the ladder. James passes up the hammer.",
      "Step, step, stomp! The new floor stays firm.",
      "Dad guides the saw. James cuts wood for the window.",
      "James paints blue. Anna paints yellow. Chips steals the paint lid.",
      "They rescue the lid and move the paint high. Up goes the flag!",
      "“Can we sleep up there?” James asks Dad.",
      "They climb up. The whole garden fills their window.",
      "Mom sends juice and cookies up on a rope.",
      "Under the stars, two sleeping bags rustle in their tree house."
    ]
  }),

  "ja-b-06": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to help Grandma gather food and care for the farm animals.",
    failedAttempt: "Their two-way chase cannot return escaped Percy to his pen.",
    resolution: "Grandma shuts Percy's gate, Anna stops Chips and the gathered eggs become supper.",
    pages: [
      "James, Anna, and Chips arrive at Grandma’s sunny farm.",
      "Grandma has eggs to gather and animals to feed.",
      "Five warm eggs. One, two, three, four, five—safe in the basket!",
      "Anna feeds three white ducks. One tickles her palm.",
      "Bess lowers her soft nose. James reaches up and strokes it.",
      "Anna brushes Bess. James offers one bright red apple.",
      "Bang! Percy escapes. Hens flap across the yard.",
      "James runs left. Anna runs right. Percy zigzags between them!",
      "Grandma shuts Percy’s gate. Then they spot Chips in the beans.",
      "“Out, Chips!” Anna points. Grandma leads him from the beans.",
      "Grandma cooks garden soup and James’s eggs. Every bowl is empty.",
      "Crunch! Chips bites the fence. James holds out hay. Chips turns."
    ]
  }),

  "ja-b-07": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James wants to perform as the dragon while Anna creates the play's world.",
    failedAttempt: "James steps onstage, sees the crowd and forgets his first line.",
    resolution: "Anna's quiet signal helps him use his practiced roar and finish the play.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pages: [
      "Mrs. Green holds up a script. “Our play needs a dragon!”",
      "James wants the part. Six hands shoot up too.",
      "Anna picks her part: painter of mountains, sunset, and castle.",
      "James roars all week. Mom grins in earmuffs. Chips peeks out.",
      "His biggest roar slides Mrs. Green’s glasses down. He gets the part!",
      "Anna paints for three days. Her giant sunset glows.",
      "Play night! James wears green scales and a red mask.",
      "The lights rise. James sees every face. His knees wobble.",
      "His first line disappears. Anna gives one steady thumbs-up.",
      "James breathes in. His biggest dragon roar shakes the stage!",
      "Now he stomps through the play. The front row squeals.",
      "James and Anna bow together. The whole school cheers."
    ]
  }),

  "ja-b-08": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want Chips and Bella to enjoy a safe first play date.",
    failedAttempt: "Uncontrolled chasing soaks the children and sends petals flying.",
    resolution: "Mrs. Chen calls the pets back; James holds Bella while Anna supports the bent flowers, then the animals rest and drink.",
    pages: [
      "Mrs. Chen brings bouncy Bella to meet Chips.",
      "James and Anna grin. “This play date will be easy!”",
      "Anna opens the gate. Bella rockets into the garden.",
      "Bella circles Chips. One, two—Chips races after her!",
      "Round the garden they fly. James cannot catch either pet.",
      "Splash! Bella hits the pool. James and Anna drip.",
      "Bent flowers, flying petals—too rough! The children call, “Stop!”",
      "Mrs. Chen laughs, then sees the mess. She calls both pets back.",
      "At last, both pets flop down. Chips licks Bella’s ear.",
      "James holds Bella’s lead. Anna props up the bent flowers.",
      "Mom brings water for Bella and apple for Chips.",
      "Chips drinks Bella’s water. “Chips!” James points. Bella wags and shares."
    ]
  }),

  "ja-b-09": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to ride their new bicycles to the duck pond.",
    failedAttempt: "James watches the ground, wobbles and lands in the hedge.",
    resolution: "He follows Anna's advice, keeps both hands on and completes the family ride.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13],
    pages: [
      "Birthday bikes! James gets red. Anna gets purple.",
      "Helmets on. Anna checks both brakes. The duck pond waits.",
      "James watches his feet. Wobble—rustle! He lands in the hedge.",
      "Anna looks ahead. Her purple bike rolls straight and steady.",
      "“Look where you want to go,” Anna tells him.",
      "James looks ahead. One pedal, two—he stays up!",
      "Soon both bikes roll down the whole sunny lane.",
      "James lifts both hands. Three seconds later: same hedge.",
      "Both hands on, James rides beside Anna and Dad.",
      "At the duck pond, they rest and share sandwiches.",
      "They race home. Red and purple wheels cross together!",
      "James whispers, “Ride tomorrow?” Anna is already fast asleep."
    ]
  }),

  "ja-b-10": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to complete one whole night camping in the garden.",
    failedAttempt: "A fox wakes them, then morning reveals that Chips has chewed the tent.",
    resolution: "They stay outside until breakfast, and Anna patches the hole before Chips can chew it again.",
    sourcePageNumbers: [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14],
    pages: [
      "Dad wrestles with a green tent. Chips steals one peg.",
      "James hammers. Anna threads poles. Dad rescues the peg.",
      "In go sleeping bags, flashlight, cards, books, and snacks.",
      "Dad watches the little fire. They turn their marshmallow sticks.",
      "Chips lunges. Dad pulls the hot marshmallow away. Phew!",
      "At midnight, a fox barks. They stay inside the tent.",
      "Anna lifts the horn. “Wait!” calls Dad from the house.",
      "Dad steps outside. The fox bolts across the lawn.",
      "Chips leans on James. James leans on Anna. Squash!",
      "Morning shines through the seam Chips chewed.",
      "Dad brings toast. “Breakfast in bed!” says James.",
      "Anna presses on a patch. Chips sniffs it. “Don’t!”"
    ]
  }),

  "ab-c-01": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden wants to find out whether he can handle the unfamiliar work in Grade 1.",
    failedAttempt: "His first handwriting attempt ends in a huge ink blot and a burning face.",
    resolution: "Betty shares her own wobbly work, so Aiden tries again and discovers that hard work can also be fun.",
    pages: [
      "Summer was over. Aiden stared at his new school bag. Was Grade 1 going to be hard?",
      "Betty had packed twice. “Real lessons at last!” she said. Aiden pictured one mistake after another.",
      "Miss Okafor welcomed them into a bright classroom filled with books.",
      "“We'll read, solve number puzzles, and investigate things,” she said. Aiden leaned closer.",
      "His desk was right beside Betty's. Aiden ran one finger across its smooth top.",
      "In handwriting, his pen slipped. Splat! A huge blot covered his page. Aiden's cheeks burned.",
      "Betty slid over her page. “Mine looks like a wobbly caterpillar.” Aiden laughed—and tried again.",
      "At lunch, Mom's note hid under his sandwich: “You've got this, star.” Aiden smiled.",
      "Next came number puzzles. Each one was harder, but Aiden did not stop.",
      "He answered one question aloud and earned a gold star beside Betty.",
      "Then a woodlouse scuttled across the science tray. Aiden forgot to be nervous.",
      "At the gate, both children told Mom about the day at once.",
      "That night, Aiden fell asleep quickly. Grade 1 had been hard—and fun."
    ]
  }),

  "ab-c-02": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden and Betty want to clear their crowded playroom and earn enough for a reading tent.",
    failedAttempt: "Their first slow customer spends only twenty cents, making the goal seem unreachable.",
    resolution: "A busy sale and their lemonade stand complete the tent fund, while Aiden chooses one treasured toy to bring inside it.",
    pages: [
      "The playroom floor had disappeared under toys. Aiden stepped on the foam sword. Ouch!",
      "“Yard sale!” said Betty. “Then we can buy a reading tent,” Aiden said.",
      "They sorted everything: red meant sell, blue meant keep, yellow meant maybe.",
      "Betty made price stickers while Aiden decorated the gate sign.",
      "On Saturday, they arranged toys and books across two folding tables.",
      "Mr. Perkins looked at everything for twenty minutes. Then he bought one twenty-cent duck.",
      "At last, families crowded in. Toys vanished from the tables faster than Betty could count.",
      "By midday, Betty counted forty-eight dollars and thirty cents.",
      "Rosa chose books, a snow globe and the forgotten foam sword.",
      "Aiden's lemonade jug emptied. Clink! The last coins dropped into their tent fund.",
      "They counted every coin with Mom. They had enough for the reading tent!",
      "They opened a book and planned rainy afternoons inside their new tent.",
      "One toy stayed. Aiden hugged Nelly, his elephant. “You belong in our reading tent.”"
    ]
  }),

  "ab-c-03": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Betty wants to explore the places on the seaside brochure; rain interrupts their outings, so she draws a route that takes the family to the lighthouse.",
    failedAttempt: "Rain stops the beach outings and leaves Aiden slumped over the indoor game.",
    resolution: "Betty plans a route during the rain, leads the family to the lighthouse and sees their route from above; Aiden wants to keep her map.",
    pages: [
      "The final bell rang. Aiden and Betty raced home shouting, “Vacation!”",
      "Mom opened the cottage brochure. “One week by the sea.” Betty traced the coast. “Can we visit all these places?”",
      "Three hours later, Betty was still counting red cars. Aiden had finished two chapters—and one nap.",
      "They raced upstairs. Aiden chose the bigger room. Betty opened her window—and heard the sea.",
      "Past the last dune, the green sea filled the sky. Aiden stopped. “Wow,” was all he said.",
      "Aiden filled his field notebook with tide-pool creatures and careful labels.",
      "Betty learned to steer her boogie board through the foaming waves.",
      "Rain rattled the window. Aiden slumped over the board game. Betty drew their route: beach, harbor, then lighthouse.",
      "The rain stopped. Betty led them along her route. At the lighthouse, Aiden counted all 147 steps.",
      "From the top, they traced their route below. “There’s the beach!” said Betty. Aiden found the tiny harbor.",
      "At supper, Aiden held up a fry. “I’m going to draw the whole trip. Even the rain!” Betty laughed.",
      "Betty turned one smooth white pebble in her fingers. “This one is coming home,” she said.",
      "On the drive home, Betty held her pebble. “Your map got us there,” Aiden said. “Can I keep it?”"
    ]
  }),

  "ab-c-04": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to help foster dog Socks feel safe in their unfamiliar home.",
    failedAttempt: "The cozy kitchen crate does not settle Socks; he leaves it to seek Aiden's room.",
    resolution: "The family lets Socks settle near Aiden; he approaches both children for petting and rests beside Aiden as he draws.",
    pages: [
      "Scritch, scratch! Uncle Eddie's pet carrier bumped beside his travel bag. “Who's in there?” Aiden asked.",
      "“A rescue dog,” said Uncle Eddie. “Frightened dogs need time before they trust a new home.”",
      "A small brown-and-white dog curled inside. Four black paws peeked out. “Socks,” Betty whispered.",
      "Socks crept onto the blanket. “He learns fast,” Uncle Eddie said. “He also finds trouble fast.”",
      "Socks spotted Aiden's watch, carried it to his blanket, and pinned it under one paw. “Hey!”",
      "Uncle Eddie needed a safe foster home. Their family agreed to help.",
      "Socks nosed through low drawers, lined up slippers, then carried three letters behind the television.",
      "“Hide shiny things. Shut the linen closet,” Uncle Eddie warned. Socks listened from his mat.",
      "At dinner, Dad dropped his napkin. Socks carried it to his mat—then fetched Uncle Eddie's slipper.",
      "Dad made a cozy kitchen crate. By morning, Socks was asleep beside Aiden's flashlight instead.",
      "Next morning, Aiden crouched beside Socks. This time, Socks came close enough for both children to stroke him.",
      "Socks collected pegs, ribbon, and Betty's hair ties. Betty traded him a chew ring. Drop!",
      "Mom measured his food while Socks waited calmly on his mat.",
      "Aiden drew Socks beside his flashlight. Socks settled on his blanket, close enough to hear the scratch of Aiden’s pencil."
    ]
  }),

  "ab-c-05": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to find Socks after discovering his harness hook empty.",
    failedAttempt: "Searching the entire house, garden and street produces no sign of him.",
    resolution: "A neighbor's call and Aiden's notes reveal Socks followed warmth through a cat flap; the family improves his safety.",
    pages: [
      "Socks's red harness hook was empty. So was his sleeping crate.",
      "Every morning he waited there. But on Tuesday, Socks had vanished.",
      "They searched cushions, shelves, cupboards and the garden. Socks was nowhere.",
      "Then Mom saw the loose side-gate latch. Beneath it was a Socks-sized gap.",
      "“Socks!” they called into the wind. Dry leaves skittered past. No bark came back.",
      "Betty printed fourteen missing-dog posters. The family hurried from door to door.",
      "Aiden checked his notes: warm spots, shiny things, interesting smells. Which clue could help?",
      "None of them did. Aiden sat on the step as gray clouds crowded over the street.",
      "The phone rang. Mrs. Obi had found a small dog asleep beside her warm radiator.",
      "They raced three houses down in their socks. Crunch, crunch came from Mrs. Obi's kitchen.",
      "Socks lay beside the warm radiator, chewing a dog biscuit.",
      "Muddy pawprints led from Mrs. Obi's cat flap. Socks had followed the warmth straight inside.",
      "Aiden hugged him tight. Socks licked his cheek. “I thought we'd lost you,” Aiden whispered.",
      "They fixed the latch and added a tracker tag. Socks trotted home on his leash."
    ]
  }),

  "ab-c-06": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to grow safe crystals and explain their method at the Science Fair.",
    failedAttempt: "Two mornings pass without crystals, and Aiden wants to start again.",
    resolution: "Betty asks him to wait; their dated photographs and chart show growth that the children can explain at the fair.",
    sourcePageNumbers: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "“Science Fair!” Miss Okafor announced. Aiden's notebook was open before she finished speaking.",
      "Aiden listed eleven ideas. Betty listed nine. “Three match,” she said. “Great minds!”",
      "Their crystal kit arrived. Mom read the instructions with them, then mixed the powder and water.",
      "Nothing on morning one. Nothing on morning two. Mom moved the jar above Socks’s nose. Aiden wanted to start again.",
      "“Let’s wait,” Betty said. Days later, blue crystals filled the jar. Aiden photographed them, and Betty recorded the date.",
      "They lined up the photographs beside Betty’s chart. Each day’s crystals were taller. “Look!” Aiden said. “They kept growing.”",
      "Betty packed the board. Aiden held the closed jar in both hands.",
      "The hall was packed with volcanoes and planets. Their little jar looked very little. Aiden swallowed.",
      "But the judges kept asking questions. Betty showed the chart. Aiden explained why they had waited.",
      "“Third place!” Miss Okafor cheered. Their careful daily record had caught the judges' attention.",
      "Aiden numbered the days in his notebook. Socks followed every stroke of the pencil. “Are you checking my work?”",
      "“He's learning science,” Aiden whispered. Betty blocked the doorway. “Please don't teach him to open jars.”"
    ]
  }),

  "ab-c-07": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to record the nature preserve's hidden wildlife with Socks and Uncle Eddie.",
    failedAttempt: "After one kingfisher, the children wait at the bird blind without seeing more birds.",
    resolution: "Following the path with Socks leads them to aquatic insects; Betty fills the logbook, and the children remember to include their animal guide.",
    pages: [
      "Ding-dong! Socks saw Uncle Eddie and spun in circles. His tail thumped the door.",
      "“Let's visit the nature preserve,” Uncle Eddie said. “We'll record everything we spot.”",
      "At the preserve, insects buzzed, birds called, and water rushed. Socks stopped to listen.",
      "Betty opened the bird blind’s logbook. She wanted to fill a page, but the reeds hardly moved.",
      "A blue-and-orange kingfisher flashed past. “One!” Betty whispered, adding it to the logbook.",
      "They waited. No more birds came. Socks tugged toward the bridge, so Uncle Eddie picked up his leash.",
      "Across the bridge, they followed the path beside the water. Socks tugged again. Somewhere ahead, wings buzzed.",
      "Dragonflies skimmed a pool. Beneath them, little beetles paddled. Aiden crouched. “There’s a whole other world down there!”",
      "Back in the bird blind, Betty drew a dragonfly and beetles. The empty page was full of legs and wings.",
      "At sunset, Socks walked beside Uncle Eddie through the glowing meadow.",
      "After Uncle Eddie left, Socks watched the road, then rested against Aiden.",
      "Aiden and Betty each began a nature notebook that evening.",
      "“We forgot one animal,” Betty said. Socks snored between their chairs. Aiden grinned. “Our guide!”"
    ]
  }),

  "ab-c-08": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden wants the repeated name-calling to stop; asking Marcus is not enough, so he and Betty tell Miss Okafor, who intervenes and checks on him.",
    failedAttempt: "Marcus laughs at Aiden’s request to stop and repeats the name-calling at lunch despite Betty’s objection.",
    resolution: "Miss Okafor sets a boundary and monitors the week; the name-calling stops, and Marcus lets Aiden pass with his lunch tray.",
    sourcePageNumbers: [1, 2, 3, 4, 7, 5, 6, 8, 13, 12, 9, 10, 11],
    pages: [
      "Marcus called Aiden a hurtful name again. Betty saw Aiden look down.",
      "At home, Aiden told Betty. “He says it every day. I want it to stop.”",
      "“Want me to come with you?” Betty asked. Aiden nodded. “I want to tell him to stop first.”",
      "Aiden tried the words aloud. They sounded small in his bedroom. Socks looked up. Aiden tried once more.",
      "Next morning, Marcus started again. “Stop calling me that,” Aiden said. Marcus laughed, and Aiden looked away.",
      "At lunch, Marcus did it again. Betty stepped beside Aiden. “He asked you to stop.” Marcus shrugged.",
      "“Come on,” Betty said. “We’ll tell Miss Okafor.” This time, Aiden went with her. His lunch could wait.",
      "Aiden’s voice shook outside the classroom. Betty stayed beside him. Together, they went in.",
      "Miss Okafor listened. “You did nothing wrong,” she said. “I’ll speak to Marcus and stay close at lunch.”",
      "Miss Okafor spoke to Marcus. “No more name-calling.” She checked on Aiden at lunch and playtime all week.",
      "That evening, Aiden wrote about the week. He added one more line: No names today.",
      "Betty bumped his shoulder with hers. “You told her,” she said. “We told her,” Aiden said.",
      "At lunch, Marcus stepped aside. “After you, Aiden.” Aiden carried his tray past him. His hands stayed steady."
    ]
  }),

  "ab-c-09": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden wants to know whether losing his loose tooth will hurt or change how he looks.",
    failedAttempt: "Mom's explanation comforts him briefly, but uncertainty returns before the tooth falls out.",
    resolution: "Betty's experience and Aiden's painless loss answer his fear, and he decides that he likes the new tooth.",
    pages: [
      "Aiden bit an apple and felt one front tooth wobble.",
      "Betty shone her flashlight. “A baby tooth! A bigger tooth is pushing up below it.”",
      "That night, Aiden kept touching the tooth. Would it hurt? Would the gap look strange?",
      "“Loose teeth mean you're growing,” Mom said. Aiden nodded, but his stomach still fluttered.",
      "The next day—pop! Betty's tooth came out at lunch. She wrapped it in a tissue.",
      "Betty grinned at her gap. “It pinched for one second. That's all.”",
      "On Thursday, Aiden's tooth slipped out while he read. “Oh!” It had not hurt at all.",
      "He placed the tiny tooth in an envelope beneath his pillow.",
      "By morning, a coin lay where the envelope had been. Aiden raced to show Mom.",
      "Three weeks later, a broad white edge peeked through his gum. The new tooth was coming!",
      "“You don't look strange,” Betty said. “You look like Aiden—with one new tooth.”",
      "Socks inspected both tooth gaps with his curious nose.",
      "Aiden stopped checking. He scratched Socks behind one ear. “I like my new tooth,” he said."
    ]
  }),

  "ab-c-10": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY"],
    storySpine: "Aiden wants to fill one notebook page with clues about how people used the castle.",
    failedAttempt: "Aiden cannot work out what the dark underground room was used for, and its dim display picture does not help.",
    resolution: "A picture book identifies the dark room as a storeroom; Aiden adds the food barrels to his drawing and understands its purpose.",
    pages: [
      "Dad showed them a castle picture. “I'm filling a page with clues,” Aiden said. Betty grabbed a guidebook.",
      "On Saturday, the castle rose above the hill. “There!” Aiden pressed close to the car window.",
      "Tap, tap went the wooden bridge. “Moat: protection,” Aiden wrote. First clue!",
      "Inside the great hall, worn floor stones showed where countless feet had passed.",
      "Betty opened her map. “Armor room next, then the tower.” Aiden followed.",
      "The guide showed plate armor. Aiden lifted one metal glove. “Heavy!”",
      "Downstairs, Aiden peered into a dark stone room. “What was this for?” The display picture was too dark to tell.",
      "They climbed 112 steps. From the tower, the river and fields stretched far below.",
      "“Lookouts watched from here,” Betty said. Aiden drew the wide view across two notebook lines.",
      "On the way down, Aiden found an arrow slit. “Another clue!” Thick stone protected the archers.",
      "At the shop, Betty chose a model. Aiden found a book with a picture of the dark room.",
      "“It held food!” Aiden told Betty in the car. “Barrels and sacks. That dark room was a storeroom!”",
      "At home, Aiden added barrels to his drawing. Now his castle had somewhere to keep its winter food."
    ]
  })
});

export default GUIDED_READING_HUMAN_FICTION_REWRITES;
