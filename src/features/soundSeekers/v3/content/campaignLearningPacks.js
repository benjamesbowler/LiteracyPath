import { SOUND_SEEKERS_CAMPAIGN_PALETTE as CAMPAIGN_COLORS } from '../../visual/visualTokens.js';
// Authored mission-local semantic inventories. Each row fixes real scene
// destinations and requested objects; no objective parsing or keyword fallback.
// Script generation below is a lossless expansion of these explicit records.
// Explicit presentation annotations for the authored labels below.
const APPEARANCE = {
  "on the bed": {
    "relation": "on",
    "landmark": {
      "kind": "bed"
    }
  },
  "under the pillow": {
    "relation": "under",
    "landmark": {
      "kind": "pillow"
    },
    "elevation": "low"
  },
  "in the basket": {
    "relation": "in",
    "landmark": {
      "kind": "basket"
    }
  },
  "to the bed": {},
  "to the shelf": {},
  "to the basket": {},
  "to the tree": {},
  "to the cave": {},
  "red ribbon": {
    "colour": "red"
  },
  "blue ribbon": {
    "colour": "blue"
  },
  "white feather": {
    "colour": "white"
  },
  "green leaf": {
    "colour": "green"
  },
  "small button": {
    "sizeVariant": "small"
  },
  "large button": {
    "sizeVariant": "large"
  },
  "in the nest": {
    "relation": "in",
    "landmark": {
      "kind": "nest"
    }
  },
  "beside the nest": {
    "relation": "beside",
    "landmark": {
      "kind": "nest"
    }
  },
  "to the nest": {},
  "to the ramp": {},
  "long white feather": {
    "sizeVariant": "long",
    "colour": "white"
  },
  "short white feather": {
    "sizeVariant": "short",
    "colour": "white",
    "heightVariant": "short"
  },
  "long red feather": {
    "sizeVariant": "long",
    "colour": "red"
  },
  "short red feather": {
    "sizeVariant": "short",
    "colour": "red",
    "heightVariant": "short"
  },
  "to the pond": {},
  "to the barn": {},
  "above the basket": {
    "relation": "above",
    "landmark": {
      "kind": "basket"
    }
  },
  "beside the rack": {
    "relation": "beside",
    "landmark": {
      "kind": "rack"
    }
  },
  "to the bridge": {},
  "to the reeds": {},
  "to the mat": {},
  "to the island": {},
  "past the reeds": {},
  "around the stone": {
    "count": 1
  },
  "towards the tree": {},
  "to the hedge": {},
  "beside the gate": {
    "relation": "beside",
    "landmark": {
      "kind": "gate"
    }
  },
  "on the mat": {
    "relation": "on",
    "landmark": {
      "kind": "mat"
    }
  },
  "red berries": {
    "colour": "red"
  },
  "blue berries": {
    "colour": "blue"
  },
  "one berry": {
    "count": 1
  },
  "two berries": {
    "count": 2
  },
  "three berries": {
    "count": 3
  },
  "empty basket": {
    "filled": false
  },
  "seat under the tree": {
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "seat beside the hedge": {
    "relation": "beside",
    "landmark": {
      "kind": "hedge"
    }
  },
  "seat by the pond": {},
  "ribbon on the seat": {
    "relation": "on",
    "landmark": {
      "kind": "seat"
    }
  },
  "basket under the seat": {
    "relation": "under",
    "landmark": {
      "kind": "seat"
    }
  },
  "leaf beside the seat": {
    "relation": "beside",
    "landmark": {
      "kind": "seat"
    }
  },
  "on the high shelf": {
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "high"
  },
  "on the low mat": {
    "relation": "on",
    "landmark": {
      "kind": "mat"
    },
    "elevation": "low"
  },
  "past the red flowers": {
    "colour": "red",
    "elevation": "low"
  },
  "past the yellow flowers": {
    "colour": "yellow",
    "elevation": "low"
  },
  "beside the mat": {
    "relation": "beside",
    "landmark": {
      "kind": "mat"
    }
  },
  "under the shade": {
    "relation": "under",
    "landmark": {
      "kind": "shade"
    }
  },
  "past the lilies": {},
  "to the tree on the bank": {
    "relation": "on",
    "landmark": {
      "kind": "bank"
    }
  },
  "to the reeds on the bank": {
    "relation": "on",
    "landmark": {
      "kind": "bank"
    }
  },
  "to the wooden dock": {},
  "to the boat": {},
  "to the dock": {},
  "to the resting mat": {},
  "flag above the reeds": {
    "relation": "above",
    "landmark": {
      "kind": "reed"
    }
  },
  "flag beside the dock": {
    "relation": "beside",
    "landmark": {
      "kind": "dock"
    }
  },
  "flag under the tree": {
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "ribbon on the post": {
    "relation": "on",
    "landmark": {
      "kind": "post"
    }
  },
  "stone beside the post": {
    "count": 1,
    "relation": "beside",
    "landmark": {
      "kind": "post"
    }
  },
  "basket under the post": {
    "relation": "under",
    "landmark": {
      "kind": "post"
    }
  },
  "green apple": {
    "colour": "green"
  },
  "orange carrot": {
    "colour": "orange"
  },
  "round bread": {
    "shape": "round"
  },
  "cup of water": {},
  "empty plate": {
    "filled": false
  },
  "to the picnic mat": {},
  "under the tree": {
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "small plate": {
    "sizeVariant": "small"
  },
  "large plate": {
    "sizeVariant": "large"
  },
  "small cup": {
    "sizeVariant": "small"
  },
  "large cup": {
    "sizeVariant": "large"
  },
  "small basket": {
    "sizeVariant": "small"
  },
  "large basket": {
    "sizeVariant": "large"
  },
  "past the water wheel": {},
  "through the open gate": {
    "open": true
  },
  "to the ladder": {},
  "to the broad ledge": {},
  "to the lower mat": {
    "elevation": "low"
  },
  "red ribbon on the post": {
    "colour": "red",
    "relation": "on",
    "landmark": {
      "kind": "post"
    }
  },
  "blue ribbon on the post": {
    "colour": "blue",
    "relation": "on",
    "landmark": {
      "kind": "post"
    }
  },
  "red ribbon below the wheel": {
    "colour": "red",
    "relation": "below",
    "landmark": {
      "kind": "wheel"
    },
    "elevation": "low"
  },
  "yellow flag": {
    "colour": "yellow",
    "elevation": "low"
  },
  "under the bridge": {
    "relation": "under",
    "landmark": {
      "kind": "bridge"
    }
  },
  "around the island": {},
  "to the open gate": {
    "open": true
  },
  "to the signal post": {},
  "to the gathering tree": {},
  "seat in the shade": {
    "relation": "in",
    "landmark": {
      "kind": "shade"
    }
  },
  "seat in the sun": {
    "relation": "in",
    "landmark": {
      "kind": "sun"
    }
  },
  "seat by the water": {},
  "cup on the seat": {
    "relation": "on",
    "landmark": {
      "kind": "seat"
    }
  },
  "ribbon beside the seat": {
    "relation": "beside",
    "landmark": {
      "kind": "seat"
    }
  },
  "to the flat rock": {
    "shape": "flat"
  },
  "to the tall fern": {
    "heightVariant": "tall"
  },
  "basket with a red ribbon": {
    "landmark": {
      "kind": "ribbon",
      "colour": "red"
    },
    "relation": "beside"
  },
  "basket with a blue ribbon": {
    "landmark": {
      "kind": "ribbon",
      "colour": "blue"
    },
    "relation": "beside"
  },
  "basket with no ribbon": {},
  "large crate": {
    "sizeVariant": "large"
  },
  "small crate": {
    "sizeVariant": "small"
  },
  "round parcel": {
    "shape": "round"
  },
  "beside the water": {
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "on the flat rock": {
    "shape": "flat",
    "relation": "on",
    "landmark": {
      "kind": "rock"
    }
  },
  "above the beam": {
    "relation": "above",
    "landmark": {
      "kind": "beam"
    }
  },
  "beside the post": {
    "relation": "beside",
    "landmark": {
      "kind": "post"
    }
  },
  "to the shelter frame": {},
  "to the roof": {},
  "to the dry bed": {},
  "smooth round stone": {
    "shape": "round",
    "surface": "smooth",
    "count": 1
  },
  "rough round stone": {
    "shape": "round",
    "surface": "rough",
    "count": 1
  },
  "smooth flat stone": {
    "shape": "flat",
    "surface": "smooth",
    "count": 1
  },
  "rough flat stone": {
    "shape": "flat",
    "surface": "rough",
    "count": 1
  },
  "soft leaf": {},
  "straight stick": {
    "shape": "straight"
  },
  "to the cave entrance": {},
  "to the fern": {},
  "to the red post": {
    "colour": "red"
  },
  "to the empty basket": {
    "filled": false
  },
  "red ribbon beside the post": {
    "colour": "red",
    "relation": "beside",
    "landmark": {
      "kind": "post"
    }
  },
  "blue ribbon beside the post": {
    "colour": "blue",
    "relation": "beside",
    "landmark": {
      "kind": "post"
    }
  },
  "red ribbon below the fern": {
    "colour": "red",
    "relation": "below",
    "landmark": {
      "kind": "fern"
    },
    "elevation": "low"
  },
  "blue flag": {
    "colour": "blue"
  },
  "long leaf": {
    "sizeVariant": "long"
  },
  "round leaf": {
    "shape": "round"
  },
  "past the tall fern": {
    "heightVariant": "tall"
  },
  "around the flat rock": {
    "shape": "flat"
  },
  "under the wooden bridge": {
    "relation": "under",
    "landmark": {
      "kind": "bridge"
    }
  },
  "in the long basket": {
    "sizeVariant": "long",
    "relation": "in",
    "landmark": {
      "kind": "basket"
    }
  },
  "on the wide mat": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "on",
    "landmark": {
      "kind": "mat"
    }
  },
  "beside the tall post": {
    "heightVariant": "tall",
    "relation": "beside",
    "landmark": {
      "kind": "post"
    }
  },
  "to the balanced bridge": {},
  "to the resting island": {},
  "flag above the fern": {
    "relation": "above",
    "landmark": {
      "kind": "fern"
    }
  },
  "flag beside the rock": {
    "relation": "beside",
    "landmark": {
      "kind": "rock"
    }
  },
  "flag below the bridge": {
    "relation": "below",
    "landmark": {
      "kind": "bridge"
    },
    "elevation": "low"
  },
  "red post": {
    "colour": "red"
  },
  "blue post": {
    "colour": "blue"
  },
  "yellow ribbon": {
    "colour": "yellow",
    "elevation": "low"
  },
  "to the lookout ledge": {},
  "towards the low lever": {
    "elevation": "low"
  },
  "around the large rock": {
    "sizeVariant": "large"
  },
  "to the wooden lever": {},
  "to the lowered bridge": {
    "elevation": "low"
  },
  "to the far post": {},
  "to the high shelf": {
    "elevation": "high"
  },
  "to the low shelf": {
    "elevation": "low"
  },
  "to the middle shelf": {
    "elevation": "middle"
  },
  "to the high post": {
    "elevation": "high"
  },
  "to the low post": {
    "elevation": "low"
  },
  "to the rest bench": {},
  "to the bench": {},
  "on the bench": {
    "relation": "on",
    "landmark": {
      "kind": "bench"
    }
  },
  "under the bench": {
    "relation": "under",
    "landmark": {
      "kind": "bench"
    }
  },
  "beside the tree": {
    "relation": "beside",
    "landmark": {
      "kind": "tree"
    }
  },
  "to the red store bay": {
    "colour": "red"
  },
  "to the blue store bay": {
    "colour": "blue"
  },
  "to the green store bay": {
    "colour": "green"
  },
  "above the shelf": {
    "relation": "above",
    "landmark": {
      "kind": "shelf"
    }
  },
  "below the shelf": {
    "relation": "below",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "low"
  },
  "in the crate": {
    "relation": "in",
    "landmark": {
      "kind": "crate"
    }
  },
  "to the food bay": {},
  "to the tool bay": {},
  "to the bedding bay": {},
  "small round basket": {
    "sizeVariant": "small",
    "shape": "round"
  },
  "large round basket": {
    "sizeVariant": "large",
    "shape": "round"
  },
  "small long basket": {
    "sizeVariant": "long"
  },
  "large long basket": {
    "sizeVariant": "long"
  },
  "to the route post": {},
  "to the bridge entrance": {},
  "to the resting tree": {},
  "beside the cave": {
    "relation": "beside",
    "landmark": {
      "kind": "cave"
    }
  },
  "beside the bridge": {
    "relation": "beside",
    "landmark": {
      "kind": "bridge"
    }
  },
  "beside the bench": {
    "relation": "beside",
    "landmark": {
      "kind": "bench"
    }
  },
  "in the red tray": {
    "colour": "red",
    "relation": "in",
    "landmark": {
      "kind": "tray",
      "colour": "red"
    }
  },
  "in the blue tray": {
    "colour": "blue",
    "relation": "in",
    "landmark": {
      "kind": "tray",
      "colour": "blue"
    }
  },
  "on the shelf": {
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    }
  },
  "past the empty cart": {
    "filled": false
  },
  "towards the blue post": {
    "colour": "blue"
  },
  "through the wide gate": {
    "sizeVariant": "wide",
    "widthVariant": "wide"
  },
  "to the cave post": {},
  "to the bridge post": {},
  "to the camp post": {},
  "to the small cart": {
    "sizeVariant": "small"
  },
  "to the wide gate": {
    "sizeVariant": "wide",
    "widthVariant": "wide"
  },
  "to the camp": {},
  "seat under the roof": {
    "relation": "under",
    "landmark": {
      "kind": "roof"
    }
  },
  "seat beside the cart": {
    "relation": "beside",
    "landmark": {
      "kind": "cart"
    }
  },
  "seat behind the fern": {
    "relation": "behind",
    "landmark": {
      "kind": "fern"
    }
  },
  "pillow on the seat": {
    "relation": "on",
    "landmark": {
      "kind": "seat"
    },
    "elevation": "low"
  },
  "mat beside the seat": {
    "relation": "beside",
    "landmark": {
      "kind": "seat"
    }
  },
  "to the first bridge": {},
  "to the second bridge": {},
  "to the first crossing": {},
  "to the travelling camp": {},
  "seat beside the water": {
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "seat on the open rock": {
    "relation": "on",
    "landmark": {
      "kind": "rock"
    },
    "open": true
  },
  "ribbon above the seat": {
    "relation": "above",
    "landmark": {
      "kind": "seat"
    }
  },
  "basket below the seat": {
    "relation": "below",
    "landmark": {
      "kind": "seat"
    },
    "elevation": "low"
  },
  "flag beside the seat": {
    "relation": "beside",
    "landmark": {
      "kind": "seat"
    }
  },
  "past the silver reeds": {
    "colour": CAMPAIGN_COLORS['appearance-stone']
  },
  "towards the low lantern": {
    "elevation": "low"
  },
  "around the mossy island": {},
  "to Wren's landing": {},
  "to Burrow's landing": {},
  "to the new camp": {},
  "to the first floating span": {},
  "small digging tool": {
    "sizeVariant": "small"
  },
  "large digging tool": {
    "sizeVariant": "large"
  },
  "short rope": {
    "sizeVariant": "short",
    "heightVariant": "short"
  },
  "long rope": {
    "sizeVariant": "long"
  },
  "small bucket": {
    "sizeVariant": "small"
  },
  "large bucket": {
    "sizeVariant": "large"
  },
  "beside the basket": {
    "relation": "beside",
    "landmark": {
      "kind": "basket"
    }
  },
  "under the lantern": {
    "relation": "under",
    "landmark": {
      "kind": "lantern"
    }
  },
  "high shelf with a lantern": {
    "landmark": {
      "kind": "lantern"
    },
    "relation": "beside",
    "elevation": "high"
  },
  "low shelf with a lantern": {
    "landmark": {
      "kind": "lantern"
    },
    "relation": "beside",
    "elevation": "low"
  },
  "high shelf with a book": {
    "landmark": {
      "kind": "book"
    },
    "relation": "beside",
    "elevation": "high"
  },
  "low shelf with a book": {
    "landmark": {
      "kind": "book"
    },
    "relation": "beside",
    "elevation": "low"
  },
  "middle shelf with a cup": {
    "landmark": {
      "kind": "cup"
    },
    "relation": "beside",
    "elevation": "middle"
  },
  "middle shelf with a basket": {
    "landmark": {
      "kind": "basket"
    },
    "relation": "beside",
    "elevation": "middle"
  },
  "to the first stair": {},
  "to the broad landing": {},
  "to Luna's door": {},
  "on the top shelf": {
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "high"
  },
  "on the middle shelf": {
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "middle"
  },
  "on the bottom shelf": {
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "low"
  },
  "to the foot of the stair": {
    "elevation": "low"
  },
  "to Burrow's door": {},
  "red post beside the reeds": {
    "colour": "red",
    "relation": "beside",
    "landmark": {
      "kind": "reed"
    }
  },
  "blue post beside the reeds": {
    "colour": "blue",
    "relation": "beside",
    "landmark": {
      "kind": "reed"
    }
  },
  "red post beside the tree": {
    "colour": "red",
    "relation": "beside",
    "landmark": {
      "kind": "tree"
    }
  },
  "blue post beside the tree": {
    "colour": "blue",
    "relation": "beside",
    "landmark": {
      "kind": "tree"
    }
  },
  "yellow post beside the bridge": {
    "colour": "yellow",
    "relation": "beside",
    "landmark": {
      "kind": "bridge"
    },
    "elevation": "low"
  },
  "yellow post beside the rock": {
    "colour": "yellow",
    "relation": "beside",
    "landmark": {
      "kind": "rock"
    },
    "elevation": "low"
  },
  "past the red post": {
    "colour": "red"
  },
  "under the low bridge": {
    "relation": "under",
    "landmark": {
      "kind": "bridge"
    },
    "elevation": "low"
  },
  "towards the lantern tree": {},
  "to the first marker": {},
  "to the broad reflector": {},
  "to the lantern tree": {},
  "green ribbon beside the reeds": {
    "colour": "green",
    "relation": "beside",
    "landmark": {
      "kind": "reed"
    }
  },
  "blue ribbon beside the reeds": {
    "colour": "blue",
    "relation": "beside",
    "landmark": {
      "kind": "reed"
    }
  },
  "green ribbon beside the tree": {
    "colour": "green",
    "relation": "beside",
    "landmark": {
      "kind": "tree"
    }
  },
  "leaf below the reflector": {
    "relation": "below",
    "landmark": {
      "kind": "reflector"
    },
    "elevation": "low"
  },
  "flag above the reflector": {
    "relation": "above",
    "landmark": {
      "kind": "reflector"
    }
  },
  "basket behind the reflector": {
    "relation": "behind",
    "landmark": {
      "kind": "reflector"
    }
  },
  "to the north shore dock": {},
  "to the south shore dock": {},
  "to Spark's bench": {},
  "in the tool tray": {
    "relation": "in",
    "landmark": {
      "kind": "tray"
    }
  },
  "on the workbench": {
    "relation": "on",
    "landmark": {
      "kind": "bench"
    }
  },
  "to the supply dock": {},
  "to the workbench": {},
  "to the storage shelf": {},
  "small round shell": {
    "sizeVariant": "small",
    "shape": "round"
  },
  "large round shell": {
    "sizeVariant": "large",
    "shape": "round"
  },
  "small pointed shell": {
    "sizeVariant": "small",
    "shape": "pointed"
  },
  "large pointed shell": {
    "sizeVariant": "large",
    "shape": "pointed"
  },
  "between the harbour posts": {},
  "towards the wide dock": {
    "sizeVariant": "wide",
    "widthVariant": "wide"
  },
  "around the dark rock": {
    "colour": CAMPAIGN_COLORS['appearance-dark-stripe']
  },
  "to the lantern pier": {},
  "to the stone pier": {
    "count": 1
  },
  "to the wooden pier": {},
  "to the harbour signal": {},
  "to the safe pier": {},
  "to Luna's bench": {},
  "round shell with a dark stripe": {
    "shape": "round",
    "stripeColour": CAMPAIGN_COLORS['appearance-dark-stripe'],
    "landmark": {
      "kind": "stripe"
    },
    "relation": "beside"
  },
  "round shell with a light stripe": {
    "shape": "round",
    "stripeColour": CAMPAIGN_COLORS['appearance-light-stripe'],
    "landmark": {
      "kind": "stripe"
    },
    "relation": "beside"
  },
  "pointed shell with a dark stripe": {
    "shape": "pointed",
    "stripeColour": CAMPAIGN_COLORS['appearance-dark-stripe'],
    "landmark": {
      "kind": "stripe"
    },
    "relation": "beside"
  },
  "pointed shell with a light stripe": {
    "shape": "pointed",
    "stripeColour": CAMPAIGN_COLORS['appearance-light-stripe'],
    "landmark": {
      "kind": "stripe"
    },
    "relation": "beside"
  },
  "flat stone with a dark mark": {
    "shape": "flat",
    "count": 1,
    "stripeColour": CAMPAIGN_COLORS['appearance-dark-stripe'],
    "landmark": {
      "kind": "mark"
    },
    "relation": "beside"
  },
  "round stone with a light mark": {
    "shape": "round",
    "count": 1,
    "stripeColour": CAMPAIGN_COLORS['appearance-light-stripe'],
    "landmark": {
      "kind": "mark"
    },
    "relation": "beside"
  },
  "past the seed garden": {},
  "under the broad root": {
    "relation": "under",
    "landmark": {
      "kind": "root"
    }
  },
  "through the moth gate": {},
  "in the sunny pot": {
    "relation": "in",
    "landmark": {
      "kind": "pot"
    }
  },
  "in the shady pot": {
    "relation": "in",
    "landmark": {
      "kind": "pot"
    }
  },
  "in the water tray": {
    "relation": "in",
    "landmark": {
      "kind": "tray"
    }
  },
  "to the root supports": {},
  "to the planting bed": {},
  "to Wren's door": {},
  "to Fern's garden": {},
  "to Burrow's window": {},
  "round window above the root": {
    "shape": "round",
    "relation": "above",
    "landmark": {
      "kind": "root"
    }
  },
  "square window above the root": {
    "shape": "square",
    "relation": "above",
    "landmark": {
      "kind": "root"
    }
  },
  "round window below the root": {
    "shape": "round",
    "relation": "below",
    "landmark": {
      "kind": "root"
    },
    "elevation": "low"
  },
  "square window below the root": {
    "shape": "square",
    "relation": "below",
    "landmark": {
      "kind": "root"
    },
    "elevation": "low"
  },
  "small door beside the root": {
    "sizeVariant": "small",
    "relation": "beside",
    "landmark": {
      "kind": "root"
    }
  },
  "wide door beside the root": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "beside",
    "landmark": {
      "kind": "root"
    }
  },
  "along the wide path": {
    "sizeVariant": "wide",
    "widthVariant": "wide"
  },
  "across the broad bridge": {},
  "through the tall gate": {
    "heightVariant": "tall"
  },
  "tall narrow crate": {
    "sizeVariant": "narrow",
    "heightVariant": "tall",
    "widthVariant": "narrow"
  },
  "short narrow crate": {
    "sizeVariant": "narrow",
    "heightVariant": "short",
    "widthVariant": "narrow"
  },
  "tall wide crate": {
    "sizeVariant": "wide",
    "heightVariant": "tall",
    "widthVariant": "wide"
  },
  "short wide crate": {
    "sizeVariant": "wide",
    "heightVariant": "short",
    "widthVariant": "wide"
  },
  "to the wide path": {
    "sizeVariant": "wide",
    "widthVariant": "wide"
  },
  "to the broad bridge": {},
  "to the rest glade": {},
  "to Stone's glade": {
    "count": 1
  },
  "wide glade under the trees": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "narrow glade under the trees": {
    "sizeVariant": "narrow",
    "widthVariant": "narrow",
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "wide glade beside the water": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "narrow glade beside the water": {
    "sizeVariant": "narrow",
    "widthVariant": "narrow",
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "large seat beside the gate": {
    "sizeVariant": "large",
    "relation": "beside",
    "landmark": {
      "kind": "gate"
    }
  },
  "small seat beside the gate": {
    "sizeVariant": "small",
    "relation": "beside",
    "landmark": {
      "kind": "gate"
    }
  },
  "round handle on the high shelf": {
    "shape": "round",
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "high"
  },
  "round handle on the low shelf": {
    "shape": "round",
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "low"
  },
  "straight handle on the high shelf": {
    "shape": "straight",
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "high"
  },
  "straight handle on the low shelf": {
    "shape": "straight",
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    },
    "elevation": "low"
  },
  "large cover beside the door": {
    "sizeVariant": "large",
    "relation": "beside",
    "landmark": {
      "kind": "door"
    }
  },
  "small cover beside the door": {
    "sizeVariant": "small",
    "relation": "beside",
    "landmark": {
      "kind": "door"
    }
  },
  "to the top level shelf": {
    "elevation": "high"
  },
  "to the middle level shelf": {
    "elevation": "middle"
  },
  "to the bottom level shelf": {
    "elevation": "low"
  },
  "to the spiral stair": {},
  "to the dome entrance": {},
  "to the star room": {},
  "on the shelf above the book": {
    "relation": "on",
    "landmark": {
      "kind": "book"
    }
  },
  "on the shelf below the book": {
    "relation": "on",
    "landmark": {
      "kind": "book"
    },
    "elevation": "low"
  },
  "on the shelf beside the book": {
    "relation": "on",
    "landmark": {
      "kind": "book"
    }
  },
  "city with tall buildings": {
    "landmark": {
      "kind": "buildings"
    },
    "relation": "beside"
  },
  "small room with a door": {
    "sizeVariant": "small",
    "landmark": {
      "kind": "door"
    },
    "relation": "beside"
  },
  "bright stone in a ring": {
    "count": 1,
    "relation": "in",
    "landmark": {
      "kind": "ring"
    }
  },
  "place where children learn": {},
  "food baked from dough": {},
  "part above the neck": {
    "relation": "above",
    "landmark": {
      "kind": "neck"
    }
  },
  "to Luna's post": {},
  "in the yesterday tray": {
    "relation": "in",
    "landmark": {
      "kind": "tray"
    }
  },
  "in the today tray": {
    "relation": "in",
    "landmark": {
      "kind": "tray"
    }
  },
  "on the archive shelf": {
    "relation": "on",
    "landmark": {
      "kind": "shelf"
    }
  },
  "basket beside Burrow's door": {
    "relation": "beside",
    "landmark": {
      "kind": "door"
    }
  },
  "basket beside Wren's door": {
    "relation": "beside",
    "landmark": {
      "kind": "door"
    }
  },
  "basket beside Luna's post": {
    "relation": "beside",
    "landmark": {
      "kind": "post"
    }
  },
  "letter on Burrow's basket": {
    "relation": "on",
    "landmark": {
      "kind": "basket"
    }
  },
  "ribbon on Wren's basket": {
    "relation": "on",
    "landmark": {
      "kind": "basket"
    }
  },
  "book on Luna's basket": {
    "relation": "on",
    "landmark": {
      "kind": "basket"
    }
  },
  "on the shelf above the round tray": {
    "relation": "on",
    "landmark": {
      "kind": "tray",
      "shape": "round"
    }
  },
  "on the shelf below the round tray": {
    "relation": "on",
    "landmark": {
      "kind": "tray",
      "shape": "round"
    },
    "elevation": "low"
  },
  "on the shelf beside the round tray": {
    "relation": "on",
    "landmark": {
      "kind": "tray",
      "shape": "round"
    }
  },
  "wide path beside the lantern": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "beside",
    "landmark": {
      "kind": "lantern"
    }
  },
  "narrow path beside the lantern": {
    "sizeVariant": "narrow",
    "widthVariant": "narrow",
    "relation": "beside",
    "landmark": {
      "kind": "lantern"
    }
  },
  "wide path beside the stream": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "narrow path beside the stream": {
    "sizeVariant": "narrow",
    "widthVariant": "narrow",
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "open gate beyond the bridge": {
    "open": true
  },
  "closed gate beyond the bridge": {
    "open": false
  },
  "to the Meadow camp": {},
  "to the Dino camp": {},
  "to the Moonwood camp": {},
  "to the completed skybridge": {},
  "to the open gathering gate": {
    "open": true
  },
  "to the shared camp": {},
  "in the Meadow basket": {
    "relation": "in",
    "landmark": {
      "kind": "basket"
    }
  },
  "in the Dino basket": {
    "relation": "in",
    "landmark": {
      "kind": "basket"
    }
  },
  "in the Moonwood basket": {
    "relation": "in",
    "landmark": {
      "kind": "basket"
    }
  },
  "wide seat under the lantern tree": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "narrow seat under the lantern tree": {
    "sizeVariant": "narrow",
    "widthVariant": "narrow",
    "relation": "under",
    "landmark": {
      "kind": "tree"
    }
  },
  "wide seat beside the stream": {
    "sizeVariant": "wide",
    "widthVariant": "wide",
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "narrow seat beside the stream": {
    "sizeVariant": "narrow",
    "widthVariant": "narrow",
    "relation": "beside",
    "landmark": {
      "kind": "pond"
    }
  },
  "letter on the wide seat": {
    "relation": "on",
    "landmark": {
      "kind": "seat"
    }
  },
  "ribbon under the narrow seat": {
    "relation": "under",
    "landmark": {
      "kind": "seat"
    }
  }
};
Object.assign(APPEARANCE, {
 "city with tall buildings": {heightVariant:"tall"}, "part above the neck": {},
 "round shell with a dark stripe": {shape:"round",stripeColour:CAMPAIGN_COLORS['appearance-dark-stripe']}, "round shell with a light stripe": {shape:"round",stripeColour:CAMPAIGN_COLORS['appearance-light-stripe']},
 "pointed shell with a dark stripe": {shape:"pointed",stripeColour:CAMPAIGN_COLORS['appearance-dark-stripe']}, "pointed shell with a light stripe": {shape:"pointed",stripeColour:CAMPAIGN_COLORS['appearance-light-stripe']},
 "flat stone with a dark mark": {shape:"flat",stripeColour:CAMPAIGN_COLORS['appearance-dark-stripe']}, "round stone with a light mark": {shape:"round",stripeColour:CAMPAIGN_COLORS['appearance-light-stripe']},
 "one red berry": {count:1,colour:"red"}, "two red berries": {count:2,colour:"red"}, "three red berries": {count:3,colour:"red"},
 "one blue berry": {count:1,colour:"blue"}, "two blue berries": {count:2,colour:"blue"}, "three blue berries": {count:3,colour:"blue"},
 "to the food bay": { landmark: {kind:"berry"}, relation:"beside" },
 "to the tool bay": { landmark: {kind:"tool"}, relation:"beside" },
 "to the bedding bay": { landmark: {kind:"blanket"}, relation:"beside" },
 "small long basket": {sizeVariant:"small",lengthVariant:"long"},
 "large long basket": {sizeVariant:"large",lengthVariant:"long"},
 "to the cave post": {landmark:{kind:"cave"},relation:"beside"},
 "to the bridge post": {landmark:{kind:"bridge"},relation:"beside"},
 "to the camp post": {landmark:{kind:"camp"},relation:"beside"},
 "to the first bridge": {ordinal:1}, "to the second bridge": {ordinal:2},
 "to Wren's landing": {residentId:"wren"}, "to Burrow's landing": {residentId:"burrow"},
 "to the north shore dock": {direction:"north"}, "to the south shore dock": {direction:"south"},
 "to the lantern pier": {landmark:{kind:"lantern"},relation:"beside"},
 "to the stone pier": {material:"stone"}, "to the wooden pier": {material:"wood"},
 "in the sunny pot": {lighting:"sunny"}, "in the shady pot": {lighting:"shady"},
 "on the shelf above the book": {relation:"above",landmark:{kind:"book"}},
 "on the shelf below the book": {relation:"below",landmark:{kind:"book"}},
 "on the shelf beside the book": {relation:"beside",landmark:{kind:"book"}},
 "in the yesterday tray": {temporal:"past"}, "in the today tray": {temporal:"present"},
 "basket beside Burrow's door": {relation:"beside",landmark:{kind:"door",residentId:"burrow"}},
 "basket beside Wren's door": {relation:"beside",landmark:{kind:"door",residentId:"wren"}},
 "on the shelf above the round tray": {relation:"above",landmark:{kind:"tray",shape:"round"}},
 "on the shelf below the round tray": {relation:"below",landmark:{kind:"tray",shape:"round"}},
 "on the shelf beside the round tray": {relation:"beside",landmark:{kind:"tray",shape:"round"}},
 "to the Meadow camp": {worldId:"meadow"}, "to the Dino camp": {worldId:"dino"}, "to the Moonwood camp": {worldId:"moonwood"},
 "in the Meadow basket": {worldId:"meadow"}, "in the Dino basket": {worldId:"dino"}, "in the Moonwood basket": {worldId:"moonwood"}
});
const records = {};
const audio = [];
const iconOf = label => label; // IDs are semantic asset roles, never guessed URLs.
const item = (ownerId, ordinal, text, objectId, options, correctId, construct, extra={}) => {
  const id=`${ownerId}-language-${ordinal}`;
  const path=`/audio/sound-seekers/campaign/${id}.mp3`;
  audio.push({id,ownerId,text,audio:path,construct});
  return {id,text,audio:path,objectId,options,correctId,construct,...extra};
};
// location spec: role@exact relational phrase. Object list: role:location index.
function P(id, verb, locations, assignments, construct='oral_prepositions') {
  const options=locations.split('|').map((spec,i)=>{const [icon,label]=spec.split('@');return{id:`place-${i}`,icon,label,appearance:APPEARANCE[label]||{}};});
  records[id]=assignments.split('|').map((spec,i)=>{const [objectId,destination]=spec.split(':');return item(id,i,`${verb==='Go'?'Guide':verb} the ${objectId.replaceAll('-',' ')} ${options[Number(destination)].label}.`,objectId,options,`place-${destination}`,construct);});
}
// All six matching objects/descriptions are authored, then each item offers a
// target and two distractors. Different descriptions are not synonyms recycled.
function C(id, descriptions, construct='oral_vocabulary') {
  const options=descriptions.split('|').map((spec,i)=>{const [icon,label]=spec.split('@');return{id:`object-${i}`,icon,label,appearance:APPEARANCE[label]||{}};});
  records[id]=options.map((option,i)=>item(id,i,`Find the ${option.label}.`,option.icon,options,option.id,construct));
}
function S(id, sentences) {
 records[id]=sentences.map((text,i)=>item(id,i,`Build this message: ${text}`,'letter',[],null,'sentence_order',{sentence:text}));
}
P('meadow-02-4','Put','bed@on the bed|pillow@under the pillow|basket@in the basket','blanket:0|ribbon:1|cushion:2|pillow:0|feather:1|cloth:2');
P('meadow-02-5','Take','bed@to the bed|shelf@to the shelf|basket@to the basket','blanket:0|pillow:0|cup:1|brush:1|ribbon:2|cloth:2','listening_directions');
P('meadow-02-side-1','Take','tree@to the tree|cave@to the cave|bed@to the bed','pillow:2|blanket:1|cushion:0','listening_directions');
C('meadow-02-side-2','ribbon@red ribbon|ribbon@blue ribbon|feather@white feather|leaf@green leaf|button@small button|button@large button');
P('meadow-03-3','Put','nest@in the nest|nest@beside the nest|basket@in the basket','feather:0|stick:1|ribbon:2|leaf:0|rope:2|plank:1');
P('meadow-03-5','Take','nest@to the nest|ramp@to the ramp|basket@to the basket','egg:0|mat:1|feather:0|ribbon:2|plank:1|cup:2','listening_directions');
C('meadow-03-side-1','feather@long white feather|feather@short white feather|feather@long red feather|feather@short red feather|ribbon@red ribbon|leaf@green leaf');
P('meadow-03-side-2','Take','pond@to the pond|barn@to the barn|nest@to the nest','letter:0|basket:1|feather:2','listening_directions');
P('meadow-04-3','Put','basket@above the basket|rack@beside the rack|basket@in the basket','rope:0|plank:1|cup:2|ribbon:0|mat:1|cloth:2');
P('meadow-04-4','Take','bridge@to the bridge|reed@to the reeds|mat@to the mat','letter:2|rope:0|cup:2|flag:1|basket:0|ribbon:1','listening_directions');
P('meadow-04-5','Take','bridge@to the bridge|island@to the island|nest@to the nest','plank:0|mat:1|feather:2|rope:0|cup:1|egg:2','listening_directions');
P('meadow-04-side-1','Go','reed@past the reeds|stone@around the stone|tree@towards the tree','raft:0|raft:1|raft:2','listening_directions');
P('meadow-05-4','Take','hedge@to the hedge|tree@to the tree|mat@to the mat','blanket:2|basket:1|ribbon:0|cup:2|plate:1|flag:0','listening_directions');
P('meadow-05-5','Put','gate@beside the gate|mat@on the mat|basket@in the basket','rope:0|blanket:1|cup:2|flag:0|plate:1|berry:2');
C('meadow-05-side-1','berry@one red berry|berry@two red berries|berry@three red berries|berry@one blue berry|berry@two blue berries|berry@three blue berries');
C('meadow-05-side-2','seat@seat under the tree|seat@seat beside the hedge|seat@seat by the pond|ribbon@ribbon on the seat|basket@basket under the seat|leaf@leaf beside the seat');
P('meadow-06-4','Take','nest@to the nest|barn@to the barn|tree@to the tree','letter:0|basket:1|rope:2|cup:0|mat:1|flag:2','listening_directions');
P('meadow-06-5','Put','basket@in the basket|shelf@on the high shelf|mat@on the low mat','cup:0|rope:1|blanket:2|brush:0|flag:1|cushion:2');
P('meadow-06-side-1','Go','flower@past the red flowers|flower@past the yellow flowers|tree@towards the tree','basket:0|basket:1|basket:2','listening_directions');
P('meadow-06-side-2','Put','mat@beside the mat|shade@under the shade|basket@in the basket','cup:0|cushion:1|hat:2');
P('meadow-07-2','Go','reed@past the reeds|lily@past the lilies|stone@around the stone','boat:0|boat:1|boat:2|basket:1|parcel:2|letter:0','listening_directions');
P('meadow-07-3','Take','tree@to the tree on the bank|reed@to the reeds on the bank|dock@to the wooden dock','basket:0|parcel:1|rope:2|cup:0|mat:1|plank:2','listening_directions');
P('meadow-07-5','Take','boat@to the boat|dock@to the dock|mat@to the resting mat','basket:0|rope:1|cup:2|parcel:0|plank:1|blanket:2','listening_directions');
C('meadow-07-side-1','flag@flag above the reeds|flag@flag beside the dock|flag@flag under the tree|ribbon@ribbon on the post|stone@stone beside the post|basket@basket under the post');
C('meadow-08-1','berry@red berries|apple@green apple|carrot@orange carrot|bread@round bread|cup@cup of water|plate@empty plate');
S('meadow-08-3',['Hungry carries a basket.','Muddy brings a cup.','Clucky puts out plates.','Splashy gets the water.','Bouncy carries the blanket.','Woolly brings the bread.']);
P('meadow-08-4','Take','tree@to the tree|pond@to the pond|mat@to the picnic mat','basket:2|cup:1|blanket:0|plate:2|berry:0|bread:2','listening_directions');
P('meadow-08-5','Put','mat@on the mat|basket@in the basket|tree@under the tree','plate:0|berry:1|blanket:2|cup:0|bread:1|cushion:2');
C('meadow-08-side-2','plate@small plate|plate@large plate|cup@small cup|cup@large cup|basket@small basket|basket@large basket');
P('meadow-09-4','Go','wheel@past the water wheel|reed@past the reeds|gate@through the open gate','boat:0|boat:1|boat:2|basket:1|rope:0|cup:2','listening_directions');
P('meadow-09-5','Take','ladder@to the ladder|ledge@to the broad ledge|mat@to the lower mat','rope:0|basket:1|cushion:2|plank:0|cup:1|blanket:2','listening_directions');
C('meadow-09-side-1','ribbon@red ribbon on the post|ribbon@blue ribbon on the post|ribbon@red ribbon below the wheel|flag@yellow flag|feather@white feather|leaf@green leaf');
P('meadow-09-side-2','Take','barn@to the barn|pond@to the pond|ladder@to the ladder','basket:0|cup:1|rope:2','listening_directions');
P('meadow-10-3','Go','gate@through the open gate|bridge@under the bridge|island@around the island','boat:0|boat:1|boat:2|basket:1|letter:0|parcel:2','listening_directions');
S('meadow-10-4',['Come to the farm.','Bring a cup.','Sit on the mat.','Meet us by the tree.','We can share the food.','The gate is open.']);
P('meadow-10-5','Take','gate@to the open gate|post@to the signal post|tree@to the gathering tree','rope:0|flag:1|letter:2|plank:0|ribbon:1|basket:2','listening_directions');
C('meadow-10-side-1','seat@seat in the shade|seat@seat in the sun|seat@seat by the water|basket@basket under the seat|cup@cup on the seat|ribbon@ribbon beside the seat');
P('dino-11-2','Take','cave@to the cave|rock@to the flat rock|fern@to the tall fern','basket:0|rope:1|flag:2|cup:0|mat:1|letter:2','listening_directions');
S('dino-11-4',['Take the basket to Sunny.','Follow the stone path.','Cross the short bridge.','Keep the supplies dry.','The cave is near.','Sunny needs the rope.']);
P('dino-11-5','Take','bridge@to the bridge|rock@to the flat rock|cave@to the cave','plank:0|rope:0|mat:1|cup:1|basket:2|letter:2','listening_directions');
C('dino-11-side-1','basket@basket with a red ribbon|basket@basket with a blue ribbon|basket@basket with no ribbon|crate@large crate|crate@small crate|parcel@round parcel');
P('dino-11-side-2','Put','pond@beside the water|rock@on the flat rock|tree@under the tree','mat:0|cup:1|basket:2');
P('dino-12-3','Put','beam@above the beam|post@beside the post|basket@in the basket','roof:0|plank:1|rope:2|leaf:0|stick:1|ribbon:2');
P('dino-12-5','Take','frame@to the shelter frame|roof@to the roof|bed@to the dry bed','beam:0|plank:1|blanket:2|rope:0|leaf:1|pillow:2','listening_directions');
C('dino-12-side-1','stone@smooth round stone|stone@rough round stone|stone@smooth flat stone|stone@rough flat stone|leaf@soft leaf|stick@straight stick');
P('dino-12-side-2','Take','cave@to the cave entrance|fern@to the fern|rock@to the flat rock','berry:0|basket:0|mat:2','listening_directions');
P('dino-13-1','Take','post@to the red post|cave@to the cave|fern@to the fern','parcel:0|basket:1|letter:2|rope:1|cup:0|ribbon:2','listening_directions');
S('dino-13-3',['Take the parcel to the cave.','Then bring the basket back.','Leave the letter by the fern.','Zippy follows the red post.','The small parcel goes first.','Keep the basket on the path.']);
P('dino-13-5','Take','cave@to the cave|post@to the red post|basket@to the empty basket','parcel:0|letter:1|ribbon:2|cup:0|flag:1|rope:2','listening_directions');
C('dino-13-side-1','ribbon@red ribbon beside the post|ribbon@blue ribbon beside the post|ribbon@red ribbon below the fern|flag@blue flag|leaf@long leaf|leaf@round leaf');
P('dino-14-3','Go','fern@past the tall fern|rock@around the flat rock|bridge@under the wooden bridge','basket:0|basket:1|basket:2|parcel:1|letter:2|rope:0','listening_directions');
P('dino-14-4','Put','basket@in the long basket|mat@on the wide mat|post@beside the tall post','bread:0|plate:1|rope:2|berry:0|cup:1|flag:2');
P('dino-14-5','Take','bridge@to the balanced bridge|island@to the resting island|mat@to the picnic mat','plank:0|rope:0|basket:1|cup:1|bread:2|plate:2','listening_directions');
C('dino-14-side-1','flag@flag above the fern|flag@flag beside the rock|flag@flag below the bridge|post@red post|post@blue post|ribbon@yellow ribbon');
P('dino-14-side-2','Take','ledge@to the lookout ledge|bridge@to the bridge|fern@to the fern','parcel:0|rope:1|letter:2','listening_directions');
S('dino-15-1',['Move the small rock.','Pull the wooden lever.','Then lower the bridge.','Wait beside the gate.','Cross the clear path.','Bring the rope back.']);
P('dino-15-2','Go','lever@towards the low lever|gate@through the open gate|rock@around the large rock','basket:0|rope:1|letter:2|plank:0|cup:2|parcel:1','listening_directions');
P('dino-15-5','Take','lever@to the wooden lever|bridge@to the lowered bridge|post@to the far post','rope:0|plank:1|flag:2|basket:1|letter:2|ribbon:0','listening_directions');
S('dino-15-side-1',['Please pass the rope.','Can you bring the basket?','Please wait by the gate.']);
P('dino-15-side-2','Take','shelf@to the high shelf|shelf@to the low shelf|shelf@to the middle shelf','basket:1|rope:0|cup:2','listening_directions');
P('dino-16-3','Take','post@to the high post|post@to the low post|bench@to the rest bench','letter:0|flag:1|cup:2|ribbon:0|parcel:1|mat:2','listening_directions');
S('dino-16-4',['The high path is ready.','The low path is wet.','Wait by the signal post.','Honky raises the red flag.','Take the dry path.','The bridge is open.']);
P('dino-16-5','Take','post@to the signal post|lever@to the wooden lever|bench@to the bench','flag:0|handle:1|cup:2|ribbon:0|rope:1|mat:2','listening_directions');
P('dino-16-side-2','Put','bench@on the bench|bench@under the bench|tree@beside the tree','cushion:0|basket:1|cup:2');
P('dino-17-1','Take','bay@to the red store bay|bay@to the blue store bay|bay@to the green store bay','basket:0|crate:1|parcel:2|rope:1|mat:0|cup:2','listening_directions');
S('dino-17-2',['The basket goes on the shelf.','Put the rope in the crate.','The cup is below the shelf.','The red bay holds the food.','Bring the empty crate here.','Keep the cloth above the water.']);
P('dino-17-4','Put','shelf@above the shelf|shelf@below the shelf|crate@in the crate','cloth:0|basket:1|rope:2|ribbon:0|cup:1|plank:2');
P('dino-17-5','Take','bay@to the food bay|bay@to the tool bay|bay@to the bedding bay','berry:0|handle:1|blanket:2|bread:0|rope:1|pillow:2','listening_directions');
C('dino-17-side-1','basket@small round basket|basket@large round basket|basket@small long basket|basket@large long basket|crate@small crate|crate@large crate');
P('dino-17-side-2','Take','post@to the route post|cave@to the cave|bench@to the bench','rope:0|letter:0|cup:2','listening_directions');
S('dino-18-3',['The path goes past the cave.','The bridge crosses the stream.','The red sign points left.','The blue sign points right.','The bench is beside the tree.','The gate is behind the rock.']);
P('dino-18-4','Take','cave@to the cave entrance|bridge@to the bridge entrance|tree@to the resting tree','sign:0|flag:1|letter:2|post:1|ribbon:0|basket:2','listening_directions');
P('dino-18-5','Put','cave@beside the cave|bridge@beside the bridge|bench@beside the bench','sign:0|post:1|basket:2|flag:0|rope:1|cup:2');
P('dino-18-side-1','Put','tray@in the red tray|tray@in the blue tray|shelf@on the shelf','paint:0|brush:1|cup:2');
S('dino-19-1',['The cart goes to the cave.','Pull the small cart first.','The big cart waits here.','The red board points home.','Take the dry branch.','Keep the basket in the cart.']);
P('dino-19-2','Go','cart@past the empty cart|post@towards the blue post|gate@through the wide gate','basket:0|parcel:1|cart:2|letter:1|cup:0|rope:2','listening_directions');
P('dino-19-4','Take','post@to the cave post|post@to the bridge post|post@to the camp post','sign:0|flag:1|letter:2|ribbon:0|parcel:1|basket:2','listening_directions');
P('dino-19-5','Take','cart@to the small cart|gate@to the wide gate|camp@to the camp','basket:0|rope:0|flag:1|sign:1|blanket:2|cup:2','listening_directions');
C('dino-19-side-2','seat@seat under the roof|seat@seat beside the cart|seat@seat behind the fern|pillow@pillow on the seat|basket@basket under the seat|mat@mat beside the seat');
S('dino-20-2',['Bring the rope to the crossing.','The small cart goes first.','Leave the basket on the island.','Pull the lever beside the post.','The second bridge is ready.','Take the supplies to camp.']);
P('dino-20-3','Take','bridge@to the first bridge|island@to the resting island|bridge@to the second bridge','plank:0|basket:1|rope:2|handle:0|cup:1|flag:2','listening_directions');
P('dino-20-5','Take','bridge@to the first crossing|island@to the island|camp@to the travelling camp','plank:0|rope:0|cart:1|cup:1|basket:2|blanket:2','listening_directions');
C('dino-20-side-1','seat@seat behind the fern|seat@seat beside the water|seat@seat on the open rock|ribbon@ribbon above the seat|basket@basket below the seat|flag@flag beside the seat');
P('moonwood-21-2','Guide','reed@past the silver reeds|lantern@towards the low lantern|island@around the mossy island','boat:0|basket:1|parcel:2|letter:0|rope:1|cup:2','listening_directions');
P('moonwood-21-4','Take','dock@to Wren\'s landing|dock@to Burrow\'s landing|camp@to the new camp','basket:0|tool:1|blanket:2|seed:0|rope:1|cup:2','listening_directions');
P('moonwood-21-5','Take','bridge@to the first floating span|island@to the resting island|camp@to the new camp','rope:0|plank:0|basket:1|cup:1|blanket:2|lantern:2','listening_directions');
C('moonwood-21-side-1','tool@small digging tool|tool@large digging tool|rope@short rope|rope@long rope|bucket@small bucket|bucket@large bucket');
P('moonwood-21-side-2','Put','basket@in the basket|basket@beside the basket|lantern@under the lantern','seed:0|cup:1|mat:2');
C('moonwood-22-3','shelf@high shelf with a lantern|shelf@low shelf with a lantern|shelf@high shelf with a book|shelf@low shelf with a book|shelf@middle shelf with a cup|shelf@middle shelf with a basket');
P('moonwood-22-5','Take','stair@to the first stair|ledge@to the broad landing|door@to Luna\'s door','cover:0|lantern:0|basket:1|cup:1|letter:2|book:2','listening_directions');
P('moonwood-22-side-1','Put','shelf@on the top shelf|shelf@on the middle shelf|shelf@on the bottom shelf','book:0|cup:1|basket:2');
P('moonwood-22-side-2','Take','stair@to the foot of the stair|door@to Burrow\'s door|ledge@to the broad landing','parcel:0|letter:1|cup:2','listening_directions');
C('moonwood-23-1','post@red post beside the reeds|post@blue post beside the reeds|post@red post beside the tree|post@blue post beside the tree|post@yellow post beside the bridge|post@yellow post beside the rock');
S('moonwood-23-3',['The red post marks the dry path.','The blue post stands by the water.','The lantern is above the bridge.','The reflector points towards camp.','Glimmer follows the green ribbon.','The wide branch reaches the tree.']);
P('moonwood-23-4','Guide','post@past the red post|bridge@under the low bridge|tree@towards the lantern tree','boat:0|basket:1|parcel:2|letter:1|rope:2|cup:0','listening_directions');
P('moonwood-23-5','Take','post@to the first marker|reflector@to the broad reflector|tree@to the lantern tree','flag:0|handle:1|lantern:2|ribbon:0|rope:1|basket:2','listening_directions');
C('moonwood-23-side-1','ribbon@green ribbon beside the reeds|ribbon@blue ribbon beside the reeds|ribbon@green ribbon beside the tree|leaf@leaf below the reflector|flag@flag above the reflector|basket@basket behind the reflector');
P('moonwood-24-2','Take','dock@to the north shore dock|dock@to the south shore dock|bench@to Spark\'s bench','basket:0|parcel:1|tool:2|rope:0|cup:1|brush:2','listening_directions');
P('moonwood-24-3','Put','tray@in the tool tray|bench@on the workbench|shelf@on the high shelf','handle:0|plank:1|paint:2|brush:0|rope:1|cup:2');
P('moonwood-24-5','Take','dock@to the supply dock|bench@to the workbench|shelf@to the storage shelf','basket:0|parcel:0|tool:1|plank:1|paint:2|cup:2','listening_directions');
C('moonwood-24-side-1','shell@small round shell|shell@large round shell|shell@small pointed shell|shell@large pointed shell|stone@smooth flat stone|stone@rough flat stone');
S('moonwood-24-side-2',['The basket waits by the dock.','The blue basket is on the shelf.','Wren can collect the small parcel.']);
P('moonwood-25-2','Guide','post@between the harbour posts|dock@towards the wide dock|rock@around the dark rock','boat:0|basket:1|parcel:2|letter:0|rope:2|cup:1','listening_directions');
P('moonwood-25-3','Take','dock@to the lantern pier|dock@to the stone pier|dock@to the wooden pier','basket:0|crate:1|parcel:2|rope:1|cup:0|mat:2','listening_directions');
S('moonwood-25-4',['The boat passes between the posts.','The wide pier has a lantern.','Keep the boat away from the rock.','Luna waits at the wooden pier.','The red signal means wait.','The green signal means come.']);
P('moonwood-25-5','Take','post@to the harbour signal|dock@to the safe pier|bench@to Luna\'s bench','flag:0|lantern:0|basket:1|rope:1|letter:2|cup:2','listening_directions');
C('moonwood-25-side-2','shell@round shell with a dark stripe|shell@round shell with a light stripe|shell@pointed shell with a dark stripe|shell@pointed shell with a light stripe|stone@flat stone with a dark mark|stone@round stone with a light mark');
P('moonwood-26-3','Guide','garden@past the seed garden|root@under the broad root|gate@through the moth gate','basket:0|parcel:1|letter:2|seed:0|cup:1|rope:2','listening_directions');
P('moonwood-26-4','Put','pot@in the sunny pot|pot@in the shady pot|tray@in the water tray','seed:0|fern:1|cup:2|flower:0|moss:1|cloth:2');
P('moonwood-26-5','Take','root@to the root supports|garden@to the planting bed|gate@to the open gate','beam:0|rope:0|seed:1|cup:1|basket:2|letter:2','listening_directions');
P('moonwood-26-side-1','Take','door@to Wren\'s door|garden@to Fern\'s garden|window@to Burrow\'s window','seed:0|cup:1|letter:2','listening_directions');
C('moonwood-26-side-2','window@round window above the root|window@square window above the root|window@round window below the root|window@square window below the root|door@small door beside the root|door@wide door beside the root');
P('moonwood-27-1','Guide','path@along the wide path|bridge@across the broad bridge|gate@through the tall gate','crate:0|basket:1|cart:2|plank:1|rope:2|parcel:0','listening_directions');
C('moonwood-27-3','crate@tall narrow crate|crate@short narrow crate|crate@tall wide crate|crate@short wide crate|basket@large round basket|basket@small round basket');
S('moonwood-27-4',['Stone needs the wide path.','The narrow gate is too small.','The broad bridge holds the crate.','The tall gate lets Stone through.','The little parcel fits the basket.','Stone can carry the large crate.']);
P('moonwood-27-5','Take','path@to the wide path|bridge@to the broad bridge|glade@to the rest glade','crate:0|rope:0|plank:1|basket:1|mat:2|cup:2','listening_directions');
P('moonwood-27-side-1','Take','garden@to Fern\'s garden|door@to Wren\'s door|glade@to Stone\'s glade','parcel:0|letter:1|cup:2','listening_directions');
C('moonwood-27-side-2','glade@wide glade under the trees|glade@narrow glade under the trees|glade@wide glade beside the water|glade@narrow glade beside the water|seat@large seat beside the gate|seat@small seat beside the gate');
C('moonwood-28-2','handle@round handle on the high shelf|handle@round handle on the low shelf|handle@straight handle on the high shelf|handle@straight handle on the low shelf|cover@large cover beside the door|cover@small cover beside the door');
P('moonwood-28-4','Take','shelf@to the top level shelf|shelf@to the middle level shelf|shelf@to the bottom level shelf','handle:0|cover:1|rope:2|tool:0|lantern:1|basket:2','listening_directions');
P('moonwood-28-5','Take','stair@to the spiral stair|dome@to the dome entrance|room@to the star room','rope:0|basket:0|handle:1|cover:1|book:2|lantern:2','listening_directions');
S('moonwood-28-side-1',['The star room opens at night.','Please leave the lantern by the door.','Luna shows us the night sky.']);
P('moonwood-28-side-2','Put','shelf@on the shelf above the book|shelf@on the shelf below the book|shelf@on the shelf beside the book','lantern:0|basket:1|cup:2');
C('moonwood-29-1','city@city with tall buildings|cell@small room with a door|gem@bright stone in a ring|school@place where children learn|bread@food baked from dough|head@part above the neck','vocabulary_in_context');
records['moonwood-29-3'] = [
 ['Yesterday Wren did a jump. Finish the message about yesterday.','Yesterday Wren','jumped|jumps|will jump','jumped'],
 ['Every day, Wren does a jump. Finish the message about every day.','Every day Wren','jumps|jumped|will jump','jumps'],
 ['Tomorrow Wren plans to jump. Finish the message about tomorrow.','Tomorrow Wren','will jump|jumped|jumps','will jump'],
 ['Yesterday Burrow came down by the gate. Finish the message about yesterday.','Yesterday Burrow','landed|lands|will land','landed'],
 ['Every day, Burrow comes down by the gate. Finish the message about every day.','Every day Burrow','lands|landed|will land','lands'],
 ['Tomorrow Burrow plans to land here. Finish the message about tomorrow.','Tomorrow Burrow','will land|landed|lands','will land']
].map(([text,prefix,forms,form],i)=>item('moonwood-29-3',i,text,'letter',forms.split('|').map((label,j)=>({id:`form-${j}`,icon:'letter',label})),forms.split('|').indexOf(form),'grammar_tense',{prefix,form}));
P('moonwood-29-4','Take','door@to Wren\'s door|window@to Burrow\'s window|post@to Luna\'s post','letter:0|parcel:1|book:2|ribbon:0|basket:1|scroll:2','listening_directions');
P('moonwood-29-5','Put','tray@in the yesterday tray|tray@in the today tray|shelf@on the archive shelf','letter:0|scroll:1|book:2|ribbon:0|card:1|basket:2');
C('moonwood-29-side-1','basket@basket beside Burrow\'s door|basket@basket beside Wren\'s door|basket@basket beside Luna\'s post|letter@letter on Burrow\'s basket|ribbon@ribbon on Wren\'s basket|book@book on Luna\'s basket','reference_comprehension');
P('moonwood-29-side-2','Put','shelf@on the shelf above the round tray|shelf@on the shelf below the round tray|shelf@on the shelf beside the round tray','letter:0|scroll:1|basket:2');
C('moonwood-30-1','path@wide path beside the lantern|path@narrow path beside the lantern|path@wide path beside the stream|path@narrow path beside the stream|gate@open gate beyond the bridge|gate@closed gate beyond the bridge');
P('moonwood-30-3','Take','camp@to the Meadow camp|camp@to the Dino camp|camp@to the Moonwood camp','letter:0|parcel:1|scroll:2|basket:0|flag:1|lantern:2','listening_directions');
S('moonwood-30-4',['The wide path reaches the gathering.','The bridge crosses the stream.','The lantern marks the open gate.','All three camps can share the path.','The narrow path stops at the water.','The open gate leads to our friends.']);
P('moonwood-30-5','Take','bridge@to the completed skybridge|gate@to the open gathering gate|camp@to the shared camp','rope:0|plank:0|flag:1|lantern:1|basket:2|letter:2','listening_directions');
P('moonwood-30-side-1','Put','basket@in the Meadow basket|basket@in the Dino basket|basket@in the Moonwood basket','flower:0|stone:1|shell:2');
C('moonwood-30-side-2','seat@wide seat under the lantern tree|seat@narrow seat under the lantern tree|seat@wide seat beside the stream|seat@narrow seat beside the stream|letter@letter on the wide seat|ribbon@ribbon under the narrow seat');

const labelHash = text => { let n=2166136261; for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619); return (n>>>0).toString(16); };
const labelClips = new Map();
for(const pack of Object.values(records))for(const entry of pack)for(const option of entry.options){
 if(!labelClips.has(option.label)){
  const id=`campaign-option-${labelHash(option.label)}`,path=`/audio/sound-seekers/campaign/${id}.mp3`;
  labelClips.set(option.label,path);audio.push({id,ownerId:'campaign-object-labels',text:option.label,audio:path,construct:'option_label'});
 }
 option.audio=labelClips.get(option.label);
}
// Exact canonical quest words with no existing word-audio resolution. These
// are whole-word recordings, never synthetic phoneme fallbacks.
export const CAMPAIGN_LEARNING_WORD_AUDIO = Object.freeze(Object.fromEntries(
 ['mats','quit','fizz','hiss','huff','whip','mute','amuse','delete','extreme','pure','cure','endure','obscure','manure','cell','action','fiction','nation','lotion','job','chess','such','beam','prop','tool'].map(word=>{
  const id=`campaign-word-${word}`,path=`/audio/sound-seekers/campaign/${id}.mp3`;
  audio.push({id,ownerId:'canonical-quest-words',text:word,audio:path,construct:'isolated_word'});
  return [word,path];
 })
));
export const CAMPAIGN_LEARNING_PACKS = Object.freeze(records);
export const CAMPAIGN_LEARNING_AUDIO = Object.freeze(audio);
export const CAMPAIGN_OBJECT_ROLES = Object.freeze([...new Set(Object.values(records).flatMap(pack=>pack.flatMap(entry=>[entry.objectId,...entry.options.flatMap(o=>[o.icon,o.appearance?.landmark?.kind].filter(Boolean))])))].sort().map(iconOf));
