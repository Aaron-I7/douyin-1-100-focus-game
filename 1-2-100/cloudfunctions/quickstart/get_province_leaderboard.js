const {
  MODES,
  normalizeMode,
  getCollections,
  errorResult,
  ok
} = require('./_shared');

function toLeaderboardRows(records) {
  const provinceMap = new Map();
  records.forEach((row) => {
    const province = row.province || '未知地区';
    provinceMap.set(province, (provinceMap.get(province) || 0) + 1);
  });

  const sorted = Array.from(provinceMap.entries())
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return sorted.map((item, index) => ({
    rank: index + 1,
    province: item.province,
    count: item.count
  }));
}

async function fetchModeLeaderboard(level2Result, mode) {
  const queryResult = await level2Result.where({ mode, status: 'pass' }).get();
  const rows = queryResult && Array.isArray(queryResult.data) ? queryResult.data : [];
  return toLeaderboardRows(rows);
}

module.exports = async function getProvinceLeaderboard(params = {}) {
  try {
    const { level2Result } = getCollections();
    const requestedMode = params.mode;

    if (requestedMode) {
      const mode = normalizeMode(requestedMode);
      const rows = await fetchModeLeaderboard(level2Result, mode);
      return ok(rows);
    }

    const data = {};
    for (const mode of MODES) {
      data[mode] = await fetchModeLeaderboard(level2Result, mode);
    }
    return ok(data);
  } catch (error) {
    return errorResult(5005, 'get_province_leaderboard_failed', { error: error.message });
  }
};