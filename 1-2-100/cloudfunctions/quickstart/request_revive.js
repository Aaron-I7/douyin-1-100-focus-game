const {
  REVIVE_LIMIT,
  REVIVE_BONUS_SEC,
  getContextOpenId,
  now,
  toNumber,
  getCollections,
  queryFirst,
  upsertByWhere,
  errorResult,
  ok
} = require('./_shared');

module.exports = async function requestRevive(params = {}, context) {
  try {
    const openId = params.openId || getContextOpenId(context);
    const sessionId = params.sessionId;
    const adCompleted = !!params.adCompleted;

    if (!openId) {
      return errorResult(4001, 'open_id_missing');
    }
    if (!sessionId) {
      return errorResult(4002, 'session_id_missing');
    }
    if (!adCompleted) {
      return errorResult(4102, 'ad_not_completed');
    }

    const { gameSession } = getCollections();
    const session = await queryFirst(gameSession, { sessionId, openId });
    if (!session) {
      return errorResult(4100, 'session_not_found');
    }

    const reviveUsed = toNumber(session.reviveUsed, 0);
    if (reviveUsed >= REVIVE_LIMIT) {
      return errorResult(4101, 'revive_limit_exceeded');
    }

    const nextReviveUsed = reviveUsed + 1;
    await upsertByWhere(gameSession, { sessionId, openId }, {
      mode: session.mode || 'simple',
      date: session.date,
      status: session.status || 'active',
      reviveUsed: nextReviveUsed,
      updatedAt: now()
    });

    return ok({
      allowed: true,
      reviveUsed: nextReviveUsed,
      reviveLeft: Math.max(0, REVIVE_LIMIT - nextReviveUsed),
      timeBonusSec: REVIVE_BONUS_SEC
    });
  } catch (error) {
    return errorResult(5004, 'request_revive_failed', { error: error.message });
  }
};