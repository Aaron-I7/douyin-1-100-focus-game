const {
  DAILY_FREE_TOTAL,
  SESSION_TTL_MS,
  getContextOpenId,
  getDateKey,
  now,
  randomId,
  normalizeMode,
  normalizeDailyState,
  getCollections,
  getDailyState,
  saveDailyState,
  errorResult,
  ok
} = require('./_shared');

module.exports = async function startGameSession(params = {}, context) {
  try {
    const openId = params.openId || getContextOpenId(context);
    if (!openId) {
      return errorResult(4001, 'open_id_missing');
    }

    const mode = normalizeMode(params.mode);
    const date = getDateKey();
    const currentState = await getDailyState(openId, date);
    const normalized = normalizeDailyState(currentState);

    if (normalized.passedToday) {
      return {
        success: false,
        code: 4301,
        message: 'passed_today',
        data: {
          allowed: false,
          ...normalized
        }
      };
    }

    if (normalized.freeUsed >= DAILY_FREE_TOTAL) {
      return {
        success: false,
        code: 4302,
        message: 'daily_free_limit_exceeded',
        data: {
          allowed: false,
          ...normalized
        }
      };
    }

    const nextState = await saveDailyState(openId, date, {
      freeUsed: normalized.freeUsed + 1,
      passedToday: normalized.passedToday
    });
    const nextDaily = normalizeDailyState(nextState);

    const { gameSession } = getCollections();
    const sessionId = randomId('gs');
    await gameSession.add({
      sessionId,
      openId,
      mode,
      date,
      reviveUsed: 0,
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
      expireAt: now() + SESSION_TTL_MS
    });

    return ok({
      allowed: true,
      sessionId,
      openId,
      mode,
      reviveUsed: 0,
      ...nextDaily
    });
  } catch (error) {
    return errorResult(5002, 'start_game_session_failed', { error: error.message });
  }
};