// Human-reviewed Leda phonics-pattern clips.
//
// Keep these separate from whole-word and general grapheme audio: several
// spellings have more than one pronunciation (for example "or" in "fork"
// versus "or" in "word"). A context-bound clip must never silently become the
// default pronunciation for every use of the spelling.
export const approvedPhonicsPatternAudio = Object.freeze([
  {
    clipId: "lp_pattern_992accb225",
    pattern: "br",
    anchor: "brush",
    phoneme: "/bɹ/",
    audioPath: "/audio/production/en-US/pattern/br-as-in-brush-992accb225.mp3"
  },
  {
    clipId: "lp_pattern_6fbbbf52d7",
    pattern: "ed",
    anchor: "",
    phoneme: "ed",
    audioPath: "/audio/production/en-US/pattern/ed-6fbbbf52d7.mp3"
  },
  {
    clipId: "lp_pattern_a41a73446f",
    pattern: "ew",
    anchor: "few",
    phoneme: "/juː/",
    audioPath: "/audio/production/en-US/pattern/ew-as-in-few-a41a73446f.mp3",
    requiresAnchor: true
  },
  {
    clipId: "lp_pattern_3837f6d017",
    pattern: "ing",
    anchor: "ring",
    phoneme: "/ɪŋ/",
    audioPath: "/audio/production/en-US/pattern/ing-as-in-ring-3837f6d017.mp3"
  },
  {
    clipId: "lp_atomic_v21_7472a53417",
    pattern: "it",
    anchor: "sit",
    phoneme: "/ɪt/",
    audioPath: "/audio/production/en-US/pattern/it-as-in-sit-7472a53417.mp3"
  },
  {
    clipId: "lp_pattern_bed4f89bea",
    pattern: "ld",
    anchor: "cold",
    phoneme: "/ld/",
    audioPath: "/audio/production/en-US/pattern/ld-as-in-cold-bed4f89bea.mp3"
  },
  {
    clipId: "lp_pattern_8b5a6cc06e",
    pattern: "lf",
    anchor: "shelf",
    phoneme: "/lf/",
    audioPath: "/audio/production/en-US/pattern/lf-as-in-shelf-8b5a6cc06e.mp3"
  },
  {
    clipId: "lp_pattern_61a77478f3",
    pattern: "ll",
    anchor: "bell",
    phoneme: "/l/",
    audioPath: "/audio/production/en-US/pattern/ll-as-in-bell-61a77478f3.mp3"
  },
  {
    clipId: "lp_pattern_1f93122196",
    pattern: "lt",
    anchor: "belt",
    phoneme: "/lt/",
    audioPath: "/audio/production/en-US/pattern/lt-as-in-belt-1f93122196.mp3"
  },
  {
    clipId: "lp_pattern_b0c0a84506",
    pattern: "mp",
    anchor: "lamp",
    phoneme: "/mp/",
    audioPath: "/audio/production/en-US/pattern/mp-as-in-lamp-b0c0a84506.mp3"
  },
  {
    clipId: "lp_pattern_9a9985ff43",
    pattern: "nch",
    anchor: "bench",
    phoneme: "/ntʃ/",
    audioPath: "/audio/production/en-US/pattern/nch-as-in-bench-9a9985ff43.mp3"
  },
  {
    clipId: "lp_pattern_f7d2e423ee",
    pattern: "nt",
    anchor: "tent",
    phoneme: "/nt/",
    audioPath: "/audio/production/en-US/pattern/nt-as-in-tent-f7d2e423ee.mp3"
  },
  {
    clipId: "lp_pattern_f1c092d4d8",
    pattern: "or",
    anchor: "word",
    phoneme: "/ɝ/",
    audioPath: "/audio/production/en-US/pattern/or-as-in-word-f1c092d4d8.mp3",
    requiresAnchor: true
  },
  {
    clipId: "lp_repair_8bbcb0d3ea",
    pattern: "ou",
    anchor: "out",
    phoneme: "/aʊ/",
    audioPath: "/audio/production/en-US/pattern/ou-as-in-out-8bbcb0d3ea.mp3"
  },
  {
    clipId: "lp_pattern_fe617f67dd",
    pattern: "ph",
    anchor: "phone",
    phoneme: "/f/",
    audioPath: "/audio/production/en-US/pattern/ph-as-in-phone-fe617f67dd.mp3"
  },
  {
    clipId: "lp_pattern_f460ac5e08",
    pattern: "spr",
    anchor: "spring",
    phoneme: "/spɹ/",
    audioPath: "/audio/production/en-US/pattern/spr-as-in-spring-f460ac5e08.mp3"
  },
  {
    clipId: "lp_pattern_1a328800c1",
    pattern: "urn",
    anchor: "turn",
    phoneme: "/ɝn/",
    audioPath: "/audio/production/en-US/pattern/urn-as-in-turn-1a328800c1.mp3"
  },
  {
    clipId: "lp_pattern_bd42fc5b7d",
    pattern: "wh",
    anchor: "whale",
    phoneme: "/w/",
    audioPath: "/audio/production/en-US/pattern/wh-as-in-whale-bd42fc5b7d.mp3"
  },
  {
    clipId: "lp_pattern_58ede80bcb",
    pattern: "ar",
    anchor: "car",
    phoneme: "/ɑɹ/",
    audioPath: "/audio/production/en-US/pattern/ar-as-in-car-58ede80bcb.mp3"
  },
  {
    clipId: "lp_pattern_207c4b77e4",
    pattern: "ew",
    anchor: "grew",
    phoneme: "/uː/",
    audioPath: "/audio/production/en-US/pattern/ew-as-in-grew-207c4b77e4.mp3",
    requiresAnchor: true
  },
  {
    clipId: "lp_pattern_878a108fa9",
    pattern: "bl",
    anchor: "blue",
    phoneme: "/blə/",
    audioPath: "/audio/production/en-US/pattern/bl-as-in-blue-878a108fa9.mp3"
  },
  {
    clipId: "lp_pattern_44e1234e9e",
    pattern: "cl",
    anchor: "clap",
    phoneme: "/klə/",
    audioPath: "/audio/production/en-US/pattern/cl-as-in-clap-44e1234e9e.mp3"
  },
  {
    clipId: "lp_pattern_0c53b6050d",
    pattern: "cr",
    anchor: "crab",
    phoneme: "/kɹə/",
    audioPath: "/audio/production/en-US/pattern/cr-as-in-crab-0c53b6050d.mp3"
  },
  {
    clipId: "lp_pattern_776a495964",
    pattern: "ct",
    anchor: "act",
    phoneme: "/kt/",
    audioPath: "/audio/production/en-US/pattern/ct-as-in-act-776a495964.mp3"
  },
  {
    clipId: "lp_pattern_1d48041f0b",
    pattern: "dr",
    anchor: "drum",
    phoneme: "/dɹə/",
    audioPath: "/audio/production/en-US/pattern/dr-as-in-drum-1d48041f0b.mp3"
  },
  {
    clipId: "lp_pattern_3dc09cf9a7",
    pattern: "gl",
    anchor: "glove",
    phoneme: "/ɡlə/",
    audioPath: "/audio/production/en-US/pattern/gl-as-in-glove-3dc09cf9a7.mp3"
  },
  {
    clipId: "lp_pattern_79b0ca790e",
    pattern: "gr",
    anchor: "grass",
    phoneme: "/ɡɹə/",
    audioPath: "/audio/production/en-US/pattern/gr-as-in-grass-79b0ca790e.mp3"
  },
  {
    clipId: "lp_pattern_d6ff22dd3f",
    pattern: "pl",
    anchor: "plant",
    phoneme: "/plə/",
    audioPath: "/audio/production/en-US/pattern/pl-as-in-plant-d6ff22dd3f.mp3"
  },
  {
    clipId: "lp_pattern_6ce0675db2",
    pattern: "pr",
    anchor: "prize",
    phoneme: "/pɹə/",
    audioPath: "/audio/production/en-US/pattern/pr-as-in-prize-6ce0675db2.mp3"
  },
  {
    clipId: "lp_pattern_3335a20003",
    pattern: "pt",
    anchor: "kept",
    phoneme: "/pt/",
    audioPath: "/audio/production/en-US/pattern/pt-as-in-kept-3335a20003.mp3"
  },
  {
    clipId: "lp_pattern_413f2a86ba",
    pattern: "sl",
    anchor: "slide",
    phoneme: "/slə/",
    audioPath: "/audio/production/en-US/pattern/sl-as-in-slide-413f2a86ba.mp3"
  },
  {
    clipId: "lp_pattern_ff57ce59ae",
    pattern: "st",
    anchor: "stop",
    phoneme: "/stə/",
    audioPath: "/audio/production/en-US/pattern/st-as-in-stop-ff57ce59ae.mp3"
  },
  {
    clipId: "lp_pattern_59b7c8a78b",
    pattern: "fl",
    anchor: "flag",
    phoneme: "/flə/",
    audioPath: "/audio/production/en-US/pattern/fl-as-in-flag-59b7c8a78b.mp3"
  },
  {
    clipId: "lp_pattern_ec820e30a1",
    pattern: "fr",
    anchor: "frog",
    phoneme: "/fɹɐ/",
    audioPath: "/audio/production/en-US/pattern/fr-as-in-frog-ec820e30a1.mp3"
  },
  {
    clipId: "lp_pattern_9f4bb83ac7",
    pattern: "ft",
    anchor: "left",
    phoneme: "/əft/",
    audioPath: "/audio/production/en-US/pattern/ft-as-in-left-9f4bb83ac7.mp3"
  },
  {
    clipId: "lp_pattern_678cade0a0",
    pattern: "lb",
    anchor: "bulb",
    phoneme: "/əlb/",
    audioPath: "/audio/production/en-US/pattern/lb-as-in-bulb-678cade0a0.mp3"
  },
  {
    clipId: "lp_pattern_26f95086a2",
    pattern: "lp",
    anchor: "help",
    phoneme: "/əlp/",
    audioPath: "/audio/production/en-US/pattern/lp-as-in-help-26f95086a2.mp3"
  },
  {
    clipId: "lp_pattern_3c5e09aa3b",
    pattern: "nd",
    anchor: "hand",
    phoneme: "/ənd/",
    audioPath: "/audio/production/en-US/pattern/nd-as-in-hand-3c5e09aa3b.mp3"
  },
  {
    clipId: "lp_pattern_3f08d8864f",
    pattern: "nk",
    anchor: "pink",
    phoneme: "/əŋk/",
    audioPath: "/audio/production/en-US/pattern/nk-as-in-pink-3f08d8864f.mp3"
  },
  {
    clipId: "lp_pattern_93e741e5c5",
    pattern: "rk",
    anchor: "park",
    phoneme: "/əɹk/",
    audioPath: "/audio/production/en-US/pattern/rk-as-in-park-93e741e5c5.mp3"
  },
  {
    clipId: "lp_pattern_22b62acf29",
    pattern: "scr",
    anchor: "scrap",
    phoneme: "/skɹə/",
    audioPath: "/audio/production/en-US/pattern/scr-as-in-scrap-22b62acf29.mp3"
  },
  {
    clipId: "lp_pattern_9146db805a",
    pattern: "sm",
    anchor: "smile",
    phoneme: "/smə/",
    audioPath: "/audio/production/en-US/pattern/sm-as-in-smile-9146db805a.mp3"
  },
  {
    clipId: "lp_pattern_485a898242",
    pattern: "sn",
    anchor: "snail",
    phoneme: "/snə/",
    audioPath: "/audio/production/en-US/pattern/sn-as-in-snail-485a898242.mp3"
  },
  {
    clipId: "lp_pattern_57a7bc4f6a",
    pattern: "sp",
    anchor: "spoon",
    phoneme: "/spə/",
    audioPath: "/audio/production/en-US/pattern/sp-as-in-spoon-57a7bc4f6a.mp3"
  },
  {
    clipId: "lp_pattern_80750f7748",
    pattern: "spl",
    anchor: "splash",
    phoneme: "/splə/",
    audioPath: "/audio/production/en-US/pattern/spl-as-in-splash-80750f7748.mp3"
  },
  {
    clipId: "lp_pattern_7880c0db2e",
    pattern: "sw",
    anchor: "swing",
    phoneme: "/swə/",
    audioPath: "/audio/production/en-US/pattern/sw-as-in-swing-7880c0db2e.mp3"
  },
  {
    clipId: "lp_pattern_7fc11cde1c",
    pattern: "tr",
    anchor: "train",
    phoneme: "/tɹʌ/",
    audioPath: "/audio/production/en-US/pattern/tr-as-in-train-7fc11cde1c.mp3"
  },
  {
    clipId: "lp_pattern_1614f22227",
    pattern: "tw",
    anchor: "twist",
    phoneme: "/twʌ/",
    audioPath: "/audio/production/en-US/pattern/tw-as-in-twist-1614f22227.mp3"
  },
  {
    clipId: "lp_pattern_c90be54143",
    pattern: "xt",
    anchor: "next",
    phoneme: "/kst/",
    audioPath: "/audio/production/en-US/pattern/xt-as-in-next-c90be54143.mp3"
  }
]);

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

export function getApprovedPhonicsPatternAudio(pattern, anchor = "") {
  const normalizedPattern = normalize(pattern);
  const normalizedAnchor = normalize(anchor);
  if (!normalizedPattern) return null;

  const candidates = approvedPhonicsPatternAudio.filter(
    item => item.pattern === normalizedPattern
  );
  if (!candidates.length) return null;

  if (normalizedAnchor) {
    const exact = candidates.find(item => item.anchor === normalizedAnchor);
    if (exact) return exact;
  }

  return candidates.find(item => !item.requiresAnchor) || null;
}

export function getApprovedPhonicsPatternAudioPath(pattern, anchor = "") {
  return getApprovedPhonicsPatternAudio(pattern, anchor)?.audioPath || "";
}
