const story = definition => Object.freeze({
  year: "F",
  releaseStatus: "approved",
  ...definition,
  pages: Object.freeze(definition.pages.map((exactText, index) => Object.freeze({
    pageNumber: index + 1,
    exactText,
    visualDescription: definition.visualDescriptions?.[index] || "",
    talkPrompt: definition.pagePrompts?.[index] || definition.teacherPrompts?.[index % definition.teacherPrompts.length] || "What maths do you notice?",
    ...(definition.pageImageDirectory ? { image: `${definition.pageImageDirectory}/page-${String(index + 1).padStart(2, "0")}.webp` } : {}),
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
    pageImageDirectory: "/images/maths/stories/maths-story-f-five-buns/pages",
    pages: [
      "Cuddly packs exactly five buns for the meadow picnic.",
      "A breeze flips the cloth. “Keep all five safe!” calls Splashy.",
      "Two buns land on the red cloth. Three stay in the basket.",
      "“Did one blow away?” Splashy asks. Cuddly checks both places.",
      "Two and three make five. Every bun is still there.",
      "Splashy moves one bun to steady the cloth. Now the parts are three and two.",
      "Three and two still make five. Changing the parts did not change the whole.",
      "The breeze settles. All five friends share the picnic they saved together."
    ],
    pageModels: [
      { model: { kind: "objects", total: 5, parts: [5, 0], object: "bun" } },
      { model: { kind: "frame", total: 5, filled: 5, capacity: 5 } },
      { model: { kind: "groups", total: 5, parts: [2, 3], object: "bun", groupLabels: ["red cloth", "basket"] } },
      { model: { kind: "groups", total: 5, parts: [2, 3], object: "bun", groupLabels: ["red cloth", "basket"] } },
      { model: { kind: "part_whole", total: 5, parts: [2, 3] } },
      { model: { kind: "groups", total: 5, parts: [3, 2], object: "bun", groupLabels: ["red cloth", "basket"] } },
      { model: { kind: "part_whole", total: 5, parts: [3, 2] } },
      { model: { kind: "equation", total: 5, parts: [3, 2] } }
    ],
    visualDescriptions: [
      "Cuddly packs five buns together beside a picnic cloth.",
      "A breeze lifts the cloth while all five buns remain together.",
      "Two buns rest on the red cloth and three remain in the basket.",
      "Splashy and Cuddly check the two groups of buns.",
      "A part-whole model shows two and three making five.",
      "Three buns rest on the cloth and two remain in the basket.",
      "A part-whole model shows three and two making five.",
      "All five friends share the five saved picnic buns."
    ],
    pagePrompts: [
      "How can you check that there are five buns?",
      "What is the whole before the buns move?",
      "Where can you see each part?",
      "How can Cuddly prove that none are missing?",
      "What do two and three make altogether?",
      "What changed when one bun moved?",
      "What stayed the same?",
      "Show another way to split five into two parts."
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
    coverImage: "/images/maths/stories/maths-story-f-ten-lights/cover-v2.webp",
    pageImageDirectory: "/images/maths/stories/maths-story-f-ten-lights/pages",
    pages: [
      "The barn concert starts at sunset, but all ten light hooks are dark.",
      "Muddy hangs five lights across the top row before the clouds arrive.",
      "“Five more will fill the frame,” says Splashy. The guests need a bright path.",
      "Splashy adds two lights below. Seven lights are ready, but the doorway is still dim.",
      "Five and two make seven. Three safe hooks are still empty.",
      "Muddy uses the long lantern pole to add the last three without climbing in the wind.",
      "Seven and three make ten. The whole frame shines just as the first guests arrive.",
      "Ten lights guide everyone inside: five above and five below. The concert can begin."
    ],
    pageModels: [
      { model: { kind: "frame", total: 0, filled: 0, capacity: 10 } },
      { model: { kind: "frame", total: 5, filled: 5, capacity: 10 } },
      { model: { kind: "missing", total: 10, filled: 5, capacity: 10, parts: [5, 5] } },
      { model: { kind: "frame", total: 7, filled: 7, capacity: 10, parts: [5, 2] } },
      { model: { kind: "part_whole", total: 7, parts: [5, 2] } },
      { model: { kind: "frame", total: 10, filled: 10, capacity: 10, parts: [7, 3] } },
      { model: { kind: "equation", total: 10, parts: [7, 3] } },
      { model: { kind: "frame", total: 10, filled: 10, capacity: 10, parts: [5, 5] } }
    ],
    visualDescriptions: [
      "An empty ten-frame of light hooks hangs beside the dark barn.",
      "Five lights fill the top row of the ten-frame.",
      "Five lights are lit and five hooks remain empty.",
      "Seven lights are lit, arranged as five and two.",
      "A part-whole model shows five and two making seven.",
      "All ten lights are lit, with the last three a different colour.",
      "An equation model shows seven and three making ten.",
      "The full ten-frame shines with five lights in each row."
    ],
    pagePrompts: [
      "How many hooks will make the frame full?",
      "How did you see five without counting every hook?",
      "How many more lights are needed to make ten?",
      "How is seven shown as smaller parts?",
      "Which part is missing from ten?",
      "What changed when the final three were added?",
      "How does the model prove seven and three make ten?",
      "Can you show ten as two different parts?"
    ],
    teacherPrompts: ["How many empty spaces?", "How many more to make ten?", "Show a different way to split ten."],
    familyPrompt: "Draw ten boxes and place small objects in some boxes. Ask how many more are needed to fill all ten."
  }),
  story({
    id: "maths-story-f-stepping-stones",
    title: "The Path to Twenty",
    skillIds: ["F-N-SEQ-20"],
    mathsPromise: "A stable number sequence tells which number comes before, after and between.",
    vocabulary: ["before", "after", "between", "next", "twenty"],
    coverImage: "/images/maths/stories/maths-story-f-stepping-stones/cover.webp",
    pageImageDirectory: "/images/maths/stories/maths-story-f-stepping-stones/pages",
    pages: [
      "Snail must reach the seed stall before the rain. The path should count all the way to twenty.",
      "Squirrel reads each stone from one. After seven, the next stone is missing.",
      "Squirrel places eight after seven. Snail slides safely across the first gap.",
      "Farther on, the path reads ten, eleven, blank, thirteen. “Twelve goes between,” says Snail.",
      "They reach sixteen, but the next stone has rolled under a fern.",
      "Squirrel finds seventeen and puts it after sixteen and before eighteen.",
      "Together they read the last stones: seventeen, eighteen, nineteen, twenty.",
      "Snail reaches the stall before the first raindrop. The complete path proved every missing number."
    ],
    pageModels: [1, 7, 8, 12, 16, 17, 20, 20].map((total, index) => ({ model: { kind: "objects", total, arrangement: index > 5 ? "row" : "arc", object: "stone" } })),
    visualDescriptions: [
      "A squirrel and snail face a woodland path to a seed stall; one starting stone is modelled.",
      "The woodland path remains behind a model of seven ordered stones.",
      "Eight stones show the path continuing safely.",
      "A structured group of twelve stones marks the second repaired gap.",
      "Sixteen stones show how far the friends have travelled.",
      "Seventeen stones show the next number after sixteen.",
      "Twenty stones form the completed path.",
      "The squirrel and snail reach the stall beside a complete model of twenty."
    ],
    pagePrompts: [
      "What number will the last stone show?",
      "Which number comes just after seven?",
      "What number comes just before eight?",
      "How do you know twelve belongs between eleven and thirteen?",
      "What comes after sixteen?",
      "Which numbers are before and after seventeen?",
      "Read the last four numbers forwards, then backwards.",
      "Choose another number and say what comes before and after it."
    ],
    teacherPrompts: ["What comes next?", "What belongs between?", "How can the sequence prove it?"],
    familyPrompt: "Make a path of number cards from 0 to 20. Hide one card and use the numbers before and after to prove what is missing."
  }),
  story({
    id: "maths-story-f-river-pebbles",
    title: "Ten and Four for the Ferry",
    skillIds: ["F-N-COUNT-10", "F-N-COUNT-20"],
    mathsPromise: "Counting each object once gives the total, and grouping ten makes teen quantities easier to see.",
    vocabulary: ["count", "each", "once", "ten", "fourteen"],
    coverImage: "/images/maths/stories/maths-story-f-river-pebbles/cover.webp",
    pageImageDirectory: "/images/maths/stories/maths-story-f-river-pebbles/pages",
    pages: [
      "Otter needs fourteen smooth pebbles to steady the ferry baskets before the river rises.",
      "He counts a scattered pile, but one pebble rolls and he is not sure which ones he counted.",
      "Otter moves each pebble into a row as he says one number word for each one.",
      "The first row has ten. He knows every pebble in that row was counted once.",
      "Four pebbles are left beside the full group of ten.",
      "Otter counts on from ten: eleven, twelve, thirteen, fourteen.",
      "Ten and four more make fourteen. He checks the same total in two neat rows.",
      "The baskets sit firmly on the ferry. Organising the count solved Otter’s muddle."
    ],
    pageModels: [14, 8, 10, 10, 14, 14, 14, 14].map((total, index) => ({ model: index >= 4
      ? { kind: "frame", total, filled: total, capacity: 20, parts: [10, total - 10], object: "stone" }
      : { kind: "objects", total, arrangement: index === 1 ? "cluster" : "row", object: "stone" } })),
    visualDescriptions: [
      "Otter prepares ferry baskets beside a model of fourteen pebbles.",
      "A scattered model shows eight pebbles while Otter pauses to reorganise.",
      "Ten pebbles move into a clear row, one count for each object.",
      "A complete group of ten pebbles is shown.",
      "A double frame shows ten and four extra pebbles.",
      "The same fourteen are organised as ten and four while Otter counts on.",
      "A structured double frame proves that ten and four make fourteen.",
      "The ferry baskets are ready beside the checked total of fourteen."
    ],
    pagePrompts: [
      "How could Otter keep track of every pebble?",
      "Why might a scattered pile be hard to count?",
      "What does moving each pebble help Otter do?",
      "How do you know this group is ten?",
      "How many more than ten can you see?",
      "Count on from ten to find the total.",
      "How does the frame prove the total is still fourteen?",
      "When would making a group of ten help you count?"
    ],
    teacherPrompts: ["How will you count each one once?", "Where can you see ten?", "How many more than ten?"],
    familyPrompt: "Count up to twenty safe objects. Move each object once, then rearrange them as a group of ten and extras to check the total."
  }),
  story({
    id: "maths-story-f-parcel-tags",
    title: "The Right Tag for Every Basket",
    skillIds: ["F-N-MATCH"],
    mathsPromise: "A numeral and a collection match when they name the same quantity.",
    vocabulary: ["numeral", "quantity", "match", "same", "check"],
    coverImage: "/images/maths/stories/maths-story-f-parcel-tags/cover.webp",
    pageImageDirectory: "/images/maths/stories/maths-story-f-parcel-tags/pages",
    pages: [
      "Badger must tag each parcel basket before the afternoon cart arrives.",
      "The first tag shows 4, but Badger has placed it beside a basket of six parcels.",
      "He touches each parcel once: one, two, three, four, five, six.",
      "“Six parcels need the numeral 6,” Badger says. He swaps the tag.",
      "A small basket holds three parcels. Badger matches it to the numeral 3.",
      "The final basket fills a ten-frame. Its matching tag is 10.",
      "Badger checks every pair: numeral, quantity; numeral, quantity.",
      "The cart arrives, and every basket has the tag that names its exact amount."
    ],
    pageModels: [1, 6, 6, 6, 3, 10, 7, 7].map((total, index) => ({ model: index === 5
      ? { kind: "frame", total, filled: total, capacity: 10, object: "parcel" }
      : { kind: "objects", total, arrangement: "row", object: "parcel" } })),
    visualDescriptions: [
      "Badger holds blank tags beside parcel baskets; one parcel starts the model.",
      "A model shows the six parcels that do not match the tag named in the story.",
      "Six parcels are arranged for one-to-one counting.",
      "The same six parcels now have the correct numeral described in the text.",
      "Three parcels form a small matching collection.",
      "Ten filled frame spaces represent the final basket.",
      "Seven parcels provide one more numeral-and-quantity check.",
      "The post cart arrives beside the checked model."
    ],
    pagePrompts: [
      "What must Badger check before choosing a tag?",
      "Does the numeral 4 match six parcels? Why not?",
      "What total did the last number word name?",
      "Which numeral matches six?",
      "Make a collection that matches the numeral 3.",
      "How do you know the full frame matches 10?",
      "What must stay the same in each pair?",
      "Show a different numeral and matching collection."
    ],
    teacherPrompts: ["What quantity does the numeral name?", "How can you build its match?", "How will you check?"],
    familyPrompt: "Write numerals 0 to 10 on cards. Build a safe-object collection for a card, then swap roles and check the match."
  }),
  story({
    id: "maths-story-f-lantern-paths",
    title: "Which Lantern Path?",
    skillIds: ["F-N-COMPARE"],
    mathsPromise: "Pairing one object from each group proves which has more, fewer or the same amount.",
    vocabulary: ["more", "fewer", "same", "pair", "compare"],
    coverImage: "/images/maths/stories/maths-story-f-lantern-paths/cover.webp",
    pageImageDirectory: "/images/maths/stories/maths-story-f-lantern-paths/pages",
    pages: [
      "Two lantern paths lead to the meadow gate. The mice need the path with more lights for their guests.",
      "The left path has seven lanterns close together. The right path has five spread far apart.",
      "“The long row looks like more,” says Moss. Fern decides to check the quantities.",
      "They pair one left lantern with one right lantern until every right lantern has a partner.",
      "Two left lanterns have no partners. The left path has two more.",
      "Fern moves the lanterns, but there are still seven on the left and five on the right.",
      "The mice choose the left path because seven is more than five, not because the row looks longer.",
      "Every guest reaches the gate. Pairing the lanterns gave the mice proof they could trust."
    ],
    pageModels: [
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["left path", "right path"] } },
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["close left path", "spread right path"] } },
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["left path", "right path"] } },
      { model: { kind: "groups", total: 12, parts: [5, 5], pool: 2, object: "lantern", groupLabels: ["paired left", "paired right"] } },
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["seven", "five"] } },
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["moved left", "moved right"] } },
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["more", "fewer"] } },
      { model: { kind: "groups", total: 12, parts: [7, 5], object: "lantern", groupLabels: ["chosen path", "other path"] } }
    ],
    visualDescriptions: Array.from({ length: 8 }, (_, index) => `Two mice compare twilight lantern paths beside the exact quantity model for page ${index + 1}.`),
    pagePrompts: [
      "What does the mice’s decision need to find out?",
      "Can spacing change how many lanterns there are?",
      "What could the mice do instead of guessing from row length?",
      "What does each pair prove?",
      "How many lanterns are left without partners?",
      "What changed when the lanterns moved? What stayed the same?",
      "Use the words more, fewer and same to compare the paths.",
      "Make two groups that are the same and prove it by pairing."
    ],
    teacherPrompts: ["How can you compare without guessing?", "What do the pairs prove?", "What stayed the same when the objects moved?"],
    familyPrompt: "Make two small groups of safe objects. Pair one from each group, then say which has more, fewer or the same and explain the leftover objects."
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
