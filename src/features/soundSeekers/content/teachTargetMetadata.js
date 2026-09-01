// Authored teaching anchors.  These are deliberately not derived from a stop's
// practice-word list: each entry names the canonical pronunciation unit(s) a
// child sees and hears in the introduction.
const anchor = (word, ...units) => Object.freeze({
  word,
  units: Object.freeze(units.map(([grapheme, soundKey]) => Object.freeze({ grapheme, soundKey })))
});

const blend = (word, first, second) => anchor(word, first, second);
const alternate = (word, cueKey, ...units) => Object.freeze({
  word,
  cueKey,
  units: Object.freeze(units.map(([grapheme, soundKey]) => Object.freeze({ grapheme, soundKey })))
});

export const SOUND_SEEKERS_TEACH_TARGETS = Object.freeze({
  a: anchor("apple", ["a", "short_a"]),
  m: anchor("ham", ["m", "m"]),
  t: anchor("at", ["t", "t"]),
  s: anchor("sat", ["s", "s"]),
  n: anchor("net", ["n", "n"]),
  i: anchor("in", ["i", "short_i"]),
  f: anchor("fish", ["f", "f"]),
  d: anchor("bad", ["d", "d"]),
  o: anchor("on", ["o", "short_o"]),
  l: anchor("leg", ["l", "l"]),
  r: anchor("run", ["r", "r"]),
  h: anchor("hat", ["h", "h"]),
  b: anchor("bat", ["b", "b"]),
  w: anchor("way", ["w", "w"]),
  qu: anchor("quit", ["qu", "qu"]),
  u: anchor("bun", ["u", "short_u"]),
  c: anchor("cat", ["c", "c"]),
  g: anchor("go", ["g", "g"]),
  p: anchor("pig", ["p", "p"]),
  y: anchor("yes", ["y", "y"]),
  x: anchor("box", ["x", "x"]),
  e: anchor("bed", ["e", "short_e"]),
  v: anchor("van", ["v", "v"]),
  k: anchor("kit", ["k", "k"]),
  j: anchor("jam", ["j", "j"]),
  z: anchor("zip", ["z", "z"]),
  ff: anchor("puff", ["ff", "f"]),
  ll: anchor("bell", ["ll", "l"]),
  ss: anchor("hiss", ["ss", "s"]),
  zz: anchor("buzz", ["zz", "zz"]),
  sh: anchor("ship", ["sh", "sh"]),
  ch: anchor("chip", ["ch", "ch"]),
  th: Object.freeze({ ...anchor("thin", ["th", "th"]), cueKey: "th", alternates: Object.freeze([
    alternate("this", "th_voiced", ["th", "th_voiced"])
  ]) }),
  ng: anchor("ring", ["ng", "ng"]),
  nk: anchor("pink", ["nk", "nk"]),
  ck: anchor("duck", ["ck", "ck"]),
  wh: anchor("when", ["wh", "wh"]),
  nd: blend("hand", ["n", "n"], ["d", "d"]),
  st: blend("stop", ["s", "s"], ["t", "t"]),
  mp: blend("jump", ["m", "m"], ["p", "p"]),
  ft: blend("gift", ["f", "f"], ["t", "t"]),
  sp: blend("spin", ["s", "s"], ["p", "p"]),
  sn: blend("snap", ["s", "s"], ["n", "n"]),
  sk: blend("skip", ["s", "s"], ["k", "k"]),
  sm: blend("smell", ["s", "s"], ["m", "m"]),
  sw: blend("swim", ["s", "s"], ["w", "w"]),
  bl: blend("black", ["b", "b"], ["l", "l"]),
  cl: blend("clap", ["c", "c"], ["l", "l"]),
  fl: blend("flag", ["f", "f"], ["l", "l"]),
  gl: blend("glad", ["g", "g"], ["l", "l"]),
  pl: blend("plan", ["p", "p"], ["l", "l"]),
  sl: blend("slip", ["s", "s"], ["l", "l"]),
  br: blend("brick", ["b", "b"], ["r", "r"]),
  cr: blend("crab", ["c", "c"], ["r", "r"]),
  dr: blend("drum", ["d", "d"], ["r", "r"]),
  fr: blend("frog", ["f", "f"], ["r", "r"]),
  gr: blend("green", ["g", "g"], ["r", "r"]),
  pr: blend("press", ["p", "p"], ["r", "r"]),
  tr: blend("tree", ["t", "t"], ["r", "r"]),
  y_ie: anchor("my", ["y", "y_ie"]),
  y_ee: anchor("happy", ["y", "y_ee"]),
  a_e: anchor("cake", ["a_e", "a_e"]),
  i_e: anchor("bike", ["i_e", "i_e"]),
  o_e: anchor("home", ["o_e", "o_e"]),
  u_e: Object.freeze({ ...anchor("cube", ["u_e", "u_e"]), cueKey: "u_e", alternates: Object.freeze([
    alternate("tube", "oo", ["u_e", "oo"])
  ]) }),
  e_e: anchor("theme", ["e_e", "e_e"]),
  ai: anchor("rain", ["ai", "ai"]),
  ay: anchor("play", ["ay", "ay"]),
  ee: anchor("tree", ["ee", "ee"]),
  ea: anchor("team", ["ea", "ea"]),
  igh: anchor("light", ["igh", "igh"]),
  ie: anchor("pie", ["ie", "ie"]),
  oa: anchor("boat", ["oa", "oa"]),
  ow: anchor("snow", ["ow", "ow"]),
  oe: anchor("toe", ["oe", "oe"]),
  oo: anchor("moon", ["oo", "oo"]),
  ue: anchor("blue", ["ue", "ue"]),
  ew: Object.freeze({ ...anchor("few", ["ew", "ew_yoo"]), cueKey: "ew_yoo", alternates: Object.freeze([
    alternate("new", "ew", ["ew", "ew"])
  ]) }),
  oo_short: anchor("book", ["oo", "oo_short"]),
  ou: anchor("out", ["ou", "ou"]),
  ow_ou: anchor("cow", ["ow", "ow_ou"]),
  oi: anchor("coin", ["oi", "oi"]),
  oy: anchor("toy", ["oy", "oy"]),
  ar: anchor("car", ["ar", "ar"]),
  or: anchor("fork", ["or", "or"]),
  aw: anchor("saw", ["aw", "aw"]),
  ore: anchor("more", ["ore", "ore"]),
  er: anchor("her", ["er", "er"]),
  ir: anchor("bird", ["ir", "ir"]),
  ur: anchor("turn", ["ur", "ur"]),
  air: anchor("chair", ["air", "air"]),
  are: anchor("care", ["are", "are"]),
  ear: anchor("hear", ["ear", "ear"]),
  ure: anchor("pure", ["ure", "ure"]),
  c_s: anchor("city", ["c", "c_s"]),
  g_j: anchor("gem", ["g", "g_j"]),
  ch_k: anchor("school", ["ch", "ch_k"]),
  ea_e: anchor("bread", ["ea", "ea_e"]),
  le: anchor("little", ["le", "le"]),
  tion: anchor("action", ["tion", "tion"])
});

export const MORPHOLOGY_TEACH_EXAMPLES = Object.freeze({
  suffix_s: Object.freeze({
    base: "cat", derived: "cats", meaning: "more than one cat", units: Object.freeze([Object.freeze({ grapheme: "s", soundKey: "s" })]),
    alternates: Object.freeze([Object.freeze({ base: "dog", derived: "dogs", meaning: "more than one dog", units: Object.freeze([Object.freeze({ grapheme: "s", soundKey: "z" })]) })])
  }),
  suffix_ing: Object.freeze({ base: "jump", derived: "jumping", meaning: "happening now", units: Object.freeze([]), alternates: Object.freeze([]) }),
  suffix_ed: Object.freeze({
    base: "jump", derived: "jumped", meaning: "already happened", units: Object.freeze([Object.freeze({ grapheme: "ed", soundKey: "t" })]),
    alternates: Object.freeze([
      Object.freeze({ base: "land", derived: "landed", meaning: "already happened", units: Object.freeze([Object.freeze({ grapheme: "ed", soundKey: "ed_id" })]) }),
      Object.freeze({ base: "call", derived: "called", meaning: "already happened", units: Object.freeze([Object.freeze({ grapheme: "ed", soundKey: "d" })]) })
    ])
  })
});
