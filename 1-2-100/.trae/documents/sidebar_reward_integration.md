# 抖音小游戏必接能力 - 侧边栏复访奖励接入文档

## 📋 能力介绍

侧边栏复访能力是抖音小游戏的**必接审核**能力，未接入该能力的小游戏在「新游首发」&「版本更新」环节会有「拒审」风险。

### 能力目标
引导用户养成：打开抖音 → 打开首页侧边栏 → 快速访问小游戏的心智，大幅提升次留、7留。

### 适配宿主
- ✅ 抖音
- ✅ 抖音极速版
- ⏸️ 其他宿主可暂缓接入

---

## ✅ 已完成的接入工作

### 1. 创建侧边栏奖励系统
**文件**：`src/core/services/services-sidebar-reward-system.js`

**核心功能**：
- ✅ 启动监听（`tt.onShow`）- 在 game.js 启动时机同步监听
- ✅ 侧边栏支持检测（`tt.checkScene`）
- ✅ 场景判断（scene=021036, launch_from=homepage, location=sidebar_card）
- ✅ 奖励状态管理（每日可领取一次）
- ✅ 自动跳转侧边栏（`tt.navigateToScene`）
- ✅ 本地存储奖励状态

### 2. 游戏入口集成
**文件**：`game.js`

**修改内容**：
```javascript
// ⭐ 必接能力：侧边栏复访奖励系统
// 必须在游戏启动时机（game.js 运行时机）同步初始化
const { getSidebarRewardSystem } = require('./src/core/services/services-sidebar-reward-system');
const sidebarRewardSystem = getSidebarRewardSystem();
```

**关键点**：
- ✅ 在 game.js 运行时机同步初始化
- ✅ 确保 tt.onShow 监听时机足够早
- ✅ 避免用户从侧边栏返回后无法领取奖励

### 3. UI 界面集成
**文件**：`src/core/ui/ui-ui-manager.js`

**新增功能**：
- ✅ 首页显示礼包图标（带动画效果）
- ✅ 奖励对话框（显示步骤和奖励内容）
- ✅ 自动跳转按钮
- ✅ 领取奖励按钮
- ✅ 点击事件处理

---

## 🎮 用户体验流程

### 第一步：游戏主页显示礼包
- 位置：左上角，顶部数据卡片下方
- 样式：金色渐变背景 + 礼包图标 🎁
- 动画：脉冲动画效果
- 标签：NEW 红色徽章
- 文字：「限定福利」「每日可领」

### 第二步：点击礼包显示引导
对话框内容：
- 标题：「抖音首页侧边栏入口奖励」
- 奖励内容：
  - 提示卡 x1
  - 金币 x100
- 操作步骤：
  1. 点击下方「去首页侧边栏」按钮
  2. 在侧边栏，点击「1-100」
  3. 返回游戏，领取奖励

### 第三步：自动跳转侧边栏
- 用户点击「去首页侧边栏」按钮
- 调用 `tt.navigateToScene({ scene: 'sidebar' })`
- 自动跳转到抖音首页侧边栏

### 第四步：从侧边栏返回并领取
- 用户在侧边栏点击游戏图标
- 游戏检测到从侧边栏启动（scene=021036）
- 按钮变为「立即领奖」状态
- 用户点击领取奖励

---

## 🔧 技术实现细节

### 启动监听
```javascript
// 必须在 game.js 运行时机同步监听
tt.onShow((options) => {
  console.log('[SidebarReward] onShow 触发:', options);
  
  // 保存最新的启动信息
  this.latestLaunchInfo = options;
  
  // 检查是否从侧边栏启动
  this.checkSidebarLaunch(options);
});
```

### 侧边栏启动判断
```javascript
const isSidebarLaunch = 
  options.scene === '021036' &&
  options.launch_from === 'homepage' &&
  options.location === 'sidebar_card';
```

### 侧边栏支持检测
```javascript
tt.checkScene({
  scene: 'sidebar',
  success: (res) => {
    // res.isExist === true 表示支持侧边栏
    this.sidebarSupported = res.isExist;
  }
});
```

### 跳转到侧边栏
```javascript
tt.navigateToScene({
  scene: 'sidebar',
  success: (res) => {
    console.log('跳转成功');
  },
  fail: (err) => {
    // 错误码 10101 表示需要更新抖音版本
    if (err.errCode === 10101) {
      tt.showToast({
        title: '请更新抖音到最新版本',
        icon: 'none'
      });
    }
  }
});
```

---

## 🧪 测试流程

### 方案 1：开发者工具模拟器测试
**要求**：抖音开发者工具 >= 4.1.7 版本

**步骤**：
1. 在代码中调用 `tt.navigateToScene({ scene: 'sidebar' })`
2. 点击模拟器的侧边栏进入小游戏
3. 检查 `tt.onShow` 回调参数：
   - scene: "021036"
   - launch_from: "homepage"
   - location: "sidebar_card"

**限制**：暂不支持 Unity 游戏

### 方案 2：修改启动参数测试
**步骤**：
1. IDE 中选中「添加编译模式」
2. 选中 021036 场景值
3. 用手机扫码预览或调试
4. 在真机上模拟侧边栏场景启动

### 方案 3：真机完整链路测试（推荐）
**步骤**：
1. 进入抖音开放平台控制台
2. 选择小游戏 → 开发设置 → 测试管理
3. 添加测试设备（扫码）
4. 在抖音中打开「开发者模式」
5. 选择测试版本或扫码指定版本
6. 从抖音首页侧边栏启动小游戏
7. 完整测试领取奖励流程

**注意**：未上线的小游戏需要联系客服加白处理

---

## 📊 数据监控

### 关键指标
- 侧边栏入口展示次数
- 礼包点击率
- 跳转侧边栏成功率
- 从侧边栏返回率
- 奖励领取率
- 次日留存提升

### 日志输出
系统会输出以下日志：
```
[SidebarReward] 初始化侧边栏奖励系统
[SidebarReward] 启动监听器已设置
[SidebarReward] 侧边栏支持状态: true
[SidebarReward] onShow 触发: {...}
[SidebarReward] 检测到从侧边栏启动！
[SidebarReward] 奖励已领取: {...}
```

---

## ⚠️ 注意事项

### 1. 监听时机（重要！）
❌ **错误**：在游戏初始化完成后才监听 tt.onShow
```javascript
// 错误示例
gameManager.init().then(() => {
  tt.onShow(...); // 太晚了！
});
```

✅ **正确**：在 game.js 运行时机同步监听
```javascript
// 正确示例
const sidebarRewardSystem = getSidebarRewardSystem(); // 立即初始化
// 构造函数中已经设置了 tt.onShow 监听
```

### 2. 使用最新启动信息（重要！）
❌ **错误**：使用首次启动信息判断
```javascript
// 错误示例
if (this.launchInfo.scene === '021036') { // 可能是旧数据
  // ...
}
```

✅ **正确**：使用最新的启动信息
```javascript
// 正确示例
if (this.latestLaunchInfo.scene === '021036') { // 最新数据
  // ...
}
```

### 3. 自动跳转侧边栏（强烈建议）
平台强烈建议接入「自动跳转侧边栏」能力，可大幅度降低用户跳出小游戏后的流失率。

✅ 已接入：`tt.navigateToScene({ scene: 'sidebar' })`

### 4. 错误处理
- 错误码 10101：平台权限拒绝，提示用户更新抖音版本
- 其他错误：记录日志，不影响游戏正常运行

---

## 🎨 设计规范

### 礼包入口设计
- ✅ 位置：游戏主页面显眼位置（左上角）
- ✅ 样式：动态图标，吸引用户点击
- ✅ 文案：「限定福利」「每日可领」
- ✅ 动画：脉冲动画效果
- ✅ 徽章：NEW 红色标签

### 引导对话框设计
- ✅ 标题：「抖音首页侧边栏入口奖励」
- ✅ 奖励展示：清晰列出奖励内容
- ✅ 步骤说明：3 步操作流程
- ✅ 按钮状态：
  - 未完成：「去首页侧边栏」（金色）
  - 已完成：「立即领奖」（绿色）
- ✅ 关闭按钮：右上角 X 按钮

### 奖励频次
建议设置为「每日」可领取，加强用户感知及留存。

✅ 已实现：每日可领取一次

---

## 🔄 兼容性处理

### 非抖音系宿主兼容
```javascript
// 方案 1：检查 API 是否存在
if (typeof tt !== 'undefined' && tt.navigateToScene) {
  // 调用 API
}

// 方案 2：检查宿主信息
const systemInfo = tt.getSystemInfoSync();
if (systemInfo.appName === 'Douyin') {
  // 抖音环境
}

// 方案 3：使用 tt.checkScene 检测
tt.checkScene({
  scene: 'sidebar',
  success: (res) => {
    if (res.isExist) {
      // 支持侧边栏
    }
  }
});
```

✅ 已实现：使用 `tt.checkScene` 检测支持状态

---

## 📝 常见问题

### Q1: 调用 tt.navigateToScene 时出现错误码 10101？
**A**: 更新到最新版本抖音进行开发测试。

### Q2: 为什么冷启动时监听不到 tt.onShow 的返回值？
**A**: 需要尽可能提前 tt.onShow 的监听时机，保证在 game.js 运行时启动监听。

✅ 已解决：在 game.js 顶部立即初始化

### Q3: 测试阶段，为什么在侧边栏看不到自己的小游戏？
**A**: 目前侧边栏仅支持展示已上线的小游戏，未上线的小游戏可通过测试方案 1 或方案 2 进行测试。

### Q4: 接入侧边栏能力后，如何做非抖音系宿主的兼容？
**A**: 使用 `tt.checkScene` 检测支持状态，不支持时不显示入口。

✅ 已实现：`shouldShowRewardEntry()` 方法会检查支持状态

---

## 📦 文件清单

### 新增文件
1. `src/core/services/services-sidebar-reward-system.js` - 侧边栏奖励系统

### 修改文件
1. `game.js` - 添加系统初始化
2. `src/core/ui/ui-ui-manager.js` - 添加 UI 显示和交互

---

## 🚀 上线检查清单

### 代码检查
- [x] tt.onShow 监听时机正确（game.js 运行时机）
- [x] 使用最新启动信息判断（latestLaunchInfo）
- [x] 实现自动跳转侧边栏（tt.navigateToScene）
- [x] 错误处理完善（错误码 10101）
- [x] 本地存储奖励状态
- [x] 每日可领取一次

### UI 检查
- [x] 首页显示礼包入口
- [x] 礼包入口有动画效果
- [x] 引导对话框内容完整
- [x] 按钮状态正确切换
- [x] 关闭按钮可用

### 测试检查
- [ ] 开发者工具模拟器测试通过
- [ ] 真机完整链路测试通过
- [ ] 从侧边栏启动能正确识别
- [ ] 奖励能正常领取
- [ ] 每日只能领取一次
- [ ] 非抖音环境不显示入口

### 文档检查
- [x] 接入文档完整
- [x] 代码注释清晰
- [x] 日志输出完善

---

## 📞 技术支持

如有问题，请联系：
- 抖音开放平台 - 控制台 - 我的应用 - 小游戏 tab - 右下角「开发者助手」- 「在线客服」

---

## 📅 更新记录

### v1.0 (2025-01-16)
- ✅ 完成侧边栏奖励系统开发
- ✅ 完成 UI 界面集成
- ✅ 完成游戏入口集成
- ✅ 完成接入文档编写

---

生成时间：2025-01-16
版本：v1.0
状态：✅ 已完成接入，待测试
