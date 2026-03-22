# Daily Challenge Backend API (No Progress)

## Rules
- Daily free attempts: 3
- No progress persistence (no level checkpoint/save)
- Only level-2 result is submitted
- Revive: max 2 per session, +180 seconds each
- Passed users cannot start again the same day

## Functions
1. `get_open_id`
2. `get_daily_status`
3. `start_game_session`
4. `submit_level2_result`
5. `request_revive`
6. `get_province_leaderboard`
7. `get_home_stats`

## Data Collections
- `daily_user_state`: `openId, date, freeUsed, passedToday, updatedAt`
- `game_session`: `sessionId, openId, mode, date, reviveUsed, status, createdAt, updatedAt, expireAt`
- `level2_result`: `sessionId, openId, mode, province, status, time, errors, completed, totalNumbers, playedAt, date`

## Request/Response Samples

### `submit_level2_result`
Request:
```json
{
  "openId": "string",
  "sessionId": "gs_xxx",
  "mode": "hard",
  "status": "pass",
  "stats": { "time": 620, "errors": 5, "completed": 100, "totalNumbers": 100 },
  "playedAt": 1760000000000
}
```

Response:
```json
{
  "success": true,
  "code": 0,
  "data": {
    "accepted": true,
    "leaderboardUpdated": true,
    "passedToday": true,
    "canStartToday": false
  }
}
```

### `request_revive`
Request:
```json
{
  "openId": "string",
  "sessionId": "gs_xxx",
  "adCompleted": true,
  "adTraceId": "ad_xxx"
}
```

Success:
```json
{
  "success": true,
  "code": 0,
  "data": {
    "allowed": true,
    "reviveUsed": 1,
    "reviveLeft": 1,
    "timeBonusSec": 180
  }
}
```

Failure:
```json
{
  "success": false,
  "code": 4101,
  "message": "revive_limit_exceeded"
}
```