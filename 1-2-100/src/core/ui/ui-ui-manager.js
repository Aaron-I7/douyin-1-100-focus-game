/**
 * UI管理器 - 使用新的主题系统
 * 负责所有界面渲染和用户交互
 */

// 导入 ThemeSystem
if (typeof require !== 'undefined') {
  const ThemeSystem = require('./ui-theme-system');
} else if (typeof window !== 'undefined' && window.ThemeSystem) {
  // 浏览器环境下使用全局 ThemeSystem
}

class UIManager {
  constructor(canvas, ctx, screenAdapter, themeSystem = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem || new ThemeSystem();
    
    // 使用逻辑尺寸
    this.width = screenAdapter.screenWidth;
    this.height = screenAdapter.screenHeight;
    
    this.currentScreen = 'start';
    this.selectedDifficulty = null;
    this.buttons = [];
    this.onStartGame = null;
    this.userProfileManager = null;
    
    // 按钮交互状态管理
    this.pressedButton = null;
    this.buttonPressTime = 0;
    
    // 动画引擎
    this.animationEngine = new AnimationEngine();
    
    // 触摸反馈设置
    this.enableHapticFeedback = true;
    this.enableClickAnimations = true;
    
    // 横屏提示控制
    this.hideOrientationHintFlag = false;
    
    console.log('UIManager初始化, 使用新主题系统');
  }

  /**
   * 设置用户档案管理器
   */
  setUserProfileManager(userProfileManager) {
    this.userProfileManager = userProfileManager;
  }

  /**
   * 渲染主菜单（使用新主题系统）
   */
  renderStartScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 清空按钮数组
    this.buttons = [];
    
    // 应用背景渐变
    this.themeSystem.applyBackgroundGradient(ctx, w, h);
    
    // 绘制装饰性元素
    this.drawDecorativeElements(ctx);
    
    // 渲染横屏提示（如果适用）
    this.renderOrientationHint();
    
    // 游戏标题
    this.drawGameTitle(ctx);
    
    // 检查自选模式解锁状态和用户进度
    const isCustomModeUnlocked = this.userProfileManager ? 
      this.userProfileManager.isCustomModeUnlocked() : false;
    
    const hasProgress = this.userProfileManager ? 
      (this.userProfileManager.isLevelCompleted(1) || this.userProfileManager.isLevelCompleted(2)) : false;
    
    // 主要按钮
    this.drawMainMenuButtons(ctx, isCustomModeUnlocked, hasProgress);
    
    // 说明文字
    this.drawInstructionText(ctx, isCustomModeUnlocked);
  }

  /**
   * 绘制霓虹赛博朋克游戏标题
   */
  drawGameTitle(ctx) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    // 主标题 - 霓虹蓝发光效果
    ctx.save();
    
    // 多层发光效果
    const glowLayers = [
      { blur: 30, alpha: 0.8, color: theme.primary },
      { blur: 15, alpha: 0.6, color: theme.primaryLight },
      { blur: 5, alpha: 1.0, color: '#FFFFFF' }
    ];
    
    glowLayers.forEach((layer, index) => {
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = layer.blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = layer.alpha;
      
      ctx.fillStyle = layer.color;
      ctx.font = `bold ${Math.floor(w * 0.12)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1-100', w / 2, h * 0.25);
    });
    
    ctx.restore();
    
    // 副标题 - 激光绿发光
    ctx.save();
    ctx.shadowColor = theme.secondary;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = theme.secondary;
    ctx.font = `bold ${Math.floor(w * 0.045)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('专注力挑战', w / 2, h * 0.35);
    ctx.restore();
    
    // 添加脉冲效果到标题
    const pulseIntensity = this.themeSystem.getPulseIntensity(Date.now(), 1);
    if (pulseIntensity > 0.7) {
      ctx.save();
      ctx.globalAlpha = (pulseIntensity - 0.7) * 0.5;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 40;
      ctx.fillStyle = theme.accent;
      ctx.font = `bold ${Math.floor(w * 0.12)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1-100', w / 2, h * 0.25);
      ctx.restore();
    }
  }

  /**
   * 绘制主菜单按钮
   */
  drawMainMenuButtons(ctx, isCustomModeUnlocked, hasProgress = false) {
    const w = this.width;
    const h = this.height;
    
    // 开始游戏/继续游戏按钮
    this.drawThemedButton(ctx, {
      x: w * 0.2,
      y: h * 0.5,
      width: w * 0.6,
      height: 60,
      text: hasProgress ? '继续游戏' : '开始游戏',
      type: 'primary',
      id: 'start'
    });
    
    // 自选模式按钮
    if (isCustomModeUnlocked) {
      this.drawThemedButton(ctx, {
        x: w * 0.2,
        y: h * 0.58,
        width: w * 0.6,
        height: 50,
        text: '自选模式',
        type: 'secondary',
        id: 'customMode'
      });
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
    
    // 我的成绩按钮
    this.drawThemedButton(ctx, {
      x: w * 0.2,
      y: h * 0.66,
      width: w * 0.6,
      height: 45,
      text: '我的成绩',
      type: 'accent',
      id: 'scores'
    });
  }

  /**
   * 绘制说明文字
   */
  drawInstructionText(ctx, isCustomModeUnlocked) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    // 游戏说明
    ctx.fillStyle = theme.hud.textSecondary;
    ctx.font = `${Math.floor(w * 0.035)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('按顺序点击 1-100 的数字', w / 2, h * 0.75);
    ctx.fillText('挑战你的专注力极限！', w / 2, h * 0.8);
    
    // 解锁提示文字
    if (!isCustomModeUnlocked) {
      ctx.fillStyle = theme.accent;
      ctx.font = `${Math.floor(w * 0.03)}px "PingFang SC", sans-serif`;
      ctx.fillText('完成第二关解锁自选模式', w / 2, h * 0.85);
    }
  }

  /**
   * 渲染横屏提示（如果适用）
   */
  renderOrientationHint() {
    const orientation = this.screenAdapter.getOrientation();
    if (orientation !== 'landscape' || this.hideOrientationHintFlag) return;
    
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const hintStyle = this.themeSystem.getOrientationHintStyle();
    const dims = this.screenAdapter.calculateDimensions();
    
    // 提示位置：顶部居中
    const hintY = dims.hudHeight * 0.3;
    const hintText = '💡 横屏体验更清晰';
    
    ctx.save();
    
    // 半透明背景
    ctx.fillStyle = hintStyle.bg;
    ctx.fillRect(0, 0, w, dims.hudHeight * 0.5);
    
    // 提示文字
    ctx.fillStyle = hintStyle.text;
    ctx.font = `${dims.fontSize * 0.7}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hintText, w / 2, hintY);
    
    ctx.restore();
  }

  /**
   * 隐藏横屏提示
   */
  hideOrientationHint() {
    this.hideOrientationHintFlag = true;
  }

  /**
   * 绘制装饰性元素
   */
  drawDecorativeElements(ctx) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    // 绘制装饰性圆点
    ctx.save();
    ctx.globalAlpha = 0.1;
    
    const dotCount = 20;
    for (let i = 0; i < dotCount; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const radius = Math.random() * 15 + 5;
      const colorIndex = Math.floor(Math.random() * theme.effects.particle.length);
      
      ctx.fillStyle = theme.effects.particle[colorIndex];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * 绘制霓虹赛博朋克主题化按钮
   */
  drawThemedButton(ctx, config) {
    const { x, y, width, height, text, type = 'primary', id } = config;
    const theme = this.themeSystem.getThemeColors();
    
    // 检查按钮是否被按下
    const isPressed = this.pressedButton && this.pressedButton.id === id;
    const pressScale = isPressed ? 0.95 : 1.0;
    const pressOffset = isPressed ? 2 : 0;
    
    ctx.save();
    
    // 应用按下效果的变换
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(pressScale, pressScale);
    ctx.translate(-width / 2, -height / 2 + pressOffset);
    
    // 应用霓虹按钮渐变背景
    this.themeSystem.applyButtonGradient(ctx, 0, 0, width, height, type, isPressed ? 'active' : 'normal');
    
    // 绘制按钮背景
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 25);
    ctx.fill();
    
    // 霓虹边框效果
    const borderColor = type === 'primary' ? theme.primary : 
                       type === 'secondary' ? theme.secondary : 
                       type === 'accent' ? theme.accent : theme.primary;
    
    this.themeSystem.applyNeonBorder(
      ctx, 0, 0, width, height, 25, 
      borderColor, 
      isPressed ? 0.7 : 1.0
    );
    
    ctx.restore();
    
    // 按钮文字（带发光效果）
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(pressScale, pressScale);
    
    // 文字发光效果
    ctx.shadowColor = type === 'primary' ? theme.primary : 
                     type === 'secondary' ? theme.secondary : 
                     type === 'accent' ? theme.accent : theme.primary;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = type === 'accent' ? '#FFFFFF' : '#000000'; // 根据按钮类型调整文字颜色
    ctx.font = `bold ${Math.floor(this.width * 0.05)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, pressOffset);
    ctx.restore();
    
    // 保存按钮信息用于点击检测
    this.buttons.push({
      ...config,
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      type: type,
      text: text
    });
  }

  /**
   * 绘制锁定状态的按钮
   */
  drawLockedButton(ctx, config) {
    const { x, y, width, height, text, id } = config;
    const theme = this.themeSystem.getThemeColors();
    
    ctx.save();
    
    // 较淡的阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    
    // 按钮背景（灰色，表示禁用）
    ctx.fillStyle = '#BDBDBD';
    this.roundRect(ctx, x, y, width, height, 25);
    ctx.fill();
    
    ctx.restore();
    
    // 锁定图标
    ctx.fillStyle = '#757575';
    ctx.font = `${Math.floor(this.width * 0.04)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', x + width / 2 - 40, y + height / 2);
    
    // 按钮文字（灰色）
    ctx.fillStyle = '#757575';
    ctx.font = `bold ${Math.floor(this.width * 0.045)}px "PingFang SC", sans-serif`;
    ctx.fillText(text, x + width / 2 + 10, y + height / 2);
    
    // 不添加到可点击按钮列表中，因为是锁定状态
  }

  /**
   * 渲染游戏结果界面（使用新主题系统）
   */
  renderResultScreen(stats) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 清空按钮数组
    this.buttons = [];
    
    // 应用背景渐变
    this.themeSystem.applyBackgroundGradient(ctx, w, h);
    
    // 绘制装饰性元素
    this.drawDecorativeElements(ctx);
    
    // 渲染横屏提示
    this.renderOrientationHint();
    
    // 结果标题（显示完成状态）
    this.drawResultTitle(ctx, stats);
    
    // 成绩卡片（显示完成时间、错误次数、新纪录提示）
    this.drawResultCard(ctx, stats);
    
    // 新纪录动画效果
    if (stats.isNewRecord) {
      this.drawNewRecordAnimation(ctx, stats);
    }
    
    // 操作按钮（再来一局、返回首页、分享）
    this.drawResultButtons(ctx, stats);
  }

  /**
   * 绘制结果标题
   */
  drawResultTitle(ctx, stats) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    // 判断完成状态
    const isCompleted = stats.completed === (stats.totalNumbers || 100);
    const isTimeout = stats.timeLeft !== undefined && stats.timeLeft <= 0 && !isCompleted;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    
    // 根据完成状态显示不同的标题和颜色
    let titleText, titleColor;
    if (isCompleted) {
      titleText = '🎉 完成！';
      titleColor = theme.secondary;
    } else if (isTimeout) {
      titleText = '⏰ 超时';
      titleColor = theme.button.danger.bg;
    } else {
      titleText = '🔄 未完成';
      titleColor = theme.hud.textSecondary;
    }
    
    ctx.fillStyle = titleColor;
    ctx.font = `bold ${Math.floor(w * 0.1)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(titleText, w / 2, h * 0.2);
    
    ctx.restore();
  }

  /**
   * 绘制成绩卡片
   */
  drawResultCard(ctx, stats) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    const cardX = w * 0.1;
    const cardY = h * 0.35;
    const cardWidth = w * 0.8;
    const cardHeight = stats.isNewRecord ? 240 : 200; // 新纪录时增加高度
    
    // 卡片背景
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    
    ctx.restore();
    
    // 卡片内容
    const textColor = theme.hud.text;
    const labelColor = theme.hud.textSecondary;
    let currentY = cardY + 35;
    
    // 完成数量/进度
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.floor(w * 0.05)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    
    const isCompleted = stats.completed === (stats.totalNumbers || 100);
    const progressText = isCompleted ? 
      `✅ 全部完成 (${stats.totalNumbers || 100})` : 
      `进度: ${stats.completed}/${stats.totalNumbers || 100}`;
    ctx.fillText(progressText, w / 2, currentY);
    currentY += 35;
    
    // 完成时间
    ctx.fillStyle = labelColor;
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", sans-serif`;
    ctx.fillText('完成时间', w / 2, currentY);
    currentY += 25;
    
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.floor(w * 0.045)}px "Courier New", monospace`;
    const timeStr = this.formatTime(stats.time);
    ctx.fillText(timeStr, w / 2, currentY);
    currentY += 35;
    
    // 错误次数
    ctx.fillStyle = labelColor;
    ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", sans-serif`;
    ctx.fillText('错误次数', w / 2, currentY);
    currentY += 25;
    
    ctx.fillStyle = stats.errors > 0 ? theme.button.danger.bg : theme.secondary;
    ctx.font = `bold ${Math.floor(w * 0.045)}px "PingFang SC", sans-serif`;
    const errorText = stats.errors === 0 ? '完美！' : `${stats.errors} 次`;
    ctx.fillText(errorText, w / 2, currentY);
    currentY += 30;
    
    // 新纪录提示（静态显示）
    if (stats.isNewRecord) {
      ctx.fillStyle = theme.accent;
      ctx.font = `bold ${Math.floor(w * 0.04)}px "PingFang SC", sans-serif`;
      ctx.fillText('🏆 新纪录！', w / 2, currentY);
    }
  }

  /**
   * 绘制结果界面按钮
   */
  drawNewRecordAnimation(ctx, stats) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    // 如果有动画引擎，添加庆祝动画
    if (this.animationEngine) {
      // 添加粒子庆祝效果（在卡片中心）
      const centerX = w / 2;
      const centerY = h * 0.45;
      
      // 每次渲染时有小概率添加粒子（避免过多粒子）
      if (Math.random() < 0.3) {
        this.animationEngine.addParticleEffect(centerX, centerY, 5, {
          colors: [theme.accent, theme.secondary, theme.primary],
          minSize: 3,
          maxSize: 8,
          minSpeed: 30,
          maxSpeed: 80,
          duration: 1200
        });
      }
      
      // 添加"新纪录"文字的脉冲效果
      const recordTextY = h * 0.58;
      if (Math.random() < 0.1) {
        this.animationEngine.addFloatingText(
          centerX + (Math.random() - 0.5) * 100,
          recordTextY + (Math.random() - 0.5) * 20,
          '🏆',
          theme.accent,
          Math.floor(w * 0.06),
          800
        );
      }
    }
    
    // 绘制闪烁的新纪录背景效果
    const time = Date.now();
    const pulseAlpha = 0.1 + 0.1 * Math.sin(time * 0.005);
    
    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = theme.accent;
    
    // 在整个卡片区域添加微妙的闪烁效果
    const cardX = w * 0.1;
    const cardY = h * 0.35;
    const cardWidth = w * 0.8;
    const cardHeight = 240;
    
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    ctx.restore();
  }

  drawResultButtons(ctx, stats) {
    const w = this.width;
    const h = this.height;
    
    // 根据是否有新纪录调整按钮位置
    const baseY = stats.isNewRecord ? h * 0.68 : h * 0.65;
    
    // 再来一局按钮（使用相同设置）
    this.drawThemedButton(ctx, {
      x: w * 0.1,
      y: baseY,
      width: w * 0.35,
      height: 50,
      text: '再来一局',
      type: 'success',
      id: 'restart',
      // 存储当前游戏设置以便重新开始时使用
      gameSettings: {
        level: stats.level,
        customMode: stats.customMode,
        difficulty: stats.difficulty
      }
    });
    
    // 返回首页按钮
    this.drawThemedButton(ctx, {
      x: w * 0.55,
      y: baseY,
      width: w * 0.35,
      height: 50,
      text: '返回首页',
      type: 'primary',
      id: 'home'
    });
    
    // 分享按钮
    this.drawThemedButton(ctx, {
      x: w * 0.1,
      y: baseY + 60,
      width: w * 0.8,
      height: 50,
      text: '📤 分享成绩',
      type: 'accent',
      id: 'share',
      // 存储分享数据
      shareData: {
        level: stats.level,
        time: stats.time,
        errors: stats.errors,
        completed: stats.completed,
        totalNumbers: stats.totalNumbers
      }
    });
  }

  /**
   * 渲染自选模式选择界面
   */
  renderCustomModeSelectScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 清空按钮数组
    this.buttons = [];
    
    // 应用背景渐变
    this.themeSystem.applyBackgroundGradient(ctx, w, h);
    
    // 绘制装饰性元素
    this.drawDecorativeElements(ctx);
    
    // 渲染横屏提示
    this.renderOrientationHint();
    
    // 标题
    this.drawSectionTitle(ctx, '自选模式', '选择你想要的挑战');
    
    // 模式选项按钮
    this.drawCustomModeOptions(ctx);
    
    // 返回按钮
    this.drawBackButton(ctx);
  }

  /**
   * 绘制章节标题
   */
  drawSectionTitle(ctx, title, subtitle) {
    const w = this.width;
    const h = this.height;
    const theme = this.themeSystem.getThemeColors();
    
    // 主标题
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = theme.primary;
    ctx.font = `bold ${Math.floor(w * 0.07)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, h * 0.15);
    
    ctx.restore();
    
    // 副标题
    if (subtitle) {
      ctx.fillStyle = theme.primaryDark;
      ctx.font = `${Math.floor(w * 0.04)}px "PingFang SC", sans-serif`;
      ctx.fillText(subtitle, w / 2, h * 0.22);
    }
  }

  /**
   * 绘制自选模式选项
   */
  drawCustomModeOptions(ctx) {
    const w = this.width;
    const h = this.height;
    
    // 1-10 练习模式
    this.drawModeOptionCard(ctx, {
      x: w * 0.1,
      y: h * 0.35,
      width: w * 0.8,
      height: 80,
      icon: '📝',
      title: '1-10 练习模式',
      description: '适合新手练习和热身',
      type: 'secondary',
      id: 'custom10'
    });
    
    // 1-100 挑战模式
    this.drawModeOptionCard(ctx, {
      x: w * 0.1,
      y: h * 0.5,
      width: w * 0.8,
      height: 80,
      icon: '🏆',
      title: '1-100 挑战模式',
      description: '终极挑战，考验专注力极限',
      type: 'danger',
      id: 'custom100'
    });
  }

  /**
   * 绘制模式选项卡片
   */
  drawModeOptionCard(ctx, config) {
    const { x, y, width, height, icon, title, description, type, id } = config;
    const buttonStyle = this.themeSystem.getButtonStyle(type);
    
    ctx.save();
    
    // 卡片阴影
    ctx.shadowColor = buttonStyle.shadowColor;
    ctx.shadowBlur = buttonStyle.shadowBlur;
    ctx.shadowOffsetY = buttonStyle.shadowOffsetY;
    
    // 卡片背景
    ctx.fillStyle = buttonStyle.backgroundColor;
    this.roundRect(ctx, x, y, width, height, 15);
    ctx.fill();
    
    ctx.restore();
    
    // 图标
    ctx.fillStyle = buttonStyle.textColor;
    ctx.font = `${Math.floor(this.width * 0.06)}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x + 20, y + height / 2);
    
    // 标题
    ctx.fillStyle = buttonStyle.textColor;
    ctx.font = `bold ${Math.floor(this.width * 0.045)}px "PingFang SC", sans-serif`;
    ctx.fillText(title, x + 70, y + height / 2 - 10);
    
    // 描述
    ctx.font = `${Math.floor(this.width * 0.032)}px "PingFang SC", sans-serif`;
    ctx.fillText(description, x + 70, y + height / 2 + 15);
    
    // 保存按钮信息
    this.buttons.push({
      id: id,
      x: x,
      y: y,
      width: width,
      height: height
    });
  }

  /**
   * 绘制返回按钮
   */
  drawBackButton(ctx) {
    const h = this.height;
    
    this.drawThemedButton(ctx, {
      x: 20,
      y: h - 70,
      width: 80,
      height: 40,
      text: '返回',
      type: 'secondary',
      id: 'back'
    });
  }

  /**
   * 格式化时间
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 绘制圆角矩形
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
   * 处理点击事件
   */
  /**
   * 颜色变暗工具方法
   */
  darkenColor(color, amount) {
    // 简单的颜色变暗实现
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
      const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
      const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  /**
   * 处理按钮按下事件
   */
  handleButtonPress(x, y) {
    const button = this.handleClick(x, y);
    if (button) {
      this.pressedButton = button;
      this.buttonPressTime = Date.now();
      
      // 触觉反馈
      if (this.enableHapticFeedback && typeof tt !== 'undefined' && tt.vibrateShort) {
        tt.vibrateShort();
      }
      
      // 按钮按下动画
      if (this.enableClickAnimations) {
        this.animationEngine.addBounceEffect(
          button.x + button.width / 2,
          button.y + button.height / 2,
          Math.min(button.width, button.height) / 4,
          {
            color: this.themeSystem.getButtonStyle(button.type || 'primary').backgroundColor,
            maxScale: 1.1,
            duration: 200,
            bounceType: 'simple'
          }
        );
      }
      
      return button;
    }
    return null;
  }

  /**
   * 处理按钮释放事件
   */
  handleButtonRelease(x, y) {
    if (this.pressedButton) {
      const button = this.handleClick(x, y);
      const wasPressed = this.pressedButton;
      this.pressedButton = null;
      
      // 检查是否在同一个按钮上释放
      if (button && button.id === wasPressed.id) {
        // 点击动画
        if (this.enableClickAnimations) {
          this.animationEngine.addRippleEffect(
            button.x + button.width / 2,
            button.y + button.height / 2,
            Math.max(button.width, button.height) / 2,
            {
              color: this.themeSystem.getButtonStyle(button.type || 'primary').backgroundColor,
              duration: 400,
              lineWidth: 2
            }
          );
        }
        
        return button;
      }
    }
    
    this.pressedButton = null;
    return null;
  }

  /**
   * 更新动画
   */
  updateAnimations() {
    this.animationEngine.update(this.ctx);
  }

  handleClick(x, y) {
    for (const button of this.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        return button;
      }
    }
    return null;
  }

  /**
   * 通用渲染方法
   */
  renderScoresScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 清空按钮数组
    this.buttons = [];
    
    // 应用背景渐变
    this.themeSystem.applyBackgroundGradient(ctx, w, h);
    
    // 绘制装饰性元素
    this.drawDecorativeElements(ctx);
    
    // 渲染横屏提示（如果适用）
    this.renderOrientationHint();
    
    // 标题
    this.drawScoresTitle(ctx);
    
    // 成绩内容
    this.drawScoresContent(ctx);
    
    // 返回按钮
    this.drawBackButton(ctx);
  }

  drawScoresTitle(ctx) {
    const w = this.width;
    const h = this.height;
    const colors = this.themeSystem.getThemeColors();
    
    ctx.save();
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${Math.min(w * 0.08, 32)}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('我的成绩', w / 2, h * 0.12);
    ctx.restore();
  }

  drawScoresContent(ctx) {
    const w = this.width;
    const h = this.height;
    const colors = this.themeSystem.getThemeColors();
    
    if (!this.userProfileManager) {
      // 显示无数据提示
      ctx.save();
      ctx.fillStyle = colors.text.secondary;
      ctx.font = `${Math.min(w * 0.04, 16)}px "PingFang SC"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无成绩数据', w / 2, h / 2);
      ctx.restore();
      return;
    }
    
    const profile = this.userProfileManager.getProfile();
    const allBestScores = this.userProfileManager.getAllBestScores();
    const userStats = this.userProfileManager.getUserStats();
    
    let yOffset = h * 0.2;
    const cardHeight = 80;
    const cardSpacing = 15;
    
    // 总体统计
    this.drawStatsCard(ctx, {
      x: w * 0.1,
      y: yOffset,
      width: w * 0.8,
      height: cardHeight,
      title: '总体统计',
      stats: [
        `总游戏次数: ${userStats.totalGames}`,
        `总错误次数: ${userStats.totalErrors}`
      ]
    });
    yOffset += cardHeight + cardSpacing;
    
    // 关卡成绩
    if (allBestScores.level1) {
      this.drawScoreCard(ctx, {
        x: w * 0.1,
        y: yOffset,
        width: w * 0.8,
        height: cardHeight,
        title: '第一关 (1-10)',
        score: allBestScores.level1
      });
      yOffset += cardHeight + cardSpacing;
    }
    
    if (allBestScores.level2) {
      this.drawScoreCard(ctx, {
        x: w * 0.1,
        y: yOffset,
        width: w * 0.8,
        height: cardHeight,
        title: '第二关 (1-100)',
        score: allBestScores.level2
      });
      yOffset += cardHeight + cardSpacing;
    }
    
    // 自选模式成绩
    const customScores = this.userProfileManager.getBestScoresByCategory('custom');
    if (Object.keys(customScores).length > 0) {
      this.drawCustomScoresSection(ctx, customScores, yOffset);
    }
  }

  drawStatsCard(ctx, config) {
    const colors = this.themeSystem.getThemeColors();
    
    // 卡片背景
    ctx.save();
    ctx.fillStyle = colors.surface;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    this.roundRect(ctx, config.x, config.y, config.width, config.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 标题
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${Math.min(config.width * 0.05, 18)}px "PingFang SC"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, config.x + 15, config.y + 12);
    
    // 统计信息
    ctx.fillStyle = colors.text.primary;
    ctx.font = `${Math.min(config.width * 0.04, 14)}px "PingFang SC"`;
    let textY = config.y + 35;
    config.stats.forEach(stat => {
      ctx.fillText(stat, config.x + 15, textY);
      textY += 18;
    });
    
    ctx.restore();
  }

  drawScoreCard(ctx, config) {
    const colors = this.themeSystem.getThemeColors();
    
    // 卡片背景
    ctx.save();
    ctx.fillStyle = colors.surface;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    this.roundRect(ctx, config.x, config.y, config.width, config.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 标题
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${Math.min(config.width * 0.05, 18)}px "PingFang SC"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, config.x + 15, config.y + 12);
    
    // 成绩信息
    ctx.fillStyle = colors.text.primary;
    ctx.font = `${Math.min(config.width * 0.04, 14)}px "PingFang SC"`;
    const timeText = `最佳时间: ${this.formatTime(config.score.time)}`;
    const errorsText = `错误次数: ${config.score.errors}`;
    
    ctx.fillText(timeText, config.x + 15, config.y + 35);
    ctx.fillText(errorsText, config.x + 15, config.y + 53);
    
    ctx.restore();
  }

  drawCustomScoresSection(ctx, customScores, startY) {
    const w = this.width;
    const colors = this.themeSystem.getThemeColors();
    
    // 自选模式标题
    ctx.save();
    ctx.fillStyle = colors.secondary;
    ctx.font = `bold ${Math.min(w * 0.05, 20)}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('自选模式成绩', w / 2, startY + 20);
    ctx.restore();
    
    let yOffset = startY + 50;
    const cardHeight = 60;
    const cardSpacing = 10;
    
    // 显示各种自选模式成绩
    Object.entries(customScores).forEach(([key, score]) => {
      const modeInfo = this.parseCustomModeKey(key);
      if (modeInfo && yOffset + cardHeight < this.height - 80) {
        this.drawScoreCard(ctx, {
          x: w * 0.1,
          y: yOffset,
          width: w * 0.8,
          height: cardHeight,
          title: modeInfo.displayName,
          score: score
        });
        yOffset += cardHeight + cardSpacing;
      }
    });
  }

  parseCustomModeKey(key) {
    // 解析自选模式键值，如 "custom_10_60" -> "1-10 (1分钟)"
    const parts = key.split('_');
    if (parts.length !== 3 || parts[0] !== 'custom') return null;
    
    const numbers = parts[1] === '10' ? '1-10' : '1-100';
    const timeLimit = parseInt(parts[2]);
    const timeText = timeLimit === 0 ? '自由模式' : `${timeLimit / 60}分钟`;
    
    return {
      displayName: `${numbers} (${timeText})`
    };
  }

  render(screen, data = {}) {
    console.log('UIManager.render被调用, screen:', screen);
    
    this.buttons = [];
    this.currentScreen = screen;
    
    switch (screen) {
      case 'start':
        this.renderStartScreen();
        break;
      case 'customModeSelect':
        this.renderCustomModeSelectScreen();
        break;
      case 'result':
        this.renderResultScreen(data);
        break;
      case 'scores':
        this.renderScoresScreen();
        break;
      // 可以添加更多界面类型
      default:
        console.warn('未知的界面类型:', screen);
        this.renderStartScreen();
        break;
    }
    
    // 更新和渲染动画
    this.updateAnimations();
  }
}

// 导出 UIManager 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}