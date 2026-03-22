# 抖音云对接指导文档（针对当前项目）

更新时间：2026-03-21
适用项目：`1-2-100`（legacy 链路）

## 1. 目标与范围

本文面向你当前项目，目标是完成以下能力：

1. 小游戏端调用抖音云函数
2. 云函数读写云数据库
3. 支持日挑战规则（每日 3 次、二关原子结算、复活每局 2 次 +180s）
4. 首页统计和分难度省份榜来自云端

本项目当前已实现的云函数接口：

- `get_open_id`
- `get_daily_status`
- `start_game_session`
- `submit_level2_result`
- `request_revive`
- `get_province_leaderboard`
- `get_home_stats`

---

## 2. 先解决你当前的报错（101003）

你遇到的错误：

- `Please input correct serviceID, and the serviceID must be associated with current appID`

含义：

- 轻服务环境要求云初始化时传入有效 `serviceID`，且必须和当前 `appID` 绑定。

当前代码已做保护：

- 未配置 `serviceID/env` 时会跳过云初始化，不再因 `tt.cloud.init()` 直接崩溃。

你要真正启用云，必须补配置：

1. 在抖音云控制台创建云服务，拿到 `serviceID`（或 `envID`）
2. 确认该云服务绑定了当前小游戏 `appID`（`project.config.json` 中的 `appid`）
3. 在 `GameManager` 注入配置（示例）

```js
// game.js / 启动配置处
this.cloudServiceId = '你的-serviceID';
// 或
this.cloudEnvId = '你的-envID';
```

项目中初始化位置：

- `src/core/services/services-game-manager-init-flow-legacy.js`
  - `initCloudServices()`
  - `getCloudInitOptions()`

---

## 3. 控制台准备（必须）

### 3.1 开通抖音云

在抖音开放平台控制台完成：

1. 开通抖音云
2. 创建云服务
3. 绑定小游戏应用
4. 获取 `serviceID` / `envID`

### 3.2 开通云数据库并建集合

本项目需要 3 个集合：

1. `daily_user_state`
2. `game_session`
3. `level2_result`

建议字段结构：

#### `daily_user_state`

```json
{
  "openId": "string",
  "date": "YYYY-MM-DD",
  "freeUsed": 0,
  "passedToday": false,
  "updatedAt": 1760000000000
}
```

#### `game_session`

```json
{
  "sessionId": "gs_xxx",
  "openId": "string",
  "mode": "simple|hard|hell",
  "date": "YYYY-MM-DD",
  "reviveUsed": 0,
  "status": "active|submitted",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000,
  "expireAt": 1760000000000
}
```

#### `level2_result`

```json
{
  "sessionId": "gs_xxx",
  "openId": "string",
  "mode": "simple|hard|hell",
  "province": "广东省",
  "status": "pass|fail",
  "time": 620,
  "errors": 5,
  "completed": 100,
  "totalNumbers": 100,
  "playedAt": 1760000000000,
  "date": "YYYY-MM-DD",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### 3.3 索引建议（强烈建议）

- `daily_user_state`: `(openId, date)` 唯一
- `game_session`: `(sessionId, openId)` 唯一
- `game_session`: `(openId, date)` 普通
- `level2_result`: `(sessionId, openId)` 唯一
- `level2_result`: `(date, mode, status)` 普通（用于榜单聚合）

---

## 4. 代码目录与发布

当前云函数目录：

- `cloudfunctions/quickstart/`

核心文件：

- `_shared.js`（公共逻辑）
- `get_open_id.js`
- `get_daily_status.js`
- `start_game_session.js`
- `submit_level2_result.js`
- `request_revive.js`
- `get_province_leaderboard.js`
- `get_home_stats.js`

工程配置：

- `project.config.json` 中 `cloudfunctionRoot` 已是 `cloudfunctions/`

发布流程（建议）：

1. 在 IDE 打开云函数面板
2. 逐个上传 `quickstart` 下函数
3. 检查依赖安装（`cloudfunctions/quickstart/package.json`）
4. 云端测试函数入参/出参

---

## 5. 客户端接入链路（本项目）

### 5.1 初始化

文件：`src/core/services/services-game-manager-init-flow-legacy.js`

- `initCloudServices()`：初始化云，失败降级
- `getCloudInitOptions()`：读取 `serviceID/env` 配置

### 5.2 云调用封装

文件：`src/core/services/services-game-manager-runtime-legacy.js`

- `callCloudFunction(name, data)`
- `cloudEnabled` 为 `false` 时直接跳过

### 5.3 游戏流程对应接口

1. 首页刷新
   - `get_daily_status`
   - `get_home_stats`
   - `get_province_leaderboard`

2. 开局（仅第一关扣次数）
   - `start_game_session`

3. 第二关结算（唯一上报）
   - `submit_level2_result`

4. 倒计时结束复活
   - 先弹确认 + 看激励广告
   - 再 `request_revive`
   - 成功则 `+180s`，每局最多 2 次

---

## 6. 接口契约（当前实现）

### 6.1 `start_game_session`

请求：

```json
{
  "openId": "string",
  "mode": "hard"
}
```

成功响应（示例）：

```json
{
  "success": true,
  "code": 0,
  "data": {
    "allowed": true,
    "sessionId": "gs_xxx",
    "freeUsed": 1,
    "freeLeft": 2,
    "passedToday": false,
    "canStart": true
  }
}
```

### 6.2 `submit_level2_result`

请求：

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

响应：

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

### 6.3 `request_revive`

请求：

```json
{
  "openId": "string",
  "sessionId": "gs_xxx",
  "adCompleted": true,
  "adTraceId": "ad_xxx"
}
```

成功：

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

失败（超限）：

```json
{
  "success": false,
  "code": 4101,
  "message": "revive_limit_exceeded"
}
```

---

## 7. 联调清单（建议按顺序）

1. 不配 `serviceID` 启动
   - 预期：不崩溃，日志提示 cloud skipped

2. 配正确 `serviceID` 后启动
   - 预期：`cloudEnabled=true`，无 101003

3. 首页加载
   - 预期：能拿到 `freeLeft`、首页统计、榜单

4. 开局连续点击 4 次
   - 预期：第 4 次被拒（每日 3 次）

5. 第一关结束
   - 预期：不触发结果上报

6. 第二关 fail
   - 预期：写入 `level2_result(status=fail)`，未通关可继续（若有次数）

7. 第二关 pass
   - 预期：`passedToday=true`，当天不可再开局

8. 复活验证
   - 同一 `sessionId` 第 1/2 次成功，第 3 次失败
   - 每次固定 `timeBonusSec=180`

---

## 8. 常见问题

### Q1：再次出现 101003 怎么办？

按这个顺序排查：

1. `serviceID` 是否为空
2. `serviceID` 是否与当前 `appid` 绑定
3. 是否切错了测试/正式环境
4. 账号是否有该云服务权限

### Q2：云函数返回成功，但前端没更新？

检查：

1. 前端是否读取 `result.data`
2. 前端对 `success=false` 分支是否兜底
3. 字段名是否和接口契约一致（`passedToday/freeLeft/canStart`）

### Q3：榜单没有变化？

检查：

1. 是否只上报了第二关（符合设计）
2. `get_province_leaderboard` 是否按 `status=pass` 聚合
3. 是否按 `mode` 分榜

---

## 9. 安全与一致性建议

1. 不信任客户端 `openId`，优先用服务端上下文 openId
2. `sessionId + openId` 作为幂等键
3. `submit_level2_result` 要支持重复提交幂等更新
4. `request_revive` 必须服务端判断上限，不能靠前端计数
5. 使用服务器日期作为 `date`，避免客户端改时间作弊

---

## 10. 参考文档（官方）

1. 抖音云（小游戏开发工具）
   - https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/dev-tools/dycloud/intro
2. 抖音云客户端能力（含 `tt.createCloud` 参数说明：`envID/serviceID`）
   - https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/develop-guide/tos/tos-client-api
3. 小游戏开发指南（工程结构与配置）
   - https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/dev-guide/bytedance-mini-game

> 说明：抖音云文档页面部分内容在 IDE/站点中为动态渲染，建议你在浏览器登录开发者平台后查看同链接全文。