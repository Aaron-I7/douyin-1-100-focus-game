# 需求文档

## 介绍

本项目旨在将现有的 HTML 版本 1-100 专注力训练游戏改造为抖音小游戏平台的原生游戏。游戏通过要求玩家按顺序点击 1 到 100 的数字来训练专注力和视觉搜索能力，采用渐进式难度设计（第一关 1-10，第二关 1-100，通关后解锁自选模式），集成抖音云用户系统和平台必接能力，提供独特的视觉设计和流畅的触摸交互体验。

## 术语表

- **Game_System**: 整个 1-100 专注力训练游戏系统
- **Canvas_Renderer**: 使用抖音小游戏 Canvas 2D API 进行图形渲染的模块
- **Voronoi_Generator**: 生成 Voronoi 图以随机分布数字格子的算法模块
- **Touch_Handler**: 处理触摸事件和手势识别的模块
- **Cell**: 游戏棋盘上的一个数字格子
- **Level**: 游戏关卡（第一关 1-10，第二关 1-100）
- **Custom_Mode**: 自选模式，通关第二关后解锁，包含练习模式和挑战模式
- **Progress_Tracker**: 跟踪游戏进度（当前数字、错误次数、用时等）
- **Feedback_System**: 视觉和触觉反馈系统（颜色变化、震动、浮动文字等）
- **Screen_Adapter**: 屏幕适配模块，处理不同设备尺寸和分辨率
- **Douyin_Cloud**: 抖音云服务，提供用户登录、数据存储等能力
- **User_System**: 用户系统，管理用户登录状态、进度和成绩
- **Share_System**: 分享系统，实现抖音平台分享功能
- **Ad_System**: 广告系统，管理激励视频广告
- **Analytics_System**: 数据分析系统，上报用户行为和游戏数据

## 需求

### 需求 1: 游戏初始化与配置

**用户故事:** 作为玩家，我希望游戏能够在抖音小游戏平台上正确启动并适配我的设备屏幕，以便获得良好的游戏体验。

#### 验收标准

1. WHEN 游戏启动时，THE Game_System SHALL 使用 tt.getSystemInfoSync() 获取设备信息
2. WHEN 设备信息获取成功后，THE Game_System SHALL 创建全屏 Canvas 并设置宽度为 systemInfo.windowWidth，高度为 systemInfo.windowHeight
3. THE Canvas_Renderer SHALL 使用 Canvas 2D 上下文进行所有图形渲染
4. THE Screen_Adapter SHALL 根据设备屏幕宽高比计算适当的游戏区域尺寸
5. WHEN 游戏配置文件 game.json 存在时，THE Game_System SHALL 读取并应用配置参数（如 deviceOrientation: portrait）

### 需求 2: Voronoi 图生成与数字分布

**用户故事:** 作为玩家，我希望每次游戏的数字位置都是随机分布的，以保持游戏的新鲜感和挑战性。

#### 验收标准

1. WHEN 新游戏开始时，THE Voronoi_Generator SHALL 生成 100 个随机种子点
2. THE Voronoi_Generator SHALL 基于种子点计算 Voronoi 图，创建 100 个不重叠的 Cell
3. WHEN Voronoi 图生成完成后，THE Game_System SHALL 将数字 1 到 100 随机分配给各个 Cell
4. THE Voronoi_Generator SHALL 确保每个 Cell 的面积足够容纳数字显示（最小面积阈值为屏幕面积的 0.5%）
5. THE Voronoi_Generator SHALL 使用原生 JavaScript 实现，不依赖 D3.js 或其他外部库

### 需求 3: 明亮视野模式游戏逻辑

**用户故事:** 作为玩家，我希望在明亮视野模式下能够看到所有数字格子，以训练我的视觉搜索和专注力。

#### 验收标准

1. WHEN 玩家选择 Bright_Mode 时，THE Canvas_Renderer SHALL 渲染所有 100 个 Cell 及其数字
2. THE Canvas_Renderer SHALL 为每个 Cell 绘制边框和背景色
3. WHEN 玩家触摸某个 Cell 时，THE Touch_Handler SHALL 检测触摸点是否在该 Cell 的 Voronoi 区域内
4. IF 触摸的 Cell 数字等于当前目标数字，THEN THE Game_System SHALL 将该 Cell 标记为已完成并更新 Progress_Tracker
5. IF 触摸的 Cell 数字不等于当前目标数字，THEN THE Game_System SHALL 增加错误计数并触发错误反馈

### 需求 4: 黑暗视野模式游戏逻辑

**用户故事:** 作为玩家，我希望在黑暗视野模式下通过手电筒效果探索棋盘，以增加游戏难度和趣味性。

#### 验收标准

1. WHEN 玩家选择 Dark_Mode 时，THE Canvas_Renderer SHALL 渲染黑色背景覆盖整个棋盘
2. WHEN 玩家触摸或移动手指时，THE Canvas_Renderer SHALL 在触摸点周围绘制径向渐变光照效果（半径为屏幕宽度的 15%）
3. THE Canvas_Renderer SHALL 仅在光照区域内显示 Cell 的数字和边框
4. WHEN 玩家连续正确点击时，THE Combo_System SHALL 记录连击次数
5. WHEN 连击次数达到 5、10、15 等里程碑时，THE Feedback_System SHALL 显示连击提示文字

### 需求 5: 触摸交互与反馈

**用户故事:** 作为玩家，我希望每次点击都能获得即时的视觉和触觉反馈，以确认我的操作是否正确。

#### 验收标准

1. WHEN 玩家触摸屏幕时，THE Touch_Handler SHALL 使用 tt.onTouchStart() 捕获触摸事件
2. WHEN 玩家点击正确的 Cell 时，THE Feedback_System SHALL 将该 Cell 背景色变为绿色并在 300 毫秒内淡出
3. WHEN 玩家点击错误的 Cell 时，THE Feedback_System SHALL 将该 Cell 背景色变为红色并触发震动效果（持续 100 毫秒）
4. WHEN 玩家点击错误的 Cell 时，THE Feedback_System SHALL 在该 Cell 位置显示浮动文字"错误"并向上移动淡出
5. WHEN 玩家点击正确的 Cell 时，THE Feedback_System SHALL 在该 Cell 位置显示浮动文字"+1"并向上移动淡出
6. THE Touch_Handler SHALL 使用 tt.vibrateShort() 提供触觉反馈

### 需求 6: 游戏进度与计时

**用户故事:** 作为玩家，我希望实时看到我的游戏进度、用时和错误次数，以了解我的表现。

#### 验收标准

1. WHEN 游戏开始时，THE Progress_Tracker SHALL 初始化计时器并开始计时
2. THE Canvas_Renderer SHALL 在屏幕顶部显示当前目标数字（例如"下一个: 42"）
3. THE Canvas_Renderer SHALL 在屏幕顶部显示已用时间（格式为"MM:SS.mmm"）
4. THE Canvas_Renderer SHALL 在屏幕顶部显示错误次数（例如"错误: 3"）
5. THE Canvas_Renderer SHALL 在屏幕底部显示进度条，填充百分比为（当前数字 - 1）/ 100
6. WHEN 玩家完成所有 100 个数字时，THE Game_System SHALL 停止计时并显示游戏结束界面

### 需求 7: 难度等级与时间限制

**用户故事:** 作为玩家，我希望选择不同的难度等级来挑战自己，包括有时间限制的模式。

#### 验收标准

1. THE Game_System SHALL 提供四种 Difficulty_Level：自由模式、1分钟、2分钟、3分钟
2. WHEN 玩家选择自由模式时，THE Game_System SHALL 不设置时间限制
3. WHEN 玩家选择有时间限制的模式时，THE Progress_Tracker SHALL 显示倒计时（格式为"剩余: MM:SS"）
4. WHEN 倒计时归零且玩家未完成游戏时，THE Game_System SHALL 结束游戏并显示失败界面
5. THE Canvas_Renderer SHALL 在倒计时少于 10 秒时将倒计时文字颜色变为红色

### 需求 8: 游戏结束与结果展示

**用户故事:** 作为玩家，我希望在游戏结束时看到详细的统计数据和重玩选项，以评估我的表现并继续挑战。

#### 验收标准

1. WHEN 游戏结束时，THE Game_System SHALL 显示游戏结果界面覆盖游戏区域
2. THE Canvas_Renderer SHALL 在结果界面显示完成时间（或"超时"）
3. THE Canvas_Renderer SHALL 在结果界面显示总错误次数
4. WHERE Dark_Mode 被选择，THE Canvas_Renderer SHALL 在结果界面显示最高连击次数
5. THE Canvas_Renderer SHALL 在结果界面显示"重新开始"按钮和"返回菜单"按钮
6. WHEN 玩家点击"重新开始"按钮时，THE Game_System SHALL 使用相同的 Game_Mode 和 Difficulty_Level 开始新游戏
7. WHEN 玩家点击"返回菜单"按钮时，THE Game_System SHALL 返回模式选择界面

### 需求 9: 用户界面与菜单系统

**用户故事:** 作为玩家，我希望有清晰的菜单界面来选择游戏模式和难度，以便快速开始游戏。

#### 验收标准

1. WHEN 游戏首次启动时，THE Game_System SHALL 显示主菜单界面
2. THE Canvas_Renderer SHALL 在主菜单显示游戏标题"1-100 专注力训练"
3. THE Canvas_Renderer SHALL 在主菜单显示两个模式选择按钮："明亮视野"和"黑暗视野"
4. WHEN 玩家选择游戏模式后，THE Game_System SHALL 显示难度选择界面
5. THE Canvas_Renderer SHALL 在难度选择界面显示四个难度按钮："自由模式"、"1分钟"、"2分钟"、"3分钟"
6. WHEN 玩家选择难度后，THE Game_System SHALL 开始游戏并隐藏菜单界面
7. THE Canvas_Renderer SHALL 为所有按钮提供触摸高亮效果（按下时背景色变深）

### 需求 10: 性能优化与流畅度

**用户故事:** 作为玩家，我希望游戏运行流畅，触摸响应及时，不出现卡顿或延迟。

#### 验收标准

1. THE Canvas_Renderer SHALL 使用 requestAnimationFrame 实现游戏主循环，目标帧率为 60 FPS
2. THE Canvas_Renderer SHALL 仅在游戏状态变化时重绘 Canvas，避免不必要的渲染
3. WHEN Dark_Mode 激活时，THE Canvas_Renderer SHALL 使用离屏 Canvas 预渲染光照效果以提高性能
4. THE Voronoi_Generator SHALL 在游戏开始前完成所有计算，避免运行时性能开销
5. THE Touch_Handler SHALL 在 50 毫秒内响应触摸事件
6. THE Game_System SHALL 确保游戏包体积小于 2MB，以快速加载

### 需求 11: 屏幕适配与响应式设计

**用户故事:** 作为玩家，我希望游戏能够在不同尺寸和分辨率的设备上正确显示，保持良好的视觉效果。

#### 验收标准

1. THE Screen_Adapter SHALL 支持屏幕宽度从 320px 到 1080px 的设备
2. THE Screen_Adapter SHALL 根据屏幕宽度动态计算字体大小（基准为屏幕宽度的 4%）
3. THE Screen_Adapter SHALL 根据屏幕宽度动态计算按钮尺寸（最小触摸区域为 44x44 逻辑像素）
4. THE Canvas_Renderer SHALL 使用设备像素比（devicePixelRatio）确保高清屏幕上的清晰渲染
5. WHEN 设备方向为横屏时，THE Game_System SHALL 显示提示信息要求玩家旋转设备至竖屏

### 需求 12: 错误处理与容错

**用户故事:** 作为玩家，我希望游戏能够妥善处理异常情况，不会因为错误而崩溃或无响应。

#### 验收标准

1. WHEN Canvas 创建失败时，THE Game_System SHALL 显示错误提示"无法初始化游戏，请重启应用"
2. WHEN Voronoi_Generator 生成失败时，THE Game_System SHALL 重试最多 3 次，每次使用不同的随机种子
3. IF Voronoi_Generator 重试 3 次后仍失败，THEN THE Game_System SHALL 使用网格布局作为降级方案
4. WHEN 触摸事件处理出错时，THE Touch_Handler SHALL 记录错误日志但不中断游戏
5. THE Game_System SHALL 捕获所有未处理的异常并显示友好的错误界面

### 需求 13: 数据持久化（可选功能）

**用户故事:** 作为玩家，我希望我的最佳成绩能够被保存，以便与朋友分享或挑战自己的记录。

#### 验收标准

1. WHERE 数据持久化功能启用，THE Game_System SHALL 使用 tt.setStorageSync() 保存玩家的最佳成绩
2. WHERE 数据持久化功能启用，THE Game_System SHALL 为每种 Game_Mode 和 Difficulty_Level 组合分别保存最佳成绩
3. WHERE 数据持久化功能启用，WHEN 游戏结束且成绩优于历史最佳时，THE Game_System SHALL 更新最佳成绩记录
4. WHERE 数据持久化功能启用，THE Canvas_Renderer SHALL 在结果界面显示"新纪录！"提示
5. WHERE 数据持久化功能启用，THE Canvas_Renderer SHALL 在主菜单显示历史最佳成绩

### 需求 14: 音效与音乐（可选功能）

**用户故事:** 作为玩家，我希望游戏有适当的音效反馈，增强游戏的沉浸感和趣味性。

#### 验收标准

1. WHERE 音效功能启用，WHEN 玩家点击正确的 Cell 时，THE Game_System SHALL 播放成功音效（使用 tt.createInnerAudioContext()）
2. WHERE 音效功能启用，WHEN 玩家点击错误的 Cell 时，THE Game_System SHALL 播放错误音效
3. WHERE 音效功能启用，WHEN 玩家达到连击里程碑时，THE Game_System SHALL 播放特殊音效
4. WHERE 音效功能启用，WHEN 游戏完成时，THE Game_System SHALL 播放胜利音效
5. WHERE 音效功能启用，THE Game_System SHALL 在设置菜单提供音效开关选项
6. THE Game_System SHALL 确保所有音频文件格式为 MP3 或 AAC，总大小不超过 500KB

## 需求

### 需求 1: 游戏初始化与配置

**用户故事:** 作为玩家，我希望游戏能够在抖音小游戏平台上正确启动并适配我的设备屏幕，以便获得良好的游戏体验。

#### 验收标准

1. WHEN 游戏启动时，THE Game_System SHALL 使用 tt.getSystemInfoSync() 获取设备信息
2. WHEN 设备信息获取成功后，THE Game_System SHALL 创建全屏 Canvas 并设置宽度为 systemInfo.windowWidth，高度为 systemInfo.windowHeight
3. THE Canvas_Renderer SHALL 使用 Canvas 2D 上下文进行所有图形渲染
4. THE Screen_Adapter SHALL 根据设备屏幕宽高比计算适当的游戏区域尺寸
5. WHEN 游戏配置文件 game.json 存在时，THE Game_System SHALL 读取并应用配置参数（如 deviceOrientation: portrait）

### 需求 2: 抖音云用户登录系统

**用户故事:** 作为玩家，我希望使用抖音账号登录游戏，以便保存我的游戏进度和成绩。

#### 验收标准

1. WHEN 游戏首次启动时，THE User_System SHALL 调用 tt.login() 获取用户临时登录凭证
2. WHEN 获取登录凭证成功后，THE User_System SHALL 调用抖音云函数将凭证换取 openId
3. THE User_System SHALL 将 openId 存储在本地，作为用户唯一标识
4. WHEN 用户未授权时，THE User_System SHALL 显示授权引导界面
5. WHEN 用户授权成功后，THE User_System SHALL 从抖音云数据库加载用户进度数据（已解锁关卡、最佳成绩等）
6. IF 用户数据不存在，THEN THE User_System SHALL 创建新用户记录并初始化默认数据

### 需求 3: 渐进式关卡系统

**用户故事:** 作为玩家，我希望通过渐进式的关卡设计逐步熟悉游戏玩法，从简单的 1-10 开始，逐步挑战 1-100。

#### 验收标准

1. WHEN 新玩家首次开始游戏时，THE Game_System SHALL 直接进入第一关（1-10 数字）
2. THE Game_System SHALL 在第一关生成 10 个 Cell，数字范围为 1-10
3. WHEN 玩家完成第一关（点击完所有 1-10 数字）时，THE Game_System SHALL 显示过渡界面并自动进入第二关
4. THE Game_System SHALL 在第二关生成 100 个 Cell，数字范围为 1-100
5. WHEN 玩家完成第二关时，THE Game_System SHALL 解锁自选模式并保存解锁状态到抖音云
6. THE Game_System SHALL 在关卡过渡时显示鼓励文字（如"太棒了！准备挑战完整版吧！"）

### 需求 4: 自选模式系统

**用户故事:** 作为通关玩家，我希望在自选模式中自由选择练习 1-10 或挑战 1-100，并可选择时间限制。

#### 验收标准

1. WHEN 玩家完成第二关后，THE Game_System SHALL 在主菜单显示"自选模式"入口
2. WHEN 玩家进入自选模式时，THE Game_System SHALL 显示模式选择界面，包含"1-10 练习"和"1-100 挑战"选项
3. WHEN 玩家选择模式后，THE Game_System SHALL 显示时间选项界面，包含"自由模式"、"1分钟"、"2分钟"、"3分钟"选项
4. WHEN 玩家选择"1-10 练习"时，THE Game_System SHALL 生成 10 个 Cell
5. WHEN 玩家选择"1-100 挑战"时，THE Game_System SHALL 生成 100 个 Cell
6. IF 玩家未完成第二关，THEN THE Game_System SHALL 隐藏自选模式入口或显示锁定状态

### 需求 5: Voronoi 图生成与数字分布

**用户故事:** 作为玩家，我希望每次游戏的数字位置都是随机分布的，以保持游戏的新鲜感和挑战性。

#### 验收标准

1. WHEN 新游戏开始时，THE Voronoi_Generator SHALL 根据当前关卡生成对应数量的随机种子点（10 或 100）
2. THE Voronoi_Generator SHALL 基于种子点计算 Voronoi 图，创建不重叠的 Cell
3. WHEN Voronoi 图生成完成后，THE Game_System SHALL 将数字随机分配给各个 Cell
4. THE Voronoi_Generator SHALL 确保每个 Cell 的面积足够容纳数字显示（最小面积阈值为屏幕面积的 0.5%）
5. THE Voronoi_Generator SHALL 使用原生 JavaScript 实现，不依赖 D3.js 或其他外部库

### 需求 6: 游戏核心逻辑

**用户故事:** 作为玩家，我希望游戏能够准确识别我的点击，并提供即时反馈，让我专注于寻找下一个数字。

#### 验收标准

1. THE Canvas_Renderer SHALL 渲染所有 Cell 及其数字，使用明亮的背景色
2. WHEN 玩家触摸某个 Cell 时，THE Touch_Handler SHALL 检测触摸点是否在该 Cell 的 Voronoi 区域内
3. IF 触摸的 Cell 数字等于当前目标数字，THEN THE Game_System SHALL 将该 Cell 标记为已完成并更新 Progress_Tracker
4. IF 触摸的 Cell 数字不等于当前目标数字，THEN THE Game_System SHALL 增加错误计数并触发错误反馈
5. WHEN Cell 被标记为已完成时，THE Canvas_Renderer SHALL 将该 Cell 背景色变为半透明灰色，数字消失

### 需求 7: 触摸交互与反馈

**用户故事:** 作为玩家，我希望每次点击都能获得即时的视觉和触觉反馈，以确认我的操作是否正确。

#### 验收标准

1. WHEN 玩家触摸屏幕时，THE Touch_Handler SHALL 使用 tt.onTouchStart() 捕获触摸事件
2. WHEN 玩家点击正确的 Cell 时，THE Feedback_System SHALL 将该 Cell 背景色变为绿色并在 300 毫秒内淡出
3. WHEN 玩家点击错误的 Cell 时，THE Feedback_System SHALL 将该 Cell 背景色变为红色并触发震动效果（使用 tt.vibrateShort()）
4. WHEN 玩家点击错误的 Cell 时，THE Feedback_System SHALL 在该 Cell 位置显示浮动文字"✗"并向上移动淡出
5. WHEN 玩家点击正确的 Cell 时，THE Feedback_System SHALL 在该 Cell 位置显示浮动文字"+1"并向上移动淡出

### 需求 8: 游戏进度与计时

**用户故事:** 作为玩家，我希望实时看到我的游戏进度、用时和错误次数，以了解我的表现。

#### 验收标准

1. WHEN 游戏开始时，THE Progress_Tracker SHALL 初始化计时器并开始计时
2. THE Canvas_Renderer SHALL 在屏幕顶部显示当前目标数字（例如"目标: 42"）
3. THE Canvas_Renderer SHALL 在屏幕顶部显示已用时间或剩余时间（格式为"MM:SS"）
4. THE Canvas_Renderer SHALL 在屏幕顶部显示错误次数（例如"错误: 3"）
5. THE Canvas_Renderer SHALL 在屏幕底部显示进度条，填充百分比为（当前数字 - 1）/ 总数字数量
6. WHEN 玩家完成所有数字时，THE Game_System SHALL 停止计时并显示游戏结束界面

### 需求 9: 时间限制模式

**用户故事:** 作为玩家，我希望在自选模式中选择时间限制来增加挑战难度。

#### 验收标准

1. WHEN 玩家在自选模式选择"自由模式"时，THE Game_System SHALL 不设置时间限制，仅记录用时
2. WHEN 玩家选择有时间限制的模式（1/2/3分钟）时，THE Progress_Tracker SHALL 显示倒计时
3. WHEN 倒计时归零且玩家未完成游戏时，THE Game_System SHALL 结束游戏并显示失败界面
4. THE Canvas_Renderer SHALL 在倒计时少于 10 秒时将倒计时文字颜色变为红色
5. WHEN 玩家在时间限制内完成游戏时，THE Game_System SHALL 显示成功界面并记录成绩

### 需求 10: 游戏结束与结果展示

**用户故事:** 作为玩家，我希望在游戏结束时看到详细的统计数据和重玩选项，以评估我的表现并继续挑战。

#### 验收标准

1. WHEN 游戏结束时，THE Game_System SHALL 显示游戏结果界面覆盖游戏区域
2. THE Canvas_Renderer SHALL 在结果界面显示完成时间（或"超时"）
3. THE Canvas_Renderer SHALL 在结果界面显示总错误次数
4. THE Canvas_Renderer SHALL 在结果界面显示"再来一局"按钮和"返回首页"按钮
5. WHEN 玩家点击"再来一局"按钮时，THE Game_System SHALL 使用相同的关卡和时间设置开始新游戏
6. WHEN 玩家点击"返回首页"按钮时，THE Game_System SHALL 返回主菜单界面
7. WHEN 玩家创造新纪录时，THE Canvas_Renderer SHALL 显示"新纪录！"提示

### 需求 11: 抖音云数据存储

**用户故事:** 作为玩家，我希望我的游戏进度和最佳成绩能够保存在云端，即使更换设备也能继续游戏。

#### 验收标准

1. WHEN 玩家完成关卡时，THE User_System SHALL 调用抖音云函数保存用户进度（已解锁关卡、完成状态）
2. WHEN 玩家完成游戏时，THE User_System SHALL 将成绩数据（完成时间、错误次数）保存到抖音云数据库
3. THE User_System SHALL 为每种模式（1-10 练习、1-100 挑战）和时间限制组合分别保存最佳成绩
4. WHEN 玩家登录时，THE User_System SHALL 从抖音云加载用户数据并恢复进度
5. IF 云端保存失败，THEN THE User_System SHALL 将数据缓存到本地存储，待网络恢复后重试

### 需求 12: 抖音平台分享功能

**用户故事:** 作为玩家，我希望能够将我的游戏成绩分享给好友，邀请他们一起挑战。

#### 验收标准

1. THE Share_System SHALL 在游戏结果界面显示"分享"按钮
2. WHEN 玩家点击"分享"按钮时，THE Share_System SHALL 调用 tt.shareAppMessage() 打开分享面板
3. THE Share_System SHALL 生成分享内容，包含玩家成绩（完成时间、错误次数）
4. THE Share_System SHALL 设置分享标题为"我在 1-100 专注力挑战中用时 XX:XX，你能超越我吗？"
5. WHEN 分享成功时，THE Analytics_System SHALL 上报分享事件到抖音数据分析平台

### 需求 13: 激励视频广告（可选）

**用户故事:** 作为玩家，我希望在游戏失败时可以观看广告来获得复活机会或额外提示。

#### 验收标准

1. WHERE 激励视频功能启用，WHEN 玩家在限时模式中失败时，THE Ad_System SHALL 显示"观看广告复活"选项
2. WHERE 激励视频功能启用，WHEN 玩家点击"观看广告复活"时，THE Ad_System SHALL 调用 tt.createRewardedVideoAd() 播放激励视频
3. WHERE 激励视频功能启用，WHEN 玩家完整观看广告后，THE Game_System SHALL 增加 30 秒游戏时间
4. WHERE 激励视频功能启用，THE Ad_System SHALL 在游戏中提供"观看广告获得提示"选项，观看后高亮显示目标数字位置 3 秒
5. WHERE 激励视频功能启用，THE Ad_System SHALL 限制每局游戏最多使用 1 次复活和 2 次提示

### 需求 14: 数据上报与分析

**用户故事:** 作为开发者，我希望收集用户游戏数据以优化游戏体验和平衡难度。

#### 验收标准

1. WHEN 玩家开始游戏时，THE Analytics_System SHALL 上报游戏开始事件，包含关卡类型和时间限制
2. WHEN 玩家完成游戏时，THE Analytics_System SHALL 上报游戏完成事件，包含完成时间、错误次数、关卡类型
3. WHEN 玩家失败时，THE Analytics_System SHALL 上报游戏失败事件，包含失败原因（超时/主动退出）和进度
4. WHEN 玩家点击错误时，THE Analytics_System SHALL 累计错误点击数据，定期批量上报
5. THE Analytics_System SHALL 使用抖音小游戏数据分析 API 进行数据上报

### 需求 15: UI/UX 独特视觉设计

**用户故事:** 作为玩家，我希望游戏有独特且吸引人的视觉设计，而不是千篇一律的 AI 生成风格。

#### 验收标准

1. THE Canvas_Renderer SHALL 使用 frontend-design skill 定义的独特配色方案和视觉风格
2. THE Canvas_Renderer SHALL 使用特色字体渲染游戏标题和重要文字（需确保字体文件大小 < 200KB）
3. THE Canvas_Renderer SHALL 为按钮和 Cell 添加创意动画效果（如弹跳、缩放、旋转）
4. THE Canvas_Renderer SHALL 使用大胆的配色方案，避免常见的蓝白灰组合
5. THE Canvas_Renderer SHALL 在关卡过渡时显示创意过渡动画（如粒子效果、波纹扩散）
6. THE Canvas_Renderer SHALL 为游戏背景添加装饰性元素（如几何图案、渐变、动态背景）

### 需求 16: 用户界面与菜单系统

**用户故事:** 作为玩家，我希望有清晰的菜单界面来导航游戏功能，快速开始游戏或查看进度。

#### 验收标准

1. WHEN 游戏启动完成后，THE Game_System SHALL 显示主菜单界面
2. THE Canvas_Renderer SHALL 在主菜单显示游戏标题"1-100 专注力挑战"
3. THE Canvas_Renderer SHALL 在主菜单显示"开始游戏"按钮（新玩家）或"继续游戏"按钮（已有进度玩家）
4. THE Canvas_Renderer SHALL 在主菜单显示"自选模式"按钮（仅通关第二关后显示）
5. THE Canvas_Renderer SHALL 在主菜单显示"我的成绩"按钮，点击后显示历史最佳成绩
6. THE Canvas_Renderer SHALL 为所有按钮提供触摸高亮效果和点击动画
7. WHEN 设备方向为横屏时，THE Canvas_Renderer SHALL 在主菜单和游戏界面显示友好提示"横屏体验更清晰"
8. THE Canvas_Renderer SHALL 将横屏提示显示在界面顶部或底部，不遮挡主要游戏内容

### 需求 17: 性能优化与流畅度

**用户故事:** 作为玩家，我希望游戏运行流畅，触摸响应及时，不出现卡顿或延迟。

#### 验收标准

1. THE Canvas_Renderer SHALL 使用 requestAnimationFrame 实现游戏主循环，目标帧率为 60 FPS
2. THE Canvas_Renderer SHALL 仅在游戏状态变化时重绘 Canvas，避免不必要的渲染
3. THE Voronoi_Generator SHALL 在游戏开始前完成所有计算，避免运行时性能开销
4. THE Touch_Handler SHALL 在 50 毫秒内响应触摸事件
5. THE Game_System SHALL 确保游戏包体积小于 4MB（包含字体和视觉资源）

### 需求 18: 屏幕适配与响应式设计

**用户故事:** 作为玩家，我希望游戏能够在不同尺寸和分辨率的设备上正确显示，保持良好的视觉效果。

#### 验收标准

1. THE Screen_Adapter SHALL 支持屏幕宽度从 320px 到 1080px 的设备
2. THE Screen_Adapter SHALL 根据屏幕宽度动态计算字体大小（基准为屏幕宽度的 4%）
3. THE Screen_Adapter SHALL 根据屏幕宽度动态计算按钮尺寸（最小触摸区域为 44x44 逻辑像素）
4. THE Canvas_Renderer SHALL 使用设备像素比（devicePixelRatio）确保高清屏幕上的清晰渲染
5. THE Game_System SHALL 支持横屏和竖屏两种设备方向

### 需求 19: 错误处理与容错

**用户故事:** 作为玩家，我希望游戏能够妥善处理异常情况，不会因为错误而崩溃或无响应。

#### 验收标准

1. WHEN Canvas 创建失败时，THE Game_System SHALL 显示错误提示"无法初始化游戏，请重启应用"
2. WHEN Voronoi_Generator 生成失败时，THE Game_System SHALL 重试最多 3 次，每次使用不同的随机种子
3. IF Voronoi_Generator 重试 3 次后仍失败，THEN THE Game_System SHALL 使用网格布局作为降级方案
4. WHEN 触摸事件处理出错时，THE Touch_Handler SHALL 记录错误日志但不中断游戏
5. WHEN 抖音云 API 调用失败时，THE User_System SHALL 使用本地存储作为降级方案
6. THE Game_System SHALL 捕获所有未处理的异常并显示友好的错误界面

### 需求 20: 辅助功能与新手引导

**用户故事:** 作为新玩家，我希望游戏能够提供清晰的规则说明和操作提示，帮助我快速上手。

#### 验收标准

1. WHEN 玩家首次启动游戏时，THE Game_System SHALL 在第一关开始前显示简短的游戏规则说明（"按顺序点击 1-10"）
2. WHEN 玩家在第一关停留超过 10 秒未点击时，THE Game_System SHALL 在当前目标数字的 Cell 周围显示闪烁提示环
3. WHEN 玩家完成第一关时，THE Game_System SHALL 显示鼓励文字和第二关说明
4. THE Canvas_Renderer SHALL 在主菜单提供"帮助"按钮，点击后显示完整规则说明
5. WHEN 玩家首次进入自选模式时，THE Game_System SHALL 显示模式说明界面
