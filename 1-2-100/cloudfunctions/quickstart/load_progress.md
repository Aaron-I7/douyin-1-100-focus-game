# load_progress 云函数

## 功能描述

从抖音云数据库加载用户进度数据。如果用户不存在，返回默认的初始化数据，确保游戏能够正常启动。

## 输入参数

```javascript
{
  openId: string  // 用户的唯一标识符
}
```

## 返回数据

### 成功响应

```javascript
{
  success: true,
  code: 0,
  message: string,  // 操作结果描述
  data: {
    openId: string,
    currentLevel: 1 | 2 | 'custom',
    level1Completed: boolean,
    level2Completed: boolean,
    customModeUnlocked: boolean,
    bestScores: {
      level1?: ScoreRecord,
      level2?: ScoreRecord,
      custom_10_free?: ScoreRecord,
      custom_10_60?: ScoreRecord,
      custom_100_free?: ScoreRecord,
      custom_100_60?: ScoreRecord,
      custom_100_120?: ScoreRecord,
      custom_100_180?: ScoreRecord
    },
    totalGames: number,
    totalErrors: number,
    createdAt: number,
    updateTime: number,
    isNewUser: boolean  // 标识是否为新用户
  }
}
```

### 错误响应

```javascript
{
  success: false,
  code: 1,
  message: string,  // 错误描述
  data: null
}
```

## ScoreRecord 数据结构

```javascript
{
  time: number,        // 完成时间（秒）
  errors: number,      // 错误次数
  timestamp: number,   // 记录时间戳
  level: string,       // 关卡标识
  difficulty: number   // 时间限制（秒），0 表示自由模式
}
```

## 使用场景

1. **用户登录后加载进度**: 游戏启动时调用此函数获取用户的游戏进度
2. **新用户初始化**: 首次登录的用户会获得默认的初始化数据
3. **错误恢复**: 当数据库查询失败时，返回默认数据确保游戏可以继续

## 错误处理策略

### 1. 参数验证失败
- 缺少 openId 参数时返回错误响应

### 2. 数据库查询失败
- 返回默认数据，确保游戏不会因为网络问题而无法启动
- 设置 `isNewUser: true` 标识这是降级处理

### 3. 用户不存在
- 返回默认的初始化数据
- 设置 `isNewUser: true` 标识这是新用户

## 默认数据结构

```javascript
{
  openId: string,           // 传入的用户 ID
  currentLevel: 1,          // 从第一关开始
  level1Completed: false,   // 第一关未完成
  level2Completed: false,   // 第二关未完成
  customModeUnlocked: false,// 自选模式未解锁
  bestScores: {},           // 空的最佳成绩记录
  totalGames: 0,            // 总游戏次数为 0
  totalErrors: 0,           // 总错误次数为 0
  createdAt: Date.now(),    // 当前时间戳
  updateTime: Date.now(),   // 当前时间戳
  isNewUser: true           // 标识为新用户
}
```

## 调用示例

```javascript
// 在客户端调用云函数
const result = await tt.cloud.callFunction({
  name: 'load_progress',
  data: {
    openId: 'user_12345'
  }
});

if (result.result.success) {
  const userData = result.result.data;
  console.log('用户进度:', userData);
  
  if (userData.isNewUser) {
    console.log('这是新用户，显示新手引导');
  } else {
    console.log('老用户，当前关卡:', userData.currentLevel);
  }
} else {
  console.error('加载进度失败:', result.result.message);
}
```

## 与 save_progress 的配合使用

1. **游戏启动**: 调用 `load_progress` 获取用户数据
2. **游戏过程**: 根据加载的数据初始化游戏状态
3. **进度更新**: 调用 `save_progress` 保存用户进度
4. **数据同步**: 确保云端和本地数据的一致性

## 性能考虑

- 函数会优先返回数据库中的实际数据
- 当数据库不可用时，立即返回默认数据，避免长时间等待
- 使用索引查询（基于 openId）确保查询性能
- 错误处理不会阻塞游戏启动流程

## 日志记录

函数会记录以下关键信息：
- 查询的 openId
- 数据库查询结果
- 是否找到用户数据
- 任何错误信息

这些日志有助于调试和监控函数的运行状态。