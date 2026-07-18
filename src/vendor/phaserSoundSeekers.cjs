/*
 * Sound Seekers Phaser surface.
 * Phaser is MIT licensed. This entry keeps only the Canvas systems and game
 * objects used by the pixel adventure instead of importing every framework API.
 */

const Phaser = require("../../node_modules/phaser/src/phaser-core.js");
const ArcadePhysics = require("../../node_modules/phaser/src/physics/arcade/ArcadePhysics.js");

// phaser-core includes image, sprite, graphics, layer and text factories.
// Sound Seekers also builds composite actors and a handful of simple shapes.
require("../../node_modules/phaser/src/gameobjects/container/ContainerFactory.js");
require("../../node_modules/phaser/src/gameobjects/shape/arc/ArcFactory.js");
require("../../node_modules/phaser/src/gameobjects/shape/ellipse/EllipseFactory.js");
require("../../node_modules/phaser/src/gameobjects/shape/rectangle/RectangleFactory.js");
require("../../node_modules/phaser/src/gameobjects/zone/ZoneFactory.js");

Phaser.Math.Clamp = require("../../node_modules/phaser/src/math/Clamp.js");
Phaser.Math.Linear = require("../../node_modules/phaser/src/math/Linear.js");
Phaser.Math.Angle = {
  Between: require("../../node_modules/phaser/src/math/angle/Between.js")
};
Phaser.Math.Distance = {
  Between: require("../../node_modules/phaser/src/math/distance/DistanceBetween.js")
};
Phaser.Physics = { Arcade: { ArcadePhysics } };

module.exports = Phaser;
