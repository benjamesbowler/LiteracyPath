import { filterPublishedGuidedReadingBooks, loadGuidedReadingBookReviews, quarantinedGuidedReadingBookIds } from "../data/guidedReadingPublication.js";
import { decodableTextTokens } from "./guidedReading/decodableScope.js";
import { getBookTextAnalysis } from "./guidedReading/bookTextAnalysis.js";

const BOOK_ID = "small-steps-01";
const GAME_ID = "blend-and-build";
const FRESH_WORD = "tap";

export function buildShortVowelTeachingSequence({ book, game, starterFamilies = [], wordPicture, bookPictureReady = true, reviews }) {
  const starterWords = starterFamilies.flatMap(([, ...words]) => words);
  const hasRimeRound = starterFamilies.some(([rime, ...words]) => rime === "at" && words.includes("cat"));
  const gameReady = game?.id === GAME_ID && !game.hidden && hasRimeRound && Boolean(wordPicture);
  const page = book?.pages?.find(item => item.pageNumber === 1 && decodableTextTokens(item.text).includes("cat"));
  const [publishedBook] = filterPublishedGuidedReadingBooks(book ? [book] : [],
    reviews?.complete ? quarantinedGuidedReadingBookIds(reviews.rows) : null);
  const bookReady = publishedBook?.id === BOOK_ID && publishedBook.decodableScope?.afterCycle
    && page?.image && bookPictureReady && getBookTextAnalysis(publishedBook).status === "current";
  const bookWords = (book?.pages || []).flatMap(item => decodableTextTokens(item.text));
  const checkReady = gameReady && bookReady && !starterWords.includes(FRESH_WORD) && !bookWords.includes(FRESH_WORD);

  return {
    game: gameReady ? { id: game.id, title: game.title } : null,
    book: bookReady ? { id: book.id, title: book.title, text: page.text, afterCycle: book.decodableScope.afterCycle } : null,
    checkWord: checkReady ? FRESH_WORD : "",
    plan: checkReady
      ? `In Blend & Build, choose the first difficulty. Join c to at and blend cat. Read page 1 of ${book.title} together. Later, if tap is fresh for each pupil, show tap without a picture or spoken cue. Record the result separately.`
      : ""
  };
}

async function verifiedPicture(sources) {
  for (const source of sources.filter(Boolean)) {
    if (typeof Image === "undefined") return source;
    const loaded = await new Promise(resolve => {
      const image = new Image();
      const timer = setTimeout(() => finish(false), 4000);
      function finish(ok) {
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        resolve(ok);
      }
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.src = source;
    });
    if (loaded) return source;
  }
  return "";
}

export async function loadShortVowelTeachingSequence(client) {
  const [reviews, { getRuntimeGuidedReadingBooks }, { GAME_LIST }, { BUILDING_FAMILIES }, { getChildWordAsset }] = await Promise.all([
    loadGuidedReadingBookReviews({ client }),
    import("./guidedReading/runtimeBooks.js"),
    import("../data/learnGamesData.js"),
    import("../components/learn/games/games/phonicsBuildingRounds.js"),
    import("../data/childAssets.js")
  ]);
  const cat = getChildWordAsset("cat");
  const book = getRuntimeGuidedReadingBooks().find(book => book.id === BOOK_ID);
  const quarantines = reviews?.complete ? quarantinedGuidedReadingBookIds(reviews.rows) : null;
  const [publishedBook] = filterPublishedGuidedReadingBooks(book ? [book] : [], quarantines);
  const page = publishedBook?.pages.find(item => item.pageNumber === 1);
  const [wordPicture, bookPicture] = await Promise.all([
    verifiedPicture([cat?.image, cat?.fallbackImage]),
    verifiedPicture([page?.image])
  ]);
  return buildShortVowelTeachingSequence({
    reviews,
    wordPicture,
    bookPictureReady: Boolean(bookPicture),
    book: publishedBook,
    game: GAME_LIST.find(game => game.id === GAME_ID),
    starterFamilies: BUILDING_FAMILIES.easy
  });
}
