// One short poem per EL cycle, written around that cycle's focus sounds and
// high-frequency words, and starring our own book characters. The poem's world
// MATCHES the quest map's land bands (see themeWorldForCycle / worldForCycle):
//   Cycles 1-9   Meadow Farm     -> Muddy, Woolly, Clucky, Bouncy, Sleepy, Speedy, Tiny, Splashy
//   Cycles 10-18 Dinosaur Valley -> Chompy, Sunny, Dozy, Zippy, Honky, Wiggly, Cheeky (Sunny Hollow)
//   Cycles 19-27 Moonwood Forest -> Pip, Fern, Glimmer, Wren, Spark, Luna
// Used by the Poem station and the Present deck. Each poem still contains its
// findWords as whole words so the "find the word" round keeps working.
export const EL_CYCLE_POEMS = [
  // ── Cycles 1-9: Meadow Farm ──
  { cycle: 1, title: "Muddy's Map", lines: ["Muddy sits upon the mat,", "with a map of this and that.", "Up the hill to find the moon,", "Muddy hums a happy tune."], findWords: ["mat", "map", "sits"] },
  { cycle: 2, title: "Woolly in the Sun", lines: ["Woolly naps out in the sun,", "on top the hay - what fun!", "Bouncy hops up to the tent,", "and that is where the day was spent."], findWords: ["sun", "top", "tent"] },
  { cycle: 3, title: "Clucky's Nest", lines: ["Clucky builds a cosy nest,", "Tiny needs a little rest.", "Muddy dips a fishing net,", "then has a nap - not finished yet!"], findWords: ["nest", "net", "nap"] },
  { cycle: 4, title: "By the Farm Gate", lines: ["A fox trots past the old farm gate,", "the fish in Duck Pond swim so straight.", "The dog naps by the big red barn,", "while Muddy digs across the farm."], findWords: ["fox", "digs", "dog"] },
  { cycle: 5, title: "The Ox by the Pond", lines: ["An ox walks down beside the pond,", "and Splashy quacks and tags along.", "On top the hay the hens all camp,", "at night old Clucky lights the lamp."], findWords: ["ox", "top", "lamp"] },
  { cycle: 6, title: "Speedy Runs", lines: ["Speedy loves to run and run,", "in a red hat in the sun.", "Bouncy hops to the farm gate,", "then they both run home - it's late!"], findWords: ["run", "red", "hat"] },
  { cycle: 7, title: "Into the Barn", lines: ["\"Come into the barn,\" Muddy said,", "\"it's warm, and time for bed.\"", "The Meadow Pals played in the sun,", "until the day was done."], findWords: ["said", "into", "sun"] },
  { cycle: 8, title: "Woolly's Ball", lines: ["Woolly rolls the big round ball,", "it bounces off the garden wall.", "No wolf is near - just watch the sheep,", "they play until they fall asleep."], findWords: ["big", "wolf", "rolls"] },
  { cycle: 9, title: "Clucky the Queen", lines: ["Clucky is the farmyard queen,", "the proudest hen you've ever seen.", "But Muddy jumps up in the mud,", "and lands with a gentle thud."], findWords: ["but", "up", "mud"] },
  // ── Cycles 10-18: Dinosaur Valley ──
  { cycle: 10, title: "Chompy's Cap", lines: ["Chompy found a comfy cap,", "then Dozy took a valley nap.", "A cat naps near a mountain goat,", "beside the stream and little boat."], findWords: ["cat", "cap", "nap"] },
  { cycle: 11, title: "Count With Zippy", lines: ["Zippy counts to six - what fun!", "A pig naps in the sun.", "A fox runs past the ferny den,", "then Zippy zooms again."], findWords: ["pig", "six", "fox"] },
  { cycle: 12, title: "Off to the Vet", lines: ["Sunny finds a speckled egg,", "poor Wiggly bumped his leg.", "They drove the van to see the vet,", "the kindest one they've met."], findWords: ["egg", "van", "vet"] },
  { cycle: 13, title: "Zippy the Jet", lines: ["Sunny flies a bright red kite,", "Zippy zooms - a dino jet!", "Honky pours from a big jug,", "and Dozy gives a sleepy hug."], findWords: ["hug", "jet", "jug"] },
  { cycle: 14, title: "This Is Sunny Hollow", lines: ["This is Sunny Hollow, see,", "with dino pals like you and me.", "Bring your friends to play all day,", "in this warm and sunny way."], findWords: ["this", "with", "your"] },
  { cycle: 15, title: "Chompy's Chip", lines: ["Chompy nibbles one big chip,", "Honky dreams about a ship.", "No sheep live in the Hollow here,", "just dino pals to cheer!"], findWords: ["ship", "pals", "chip"] },
  { cycle: 16, title: "One and All", lines: ["The dino pals all share the ball,", "it bounces by the waterfall.", "\"Watch the little ant!\" honks Honky's call,", "\"come play, come play - one and all!\""], findWords: ["all", "ball", "ant"] },
  { cycle: 17, title: "Little Cheeky", lines: ["Little Cheeky and friends all like", "the leafy path, the valley hike.", "\"No igloo here!\" laughs Zippy with glee,", "\"just warm volcano lights for me.\""], findWords: ["little", "path", "like"] },
  { cycle: 18, title: "By Fossil Creek", lines: ["A frog swims where tall ferns grow more,", "along Fossil Creek's green shore.", "No ox lives in the Hollow, true,", "just dino friends for me and you."], findWords: ["frog", "ox", "more"] },
  // ── Cycles 19-27: Moonwood Forest ──
  { cycle: 19, title: "Up the Great Oak", lines: ["Pip climbs up the Great Oak tall,", "will put his cap beside the wall.", "He splashes in the puddle mud,", "and lands with a happy thud."], findWords: ["up", "put", "mud"] },
  { cycle: 20, title: "The Glowing Egg", lines: ["Wren has found a glowing egg,", "\"Get it safe!\" said Pip, \"I beg.\"", "Luna nodded, wise and very,", "\"Carry it gently - and be merry.\""], findWords: ["egg", "get", "very"] },
  { cycle: 21, title: "Who Sings?", lines: ["Who sings soft in the moonlit glen?", "What glows beyond the fen?", "When Luna counts the stars to ten,", "the Moonwood friends all play again."], findWords: ["who", "what", "when"] },
  { cycle: 22, title: "Pink Dawn", lines: ["A pink dawn lights the Moonwood trees,", "and mushrooms bob in the soft breeze.", "Glimmer gives a glowing wink,", "as berries float and never sink."], findWords: ["pink", "sink", "wink"] },
  { cycle: 23, title: "The Forest King", lines: ["The Great Oak is the forest king,", "he loves to hear the Moonwood sing.", "The friends all join the evening song,", "and hum and gently sway along."], findWords: ["king", "sing", "song"] },
  { cycle: 24, title: "Off They Go", lines: ["The silver bell rings off - ding, ding!", "Which Moonwood friend is first to spring?", "Fern flutters by the Crystal Stream,", "with Spark's bright farewell gleam."], findWords: ["off", "which", "bell"] },
  { cycle: 25, title: "Play Again", lines: ["\"Let's play again!\" the friends all say,", "a brand new Moonwood day.", "Pip and Luna read and play,", "\"hip hip hooray!\" they say."], findWords: ["again", "day", "say"] },
  { cycle: 26, title: "Spark Tries", lines: ["\"Why does Glimmer's fire fly high?\"", "\"My spark!\" laughs Spark, \"I'll try!\"", "Fern flutters way up high,", "and waves the clouds goodbye."], findWords: ["why", "my", "try"] },
  { cycle: 27, title: "First Friends", lines: ["Pip's best friend is here at last,", "Fern flies in - she's first, so fast!", "They share a berry, half each,", "in the Whispering Meadow's reach."], findWords: ["friend", "first", "half"] }
];
