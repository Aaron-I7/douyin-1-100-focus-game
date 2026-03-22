# Plan: Remove Unused Cloud Functions and Cleanup Code

## Summary
Remove all cloud functions except `get_open_id` from the project and refactor the client-side code to stop calling these removed functions. The game will rely on local logic or direct database access (where applicable) instead of cloud function calls for progress saving and daily challenges.

## Current State Analysis
- **Cloud Functions**: The `cloudfunctions/quickstart/` directory contains multiple functions (`load_progress`, `save_progress`, `get_daily_config`, etc.) that are no longer needed.
- **Client Service**: `CloudStorageService` (legacy and new) calls these functions via `tt.cloud.callFunction`.
- **Game Runtime**: `GameManager` calls `startDailyRound` and `submitDailyRound` to track daily challenge limits.

## Proposed Changes

### 1. Delete Cloud Functions
Remove the following files from `cloudfunctions/quickstart/`:
- `antidirt.js`
- `consume_revive.js`
- `get_daily_config.js`
- `insert_record.js`
- `load_progress.js`
- `qrcode_create.js`
- `save_progress.js`
- `select_record.js`
- `start_daily_round.js`
- `submit_daily_round.js`
- `update_record.js`
- Related `.ts` and test files if present.

**Keep**: `get_open_id.js` (and config files like `package.json`).

### 2. Refactor `CloudStorageService` (Legacy)
File: `src/core/data-fetch/data-fetch-cloud-storage-service-legacy.js`
- **Remove Methods**: `callDailyFunction`, `getDailyConfig`, `startDailyRound`, `submitDailyRound`, `consumeRevive`.
- **Update `saveToCloud`**: Remove the `tt.cloud.callFunction` block. Keep the direct DB access block (`this.db.collection(...).set(...)`).
- **Update `loadFromCloud`**: Remove the `tt.cloud.callFunction` block. Keep the direct DB access block.

### 3. Refactor `CloudStorageService` (New)
File: `src/core/data-fetch/data-fetch-cloud-storage-service.js`
- **Update `saveToCloud`**: Remove `tt.cloud.callFunction`.
- **Update `loadFromCloud`**: Remove `tt.cloud.callFunction`.

### 4. Refactor `GameManager` (Runtime Legacy)
File: `src/core/services/services-game-manager-runtime-legacy.js`
- **Update `startDailyRoundForCurrentLevel`**: Remove the call to `cloudStorageService.startDailyRound`. Make it simply return `true` (allowing the game to start).
- **Update `submitDailyRoundResult`**: Remove the call to `cloudStorageService.submitDailyRound`. Make it an empty function (or log only).

## Verification
- Check that the game starts without errors.
- Verify that `get_open_id` still works (login).
- Verify that progress saving/loading attempts to use direct DB access (or falls back to local storage) without throwing "cloud function not found" errors.
