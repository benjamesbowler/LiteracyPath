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

function createCharacterArtProfile(characterId, chapterId, bodyShapeId, ordinal) {
  return {
    characterId,
    silhouetteFamilyId: `silhouette-${characterSlug(characterId)}`,
    proportionId: PROPORTION_BY_BODY_SHAPE[bodyShapeId],
    materialId: chapterId ? MATERIAL_BY_CHAPTER[chapterId] : "material-expedition-canvas",
    headShapeId: `head-silhouette-${(ordinal % 12) + 1}`,
    limbShapeId: `limb-shape-${(ordinal % 4) + 1}`
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
      || !/^head-silhouette-(?:[1-9]|1[0-2])$/u.test(profile.headShapeId)
      || !/^limb-shape-[1-4]$/u.test(profile.limbShapeId)) {
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
