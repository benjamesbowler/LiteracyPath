// Curriculum-to-action contract for Sound Seekers.
//
// A mechanic is only educational when the child's physical action produces
// observable evidence. This matrix keeps the planned world activities tied to
// the same mastery targets as the existing learning shells.

export const EVIDENCE_DOMAINS = Object.freeze({
  GRAPHEME_RECOGNITION: "grapheme-recognition",
  PHONEME_DISCRIMINATION: "phoneme-discrimination",
  BLENDING: "blending",
  SEGMENTING: "segmenting",
  WORD_READING: "word-reading",
  SOUND_SORTING: "sound-sorting",
  HEART_WORD: "heart-word-recall",
  DESCRIPTOR_COMPREHENSION: "descriptor-comprehension",
  STORY_COMPREHENSION: "story-comprehension",
  MORPHOLOGY: "morphology"
});

const D = EVIDENCE_DOMAINS;

export const PHYSICAL_MECHANICS = Object.freeze({
  "sound-hunt": { verb: "find", evidence: [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION], status: "production" },
  "flower-jump": { verb: "jump", evidence: [D.PHONEME_DISCRIMINATION], status: "production" },
  "delivery-run": { verb: "carry", evidence: [D.GRAPHEME_RECOGNITION, D.WORD_READING], status: "production" },
  "bridge-build": { verb: "place", evidence: [D.SEGMENTING, D.BLENDING], status: "production" },
  "gate-chorus": { verb: "conduct", evidence: [D.GRAPHEME_RECOGNITION, D.BLENDING, D.WORD_READING], status: "production" },
  "herd-and-sort": { verb: "herd", evidence: [D.SOUND_SORTING], status: "planned" },
  "rescue-chase": { verb: "chase", evidence: [D.PHONEME_DISCRIMINATION, D.DESCRIPTOR_COMPREHENSION], status: "planned" },
  "object-collect": { verb: "collect", evidence: [D.DESCRIPTOR_COMPREHENSION, D.WORD_READING], status: "prototype" },
  "creature-feed": { verb: "feed", evidence: [D.GRAPHEME_RECOGNITION, D.WORD_READING], status: "prototype" },
  "canal-sort": { verb: "route", evidence: [D.SOUND_SORTING], status: "planned" },
  "ferry-delivery": { verb: "deliver", evidence: [D.WORD_READING, D.DESCRIPTOR_COMPREHENSION], status: "planned" },
  "fish-rescue": { verb: "catch", evidence: [D.PHONEME_DISCRIMINATION, D.DESCRIPTOR_COMPREHENSION], status: "planned" },
  "machine-sequence": { verb: "sequence", evidence: [D.BLENDING, D.SEGMENTING], status: "planned" },
  "forge-recipe": { verb: "assemble", evidence: [D.SEGMENTING, D.MORPHOLOGY], status: "planned" },
  "reed-listen": { verb: "tune", evidence: [D.PHONEME_DISCRIMINATION], status: "planned" },
  "mirror-match": { verb: "match", evidence: [D.GRAPHEME_RECOGNITION, D.SOUND_SORTING], status: "planned" },
  "lens-assembly": { verb: "assemble", evidence: [D.SEGMENTING, D.BLENDING], status: "planned" },
  "lantern-pattern": { verb: "repeat", evidence: [D.GRAPHEME_RECOGNITION, D.WORD_READING], status: "planned" },
  "path-memory": { verb: "navigate", evidence: [D.WORD_READING, D.STORY_COMPREHENSION], status: "planned" },
  "constellation-route": { verb: "connect", evidence: [D.BLENDING, D.MORPHOLOGY], status: "planned" },
  "reading-finale": { verb: "perform", evidence: [D.WORD_READING, D.STORY_COMPREHENSION], status: "planned" }
});

export const TARGET_EVIDENCE = Object.freeze({
  letter: [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION, D.WORD_READING],
  vowel: [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION, D.WORD_READING],
  double: [D.GRAPHEME_RECOGNITION, D.SEGMENTING, D.WORD_READING],
  digraph: [D.GRAPHEME_RECOGNITION, D.SEGMENTING, D.WORD_READING],
  split: [D.GRAPHEME_RECOGNITION, D.BLENDING, D.WORD_READING],
  team: [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION, D.WORD_READING],
  "r-controlled": [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION, D.WORD_READING],
  suffix: [D.SEGMENTING, D.WORD_READING, D.MORPHOLOGY],
  blend: [D.BLENDING, D.SEGMENTING, D.WORD_READING],
  alt: [D.PHONEME_DISCRIMINATION, D.SOUND_SORTING, D.WORD_READING],
  morph: [D.SEGMENTING, D.WORD_READING, D.MORPHOLOGY]
});

export const SHELL_EVIDENCE = Object.freeze({
  "knowledge-tree": [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION],
  "sound-stones": [D.GRAPHEME_RECOGNITION, D.PHONEME_DISCRIMINATION],
  "beast-feed": [D.PHONEME_DISCRIMINATION, D.WORD_READING],
  "stone-bridge": [D.SEGMENTING, D.BLENDING, D.WORD_READING],
  "word-beast": [D.WORD_READING, D.HEART_WORD],
  "echo-cave": [D.BLENDING, D.SEGMENTING],
  "trail-run": [D.GRAPHEME_RECOGNITION, D.WORD_READING],
  "trail-signs": [D.WORD_READING, D.DESCRIPTOR_COMPREHENSION],
  "sound-sort": [D.PHONEME_DISCRIMINATION, D.SOUND_SORTING],
  "story-stones": [D.WORD_READING, D.STORY_COMPREHENSION]
});

export const EVIDENCE_RULES = Object.freeze({
  recognition: { attempts: 4, independentCorrect: 3, maxPromptLevel: 1 },
  transfer: { attempts: 3, independentCorrect: 2, differentWords: 2 },
  review: { spacingStops: 2, retrievals: 2 },
  mastery: { requiredDomains: 2, requiresIndependentTransfer: true },
  boss: { requiredDomains: 3, cumulativeReview: true }
});

const UNIQUE = values => [...new Set(values)];

export function evidenceForTarget(target) {
  return [...(TARGET_EVIDENCE[target?.kind] || [])];
}

export function mechanicPlanForStop(stop) {
  if (!stop) return null;
  const targetDomains = UNIQUE((stop.teach || []).flatMap(evidenceForTarget));
  const shellDomains = UNIQUE((stop.shells || []).flatMap(shellId => SHELL_EVIDENCE[shellId] || []));
  const requiredEvidence = UNIQUE([
    ...targetDomains,
    ...shellDomains,
    ...(stop.heartWords?.length ? [D.HEART_WORD] : []),
    ...(stop.pages?.length ? [D.STORY_COMPREHENSION] : [])
  ]);
  const physicalCandidates = Object.entries(PHYSICAL_MECHANICS)
    .filter(([, mechanic]) => mechanic.evidence.some(domain => requiredEvidence.includes(domain)))
    .map(([id]) => id);
  return {
    stopId: stop.id,
    targetKinds: UNIQUE((stop.teach || []).map(target => target.kind)),
    requiredEvidence,
    shellEvidence: Object.fromEntries((stop.shells || []).map(shellId => [shellId, SHELL_EVIDENCE[shellId] || []])),
    physicalCandidates,
    masteryRule: stop.boss ? EVIDENCE_RULES.boss : EVIDENCE_RULES.mastery
  };
}

export function validateMechanicMatrix(stops = []) {
  const errors = [];
  stops.forEach(stop => {
    const plan = mechanicPlanForStop(stop);
    (stop.teach || []).forEach(target => {
      if (!TARGET_EVIDENCE[target.kind]) errors.push(`${stop.id}: target kind ${target.kind} has no evidence contract`);
    });
    (stop.shells || []).forEach(shellId => {
      if (!SHELL_EVIDENCE[shellId]) errors.push(`${stop.id}: shell ${shellId} has no evidence contract`);
    });
    if (!plan.requiredEvidence.length) errors.push(`${stop.id}: produces no learning evidence`);
    if (!plan.physicalCandidates.length) errors.push(`${stop.id}: has no physical mechanic candidates`);
  });
  return errors;
}
