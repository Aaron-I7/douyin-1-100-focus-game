# 项目文件完整清单与说明

## 📋 目录结构概览

```
1-2-100/
├── game.js                 # 游戏入口文件
├── lib.js                  # 库文件（合并后的代码）
├── game.json              # 游戏配置文件
├── project.config.json    # 项目配置文件
├── package.json           # npm 包配置
└── src/                   # 源代码目录
    ├── assets/            # 资源文件
    ├── core/              # 核心游戏逻辑
    ├── styles/            # 样式文件
    └── utils/             # 工具函数
```

---

## 🎮 根目录文件

### `game.js`
**作用**：游戏主入口文件
- 初始化游戏环境
- 创建 Canvas 画布
- 启动游戏引导流程
- 处理游戏生命周期

### `lib.js`
**作用**：编译后的库文件
- 包含所有核心游戏代码
- 由构建工具自动生成
- 用于生产环境部署

### `game.json`
**作用**：抖音小游戏配置文件
- 定义游戏基本信息（名称、版本）
- 配置设备方向（竖屏）
- 设置网络超时时间

### `project.config.json`
**作用**：抖音开发者工具项目配置
- 配置 appid
- 设置编译选项
- 定义调试设置

### `package.json`
**作用**：Node.js 项目配置
- 定义项目依赖
- 配置构建脚本
- 设置测试命令

---

## 📁 src/assets/ - 资源文件

### `assets/fonts/font-config.js`
**作用**：字体配置文件
- 定义游戏使用的字体列表
- 配置字体加载优先级
- 设置字体回退方案
- 管理字体加载策略

**关键功能**：
- 支持多种中文字体（思源黑体、苹方等）
- 字体预加载配置
- 字体加载失败降级处理

---

## 🎯 src/core/services/ - 核心服务

### 游戏管理器

#### `services-game-manager.js` ⭐ 核心
**作用**：游戏核心管理器
- 管理游戏状态（idle、playing、paused、finished）
- 控制游戏流程（开始、暂停、结束）
- 处理关卡切换
- 管理游戏数据（当前数字、错误次数、时间）
- 协调各个子系统

**关键功能**：
- `startLevel()` - 开始关卡
- `startGame()` - 开始游戏
- `handleCellClick()` - 处理点击事件
- `completeLevel()` - 完成关卡
- `gameOver()` - 游戏结束

#### `services-game-manager-init-flow-legacy.js`
**作用**：游戏初始化流程
- 初始化本地用户ID
- 加载本地用户数据
- 设置游戏初始状态
- 处理首次启动逻辑

#### `services-game-manager-runtime-legacy.js`
**作用**：游戏运行时管理
- 管理游戏循环
- 处理游戏更新逻辑
- 协调渲染和逻辑更新

#### `services-game-manager-ui-flow-legacy.js`
**作用**：游戏UI流程管理
- 管理UI状态切换
- 处理菜单显示
- 控制界面过渡

#### `services-game-bootstrap-legacy.js`
**作用**：游戏启动引导
- 创建 Canvas 画布
- 初始化屏幕适配器
- 启动游戏管理器
- 处理启动错误

### 错误处理

#### `services-global-error-handler.js`
**作用**：全局错误处理器
- 捕获未处理的异常
- 记录错误日志
- 显示错误提示
- 防止游戏崩溃

#### `services-error-handling-integration.js`
**作用**：错误处理集成
- 整合各种错误处理器
- 统一错误处理流程
- 错误分类和上报

#### `services-error-logger.js`
**作用**：错误日志记录器
- 记录错误详情
- 保存错误历史
- 生成错误报告

#### `services-canvas-error-handler.js`
**作用**：Canvas 错误处理
- 处理 Canvas 创建失败
- 处理渲染错误
- Canvas 上下文恢复

#### `services-touch-error-handler.js`
**作用**：触摸事件错误处理
- 处理触摸事件异常
- 防止触摸事件阻塞
- 触摸事件降级处理

#### `services-error-click-tracker.js`
**作用**：错误点击追踪
- 记录用户错误点击
- 分析点击模式
- 生成点击热力图

### 动画与视觉效果

#### `services-animation-integration.js`
**作用**：动画系统集成
- 整合各种动画效果
- 管理动画队列
- 控制动画播放

#### `services-decorative-elements-integration.js`
**作用**：装饰元素集成
- 管理背景装饰
- 控制粒子效果
- 协调视觉元素

#### `services-level-transition-animator.js`
**作用**：关卡过渡动画
- 播放关卡切换动画
- 显示"最后一关"提示
- 平滑过渡效果

### 分享功能

#### `services-share-manager.js`
**作用**：分享管理器
- 处理游戏分享
- 生成分享内容
- 跟踪分享结果

#### `services-share-manager-legacy.js`
**作用**：旧版分享管理器（备用）

---

## 🔧 src/core/shared/ - 共享组件

### 布局生成器

#### `shared-voronoi-generator.js` ⭐ 核心
**作用**：Voronoi 图生成器
- 生成不规则的数字格子
- 使用 Voronoi 算法分割空间
- 创建随机但均匀的布局
- 为每个格子分配数字

**关键功能**：
- `generate()` - 生成 Voronoi 图
- 支持 10 个或 100 个格子
- 自动调整格子大小

#### `shared-optimized-voronoi-generator.js`
**作用**：优化版 Voronoi 生成器
- 性能优化版本
- 减少内存占用
- 提高生成速度

#### `shared-voronoi-error-handler.js`
**作用**：Voronoi 生成错误处理
- 处理生成失败
- 自动重试机制
- 降级到网格布局

#### `shared-grid-layout-generator.js`
**作用**：网格布局生成器（降级方案）
- 生成规则的网格布局
- 当 Voronoi 生成失败时使用
- 保证游戏可玩性

#### `shared-layout-generators-legacy.js`
**作用**：旧版布局生成器（备用）

### 触摸处理

#### `shared-touch-handler.js` ⭐ 核心
**作用**：触摸事件处理器
- 监听触摸事件
- 判断点击的格子
- 触发点击回调
- 提供震动反馈

**关键功能**：
- `onCellClick` - 格子点击回调
- `vibrate()` - 震动反馈
- 点击区域判断

#### `shared-optimized-touch-handler.js`
**作用**：优化版触摸处理器
- 性能优化
- 减少事件处理延迟
- 提高响应速度

#### `shared-touch-handler-legacy.js`
**作用**：旧版触摸处理器（备用）

### 动画引擎

#### `shared-animation-engine.js`
**作用**：动画引擎
- 管理所有动画效果
- 控制动画播放
- 处理动画队列
- 提供动画API

**支持的动画**：
- 点击反馈动画
- 完成动画
- 过渡动画
- 粒子效果

#### `shared-memory-optimized-animation-engine.js`
**作用**：内存优化版动画引擎
- 减少内存占用
- 对象池管理
- 性能优化

### 视觉效果管理器

#### `shared-bounce-effects-manager.js`
**作用**：弹跳效果管理器
- 管理格子点击弹跳效果
- 控制弹跳动画
- 提供弹性反馈

#### `shared-floating-text-manager.js`
**作用**：浮动文字管理器
- 显示浮动提示文字
- 管理文字动画
- 控制文字消失

#### `shared-particle-effects-manager.js`
**作用**：粒子效果管理器
- 生成粒子效果
- 管理粒子生命周期
- 控制粒子动画

#### `shared-ripple-effects-manager.js`
**作用**：波纹效果管理器
- 生成点击波纹
- 管理波纹扩散
- 控制波纹消失

---

## 📊 src/core/state/ - 状态管理

### `state-level-manager.js` ⭐ 核心
**作用**：关卡管理器
- 管理关卡配置（第一关、第二关）
- 跟踪关卡进度
- 处理关卡解锁
- 保存关卡统计数据

**关卡配置**：
- 第一关：1-10 数字
- 第二关：1-100 数字
- 自选模式：可选 10 或 100

#### `state-level-manager-legacy.js`
**作用**：旧版关卡管理器（备用）

### `state-transition-manager.js`
**作用**：过渡管理器
- 管理关卡间过渡
- 显示过渡动画
- 控制过渡时机

#### `state-transition-manager-legacy.js`
**作用**：旧版过渡管理器（备用）

### `state-unlock-system.js`
**作用**：解锁系统
- 管理功能解锁（自选模式）
- 保存解锁状态到本地
- 检查解锁条件

**解锁内容**：
- 自选模式（通关第二关后解锁）
- 限时模式
- 其他功能

### `state-memory-manager.js`
**作用**：内存管理器
- 监控内存使用
- 清理无用对象
- 优化内存占用
- 防止内存泄漏

---

## 🎨 src/core/ui/ - UI 组件

### 渲染引擎

#### `ui-render-engine.js` ⭐ 核心
**作用**：渲染引擎
- 渲染游戏画面
- 绘制数字格子
- 显示游戏信息（时间、错误）
- 处理视觉反馈

**渲染内容**：
- 背景
- 数字格子（Voronoi 多边形）
- 顶部信息栏
- 动画效果

#### `ui-performance-optimized-render-engine.js`
**作用**：性能优化版渲染引擎
- 减少重绘次数
- 使用离屏 Canvas
- 优化渲染性能

#### `ui-render-engine-legacy.js`
**作用**：旧版渲染引擎（备用）

### UI 管理器

#### `ui-ui-manager.js` ⭐ 核心
**作用**：UI 管理器
- 管理所有UI界面
- 渲染菜单界面
- 显示结果界面
- 处理UI交互

**管理的界面**：
- 首页（深色主题）
- 游戏界面
- 结果界面
- 设置界面

#### `ui-ui-manager-with-fonts.js`
**作用**：带字体加载的 UI 管理器
- 集成字体加载
- 等待字体加载完成
- 优化文字渲染

#### `ui-ui-manager-legacy.js`
**作用**：旧版 UI 管理器（备用）

### 字体系统

#### `ui-font-manager.js`
**作用**：字体管理器
- 加载自定义字体
- 检测字体加载状态
- 管理字体回退
- 优化字体渲染

#### `ui-font-loading-integration.js`
**作用**：字体加载集成
- 整合字体加载到游戏启动流程
- 显示加载进度
- 处理加载失败

#### `ui-game-startup-with-fonts.js`
**作用**：带字体的游戏启动
- 先加载字体再启动游戏
- 显示加载界面
- 优化启动体验

### 主题系统

#### `ui-theme-system.js`
**作用**：主题系统
- 管理游戏配色方案
- 支持多种主题
- 动态切换主题

**支持的主题**：
- 深色主题（当前使用）
- 亮色主题
- 自定义主题

#### `ui-theme-system-legacy.js`
**作用**：旧版主题系统（备用）

### 视觉效果

#### `ui-background-decorator.js`
**作用**：背景装饰器
- 绘制背景图案
- 添加装饰元素
- 美化游戏界面

#### `ui-button-shadow-effects.js`
**作用**：按钮阴影效果
- 为按钮添加阴影
- 提供立体感
- 增强视觉效果

#### `ui-progress-bar-designer.js`
**作用**：进度条设计器
- 绘制进度条
- 显示加载进度
- 美化进度显示

### 屏幕适配

#### `ui-screen-adapter-legacy.js`
**作用**：屏幕适配器（旧版）
- 适配不同屏幕尺寸
- 计算安全区域
- 处理刘海屏

---

## 📦 src/core/types/ - 类型定义

### `types-data-structures.js`
**作用**：数据结构定义
- 定义游戏数据结构
- 提供类型检查
- 统一数据格式

**定义的结构**：
- Cell（格子）
- GameState（游戏状态）
- LevelConfig（关卡配置）

---

## 🚫 src/core/_disabled/ - 已禁用功能

### _disabled/ads/ - 广告功能（已禁用）

#### `services-ad-manager.js`
**作用**：广告管理器
- 管理激励视频广告
- 处理广告加载和播放
- 跟踪广告使用次数

#### `services-ad-error-handler.js`
**作用**：广告错误处理
- 处理广告加载失败
- 自动重试机制
- 降级处理

#### `state-hint-system.js`
**作用**：提示系统
- 观看广告获得提示
- 高亮显示目标数字 3 秒
- 限制每局 2 次

#### `state-revival-system.js`
**作用**：复活系统
- 观看广告复活
- 限时模式失败后增加 30 秒
- 限制每局 1 次

### _disabled/analytics/ - 数据分析（已禁用）

#### `services-analytics-manager.js`
**作用**：数据分析管理器
- 收集游戏事件
- 批量上报数据
- 管理事件队列

#### `services-analytics-integration.js`
**作用**：数据分析集成
- 整合分析到游戏流程
- 自动跟踪事件
- 统一上报接口

#### `services-game-analytics.js`
**作用**：游戏数据分析
- 跟踪游戏事件
- 分析玩家行为
- 生成统计报告

### _disabled/tutorial/ - 教程系统（已禁用）

#### `services-tutorial-system.js`
**作用**：教程系统
- 首次启动引导
- 显示游戏规则
- 目标提示（闪烁环）
- 关卡说明

#### `services-tutorial-integration.js`
**作用**：教程集成
- 整合教程到游戏流程
- 管理教程状态
- 控制教程显示

---

## 🎨 src/styles/ - 样式文件

### `game.css`
**作用**：游戏样式表
- 定义 Canvas 样式
- 设置页面布局
- 移动端适配

---

## 🛠️ src/utils/ - 工具函数

### `screen-adapter.js`
**作用**：屏幕适配工具
- 计算屏幕尺寸
- 处理安全区域
- 适配不同设备

### `voronoi.js`
**作用**：Voronoi 算法库
- 实现 Voronoi 图算法
- 提供几何计算
- 支持多边形生成

### 构建优化工具

#### `code-minifier.js`
**作用**：代码压缩工具
- 压缩 JavaScript 代码
- 移除注释和空格
- 减小文件体积

#### `dead-code-eliminator.js`
**作用**：死代码消除工具
- 检测未使用的代码
- 自动移除死代码
- 优化代码体积

#### `package-analyzer.js`
**作用**：包分析工具
- 分析依赖关系
- 检测重复代码
- 生成依赖图

#### `performance-benchmark.js`
**作用**：性能基准测试
- 测试代码性能
- 生成性能报告
- 对比优化效果

#### `resource-optimizer.js`
**作用**：资源优化工具
- 优化图片资源
- 压缩音频文件
- 减小资源体积

---

## 📊 文件统计

### 按类别统计

| 类别 | 文件数 | 说明 |
|------|--------|------|
| 核心服务 | 16 | 游戏管理、错误处理、分享等 |
| 共享组件 | 14 | 布局生成、触摸处理、动画等 |
| 状态管理 | 6 | 关卡、过渡、解锁、内存管理 |
| UI 组件 | 15 | 渲染、UI管理、字体、主题等 |
| 工具函数 | 7 | 屏幕适配、构建优化等 |
| 已禁用 | 9 | 广告、分析、教程（暂不使用） |
| **总计** | **67** | **不含测试和配置文件** |

### 核心文件（必须）⭐

1. `game.js` - 游戏入口
2. `services-game-manager.js` - 游戏管理器
3. `services-game-bootstrap-legacy.js` - 游戏启动
4. `shared-voronoi-generator.js` - 布局生成
5. `shared-touch-handler.js` - 触摸处理
6. `state-level-manager.js` - 关卡管理
7. `ui-render-engine.js` - 渲染引擎
8. `ui-ui-manager.js` - UI 管理器

### 可选文件（增强功能）

- 动画系统（提升视觉效果）
- 错误处理（提高稳定性）
- 字体系统（优化文字显示）
- 主题系统（支持多主题）
- 优化版本（提升性能）

### Legacy 文件说明

带 `-legacy` 后缀的文件是旧版本或备用版本：
- 保留用于兼容性
- 可能包含不同的实现方式
- 某些情况下作为降级方案

---

## 🔄 文件依赖关系

### 核心依赖链

```
game.js
  └── services-game-bootstrap-legacy.js
      └── services-game-manager.js
          ├── state-level-manager.js
          ├── shared-voronoi-generator.js
          ├── shared-touch-handler.js
          ├── ui-render-engine.js
          └── ui-ui-manager.js
```

### 可选依赖

```
services-game-manager.js
  ├── services-animation-integration.js (可选)
  ├── services-error-handling-integration.js (可选)
  └── ui-font-loading-integration.js (可选)
```

---

## 💡 使用建议

### 开发阶段
- 保留所有文件（包括 legacy 版本）
- 使用完整的错误处理
- 启用所有调试功能

### 生产部署
- 只打包核心文件
- 移除 legacy 版本
- 压缩和混淆代码
- 移除调试代码

### 功能扩展
- 需要广告功能：从 `_disabled/ads/` 恢复文件
- 需要数据分析：从 `_disabled/analytics/` 恢复文件
- 需要教程系统：从 `_disabled/tutorial/` 恢复文件

---

生成时间：2025-01-16
版本：v1.0
