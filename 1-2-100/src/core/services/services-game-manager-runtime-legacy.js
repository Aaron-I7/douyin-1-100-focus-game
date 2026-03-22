const gameRuntimeMethods = {
  generateTraceId(prefix = 'trace') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  getCurrentRunMode() {
    return this.selectedNormalMode || this.gameplayMode || this.gameplayModes.SIMPLE;
  },

  async callCloudFunction(name, data = {}) {
    if (!this.cloudEnabled || typeof tt === 'undefined') {
      return null;
    }
    const cloudApi = this.cloudClient && typeof this.cloudClient.callContainer === 'function'
      ? this.cloudClient
      : (tt.cloud && typeof tt.cloud.callContainer === 'function' ? tt.cloud : null);
    if (!cloudApi) {
      return null;
    }
    try {
      const response = await new Promise((resolve, reject) => {
        cloudApi.callContainer({
          path: `/${name}`,
          init: {
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            body: data,
            timeout: 60000
          },
          success: resolve,
          fail: reject
        });
      });
      let result = response;
      if (response && response.data) {
        const rawData = response.data;
        if (typeof rawData === 'string') {
          try {
            result = JSON.parse(rawData);
          } catch (e) {
            result = rawData;
          }
        } else {
          result = rawData;
        }
      }
      return result;
    } catch (error) {
      console.warn(`[Cloud] ${name} failed:`, error);
      return null;
    }
  },

  normalizeDailyState(raw = {}) {
    const freeTotal = 3;
    const freeUsed = Number(raw.freeUsed || 0);
    const passedToday = !!raw.passedToday;
    const freeLeftRaw = Number(raw.freeLeft);
    const freeLeft = Number.isFinite(freeLeftRaw)
      ? Math.max(0, Math.min(freeTotal, freeLeftRaw))
      : Math.max(0, freeTotal - freeUsed);
    const canStart = typeof raw.canStart === 'boolean'
      ? raw.canStart
      : (!passedToday && freeLeft > 0);
    return {
      freeTotal,
      freeUsed: Math.max(0, Math.min(freeTotal, freeUsed)),
      freeLeft,
      passedToday,
      canStart
    };
  },

  applyDailyState(raw = {}) {
    const nextState = this.normalizeDailyState(raw);
    this.dailyChallengeState = {
      ...this.dailyChallengeState,
      ...nextState
    };
    this.homeStats = {
      ...this.homeStats,
      freePlayLeft: nextState.freeLeft
    };
    return this.dailyChallengeState;
  },

  async ensureOpenId() {
    if (this.openId) {
      return this.openId;
    }
    const result = await this.callCloudFunction('get_open_id', {});
    const remoteOpenId = result && (result.openId || result.data || result.result);
    this.openId = remoteOpenId || this.userId || this.generateTraceId('local_openid');
    return this.openId;
  },

  async refreshDailyChallengeState() {
    const openId = await this.ensureOpenId();
    const result = await this.callCloudFunction('get_daily_status', { openId });
    if (result && result.data) {
      this.applyDailyState(result.data);
      return this.dailyChallengeState;
    }
    return this.dailyChallengeState;
  },

  async refreshHomeStats() {
    const openId = await this.ensureOpenId();
    const result = await this.callCloudFunction('get_home_stats', { openId });
    const data = result && result.data ? result.data : null;
    if (!data) {
      return this.homeStats;
    }
    this.homeStats = {
      ...this.homeStats,
      challengeCount: Number(data.challengeCount || this.homeStats.challengeCount || 0),
      todayPassCount: Number(data.todayPassCount || this.homeStats.todayPassCount || 0),
      freePlayLeft: Number.isFinite(Number(data.freePlayLeft))
        ? Number(data.freePlayLeft)
        : this.homeStats.freePlayLeft
    };
    return this.homeStats;
  },

  normalizeLeaderboardItems(items = []) {
    const formatCount = (value) => `${Number(value || 0).toLocaleString()} users`;
    return (items || []).map((item, index) => ({
      rank: Number(item.rank || index + 1),
      name: item.province || item.name || '--',
      count: typeof item.count === 'string' ? item.count : formatCount(item.count || item.passedCount || 0),
      color: item.color || (index === 0 ? '#fcd34d' : index === 1 ? '#d4d4d8' : '#fdba74')
    }));
  },

  async refreshLeaderboardByMode(mode) {
    const normalizedMode = mode || this.leaderboardMode || this.getCurrentRunMode();
    const result = await this.callCloudFunction('get_province_leaderboard', { mode: normalizedMode });
    if (!result || !result.data) {
      return this.remoteLeaderboardByMode;
    }
    const data = result.data;
    if (Array.isArray(data)) {
      this.remoteLeaderboardByMode = {
        ...(this.remoteLeaderboardByMode || {}),
        [normalizedMode]: this.normalizeLeaderboardItems(data)
      };
      return this.remoteLeaderboardByMode;
    }
    const next = {
      ...(this.remoteLeaderboardByMode || {})
    };
    ['simple', 'hard', 'hell'].forEach((m) => {
      if (Array.isArray(data[m])) {
        next[m] = this.normalizeLeaderboardItems(data[m]);
      }
    });
    this.remoteLeaderboardByMode = next;
    return this.remoteLeaderboardByMode;
  },

  async refreshHomeRemoteData() {
    await Promise.all([
      this.refreshDailyChallengeState(),
      this.refreshHomeStats(),
      this.refreshLeaderboardByMode(this.leaderboardMode || this.getCurrentRunMode())
    ]);
    return {
      dailyChallengeState: this.dailyChallengeState,
      homeStats: this.homeStats,
      leaderboardByMode: this.remoteLeaderboardByMode
    };
  },

  startLevel(level, customMode = null, difficulty = 0) {
    console.log('Starting level via startLevel...', { level, customMode, difficulty });
    
    // Update Level Manager if available
    if (this.levelManager && level !== 'custom' && typeof this.levelManager.setCurrentLevel === 'function') {
      this.levelManager.setCurrentLevel(level);
    }

    // Set internal state
    this.currentLevel = level;
    this.selectedCustomMode = customMode;
    this.difficulty = difficulty;
    
    // Route to appropriate start method
    if (level === 'custom') {
       this.startCustomGame();
    } else {
       this.startGame();
    }
  },

  async startGame(options = {}) {
    const { skipModeSelection = false } = options;
    console.log('Starting game...', { mode: this.mode, difficulty: this.difficulty });
    const currentLevelConfig = this.levelManager.getCurrentLevelConfig();
    const needsModeSelection = this.shouldEnable100ModeSelection(currentLevelConfig.cellCount)
      && !this.modeSelectionConfirmedForRun;
    if (!skipModeSelection && needsModeSelection) {
      this.show100ModeSelectScreen({
        target: 'normal',
        returnScreen: 'start'
      });
      return;
    }
    const canStart = await this.startDailyRoundForCurrentLevel(currentLevelConfig.id);
    if (!canStart) {
      this.state = 'menu';
      this.showMenu();
      return;
    }
    this.state = 'playing';
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    this.isExitConfirmPending = false;
    this.isReviveFlowActive = false;
    this.isTimeExpiredHandling = false;
    const cellCount = currentLevelConfig.cellCount;
    this.totalNumbers = cellCount;
    this.applyGameplayModeForCurrentRound(cellCount);
    const layoutBounds = this.getPlayableLayoutBounds();
    this.voronoiGenerator.width = layoutBounds.width;
    this.voronoiGenerator.height = layoutBounds.height;
    this.voronoiGenerator.numSites = cellCount;
    this.gridGenerator.width = layoutBounds.width;
    this.gridGenerator.height = layoutBounds.height;
    this.gridGenerator.numCells = cellCount;
    this.cells = this.generateStructuredGridCells();
    for (const cell of this.cells) {
      cell.site.x += layoutBounds.x;
      cell.site.y += layoutBounds.y;
      for (const point of cell.polygon) {
        point.x += layoutBounds.x;
        point.y += layoutBounds.y;
      }
    }
    this.renderEngine.initHDCanvas();
    this.touchHandler.updateCells(this.cells);
    this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
    this.touchHandler.onCanvasClick = (pos) => this.handleGameCanvasClick(pos);
    this.touchHandler.setEnabled(true);
    this.startTimer();
    this.startRenderLoop();
    console.log(`Game started successfully - Level ${currentLevelConfig.id} (${cellCount} cells)`);
  },

  async startDailyRoundForCurrentLevel(roundNo) {
    if (this.selectedCustomMode !== null && this.selectedCustomMode !== undefined) {
      return true;
    }
    if (Number(roundNo) !== 1) {
      return true;
    }
    const mode = this.getCurrentRunMode();
    const openId = await this.ensureOpenId();
    await this.refreshDailyChallengeState();
    if (!this.dailyChallengeState.canStart) {
      if (typeof tt !== 'undefined' && tt.showToast) {
        tt.showToast({
          title: this.dailyChallengeState.passedToday ? '今日已通关，明日再会!' : '今日次数已用完',
          icon: 'none'
        });
      }
      return false;
    }
    const result = await this.callCloudFunction('start_game_session', { openId, mode });
    console.log('[Cloud] start_game_session result:', JSON.stringify(result));
    const data = result && result.data ? result.data : result;
    const failed = !data || (result && result.success === false) || data.allowed === false || data.success === false;
    if (failed) {
      console.log('[Cloud] start_game_session failed, data:', JSON.stringify(data), 'result:', JSON.stringify(result));
      if (data && typeof data === 'object') {
        this.applyDailyState(data);
      }
      if (typeof tt !== 'undefined' && tt.showToast) {
        const message = (result && result.message) || (data && (data.message || data.code));
        tt.showToast({
          title: message ? String(message) : '开局失败，请稍后重试',
          icon: 'none'
        });
      }
      return false;
    }
    this.activeDailySession = {
      sessionId: data.sessionId || this.generateTraceId('gs_local'),
      openId,
      mode,
      reviveUsed: Number(data.reviveUsed || 0),
      status: 'active'
    };
    this.applyDailyState(data);
    return true;
  },

  startCustomGame(options = {}) {
    const { skipModeSelection = false } = options;
    console.log('Starting custom game...', {
      customMode: this.selectedCustomMode,
      difficulty: this.difficulty
    });
    if (!this.selectedCustomMode) {
      console.error('selectedCustomMode is not set!');
      return;
    }
    if (!skipModeSelection && this.shouldEnable100ModeSelection(this.selectedCustomMode)) {
      this.show100ModeSelectScreen({
        target: 'custom',
        returnScreen: 'customModeSelect'
      });
      return;
    }
    this.state = 'playing';
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = this.difficulty;
    this.isExitConfirmPending = false;
    const cellCount = this.selectedCustomMode;
    this.totalNumbers = cellCount;
    this.applyGameplayModeForCurrentRound(cellCount);
    const layoutBounds = this.getPlayableLayoutBounds();
    this.voronoiGenerator.width = layoutBounds.width;
    this.voronoiGenerator.height = layoutBounds.height;
    this.voronoiGenerator.numSites = cellCount;
    this.gridGenerator.width = layoutBounds.width;
    this.gridGenerator.height = layoutBounds.height;
    this.gridGenerator.numCells = cellCount;
    this.cells = this.generateStructuredGridCells();
    for (const cell of this.cells) {
      cell.site.x += layoutBounds.x;
      cell.site.y += layoutBounds.y;
      for (const point of cell.polygon) {
        point.x += layoutBounds.x;
        point.y += layoutBounds.y;
      }
    }
    this.renderEngine.initHDCanvas();
    this.touchHandler.updateCells(this.cells);
    this.touchHandler.onCellClick = (cell) => this.handleCellClick(cell);
    this.touchHandler.onCanvasClick = (pos) => this.handleGameCanvasClick(pos);
    this.touchHandler.setEnabled(true);
    this.startTimer();
    this.startRenderLoop();
    console.log(`Custom game started successfully - ${cellCount} cells, difficulty: ${this.difficulty}s`);
  },

  handleGameCanvasClick(pos) {
    if (this.state !== 'playing' && this.state !== 'paused') return false;
    if (!this.isExitButtonHit(pos)) {
      return false;
    }
    this.requestExitConfirmation();
    return true;
  },

  isExitButtonHit(pos) {
    const safeTop = this.screenAdapter && this.screenAdapter.safeArea && typeof this.screenAdapter.safeArea.top === 'number'
      ? this.screenAdapter.safeArea.top
      : 20;
    const exitX = 16;
    const exitY = safeTop + 12;
    const exitSize = 32;
    const padding = 30;
    return pos.x >= exitX - padding && pos.x <= exitX + exitSize + padding
      && pos.y >= exitY - padding && pos.y <= exitY + exitSize + padding;
  },

  requestExitConfirmation() {
    if (this.isExitConfirmPending) {
      return;
    }
    this.pauseGameForExitConfirm();
    this.isExitConfirmPending = true;
    const handleConfirmResult = (shouldExit) => {
      this.isExitConfirmPending = false;
      if (shouldExit) {
        this.stopGame();
        if (typeof this.showMenu === 'function') {
          this.showMenu();
        } else {
          this.state = 'menu';
          if (this.uiManager) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.uiManager.render('start');
          }
        }
        return;
      }
      this.resumeGameAfterExitConfirm();
    };

    if (typeof tt !== 'undefined' && tt.showModal) {
      tt.showModal({
        title: 'Exit',
        content: 'Exit current game?',
        confirmText: 'Exit',
        cancelText: 'Stay',
        success: (res) => handleConfirmResult(!!(res && res.confirm)),
        fail: () => handleConfirmResult(false)
      });
      return;
    }

    if (typeof confirm === 'function') {
      handleConfirmResult(!!confirm('Exit current game?'));
      return;
    }

    handleConfirmResult(false);
  },

  pauseGameForExitConfirm() {
    if (this.state !== 'playing') {
      return;
    }
    this.state = 'paused';
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

  resumeGameAfterExitConfirm() {
    if (this.state !== 'paused') {
      return;
    }
    this.state = 'playing';
    if (this.touchHandler) {
      this.touchHandler.setEnabled(true);
    }
    this.startTimer();
    this.startRenderLoop();
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

  generateStructuredGridCells() {
    try {
      const cells = this.gridGenerator.generate();
      if (cells && cells.length === this.gridGenerator.numCells) {
        return cells;
      }
    } catch (error) {
      console.warn('Grid generation failed, fallback to Voronoi:', error);
    }
    return this.generateVoronoiWithRetry(2);
  },

  shouldEnable100ModeSelection(cellCount) {
    return Number(cellCount) === 100;
  },

  get100ModeDifficulty(mode) {
    const modeDurations = {
      [this.gameplayModes.SIMPLE]: 8 * 60,
      [this.gameplayModes.HARD]: 12 * 60,
      [this.gameplayModes.HELL]: 16 * 60
    };
    return modeDurations[mode] || modeDurations[this.gameplayModes.SIMPLE];
  },

  applyGameplayModeForCurrentRound(cellCount) {
    const isCustomRound = this.selectedCustomMode !== null && this.selectedCustomMode !== undefined;
    const selectedRunMode = this.selectedNormalMode || this.gameplayMode || this.gameplayModes.SIMPLE;
    if (isCustomRound && Number(cellCount) !== 100) {
      this.gameplayMode = this.gameplayModes.SIMPLE;
      return;
    }
    this.gameplayMode = selectedRunMode;
  },

  show100ModeSelectScreen(context) {
    this.pending100ModeStart = context || { target: 'normal', returnScreen: 'start' };
    this.state = 'menu';
    this.currentScreen = 'modeSelect100';

    const scale = this.canvas.width / this.screenAdapter.screenWidth;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const selectedMode = this.selectedNormalMode
      || this.leaderboardMode
      || this.gameplayMode
      || this.gameplayModes.SIMPLE;
    this.uiManager.render('modeSelect100', { selectedMode });
  },

  rebuildCellsForHellMode() {
    const totalCells = Number(this.totalNumbers) || 0;
    if (totalCells <= 1) {
      return;
    }

    const previousCells = Array.isArray(this.cells) ? this.cells : [];
    const previousCellByNumber = new Map(previousCells.map((item) => [item.number, item]));
    const completedTarget = this.currentNumber - 1;
    const layoutBounds = this.getPlayableLayoutBounds();
    this.voronoiGenerator.width = layoutBounds.width;
    this.voronoiGenerator.height = layoutBounds.height;
    this.voronoiGenerator.numSites = totalCells;
    this.gridGenerator.width = layoutBounds.width;
    this.gridGenerator.height = layoutBounds.height;
    this.gridGenerator.numCells = totalCells;

    const nextCells = this.generateStructuredGridCells();
    for (const cell of nextCells) {
      cell.site.x += layoutBounds.x;
      cell.site.y += layoutBounds.y;
      for (const point of cell.polygon) {
        point.x += layoutBounds.x;
        point.y += layoutBounds.y;
      }
      const previousCell = previousCellByNumber.get(cell.number);
      if (previousCell && previousCell.done) {
        cell.done = true;
        cell.completedAt = previousCell.completedAt || Date.now();
        cell.checkVisibleUntil = previousCell.checkVisibleUntil || 0;
      } else if (cell.number < this.currentNumber) {
        cell.done = true;
        cell.completedAt = Date.now();
        cell.checkVisibleUntil = 0;
      }
      if (cell.number === completedTarget) {
        cell.pressedUntil = Date.now() + 100;
        cell.pressType = 'correct';
      }
    }

    this.cells = nextCells;
    this.touchHandler.updateCells(this.cells);
  },

  getPlayableLayoutBounds() {
    const bounds = this.screenAdapter.getGameBounds();
    
    // Minimalist layout for all levels
    const hudFontSize = this.screenAdapter.getFontSize ? this.screenAdapter.getFontSize(0.9) : 14;
    
    // Level 1: ~70px (Title + Hint)
    // Level 2: ~85px (Title + Timer + Hint + Spacing) - Compacted to increase grid height
    const isLevel2 = this.totalNumbers > 20;
    const hudTopReserve = isLevel2 ? 85 : 70;
    const progressBottomReserve = Math.max(12, Math.ceil(hudFontSize)); // Reduced minimal bottom
    
    const width = Math.max(40, bounds.width);
    const height = Math.max(140, bounds.height - hudTopReserve - progressBottomReserve);
    
    return {
      x: bounds.x,
      y: bounds.y + hudTopReserve,
      width,
      height
    };
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
    cell.pressedUntil = Date.now() + 140;
    cell.pressType = 'correct';
    cell.done = true;
    cell.completedAt = Date.now();
    const needsTemporaryCheck = this.gameplayMode === this.gameplayModes.HARD || this.gameplayMode === this.gameplayModes.HELL;
    cell.checkVisibleUntil = needsTemporaryCheck ? (Date.now() + 5000) : 0;
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
      return;
    }
    if (
      this.gameplayMode === this.gameplayModes.HELL
    ) {
      this.rebuildCellsForHellMode();
    }
  },

  handleWrongClick(cell) {
    cell.errorUntil = Date.now() + 500; // Longer duration for error to be visible
    cell.pressedUntil = Date.now() + 140; // Also set pressed for animation
    cell.pressType = 'wrong';
    this.errors++;
  },

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.timer = setInterval(() => {
      if (this.difficulty === 0) {
        this.elapsedTime++;
      } else {
        this.timeLeft--;
        this.elapsedTime++;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.handleTimeExpired();
        }
      }
    }, 1000);
  },

  canAttemptRevive() {
    if (this.difficulty <= 0) {
      return false;
    }
    if (this.selectedCustomMode !== null && this.selectedCustomMode !== undefined) {
      return false;
    }
    if (!this.activeDailySession || !this.activeDailySession.sessionId || !this.activeDailySession.openId) {
      return false;
    }
    return Number(this.activeDailySession.reviveUsed || 0) < 2;
  },

  showToast(message) {
    if (typeof tt !== 'undefined' && tt.showToast) {
      tt.showToast({
        title: message,
        icon: 'none'
      });
    }
  },

  async showReviveConfirmModal() {
    const reviveLeft = Math.max(0, 2 - Number((this.activeDailySession && this.activeDailySession.reviveUsed) || 0));
    if (typeof tt === 'undefined' || typeof tt.showModal !== 'function') {
      return true;
    }
    return new Promise((resolve) => {
      tt.showModal({
        title: 'Time up',
        content: `Watch ad to revive +180s (${reviveLeft} left)`,
        confirmText: 'Revive',
        cancelText: 'End',
        success: (res) => resolve(!!(res && res.confirm)),
        fail: () => resolve(false)
      });
    });
  },

  async playReviveRewardAd() {
    if (typeof tt === 'undefined' || typeof tt.createRewardedVideoAd !== 'function') {
      return true;
    }
    const adUnitId = this.reviveAdUnitId || 'adunit-revive-placeholder';
    try {
      const rewardedVideoAd = tt.createRewardedVideoAd({ adUnitId });
      return await new Promise((resolve) => {
        let settled = false;
        const finalize = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };
        rewardedVideoAd.onClose((res) => {
          finalize(!!(res && res.isEnded));
        });
        rewardedVideoAd.onError(() => {
          finalize(false);
        });
        rewardedVideoAd.load()
          .then(() => rewardedVideoAd.show())
          .catch(() => finalize(false));
      });
    } catch (error) {
      console.warn('Failed to show revive ad:', error);
      return false;
    }
  },

  async requestRevive() {
    const confirmed = await this.showReviveConfirmModal();
    if (!confirmed) {
      return { allowed: false, code: 'cancelled' };
    }
    const adCompleted = await this.playReviveRewardAd();
    if (!adCompleted) {
      this.showToast('Ad not completed');
      return { allowed: false, code: 'ad_incomplete' };
    }
    const payload = {
      openId: this.activeDailySession.openId,
      sessionId: this.activeDailySession.sessionId,
      adCompleted: true,
      adTraceId: this.generateTraceId('ad')
    };
    const result = await this.callCloudFunction('request_revive', payload);
    const data = result && result.data ? result.data : result;
    if (!data || (result && result.success === false) || data.allowed !== true) {
      return {
        allowed: false,
        code: (result && result.code) || (data && data.code) || 'revive_denied',
        message: (result && result.message) || (data && data.message) || 'revive_failed'
      };
    }
    const timeBonusSec = Number(data.timeBonusSec || 180);
    this.activeDailySession = {
      ...this.activeDailySession,
      reviveUsed: Number(data.reviveUsed || 0)
    };
    return {
      allowed: true,
      timeBonusSec,
      reviveUsed: Number(data.reviveUsed || 0),
      reviveLeft: Number(data.reviveLeft || Math.max(0, 2 - Number(data.reviveUsed || 0)))
    };
  },

  async handleTimeExpired() {
    if (this.isTimeExpiredHandling || this.isReviveFlowActive) {
      return;
    }
    this.isTimeExpiredHandling = true;
    try {
      if (!this.canAttemptRevive()) {
        this.gameOver();
        return;
      }
      this.isReviveFlowActive = true;
      this.pauseGameForExitConfirm();
      const reviveResult = await this.requestRevive();
      this.isReviveFlowActive = false;
      if (reviveResult && reviveResult.allowed) {
        this.timeLeft += Number(reviveResult.timeBonusSec || 180);
        this.resumeGameAfterExitConfirm();
        this.showToast(`Revived +${Number(reviveResult.timeBonusSec || 180)}s`);
        return;
      }
      if (reviveResult && reviveResult.message) {
        this.showToast(String(reviveResult.message));
      }
      this.gameOver();
    } finally {
      this.isTimeExpiredHandling = false;
    }
  },

  startRenderLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    const loop = () => {
      if (this.state !== 'playing') return;
      try {
        const gameState = {
          mode: this.mode,
          gameplayMode: this.gameplayMode,
          difficulty: this.difficulty,
          currentNumber: this.currentNumber,
          errors: this.errors,
          elapsedTime: this.elapsedTime,
          timeLeft: this.timeLeft,
          totalNumbers: this.totalNumbers || 100,
          now: Date.now()
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
    if (!isCustomMode && currentLevel === 1) {
      console.log('Level 1 completed, starting transition to level 2');
      const selectedRunMode = this.selectedNormalMode || this.gameplayMode || this.gameplayModes.SIMPLE;
      const nextLevelTimeLimitSec = this.get100ModeDifficulty(selectedRunMode);
      this.state = 'transition';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.transitionManager.showLevelTransition(1, 2, () => {
        console.log('Transition completed, starting level 2');
        this.levelManager.setCurrentLevel(2);
        this.gameplayMode = selectedRunMode;
        this.difficulty = this.get100ModeDifficulty(selectedRunMode);
        this.modeSelectionConfirmedForRun = true;
        this.startGame({ skipModeSelection: true });
      }, { nextLevelTimeLimitSec });
      this.startTransitionRenderLoop();
    } else if (!isCustomMode && currentLevel === 2) {
      this.submitLevel2Result('pass', {
        ...stats,
        completed: this.levelManager.getCurrentLevelConfig().cellCount,
        totalNumbers: this.levelManager.getCurrentLevelConfig().cellCount
      });
      console.log('Level 2 completed, showing completion screen with unlock notification');
      this.state = 'menu';
      const scale = this.canvas.width / this.screenAdapter.screenWidth;
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const resultStats = {
        success: true,
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
      const scale = this.canvas.width / this.screenAdapter.screenWidth;
      this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const resultStats = {
        success: true,
        completed: isCustomMode ? this.selectedCustomMode : this.levelManager.getCurrentLevelConfig().cellCount,
        time: this.elapsedTime,
        errors: this.errors,
        level: isCustomMode ? `custom_${this.selectedCustomMode}` : currentLevel,
        levelName: isCustomMode ? `自选模�?(1-${this.selectedCustomMode})` : this.levelManager.getCurrentLevelConfig().name,
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
    // Progress persistence removed in daily challenge atomic mode.
  },

  gameOver() {
    console.log('Game over!');
    this.state = 'menu';
    this.stopGame();
    if (this.levelManager && this.levelManager.currentLevel === 2 && this.selectedCustomMode === null) {
      this.submitLevel2Result('fail', {
        time: this.elapsedTime,
        errors: this.errors,
        completed: this.currentNumber - 1,
        totalNumbers: this.totalNumbers || 100
      });
    }
    const scale = this.canvas.width / this.screenAdapter.screenWidth;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const stats = {
      success: false,
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

  async submitDailyRoundResult(roundNo, status, stats) {
    if (Number(roundNo) !== 2) {
      return null;
    }
    return this.submitLevel2Result(status, stats);
  },

  async submitLevel2Result(status, stats = {}) {
    if (!this.activeDailySession || this.activeDailySession.status === 'submitted') {
      return null;
    }
    const payload = {
      openId: this.activeDailySession.openId || await this.ensureOpenId(),
      sessionId: this.activeDailySession.sessionId,
      mode: this.activeDailySession.mode || this.getCurrentRunMode(),
      status,
      stats: {
        time: Number(stats.time || this.elapsedTime || 0),
        errors: Number(stats.errors || this.errors || 0),
        completed: Number(stats.completed || this.currentNumber - 1),
        totalNumbers: Number(stats.totalNumbers || this.totalNumbers || 100)
      },
      playedAt: Date.now()
    };
    const result = await this.callCloudFunction('submit_level2_result', payload);
    const data = result && result.data ? result.data : result;
    if (result && result.success === false) {
      return null;
    }
    if (data && typeof data === 'object') {
      this.applyDailyState(data);
      if (typeof data.passedToday === 'boolean' && data.passedToday) {
        this.dailyChallengeState.passedToday = true;
        this.dailyChallengeState.canStart = false;
      }
      this.activeDailySession = {
        ...this.activeDailySession,
        status: 'submitted'
      };
      this.refreshHomeRemoteData();
    }
    return data || null;
  },

  async saveGameStatistics() {
    // Statistics persistence removed for daily challenge atomic mode.
  },

  stopGame() {
    this.isExitConfirmPending = false;
    this.isReviveFlowActive = false;
    this.isTimeExpiredHandling = false;
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
      console.log('开始分享成�?..');
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
        console.log('Share canceled or failed');
      }
    } catch (error) {
      console.error('Share flow error:', error);
    }
  },

  showShareSuccessMessage() {
    const message = 'Share success';
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
