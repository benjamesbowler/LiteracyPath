import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import { ParentAreaPage } from "./components/family/ParentAreaPage.jsx";
import { FamilyReportDialog } from "./components/family/FamilyReportDialog.jsx";
import { FAMILY_COPY } from "./copy/familyCopy.js";
import { buildParentAreaModel } from "./data/parentAreaModel.js";

// Seeded preview content only. It demonstrates the proposed information model
// and is not connected to a real family, child record, school or report.
const PARENT_AREA_PREVIEW_MODELS = [
  buildParentAreaModel({
    learner: {
      id: "student-aarav",
      name: "Aarav",
      classLabel: "Willow Class",
      schoolName: "Oakfield Primary"
    },
    updatedLabel: "Updated 18 August",
    highlight: FAMILY_COPY.parentArea.previewAaravHighlight,
    strengths: [
      "Aarav confidently matches familiar letters with their sounds.",
      "Aarav joins in with shared reading and talks about what happened in a story."
    ],
    canDo: [
      "Read familiar short words with support",
      "Notice when two words begin with the same sound",
      "Retell the main events from a short story"
    ],
    nextFocus: [
      "Listen for the last sound in short words",
      "Blend three sounds together to read a whole word"
    ],
    meaning: "Aarav is ready for short word games that slow each word down and make the final sound easy to hear.",
    progress: [
      { id: "letters", label: "Letter names and sounds", status: "doing_well", detail: "Aarav recognises familiar letters and usually remembers the sound they represent." },
      { id: "hearing", label: "Hearing sounds in words", status: "growing", detail: "Aarav hears the first sound clearly and is beginning to notice the last sound." },
      { id: "words", label: "Reading words", status: "growing", detail: "Aarav can blend some short words when each sound is said slowly." },
      { id: "spelling", label: "Spelling words", status: "growing", detail: "Aarav writes the sounds they can hear and is learning to check the whole word." },
      { id: "aloud", label: "Reading aloud smoothly", status: "not_checked", detail: "The school will share more after hearing Aarav read a wider range of books." },
      { id: "meaning", label: "Understanding a text", status: "doing_well", detail: "Aarav remembers key events and explains favourite parts of a story." }
    ],
    atHome: {
      title: "Final sound detectives",
      introduction: "Say a short word slowly. Ask Aarav what sound they hear at the very end. Keep it playful and stop after a few words.",
      durationLabel: "5 to 10 minutes",
      language: "English",
      privacyText: "Literacy Guide does not record your child’s voice, image or home activity. Home practice does not change the school’s progress decisions.",
      activities: [
        { moment: "On the way home", title: "Listen at the end", direction: "Say sun, map and fish slowly. Take turns naming the last sound you hear." },
        { moment: "At the table", title: "Sort the sounds", direction: "Find three small objects. Group any objects whose names end with the same sound." },
        { moment: "During story time", title: "Spot one word", direction: "Choose one short word from the page. Stretch it out and listen for its last sound." },
        { moment: "While tidying", title: "I spy the ending", direction: "Name something nearby and ask whether it ends with m, t or p." },
        { moment: "Before bed", title: "Finish with a favourite", direction: "Read a familiar page together. Praise careful listening and trying again." }
      ]
    },
    recentReading: [
      { title: "Moss Has a Map", detail: "Read together at school", coverUrl: "/images/guided-reading/sel-books/llg-sel-a-01/cover.webp" }
    ],
    reports: [
      { id: "report-summer", title: "Summer reading update", publishedLabel: "18 August 2026", publishedAt: "2026-08-18", summary: "A strengths-first update with the next classroom focus and simple ways to help at home.", releaseState: "released", downloadUrl: "#summer-reading-update" },
      { id: "report-spring", title: "Spring reading update", publishedLabel: "28 March 2026", publishedAt: "2026-03-28", summary: "A family update about letter knowledge, shared reading and the next useful steps.", releaseState: "released", downloadUrl: "#spring-reading-update" },
      { id: "report-draft", title: "Unreleased school draft", publishedLabel: "Not released", publishedAt: "2026-08-20", summary: "This must never appear in the parent area.", releaseState: "draft", downloadUrl: "#draft" }
    ],
    contact: {
      name: "Ms Patel",
      email: "teacher@example.invalid",
      message: "Ms Patel can explain this update and answer questions about the next classroom focus."
    }
  }),
  buildParentAreaModel({
    learner: {
      id: "student-aisha",
      name: "Aisha",
      classLabel: "Hazel Class",
      schoolName: "Oakfield Primary"
    },
    updatedLabel: "Updated 16 August",
    highlight: "Aisha listens closely to stories and explains her ideas clearly. The class is now building confidence with short written words.",
    strengths: [
      "Aisha talks thoughtfully about characters and key events.",
      "Aisha hears the first sound in familiar words."
    ],
    canDo: [
      "Answer questions about a short story",
      "Match several familiar letters with their sounds",
      "Hear when two words begin in the same way"
    ],
    nextFocus: [
      "Build and read short words with three sounds",
      "Write the sound heard at the beginning of a word"
    ],
    meaning: "Aisha will benefit from seeing, saying and moving letters while building one short word at a time.",
    progress: [
      { id: "aisha-letters", label: "Letter names and sounds", status: "growing", detail: "Aisha recognises several familiar letters and is adding new ones each week." },
      { id: "aisha-hearing", label: "Hearing sounds in words", status: "doing_well", detail: "Aisha confidently notices the first sound in familiar words." },
      { id: "aisha-words", label: "Reading words", status: "growing", detail: "Aisha is learning to bring three sounds together without losing the first sound." },
      { id: "aisha-meaning", label: "Understanding a text", status: "doing_well", detail: "Aisha remembers important events and explains her thinking." }
    ],
    atHome: {
      title: "Build one little word",
      introduction: "Use three letter cards to build a short word. Say each sound, slide the cards together and read the whole word.",
      durationLabel: "5 to 10 minutes",
      activities: [
        { moment: "After school", title: "Make the first word", direction: "Build sat. Point to each letter, say the sound and then read the word." },
        { moment: "At the table", title: "Change one letter", direction: "Change sat to sit. Ask what changed and read the new word together." },
        { moment: "During story time", title: "Find a short word", direction: "Look for one three-letter word and read it slowly together." },
        { moment: "While tidying", title: "Say and stretch", direction: "Choose a small object and stretch its name to hear the sounds." },
        { moment: "Before bed", title: "Celebrate the try", direction: "Read one favourite word again and praise the effort, not the speed." }
      ]
    },
    recentReading: [
      { title: "Nan and the Red Bag", detail: "Read together at school", coverUrl: "/images/guided-reading/sel-books/llg-sel-a-02/cover.webp" }
    ],
    reports: [],
    contact: {
      name: "Mr Davies",
      email: "teacher@example.invalid",
      message: "Mr Davies can explain what Aisha is practising and suggest another activity if needed."
    }
  })
];

export function ParentAreaPreview() {
  const params = new URLSearchParams(window.location.search);
  const requestedState = params.get("state") || "ready";
  const [state, setState] = useState(requestedState);
  const [openReport, setOpenReport] = useState(null);
  const [openReportModel, setOpenReportModel] = useState(null);
  const requestedSection = params.get("section") || "overview";
  const models = state === "empty" ? [] : PARENT_AREA_PREVIEW_MODELS;
  return <><ParentAreaPage models={models} initialSection={requestedSection} state={state} onRetry={() => setState("ready")} onOpenReport={(report, model) => { setOpenReport(report); setOpenReportModel(model); }} /><FamilyReportDialog report={openReport} model={openReportModel} onClose={() => { setOpenReport(null); setOpenReportModel(null); }} onPrint={() => {}} /></>;
}

createRoot(document.getElementById("root")).render(<ParentAreaPreview />);
