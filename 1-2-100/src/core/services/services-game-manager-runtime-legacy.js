const gameRuntimeMethods = {
  startGame() {
    console.log('Starting game...', { mode: this.mode, difficulty: this.difficulty });
    this.state = 'playing';
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    const currentLevelConfig = this.levelManager.getCurrentLevelConfig();
    const cellCount = currentLevelConfig.cellCount;
    this.totalNumbers = cellCount;
    this.voronoiGenerator.numSites = cellCount;
    this.gridGenerator.numCells = cellCount;
    this.cells = this.generateVoronoiWithRetry(3);
    const bounds = this.screenAdapter.getGameBounds();
    for (const cell of this.cells) {
      cell.site.y += bounds.y;
      for (const point of cell.polygon) {
        point.y += bounds.y;
      }
    }
    this.renderEngine.initHDCanvas();
    this.touchHandler.updateCells(this.cells);
    this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
    this.touchHandler.setEnabled(true);
    this.startTimer();
    this.startRenderLoop();
    console.log(`Game started successfully - Level ${currentLevelConfig.id} (${cellCount} cells)`);
  },

  startCustomGame() {
    console.log('Starting custom game...', {
      customMode: this.selectedCustomMode,
      difficulty: this.difficulty
    });
    if (!this.selectedCustomMode) {
      console.error('selectedCustomMode is not set!');
      return;
    }
    this.state = 'playing';
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    const cellCount = this.selectedCustomMode;
    this.totalNumbers = cellCount;
    this.voronoiGenerator.numSites = cellCount;
    this.gridGenerator.numCells = cellCount;
    this.cells = this.generateVoronoiWithRetry(3);
    const bounds = this.screenAdapter.getGameBounds();
    for (const cell of this.cells) {
      cell.site.y += bounds.y;
      for (const point of cell.polygon) {
        point.y += bounds.y;
      }
    }
    this.renderEngine.initHDCanvas();
    this.touchHandler.updateCells(this.cells);
    this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
    this.touchHandler.setEnabled(true);
    this.startTimer();
    this.startRenderLoop();
    console.log(`Custom game started successfully - ${cellCount} cells, difficulty: ${this.difficulty}s`);
  },

  generateVoronoiWithRetry(maxRetries) {
    const expectedCellCount = this.voronoiGenerator.numSites;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Voronoi generation attempt ${attempt}/${maxRetries} for ${expectedCellCount} cells`);
        const cells = this.voronoiGenerator.generate();
        if (cells.length !== expectedCellCount) {
          throw new Error(`Invalid cell count: ${cells.length}, expected: ${expectedCellCount}`);
        }
        console.log('Voronoi generation successful');
        return cells;
      } catch (error) {
        console.warn(`Voronoi generation attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.error('All Voronoi generation attempts failed, using grid fallback');
          return this.gridGenerator.generate();
        }
        this.voronoiGenerator.randomSeed = Date.now() + attempt;
      }
    }
  },

  handleCellClick(cell) {
    if (this.state !== 'playing' || cell.done) return;
    if (cell.number === this.currentNumber) {
      this.handleCorrectClick(cell);
    } else {
      this.handleWrongClick(cell);
    }
  },

  handleCorrectClick(cell) {
    cell.done = true;
    this.renderEngine.showCorrectFeedback(cell, this.mode);
    this.touchHandler.vibrate('light');
    this.currentNumber++;
    let totalCells;
    if (this.selectedCustomMode) {
      totalCells = this.selectedCustomMode;
    } else {
      const currentLevelConfig = this.levelManager.getCurrentLevelConfig();
      totalCells = currentLevelConfig.cellCount;
    }
    if (this.currentNumber > totalCells) {
      this.winGame();
    }
  },

  handleWrongClick(cell) {
    this.errors++;
    this.renderEngine.showErrorFeedback(cell, this.mode);
    this.touchHandler.vibrate('heavy');
  },

  startTimer() {
    this.timer = setInterval(() => {
      if (this.difficulty === 0) {
        this.elapsedTime++;
      } else {
        this.timeLeft--;
        this.elapsedTime++;
        if (this.timeLeft <= 0) {
          this.gameOver();
        }
      }
    }, 1000);
  },

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
          timeLeft: this.timeLeft,
          totalNumbers: this.totalNumbers || 100
        };
        this.renderEngine.renderBrightMode(this.cells, gameState);
        this.animationFrameId = requestAnimationFrame(loop);
      } catch (error) {
        console.error('Render loop error:', error);
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  startTransitionRenderLoop() {
    const loop = () => {
      if (this.state !== 'transition') return;
      try {
        this.transitionManager.update();
        this.transitionManager.render();
        if (this.transitionManager.isActive()) {
          this.animationFrameId = requestAnimationFrame(loop);
        }
      } catch (error) {
        console.error('Transition render loop error:', error);
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  },

  winGame() {
    console.log('Game won!');
    this.stopGame();
    const isCustomMode = this.selectedCustomMode !== null;
    const currentLevel = isCustomMode ? null : this.levelManager.currentLevel;
    const stats = { time: this.elapsedTime, errors: this.errors };
    if (!isCustomMode) {
      this.levelManager.completeLevel(currentLevel, stats);
    }
    if (isCustomMode) {
      const customLevel = `custom_${this.selectedCustomMode}`;
      this.updateUserProgressAndSaveScore(customLevel, stats);
    } else {
      this.updateUserProgressAndSaveScore(currentLevel, stats);
    }
    if (!isCustomMode && currentLevel === 1) {
      console.log('Level 1 completed, starting transition to level 2');
      this.state = 'transition';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.transitionManager.showLevelTransition(1, 2, () => {
        console.log('Transition completed, starting level 2');
        this.levelManager.setCurrentLevel(2);
        this.showLevelIntroduction(2);
      });
      this.startTransitionRenderLoop();
    } else if (!isCustomMode && currentLevel === 2) {
      console.log('Level 2 completed, showing completion screen with unlock notification');
      this.state = 'menu';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      const resultStats = {
        completed: this.levelManager.getCurrentLevelConfig().cellCount,
        time: this.elapsedTime,
        errors: this.errors,
        level: currentLevel,
        levelName: this.levelManager.getCurrentLevelConfig().name,
        customModeUnlocked: true
      };
      this.uiManager.render('level2Complete', resultStats);
      console.log('Level 2 completion stats:', resultStats);
    } else {
      this.state = 'menu';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      const resultStats = {
        completed: isCustomMode ? this.selectedCustomMode : this.levelManager.getCurrentLevelConfig().cellCount,
        time: this.elapsedTime,
        errors: this.errors,
        level: isCustomMode ? `custom_${this.selectedCustomMode}` : currentLevel,
        levelName: isCustomMode ? `自选模式 (1-${this.selectedCustomMode})` : this.levelManager.getCurrentLevelConfig().name,
        customMode: isCustomMode ? String(this.selectedCustomMode) : null,
        difficulty: this.difficulty
      };
      this.lastResultSettings = {
        level: currentLevel,
        customMode: isCustomMode ? this.selectedCustomMode : null,
        difficulty: this.difficulty
      };
      this.uiManager.render('result', resultStats);
      console.log('Game stats:', resultStats);
    }
  },

  async updateUserProgressAndSaveScore(level, stats) {
    try {
      if (!this.userProfileManager || !this.userProfileManager.isLoaded) {
        console.warn('UserProfileManager not available, skipping progress update');
        return;
      }
      console.log(`Updating progress for level ${level}:`, stats);
      if (level === 1 || level === 2) {
        const progressUpdate = {};
        if (level === 1) {
          progressUpdate.level1Completed = true;
          progressUpdate.currentLevel = 2;
        } else if (level === 2) {
          progressUpdate.level2Completed = true;
          progressUpdate.customModeUnlocked = true;
        }
        const progressResult = await this.userProfileManager.updateProgress(progressUpdate);
        if (progressResult) {
          console.log('Progress updated successfully');
        } else {
          console.warn('Failed to update progress');
        }
      }
      let levelKey;
      if (level === 1) {
        levelKey = 'level1';
      } else if (level === 2) {
        levelKey = 'level2';
      } else if (typeof level === 'string' && level.startsWith('custom_')) {
        levelKey = level;
      } else {
        console.warn(`Unknown level type: ${level}`);
        return;
      }
      const scoreData = {
        level: levelKey,
        difficulty: this.difficulty || 0,
        time: stats.time,
        errors: stats.errors
      };
      const scoreResult = await this.userProfileManager.saveBestScore(scoreData);
      if (scoreResult.success) {
        if (scoreResult.isNewRecord) {
          console.log('New record saved!', scoreResult.scoreRecord);
        } else {
          console.log('Score saved but not a new record');
        }
      } else {
        console.warn('Failed to save score:', scoreResult.error);
      }
      await this.userProfileManager.addGameStats({
        games: 1,
        errors: stats.errors
      });
    } catch (error) {
      console.error('Error updating user progress and saving score:', error);
    }
  },

  gameOver() {
    console.log('Game over!');
    this.state = 'menu';
    this.stopGame();
    this.saveGameStatistics();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    const stats = {
      completed: this.currentNumber - 1,
      time: this.elapsedTime,
      errors: this.errors,
      level: this.levelManager ? this.levelManager.currentLevel : 1,
      customMode: this.selectedCustomMode ? String(this.selectedCustomMode) : null,
      difficulty: this.difficulty
    };
    this.lastResultSettings = {
      level: stats.level,
      customMode: this.selectedCustomMode || null,
      difficulty: this.difficulty
    };
    this.uiManager.render('result', stats);
    console.log('Game stats:', stats);
  },

  async saveGameStatistics() {
    try {
      if (!this.userProfileManager || !this.userProfileManager.isLoaded) {
        console.warn('UserProfileManager not available, skipping statistics save');
        return;
      }
      await this.userProfileManager.addGameStats({
        games: 1,
        errors: this.errors
      });
      console.log('Game statistics saved');
    } catch (error) {
      console.error('Error saving game statistics:', error);
    }
  },

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
  },

  setMode(mode) {
    this.mode = mode;
  },

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  },

  async handleShareScore() {
    try {
      console.log('开始分享成绩...');
      const scoreData = {
        level: this.currentLevel || 1,
        time: this.elapsedTime || 0,
        errors: this.errors || 0,
        completed: this.currentNumber - 1,
        totalNumbers: this.totalNumbers || 10
      };
      console.log('分享数据:', scoreData);
      const shareSuccess = await this.shareManager.shareScore(scoreData);
      if (shareSuccess) {
        console.log('分享成功');
        this.showShareSuccessMessage();
      } else {
        console.log('分享失败或取消');
      }
    } catch (error) {
      console.error('分享过程中发生错误:', error);
    }
  },

  showShareSuccessMessage() {
    const message = '分享成功！';
    const duration = 2000;
    console.log(message);
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4CAF50';
    ctx.font = `bold ${Math.floor(w * 0.06)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, w / 2, h / 2);
    ctx.restore();
    setTimeout(() => {
      if (this.state === 'menu') {
        const stats = {
          level: this.currentLevel,
          time: this.elapsedTime,
          errors: this.errors,
          completed: this.currentNumber - 1,
          totalNumbers: this.totalNumbers
        };
        this.uiManager.render('result', stats);
      }
    }, duration);
  }
};

module.exports = { gameRuntimeMethods };
