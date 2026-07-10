// Student profile: the chosen companion (avatar). Stored per student and
// synced to the cloud with the rest of their progress.
import { queueProgressSave } from "./progressSync.js";

// Companions are the stars of our own reader series - one per series, so a
// child's buddy is always a character from books they can actually read.
// Chosen once at first login; changed later only via the account menu.
export const COMPANIONS = [
  { id: "fluff", name: "Fluff", series: "Bob and Nan", image: "/images/companions/fluff.webp" },
  { id: "chips", name: "Chips", series: "James and Anna", image: "/images/companions/chips.webp" },
  { id: "socks", name: "Socks", series: "Aiden and Betty", image: "/images/companions/socks.webp" },
  { id: "chompy", name: "Chompy", series: "Dino Pals", image: "/images/companions/chompy.webp" },
  { id: "muddy", name: "Muddy", series: "Meadow Pals", image: "/images/companions/muddy.webp" },
  { id: "pip", name: "Pip", series: "Moonwood Tales", image: "/images/companions/pip.webp" }
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

export function getCollectibles(scope) {
  return loadStudentProfile(scope).collectibles || [];
}

export function awardCollectible(scope, collectible) {
  const profile = loadStudentProfile(scope);
  const existing = profile.collectibles || [];
  if (existing.some(item => item.key === collectible.key)) return null;
  const next = [...existing, { ...collectible, earnedAt: new Date().toISOString() }];
  saveStudentProfile(scope, { ...profile, collectibles: next });
  return collectible;
}

export function setCompanion(scope, companionId) {
  const profile = loadStudentProfile(scope);
  saveStudentProfile(scope, { ...profile, companionId, companionChosenAt: new Date().toISOString() });
}
