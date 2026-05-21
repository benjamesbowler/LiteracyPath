const initialSoundAudioExamples = {
  b: "banana",
  c: "cookie",
  d: "door",
  f: "fan",
  g: "go",
  h: "house",
  l: "lion",
  m: "milk",
  n: "nose",
  p: "pizza",
  r: "rabbit",
  s: "snake",
  t: "table",
  w: "water",
  y: "yellow"
};

const finalSoundAudioExamples = {
  d: "road",
  f: "roof",
  g: "frog",
  k: "bike",
  l: "ball",
  m: "home",
  n: "green",
  p: "hop",
  s: "mouse",
  t: "light"
};

export const masteryExtraQuestions = [
  ...["m","s","t","p","b","n","f","g","d","l","r","h","c","w","y"].map((sound, i) => ({
    id: `extra_initial_${i + 1}`,
    grade: "K",
    skill: "initial sounds",
    difficulty: 1,
    passage: "",
    question: `Which word begins with the /${sound}/ sound?`,
    spokenPrompt: `Which word begins like ${initialSoundAudioExamples[sound]}?`,
    choices: {
      m:["moon","sun","fish","dog"],
      s:["sun","moon","fish","dog"],
      t:["top","sun","fish","dog"],
      p:["pig","sun","fish","dog"],
      b:["ball","sun","fish","dog"],
      n:["nest","sun","fish","dog"],
      f:["fish","sun","dog","map"],
      g:["goat","sun","fish","map"],
      d:["dog","sun","fish","map"],
      l:["leaf","sun","fish","dog"],
      r:["run","sun","fish","dog"],
      h:["hat","sun","fish","dog"],
      c:["cat","sun","fish","dog"],
      w:["web","sun","fish","dog"],
      y:["yak","sun","fish","dog"]
    }[sound],
    answer: {
      m:"moon", s:"sun", t:"top", p:"pig", b:"ball", n:"nest", f:"fish", g:"goat", d:"dog",
      l:"leaf", r:"run", h:"hat", c:"cat", w:"web", y:"yak"
    }[sound]
  })),

  ...["t","p","n","g","m","d","k","l","s","f"].map((sound, i) => ({
    id: `extra_final_${i + 1}`,
    grade: "K",
    skill: "final sounds",
    difficulty: 1,
    passage: "",
    question: `Which word ends with the /${sound}/ sound?`,
    spokenPrompt: `Which word ends like ${finalSoundAudioExamples[sound]}?`,
    choices: {
      t:["hat","ham","had","hag"],
      p:["map","mat","man","mad"],
      n:["sun","sup","sut","sub"],
      g:["dog","dot","dock","don"],
      m:["jam","jet","jag","jab"],
      d:["bed","bet","beg","ben"],
      k:["duck","dug","dun","dub"],
      l:["bell","bed","beg","ben"],
      s:["bus","bug","bun","but"],
      f:["leaf","leak","lead","lean"]
    }[sound],
    answer: {
      t:"hat", p:"map", n:"sun", g:"dog", m:"jam", d:"bed", k:"duck", l:"bell", s:"bus", f:"leaf"
    }[sound]
  })),

  ...[
    ["cat","hat",["hat","dog","sun","fish"]],
    ["bug","rug",["rug","cat","pen","fish"]],
    ["sun","run",["run","dog","map","book"]],
    ["bed","red",["red","cup","dog","fish"]],
    ["top","hop",["hop","sun","cat","pen"]],
    ["cake","lake",["lake","dog","fish","sun"]],
    ["fish","dish",["dish","cat","bug","pen"]],
    ["king","ring",["ring","dog","cat","sun"]],
    ["boat","coat",["coat","bed","fish","map"]],
    ["star","car",["car","dog","pen","bug"]],
    ["moon","spoon",["spoon","cat","fish","dog"]],
    ["light","night",["night","log","bug","pen"]],
    ["bee","tree",["tree","sun","dog","cat"]],
    ["goat","coat",["coat","fish","bed","cup"]],
    ["chair","bear",["bear","dog","sun","fish"]]
  ].map(([target, answer, choices], i) => ({
    id: `extra_rhyme_${i + 1}`,
    grade: "K",
    skill: "rhyming",
    difficulty: 1,
    passage: "",
    question: `Which word rhymes with ${target}?`,
    choices,
    answer
  })),

  ...[
    ["cat","mat",["mat","met","mit","mop"]],
    ["bag","map",["map","mop","mug","men"]],
    ["pet","red",["red","rad","rid","rod"]],
    ["hen","pen",["pen","pan","pin","pun"]],
    ["pig","sit",["sit","sat","set","sot"]],
    ["fin","pin",["pin","pan","pen","pun"]],
    ["dog","hop",["hop","hip","hap","hep"]],
    ["log","pot",["pot","pat","pit","pet"]],
    ["cup","rug",["rug","rag","rig","rog"]],
    ["mud","cup",["cup","cap","cop","cip"]]
  ].map(([target, answer, choices], i) => ({
    id: `extra_short_vowel_${i + 1}`,
    grade: "K",
    skill: "short vowel discrimination",
    difficulty: 2,
    passage: "",
    question: `Which word has the same middle sound as ${target}?`,
    spokenPrompt: `Which word has the same vowel sound as ${target}?`,
    choices,
    answer
  }))
];
