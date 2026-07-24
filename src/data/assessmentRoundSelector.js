import { getQuestionFormatMetadata } from "../questionFormatFramework.js";
import {
  getQuestionPromptAnswerSignature,
  getQuestionSignature,
  getRepeatOptionSetSignature,
  getRepeatTargetWord,
  normalizeRepeatValue
} from "../questionRepeatGuards.js";
import {
  getQuestionRoutingFormat,
  isSingleTemplateSkill
} from "./skillTemplateRouting.js";

export const ASSESSMENT_ROUND_DIVERSITY_BUDGET = Object.freeze({
  maxTemplateShare: 0.35,
  maxItemKeyShare: 0.2,
  maxOptionSetShare: 0.35
});

const templateCache = new WeakMap();
const contentKeyCache = new WeakMap();
const repeatIdentityCache = new WeakMap();
const targetTemplateProfileCache = new WeakMap();
const targetOptionSetProfileCache = new WeakMap();

export function getAssessmentQuestionTemplate(question = {}) {
  if (question && typeof question === "object" && templateCache.has(question)) {
    return templateCache.get(question);
  }
  const frameworkTemplate = getQuestionFormatMetadata(question).formatType;
  const routedTemplate = getQuestionRoutingFormat(question);
  const rawTemplate = String(
    question.templateType || question.formatType || question.questionType || "UNKNOWN"
  ).toUpperCase();
  const template = frameworkTemplate && frameworkTemplate !== "UNKNOWN"
    ? frameworkTemplate
    : routedTemplate && routedTemplate !== "UNKNOWN"
      ? routedTemplate
      : rawTemplate;
  if (question && typeof question === "object") templateCache.set(question, template);
  return template;
}

export function getAssessmentQuestionContentKey(question = {}) {
  if (question && typeof question === "object" && contentKeyCache.has(question)) {
    return contentKeyCache.get(question);
  }
  const contentKey = [
    question.skillId || question.skill || question.skillName,
    getAssessmentQuestionTemplate(question),
    getRepeatTargetWord(question),
    question.prompt || question.question || question.spokenPrompt,
    question.correctAnswer || question.answer
  ]
    .map(normalizeRepeatValue)
    .filter(Boolean)
    .join("::");
  if (question && typeof question === "object") contentKeyCache.set(question, contentKey);
  return contentKey;
}

function repeatIdentity(question = {}) {
  if (question && typeof question === "object" && repeatIdentityCache.has(question)) {
    return repeatIdentityCache.get(question);
  }
  const identity = {
    targetWord: getRepeatTargetWord(question),
    correctAnswer: normalizeRepeatValue(question.correctAnswer || question.answer),
    promptAnswer: getQuestionPromptAnswerSignature(question),
    contentKey: getAssessmentQuestionContentKey(question),
    optionSet: getRepeatOptionSetSignature(question),
    signature: getQuestionSignature(question)
  };
  if (question && typeof question === "object") repeatIdentityCache.set(question, identity);
  return identity;
}

function getTargetTemplateProfile(questions = []) {
  if (questions && typeof questions === "object" && targetTemplateProfileCache.has(questions)) {
    return targetTemplateProfileCache.get(questions);
  }
  const profile = questions.reduce((state, question) => {
    const target = repeatIdentity(question).targetWord;
    const template = getAssessmentQuestionTemplate(question);
    state.availableByTemplate.set(
      template,
      (state.availableByTemplate.get(template) || 0) + 1
    );
    if (!target) return state;
    const templates = state.templatesByTarget.get(target) || new Set();
    templates.add(template);
    state.templatesByTarget.set(target, templates);
    const targets = state.uniqueTargetsByTemplate.get(template) || new Set();
    targets.add(target);
    state.uniqueTargetsByTemplate.set(template, targets);
    return state;
  }, {
    templatesByTarget: new Map(),
    uniqueTargetsByTemplate: new Map(),
    availableByTemplate: new Map()
  });
  if (questions && typeof questions === "object") {
    targetTemplateProfileCache.set(questions, profile);
  }
  return profile;
}

function getTargetOptionSetProfile(questions = []) {
  if (questions && typeof questions === "object" && targetOptionSetProfileCache.has(questions)) {
    return targetOptionSetProfileCache.get(questions);
  }
  const profile = questions.reduce((state, question) => {
    const target = repeatIdentity(question).targetWord;
    const optionSet = repeatIdentity(question).optionSet;
    if (!optionSet) return state;
    state.availableByCategory.set(
      optionSet,
      (state.availableByCategory.get(optionSet) || 0) + 1
    );
    if (!target) return state;
    const categories = state.categoriesByTarget.get(target) || new Set();
    categories.add(optionSet);
    state.categoriesByTarget.set(target, categories);
    const targets = state.uniqueTargetsByCategory.get(optionSet) || new Set();
    targets.add(target);
    state.uniqueTargetsByCategory.set(optionSet, targets);
    return state;
  }, {
    categoriesByTarget: new Map(),
    uniqueTargetsByCategory: new Map(),
    availableByCategory: new Map()
  });
  if (questions && typeof questions === "object") {
    targetOptionSetProfileCache.set(questions, profile);
  }
  return profile;
}

function getCriticalCategoriesByTarget({
  uniqueTargetsByCategory,
  availableByCategory
}, {
  feasibleCaps,
  baseCap,
  selectedCounts,
  selectedTargets,
  targetLength
}) {
  const criticalCategoriesByTarget = new Map();
  for (const [category, targets] of uniqueTargetsByCategory) {
    const otherCapacity = [...availableByCategory.entries()]
      .filter(([otherCategory]) => otherCategory !== category)
      .reduce((total, [otherCategory, available]) => total + Math.min(
        available,
        feasibleCaps.get(otherCategory) || baseCap
      ), 0);
    const requiredMinimum = Math.max(0, targetLength - otherCapacity);
    const selectedCategoryCount = selectedCounts.get(category) || 0;
    const requiredRemaining = Math.max(0, requiredMinimum - selectedCategoryCount);
    const remainingTargets = new Set(
      [...targets].filter(target => !selectedTargets.has(target))
    );
    if (requiredRemaining <= 0 || remainingTargets.size > requiredRemaining) continue;
    for (const target of remainingTargets) {
      const categories = criticalCategoriesByTarget.get(target) || new Set();
      categories.add(category);
      criticalCategoriesByTarget.set(target, categories);
    }
  }
  return criticalCategoriesByTarget;
}

function defaultItemKey(question = {}) {
  const itemType = normalizeRepeatValue(question.itemType);
  const itemKey = normalizeRepeatValue(question.itemKey);
  return itemType && itemKey ? `${itemType}::${itemKey}` : "";
}

function getFeasibleCategoryCaps(
  availableQuestions = [],
  getCategory,
  baseCap,
  roundLength
) {
  const availableCounts = availableQuestions.reduce((counts, question) => {
    const category = getCategory(question);
    if (category) counts.set(category, (counts.get(category) || 0) + 1);
    return counts;
  }, new Map());
  const targetLength = Math.min(roundLength, availableQuestions.length);
  return new Map(
    [...availableCounts.keys()].map(category => {
      const otherCapacity = [...availableCounts.entries()]
        .filter(([otherCategory]) => otherCategory !== category)
        .reduce((total, [, available]) => total + Math.min(available, baseCap), 0);
      return [
        category,
        Math.max(baseCap, targetLength - otherCapacity)
      ];
    })
  );
}

export function createAssessmentRoundDuplicateProfile(
  selectedQuestions = [],
  { selectedItemKeys = [], getItemKey = defaultItemKey } = {}
) {
  const identities = selectedQuestions.map(repeatIdentity);
  return {
    questionIds: new Set(selectedQuestions.map(question => question.id).filter(Boolean)),
    targetWords: new Set(identities.map(identity => identity.targetWord).filter(Boolean)),
    itemKeys: new Set([
      ...selectedItemKeys,
      ...selectedQuestions.map(getItemKey)
    ].filter(Boolean)),
    correctAnswers: new Set(identities.map(identity => identity.correctAnswer).filter(Boolean)),
    promptAnswers: new Set(identities.map(identity => identity.promptAnswer).filter(Boolean)),
    contentKeys: new Set(identities.map(identity => identity.contentKey).filter(Boolean)),
    optionSets: new Set(identities.map(identity => identity.optionSet).filter(Boolean)),
    signatures: new Set(identities.map(identity => identity.signature).filter(Boolean)),
    itemKeyCounts: selectedQuestions.reduce((counts, question) => {
      const itemKey = getItemKey(question);
      if (itemKey) counts.set(itemKey, (counts.get(itemKey) || 0) + 1);
      return counts;
    }, new Map()),
    optionSetCounts: identities.reduce((counts, identity) => {
      if (identity.optionSet) {
        counts.set(identity.optionSet, (counts.get(identity.optionSet) || 0) + 1);
      }
      return counts;
    }, new Map()),
    templateCounts: selectedQuestions.reduce((counts, question) => {
      const template = getAssessmentQuestionTemplate(question);
      counts.set(template, (counts.get(template) || 0) + 1);
      return counts;
    }, new Map())
  };
}

export function getAssessmentRoundDuplicateFlags(
  question,
  profile,
  { getItemKey = defaultItemKey } = {}
) {
  const itemKey = getItemKey(question);
  const {
    targetWord,
    correctAnswer,
    promptAnswer,
    contentKey,
    optionSet,
    signature
  } = repeatIdentity(question);

  return {
    questionId: Boolean(question.id && profile.questionIds.has(question.id)),
    targetWord: Boolean(targetWord && profile.targetWords.has(targetWord)),
    itemKey: Boolean(itemKey && profile.itemKeys.has(itemKey)),
    correctAnswer: Boolean(correctAnswer && profile.correctAnswers.has(correctAnswer)),
    promptAnswer: Boolean(promptAnswer && profile.promptAnswers.has(promptAnswer)),
    contentKey: Boolean(contentKey && profile.contentKeys.has(contentKey)),
    optionSet: Boolean(optionSet && profile.optionSets.has(optionSet)),
    signature: Boolean(signature && profile.signatures.has(signature))
  };
}

export function selectAssessmentRoundCandidate(
  prioritizedQuestions = [],
  {
    selectedQuestions = [],
    selectedItemKeys = [],
    skillId = "",
    roundLength = 15,
    getItemKey = defaultItemKey
  } = {}
) {
  const profile = createAssessmentRoundDuplicateProfile(selectedQuestions, {
    selectedItemKeys,
    getItemKey
  });
  const maxTemplateCount = Math.max(
    1,
    Math.floor(roundLength * ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxTemplateShare)
  );
  const maxItemKeyCount = Math.max(
    1,
    Math.ceil(roundLength * ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxItemKeyShare)
  );
  const maxOptionSetCount = Math.max(
    1,
    Math.floor(roundLength * ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxOptionSetShare)
  );
  const feasibleTemplateCaps = getFeasibleCategoryCaps(
    prioritizedQuestions,
    getAssessmentQuestionTemplate,
    maxTemplateCount,
    roundLength
  );
  const feasibleItemKeyCaps = getFeasibleCategoryCaps(
    prioritizedQuestions,
    getItemKey,
    maxItemKeyCount,
    roundLength
  );
  const feasibleOptionSetCaps = getFeasibleCategoryCaps(
    prioritizedQuestions,
    getRepeatOptionSetSignature,
    maxOptionSetCount,
    roundLength
  );
  const targetTemplateProfile = getTargetTemplateProfile(prioritizedQuestions);
  const targetOptionSetProfile = getTargetOptionSetProfile(prioritizedQuestions);
  const targetLength = Math.min(roundLength, prioritizedQuestions.length);
  const enforceOptionSetCap = feasibleOptionSetCaps.size >= targetLength;
  const criticalTemplatesByTarget = getCriticalCategoriesByTarget({
    categoriesByTarget: targetTemplateProfile.templatesByTarget,
    uniqueTargetsByCategory: targetTemplateProfile.uniqueTargetsByTemplate,
    availableByCategory: targetTemplateProfile.availableByTemplate
  }, {
    feasibleCaps: feasibleTemplateCaps,
    baseCap: maxTemplateCount,
    selectedCounts: profile.templateCounts,
    selectedTargets: profile.targetWords,
    targetLength
  });
  const criticalOptionSetsByTarget = enforceOptionSetCap
    ? getCriticalCategoriesByTarget(
      targetOptionSetProfile,
      {
        feasibleCaps: feasibleOptionSetCaps,
        baseCap: maxOptionSetCount,
        selectedCounts: profile.optionSetCounts,
        selectedTargets: profile.targetWords,
        targetLength
      }
    )
    : new Map();
  const respectsTemplateCap = question =>
    isSingleTemplateSkill(skillId) ||
    (profile.templateCounts.get(getAssessmentQuestionTemplate(question)) || 0) <
      (feasibleTemplateCaps.get(getAssessmentQuestionTemplate(question)) || maxTemplateCount);
  const respectsItemKeyCap = question => {
    const itemKey = getItemKey(question);
    return !itemKey ||
      (profile.itemKeyCounts.get(itemKey) || 0) <
        (feasibleItemKeyCaps.get(itemKey) || maxItemKeyCount);
  };
  const respectsOptionSetCap = question => {
    if (!enforceOptionSetCap) return true;
    const optionSet = getRepeatOptionSetSignature(question);
    return !optionSet ||
      (profile.optionSetCounts.get(optionSet) || 0) <
        (feasibleOptionSetCaps.get(optionSet) || maxOptionSetCount);
  };
  const exactSafe = prioritizedQuestions.filter(question => {
    const flags = getAssessmentRoundDuplicateFlags(question, profile, { getItemKey });
    return !flags.questionId && !flags.signature;
  });

  if (!exactSafe.length) {
    return {
      question: null,
      duplicateRelaxation: "blocked",
      maxTemplateCount,
      maxItemKeyCount,
      maxOptionSetCount,
      profile,
      exactSafeCount: 0,
      strictCount: 0
    };
  }

  const exactContentSafe = exactSafe.filter(question => {
    const flags = getAssessmentRoundDuplicateFlags(question, profile, { getItemKey });
    return !flags.contentKey;
  });
  const contentSafePool = exactContentSafe.length ? exactContentSafe : exactSafe;
  const underAllCaps = contentSafePool.filter(question =>
    respectsTemplateCap(question) &&
    respectsItemKeyCap(question) &&
    respectsOptionSetCap(question)
  );
  const underStructuralCaps = contentSafePool.filter(question =>
    respectsTemplateCap(question) && respectsItemKeyCap(question)
  );
  const underOptionSetCap = contentSafePool.filter(respectsOptionSetCap);
  const budgetSafePool = underAllCaps.length
    ? underAllCaps
    : underStructuralCaps.length
      ? underStructuralCaps
      : underOptionSetCap.length
        ? underOptionSetCap
        : contentSafePool;
  const targetSafeBudgetPool = budgetSafePool.filter(question => {
    const flags = getAssessmentRoundDuplicateFlags(question, profile, { getItemKey });
    return !flags.targetWord;
  });
  const capSafePool = targetSafeBudgetPool.length
    ? targetSafeBudgetPool
    : budgetSafePool;
  const strict = capSafePool.filter(question => {
    const flags = getAssessmentRoundDuplicateFlags(question, profile, { getItemKey });
    return !flags.targetWord && !flags.promptAnswer && !flags.optionSet && !flags.contentKey;
  });
  const candidatePool = capSafePool;
  const getRelaxation = question => {
    const flags = getAssessmentRoundDuplicateFlags(question, profile, { getItemKey });
    if (!flags.targetWord && !flags.promptAnswer && !flags.optionSet && !flags.contentKey) {
      return { label: "none", rank: 0 };
    }
    if (!flags.targetWord && !flags.optionSet && !flags.contentKey) {
      return { label: "prompt-answer", rank: 1 };
    }
    if (!flags.targetWord && !flags.contentKey) {
      return { label: "option-set", rank: 2 };
    }
    if (!flags.promptAnswer && !flags.optionSet && !flags.contentKey) {
      return { label: "target-word", rank: 3 };
    }
    if (!flags.optionSet && !flags.contentKey) {
      return { label: "target-word+prompt-answer", rank: 4 };
    }
    return { label: "target-word+prompt-answer+option-set", rank: 5 };
  };
  const question = candidatePool.reduce((best, candidate) => {
    if (!best) return candidate;
    const candidateTemplateCount = isSingleTemplateSkill(skillId)
      ? 0
      : profile.templateCounts.get(getAssessmentQuestionTemplate(candidate)) || 0;
    const bestTemplateCount = isSingleTemplateSkill(skillId)
      ? 0
      : profile.templateCounts.get(getAssessmentQuestionTemplate(best)) || 0;
    if (candidateTemplateCount !== bestTemplateCount) {
      return candidateTemplateCount < bestTemplateCount ? candidate : best;
    }
    const candidateTemplate = getAssessmentQuestionTemplate(candidate);
    const bestTemplate = getAssessmentQuestionTemplate(best);
    const candidateCriticalTemplates =
      criticalTemplatesByTarget.get(repeatIdentity(candidate).targetWord) || new Set();
    const bestCriticalTemplates =
      criticalTemplatesByTarget.get(repeatIdentity(best).targetWord) || new Set();
    const candidateCrossTemplateRisk = [...candidateCriticalTemplates]
      .filter(template => template !== candidateTemplate).length;
    const bestCrossTemplateRisk = [...bestCriticalTemplates]
      .filter(template => template !== bestTemplate).length;
    const candidateOptionSet = getRepeatOptionSetSignature(candidate);
    const bestOptionSet = getRepeatOptionSetSignature(best);
    const candidateCriticalOptionSets =
      criticalOptionSetsByTarget.get(repeatIdentity(candidate).targetWord) || new Set();
    const bestCriticalOptionSets =
      criticalOptionSetsByTarget.get(repeatIdentity(best).targetWord) || new Set();
    const candidateCrossOptionSetRisk = [...candidateCriticalOptionSets]
      .filter(optionSet => optionSet !== candidateOptionSet).length;
    const bestCrossOptionSetRisk = [...bestCriticalOptionSets]
      .filter(optionSet => optionSet !== bestOptionSet).length;
    const candidateCrossCategoryRisk =
      candidateCrossTemplateRisk + candidateCrossOptionSetRisk;
    const bestCrossCategoryRisk =
      bestCrossTemplateRisk + bestCrossOptionSetRisk;
    if (candidateCrossCategoryRisk !== bestCrossCategoryRisk) {
      return candidateCrossCategoryRisk < bestCrossCategoryRisk ? candidate : best;
    }
    const candidateItemKey = getItemKey(candidate);
    const bestItemKey = getItemKey(best);
    const candidateItemCount = candidateItemKey
      ? profile.itemKeyCounts.get(candidateItemKey) || 0
      : 0;
    const bestItemCount = bestItemKey
      ? profile.itemKeyCounts.get(bestItemKey) || 0
      : 0;
    if (candidateItemCount !== bestItemCount) {
      return candidateItemCount < bestItemCount ? candidate : best;
    }
    const candidateOptionSetCount = candidateOptionSet
      ? profile.optionSetCounts.get(candidateOptionSet) || 0
      : 0;
    const bestOptionSetCount = bestOptionSet
      ? profile.optionSetCounts.get(bestOptionSet) || 0
      : 0;
    if (candidateOptionSetCount !== bestOptionSetCount) {
      return candidateOptionSetCount < bestOptionSetCount ? candidate : best;
    }
    return getRelaxation(candidate).rank < getRelaxation(best).rank ? candidate : best;
  }, null);
  const duplicateRelaxation = getRelaxation(question).label;

  return {
    question,
    duplicateRelaxation,
    maxTemplateCount,
    maxItemKeyCount,
    maxOptionSetCount,
    profile,
    exactSafeCount: exactSafe.length,
    strictCount: strict.length
  };
}

export function getAssessmentTemplateBudgetFailures(
  selectedQuestions = [],
  availableQuestions = [],
  { skillId = "", roundLength = selectedQuestions.length || 15 } = {}
) {
  if (isSingleTemplateSkill(skillId)) return [];
  const maxTemplateCount = Math.max(
    1,
    Math.floor(roundLength * ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxTemplateShare)
  );
  const selectedCounts = selectedQuestions.reduce((counts, question) => {
    const template = getAssessmentQuestionTemplate(question);
    counts.set(template, (counts.get(template) || 0) + 1);
    return counts;
  }, new Map());
  const availableCounts = availableQuestions.reduce((counts, question) => {
    const template = getAssessmentQuestionTemplate(question);
    counts.set(template, (counts.get(template) || 0) + 1);
    return counts;
  }, new Map());

  return [...selectedCounts.entries()].flatMap(([template, count]) => {
    if (count <= maxTemplateCount) return [];
    const otherTemplateCapacity = [...availableCounts.entries()]
      .filter(([otherTemplate]) => otherTemplate !== template)
      .reduce((total, [, available]) => total + Math.min(available, maxTemplateCount), 0);
    const unavoidableMinimum = Math.max(0, selectedQuestions.length - otherTemplateCapacity);
    const allowedCount = Math.max(maxTemplateCount, unavoidableMinimum);
    return count > allowedCount
      ? [{ value: template.toLowerCase(), count, allowedCount }]
      : [];
  });
}

export function getAssessmentItemKeyBudgetFailures(
  selectedQuestions = [],
  availableQuestions = [],
  {
    roundLength = selectedQuestions.length || 15,
    getItemKey = defaultItemKey
  } = {}
) {
  const maxItemKeyCount = Math.max(
    1,
    Math.ceil(roundLength * ASSESSMENT_ROUND_DIVERSITY_BUDGET.maxItemKeyShare)
  );
  const selectedCounts = selectedQuestions.reduce((counts, question) => {
    const itemKey = getItemKey(question);
    if (itemKey) counts.set(itemKey, (counts.get(itemKey) || 0) + 1);
    return counts;
  }, new Map());
  const availableCounts = availableQuestions.reduce((counts, question) => {
    const itemKey = getItemKey(question);
    if (itemKey) counts.set(itemKey, (counts.get(itemKey) || 0) + 1);
    return counts;
  }, new Map());

  return [...selectedCounts.entries()].flatMap(([itemKey, count]) => {
    if (count <= maxItemKeyCount) return [];
    const otherItemCapacity = [...availableCounts.entries()]
      .filter(([otherItemKey]) => otherItemKey !== itemKey)
      .reduce((total, [, available]) => total + Math.min(available, maxItemKeyCount), 0);
    const unavoidableMinimum = Math.max(0, selectedQuestions.length - otherItemCapacity);
    const allowedCount = Math.max(maxItemKeyCount, unavoidableMinimum);
    return count > allowedCount
      ? [{ value: itemKey, count, allowedCount }]
      : [];
  });
}
