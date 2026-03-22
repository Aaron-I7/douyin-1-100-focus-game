const { dySDK } = require('@open-dy/node-server-sdk');

const DAILY_FREE_TOTAL = 3;
const REVIVE_LIMIT = 2;
const REVIVE_BONUS_SEC = 180;
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const MODES = ['simple', 'hard', 'hell'];

function now() {
  return Date.now();
}

function getDateKey(timestamp = now()) {
  // Asia/Shanghai day key
  const shifted = new Date(timestamp + (8 * 60 * 60 * 1000));
  return shifted.toISOString().slice(0, 10);
}

function randomId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getContextOpenId(context) {
  try {
    const serviceContext = dySDK.context(context);
    const reqContext = serviceContext.getContext();
    return reqContext && reqContext.openId ? reqContext.openId : '';
  } catch (error) {
    return '';
  }
}

function getCollections() {
  const database = dySDK.database();
  return {
    dailyState: database.collection('daily_user_state'),
    gameSession: database.collection('game_session'),
    level2Result: database.collection('level2_result')
  };
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeMode(mode) {
  return MODES.includes(mode) ? mode : 'simple';
}

function normalizeDailyState(raw = {}) {
  const freeUsed = Math.max(0, Math.min(DAILY_FREE_TOTAL, toNumber(raw.freeUsed, 0)));
  const passedToday = !!raw.passedToday;
  const freeLeft = Math.max(0, DAILY_FREE_TOTAL - freeUsed);
  return {
    date: raw.date || getDateKey(),
    freeTotal: DAILY_FREE_TOTAL,
    freeUsed,
    freeLeft,
    passedToday,
    canStart: !passedToday && freeLeft > 0
  };
}

async function queryFirst(collection, where) {
  const result = await collection.where(where).get();
  if (result && Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0];
  }
  return null;
}

async function upsertByWhere(collection, where, data) {
  const payload = {
    ...where,
    ...data
  };
  const updated = await collection.where(where).update(payload);
  if (updated && updated.stats && Number(updated.stats.updated) > 0) {
    return { action: 'update', updated: Number(updated.stats.updated) };
  }
  const inserted = await collection.add(payload);
  return { action: 'insert', id: inserted && inserted._id ? inserted._id : null };
}

async function getDailyState(openId, date) {
  const { dailyState } = getCollections();
  const doc = await queryFirst(dailyState, { openId, date });
  if (!doc) {
    return {
      openId,
      date,
      freeUsed: 0,
      passedToday: false,
      updatedAt: now()
    };
  }
  return {
    openId,
    date,
    freeUsed: toNumber(doc.freeUsed, 0),
    passedToday: !!doc.passedToday,
    updatedAt: toNumber(doc.updatedAt, now())
  };
}

async function saveDailyState(openId, date, partial) {
  const { dailyState } = getCollections();
  const next = {
    openId,
    date,
    freeUsed: Math.max(0, Math.min(DAILY_FREE_TOTAL, toNumber(partial.freeUsed, 0))),
    passedToday: !!partial.passedToday,
    updatedAt: now()
  };
  await upsertByWhere(dailyState, { openId, date }, next);
  return next;
}

function errorResult(code, message, data = null) {
  return {
    success: false,
    code,
    message,
    data
  };
}

function ok(data = {}) {
  return {
    success: true,
    code: 0,
    message: '',
    data
  };
}

module.exports = {
  DAILY_FREE_TOTAL,
  REVIVE_LIMIT,
  REVIVE_BONUS_SEC,
  SESSION_TTL_MS,
  MODES,
  now,
  getDateKey,
  randomId,
  getContextOpenId,
  getCollections,
  toNumber,
  normalizeMode,
  normalizeDailyState,
  queryFirst,
  upsertByWhere,
  getDailyState,
  saveDailyState,
  errorResult,
  ok
};