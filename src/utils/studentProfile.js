// Student profile: the chosen companion (avatar). Stored per student and
// synced to the cloud with the rest of their progress.
import { queueProgressSave } from "./progressSync.js";

export const COMPANIONS = [
  { id: "fox", name: "Fox", image: "/images/child-mode/short-o/fox.png" },
  { id: "bear", name: "Bear", image: "/images/child-mode/initial-sounds/bear.png" },
  { id: "frog", name: "Frog", image: "/images/child-mode/blends/frog.png" },
  { id: "duck", name: "Duck", image: "/images/child-mode/short-u/duck.png" },
  { id: "cat", name: "Cat", image: "/images/child-mode/cvc/cat.png" },
  { id: "dog", name: "Dog", image: "/images/child-mode/cvc/dog.png" },
  { id: "bee", name: "Bee", image: "/images/child-mode/vowel-teams/bee.png" },
  { id: "phinny", name: "Phinny", image: "/images/learn-games/phinny-waving.png" }
];

function storageKey(scope) {
  return `lp-student-profile:${scope || "default"}`;
}

export function loadStudentProfile(scope) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(scope)) || "null") || {};
  } catch {
    return {};
  }
}

export function saveStudentProfile(scope, profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(scope), JSON.stringify(profile));
  } catch {
    // Best effort; cloud sync still queues.
  }
  queueProgressSave("profile", "__all__", { v: 1, ...profile }, { scopeKey: scope });
}

export function getCompanion(scope) {
  const profile = loadStudentProfile(scope);
  return COMPANIONS.find(item => item.id === profile.companionId) || null;
}

export function setCompanion(scope, companionId) {
  const profile = loadStudentProfile(scope);
  saveStudentProfile(scope, { ...profile, companionId, companionChosenAt: new Date().toISOString() });
}
