// Authored adventure descriptors, not a claim of integrated scenes or reviewed
// content configurations. Learning items remain owned by questSequence and the
// current instructional authorities; these records never award mastery.
import { getStop } from "../../../../data/questSequence.js";

export const CAMPAIGN_VERSION = 1;

const definitions = [
  {
    "name": "Hollow Tree",
    "residentId": "muddy",
    "residentAlternateId": "speedy",
    "anchorIds": [
      "s1"
    ],
    "problem": "Muddy's bath kit is scattered around the oak.",
    "repair": "bath-corner",
    "missions": [
      {
        "title": "Listen at the Roots",
        "familyId": "sound-steps",
        "variantId": "root-forks",
        "objective": "Follow a and m stepping stones to recover the empty bath bucket."
      },
      {
        "title": "Soap on the Shelf",
        "familyId": "word-pop",
        "variantId": "shelf-targets",
        "objective": "Use the bubble tool to match t and s labels and release the soap tray."
      },
      {
        "title": "A Mat for Muddy",
        "familyId": "rescue-bridge",
        "variantId": "mat-planks",
        "objective": "Build mat and sat across two root gaps and carry the bath mat home."
      },
      {
        "title": "Under the Oak",
        "familyId": "garden-kitchen",
        "variantId": "bath-placement",
        "objective": "Listen to Muddy and place the towel on the rail and soap in the tray."
      },
      {
        "title": "Muddy's Bath Corner",
        "familyId": "story-rescue",
        "variantId": "bath-restoration",
        "objective": "Cross the repaired roots, collect water and arrange the recovered kit for Muddy."
      },
      {
        "title": "Tiny's Lost Button",
        "familyId": "lantern-search",
        "variantId": "root-nook",
        "objective": "Follow a spoken size description to find Tiny's button below the roots.",
        "residentId": "tiny",
        "residentAlternateId": "muddy"
      },
      {
        "title": "A Seat for Shy",
        "familyId": "pals-post",
        "variantId": "oak-loop",
        "objective": "Carry a cushion to Shy's shaded seat using the spoken destination.",
        "residentId": "shy",
        "residentAlternateId": "muddy"
      }
    ]
  },
  {
    "name": "Fern Steps",
    "residentId": "woolly",
    "residentAlternateId": "sleepy",
    "anchorIds": [
      "s2"
    ],
    "problem": "Woolly's bedding has blown up the hillside.",
    "repair": "cosy-shelter",
    "missions": [
      {
        "title": "Blankets in the Ferns",
        "familyId": "tree-rescue",
        "variantId": "low-fern-ledges",
        "objective": "Climb the low fern ledges to gather Woolly's blankets at three resting shelves."
      },
      {
        "title": "Bedding Baskets",
        "familyId": "sound-herd",
        "variantId": "hillside-gates",
        "objective": "Route bedding carriers through sound gates into Woolly's two baskets."
      },
      {
        "title": "The Shelter Path",
        "familyId": "sound-steps",
        "variantId": "switchback-stones",
        "objective": "Choose taught sound stones around the hillside to reach the shelter entrance."
      },
      {
        "title": "Make the Bed",
        "familyId": "garden-kitchen",
        "variantId": "shelter-interior",
        "objective": "Listen to where each blanket and cushion belongs and furnish the shelter."
      },
      {
        "title": "A Cosy Night",
        "familyId": "story-rescue",
        "variantId": "shelter-delivery",
        "objective": "Carry the bedding up the repaired path and follow Woolly's shelter instructions."
      },
      {
        "title": "Sleepy's Pillow",
        "familyId": "pals-post",
        "variantId": "lower-hill-loop",
        "objective": "Find Sleepy's resting place and deliver the small pillow.",
        "residentId": "sleepy",
        "residentAlternateId": "woolly"
      },
      {
        "title": "Fern Footprints",
        "familyId": "lantern-search",
        "variantId": "fern-traces",
        "objective": "Follow a spoken description of footprints to find Shy's dropped ribbon.",
        "residentId": "shy",
        "residentAlternateId": "woolly"
      }
    ]
  },
  {
    "name": "Rook Stones",
    "residentId": "clucky",
    "residentAlternateId": "brave",
    "anchorIds": [
      "s3"
    ],
    "problem": "An egg is beside the wall and Clucky's nest path is blocked.",
    "repair": "nest-path",
    "missions": [
      {
        "title": "Safe Egg Steps",
        "familyId": "sound-steps",
        "variantId": "wall-stones",
        "objective": "Cross broad labelled stones to reach the egg resting safely beside the wall."
      },
      {
        "title": "A Nest Ramp",
        "familyId": "rescue-bridge",
        "variantId": "wall-ramp",
        "objective": "Order grapheme planks to build a low ramp back to the nest."
      },
      {
        "title": "Clear the Nest",
        "familyId": "garden-kitchen",
        "variantId": "nest-positions",
        "objective": "Place sticks beside the nest and soft lining inside it following Clucky's directions."
      },
      {
        "title": "The Nest Label",
        "familyId": "word-pop",
        "variantId": "wall-signs",
        "objective": "Aim at the requested word signs to turn the route markers toward the nest."
      },
      {
        "title": "Bring the Egg Home",
        "familyId": "story-rescue",
        "variantId": "egg-return",
        "objective": "Carry the egg over the new ramp and place it in the prepared nest."
      },
      {
        "title": "Brave's Feather",
        "familyId": "lantern-search",
        "variantId": "wall-crannies",
        "objective": "Find the feather matching Brave's spoken description among the wall crannies.",
        "residentId": "brave",
        "residentAlternateId": "clucky"
      },
      {
        "title": "Giggly's Note",
        "familyId": "pals-post",
        "variantId": "nest-pond-loop",
        "objective": "Deliver Clucky's spoken invitation to Giggly at the pond.",
        "residentId": "giggly",
        "residentAlternateId": "clucky"
      }
    ]
  },
  {
    "name": "Otter Ford",
    "residentId": "splashy",
    "residentAlternateId": "clucky",
    "anchorIds": [
      "s4"
    ],
    "problem": "Splashy's crossing washed away and Brave is waiting on the far bank.",
    "repair": "pond-crossing",
    "missions": [
      {
        "title": "Planks for the Ford",
        "familyId": "rescue-bridge",
        "variantId": "split-ford",
        "objective": "Build two grapheme spans with a resting island between them."
      },
      {
        "title": "The Dry Route",
        "familyId": "sound-steps",
        "variantId": "island-forks",
        "objective": "Choose labelled landing stones to trace a dry route past the reeds."
      },
      {
        "title": "Bridge Baskets",
        "familyId": "garden-kitchen",
        "variantId": "bank-storage",
        "objective": "Place the rope above the basket and the planks beside the rack from spoken directions."
      },
      {
        "title": "A Message Across",
        "familyId": "pals-post",
        "variantId": "two-bank-delivery",
        "objective": "Cross the repaired sections and deliver Splashy's message to Brave's resting place."
      },
      {
        "title": "Brave Comes Home",
        "familyId": "story-rescue",
        "variantId": "chick-escort",
        "objective": "Use the completed spans and follow the route cue to bring Brave safely to Clucky."
      },
      {
        "title": "Reed Raft",
        "familyId": "river-route",
        "variantId": "reed-eddy",
        "objective": "Follow one-step spoken directions around a safe reed loop.",
        "residentId": "splashy",
        "residentAlternateId": "clucky"
      },
      {
        "title": "Pond Pebbles",
        "familyId": "sound-herd",
        "variantId": "pebble-chutes",
        "objective": "Sort labelled pebble carriers into Splashy's sound baskets.",
        "residentId": "splashy",
        "residentAlternateId": "clucky"
      }
    ]
  },
  {
    "name": "Bramble Gate",
    "residentId": "bouncy",
    "residentAlternateId": "woolly",
    "anchorIds": [
      "s5"
    ],
    "problem": "Bouncy's picnic path is tangled and its gate is broken.",
    "repair": "picnic-clearing",
    "missions": [
      {
        "title": "Clip the Vines",
        "familyId": "word-pop",
        "variantId": "vine-tags",
        "objective": "Aim seeds at the requested word tags to release the vines from the gate."
      },
      {
        "title": "Mend the Gate",
        "familyId": "fix-it-workshop",
        "variantId": "gate-latch",
        "objective": "Change the requested grapheme to fit each wooden latch part."
      },
      {
        "title": "Picnic Planks",
        "familyId": "rescue-bridge",
        "variantId": "gate-span",
        "objective": "Build the missing footbridge boards that lead into the clearing."
      },
      {
        "title": "Deliver the Blanket",
        "familyId": "pals-post",
        "variantId": "bramble-loop",
        "objective": "Read or listen to the destination cue and carry the blanket around the hedge."
      },
      {
        "title": "Open the Picnic Way",
        "familyId": "story-rescue",
        "variantId": "gate-opening",
        "objective": "Use the latch, cross the repaired bridge and lay out the picnic blanket."
      },
      {
        "title": "Bouncy's Berries",
        "familyId": "garden-kitchen",
        "variantId": "berry-baskets",
        "objective": "Select berries by spoken colour and quantity descriptions for Bouncy's basket.",
        "residentId": "bouncy",
        "residentAlternateId": "woolly"
      },
      {
        "title": "Hedge Hideaway",
        "familyId": "lantern-search",
        "variantId": "hedge-window",
        "objective": "Use two spoken location clues to discover Tiny's hedge seat.",
        "residentId": "tiny",
        "residentAlternateId": "bouncy"
      }
    ]
  },
  {
    "name": "Beehive Bluff",
    "residentId": "brave",
    "residentAlternateId": "clucky",
    "anchorIds": [
      "s6"
    ],
    "problem": "Brave's supplies are safe on a ledge but the basket hoist is unfinished.",
    "repair": "supply-hoist",
    "missions": [
      {
        "title": "Reach the Basket",
        "familyId": "tree-rescue",
        "variantId": "bluff-shelves",
        "objective": "Climb word-labelled shelves with broad rest platforms to reach Brave's basket."
      },
      {
        "title": "Hoist Handles",
        "familyId": "fix-it-workshop",
        "variantId": "wooden-pulley",
        "objective": "Build the requested words to assemble handles for the wooden pulley."
      },
      {
        "title": "Sort the Supplies",
        "familyId": "sound-herd",
        "variantId": "ledge-chutes",
        "objective": "Guide supply carriers into the sound-labelled loading baskets."
      },
      {
        "title": "A Note to Clucky",
        "familyId": "pals-post",
        "variantId": "bluff-return",
        "objective": "Read the destination label and take Brave's note down the winding path."
      },
      {
        "title": "Lower the Supplies",
        "familyId": "story-rescue",
        "variantId": "basket-descent",
        "objective": "Load the sorted supplies, use the hoist and deliver the basket at the lower landing."
      },
      {
        "title": "Flower Route",
        "familyId": "river-route",
        "variantId": "bluff-path-junctions",
        "objective": "Follow spoken flower landmarks around a dry walking route below the bluff.",
        "residentId": "brave",
        "residentAlternateId": "clucky"
      },
      {
        "title": "Shade for Brave",
        "familyId": "garden-kitchen",
        "variantId": "ledge-canopy",
        "objective": "Position a sunshade and water beside Brave's resting mat.",
        "residentId": "brave",
        "residentAlternateId": "clucky"
      }
    ]
  },
  {
    "name": "Lily Ferry",
    "residentId": "giggly",
    "residentAlternateId": "splashy",
    "anchorIds": [
      "s7"
    ],
    "problem": "Giggly's ferry cargo is on the wrong banks.",
    "repair": "ferry-service",
    "missions": [
      {
        "title": "Cargo Lanes",
        "familyId": "sound-herd",
        "variantId": "ferry-gates",
        "objective": "Route cargo by its taught sound to the matching ferry loading lane."
      },
      {
        "title": "Across the Lilies",
        "familyId": "river-route",
        "variantId": "lily-junctions",
        "objective": "Steer to spoken landmarks with safe eddies at every junction."
      },
      {
        "title": "Bank Deliveries",
        "familyId": "pals-post",
        "variantId": "three-bank-loop",
        "objective": "Read or listen to each cargo destination and unload on the correct bank."
      },
      {
        "title": "Ferry Signboards",
        "familyId": "word-pop",
        "variantId": "mooring-signs",
        "objective": "Aim bubbles at the requested labels to turn each mooring sign into place."
      },
      {
        "title": "Giggly's First Crossing",
        "familyId": "story-rescue",
        "variantId": "loaded-ferry",
        "objective": "Load the sorted cargo, follow the channel and deliver the baskets to waiting friends."
      },
      {
        "title": "Lily Listening Walk",
        "familyId": "lantern-search",
        "variantId": "bank-lookouts",
        "objective": "Use a spoken description to locate Splashy's hidden lookout marker.",
        "residentId": "splashy",
        "residentAlternateId": "giggly"
      },
      {
        "title": "Mooring Mats",
        "familyId": "rescue-bridge",
        "variantId": "mooring-planks",
        "objective": "Build a short word-plank walkway to Giggly's optional rest platform.",
        "residentId": "giggly",
        "residentAlternateId": "splashy"
      }
    ]
  },
  {
    "name": "Fishpool Reach",
    "residentId": "hungry",
    "residentAlternateId": "muddy",
    "anchorIds": [
      "s8"
    ],
    "problem": "Hungry's picnic orders and places have been muddled.",
    "repair": "picnic-tables",
    "missions": [
      {
        "title": "Hungry's Basket",
        "familyId": "garden-kitchen",
        "variantId": "picnic-recipe",
        "objective": "Choose familiar foods from spoken descriptions and put them in the basket."
      },
      {
        "title": "Place-Setting Words",
        "familyId": "fix-it-workshop",
        "variantId": "table-labels",
        "objective": "Build decodable labels for the picnic's storage trays."
      },
      {
        "title": "Who Sits Where",
        "familyId": "sentence-express",
        "variantId": "picnic-message",
        "objective": "Arrange a short supported agent-action message to explain the picnic job."
      },
      {
        "title": "Order Delivery",
        "familyId": "pals-post",
        "variantId": "table-circuit",
        "objective": "Take each basket to the place named by its oral or readable order."
      },
      {
        "title": "Serve the Picnic",
        "familyId": "story-rescue",
        "variantId": "picnic-service",
        "objective": "Follow Hungry's short sequence to set places and serve the prepared baskets."
      },
      {
        "title": "Fishpool Footbridge",
        "familyId": "sound-steps",
        "variantId": "pool-rim",
        "objective": "Follow review word stones around the shallow pool edge.",
        "residentId": "splashy",
        "residentAlternateId": "hungry"
      },
      {
        "title": "A Small Snack",
        "familyId": "garden-kitchen",
        "variantId": "tiny-place",
        "objective": "Follow Tiny's spoken size description to prepare an optional small plate.",
        "residentId": "tiny",
        "residentAlternateId": "hungry"
      }
    ]
  },
  {
    "name": "Wheelhouse Bend",
    "residentId": "cuddly",
    "residentAlternateId": "noisy",
    "anchorIds": [
      "s9"
    ],
    "problem": "Cuddly is above a broken ladder beside the water wheel.",
    "repair": "wheelhouse-ladder",
    "missions": [
      {
        "title": "Ladder Letters",
        "familyId": "rescue-bridge",
        "variantId": "ladder-rungs",
        "objective": "Build ordered digraph words to supply sound rungs for the ladder."
      },
      {
        "title": "Up to Cuddly",
        "familyId": "tree-rescue",
        "variantId": "wheelhouse-ascent",
        "objective": "Climb real successive ladder platforms to reach Cuddly's broad resting ledge."
      },
      {
        "title": "Turn the Wheel",
        "familyId": "fix-it-workshop",
        "variantId": "waterwheel-gears",
        "objective": "Change a requested grapheme to fit the wooden wheel's missing gear pieces."
      },
      {
        "title": "Cuddly's Directions",
        "familyId": "river-route",
        "variantId": "wheel-channel",
        "objective": "Follow landmark directions to open the clear water channel beside the ladder."
      },
      {
        "title": "Cuddly Comes Down",
        "familyId": "story-rescue",
        "variantId": "ladder-escort",
        "objective": "Use the fixed ladder, pause at each ledge and guide Cuddly back to the lower path."
      },
      {
        "title": "Wheelhouse Window",
        "familyId": "lantern-search",
        "variantId": "wheelhouse-nooks",
        "objective": "Read a supported clue to find Noisy's lost signal ribbon.",
        "residentId": "noisy",
        "residentAlternateId": "cuddly"
      },
      {
        "title": "A Thank-You Parcel",
        "familyId": "pals-post",
        "variantId": "wheelhouse-barn",
        "objective": "Deliver Cuddly's thank-you basket to Muddy at the barn path.",
        "residentId": "muddy",
        "residentAlternateId": "cuddly"
      }
    ]
  },
  {
    "name": "Singing Weir",
    "residentId": "noisy",
    "residentAlternateId": "speedy",
    "anchorIds": [
      "s10"
    ],
    "problem": "The gathering needs a clear water route and working picnic signals.",
    "repair": "farm-gathering",
    "missions": [
      {
        "title": "Signal Targets",
        "familyId": "word-pop",
        "variantId": "weir-signals",
        "objective": "Choose the requested word target to raise each farm signal flag."
      },
      {
        "title": "Water Gate Words",
        "familyId": "fix-it-workshop",
        "variantId": "weir-handles",
        "objective": "Repair the wooden gate handles using taught word changes."
      },
      {
        "title": "Gathering Route",
        "familyId": "river-route",
        "variantId": "weir-channels",
        "objective": "Read or listen to directions through the reopened water junctions."
      },
      {
        "title": "Picnic Message",
        "familyId": "sentence-express",
        "variantId": "gathering-board",
        "objective": "Arrange the supported invitation message so friends know where to gather."
      },
      {
        "title": "The Farm Gathering",
        "familyId": "story-rescue",
        "variantId": "farm-departure",
        "objective": "Test the gates, raise the signal and carry the invitation to open the departure path."
      },
      {
        "title": "Noisy's Quiet Corner",
        "familyId": "lantern-search",
        "variantId": "weir-shade",
        "objective": "Use a descriptive clue to find the shaded gathering seat.",
        "residentId": "noisy",
        "residentAlternateId": "speedy"
      },
      {
        "title": "Departure Bags",
        "familyId": "sound-herd",
        "variantId": "camp-baskets",
        "objective": "Route review word carriers to the labelled travelling baskets.",
        "residentId": "speedy",
        "residentAlternateId": "noisy"
      }
    ]
  },
  {
    "name": "Amber Ridge",
    "residentId": "sunny",
    "residentAlternateId": "chompy",
    "anchorIds": [
      "s11"
    ],
    "problem": "Sunny's trail signs send supplies toward the wrong ridge.",
    "repair": "ridge-route",
    "missions": [
      {
        "title": "Turn the Signs",
        "familyId": "word-pop",
        "variantId": "ridge-signposts",
        "objective": "Aim at the requested word signs to point each marker down the useful path."
      },
      {
        "title": "Ridge Parcels",
        "familyId": "pals-post",
        "variantId": "ridge-forks",
        "objective": "Read destination labels and carry supplies through the branching ridge paths."
      },
      {
        "title": "Marker Supports",
        "familyId": "rescue-bridge",
        "variantId": "ridge-marker-span",
        "objective": "Build word planks that support the short crossing beside the trail markers."
      },
      {
        "title": "Sunny's Route Plan",
        "familyId": "sentence-express",
        "variantId": "ridge-plan",
        "objective": "Order a short instruction describing the supply route."
      },
      {
        "title": "Reconnect the Ridge",
        "familyId": "story-rescue",
        "variantId": "ridge-convoy",
        "objective": "Cross the new span and follow the corrected route with Sunny's supply basket."
      },
      {
        "title": "Berry Bush Clue",
        "familyId": "lantern-search",
        "variantId": "ridge-berries",
        "objective": "Find a basket using its written descriptor and optional reading help.",
        "residentId": "sunny",
        "residentAlternateId": "chompy"
      },
      {
        "title": "Clumsy's Rest Stop",
        "familyId": "garden-kitchen",
        "variantId": "ridge-rest",
        "objective": "Place the broad mat beside the water following Clumsy's instructions.",
        "residentId": "clumsy",
        "residentAlternateId": "sunny"
      }
    ]
  },
  {
    "name": "Rattlebones",
    "residentId": "dozy",
    "residentAlternateId": "sunny",
    "anchorIds": [
      "s12"
    ],
    "problem": "Dozy's shelter pieces are mixed with loose stones.",
    "repair": "stone-shelter",
    "missions": [
      {
        "title": "Shelter Cargo",
        "familyId": "sound-herd",
        "variantId": "stone-cargo-chutes",
        "objective": "Route word-labelled shelter pieces into the appropriate sound baskets."
      },
      {
        "title": "Beam Words",
        "familyId": "fix-it-workshop",
        "variantId": "shelter-beams",
        "objective": "Build requested words to fit beams into Dozy's shelter frame."
      },
      {
        "title": "Roof Directions",
        "familyId": "garden-kitchen",
        "variantId": "shelter-frame",
        "objective": "Follow two-step directions to place roof pieces above the supports."
      },
      {
        "title": "Shelter Notices",
        "familyId": "word-pop",
        "variantId": "cave-notices",
        "objective": "Aim at the requested notice words to label the finished shelter areas."
      },
      {
        "title": "A Shelter for Dozy",
        "familyId": "story-rescue",
        "variantId": "shelter-build",
        "objective": "Carry the sorted beams, complete the roof and guide Dozy into the dry shelter."
      },
      {
        "title": "Smooth Stone Search",
        "familyId": "lantern-search",
        "variantId": "cave-stones",
        "objective": "Read a contrastive description to find Dozy's smooth resting stone.",
        "residentId": "dozy",
        "residentAlternateId": "sunny"
      },
      {
        "title": "Berry Delivery",
        "familyId": "pals-post",
        "variantId": "cave-berry-loop",
        "objective": "Deliver the labelled berry basket to Sunny outside the cave.",
        "residentId": "sunny",
        "residentAlternateId": "dozy"
      }
    ]
  },
  {
    "name": "Ash Flats",
    "residentId": "zippy",
    "residentAlternateId": "dozy",
    "anchorIds": [
      "s13"
    ],
    "problem": "Zippy's parcels are scattered along split paths.",
    "repair": "delivery-loop",
    "missions": [
      {
        "title": "Forked Deliveries",
        "familyId": "pals-post",
        "variantId": "flats-branches",
        "objective": "Choose routes from parcel labels and deliver to distinct landmarks."
      },
      {
        "title": "Parcel Platform Words",
        "familyId": "sound-steps",
        "variantId": "flats-platforms",
        "objective": "Retrieve parcels from word-labelled platforms along the lower path."
      },
      {
        "title": "Zippy's Message",
        "familyId": "sentence-express",
        "variantId": "parcel-message",
        "objective": "Arrange a two-part delivery instruction to identify the next destination."
      },
      {
        "title": "The Missing Label",
        "familyId": "fix-it-workshop",
        "variantId": "parcel-labels",
        "objective": "Change the requested grapheme to repair mixed parcel labels."
      },
      {
        "title": "Finish Zippy's Round",
        "familyId": "story-rescue",
        "variantId": "flats-round",
        "objective": "Follow the repaired labels through both branches and return the empty basket to Zippy."
      },
      {
        "title": "Fernwood Find",
        "familyId": "lantern-search",
        "variantId": "flats-fern-nooks",
        "objective": "Use a short written clue to recover Zippy's route ribbon.",
        "residentId": "zippy",
        "residentAlternateId": "dozy"
      },
      {
        "title": "Pathside Sorting",
        "familyId": "sound-herd",
        "variantId": "flats-gates",
        "objective": "Send review word carriers into the correct pathside sound gates.",
        "residentId": "dozy",
        "residentAlternateId": "zippy"
      }
    ]
  },
  {
    "name": "Fern Canyon",
    "residentId": "wiggly",
    "residentAlternateId": "bossy",
    "anchorIds": [
      "s14"
    ],
    "problem": "Wiggly needs a broad safe crossing for the valley picnic.",
    "repair": "canyon-crossing",
    "missions": [
      {
        "title": "Counterweight Planks",
        "familyId": "rescue-bridge",
        "variantId": "counterweight-span",
        "objective": "Build word planks to balance the two sections of the wooden crossing."
      },
      {
        "title": "Canyon Lookout",
        "familyId": "tree-rescue",
        "variantId": "canyon-ledge-climb",
        "objective": "Climb word-labelled ledges to find the crossing's upper rope anchor."
      },
      {
        "title": "Picnic Directions",
        "familyId": "river-route",
        "variantId": "canyon-junctions",
        "objective": "Follow a two-step listening sequence through the lower canyon junctions."
      },
      {
        "title": "Wiggly's Basket",
        "familyId": "garden-kitchen",
        "variantId": "canyon-loading",
        "objective": "Load the long basket using spoken size and position instructions."
      },
      {
        "title": "Cross Together",
        "familyId": "story-rescue",
        "variantId": "canyon-escort",
        "objective": "Test the balanced span and guide Wiggly's picnic basket across the broad path."
      },
      {
        "title": "Echo Sign Search",
        "familyId": "lantern-search",
        "variantId": "canyon-signs",
        "objective": "Read a location clue to find Honky's missing route marker.",
        "residentId": "honky",
        "residentAlternateId": "wiggly"
      },
      {
        "title": "A Parcel for Fancy",
        "familyId": "pals-post",
        "variantId": "canyon-side-loop",
        "objective": "Carry a labelled parcel to Fancy's optional lookout stop.",
        "residentId": "fancy",
        "residentAlternateId": "wiggly"
      }
    ]
  },
  {
    "name": "Claw Pass",
    "residentId": "bossy",
    "residentAlternateId": "wiggly",
    "anchorIds": [
      "s15"
    ],
    "problem": "Bossy's route-building plan has missing steps.",
    "repair": "open-pass",
    "missions": [
      {
        "title": "Put the Plan in Order",
        "familyId": "sentence-express",
        "variantId": "pass-plan",
        "objective": "Arrange meaningful actions in the order needed to open the pass."
      },
      {
        "title": "Lever Route",
        "familyId": "river-route",
        "variantId": "pass-levers",
        "objective": "Follow spoken or readable directions to the appropriate route lever."
      },
      {
        "title": "Clear the Markers",
        "familyId": "word-pop",
        "variantId": "pass-targets",
        "objective": "Use assisted aiming to choose labelled markers that release blocked path panels."
      },
      {
        "title": "Pass Planks",
        "familyId": "rescue-bridge",
        "variantId": "pass-drawbridge",
        "objective": "Build the ordered grapheme planks for a small drawbridge."
      },
      {
        "title": "Open Claw Pass",
        "familyId": "story-rescue",
        "variantId": "pass-sequence",
        "objective": "Follow the completed plan, set the lever and cross the lowered drawbridge."
      },
      {
        "title": "Bossy's Better Note",
        "familyId": "sentence-express",
        "variantId": "pass-polite-note",
        "objective": "Assemble a supported request with the intended meaning for a friend.",
        "residentId": "bossy",
        "residentAlternateId": "wiggly"
      },
      {
        "title": "Rock-Shelf Parcel",
        "familyId": "pals-post",
        "variantId": "pass-shelf-loop",
        "objective": "Deliver supplies to the shelf named on the parcel label.",
        "residentId": "sunny",
        "residentAlternateId": "bossy"
      }
    ]
  },
  {
    "name": "Gearworks Gate",
    "residentId": "honky",
    "residentAlternateId": "sunny",
    "anchorIds": [
      "s16"
    ],
    "problem": "Honky's wooden signal has loose parts and confused relay messages.",
    "repair": "wooden-signal",
    "missions": [
      {
        "title": "Two Ways to Hear Y",
        "familyId": "sound-herd",
        "variantId": "signal-cargo",
        "objective": "Sort curated y words by their spoken value using the existing contrast bank."
      },
      {
        "title": "Signal Parts",
        "familyId": "fix-it-workshop",
        "variantId": "wooden-signal-arms",
        "objective": "Build word-labelled wooden parts to repair the signal's moving arms."
      },
      {
        "title": "Relay the Message",
        "familyId": "pals-post",
        "variantId": "signal-relay",
        "objective": "Follow the given instruction to carry a message between two lookout posts."
      },
      {
        "title": "Signal Sentence",
        "familyId": "sentence-express",
        "variantId": "signal-board",
        "objective": "Arrange the message that explains which path is ready."
      },
      {
        "title": "Test Honky's Signal",
        "familyId": "story-rescue",
        "variantId": "signal-test",
        "objective": "Carry the repaired parts up the path and use the clear message to test the signal."
      },
      {
        "title": "Lookout Letters",
        "familyId": "word-pop",
        "variantId": "lookout-targets",
        "objective": "Aim at review words on broad stationary lookout signs.",
        "residentId": "sunny",
        "residentAlternateId": "honky"
      },
      {
        "title": "A Seat Below",
        "familyId": "garden-kitchen",
        "variantId": "signal-rest",
        "objective": "Follow Honky's position instructions to prepare a rest area below the lookout.",
        "residentId": "honky",
        "residentAlternateId": "sunny"
      }
    ]
  },
  {
    "name": "Ore Hopper",
    "residentId": "dino-grumpy",
    "residentAlternateId": "clumsy",
    "anchorIds": [
      "s17"
    ],
    "problem": "Grumpy's supplies were delivered to the wrong storage places.",
    "repair": "supply-store",
    "missions": [
      {
        "title": "Store Deliveries",
        "familyId": "pals-post",
        "variantId": "store-bays",
        "objective": "Read descriptions and deliver cargo to the store bay they identify."
      },
      {
        "title": "Supply Sentences",
        "familyId": "sentence-express",
        "variantId": "store-orders",
        "objective": "Construct a clear sentence explaining where a supply basket belongs."
      },
      {
        "title": "Cargo Sound Channels",
        "familyId": "sound-herd",
        "variantId": "store-channels",
        "objective": "Guide review word cargo through the matching sound channels."
      },
      {
        "title": "Storage Directions",
        "familyId": "garden-kitchen",
        "variantId": "store-shelves",
        "objective": "Follow two-step instructions to place supplies above or below marked shelves."
      },
      {
        "title": "Restore Grumpy's Store",
        "familyId": "story-rescue",
        "variantId": "store-restock",
        "objective": "Read the completed orders and restock the three storage areas."
      },
      {
        "title": "Clumsy's Wide Basket",
        "familyId": "lantern-search",
        "variantId": "store-yard",
        "objective": "Choose the basket matching a comparison clue for Clumsy.",
        "residentId": "clumsy",
        "residentAlternateId": "dino-grumpy"
      },
      {
        "title": "Return the Rope",
        "familyId": "pals-post",
        "variantId": "store-pass-loop",
        "objective": "Carry the labelled rope parcel back to Bossy's route post.",
        "residentId": "bossy",
        "residentAlternateId": "dino-grumpy"
      }
    ]
  },
  {
    "name": "Plate Foundry",
    "residentId": "fancy",
    "residentAlternateId": "cheeky",
    "anchorIds": [
      "s18"
    ],
    "problem": "Fancy's wooden sign-making workshop has mixed labels.",
    "repair": "route-labels",
    "missions": [
      {
        "title": "Split-Pattern Signs",
        "familyId": "fix-it-workshop",
        "variantId": "sign-letter-slots",
        "objective": "Build words with the taught split pattern in the workshop's letter slots."
      },
      {
        "title": "Choose the Sign",
        "familyId": "word-pop",
        "variantId": "sign-rack",
        "objective": "Aim at the word matching Fancy's request to release a finished sign."
      },
      {
        "title": "Repair the Notice",
        "familyId": "sentence-express",
        "variantId": "workshop-notice",
        "objective": "Arrange a sentence that describes the illustrated route accurately."
      },
      {
        "title": "Signs on the Trail",
        "familyId": "pals-post",
        "variantId": "sign-delivery",
        "objective": "Carry the completed signs to the matching trail destinations."
      },
      {
        "title": "Label the Valley Route",
        "familyId": "story-rescue",
        "variantId": "sign-installation",
        "objective": "Read the route plan and install the repaired signs along the workshop path."
      },
      {
        "title": "Fancy's Colour Basket",
        "familyId": "garden-kitchen",
        "variantId": "workshop-colours",
        "objective": "Follow a spoken colour and position description to organise sign paints.",
        "residentId": "fancy",
        "residentAlternateId": "cheeky"
      },
      {
        "title": "Spare Plank Crossing",
        "familyId": "rescue-bridge",
        "variantId": "workshop-side-span",
        "objective": "Build review words to reach Fancy's optional riverside bench.",
        "residentId": "fancy",
        "residentAlternateId": "cheeky"
      }
    ]
  },
  {
    "name": "Night Train Yard",
    "residentId": "cheeky",
    "residentAlternateId": "honky",
    "anchorIds": [
      "s19"
    ],
    "problem": "Cheeky has muddled the hand-pulled convoy's message boards.",
    "repair": "convoy-route",
    "missions": [
      {
        "title": "Message Carts",
        "familyId": "sentence-express",
        "variantId": "handcart-couplings",
        "objective": "Carry and couple word carts to make the convoy's clear message."
      },
      {
        "title": "Convoy Directions",
        "familyId": "river-route",
        "variantId": "yard-junctions",
        "objective": "Follow readable directions through the wooden handcart yard."
      },
      {
        "title": "Retrieve the Boards",
        "familyId": "sound-steps",
        "variantId": "yard-platforms",
        "objective": "Step to requested word boards on the yard's broad storage platforms."
      },
      {
        "title": "Deliver the Route",
        "familyId": "pals-post",
        "variantId": "convoy-posts",
        "objective": "Read destination cues and deliver route boards to the convoy's posts."
      },
      {
        "title": "Send the Convoy",
        "familyId": "story-rescue",
        "variantId": "handcart-departure",
        "objective": "Assemble the final message and guide the hand-pulled carts along the correct branch."
      },
      {
        "title": "Cheeky's Correction",
        "familyId": "fix-it-workshop",
        "variantId": "yard-label-repair",
        "objective": "Replace a requested grapheme in the spare cart labels.",
        "residentId": "cheeky",
        "residentAlternateId": "honky"
      },
      {
        "title": "A Lantern Rest",
        "familyId": "lantern-search",
        "variantId": "yard-rest-nook",
        "objective": "Read a short clue to find Dozy's sheltered rest nook.",
        "residentId": "dozy",
        "residentAlternateId": "cheeky"
      }
    ]
  },
  {
    "name": "Word Forge",
    "residentId": "dino-shy",
    "residentAlternateId": "chompy",
    "anchorIds": [
      "s20"
    ],
    "problem": "Shy has spotted missing parts in the valley's final crossing.",
    "repair": "valley-crossing",
    "missions": [
      {
        "title": "Last Bridge Parts",
        "familyId": "rescue-bridge",
        "variantId": "valley-two-part-span",
        "objective": "Build the word planks for the crossing's two connected sections."
      },
      {
        "title": "Supply Instructions",
        "familyId": "sentence-express",
        "variantId": "valley-instruction",
        "objective": "Arrange a clear instruction showing how the last supplies reach the crossing."
      },
      {
        "title": "Carry the Missing Pieces",
        "familyId": "pals-post",
        "variantId": "valley-supply-loop",
        "objective": "Deliver the requested parts along the repaired valley route."
      },
      {
        "title": "Crossing Controls",
        "familyId": "fix-it-workshop",
        "variantId": "wooden-crossing-locks",
        "objective": "Change word parts to fit the crossing's final wooden locks."
      },
      {
        "title": "The Valley Reunited",
        "familyId": "story-rescue",
        "variantId": "valley-departure",
        "objective": "Follow the completed instructions and bring the supply convoy across to open the next journey."
      },
      {
        "title": "Shy's Hidden View",
        "familyId": "lantern-search",
        "variantId": "valley-lookout",
        "objective": "Read a descriptive clue to find Shy's quiet valley lookout.",
        "residentId": "dino-shy",
        "residentAlternateId": "chompy"
      },
      {
        "title": "Departure Cargo",
        "familyId": "sound-herd",
        "variantId": "valley-camp",
        "objective": "Sort review word cargo into the travelling camp's sound baskets.",
        "residentId": "chompy",
        "residentAlternateId": "dino-shy"
      }
    ]
  },
  {
    "name": "Reedlight Landing",
    "residentId": "wren",
    "residentAlternateId": "burrow",
    "anchorIds": [
      "s21",
      "s22"
    ],
    "problem": "Wren and Burrow need a clear route through the reeds.",
    "repair": "reed-landing",
    "missions": [
      {
        "title": "Burrow's Floating Span",
        "familyId": "rescue-bridge",
        "variantId": "floating-reed-span",
        "objective": "Build word planks across two floating sections with stable resting points."
      },
      {
        "title": "Wren's Reed Route",
        "familyId": "river-route",
        "variantId": "reedland-junctions",
        "objective": "Follow the spoken route using named reed landmarks and safe decision eddies."
      },
      {
        "title": "Landing Labels",
        "familyId": "word-pop",
        "variantId": "reed-signs",
        "objective": "Aim light at the requested word signs to mark the usable landing."
      },
      {
        "title": "Reed Cargo Delivery",
        "familyId": "pals-post",
        "variantId": "landing-banks",
        "objective": "Read the supply notes and deliver baskets to Wren or Burrow's landing place."
      },
      {
        "title": "Open Reedlight Landing",
        "familyId": "story-rescue",
        "variantId": "landing-arrival",
        "objective": "Follow the route and bring the supplies across the floating span to establish the camp."
      },
      {
        "title": "Burrow's Tool",
        "familyId": "lantern-search",
        "variantId": "reed-burrows",
        "objective": "Use a written description to locate Burrow's small digging tool.",
        "residentId": "burrow",
        "residentAlternateId": "wren"
      },
      {
        "title": "Welcome Basket",
        "familyId": "garden-kitchen",
        "variantId": "landing-camp",
        "objective": "Follow Wren's two-step directions to arrange the arriving travellers' basket.",
        "residentId": "wren",
        "residentAlternateId": "burrow"
      }
    ]
  },
  {
    "name": "Mica Steps",
    "residentId": "flint",
    "residentAlternateId": "luna",
    "anchorIds": [
      "s23",
      "s24"
    ],
    "problem": "Flint and Luna need a safe illuminated stair.",
    "repair": "illuminated-stair",
    "missions": [
      {
        "title": "Climb the Mica Stair",
        "familyId": "tree-rescue",
        "variantId": "mica-switchback",
        "objective": "Climb successive word-labelled ledges to recover the stair's light covers."
      },
      {
        "title": "Pattern Baskets",
        "familyId": "sound-herd",
        "variantId": "mica-channels",
        "objective": "Sort words using the anchor's curated vowel contrasts in word context."
      },
      {
        "title": "Read the Stair Note",
        "familyId": "lantern-search",
        "variantId": "mica-clue-shelves",
        "objective": "Read a short instruction to find the shelf holding the next stair part."
      },
      {
        "title": "Light the Markers",
        "familyId": "word-pop",
        "variantId": "mica-lamps",
        "objective": "Aim light at the requested printed markers to illuminate the next landing."
      },
      {
        "title": "Guide the Traveller",
        "familyId": "story-rescue",
        "variantId": "mica-guided-ascent",
        "objective": "Read the completed route note and guide Flint up the illuminated stair to Luna."
      },
      {
        "title": "Luna's Rest Shelf",
        "familyId": "garden-kitchen",
        "variantId": "mica-rest",
        "objective": "Arrange the shelf from a description of positions and object sizes.",
        "residentId": "luna",
        "residentAlternateId": "flint"
      },
      {
        "title": "Burrow's Parcel",
        "familyId": "pals-post",
        "variantId": "mica-lower-loop",
        "objective": "Deliver a labelled parcel to Burrow at the foot of the stair.",
        "residentId": "burrow",
        "residentAlternateId": "flint"
      }
    ]
  },
  {
    "name": "Mirror Fen",
    "residentId": "glimmer",
    "residentAlternateId": "fern",
    "anchorIds": [
      "s25",
      "s26"
    ],
    "problem": "Glimmer's reflected path markers point toward the wrong fen routes.",
    "repair": "mirror-route",
    "missions": [
      {
        "title": "Read the Reflection",
        "familyId": "lantern-search",
        "variantId": "fen-clue-pairs",
        "objective": "Use two written clues to identify the route marker supported by both."
      },
      {
        "title": "Mirror Word Targets",
        "familyId": "word-pop",
        "variantId": "fen-reflectors",
        "objective": "Aim at the requested word label to turn each physical reflector."
      },
      {
        "title": "The Route Message",
        "familyId": "sentence-express",
        "variantId": "fen-message",
        "objective": "Assemble the sentence whose meaning matches the marked route."
      },
      {
        "title": "Fen Junctions",
        "familyId": "river-route",
        "variantId": "fen-branch-loop",
        "objective": "Use the corrected written directions at each safe fen junction."
      },
      {
        "title": "Glimmer's Clear Path",
        "familyId": "story-rescue",
        "variantId": "fen-route-repair",
        "objective": "Follow the repaired message and reposition the reflectors to make Glimmer's path usable."
      },
      {
        "title": "Fern's Reflection Note",
        "familyId": "lantern-search",
        "variantId": "fen-side-pool",
        "objective": "Read a descriptive note to find Fern's dropped route ribbon.",
        "residentId": "fern",
        "residentAlternateId": "glimmer"
      },
      {
        "title": "Pebble Crossing",
        "familyId": "rescue-bridge",
        "variantId": "fen-side-span",
        "objective": "Build review word planks to reach an optional dry lookout.",
        "residentId": "glimmer",
        "residentAlternateId": "fern"
      }
    ]
  },
  {
    "name": "Shellhaven",
    "residentId": "spark",
    "residentAlternateId": "wren",
    "anchorIds": [
      "s27",
      "s28"
    ],
    "problem": "Spark's workshop supplies are scattered around the shore.",
    "repair": "shore-workshop",
    "missions": [
      {
        "title": "Shore Sound Cargo",
        "familyId": "sound-herd",
        "variantId": "shore-boat-lanes",
        "objective": "Route curated contrast words to the matching supply boats."
      },
      {
        "title": "Workshop Boat Round",
        "familyId": "pals-post",
        "variantId": "shore-deliveries",
        "objective": "Read cargo labels and bring each boat basket to its named shore station."
      },
      {
        "title": "Spark's Recipe",
        "familyId": "garden-kitchen",
        "variantId": "shore-workbench",
        "objective": "Follow an ordered preparation instruction using familiar workshop objects."
      },
      {
        "title": "Mend the Labels",
        "familyId": "fix-it-workshop",
        "variantId": "shore-labels",
        "objective": "Change word parts to restore clear labels on the workshop baskets."
      },
      {
        "title": "Restore Shellhaven",
        "familyId": "story-rescue",
        "variantId": "shore-restock",
        "objective": "Follow the supply list, bring the sorted baskets ashore and arrange Spark's workbench."
      },
      {
        "title": "Shell Description",
        "familyId": "lantern-search",
        "variantId": "shore-shells",
        "objective": "Use a written comparison clue to choose the matching shell keepsake.",
        "residentId": "spark",
        "residentAlternateId": "wren"
      },
      {
        "title": "Wren's Shore Message",
        "familyId": "sentence-express",
        "variantId": "shore-notice",
        "objective": "Arrange a message that tells Wren where the next basket waits.",
        "residentId": "wren",
        "residentAlternateId": "spark"
      }
    ]
  },
  {
    "name": "Thunder Lighthouse",
    "residentId": "luna",
    "residentAlternateId": "flint",
    "anchorIds": [
      "s29",
      "s30"
    ],
    "problem": "Luna's harbour signals and route instructions are muddled.",
    "repair": "harbour-signals",
    "missions": [
      {
        "title": "Light the Right Signal",
        "familyId": "word-pop",
        "variantId": "lighthouse-targets",
        "objective": "Aim light at the contextual word target to orient a harbour signal."
      },
      {
        "title": "Read the Harbour Route",
        "familyId": "river-route",
        "variantId": "harbour-channels",
        "objective": "Follow written route instructions between safe harbour decision points."
      },
      {
        "title": "Matching Harbour Cargo",
        "familyId": "pals-post",
        "variantId": "harbour-piers",
        "objective": "Read the cargo descriptions and deliver to their matching piers."
      },
      {
        "title": "Repair the Signal Note",
        "familyId": "sentence-express",
        "variantId": "lighthouse-notice",
        "objective": "Build a message that accurately describes the safe harbour approach."
      },
      {
        "title": "Guide the Boats Home",
        "familyId": "story-rescue",
        "variantId": "harbour-arrival",
        "objective": "Use the clear notice and working signals to guide the supply boats to Luna's pier."
      },
      {
        "title": "Flint's Lookout",
        "familyId": "tree-rescue",
        "variantId": "lighthouse-side-stair",
        "objective": "Climb review word platforms to reach Flint's optional broad lookout.",
        "residentId": "flint",
        "residentAlternateId": "luna"
      },
      {
        "title": "Harbour Keepsake",
        "familyId": "lantern-search",
        "variantId": "harbour-nooks",
        "objective": "Read two descriptive clues to find the matching harbour token.",
        "residentId": "luna",
        "residentAlternateId": "flint"
      }
    ]
  },
  {
    "name": "Mothlight Gate",
    "residentId": "fern",
    "residentAlternateId": "burrow",
    "anchorIds": [
      "s31",
      "s32"
    ],
    "problem": "Fern's garden-to-root path is blocked by a broken walkway.",
    "repair": "garden-root-path",
    "missions": [
      {
        "title": "Root Word Supports",
        "familyId": "fix-it-workshop",
        "variantId": "root-support-slots",
        "objective": "Build the requested word parts to repair the walkway's supports."
      },
      {
        "title": "Garden Pattern Channels",
        "familyId": "sound-herd",
        "variantId": "garden-light-channels",
        "objective": "Route words through the channels using the current taught contrast."
      },
      {
        "title": "Follow the Garden Note",
        "familyId": "river-route",
        "variantId": "garden-root-forks",
        "objective": "Read the route instruction to navigate from the garden into the roots."
      },
      {
        "title": "Fern's Planting Plan",
        "familyId": "garden-kitchen",
        "variantId": "root-planters",
        "objective": "Follow a causal planting instruction and place each object where the meaning requires."
      },
      {
        "title": "Reopen Mothlight Gate",
        "familyId": "story-rescue",
        "variantId": "garden-route-opening",
        "objective": "Install the supports, follow Fern's plan and cross the reopened root walkway."
      },
      {
        "title": "Seed Packet Delivery",
        "familyId": "pals-post",
        "variantId": "garden-side-loop",
        "objective": "Read the destination note and deliver Fern's seed packet to Wren.",
        "residentId": "wren",
        "residentAlternateId": "fern"
      },
      {
        "title": "Root Window Clue",
        "familyId": "lantern-search",
        "variantId": "root-windows",
        "objective": "Use a precise written description to discover Burrow's root window.",
        "residentId": "burrow",
        "residentAlternateId": "fern"
      }
    ]
  },
  {
    "name": "Wispwood Turn",
    "residentId": "stone",
    "residentAlternateId": "fern",
    "anchorIds": [
      "s33",
      "s34"
    ],
    "problem": "Stone cannot carry the supplies through the narrow forest route.",
    "repair": "wide-forest-route",
    "missions": [
      {
        "title": "Read the Wide Route",
        "familyId": "river-route",
        "variantId": "forest-width-forks",
        "objective": "Use precise written directions to choose a route wide enough for Stone."
      },
      {
        "title": "A Bridge for Stone",
        "familyId": "rescue-bridge",
        "variantId": "broad-forest-span",
        "objective": "Build the two-part word bridge with a broad carrying surface."
      },
      {
        "title": "Compare the Crates",
        "familyId": "garden-kitchen",
        "variantId": "forest-loading",
        "objective": "Choose crates by comparative descriptions and place them in the loading area."
      },
      {
        "title": "Stone's Route Message",
        "familyId": "sentence-express",
        "variantId": "forest-notice",
        "objective": "Construct the message that explains why the wider route works."
      },
      {
        "title": "Supplies Through Wispwood",
        "familyId": "story-rescue",
        "variantId": "stone-escort",
        "objective": "Read the final plan, load the suitable crates and guide Stone across the broad bridge."
      },
      {
        "title": "Fern's Small Parcel",
        "familyId": "pals-post",
        "variantId": "forest-narrow-loop",
        "objective": "Take a small labelled parcel along the optional narrow path to Fern.",
        "residentId": "fern",
        "residentAlternateId": "stone"
      },
      {
        "title": "Hidden Rest Glade",
        "familyId": "lantern-search",
        "variantId": "forest-glade",
        "objective": "Combine two written clues to find Stone's broad resting glade.",
        "residentId": "stone",
        "residentAlternateId": "fern"
      }
    ]
  },
  {
    "name": "Sleeping Observatory",
    "residentId": "luna",
    "residentAlternateId": "flint",
    "anchorIds": [
      "s35",
      "s36"
    ],
    "problem": "Luna and Flint must recover the observatory's missing dome parts.",
    "repair": "observatory-dome",
    "missions": [
      {
        "title": "Climb to the Dome",
        "familyId": "tree-rescue",
        "variantId": "observatory-spiral",
        "objective": "Climb real word-labelled platforms to collect the high dome fittings."
      },
      {
        "title": "Flint's Part Clues",
        "familyId": "lantern-search",
        "variantId": "observatory-clue-rooms",
        "objective": "Read linked clues to find the missing fittings in distinct rooms."
      },
      {
        "title": "Dome Word Parts",
        "familyId": "fix-it-workshop",
        "variantId": "observatory-word-parts",
        "objective": "Assemble controlled word parts to fit the dome's repaired handles."
      },
      {
        "title": "Deliver the Fittings",
        "familyId": "pals-post",
        "variantId": "observatory-levels",
        "objective": "Read the fitting labels and carry each part to its intended level."
      },
      {
        "title": "Reopen the Observatory",
        "familyId": "story-rescue",
        "variantId": "observatory-opening",
        "objective": "Use the clue sequence to install the recovered parts and open the dome with Luna."
      },
      {
        "title": "Star-Room Notice",
        "familyId": "sentence-express",
        "variantId": "observatory-notice",
        "objective": "Arrange a clear sentence describing the star-room visit.",
        "residentId": "luna",
        "residentAlternateId": "flint"
      },
      {
        "title": "Flint's Shelf",
        "familyId": "garden-kitchen",
        "variantId": "observatory-study",
        "objective": "Follow precise position instructions to arrange Flint's study shelf.",
        "residentId": "flint",
        "residentAlternateId": "luna"
      }
    ]
  },
  {
    "name": "Aster Archive",
    "residentId": "wren",
    "residentAlternateId": "burrow",
    "anchorIds": [
      "s37",
      "s38"
    ],
    "problem": "Wren's instructions describe the wrong times and actions.",
    "repair": "archive-instructions",
    "missions": [
      {
        "title": "Read the Word in Context",
        "familyId": "lantern-search",
        "variantId": "archive-context-notes",
        "objective": "Use the surrounding message to identify the intended word meaning or pronunciation."
      },
      {
        "title": "Word-Part Repairs",
        "familyId": "fix-it-workshop",
        "variantId": "archive-morphology",
        "objective": "Change a reviewed word part to express the requested time or meaning."
      },
      {
        "title": "Yesterday and Today",
        "familyId": "sentence-express",
        "variantId": "archive-tense-notices",
        "objective": "Repair sentences so their tense matches the illustrated sequence of events."
      },
      {
        "title": "Correct Message Delivery",
        "familyId": "pals-post",
        "variantId": "archive-desks",
        "objective": "Read the repaired instructions and carry each message to its intended reader."
      },
      {
        "title": "Restore Wren's Instructions",
        "familyId": "story-rescue",
        "variantId": "archive-sequence",
        "objective": "Use the corrected time and action messages to complete Wren's archive plan."
      },
      {
        "title": "Burrow's Reference Clue",
        "familyId": "lantern-search",
        "variantId": "archive-side-notes",
        "objective": "Resolve who a short note refers to and find Burrow's labelled basket.",
        "residentId": "burrow",
        "residentAlternateId": "wren"
      },
      {
        "title": "Archive Shelf Plan",
        "familyId": "garden-kitchen",
        "variantId": "archive-shelves",
        "objective": "Follow a multi-step spatial description to arrange the spare message trays.",
        "residentId": "wren",
        "residentAlternateId": "burrow"
      }
    ]
  },
  {
    "name": "First Reading Star",
    "residentId": "wren",
    "residentAlternateId": "luna",
    "anchorIds": [
      "s39",
      "s40"
    ],
    "problem": "The three communities need a final clear route to the gathering.",
    "repair": "skybridge-gathering",
    "missions": [
      {
        "title": "The Gathering Clues",
        "familyId": "lantern-search",
        "variantId": "star-route-clues",
        "objective": "Read linked clues and identify the route supported by the whole message."
      },
      {
        "title": "Build the Skybridge",
        "familyId": "rescue-bridge",
        "variantId": "skybridge-two-section",
        "objective": "Construct controlled word planks across two connected skybridge sections."
      },
      {
        "title": "Invitations Across the Worlds",
        "familyId": "pals-post",
        "variantId": "star-camp-deliveries",
        "objective": "Read destination messages and carry the invitations to the three visiting camps."
      },
      {
        "title": "Explain the Route",
        "familyId": "sentence-express",
        "variantId": "star-causal-message",
        "objective": "Build a sentence explaining why the chosen route reaches the gathering."
      },
      {
        "title": "The First Reading Star",
        "familyId": "story-rescue",
        "variantId": "three-world-gathering",
        "objective": "Read the final plan, cross the completed skybridge and welcome the three communities to the gathering."
      },
      {
        "title": "A Keepsake for Home",
        "familyId": "garden-kitchen",
        "variantId": "star-keepsakes",
        "objective": "Follow each visitor's description to choose and place a keepsake in their basket.",
        "residentId": "wren",
        "residentAlternateId": "luna"
      },
      {
        "title": "One More Mystery",
        "familyId": "lantern-search",
        "variantId": "star-side-lookout",
        "objective": "Combine two optional clues to discover the shared lookout and a final friendly message.",
        "residentId": "luna",
        "residentAlternateId": "wren"
      }
    ]
  }
];

const deepFreeze = value => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};
const worldIds = ["meadow", "dino", "moonwood"];
const stageIdAt = index => `${worldIds[Math.floor(index / 10)]}-${String(index + 1).padStart(2, "0")}`;
const familyConstruct = {
  "sound-steps": "grapheme-recognition",
  "word-pop": "word-recognition",
  "rescue-bridge": "ordered-encoding",
  "tree-rescue": "word-reading",
  "pals-post": "instruction-comprehension",
  "sound-herd": "sound-contrast",
  "river-route": "direction-comprehension",
  "sentence-express": "sentence-meaning",
  "fix-it-workshop": "word-construction",
  "garden-kitchen": "oral-language",
  "lantern-search": "clue-comprehension",
  "story-rescue": "connected-instructions"
};
const familyCamera = {
  "tree-rescue": "vertical-follow", "word-pop": "stable-aim",
  "rescue-bridge": "wide-lateral", "river-route": "junction-follow"
};

export const CAMPAIGN_STAGES = deepFreeze(definitions.map((stage, index) => {
  const id = stageIdAt(index);
  return {
    id, number: index + 1, worldId: worldIds[Math.floor(index / 10)],
    name: stage.name, residentId: stage.residentId, residentAlternateId: stage.residentAlternateId, problem: stage.problem,
    anchorIds: stage.anchorIds, legacyStopIds: [...stage.anchorIds],
    missionIds: [1, 2, 3, 4, 5].map(n => `${id}-${n}`),
    optionalMissionIds: [1, 2].map(n => `${id}-side-${n}`),
    finaleMissionId: `${id}-5`,
    prerequisiteMissionIds: index ? [`${stageIdAt(index - 1)}-5`] : [],
    explorationMinutes: 6,
    repairId: `${id}-${stage.repair}`,
    productionStatus: "authored-descriptor"
  };
}));

// Opening layouts describe actual traversal, construction and return actions.
// Coordinates are world units, with y increasing upwards from the ground.
const OPENING_LAYOUTS = [
  { width: 1800, height: 720, spawn: { x: 100, y: 0 }, goal: { x: 1510, y: 0 },
    platforms: [{ x: 360, y: 55, width: 190 }, { x: 710, y: 110, width: 190 }, { x: 1060, y: 55, width: 190 }],
    phases: ["Meet Muddy beside the empty bath.", "Model a, then choose a sound stone.", "Model m, then follow the fork to the bucket.", "Carry the bucket back along the ground shortcut."],
    resolvedObject: "bucket-on-bath-hook" },
  { width: 1600, height: 720, spawn: { x: 100, y: 0 }, goal: { x: 1320, y: 0 },
    targetStations: [{ x: 420, y: 160 }, { x: 830, y: 240 }, { x: 1210, y: 160 }],
    phases: ["Walk to the soap shelf.", "Model t and aim at its stationary tag.", "Model s and release the soap tray with its tag.", "Pick up the tray and return to the bath."],
    resolvedObject: "soap-tray-recovered" },
  { width: 2300, height: 720, spawn: { x: 100, y: 0 }, goal: { x: 2050, y: 0 },
    gaps: [{ x: 650, width: 300, slots: 3 }, { x: 1370, width: 300, slots: 3 }],
    phases: ["Reach the plank rack beside the first root gap.", "Hear mat and place its three grapheme planks in order.", "Cross the constructed collision surface to the resting island.", "Hear sat and build the second span.", "Collect the bath mat and carry it home across both spans."],
    resolvedObject: "bath-mat-and-root-spans" },
  { width: 1500, height: 720, spawn: { x: 90, y: 0 }, goal: { x: 1150, y: 0 },
    placementZones: [{ id: "rail", x: 720, y: 160 }, { id: "tray", x: 1120, y: 90 }],
    phases: ["Hear the location words with a supported demonstration.", "Pick up the towel and place it on the rail.", "Put the soap in the tray.", "Walk around the arranged bath corner with Muddy."],
    resolvedObject: "bath-objects-positioned" },
  { width: 2600, height: 900, spawn: { x: 100, y: 0 }, goal: { x: 2350, y: 0 },
    sections: ["repaired-root-spans", "water-pump", "bath-rail-and-tray"],
    phases: ["Follow the familiar sound-stone route to the bucket.", "Cross the completed bridges to the water pump.", "Fill and carry the bucket back without a timed balance test.", "Follow Muddy's spoken bath-setting sequence.", "The filled bath, mat, soap and towel remain visible in the hub."],
    resolvedObject: "restored-bath-corner" },
  { width: 1400, height: 720, spawn: { x: 100, y: 0 }, goal: { x: 1130, y: 0 },
    phases: ["Meet Tiny below the oak.", "Listen to the button's size description.", "Inspect three root nooks and bring the matching button to Tiny."],
    resolvedObject: "tiny-button-returned" },
  { width: 1700, height: 720, spawn: { x: 100, y: 0 }, goal: { x: 1400, y: 0 },
    phases: ["Pick up Shy's cushion.", "Listen to the shaded-seat destination.", "Choose either ground route and deliver it to the shaded seat."],
    resolvedObject: "shy-seat-cushion" }
];
const OPENING_CURRICULUM = [
  { targetIds: ["a", "m"], elIntroductionCycleNumbers: [1], construct: "grapheme-recognition", allowedWordIds: [], stimulus: "recorded-phoneme", printRole: "taught-grapheme-options" },
  { targetIds: ["t", "s"], elIntroductionCycleNumbers: [2], construct: "grapheme-recognition", allowedWordIds: [], stimulus: "recorded-phoneme", printRole: "taught-grapheme-options" },
  { targetIds: ["a", "m", "t", "s"], elIntroductionCycleNumbers: [1, 2], allowedWordIds: ["mat", "sat"], stimulus: "recorded-word", printRole: "encoding-options-only", minimumTaughtTargetIds: ["a", "m", "t", "s"] },
  { targetIds: [], construct: "oral-spatial-language", oralConcepts: ["on", "in"], allowedWordIds: [], stimulus: "recorded-direction", printRole: "none" },
  { targetIds: ["a", "m", "t", "s"], allowedWordIds: ["am", "at", "mat", "sat"], stimulus: "recorded-direction", printRole: "supported-review", minimumTaughtTargetIds: ["a", "m", "t", "s"] },
  { targetIds: [], construct: "oral-description", oralConcepts: ["small", "below"], allowedWordIds: [], stimulus: "recorded-description", printRole: "none" },
  { targetIds: [], construct: "oral-destination", oralConcepts: ["shaded", "seat"], allowedWordIds: [], stimulus: "recorded-direction", printRole: "none" }
];

export const CAMPAIGN_MISSIONS = deepFreeze(definitions.flatMap((stage, index) => {
  const stageRecord = CAMPAIGN_STAGES[index];
  const targets = stage.anchorIds.flatMap(id => getStop(id).teach.map(target => target.id));
  return stage.missions.map((mission, offset) => {
    const optional = offset > 4;
    const finale = offset === 4;
    const id = optional ? `${stageRecord.id}-side-${offset - 4}` : `${stageRecord.id}-${offset + 1}`;
    const entry = stageRecord.prerequisiteMissionIds;
    const prerequisiteMissionIds = finale
      ? [`${stageRecord.id}-3`, `${stageRecord.id}-4`]
      : offset === 2 ? [`${stageRecord.id}-1`, `${stageRecord.id}-2`]
        : offset === 3 ? [`${stageRecord.id}-2`] : [...entry];
    // Each anchor's targets are introduced in two separate teaching missions.
    // Both are available together; later spelling waits on both teaching branches.
    const split = Math.ceil(targets.length / 2);
    const teachingTargets = offset === 0 ? targets.slice(0, split) : targets.slice(split);
    const targetIds = offset < 2 ? teachingTargets
      : offset === 2 ? targets
        : offset === 3 ? targets.slice(split) : targets;
    return {
      ...mission, id, stageId: stageRecord.id, worldId: stageRecord.worldId,
      kind: optional ? "optional" : "main", finale,
      residentId: mission.residentId || stage.residentId, residentAlternateId: mission.residentAlternateId || stage.residentAlternateId, problem: stage.problem,
      prerequisiteMissionIds,
      families: finale ? [stage.missions[0].familyId, stage.missions[1].familyId, mission.familyId] : [mission.familyId],
      layoutId: `${stageRecord.id}/${mission.variantId}`,
      layout: {
        ...(index === 0 ? OPENING_LAYOUTS[offset] : {}),
        identity: `${stageRecord.id}/${mission.variantId}`,
        topology: mission.variantId,
        camera: familyCamera[mission.familyId] || "lateral-follow",
        interaction: mission.objective,
        motorRecovery: "Return to the last safe foothold; retain the current language attempt.",
        checkpoint: "Retain completed construction, choices, support and carried objects."
      },
      curriculum: {
        anchorIds: stage.anchorIds, targetIds,
        mode: offset < 2 ? "teach" : "practice",
        construct: familyConstruct[mission.familyId],
        wordPoolSource: "questSequence",
        independentPrintRequires: "taught-code-and-current-instructional-eligibility",
        evidence: "formative-only",
        configurationsStatus: "requires-authored-reviewed-content-sets",
        ...(index === 0 ? OPENING_CURRICULUM[offset] : {})
      },
      outcome: {
        repairId: finale ? stageRecord.repairId : `${id}-resolved`,
        description: mission.objective,
        permanent: true
      },
      estimatedMinutes: optional ? 5 : finale ? (index < 20 ? 9 : 12) : [4.5, 6, 7.5][Math.floor(index / 10)],
      durationEvidence: "production-estimate-not-measured",
      productionStatus: "authored-descriptor"
    };
  });
}));

export const CAMPAIGN_WORLDS = deepFreeze([
  { id: "meadow", name: "Sunny Meadow Farm", story: "Help the farm get ready.", estimatedMinutes: 330 },
  { id: "dino", name: "Sunny Hollow", story: "Reconnect the valley.", estimatedMinutes: 390 },
  { id: "moonwood", name: "Moonwood", story: "Reconnect the lantern trail.", estimatedMinutes: 480 }
].map(world => ({ ...world, stageIds: CAMPAIGN_STAGES.filter(stage => stage.worldId === world.id).map(stage => stage.id) })));

const stageById = new Map(CAMPAIGN_STAGES.map(stage => [stage.id, stage]));
const missionById = new Map(CAMPAIGN_MISSIONS.map(mission => [mission.id, mission]));
export const getCampaignStage = id => stageById.get(id) || null;
export const getCampaignMission = id => missionById.get(id) || null;
