# 文件清理执行计划

## 当前发现的不需要文件清单

### 1. 广告相关（4个文件）
- ✅ `src/core/services/services-ad-manager.js` - 广告管理器
- ✅ `src/core/services/services-ad-error-handler.js` - 广告错误处理
- ✅ `src/core/state/state-hint-system.js` - 提示系统（依赖广告）
- ✅ `src/core/state/state-revival-system.js` - 复活系统（依赖广告）

### 2. 数据分析相关（3个文件）
- ✅ `src/core/services/services-analytics-manager.js` - 数据分析管理器
- ✅ `src/core/services/services-analytics-integration.js` - 数据分析集成
- ✅ `src/core/services/services-game-analytics.js` - 游戏数据分析

### 3. 教程系统相关（2个文件）
- ✅ `src/core/services/services-tutorial-system.js` - 教程系统
- ✅ `src/core/services/services-tutorial-integration.js` - 教程集成

### 4. 备份文件（2个文件）
- ✅ `src/core/services/services-game-manager-init-flow-legacy.js.old` - 旧版备份
- ✅ `src/core/services/services-game-manager-init-flow-legacy-simple.js` - 简化版（已合并）

### 5. 保留但需要注意的文件
- ⚠️ `src/core/ui/ui-font-loading-integration.js` - 字体加载集成（保留，游戏需要）
- ⚠️ `src/core/services/services-error-handling-integration.js` - 错误处理集成（保留，游戏需要）
- ⚠️ `src/core/ui/ui-render-engine.js` - 渲染引擎（保留，但引用了 AnimationIntegration）

---

## 执行方案

### 方案A：移动到禁用目录（推荐）
优点：可以随时恢复，保留代码历史
```
创建目录结构：
1-2-100/src/core/_disabled/
├── ads/
├── analytics/
├── tutorial/
└── backup/
```

### 方案B：直接删除
优点：彻底清理，减少项目体积
缺点：需要从git历史恢复

---

## 推荐执行步骤

### 第1步：创建禁用目录
```bash
mkdir -p src/core/_disabled/ads
mkdir -p src/core/_disabled/analytics
mkdir -p src/core/_disabled/tutorial
mkdir -p src/core/_disabled/backup
```

### 第2步：移动文件
```bash
# 广告相关
mv src/core/services/services-ad-manager.js src/core/_disabled/ads/
mv src/core/services/services-ad-error-handler.js src/core/_disabled/ads/
mv src/core/state/state-hint-system.js src/core/_disabled/ads/
mv src/core/state/state-revival-system.js src/core/_disabled/ads/

# 数据分析相关
mv src/core/services/services-analytics-manager.js src/core/_disabled/analytics/
mv src/core/services/services-analytics-integration.js src/core/_disabled/analytics/
mv src/core/services/services-game-analytics.js src/core/_disabled/analytics/

# 教程系统
mv src/core/services/services-tutorial-system.js src/core/_disabled/tutorial/
mv src/core/services/services-tutorial-integration.js src/core/_disabled/tutorial/

# 备份文件（可以直接删除）
rm src/core/services/services-game-manager-init-flow-legacy.js.old
rm src/core/services/services-game-manager-init-flow-legacy-simple.js
```

### 第3步：修改 GameManager
需要移除以下代码段：
1. adManager 初始化和引用
2. analyticsManager 初始化和引用
3. 广告统计相关代码

### 第4步：检查其他引用
搜索并移除对这些模块的引用：
- `require('./services-ad-manager')`
- `require('./services-analytics-manager')`
- `require('./services-tutorial-system')`

---

## 用户确认

请确认您希望：
1. ✅ 移动文件到 `_disabled` 目录（推荐）
2. ❌ 直接删除文件

---

生成时间：2025-01-16
