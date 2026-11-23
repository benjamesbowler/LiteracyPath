import { loadGuidedReadingBookReviews, quarantinedGuidedReadingBookIds } from "../data/guidedReadingPublication.js";
import { decodableTextTokens } from "./guidedReading/decodableScope.js";
import { getBookTextAnalysis } from "./guidedReading/bookTextAnalysis.js";

const BOOK_ID = "small-steps-01";
const GAME_ID = "blend-and-build";
const FRESH_WORD = "tap";

export function buildShortVowelTeachingSequence({ book, game, starterFamilies = [], reviews }) {
  const starterWords = starterFamilies.flatMap(([, ...words]) => words);
  const hasRimeRound = starterFamilies.some(([rime, ...words]) => rime === "at" && words.includes("cat"));
  const gameReady = game?.id === GAME_ID && !game.hidden && hasRimeRound;
  const page = book?.pages?.find(item => item.pageNumber === 1 && decodableTextTokens(item.text).includes("cat"));
  const bookReady = reviews?.complete && book?.id === BOOK_ID && book.decodableScope?.afterCycle
    && page?.image && !quarantinedGuidedReadingBookIds(reviews.rows).includes(book.id)
    && getBookTextAnalysis(book).status === "current";
  const bookWords = (book?.pages || []).flatMap(item => decodableTextTokens(item.text));
  const checkReady = gameReady && bookReady && !starterWords.includes(FRESH_WORD) && !bookWords.includes(FRESH_WORD);

  return {
    game: gameReady ? { id: game.id, title: game.title } : null,
    book: bookReady ? { id: book.id, title: book.title, text: page.text, afterCycle: book.decodableScope.afterCycle } : null,
    checkWord: checkReady ? FRESH_WORD : "",
    plan: checkReady
      ? `Blend & Build, first difficulty: build cat in the -at family. Read page 1 of ${book.title} together. Later, if tap is fresh for each pupil, show tap without a picture or spoken cue. Record the result separately.`
      : ""
  };
}

export async function loadShortVowelTeachingSequence(client) {
  const [reviews, { getRuntimeGuidedReadingBooks }, { GAME_LIST }, { BUILDING_FAMILIES }] = await Promise.all([
    loadGuidedReadingBookReviews({ client }),
    import("./guidedReading/runtimeBooks.js"),
    import("../data/learnGamesData.js"),
    import("../components/learn/games/games/phonicsBuildingRounds.js")
  ]);
  return buildShortVowelTeachingSequence({
    reviews,
    book: getRuntimeGuidedReadingBooks().find(book => book.id === BOOK_ID),
    game: GAME_LIST.find(game => game.id === GAME_ID),
    starterFamilies: BUILDING_FAMILIES.easy
  });
}
