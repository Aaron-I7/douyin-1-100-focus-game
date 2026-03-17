/**
 * UIManagerWithFonts - 集成字体管理的 UI 管理器
 * 扩展原有 UI Manager，添加字体管理功能
 */

import FontManager from './ui-font-manager';

class UIManagerWithFonts {
  constructor(canvas, ctx, screenAdapter, themeSystem = null, fontManager = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    this.fontManager = fontManager || new FontManager();
    
    // UI 状态
    this.currentScreen = 'start';
    this.showOrientationHint = true;
    this.userProfileManager = null;
    
    // 字体应用配置
    this.fontApplications = {
      gameTitle: 'title',      // 游戏标题使用特色字体
      numbers: 'number',       // 数字使用等宽字体
      buttons: 'ui',           // 按钮文字使用 UI 字体
      labels: 'ui',            // 标签文字使用 UI 字体
      hints: 'ui',             // 提示文字使用 UI 字体
      results: 'ui'            // 结果文字使用 UI 字体
    };
  }

  /**
   * 设置字体管理器
   * @param {FontManager} fontManager - 字体管理器实例
   */
  setFontManager(fontManager) {
    this.fontManager = fontManager;
  }

  /**
   * 设置用户档案管理器
   * @param {UserProfileManager} userProfileManager - 用户档案管理器
   */
  setUserProfileManager(userProfileManager) {
    this.userProfileManager = userProfileManager;
  }

  /**
   * 应用字体到 Canvas 上下文
   * @param {string} fontType - 字体类型 ('title', 'number', 'ui')
   * @param {number} size - 字体大小
   * @param {string} weight - 字体粗细 ('normal', 'bold')
   */
  applyFont(fontType, size, weight = 'normal') {
    if (!this.fontManager) {
      // 降级到默认字体
      this.ctx.font = `${weight} ${size}px "PingFang SC", Arial, sans-serif`;
      return;
    }

    const fontFamily = this.fontManager.getFontFamily(fontType);
    this.ctx.font = `${weight} ${size}px ${fontFamily}`;
  }

  /**
   * 渲染游戏标题（使用特色字体）
   */
  drawGameTitle(ctx) {
    const dims = this.screenAdapter.calculateDimensions();
    const centerX = this.canvas.width / 2;
    const titleY = this.canvas.height * 0.25;

    // 应用标题字体
    this.applyFont('title', dims.fontSize * 2.2, 'bold');
    
    // 设置文字样式
    ctx.fillStyle = this.themeSystem?.getThemeColors().primary || '#FF6B6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加文字阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 绘制标题
    ctx.fillText('1-100 专注力挑战', centerX, titleY);
    
    // 清除阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 绘制副标题（使用 UI 字体）
    this.applyFont('ui', dims.fontSize * 0.9, 'normal');
    ctx.fillStyle = this.themeSystem?.getThemeColors().secondary || '#4ECDC4';
    ctx.fillText('专注力训练游戏', centerX, titleY + dims.fontSize * 1.8);
  }

  /**
   * 绘制按钮文字（使用 UI 字体）
   * @param {Object} config - 按钮配置
   */
  drawButtonText(config) {
    const { x, y, width, height, text, fontSize } = config;
    
    // 应用 UI 字体
    this.applyFont('ui', fontSize, 'bold');
    
    // 设置文字样式
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 绘制文字
    this.ctx.fillText(text, x + width / 2, y + height / 2);
  }

  /**
   * 绘制数字（使用等宽字体）
   * @param {number} number - 数字
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} size - 字体大小
   * @param {string} color - 文字颜色
   */
  drawNumber(number, x, y, size, color = '#333333') {
    // 应用数字字体
    this.applyFont('number', size, 'bold');
    
    // 设置文字样式
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 绘制数字
    this.ctx.fillText(number.toString(), x, y);
  }

  /**
   * 绘制标签文字（使用 UI 字体）
   * @param {string} text - 文字内容
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} size - 字体大小
   * @param {string} color - 文字颜色
   * @param {string} align - 对齐方式
   */
  drawLabel(text, x, y, size, color = '#333333', align = 'left') {
    // 应用 UI 字体
    this.applyFont('ui', size, 'normal');
    
    // 设置文字样式
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'middle';
    
    // 绘制文字
    this.ctx.fillText(text, x, y);
  }

  /**
   * 绘制时间显示（使用数字字体）
   * @param {number} seconds - 秒数
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} size - 字体大小
   * @param {string} color - 文字颜色
   */
  drawTime(seconds, x, y, size, color = '#333333') {
    const timeText = this.formatTime(seconds);
    
    // 应用数字字体
    this.applyFont('number', size, 'normal');
    
    // 设置文字样式
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 绘制时间
    this.ctx.fillText(timeText, x, y);
  }

  /**
   * 渲染游戏 HUD（包含字体应用）
   * @param {Object} gameState - 游戏状态
   */
  renderGameHUD(gameState) {
    const dims = this.screenAdapter.calculateDimensions();
    const hudHeight = dims.hudHeight;
    const fontSize = dims.fontSize;

    // 清除 HUD 区域
    this.ctx.clearRect(0, 0, this.canvas.width, hudHeight);

    // 绘制背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, hudHeight);

    // 当前目标数字（使用数字字体）
    const targetY = hudHeight * 0.4;
    this.drawLabel('目标:', 20, targetY, fontSize * 0.8, '#666666');
    this.drawNumber(gameState.currentNumber, 80, targetY, fontSize * 1.2, '#FF6B6B');

    // 时间显示（使用数字字体）
    const timeX = this.canvas.width / 2;
    if (gameState.timeLeft > 0) {
      // 倒计时模式
      const color = gameState.timeLeft < 10 ? '#EF5350' : '#333333';
      this.drawTime(gameState.timeLeft, timeX, targetY, fontSize, color);
    } else {
      // 正计时模式
      this.drawTime(gameState.elapsedTime, timeX, targetY, fontSize, '#333333');
    }

    // 错误次数（使用 UI 字体）
    const errorX = this.canvas.width - 20;
    this.drawLabel(`错误: ${gameState.errors}`, errorX, targetY, fontSize * 0.8, '#EF5350', 'right');

    // 进度条
    this.drawProgressBar(gameState);
  }

  /**
   * 绘制进度条
   * @param {Object} gameState - 游戏状态
   */
  drawProgressBar(gameState) {
    const dims = this.screenAdapter.calculateDimensions();
    const barY = dims.hudHeight * 0.7;
    const barWidth = this.canvas.width - 40;
    const barHeight = 6;
    const barX = 20;

    // 计算进度
    const progress = (gameState.currentNumber - 1) / gameState.totalNumbers;

    // 绘制背景
    this.ctx.fillStyle = '#E0E0E0';
    this.roundRect(this.ctx, barX, barY, barWidth, barHeight, 3);
    this.ctx.fill();

    // 绘制进度
    if (progress > 0) {
      const progressWidth = barWidth * progress;
      const gradient = this.ctx.createLinearGradient(barX, 0, barX + progressWidth, 0);
      gradient.addColorStop(0, '#4ECDC4');
      gradient.addColorStop(1, '#44A08D');
      
      this.ctx.fillStyle = gradient;
      this.roundRect(this.ctx, barX, barY, progressWidth, barHeight, 3);
      this.ctx.fill();
    }
  }

  /**
   * 渲染结果界面（使用字体管理）
   * @param {Object} stats - 游戏统计
   */
  renderResultScreen(stats) {
    const dims = this.screenAdapter.calculateDimensions();
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制背景
    if (this.themeSystem) {
      this.themeSystem.applyBackgroundGradient(this.ctx, this.canvas.width, this.canvas.height);
    }

    // 结果标题（使用标题字体）
    const titleY = centerY - dims.fontSize * 3;
    this.applyFont('title', dims.fontSize * 1.8, 'bold');
    this.ctx.fillStyle = stats.completed ? '#4CAF50' : '#EF5350';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(stats.completed ? '挑战完成！' : '挑战失败', centerX, titleY);

    // 统计信息（使用 UI 字体和数字字体）
    const statsY = centerY - dims.fontSize;
    const lineHeight = dims.fontSize * 1.5;

    // 完成时间
    this.drawLabel('完成时间:', centerX - 60, statsY, dims.fontSize, '#666666', 'right');
    this.drawTime(stats.time, centerX + 60, statsY, dims.fontSize, '#333333');

    // 错误次数
    this.drawLabel('错误次数:', centerX - 60, statsY + lineHeight, dims.fontSize, '#666666', 'right');
    this.drawNumber(stats.errors, centerX + 60, statsY + lineHeight, dims.fontSize, '#EF5350');

    // 新纪录提示
    if (stats.isNewRecord) {
      this.applyFont('title', dims.fontSize * 1.2, 'bold');
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText('🏆 新纪录！', centerX, statsY + lineHeight * 2.5);
    }

    // 按钮
    this.drawResultButtons();
  }

  /**
   * 绘制结果界面按钮
   */
  drawResultButtons() {
    const dims = this.screenAdapter.calculateDimensions();
    const centerX = this.canvas.width / 2;
    const buttonY = this.canvas.height * 0.75;
    const buttonWidth = dims.buttonSize * 2.5;
    const buttonHeight = dims.buttonSize * 0.8;
    const buttonSpacing = dims.buttonSize * 3;

    // 再来一局按钮
    const playAgainX = centerX - buttonSpacing / 2 - buttonWidth / 2;
    this.drawThemedButton({
      x: playAgainX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: '再来一局',
      type: 'primary',
      fontSize: dims.fontSize
    });

    // 返回首页按钮
    const homeX = centerX + buttonSpacing / 2 - buttonWidth / 2;
    this.drawThemedButton({
      x: homeX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: '返回首页',
      type: 'secondary',
      fontSize: dims.fontSize
    });
  }

  /**
   * 绘制主题按钮（集成字体）
   * @param {Object} config - 按钮配置
   */
  drawThemedButton(config) {
    const { x, y, width, height, text, type = 'primary', fontSize } = config;
    
    // 获取主题颜色
    const colors = this.themeSystem?.getThemeColors() || {
      primary: '#FF6B6B',
      secondary: '#4ECDC4'
    };
    
    const buttonColor = colors[type] || colors.primary;
    
    // 绘制按钮背景
    this.ctx.fillStyle = buttonColor;
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 4;
    
    this.roundRect(this.ctx, x, y, width, height, height / 2);
    this.ctx.fill();
    
    // 清除阴影
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
    
    // 绘制按钮文字
    this.drawButtonText({ x, y, width, height, text, fontSize });
  }

  /**
   * 格式化时间显示
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间字符串
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 绘制圆角矩形
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} radius - 圆角半径
   */
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

  /**
   * 检查字体加载状态并显示提示
   */
  showFontLoadingStatus() {
    if (!this.fontManager) return;

    const progress = this.fontManager.getLoadingProgress();
    
    if (!progress.isComplete) {
      // 显示字体加载提示
      const dims = this.screenAdapter.calculateDimensions();
      const centerX = this.canvas.width / 2;
      const hintY = this.canvas.height * 0.9;
      
      this.applyFont('ui', dims.fontSize * 0.7, 'normal');
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `字体加载中... ${Math.round(progress.progress * 100)}%`,
        centerX,
        hintY
      );
    }
  }

  /**
   * 获取字体应用状态
   * @returns {Object} 字体应用状态
   */
  getFontApplicationStatus() {
    if (!this.fontManager) {
      return { available: false, fallback: true };
    }

    const status = {};
    for (const [usage, fontType] of Object.entries(this.fontApplications)) {
      status[usage] = {
        fontType,
        loaded: this.fontManager.isFontLoaded(fontType),
        family: this.fontManager.getFontFamily(fontType)
      };
    }

    return { available: true, applications: status };
  }
}

export default UIManagerWithFonts;