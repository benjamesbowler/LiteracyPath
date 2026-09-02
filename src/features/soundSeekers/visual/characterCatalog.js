import { SOUND_SEEKERS_CHAPTERS } from "../content/chapters/index.js";
import { SOUND_SEEKERS_CAST_ARCS } from "../content/castArcs.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";

const STYLE_ID = "sound-seekers-painted-shape-v2";
const STATIC_REDUCED_TRANSITION = "outline-opacity-static-final";
const POSE_KEYS = [
  "id", "poseId", "transforms", "face", "anchors", "fullMotionId",
  "reducedReplacement"
];
const TRANSFORM_KEYS = ["torso", "head", "leftArm", "rightArm", "leftLeg", "rightLeg"];
const BODY_TRANSFORM_KEYS = ["x", "y", "rotate", "scaleX", "scaleY"];
const ARM_TRANSFORM_KEYS = ["shoulder", "elbow", "hand"];
const LEG_TRANSFORM_KEYS = ["hip", "knee", "foot"];
const FACE_KEYS = ["eyesId", "browsId", "mouthId"];
const ANCHOR_KEYS = ["back", "head", "neck", "held", "contact"];
const ATTACHMENT_ANCHOR_KEYS = ["x", "y", "rotate"];
const CONTACT_ANCHOR_KEYS = ["x", "y"];
const REDUCED_REPLACEMENT_KEYS = ["transition", "finalPoseId", "continuous"];
const CHARACTER_KEYS = [
  "characterId", "chapterId", "castKind", "styleId", "bodyShapeId",
  "paletteTokenId", "featureIds", "rolePropId", "gearAnchorIds",
  "poseRendererIds", "visualSignature"
];
const GEAR_SLOTS = ["back", "head", "neck", "held"];
const BODY_SHAPE_IDS = new Set([
  "body-shape-sprout",
  "body-shape-pebble",
  "body-shape-kite",
  "body-shape-bell"
]);
const CAST_KINDS = new Set(["guide", "resident", "player"]);
const PROPORTION_BY_BODY_SHAPE = Object.freeze({
  "body-shape-sprout": "proportion-tall-sprout",
  "body-shape-pebble": "proportion-grounded-pebble",
  "body-shape-kite": "proportion-agile-kite",
  "body-shape-bell": "proportion-broad-bell"
});
const MATERIAL_BY_CHAPTER = Object.freeze({
  "seedwake-meadow": "material-leaf-and-lantern",
  "river-gardens": "material-river-cloth-and-ceramic",
  "fossil-canyon": "material-canvas-and-sandstone",
  "forge-settlement": "material-wool-and-copper",
  "glass-marsh": "material-reed-and-glass",
  "storm-coast": "material-oilskin-and-rope",
  "lantern-forest": "material-moss-and-bark",
  "star-reach": "material-quilt-and-starlight"
});

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertExactKeys(value, expectedKeys, label) {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be a plain record`);
  const keys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (keys.length !== expectedKeys.length
    || keys.some(key => typeof key !== "string" || !expectedKeys.includes(key))
    || expectedKeys.some(key => !Object.hasOwn(descriptors[key], "value")
      || !descriptors[key].enumerable)) {
    throw new TypeError(`${label} must contain exactly the canonical keys`);
  }
}

function assertCodeNativeId(value, label) {
  if (typeof value !== "string" || !/^[a-z][a-z0-9]*(?:[:-][a-z0-9]+)*$/u.test(value)) {
    throw new TypeError(`${label} must be a code-native identifier`);
  }
}

function assertFiniteRange(value, minimum, maximum, label) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} must be finite and bounded by the character viewBox`);
  }
}

function normalizedNumber(value) {
  return Object.is(value, -0) ? 0 : value;
}

function structuralHash(prefix, value) {
  const serialized = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export const SOUND_SEEKERS_POSE_IDS = deepFreeze([
  "idle", "walk", "explain", "encourage", "anticipate",
  "contact", "repair", "react", "celebrate", "recover"
]);

function bodyTransform([x, y, rotate, scaleX, scaleY]) {
  return { x, y, rotate, scaleX, scaleY };
}

function armTransform([shoulder, elbow, hand]) {
  return { shoulder, elbow, hand };
}

function legTransform([hip, knee, foot]) {
  return { hip, knee, foot };
}

function attachmentAnchor([x, y, rotate]) {
  return { x, y, rotate };
}

function contactAnchor([x, y]) {
  return { x, y };
}

function createPose({
  poseId,
  torso,
  head,
  leftArm,
  rightArm,
  leftLeg,
  rightLeg,
  face,
  anchors,
  motionName
}) {
  return {
    id: `pose:${poseId}`,
    poseId,
    transforms: {
      torso: bodyTransform(torso),
      head: bodyTransform(head),
      leftArm: armTransform(leftArm),
      rightArm: armTransform(rightArm),
      leftLeg: legTransform(leftLeg),
      rightLeg: legTransform(rightLeg)
    },
    face: {
      eyesId: face[0],
      browsId: face[1],
      mouthId: face[2]
    },
    anchors: {
      back: attachmentAnchor(anchors.back),
      head: attachmentAnchor(anchors.head),
      neck: attachmentAnchor(anchors.neck),
      held: attachmentAnchor(anchors.held),
      contact: contactAnchor(anchors.contact)
    },
    fullMotionId: `pose-motion:${poseId}-${motionName}`,
    reducedReplacement: {
      transition: STATIC_REDUCED_TRANSITION,
      finalPoseId: poseId,
      continuous: false
    }
  };
}

const POSE_BLUEPRINTS = [
  {
    poseId: "idle",
    torso: [120, 181, 0, 1, 1],
    head: [120, 83, 0, 1, 1],
    leftArm: [8, 12, 4],
    rightArm: [-8, -12, -4],
    leftLeg: [4, 6, 0],
    rightLeg: [-4, -6, 0],
    face: ["eyes-open", "brows-level", "mouth-soft-smile"],
    anchors: {
      back: [84, 145, 0], head: [120, 35, 0], neck: [120, 119, 0],
      held: [172, 187, 0], contact: [120, 278]
    },
    motionName: "breathe"
  },
  {
    poseId: "walk",
    torso: [122, 178, -2, 1, 1],
    head: [118, 80, 3, 1, 1],
    leftArm: [-32, -18, -8],
    rightArm: [34, 20, 10],
    leftLeg: [30, 25, 12],
    rightLeg: [-24, -18, -8],
    face: ["eyes-forward", "brows-level", "mouth-soft-smile"],
    anchors: {
      back: [85, 141, -2], head: [118, 32, 3], neck: [119, 116, 1],
      held: [169, 180, -8], contact: [143, 278]
    },
    motionName: "stride"
  },
  {
    poseId: "explain",
    torso: [120, 180, 1, 1, 1],
    head: [121, 80, -4, 1, 1],
    leftArm: [-12, -20, -4],
    rightArm: [-52, -70, -15],
    leftLeg: [2, 5, 0],
    rightLeg: [-2, -5, 0],
    face: ["eyes-focused", "brows-lifted", "mouth-open-talk"],
    anchors: {
      back: [84, 144, 1], head: [121, 32, -4], neck: [120, 117, -2],
      held: [181, 137, -28], contact: [120, 278]
    },
    motionName: "gesture"
  },
  {
    poseId: "encourage",
    torso: [120, 177, 0, 1.02, 1.02],
    head: [120, 77, 0, 1.03, 1.03],
    leftArm: [-46, -54, -12],
    rightArm: [46, 54, 12],
    leftLeg: [8, 10, 3],
    rightLeg: [-8, -10, -3],
    face: ["eyes-happy", "brows-lifted", "mouth-wide-smile"],
    anchors: {
      back: [84, 141, 0], head: [120, 28, 0], neck: [120, 114, 0],
      held: [176, 145, 18], contact: [120, 278]
    },
    motionName: "welcome"
  },
  {
    poseId: "anticipate",
    torso: [125, 179, 5, 0.99, 1],
    head: [128, 80, 8, 1, 1],
    leftArm: [26, 45, 12],
    rightArm: [-22, -38, -10],
    leftLeg: [14, 18, 6],
    rightLeg: [-8, -12, -4],
    face: ["eyes-wide", "brows-curious", "mouth-round"],
    anchors: {
      back: [89, 143, 5], head: [128, 32, 8], neck: [126, 117, 6],
      held: [164, 157, -6], contact: [132, 277]
    },
    motionName: "listen"
  },
  {
    poseId: "contact",
    torso: [128, 183, 8, 1, 1],
    head: [131, 84, 10, 1, 1],
    leftArm: [58, 42, 8],
    rightArm: [-18, -30, -8],
    leftLeg: [18, 22, 8],
    rightLeg: [-12, -18, -6],
    face: ["eyes-focused", "brows-curious", "mouth-small-open"],
    anchors: {
      back: [91, 147, 8], head: [131, 36, 10], neck: [129, 121, 9],
      held: [196, 193, 18], contact: [209, 211]
    },
    motionName: "reach"
  },
  {
    poseId: "repair",
    torso: [127, 202, 12, 0.98, 0.98],
    head: [133, 105, 14, 1, 1],
    leftArm: [62, 54, 16],
    rightArm: [-65, -50, -12],
    leftLeg: [42, 58, 18],
    rightLeg: [-38, -52, -16],
    face: ["eyes-narrow", "brows-focused", "mouth-determined"],
    anchors: {
      back: [92, 166, 12], head: [133, 57, 14], neck: [130, 141, 13],
      held: [191, 229, -25], contact: [204, 244]
    },
    motionName: "repair-contact"
  },
  {
    poseId: "react",
    torso: [116, 179, -7, 1, 1],
    head: [111, 76, -12, 1.04, 1.04],
    leftArm: [-64, -44, -15],
    rightArm: [67, 46, 16],
    leftLeg: [-12, -6, -4],
    rightLeg: [18, 12, 5],
    face: ["eyes-wide", "brows-high", "mouth-surprised"],
    anchors: {
      back: [80, 143, -7], head: [111, 27, -12], neck: [113, 114, -10],
      held: [179, 169, 24], contact: [112, 278]
    },
    motionName: "surprise"
  },
  {
    poseId: "celebrate",
    torso: [120, 168, 0, 1.04, 1.04],
    head: [120, 66, 0, 1.05, 1.05],
    leftArm: [-112, -90, -24],
    rightArm: [112, 90, 24],
    leftLeg: [24, 34, 12],
    rightLeg: [-24, -34, -12],
    face: ["eyes-happy", "brows-joy", "mouth-cheer"],
    anchors: {
      back: [83, 132, 0], head: [120, 16, 0], neck: [120, 103, 0],
      held: [185, 92, 28], contact: [120, 270]
    },
    motionName: "cheer"
  },
  {
    poseId: "recover",
    torso: [119, 194, -3, 1, 0.98],
    head: [117, 96, -5, 1, 1],
    leftArm: [22, 34, 10],
    rightArm: [-28, -40, -12],
    leftLeg: [35, 48, 15],
    rightLeg: [-31, -45, -14],
    face: ["eyes-soft", "brows-relieved", "mouth-relief"],
    anchors: {
      back: [82, 158, -3], head: [117, 48, -5], neck: [118, 133, -4],
      held: [166, 210, -10], contact: [118, 280]
    },
    motionName: "steady"
  }
];

function validatePose(pose) {
  assertExactKeys(pose, POSE_KEYS, "Pose renderer");
  assertCodeNativeId(pose.poseId, "Pose ID");
  if (pose.id !== `pose:${pose.poseId}`) throw new TypeError("Pose renderer ID must match its pose ID");
  if (
    typeof pose.fullMotionId !== "string"
    || !pose.fullMotionId.startsWith(`pose-motion:${pose.poseId}-`)
  ) {
    throw new TypeError("Pose full-motion ID must match its pose ID");
  }

  assertExactKeys(pose.transforms, TRANSFORM_KEYS, "Pose transforms");
  for (const partId of ["torso", "head"]) {
    const transform = pose.transforms[partId];
    assertExactKeys(transform, BODY_TRANSFORM_KEYS, `${partId} transform`);
    assertFiniteRange(transform.x, 0, 240, `${partId} x transform`);
    assertFiniteRange(transform.y, 0, 320, `${partId} y transform`);
    assertFiniteRange(transform.rotate, -180, 180, `${partId} rotation`);
    assertFiniteRange(transform.scaleX, 0.5, 1.5, `${partId} horizontal scale`);
    assertFiniteRange(transform.scaleY, 0.5, 1.5, `${partId} vertical scale`);
  }
  for (const partId of ["leftArm", "rightArm"]) {
    const transform = pose.transforms[partId];
    assertExactKeys(transform, ARM_TRANSFORM_KEYS, `${partId} transform`);
    for (const [joint, value] of Object.entries(transform)) {
      assertFiniteRange(value, -180, 180, `${partId} ${joint} transform`);
    }
  }
  for (const partId of ["leftLeg", "rightLeg"]) {
    const transform = pose.transforms[partId];
    assertExactKeys(transform, LEG_TRANSFORM_KEYS, `${partId} transform`);
    for (const [joint, value] of Object.entries(transform)) {
      assertFiniteRange(value, -180, 180, `${partId} ${joint} transform`);
    }
  }

  assertExactKeys(pose.face, FACE_KEYS, "Pose face");
  for (const [field, value] of Object.entries(pose.face)) {
    assertCodeNativeId(value, `Pose face ${field}`);
  }
  assertExactKeys(pose.anchors, ANCHOR_KEYS, "Pose anchors");
  for (const anchorId of GEAR_SLOTS) {
    const anchor = pose.anchors[anchorId];
    assertExactKeys(anchor, ATTACHMENT_ANCHOR_KEYS, `${anchorId} anchor`);
    assertFiniteRange(anchor.x, 0, 240, `${anchorId} anchor x`);
    assertFiniteRange(anchor.y, 0, 320, `${anchorId} anchor y`);
    assertFiniteRange(anchor.rotate, -180, 180, `${anchorId} anchor rotation`);
  }
  assertExactKeys(pose.anchors.contact, CONTACT_ANCHOR_KEYS, "Contact anchor");
  assertFiniteRange(pose.anchors.contact.x, 0, 240, "Contact anchor x");
  assertFiniteRange(pose.anchors.contact.y, 0, 320, "Contact anchor y");

  assertExactKeys(
    pose.reducedReplacement,
    REDUCED_REPLACEMENT_KEYS,
    "Pose reduced replacement"
  );
  if (
    pose.reducedReplacement.transition !== STATIC_REDUCED_TRANSITION
    || pose.reducedReplacement.continuous !== false
  ) {
    throw new TypeError("Pose reduced replacement must be static and non-continuous");
  }
  if (pose.reducedReplacement.finalPoseId !== pose.poseId) {
    throw new TypeError("Pose reduced replacement must resolve to the same final pose");
  }
}

function canonicalBodyTransform(transform) {
  return {
    x: normalizedNumber(transform.x),
    y: normalizedNumber(transform.y),
    rotate: normalizedNumber(transform.rotate),
    scaleX: normalizedNumber(transform.scaleX),
    scaleY: normalizedNumber(transform.scaleY)
  };
}

function canonicalJointTransform(transform, keys) {
  return Object.fromEntries(keys.map(key => [key, normalizedNumber(transform[key])]));
}

function canonicalAttachmentAnchor(anchor) {
  return {
    x: normalizedNumber(anchor.x),
    y: normalizedNumber(anchor.y),
    rotate: normalizedNumber(anchor.rotate)
  };
}

export function poseCompositionSignature(pose) {
  validatePose(pose);
  return structuralHash("pose-composition", {
    transforms: {
      torso: canonicalBodyTransform(pose.transforms.torso),
      head: canonicalBodyTransform(pose.transforms.head),
      leftArm: canonicalJointTransform(pose.transforms.leftArm, ARM_TRANSFORM_KEYS),
      rightArm: canonicalJointTransform(pose.transforms.rightArm, ARM_TRANSFORM_KEYS),
      leftLeg: canonicalJointTransform(pose.transforms.leftLeg, LEG_TRANSFORM_KEYS),
      rightLeg: canonicalJointTransform(pose.transforms.rightLeg, LEG_TRANSFORM_KEYS)
    },
    face: Object.fromEntries(FACE_KEYS.map(key => [key, pose.face[key]])),
    anchors: {
      back: canonicalAttachmentAnchor(pose.anchors.back),
      head: canonicalAttachmentAnchor(pose.anchors.head),
      neck: canonicalAttachmentAnchor(pose.anchors.neck),
      held: canonicalAttachmentAnchor(pose.anchors.held),
      contact: {
        x: normalizedNumber(pose.anchors.contact.x),
        y: normalizedNumber(pose.anchors.contact.y)
      }
    },
    reducedFinalState: {
      transition: pose.reducedReplacement.transition,
      continuous: pose.reducedReplacement.continuous
    }
  });
}

export const SOUND_SEEKERS_POSE_RENDERERS = deepFreeze(POSE_BLUEPRINTS.map(createPose));

function validatePoseRegistry() {
  if (SOUND_SEEKERS_POSE_RENDERERS.length !== SOUND_SEEKERS_POSE_IDS.length) {
    throw new Error("Pose registry must contain every canonical pose exactly once");
  }
  const signatures = new Set();
  for (const [index, pose] of SOUND_SEEKERS_POSE_RENDERERS.entries()) {
    if (pose.poseId !== SOUND_SEEKERS_POSE_IDS[index]) {
      throw new Error("Pose registry order must match the canonical pose order");
    }
    const signature = poseCompositionSignature(pose);
    if (signatures.has(signature)) throw new Error(`Pose ${pose.poseId} is a structural alias`);
    signatures.add(signature);
  }
}

validatePoseRegistry();

const poseById = new Map(SOUND_SEEKERS_POSE_RENDERERS.map(pose => [pose.poseId, pose]));

export function resolvePoseRenderer(poseId) {
  return typeof poseId === "string" ? poseById.get(poseId) || null : null;
}

const GEAR_ANCHOR_IDS = deepFreeze({
  back: "character-anchor-back",
  head: "character-anchor-head",
  neck: "character-anchor-neck",
  held: "character-anchor-held"
});

const POSE_RENDERER_IDS = deepFreeze(Object.fromEntries(
  SOUND_SEEKERS_POSE_RENDERERS.map(pose => [pose.poseId, pose.id])
));

const CHARACTER_ENRICHMENTS = deepFreeze({
  Bouncy: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-seedwake",
    featureIds: ["feature-long-ears", "feature-spring-tail", "feature-lantern-freckles"],
    rolePropId: "role-prop-seed-lantern"
  },
  Moss: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-seedwake",
    featureIds: ["feature-leaf-crown", "feature-moss-cheeks", "feature-root-feet"],
    rolePropId: "role-prop-seed-trowel"
  },
  Tumble: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "biome-seedwake",
    featureIds: ["feature-river-whiskers", "feature-paddle-tail", "feature-work-patches"],
    rolePropId: "role-prop-ford-mallet"
  },
  Bramble: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-seedwake",
    featureIds: ["feature-thorn-fringe", "feature-arched-brows", "feature-hedge-collar"],
    rolePropId: "role-prop-gate-key"
  },
  Nori: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-river",
    featureIds: ["feature-river-ears", "feature-rudder-tail", "feature-current-mark"],
    rolePropId: "role-prop-river-rudder"
  },
  Fizz: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-river",
    featureIds: ["feature-bee-antennae", "feature-wing-petals", "feature-tool-belt"],
    rolePropId: "role-prop-bee-spanner"
  },
  Quill: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "biome-river",
    featureIds: ["feature-quill-crest", "feature-map-speckles", "feature-compass-eye"],
    rolePropId: "role-prop-canal-map"
  },
  Rill: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "light-river",
    featureIds: ["feature-reed-ears", "feature-wave-fringe", "feature-rhythm-marks"],
    rolePropId: "role-prop-weir-baton"
  },
  Fen: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-fossil",
    featureIds: ["feature-ranger-frill", "feature-track-marks", "feature-ridge-tail"],
    rolePropId: "role-prop-fossil-compass"
  },
  Rook: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-fossil",
    featureIds: ["feature-bone-crest", "feature-survey-stripes", "feature-sturdy-claws"],
    rolePropId: "role-prop-survey-frame"
  },
  Amber: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "biome-fossil",
    featureIds: ["feature-amber-scales", "feature-dig-band", "feature-dust-freckles"],
    rolePropId: "role-prop-dig-brush"
  },
  Claw: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-fossil",
    featureIds: ["feature-runner-spines", "feature-pass-stripes", "feature-light-feet"],
    rolePropId: "role-prop-trail-pennant"
  },
  Cinder: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-forge",
    featureIds: ["feature-ember-tuft", "feature-copper-cheeks", "feature-smith-apron"],
    rolePropId: "role-prop-forge-tongs"
  },
  Bolt: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "light-forge",
    featureIds: ["feature-bolt-brows", "feature-gear-ear", "feature-machine-patches"],
    rolePropId: "role-prop-machine-key"
  },
  Soot: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "biome-forge",
    featureIds: ["feature-soot-freckles", "feature-driver-cap", "feature-rail-boots"],
    rolePropId: "role-prop-train-lamp"
  },
  Bellows: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-forge",
    featureIds: ["feature-flame-beard", "feature-iron-brows", "feature-master-apron"],
    rolePropId: "role-prop-smith-hammer"
  },
  Vale: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-glass",
    featureIds: ["feature-marsh-ears", "feature-light-collar", "feature-fen-speckles"],
    rolePropId: "role-prop-marsh-lantern"
  },
  Ripple: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-glass",
    featureIds: ["feature-reed-crown", "feature-ripple-cheeks", "feature-tuning-whiskers"],
    rolePropId: "role-prop-reed-fork"
  },
  Mica: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "biome-glass",
    featureIds: ["feature-crystal-fringe", "feature-garden-spots", "feature-glass-feet"],
    rolePropId: "role-prop-glass-trowel"
  },
  Glint: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-glass",
    featureIds: ["feature-mirror-crest", "feature-watcher-eye", "feature-refraction-marks"],
    rolePropId: "role-prop-mirror-scope"
  },
  Skiff: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-storm",
    featureIds: ["feature-wind-ears", "feature-spray-freckles", "feature-cliff-tail"],
    rolePropId: "role-prop-coast-rope"
  },
  Kelp: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-storm",
    featureIds: ["feature-kelp-fringe", "feature-harbour-stripes", "feature-tide-boots"],
    rolePropId: "role-prop-harbour-hook"
  },
  Boom: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "biome-storm",
    featureIds: ["feature-cloud-brows", "feature-drum-bands", "feature-thunder-cheeks"],
    rolePropId: "role-prop-storm-drum"
  },
  Prism: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-storm",
    featureIds: ["feature-prism-crest", "feature-lens-eye", "feature-beacon-speckles"],
    rolePropId: "role-prop-lens-frame"
  },
  Echo: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-lantern",
    featureIds: ["feature-forest-ears", "feature-map-lines", "feature-echo-tail"],
    rolePropId: "role-prop-lantern-map"
  },
  Luma: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-lantern",
    featureIds: ["feature-moth-antennae", "feature-lantern-wings", "feature-glow-freckles"],
    rolePropId: "role-prop-moth-light"
  },
  Wisp: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "biome-lantern",
    featureIds: ["feature-listener-ears", "feature-root-marks", "feature-path-fringe"],
    rolePropId: "role-prop-listening-cup"
  },
  Orbit: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-lantern",
    featureIds: ["feature-orbit-crown", "feature-star-eye", "feature-observatory-collar"],
    rolePropId: "role-prop-star-dial"
  },
  Nova: {
    bodyShapeId: "body-shape-kite",
    paletteTokenId: "biome-star",
    featureIds: ["feature-star-ears", "feature-road-lines", "feature-nova-tail"],
    rolePropId: "role-prop-star-road-key"
  },
  Comet: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "light-star",
    featureIds: ["feature-comet-fringe", "feature-courier-sash", "feature-speed-speckles"],
    rolePropId: "role-prop-sky-satchel"
  },
  Aster: {
    bodyShapeId: "body-shape-pebble",
    paletteTokenId: "biome-star",
    featureIds: ["feature-aster-crown", "feature-builder-marks", "feature-sky-brows"],
    rolePropId: "role-prop-constellation-frame"
  },
  Dawn: {
    bodyShapeId: "body-shape-bell",
    paletteTokenId: "light-star",
    featureIds: ["feature-dawn-rays", "feature-singer-collar", "feature-first-light-cheeks"],
    rolePropId: "role-prop-first-light-chime"
  }
});

function validateCharacterVisualShape(visual) {
  assertExactKeys(visual, CHARACTER_KEYS, "Character visual");
  if (typeof visual.characterId !== "string" || visual.characterId.length === 0) {
    throw new TypeError("Character visual needs a character identity");
  }
  if (visual.chapterId !== null && (
    typeof visual.chapterId !== "string" || visual.chapterId.length === 0
  )) {
    throw new TypeError("Character visual needs a canonical chapter identity or null");
  }
  if (!CAST_KINDS.has(visual.castKind)) throw new TypeError("Character visual has unknown cast kind");
  if (visual.styleId !== STYLE_ID) throw new TypeError("Character visual has unknown style");
  if (!BODY_SHAPE_IDS.has(visual.bodyShapeId)) {
    throw new TypeError("Character visual has unknown body shape");
  }
  if (
    typeof visual.paletteTokenId !== "string"
    || !Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, visual.paletteTokenId)
  ) {
    throw new TypeError("Character visual has unknown palette token");
  }
  if (
    !Array.isArray(visual.featureIds)
    || visual.featureIds.length === 0
    || new Set(visual.featureIds).size !== visual.featureIds.length
  ) {
    throw new TypeError("Character visual features must be a non-empty unique list");
  }
  for (const featureId of visual.featureIds) assertCodeNativeId(featureId, "Character feature");
  assertCodeNativeId(visual.rolePropId, "Character role prop");

  assertExactKeys(visual.gearAnchorIds, GEAR_SLOTS, "Character gear anchors");
  for (const slot of GEAR_SLOTS) {
    if (visual.gearAnchorIds[slot] !== GEAR_ANCHOR_IDS[slot]) {
      throw new TypeError(`Character gear anchor ${slot} is unknown`);
    }
  }
  assertExactKeys(visual.poseRendererIds, SOUND_SEEKERS_POSE_IDS, "Character pose map");
  const rendererIds = Object.values(visual.poseRendererIds);
  if (new Set(rendererIds).size !== SOUND_SEEKERS_POSE_IDS.length) {
    throw new TypeError("Character pose map must be a renderer bijection");
  }
  for (const poseId of SOUND_SEEKERS_POSE_IDS) {
    if (visual.poseRendererIds[poseId] !== `pose:${poseId}`) {
      throw new TypeError(`Character pose ${poseId} has an unknown renderer`);
    }
  }
  if (typeof visual.visualSignature !== "string") {
    throw new TypeError("Character visual signature must be a string");
  }
}

export function characterVisualSignature(visual) {
  validateCharacterVisualShape(visual);
  return structuralHash("character-visual", {
    styleId: visual.styleId,
    bodyShapeId: visual.bodyShapeId,
    featureIds: [...visual.featureIds].sort(),
    rolePropId: visual.rolePropId,
    gearAnchorIds: Object.fromEntries(
      GEAR_SLOTS.map(slot => [slot, visual.gearAnchorIds[slot]])
    ),
    poseRendererIds: Object.fromEntries(
      SOUND_SEEKERS_POSE_IDS.map(poseId => [poseId, visual.poseRendererIds[poseId]])
    )
  });
}

function createCharacterVisual({ characterId, chapterId, castKind, enrichment }) {
  const unsigned = {
    characterId,
    chapterId,
    castKind,
    styleId: STYLE_ID,
    bodyShapeId: enrichment.bodyShapeId,
    paletteTokenId: enrichment.paletteTokenId,
    featureIds: [...enrichment.featureIds],
    rolePropId: enrichment.rolePropId,
    gearAnchorIds: { ...GEAR_ANCHOR_IDS },
    poseRendererIds: { ...POSE_RENDERER_IDS },
    visualSignature: ""
  };
  return { ...unsigned, visualSignature: characterVisualSignature(unsigned) };
}

const canonicalCast = SOUND_SEEKERS_CHAPTERS.flatMap(chapter => [
  {
    characterId: chapter.cast.guide.name,
    chapterId: chapter.id,
    castKind: "guide",
    source: chapter.cast.guide
  },
  ...chapter.cast.residents.map(resident => ({
    characterId: resident.name,
    chapterId: chapter.id,
    castKind: "resident",
    source: resident
  }))
]);

function characterSlug(value) {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

const AUTHORED_SILHOUETTES = deepFreeze({
  Bouncy: {
    headPath: "M -48 7 Q -49 -37 -8 -48 Q 38 -53 50 -6 Q 55 37 8 49 Q -39 48 -48 7 Z",
    accentPaths: ["M -31 -34 Q -65 -92 -43 -105 Q -12 -79 -14 -38 Z M 28 -36 Q 61 -94 45 -106 Q 13 -82 13 -39 Z", "M 36 16 Q 78 2 80 40 Q 72 65 43 43 Z"]
  },
  Moss: {
    headPath: "M -45 4 Q -38 -49 2 -51 Q 42 -48 46 3 Q 39 47 0 46 Q -40 48 -45 4 Z",
    accentPaths: ["M -33 -35 Q -31 -82 -6 -57 Q 2 -101 18 -59 Q 42 -83 38 -34 Z", "M -23 43 Q -12 67 0 48 Q 15 68 26 42"]
  },
  Tumble: {
    headPath: "M -52 10 Q -46 -34 -12 -46 Q 31 -51 50 -13 Q 61 28 23 48 Q -27 57 -52 10 Z",
    accentPaths: ["M -43 -17 Q -78 -39 -77 -11 Q -75 17 -45 14 Z M 43 -18 Q 73 -37 78 -10 Q 80 16 47 15 Z", "M 38 23 Q 82 21 89 53 Q 60 66 40 43 Z"]
  },
  Bramble: {
    headPath: "M -49 9 Q -43 -39 -4 -49 Q 39 -48 49 -5 L 43 33 Q 19 56 -8 49 Q -39 47 -49 9 Z",
    accentPaths: ["M -40 -29 L -31 -72 L -14 -51 L -3 -88 L 12 -53 L 31 -78 L 42 -28 Z", "M -47 25 L -65 42 L -40 41 M 43 27 L 64 43 L 38 43"]
  },
  Nori: {
    headPath: "M -50 -1 Q -36 -51 8 -47 Q 51 -39 49 7 Q 41 49 -4 48 Q -48 43 -50 -1 Z",
    accentPaths: ["M -37 -28 Q -72 -57 -67 -82 Q -31 -75 -13 -37 Z M 35 -29 Q 72 -58 66 -82 Q 29 -74 12 -37 Z", "M 44 15 Q 86 -2 87 28 Q 83 54 48 43 Z"]
  },
  Fizz: {
    headPath: "M -43 5 Q -42 -43 -3 -50 Q 39 -45 45 -1 Q 46 44 3 49 Q -39 50 -43 5 Z",
    accentPaths: ["M -24 -39 Q -44 -72 -29 -91 M 24 -39 Q 46 -72 31 -92 M -29 -92 A 8 8 0 1 0 -28 -92 M 31 -93 A 8 8 0 1 0 32 -93", "M -42 5 Q -77 -28 -72 19 Q -63 50 -37 29 Z M 42 5 Q 77 -28 72 19 Q 63 50 37 29 Z"]
  },
  Quill: {
    headPath: "M -48 1 Q -34 -46 4 -51 Q 44 -43 50 4 Q 38 47 -3 48 Q -44 45 -48 1 Z",
    accentPaths: ["M -40 -27 L -34 -72 L -18 -48 L -6 -92 L 7 -49 L 24 -79 L 40 -28 Z", "M 45 -2 L 72 -20 L 65 15 L 46 26 Z"]
  },
  Rill: {
    headPath: "M -51 5 Q -43 -43 -6 -48 Q 37 -51 50 -10 Q 57 34 15 50 Q -34 53 -51 5 Z",
    accentPaths: ["M -34 -29 Q -58 -78 -36 -92 Q -14 -65 -15 -34 Z M 32 -30 Q 59 -72 42 -90 Q 15 -68 14 -35 Z", "M -47 18 Q -72 42 -43 47 M 45 18 Q 72 40 43 48"]
  },
  Fen: {
    headPath: "M -46 -8 Q -24 -54 17 -45 Q 54 -34 47 12 Q 32 52 -12 46 Q -53 37 -46 -8 Z",
    accentPaths: ["M -37 -26 L -51 -63 L -23 -50 L -20 -82 L 2 -53 L 17 -83 L 25 -48 L 49 -62 L 38 -23 Z", "M 40 20 Q 80 5 82 39 Q 69 62 42 45 Z"]
  },
  Rook: {
    headPath: "M -52 12 Q -52 -31 -17 -49 Q 25 -57 49 -20 Q 63 20 29 47 Q -20 61 -52 12 Z",
    accentPaths: ["M -42 -26 L -25 -66 L -9 -45 L 7 -78 L 20 -43 L 46 -61 L 42 -20 Z", "M -50 12 L -75 28 L -48 36 M 49 7 L 75 25 L 48 34"]
  },
  Amber: {
    headPath: "M -49 3 Q -39 -42 -3 -51 Q 38 -48 50 -8 Q 57 31 20 49 Q -27 56 -49 3 Z",
    accentPaths: ["M -41 -14 Q -68 -42 -62 -67 Q -31 -63 -16 -36 Z M 39 -18 Q 67 -47 64 -70 Q 31 -63 15 -37 Z", "M -39 33 L -59 50 L -31 48 M 38 34 L 60 48 L 31 49"]
  },
  Claw: {
    headPath: "M -44 7 Q -45 -44 -4 -52 Q 41 -48 46 -3 Q 47 44 2 50 Q -41 49 -44 7 Z",
    accentPaths: ["M -37 -31 L -31 -63 L -18 -48 L -7 -78 L 5 -50 L 20 -84 L 28 -49 L 43 -65 L 39 -28 Z", "M -45 19 L -71 7 L -61 37 L -38 41 Z"]
  },
  Cinder: {
    headPath: "M -49 0 Q -34 -48 6 -50 Q 46 -42 50 5 Q 38 50 -6 47 Q -48 42 -49 0 Z",
    accentPaths: ["M -33 -35 Q -17 -80 0 -55 Q 16 -91 30 -52 Q 43 -70 41 -31 Z", "M 41 8 Q 75 -10 80 18 Q 74 44 45 38 Z"]
  },
  Bolt: {
    headPath: "M -52 8 Q -47 -36 -9 -49 Q 36 -52 51 -12 Q 59 31 18 51 Q -31 55 -52 8 Z",
    accentPaths: ["M -48 -13 L -72 -30 L -72 3 L -49 18 Z M 47 -13 L 74 -31 L 73 5 L 49 19 Z", "M -17 -48 L -3 -70 L 11 -49 M -42 30 L -62 43 L -36 48"]
  },
  Soot: {
    headPath: "M -42 1 Q -37 -50 5 -52 Q 45 -44 45 2 Q 40 48 -2 48 Q -43 47 -42 1 Z",
    accentPaths: ["M -40 -31 Q 0 -70 43 -29 L 34 -49 Q -3 -76 -36 -53 Z", "M -44 -18 L -65 -2 L -43 12 M 43 -20 L 65 -5 L 44 11"]
  },
  Bellows: {
    headPath: "M -54 7 Q -48 -37 -11 -52 Q 31 -54 52 -17 Q 63 27 27 52 Q -23 60 -54 7 Z",
    accentPaths: ["M -43 -28 L -27 -72 L -8 -48 L 4 -84 L 20 -48 L 45 -67 L 43 -24 Z", "M -29 39 Q -19 79 0 54 Q 20 79 32 37 L 19 58 L 0 49 L -18 60 Z"]
  },
  Vale: {
    headPath: "M -48 -4 Q -29 -51 12 -47 Q 53 -35 47 11 Q 31 51 -13 46 Q -53 35 -48 -4 Z",
    accentPaths: ["M -37 -29 Q -69 -67 -53 -88 Q -23 -72 -15 -38 Z M 34 -31 Q 67 -68 53 -89 Q 20 -72 13 -38 Z", "M 42 22 Q 75 11 82 42 Q 63 61 40 45 Z"]
  },
  Ripple: {
    headPath: "M -44 4 Q -40 -47 1 -51 Q 43 -47 46 0 Q 44 46 1 49 Q -42 49 -44 4 Z",
    accentPaths: ["M -36 -34 Q -21 -79 -4 -54 Q 10 -89 23 -52 Q 43 -77 40 -31 Z", "M -44 9 Q -72 -8 -70 22 Q -60 47 -39 34 Z M 44 9 Q 72 -8 70 22 Q 60 47 39 34 Z"]
  },
  Mica: {
    headPath: "M -51 6 Q -44 -40 -7 -51 Q 35 -52 51 -14 Q 61 28 22 50 Q -27 58 -51 6 Z",
    accentPaths: ["M -41 -27 L -30 -69 L -14 -48 L 0 -88 L 13 -48 L 33 -74 L 43 -25 Z", "M -50 17 L -76 35 L -45 42 M 49 18 L 76 34 L 44 43"]
  },
  Glint: {
    headPath: "M -49 1 Q -36 -47 5 -51 Q 46 -42 51 5 Q 38 50 -6 48 Q -48 43 -49 1 Z",
    accentPaths: ["M -40 -27 L -20 -70 L -3 -49 L 11 -86 L 22 -48 L 47 -65 L 40 -24 Z", "M 46 -7 L 70 -20 L 67 12 L 47 26 Z M -45 -5 L -67 -18 L -65 15 L -46 27 Z"]
  },
  Skiff: {
    headPath: "M -50 -3 Q -31 -50 10 -48 Q 51 -37 49 9 Q 34 51 -11 47 Q -52 38 -50 -3 Z",
    accentPaths: ["M -38 -30 Q -70 -63 -60 -86 Q -26 -73 -14 -39 Z M 36 -30 Q 69 -62 60 -87 Q 25 -73 13 -39 Z", "M 43 17 Q 88 -4 88 32 Q 79 57 47 45 Z"]
  },
  Kelp: {
    headPath: "M -44 6 Q -44 -43 -5 -51 Q 39 -50 47 -5 Q 51 39 9 50 Q -37 54 -44 6 Z",
    accentPaths: ["M -39 -29 Q -51 -72 -29 -59 Q -17 -91 -3 -57 Q 15 -93 25 -55 Q 48 -75 41 -26 Z", "M -45 15 Q -73 2 -70 34 Q -55 53 -37 39 Z"]
  },
  Boom: {
    headPath: "M -54 10 Q -49 -34 -14 -50 Q 29 -56 51 -20 Q 65 21 31 49 Q -18 62 -54 10 Z",
    accentPaths: ["M -46 -16 Q -79 -39 -76 -7 Q -69 19 -47 20 Z M 47 -17 Q 80 -39 76 -7 Q 69 20 47 20 Z", "M -49 29 Q -74 48 -43 51 M 47 30 Q 74 48 42 52"]
  },
  Prism: {
    headPath: "M -47 -7 Q -25 -52 16 -45 Q 55 -31 46 15 Q 27 53 -16 44 Q -55 31 -47 -7 Z",
    accentPaths: ["M -39 -27 L -27 -68 L -9 -47 L 5 -91 L 20 -46 L 42 -72 L 39 -24 Z", "M 42 4 L 75 -13 L 68 24 L 43 34 Z"]
  },
  Echo: {
    headPath: "M -49 -2 Q -32 -50 9 -49 Q 50 -39 50 7 Q 36 51 -9 47 Q -52 40 -49 -2 Z",
    accentPaths: ["M -38 -31 Q -72 -68 -55 -91 Q -23 -75 -14 -40 Z M 36 -31 Q 71 -67 56 -92 Q 22 -75 13 -40 Z", "M 43 19 Q 84 7 86 40 Q 71 61 44 45 Z"]
  },
  Luma: {
    headPath: "M -43 3 Q -38 -49 4 -52 Q 45 -45 46 1 Q 42 47 0 49 Q -42 48 -43 3 Z",
    accentPaths: ["M -23 -40 Q -43 -76 -27 -95 M 25 -40 Q 48 -75 32 -96 M -27 -96 A 7 7 0 1 0 -26 -96 M 32 -97 A 7 7 0 1 0 33 -97", "M -41 4 Q -79 -33 -73 22 Q -60 53 -36 30 Z M 42 4 Q 79 -33 73 22 Q 60 53 36 30 Z"]
  },
  Wisp: {
    headPath: "M -52 7 Q -45 -41 -5 -51 Q 40 -49 52 -9 Q 58 34 15 51 Q -34 55 -52 7 Z",
    accentPaths: ["M -38 -30 Q -64 -75 -42 -92 Q -15 -70 -15 -37 Z M 35 -31 Q 65 -72 46 -91 Q 16 -70 14 -38 Z", "M -49 22 L -73 40 L -44 46 M 48 22 L 73 39 L 43 47"]
  },
  Orbit: {
    headPath: "M -50 0 Q -35 -48 5 -51 Q 47 -42 51 6 Q 37 51 -7 47 Q -50 42 -50 0 Z",
    accentPaths: ["M -42 -25 L -31 -68 L -13 -47 L 0 -92 L 14 -47 L 33 -69 L 43 -25 Z", "M -62 -7 A 62 40 0 1 0 63 -7 M 51 -26 A 8 8 0 1 0 52 -26"]
  },
  Nova: {
    headPath: "M -49 -5 Q -27 -51 14 -47 Q 54 -34 47 13 Q 29 53 -15 45 Q -55 33 -49 -5 Z",
    accentPaths: ["M -38 -31 Q -70 -69 -53 -91 Q -21 -75 -13 -40 Z M 34 -32 Q 68 -68 54 -93 Q 20 -76 12 -40 Z", "M 42 18 Q 89 -3 88 35 Q 76 60 45 45 Z"]
  },
  Comet: {
    headPath: "M -42 6 Q -44 -43 -5 -52 Q 39 -50 47 -6 Q 52 38 10 51 Q -37 55 -42 6 Z",
    accentPaths: ["M -39 -28 Q -48 -69 -28 -57 Q -13 -91 0 -55 Q 17 -87 28 -53 Q 48 -72 41 -26 Z", "M 40 17 Q 92 0 101 28 Q 85 56 43 45 Z"]
  },
  Aster: {
    headPath: "M -53 9 Q -48 -36 -11 -51 Q 32 -55 52 -17 Q 63 25 26 51 Q -23 60 -53 9 Z",
    accentPaths: ["M -44 -25 L -27 -67 L -10 -46 L 4 -88 L 19 -46 L 45 -65 L 42 -22 Z", "M -50 17 L -78 31 L -49 42 M 50 18 L 78 31 L 48 43"]
  },
  Dawn: {
    headPath: "M -50 2 Q -38 -45 1 -52 Q 43 -46 51 -3 Q 54 40 12 50 Q -35 54 -50 2 Z",
    accentPaths: ["M -43 -26 L -53 -62 L -28 -48 L -22 -80 L -3 -53 L 8 -89 L 20 -51 L 43 -75 L 39 -29 Z", "M -45 25 L -70 48 L -38 45 M 45 25 L 70 48 L 38 45"]
  },
  player: {
    headPath: "M -46 4 Q -42 -47 0 -52 Q 42 -47 47 1 Q 44 47 0 50 Q -43 49 -46 4 Z",
    accentPaths: ["M -35 -31 Q -61 -74 -39 -91 Q -14 -69 -14 -38 Z M 34 -31 Q 62 -72 42 -92 Q 14 -69 13 -38 Z", "M -44 18 Q -68 3 -68 31 Q -55 52 -37 40 Z M 44 18 Q 68 3 68 31 Q 55 52 37 40 Z"]
  }
});

function createCharacterArtProfile(characterId, chapterId, bodyShapeId, ordinal) {
  const silhouetteGeometry = AUTHORED_SILHOUETTES[characterId];
  if (!silhouetteGeometry) throw new Error(`${characterId}: missing authored silhouette geometry`);
  return {
    characterId,
    silhouetteFamilyId: `silhouette-${characterSlug(characterId)}`,
    proportionId: PROPORTION_BY_BODY_SHAPE[bodyShapeId],
    materialId: chapterId ? MATERIAL_BY_CHAPTER[chapterId] : "material-expedition-canvas",
    headShapeId: `head-authored-${characterSlug(characterId)}`,
    limbShapeId: `limb-shape-${(ordinal % 4) + 1}`,
    silhouetteGeometry
  };
}

export const SOUND_SEEKERS_CHARACTER_ART_PROFILES = deepFreeze([
  ...canonicalCast.map((character, ordinal) => createCharacterArtProfile(
    character.characterId,
    character.chapterId,
    CHARACTER_ENRICHMENTS[character.characterId].bodyShapeId,
    ordinal
  )),
  createCharacterArtProfile("player", null, "body-shape-sprout", canonicalCast.length)
]);

const characterArtProfileById = new Map(
  SOUND_SEEKERS_CHARACTER_ART_PROFILES.map(profile => [profile.characterId, profile])
);

export function resolveCharacterArtProfile(characterId) {
  return typeof characterId === "string" ? characterArtProfileById.get(characterId) || null : null;
}

export const SOUND_SEEKERS_CHARACTER_VISUALS = deepFreeze(canonicalCast.map(character => (
  createCharacterVisual({
    characterId: character.characterId,
    chapterId: character.chapterId,
    castKind: character.castKind,
    enrichment: CHARACTER_ENRICHMENTS[character.characterId]
  })
)));

export const SOUND_SEEKERS_PLAYER_VISUAL = deepFreeze(createCharacterVisual({
  characterId: "player",
  chapterId: null,
  castKind: "player",
  enrichment: {
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "player-palette-sunrise",
    featureIds: ["feature-listening-ears", "feature-sound-wave-badge", "feature-trail-boots"],
    rolePropId: "role-prop-listening-compass"
  }
}));

function validateCanonicalCharacterCatalog() {
  if (canonicalCast.length !== 32 || new Set(canonicalCast.map(item => item.characterId)).size !== 32) {
    throw new Error("Character visual catalog needs 32 unique canonical cast identities");
  }
  const canonicalIds = canonicalCast.map(item => item.characterId);
  const enrichmentIds = Object.keys(CHARACTER_ENRICHMENTS);
  if (
    enrichmentIds.length !== canonicalIds.length
    || enrichmentIds.some(characterId => !canonicalIds.includes(characterId))
  ) {
    throw new Error("Character visual enrichments must join the canonical cast bijectively");
  }
  if (SOUND_SEEKERS_CHARACTER_ART_PROFILES.length !== canonicalCast.length + 1
    || new Set(SOUND_SEEKERS_CHARACTER_ART_PROFILES.map(profile => profile.characterId)).size
      !== SOUND_SEEKERS_CHARACTER_ART_PROFILES.length
    || new Set(SOUND_SEEKERS_CHARACTER_ART_PROFILES.map(profile => profile.silhouetteFamilyId)).size
      !== SOUND_SEEKERS_CHARACTER_ART_PROFILES.length) {
    throw new Error("Character art profiles must join every cast identity with a unique silhouette");
  }
  for (const profile of SOUND_SEEKERS_CHARACTER_ART_PROFILES) {
    if (!/^silhouette-[a-z0-9-]+$/u.test(profile.silhouetteFamilyId)
      || !/^proportion-[a-z0-9-]+$/u.test(profile.proportionId)
      || !/^material-[a-z0-9-]+$/u.test(profile.materialId)
      || !/^head-authored-[a-z0-9-]+$/u.test(profile.headShapeId)
      || !/^limb-shape-[1-4]$/u.test(profile.limbShapeId)
      || typeof profile.silhouetteGeometry?.headPath !== "string"
      || profile.silhouetteGeometry.headPath.length < 40
      || !Array.isArray(profile.silhouetteGeometry.accentPaths)
      || profile.silhouetteGeometry.accentPaths.length < 2
      || profile.silhouetteGeometry.accentPaths.some(path => typeof path !== "string" || path.length < 20)) {
      throw new Error(`${profile.characterId}: character art profile is invalid`);
    }
  }

  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const arc = SOUND_SEEKERS_CAST_ARCS[chapter.id];
    const chapterCast = [chapter.cast.guide, ...chapter.cast.residents];
    if (!arc || arc.chapterId !== chapter.id || arc.characters.length !== chapterCast.length) {
      throw new Error(`${chapter.id}: cast arc does not match its canonical chapter`);
    }
    for (const [index, character] of chapterCast.entries()) {
      const arcCharacter = arc.characters[index];
      if (
        arcCharacter.id !== character.name
        || arcCharacter.role !== character.role
        || arcCharacter.archetype !== character.archetype
      ) {
        throw new Error(`${chapter.id}: cast arc identity drifted from its canonical chapter`);
      }
    }
  }

  const signatures = new Set();
  for (const [index, visual] of SOUND_SEEKERS_CHARACTER_VISUALS.entries()) {
    const expected = canonicalCast[index];
    if (
      visual.characterId !== expected.characterId
      || visual.chapterId !== expected.chapterId
      || visual.castKind !== expected.castKind
    ) {
      throw new Error("Character visual order or canonical identity drifted");
    }
    const signature = characterVisualSignature(visual);
    if (visual.visualSignature !== signature) {
      throw new Error(`${visual.characterId}: character visual signature is stale`);
    }
    if (signatures.has(signature)) {
      throw new Error(`${visual.characterId}: character visual is a structural alias`);
    }
    signatures.add(signature);
  }

  if (
    SOUND_SEEKERS_PLAYER_VISUAL.characterId !== "player"
    || SOUND_SEEKERS_PLAYER_VISUAL.chapterId !== null
    || SOUND_SEEKERS_PLAYER_VISUAL.castKind !== "player"
  ) {
    throw new Error("Player visual must remain separate from the canonical cast");
  }
  const playerSignature = characterVisualSignature(SOUND_SEEKERS_PLAYER_VISUAL);
  if (
    SOUND_SEEKERS_PLAYER_VISUAL.visualSignature !== playerSignature
    || signatures.has(playerSignature)
  ) {
    throw new Error("Player visual must have a current, structurally distinct signature");
  }
}

validateCanonicalCharacterCatalog();
