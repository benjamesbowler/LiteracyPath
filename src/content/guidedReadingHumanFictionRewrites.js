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
    storySpine: "James and Anna want their cardboard rocket to reach the Moon.",
    failedAttempt: "Their first countdown leaves the rocket sitting in the garden.",
    resolution: "Shared imaginative play carries them to Zim and back beside Mom's cake.",
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14],
    pages: [
      "James and Anna find big boxes in the garden.",
      "“Let’s make a rocket!” says James. “To the Moon!”",
      "Anna draws wings, a door, and one pointy nose.",
      "Snip! Rip! Tape! Their rocket grows all morning.",
      "At last, the red and silver rocket is ready.",
      "“Five, four, three, two, one!” The rocket stays still.",
      "They shut their eyes. “Blast off!” Whoosh! Up they fly.",
      "Bump! The rocket lands on the pale, quiet Moon.",
      "Zim, a tiny green alien, skips over to say hello.",
      "Boing! James, Anna, and Zim bounce across the Moon.",
      "Soon Anna turns the rocket home. Zim waves below.",
      "Bump! They land back in the garden. Mom brings cake."
    ]
  }),

  "james-and-anna-02-chips": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want their hungry goat to enjoy a safe first walk.",
    failedAttempt: "The rope lead slips, and Chips bites through a rose bush.",
    resolution: "Anna pulls him back; later James's clear instruction makes Chips drop the sweater.",
    pages: [
      "Meet Chips, their small white goat with big brown patches.",
      "Jingle, jingle! His blue bell warns everyone: trouble is coming.",
      "Chips eats grass, bark, and Dad’s best hat.",
      "“Chips!” Dad points. Chips chews and looks away.",
      "James clips on a rope lead. Walk time!",
      "Jingle, jingle! Chips munches grass along the lane.",
      "Snap! Chips bolts free and bites the rose bush.",
      "Anna pulls him back. Chips licks her nose.",
      "At home, James fills his bowl with grass and apple.",
      "The bowl is empty. Chips eyes James’s sweater.",
      "Crunch! Chips grabs one woolly sleeve.",
      "“Drop it, Chips!” James points. Chips lets go. Jingle!"
    ]
  }),

  "james-and-anna-03-shopping": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to bring every item on Mom's list home safely.",
    failedAttempt: "The cake stand distracts them before they finish checking the list.",
    resolution: "They check again, protect the eggs and earn their cakes after lunch.",
    sourcePageNumbers: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "Mom has a long list. She needs two helpers.",
      "James grabs the list. Anna grabs the bags. Ready!",
      "The bright shop smells of warm bread and ripe fruit.",
      "“Bread, grapes, cheese, eggs, and orange juice,” James reads.",
      "Anna picks the round loaf with crunchy seeds.",
      "Grapes, cheese, eggs, juice—everything goes in. James carries the eggs with both hands.",
      "Then a shiny cake stand stops them. Is the list done?",
      "Mom holds up one finger. They check the list.",
      "One lemon cake for James. One jam tart for Anna.",
      "At checkout, James counts each item. Every egg stays whole.",
      "The bread smells wonderful. James reaches in. Anna gives him the look.",
      "The eggs make it home whole. Cake time! “Drop it, Chips!” He does."
    ]
  }),

  "james-and-anna-04-dentist": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to finish their dental checks despite feeling frightened.",
    failedAttempt: "The waiting room calms them, but James's fear returns in the rising chair.",
    resolution: "James uses one slow breath, then Anna copies him and completes her check.",
    sourcePageNumbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13],
    pages: [
      "James frowns at the dentist card. Anna grips her sleeve.",
      "Mom kneels beside them. “The dentist only checks your teeth.”",
      "Anna holds James’s hand. He frowns all the way.",
      "Bright fish zip through the waiting-room tank.",
      "Anna finds a shark book. Her tight shoulders drop.",
      "The chair hums up. James grips both armrests.",
      "He breathes in. He opens wide. The check is quick!",
      "James runs back smiling. “It doesn’t hurt, Anna!”",
      "Anna climbs into the chair. She breathes in too.",
      "The dentist sings. Anna keeps her mouth wide.",
      "Outside, James shows his rocket sticker. Anna shows her star.",
      "Brush, brush, brush! Two minutes. Chips watches from the door."
    ]
  }),

  "james-and-anna-05-tree-house": humanFictionRewrite({
    canonIds: ["HUMAN-JAMES", "HUMAN-ANNA", "HUMAN-CHIPS"],
    storySpine: "James and Anna want to build a safe tree house from their own plan.",
    failedAttempt: "Chips steals the paint lid before the final details are finished.",
    resolution: "They rescue the lid, move the paint high and complete every part of their plan.",
    sourcePageNumbers: [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14],
    pages: [
      "James and Anna stare up at the old oak tree.",
      "James draws their tree house: door, window, flag, ladder.",
      "Dad studies the plan. “You two are in charge.”",
      "Dad works up high. They pass each tool safely.",
      "Step, step, stomp! The new floor stays firm.",
      "Dad guides James’s saw. A little window appears.",
      "James paints blue. Anna paints yellow. Chips steals the paint lid.",
      "They rescue the lid and move the paint high. Up goes the flag!",
      "Blue walls. Yellow door. Red star. Their plan is real!",
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
    resolution: "They stop the rough game, give the flowers space and watch Bella happily share.",
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
      "James folds his arms. Anna says, “Rest. The flowers need space.”",
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
    failedAttempt: "Their air-horn plan scares Dad, and the crowded tent keeps everyone awake.",
    resolution: "They last until breakfast, and Anna pulls the final tent zip free from Chips.",
    sourcePageNumbers: [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14],
    pages: [
      "Dad wrestles with a green tent. Chips steals one peg.",
      "James hammers. Anna threads poles. Dad rescues the peg.",
      "In go sleeping bags, flashlight, cards, books, and snacks.",
      "At dusk, marshmallows toast over Dad’s safe fire dish.",
      "Chips lunges. Dad pulls the hot marshmallow away. Phew!",
      "At midnight, a fox barks. Every camper freezes.",
      "Anna grabs the air horn. “This will scare it!”",
      "HONK! The fox runs. So does Dad—in his pajamas.",
      "Chips leans on James. James leans on Anna. Squash!",
      "Morning light slips in through Chips’s new tent hole.",
      "They last all night! Hot toast tastes wonderful in the morning.",
      "Mom waits at the door. Chips grabs the zip. Anna pulls it free."
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
    storySpine: "Aiden and Betty want to fill their one-week seaside vacation with discoveries.",
    failedAttempt: "Heavy rain cancels the beach and lighthouse plans they had counted on.",
    resolution: "They use the clearing weather to climb the lighthouse, fill Aiden's notebook, and choose one lasting keepsake.",
    pages: [
      "The final bell rang. Aiden and Betty raced home shouting, “Vacation!”",
      "Mom opened the cottage page. “One week by the sea,” she said. Betty whooped.",
      "Three hours later, Betty was still counting red cars. Aiden had finished two chapters—and one nap.",
      "They raced upstairs. Aiden chose the bigger room. Betty opened her window—and heard the sea.",
      "Past the last dune, the green sea filled the sky. Aiden stopped. “Wow,” was all he said.",
      "Aiden filled his field notebook with tide-pool creatures and careful labels.",
      "Betty learned to steer her boogie board through the foaming waves.",
      "On Wednesday, rain hammered the windows. No beach. No lighthouse. Aiden slumped over the board game.",
      "When the rain cleared, they climbed all one hundred and forty-seven lighthouse steps.",
      "From the top, silver water curved around bays, cliffs and a fishing village.",
      "That evening, salty fries tasted best beside the sea. “Maybe rain isn't so bad,” Aiden said.",
      "Betty turned one smooth white pebble in her fingers. “This one is coming home,” she said.",
      "On the drive home, Betty held her pebble. Aiden said, “Next time, I'm bringing two notebooks.”"
    ]
  }),

  "ab-c-04": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to help foster dog Socks feel safe in their unfamiliar home.",
    failedAttempt: "The cozy kitchen crate does not settle Socks; he leaves it to seek Aiden's room.",
    resolution: "The family follows his clues, uses calm routines and safe trades, and lets Socks choose a resting place near Aiden.",
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
      "So they made a new routine: harness on its peg, quiet hellos, and a safe bed near Aiden.",
      "Socks collected pegs, ribbon, and Betty's hair ties. Betty traded him a chew ring. Drop!",
      "Mom measured his food while Socks waited calmly on his mat.",
      "Aiden wrote, Socks sleeps by my flashlight. Socks rested his chin on the page. He was home."
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
    failedAttempt: "After several careful mornings, the closed jar still appears unchanged.",
    resolution: "They keep the jar steady, record every day and earn recognition because they can explain why waiting mattered.",
    pages: [
      "“Science Fair!” Miss Okafor announced. Aiden's notebook was open before she finished speaking.",
      "Aiden listed eleven ideas. Betty listed nine. “Three match,” she said. “Great minds!”",
      "They chose safe crystal growing and ordered a kit. Waiting four days felt like forty.",
      "With Mom supervising, they wore goggles and followed every safe instruction.",
      "Morning one: no crystals. Morning two: still none. Socks stared up at the high shelf.",
      "“Start over?” Aiden asked. “No. Keep watching,” Betty said. They photographed the same jar each day.",
      "Then sharp blue crystals began to climb the sides of the jar.",
      "Betty packed the board. Aiden held the closed jar in both hands.",
      "The hall was packed with volcanoes and planets. Their little jar looked very little. Aiden swallowed.",
      "But the judges kept asking questions. Betty showed the chart. Aiden explained why they had waited.",
      "“Third place!” Miss Okafor cheered. Their careful daily record had caught the judges' attention.",
      "That night, Aiden wrote six fair-test rules in his notebook. Socks watched every pen stroke.",
      "“He's learning science,” Aiden whispered. Betty blocked the doorway. “Please don't teach him to open jars.”"
    ]
  }),

  "ab-c-07": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden and Betty want to record the nature preserve's hidden wildlife with Socks and Uncle Eddie.",
    failedAttempt: "Watching only from the bird blind reveals one quick kingfisher, then nothing else nearby.",
    resolution: "They follow Socks safely across the bridge, find a spring pool, and carry the day's discoveries into new nature notebooks.",
    pages: [
      "Ding-dong! Socks saw Uncle Eddie and spun in circles for forty-five seconds.",
      "“Let's visit the nature preserve,” Uncle Eddie said. “We'll record everything we spot.”",
      "At the preserve, insects buzzed, birds called, and water rushed. Socks stopped to listen.",
      "Betty found the bird blind, binoculars, a logbook, and a board with twelve species.",
      "A blue-and-orange kingfisher flashed past. “One!” Betty whispered, adding it to the logbook.",
      "Then Socks pulled toward the footbridge. Uncle Eddie checked the map and clipped on his leash.",
      "Across the river, Socks followed the sounds through tall grass and into thicker trees.",
      "He stopped at a clear spring pool. Dragonflies zipped above tiny swimmers. “Good find, Socks!”",
      "Back at the hide, Betty logged each creature. Uncle Eddie helped name the tiny swimmers.",
      "At sunset, Socks walked beside Uncle Eddie through the glowing meadow.",
      "After Uncle Eddie left, Socks watched the road, then rested against Aiden.",
      "Aiden and Betty each began a nature notebook that evening.",
      "“I think this is his home now,” Betty said. Socks curled tighter at Aiden's feet."
    ]
  }),

  "ab-c-08": humanFictionRewrite({
    canonIds: ["HUMAN-AIDEN", "HUMAN-BETTY", "HUMAN-SOCKS"],
    storySpine: "Aiden wants repeated name-calling to stop without facing it alone or unsafely.",
    failedAttempt: "Betty asks Marcus to stop, but the name-calling happens again on Monday.",
    resolution: "Aiden uses his practiced words, walks away and reports the pattern; Miss Okafor intervenes and Marcus changes his behavior.",
    pages: [
      "Marcus called Aiden a hurtful name again. Betty saw Aiden look down.",
      "At home, Aiden told Betty. “He says it every day. I want it to stop.”",
      "“Say your name. Say stop. Walk away. Then tell Miss Okafor,” Betty said.",
      "Aiden practiced the plan aloud while Socks stayed beside him.",
      "On Friday, Marcus started again. Betty stepped beside Aiden. “His name is Aiden. Stop.”",
      "“Thanks,” Aiden said. “Next time, I want to say it.” Betty nodded.",
      "On Monday, Marcus repeated it. Aiden said clearly, “My name is Aiden. Stop.”",
      "His voice shook, but he walked away with Betty and told Miss Okafor everything.",
      "That evening, Aiden wrote the words once more. This time, his hand did not shake.",
      "Betty bumped his shoulder with hers. “I heard you,” she said.",
      "A week later, Marcus bumped Aiden's tray. “Sorry, Aiden,” he said. Aiden nodded.",
      "Miss Okafor told the class, “If unkindness keeps happening, speak, move away, and tell an adult.”",
      "Then she knelt by Aiden. “You were brave to ask for help. This was never your fault.”"
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
    failedAttempt: "The dim underground room hides its details and leaves part of his page blank.",
    resolution: "A picture book makes the missing details visible, so Aiden can fill the blank space at home.",
    pages: [
      "Dad showed them a castle picture. “I'm filling a page with clues,” Aiden said. Betty grabbed a guidebook.",
      "On Saturday, the castle rose above the hill. “There!” Aiden pressed close to the car window.",
      "Tap, tap went the wooden bridge. “Moat: protection,” Aiden wrote. First clue!",
      "Inside the great hall, worn floor stones showed where countless feet had passed.",
      "Betty opened her map. “Armor room next, then the tower.” Aiden followed.",
      "The guide showed plate armor. Aiden lifted one metal glove. “Heavy!”",
      "Downstairs, dim light hid the old details. Aiden could not find a clue to draw.",
      "They climbed 112 steps. From the tower, the river and fields stretched far below.",
      "“Lookouts watched from here,” Betty said. Aiden drew the wide view across two notebook lines.",
      "On the way down, Aiden found an arrow slit. “Another clue!” Thick stone protected the archers.",
      "At the shop, Betty chose a model. Aiden found a picture book showing the dark room clearly.",
      "In the car, they checked their clues: moat, hall, lookout, arrow slit—and the dark room's secret.",
      "At home, Aiden used the picture book to finish his clue page. No blank space left!"
    ]
  })
});

export default GUIDED_READING_HUMAN_FICTION_REWRITES;
