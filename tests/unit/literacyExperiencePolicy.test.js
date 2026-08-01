import assert from "node:assert/strict";
import test from "node:test";

import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { GUIDED_READING_BOOK_INDEX } from "../../src/data/generated/guidedReadingBookIndex.generated.js";
import {
  KNOWLEDGE_JOURNEYS,
  buildMeaningPrompts
} from "../../src/data/knowledgeJourneys.js";
import { buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import {
  READING_PURPOSES,
  classifyBookReadingPurpose,
  elCodeThroughCycle,
  practiceCanAffectFormalPlacement,
  resolveConfirmedElPlacement
} from "../../src/policy/literacyExperiencePolicy.js";

function book(text, extra = {}) {
  return {
    id: "test-book",
    title: "Test book",
    type: "fiction",
    pages: [{ pageNumber: 1, text }],
    ...extra
  };
}

test("only the latest completed teacher-confirmed EL placement is consumed", () => {
  const placement = resolveConfirmedElPlacement({
    studentId: "student-1",
    assessmentHistory: [
      {
        id: "candidate-only",
        studentId: "student-1",
        assessmentId: "el_decoding",
        completedAt: "2026-07-20T00:00:00.000Z",
        candidatePlacement: { candidateMicrophase: "late_partial", anchorCycle: 26 }
      },
      {
        id: "other-child",
        studentId: "student-2",
        assessmentId: "el_decoding",
        completedAt: "2026-07-30T00:00:00.000Z",
        confirmedPlacement: { microphase: "late_partial", anchorCycle: 26 }
      },
      {
        id: "confirmed",
        studentId: "student-1",
        assessmentId: "el_decoding",
        administrationStatus: "completed",
        completedAt: "2026-07-25T00:00:00.000Z",
        confirmedPlacement: { microphase: "early_partial", anchorCycle: 15, label: "Early Partial" }
      }
    ]
  });

  assert.equal(placement.microphase, "early_partial");
  assert.equal(placement.anchorCycle, 15);
  assert.equal(placement.sourceAttemptId, "confirmed");
});

test("Cycle 1 code does not run ahead of the fixed EL sequence", () => {
  const code = elCodeThroughCycle(1);
  assert.deepEqual([...code.graphemes].sort(), ["a", "m"]);
  assert.deepEqual([...code.highFrequencyWords].sort(), ["am", "i"]);

  const cycle = elSkillsBlockCycles.find(row => row.cycleNumber === 1);
  const letterAndSoundRounds = [
    ...buildStationRounds(cycle, "letters"),
    ...buildStationRounds(cycle, "sounds")
  ];
  assert.ok(letterAndSoundRounds.every(round => (
    round.choices.every(choice => ["a", "m"].includes(String(choice).toLowerCase()))
  )));
  const buildRounds = buildStationRounds(cycle, "build").filter(round => round.type === "build");
  assert.deepEqual([...new Set(buildRounds.map(round => round.word))], ["am"]);
});

test("high-frequency words run beside phonics instead of waiting for its letters", () => {
  const cycle = elSkillsBlockCycles.find(row => row.cycleNumber === 10);
  const code = elCodeThroughCycle(10);
  assert.equal(code.graphemes.has("e"), false);
  assert.equal(code.highFrequencyWords.has("are"), true);

  const quickWords = buildStationRounds(cycle, "quick").map(round => round.answer);
  assert.ok(quickWords.includes("are"), "Cycle 10 must still teach its own HFW 'are'");

  const buildWords = buildStationRounds(cycle, "build").map(round => round.word);
  assert.ok(!buildWords.includes("are"), "phonics word-building must not claim 'are' is taught code");

  assert.equal(
    classifyBookReadingPurpose(book("are"), { elPlacement: { anchorCycle: 10 } }).id,
    READING_PURPOSES.INDEPENDENT
  );
});

test("book purpose follows confirmed taught code without hiding richer books", () => {
  const atCycleOne = { elPlacement: { anchorCycle: 1 } };
  const atCycleTwo = { elPlacement: { anchorCycle: 2 } };
  const atCycleFifteen = { elPlacement: { anchorCycle: 15 } };

  assert.equal(
    classifyBookReadingPurpose(book("am"), atCycleOne).id,
    READING_PURPOSES.INDEPENDENT
  );
  assert.equal(
    classifyBookReadingPurpose(book("mat"), atCycleOne).id,
    READING_PURPOSES.SUPPORTED
  );
  assert.equal(
    classifyBookReadingPurpose(book("mat"), atCycleTwo).id,
    READING_PURPOSES.INDEPENDENT
  );
  assert.equal(
    classifyBookReadingPurpose(book("ship"), atCycleTwo).id,
    READING_PURPOSES.SUPPORTED
  );
  assert.equal(
    classifyBookReadingPurpose(book("ship"), atCycleFifteen).id,
    READING_PURPOSES.INDEPENDENT
  );
  assert.equal(
    classifyBookReadingPurpose(book("A much richer story."), {}).id,
    READING_PURPOSES.SUPPORTED
  );
});

test("practice never changes formal EL placement", () => {
  assert.equal(practiceCanAffectFormalPlacement(), false);
});

test("knowledge journeys use current books and include talk, vocabulary and writing", () => {
  const liveBookIds = new Set(GUIDED_READING_BOOK_INDEX.map(row => row.id));
  for (const journey of KNOWLEDGE_JOURNEYS) {
    assert.ok(journey.bookIds.length >= 5, `${journey.id} needs a sustained text set`);
    assert.ok(journey.bookIds.every(bookId => liveBookIds.has(bookId)), `${journey.id} contains a retired book`);
    assert.ok(journey.vocabulary.length >= 5, `${journey.id} needs repeated vocabulary`);
  }

  const prompts = buildMeaningPrompts({ id: "first-facts-level-a-17-a-seed-grows", type: "nonfiction" });
  assert.match(prompts.talk, /fact|explain/iu);
  assert.match(prompts.vocabulary, /seed/iu);
  assert.match(prompts.writing, /draw|write/iu);
});
