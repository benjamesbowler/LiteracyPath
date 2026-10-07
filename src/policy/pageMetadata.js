import { APP_VIEWS } from "../appState/appViews.js";

export const PUBLIC_SITE_ORIGIN = "https://literacy.guide";
export const SHARE_IMAGE_PATH = "/images/brand/literacy-guide-share.png";
export const PUBLIC_LEGAL_PATHS = Object.freeze([
  "/legal.html", "/privacy.html", "/terms.html", "/cookies.html",
  "/accessibility.html", "/data-processing.html"
]);
export const SITEMAP_PATHS = Object.freeze(["/", "/soundkeys", ...PUBLIC_LEGAL_PATHS]);

const home = Object.freeze({
  title: "Literacy Guide — Reading, phonics and classroom learning",
  description: "Explore Little Literacy Guides: illustrated books, phonics games and reading practice for children, with assessment and progress tools for teachers.",
  path: "/",
  robots: "index,follow"
});
const publicRoutes = Object.freeze({
  "/": home,
  "/soundkeys": Object.freeze({
    title: "Sound Keys — Literacy Guide",
    description: "Explore letters, sounds and word building with Sound Keys from Literacy Guide.",
    path: "/soundkeys",
    robots: "index,follow"
  }),
  "/parent": Object.freeze({
    title: "Family access — Literacy Guide",
    description: "Secure school-invited family access to released reading updates and reports.",
    path: "/parent",
    robots: "noindex,nofollow"
  })
});

// Only fixed route labels belong here. Never use learner/class names, report
// content, URL fragments or invitation query strings in a document head.
const viewLabels = Object.freeze({
  [APP_VIEWS.SELECT]: "Choose a class",
  [APP_VIEWS.STUDENT_LOGIN]: "Student sign in",
  [APP_VIEWS.STUDENT_HOME]: "Home",
  [APP_VIEWS.STUDENT_REWARDS]: "My Hollow",
  [APP_VIEWS.ASSESSMENTS]: "Assessments",
  [APP_VIEWS.EL_BENCHMARK]: "Reading benchmark",
  [APP_VIEWS.GUIDED_READING]: "Books",
  [APP_VIEWS.REPORTS]: "Reports",
  [APP_VIEWS.LEARN]: "Learning",
  [APP_VIEWS.PHONICS_LEARN]: "Letters and words",
  [APP_VIEWS.SKILLS_BLOCK_QUEST]: "Adventure Map",
  [APP_VIEWS.SKILLS_PRACTICE]: "Skills practice",
  [APP_VIEWS.CYCLE_PRACTICE]: "Cycle practice",
  [APP_VIEWS.PROGRESS_CHECK]: "Progress Check",
  [APP_VIEWS.PHONICS_QUEST]: "Sound Seekers",
  [APP_VIEWS.ASSESSMENT]: "Assessment",
  [APP_VIEWS.CHECKPOINT]: "Checkpoint",
  [APP_VIEWS.FINISHED]: "Assessment results",
  [APP_VIEWS.LETTERS]: "Letters",
  [APP_VIEWS.ADVANCED_PHONICS]: "Advanced phonics",
  [APP_VIEWS.TEACHER_DASHBOARD]: "Teacher Today",
  [APP_VIEWS.TEACHER_CLASSES]: "Students",
  [APP_VIEWS.TEACHER_RESOURCES]: "Teacher resources",
  [APP_VIEWS.TEACHER_GUIDED_READING]: "Guided Reading",
  [APP_VIEWS.TEACHER_SETTINGS]: "Teacher settings",
  [APP_VIEWS.WORKSHEETS]: "Worksheets",
  [APP_VIEWS.PRESENT]: "Present",
  [APP_VIEWS.ADMIN_DASHBOARD]: "Administration"
});
const entryLabels = Object.freeze({
  teacher: "Teacher sign in", student: "Student sign in",
  try: "Try for free", "try-ended": "Try-out complete"
});

export function metadataForPath(pathname = "/") {
  const route = pathname.replace(/\/$/, "").replace(/^(\/(?:parent|soundkeys))\.html$/, "$1") || "/";
  return publicRoutes[route] || home;
}

export function metadataForAppView(appView, entryMode, signedIn = false, authMode = "login") {
  if (!signedIn && entryMode === "entry" && authMode !== "resetPassword") return home;
  const label = !signedIn
    ? authMode === "resetPassword" ? "Reset password"
      : entryMode === "teacher" && authMode === "signup" ? "Teacher sign up"
        : entryLabels[entryMode] || "Sign in"
    : viewLabels[appView] || "Learning";
  return {
    ...home,
    title: `${label || "Learning"} — Literacy Guide`,
    description: "Reading, phonics, learning activities and school tools from Literacy Guide.",
    robots: "noindex,nofollow"
  };
}

export function applyPageMetadata(metadata, documentTarget = document) {
  documentTarget.title = metadata.title;
  const values = [
    ["name", "description", metadata.description],
    ["name", "robots", metadata.robots],
    ["property", "og:title", metadata.title],
    ["property", "og:description", metadata.description],
    ["property", "og:url", `${PUBLIC_SITE_ORIGIN}${metadata.path}`],
    ["name", "twitter:title", metadata.title],
    ["name", "twitter:description", metadata.description]
  ];
  for (const [attribute, key, value] of values) {
    let tag = documentTarget.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!tag) {
      tag = documentTarget.createElement("meta");
      tag.setAttribute(attribute, key);
      documentTarget.head.appendChild(tag);
    }
    tag.setAttribute("content", value);
  }
}
