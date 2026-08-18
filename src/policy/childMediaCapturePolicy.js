// Product-wide privacy boundary: Literacy Guide never records or captures a
// child's voice, face, photo, or video. Learning interactions must use taps,
// tiles, teacher observations, or child-authored text/drawing data instead.
export const CHILD_MEDIA_CAPTURE_POLICY = Object.freeze({
  recordChildVoice: false,
  captureChildPhoto: false,
  captureChildVideo: false,
  useSpeechRecognition: false
});

export function childMediaCaptureIsAllowed() {
  return false;
}
