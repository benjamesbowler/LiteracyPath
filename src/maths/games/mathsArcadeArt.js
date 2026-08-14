import { Bridge, Factory, Package, Path, Sparkle } from "@phosphor-icons/react";

const GAME_ART = Object.freeze({
  "number-trail": Object.freeze({ icon: Path, world: "Mossy Mountain", mission: "Step onto the number that comes next.", control: "Read the path, then tap the stone that fits.", className: "is-mountain" }),
  "glimpse-garden": Object.freeze({ icon: Sparkle, world: "Lantern Garden", mission: "See the whole quantity through smaller parts.", control: "Open the gate, look, then choose the whole.", className: "is-garden" }),
  "frame-foundry": Object.freeze({ icon: Factory, world: "Counter Works", mission: "Build only the missing part of the frame.", control: "Tap empty spaces, then test your build.", className: "is-foundry" }),
  "count-and-carry": Object.freeze({ icon: Package, world: "Parcel Meadow", mission: "Move every parcel once—none missed, none twice.", control: "Tap each parcel to load the cart.", className: "is-meadow" }),
  "quantity-match": Object.freeze({ icon: Bridge, world: "Pairing River", mission: "Build or pair amounts to repair the bridge.", control: "Tap planks and compare what remains.", className: "is-river" })
});

export function mathsArcadeArt(gameId) {
  return GAME_ART[gameId] || GAME_ART["number-trail"];
}
