import { getBiomeKit } from "../content/biomeKits.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_ROUTE_SPECS,
  computeBackgroundCrop
} from "./sceneVisualCatalog.js";
import { SoundSeekersCharacter } from "./CharacterSystem.jsx";
import { Landmark } from "./Landmark.jsx";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";
import "./visual-system.css";

const CROP_PROFILES = new Set(["landscape", "tablet", "portrait"]);
const DENSITY_PROFILES = new Set(["full", "simplified"]);
const MOTION_PROFILES = new Set(["full", "reduced"]);
const PLANES = ["background", "midground", "route", "foreground", "interaction", "effects"];

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));

function requireProfile(value, allowed, name) {
  if (!allowed.has(value)) throw new TypeError(`Unknown Sound Seekers ${name}: ${String(value)}`);
}

function requireBackgroundState(state, src) {
  const keys = state && typeof state === "object" ? Reflect.ownKeys(state) : [];
  const descriptors = state && typeof state === "object"
    ? Object.getOwnPropertyDescriptors(state)
    : {};
  const expectedKeys = ["src", "status", "revision"];
  if (keys.length !== expectedKeys.length
    || keys.some(key => typeof key !== "string" || !expectedKeys.includes(key))
    || expectedKeys.some(key => !Object.hasOwn(descriptors[key], "value")
      || !descriptors[key].enumerable)
    || state.src !== src || !["pending", "loaded", "failed"].includes(state.status)
    || !Number.isSafeInteger(state.revision) || state.revision < 0) {
    throw new TypeError("Layered biome background state is invalid");
  }
}

const SETTING_GEOMETRY = Object.freeze({
  "seedwake-meadow": Object.freeze({
    distant: "M 0 258 Q 92 130 174 225 Q 267 72 371 221 Q 475 105 565 220 Q 674 116 800 248 L 800 330 L 0 330 Z",
    near: "M 0 280 Q 130 213 248 276 Q 386 194 526 274 Q 675 203 800 278 L 800 330 L 0 330 Z"
  }),
  "river-gardens": Object.freeze({
    distant: "M 0 238 Q 115 196 224 221 T 445 215 T 663 221 T 800 207 L 800 330 L 0 330 Z",
    near: "M 0 272 Q 102 246 203 273 T 405 267 T 607 273 T 800 259 L 800 330 L 0 330 Z"
  }),
  "fossil-canyon": Object.freeze({
    distant: "M 0 172 L 96 172 L 135 92 L 249 92 L 282 203 L 431 203 L 476 73 L 612 73 L 657 190 L 800 190 L 800 330 L 0 330 Z",
    near: "M 0 274 L 142 238 L 267 274 L 402 224 L 551 276 L 690 229 L 800 258 L 800 330 L 0 330 Z"
  }),
  "forge-settlement": Object.freeze({
    distant: "M 0 258 L 73 258 L 73 132 L 127 132 L 127 219 L 207 219 L 207 94 L 271 94 L 271 229 L 369 229 L 369 145 L 445 145 L 445 221 L 546 221 L 546 79 L 611 79 L 611 217 L 705 217 L 705 123 L 770 123 L 800 258 L 800 330 L 0 330 Z",
    near: "M 0 280 L 164 236 L 302 275 L 442 230 L 591 275 L 718 238 L 800 265 L 800 330 L 0 330 Z"
  }),
  "glass-marsh": Object.freeze({
    distant: "M 0 255 Q 117 201 218 250 Q 350 191 465 248 Q 601 183 800 249 L 800 330 L 0 330 Z",
    near: "M 0 277 Q 97 239 194 277 Q 302 225 416 276 Q 534 226 648 276 Q 727 245 800 269 L 800 330 L 0 330 Z"
  }),
  "storm-coast": Object.freeze({
    distant: "M 0 225 L 115 155 L 202 188 L 306 93 L 389 205 L 504 148 L 590 203 L 696 106 L 800 179 L 800 330 L 0 330 Z",
    near: "M 0 277 L 127 251 L 247 280 L 382 238 L 519 279 L 652 231 L 800 268 L 800 330 L 0 330 Z"
  }),
  "lantern-forest": Object.freeze({
    distant: "M 0 257 L 63 257 L 79 65 L 126 65 L 144 257 L 276 257 L 291 26 L 344 26 L 361 257 L 514 257 L 532 79 L 579 79 L 595 257 L 699 257 L 718 43 L 767 43 L 782 257 L 800 257 L 800 330 L 0 330 Z",
    near: "M 0 278 Q 111 222 221 275 Q 335 218 447 275 Q 557 220 671 275 Q 736 245 800 268 L 800 330 L 0 330 Z"
  }),
  "star-reach": Object.freeze({
    distant: "M 0 258 L 91 258 L 91 219 L 177 219 L 177 178 L 274 178 L 274 137 L 369 137 L 369 96 L 464 96 L 464 137 L 561 137 L 561 178 L 656 178 L 656 219 L 747 219 L 747 258 L 800 258 L 800 330 L 0 330 Z",
    near: "M 0 282 L 131 247 L 266 281 L 401 238 L 538 281 L 670 246 L 800 275 L 800 330 L 0 330 Z"
  })
});

function SettingMarks({ kitId }) {
  if (kitId === "river-gardens" || kitId === "glass-marsh") {
    return <path d="M 95 205 Q 138 176 181 205 M 596 191 Q 646 155 696 191 M 242 239 Q 295 208 348 239" />;
  }
  if (kitId === "fossil-canyon" || kitId === "storm-coast") {
    return <path d="M 102 217 L 142 165 L 181 217 M 590 211 L 641 147 L 692 211 M 337 226 L 370 184 L 404 226" />;
  }
  if (kitId === "forge-settlement") {
    return <path d="M 97 132 L 97 82 M 238 94 L 238 49 M 578 79 L 578 31 M 738 123 L 738 70" />;
  }
  if (kitId === "lantern-forest") {
    return <path d="M 103 97 Q 184 142 318 83 Q 447 137 555 109 Q 654 83 742 119 M 191 119 L 191 165 M 454 119 L 454 168 M 653 99 L 653 148" />;
  }
  if (kitId === "star-reach") {
    return <path d="M 104 118 L 112 137 L 133 139 L 117 153 L 122 174 L 104 163 L 85 174 L 90 153 L 74 139 L 96 137 Z M 671 87 L 677 102 L 694 104 L 681 115 L 685 132 L 671 123 L 656 132 L 660 115 L 648 104 L 665 102 Z" />;
  }
  return <path d="M 138 210 L 138 164 M 113 188 L 163 188 M 646 198 L 646 151 M 620 177 L 672 177" />;
}

function CodeNativeSetting({ visual, kit }) {
  const geometry = SETTING_GEOMETRY[kit.id];
  return (
    <figure
      className="sound-seekers-world__setting"
      role="img"
      aria-label={visual.accessibleLabel}
      data-code-native-setting=""
      data-semantic-id={visual.id}
      data-shape-family={visual.shapeFamilyId}
      data-pattern-id={visual.patternId}
    >
      <svg viewBox="0 0 800 330" aria-hidden="true" focusable="false">
        <path className="sound-seekers-world__distant-shape" d={geometry.distant} />
        <path className="sound-seekers-world__near-shape" d={geometry.near} />
        <g
          className="sound-seekers-world__setting-marks"
          data-prop-family={kit.propFamilyId}
          data-setting-structure={kit.id}
        >
          <SettingMarks kitId={kit.id} />
        </g>
      </svg>
      <figcaption className="sound-seekers-world__visually-hidden">{visual.accessibleLabel}</figcaption>
    </figure>
  );
}

const ROUTE_GEOMETRY = Object.freeze({
  meander: "M -60 790 C 260 650 250 510 560 520 S 930 330 1130 430 S 1390 430 1660 195",
  "branching-grove": "M -60 790 C 250 697 411 581 638 510 L 903 374 M 638 510 L 884 609 M 903 374 L 1161 216 M 903 374 L 1248 469 L 1660 231",
  horseshoe: "M -60 290 C 284 83 624 169 684 447 C 742 720 1078 763 1269 541 C 1439 343 1511 253 1660 213",
  switchback: "M -60 774 L 426 711 Q 529 691 458 606 L 274 516 Q 224 477 321 450 L 887 383 Q 1001 368 919 290 L 781 210 Q 739 179 853 165 L 1660 117",
  "ridge-climb": "M -60 810 C 244 785 378 693 530 627 S 745 520 894 473 S 1108 356 1262 292 S 1443 191 1660 111",
  "island-loop": "M -60 720 C 247 700 367 637 462 531 C 573 406 699 334 852 349 C 1075 370 1119 605 921 675 C 733 741 559 633 612 481 C 673 305 1041 250 1660 181",
  "figure-eight": "M -60 741 C 264 716 384 584 583 437 C 755 310 1007 310 1042 458 C 1076 601 802 687 648 548 C 499 414 745 252 948 245 C 1198 236 1338 205 1660 126",
  "hub-and-spokes": "M -60 765 L 684 477 L 1660 171 M 684 477 L 441 194 M 684 477 L 798 789 M 684 477 L 1125 656",
  spiral: "M -60 771 C 311 733 489 634 553 487 C 641 285 1004 285 1070 476 C 1124 632 875 703 728 590 C 585 480 769 349 916 412 C 1058 474 1035 265 1660 130",
  constellation: "M -60 782 L 248 691 L 471 545 L 694 598 L 857 393 L 1098 448 L 1274 246 L 1471 284 L 1660 111"
});

function RouteMaterialMarks({ materialTokenId }) {
  if (materialTokenId.includes("ceramic")) {
    return <path d="M 214 648 A 25 25 0 1 0 215 648 M 558 505 A 25 25 0 1 0 559 505 M 1092 398 A 25 25 0 1 0 1093 398 M 1405 319 A 25 25 0 1 0 1406 319" />;
  }
  if (materialTokenId.includes("sandstone")) {
    return <path d="M 195 653 L 245 628 L 273 657 L 221 681 Z M 522 514 L 572 489 L 600 518 L 548 542 Z M 1062 404 L 1112 379 L 1140 408 L 1088 432 Z" />;
  }
  if (materialTokenId.includes("copper")) {
    return <path d="M 173 670 L 257 627 M 184 690 L 268 647 M 522 526 L 606 483 M 1035 428 L 1119 385 M 1350 350 L 1434 307" />;
  }
  if (materialTokenId.includes("glass")) {
    return <path d="M 225 624 L 250 650 L 225 676 L 200 650 Z M 565 481 L 590 507 L 565 533 L 540 507 Z M 1095 371 L 1120 397 L 1095 423 L 1070 397 Z" />;
  }
  if (materialTokenId.includes("rope")) {
    return <path d="M 202 656 Q 225 626 249 655 Q 225 685 202 656 M 543 513 Q 566 483 590 512 Q 566 542 543 513 M 1072 403 Q 1095 373 1119 402 Q 1095 432 1072 403" />;
  }
  if (materialTokenId.includes("root")) {
    return <path d="M 221 670 L 236 637 L 206 615 M 236 637 L 267 616 M 566 526 L 581 493 L 551 471 M 581 493 L 612 472 M 1096 415 L 1111 382 L 1081 360 M 1111 382 L 1142 361" />;
  }
  if (materialTokenId.includes("starlight")) {
    return <path d="M 221 619 L 231 642 L 256 645 L 237 661 L 243 685 L 221 672 L 199 685 L 205 661 L 186 645 L 211 642 Z M 1094 365 L 1104 388 L 1129 391 L 1110 407 L 1116 431 L 1094 418 L 1072 431 L 1078 407 L 1059 391 L 1084 388 Z" />;
  }
  return <path d="M 199 630 L 247 674 M 224 610 L 272 654 M 519 489 L 567 533 M 544 469 L 592 513 M 1069 379 L 1117 423 M 1094 359 L 1142 403" />;
}

function Route({ route }) {
  const path = ROUTE_GEOMETRY[route.topologyId];
  if (!path) throw new TypeError(`Unknown route topology: ${route.topologyId}`);
  return (
    <figure
      className="sound-seekers-route"
      role="img"
      aria-label="The path through this place."
      data-route-id={route.id}
      data-route-geometry={route.pathGeometryId}
      data-route-topology={route.topologyId}
      data-route-material={route.materialTokenId}
      data-route-family={route.routeFamilyId}
      data-route-edge={route.edgeTreatmentId}
    >
      <svg viewBox={route.viewBox.join(" ")} aria-hidden="true" focusable="false">
        <path className="sound-seekers-route__bed" d={path} />
        <path className="sound-seekers-route__edge" d={path} />
        <path className="sound-seekers-route__path" d={path} />
        <path className="sound-seekers-route__highlight" d={path} />
        <g
          className="sound-seekers-route__marks"
          data-route-material-structure={route.materialTokenId}
        >
          <RouteMaterialMarks materialTokenId={route.materialTokenId} />
        </g>
      </svg>
      <figcaption className="sound-seekers-world__visually-hidden">The path through this place.</figcaption>
    </figure>
  );
}

const BIOME_FRAME_PATHS = Object.freeze({
  "seedwake-meadow": "M 0 670 Q 170 548 330 641 Q 490 525 654 645 Q 840 533 1010 650 Q 1270 548 1600 661 L 1600 900 L 0 900 Z",
  "river-gardens": "M 0 697 Q 140 623 281 699 T 562 695 T 843 701 T 1124 692 T 1600 690 L 1600 900 L 0 900 Z",
  "fossil-canyon": "M 0 720 L 181 648 L 333 719 L 512 623 L 704 718 L 899 637 L 1094 720 L 1320 615 L 1600 710 L 1600 900 L 0 900 Z",
  "forge-settlement": "M 0 718 L 188 681 L 188 632 L 356 632 L 356 701 L 566 657 L 566 615 L 742 615 L 742 698 L 985 644 L 985 602 L 1181 602 L 1181 691 L 1600 645 L 1600 900 L 0 900 Z",
  "glass-marsh": "M 0 714 Q 151 647 303 716 Q 446 626 605 715 Q 768 632 929 714 Q 1093 624 1245 713 Q 1418 650 1600 704 L 1600 900 L 0 900 Z",
  "storm-coast": "M 0 732 L 147 657 L 287 716 L 455 626 L 625 719 L 798 646 L 981 722 L 1195 610 L 1398 711 L 1600 636 L 1600 900 L 0 900 Z",
  "lantern-forest": "M 0 720 Q 162 608 322 711 Q 482 591 644 713 Q 805 596 968 714 Q 1126 590 1287 711 Q 1450 613 1600 701 L 1600 900 L 0 900 Z",
  "star-reach": "M 0 732 L 201 691 L 201 657 L 411 657 L 411 704 L 625 647 L 625 612 L 839 612 L 839 697 L 1061 632 L 1061 597 L 1289 597 L 1289 687 L 1600 621 L 1600 900 L 0 900 Z"
});

function BiomeFrame({ kitId, plane }) {
  const path = BIOME_FRAME_PATHS[kitId];
  return (
    <svg
      className={`sound-seekers-world__biome-frame sound-seekers-world__biome-frame--${plane}`}
      viewBox="0 0 1600 900"
      aria-hidden="true"
      focusable="false"
      data-biome-frame={`${kitId}:${plane}`}
    >
      <path d={path} />
      <path className="sound-seekers-world__biome-frame-mark" d={path} />
    </svg>
  );
}

const TRANSFORMATIONS = Object.freeze({
  "seedwake-meadow": Object.freeze({ wonder: "seed-song-bloom", resolved: "seed-gate-awake" }),
  "river-gardens": Object.freeze({ wonder: "syllable-waterwheel", resolved: "canal-rhythm-restored" }),
  "fossil-canyon": Object.freeze({ wonder: "sound-fossil-rises", resolved: "echo-arch-restored" }),
  "forge-settlement": Object.freeze({ wonder: "word-forge-sparks", resolved: "copper-rail-relit" }),
  "glass-marsh": Object.freeze({ wonder: "vowel-glass-rainbow", resolved: "reed-causeway-clear" }),
  "storm-coast": Object.freeze({ wonder: "phoneme-storm-parts", resolved: "beacon-breaks-cloud" }),
  "lantern-forest": Object.freeze({ wonder: "morpheme-lanterns-branch", resolved: "root-road-glows" }),
  "star-reach": Object.freeze({ wonder: "sentence-stars-connect", resolved: "observatory-road-opens" })
});

function WorldTransformation({ kitId, compositionMode }) {
  if (compositionMode === "ordinary") return null;
  const role = compositionMode === "wonder" ? "wonder" : "resolved";
  const transformationId = TRANSFORMATIONS[kitId][role];
  return (
    <div
      className={`sound-seekers-world__transformation sound-seekers-world__transformation--${role}`}
      data-world-transformation={transformationId}
      data-transformation-state="settled"
      aria-hidden="true"
    >
      <svg viewBox="0 0 800 330" focusable="false">
        <path className="sound-seekers-world__transformation-ripple" d="M 77 245 Q 203 83 400 167 Q 590 250 731 74" />
        <path className="sound-seekers-world__transformation-ripple" d="M 68 275 Q 221 132 401 204 Q 574 275 742 119" />
        {Array.from({ length: 7 }, (_, index) => (
          <path
            key={index}
            className="sound-seekers-world__transformation-sigil"
            d="M 0 -11 L 4 -4 L 12 0 L 4 4 L 0 12 L -4 4 L -12 0 L -4 -4 Z"
            transform={`translate(${92 + (index * 102)} ${84 + ((index % 3) * 54)})`}
          />
        ))}
      </svg>
    </div>
  );
}

function stableGeometrySeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function semanticGeometry(shapeFamilyId) {
  const id = shapeFamilyId.toLocaleLowerCase("en-US");
  const seed = stableGeometrySeed(id);
  const uniqueMark = {
    x: 18 + (seed % 85),
    y: 17 + (Math.floor(seed / 97) % 83),
    radius: 3 + (Math.floor(seed / 9409) % 6)
  };
  if (/animal|bird|cat|frog|whisker|wing/u.test(id)) {
    return {
      id: "living-creature",
      shape: "M 18 77 Q 18 36 58 30 Q 99 34 102 75 Q 86 103 56 101 Q 27 101 18 77 Z M 29 40 L 19 15 L 44 32 M 83 33 L 103 13 L 94 45",
      mark: "M 39 63 A 5 7 0 1 0 40 63 M 76 63 A 5 7 0 1 0 77 63 M 49 82 Q 60 91 72 82",
      uniqueMark
    };
  }
  if (/vehicle|bike|car|boat|travel|wheel|vessel/u.test(id)) {
    return {
      id: "travel-machine",
      shape: "M 14 78 L 30 47 L 82 42 L 106 73 L 101 87 L 18 87 Z M 29 91 A 13 13 0 1 0 30 91 M 85 91 A 13 13 0 1 0 86 91",
      mark: "M 38 48 L 49 28 L 75 28 L 86 43 M 15 76 L 106 76",
      uniqueMark
    };
  }
  if (/page|book|read|story|writing|fiction|map/u.test(id)) {
    return {
      id: "open-pages",
      shape: "M 12 27 Q 36 16 58 31 L 58 101 Q 37 86 12 94 Z M 62 31 Q 84 16 108 27 L 108 94 Q 83 86 62 101 Z",
      mark: "M 23 43 L 48 47 M 23 57 L 48 61 M 72 47 L 98 43 M 72 61 L 98 57",
      uniqueMark
    };
  }
  if (/container|box|cup|cube|bowl/u.test(id)) {
    return {
      id: "container",
      shape: "M 20 37 L 92 37 L 104 98 L 15 98 Z M 28 37 Q 29 16 49 16 L 67 16 Q 88 16 88 37",
      mark: "M 34 56 L 84 56 M 40 72 L 79 72",
      uniqueMark
    };
  }
  if (/food|bread|bun|cake/u.test(id)) {
    return {
      id: "food",
      shape: "M 16 87 Q 21 42 58 39 Q 99 42 104 87 Q 62 105 16 87 Z M 25 55 Q 58 25 95 55",
      mark: "M 38 61 L 41 72 M 58 55 L 59 68 M 78 61 L 75 72",
      uniqueMark
    };
  }
  if (/sound|hear|buzz|drum|clap|rhythm/u.test(id)) {
    return {
      id: "sound-wave",
      shape: "M 13 48 L 35 48 L 60 26 L 60 94 L 35 72 L 13 72 Z",
      mark: "M 72 46 Q 91 60 72 75 M 84 33 Q 115 60 84 87",
      uniqueMark
    };
  }
  if (/moon|night|light|bright|sun|star/u.test(id)) {
    return {
      id: "sky-light",
      shape: "M 60 10 L 70 37 L 99 29 L 82 54 L 108 70 L 77 71 L 77 103 L 59 79 L 37 103 L 42 72 L 11 68 L 38 52 L 21 28 L 51 37 Z",
      mark: "M 60 42 A 19 19 0 1 0 61 42",
      uniqueMark
    };
  }
  if (/rain|storm|weather|cloud|temperature|hot/u.test(id)) {
    return {
      id: "weather",
      shape: "M 17 54 Q 22 31 44 34 Q 55 10 78 27 Q 105 25 108 56 Q 99 70 79 69 L 32 69 Q 20 68 17 54 Z",
      mark: /hot|temperature/u.test(id)
        ? "M 39 83 Q 48 72 57 83 Q 67 94 76 83 Q 86 72 96 83"
        : "M 38 78 L 30 100 M 62 78 L 54 100 M 87 78 L 79 100",
      uniqueMark
    };
  }
  if (/money|coin/u.test(id)) {
    return {
      id: "coin",
      shape: "M 60 13 A 48 48 0 1 0 61 13",
      mark: "M 60 28 L 60 88 M 43 40 Q 60 27 78 40 M 42 76 Q 60 89 79 75",
      uniqueMark
    };
  }
  if (/rock|stone|boulder|pebble/u.test(id)) {
    return {
      id: "stone",
      shape: "M 12 84 L 26 42 L 55 19 L 91 33 L 108 74 L 89 102 L 36 104 Z",
      mark: "M 31 69 L 49 45 L 76 51 M 67 83 L 93 70",
      uniqueMark
    };
  }
  if (/tree|plant|trunk|branch|leaf/u.test(id)) {
    return {
      id: "tree",
      shape: "M 49 103 L 54 68 Q 21 70 25 46 Q 27 28 48 30 Q 57 7 76 24 Q 99 21 104 45 Q 111 69 77 70 L 82 103 Z",
      mark: "M 60 95 L 65 45 M 64 62 L 44 47 M 65 56 L 84 39",
      uniqueMark
    };
  }
  if (/net|mesh|crossed-cord/u.test(id)) {
    return {
      id: "net",
      shape: "M 16 19 L 104 19 L 104 103 L 16 103 Z",
      mark: "M 17 19 L 103 103 M 45 19 L 104 76 M 75 19 L 104 48 M 103 19 L 17 103 M 75 19 L 16 76 M 45 19 L 16 48",
      uniqueMark
    };
  }
  if (/mat|flat|thin|width|cover/u.test(id)) {
    return {
      id: "flat-form",
      shape: "M 12 61 L 88 28 L 108 58 L 32 96 Z",
      mark: "M 31 62 L 80 41 M 43 79 L 93 58",
      uniqueMark
    };
  }
  if (/pure|drop|not-mixed/u.test(id)) {
    return {
      id: "clear-drop",
      shape: "M 60 10 Q 101 58 101 78 Q 99 108 60 109 Q 21 108 19 78 Q 19 58 60 10 Z",
      mark: "M 40 78 Q 43 96 60 97 M 50 52 Q 60 36 70 52",
      uniqueMark
    };
  }
  if (/little|small-size|small-amount/u.test(id)) {
    return {
      id: "small-scale",
      shape: "M 18 25 L 103 25 L 103 103 L 18 103 Z",
      mark: "M 47 54 L 74 54 L 74 79 L 47 79 Z M 28 38 L 92 38",
      uniqueMark
    };
  }
  if (/place|home|city|building|seat|chair/u.test(id)) {
    return {
      id: "place",
      shape: "M 12 58 L 60 18 L 108 58 L 99 103 L 21 103 Z",
      mark: "M 47 103 L 47 68 L 73 68 L 73 103 M 28 55 L 28 35 M 91 55 L 91 35",
      uniqueMark
    };
  }
  if (/position|between|gap|path|gate|clear|open/u.test(id)) {
    return {
      id: "space-and-path",
      shape: "M 13 19 L 43 19 L 43 104 L 13 104 Z M 77 19 L 107 19 L 107 104 L 77 104 Z",
      mark: "M 47 61 L 72 61 M 63 51 L 74 61 L 63 71",
      uniqueMark
    };
  }
  if (/person|hand|doing|action|grow|striking|move|turn|clear|start|fit|rest|aim|notice/u.test(id)) {
    return {
      id: "person-action",
      shape: "M 60 14 A 17 17 0 1 0 61 14 M 34 100 L 43 55 L 77 55 L 88 100 M 43 61 L 18 82 M 77 61 L 104 39",
      mark: "M 99 27 L 107 38 L 95 44",
      uniqueMark
    };
  }
  const variants = [
    "M 60 13 L 106 44 L 89 101 L 31 101 L 14 44 Z",
    "M 18 91 Q 13 35 59 18 Q 108 34 102 91 Q 58 108 18 91 Z",
    "M 19 25 L 101 25 L 101 98 L 19 98 Z",
    "M 60 12 L 108 61 L 60 108 L 12 61 Z"
  ];
  return {
    id: `object-${seed % variants.length}`,
    shape: variants[seed % variants.length],
    mark: "M 34 57 Q 60 37 86 57 M 38 77 L 82 77",
    uniqueMark
  };
}

function SemanticProp({ visual }) {
  const geometry = semanticGeometry(visual.shapeFamilyId);
  return (
    <figure
      className="sound-seekers-world__semantic-prop"
      role="img"
      aria-label={visual.accessibleLabel}
      data-code-native-semantic={visual.id}
      data-semantic-kind={visual.kind}
      data-shape-family={visual.shapeFamilyId}
      data-pattern-id={visual.patternId}
      data-semantic-geometry={geometry.id}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path className="sound-seekers-world__prop-shape" d={geometry.shape} />
        <path className="sound-seekers-world__prop-mark" d={geometry.mark} />
        <circle
          className="sound-seekers-world__unique-mark"
          cx={geometry.uniqueMark.x}
          cy={geometry.uniqueMark.y}
          r={geometry.uniqueMark.radius}
        />
      </svg>
      <figcaption>{visual.accessibleLabel}</figcaption>
    </figure>
  );
}

function meaningActionGeometry(actionPoseId) {
  const id = actionPoseId.toLocaleLowerCase("en-US");
  if (/lift|grow|raise|start/u.test(id)) {
    return { id: "rise", path: "M 139 105 L 139 42 M 119 63 L 139 41 L 159 63" };
  }
  if (/hear|sing|clap|sound|buzz|ring|drum/u.test(id)) {
    return { id: "sound", path: "M 128 53 Q 149 65 128 79 M 141 40 Q 174 65 141 92" };
  }
  if (/spin|turn|run|go|ride|travel/u.test(id)) {
    return { id: "move", path: "M 114 82 Q 139 42 164 78 M 146 72 L 165 79 L 159 59" };
  }
  if (/open|fit|pair|join|close|clear/u.test(id)) {
    return { id: "connect", path: "M 116 65 L 134 65 M 147 65 L 165 65 M 130 51 L 143 65 L 130 79 M 151 51 L 138 65 L 151 79" };
  }
  if (/see|look|read|point/u.test(id)) {
    return { id: "notice", path: "M 112 66 Q 139 39 166 66 Q 139 93 112 66 Z M 139 55 A 11 11 0 1 0 140 55" };
  }
  if (/near|gap|between|position|path/u.test(id)) {
    return { id: "place", path: "M 116 43 L 116 89 M 163 43 L 163 89 M 125 66 L 154 66 M 145 56 L 155 66 L 145 76" };
  }
  const seed = stableGeometrySeed(id);
  return {
    id: `show-${seed % 4}`,
    path: [
      "M 113 81 Q 139 42 165 81 M 145 72 L 165 82 L 160 60",
      "M 117 46 L 162 86 M 162 46 L 117 86",
      "M 139 40 L 166 66 L 139 93 L 112 66 Z",
      "M 112 66 Q 139 36 166 66 Q 139 96 112 66 Z"
    ][seed % 4]
  };
}

function MeaningVisual({ visual }) {
  if (!visual) return null;
  const geometry = semanticGeometry(visual.shapeFamilyId);
  const action = meaningActionGeometry(visual.actionPoseId);
  return (
    <figure
      className="sound-seekers-world__meaning"
      role="img"
      aria-label={visual.accessibleLabel}
      data-meaning-semantic-id={visual.semanticId}
      data-meaning-action-pose={visual.actionPoseId}
      data-shape-family={visual.shapeFamilyId}
      data-semantic-geometry={geometry.id}
    >
      <svg viewBox="0 0 180 130" aria-hidden="true" focusable="false">
        <g transform="translate(17 4)">
          <path className="sound-seekers-world__meaning-shape" d={geometry.shape} />
          <path className="sound-seekers-world__meaning-mark" d={geometry.mark} />
          <circle
            className="sound-seekers-world__unique-mark"
            cx={geometry.uniqueMark.x}
            cy={geometry.uniqueMark.y}
            r={geometry.uniqueMark.radius}
          />
        </g>
        <path
          className="sound-seekers-world__meaning-action"
          d={action.path}
          data-meaning-action-geometry={action.id}
        />
      </svg>
      <figcaption>{visual.accessibleLabel}</figcaption>
    </figure>
  );
}

function DecorativeMarks() {
  return (
    <div className="sound-seekers-world__decorations" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} data-world-decoration={String(index + 1)} />
      ))}
    </div>
  );
}

export function LayeredBiome({
  kit,
  scenePresentation,
  activeAttemptId = null,
  reducerRevision = null,
  sceneAccess = null,
  cropProfile,
  densityProfile,
  motionProfile,
  compositionMode = "ordinary",
  compositionSignature = "world-composition:ordinary",
  backgroundImageState,
  onBackgroundLoad = undefined,
  onBackgroundError = undefined
}) {
  if (!kit || getBiomeKit(kit.id) !== kit) {
    throw new TypeError("Layered biome requires a canonical biome kit");
  }
  if (!scenePresentation || scenePresentation.kitId !== kit.id) {
    throw new TypeError("Layered biome scene presentation does not match its kit");
  }
  requireProfile(cropProfile, CROP_PROFILES, "crop profile");
  requireProfile(densityProfile, DENSITY_PROFILES, "density profile");
  requireProfile(motionProfile, MOTION_PROFILES, "motion profile");
  requireBackgroundState(backgroundImageState, kit.background.src);
  if (kit.layers.length !== PLANES.length
    || kit.layers.some((layer, index) => layer.plane !== PLANES[index])) {
    throw new TypeError("Layered biome planes are not canonical");
  }

  const crop = computeBackgroundCrop({
    sourceSize: kit.background.minSize,
    targetSize: kit.background.cropProfiles[cropProfile].targetSize,
    focalPoint: kit.background.cropProfiles[cropProfile].focalPoint
  });
  const landmark = SOUND_SEEKERS_LANDMARK_BINDINGS.find(
    item => item.sceneId === scenePresentation.sceneId
  );
  const route = SOUND_SEEKERS_ROUTE_SPECS.find(item => item.stopId === landmark?.stopId);
  if (!landmark || !route || route.chapterId !== kit.id) {
    throw new TypeError("Layered biome route and landmark join failed");
  }

  return (
    <div
      className="sound-seekers-biome"
      style={{
        ...TOKEN_STYLE,
        "--ss-world-palette": `var(--ss-token-${kit.paletteTokenId})`,
        "--ss-world-light": `var(--ss-token-${kit.lightingTokenId})`
      }}
      data-biome-id={kit.id}
      data-crop-profile={cropProfile}
      data-density-profile={densityProfile}
      data-motion-profile={motionProfile}
      data-background-status={backgroundImageState.status}
      data-background-revision={String(backgroundImageState.revision)}
      data-scene-phase={scenePresentation.scenePhase}
      data-visual-state-id={scenePresentation.visualStateId}
      data-world-composition={compositionMode}
      data-world-composition-signature={compositionSignature}
    >
      <div className="sound-seekers-biome__raster" data-world-plane="background" aria-hidden="true">
        <img
          src={kit.background.src}
          alt=""
          aria-hidden="true"
          draggable="false"
          data-biome-background=""
          data-background-provenance={kit.background.provenanceId}
          style={{ objectPosition: crop.objectPosition }}
          onLoad={onBackgroundLoad}
          onError={onBackgroundError}
        />
      </div>
      <div className="sound-seekers-world" data-code-native-world="">
        <div className="sound-seekers-world__plane" data-world-plane="midground" data-layer-id={kit.layers[1].id}>
          <CodeNativeSetting visual={scenePresentation.setting} kit={kit} />
          {densityProfile === "full" ? <BiomeFrame kitId={kit.id} plane="midground" /> : null}
        </div>
        <div className="sound-seekers-world__plane" data-world-plane="route" data-layer-id={kit.layers[2].id}>
          {densityProfile === "full" ? <BiomeFrame kitId={kit.id} plane="foreground" /> : null}
          <WorldTransformation kitId={kit.id} compositionMode={compositionMode} />
          <Route route={route} />
          <Landmark
            landmark={landmark}
            stateId={scenePresentation.visualStateId}
            activeAttemptId={activeAttemptId}
            reducerRevision={reducerRevision}
            sceneAccess={sceneAccess}
          />
        </div>
        <div className="sound-seekers-world__plane" data-world-plane="foreground" data-layer-id={kit.layers[3].id}>
          <div className="sound-seekers-world__props">
            {scenePresentation.focalProps.map(visual => (
              <SemanticProp key={visual.id} visual={visual} />
            ))}
          </div>
        </div>
        <div className="sound-seekers-world__plane" data-world-plane="interaction" data-layer-id={kit.layers[4].id}>
          <div
            className="sound-seekers-world__characters"
            data-actor-reaction={compositionMode === "wonder"
              ? "wonder" : compositionMode === "boss-resolved" ? "resolved" : "attending"}
          >
            {scenePresentation.characters.map(character => (
              <SoundSeekersCharacter
                key={character.characterId}
                characterId={character.characterId}
                pose={character.pose}
              />
            ))}
          </div>
        </div>
        <div className="sound-seekers-world__plane" data-world-plane="effects" data-layer-id={kit.layers[5].id}>
          <MeaningVisual visual={scenePresentation.meaningVisual} />
          {densityProfile === "full" ? <DecorativeMarks /> : null}
          <span
            className="sound-seekers-world__reduced-state"
            aria-hidden="true"
            data-reduced-transition="outline-opacity-static-final"
            data-reduced-continuous="false"
          />
        </div>
      </div>
    </div>
  );
}
