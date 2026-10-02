// Artwork and its landmark geometry are one versioned production source.
// Coordinates are measured on the painted walking paths, next to each place.
export const ADVENTURE_ATLAS_VERSION = 2;
export const ADVENTURE_ATLAS_VIEW = { w: 2752, h: 1536 };
export const ADVENTURE_ATLASES = {
  meadow: {
    image: "/images/pals/maps/meadow-atlas-v2.webp",
    points: [[16, 76], [28, 68], [29, 41], [49, 27], [46, 61], [57, 83], [80, 62], [58, 37], [90, 34]],
    details: ["The gate opens onto your farm adventure.", "Rows of carrots grow beside the path.", "Ducks paddle around their blue pond.", "Red apples grow in the orchard.", "Butterflies visit the wildflower meadow.", "The sheep rest in their grassy pen.", "Ripe strawberries grow behind the fence.", "The golden hay is ready for the barn.", "Your farm journey reaches the big red barn."]
  },
  dino: {
    image: "/images/pals/maps/dino-atlas-v2.webp",
    points: [[20, 53], [28, 63], [29, 37], [31, 24], [49, 63], [57, 84], [79, 67], [71, 39], [90, 30]],
    details: ["A misty waterfall tumbles down the cliffs.", "Dinosaur tracks surround the muddy wallow.", "Warm bubbles rise in the blue springs.", "Look for old bones beside the fossil creek.", "Giant ferns shelter the jungle path.", "Big eggs rest safely in their nest.", "Footprints show where dinosaurs have stomped.", "A safe path passes beside the glowing lava.", "The volcano marks the end of your valley journey."]
  },
  moonwood: {
    image: "/images/pals/maps/moonwood-atlas-v2.webp",
    points: [[22, 83], [29, 69], [26, 46], [48, 28], [49, 61], [61, 87], [83, 74], [76, 27], [88, 36]],
    details: ["Glowing mushrooms light the forest path.", "Little toadstools line this winding trail.", "Small bridges cross the water beside the pond.", "The moon shines in the quiet blue pond.", "Golden fireflies gather in a hidden hollow.", "Blue crystals shine around the cave entrance.", "A welcoming old oak shelters the forest.", "The trees open onto a moonlit meadow.", "The Moon Tower welcomes you at journey's end."]
  }
};

export function mapAreaDetails(worldId, index) {
  return ADVENTURE_ATLASES[worldId]?.details[index] || "Explore this place on your learning journey.";
}
