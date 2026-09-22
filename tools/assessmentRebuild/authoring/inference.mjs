// Behavioural clues support feelings, predictions, reasons and evidence selection.
// Every level contains 32 mastery items (16 per phase) and 8 reserves.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const it = (u, lvl, ph, v, passage, prompt, choices, note = "", extra = {}) => ({
  u, lvl, ph, v, fmt: "COMPREHENSION", cell: u, passage, prompt, choices, media: "text", note, ...extra
});

export default {
  skillId: "inference",
  skillName: "Inference",
  items: [
    // ============== LEVEL 1 · feeling_from_evidence (8) ==============
    it("feeling_from_evidence", 1, 1, 1,
      "Sami waited behind the curtain with his recorder. All the seats were full. He wiped his damp hands on his shirt. He checked his music for the third time.",
      "How does Sami most likely feel?",
      [K("nervous"),
       P("bored", "D-OPPOSITE"),
       P("angry", "D-PLAUSIBLE-UNSUPPORTED"),
       P("sleepy", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("feeling_from_evidence", 1, 1, 2,
      "Lena's cat was at the vet all day. When the phone rang, Lena froze. Mom listened, smiled, and gave a thumbs up. Lena let out a breath and relaxed.",
      "How does Lena feel at the end?",
      [K("relieved"),
       P("worried", "D-SEQUENCE-SWAP"),
       P("jealous", "D-PLAUSIBLE-UNSUPPORTED"),
       P("angry", "D-OPPOSITE")],
      ""),
    it("feeling_from_evidence", 1, 1, 3,
      "Dara was last in the race. She kept running toward the finish line. At the end, she punched the air. She showed everyone her finisher's ribbon.",
      "How does Dara feel about finishing?",
      [K("proud"),
       P("ashamed", "D-PLAUSIBLE-UNSUPPORTED"),
       P("confused", "D-OPPOSITE"),
       P("scared", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("feeling_from_evidence", 1, 1, 4,
      "Ivo stood at his new school gate. He held Dad's hand tightly. He knew none of the children passing by. He quietly practiced saying hello.",
      "How does Ivo most likely feel?",
      [K("nervous"),
       P("furious", "D-OPPOSITE"),
       P("proud", "D-PLAUSIBLE-UNSUPPORTED"),
       P("tired", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("feeling_from_evidence", 1, 2, 5,
      "Bea's balloon slipped from her hand at the fair. She watched it float away. Her lip wobbled. She wiped one eye with her sleeve.",
      "How does Bea feel?",
      [K("sad"),
       P("thrilled", "D-OPPOSITE"),
       P("hungry", "D-PLAUSIBLE-UNSUPPORTED"),
       P("brave", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("feeling_from_evidence", 1, 2, 6,
      "Kofi studied hard for his spelling test. He hoped to get every word right. His test came back with six mistakes. His smile faded as he looked at the marks.",
      "How does Kofi most likely feel?",
      [K("disappointed"), P("proud", "D-PLAUSIBLE-UNSUPPORTED"), P("jealous", "D-PLAUSIBLE-UNSUPPORTED"), P("curious", "D-OPPOSITE")],
      ""),
    it("feeling_from_evidence", 1, 2, 7,
      "The guide turned off the cave lights. Noor gripped her torch tightly. She counted slowly, waiting for the light. She stayed still, though she wanted to run.",
      "How does Noor most likely feel while she waits?",
      [K("nervous"), P("bored", "D-PLAUSIBLE-UNSUPPORTED"), P("angry", "D-PLAUSIBLE-UNSUPPORTED"), P("delighted", "D-OPPOSITE")],
      ""),
    it("feeling_from_evidence", 1, 2, 8,
      "Ren's sister got a robot for her birthday. It was the one Ren wanted. Ren clapped slowly with the others. He stared at the robot and sighed.",
      "How does Ren most likely feel?",
      [K("jealous"),
       P("delighted", "D-OPPOSITE"),
       P("scared", "D-PLAUSIBLE-UNSUPPORTED"),
       P("calm", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),

    // ============== LEVEL 1 · where_am_i (8) ==============
    it("where_am_i", 1, 1, 1,
      "Warm bread filled the air with a sweet smell. Buns sat behind the glass counter. The worker took more loaves from an oven. She put them out for sale.",
      "Where does this take place?",
      [K("a bakery"),
       P("a library", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a swimming pool", "D-OPPOSITE"),
       P("a garden", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("where_am_i", 1, 1, 2,
      "Mara put on her goggles. Swimmers splashed along marked lanes under a high roof. A coach blew a whistle from the edge. Mara climbed down the ladder into the water.",
      "Where is Mara?",
      [K("a swimming pool"),
       P("a soccer field", "D-TOPIC-ADJACENT"),
       P("a movie theater", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a farm", "D-OPPOSITE")],
      ""),
    it("where_am_i", 1, 1, 3,
      "People read quietly at the long tables. A worker scanned the books Mira chose. She said Mira could borrow them for two weeks. Mira left without paying.",
      "Where does this take place?",
      [K("a library"),
       P("a bookstore", "D-TOPIC-ADJACENT"),
       P("a playground", "D-OPPOSITE"),
       P("a kitchen", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("where_am_i", 1, 1, 4,
      "Straw covered the floor. A horse stood in its stall beside Tia. She brushed its mane. Fresh hay hung in a net by its head.",
      "Where is Tia?",
      [K("a stable"),
       P("a pet store", "D-TOPIC-ADJACENT"),
       P("a classroom", "D-OPPOSITE"),
       P("a beach", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("where_am_i", 1, 2, 5,
      "Fields slid past the window. Wheels rattled along the tracks below their seats. A voice announced the next stop. A worker pushed a snack cart down the aisle.",
      "Where does this take place?",
      [K("a train"),
       P("a bus", "D-TOPIC-ADJACENT"),
       P("a boat", "D-PLAUSIBLE-UNSUPPORTED"),
       P("an elevator", "D-OPPOSITE")],
      ""),
    it("where_am_i", 1, 2, 6,
      "A shark swam behind a thick glass wall. Smaller fish turned together in the blue water. The guide pointed to a tank of jellyfish. Children pressed closer to watch.",
      "Where are they?",
      [K("an aquarium"),
       P("a movie theater", "D-TOPIC-ADJACENT"),
       P("a museum of paintings", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a cave", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("where_am_i", 1, 2, 7,
      "The lunch bell rang at school. Omar slid his tray along the counter. A worker served him peas and rice. He sat at a long table with his class.",
      "Where is Omar?",
      [K("the school cafeteria"),
       P("his kitchen at home", "D-TOPIC-ADJACENT"),
       P("a candy store", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the school library", "D-OPPOSITE")],
      ""),
    it("where_am_i", 1, 2, 8,
      "Waves washed up near Zoe's sandcastle. Gulls called overhead. Dad rubbed sunscreen on her nose. Zoe ran back to collect shells by the water.",
      "Where does this take place?",
      [K("the beach"),
       P("an amusement park", "D-TOPIC-ADJACENT"),
       P("a forest", "D-OPPOSITE"),
       P("a parking lot", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),

    // ============== LEVEL 1 · what_happens_next (8) ==============
    it("what_happens_next", 1, 1, 1,
      "Black clouds covered the park. Thunder rumbled above the picnic. Mom packed the food quickly. Dad pointed toward their car.",
      "What will most likely happen next?",
      [K("the family will hurry home before the rain"),
       P("the family will start a barbecue", "D-OPPOSITE"),
       P("the family will go swimming", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the family will fall asleep on the grass", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_happens_next", 1, 1, 2,
      "Theo filled a tub with warm water. He fetched dog shampoo and an old towel. His muddy dog waited by the door. Theo called the dog over.",
      "What will most likely happen next?",
      [K("Theo will wash the dog"),
       P("Theo will take a bath himself", "D-TOPIC-ADJACENT"),
       P("Theo will feed the cat", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Theo will go to bed", "D-OPPOSITE")],
      ""),
    it("what_happens_next", 1, 1, 3,
      "Smoke rose from the toaster. Dad sniffed and dropped his newspaper. He ran toward the kitchen. The toast was still inside.",
      "What will most likely happen next?",
      [K("Dad will stop the burning breakfast"),
       P("Dad will water the plants", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Dad will eat the toast happily", "D-OPPOSITE"),
       P("Dad will read another page", "D-SEQUENCE-SWAP")],
      ""),
    it("what_happens_next", 1, 1, 4,
      "Aya counted her money and put on her coat. She checked the shopping note. They needed honey for their pancakes. Aya called goodbye and opened the front door.",
      "What will most likely happen next?",
      [K("Aya will go and buy honey"),
       P("Aya will throw the shopping note away", "D-OPPOSITE"),
       P("Aya will make her bed", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Aya will eat the pancakes now", "D-SEQUENCE-SWAP")],
      ""),
    it("what_happens_next", 1, 2, 5,
      "Raj's torch grew dim and went out. Shaking it did not help. He remembered the spare batteries in the kitchen drawer. He walked toward the kitchen.",
      "What will most likely happen next?",
      [K("Raj will get new batteries"),
       P("Raj will throw the flashlight in the trash", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Raj will shine the flashlight again at once", "D-OPPOSITE"),
       P("Raj will go outside to play", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_happens_next", 1, 2, 6,
      "Nell's baby brother had just fallen asleep. Her music box suddenly played loudly. Mom pointed at the baby and raised one finger. Nell reached into her pocket for the box.",
      "What will most likely happen next?",
      [K("Nell will rush to switch off the music"),
       P("Nell will turn the music up", "D-OPPOSITE"),
       P("Nell will set the music box on the table", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Nell will open the window", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_happens_next", 1, 2, 7,
      "The icy path was too slippery to walk on. Salt had melted the ice there before. Grandpa fetched the salt bag and a scoop. He stood beside the path.",
      "What will most likely happen next?",
      [K("Grandpa will spread salt on the icy path"),
       P("Grandpa will run down the path", "D-OPPOSITE"),
       P("Grandpa will plant flowers", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Grandpa will wash the windows", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_happens_next", 1, 2, 8,
      "A bird watched Jo's sandwich on the bench. Jo went to fetch her drink. The bird hopped closer and opened its beak. No one was near the food.",
      "What will the bird most likely do next?",
      [K("take a bite of the sandwich"), P("bring Jo a piece of bread", "D-PLAUSIBLE-UNSUPPORTED"), P("leave to look for a nest", "D-PLAUSIBLE-UNSUPPORTED"), P("wait for Jo to sit down", "D-OPPOSITE")],
      ""),

    // ============== LEVEL 2 · why_did_they (8) ==============
    it("why_did_they", 2, 1, 1,
      "Mom watched dark clouds gather outside. She put two umbrellas by the door. Then she put the picnic basket away. She chose the indoor museum for their trip instead.",
      "Why did Mom change the plans?",
      [K("she could tell rain was coming"),
       P("she was tired of picnics forever", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the museum was free that day", "D-PLAUSIBLE-UNSUPPORTED"),
       P("she had lost the picnic blanket", "D-OPPOSITE")],
      ""),
    it("why_did_they", 2, 1, 2,
      "Lily's lunchbox had fallen in a puddle. Her tray was empty at lunchtime. Marco slid his orange across to her without speaking. He looked at his sandwich while the other children chatted.",
      "Why did Marco give Lily his orange?",
      [K("he wanted to help her without a fuss"),
       P("he hated oranges", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the teacher told him to share", "D-PLAUSIBLE-UNSUPPORTED"),
       P("he wanted everyone to praise him", "D-OPPOSITE")],
      ""),
    it("why_did_they", 2, 1, 3,
      "Pia usually rode her scooter down Hill Lane. Workers had left loose stones across the steep road today. Pia got off at the top. She walked down, holding the brake to control the scooter.",
      "Why did Pia walk instead of ride?",
      [K("the lane was not safe to ride today"),
       P("her scooter was stolen", "D-OPPOSITE"),
       P("she was bored of scooting", "D-PLAUSIBLE-UNSUPPORTED"),
       P("she wanted to be late for dinner", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("why_did_they", 2, 1, 4,
      "The television was loud when Grandma answered the phone. She asked the caller to repeat three words. Then she went into the hall and closed the door. She could hear every word there.",
      "Why did Grandma go to the hallway?",
      [K("she needed quiet to hear the call"),
       P("she wanted to watch television", "D-OPPOSITE"),
       P("the kitchen was too cold", "D-PLAUSIBLE-UNSUPPORTED"),
       P("she was hiding from Grandpa", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("why_did_they", 2, 2, 5,
      "Coach Adams moved Jonah from forward to goalkeeper for the final. Jonah had stopped every shot during practice that week. Some parents doubted the change. In the final, the other team did not score.",
      "Why did the coach move Jonah?",
      [K("Jonah had shown he was skilled as goalkeeper"),
       P("Jonah was too slow to run", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the usual goalkeeper had missed the game", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the parents asked for the change", "D-OPPOSITE")],
      ""),
    it("why_did_they", 2, 2, 6,
      "Flood water had once soaked Auntie Fern's paper seed packets. None of those seeds had grown. Now she keeps the packets in jars with tight lids. She checks the lids before leaving the workshop.",
      "Why does Auntie Fern use sealed jars?",
      [K("to protect seeds from another flood"), P("to show visitors her empty jars", "D-PLAUSIBLE-UNSUPPORTED"), P("to help seeds sprout in water", "D-PLAUSIBLE-UNSUPPORTED"), P("to leave seeds open to the air", "D-OPPOSITE")],
      ""),
    it("why_did_they", 2, 2, 7,
      "Asha was taking the bus to school alone for the first time. The back seats were empty, but she sat behind the driver. She kept her ticket ready in her hand. She checked each stop against the list Dad had given her.",
      "Why did Asha stay close to the driver?",
      [K("she wanted support on her first solo journey"), P("she was saving the back seats for Dad", "D-PLAUSIBLE-UNSUPPORTED"), P("she had promised to collect the other tickets", "D-PLAUSIBLE-UNSUPPORTED"), P("she hoped to avoid seeing any of her stops", "D-OPPOSITE")],
      ""),
    it("why_did_they", 2, 2, 8,
      "Mr Okafor placed his ladder against the wall. He pressed a foot onto the lowest rung, and it wobbled. He moved it until both feet stood firmly on level ground. Only then did he climb up with his paintbrush.",
      "Why did Mr Okafor keep moving the ladder?",
      [K("he was making sure it would not slip"),
       P("he could not decide which wall to paint", "D-PLAUSIBLE-UNSUPPORTED"),
       P("he was trying to break the ladder", "D-OPPOSITE"),
       P("he had forgotten his paintbrush", "D-SEQUENCE-SWAP")],
      ""),

    // ============== LEVEL 2 · what_went_unsaid (8) ==============
    it("what_went_unsaid", 2, 1, 1,
      "Their coats dripped onto the mat as they came inside. Dad shook water from the folded umbrella. Leaves stuck to the wet boots by the door. The bathroom floor was dry.",
      "What most likely happened before they came inside?",
      [K("someone had been out in heavy rain"),
       P("the family had been at the beach", "D-PLAUSIBLE-UNSUPPORTED"),
       P("Mom had bought new boots", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the bath had overflowed", "D-TOPIC-ADJACENT")],
      ""),
    it("what_went_unsaid", 2, 1, 2,
      "The children had left the hamster's food bowl full. Next morning, only two pieces of food remained. The wheel was still turning when they arrived. A new tunnel ran through the pile of paper.",
      "What must have happened overnight?",
      [K("the hamster ate and moved about"), P("a child filled the food bowl again", "D-PLAUSIBLE-UNSUPPORTED"), P("a cleaner washed the paper from the cage", "D-PLAUSIBLE-UNSUPPORTED"), P("the hamster rested without moving or eating", "D-OPPOSITE")],
      ""),
    it("what_went_unsaid", 2, 1, 3,
      "Dad met them at the door wearing an oven mitt. A black cake lay in the bin. Cold air blew through the open kitchen window. Dad waved a towel below the beeping smoke alarm.",
      "What went wrong while they were out?",
      [K("Dad burned the cake he was baking"),
       P("Dad forgot to bake anything", "D-OPPOSITE"),
       P("burglars had opened the window", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the oven had never worked", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_went_unsaid", 2, 1, 4,
      "Marta had put her only recorder in its case last night. This morning, music came from her little brother's room. At school, Marta opened the case. It was empty.",
      "What had happened at home?",
      [K("her brother had taken the recorder to play with"),
       P("Marta had sold her recorder", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the teacher had collected the recorders", "D-OPPOSITE"),
       P("Marta forgot she owned a recorder", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_went_unsaid", 2, 2, 5,
      "The garden gnome moved from the pond to the rose bush. It now wore a tiny doll's scarf. Grandpa said he had left it by the pond. The girl next door held a doll with a matching hat.",
      "Who has most likely been moving the gnome?",
      [K("the girl next door"), P("Grandpa by the pond", "D-PLAUSIBLE-UNSUPPORTED"), P("the neighbour mowing grass", "D-PLAUSIBLE-UNSUPPORTED"), P("a worker fixing the fence", "D-OPPOSITE")],
      ""),
    it("what_went_unsaid", 2, 2, 6,
      "The bird feeder lay broken and empty below its bent pole. Deep paw prints led away into the woods. Each print was wider than Dad's boot. The gate was still locked.",
      "What most likely visited in the night?",
      [K("a large, heavy animal from the woods"),
       P("a small garden bird", "D-OPPOSITE"),
       P("a naughty child from next door", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a strong gust of wind", "D-PLAUSIBLE-UNSUPPORTED")],
      ""),
    it("what_went_unsaid", 2, 2, 7,
      "The apartment smelled of paint, but its walls were unchanged. Mom had silver spots on her hands and glasses. Ela's old red bicycle stood on newspaper on the balcony. It was now silver, and its paint was still wet.",
      "What had Mom been doing?",
      [K("putting new paint on the bicycle"), P("putting fresh paint on the walls", "D-PLAUSIBLE-UNSUPPORTED"), P("cleaning old paint off her glasses", "D-PLAUSIBLE-UNSUPPORTED"), P("buying a silver bike for Ela", "D-OPPOSITE")],
      ""),
    it("what_went_unsaid", 2, 2, 8,
      "They came home to blinking clocks all through the house. The closed freezer held melted ice cream. The lamp had just come back on by itself. Their neighbour said her lights had only just returned too.",
      "What best explains all these clues?",
      [K("the electricity had stopped for some time"), P("the family had left their freezer open", "D-PLAUSIBLE-UNSUPPORTED"), P("a clock had run out of batteries", "D-PLAUSIBLE-UNSUPPORTED"), P("someone had forgotten to switch on the lamp", "D-OPPOSITE")],
      ""),

    // ============== LEVEL 2 · evidence_pick (8) ==============
    it("evidence_pick", 2, 1, 1,
      "Tilly said she did not mind missing the school trip. At art time, she drew herself on the trip's bus. She rubbed out the picture and drew it again. The other children were making birthday cards.",
      "Which detail best shows that Tilly is disappointed?",
      [K("Tilly kept drawing herself on the trip"), P("Tilly said she did not mind missing it", "D-PLAUSIBLE-UNSUPPORTED"), P("the other children were making birthday cards", "D-PLAUSIBLE-UNSUPPORTED"), P("the class had an art lesson together", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 1, 2,
      "Ba said any dog at the shelter would do. A grey terrier pressed its nose against his hand. At home, Ba pinned that dog's photo above his bed. The shelter's number was printed below the picture.",
      "Which detail best shows that Ba wanted that terrier?",
      [K("Ba put that dog's photo above his bed"), P("Ba said any dog would do at the shelter", "D-PLAUSIBLE-UNSUPPORTED"), P("the shelter printed its number below the picture", "D-PLAUSIBLE-UNSUPPORTED"), P("the terrier pressed its nose against his hand", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 1, 3,
      "Nobody saw who tidied the book corner before lunch. Femi always sorts his pencils into matching colour groups. Now the books were sorted by colour too. The other children usually sorted them by size.",
      "Which clue points to Femi?",
      [K("the books matched his usual way of sorting"), P("the corner was tidied before lunchtime began", "D-PLAUSIBLE-UNSUPPORTED"), P("the other children usually sorted books by size", "D-PLAUSIBLE-UNSUPPORTED"), P("nobody had seen anyone tidying the book corner", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 1, 4,
      "Harri said winning the race did not matter to him. His medal hung above his bed. Every Sunday, he carefully polished it with a soft cloth. The race had taken place on a rainy day.",
      "Which detail best shows that the win mattered to Harri?",
      [K("he carefully cleaned his prize every week"), P("he said the win did not matter", "D-PLAUSIBLE-UNSUPPORTED"), P("the race took place on a rainy day", "D-PLAUSIBLE-UNSUPPORTED"), P("he kept a soft cloth in his room", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 2, 5,
      "The new boy said he had never played chess. He set up all the pieces without checking the instructions. Then he showed Mia a legal move for each piece. The board was on a small table beside the window.",
      "Which detail shows the boy knows how to play chess?",
      [K("he arranged the pieces without needing instructions"), P("he said he had never played chess", "D-PLAUSIBLE-UNSUPPORTED"), P("he sat beside Mia near the window", "D-PLAUSIBLE-UNSUPPORTED"), P("the board rested on a small table", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 2, 6,
      "Mom said she would stay awake for the whole film. Leo sat beside her with his mug of tea. At the ending, Mom's eyes were shut and she was snoring. The film ended with a song.",
      "Which detail best shows that Mom fell asleep?",
      [K("her eyes were shut and she was snoring"), P("she said she would stay awake all evening", "D-PLAUSIBLE-UNSUPPORTED"), P("Leo sat beside her with some warm tea", "D-PLAUSIBLE-UNSUPPORTED"), P("the film they watched ended with a song", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 2, 7,
      "The caretaker called the school cat a nuisance. He filled its bowl with warm food every cold morning. The bowl stood in the store room beside his tools. Children often stopped at the door to see the cat.",
      "Which detail best shows that the caretaker cares for the cat?",
      [K("he fed it warm meals on cold mornings"), P("he called it a nuisance at the school", "D-PLAUSIBLE-UNSUPPORTED"), P("the bowl stood beside tools in the store room", "D-PLAUSIBLE-UNSUPPORTED"), P("children came to see it near the door", "D-OPPOSITE")],
      ""),
    it("evidence_pick", 2, 2, 8,
      "Priti said the thunder did not scare her. At the first crash, she jumped and covered her ears. Grandma was cooking in the kitchen. Priti's book lay open on the sofa.",
      "Which detail best shows that Priti was scared of the thunder?",
      [K("she jumped and covered her ears at the crash"), P("she said the thunder did not scare her", "D-PLAUSIBLE-UNSUPPORTED"), P("Grandma cooked a meal in the kitchen nearby", "D-PLAUSIBLE-UNSUPPORTED"), P("her book lay open on the sofa cushions", "D-OPPOSITE")],
      ""),

    // ============== RETENTION RESERVE (8 L1-style + 8 L2-style) ==============
    it("feeling_from_evidence", 1, 1, 9,
      "Milo looked away as Dad lifted out the splinter. Dad said it was done. Milo stared at his finger and laughed. He had expected it to hurt for ages.",
      "How does Milo feel at the end?",
      [K("surprised"), P("worried", "D-PLAUSIBLE-UNSUPPORTED"), P("disappointed", "D-PLAUSIBLE-UNSUPPORTED"), P("angry", "D-OPPOSITE")],
      "", { retention: true }),
    it("feeling_from_evidence", 1, 2, 10,
      "Wren had saved for a paint set for weeks. At last, she bought it. On the way home she bounced along. She kept saying she could not wait to paint.",
      "How does Wren most likely feel?",
      [K("excited"), P("disappointed", "D-PLAUSIBLE-UNSUPPORTED"), P("worried", "D-PLAUSIBLE-UNSUPPORTED"), P("jealous", "D-OPPOSITE")],
      "", { retention: true }),
    it("where_am_i", 1, 1, 9,
      "Rows of seats faced a huge screen. Ana held popcorn on her knees. The lights went down. A film began playing on the screen.",
      "Where is Ana?",
      [K("a movie theater"),
       P("a live theater with actors on stage", "D-TOPIC-ADJACENT"),
       P("her bedroom", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a stadium", "D-PLAUSIBLE-UNSUPPORTED")],
      "", { retention: true }),
    it("where_am_i", 1, 2, 10,
      "Mom pushed a cart past rows of tinned food. She added milk and grapes. Every item had a price label. Then she joined the line at the checkout.",
      "Where are they?",
      [K("a grocery store"),
       P("a street market", "D-TOPIC-ADJACENT"),
       P("a kitchen", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a garage", "D-OPPOSITE")],
      "", { retention: true }),
    it("what_happens_next", 1, 1, 9,
      "Kip's tummy growled during class. The lunch bell was about to ring. He put his book away. He held his lunchbox and watched the door.",
      "What will most likely happen next?",
      [K("Kip will leave to eat his meal"), P("Kip will put his lunchbox away unopened", "D-PLAUSIBLE-UNSUPPORTED"), P("Kip will take his book home for the day", "D-PLAUSIBLE-UNSUPPORTED"), P("Kip will stay sitting after the lunch bell", "D-OPPOSITE")],
      "", { retention: true }),
    it("what_happens_next", 1, 2, 10,
      "Fresh snow covered the garden. Josh took a carrot, scarf, and buttons outside. He rolled a large snowball. Then he began rolling a smaller one.",
      "What will Josh most likely do?",
      [K("build a snowman"),
       P("cook carrot soup", "D-TOPIC-ADJACENT"),
       P("go back to bed", "D-OPPOSITE"),
       P("water the flowers", "D-PLAUSIBLE-UNSUPPORTED")],
      "", { retention: true }),
    it("feeling_from_evidence", 1, 1, 11,
      "Ola waited at the top of the tall slide. She gripped the rail and took a breath. Then she let go. At the bottom, she shouted for another turn.",
      "How did Ola feel about the slide by the end?",
      [K("excited"),
       P("too scared to try again", "D-SEQUENCE-SWAP"),
       P("angry about the line", "D-PLAUSIBLE-UNSUPPORTED"),
       P("bored", "D-OPPOSITE")],
      "", { retention: true }),
    it("where_am_i", 1, 1, 11,
      "Grandma sat up in a bed with tall sides. A nurse came to check her bandage. A machine beside the bed beeped steadily. The doctor said Grandma could go home tomorrow.",
      "Where does this take place?",
      [K("a hospital"),
       P("a hotel", "D-PLAUSIBLE-UNSUPPORTED"),
       P("a school", "D-OPPOSITE"),
       P("a greenhouse", "D-PLAUSIBLE-UNSUPPORTED")],
      "", { retention: true }),
    it("why_did_they", 2, 1, 9,
      "Ade hid his favourite toy dinosaur before his baby cousins arrived. On their last visit, a cousin chewed another dinosaur's tail. Ade checked that the hidden toy was out of reach. Then he took out a box of soft baby toys.",
      "Why did Ade hide the dinosaur?",
      [K("to keep it safe from his little cousins"),
       P("he was tired of dinosaurs", "D-OPPOSITE"),
       P("his mom told him to clean his whole room", "D-PLAUSIBLE-UNSUPPORTED"),
       P("he wanted to sleep with it", "D-PLAUSIBLE-UNSUPPORTED")],
      "", { retention: true }),
    it("why_did_they", 2, 2, 10,
      "The cafe began opening at six instead of seven. Early workers often passed before other shops opened. The owner offered them free rolls and a warm seat. The workers began stopping there after their night shifts.",
      "Why did the owner most likely make these changes?",
      [K("to provide comfort for people working unusual hours"), P("to sell the leftover rolls at a higher price", "D-PLAUSIBLE-UNSUPPORTED"), P("to stop the workers sitting inside the cafe", "D-PLAUSIBLE-UNSUPPORTED"), P("to close the cafe before the workers arrived", "D-OPPOSITE")],
      "", { retention: true }),
    it("what_went_unsaid", 2, 1, 9,
      "Small muddy paw prints led from the cat flap. They crossed the kitchen floor and went onto a chair. More prints marked the table and the cake. The cat was licking cream from one paw.",
      "What must have happened?",
      [K("the cat walked through mud and over the cake"),
       P("someone dropped the birthday cake on the floor", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the baker made the cake wrong", "D-OPPOSITE"),
       P("a candle fell by itself", "D-DETAIL-AS-MAIN")],
      "", { retention: true }),
    it("what_went_unsaid", 2, 2, 10,
      "Dad came home from his vegetable patch with a bulging bag. A huge round orange shape showed through the thin cloth. He found the entry form for the biggest pumpkin contest. Then he carried the bag carefully to the scales.",
      "What is Dad most likely hiding?",
      [K("a very large pumpkin from his garden"), P("a new orange football from a sports shop", "D-PLAUSIBLE-UNSUPPORTED"), P("a sack of small potatoes for his dinner", "D-PLAUSIBLE-UNSUPPORTED"), P("a pile of tools for digging his patch", "D-OPPOSITE")],
      "", { retention: true }),
    it("evidence_pick", 2, 1, 9,
      "Sol said the lambs were fine, but not very interesting. Yet he rose early every day to warm their bottles. He wore his old coat in the cold barn. His football boots stood beside the door.",
      "Which detail best shows that Sol cared about the lambs?",
      [K("Sol woke early to prepare their milk every day"), P("Sol said the lambs were not very interesting", "D-PLAUSIBLE-UNSUPPORTED"), P("Sol wore his old coat in the cold barn", "D-PLAUSIBLE-UNSUPPORTED"), P("Sol kept his football boots beside the door", "D-OPPOSITE")],
      "", { retention: true }),
    it("evidence_pick", 2, 2, 10,
      "The principal said the school had no mice. The caretaker carried a mouse trap toward the store room. He put peanut butter in it and set it down. The cook rolled bread dough in the kitchen.",
      "Which detail shows someone expected to catch a mouse?",
      [K("the caretaker set a trap with food in it"), P("the principal said there were no mice at school", "D-PLAUSIBLE-UNSUPPORTED"), P("the cook continued rolling bread dough in the kitchen", "D-PLAUSIBLE-UNSUPPORTED"), P("the caretaker walked along the hall toward a room", "D-OPPOSITE")],
      "", { retention: true }),
    it("why_did_they", 2, 1, 11,
      "Nina's water bottle once leaked and soaked her homework. Today she wrapped a library book in a waterproof bag. She put it beside the same bottle in her backpack. The sky was clear, and she would travel by car.",
      "Why did Nina wrap the book?",
      [K("to protect it in case her bottle leaked again"),
       P("because rain was pouring on the walk to school", "D-PLAUSIBLE-UNSUPPORTED"),
       P("to hide the book from her friends", "D-PLAUSIBLE-UNSUPPORTED"),
       P("because the bag looked nice", "D-OPPOSITE")],
      "", { retention: true }),
    it("what_went_unsaid", 2, 2, 11,
      "The plants leaned toward the only bright window. Grandma turned their pots so they faced away. A week later, new growth bent back toward that window. Nothing had pushed the stems, and no breeze entered the room.",
      "What makes the plants lean?",
      [K("they grow toward the light from the window"),
       P("Grandma turning the pots knocks each plant sideways", "D-OPPOSITE"),
       P("the wind pushes them", "D-PLAUSIBLE-UNSUPPORTED"),
       P("the pots are broken", "D-PLAUSIBLE-UNSUPPORTED")],
      "", { retention: true }),
    // Fresh retry stock: four additional questions in each phase.
    {
      "u": "feeling_from_evidence",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "feeling_from_evidence",
      "passage": "Maya tried to join the same pieces five times. Each time, her model fell apart. She sighed loudly and pushed the pieces away.",
      "prompt": "How does Maya most likely feel?",
      "choices": [
        {
          "t": "frustrated",
          "r": "KEY",
          "k": true
        },
        {
          "t": "grateful",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "jealous",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "calm",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "feeling_from_evidence",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "feeling_from_evidence",
      "passage": "A strange tapping came from the empty box. Luis tilted his head and moved closer. He asked what could be making the sound.",
      "prompt": "How does Luis most likely feel?",
      "choices": [
        {
          "t": "curious",
          "r": "KEY",
          "k": true
        },
        {
          "t": "proud",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "disappointed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "lonely",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "where_am_i",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "where_am_i",
      "passage": "A worker checked our tickets at the tall gate. We found numbered seats around a huge playing field. Two teams ran out as the crowd cheered.",
      "prompt": "Where are we most likely?",
      "choices": [
        {
          "t": "at a sports stadium",
          "r": "KEY",
          "k": true
        },
        {
          "t": "at a swimming lesson",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "at a cinema entrance",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "at a school library",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "what_happens_next",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "what_happens_next",
      "passage": "The page tore as Jo turned it. She found clear tape and small scissors. She placed the torn edges neatly together.",
      "prompt": "What will Jo most likely do next?",
      "choices": [K("repair the damaged sheet"), P("cut the torn page into strips", "D-PLAUSIBLE-UNSUPPORTED"), P("put the clear tape away untouched", "D-PLAUSIBLE-UNSUPPORTED"), P("close the torn book without fixing it", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "feeling_from_evidence",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "feeling_from_evidence",
      "passage": "Ari waved at someone he thought was his uncle. The stranger looked puzzled. Ari’s cheeks grew hot, and he looked down.",
      "prompt": "How does Ari most likely feel?",
      "choices": [
        {
          "t": "embarrassed",
          "r": "KEY",
          "k": true
        },
        {
          "t": "excited",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "grateful",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "jealous",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "feeling_from_evidence",
      "lvl": 1,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "feeling_from_evidence",
      "passage": "Lea’s neighbour found her lost bracelet. Lea held it tightly and smiled at him. She thanked him twice and offered a hug.",
      "prompt": "How does Lea most likely feel?",
      "choices": [
        {
          "t": "grateful",
          "r": "KEY",
          "k": true
        },
        {
          "t": "frightened",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "jealous",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "bored",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "where_am_i",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "where_am_i",
      "passage": "Rows of tomato plants grew under a glass roof. It felt warm, though frost covered the ground outside. A gardener opened a roof vent.",
      "prompt": "Where is this most likely?",
      "choices": [
        {
          "t": "inside a greenhouse",
          "r": "KEY",
          "k": true
        },
        {
          "t": "inside a fruit shop",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "inside a garden shed",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "inside a kitchen",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "what_happens_next",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "what_happens_next",
      "passage": "The wind blew a kite into a low branch. Mai could not reach its string. Dad fetched a long pole and walked over.",
      "prompt": "What will Dad most likely do next?",
      "choices": [
        {
          "t": "try to free the kite",
          "r": "KEY",
          "k": true
        },
        {
          "t": "paint the garden fence",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "fly a second kite",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "plant a new tree",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "why_did_they",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "why_did_they",
      "passage": "Mina put small bells on the kitten’s collar. The kitten was tiny and often hid silently behind large furniture. Now Mina could hear it even when she could not see it.",
      "prompt": "Why did Mina add the bells?",
      "choices": [
        {
          "t": "to locate the kitten when it was hidden",
          "r": "KEY",
          "k": true
        },
        {
          "t": "to teach the kitten to climb the furniture",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to make the kitten sleep throughout the day",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to stop the kitten from growing any larger",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "what_went_unsaid",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "what_went_unsaid",
      "passage": "The flour bag sat open beside white footprints on the floor. The prints led across the kitchen to Pip’s stool. His socks were dusted white, and his bowl held sticky dough.",
      "prompt": "What did Pip most likely do?",
      "choices": [
        {
          "t": "step in spilled flour while making dough",
          "r": "KEY",
          "k": true
        },
        {
          "t": "paint white marks onto the kitchen counter",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "leave his socks outside during a snowstorm",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "wash the counter without touching the flour",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "evidence_pick",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "evidence_pick",
      "passage": "Jas said she was happy to leave the old house. Yet she kept its front-door key on a necklace. Each night she looked through photos of her old room. Her new home had a larger garden.",
      "prompt": "Which detail shows the old house still matters to Jas?",
      "choices": [
        {
          "t": "she wears its old key as a keepsake",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she says she is happy to leave it",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "her new home has a much larger garden",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she has moved her things into another house",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "why_did_they",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "why_did_they",
      "passage": "The class moved their seedlings away from the cold window overnight. Last week, leaves touching that glass had gone brown. Plants on the warmer shelf had stayed healthy.",
      "prompt": "Why did they move the seedlings?",
      "choices": [
        {
          "t": "to prevent damage from the cold glass",
          "r": "KEY",
          "k": true
        },
        {
          "t": "to hide the plants from the morning sun",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to make space for seedlings needing frost",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to stop the healthy leaves from growing",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "what_went_unsaid",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "what_went_unsaid",
      "passage": "The chalk outline on the ground was wet and partly gone. Nearby, a bucket lay on its side in a spreading puddle. Dan held a dripping brush and looked at his ruined drawing.",
      "prompt": "What most likely damaged the drawing?",
      "choices": [
        {
          "t": "water spilling from the fallen bucket",
          "r": "KEY",
          "k": true
        },
        {
          "t": "someone rubbing it away with a dry cloth",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Dan drawing the outline with a different colour",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "sunlight making the chalk grow much darker",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "evidence_pick",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "evidence_pick",
      "passage": "Noel said he had no interest in joining the band. But he learned the audition tune after school every day. The music room was beside the hall. The band rehearsed there on Tuesdays.",
      "prompt": "Which detail best shows Noel may want to join?",
      "choices": [
        {
          "t": "he keeps practicing the tune needed for the audition",
          "r": "KEY",
          "k": true
        },
        {
          "t": "he says he has no interest in joining the band",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the music room stands beside the school’s main hall",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "the band rehearses together every Tuesday after school",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "why_did_they",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "why_did_they",
      "passage": "The guide counted the children before leaving the beach. She counted them again after everyone boarded the bus. One child had wandered behind a rock earlier that day.",
      "prompt": "Why did the guide count the children twice?",
      "choices": [
        {
          "t": "to check that nobody was left behind",
          "r": "KEY",
          "k": true
        },
        {
          "t": "to decide who could sit near a window",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to see which children had collected the most shells",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "to find out whether the bus was running late",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "what_went_unsaid",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "what_went_unsaid",
      "passage": "The library’s floor was dry except for a trail from the door. Ada shook drops from her umbrella into the outside stand. Her coat was damp, and grey clouds filled the sky.",
      "prompt": "What most likely happened before Ada arrived?",
      "choices": [
        {
          "t": "she walked through a shower of rain",
          "r": "KEY",
          "k": true
        },
        {
          "t": "she washed the library floor with a mop",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she left her umbrella inside a warm cupboard",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "she spilled a drink beside the book shelves",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    }
]
};
