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
      ctx.fillText('🔐', w / 2, h / 2 - 40);
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
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
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
      this.ctx.fillText('游戏规则：', centerX, centerY - 20);
      this.ctx.fillText('按顺序点击数字 1 到 10', centerX, centerY + 10);
      this.ctx.fillText('找到正确的数字并点击', centerX, centerY + 40);
      this.ctx.fillText('点错会增加错误次数', centerX, centerY + 70);
    } else {
      this.ctx.fillText('按顺序点击数字', centerX, centerY + 10);
      this.ctx.fillText('挑战你的专注力！', centerX, centerY + 40);
    }
    this.ctx.fillStyle = '#999999';
    this.ctx.font = `${Math.floor(this.canvas.width * 0.03)}px Arial`;
    this.ctx.fillText('请返回首页点击“开始游戏”', centerX, centerY + 120);
  },

  setupUIClickHandler() {
  },

  handleUIClick(btn) {
    console.log('UI Button clicked:', btn.id);
    try {
      tt.vibrateShort({ type: 'light' });
    } catch (e) {}
    switch (btn.id) {
      case 'start':
        this.mode = 'bright';
        if (this.pendingContinueLevel === 1 || this.pendingContinueLevel === 2) {
          this.levelManager.setCurrentLevel(this.pendingContinueLevel);
        }
        this.currentScreen = 'difficultySelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.uiManager.render('difficultySelect');
        break;
      case 'startupPromptToggle':
        this.persistStartupPromptPreference(!this.startupPromptDisabled);
        this.uiManager.setStartupPromptDisabled(this.startupPromptDisabled);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.uiManager.render('start');
        break;
      case 'free':
        this.difficulty = 0;
        this.startGame();
        break;
      case '60':
        this.difficulty = 60;
        this.startGame();
        break;
      case '120':
        this.difficulty = 120;
        this.startGame();
        break;
      case '180':
        this.difficulty = 180;
        this.startGame();
        break;
      case 'back':
        if (this.currentScreen === 'difficultySelect') {
          this.currentScreen = 'start';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.uiManager.render('start');
        } else if (this.currentScreen === 'customModeSelect') {
          this.currentScreen = 'start';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.uiManager.render('start');
        } else if (this.currentScreen === 'customTimeSelect') {
          this.currentScreen = 'customModeSelect';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.uiManager.render('customModeSelect');
        }
        break;
      case 'restart':
        if (this.lastResultSettings) {
          this.selectedCustomMode = this.lastResultSettings.customMode || null;
          this.difficulty = this.lastResultSettings.difficulty || 0;
          if (this.lastResultSettings.level === 1 || this.lastResultSettings.level === 2) {
            this.levelManager.setCurrentLevel(this.lastResultSettings.level);
          }
        }
        this.startGame();
        break;
      case 'home':
        this.currentScreen = 'start';
        this.state = 'menu';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.uiManager.render('start');
        break;
      case 'share':
        console.log('分享按钮被点击');
        this.handleShareScore();
        break;
      case 'customMode':
        console.log('进入自选模式');
        if (this.userProfileManager && !this.userProfileManager.hasViewedCustomModeExplanation()) {
          console.log('首次进入自选模式，显示说明界面');
          this.currentScreen = 'customModeExplanation';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.uiManager.render('customModeExplanation');
        } else {
          console.log('已查看过说明，直接进入模式选择');
          this.currentScreen = 'customModeSelect';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.uiManager.render('customModeSelect');
        }
        break;
      case 'custom10':
        console.log('选择 1-10 练习模式');
        this.selectedCustomMode = 10;
        this.currentScreen = 'customTimeSelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.uiManager.render('customTimeSelect', { mode: 10 });
        break;
      case 'custom100':
        console.log('选择 1-100 挑战模式');
        this.selectedCustomMode = 100;
        this.currentScreen = 'customTimeSelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.uiManager.render('customTimeSelect', { mode: 100 });
        break;
      case 'authorize':
        console.log('用户同意授权');
        this.handleUserAuthorization(true);
        break;
      case 'deny':
        console.log('用户拒绝授权');
        this.handleUserAuthorization(false);
        break;
      case 'customFree':
        console.log('选择自由模式');
        this.difficulty = 0;
        this.startCustomGame();
        break;
      case 'custom60':
        console.log('选择1分钟限时');
        this.difficulty = 60;
        this.startCustomGame();
        break;
      case 'custom120':
        console.log('选择2分钟限时');
        this.difficulty = 120;
        this.startCustomGame();
        break;
      case 'custom180':
        console.log('选择3分钟限时');
        this.difficulty = 180;
        this.startCustomGame();
        break;
      case 'startCustomMode':
        console.log('从说明界面进入模式选择');
        if (this.userProfileManager) {
          this.userProfileManager.markCustomModeExplanationViewed();
        }
        this.currentScreen = 'customModeSelect';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.uiManager.render('customModeSelect');
        break;
    }
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
          this.uiManager.render(this.uiManager.currentScreen);
        }
        break;
    }
  },

  showMenu() {
    console.log('显示主菜单');
    console.log('当前状态:', this.state);
    console.log('UIManager存在:', !!this.uiManager);
    this.state = 'menu';
    this.currentScreen = 'start';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.uiManager) {
      this.uiManager.setStartupPromptDisabled(this.startupPromptDisabled);
      console.log('调用UIManager.render(start)');
      this.uiManager.render('start');
      console.log('UIManager.render完成');
    } else {
      console.error('UIManager未初始化！');
    }
  }
};

module.exports = { gameUIFlowMethods };
