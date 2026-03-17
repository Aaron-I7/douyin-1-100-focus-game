class UIManager {
  constructor(canvas, ctx, screenAdapter, themeSystem = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    this.width = screenAdapter.screenWidth;
    this.height = screenAdapter.screenHeight;
    this.currentScreen = 'start';
    this.selectedDifficulty = null;
    this.buttons = [];
    this.onStartGame = null;
    this.userProfileManager = null;
    this.startupPromptDisabled = false;
    console.log('UIManager初始化, 使用逻辑尺寸:', { width: this.width, height: this.height });
  }

  setStartupPromptDisabled(disabled) {
    this.startupPromptDisabled = !!disabled;
  }

  renderStartScreen() {
    console.log('renderStartScreen开始执行');
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    console.log('Canvas尺寸:', { width: w, height: h });
    console.log('Context存在:', !!ctx);
    if (this.themeSystem) {
      this.themeSystem.applyBackgroundGradient(ctx, w, h);
      this.themeSystem.applyCyberpunkDecorations(ctx, w, h, Date.now());
      this.themeSystem.applyScanlines(ctx, w, h, Date.now());
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, '#FFE5B4');
      gradient.addColorStop(0.5, '#FFD4A3');
      gradient.addColorStop(1, '#FFC48C');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    console.log('背景绘制完成');
    if (!this.themeSystem) {
      this.drawDecorativeCircles(ctx);
    }
    console.log('装饰圆点绘制完成');
    ctx.save();
    if (this.themeSystem) {
      const themeColors = this.themeSystem.getThemeColors();
      ctx.fillStyle = themeColors.primary;
      ctx.shadowColor = themeColors.primary;
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#FFFFFF';
    }
    ctx.font = `bold ${Math.floor(w * 0.12)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1-100', w / 2, h * 0.25);
    ctx.restore();
    console.log('标题绘制完成');
    if (this.themeSystem) {
      const themeColors = this.themeSystem.getThemeColors();
      ctx.fillStyle = themeColors.secondary;
      ctx.shadowColor = themeColors.secondary;
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#8B4513';
    }
    ctx.font = `${Math.floor(w * 0.045)}px Arial, sans-serif`;
    ctx.fillText('专注力挑战', w / 2, h * 0.35);
    console.log('副标题绘制完成');
    const isCustomModeUnlocked = this.userProfileManager ? this.userProfileManager.isCustomModeUnlocked() : false;
    console.log('准备绘制按钮');
    if (this.themeSystem) {
      this.drawButtonWithTheme(ctx, {
        x: w * 0.2,
        y: h * 0.5,
        width: w * 0.6,
        height: 60,
        text: '开始游戏',
        type: 'primary',
        id: 'start'
      });
    } else {
      this.drawButton(ctx, {
        x: w * 0.2,
        y: h * 0.5,
        width: w * 0.6,
        height: 60,
        text: '开始游戏',
        color: '#FF6B6B',
        textColor: '#FFFFFF',
        id: 'start'
      });
    }
    if (isCustomModeUnlocked) {
      if (this.themeSystem) {
        this.drawButtonWithTheme(ctx, {
          x: w * 0.2,
          y: h * 0.58,
          width: w * 0.6,
          height: 50,
          text: '自选模式',
          type: 'secondary',
          id: 'customMode'
        });
      } else {
        this.drawButton(ctx, {
          x: w * 0.2,
          y: h * 0.58,
          width: w * 0.6,
          height: 50,
          text: '自选模式',
          color: '#4CAF50',
          textColor: '#FFFFFF',
          id: 'customMode'
        });
      }
    } else {
      this.drawLockedButton(ctx, {
        x: w * 0.2,
        y: h * 0.58,
        width: w * 0.6,
        height: 50,
        text: '自选模式',
        id: 'customModeLocked'
      });
    }
    console.log('按钮绘制完成');
    if (this.themeSystem) {
      const themeColors = this.themeSystem.getThemeColors();
      ctx.fillStyle = themeColors.hud.textSecondary;
      ctx.shadowColor = themeColors.hud.textSecondary;
      ctx.shadowBlur = 5;
    } else {
      ctx.fillStyle = '#999999';
    }
    ctx.font = `${Math.floor(w * 0.035)}px Arial, sans-serif`;
    ctx.fillText('按顺序点击 1-100 的数字', w / 2, h * 0.75);
    ctx.fillText('挑战你的专注力极限！', w / 2, h * 0.8);
    if (this.themeSystem) {
      this.drawButtonWithTheme(ctx, {
        x: w * 0.2,
        y: h * 0.67,
        width: w * 0.6,
        height: 44,
        text: this.startupPromptDisabled ? '启动提示：已关闭' : '启动提示：开启',
        type: 'secondary',
        id: 'startupPromptToggle'
      });
    } else {
      this.drawButton(ctx, {
        x: w * 0.2,
        y: h * 0.67,
        width: w * 0.6,
        height: 44,
        text: this.startupPromptDisabled ? '启动提示：已关闭' : '启动提示：开启',
        color: '#90A4AE',
        textColor: '#FFFFFF',
        id: 'startupPromptToggle'
      });
    }
    if (!isCustomModeUnlocked) {
      if (this.themeSystem) {
        const themeColors = this.themeSystem.getThemeColors();
        ctx.fillStyle = themeColors.hud.warning;
        ctx.shadowColor = themeColors.hud.warning;
        ctx.shadowBlur = 5;
      } else {
        ctx.fillStyle = '#FF9800';
      }
      ctx.font = `${Math.floor(w * 0.03)}px Arial, sans-serif`;
      ctx.fillText('完成第二关解锁自选模式', w / 2, h * 0.85);
    }
    console.log('说明文字绘制完成');
    console.log('renderStartScreen执行完成，按钮数量:', this.buttons.length);
  }

  renderDifficultySelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (this.themeSystem) {
      this.themeSystem.applyBackgroundGradient(ctx, w, h);
      this.themeSystem.applyCyberpunkDecorations(ctx, w, h, Date.now());
      this.themeSystem.applyScanlines(ctx, w, h, Date.now());
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, '#FFF3E0');
      gradient.addColorStop(1, '#FFE0B2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      this.drawDecorativeCircles(ctx);
    }
    if (this.themeSystem) {
      const themeColors = this.themeSystem.getThemeColors();
      ctx.fillStyle = themeColors.primary;
      ctx.shadowColor = themeColors.primary;
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = '#E65100';
    }
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', w / 2, h * 0.15);
    const buttonWidth = w * 0.4;
    const buttonHeight = 80;
    const spacing = 20;
    const difficulties = [
      { text: '自由模式', time: 0, color: '#66BB6A', id: 'free', type: 'secondary' },
      { text: '1分钟', time: 60, color: '#FFA726', id: '60', type: 'primary' },
      { text: '2分钟', time: 120, color: '#FF7043', id: '120', type: 'accent' },
      { text: '3分钟', time: 180, color: '#EF5350', id: '180', type: 'accent' }
    ];
    difficulties.forEach((diff, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = w * 0.1 + col * (buttonWidth + spacing);
      const y = h * 0.3 + row * (buttonHeight + spacing);
      if (this.themeSystem) {
        this.drawButtonWithTheme(ctx, { x, y, width: buttonWidth, height: buttonHeight, text: diff.text, type: diff.type, id: diff.id });
      } else {
        this.drawDifficultyButton(ctx, { x, y, width: buttonWidth, height: buttonHeight, text: diff.text, color: diff.color, id: diff.id, time: diff.time });
      }
    });
    if (this.themeSystem) {
      this.drawButtonWithTheme(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', type: 'secondary', id: 'back' });
    } else {
      this.drawSmallButton(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', color: '#9E9E9E', id: 'back' });
    }
  }

  renderCustomModeSelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E8F5E9');
    gradient.addColorStop(1, '#C8E6C9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.fillStyle = '#2E7D32';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('自选模式', w / 2, h * 0.15);
    ctx.fillStyle = '#388E3C';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('选择你想要的挑战', w / 2, h * 0.22);
    const buttonWidth = w * 0.8;
    const buttonHeight = 60;
    const spacing = 15;
    const customModes = [
      { text: '1-10 练习模式', description: '适合新手练习', color: '#66BB6A', id: 'custom10' },
      { text: '1-100 挑战模式', description: '终极挑战', color: '#FF7043', id: 'custom100' }
    ];
    customModes.forEach((mode, index) => {
      const y = h * 0.35 + index * (buttonHeight + spacing);
      this.drawCustomModeButton(ctx, { x: w * 0.1, y, width: buttonWidth, height: buttonHeight, text: mode.text, description: mode.description, color: mode.color, id: mode.id });
    });
    this.drawSmallButton(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', color: '#9E9E9E', id: 'back' });
  }

  renderCustomTimeSelectScreen(data) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const mode = data ? data.mode : 10;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(1, '#BBDEFB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.fillStyle = '#1976D2';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${mode === 10 ? '1-10 练习' : '1-100 挑战'}`, w / 2, h * 0.15);
    ctx.fillStyle = '#1E88E5';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('选择时间限制', w / 2, h * 0.22);
    const buttonWidth = w * 0.4;
    const buttonHeight = 70;
    const horizontalSpacing = w * 0.05;
    const verticalSpacing = 20;
    const startX = (w - buttonWidth * 2 - horizontalSpacing) / 2;
    const startY = h * 0.35;
    const timeOptions = [
      { text: '自由模式', description: '无时间限制', color: '#66BB6A', id: 'customFree', difficulty: 0 },
      { text: '1分钟', description: '快速挑战', color: '#FFA726', id: 'custom60', difficulty: 60 },
      { text: '2分钟', description: '标准模式', color: '#FF7043', id: 'custom120', difficulty: 120 },
      { text: '3分钟', description: '充裕时间', color: '#EF5350', id: 'custom180', difficulty: 180 }
    ];
    timeOptions.forEach((option, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + col * (buttonWidth + horizontalSpacing);
      const y = startY + row * (buttonHeight + verticalSpacing);
      this.drawCustomModeButton(ctx, { x, y, width: buttonWidth, height: buttonHeight, text: option.text, description: option.description, color: option.color, id: option.id });
    });
    this.drawSmallButton(ctx, { x: 20, y: h - 70, width: 80, height: 40, text: '返回', color: '#9E9E9E', id: 'back' });
  }

  renderCustomModeExplanationScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E8F5E9');
    gradient.addColorStop(0.5, '#C8E6C9');
    gradient.addColorStop(1, '#A5D6A7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#2E7D32';
    ctx.font = `bold ${Math.floor(w * 0.08)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯 自选模式说明', w / 2, h * 0.12);
    ctx.restore();
    ctx.fillStyle = '#388E3C';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('选择适合你的挑战方式', w / 2, h * 0.19);
    this.drawExplanationCard(ctx, {
      x: w * 0.1, y: h * 0.26, width: w * 0.8, height: 140, icon: '📝', title: '1-10 练习模式', description: '适合新手练习',
      features: ['• 只需找到 1-10 的数字', '• 难度较低，轻松上手', '• 可选择时间限制或自由模式'], color: '#66BB6A'
    });
    this.drawExplanationCard(ctx, {
      x: w * 0.1, y: h * 0.48, width: w * 0.8, height: 140, icon: '🏆', title: '1-100 挑战模式', description: '终极挑战，考验专注力极限',
      features: ['• 完整的 1-100 数字挑战', '• 高难度，需要极强专注力', '• 多种时间限制可选'], color: '#FF7043'
    });
    ctx.fillStyle = '#424242';
    ctx.font = `${Math.floor(w * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('时间选项：自由模式 / 1分钟 / 2分钟 / 3分钟', w / 2, h * 0.72);
    this.drawButton(ctx, { x: w * 0.2, y: h * 0.78, width: w * 0.6, height: 55, text: '开始选择', color: '#4CAF50', textColor: '#FFFFFF', id: 'startCustomMode' });
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(w * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('点击开始选择你想要的挑战', w / 2, h * 0.9);
  }

  drawExplanationCard(ctx, config) {
    const { x, y, width, height, icon, title, description, features, color } = config;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = color;
    this.roundRect(ctx, x, y, 6, height, 12);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = `${Math.floor(this.width * 0.06)}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(icon, x + 20, y + 15);
    ctx.fillStyle = '#212121';
    ctx.font = `bold ${Math.floor(this.width * 0.045)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(title, x + 60, y + 18);
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(this.width * 0.032)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(description, x + 60, y + 45);
    ctx.fillStyle = '#424242';
    ctx.font = `${Math.floor(this.width * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const featureStartY = y + 70;
    const lineHeight = Math.floor(this.width * 0.04);
    features.forEach((feature, index) => {
      ctx.fillText(feature, x + 20, featureStartY + index * lineHeight);
    });
  }

  renderResultScreen(stats) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const isWin = stats.completed === 100;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    if (isWin) {
      gradient.addColorStop(0, '#E8F5E9');
      gradient.addColorStop(1, '#C8E6C9');
    } else {
      gradient.addColorStop(0, '#FFEBEE');
      gradient.addColorStop(1, '#FFCDD2');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = isWin ? '#2E7D32' : '#C62828';
    ctx.font = `bold ${Math.floor(w * 0.1)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(isWin ? '🎉 完成！' : '⏰ 时间到', w / 2, h * 0.2);
    ctx.restore();
    this.drawResultCard(ctx, { x: w * 0.1, y: h * 0.35, width: w * 0.8, height: 200, stats });
    this.drawButton(ctx, { x: w * 0.1, y: h * 0.65, width: w * 0.35, height: 50, text: '再来一局', color: '#4CAF50', textColor: '#FFFFFF', id: 'restart' });
    this.drawButton(ctx, { x: w * 0.55, y: h * 0.65, width: w * 0.35, height: 50, text: '返回首页', color: '#2196F3', textColor: '#FFFFFF', id: 'home' });
    this.drawButton(ctx, { x: w * 0.1, y: h * 0.75, width: w * 0.8, height: 50, text: '📤 分享成绩', color: '#FF9800', textColor: '#FFFFFF', id: 'share' });
  }

  renderAuthorizationScreen(data = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(0.5, '#BBDEFB');
    gradient.addColorStop(1, '#90CAF9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#1976D2';
    ctx.font = `${Math.floor(w * 0.15)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔐', w / 2, h * 0.2);
    ctx.restore();
    ctx.fillStyle = '#1565C0';
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('需要授权登录', w / 2, h * 0.32);
    const explanationLines = ['为了保存您的游戏进度和成绩', '需要获取您的抖音账号信息', '', '我们承诺：', '• 仅用于游戏数据同步', '• 不会获取您的个人隐私', '• 可随时在设置中取消授权'];
    ctx.fillStyle = '#424242';
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    let startY = h * 0.42;
    const lineHeight = Math.floor(w * 0.05);
    explanationLines.forEach((line, index) => {
      if (line.startsWith('•')) {
        ctx.textAlign = 'left';
        ctx.fillText(line, w * 0.15, startY + index * lineHeight);
        ctx.textAlign = 'center';
      } else if (line === '我们承诺：') {
        ctx.save();
        ctx.font = `bold ${Math.floor(w * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = '#1976D2';
        ctx.fillText(line, w / 2, startY + index * lineHeight);
        ctx.restore();
      } else if (line !== '') {
        ctx.fillText(line, w / 2, startY + index * lineHeight);
      }
    });
    this.drawButton(ctx, { x: w * 0.1, y: h * 0.75, width: w * 0.35, height: 50, text: '同意授权', color: '#4CAF50', textColor: '#FFFFFF', id: 'authorize' });
    this.drawButton(ctx, { x: w * 0.55, y: h * 0.75, width: w * 0.35, height: 50, text: '暂不授权', color: '#FF7043', textColor: '#FFFFFF', id: 'deny' });
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(w * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择"暂不授权"将使用本地存储，无法跨设备同步', w / 2, h * 0.88);
  }

  renderLevel2CompleteScreen(stats) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFF3E0');
    gradient.addColorStop(0.5, '#FFE0B2');
    gradient.addColorStop(1, '#FFCC80');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    this.drawDecorativeCircles(ctx);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#E65100';
    ctx.font = `bold ${Math.floor(w * 0.08)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🏆 全部通关！', w / 2, h * 0.15);
    ctx.restore();
    ctx.fillStyle = '#FF6F00';
    ctx.font = `${Math.floor(w * 0.045)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('恭喜完成第二关挑战！', w / 2, h * 0.22);
    this.drawUnlockNotification(ctx, { x: w * 0.1, y: h * 0.3, width: w * 0.8, height: 120 });
    this.drawResultCard(ctx, { x: w * 0.1, y: h * 0.52, width: w * 0.8, height: 140, stats });
    this.drawButton(ctx, { x: w * 0.1, y: h * 0.75, width: w * 0.35, height: 50, text: '体验自选', color: '#FF6B6B', textColor: '#FFFFFF', id: 'customMode' });
    this.drawButton(ctx, { x: w * 0.55, y: h * 0.75, width: w * 0.35, height: 50, text: '返回首页', color: '#4CAF50', textColor: '#FFFFFF', id: 'home' });
  }

  drawUnlockNotification(ctx, config) {
    const { x, y, width, height } = config;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#388E3C');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, x, y, width, height, 15);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.06)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔓', x + width / 2, y + height * 0.3);
    ctx.font = `bold ${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('自选模式已解锁！', x + width / 2, y + height * 0.6);
    ctx.font = `${Math.floor(this.width * 0.03)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('现在可以自由选择 1-10 练习或 1-100 挑战', x + width / 2, y + height * 0.8);
  }

  drawButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 25);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = btn.textColor || '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawButtonWithTheme(ctx, btn) {
    if (!this.themeSystem) {
      this.drawButton(ctx, { ...btn, color: btn.type === 'primary' ? '#FF6B6B' : '#4CAF50', textColor: '#FFFFFF' });
      return;
    }
    const buttonStyle = this.themeSystem.getButtonStyle(btn.type || 'primary');
    ctx.save();
    this.themeSystem.applyButtonGradient(ctx, btn.x, btn.y, btn.width, btn.height, btn.type || 'primary', 'normal');
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, buttonStyle.borderRadius || 25);
    ctx.fill();
    const themeColors = this.themeSystem.getThemeColors();
    const borderColor = btn.type === 'primary' ? themeColors.primary : btn.type === 'secondary' ? themeColors.secondary : themeColors.accent;
    this.themeSystem.applyNeonBorder(ctx, btn.x, btn.y, btn.width, btn.height, buttonStyle.borderRadius || 25, borderColor, 1.0);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = buttonStyle.textColor;
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    ctx.restore();
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawLockedButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#BDBDBD';
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 25);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(this.width * 0.04)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', btn.x + btn.width / 2 - 40, btn.y + btn.height / 2);
    ctx.fillStyle = '#757575';
    ctx.font = `bold ${Math.floor(this.width * 0.045)}px Arial, sans-serif`;
    ctx.fillText(btn.text, btn.x + btn.width / 2 + 10, btn.y + btn.height / 2);
  }

  drawDifficultyButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 15);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 - 10);
    if (btn.time > 0) {
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`限时 ${btn.time}秒`, btn.x + btn.width / 2, btn.y + btn.height / 2 + 15);
    } else {
      ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText('无时间限制', btn.x + btn.width / 2, btn.y + btn.height / 2 + 15);
    }
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height, time: btn.time });
  }

  drawSmallButton(ctx, btn) {
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawCustomModeButton(ctx, btn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = btn.color;
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 15);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 - 8);
    ctx.font = `${Math.floor(this.width * 0.035)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(btn.description, btn.x + btn.width / 2, btn.y + btn.height / 2 + 12);
    this.buttons.push({ id: btn.id, x: btn.x, y: btn.y, width: btn.width, height: btn.height });
  }

  drawResultCard(ctx, card) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, card.x, card.y, card.width, card.height, 15);
    ctx.fill();
    ctx.restore();
    const centerX = card.x + card.width / 2;
    const startY = card.y + 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('完成数量', centerX, startY);
    ctx.fillStyle = '#4CAF50';
    ctx.font = `bold ${Math.floor(this.width * 0.08)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`${card.stats.completed}/100`, centerX, startY + 30);
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.floor(this.width * 0.04)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`用时: ${this.formatTime(card.stats.time)}`, centerX - 80, startY + 80);
    ctx.fillText(`错误: ${card.stats.errors}次`, centerX + 80, startY + 80);
    if (card.stats.maxCombo > 0) {
      ctx.fillText(`最高连击: ${card.stats.maxCombo}`, centerX, startY + 120);
    }
  }

  drawDecorativeCircles(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    const circles = [
      { x: this.width * 0.1, y: this.height * 0.1, r: 40 },
      { x: this.width * 0.9, y: this.height * 0.15, r: 30 },
      { x: this.width * 0.15, y: this.height * 0.85, r: 35 },
      { x: this.width * 0.85, y: this.height * 0.9, r: 25 }
    ];
    circles.forEach((circle) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  setUserProfileManager(userProfileManager) {
    this.userProfileManager = userProfileManager;
  }

  handleClick(x, y) {
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        return btn;
      }
    }
    return null;
  }

  render(screen, data) {
    console.log('UIManager.render被调用, screen:', screen);
    this.buttons = [];
    this.currentScreen = screen;
    switch (screen) {
      case 'start':
        console.log('渲染开始界面');
        this.renderStartScreen();
        console.log('开始界面渲染完成');
        break;
      case 'difficultySelect':
        console.log('渲染难度选择界面');
        this.renderDifficultySelectScreen();
        break;
      case 'customModeSelect':
        console.log('渲染自选模式选择界面');
        this.renderCustomModeSelectScreen();
        break;
      case 'customModeExplanation':
        console.log('渲染自选模式说明界面');
        this.renderCustomModeExplanationScreen();
        break;
      case 'customTimeSelect':
        console.log('渲染自选模式时间选择界面');
        this.renderCustomTimeSelectScreen(data);
        break;
      case 'result':
        console.log('渲染结果界面');
        this.renderResultScreen(data);
        break;
      case 'level2Complete':
        console.log('渲染第二关完成界面');
        this.renderLevel2CompleteScreen(data);
        break;
      case 'authorization':
        console.log('渲染授权引导界面');
        this.renderAuthorizationScreen(data);
        break;
      default:
        console.error('未知的screen:', screen);
    }
  }
}

module.exports = UIManager;
