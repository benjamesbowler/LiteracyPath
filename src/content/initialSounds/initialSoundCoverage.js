import {
  INITIAL_SOUND_LETTERS,
  initialSoundBankSummary,
  initialSoundWordBank
} from "./initialSoundWordBank.js";

export function getInitialSoundCoverage({ assetExists = () => true } = {}) {
  const rows = INITIAL_SOUND_LETTERS.map(letter => {
    const items = initialSoundWordBank.filter(item => item.letter === letter);
    const level1 = items.filter(item => item.level === 1);
    const level2 = items.filter(item => item.level === 2);
    const missingImages = items.filter(item => !item.imageUrl || !assetExists(item.imageUrl));
    const missingAudio = items.filter(item => !item.audioUrl || !assetExists(item.audioUrl));
    const inactive = items.filter(item => item.active === false);

    return {
      letter,
      total: items.length,
      level1: level1.length,
      level2: level2.length,
      missingImageCount: missingImages.length,
      missingAudioCount: missingAudio.length,
      inactiveCount: inactive.length,
      warnings: [
        level1.length < 10 ? "fewer than 10 Level 1 words" : "",
        level2.length < 10 ? "fewer than 10 Level 2 words" : "",
        missingImages.length ? `${missingImages.length} missing images` : "",
        missingAudio.length ? `${missingAudio.length} missing audio files` : ""
      ].filter(Boolean)
    };
  });

  return {
    expectedLetters: INITIAL_SOUND_LETTERS,
    totalItems: initialSoundWordBank.length,
    level1Items: initialSoundWordBank.filter(item => item.level === 1).length,
    level2Items: initialSoundWordBank.filter(item => item.level === 2).length,
    inactiveItems: initialSoundWordBank.filter(item => item.active === false).length,
    missingImages: rows.reduce((sum, row) => sum + row.missingImageCount, 0),
    missingAudio: rows.reduce((sum, row) => sum + row.missingAudioCount, 0),
    rows,
    summary: initialSoundBankSummary
  };
}

export function getInitialSoundCoverageWarnings(options) {
  return getInitialSoundCoverage(options).rows.flatMap(row =>
    row.warnings.map(warning => `${row.letter}: ${warning}`)
  );
}
