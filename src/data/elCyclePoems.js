// One short poem per EL cycle, written around that cycle's focus sounds and
// high-frequency words, and starring our own book characters. The world rotates
// every three cycles (see themeWorldForCycle):
//   Meadow Pals   -> Muddy, Woolly, Clucky, Bouncy, Sleepy, Speedy, Tiny
//   Dino Pals     -> Chompy, Sunny, Dozy, Zippy, Honky, Wiggly, Cheeky (Sunny Hollow)
//   Moonwood Tales-> Pip, Fern, Stone, Glimmer, Wren, Spark, Luna, Dewdrop
// Used by the Poem station and the Present deck. Each poem still contains its
// findWords as whole words so the "find the word" round keeps working.
export const EL_CYCLE_POEMS = [
  // ── Cycles 1-3: Meadow Pals ──
  { cycle: 1, title: "Muddy's Map", lines: ["Muddy sits upon the mat,", "with a map of this and that.", "Up the hill to find the moon,", "Muddy hums a happy tune."], findWords: ["mat", "map", "moon"] },
  { cycle: 2, title: "Woolly in the Sun", lines: ["Woolly naps out in the sun,", "on top the hay - what fun!", "Bouncy hops up to the tent,", "and that is where the day was spent."], findWords: ["sun", "top", "tent"] },
  { cycle: 3, title: "Clucky's Nest", lines: ["Clucky builds a cosy nest,", "Tiny needs a little rest.", "Muddy dips a fishing net,", "then has a nap - not finished yet!"], findWords: ["nest", "net", "nap"] },
  // ── Cycles 4-6: Dino Pals ──
  { cycle: 4, title: "Quick Little Zippy", lines: ["Zippy is as quick as a fox,", "a fish swims by the rocks.", "No dog lives in the Hollow, no -", "just dino pals on the go."], findWords: ["fox", "fish", "dog"] },
  { cycle: 5, title: "Dozy's Lamp", lines: ["An otter plays on top the log,", "by Cozy Cave in the fog.", "When night is dark and damp,", "Dozy lights the little lamp."], findWords: ["otter", "top", "lamp"] },
  { cycle: 6, title: "Zippy Runs", lines: ["Zippy loves to run and run,", "in a red hat in the sun.", "Chompy stomps to the cave door,", "then Zippy runs some more."], findWords: ["run", "red", "hat"] },
  // ── Cycles 7-9: Moonwood Tales ──
  { cycle: 7, title: "Into the Oak", lines: ["\"Come into the Oak,\" Pip said,", "\"it's warm, and time for bed.\"", "The Moonwood friends played in the sun,", "until the day was done."], findWords: ["said", "into", "sun"] },
  { cycle: 8, title: "Stone's Ball", lines: ["Stone rolls the big round ball,", "it bounces off the wall.", "No wolf is near - just watch!", "Fern and Pip cheer and clap."], findWords: ["ball", "wolf", "watch"] },
  { cycle: 9, title: "Wren the Queen", lines: ["Wren is the spell-book queen,", "the cleverest you've seen.", "But Stone jumps up in the mud,", "and lands with a gentle thud."], findWords: ["queen", "up", "mud"] },
  // ── Cycles 10-12: Meadow Pals ──
  { cycle: 10, title: "Muddy's Cap", lines: ["Muddy found a comfy cap,", "Sleepy took a cosy nap.", "The cat sat near the friendly goat,", "beside the pond and little boat."], findWords: ["cat", "cap", "goat"] },
  { cycle: 11, title: "Count With Clucky", lines: ["Clucky counts to six - all done,", "the pig is in the sun.", "A fox runs past the pen,", "then Bouncy hops again."], findWords: ["pig", "six", "fox"] },
  { cycle: 12, title: "Off to the Vet", lines: ["Clucky lays a little egg,", "Muddy bumped his leg.", "They drove the van to the vet,", "the kindest one they've met."], findWords: ["egg", "van", "vet"] },
  // ── Cycles 13-15: Dino Pals ──
  { cycle: 13, title: "Zippy the Jet", lines: ["Sunny flies a bright red kite,", "Zippy zooms - a dino jet!", "Honky pours from a big jug,", "and Dozy gives a sleepy hug."], findWords: ["kite", "jet", "jug"] },
  { cycle: 14, title: "This Is Sunny Hollow", lines: ["This is Sunny Hollow, see,", "with dino pals like you and me.", "Bring your friends to play all day,", "in this warm and sunny way."], findWords: ["this", "with", "your"] },
  { cycle: 15, title: "Chompy's Chip", lines: ["Chompy nibbles one big chip,", "Honky dreams about a ship.", "No sheep live in the Hollow here,", "just dino pals to cheer!"], findWords: ["ship", "sheep", "chip"] },
  // ── Cycles 16-18: Moonwood Tales ──
  { cycle: 16, title: "One and All", lines: ["The Moonwood friends all share the ball,", "it bounces by the waterfall.", "\"Watch the little ant!\" calls Fern,", "\"one and all - it's everyone's turn!\""], findWords: ["all", "ball", "ant"] },
  { cycle: 17, title: "Little Spark", lines: ["Little Spark and friends all like", "the glowing path, the mushroom hike.", "\"No igloo here!\" laughs Pip with glee,", "\"just Moonwood lights for you and me.\""], findWords: ["little", "igloo", "like"] },
  { cycle: 18, title: "By the Stream", lines: ["An otter swims where mushrooms grow more,", "by the Crystal Stream's far shore.", "No ox lives in Moonwood, true,", "just magic friends for me and you."], findWords: ["otter", "ox", "more"] },
  // ── Cycles 19-21: Meadow Pals ──
  { cycle: 19, title: "Up the Haystack", lines: ["Muddy climbs up the haystack tall,", "will put his hat beside the wall.", "He splashes in the puddle mud,", "and lands with a happy thud."], findWords: ["up", "put", "mud"] },
  { cycle: 20, title: "Clucky's Egg", lines: ["Clucky found a speckled egg,", "\"Get it safe!\" said Muddy, \"I beg.\"", "Woolly nodded, wise and very,", "\"Carry it gently - and be merry.\""], findWords: ["egg", "get", "very"] },
  { cycle: 21, title: "Who Clucks?", lines: ["Who clucks loud in the barn at dawn?", "What hops across the lawn?", "When Woolly counts the sheep to ten,", "the Meadow Pals all play again."], findWords: ["who", "what", "when"] },
  // ── Cycles 22-24: Dino Pals ──
  { cycle: 22, title: "Pink Dawn", lines: ["A pink dawn lights up Sunny Hollow,", "Wiggly's long tail starts to follow.", "Cheeky gives a cheeky wink,", "as berries bob and never sink."], findWords: ["pink", "sink", "wink"] },
  { cycle: 23, title: "The Hollow King", lines: ["Chompy is the Hollow king,", "he loves to hear them sing.", "The dino pals all join the song,", "and stomp and clap along."], findWords: ["king", "sing", "song"] },
  { cycle: 24, title: "Off They Go", lines: ["The dino bell goes off - ding, ding!", "Which pal will be first to spring?", "Zippy zooms by Mount Rumble's swell,", "with Honky's loud farewell."], findWords: ["off", "which", "bell"] },
  // ── Cycles 25-27: Moonwood Tales ──
  { cycle: 25, title: "Play Again", lines: ["\"Let's play again!\" the friends all say,", "a brand new Moonwood day.", "Pip and Luna read and play,", "\"hip hip hooray!\" they say."], findWords: ["again", "day", "say"] },
  { cycle: 26, title: "Spark Tries", lines: ["\"Why does Glimmer's fire fly high?\"", "\"My spark!\" laughs Spark, \"I'll try!\"", "Fern flutters way up high,", "and waves the clouds goodbye."], findWords: ["why", "my", "try"] },
  { cycle: 27, title: "First Friends", lines: ["Pip's best friend is here at last,", "Fern flies in - she's first, so fast!", "They share a berry, half each,", "in the Whispering Meadow's reach."], findWords: ["friend", "first", "half"] }
];
