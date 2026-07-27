export const STUDENT_DEVICE_MATRIX_VERSION = "2026.07.24";

export const STUDENT_DEVICE_PROFILES = Object.freeze([
  Object.freeze({
    id: "small-phone-portrait",
    family: "small-phone",
    orientation: "portrait",
    width: 320,
    height: 568
  }),
  Object.freeze({
    id: "small-phone-landscape",
    family: "small-phone",
    orientation: "landscape",
    width: 568,
    height: 320
  }),
  Object.freeze({
    id: "tablet-portrait",
    family: "tablet",
    orientation: "portrait",
    width: 768,
    height: 1024
  }),
  Object.freeze({
    id: "tablet-landscape",
    family: "tablet",
    orientation: "landscape",
    width: 1024,
    height: 768
  }),
  Object.freeze({
    id: "chromebook-landscape",
    family: "chromebook",
    orientation: "landscape",
    width: 1366,
    height: 768
  }),
  Object.freeze({
    id: "projector-landscape",
    family: "projector",
    orientation: "landscape",
    width: 1920,
    height: 1080
  })
]);

export const STUDENT_FULLSCREEN_DEVICE_IDS = Object.freeze([
  "small-phone-landscape",
  "tablet-portrait",
  "chromebook-landscape",
  "projector-landscape"
]);

export const STUDENT_SOFTWARE_KEYBOARD_VIEWPORTS = Object.freeze([
  Object.freeze({
    id: "small-phone-keyboard-portrait",
    orientation: "portrait",
    width: 320,
    height: 340
  }),
  Object.freeze({
    id: "small-phone-keyboard-landscape",
    orientation: "landscape",
    width: 568,
    height: 260
  })
]);

export const STUDENT_MINIMUM_TARGET_PX = 44;
