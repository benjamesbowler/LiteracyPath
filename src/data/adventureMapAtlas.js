// Artwork and its landmark geometry are one versioned production source.
// Coordinates are measured on the current clean cartoon walking paths, next to each place.
export const ADVENTURE_ATLAS_VERSION = 3;
export const ADVENTURE_ATLAS_VIEW = { w: 2752, h: 1536 };
export const ADVENTURE_PORTRAIT_VIEW = { w: 1195, h: 1600 };
export const ADVENTURE_ATLASES = {
  meadow: {
    image: "/images/pals/maps/meadow-atlas-v2.webp",
    points: [[13.7, 78.4], [13.8, 68.4], [29.1, 42.5], [44.6, 31.2], [36.9, 52.8], [44.1, 78.1], [65.2, 61.4], [56.9, 34.1], [84.6, 34.1]],
    portraitImage: "/images/pals/maps/meadow-map.webp",
    portraitPoints: [[31, 16.5], [54, 18], [44, 33], [54.5, 39], [53.5, 48.8], [50, 59], [45, 69.4], [31, 88], [67.2, 95]],
    details: ["The gate opens onto your farm adventure.", "Rows of carrots grow beside the path.", "Ducks paddle around their blue pond.", "Red apples grow in the orchard.", "Butterflies visit the wildflower meadow.", "The sheep rest in their grassy pen.", "Ripe strawberries grow behind the fence.", "The golden hay is ready for the barn.", "Your farm journey reaches the big red barn."]
  },
  dino: {
    image: "/images/pals/maps/dino-atlas-v2.webp",
    points: [[25.1, 87.1], [25.4, 65], [19.6, 39.2], [41.7, 32.9], [47.2, 67.8], [61.6, 88], [73.6, 62.1], [72, 39], [85.5, 30.2]],
    portraitImage: "/images/pals/maps/dino-map.webp",
    portraitPoints: [[39, 16], [51, 21.5], [39, 30.5], [56, 37.3], [49, 48.2], [52, 56], [43, 67], [52.5, 77], [41.5, 90.1]],
    details: ["A misty waterfall tumbles down the cliffs.", "Dinosaur tracks surround the muddy wallow.", "Warm bubbles rise in the blue springs.", "Look for old bones beside the fossil creek.", "Giant ferns shelter the jungle path.", "Big eggs rest safely in their nest.", "Footprints show where dinosaurs have stomped.", "A safe path passes beside the glowing lava.", "The volcano marks the end of your valley journey."]
  },
  moonwood: {
    image: "/images/pals/maps/moonwood-atlas-v2.webp",
    points: [[20.7, 89.3], [26.7, 67.8], [14.2, 42.9], [33.9, 31.5], [36.5, 51], [62.9, 91.5], [81, 73.8], [65.4, 30.6], [87.7, 29.3]],
    portraitImage: "/images/pals/maps/moonwood-map.webp",
    portraitPoints: [[26.8, 14.9], [78.7, 22.1], [30.5, 31.6], [85, 39], [16.3, 52], [82.8, 60.5], [24.4, 76], [81.4, 78], [80, 94]],
    details: ["Glowing mushrooms light the forest path.", "Little toadstools line this winding trail.", "Small bridges cross the water beside the pond.", "The moon shines in the quiet blue pond.", "Golden fireflies gather in a hidden hollow.", "Blue crystals shine around the cave entrance.", "A welcoming old oak shelters the forest.", "The trees open onto a moonlit meadow.", "The Moon Tower welcomes you at journey's end."]
  }
};

export function mapAreaDetails(worldId, index) {
  return ADVENTURE_ATLASES[worldId]?.details[index] || "Explore this place on your learning journey.";
}
