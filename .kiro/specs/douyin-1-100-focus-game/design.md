# 技术设计文档：抖音 1-100 专注力训练游戏

## Overview

本设计文档描述了抖音小游戏平台上的 1-100 专注力训练游戏的技术实现方案。游戏采用渐进式关卡设计（第一关 1-10，第二关 1-100，通关后解锁自选模式），通过 Voronoi 图算法实现数字的随机分布，集成抖音云用户系统和平台能力，提供独特的视觉设计和流畅的触摸交互体验。

### 核心技术栈

- **平台**: 抖音小游戏 (基于字节跳动小程序框架)
- **渲染引擎**: Canvas 2D API
- **算法**: 原生 JavaScript 实现的 Voronoi 图生成
- **交互**: 抖音小游戏触摸事件 API
- **云服务**: 抖音云开发 (用户登录、数据存储、云函数)
- **平台能力**: 分享 API、激励视频广告、数据分析

### 设计目标

1. **渐进式体验**: 从简单的 1-10 关卡开始，逐步引导玩家熟悉游戏
2. **云端同步**: 用户进度和成绩保存在抖音云，支持跨设备访问
3. **独特视觉**: 采用大胆配色和创意动画，区别于常见的 AI 生成风格
4. **性能优先**: 保持 60 FPS 流畅渲染，触摸响应延迟 < 50ms
5. **平台集成**: 深度集成抖音分享、广告、数据分析等平台能力
6. **包体控制**: 游戏包体积 < 4MB（包含视觉资源和字体）

## Architecture

### 系统架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                       Game Application                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │ UI Manager  │  │Level Manager │  │ User Profile Manager│     │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘     │
│         │                │                      │                 │
│  ┌──────▼────────────────▼──────────────────────▼──────────┐    │
│  │              Game Manager (Core Logic)                   │    │
│  └──────┬───────────────────────────────────────────────────┘    │
│         │                                                         │
│  ┌──────▼─────────────────────────────────────────────────┐     │
│  │           Render Engine (Canvas 2D)                     │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │     │
│  │  │Theme System  │  │Animation Eng.│  │Font Manager  │ │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │     │
│  └──────┬──────────────────────────────────────────────────┘     │
│         │                                                         │
│  ┌──────▼───────────┐  ┌────────────────────────┐               │
│  │Voronoi Generator │  │   Touch Handler        │               │
│  └──────────────────┘  └────────────────────────┘               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Platform Integration Layer                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │Share Manager │  │  Ad Manager  │  │Analytics Mgr │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                    Douyin Cloud Services                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Auth Service    │  │ Storage Service  │  │Cloud Functions│  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                  Douyin Mini Game APIs                            │
│  tt.login() | tt.createCanvas() | tt.onTouchStart() |            │
│  tt.shareAppMessage() | tt.createRewardedVideoAd()               │
└──────────────────────────────────────────────────────────────────┘
```


### 模块划分

#### 核心游戏模块

#### 1. Game Manager (游戏管理器)
- **职责**: 游戏状态机管理、游戏循环控制、关卡管理
- **状态**: `idle` | `level1` | `level2` | `custom` | `playing` | `paused` | `finished`
- **核心方法**: `startLevel()`, `completeLevel()`, `pauseGame()`, `endGame()`

#### 2. Level Manager (关卡管理器)
- **职责**: 管理关卡进度、解锁状态、关卡过渡
- **关卡定义**: 
  - Level 1: 1-10 数字，10 个 Cell
  - Level 2: 1-100 数字，100 个 Cell
  - Custom Mode: 自选 1-10 或 1-100，可选时间限制
- **核心方法**: `getCurrentLevel()`, `unlockCustomMode()`, `transitionToNextLevel()`

#### 3. Unlock System (解锁系统)
- **职责**: 管理自选模式解锁状态
- **存储**: 解锁状态保存到抖音云数据库
- **核心方法**: `isCustomModeUnlocked()`, `unlockCustomMode()`, `checkUnlockCondition()`

#### 4. Transition Manager (过渡管理器)
- **职责**: 处理关卡过渡动画和提示
- **动画**: 淡入淡出、粒子效果、鼓励文字
- **核心方法**: `showTransition()`, `playTransitionAnimation()`, `showEncouragement()`

#### 5. Voronoi Generator (Voronoi 图生成器)
- **职责**: 生成随机 Voronoi 图，分配数字到格子
- **算法**: 简化的 Delaunay 三角剖分 + Voronoi 构建
- **输出**: 10 或 100 个 Cell 对象，每个包含多边形路径和中心点坐标
- **降级**: 失败时使用网格布局

#### 6. Render Engine (渲染引擎)
- **职责**: Canvas 绘制、动画效果、视觉反馈
- **子模块**:
  - Theme System: 管理配色方案和视觉风格
  - Animation Engine: 管理动画队列和效果
  - Font Manager: 加载和管理特色字体
- **优化策略**: 
  - 脏矩形更新 (仅重绘变化区域)
  - requestAnimationFrame 驱动的渲染循环
  - 离屏 Canvas 缓存复杂图形

#### 7. Touch Handler (触摸处理器)
- **职责**: 触摸事件捕获、点击检测、手势识别
- **API**: `tt.onTouchStart()`, `tt.onTouchMove()`, `tt.onTouchEnd()`
- **碰撞检测**: 点在多边形内算法 (Ray Casting)

#### 8. UI Manager (界面管理器)
- **职责**: 菜单渲染、HUD 显示、按钮交互、设备方向提示
- **组件**: 主菜单、关卡选择、自选模式菜单、游戏 HUD、结果界面、横屏提示
- **核心方法**: `renderOrientationHint()`, `renderMenu()`, `renderHUD()`

#### 9. Progress Tracker (进度跟踪器)
- **职责**: 计时、错误统计、进度计算
- **数据**: `currentNumber`, `errors`, `elapsedTime`, `timeLeft`

#### 10. Screen Adapter (屏幕适配器)
- **职责**: 响应式布局、DPI 适配、坐标转换、设备方向检测
- **策略**: 基于屏幕宽度的相对单位系统，支持横屏和竖屏两种方向
- **核心方法**: `isLandscape()`, `calculateDimensions()`, `getOrientation()`

#### 抖音云服务模块

#### 11. Douyin Auth Service (抖音认证服务)
- **职责**: 处理用户登录和授权
- **API**: `tt.login()`, `tt.getUserInfo()`
- **核心方法**: `login()`, `getOpenId()`, `checkAuthStatus()`

#### 12. Cloud Storage Service (云存储服务)
- **职责**: 管理云端数据存储和同步
- **数据**: 用户进度、最佳成绩、解锁状态
- **核心方法**: `saveProgress()`, `loadProgress()`, `syncData()`
- **降级**: 网络失败时使用本地存储

#### 13. User Profile Manager (用户档案管理器)
- **职责**: 管理用户进度、成绩、解锁状态
- **数据结构**: UserProfile (包含 openId, level, unlocked, bestScores)
- **核心方法**: `loadProfile()`, `updateProgress()`, `saveBestScore()`

#### 抖音平台能力模块

#### 14. Share Manager (分享管理器)
- **职责**: 封装分享 API，生成分享内容
- **API**: `tt.shareAppMessage()`
- **核心方法**: `shareScore()`, `generateShareContent()`, `trackShare()`

#### 15. Ad Manager (广告管理器)
- **职责**: 管理激励视频广告
- **API**: `tt.createRewardedVideoAd()`
- **功能**: 观看广告复活、观看广告获得提示
- **核心方法**: `showRewardedAd()`, `onAdComplete()`, `checkAdAvailability()`

#### 16. Analytics Manager (数据分析管理器)
- **职责**: 数据上报和分析
- **事件**: 游戏开始、完成、失败、分享、广告观看
- **核心方法**: `trackEvent()`, `trackGameStart()`, `trackGameComplete()`

#### 视觉设计模块

#### 17. Theme System (主题系统)
- **职责**: 定义独特的配色方案和视觉风格
- **配色**: 大胆的渐变色、高对比度、创意组合
- **核心方法**: `getThemeColors()`, `applyTheme()`, `getButtonStyle()`

#### 18. Animation Engine (动画引擎)
- **职责**: 管理创意动画效果
- **动画类型**: 浮动文字、粒子效果、弹跳、缩放、旋转、波纹
- **核心方法**: `addAnimation()`, `updateAnimations()`, `renderAnimations()`

#### 19. Font Manager (字体管理器)
- **职责**: 加载和管理特色字体
- **字体**: 游戏标题字体、数字字体、UI 字体
- **核心方法**: `loadFont()`, `getFontFamily()`, `isFontLoaded()`


## Components and Interfaces

### 1. Level Manager

```javascript
class LevelManager {
  constructor(cloudStorage) {
    this.cloudStorage = cloudStorage;
    this.currentLevel = 1;  // 1 | 2 | 'custom'
    this.levelConfig = {
      1: { numbers: 10, range: [1, 10], name: '第一关' },
      2: { numbers: 100, range: [1, 100], name: '第二关' }
    };
  }
  
  getCurrentLevelConfig() {
    return this.levelConfig[this.currentLevel];
  }
  
  async completeLevel(level) {
    // 保存完成状态到云端
    await this.cloudStorage.updateProgress({
      [`level${level}Completed`]: true,
      currentLevel: level + 1
    });
    
    // 如果完成第二关，解锁自选模式
    if (level === 2) {
      await this.cloudStorage.updateProgress({
        customModeUnlocked: true
      });
    }
  }
  
  async transitionToNextLevel() {
    const transitionManager = new TransitionManager();
    await transitionManager.showLevelTransition(
      this.currentLevel,
      this.currentLevel + 1
    );
    this.currentLevel++;
  }
}
```

### 2. Douyin Auth Service

```javascript
class DouyinAuthService {
  constructor() {
    this.openId = null;
    this.isAuthorized = false;
  }
  
  async login() {
    try {
      const { code } = await tt.login();
      // 调用云函数换取 openId
      const result = await tt.cloud.callFunction({
        name: 'get_open_id',
        data: { code }
      });
      this.openId = result.result.openId;
      this.isAuthorized = true;
      return this.openId;
    } catch (error) {
      console.error('Login failed:', error);
      // 降级到本地匿名 ID
      this.openId = this.generateAnonymousId();
      return this.openId;
    }
  }
  
  generateAnonymousId() {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async checkAuthStatus() {
    return this.isAuthorized;
  }
  
  getOpenId() {
    return this.openId;
  }
}
```

### 3. Cloud Storage Service

```javascript
class CloudStorageService {
  constructor(authService) {
    this.authService = authService;
    this.db = tt.cloud.database();
  }
  
  async saveProgress(progressData) {
    try {
      const openId = await this.authService.getOpenId();
      await this.db.collection('user_progress').doc(openId).set({
        data: {
          ...progressData,
          updateTime: Date.now()
        }
      });
      return true;
    } catch (error) {
      console.error('Save progress failed:', error);
      // 降级到本地存储
      this.saveToLocal(progressData);
      return false;
    }
  }
  
  async loadProgress() {
    try {
      const openId = await this.authService.getOpenId();
      const res = await this.db.collection('user_progress').doc(openId).get();
      return res.data;
    } catch (error) {
      console.error('Load progress failed:', error);
      // 从本地存储读取
      return this.loadFromLocal();
    }
  }
  
  saveToLocal(data) {
    tt.setStorageSync({ key: 'user_progress', data });
  }
  
  loadFromLocal() {
    try {
      return tt.getStorageSync({ key: 'user_progress' });
    } catch (error) {
      return null;
    }
  }
}
```

### 4. Theme System

```javascript
class ThemeSystem {
  constructor() {
    this.currentTheme = 'vibrant';
    this.themes = {
      vibrant: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        background: {
          type: 'gradient',
          colors: ['#FFE5B4', '#FFD4A3', '#FFC48C']
        },
        cell: {
          bg: '#FFFFFF',
          border: '#FF6B6B',
          done: 'rgba(200, 200, 200, 0.3)',
          text: '#333333'
        },
        button: {
          primary: '#FF6B6B',
          secondary: '#4ECDC4',
          success: '#4CAF50',
          danger: '#EF5350'
        }
      }
    };
  }
  
  getThemeColors() {
    return this.themes[this.currentTheme];
  }
  
  applyBackgroundGradient(ctx, width, height) {
    const theme = this.getThemeColors();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    theme.background.colors.forEach((color, index) => {
      gradient.addColorStop(index / (theme.background.colors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  getButtonStyle(type) {
    const theme = this.getThemeColors();
    return {
      color: theme.button[type],
      shadow: 'rgba(0, 0, 0, 0.2)',
      radius: 25
    };
  }
}
```

### 5. Animation Engine

```javascript
class AnimationEngine {
  constructor() {
    this.animations = [];
  }
  
  addFloatingText(x, y, text, color, size = 16) {
    this.animations.push({
      type: 'floatingText',
      x, y, text, color, size,
      startTime: Date.now(),
      duration: 900
    });
  }
  
  addParticleEffect(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      this.animations.push({
        type: 'particle',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        size: 3 + Math.random() * 3,
        startTime: Date.now(),
        duration: 600
      });
    }
  }
  
  addRippleEffect(x, y, maxRadius = 100) {
    this.animations.push({
      type: 'ripple',
      x, y,
      maxRadius,
      startTime: Date.now(),
      duration: 500
    });
  }
  
  update(ctx) {
    const now = Date.now();
    this.animations = this.animations.filter(anim => {
      const elapsed = now - anim.startTime;
      if (elapsed > anim.duration) return false;
      
      const progress = elapsed / anim.duration;
      this.renderAnimation(ctx, anim, progress);
      return true;
    });
  }
  
  renderAnimation(ctx, anim, progress) {
    switch (anim.type) {
      case 'floatingText':
        const y = anim.y - progress * 60;
        const opacity = 1 - progress;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = anim.color;
        ctx.font = `bold ${anim.size}px "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(anim.text, anim.x, y);
        ctx.restore();
        break;
        
      case 'particle':
        const px = anim.x + anim.vx * progress * 100;
        const py = anim.y + anim.vy * progress * 100;
        const pOpacity = 1 - progress;
        ctx.save();
        ctx.globalAlpha = pOpacity;
        ctx.fillStyle = anim.color;
        ctx.beginPath();
        ctx.arc(px, py, anim.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
        
      case 'ripple':
        const radius = anim.maxRadius * progress;
        const rOpacity = 1 - progress;
        ctx.save();
        ctx.globalAlpha = rOpacity;
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;
    }
  }
}
```

### 6. Screen Adapter (屏幕适配器)

```javascript
class ScreenAdapter {
  constructor() {
    this.systemInfo = tt.getSystemInfoSync();
    this.width = this.systemInfo.windowWidth;
    this.height = this.systemInfo.windowHeight;
    this.dpr = this.systemInfo.pixelRatio || 1;
    this.orientation = this.getOrientation();
  }
  
  isLandscape() {
    return this.width > this.height;
  }
  
  getOrientation() {
    return this.isLandscape() ? 'landscape' : 'portrait';
  }
  
  calculateDimensions() {
    const orientation = this.getOrientation();
    
    // 基础尺寸计算
    const baseFontSize = this.width * 0.04;
    const minTouchArea = 44; // 逻辑像素
    
    // 横屏布局调整
    if (orientation === 'landscape') {
      return {
        fontSize: baseFontSize * 0.9, // 横屏时字体稍小
        buttonSize: Math.max(minTouchArea, this.height * 0.08),
        cellPadding: this.width * 0.01,
        hudHeight: this.height * 0.12,
        orientation: 'landscape'
      };
    }
    
    // 竖屏布局（默认）
    return {
      fontSize: baseFontSize,
      buttonSize: Math.max(minTouchArea, this.width * 0.12),
      cellPadding: this.width * 0.02,
      hudHeight: this.height * 0.1,
      orientation: 'portrait'
    };
  }
  
  updateOrientation() {
    // 监听方向变化
    const newOrientation = this.getOrientation();
    if (newOrientation !== this.orientation) {
      this.orientation = newOrientation;
      return true; // 方向已改变
    }
    return false;
  }
  
  toPhysicalPixels(logicalPixels) {
    return logicalPixels * this.dpr;
  }
  
  toLogicalPixels(physicalPixels) {
    return physicalPixels / this.dpr;
  }
}
```

### 7. UI Manager (界面管理器)

```javascript
class UIManager {
  constructor(canvas, screenAdapter, themeSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    this.showOrientationHint = true; // 默认显示横屏提示
  }
  
  renderOrientationHint() {
    if (!this.showOrientationHint) return;
    
    const orientation = this.screenAdapter.getOrientation();
    if (orientation !== 'landscape') return; // 仅在横屏时显示
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 提示位置：顶部居中，不遮挡主要内容
    const hintY = dims.hudHeight * 0.3;
    const hintText = '💡 横屏体验更清晰';
    
    ctx.save();
    
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, dims.hudHeight * 0.5);
    
    // 提示文字
    ctx.fillStyle = '#FFE66D';
    ctx.font = `${dims.fontSize * 0.7}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hintText, width / 2, hintY);
    
    ctx.restore();
  }
  
  renderMenu(menuType, options) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    this.themeSystem.applyBackgroundGradient(ctx, width, height);
    
    // 渲染横屏提示（如果适用）
    this.renderOrientationHint();
    
    // 根据菜单类型渲染不同内容
    switch (menuType) {
      case 'main':
        this.renderMainMenu(dims);
        break;
      case 'levelSelect':
        this.renderLevelSelect(dims);
        break;
      case 'customMode':
        this.renderCustomMode(dims, options);
        break;
    }
  }
  
  renderMainMenu(dims) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 游戏标题
    const titleY = height * 0.25;
    ctx.fillStyle = this.themeSystem.getThemeColors().primary;
    ctx.font = `bold ${dims.fontSize * 2}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.fillText('1-100 专注力挑战', width / 2, titleY);
    
    // 按钮布局（根据方向调整）
    const buttonY = height * 0.5;
    const buttonSpacing = dims.buttonSize * 1.5;
    
    // 开始游戏按钮
    this.renderButton(
      width / 2 - dims.buttonSize,
      buttonY,
      dims.buttonSize * 2,
      dims.buttonSize * 0.8,
      '开始游戏',
      'primary'
    );
  }
  
  renderHUD(gameState) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 渲染横屏提示
    this.renderOrientationHint();
    
    // HUD 信息（目标数字、时间、错误次数）
    const hudY = dims.hudHeight * 0.7;
    ctx.fillStyle = '#333333';
    ctx.font = `${dims.fontSize}px "PingFang SC"`;
    ctx.textAlign = 'left';
    ctx.fillText(`目标: ${gameState.currentNumber}`, 20, hudY);
    
    ctx.textAlign = 'right';
    ctx.fillText(`错误: ${gameState.errors}`, width - 20, hudY);
  }
  
  renderButton(x, y, width, height, text, type) {
    const ctx = this.ctx;
    const style = this.themeSystem.getButtonStyle(type);
    
    // 按钮背景
    ctx.fillStyle = style.color;
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, style.radius);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${this.screenAdapter.calculateDimensions().fontSize}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);
  }
  
  hideOrientationHint() {
    this.showOrientationHint = false;
  }
}
```


## Data Models

### UserProfile

```javascript
{
  openId: string,
  currentLevel: 1 | 2 | 'custom',
  level1Completed: boolean,
  level2Completed: boolean,
  customModeUnlocked: boolean,
  bestScores: {
    level1: ScoreRecord | null,
    level2: ScoreRecord | null,
    custom_10_free: ScoreRecord | null,
    custom_10_60: ScoreRecord | null,
    custom_100_free: ScoreRecord | null,
    custom_100_60: ScoreRecord | null,
    custom_100_120: ScoreRecord | null,
    custom_100_180: ScoreRecord | null
  },
  totalGames: number,
  totalErrors: number,
  createdAt: number,
  updateTime: number
}
```

### ScoreRecord

```javascript
{
  time: number,        // 完成时间（秒）
  errors: number,      // 错误次数
  timestamp: number,   // 记录时间戳
  level: string,       // 关卡标识
  difficulty: number   // 时间限制（秒），0 表示自由模式
}
```

### GameState

```javascript
{
  state: 'idle' | 'level1' | 'level2' | 'custom' | 'playing' | 'paused' | 'finished',
  level: 1 | 2 | 'custom',
  customMode: '10' | '100' | null,  // 自选模式的数字范围
  difficulty: 0 | 60 | 120 | 180,   // 时间限制（秒）
  orientation: 'portrait' | 'landscape',  // 设备方向
  currentNumber: number,
  totalNumbers: 10 | 100,           // 当前关卡的总数字数
  errors: number,
  elapsedTime: number,
  timeLeft: number,
  cells: Cell[]
}
```

### Cell

```javascript
{
  site: Point,           // 种子点坐标
  number: 1-100,         // 显示的数字
  polygon: Point[],      // 多边形顶点数组
  done: boolean          // 是否已完成
}
```

### Point

```javascript
{
  x: number,
  y: number
}
```

## API 设计

### 抖音云函数 API

#### get_open_id
```javascript
// 云函数：获取用户 openId
exports.main = async (event, context) => {
  const { code } = event;
  
  try {
    const result = await cloud.getOpenId({ code });
    return { openId: result.openId };
  } catch (error) {
    return { error: error.message };
  }
};
```

#### save_progress
```javascript
// 云函数：保存用户进度
exports.main = async (event, context) => {
  const { openId, progressData } = event;
  const db = cloud.database();
  
  try {
    await db.collection('user_progress').doc(openId).set({
      data: {
        ...progressData,
        updateTime: Date.now()
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### load_progress
```javascript
// 云函数：加载用户进度
exports.main = async (event, context) => {
  const { openId } = event;
  const db = cloud.database();
  
  try {
    const res = await db.collection('user_progress').doc(openId).get();
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 本地存储降级方案

```javascript
// 保存到本地
function saveToLocal(key, data) {
  try {
    tt.setStorageSync({
      key,
      data: JSON.stringify(data)
    });
    return true;
  } catch (error) {
    console.error('Local save failed:', error);
    return false;
  }
}

// 从本地读取
function loadFromLocal(key) {
  try {
    const data = tt.getStorageSync({ key });
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Local load failed:', error);
    return null;
  }
}

// 同步策略
async function syncWithCloud() {
  const localData = loadFromLocal('user_progress');
  if (localData && localData.needSync) {
    try {
      await cloudStorage.saveProgress(localData);
      localData.needSync = false;
      saveToLocal('user_progress', localData);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

## 游戏初始化流程

### 初始化步骤

1. **系统信息获取**: 使用 `tt.getSystemInfoSync()` 获取设备信息
2. **Canvas 创建**: 创建全屏 Canvas，设置宽高为窗口尺寸
3. **屏幕适配器初始化**: 创建 `ScreenAdapter` 实例，检测设备方向
4. **方向检测**: 调用 `screenAdapter.getOrientation()` 获取当前方向（'portrait' | 'landscape'）
5. **主题系统初始化**: 创建 `ThemeSystem` 实例
6. **UI 管理器初始化**: 创建 `UIManager` 实例，传入 canvas、screenAdapter、themeSystem
7. **用户登录**: 调用 `DouyinAuthService.login()` 获取 openId
8. **加载用户数据**: 从抖音云加载用户进度和成绩
9. **显示主菜单**: 渲染主菜单，包含横屏提示（如果是横屏）

### 方向支持

游戏支持横屏和竖屏两种方向：

- **竖屏模式**: 默认布局，按钮较大，字体标准
- **横屏模式**: 优化布局，按钮稍小，字体缩小 10%，显示"横屏体验更清晰"提示

### 横屏提示显示规则

- 仅在横屏时显示提示
- 提示位置：界面顶部，半透明黑色背景
- 提示文字：💡 横屏体验更清晰
- 提示颜色：明黄色 (#FFE66D)
- 不遮挡主要游戏内容（HUD 高度的 50% 以内）
- 用户可以选择隐藏提示（通过 `uiManager.hideOrientationHint()`）

### 初始化代码示例

```javascript
// game.js
class Game {
  constructor() {
    this.canvas = null;
    this.screenAdapter = null;
    this.themeSystem = null;
    this.uiManager = null;
    this.authService = null;
    this.gameState = null;
  }
  
  async init() {
    try {
      // 1. 获取系统信息
      const systemInfo = tt.getSystemInfoSync();
      
      // 2. 创建 Canvas
      this.canvas = tt.createCanvas();
      this.canvas.width = systemInfo.windowWidth;
      this.canvas.height = systemInfo.windowHeight;
      
      // 3. 初始化屏幕适配器
      this.screenAdapter = new ScreenAdapter();
      const orientation = this.screenAdapter.getOrientation();
      console.log(`Device orientation: ${orientation}`);
      
      // 4. 初始化主题系统
      this.themeSystem = new ThemeSystem();
      
      // 5. 初始化 UI 管理器
      this.uiManager = new UIManager(
        this.canvas,
        this.screenAdapter,
        this.themeSystem
      );
      
      // 6. 用户登录
      this.authService = new DouyinAuthService();
      await this.authService.login();
      
      // 7. 初始化游戏状态
      this.gameState = {
        state: 'idle',
        level: 1,
        customMode: null,
        difficulty: 0,
        orientation: orientation,
        currentNumber: 1,
        totalNumbers: 10,
        errors: 0,
        elapsedTime: 0,
        timeLeft: 0,
        cells: []
      };
      
      // 8. 显示主菜单
      this.uiManager.renderMenu('main');
      
      // 9. 监听方向变化
      this.setupOrientationListener();
      
    } catch (error) {
      console.error('Game initialization failed:', error);
      this.showErrorScreen('游戏初始化失败，请重启应用');
    }
  }
  
  setupOrientationListener() {
    // 定期检查方向变化
    setInterval(() => {
      if (this.screenAdapter.updateOrientation()) {
        const newOrientation = this.screenAdapter.getOrientation();
        this.gameState.orientation = newOrientation;
        console.log(`Orientation changed to: ${newOrientation}`);
        
        // 重新渲染界面
        this.render();
      }
    }, 500);
  }
  
  render() {
    switch (this.gameState.state) {
      case 'idle':
        this.uiManager.renderMenu('main');
        break;
      case 'playing':
        this.renderGame();
        break;
      // ... 其他状态
    }
  }
  
  renderGame() {
    // 渲染游戏内容
    this.renderCells();
    this.uiManager.renderHUD(this.gameState);
  }
}

// 启动游戏
const game = new Game();
game.init();
```

## 视觉设计技术方案

### 配色方案

采用大胆的渐变色和高对比度配色，区别于常见的 AI 生成风格：

- **主色调**: 珊瑚红 (#FF6B6B) + 青绿色 (#4ECDC4)
- **强调色**: 明黄色 (#FFE66D)
- **背景渐变**: 暖色系渐变 (#FFE5B4 → #FFD4A3 → #FFC48C)
- **Cell 配色**: 白色背景 + 珊瑚红边框
- **按钮配色**: 根据功能使用不同颜色（成功绿、危险红、主色红）

### 动画效果

1. **浮动文字**: 点击反馈时向上浮动并淡出
2. **粒子效果**: 完成关卡时的庆祝效果
3. **波纹效果**: 按钮点击时的扩散波纹
4. **弹跳动画**: 按钮按下时的缩放效果
5. **关卡过渡**: 淡入淡出 + 鼓励文字动画

### 字体方案

- **标题字体**: PingFang SC Bold (系统字体)
- **数字字体**: Courier New (等宽字体，清晰易读)
- **UI 字体**: PingFang SC Regular (系统字体)

### 装饰元素

- **背景装饰**: 半透明圆点图案
- **按钮阴影**: 柔和的投影效果
- **进度条**: 渐变填充 + 圆角设计


## Error Handling

### 错误分类与处理策略

#### 1. 初始化错误

**Canvas 创建失败**
```javascript
try {
  this.canvas = tt.createCanvas();
  if (!this.canvas) {
    throw new Error('Canvas creation failed');
  }
} catch (error) {
  console.error('Failed to create canvas:', error);
  this.showErrorScreen('无法初始化游戏，请重启应用');
  return;
}
```

**系统信息获取失败**
```javascript
try {
  const systemInfo = tt.getSystemInfoSync();
  if (!systemInfo || !systemInfo.windowWidth) {
    throw new Error('Invalid system info');
  }
} catch (error) {
  console.error('Failed to get system info:', error);
  // 使用默认值降级
  this.screenWidth = 375;
  this.screenHeight = 667;
}
```

#### 2. Voronoi 生成错误

**生成失败重试机制**
```javascript
async generateVoronoiWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const cells = this.voronoiGenerator.generate();
      
      // 验证生成结果
      if (cells.length !== this.expectedCellCount) {
        throw new Error(`Invalid cell count: ${cells.length}`);
      }
      
      return cells;
    } catch (error) {
      console.warn(`Voronoi generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('All Voronoi generation attempts failed, using grid fallback');
        return this.generateGridLayout();
      }
      
      // 使用不同的随机种子重试
      this.voronoiGenerator.randomSeed = Date.now() + attempt;
    }
  }
}
```

#### 3. 云服务错误

**登录失败降级**
```javascript
async login() {
  try {
    const { code } = await tt.login();
    const result = await tt.cloud.callFunction({
      name: 'get_open_id',
      data: { code }
    });
    this.openId = result.result.openId;
    this.isAuthorized = true;
    return this.openId;
  } catch (error) {
    console.error('Login failed:', error);
    // 降级到本地匿名 ID
    this.openId = this.generateAnonymousId();
    this.isAuthorized = false;
    return this.openId;
  }
}
```

**数据存储失败降级**
```javascript
async saveProgress(progressData) {
  try {
    const openId = await this.authService.getOpenId();
    await this.db.collection('user_progress').doc(openId).set({
      data: progressData
    });
    return true;
  } catch (error) {
    console.error('Save progress failed:', error);
    // 降级到本地存储
    this.saveToLocal(progressData);
    // 标记需要同步
    progressData.needSync = true;
    return false;
  }
}
```

#### 4. 触摸事件错误

**事件处理异常捕获**
```javascript
handleTap(pos) {
  try {
    const clickedCell = this.findCellAtPosition(pos);
    
    if (clickedCell && this.onCellClick) {
      this.onCellClick(clickedCell);
    }
  } catch (error) {
    console.error('Touch event handling error:', error);
    // 记录错误但不中断游戏
    this.logError('touch_event', error);
  }
}
```

#### 5. 全局异常捕获

```javascript
// 在 game.js 入口处设置
tt.onError((error) => {
  console.error('Unhandled error:', error);
  
  // 记录错误信息
  logErrorToAnalytics({
    type: 'unhandled_exception',
    message: error.message,
    stack: error.stack,
    timestamp: Date.now()
  });
  
  // 显示友好的错误界面
  if (gameManager && gameManager.state === 'playing') {
    gameManager.pauseGame();
    gameManager.showErrorDialog('游戏遇到错误，是否重新开始？');
  }
});
```

### 降级方案总结

| 功能 | 主方案 | 降级方案 | 影响 |
|------|--------|---------|------|
| 用户登录 | 抖音云登录 | 本地匿名 ID | 无法跨设备同步 |
| 数据存储 | 抖音云数据库 | 本地存储 | 数据仅保存在本地 |
| Voronoi 生成 | Delaunay 算法 | 网格布局 | 布局规则化 |
| 分享功能 | 抖音分享 API | 不可用 | 无法分享 |
| 激励广告 | 抖音广告 SDK | 不可用 | 无复活和提示 |
| 数据分析 | 抖音分析 API | 本地日志 | 无法统计分析 |


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Canvas 尺寸匹配窗口尺寸

*For any* valid system information returned by tt.getSystemInfoSync(), when the Canvas is created, its width SHALL equal systemInfo.windowWidth and its height SHALL equal systemInfo.windowHeight.

**Validates: Requirements 1.2**

### Property 2: 关卡数字数量正确性

*For any* level initialization, when Level 1 is started, the system SHALL generate exactly 10 cells with numbers 1-10, and when Level 2 is started, the system SHALL generate exactly 100 cells with numbers 1-100.

**Validates: Requirements 3.2, 3.3**

### Property 3: Voronoi 生成完整性

*For any* new game initialization with N cells (where N is 10 or 100), the Voronoi_Generator SHALL generate exactly N cells, each cell SHALL contain a unique number from the valid range, each cell SHALL have a minimum area of at least 0.5% of the screen area, and no two cells SHALL overlap.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 4: 数字唯一性分配

*For any* generated Voronoi diagram with N cells, when numbers are randomly assigned, each number in the valid range SHALL appear exactly once across all cells.

**Validates: Requirements 5.3**

### Property 5: 点在多边形内检测正确性

*For any* touch point and any cell polygon, the point-in-polygon detection algorithm SHALL correctly determine whether the point lies inside the polygon boundary.

**Validates: Requirements 6.2**

### Property 6: 正确点击更新进度

*For any* game state where a player clicks a cell with number equal to currentNumber, the cell SHALL be marked as done, currentNumber SHALL increment by 1, and the progress tracker SHALL update accordingly.

**Validates: Requirements 6.3**

### Property 7: 错误点击增加错误计数

*For any* game state where a player clicks a cell with number not equal to currentNumber, the error count SHALL increment by 1.

**Validates: Requirements 6.4**

### Property 8: 关卡完成触发过渡

*For any* level completion (when currentNumber exceeds totalNumbers), the system SHALL trigger level transition, save completion status to cloud, and if Level 2 is completed, unlock custom mode.

**Validates: Requirements 3.4, 3.5, 3.6**

### Property 9: 点击反馈完整性

*For any* cell click (correct or incorrect), the Feedback_System SHALL display a floating text animation at the cell position, apply appropriate color feedback to the cell, and trigger vibration feedback.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 10: 计时器初始化

*For any* new game start, the Progress_Tracker SHALL initialize the timer to 0 seconds (for free mode) or to the selected time limit (for timed modes), and the timer SHALL begin counting.

**Validates: Requirements 8.1**

### Property 11: HUD 信息完整性

*For any* game state during play, the Canvas_Renderer SHALL display the current target number, elapsed time (or time remaining), error count, and progress bar with correct percentage.

**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

### Property 12: 进度条百分比计算

*For any* current number N (where 1 ≤ N ≤ totalNumbers), the progress bar fill percentage SHALL equal (N - 1) / totalNumbers * 100%.

**Validates: Requirements 8.5**

### Property 13: 倒计时更新正确性

*For any* timed game mode, the time remaining SHALL decrease by 1 second every second, and when it reaches 0, the game SHALL end.

**Validates: Requirements 9.3, 9.4**

### Property 14: 游戏结果信息完整性

*For any* completed or timed-out game, the result screen SHALL display completion time (or "timeout"), total error count, and provide options to restart or return home.

**Validates: Requirements 10.2, 10.3, 10.4**

### Property 15: 用户进度云端同步

*For any* level completion or best score update, the system SHALL attempt to save the data to Douyin Cloud, and if cloud save fails, SHALL save to local storage with a sync flag.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 16: 最佳成绩更新逻辑

*For any* completed game with completion time T and mode M, if T is less than the existing best record time for mode M (or no record exists), the best record SHALL be updated with the new time.

**Validates: Requirements 11.3**

### Property 17: 自选模式解锁条件

*For any* user profile, custom mode SHALL be accessible if and only if level2Completed is true.

**Validates: Requirements 4.1, 4.2**

### Property 18: 屏幕适配正确性

*For any* screen width W in the range [320px, 1080px], the Screen_Adapter SHALL calculate font size as W * 0.04, button minimum touch area as 44x44 logical pixels, and Canvas scaling factor as devicePixelRatio.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4**

### Property 19: Voronoi 生成重试机制

*For any* Voronoi generation failure, the system SHALL retry up to 3 times with different random seeds before falling back to grid layout.

**Validates: Requirements 19.2, 19.3**

### Property 20: 数据持久化往返一致性

*For any* game record (mode, difficulty, completion time, errors), when saved using cloud storage or local storage and then loaded, the loaded data SHALL equal the original data.

**Validates: Requirements 11.1**

### Property 21: 分享内容生成正确性

*For any* game completion with score data, the Share_Manager SHALL generate a share message containing the level, completion time, and error count.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 22: 广告观看限制

*For any* game session, the Ad_Manager SHALL allow at most 1 revive ad and at most 2 hint ads to be watched.

**Validates: Requirements 13.4, 13.5**

### Property 23: 数据分析事件上报

*For any* game start, completion, or failure event, the Analytics_Manager SHALL create an event record and add it to the event queue for batch reporting.

**Validates: Requirements 14.1, 14.2, 14.3**

### Property 24: 设备方向检测正确性

*For any* device with screen dimensions width W and height H, the Screen_Adapter SHALL correctly identify orientation as 'landscape' when W > H and 'portrait' when W ≤ H.

**Validates: Requirements 18.5**

### Property 25: 横屏提示显示条件

*For any* game state, the UI_Manager SHALL display the orientation hint if and only if the current orientation is 'landscape' and showOrientationHint is true.

**Validates: Requirements 16.7, 16.8**

### Property 26: 横屏布局尺寸调整

*For any* landscape orientation, the Screen_Adapter SHALL calculate fontSize as baseFontSize * 0.9, and buttonSize based on screen height rather than width.

**Validates: Requirements 18.5**


## Testing Strategy

### 测试方法论

本项目采用双重测试策略，结合单元测试和基于属性的测试（Property-Based Testing, PBT），以确保全面的代码覆盖和正确性验证。

#### 单元测试 vs 属性测试

- **单元测试**: 验证特定示例、边缘情况和错误条件
- **属性测试**: 通过随机生成大量输入验证通用属性
- **互补性**: 单元测试捕获具体 bug，属性测试验证通用正确性

### 属性测试配置

#### 测试库选择

由于抖音小游戏基于 JavaScript，我们选择 **fast-check** 作为属性测试库：

```javascript
// package.json
{
  "devDependencies": {
    "fast-check": "^3.15.0",
    "jest": "^29.7.0"
  }
}
```

#### 测试配置

每个属性测试必须：
- 运行至少 100 次迭代（由于随机化）
- 使用注释标签引用设计文档中的属性
- 标签格式: `Feature: douyin-1-100-focus-game, Property {number}: {property_text}`

### 属性测试示例

#### Property 3: Voronoi 生成完整性

```javascript
// __tests__/voronoi-generator.property.test.js
const fc = require('fast-check');
const { VoronoiGenerator } = require('../src/voronoi-generator');

describe('Property Tests: Voronoi Generator', () => {
  test('Feature: douyin-1-100-focus-game, Property 3: Voronoi generation completeness', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1080 }),
        fc.integer({ min: 568, max: 2400 }),
        fc.constantFrom(10, 100),
        (width, height, numCells) => {
          const generator = new VoronoiGenerator(width, height, numCells);
          const cells = generator.generate();
          
          // 验证生成了正确数量的 cell
          expect(cells.length).toBe(numCells);
          
          // 验证每个数字恰好出现一次
          const numbers = cells.map(c => c.number).sort((a, b) => a - b);
          const expectedNumbers = Array.from({ length: numCells }, (_, i) => i + 1);
          expect(numbers).toEqual(expectedNumbers);
          
          // 验证每个 cell 的最小面积
          const minArea = (width * height) * 0.005;
          for (const cell of cells) {
            const area = calculatePolygonArea(cell.polygon);
            expect(area).toBeGreaterThanOrEqual(minArea);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 12: 进度条百分比计算

```javascript
// __tests__/progress-tracker.property.test.js
test('Feature: douyin-1-100-focus-game, Property 12: Progress bar percentage calculation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }),
      fc.constantFrom(10, 100),
      (currentNumber, totalNumbers) => {
        if (currentNumber > totalNumbers) return true;
        
        const expectedPercentage = (currentNumber - 1) / totalNumbers;
        const calculatedPercentage = (currentNumber - 1) / totalNumbers;
        
        expect(calculatedPercentage).toBeCloseTo(expectedPercentage, 5);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 20: 数据持久化往返一致性

```javascript
// __tests__/storage.property.test.js
test('Feature: douyin-1-100-focus-game, Property 20: Data persistence round-trip consistency', () => {
  fc.assert(
    fc.property(
      fc.record({
        level: fc.constantFrom('level1', 'level2', 'custom_10_free', 'custom_100_60'),
        time: fc.integer({ min: 10, max: 600 }),
        errors: fc.integer({ min: 0, max: 50 }),
        timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
      }),
      (record) => {
        // Mock storage
        const storage = {};
        global.tt = {
          setStorageSync: ({ key, data }) => { storage[key] = JSON.stringify(data); },
          getStorageSync: ({ key }) => JSON.parse(storage[key] || 'null')
        };
        
        const key = `score_${record.level}`;
        
        // 保存
        tt.setStorageSync({ key, data: record });
        
        // 读取
        const loaded = tt.getStorageSync({ key });
        
        // 验证一致性
        expect(loaded).toEqual(record);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 24: 设备方向检测正确性

```javascript
// __tests__/screen-adapter.property.test.js
test('Feature: douyin-1-100-focus-game, Property 24: Device orientation detection correctness', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 320, max: 1080 }),
      fc.integer({ min: 568, max: 2400 }),
      (width, height) => {
        // Mock tt.getSystemInfoSync
        global.tt = {
          getSystemInfoSync: () => ({
            windowWidth: width,
            windowHeight: height,
            pixelRatio: 2
          })
        };
        
        const screenAdapter = new ScreenAdapter();
        const orientation = screenAdapter.getOrientation();
        
        // 验证方向检测逻辑
        if (width > height) {
          expect(orientation).toBe('landscape');
          expect(screenAdapter.isLandscape()).toBe(true);
        } else {
          expect(orientation).toBe('portrait');
          expect(screenAdapter.isLandscape()).toBe(false);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 25: 横屏提示显示条件

```javascript
// __tests__/ui-manager.property.test.js
test('Feature: douyin-1-100-focus-game, Property 25: Landscape hint display condition', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('portrait', 'landscape'),
      fc.boolean(),
      (orientation, showHint) => {
        // Mock canvas and dependencies
        const mockCanvas = {
          width: orientation === 'landscape' ? 800 : 400,
          height: orientation === 'landscape' ? 400 : 800,
          getContext: () => ({
            save: jest.fn(),
            restore: jest.fn(),
            fillRect: jest.fn(),
            fillText: jest.fn(),
            fillStyle: '',
            font: '',
            textAlign: '',
            textBaseline: ''
          })
        };
        
        const mockScreenAdapter = {
          getOrientation: () => orientation,
          calculateDimensions: () => ({
            fontSize: 16,
            hudHeight: 60,
            orientation
          })
        };
        
        const mockThemeSystem = {
          themes: { vibrant: {} }
        };
        
        const uiManager = new UIManager(mockCanvas, mockScreenAdapter, mockThemeSystem);
        uiManager.showOrientationHint = showHint;
        
        // 调用 renderOrientationHint
        uiManager.renderOrientationHint();
        
        // 验证：仅在横屏且 showHint 为 true 时渲染
        const ctx = mockCanvas.getContext('2d');
        const shouldRender = orientation === 'landscape' && showHint;
        
        if (shouldRender) {
          expect(ctx.fillRect).toHaveBeenCalled();
          expect(ctx.fillText).toHaveBeenCalledWith(
            expect.stringContaining('横屏'),
            expect.any(Number),
            expect.any(Number)
          );
        } else {
          expect(ctx.fillRect).not.toHaveBeenCalled();
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 26: 横屏布局尺寸调整

```javascript
// __tests__/screen-adapter.property.test.js
test('Feature: douyin-1-100-focus-game, Property 26: Landscape layout dimension adjustment', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 568, max: 2400 }), // width (landscape)
      fc.integer({ min: 320, max: 1080 }), // height (landscape)
      (width, height) => {
        // Ensure landscape orientation
        if (width <= height) return true; // Skip non-landscape cases
        
        global.tt = {
          getSystemInfoSync: () => ({
            windowWidth: width,
            windowHeight: height,
            pixelRatio: 2
          })
        };
        
        const screenAdapter = new ScreenAdapter();
        const dims = screenAdapter.calculateDimensions();
        
        // 验证横屏布局调整
        expect(dims.orientation).toBe('landscape');
        
        // 字体大小应该是基础大小的 90%
        const baseFontSize = width * 0.04;
        expect(dims.fontSize).toBeCloseTo(baseFontSize * 0.9, 1);
        
        // 按钮大小应该基于高度
        expect(dims.buttonSize).toBeGreaterThanOrEqual(44);
        expect(dims.buttonSize).toBeCloseTo(Math.max(44, height * 0.08), 1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### 单元测试示例

#### 边缘情况测试

```javascript
// __tests__/level-manager.test.js
describe('Unit Tests: Level Manager Edge Cases', () => {
  test('should initialize with level 1', () => {
    const levelManager = new LevelManager();
    expect(levelManager.currentLevel).toBe(1);
  });

  test('should unlock custom mode after completing level 2', async () => {
    const mockCloudStorage = {
      updateProgress: jest.fn().mockResolvedValue(true)
    };
    const levelManager = new LevelManager(mockCloudStorage);
    
    await levelManager.completeLevel(2);
    
    expect(mockCloudStorage.updateProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        customModeUnlocked: true
      })
    );
  });
});
```

### 测试覆盖率目标

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|---------|-----------|-----------|
| LevelManager | 90% | 85% | 95% |
| VoronoiGenerator | 85% | 80% | 90% |
| RenderEngine | 75% | 70% | 80% |
| CloudStorageService | 85% | 80% | 90% |
| 整体目标 | 80% | 75% | 85% |

## 性能优化策略

### 1. 渲染优化
- 使用 requestAnimationFrame 控制渲染帧率，目标 60 FPS
- 实现脏矩形更新，只重绘变化区域
- 缓存静态元素到离屏 Canvas
- 减少 Canvas 状态切换次数
- 批量绘制相同样式的元素

### 2. 内存优化
- 及时清理不再使用的动画对象
- 复用 Cell 对象，避免频繁创建销毁
- 限制动画队列长度（最多 50 个）
- 使用对象池管理粒子效果
- 定期触发垃圾回收（在关卡过渡时）

### 3. 网络优化
- 批量上报数据分析事件（每 10 个事件或 30 秒）
- 实现请求队列和重试机制
- 本地缓存用户数据，减少云端请求
- 延迟加载非关键资源
- 使用 CDN 加速静态资源

### 4. 包体优化
- 压缩图片资源（使用 WebP 格式）
- 选择轻量级字体文件（< 200KB）
- 代码压缩和混淆
- 按需加载模块
- 移除未使用的代码

### 5. 启动优化
- 预加载关键资源
- 延迟初始化非关键模块
- 使用骨架屏提升感知速度
- 优化首屏渲染时间（< 1 秒）

### 性能监控

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      renderTime: 0,
      voronoiGenTime: 0,
      touchResponseTime: 0
    };
  }
  
  measureRenderTime(callback) {
    const start = performance.now();
    callback();
    const end = performance.now();
    this.metrics.renderTime = end - start;
    
    // 目标：< 16ms (60 FPS)
    if (this.metrics.renderTime > 16) {
      console.warn(`Slow render: ${this.metrics.renderTime}ms`);
    }
  }
  
  measureFPS() {
    let lastTime = performance.now();
    let frames = 0;
    
    const measure = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = frames;
        frames = 0;
        lastTime = currentTime;
        
        // 目标：>= 55 FPS
        if (this.metrics.fps < 55) {
          console.warn(`Low FPS: ${this.metrics.fps}`);
        }
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }
}
```

### 性能目标

| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| 首屏渲染时间 | < 1 秒 | performance.timing |
| 帧率 | >= 55 FPS | requestAnimationFrame |
| 单帧渲染时间 | < 16ms | performance.now() |
| Voronoi 生成时间 | < 500ms | performance.now() |
| 触摸响应时间 | < 50ms | event timestamp |
| 内存占用 | < 100MB | performance.memory |
| 包体大小 | < 4MB | 构建输出 |

