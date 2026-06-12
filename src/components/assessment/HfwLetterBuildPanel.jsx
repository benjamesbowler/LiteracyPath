import { useState } from "react";

function getHfwLetterBuildTarget(question = {}) {
  return String(question.targetWord || question.correctAnswer || question.answer || "")
    .trim()
    .toLowerCase();
}

export function HfwLetterBuildPanel({ currentQuestion, answerQuestion, speakText }) {
  // Keyed by question id so tiles reset naturally on a new question.
  const [tileState, setTileState] = useState({ questionId: null, tiles: [] });
  const selectedTiles = tileState.questionId === currentQuestion.id ? tileState.tiles : [];
  const setSelectedTiles = updater => setTileState(previous => {
    const current = previous.questionId === currentQuestion.id ? previous.tiles : [];
    const tiles = typeof updater === "function" ? updater(current) : updater;
    return { questionId: currentQuestion.id, tiles };
  });
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const targetWord = getHfwLetterBuildTarget(currentQuestion);
  const targetLength = targetWord.length || Number(currentQuestion.blankSlots) || 0;
  const rawTiles = currentQuestion.letterTiles || currentQuestion.soundTiles || [];
  const tiles = rawTiles.length > 0
    ? rawTiles
    : targetWord.split("");
  const selectedIndexes = new Set(selectedTiles.map(item => item.index));
  const builtWord = selectedTiles.map(item => item.tile).join("").toLowerCase();
  const sentence = String(currentQuestion.sentence || currentQuestion.context || currentQuestion.passage || "")
    .replace(/_{2,}/g, "___");
  const [sentenceBefore, sentenceAfter = ""] = sentence.includes("___")
    ? sentence.split("___")
    : ["", sentence];
  const sentenceAudioText = String(currentQuestion.sentenceAudio || currentQuestion.sentenceText || currentQuestion.fullSentence || currentQuestion.spokenPrompt || "")
    .trim();

  function addTile(tile, index) {
    if (selectedIndexes.has(index) || selectedTiles.length >= targetLength) return;
    setSelectedTiles(previous => [...previous, { tile: String(tile || "").toLowerCase(), index }]);
  }

  function removeTile(index) {
    setSelectedTiles(previous => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleDragStart(event, index) {
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event) {
    event.preventDefault();
    const tileIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isInteger(tileIndex)) return;
    addTile(tiles[tileIndex], tileIndex);
  }

  async function playSentence() {
    if (!sentenceAudioText || !speakText || isPlayingSentence) return;
    setIsPlayingSentence(true);
    try {
      await speakText(sentenceAudioText, "", { allowBrowserFallback: true });
    } finally {
      setTimeout(() => setIsPlayingSentence(false), 800);
    }
  }

  return (
    <div className="ixl-template-panel hfw-letter-build-panel">
      {sentenceAudioText && (
        <button
          className="assessment-audio-button mini-audio-button hfw-sentence-audio-button"
          disabled={isPlayingSentence}
          onClick={playSentence}
          type="button"
          aria-label={isPlayingSentence ? "Sentence playing" : "Listen to sentence"}
        >
          <span aria-hidden="true">{isPlayingSentence ? "…" : "🔊"}</span>
        </button>
      )}

      <div
        className="hfw-letter-build-sentence"
        onDragOver={event => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span>{sentenceBefore}</span>
        <span className="hfw-letter-build-slots" aria-label="Built word">
          {Array.from({ length: targetLength }, (_, index) => {
            const selected = selectedTiles[index];
            return selected ? (
              <button
                className="sound-order-selected-tile hfw-letter-slot filled"
                key={`${selected.tile}-${selected.index}`}
                onClick={() => removeTile(index)}
                type="button"
                aria-label={`Remove ${selected.tile}`}
              >
                {selected.tile}
              </button>
            ) : (
              <span
                className="sound-order-empty-slot hfw-letter-slot"
                key={`empty-${index}`}
                aria-hidden="true"
              />
            );
          })}
        </span>
        <span>{sentenceAfter}</span>
      </div>

      <div className="sound-order-tile-row hfw-letter-tile-row" aria-label="Choose letters">
        {tiles.map((tile, index) => {
          const disabled = selectedIndexes.has(index) || selectedTiles.length >= targetLength;
          return (
            <button
              className="sound-order-tile"
              disabled={disabled}
              draggable={!disabled}
              key={`${tile}-${index}`}
              onClick={() => addTile(tile, index)}
              onDragStart={event => handleDragStart(event, index)}
              type="button"
              aria-label={`Add ${tile}`}
            >
              {tile}
            </button>
          );
        })}
      </div>

      <div className="button-row ixl-template-actions">
        <button
          className="reset-button"
          onClick={() => setSelectedTiles([])}
          type="button"
        >
          Reset
        </button>
        <button
          className="main-button"
          disabled={builtWord.length !== targetLength}
          onClick={() => answerQuestion(builtWord)}
          type="button"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
