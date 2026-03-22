const gameUIFlowMethods = {
  showLoadingMessage(message) {
    const ctx = this.ctx;
    const w = this.screenAdapter.screenWidth;
    const h = this.screenAdapter.screenHeight;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(w * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, w / 2, h / 2);
  },

  hideLoadingMessage() {
  },

  showLoginStatusMessage(message, duration = 1000) {
    try {
      const ctx = this.ctx;
      const w = this.screenAdapter.screenWidth;
      const h = this.screenAdapter.screenHeight;
      if (!ctx || typeof ctx.clearRect !== 'function') {
        console.log(`Login status: ${message} (context not available)`);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, '#E3F2FD');
      gradient.addColorStop(0.5, '#BBDEFB');
      gradient.addColorStop(1, '#90CAF9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1976D2';
      ctx.font = `${Math.floor(w * 0.1)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('馃攼', w / 2, h / 2 - 40);
      ctx.fillStyle = '#1565C0';
      ctx.font = `bold ${Math.floor(w * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(message, w / 2, h / 2 + 20);
      if (duration > 0) {
        setTimeout(() => {
          console.log(`Login status message "${message}" expired after ${duration}ms`);
        }, duration);
      }
    } catch (error) {
      console.error('Error showing login status message:', error);
      console.log(`Login status: ${message} (fallback to console)`);
    }
  },

  showAuthorizationGuidance() {
    console.log('Showing authorization guidance screen');
    this.state = 'authorization';
    this.setupUIClickHandler();
    this.uiManager.render('authorization');
  },

  showLevelIntroduction(levelId) {
    const levelConfig = this.levelManager.getLevelConfig(levelId);
    console.log(`Showing introduction for level ${levelId}:`, levelConfig.description);
    const scale = this.canvas.width / this.screenAdapter.screenWidth;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#333333';
    this.ctx.font = `${Math.floor(this.canvas.width * 0.06)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ctx.fillText(levelConfig.name, centerX, centerY - 100);
    this.ctx.font = `${Math.floor(this.canvas.width * 0.04)}px Arial`;
    this.ctx.fillText(levelConfig.description, centerX, centerY - 60);
    this.ctx.font = `${Math.floor(this.canvas.width * 0.035)}px Arial`;
    this.ctx.fillStyle = '#666666';
    if (levelId === 1) {
      this.ctx.fillText('Game rules:', centerX, centerY - 20);
      this.ctx.fillText('Tap numbers in order from 1 to 10', centerX, centerY + 10);
      this.ctx.fillText('Find the correct number and tap it', centerX, centerY + 40);
      this.ctx.fillText('Wrong taps increase error count', centerX, centerY + 70);
    } else {
      this.ctx.fillText('Tap numbers in order', centerX, centerY + 10);
      this.ctx.fillText('Stay focused for the challenge', centerX, centerY + 40);
    }
    this.ctx.fillStyle = '#999999';
    this.ctx.font = `${Math.floor(this.canvas.width * 0.03)}px Arial`;
    this.ctx.fillText('Return to home and tap Start Game', centerX, centerY + 120);
  },

  setupUIClickHandler() {
  },

  handleUIClick(btn) {
    console.log('UI Button clicked:', btn.id);
    const scale = this.canvas.width / this.screenAdapter.screenWidth;
    switch (btn.id) {
      case 'start':
        this.mode = 'bright';
        if (this.pendingContinueLevel === 1 || this.pendingContinueLevel === 2) {
          this.levelManager.setCurrentLevel(this.pendingContinueLevel);
        }
        this.modeSelectionConfirmedForRun = false;
        this.selectedNormalMode = null;
        this.show100ModeSelectScreen({
          target: 'normal',
          returnScreen: 'start',
          launchStage: 'entry',
          returnData: this.getStartScreenData()
        });
        break;
      case 'startupPromptToggle':
        this.startupPromptDisabled = !this.startupPromptDisabled;
        this.persistStartupPromptPreference(this.startupPromptDisabled);
        this.uiManager.setStartupPromptDisabled(this.startupPromptDisabled);
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
        this.uiManager.render('start', this.getStartScreenData());
        break;
      case 'reducedMotionToggle':
        this.reducedMotionEnabled = !this.reducedMotionEnabled;
        this.persistReducedMotionPreference(this.reducedMotionEnabled);
        if (this.renderEngine && typeof this.renderEngine.applyReducedMotion === 'function') {
          this.renderEngine.applyReducedMotion(this.reducedMotionEnabled);
        }
        if (this.uiManager && typeof this.uiManager.setReducedMotionEnabled === 'function') {
          this.uiManager.setReducedMotionEnabled(this.reducedMotionEnabled);
        }
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
        this.uiManager.render('start', this.getStartScreenData());
        break;
      case 'free':
        this.selectedCustomMode = null;
        this.difficulty = 0;
        this.startGame();
        break;
      case '60':
        this.selectedCustomMode = null;
        this.difficulty = 60;
        this.startGame();
        break;
      case '120':
        this.selectedCustomMode = null;
        this.difficulty = 120;
        this.startGame();
        break;
      case '180':
        this.selectedCustomMode = null;
        this.difficulty = 180;
        this.startGame();
        break;
      case 'back':
        if (this.currentScreen === 'difficultySelect') {
          this.currentScreen = 'start';
          this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
          this.uiManager.render('start', this.getStartScreenData());
        } else if (this.currentScreen === 'customModeSelect') {
          this.currentScreen = 'start';
          this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
          this.uiManager.render('start', this.getStartScreenData());
        } else if (this.currentScreen === 'customTimeSelect') {
          this.currentScreen = 'customModeSelect';
          this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
          this.uiManager.render('customModeSelect');
        } else if (this.currentScreen === 'modeSelect100') {
          const backScreen = this.pending100ModeStart && this.pending100ModeStart.returnScreen
            ? this.pending100ModeStart.returnScreen
            : 'start';
          const backData = this.pending100ModeStart ? this.pending100ModeStart.returnData : undefined;
          this.pending100ModeStart = null;
          this.currentScreen = backScreen;
          this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
          if (backScreen === 'start') {
            this.uiManager.render('start', backData || this.getStartScreenData());
          } else {
            this.uiManager.render(backScreen, backData);
          }
        }
        break;
      case 'restart':
        if (this.lastResultSettings && this.lastResultSettings.customMode) {
          this.selectedCustomMode = this.lastResultSettings.customMode || null;
          this.difficulty = this.lastResultSettings.difficulty || 0;
          this.startCustomGame();
        } else {
          this.mode = 'bright';
          this.modeSelectionConfirmedForRun = false;
          this.selectedNormalMode = null;
          this.show100ModeSelectScreen({
            target: 'normal',
            returnScreen: 'start',
            launchStage: 'entry',
            returnData: this.getStartScreenData()
          });
        }
        break;
      case 'home':
        this.showMenu();
        break;
      case 'share':
        console.log('Share button clicked');
        this.handleShareScore();
        break;
      case 'customMode':
        console.log('Enter custom mode');
        if (this.userProfileManager && !this.userProfileManager.hasViewedCustomModeExplanation()) {
          console.log('棣栨杩涘叆鑷€夋ā寮忥紝鏄剧ず璇存槑鐣岄潰');
          this.currentScreen = 'customModeExplanation';
          this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
          this.uiManager.render('customModeExplanation');
        } else {
          console.log('Skip explanation and open custom mode select');
          this.currentScreen = 'customModeSelect';
          this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
          this.uiManager.render('customModeSelect');
        }
        break;
      case 'custom10':
        console.log('閫夋�?1-10 缁冧範妯″紡');
        this.selectedCustomMode = 10;
        this.currentScreen = 'customTimeSelect';
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
        this.uiManager.render('customTimeSelect', { mode: 10 });
        break;
      case 'custom100':
        console.log('閫夋�?1-100 鎸戞垬妯″紡');
        this.selectedCustomMode = 100;
        this.show100ModeSelectScreen({
          target: 'custom',
          returnScreen: 'customModeSelect'
        });
        break;
      case 'authorize':
        console.log('Authorization accepted');
        this.handleUserAuthorization(true);
        break;
      case 'deny':
        console.log('Authorization denied');
        this.handleUserAuthorization(false);
        break;
      case 'customFree':
        console.log('閫夋嫨鑷敱妯″紡');
        this.difficulty = 0;
        this.startCustomGame();
        break;
      case 'custom60':
        console.log('閫夋�?鍒嗛挓闄愭椂');
        this.difficulty = 60;
        this.startCustomGame();
        break;
      case 'custom120':
        console.log('閫夋�?鍒嗛挓闄愭椂');
        this.difficulty = 120;
        this.startCustomGame();
        break;
      case 'custom180':
        console.log('閫夋�?鍒嗛挓闄愭椂');
        this.difficulty = 180;
        this.startCustomGame();
        break;
      case 'modeSimple':
      case 'modeHard':
      case 'modeHell': {
        const selectedModeMap = {
          modeSimple: this.gameplayModes.SIMPLE,
          modeHard: this.gameplayModes.HARD,
          modeHell: this.gameplayModes.HELL
        };
        const selectedMode = selectedModeMap[btn.id] || this.gameplayModes.SIMPLE;
        this.saveGameplayModePreference(selectedMode);
        this.leaderboardMode = selectedMode;
        this.difficulty = typeof this.get100ModeDifficulty === 'function'
          ? this.get100ModeDifficulty(selectedMode)
          : 8 * 60;
        const pending = this.pending100ModeStart || { target: 'normal' };
        this.pending100ModeStart = null;
        if (pending.launchStage === 'entry') {
          this.selectedNormalMode = selectedMode;
          this.modeSelectionConfirmedForRun = true;
          this.selectedCustomMode = null;
          this.startLevel(1, null, 0);
        } else if (pending.target === 'custom') {
          this.startCustomGame({ skipModeSelection: true });
        } else {
          this.selectedNormalMode = selectedMode;
          this.modeSelectionConfirmedForRun = true;
          this.startGame({ skipModeSelection: true });
        }
        break;
      }
      case 'leaderboardSimple':
      case 'leaderboardHard':
      case 'leaderboardHell': {
        const leaderboardModeMap = {
          leaderboardSimple: this.gameplayModes.SIMPLE,
          leaderboardHard: this.gameplayModes.HARD,
          leaderboardHell: this.gameplayModes.HELL
        };
        this.leaderboardMode = leaderboardModeMap[btn.id] || this.gameplayModes.SIMPLE;
        this.currentScreen = 'start';
        this.state = 'menu';
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
        this.uiManager.render('start', this.getStartScreenData());
        if (typeof this.refreshLeaderboardByMode === 'function') {
          this.refreshLeaderboardByMode(this.leaderboardMode)
            .then(() => {
              if (this.state === 'menu' && this.currentScreen === 'start') {
                this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
                this.uiManager.render('start', this.getStartScreenData());
              }
            })
            .catch((error) => {
              console.warn('Failed to refresh leaderboard mode:', error);
            });
        }
        break;
      }
      case 'startCustomMode':
        console.log('浠庤鏄庣晫闈㈣繘鍏ユā寮忛€夋嫨');
        if (this.userProfileManager) {
          this.userProfileManager.markCustomModeExplanationViewed();
        }
        this.currentScreen = 'customModeSelect';
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
        this.uiManager.render('customModeSelect');
        break;
    }
  },

  getStartScreenData() {
    const fallbackMode = this.gameplayModes ? this.gameplayModes.SIMPLE : 'simple';
    const selectedMode = this.selectedNormalMode
      || this.leaderboardMode
      || this.gameplayMode
      || fallbackMode;
    const leaderboardMode = this.leaderboardMode || selectedMode || fallbackMode;
    return {
      selectedMode,
      leaderboardMode,
      homeStats: this.homeStats || null,
      dailyChallengeState: this.dailyChallengeState || null,
      leaderboardByMode: this.remoteLeaderboardByMode || null
    };
  },

  setupOrientationMonitoring() {
    this.orientationCheckInterval = setInterval(() => {
      if (this.screenAdapter.updateOrientation()) {
        const newOrientation = this.screenAdapter.getOrientation();
        console.log(`Orientation changed to: ${newOrientation}`);
        this.handleOrientationChange(newOrientation);
      }
    }, 500);
  },

  handleOrientationChange(newOrientation) {
    console.log('Handling orientation change:', newOrientation);
    this.canvas.width = this.screenAdapter.screenWidth;
    this.canvas.height = this.screenAdapter.screenHeight;
    switch (this.state) {
      case 'menu':
        this.showMenu();
        break;
      case 'playing':
        this.startRenderLoop();
        break;
      case 'transition':
        this.startTransitionRenderLoop();
        break;
      default:
      if (this.uiManager && this.uiManager.currentScreen) {
          if (this.uiManager.currentScreen === 'start') {
            this.uiManager.render('start', this.getStartScreenData());
          } else {
            this.uiManager.render(this.uiManager.currentScreen);
          }
        }
        break;
    }
  },

  showMenu() {
    console.log('Show main menu');
    this.state = 'menu';
    this.currentScreen = 'start';
    const scale = this.canvas.width / this.screenAdapter.screenWidth;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (this.uiManager) {
      this.uiManager.setStartupPromptDisabled(this.startupPromptDisabled);
      if (typeof this.uiManager.setReducedMotionEnabled === 'function') {
        this.uiManager.setReducedMotionEnabled(!!this.reducedMotionEnabled);
      }
      this.uiManager.render('start', this.getStartScreenData());
      if (!this.isRefreshingHomeData && typeof this.refreshHomeRemoteData === 'function') {
        this.isRefreshingHomeData = true;
        this.refreshHomeRemoteData()
          .then(() => {
            this.isRefreshingHomeData = false;
            if (this.state === 'menu' && this.currentScreen === 'start') {
              const redrawScale = this.canvas.width / this.screenAdapter.screenWidth;
              this.ctx.setTransform(redrawScale, 0, 0, redrawScale, 0, 0);
              this.uiManager.render('start', this.getStartScreenData());
            }
          })
          .catch((error) => {
            this.isRefreshingHomeData = false;
            console.warn('Failed to refresh home data:', error);
          });
      }
    } else {
      console.error('UIManager not initialized');
    }
  }
};

module.exports = { gameUIFlowMethods };
