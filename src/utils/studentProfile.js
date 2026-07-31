// Student profile: the chosen Little Literacy Guide (avatar). Stored per student and
// synced to the cloud with the rest of their progress.
import { queueProgressSave } from "./progressSync.js";

// Little Literacy Guides are the stars of our own reader series - one per
// series, so a child's guide is always a character from books they can read.
// Technical companion ids remain stable because they are already stored in
// student profiles and referenced by generated dress-up art.
export const COMPANIONS = [
  { id: "fluff", name: "Fluff", series: "Bob and Nan", image: "/images/companions/fluff.webp" },
  { id: "chips", name: "Chips", series: "James and Anna", image: "/images/companions/chips.webp" },
  { id: "socks", name: "Socks", series: "Aiden and Betty", image: "/images/companions/socks.webp" },
  { id: "chompy", name: "Chompy", series: "Dino Pals", image: "/images/companions/chompy.webp" },
  { id: "muddy", name: "Muddy", series: "Meadow Pals", image: "/images/companions/muddy.webp" },
  { id: "pip", name: "Pip", series: "Moonwood Tales", image: "/images/companions/pip.webp" }
];

export const LITTLE_LITERACY_GUIDE_CHANGE_COST = 10;

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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lp-student-profile-updated", {
      detail: { studentId: scope || "default", profile }
    }));
  }
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
  if (!COMPANIONS.some(item => item.id === companionId)) return null;
  const profile = loadStudentProfile(scope);
  const next = {
    ...profile,
    companionId,
    companionChosenAt: profile.companionChosenAt || new Date().toISOString()
  };
  saveStudentProfile(scope, next);
  return getCompanion(scope);
}

export function getAvailableGuideStars(scope, earnedStars = 0) {
  const profile = loadStudentProfile(scope);
  const spent = Math.max(0, Number(profile.guideStarsSpent) || 0);
  return Math.max(0, (Math.max(0, Number(earnedStars) || 0)) - spent);
}

// The first guide is free. Later changes happen only in My Hollow and spend
// earned stars. Keeping the spend in the synced profile means a second device
// cannot restore already-spent stars.
export function changeLittleLiteracyGuide(scope, companionId, {
  earnedStars = 0,
  cost = LITTLE_LITERACY_GUIDE_CHANGE_COST
} = {}) {
  const nextGuide = COMPANIONS.find(item => item.id === companionId) || null;
  if (!nextGuide) return { ok: false, reason: "unknown-guide", guide: null };

  const profile = loadStudentProfile(scope);
  if (!profile.companionId) {
    setCompanion(scope, companionId);
    return {
      ok: true,
      reason: "first-choice",
      cost: 0,
      starsRemaining: getAvailableGuideStars(scope, earnedStars),
      guide: nextGuide
    };
  }
  if (profile.companionId === companionId) {
    return {
      ok: true,
      reason: "already-chosen",
      cost: 0,
      starsRemaining: getAvailableGuideStars(scope, earnedStars),
      guide: nextGuide
    };
  }

  const normalizedCost = Math.max(0, Number(cost) || 0);
  const available = getAvailableGuideStars(scope, earnedStars);
  if (available < normalizedCost) {
    return {
      ok: false,
      reason: "stars",
      cost: normalizedCost,
      short: normalizedCost - available,
      starsRemaining: available,
      guide: getCompanion(scope)
    };
  }

  const nextProfile = {
    ...profile,
    companionId,
    companionChangedAt: new Date().toISOString(),
    guideStarsSpent: (Math.max(0, Number(profile.guideStarsSpent) || 0)) + normalizedCost
  };
  saveStudentProfile(scope, nextProfile);
  return {
    ok: true,
    reason: "changed",
    cost: normalizedCost,
    starsRemaining: available - normalizedCost,
    guide: nextGuide
  };
}
