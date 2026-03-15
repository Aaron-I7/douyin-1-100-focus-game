/**
 * 游戏管理器
 * 负责游戏状态管理、游戏循环和核心逻辑
 */

class GameManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    
    // 游戏状态
    this.state = 'idle';  // idle | playing | paused | finished
    this.mode = 'bright'; // bright | dark
    this.difficulty = 180; // 0=自由, 60/120/180=限时（秒）
    
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
    
    // 鼠标位置（用于黑暗模式）
    this.mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
    
    // 模块
    this.voronoiGenerator = null;
    this.gridGenerator = null;
    this.renderEngine = null;
    this.touchHandler = null;
  }

  /**
   * 初始化游戏
   */
  async init() {
    console.log('Initializing GameManager...');
    
    try {
      // 初始化 Voronoi 生成器
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
      this.renderEngine.initHDCanvas();
      
      console.log('GameManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize GameManager:', error);
      return false;
    }
  }

  /**
   * 开始游戏
   */
  startGame() {
    console.log('Starting game...', { mode: this.mode, difficulty: this.difficulty });
    
    // 重置游戏状态
    this.state = 'playing';
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    
    // 生成 Voronoi 图（带重试机制）
    this.cells = this.generateVoronoiWithRetry(3);
    
    // 调整 Cell 位置到游戏区域
    const bounds = this.screenAdapter.getGameBounds();
    for (const cell of this.cells) {
      cell.site.y += bounds.y;
      for (const point of cell.polygon) {
        point.y += bounds.y;
      }
    }
    
    // 初始化触摸处理器
    if (!this.touchHandler) {
      this.touchHandler = new TouchHandler(this.canvas, this.cells);
      this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
      this.touchHandler.onMouseMove = (pos) => this.handleMouseMove(pos);
    } else {
      this.touchHandler.updateCells(this.cells);
    }
    
    // 启动计时器
    this.startTimer();
    
    // 启动渲染循环
    this.startRenderLoop();
    
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
        if (cells.length !== 100) {
          throw new Error(`Invalid cell count: ${cells.length}`);
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
  handleCellClick(cell) {
    if (this.state !== 'playing' || cell.done) return;
    
    if (cell.number === this.currentNumber) {
      // 正确点击
      this.handleCorrectClick(cell);
    } else {
      // 错误点击
      this.handleWrongClick(cell);
    }
  }

  /**
   * 处理正确点击
   */
  handleCorrectClick(cell) {
    cell.done = true;
    
    // 视觉反馈
    this.renderEngine.showCorrectFeedback(cell, this.mode);
    
    // 触觉反馈
    this.touchHandler.vibrate('light');
    
    // 更新进度
    this.currentNumber++;
    
    if (this.currentNumber > 100) {
      this.winGame();
    }
  }

  /**
   * 处理错误点击
   */
  handleWrongClick(cell) {
    this.errors++;
    
    // 视觉反馈
    this.renderEngine.showErrorFeedback(cell, this.mode);
    
    // 触觉反馈
    this.touchHandler.vibrate('heavy');
  }

  /**
   * 处理鼠标移动（黑暗模式）
   */
  handleMouseMove(pos) {
    this.mousePos = pos;
  }

  /**
   * 启动计时器
   */
  startTimer() {
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
    const loop = () => {
      if (this.state !== 'playing') return;
      
      try {
        const gameState = {
          mode: this.mode,
          difficulty: this.difficulty,
          currentNumber: this.currentNumber,
          errors: this.errors,
          elapsedTime: this.elapsedTime,
          timeLeft: this.timeLeft
        };
        
        if (this.mode === 'bright') {
          this.renderEngine.renderBrightMode(this.cells, gameState);
        } else {
          this.renderEngine.renderDarkMode(this.cells, gameState, this.mousePos);
        }
        
        this.animationFrameId = requestAnimationFrame(loop);
      } catch (error) {
        console.error('Render loop error:', error);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * 游戏胜利
   */
  winGame() {
    console.log('Game won!');
    this.state = 'finished';
    this.stopGame();
    
    // TODO: 显示结果界面
    console.log('Game stats:', {
      time: this.elapsedTime,
      errors: this.errors
    });
  }

  /**
   * 游戏结束（超时）
   */
  gameOver() {
    console.log('Game over!');
    this.state = 'finished';
    this.stopGame();
    
    // TODO: 显示结果界面
    console.log('Game stats:', {
      completed: this.currentNumber - 1,
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
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.touchHandler) {
      this.touchHandler.setEnabled(false);
    }
  }

  /**
   * 设置游戏模式
   */
  setMode(mode) {
    this.mode = mode;
  }

  /**
   * 设置难度
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.GameManager = GameManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameManager;
}
