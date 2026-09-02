import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStationRounds,
  sharesSound,
  stationsForCycle
} from "../../src/components/elQuest/elQuestEngine.js";
import {
  ADVENTURE_MECHANIC_IDS
} from "../../src/components/elQuest/adventureRoundModel.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
  test(`cycle ${cycle.cycleNumber} exposes typed, truthful rounds`, () => {
    for (const station of stationsForCycle(cycle)) {
      const rounds = buildStationRounds(cycle, station.id);
      assert.ok(rounds.length > 0, `${station.id} is empty`);
      for (const round of rounds) {
        assert.ok(
          ADVENTURE_MECHANIC_IDS.includes(round.mechanicId),
          `${station.id} emitted unknown mechanic ${round.mechanicId}`
        );
        assert.equal(typeof round.construct, "string");
        assert.ok(
          station.mechanicIds.includes(round.mechanicId),
          `${station.id} emitted undeclared mechanic ${round.mechanicId}`
        );
      }
    }
  });
}

function roundsForMechanic(mechanicId) {
  const rounds = [];
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle).filter(item => item.id !== "check")) {
      rounds.push(...buildStationRounds(cycle, station.id)
        .filter(round => round.mechanicId === mechanicId)
        .map(round => ({ cycle, station, round })));
    }
  }
  return rounds;
}

test("each mechanic receives the explicit data its component needs", () => {
  for (const mechanicId of ADVENTURE_MECHANIC_IDS) {
    const entries = roundsForMechanic(mechanicId);
    assert.ok(entries.length > 0, `${mechanicId} has no generated coverage`);
    for (const { cycle, station, round } of entries) {
      const where = `cycle ${cycle.cycleNumber}/${station.id}/${mechanicId}`;
      if (mechanicId === "letterPair") {
        assert.ok(round.targetGrapheme && round.modelForm && round.partnerForm, where);
      } else if (mechanicId === "soundGate") {
        assert.ok(round.targetGrapheme, where);
        assert.ok(round.acceptedAnswers?.length > 0, where);
        assert.ok(round.acceptedAnswers.every(answer => round.choices.includes(answer)), where);
      } else if (mechanicId === "sceneHunt") {
        assert.ok(round.targetGrapheme, where);
        assert.ok(round.objects?.length >= 3, where);
        assert.ok(round.objects.every(object => typeof object.matches === "boolean"), where);
      } else if (mechanicId === "wordWindow") {
        assert.ok(round.studyWord && round.choices.includes(round.studyWord), where);
      } else if (mechanicId === "soundBoxes") {
        assert.ok(round.word && round.graphemes?.length > 0, where);
        assert.equal(round.graphemes.join(""), round.word, where);
      } else if (mechanicId === "wordMachine") {
        assert.ok(["substituteOnset", "removeOnset", "joinCompound"].includes(round.operation), where);
        assert.ok(round.beforeGraphemes?.length > 0 && round.afterGraphemes?.length > 0, where);
      } else if (mechanicId === "poemSpotlight") {
        assert.ok(round.lines?.length > 0 && round.tokens?.length === round.lines.length, where);
        assert.ok(Number.isInteger(round.targetToken?.lineIndex), where);
        assert.ok(Number.isInteger(round.targetToken?.tokenIndex), where);
      } else if (mechanicId === "coverClue") {
        assert.ok(round.strip?.text, where);
        assert.equal(round.strip?.kind, "title", where);
        assert.ok(round.targetCover?.cover, where);
        assert.ok(round.covers?.length >= 2, where);
        assert.ok(round.covers.some(cover => cover.matches), where);
        assert.equal("choices" in round, false, `${where} must not expose a detached answer grid`);
        assert.equal("answer" in round, false, `${where} must not retain a character-name answer`);
        assert.equal("choiceStyle" in round, false, `${where} must not retain generic choice metadata`);
      } else if (mechanicId === "letterTrace") {
        assert.ok(round.letter, where);
      } else if (mechanicId === "patternSort") {
        assert.ok(round.items?.some(item => item.fits), where);
        assert.ok(round.items?.some(item => !item.fits), where);
      } else if (mechanicId === "wordChain") {
        assert.ok(round.fromGraphemes?.length > 0 && round.toGraphemes?.length > 0, where);
        assert.ok(Number.isInteger(round.changeIndex), where);
      } else if (mechanicId === "phraseFlow") {
        assert.ok(round.phraseChunks?.length >= 2, where);
      } else if (mechanicId === "heartWord") {
        assert.ok(round.word && round.graphemes?.join("") === round.word, where);
      }
    }
  }
});

test("equivalent spellings are accepted together or absent from Sound Gate choices", () => {
  const cycle24 = elSkillsBlockCycles.find(item => item.cycleNumber === 24);
  for (let pass = 0; pass < 200; pass += 1) {
    for (const round of buildStationRounds(cycle24, "sounds")) {
      for (const choice of round.choices) {
        if (!round.acceptedAnswers.includes(choice)) {
          assert.equal(
            sharesSound(choice, round.targetGrapheme),
            false,
            `${choice} cannot be marked wrong for the ${round.targetGrapheme} sound`
          );
        }
      }
    }
  }

  for (const cycleNumber of [13, 14, 21, 24]) {
    const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === cycleNumber);
    for (const round of buildStationRounds(cycle, "sounds")) {
      const equivalentChoices = round.choices.filter(choice => sharesSound(choice, round.targetGrapheme));
      assert.ok(equivalentChoices.every(choice => round.acceptedAnswers.includes(choice)));
    }
  }
});

test("printed prompts do not leak text targets or imply timed fluency", () => {
  for (const { round } of roundsForMechanic("wordChain")) {
    assert.ok(!round.prompt.toLowerCase().includes(round.toWord.toLowerCase()));
  }
  for (const { round } of roundsForMechanic("poemSpotlight")) {
    assert.ok(!round.prompt.toLowerCase().includes(round.answer.toLowerCase()));
  }
  for (const { round } of roundsForMechanic("phraseFlow")) {
    assert.equal("timerMs" in round, false);
    assert.equal("timeLimit" in round, false);
    assert.ok(!/fast|speed|timer/i.test(round.prompt));
  }
});

test("stable slots are truthfully renamed and unknown stations fail closed", () => {
  const cycle9 = elSkillsBlockCycles.find(item => item.cycleNumber === 9);
  const cycle15 = elSkillsBlockCycles.find(item => item.cycleNumber === 15);
  const cycle16 = elSkillsBlockCycles.find(item => item.cycleNumber === 16);
  const cycle22 = elSkillsBlockCycles.find(item => item.cycleNumber === 22);
  const cycle24 = elSkillsBlockCycles.find(item => item.cycleNumber === 24);
  const cycle25 = elSkillsBlockCycles.find(item => item.cycleNumber === 25);
  assert.equal(stationsForCycle(cycle9).find(item => item.id === "trace")?.title, "Letter & Code Trace");
  assert.equal(stationsForCycle(cycle15).find(item => item.id === "letters")?.title, "Code Spot");
  assert.equal(stationsForCycle(cycle15).find(item => item.id === "trace")?.title, "Code Trace");
  assert.equal(stationsForCycle(cycle16).find(item => item.id === "sounds")?.title, "Sound & Ending Gate");
  assert.equal(stationsForCycle(cycle22).find(item => item.id === "hunt")?.title, "Sound Sort");
  assert.equal(stationsForCycle(cycle24).find(item => item.id === "sounds")?.title, "Ending Sound Gate");
  assert.equal(stationsForCycle(cycle25).find(item => item.id === "speed")?.title, "Phrase Flow");
  assert.equal(stationsForCycle(cycle25).find(item => item.id === "spell")?.title, "Heart Word Studio");
  assert.equal(stationsForCycle(cycle15).find(item => item.id === "story")?.title, "Cover Clue");
  assert.throws(() => buildStationRounds(cycle15, "missing"), /unknown or ineligible/);
});

test("multi-letter ending rounds declare an ending construct", () => {
  const cycle16 = elSkillsBlockCycles.find(item => item.cycleNumber === 16);
  const allRounds = buildStationRounds(cycle16, "sounds")
    .filter(round => round.targetGrapheme === "all");

  assert.ok(allRounds.length > 0);
  assert.ok(allRounds.every(round => round.construct === "heard_ending_sound_family_mapping"));
});

test("every Pattern Sort round supplies labelled bins and a defensible transfer word", () => {
  for (const { cycle, station, round } of roundsForMechanic("patternSort")) {
    const where = `cycle ${cycle.cycleNumber}/${station.id}`;
    assert.equal(round.bins?.length, 2, `${where} needs two labelled bins`);
    assert.ok(round.bins.every(bin => bin.id && bin.label), `${where} has an unlabelled bin`);
    assert.ok(round.transferWord, `${where} has no transfer word`);
    assert.equal(
      round.items.some(item => item.word === round.transferWord),
      false,
      `${where} reuses its transfer word in the sort`
    );

    const transferFits = round.targetGrapheme
      ? round.transferWord.includes(round.targetGrapheme)
      : round.items.some(item => item.word === round.transferWord && item.fits)
        || round.patternLabel.includes("end with y") && round.transferWord.endsWith("y")
        || round.patternLabel.includes("end with -") && round.transferWord.endsWith(round.patternLabel.split("-").at(-1))
        || round.patternLabel.includes("have -") && round.transferWord.includes(round.patternLabel.split("-").at(-1))
        || round.patternLabel.includes("start with ") && round.transferWord.startsWith(round.patternLabel.split("start with ").at(-1));
    assert.equal(transferFits, true, `${where} transfer word does not fit ${round.patternLabel}`);
  }
});

test("Cover Clue exposes one title strip matched directly to its authoritative cover", () => {
  for (const { cycle, station, round } of roundsForMechanic("coverClue")) {
    const where = `cycle ${cycle.cycleNumber}/${station.id}`;
    assert.deepEqual(
      round.targetCover,
      round.covers.find(cover => cover.matches),
      `${where} matching cover must be the explicit target`
    );
    assert.equal(round.strip.text, round.targetCover.title, `${where} strip must name its cover`);
    assert.equal("choices" in round, false, `${where} detached choices remain`);
    assert.equal("answer" in round, false, `${where} detached answer remains`);
  }
});

test("high-frequency words alone never authorize a Pattern Power family", () => {
  const authorizedLabels = new Set([
    "start with sh",
    "have -ng",
    "end with -ll"
  ]);

  for (const cycleNumber of [25, 26, 27]) {
    const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === cycleNumber);
    const rounds = buildStationRounds(cycle, "pattern");
    assert.ok(rounds.length > 0, `cycle ${cycleNumber} lost all taught-pattern review`);
    for (const round of rounds) {
      assert.ok(
        authorizedLabels.has(round.patternLabel),
        `cycle ${cycleNumber} authorized ${round.patternLabel} from HFW membership alone`
      );
    }
  }
});

test("Code Spot uses taught-print sort words and a novel authorized transfer", () => {
  const cycle15 = elSkillsBlockCycles.find(item => item.cycleNumber === 15);
  for (let pass = 0; pass < 100; pass += 1) {
    const shRound = buildStationRounds(cycle15, "letters")
      .find(round => round.targetGrapheme === "sh");
    assert.ok(shRound, "cycle 15 needs an authorized sh Code Spot round");
    assert.equal(
      [...shRound.items.map(item => item.word), shRound.transferWord].includes("shell"),
      false,
      "shell contains the untaught ll spelling in cycle 15"
    );
  }

  for (const cycleNumber of [23, 24]) {
    const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === cycleNumber);
    for (let pass = 0; pass < 20; pass += 1) {
      for (const round of buildStationRounds(cycle, "letters")) {
        assert.equal(
          round.items.some(item => item.word === round.transferWord),
          false,
          `cycle ${cycleNumber}/${round.targetGrapheme} repeats ${round.transferWord}`
        );
      }
    }
  }
});
