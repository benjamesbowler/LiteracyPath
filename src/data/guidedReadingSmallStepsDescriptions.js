// Natural descriptions of the finished artwork, separate from production briefs.
// Each array follows the book's reading pages in order, beginning with page 1.
const PAGE_DESCRIPTIONS = {
  "small-steps-01": [
    "A ginger cat stands beside Sam, who sits on a small red mat in a sunny room.",
    "Sam sits with his legs crossed on the red mat. The cat stands beside him.",
    "The cat lifts a front paw toward the small space at the edge of the mat beside Sam.",
    "The cat sits at the edge of the mat beside Sam, with part of its body on the wooden floor.",
    "The cat climbs onto Sam’s lap as he rests a hand on its back.",
    "The cat curls up on Sam’s lap. Sam smiles and strokes its back."
  ],
  "small-steps-02": [
    "Dot lifts a muddy shoe above a cream rug with muddy footprints. A yellow rag and blue tub sit nearby.",
    "Dot kneels and rubs the muddy rug with a yellow rag.",
    "Dot holds up the yellow rag to look at the mud covering it.",
    "Dot rubs the rug with the dirty rag, spreading a wide muddy smear. Her muddy hand touches her blue hat.",
    "Dot washes the rag in the blue tub. The water turns brown beside the muddy rug.",
    "Dot wipes the remaining mud from the rug with the yellow rag. The tub holds muddy water.",
    "Dot holds up the clean rug. A small mud mark is visible on her blue hat.",
    "Dot takes off her blue hat and points to its muddy mark. The clean rug lies at her feet."
  ],
  "small-steps-03": [
    "Sam kneels beside a small cardboard box as the brown-and-white pup sniffs it. A larger box sits behind them.",
    "Sam holds out his hands toward the small box. The pup has its front paws inside and its back paws on the floor.",
    "The pup stands beside the small box while Sam looks at it. The larger box is behind them.",
    "Sam pulls the large cardboard box across the floor as the pup watches.",
    "Sam gestures toward the large box as the pup steps into it.",
    "The pup sits inside the large box. Sam kneels beside it and smiles.",
    "Sam wears the small box on his head like a hat. The pup watches from inside the large box."
  ],
  "small-steps-04": [
    "Dot smiles at a steaming bun on a plate. Dad stands beside her, and a blue paper fan lies on the table.",
    "Dot looks at the bun as steam rises from it. Dad stands beside her.",
    "Dot waves the blue fan over the steaming bun while Dad watches.",
    "Dot rests her cheek on one hand and holds the fan in the other. Steam still rises from the bun.",
    "Dot points at the bun while Dad carefully cuts it across the middle with a knife.",
    "Dot fans the two bun halves on the plate. Dad stands beside her, with the knife lying on the table.",
    "Dot and Dad smile at the two bun halves. No steam rises, and the blue fan rests on the table.",
    "Dot takes a bite from one bun half while Dad smiles beside her. The other half remains on the plate."
  ],
  "small-steps-05": [
    "Dad wears a stethoscope beside Dot and a brown hen. The hen stands in a towel-lined box on a bench.",
    "Dot bends toward the hen in its open box while Dad stands nearby.",
    "Dot sits on the bench and holds the hen, with Dad beside her. The open box is empty.",
    "The hen stands on the green rug below Dot’s empty lap. Dad stands beside the bench.",
    "Dot and Dad sit on the green rug facing the hen.",
    "Dot taps her lap while Dad sits beside her. The hen stands close to her knees.",
    "The hen sits on Dot’s crossed legs. Dad sits beside her and looks at the hen.",
    "Dot and Dad gently stroke the hen resting on Dot’s lap."
  ],
  "small-steps-06": [
    "Sam and Dad look at a clear pot of red jam with a blue lid. A bun rests on a plate beside it.",
    "Sam grips the blue lid with both hands and pulls while Dad watches.",
    "The blue lid remains on the jam pot. Sam looks up at Dad.",
    "Dad reaches for the lid as Sam holds the jam pot.",
    "Sam and Dad pull at the blue lid together. Red jam splashes toward Dad’s green shirt.",
    "Dad holds the lid above the open jam pot. Sam raises his hands, and a red jam spot marks Dad’s shirt.",
    "Sam dips the edge of his bun into the open pot of red jam. Dad watches beside him.",
    "Sam holds his jam-covered bun and points to the red spot on Dad’s green shirt. Dad looks down at it."
  ],
  "small-steps-07": [
    "Sam puts a blue hat into an open red bag. A yellow mug and a long log sit on the green mat beside him.",
    "Sam sets a yellow mug beside the blue hat inside his red bag. The log lies beside the bag.",
    "Sam holds a long log with one end inside the open bag. The hat and mug are also inside.",
    "Sam holds the bag’s zipper while the long log sticks out above the hat and mug.",
    "Sam pulls hard at the zipper with both hands. The log keeps the red bag wide open.",
    "Sam sets the log on the green mat beside his open bag. The hat and mug remain inside the bag.",
    "Sam pulls the zipper across the closed red bag. The log lies beside it on the green mat."
  ],
  "small-steps-08": [
    "Sam and Dad look at a large red hat and a small red cap on a wooden bench.",
    "Sam runs across the blue rug in the large red hat. Dad claps beside him.",
    "The large hat lies on the rug behind Sam. He looks back with his mouth open.",
    "Sam bends down and picks up the red hat. Dad kneels beside him.",
    "Sam puts the large red hat on Dad's head while Dad kneels.",
    "Dad stands wearing the large hat. Sam points to the small red cap on the bench.",
    "Sam runs in the small red cap. Dad follows him, wearing the large red hat.",
    "Sam and Dad smile at each other as they run across the rug, each wearing a red hat."
  ],
  "small-steps-09": [
    "A ginger cat stands beside Sam and Dot's cardboard shop. An open box sits nearby.",
    "The cat sleeps on the shop's lower shelf while Sam and Dot stand at the counter.",
    "Sam and Dot chat at the counter. Below them, the cat opens its eyes and looks up.",
    "The cat sits up on the lower shelf. Sam and Dot lean toward it.",
    "The cat steps into the open box beside the shop while Sam and Dot watch.",
    "Sam and Dot lower the shop's cardboard shutter. The cat curls up in the open box beside them.",
    "The cat sleeps in the open box. Sam and Dot sit beside the closed shop with their chins in their hands."
  ],
  "small-steps-10": [
    "Dad hands Sam a chip at the garden table. Dot sits beside a blue dish of chips.",
    "A chip lies in the mud beside the table. Sam reaches toward it as Dad and Dot look down.",
    "Sam uses a napkin to drop the muddy chip into a bin. Dad and Dot watch from the table.",
    "Dad holds out the blue dish of chips, and Sam reaches for it. Dot smiles beside them.",
    "Sam holds a chip near his mouth at the garden table. Dad and Dot smile at him.",
    "A small chip crumb sticks to Sam's chin. Dad and Dot look at him across the table.",
    "Dot points to her own chin as she smiles at Sam. The crumb is still on his chin.",
    "Sam holds the small crumb beside his face. His chin is clear, and Dad and Dot smile."
  ],
  "small-steps-11": [
    "Sam and Dot sit at a table with a felt fish, a blue fin, a yellow leg and an open box.",
    "Sam holds up a thin blue fin and a wide yellow leg. Dot watches from beside him.",
    "Sam puts the yellow leg on the felt fish. The blue fin lies on the table.",
    "Dot points at the yellow leg on the fish. Sam touches his chin and looks at it.",
    "Sam puts the yellow leg into the box. The fish and blue fin lie on the table.",
    "Sam presses the blue fin onto the felt fish while Dot holds the fish steady.",
    "Sam and Dot hold up the fish with its blue fin attached. The yellow leg rests in the box."
  ],
  "small-steps-12": [
    "Sam kneels in the hall, holding a red ball beside an open blue tin and a blue mat.",
    "Sam balances the red ball on the edge of the blue tin.",
    "The ball falls toward the blue mat beside the tin. Sam holds his hands up and watches.",
    "Sam holds the red ball above the open tin and looks down at the opening.",
    "Sam lowers the red ball into the blue tin.",
    "Sam sits with his hands on his knees. The red ball rests inside the blue tin beside him."
  ],
  "small-steps-13": [
    "A pink pig stands beside a muddy puddle in a sunny field with a wooden fence.",
    "The pig digs into the wet mud with its front hooves, splashing a little mud.",
    "The pig's front legs fit in the small muddy pit, but its back legs remain outside.",
    "The pig digs at the edge of the pit, pushing mud aside with its front hooves.",
    "The pig sits in the wider muddy pit. Mud splashes up around its body.",
    "The pig rests in the mud with a small brown spot on its chin.",
    "The pig naps in the muddy pit with its eyes closed and its snout above the mud."
  ],
  "small-steps-14": [
    "Dot looks around the garden with a hand above her eyes. Sam holds a map between a hut and a hollow log.",
    "Dot holds a map showing a hut and a log. Sam stands beside her with his hands open.",
    "Dot runs toward the wooden hut with the map in her hand. Sam watches from the grass.",
    "Dot leans into the hut's empty doorway while holding the map. Sam stands nearby.",
    "Dot points to a red dot on the map's picture of a log. The hollow log stands behind her.",
    "Dot runs toward the hollow log, carrying the map. Sam watches from the grass behind her.",
    "Dot holds up the red cap beside the open log. She smiles at Sam and holds the map in her other hand."
  ],
  "small-steps-15": [
    "Sam watches Pup standing in a muddy patch. Dad holds a cream rag beside a blue tub.",
    "Sam puts muddy Pup in the tub while Dad waits nearby with the rag.",
    "Sam rubs Pup with the cream rag. Pup still has mud on its fur.",
    "Sam holds up the dry rag and looks at it. Muddy Pup stands in the tub.",
    "Sam dips the rag in the water beside Pup.",
    "Sam rubs Pup with the wet rag. Brown mud marks the cloth.",
    "Sam holds up the muddy rag. Pup stands clean in the tub.",
    "Pup shakes water onto Sam outside the tub. Sam and Dad laugh."
  ],
  "small-steps-16": [
    "A blue ball floats in a shallow tub. Dot stands beside it, and Dad kneels nearby.",
    "Dot dips the yellow cup into the water near the blue ball.",
    "Dot tips the cup and water runs out. The blue ball still floats in the tub.",
    "Dot reaches for the red net on the green mat. Dad holds out his hands.",
    "Dot lifts the blue ball out of the tub in the net. Water drips through the mesh.",
    "Dot holds the wet ball and puts the empty net on the mat.",
    "Dot tosses the wet ball toward Dad's open hands. Drops of water trail behind it.",
    "Dad catches the ball. Water splashes his shirt as he and Dot smile."
  ],
  "small-steps-17": [
    "Sam kneels beside a small wooden toy tunnel. A red toy van sits inside, and Dad watches.",
    "Sam holds the front of the toy van and pulls. The van stays behind a small wooden lip.",
    "The van is still in the tunnel. Sam rests a finger on his chin.",
    "Sam points to the toy road beside the tunnel. Dad sits at the other end.",
    "Sam lifts one end of the small tunnel. The van is still on its wooden floor.",
    "The van is out on the toy road. Sam lowers the empty tunnel beside it.",
    "Sam lets the toy van roll along the road toward Dad.",
    "The toy van rests on the toe of Dad's brown shoe. Sam and Dad smile."
  ],
  "small-steps-18": [
    "Dot and Dad look at pink ink spilled on a cream mat. A clean rag lies beside the jar.",
    "Dot rubs the pink ink with one finger.",
    "Pink ink covers more of the mat. Dot holds up her pink fingertip.",
    "Dot holds the cream rag under running water in the sink. Dad stands nearby.",
    "Dot holds up the dripping rag while Dad turns off the tap.",
    "Dot dabs the mat with the wet rag. A clean patch appears, and the rag turns pink.",
    "The mat is clean. Dot holds up the pink-stained rag while Dad smiles.",
    "Dot smiles at the pink rag and points with her pink fingertip. The clean mat lies on the table."
  ],
  "small-steps-19": [
    "Sam sings beside Dad. Cat rests near a metal pan and an open box.",
    "Sam bangs on the pan with his hand. Dad raises his hands, and Cat walks toward the box.",
    "Cat peeks out of the box. Sam holds the pan and looks at Dad.",
    "Dad holds a finger to his lips. Sam watches him while Cat stays in the box.",
    "Sam puts the pan upside down on the rug. Cat watches from the box.",
    "Sam sings with his hands away from the pan. Cat steps out of the box.",
    "Sam and Dad sing together. Cat walks toward the pan.",
    "Cat sits on the flat bottom of the upside-down pan. Sam and Dad smile."
  ],
  "small-steps-20": [
    "Dot looks through a heap of blue fuzz on the craft table. A yellow cup stands in the heap.",
    "Dot blows on the blue fuzz. Some falls over the edge of the table.",
    "The blue fuzz is on the rug. Dot looks down at it, and the yellow cup stays on the table.",
    "Dot searches through the fuzz with both hands. Dad watches beside an empty green bin.",
    "Dot tips the yellow cup on the table. The blue fuzz remains on the rug.",
    "Dot shows Dad a small silver bell inside the yellow cup. The bell has a blue handle.",
    "Dot puts the blue fuzz into the green bin. The bell sits beside the cup.",
    "Dot rings the bell while Dad claps. The blue fuzz is in the bin, and the rug is clear."
  ]
};

export const GUIDED_READING_SMALL_STEPS_DESCRIPTIONS = Object.freeze(Object.fromEntries(
  Object.entries(PAGE_DESCRIPTIONS).map(([bookId, pages]) => [bookId, Object.freeze(pages)])
));
