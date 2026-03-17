# save_progress 云函数

## 功能描述

保存用户游戏进度到抖音云数据库，支持并发写入处理和数据一致性保证。

## 参数

### 输入参数 (params)

```javascript
{
  openId: string,           // 用户唯一标识 (必需)
  progressData: {           // 用户进度数据 (必需)
    currentLevel: 1 | 2 | 'custom',     // 当前关卡
    level1Completed: boolean,            // 第一关是否完成
    level2Completed: boolean,            // 第二关是否完成
    customModeUnlocked: boolean,         // 自选模式是否解锁
    bestScores: {                        // 最佳成绩记录
      level1?: ScoreRecord,
      level2?: ScoreRecord,
      custom_10_free?: ScoreRecord,
      custom_10_60?: ScoreRecord,
      custom_100_free?: ScoreRecord,
      custom_100_60?: ScoreRecord,
      custom_100_120?: ScoreRecord,
      custom_100_180?: ScoreRecord
    },
    totalGames: number,      // 总游戏次数
    totalErrors: number,     // 总错误次数
    createdAt?: number       // 创建时间戳 (可选，新用户自动设置)
  }
}
```

### ScoreRecord 结构

```javascript
{
  time: number,        // 完成时间（秒）
  errors: number,      // 错误次数
  timestamp: number,   // 记录时间戳
  level: string,       // 关卡标识
  difficulty: number   // 时间限制（秒），0 表示自由模式
}
```

## 返回值

### 成功响应

```javascript
{
  success: true,
  code: 0,
  message: "用户进度保存成功" | "用户进度更新成功" | "用户进度更新成功（重试）",
  data: {
    operation: "insert" | "update" | "retry_update",
    id?: string,           // 新建记录时返回
    updated?: number,      // 更新记录时返回更新数量
    updateTime: number     // 更新时间戳
  }
}
```

### 错误响应

```javascript
{
  success: false,
  code: 1,
  message: string,       // 错误描述
  data: {
    error?: string,      // 错误信息
    stack?: string       // 错误堆栈 (调试用)
  }
}
```

## 并发处理策略

函数采用三层并发处理策略确保数据一致性：

1. **首次尝试更新**: 使用 `where({ openId }).update()` 尝试更新现有记录
2. **插入新记录**: 如果更新返回 0 条记录，说明用户不存在，执行插入操作
3. **重试更新**: 如果插入失败（可能由于并发冲突），再次尝试更新

这种策略有效处理以下并发场景：
- 多个请求同时为新用户创建记录
- 用户在多个设备上同时保存进度
- 网络重试导致的重复请求

## 数据库集合

- **集合名称**: `user_progress`
- **索引建议**: 在 `openId` 字段上创建唯一索引以提高查询性能

## 使用示例

### 客户端调用

```javascript
// 保存新用户进度
const result = await tt.cloud.callFunction({
  name: 'save_progress',
  data: {
    openId: 'user_12345',
    progressData: {
      currentLevel: 1,
      level1Completed: false,
      level2Completed: false,
      customModeUnlocked: false,
      bestScores: {},
      totalGames: 0,
      totalErrors: 0
    }
  }
});

// 更新用户进度
const result = await tt.cloud.callFunction({
  name: 'save_progress',
  data: {
    openId: 'user_12345',
    progressData: {
      currentLevel: 2,
      level1Completed: true,
      level2Completed: false,
      customModeUnlocked: false,
      bestScores: {
        level1: {
          time: 120,
          errors: 2,
          timestamp: Date.now(),
          level: 'level1',
          difficulty: 0
        }
      },
      totalGames: 1,
      totalErrors: 2,
      createdAt: 1647123456789
    }
  }
});
```

## 错误处理

函数会处理以下错误情况：

1. **参数验证错误**: 缺少必需参数时返回错误
2. **数据库连接错误**: 网络或数据库问题时返回错误
3. **并发冲突**: 通过重试机制自动处理
4. **权限错误**: 数据库权限问题时返回错误

## 性能考虑

- 使用索引优化查询性能
- 批量操作减少数据库调用
- 合理的重试策略避免无限循环
- 详细的日志记录便于问题排查

## 测试

运行测试命令：

```bash
npm test -- __tests__/save_progress.test.js
```

测试覆盖场景：
- 新用户进度保存
- 现有用户进度更新
- 并发写入冲突处理
- 参数验证
- 错误处理
- 时间戳处理