import { useState } from "react";
import { getBiomeKit } from "../content/biomeKits.js";
import {
  createBackgroundImageState,
  reduceBackgroundImageState
} from "./backgroundImageState.js";
import { resolveSceneVisualPresentation } from "./sceneVisualCatalog.js";
import { LayeredBiome } from "./LayeredBiome.jsx";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";
import "./visual-system.css";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));

function stableGlyphSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const COMPOSITION_MODES = new Set(["ordinary", "wonder", "boss-resolved"]);

function compositionSignature(scenePresentation, compositionMode) {
  const seed = stableGlyphSeed([
    scenePresentation.chapterId,
    scenePresentation.sceneId,
    scenePresentation.visualStateId,
    scenePresentation.scenePhase,
    compositionMode
  ].join(":"));
  return `world-composition:${seed.toString(16).padStart(8, "0")}`;
}

function optionPropGeometry(semanticId) {
  const id = semanticId.toLocaleLowerCase("en-US");
  const seed = stableGlyphSeed(id);
  const unique = {
    x: 18 + (seed % 84),
    y: 17 + (Math.floor(seed / 89) % 64),
    radius: 2 + (Math.floor(seed / 7921) % 4)
  };
  if (/(?:^|-)mats?(?:-|$)/u.test(id)) {
    return {
      id: id.includes("-mats-") ? "two-flat-mats" : "one-flat-mat",
      shape: id.includes("-mats-")
        ? "M 12 60 L 77 60 L 91 78 L 25 78 Z M 24 35 L 89 35 L 103 53 L 37 53 Z"
        : "M 15 46 L 88 46 L 104 75 L 30 75 Z",
      mark: "M 31 57 L 84 57",
      unique
    };
  }
  if (/light|lamp|flame|star|bright|sun|moon/u.test(id)) {
    return {
      id: "light-source",
      shape: "M 60 11 L 70 37 L 98 29 L 82 54 L 106 70 L 76 71 L 76 100 L 59 78 L 38 101 L 42 72 L 13 68 L 38 52 L 23 28 L 51 37 Z",
      mark: "M 60 43 A 17 17 0 1 0 61 43",
      unique
    };
  }
  if (/rock|stone|coin|bun|cake|food/u.test(id)) {
    return {
      id: "solid-object",
      shape: "M 15 75 Q 22 34 58 28 Q 97 33 106 72 Q 87 96 52 96 Q 25 94 15 75 Z",
      mark: "M 35 57 Q 58 43 82 58",
      unique
    };
  }
  if (/cat|frog|bird|dog|goat|mule|creature|fish/u.test(id)) {
    return {
      id: "creature",
      shape: "M 17 76 Q 17 35 58 31 Q 101 34 103 75 Q 88 98 59 98 Q 29 98 17 76 Z M 29 41 L 19 17 L 44 33 M 84 34 L 103 16 L 95 46",
      mark: "M 39 62 A 4 6 0 1 0 40 62 M 76 62 A 4 6 0 1 0 77 62 M 50 80 Q 60 89 71 80",
      unique
    };
  }
  if (/bike|car|truck|train|boat|ship|van/u.test(id)) {
    return {
      id: "transport",
      shape: "M 13 76 L 29 47 L 81 41 L 107 71 L 101 84 L 18 84 Z M 29 87 A 12 12 0 1 0 30 87 M 86 87 A 12 12 0 1 0 87 87",
      mark: "M 39 47 L 49 28 L 74 28 L 85 42",
      unique
    };
  }
  if (/book|fiction|words|puzzle|table/u.test(id)) {
    return {
      id: "pages-and-symbols",
      shape: "M 10 29 Q 34 18 57 32 L 57 98 Q 35 84 10 92 Z M 63 32 Q 85 18 109 29 L 109 92 Q 84 84 63 98 Z",
      mark: "M 22 48 L 47 52 M 22 63 L 47 67 M 73 52 L 99 48 M 73 67 L 99 63",
      unique
    };
  }
  if (/gate|lock|box|cup|cube|chair|home|city/u.test(id)) {
    return {
      id: "built-object",
      shape: "M 16 35 L 102 35 L 102 98 L 16 98 Z M 31 35 Q 31 14 51 14 L 68 14 Q 89 14 89 35",
      mark: "M 39 55 L 82 55 M 47 72 L 75 72",
      unique
    };
  }
  if (/rope|net|hair|fern|tree|fin|flag|coat/u.test(id)) {
    return {
      id: "flexible-object",
      shape: "M 18 91 Q 27 29 59 24 Q 94 34 104 91 Q 76 76 61 99 Q 43 76 18 91 Z",
      mark: "M 31 77 Q 59 47 91 77 M 39 60 Q 60 38 82 60",
      unique
    };
  }
  return {
    id: `peer-object-${seed % 4}`,
    shape: [
      "M 60 13 L 105 43 L 89 98 L 31 98 L 15 43 Z",
      "M 17 89 Q 12 37 58 19 Q 106 36 102 89 Q 59 106 17 89 Z",
      "M 18 25 L 102 25 L 102 97 L 18 97 Z",
      "M 60 12 L 108 60 L 60 108 L 12 60 Z"
    ][seed % 4],
    mark: "M 35 57 Q 60 39 85 57 M 39 76 L 81 76",
    unique
  };
}

function optionActionGeometry(actionSemanticId) {
  const id = actionSemanticId.toLocaleLowerCase("en-US");
  if (/lift|pick|climb|grow|start/u.test(id)) {
    return { id: "move-up", path: "M 60 88 L 60 25 M 37 48 L 60 24 L 83 48" };
  }
  if (/sit|place|put|drop|park|hide|rest|leave/u.test(id)) {
    return { id: "settle-down", path: "M 60 22 L 60 84 M 37 61 L 60 85 L 83 61" };
  }
  if (/hear|sing|clap|bang|sound|click/u.test(id)) {
    return { id: "make-or-notice-sound", path: "M 31 39 L 47 39 L 62 26 L 62 74 L 47 61 L 31 61 M 73 38 Q 90 50 73 63 M 84 28 Q 108 50 84 74" };
  }
  if (/fix|fit|join|glue|pair|hook|close/u.test(id)) {
    return { id: "join-parts", path: "M 28 50 L 51 50 M 69 50 L 92 50 M 45 34 L 60 50 L 45 66 M 75 34 L 60 50 L 75 66" };
  }
  if (/cut|open|flip|draw|saw/u.test(id)) {
    return { id: "change-shape", path: "M 29 31 L 91 71 M 29 71 L 91 31 M 23 50 L 97 50" };
  }
  if (/ride|slide|kick|follow|fly|show|look|read/u.test(id)) {
    return { id: "move-across", path: "M 22 50 L 96 50 M 72 27 L 97 50 L 72 73" };
  }
  return { id: "act-on-object", path: "M 24 67 Q 59 22 96 66 M 77 59 L 96 67 L 91 47" };
}

function comparisonFrameGeometry(shapeFamilyId) {
  const id = shapeFamilyId.toLocaleLowerCase("en-US");
  if (id.includes("story-paths")) {
    return {
      id: "story-path-choice",
      path: "M 7 94 Q 35 66 61 69 Q 88 72 101 52 Q 118 25 145 27 Q 160 28 173 14 M 101 52 Q 128 69 170 76"
    };
  }
  return {
    id: "repair-action-choice",
    path: "M 7 90 Q 32 72 51 75 Q 75 79 90 59 Q 109 35 134 39 Q 155 43 173 17"
  };
}

function OptionGlyph({ option }) {
  const action = optionActionGeometry(option.visual.actionSemanticId);
  const frame = comparisonFrameGeometry(option.visual.shapeFamilyId);
  return (
    <svg className="sound-seekers-scene__option-glyph" viewBox="0 0 180 104" aria-hidden="true" focusable="false">
      <path
        className="sound-seekers-scene__comparison-frame"
        d={frame.path}
        data-comparison-geometry={frame.id}
      />
      <g data-option-props="">
        {option.visual.propSemanticIds.map((semanticId, index) => (
          <OptionPropGlyph key={semanticId} semanticId={semanticId} index={index} />
        ))}
      </g>
      <g
        className="sound-seekers-scene__option-action"
        data-option-action={option.visual.actionSemanticId}
        data-action-geometry={action.id}
        transform="translate(104 2) scale(0.72)"
      >
        <path d={action.path} />
      </g>
    </svg>
  );
}

function OptionPropGlyph({ semanticId, index }) {
  const geometry = optionPropGeometry(semanticId);
  return (
    <g
      data-option-prop={semanticId}
      data-option-geometry={geometry.id}
      transform={`translate(${2 + (index * 34)} 4) scale(0.78)`}
    >
      <path className="sound-seekers-scene__option-prop-shape" d={geometry.shape} />
      <path className="sound-seekers-scene__option-prop-mark" d={geometry.mark} />
      <circle
        className="sound-seekers-scene__option-unique-mark"
        cx={geometry.unique.x}
        cy={geometry.unique.y}
        r={geometry.unique.radius}
      />
    </g>
  );
}

function SceneVisualWithBackground({
  childScene,
  scenePresentation,
  kit,
  activeAttemptId,
  reducerRevision,
  sceneAccess,
  cropProfile,
  densityProfile,
  motionProfile,
  compositionMode,
  onChoose
}) {
  const [backgroundImageState, setBackgroundImageState] = useState(
    () => createBackgroundImageState(kit.background.src)
  );

  const updateBackground = type => {
    setBackgroundImageState(previous => reduceBackgroundImageState(
      previous,
      { type, src: kit.background.src }
    ));
  };
  const chooseOption = token => {
    onChoose(token);
  };
  const controlStateFor = option => {
    if (scenePresentation.selectedOptionVisualId !== option.visualSemanticId) return "idle";
    return scenePresentation.scenePhase === "action" ? "selected" : "settled";
  };

  return (
    <section
      className="sound-seekers-scene"
      aria-label="Sound Seekers story choice"
      style={{
        ...TOKEN_STYLE,
        "--ss-world-palette": `var(--ss-token-${kit.paletteTokenId})`,
        "--ss-world-light": `var(--ss-token-${kit.lightingTokenId})`
      }}
      data-sound-seekers-scene=""
      data-scene-id={scenePresentation.sceneId}
      data-chapter-id={scenePresentation.chapterId}
      data-scene-phase={scenePresentation.scenePhase}
      data-visual-state-id={scenePresentation.visualStateId}
      data-composition-mode={compositionMode}
    >
      <div className="sound-seekers-scene__story">
        <p className="sound-seekers-scene__text" data-scene-text="">{childScene.text}</p>
        <h2 className="sound-seekers-scene__prompt" data-scene-prompt="">{childScene.prompt.text}</h2>
      </div>
      <div className="sound-seekers-scene__world-wrap">
        <LayeredBiome
          kit={kit}
          scenePresentation={scenePresentation}
          activeAttemptId={activeAttemptId}
          reducerRevision={reducerRevision}
          sceneAccess={sceneAccess}
          cropProfile={cropProfile}
          densityProfile={densityProfile}
          motionProfile={motionProfile}
          compositionMode={compositionMode}
          compositionSignature={compositionSignature(scenePresentation, compositionMode)}
          backgroundImageState={backgroundImageState}
          onBackgroundLoad={() => updateBackground("loaded")}
          onBackgroundError={() => updateBackground("failed")}
        />
      </div>
      <div className="sound-seekers-scene__options" role="group" aria-label={childScene.prompt.text}>
        {scenePresentation.options.map(option => (
          <button
            key={option.visualSemanticId}
            className="sound-seekers-scene__option"
            type="button"
            aria-label={option.accessibleLabel}
            data-option-visual-id={option.visualSemanticId}
            data-choice-frame={option.visual.frameSemanticId}
            data-option-token={option.token}
            data-min-css-px={String(option.affordance.minCssPx)}
            data-emphasis-rank={String(option.affordance.emphasisRank)}
            data-control-state={controlStateFor(option)}
            onClick={() => chooseOption(option.token)}
          >
            <OptionGlyph option={option} />
            <span>{option.childLabel}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function SceneVisual({
  childScene,
  activeAttemptId = null,
  reducerRevision = null,
  sceneAccess = null,
  cropProfile,
  densityProfile,
  motionProfile,
  compositionMode = "ordinary",
  onChoose
}) {
  if (typeof onChoose !== "function") {
    throw new TypeError("Sound Seekers scene onChoose must be a function");
  }
  if (!COMPOSITION_MODES.has(compositionMode)) {
    throw new TypeError(`Unknown Sound Seekers composition mode: ${String(compositionMode)}`);
  }
  const scenePresentation = resolveSceneVisualPresentation(childScene, {
    activeAttemptId,
    reducerRevision,
    sceneAccess
  });
  const kit = getBiomeKit(scenePresentation.kitId);
  if (!kit) throw new TypeError(`Unknown Sound Seekers biome kit: ${scenePresentation.kitId}`);

  return (
    <SceneVisualWithBackground
      key={kit.background.src}
      childScene={childScene}
      scenePresentation={scenePresentation}
      kit={kit}
      activeAttemptId={activeAttemptId}
      reducerRevision={reducerRevision}
      sceneAccess={sceneAccess}
      cropProfile={cropProfile}
      densityProfile={densityProfile}
      motionProfile={motionProfile}
      compositionMode={compositionMode}
      onChoose={onChoose}
    />
  );
}
