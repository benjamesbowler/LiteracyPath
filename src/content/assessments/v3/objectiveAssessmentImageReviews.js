// Direct visual review of the isolated objective-word assessment artwork.
//
// An entry is not an approval merely because the file exists or passes image
// decoding. Approved artwork must show one directly observable, child-nameable
// referent; keep that referent wholly inside the frame; avoid competing scene
// detail; and use clear, professionally finished 2D raster artwork rather than
// basic vector-icon treatment. Rejected entries remain in
// this manifest so a stale or newly reintroduced authoring reference fails
// closed instead of silently receiving style metadata.

export const OBJECTIVE_ASSESSMENT_IMAGE_REVIEW_VERSION =
  "objective-word-direct-review-2026-09-01-v5";

// A review applies to these exact inspected pixels. The recorder must never
// turn a later overwrite into a fresh approval merely because the path and
// human-authored status still say "approved".
export const OBJECTIVE_ASSESSMENT_IMAGE_EXPECTED_SHA256_BY_WORD = Object.freeze({
  "ant": "1e411e9d70a3babd9cb24b429ad9f2647c589661c27272752fa997cca59746ef",
  "apple": "7896428deaa3004d5a5109eb6406664ac712018d19c968c98dbe049039bf1529",
  "astronaut": "2bb52d3f1798c6f8f2842cf6fa681f70686d12de75d319d1e5ff233cdec23537",
  "bag": "b58a446802182757343983d5b67d7e53d8af3d04ac0c0d1c28b696e00114c086",
  "banana": "c96aa7ef6e0fb31a0675fa2ab5c3833c3fcda3fb89a9f84c7a842dbd10b931a2",
  "bath": "c1a667035697ecc7d8d2b2d83c97857b90af261833445ab4da897d40fb29dad5",
  "beach": "979c1524d308dc6e850e0c5032070a85dd6aff8edae00b60b527005b715ec829",
  "bed": "884ca2c409cd20c13f9701028972aa4033f6ad8215d233315458da0ee8a09010",
  "bell": "2978cd3ffa64ebb9060ad35f9ebfebd17d9b280ae9156621cfc8a5c40a9b70f4",
  "bench": "ede5264ff4a145081b2611c9a2400509bfadb9d43f4536adfe06b71398a5ffdb",
  "bike": "a7700c037d08f543e49c1f4c4d8f560ddff7a9a109517e2d32293a8ce2f817e3",
  "boat": "c17d6aa880db32d60c5ad7e4c1f2376eafd02d3f1c43ad8f4fbe986aff9c5578",
  "bone": "ffcd418b80a21374d24647cd7bfce68e27c472cea4b2c514031346e4614670ae",
  "bread": "a30fbc00033d7555b5b95aa9d4eae011c307d8d5aec96831c0daa07d3ba4fa21",
  "brick": "915e23960e462f792c1e52cfaad523f4655c1da4b24ff9316844ae5abd4153ba",
  "brush": "2ddd72623933a0e34e1c268573e1c60e25b1a13d682c0222e8fea011ddb286ad",
  "butterfly": "2de8f61e6e97adfe79f6d6badf46e7a3d9f57901457d9e8b63928337100bf741",
  "cake": "1fec68196ba8f069a7a16cd66dbc8d4719f64098758b845fed2d8f3bcc3d4ed9",
  "cap": "0655a8f3b7e6466d979296c2752945381468ff4e230c75f0d65500356d647c91",
  "cat": "e8548c01c0703264eb724b9d7ebae943426833bfad0f97ed6508c721bbd3615b",
  "caterpillar": "6548c7d12d2597eb29e7b092d18fde2a908bf43d62c8a0f3489ebc2051769f41",
  "cheese": "a3a8eb1041eeba41b93bdf880d5046d22017a3006c2aba7b8e64ac7659b5b42f",
  "cherry": "a223d63dfc089f82afc483983e29b12f1a9b64fbc203cb702cc5325b7767006c",
  "chip": "869d0056cc50fc3fc6d9a529d6f51f366a3a06488ae96067aafad0fae53a7a55",
  "clock": "d15083d6179ec7b1be7bdb5328e8b24ab2de7cf86337bf8f0c5b40d68b4a0a8f",
  "coin": "5b6e30bf65c84c423acca045c18627e445289a3547bf1f807ec7fa581b6aa659",
  "cone": "fc8fed27e420ac6b9b365c4b63308f44ea5d555467188766f79a9b867dc7b032",
  "corn": "2532ec599fb191ff4af93a821bbb080c8f7c9a603d96714d97a997d6fd994f1f",
  "crown": "a56dd8d1f6e7500738110d6b49b91a8f05155ef81eb8806991904c8cdbd7a377",
  "cup": "3518e5049eb90be0ef12dba751e7a42787e0365c72ee05cbe61fa01384319c1b",
  "cube": "07068674e9097e1846a06f89f6c5b31994b27d0109c2abf392556bef12274d50",
  "deer": "c52590233be8d364ccd34307e8511b3ddd17cca4aa81677d4d2236864a8c6761",
  "dish": "cd0e9dbffa38c4d9109f5e55893a38bfb053a290f961d192de86d96579f86ea1",
  "dog": "429eb02489351f3adbd96aec0db6431e89f960a16e5b25025732d8892e1ec210",
  "duck": "cfc00d18c7275389a288be8945706171a01c296351cbe0b606b99d451077ce82",
  "egg": "194c3136e48eecc9754f9785870bded4a53e92ce27e62ee8476221524229a818",
  "elbow": "287ef6307d251dcd4a6f725cb67c786797e825e0bad1ba40dbb4f2fb4c27751f",
  "engine": "f5c47435130316857cb1c5ed7970e287ac4578ce36842b2296a6bf51b20111cb",
  "fan": "3e464eba90e637e6fd22049110a0ceb6636d38d37701b8ad021c3b176d02267e",
  "flute": "4322413681be6f6fb3a3e700e8a6e7853ceb3e52c6f151743b2ed92011a0f703",
  "fox": "8a30ba97f40a6bb60c32fc628c746839fa4e339c4e593eaa47f9feaf53e97f9d",
  "gate": "6a1924b8c70ce7744c8f58e5a3c4c0945e12d1a5321e028452060b78ba8fa89a",
  "gift": "f74608b78c7445835899550b1a9feab3637ec9883987ab5902dfff7e927e1148",
  "glass": "080db25389a58260b2595a32b343940f037deb38b93b02dc7e74e0b9fd9806b3",
  "ham": "f9e8f2b67767cc8b1aac8325b8439cb6921a60ba8fcb277688c30f828473b94c",
  "hat": "53c6476e3fe59bc0f1a757120f412dd309652c1d99e731c24222bcdaa54ddcaf",
  "hen": "f03d21c631ffde9fd58e378f05fa9a8adfefac71e9d7c6d6a98aec33ddf8247e",
  "house": "b43a76f06f8939c288966c14a140705a92ef4bc7b48bf36c9e881a8748922b3e",
  "hut": "0f81180c8c380bb8c32792936ad6115919e7b56497b3170164ee52a6406ed549",
  "iguana": "3ec7a4ad63c0f802a1ca9334369a4d3fbd9d3255aa14277733c58b69b6f09980",
  "ink": "a2e7877162532d9b8682f33d1124c1b8ccedaee6f0213fd4ef5d10a295bb2f4a",
  "jam": "f617e1afd8ef945cfe0241cc489b8ab854d1d5c60035eb38777506e7d6a4b68a",
  "jet": "f4699ac5276dc71189ac4b341f14e63ba5a959da6385d76575cd53c367cc7263",
  "kangaroo": "b8b5ba53c972ac1672a04f082f6de6ac3849f5540e6372eada456d73960ca266",
  "key": "a9ebee9ad24ee878f321507cae0f5d47643e7fedb258c2115fcde8bb772255d0",
  "king": "01bfa9b722854720cfb3ac6897cd34a32c4bd63d90bfe54d73c98a40ae5fe911",
  "lamp": "2c9d80adcb449cb9fcddf6d521ea775979207b7e7a50392584f383ed325b61ef",
  "leg": "7825ca65b6c298166e06138122543989d8ed44e1f9b1ccce42c300946afeb566",
  "lid": "57cd74359b6faedfcdb6b01ab762fa439ac28158fc2c0bfb2763024b58cef54a",
  "lion": "efc6eefe52aa994ff4e422e976237b7972013e316f124e8dffcf965f61bb63eb",
  "map": "c10b012c1ad71711680d85cfbd7ad87fa7427332f9b0d26d7980ce8f326207b1",
  "mat": "4f09f9d9620718ed6fc867258a330272b6b3c6ab8152d0ea768ffacbbfac6999",
  "mop": "d4a30f4ca2e0f3fb784b3bfd9abcec48a923dccb20634804b60334e52b83293d",
  "mug": "f298dd3ad08480184bc9f2e4933a4bf8d42c95cd21a345dad756e9648e771d6f",
  "neck": "830fbe5356c617abcd2104779a5e98c1584ce353bcb595032664750b9fac6b10",
  "net": "26bbab10e8b2e0ce06d5ca92ca39f88639f71f4688f739e0dd7b0f22263e1626",
  "nose": "7ae0d5377e90cd2149232b49378a596a77c79eaab126c7b4a00b830fcaecad8d",
  "nut": "9d06dc2eab1a686da92423c699b18340dd61b90648e36d8b8b8f6fedccabbde4",
  "octopus": "ba0ea7b33ca3786949c4e6f433adce275d0ba12c868ce29a1b31429665dd3ddc",
  "orange": "430cfefcb7b23b0e27c77f9d34df30d8fd466c1b2c00f575b7b98acc9503497a",
  "pan": "44c0ce117e1f0de8d4ec909ddd4eb3a628b3665aeb4be8f3b3480d7e53af1fec",
  "pen": "60985708cdff39f68f870b60c911e4e608bee0203777e7868835d3acd224829a",
  "plane": "3fe2e4d8e0231f64fd5e6c3af39f9598873a199ce25ba9ecb1b061816ca5b654",
  "pot": "eb1223aed1fb7b2cd37a24a01148fd28e0c78f4538051bb22cbe1de1c1f465a5",
  "quilt": "1cb2d1c2a90339a50ab67c4055c65e1069d7dbe2081ee4bdbdde2f4a84ebf66b",
  "ram": "b95786f893f8f565bff349ea899bf54221bf854dd22668c2f18fc592a7314278",
  "rat": "d3804eabd824d7b4bc6894cec517c82901ef712ae0852e5d0634c7af2c16520f",
  "rose": "5f328ef4e5c1715ec3c4b09d606a71bd44d6669ee1dad173e8da652d0655cac3",
  "rug": "38946a64472b0adbf45f3dfa893518ce49bf839754652b21e145678a8254b4a1",
  "run": "1df5a28011746c2f8475e37ff3bef2db65a0c2eab26ac0c7b0139725287737e4",
  "seal": "42b7ae1a2db0a9cab6d8e80fde40800764416aaae99c2f4ec7bc6b59f571a317",
  "ship": "6e4bed24061a267d4684187eac844b29b4595ee65c044fac3b1441896fb18fa9",
  "sled": "653717915f5d1bd4e04246ce88ed0c3f22fc1d22bb1ab6fd383f7667e779c828",
  "snake": "ce1f6365ee9a57a72df1b066e1cc88d49ad3c791f24e49f00644382206f403cf",
  "spoon": "2d92ea354c86713bc23b68f8d94cab0a80e572671159f38b47b568e6a7747a08",
  "tap": "fcfdb50894cfe9e1bf8fc4cabe709f2d25f683b70344f26231f5ef22feb9c8e2",
  "tent": "934b6bdcc2cf131135a08e385545244e38e2063b8bc63cfe232cf2d7b7bfcfc3",
  "tie": "bc65e2fcaa3f7c7e4a15ac1ae79b5b3896c4591a8909d355be767411885336b0",
  "tiger": "88a7ff9fde79484b738db0d4713e928c3e00913db5ccdd1f13d27286f8ddf84a",
  "toe": "9454af6cc4745915aedb0da00be0f37c035aab3a848bbeedea1312aeaa935f83",
  "tomato": "2dfcbad6b636b1aab9fbc9f49b9fd67e64e6285ffec90236eb0a8ae3ef8f28aa",
  "tooth": "87cdbc6455b03ac8238bffd7d0844f59cc0eec3ad74644168b1554f3f6f50022",
  "toy": "0c0156e4febdf519935ac7690b66513916366d99d96219a7a1fda6a8a886fe42",
  "train": "3861ec0afd15d9cb620cacad99a2e95587ef0a945c330d1ff017907f23ff68ab",
  "truck": "1ceafb10272fcfc4d5353beef5bb49e7bc0f9cd015f7558543642f5537e76f18",
  "tube": "f8b57347b62383817e17354eb3b5636c8c7cd4b24546903833efbc26ec0eb24b",
  "van": "9c8515b70963755b1b8d8811b23fb1c56bd025bc741274f3724df46406c18725",
  "vase": "659509ca53c0456fab59f6a054299d6fbbfb4aa50f9d8c2719e62519f1aae70f",
  "wasp": "d05f3e4da4ea9b7600fe3422333996247c4f074e0e96af805d65b1e7b7b3d4ee",
  "watch": "dc37d382a501a6b85718d2a0d5c28334e84965e8cb1f58584b6ae7451154040a",
  "web": "04737bd345757648e234d3bb77bae21190c0ced641c963170050cd1fbb246a66",
  "wheat": "ead7d24a374ac480ec24fbeea081665af430d8d13405bda34ee1563ebb71c40f",
  "wheel": "65c5e89a951d9faa456da702aab80ac0db33db803af2b16b84c52a58b1af3716",
  "window": "8a411635de999269b8c0c2e4fba1287c14c1d7fb0c58982f0e3d94e11b7892ea",
  "yo-yo": "900911ece4099537d1f75eea4eb7631d06ea17651e8aae2843e45fb74f46cd48",
  "yogurt": "cf063e7b2b1cbfb95152fca0a92f8edfcfbe0f3373bce971a02e85ff9993b5d1",
  "zip": "c18d6b7f208eadca186ebd928d0bdf9e5d014ebc0902b5ecdebfb846d5f185d6",
  "zebra": "b62e9277d235bfdfe121bd6cd537acb4c29064075e3cd50864c1e9d57f095757",
  "zipper": "2bab3a429d3d45db59c62e94f871a7575c6f8a1add6ea6a03c13f87ba5dbc511"
});

const APPROVED_WORDS = Object.freeze([
  "ant", "apple", "astronaut", "bag", "banana", "bed", "bell", "bench",
  "bike", "boat", "bone", "bread", "brick", "brush", "butterfly", "cake",
  "cap", "cat", "caterpillar", "cheese", "clock", "coin", "cone",
  "corn", "crown", "cube", "cup", "deer", "dog", "duck", "egg", "elbow", "fan", "flute", "fox",
  "gate", "gift", "glass", "ham", "hat", "hen", "house", "iguana", "ink", "jam",
  "kangaroo", "key", "king", "lamp", "leg", "lid", "lion", "map", "mat", "mop",
  "mug", "net", "nut", "octopus", "orange", "pan", "pen", "plane", "pot",
  "quilt", "rat", "rose", "seal", "ship", "sled", "snake", "spoon",
  "tent", "tie", "tiger", "tooth", "tomato", "train", "truck", "van", "vase", "wasp",
  "watch", "web", "wheat", "wheel", "window", "yo-yo", "zebra", "zipper"
]);

const CROP_REMEDIATION_WORDS = new Set([
  "cat", "cup", "ham", "mat", "pan", "zebra"
]);

const PROFESSIONAL_RASTER_WORDS = new Set([
  "cat", "clock", "cup", "dog", "duck", "fan", "ham", "mat", "pan", "sled",
  "tie", "tooth", "watch", "wheel", "zebra"
]);

const REJECTED_WORDS = Object.freeze({
  bath: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "The still shows a bathtub, not the event or word bath; the target must be carried by audio or print."
  },
  beach: {
    failedCriteria: ["nameability", "complexity"],
    rejectionReason: "The picture is a multi-cue umbrella, sand, and wave scene rather than one unambiguous named referent."
  },
  cherry: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "The picture shows two cherries while the hidden label is singular, so the expected response is not objectively forced."
  },
  chip: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "The thin potato crisp is regionally named crisp by many UK children; chip is not an objective cross-locale label."
  },
  dish: {
    failedCriteria: ["nameability"],
    rejectionReason: "The picture is conventionally named plate; dish is a broader category and is not exact enough for hidden-label scoring."
  },
  engine: {
    failedCriteria: ["nameability", "complexity"],
    rejectionReason: "The detailed car mechanism is visually complex and is at least as likely to be named motor."
  },
  hut: {
    failedCriteria: ["nameability", "objectivity"],
    reviewedAt: "2026-09-01",
    styleProfile: "professionally-rendered-storybook-raster",
    rejectionReason: "The small dwelling may correctly be named house; that alternative changes the onset, rime, and final sound being assessed."
  },
  jet: {
    failedCriteria: ["nameability"],
    rejectionReason: "The passenger aircraft is ordinarily named plane or airplane rather than jet by the assessed age group."
  },
  neck: {
    failedCriteria: ["crop", "nameability"],
    rejectionReason: "A cropped child profile makes head, boy, and face competing labels; the neck is not the sole referent."
  },
  nose: {
    failedCriteria: ["nameability", "complexity"],
    rejectionReason: "The partial face includes an eye and mouth, so face or profile competes with the intended body-part label."
  },
  ram: {
    failedCriteria: ["nameability", "objectivity"],
    reviewedAt: "2026-09-01",
    styleProfile: "professionally-rendered-storybook-raster",
    rejectionReason: "Young children may correctly name the animal sheep; that alternative changes the onset, rime, and final sound being assessed."
  },
  rug: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "The small rectangular floor covering is equally nameable as a mat, so rug is not exact enough for hidden-label scoring."
  },
  run: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "A still image may be named boy, runner, or running and cannot objectively force the base-form action word run."
  },
  tap: {
    failedCriteria: ["nameability", "objectivity"],
    reviewedAt: "2026-09-01",
    styleProfile: "professionally-rendered-storybook-raster",
    rejectionReason: "The plumbing fixture is correctly named faucet in US English; that alternative changes the onset, rime, and final sound being assessed."
  },
  toe: {
    failedCriteria: ["nameability"],
    rejectionReason: "The picture shows a whole foot, so foot is the primary label rather than toe."
  },
  toy: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "The visible object is a spinning top; toy is a broad category rather than the exact pictured word."
  },
  tube: {
    failedCriteria: ["nameability"],
    rejectionReason: "The plain cylinder is equally nameable as pipe and does not establish the exact word tube."
  },
  yogurt: {
    failedCriteria: ["nameability"],
    rejectionReason: "An open cup with a spoon can be yogurt, pudding, or ice cream; the food is not visually exact without a label."
  },
  zip: {
    failedCriteria: ["nameability", "objectivity"],
    rejectionReason: "The picture depicts a zipper; zip is a dialectal noun or an action and is not an exact short-vowel or rhyme label."
  }
});

const criterion = (failedCriteria, name, approval) =>
  failedCriteria.includes(name) ? "rejected" : approval;

const approvedReview = targetWord => ({
  path: `/images/assessment/objective-words/${targetWord}.webp`,
  targetWord,
  status: "approved",
  reviewedAt: CROP_REMEDIATION_WORDS.has(targetWord) ? "2026-09-01" : "2026-08-31",
  reviewMode: "direct-contact-sheet-and-individual-pixel-review",
  cropReview: "approved-referent-complete-with-padding",
  nameabilityReview: "approved-direct-child-label",
  objectivityReview: "approved-directly-observable",
  complexityReview: "approved-single-focus",
  styleReview: "approved-clear-professional-2d-raster",
  styleProfile: PROFESSIONAL_RASTER_WORDS.has(targetWord)
    ? "professionally-rendered-storybook-raster"
    : "classic-flat-2d-raster",
  sourceSheet: CROP_REMEDIATION_WORDS.has(targetWord)
    ? "proper-raster-image-generation-2026-09-01"
    : PROFESSIONAL_RASTER_WORDS.has(targetWord)
      ? "proper-raster-image-generation-2026-08-31"
      : "objective-word-direct-review-2026-08-31",
  textReview: "approved-no-text-or-symbol-cue",
  reviewNote: CROP_REMEDIATION_WORDS.has(targetWord)
    ? "Regenerated as one complete isolated referent after rejecting crop-contaminated legacy pixels; no adjacent panel, competing scene, or inferred relationship."
    : "One direct referent; no adjacent-panel crop, competing scene, or inferred relationship."
});

const rejectedReview = (targetWord, rejection) => ({
  path: `/images/assessment/objective-words/${targetWord}.webp`,
  targetWord,
  status: "rejected",
  reviewedAt: rejection.reviewedAt || "2026-08-31",
  reviewMode: "direct-contact-sheet-and-individual-pixel-review",
  cropReview: criterion(rejection.failedCriteria, "crop", "approved-referent-complete-with-padding"),
  nameabilityReview: criterion(rejection.failedCriteria, "nameability", "approved-direct-child-label"),
  objectivityReview: criterion(rejection.failedCriteria, "objectivity", "approved-directly-observable"),
  complexityReview: criterion(rejection.failedCriteria, "complexity", "approved-single-focus"),
  styleReview: "approved-clear-professional-2d-raster",
  styleProfile: rejection.styleProfile || "classic-flat-2d-raster",
  textReview: "approved-no-text-or-symbol-cue",
  rejectionReason: rejection.rejectionReason
});

export const OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS = Object.freeze(
  Object.fromEntries([
    ...APPROVED_WORDS.map(targetWord => [
      `/images/assessment/objective-words/${targetWord}.webp`,
      approvedReview(targetWord)
    ]),
    ...Object.entries(REJECTED_WORDS).map(([targetWord, rejection]) => [
      `/images/assessment/objective-words/${targetWord}.webp`,
      rejectedReview(targetWord, rejection)
    ])
  ].sort(([left], [right]) => left.localeCompare(right)))
);
