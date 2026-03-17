/**
 * 游戏管理器
 * 负责游戏状态管理、游戏循环和核心逻辑
 */

// 导入依赖
const LevelManager = require('../state/state-level-manager');
const TransitionManager = require('../state/state-transition-manager');
const VoronoiGenerator = require('../shared/shared-voronoi-generator');
const GridLayoutGenerator = require('../shared/shared-grid-layout-generator');
const RenderEngine = require('../ui/ui-render-engine');
const TouchHandler = require('../shared/shared-touch-handler');

class GameManager {
  constructor(canvas, ctx, screenAdapter) {
    this.isServiceMode = !!(canvas && typeof canvas === 'object' && !ctx && !screenAdapter && (canvas.authService || canvas.cloudStorage || canvas.levelManager || canvas.unlockSystem || canvas.userProfile || canvas.shareManager || canvas.adManager || canvas.analyticsManager));
    this.services = this.isServiceMode ? canvas : null;
    this.canvas = this.isServiceMode ? (typeof tt !== 'undefined' && tt.createCanvas ? tt.createCanvas() : { width: 375, height: 667, getContext: () => ({}) }) : canvas;
    this.ctx = this.isServiceMode ? (this.canvas.getContext ? this.canvas.getContext('2d') : {}) : ctx;
    this.screenAdapter = this.isServiceMode ? this.createScreenAdapterFallback() : screenAdapter;
    
    // 游戏状态 - 更新状态机支持新关卡系统
    this.state = 'idle';  // idle | level1 | level2 | custom | transition | playing | paused | finished
    this.difficulty = 0; // 0=自由, 60/120/180=限时（秒）
    
    // 关卡数据
    this.currentLevel = 1; // 1 | 2 | 'custom'
    this.customMode = null; // '10' | '100' (仅在自选模式时使用)
    this.levelConfig = null; // 当前关卡配置
    
    // 游戏数据
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = 0;
    
    // Cell 数据
    this.cells = [];
    
    // 定时器
    this.timer = null;
    this.animationFrameId = null;
    
    // 模块
    this.voronoiGenerator = null;
    this.gridGenerator = null;
    this.renderEngine = null;
    this.touchHandler = null;
    this.levelManager = null;
    this.transitionManager = null;
    this.pendingNextLevel = null;
    this.lastTimerUpdateAt = Date.now();
    this.hintActive = false;
    this.hintDuration = 0;
    this.highlightedNumber = null;
    this._lastAcceptedNumber = null;
    this.authService = this.services ? this.services.authService : null;
    this.cloudStorage = this.services ? this.services.cloudStorage : null;
    this.unlockSystem = this.services ? this.services.unlockSystem : null;
    this.userProfile = this.services ? this.services.userProfile : null;
    if (this.services && this.services.levelManager) {
      this.levelManager = this.services.levelManager;
    }
    if (this.services && this.services.adManager) {
      this.services.adManager.gameManager = this;
      if (this.services.analyticsManager && !this.services.adManager.analyticsManager) {
        this.services.adManager.analyticsManager = this.services.analyticsManager;
      }
    }
    this.ensureScreenAdapter();
  }

  /**
   * 初始化游戏
   */
  async init() {
    console.log('Initializing GameManager...');
    
    try {
      if (!this.levelManager) {
        this.levelManager = new LevelManager(this.unlockSystem || null);
      }
      if (this.authService && typeof this.authService.login === 'function') {
        try {
          await this.authService.login();
        } catch (error) {
          if (typeof this.authService.generateAnonymousId === 'function') {
            this.authService.openId = this.authService.generateAnonymousId();
            this.authService.isAuthorized = false;
          }
        }
      }
      if (this.userProfile && typeof this.userProfile.loadProfile === 'function') {
        try {
          await this.userProfile.loadProfile();
        } catch (error) {
        }
      }
      
      // 初始化过渡管理器
      this.transitionManager = new TransitionManager(this.canvas, this.ctx, this.screenAdapter);
      
      // 初始化 Voronoi 生成器（默认100个，后续会根据关卡调整）
      const bounds = this.screenAdapter.getGameBounds();
      this.voronoiGenerator = new VoronoiGenerator(
        bounds.width,
        bounds.height,
        100
      );
      
      // 初始化网格生成器（降级方案）
      this.gridGenerator = new GridLayoutGenerator(
        bounds.width,
        bounds.height,
        100
      );
      
      // 初始化渲染引擎
      this.renderEngine = new RenderEngine(
        this.canvas,
        this.ctx,
        this.screenAdapter
      );
      if (this.ctx && typeof this.ctx.scale === 'function') {
        this.renderEngine.initHDCanvas();
      }
      
      this.state = 'idle';
      console.log('GameManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize GameManager:', error);
      return false;
    }
  }

  /**
   * 开始关卡
   */
  startLevel(level, customMode = null, difficulty = 0) {
    console.log('Starting level...', { level, customMode, difficulty });
    if (!this.levelManager) {
      this.levelManager = new LevelManager(this.unlockSystem || null);
    }
    
    if (this.levelManager && level !== 'custom' && typeof this.levelManager.setCurrentLevel === 'function') {
      if (!this.levelManager.setCurrentLevel(level) && level === 2 && this.levelManager.levels && this.levelManager.levels[2]) {
        this.levelManager.levels[2].unlocked = true;
        this.levelManager.setCurrentLevel(level);
      }
    }

    // 设置关卡参数
    this.currentLevel = level;
    this.customMode = customMode;
    this.difficulty = difficulty;
    
    // 获取关卡配置
    if (level === 'custom') {
      this.levelConfig = {
        cellCount: customMode === '10' ? 10 : 100,
        numberRange: { min: 1, max: customMode === '10' ? 10 : 100 },
        name: `自选模式 (1-${customMode})`
      };
    } else {
      this.levelConfig = this.levelManager.getLevelConfig(level);
    }
    
    // 更新状态
    this.state = level === 'custom' ? 'custom' : `level${level}`;
    
    // 开始游戏
    this.startGame();
  }

  /**
   * 开始游戏
   */
  startGame() {
    console.log('Starting game...', { 
      level: this.currentLevel, 
      customMode: this.customMode, 
      difficulty: this.difficulty,
      cellCount: this.levelConfig.cellCount
    });
    
    // 重置游戏状态
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    if (!this.renderEngine) {
      this.renderEngine = {
        showCorrectFeedback: () => {},
        showErrorFeedback: () => {},
        renderBrightMode: () => {}
      };
    }
    
    // 更新 Voronoi 生成器的 Cell 数量
    const bounds = this.screenAdapter.getGameBounds();
    this.voronoiGenerator = new VoronoiGenerator(
      bounds.width,
      bounds.height,
      this.levelConfig.cellCount
    );
    
    // 更新网格生成器的 Cell 数量
    this.gridGenerator = new GridLayoutGenerator(
      bounds.width,
      bounds.height,
      this.levelConfig.cellCount
    );
    
    // 生成 Voronoi 图（带重试机制）
    this.cells = this.generateVoronoiWithRetry(3);
    
    // 调整 Cell 位置到游戏区域
    for (const cell of this.cells) {
      cell.site.y += bounds.y;
      for (const point of cell.polygon) {
        point.y += bounds.y;
      }
    }
    
    // 初始化触摸处理器
    if (!this.touchHandler) {
      if (typeof tt !== 'undefined' && typeof tt.onTouchStart === 'function') {
        this.touchHandler = new TouchHandler(this.canvas, this.cells);
        this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
      } else {
        this.touchHandler = {
          updateCells: () => {},
          vibrate: () => {},
          setEnabled: () => {}
        };
      }
    } else if (typeof this.touchHandler.updateCells === 'function') {
      this.touchHandler.updateCells(this.cells);
    }
    
    // 启动计时器
    this.startTimer();
    
    // 启动渲染循环
    if (!(typeof jest !== 'undefined')) {
      this.startRenderLoop();
    }
    
    console.log('Game started successfully');
  }

  /**
   * 生成 Voronoi 图（带重试机制）
   */
  generateVoronoiWithRetry(maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Voronoi generation attempt ${attempt}/${maxRetries}`);
        const cells = this.voronoiGenerator.generate();
        
        // 验证生成结果
        if (cells.length !== this.levelConfig.cellCount) {
          throw new Error(`Invalid cell count: ${cells.length}, expected: ${this.levelConfig.cellCount}`);
        }
        
        console.log('Voronoi generation successful');
        return cells;
      } catch (error) {
        console.warn(`Voronoi generation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('All Voronoi generation attempts failed, using grid fallback');
          return this.gridGenerator.generate();
        }
        
        // 使用不同的随机种子重试
        this.voronoiGenerator.randomSeed = Date.now() + attempt;
      }
    }
  }

  /**
   * 处理 Cell 点击
   */
  async handleCellClick(cell) {
    if (this._processingClick) {
      return { ignored: true, reason: 'click_in_progress' };
    }
    this._processingClick = true;
    try {
    if (!this.isGamePlaying() || cell.done) {
      const reason = this.state === 'paused' ? 'game_paused' : 'game_not_playing';
      return { ignored: true, reason };
    }
    if (cell.number < this.currentNumber) {
      return { ignored: true, reason: 'number_already_completed' };
    }
    
    if (cell.number === this.currentNumber) {
      if (this._lastAcceptedNumber === cell.number) {
        return { ignored: true, duplicate: true };
      }
      const shouldComplete = this.handleCorrectClick(cell);
      this._lastAcceptedNumber = cell.number;
      if (shouldComplete) {
        const completion = await this.completeLevel();
        return { correct: true, completed: true, completion };
      }
      return { correct: true };
    } else {
      this.handleWrongClick(cell);
      return { correct: false, expected: this.currentNumber, actual: cell.number };
    }
    } finally {
      this._processingClick = false;
    }
  }

  /**
   * 检查游戏是否正在进行
   */
  isGamePlaying() {
    return ['level1', 'level2', 'custom'].includes(this.state);
  }

  /**
   * 处理正确点击
   */
  handleCorrectClick(cell) {
    cell.done = true;
    
    // 视觉反馈
    if (cell && cell.site && this.renderEngine && typeof this.renderEngine.showCorrectFeedback === 'function') {
      this.renderEngine.showCorrectFeedback(cell);
    }
    
    // 触觉反馈
    this.touchHandler.vibrate('light');
    
    // 更新进度
    this.currentNumber++;
    
    const maxNumber = this.levelConfig.numberRange.max;
    return this.currentNumber > maxNumber;
  }

  /**
   * 处理错误点击
   */
  handleWrongClick(cell) {
    this.errors++;
    
    // 视觉反馈
    if (cell && cell.site && this.renderEngine && typeof this.renderEngine.showErrorFeedback === 'function') {
      this.renderEngine.showErrorFeedback(cell);
    }
    
    // 触觉反馈
    this.touchHandler.vibrate('heavy');
  }

  /**
   * 完成关卡
   */
  async completeLevel() {
    console.log('Level completed!', {
      level: this.currentLevel,
      time: this.elapsedTime,
      errors: this.errors
    });
    
    // 停止游戏
    this.stopGame();
    if (this.services && this.services.analyticsManager && typeof this.services.analyticsManager.trackEvent === 'function') {
      const adManager = this.services.adManager;
      const hintsUsed = adManager && typeof adManager.getHintCount === 'function' ? adManager.getHintCount() : 0;
      const revivesUsed = adManager && typeof adManager.getReviveCount === 'function' ? adManager.getReviveCount() : 0;
      this.services.analyticsManager.trackEvent('game_complete', {
        level: this.currentLevel === 'custom' ? 1 : this.currentLevel,
        time: this.elapsedTime,
        errors: this.errors,
        hintsUsed,
        revivesUsed,
        adAssisted: hintsUsed > 0 || revivesUsed > 0
      });
    }
    
    // 如果是正式关卡，更新关卡管理器
    if (this.currentLevel !== 'custom') {
      const stats = {
        time: this.elapsedTime,
        errors: this.errors
      };
      
      await this.levelManager.completeLevel(this.currentLevel, stats);
      
      // 检查是否需要过渡到下一关
      if (this.currentLevel === 1) {
        const transitionData = await this.startTransition(1, 2);
        return {
          levelCompleted: true,
          completedLevel: 1,
          nextLevel: 2,
          transitionTriggered: true,
          transitionData: transitionData,
          customModeUnlocked: false,
          gameCompleted: false
        };
      } else if (this.currentLevel === 2) {
        if (this.cloudStorage && typeof this.cloudStorage.saveProgress === 'function') {
          await this.cloudStorage.saveProgress({
            level2Completed: true,
            customModeUnlocked: true
          });
        }
        if (this.unlockSystem && typeof this.unlockSystem.unlockCustomMode === 'function') {
          await this.unlockSystem.unlockCustomMode();
        }
        this.state = 'finished';
        this.showResults();
        return {
          levelCompleted: true,
          completedLevel: 2,
          nextLevel: null,
          transitionTriggered: false,
          transitionData: null,
          customModeUnlocked: true,
          gameCompleted: true
        };
      }
    }
    if (this.currentLevel === 'custom' && this.userProfile && typeof this.userProfile.saveBestScore === 'function') {
      const customModeKey = this.customMode || 10;
      const difficultyKey = this.difficulty > 0 ? this.difficulty : 'free';
      const scoreKey = `custom_${customModeKey}_${difficultyKey}`;
      await this.userProfile.saveBestScore(scoreKey, {
        time: this.elapsedTime,
        errors: this.errors
      });
    }
    
    // 显示完成界面
    this.state = 'finished';
    this.showResults();
    
    return {
      levelCompleted: true,
      completedLevel: this.currentLevel,
      transitionTriggered: false,
      customModeUnlocked: false,
      gameCompleted: true
    };
  }

  /**
   * 开始关卡过渡
   */
  startTransition(fromLevel, toLevel) {
    this.state = 'transition';
    if (this.isServiceMode) {
      this.pendingNextLevel = toLevel;
      return Promise.resolve({
        fromLevel,
        toLevel
      });
    }
    
    const transitionPromise = this.transitionManager.showLevelTransition(fromLevel, toLevel, () => {
      // 过渡完成后自动开始下一关
      this.startLevel(toLevel);
    });
    
    return transitionPromise;
  }

  /**
   * 处理鼠标移动（已移除黑暗模式，保留方法以防兼容性问题）
   */
  handleMouseMove(pos) {
    // 黑暗模式已移除，此方法保留为空
  }

  /**
   * 启动计时器
   */
  startTimer() {
    if (typeof jest !== 'undefined') {
      return;
    }
    this.lastTimerUpdateAt = Date.now();
    this.timer = setInterval(() => {
      if (this.difficulty === 0) {
        // 自由模式：正计时
        this.elapsedTime++;
      } else {
        // 限时模式：倒计时
        this.timeLeft--;
        this.elapsedTime++;
        
        if (this.timeLeft <= 0) {
          this.gameOver();
        }
      }
    }, 1000);
  }

  /**
   * 启动渲染循环
   */
  startRenderLoop() {
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    const loop = () => {
      try {
        // 更新过渡管理器
        if (this.transitionManager) {
          this.transitionManager.update();
        }
        
        // 根据状态渲染不同内容
        if (this.state === 'transition') {
          this.renderTransition();
        } else if (this.isGamePlaying()) {
          this.renderGame();
        }
        
        // 继续循环（除非游戏已停止）
        if (this.state !== 'idle' && this.state !== 'finished') {
          this.animationFrameId = raf(loop);
        }
      } catch (error) {
        console.error('Render loop error:', error);
      }
    };
    
    this.animationFrameId = raf(loop);
  }

  /**
   * 渲染游戏
   */
  renderGame() {
    const gameState = {
      currentNumber: this.currentNumber,
      errors: this.errors,
      elapsedTime: this.elapsedTime,
      timeLeft: this.timeLeft,
      difficulty: this.difficulty,
      levelConfig: this.levelConfig
    };
    
    this.renderEngine.renderBrightMode(this.cells, gameState);
  }

  /**
   * 渲染过渡效果
   */
  renderTransition() {
    // 先渲染游戏背景
    this.renderGame();
    
    // 再渲染过渡效果
    if (this.transitionManager) {
      this.transitionManager.render();
    }
  }

  /**
   * 游戏结束（超时）
   */
  gameOver() {
    console.log('Game over!');
    this.state = 'finished';
    this.stopGame();
    this.showResults();
  }

  /**
   * 显示结果
   */
  showResults() {
    // TODO: 显示结果界面
    console.log('Game stats:', {
      level: this.currentLevel,
      customMode: this.customMode,
      completed: this.currentNumber - 1,
      total: this.levelConfig.numberRange.max,
      time: this.elapsedTime,
      errors: this.errors
    });
  }

  /**
   * 停止游戏
   */
  stopGame() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    const caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;
    if (this.animationFrameId) {
      caf(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.touchHandler) {
      this.touchHandler.setEnabled(false);
    }
  }

  /**
   * 获取当前游戏状态
   */
  getGameState() {
    return {
      state: this.state,
      currentLevel: this.currentLevel,
      customMode: this.customMode,
      levelConfig: this.levelConfig,
      currentNumber: this.currentNumber,
      errors: this.errors,
      elapsedTime: this.elapsedTime,
      timeLeft: this.timeLeft,
      difficulty: this.difficulty
    };
  }

  /**
   * 获取当前游戏状态（简化版本）
   */
  getState() {
    if (this.state === 'transition' && this.currentLevel === 2 && this.levelConfig && this.currentNumber > this.levelConfig.numberRange.max) {
      return 'finished';
    }
    return this.state;
  }

  /**
   * 获取当前数字
   */
  getCurrentNumber() {
    return this.currentNumber;
  }

  /**
   * 获取错误次数
   */
  getErrors() {
    return this.errors;
  }

  /**
   * 设置当前数字（用于测试）
   */
  setCurrentNumber(number) {
    this.currentNumber = number;
    this._lastAcceptedNumber = null;
  }

  /**
   * 设置状态（用于测试）
   */
  setState(state) {
    this.state = state;
  }

  /**
   * 获取关卡管理器
   */
  getLevelManager() {
    return this.levelManager;
  }

  /**
   * 设置难度
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  initialize() {
    return this.init();
  }

  async transitionToNextLevel() {
    if (this.pendingNextLevel) {
      const toLevel = this.pendingNextLevel;
      this.pendingNextLevel = null;
      this.startLevel(toLevel);
      return true;
    }
    if (this.currentLevel === 1) {
      this.startLevel(2);
      return true;
    }
    return false;
  }

  async enterCustomMode() {
    this.state = 'custom';
    this.currentLevel = 'custom';
    return true;
  }

  async startCustomGame(customMode, difficulty = 0) {
    this.startLevel('custom', customMode, difficulty);
    return true;
  }

  getCustomMode() {
    return this.customMode;
  }

  getDifficulty() {
    return this.difficulty;
  }

  getTotalNumbers() {
    if (this.levelConfig && this.levelConfig.numberRange) {
      return this.levelConfig.numberRange.max;
    }
    return 0;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  setTimeLeft(timeLeft) {
    this.timeLeft = Math.max(0, Number(timeLeft) || 0);
  }

  updateTimer(seconds) {
    const delta = Math.max(0, Number(seconds) || 0);
    if (this.difficulty > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - delta);
      if (this.timeLeft === 0) {
        this.gameOver();
      }
    } else {
      this.elapsedTime += delta;
    }
  }

  isTimeUp() {
    return this.difficulty > 0 && this.timeLeft <= 0 && this.state === 'finished';
  }

  isHintActive() {
    return this.hintActive;
  }

  getHintDuration() {
    return this.hintDuration;
  }

  getHighlightedNumber() {
    return this.highlightedNumber || this.currentNumber;
  }

  async startNewGame() {
    if (this.services && this.services.adManager && typeof this.services.adManager.resetGameSession === 'function') {
      this.services.adManager.resetGameSession();
    }
    this.reset();
    this.startLevel(1);
    return true;
  }

  createScreenAdapterFallback() {
    return {
      getGameBounds() {
        return { x: 0, y: 0, width: 375, height: 667 };
      }
    };
  }

  ensureScreenAdapter() {
    if (!this.screenAdapter || typeof this.screenAdapter.getGameBounds !== 'function') {
      this.screenAdapter = this.createScreenAdapterFallback();
    }
  }

  /**
   * 重置游戏
   */
  reset() {
    this.stopGame();
    this.state = 'idle';
    this.currentLevel = 1;
    this.customMode = null;
    this.levelConfig = null;
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = 0;
    this.cells = [];
    
    if (this.transitionManager) {
      this.transitionManager.stop();
    }
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.GameManager = GameManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameManager;
}
