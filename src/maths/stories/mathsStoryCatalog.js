const story = definition => Object.freeze({
  year: "F",
  releaseStatus: "approved",
  ...definition,
  pages: Object.freeze(definition.pages.map((exactText, index) => Object.freeze({
    pageNumber: index + 1,
    exactText,
    ...(definition.pageModels?.[index] || {})
  })))
});

export const mathsStories = Object.freeze([
  story({
    id: "maths-story-f-five-buns",
    title: "Five Buns for the Picnic",
    skillIds: ["F-N-SUBITISE-5", "F-N-PART-5"],
    mathsPromise: "Five remains the whole when it is separated into different parts.",
    vocabulary: ["five", "altogether", "part", "whole", "same"],
    coverImage: "/images/maths/stories/maths-story-f-five-buns/cover.webp",
    pages: [
      "Cuddly carries five buns to the picnic.",
      "“Five altogether,” says Cuddly.",
      "Two buns sit on the red cloth.",
      "Three buns stay in the basket.",
      "Two and three make five.",
      "Splashy moves one bun. Now three are on the cloth.",
      "Three and two still make five.",
      "The parts changed. The whole stayed five."
    ],
    pageModels: [
      { model: { kind: "objects", total: 5, parts: [5, 0], object: "bun" } },
      { model: { kind: "frame", total: 5, filled: 5, capacity: 5 } },
      { model: { kind: "objects", total: 5, parts: [2, 3], object: "bun" } },
      { model: { kind: "objects", total: 5, parts: [3, 2], object: "bun" } },
      { model: { kind: "part_whole", total: 5, parts: [2, 3] } },
      { model: { kind: "objects", total: 5, parts: [3, 2], object: "bun" } },
      { model: { kind: "part_whole", total: 5, parts: [3, 2] } },
      { model: { kind: "equation", total: 5, parts: [2, 3] } }
    ],
    teacherPrompts: ["How did you see five?", "What changed?", "What stayed the same?"],
    familyPrompt: "Arrange five safe household objects in two groups. Move one and say the two parts and the whole."
  }),
  story({
    id: "maths-story-f-ten-lights",
    title: "Ten Lights at the Barn",
    skillIds: ["F-N-PART-10"],
    mathsPromise: "Ten can be composed in many ways using a ten frame.",
    vocabulary: ["ten", "empty", "full", "more", "altogether"],
    coverImage: "/images/maths/stories/maths-story-f-ten-lights/cover.webp",
    pages: [
      "The barn has ten hooks for ten little lights.",
      "Muddy hangs five lights on the top row.",
      "“Five more will fill the frame,” says Splashy.",
      "Splashy adds two lights below.",
      "Five and two make seven. Three spaces are empty.",
      "Muddy adds three more lights.",
      "Seven and three make ten. The frame is full.",
      "Ten lights glow. Five above and five below."
    ],
    pageModels: [
      { model: { kind: "frame", total: 0, filled: 0, capacity: 10 } },
      { model: { kind: "frame", total: 5, filled: 5, capacity: 10 } },
      { model: { kind: "missing", total: 10, parts: [5, 5] } },
      { model: { kind: "frame", total: 7, filled: 7, capacity: 10, parts: [5, 2] } },
      { model: { kind: "part_whole", total: 7, parts: [5, 2] } },
      { model: { kind: "frame", total: 10, filled: 10, capacity: 10, parts: [7, 3] } },
      { model: { kind: "equation", total: 10, parts: [7, 3] } },
      { model: { kind: "frame", total: 10, filled: 10, capacity: 10, parts: [5, 5] } }
    ],
    teacherPrompts: ["How many empty spaces?", "How many more to make ten?", "Show a different way to split ten."],
    familyPrompt: "Draw ten boxes and place small objects in some boxes. Ask how many more are needed to fill all ten."
  }),
  story({
    id: "maths-story-f-duckling-away",
    title: "Where Did the Duckling Go?",
    releaseStatus: "planned",
    skillIds: ["F-N-ADD-TAKE"],
    mathsPromise: "Taking away changes the quantity; the missing part can be found.",
    vocabulary: ["first", "went away", "left", "take away", "now"],
    coverImage: "/images/maths/stories/maths-story-f-duckling-away/cover.webp",
    pages: [
      "Four ducklings paddle beside Splashy.",
      "Splashy counts them: one, two, three, four.",
      "One duckling follows a dragonfly behind the reeds.",
      "Four take away one leaves three.",
      "Splashy sees three ducklings. “One is away.”",
      "The dragonfly loops back. The duckling follows.",
      "Three and one make four again.",
      "All four ducklings paddle beside Splashy."
    ],
    pageModels: Array.from({ length: 8 }, (_, index) => ({ model: { kind: index === 6 ? "equation" : "objects", total: 4, visible: [4, 4, 3, 3, 3, 4, 4, 4][index], parts: [3, 1], object: "duckling" } })),
    teacherPrompts: ["What was the whole?", "Which part went away?", "How do the two equations tell the same story?"],
    familyPrompt: "Tell take-away stories with four spoons or blocks; always recount the starting whole and what remains."
  }),
  story({
    id: "maths-story-f-fair-share",
    title: "Berries for Every Plate",
    releaseStatus: "planned",
    skillIds: ["F-N-SHARE", "1-N-SHARE-GROUP"],
    mathsPromise: "Equal sharing gives each group the same amount.",
    vocabulary: ["share", "equal", "each", "same", "left over"],
    coverImage: "/images/maths/stories/maths-story-f-fair-share/cover.webp",
    pages: [
      "Woolly finds six berries for two picnic plates.",
      "Woolly puts two berries on one plate and four on the other.",
      "“That is not equal,” says Tiny.",
      "Tiny deals one berry to each plate.",
      "Tiny deals one to each plate again.",
      "Tiny deals the last two berries.",
      "Each plate has three. The share is equal.",
      "Woolly and Tiny each choose one berry. Plenty remain for the picnic."
    ],
    pageModels: [[0, 0, 6], [2, 4, 0], [2, 4, 0], [1, 1, 4], [2, 2, 2], [3, 3, 0], [3, 3, 0], [3, 3, 0]].map(([left, right, pool]) => ({ model: { kind: "groups", total: 6, parts: [left, right], pool, object: "berry" } })),
    teacherPrompts: ["How do you know it is equal?", "What is the number of groups?", "How many are in each group?"],
    familyPrompt: "Share an even number of safe objects between two people by dealing one at a time."
  })
]);

export const releasedMathsStories = Object.freeze(mathsStories.filter(item => item.releaseStatus === "approved"));
