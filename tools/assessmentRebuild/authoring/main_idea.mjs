// Whole-text ideas, titles and summaries with close detail and scope distractors.
// Every level contains 32 mastery items (16 per phase) and 8 reserves.

const K = t => ({ t, r: "KEY", k: true });
const P = (t, r) => ({ t, r });
const it = (u, lvl, ph, v, passage, prompt, choices, extra = {}) => ({
  u, lvl, ph, v, fmt: "COMPREHENSION", cell: u, passage, prompt, choices, media: "text", ...extra
});
const Q1 = "What is this story mostly about?";
const QI = "What is this passage mostly about?";

export default {
  skillId: "main_idea",
  skillName: "Main Idea",
  items: [
    // ================= LEVEL 1 · mostly_about_fiction (8) =================
    it("mostly_about_fiction", 1, 1, 1,
      "Rana planted three bean seeds in a paper cup. She watered them every morning before school. For days, nothing happened. Then one green stem pushed up through the soil. Rana cheered so loudly that her dog barked.",
      Q1,
      [K("Rana waiting and caring for a growing plant"), P("Rana watering a cup before going to school", "D-PLAUSIBLE-UNSUPPORTED"), P("Rana making a noise that wakes her dog", "D-PLAUSIBLE-UNSUPPORTED"), P("Rana choosing which seeds to buy for her garden", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 1, 2,
      "Tom could not find his library book anywhere. He looked under his bed and behind the sofa. He even checked the fridge. At last he checked inside his pillowcase. The book was where he read it last.",
      Q1,
      [K("Tom searching many places for a missing book"), P("Tom looking behind the sofa in his room", "D-PLAUSIBLE-UNSUPPORTED"), P("Tom choosing a new book at the library", "D-PLAUSIBLE-UNSUPPORTED"), P("Tom making a pillowcase for his own bed", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 1, 3,
      "Amara's bike squeaked all the way to the park. Squeak, squeak, squeak. Her uncle helped her put oil on the chain. The bike was quiet on the way home. Amara smiled as she rode.",
      Q1,
      [K("making Amara’s bicycle stop squeaking"), P("riding to the park with Amara", "D-PLAUSIBLE-UNSUPPORTED"), P("putting oil onto one bicycle part", "D-PLAUSIBLE-UNSUPPORTED"), P("buying a new bicycle for Amara", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 1, 4,
      "Milo's tooth had wobbled for a week. He wiggled it at breakfast and at bath time. He laughed at dinner, and the tooth popped out. He caught it in his hand. Milo put it under his pillow that night.",
      Q1,
      [K("Milo losing his wobbly tooth"), P("Milo laughing while eating his dinner", "D-PLAUSIBLE-UNSUPPORTED"), P("Milo placing something beneath his pillow", "D-PLAUSIBLE-UNSUPPORTED"), P("Milo visiting a dentist after school", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 2, 5,
      "A thin gray kitten kept visiting Priya's steps. Priya put out water for it each day. Each day the kitten crept closer. On Friday it curled up on her lap. She heard it purr softly.",
      Q1,
      [K("Priya gradually gaining a stray kitten’s trust"), P("Priya leaving water on her front steps", "D-PLAUSIBLE-UNSUPPORTED"), P("Priya listening to a quiet purring sound", "D-PLAUSIBLE-UNSUPPORTED"), P("Priya taking a kitten to an animal clinic", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 2, 6,
      "Dev dropped his mitten somewhere in the snow. He walked back along his own footprints to look. A red mitten hung on the gate post. Someone had left it there for him to find.",
      Q1,
      [K("Dev recovering a mitten lost outside"), P("Dev following his footprints through snow", "D-PLAUSIBLE-UNSUPPORTED"), P("Dev noticing something on a gate post", "D-PLAUSIBLE-UNSUPPORTED"), P("Dev shopping for new winter clothing", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 2, 7,
      "The choir had one last practice before the show. First the singing was too quiet. Then it was too fast. Miss Obi clapped a steady beat for them. Soon their voices joined in time.",
      Q1,
      [K("singers learning to keep time together"), P("Miss Obi making a steady clapping sound", "D-PLAUSIBLE-UNSUPPORTED"), P("singers preparing the stage for a show", "D-PLAUSIBLE-UNSUPPORTED"), P("Miss Obi learning a new song alone", "D-OPPOSITE")]),
    it("mostly_about_fiction", 1, 2, 8,
      "Jin practiced flipping a paper pancake in a pan. The pan was cold, so he could practice safely. On Sunday he tried using a real pancake. His dad watched from the table. The pancake spun up and landed in the pan.",
      Q1,
      [K("Jin learning to flip a pancake"), P("Dad sitting at the table on Sunday", "D-PLAUSIBLE-UNSUPPORTED"), P("Jin using a paper pancake to practice", "D-PLAUSIBLE-UNSUPPORTED"), P("Dad teaching Jin to mix pancake batter", "D-OPPOSITE")]),

    // ================= LEVEL 1 · mostly_about_info (8) =================
    it("mostly_about_info", 1, 1, 1,
      "Bees visit many flowers on one trip. They drink a sweet juice called nectar. They pass the nectar to bees inside the hive. Slowly the nectar thickens into honey. One jar of honey takes thousands of flower visits.",
      QI,
      [K("how bees make honey from flower nectar"), P("how bees drink juice from each flower", "D-PLAUSIBLE-UNSUPPORTED"), P("how flowers grow near a busy hive", "D-PLAUSIBLE-UNSUPPORTED"), P("how jars are filled at a honey factory", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 1, 2,
      "A tadpole does not look like a frog. It has a tail and no legs. First the back legs grow. The front legs appear next. The tail gets shorter. At last the small frog can leave the pond.",
      QI,
      [K("the changes as a tadpole grows up"), P("the back legs beginning to appear", "D-PLAUSIBLE-UNSUPPORTED"), P("the front legs growing after the back ones", "D-PLAUSIBLE-UNSUPPORTED"), P("the best places for frogs to find food", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 1, 3,
      "Old paper does not have to be trash. Trucks take it to a special factory. Water and paper are mashed into soft pulp. The pulp is rolled flat and dried. The new paper is ready to use again.",
      QI,
      [K("turning used paper into paper again"), P("trucks taking used paper to a factory", "D-PLAUSIBLE-UNSUPPORTED"), P("water mixing with paper to form pulp", "D-PLAUSIBLE-UNSUPPORTED"), P("different things a paper factory can make", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 1, 4,
      "A lighthouse stands where the rocks are dangerous. At night its big lamp turns round and round. Ships out at sea watch for its flashing light. It warns them about rocks in the water. They can steer safely past.",
      QI,
      [K("using a lighthouse to guide boats safely"), P("watching a large lamp turn at night", "D-PLAUSIBLE-UNSUPPORTED"), P("finding different buildings beside the sea", "D-PLAUSIBLE-UNSUPPORTED"), P("learning how sailors live aboard their ships", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 2, 5,
      "An ant can carry things bigger than itself. Ants work in long lines. One ant finds food and leaves a smell trail. The others follow the trail. The ants work together to carry food home.",
      QI,
      [K("how ants work together for food"), P("how one ant leaves a smell trail", "D-PLAUSIBLE-UNSUPPORTED"), P("how ants keep their nest warm", "D-PLAUSIBLE-UNSUPPORTED"), P("how ants care for all their eggs", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 2, 6,
      "Shadows are not the same all day. Morning shadows are long when the sun is low. At midday the sun is high. Shadows become shorter. Evening shadows stretch out the other way.",
      QI,
      [K("shadows changing as the sun moves"), P("short shadows beneath the high midday sun", "D-PLAUSIBLE-UNSUPPORTED"), P("long shadows stretching across the evening ground", "D-PLAUSIBLE-UNSUPPORTED"), P("people using shadows to keep out of sunlight", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 2, 7,
      "A spider web starts with one thin thread. The wind carries the thread across a gap. The spider walks along it, adding more threads. The sticky web can trap flies for dinner.",
      QI,
      [K("how a spider builds its web"), P("how wind carries one thin thread", "D-PLAUSIBLE-UNSUPPORTED"), P("how spiders find places to sleep", "D-PLAUSIBLE-UNSUPPORTED"), P("how a fly escapes a sticky web", "D-OPPOSITE")]),
    it("mostly_about_info", 1, 2, 8,
      "The moon does not really change its shape. The moon circles the Earth. Sunlight lights up one side of it. Some nights we see the whole bright side. Other nights we see only a thin piece. That is why the moon looks different.",
      QI,
      [K("the reason the moon appears to change"), P("the thin part visible on some nights", "D-PLAUSIBLE-UNSUPPORTED"), P("sunlight shining on one side of the moon", "D-PLAUSIBLE-UNSUPPORTED"), P("the way astronauts travel between Earth and space", "D-OPPOSITE")]),

    // ================= LEVEL 1 · mostly_about_everyday (8) =================
    it("mostly_about_everyday", 1, 1, 1,
      "Every morning Mr Pole stands at the school crossing. He raises his round sign to stop the cars. He waves the children across, grinning his good-morning grin. He arrives before the bell in any weather.",
      QI,
      [K("someone helping pupils cross the road daily"), P("holding a round sign to stop passing cars", "D-PLAUSIBLE-UNSUPPORTED"), P("arriving at the school before the morning bell", "D-PLAUSIBLE-UNSUPPORTED"), P("people learning how to drive past a school", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 1, 2,
      "The class had a cleanup race before home time. One team stacked the chairs. Another team collected the pencils. The last team wiped the tables. Soon the room was neat. Each child earned a sticker for helping.",
      QI,
      [K("children working together to clean their classroom"), P("one team making a neat pile of chairs", "D-PLAUSIBLE-UNSUPPORTED"), P("another team collecting pencils before home time", "D-PLAUSIBLE-UNSUPPORTED"), P("a teacher explaining the rules for earning stickers", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 1, 3,
      "Saturday is market day. Grandma gives Ade the shopping list. He finds the oranges, and Grandma picks the fish. The vendor always adds one free plum for Ade. They carry their food home for dinner.",
      QI,
      [K("a boy shopping for dinner with his grandmother"), P("a seller giving Ade one extra plum", "D-PLAUSIBLE-UNSUPPORTED"), P("Grandma choosing fish from a market stall", "D-PLAUSIBLE-UNSUPPORTED"), P("Ade learning to cook the family’s evening meal", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 1, 4,
      "The laundromat on our street hums all morning. Round windows spin with socks and shirts. Mrs Kaur folds warm towels into tall piles. People chat while they wait for clean clothes.",
      QI,
      [K("people getting washing done at a busy shop"), P("Mrs Kaur stacking the towels after folding them", "D-PLAUSIBLE-UNSUPPORTED"), P("socks and shirts turning behind round glass windows", "D-PLAUSIBLE-UNSUPPORTED"), P("shop owners deciding what clothes they will sell", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 2, 5,
      "After the rain, the playground was full of puddles. Children splashed in the deep puddle by the slide. Two friends raced leaf boats along the gutter stream. By lunch, the warm sun had dried the puddles.",
      QI,
      [K("enjoying outdoor puddles and streams"), P("racing leaf boats along the gutter", "D-PLAUSIBLE-UNSUPPORTED"), P("watching warm sunlight dry the ground", "D-PLAUSIBLE-UNSUPPORTED"), P("waiting indoors until the weather changes", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 2, 6,
      "Dad flips the calendar to a new month. Everyone adds their days. Swimming badge test for Lena. Dentist for Dad. Grandma's visit gets a big red circle. The little squares fill up with the family's plans.",
      QI,
      [K("using a calendar to organise family activities"), P("drawing a red circle around Grandma’s visit", "D-PLAUSIBLE-UNSUPPORTED"), P("turning the page when a new month begins", "D-PLAUSIBLE-UNSUPPORTED"), P("planning what to buy for Lena’s swimming lesson", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 2, 7,
      "The mail cart comes up our road at nine. Letters slide through mail slots, flap, flap, flap. The family at number twelve signs for a package. Our dog waits by the mail slot each morning.",
      QI,
      [K("mail being delivered around the neighbourhood"), P("a family signing to receive its package", "D-PLAUSIBLE-UNSUPPORTED"), P("a dog waiting near the door each morning", "D-PLAUSIBLE-UNSUPPORTED"), P("families learning to write letters to each other", "D-OPPOSITE")]),
    it("mostly_about_everyday", 1, 2, 8,
      "The bakery opens before the sun is up. Trays of rolls slide into the big oven. The smell of warm bread drifts down the street. At eight, people line up outside for fresh bread.",
      QI,
      [K("a bread shop preparing for its daily customers"), P("people waiting outside the shop at eight", "D-PLAUSIBLE-UNSUPPORTED"), P("fresh rolls going into a large hot oven", "D-PLAUSIBLE-UNSUPPORTED"), P("a baker teaching customers to make their bread", "D-OPPOSITE")]),

    // ================= LEVEL 2 · best_title (8) =================
    it("best_title", 2, 1, 1,
      "Nobody wanted the muddy corner of the school garden. Weeds grew tall, and snack wrappers blew against the fence. Then a second-grade class claimed it. They pulled weeds and added compost to the soil. Then they planted rows of sunflower seeds. All summer the corner was bright with yellow flowers. Even the school cleaner stopped to take photographs.",
      "Which title fits this passage best?",
      [K("A Forgotten Corner Becomes a Garden"), P("Removing Snack Wrappers from the Fence", "D-PLAUSIBLE-UNSUPPORTED"), P("Photographs Taken by the School Cleaner", "D-PLAUSIBLE-UNSUPPORTED"), P("Choosing Flowers for Every Part of Town", "D-OPPOSITE")]),
    it("best_title", 2, 1, 2,
      "When the old footbridge closed for repairs, everyone grumbled. The walk to school took ten minutes longer, right around the stream. Children found blackberries and a heron along the longer walk. They also found a hollow tree that echoed. Some families still chose the long way after the bridge reopened.",
      "Which title fits this passage best?",
      [K("Discoveries on a Longer Journey"), P("Repair Work on the Old Footbridge", "D-PLAUSIBLE-UNSUPPORTED"), P("The Hollow Tree beside the Stream", "D-PLAUSIBLE-UNSUPPORTED"), P("Blackberries Ready for Picking near School", "D-OPPOSITE")]),
    it("best_title", 2, 1, 3,
      "Asha's drum kit lived in the garage, because drums are loud. She tried the tricky rhythm each evening. Her sticks kept missing the beats in the middle. Her mom suggested slowing right down. Boring, thought Asha, but she tried it. Two weeks later, she could play it fast without a mistake.",
      "Which title fits this passage best?",
      [K("Slow Practice Makes the Rhythm Work"), P("Keeping a Drum Kit in the Garage", "D-PLAUSIBLE-UNSUPPORTED"), P("A Mother Suggests a Different Hobby", "D-PLAUSIBLE-UNSUPPORTED"), P("The First Evening of a Music Course", "D-OPPOSITE")]),
    it("best_title", 2, 1, 4,
      "The aquarium otters kept escaping their pool at night. They slid along the halls outside. Cameras showed them stacking rocks by the glass wall like little stairs. The keepers did not punish the clever climbers. They built a bigger pool with tunnels and waterfalls. The otters had rocks to move around too.",
      "Which title fits this passage best?",
      [K("A Better Home for Clever Escaping Otters"), P("Night Cameras Watching the Aquarium Halls", "D-PLAUSIBLE-UNSUPPORTED"), P("A Guide to Animals That Can Climb", "D-PLAUSIBLE-UNSUPPORTED"), P("The Rocks beside an Aquarium Pool", "D-OPPOSITE")]),
    it("best_title", 2, 2, 5,
      "Grandpa folds a square of paper in silence. Corner to corner, crease by crease. Suddenly it has wings. He taught Dad this plane thirty years ago. Today he is showing me how to fold it. Mine flies crooked, then straight, then right across the kitchen. Grandpa says the fold matters more than the throw.",
      "Which title fits this passage best?",
      [K("A Paper Plane Shared Across Generations"), P("Making Wings from Corners of Paper", "D-PLAUSIBLE-UNSUPPORTED"), P("Learning How to Throw across a Room", "D-PLAUSIBLE-UNSUPPORTED"), P("A Guide to the Fastest Real Aircraft", "D-OPPOSITE")]),
    it("best_title", 2, 2, 6,
      "At first the new rain gauge seemed dull. A plastic tube, a ruler, an empty chart. But day by day the chart filled in. A dry week made a flat line. A stormy Tuesday shot the line up like a mountain. By term end, the class could read their whole spring there. The chart showed dry weeks and wet weeks.",
      "Which title fits this passage best?",
      [K("Recording a Whole Season of Rain"), P("A Storm Arrives on One Tuesday", "D-PLAUSIBLE-UNSUPPORTED"), P("The Ruler beside a Plastic Tube", "D-PLAUSIBLE-UNSUPPORTED"), P("Explaining Why the Weather Brings Storms", "D-OPPOSITE")]),
    it("best_title", 2, 2, 7,
      "The station escalator broke on Monday. A sign beside it said SORRY. Some people sighed and took the stairs. A musician sat on the bottom step. He played cheerful songs for people walking up. Strangers counted steps together and laughed when they lost count. It was, everyone agreed, a strangely happy week.",
      "Which title fits this passage best?",
      [K("An Unexpectedly Cheerful Climb at the Station"), P("Reading an Apology beside the Broken Steps", "D-PLAUSIBLE-UNSUPPORTED"), P("A Guide to Repairing Station Equipment", "D-PLAUSIBLE-UNSUPPORTED"), P("The Different Songs a Musician Can Play", "D-OPPOSITE")]),
    it("best_title", 2, 2, 8,
      "Every seed in the seed bank sleeps in a silver packet. It holds wheat and beans from different places. Some pumpkin seeds were saved a hundred years ago. A flood or fire could destroy crops in a field. Farmers could then plant saved seeds of those crops. The freezer hums quietly, keeping tomorrow's fields safe on its cold shelves.",
      "Which title fits this passage best?",
      [K("Saving Seeds to Protect Future Crops"), P("The Pumpkin Seeds from a Century Ago", "D-PLAUSIBLE-UNSUPPORTED"), P("Wheat and Beans from Different Places", "D-PLAUSIBLE-UNSUPPORTED"), P("Choosing the Best Food for a Farmer", "D-OPPOSITE")]),

    // ================= LEVEL 2 · main_idea_vs_detail (8) =================
    it("main_idea_vs_detail", 2, 1, 1,
      "The class made soup for the winter fair. Priya chopped carrots into little moons. Sam stirred so the bottom would not stick. Miss Lee added one secret spoonful of ginger. Soon the soup bubbled, filling the hall with a lovely smell. Every bowl sold within twenty minutes.",
      "Which option best states the main idea?",
      [K("the class made soup that everyone loved"),
       P("carrots were cut into little moons", "D-DETAIL-AS-MAIN"),
       P("Miss Lee added some ginger", "D-DETAIL-AS-MAIN"),
       P("Sam stirred the pot", "D-DETAIL-AS-MAIN")],
      { note: "three true details vs the point — the defining discrimination of this cell" }),
    it("main_idea_vs_detail", 2, 1, 2,
      "Hedgehogs need help in autumn. They need a safe pile of leaves for their winter sleep. People can leave leaves in a quiet garden corner. They can check bonfires for sleeping animals before lighting them. A small fence gap lets hedgehogs visit other gardens for food.",
      "Which option best states the main idea?",
      [K("people can make gardens safer for hedgehogs"),
       P("hedgehogs sleep in piles of leaves", "D-DETAIL-AS-MAIN"),
       P("a gap in a fence helps hedgehogs walk through", "D-DETAIL-AS-MAIN"),
       P("bonfires should be checked", "D-DETAIL-AS-MAIN")]),
    it("main_idea_vs_detail", 2, 1, 3,
      "Maya kept a moon diary for a month. On clear nights she drew the moon's shape in silver pencil. On cloudy nights she wrote 'hidden' in the box. Slowly her pages showed the moon growing round, then shrinking thin. Her diary turned a whole month of sky into one small story.",
      "Which option best states the main idea?",
      [K("Maya's diary recorded how the moon changed"),
       P("she drew with a silver pencil", "D-DETAIL-AS-MAIN"),
       P("some nights she wrote 'hidden'", "D-DETAIL-AS-MAIN"),
       P("she kept the diary for a month", "D-DETAIL-AS-MAIN")]),
    it("main_idea_vs_detail", 2, 1, 4,
      "The old phone box no longer has a phone inside. The town filled it with books instead. Anyone may take one home, as long as they leave another. The shelves change every week: cookbooks, comics, mysteries. The little red box is now the smallest library in town.",
      "Which option best states the main idea?",
      [K("the phone box became a tiny library"),
       P("the box is red", "D-DETAIL-AS-MAIN"),
       P("the shelves change every week", "D-DETAIL-AS-MAIN"),
       P("people leave a book when they take one", "D-DETAIL-AS-MAIN")]),
    it("main_idea_vs_detail", 2, 2, 5,
      "Dad's garden plot gives us vegetables nearly all year. In spring we pull sweet little radishes. Summer brings beans that climb higher than me. In autumn we dig up potatoes like buried treasure. Even in winter there is kale, standing green in the frost.",
      "Which option best states the main idea?",
      [K("the garden plot grows food in every season"),
       P("beans climb very high", "D-DETAIL-AS-MAIN"),
       P("potatoes are dug in autumn", "D-DETAIL-AS-MAIN"),
       P("kale stands in the frost", "D-DETAIL-AS-MAIN")]),
    it("main_idea_vs_detail", 2, 2, 6,
      "The fire station opened its doors on Saturday. Children tried on helmets that wobbled on their heads. A firefighter showed how the long ladder unfolds to reach high windows. Everyone got to spray the practice hose at a target. By home time, half the visitors wanted the job one day.",
      "Which option best states the main idea?",
      [K("visitors learning about a firefighter’s work"), P("the helmets wobbling on the visitors’ heads", "D-PLAUSIBLE-UNSUPPORTED"), P("the long ladder reaching toward high windows", "D-PLAUSIBLE-UNSUPPORTED"), P("children spraying a practice hose at a target", "D-OPPOSITE")]),
    it("main_idea_vs_detail", 2, 2, 7,
      "A wind farm stands on the hill above our town. Each turbine is taller than the church tower. The spinning blades use wind to make electricity for nearby homes. The blades rest on still days and spin on windy days.",
      "Which option best states the main idea?",
      [K("the wind farm makes electricity from wind"),
       P("turbines are taller than the church", "D-DETAIL-AS-MAIN"),
       P("blades rest on still days", "D-DETAIL-AS-MAIN"),
       P("the blades look like pinwheels", "D-DETAIL-AS-MAIN")]),
    it("main_idea_vs_detail", 2, 2, 8,
      "Our street planned a surprise for Mr Chen's hundredth birthday. Neighbors strung flags from lamp post to lamp post. The cafe made a cake with one hundred candles. Lighting all those candles took three tries. Children painted a banner as long as a bus. When Mr Chen stepped outside, the whole street sang at once.",
      "Which option best states the main idea?",
      [K("the street celebrated Mr. Chen's birthday together"),
       P("the cake had one hundred candles", "D-DETAIL-AS-MAIN"),
       P("the banner was as long as a bus", "D-DETAIL-AS-MAIN"),
       P("flags were strung from lamp post to lamp post", "D-DETAIL-AS-MAIN")]),

    // ================= LEVEL 2 · summary_choice (8) =================
    it("summary_choice", 2, 1, 1,
      "Leo wanted to swim the whole length of the pool. At first he could only manage halfway before standing up, coughing. His coach taught him one small swimming skill each week. He practiced slower arms, blowing bubbles and long kicks. After six weeks, Leo reached the far wall without stopping. He lifted his face from the water and grinned.",
      "Which sentence sums up the whole passage best?",
      [K("Leo improved with regular coaching and eventually swam a full length."), P("Leo reached halfway before deciding to begin his first swimming lesson.", "D-PLAUSIBLE-UNSUPPORTED"), P("Leo taught his coach a new way to reach the far wall.", "D-PLAUSIBLE-UNSUPPORTED"), P("Leo practiced for six weeks but still stopped at the halfway point.", "D-OPPOSITE")]),
    it("summary_choice", 2, 1, 2,
      "The museum's dinosaur skeleton arrived in ninety-two boxes. Visitors watched through glass as scientists fitted bones together. They worked for a whole month. A neck as long as a slide rose slowly toward the ceiling. At last they added the final tail bone. The huge skeleton looked like the museum poster.",
      "Which sentence sums up the whole passage best?",
      [K("Visitors saw experts put a huge fossil together over a month."), P("Visitors fitted bones together while scientists watched from behind glass.", "D-PLAUSIBLE-UNSUPPORTED"), P("Scientists packed the finished skeleton into boxes to leave the museum.", "D-PLAUSIBLE-UNSUPPORTED"), P("Scientists added a neck but decided the tail could never fit.", "D-OPPOSITE")]),
    it("summary_choice", 2, 1, 3,
      "When the power went out, the apartment went quiet and dark. Mom found candles, and we ate supper by their small light. Grandma taught us a clapping game from her childhood. The lights came back on at bedtime. We still wanted to keep one candle burning.",
      "Which sentence sums up the whole passage best?",
      [K("Losing electric light led the family to enjoy an evening together."), P("The family played an old game until they found working electric lights.", "D-PLAUSIBLE-UNSUPPORTED"), P("Grandma taught a clapping game before the electricity failed at bedtime.", "D-PLAUSIBLE-UNSUPPORTED"), P("The family stopped their supper and waited silently for the lights.", "D-OPPOSITE")]),
    it("summary_choice", 2, 1, 4,
      "The tide pool looked empty at first. Then Nadia crouched still and waited. A crab sidled out from under a stone. Something on the rock opened its tiny arms. It was a small sea animal. As she waited, she saw more animals come into view.",
      "Which sentence sums up the whole passage best?",
      [K("Nadia waited patiently and began noticing many small sea creatures."), P("Nadia waited for a crab to leave so she could swim.", "D-PLAUSIBLE-UNSUPPORTED"), P("Nadia moved the rocks to make room for more sea animals.", "D-PLAUSIBLE-UNSUPPORTED"), P("Nadia watched the seaside but found no life near the stones.", "D-OPPOSITE")]),
    it("summary_choice", 2, 2, 5,
      "A robot can vacuum a floor, but it needs some help. Cables must be lifted off the floor, or the robot eats them. Chairs become fences that trap it in corners. One sock can end the whole clean. Tidy first, the instructions say, and the robot will do the rest.",
      "Which sentence sums up the whole passage best?",
      [K("A robotic cleaner works better when obstacles have been removed first."), P("A robotic cleaner moves chairs and picks up socks before vacuuming.", "D-PLAUSIBLE-UNSUPPORTED"), P("A robotic cleaner needs someone to guide it into every room.", "D-PLAUSIBLE-UNSUPPORTED"), P("A robotic cleaner works only while the family is away from home.", "D-OPPOSITE")]),
    it("summary_choice", 2, 2, 6,
      "The ferry crosses the bay eight times a day. Islanders set their clocks by its horn. It carries children to school, then shopping crates at noon. Workers take it home in the evening. During storms it stays tied to the dock. Islanders wait for the weather to let it sail again.",
      "Which sentence sums up the whole passage best?",
      [K("The ferry connects islanders with the activities and supplies they need."), P("The ferry carries only schoolchildren and returns when their lessons finish.", "D-PLAUSIBLE-UNSUPPORTED"), P("The ferry sails through storms because islanders need its regular service.", "D-PLAUSIBLE-UNSUPPORTED"), P("The ferry brings visitors but islanders mainly use other ways to travel.", "D-OPPOSITE")]),
    it("summary_choice", 2, 2, 7,
      "Amir's baby sister cried every time he practiced trumpet. He tried the yard, but the neighbors heard every note. The bathroom had a good echo but very little space. The winter coats in the closet made the trumpet much quieter. At last Amir had a place to practice.",
      "Which sentence sums up the whole passage best?",
      [K("Amir tried several spots before finding somewhere quiet enough to play."), P("Amir stopped playing trumpet because his sister preferred to hear singing.", "D-PLAUSIBLE-UNSUPPORTED"), P("Amir chose the bathroom because it had space for his neighbours.", "D-PLAUSIBLE-UNSUPPORTED"), P("Amir practiced in the yard because nobody there could hear him.", "D-OPPOSITE")]),
    it("summary_choice", 2, 2, 8,
      "The street mural began as one painted door. Next, the artist painted a whale above the door. Waves spread along the walls of three more houses. Neighbors started leaving paint cans by their walls as an invitation. By summer, the street looked like a sea scene. Visitors came across town to take pictures.",
      "Which sentence sums up the whole passage best?",
      [K("A small painting inspired a neighbourhood to become a shared artwork."), P("Neighbours painted over an artist’s work to keep their houses plain.", "D-PLAUSIBLE-UNSUPPORTED"), P("An artist moved his painted door to three different houses that summer.", "D-PLAUSIBLE-UNSUPPORTED"), P("Visitors brought a whale painting to replace the art along the street.", "D-OPPOSITE")]),

    // ================= RETENTION RESERVE (form R: 8 L1-style + 8 L2-style) ==
    it("mostly_about_fiction", 1, 1, 9,
      "Bo built his blocks higher than the table. His baby brother reached out one finger. Crash! Blocks rolled everywhere. Bo took a big breath. He gave his brother two blocks to use. Together they started a new tower.",
      Q1,
      [K("two brothers rebuilding after their tower falls"), P("blocks rolling across the classroom floor", "D-PLAUSIBLE-UNSUPPORTED"), P("a child taking one deep steady breath", "D-PLAUSIBLE-UNSUPPORTED"), P("a child learning how real houses are built", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_fiction", 1, 1, 10,
      "Nia's kite would not fly. It flopped on the grass like a tired fish. Grandpa made a longer tail from his old scarf. The next gust lifted the kite above the hill. Nia laughed and ran beneath it.",
      Q1,
      [K("Nia and Grandpa making her kite work"), P("Grandpa cutting a tail from his scarf", "D-PLAUSIBLE-UNSUPPORTED"), P("a gust blowing over the top of a hill", "D-PLAUSIBLE-UNSUPPORTED"), P("Nia rescuing a kite caught in a tall tree", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_info", 1, 1, 9,
      "A magnet does not pull every material. It pulls steel paper clips and iron nails. It does not pull plastic, wood or glass. A metal coin may not stick at all. Only some metals are pulled by a magnet.",
      QI,
      [K("which materials a magnet can pull"), P("how a magnet pulls paper clips", "D-PLAUSIBLE-UNSUPPORTED"), P("why every metal sticks to magnets", "D-PLAUSIBLE-UNSUPPORTED"), P("how plastic toys are made in factories", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_info", 1, 2, 10,
      "Compost turns old scraps into useful plant food. Peelings, leaves, and eggshells go into the bin. Tiny creatures break them down over several months. Slowly the scraps turn dark and crumbly. Gardeners add this compost to their soil.",
      QI,
      [K("making useful compost from food and plant waste"), P("putting eggshells and leaves into a compost bin", "D-PLAUSIBLE-UNSUPPORTED"), P("watching tiny creatures chew through old scraps", "D-PLAUSIBLE-UNSUPPORTED"), P("choosing the right place to grow new vegetables", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_everyday", 1, 1, 9,
      "The waiting room has fish and old comics. Ben watches the striped fish glide while Mom reads. A buzzer sounds and a nurse calls Ben. He climbs into the dentist's big chair.",
      QI,
      [K("Ben waiting for his dental appointment"), P("a striped fish moving through the tank", "D-PLAUSIBLE-UNSUPPORTED"), P("Mom reading while sitting beside her son", "D-PLAUSIBLE-UNSUPPORTED"), P("Ben learning how to keep his teeth clean", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_everyday", 1, 2, 10,
      "On Sunday the whole apartment smells of coconut rice. Auntie stirs the big silver pot. Cousins squeeze around the small table, elbow to elbow. Someone always finds an extra chair and plate. Everyone shares food and stories together.",
      QI,
      [K("relatives gathering to share a meal and talk"), P("Auntie stirring rice in a large silver pot", "D-PLAUSIBLE-UNSUPPORTED"), P("someone finding an extra plate for the table", "D-PLAUSIBLE-UNSUPPORTED"), P("cousins learning recipes from several different countries", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_fiction", 1, 2, 11,
      "The classroom hamster escaped on Friday. All weekend he was loose in the school. On Monday they followed seed shells past the library. The hamster lay in the lost-and-found box. He was curled inside a wool hat.",
      Q1,
      [K("finding the class pet after it escapes"), P("following empty seed shells past the library", "D-PLAUSIBLE-UNSUPPORTED"), P("a wool hat inside the lost-property box", "D-PLAUSIBLE-UNSUPPORTED"), P("learning to feed a hamster over the weekend", "D-OPPOSITE")], { retention: true }),
    it("mostly_about_info", 1, 2, 11,
      "Tide pools change twice a day. At low tide, pools sit still in the sun. People can look at the creatures inside. The rising tide covers the pools with seawater. It brings fresh food for the creatures. Life in a tide pool changes with the tide.",
      QI,
      [K("how the rising sea changes small shore pools"), P("how creatures sit in still pools at low tide", "D-PLAUSIBLE-UNSUPPORTED"), P("which creatures are easiest to see in the sun", "D-PLAUSIBLE-UNSUPPORTED"), P("how different sea animals find homes far offshore", "D-OPPOSITE")], { retention: true }),
    it("best_title", 2, 1, 9,
      "The night bus is a different world. Streetlights slide across sleepy faces. A nurse heads to work. A baker heads home with flour on his coat. The driver knows the regular passengers by name. He waits to give everyone time to reach the bus.",
      "Which title fits this passage best?",
      [K("The People Who Travel While Others Sleep"), P("A Baker with Flour on His Coat", "D-PLAUSIBLE-UNSUPPORTED"), P("The Nurse Going to Work Tonight", "D-PLAUSIBLE-UNSUPPORTED"), P("A Driver Learning an Unfamiliar Route", "D-OPPOSITE")], { retention: true }),
    it("best_title", 2, 2, 10,
      "The campfire needed three tries. The first pile of sticks was too wet. The second caught, then faded into smoke. For try three, Sana put dry bark under the sticks. She stacked the sticks like a little tent. Her uncle lit the bark safely. Flames climbed through the sticks and kept the fire burning.",
      "Which title fits this passage best?",
      [K("Sana Keeps Trying to Light the Fire"), P("The First Pile of Sticks Was Wet", "D-PLAUSIBLE-UNSUPPORTED"), P("Finding the Safest Campsite in the Forest", "D-PLAUSIBLE-UNSUPPORTED"), P("Three Ways to Put Out a Campfire", "D-OPPOSITE")], { retention: true }),
    it("main_idea_vs_detail", 2, 1, 9,
      "Swifts are astonishing birds. They eat while flying and even sleep on the wing. Their nests sit under roofs. Once the young birds leave, they spend long periods flying. In late summer, swifts swoop above the town, calling loudly.",
      "Which option best states the main idea?",
      [K("swifts spend much of their lives flying"), P("swift nests are tucked away under roofs", "D-PLAUSIBLE-UNSUPPORTED"), P("young swifts leave their nests after growing", "D-PLAUSIBLE-UNSUPPORTED"), P("swifts call while flying above the town", "D-OPPOSITE")], { retention: true }),
    it("main_idea_vs_detail", 2, 2, 10,
      "The repair cafe opens once a month in the hall. People bring broken toasters, wobbly chairs, and jackets with stuck zips. Volunteers sit at tables and mend things for free. They explain each repair so visitors can learn. Most visitors leave with their things working and a new trick learned.",
      "Which option best states the main idea?",
      [K("People can get belongings mended and learn repair skills."), P("Visitors bring jackets with zips that have become stuck.", "D-PLAUSIBLE-UNSUPPORTED"), P("The monthly repair cafe takes place inside the hall.", "D-PLAUSIBLE-UNSUPPORTED"), P("Volunteers use tables to spread out their repair tools.", "D-OPPOSITE")], { retention: true }),
    it("summary_choice", 2, 1, 9,
      "The twins entered the sandcastle contest with a plan. Ria dug the moat while Rafi packed the towers. Halfway through, a wave stole their gate. They rebuilt it farther up the beach, faster this time. They missed first prize but won a special teamwork ribbon.",
      "Which sentence sums up the whole passage best?",
      [K("The twins rebuilt after damage and earned praise for cooperating."), P("The twins dug a moat but left their towers unfinished.", "D-PLAUSIBLE-UNSUPPORTED"), P("The twins won first prize before a wave reached the beach.", "D-PLAUSIBLE-UNSUPPORTED"), P("The twins gave up when the wave washed their gate away.", "D-OPPOSITE")], { retention: true }),
    it("summary_choice", 2, 2, 10,
      "The bookstore owner noticed birds bumping into its clear window. She covered the outside glass with closely spaced dots. Fewer birds hit the window after that. She shared the method and spare stickers with neighbours. Other people marked their windows in the same way.",
      "Which sentence sums up the whole passage best?",
      [K("A shop’s window markings inspired others to reduce bird collisions too."), P("Birds stopped visiting the street because shops removed all their windows.", "D-PLAUSIBLE-UNSUPPORTED"), P("A shop sold books about birds after taking stickers off its window.", "D-PLAUSIBLE-UNSUPPORTED"), P("People copied a shop’s window decoration without noticing any bird collisions.", "D-OPPOSITE")], { retention: true }),
    it("best_title", 2, 1, 11,
      "Dad's radio made only crackles until Amal carefully turned its dial. A voice became clear, followed by music. The radio now sits on the windowsill. Amal finds the station each morning before breakfast.",
      "Which title fits this passage best?",
      [K("Finding Music on Dad’s Old Radio"), P("Breakfast beside the Kitchen Windowsill", "D-PLAUSIBLE-UNSUPPORTED"), P("The Different Ways That Sound Travels", "D-PLAUSIBLE-UNSUPPORTED"), P("A Collection of Radios from Long Ago", "D-OPPOSITE")], { retention: true }),
    it("summary_choice", 2, 2, 11,
      "The school's old apple tree gives more fruit than anyone can eat. This year the cook dried rings of apple for snack time. A first-grade class pressed juice with a squeaky hand press. The rest filled crates by the gate. A sign said HELP YOURSELF. Every crate was empty by Friday.",
      "Which sentence sums up the whole passage best?",
      [K("The school used and shared its extra fruit in several ways."), P("The school saved every apple in crates for its own winter meals.", "D-PLAUSIBLE-UNSUPPORTED"), P("The school pressed all the apples into juice for one class.", "D-PLAUSIBLE-UNSUPPORTED"), P("The school gave every fresh apple away before making any snacks.", "D-OPPOSITE")], { retention: true }),
    // Fresh retry stock: four additional questions in each phase.
    {
      "u": "mostly_about_info",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_info",
      "passage": "A helmet has a hard outer shell. Soft pads fit around your head inside. A strap holds it in place. These parts help protect you if you fall.",
      "prompt": "What is this mostly about?",
      "choices": [K("how helmet parts protect your head"), P("how soft pads fit around your head", "D-PLAUSIBLE-UNSUPPORTED"), P("how a strap holds the helmet in place", "D-PLAUSIBLE-UNSUPPORTED"), P("how the hard shell covers the soft pads", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_fiction",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_fiction",
      "passage": "Nell could not find her library card. She checked her bag and coat. Then she retraced her walk from the bus. Her card was beside the front steps.",
      "prompt": "What is the story mostly about?",
      "choices": [
        {
          "t": "Nell searching for her missing library card",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Nell choosing a book about bus journeys",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Nell getting ready for a winter walk",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Nell helping someone repair the front steps",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_everyday",
      "lvl": 1,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_everyday",
      "passage": "The class found litter beside their pond. They wore gloves and collected it safely. They sorted rubbish from things that could be recycled. Soon, the water’s edge was clear again.",
      "prompt": "What is the passage mostly about?",
      "choices": [K("children cleaning the area around their pond"), P("children choosing gloves for cold winter days", "D-PLAUSIBLE-UNSUPPORTED"), P("children looking for fish in their school pond", "D-PLAUSIBLE-UNSUPPORTED"), P("children building a new rubbish bin for school", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_info",
      "lvl": 1,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_info",
      "passage": "Ramps make steps easier to avoid. Wide doors give wheelchairs more room. Clear paths help people move around safely. These changes let more people use a building.",
      "prompt": "What is this mostly about?",
      "choices": [
        {
          "t": "making buildings easier for everyone to use",
          "r": "KEY",
          "k": true
        },
        {
          "t": "measuring the tallest doors in a building",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "keeping busy roads safe from fast cars",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "choosing rooms for a new school club",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_fiction",
      "lvl": 1,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_fiction",
      "passage": "Tao’s paper boat sank in the bath. He folded another with higher sides. It floated but tipped when he added stones. He made a wider boat that stayed upright.",
      "prompt": "What is the story mostly about?",
      "choices": [
        {
          "t": "Tao improving his paper boat through testing",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Tao counting stones collected beside a river",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Tao learning to fold a paper bird",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Tao washing his toys before putting them away",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_info",
      "lvl": 1,
      "ph": 2,
      "v": 23,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_info",
      "passage": "Bats rest in dark places during the day. At dusk, some hunt flying insects. They use sounds and echoes to find their way. They return to rest when night ends.",
      "prompt": "What is the passage mostly about?",
      "choices": [K("how bats spend their active hours"), P("how insects find food in gardens", "D-PLAUSIBLE-UNSUPPORTED"), P("how caves are formed in rocky hills", "D-PLAUSIBLE-UNSUPPORTED"), P("how animals keep warm on cold nights", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_info",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_info",
      "passage": "A market stall opens before the shops. Its seller lays out fresh fruit. Customers choose what they need and pay. At closing time, the seller packs the fruit away.",
      "prompt": "What is this mostly about?",
      "choices": [K("how a seller spends the market day"), P("which fresh fruit customers like most", "D-PLAUSIBLE-UNSUPPORTED"), P("why fruit grows beside busy shops", "D-PLAUSIBLE-UNSUPPORTED"), P("how empty stalls are built and repaired", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "mostly_about_fiction",
      "lvl": 1,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "mostly_about_fiction",
      "passage": "Sam and Jo wanted to share a small desk. Their papers kept mixing. They made two trays and cleared a space between. Now both had room to work together.",
      "prompt": "What is the story mostly about?",
      "choices": [
        {
          "t": "two children arranging a shared place to work",
          "r": "KEY",
          "k": true
        },
        {
          "t": "two children choosing new books for school",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "two children building a desk from spare wood",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "two children arguing about who works faster",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "main_idea_vs_detail",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "main_idea_vs_detail",
      "passage": "The town library lends more than books. Visitors can borrow puzzles, maps, and simple musical instruments. Staff also run free classes to help people use computers. These services make it a place for many kinds of learning.",
      "prompt": "Which statement gives the main idea?",
      "choices": [
        {
          "t": "The library supports learning in several different ways.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Library visitors can borrow instruments to play music.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Some library classes teach people to use computers.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The library lends maps and puzzles to local visitors.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "summary_choice",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "summary_choice",
      "passage": "A storm damaged the footbridge, so the walking club changed its route. Members followed a longer path beside the fields. They marked the unsafe bridge and told the town office. The club finished safely and planned repairs with local volunteers.",
      "prompt": "Which summary includes the important events?",
      "choices": [
        {
          "t": "The club avoided a damaged bridge and arranged help with repairs.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The club walked beside fields and forgot about the damaged bridge.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The club repaired the bridge before starting its usual short walk.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The club cancelled its walk and left without warning anyone.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "best_title",
      "lvl": 2,
      "ph": 1,
      "v": 20,
      "fmt": "COMPREHENSION",
      "cell": "best_title",
      "passage": "A seed library lets gardeners borrow seeds at planting time. They grow the plants and save some of the new seeds. Later, they return those seeds for other gardeners to borrow. This keeps local varieties growing from year to year.",
      "prompt": "Which title fits the whole passage?",
      "choices": [
        {
          "t": "Seeds That Keep on Being Shared",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Choosing the Brightest Flower Colours",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The Fastest Way to Pick Vegetables",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Why Seeds All Need the Same Soil",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "main_idea_vs_detail",
      "lvl": 2,
      "ph": 1,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "main_idea_vs_detail",
      "passage": "The new playground includes low steps, ramps, and firm paths. Some swings offer extra support for children who need it. Quiet corners give children somewhere calm to rest. The design helps children with different needs enjoy playing there.",
      "prompt": "Which statement gives the main idea?",
      "choices": [
        {
          "t": "The playground is designed for children with different needs.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Some of the swings give children extra support while playing.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Firm paths run between several places in the playground.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Quiet corners offer a place away from the busy equipment.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "summary_choice",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "summary_choice",
      "passage": "A student newspaper asked pupils what needed changing at school. Many wanted a quiet place to read at lunch. The editors printed their suggestions and met with the headteacher. A spare room became a reading space the following month.",
      "prompt": "Which summary covers the whole passage?",
      "choices": [K("Pupils gathered requests and helped turn spare space into somewhere quiet."), P("Pupils asked for a quiet room but printed none of their suggestions.", "D-PLAUSIBLE-UNSUPPORTED"), P("The headteacher closed the reading space after meeting the newspaper editors.", "D-PLAUSIBLE-UNSUPPORTED"), P("The newspaper editors used the spare room to store their printed copies.", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "best_title",
      "lvl": 2,
      "ph": 2,
      "v": 21,
      "fmt": "COMPREHENSION",
      "cell": "best_title",
      "passage": "People once threw broken furniture away at the local collection centre. Now volunteers run repair sessions there each month. Owners learn to tighten joints, mend covers, and replace damaged parts. Many useful objects go home again instead of reaching the rubbish heap.",
      "prompt": "Which title fits the whole passage?",
      "choices": [
        {
          "t": "Repairing Together to Reduce Waste",
          "r": "KEY",
          "k": true
        },
        {
          "t": "Choosing New Furniture for Small Homes",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "The Story of One Broken Chair",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Making Collections of Unusual Old Objects",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "main_idea_vs_detail",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "main_idea_vs_detail",
      "passage": "In hot weather, the town puts drinking water in public places. Staff check shaded rest areas and visit people who live alone. Sports clubs move practice away from the hottest hours. These plans help residents cope with days of extreme heat.",
      "prompt": "Which statement gives the main idea?",
      "choices": [
        {
          "t": "The town uses several measures to protect people during heat.",
          "r": "KEY",
          "k": true
        },
        {
          "t": "The sports clubs change the times of their outdoor practices.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "Staff visit some people who live alone during hot weather.",
          "r": "D-PLAUSIBLE-UNSUPPORTED"
        },
        {
          "t": "People can find drinking water in several public places.",
          "r": "D-OPPOSITE"
        }
      ],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    },
    {
      "u": "summary_choice",
      "lvl": 2,
      "ph": 2,
      "v": 22,
      "fmt": "COMPREHENSION",
      "cell": "summary_choice",
      "passage": "Lin recorded which birds visited a tree outside her window. Visits dropped when building work began beside it. After the noise stopped, many of the same birds returned. Lin used her notes to describe how the disturbance changed their visits.",
      "prompt": "Which summary gives the important findings?",
      "choices": [K("Lin recorded fewer bird visitors during building noise and more afterward."), P("Lin recorded more bird visitors once noisy building work had begun.", "D-PLAUSIBLE-UNSUPPORTED"), P("Lin saw the same number of birds before and during building work.", "D-PLAUSIBLE-UNSUPPORTED"), P("Lin planted a tree after building noise made every bird leave forever.", "D-OPPOSITE")],
      "media": "text",
      "note": "Fresh authored retry item: distinct situation and evidence."
    }
]
};
