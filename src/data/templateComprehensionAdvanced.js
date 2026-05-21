function makeQuestion({
  id,
  grade = "2",
  skill,
  passage,
  question,
  answer,
  choices,
  target
}) {
  return {
    id,
    grade,
    skill,
    difficulty: 5,
    passage,
    question,
    image: "",
    imagePath: "",
    questionType: "multiple_choice",
    targetSkill: target || skill,
    choices,
    answer
  };
}

const keyDetailsPassages = [
  {
    passage: "A class planted bean seeds in clear cups. Each cup had soil, water, and a paper label with a student's name. On Friday, Mia noticed tiny green stems pushing through the soil. The class moved the cups closer to the sunny window.",
    questions: [
      ["What did the students plant?", "bean seeds", ["bean seeds", "flower bulbs", "apple trees", "grass patches"]],
      ["Why did the class move the cups?", "to give the plants more sunlight", ["to give the plants more sunlight", "to hide the labels", "to dry out the soil", "to make room for books"]],
      ["What showed that the seeds had started to grow?", "small green stems appeared", ["small green stems appeared", "the cups cracked", "the labels fell off", "the soil turned blue"]],
      ["What was written on each label?", "a student's name", ["a student's name", "the plant's height", "a watering rule", "the day of the week"]]
    ]
  },
  {
    passage: "During library time, Owen searched for a book about weather. He checked the science shelf first, then asked the librarian for help. She showed him a basket of books about clouds, rain, and wind. Owen chose one with photographs of storms.",
    questions: [
      ["What topic was Owen looking for?", "weather", ["weather", "sports", "music", "pets"]],
      ["Where did Owen look first?", "the science shelf", ["the science shelf", "the art table", "the front desk", "the story rug"]],
      ["Who helped Owen find more books?", "the librarian", ["the librarian", "his coach", "his neighbor", "the principal"]],
      ["What kind of book did Owen choose?", "one with storm photographs", ["one with storm photographs", "one with recipes", "one with jokes", "one with maps of oceans"]]
    ]
  },
  {
    passage: "The school garden needed care after a windy night. Leaves covered the path, and one tomato plant leaned against the fence. Aria and Ben swept the path before they watered the vegetables. Then their teacher tied the tomato plant to a wooden stick.",
    questions: [
      ["What happened before the class came to the garden?", "wind blew through the garden", ["wind blew through the garden", "snow covered the roof", "workers painted the fence", "students picked all the tomatoes"]],
      ["What did Aria and Ben do first?", "swept leaves from the path", ["swept leaves from the path", "tied up the tomato plant", "picked vegetables", "washed the fence"]],
      ["Which plant needed support?", "the tomato plant", ["the tomato plant", "the carrot plant", "the lettuce plant", "the bean plant"]],
      ["What did the teacher use to help the plant?", "a wooden stick", ["a wooden stick", "a paper bag", "a water bottle", "a basket"]]
    ]
  },
  {
    passage: "Nora brought a small notebook on the nature walk. She drew a feather, a smooth rock, and a red leaf. When the group stopped near the pond, she wrote that three frogs were sitting on a log. Back in class, Nora used her notes to share what she observed.",
    questions: [
      ["What did Nora carry on the walk?", "a small notebook", ["a small notebook", "a lunch tray", "a soccer ball", "a paintbrush"]],
      ["Where did Nora see the frogs?", "near the pond", ["near the pond", "inside the library", "under a desk", "beside the bus"]],
      ["How many frogs did Nora write about?", "three", ["three", "one", "five", "seven"]],
      ["How did Nora use her notes later?", "to tell the class what she observed", ["to tell the class what she observed", "to make a shopping list", "to choose a game", "to label her backpack"]]
    ]
  },
  {
    passage: "The art club prepared for a hallway display. First, students painted paper fish with bright colors. Then they cut blue paper into wave shapes. Before lunch, they taped the fish above the waves so the wall looked like an ocean scene.",
    questions: [
      ["What was the art club making?", "a hallway ocean display", ["a hallway ocean display", "a paper airplane contest", "a class cookbook", "a garden map"]],
      ["What did the students paint?", "paper fish", ["paper fish", "wooden boats", "glass jars", "cloth flags"]],
      ["What did the blue paper become?", "wave shapes", ["wave shapes", "tree trunks", "cloud labels", "book covers"]],
      ["Where did the students put the fish?", "above the waves", ["above the waves", "inside a box", "under the tables", "behind the door"]]
    ]
  }
];

const sequencingPassages = [
  {
    passage: "Lena wanted to make a thank-you card. She folded a sheet of yellow paper. Next, she drew flowers on the front. Then she wrote a kind message inside. At the end of the day, she handed the card to her bus driver.",
    questions: [
      ["What did Lena do first?", "folded yellow paper", ["folded yellow paper", "wrote the message", "handed over the card", "drew flowers"]],
      ["What happened right after she drew flowers?", "she wrote inside the card", ["she wrote inside the card", "she rode the bus home", "she folded the paper", "she bought paint"]],
      ["What was the final event?", "she gave the card to her bus driver", ["she gave the card to her bus driver", "she drew flowers", "she found yellow paper", "she sharpened a pencil"]],
      ["Which order best matches the passage?", "fold, draw, write, give", ["fold, draw, write, give", "write, give, fold, draw", "draw, fold, give, write", "give, write, draw, fold"]]
    ]
  },
  {
    passage: "At the class picnic, Marco spread a blanket under a tree. His friends set sandwiches and fruit in the middle. A breeze blew napkins across the grass, so everyone helped catch them. After eating, the group cleaned the area and played a quiet game.",
    questions: [
      ["What did Marco do before the food was set out?", "spread a blanket", ["spread a blanket", "caught napkins", "played a game", "cleaned the area"]],
      ["What happened after the food was placed down?", "napkins blew across the grass", ["napkins blew across the grass", "Marco packed the bus", "rain filled the cups", "students read indoors"]],
      ["What did the group do after eating?", "cleaned and played a game", ["cleaned and played a game", "spread the blanket", "dropped the sandwiches", "washed the tree"]],
      ["Which event came third?", "everyone caught the napkins", ["everyone caught the napkins", "Marco spread the blanket", "friends set out food", "the group played a game"]]
    ]
  },
  {
    passage: "The class built a simple bird feeder. First, they rinsed an empty carton. Next, they cut a small opening in one side. Then they filled the carton with seeds. Finally, they hung it from a branch outside the window.",
    questions: [
      ["What did the class do first?", "rinsed the carton", ["rinsed the carton", "hung the feeder", "filled it with seeds", "cut the opening"]],
      ["What happened after the opening was cut?", "the carton was filled with seeds", ["the carton was filled with seeds", "the carton was rinsed", "the feeder was hung", "the window was closed"]],
      ["What was the last step?", "hanging it from a branch", ["hanging it from a branch", "rinsing the carton", "cutting an opening", "finding seeds"]],
      ["Which sequence is correct?", "rinse, cut, fill, hang", ["rinse, cut, fill, hang", "fill, hang, rinse, cut", "cut, rinse, hang, fill", "hang, fill, cut, rinse"]]
    ]
  },
  {
    passage: "Before the play, Sam practiced his lines at home. The next morning, he carried his costume to school. After lunch, the class put chairs in rows for visitors. When families arrived, Sam stepped onto the stage and spoke clearly.",
    questions: [
      ["What did Sam do before bringing his costume?", "practiced at home", ["practiced at home", "set up chairs", "stood on stage", "greeted families"]],
      ["What happened after lunch?", "chairs were arranged", ["chairs were arranged", "Sam practiced at home", "families went home", "costumes were washed"]],
      ["What did Sam do when families arrived?", "performed on stage", ["performed on stage", "packed his costume", "moved chairs away", "ate lunch"]],
      ["Which event happened second?", "Sam carried his costume to school", ["Sam carried his costume to school", "Sam spoke on stage", "the class arranged chairs", "Sam practiced at home"]]
    ]
  },
  {
    passage: "A storm left puddles on the playground. The custodian put cones around the wet spots. Later, the sun came out and dried the blacktop. After the cones were removed, students lined up for recess and walked outside.",
    questions: [
      ["What happened first?", "puddles were left by a storm", ["puddles were left by a storm", "students went to recess", "cones were removed", "the blacktop dried"]],
      ["What did the custodian do after seeing wet spots?", "put cones around them", ["put cones around them", "painted new lines", "called the library", "filled the puddles with sand"]],
      ["What happened before students walked outside?", "the cones were removed", ["the cones were removed", "a new storm started", "students ate lunch", "the playground was locked"]],
      ["Which order fits the passage?", "storm, cones, sun, recess", ["storm, cones, sun, recess", "recess, sun, cones, storm", "cones, recess, storm, sun", "sun, storm, recess, cones"]]
    ]
  }
];

const mainIdeaPassages = [
  {
    passage: "Honeybees help many plants grow. As bees visit flowers, pollen sticks to their bodies. They carry pollen from one flower to another. This helps fruits and seeds form. Farmers often welcome bees because their crops depend on them.",
    questions: [
      ["What is the main idea?", "bees help plants make fruits and seeds", ["bees help plants make fruits and seeds", "bees only visit farms at night", "flowers do not need insects", "farmers keep bees away from crops"]],
      ["Which title fits best?", "How Bees Help Plants", ["How Bees Help Plants", "A Night in the Hive", "The Fastest Farm Machines", "Why Flowers Hide Pollen"]],
      ["What is the passage mostly about?", "the way bees support plant growth", ["the way bees support plant growth", "how to build a bee box", "why fruit tastes sweet", "how farmers sell honey"]],
      ["Which detail supports the main idea?", "bees move pollen between flowers", ["bees move pollen between flowers", "bees sleep in classrooms", "seeds are always blue", "farmers plant only one crop"]]
    ]
  },
  {
    passage: "Maps help people understand places. A map can show roads, rivers, parks, and buildings. Some maps use symbols so there is room for many details. People read the map key to learn what each symbol means. Without maps, finding a new place can take much longer.",
    questions: [
      ["What is the main idea?", "maps help people find and understand places", ["maps help people find and understand places", "all maps show only rivers", "symbols make maps impossible", "new places should not be visited"]],
      ["Which title fits best?", "Why Maps Are Useful", ["Why Maps Are Useful", "The Longest River", "A Park Without Roads", "Drawing Tiny Houses"]],
      ["What is this passage mostly teaching?", "how maps share information about places", ["how maps share information about places", "how to fold paper neatly", "why buildings need keys", "how to drive faster"]],
      ["Which sentence supports the main idea?", "a map can show roads and parks", ["a map can show roads and parks", "parks are always empty", "keys open doors", "rivers are hard to draw"]]
    ]
  },
  {
    passage: "Recycling gives some materials another use. Paper, cans, and bottles can be sorted instead of thrown away. Workers clean and process the materials. Later, factories can turn them into new products. Recycling helps reduce the amount of trash that fills landfills.",
    questions: [
      ["What is the main idea?", "recycling turns used materials into new things", ["recycling turns used materials into new things", "all trash belongs in landfills", "factories only make bottles", "paper cannot be sorted"]],
      ["Which title fits best?", "Giving Materials Another Use", ["Giving Materials Another Use", "A Factory Lunch", "The Biggest Trash Truck", "Sorting Toys at Home"]],
      ["What is the passage mostly about?", "why recycling is useful", ["why recycling is useful", "where to buy cans", "how bottles are shaped", "why workers need uniforms"]],
      ["Which detail supports the main idea?", "factories can make new products from sorted materials", ["factories can make new products from sorted materials", "landfills are playgrounds", "paper is always dirty", "cans cannot be cleaned"]]
    ]
  },
  {
    passage: "Libraries are more than shelves of books. Many libraries offer story times, computers, quiet workspaces, and help from librarians. People can learn new skills or research questions there. Some families visit every week because the library has resources they can share.",
    questions: [
      ["What is the main idea?", "libraries provide many helpful resources", ["libraries provide many helpful resources", "libraries only store old books", "computers do not belong indoors", "families cannot visit libraries"]],
      ["Which title fits best?", "What Libraries Offer", ["What Libraries Offer", "The Quietest Chair", "A Book on One Shelf", "Why Computers Sleep"]],
      ["What is the passage mostly about?", "different ways people use libraries", ["different ways people use libraries", "how to repair a shelf", "why stories are short", "how families drive home"]],
      ["Which detail supports the main idea?", "librarians help people research questions", ["librarians help people research questions", "shelves are made of wood", "every book is red", "families never share resources"]]
    ]
  },
  {
    passage: "Exercise helps the body stay strong. Running, jumping, swimming, and dancing all make the heart work harder. Moving each day can also help people sleep better. Children do not need fancy equipment to be active. Even a walk outside can be good exercise.",
    questions: [
      ["What is the main idea?", "daily movement is good for the body", ["daily movement is good for the body", "exercise only happens in pools", "sleep is not connected to movement", "children need expensive equipment"]],
      ["Which title fits best?", "Many Ways to Move", ["Many Ways to Move", "The Fancy Gym", "Sleeping Through Recess", "A Chair by the Pool"]],
      ["What is the passage mostly about?", "how exercise helps people", ["how exercise helps people", "why shoes have laces", "which dance is hardest", "where to buy jump ropes"]],
      ["Which detail supports the main idea?", "walking outside can be exercise", ["walking outside can be exercise", "equipment must be fancy", "hearts never work harder", "children should sit all day"]]
    ]
  }
];

const inferencePassages = [
  {
    passage: "Eli packed his folder slowly while the other students talked about the field trip. He looked at the permission slip still sitting on his desk. When the teacher reminded everyone that slips were due today, Eli put his head down. At lunch, he asked if he could call home. His voice was quiet.",
    questions: [
      ["What can you infer about Eli?", "he may not have a signed permission slip", ["he may not have a signed permission slip", "he dislikes all field trips", "he already went home", "he lost his lunch"]],
      ["Why did Eli ask to call home?", "to try to solve the permission slip problem", ["to try to solve the permission slip problem", "to order a new backpack", "to invite friends over", "to ask about dinner"]],
      ["How is Eli probably feeling?", "worried", ["worried", "silly", "bored with recess", "angry at the bus"]],
      ["Which clue best supports the inference?", "the slip was still on his desk", ["the slip was still on his desk", "students talked together", "lunch happened later", "the folder was packed"]]
    ]
  },
  {
    passage: "Tara placed the cracked birdhouse on the table. She found sandpaper, glue, and a small brush. Her grandpa smiled but did not touch the tools. Instead, he asked, 'What should you fix first?' Tara studied the loose roof and reached for the glue.",
    questions: [
      ["What can you infer about Grandpa?", "he wants Tara to learn by trying", ["he wants Tara to learn by trying", "he cannot see the birdhouse", "he dislikes birds", "he plans to throw it away"]],
      ["Why did Grandpa ask a question instead of fixing it?", "to guide Tara's thinking", ["to guide Tara's thinking", "to avoid the table", "to change the subject", "to make Tara stop"]],
      ["What will Tara probably do next?", "glue the loose roof", ["glue the loose roof", "paint the table", "buy a new brush", "feed the birds inside"]],
      ["Which clue shows Tara is solving the problem?", "she studied the loose roof", ["she studied the loose roof", "Grandpa smiled", "the brush was small", "the table was nearby"]]
    ]
  },
  {
    passage: "The gym grew quiet as the final runner came around the track. Jada's team was behind, and her legs felt heavy. She heard her classmates chanting her name. Jada took one deep breath and leaned forward. By the finish line, two runners were beside her instead of ahead of her.",
    questions: [
      ["What can you infer about Jada?", "she pushed herself to run faster", ["she pushed herself to run faster", "she stopped before the finish", "she forgot her team", "she was walking home"]],
      ["How did the chanting probably affect Jada?", "it encouraged her", ["it encouraged her", "it made the track wet", "it ended the race", "it confused the runners"]],
      ["What likely happened near the finish?", "Jada caught up to other runners", ["Jada caught up to other runners", "the race was canceled", "the gym lights went out", "her team left"]],
      ["Which clue supports the inference?", "two runners were beside her instead of ahead", ["two runners were beside her instead of ahead", "the gym grew quiet", "her legs felt heavy", "the track was round"]]
    ]
  },
  {
    passage: "At the bake sale, Noah kept looking at the last blueberry muffin. He had enough coins for one treat, but his little sister had dropped her cookie on the ground. Noah sighed, picked up the muffin, and handed it to her. She smiled with crumbs still on her shirt.",
    questions: [
      ["What can you infer about Noah?", "he chose to be kind to his sister", ["he chose to be kind to his sister", "he does not like muffins", "he lost all his coins", "he wanted to leave school"]],
      ["Why did Noah sigh?", "he wanted the muffin but gave it away", ["he wanted the muffin but gave it away", "he was too tired to stand", "the sale was closed", "his shirt was dirty"]],
      ["How did the sister likely feel?", "grateful", ["grateful", "sleepy", "confused by coins", "angry about blueberries"]],
      ["Which clue shows Noah made a sacrifice?", "he kept looking at the last muffin", ["he kept looking at the last muffin", "the cookie fell", "crumbs were on a shirt", "the sale had treats"]]
    ]
  },
  {
    passage: "The class hamster was missing from its cage. Papers near the reading corner had tiny bite marks. A trail of sunflower seeds led behind the bookshelf. Ms. Chen asked everyone to stay still. Luis pointed to a soft scratching sound near the wall.",
    questions: [
      ["What can you infer about the hamster?", "it is probably behind the bookshelf", ["it is probably behind the bookshelf", "it went outside for recess", "it ate every paper", "it is sleeping in the cage"]],
      ["Why did Ms. Chen ask students to stay still?", "so the hamster would not be scared or stepped on", ["so the hamster would not be scared or stepped on", "so lunch could begin", "so papers would dry", "so the bookshelf could move itself"]],
      ["What clue helped Luis?", "a scratching sound", ["a scratching sound", "a sunny window", "a closed notebook", "a clean cage"]],
      ["What probably happened before the passage began?", "the hamster got out of its cage", ["the hamster got out of its cage", "Luis fed a dog", "the class went to the gym", "Ms. Chen painted the wall"]]
    ]
  }
];

const causeEffectPassages = [
  {
    passage: "A heavy rain fell during the night. By morning, the soccer field was muddy and slick. The coach did not want anyone to slip, so practice moved to the gym. The team worked on passing drills instead of playing outside.",
    questions: [
      ["Why did practice move indoors?", "the field was unsafe after rain", ["the field was unsafe after rain", "the team forgot the ball", "the gym was muddy", "the coach disliked passing"]],
      ["What was one effect of the heavy rain?", "the soccer field became slick", ["the soccer field became slick", "the gym closed", "the team went home early", "the ball disappeared"]],
      ["Why did the team do passing drills?", "they practiced inside the gym", ["they practiced inside the gym", "they had no coach", "they were waiting for snow", "they finished the season"]],
      ["Which cause led to the schedule change?", "rain made the field muddy", ["rain made the field muddy", "students packed lunches", "a whistle was loud", "the team wore shoes"]]
    ]
  },
  {
    passage: "Mina forgot to tighten the lid on her water bottle. When she reached into her backpack, her reading log was damp. She told her teacher what happened. The teacher gave her a fresh page, and Mina copied her notes carefully.",
    questions: [
      ["What caused the reading log to get wet?", "the water bottle lid was loose", ["the water bottle lid was loose", "rain came through the roof", "the teacher spilled paint", "Mina washed the page"]],
      ["What happened because the log was damp?", "Mina received a fresh page", ["Mina received a fresh page", "the class went outside", "the backpack broke", "the bottle became empty forever"]],
      ["Why did Mina copy her notes?", "her original page was damaged", ["her original page was damaged", "she wanted extra homework", "the teacher lost a pencil", "her book had pictures"]],
      ["Which event was an effect?", "the reading log became damp", ["the reading log became damp", "the lid was loose", "Mina had a backpack", "the bottle had water"]]
    ]
  },
  {
    passage: "The town opened a new bike lane near the school. More students began riding bikes in the morning. Because the sidewalk was less crowded, walkers had more room. The principal reminded everyone to cross only at the painted lines.",
    questions: [
      ["What happened after the bike lane opened?", "more students rode bikes", ["more students rode bikes", "the school closed", "walkers lost the sidewalk", "cars parked in classrooms"]],
      ["Why did walkers have more room?", "bike riders used the new lane", ["bike riders used the new lane", "the sidewalk got smaller", "the principal banned walking", "students stayed home"]],
      ["What caused the principal to give a reminder?", "more travel near school needed safety rules", ["more travel near school needed safety rules", "students forgot lunch", "the painted lines vanished", "bikes were not allowed"]],
      ["Which cause-effect pair is correct?", "bike lane opened, sidewalk became less crowded", ["bike lane opened, sidewalk became less crowded", "sidewalk shrank, bikes disappeared", "school closed, students rode bikes", "painted lines moved, students stayed home"]]
    ]
  },
  {
    passage: "The class fish tank sat near a sunny window. Green algae began growing on the glass. The water looked cloudy, and the fish were harder to see. After the tank was moved to a shadier shelf, the water stayed clearer.",
    questions: [
      ["What caused algae to grow?", "sunlight reached the tank", ["sunlight reached the tank", "the fish read books", "the shelf was too shady", "the water was frozen"]],
      ["What happened because algae grew?", "the water looked cloudy", ["the water looked cloudy", "the fish left school", "the window opened", "the glass turned into paper"]],
      ["Why was the tank moved?", "to keep the water clearer", ["to keep the water clearer", "to make the fish louder", "to block the door", "to hide the shelf"]],
      ["What was the effect of moving the tank?", "the water stayed clearer", ["the water stayed clearer", "more algae grew quickly", "the fish tank broke", "sunlight got stronger"]]
    ]
  },
  {
    passage: "Ravi practiced his spelling words for ten minutes each night. At first, he missed several words on the practice quiz. By Friday, he recognized patterns in the tricky words. On the final quiz, he spelled almost every word correctly.",
    questions: [
      ["What helped Ravi improve?", "short practice each night", ["short practice each night", "skipping the quiz", "hiding the word list", "changing every word"]],
      ["What was one effect of practicing?", "he noticed word patterns", ["he noticed word patterns", "he forgot the list", "the quiz disappeared", "Friday came earlier"]],
      ["Why did Ravi do better on the final quiz?", "practice helped him learn the words", ["practice helped him learn the words", "the words became pictures", "the teacher removed the hard words", "he stopped reading"]],
      ["Which cause-effect pair is correct?", "regular practice led to better spelling", ["regular practice led to better spelling", "missing words led to no school", "Friday caused spelling patterns", "the quiz made nights longer"]]
    ]
  }
];

const contextCluesPassages = [
  {
    passage: "The trail was damp after the rain, so Ava walked with caution. She stepped slowly over roots and tested each rock before putting her full weight on it. Her brother hurried ahead and nearly slipped. Ava's careful steps helped her stay steady.",
    word: "caution",
    questions: [
      ["What does caution mean in the passage?", "careful attention", ["careful attention", "loud excitement", "quick guessing", "angry shouting"]],
      ["Which clue helps explain caution?", "she stepped slowly over roots", ["she stepped slowly over roots", "the trail was outside", "her brother walked too", "rain had already fallen"]],
      ["Why did Ava use caution?", "the trail could be slippery", ["the trail could be slippery", "she wanted to race", "the rocks were toys", "her brother was reading"]],
      ["Which word is closest in meaning to caution?", "carefulness", ["carefulness", "speed", "noise", "hunger"]]
    ]
  },
  {
    passage: "The museum guide asked the group to observe the fossil before speaking. Students leaned close and noticed tiny lines, a curved edge, and bits of shell pressed into stone. After a full minute, they shared what they had seen. Their careful looking helped them make better guesses.",
    word: "observe",
    questions: [
      ["What does observe mean in the passage?", "look closely", ["look closely", "walk away", "talk loudly", "cover up"]],
      ["Which clue helps explain observe?", "students noticed tiny lines and a curved edge", ["students noticed tiny lines and a curved edge", "the guide asked a question", "the fossil was in a museum", "the group had students"]],
      ["Why did the guide ask them to observe first?", "careful looking would help their thinking", ["careful looking would help their thinking", "the fossil was too heavy", "the group needed lunch", "the stone was new"]],
      ["Which word is closest in meaning to observe?", "examine", ["examine", "ignore", "carry", "decorate"]]
    ]
  },
  {
    passage: "When the class heard thunder, the picnic plans were postponed. The lunches stayed packed in the cooler, and the students returned to their classroom. Their teacher said they would try again the next sunny day. No one unpacked the blanket because the picnic was only delayed.",
    word: "postponed",
    questions: [
      ["What does postponed mean in the passage?", "moved to a later time", ["moved to a later time", "finished early", "made louder", "thrown away"]],
      ["Which clue helps explain postponed?", "they would try again the next sunny day", ["they would try again the next sunny day", "lunches were in a cooler", "the class heard thunder", "the blanket was packed"]],
      ["Why was the picnic postponed?", "thunder made outdoor plans unsafe", ["thunder made outdoor plans unsafe", "the food was too cold", "the blanket was missing", "the classroom was locked"]],
      ["Which word is closest in meaning to postponed?", "delayed", ["delayed", "started", "painted", "forgotten"]]
    ]
  },
  {
    passage: "The old wagon was sturdy enough to carry the garden tools. Its paint was scratched, but the wheels rolled smoothly and the wooden sides did not bend. Even when Mr. Lee added heavy bags of soil, the wagon stayed strong. The class used it all morning.",
    word: "sturdy",
    questions: [
      ["What does sturdy mean in the passage?", "strong and not easily broken", ["strong and not easily broken", "brightly colored", "too small to use", "new and shiny"]],
      ["Which clue helps explain sturdy?", "it carried heavy bags of soil", ["it carried heavy bags of soil", "the paint was scratched", "the class gardened", "the morning was long"]],
      ["Why was the wagon useful?", "it could hold heavy tools and soil", ["it could hold heavy tools and soil", "it had perfect paint", "it was kept indoors", "it made soil lighter"]],
      ["Which word is closest in meaning to sturdy?", "durable", ["durable", "fragile", "tiny", "empty"]]
    ]
  },
  {
    passage: "The directions were brief, but they were enough for Sam to begin. The paper said, 'Fold the corners. Add glue. Press flat.' Sam did not need a long explanation. The short instructions helped him finish the paper frame quickly.",
    word: "brief",
    questions: [
      ["What does brief mean in the passage?", "short", ["short", "confusing", "colorful", "late"]],
      ["Which clue helps explain brief?", "Sam did not need a long explanation", ["Sam did not need a long explanation", "he used glue", "the frame was paper", "the corners folded"]],
      ["Why could Sam begin easily?", "the short directions were clear enough", ["the short directions were clear enough", "the paper was blank", "the glue was heavy", "the explanation was missing"]],
      ["Which word is closest in meaning to brief?", "quick", ["quick", "endless", "bumpy", "hidden"]]
    ]
  }
];

const themePassages = [
  {
    passage: "Nina wanted the tallest block tower in the room. She grabbed blocks from the shared bin before others could choose. Soon her tower leaned, and she needed help holding it steady. Her classmates helped after she returned some blocks and asked kindly. Together they built a tower that stood longer than Nina's first one.",
    questions: [
      ["What lesson does the story teach?", "sharing and teamwork can lead to better results", ["sharing and teamwork can lead to better results", "grabbing first is always best", "tall towers never fall", "blocks should stay in boxes"]],
      ["Which choice states the theme?", "cooperation is stronger than selfishness", ["cooperation is stronger than selfishness", "blocks are only for one person", "asking for help is never useful", "classrooms need taller shelves"]],
      ["What did Nina learn?", "working with others helped her succeed", ["working with others helped her succeed", "she should hide the blocks", "short towers are not allowed", "classmates do not like building"]],
      ["Which detail supports the theme?", "the shared tower stood longer", ["the shared tower stood longer", "the bin held blocks", "the room had classmates", "Nina wanted a tower"]]
    ]
  },
  {
    passage: "Luis found a pencil case on the playground. A new eraser and bright markers were inside. He wanted to keep the markers, but he remembered how upset he felt when he lost his lunchbox. Luis brought the case to the office. Later, a younger student smiled when it was returned.",
    questions: [
      ["What lesson does the story teach?", "doing the honest thing helps others", ["doing the honest thing helps others", "lost things should be hidden", "markers are better than erasers", "playgrounds are only for pencils"]],
      ["Which choice states the theme?", "honesty matters even when something is tempting", ["honesty matters even when something is tempting", "bright markers are hard to use", "offices should keep lunchboxes", "younger students never lose things"]],
      ["Why did Luis return the case?", "he knew losing something feels bad", ["he knew losing something feels bad", "he disliked markers", "the playground was closing", "the eraser was old"]],
      ["Which detail supports the theme?", "Luis took the case to the office", ["Luis took the case to the office", "the markers were bright", "the pencil case was on the playground", "a lunchbox was mentioned"]]
    ]
  },
  {
    passage: "Maya tried to learn a new song on the recorder. The first notes squeaked, and she almost put the recorder away. Her music teacher told her to practice one small part at a time. Maya played the same line each day. By Friday, the song sounded smooth enough to share.",
    questions: [
      ["What lesson does the story teach?", "practice can turn frustration into progress", ["practice can turn frustration into progress", "new songs should be avoided", "squeaky notes are always best", "Fridays make music easier"]],
      ["Which choice states the theme?", "keep trying when a skill feels hard", ["keep trying when a skill feels hard", "put instruments away quickly", "teachers should play every song", "music only works on Fridays"]],
      ["What helped Maya improve?", "practicing a small part each day", ["practicing a small part each day", "hiding the recorder", "waiting without playing", "changing instruments"]],
      ["Which detail supports the theme?", "the song sounded smoother by Friday", ["the song sounded smoother by Friday", "the recorder made notes", "the teacher spoke", "Maya had a song"]]
    ]
  },
  {
    passage: "At recess, Jamal saw a classmate sitting alone near the fence. His friends were starting a game, and they called for him to hurry. Jamal paused, then invited the classmate to join. The game started a minute later, but everyone had a turn and laughed together.",
    questions: [
      ["What lesson does the story teach?", "including others can make a group happier", ["including others can make a group happier", "games must start immediately", "fences are good seats", "friends should ignore classmates"]],
      ["Which choice states the theme?", "kindness is worth a small wait", ["kindness is worth a small wait", "recess should be silent", "games need fewer players", "laughing stops a game"]],
      ["Why did Jamal pause?", "he noticed someone was left out", ["he noticed someone was left out", "he forgot the rules", "he wanted to sit by the fence", "his friends went inside"]],
      ["Which detail supports the theme?", "everyone had a turn after the invitation", ["everyone had a turn after the invitation", "friends called to Jamal", "the fence was nearby", "recess had a game"]]
    ]
  },
  {
    passage: "Sofia was nervous about reading her poem aloud. Her hands shook as she walked to the front of the room. She took a breath and read the first line. A few classmates nodded, so she kept going. When she finished, Sofia felt proud that she had tried.",
    questions: [
      ["What lesson does the story teach?", "courage means trying even when nervous", ["courage means trying even when nervous", "poems should stay unread", "nodding makes people nervous", "classrooms should be quiet forever"]],
      ["Which choice states the theme?", "bravery can start with one small step", ["bravery can start with one small step", "reading aloud is only for confident readers", "hands shake because poems are long", "pride means never feeling afraid"]],
      ["What did Sofia learn?", "she could face a difficult moment", ["she could face a difficult moment", "she should avoid poems", "classmates never listen", "reading is only for teachers"]],
      ["Which detail supports the theme?", "Sofia kept reading after the first line", ["Sofia kept reading after the first line", "her hands shook", "the room had classmates", "the poem was aloud"]]
    ]
  }
];

function expandSet(prefix, skill, sets) {
  return sets.flatMap((set, setIndex) =>
    set.questions.map(([question, answer, choices], questionIndex) =>
      makeQuestion({
        id: `${prefix}_${setIndex + 1}_${questionIndex + 1}`,
        skill,
        passage: set.passage,
        question,
        answer,
        choices
      })
    )
  );
}

export const templateComprehensionAdvanced = [
  ...expandSet("adv_key_details", "key details", keyDetailsPassages),
  ...expandSet("adv_sequencing", "sequencing", sequencingPassages),
  ...expandSet("adv_main_idea", "main idea", mainIdeaPassages),
  ...expandSet("adv_inference", "inference", inferencePassages),
  ...expandSet("adv_cause_effect", "cause and effect", causeEffectPassages),
  ...expandSet("adv_context_clues", "context clues", contextCluesPassages),
  ...expandSet("adv_theme", "theme", themePassages)
];
