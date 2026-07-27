import { APP_VIEWS } from "../appState/appViews.js";

export const CHILD_SURFACE_RULES_VERSION = "2026.07.24";

export const CHILD_SURFACE_REQUIRED_REGIONS = Object.freeze([
  "title",
  "instruction",
  "choices",
  "progress",
  "primary"
]);

export const CHILD_SURFACE_ROUTES = Object.freeze([
  {
    id: "student-login",
    label: "Student sign in",
    appView: APP_VIEWS.STUDENT_LOGIN
  },
  {
    id: "student-home",
    label: "Student home",
    appView: APP_VIEWS.STUDENT_HOME
  },
  {
    id: "phonics",
    label: "Phonics",
    appView: APP_VIEWS.PHONICS_LEARN
  },
  {
    id: "arcade",
    label: "Arcade",
    appView: APP_VIEWS.PHONICS_LEARN,
    mode: "games"
  },
  {
    id: "adventure-map",
    label: "Adventure Map",
    appView: APP_VIEWS.SKILLS_BLOCK_QUEST
  },
  {
    id: "sound-seekers",
    label: "Sound Seekers",
    appView: APP_VIEWS.PHONICS_QUEST
  },
  {
    id: "story-quests",
    label: "Story Quests",
    appView: APP_VIEWS.LEARN
  },
  {
    id: "reading-library",
    label: "Reading Library",
    appView: APP_VIEWS.GUIDED_READING
  },
  {
    id: "my-hollow",
    label: "My Hollow",
    appView: APP_VIEWS.STUDENT_REWARDS
  }
]);

export function validateChildSurfaceRegions(regions = {}) {
  const missing = CHILD_SURFACE_REQUIRED_REGIONS.filter(region => {
    const count = Number(regions[region]) || 0;
    return region === "primary" ? count !== 1 : count < 1;
  });
  return Object.freeze({
    pass: missing.length === 0,
    missing: Object.freeze(missing)
  });
}
