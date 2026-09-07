// One source of truth for how a teaching cycle is named on screen — the Present
// picker, the teacher context bar and the deck's own rail and cover.
//
// The curriculum data titles only a handful of cycles ("Cycle 1: Meet A and M",
// "Cycle 8: B and W"); every other row carries a bare "Cycle 2", which told a
// teacher nothing about what the cycle covers. The topic is DERIVED here from
// the cycle's own focus graphemes — the curriculum data is never edited to
// carry a label.

const ASSESSMENT_WEEK_TITLES = Object.freeze({
  "boy-assessment": "Beginning of year assessment",
  "moy-assessment": "Middle of year assessment",
  "eoy-assessment": "End of year assessment"
});

const PHASE_LABELS = Object.freeze({
  "early-letter-sound": "Letter sounds · Early",
  "letter-sound-expansion": "Letter sounds · Expansion",
  "letter-sound-completion": "Letter sounds · Completion",
  "cvc-onset": "CVC words · First sounds",
  "cvc-rime": "CVC words · Endings",
  "microphase-wrap-up": "Review and wrap-up",
  digraphs: "Digraphs",
  patterns: "Patterns",
  "pattern-power": "Pattern power",
  baseline: "Baseline assessment",
  benchmark: "Benchmark assessment",
  "review-extension": "Review and extension",
  celebration: "Celebration",
  "skills-block": "Skills block"
});

const CYCLE_TOPIC_OVERRIDES = Object.freeze({
  7: "Review letters A to H",
  14: "Review letters B to Z",
  24: "fizzle letters",
  25: "Review and wrap-up"
});

export function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

export function presentationDisplayText(value = "") {
  return String(value || "")
    .replace(/\bBOY\b/g, "beginning of year")
    .replace(/\bMOY\b/g, "middle of year")
    .replace(/\bEOY\b/g, "end of year");
}

export function presentationCycleDisplayTitle(cycle = {}) {
  return ASSESSMENT_WEEK_TITLES[cycle.id]
    || presentationDisplayText(cycle.title)
    || (cycle.cycleNumber ? `Cycle ${cycle.cycleNumber}` : "Selected cycle");
}

export function humanizePhase(phase) {
  const key = String(phase || "").toLowerCase();
  if (PHASE_LABELS[key]) return PHASE_LABELS[key];
  const text = key.replace(/-/g, " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "Review time";
}

function displayGrapheme(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^([a-z])\1$/i.test(raw)) return raw[0].toUpperCase();
  if (/^([a-z]+)\/[^/]+$/i.test(raw)) return raw.split("/")[0].trim();
  return raw.replace(/\s+sounds$/i, "");
}

function joinCycleTopics(topics) {
  if (topics.length <= 1) return topics[0] || "";
  if (topics.length === 2) return `${topics[0]} and ${topics[1]}`;
  return `${topics.slice(0, -1).join(", ")}, and ${topics[topics.length - 1]}`;
}

// What this cycle is about, in a few words — no "Cycle N" prefix.
export function cycleTopic(cycle = {}) {
  const displayTitle = presentationCycleDisplayTitle(cycle);
  if (displayTitle && displayTitle !== `Cycle ${cycle.cycleNumber}`) {
    return displayTitle.replace(/^Cycle \d+:\s*/, "");
  }

  if (CYCLE_TOPIC_OVERRIDES[cycle.cycleNumber]) return CYCLE_TOPIC_OVERRIDES[cycle.cycleNumber];

  const letters = (cycle.focusLetters || [])
    .map(card => displayGrapheme(card.grapheme))
    .filter(Boolean);
  if (!isFluencyCycle(cycle) && letters.length && letters.length <= 3) {
    const topic = cycle.phase === "patterns"
      ? joinCycleTopics(letters).toLowerCase()
      : joinCycleTopics(letters);
    return cycle.cycleNumber >= 2 && cycle.cycleNumber <= 6 ? `Meet ${topic}` : topic;
  }

  if (!isFluencyCycle(cycle) && letters.length) return `${letters[0]} families`;
  // Fluency cycles name their own focus ("Pattern Power", "Poem Launch").
  // Without this they all collapse to one shared phase label.
  if (letters.length) return letters.join(" and ");
  return humanizePhase(cycle.phase);
}

// The two-line cycle cards use a complete title so every card explains its
// teaching focus, while the stored curriculum title remains unchanged.
export function cyclePickerTitle(cycle = {}) {
  if (!cycle) return "";
  if (!cycle?.cycleNumber) return presentationCycleDisplayTitle(cycle);
  return `Cycle ${cycle.cycleNumber}: ${cycleTopic(cycle)}`;
}

// The label every cycle picker shows: "Cycle 2 · Tt and Ss", never a bare
// "Cycle 2". Assessment weeks keep their own plain-English name.
export function cycleOptionLabel(cycle = {}) {
  if (!cycle?.cycleNumber) return presentationCycleDisplayTitle(cycle);
  const topic = cycleTopic(cycle);
  return topic ? `Cycle ${cycle.cycleNumber} · ${topic}` : `Cycle ${cycle.cycleNumber}`;
}
