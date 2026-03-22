const {
  getContextOpenId,
  getDateKey,
  getCollections,
  getDailyState,
  normalizeDailyState,
  errorResult,
  ok
} = require('./_shared');

module.exports = async function getHomeStats(params = {}, context) {
  try {
    const openId = params.openId || getContextOpenId(context);
    const date = getDateKey();
    const { gameSession, level2Result } = getCollections();

    const [sessionQuery, passQuery] = await Promise.all([
      gameSession.where({ date }).get(),
      level2Result.where({ date, status: 'pass' }).get()
    ]);

    const challengeCount = sessionQuery && Array.isArray(sessionQuery.data)
      ? sessionQuery.data.length
      : 0;
    const todayPassCount = passQuery && Array.isArray(passQuery.data)
      ? passQuery.data.length
      : 0;

    let freePlayLeft = 3;
    let passedToday = false;
    let canStart = true;

    if (openId) {
      const state = await getDailyState(openId, date);
      const normalized = normalizeDailyState(state);
      freePlayLeft = normalized.freeLeft;
      passedToday = normalized.passedToday;
      canStart = normalized.canStart;
    }

    return ok({
      challengeCount,
      todayPassCount,
      freePlayLeft,
      passedToday,
      canStart
    });
  } catch (error) {
    return errorResult(5006, 'get_home_stats_failed', { error: error.message });
  }
};