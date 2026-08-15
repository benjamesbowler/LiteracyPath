import { Bridge, Factory, Package, Path, Sparkle } from "@phosphor-icons/react";

const GAME_ART = Object.freeze({
  "number-trail": Object.freeze({ icon: Path, version: "3.0", visualMode: "progressive_three", fallback: "semantic_dom_stones", world: "Mossy Mountain", mission: "Step onto the number that comes next.", control: "Read the path, then tap the stone that fits.", className: "is-mountain" }),
  "glimpse-garden": Object.freeze({ icon: Sparkle, version: "3.0", visualMode: "authored_2d_reveal", fallback: "persistent_counting_view", world: "Lantern Garden", mission: "See the whole quantity through smaller parts.", control: "Open the gate, look, then choose the whole.", className: "is-garden" }),
  "frame-foundry": Object.freeze({ icon: Factory, version: "3.0", visualMode: "authored_2d_builder", fallback: "native_button_frame", world: "Counter Works", mission: "Build only the missing part of the frame.", control: "Tap empty spaces, then test your build.", className: "is-foundry" }),
  "count-and-carry": Object.freeze({ icon: Package, version: "3.0", visualMode: "authored_2d_delivery", fallback: "native_button_collection", world: "Parcel Meadow", mission: "Move every parcel once, with none missed and none twice.", control: "Tap each parcel to load the cart.", className: "is-meadow" }),
  "quantity-match": Object.freeze({ icon: Bridge, version: "3.0", visualMode: "authored_2d_pairing", fallback: "native_button_pairs", world: "Pairing River", mission: "Build or pair amounts to repair the bridge.", control: "Tap planks and compare what remains.", className: "is-river" })
});

export function mathsArcadeArt(gameId) {
  return GAME_ART[gameId] || GAME_ART["number-trail"];
}
