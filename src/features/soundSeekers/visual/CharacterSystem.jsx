import {
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL,
  characterVisualSignature,
  poseCompositionSignature,
  resolveCharacterArtProfile,
  resolveCharacterProportionGeometry,
  resolveCharacterProportionId,
  resolvePoseRenderer
} from "./characterCatalog.js";
import {
  appearanceSignature,
  createCharacterAppearance
} from "./characterCustomization.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";
import "./visual-system.css";

const VISUAL_BY_CHARACTER_ID = new Map([
  ...SOUND_SEEKERS_CHARACTER_VISUALS.map(visual => [visual.characterId, visual]),
  [SOUND_SEEKERS_PLAYER_VISUAL.characterId, SOUND_SEEKERS_PLAYER_VISUAL]
]);

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));

const DEFAULT_PLAYER_APPEARANCE = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: SOUND_SEEKERS_PLAYER_VISUAL.bodyShapeId,
  paletteTokenId: SOUND_SEEKERS_PLAYER_VISUAL.paletteTokenId,
  accessories: { back: null, head: null, neck: null, held: null }
});

function svgTransform({ x, y, rotate, scaleX = 1, scaleY = 1 }) {
  return `translate(${x} ${y}) rotate(${rotate}) scale(${scaleX} ${scaleY})`;
}

function anchorTransform(anchor) {
  return `translate(${anchor.x} ${anchor.y}) rotate(${anchor.rotate})`;
}

function stableVisualSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function BodyShape({ bodyShapeId }) {
  if (bodyShapeId === "body-shape-pebble") {
    return <rect className="sound-seekers-character__body-fill" x="-47" y="-58" width="94" height="116" rx="43" />;
  }
  if (bodyShapeId === "body-shape-kite") {
    return <path className="sound-seekers-character__body-fill" d="M 0 -68 L 52 -8 L 31 64 L -38 57 L -52 -13 Z" />;
  }
  if (bodyShapeId === "body-shape-bell") {
    return <path className="sound-seekers-character__body-fill" d="M -50 49 Q -35 -58 0 -65 Q 35 -58 50 49 Q 30 68 0 61 Q -30 68 -50 49 Z" />;
  }
  return <path className="sound-seekers-character__body-fill" d="M 0 -66 C 42 -62 54 -20 43 35 C 35 69 -35 69 -43 35 C -54 -20 -42 -62 0 -66 Z" />;
}

function MaterialMarks({ materialId }) {
  const seed = stableVisualSeed(materialId);
  const texturePath = [
    "M -30 -17 Q -6 -29 22 -17 M -26 2 Q 1 -9 29 3 M -21 23 Q 0 14 22 24",
    "M -27 -21 L 26 -5 M -31 -2 L 22 14 M -22 18 L 17 31",
    "M -29 -15 Q -8 -3 18 -14 M -24 7 Q 0 21 26 5 M -17 28 Q 1 35 18 27",
    "M -25 -26 L -7 31 M 0 -31 L 13 32 M 23 -24 L 30 21"
  ][seed % 4];
  return (
    <g data-character-material-marks={materialId}>
      <path className="sound-seekers-character__body-shade" d="M 18 -54 Q 49 -21 35 34 Q 27 55 5 59 Q 24 21 18 -54 Z" />
      <path className="sound-seekers-character__material-mark" d={texturePath} />
    </g>
  );
}

function Arm({ side, transform, torso, limbShapeId }) {
  const direction = side === "left" ? -1 : 1;
  const shoulderX = torso.x + (direction * 39);
  const shoulderY = torso.y - 28;
  const shapeOrdinal = Number(limbShapeId.at(-1));
  const upperWidth = 7 + shapeOrdinal;
  const lowerWidth = 6 + (shapeOrdinal % 3);
  return (
    <g
      data-shaped-limb={`${side}-arm`}
      data-limb-shape={limbShapeId}
      transform={`translate(${shoulderX} ${shoulderY}) rotate(${transform.shoulder})`}
    >
      <path
        className="sound-seekers-character__limb-fill"
        d={`M ${direction * -upperWidth} -3 Q ${direction * 13} 17 ${direction * 30} 39 Q ${direction * 26} 48 ${direction * (18 - upperWidth)} 44 Q ${direction * 7} 25 ${direction * -upperWidth} 8 Z`}
      />
      <path className="sound-seekers-character__limb-highlight" d={`M ${direction * 3} 8 Q ${direction * 15} 23 ${direction * 24} 36`} />
      <g transform={`translate(${direction * 25} 43) rotate(${transform.elbow})`}>
        <path
          className="sound-seekers-character__limb-fill"
          d={`M ${direction * -lowerWidth} -4 Q ${direction * 11} 12 ${direction * 26} 31 Q ${direction * 27} 40 ${direction * (17 - lowerWidth)} 42 Q ${direction * 5} 23 ${direction * -lowerWidth} 5 Z`}
        />
        <circle className="sound-seekers-character__hand" cx={direction * 23} cy="36" r="8" transform={`rotate(${transform.hand})`} />
      </g>
    </g>
  );
}

function Leg({ side, transform, torso, limbShapeId }) {
  const direction = side === "left" ? -1 : 1;
  const hipX = torso.x + (direction * 22);
  const hipY = torso.y + 48;
  const shapeOrdinal = Number(limbShapeId.at(-1));
  const width = 8 + shapeOrdinal;
  return (
    <g
      data-shaped-limb={`${side}-leg`}
      data-limb-shape={limbShapeId}
      transform={`translate(${hipX} ${hipY}) rotate(${transform.hip})`}
    >
      <path
        className="sound-seekers-character__limb-fill"
        d={`M ${direction * -width} -5 Q ${direction * -2} 22 ${direction * (8 + width)} 43 L ${direction * (8 - width)} 49 Q ${direction * -7} 25 ${direction * width} 1 Z`}
      />
      <path className="sound-seekers-character__limb-highlight" d={`M ${direction * -2} 6 Q ${direction * 1} 24 ${direction * 6} 37`} />
      <g transform={`translate(${direction * 6} 43) rotate(${transform.knee})`}>
        <path
          className="sound-seekers-character__limb-fill"
          d={`M ${direction * -width} -3 Q ${direction * -1} 16 ${direction * (6 + width)} 31 L ${direction * (6 - width)} 38 Q ${direction * -6} 19 ${direction * width} 2 Z`}
        />
        <path className="sound-seekers-character__foot" d={`M ${direction * -2} 31 L ${direction * 19} 31 Q ${direction * 24} 40 ${direction * 5} 43 Z`} transform={`rotate(${transform.foot})`} />
      </g>
    </g>
  );
}

function Face({ face }) {
  const happy = /happy|soft/u.test(face.eyesId);
  const wide = /wide/u.test(face.eyesId);
  const openMouth = /open|round|surprised|cheer/u.test(face.mouthId);
  return (
    <>
      <g data-face-element={face.eyesId}>
        {happy ? (
          <>
            <path className="sound-seekers-character__face-line" d="M -24 -4 Q -15 -13 -6 -4" />
            <path className="sound-seekers-character__face-line" d="M 6 -4 Q 15 -13 24 -4" />
          </>
        ) : (
          <>
            <ellipse className="sound-seekers-character__eye" cx="-15" cy="-5" rx={wide ? 7 : 5} ry={wide ? 9 : 7} />
            <ellipse className="sound-seekers-character__eye" cx="15" cy="-5" rx={wide ? 7 : 5} ry={wide ? 9 : 7} />
          </>
        )}
      </g>
      <g data-face-element={face.browsId}>
        <path className="sound-seekers-character__face-line sound-seekers-character__brow" d="M -27 -19 Q -16 -25 -5 -19" />
        <path className="sound-seekers-character__face-line sound-seekers-character__brow" d="M 5 -19 Q 16 -25 27 -19" />
      </g>
      <g data-face-element={face.mouthId}>
        {openMouth ? (
          <ellipse className="sound-seekers-character__mouth-fill" cx="0" cy="19" rx="10" ry="12" />
        ) : (
          <path className="sound-seekers-character__face-line" d="M -13 15 Q 0 27 13 15" />
        )}
      </g>
    </>
  );
}

function HeadSilhouette({ artProfile }) {
  return (
    <g data-authored-silhouette="">
      {artProfile.silhouetteGeometry.accentPaths.map((path, index) => (
        <path
          key={path}
          className="sound-seekers-character__silhouette-accent"
          d={path}
          data-silhouette-part={`authored-outline-${index + 1}`}
        />
      ))}
      <path
        className="sound-seekers-character__head-fill"
        data-head-shape={artProfile.headShapeId}
        d={artProfile.silhouetteGeometry.headPath}
      />
      <path className="sound-seekers-character__head-highlight" d="M -30 -23 Q -4 -42 24 -26" />
    </g>
  );
}

function featureFamily(featureId) {
  const id = featureId.toLocaleLowerCase("en-US");
  if (/tail|wings/u.test(id)) return "silhouette";
  if (/ears|antennae|crest|crown|frill|fringe|tuft|spines|rays|beard/u.test(id)) return "headwear";
  if (/cheeks|freckles|whiskers|eye|brows|spots|scales/u.test(id)) return "face";
  if (/feet|boots|claws/u.test(id)) return "feet";
  if (/collar|apron|sash|band|belt/u.test(id)) return "garment";
  return "body-mark";
}

function FeatureMark({ featureId, index, transforms }) {
  const family = featureFamily(featureId);
  const seed = stableVisualSeed(featureId);
  const bend = 7 + (seed % 17);
  const offset = -18 + (Math.floor(seed / 31) % 37);

  if (family === "silhouette") {
    const isWing = /wing/u.test(featureId);
    return (
      <g data-feature-id={featureId} data-feature-family={family} transform={svgTransform(transforms.torso)}>
        <path
          className="sound-seekers-character__feature-fill"
          d={isWing
            ? `M -34 -19 Q -79 ${-55 + offset} -65 17 Q -48 ${34 + bend} -27 21 Z M 34 -19 Q 79 ${-55 - offset} 65 17 Q 48 ${34 + bend} 27 21 Z`
            : `M 35 12 Q ${77 + bend} ${-3 + offset} ${68 + bend} 37 Q ${58 + bend} 60 35 40 Z`}
        />
        <path className="sound-seekers-character__feature-line" d={isWing ? "M -54 -19 Q -48 2 -34 13 M 54 -19 Q 48 2 34 13" : `M 42 21 Q ${58 + bend} ${21 + offset} ${61 + bend} 39`} />
      </g>
    );
  }

  if (family === "headwear") {
    return (
      <g data-feature-id={featureId} data-feature-family={family} transform={svgTransform(transforms.head)}>
        <path className="sound-seekers-character__feature-accent" d={`M ${-29 + (index * 4)} -28 Q ${offset} ${-44 - bend} ${28 - (index * 4)} -27`} />
        <path className="sound-seekers-character__feature-line" d={`M ${-23 + (seed % 8)} -34 L ${-8 + (seed % 5)} -22 M ${9 - (seed % 5)} -22 L ${24 - (seed % 8)} -34`} />
      </g>
    );
  }

  if (family === "face") {
    return (
      <g data-feature-id={featureId} data-feature-family={family} transform={svgTransform(transforms.head)}>
        <path className="sound-seekers-character__feature-accent" d={`M -36 ${7 + (seed % 8)} Q -25 ${17 + bend} -11 ${12 + (seed % 6)} M 11 ${12 + (seed % 6)} Q 25 ${17 + bend} 36 ${7 + (seed % 8)}`} />
        <path className="sound-seekers-character__feature-line" d={`M -39 ${20 + (seed % 5)} L ${-52 - (seed % 7)} ${15 + offset / 6} M 39 ${20 + (seed % 5)} L ${52 + (seed % 7)} ${15 + offset / 6}`} />
      </g>
    );
  }

  if (family === "feet") {
    return (
      <g data-feature-id={featureId} data-feature-family={family} transform={`translate(${transforms.torso.x} ${transforms.torso.y + 103}) rotate(${transforms.torso.rotate})`}>
        <path className="sound-seekers-character__feature-fill" d={`M -47 4 Q -38 ${-11 - (seed % 8)} -15 2 L -17 16 L -51 16 Z M 15 2 Q 38 ${-11 - (seed % 8)} 47 4 L 51 16 L 17 16 Z`} />
        <path className="sound-seekers-character__feature-line" d="M -43 6 L -22 6 M 22 6 L 43 6" />
      </g>
    );
  }

  if (family === "garment") {
    return (
      <g data-feature-id={featureId} data-feature-family={family} transform={svgTransform(transforms.torso)}>
        <path className="sound-seekers-character__feature-fill" d={`M -38 ${-27 + (seed % 9)} Q 0 ${-6 - bend} 38 ${-27 + (seed % 9)} L 29 ${13 + (seed % 11)} Q 0 ${28 + bend} -29 ${13 + (seed % 11)} Z`} />
        <path className="sound-seekers-character__feature-line" d={`M -25 ${-13 + (seed % 7)} Q 0 ${3 + offset / 5} 25 ${-13 + (seed % 7)}`} />
      </g>
    );
  }

  return (
    <g data-feature-id={featureId} data-feature-family={family} transform={svgTransform(transforms.torso)}>
      <path className="sound-seekers-character__feature-accent" d={`M ${-31 + (seed % 11)} ${-28 + index * 17} Q ${offset} ${-39 + index * 17} ${31 - (seed % 11)} ${-28 + index * 17} Q ${offset / 2} ${-15 + bend + index * 12} ${-31 + (seed % 11)} ${-28 + index * 17} Z`} />
      <path className="sound-seekers-character__feature-line" d={`M ${-22 + (seed % 8)} ${-23 + index * 16} L ${20 - (seed % 7)} ${-23 + index * 16}`} />
    </g>
  );
}

function FeatureMarks({ featureIds, transforms }) {
  return featureIds.map((featureId, index) => (
    <FeatureMark key={featureId} featureId={featureId} index={index} transforms={transforms} />
  ));
}

function RoleProp({ rolePropId, anchor }) {
  const id = rolePropId.toLocaleLowerCase("en-US");
  const seed = stableVisualSeed(id);
  let body;
  let detail;
  let family;

  if (/lantern|lamp|light|chime/u.test(id)) {
    family = "light-tool";
    body = "M -19 -22 L 18 -22 L 25 20 L -25 20 Z M -12 -22 Q -12 -40 0 -40 Q 12 -40 12 -22";
    detail = "M -10 -10 L 10 -10 L 14 10 L -14 10 Z M -32 -2 L -25 -2 M 25 -2 L 32 -2";
  } else if (/compass|scope|dial|frame/u.test(id)) {
    family = "measuring-tool";
    body = "M 0 -31 A 30 30 0 1 0 1 -31";
    detail = "M -17 18 L 13 -15 L 6 9 Z M -23 0 L -30 0 M 23 0 L 30 0 M 0 -23 L 0 -30";
  } else if (/map|journal/u.test(id)) {
    family = "map-tool";
    body = "M -29 -25 L -8 -31 L 9 -24 L 29 -31 L 29 24 L 9 31 L -8 24 L -29 31 Z";
    detail = "M -8 -30 L -8 24 M 9 -24 L 9 31 M -22 -13 L -14 -5 L -23 4";
  } else if (/hammer|mallet/u.test(id)) {
    family = "striking-tool";
    body = "M -28 -30 L 21 -30 L 27 -12 L 7 -5 L 7 33 L -7 33 L -7 -5 L -28 -10 Z";
    detail = "M -19 -20 L 18 -20 M 0 -4 L 0 25";
  } else if (/drum/u.test(id)) {
    family = "music-tool";
    body = "M -28 -22 Q 0 -32 28 -22 L 23 24 Q 0 34 -23 24 Z";
    detail = "M -24 -18 L 22 20 M 24 -18 L -22 20 M 34 -30 L 17 -7";
  } else if (/rudder|baton|pennant|rope/u.test(id)) {
    family = "guiding-tool";
    body = "M -6 -35 L 7 -35 L 7 34 L -6 34 Z M 7 -31 L 31 -20 L 7 -7 Z";
    detail = "M 0 -27 L 0 28 M 12 -24 L 23 -20 L 12 -14";
  } else if (/satchel|cup/u.test(id)) {
    family = "carrying-tool";
    body = "M -27 -17 L 26 -17 L 22 29 L -22 29 Z M -17 -17 Q -16 -38 0 -38 Q 17 -38 17 -17";
    detail = "M -15 -3 L 15 -3 L 13 16 L -13 16 Z";
  } else if (/trowel|brush|fork|tongs|hook|spanner|key/u.test(id)) {
    family = "hand-tool";
    body = "M -7 -34 L 7 -34 L 7 11 L 18 25 L 0 36 L -18 25 L -7 11 Z";
    detail = /key/u.test(id)
      ? "M 0 -29 L 0 18 M 0 18 L 13 18 M 7 18 L 7 27"
      : `M 0 -27 L 0 18 M -13 ${17 + (seed % 7)} L 0 29 L 13 ${17 + (seed % 7)}`;
  } else {
    family = "field-tool";
    body = "M 0 -34 L 27 -8 L 18 28 L -18 28 L -27 -8 Z";
    detail = "M -14 -6 L 14 -6 M -10 8 L 10 8 M -5 21 L 5 21";
  }

  return (
    <g
      data-role-prop-id={rolePropId}
      data-role-prop-family={family}
      transform={`translate(${anchor.x} ${anchor.y}) rotate(${anchor.rotate})`}
    >
      <path className="sound-seekers-character__prop" d={body} />
      <path className="sound-seekers-character__prop-line" d={detail} />
      <path
        className="sound-seekers-character__prop-emblem"
        d={`M ${-13 + (seed % 7)} ${-1 + (Math.floor(seed / 17) % 9)} L ${-2 + (seed % 5)} ${8 + (seed % 6)} L ${9 + (seed % 8)} ${-4 + (Math.floor(seed / 29) % 8)}`}
      />
    </g>
  );
}

function Accessory({ accessoryId, slot, anchor }) {
  if (accessoryId === null) return null;
  const commonProps = { "data-accessory-id": accessoryId, transform: anchorTransform(anchor) };
  if (slot === "back") {
    return (
      <g {...commonProps}>
        <path className="sound-seekers-character__accessory" d="M -19 -25 Q -38 3 -22 40 L 18 32 Q 28 0 13 -29 Z" />
        <path className="sound-seekers-character__accessory-line" d="M -16 -12 L 13 -12" />
      </g>
    );
  }
  if (slot === "head") {
    return (
      <g {...commonProps}>
        <path className="sound-seekers-character__accessory" d="M -34 4 Q 0 -30 34 4 L 24 13 L -25 13 Z" />
        <circle className="sound-seekers-character__accessory-detail" cy="-7" r="7" />
      </g>
    );
  }
  if (slot === "neck") {
    return (
      <g {...commonProps}>
        <path className="sound-seekers-character__accessory" d="M -31 -5 Q 0 16 31 -5 L 21 19 L -7 10 L -24 23 Z" />
      </g>
    );
  }
  return (
    <g {...commonProps}>
      <rect className="sound-seekers-character__accessory" x="-15" y="-19" width="30" height="38" rx="5" />
      <path className="sound-seekers-character__accessory-line" d="M -9 -10 L 9 -10 M -9 -2 L 9 -2 M -9 6 L 4 6" />
    </g>
  );
}

function characterLabel(visual) {
  return visual.castKind === "player" ? "Your Sound Seeker" : visual.characterId;
}

const AUTHORED_CHARACTER_ASSETS = Object.freeze({
  muddy: "/game-assets/sound-seekers/avatars-v3/muddy.webp",
  pip: "/game-assets/sound-seekers/avatars-v3/pip.webp",
  chompy: "/game-assets/sound-seekers/avatars-v3/chompy.webp"
});

function authoredCharacterAsset(characterId, bodyShapeId) {
  if (characterId === "Bouncy") return AUTHORED_CHARACTER_ASSETS.muddy;
  if (characterId === "Moss") return AUTHORED_CHARACTER_ASSETS.pip;
  if (characterId === "Tumble") return AUTHORED_CHARACTER_ASSETS.chompy;
  if (bodyShapeId === "body-shape-pebble") return AUTHORED_CHARACTER_ASSETS.muddy;
  if (bodyShapeId === "body-shape-bell") return AUTHORED_CHARACTER_ASSETS.chompy;
  return AUTHORED_CHARACTER_ASSETS.pip;
}

export function SoundSeekersCharacter({ characterId, pose, appearance, renderMode = "illustrated" }) {
  const visual = VISUAL_BY_CHARACTER_ID.get(characterId);
  if (!visual) throw new TypeError(`Unknown Sound Seekers character: ${String(characterId)}`);
  const artProfile = resolveCharacterArtProfile(characterId);
  if (!artProfile) throw new TypeError(`Missing Sound Seekers character art profile: ${String(characterId)}`);

  const poseRenderer = resolvePoseRenderer(pose);
  if (!poseRenderer || visual.poseRendererIds[pose] !== poseRenderer.id) {
    throw new TypeError(`Unknown Sound Seekers character pose: ${String(pose)}`);
  }

  if (visual.castKind !== "player" && appearance !== undefined) {
    throw new TypeError("Character appearance customization is only available for the player");
  }

  const normalizedAppearance = visual.castKind === "player"
    ? createCharacterAppearance(appearance ?? DEFAULT_PLAYER_APPEARANCE)
    : null;
  const bodyShapeId = normalizedAppearance?.bodyShapeId ?? visual.bodyShapeId;
  const paletteTokenId = normalizedAppearance?.paletteTokenId ?? visual.paletteTokenId;
  const proportionId = normalizedAppearance
    ? resolveCharacterProportionId(bodyShapeId)
    : artProfile.proportionId;
  const proportionGeometry = resolveCharacterProportionGeometry(proportionId);
  if (!proportionGeometry) {
    throw new TypeError(`Missing Sound Seekers proportion geometry: ${String(proportionId)}`);
  }
  const accessories = normalizedAppearance?.accessories
    ?? DEFAULT_PLAYER_APPEARANCE.accessories;
  const { transforms, anchors, face, reducedReplacement } = poseRenderer;
  const style = {
    ...TOKEN_STYLE,
    "--ss-character-palette": `var(--ss-token-${paletteTokenId})`
  };

  return (
    <figure
      className={`sound-seekers-character sound-seekers-character--${pose}`}
      role="img"
      aria-label={characterLabel(visual)}
      style={style}
      data-sound-seekers-character=""
      data-character-id={visual.characterId}
      data-character-kind={visual.castKind}
      data-silhouette-family={artProfile.silhouetteFamilyId}
      data-character-proportion={proportionId}
      data-character-material={artProfile.materialId}
      data-pose-id={poseRenderer.poseId}
      data-pose-renderer-id={poseRenderer.id}
      data-pose-composition-signature={poseCompositionSignature(poseRenderer)}
      data-character-visual-signature={characterVisualSignature(visual)}
      data-art-mode={renderMode}
      data-appearance-signature={normalizedAppearance
        ? appearanceSignature(normalizedAppearance)
        : undefined}
      data-full-motion-id={poseRenderer.fullMotionId}
      data-reduced-transition={reducedReplacement.transition}
      data-reduced-final-pose={reducedReplacement.finalPoseId}
      data-reduced-continuous={String(reducedReplacement.continuous)}
    >
      {renderMode === "authored" ? (
        <img
          className="sound-seekers-character__authored-art"
          src={authoredCharacterAsset(characterId, bodyShapeId)}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      ) : null}
      {renderMode === "illustrated" ? <svg className="sound-seekers-character__canvas" viewBox="0 0 240 320" aria-hidden="true" focusable="false">
        <g
          className="sound-seekers-character__pose"
          data-pose-structure={poseRenderer.id}
          data-proportion-renderer=""
          transform={`translate(${proportionGeometry.transformOrigin.join(" ")}) scale(${proportionGeometry.scaleX} ${proportionGeometry.scaleY}) translate(${-proportionGeometry.transformOrigin[0]} ${-proportionGeometry.transformOrigin[1]})`}
        >
          <g data-character-part="back-accessory">
            <Accessory accessoryId={accessories.back} slot="back" anchor={anchors.back} />
          </g>
          <g data-character-part="contact-shadow" transform={`translate(${anchors.contact.x} ${anchors.contact.y})`}>
            <ellipse className="sound-seekers-character__shadow" rx="43" ry="11" />
          </g>
          <g data-character-part="left-leg">
            <Leg side="left" transform={transforms.leftLeg} torso={transforms.torso} limbShapeId={artProfile.limbShapeId} />
          </g>
          <g data-character-part="right-leg">
            <Leg side="right" transform={transforms.rightLeg} torso={transforms.torso} limbShapeId={artProfile.limbShapeId} />
          </g>
          <g data-character-part="torso" data-body-shape-id={bodyShapeId} transform={svgTransform(transforms.torso)}>
            <BodyShape bodyShapeId={bodyShapeId} />
            <MaterialMarks materialId={artProfile.materialId} />
            <path className="sound-seekers-character__belly-mark" d="M -25 20 Q 0 42 25 20" />
          </g>
          <g data-character-part="left-arm">
            <Arm side="left" transform={transforms.leftArm} torso={transforms.torso} limbShapeId={artProfile.limbShapeId} />
          </g>
          <g data-character-part="right-arm">
            <Arm side="right" transform={transforms.rightArm} torso={transforms.torso} limbShapeId={artProfile.limbShapeId} />
          </g>
          <g data-character-part="head" transform={svgTransform(transforms.head)}>
            <HeadSilhouette artProfile={artProfile} />
          </g>
          <g data-character-part="face" transform={svgTransform(transforms.head)}>
            <Face face={face} />
          </g>
          <g data-character-part="features">
            <FeatureMarks featureIds={visual.featureIds} transforms={transforms} />
          </g>
          <g data-character-part="role-prop">
            <RoleProp rolePropId={visual.rolePropId} anchor={anchors.held} />
          </g>
          <g data-character-part="neck-accessory">
            <Accessory accessoryId={accessories.neck} slot="neck" anchor={anchors.neck} />
          </g>
          <g data-character-part="head-accessory">
            <Accessory accessoryId={accessories.head} slot="head" anchor={anchors.head} />
          </g>
          <g data-character-part="held-accessory">
            <Accessory accessoryId={accessories.held} slot="held" anchor={anchors.held} />
          </g>
        </g>
      </svg> : null}
    </figure>
  );
}
