export const MATHS_PERFORMED_SONG_RELEASE_STATUSES = Object.freeze([
  "accepted-until-flagged",
  "approved"
]);

const createSong = ({ id, title, skillIds, tempo, lyrics, performance = {} }) => {
  const publicBase = `/audio/music/maths/songs/${id}`;
  return Object.freeze({
    id,
    title,
    skillIds: Object.freeze([...skillIds]),
    tempo,
    lyrics,
    media: Object.freeze({
      performed: Object.freeze({
        publicPath: `${publicBase}-performed.mp3`,
        captionsPath: `${publicBase}-lyrics.vtt`,
        creditsPath: `${publicBase}-credits.json`,
        releaseStatus: performance.releaseStatus || "planned",
        provider: performance.provider || "Suno",
        provenance: Object.freeze({
          providerTrackId: performance.providerTrackId || "",
          modelVersion: performance.modelVersion || "",
          generatedAt: performance.generatedAt || "",
          selectedAt: performance.selectedAt || "",
          sourceFileSha256: performance.sourceFileSha256 || "",
          rightsBasis: performance.rightsBasis || "",
          vocals: "adult-or-synthetic-adult",
          childVoiceOrImage: false
        })
      }),
      fallback: Object.freeze({
        instrumentalPath: `${publicBase}-instrumental.mp3`,
        guideRequestId: `song:${id}:guide`,
        creditsPath: `${publicBase}-credits.json`,
        releaseStatus: "accepted-until-flagged",
        label: "Backing track with adult lyric guide"
      })
    })
  });
};

export const mathsSongs = Object.freeze([
  createSong({
    id: "step-and-count-to-twenty", title: "Step and Count to Twenty", skillIds: ["F-N-SEQ-20"], tempo: 104,
    lyrics: `One, two, step with you,\nThree, four, touch the floor,\nFive, six, gentle kicks,\nSeven, eight, stand up straight,\nNine, ten, start again.\n\nEleven, twelve, reach the shelf,\nThirteen, fourteen, march between,\nFifteen, sixteen, keep the beat,\nSeventeen, eighteen, move your feet,\nNineteen, twenty — stop! We counted plenty.\n\nOne word, one step, keep them side by side.\nThe last number tells how many in the line.`,
    performance: {
      releaseStatus: "accepted-until-flagged",
      provider: "Suno",
      providerTrackId: "bb678526-aab1-4aa9-b449-7fde13bbc53a",
      modelVersion: "chirp-fenix-t4",
      generatedAt: "2026-08-14T12:35:36Z",
      selectedAt: "2026-08-14T12:50:21Z",
      sourceFileSha256: "ba1765fa6d7788b1c05b347c2737aa72ce08dba2fc9a21f26ebea7f1eae178a8",
      rightsBasis: "Authorised Suno account export supplied by the product owner; original LiteracyPath lyrics; embedded Suno C2PA provenance."
    }
  }),
  createSong({
    id: "five-and-some-more", title: "Five and Some More", skillIds: ["F-N-SUBITISE-5", "F-N-PART-10"], tempo: 92,
    lyrics: `Five in the frame and one down low:\nFive and one makes six — I know.\nFive in the frame and two in view:\nFive and two makes seven — true.\nFive and three makes eight for me.\nFive and four makes nine once more.\nFive and five makes ten — full frame!\nSee the five, then add the same.`,
    performance: {
      releaseStatus: "accepted-until-flagged",
      provider: "Suno",
      providerTrackId: "6f07d202-76ba-4572-8184-0e3a8809c994",
      modelVersion: "chirp-fenix-t4",
      generatedAt: "2026-08-14T12:39:45Z",
      selectedAt: "2026-08-14T12:50:21Z",
      sourceFileSha256: "092bec2de91f1efeff022e6187088b824e302d5c719e2b78f164381934bd86dd",
      rightsBasis: "Authorised Suno account export supplied by the product owner; original LiteracyPath lyrics; embedded Suno C2PA provenance."
    }
  }),
  createSong({
    id: "friends-of-ten", title: "Friends of Ten", skillIds: ["F-N-PART-10"], tempo: 112,
    lyrics: `Zero needs a friend. Ten!\nOne needs a friend. Nine!\nTwo needs a friend. Eight!\nThree needs a friend. Seven!\nFour needs a friend. Six!\nFive meets five in the middle. Every pair makes ten!\n\nParts can change, the whole stays ten.\nBreak it, make it, build it again.`
  }),
  createSong({
    id: "one-touch-one-count", title: "One Touch, One Count", skillIds: ["F-N-COUNT-10"], tempo: 96,
    lyrics: `Point to one and say one word.\nMove it over — count is heard.\nPoint to two, then three, then four.\nEvery object, once — no more.\n\nKeep the counted ones one side.\nLet each number be your guide.\nWhen the final word is said,\nThat tells how many are ahead.\n\nOne touch, one count, steady and clear.\nCheck the whole collection here.`
  }),
  createSong({
    id: "ten-and-extras", title: "Ten and the Extras", skillIds: ["F-N-COUNT-20"], tempo: 100,
    lyrics: `Build a ten, a full first row.\nKeep that ten where you can know.\nOne more makes eleven here.\nTwo more: twelve is bright and clear.\n\nTen and three is thirteen.\nTen and four is fourteen.\nTen and five is fifteen.\nCount the extras that are seen.\n\nSixteen, seventeen, eighteen, nineteen, twenty.\nFind the ten, then count some more — that tells how many.`
  }),
  createSong({
    id: "numeral-quantity-match", title: "Card and Collection", skillIds: ["F-N-MATCH"], tempo: 88,
    lyrics: `Turn a numeral card around.\nBuild the quantity it has named.\nOne counter for each count,\nStop when card and group are same.\n\nNumeral, quantity — make the match.\nCount it once and double-check.\nThe written mark and what you made\nTell the same amount today.\n\nSwap the card, rebuild the group.\nExplain the match and show your proof.`
  }),
  createSong({
    id: "pair-and-compare", title: "Pair and Compare", skillIds: ["F-N-COMPARE"], tempo: 108,
    lyrics: `One from here and one from there,\nLine them up to make a pair.\nKeep on pairing, side by side.\nLeftovers make the answer clear.\n\nMore has something left to show.\nFewer runs out first, we know.\nNothing left on either side?\nSame amount has been verified.\n\nDo not trust the longest row.\nPair and compare — then you know.`
  }),
  createSong({
    id: "whole-stays-five", title: "The Whole Stays Five", skillIds: ["F-N-PART-5"], tempo: 102,
    lyrics: `Five is the whole; split it in two.\nOne and four is one way to do.\nTwo and three makes five as well.\nMove the parts and check the whole.\n\nParts can trade from side to side.\nNo new counters come to hide.\nCount both parts and you will find:\nThe whole stays five every time.\n\nZero and five, four and one,\nThree and two — five is the sum.`
  })
]);
