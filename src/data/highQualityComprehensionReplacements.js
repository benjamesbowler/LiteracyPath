const SOURCE = "high_quality_comprehension_replacement_2026_06";

const keyDetailSeeds = [
  {
    level: 1,
    image: "flowerpot",
    passage: "Maya planted sunflower seeds in a small pot. She wrote her name on a paper label and pushed it into the soil. After watering the pot, she placed it on the sunny classroom window ledge. On Friday, a tiny green shoot appeared.",
    question: "Where did Maya place the pot?",
    answer: "on the sunny classroom window ledge",
    choices: ["on the sunny classroom window ledge", "under her desk", "beside the lunch trays", "inside her backpack"]
  },
  {
    level: 1,
    image: "bookcase",
    passage: "Owen wanted a book about storms for his weather project. He looked on the science shelf but could not find one. The librarian showed him a basket of weather books near the window. Owen chose a book with photographs of lightning.",
    question: "What kind of book did Owen choose?",
    answer: "a book with photographs of lightning",
    choices: ["a book with photographs of lightning", "a book of animal jokes", "a cookbook about soup", "a story about a lost puppy"]
  },
  {
    level: 1,
    image: "basketball",
    passage: "The playground ball rolled under the bench during recess. Ava saw it before anyone stepped on it. She picked it up and gave it to Coach Lee. Coach Lee put the ball back in the equipment basket.",
    question: "Who did Ava give the ball to?",
    answer: "Coach Lee",
    choices: ["Coach Lee", "her brother", "the librarian", "a bus driver"]
  },
  {
    level: 1,
    image: "paint",
    passage: "Leo painted a red fire truck during art class. His wide brush made the ladder look messy. Ms. Chen gave him a thinner brush from the art box. Leo used the new brush to paint neat silver ladder lines.",
    question: "What did Leo paint with the thinner brush?",
    answer: "neat silver ladder lines",
    choices: ["neat silver ladder lines", "green tree leaves", "large black wheels", "a yellow sun"]
  },
  {
    level: 1,
    image: "beach",
    passage: "Jonah walked on the beach with his aunt. They collected empty shells for a science tray. One shell had a tiny crab tucked inside it. Jonah left that shell on the sand and chose three empty shells instead.",
    question: "Why did Jonah leave one shell on the sand?",
    answer: "a tiny crab was inside it",
    choices: ["a tiny crab was inside it", "it was too heavy to carry", "it belonged to a shop", "it was painted blue"]
  },
  {
    level: 1,
    image: "bread",
    passage: "Arlo carried warm rolls from the bakery counter. The paper bag tore before he reached the door. Two rolls slipped onto a clean tray near the counter. Baker Tom gave Arlo a stronger bag.",
    question: "What happened to Arlo's first bag?",
    answer: "it tore",
    choices: ["it tore", "it turned blue", "it was empty", "it fell into water"]
  },
  {
    level: 1,
    image: "bike",
    passage: "Nina rode her bike along the park path. A loose chain made the pedals stop turning. She walked the bike to a repair bench near the gate. Her dad fixed the chain with a small tool.",
    question: "Why did Nina stop riding?",
    answer: "the bike chain was loose",
    choices: ["the bike chain was loose", "the path was closed", "the bell was too loud", "the tire was purple"]
  },
  {
    level: 1,
    image: "cloud",
    passage: "Ruby watched dark clouds gather over the field. Her class had planned to eat lunch outside. Miss Green heard thunder in the distance. She moved everyone into the hall before the rain began.",
    question: "Where did Miss Green move the class?",
    answer: "into the hall",
    choices: ["into the hall", "onto the field", "behind the shed", "beside the road"]
  },
  {
    level: 1,
    image: "squirrel",
    passage: "Eli saw a small squirrel near the park bench. It held an acorn and stayed very still. Park Ranger Kim asked the children to step back quietly. After a minute, the squirrel ran up the tree.",
    question: "What did the squirrel hold?",
    answer: "an acorn",
    choices: ["an acorn", "a sandwich", "a blue ribbon", "a pencil"]
  },
  {
    level: 1,
    image: "clock",
    passage: "Nora was in charge of the class calendar. She crossed off Monday after morning meeting. Then she circled Friday because the class trip was on Friday. Several students asked how many days were left.",
    question: "Which day did Nora circle?",
    answer: "Friday",
    choices: ["Friday", "Monday", "Sunday", "Tuesday"]
  },
  {
    level: 1,
    image: "bread",
    passage: "Lucas helped unpack groceries after school. The eggs were in a carton at the top of the bag. Lucas lifted them out first so they would not crack. Then he put the heavier cans on the shelf.",
    question: "Why did Lucas lift out the eggs first?",
    answer: "so they would not crack",
    choices: ["so they would not crack", "so the cans would freeze", "so the shelf would move", "so the bag would turn blue"]
  },
  {
    level: 1,
    image: "beach",
    passage: "Priya made a poster about sea turtles. She wrote the title at the top in large letters. Then she drew a turtle crawling toward the water. Her teacher asked her to label the beach and the ocean.",
    question: "What did Priya draw on the poster?",
    answer: "a turtle crawling toward the water",
    choices: ["a turtle crawling toward the water", "a chair with a cracked leg", "a bike beside a gate", "a bowl of soup"]
  },
  {
    level: 1,
    image: "crayon",
    passage: "Finn helped his neighbor carry books to a little free library. The shelf was almost full. Finn placed the small books upright and stacked the large books on the bottom. Then there was room for the whole pile.",
    question: "Where did Finn put the large books?",
    answer: "on the bottom",
    choices: ["on the bottom", "beside the sink", "in his lunch box", "under the rug"]
  },
  {
    level: 1,
    image: "basketball",
    passage: "Mara helped set out cups for the school picnic. She counted twenty students but placed only eighteen cups. Her friend noticed the mistake before lunch began. Mara added two more cups to the table.",
    question: "How many more cups did Mara add?",
    answer: "two",
    choices: ["two", "eight", "twenty", "three"]
  },
  {
    level: 1,
    image: "firetruck",
    passage: "Sienna visited the fire station with her class. A firefighter showed them a heavy jacket and helmet. Sienna tried to lift the jacket with both hands. She was surprised because it weighed more than her school bag.",
    question: "What surprised Sienna about the jacket?",
    answer: "it was very heavy",
    choices: ["it was very heavy", "it was made of paper", "it had no sleeves", "it was kept in a lunch box"]
  },
  {
    level: 1,
    image: "meadow",
    passage: "Miles helped his grandad rake leaves. The wind blew leaves back across the path. Grandad held the bag open while Miles pushed the leaves inside. They tied the bag before the wind could scatter them again.",
    question: "Who held the bag open?",
    answer: "Grandad",
    choices: ["Grandad", "the teacher", "the bus driver", "Miles"]
  },
  {
    level: 1,
    image: "shelf",
    passage: "Jalen helped clean the lunch tables. He sprayed the first table and wiped it with a blue cloth. A sticky spot was still there, so he wiped it again. When the spot was gone, he moved to the next table.",
    question: "What did Jalen use to wipe the table?",
    answer: "a blue cloth",
    choices: ["a blue cloth", "a red sponge", "a paper plate", "a green brush"]
  },
  {
    level: 1,
    image: "butter",
    passage: "Sam made toast before school. He spread butter on one slice and jam on the other. His sister asked for the slice with jam. Sam gave her the jam slice and ate the buttered toast himself.",
    question: "Which slice did Sam's sister ask for?",
    answer: "the slice with jam",
    choices: ["the slice with jam", "the slice with cheese", "the plain slice", "the burnt slice"]
  },
  {
    level: 1,
    image: "whistle",
    passage: "The class lined up for a relay race. Coach Ana held a whistle and a clipboard. When she blew the whistle, the first runners started. She marked each team's time on the clipboard.",
    question: "What did Coach Ana mark on the clipboard?",
    answer: "each team's time",
    choices: ["each team's time", "the lunch menu", "the weather report", "the bus number"]
  },
  {
    level: 1,
    image: "pencilbox",
    passage: "Grace opened her pencil box during writing time. Her red pencil was missing, but a blue pencil was still inside. She borrowed a red pencil from Noah. At the end of class, she returned it to him.",
    question: "Who lent Grace a red pencil?",
    answer: "Noah",
    choices: ["Noah", "her teacher", "Maya", "the librarian"]
  },
  {
    level: 1,
    image: "raincoat",
    passage: "It started raining while Kira walked to school. She pulled up the hood on her yellow raincoat. Her notebook stayed dry inside her backpack. When she reached class, she hung the wet coat by the door.",
    question: "What color was Kira's raincoat?",
    answer: "yellow",
    choices: ["yellow", "green", "red", "blue"]
  },
  {
    level: 1,
    image: "road",
    passage: "Dylan studied a map before the museum trip. He found the dinosaur room beside the stairs. He showed the map to his partner on the bus. When they arrived, they walked straight to the dinosaur room.",
    question: "Where was the dinosaur room on the map?",
    answer: "beside the stairs",
    choices: ["beside the stairs", "under the cafe", "inside the shop", "behind the bus stop"]
  },
  {
    level: 1,
    image: "shark",
    passage: "The aquarium guide pointed to a shark tooth in a glass case. It was much wider than Liam's thumb. Liam sketched the tooth in his notebook. He wrote that sharks grow many teeth during their lives.",
    question: "What did Liam sketch?",
    answer: "a shark tooth",
    choices: ["a shark tooth", "a turtle shell", "a small fish", "a glass case"]
  },
  {
    level: 1,
    image: "wind",
    passage: "Ava flew a kite at the park after lunch. The string tangled around a low branch. Her uncle gently pulled the branch down while Ava loosened the string. The kite flew again when the wind came back.",
    question: "What did the kite string tangle around?",
    answer: "a low branch",
    choices: ["a low branch", "a bike wheel", "a picnic basket", "a park gate"]
  },
  {
    level: 1,
    image: "scissors",
    passage: "The art table needed more paper strips. Jun folded a purple sheet and cut along the crease. He placed the strips in a tray for the group. The class used them to make paper chains.",
    question: "What color paper did Jun cut?",
    answer: "purple",
    choices: ["purple", "orange", "white", "brown"]
  },
  {
    level: 1,
    image: "shelf",
    passage: "Hana sorted classroom games after indoor recess. She put puzzles on the top shelf and card games in the red bin. One puzzle box was open, so she checked that every piece was inside. Then she closed the lid.",
    question: "Where did Hana put the card games?",
    answer: "in the red bin",
    choices: ["in the red bin", "on the top shelf", "under the rug", "beside the door"]
  },
  {
    level: 1,
    image: "snow",
    passage: "Fresh snow covered the school steps in the morning. Mr. Patel sprinkled salt on the steps before students arrived. The salt helped melt the icy patches. By bell time, the steps were safer to use.",
    question: "What did Mr. Patel sprinkle on the steps?",
    answer: "salt",
    choices: ["salt", "sandwich crumbs", "paint", "flower seeds"]
  },
  {
    level: 1,
    image: "beachball",
    passage: "At the family picnic, Rosa brought a beach ball. A gust of wind pushed it toward the pond. Her cousin caught it before it reached the water. Rosa thanked him and put the ball under the picnic blanket.",
    question: "Who caught the beach ball?",
    answer: "Rosa's cousin",
    choices: ["Rosa's cousin", "her teacher", "a park ranger", "her neighbor"]
  },
  {
    level: 1,
    image: "toolbox",
    passage: "Dad opened the toolbox to fix a loose chair leg. He chose a small wrench and tightened the bolt. Maya held the chair still while he worked. The chair stopped wobbling when the bolt was tight.",
    question: "What tool did Dad choose?",
    answer: "a small wrench",
    choices: ["a small wrench", "a paint roller", "a garden rake", "a sewing needle"]
  },
  {
    level: 1,
    image: "heron",
    passage: "Lila watched a robin land on the fence. The bird carried dry grass in its beak. It flew to a nest hidden in the hedge. Lila stayed quiet so the robin would not be frightened.",
    question: "What did the robin carry?",
    answer: "dry grass",
    choices: ["dry grass", "a red berry", "a shiny coin", "a blue ribbon"]
  },
  {
    level: 2,
    image: "river",
    passage: "Marcus joined his class for a river study. The teacher gave each group a clear jar and a label. Marcus filled his jar where the water moved slowly near the reeds. Back at school, his group compared the river water with tap water.",
    question: "Where did Marcus fill his jar?",
    answer: "where the water moved slowly near the reeds",
    choices: ["where the water moved slowly near the reeds", "inside the school sink", "under a playground slide", "beside the lunchroom door"]
  },
  {
    level: 2,
    image: "bread",
    passage: "Before the bakery opened, Talia helped stack trays of rolls. One tray held plain rolls, and another held rolls with seeds on top. Baker Tom asked her to put the seeded rolls near the front counter. Customers usually bought those first.",
    question: "Which rolls did Talia put near the front counter?",
    answer: "the rolls with seeds on top",
    choices: ["the rolls with seeds on top", "the plain rolls", "the burnt rolls", "the rolls in a paper bag"]
  },
  {
    level: 2,
    image: "soil",
    passage: "The school garden club checked the vegetable beds after a hot weekend. The lettuce leaves looked limp, but the tomato plants were still strong. Mr. Hayes asked the students to water the lettuce first. Then they wrote the change in the garden notebook.",
    question: "Which plants did the students water first?",
    answer: "the lettuce",
    choices: ["the lettuce", "the tomato plants", "the apple tree", "the flower pots"]
  },
  {
    level: 2,
    image: "bookcase",
    passage: "During reading time, Amira found a bookmark on the floor near the mystery shelf. The bookmark had Daniel's name written in blue ink. Amira gave it to the librarian instead of keeping it. The librarian placed it in Daniel's book box.",
    question: "Whose name was on the bookmark?",
    answer: "Daniel's",
    choices: ["Daniel's", "Amira's", "the librarian's", "Ms. Chen's"]
  },
  {
    level: 2,
    image: "bridge",
    passage: "Noah crossed the old stone bridge with his uncle. Halfway across, they saw a loose board beside the railing. His uncle called the park office from his phone. A worker arrived and closed that side of the bridge.",
    question: "What did Noah and his uncle notice on the bridge?",
    answer: "a loose board",
    choices: ["a loose board", "a sleeping dog", "a red backpack", "a painted sign"]
  },
  {
    level: 2,
    image: "firetruck",
    passage: "The firefighters showed the class how they prepare for a call. First, they checked the oxygen tanks on the truck. Then one firefighter clipped a radio to her jacket. She explained that the radio helped the team hear directions.",
    question: "What did the firefighter clip to her jacket?",
    answer: "a radio",
    choices: ["a radio", "a lunch pass", "a toy badge", "a map of the zoo"]
  },
  {
    level: 2,
    image: "meadow",
    passage: "On the meadow walk, Chloe carried a small field guide. She saw yellow butterflies landing on purple flowers. Her partner counted five butterflies before they flew away. Chloe wrote the number beside a quick drawing in her guide.",
    question: "How many butterflies did Chloe's partner count?",
    answer: "five",
    choices: ["five", "two", "nine", "twelve"]
  },
  {
    level: 2,
    image: "road",
    passage: "Ethan waited at the station with his grandmother. Their train was late because workers were checking the track. A message on the screen said the train would arrive at ten thirty. Ethan read the time aloud so his grandmother could hear it.",
    question: "What time did the screen say the train would arrive?",
    answer: "ten thirty",
    choices: ["ten thirty", "nine fifteen", "eleven forty", "eight o'clock"]
  },
  {
    level: 2,
    image: "piano",
    passage: "Sofia practiced piano before the school concert. She kept missing the last note of the song. Her teacher asked her to play the final line slowly three times. After that, Sofia played the ending without stopping.",
    question: "Which part of the song was difficult for Sofia?",
    answer: "the last note",
    choices: ["the last note", "the first word", "the middle drumbeat", "the title"]
  },
  {
    level: 2,
    image: "trash",
    passage: "The class cleaned the playground after the spring fair. Mateo found paper cups near the fence and plastic spoons under a table. He put the cups in the recycling bag. The spoons went into the trash bag because they were dirty.",
    question: "What did Mateo put in the recycling bag?",
    answer: "paper cups",
    choices: ["paper cups", "plastic spoons", "muddy shoes", "wooden blocks"]
  },
  {
    level: 2,
    image: "beach",
    passage: "Mia's family visited a lighthouse by the sea. They climbed many narrow steps to reach the top. The guide said the light flashes every four seconds to warn ships. Mia watched the bright beam sweep across the water.",
    question: "How often does the lighthouse light flash?",
    answer: "every four seconds",
    choices: ["every four seconds", "once each hour", "every ten minutes", "twice each morning"]
  },
  {
    level: 2,
    image: "lizard",
    passage: "The science class watched tadpoles in a tank. At first, the tadpoles had tails and no legs. By the next month, tiny back legs had grown. The class drew the change in their science journals.",
    question: "What change did the class notice by the next month?",
    answer: "tiny back legs had grown",
    choices: ["tiny back legs had grown", "the tank turned red", "the tadpoles grew feathers", "the water froze"]
  },
  {
    level: 2,
    image: "bookcase",
    passage: "The library posted new rules near the checkout desk. Students could borrow two books at a time. Books had to be returned after two weeks. Lena read the sign before choosing a mystery book and a comic.",
    question: "How many books could students borrow at a time?",
    answer: "two",
    choices: ["two", "five", "ten", "one"]
  },
  {
    level: 2,
    image: "cloud",
    passage: "Jasper learned about clouds during science. His teacher said clouds are made of tiny drops of water. When the drops join and become heavy, rain falls. Jasper drew raindrops under a gray cloud in his notebook.",
    question: "What are clouds made of?",
    answer: "tiny drops of water",
    choices: ["tiny drops of water", "pieces of cotton", "white dust", "cold smoke"]
  },
  {
    level: 2,
    image: "road",
    passage: "Rosa packed her bag before visiting her cousin in the city. She put a blue sweater, a book, and a snack inside. Her mother checked the bus time on her phone. They left home early so they would not miss the bus.",
    question: "Who was Rosa going to visit?",
    answer: "her cousin",
    choices: ["her cousin", "her coach", "the dentist", "her teacher"]
  },
  {
    level: 2,
    image: "ice",
    passage: "In science, Kian watched water freeze in a small tray. The tray went into the freezer after lunch. By the end of the day, the liquid water had become solid ice. Kian touched one cube and said it felt cold and hard.",
    question: "What did the water become?",
    answer: "solid ice",
    choices: ["solid ice", "warm steam", "soft clay", "dry sand"]
  },
  {
    level: 2,
    image: "grasshopper",
    passage: "The class read about ants underground. Worker ants dig tunnels and carry food back to the colony. The queen ant stays protected and lays eggs. On the diagram, Jay circled the chamber where the queen stayed.",
    question: "What does the queen ant do?",
    answer: "lays eggs",
    choices: ["lays eggs", "drives a truck", "builds a bird nest", "paints the tunnel"]
  },
  {
    level: 2,
    image: "river",
    passage: "Oliver went fishing with his grandad on Sunday morning. His grandad reminded him to sit quietly and watch the float. After a long wait, the float dipped under the water. Oliver pulled up his first small fish.",
    question: "When did Oliver go fishing?",
    answer: "Sunday morning",
    choices: ["Sunday morning", "Monday night", "Friday afternoon", "Wednesday lunch"]
  },
  {
    level: 2,
    image: "nightstand",
    passage: "The class studied the moon after reading a space book. Ms. Rivera explained that the moon does not make its own light. It reflects light from the sun. The students drew arrows from the sun to the moon.",
    question: "Where does the moon's light come from?",
    answer: "the sun",
    choices: ["the sun", "the ocean", "a streetlamp", "the clouds"]
  },
  {
    level: 2,
    image: "bread",
    passage: "Ella baked cookies for her class on Saturday. She mixed chocolate chips into the dough and placed twelve cookies on a tray. After they cooled, she added white icing stripes. On Monday, she carried the cookies to school.",
    question: "How many cookies did Ella bake?",
    answer: "twelve",
    choices: ["twelve", "six", "twenty", "three"]
  },
  {
    level: 2,
    image: "flowerpot",
    passage: "A bee landed on the lavender in the school garden. It collected nectar and pollen from the flowers. Ms. Green said bees bring nectar back to the hive. The class wrote that honey starts with nectar.",
    question: "What did the bee collect from the flowers?",
    answer: "nectar and pollen",
    choices: ["nectar and pollen", "sand and shells", "paper and glue", "leaves and stones"]
  },
  {
    level: 2,
    image: "pup",
    passage: "Leo found a lost puppy near the shops. He checked the collar and found a phone number. His mother called the number while Leo held the leash. The owner arrived quickly and thanked them.",
    question: "Where did Leo find the puppy?",
    answer: "near the shops",
    choices: ["near the shops", "inside the library", "beside his bed", "at the swimming pool"]
  },
  {
    level: 2,
    image: "heron",
    passage: "Penguins cannot fly, but they are strong swimmers. They use their wings like flippers to move through the water. The class watched a video of penguins chasing fish. Then they labeled the flippers on a diagram.",
    question: "How do penguins use their wings?",
    answer: "like flippers",
    choices: ["like flippers", "like umbrellas", "like baskets", "like pencils"]
  },
  {
    level: 2,
    image: "soil",
    passage: "Jack's class planted tomatoes, beans, and carrots in the school garden. First they dug the soil and mixed in compost. Then they placed seeds in straight rows. Each afternoon, two students watered the beds.",
    question: "What did the class mix into the soil?",
    answer: "compost",
    choices: ["compost", "paint", "salt", "paper clips"]
  },
  {
    level: 2,
    image: "helmet",
    passage: "Before skating, Joey put on a helmet and knee pads. His friend checked that the helmet strap was clipped. Joey practiced stopping near the wall before skating faster. The teacher praised him for getting ready safely.",
    question: "What did Joey put on before skating?",
    answer: "a helmet and knee pads",
    choices: ["a helmet and knee pads", "a raincoat and boots", "a scarf and mittens", "a badge and tie"]
  },
  {
    level: 2,
    image: "road",
    passage: "The museum map showed three special exhibits. The dinosaur bones were on the first floor, and the space rocks were upstairs. Priya wanted to see the space rocks first. Her group followed the stairs marked on the map.",
    question: "Where were the space rocks?",
    answer: "upstairs",
    choices: ["upstairs", "in the lunchroom", "beside the bus", "under the dinosaur bones"]
  },
  {
    level: 2,
    image: "raincoat",
    passage: "Rain began just as the class left the theater. Ben opened a large umbrella and shared it with Theo. The umbrella kept their programs dry while they walked to the bus. Theo folded it carefully before climbing aboard.",
    question: "What did the umbrella keep dry?",
    answer: "their programs",
    choices: ["their programs", "their sandwiches", "their shoes", "the bus seats"]
  },
  {
    level: 2,
    image: "photo",
    passage: "Nadia took photographs for the class newsletter. She photographed the chess club, the art display, and the garden team. Her clearest picture showed the garden team holding fresh carrots. The teacher chose that picture for the front page.",
    question: "Which picture did the teacher choose?",
    answer: "the garden team holding fresh carrots",
    choices: ["the garden team holding fresh carrots", "the chess board under a chair", "the empty hallway", "the lunch menu"]
  },
  {
    level: 2,
    image: "ladle",
    passage: "Grandma showed Imani how to make vegetable soup. Imani washed carrots and celery before Grandma chopped them. The soup simmered while they set the table. Imani added parsley at the end because Grandma said it tasted fresh.",
    question: "What did Imani add at the end?",
    answer: "parsley",
    choices: ["parsley", "ice cubes", "strawberries", "bread crumbs"]
  },
  {
    level: 2,
    image: "piano",
    passage: "Before the play, Sam practiced his lines at home. The next morning, he carried his costume to school in a bag. After lunch, the class arranged chairs for visitors. When families arrived, Sam stepped onto the stage.",
    question: "What did Sam carry to school?",
    answer: "his costume",
    choices: ["his costume", "a flowerpot", "a soccer ball", "his lunch tray"]
  },
  {
    level: 1,
    image: "beachball",
    passage: "Toby brought a striped towel to swimming class. He folded it on the bench before getting into the pool. After the lesson, he dried his hair with the towel. Then he packed it in the side pocket of his bag.",
    question: "Where did Toby pack the towel?",
    answer: "in the side pocket of his bag",
    choices: ["in the side pocket of his bag", "under the pool ladder", "inside a lunch tray", "beside the teacher's desk"]
  },
  {
    level: 1,
    image: "coin",
    passage: "Ivy found a coin near the classroom door. She did not put it in her pocket. She gave it to Ms. Lopez, who placed it in the lost property box. At the end of the day, Omar came back to look for it.",
    question: "Where did Ms. Lopez put the coin?",
    answer: "in the lost property box",
    choices: ["in the lost property box", "inside Ivy's pocket", "under the rug", "on the lunch table"]
  },
  {
    level: 1,
    image: "glove",
    passage: "A red glove was lying beside the playground gate. Hassan picked it up before the wind blew it away. He took it to the office after recess. The secretary pinned it to the lost items board.",
    question: "Where was the glove first found?",
    answer: "beside the playground gate",
    choices: ["beside the playground gate", "inside the office drawer", "under a classroom chair", "on the bus seat"]
  },
  {
    level: 1,
    image: "piano",
    passage: "Lena listened carefully during music class. Mr. Hill played three high notes on the piano. Then Lena copied the notes on a small keyboard. Mr. Hill smiled because she played them in the correct order.",
    question: "How many high notes did Mr. Hill play?",
    answer: "three",
    choices: ["three", "one", "five", "eight"]
  },
  {
    level: 1,
    image: "shirt",
    passage: "Before the class photo, Ben noticed mud on his blue shirt. He rubbed the spot with a damp paper towel. The mud faded, but the shirt stayed a little wet. Ben stood in the back row while it dried.",
    question: "What was on Ben's shirt?",
    answer: "mud",
    choices: ["mud", "paint", "jam", "chalk"]
  },
  {
    level: 1,
    image: "bucket",
    passage: "The art class washed brushes after painting. June filled a bucket with warm water. She dipped each brush and wiped it on a cloth. When the water turned dark, she carried the bucket to the sink.",
    question: "What did June put in the bucket?",
    answer: "warm water",
    choices: ["warm water", "dry sand", "paper clips", "green paint"]
  },
  {
    level: 1,
    image: "tag",
    passage: "Kai helped label plants for the spring fair. He wrote basil on a small wooden tag. Then he pushed the tag into the soil beside the herb pot. Visitors could read the tag without touching the leaves.",
    question: "What word did Kai write on the tag?",
    answer: "basil",
    choices: ["basil", "carrot", "rose", "pepper"]
  },
  {
    level: 1,
    image: "leash",
    passage: "Molly walked her dog before dinner. The dog stopped when its leash caught on a low branch. Molly gently lifted the leash over the branch. Then they continued along the path to the park.",
    question: "What did the leash catch on?",
    answer: "a low branch",
    choices: ["a low branch", "a metal gate", "a bicycle pedal", "a picnic rug"]
  },
  {
    level: 1,
    image: "sticker",
    passage: "After reading time, Nora chose a silver sticker from the reward box. She placed it on the front of her notebook. Her friend chose a star-shaped sticker. Nora showed her notebook to her mother after school.",
    question: "Where did Nora put her sticker?",
    answer: "on the front of her notebook",
    choices: ["on the front of her notebook", "inside the reward box", "under her chair", "on the classroom door"]
  },
  {
    level: 1,
    image: "broom",
    passage: "The wind blew dry leaves into the hallway. Mr. Cole brought a broom from the cupboard. He swept the leaves into one pile near the door. Then Mia held the dustpan while he brushed the leaves inside.",
    question: "What did Mr. Cole use to sweep the leaves?",
    answer: "a broom",
    choices: ["a broom", "a towel", "a paintbrush", "a ruler"]
  },
  {
    level: 1,
    image: "lizard",
    passage: "The class terrarium needed fresh water. Ana poured water into the shallow dish. The small lizard walked over and dipped its head near the edge. Ana closed the lid carefully before returning to her seat.",
    question: "What did Ana pour into the dish?",
    answer: "water",
    choices: ["water", "milk", "sand", "paint"]
  },
  {
    level: 1,
    image: "photo",
    passage: "Dad printed a photo from the school concert. It showed Zoe standing beside the choir teacher. Zoe placed the photo in a yellow frame. She put the frame on the shelf above her desk.",
    question: "Who was standing beside Zoe in the photo?",
    answer: "the choir teacher",
    choices: ["the choir teacher", "the bus driver", "her cousin", "the librarian"]
  },
  {
    level: 1,
    image: "cushion",
    passage: "The reading corner felt cold after the window was opened. Max carried two cushions from the shelf. He put one cushion on the blue chair and one on the rug. His group sat there during story time.",
    question: "How many cushions did Max carry?",
    answer: "two",
    choices: ["two", "four", "six", "one"]
  },
  {
    level: 1,
    image: "clock",
    passage: "The classroom clock stopped during maths. Ella noticed that both hands stayed on twelve. Mr. Reed changed the battery after lunch. The clock began ticking again before home time.",
    question: "When did Mr. Reed change the battery?",
    answer: "after lunch",
    choices: ["after lunch", "before breakfast", "during assembly", "after home time"]
  },
  {
    level: 1,
    image: "pail",
    passage: "At the sand table, Theo filled a small pail with damp sand. He turned it upside down and tapped the bottom. A neat sand tower slipped out. Theo decorated the tower with two smooth stones.",
    question: "What did Theo fill the pail with?",
    answer: "damp sand",
    choices: ["damp sand", "cold soup", "paper scraps", "blue paint"]
  },
  {
    level: 1,
    image: "flute",
    passage: "During music practice, Amara forgot her flute case under the chair. Jacob saw it after the lesson ended. He carried it to Amara before she reached the hallway. Amara thanked him and zipped the case closed.",
    question: "Where was Amara's flute case?",
    answer: "under the chair",
    choices: ["under the chair", "inside the piano", "on the playground", "beside the bus"]
  },
  {
    level: 2,
    image: "meadow",
    passage: "The class measured shadows in the meadow at noon. Ella placed a ruler beside the shadow of a tall post. Her partner wrote the number in a chart. They planned to measure the same shadow again later in the afternoon.",
    question: "What did Ella place beside the shadow?",
    answer: "a ruler",
    choices: ["a ruler", "a lunch box", "a blue scarf", "a flowerpot"]
  },
  {
    level: 2,
    image: "sail",
    passage: "A small sailboat model floated in the water tray. When Mia blew gently, the paper sail pushed the boat forward. She changed the sail to face the other way. The boat moved in a new direction.",
    question: "What pushed the model boat forward?",
    answer: "the paper sail",
    choices: ["the paper sail", "a wooden spoon", "a glass marble", "the tray label"]
  },
  {
    level: 2,
    image: "basketball",
    passage: "The gym class practiced passing before the game. Omar bounced the ball once and passed it to Leah. Leah caught it with both hands and passed it to Ben. Coach Ana said the team was watching carefully.",
    question: "Who caught Omar's pass?",
    answer: "Leah",
    choices: ["Leah", "Ben", "Coach Ana", "Omar"]
  },
  {
    level: 2,
    image: "soil",
    passage: "In the science corner, two cups held the same kind of soil. One cup was dry, and the other had been watered. Priya pressed a finger gently into each cup. The watered soil felt softer than the dry soil.",
    question: "Which soil felt softer?",
    answer: "the watered soil",
    choices: ["the watered soil", "the dry soil", "the soil in the bag", "the soil on the shelf"]
  },
  {
    level: 2,
    image: "glasses",
    passage: "Grandpa could not read the recipe because his glasses were missing. Nina found them beside the fruit bowl. Grandpa put them on and read the next step aloud. The recipe said to stir the batter for one minute.",
    question: "Where did Nina find Grandpa's glasses?",
    answer: "beside the fruit bowl",
    choices: ["beside the fruit bowl", "inside the oven", "under the cookbook", "on the garden path"]
  },
  {
    level: 2,
    image: "ladle",
    passage: "The lunch helper served soup in the cafeteria. She used a silver ladle to fill each bowl. When the pot was nearly empty, she asked the cook for more soup. The cook brought a fresh pot from the kitchen.",
    question: "What did the helper use to fill the bowls?",
    answer: "a silver ladle",
    choices: ["a silver ladle", "a plastic fork", "a paper cup", "a wooden ruler"]
  },
  {
    level: 2,
    image: "airplane",
    passage: "At the model club, Ryan built a paper airplane with wide wings. His first throw dipped quickly to the floor. He folded the nose more tightly and tried again. The second throw glided across the room.",
    question: "What did Ryan fold more tightly?",
    answer: "the nose of the airplane",
    choices: ["the nose of the airplane", "the classroom rug", "the club sign", "the window curtain"]
  },
  {
    level: 2,
    image: "road",
    passage: "On the way to the farm, the bus stopped at a road sign. The sign showed that the bridge ahead was closed. The driver turned onto a side road. The class arrived late but still had time to feed the goats.",
    question: "Why did the driver turn onto a side road?",
    answer: "the bridge ahead was closed",
    choices: ["the bridge ahead was closed", "the bus had no seats", "the goats were on the bus", "the farm was closed"]
  },
  {
    level: 2,
    image: "cactus",
    passage: "The desert garden had a sign beside each plant. Mateo read the sign near the cactus. It said the cactus stores water in its thick stem. Mateo drew the stem and added drops of water inside his drawing.",
    question: "Where does the cactus store water?",
    answer: "in its thick stem",
    choices: ["in its thick stem", "inside a paper bag", "under a garden bench", "on its flower petals"]
  },
  {
    level: 2,
    image: "blanket",
    passage: "For the outdoor reading picnic, Grace spread a blanket under a maple tree. Her group placed books in the center so they would not touch the grass. A breeze lifted one corner of the blanket. Grace set her water bottle on that corner.",
    question: "Why did Grace put her water bottle on the blanket corner?",
    answer: "to keep the corner from lifting",
    choices: ["to keep the corner from lifting", "to hide the books", "to water the tree", "to mark the lunch line"]
  },
  {
    level: 2,
    image: "shark",
    passage: "The aquarium guide showed the class a row of shark teeth. Some teeth were small, but one tooth was as long as Mateo's finger. The guide explained that sharks lose and replace teeth often. Mateo wrote that fact on his worksheet.",
    question: "What fact did Mateo write?",
    answer: "sharks lose and replace teeth often",
    choices: ["sharks lose and replace teeth often", "sharks sleep in trees", "all shark teeth are tiny", "aquariums have no worksheets"]
  },
  {
    level: 2,
    image: "firefly",
    passage: "At dusk, Lina watched fireflies blink above the grass. Her dad asked her to count only the ones near the fence. Lina counted seven flashes in one minute. She wrote the number on the chart before the sky grew dark.",
    question: "How many flashes did Lina count?",
    answer: "seven",
    choices: ["seven", "three", "twelve", "twenty"]
  },
  {
    level: 2,
    image: "fridge",
    passage: "The class made a snack chart for the field trip. Apples and cheese went in the fridge until morning. Crackers stayed in a sealed box on the counter. Ms. Reed checked both places before loading the cooler.",
    question: "Which snacks went in the fridge?",
    answer: "apples and cheese",
    choices: ["apples and cheese", "crackers", "sandwich wrappers", "paper napkins"]
  },
  {
    level: 2,
    image: "bookcase",
    passage: "After the book fair, the class sorted donated books. Animal books went on the lower shelf, and mystery books went on the middle shelf. Poetry books were placed in a blue bin. The teacher thanked the class for making the shelves easier to search.",
    question: "Where did the class put the poetry books?",
    answer: "in a blue bin",
    choices: ["in a blue bin", "on the lower shelf", "on the middle shelf", "under the table"]
  },
  {
    level: 2,
    image: "dewdrop",
    passage: "Early in the morning, Aisha saw drops of water on the grass. Her teacher said the drops were dew, not rain. The air had cooled overnight, and water gathered on the blades. Aisha touched one blade and her finger became wet.",
    question: "What were the drops on the grass called?",
    answer: "dew",
    choices: ["dew", "paint", "steam", "mud"]
  },
  {
    level: 2,
    image: "badge",
    passage: "During the museum visit, each student wore a name badge. Noah's badge slipped off near the dinosaur display. A guide found it and read Noah's name. She returned it before the class moved to the next room.",
    question: "Where did Noah's badge slip off?",
    answer: "near the dinosaur display",
    choices: ["near the dinosaur display", "inside the gift shop bag", "under the bus seat", "beside the lunch tray"]
  },
  {
    level: 2,
    image: "wave",
    passage: "The weather station warned that strong waves would reach the pier. The harbor worker moved small boats farther from the edge. He tied each rope to a higher post. By afternoon, waves splashed over the lower posts.",
    question: "Where did the worker tie the ropes?",
    answer: "to higher posts",
    choices: ["to higher posts", "to school chairs", "inside a backpack", "under the sand"]
  }
];

function makeKeyDetailsQuestion(seed, index) {
  const phase = index % 2 === 0 ? 1 : 2;
  const padded = String(index + 1).padStart(3, "0");
  const imagePath = `/media/vocabulary/images/${seed.image}.webp`;

  return {
    id: `hq_key_details_l${seed.level}_p${phase}_${padded}`,
    grade: seed.level === 1 ? "1" : "2",
    skillId: "key_details",
    skillName: "Key Details",
    skill: "Key Details",
    level: seed.level,
    difficulty: seed.level,
    phase,
    assessmentPhase: phase,
    phaseTarget: `level_${seed.level}_phase_${phase}`,
    templateType: "COMPREHENSION",
    formatType: "COMPREHENSION",
    questionType: "multiple_choice",
    prompt: seed.question,
    question: seed.question,
    spokenPrompt: seed.question,
    passage: seed.passage,
    correctAnswer: seed.answer,
    answer: seed.answer,
    answerOptions: seed.choices,
    choices: seed.choices,
    itemType: "key_details",
    itemKey: `key_detail_l${seed.level}_${padded}`,
    targetWord: `key_detail_l${seed.level}_${padded}`,
    imageUrl: imagePath,
    imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    imageAlt: seed.image.replace(/-/g, " "),
    active: true,
    source: SOURCE,
    tags: ["high-quality-comprehension", "key_details", `level-${seed.level}`]
  };
}

export const highQualityComprehensionReplacementQuestions = keyDetailSeeds.map(makeKeyDetailsQuestion);
