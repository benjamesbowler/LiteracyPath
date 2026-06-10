import { prepareNaturalSpeechText } from "../../audioSpeechPolicy.js";

let preferredVoice = null;

function scoreVoice(voice) {
  const name = String(voice?.name || "").toLowerCase();
  const lang = String(voice?.lang || "").toLowerCase();
  let score = 0;

  if (lang === "en-us") score += 40;
  else if (lang.startsWith("en-")) score += 24;
  if (voice?.localService) score += 8;
  if (name.includes("google us english")) score += 50;
  if (name.includes("samantha")) score += 44;
  if (name.includes("ava")) score += 36;
  if (name.includes("allison")) score += 32;
  if (name.includes("enhanced") || name.includes("premium") || name.includes("natural")) score += 12;

  return score;
}

function getPreferredVoice() {
  if (preferredVoice) return preferredVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices?.() || [];
  preferredVoice = voices
    .filter(voice => String(voice.lang || "").toLowerCase().startsWith("en"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;

  return preferredVoice;
}

export function speakWithBrowser(text, options = {}) {
  if (!text || typeof window === "undefined") return false;
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return false;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(prepareNaturalSpeechText(text));
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.warn("Browser speech synthesis failed.", error);
    return false;
  }
}

export function resetPreferredBrowserVoiceForTests() {
  preferredVoice = null;
}
