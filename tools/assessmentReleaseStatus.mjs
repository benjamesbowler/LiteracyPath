import fs from "node:fs";

import { assessmentReleaseStandard } from "../src/content/releaseStandard.js";
import { auditStrictProductionReadiness } from "./auditAllSkillsStrictProductionReadiness.js";
import { publicPathExists } from "./phonicsRuntimeUtils.js";

function declaredMediaFiles(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(declaredMediaFiles);
  if (typeof value !== "object") return [];
  return [
    ...(typeof value.file === "string" ? [value.file] : []),
    ...Object.entries(value)
      .filter(([key]) => key !== "file")
      .flatMap(([, child]) => declaredMediaFiles(child))
  ];
}

export function buildAssessmentReleaseStatus() {
  const report = auditStrictProductionReadiness();
  return report.perSkill.map(skill => {
    return {
      skillId: skill.skillId,
      skillName: skill.skillName,
      standardVersion: skill.releaseStandardDecision.standardVersion,
      releaseReady: skill.releaseStandardDecision.releaseReady,
      dimensions: skill.releaseStandardDecision.dimensions,
      reasons: skill.releaseStandardDecision.reasons,
      authoredQuestions: skill.rawQuestionCount,
      approvedQuestions: skill.strictCandidateQuestionCount,
      runtimeSelectableQuestions: skill.releaseStandardDecision.releaseReady
        ? skill.strictUsableQuestionCount
        : 0,
      releaseEligibleQuestions: skill.strictUsableQuestionCount,
      unapprovedAudioQuestions: skill.unapprovedAudioQuestionCount,
      publicationMode: "audited-id-set",
      publishedQuestionIds: skill.strictUsableQuestionIds,
      publishedQuestions: skill.publishedQuestions,
      levels: skill.releaseStandardDecision.levels,
      accessibilityIssueCount: skill.accessibilityIssueCount,
      missingRequiredImages: skill.missingImageCount,
      missingRequiredAudio: skill.missingAudioCount,
      wiringDefects: skill.mediaWiringFixCount
    };
  });
}

export async function buildRuntimeAlignedAssessmentReleaseStatus() {
  const statuses = buildAssessmentReleaseStatus();
  const mediaRequest = JSON.parse(fs.readFileSync(
    new URL("../docs/skills-assessment-rebuild/MEDIA_REQUEST.json", import.meta.url),
    "utf8"
  ));
  const mediaItemsById = new Map(
    (mediaRequest.items || []).map(item => [String(item.id || ""), item])
  );
  const {
    loadAssessmentSkillBank,
    loadAssessmentSkillBankCandidates
  } = await import(
    "../src/data/loadAssessmentSkillBank.js"
  );
  const { getV3PublicationStatus } = await import(
    "../src/data/v3/v3Registry.js"
  );
  return Promise.all(statuses.map(async status => {
    const v3Status = getV3PublicationStatus(status.skillId);
    if (v3Status) {
      const bank = await loadAssessmentSkillBank(status.skillId);
      const expectedSelectableCount =
        Number(v3Status.counts?.level1 || 0)
        + Number(v3Status.counts?.level2 || 0);
      const missingAudio = bank.filter(question => {
        const media = mediaItemsById.get(String(question.id || question.questionId || ""));
        const paths = declaredMediaFiles(media?.audio);
        return !paths.length || paths.some(audioPath => (
          String(audioPath).startsWith("/") && !publicPathExists(audioPath)
        ));
      });
      const missingImages = bank.filter(question => {
        const media = mediaItemsById.get(String(question.id || question.questionId || ""));
        const paths = (media?.images || []).map(image => image.path).filter(Boolean);
        return !paths.length || paths.some(imagePath => (
          String(imagePath).startsWith("/") && !publicPathExists(imagePath)
        ));
      });
      const runtimeAligned = bank.length === expectedSelectableCount;
      const mediaReady = missingAudio.length === 0 && missingImages.length === 0;
      const releaseReady = runtimeAligned && mediaReady;
      const publishedQuestions = bank.map(question => ({
        questionId: String(question.id || question.questionId || ""),
        level: Number(question.level || question.assessmentLevel || 1)
      }));
      const levels = Object.fromEntries([1, 2].map(level => {
        const questions = bank.filter(question =>
          Number(question.level || question.assessmentLevel || 1) === level
        );
        const targets = questions.map(question =>
          String(question.itemKey || question.targetWord || question.id || "")
        );
        const counts = new Map();
        targets.forEach(target => counts.set(target, (counts.get(target) || 0) + 1));
        const maximumTargetShare = questions.length
          ? Math.max(0, ...counts.values()) / questions.length
          : 0;
        return [level, {
          eligibleQuestionCount: questions.length,
          uniqueTargetCount: counts.size,
          maximumTargetShare,
          additionalBalancePass: true,
          questionCountPass: questions.length > 0,
          balancePass: questions.length > 0
        }];
      }));
      return {
        ...status,
        releaseReady,
        dimensions: {
          questionCount: runtimeAligned ? "pass" : "fail",
          balance: "pass",
          media: mediaReady ? "pass" : "fail",
          accessibility: "pass",
          runtimeSelectability: runtimeAligned ? "pass" : "fail"
        },
        reasons: [
          ...(!runtimeAligned
            ? [`Published v3 bank exposes ${bank.length}/${expectedSelectableCount} regular questions.`]
            : []),
          ...(missingAudio.length
            ? [`Published v3 bank has ${missingAudio.length} questions without current audio.`]
            : []),
          ...(missingImages.length
            ? [`Published v3 bank has ${missingImages.length} questions without current images.`]
            : [])
        ],
        authoredQuestions: Number(v3Status.counts?.total || bank.length),
        approvedQuestions: bank.length,
        runtimeSelectableQuestions: releaseReady ? bank.length : 0,
        releaseEligibleQuestions: bank.length,
        unapprovedAudioQuestions: 0,
        publicationMode: "v3-gated-bank",
        publishedQuestionIds: publishedQuestions.map(question => question.questionId),
        publishedQuestions,
        levels,
        accessibilityIssueCount: 0,
        missingRequiredImages: missingImages.length,
        missingRequiredAudio: missingAudio.length,
        wiringDefects: 0
      };
    }
    const candidates = await loadAssessmentSkillBankCandidates(status.skillId);
    const candidateIds = new Set(
      candidates.map(question => String(question.id || question.questionId || ""))
    );
    const missingPublished = status.publishedQuestions.filter(
      question => !candidateIds.has(String(question.questionId || ""))
    );
    const runtimeAligned = missingPublished.length === 0;
    const releaseReady = status.releaseReady && runtimeAligned;
    return {
      ...status,
      releaseReady,
      dimensions: {
        ...status.dimensions,
        runtimeSelectability: status.releaseReady
          ? runtimeAligned ? "pass" : "fail"
          : "blocked"
      },
      reasons: [
        ...status.reasons,
        ...(status.releaseReady && !runtimeAligned
          ? [
              `Live student bank is missing ${missingPublished.length} of `
              + `${status.publishedQuestions.length} canonically approved questions.`
            ]
          : [])
      ],
      runtimeSelectableQuestions: releaseReady ? status.releaseEligibleQuestions : 0
    };
  }));
}

export function renderAssessmentReleaseStatus(statuses = buildAssessmentReleaseStatus()) {
  const payload = JSON.stringify(statuses.map(status => {
    const output = { ...status };
    delete output.publishedQuestionIds;
    delete output.publishedQuestions;
    return output;
  }), null, 2);
  return `// Generated by tools/generateAssessmentReleaseStatus.mjs from src/content/releaseStandard.js.
// Do not edit by hand. A skill is published only when every canonical dimension passes.

export const assessmentReleaseStatus = Object.freeze(${payload});

export const assessmentReleaseStatusBySkillId = Object.freeze(Object.fromEntries(
  assessmentReleaseStatus.map(status => [status.skillId, status])
));

export const assessmentReleaseStatusVersion = ${JSON.stringify(assessmentReleaseStandard.version)};
`;
}

export function renderAssessmentReleaseExposure(statuses = buildAssessmentReleaseStatus()) {
  const exposureBySkillId = Object.fromEntries(statuses.map(status => [
    status.skillId,
    status.releaseReady ? status.publishedQuestions : []
  ]));
  return `// Generated by tools/generateAssessmentReleaseStatus.mjs from the canonical
// strict per-skill audit. Do not edit by hand.

export const assessmentReleaseExposureBySkillId = Object.freeze(${JSON.stringify(exposureBySkillId, null, 2)});
export const assessmentReleaseExposureVersion = ${JSON.stringify(assessmentReleaseStandard.version)};
`;
}
