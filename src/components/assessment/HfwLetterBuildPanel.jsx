import ActivityButton from "../ActivityButton.jsx";
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from "../../data/ledaProductionAudio.js";
import { useState } from "react";
import { AssessmentAudioButton } from "./AssessmentAudioButton.jsx";
import { AssessmentConstructionStatus } from "./AssessmentConstructionStatus.jsx";
import { useAssessmentCompletion } from "./useAssessmentCompletion.js";

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
  const { complete, pending, error, retry } = useAssessmentCompletion(currentQuestion.id, answerQuestion);
  const targetWord = getHfwLetterBuildTarget(currentQuestion);
  const targetLength = targetWord.length || Number(currentQuestion.blankSlots) || 0;
  const rawTiles = currentQuestion.letterTiles || currentQuestion.soundTiles || [];
  const tiles = rawTiles.length > 0
    ? rawTiles
    : targetWord.split("");
  const selectedIndexes = new Set(selectedTiles.map(item => item.index));
  const sentence = String(currentQuestion.sentence || currentQuestion.context || currentQuestion.passage || "")
    .replace(/_{2,}/g, "___");
  const [sentenceBefore, sentenceAfter = ""] = sentence.includes("___")
    ? sentence.split("___")
    : ["", sentence];
  const sentenceAudioText = String(currentQuestion.sentenceAudio || currentQuestion.sentenceText || currentQuestion.fullSentence || currentQuestion.spokenPrompt || "")
    .trim();

  function addTile(tile, index) {
    if (pending || selectedIndexes.has(index) || selectedTiles.length >= targetLength || !tiles[index]) return;
    const next = [...selectedTiles, { tile: String(tile || "").toLowerCase(), index }];
    setSelectedTiles(next);
    if (next.length === targetLength) complete(next.map(item => item.tile).join(""));
  }

  function removeTile(index) {
    if (pending) return;
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

  return (
    <div className="ixl-template-panel hfw-letter-build-panel" aria-busy={pending}>
      {sentenceAudioText && (
        <AssessmentAudioButton
          text={sentenceAudioText}
          audioPath={getLedaInstructionAudioPath(sentenceAudioText) || getLedaWordAudioPath(sentenceAudioText) || currentQuestion.sentenceAudioPath || currentQuestion.contextAudioPath || ""}
          speakText={speakText}
          label="Listen to sentence"
          displayLabel="Hear sentence"
          className="mini-audio-button hfw-sentence-audio-button"
        />
      )}

      <div
        className="hfw-letter-build-sentence"
        onDragOver={event => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span>{sentenceBefore}</span>
        <span className="hfw-letter-build-slots wa-slots" aria-label="Built word">
          {Array.from({ length: targetLength }, (_, index) => {
            const selected = selectedTiles[index];
            return selected ? (
              <ActivityButton
                className="sound-order-selected-tile hfw-letter-slot filled"
                disabled={pending}
                key={`${selected.tile}-${selected.index}`}
                onClick={() => removeTile(index)}
                type="button"
                aria-label={`Remove ${selected.tile}`}
              >
                {selected.tile}
              </ActivityButton>
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

      <div className="sound-order-tile-row hfw-letter-tile-row" role="group" aria-label="Choose letters">
        {tiles.map((tile, index) => {
          const disabled = pending || selectedIndexes.has(index) || selectedTiles.length >= targetLength;
          return (
            <ActivityButton
              className="sound-order-tile wa-choice"
              disabled={disabled}
              draggable={!disabled}
              key={`${tile}-${index}`}
              onClick={() => addTile(tile, index)}
              onDragStart={event => handleDragStart(event, index)}
              type="button"
              aria-label={`Add ${tile}`}
            >
              {tile}
            </ActivityButton>
          );
        })}
      </div>

      <AssessmentConstructionStatus pending={pending} error={error} onRetry={retry} readyText="Word ready…">
        {`Tap letters in order. ${selectedTiles.length} of ${targetLength} placed.`}
      </AssessmentConstructionStatus>
    </div>
  );
}
