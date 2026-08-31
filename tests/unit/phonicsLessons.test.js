import assert from "node:assert/strict";
import test from "node:test";

import { getLessonByLetter, lessons } from "../../src/data/phonicsLessons.js";

test("Letter A uses a true short-a example instead of r-controlled ark", () => {
  const lesson = getLessonByLetter("a");
  const targetWords = lesson.words.map(word => word.word);

  assert.equal(targetWords.includes("ark"), false);

  const alligator = lesson.words.find(word => word.word === "alligator");
  assert.ok(alligator, "Letter A should include alligator as the fourth short-a example");
  assert.match(alligator.image, /alligator/);
  assert.match(alligator.audio, /alligator/);
  assert.equal(alligator.phonemeBreakdown, "a-a-alligator");
});

test("Letter O uses familiar classroom examples and excludes olive and otter", () => {
  const lesson = getLessonByLetter("o");
  const targetWords = lesson.words.map(word => word.word);

  assert.deepEqual(targetWords, ["orange", "ox", "octopus"]);

  for (const rejected of ["oil", "olive", "otter"]) {
    assert.equal(targetWords.includes(rejected), false, `${rejected} should not be in the basic O lesson`);
  }

  for (const [example, breakdown] of [
    ["orange", "o-o-orange"],
    ["ox", "o-o-ox"],
    ["octopus", "o-o-octopus"]
  ]) {
    const target = lesson.words.find(word => word.word === example);
    assert.ok(target, `Letter O should include ${example}`);
    assert.match(target.image, new RegExp(example));
    assert.match(target.audio, new RegExp(example));
    assert.equal(target.phonemeBreakdown, breakdown);
  }
});

test("basic Letter Sounds lessons cannot restore obscure or ambiguous picture words", () => {
  const lessonWords = lessons.flatMap(level => level.letters.flatMap(letter => [
    ...letter.words.map(word => word.word),
    ...letter.distractors.map(word => word.word)
  ]));

  for (const rejected of ["ark", "olive", "otter", "quiz", "uncle", "vet", "yak", "yarn"] ) {
    assert.equal(lessonWords.includes(rejected), false, `${rejected} should not appear in Letter Sounds`);
  }

  assert.deepEqual(getLessonByLetter("q").words.map(word => word.word), ["queen", "quilt"]);
  assert.deepEqual(getLessonByLetter("u").words.map(word => word.word), ["umbrella", "up", "under"]);
  assert.deepEqual(getLessonByLetter("v").words.map(word => word.word), ["van", "vest", "vase"]);
  assert.deepEqual(getLessonByLetter("y").words.map(word => word.word), ["yo-yo", "yawn", "yell", "yum"]);
});
