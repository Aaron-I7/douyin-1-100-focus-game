const {
  getContextOpenId,
  getDateKey,
  now,
  normalizeMode,
  toNumber,
  normalizeDailyState,
  getCollections,
  queryFirst,
  getDailyState,
  saveDailyState,
  upsertByWhere,
  errorResult,
  ok
} = require('./_shared');

module.exports = async function submitLevel2Result(params = {}, context) {
  try {
    const openId = params.openId || getContextOpenId(context);
    const sessionId = params.sessionId;
    const mode = normalizeMode(params.mode);
    const status = params.status === 'pass' ? 'pass' : 'fail';
    const playedAt = toNumber(params.playedAt, now());
    const date = getDateKey(playedAt);

    if (!openId) {
      return errorResult(4001, 'open_id_missing');
    }
    if (!sessionId) {
      return errorResult(4002, 'session_id_missing');
    }

    const { gameSession, level2Result } = getCollections();
    const session = await queryFirst(gameSession, { sessionId, openId });
    if (!session) {
      return errorResult(4404, 'session_not_found');
    }

    const existingResult = await queryFirst(level2Result, { sessionId, openId });
    const stats = params.stats || {};
    const payload = {
      sessionId,
      openId,
      mode,
      province: params.province || session.province || '未知地区',
      status,
      time: toNumber(stats.time, 0),
      errors: toNumber(stats.errors, 0),
      completed: toNumber(stats.completed, 0),
      totalNumbers: toNumber(stats.totalNumbers, 100),
      playedAt,
      date,
      updatedAt: now()
    };

    if (!existingResult) {
      await level2Result.add({
        ...payload,
        createdAt: now()
      });
    } else {
      await upsertByWhere(level2Result, { sessionId, openId }, payload);
    }

    await upsertByWhere(gameSession, { sessionId, openId }, {
      mode,
      date,
      status: 'submitted',
      resultStatus: status,
      reviveUsed: toNumber(session.reviveUsed, 0),
      updatedAt: now(),
      completedAt: now()
    });

    const currentDaily = await getDailyState(openId, date);
    const nextDaily = await saveDailyState(openId, date, {
      freeUsed: toNumber(currentDaily.freeUsed, 0),
      passedToday: status === 'pass' ? true : !!currentDaily.passedToday
    });
    const normalizedDaily = normalizeDailyState(nextDaily);

    return ok({
      accepted: true,
      leaderboardUpdated: true,
      passedToday: normalizedDaily.passedToday,
      canStartToday: normalizedDaily.canStart,
      ...normalizedDaily
    });
  } catch (error) {
    return errorResult(5003, 'submit_level2_result_failed', { error: error.message });
  }
};