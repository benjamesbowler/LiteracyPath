const wordAudio = word => `/audio/child-mode/words/${word.toLowerCase().replace(/[^a-z0-9'-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

const normalizeReadingText = text =>
  String(text || "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

const words = text =>
  normalizeReadingText(text)
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

const seriesPagePath = (seriesId, bookNumber, pageNumber) =>
  `/guided-reading/series/${seriesId}/book-${String(bookNumber).padStart(2, "0")}/page-${String(pageNumber).padStart(3, "0")}.webp`;

const seriesCoverPath = (seriesId, bookNumber) =>
  `/guided-reading/series/${seriesId}/book-${String(bookNumber).padStart(2, "0")}/cover.webp`;

const pagePath = (bookNumber, pageNumber) =>
  seriesPagePath("bob-and-nan", bookNumber, pageNumber);

const coverPath = bookNumber =>
  seriesCoverPath("bob-and-nan", bookNumber);

const createPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: pagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: "needs_review",
  qaNotes: "Imported from the Bob and Nan Level A pack; needs text-picture QA before student release.",
  active: true
});

const createBobAndNanBook = ({
  id,
  title,
  bookNumber,
  theme,
  pages
}) => ({
  id,
  seriesId: "bob-and-nan",
  seriesTitle: "Bob and Nan",
  title,
  type: "fiction",
  category: "fiction",
  level: "A",
  ageRange: "4-5",
  bookNumber,
  author: "Nora Bell",
  illustrator: "Milo Reed",
  status: "teacher_preview",
  qaStatus: "needs_review",
  qaNotes: "Teacher preview only until every page image is confirmed to match the text.",
  active: false,
  teacherPreviewOnly: true,
  source: "bob_and_nan_level_a_pack_2026_05_26",
  coverImage: coverPath(bookNumber),
  targetSkills: ["level-a", "early-fiction", "one-sentence-pages"],
  theme,
  characterReference: {
    bob: "Bob is a 4-5 year old boy with short black hair, a red T-shirt, blue shorts, white socks, and red shoes.",
    nan: "Nan is a 4-5 year old girl with blonde bobbed hair, a red dress, white socks, and red shoes.",
    fluff: "Fluff is a small fluffy brown puppy introduced only in book 3."
  },
  seriesReference:
    "Keep Bob and Nan visually consistent across the full Level A series. Use warm, clean, child-friendly illustrations with no embedded text.",
  pages: pages.map(page => createPage({ bookNumber, ...page }))
});

const jamesPagePath = (bookNumber, pageNumber) =>
  seriesPagePath("james-and-anna", bookNumber, pageNumber);

const jamesCoverPath = bookNumber =>
  seriesCoverPath("james-and-anna", bookNumber);

const createJamesPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: jamesPagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: pageNumber <= 7 ? "needs_review" : "missing_image",
  qaNotes: pageNumber <= 7
    ? "Imported image is present but needs text-picture QA before student release."
    : "Source text exists, but the delivered James and Anna image pack did not include this page image.",
  active: pageNumber <= 7
});

const createJamesAndAnnaBook = ({
  id,
  title,
  bookNumber,
  theme,
  targetPatterns,
  sightWords,
  pages
}) => ({
  id,
  seriesId: "james-and-anna",
  seriesTitle: "James and Anna",
  title,
  type: "fiction",
  category: "fiction",
  level: "B",
  ageRange: "5-6",
  bookNumber,
  author: "Ava Stone",
  illustrator: "Finn Blue",
  status: "teacher_preview",
  qaStatus: "needs_review",
  qaNotes: "Partial teacher preview using delivered pages only. Missing later source pages remain blocked until images arrive.",
  active: false,
  teacherPreviewOnly: true,
  source: "james_and_anna_level_b_pack_2026_05_26",
  coverImage: jamesCoverPath(bookNumber),
  targetSkills: ["level-b", "early-fiction", "longer-sentences"],
  sightWords,
  targetPatterns,
  theme,
  characterReference: {
    james: "James is 5-6 with brown skin, close-cropped black hair, a green-and-white striped T-shirt, blue shorts, white socks, and red trainers.",
    anna: "Anna is 5-6 with light skin, chestnut-brown hair in two bunches, a yellow pinafore dress over a white top, white socks, and red shoes.",
    chips: "Chips is a small white goat with big brown patches, yellow eyes, short horns, floppy ears, and a blue collar with a blue bell. Chips appears from book 2 onward only where the text says so.",
    zim: "Zim is a tiny lime-green alien with three large black eyes, stick limbs, one antenna, and a wide grin. Zim appears only in book 1."
  },
  imageGenerationReference:
    "Keep James, Anna, Chips, and Zim consistent across the Level B series. Use the source page text and prompt for each page; no embedded text, no speech bubbles, no captions, and no one-page image/text shift.",
  expectedStoryPageCount: pages.length,
  availableStoryPageCount: 7,
  missingStoryPages: pages.filter(page => page.pageNumber > 7).map(page => page.pageNumber),
  pages: pages.map(page => createJamesPage({ bookNumber, ...page }))
});

export const guidedReadingSeriesBooks = [
  createBobAndNanBook({
    id: "bob-and-nan-01",
    title: "Bob and Nan",
    bookNumber: 1,
    theme: "introducing Bob and Nan",
    pages: [
      {
        pageNumber: 1,
        text: "This is Bob.",
        illustrationPrompt: "Bob stands facing viewer. Green spring garden behind him, small yellow and white daisies, low white picket fence, blue sky."
      },
      {
        pageNumber: 2,
        text: "Bob can run.",
        illustrationPrompt: "Bob mid-run left to right, big grin, black hair windswept. Green lawn, pink cherry blossom tree in background."
      },
      {
        pageNumber: 3,
        text: "This is Nan.",
        illustrationPrompt: "Nan stands facing viewer, big warm smile, hands clasped. Same spring garden setting as page 1."
      },
      {
        pageNumber: 4,
        text: "Nan can run.",
        illustrationPrompt: "Nan mid-run right to left, red dress flaring slightly, blonde hair streaming back. Same spring setting."
      },
      {
        pageNumber: 5,
        text: "Bob and Nan ran.",
        illustrationPrompt: "Bob and Nan running side by side on bright green grass, both grinning. Open spring field, blue sky."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan sat.",
        illustrationPrompt: "Bob and Nan sitting cross-legged on grass, smiling at viewer. Yellow buttercups and daisies around them."
      },
      {
        pageNumber: 7,
        text: "Bob and Nan are pals!",
        illustrationPrompt: "Bob and Nan standing together, Nan's arm around Bob's shoulder. Their two houses behind them, spring garden."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-02-park",
    title: "Bob and Nan go to the Park",
    bookNumber: 2,
    theme: "park play",
    pages: [
      {
        pageNumber: 1,
        text: "Bob and Nan go to the park.",
        illustrationPrompt: "Bob and Nan walking side by side along a path toward a park gate. Green park visible beyond the gate. Spring day."
      },
      {
        pageNumber: 2,
        text: "Bob can run fast!",
        illustrationPrompt: "Bob sprinting along a park path, arms wide, huge grin. Park trees and path behind him."
      },
      {
        pageNumber: 3,
        text: "Nan can run fast!",
        illustrationPrompt: "Nan sprinting on park grass, dress flaring, hair flying, huge grin. Matching energy to Bob."
      },
      {
        pageNumber: 4,
        text: "Bob got on the big swing.",
        illustrationPrompt: "Bob seated on a park swing, gripping the chains, feet pointing forward in a big arc. Delighted expression."
      },
      {
        pageNumber: 5,
        text: "Nan got on the big swing.",
        illustrationPrompt: "Nan seated on the swing next to Bob's, pumping her legs, swinging high. Big smile."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan ran up the big hill.",
        illustrationPrompt: "Bob and Nan running up a steep grassy hill together, leaning forward, laughing."
      },
      {
        pageNumber: 7,
        text: "What a fun day!",
        illustrationPrompt: "Bob and Nan at the top of the hill, arms raised in triumph, big smiles. Park spread out below them."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-03-fluff",
    title: "Bob, Nan and Fluff",
    bookNumber: 3,
    theme: "meeting Fluff",
    pages: [
      {
        pageNumber: 1,
        text: "Bob and Nan sat in the sun.",
        illustrationPrompt: "Bob and Nan sitting on the grass in bright summer sunshine, eyes half-closed contentedly. Garden setting."
      },
      {
        pageNumber: 2,
        text: "Bob saw a pup!",
        illustrationPrompt: "Bob pointing in surprise and delight at a small brown dog that has appeared at the garden gate. Wide eyes."
      },
      {
        pageNumber: 3,
        text: "The pup ran to Nan.",
        illustrationPrompt: "The small brown fluffy dog bounding happily across the grass toward Nan, tail wagging."
      },
      {
        pageNumber: 4,
        text: "Nan pat the pup.",
        illustrationPrompt: "Nan kneeling on the grass, gently patting the small brown dog's head. Dog's eyes closed in bliss, tail wagging."
      },
      {
        pageNumber: 5,
        text: "Bob pat the pup.",
        illustrationPrompt: "Bob kneeling beside Nan, also patting the dog. Both children and the dog look very happy together."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan call the pup Fluff.",
        illustrationPrompt: "Bob and Nan looking at each other and smiling, the dog sitting between them looking up at them."
      },
      {
        pageNumber: 7,
        text: "Fluff is our pup!",
        illustrationPrompt: "Bob, Nan and Fluff together, Bob and Nan kneeling with Fluff between them. All three joyful."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-04-beach",
    title: "Bob and Nan go to the Beach",
    bookNumber: 4,
    theme: "beach day",
    pages: [
      {
        pageNumber: 1,
        text: "Bob and Nan go to the beach.",
        illustrationPrompt: "Bob and Nan walking along a sandy path toward the sea, carrying a bucket and spade each. Excited faces."
      },
      {
        pageNumber: 2,
        text: "The sun is hot!",
        illustrationPrompt: "Bob and Nan standing on the beach looking up at a huge bright sun, shielding their eyes and grinning."
      },
      {
        pageNumber: 3,
        text: "Bob can dig.",
        illustrationPrompt: "Bob crouching on the sand, digging enthusiastically with a red spade, building a sandcastle."
      },
      {
        pageNumber: 4,
        text: "Nan can dig.",
        illustrationPrompt: "Nan crouching next to Bob's sandcastle, adding to it with a yellow spade. A growing sand structure between them."
      },
      {
        pageNumber: 5,
        text: "Bob got wet!",
        illustrationPrompt: "Bob standing in the shallow sea, a wave just washing over his shoes. Mouth open in a gasp, then laughing."
      },
      {
        pageNumber: 6,
        text: "Nan got wet!",
        illustrationPrompt: "Nan splashing in the shallow sea, both arms out for balance, sea water splashing all around. Huge delighted grin."
      },
      {
        pageNumber: 7,
        text: "Bob and Nan had fun at the beach!",
        illustrationPrompt: "Bob and Nan sitting on the sand at the water's edge. Sun lower now, sea sparkling. Happy, tired smiles."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-05-school",
    title: "Bob and Nan's First Day at School",
    bookNumber: 5,
    theme: "first day at school",
    pages: [
      {
        pageNumber: 1,
        text: "It is the big day.",
        illustrationPrompt: "Bob and Nan standing outside their houses in the early morning. Both in school clothes, looking nervous and excited. Autumn trees behind."
      },
      {
        pageNumber: 2,
        text: "Bob has his bag.",
        illustrationPrompt: "Bob holding up a blue school bag proudly, but his face shows mixed feelings, brave but a little nervous."
      },
      {
        pageNumber: 3,
        text: "Nan has her bag.",
        illustrationPrompt: "Nan clutching a red school bag to her chest, nervous expression. Mum's hand on her shoulder for reassurance."
      },
      {
        pageNumber: 4,
        text: "Bob is sad.",
        illustrationPrompt: "Bob's face with a slightly wobbly bottom lip, eyes wide, not crying but close. School gate visible ahead of him."
      },
      {
        pageNumber: 5,
        text: "Nan is sad.",
        illustrationPrompt: "Nan's face similarly worried, clutching Mum's hand tightly. Both are walking bravely forward."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan sit at a desk.",
        illustrationPrompt: "Bob and Nan seated side by side at small school desks in a bright classroom. Looking around with wide curious eyes."
      },
      {
        pageNumber: 7,
        text: "Bob and Nan had fun at school!",
        illustrationPrompt: "End of the day. Bob and Nan running out of the school gate, huge grins, school bags bouncing. Mum waiting."
      }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-01-space",
    title: "James and Anna go to Space",
    bookNumber: 1,
    theme: "cardboard rocket space adventure",
    sightWords: ["and", "the", "said", "they", "were", "into", "some", "very"],
    targetPatterns: ["final-sounds", "short-vowels", "longer-sentences", "dialogue"],
    pages: [
      { pageNumber: 1, text: `James and Anna were in the garden. They had lots of big, flat boxes.`, illustrationPrompt: "James and Anna in the garden surrounded by large cardboard boxes." },
      { pageNumber: 2, text: `"Let us make a rocket!" said James. "We can fly all the way into space!"`, illustrationPrompt: "James pointing up at the sky while Anna looks up smiling." },
      { pageNumber: 3, text: `Anna grabbed her pen and drew the plan. "It needs big wings," she said, "and a pointed nose cone at the top."`, illustrationPrompt: "Anna drawing a rocket plan on paper in the garden." },
      { pageNumber: 4, text: `They cut and snipped and stuck and taped. They worked all morning long.`, illustrationPrompt: "James and Anna cutting, taping, and building the cardboard rocket." },
      { pageNumber: 5, text: `James got the red paint. Anna got the silver paint. They painted and painted until it shone!`, illustrationPrompt: "James and Anna painting a red and silver cardboard rocket." },
      { pageNumber: 6, text: `"It is the best rocket ever made!" said James. He and Anna stood back and grinned.`, illustrationPrompt: "James and Anna proudly admiring the finished cardboard rocket." },
      { pageNumber: 7, text: `They climbed inside. James held up five fingers. "Five... four... three... two... one... BLAST OFF!"`, illustrationPrompt: "James and Anna inside the rocket starting the countdown." },
      { pageNumber: 8, text: `Up, up, up went the rocket! They shot past the white clouds and into the deep, dark sky.`, illustrationPrompt: "Imagination scene with the rocket blasting upward through clouds toward space." },
      { pageNumber: 9, text: `They flew past big round planets. Some had red spots. Some had wide, shining rings!`, illustrationPrompt: "Rocket flying past planets with spots and rings in space." },
      { pageNumber: 10, text: `They landed on the moon with a big BUMP! It was pale and still and very, very quiet.`, illustrationPrompt: "James and Anna landing on the moon in little space suits." },
      { pageNumber: 11, text: `A small green alien ran to say hello. "My name is Zim!" it said. "Do you want to play?"`, illustrationPrompt: "Zim the small green alien greeting James and Anna on the moon." },
      { pageNumber: 12, text: `James and Anna played with Zim all day. They jumped so high on the moon!`, illustrationPrompt: "James, Anna, and Zim jumping high on the moon." },
      { pageNumber: 13, text: `"Time to go home," said Anna. "Come back soon!" called Zim, and he waved and waved.`, illustrationPrompt: "Rocket lifting off while Zim waves goodbye from the moon." },
      { pageNumber: 14, text: `BUMP! They were back in the garden. Mum had made cake. "Best trip EVER!" they said.`, illustrationPrompt: "James and Anna back in the garden with Mum holding cake." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-02-chips",
    title: "James and Anna and Chips",
    bookNumber: 2,
    theme: "pet goat mischief",
    sightWords: ["and", "had", "his", "was", "with", "from", "one", "said"],
    targetPatterns: ["final-sounds", "short-vowels", "consonant-digraphs", "dialogue"],
    pages: [
      { pageNumber: 1, text: `James and Anna had a pet goat. His name was Chips. He was small and white with big brown patches.`, illustrationPrompt: "James and Anna in the garden with Chips the small white and brown goat." },
      { pageNumber: 2, text: `Chips had a blue bell on his collar. JINGLE! JINGLE! JINGLE! You could hear him coming from far away!`, illustrationPrompt: "Chips trotting with a blue bell jingling on his collar." },
      { pageNumber: 3, text: `Chips liked to eat. He ate the long green grass. He ate sticks and bits of bark. One day, he ate Dad's best hat!`, illustrationPrompt: "Chips chewing Dad's straw hat while Dad looks shocked." },
      { pageNumber: 4, text: `"CHIPS!" said Dad. Chips blinked. He chewed. He looked the other way.`, illustrationPrompt: "Dad pointing at Chips while Chips calmly chews and looks away." },
      { pageNumber: 5, text: `James made Chips a lead from a long piece of rope. Now Chips could come on walks!`, illustrationPrompt: "James tying a rope lead to Chips's collar." },
      { pageNumber: 6, text: `They set off down the lane. Chips trotted along and stopped to munch the long grass at the sides.`, illustrationPrompt: "James and Anna walking Chips down a leafy lane." },
      { pageNumber: 7, text: `Then Chips saw a big rose bush. He ran at it. CRUNCH! MUNCH! SNAP! The rose bush was gone.`, illustrationPrompt: "Chips charging into a rose bush with petals and leaves flying." },
      { pageNumber: 8, text: `"Oh, Chips!" said Anna. But she gave him a big hug. Chips licked her right on the nose.`, illustrationPrompt: "Anna hugging Chips while he licks her nose." },
      { pageNumber: 9, text: `They got home just in time for lunch. James filled Chips's bowl with fresh grass and sliced apple.`, illustrationPrompt: "James filling Chips's bowl with grass and sliced apple." },
      { pageNumber: 10, text: `Chips ate it all in a flash. He looked at the bowl. Then he looked at James. Then he looked at James's jumper.`, illustrationPrompt: "Chips looking from the empty bowl to James's jumper." },
      { pageNumber: 11, text: `CRUNCH! He ate the jumper.`, illustrationPrompt: "Chips chewing James's jumper while James looks shocked." },
      { pageNumber: 12, text: `"CHIPS!" they both said. But they could not stop smiling. Chips was naughty and cheeky and silly — and they loved him so much.`, illustrationPrompt: "James and Anna pointing at Chips but smiling warmly." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-03-shopping",
    title: "James and Anna go Shopping",
    bookNumber: 3,
    theme: "helping Mum shop",
    sightWords: ["was", "said", "the", "they", "both", "home", "with"],
    targetPatterns: ["final-sounds", "short-vowels", "compound-phrases", "dialogue"],
    pages: [
      { pageNumber: 1, text: `It was a bright autumn day. Mum had a long list. "I need help at the shop," she said. "Can you both come?"`, illustrationPrompt: "Mum holding a shopping list while James and Anna look eager." },
      { pageNumber: 2, text: `"Yes!" said James and Anna. James grabbed the list. Anna grabbed the bags. Off they went!`, illustrationPrompt: "James with the list and Anna with bags heading out." },
      { pageNumber: 3, text: `The shop was big and bright. It smelled of fresh bread and ripe fruit.`, illustrationPrompt: "James and Anna stepping into a bright supermarket." },
      { pageNumber: 4, text: `"We need bread, grapes, cheese, eggs and orange juice," said James, reading the list carefully.`, illustrationPrompt: "James reading the list carefully in the shop." },
      { pageNumber: 5, text: `Anna ran to find the bread. She picked the big round loaf with seeds on top. It smelled amazing!`, illustrationPrompt: "Anna choosing a round seeded loaf from the bread shelf." },
      { pageNumber: 6, text: `James found the grapes. Red ones or green ones? He put both bunches in the basket — just to be safe.`, illustrationPrompt: "James choosing both red and green grapes." },
      { pageNumber: 7, text: `They found the cheese, the eggs and the juice. James was very careful with the eggs.`, illustrationPrompt: "James carefully carrying an egg box while Anna has other shopping." },
      { pageNumber: 8, text: `Then Anna spotted the cake stand! Big cakes, small cakes, jam tarts and iced buns — all in a long, shining row.`, illustrationPrompt: "Anna and James dazzled by a cake display." },
      { pageNumber: 9, text: `"Can we get a cake each?" asked James. Mum smiled. "One each," she said.`, illustrationPrompt: "James asking Mum for cake while Mum holds up one finger." },
      { pageNumber: 10, text: `James chose a big slice of lemon cake with thick white icing. Anna chose a pink strawberry jam tart.`, illustrationPrompt: "James choosing lemon cake and Anna choosing a jam tart." },
      { pageNumber: 11, text: `At the till, Mum let James put the shopping on the belt. He was VERY careful with the eggs.`, illustrationPrompt: "James carefully placing eggs on the checkout belt." },
      { pageNumber: 12, text: `On the way home, the bread smelled so good. James started to reach into the bag. Anna gave him a look. He stopped.`, illustrationPrompt: "James reaching for bread while Anna gives him a warning look." },
      { pageNumber: 13, text: `At home, Mum made lunch. After, they had their cakes. Chips ate the paper bag. "CHIPS!" they said. But they were laughing too hard to be cross.`, illustrationPrompt: "James and Anna laughing at the table while Chips eats the paper bag." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-04-dentist",
    title: "James and Anna go to the Dentist",
    bookNumber: 4,
    theme: "first dentist visit",
    sightWords: ["was", "said", "the", "there", "they", "both", "very"],
    targetPatterns: ["final-sounds", "digraphs", "longer-sentences", "dialogue"],
    pages: [
      { pageNumber: 1, text: `It was time to go to the dentist. James did NOT want to go. Anna did NOT want to go. But Mum said they must.`, illustrationPrompt: "James and Anna worried at home while Mum holds appointment cards." },
      { pageNumber: 2, text: `"The dentist is very kind," said Mum. "She just takes a little look inside your mouth. That is all."`, illustrationPrompt: "Mum gently reassuring James and Anna." },
      { pageNumber: 3, text: `James was not so sure. He made his most worried face all the way there. Anna held his hand.`, illustrationPrompt: "Anna holding James's hand on the way to the dentist." },
      { pageNumber: 4, text: `At the dentist, there was a big fish tank in the waiting room! Bright fish darted in and out of rocks and weeds.`, illustrationPrompt: "James and Anna looking at a big fish tank in the waiting room." },
      { pageNumber: 5, text: `James pressed his nose flat to the glass. "That one looks just like a tiny striped rocket!" he said.`, illustrationPrompt: "James pressing his nose to the fish tank glass." },
      { pageNumber: 6, text: `Anna found a book about sharks on the shelf. She sat down and read and read. She forgot to feel scared.`, illustrationPrompt: "Anna reading a shark picture book in the waiting room." },
      { pageNumber: 7, text: `"James!" called the dentist. He stood up. He walked in. The big chair went up and down like a ride!`, illustrationPrompt: "James in the dentist chair as it goes up and down." },
      { pageNumber: 8, text: `"Open wide!" said the dentist. She used a small mirror and a bright little light. "All done! Ten out of ten!" James grinned.`, illustrationPrompt: "Kind dentist checking James's teeth with mirror and light." },
      { pageNumber: 9, text: `James came out. "It did not hurt at all!" he said. "And the chair goes UP and DOWN!" Anna laughed.`, illustrationPrompt: "James returning to the waiting room excited and relieved." },
      { pageNumber: 10, text: `"Anna!" called the dentist. Anna walked in. She sat in the big chair. She had to admit — it was like a ride.`, illustrationPrompt: "Anna sitting in the dentist chair and starting to smile." },
      { pageNumber: 11, text: `The dentist sang a little tune while she checked Anna's teeth. Anna smiled the whole time. "Ten out of ten!" said the dentist.`, illustrationPrompt: "Dentist humming while checking Anna's teeth." },
      { pageNumber: 12, text: `"Well done, both of you," said Mum. "You were so brave today." They each got a sticker — James got a rocket, Anna got a star.`, illustrationPrompt: "James and Anna showing their stickers outside the dentist." },
      { pageNumber: 13, text: `That night, they brushed their teeth for a very long time. Chips sat at the bathroom door and watched. "Good night, Chips," said Anna. Chips blinked.`, illustrationPrompt: "James and Anna brushing teeth while Chips watches from the doorway." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-05-tree-house",
    title: "James and Anna build a Tree House",
    bookNumber: 5,
    theme: "building a tree house",
    sightWords: ["the", "said", "they", "were", "with", "there", "best"],
    targetPatterns: ["final-sounds", "digraphs", "blends", "dialogue"],
    pages: [
      { pageNumber: 1, text: `At the end of the garden stood a big old oak tree. James and Anna had been staring at it for days.`, illustrationPrompt: "James and Anna staring up at a big old oak tree." },
      { pageNumber: 2, text: `"We should build a tree house!" said James. He got his notebook and drew the plan right away. It had a door, a window, a flag and a rope ladder.`, illustrationPrompt: "James drawing a tree house plan in a notebook." },
      { pageNumber: 3, text: `Anna made a list. "We will need planks of wood, nails, rope, hinges and paint," she said. "And a flag."`, illustrationPrompt: "Anna making a building list while James listens." },
      { pageNumber: 4, text: `"I can help," said Dad, "but you two are in charge. You tell me the plan."`, illustrationPrompt: "Dad looking at James's plan under the oak tree." },
      { pageNumber: 5, text: `Dad did the tricky high bits — the tall planks and the big nails. James and Anna passed the tools and held the wood still.`, illustrationPrompt: "Dad on a ladder while James and Anna help with tools and wood." },
      { pageNumber: 6, text: `BANG! BANG! BANG! went the hammer. WHIRR! went the drill. The frame went up bit by bit.`, illustrationPrompt: "Action scene as the tree house frame goes up." },
      { pageNumber: 7, text: `Next came the floor — flat planks, all in a row. "Walk on it!" said Dad. They did. It held firm!`, illustrationPrompt: "James and Anna testing the new tree house floor." },
      { pageNumber: 8, text: `Then they made the walls and cut a little door. James helped saw a window hole with a small hand saw.`, illustrationPrompt: "James helping saw a window hole with Dad guiding." },
      { pageNumber: 9, text: `Now for the best bit — the paint! James chose blue for the walls. Anna chose yellow for the door. Chips chewed the lid off the paint tin.`, illustrationPrompt: "James painting blue walls, Anna painting the yellow door, Chips taking the paint lid." },
      { pageNumber: 10, text: `When the paint was dry, Anna cut a red star from felt and glued it on the flag. James fixed the flag to a long stick and tied it to the roof.`, illustrationPrompt: "Anna making the flag while James ties it to the roof." },
      { pageNumber: 11, text: `The tree house was done! Blue walls, a yellow door, a red star flag and a rope ladder all the way to the ground.`, illustrationPrompt: "Wide shot of the finished blue and yellow tree house." },
      { pageNumber: 12, text: `James and Anna climbed up and sat at the little window. "This is the best thing we have ever made," said Anna.`, illustrationPrompt: "James and Anna smiling from the tree house window." },
      { pageNumber: 13, text: `Mum sent up a tray of juice and biscuits on a rope. Dad waved from below. Chips jangled at the base of the tree, trying to reach the biscuits.`, illustrationPrompt: "A tray of juice and biscuits being hoisted to the tree house while Chips reaches up." },
      { pageNumber: 14, text: `That night, they got their sleeping bags and climbed up to sleep. Stars shone above them. "Best. Night. Ever," said James. Anna smiled. She agreed.`, illustrationPrompt: "Night scene with James and Anna in sleeping bags inside the glowing tree house." }
    ]
  })
];
