# 1-100 专注力训练游戏 🎮

一款基于抖音小游戏平台的专注力训练游戏，挑战玩家按顺序点击1-100的数字。

## ✨ 游戏特色

- 🎨 **精美UI设计** - 参考"羊了个羊"的交互模式，渐变背景+卡片式布局
- 🎮 **双模式挑战** - 明亮视野 / 黑暗视野（手电筒效果）
- ⏱️ **四种难度** - 自由模式 / 1分钟 / 2分钟 / 3分钟
- 🎯 **Voronoi算法** - 每次游戏布局都不同
- 📊 **详细统计** - 完成数量、用时、错误次数、最高连击
- 📱 **响应式设计** - 自适应各种屏幕尺寸

## 🎮 游戏模式

### ☀️ 明亮视野模式
所有数字清晰可见，适合追求速度的玩家。

### 🌙 黑暗视野模式
手电筒照亮效果，只能看到光圈范围内的数字，挑战更高难度。包含连击系统和目标提示环。

## 📁 项目结构

```
1-2-100/
├── game.js              # 游戏主文件（所有代码合并）
├── game.json            # 小游戏配置
├── icon.png             # 游戏图标
├── project.config.json  # 项目配置
├── UI-DESIGN.md         # UI设计说明
├── GAME-GUIDE.md        # 游戏指南
├── CHANGELOG.md         # 更新日志
└── src/                 # 源代码模块（已合并到game.js）
    ├── core/
    │   ├── data-structures.js
    │   ├── voronoi-generator.js
    │   ├── grid-layout-generator.js
    │   ├── render-engine.js
    │   ├── touch-handler.js
    │   └── game-manager.js
    └── utils/
        └── screen-adapter.js
```

## 🚀 快速开始

### 1. 安装开发工具
下载并安装[抖音开发者工具](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/developer-tool/download)

### 2. 导入项目
1. 打开抖音开发者工具
2. 选择"导入项目"
3. 选择本项目的 `1-2-100` 目录
4. 点击"导入"

### 3. 运行游戏
1. 点击"编译"按钮
2. 在模拟器中预览游戏
3. 或使用真机调试

## 🎯 核心技术

### Voronoi图算法
使用简化的Voronoi图算法生成不规则多边形区域，确保每次游戏布局都不同。

### 降级方案
如果Voronoi生成失败，自动切换到网格布局，保证游戏稳定运行。

### 性能优化
- 高清Canvas渲染（支持devicePixelRatio）
- 离屏Canvas优化黑暗模式渲染
- 60 FPS流畅动画
- 触摸响应时间 < 50ms

### UI系统
- UIManager统一管理所有界面
- 渐变背景和阴影效果
- 圆角按钮和卡片式布局
- 响应式设计，适配各种屏幕

## 📖 文档

- [UI设计说明](./UI-DESIGN.md) - 详细的UI设计理念和规范
- [游戏指南](./GAME-GUIDE.md) - 完整的游戏玩法和技巧
- [更新日志](./CHANGELOG.md) - 版本更新记录

## 🎨 设计理念

参考"羊了个羊"等热门小游戏的交互模式：
- 温暖的渐变背景
- 大按钮设计，易于点击
- 卡片式布局，清晰的层次感
- 色彩区分不同功能
- 流畅的界面切换

## 🔧 技术栈

- **平台**: 抖音小游戏
- **语言**: 原生 JavaScript (ES6+)
- **渲染**: Canvas 2D API
- **架构**: 模块化设计（已合并为单文件）

## 📱 设备要求

- **平台**: 抖音小游戏
- **方向**: 竖屏
- **分辨率**: 自适应（推荐 375×667 及以上）

## 🐛 已知问题

- 抖音小游戏不支持标准模块加载，所有代码已合并到单文件

## 📝 开发说明

### 代码结构
所有模块代码已合并到 `game.js` 文件中，包括：
1. 数据结构 (Point, Edge, Cell)
2. 屏幕适配器 (ScreenAdapter)
3. Voronoi生成器 (VoronoiGenerator)
4. 网格布局生成器 (GridLayoutGenerator)
5. 渲染引擎 (RenderEngine)
6. 触摸处理器 (TouchHandler)
7. UI管理器 (UIManager)
8. 游戏管理器 (GameManager)
9. 主程序初始化

### 修改建议
- UI样式修改：在 UIManager 类中调整颜色和布局
- 游戏逻辑修改：在 GameManager 类中调整
- 渲染效果修改：在 RenderEngine 类中调整

## 🔗 相关链接

- [抖音小游戏开发文档](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/introduction/overview)
- [开发者社区](https://forum.microapp.bytedance.com/)

## 📄 License

Apache-2.0 License

## 🙏 致谢

- 参考了"羊了个羊"的UI设计理念
- 使用Voronoi图算法实现随机布局
- 感谢抖音小游戏平台提供的开发支持

---

**祝你游戏愉快！挑战你的专注力极限！** 🎮✨
