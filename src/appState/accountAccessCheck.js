function normalizedUserId(value) {
  return String(value || "");
}

export function isCurrentAccountAccessCheck({
  checkSequence,
  checkedUserId,
  activeSequence,
  activeCheckUserId,
  authenticatedUserId
} = {}) {
  const expectedUserId = normalizedUserId(checkedUserId);
  return Boolean(expectedUserId)
    && Number.isInteger(checkSequence)
    && checkSequence > 0
    && activeSequence === checkSequence
    && normalizedUserId(activeCheckUserId) === expectedUserId
    && normalizedUserId(authenticatedUserId) === expectedUserId;
}

export function resolveCurrentAdminStatusCheck({
  data = null,
  error = null,
  ...identity
} = {}) {
  if (!isCurrentAccountAccessCheck(identity)) {
    return { current: false };
  }

  return {
    current: true,
    isAdmin: !error
      && normalizedUserId(data?.user_id) === normalizedUserId(identity.checkedUserId),
    error: error || null
  };
}

/**
 * Administrator membership is an optional elevation lookup. A failed or slow
 * lookup must fail closed (never grant admin access), but it must not prevent a
 * separately approved teacher account from signing in.
 */
export async function readOptionalAdminStatus(read) {
  if (typeof read !== "function") {
    throw new TypeError("The optional admin-status lookup needs a read function.");
  }

  try {
    return await read();
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Await one of the later account-access reads without letting its result
 * outlive the request or authenticated identity that started it.
 *
 * The first parallel lookup is not the only asynchronous boundary: an
 * administrator may need a profile row and a new teacher may need a pending
 * account upsert. Each later result must pass the same identity check again.
 */
export async function awaitCurrentAccountAccessStage({
  checkSequence,
  checkedUserId,
  read,
  getActiveIdentity
} = {}) {
  if (typeof read !== "function" || typeof getActiveIdentity !== "function") {
    throw new TypeError("A guarded account-access stage needs a read and an identity reader.");
  }

  const result = await read();
  const active = getActiveIdentity() || {};
  if (!isCurrentAccountAccessCheck({
    checkSequence,
    checkedUserId,
    activeSequence: active.activeSequence,
    activeCheckUserId: active.activeCheckUserId,
    authenticatedUserId: active.authenticatedUserId
  })) {
    return { current: false };
  }
  return { current: true, result };
}
