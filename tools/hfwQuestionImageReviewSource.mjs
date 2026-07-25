const DEFAULT_REPLACEMENT_SUFFIX = "No embedded text, labels, signs, watermarks, logos, photorealism, rainbow/babyish style, AI slop, extra hands/fingers/limbs, or distorted faces.";

function defaultReplacementPrompt(fullSentence = "") {
  return `Create one clean child-friendly LiteracyPath cartoon scene matching this exact sentence: "${fullSentence}". ${DEFAULT_REPLACEMENT_SUFFIX}`;
}

export function compactHfwQuestionImageReviewRow(row) {
  const base = [
    row.questionId,
    row.skillId,
    row.band,
    row.level,
    row.phase,
    row.targetWord,
    row.questionType,
    row.sentenceWithBlank,
    row.fullSentence,
    row.correctAnswer,
    row.answerChoices,
    row.letterTiles
  ];
  const metadata = {};
  if (row.currentImagePath) metadata.currentImagePath = row.currentImagePath;
  if (row.imageSource) metadata.imageSource = row.imageSource;
  if (row.imageRole) metadata.imageRole = row.imageRole;
  if (row.imagePolicy && row.imagePolicy !== "no_image") metadata.imagePolicy = row.imagePolicy;
  if (row.qaStatus && row.qaStatus !== "no_image_required") metadata.qaStatus = row.qaStatus;
  if (row.rejectionReason) metadata.rejectionReason = row.rejectionReason;
  if (row.reviewerNotes) metadata.reviewerNotes = row.reviewerNotes;
  if (row.replacementPrompt !== defaultReplacementPrompt(row.fullSentence)) {
    metadata.replacementPrompt = row.replacementPrompt;
  }
  return Object.keys(metadata).length ? [...base, metadata] : base;
}

export function inflateHfwQuestionImageReviewRow(row) {
  const metadata = row[12] || {};
  const fullSentence = row[8];
  return {
    questionId: row[0],
    skillId: row[1],
    band: row[2],
    level: row[3],
    phase: row[4],
    targetWord: row[5],
    questionType: row[6],
    sentenceWithBlank: row[7],
    fullSentence,
    correctAnswer: row[9],
    answerChoices: row[10],
    letterTiles: row[11],
    currentImagePath: metadata.currentImagePath || "",
    imageSource: metadata.imageSource || "",
    imageRole: metadata.imageRole || "",
    imagePolicy: metadata.imagePolicy || "no_image",
    qaStatus: metadata.qaStatus || "no_image_required",
    rejectionReason: metadata.rejectionReason || "",
    reviewerNotes: metadata.reviewerNotes || "",
    replacementPrompt: metadata.replacementPrompt
      || defaultReplacementPrompt(fullSentence)
  };
}

export function renderHfwQuestionImageReviewSource(rows, banner) {
  const compactRows = rows.map(compactHfwQuestionImageReviewRow);
  return `${banner}

const REPLACEMENT_SUFFIX = ${JSON.stringify(DEFAULT_REPLACEMENT_SUFFIX)};
const ROWS = ${JSON.stringify(compactRows)};

export const hfwQuestionImageReviewRows = ROWS.map(row => {
  const metadata = row[12] || {};
  const fullSentence = row[8];
  return {
    questionId: row[0],
    skillId: row[1],
    band: row[2],
    level: row[3],
    phase: row[4],
    targetWord: row[5],
    questionType: row[6],
    sentenceWithBlank: row[7],
    fullSentence,
    correctAnswer: row[9],
    answerChoices: row[10],
    letterTiles: row[11],
    currentImagePath: metadata.currentImagePath || "",
    imageSource: metadata.imageSource || "",
    imageRole: metadata.imageRole || "",
    imagePolicy: metadata.imagePolicy || "no_image",
    qaStatus: metadata.qaStatus || "no_image_required",
    rejectionReason: metadata.rejectionReason || "",
    reviewerNotes: metadata.reviewerNotes || "",
    replacementPrompt: metadata.replacementPrompt
      || \`Create one clean child-friendly LiteracyPath cartoon scene matching this exact sentence: "\${fullSentence}". \${REPLACEMENT_SUFFIX}\`
  };
});

export default hfwQuestionImageReviewRows;
`;
}
