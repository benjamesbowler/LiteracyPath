// Pixel-level regressions rejected during the direct assessment-art review.
//
// The style manifest records the approved hash for every live image. This
// second, deliberately small authority prevents a previously rejected bitmap
// from being re-approved by regenerating boilerplate metadata around the same
// pixels. A repaired path must match its reviewed replacement hash, and no
// active image may match any rejected hash.

import { ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES } from "./assessmentMediaAuditRejectedHashes.generated.js";
import { OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS } from "./objectiveAssessmentImageStyleDecisions.generated.js";

export const ASSESSMENT_IMAGE_REVIEW_EVIDENCE_VERSION = "direct-pixel-review-2026-09-01-v9";

const LEGACY_ASSESSMENT_REJECTED_IMAGE_HASHES = Object.freeze({
  "75eed63a59ad9cb8ae469d6d3938cf9c21dcf2fb4241443d366ec4d54462f8e9": {
    path: "/images/assessment/blends/block.webp",
    reason: "wood-grain texture and rendered three-dimensional material"
  },
  "eff177c1557b2fe42852eba1d042cda8eb38b908c7e601c5f91be4702dcdff46": {
    path: "/images/assessment/digraphs/chain.webp",
    reason: "bevelled metallic rendering and unrelated image contamination"
  },
  "33c6734bc993f1531eeb9b8302d988cd22d6e4ef36238d86148cb132d1562914": {
    path: "/images/assessment/generated/concepts/boiling.webp",
    reason: "glossy rendered pot, reflective bubbles, and faux-three-dimensional finish"
  },
  "1c7bbd2d96639dea9402c32611395cf320d9e8000dad5d9991c86641de18dee6": {
    path: "/images/assessment/release-support/targets/fur-cee609.webp",
    reason: "realistic hair texture rather than clean cartoon evidence"
  },
  "433dd4adb99a57053002d9d11bb4faf42c8297244fe7d03de03c049c6e838035": {
    path: "/images/assessment/generated/concepts/proud.webp",
    reason: "clay-like three-dimensional rendering and grainy material finish"
  },
  "a267bad87a5dcc010ce9021cb2148fc281b679851e657bc537515f639d62f233": {
    path: "/images/assessment/language/variants/adjectives/sleepy-01.webp",
    reason: "unrelated image-strip contamination and textured rendered surfaces"
  },
  "74cf643deade1a32fd91ebd10e65997eab1f0b7c6ac3117ad5fd572dcdadb115": {
    path: "/images/assessment/language/variants/antonyms-synonyms/glad-upset-01.webp",
    reason: "mixed two opposing emotions in one answer card"
  },
  "86c9cae441ed5a6309a38358f1a7008e79ed888313f7b8edff7dc4b9929205d0": {
    path: "/images/assessment/rhyming/variants/ot/hot-02.webp",
    reason: "glossy bevelled bowl and faux-three-dimensional shading"
  },
  "d411d48df83caf7714bcace7fd12d863940e4dd2028e7da39fab82401a4d8535": {
    path: "/images/assessment/generated/concepts/warm.webp",
    reason: "visible fabric hatching and rendered material texture"
  },
  "896d30775f43c27f6e4cd3d2e0ab9ddfa2decded80ef1d9301d967fc9ede0fec": {
    path: "/images/assessment/rhyming/variants/et/wet-02.webp",
    reason: "neighbouring image strips and realistic fur texture"
  },
  "398eaa7d18456bddcc43ccaa0e2c069a3c5a86251e24249374004c223b37aece": {
    path: "/images/assessment/rhyming/variants/ad/sad-02.webp",
    reason: "unrelated top strip from a neighbouring image cell"
  },
  "01385d7324807f18822331da15fd5f9d94073aa29b5c0c1b8113491042263afc": {
    path: "/images/assessment/rhyming/variants/am/ham-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "780f5382eb6f3be4bb9c396d9d742891e606ac3e4fadc80734c031c85ef6865c": {
    path: "/images/assessment/rhyming/variants/am/ram-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "9f4006f08a3bceb029295d54e066b1d47f029f669b681d83813a3a579161832e": {
    path: "/images/assessment/rhyming/variants/an/pan-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "1c78681f3b391f0815d67b19e30226ebb3bae8da83c380087be4996cd97fd4b0": {
    path: "/images/assessment/rhyming/variants/ap/nap-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "06d2ccc2e4bdc423ac5ba111a9d42c2c02689ce04b81372f7283d52560d3f2db": {
    path: "/images/assessment/rhyming/variants/ap/tap-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "805ab10fc9b3c8e93849750841b9619816f863b41296e36167f0349dffc20e47": {
    path: "/images/assessment/rhyming/variants/at/cat-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "1cbdc5aa2121896bd94781d01923c49ac3b1f673f55ed7ea1f4926deb3b34e28": {
    path: "/images/assessment/rhyming/variants/at/mat-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "3a73b2cca234916a610f7e63089bc8c82ade7ad972302ab238bce99f4f669fd3": {
    path: "/images/assessment/rhyming/variants/cup/cup-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "7bdd1a9dab69dad0e05880d2f06037052b47c15b05c709b68dc04bd8364c42c6": {
    path: "/images/assessment/rhyming/variants/ed/red-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "4ab711c3ecd09cfc05b688f6966965d738f6fe82770e63a8fea92e67c0fe1350": {
    path: "/images/assessment/rhyming/variants/hut/hut-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "8677bf9c3197c0d0d0a6942cf978fd0b909945b5b9a3b71f4f4d66fb1e1aca5d": {
    path: "/images/assessment/rhyming/variants/ig/dig-02.webp",
    reason: "crop-contaminated legacy panel with unrelated neighbouring imagery"
  },
  "e4ca6cf9ce521c3f7d228899541d4a643d661c6a03f485b76af053bdb2d1c771": {
    path: "/images/assessment/release-media/zebra-35caf16d.webp",
    reason: "right-edge strip from a neighbouring image cell"
  }
});

const OBJECTIVE_ASSESSMENT_REJECTED_IMAGE_HASHES = Object.freeze(
  Object.fromEntries(Object.values(OBJECTIVE_ASSESSMENT_IMAGE_REJECTIONS).map(rejection => [
    rejection.sha256,
    {
      path: rejection.path,
      reason: rejection.rejectionReason,
      reviewVersion: rejection.reviewVersion
    }
  ]))
);

export const ASSESSMENT_REJECTED_IMAGE_HASHES = Object.freeze({
  ...LEGACY_ASSESSMENT_REJECTED_IMAGE_HASHES,
  ...ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES,
  ...OBJECTIVE_ASSESSMENT_REJECTED_IMAGE_HASHES
});

export const ASSESSMENT_REVIEWED_REPLACEMENT_HASHES = Object.freeze({
  "/images/assessment/blends/block.webp": "487333440fc337834aca8639ee48d8ca2d49104996e48f0edba25a646a3bd3c1",
  "/images/assessment/digraphs/chain.webp": "60cb0c91e43018fda300426afd4fc845cc526408bb431d309aa4cf4b862d3d5c",
  "/images/assessment/generated/concepts/boiling.webp": "56c446fffd75316463e1c663ab597b6bb06a370b86666665e4d6b0c1b8346d4c",
  "/images/assessment/release-support/targets/fur-cee609.webp": "b64f5d381b0ac222ae952b95e5c98530755dc1dc16895962946454f9e91e38ed",
  "/images/assessment/generated/concepts/proud.webp": "40d10f026fdd6a9d0e8fff7d166e1a045fce0e75f6f4541fba3f0c71feb99d07",
  "/images/assessment/language/variants/adjectives/sleepy-01.webp": "44209396e9092464db023ce54008072a264d0ccf75c878e767b78b1ebae845b1",
  "/images/assessment/language/variants/antonyms-synonyms/glad-upset-01.webp": "7843d9d8c90a7e22f11fae4111958093ce68003411002d338afc691e4ec6b3ec",
  "/images/assessment/rhyming/variants/ot/hot-02.webp": "81fde38198e7b0d73f203108b69f20a8ee3889ff4ab52187371e523dd6972d2f",
  "/images/assessment/generated/concepts/warm.webp": "825cd4c72a1d85610908e141a47303f9d3d089863b54cef3b5c2d79091ad9e6d",
  "/images/assessment/rhyming/variants/et/wet-02.webp": "3198c76943b209d98e42d55680fc68b6bb216083922e63eab312dec7f8b9be8e",
  "/images/assessment/rhyming/variants/ad/sad-02.webp": "7b38e07cfc9616d552fcbac68e1accef6ab86ec3f65dbdc3d56c75f1ba9cd370"
});
