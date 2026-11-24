// Published Mock snapshots retain their original evidence URI. Resolve only
// reviewed replacements at delivery; never rewrite an immutable publication
// or restore a retired drawing to make an existence check pass.
export const LITERACY_MOCK_IMAGE_DELIVERY = Object.freeze({
  "/images/assessment/hfw/look.webp": "/images/assessment/release-support/targets/look-e09315.webp",
  // Exact word pictures must remain legible as small answer tiles. These
  // reviewed deliveries remove unrelated rooms, scenery and competing objects
  // while retaining the original published media identity and spoken target.
  "/images/assessment/rhyming/variants/og/log-02.webp": "/images/assessment/literacy-classroom/log.webp",
  "/images/assessment/blends/hand.webp": "/media/initial-sounds/images/h/hand.webp",
  "/images/assessment/digraphs/chair.webp": "/images/child-mode/digraphs/chair.webp",
  "/images/assessment/language/variants/homophones-homonyms/tail-tale-01.webp": "/images/assessment/literacy-mock/clarity/tail-v1.webp",
  "/images/assessment/rhyming/variants/eg/peg-02.webp": "/images/assessment/generated/phonics-quality/peg.webp",
  "/images/assessment/literacy-mock/capacity/foundation-fin.webp": "/images/child-mode/vocabulary/fin.webp",
  "/images/child-mode/initial-sounds/red.webp": "/images/child-mode/vocabulary/red.webp",
  "/images/child-mode/reviewed/sat.webp": "/images/child-mode/short-i/sit.webp",
  "/images/child-mode/vocabulary/dug.webp": "/images/assessment/literacy-mock/capacity/foundation-dig.webp",
  "/media/vocabulary/images/eat.webp": "/images/assessment/literacy-mock/clarity/eat-v1.webp",
  "/media/vocabulary/images/point.webp": "/images/assessment/literacy-mock/capacity/foundation-point.webp",
  // The original preposition scenes retain their full dimensions in WebP.
  // The offline reserve may need several of these illustrations at once.
  "/images/prepositions/ball_on_chair.png": "/images/assessment/literacy-mock/prepositions/ball_on_chair.webp",
  "/images/prepositions/bear_behind_tree.png": "/images/assessment/literacy-mock/prepositions/bear_behind_tree.webp",
  "/images/prepositions/bike_in_front_of_garage.png": "/images/assessment/literacy-mock/prepositions/bike_in_front_of_garage.webp",
  "/images/prepositions/bird_above_tree.png": "/images/assessment/literacy-mock/prepositions/bird_above_tree.webp",
  "/images/prepositions/child_behind_curtain.png": "/images/assessment/literacy-mock/prepositions/child_behind_curtain.webp",
  "/images/prepositions/cup_between_books.png": "/images/assessment/literacy-mock/prepositions/cup_between_books.webp",
  "/images/prepositions/cup_next_to_plate.png": "/images/assessment/literacy-mock/prepositions/cup_next_to_plate.webp",
  "/images/prepositions/dog_under_table.png": "/images/assessment/literacy-mock/prepositions/dog_under_table.webp",
  "/images/prepositions/fence_around_garden.png": "/images/assessment/literacy-mock/prepositions/fence_around_garden.webp",
  "/images/prepositions/horse_over_gate.png": "/images/assessment/literacy-mock/prepositions/horse_over_gate.webp",
  "/images/prepositions/plane_over_town.png": "/images/assessment/literacy-mock/prepositions/plane_over_town.webp",
  "/images/prepositions/rabbit_beside_basket.png": "/images/assessment/literacy-mock/prepositions/rabbit_beside_basket.webp",
  "/images/prepositions/rain_through_tent_crack.png": "/images/assessment/literacy-mock/prepositions/rain_through_tent_crack.webp",
  "/images/prepositions/shoes_near_door.png": "/images/assessment/literacy-mock/prepositions/shoes_near_door.webp",
  "/images/prepositions/slippers_under_bed.png": "/images/assessment/literacy-mock/prepositions/slippers_under_bed.webp",
  "/images/prepositions/train_through_tunnel.png": "/images/assessment/literacy-mock/prepositions/train_through_tunnel.webp",
});

export function resolveLiteracyMockImagePath(src = "") {
  if (typeof src !== "string") return "";
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  const pathname = src.split(/[?#]/, 1)[0];
  const replacement = LITERACY_MOCK_IMAGE_DELIVERY[pathname];
  return replacement ? replacement + src.slice(pathname.length) : src;
}
