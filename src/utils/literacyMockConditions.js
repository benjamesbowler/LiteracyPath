/** Local task identity. Different constructs or access conditions are not a difficulty ladder. */
export function literacyMockFocus(value = {}) {
  const source = value.itemSnapshot || value.questionSnapshot || value;
  const skillId = value.skillId || source.skillId;
  return {
    skillId,
    domainId: value.domainId || source.domainId,
    construct: source.constructClaim || value.constructClaim || skillId,
    modality: [source.modality || source.literacyModality || 'recognition', source.evidenceModality || '',
      source.passageAccess || '', source.oralLanguageAccess === true ? 'oral_language' : '',
      source.displayPassageDuringResponse === false ? 'hidden' : 'visible'].join('|'),
    level: Number(value.level ?? source.level),
  };
}

export function sameLiteracyMockTask(left, right, { includeLevel = false } = {}) {
  const a = left?.construct && left?.modality ? left : literacyMockFocus(left);
  const b = right?.construct && right?.modality ? right : literacyMockFocus(right);
  return Boolean(a.skillId && a.domainId && a.construct && a.modality)
    && ['skillId', 'domainId', 'construct', 'modality', ...(includeLevel ? ['level'] : [])]
      .every(key => a[key] === b[key]);
}

export const literacyMockTaskKey = value => {
  const focus = literacyMockFocus(value);
  return JSON.stringify([focus.skillId, focus.domainId, focus.construct, focus.modality]);
};
