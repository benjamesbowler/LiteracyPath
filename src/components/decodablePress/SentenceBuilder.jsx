import { analyzeSentenceDecodability } from "../../utils/decodablePress/analyzeSentenceDecodability.js";

export function SentenceBuilder({ pageNumber, prompt, value, wordBank, highFrequencyWords, approvedChallenges, onChange, disabled = false }) {
  const analysis = analyzeSentenceDecodability({ sentence: value, decodableWords: wordBank, knownHighFrequencyWords: highFrequencyWords, approvedChallenges });
  return <div className="press-sentence-builder"><label htmlFor={`press-page-${pageNumber}`}><strong>Page {pageNumber}: {prompt.label}</strong><span>Starter: {prompt.frame}</span></label><textarea disabled={disabled} id={`press-page-${pageNumber}`} maxLength="240" value={value} onChange={event => onChange(event.target.value)} placeholder="Write one or two short sentences." /><div className="press-word-feedback" aria-live="polite">{analysis.needsReview.length ? <><strong>Keep your idea.</strong> Ask your teacher for help with: {analysis.needsReview.join(", ")}.</> : value.trim() ? <span>Every word is in this project’s bank or approved known-word list.</span> : <span>Your words will be checked here without changing or deleting them.</span>}</div></div>;
}
