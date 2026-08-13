import { Bridge, Factory, Package, Path } from "@phosphor-icons/react";

const GAME_ART = Object.freeze({
  "number-trail": Object.freeze({ icon: Path, world: "Mossy Mountain", mission: "Step onto the number that comes next.", control: "Tap a stone or use the buttons below.", className: "is-mountain" }),
  "frame-foundry": Object.freeze({ icon: Factory, world: "Counter Works", mission: "Build only the missing part of the frame.", control: "Tap empty spaces, then test your build.", className: "is-foundry" }),
  "count-and-carry": Object.freeze({ icon: Package, world: "Parcel Meadow", mission: "Move every parcel once—none missed, none twice.", control: "Tap each parcel to load the cart.", className: "is-meadow" }),
  "quantity-match": Object.freeze({ icon: Bridge, world: "Pairing River", mission: "Build or pair amounts to repair the bridge.", control: "Tap planks and compare what remains.", className: "is-river" })
});

export function mathsArcadeArt(gameId) {
  return GAME_ART[gameId] || GAME_ART["number-trail"];
}
