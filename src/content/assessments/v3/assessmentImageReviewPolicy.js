// Pixel-level regressions rejected during the direct assessment-art review.
//
// The style manifest records the approved hash for every live image. This
// second, deliberately small authority prevents a previously rejected bitmap
// from being re-approved by regenerating boilerplate metadata around the same
// pixels. A repaired path must match its reviewed replacement hash, and no
// active image may match any rejected hash.

export const ASSESSMENT_IMAGE_REVIEW_EVIDENCE_VERSION = "direct-pixel-review-2026-08-14-v4";

export const ASSESSMENT_REJECTED_IMAGE_HASHES = Object.freeze({
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
  }
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
