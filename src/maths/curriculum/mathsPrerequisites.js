const PREREQUISITES = {
  "F-N-SEQ-20": [],
  "F-N-COUNT-10": [],
  "F-N-COUNT-20": ["F-N-SEQ-20", "F-N-COUNT-10"],
  "F-N-SUBITISE-5": [],
  "F-N-MATCH": ["F-N-SUBITISE-5"],
  "F-N-COMPARE": ["F-N-COUNT-10", "F-N-MATCH"],
  "F-N-PART-5": ["F-N-COUNT-10", "F-N-SUBITISE-5"],
  "F-N-PART-10": ["F-N-PART-5", "F-N-COUNT-10"],
  "F-N-ADD-TAKE": ["F-N-PART-10"],
  "F-N-SHARE": ["F-N-COUNT-10"],
  "F-A-PATTERN": [],
  "F-M-COMPARE": [],
  "F-M-TIME": [],
  "F-SP-SHAPES": [],
  "F-ST-DATA": ["F-N-COUNT-10"],

  "1-N-SEQ-120": ["F-N-COUNT-20"],
  "1-N-PLACE": ["1-N-SEQ-120", "F-N-PART-10"],
  "1-N-PARTITION": ["1-N-PLACE"],
  "1-N-SKIP": ["1-N-SEQ-120", "F-N-SHARE"],
  "1-N-ADD-20": ["F-N-ADD-TAKE", "F-N-PART-10", "1-N-FACTS"],
  "1-N-SUB-20": ["F-N-ADD-TAKE", "F-N-PART-10", "1-N-FACTS"],
  "1-N-FACTS": ["F-N-PART-10", "F-N-ADD-TAKE"],
  "1-N-SHARE-GROUP": ["F-N-SHARE", "1-N-SKIP"],
  "1-A-PATTERN": ["F-A-PATTERN", "1-N-SKIP"],
  "1-M-LENGTH": ["F-M-COMPARE"],
  "1-M-COMPARE": ["F-M-COMPARE"],
  "1-M-TIME": ["F-M-TIME"],
  "1-M-MONEY": ["1-N-SEQ-120"],
  "1-SP-SHAPES": ["F-SP-SHAPES"],
  "1-SP-POSITION": [],
  "1-ST-DATA": ["F-ST-DATA", "1-N-SEQ-120"],
  "1-P-CHANCE": [],

  "2-N-SEQ-1000": ["1-N-SEQ-120"],
  "2-N-PLACE": ["1-N-PLACE", "2-N-SEQ-1000"],
  "2-N-ADD-SUB": ["1-N-ADD-20", "1-N-SUB-20", "2-N-PLACE"],
  "2-N-FACTS-20": ["1-N-FACTS"],
  "2-N-MULT-2": ["1-N-SKIP", "1-N-SHARE-GROUP"],
  "2-N-GROUP-SHARE": ["1-N-SHARE-GROUP", "2-N-MULT-2"],
  "2-N-FRACTIONS": ["1-N-SHARE-GROUP"],
  "2-N-MONEY": ["1-M-MONEY", "2-N-ADD-SUB"],
  "2-A-PATTERN": ["1-A-PATTERN", "2-N-ADD-SUB"],
  "2-M-MEASURE": ["1-M-LENGTH", "1-M-COMPARE"],
  "2-M-CALENDAR": ["1-M-TIME"],
  "2-M-TIME": ["1-M-TIME"],
  "2-SP-SHAPES": ["1-SP-SHAPES"],
  "2-SP-MAPS": ["1-SP-POSITION"],
  "2-ST-DATA": ["1-ST-DATA", "2-N-SEQ-1000"],
  "2-P-CHANCE": ["1-P-CHANCE"]
};

export const mathsPrerequisites = Object.freeze(
  Object.fromEntries(Object.entries(PREREQUISITES).map(([skillId, prerequisiteIds]) => [
    skillId,
    Object.freeze([...prerequisiteIds])
  ]))
);

export function prerequisiteIdsForMathsSkill(skillId) {
  return mathsPrerequisites[skillId] || Object.freeze([]);
}
