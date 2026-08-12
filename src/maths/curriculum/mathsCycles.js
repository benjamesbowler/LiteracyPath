const CYCLES = [
  {
    id: "F-1",
    year: "F",
    number: 1,
    label: "Quantities to 5",
    skillIds: ["F-N-SEQ-20", "F-N-SUBITISE-5", "F-N-MATCH"]
  },
  {
    id: "F-2",
    year: "F",
    number: 2,
    label: "Quantities to 10",
    skillIds: ["F-N-COUNT-10", "F-N-PART-5"]
  },
  {
    id: "F-3",
    year: "F",
    number: 3,
    label: "Quantities to 20 and comparison",
    skillIds: ["F-N-COUNT-20", "F-N-COMPARE"]
  },
  {
    id: "F-4",
    year: "F",
    number: 4,
    label: "Parts, wholes, adding and taking",
    skillIds: ["F-N-PART-10", "F-N-ADD-TAKE", "F-N-SHARE"]
  },
  {
    id: "F-5",
    year: "F",
    number: 5,
    label: "Pattern, shape and position",
    skillIds: ["F-A-PATTERN", "F-SP-SHAPES"]
  },
  {
    id: "F-6",
    year: "F",
    number: 6,
    label: "Time, measure and data",
    skillIds: ["F-M-COMPARE", "F-M-TIME", "F-ST-DATA"]
  },

  {
    id: "1-1",
    year: "1",
    number: 1,
    label: "Number to 20 and facts to 10",
    skillIds: ["1-N-SEQ-120", "1-N-FACTS"]
  },
  {
    id: "1-2",
    year: "1",
    number: 2,
    label: "Addition and subtraction to 20",
    skillIds: ["1-N-ADD-20", "1-N-SUB-20"]
  },
  {
    id: "1-3",
    year: "1",
    number: 3,
    label: "Tens, ones and number to 120",
    skillIds: ["1-N-PLACE", "1-N-PARTITION"]
  },
  {
    id: "1-4",
    year: "1",
    number: 4,
    label: "Skip count, sharing and grouping",
    skillIds: ["1-N-SKIP", "1-N-SHARE-GROUP"]
  },
  {
    id: "1-5",
    year: "1",
    number: 5,
    label: "Measure, shape and position",
    skillIds: ["1-M-LENGTH", "1-M-COMPARE", "1-M-TIME", "1-SP-SHAPES", "1-SP-POSITION"]
  },
  {
    id: "1-6",
    year: "1",
    number: 6,
    label: "Money, patterns, data and chance",
    skillIds: ["1-M-MONEY", "1-A-PATTERN", "1-ST-DATA", "1-P-CHANCE"]
  },

  {
    id: "2-1",
    year: "2",
    number: 1,
    label: "Place value to 1,000",
    skillIds: ["2-N-SEQ-1000", "2-N-PLACE"]
  },
  {
    id: "2-2",
    year: "2",
    number: 2,
    label: "Facts to 20 and add/subtract strategies",
    skillIds: ["2-N-FACTS-20", "2-N-ADD-SUB"]
  },
  {
    id: "2-3",
    year: "2",
    number: 3,
    label: "Groups, arrays and twos facts",
    skillIds: ["2-N-MULT-2", "2-N-GROUP-SHARE"]
  },
  {
    id: "2-4",
    year: "2",
    number: 4,
    label: "Fractions and money",
    skillIds: ["2-N-FRACTIONS", "2-N-MONEY"]
  },
  {
    id: "2-5",
    year: "2",
    number: 5,
    label: "Measure, time and maps",
    skillIds: ["2-M-MEASURE", "2-M-CALENDAR", "2-M-TIME", "2-SP-SHAPES", "2-SP-MAPS"]
  },
  {
    id: "2-6",
    year: "2",
    number: 6,
    label: "Patterns, data and chance",
    skillIds: ["2-A-PATTERN", "2-ST-DATA", "2-P-CHANCE"]
  }
];

export const mathsCycles = Object.freeze(CYCLES.map(cycle => Object.freeze({
  ...cycle,
  skillIds: Object.freeze([...cycle.skillIds])
})));

export function mathsCyclesForYear(year) {
  return mathsCycles.filter(cycle => cycle.year === String(year));
}
export function mathsCycleForSkill(skillId) {
  return mathsCycles.find(cycle => cycle.skillIds.includes(skillId)) || null;
}
