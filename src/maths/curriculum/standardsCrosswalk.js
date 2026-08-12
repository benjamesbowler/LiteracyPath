const CODES_BY_SKILL = {
  "F-N-SEQ-20": ["AC9MFN01", "CCSS.K.CC.A"],
  "F-N-COUNT-10": ["AC9MFN01", "CCSS.K.CC.B"],
  "F-N-COUNT-20": ["AC9MFN01", "CCSS.K.CC.B.5"],
  "F-N-SUBITISE-5": ["AC9MFN02"],
  "F-N-MATCH": ["AC9MFN01", "CCSS.K.CC.B.4"],
  "F-N-COMPARE": ["AC9MFN03", "CCSS.K.CC.C"],
  "F-N-PART-5": ["AC9MFN04"],
  "F-N-PART-10": ["AC9MFN04"],
  "F-N-ADD-TAKE": ["AC9MFN05", "CCSS.K.OA.A"],
  "F-N-SHARE": ["AC9MFN05", "CCSS.K.OA.A.3"],
  "F-A-PATTERN": ["AC9MFA01"],
  "F-M-COMPARE": ["AC9MFM01", "AC9MFM02"],
  "F-M-TIME": ["AC9MFM03"],
  "F-SP-SHAPES": ["AC9MFSP01"],
  "F-ST-DATA": ["AC9MFST01"],

  "1-N-SEQ-120": ["AC9M1N01", "CCSS.1.NBT.A"],
  "1-N-PLACE": ["AC9M1N02", "CCSS.1.NBT.B"],
  "1-N-PARTITION": ["AC9M1N02"],
  "1-N-SKIP": ["AC9M1N03"],
  "1-N-ADD-20": ["AC9M1N04", "CCSS.1.OA"],
  "1-N-SUB-20": ["AC9M1N04", "CCSS.1.OA"],
  "1-N-FACTS": ["AC9M1N04"],
  "1-N-SHARE-GROUP": ["AC9M1N05"],
  "1-A-PATTERN": ["AC9M1A01", "AC9M1A02"],
  "1-M-LENGTH": ["AC9M1M02"],
  "1-M-COMPARE": ["AC9M1M01"],
  "1-M-TIME": ["AC9M1M03"],
  "1-M-MONEY": ["AC9M1M04"],
  "1-SP-SHAPES": ["AC9M1SP01"],
  "1-SP-POSITION": ["AC9M1SP02"],
  "1-ST-DATA": ["AC9M1ST01", "AC9M1ST02"],
  "1-P-CHANCE": ["AC9M1P01"],

  "2-N-SEQ-1000": ["AC9M2N01", "CCSS.2.NBT.A"],
  "2-N-PLACE": ["AC9M2N02", "CCSS.2.NBT.A"],
  "2-N-ADD-SUB": ["AC9M2N04", "CCSS.2.NBT.B"],
  "2-N-FACTS-20": ["AC9M2N04", "CCSS.2.OA.B"],
  "2-N-MULT-2": ["AC9M2N05"],
  "2-N-GROUP-SHARE": ["AC9M2N05", "CCSS.2.OA.C"],
  "2-N-FRACTIONS": ["AC9M2N03"],
  "2-N-MONEY": ["AC9M2N06"],
  "2-A-PATTERN": ["AC9M2A01"],
  "2-M-MEASURE": ["AC9M2M01"],
  "2-M-CALENDAR": ["AC9M2M03"],
  "2-M-TIME": ["AC9M2M04"],
  "2-SP-SHAPES": ["AC9M2SP01"],
  "2-SP-MAPS": ["AC9M2SP02"],
  "2-ST-DATA": ["AC9M2ST01", "AC9M2ST02", "AC9M2ST03"],
  "2-P-CHANCE": ["AC9M2P01"]
};

export const MATHS_STANDARD_CODES_BY_SKILL = Object.freeze(
  Object.fromEntries(
    Object.entries(CODES_BY_SKILL).map(([skillId, codes]) => [
      skillId,
      Object.freeze([...codes])
    ])
  )
);

export const MATHS_KNOWN_STANDARD_IDS = Object.freeze(
  [...new Set(Object.values(MATHS_STANDARD_CODES_BY_SKILL).flat())].sort()
);

export const MATHS_STANDARD_CATALOG = Object.freeze(
  Object.fromEntries(MATHS_KNOWN_STANDARD_IDS.map(code => [
    code,
    Object.freeze({
      code,
      authority: code.startsWith("AC9")
        ? "Australian Curriculum v9"
        : "Common Core State Standards"
    })
  ]))
);

export const standardsCrosswalk = Object.freeze(
  Object.fromEntries(Object.entries(MATHS_STANDARD_CODES_BY_SKILL).map(([skillId, codes]) => [
    skillId,
    Object.freeze({
      australianCurriculum: Object.freeze(codes.filter(code => code.startsWith("AC9"))),
      commonCore: Object.freeze(codes.filter(code => code.startsWith("CCSS.")))
    })
  ]))
);

export function standardsForMathsSkill(skillId) {
  return MATHS_STANDARD_CODES_BY_SKILL[skillId] || Object.freeze([]);
}
export function isKnownMathsStandard(standardId) {
  return Boolean(MATHS_STANDARD_CATALOG[standardId]);
}
