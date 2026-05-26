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
  qaStatus: "needs_review",
  qaNotes: "Imported image is present but needs text-picture QA before student release.",
  active: true
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
  qaNotes: "Teacher preview only until every page image is confirmed to match the text.",
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
  availableStoryPageCount: pages.length,
  missingStoryPages: [],
  pages: pages.map(page => createJamesPage({ bookNumber, ...page }))
});

const aidenPagePath = (bookNumber, pageNumber) =>
  seriesPagePath("aiden-and-betty", bookNumber, pageNumber);

const aidenCoverPath = bookNumber =>
  seriesCoverPath("aiden-and-betty", bookNumber);

const createAidenPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: aidenPagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: "needs_review",
  qaNotes: "Imported image is present but needs text-picture QA before student release.",
  active: true
});

const createAidenAndBettyBook = ({
  id,
  title,
  bookNumber,
  theme,
  targetPatterns,
  sightWords,
  pages
}) => ({
  id,
  seriesId: "aiden-and-betty",
  seriesTitle: "Aiden and Betty",
  seriesName: "Aiden and Betty",
  title,
  type: "fiction",
  category: "fiction",
  level: "C",
  guidedReadingLevel: "C",
  ageRange: "6-7",
  bookNumber,
  order: bookNumber,
  author: "Nora Bell",
  illustrator: "Kimi",
  status: "teacher_preview",
  qaStatus: "needs_review",
  qaNotes: "Teacher preview only until every page image is confirmed to match the text.",
  active: false,
  teacherPreviewOnly: true,
  source: "aiden_and_betty_level_c_pack_2026_05_26",
  coverImage: aidenCoverPath(bookNumber),
  targetSkills: ["level-c", "fiction", "chapter-style-sentences"],
  sightWords,
  targetPatterns,
  theme,
  characterReference: {
    aiden: "Aiden is 6-7 with fair skin, freckles, sandy-blonde hair, an orange hoodie with a white lightning bolt, dark grey trousers, and white trainers with orange laces.",
    betty: "Betty is 6-7 with warm medium-brown skin, a neat brown bob, a blue Alice headband, a teal T-shirt, white dungarees, and blue-and-white canvas trainers.",
    socks: "Socks is a small monkey with cream-white fur on face and chest, darker brown on back, black hands and feet, and a tiny red waistcoat."
  },
  imageGenerationReference:
    "Keep Aiden, Betty, and Socks consistent across the Level C series. Use the source page text and prompt for each page; no non-diegetic embedded text, captions, or page numbers.",
  expectedStoryPageCount: pages.length,
  availableStoryPageCount: pages.length,
  missingStoryPages: [],
  pages: pages.map(page => createAidenPage({ bookNumber, ...page }))
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
  }),
  createAidenAndBettyBook({
    id: "ab-c-01",
    title: "Aiden and Betty Start Grade 1",
    bookNumber: 1,
    theme: "first day of Grade 1",
    sightWords: ["the", "was", "said", "with", "their", "were", "they", "both"],
    targetPatterns: ["level-c", "longer-sentences", "dialogue", "school-vocabulary"],
    pages: [
      { pageNumber: 1, text: `The summer holidays were over at last. Aiden sat on his bed and stared at his new school bag. Grade 1. The words sounded bigger than they looked.`, illustrationPrompt: "Aiden sitting on his bed, staring at a new school bag on the floor." },
      { pageNumber: 2, text: `Betty was not worried at all. She had already packed her bag twice. "We're going to have proper lessons and proper homework," she said, bouncing on her toes. "Isn't that brilliant?" Aiden wasn't absolutely sure that it was.`, illustrationPrompt: "Betty excited in the hallway with her school bag while Aiden looks uncertain." },
      { pageNumber: 3, text: `Their new classroom was bright and busy, with bookshelves along every wall and a large window that looked out onto the playing field. Their teacher was called Miss Okafor. She had bright yellow glasses and smiled like she really meant it.`, illustrationPrompt: "Aiden and Betty entering a bright classroom with Miss Okafor greeting them." },
      { pageNumber: 4, text: `"In Grade 1," said Miss Okafor, "we will read chapter books, solve number puzzles and begin to understand how the world around us works." Aiden thought that sounded like an awful lot — but he found he was leaning forward slightly without meaning to.`, illustrationPrompt: "Miss Okafor addressing the class while Aiden leans forward with interest." },
      { pageNumber: 5, text: `Everyone had their own desk with a name label. Aiden's said AIDEN in neat blue letters. He ran his finger over it slowly and felt, just slightly, like it might turn out to be all right.`, illustrationPrompt: "Close-up of Aiden tracing the name label on his desk." },
      { pageNumber: 6, text: `The first lesson was handwriting — joined-up letters, which were completely new and seemed designed to be tricky. Aiden's pen slipped and he made a large blot right across the middle of the page. He went very red.`, illustrationPrompt: "Aiden staring at a large ink blot on his handwriting page." },
      { pageNumber: 7, text: `Betty leaned over and showed him her page quietly. Her joined-up writing was also not her best work. "Mine looks like a wonky caterpillar," she whispered. Aiden laughed before he could stop himself, and his face stopped being red.`, illustrationPrompt: "Betty showing Aiden her wonky handwriting while he laughs with relief." },
      { pageNumber: 8, text: `At lunch, they sat together by the window. Aiden opened his lunchbox and found a small folded note from Mum tucked under his sandwich. It said: You've got this, star. He smiled all the way through his apple.`, illustrationPrompt: "Aiden reading Mum's note at lunch beside Betty." },
      { pageNumber: 9, text: `After lunch came Maths. Miss Okafor wrote sums on the board, each one slightly harder than the last. Some of them made Aiden's brain feel stretched in an unfamiliar way. He was discovering that this was not entirely a bad feeling.`, illustrationPrompt: "Aiden concentrating hard during Maths while Miss Okafor writes sums." },
      { pageNumber: 10, text: `Betty answered three questions out loud and got them all right. Aiden raised his hand once, very carefully, and he got his right too. Miss Okafor stuck a gold star beside both their names on the board. Aiden looked at his star for quite a long time.`, illustrationPrompt: "Miss Okafor placing gold stars beside Aiden and Betty's names." },
      { pageNumber: 11, text: `Then there was Science — real Science, with a magnifying glass and a tray of soil and seeds. Aiden forgot to be nervous. He was too busy looking at a woodlouse through the magnifying glass and writing down exactly what he saw.`, illustrationPrompt: "Aiden absorbed in a science activity with a magnifying glass and notebook." },
      { pageNumber: 12, text: `At home time, Mum was waiting at the gate. She crouched down with an expectant look. "Well?" she said. They both started talking at exactly the same moment and didn't stop for ten minutes.`, illustrationPrompt: "Mum at the school gate as Aiden and Betty talk over each other." },
      { pageNumber: 13, text: `"Grade 1 is brilliant," announced Betty, just before bed. "It's actually not that bad," said Aiden, which from Aiden meant exactly the same thing. He turned his light off, closed his eyes, and was asleep before he could think of anything to worry about.`, illustrationPrompt: "Aiden peacefully in bed at night after his first Grade 1 day." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-02",
    title: "Aiden and Betty have a Yard Sale",
    bookNumber: 2,
    theme: "yard sale and choosing what to keep",
    sightWords: ["the", "was", "said", "they", "with", "were", "could", "some"],
    targetPatterns: ["level-c", "dialogue", "money-vocabulary", "problem-solving"],
    pages: [
      { pageNumber: 1, text: `It was the first warm Saturday of spring, and Aiden and Betty stood in the middle of the playroom staring at something that had got entirely out of control. Toys, books, games and puzzles were piled up to the shelves. There was even a foam sword that neither of them remembered buying.`, illustrationPrompt: "Aiden and Betty in a playroom full of toys, books, games, and puzzles." },
      { pageNumber: 2, text: `"We should have a yard sale," said Betty. She said it the way she said all her best ideas — quickly and firmly, as though the idea had already made up its mind. "We could make actual money." Aiden wasn't certain at first, but when she said the word money, he started to listen.`, illustrationPrompt: "Betty announcing the yard sale idea while Aiden starts to listen." },
      { pageNumber: 3, text: `They spent Friday evening sorting everything into three piles: SELL, KEEP and MAYBE. The MAYBE pile kept losing things to SELL, because, as Betty pointed out, they hadn't touched any of them in over a year. By nine o'clock, the MAYBE pile had completely disappeared.`, illustrationPrompt: "Aiden and Betty sorting toys into labelled piles." },
      { pageNumber: 4, text: `Betty made neat round price stickers on square labels, writing each price in her best handwriting. Aiden made the sign for the front gate — YARD SALE: EVERYTHING MUST GO — in six colours, with three exclamation marks, then a fourth one, just to make sure.`, illustrationPrompt: "Betty writing price stickers while Aiden makes a colourful yard sale sign." },
      { pageNumber: 5, text: `On Saturday morning, they dragged two folding tables out to the front path and arranged everything carefully. The old teddies sat in a row at the back and looked slightly sorry for themselves. "They'll go to good homes," said Aiden, mostly to himself, as a form of reassurance.`, illustrationPrompt: "Aiden and Betty arranging yard sale tables on the front path." },
      { pageNumber: 6, text: `Their first customer was Mr Perkins from next door, who was very old and took a very long time about everything. He picked up every single item on the table, turned it over carefully, and put it back. After twenty minutes, he held up one small rubber duck. It cost twenty cents.`, illustrationPrompt: "Mr Perkins slowly examining items at the yard sale." },
      { pageNumber: 7, text: `Then things got busy. Children came from further up the street with their parents. A woman bought a whole crate of craft supplies without looking at any of them. A small boy bought four plastic dinosaurs and a jigsaw puzzle and carried them away in a tight proud bundle. Things were selling faster than Betty could write them down.`, illustrationPrompt: "A busy yard sale with children and parents buying things." },
      { pageNumber: 8, text: `By midday, more than half the table was clear. Betty sat down on the front step and counted the money tin carefully, then counted it again. "Forty-eight dollars and thirty cents," she announced. Aiden let out a long, astonished breath, which was all he could manage.`, illustrationPrompt: "Betty counting the money tin while Aiden looks astonished." },
      { pageNumber: 9, text: `A girl called Rosa arrived late with her grandmother and spent a thoughtful amount of time choosing. She ended up with three books, a snow globe and the foam sword, which she tucked under her arm like a very satisfied general. Aiden watched the sword go and found he didn't mind at all.`, illustrationPrompt: "Rosa choosing books, a snow globe, and the foam sword." },
      { pageNumber: 10, text: `They had set up a lemonade stand beside the sale table — Betty's idea, planned the previous Thursday. Aiden poured from a glass jug. Betty collected the money and kept the queue moving. By one o'clock they had sold every cup and run entirely out of lemons.`, illustrationPrompt: "Aiden and Betty running a lemonade stand beside the yard sale." },
      { pageNumber: 11, text: `"What shall we spend it on?" Betty asked. They sat on the front step with the money tin between them and talked it through the way they talked through important things — slowly and carefully, considering every option.`, illustrationPrompt: "Aiden and Betty sitting on the front step with the money tin." },
      { pageNumber: 12, text: `They agreed on a proper tent for the garden — not a tiny pop-up one but a real one with a porch and a little vent window. Somewhere they could take their books on rainy afternoons and feel like they were somewhere else entirely.`, illustrationPrompt: "Aiden and Betty imagining a proper garden tent for reading." },
      { pageNumber: 13, text: `As Aiden folded up the last table, he found something wedged at the very back — his old stuffed elephant, Nelly, who he had completely forgotten was there. He held her for a long moment. Then he carried her inside and put her on the shelf above his desk. Some things, he decided, were not for selling.`, illustrationPrompt: "Aiden finding his old stuffed elephant Nelly after the yard sale." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-03",
    title: "Aiden and Betty go on Holiday",
    bookNumber: 3,
    theme: "coastal family holiday",
    sightWords: ["the", "was", "said", "they", "were", "with", "there", "their"],
    targetPatterns: ["level-c", "setting-description", "dialogue", "holiday-vocabulary"],
    pages: [
      { pageNumber: 1, text: `The last day of the summer term was also the loudest day of the school year. Aiden and Betty burst through the front door and both shouted "HOLIDAY!" at exactly the same moment, which echoed all the way up the stairs and made the dog next door bark.`, illustrationPrompt: "Aiden and Betty bursting through the front door shouting holiday." },
      { pageNumber: 2, text: `They were going to the coast for a whole week — a small blue cottage right on the clifftop, with a gate in the garden wall that opened straight onto the coastal path. Mum had booked it in January. They had been counting down ever since.`, illustrationPrompt: "A blue clifftop cottage by the coastal path." },
      { pageNumber: 3, text: `The drive took three hours. Betty counted every red car they passed. Aiden read two chapters of his book, fell asleep on his own shoulder, woke up, read another chapter, and then asked "Are we nearly there?" for the fourth time. They were, finally, nearly there.`, illustrationPrompt: "Aiden and Betty in the family car on the long drive to the coast." },
      { pageNumber: 4, text: `The cottage smelled of sea salt and old wood and something warm that Aiden couldn't name. They raced upstairs to choose rooms. There was a small room and a slightly bigger room. They flipped a coin — Aiden got the bigger room, but Betty got the one with the sea view, which meant it was perfectly even.`, illustrationPrompt: "Aiden and Betty choosing bedrooms in the seaside cottage." },
      { pageNumber: 5, text: `The beach was a five-minute walk down a steep sandy path through tall marram grass. When they came over the last dune and the sea appeared — wide and green and going all the way to the horizon — Aiden stopped walking entirely and just looked for a long moment.`, illustrationPrompt: "Aiden and Betty seeing the sea from the dunes." },
      { pageNumber: 6, text: `Aiden spent the whole first morning at a rock pool near the headland. He found three kinds of crab, a sea anemone that closed when you touched it, and a tiny fish he thought might be a blenny. He wrote everything down in his field notebook in careful columns.`, illustrationPrompt: "Aiden studying a rock pool and writing in his field notebook." },
      { pageNumber: 7, text: `Betty was brilliant at boogie boarding from the very first wave. She rode it all the way to shore, fell off, laughed, and waded back in immediately. By the afternoon she was steering around in the foam. Dad tried it once and fell off at once, which everyone found funny, including Dad.`, illustrationPrompt: "Betty boogie boarding while Dad falls off and everyone laughs." },
      { pageNumber: 8, text: `On Wednesday it rained all morning. They played three rounds of Cluedo, drank hot chocolate in large mugs and listened to the rain hammer against the cottage windows. It was, Aiden thought, pressing his mug to his chin, one of the cosiest mornings he could remember.`, illustrationPrompt: "A rainy cottage morning with board games and hot chocolate." },
      { pageNumber: 9, text: `The lighthouse was Dad's idea. It was tall and white and stood on a headland two miles along the coastal path. There were one hundred and forty-seven steps to the top — they counted every single one, out loud, all together, and arrived slightly out of breath but very proud.`, illustrationPrompt: "The family climbing the lighthouse stairs." },
      { pageNumber: 10, text: `The view from the top was unlike anything Aiden had seen. The whole coastline curved away in both directions — bays and headlands, a small fishing village far below, and the sea stretching to the horizon, catching the light like crinkled silver foil.`, illustrationPrompt: "Aiden and Betty looking out from the top of the lighthouse." },
      { pageNumber: 11, text: `On their last evening, they sat on the sea wall with fish and chips wrapped in paper. The chips were crispy and perfectly salty. Aiden told Mum they were the best chips he had ever eaten in his entire life, and Mum said that was the sea air doing it, and she was right.`, illustrationPrompt: "The family eating fish and chips on the sea wall." },
      { pageNumber: 12, text: `Betty found a small smooth white pebble at the shoreline and turned it over and over in her fingers all the way back to the cottage. She was going to put it on her windowsill at home, so she'd always have a piece of the coast — something real from a real day.`, illustrationPrompt: "Betty holding a smooth white pebble at the shoreline." },
      { pageNumber: 13, text: `The drive home felt half as long as the drive there, which Aiden thought was mathematically impossible. When they turned into their street, the house looked completely the same as when they'd left it. Aiden noticed he felt, quietly, like he was a little bit different.`, illustrationPrompt: "Aiden and Betty arriving home after their holiday." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-04",
    title: "Aiden and Betty and Socks",
    bookNumber: 4,
    theme: "meeting Socks the monkey",
    sightWords: ["the", "was", "said", "they", "with", "from", "his", "he"],
    targetPatterns: ["level-c", "animal-care", "dialogue", "character-description"],
    pages: [
      { pageNumber: 1, text: `It was an ordinary Saturday in late August when Uncle Eddie arrived at the door with a travelling bag, a very wide smile, and something small and determined making a noise from inside his coat.`, illustrationPrompt: "Uncle Eddie arriving with a travelling bag and something small in his coat." },
      { pageNumber: 2, text: `Uncle Eddie was Dad's younger brother, and he was a wildlife researcher who had spent the last two years living near a tropical rainforest, studying primates. He had, apparently, brought one with him.`, illustrationPrompt: "Uncle Eddie explaining his wildlife research while Aiden and Betty listen." },
      { pageNumber: 3, text: `Carefully, Uncle Eddie unzipped the carry-case. Inside, curled up like a small comma, was the most compact monkey Aiden had ever seen. He had cream-white fur on his face and chest, darker brown on his back, and small black hands and feet that looked, unmistakably, like he was wearing a pair of extremely neat little socks.`, illustrationPrompt: "Uncle Eddie opening the carry-case to reveal Socks." },
      { pageNumber: 4, text: `"His name is Socks," said Uncle Eddie. "He was orphaned when he was very small, and I've raised him from a baby. He understands a lot of what you say, he copies behaviour, and he is completely tame." He paused just a moment. "He is also, just occasionally, a little bit naughty."`, illustrationPrompt: "Uncle Eddie introducing Socks to the family." },
      { pageNumber: 5, text: `Socks looked at Aiden. Then he looked at Betty. Then he reached out one small black hand, calmly removed Aiden's watch from Aiden's wrist, and put it on his own. He looked at it with great satisfaction. "Charming," said Mum. "Yes," said Uncle Eddie, completely unsurprised.`, illustrationPrompt: "Socks removing Aiden's watch and putting it on himself." },
      { pageNumber: 6, text: `Uncle Eddie explained that he was returning to the rainforest for six months and couldn't bring Socks along this time. He looked at Dad with a hopeful expression. Dad said yes before Mum could say anything at all, which was exactly what Mum had expected him to do.`, illustrationPrompt: "Uncle Eddie asking Dad to care for Socks while Mum reacts." },
      { pageNumber: 7, text: `Socks explored the house in eleven minutes. He opened every drawer he could reach, rearranged the fruit bowl into a different order, sat briefly on each windowsill and posted three letters from the hall table into the back of the television. He seemed very pleased with his work.`, illustrationPrompt: "Socks mischievously exploring and rearranging the house." },
      { pageNumber: 8, text: `"He loves shiny objects," Uncle Eddie explained at dinner. "He adores warm spots — the airing cupboard is a particular risk. And if he gets bored, he will find a way to become interesting." Everyone filed this information away carefully.`, illustrationPrompt: "Uncle Eddie explaining Socks's habits at dinner." },
      { pageNumber: 9, text: `Socks sat at the table in a tiny red waistcoat that Uncle Eddie had stitched for him. He watched everyone use their fork with great attention. Then he picked up his own fork and used it correctly. Then he threw the fork across the room. "He does that every evening," said Uncle Eddie. "We've never understood why."`, illustrationPrompt: "Socks at the dinner table using and then throwing a fork." },
      { pageNumber: 10, text: `That night, Dad built Socks a cosy sleeping box — a wooden crate lined with a soft fleece blanket — and settled it in the warm corner of the kitchen. In the morning, Socks was not in it. He was curled up fast asleep at the foot of Aiden's bed, his small black hand curled around Aiden's pencil torch.`, illustrationPrompt: "Socks asleep at the foot of Aiden's bed with a pencil torch." },
      { pageNumber: 11, text: `Over the following weeks, Socks wove himself into the house. He had his own peg for his waistcoat. He met them at the door when they came home from school. He sat on Dad's shoulder while Dad read the newspaper and turned the pages for him, very seriously.`, illustrationPrompt: "Socks becoming part of family routines at home." },
      { pageNumber: 12, text: `He was also, as promised, occasionally naughty. He dropped a teaspoon into the toaster. He unravelled the entire roll of cling film in the kitchen drawer. He stole every single one of Betty's hair bobbles and lined them up on the windowsill in a precise order that nobody could explain.`, illustrationPrompt: "Socks causing small household mischief with hair bobbles and cling film." },
      { pageNumber: 13, text: `"He is completely impossible," said Mum, as she did most evenings. But she had also started setting a small dish of whatever she was cooking on the corner of the counter every night, because Socks knew exactly where it appeared and waited there very patiently, and she had not been able to bring herself to stop.`, illustrationPrompt: "Mum setting a small dish of food on the counter for Socks." },
      { pageNumber: 14, text: `Aiden had been keeping a field notebook — just as Uncle Eddie had shown him. He had titled it: Socks: A Field Study. He had written things like: Prefers grapes to apple. Expresses disapproval by sitting with back turned. Unusually precise about the order of objects. He turned to a fresh page. It was going to take a very long time to fully understand Socks. He hoped, quietly, that he had the time.`, illustrationPrompt: "Aiden writing careful notes about Socks in his field notebook." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-05",
    title: "Socks Goes Missing",
    bookNumber: 5,
    theme: "finding missing Socks",
    sightWords: ["the", "was", "said", "they", "with", "where", "could", "there"],
    targetPatterns: ["level-c", "mystery", "dialogue", "emotional-arc"],
    pages: [
      { pageNumber: 1, text: `It started with the waistcoat hook being empty.`, illustrationPrompt: "Close-up of the empty hook where Socks's waistcoat usually hangs." },
      { pageNumber: 2, text: `Every morning, Socks sat on the kitchen counter and waited while Betty did up the buttons on his little red waistcoat, which always lived on its own peg beside the back door. But on a Tuesday in October, the peg was empty. And when Aiden went to check, Socks's sleeping box in the corner of his room was empty too.`, illustrationPrompt: "Aiden discovering Socks's sleeping box is empty." },
      { pageNumber: 3, text: `They searched everywhere. Aiden checked under every sofa cushion and behind every bookshelf. Betty methodically looked in every high cupboard. Mum turned the garden upside down. Dad searched the garden again, more systematically, with a torch — even though it was daytime. Socks was not anywhere.`, illustrationPrompt: "The family searching everywhere for Socks." },
      { pageNumber: 4, text: `"He couldn't have got out," said Dad. "All the windows were shut last night." Then Mum remembered the bathroom window — the small one above the bath, left open just a crack for steam. She looked at Aiden and Aiden looked at Betty. A crack that was, they all realised at the same moment, almost exactly the width of a small monkey.`, illustrationPrompt: "The family realising Socks may have escaped through the bathroom window." },
      { pageNumber: 5, text: `They went out onto the pavement and called his name. "Socks! Socks!" The October wind moved through the trees and sent leaves skittering across the path. No small monkey appeared. Aiden put his hands in his pockets and tried not to feel too worried. It didn't work very well.`, illustrationPrompt: "Aiden and Betty calling for Socks on the autumn pavement." },
      { pageNumber: 6, text: `Betty designed a MISSING MONKEY poster on her tablet in under five minutes. It had a photograph of Socks in his waistcoat, a written description, and their phone number in large digits. She printed fourteen copies. They posted them through letter boxes up and down both sides of the street without stopping.`, illustrationPrompt: "Aiden and Betty posting missing monkey flyers." },
      { pageNumber: 7, text: `Aiden re-read his field notebook carefully, looking for anything useful. He had written: Drawn to shiny objects. Drawn to warm spots. Will follow interesting smells. Exceptionally good at getting into places he shouldn't. He stared at that last line for quite a long time. It did not narrow things down.`, illustrationPrompt: "Aiden reading his field notebook on the front step." },
      { pageNumber: 8, text: `By three o'clock, the sky had gone grey and the wind had picked up. Aiden was sitting on the front step, not saying much. He kept thinking about what Uncle Eddie had said once: that animals raised by hand always know where home is. He held onto that thought very carefully.`, illustrationPrompt: "Aiden sitting quietly on the front step, worried about Socks." },
      { pageNumber: 9, text: `Then the phone rang. It was their neighbour Mrs Obi, from number thirty-seven, three houses down. Her voice was very precise. "I believe," she said carefully, "that there may be a small monkey in my kitchen. He appears to be eating my shortbread."`, illustrationPrompt: "Mum answering the phone and realising Socks has been found." },
      { pageNumber: 10, text: `They ran. All four of them, in their socks, without stopping to find shoes, down the pavement to number thirty-seven. They could hear, even from the gate, a small and very determined crunching sound coming from inside.`, illustrationPrompt: "The family running down the street in their socks." },
      { pageNumber: 11, text: `There was Socks, sitting on Mrs Obi's kitchen counter beside an open shortbread tin. He was wearing his waistcoat — which they had also assumed was missing — and had crumbs on his face and the expression of someone who sees absolutely no problem with any of this whatsoever.`, illustrationPrompt: "Socks on Mrs Obi's kitchen counter eating shortbread." },
      { pageNumber: 12, text: `"How on earth did he get in?" asked Dad. Mrs Obi pointed to the cat flap in her back door. Of course. Socks had worked out the cat flap. He had also — from the state of the shortbread tin — clearly been in before, which nobody had known and which explained certain things about Mrs Obi's biscuit situation.`, illustrationPrompt: "Mrs Obi pointing to the cat flap while the family understands." },
      { pageNumber: 13, text: `Aiden picked him up and held him. Socks was warm and solid and smelled faintly of shortbread. He patted Aiden's cheek twice with one small black hand, the way he sometimes did when he felt like being kind, and then tucked his head under Aiden's chin. Aiden breathed out slowly.`, illustrationPrompt: "Aiden holding Socks with quiet relief." },
      { pageNumber: 14, text: `On the way home, Betty said they needed a tracker collar. Aiden said they needed to block every cat flap on the street. Mum said they needed a more interesting biscuit tin. Dad said they should call Uncle Eddie and tell him what his monkey had been up to. They all laughed, and kept laughing, all the way home — and Socks rode on Aiden's shoulder the whole way, looking, as always, entirely pleased with himself.`, illustrationPrompt: "The family walking home laughing with Socks on Aiden's shoulder." }
    ]
  })
];
