import { getMeaningSupport } from "../content/meaningSupport.js";
import { resolveMeaningVisual } from "../visual/sceneVisualCatalog.js";

const VISUAL_KEYS = Object.freeze([
  "semanticId", "wordId", "rendererKind", "shapeFamilyId", "actionPoseId", "accessibleLabel"
]);

function exactRecord(value, keys) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}

function canonicalPayoff(support, visual) {
  const canonicalSupport = getMeaningSupport(support?.wordId);
  if (!canonicalSupport || support !== canonicalSupport) return null;
  const canonicalVisual = resolveMeaningVisual(canonicalSupport.visualSemanticId);
  if (!canonicalVisual || !exactRecord(visual, VISUAL_KEYS)
    || visual !== canonicalVisual
    || visual.wordId !== support.wordId
    || visual.rendererKind !== "code-native-svg") return null;
  return { support: canonicalSupport, visual: canonicalVisual };
}

function semanticGeometry(shapeFamilyId) {
  const id = shapeFamilyId.toLocaleLowerCase("en-US");
  if (/animal|bird|cat|frog|whisker|wing/u.test(id)) {
    return { id: "living-creature", shape: "M 18 77 Q 18 36 58 30 Q 99 34 102 75 Q 86 103 56 101 Q 27 101 18 77 Z M 29 40 L 19 15 L 44 32 M 83 33 L 103 13 L 94 45", mark: "M 39 63 A 5 7 0 1 0 40 63 M 76 63 A 5 7 0 1 0 77 63 M 49 82 Q 60 91 72 82" };
  }
  if (/water.*(?:travel|vessel)|vessel/u.test(id)) {
    return { id: "water-vessel", shape: "M 12 67 L 108 67 L 91 92 L 29 92 Z M 39 65 L 58 31 L 58 65 M 61 35 L 92 59 L 61 59 Z", mark: "M 16 101 Q 36 90 56 101 Q 76 112 105 99" };
  }
  if (/vehicle|bike|car|travel|wheel|train|truck/u.test(id)) {
    return { id: "travel-machine", shape: "M 14 78 L 30 47 L 82 42 L 106 73 L 101 87 L 18 87 Z M 29 91 A 13 13 0 1 0 30 91 M 85 91 A 13 13 0 1 0 86 91", mark: "M 38 48 L 49 28 L 75 28 L 86 43 M 15 76 L 106 76" };
  }
  if (/page|book|read|story|writing|fiction|theme/u.test(id)) {
    return { id: "open-pages", shape: "M 12 27 Q 36 16 58 31 L 58 101 Q 37 86 12 94 Z M 62 31 Q 84 16 108 27 L 108 94 Q 83 86 62 101 Z", mark: "M 23 43 L 48 47 M 23 57 L 48 61 M 72 47 L 98 43 M 72 61 L 98 57" };
  }
  if (/container|box|cup|cube|bowl|square-faced-solid/u.test(id)) {
    return { id: "container", shape: "M 20 37 L 92 37 L 104 98 L 15 98 Z M 28 37 Q 29 16 49 16 L 67 16 Q 88 16 88 37", mark: "M 34 56 L 84 56 M 40 72 L 79 72" };
  }
  if (/food|bread|bun|cake|jam/u.test(id)) {
    return { id: "food", shape: "M 16 87 Q 21 42 58 39 Q 99 42 104 87 Q 62 105 16 87 Z M 25 55 Q 58 25 95 55", mark: "M 38 61 L 41 72 M 58 55 L 59 68 M 78 61 L 75 72" };
  }
  if (/sound|hear|buzz|drum|clap|rhythm/u.test(id)) {
    return { id: "sound-wave", shape: "M 13 48 L 35 48 L 60 26 L 60 94 L 35 72 L 13 72 Z", mark: "M 72 46 Q 91 60 72 75 M 84 33 Q 115 60 84 87" };
  }
  if (/moon|night|dark-time|light|bright|sun|star/u.test(id)) {
    return { id: "sky-light", shape: "M 60 10 L 70 37 L 99 29 L 82 54 L 108 70 L 77 71 L 77 103 L 59 79 L 37 103 L 42 72 L 11 68 L 38 52 L 21 28 L 51 37 Z", mark: "M 60 42 A 19 19 0 1 0 61 42" };
  }
  if (/rain|storm|weather|cloud|temperature|hot/u.test(id)) {
    return { id: "weather", shape: "M 17 54 Q 22 31 44 34 Q 55 10 78 27 Q 105 25 108 56 Q 99 70 79 69 L 32 69 Q 20 68 17 54 Z", mark: /hot|temperature/u.test(id) ? "M 39 83 Q 48 72 57 83 Q 67 94 76 83 Q 86 72 96 83" : "M 38 78 L 30 100 M 62 78 L 54 100 M 87 78 L 79 100" };
  }
  if (/money|coin/u.test(id)) return { id: "coin", shape: "M 60 13 A 48 48 0 1 0 61 13", mark: "M 60 28 L 60 88 M 43 40 Q 60 27 78 40 M 42 76 Q 60 89 79 75" };
  if (/rock|stone|boulder|pebble/u.test(id)) return { id: "stone", shape: "M 12 84 L 26 42 L 55 19 L 91 33 L 108 74 L 89 102 L 36 104 Z", mark: "M 31 69 L 49 45 L 76 51 M 67 83 L 93 70" };
  if (/tree|plant|trunk|branch|leaf|grow|bigger|taller/u.test(id)) return { id: "tree", shape: "M 49 103 L 54 68 Q 21 70 25 46 Q 27 28 48 30 Q 57 7 76 24 Q 99 21 104 45 Q 111 69 77 70 L 82 103 Z", mark: "M 60 95 L 65 45 M 64 62 L 44 47 M 65 56 L 84 39" };
  if (/meaning-(?:flat|small-width|thin)|ground-cover/u.test(id)) return { id: "flat-form", shape: "M 12 61 L 88 28 L 108 58 L 32 96 Z", mark: "M 31 62 L 80 41 M 43 79 L 93 58" };
  if (/pure|drop|not-mixed/u.test(id)) return { id: "clear-drop", shape: "M 60 10 Q 101 58 101 78 Q 99 108 60 109 Q 21 108 19 78 Q 19 58 60 10 Z", mark: "M 40 78 Q 43 96 60 97 M 50 52 Q 60 36 70 52" };
  if (/little|small-size|small-amount/u.test(id)) return { id: "small-scale", shape: "M 18 25 L 103 25 L 103 103 L 18 103 Z", mark: "M 47 54 L 74 54 L 74 79 L 47 79 Z M 28 38 L 92 38" };
  if (/place|home|city|building|seat|chair/u.test(id)) return { id: "place", shape: "M 12 58 L 60 18 L 108 58 L 99 103 L 21 103 Z", mark: "M 47 103 L 47 68 L 73 68 L 73 103 M 28 55 L 28 35 M 91 55 L 91 35" };
  if (/position|between|gap|path|gate|clear|open|near|beside|distance-away/u.test(id)) return { id: "space-and-path", shape: "M 13 19 L 43 19 L 43 104 L 13 104 Z M 77 19 L 107 19 L 107 104 L 77 104 Z", mark: "M 47 61 L 72 61 M 63 51 L 74 61 L 63 71" };
  if (/person|hand|finger|arm-end|doing|action|striking|move|turn|rotate|make-something-begin|sit|aim|notice|see|point|spin|lift/u.test(id)) return { id: "person-action", shape: "M 60 14 A 17 17 0 1 0 61 14 M 34 100 L 43 55 L 77 55 L 88 100 M 43 61 L 18 82 M 77 61 L 104 39", mark: "M 99 27 L 107 38 L 95 44" };
  if (/something-being-named/u.test(id)) return { id: "named-object", shape: "M 60 13 L 106 44 L 89 101 L 31 101 L 14 44 Z", mark: "M 34 57 Q 60 37 86 57 M 38 77 L 82 77" };
  return null;
}

function actionGeometry(wordId) {
  if (/^(?:bike|boat|car|ship|spin|train|truck|turn)$/u.test(wordId)) return { id: "move", path: "M 114 82 Q 139 42 164 78 M 146 72 L 165 79 L 159 59" };
  if (/^(?:buzz|clap|drum|hear|sound)$/u.test(wordId)) return { id: "sound", path: "M 128 53 Q 149 65 128 79 M 141 40 Q 174 65 141 92" };
  if (/^(?:grow|lift|start)$/u.test(wordId)) return { id: "rise", path: "M 139 105 L 139 42 M 119 63 L 139 41 L 159 63" };
  if (/^(?:clear|gap|gate|near|by)$/u.test(wordId)) return { id: "place", path: "M 116 43 L 116 89 M 163 43 L 163 89 M 125 66 L 154 66 M 145 56 L 155 66 L 145 76" };
  if (/^(?:book|fiction|light|moon|night|point|see|theme)$/u.test(wordId)) return { id: "notice", path: "M 112 66 Q 139 39 166 66 Q 139 93 112 66 Z M 139 55 A 11 11 0 1 0 140 55" };
  if (/^(?:action|bird|box|bun|cake|cat|cats|chair|city|coin|cube|cup|frog|hand|home|hot|jam|little|mat|pure|rain|rock|sit|stone|storm|thin|thing|tree)$/u.test(wordId)) return { id: "show", path: "M 113 81 Q 139 42 165 81 M 145 72 L 165 82 L 160 60" };
  return null;
}

function MeaningIllustration({ visual, reducedMotion }) {
  const geometry = semanticGeometry(visual.shapeFamilyId);
  const action = actionGeometry(visual.wordId);
  if (!geometry || !action) return null;
  return (
    <figure
      className="ss-meaning-payoff__visual"
      role="img"
      aria-label={visual.accessibleLabel}
      data-meaning-geometry={geometry.id}
      data-meaning-action={action.id}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <svg viewBox="0 0 180 130" aria-hidden="true" focusable="false">
        <g transform="translate(17 4)">
          <path className="ss-meaning-payoff__shape" d={geometry.shape} />
          <path className="ss-meaning-payoff__mark" d={geometry.mark} />
        </g>
        <path className="ss-meaning-payoff__action-mark" d={action.path} />
      </svg>
    </figure>
  );
}

export default function MeaningPayoff({ support, visual, reducedMotion = false, onReplay }) {
  const payoff = canonicalPayoff(support, visual);
  if (!payoff || !semanticGeometry(payoff.visual.shapeFamilyId) || !actionGeometry(payoff.visual.wordId)) return null;
  return (
    <aside className="ss-meaning-payoff" aria-labelledby="ss-meaning-payoff-title" data-motion={reducedMotion ? "reduced" : "full"}>
      <MeaningIllustration visual={payoff.visual} reducedMotion={reducedMotion} />
      <div className="ss-meaning-payoff__copy">
        <p className="ss-meaning-payoff__eyebrow">Word discovery</p>
        <h3 id="ss-meaning-payoff-title">{payoff.support.wordId}</h3>
        <p className="ss-meaning-payoff__definition">{payoff.support.childDefinition}</p>
        <p className="ss-meaning-payoff__action">{payoff.support.actionPrompt}</p>
        <button className="ss-workbench__control ss-meaning-payoff__replay" type="button" aria-label="Hear the meaning again" onClick={() => onReplay?.()}>
          <span className="ss-workbench__speaker" aria-hidden="true">▶</span>
          <span>Hear meaning</span>
        </button>
      </div>
    </aside>
  );
}
