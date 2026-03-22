/**
 * Tutorial System - 新手引导系统
 * 
 * 功能：
 * - 首次启动引导
 * - 目标提示（闪烁环）
 * - 关卡说明
 * - 帮助界面
 * 
 * 需求: 20.1, 20.2, 20.3, 20.4, 20.5
 */

class TutorialSystem {
  constructor(uiManager, screenAdapter, themeSystem) {
    this.uiManager = uiManager;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    
    // 引导状态
    this.isFirstTime = this.checkFirstTime();
    this.showingTutorial = false;
    this.tutorialStep = 0;
    this.tutorialStartTime = 0;
    
    // 目标提示状态
    this.lastClickTime = Date.now();
    this.showingHint = false;
    this.hintStartTime = 0;
    this.hintBlinkPhase = 0;
    
    // 关卡说明状态
    this.showingLevelExplanation = false;
    this.explanationStartTime = 0;
    
    // 帮助界面状态
    this.showingHelp = false;
    
    // 配置
    this.config = {
      firstTimeDelay: 3000,        // 首次引导显示3秒
      hintDelay: 10000,           // 10秒无操作显示提示
      hintBlinkInterval: 500,     // 提示闪烁间隔
      explanationDelay: 2000,     // 关卡说明显示2秒
      tutorialFontSize: 0.04,     // 教程文字大小（相对屏幕宽度）
      hintRingRadius: 60,         // 提示环半径
      hintRingWidth: 4            // 提示环宽度
    };
  }
  
  /**
   * 检查是否首次启动
   */
  checkFirstTime() {
    try {
      const hasPlayed = tt.getStorageSync({ key: 'has_played_before' });
      return !hasPlayed;
    } catch (error) {
      console.warn('Failed to check first time status:', error);
      return true; // 默认为首次启动
    }
  }
  
  /**
   * 标记已经玩过游戏
   */
  markAsPlayed() {
    try {
      tt.setStorageSync({ 
        key: 'has_played_before', 
        data: true 
      });
      this.isFirstTime = false;
    } catch (error) {
      console.warn('Failed to mark as played:', error);
    }
  }
  
  /**
   * 开始首次启动引导
   */
  startFirstTimeGuide(level = 1) {
    if (!this.isFirstTime) return false;
    
    this.showingTutorial = true;
    this.tutorialStep = level;
    this.tutorialStartTime = Date.now();
    
    console.log(`Starting first-time guide for level ${level}`);
    return true;
  }
  
  /**
   * 更新引导状态
   */
  update() {
    const now = Date.now();
    
    // 更新首次引导
    if (this.showingTutorial) {
      const elapsed = now - this.tutorialStartTime;
      if (elapsed >= this.config.firstTimeDelay) {
        this.showingTutorial = false;
        this.markAsPlayed();
        return { type: 'tutorial_complete', step: this.tutorialStep };
      }
    }
    
    // 更新目标提示
    if (!this.showingTutorial && !this.showingLevelExplanation && !this.showingHelp) {
      const timeSinceLastClick = now - this.lastClickTime;
      if (timeSinceLastClick >= this.config.hintDelay) {
        if (!this.showingHint) {
          this.showingHint = true;
          this.hintStartTime = now;
        }
        
        // 更新闪烁相位
        const hintElapsed = now - this.hintStartTime;
        this.hintBlinkPhase = Math.floor(hintElapsed / this.config.hintBlinkInterval) % 2;
      } else {
        this.showingHint = false;
      }
    }
    
    // 更新关卡说明
    if (this.showingLevelExplanation) {
      const elapsed = now - this.explanationStartTime;
      if (elapsed >= this.config.explanationDelay) {
        this.showingLevelExplanation = false;
        return { type: 'explanation_complete' };
      }
    }
    
    return null;
  }
  
  /**
   * 记录玩家点击（重置提示计时器）
   */
  onPlayerClick() {
    this.lastClickTime = Date.now();
    this.showingHint = false;
  }
  
  /**
   * 显示关卡说明
   */
  showLevelExplanation(fromLevel, toLevel) {
    this.showingLevelExplanation = true;
    this.explanationStartTime = Date.now();
    this.explanationFromLevel = fromLevel;
    this.explanationToLevel = toLevel;
    
    console.log(`Showing level explanation: ${fromLevel} -> ${toLevel}`);
  }
  
  /**
   * 显示自选模式说明
   */
  showCustomModeExplanation() {
    // 检查是否首次进入自选模式
    try {
      const hasSeenCustomMode = tt.getStorageSync({ key: 'has_seen_custom_mode' });
      if (hasSeenCustomMode) return false;
      
      this.showingLevelExplanation = true;
      this.explanationStartTime = Date.now();
      this.explanationFromLevel = 'custom';
      this.explanationToLevel = 'custom';
      
      // 标记已看过自选模式说明
      tt.setStorageSync({ 
        key: 'has_seen_custom_mode', 
        data: true 
      });
      
      return true;
    } catch (error) {
      console.warn('Failed to check custom mode explanation status:', error);
      return false;
    }
  }
  
  /**
   * 显示/隐藏帮助界面
   */
  toggleHelp() {
    this.showingHelp = !this.showingHelp;
    return this.showingHelp;
  }
  
  /**
   * 渲染教程界面
   */
  render(ctx, gameState = null) {
    if (this.showingTutorial) {
      this.renderFirstTimeGuide(ctx);
    }
    
    if (this.showingHint && gameState) {
      this.renderTargetHint(ctx, gameState);
    }
    
    if (this.showingLevelExplanation) {
      this.renderLevelExplanation(ctx);
    }
    
    if (this.showingHelp) {
      this.renderHelpScreen(ctx);
    }
  }
  
  /**
   * 渲染首次启动引导
   */
  renderFirstTimeGuide(ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 半透明背景
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    // 引导卡片
    const cardWidth = width * 0.8;
    const cardHeight = height * 0.4;
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;
    
    // 卡片背景
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 标题
    const titleY = cardY + cardHeight * 0.25;
    ctx.fillStyle = this.themeSystem.getThemeColors().primary;
    ctx.font = `bold ${dims.fontSize * 1.2}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let title, content;
    if (this.tutorialStep === 1) {
      title = '🎯 游戏规则';
      content = '按顺序点击数字 1 到 10\n找到目标数字并点击\n完成后进入下一关';
    } else {
      title = '🚀 准备挑战';
      content = '现在要挑战完整版 1-100！\n保持专注，仔细寻找\n你可以做到的！';
    }
    
    ctx.fillText(title, width / 2, titleY);
    
    // 内容文字
    const contentY = cardY + cardHeight * 0.5;
    ctx.fillStyle = '#333333';
    ctx.font = `${dims.fontSize * 0.8}px "PingFang SC"`;
    
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const lineY = contentY + (index - 1) * dims.fontSize * 1.2;
      ctx.fillText(line, width / 2, lineY);
    });
    
    // 倒计时提示
    const elapsed = Date.now() - this.tutorialStartTime;
    const remaining = Math.ceil((this.config.firstTimeDelay - elapsed) / 1000);
    if (remaining > 0) {
      const countdownY = cardY + cardHeight * 0.85;
      ctx.fillStyle = this.themeSystem.getThemeColors().accent;
      ctx.font = `${dims.fontSize * 0.7}px "PingFang SC"`;
      ctx.fillText(`${remaining} 秒后自动开始`, width / 2, countdownY);
    }
    
    ctx.restore();
  }
  
  /**
   * 渲染目标提示（闪烁环）
   */
  renderTargetHint(ctx, gameState) {
    if (!gameState.cells || !gameState.currentNumber) return;
    
    // 找到目标数字的Cell
    const targetCell = gameState.cells.find(cell => 
      cell.number === gameState.currentNumber && !cell.done
    );
    
    if (!targetCell) return;
    
    ctx.save();
    
    // 闪烁效果
    const opacity = this.hintBlinkPhase === 0 ? 0.8 : 0.3;
    ctx.globalAlpha = opacity;
    
    // 绘制提示环
    ctx.strokeStyle = this.themeSystem.getThemeColors().accent;
    ctx.lineWidth = this.config.hintRingWidth;
    ctx.setLineDash([8, 4]); // 虚线效果
    
    ctx.beginPath();
    ctx.arc(
      targetCell.site.x, 
      targetCell.site.y, 
      this.config.hintRingRadius, 
      0, 
      Math.PI * 2
    );
    ctx.stroke();
    
    // 内圈实线
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.themeSystem.getThemeColors().primary;
    ctx.beginPath();
    ctx.arc(
      targetCell.site.x, 
      targetCell.site.y, 
      this.config.hintRingRadius - 10, 
      0, 
      Math.PI * 2
    );
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 渲染关卡说明
   */
  renderLevelExplanation(ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 半透明背景
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    // 说明卡片
    const cardWidth = width * 0.85;
    const cardHeight = height * 0.3;
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;
    
    // 卡片背景
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 15);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 内容
    let title, content;
    if (this.explanationFromLevel === 1 && this.explanationToLevel === 2) {
      title = '🎉 太棒了！';
      content = '第一关完成！\n\n现在挑战完整版 1-100\n难度飙升！！！';
    } else if (this.explanationFromLevel === 'custom') {
      title = '🎮 自选模式';
      content = '选择练习模式或挑战模式\n可以设置时间限制\n\n自由练习，挑战极限！';
    } else {
      title = '🚀 继续挑战';
      content = '准备好了吗？\n让我们继续游戏！';
    }
    
    // 标题
    const titleY = cardY + cardHeight * 0.3;
    ctx.fillStyle = this.themeSystem.getThemeColors().primary;
    ctx.font = `bold ${dims.fontSize * 1.1}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, width / 2, titleY);
    
    // 内容
    const contentY = cardY + cardHeight * 0.65;
    ctx.fillStyle = '#333333';
    ctx.font = `${dims.fontSize * 0.75}px "PingFang SC"`;
    
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const lineY = contentY + (index - Math.floor(lines.length / 2)) * dims.fontSize * 1.1;
      ctx.fillText(line, width / 2, lineY);
    });
    
    ctx.restore();
  }
  
  /**
   * 渲染帮助界面
   */
  renderHelpScreen(ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 背景
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, width, height);
    
    // 帮助卡片
    const cardWidth = width * 0.9;
    const cardHeight = height * 0.8;
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;
    
    // 卡片背景
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 标题
    const titleY = cardY + dims.fontSize * 2;
    ctx.fillStyle = this.themeSystem.getThemeColors().primary;
    ctx.font = `bold ${dims.fontSize * 1.3}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯 游戏帮助', width / 2, titleY);
    
    // 帮助内容
    const helpContent = [
      '📋 游戏规则',
      '• 按顺序点击数字 1 到 100',
      '• 找到当前目标数字并点击',
      '• 点击错误会增加错误计数',
      '',
      '🎮 游戏模式',
      '• 第一关：1-10 数字练习',
      '• 第二关：1-100 完整挑战',
      '• 自选模式：通关后解锁',
      '',
      '⏱️ 时间模式',
      '• 自由模式：无时间限制',
      '• 限时模式：1/2/3 分钟挑战',
      '',
      '💡 游戏技巧',
      '• 保持专注，仔细观察',
      '• 记住已点击的区域',
      '• 利用数字分布规律'
    ];
    
    // 渲染帮助内容
    let currentY = titleY + dims.fontSize * 2;
    ctx.font = `${dims.fontSize * 0.65}px "PingFang SC"`;
    ctx.textAlign = 'left';
    
    helpContent.forEach(line => {
      if (line === '') {
        currentY += dims.fontSize * 0.8;
        return;
      }
      
      if (line.startsWith('📋') || line.startsWith('🎮') || 
          line.startsWith('⏱️') || line.startsWith('💡')) {
        // 章节标题
        ctx.fillStyle = this.themeSystem.getThemeColors().secondary;
        ctx.font = `bold ${dims.fontSize * 0.75}px "PingFang SC"`;
        currentY += dims.fontSize * 1.2;
      } else {
        // 普通内容
        ctx.fillStyle = '#333333';
        ctx.font = `${dims.fontSize * 0.65}px "PingFang SC"`;
        currentY += dims.fontSize * 1;
      }
      
      const textX = cardX + cardWidth * 0.1;
      ctx.fillText(line, textX, currentY);
    });
    
    // 关闭按钮
    const closeButtonY = cardY + cardHeight - dims.fontSize * 2;
    ctx.fillStyle = this.themeSystem.getThemeColors().primary;
    ctx.font = `bold ${dims.fontSize}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.fillText('点击任意位置关闭', width / 2, closeButtonY);
    
    ctx.restore();
  }
  
  /**
   * 处理点击事件
   */
  handleClick(x, y) {
    if (this.showingHelp) {
      this.showingHelp = false;
      return { type: 'help_closed' };
    }
    
    if (this.showingTutorial) {
      // 点击可以跳过教程
      this.showingTutorial = false;
      this.markAsPlayed();
      return { type: 'tutorial_skipped', step: this.tutorialStep };
    }
    
    if (this.showingLevelExplanation) {
      // 点击可以跳过说明
      this.showingLevelExplanation = false;
      return { type: 'explanation_skipped' };
    }
    
    return null;
  }
  
  /**
   * 获取当前状态
   */
  getState() {
    return {
      isFirstTime: this.isFirstTime,
      showingTutorial: this.showingTutorial,
      showingHint: this.showingHint,
      showingLevelExplanation: this.showingLevelExplanation,
      showingHelp: this.showingHelp
    };
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
}

module.exports = TutorialSystem;