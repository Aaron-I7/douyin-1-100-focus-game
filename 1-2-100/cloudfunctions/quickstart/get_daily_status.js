const {
  getContextOpenId,
  getDateKey,
  getDailyState,
  normalizeDailyState,
  errorResult,
  ok
} = require('./_shared');

module.exports = async function getDailyStatus(params = {}, context) {
  try {
    const openId = params.openId || getContextOpenId(context);
    if (!openId) {
      return errorResult(4001, 'open_id_missing');
    }

    const date = getDateKey();
    const state = await getDailyState(openId, date);
    return ok(normalizeDailyState(state));
  } catch (error) {
    return errorResult(5001, 'get_daily_status_failed', { error: error.message });
  }
};