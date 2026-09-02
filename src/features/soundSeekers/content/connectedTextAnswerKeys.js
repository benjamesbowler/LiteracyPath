const assessed = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19,
  21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34, 36, 37, 38, 39];
const expectedLetters = ["b", "a", "c", "b", "c", "a", "b", "c", "a", "c", "b", "a",
  "b", "c", "a", "b", "c", "a", "b", "c", "a", "b", "c", "a", "b", "c", "a", "b",
  "c", "a", "b", "c"];
const focus = ["mat", "dad", "lid", "bun", "fox", "bell", "fish", "box", "rock", "lamp", "swim",
  "flag", "sky", "train", "whale", "bike", "mule", "run", "rain", "tree", "boat", "moon", "book",
  "sound", "star", "storm", "bird", "chair", "picture", "words", "cats", "bridge"];

const freezeMap = value => Object.freeze(Object.fromEntries(Object.entries(value)));

export const CONNECTED_TEXT_DECISION_FEEDBACK = Object.freeze(Object.fromEntries(
  assessed.map((index, offset) => {
    const sceneId = `scene-s${index}`;
    const expected = `ct-s${index}-${expectedLetters[offset]}`;
    const tokens = ["a", "b", "c"].map(letter => `ct-s${index}-${letter}`);
    const misses = tokens.filter(token => token !== expected);
    const subject = focus[offset];
    return [sceneId, Object.freeze({
      forbiddenPromptTokens: Object.freeze([subject]),
      misconceptionByToken: freezeMap({
        [misses[0]]: `unsupported_${subject}_action`,
        [misses[1]]: `delayed_${subject}_action`
      }),
      correctionByToken: freezeMap({
        [misses[0]]: `Read again. Find the action for the ${subject}.`,
        [misses[1]]: `Look at the words about the ${subject}.`
      }),
      rationaleByToken: freezeMap(Object.fromEntries(tokens.map(token => [token,
        token === expected
          ? `The words support the ${subject} repair.`
          : `This ${subject} action is not supported by the words.`
      ])))
    })];
  })
));
