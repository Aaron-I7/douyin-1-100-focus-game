# Tasks
- [x] Task 1: 完成市场热门轻休闲游戏风格调研并输出实施规范
  - [x] SubTask 1.1: 调研“抓大鹅”等产品的色彩、排版、动效、信息层级
  - [x] SubTask 1.2: 提炼可实现的设计规则与禁用项（护眼约束）
  - [x] SubTask 1.3: 形成映射到现有代码模块的改造清单

- [x] Task 2: 重构游戏基础视觉与排版体系
  - [x] SubTask 2.1: 重构主题色板、背景层次与组件样式令界面不单调
  - [x] SubTask 2.2: 调整 HUD 信息布局与字体层级，避免视觉拥挤
  - [x] SubTask 2.3: 统一开始页、对局页、结果页核心视觉语言

- [x] Task 3: 修复遮挡并稳定可玩区布局
  - [x] SubTask 3.1: 校准安全区、HUD 区、可玩区、底部进度区边界
  - [x] SubTask 3.2: 保证不同分辨率下格子区域不被顶部/底部覆盖
  - [x] SubTask 3.3: 补充可视验证（关键机型比例）与回归检查

- [x] Task 4: 强化第一关到第二关过场动画体验
  - [x] SubTask 4.1: 优化过场视觉节奏与文案可感知性
  - [x] SubTask 4.2: 保证动画回调后自动稳定进入第二关
  - [x] SubTask 4.3: 校验普通模式与自选模式分支不互相污染

- [x] Task 5: 全链路验证与收尾
  - [x] SubTask 5.1: 执行语法检查与自动化测试
  - [x] SubTask 5.2: 按 checklist 逐项验证视觉、布局、过场与反馈策略
  - [x] SubTask 5.3: 修复验证发现的问题并更新任务勾选状态

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 可与 Task 3 并行，但需复用 Task 2 的视觉规范
- Task 5 依赖 Task 3 与 Task 4
